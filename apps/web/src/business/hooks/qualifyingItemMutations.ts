/**
 * Qualifying Item mutation hooks (`PLATFORM-BASELINE-013B`).
 *
 * Same `IdempotencyKeyHolder`/`settleKeyOnError` conventions as the Reward
 * Program mutation hooks -- reused, not duplicated. Mounted once for the
 * whole Qualifying Items section, so each held key rotates via the shared
 * `keyForRequest` pattern: a retry of the same unchanged request replays
 * the same key; any materially different request rotates to a fresh key.
 *
 * Server authorization remains mandatory (`qualifyingItem.manage`,
 * Owner/Manager) -- the role-based control visibility in the UI is
 * convenience, never enforcement.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { useBusinessApiPlatform } from "../BusinessApiContext";
import { useAuthenticatedActor } from "./useAuthenticatedActor";
import { createIdempotencyKeyHolder } from "../api/idempotencyKeyHolder";
import { keyForRequest, settleKeyOnError } from "./businessMutations";
import {
  makeCallCreateQualifyingItem,
  makeCallRetireQualifyingItem,
  makeCallUpdateQualifyingItem,
  type CreateQualifyingItemRequest,
  type RetireQualifyingItemRequest,
  type UpdateQualifyingItemRequest,
} from "../api/qualifyingItems";
import { businessQueryKeys } from "./queryKeys";

function requireReadyActor(actorState: ReturnType<typeof useAuthenticatedActor>) {
  if (actorState.status !== "ready") {
    throw new Error("actor not ready");
  }
  return actorState.actor;
}

function useInvalidateQualifyingItems(businessId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: businessQueryKeys.qualifyingItems(businessId) });
    queryClient.invalidateQueries({ queryKey: businessQueryKeys.rewardPrograms(businessId) });
  };
}

export function useCreateQualifyingItemMutation(businessId: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const invalidate = useInvalidateQualifyingItems(businessId);
  const holderRef = useRef(createIdempotencyKeyHolder());
  const lastRequestRef = useRef<string | null>(null);

  return useMutation({
    mutationFn: (payload: Omit<CreateQualifyingItemRequest, "businessId" | "idempotencyKey">) =>
      makeCallCreateQualifyingItem(functions)(requireReadyActor(actorState), {
        ...payload,
        businessId,
        idempotencyKey: keyForRequest(holderRef.current, lastRequestRef, JSON.stringify(payload)),
      }),
    onSuccess: () => {
      holderRef.current.clear();
      lastRequestRef.current = null;
      invalidate();
    },
    onError: (error) => settleKeyOnError(holderRef.current, error),
  });
}

export function useUpdateQualifyingItemMutation(businessId: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const invalidate = useInvalidateQualifyingItems(businessId);
  const holderRef = useRef(createIdempotencyKeyHolder());
  const lastRequestRef = useRef<string | null>(null);

  return useMutation({
    mutationFn: (payload: Omit<UpdateQualifyingItemRequest, "businessId" | "idempotencyKey">) =>
      makeCallUpdateQualifyingItem(functions)(requireReadyActor(actorState), {
        ...payload,
        businessId,
        idempotencyKey: keyForRequest(holderRef.current, lastRequestRef, JSON.stringify(payload)),
      }),
    onSuccess: () => {
      holderRef.current.clear();
      lastRequestRef.current = null;
      invalidate();
    },
    onError: (error) => settleKeyOnError(holderRef.current, error),
  });
}

export function useRetireQualifyingItemMutation(businessId: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const invalidate = useInvalidateQualifyingItems(businessId);
  const holderRef = useRef(createIdempotencyKeyHolder());
  const lastRequestRef = useRef<string | null>(null);

  return useMutation({
    mutationFn: (payload: Omit<RetireQualifyingItemRequest, "businessId" | "idempotencyKey">) =>
      makeCallRetireQualifyingItem(functions)(requireReadyActor(actorState), {
        ...payload,
        businessId,
        idempotencyKey: keyForRequest(holderRef.current, lastRequestRef, JSON.stringify(payload)),
      }),
    onSuccess: () => {
      holderRef.current.clear();
      lastRequestRef.current = null;
      invalidate();
    },
    onError: (error) => settleKeyOnError(holderRef.current, error),
  });
}
