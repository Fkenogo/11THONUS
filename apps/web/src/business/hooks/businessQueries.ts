/**
 * React Query read hooks (design §24). Each is `enabled` only once the
 * actor is `"ready"` — no call fires while auth state is still resolving.
 */

import { useQuery } from "@tanstack/react-query";
import { useBusinessApiPlatform } from "../BusinessApiContext";
import { useAuthenticatedActor } from "./useAuthenticatedActor";
import { makeCallGetOwnedBusinesses } from "../api/ownedBusinesses";
import { makeCallGetBusinessContext } from "../api/businessContextCallable";
import {
  makeCallListBusinessCategories,
  makeCallListBusinessTypesForCategory,
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
