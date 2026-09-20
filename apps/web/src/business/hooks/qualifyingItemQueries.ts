/**
 * Qualifying Item read hook (`PLATFORM-BASELINE-013B`).
 *
 * Membership-gated server-side, no client role check needed here (the
 * server denies non-members; the UI's own role-based control visibility is
 * convenience, never enforcement) -- same pattern as
 * `rewardProgramQueries.ts`. Staff included: selecting a configured item
 * for an authorised frontline action requires no management permission
 * (`DEC-LOY-017`).
 */

import { useQuery } from "@tanstack/react-query";
import { useBusinessApiPlatform } from "../BusinessApiContext";
import { useAuthenticatedActor } from "./useAuthenticatedActor";
import { makeCallListQualifyingItems } from "../api/qualifyingItems";
import { businessQueryKeys } from "./queryKeys";

export function useQualifyingItemsQuery(businessId: string | undefined) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery({
    queryKey: businessQueryKeys.qualifyingItems(businessId ?? ""),
    queryFn: () =>
      makeCallListQualifyingItems(functions)(
        actorState.status === "ready"
          ? actorState.actor
          : (() => {
              throw new Error("actor not ready");
            })(),
        { businessId: businessId as string },
      ),
    enabled: actorState.status === "ready" && Boolean(businessId),
  });
}
