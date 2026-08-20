/**
 * Staff Permission Override Administration domain events (`ENG-P2-003D`).
 *
 * Reuses the existing shared `DomainEvent<T>`/`buildEventType` contract
 * (`ENG-P1-002`), mirroring `staffMembershipLifecycleEvents.ts`'s pattern
 * exactly. `StaffPermissionOverrideChanged` is a candidate,
 * implementation-level event name — Engineering-owned, not Founder-frozen
 * (`ENG-P2-003-DESIGN-001` §17's own disclosure).
 *
 * This is domain/lifecycle evidence — that an override was added, replaced,
 * or is unchanged — kept entirely separate from `ENG-P2-004C`'s sensitive
 * authorization-decision audit (`permissionAuditService.ts`), which
 * `authorizeAndExecute.ts` already records automatically and unconditionally
 * for every `staff.assignPermissions` decision. This event fires only when
 * the *target* membership's persisted override configuration actually
 * changes (Phase S/T of the original task spec) — never for a no-op replay.
 *
 * Privacy-minimal payload: only identifiers and categorical values
 * (`membershipId`, `businessId`, `targetUserId`, `permissionId`,
 * `direction`, `previousDirection`, `administeredBy`) — never credentials,
 * `AuthenticationReference` values, invitation secrets, or protected
 * Customer Identity profile data.
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

export type StaffPermissionOverrideChangedPayload = {
  membershipId: string;
  businessId: string;
  targetUserId: string;
  permissionId: string;
  direction: "grant" | "revoke";
  /** `null` when no current override previously existed for this permission. */
  previousDirection: "grant" | "revoke" | null;
  administeredBy: string;
};

export function buildStaffPermissionOverrideChangedEvent(
  params: EventEnvelopeParams & StaffPermissionOverrideChangedPayload,
): DomainEvent<StaffPermissionOverrideChangedPayload> {
  return {
    eventId: params.eventId,
    eventType: buildEventType(SOURCE_DOMAIN, "staff_permission_override_changed", 1),
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
      targetUserId: params.targetUserId,
      permissionId: params.permissionId,
      direction: params.direction,
      previousDirection: params.previousDirection,
      administeredBy: params.administeredBy,
    },
  };
}
