/** Adapters for `createStaffInvitation`/`revokeStaffInvitation` (design §11/§12). */

import { httpsCallable, type Functions } from "firebase/functions";
import { toCallWithActor, type AuthenticatedActor } from "./businessCallableClient";
import { unwrapMutationResult, type MutationOutcome } from "./mutationOutcome";

export type InvitationDeliveryType = "email" | "phone";
export type InvitationRole = string;

export type CreateStaffInvitationRequest = {
  businessId: string;
  role: InvitationRole;
  deliveryTarget: { type: InvitationDeliveryType; value: string };
  idempotencyKey: string;
};

export type CreateStaffInvitationResult = { invitationId: string };

export type RevokeStaffInvitationRequest = {
  businessId: string;
  invitationId: string;
  idempotencyKey: string;
};

export type RevokeStaffInvitationResult = { invitationId: string };

type BoundCallable<TResult> = (
  payload: Record<string, unknown>,
) => Promise<{ data: MutationOutcome<TResult> }>;

export function toCallCreateStaffInvitation(
  callable: BoundCallable<CreateStaffInvitationResult>,
): (
  actor: AuthenticatedActor,
  payload: CreateStaffInvitationRequest,
) => Promise<CreateStaffInvitationResult | undefined> {
  const call = toCallWithActor<
    CreateStaffInvitationRequest,
    MutationOutcome<CreateStaffInvitationResult>
  >(callable);
  return async (actor, payload) => unwrapMutationResult(await call(actor, payload));
}

export function makeCallCreateStaffInvitation(
  functions: Functions,
): (
  actor: AuthenticatedActor,
  payload: CreateStaffInvitationRequest,
) => Promise<CreateStaffInvitationResult | undefined> {
  return toCallCreateStaffInvitation(httpsCallable(functions, "createStaffInvitation"));
}

export function toCallRevokeStaffInvitation(
  callable: BoundCallable<RevokeStaffInvitationResult>,
): (
  actor: AuthenticatedActor,
  payload: RevokeStaffInvitationRequest,
) => Promise<RevokeStaffInvitationResult | undefined> {
  const call = toCallWithActor<
    RevokeStaffInvitationRequest,
    MutationOutcome<RevokeStaffInvitationResult>
  >(callable);
  return async (actor, payload) => unwrapMutationResult(await call(actor, payload));
}

export function makeCallRevokeStaffInvitation(
  functions: Functions,
): (
  actor: AuthenticatedActor,
  payload: RevokeStaffInvitationRequest,
) => Promise<RevokeStaffInvitationResult | undefined> {
  return toCallRevokeStaffInvitation(httpsCallable(functions, "revokeStaffInvitation"));
}
