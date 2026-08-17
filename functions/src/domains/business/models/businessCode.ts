/**
 * `businessCode` value object and format policy (`ENG-P2-002A`, FD-3 §24).
 *
 * The Founder-approved policy (§24 FD-3): system-generated, globally
 * unique, opaque, non-sequential, immutable once assigned, never
 * recycled, transactionally reserved during creation, bounded collision
 * retry, human-readable, internal/support-use only at MVP — never a
 * public identifier, URL slug, authentication credential, customer
 * lookup key, QR identifier, or commerce key. The literal alphabet,
 * length, and formatting below are the Engineering-delegated details
 * FD-3 explicitly leaves to this task.
 *
 * ## Engineering format decision
 *
 * Alphabet: 24 letters (A-Z excluding I, O) + 8 digits (2-9, excluding
 * 0, 1) = 32 symbols, mirroring the same ambiguity-avoidance principle
 * `functions/src/domains/loyaltyNumber/models/loyaltyNumber.ts` already
 * uses for the Loyalty Number (excludes I/O from letters, 0/1 from
 * digits) — reused as a *principle*, not copied as a format: the two
 * codes must never be visually or structurally confusable (FD-3
 * requirement). A single flat 32-symbol alphabet (rather than
 * Loyalty Number's segmented "3 letters then 3 digits" shape) plus a
 * constant `BIZ` prefix makes this format structurally disjoint from
 * `^[A-HJ-NP-Z]{3}[2-9]{3}$` by construction — no valid Loyalty Number
 * can ever match this pattern and vice versa.
 *
 * The `BIZ` prefix is a fixed, non-variable tag — it encodes no country,
 * category, date, owner, or sequence information (FD-3's explicit
 * prohibition); every business code carries the identical prefix.
 *
 * Canonical stored form: uppercase, unformatted, no hyphen (`BIZABCDEF`)
 * — the same "canonical unformatted, display-formatted only at render
 * time" split `loyaltyNumber.ts` already established, kept for the same
 * reason (trivial equality/serialization).
 *
 * Namespace size (§S of the task; see the implementation report for the
 * full collision-rate calculation): 32^6 = 1,073,741,824 combinations in
 * the random segment — roughly 152× the Loyalty Number's own ~7.08M
 * space, so at the same 1,000,000-record reference scale `DEC-DATA-007`'s
 * own worst-case analysis used, the bounded-retry collision-exhaustion
 * probability is many orders of magnitude smaller than the Loyalty
 * Number's already-negligible bound. Not over-engineered for impossible
 * global scale — 6 characters keeps the code short and human-readable.
 */

import { invalidBusinessCodeFormatError } from "./businessErrors";

export const BUSINESS_CODE_PREFIX = "BIZ";
export const BUSINESS_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const BUSINESS_CODE_RANDOM_LENGTH = 6;

/**
 * `DEC-DATA-007`'s own "small maximum-retry count" principle, adopted
 * independently for `businessCode` (§24 FD-3) — a policy constant only;
 * the actual retry-loop execution belongs to `ENG-P2-002B`.
 */
export const MAX_BUSINESS_CODE_GENERATION_ATTEMPTS = 5;

export type BusinessCode = string;

const CANONICAL_PATTERN = new RegExp(
  `^${BUSINESS_CODE_PREFIX}[${BUSINESS_CODE_ALPHABET}]{${BUSINESS_CODE_RANDOM_LENGTH}}$`,
);
const ACCEPTED_INPUT_PATTERN = new RegExp(
  `^${BUSINESS_CODE_PREFIX}-?([${BUSINESS_CODE_ALPHABET}]{${BUSINESS_CODE_RANDOM_LENGTH}})$`,
  "i",
);

export function createBusinessCode(raw: string): BusinessCode {
  const trimmed = raw.trim().toUpperCase();
  const match = trimmed.match(ACCEPTED_INPUT_PATTERN);

  if (!match) {
    throw invalidBusinessCodeFormatError(raw);
  }

  const canonical = `${BUSINESS_CODE_PREFIX}${match[1]}`;
  if (!CANONICAL_PATTERN.test(canonical)) {
    throw invalidBusinessCodeFormatError(raw);
  }

  return canonical;
}

export function isWellFormedBusinessCode(value: string): value is BusinessCode {
  try {
    createBusinessCode(value);
    return true;
  } catch {
    return false;
  }
}

export function formatBusinessCodeForDisplay(businessCode: BusinessCode): string {
  return `${BUSINESS_CODE_PREFIX}-${businessCode.slice(BUSINESS_CODE_PREFIX.length)}`;
}
