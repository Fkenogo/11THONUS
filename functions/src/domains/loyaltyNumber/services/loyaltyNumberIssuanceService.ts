/**
 * Loyalty Number issuance service (ENG-P2-001-03).
 *
 * Implements `DEC-DATA-007`'s Identifier Generation Principles and
 * Collision/Idempotency behaviour as a pure, framework-independent
 * domain function. No Firestore, no transactions, no transport — a
 * future persistence-layer task (`ENG-P2-001-05` or equivalent) supplies
 * real `LoyaltyNumberCandidateGenerator`/`LoyaltyNumberUniquenessPort`
 * implementations and the "does an assignment already exist for this
 * identity" lookup this function takes as the `existingAssignment` input.
 *
 * `MAX_ISSUANCE_ATTEMPTS`: `DEC-DATA-007` and its decision package
 * require only a "small maximum-retry count" without naming an exact
 * figure — explicitly framed as a generation-service implementation
 * parameter, not a policy question. 5 is chosen here: at the decision
 * package's own worst-case collision rate (~7.06% at 1,000,000
 * customers), 5 consecutive collisions is ≈(0.0706)^5 ≈ 1.7×10⁻⁷ —
 * effectively unreachable at MVP/near-term scale while remaining small
 * and bounded per governance. This parameter is disclosed, not silently
 * chosen — see the ENG-P2-001-03 implementation report.
 */

import {
  createCustomerIdentityId,
  type CustomerIdentityId,
} from "../../identity/models/customerIdentityId";
import { createLoyaltyNumber, type LoyaltyNumber } from "../models/loyaltyNumber";
import {
  conflictingLoyaltyNumberAssignmentError,
  identityNotEligibleForIssuanceError,
  invalidCustomerIdentityIdForLoyaltyNumberError,
  loyaltyNumberIssuanceExhaustedError,
  loyaltyNumberUniquenessCheckFailedError,
} from "../models/loyaltyNumberErrors";
import type { EventActor, DomainEvent } from "../../../shared/events/domainEvent";
import {
  buildLoyaltyNumberIssuanceCollisionDetectedEvent,
  buildLoyaltyNumberIssuedEvent,
  type LoyaltyNumberIssuanceCollisionDetectedPayload,
  type LoyaltyNumberIssuedPayload,
} from "../events/loyaltyNumberEvents";
import type { LoyaltyNumberCandidateGenerator } from "./loyaltyNumberGenerator";
import type { LoyaltyNumberUniquenessPort } from "./loyaltyNumberUniquenessPort";

export const MAX_ISSUANCE_ATTEMPTS = 5;

export type LoyaltyNumberAssignment = {
  readonly customerIdentityId: CustomerIdentityId;
  readonly loyaltyNumber: LoyaltyNumber;
  readonly assignedAt: Date;
};

type EventEnvelopeParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
};

export type IssueLoyaltyNumberParams = EventEnvelopeParams & {
  customerIdentityId: string;
  assignedAt: Date;
  existingAssignment?: LoyaltyNumberAssignment;
  identityEligibleForIssuance?: boolean;
  generator: LoyaltyNumberCandidateGenerator;
  uniquenessPort: LoyaltyNumberUniquenessPort;
};

type IssuanceEvent =
  | DomainEvent<LoyaltyNumberIssuanceCollisionDetectedPayload>
  | DomainEvent<LoyaltyNumberIssuedPayload>;

export async function issueLoyaltyNumber(
  params: IssueLoyaltyNumberParams,
): Promise<{ assignment: LoyaltyNumberAssignment; events: IssuanceEvent[] }> {
  let customerIdentityId: CustomerIdentityId;
  try {
    customerIdentityId = createCustomerIdentityId(params.customerIdentityId);
  } catch {
    throw invalidCustomerIdentityIdForLoyaltyNumberError(params.customerIdentityId);
  }

  if (params.existingAssignment) {
    if (params.existingAssignment.customerIdentityId !== customerIdentityId) {
      throw conflictingLoyaltyNumberAssignmentError(customerIdentityId);
    }
    return { assignment: params.existingAssignment, events: [] };
  }

  if (params.identityEligibleForIssuance === false) {
    throw identityNotEligibleForIssuanceError(customerIdentityId);
  }

  const events: IssuanceEvent[] = [];

  for (let attempt = 1; attempt <= MAX_ISSUANCE_ATTEMPTS; attempt++) {
    const candidate = createLoyaltyNumber(params.generator.generateCandidate());

    let alreadyAssigned: boolean;
    try {
      alreadyAssigned = await params.uniquenessPort.isAlreadyAssigned(candidate);
    } catch {
      throw loyaltyNumberUniquenessCheckFailedError(customerIdentityId);
    }

    if (!alreadyAssigned) {
      const assignment: LoyaltyNumberAssignment = {
        customerIdentityId,
        loyaltyNumber: candidate,
        assignedAt: params.assignedAt,
      };
      events.push(
        buildLoyaltyNumberIssuedEvent({
          eventId: params.eventId,
          correlationId: params.correlationId,
          actor: params.actor,
          occurredAt: params.occurredAt,
          customerIdentityId,
          loyaltyNumber: candidate,
        }),
      );
      return { assignment, events };
    }

    events.push(
      buildLoyaltyNumberIssuanceCollisionDetectedEvent({
        eventId: params.eventId,
        correlationId: params.correlationId,
        actor: params.actor,
        occurredAt: params.occurredAt,
        customerIdentityId,
        attemptNumber: attempt,
      }),
    );
  }

  throw loyaltyNumberIssuanceExhaustedError(customerIdentityId, MAX_ISSUANCE_ATTEMPTS);
}
