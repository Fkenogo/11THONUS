/**
 * React Query read hooks (design §24). Each is `enabled` only once the
 * actor is `"ready"` — no call fires while auth state is still resolving.
 */

import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBusinessApiPlatform } from "../BusinessApiContext";
import { useAuthenticatedActor } from "./useAuthenticatedActor";
import { makeCallGetOwnedBusinesses } from "../api/ownedBusinesses";
import { makeCallGetAccessibleBusinesses } from "../api/accessibleBusinesses";
import { makeCallGetBusinessContext } from "../api/businessContextCallable";
import {
  makeCallListBusinessCategories,
  makeCallListBusinessTypesForCategory,
  makeCallListRewardProgramCategories,
  makeCallListQualifyingNodesForBusinessType,
  makeCallSearchQualifyingNodes,
  makeCallResolveKnowledgeNodeLabels,
} from "../api/commerceKnowledge";
import type { KnowledgeNodeLabel } from "../api/commerceKnowledge";
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
 * `PLATFORM-BASELINE-010B` (Founder decision `DEC-LOY-014` /
 * `FD-REWARD-QUALIFICATION-001`): the qualifying-node selector's DEFAULT
 * discovery scope, pre-filtered to the Business's own `businessTypeId`.
 * Mirrors `useBusinessTypesQuery` exactly, one level up the hierarchy.
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
 * (P2): the former qualifying-node selector's broader, platform-wide
 * "escape hatch" search -- no Business-Type restriction. Retained
 * unchanged as the optional-classification discovery surface
 * (`PLATFORM-BASELINE-013B` re-based Reward Program qualification on
 * Business-owned items; this Commerce Knowledge read is classification
 * aid only, consumed by the deferred `PLATFORM-BASELINE-013D` picker).
 * Disabled while the (caller-debounced -- see `useDebouncedValue`)
 * `searchText` is shorter than `MIN_SEARCH_TEXT_LENGTH` trimmed
 * characters, so neither a bare keystroke nor an empty box ever issues a
 * request. The server enforces the same bound independently and
 * authoritatively; this is a client-side request-avoidance courtesy, not
 * the security boundary.
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
 * of already-selected canonical Commerce Knowledge node ids (e.g. a
 * Qualifying Item's optional classification mapping) -- works for
 * `retired`/`archived` ids too, unlike the `active`-only candidate-list
 * reads above.
 */
export function useKnowledgeNodeLabelsQuery(nodeIds: readonly string[], languageCode?: string) {
  const { auth, functions } = useBusinessApiPlatform();
  const actorState = useAuthenticatedActor(auth);
  const queryClient = useQueryClient();
  const normalizedNodeIds = [...new Set(nodeIds)].sort();
  const batches = Array.from({ length: Math.ceil(normalizedNodeIds.length / 100) }, (_, index) =>
    normalizedNodeIds.slice(index * 100, (index + 1) * 100),
  );
  const batchResults = useQueries({
    queries: batches.map((batch, index) => {
      const queryKey = businessQueryKeys.knowledgeNodeLabels(batch, languageCode ?? "");
      const previousBatchKey =
        index > 0
          ? businessQueryKeys.knowledgeNodeLabels(batches[index - 1], languageCode ?? "")
          : undefined;
      const previousBatchStatus = previousBatchKey
        ? queryClient.getQueryState(previousBatchKey)?.status
        : undefined;

      return {
        queryKey,
        queryFn: () => {
          if (actorState.status !== "ready") throw new Error("actor not ready");
          return makeCallResolveKnowledgeNodeLabels(functions)(actorState.actor, {
            nodeIds: batch,
            languageCode,
          });
        },
        // A later batch starts once the preceding one settles, whether it
        // succeeded or failed. This keeps resolver traffic sequential while
        // allowing successful batches to render alongside a neutral fallback.
        enabled:
          actorState.status === "ready" &&
          (index === 0 || previousBatchStatus === "success" || previousBatchStatus === "error"),
        // Each batch owns its cache/retry state. A failed batch has no data,
        // so TanStack Query can retry it on normal focus/reconnect/remount
        // events without re-fetching successful, indefinitely fresh batches.
        staleTime: Infinity,
        retry: false,
      };
    }),
  });
  const settled = batchResults.every((result) => result.isSuccess || result.isError);
  return {
    data: batchResults.flatMap((result) => result.data ?? []) as KnowledgeNodeLabel[],
    isLoading: batchResults.some((result) => result.isLoading),
    isError: batchResults.some((result) => result.isError),
    isSuccess: settled && batchResults.every((result) => result.isSuccess),
  };
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
