/**
 * AUTH-06 — identity-recovery credential-proof orchestration against the real
 * Firebase Emulator Suite. Proves the end-to-end recovery lifecycle through the
 * *actual* merged `-09` resolution, `-07` recovery boundary, and `-06`
 * state-machine (not mocks):
 *
 *   - proving a still-controlled provider on a SUSPENDED identity recovers it to
 *     `active`, emitting `IdentityRecovered`;
 *   - the recovery target is DERIVED from the proof: proving B's provider
 *     recovers B only — a co-suspended A is untouched (no cross-account recovery);
 *   - a google_sign_in proof maps to the `linked_provider` method category;
 *   - a credential resolving to no identity fails closed (`RESOURCE_NOT_FOUND`)
 *     with no state change;
 *   - a retry with the same idempotency key recovers exactly once (idempotent),
 *     emitting a single `IdentityRecovered`;
 *   - proving a provider on an ACTIVE identity is refused by `-06`
 *     (recovery-not-permitted) with no state change.
 *
 * Not run under `pnpm test` — see `pnpm test:emulator` / `pnpm emulators:validate`.
 */

import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { registerOrSignIn, type RegistrationSignInCommand } from "./registrationSignInService";
import {
  recoverAuthenticatedIdentity,
  type IdentityRecoveryCommand,
  type IdentityRecoveryEnvelope,
} from "./identityRecoveryService";
import { createAuthenticatedCredential } from "../models/authenticatedCredential";
import { AuthenticationDomainError } from "../models/authenticationErrors";
import type { AuthenticationReferenceType } from "../../identity/models/authenticationReference";
import type { EventActor } from "../../../shared/events/domainEvent";
import { transitionCustomerIdentityStatus } from "../../identity/repositories/identityLifecycleRepository";
import { getCustomerIdentityById } from "../../identity/repositories/customerIdentityRepository";

const app = initializeApp({ projectId: "demo-11thonus" }, "identityRecoveryServiceEmulatorTest");
const db = getFirestore(app);

const actor: EventActor = { actorType: "system", actorId: "system" };
const at = new Date("2026-08-10T12:00:00.000Z");

/** The merged `-06` recovery audit-trail event type (`<domain>.<event>.v<n>`, TRD11 §11.9). */
const RECOVERED_EVENT = "identity.identity_recovered.v1";

function credential(referenceType: AuthenticationReferenceType, referenceId: string) {
  return createAuthenticatedCredential({
    referenceType,
    referenceId,
    verifiedAt: at,
    providerSignals: { signInProvider: referenceType },
  });
}

function envelope(suffix: string): IdentityRecoveryEnvelope {
  return {
    eventId: `evt_auth06_${suffix}`,
    correlationId: `corr_auth06_${suffix}`,
    actor,
    occurredAt: at.toISOString(),
  };
}

function recoverCommand(
  idempotencyKey: string,
  proofReference = `authrec:proof_${idempotencyKey}`,
): IdentityRecoveryCommand {
  return { idempotencyKey, requestedAt: at, proofReference };
}

function regCommand(idempotencyKey: string): RegistrationSignInCommand {
  return { idempotencyKey, requestHash: `reg_${idempotencyKey}`, issuedAt: at };
}

/** Register an identity for `{referenceType}:{authUid}`, returning its id. */
async function register(
  referenceType: AuthenticationReferenceType,
  authUid: string,
  customerIdentityId: string,
): Promise<void> {
  await registerOrSignIn(
    db,
    credential(referenceType, authUid),
    envelope(`reg_${authUid}`),
    regCommand(`reg_${authUid}`),
    {
      generateCustomerIdentityId: () => customerIdentityId,
    },
  );
}

async function suspend(customerIdentityId: string, keySuffix: string): Promise<void> {
  await transitionCustomerIdentityStatus(db, {
    eventId: `evt_suspend_${keySuffix}`,
    correlationId: `corr_suspend_${keySuffix}`,
    actor,
    occurredAt: at.toISOString(),
    customerIdentityId,
    toStatus: "suspended",
    authority: "administrator_initiated",
    reason: "administrative_suspension",
    updatedAt: at,
    updatedBy: "admin_1",
    idempotencyKey: `suspend_${keySuffix}`,
    requestHash: `hash_suspend_${keySuffix}`,
  });
}

async function statusOf(customerIdentityId: string): Promise<string> {
  return (await getCustomerIdentityById(db, customerIdentityId)).status;
}

async function outboxEventTypes(): Promise<string[]> {
  const snapshot = await db.collection("outboxEntries").get();
  return snapshot.docs.map((doc) =>
    String((doc.data()["event"] as { eventType?: unknown })?.eventType ?? ""),
  );
}

afterAll(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

beforeAll(async () => {
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite. Run via `pnpm emulators:validate` or `pnpm test:emulator` inside `firebase emulators:exec`.",
    );
  }
  await db.collection("users").limit(1).get();
}, 30000);

beforeEach(async () => {
  for (const collection of [
    "users",
    "customerProfiles",
    "loyaltyNumbers",
    "qrIdentityRecords",
    "authenticationReferences",
    "recoveryProofReferences",
    "idempotencyRecords",
    "outboxEntries",
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

describe("AUTH-06 — identity recovery credential proof (emulator)", () => {
  it("recovers a suspended identity by proving a still-controlled phone provider", async () => {
    await register("phone_otp", "uid_a", "cust_a");
    await suspend("cust_a", "a");
    expect(await statusOf("cust_a")).toBe("suspended");

    const outcome = await recoverAuthenticatedIdentity(
      db,
      credential("phone_otp", "uid_a"),
      envelope("a"),
      recoverCommand("recover_a"),
    );

    expect(outcome).toEqual({
      operation: "recovered",
      customerIdentityId: "cust_a",
      methodCategory: "phone_otp",
    });
    expect(await statusOf("cust_a")).toBe("active");
    expect(await outboxEventTypes()).toContain(RECOVERED_EVENT);
  });

  it("maps a google_sign_in proof to the linked_provider method category", async () => {
    await register("google_sign_in", "uid_g", "cust_g");
    await suspend("cust_g", "g");

    const outcome = await recoverAuthenticatedIdentity(
      db,
      credential("google_sign_in", "uid_g"),
      envelope("g"),
      recoverCommand("recover_g"),
    );

    expect(outcome.methodCategory).toBe("linked_provider");
    expect(await statusOf("cust_g")).toBe("active");
  });

  it("derives the target from the proof: proving B recovers B, never a co-suspended A", async () => {
    await register("phone_otp", "uid_a2", "cust_a2");
    await register("phone_otp", "uid_b2", "cust_b2");
    await suspend("cust_a2", "a2");
    await suspend("cust_b2", "b2");

    await recoverAuthenticatedIdentity(
      db,
      credential("phone_otp", "uid_b2"),
      envelope("b2"),
      recoverCommand("recover_b2"),
    );

    expect(await statusOf("cust_b2")).toBe("active");
    expect(await statusOf("cust_a2")).toBe("suspended");
  });

  it("fails closed (RESOURCE_NOT_FOUND) when the credential resolves to no identity", async () => {
    await expect(
      recoverAuthenticatedIdentity(
        db,
        credential("phone_otp", "uid_ghost"),
        envelope("ghost"),
        recoverCommand("recover_ghost"),
      ),
    ).rejects.toMatchObject({
      constructor: AuthenticationDomainError,
      category: "RESOURCE_NOT_FOUND",
    });

    expect(await outboxEventTypes()).not.toContain(RECOVERED_EVENT);
  });

  it("recovers exactly once across a same-key retry (idempotent), one IdentityRecovered", async () => {
    await register("phone_otp", "uid_r", "cust_r");
    await suspend("cust_r", "r");

    const first = await recoverAuthenticatedIdentity(
      db,
      credential("phone_otp", "uid_r"),
      envelope("r"),
      recoverCommand("recover_r"),
    );
    const second = await recoverAuthenticatedIdentity(
      db,
      credential("phone_otp", "uid_r"),
      envelope("r"),
      recoverCommand("recover_r"),
    );

    expect(first.customerIdentityId).toBe("cust_r");
    expect(second.customerIdentityId).toBe("cust_r");
    expect(await statusOf("cust_r")).toBe("active");
    const recoveredEvents = (await outboxEventTypes()).filter((t) => t === RECOVERED_EVENT);
    expect(recoveredEvents).toHaveLength(1);
  });

  it("refuses to recover an ACTIVE identity (-06 recovery-not-permitted), no state change", async () => {
    await register("phone_otp", "uid_act", "cust_act");
    expect(await statusOf("cust_act")).toBe("active");

    await expect(
      recoverAuthenticatedIdentity(
        db,
        credential("phone_otp", "uid_act"),
        envelope("act"),
        recoverCommand("recover_act"),
      ),
    ).rejects.toBeInstanceOf(Error);

    expect(await statusOf("cust_act")).toBe("active");
    expect(await outboxEventTypes()).not.toContain(RECOVERED_EVENT);
  });

  it("rejects a replay of the same captured proof after a later re-suspension (proof-reuse protection)", async () => {
    await register("phone_otp", "uid_x", "cust_x");
    await suspend("cust_x", "x1");

    // The same captured proof is modelled by a single stable, token-bound proof
    // reference (what the endpoint derives from one verified token).
    const capturedProofRef = "authrec:captured_token_x_digest";

    // First recovery with the captured proof succeeds.
    await recoverAuthenticatedIdentity(
      db,
      credential("phone_otp", "uid_x"),
      envelope("x1"),
      recoverCommand("recover_x1", capturedProofRef),
    );
    expect(await statusOf("cust_x")).toBe("active");

    // Admin re-suspends the identity.
    await suspend("cust_x", "x2");

    // Replaying the SAME captured proof (same proof reference) with a NEW
    // idempotency key is refused by `-07`'s proof-reuse protection — the attack
    // (one captured proof repeatedly undoing later suspensions) is closed.
    await expect(
      recoverAuthenticatedIdentity(
        db,
        credential("phone_otp", "uid_x"),
        envelope("x2"),
        recoverCommand("recover_x2", capturedProofRef),
      ),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });

    expect(await statusOf("cust_x")).toBe("suspended");
  });
});
