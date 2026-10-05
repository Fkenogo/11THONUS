import { useQuery } from "@tanstack/react-query";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { useAuthenticatedActor } from "../../identity/hooks/useAuthenticatedActor";
import { makeCustomerExperienceCalls } from "../api/customerExperienceClient";
import { customerPurchaseQueryKeys } from "./queryKeys";

function scopeOf(actorState: ReturnType<typeof useAuthenticatedActor>): string {
  return actorState.status === "ready" ? actorState.identityScope : "pending";
}

function actorOf(actorState: ReturnType<typeof useAuthenticatedActor>) {
  if (actorState.status !== "ready") throw new Error("actor not ready");
  return actorState.actor;
}

export function useCustomerExperienceOverviewQuery(platform: { auth: Auth; functions: Functions }) {
  const actorState = useAuthenticatedActor(platform.auth);
  return useQuery({
    queryKey: customerPurchaseQueryKeys.experience(scopeOf(actorState)),
    queryFn: () =>
      makeCustomerExperienceCalls(platform.functions).overview(actorOf(actorState), {}),
    enabled: actorState.status === "ready",
  });
}

export function useCustomerIdentityPresentationQuery(platform: {
  auth: Auth;
  functions: Functions;
}) {
  const actorState = useAuthenticatedActor(platform.auth);
  return useQuery({
    queryKey: customerPurchaseQueryKeys.identity(scopeOf(actorState)),
    queryFn: () =>
      makeCustomerExperienceCalls(platform.functions).identityPresentation(actorOf(actorState), {}),
    enabled: actorState.status === "ready",
  });
}
