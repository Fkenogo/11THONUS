import { describe, expect, it } from "vitest";
import { createPlatformAdministrator, hasSameRoles } from "./platformAdministrator";
import { PlatformAdministrationDomainError } from "./platformAdministrationErrors";

const NOW = new Date("2026-09-03T00:00:00.000Z");

describe("createPlatformAdministrator", () => {
  it("creates an active administrator with the given roles", () => {
    const admin = createPlatformAdministrator({
      userId: "user_123",
      roles: ["knowledge_editor"],
      invitedBy: "operator:founder",
      now: NOW,
    });
    expect(admin.status).toBe("active");
    expect(admin.roles).toEqual(["knowledge_editor"]);
    expect(admin.mfaRequired).toBe(true);
    expect(admin.activatedAt).toEqual(NOW);
    expect(admin.createdAt).toEqual(NOW);
  });

  it("de-duplicates repeated roles", () => {
    const admin = createPlatformAdministrator({
      userId: "user_123",
      roles: ["knowledge_editor", "knowledge_editor"],
      invitedBy: "operator:founder",
      now: NOW,
    });
    expect(admin.roles).toEqual(["knowledge_editor"]);
  });

  it("accepts both approved roles together", () => {
    const admin = createPlatformAdministrator({
      userId: "user_123",
      roles: ["knowledge_editor", "knowledge_approver"],
      invitedBy: "operator:founder",
      now: NOW,
    });
    expect(admin.roles).toEqual(["knowledge_editor", "knowledge_approver"]);
  });

  it("rejects an empty role list", () => {
    expect(() =>
      createPlatformAdministrator({
        userId: "user_123",
        roles: [],
        invitedBy: "operator:founder",
        now: NOW,
      }),
    ).toThrow(PlatformAdministrationDomainError);
  });

  it("rejects an unapproved TRD18 role", () => {
    expect(() =>
      createPlatformAdministrator({
        userId: "user_123",
        roles: ["platform_super_administrator"],
        invitedBy: "operator:founder",
        now: NOW,
      }),
    ).toThrow(PlatformAdministrationDomainError);
  });

  it("rejects a blank userId or invitedBy", () => {
    expect(() =>
      createPlatformAdministrator({
        userId: "  ",
        roles: ["knowledge_editor"],
        invitedBy: "op",
        now: NOW,
      }),
    ).toThrow(PlatformAdministrationDomainError);
    expect(() =>
      createPlatformAdministrator({
        userId: "user_123",
        roles: ["knowledge_editor"],
        invitedBy: "",
        now: NOW,
      }),
    ).toThrow(PlatformAdministrationDomainError);
  });
});

describe("hasSameRoles", () => {
  it("is true for identical sets regardless of order", () => {
    expect(
      hasSameRoles(
        ["knowledge_editor", "knowledge_approver"],
        ["knowledge_approver", "knowledge_editor"],
      ),
    ).toBe(true);
  });

  it("is false for different sets", () => {
    expect(hasSameRoles(["knowledge_editor"], ["knowledge_approver"])).toBe(false);
    expect(hasSameRoles(["knowledge_editor"], ["knowledge_editor", "knowledge_approver"])).toBe(
      false,
    );
  });
});
