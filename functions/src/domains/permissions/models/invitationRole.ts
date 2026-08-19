/**
 * Business Membership Invitation intended-role contract (`ENG-P2-003A`).
 *
 * Reuses the existing `Role` vocabulary (`role.ts`) rather than inventing a
 * duplicate role system, restricted to the two roles an invitation may ever
 * target: `"manager"` and `"staff"`. `"owner"` is structurally excluded —
 * ownership is never assigned by invitation
 * (`ENG-P2-003-DESIGN-001` §11.4/§7.1a's "Intended role" field).
 *
 * Framework-independent (`eslint.config.js`, `permissions/**` boundary
 * rule) — no Firebase SDK import.
 */

import type { Role } from "./role";
import { ownerCannotBeInvitationRoleError, invalidInvitationFieldError } from "./permissionErrors";

export const INVITATION_ROLES = ["manager", "staff"] as const;

export type InvitationRole = (typeof INVITATION_ROLES)[number];

export function isInvitationRole(value: string): value is InvitationRole {
  return (INVITATION_ROLES as readonly string[]).includes(value);
}

/**
 * Validates a caller-supplied intended-role string. `"owner"` is rejected
 * with a dedicated error (distinct from a generic "not a role" failure) so
 * callers/tests can distinguish "this isn't a role at all" from "this is a
 * role, but never a valid invitation target."
 */
export function createInvitationRole(value: string): InvitationRole {
  if (value === "owner") {
    throw ownerCannotBeInvitationRoleError();
  }
  if (isInvitationRole(value)) {
    return value;
  }
  throw invalidInvitationFieldError("role", value);
}

/** Type-level guard: an `InvitationRole` is always assignable to `Role`. */
export function invitationRoleAsRole(value: InvitationRole): Role {
  return value;
}
