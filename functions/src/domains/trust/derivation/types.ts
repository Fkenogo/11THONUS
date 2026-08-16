/**
 * Effective trust derivation contracts (CAP-P2-ITM-C).
 *
 * Models the derivation function's authoritative-state reads as an
 * explicit result union rather than throwing — the same pattern
 * `domains/permissions/evaluator/types.ts` (`ENG-P2-004B`) already
 * established for `evaluateAuthorizationDecision`: every fail-closed
 * branch (missing/malformed/transient) is a first-class, directly
 * testable case instead of an exception path a caller could forget to
 * handle. `deriveEffectiveTrust` (`deriveEffectiveTrust.ts`) is a pure
 * function of this input alone — no Firestore, no identity-domain
 * import, no wall-clock read (`now` is supplied by the caller,
 * `services/effectiveTrustService.ts`).
 *
 * Per `ITM-DESIGN-001` §6.6.1/§22 "Derivation Authority": `signalState`
 * (evidence), the governed rule version, and current server time are
 * authoritative; a persisted `trustLevel` is never read or trusted here
 * — only `hasSuccessfulAuthentication` is read from the trust record.
 */

import type { TrustLevel } from "../models/trustLevel";
import type { ErrorCategory } from "../../../shared/errors/errorCategories";

/** The MVP band-derivation rule this module implements (`ITM-DESIGN-001` §6.6/§6.6.4). */
export const CURRENT_TRUST_RULE_VERSION = 1;

export type CustomerIdentityReadResult =
  | { readonly kind: "found"; readonly registeredAt: Date }
  | { readonly kind: "not_found" }
  | { readonly kind: "malformed" }
  | { readonly kind: "transient_failure" };

export type TrustRecordReadResult =
  | { readonly kind: "found"; readonly hasSuccessfulAuthentication: boolean }
  /** Expected steady state for a brand-new identity (`ITM-DESIGN-001` §13) — not a failure. */
  | { readonly kind: "not_found" }
  | { readonly kind: "malformed" }
  | { readonly kind: "transient_failure" };

export type EffectiveTrustDerivationInput = {
  readonly customerIdentityId: string;
  readonly customerIdentity: CustomerIdentityReadResult;
  readonly trustRecord: TrustRecordReadResult;
  /** The evaluation instant, supplied by the caller — see module docstring. */
  readonly now: Date;
  /** The rule version this derivation is requested against — see `CURRENT_TRUST_RULE_VERSION`. */
  readonly ruleVersion: number;
};

/**
 * The bounded result ITM-D (a future, separately-authorized package)
 * will consume (`ITM-DESIGN-001` §15 ITM-C row, task Phase M) — no raw
 * evidence, no PII, no numeric score. `basis` is internal reason/context
 * only (Phase M: "do not expose unnecessary evidence"), bounded to the
 * two facts the MVP algorithm actually conditions on.
 */
export type EffectiveTrustResult = {
  readonly customerIdentityId: string;
  readonly effectiveTrustLevel: TrustLevel;
  readonly ruleVersion: number;
  readonly evaluatedAt: Date;
  readonly basis: {
    readonly hasSuccessfulAuthentication: boolean;
    readonly accountAgeDays: number;
  };
};

export type EffectiveTrustDerivationFailureReason =
  | "invalid_customer_identity_id"
  | "malformed_rule_version"
  | "unsupported_rule_version"
  | "invalid_current_time"
  | "customer_identity_not_found"
  | "customer_identity_malformed"
  | "customer_identity_read_failed"
  | "trust_record_malformed"
  | "trust_record_read_failed"
  | "registered_at_invalid"
  | "registered_at_in_future";

export type EffectiveTrustDerivationResult =
  | { readonly kind: "derived"; readonly result: EffectiveTrustResult }
  | {
      readonly kind: "failed";
      readonly reason: EffectiveTrustDerivationFailureReason;
      readonly errorCategory: ErrorCategory;
    };
