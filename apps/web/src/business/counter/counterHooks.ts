/**
 * Staff Counter data hooks (`EA-BL-001-CORR-002-B`).
 *
 * Reads and the one write go through the existing callable adapters and the existing authenticated
 * actor — no new authority. The programme query projects through the whitelist immediately, so the
 * raw reward-program wire object (which carries the review threshold for Owner/Manager) never lives in
 * the Counter's cache. The record mutation takes a whole `CounterIntent` (payload + `purchaseDate` +
 * idempotency key) so a retry submits exactly what the first attempt did.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBusinessApiPlatform } from "../BusinessApiContext";
import { useAuthenticatedActor } from "../hooks/useAuthenticatedActor";
import { businessQueryKeys } from "../hooks/queryKeys";
import { makeCallListRewardPrograms } from "../api/rewardProgramMutations";
import {
  isBusinessReviewRequired,
  makeCallListMyRecentCounterPurchases,
  makeCallRecordPurchase,
} from "../api/purchaseMutations";
import { toCounterProgrammes, type CounterProgramme } from "./counterProgrammes";
import type { CounterIntent } from "./counterIntent";

function requireReadyActor(actorState: ReturnType<typeof useAuthenticatedActor>) {
  if (actorState.status !== "ready") {
    throw new Error("actor not ready");
  }
  return actorState.actor;
}

export function useCounterProgrammesQuery(businessId: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery<CounterProgramme[]>({
    queryKey: businessQueryKeys.counterProgrammes(businessId),
    queryFn: async () =>
      toCounterProgrammes(
        await makeCallListRewardPrograms(functions)(requireReadyActor(actorState), { businessId }),
      ),
    enabled: actorState.status === "ready" && Boolean(businessId),
  });
}

/** The feed is the signed-in member's OWN: its cache entry is partitioned by that member. */
export function counterActorScope(auth: { currentUser?: { uid: string } | null }): string {
  return auth.currentUser?.uid ?? "anonymous";
}

export function useCounterRecentQuery(businessId: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery({
    queryKey: businessQueryKeys.counterRecent(businessId, counterActorScope(auth)),
    queryFn: () =>
      makeCallListMyRecentCounterPurchases(functions)(requireReadyActor(actorState), {
        businessId,
      }),
    enabled: actorState.status === "ready" && Boolean(businessId),
  });
}

/**
 * What the Counter keeps from a recorded Purchase: the truthful routing outcome and the item/quantity
 * Staff themselves entered. The rest of the server's result row (customer identity id, Loyalty
 * Number snapshot, recorder, review fields…) is deliberately not retained in Counter state.
 */
export type CounterRecordOutcome = {
  readonly routing: "waiting_for_customer" | "business_review_required";
  readonly itemLabel: string;
  readonly quantity: number;
};

export function useRecordCounterPurchaseMutation(businessId: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (intent: CounterIntent): Promise<CounterRecordOutcome> => {
      const result = await makeCallRecordPurchase(functions)(requireReadyActor(actorState), {
        ...intent.request,
        businessId,
        idempotencyKey: intent.idempotencyKey,
      });
      return {
        routing: isBusinessReviewRequired(result)
          ? "business_review_required"
          : "waiting_for_customer",
        itemLabel: result.purchase.itemLabel,
        quantity: result.purchase.quantity,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["counterRecent", businessId] });
      queryClient.invalidateQueries({ queryKey: ["purchases", businessId] });
    },
  });
}
