/**
 * Platform Administration domain errors (`ENG-P3-003A`).
 *
 * Domain-local error type, structurally compatible with the shared
 * `DomainCommandError` shape (same `category`/`message`/`fieldErrors`),
 * defined independently so this domain never imports the shared command
 * dispatcher — same rationale as `permissionErrors.ts`/`identityErrors.ts`.
 *
 * Every category used here is one of the existing, closed 14 categories
 * in `functions/src/shared/errors/errorCategories.ts` (TRD11 §11.35) — no
 * new category is introduced.
 */

import type { ErrorCategory } from "../../../shared/errors/errorCategories";
import type { PlatformFieldError } from "../../../shared/errors/platformError";

export class PlatformAdministrationDomainError extends Error {
  readonly category: ErrorCategory;
  readonly fieldErrors?: PlatformFieldError[];

  constructor(category: ErrorCategory, message: string, fieldErrors?: PlatformFieldError[]) {
    super(message);
    this.name = "PlatformAdministrationDomainError";
    this.category = category;
    this.fieldErrors = fieldErrors;
  }
}

export function invalidPlatformAdministratorRoleError(
  value: string,
): PlatformAdministrationDomainError {
  return new PlatformAdministrationDomainError(
    "VALIDATION_FAILED",
    `"${value}" is not one of the Founder-approved Knowledge Studio MVP roles ("knowledge_editor", "knowledge_approver") — FD-KS-1/DEC-GOV-011 does not activate any other TRD18 administrator role.`,
  );
}

export function invalidKnowledgePermissionIdError(
  value: string,
): PlatformAdministrationDomainError {
  return new PlatformAdministrationDomainError(
    "VALIDATION_FAILED",
    `"${value}" is not a governed Knowledge Studio permission identifier.`,
  );
}

export function invalidPlatformAdministratorStatusError(
  value: string,
): PlatformAdministrationDomainError {
  return new PlatformAdministrationDomainError(
    "VALIDATION_FAILED",
    `"${value}" is not a recognised platform-administrator status (must be "invited", "active", "suspended", or "removed").`,
  );
}

export function invalidPlatformAdministratorFieldError(
  field: string,
  value: string,
): PlatformAdministrationDomainError {
  return new PlatformAdministrationDomainError(
    "VALIDATION_FAILED",
    `Invalid platform-administrator field "${field}": "${value}" is not acceptable.`,
    [{ field, code: "invalid", messageKey: "platformAdministrator.field.invalid" }],
  );
}

export function emptyPlatformAdministratorRolesError(): PlatformAdministrationDomainError {
  return new PlatformAdministrationDomainError(
    "VALIDATION_FAILED",
    "A platform administrator must hold at least one role.",
  );
}

export function invalidPlatformAdministratorLifecycleTransitionError(
  currentStatus: string,
  action: string,
): PlatformAdministrationDomainError {
  return new PlatformAdministrationDomainError(
    "INVALID_STATE_TRANSITION",
    `Cannot "${action}" a platform administrator currently in status "${currentStatus}".`,
  );
}

export function platformAdministratorNotFoundError(): PlatformAdministrationDomainError {
  return new PlatformAdministrationDomainError(
    "RESOURCE_NOT_FOUND",
    "Platform administrator record does not exist.",
  );
}

/**
 * Bootstrap idempotency conflict (`ENG-P3-003A`, `FD-KS-1` bootstrap
 * requirement): a `platformAdministrators/{userId}` document already exists
 * with a materially different identity (roles) or a non-`active` status
 * (i.e. it was deliberately suspended/removed since it was first bootstrapped).
 * Mirrors `seedContentConflictError`'s fail-closed-on-mismatch discipline —
 * a retried bootstrap call never silently overwrites divergent state.
 */
export function platformAdministratorBootstrapConflictError(
  userId: string,
): PlatformAdministrationDomainError {
  return new PlatformAdministrationDomainError(
    "IDEMPOTENCY_CONFLICT",
    `A platform administrator record for "${userId}" already exists with a different role set or a non-active status — bootstrap refuses to silently overwrite it.`,
  );
}

export function platformAdministratorConfigMalformedError(): PlatformAdministrationDomainError {
  return new PlatformAdministrationDomainError(
    "AUTH_FORBIDDEN",
    "Platform administrator document failed structural validation — refusing to authorize against malformed state.",
  );
}
