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
import { businessQueryKeys } from "./queryKeys";

function requireReadyActor(actorState: ReturnType<typeof useAuthenticatedActor>) {
  if (actorState.status !== "ready") {
    throw new Error("actor not ready");
  }
  return actorState.actor;
}

/** Settles the key holder: keep the key alive only for a retryable failure. */
function settleKeyOnError(holder: ReturnType<typeof createIdempotencyKeyHolder>, error: unknown) {
  const code = (error as BusinessApiError | undefined)?.code;
  if (!code || !isRetryableBusinessErrorCode(code)) {
    holder.clear();
  }
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
