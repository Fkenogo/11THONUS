import { describe, expect, it } from "vitest";
import { createSessionContext, type SessionContext } from "./sessionContext";
import { createAuthenticatedCredential } from "./authenticatedCredential";
import { AuthenticationDomainError } from "./authenticationErrors";

const credential = createAuthenticatedCredential({
  referenceType: "google_sign_in",
  referenceId: "authuid_9",
  verifiedAt: new Date("2026-08-08T10:00:00.000Z"),
});
const issuedAt = new Date("2026-08-08T10:00:01.000Z");

describe("createSessionContext", () => {
  it("constructs the resolved access context for an authenticated action", () => {
    const context: SessionContext = createSessionContext({
      customerIdentityId: "ci_123",
      credential,
      issuedAt,
    });
    expect(context.customerIdentityId).toBe("ci_123");
    expect(context.authReference).toEqual({
      referenceType: "google_sign_in",
      referenceId: "authuid_9",
    });
    expect(context.issuedAt).toEqual(issuedAt);
  });

  it("carries only a reference — never credential material", () => {
    const context = createSessionContext({
      customerIdentityId: "ci_123",
      credential,
      issuedAt,
    }) as Record<string, unknown>;
    expect("token" in context).toBe(false);
    expect("credential" in context).toBe(false);
  });

  it("rejects an empty identity binding", () => {
    expect(() => createSessionContext({ customerIdentityId: "", credential, issuedAt })).toThrow(
      AuthenticationDomainError,
    );
  });

  it("rejects an invalid issuedAt", () => {
    expect(() =>
      createSessionContext({
        customerIdentityId: "ci_123",
        credential,
        issuedAt: new Date("nope"),
      }),
    ).toThrow(AuthenticationDomainError);
  });
});
