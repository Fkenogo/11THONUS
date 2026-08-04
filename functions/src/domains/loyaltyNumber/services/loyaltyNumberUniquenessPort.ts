/**
 * Loyalty Number uniqueness port (ENG-P2-001-03).
 *
 * Allows a later persistence service (`ENG-P2-001-05` or equivalent) to
 * tell the issuance service whether a candidate is already assigned to
 * someone. No Firestore lookup is implemented here — this is the
 * interface only; a future task provides the transactional,
 * Firestore-backed implementation `DEC-DATA-007` requires.
 */

import type { LoyaltyNumber } from "../models/loyaltyNumber";

export interface LoyaltyNumberUniquenessPort {
  isAlreadyAssigned(candidate: LoyaltyNumber): Promise<boolean>;
}
