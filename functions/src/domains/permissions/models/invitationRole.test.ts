import { describe, it, expect } from "vitest";
import { createInvitationRole, isInvitationRole, INVITATION_ROLES } from "./invitationRole";

describe("invitationRole", () => {
  it("INVITATION_ROLES excludes owner", () => {
    expect(INVITATION_ROLES).toEqual(["manager", "staff"]);
  });

  it("createInvitationRole accepts manager", () => {
    expect(createInvitationRole("manager")).toBe("manager");
  });

  it("createInvitationRole accepts staff", () => {
    expect(createInvitationRole("staff")).toBe("staff");
  });

  it("createInvitationRole rejects owner", () => {
    expect(() => createInvitationRole("owner")).toThrow(/owner/i);
  });

  it("createInvitationRole rejects an unknown value", () => {
    expect(() => createInvitationRole("superadmin")).toThrow();
  });

  it("isInvitationRole is false for owner", () => {
    expect(isInvitationRole("owner")).toBe(false);
  });
});
