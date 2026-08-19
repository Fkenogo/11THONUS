/**
 * Staff role-change request/result contract (`ENG-P2-003A`, Phase M).
 *
 * Domain request/result shapes for the future `staff.assignRole` command
 * (`ENG-P2-003-DESIGN-001` §11.2/§11.6.2, FD-6-STAFF). Governed
 * role-change semantics: Staff<->Manager only, never Owner, no
 * self-role-change, Manager has no role-change authority at MVP.
 *
 * **This module encodes no authorization check** — whether `requestedBy`
 * actually holds `staff.assignRole`, and whether the target is a
 * permitted target for that actor, is `ENG-P2-004`'s evaluator plus
 * `staffMembershipTargetPolicy.ts`'s pure predicate, both consumed by the
 * future `ENG-P2-003C` command, never re-implemented here. This module
 * validates only the request's own structural well-formedness.
 *
 * `staff.assignRole` itself is **not** added to
 * `sensitivePermissionCatalogue.ts` by this file — that catalogue edit is
 * `ENG-P2-004-CORR-002`'s scope (§11.2's approved future entry), not
 * authorized or performed here.
 */

import type { InvitationRole } from "./invitationRole";
import { invalidInvitationFieldError, invalidRoleChangeRequestError } from "./permissionErrors";

export type StaffRoleChangeRequest = {
  readonly businessId: string;
  readonly membershipId: string;
  readonly fromRole: InvitationRole;
  readonly toRole: InvitationRole;
  readonly requestedBy: string;
};

export type CreateStaffRoleChangeRequestParams = {
  businessId: string;
  membershipId: string;
  fromRole: "manager" | "staff";
  toRole: "manager" | "staff";
  requestedBy: string;
};

function requireNonBlank(field: string, value: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw invalidInvitationFieldError(field, String(value));
  }
  return value;
}

export function createStaffRoleChangeRequest(
  params: CreateStaffRoleChangeRequestParams,
): StaffRoleChangeRequest {
  const businessId = requireNonBlank("businessId", params.businessId);
  const membershipId = requireNonBlank("membershipId", params.membershipId);
  const requestedBy = requireNonBlank("requestedBy", params.requestedBy);

  if (params.fromRole !== "manager" && params.fromRole !== "staff") {
    throw invalidInvitationFieldError("fromRole", String(params.fromRole));
  }
  if (params.toRole !== "manager" && params.toRole !== "staff") {
    throw invalidInvitationFieldError("toRole", String(params.toRole));
  }
  if (params.fromRole === params.toRole) {
    throw invalidRoleChangeRequestError("fromRole and toRole must differ");
  }

  return {
    businessId,
    membershipId,
    fromRole: params.fromRole,
    toRole: params.toRole,
    requestedBy,
  };
}
