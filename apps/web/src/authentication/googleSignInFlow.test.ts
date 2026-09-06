import { describe, expect, it, vi } from "vitest";
import { signInWithGoogle } from "./googleSignInFlow";
import type { AuthenticateOutcome, CallAuthenticate } from "./authenticateClient";
import {
  isPendingMfaChallenge,
  MfaChallengeUnavailableError,
  MFA_REQUIRED_ERROR_CODE,
  type MfaChallengeSdkDeps,
} from "./mfa/mfaSdkChallenge";

const totpHint = {
  uid: "totp-1",
  factorId: "totp",
  enrollmentTime: "2026-09-01T00:00:00.000Z",
};

const outcome: AuthenticateOutcome = {
  mode: "signed_in",
  customerIdentityId: "cid-g",
  session: {
    customerIdentityId: "cid-g",
    authReference: { referenceType: "google_sign_in", referenceId: "uid-g" },
    issuedAt: "2026-08-09T00:00:00.000Z",
  },
};

describe("signInWithGoogle", () => {
  it("runs the Google popup, then authenticates the user as google_sign_in", async () => {
    const seen: string[] = [];
    const callAuthenticate: CallAuthenticate = async (payload) => {
      seen.push(payload.referenceType);
      expect(payload.rawToken).toBe("google-id-token");
      return outcome;
    };
    const signIn = vi.fn(async () => ({ user: { getIdToken: async () => "google-id-token" } }));
    const auth = {} as never;

    const result = await signInWithGoogle(auth, { signIn, callAuthenticate });

    expect(signIn).toHaveBeenCalledWith(auth);
    expect(seen).toEqual(["google_sign_in"]);
    expect(result).toEqual(outcome);
  });

  it("propagates a provider popup failure without calling the backend", async () => {
    const callAuthenticate = vi.fn<CallAuthenticate>(async () => outcome);
    const signIn = vi.fn(async () => {
      throw new Error("popup closed");
    });

    await expect(signInWithGoogle({} as never, { signIn, callAuthenticate })).rejects.toThrow(
      "popup closed",
    );
    expect(callAuthenticate).not.toHaveBeenCalled();
  });

  it("intercepts auth/multi-factor-auth-required from the Google popup and returns a TOTP challenge (AUTH-MFA-003C)", async () => {
    const signIn = vi.fn(async () => {
      throw { code: MFA_REQUIRED_ERROR_CODE };
    });
    const callAuthenticate = vi.fn<CallAuthenticate>(async () => outcome);
    const challengeSdk: MfaChallengeSdkDeps = {
      getResolver: (() => ({
        hints: [totpHint],
        resolveSignIn: vi.fn(async () => ({
          user: { getIdToken: vi.fn(async () => "mfa-resolved-token") },
        })),
      })) as never,
      TotpMultiFactorGenerator: {
        FACTOR_ID: "totp",
        assertionForSignIn: vi.fn(
          (enrollmentId: string, code: string) =>
            ({ factorId: "totp", enrollmentId, code }) as never,
        ),
      },
    };

    const result = await signInWithGoogle({} as never, { signIn, callAuthenticate, challengeSdk });

    expect(isPendingMfaChallenge(result)).toBe(true);
    expect(result).toMatchObject({ kind: "mfa-challenge" });
    // No AUTH-03 bridge happens before the second factor is resolved.
    expect(callAuthenticate).not.toHaveBeenCalled();
  });

  it("fails closed on an ambiguous multiple-TOTP configuration — never selects a first factor, never bridges (CORR-001)", async () => {
    const signIn = vi.fn(async () => {
      throw { code: MFA_REQUIRED_ERROR_CODE };
    });
    const callAuthenticate = vi.fn<CallAuthenticate>(async () => outcome);
    const challengeSdk: MfaChallengeSdkDeps = {
      getResolver: (() => ({
        hints: [
          { ...totpHint, uid: "totp-1" },
          { ...totpHint, uid: "totp-2" },
        ],
        resolveSignIn: vi.fn(),
      })) as never,
      TotpMultiFactorGenerator: {
        FACTOR_ID: "totp",
        assertionForSignIn: vi.fn(
          (enrollmentId: string, code: string) =>
            ({ factorId: "totp", enrollmentId, code }) as never,
        ),
      },
    };

    await expect(
      signInWithGoogle({} as never, { signIn, callAuthenticate, challengeSdk }),
    ).rejects.toBeInstanceOf(MfaChallengeUnavailableError);

    // No assertion, no resolution, and AUTH-03 never runs for the ambiguous config.
    expect(challengeSdk.TotpMultiFactorGenerator.assertionForSignIn).not.toHaveBeenCalled();
    expect(callAuthenticate).not.toHaveBeenCalled();
  });

  it("resolves the google challenge with the MFA-resolved token and the preserved referenceType", async () => {
    const signIn = vi.fn(async () => {
      throw { code: MFA_REQUIRED_ERROR_CODE };
    });
    const callAuthenticate: CallAuthenticate = async (payload) => {
      expect(payload.rawToken).toBe("mfa-resolved-token");
      expect(payload.referenceType).toBe("google_sign_in");
      return outcome;
    };
    const challengeSdk: MfaChallengeSdkDeps = {
      getResolver: (() => ({
        hints: [{ uid: "totp-1", factorId: "totp", enrollmentTime: "2026-09-01T00:00:00.000Z" }],
        resolveSignIn: vi.fn(async () => ({
          user: { getIdToken: vi.fn(async () => "mfa-resolved-token") },
        })),
      })) as never,
      TotpMultiFactorGenerator: {
        FACTOR_ID: "totp",
        assertionForSignIn: vi.fn(
          (enrollmentId: string, code: string) =>
            ({ factorId: "totp", enrollmentId, code }) as never,
        ),
      },
    };

    const result = await signInWithGoogle({} as never, { signIn, callAuthenticate, challengeSdk });
    if (!isPendingMfaChallenge(result)) {
      throw new Error("expected a pending MFA challenge");
    }
    await expect(result.submit("123456")).resolves.toEqual(outcome);
  });
});
