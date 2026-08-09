/**
 * AUTH-05 — account-linking orchestration against the real Firebase Emulator
 * Suite. Proves the end-to-end link/unlink lifecycle through the *actual* merged
 * `-08` transaction and `-09` resolution (not mocks):
 *
 *   - link a second provider onto a registered identity → authoritative
 *     `authenticationReferences/{type}:{id}` doc created, owned by that identity,
 *     `AuthenticationReferenceLinked` emitted;
 *   - unlink it → status `unlinked`, the identity's other reference untouched;
 *   - a new reference already owned by a DIFFERENT identity → fail closed,
 *     `AuthenticationReferenceConflictDetected` committed, no merge/transfer;
 *   - the last remaining reference cannot be unlinked (history-preserving
 *     invariant);
 *   - same-identity safety: acting as A, a reference owned by B is not-found
 *     (never mutated), because the mutation always targets the RESOLVED acting
 *     identity;
 *   - an acting credential that resolves to no identity fails closed with no write.
 *
 * Not run under `pnpm test` — see `pnpm test:emulator` / `pnpm emulators:validate`.
 */

import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { registerOrSignIn, type RegistrationSignInCommand } from "./registrationSignInService";
import {
  linkAuthenticationProvider,
  unlinkAuthenticationProvider,
  type AccountLinkingCommand,
  type AccountLinkingEnvelope,
} from "./accountLinkingService";
import { createAuthenticatedCredential } from "../models/authenticatedCredential";
import type { AuthenticationReferenceType } from "../../identity/models/authenticationReference";
import type { EventActor } from "../../../shared/events/domainEvent";
import { lookupCustomerIdentityByAuthenticationReference } from "../../identity/repositories/identityLookupRepository";

const app = initializeApp({ projectId: "demo-11thonus" }, "accountLinkingServiceEmulatorTest");
const db = getFirestore(app);

const actor: EventActor = { actorType: "system", actorId: "system" };
const at = new Date("2026-08-09T12:00:00.000Z");

function credential(referenceType: AuthenticationReferenceType, referenceId: string) {
  return createAuthenticatedCredential({
    referenceType,
    referenceId,
    verifiedAt: at,
    providerSignals: { signInProvider: referenceType },
  });
}

function envelope(suffix: string): AccountLinkingEnvelope {
  return {
    eventId: `evt_auth05_${suffix}`,
    correlationId: `corr_auth05_${suffix}`,
    actor,
    occurredAt: at.toISOString(),
  };
}

function linkCommand(idempotencyKey: string): AccountLinkingCommand {
  return { idempotencyKey, requestedAt: at };
}

function regCommand(idempotencyKey: string): RegistrationSignInCommand {
  return { idempotencyKey, requestHash: `reg_${idempotencyKey}`, issuedAt: at };
}

/** Register an identity for `phone_otp:{authUid}`, returning its id. */
async function register(authUid: string, customerIdentityId: string): Promise<void> {
  await registerOrSignIn(
    db,
    credential("phone_otp", authUid),
    envelope(`reg_${authUid}`),
    regCommand(`reg_${authUid}`),
    {
      generateCustomerIdentityId: () => customerIdentityId,
    },
  );
}

async function refDoc(referenceType: AuthenticationReferenceType, referenceId: string) {
  return (
    await db.collection("authenticationReferences").doc(`${referenceType}:${referenceId}`).get()
  ).data();
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
    "idempotencyRecords",
    "outboxEntries",
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

describe("AUTH-05 — account linking (emulator)", () => {
  it("links a second provider onto the acting identity and makes it authoritative", async () => {
    await register("phone_A", "cust_A");

    const outcome = await linkAuthenticationProvider(
      db,
      credential("phone_otp", "phone_A"),
      credential("google_sign_in", "google_A"),
      envelope("link1"),
      linkCommand("link_key_1"),
    );

    expect(outcome).toEqual({
      operation: "linked",
      customerIdentityId: "cust_A",
      reference: { referenceType: "google_sign_in", referenceId: "google_A" },
    });
    const linked = await refDoc("google_sign_in", "google_A");
    expect(linked?.["customerIdentityId"]).toBe("cust_A");
    expect(linked?.["status"]).toBe("linked");
    expect(await outboxEventTypes()).toContain("identity.authentication_reference_linked.v1");
  });

  it("unlinks a non-final provider, leaving the identity's other reference intact", async () => {
    await register("phone_B", "cust_B");
    await linkAuthenticationProvider(
      db,
      credential("phone_otp", "phone_B"),
      credential("google_sign_in", "google_B"),
      envelope("link2"),
      linkCommand("link_key_2"),
    );

    const outcome = await unlinkAuthenticationProvider(
      db,
      credential("phone_otp", "phone_B"),
      { referenceType: "google_sign_in", referenceId: "google_B" },
      envelope("unlink2"),
      linkCommand("unlink_key_2"),
    );

    expect(outcome.operation).toBe("unlinked");
    expect((await refDoc("google_sign_in", "google_B"))?.["status"]).toBe("unlinked");
    // The original phone reference is still linked.
    expect((await refDoc("phone_otp", "phone_B"))?.["status"]).toBe("linked");
    expect(await outboxEventTypes()).toContain("identity.authentication_reference_unlinked.v1");
  });

  it("fails closed on a cross-identity conflict and never merges (conflict event committed)", async () => {
    await register("phone_C", "cust_C");
    await register("phone_D", "cust_D");
    // The shared google reference is first linked to D.
    await linkAuthenticationProvider(
      db,
      credential("phone_otp", "phone_D"),
      credential("google_sign_in", "google_shared"),
      envelope("linkD"),
      linkCommand("link_key_D"),
    );

    // C attempts to link the same google reference → fail closed, no transfer.
    await expect(
      linkAuthenticationProvider(
        db,
        credential("phone_otp", "phone_C"),
        credential("google_sign_in", "google_shared"),
        envelope("linkC"),
        linkCommand("link_key_C"),
      ),
    ).rejects.toMatchObject({ category: "VALIDATION_FAILED" });

    // Ownership unchanged — still D's, never merged to C.
    expect((await refDoc("google_sign_in", "google_shared"))?.["customerIdentityId"]).toBe(
      "cust_D",
    );
    expect(await outboxEventTypes()).toContain(
      "identity.authentication_reference_conflict_detected.v1",
    );
  });

  it("refuses to unlink the last remaining reference (history-preserving invariant)", async () => {
    await register("phone_E", "cust_E");

    await expect(
      unlinkAuthenticationProvider(
        db,
        credential("phone_otp", "phone_E"),
        { referenceType: "phone_otp", referenceId: "phone_E" },
        envelope("unlinkE"),
        linkCommand("unlink_key_E"),
      ),
    ).rejects.toMatchObject({ category: "INVALID_STATE_TRANSITION" });
    // Still linked — nothing removed.
    expect((await refDoc("phone_otp", "phone_E"))?.["status"]).toBe("linked");
  });

  it("same-identity safety: acting as F cannot unlink a reference owned by G", async () => {
    await register("phone_F", "cust_F");
    await register("phone_G", "cust_G");

    // F tries to unlink G's phone reference → resolves to F, which does not own
    // it → enumeration-resistant not-found; G's reference is untouched.
    await expect(
      unlinkAuthenticationProvider(
        db,
        credential("phone_otp", "phone_F"),
        { referenceType: "phone_otp", referenceId: "phone_G" },
        envelope("unlinkFG"),
        linkCommand("unlink_key_FG"),
      ),
    ).rejects.toMatchObject({ category: "RESOURCE_NOT_FOUND" });
    expect((await refDoc("phone_otp", "phone_G"))?.["status"]).toBe("linked");
    expect((await refDoc("phone_otp", "phone_G"))?.["customerIdentityId"]).toBe("cust_G");
  });

  it("fails closed (AUTH_REQUIRED) when the acting credential resolves to no identity", async () => {
    await expect(
      linkAuthenticationProvider(
        db,
        credential("phone_otp", "phone_unregistered"),
        credential("google_sign_in", "google_H"),
        envelope("linkH"),
        linkCommand("link_key_H"),
      ),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });
    // Nothing was written for the new reference.
    expect(await refDoc("google_sign_in", "google_H")).toBeUndefined();
  });

  it("represents two providers sharing one Firebase uid as DISTINCT references, both resolving to the same identity (AUTH-CORR-002 tuple model)", async () => {
    // Same verified Firebase authUid re-used as the referenceId of two
    // different providers — the tuple (referenceType, referenceId) keeps them
    // distinct, so linking the second is an ordinary link, not a duplicate.
    const sharedUid = "uid_shared_XY";
    await register(sharedUid, "cust_shared");

    const outcome = await linkAuthenticationProvider(
      db,
      credential("phone_otp", sharedUid),
      credential("google_sign_in", sharedUid),
      envelope("linkShared"),
      linkCommand("link_key_shared"),
    );
    expect(outcome.reference).toEqual({
      referenceType: "google_sign_in",
      referenceId: sharedUid,
    });

    // Two distinct authoritative documents, same owning identity.
    const phoneRef = await refDoc("phone_otp", sharedUid);
    const googleRef = await refDoc("google_sign_in", sharedUid);
    expect(phoneRef?.["customerIdentityId"]).toBe("cust_shared");
    expect(googleRef?.["customerIdentityId"]).toBe("cust_shared");
    expect(phoneRef?.["status"]).toBe("linked");
    expect(googleRef?.["status"]).toBe("linked");

    // Both references resolve through -09 to the SAME customer identity.
    const resolveEnvelope = (suffix: string) => ({
      ...envelope(suffix),
      purpose: "authentication" as const,
    });
    const phoneResolution = await lookupCustomerIdentityByAuthenticationReference(db, {
      ...resolveEnvelope("res_phone"),
      referenceType: "phone_otp",
      referenceId: sharedUid,
    });
    const googleResolution = await lookupCustomerIdentityByAuthenticationReference(db, {
      ...resolveEnvelope("res_google"),
      referenceType: "google_sign_in",
      referenceId: sharedUid,
    });
    expect(phoneResolution.customerIdentityId).toBe("cust_shared");
    expect(googleResolution.customerIdentityId).toBe("cust_shared");
  });

  it("unlinks a same-uid second provider WITHOUT tripping the last-reference invariant (F2 resolution proof, AUTH-CORR-002)", async () => {
    // The precise scenario AUTH-05 §16 flagged as incoherent under the old
    // uid-keyed projection: with tuple keying, a same-uid second provider is a
    // distinct embedded entry, so it can be unlinked while the original remains.
    const sharedUid = "uid_shared_unlink";
    await register(sharedUid, "cust_shared_u");
    await linkAuthenticationProvider(
      db,
      credential("phone_otp", sharedUid),
      credential("google_sign_in", sharedUid),
      envelope("linkSharedU"),
      linkCommand("link_key_shared_u"),
    );

    const outcome = await unlinkAuthenticationProvider(
      db,
      credential("phone_otp", sharedUid),
      { referenceType: "google_sign_in", referenceId: sharedUid },
      envelope("unlinkSharedU"),
      linkCommand("unlink_key_shared_u"),
    );

    expect(outcome.operation).toBe("unlinked");
    expect((await refDoc("google_sign_in", sharedUid))?.["status"]).toBe("unlinked");
    // The original phone reference (same uid, different type) is untouched.
    expect((await refDoc("phone_otp", sharedUid))?.["status"]).toBe("linked");
  });

  it("F1: refuses to link when the acting identity is suspended (ACCOUNT_SUSPENDED), writing nothing", async () => {
    await register("phone_susp", "cust_susp");
    await db.collection("users").doc("cust_susp").update({ status: "suspended" });

    await expect(
      linkAuthenticationProvider(
        db,
        credential("phone_otp", "phone_susp"),
        credential("google_sign_in", "google_susp"),
        envelope("linkSusp"),
        linkCommand("link_key_susp"),
      ),
    ).rejects.toMatchObject({ category: "ACCOUNT_SUSPENDED" });
    // The gate fires before -08 — no authoritative reference materialised.
    expect(await refDoc("google_sign_in", "google_susp")).toBeUndefined();
  });

  it("F1: refuses to unlink when the acting identity is suspended (ACCOUNT_SUSPENDED), removing nothing", async () => {
    await register("phone_susp2", "cust_susp2");
    await linkAuthenticationProvider(
      db,
      credential("phone_otp", "phone_susp2"),
      credential("google_sign_in", "google_susp2"),
      envelope("linkSusp2"),
      linkCommand("link_key_susp2"),
    );
    await db.collection("users").doc("cust_susp2").update({ status: "suspended" });

    await expect(
      unlinkAuthenticationProvider(
        db,
        credential("phone_otp", "phone_susp2"),
        { referenceType: "google_sign_in", referenceId: "google_susp2" },
        envelope("unlinkSusp2"),
        linkCommand("unlink_key_susp2"),
      ),
    ).rejects.toMatchObject({ category: "ACCOUNT_SUSPENDED" });
    // Still linked — the gate blocked the mutation.
    expect((await refDoc("google_sign_in", "google_susp2"))?.["status"]).toBe("linked");
  });
});
