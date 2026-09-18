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
  makeCallListQualifyingNodesForBusinessType,
  makeCallSearchQualifyingNodes,
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
    queryKey: businessQueryKeys.rewardProgramCategories(languageCode ?? ""),
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
    queryKey: businessQueryKeys.qualifyingNodes(categoryId ?? "", languageCode ?? ""),
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
 * `PLATFORM-BASELINE-010B` (Founder decision `DEC-LOY-014` /
 * `FD-REWARD-QUALIFICATION-001`): the qualifying-node selector's DEFAULT
 * discovery scope, pre-filtered to the Business's own `businessTypeId`.
 * Mirrors `useQualifyingNodesForCategoryQuery` exactly, one level up the
 * hierarchy.
 */
export function useQualifyingNodesForBusinessTypeQuery(
  businessTypeId: string | undefined,
  languageCode?: string,
) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery({
    queryKey: businessQueryKeys.qualifyingNodesForBusinessType(
      businessTypeId ?? "",
      languageCode ?? "",
    ),
    queryFn: () =>
      makeCallListQualifyingNodesForBusinessType(functions)(
        actorState.status === "ready"
          ? actorState.actor
          : (() => {
              throw new Error("actor not ready");
            })(),
        { businessTypeId: businessTypeId as string, languageCode },
      ),
    enabled: actorState.status === "ready" && Boolean(businessTypeId),
    staleTime: Infinity,
  });
}

/**
 * `PLATFORM-BASELINE-010B-CORR-001` (P2): the same minimum trimmed-length
 * gate the server (`searchQualifyingNodes`'s `MIN_SEARCH_TEXT_LENGTH`)
 * enforces authoritatively -- kept here too so a one-character keystroke
 * never even reaches the network, not just so the server rejects it once
 * it arrives.
 */
const MIN_SEARCH_TEXT_LENGTH = 2;

/**
 * `PLATFORM-BASELINE-010B`, bounded by `PLATFORM-BASELINE-010B-CORR-001`
 * (P2): the qualifying-node selector's broader, platform-wide "escape
 * hatch" search — no Business-Type restriction. Disabled while the
 * (caller-debounced -- see `QualifyingNodeSelector`'s use of
 * `useDebouncedValue`) `searchText` is shorter than
 * `MIN_SEARCH_TEXT_LENGTH` trimmed characters, so neither a bare keystroke
 * nor an empty box ever issues a request. The server enforces the same
 * bound independently and authoritatively; this is a client-side
 * request-avoidance courtesy, not the security boundary.
 */
export function useSearchQualifyingNodesQuery(searchText: string, languageCode?: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  return useQuery({
    queryKey: businessQueryKeys.searchQualifyingNodes(searchText, languageCode ?? ""),
    queryFn: () =>
      makeCallSearchQualifyingNodes(functions)(
        actorState.status === "ready"
          ? actorState.actor
          : (() => {
              throw new Error("actor not ready");
            })(),
        { searchText, languageCode },
      ),
    enabled: actorState.status === "ready" && searchText.trim().length >= MIN_SEARCH_TEXT_LENGTH,
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
    queryKey: businessQueryKeys.knowledgeNodeLabels(nodeIds, languageCode ?? ""),
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
