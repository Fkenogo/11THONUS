/**
 * Effective trust derivation errors (CAP-P2-ITM-C).
 *
 * Maps a `deriveEffectiveTrust` "failed" outcome (`../derivation/types.ts`)
 * onto the same closed 14-category taxonomy every other trust-domain
 * error already uses (`../models/trustErrors.ts`, `./trustSignalErrors.ts`)
 * — no new category (`ITM-DESIGN-001` §13, task Phase T). Kept out of
 * `../models/trustErrors.ts` so ITM-A's file is untouched by this
 * package, same rationale `trustSignalErrors.ts` (ITM-B) already states.
 */

import { TrustDomainError } from "../models/trustErrors";
import type { EffectiveTrustDerivationFailureReason } from "../derivation/types";
import type { ErrorCategory } from "../../../shared/errors/errorCategories";

const MESSAGES: Record<EffectiveTrustDerivationFailureReason, string> = {
  invalid_customer_identity_id:
    "Cannot derive effective trust: customerIdentityId must be a non-empty, non-whitespace string.",
  malformed_rule_version:
    "Cannot derive effective trust: the requested trust rule version is not a positive integer.",
  unsupported_rule_version:
    "Cannot derive effective trust: the requested trust rule version is not supported by this derivation.",
  invalid_current_time: "Cannot derive effective trust: the current time input is invalid.",
  customer_identity_not_found:
    "Cannot derive effective trust: no customer identity record exists for the requested identity.",
  customer_identity_malformed:
    "Cannot derive effective trust: the stored customer identity record does not match the expected shape.",
  customer_identity_read_failed:
    "Cannot derive effective trust: the customer identity store is temporarily unavailable.",
  trust_record_malformed:
    "Cannot derive effective trust: the stored trust record does not match the expected shape.",
  trust_record_read_failed:
    "Cannot derive effective trust: the trust record store is temporarily unavailable.",
  registered_at_invalid:
    "Cannot derive effective trust: the customer identity's registration timestamp is invalid.",
  registered_at_in_future:
    "Cannot derive effective trust: the customer identity's registration timestamp is later than the current time.",
};

export function effectiveTrustDerivationFailedError(
  reason: EffectiveTrustDerivationFailureReason,
  errorCategory: ErrorCategory,
): TrustDomainError {
  return new TrustDomainError(errorCategory, MESSAGES[reason]);
}
