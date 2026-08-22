/**
 * Staff list-query read transport (`ENG-P3-002A`, design §39/§40/Phase N).
 *
 * Wraps the new bounded repository queries (`listInvitationsByBusiness`,
 * `listMembershipsByBusiness`) with the same read-authority re-derivation
 * `businessCallerAuthority.ts` already establishes for Business reads
 * (§21/§25) — any active membership (Owner/Manager/Staff) may read the
 * roster/invitation-status of their own Business; a caller with no
 * membership in `businessId` is denied identically to "Business not
 * found" (enumeration resistance).
 *
 * DTOs are deliberately minimal (Phase N): no `AuthenticationReference`
 * internals, no raw delivery-target contact value (email/phone), no
 * protected Customer Identity fields, no permission-audit internals.
 */

import type { Firestore } from "firebase-admin/firestore";
import { listInvitationsByBusiness } from "../repositories/businessMembershipInvitationRepository";
import {
  getBusinessMembershipByUserAndBusiness,
  listMembershipsByBusiness,
} from "../repositories/businessMembershipRepository";
import type { BusinessMembershipInvitation } from "../models/businessMembershipInvitation";
import type { EvaluationBusinessMembership } from "../evaluator/types";
import { staffReadNotAuthorizedError } from "../models/permissionErrors";

/**
 * Re-derives the caller's own read authority over `businessId` from their
 * live membership record — any active membership (Owner/Manager/Staff),
 * never a client-supplied claim (§21/§25, mirrors
 * `businessCallerAuthority.ts`'s identical read-authority re-derivation in
 * the Business domain — deliberately re-implemented here, rather than
 * imported across domains, keeping the Permissions domain's existing
 * import boundary intact: this file already lives in
 * `permissions/service/**`, which is Firebase-adapter-capable, and this
 * module's only dependency is the membership repository already in this
 * same domain).
 */
async function assertActiveMembership(
  db: Firestore,
  userId: string,
  businessId: string,
): Promise<void> {
  const membership = await getBusinessMembershipByUserAndBusiness(db, userId, businessId);
  if (membership.kind !== "found" || membership.membership.status !== "active") {
    throw staffReadNotAuthorizedError();
  }
}

/** Phase N's bounded invitation-status DTO — no raw delivery-target value. */
export type StaffInvitationSummary = {
  invitationId: string;
  role: string;
  status: string;
  deliveryType: string;
  invitedAt: string;
  expiresAt: string;
};

function toInvitationSummary(invitation: BusinessMembershipInvitation): StaffInvitationSummary {
  return {
    invitationId: invitation.id,
    role: invitation.role,
    status: invitation.status,
    deliveryType: invitation.deliveryTarget.type,
    invitedAt: invitation.invitedAt.toISOString(),
    expiresAt: invitation.expiresAt.toISOString(),
  };
}

/** Phase N's bounded membership-roster DTO — no `userId`/Customer Identity reference. */
export type StaffMembershipSummary = {
  membershipId: string;
  role: string;
  status: string;
};

function toMembershipSummary(membership: EvaluationBusinessMembership): StaffMembershipSummary {
  return {
    membershipId: membership.id,
    role: membership.role,
    status: membership.status,
  };
}

/** §38 scenarios 5–6: the onboarding review step's "who have I already invited" read. */
export async function listStaffInvitationsForBusiness(
  db: Firestore,
  userId: string,
  businessId: string,
  statusFilter?: string,
): Promise<StaffInvitationSummary[]> {
  await assertActiveMembership(db, userId, businessId);
  const invitations = await listInvitationsByBusiness(db, businessId, statusFilter);
  return invitations.map(toInvitationSummary);
}

/** §39's "how many Staff members does this Business currently have" read. */
export async function listStaffMembershipsForBusiness(
  db: Firestore,
  userId: string,
  businessId: string,
): Promise<StaffMembershipSummary[]> {
  await assertActiveMembership(db, userId, businessId);
  const memberships = await listMembershipsByBusiness(db, businessId);
  return memberships.map(toMembershipSummary);
}
