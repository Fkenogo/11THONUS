/**
 * Business-membership role (`ENG-P2-004A`).
 *
 * The exact role literal union TRD10 §10.6.4's `BusinessMembershipDocument`
 * already defines (`role: "owner" | "manager" | "staff"`) — reused here,
 * not redefined, so `ENG-P2-004`'s contracts stay in lockstep with the
 * existing (not-yet-implemented) membership schema rather than drifting
 * into a competing role vocabulary.
 */

import { invalidRoleError } from "./permissionErrors";

export const ROLES = ["owner", "manager", "staff"] as const;

export type Role = (typeof ROLES)[number];

export function createRole(value: string): Role {
  if ((ROLES as readonly string[]).includes(value)) {
    return value as Role;
  }
  throw invalidRoleError(value);
}

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
