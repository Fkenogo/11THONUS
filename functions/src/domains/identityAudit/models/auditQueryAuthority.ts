/**
 * Audit-query authority context (ENG-P2-001-10).
 *
 * A closed, caller-declared category describing *who* is reading audit
 * records — not a role or permission system, mirroring the identity
 * domain's own `IdentityLookupPurpose` pattern
 * (`../identity/models/identityLookupPurpose.ts`). This package does not
 * implement role management or permissions (per its own brief); it only
 * records the declared authority category so a future trusted application
 * boundary can verify it against a real caller identity and fail closed.
 * A caller declaring `"administrator"` here is not thereby an
 * administrator — this type only shapes the interface.
 */

import { invalidAuditQueryAuthorityError } from "./identityAuditErrors";

export const AUDIT_QUERY_AUTHORITIES = [
  "internal_service",
  "support",
  "administrator",
  "security_review",
  "compliance_review",
] as const;

export type AuditQueryAuthority = (typeof AUDIT_QUERY_AUTHORITIES)[number];

export function createAuditQueryAuthority(raw: string): AuditQueryAuthority {
  if ((AUDIT_QUERY_AUTHORITIES as readonly string[]).includes(raw)) {
    return raw as AuditQueryAuthority;
  }
  throw invalidAuditQueryAuthorityError(raw);
}
