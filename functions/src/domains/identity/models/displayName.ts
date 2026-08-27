/**
 * Platform Display Name validation (`IDENTITY-PROFILE-A`, per the Founder
 * disposition `FD-IDENTITY-DISPLAY-001`).
 *
 * `users/{userId}.displayName` (TRD10 §10.6.1) is the sole authoritative
 * platform Display Name — a user-controlled, human-readable label, not a
 * legal name, verified identity, authentication-provider name, or unique
 * handle (`FD-IDENTITY-DISPLAY-001` §2). This module owns exactly the MVP
 * validation contract §5 records: trim surrounding whitespace, reject
 * empty/whitespace-only values, 1-50 characters after trimming, Unicode
 * permitted, no username syntax, no uniqueness check. Pure domain module —
 * no Firebase import, no I/O.
 */

import { invalidDisplayNameError } from "./identityErrors";

export const DISPLAY_NAME_MIN_LENGTH = 1;
export const DISPLAY_NAME_MAX_LENGTH = 50;

/**
 * Trims and validates a raw Display Name input. Throws `invalidDisplayNameError`
 * for anything not a string, or a string that is empty/whitespace-only after
 * trimming, or exceeds `DISPLAY_NAME_MAX_LENGTH` characters after trimming.
 * Unicode is measured in UTF-16 code units (`string.length`), matching this
 * platform's other free-text field precedents — no grapheme-cluster
 * segmentation is invented here.
 */
export function normalizeDisplayName(raw: unknown): string {
  if (typeof raw !== "string") {
    throw invalidDisplayNameError();
  }
  const trimmed = raw.trim();
  if (trimmed.length < DISPLAY_NAME_MIN_LENGTH || trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
    throw invalidDisplayNameError();
  }
  return trimmed;
}
