/**
 * `ENG-P2-004C` — permission-decision audit event factory.
 *
 * Pure construction of the `PermissionDecisionRecorded` event on the
 * shared `DomainEvent<T>` / `buildEventType` contract (`shared/events/*`,
 * ENG-P1-002, TRD11 §11.8–11.9) — no Firebase import; the durable outbox
 * write is `service/permissionAuditService.ts`. Mirrors AUTH-08's own
 * factory (`authentication/events/authenticationEventFactories.ts`)
 * exactly: deterministic, retry-stable event identity as a pure function
 * of the logical decision's identity, never a random id.
 *
 * **Deterministic, retry-stable event identity.** `eventId` is a pure
 * function of `(eventName, businessId, idempotencyKey)` — the
 * `idempotencyKey` is the *caller's* (004D's future protected command)
 * own idempotency key for the logical operation being authorized, so a
 * retried protected-command invocation that re-evaluates the same
 * permission produces the same audit event identity (durable
 * at-least-once delivery, dedup-by-`eventId`, never a claim of
 * exactly-once). `occurredAt` is not part of the identity, so a retry
 * never mints a second event. As with AUTH-08, this trusts the caller's
 * idempotency key to scope exactly one logical decision — reusing one
 * key across genuinely different decisions is a caller-contract
 * violation, not a case this factory defends against further (matches
 * AUTH-08's own trust model).
 */

import { createHash } from "node:crypto";
import type { DomainEvent, EventActor } from "../../../shared/events/domainEvent";
import { buildEventType } from "../../../shared/events/eventNaming";
import {
  PERMISSION_AUDIT_AGGREGATE_TYPE,
  PERMISSION_AUDIT_EVENT_VERSION,
  PERMISSION_AUDIT_PRIVACY_CLASSIFICATION,
  PERMISSION_AUDIT_SOURCE_DOMAIN,
  PERMISSION_DECISION_RECORDED_EVENT_NAME,
  type PermissionDecisionRecordedPayload,
} from "../models/permissionAuditEvent";

// See authenticationEventFactories.ts's identical constant for the
// rationale (escape sequence, not a raw byte, so the source stays
// reviewable text; NUL cannot occur in any of the joined operands).
const FIELD_SEPARATOR = "\u0000";

export function derivePermissionAuditEventId(businessId: string, idempotencyKey: string): string {
  const digest = createHash("sha256")
    .update(
      [PERMISSION_DECISION_RECORDED_EVENT_NAME, businessId, idempotencyKey].join(FIELD_SEPARATOR),
    )
    .digest("hex");
  return `permaudit_${digest}`;
}

function derivePermissionAuditCorrelationId(businessId: string, idempotencyKey: string): string {
  const digest = createHash("sha256")
    .update([businessId, idempotencyKey].join(FIELD_SEPARATOR))
    .digest("hex");
  return `permauditcorr_${digest}`;
}

export type BuildPermissionDecisionRecordedEventParams = {
  readonly actorUserId: string;
  readonly businessId: string;
  readonly membershipId?: string;
  readonly permission: string;
  readonly result: "allow" | "deny";
  readonly decisionSource: PermissionDecisionRecordedPayload["decisionSource"];
  readonly effectiveRole?: PermissionDecisionRecordedPayload["effectiveRole"];
  readonly reasonCode: PermissionDecisionRecordedPayload["reasonCode"];
  /** The caller's (future 004D protected command's) own idempotency key — the event-identity input. */
  readonly idempotencyKey: string;
  readonly occurredAt: string;
};

export function buildPermissionDecisionRecordedEvent(
  params: BuildPermissionDecisionRecordedEventParams,
): DomainEvent<PermissionDecisionRecordedPayload> {
  const actor: EventActor = { actorType: "user", actorId: params.actorUserId };
  const payload: PermissionDecisionRecordedPayload = {
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    ...(params.membershipId !== undefined ? { membershipId: params.membershipId } : {}),
    permission: params.permission,
    result: params.result,
    decisionSource: params.decisionSource,
    ...(params.effectiveRole !== undefined ? { effectiveRole: params.effectiveRole } : {}),
    reasonCode: params.reasonCode,
    privacyClassification: PERMISSION_AUDIT_PRIVACY_CLASSIFICATION,
    schemaVersion: PERMISSION_AUDIT_EVENT_VERSION,
  };

  return {
    eventId: derivePermissionAuditEventId(params.businessId, params.idempotencyKey),
    eventType: buildEventType(
      PERMISSION_AUDIT_SOURCE_DOMAIN,
      PERMISSION_DECISION_RECORDED_EVENT_NAME,
      PERMISSION_AUDIT_EVENT_VERSION,
    ),
    eventVersion: PERMISSION_AUDIT_EVENT_VERSION,
    sourceDomain: PERMISSION_AUDIT_SOURCE_DOMAIN,
    aggregateType: PERMISSION_AUDIT_AGGREGATE_TYPE,
    aggregateId: params.membershipId ?? params.businessId,
    correlationId: derivePermissionAuditCorrelationId(params.businessId, params.idempotencyKey),
    actor,
    occurredAt: params.occurredAt,
    payload,
  };
}
