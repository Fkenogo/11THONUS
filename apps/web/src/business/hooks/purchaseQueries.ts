/**
 * Purchase read hooks (`PLATFORM-BASELINE-006A`).
 *
 * Same pattern as `rewardProgramQueries.ts` — membership-gated
 * server-side, no client role check here.
 */

import { useQuery } from "@tanstack/react-query";
import { useBusinessApiPlatform } from "../BusinessApiContext";
import { useAuthenticatedActor } from "./useAuthenticatedActor";
import {
  makeCallGetBusinessPurchaseRecord,
  makeCallListPurchasesForBusiness,
} from "../api/purchaseMutations";
import { businessQueryKeys } from "./queryKeys";

export function usePurchasesQuery(businessId: string | undefined, status?: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery({
    queryKey: businessQueryKeys.purchases(businessId ?? "", status ?? ""),
    queryFn: () =>
      makeCallListPurchasesForBusiness(functions)(
        actorState.status === "ready"
          ? actorState.actor
          : (() => {
              throw new Error("actor not ready");
            })(),
        { businessId: businessId as string, status },
      ),
    enabled: actorState.status === "ready" && Boolean(businessId),
  });
}

export function useBusinessPurchaseQuery(
  businessId: string | undefined,
  purchaseRecordId: string | undefined,
) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery({
    queryKey: businessQueryKeys.purchase(businessId ?? "", purchaseRecordId ?? ""),
    queryFn: () =>
      makeCallGetBusinessPurchaseRecord(functions)(
        actorState.status === "ready"
          ? actorState.actor
          : (() => {
              throw new Error("actor not ready");
            })(),
        { businessId: businessId as string, purchaseRecordId: purchaseRecordId as string },
      ),
    enabled: actorState.status === "ready" && Boolean(businessId) && Boolean(purchaseRecordId),
  });
}
