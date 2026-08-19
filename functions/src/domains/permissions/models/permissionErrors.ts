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

export function unrecognisedOrdinaryPermissionError(value: string): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `"${value}" is not a governed Ordinary Permission Catalogue entry (ENG-P2-004-CORR-001).`,
  );
}

export function permissionCannotBeBothSensitiveAndOrdinaryError(
  permissionId: string,
): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `"${permissionId}" cannot appear in both the Sensitive and Ordinary Permission Catalogues — the two are structurally disjoint by design (ENG-P2-004-CORR-001, FD-CORR-2).`,
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

export function sensitivePermissionNotDefaultForRoleError(
  role: string,
  permissionId: string,
): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `Sensitive permission "${permissionId}" cannot appear in the "${role}" role template's defaults — its governed default state does not include this role (ENG-P2-004-DESIGN-001 §3.2).`,
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

export function permissionOverrideDirectionNotSupportedError(
  permissionId: string,
  direction: string,
): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `Permission "${permissionId}" does not support the "${direction}" override direction (ENG-P2-004-DESIGN-001 §3.2's catalogue marks it unsupported for this permission).`,
  );
}

export function permissionOverrideRoleNotEligibleForGrantError(
  permissionId: string,
  targetRole: string,
  eligibleRole: string | null,
): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `Permission "${permissionId}" cannot be explicitly granted to role "${targetRole}" — ENG-P2-004-DESIGN-001 §3.2 names only "${eligibleRole ?? "no role"}" as eligible for an explicit grant of this permission.`,
  );
}

/*
 * ENG-P2-003A — Business Membership Invitation domain errors.
 *
 * Same closed-taxonomy discipline as every error above: every category
 * used below is one of the existing 14 categories
 * (`functions/src/shared/errors/errorCategories.ts`), never a new one
 * (ENG-P2-003-DESIGN-001 §16.3's error-taxonomy mapping). These are all
 * construction-time contract-validation failures (malformed invitation
 * field, invalid lifecycle transition, disallowed intended role) — never
 * an authorization allow/deny outcome, matching this file's own header
 * discipline for `AUTH_FORBIDDEN`.
 */

export function invalidInvitationFieldError(field: string, value: string): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `Invalid invitation field "${field}": "${value}" is not acceptable.`,
    [{ field, code: "invalid", messageKey: "invitation.field.invalid" }],
  );
}

export function ownerCannotBeInvitationRoleError(): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `Invalid invitation intended role: "owner" can never be an invitation's intended role — ownership is never assigned by invitation (ENG-P2-003-DESIGN-001 §11.4).`,
  );
}

export function invalidInvitationDeliveryTypeError(value: string): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `Invalid invitation delivery type: "${value}" is not a supported delivery channel (must be "email" or "phone").`,
  );
}

export function invalidInvitationDeliveryTargetError(field: string): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `Invalid invitation delivery target: "${field}" must be a non-empty, non-whitespace string.`,
  );
}

export function invalidInvitationStatusError(value: string): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `Invalid invitation status: "${value}" is not a recognised invitation lifecycle state (must be "pending", "accepted", "revoked", or "expired").`,
  );
}

export function invalidInvitationStatusTransitionError(
  from: string,
  to: string,
): PermissionDomainError {
  return new PermissionDomainError(
    "INVALID_STATE_TRANSITION",
    `Invalid invitation status transition: "${from}" -> "${to}" is not a permitted invitation lifecycle transition (ENG-P2-003-DESIGN-001 §7.2a).`,
  );
}

export function invalidInvitationTimestampError(field: string): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `Invalid invitation timestamp: "${field}" must be a valid date.`,
  );
}

export function invitationExpiryNotAfterIssuedError(): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `Invalid invitation expiry: "expiresAt" must be strictly after "invitedAt".`,
  );
}

export function invalidRoleChangeRequestError(reason: string): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    `Invalid staff role-change request: ${reason}.`,
  );
}
