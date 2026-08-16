/**
 * Trust record id (CAP-P2-ITM-A).
 *
 * The opaque primary key of an ITM trust record (`ITM-DESIGN-001` §5,
 * §12 — illustratively doc-ID-keyed by the Internal Customer ID). This
 * module only validates the *shape* of an already-generated id; it does
 * not generate one — generation/collection-key assignment is a future
 * ITM-B persistence concern, mirroring `customerIdentityId.ts`'s own
 * scope boundary.
 */

import { invalidTrustRecordIdError } from "./trustErrors";

export type TrustRecordId = string;

export function createTrustRecordId(value: string): TrustRecordId {
  if (value.trim().length === 0) {
    throw invalidTrustRecordIdError(value);
  }
  return value;
}
