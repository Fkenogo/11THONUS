import { describe, expect, it } from "vitest";
import { createAuthenticationReference } from "./authenticationReference";
import { IdentityDomainError } from "./identityErrors";

describe("createAuthenticationReference", () => {
  it("creates a reference carrying only a provider-independent id, type, link status and attribution", () => {
    const createdAt = new Date("2026-08-02T00:00:00.000Z");
    const reference = createAuthenticationReference({
      referenceId: "authuid_abc123",
      referenceType: "phone_otp",
      createdAt,
      createdBy: "system",
    });

    expect(reference).toEqual({
      referenceId: "authuid_abc123",
      referenceType: "phone_otp",
      linkStatus: "linked",
      createdAt,
      createdBy: "system",
    });
  });

  it("rejects an empty referenceId", () => {
    expect(() =>
      createAuthenticationReference({
        referenceId: "",
        referenceType: "phone_otp",
        createdAt: new Date(),
        createdBy: "system",
      }),
    ).toThrow(IdentityDomainError);
  });

  it("does not accept any field resembling a raw credential", () => {
    const reference = createAuthenticationReference({
      referenceId: "authuid_abc123",
      referenceType: "google_sign_in",
      createdAt: new Date(),
      createdBy: null,
    });

    expect(Object.keys(reference).sort()).toEqual(
      ["createdAt", "createdBy", "linkStatus", "referenceId", "referenceType"].sort(),
    );
  });
});
