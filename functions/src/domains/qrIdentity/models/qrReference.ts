/**
 * QR reference value object (ENG-P2-001-04).
 *
 * Per `DEC-DATA-007`'s Final Decision ("the QR encodes only a plain
 * opaque reference to the loyalty code — not a signed token") and TRD12
 * §12.42, this is an opaque public reference: not derived from a
 * signature, not a structured/versioned token, and never carrying
 * personal data by construction.
 *
 * No governing document specifies an exact character set or length for
 * the reference itself (unlike the tightly-specified Loyalty Number
 * format) — it is deliberately opaque. This module therefore only
 * rejects genuinely malformed input (empty, or characters unsafe to
 * embed in a QR-encoded string/URL) rather than inventing a length or
 * entropy policy no governing document states.
 */

import { invalidQrReferenceError } from "./qrIdentityErrors";

export type QrReference = string;

const SAFE_TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/;

export function createQrReference(raw: string): QrReference {
  const trimmed = raw.trim();

  if (trimmed.length === 0 || !SAFE_TOKEN_PATTERN.test(trimmed)) {
    throw invalidQrReferenceError(raw);
  }

  return trimmed;
}
