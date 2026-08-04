/**
 * Customer Identity aggregate root (ENG-P2-001-01).
 *
 * The permanent Identity Aggregate per `ENG-P2-ARCH-001` §2: Internal
 * Customer ID, status, creation/update attribution, linked authentication
 * references, and an optional trust reference. Owns no Loyalty Number, QR,
 * or profile data (`-02`/`-03`/`-04`'s own concerns) and no authentication
 * or trust logic — only reference pointers to those other concerns.
 *
 * Registration transitions directly to `active` — `DEC-IDENTITY-001`'s
 * Standard Participation Principle means there is no intermediate,
 * externally-observable gate between identity creation and full
 * participation.
 */

import type { CustomerIdentityId } from "./customerIdentityId";
import { createCustomerIdentityId } from "./customerIdentityId";
import type {
  AuthenticationReference,
  CreateAuthenticationReferenceParams,
} from "./authenticationReference";
import { createAuthenticationReference } from "./authenticationReference";
import type { CreateTrustReferenceParams, TrustReference } from "./trustReference";
import { createTrustReference } from "./trustReference";
import type { IdentityStatus } from "./identityStatus";
import { isValidIdentityStatusTransition } from "./identityStatus";
import {
  authenticationReferenceNotFoundError,
  duplicateAuthenticationReferenceError,
  duplicateTrustReferenceError,
  identityAlreadyClosedError,
  identityArchivedError,
  invalidIdentityStatusTransitionError,
  lastAuthenticationReferenceCannotBeUnlinkedError,
} from "./identityErrors";
import type { EventActor, DomainEvent } from "../../../shared/events/domainEvent";
import {
  buildAuthenticationReferenceLinkedEvent,
  buildAuthenticationReferenceUnlinkedEvent,
  buildCustomerIdentityActivatedEvent,
  buildCustomerIdentityArchivedEvent,
  buildCustomerIdentityClosedEvent,
  buildCustomerIdentityLockedEvent,
  buildCustomerIdentityRegisteredEvent,
  buildCustomerIdentitySuspendedEvent,
  buildIdentityBecameDormantEvent,
  buildTrustReferenceUpdatedEvent,
  type AuthenticationReferenceLinkedPayload,
  type AuthenticationReferenceUnlinkedPayload,
  type CustomerIdentityActivatedPayload,
  type CustomerIdentityArchivedPayload,
  type CustomerIdentityClosedPayload,
  type CustomerIdentityLockedPayload,
  type CustomerIdentityRegisteredPayload,
  type CustomerIdentitySuspendedPayload,
  type IdentityBecameDormantPayload,
  type TrustReferenceUpdatedPayload,
} from "../events/identityEvents";

export type CustomerIdentity = {
  readonly id: CustomerIdentityId;
  status: IdentityStatus;
  readonly createdAt: Date;
  readonly createdBy: string | null;
  updatedAt: Date;
  updatedBy: string | null;
  authenticationReferences: AuthenticationReference[];
  trustReference?: TrustReference;
};

type EventEnvelope = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
};

export type RegisterCustomerIdentityParams = EventEnvelope & {
  customerIdentityId: string;
  initialAuthenticationReference: CreateAuthenticationReferenceParams;
  createdAt: Date;
  createdBy: string | null;
};

export function registerCustomerIdentity(params: RegisterCustomerIdentityParams): {
  identity: CustomerIdentity;
  events: [DomainEvent<CustomerIdentityRegisteredPayload>];
} {
  const id = createCustomerIdentityId(params.customerIdentityId);
  const initialReference = createAuthenticationReference(params.initialAuthenticationReference);

  const identity: CustomerIdentity = {
    id,
    status: "active",
    createdAt: params.createdAt,
    createdBy: params.createdBy,
    updatedAt: params.createdAt,
    updatedBy: params.createdBy,
    authenticationReferences: [initialReference],
  };

  const event = buildCustomerIdentityRegisteredEvent({
    eventId: params.eventId,
    correlationId: params.correlationId,
    actor: params.actor,
    occurredAt: params.occurredAt,
    customerIdentityId: id,
  });

  return { identity, events: [event] };
}

type StatusEvent =
  | DomainEvent<CustomerIdentityActivatedPayload>
  | DomainEvent<CustomerIdentitySuspendedPayload>
  | DomainEvent<CustomerIdentityLockedPayload>
  | DomainEvent<CustomerIdentityClosedPayload>
  | DomainEvent<CustomerIdentityArchivedPayload>
  | DomainEvent<IdentityBecameDormantPayload>;

export type TransitionIdentityStatusParams = EventEnvelope & {
  updatedAt: Date;
  updatedBy: string | null;
};

function assertTransitionPermitted(identity: CustomerIdentity, to: IdentityStatus): void {
  if (identity.status === "closed" && to !== "archived") {
    throw identityAlreadyClosedError(identity.id);
  }
  if (identity.status === "archived") {
    throw identityArchivedError(identity.id);
  }
  if (!isValidIdentityStatusTransition(identity.status, to)) {
    throw invalidIdentityStatusTransitionError(identity.status, to);
  }
}

function buildStatusEvent(
  fromStatus: IdentityStatus,
  toStatus: IdentityStatus,
  identity: CustomerIdentity,
  envelope: EventEnvelope,
): StatusEvent | undefined {
  const base = { ...envelope, customerIdentityId: identity.id };

  if (toStatus === "active" && fromStatus !== "registered") {
    return buildCustomerIdentityActivatedEvent({ ...base, previousStatus: fromStatus });
  }
  if (toStatus === "suspended") {
    return buildCustomerIdentitySuspendedEvent({ ...base, previousStatus: fromStatus });
  }
  if (toStatus === "locked") {
    return buildCustomerIdentityLockedEvent({ ...base, previousStatus: fromStatus });
  }
  if (toStatus === "closed") {
    return buildCustomerIdentityClosedEvent({ ...base, previousStatus: fromStatus });
  }
  if (toStatus === "archived") {
    return buildCustomerIdentityArchivedEvent(base);
  }
  if (toStatus === "dormant") {
    return buildIdentityBecameDormantEvent({ ...base, previousStatus: fromStatus });
  }

  return undefined;
}

export function transitionIdentityStatus(
  identity: CustomerIdentity,
  toStatus: IdentityStatus,
  params: TransitionIdentityStatusParams,
): { identity: CustomerIdentity; event: StatusEvent | undefined } {
  assertTransitionPermitted(identity, toStatus);

  const fromStatus = identity.status;
  const event = buildStatusEvent(fromStatus, toStatus, identity, params);

  const updated: CustomerIdentity = {
    ...identity,
    status: toStatus,
    updatedAt: params.updatedAt,
    updatedBy: params.updatedBy,
  };

  return { identity: updated, event };
}

export function linkAuthenticationReference(
  identity: CustomerIdentity,
  params: CreateAuthenticationReferenceParams,
  envelope: EventEnvelope,
): { identity: CustomerIdentity; event: DomainEvent<AuthenticationReferenceLinkedPayload> } {
  if (identity.status === "closed") {
    throw identityAlreadyClosedError(identity.id);
  }
  if (identity.status === "archived") {
    throw identityArchivedError(identity.id);
  }
  if (identity.authenticationReferences.some((ref) => ref.referenceId === params.referenceId)) {
    throw duplicateAuthenticationReferenceError(params.referenceId);
  }

  const reference = createAuthenticationReference(params);

  const updated: CustomerIdentity = {
    ...identity,
    authenticationReferences: [...identity.authenticationReferences, reference],
  };

  const event = buildAuthenticationReferenceLinkedEvent({
    ...envelope,
    customerIdentityId: identity.id,
    referenceId: reference.referenceId,
    referenceType: reference.referenceType,
  });

  return { identity: updated, event };
}

export function unlinkAuthenticationReference(
  identity: CustomerIdentity,
  referenceId: string,
  envelope: EventEnvelope,
): { identity: CustomerIdentity; event: DomainEvent<AuthenticationReferenceUnlinkedPayload> } {
  const existing = identity.authenticationReferences.find((ref) => ref.referenceId === referenceId);
  if (!existing) {
    throw authenticationReferenceNotFoundError(referenceId);
  }
  if (identity.authenticationReferences.length <= 1) {
    throw lastAuthenticationReferenceCannotBeUnlinkedError(identity.id);
  }

  const updated: CustomerIdentity = {
    ...identity,
    authenticationReferences: identity.authenticationReferences.filter(
      (ref) => ref.referenceId !== referenceId,
    ),
  };

  const event = buildAuthenticationReferenceUnlinkedEvent({
    ...envelope,
    customerIdentityId: identity.id,
    referenceId,
  });

  return { identity: updated, event };
}

export function setTrustReference(
  identity: CustomerIdentity,
  params: CreateTrustReferenceParams,
  envelope: EventEnvelope,
): { identity: CustomerIdentity; event: DomainEvent<TrustReferenceUpdatedPayload> } {
  if (identity.trustReference?.trustRecordId === params.trustRecordId) {
    throw duplicateTrustReferenceError(identity.id);
  }

  const trustReference = createTrustReference(params);

  const updated: CustomerIdentity = { ...identity, trustReference };

  const event = buildTrustReferenceUpdatedEvent({
    ...envelope,
    customerIdentityId: identity.id,
    trustRecordId: trustReference.trustRecordId,
  });

  return { identity: updated, event };
}
