/**
 * Loyalty Number domain events (ENG-P2-001-03).
 *
 * Uses the existing shared `DomainEvent<T>`/`buildEventType` contract
 * (`functions/src/shared/events/*`, ENG-P1-002), zero Firebase dependency.
 * No transport, persistence, queue, or Cloud Function wiring here.
 *
 * Per `DEC-DATA-007`'s non-revealing constraint, event payloads never
 * carry a rejected/colliding candidate value — only the identity and an
 * attempt count — to avoid leaking any information about the generation
 * codespace or which candidates were tried.
 */

import type { DomainEvent, EventActor } from "../../../shared/events/domainEvent";
import { buildEventType } from "../../../shared/events/eventNaming";
import type { LoyaltyNumber } from "../models/loyaltyNumber";

const SOURCE_DOMAIN = "loyaltyNumber";
const AGGREGATE_TYPE = "loyalty_number_assignment";

type EventEnvelopeParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
};

function buildLoyaltyNumberDomainEvent<T>(
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

export type LoyaltyNumberIssuedPayload = {
  customerIdentityId: string;
  loyaltyNumber: LoyaltyNumber;
};

export function buildLoyaltyNumberIssuedEvent(
  params: EventEnvelopeParams & LoyaltyNumberIssuedPayload,
): DomainEvent<LoyaltyNumberIssuedPayload> {
  return buildLoyaltyNumberDomainEvent(params, "loyalty_number_issued", params.customerIdentityId, {
    customerIdentityId: params.customerIdentityId,
    loyaltyNumber: params.loyaltyNumber,
  });
}

export type LoyaltyNumberIssuanceCollisionDetectedPayload = {
  customerIdentityId: string;
  attemptNumber: number;
};

export function buildLoyaltyNumberIssuanceCollisionDetectedEvent(
  params: EventEnvelopeParams & LoyaltyNumberIssuanceCollisionDetectedPayload,
): DomainEvent<LoyaltyNumberIssuanceCollisionDetectedPayload> {
  return buildLoyaltyNumberDomainEvent(
    params,
    "loyalty_number_issuance_collision_detected",
    params.customerIdentityId,
    { customerIdentityId: params.customerIdentityId, attemptNumber: params.attemptNumber },
  );
}

export type LoyaltyNumberIssuanceFailedPayload = {
  customerIdentityId: string;
  attemptsMade: number;
};

export function buildLoyaltyNumberIssuanceFailedEvent(
  params: EventEnvelopeParams & LoyaltyNumberIssuanceFailedPayload,
): DomainEvent<LoyaltyNumberIssuanceFailedPayload> {
  return buildLoyaltyNumberDomainEvent(
    params,
    "loyalty_number_issuance_failed",
    params.customerIdentityId,
    { customerIdentityId: params.customerIdentityId, attemptsMade: params.attemptsMade },
  );
}
