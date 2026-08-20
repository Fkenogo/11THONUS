/**
 * Staff Membership lifecycle / role-change domain events (`ENG-P2-003C`).
 *
 * Reuses the existing shared `DomainEvent<T>`/`buildEventType` contract
 * (`ENG-P1-002`), mirroring `staffInvitationEvents.ts`'s pattern exactly.
 * Event names (`StaffMembershipSuspended`/`StaffMembershipReactivated`/
 * `StaffMembershipRemoved`/`StaffRoleChanged`) are candidate,
 * implementation-level names — Engineering-owned, not Founder-frozen
 * (`ENG-P2-003-DESIGN-001` §17's own disclosure, same discipline as the
 * 003B events file).
 *
 * Privacy-minimal payloads (Phase T/U): only identifiers and categorical
 * values (`membershipId`, `businessId`, `userId`, `role`, `actorId`) —
 * never credentials, invitation proof, authentication references, or
 * protected Customer Identity profile data. `ENG-P2-004`'s sensitive
 * authorization audit (`permissionAuditService.ts`) remains separate and
 * automatic — these events are implementation-level domain evidence, not a
 * substitute for that audit trail.
 */

import type { DomainEvent, EventActor } from "../../../shared/events/domainEvent";
import { buildEventType } from "../../../shared/events/eventNaming";

const SOURCE_DOMAIN = "staffMembership";
const MEMBERSHIP_AGGREGATE_TYPE = "businessMembership";

type EventEnvelopeParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
};

export type StaffMembershipSuspendedPayload = {
  membershipId: string;
  businessId: string;
  userId: string;
  role: string;
  suspendedBy: string;
};

export function buildStaffMembershipSuspendedEvent(
  params: EventEnvelopeParams & StaffMembershipSuspendedPayload,
): DomainEvent<StaffMembershipSuspendedPayload> {
  return {
    eventId: params.eventId,
    eventType: buildEventType(SOURCE_DOMAIN, "staff_membership_suspended", 1),
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
      suspendedBy: params.suspendedBy,
    },
  };
}

export type StaffMembershipReactivatedPayload = {
  membershipId: string;
  businessId: string;
  userId: string;
  role: string;
  reactivatedBy: string;
};

export function buildStaffMembershipReactivatedEvent(
  params: EventEnvelopeParams & StaffMembershipReactivatedPayload,
): DomainEvent<StaffMembershipReactivatedPayload> {
  return {
    eventId: params.eventId,
    eventType: buildEventType(SOURCE_DOMAIN, "staff_membership_reactivated", 1),
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
      reactivatedBy: params.reactivatedBy,
    },
  };
}

export type StaffMembershipRemovedPayload = {
  membershipId: string;
  businessId: string;
  userId: string;
  role: string;
  removedBy: string;
};

export function buildStaffMembershipRemovedEvent(
  params: EventEnvelopeParams & StaffMembershipRemovedPayload,
): DomainEvent<StaffMembershipRemovedPayload> {
  return {
    eventId: params.eventId,
    eventType: buildEventType(SOURCE_DOMAIN, "staff_membership_removed", 1),
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
      removedBy: params.removedBy,
    },
  };
}

export type StaffRoleChangedPayload = {
  membershipId: string;
  businessId: string;
  userId: string;
  fromRole: string;
  toRole: string;
  changedBy: string;
  /**
   * `ENG-P2-003C-CORR-001` — additive, optional. Permission ids only
   * (privacy-minimal, no `grantedBy`/timestamp attribution) for any
   * `PermissionOverride` removed from `permissions[]` by this same role
   * change because it was no longer structurally valid for the new role.
   * Omitted (not `[]`) when reconciliation removed nothing, so existing
   * consumers of this event type see no shape change for the common case.
   */
  overridesRemoved?: readonly string[];
};

export function buildStaffRoleChangedEvent(
  params: EventEnvelopeParams & StaffRoleChangedPayload,
): DomainEvent<StaffRoleChangedPayload> {
  return {
    eventId: params.eventId,
    eventType: buildEventType(SOURCE_DOMAIN, "staff_role_changed", 1),
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
      fromRole: params.fromRole,
      toRole: params.toRole,
      changedBy: params.changedBy,
      ...(params.overridesRemoved && params.overridesRemoved.length > 0
        ? { overridesRemoved: params.overridesRemoved }
        : {}),
    },
  };
}
