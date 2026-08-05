/**
 * Identity domain events (ENG-P2-001-01).
 *
 * Uses the existing shared `DomainEvent<T>`/`buildEventType` contract
 * (`functions/src/shared/events/*`, ENG-P1-002, TRD11 §11.8–11.9), which
 * has zero Firebase dependency. Only the 9 events named in this task's own
 * scope are defined — no event transport, persistence, queue, or Cloud
 * Function wiring; events remain plain domain objects.
 */

import type { DomainEvent, EventActor } from "../../../shared/events/domainEvent";
import { buildEventType } from "../../../shared/events/eventNaming";
import type { AuthenticationReferenceType } from "../models/authenticationReference";
import type { IdentityStatus } from "../models/identityStatus";
import type { TransitionAuthority } from "../models/transitionAuthority";
import type { TransitionReason } from "../models/transitionReason";
import type { RecoveryProofMethodCategory } from "../models/recoveryProof";

const SOURCE_DOMAIN = "identity";
const AGGREGATE_TYPE = "customer_identity";

type EventEnvelopeParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
};

function buildIdentityEvent<T>(
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

export type CustomerIdentityRegisteredPayload = { customerIdentityId: string };

export function buildCustomerIdentityRegisteredEvent(
  params: EventEnvelopeParams & { customerIdentityId: string },
): DomainEvent<CustomerIdentityRegisteredPayload> {
  return buildIdentityEvent(params, "customer_identity_registered", params.customerIdentityId, {
    customerIdentityId: params.customerIdentityId,
  });
}

export type CustomerIdentityActivatedPayload = {
  customerIdentityId: string;
  previousStatus: IdentityStatus;
  authority: TransitionAuthority;
  reason: TransitionReason;
};

export function buildCustomerIdentityActivatedEvent(
  params: EventEnvelopeParams & CustomerIdentityActivatedPayload,
): DomainEvent<CustomerIdentityActivatedPayload> {
  return buildIdentityEvent(params, "customer_identity_activated", params.customerIdentityId, {
    customerIdentityId: params.customerIdentityId,
    previousStatus: params.previousStatus,
    authority: params.authority,
    reason: params.reason,
  });
}

export type CustomerIdentitySuspendedPayload = {
  customerIdentityId: string;
  previousStatus: IdentityStatus;
  authority: TransitionAuthority;
  reason: TransitionReason;
};

export function buildCustomerIdentitySuspendedEvent(
  params: EventEnvelopeParams & CustomerIdentitySuspendedPayload,
): DomainEvent<CustomerIdentitySuspendedPayload> {
  return buildIdentityEvent(params, "customer_identity_suspended", params.customerIdentityId, {
    customerIdentityId: params.customerIdentityId,
    previousStatus: params.previousStatus,
    authority: params.authority,
    reason: params.reason,
  });
}

export type CustomerIdentityLockedPayload = {
  customerIdentityId: string;
  previousStatus: IdentityStatus;
  authority: TransitionAuthority;
  reason: TransitionReason;
};

export function buildCustomerIdentityLockedEvent(
  params: EventEnvelopeParams & CustomerIdentityLockedPayload,
): DomainEvent<CustomerIdentityLockedPayload> {
  return buildIdentityEvent(params, "customer_identity_locked", params.customerIdentityId, {
    customerIdentityId: params.customerIdentityId,
    previousStatus: params.previousStatus,
    authority: params.authority,
    reason: params.reason,
  });
}

export type CustomerIdentityClosedPayload = {
  customerIdentityId: string;
  previousStatus: IdentityStatus;
  authority: TransitionAuthority;
  reason: TransitionReason;
};

export function buildCustomerIdentityClosedEvent(
  params: EventEnvelopeParams & CustomerIdentityClosedPayload,
): DomainEvent<CustomerIdentityClosedPayload> {
  return buildIdentityEvent(params, "customer_identity_closed", params.customerIdentityId, {
    customerIdentityId: params.customerIdentityId,
    previousStatus: params.previousStatus,
    authority: params.authority,
    reason: params.reason,
  });
}

export type CustomerIdentityArchivedPayload = {
  customerIdentityId: string;
  authority: TransitionAuthority;
  reason: TransitionReason;
};

export function buildCustomerIdentityArchivedEvent(
  params: EventEnvelopeParams & CustomerIdentityArchivedPayload,
): DomainEvent<CustomerIdentityArchivedPayload> {
  return buildIdentityEvent(params, "customer_identity_archived", params.customerIdentityId, {
    customerIdentityId: params.customerIdentityId,
    authority: params.authority,
    reason: params.reason,
  });
}

export type AuthenticationReferenceLinkedPayload = {
  customerIdentityId: string;
  referenceId: string;
  referenceType: AuthenticationReferenceType;
};

export function buildAuthenticationReferenceLinkedEvent(
  params: EventEnvelopeParams & AuthenticationReferenceLinkedPayload,
): DomainEvent<AuthenticationReferenceLinkedPayload> {
  return buildIdentityEvent(params, "authentication_reference_linked", params.customerIdentityId, {
    customerIdentityId: params.customerIdentityId,
    referenceId: params.referenceId,
    referenceType: params.referenceType,
  });
}

export type AuthenticationReferenceUnlinkedPayload = {
  customerIdentityId: string;
  referenceId: string;
};

export function buildAuthenticationReferenceUnlinkedEvent(
  params: EventEnvelopeParams & AuthenticationReferenceUnlinkedPayload,
): DomainEvent<AuthenticationReferenceUnlinkedPayload> {
  return buildIdentityEvent(
    params,
    "authentication_reference_unlinked",
    params.customerIdentityId,
    { customerIdentityId: params.customerIdentityId, referenceId: params.referenceId },
  );
}

export type TrustReferenceUpdatedPayload = {
  customerIdentityId: string;
  trustRecordId: string;
};

export function buildTrustReferenceUpdatedEvent(
  params: EventEnvelopeParams & TrustReferenceUpdatedPayload,
): DomainEvent<TrustReferenceUpdatedPayload> {
  return buildIdentityEvent(params, "trust_reference_updated", params.customerIdentityId, {
    customerIdentityId: params.customerIdentityId,
    trustRecordId: params.trustRecordId,
  });
}

/**
 * Lifecycle events (ENG-P2-001-06).
 *
 * `IdentityBecameDormant` fills the one gap `-01` explicitly deferred
 * ("no event is emitted" for `→ dormant`, per that module's own comment)
 * — this task's own scope is exactly where that deferral said the event
 * belongs. `IdentityRecovered` is genuinely new: the audit-trail marker
 * for the `Recovered` transition (`ENG-P2-001-PLAN-001` §14 Ambiguity 1
 * — a transient marker, never a persisted status). Both payloads carry
 * only status/authority-category references — no phone, email, token,
 * or trust evidence, matching the existing 9 events' own discipline.
 *
 * `authority`/`reason` on all six general-transition events (Activated,
 * Suspended, Locked, Closed, Archived, BecameDormant) and on
 * `IdentityRecovered` (correction, Founder review of PR #61): these are
 * the single, append-only source of truth for "who/why" a transition
 * happened — not an untyped field on the mutable `users/{id}` current-
 * state document, which would silently retain only the most recent
 * transition's value and be invisible to the typed domain layer.
 */

export type IdentityBecameDormantPayload = {
  customerIdentityId: string;
  previousStatus: IdentityStatus;
  authority: TransitionAuthority;
  reason: TransitionReason;
};

export function buildIdentityBecameDormantEvent(
  params: EventEnvelopeParams & IdentityBecameDormantPayload,
): DomainEvent<IdentityBecameDormantPayload> {
  return buildIdentityEvent(params, "identity_became_dormant", params.customerIdentityId, {
    customerIdentityId: params.customerIdentityId,
    previousStatus: params.previousStatus,
    authority: params.authority,
    reason: params.reason,
  });
}

export type IdentityRecoveredPayload = {
  customerIdentityId: string;
  previousStatus: IdentityStatus;
  resultingStatus: IdentityStatus;
  authority: TransitionAuthority;
  reason: TransitionReason;
  recoveryProofReference: string;
  proofMethodCategory: RecoveryProofMethodCategory;
};

export function buildIdentityRecoveredEvent(
  params: EventEnvelopeParams & IdentityRecoveredPayload,
): DomainEvent<IdentityRecoveredPayload> {
  return buildIdentityEvent(params, "identity_recovered", params.customerIdentityId, {
    customerIdentityId: params.customerIdentityId,
    previousStatus: params.previousStatus,
    resultingStatus: params.resultingStatus,
    authority: params.authority,
    reason: params.reason,
    recoveryProofReference: params.recoveryProofReference,
    proofMethodCategory: params.proofMethodCategory,
  });
}
