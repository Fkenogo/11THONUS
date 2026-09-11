import { httpsCallable, type Functions } from "firebase/functions";
import { toCallWithActor, type AuthenticatedActor } from "./businessCallableClient";
import type { BusinessStatus } from "./businessContext";

export type AccessibleBusinessSummary = {
  businessId: string;
  displayName: string;
  status: BusinessStatus;
  role: "owner" | "manager" | "staff";
};

type BoundCallable = (
  payload: Record<string, unknown>,
) => Promise<{ data: AccessibleBusinessSummary[] }>;

export function toCallGetAccessibleBusinesses(
  callable: BoundCallable,
): (actor: AuthenticatedActor) => Promise<AccessibleBusinessSummary[]> {
  const call = toCallWithActor<Record<string, never>, AccessibleBusinessSummary[]>(callable);
  return (actor) => call(actor, {});
}

export function makeCallGetAccessibleBusinesses(
  functions: Functions,
): (actor: AuthenticatedActor) => Promise<AccessibleBusinessSummary[]> {
  return toCallGetAccessibleBusinesses(httpsCallable(functions, "getAccessibleBusinesses"));
}
