import { describe, expect, it } from "vitest";
import {
  AUTH_PROVIDER_IDS,
  isAuthProviderEnabled,
  resolveEnabledAuthProviders,
} from "./providerConfig";

/**
 * AUTH-BP §15 / §3: the provider registry is closed (MVP = Phone OTP + Google)
 * and every provider is **disabled by default**. A provider is enabled only when
 * its explicit flag is exactly "true"; anything else fails closed. This keeps
 * provider scope from creeping (deferred email/Apple/passkeys, D-A2) and stops a
 * misconfigured build from silently exposing a live sign-in path.
 */
describe("AUTH_PROVIDER_IDS", () => {
  it("is the closed MVP registry (google_sign_in, email, phone_otp) only [AUTH-CORR-003]", () => {
    expect([...AUTH_PROVIDER_IDS].sort()).toEqual(["email", "google_sign_in", "phone_otp"]);
  });
});

describe("isAuthProviderEnabled — disabled by default, fail closed", () => {
  it("is disabled when the flag is absent", () => {
    expect(isAuthProviderEnabled({}, "phone_otp")).toBe(false);
    expect(isAuthProviderEnabled({}, "google_sign_in")).toBe(false);
    expect(isAuthProviderEnabled({}, "email")).toBe(false);
    expect(isAuthProviderEnabled({ VITE_AUTH_ENABLE_EMAIL_PASSWORD: "true" }, "email")).toBe(true);
  });

  it('is enabled only when the explicit flag is exactly "true"', () => {
    expect(isAuthProviderEnabled({ VITE_AUTH_ENABLE_PHONE_OTP: "true" }, "phone_otp")).toBe(true);
    expect(
      isAuthProviderEnabled({ VITE_AUTH_ENABLE_GOOGLE_SIGN_IN: "true" }, "google_sign_in"),
    ).toBe(true);
  });

  it('fails closed for any non-"true" value (false, 1, TRUE, empty)', () => {
    for (const value of ["false", "1", "TRUE", "", "yes"]) {
      expect(isAuthProviderEnabled({ VITE_AUTH_ENABLE_PHONE_OTP: value }, "phone_otp")).toBe(false);
    }
  });

  it("does not cross-enable providers (phone flag never enables google)", () => {
    expect(isAuthProviderEnabled({ VITE_AUTH_ENABLE_PHONE_OTP: "true" }, "google_sign_in")).toBe(
      false,
    );
  });
});

describe("resolveEnabledAuthProviders", () => {
  it("returns an empty set by default", () => {
    expect(resolveEnabledAuthProviders({}).size).toBe(0);
  });

  it("returns only the explicitly enabled providers", () => {
    const enabled = resolveEnabledAuthProviders({ VITE_AUTH_ENABLE_GOOGLE_SIGN_IN: "true" });
    expect([...enabled]).toEqual(["google_sign_in"]);
  });
});
