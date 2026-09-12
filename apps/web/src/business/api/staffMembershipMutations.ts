/**
 * Adapters for `acceptStaffInvitation` / `suspendStaffMembership` /
 * `reactivateStaffMembership` / `removeStaffMembership` /
 * `changeStaffMembershipRole` (`PLATFORM-BASELINE-004A`).
 *
 * Lifecycle/role callables return the `authorizeAndExecute` outcome
 * envelope unchanged (executed/denied/duplicate/in_progress), unwrapped
 * here via the shared `unwrapMutationResult` exactly like
 * `create`/`revoke`. `acceptStaffInvitation` is self-service and returns
 * its result directly (no envelope); the wire form carries `acceptedAt`
 * as an ISO string (the transport normalizes the domain `Date`).
 */

import { httpsCallable, type Functions } from "firebase/functions";
import { toCallWithActor, type AuthenticatedActor } from "./businessCallableClient";
import { unwrapMutationResult, type MutationOutcome } from "./mutationOutcome";

export type AcceptStaffInvitationRequest = {
  invitationReference: string;
  idempotencyKey: string;
};

export type AcceptStaffInvitationResult = {
  membershipId: string;
  businessId: string;
  userId: string;
  role: string;
  acceptedAt: string;
};

export type StaffMembershipLifecycleRequest = {
  businessId: string;
  targetMembershipId: string;
  idempotencyKey: string;
};

export type StaffMembershipLifecycleResult = {
  membershipId: string;
  businessId: string;
  userId: string;
  role: string;
  status: "active" | "suspended" | "removed";
  updatedAt: string;
};

export type ChangeStaffMembershipRoleRequest = {
  businessId: string;
  targetMembershipId: string;
  fromRole: "manager" | "staff";
  toRole: "manager" | "staff";
  idempotencyKey: string;
};

export type ChangeStaffMembershipRoleResult = {
  membershipId: string;
  businessId: string;
  userId: string;
  fromRole: string;
  toRole: string;
  updatedAt: string;
};

type BoundMutationCallable<TResult> = (
  payload: Record<string, unknown>,
) => Promise<{ data: MutationOutcome<TResult> }>;

type BoundAcceptCallable = (
  payload: Record<string, unknown>,
) => Promise<{ data: AcceptStaffInvitationResult }>;

export function toCallAcceptStaffInvitation(
  callable: BoundAcceptCallable,
): (
  actor: AuthenticatedActor,
  payload: AcceptStaffInvitationRequest,
) => Promise<AcceptStaffInvitationResult> {
  const call = toCallWithActor<AcceptStaffInvitationRequest, AcceptStaffInvitationResult>(callable);
  return (actor, payload) => call(actor, payload);
}

export function makeCallAcceptStaffInvitation(
  functions: Functions,
): (
  actor: AuthenticatedActor,
  payload: AcceptStaffInvitationRequest,
) => Promise<AcceptStaffInvitationResult> {
  return toCallAcceptStaffInvitation(httpsCallable(functions, "acceptStaffInvitation"));
}

export function toCallSuspendStaffMembership(
  callable: BoundMutationCallable<StaffMembershipLifecycleResult>,
): (
  actor: AuthenticatedActor,
  payload: StaffMembershipLifecycleRequest,
) => Promise<StaffMembershipLifecycleResult | undefined> {
  const call = toCallWithActor<
    StaffMembershipLifecycleRequest,
    MutationOutcome<StaffMembershipLifecycleResult>
  >(callable);
  return async (actor, payload) => unwrapMutationResult(await call(actor, payload));
}

export function makeCallSuspendStaffMembership(
  functions: Functions,
): (
  actor: AuthenticatedActor,
  payload: StaffMembershipLifecycleRequest,
) => Promise<StaffMembershipLifecycleResult | undefined> {
  return toCallSuspendStaffMembership(httpsCallable(functions, "suspendStaffMembership"));
}

export function toCallReactivateStaffMembership(
  callable: BoundMutationCallable<StaffMembershipLifecycleResult>,
): (
  actor: AuthenticatedActor,
  payload: StaffMembershipLifecycleRequest,
) => Promise<StaffMembershipLifecycleResult | undefined> {
  const call = toCallWithActor<
    StaffMembershipLifecycleRequest,
    MutationOutcome<StaffMembershipLifecycleResult>
  >(callable);
  return async (actor, payload) => unwrapMutationResult(await call(actor, payload));
}

export function makeCallReactivateStaffMembership(
  functions: Functions,
): (
  actor: AuthenticatedActor,
  payload: StaffMembershipLifecycleRequest,
) => Promise<StaffMembershipLifecycleResult | undefined> {
  return toCallReactivateStaffMembership(httpsCallable(functions, "reactivateStaffMembership"));
}

export function toCallRemoveStaffMembership(
  callable: BoundMutationCallable<StaffMembershipLifecycleResult>,
): (
  actor: AuthenticatedActor,
  payload: StaffMembershipLifecycleRequest,
) => Promise<StaffMembershipLifecycleResult | undefined> {
  const call = toCallWithActor<
    StaffMembershipLifecycleRequest,
    MutationOutcome<StaffMembershipLifecycleResult>
  >(callable);
  return async (actor, payload) => unwrapMutationResult(await call(actor, payload));
}

export function makeCallRemoveStaffMembership(
  functions: Functions,
): (
  actor: AuthenticatedActor,
  payload: StaffMembershipLifecycleRequest,
) => Promise<StaffMembershipLifecycleResult | undefined> {
  return toCallRemoveStaffMembership(httpsCallable(functions, "removeStaffMembership"));
}

export function toCallChangeStaffMembershipRole(
  callable: BoundMutationCallable<ChangeStaffMembershipRoleResult>,
): (
  actor: AuthenticatedActor,
  payload: ChangeStaffMembershipRoleRequest,
) => Promise<ChangeStaffMembershipRoleResult | undefined> {
  const call = toCallWithActor<
    ChangeStaffMembershipRoleRequest,
    MutationOutcome<ChangeStaffMembershipRoleResult>
  >(callable);
  return async (actor, payload) => unwrapMutationResult(await call(actor, payload));
}

export function makeCallChangeStaffMembershipRole(
  functions: Functions,
): (
  actor: AuthenticatedActor,
  payload: ChangeStaffMembershipRoleRequest,
) => Promise<ChangeStaffMembershipRoleResult | undefined> {
  return toCallChangeStaffMembershipRole(httpsCallable(functions, "changeStaffMembershipRole"));
}
