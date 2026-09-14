/**
 * Customer purchase read hooks (`PLATFORM-BASELINE-006A`).
 *
 * Ownership-scoped server-side; the client never sends a customer id.
 */

import { useQuery } from "@tanstack/react-query";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { useAuthenticatedActor } from "../../identity/hooks/useAuthenticatedActor";
import { makeCustomerPurchaseCalls } from "../api/purchaseClient";
import { customerPurchaseQueryKeys } from "./queryKeys";

export type CustomerPlatform = { auth: Auth; functions: Functions };

function requireReadyActor(actorState: ReturnType<typeof useAuthenticatedActor>) {
  if (actorState.status !== "ready") {
    throw new Error("actor not ready");
  }
  return actorState.actor;
}

export function useWaitingPurchasesQuery(platform: CustomerPlatform) {
  const actorState = useAuthenticatedActor(platform.auth);
  return useQuery({
    queryKey: customerPurchaseQueryKeys.waiting(),
    queryFn: () =>
      makeCustomerPurchaseCalls(platform.functions).waitingPurchases(
        requireReadyActor(actorState),
        {},
      ),
    enabled: actorState.status === "ready",
  });
}

export function useCustomerPurchaseQuery(
  platform: CustomerPlatform,
  purchaseRecordId: string | undefined,
) {
  const actorState = useAuthenticatedActor(platform.auth);
  return useQuery({
    queryKey: customerPurchaseQueryKeys.purchase(purchaseRecordId ?? ""),
    queryFn: () =>
      makeCustomerPurchaseCalls(platform.functions).purchaseDetail(requireReadyActor(actorState), {
        purchaseRecordId: purchaseRecordId as string,
      }),
    enabled: actorState.status === "ready" && Boolean(purchaseRecordId),
  });
}

export function useAvailableRewardsQuery(platform: CustomerPlatform) {
  const actorState = useAuthenticatedActor(platform.auth);
  return useQuery({
    queryKey: customerPurchaseQueryKeys.rewards(),
    queryFn: () =>
      makeCustomerPurchaseCalls(platform.functions).availableRewards(
        requireReadyActor(actorState),
        {},
      ),
    enabled: actorState.status === "ready",
  });
}
