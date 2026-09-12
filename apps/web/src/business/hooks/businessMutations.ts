/**
 * React Query mutation hooks. Each holds one `IdempotencyKeyHolder` per
 * mounted hook instance (i.e. per rendered form/action), reused across
 * retries of the same unchanged action and cleared once the outcome is
 * known (success, or a definitive/non-retryable failure) — never cleared
 * on a transient failure, so a retry replays the same key.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { useBusinessApiPlatform } from "../BusinessApiContext";
import { useAuthenticatedActor } from "./useAuthenticatedActor";
import { isRetryableBusinessErrorCode, type BusinessApiError } from "../api/businessCallableClient";
import { createIdempotencyKeyHolder } from "../api/idempotencyKeyHolder";
import { makeCallCreateBusiness, type CreateBusinessRequest } from "../api/createBusiness";
import {
  makeCallUpdateBusinessBranchProfile,
  makeCallUpdateBusinessProfile,
  type BusinessBranchProfilePatch,
  type BusinessProfilePatch,
} from "../api/businessProfile";
import { makeCallSubmitBusinessForVerification } from "../api/submitBusinessForVerification";
import { makeCallAcceptBusinessTerms } from "../api/acceptBusinessTerms";
import {
  makeCallCreateStaffInvitation,
  makeCallRevokeStaffInvitation,
  type CreateStaffInvitationRequest,
} from "../api/staffInvitationMutations";
import {
  makeCallAcceptStaffInvitation,
  makeCallChangeStaffMembershipRole,
  makeCallReactivateStaffMembership,
  makeCallRemoveStaffMembership,
  makeCallSuspendStaffMembership,
  type ChangeStaffMembershipRoleRequest,
} from "../api/staffMembershipMutations";
import { businessQueryKeys } from "./queryKeys";

function requireReadyActor(actorState: ReturnType<typeof useAuthenticatedActor>) {
  if (actorState.status !== "ready") {
    throw new Error("actor not ready");
  }
  return actorState.actor;
}

/**
 * Settles the key holder: keep the key alive only for a retryable failure.
 * Exported only for the key-retention regression test in
 * `businessMutations.test.ts` (`ENG-P3-002-CORR-EST-IDEMP-001-REVIEW`) —
 * this is the exact client-side half of the `createBusiness` idempotency
 * contract: a `TEMPORARY_UNAVAILABLE`-mapped ("unavailable") error must
 * retain the held key so a retry replays the same operation, while any
 * other (definitive) error must discard it.
 */
export function settleKeyOnError(
  holder: ReturnType<typeof createIdempotencyKeyHolder>,
  error: unknown,
) {
  const code = (error as BusinessApiError | undefined)?.code;
  if (!code || !isRetryableBusinessErrorCode(code)) {
    holder.clear();
  }
}

/**
 * Scopes one `IdempotencyKeyHolder` to whichever request signature it was
 * last used for (`PLATFORM-BASELINE-004A-CORR-001`, Codex review P2).
 *
 * A hook instance shared across every row of a list (one
 * `useSuspendStaffMembershipMutation()` call serving the whole Team table,
 * for example) holds exactly one key across retries — correct when every
 * call targets the same row, wrong the moment the operator acts on a
 * *different* row while a retryable failure's key is still held: the
 * server-side request hash binds the key to the full request (e.g.
 * `targetMembershipId`), so replaying it against a different target
 * deterministically returns a conflict instead of performing the newly
 * requested action. Rotating the key whenever the signature changes keeps
 * retry semantics intact for the same target while never leaking a stale
 * key onto a different one. Exported only for the rotation regression test
 * in `businessMutations.test.ts`.
 */
export function keyForRequest(
  holder: ReturnType<typeof createIdempotencyKeyHolder>,
  lastSignature: { current: string | null },
  signature: string,
): string {
  if (lastSignature.current !== null && lastSignature.current !== signature) {
    holder.clear();
  }
  lastSignature.current = signature;
  return holder.getKey();
}

export function useCreateBusinessMutation() {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const queryClient = useQueryClient();
  const holderRef = useRef(createIdempotencyKeyHolder());

  return useMutation({
    mutationFn: (payload: Omit<CreateBusinessRequest, "idempotencyKey">) =>
      makeCallCreateBusiness(functions)(requireReadyActor(actorState), {
        ...payload,
        idempotencyKey: holderRef.current.getKey(),
      }),
    onSuccess: () => {
      holderRef.current.clear();
      queryClient.invalidateQueries({ queryKey: businessQueryKeys.owned() });
    },
    onError: (error) => settleKeyOnError(holderRef.current, error),
  });
}

export function useUpdateBusinessProfileMutation(businessId: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const queryClient = useQueryClient();
  const holderRef = useRef(createIdempotencyKeyHolder());

  return useMutation({
    mutationFn: (patch: BusinessProfilePatch) =>
      makeCallUpdateBusinessProfile(functions)(requireReadyActor(actorState), {
        businessId,
        patch,
        idempotencyKey: holderRef.current.getKey(),
      }),
    onSuccess: () => {
      holderRef.current.clear();
      queryClient.invalidateQueries({ queryKey: businessQueryKeys.context(businessId) });
    },
    onError: (error) => settleKeyOnError(holderRef.current, error),
  });
}

export function useUpdateBusinessBranchProfileMutation(businessId: string, branchId: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const queryClient = useQueryClient();
  const holderRef = useRef(createIdempotencyKeyHolder());

  return useMutation({
    mutationFn: (patch: BusinessBranchProfilePatch) =>
      makeCallUpdateBusinessBranchProfile(functions)(requireReadyActor(actorState), {
        businessId,
        branchId,
        patch,
        idempotencyKey: holderRef.current.getKey(),
      }),
    onSuccess: () => {
      holderRef.current.clear();
      queryClient.invalidateQueries({ queryKey: businessQueryKeys.branch(businessId) });
      queryClient.invalidateQueries({ queryKey: businessQueryKeys.context(businessId) });
    },
    onError: (error) => settleKeyOnError(holderRef.current, error),
  });
}

export function useAcceptBusinessTermsMutation(businessId: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const queryClient = useQueryClient();
  const holderRef = useRef(createIdempotencyKeyHolder());

  return useMutation({
    mutationFn: () =>
      makeCallAcceptBusinessTerms(functions)(requireReadyActor(actorState), {
        businessId,
        idempotencyKey: holderRef.current.getKey(),
      }),
    onSuccess: () => {
      holderRef.current.clear();
      queryClient.invalidateQueries({ queryKey: businessQueryKeys.context(businessId) });
    },
    onError: (error) => settleKeyOnError(holderRef.current, error),
  });
}

export function useSubmitBusinessForVerificationMutation(businessId: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const queryClient = useQueryClient();
  const holderRef = useRef(createIdempotencyKeyHolder());

  return useMutation({
    mutationFn: () =>
      makeCallSubmitBusinessForVerification(functions)(requireReadyActor(actorState), {
        businessId,
        idempotencyKey: holderRef.current.getKey(),
      }),
    onSuccess: () => {
      holderRef.current.clear();
      queryClient.invalidateQueries({ queryKey: businessQueryKeys.context(businessId) });
    },
    onError: (error) => settleKeyOnError(holderRef.current, error),
  });
}

export function useCreateStaffInvitationMutation(businessId: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const queryClient = useQueryClient();
  const holderRef = useRef(createIdempotencyKeyHolder());

  return useMutation({
    mutationFn: (payload: Omit<CreateStaffInvitationRequest, "businessId" | "idempotencyKey">) =>
      makeCallCreateStaffInvitation(functions)(requireReadyActor(actorState), {
        ...payload,
        businessId,
        idempotencyKey: holderRef.current.getKey(),
      }),
    onSuccess: () => {
      holderRef.current.clear();
      queryClient.invalidateQueries({ queryKey: businessQueryKeys.staffInvitations(businessId) });
    },
    onError: (error) => settleKeyOnError(holderRef.current, error),
  });
}

export function useRevokeStaffInvitationMutation(businessId: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const queryClient = useQueryClient();
  const holderRef = useRef(createIdempotencyKeyHolder());

  return useMutation({
    mutationFn: (invitationId: string) =>
      makeCallRevokeStaffInvitation(functions)(requireReadyActor(actorState), {
        businessId,
        invitationId,
        idempotencyKey: holderRef.current.getKey(),
      }),
    onSuccess: () => {
      holderRef.current.clear();
      queryClient.invalidateQueries({ queryKey: businessQueryKeys.staffInvitations(businessId) });
    },
    onError: (error) => settleKeyOnError(holderRef.current, error),
  });
}

/**
 * Invitation acceptance (`PLATFORM-BASELINE-004A`) — self-service: no
 * `businessId` is supplied (the Business binding comes from the
 * authoritative invitation server-side). On success the caller has gained a
 * membership, so the accessible-businesses roster is refetched alongside
 * the staff lists.
 */
export function useAcceptStaffInvitationMutation() {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const queryClient = useQueryClient();
  const holderRef = useRef(createIdempotencyKeyHolder());

  return useMutation({
    mutationFn: (payload: { invitationReference: string }) =>
      makeCallAcceptStaffInvitation(functions)(requireReadyActor(actorState), {
        invitationReference: payload.invitationReference,
        idempotencyKey: holderRef.current.getKey(),
      }),
    onSuccess: (result) => {
      holderRef.current.clear();
      queryClient.invalidateQueries({ queryKey: businessQueryKeys.accessible() });
      if (result) {
        queryClient.invalidateQueries({
          queryKey: businessQueryKeys.staffMemberships(result.businessId),
        });
        queryClient.invalidateQueries({
          queryKey: businessQueryKeys.staffInvitations(result.businessId),
        });
      }
    },
    onError: (error) => settleKeyOnError(holderRef.current, error),
  });
}

function useStaffMembershipLifecycleMutation(
  businessId: string,
  action: "suspend" | "reactivate" | "remove",
) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const queryClient = useQueryClient();
  const holderRef = useRef(createIdempotencyKeyHolder());
  const lastTargetRef = useRef<string | null>(null);
  const call =
    action === "suspend"
      ? makeCallSuspendStaffMembership
      : action === "reactivate"
        ? makeCallReactivateStaffMembership
        : makeCallRemoveStaffMembership;

  return useMutation({
    mutationFn: (targetMembershipId: string) =>
      call(functions)(requireReadyActor(actorState), {
        businessId,
        targetMembershipId,
        idempotencyKey: keyForRequest(holderRef.current, lastTargetRef, targetMembershipId),
      }),
    onSuccess: () => {
      holderRef.current.clear();
      queryClient.invalidateQueries({ queryKey: businessQueryKeys.staffMemberships(businessId) });
    },
    onError: (error) => settleKeyOnError(holderRef.current, error),
  });
}

export function useSuspendStaffMembershipMutation(businessId: string) {
  return useStaffMembershipLifecycleMutation(businessId, "suspend");
}

export function useReactivateStaffMembershipMutation(businessId: string) {
  return useStaffMembershipLifecycleMutation(businessId, "reactivate");
}

export function useRemoveStaffMembershipMutation(businessId: string) {
  return useStaffMembershipLifecycleMutation(businessId, "remove");
}

export function useChangeStaffMembershipRoleMutation(businessId: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const queryClient = useQueryClient();
  const holderRef = useRef(createIdempotencyKeyHolder());
  const lastRequestRef = useRef<string | null>(null);

  return useMutation({
    mutationFn: (
      payload: Omit<ChangeStaffMembershipRoleRequest, "businessId" | "idempotencyKey">,
    ) => {
      const requestSignature = `${payload.targetMembershipId}:${payload.fromRole}:${payload.toRole}`;
      return makeCallChangeStaffMembershipRole(functions)(requireReadyActor(actorState), {
        ...payload,
        businessId,
        idempotencyKey: keyForRequest(holderRef.current, lastRequestRef, requestSignature),
      });
    },
    onSuccess: () => {
      holderRef.current.clear();
      queryClient.invalidateQueries({ queryKey: businessQueryKeys.staffMemberships(businessId) });
    },
    onError: (error) => settleKeyOnError(holderRef.current, error),
  });
}
