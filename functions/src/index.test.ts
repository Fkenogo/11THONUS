import { describe, expect, it } from "vitest";
import { MVP_REFERENCE_TYPES } from "./index";

/**
 * Regression guard for the callable-boundary provider allow-list
 * (`parseAuthenticateRequest`/`parseReferenceType` gate every
 * authenticate/link/unlink/recovery request against this set before token
 * verification). It must mirror the Founder MVP provider policy
 * (`AUTH-CORR-003`: Google + Email/Password + optional Phone OTP); a missing
 * entry would reject that provider with `invalid-argument` end-to-end.
 */
describe("MVP_REFERENCE_TYPES (callable boundary allow-list)", () => {
  it("accepts exactly the MVP providers incl. email [AUTH-CORR-003]", () => {
    expect([...MVP_REFERENCE_TYPES].sort()).toEqual(["email", "google_sign_in", "phone_otp"]);
  });

  it("admits `email` so Email/Password requests reach verification", () => {
    expect(MVP_REFERENCE_TYPES.has("email")).toBe(true);
  });

  it("still rejects deferred providers (fail closed)", () => {
    expect(MVP_REFERENCE_TYPES.has("future_provider")).toBe(false);
  });
});
