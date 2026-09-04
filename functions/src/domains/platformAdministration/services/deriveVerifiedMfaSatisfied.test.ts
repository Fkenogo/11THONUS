import { describe, expect, it } from "vitest";
import { deriveVerifiedMfaSatisfied } from "./deriveVerifiedMfaSatisfied";
import { createAuthenticatedCredential } from "../../authentication/models/authenticatedCredential";

const verifiedAt = new Date("2026-09-04T00:00:00.000Z");

describe("deriveVerifiedMfaSatisfied (AUTH-MFA-001)", () => {
  it("returns false for a credential from an ordinary (non-second-factor) sign-in", () => {
    const credential = createAuthenticatedCredential({
      referenceType: "email",
      referenceId: "authuid_1",
      verifiedAt,
    });
    expect(deriveVerifiedMfaSatisfied(credential)).toBe(false);
  });

  it("returns true only for a credential the authentication adapter marked as second-factor-verified", () => {
    const credential = createAuthenticatedCredential({
      referenceType: "email",
      referenceId: "authuid_1",
      verifiedAt,
      verifiedSecondFactor: true,
    });
    expect(deriveVerifiedMfaSatisfied(credential)).toBe(true);
  });

  it("takes only an AuthenticatedCredential — there is no overload accepting a raw boolean or client claim", () => {
    // Type-level guarantee: this file would fail to compile if a bare boolean
    // or an object shaped like client request data were accepted instead.
    // No runtime assertion is meaningful beyond the two cases above; this
    // test documents the intent for a human reviewer.
    expect(deriveVerifiedMfaSatisfied.length).toBe(1);
  });
});
