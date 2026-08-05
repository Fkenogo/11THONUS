/**
 * Canonical identity-audit envelope (ENG-P2-001-10).
 *
 * A bounded, read-side PROJECTION over the existing, already-governed
 * `OutboxEntry<T>`/`DomainEvent<T>` shapes (`shared/outbox/outboxEntry.ts`,
 * `shared/events/domainEvent.ts`) — not a new persisted schema, not a
 * second event/outbox system. Every field here already exists on one of
 * those two types except `customerIdentityId` (a friendlier alias for
 * `event.aggregateId`, since every audited aggregate in this domain is a
 * Customer Identity) and `privacyClassification` (derived, see
 * `auditPrivacyClassification.ts`).
 *
 * Deliberately excludes the outbox's own internal processing-state fields
 * (`retryCount`, `nextRetryAt`, `lastError`, `deadLetter`, `claimedAt`) —
 * those describe delivery mechanics, not audit evidence, and exposing
 * them here would blur "what happened" (the event) with "how reliably it
 * was processed" (the outbox's own concern, already covered by
 * `outboxProcessor.ts` and its own tests).
 */

import type { EventActor } from "../../../shared/events/domainEvent";
import type { OutboxEntry, OutboxStatus } from "../../../shared/outbox/outboxEntry";
import {
  classifyIdentityEventPrivacy,
  type AuditPrivacyClassification,
} from "./auditPrivacyClassification";

export type IdentityAuditRecord = {
  eventId: string;
  eventType: string;
  eventVersion: number;
  sourceDomain: string;
  aggregateType: string;
  customerIdentityId: string;
  correlationId: string;
  causationId?: string;
  actor: EventActor;
  occurredAt: string;
  persistedAt: OutboxEntry["createdAt"];
  status: OutboxStatus;
  privacyClassification: AuditPrivacyClassification;
  payload: unknown;
};

export function toIdentityAuditRecord(entry: OutboxEntry): IdentityAuditRecord {
  const { event } = entry;

  return {
    eventId: event.eventId,
    eventType: event.eventType,
    eventVersion: event.eventVersion,
    sourceDomain: event.sourceDomain,
    aggregateType: event.aggregateType,
    customerIdentityId: event.aggregateId,
    correlationId: event.correlationId,
    causationId: event.causationId,
    actor: event.actor,
    occurredAt: event.occurredAt,
    persistedAt: entry.createdAt,
    status: entry.status,
    privacyClassification: classifyIdentityEventPrivacy(event.eventType),
    payload: event.payload,
  };
}
