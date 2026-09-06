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

  it("creates a challenge from a resolver with exactly one TOTP hint alongside phone hints (CORR-001)", () => {
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
    // Exactly one TOTP factor (mixed with phone hints) still creates a challenge.
    expect(isPendingMfaChallenge(challenge)).toBe(true);
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

  it("fails closed with an ambiguous multiple-TOTP configuration — never selects a first factor (CORR-001)", () => {
    const resolver = {
      hints: [hint("totp-1", "totp"), hint("totp-2", "totp")],
      resolveSignIn: vi.fn(),
    };
    const sdk = makeSdk(() => resolver as never);
    const callAuthenticate = vi.fn();

    expect(() =>
      createPendingMfaChallenge({
        auth,
        error: mfaRequiredError,
        referenceType: "email",
        deps: { callAuthenticate },
        sdk,
      }),
    ).toThrow(MfaChallengeUnavailableError);

    // No silent selection: neither factor is ever asserted, nothing resolves,
    // and AUTH-03 is never bridged for the ambiguous configuration.
    expect(sdk.TotpMultiFactorGenerator.assertionForSignIn).not.toHaveBeenCalled();
    expect(resolver.resolveSignIn).not.toHaveBeenCalled();
    expect(callAuthenticate).not.toHaveBeenCalled();
  });

  it("submits only the single TOTP factor for a mixed resolver — never a phone hint (CORR-001)", async () => {
    const resolver = {
      hints: [hint("totp-1", "totp"), hint("phone-1", "phone")],
      resolveSignIn: vi.fn(async (assertion: unknown) => ({
        user: { getIdToken: vi.fn(async () => mfaResolvedToken) },
        assertion,
      })),
    };
    const sdk = makeSdk(() => resolver as never);
    const callAuthenticate = vi.fn(async () => makeOutcome("email"));

    const challenge = createPendingMfaChallenge({
      auth,
      error: mfaRequiredError,
      referenceType: "email",
      deps: { callAuthenticate },
      sdk,
    });

    const outcome = await challenge.submit("123456");

    // The assertion targets the single TOTP enrollment id — the phone hint is
    // never touched — and the MFA-resolved user's token reaches AUTH-03.
    expect(sdk.TotpMultiFactorGenerator.assertionForSignIn).toHaveBeenCalledWith(
      "totp-1",
      "123456",
    );
    expect(callAuthenticate).toHaveBeenCalledTimes(1);
    expect((callAuthenticate as ReturnType<typeof vi.fn>).mock.calls[0][0].rawToken).toBe(
      mfaResolvedToken,
    );
    expect(outcome).toEqual(makeOutcome("email"));
  });

  it("never leaks factor metadata to the UI surface (CORR-001)", () => {
    const resolver = {
      hints: [
        { uid: "totp-1", factorId: "totp", enrollmentTime: "2026-09-01T00:00:00.000Z" },
        { uid: "phone-2", factorId: "phone", phoneNumber: "+15555550100" },
      ],
      resolveSignIn: vi.fn(),
    };
    const sdk = makeSdk(() => resolver as never);

    const challenge = createPendingMfaChallenge({
      auth,
      error: mfaRequiredError,
      referenceType: "email",
      deps: { callAuthenticate: vi.fn() },
      sdk,
    });

    // The entire public surface is { kind, submit, clear } — no factor ids,
    // no enrollment timestamps, no phone hints, no metadata.
    expect(Object.keys(challenge).sort()).toEqual(["clear", "kind", "submit"]);
    expect(JSON.stringify(challenge)).not.toContain("totp-1");
    expect(JSON.stringify(challenge)).not.toContain("phone-2");
    expect(JSON.stringify(challenge)).not.toContain("enrollmentTime");
    expect(JSON.stringify(challenge)).not.toContain("+1555");
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
