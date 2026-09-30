/**
 * Manual Commercial administration vocabulary (`WP-COM-03`;
 * `11THONUS-COMMERCIAL-DESIGN-001` v1.1 + CORR-002 §9, §10.3, §15).
 *
 * Product Truth carried here, and ONLY here:
 *  - the governed INITIAL trial grant is 3..5 units, chosen explicitly per
 *    grant. It is a per-grant range, NOT a lifetime cap, and there is no
 *    default. Nothing in this module limits how many grants or adjustments a
 *    Business may have; absence of an aggregate ceiling is NOT an authorisation
 *    of unlimited adjustment -- every grant/adjustment is an individually
 *    attributable, reasoned, audited act.
 *  - paid-credit adjustments use the closed operational reason vocabulary of
 *    design §10.3. There is deliberately NO complimentary / pilot / partner /
 *    promotional code: that is the open `DEC-SUB-013` question.
 *  - there is no paid-balance floor or maximum policy (only PostgreSQL's
 *    32-bit INTEGER storage width, a technical bound, not a commercial rule).
 */

export const TRIAL_INITIAL_GRANT_MIN_UNITS = 3;
export const TRIAL_INITIAL_GRANT_MAX_UNITS = 5;

export const COMMERCIAL_TRIAL_GRANT_KINDS = ["initial"] as const;
export type CommercialTrialGrantKind = (typeof COMMERCIAL_TRIAL_GRANT_KINDS)[number];

/** Closed operational vocabulary for paid-credit adjustments (design §10.3). */
export const COMMERCIAL_CREDIT_ADJUSTMENT_REASON_CODES = [
  "correction",
  "settlement_reconciliation",
  "dispute_resolution",
  "error_reversal",
] as const;
export type CommercialCreditAdjustmentReasonCode =
  (typeof COMMERCIAL_CREDIT_ADJUSTMENT_REASON_CODES)[number];

/** PostgreSQL INTEGER bounds: the storage width of every counter (technical, not policy). */
export const COMMERCIAL_INT32_MIN = -2_147_483_648;
export const COMMERCIAL_INT32_MAX = 2_147_483_647;

/** Optional free label for a trial adjustment reason (shape-checked only; no vocabulary invented). */
export const COMMERCIAL_REASON_CODE_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;

export type CommercialTrialGrant = {
  readonly id: string;
  readonly businessId: string;
  readonly kind: CommercialTrialGrantKind;
  readonly units: number;
  readonly grantedBy: string;
  readonly grantedAt: Date;
  readonly reasonCode: string | null;
  readonly reasonText: string;
  readonly reference: string;
  readonly ledgerEntryId: string;
  readonly idempotencyKey: string;
};

export type CommercialManualAdjustment = {
  readonly id: string;
  readonly businessId: string;
  readonly bucket: "trial" | "paid";
  readonly unitsDelta: number;
  readonly reasonCode: string | null;
  readonly reasonText: string;
  readonly reference: string;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly ledgerEntryId: string;
  readonly idempotencyKey: string;
};
