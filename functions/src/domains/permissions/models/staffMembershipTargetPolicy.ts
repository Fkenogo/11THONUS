/**
 * Staff-management and role-change target-policy contracts (`ENG-P2-003A`,
 * Phase L/M).
 *
 * These are **pure domain-invariant predicates**, not an authorization
 * evaluator — they answer "given an actor already holds the relevant
 * permission (`staff.manage` or the future `staff.assignRole`), is this
 * *target* structurally permitted?" They never check whether the actor
 * actually holds that permission — that remains `ENG-P2-004`'s evaluator
 * (already-Complete), consumed, never re-implemented or duplicated here
 * (Phase L's explicit boundary).
 *
 * Matrices sourced verbatim from `ENG-P2-003-DESIGN-001` §11.6.1
 * (`staff.manage` — invite/suspend/reactivate/remove) and §11.6.2
 * (`staff.assignRole` — Staff<->Manager only), Founder-approved
 * FD-5-STAFF/FD-6-STAFF.
 */

import type { Role } from "./role";

/**
 * `staff.manage` target matrix (§11.6.1):
 * - Owner may target Manager or Staff, never Owner, never self.
 * - Manager (holding `staff.manage`) may target Staff only — never
 *   Manager, never Owner, never self.
 * - Staff may never administer any membership.
 */
export function isPermittedStaffManagementTarget(
  actorRole: Role,
  targetRole: Role,
  isSelfAction: boolean,
): boolean {
  if (isSelfAction) return false;
  if (targetRole === "owner") return false;

  if (actorRole === "owner") {
    return targetRole === "manager" || targetRole === "staff";
  }
  if (actorRole === "manager") {
    return targetRole === "staff";
  }
  return false;
}

/**
 * `staff.assignRole` target matrix (§11.6.2): Owner-only, non-delegable to
 * Manager at MVP; only Staff<->Manager role changes are ever expressible;
 * Owner is never an assignable role or a valid target; no self-role-change
 * for any actor, including Owner.
 */
export function isPermittedRoleChangeTarget(
  actorRole: Role,
  targetRole: Role,
  isSelfAction: boolean,
): boolean {
  if (isSelfAction) return false;
  if (targetRole === "owner") return false;
  if (actorRole !== "owner") return false;

  return targetRole === "manager" || targetRole === "staff";
}
