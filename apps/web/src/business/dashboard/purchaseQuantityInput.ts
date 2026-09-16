/**
 * Strict client-side grammar for a Purchase Record quantity text input:
 * the exact decimal digits of a positive integer, nothing else. Mirrors
 * the server's `parsePurchaseQuantity` (`functions/src/index.ts`, integer
 * `>= 1`) rule — this only rejects malformed text before it ever reaches
 * that check; it does not relax or extend what a valid quantity is.
 *
 * Deliberately rejects (returns `null` for) anything `Number.parseInt`
 * would silently coerce: fractional text ("1.5"), trailing garbage
 * ("2abc"), non-numeric text, empty/whitespace-only input, zero,
 * negative values, and leading zeros ("007") — every one of those must
 * fail without ever reaching `mutateAsync`.
 */
const POSITIVE_INTEGER_PATTERN = /^[1-9][0-9]*$/;

export function parsePurchaseRecordQuantity(rawValue: string): number | null {
  if (!POSITIVE_INTEGER_PATTERN.test(rawValue)) {
    return null;
  }
  return Number.parseInt(rawValue, 10);
}
