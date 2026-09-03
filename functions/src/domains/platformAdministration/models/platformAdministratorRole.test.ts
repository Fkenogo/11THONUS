import { describe, expect, it } from "vitest";
import {
  PLATFORM_ADMINISTRATOR_ROLES,
  createPlatformAdministratorRole,
  isPlatformAdministratorRole,
} from "./platformAdministratorRole";
import { PlatformAdministrationDomainError } from "./platformAdministrationErrors";

describe("platformAdministratorRole", () => {
  it("exposes exactly the two FD-KS-1-approved roles, no more", () => {
    expect(PLATFORM_ADMINISTRATOR_ROLES).toEqual(["knowledge_editor", "knowledge_approver"]);
  });

  it("accepts each approved role", () => {
    expect(createPlatformAdministratorRole("knowledge_editor")).toBe("knowledge_editor");
    expect(createPlatformAdministratorRole("knowledge_approver")).toBe("knowledge_approver");
  });

  it("rejects platform_super_administrator — not approved by FD-KS-1", () => {
    expect(isPlatformAdministratorRole("platform_super_administrator")).toBe(false);
    expect(() => createPlatformAdministratorRole("platform_super_administrator")).toThrow(
      PlatformAdministrationDomainError,
    );
  });

  it("rejects every other TRD18 role not activated by FD-KS-1", () => {
    for (const role of [
      "business_operations_administrator",
      "subscription_administrator",
      "trust_and_review_administrator",
      "rules_author",
      "rules_approver",
      "support_agent",
      "reporting_administrator",
      "security_administrator",
    ]) {
      expect(isPlatformAdministratorRole(role)).toBe(false);
    }
  });

  it("rejects an arbitrary/garbage string", () => {
    expect(() => createPlatformAdministratorRole("owner")).toThrow(
      PlatformAdministrationDomainError,
    );
    expect(() => createPlatformAdministratorRole("")).toThrow(PlatformAdministrationDomainError);
  });
});
