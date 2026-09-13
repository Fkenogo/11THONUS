/**
 * Reward Program read hooks (`PLATFORM-BASELINE-005A`).
 *
 * Same pattern as `useStaffInvitationsQuery`/`useStaffMembershipsQuery` --
 * membership-gated server-side, no client role check needed here (the
 * server denies non-members; the UI's own role-based control visibility is
 * convenience, never enforcement).
 */

import { useQuery } from "@tanstack/react-query";
import { useBusinessApiPlatform } from "../BusinessApiContext";
import { useAuthenticatedActor } from "./useAuthenticatedActor";
import {
  makeCallGetRewardProgram,
  makeCallListRewardPrograms,
} from "../api/rewardProgramMutations";
import { businessQueryKeys } from "./queryKeys";

export function useRewardProgramsQuery(businessId: string | undefined) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery({
    queryKey: businessQueryKeys.rewardPrograms(businessId ?? ""),
    queryFn: () =>
      makeCallListRewardPrograms(functions)(
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

export function useRewardProgramQuery(
  businessId: string | undefined,
  rewardProgramId: string | undefined,
) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery({
    queryKey: businessQueryKeys.rewardProgram(businessId ?? "", rewardProgramId ?? ""),
    queryFn: () =>
      makeCallGetRewardProgram(functions)(
        actorState.status === "ready"
          ? actorState.actor
          : (() => {
              throw new Error("actor not ready");
            })(),
        { businessId: businessId as string, rewardProgramId: rewardProgramId as string },
      ),
    enabled: actorState.status === "ready" && Boolean(businessId) && Boolean(rewardProgramId),
  });
}
