/** Adapter for the `getBusinessContext` callable — the authoritative onboarding-hydration read (design §9/§14/§37.7). */

import { httpsCallable, type Functions } from "firebase/functions";
import { toCallWithActor, type AuthenticatedActor } from "./businessCallableClient";
import type { BusinessContext } from "./businessContext";

export type GetBusinessContextRequest = { businessId: string };

type BoundCallable = (payload: Record<string, unknown>) => Promise<{ data: BusinessContext }>;

export function toCallGetBusinessContext(
  callable: BoundCallable,
): (actor: AuthenticatedActor, payload: GetBusinessContextRequest) => Promise<BusinessContext> {
  return toCallWithActor<GetBusinessContextRequest, BusinessContext>(callable);
}

export function makeCallGetBusinessContext(
  functions: Functions,
): (actor: AuthenticatedActor, payload: GetBusinessContextRequest) => Promise<BusinessContext> {
  return toCallGetBusinessContext(httpsCallable(functions, "getBusinessContext"));
}
