/**
 * Permission contracts domain errors (`ENG-P2-004A`).
 *
 * Domain-local error type, structurally compatible with the shared
 * `DomainCommandError` (`functions/src/shared/commands/commandDispatcher.ts`)
 * — same `category`/`message`/`fieldErrors` shape — but defined here
 * independently so this domain layer never imports `commandDispatcher.ts`
 * (same rationale as `identityErrors.ts`).
 *
 * Every category used here is one of the existing, closed 14 categories
 * `functions/src/shared/errors/errorCategories.ts` defines (TRD11 §11.35)
 * — no new category is introduced (`ENG-P2-004-DESIGN-001` §17 AD-4).
 *
 * `ENG-P2-004A` is a contract/configuration layer, not the runtime
 * evaluator (`ENG-P2-004B`): every error here is a construction-time
 * validation failure of a contract value (a malformed permission id, an
 * invalid role, a template/override that violates a structural
 * invariant) — never an authorization allow/deny outcome. `AUTH_FORBIDDEN`
 * is deliberately unused in this file for that reason.
 */

import type { ErrorCategory } from "../../../shared/errors/errorCategories";
import type { PlatformFieldError } from "../../../shared/errors/platformError";

export class PermissionDomainError extends Error {
  readonly category: ErrorCategory;
  readonly fieldErrors?: PlatformFieldError[];

  constructor(category: ErrorCategory, message: string, fieldErrors?: PlatformFieldError[]) {
    super(message);
    this.name = "PermissionDomainError";
    this.category = category;
    this.fieldErrors = fieldErrors;
  }
}

export function invalidRoleError(value: string): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `Invalid role: "${value}" is not a recognised role (must be "owner", "manager", or "staff").`,
  );
}

export function invalidPermissionIdError(value: string): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `Invalid permission identifier: "${value}" must be a non-empty, dot-namespaced string (e.g. "staff.manage").`,
  );
}

export function unrecognisedSensitivePermissionError(value: string): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `"${value}" is not a governed Sensitive Permission Catalogue entry.`,
  );
}

export function sensitivePermissionCannotBeImplicitInRoleTemplateError(
  role: string,
  permissionId: string,
): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `Sensitive permission "${permissionId}" cannot appear in the "${role}" role template's default permissions — sensitive permissions are never granted implicitly by role/template inheritance (DEC-ID-003).`,
  );
}

export function duplicatePermissionInRoleTemplateError(
  role: string,
  permissionId: string,
): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `Role template "${role}" lists permission "${permissionId}" more than once.`,
  );
}

export function malformedPermissionOverrideDirectionError(value: string): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `Invalid permission override direction: "${value}" must be "grant" or "revoke".`,
  );
}

export function permissionOverrideCannotTargetOwnerError(
  permissionId: string,
): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `Permission override for "${permissionId}" cannot target an Owner membership — Owner's effective sensitive-permission set is structural, not overridable (ENG-P2-004-DESIGN-001 §3.6).`,
  );
}

export function invalidPermissionOverrideScopeError(field: string): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `Invalid permission override: "${field}" must be a non-empty, non-whitespace string.`,
  );
}
