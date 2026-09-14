/**
 * Customer purchase mutation hooks (`PLATFORM-BASELINE-006A`).
 *
 * Same `IdempotencyKeyHolder`/`keyForRequest` rotation conventions as the
 * Business mutation hooks — a retry of the same unchanged request replays
 * the same key; any materially different request rotates to a fresh key.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { useAuthenticatedActor } from "../../identity/hooks/useAuthenticatedActor";
import { createIdempotencyKeyHolder } from "../../identity/api/idempotencyKeyHolder";
import { makeCustomerPurchaseCalls } from "../api/purchaseClient";
import { customerPurchaseQueryKeys } from "./queryKeys";
import type { CustomerPlatform } from "./purchaseQueries";

function requireReadyActor(actorState: ReturnType<typeof useAuthenticatedActor>) {
  if (actorState.status !== "ready") {
    throw new Error("actor not ready");
  }
  return actorState.actor;
}

/**
 * `keyForRequest`/`settleKeyOnError` mirrored from the Business
 * `businessMutations.ts` conventions (same key-rotation and retryable-
 * settlement semantics: `unavailable`/`timeout` keep the held key, every
 * definitive outcome clears it) but implemented locally against the
 * Identity-domain `IdempotencyKeyHolder` interface (`getKey`/`clear`) —
 * the codebase's disclosed-duplication convention keeps the customer
 * surface free of Business-hook imports.
 */
function settleKeyOnError(holder: { clear: () => void }, error: unknown): void {
  const code = (error as { code?: unknown } | undefined)?.code;
  if (code !== "unavailable" && code !== "timeout") {
    holder.clear();
  }
}

function keyForRequest(
  holder: { getKey: () => string; clear: () => void },
  lastSignature: { current: string | null },
  signature: string,
): string {
  if (lastSignature.current !== null && lastSignature.current !== signature) {
    holder.clear();
  }
  lastSignature.current = signature;
  return holder.getKey();
}

function usePurchaseMutationHarness(platform: CustomerPlatform) {
  const actorState = useAuthenticatedActor(platform.auth);
  const queryClient = useQueryClient();
  const holderRef = useRef(createIdempotencyKeyHolder());
  const lastRequestRef = useRef<string | null>(null);
  return { actorState, queryClient, holderRef, lastRequestRef };
}

function settleSuccess(
  harness: ReturnType<typeof usePurchaseMutationHarness>,
  purchaseRecordId: string,
) {
  harness.holderRef.current.clear();
  harness.lastRequestRef.current = null;
  harness.queryClient.invalidateQueries({ queryKey: customerPurchaseQueryKeys.waiting() });
  harness.queryClient.invalidateQueries({
    queryKey: customerPurchaseQueryKeys.purchase(purchaseRecordId),
  });
  harness.queryClient.invalidateQueries({ queryKey: customerPurchaseQueryKeys.rewards() });
}

export function useVerifyPurchaseMutation(platform: CustomerPlatform) {
  const harness = usePurchaseMutationHarness(platform);
  return useMutation({
    mutationFn: (payload: { purchaseRecordId: string }) =>
      makeCustomerPurchaseCalls(platform.functions).verifyPurchase(
        requireReadyActor(harness.actorState),
        {
          ...payload,
          idempotencyKey: keyForRequest(
            harness.holderRef.current,
            harness.lastRequestRef,
            JSON.stringify(payload),
          ),
        },
      ),
    onSuccess: (_result, variables) => settleSuccess(harness, variables.purchaseRecordId),
    onError: (error) => settleKeyOnError(harness.holderRef.current, error),
  });
}

export function useRejectPurchaseMutation(platform: CustomerPlatform) {
  const harness = usePurchaseMutationHarness(platform);
  return useMutation({
    mutationFn: (payload: { purchaseRecordId: string; reason: string }) =>
      makeCustomerPurchaseCalls(platform.functions).rejectPurchase(
        requireReadyActor(harness.actorState),
        {
          ...payload,
          idempotencyKey: keyForRequest(
            harness.holderRef.current,
            harness.lastRequestRef,
            JSON.stringify(payload),
          ),
        },
      ),
    onSuccess: (_result, variables) => settleSuccess(harness, variables.purchaseRecordId),
    onError: (error) => settleKeyOnError(harness.holderRef.current, error),
  });
}

export function useDisputePurchaseMutation(platform: CustomerPlatform) {
  const harness = usePurchaseMutationHarness(platform);
  return useMutation({
    mutationFn: (payload: { purchaseRecordId: string; reason: string }) =>
      makeCustomerPurchaseCalls(platform.functions).raisePurchaseDispute(
        requireReadyActor(harness.actorState),
        {
          ...payload,
          idempotencyKey: keyForRequest(
            harness.holderRef.current,
            harness.lastRequestRef,
            JSON.stringify(payload),
          ),
        },
      ),
    onSuccess: (_result, variables) => settleSuccess(harness, variables.purchaseRecordId),
    onError: (error) => settleKeyOnError(harness.holderRef.current, error),
  });
}
