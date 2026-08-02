/**
 * Trust reference (ENG-P2-001-01).
 *
 * The identity-side pointer to the Identity Trust Management (ITM)
 * trust record for this identity (`ENG-P2-ARCH-001` §8 — "Trust
 * strengthens identity. Trust never creates identity."). Carries only an
 * opaque record id and creation attribution — never verification state,
 * trust level, or any trust-progression signal, all of which remain
 * owned and computed by ITM.
 */

import { invalidTrustRecordIdError } from "./identityErrors";

export type TrustReference = {
  readonly trustRecordId: string;
  readonly createdAt: Date;
  readonly createdBy: string | null;
};

export type CreateTrustReferenceParams = {
  trustRecordId: string;
  createdAt: Date;
  createdBy: string | null;
};

export function createTrustReference(params: CreateTrustReferenceParams): TrustReference {
  if (params.trustRecordId.trim().length === 0) {
    throw invalidTrustRecordIdError(params.trustRecordId);
  }

  return {
    trustRecordId: params.trustRecordId,
    createdAt: params.createdAt,
    createdBy: params.createdBy,
  };
}
