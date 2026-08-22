/**
 * Adapter for `acceptBusinessTerms` (design §37.6/§37.8). Only `businessId`,
 * an optional `languageCode`/`collectionMethod`, and `idempotencyKey` are
 * ever sent — `termsVersion`, the accepting identity, and `acceptedAt` are
 * always server-resolved and structurally cannot be smuggled through this
 * type. Returns the result directly (no `authorizeAndExecute` wrapper).
 */

import { httpsCallable, type Functions } from "firebase/functions";
import { toCallWithActor, type AuthenticatedActor } from "./businessCallableClient";

export type AcceptBusinessTermsRequest = {
  businessId: string;
  languageCode?: string;
  collectionMethod?: string;
  idempotencyKey: string;
};

export type AcceptBusinessTermsResult = {
  businessId: string;
  termsVersion: string;
  acceptedAt: string;
  alreadyAccepted: boolean;
};

type BoundCallable = (
  payload: Record<string, unknown>,
) => Promise<{ data: AcceptBusinessTermsResult }>;

export function toCallAcceptBusinessTerms(
  callable: BoundCallable,
): (
  actor: AuthenticatedActor,
  payload: AcceptBusinessTermsRequest,
) => Promise<AcceptBusinessTermsResult> {
  return toCallWithActor<AcceptBusinessTermsRequest, AcceptBusinessTermsResult>(callable);
}

export function makeCallAcceptBusinessTerms(
  functions: Functions,
): (
  actor: AuthenticatedActor,
  payload: AcceptBusinessTermsRequest,
) => Promise<AcceptBusinessTermsResult> {
  return toCallAcceptBusinessTerms(httpsCallable(functions, "acceptBusinessTerms"));
}
