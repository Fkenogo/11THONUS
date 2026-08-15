import { describe, expect, it } from "vitest";
import {
  PermissionDomainError,
  invalidRoleError,
  invalidPermissionIdError,
  unrecognisedSensitivePermissionError,
  sensitivePermissionCannotBeImplicitInRoleTemplateError,
  duplicatePermissionInRoleTemplateError,
  sensitivePermissionNotDefaultForRoleError,
  malformedPermissionOverrideDirectionError,
  permissionOverrideCannotTargetOwnerError,
  invalidPermissionOverrideScopeError,
  permissionOverrideDirectionNotSupportedError,
  permissionOverrideRoleNotEligibleForGrantError,
} from "./permissionErrors";
import { ERROR_CATEGORIES } from "../../../shared/errors/errorCategories";

describe("PermissionDomainError", () => {
  it("is a real Error subclass carrying a category", () => {
    const error = new PermissionDomainError("VALIDATION_FAILED", "example message");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("PermissionDomainError");
    expect(error.category).toBe("VALIDATION_FAILED");
    expect(error.message).toBe("example message");
  });

  it.each([
    invalidRoleError("bad"),
    invalidPermissionIdError("bad"),
    unrecognisedSensitivePermissionError("bad"),
    sensitivePermissionCannotBeImplicitInRoleTemplateError("owner", "staff.manage"),
    duplicatePermissionInRoleTemplateError("staff", "purchase.record"),
    sensitivePermissionNotDefaultForRoleError("staff", "customer.viewProtectedProfile"),
    malformedPermissionOverrideDirectionError("bad"),
    permissionOverrideCannotTargetOwnerError("staff.manage"),
    invalidPermissionOverrideScopeError("businessId"),
    permissionOverrideDirectionNotSupportedError("business.transferOwnership", "grant"),
    permissionOverrideRoleNotEligibleForGrantError(
      "business.configureFraudRules",
      "staff",
      "manager",
    ),
  ])("maps to one of the closed 14 error categories", (error) => {
    expect(ERROR_CATEGORIES).toContain(error.category);
  });

  it("never uses AUTH_FORBIDDEN — this domain is a contract layer, not an evaluator", () => {
    const factories = [
      invalidRoleError("bad"),
      invalidPermissionIdError("bad"),
      unrecognisedSensitivePermissionError("bad"),
      sensitivePermissionCannotBeImplicitInRoleTemplateError("owner", "staff.manage"),
      duplicatePermissionInRoleTemplateError("staff", "purchase.record"),
      sensitivePermissionNotDefaultForRoleError("staff", "customer.viewProtectedProfile"),
      malformedPermissionOverrideDirectionError("bad"),
      permissionOverrideCannotTargetOwnerError("staff.manage"),
      invalidPermissionOverrideScopeError("businessId"),
      permissionOverrideDirectionNotSupportedError("business.transferOwnership", "grant"),
      permissionOverrideRoleNotEligibleForGrantError(
        "business.configureFraudRules",
        "staff",
        "manager",
      ),
    ];
    for (const error of factories) {
      expect(error.category).not.toBe("AUTH_FORBIDDEN");
    }
  });
});
