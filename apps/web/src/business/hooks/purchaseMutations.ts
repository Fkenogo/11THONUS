/**
 * Purchase mutation hook (`PLATFORM-BASELINE-006A`).
 *
 * Same `IdempotencyKeyHolder`/`settleKeyOnError` conventions as every
 * other mutation hook in this file family — `keyForRequest` rotation so a
 * retained key never leaks across purchases.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { useBusinessApiPlatform } from "../BusinessApiContext";
import { useAuthenticatedActor } from "./useAuthenticatedActor";
import { createIdempotencyKeyHolder } from "../api/idempotencyKeyHolder";
import { keyForRequest, settleKeyOnError } from "./businessMutations";
import { makeCallRecordPurchase, type RecordPurchaseRequest } from "../api/purchaseMutations";

function requireReadyActor(actorState: ReturnType<typeof useAuthenticatedActor>) {
  if (actorState.status !== "ready") {
    throw new Error("actor not ready");
  }
  return actorState.actor;
}

export function useRecordPurchaseMutation(businessId: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const queryClient = useQueryClient();
  const holderRef = useRef(createIdempotencyKeyHolder());
  const lastRequestRef = useRef<string | null>(null);

  return useMutation({
    mutationFn: (payload: Omit<RecordPurchaseRequest, "businessId" | "idempotencyKey">) =>
      makeCallRecordPurchase(functions)(requireReadyActor(actorState), {
        ...payload,
        businessId,
        idempotencyKey: keyForRequest(holderRef.current, lastRequestRef, JSON.stringify(payload)),
      }),
    onSuccess: () => {
      holderRef.current.clear();
      lastRequestRef.current = null;
      // Prefix invalidation: every status-filtered purchases list for this
      // Business refreshes after a record (react-query prefix match).
      queryClient.invalidateQueries({ queryKey: ["purchases", businessId] });
    },
    onError: (error) => settleKeyOnError(holderRef.current, error),
  });
}
