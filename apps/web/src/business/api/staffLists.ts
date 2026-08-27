/** Adapters for `listStaffInvitations`/`listStaffMemberships` (design §39). Plain bounded reads, no outcome wrapper. */

import { httpsCallable, type Functions } from "firebase/functions";
import { toCallWithActor, type AuthenticatedActor } from "./businessCallableClient";

export type InvitationStatus = "invited" | "accepted" | "revoked" | "expired";

export type StaffInvitationSummary = {
  invitationId: string;
  role: string;
  status: InvitationStatus;
  deliveryType: string;
  /** Present only when `deliveryType` is `"email"` (`FD-P3-002-G-001` §2). */
  email?: string;
  invitedAt: string;
  expiresAt: string;
};

export type ListStaffInvitationsRequest = { businessId: string; statusFilter?: InvitationStatus };

export type StaffMembershipSummary = { membershipId: string; role: string; status: string };

export type ListStaffMembershipsRequest = { businessId: string };

type BoundCallable<TResult> = (payload: Record<string, unknown>) => Promise<{ data: TResult[] }>;

export function toCallListStaffInvitations(
  callable: BoundCallable<StaffInvitationSummary>,
): (
  actor: AuthenticatedActor,
  payload: ListStaffInvitationsRequest,
) => Promise<StaffInvitationSummary[]> {
  return toCallWithActor<ListStaffInvitationsRequest, StaffInvitationSummary[]>(callable);
}

export function makeCallListStaffInvitations(
  functions: Functions,
): (
  actor: AuthenticatedActor,
  payload: ListStaffInvitationsRequest,
) => Promise<StaffInvitationSummary[]> {
  return toCallListStaffInvitations(httpsCallable(functions, "listStaffInvitations"));
}

export function toCallListStaffMemberships(
  callable: BoundCallable<StaffMembershipSummary>,
): (
  actor: AuthenticatedActor,
  payload: ListStaffMembershipsRequest,
) => Promise<StaffMembershipSummary[]> {
  return toCallWithActor<ListStaffMembershipsRequest, StaffMembershipSummary[]>(callable);
}

export function makeCallListStaffMemberships(
  functions: Functions,
): (
  actor: AuthenticatedActor,
  payload: ListStaffMembershipsRequest,
) => Promise<StaffMembershipSummary[]> {
  return toCallListStaffMemberships(httpsCallable(functions, "listStaffMemberships"));
}
