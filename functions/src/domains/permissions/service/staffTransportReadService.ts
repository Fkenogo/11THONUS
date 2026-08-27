/**
 * Staff list-query read transport (`ENG-P3-002A`, design §39/§40/Phase N;
 * invitation-identity projection added under `ENG-P3-002-UI-IMP-G` per the
 * Founder disposition `FD-P3-002-G-001`).
 *
 * Wraps the new bounded repository queries (`listInvitationsByBusiness`,
 * `listMembershipsByBusiness`) with the same read-authority re-derivation
 * `businessCallerAuthority.ts` already establishes for Business reads
 * (§21/§25) — any active membership (Owner/Manager/Staff) may read the
 * roster/invitation-status of their own Business; a caller with no
 * membership in `businessId` is denied identically to "Business not
 * found" (enumeration resistance). `FD-P3-002-G-001` does not widen this —
 * it only changes what an already-authorized caller may see.
 *
 * DTOs remain minimal (Phase N), narrowed only by `FD-P3-002-G-001`'s exact
 * authorization: no `AuthenticationReference` internals, no protected
 * Customer Identity fields, no permission-audit internals, and — for
 * invitations — the raw delivery-target value is exposed **only** when the
 * delivery type is `email` (`FD-P3-002-G-001` §2, "where the delivery
 * target is email, the invitation email"); a `phone`-delivered invitation's
 * value remains withheld, since phone numbers are explicitly prohibited by
 * `FD-P3-002-G-001` §4 and no separate disposition covers phone-delivery
 * identity. `StaffMembershipSummary` is unchanged by this task — see
 * `ENG-P3-002-UI-IMP-G`'s implementation report for why the active-member
 * display-name half of `FD-P3-002-G-001` was not implemented (no existing
 * authoritative, non-protected display-name source exists).
 */

import type { Firestore } from "firebase-admin/firestore";
import { listInvitationsByBusiness } from "../repositories/businessMembershipInvitationRepository";
import {
  getBusinessMembershipByUserAndBusiness,
  listMembershipsByBusiness,
} from "../repositories/businessMembershipRepository";
import type { BusinessMembershipInvitation } from "../models/businessMembershipInvitation";
import type { EvaluationBusinessMembership } from "../evaluator/types";
import type { InvitationStatus } from "../models/invitationStatus";
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

/**
 * Phase N's bounded invitation-status DTO, additively extended under
 * `FD-P3-002-G-001` §2: `email` is present only when `deliveryType` is
 * `"email"` — the exact, and only, delivery-identity value the disposition
 * authorizes exposing. Absent (never a fabricated value) for `"phone"`
 * deliveries.
 */
export type StaffInvitationSummary = {
  invitationId: string;
  role: string;
  status: string;
  deliveryType: string;
  email?: string;
  invitedAt: string;
  expiresAt: string;
};

function toInvitationSummary(invitation: BusinessMembershipInvitation): StaffInvitationSummary {
  return {
    invitationId: invitation.id,
    role: invitation.role,
    status: invitation.status,
    deliveryType: invitation.deliveryTarget.type,
    ...(invitation.deliveryTarget.type === "email"
      ? { email: invitation.deliveryTarget.value }
      : {}),
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
  statusFilter?: InvitationStatus,
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
