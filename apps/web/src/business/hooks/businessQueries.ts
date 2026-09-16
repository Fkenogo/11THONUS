/**
 * React Query read hooks (design §24). Each is `enabled` only once the
 * actor is `"ready"` — no call fires while auth state is still resolving.
 */

import { useQuery } from "@tanstack/react-query";
import { useBusinessApiPlatform } from "../BusinessApiContext";
import { useAuthenticatedActor } from "./useAuthenticatedActor";
import { makeCallGetOwnedBusinesses } from "../api/ownedBusinesses";
import { makeCallGetAccessibleBusinesses } from "../api/accessibleBusinesses";
import { makeCallGetBusinessContext } from "../api/businessContextCallable";
import {
  makeCallListBusinessCategories,
  makeCallListBusinessTypesForCategory,
  makeCallListRewardProgramCategories,
  makeCallListQualifyingNodesForCategory,
  makeCallResolveKnowledgeNodeLabels,
} from "../api/commerceKnowledge";
import { makeCallListStaffInvitations, makeCallListStaffMemberships } from "../api/staffLists";
import { businessQueryKeys } from "./queryKeys";

export function useOwnedBusinessesQuery() {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery({
    queryKey: businessQueryKeys.owned(),
    queryFn: () =>
      makeCallGetOwnedBusinesses(functions)(
        actorState.status === "ready"
          ? actorState.actor
          : (() => {
              throw new Error("actor not ready");
            })(),
      ),
    enabled: actorState.status === "ready",
  });
}

export function useAccessibleBusinessesQuery() {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery({
    queryKey: businessQueryKeys.accessible(),
    queryFn: () =>
      makeCallGetAccessibleBusinesses(functions)(
        actorState.status === "ready"
          ? actorState.actor
          : (() => {
              throw new Error("actor not ready");
            })(),
      ),
    enabled: actorState.status === "ready",
  });
}

export function useBusinessContextQuery(businessId: string | undefined) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery({
    queryKey: businessQueryKeys.context(businessId ?? ""),
    queryFn: () =>
      makeCallGetBusinessContext(functions)(
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

export function useBusinessCategoriesQuery(languageCode?: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery({
    queryKey: businessQueryKeys.categories(),
    queryFn: () =>
      makeCallListBusinessCategories(functions)(
        actorState.status === "ready"
          ? actorState.actor
          : (() => {
              throw new Error("actor not ready");
            })(),
        { languageCode },
      ),
    enabled: actorState.status === "ready",
    staleTime: Infinity,
  });
}

export function useBusinessTypesQuery(categoryId: string | undefined, languageCode?: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery({
    queryKey: businessQueryKeys.types(categoryId ?? ""),
    queryFn: () =>
      makeCallListBusinessTypesForCategory(functions)(
        actorState.status === "ready"
          ? actorState.actor
          : (() => {
              throw new Error("actor not ready");
            })(),
        { categoryId: categoryId as string, languageCode },
      ),
    enabled: actorState.status === "ready" && Boolean(categoryId),
    staleTime: Infinity,
  });
}

/**
 * `PLATFORM-BASELINE-008`: the Reward Program create-form category
 * selector's candidate list. Mirrors `useBusinessCategoriesQuery` exactly.
 */
export function useRewardProgramCategoriesQuery(languageCode?: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery({
    queryKey: businessQueryKeys.rewardProgramCategories(),
    queryFn: () =>
      makeCallListRewardProgramCategories(functions)(
        actorState.status === "ready"
          ? actorState.actor
          : (() => {
              throw new Error("actor not ready");
            })(),
        { languageCode },
      ),
    enabled: actorState.status === "ready",
    staleTime: Infinity,
  });
}

/**
 * `PLATFORM-BASELINE-008`: the Reward Program qualifying-node selector's
 * candidate list for a given (already-known) Reward Program category id.
 * Mirrors `useBusinessTypesQuery` exactly.
 */
export function useQualifyingNodesForCategoryQuery(
  categoryId: string | undefined,
  languageCode?: string,
) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery({
    queryKey: businessQueryKeys.qualifyingNodes(categoryId ?? ""),
    queryFn: () =>
      makeCallListQualifyingNodesForCategory(functions)(
        actorState.status === "ready"
          ? actorState.actor
          : (() => {
              throw new Error("actor not ready");
            })(),
        { categoryId: categoryId as string, languageCode },
      ),
    enabled: actorState.status === "ready" && Boolean(categoryId),
    staleTime: Infinity,
  });
}

/**
 * `PLATFORM-BASELINE-008`: display-only label hydration for a bounded set
 * of already-selected canonical Commerce Knowledge node ids (a Reward
 * Program draft's persisted `qualifyingNodes`) — works for `retired`/
 * `archived` ids too, unlike `useQualifyingNodesForCategoryQuery`'s
 * `active`-only candidate list.
 */
export function useKnowledgeNodeLabelsQuery(nodeIds: readonly string[], languageCode?: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery({
    queryKey: businessQueryKeys.knowledgeNodeLabels(nodeIds),
    queryFn: () =>
      makeCallResolveKnowledgeNodeLabels(functions)(
        actorState.status === "ready"
          ? actorState.actor
          : (() => {
              throw new Error("actor not ready");
            })(),
        { nodeIds: [...nodeIds], languageCode },
      ),
    enabled: actorState.status === "ready" && nodeIds.length > 0,
    staleTime: Infinity,
  });
}

export function useStaffInvitationsQuery(businessId: string | undefined) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery({
    queryKey: businessQueryKeys.staffInvitations(businessId ?? ""),
    queryFn: () =>
      makeCallListStaffInvitations(functions)(
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

export function useStaffMembershipsQuery(businessId: string | undefined) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery({
    queryKey: businessQueryKeys.staffMemberships(businessId ?? ""),
    queryFn: () =>
      makeCallListStaffMemberships(functions)(
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
