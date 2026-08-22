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

/**
 * `ENG-P2-002C` (Phase Q). Privacy-minimal by the same principle
 * `BusinessCreatedPayload` established: a downstream consumer needing the
 * *new* value of a changed field can always read the current
 * `businesses/{id}` document — the event only needs to say *which* fields
 * changed, never carry the values themselves (avoids duplicating profile
 * PII, e.g. `contactPhone`/`contactEmail`, into the immutable event log).
 */
export type BusinessProfileUpdatedPayload = {
  businessId: string;
  updatedFields: string[];
};

export function buildBusinessProfileUpdatedEvent(
  params: EventEnvelopeParams & BusinessProfileUpdatedPayload,
): DomainEvent<BusinessProfileUpdatedPayload> {
  return {
    eventId: params.eventId,
    eventType: buildEventType(SOURCE_DOMAIN, "business_profile_updated", 1),
    eventVersion: 1,
    sourceDomain: SOURCE_DOMAIN,
    aggregateType: AGGREGATE_TYPE,
    aggregateId: params.businessId,
    correlationId: params.correlationId,
    actor: params.actor,
    occurredAt: params.occurredAt,
    payload: {
      businessId: params.businessId,
      updatedFields: params.updatedFields,
    },
  };
}

/**
 * `ENG-P2-002C` (Phase Q). `fromStatus`/`toStatus` are not PII and are
 * exactly what a lifecycle-reacting consumer (e.g. future capability-3
 * provisioning) needs — no other Business field is included.
 */
export type BusinessLifecycleChangedPayload = {
  businessId: string;
  fromStatus: string;
  toStatus: string;
};

export function buildBusinessLifecycleChangedEvent(
  params: EventEnvelopeParams & BusinessLifecycleChangedPayload,
): DomainEvent<BusinessLifecycleChangedPayload> {
  return {
    eventId: params.eventId,
    eventType: buildEventType(SOURCE_DOMAIN, "business_lifecycle_changed", 1),
    eventVersion: 1,
    sourceDomain: SOURCE_DOMAIN,
    aggregateType: AGGREGATE_TYPE,
    aggregateId: params.businessId,
    correlationId: params.correlationId,
    actor: params.actor,
    occurredAt: params.occurredAt,
    payload: {
      businessId: params.businessId,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
    },
  };
}

/** `ENG-P2-002C` (Phase Q). Same field-names-only privacy minimization as `BusinessProfileUpdatedPayload`. */
export type BusinessBranchUpdatedPayload = {
  businessId: string;
  branchId: string;
  updatedFields: string[];
};

const BRANCH_AGGREGATE_TYPE = "business_branch";

export function buildBusinessBranchUpdatedEvent(
  params: EventEnvelopeParams & BusinessBranchUpdatedPayload,
): DomainEvent<BusinessBranchUpdatedPayload> {
  return {
    eventId: params.eventId,
    eventType: buildEventType(SOURCE_DOMAIN, "business_branch_updated", 1),
    eventVersion: 1,
    sourceDomain: SOURCE_DOMAIN,
    aggregateType: BRANCH_AGGREGATE_TYPE,
    aggregateId: params.branchId,
    correlationId: params.correlationId,
    actor: params.actor,
    occurredAt: params.occurredAt,
    payload: {
      businessId: params.businessId,
      branchId: params.branchId,
      updatedFields: params.updatedFields,
    },
  };
}

/**
 * `ENG-P3-002A` (design §37). Privacy-minimal per this file's own
 * established principle: no Terms *content* is carried (that lives
 * outside this codebase entirely, §37.5), and no PII beyond the
 * already-necessary identity/business references — `languageCode` is
 * retained because it is operationally relevant (matches
 * `BusinessTermsAcceptance`'s own persisted shape), not because it is
 * sensitive.
 */
export type BusinessTermsAcceptedPayload = {
  businessId: string;
  acceptingCustomerIdentityId: string;
  termsVersion: string;
  languageCode: string;
};

const TERMS_ACCEPTANCE_AGGREGATE_TYPE = "business_terms_acceptance";

export function buildBusinessTermsAcceptedEvent(
  params: EventEnvelopeParams & BusinessTermsAcceptedPayload,
): DomainEvent<BusinessTermsAcceptedPayload> {
  return {
    eventId: params.eventId,
    eventType: buildEventType(SOURCE_DOMAIN, "business_terms_accepted", 1),
    eventVersion: 1,
    sourceDomain: SOURCE_DOMAIN,
    aggregateType: TERMS_ACCEPTANCE_AGGREGATE_TYPE,
    aggregateId: params.businessId,
    correlationId: params.correlationId,
    actor: params.actor,
    occurredAt: params.occurredAt,
    payload: {
      businessId: params.businessId,
      acceptingCustomerIdentityId: params.acceptingCustomerIdentityId,
      termsVersion: params.termsVersion,
      languageCode: params.languageCode,
    },
  };
}
