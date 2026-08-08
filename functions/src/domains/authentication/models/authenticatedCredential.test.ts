import { describe, expect, it } from "vitest";
import {
  createAuthenticatedCredential,
  type AuthenticatedCredential,
} from "./authenticatedCredential";
import { AuthenticationDomainError } from "./authenticationErrors";

const verifiedAt = new Date("2026-08-08T10:00:00.000Z");

describe("createAuthenticatedCredential", () => {
  it("constructs a provider-neutral verified credential", () => {
    const credential = createAuthenticatedCredential({
      referenceType: "phone_otp",
      referenceId: "authuid_1",
      verifiedAt,
    });
    expect(credential.referenceType).toBe("phone_otp");
    expect(credential.referenceId).toBe("authuid_1");
    expect(credential.verifiedAt).toEqual(verifiedAt);
    expect(credential.providerSignals).toEqual({});
  });

  it("reuses the merged Customer Identity provider vocabulary (google_sign_in)", () => {
    const credential = createAuthenticatedCredential({
      referenceType: "google_sign_in",
      referenceId: "authuid_2",
      verifiedAt,
      providerSignals: { emailVerified: true },
    });
    expect(credential.referenceType).toBe("google_sign_in");
    expect(credential.providerSignals).toEqual({ emailVerified: true });
  });

  it("never carries credential material (token/secret) — only a reference", () => {
    const credential = createAuthenticatedCredential({
      referenceType: "phone_otp",
      referenceId: "authuid_1",
      verifiedAt,
    }) as AuthenticatedCredential & Record<string, unknown>;
    expect("token" in credential).toBe(false);
    expect("idToken" in credential).toBe(false);
    expect("otp" in credential).toBe(false);
    expect("secret" in credential).toBe(false);
  });

  it("rejects an empty reference id", () => {
    expect(() =>
      createAuthenticatedCredential({ referenceType: "phone_otp", referenceId: "  ", verifiedAt }),
    ).toThrow(AuthenticationDomainError);
  });

  it("rejects an invalid verifiedAt", () => {
    expect(() =>
      createAuthenticatedCredential({
        referenceType: "phone_otp",
        referenceId: "authuid_1",
        verifiedAt: new Date("not-a-date"),
      }),
    ).toThrow(AuthenticationDomainError);
  });
});
