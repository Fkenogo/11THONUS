/**
 * Identity lookup authority context (ENG-P2-001-09).
 *
 * A closed, caller-declared category describing *why* a lookup is being
 * performed — not a role, permission, or authenticated identity. This
 * package does not implement role management or permissions (per its own
 * brief); it only records the declared purpose so each lookup function can
 * apply its own narrow, hardcoded allow-list (see
 * `identityLookupRepository.ts`) and so audit-worthy purposes can be
 * recorded on the emitted lookup event. Real authorization — verifying the
 * caller is genuinely who they claim (a support agent, an internal
 * service, etc.) — belongs to a future authority layer outside this
 * package; this type only shapes the interface, per the brief's own
 * instruction to "define the interface and fail closed" where authority
 * belongs elsewhere.
 */

import { invalidIdentityLookupPurposeError } from "./identityErrors";

export const IDENTITY_LOOKUP_PURPOSES = [
  "authentication",
  "recovery",
  "internal_service",
  "merchant_transaction",
  "support",
] as const;

export type IdentityLookupPurpose = (typeof IDENTITY_LOOKUP_PURPOSES)[number];

export function createIdentityLookupPurpose(raw: string): IdentityLookupPurpose {
  if ((IDENTITY_LOOKUP_PURPOSES as readonly string[]).includes(raw)) {
    return raw as IdentityLookupPurpose;
  }
  throw invalidIdentityLookupPurposeError(raw);
}
