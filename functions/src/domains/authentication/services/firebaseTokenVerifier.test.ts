/**
 * AUTH-02 — Firebase Admin ID-token verification adapter (unit tests).
 *
 * The adapter is exercised at its injection seam: a test double stands in
 * for Firebase's `verifyIdToken`, so these tests prove *our* mapping logic
 * (credential construction + closed-taxonomy error mapping), never
 * Firebase's own verification internals, and touch no network (per the
 * AUTH-02 brief / `DEC-AUTH-001` D-A4 — no live production Firebase in CI).
 */

import { describe, expect, it, vi } from "vitest";
import type { DecodedIdToken } from "firebase-admin/auth";
import { createFirebaseAdminTokenVerifier } from "./firebaseTokenVerifier";
import { AuthenticationDomainError } from "../models/authenticationErrors";

function decoded(overrides: Partial<DecodedIdToken> = {}): DecodedIdToken {
  return {
    uid: "authuid_123",
    aud: "demo-11thonus",
    auth_time: 1_700_000_000,
    exp: 1_700_003_600,
    iat: 1_700_000_000,
    iss: "https://securetoken.google.com/demo-11thonus",
    sub: "authuid_123",
    firebase: {
      identities: {},
      sign_in_provider: "phone",
    },
    ...overrides,
  } as DecodedIdToken;
}

function firebaseError(code: string): Error {
  const error = new Error(`Firebase error: ${code}`) as Error & { code: string };
  error.code = code;
  return error;
}

const fixedNow = new Date("2026-08-08T12:00:00.000Z");

describe("createFirebaseAdminTokenVerifier", () => {
  it("verifies a raw provider token into a provider-neutral AuthenticatedCredential (referenceId = Firebase authUid)", async () => {
    const verifyIdToken = vi.fn().mockResolvedValue(decoded({ uid: "authuid_abc" }));
    const verifier = createFirebaseAdminTokenVerifier(verifyIdToken, { now: () => fixedNow });

    const credential = await verifier.verify({
      referenceType: "phone_otp",
      rawToken: "raw-firebase-id-token",
    });

    expect(credential.referenceType).toBe("phone_otp");
    expect(credential.referenceId).toBe("authuid_abc");
    expect(credential.verifiedAt).toEqual(fixedNow);
    expect(credential.providerSignals.signInProvider).toBe("phone");
  });

  // AUTH-07 additive extension (authorized): surface the token's trusted
  // `auth_time` (seconds since epoch) as `authenticatedAt`, server-derived from
  // the verified claims — the freshness anchor for privileged re-authentication.
  it("surfaces the verified token's auth_time as a server-derived authenticatedAt (distinct from verifiedAt)", async () => {
    const verifyIdToken = vi.fn().mockResolvedValue(decoded({ auth_time: 1_700_000_000 }));
    const verifier = createFirebaseAdminTokenVerifier(verifyIdToken, { now: () => fixedNow });

    const credential = await verifier.verify({
      referenceType: "phone_otp",
      rawToken: "raw-firebase-id-token",
    });

    expect(credential.authenticatedAt).toEqual(new Date(1_700_000_000 * 1000));
    // Freshness must not be conflated with verification time.
    expect(credential.authenticatedAt).not.toEqual(credential.verifiedAt);
    expect(credential.verifiedAt).toEqual(fixedNow);
  });

  it("fails closed (AUTH_REQUIRED) when the verified token carries no auth_time", async () => {
    const verifyIdToken = vi.fn().mockResolvedValue(decoded({ auth_time: undefined }));
    const verifier = createFirebaseAdminTokenVerifier(verifyIdToken, { now: () => fixedNow });

    await expect(
      verifier.verify({ referenceType: "phone_otp", rawToken: "raw" }),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });
  });

  it("fails closed (AUTH_REQUIRED) when auth_time is malformed", async () => {
    const verifyIdToken = vi
      .fn()
      .mockResolvedValue(decoded({ auth_time: Number.NaN as unknown as number }));
    const verifier = createFirebaseAdminTokenVerifier(verifyIdToken, { now: () => fixedNow });

    await expect(
      verifier.verify({ referenceType: "phone_otp", rawToken: "raw" }),
    ).rejects.toBeInstanceOf(AuthenticationDomainError);
  });

  it("checks token revocation (verifyIdToken called with checkRevoked = true)", async () => {
    const verifyIdToken = vi.fn().mockResolvedValue(decoded());
    const verifier = createFirebaseAdminTokenVerifier(verifyIdToken, { now: () => fixedNow });

    await verifier.verify({ referenceType: "phone_otp", rawToken: "raw" });

    expect(verifyIdToken).toHaveBeenCalledWith("raw", true);
  });

  it("carries no credential material — the raw token never appears in providerSignals", async () => {
    const verifyIdToken = vi.fn().mockResolvedValue(decoded());
    const verifier = createFirebaseAdminTokenVerifier(verifyIdToken, { now: () => fixedNow });

    const credential = await verifier.verify({
      referenceType: "phone_otp",
      rawToken: "super-secret-raw-token",
    });

    const serialized = JSON.stringify(credential);
    expect(serialized).not.toContain("super-secret-raw-token");
    // Only the non-sensitive provider signal is carried.
    expect(Object.keys(credential.providerSignals)).toEqual(["signInProvider"]);
  });

  it("rejects an empty raw token as AUTH_REQUIRED without calling Firebase", async () => {
    const verifyIdToken = vi.fn();
    const verifier = createFirebaseAdminTokenVerifier(verifyIdToken, { now: () => fixedNow });

    await expect(
      verifier.verify({ referenceType: "phone_otp", rawToken: "   " }),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it.each([
    "auth/id-token-expired",
    "auth/id-token-revoked",
    "auth/invalid-id-token",
    "auth/argument-error",
    "auth/user-not-found",
  ])("maps %s to AUTH_REQUIRED", async (code) => {
    const verifyIdToken = vi.fn().mockRejectedValue(firebaseError(code));
    const verifier = createFirebaseAdminTokenVerifier(verifyIdToken, { now: () => fixedNow });

    await expect(
      verifier.verify({ referenceType: "phone_otp", rawToken: "raw" }),
    ).rejects.toMatchObject({ category: "AUTH_REQUIRED" });
  });

  it("maps a disabled user to AUTH_FORBIDDEN", async () => {
    const verifyIdToken = vi.fn().mockRejectedValue(firebaseError("auth/user-disabled"));
    const verifier = createFirebaseAdminTokenVerifier(verifyIdToken, { now: () => fixedNow });

    await expect(
      verifier.verify({ referenceType: "phone_otp", rawToken: "raw" }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });

  it.each(["auth/internal-error", "ETIMEDOUT", "ECONNRESET"])(
    "maps transient failure %s to TEMPORARY_UNAVAILABLE",
    async (code) => {
      const verifyIdToken = vi.fn().mockRejectedValue(firebaseError(code));
      const verifier = createFirebaseAdminTokenVerifier(verifyIdToken, { now: () => fixedNow });

      await expect(
        verifier.verify({ referenceType: "phone_otp", rawToken: "raw" }),
      ).rejects.toMatchObject({ category: "TEMPORARY_UNAVAILABLE" });
    },
  );

  it("maps an unrecognised provider failure to INTEGRATION_FAILED", async () => {
    const verifyIdToken = vi.fn().mockRejectedValue(firebaseError("auth/something-unexpected"));
    const verifier = createFirebaseAdminTokenVerifier(verifyIdToken, { now: () => fixedNow });

    await expect(
      verifier.verify({ referenceType: "phone_otp", rawToken: "raw" }),
    ).rejects.toMatchObject({ category: "INTEGRATION_FAILED" });
  });

  it("throws AuthenticationDomainError (not the raw Firebase error) on failure", async () => {
    const verifyIdToken = vi.fn().mockRejectedValue(firebaseError("auth/id-token-expired"));
    const verifier = createFirebaseAdminTokenVerifier(verifyIdToken, { now: () => fixedNow });

    await expect(
      verifier.verify({ referenceType: "phone_otp", rawToken: "raw" }),
    ).rejects.toBeInstanceOf(AuthenticationDomainError);
  });

  // Provider-provenance binding (P1 pre-merge security correction). The
  // verified `sign_in_provider` in the decoded token — never the client-
  // declared `referenceType` — is authoritative. A declared type that the
  // verified token does not prove, or an unsupported verified provider, fails
  // closed through the governed taxonomy (AUTH_FORBIDDEN).
  it("derives the governed reference type from a phone-verified token", async () => {
    const verifyIdToken = vi
      .fn()
      .mockResolvedValue(decoded({ firebase: { identities: {}, sign_in_provider: "phone" } }));
    const verifier = createFirebaseAdminTokenVerifier(verifyIdToken, { now: () => fixedNow });

    const credential = await verifier.verify({ referenceType: "phone_otp", rawToken: "raw" });

    expect(credential.referenceType).toBe("phone_otp");
    expect(credential.providerSignals.signInProvider).toBe("phone");
  });

  it("derives the governed reference type from a google-verified token", async () => {
    const verifyIdToken = vi
      .fn()
      .mockResolvedValue(decoded({ firebase: { identities: {}, sign_in_provider: "google.com" } }));
    const verifier = createFirebaseAdminTokenVerifier(verifyIdToken, { now: () => fixedNow });

    const credential = await verifier.verify({ referenceType: "google_sign_in", rawToken: "raw" });

    expect(credential.referenceType).toBe("google_sign_in");
    expect(credential.providerSignals.signInProvider).toBe("google.com");
  });

  it("fails closed when a google-verified token is presented as phone_otp", async () => {
    const verifyIdToken = vi
      .fn()
      .mockResolvedValue(decoded({ firebase: { identities: {}, sign_in_provider: "google.com" } }));
    const verifier = createFirebaseAdminTokenVerifier(verifyIdToken, { now: () => fixedNow });

    await expect(
      verifier.verify({ referenceType: "phone_otp", rawToken: "raw" }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });

  it("fails closed when a phone-verified token is presented as google_sign_in", async () => {
    const verifyIdToken = vi
      .fn()
      .mockResolvedValue(decoded({ firebase: { identities: {}, sign_in_provider: "phone" } }));
    const verifier = createFirebaseAdminTokenVerifier(verifyIdToken, { now: () => fixedNow });

    await expect(
      verifier.verify({ referenceType: "google_sign_in", rawToken: "raw" }),
    ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
  });

  it.each(["password", "apple.com", "custom", "anonymous"])(
    "fails closed for an unsupported verified provider (%s), regardless of declared type",
    async (provider) => {
      const verifyIdToken = vi
        .fn()
        .mockResolvedValue(decoded({ firebase: { identities: {}, sign_in_provider: provider } }));
      const verifier = createFirebaseAdminTokenVerifier(verifyIdToken, { now: () => fixedNow });

      await expect(
        verifier.verify({ referenceType: "phone_otp", rawToken: "raw" }),
      ).rejects.toMatchObject({ category: "AUTH_FORBIDDEN" });
    },
  );

  // P2: Firebase Admin transient transport failures map to TEMPORARY_UNAVAILABLE.
  it.each(["app/network-error", "app/network-timeout"])(
    "maps Firebase Admin transport failure %s to TEMPORARY_UNAVAILABLE",
    async (code) => {
      const verifyIdToken = vi.fn().mockRejectedValue(firebaseError(code));
      const verifier = createFirebaseAdminTokenVerifier(verifyIdToken, { now: () => fixedNow });

      await expect(
        verifier.verify({ referenceType: "phone_otp", rawToken: "raw" }),
      ).rejects.toMatchObject({ category: "TEMPORARY_UNAVAILABLE" });
    },
  );
});
