/**
 * Business Reward / Loyalty-Cycle visibility read hooks
 * (`BUSINESS-REWARD-CYCLE-VISIBILITY-001`).
 *
 * Same pattern as `purchaseQueries.ts`, with one addition: an explicit
 * `enabled` flag so the page never issues the read for a viewer whose
 * known role cannot use it (Staff). That flag is a UX courtesy only —
 * Owner/Manager authorization and Business scoping are enforced by the
 * server regardless. Read-only: no mutation hook exists for this surface.
 */

import { useQuery } from "@tanstack/react-query";
import { useBusinessApiPlatform } from "../BusinessApiContext";
import { useAuthenticatedActor } from "./useAuthenticatedActor";
import {
  makeCallListAvailableRewardsForBusiness,
  makeCallListLoyaltyCycleProgressForBusiness,
} from "../api/businessLoyaltyVisibility";
import { businessQueryKeys } from "./queryKeys";

/** Upper bound the server accepts (purchase-read pagination convention). */
export const BUSINESS_LOYALTY_PAGE_LIMIT = 100;

export function useBusinessAvailableRewardsQuery(businessId: string, enabled: boolean) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery({
    queryKey: businessQueryKeys.businessAvailableRewards(businessId),
    queryFn: () =>
      makeCallListAvailableRewardsForBusiness(functions)(
        actorState.status === "ready"
          ? actorState.actor
          : (() => {
              throw new Error("actor not ready");
            })(),
        { businessId, limit: BUSINESS_LOYALTY_PAGE_LIMIT },
      ),
    enabled: enabled && actorState.status === "ready" && Boolean(businessId),
  });
}

export function useBusinessCycleProgressQuery(businessId: string, enabled: boolean) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery({
    queryKey: businessQueryKeys.businessCycleProgress(businessId),
    queryFn: () =>
      makeCallListLoyaltyCycleProgressForBusiness(functions)(
        actorState.status === "ready"
          ? actorState.actor
          : (() => {
              throw new Error("actor not ready");
            })(),
        { businessId, limit: BUSINESS_LOYALTY_PAGE_LIMIT },
      ),
    enabled: enabled && actorState.status === "ready" && Boolean(businessId),
  });
}
