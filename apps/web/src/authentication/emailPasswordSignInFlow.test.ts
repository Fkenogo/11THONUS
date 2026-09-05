import { describe, expect, it, vi } from "vitest";
import { registerWithEmailPassword, signInWithEmailPassword } from "./emailPasswordSignInFlow";
import {
  AuthenticateError,
  type AuthenticateOutcome,
  type AuthenticatePayload,
} from "./authenticateClient";
import {
  isPendingMfaChallenge,
  MfaChallengeUnavailableError,
  MFA_REQUIRED_ERROR_CODE,
  type MfaChallengeSdkDeps,
} from "./mfa/mfaSdkChallenge";

const auth = { id: "auth" } as never;

const outcome = (mode: AuthenticateOutcome["mode"]): AuthenticateOutcome => ({
  mode,
  customerIdentityId: "cid",
  session: {
    customerIdentityId: "cid",
    authReference: { referenceType: "email", referenceId: "authuid_e" },
    issuedAt: "2026-08-12T00:00:00.000Z",
  },
});

function fakeUser(token = "id-token-email") {
  return { user: { getIdToken: vi.fn(async () => token) } };
}

function totpHint(uid: string) {
  return { uid, factorId: "totp", enrollmentTime: "2026-09-01T00:00:00.000Z" };
}

/** Real-SDK-shaped challenge seam with a single TOTP hint (AUTH-MFA-003C). */
function mfaChallengeSdk(): MfaChallengeSdkDeps {
  return {
    getResolver: (() => ({
      hints: [totpHint("totp-1")],
      resolveSignIn: vi.fn(async () => ({
        user: { getIdToken: vi.fn(async () => "mfa-resolved-token") },
      })),
    })) as never,
    TotpMultiFactorGenerator: {
      FACTOR_ID: "totp",
      assertionForSignIn: vi.fn(
        (enrollmentId: string, code: string) => ({ factorId: "totp", enrollmentId, code }) as never,
      ),
    },
  };
}

describe("emailPasswordSignInFlow (AUTH-CORR-003)", () => {
  it("registers a new Email/Password user and authenticates as an `email` credential", async () => {
    const register = vi.fn(async () => fakeUser());
    const calls: AuthenticatePayload[] = [];
    const callAuthenticate = vi.fn(async (p: AuthenticatePayload) => {
      calls.push(p);
      return outcome("registered");
    });

    const result = await registerWithEmailPassword(auth, "new@user.co", "pw123456", {
      callAuthenticate,
      register,
      newIdempotencyKey: () => "key-1",
    });

    expect(register).toHaveBeenCalledWith(auth, "new@user.co", "pw123456");
    expect(result).toMatchObject({ mode: "registered" });
    // Bridged to AUTH-03 with the derived `email` reference type; token passed once.
    expect(calls[0]).toMatchObject({ referenceType: "email", rawToken: "id-token-email" });
  });

  it("signs in a returning Email/Password user as an `email` credential", async () => {
    const signIn = vi.fn(async () => fakeUser());
    const callAuthenticate = vi.fn(async () => outcome("signed_in"));

    const result = await signInWithEmailPassword(auth, "back@user.co", "pw123456", {
      callAuthenticate,
      signIn,
      newIdempotencyKey: () => "key-2",
    });

    expect(signIn).toHaveBeenCalledWith(auth, "back@user.co", "pw123456");
    expect(result).toMatchObject({ mode: "signed_in" });
  });

  it("intercepts auth/multi-factor-auth-required and returns a TOTP challenge, never bridging pre-MFA (AUTH-MFA-003C)", async () => {
    const signIn = vi.fn(async () => {
      throw { code: MFA_REQUIRED_ERROR_CODE };
    });
    const callAuthenticate = vi.fn(async () => outcome("signed_in"));

    const result = await signInWithEmailPassword(auth, "admin@onus.co", "pw", {
      callAuthenticate,
      signIn,
      challengeSdk: mfaChallengeSdk(),
    });

    expect(isPendingMfaChallenge(result)).toBe(true);
    expect(result).toMatchObject({ kind: "mfa-challenge" });
    // No AUTH-03 bridge happens before the second factor is resolved.
    expect(callAuthenticate).not.toHaveBeenCalled();
  });

  it("fails closed on an ambiguous multiple-TOTP configuration — never selects a first factor, never bridges (CORR-001)", async () => {
    const signIn = vi.fn(async () => {
      throw { code: MFA_REQUIRED_ERROR_CODE };
    });
    const callAuthenticate = vi.fn(async () => outcome("signed_in"));
    const resolver = {
      hints: [totpHint("totp-1"), totpHint("totp-2")],
      resolveSignIn: vi.fn(),
    };
    const sdk: MfaChallengeSdkDeps = {
      getResolver: (() => resolver) as never,
      TotpMultiFactorGenerator: mfaChallengeSdk().TotpMultiFactorGenerator,
    };

    await expect(
      signInWithEmailPassword(auth, "admin@onus.co", "pw", {
        callAuthenticate,
        signIn,
        challengeSdk: sdk,
      }),
    ).rejects.toBeInstanceOf(MfaChallengeUnavailableError);

    // No assertion, no resolution, and AUTH-03 never runs for the ambiguous config.
    expect(sdk.TotpMultiFactorGenerator.assertionForSignIn).not.toHaveBeenCalled();
    expect(resolver.resolveSignIn).not.toHaveBeenCalled();
    expect(callAuthenticate).not.toHaveBeenCalled();
  });

  it("registration shares the same fail-closed MFA interception (AUTH-MFA-003C)", async () => {
    const register = vi.fn(async () => {
      throw { code: MFA_REQUIRED_ERROR_CODE };
    });
    const callAuthenticate = vi.fn(async () => outcome("registered"));

    const result = await registerWithEmailPassword(auth, "admin@onus.co", "pw", {
      callAuthenticate,
      register,
      challengeSdk: mfaChallengeSdk(),
    });

    expect(isPendingMfaChallenge(result)).toBe(true);
    expect(callAuthenticate).not.toHaveBeenCalled();
  });

  it("passes a non-MFA first-factor error through unchanged (no AUTH-03 bridge)", async () => {
    const signIn = vi.fn(async () => {
      throw { code: "auth/invalid-credential" };
    });
    const callAuthenticate = vi.fn(async () => outcome("signed_in"));

    await expect(
      signInWithEmailPassword(auth, "back@user.co", "wrong", { callAuthenticate, signIn }),
    ).rejects.toMatchObject({ code: "auth/invalid-credential" });
    expect(callAuthenticate).not.toHaveBeenCalled();
  });

  it("reuses one idempotency key across a transient retry (AUTH-03 replay gate preserved)", async () => {
    const seenKeys: string[] = [];
    let attempt = 0;
    const callAuthenticate = vi.fn(async (p: AuthenticatePayload) => {
      seenKeys.push(p.idempotencyKey);
      attempt += 1;
      if (attempt === 1) throw new AuthenticateError("unavailable");
      return outcome("signed_in");
    });

    await signInWithEmailPassword(auth, "back@user.co", "pw", {
      callAuthenticate,
      signIn: async () => fakeUser(),
      newIdempotencyKey: () => "stable-key",
    });

    expect(seenKeys).toEqual(["stable-key", "stable-key"]);
  });

  it("does not persist, log, or return the password", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const password = "sup3r-secret-pw";
    const callAuthenticate = vi.fn(async (p: AuthenticatePayload) => {
      // The password must never reach the backend payload.
      expect(JSON.stringify(p)).not.toContain(password);
      return outcome("signed_in");
    });

    const result = await signInWithEmailPassword(auth, "u@x.co", password, {
      callAuthenticate,
      signIn: async () => fakeUser(),
      newIdempotencyKey: () => "k",
    });

    expect(JSON.stringify(result)).not.toContain(password);
    for (const spy of [logSpy, errSpy]) {
      for (const call of spy.mock.calls) {
        expect(JSON.stringify(call)).not.toContain(password);
      }
    }
    logSpy.mockRestore();
    errSpy.mockRestore();
  });
});
