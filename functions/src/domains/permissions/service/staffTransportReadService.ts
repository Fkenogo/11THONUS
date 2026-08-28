/**
 * Staff list-query read transport (`ENG-P3-002A`, design §39/§40/Phase N;
 * identity projection completed under `ENG-P3-002-UI-IMP-G-COMPLETION` per
 * the Founder disposition `FD-P3-002-G-001`, now that `FD-IDENTITY-DISPLAY-001`
 * and `IDENTITY-PROFILE-A`/`IDENTITY-PROFILE-B` supply the authoritative,
 * non-protected `users.displayName` source `FD-P3-002-G-001` §10 required
 * before the active-member half of §5 could be implemented — see PR #187's
 * report for the prior stop).
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
 * Customer Identity fields, no permission-audit internals, and:
 *
 *   - for invitations, the raw delivery-target value is exposed **only**
 *     when the delivery type is `email` (`FD-P3-002-G-001` §2/§6); a
 *     `phone`-delivered invitation's value remains withheld (§4 prohibits
 *     phone numbers unconditionally, and no separate disposition covers
 *     phone-delivery identity);
 *   - for active memberships, `displayName` is resolved server-side from
 *     `users/{membership.userId}.displayName` (`FD-P3-002-G-001` §5) via
 *     `readDisplayNamesByUserIds` (one batched `db.getAll`, bounded by the
 *     same membership roster query — no additional per-membership round
 *     trip, no general user-directory/cache layer). Absent when the member
 *     has not set a Display Name yet — a valid outcome, never fabricated
 *     from email, `CustomerProfile`, Firebase Auth, or the invitation that
 *     originated the membership (Owners have none; §5 resolves uniformly
 *     for every role via `membership.userId` alone). A malformed
 *     `displayName` record, or a `membership.userId` with no backing
 *     `users` document at all (a referential-integrity violation — see
 *     `readDisplayNamesByUserIds`'s own doc comment), fails the whole read
 *     closed (`staffIdentityIntegrityFailureError`) rather than degrading
 *     silently or presenting a corrupted member as an ordinary un-named
 *     one — this domain's existing fail-closed convention.
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
import {
  staffIdentityIntegrityFailureError,
  staffReadNotAuthorizedError,
} from "../models/permissionErrors";
import { readDisplayNamesByUserIds } from "../../identity/repositories/displayNameRepository";
import { IdentityDomainError } from "../../identity/models/identityErrors";

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

/**
 * Phase N's bounded membership-roster DTO — no `userId`/Customer Identity
 * reference. `displayName` added under `FD-P3-002-G-001` §5
 * (`ENG-P3-002-UI-IMP-G-COMPLETION`): resolved server-side from
 * `users/{userId}.displayName`, absent when not yet set.
 */
export type StaffMembershipSummary = {
  membershipId: string;
  role: string;
  status: string;
  displayName?: string;
};

function toMembershipSummary(
  membership: EvaluationBusinessMembership,
  displayName: string | undefined,
): StaffMembershipSummary {
  return {
    membershipId: membership.id,
    role: membership.role,
    status: membership.status,
    ...(displayName !== undefined ? { displayName } : {}),
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

  let displayNames: Map<string, string | undefined>;
  try {
    displayNames = await readDisplayNamesByUserIds(
      db,
      memberships.map((membership) => membership.userId),
    );
  } catch (error) {
    if (error instanceof IdentityDomainError) {
      throw staffIdentityIntegrityFailureError();
    }
    throw error;
  }

  return memberships.map((membership) =>
    toMembershipSummary(membership, displayNames.get(membership.userId)),
  );
}
