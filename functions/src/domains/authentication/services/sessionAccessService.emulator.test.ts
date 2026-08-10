/**
 * AUTH-07 — session / access gating against the real Firebase Emulator Suite.
 * Proves the gates end-to-end through the *actual* merged `-09` resolution and
 * persisted identity access state (not mocks):
 *
 *   - a verified credential resolving to an active identity establishes a
 *     session (server-issued `issuedAt`);
 *   - a credential resolving to no identity fails closed (`AUTH_REQUIRED`),
 *     with no session;
 *   - a suspended identity is refused (`ACCOUNT_SUSPENDED`);
 *   - a privileged action with recent authentication is authorized, while stale
 *     authentication is refused (`AUTH_REQUIRED`) even though the credential is
 *     freshly verified — freshness is enforced from `authenticatedAt`, through
 *     the real resolution path.
 *
 * Not run under `pnpm test` — see `pnpm test:emulator` / `pnpm emulators:validate`.
 */

import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { registerOrSignIn, type RegistrationSignInCommand } from "./registrationSignInService";
import {
  authorizeIdentityProtectedAction,
  authorizePrivilegedAction,
  type SessionAuthorizationEnvelope,
} from "./sessionAccessService";
import { createAuthenticatedCredential } from "../models/authenticatedCredential";
import type { AuthenticationReferenceType } from "../../identity/models/authenticationReference";
import type { EventActor } from "../../../shared/events/domainEvent";

const app = initializeApp({ projectId: "demo-11thonus" }, "sessionAccessServiceEmulatorTest");
const db = getFirestore(app);

const actor: EventActor = { actorType: "user", actorId: "authuid" };
const serverNow = new Date("2026-08-10T12:00:00.000Z");
const at = new Date("2026-08-10T11:00:00.000Z");

function credential(
  referenceType: AuthenticationReferenceType,
  referenceId: string,
  authenticatedAt?: Date,
) {
  return createAuthenticatedCredential({
    referenceType,
    referenceId,
    verifiedAt: serverNow,
    authenticatedAt,
    providerSignals: { signInProvider: referenceType },
  });
}

function envelope(suffix: string): SessionAuthorizationEnvelope {
  return {
    eventId: `evt_auth07_${suffix}`,
    correlationId: `corr_auth07_${suffix}`,
    actor,
    occurredAt: serverNow.toISOString(),
  };
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

describe("AUTH-07 session/access gating (emulator)", () => {
  it("establishes a session for a verified credential resolving to an active identity", async () => {
    await register("uid_active", "cust_active");

    const session = await authorizeIdentityProtectedAction(
      db,
      credential("phone_otp", "uid_active", new Date(serverNow.getTime() - 2 * 60 * 1000)),
      envelope("protected_ok"),
      {},
      { now: () => serverNow },
    );

    expect(session.customerIdentityId).toBe("cust_active");
    expect(session.authReference).toEqual({
      referenceType: "phone_otp",
      referenceId: "uid_active",
    });
    expect(session.issuedAt).toEqual(serverNow);
  });

  it("fails closed (AUTH_REQUIRED) for a credential that resolves to no identity", async () => {
    await expect(
      authorizeIdentityProtectedAction(
        db,
        credential("phone_otp", "uid_unknown"),
        envelope("protected_unresolved"),
        {},
        { now: () => serverNow },
      ),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });
  });

  it("refuses a suspended identity (ACCOUNT_SUSPENDED)", async () => {
    await register("uid_susp", "cust_susp");
    await db.collection("users").doc("cust_susp").update({ status: "suspended" });

    await expect(
      authorizeIdentityProtectedAction(
        db,
        credential("phone_otp", "uid_susp", new Date(serverNow.getTime() - 60 * 1000)),
        envelope("protected_suspended"),
        {},
        { now: () => serverNow },
      ),
    ).rejects.toMatchObject({ category: "ACCOUNT_SUSPENDED" });
  });

  it("authorizes a privileged action for recent authentication and refuses stale authentication", async () => {
    await register("uid_priv", "cust_priv");

    const recent = credential(
      "phone_otp",
      "uid_priv",
      new Date(serverNow.getTime() - 2 * 60 * 1000),
    );
    const session = await authorizePrivilegedAction(
      db,
      recent,
      envelope("priv_fresh"),
      {},
      {
        now: () => serverNow,
      },
    );
    expect(session.customerIdentityId).toBe("cust_priv");

    const stale = credential(
      "phone_otp",
      "uid_priv",
      new Date(serverNow.getTime() - 30 * 60 * 1000),
    );
    expect(stale.verifiedAt).toEqual(serverNow); // freshly verified, but authenticated long ago
    await expect(
      authorizePrivilegedAction(db, stale, envelope("priv_stale"), {}, { now: () => serverNow }),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });
  });
});
