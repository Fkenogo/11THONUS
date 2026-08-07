/**
 * QR Identity domain events (ENG-P2-001-04).
 *
 * Uses the existing shared `DomainEvent<T>`/`buildEventType` contract,
 * zero Firebase dependency. No transport, persistence, queue, or Cloud
 * Function wiring here.
 *
 * The final (settled) qrReference value is included in event payloads —
 * this is not the kind of information leakage the loyalty-number
 * collision events guarded against (in-progress candidate values that
 * could expose codespace structure); a QR reference is only ever logged
 * here once it has actually been issued/invalidated, matching
 * `DEC-DATA-007`'s own "every generation event audit-logged" principle.
 *
 * Intentionally absent (`ENG-P2-ARCH-CORR-004`, Finding F8): unlike the
 * majority of `identityEvents.ts`'s events, none of these events carry
 * `authority`/`reason` fields. This is intentional, not an oversight —
 * QR issuance/regeneration/invalidation has narrow, self-evident
 * triggers (identity registration, an explicit regeneration request, a
 * QR-specific invalidation) with no distinct authorized actors or
 * reasons to attribute a transition to, unlike identity status
 * transitions.
 */

import type { DomainEvent, EventActor } from "../../../shared/events/domainEvent";
import { buildEventType } from "../../../shared/events/eventNaming";

const SOURCE_DOMAIN = "qrIdentity";
const AGGREGATE_TYPE = "qr_identity_association";

type EventEnvelopeParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
};

function buildQrIdentityDomainEvent<T>(
  envelope: EventEnvelopeParams,
  eventName: string,
  aggregateId: string,
  payload: T,
): DomainEvent<T> {
  return {
    eventId: envelope.eventId,
    eventType: buildEventType(SOURCE_DOMAIN, eventName, 1),
    eventVersion: 1,
    sourceDomain: SOURCE_DOMAIN,
    aggregateType: AGGREGATE_TYPE,
    aggregateId,
    correlationId: envelope.correlationId,
    actor: envelope.actor,
    occurredAt: envelope.occurredAt,
    payload,
  };
}

export type QrIdentityIssuedPayload = {
  customerIdentityId: string;
  qrReference: string;
};

export function buildQrIdentityIssuedEvent(
  params: EventEnvelopeParams & QrIdentityIssuedPayload,
): DomainEvent<QrIdentityIssuedPayload> {
  return buildQrIdentityDomainEvent(params, "qr_identity_issued", params.customerIdentityId, {
    customerIdentityId: params.customerIdentityId,
    qrReference: params.qrReference,
  });
}

export type QrIdentityInvalidatedPayload = {
  customerIdentityId: string;
  qrReference: string;
};

export function buildQrIdentityInvalidatedEvent(
  params: EventEnvelopeParams & QrIdentityInvalidatedPayload,
): DomainEvent<QrIdentityInvalidatedPayload> {
  return buildQrIdentityDomainEvent(params, "qr_identity_invalidated", params.customerIdentityId, {
    customerIdentityId: params.customerIdentityId,
    qrReference: params.qrReference,
  });
}

export type QrIdentityRegeneratedPayload = {
  customerIdentityId: string;
  qrReference: string;
  previousQrReference: string;
};

export function buildQrIdentityRegeneratedEvent(
  params: EventEnvelopeParams & QrIdentityRegeneratedPayload,
): DomainEvent<QrIdentityRegeneratedPayload> {
  return buildQrIdentityDomainEvent(params, "qr_identity_regenerated", params.customerIdentityId, {
    customerIdentityId: params.customerIdentityId,
    qrReference: params.qrReference,
    previousQrReference: params.previousQrReference,
  });
}
