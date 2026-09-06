/**
 * SDK isolation for the `AUTH-MFA-003C` TOTP sign-in challenge flow
 * (`AUTH-MFA-002` §8.1 step 5 → next-sign-in second-factor challenge).
 *
 * Every Firebase Auth SDK call the challenge needs is confined to this
 * module, behind an injectable dependency seam so the flow is unit-testable
 * without live transport (the Firebase Auth Emulator supports MFA for
 * PHONE_SMS second factors only and cannot execute a TOTP challenge).
 *
 * The result is a bounded {@link PendingMfaChallenge}:
 *
 * - The challenge is created only when the resolver exposes **exactly one**
 *   TOTP factor; zero TOTP factors and an ambiguous multiple-TOTP
 *   configuration both fail closed (`AUTH-MFA-003C-CORR-001`). No client
 *   factor-selection policy — "first factor wins" or otherwise — is ever
 *   applied (`DEC-SEC-004` TOTP-only policy).
 * - The single selected enrollment ID stays internal to the challenge
 *   closure; the public surface never lists factor IDs, enrollment
 *   timestamps, factor metadata, or phone hints.
 * - `submit(code)` builds a TOTP assertion with
 *   `TotpMultiFactorGenerator.assertionForSignIn` and passes it to
 *   `resolver.resolveSignIn`, then hands the **MFA-resolved user's** token to
 *   the AUTH-03 `authenticate` bridge with the original first-factor
 *   `referenceType`. The pre-MFA token is never read, and no
 *   `getIdToken(true)` shortcut exists.
 * - `clear()` drops the resolver reference and marks the challenge inactive.
 *
 * The resolver, the submitted code, and any assertion material are transient
 * component-memory only: never written to web storage, URLs, logs, analytics,
 * or reports, and never sent to Cloud Functions (the AUTH-03 bridge receives
 * only the raw Firebase ID token).
 */
import { getMultiFactorResolver, TotpMultiFactorGenerator } from "firebase/auth";
import type {
  Auth,
  MultiFactorError,
  MultiFactorResolver,
  TotpMultiFactorAssertion,
} from "firebase/auth";
import {
  authenticate,
  type AuthenticateDeps,
  type AuthenticateOutcome,
} from "../authenticateClient";
import type { AuthProviderId } from "../providerConfig";

/** The exact Firebase error code that means a second factor is required. */
export const MFA_REQUIRED_ERROR_CODE = "auth/multi-factor-auth-required";

/** Standard TOTP code length (matches the enrollment `TotpSecret.codeLength` fact). */
export const MFA_CHALLENGE_CODE_LENGTH = 6;

/** Bounded failure classification of a TOTP challenge attempt. */
export type MfaChallengeErrorCategory = "invalid-code" | "session-expired" | "other";

/**
 * Fail-closed marker: no usable TOTP challenge exists for this account — either
 * the resolver exposes no TOTP factor, or it exposes more than one (ambiguous,
 * unsupported). The panel maps this to `auth_forbidden`; no challenge UI, no
 * AUTH-03 bridge, and no downgrade ever follow (`AUTH-MFA-003C-CORR-001`).
 */
export class MfaChallengeUnavailableError extends Error {
  constructor() {
    super("mfa-challenge-unavailable");
    this.name = "MfaChallengeUnavailableError";
  }
}

/**
 * Injectable challenge SDK surface (mirrors `MfaSdkDeps` in `mfaSdkFlow.ts`).
 * Defaults to the real SDK; injected only in tests.
 */
export type MfaChallengeSdkDeps = {
  getResolver: (auth: Auth, error: MultiFactorError) => MultiFactorResolver;
  TotpMultiFactorGenerator: {
    FACTOR_ID: string;
    assertionForSignIn: (enrollmentId: string, oneTimePassword: string) => TotpMultiFactorAssertion;
  };
};

export const defaultMfaChallengeSdkDeps: MfaChallengeSdkDeps = {
  getResolver: getMultiFactorResolver,
  TotpMultiFactorGenerator: {
    FACTOR_ID: TotpMultiFactorGenerator.FACTOR_ID,
    assertionForSignIn: TotpMultiFactorGenerator.assertionForSignIn,
  },
};

/** True only for the exact MFA-required Firebase error code (never message text). */
export function isMfaRequiredError(error: unknown): boolean {
  return (error as { code?: unknown } | undefined)?.code === MFA_REQUIRED_ERROR_CODE;
}

/**
 * False only for the set of known firebase second-factor resolution outcomes;
 * everything unexpected collapses to `"other"` (never a raw SDK message).
 */
export function classifyMfaChallengeError(error: unknown): MfaChallengeErrorCategory {
  const code = (error as { code?: unknown } | undefined)?.code;
  if (code === "auth/invalid-verification-code") return "invalid-code";
  if (code === "auth/invalid-multi-factor-session" || code === "auth/multi-factor-info-not-found") {
    return "session-expired";
  }
  return "other";
}

/**
 * The bounded challenge result a flow returns instead of throwing when
 * Firebase raises `auth/multi-factor-auth-required`. Holds the resolver and
 * bridge deps transiently; `submit` is the only path that resolves sign-in
 * and bridges to AUTH-03, and `clear` releases the resolver.
 */
export type PendingMfaChallenge = {
  readonly kind: "mfa-challenge";
  submit: (oneTimePassword: string) => Promise<AuthenticateOutcome>;
  clear: () => void;
};

export function isPendingMfaChallenge(value: unknown): value is PendingMfaChallenge {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    (value as { kind?: unknown }).kind === "mfa-challenge"
  );
}

export type CreatePendingMfaChallengeArgs = {
  auth: Auth;
  /** The caught error (already matched by `isMfaRequiredError` by the caller). */
  error: unknown;
  referenceType: AuthProviderId;
  /** The AUTH-03 bridge deps carried forward into `submit`. */
  deps: AuthenticateDeps;
  /** Test seam — defaults to the real SDK. */
  sdk?: MfaChallengeSdkDeps;
};

/**
 * Builds the bounded challenge from the MFA-required error, fail-closed:
 * throws {@link MfaChallengeUnavailableError} (no bypass) unless the resolver
 * exposes **exactly one** TOTP factor. Zero supported TOTP hints and an
 * ambiguous multiple-TOTP configuration are both treated as an unavailable
 * challenge — no challenge UI, no AUTH-03 bridge, no downgrade, and no
 * silent first-factor selection (`AUTH-MFA-003C-CORR-001`).
 */
export function createPendingMfaChallenge({
  auth,
  error,
  referenceType,
  deps,
  sdk = defaultMfaChallengeSdkDeps,
}: CreatePendingMfaChallengeArgs): PendingMfaChallenge {
  const resolver = sdk.getResolver(auth, error as MultiFactorError);
  const totpHints = resolver.hints.filter(
    (hint) => hint.factorId === sdk.TotpMultiFactorGenerator.FACTOR_ID,
  );
  if (totpHints.length !== 1) {
    throw new MfaChallengeUnavailableError();
  }
  const enrollmentId = totpHints[0].uid;

  // Mutable holder so `clear()` can drop the resolver reference entirely.
  let holder: { resolver: MultiFactorResolver } | null = { resolver };
  let active = true;

  const submit = async (oneTimePassword: string): Promise<AuthenticateOutcome> => {
    if (!active || !holder) throw new MfaChallengeUnavailableError();
    const assertion = sdk.TotpMultiFactorGenerator.assertionForSignIn(
      enrollmentId,
      oneTimePassword,
    );
    const credential = await holder.resolver.resolveSignIn(assertion);
    return authenticate({ getIdToken: () => credential.user.getIdToken(), referenceType }, deps);
  };

  const clear = () => {
    active = false;
    holder = null;
  };

  return { kind: "mfa-challenge", submit, clear };
}
