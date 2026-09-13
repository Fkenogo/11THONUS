/**
 * Reward Program mutation hooks (`PLATFORM-BASELINE-005A`).
 *
 * Same `IdempotencyKeyHolder`/`settleKeyOnError` conventions as every
 * other mutation hook in this file family — reused, not duplicated. Each
 * hook here is used on a single Reward Program's own detail/edit view (one
 * program at a time), so the target-rotation concern
 * `PLATFORM-BASELINE-004A-CORR-001` fixed for the Team page's shared
 * per-list hooks does not apply — there is only ever one target per
 * mounted hook instance.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { useBusinessApiPlatform } from "../BusinessApiContext";
import { useAuthenticatedActor } from "./useAuthenticatedActor";
import { createIdempotencyKeyHolder } from "../api/idempotencyKeyHolder";
import { settleKeyOnError } from "./businessMutations";
import {
  makeCallCreateNextRewardProgramVersion,
  makeCallCreateRewardProgram,
  makeCallPublishRewardProgramVersion,
  makeCallUpdateRewardProgramDraft,
  type CreateNextRewardProgramVersionRequest,
  type CreateRewardProgramRequest,
  type PublishRewardProgramVersionRequest,
  type UpdateRewardProgramDraftRequest,
} from "../api/rewardProgramMutations";
import { businessQueryKeys } from "./queryKeys";

function requireReadyActor(actorState: ReturnType<typeof useAuthenticatedActor>) {
  if (actorState.status !== "ready") {
    throw new Error("actor not ready");
  }
  return actorState.actor;
}

export function useCreateRewardProgramMutation(businessId: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const queryClient = useQueryClient();
  const holderRef = useRef(createIdempotencyKeyHolder());

  return useMutation({
    mutationFn: (payload: Omit<CreateRewardProgramRequest, "businessId" | "idempotencyKey">) =>
      makeCallCreateRewardProgram(functions)(requireReadyActor(actorState), {
        ...payload,
        businessId,
        idempotencyKey: holderRef.current.getKey(),
      }),
    onSuccess: () => {
      holderRef.current.clear();
      queryClient.invalidateQueries({ queryKey: businessQueryKeys.rewardPrograms(businessId) });
    },
    onError: (error) => settleKeyOnError(holderRef.current, error),
  });
}

export function useUpdateRewardProgramDraftMutation(businessId: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const queryClient = useQueryClient();
  const holderRef = useRef(createIdempotencyKeyHolder());

  return useMutation({
    mutationFn: (payload: Omit<UpdateRewardProgramDraftRequest, "businessId" | "idempotencyKey">) =>
      makeCallUpdateRewardProgramDraft(functions)(requireReadyActor(actorState), {
        ...payload,
        businessId,
        idempotencyKey: holderRef.current.getKey(),
      }),
    onSuccess: (_result, variables) => {
      holderRef.current.clear();
      queryClient.invalidateQueries({
        queryKey: businessQueryKeys.rewardProgram(businessId, variables.rewardProgramId),
      });
      queryClient.invalidateQueries({ queryKey: businessQueryKeys.rewardPrograms(businessId) });
    },
    onError: (error) => settleKeyOnError(holderRef.current, error),
  });
}

export function usePublishRewardProgramVersionMutation(businessId: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const queryClient = useQueryClient();
  const holderRef = useRef(createIdempotencyKeyHolder());

  return useMutation({
    mutationFn: (
      payload: Omit<PublishRewardProgramVersionRequest, "businessId" | "idempotencyKey">,
    ) =>
      makeCallPublishRewardProgramVersion(functions)(requireReadyActor(actorState), {
        ...payload,
        businessId,
        idempotencyKey: holderRef.current.getKey(),
      }),
    onSuccess: (_result, variables) => {
      holderRef.current.clear();
      queryClient.invalidateQueries({
        queryKey: businessQueryKeys.rewardProgram(businessId, variables.rewardProgramId),
      });
      queryClient.invalidateQueries({ queryKey: businessQueryKeys.rewardPrograms(businessId) });
    },
    onError: (error) => settleKeyOnError(holderRef.current, error),
  });
}

export function useCreateNextRewardProgramVersionMutation(businessId: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const queryClient = useQueryClient();
  const holderRef = useRef(createIdempotencyKeyHolder());

  return useMutation({
    mutationFn: (
      payload: Omit<CreateNextRewardProgramVersionRequest, "businessId" | "idempotencyKey">,
    ) =>
      makeCallCreateNextRewardProgramVersion(functions)(requireReadyActor(actorState), {
        ...payload,
        businessId,
        idempotencyKey: holderRef.current.getKey(),
      }),
    onSuccess: (_result, variables) => {
      holderRef.current.clear();
      queryClient.invalidateQueries({
        queryKey: businessQueryKeys.rewardProgram(businessId, variables.rewardProgramId),
      });
      queryClient.invalidateQueries({ queryKey: businessQueryKeys.rewardPrograms(businessId) });
    },
    onError: (error) => settleKeyOnError(holderRef.current, error),
  });
}
