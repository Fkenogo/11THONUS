/**
 * Verification state (CAP-P2-ITM-A).
 *
 * Discrete verification facts, not a score (`ITM-DESIGN-001` §5) —
 * booleans only, no weighting stored here. Categorical provider-level
 * facts (§7's "Verified phone / verified email" row), never a raw phone
 * number or email address (§5's explicit PII exclusion — those remain
 * Customer Identity/Authentication-owned).
 */

import { invalidVerificationStateFieldError } from "./trustErrors";

export type VerificationState = {
  readonly phoneVerified: boolean;
  readonly emailVerified: boolean;
};

export type CreateVerificationStateParams = {
  phoneVerified: boolean;
  emailVerified: boolean;
};

export function createVerificationState(params: CreateVerificationStateParams): VerificationState {
  if (typeof params.phoneVerified !== "boolean") {
    throw invalidVerificationStateFieldError("phoneVerified");
  }
  if (typeof params.emailVerified !== "boolean") {
    throw invalidVerificationStateFieldError("emailVerified");
  }

  return {
    phoneVerified: params.phoneVerified,
    emailVerified: params.emailVerified,
  };
}
