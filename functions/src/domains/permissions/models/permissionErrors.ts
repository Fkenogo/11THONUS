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

/**
 * `ENG-P2-003B` command-layer errors (invitation persistence/acceptance).
 *
 * Unlike the contract-construction errors above, these are runtime command
 * outcomes (INVITE/REVOKE/ACCEPT) — `AUTH_FORBIDDEN` and
 * `IDEMPOTENCY_CONFLICT` are used here deliberately, per the closed-taxonomy
 * mapping `ENG-P2-003-DESIGN-001` §16.3's addendum table records. No new
 * error category is introduced.
 */

export function invitationNotFoundError(): PermissionDomainError {
  return new PermissionDomainError(
    "RESOURCE_NOT_FOUND",
    "Invitation reference does not resolve to a pending invitation.",
  );
}

export function invitationExpiredError(): PermissionDomainError {
  return new PermissionDomainError(
    "RESOURCE_NOT_FOUND",
    "Invitation has expired and can no longer be accepted (ENG-P2-003-DESIGN-001 FD-4-STAFF).",
  );
}

export function invitationRevokedError(): PermissionDomainError {
  return new PermissionDomainError(
    "RESOURCE_NOT_FOUND",
    "Invitation has been revoked and can no longer be accepted.",
  );
}

export function invitationAlreadyAcceptedError(): PermissionDomainError {
  return new PermissionDomainError(
    "IDEMPOTENCY_CONFLICT",
    "Invitation has already been accepted and cannot be consumed again (single-use, FD-4-STAFF).",
  );
}

export function invitationAcceptanceEntitlementDeniedError(): PermissionDomainError {
  return new PermissionDomainError(
    "AUTH_FORBIDDEN",
    "The authenticated identity is not entitled to accept this invitation — its verified contact information does not match the invitation's delivery target (ENG-P2-003-DESIGN-001 FD-3-STAFF).",
  );
}

export function duplicateBusinessMembershipError(): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    "An active or suspended membership already exists for this identity in this Business.",
  );
}

export function invitationTargetNotPermittedForActorError(
  actorRole: string,
  targetRole: string,
): PermissionDomainError {
  return new PermissionDomainError(
    "AUTH_FORBIDDEN",
    `A "${actorRole}" holding staff.manage may not invite a "${targetRole}" — Manager-held staff.manage is restricted to Staff-target invitations only (ENG-P2-003-DESIGN-001 §11.6.1/FD-5-STAFF).`,
  );
}

export function invitationAlreadyPendingError(): PermissionDomainError {
  return new PermissionDomainError(
    "VALIDATION_FAILED",
    "A pending invitation already exists for this delivery target in this Business.",
  );
}

export function invitationCrossBusinessMismatchError(): PermissionDomainError {
  return new PermissionDomainError(
    "AUTH_FORBIDDEN",
    "Invitation does not belong to the requested Business context.",
  );
}

/**
 * `ENG-P3-002A` addendum (design §21/§25/§39): the caller has no active
 * membership in the requested Business — used by the Staff list-query read
 * transport (`staffTransportReadService.ts`). Deliberately
 * indistinguishable, client-facing, from "this Business does not exist"
 * (enumeration resistance, mirrors `businessReadNotAuthorizedError`'s
 * identical posture in the Business domain).
 */
export function staffReadNotAuthorizedError(): PermissionDomainError {
  return new PermissionDomainError("RESOURCE_NOT_FOUND", "Business was not found.");
}

export function membershipReadTransientFailureError(): PermissionDomainError {
  return new PermissionDomainError(
    "TEMPORARY_UNAVAILABLE",
    "Could not verify existing membership state; please retry.",
  );
}

/*
 * ENG-P2-003C — Staff Membership Lifecycle & Role Management command
 * errors. Same closed-taxonomy discipline as every error above — every
 * category used below is one of the existing 14 categories
 * (`functions/src/shared/errors/errorCategories.ts`), mapped per
 * `ENG-P2-003-DESIGN-001` §16.3's addendum error-taxonomy table (never a
 * new category).
 */

export function targetMembershipNotFoundError(): PermissionDomainError {
  return new PermissionDomainError("RESOURCE_NOT_FOUND", "Target membership does not exist.");
}

/**
 * Cross-business isolation (Phase V/§13): a target `membershipId` that
 * exists but does not belong to the authorized Business context. Mapped to
 * `AUTH_FORBIDDEN`, not `RESOURCE_NOT_FOUND` — the design's own boundary
 * discipline (§13) is to never leak whether a given membership id exists at
 * all to a caller unauthorized for a different Business.
 */
export function membershipCrossBusinessMismatchError(): PermissionDomainError {
  return new PermissionDomainError(
    "AUTH_FORBIDDEN",
    "Target membership does not belong to the authorized Business context.",
  );
}

/**
 * `staffMembershipTargetPolicy.ts`'s `staff.manage` target matrix (§11.6.1)
 * was violated — e.g. a Manager targeting another Manager, any actor
 * targeting the Owner, or self-action. Deferred to `AUTH_FORBIDDEN` per the
 * design's error-taxonomy table ("Unauthorized staff-management target").
 */
export function staffManagementTargetNotPermittedError(): PermissionDomainError {
  return new PermissionDomainError(
    "AUTH_FORBIDDEN",
    "Actor is not permitted to administer this target membership (ENG-P2-003-DESIGN-001 §11.6.1).",
  );
}

/**
 * `staffMembershipTargetPolicy.ts`'s `staff.assignRole` target matrix
 * (§11.6.2) was violated — e.g. a non-Owner actor, an Owner target, or
 * self-role-change. Deferred to `AUTH_FORBIDDEN` per the design's
 * error-taxonomy table ("Role-assignment denied").
 */
export function roleChangeTargetNotPermittedError(): PermissionDomainError {
  return new PermissionDomainError(
    "AUTH_FORBIDDEN",
    "Actor is not permitted to change this target membership's role (ENG-P2-003-DESIGN-001 §11.6.2).",
  );
}

/**
 * The target membership's current status does not permit the requested
 * lifecycle action (`staffMembershipLifecycle.ts`'s closed transition
 * table) — e.g. suspending an already-suspended or removed membership,
 * reactivating an active or removed membership, or removing an
 * already-removed membership. Mapped to `INVALID_STATE_TRANSITION` per the
 * design's error-taxonomy table ("Membership inactive").
 */
export function invalidMembershipLifecycleTransitionError(
  currentStatus: string,
  action: string,
): PermissionDomainError {
  return new PermissionDomainError(
    "INVALID_STATE_TRANSITION",
    `Cannot "${action}" a membership currently in status "${currentStatus}" (ENG-P2-003-DESIGN-001 §5.3).`,
  );
}

/**
 * The role-change request's `fromRole` does not match the target
 * membership's live, currently-persisted role (TOCTOU-safe re-check inside
 * the same transaction that reads it) — the requested role change is stale
 * or was constructed against outdated data.
 */
export function roleChangeFromRoleMismatchError(): PermissionDomainError {
  return new PermissionDomainError(
    "INVALID_STATE_TRANSITION",
    "Target membership's current role no longer matches the role-change request's expected starting role.",
  );
}

/*
 * `ENG-P2-003D` — Staff Permission Override Administration command errors.
 * Same closed-taxonomy discipline as every error above — every category
 * used below is one of the existing 14 categories
 * (`functions/src/shared/errors/errorCategories.ts`), never a new one.
 * Founder dispositions FD-003D-1/FD-003D-2 (`ENG-P2-003-DESIGN-001` §29)
 * govern the conditions these errors represent.
 */

/**
 * The target membership's current status (FD-003D-2, §29) does not permit
 * the requested grant/revoke: `removed`/`invited` permit neither; `suspended`
 * permits `revoke` only (authority may be reduced, never staged for later
 * reactivation). Mapped to `INVALID_STATE_TRANSITION`, mirroring
 * `invalidMembershipLifecycleTransitionError`'s existing status-gated-action
 * pattern.
 */
export function overrideAdminTargetStatusNotPermittedError(
  status: string,
  direction: string,
): PermissionDomainError {
  return new PermissionDomainError(
    "INVALID_STATE_TRANSITION",
    `Cannot "${direction}" a permission override for a target membership currently in status "${status}" (ENG-P2-003-DESIGN-001 §29, FD-003D-2).`,
  );
}

/**
 * The target membership's `permissions[]` already contains more than one
 * structurally-valid record for the requested `permissionId` — contradictory
 * or duplicate persisted override state that `ENG-P2-003D` did not create
 * (FD-003D-1 requires at most one current override per permission). This is
 * a server data-integrity condition, not a normal validation failure — it
 * fails closed rather than being silently repaired, mirroring the
 * evaluator's own malformed-config-denies-closed discipline
 * (`evaluatePermission.ts`'s `MEMBERSHIP_CONFIG_MALFORMED`/
 * `MALFORMED_OVERRIDE_DIRECTION` handling), hence `AUTH_FORBIDDEN`.
 */
export function overrideAdminMalformedExistingOverrideStateError(): PermissionDomainError {
  return new PermissionDomainError(
    "AUTH_FORBIDDEN",
    "Target membership's persisted permission overrides already contain more than one record for this permission — refusing to mutate malformed state (ENG-P2-003-DESIGN-001 §29, FD-003D-1).",
  );
}

/**
 * The target membership document itself failed structural parsing (the same
 * fail-closed condition `evaluatePermission.ts` treats as
 * `MEMBERSHIP_CONFIG_MALFORMED`) — distinct from `targetMembershipNotFoundError`,
 * which means no document exists at all.
 */
export function targetMembershipConfigMalformedError(): PermissionDomainError {
  return new PermissionDomainError(
    "AUTH_FORBIDDEN",
    "Target membership document failed structural validation.",
  );
}
