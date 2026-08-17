/**
 * Business domain events (`ENG-P2-002B`, Phase O).
 *
 * Uses the existing shared `DomainEvent<T>`/`buildEventType` contract
 * (`functions/src/shared/events/*`, ENG-P1-002), zero Firebase dependency —
 * mirrors `functions/src/domains/loyaltyNumber/events/loyaltyNumberEvents.ts`
 * exactly.
 *
 * `BusinessCreatedPayload` is privacy-minimal by design (Phase O, Phase U):
 * `businessId`/`ownerUserId`/`branchId`/`businessCode` are the identifiers a
 * downstream consumer needs to react to bootstrap (e.g. provisioning,
 * analytics); `contactEmail`/`contactPhone`/`address`/`legalName` are
 * deliberately excluded — no governed necessity for them exists in this
 * event, and they are already durably available on the `businesses/{id}`
 * document itself for any consumer that needs the full record.
 */

import type { DomainEvent, EventActor } from "../../../shared/events/domainEvent";
import { buildEventType } from "../../../shared/events/eventNaming";

const SOURCE_DOMAIN = "business";
const AGGREGATE_TYPE = "business";

type EventEnvelopeParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
};

export type BusinessCreatedPayload = {
  businessId: string;
  ownerUserId: string;
  branchId: string;
  businessCode: string;
};

export function buildBusinessCreatedEvent(
  params: EventEnvelopeParams & BusinessCreatedPayload,
): DomainEvent<BusinessCreatedPayload> {
  return {
    eventId: params.eventId,
    eventType: buildEventType(SOURCE_DOMAIN, "business_created", 1),
    eventVersion: 1,
    sourceDomain: SOURCE_DOMAIN,
    aggregateType: AGGREGATE_TYPE,
    aggregateId: params.businessId,
    correlationId: params.correlationId,
    actor: params.actor,
    occurredAt: params.occurredAt,
    payload: {
      businessId: params.businessId,
      ownerUserId: params.ownerUserId,
      branchId: params.branchId,
      businessCode: params.businessCode,
    },
  };
}
