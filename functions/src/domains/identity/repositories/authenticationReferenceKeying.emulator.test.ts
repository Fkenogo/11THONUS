/**
 * AUTH-CORR-002 — provider-qualified authentication-reference keying (Model T)
 * against the real Firebase Emulator Suite. Proves the correction end to end
 * through the actual `-08` transaction and `-09` resolution (not mocks):
 *
 *   A. phone and Google references for the SAME verified Firebase UID exist as
 *      two DISTINCT authentication references on one customer identity;
 *   B. resolving EITHER reference (`-09`) returns the same customer identity;
 *   C. a provider-qualified reference cannot be linked to a second identity
 *      (global uniqueness on `{type}:{id}` — cross-identity conflict fail-closed);
 *   D. unlinking one of the two same-UID references leaves the other valid and
 *      still resolvable;
 *   E. the final remaining reference cannot be unlinked (last-reference invariant
 *      now counts the full `(referenceType, referenceId)` tuple);
 *   F. no raw credential/token/OTP material is persisted (only references).
 *
 * Not run under `pnpm test` — see `pnpm test:emulator` / `pnpm emulators:validate`.
 */

import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  linkAuthenticationReferenceForIdentity,
  unlinkAuthenticationReferenceForIdentity,
} from "./authenticationReferenceRepository";
import { registerOrSignIn } from "../../authentication/services/registrationSignInService";
import { lookupCustomerIdentityByAuthenticationReference } from "./identityLookupRepository";
import { createAuthenticatedCredential } from "../../authentication/models/authenticatedCredential";
import type { AuthenticationReferenceType } from "../models/authenticationReference";
import type { EventActor } from "../../../shared/events/domainEvent";

const app = initializeApp({ projectId: "demo-11thonus" }, "authReferenceKeyingEmulatorTest");
const db = getFirestore(app);

const actor: EventActor = { actorType: "system", actorId: "system" };
const at = new Date("2026-08-09T12:00:00.000Z");
const occurredAt = at.toISOString();

function envelope(suffix: string) {
  return {
    eventId: `evt_corr002_${suffix}`,
    correlationId: `corr_corr002_${suffix}`,
    actor,
    occurredAt,
  };
}

/** Register an active identity whose initial (authoritative) reference is phone_otp:{uid}. */
async function registerPhone(uid: string, customerIdentityId: string): Promise<void> {
  await registerOrSignIn(
    db,
    createAuthenticatedCredential({
      referenceType: "phone_otp",
      referenceId: uid,
      verifiedAt: at,
      providerSignals: { signInProvider: "phone" },
    }),
    envelope(`reg_${uid}`),
    { idempotencyKey: `reg_${uid}`, requestHash: `reg_${uid}`, issuedAt: at },
    { generateCustomerIdentityId: () => customerIdentityId },
  );
}

/** Link a provider-qualified reference to an identity via the merged `-08`. */
async function link(
  customerIdentityId: string,
  referenceType: AuthenticationReferenceType,
  referenceId: string,
  suffix: string,
): Promise<void> {
  await linkAuthenticationReferenceForIdentity(db, {
    ...envelope(suffix),
    customerIdentityId,
    referenceId,
    referenceType,
    authority: "customer_initiated",
    reason: "customer_request",
    linkedAt: at,
    linkedBy: customerIdentityId,
    idempotencyKey: `link:${suffix}`,
    requestHash: `link:${referenceType}:${referenceId}`,
  });
}

async function resolve(
  referenceType: AuthenticationReferenceType,
  referenceId: string,
  suffix: string,
): Promise<string> {
  const result = await lookupCustomerIdentityByAuthenticationReference(db, {
    ...envelope(suffix),
    referenceType,
    referenceId,
    purpose: "authentication",
  });
  return result.customerIdentityId;
}

async function refDoc(referenceType: AuthenticationReferenceType, referenceId: string) {
  return (
    await db.collection("authenticationReferences").doc(`${referenceType}:${referenceId}`).get()
  ).data();
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

describe("AUTH-CORR-002 — provider-qualified reference keying (emulator)", () => {
  it("A+B: same-UID phone and Google are two distinct references, both resolving to one identity", async () => {
    await registerPhone("uid_1", "cust_1");
    await link("cust_1", "google_sign_in", "uid_1", "ab"); // SAME uid, different provider

    // Two distinct authoritative docs, both owned by the one identity.
    expect((await refDoc("phone_otp", "uid_1"))?.["customerIdentityId"]).toBe("cust_1");
    expect((await refDoc("google_sign_in", "uid_1"))?.["customerIdentityId"]).toBe("cust_1");

    // The embedded projection holds two distinct tuple entries.
    const user = (await db.collection("users").doc("cust_1").get()).data();
    const refs = (user?.["authenticationReferences"] as Array<Record<string, string>>).map(
      (r) => `${r["referenceType"]}:${r["referenceId"]}`,
    );
    expect(refs.sort()).toEqual(["google_sign_in:uid_1", "phone_otp:uid_1"]);

    // Resolving EITHER reference returns the same identity.
    expect(await resolve("phone_otp", "uid_1", "rA")).toBe("cust_1");
    expect(await resolve("google_sign_in", "uid_1", "rB")).toBe("cust_1");
  });

  it("C: a provider-qualified reference cannot be linked to a second identity (fail closed)", async () => {
    await registerPhone("uid_2", "cust_2");
    await registerPhone("uid_3", "cust_3");
    await link("cust_2", "google_sign_in", "uid_2", "c1"); // google_sign_in:uid_2 -> cust_2

    // cust_3 attempting to claim google_sign_in:uid_2 fails closed; ownership unchanged.
    await expect(link("cust_3", "google_sign_in", "uid_2", "c2")).rejects.toMatchObject({
      category: "VALIDATION_FAILED",
    });
    expect((await refDoc("google_sign_in", "uid_2"))?.["customerIdentityId"]).toBe("cust_2");
  });

  it("D+E: unlink one same-UID reference, keep the other; the final reference cannot be unlinked", async () => {
    await registerPhone("uid_4", "cust_4");
    await link("cust_4", "google_sign_in", "uid_4", "d1");

    await unlinkAuthenticationReferenceForIdentity(db, {
      ...envelope("d2"),
      customerIdentityId: "cust_4",
      referenceType: "google_sign_in",
      referenceId: "uid_4",
      authority: "customer_initiated",
      reason: "customer_request",
      unlinkedAt: at,
      unlinkedBy: "cust_4",
      idempotencyKey: "unlink:d2",
      requestHash: "unlink:google_sign_in:uid_4",
    });

    expect((await refDoc("google_sign_in", "uid_4"))?.["status"]).toBe("unlinked");
    // Phone remains linked and still resolves.
    expect((await refDoc("phone_otp", "uid_4"))?.["status"]).toBe("linked");
    expect(await resolve("phone_otp", "uid_4", "d3")).toBe("cust_4");

    // The final remaining reference cannot be unlinked.
    await expect(
      unlinkAuthenticationReferenceForIdentity(db, {
        ...envelope("d4"),
        customerIdentityId: "cust_4",
        referenceType: "phone_otp",
        referenceId: "uid_4",
        authority: "customer_initiated",
        reason: "customer_request",
        unlinkedAt: at,
        unlinkedBy: "cust_4",
        idempotencyKey: "unlink:d4",
        requestHash: "unlink:phone_otp:uid_4",
      }),
    ).rejects.toMatchObject({ category: "INVALID_STATE_TRANSITION" });
    expect((await refDoc("phone_otp", "uid_4"))?.["status"]).toBe("linked");
  });

  it("F: no raw credential/token/OTP material is persisted (references only)", async () => {
    await registerPhone("uid_5", "cust_5");
    await link("cust_5", "google_sign_in", "uid_5", "f1");

    // Credential/token/OTP-secret material must never be persisted. (Note the
    // provider *type* label `phone_otp` is a reference, not OTP-secret material.)
    for (const collection of ["users", "authenticationReferences", "outboxEntries"]) {
      const snap = await db.collection(collection).get();
      const blob = JSON.stringify(snap.docs.map((d) => d.data()));
      for (const forbidden of [
        "rawToken",
        "idToken",
        "verificationId",
        "verificationCode",
        "smsCode",
        "otpCode",
      ]) {
        expect(blob).not.toContain(forbidden);
      }
    }
  });
});
