/** Adapter for the `getOwnedBusinesses` callable (design §9). */

import { httpsCallable, type Functions } from "firebase/functions";
import { toCallWithActor, type AuthenticatedActor } from "./businessCallableClient";
import type { BusinessStatus } from "./businessContext";

export type OwnedBusinessSummary = {
  businessId: string;
  businessCode: string;
  displayName: string;
  status: BusinessStatus;
  primaryCategoryId: string;
  businessTypeId?: string;
};

type BoundCallable = (
  payload: Record<string, unknown>,
) => Promise<{ data: OwnedBusinessSummary[] }>;

export function toCallGetOwnedBusinesses(
  callable: BoundCallable,
): (actor: AuthenticatedActor) => Promise<OwnedBusinessSummary[]> {
  const call = toCallWithActor<Record<string, never>, OwnedBusinessSummary[]>(callable);
  return (actor) => call(actor, {});
}

export function makeCallGetOwnedBusinesses(
  functions: Functions,
): (actor: AuthenticatedActor) => Promise<OwnedBusinessSummary[]> {
  return toCallGetOwnedBusinesses(httpsCallable(functions, "getOwnedBusinesses"));
}
