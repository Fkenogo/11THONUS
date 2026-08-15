/**
 * `ENG-P2-004C` — permission audit service core behavior tests.
 *
 * Written before `permissionAuditService.ts` exists (Phase M genuine RED
 * evidence). Uses a minimal recording `Transaction` mock — no Firestore
 * emulator (see `permissionAuditService.emulator.test.ts` for real
 * persistence proof). Every case maps to a row in
 * `docs/05-implementation/reports/ENG-P2-004C-test-matrix-2026-08-15.md`.
 */

import { describe, it, expect, vi } from "vitest";
import {
  recordSensitiveDecision,
  recordSensitiveDecisionStandalone,
} from "./permissionAuditService";
import type { AuthorizationDecision, AuthorizationRequest } from "../evaluator/types";
import type { Firestore, Transaction } from "firebase-admin/firestore";

const FIXED_NOW = new Date("2026-08-15T00:00:00.000Z");

function decision(overrides: Partial<AuthorizationDecision> = {}): AuthorizationDecision {
  return {
    allowed: true,
    reasonCode: "OWNER_FLOOR",
    role: "owner",
    permissionSource: "owner-floor",
    evaluatedAt: FIXED_NOW,
    ...overrides,
  };
}

function request(overrides: Partial<AuthorizationRequest> = {}): AuthorizationRequest {
  return {
    userId: "user-1",
    businessId: "biz-a",
    permission: "staff.manage",
    ...overrides,
  };
}

function mockTransaction(existing: { exists: boolean; data?: unknown } = { exists: false }) {
  const sets: Array<{ ref: unknown; data: unknown }> = [];
  const transaction = {
    set: vi.fn((ref: unknown, data: unknown) => {
      sets.push({ ref, data });
    }),
    get: vi.fn().mockResolvedValue(existing),
  } as unknown as Transaction;
  return { transaction, sets };
}

function mockDb(): Firestore {
  const docRef = { id: "mock-doc" };
  const collection = { doc: vi.fn(() => docRef) };
  return { collection: vi.fn(() => collection) } as unknown as Firestore;
}

describe("recordSensitiveDecision — A/B: sensitive allow & deny", () => {
  it("records a sensitive allow decision", async () => {
    const { transaction, sets } = mockTransaction();
    const outcome = await recordSensitiveDecision(
      transaction,
      mockDb(),
      { decision: decision({ allowed: true }), request: request(), idempotencyKey: "key-1" },
      FIXED_NOW,
    );
    expect(outcome).toEqual({ recorded: true, written: true, eventId: expect.any(String) });
    expect(sets).toHaveLength(1);
    const payload = (sets[0]!.data as { event: { payload: Record<string, unknown> } }).event
      .payload;
    expect(payload["result"]).toBe("allow");
  });

  it("records a sensitive deny decision", async () => {
    const { transaction, sets } = mockTransaction();
    const outcome = await recordSensitiveDecision(
      transaction,
      mockDb(),
      {
        decision: decision({
          allowed: false,
          reasonCode: "SENSITIVE_PERMISSION_NOT_GRANTED",
          role: "manager",
        }),
        request: request(),
        idempotencyKey: "key-2",
      },
      FIXED_NOW,
    );
    expect(outcome.recorded).toBe(true);
    const payload = (sets[0]!.data as { event: { payload: Record<string, unknown> } }).event
      .payload;
    expect(payload["result"]).toBe("deny");
    expect(payload["reasonCode"]).toBe("SENSITIVE_PERMISSION_NOT_GRANTED");
  });

  it("payload contains only the governed field set — no forbidden fields", async () => {
    const { transaction, sets } = mockTransaction();
    await recordSensitiveDecision(
      transaction,
      mockDb(),
      { decision: decision(), request: request(), idempotencyKey: "key-3" },
      FIXED_NOW,
    );
    const payload = (sets[0]!.data as { event: { payload: Record<string, unknown> } }).event
      .payload;
    const allowedKeys = new Set([
      "actorUserId",
      "businessId",
      "membershipId",
      "permission",
      "result",
      "decisionSource",
      "effectiveRole",
      "reasonCode",
      "privacyClassification",
      "schemaVersion",
    ]);
    for (const key of Object.keys(payload)) {
      expect(allowedKeys.has(key)).toBe(true);
    }
    expect(payload["privacyClassification"]).toBe("class_2_internal_operational");
  });
});

describe("recordSensitiveDecision — C/D: explicit revocation & role-ineligible grant", () => {
  it("audits an explicit-revocation deny", async () => {
    const { transaction, sets } = mockTransaction();
    await recordSensitiveDecision(
      transaction,
      mockDb(),
      {
        decision: decision({ allowed: false, reasonCode: "EXPLICIT_REVOCATION", role: "manager" }),
        request: request(),
        idempotencyKey: "key-4",
      },
      FIXED_NOW,
    );
    const payload = (sets[0]!.data as { event: { payload: Record<string, unknown> } }).event
      .payload;
    expect(payload["decisionSource"]).toBe("explicit-revocation");
  });

  it("audits a GRANT_NOT_HONORED deny (004B pass-5 role-ineligible grant fix)", async () => {
    const { transaction, sets } = mockTransaction();
    await recordSensitiveDecision(
      transaction,
      mockDb(),
      {
        decision: decision({ allowed: false, reasonCode: "GRANT_NOT_HONORED", role: "manager" }),
        request: request(),
        idempotencyKey: "key-5",
      },
      FIXED_NOW,
    );
    expect(sets).toHaveLength(1);
  });
});

describe("recordSensitiveDecision — E: server-integrity fail-closed", () => {
  it("audits a BUSINESS_CONFIG_MALFORMED deny without any raw malformed-data field", async () => {
    const { transaction, sets } = mockTransaction();
    await recordSensitiveDecision(
      transaction,
      mockDb(),
      {
        decision: decision({
          allowed: false,
          reasonCode: "BUSINESS_CONFIG_MALFORMED",
          role: undefined,
        }),
        request: request(),
        idempotencyKey: "key-6",
      },
      FIXED_NOW,
    );
    const payload = (sets[0]!.data as { event: { payload: Record<string, unknown> } }).event
      .payload;
    expect(payload["reasonCode"]).toBe("BUSINESS_CONFIG_MALFORMED");
    expect(Object.keys(payload)).not.toContain("rawDocument");
    expect(Object.keys(payload)).not.toContain("malformedData");
  });
});

describe("recordSensitiveDecision — F: non-sensitive decision is never audited", () => {
  it("does not write an outbox entry for a non-sensitive permission", async () => {
    const { transaction, sets } = mockTransaction();
    const outcome = await recordSensitiveDecision(
      transaction,
      mockDb(),
      {
        decision: decision({ allowed: true, reasonCode: "ROLE_DEFAULT_ALLOW", role: "manager" }),
        request: request({ permission: "customer.lookupByLoyaltyNumber" }),
        idempotencyKey: "key-7",
      },
      FIXED_NOW,
    );
    expect(outcome).toEqual({ recorded: false });
    expect(sets).toHaveLength(0);
  });
});

describe("recordSensitiveDecision — I: different decisions produce distinct events", () => {
  it("two different idempotency-key inputs yield two distinct eventIds", async () => {
    const { transaction: t1, sets: s1 } = mockTransaction();
    const { transaction: t2, sets: s2 } = mockTransaction();
    await recordSensitiveDecision(
      t1,
      mockDb(),
      { decision: decision(), request: request(), idempotencyKey: "key-A" },
      FIXED_NOW,
    );
    await recordSensitiveDecision(
      t2,
      mockDb(),
      { decision: decision(), request: request(), idempotencyKey: "key-B" },
      FIXED_NOW,
    );
    const eventIdA = (s1[0]!.data as { event: { eventId: string } }).event.eventId;
    const eventIdB = (s2[0]!.data as { event: { eventId: string } }).event.eventId;
    expect(eventIdA).not.toBe(eventIdB);
  });

  it("the same idempotency-key input yields the same eventId across separate calls (retry-stable)", async () => {
    const { transaction: t1, sets: s1 } = mockTransaction();
    const { transaction: t2, sets: s2 } = mockTransaction();
    await recordSensitiveDecision(
      t1,
      mockDb(),
      { decision: decision(), request: request(), idempotencyKey: "key-same" },
      FIXED_NOW,
    );
    await recordSensitiveDecision(
      t2,
      mockDb(),
      { decision: decision(), request: request(), idempotencyKey: "key-same" },
      FIXED_NOW,
    );
    const eventIdA = (s1[0]!.data as { event: { eventId: string } }).event.eventId;
    const eventIdB = (s2[0]!.data as { event: { eventId: string } }).event.eventId;
    expect(eventIdA).toBe(eventIdB);
  });
});

describe("recordSensitiveDecision — J: existence-guarded write (Phase D/J transaction-boundary review)", () => {
  it("does not call transaction.set when an entry for this eventId already exists (no reset of a processing/completed entry)", async () => {
    const { transaction, sets } = mockTransaction({ exists: true });
    const outcome = await recordSensitiveDecision(
      transaction,
      mockDb(),
      { decision: decision(), request: request(), idempotencyKey: "key-existing" },
      FIXED_NOW,
    );
    expect(outcome).toEqual({ recorded: true, written: false, eventId: expect.any(String) });
    expect(sets).toHaveLength(0);
  });

  it("calls transaction.get before transaction.set (reads precede writes, Firestore transaction requirement)", async () => {
    const { transaction, sets } = mockTransaction({ exists: false });
    const calls: string[] = [];
    (transaction.get as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      calls.push("get");
      return { exists: false };
    });
    (transaction.set as ReturnType<typeof vi.fn>).mockImplementation(
      (ref: unknown, data: unknown) => {
        calls.push("set");
        sets.push({ ref, data });
      },
    );
    await recordSensitiveDecision(
      transaction,
      mockDb(),
      { decision: decision(), request: request(), idempotencyKey: "key-order" },
      FIXED_NOW,
    );
    expect(calls).toEqual(["get", "set"]);
  });
});

describe("recordSensitiveDecision — adversarial: no accountable identity", () => {
  it("does not audit when request.userId is blank — no identity to attribute the record to", async () => {
    const { transaction, sets } = mockTransaction();
    const outcome = await recordSensitiveDecision(
      transaction,
      mockDb(),
      { decision: decision(), request: request({ userId: "" }), idempotencyKey: "key-8" },
      FIXED_NOW,
    );
    expect(outcome).toEqual({ recorded: false });
    expect(sets).toHaveLength(0);
  });
});

describe("recordSensitiveDecision — adversarial: caller-supplied sensitivity is never trusted", () => {
  it("re-checks isSensitivePermission itself rather than trusting any caller assertion — non-sensitive permission is never audited regardless of decision content", async () => {
    const { transaction, sets } = mockTransaction();
    await recordSensitiveDecision(
      transaction,
      mockDb(),
      {
        decision: decision({ allowed: false }),
        request: request({ permission: "purchase.record" }),
        idempotencyKey: "key-9",
      },
      FIXED_NOW,
    );
    expect(sets).toHaveLength(0);
  });
});

describe("recordSensitiveDecision — adversarial: forged/inconsistent decision object", () => {
  it("does not crash or fabricate fields for a structurally inconsistent AuthorizationDecision (allowed:true with errorCategory set)", async () => {
    const { transaction, sets } = mockTransaction();
    const forged = decision({
      allowed: true,
      errorCategory: "AUTH_FORBIDDEN",
    } as unknown as Partial<AuthorizationDecision>);
    await recordSensitiveDecision(
      transaction,
      mockDb(),
      { decision: forged, request: request(), idempotencyKey: "key-forged" },
      FIXED_NOW,
    );
    const payload = (sets[0]!.data as { event: { payload: Record<string, unknown> } }).event
      .payload;
    // Records exactly what the decision said (allowed:true → result:"allow"),
    // never infers/fabricates a different result from the inconsistent
    // errorCategory field — the service is not a decision re-validator.
    expect(payload["result"]).toBe("allow");
  });
});

describe("recordSensitiveDecisionStandalone — L: 004D-composable core, test-only standalone wrapper", () => {
  it("is an async function usable without a caller-supplied transaction (test-only convenience)", async () => {
    const collectionRef = {
      doc: vi.fn(() => ({ id: "mock" })),
    };
    const db = {
      collection: vi.fn(() => collectionRef),
      runTransaction: vi.fn(async (fn: (t: Transaction) => Promise<unknown>) => {
        const { transaction } = mockTransaction({ exists: false });
        return fn(transaction);
      }),
    } as unknown as Firestore;

    const outcome = await recordSensitiveDecisionStandalone(db, {
      decision: decision(),
      request: request(),
      idempotencyKey: "key-standalone",
    });
    expect(outcome.recorded).toBe(true);
  });
});
