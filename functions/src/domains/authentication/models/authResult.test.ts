import { describe, expect, it } from "vitest";
import { resolvedAuthResult, unregisteredAuthResult, type AuthResult } from "./authResult";
import { createAuthenticatedCredential } from "./authenticatedCredential";
import { AuthenticationDomainError } from "./authenticationErrors";

const credential = createAuthenticatedCredential({
  referenceType: "phone_otp",
  referenceId: "authuid_1",
  verifiedAt: new Date("2026-08-08T10:00:00.000Z"),
});

describe("AuthResult", () => {
  it("represents a resolved credential → an existing identity", () => {
    const result: AuthResult = resolvedAuthResult("ci_123", credential);
    expect(result.outcome).toBe("resolved");
    if (result.outcome === "resolved") {
      expect(result.customerIdentityId).toBe("ci_123");
      expect(result.credential).toBe(credential);
    }
  });

  it("represents a verified credential with no existing identity (registration path)", () => {
    const result: AuthResult = unregisteredAuthResult(credential);
    expect(result.outcome).toBe("unregistered");
    expect("customerIdentityId" in result).toBe(false);
    if (result.outcome === "unregistered") {
      expect(result.credential).toBe(credential);
    }
  });

  it("rejects a resolved result with an empty identity binding", () => {
    expect(() => resolvedAuthResult("", credential)).toThrow(AuthenticationDomainError);
  });
});
