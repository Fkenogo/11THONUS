/**
 * Explicit permission-override contract (`ENG-P2-004A`).
 *
 * Represents one explicit, per-membership grant or revocation
 * (`ENG-P2-004-DESIGN-001` §4.1.3/§4.1.5, §8's `PermissionOverride`
 * concept) — the *input* `ENG-P2-004B`'s evaluator will later resolve.
 * This module only validates and represents that input unambiguously; it
 * does **not** implement override-resolution precedence, does not decide
 * allow/deny, and is not itself persisted anywhere (persistence is
 * `businessMemberships.permissions[]`, TRD10 §10.6.4 — an existing,
 * unmodified field this module does not touch).
 *
 * Scoped to `(businessId, membershipId)` per design §5 — an override is
 * never global. `role` is accepted only to enforce the one structural
 * invariant this contract layer owns (design §3.6, §8: an override
 * "cannot target Owner membership"); it is not stored as part of the
 * override's own shape, since `ENG-P2-004A` does not own the membership
 * record itself.
 */

import type { PermissionId } from "./permissionId";
import { isWellFormedPermissionId } from "./permissionId";
import type { Role } from "./role";
import {
  invalidPermissionIdError,
  malformedPermissionOverrideDirectionError,
  permissionOverrideCannotTargetOwnerError,
  invalidPermissionOverrideScopeError,
} from "./permissionErrors";

export const PERMISSION_OVERRIDE_DIRECTIONS = ["grant", "revoke"] as const;

export type PermissionOverrideDirection = (typeof PERMISSION_OVERRIDE_DIRECTIONS)[number];

export type PermissionOverride = {
  readonly permissionId: PermissionId;
  readonly direction: PermissionOverrideDirection;
  readonly businessId: string;
  readonly membershipId: string;
  readonly grantedBy: string;
  readonly grantedAt: Date;
};

export type CreatePermissionOverrideInput = {
  permissionId: string;
  direction: string;
  businessId: string;
  membershipId: string;
  grantedBy: string;
  grantedAt: Date;
  /**
   * The role of the membership this override targets. Required only to
   * enforce the "cannot target Owner" invariant at construction time —
   * not stored on the returned `PermissionOverride`.
   */
  targetRole: Role;
};

function requireNonBlank(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw invalidPermissionOverrideScopeError(field);
  }
}

export function createPermissionOverride(input: CreatePermissionOverrideInput): PermissionOverride {
  if (!isWellFormedPermissionId(input.permissionId)) {
    throw invalidPermissionIdError(input.permissionId);
  }
  if (!(PERMISSION_OVERRIDE_DIRECTIONS as readonly string[]).includes(input.direction)) {
    throw malformedPermissionOverrideDirectionError(input.direction);
  }
  requireNonBlank(input.businessId, "businessId");
  requireNonBlank(input.membershipId, "membershipId");
  requireNonBlank(input.grantedBy, "grantedBy");

  if (input.targetRole === "owner") {
    throw permissionOverrideCannotTargetOwnerError(input.permissionId);
  }

  return {
    permissionId: input.permissionId,
    direction: input.direction as PermissionOverrideDirection,
    businessId: input.businessId,
    membershipId: input.membershipId,
    grantedBy: input.grantedBy,
    grantedAt: input.grantedAt,
  };
}

export function isGrant(override: PermissionOverride): boolean {
  return override.direction === "grant";
}

export function isRevocation(override: PermissionOverride): boolean {
  return override.direction === "revoke";
}
