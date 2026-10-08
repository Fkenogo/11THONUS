/**
 * Staff Counter data hooks (`EA-BL-001-CORR-002-B`).
 *
 * Reads and the one write go through the existing callable adapters and the existing authenticated
 * actor — no new authority. The programme query projects through the whitelist immediately, so the
 * raw reward-program wire object (which carries the review threshold for Owner/Manager) never lives in
 * the Counter's cache. The record mutation takes a whole `CounterIntent` (payload + `purchaseDate` +
 * idempotency key) so a retry submits exactly what the first attempt did.
 */

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBusinessApiPlatform } from "../BusinessApiContext";
import { useAuthenticatedActor } from "../hooks/useAuthenticatedActor";
import { businessQueryKeys } from "../hooks/queryKeys";
import { makeCallListRewardPrograms } from "../api/rewardProgramMutations";
import {
  isBusinessReviewRequired,
  makeCallGetCounterLoyaltyContext,
  makeCallListMyRecentCounterPurchases,
  makeCallRecordPurchase,
  type CounterLoyaltyContextWire,
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

/** Rows per Activity page. The server caps a page at 20 and pages by an opaque keyset cursor. */
export const COUNTER_ACTIVITY_PAGE_SIZE = 20;

/**
 * The Staff Activity view: the member's OWN submissions, newest first, "load more" by cursor. The
 * server scopes every page to the authenticated recorder and Business; the cache entry is also
 * partitioned by that member.
 */
export function useCounterActivityQuery(businessId: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useInfiniteQuery({
    queryKey: businessQueryKeys.counterRecent(businessId, counterActorScope(auth)),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      makeCallListMyRecentCounterPurchases(functions)(requireReadyActor(actorState), {
        businessId,
        limit: COUNTER_ACTIVITY_PAGE_SIZE,
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: actorState.status === "ready" && Boolean(businessId),
  });
}

/** The presented customer artifact the loyalty context is read for (never a Customer id). */
export type CounterLoyaltyArtifact =
  | { readonly kind: "loyalty_number"; readonly value: string }
  | { readonly kind: "qr_identity"; readonly value: string };

/**
 * What the Counter keeps from the limited loyalty read: the four whitelisted values, rebuilt
 * field-by-field so nothing else the wire might carry is ever retained.
 */
function toLoyaltyContext(wire: CounterLoyaltyContextWire): CounterLoyaltyContextWire {
  return {
    verifiedUnits: wire.verifiedUnits,
    requiredVerifiedUnits: wire.requiredVerifiedUnits,
    rewardStatus: wire.rewardStatus === "available" ? "available" : "none",
    awaitingCustomerConfirmationUnits: wire.awaitingCustomerConfirmationUnits,
  };
}

/**
 * Limited loyalty status for the transaction being prepared: ONE presented artifact in ONE Programme.
 * It never retries (a neutral failure is final for that code), is considered stale immediately, and is
 * dropped from the cache shortly after the Counter stops showing it — progress is read fresh for every
 * customer served and is never accumulated into a customer directory.
 */
export function useCounterLoyaltyQuery(
  businessId: string,
  rewardProgramId: string | null,
  artifact: CounterLoyaltyArtifact | null,
) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const enabled =
    actorState.status === "ready" &&
    Boolean(businessId) &&
    rewardProgramId !== null &&
    artifact !== null;
  return useQuery<CounterLoyaltyContextWire>({
    queryKey: businessQueryKeys.counterLoyalty(
      businessId,
      counterActorScope(auth),
      rewardProgramId ?? "",
      artifact?.kind ?? "loyalty_number",
      artifact?.value ?? "",
    ),
    queryFn: async () => {
      if (rewardProgramId === null || artifact === null) throw new Error("no transaction context");
      const result = await makeCallGetCounterLoyaltyContext(functions)(
        requireReadyActor(actorState),
        artifact.kind === "qr_identity"
          ? { businessId, rewardProgramId, qrReference: artifact.value }
          : { businessId, rewardProgramId, loyaltyNumberValue: artifact.value },
      );
      return toLoyaltyContext(result);
    },
    enabled,
    retry: false,
    staleTime: 0,
    gcTime: 30_000,
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
      queryClient.invalidateQueries({ queryKey: ["counterLoyalty", businessId] });
      queryClient.invalidateQueries({ queryKey: ["purchases", businessId] });
    },
  });
}
