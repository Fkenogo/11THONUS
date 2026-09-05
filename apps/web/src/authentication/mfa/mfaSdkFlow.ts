/**
 * SDK isolation for the `AUTH-MFA-003B` TOTP enrollment flow
 * (`AUTH-MFA-002` §8.1 steps 4a–4g).
 *
 * Every Firebase Auth SDK call the enrollment surface needs is confined to
 * this module, behind an injectable dependency seam so the whole flow is
 * unit-testable without live transport (the Firebase Auth Emulator cannot
 * execute TOTP enrollment). The enrolled factor is always the single `totp`
 * factor named `"Platform Admin TOTP"` (`DEC-SEC-004` TOTP-only policy).
 *
 * Secret handling: the returned {@link EnrollmentPreview} carries the SDK's
 * `TotpSecret` only for the transient membership enrollment step — callers
 * must drop the reference after `completeEnrollment` (success), on cancel, on
 * navigation, and on terminal error. This module never stores, logs,
 * transmits, or persists the secret, and the caller's page never writes it to
 * any storage or report.
 */

import {
  multiFactor as multiFactorSdk,
  TotpMultiFactorGenerator as TotpMultiFactorGeneratorSdk,
  type MultiFactorAssertion,
  type MultiFactorSession,
  type MultiFactorUser,
  type TotpSecret,
  type User,
} from "firebase/auth";

/** The TOTP issuer line encoded into the enrollment QR URI (Key-Uri-Format). */
export const TOTP_ISSUER = "11thONUS";

/** The display name every platform-administrator TOTP factor is enrolled as. */
export const MFA_FACTOR_DISPLAY_NAME = "Platform Admin TOTP";

export type TotpGeneratorApi = {
  FACTOR_ID: string;
  generateSecret: (session: MultiFactorSession) => Promise<TotpSecret>;
  assertionForEnrollment: (secret: TotpSecret, oneTimePassword: string) => MultiFactorAssertion;
};

export type MfaSdkDeps = {
  multiFactor: (user: User) => MultiFactorUser;
  TotpMultiFactorGenerator: TotpGeneratorApi;
};

export const defaultMfaSdkDeps: MfaSdkDeps = {
  multiFactor: multiFactorSdk,
  TotpMultiFactorGenerator: {
    FACTOR_ID: TotpMultiFactorGeneratorSdk.FACTOR_ID,
    generateSecret: TotpMultiFactorGeneratorSdk.generateSecret,
    assertionForEnrollment: TotpMultiFactorGeneratorSdk.assertionForEnrollment,
  },
};

/**
 * The transient, in-memory enrollment material plus the display material the
 * setup step renders (QR URI and manual entry key). Dropping the `secret`
 * reference discards the enrollment material.
 */
export type EnrollmentPreview = {
  secret: TotpSecret;
  qrCodeUrl: string;
  secretKey: string;
  codeLength: number;
  codeIntervalSeconds: number;
};

export type MfaEnrollmentFlow = {
  hasEnrolledTotpFactor: (user: User) => boolean;
  startEnrollment: (user: User) => Promise<EnrollmentPreview>;
  completeEnrollment: (user: User, secret: TotpSecret, oneTimePassword: string) => Promise<void>;
};

export function createMfaEnrollmentFlow(deps: MfaSdkDeps = defaultMfaSdkDeps): MfaEnrollmentFlow {
  const hasEnrolledTotpFactor = (user: User): boolean =>
    deps
      .multiFactor(user)
      .enrolledFactors.some(
        (factor) => factor.factorId === deps.TotpMultiFactorGenerator.FACTOR_ID,
      );

  const startEnrollment = async (user: User): Promise<EnrollmentPreview> => {
    const mfaUser = deps.multiFactor(user);
    const session = await mfaUser.getSession();
    const secret = await deps.TotpMultiFactorGenerator.generateSecret(session);
    return {
      secret,
      qrCodeUrl: secret.generateQrCodeUrl(user.email ?? undefined, TOTP_ISSUER),
      secretKey: secret.secretKey,
      codeLength: secret.codeLength,
      codeIntervalSeconds: secret.codeIntervalSeconds,
    };
  };

  const completeEnrollment = async (
    user: User,
    secret: TotpSecret,
    oneTimePassword: string,
  ): Promise<void> => {
    const assertion = deps.TotpMultiFactorGenerator.assertionForEnrollment(secret, oneTimePassword);
    await deps.multiFactor(user).enroll(assertion, MFA_FACTOR_DISPLAY_NAME);
  };

  return { hasEnrolledTotpFactor, startEnrollment, completeEnrollment };
}

/**
 * True when the thrown enrollment error is the verified-email precondition
 * (`auth/unverified-email`). Keeps the SDK error vocabulary inside this module
 * so the page never needs to know Firebase enum names.
 */
export function isEnrollmentEmailUnverifiedError(error: unknown): boolean {
  return (error as { code?: unknown } | undefined)?.code === "auth/unverified-email";
}
