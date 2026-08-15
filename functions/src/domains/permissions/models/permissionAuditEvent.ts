/**
 * Permission-decision audit event contract (`ENG-P2-004C`).
 *
 * The `PermissionDecisionRecorded` event payload design §7.3 specifies —
 * a direct, typed transcription of that table. Framework-independent
 * (no Firebase import), matching the domain layer's existing
 * machine-enforced boundary (`eslint.config.js`).
 *
 * `decisionSource` is a coarser, design-governed classification than
 * 004B's own `ReasonCode` (`evaluator/types.ts`) — this module maps one
 * to the other (`mapReasonCodeToDecisionSource`) rather than widening
 * 004B's already-approved, more granular internal enum. Both are stored:
 * `decisionSource` for the governed category, `reasonCode` for the exact
 * internal reason (§7.3 lists both fields).
 *
 * `privacyClassification` reuses TRD21 §21.6's already-governed 5-class
 * taxonomy (the same closed set `identityAudit`'s own
 * `auditPrivacyClassification.ts` transcribes) — defined again here as a
 * domain-local copy rather than imported cross-domain, matching this
 * repo's existing per-domain-local-contract convention (e.g.
 * `permissionErrors.ts` vs `identityErrors.ts`). Design §7.3 fixes
 * permission-decision records to `class_2_internal_operational`
 * unconditionally (no per-event classifier needed, unlike
 * `identityAudit`'s per-event-type classification) — the record
 * contains no PII beyond identifiers already treated as operational
 * elsewhere in the outbox.
 */

import type { Role } from "./role";
import type { ReasonCode } from "../evaluator/types";

export const PERMISSION_DECISION_RECORDED_EVENT_NAME = "permission_decision_recorded";
export const PERMISSION_AUDIT_SOURCE_DOMAIN = "permissions";
/**
 * The audited entity is the business membership whose permission state
 * produced the decision — mirrors AUTH-08's own choice of aggregate
 * (the audited identity), scoped here to the membership rather than the
 * business (design §5: a permission decision is always evaluated
 * against one specific membership).
 */
export const PERMISSION_AUDIT_AGGREGATE_TYPE = "business_membership";
export const PERMISSION_AUDIT_EVENT_VERSION = 1;

export const PERMISSION_AUDIT_PRIVACY_CLASSIFICATIONS = [
  "class_1_public",
  "class_2_internal_operational",
  "class_3_personal_data",
  "class_4_sensitive_personal_data",
  "class_5_secrets_and_credentials",
] as const;

export type PermissionAuditPrivacyClassification =
  (typeof PERMISSION_AUDIT_PRIVACY_CLASSIFICATIONS)[number];

/** Every permission-decision audit record is Class 2 (design §7.3) — fixed, not computed. */
export const PERMISSION_AUDIT_PRIVACY_CLASSIFICATION: PermissionAuditPrivacyClassification =
  "class_2_internal_operational";

export const PERMISSION_DECISION_SOURCES = [
  "owner-floor",
  "role-default",
  "explicit-grant",
  "explicit-revocation",
  "sensitive-rule",
  "business-state-gate",
  "membership-state-gate",
  "unknown-permission",
] as const;

export type PermissionDecisionSource = (typeof PERMISSION_DECISION_SOURCES)[number];

/**
 * Maps 004B's granular internal `ReasonCode` (evaluator/types.ts) to
 * design §7.3's coarser, governed `decisionSource` category. Pure input
 * validation failures that precede any business/membership read
 * (`NO_SUBJECT` excepted — see `isAccountableDecision` below;
 * `MISSING_BUSINESS_CONTEXT`/`MALFORMED_BUSINESS_CONTEXT`/
 * `MALFORMED_PERMISSION_ID`) are bucketed under `business-state-gate` as
 * the closest existing category — they gate structurally adjacent to
 * and before the business-state check in 004B's algorithm, and design's
 * closed `decisionSource` enum has no dedicated "request validation"
 * bucket. Documented interpretation, not an invented category.
 */
export function mapReasonCodeToDecisionSource(reasonCode: ReasonCode): PermissionDecisionSource {
  switch (reasonCode) {
    case "OWNER_FLOOR":
      return "owner-floor";
    case "ROLE_DEFAULT_ALLOW":
      return "role-default";
    case "EXPLICIT_GRANT":
      return "explicit-grant";
    case "EXPLICIT_REVOCATION":
      return "explicit-revocation";
    case "SENSITIVE_PERMISSION_NOT_GRANTED":
    case "MALFORMED_OVERRIDE_DIRECTION":
    case "GRANT_NOT_HONORED":
    case "NO_APPLICABLE_GRANT":
      return "sensitive-rule";
    case "MEMBERSHIP_NOT_FOUND":
    case "MEMBERSHIP_NOT_ACTIVE":
    case "MEMBERSHIP_BUSINESS_MISMATCH":
    case "MEMBERSHIP_CONFIG_MALFORMED":
    case "MEMBERSHIP_READ_FAILURE":
      return "membership-state-gate";
    case "MALFORMED_PERMISSION_ID":
      return "unknown-permission";
    case "BUSINESS_NOT_FOUND":
    case "BUSINESS_CONTEXT_MISMATCH":
    case "BUSINESS_NOT_ACTIVE":
    case "BUSINESS_CONFIG_MALFORMED":
    case "BUSINESS_READ_FAILURE":
    case "NO_SUBJECT":
    case "MISSING_BUSINESS_CONTEXT":
    case "MALFORMED_BUSINESS_CONTEXT":
    default:
      return "business-state-gate";
  }
}

export type PermissionDecisionRecordedPayload = {
  readonly actorUserId: string;
  readonly businessId: string;
  readonly membershipId?: string;
  readonly permission: string;
  readonly result: "allow" | "deny";
  readonly decisionSource: PermissionDecisionSource;
  readonly effectiveRole?: Role;
  /** 004B's own internal reason code, verbatim — logs/audit only, never client-facing (design §6.11). */
  readonly reasonCode: ReasonCode;
  readonly privacyClassification: PermissionAuditPrivacyClassification;
  readonly schemaVersion: number;
};
