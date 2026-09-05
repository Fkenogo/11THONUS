import { describe, expect, it, vi } from "vitest";
import type {
  MultiFactorAssertion,
  MultiFactorInfo,
  MultiFactorSession,
  MultiFactorUser,
  TotpSecret,
  User,
} from "firebase/auth";
import {
  createMfaEnrollmentFlow,
  isEnrollmentEmailUnverifiedError,
  MFA_FACTOR_DISPLAY_NAME,
  TOTP_ISSUER,
  type MfaSdkDeps,
} from "./mfaSdkFlow";

function makeFakeSecret(secretKey = "BASE32SECRETKEY"): TotpSecret {
  return {
    secretKey,
    hashingAlgorithm: "SHA1",
    codeLength: 6,
    codeIntervalSeconds: 30,
    enrollmentCompletionDeadline: "2030-01-01T00:00:00Z",
    generateQrCodeUrl: (accountName?: string, issuer?: string) =>
      `otpauth://totp/${issuer ?? "?"}:${accountName ?? "?"}?secret=${secretKey}&algorithm=SHA1&digits=6&period=30`,
  } as unknown as TotpSecret;
}

function makeFakeUser(email?: string): User {
  return { email } as unknown as User;
}

function factor(factorId: string): MultiFactorInfo {
  return {
    factorId,
    uid: "factor-1",
    enrollmentTime: "2026-01-01T00:00:00Z",
  } as unknown as MultiFactorInfo;
}

function makeFakeMfaUser(
  enrolled: MultiFactorInfo[] = [],
  session: MultiFactorSession = {} as MultiFactorSession,
) {
  const getSession = vi.fn(async () => session);
  const enroll = vi.fn(async () => {});
  return { enrolledFactors: enrolled, getSession, enroll } as unknown as MultiFactorUser;
}

function makeDeps(mfaUser: MultiFactorUser, secret: TotpSecret) {
  const multiFactor = vi.fn(() => mfaUser);
  const generateSecret = vi.fn(async () => secret);
  const assertionForEnrollment = vi.fn((): MultiFactorAssertion => ({}) as MultiFactorAssertion);
  const deps: MfaSdkDeps = {
    multiFactor,
    TotpMultiFactorGenerator: {
      FACTOR_ID: "totp",
      generateSecret,
      assertionForEnrollment,
    },
  };
  return { deps, multiFactor, generateSecret, assertionForEnrollment };
}

describe("createMfaEnrollmentFlow — factor detection", () => {
  it("reports false when the current user has no enrolled TOTP factor", () => {
    const mfaUser = makeFakeMfaUser([]);
    const { deps } = makeDeps(mfaUser, makeFakeSecret());
    const flow = createMfaEnrollmentFlow(deps);
    expect(flow.hasEnrolledTotpFactor(makeFakeUser())).toBe(false);
  });

  it("reports true when the current user has an enrolled TOTP factor", () => {
    const mfaUser = makeFakeMfaUser([factor("totp")]);
    const { deps } = makeDeps(mfaUser, makeFakeSecret());
    const flow = createMfaEnrollmentFlow(deps);
    expect(flow.hasEnrolledTotpFactor(makeFakeUser())).toBe(true);
  });

  it("reports false for a non-TOTP factor (e.g. SMS), never misdetecting it", () => {
    const mfaUser = makeFakeMfaUser([factor("sms")]);
    const { deps } = makeDeps(mfaUser, makeFakeSecret());
    const flow = createMfaEnrollmentFlow(deps);
    expect(flow.hasEnrolledTotpFactor(makeFakeUser())).toBe(false);
  });
});

describe("createMfaEnrollmentFlow — startEnrollment", () => {
  it("obtains a MultiFactorSession then generates a TotpSecret", async () => {
    const session = {} as MultiFactorSession;
    const mfaUser = makeFakeMfaUser([], session);
    const secret = makeFakeSecret("ABC123");
    const { deps, multiFactor, generateSecret } = makeDeps(mfaUser, secret);
    const flow = createMfaEnrollmentFlow(deps);

    const preview = await flow.startEnrollment(makeFakeUser());

    expect(multiFactor).toHaveBeenCalledTimes(1);
    expect(mfaUser.getSession).toHaveBeenCalledTimes(1);
    expect(generateSecret).toHaveBeenCalledWith(session);
    expect(preview.secret).toBe(secret);
    expect(preview.secretKey).toBe("ABC123");
    expect(preview.codeLength).toBe(6);
    expect(preview.codeIntervalSeconds).toBe(30);
  });

  it("builds the QR URI with the user email as accountName and 11thONUS as issuer", async () => {
    const mfaUser = makeFakeMfaUser([]);
    const secret = makeFakeSecret("QRKEY123");
    const { deps } = makeDeps(mfaUser, secret);
    const flow = createMfaEnrollmentFlow(deps);

    const preview = await flow.startEnrollment(makeFakeUser("admin@example.com"));

    expect(preview.qrCodeUrl).toContain(`otpauth://totp/${TOTP_ISSUER}:admin@example.com`);
    expect(preview.qrCodeUrl).toContain("secret=QRKEY123");
  });

  it("passes no accountName when the user has no email", async () => {
    const mfaUser = makeFakeMfaUser([]);
    const secret = makeFakeSecret();
    const { deps } = makeDeps(mfaUser, secret);
    const flow = createMfaEnrollmentFlow(deps);

    const preview = await flow.startEnrollment(makeFakeUser());

    expect(preview.qrCodeUrl).toBe(secret.generateQrCodeUrl(undefined, TOTP_ISSUER));
  });
});

describe("createMfaEnrollmentFlow — completeEnrollment", () => {
  it("builds the TOTP assertion from the secret and otp, then enrolls with the governed factor display name", async () => {
    const mfaUser = makeFakeMfaUser([]);
    const secret = makeFakeSecret("ENROLLKEY");
    const { deps, assertionForEnrollment } = makeDeps(mfaUser, secret);
    const flow = createMfaEnrollmentFlow(deps);

    await flow.completeEnrollment(makeFakeUser(), secret, "123456");

    expect(assertionForEnrollment).toHaveBeenCalledWith(secret, "123456");
    expect(mfaUser.enroll).toHaveBeenCalledWith(expect.anything(), MFA_FACTOR_DISPLAY_NAME);
  });
});

describe("isEnrollmentEmailUnverifiedError", () => {
  it("recognises the Firebase verified-email precondition error", () => {
    expect(isEnrollmentEmailUnverifiedError({ code: "auth/unverified-email" })).toBe(true);
  });

  it("returns false for every other error (code, raw, or non-object)", () => {
    expect(isEnrollmentEmailUnverifiedError({ code: "auth/invalid-verification-code" })).toBe(
      false,
    );
    expect(isEnrollmentEmailUnverifiedError(new Error("boom"))).toBe(false);
    expect(isEnrollmentEmailUnverifiedError(undefined)).toBe(false);
    expect(isEnrollmentEmailUnverifiedError(null)).toBe(false);
  });
});
