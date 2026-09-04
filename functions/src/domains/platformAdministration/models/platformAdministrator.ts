/**
 * `PlatformAdministrator` domain model (`ENG-P3-003A`).
 *
 * TRD18 §18.10's `PlatformAdministratorDocument` schema, reproduced per
 * `ENG-P3-003-DESIGN-001` §6 (Class B, `FD-KS-1`/`DEC-GOV-011`-approved):
 * a platform-administration identity entirely disjoint from Business
 * membership (`ENG-P2-002`/`003`/`004`'s `Role`/`BusinessMembershipDocument`
 * are never read or written by this domain, and vice versa —
 * `ENG-P3-001-DESIGN-001` §13.2's finding that these are two different
 * authorization worlds).
 *
 * `permissions: string[]` (TRD18's own "explicit grants beyond role
 * defaults" field) is **not implemented** — `FD-KS-1` approved no
 * per-administrator override mechanism for Knowledge Studio MVP
 * (`knowledgePermissionCatalogue.ts`'s header note). Effective permissions
 * are role defaults only; adding an override field is a future,
 * separately-authorized decision, not silently introduced here.
 */

import type { PlatformAdministratorRole } from "./platformAdministratorRole";
import { createPlatformAdministratorRole } from "./platformAdministratorRole";
import type { PlatformAdministratorStatus } from "./platformAdministratorStatus";
import {
  emptyPlatformAdministratorRolesError,
  invalidPlatformAdministratorFieldError,
} from "./platformAdministrationErrors";

export type PlatformAdministrator = {
  readonly userId: string;
  readonly roles: readonly PlatformAdministratorRole[];
  readonly status: PlatformAdministratorStatus;
  /**
   * TRD18 §18.10's declared field. Always `true` for MVP — `DEC-SEC-002`
   * requires MFA for every platform administrator unconditionally; this is
   * not a per-administrator opt-out. It records the *requirement*, never
   * *compliance* — the evaluator (`evaluateKnowledgePlatformPermission.ts`)
   * never treats this field alone as proof MFA was satisfied for a given
   * request (see that module's own header for why).
   */
  readonly mfaRequired: true;
  /** Free-text operator reference (e.g. an operator's own identifier/email) — audit-only, never authorization input. */
  readonly invitedBy: string;
  readonly approvedBy?: string;
  readonly activatedAt?: Date;
  readonly suspendedAt?: Date;
  readonly removedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly schemaVersion: number;
};

export type CreatePlatformAdministratorParams = {
  userId: string;
  roles: readonly string[];
  invitedBy: string;
  approvedBy?: string;
  now: Date;
};

function requireNonBlank(field: string, value: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw invalidPlatformAdministratorFieldError(field, String(value));
  }
  return value;
}

/**
 * Constructs a new, `active` platform administrator — the shape both the
 * bootstrap path (`bootstrapPlatformAdministrator.ts`) and any future
 * invite-and-approve path would produce. There is no `invited`-status
 * constructor here: TRD18's `invited` state is reachable only by a future,
 * separately-authorized invitation command this package does not build
 * (mirrors `staffMembershipLifecycle.ts`'s own note that `invited` is a
 * recognised-but-not-yet-reachable-by-this-package status for the
 * structurally identical Business-membership enum).
 */
export function createPlatformAdministrator(
  params: CreatePlatformAdministratorParams,
): PlatformAdministrator {
  const userId = requireNonBlank("userId", params.userId);
  const invitedBy = requireNonBlank("invitedBy", params.invitedBy);

  if (params.roles.length === 0) {
    throw emptyPlatformAdministratorRolesError();
  }
  const roles: PlatformAdministratorRole[] = [];
  for (const rawRole of params.roles) {
    const role = createPlatformAdministratorRole(rawRole);
    if (!roles.includes(role)) {
      roles.push(role);
    }
  }

  return {
    userId,
    roles,
    status: "active",
    mfaRequired: true,
    invitedBy,
    ...(params.approvedBy !== undefined ? { approvedBy: params.approvedBy } : {}),
    activatedAt: params.now,
    createdAt: params.now,
    updatedAt: params.now,
    schemaVersion: 1,
  };
}

/**
 * Two `PlatformAdministrator` role sets are the "same identity" for
 * bootstrap-idempotency purposes (`platformAdministratorBootstrapConflictError`)
 * when they contain exactly the same roles, order-independent.
 */
export function hasSameRoles(
  a: readonly PlatformAdministratorRole[],
  b: readonly PlatformAdministratorRole[],
): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((role) => setB.has(role));
}
