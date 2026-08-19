/**
 * Staff Invitation / Membership lifecycle domain events (`ENG-P2-003B`).
 *
 * Reuses the existing shared `DomainEvent<T>`/`buildEventType` contract
 * (`ENG-P1-002`), mirroring `businessEvents.ts`'s pattern exactly. Event
 * names are the candidate names `ENG-P2-003-DESIGN-001` §17's addendum
 * lists — Engineering-owned, not Founder-frozen (the design doc's own
 * disclosure).
 *
 * Privacy-minimal payloads (Phase U): only identifiers and categorical
 * values (`invitationId`, `businessId`, `role`, `membershipId`, `userId`)
 * — never the delivery address (email/phone), never a token/reference
 * value, never permission-override content. A consumer needing the
 * delivery address can read the `businessMembershipInvitations/{id}`
 * document directly, same principle `businessEvents.ts` already
 * establishes for `contactEmail`/`contactPhone`.
 */

import type { DomainEvent, EventActor } from "../../../shared/events/domainEvent";
import { buildEventType } from "../../../shared/events/eventNaming";

const SOURCE_DOMAIN = "staffInvitation";
const INVITATION_AGGREGATE_TYPE = "businessMembershipInvitation";
const MEMBERSHIP_AGGREGATE_TYPE = "businessMembership";

type EventEnvelopeParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
};

export type StaffInvitationCreatedPayload = {
  invitationId: string;
  businessId: string;
  role: string;
  invitedBy: string;
};

export function buildStaffInvitationCreatedEvent(
  params: EventEnvelopeParams & StaffInvitationCreatedPayload,
): DomainEvent<StaffInvitationCreatedPayload> {
  return {
    eventId: params.eventId,
    eventType: buildEventType(SOURCE_DOMAIN, "staff_invitation_created", 1),
    eventVersion: 1,
    sourceDomain: SOURCE_DOMAIN,
    aggregateType: INVITATION_AGGREGATE_TYPE,
    aggregateId: params.invitationId,
    correlationId: params.correlationId,
    actor: params.actor,
    occurredAt: params.occurredAt,
    payload: {
      invitationId: params.invitationId,
      businessId: params.businessId,
      role: params.role,
      invitedBy: params.invitedBy,
    },
  };
}

export type StaffInvitationRevokedPayload = {
  invitationId: string;
  businessId: string;
  revokedBy: string;
};

export function buildStaffInvitationRevokedEvent(
  params: EventEnvelopeParams & StaffInvitationRevokedPayload,
): DomainEvent<StaffInvitationRevokedPayload> {
  return {
    eventId: params.eventId,
    eventType: buildEventType(SOURCE_DOMAIN, "staff_invitation_revoked", 1),
    eventVersion: 1,
    sourceDomain: SOURCE_DOMAIN,
    aggregateType: INVITATION_AGGREGATE_TYPE,
    aggregateId: params.invitationId,
    correlationId: params.correlationId,
    actor: params.actor,
    occurredAt: params.occurredAt,
    payload: {
      invitationId: params.invitationId,
      businessId: params.businessId,
      revokedBy: params.revokedBy,
    },
  };
}

export type StaffInvitationExpiredPayload = {
  invitationId: string;
  businessId: string;
};

export function buildStaffInvitationExpiredEvent(
  params: EventEnvelopeParams & StaffInvitationExpiredPayload,
): DomainEvent<StaffInvitationExpiredPayload> {
  return {
    eventId: params.eventId,
    eventType: buildEventType(SOURCE_DOMAIN, "staff_invitation_expired", 1),
    eventVersion: 1,
    sourceDomain: SOURCE_DOMAIN,
    aggregateType: INVITATION_AGGREGATE_TYPE,
    aggregateId: params.invitationId,
    correlationId: params.correlationId,
    actor: params.actor,
    occurredAt: params.occurredAt,
    payload: {
      invitationId: params.invitationId,
      businessId: params.businessId,
    },
  };
}

export type StaffInvitationAcceptedPayload = {
  invitationId: string;
  businessId: string;
  membershipId: string;
};

export function buildStaffInvitationAcceptedEvent(
  params: EventEnvelopeParams & StaffInvitationAcceptedPayload,
): DomainEvent<StaffInvitationAcceptedPayload> {
  return {
    eventId: params.eventId,
    eventType: buildEventType(SOURCE_DOMAIN, "staff_invitation_accepted", 1),
    eventVersion: 1,
    sourceDomain: SOURCE_DOMAIN,
    aggregateType: INVITATION_AGGREGATE_TYPE,
    aggregateId: params.invitationId,
    correlationId: params.correlationId,
    actor: params.actor,
    occurredAt: params.occurredAt,
    payload: {
      invitationId: params.invitationId,
      businessId: params.businessId,
      membershipId: params.membershipId,
    },
  };
}

export type StaffMembershipActivatedPayload = {
  membershipId: string;
  businessId: string;
  userId: string;
  role: string;
  invitationId: string;
};

export function buildStaffMembershipActivatedEvent(
  params: EventEnvelopeParams & StaffMembershipActivatedPayload,
): DomainEvent<StaffMembershipActivatedPayload> {
  return {
    eventId: params.eventId,
    eventType: buildEventType(SOURCE_DOMAIN, "staff_membership_activated", 1),
    eventVersion: 1,
    sourceDomain: SOURCE_DOMAIN,
    aggregateType: MEMBERSHIP_AGGREGATE_TYPE,
    aggregateId: params.membershipId,
    correlationId: params.correlationId,
    actor: params.actor,
    occurredAt: params.occurredAt,
    payload: {
      membershipId: params.membershipId,
      businessId: params.businessId,
      userId: params.userId,
      role: params.role,
      invitationId: params.invitationId,
    },
  };
}
