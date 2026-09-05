import { describe, expect, it, vi } from "vitest";
import type { AuthenticateOutcome, AuthenticatePayload } from "../authenticateClient";
import {
  classifyMfaChallengeError,
  createPendingMfaChallenge,
  isMfaRequiredError,
  isPendingMfaChallenge,
  MfaChallengeUnavailableError,
  MFA_CHALLENGE_CODE_LENGTH,
  MFA_REQUIRED_ERROR_CODE,
  type MfaChallengeSdkDeps,
} from "./mfaSdkChallenge";

const auth = { id: "auth" } as never;

function hint(uid: string, factorId: string) {
  return { uid, factorId, enrollmentTime: "2026-09-01T00:00:00.000Z" };
}

const mfaRequiredError = { code: MFA_REQUIRED_ERROR_CODE };

const mfaResolvedToken = "mfa-resolved-token";

function makeOutcome(referenceType: AuthenticatePayload["referenceType"]): AuthenticateOutcome {
  return {
    mode: "signed_in",
    customerIdentityId: "cid",
    session: {
      customerIdentityId: "cid",
      authReference: { referenceType, referenceId: "authuid" },
      issuedAt: "2026-09-05T00:00:00.000Z",
    },
  };
}

function makeSdk(getResolver: MfaChallengeSdkDeps["getResolver"]): MfaChallengeSdkDeps {
  return {
    getResolver: vi.fn(getResolver),
    TotpMultiFactorGenerator: {
      FACTOR_ID: "totp",
      assertionForSignIn: vi.fn(
        (enrollmentId: string, oneTimePassword: string) =>
          ({ factorId: "totp", enrollmentId, oneTimePassword }) as never,
      ),
    },
  };
}

describe("mfaSdkChallenge (AUTH-MFA-003C)", () => {
  it("exposes the exact MFA-required code and the 6-digit challenge length", () => {
    expect(MFA_REQUIRED_ERROR_CODE).toBe("auth/multi-factor-auth-required");
    expect(MFA_CHALLENGE_CODE_LENGTH).toBe(6);
  });

  it("recognises the MFA-required error by code only, never by message text", () => {
    expect(isMfaRequiredError(mfaRequiredError)).toBe(true);
    expect(isMfaRequiredError({ code: "auth/invalid-credential" })).toBe(false);
    expect(isMfaRequiredError({ message: "multi-factor-auth-required" })).toBe(false);
    expect(isMfaRequiredError(undefined)).toBe(false);
    expect(isMfaRequiredError(new Error("mfa"))).toBe(false);
  });

  it("builds a challenge from the resolver, exposing only TOTP hints", () => {
    const resolver = {
      hints: [hint("totp-1", "totp"), hint("phone-1", "phone")],
      resolveSignIn: vi.fn(),
    };
    const sdk = makeSdk(() => resolver as never);
    const calls: AuthenticatePayload[] = [];
    const deps = {
      callAuthenticate: vi.fn(async (p: AuthenticatePayload) => {
        calls.push(p);
        return makeOutcome("email");
      }),
    };

    const challenge = createPendingMfaChallenge({
      auth,
      error: mfaRequiredError,
      referenceType: "email",
      deps,
      sdk,
    });

    expect(sdk.getResolver).toHaveBeenCalledWith(auth, mfaRequiredError);
    // Only the TOTP hint survives; the phone hint is never surfaced.
    expect(challenge.factorUids).toEqual(["totp-1"]);
    expect(calls).toEqual([]);
  });

  it("fails closed when the resolver exposes no TOTP factor (no bypass)", () => {
    const sdk = makeSdk(
      () => ({ hints: [hint("phone-1", "phone")], resolveSignIn: vi.fn() }) as never,
    );
    expect(() =>
      createPendingMfaChallenge({
        auth,
        error: mfaRequiredError,
        referenceType: "email",
        deps: { callAuthenticate: vi.fn() },
        sdk,
      }),
    ).toThrow(MfaChallengeUnavailableError);
  });

  it("submit resolves sign-in with a TOTP assertion then bridges the MFA-resolved user's token", async () => {
    const resolver = {
      hints: [hint("totp-1", "totp")],
      resolveSignIn: vi.fn(async (assertion: unknown) => ({
        user: { getIdToken: vi.fn(async () => mfaResolvedToken) },
        assertion,
      })),
    };
    const sdk = makeSdk(() => resolver as never);
    const calls: AuthenticatePayload[] = [];
    const callAuthenticate = vi.fn(async (p: AuthenticatePayload) => {
      calls.push(p);
      return makeOutcome("email");
    });

    const challenge = createPendingMfaChallenge({
      auth,
      error: mfaRequiredError,
      referenceType: "email",
      deps: { callAuthenticate, newIdempotencyKey: () => "key" },
      sdk,
    });

    const outcome = await challenge.submit("123456");

    // Assertion was built for the enrolled factor with the submitted code.
    expect(sdk.TotpMultiFactorGenerator.assertionForSignIn).toHaveBeenCalledWith(
      "totp-1",
      "123456",
    );
    // The resolver completed the sign-in with that assertion.
    const assertion = (sdk.TotpMultiFactorGenerator.assertionForSignIn as ReturnType<typeof vi.fn>)
      .mock.results[0].value;
    expect(resolver.resolveSignIn).toHaveBeenCalledWith(assertion);

    // AUTH-03 received the MFA-resolved user's ID token and the preserved email reference.
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ rawToken: mfaResolvedToken, referenceType: "email" });
    expect(outcome).toEqual(makeOutcome("email"));
  });

  it("never sends the pre-MFA token — only the resolved user's token reaches AUTH-03 (v19)", async () => {
    const preMfaToken = "pre-mfa-primary-session-token";
    const resolver = {
      hints: [hint("totp-1", "totp")],
      resolveSignIn: vi.fn(async () => ({
        user: { getIdToken: vi.fn(async () => mfaResolvedToken) },
      })),
    };
    const sdk = makeSdk(() => resolver as never);
    const calls: AuthenticatePayload[] = [];
    const callAuthenticate = vi.fn(async (p: AuthenticatePayload) => {
      calls.push(p);
      return makeOutcome("google_sign_in");
    });

    const challenge = createPendingMfaChallenge({
      auth,
      error: mfaRequiredError,
      referenceType: "google_sign_in",
      deps: { callAuthenticate },
      sdk,
    });

    await challenge.submit("654321");

    // One and only one token ever leaves this flow, and it is the resolved one.
    expect(calls).toHaveLength(1);
    expect(calls[0].rawToken).toBe(mfaResolvedToken);
    expect(calls[0].rawToken).not.toBe(preMfaToken);
    expect(JSON.stringify(calls)).not.toContain(preMfaToken);
    expect(calls[0].referenceType).toBe("google_sign_in");
  });

  it("clear() drops the resolver so a late submit cannot resolve", async () => {
    const resolver = {
      hints: [hint("totp-1", "totp")],
      resolveSignIn: vi.fn(async () => ({ user: { getIdToken: vi.fn() } })),
    };
    const sdk = makeSdk(() => resolver as never);
    const challenge = createPendingMfaChallenge({
      auth,
      error: mfaRequiredError,
      referenceType: "email",
      deps: { callAuthenticate: vi.fn() },
      sdk,
    });

    challenge.clear();
    await expect(challenge.submit("123456")).rejects.toThrow(MfaChallengeUnavailableError);
    expect(resolver.resolveSignIn).not.toHaveBeenCalled();
  });

  it("classifies submitted-code failures into bounded categories", () => {
    expect(classifyMfaChallengeError({ code: "auth/invalid-verification-code" })).toBe(
      "invalid-code",
    );
    expect(classifyMfaChallengeError({ code: "auth/invalid-multi-factor-session" })).toBe(
      "session-expired",
    );
    expect(classifyMfaChallengeError({ code: "auth/multi-factor-info-not-found" })).toBe(
      "session-expired",
    );
    expect(classifyMfaChallengeError({ code: "auth/network-request-failed" })).toBe("other");
    expect(classifyMfaChallengeError(new Error("boom"))).toBe("other");
    expect(classifyMfaChallengeError(undefined)).toBe("other");
  });

  it("provides a safe type guard for the challenge result", () => {
    expect(
      isPendingMfaChallenge({
        kind: "mfa-challenge",
        factorUids: [],
        submit: vi.fn(),
        clear: vi.fn(),
      }),
    ).toBe(true);
    expect(
      isPendingMfaChallenge({ mode: "signed_in", customerIdentityId: "cid", session: {} }),
    ).toBe(false);
    expect(isPendingMfaChallenge(null)).toBe(false);
    expect(isPendingMfaChallenge(undefined)).toBe(false);
  });
});
