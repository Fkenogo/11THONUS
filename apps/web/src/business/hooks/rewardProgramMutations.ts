/**
 * Reward Program mutation hooks (`PLATFORM-BASELINE-005A`).
 *
 * Same `IdempotencyKeyHolder`/`settleKeyOnError` conventions as every
 * other mutation hook in this file family — reused, not duplicated.
 *
 * Every hook here is mounted ONCE for the whole Reward Program management
 * page, not once per program, so its held key is scoped to whichever
 * request it was last issued for via the SAME `keyForRequest` rotation
 * pattern `PLATFORM-BASELINE-004A-CORR-001` introduced for the Team
 * page's shared list-action hooks (corrected by
 * `PLATFORM-BASELINE-005A-CORR-001` Finding 3, which found the retained
 * key of a retryable failure against one program producing a false
 * server-side idempotency conflict when the operator's next action
 * targeted a different program): a retry of the same unchanged request
 * replays the same key; any materially different request rotates to a
 * fresh key.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { useBusinessApiPlatform } from "../BusinessApiContext";
import { useAuthenticatedActor } from "./useAuthenticatedActor";
import { createIdempotencyKeyHolder } from "../api/idempotencyKeyHolder";
import { keyForRequest, settleKeyOnError } from "./businessMutations";
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
  const lastRequestRef = useRef<string | null>(null);

  return useMutation({
    mutationFn: (payload: Omit<CreateRewardProgramRequest, "businessId" | "idempotencyKey">) =>
      makeCallCreateRewardProgram(functions)(requireReadyActor(actorState), {
        ...payload,
        businessId,
        idempotencyKey: keyForRequest(holderRef.current, lastRequestRef, JSON.stringify(payload)),
      }),
    onSuccess: () => {
      holderRef.current.clear();
      lastRequestRef.current = null;
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
  const lastRequestRef = useRef<string | null>(null);

  return useMutation({
    mutationFn: (payload: Omit<UpdateRewardProgramDraftRequest, "businessId" | "idempotencyKey">) =>
      makeCallUpdateRewardProgramDraft(functions)(requireReadyActor(actorState), {
        ...payload,
        businessId,
        idempotencyKey: keyForRequest(holderRef.current, lastRequestRef, JSON.stringify(payload)),
      }),
    onSuccess: (_result, variables) => {
      holderRef.current.clear();
      lastRequestRef.current = null;
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
  const lastRequestRef = useRef<string | null>(null);

  return useMutation({
    mutationFn: (
      payload: Omit<PublishRewardProgramVersionRequest, "businessId" | "idempotencyKey">,
    ) =>
      makeCallPublishRewardProgramVersion(functions)(requireReadyActor(actorState), {
        ...payload,
        businessId,
        idempotencyKey: keyForRequest(holderRef.current, lastRequestRef, JSON.stringify(payload)),
      }),
    onSuccess: (_result, variables) => {
      holderRef.current.clear();
      lastRequestRef.current = null;
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
  const lastRequestRef = useRef<string | null>(null);

  return useMutation({
    mutationFn: (
      payload: Omit<CreateNextRewardProgramVersionRequest, "businessId" | "idempotencyKey">,
    ) =>
      makeCallCreateNextRewardProgramVersion(functions)(requireReadyActor(actorState), {
        ...payload,
        businessId,
        idempotencyKey: keyForRequest(holderRef.current, lastRequestRef, JSON.stringify(payload)),
      }),
    onSuccess: (_result, variables) => {
      holderRef.current.clear();
      lastRequestRef.current = null;
      queryClient.invalidateQueries({
        queryKey: businessQueryKeys.rewardProgram(businessId, variables.rewardProgramId),
      });
      queryClient.invalidateQueries({ queryKey: businessQueryKeys.rewardPrograms(businessId) });
    },
    onError: (error) => settleKeyOnError(holderRef.current, error),
  });
}
