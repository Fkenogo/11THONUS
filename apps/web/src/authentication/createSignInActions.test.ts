import { describe, expect, it, vi } from "vitest";
import { createSignInActions } from "./createSignInActions";
import type { AuthenticateOutcome, CallAuthenticate } from "./authenticateClient";
import type { PhoneConfirmation } from "./phoneSignInFlow";

const outcome: AuthenticateOutcome = {
  mode: "signed_in",
  customerIdentityId: "cid",
  session: {
    customerIdentityId: "cid",
    authReference: { referenceType: "phone_otp", referenceId: "uid" },
    issuedAt: "2026-08-09T00:00:00.000Z",
  },
};

const platform = { auth: { id: "auth" } as never, functions: { id: "fns" } as never };
const callAuthenticate: CallAuthenticate = async () => outcome;

describe("createSignInActions", () => {
  it("resolves the enabled providers from the flag source (disabled by default)", () => {
    expect(
      createSignInActions(platform, {
        flagSource: {},
        getRecaptchaVerifier: () => ({}) as never,
        callAuthenticate,
      }).enabledProviders.size,
    ).toBe(0);

    expect([
      ...createSignInActions(platform, {
        flagSource: { VITE_AUTH_ENABLE_PHONE_OTP: "true" },
        getRecaptchaVerifier: () => ({}) as never,
        callAuthenticate,
      }).enabledProviders,
    ]).toEqual(["phone_otp"]);
  });

  it("wires the Google action to the platform auth and callable", async () => {
    const runGoogle = vi.fn(async () => outcome);
    const actions = createSignInActions(platform, {
      flagSource: { VITE_AUTH_ENABLE_GOOGLE_SIGN_IN: "true" },
      getRecaptchaVerifier: () => ({}) as never,
      callAuthenticate,
      runGoogle,
    });

    const result = await actions.signInWithGoogle();

    expect(runGoogle).toHaveBeenCalledWith(platform.auth, { callAuthenticate });
    expect(result).toEqual(outcome);
  });

  it("wires the phone send action to auth, number, and a fresh reCAPTCHA verifier", async () => {
    const verifier = { kind: "verifier" } as never;
    const confirmation = { confirm: vi.fn() } as unknown as PhoneConfirmation;
    const runStartPhone = vi.fn(async () => confirmation);
    const actions = createSignInActions(platform, {
      flagSource: { VITE_AUTH_ENABLE_PHONE_OTP: "true" },
      getRecaptchaVerifier: () => verifier,
      callAuthenticate,
      runStartPhone,
    });

    const result = await actions.sendPhoneCode("+25760000000");

    expect(runStartPhone).toHaveBeenCalledWith(platform.auth, "+25760000000", verifier);
    expect(result).toBe(confirmation);
  });

  it("wires the phone confirm action to the confirmation, code, and callable", async () => {
    const confirmation = { confirm: vi.fn() } as unknown as PhoneConfirmation;
    const runConfirmPhone = vi.fn(async () => outcome);
    const actions = createSignInActions(platform, {
      flagSource: { VITE_AUTH_ENABLE_PHONE_OTP: "true" },
      getRecaptchaVerifier: () => ({}) as never,
      callAuthenticate,
      runConfirmPhone,
    });

    const result = await actions.confirmPhoneCode(confirmation, "123456");

    expect(runConfirmPhone).toHaveBeenCalledWith(confirmation, "123456", { callAuthenticate });
    expect(result).toEqual(outcome);
  });
});
