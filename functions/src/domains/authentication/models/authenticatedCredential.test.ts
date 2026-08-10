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

  // AUTH-07 additive extension (authorized): the trusted server-derived
  // *authentication* instant (Firebase `auth_time`), distinct from `verifiedAt`
  // (the token-verification instant). Optional at the contract level so the
  // extension is non-breaking for existing consumers; production credentials
  // always carry it (the AUTH-02 verifier populates it and fails closed
  // otherwise). AUTH-07 uses it for privileged-operation freshness.
  it("surfaces a trusted authenticatedAt distinct from verifiedAt", () => {
    const authenticatedAt = new Date("2026-08-08T09:55:00.000Z");
    const credential = createAuthenticatedCredential({
      referenceType: "phone_otp",
      referenceId: "authuid_1",
      verifiedAt,
      authenticatedAt,
    });
    expect(credential.authenticatedAt).toEqual(authenticatedAt);
    expect(credential.verifiedAt).toEqual(verifiedAt);
    expect(credential.authenticatedAt).not.toEqual(credential.verifiedAt);
  });

  it("leaves authenticatedAt undefined when not supplied (non-breaking, optional)", () => {
    const credential = createAuthenticatedCredential({
      referenceType: "phone_otp",
      referenceId: "authuid_1",
      verifiedAt,
    });
    expect(credential.authenticatedAt).toBeUndefined();
  });

  it("rejects an invalid authenticatedAt when supplied", () => {
    expect(() =>
      createAuthenticatedCredential({
        referenceType: "phone_otp",
        referenceId: "authuid_1",
        verifiedAt,
        authenticatedAt: new Date("not-a-date"),
      }),
    ).toThrow(AuthenticationDomainError);
  });
});
