import { describe, expect, it } from "vitest";
import { isEntitledToAcceptInvitation } from "./invitationEntitlement";
import type { AuthenticationReference } from "../../identity/models/authenticationReference";

function reference(overrides: Partial<AuthenticationReference> = {}): AuthenticationReference {
  return {
    referenceId: "user@example.com",
    referenceType: "email",
    linkStatus: "linked",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    createdBy: null,
    ...overrides,
  };
}

describe("isEntitledToAcceptInvitation", () => {
  it("matches an exact, linked email reference", () => {
    const result = isEntitledToAcceptInvitation({ type: "email", value: "user@example.com" }, [
      reference(),
    ]);
    expect(result).toBe(true);
  });

  it("matches email case-insensitively", () => {
    const result = isEntitledToAcceptInvitation({ type: "email", value: "User@Example.com" }, [
      reference({ referenceId: "user@example.com" }),
    ]);
    expect(result).toBe(true);
  });

  it("matches a linked phone_otp reference for a phone-type delivery target", () => {
    const result = isEntitledToAcceptInvitation({ type: "phone", value: "+15551234567" }, [
      reference({ referenceType: "phone_otp", referenceId: "+15551234567" }),
    ]);
    expect(result).toBe(true);
  });

  it("does not match a phone reference against an email delivery target", () => {
    const result = isEntitledToAcceptInvitation({ type: "email", value: "+15551234567" }, [
      reference({ referenceType: "phone_otp", referenceId: "+15551234567" }),
    ]);
    expect(result).toBe(false);
  });

  it("does not match an unlinked (unlinked-status) reference", () => {
    const result = isEntitledToAcceptInvitation({ type: "email", value: "user@example.com" }, [
      reference({ linkStatus: "unlinked" }),
    ]);
    expect(result).toBe(false);
  });

  it("does not match a different value", () => {
    const result = isEntitledToAcceptInvitation(
      { type: "email", value: "someone-else@example.com" },
      [reference({ referenceId: "user@example.com" })],
    );
    expect(result).toBe(false);
  });

  it("does not match google_sign_in or future_provider reference types", () => {
    const result = isEntitledToAcceptInvitation({ type: "email", value: "user@example.com" }, [
      reference({ referenceType: "google_sign_in", referenceId: "user@example.com" }),
    ]);
    expect(result).toBe(false);
  });

  it("returns false for an empty authentication reference list", () => {
    const result = isEntitledToAcceptInvitation({ type: "email", value: "user@example.com" }, []);
    expect(result).toBe(false);
  });

  it("does not mutate the input reference list or values", () => {
    const refs = [reference({ referenceId: "  User@Example.com  " })];
    const snapshot = structuredClone(refs);
    isEntitledToAcceptInvitation({ type: "email", value: "user@example.com" }, refs);
    expect(refs).toEqual(snapshot);
  });
});
