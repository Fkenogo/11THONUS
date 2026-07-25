import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { CommandEnvelope } from "./commandEnvelope";
import { DomainCommandError, dispatchCommand } from "./commandDispatcher";

// Real end-to-end command round trip against the Firebase Emulator
// Suite: authenticate → validate → idempotency check/reserve → handler →
// log → respond, exactly as the Engineering Implementation Programme's
// own "Required Validation" cell for ENG-P1-002 asks for. Not run as
// part of `pnpm test` — see `pnpm test:emulator`.

const app = initializeApp({ projectId: "demo-11thonus" }, "commandDispatcherEmulatorTest");
const db = getFirestore(app);
const auth = { uid: "trusted-uid" };

beforeAll(() => {
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite. Run via `pnpm emulators:validate` or `pnpm test:emulator` inside `firebase emulators:exec`.",
    );
  }
});

afterAll(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

beforeEach(async () => {
  const snapshot = await db.collection("idempotencyRecords").get();
  await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
});

function makeEnvelope(idempotencyKey: string, amount: number): CommandEnvelope<{ amount: number }> {
  return {
    commandId: `cmd-${idempotencyKey}`,
    commandType: "purchase.recordPurchase.v1",
    commandVersion: 1,
    idempotencyKey,
    actor: { userId: "attacker-supplied", authUid: "attacker-supplied" },
    correlationId: "corr-1",
    payload: { amount },
  };
}

describe("dispatchCommand — real command round trip", () => {
  it("authenticates, validates, executes the handler once, and returns its result", async () => {
    let handlerCalls = 0;

    const result = await dispatchCommand({
      db,
      rawEnvelope: makeEnvelope("key-round-trip", 100),
      auth,
      domain: "purchase",
      service: "recordPurchase",
      operation: "dispatch",
      handler: async (payload, actor) => {
        handlerCalls += 1;
        expect(actor.userId).toBe("trusted-uid");
        return { purchaseId: "p-1", amount: payload.amount };
      },
    });

    expect(handlerCalls).toBe(1);
    expect(result).toEqual({
      outcome: "success",
      result: { purchaseId: "p-1", amount: 100 },
      fromCache: false,
    });
  });

  it("returns the cached result and does not re-invoke the handler for a repeated identical request", async () => {
    const envelope = makeEnvelope("key-idempotent", 200);
    let handlerCalls = 0;
    const handler = async (payload: { amount: number }) => {
      handlerCalls += 1;
      return { purchaseId: "p-2", amount: payload.amount };
    };

    const first = await dispatchCommand({
      db,
      rawEnvelope: envelope,
      auth,
      domain: "purchase",
      service: "s",
      operation: "o",
      handler,
    });
    const second = await dispatchCommand({
      db,
      rawEnvelope: envelope,
      auth,
      domain: "purchase",
      service: "s",
      operation: "o",
      handler,
    });

    expect(handlerCalls).toBe(1);
    expect(first).toEqual({
      outcome: "success",
      result: { purchaseId: "p-2", amount: 200 },
      fromCache: false,
    });
    expect(second).toEqual({
      outcome: "success",
      result: { purchaseId: "p-2", amount: 200 },
      fromCache: true,
    });
  });

  it("rejects a reused idempotency key with different payload content as IDEMPOTENCY_CONFLICT", async () => {
    const handler = async (payload: { amount: number }) => ({
      purchaseId: "p-3",
      amount: payload.amount,
    });

    await dispatchCommand({
      db,
      rawEnvelope: makeEnvelope("key-conflict", 300),
      auth,
      domain: "purchase",
      service: "s",
      operation: "o",
      handler,
    });
    const conflictResult = await dispatchCommand({
      db,
      rawEnvelope: makeEnvelope("key-conflict", 999),
      auth,
      domain: "purchase",
      service: "s",
      operation: "o",
      handler,
    });

    expect(conflictResult).toEqual({
      outcome: "error",
      error: expect.objectContaining({ code: "IDEMPOTENCY_CONFLICT" }),
    });
  });

  it("translates a DomainCommandError from the handler into the matching PlatformErrorResponse", async () => {
    const result = await dispatchCommand({
      db,
      rawEnvelope: makeEnvelope("key-domain-error", 400),
      auth,
      domain: "purchase",
      service: "s",
      operation: "o",
      handler: async () => {
        throw new DomainCommandError(
          "REWARD_NOT_AVAILABLE",
          "the requested reward is no longer available",
        );
      },
    });

    expect(result).toEqual({
      outcome: "error",
      error: expect.objectContaining({ code: "REWARD_NOT_AVAILABLE" }),
    });
  });
});

describe("dispatchCommand — concurrent-worker safety (ENG-P1-002-CR1)", () => {
  it("two simultaneous commands with the same idempotency key execute the handler exactly once", async () => {
    let handlerCalls = 0;
    const dispatchOnce = () =>
      dispatchCommand({
        db,
        rawEnvelope: makeEnvelope("key-concurrent", 500),
        auth,
        domain: "purchase",
        service: "s",
        operation: "o",
        handler: async (payload) => {
          handlerCalls += 1;
          return { purchaseId: "p-concurrent", amount: payload.amount };
        },
      });

    const [first, second] = await Promise.all([dispatchOnce(), dispatchOnce()]);

    expect(handlerCalls).toBe(1);

    // Whichever call loses the race must not fabricate a success from an
    // absent response — it either legitimately replays the winner's cached
    // result (if it observed the record after completion) or returns a
    // retryable TEMPORARY_UNAVAILABLE error (if it observed the record
    // while still "processing"). It must never be a bare, undefined result.
    for (const result of [first, second]) {
      if (result.outcome === "success") {
        expect(result.result).toEqual({ purchaseId: "p-concurrent", amount: 500 });
      } else {
        expect(result.error.code).toBe("TEMPORARY_UNAVAILABLE");
        expect(result.error.retryable).toBe(true);
      }
    }

    expect([first.outcome, second.outcome]).toContain("success");
  });
});
