import { describe, expect, it } from "vitest";
import { isEntitledToAcceptInvitation, type VerifiedContact } from "./invitationEntitlement";
import type { AuthenticationReference } from "../../identity/models/authenticationReference";

function reference(overrides: Partial<AuthenticationReference> = {}): AuthenticationReference {
  return {
    referenceId: "uid_1", // a Firebase Auth UID — never a literal email/phone (see module comment)
    referenceType: "email",
    linkStatus: "linked",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    createdBy: null,
    ...overrides,
  };
}

/** A fake lookup keyed by UID — mirrors how the real one resolves a UID to a live Firebase Auth record. */
function fakeLookup(byUid: Record<string, VerifiedContact | undefined>) {
  return async (uid: string): Promise<VerifiedContact | undefined> => byUid[uid];
}

describe("isEntitledToAcceptInvitation", () => {
  it("matches when the reference's UID resolves to the same verified email", async () => {
    const result = await isEntitledToAcceptInvitation(
      { type: "email", value: "user@example.com" },
      [reference({ referenceId: "uid_1" })],
      fakeLookup({ uid_1: { type: "email", value: "user@example.com" } }),
    );
    expect(result).toBe(true);
  });

  it("matches email case-insensitively", async () => {
    const result = await isEntitledToAcceptInvitation(
      { type: "email", value: "User@Example.com" },
      [reference({ referenceId: "uid_1" })],
      fakeLookup({ uid_1: { type: "email", value: "user@example.com" } }),
    );
    expect(result).toBe(true);
  });

  it("matches a linked phone_otp reference for a phone-type delivery target", async () => {
    const result = await isEntitledToAcceptInvitation(
      { type: "phone", value: "+15551234567" },
      [reference({ referenceType: "phone_otp", referenceId: "uid_2" })],
      fakeLookup({ uid_2: { type: "phone", value: "+15551234567" } }),
    );
    expect(result).toBe(true);
  });

  it("does not match when the resolved contact type differs from the delivery type", async () => {
    const result = await isEntitledToAcceptInvitation(
      { type: "email", value: "+15551234567" },
      [reference({ referenceType: "phone_otp", referenceId: "uid_2" })],
      fakeLookup({ uid_2: { type: "phone", value: "+15551234567" } }),
    );
    expect(result).toBe(false);
  });

  it("does not match an unlinked (unlinked-status) reference — lookup is never even called for it", async () => {
    let called = false;
    const lookup = async (): Promise<VerifiedContact | undefined> => {
      called = true;
      return { type: "email" as const, value: "user@example.com" };
    };
    const result = await isEntitledToAcceptInvitation(
      { type: "email", value: "user@example.com" },
      [reference({ linkStatus: "unlinked", referenceId: "uid_1" })],
      lookup,
    );
    expect(result).toBe(false);
    expect(called).toBe(false);
  });

  it("does not match when the lookup resolves a different verified value", async () => {
    const result = await isEntitledToAcceptInvitation(
      { type: "email", value: "someone-else@example.com" },
      [reference({ referenceId: "uid_1" })],
      fakeLookup({ uid_1: { type: "email", value: "user@example.com" } }),
    );
    expect(result).toBe(false);
  });

  it("does not match google_sign_in or future_provider reference types", async () => {
    let called = false;
    const lookup = async (): Promise<VerifiedContact | undefined> => {
      called = true;
      return { type: "email" as const, value: "user@example.com" };
    };
    const result = await isEntitledToAcceptInvitation(
      { type: "email", value: "user@example.com" },
      [reference({ referenceType: "google_sign_in", referenceId: "uid_3" })],
      lookup,
    );
    expect(result).toBe(false);
    expect(called).toBe(false);
  });

  it("returns false for an empty authentication reference list (lookup never called)", async () => {
    let called = false;
    const lookup = async (): Promise<VerifiedContact | undefined> => {
      called = true;
      return undefined;
    };
    const result = await isEntitledToAcceptInvitation(
      { type: "email", value: "user@example.com" },
      [],
      lookup,
    );
    expect(result).toBe(false);
    expect(called).toBe(false);
  });

  it("fails closed when the lookup returns undefined (e.g. unknown/deleted Firebase user, or unverified email)", async () => {
    const result = await isEntitledToAcceptInvitation(
      { type: "email", value: "user@example.com" },
      [reference({ referenceId: "uid_1" })],
      fakeLookup({ uid_1: undefined }),
    );
    expect(result).toBe(false);
  });

  it("does not mutate the input reference list or values", async () => {
    const refs = [reference({ referenceId: "uid_1" })];
    const snapshot = structuredClone(refs);
    await isEntitledToAcceptInvitation(
      { type: "email", value: "user@example.com" },
      refs,
      fakeLookup({ uid_1: { type: "email", value: "user@example.com" } }),
    );
    expect(refs).toEqual(snapshot);
  });
});
