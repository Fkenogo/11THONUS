/** Adapters for `updateBusinessProfile`/`updateBusinessBranchProfile` (design §16). */

import { httpsCallable, type Functions } from "firebase/functions";
import { toCallWithActor, type AuthenticatedActor } from "./businessCallableClient";
import { unwrapMutationResult, type MutationOutcome } from "./mutationOutcome";

export type BusinessProfilePatch = Partial<{
  legalName: string;
  displayName: string;
  primaryCategoryId: string;
  businessTypeId: string;
  countryCode: string;
  currencyCode: string;
  timezone: string;
  city: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  logoUrl: string;
  supportedLanguages: string[];
}>;

export type UpdateBusinessProfileRequest = {
  businessId: string;
  patch: BusinessProfilePatch;
  idempotencyKey: string;
};

export type BusinessBranchProfilePatch = Partial<{
  displayName: string;
  countryCode: string;
  city: string;
  address: string;
}>;

export type UpdateBusinessBranchProfileRequest = {
  businessId: string;
  branchId: string;
  patch: BusinessBranchProfilePatch;
  idempotencyKey: string;
};

type BoundCallable<TResult> = (
  payload: Record<string, unknown>,
) => Promise<{ data: MutationOutcome<TResult> }>;

function flattenPatchPayload<T extends { patch: Record<string, unknown> }>(
  payload: T,
): Record<string, unknown> {
  const { patch, ...rest } = payload;
  return { ...rest, ...patch };
}

export function toCallUpdateBusinessProfile(
  callable: BoundCallable<{ businessId: string }>,
): (
  actor: AuthenticatedActor,
  payload: UpdateBusinessProfileRequest,
) => Promise<{ businessId: string } | undefined> {
  const call = toCallWithActor<Record<string, unknown>, MutationOutcome<{ businessId: string }>>(
    callable,
  );
  return async (actor, payload) =>
    unwrapMutationResult(await call(actor, flattenPatchPayload(payload)));
}

export function makeCallUpdateBusinessProfile(
  functions: Functions,
): (
  actor: AuthenticatedActor,
  payload: UpdateBusinessProfileRequest,
) => Promise<{ businessId: string } | undefined> {
  return toCallUpdateBusinessProfile(httpsCallable(functions, "updateBusinessProfile"));
}

export function toCallUpdateBusinessBranchProfile(
  callable: BoundCallable<{ branchId: string }>,
): (
  actor: AuthenticatedActor,
  payload: UpdateBusinessBranchProfileRequest,
) => Promise<{ branchId: string } | undefined> {
  const call = toCallWithActor<Record<string, unknown>, MutationOutcome<{ branchId: string }>>(
    callable,
  );
  return async (actor, payload) =>
    unwrapMutationResult(await call(actor, flattenPatchPayload(payload)));
}

export function makeCallUpdateBusinessBranchProfile(
  functions: Functions,
): (
  actor: AuthenticatedActor,
  payload: UpdateBusinessBranchProfileRequest,
) => Promise<{ branchId: string } | undefined> {
  return toCallUpdateBusinessBranchProfile(httpsCallable(functions, "updateBusinessBranchProfile"));
}
