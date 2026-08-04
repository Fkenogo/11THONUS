/**
 * Loyalty Number value object (ENG-P2-001-03).
 *
 * The confirmed `DEC-DATA-007` baseline format only: 3 letters (A-Z
 * excluding `I`/`O`) + 3 digits (2-9, excluding `0`/`1`), e.g. `ABC-234`.
 * The deferred checksum-enhanced `ABC-234-X` variant is deliberately not
 * accepted — `DEC-DATA-007` explicitly defers it, unresolved.
 *
 * Per the `DEC-DATA-007` Decision Package §9 item 5, the canonical
 * *stored* form is unformatted uppercase (e.g. `ABC234`) — the hyphen
 * separator is presentation-only, applied by `formatLoyaltyNumberForDisplay`
 * at render time, never part of the value itself. This keeps equality and
 * serialization trivial (plain string comparison / JSON round-trip).
 */

import { invalidLoyaltyNumberFormatError } from "./loyaltyNumberErrors";

export type LoyaltyNumber = string;

const CANONICAL_PATTERN = /^[A-HJ-NP-Z]{3}[2-9]{3}$/;
const ACCEPTED_INPUT_PATTERN = /^([A-HJ-NP-Z]{3})-?([2-9]{3})$/i;

export function createLoyaltyNumber(raw: string): LoyaltyNumber {
  const trimmed = raw.trim().toUpperCase();
  const match = trimmed.match(ACCEPTED_INPUT_PATTERN);

  if (!match) {
    throw invalidLoyaltyNumberFormatError(raw);
  }

  const canonical = `${match[1]}${match[2]}`;
  if (!CANONICAL_PATTERN.test(canonical)) {
    throw invalidLoyaltyNumberFormatError(raw);
  }

  return canonical;
}

export function formatLoyaltyNumberForDisplay(loyaltyNumber: LoyaltyNumber): string {
  return `${loyaltyNumber.slice(0, 3)}-${loyaltyNumber.slice(3)}`;
}
