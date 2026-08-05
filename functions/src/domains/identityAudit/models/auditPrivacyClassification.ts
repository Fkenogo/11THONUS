/**
 * Privacy classification for identity audit records (ENG-P2-001-10).
 *
 * Reuses the already-governed 5-class Personal Data Classification
 * (TRD21 §21.6) verbatim rather than inventing a new taxonomy — this
 * package tags each audit record with the class already defined there,
 * it does not define what the classes mean or what rules attach to them.
 *
 * `class_1_public` and `class_5_secrets_and_credentials` are included for
 * completeness of the closed set but are not expected to occur for any
 * identity event today (no identity event is ever published data, and no
 * secret/credential is ever placed in an event payload). Loyalty Number
 * and QR reference issuance/invalidation/regeneration events carry the
 * settled identifier value itself (an existing, disclosed exception —
 * see `loyaltyNumberEvents.ts`/`qrIdentityEvents.ts`) and TRD21 §21.6
 * names "loyalty number" directly under Class 3 (Personal Data), so those
 * event types classify as `class_3_personal_data`. Every other identity
 * event carries only opaque references, categorical status/authority/
 * reason values, and identifiers — internal operational data, Class 2 —
 * which is also this function's conservative default for any event type
 * not explicitly listed, rather than guessing a class down or up.
 *
 * Deliberately does not use `../../../shared/events/eventNaming.ts`'s own
 * `parseEventType` — that helper's regex only matches a camelCase event
 * name (its own test fixture: `"purchaseRecorded"`), but every real
 * identity/loyaltyNumber/qrIdentity event name is snake_case (e.g.
 * `"loyalty_number_issued"`), so `parseEventType` silently returns
 * `undefined` for every event type this domain actually emits. That
 * mismatch is a pre-existing, disclosed gap in the shared naming helper
 * (out of this bounded package's scope to fix — it would touch every
 * domain's event-naming convention) — a plain split on `.` is used here
 * instead, which is sufficient for this function's own narrow purpose.
 */

export function extractEventName(eventType: string): string | undefined {
  const segments = eventType.split(".");
  return segments.length === 3 ? segments[1] : undefined;
}

export const AUDIT_PRIVACY_CLASSIFICATIONS = [
  "class_1_public",
  "class_2_internal_operational",
  "class_3_personal_data",
  "class_4_sensitive_personal_data",
  "class_5_secrets_and_credentials",
] as const;

export type AuditPrivacyClassification = (typeof AUDIT_PRIVACY_CLASSIFICATIONS)[number];

const CLASS_3_EVENT_NAMES: ReadonlySet<string> = new Set([
  "loyalty_number_issued",
  "qr_identity_issued",
  "qr_identity_invalidated",
  "qr_identity_regenerated",
]);

export function classifyIdentityEventPrivacy(eventType: string): AuditPrivacyClassification {
  const eventName = extractEventName(eventType);
  if (eventName && CLASS_3_EVENT_NAMES.has(eventName)) {
    return "class_3_personal_data";
  }
  return "class_2_internal_operational";
}
