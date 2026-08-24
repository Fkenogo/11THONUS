/**
 * Adapter for the `createBusiness` callable — Business + default Branch
 * bootstrap (design §16). Unlike the other Business mutations, this callable
 * does not go through the `authorizeAndExecute` boundary (there is no
 * existing Business to authorize against yet) — it returns
 * `CreateBusinessResult` directly, not the `{outcome,...}` contract.
 */

import { httpsCallable, type Functions } from "firebase/functions";
import { toCallWithActor, type AuthenticatedActor } from "./businessCallableClient";
import type { BusinessStatus } from "./businessContext";

export type CreateBusinessRequest = {
  legalName?: string;
  displayName: string;
  primaryCategoryId: string;
  businessTypeId?: string;
  countryCode: string;
  currencyCode: string;
  timezone: string;
  city: string;
  address?: string;
  contactPhone: string;
  contactEmail?: string;
  /**
   * Required by the backend (TRD10 §10.6.3 types it `string[]`, present —
   * `parseSupportedLanguages` rejects a missing/non-array value). ENG-P2-002A's
   * independent review established `[]` as the legitimate governed value at
   * creation (mirrors `customerProfile.ts`'s "governed reference lists,
   * default empty" precedent) — no onboarding step collects this today, and
   * it remains editable later via `updateBusinessProfile`.
   */
  supportedLanguages: string[];
  idempotencyKey: string;
};

export type CreateBusinessResult = {
  businessId: string;
  businessCode: string;
  branchId: string;
  status: BusinessStatus;
};

type BoundCallable = (payload: Record<string, unknown>) => Promise<{ data: CreateBusinessResult }>;

export function toCallCreateBusiness(
  callable: BoundCallable,
): (actor: AuthenticatedActor, payload: CreateBusinessRequest) => Promise<CreateBusinessResult> {
  return toCallWithActor<CreateBusinessRequest, CreateBusinessResult>(callable);
}

export function makeCallCreateBusiness(
  functions: Functions,
): (actor: AuthenticatedActor, payload: CreateBusinessRequest) => Promise<CreateBusinessResult> {
  return toCallCreateBusiness(httpsCallable(functions, "createBusiness"));
}
