/**
 * QR Identity association service (ENG-P2-001-04).
 *
 * Implements `ENG-P2-ARCH-001` §5's QR Lifecycle (Generation,
 * Regeneration, Invalidation, Recovery) as pure, framework-independent
 * domain functions. No Firestore, no rendering, no transport.
 *
 * Regeneration semantics — a documented reconciliation, not an
 * invention: `ENG-P2-ARCH-001` §5 says regeneration leaves "the
 * underlying `qrReference`/Loyalty Number relationship... unchanged,"
 * while `ENG-P2-001-PLAN-001`'s own `-04` section (in the same Scope
 * bullet, its Tests-required line, and its Rollback-boundary line)
 * requires "a new resolvable reference" with "the prior reference
 * fail[ing] to resolve." This module reads "relationship... unchanged"
 * as the stable *mapping* (which identity/loyalty number this QR
 * ultimately represents), not literal identity of the reference string
 * — see the ENG-P2-001-04 implementation report for the full textual
 * analysis. Regeneration therefore produces a genuinely new
 * `QrReference`; the identity and loyalty number never change.
 *
 * Two lifecycle statuses only (`active` | `invalidated`) — no separate
 * `retired` status is introduced. `ENG-P2-ARCH-001` §3's Closed row says
 * QR fields are "retained, not deleted" on identity closure; it does not
 * name a distinct QR-domain "retired" status the way it does for the
 * Loyalty Number. Retention-without-reuse is satisfied structurally: no
 * operation in this module ever frees a `qrReference` for reuse.
 */

import {
  createCustomerIdentityId,
  type CustomerIdentityId,
} from "../../identity/models/customerIdentityId";
import { createLoyaltyNumber, type LoyaltyNumber } from "../../loyaltyNumber/models/loyaltyNumber";
import { createQrReference, type QrReference } from "../models/qrReference";
import {
  conflictingQrIdentityAssociationError,
  duplicateActiveQrIdentityError,
  invalidCustomerIdentityIdForQrIdentityError,
  invalidLoyaltyNumberForQrIdentityError,
  qrRegenerationNotPermittedError,
} from "../models/qrIdentityErrors";
import type { EventActor, DomainEvent } from "../../../shared/events/domainEvent";
import {
  buildQrIdentityInvalidatedEvent,
  buildQrIdentityIssuedEvent,
  buildQrIdentityRegeneratedEvent,
  type QrIdentityInvalidatedPayload,
  type QrIdentityIssuedPayload,
  type QrIdentityRegeneratedPayload,
} from "../events/qrIdentityEvents";
import type { QrReferenceGenerator } from "./qrReferenceGenerator";

export const QR_IDENTITY_STATUSES = ["active", "invalidated"] as const;
export type QrIdentityStatus = (typeof QR_IDENTITY_STATUSES)[number];

export type QrIdentityAssociation = {
  readonly customerIdentityId: CustomerIdentityId;
  readonly loyaltyNumber: LoyaltyNumber;
  readonly qrReference: QrReference;
  readonly status: QrIdentityStatus;
  readonly issuedAt: Date;
};

type EventEnvelopeParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
};

function parseCustomerIdentityId(value: string): CustomerIdentityId {
  try {
    return createCustomerIdentityId(value);
  } catch {
    throw invalidCustomerIdentityIdForQrIdentityError(value);
  }
}

function parseLoyaltyNumber(value: string): LoyaltyNumber {
  try {
    return createLoyaltyNumber(value);
  } catch {
    throw invalidLoyaltyNumberForQrIdentityError(value);
  }
}

export type IssueQrIdentityParams = EventEnvelopeParams & {
  customerIdentityId: string;
  loyaltyNumber: string;
  issuedAt: Date;
  existingAssociation?: QrIdentityAssociation;
  generator: QrReferenceGenerator;
};

export function issueQrIdentity(params: IssueQrIdentityParams): {
  association: QrIdentityAssociation;
  events: [DomainEvent<QrIdentityIssuedPayload>];
} {
  const customerIdentityId = parseCustomerIdentityId(params.customerIdentityId);
  const loyaltyNumber = parseLoyaltyNumber(params.loyaltyNumber);

  if (params.existingAssociation) {
    if (params.existingAssociation.customerIdentityId !== customerIdentityId) {
      throw conflictingQrIdentityAssociationError(customerIdentityId);
    }
    if (params.existingAssociation.status === "active") {
      throw duplicateActiveQrIdentityError(customerIdentityId);
    }
    throw conflictingQrIdentityAssociationError(customerIdentityId);
  }

  const qrReference = createQrReference(params.generator.generateReference());
  const association: QrIdentityAssociation = {
    customerIdentityId,
    loyaltyNumber,
    qrReference,
    status: "active",
    issuedAt: params.issuedAt,
  };

  const event = buildQrIdentityIssuedEvent({
    eventId: params.eventId,
    correlationId: params.correlationId,
    actor: params.actor,
    occurredAt: params.occurredAt,
    customerIdentityId,
    qrReference,
  });

  return { association, events: [event] };
}

export type RegenerateQrIdentityParams = EventEnvelopeParams & {
  current: QrIdentityAssociation;
  regeneratedAt: Date;
  generator: QrReferenceGenerator;
};

export function regenerateQrIdentity(params: RegenerateQrIdentityParams): {
  invalidated: QrIdentityAssociation;
  active: QrIdentityAssociation;
  events: [DomainEvent<QrIdentityInvalidatedPayload>, DomainEvent<QrIdentityRegeneratedPayload>];
} {
  const { current } = params;

  if (current.status !== "active") {
    throw qrRegenerationNotPermittedError(current.customerIdentityId);
  }

  const newReference = createQrReference(params.generator.generateReference());

  const invalidated: QrIdentityAssociation = { ...current, status: "invalidated" };
  const active: QrIdentityAssociation = {
    customerIdentityId: current.customerIdentityId,
    loyaltyNumber: current.loyaltyNumber,
    qrReference: newReference,
    status: "active",
    issuedAt: params.regeneratedAt,
  };

  const envelope = {
    eventId: params.eventId,
    correlationId: params.correlationId,
    actor: params.actor,
    occurredAt: params.occurredAt,
  };

  const invalidatedEvent = buildQrIdentityInvalidatedEvent({
    ...envelope,
    customerIdentityId: current.customerIdentityId,
    qrReference: current.qrReference,
  });
  const regeneratedEvent = buildQrIdentityRegeneratedEvent({
    ...envelope,
    customerIdentityId: current.customerIdentityId,
    qrReference: newReference,
    previousQrReference: current.qrReference,
  });

  return { invalidated, active, events: [invalidatedEvent, regeneratedEvent] };
}

export function restoreQrIdentityForRecovery(
  current: QrIdentityAssociation,
): QrIdentityAssociation {
  return current;
}
