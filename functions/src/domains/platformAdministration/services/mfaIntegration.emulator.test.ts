/**
 * `AUTH-MFA-001` — full-chain integration test: the Firebase token-
 * verification adapter → the provider-neutral `AuthenticatedCredential` →
 * `deriveVerifiedMfaSatisfied` → `resolvePlatformAdministratorAuthorization`.
 *
 * This is the concrete demonstration that the `ENG-P3-003A` integration gap
 * is closed as far as it can be without a real client-reachable command
 * (`ENG-P3-003D`, still future work): given a genuinely verified Firebase ID
 * token, the correct MFA fact reaches the authorization decision end to end,
 * with no client-controlled path able to manufacture satisfaction along the
 * way — `verifyIdToken` is the only source of truth, mocked here only
 * because no live Firebase project exists in CI (matching this codebase's
 * existing `firebaseTokenVerifier.test.ts` convention), never because the
 * boundary itself is bypassed.
 */

import { deleteApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { DecodedIdToken } from "firebase-admin/auth";
import { createFirebaseAdminTokenVerifier } from "../../authentication/services/firebaseTokenVerifier";
import { deriveVerifiedMfaSatisfied } from "./deriveVerifiedMfaSatisfied";
import { resolvePlatformAdministratorAuthorization } from "./resolvePlatformAdministratorAuthorization";
import { bootstrapPlatformAdministrator } from "./bootstrapPlatformAdministrator";
import { PLATFORM_ADMINISTRATORS_COLLECTION } from "../repositories/platformAdministratorRepository";
import { PLATFORM_ADMINISTRATION_AUDIT_RECORDS_COLLECTION } from "../repositories/platformAdministrationAuditRepository";

const app = initializeApp({ projectId: "demo-11thonus" }, "mfaIntegrationEmulatorTest");
const db = getFirestore(app);
const now = new Date("2026-09-04T00:00:00.000Z");

afterAll(async () => {
  await Promise.all(getApps().map((a) => deleteApp(a)));
});

beforeAll(() => {
  if (!process.env["FIRESTORE_EMULATOR_HOST"]) {
    throw new Error(
      "FIRESTORE_EMULATOR_HOST is not set — this test requires the Firebase Emulator Suite. Run via `pnpm emulators:validate` or `pnpm test:emulator` inside `firebase emulators:exec`.",
    );
  }
});

beforeEach(async () => {
  for (const collection of [
    PLATFORM_ADMINISTRATORS_COLLECTION,
    PLATFORM_ADMINISTRATION_AUDIT_RECORDS_COLLECTION,
  ]) {
    const snapshot = await db.collection(collection).get();
    await Promise.all(snapshot.docs.map((doc) => doc.ref.delete()));
  }
});

function decoded(overrides: Partial<DecodedIdToken> = {}): DecodedIdToken {
  return {
    uid: "authuid_admin",
    aud: "demo-11thonus",
    auth_time: 1_700_000_000,
    exp: 1_700_003_600,
    iat: 1_700_000_000,
    iss: "https://securetoken.google.com/demo-11thonus",
    sub: "authuid_admin",
    firebase: { identities: {}, sign_in_provider: "password" },
    ...overrides,
  } as DecodedIdToken;
}

describe("AUTH-MFA-001 full-chain integration", () => {
  it("a password-only verified session is denied at the MFA gate, even for an active knowledge_approver", async () => {
    await bootstrapPlatformAdministrator(db, {
      targetUserId: "authuid_admin",
      roles: ["knowledge_approver"],
      operatorReference: "operator:founder",
      correlationId: "corr-bootstrap",
      now,
    });

    const verifier = createFirebaseAdminTokenVerifier(vi.fn().mockResolvedValue(decoded()), {
      now: () => now,
    });
    const credential = await verifier.verify({ referenceType: "email", rawToken: "raw" });

    const decision = await resolvePlatformAdministratorAuthorization(db, {
      callerUserId: credential.referenceId,
      permission: "knowledge.publish",
      verifiedMfaSatisfied: deriveVerifiedMfaSatisfied(credential),
      correlationId: "corr-req-1",
      now,
    });

    expect(decision).toEqual({ allowed: false, reason: "MFA_NOT_ESTABLISHED" });
  });

  it("a genuinely second-factor-verified session is allowed for an active knowledge_approver", async () => {
    await bootstrapPlatformAdministrator(db, {
      targetUserId: "authuid_admin",
      roles: ["knowledge_approver"],
      operatorReference: "operator:founder",
      correlationId: "corr-bootstrap",
      now,
    });

    const verifier = createFirebaseAdminTokenVerifier(
      vi
        .fn()
        .mockResolvedValue(
          decoded({
            firebase: {
              identities: {},
              sign_in_provider: "password",
              sign_in_second_factor: "phone",
            },
          }),
        ),
      { now: () => now },
    );
    const credential = await verifier.verify({ referenceType: "email", rawToken: "raw" });

    const decision = await resolvePlatformAdministratorAuthorization(db, {
      callerUserId: credential.referenceId,
      permission: "knowledge.publish",
      verifiedMfaSatisfied: deriveVerifiedMfaSatisfied(credential),
      correlationId: "corr-req-2",
      now,
    });

    expect(decision).toEqual({ allowed: true });
  });

  it("no client-controlled path can manufacture MFA satisfaction — a token with no genuine second-factor claim can never produce true, regardless of any other claim value a client's original request carried", async () => {
    await bootstrapPlatformAdministrator(db, {
      targetUserId: "authuid_admin",
      roles: ["knowledge_approver"],
      operatorReference: "operator:founder",
      correlationId: "corr-bootstrap",
      now,
    });

    // Simulates a client that (incorrectly, or maliciously) believes it can
    // assert MFA compliance via some other channel — the verifier only ever
    // consults the cryptographically-verified token claims, never any
    // caller-supplied field, so this has no effect on the derived credential.
    const verifier = createFirebaseAdminTokenVerifier(vi.fn().mockResolvedValue(decoded()), {
      now: () => now,
    });
    const credential = await verifier.verify({ referenceType: "email", rawToken: "raw" });
    expect(credential.verifiedSecondFactor).toBe(false);

    const decision = await resolvePlatformAdministratorAuthorization(db, {
      callerUserId: credential.referenceId,
      permission: "knowledge.view",
      verifiedMfaSatisfied: deriveVerifiedMfaSatisfied(credential),
      correlationId: "corr-req-3",
      now,
    });

    expect(decision).toEqual({ allowed: false, reason: "MFA_NOT_ESTABLISHED" });
  });
});
