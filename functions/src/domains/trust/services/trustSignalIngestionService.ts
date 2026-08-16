/**
 * Trust-signal ingestion service (CAP-P2-ITM-B).
 *
 * The event → evidence mapping boundary named in `ITM-DESIGN-001` §7.1 /
 * §15's ITM-B row: validates a governed `AUTH-08` event
 * (`CustomerAuthenticated` / `AuthenticationRecoveryProofProvided`),
 * confirms the referenced Customer Identity exists (fail-closed — "a
 * trust signal must never create a Customer Identity", Phase N), and
 * delegates the idempotent persistence to
 * `../repositories/trustRecordRepository.ts`.
 *
 * **No band/progression computation happens here** (ITM-C's
 * responsibility, §15) — this module only maps an event onto the closed
 * `TrustEvidenceCategory` set (ITM-A) and forwards it.
 *
 * **Identity-existence check only on the creation path.** Per §4's "the
 * same read-only lookup contract `ENG-P2-001-09` already exposes...
 * optionally, for record creation" — once a trust record already exists
 * for an identity, that identity necessarily existed when the record was
 * first created (identities are never deleted, only status-transitioned),
 * so re-checking on every subsequent signal would be a redundant read on
 * the hot path, not a correctness requirement.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { DomainEvent } from "../../../shared/events/domainEvent";
import { buildEventType } from "../../../shared/events/eventNaming";
import {
  AUTHENTICATION_RECOVERY_PROOF_PROVIDED_EVENT_NAME,
  CUSTOMER_AUTHENTICATED_EVENT_NAME,
} from "../../authentication/events/authenticationEventFactories";
import { lookupCustomerIdentityById } from "../../identity/repositories/identityLookupRepository";
import { IdentityDomainError } from "../../identity/models/identityErrors";
import {
  isTrustEvidenceCategory,
  type TrustEvidenceCategory,
} from "../models/trustEvidenceCategory";
import {
  getTrustRecordByCustomerIdentityId,
  ingestTrustEvidence,
  type IngestTrustEvidenceOutcome,
} from "../repositories/trustRecordRepository";
import {
  malformedCustomerIdentityForTrustEvidenceError,
  malformedTrustSignalEventError,
  unknownCustomerIdentityForTrustEvidenceError,
  unsupportedTrustSignalEventTypeError,
} from "./trustSignalErrors";

// The only source domain/event-version ITM-B is authorized to consume
// signals from at Capability-2 MVP (`ITM-DESIGN-001` §7 —
// purchase/merchant/device/future fraud signals have no data source yet
// and are not invented here). Matched by exact `eventType` string rather
// than via `shared/events/eventNaming.ts`'s `parseEventType` — that
// module's naming-standard regex requires camelCase event names and
// rejects the snake_case names `AUTH-08` actually emits (e.g.
// `authentication.customer_authenticated.v1`); an unrelated, pre-existing
// mismatch in shared infra, not this package's to fix.
const GOVERNED_SOURCE_DOMAIN = "authentication";
const GOVERNED_EVENT_VERSION = 1;

const EVENT_TYPE_TO_CATEGORY: ReadonlyMap<string, TrustEvidenceCategory> = new Map([
  [
    buildEventType(
      GOVERNED_SOURCE_DOMAIN,
      CUSTOMER_AUTHENTICATED_EVENT_NAME,
      GOVERNED_EVENT_VERSION,
    ),
    "customer_authenticated",
  ],
  [
    buildEventType(
      GOVERNED_SOURCE_DOMAIN,
      AUTHENTICATION_RECOVERY_PROOF_PROVIDED_EVENT_NAME,
      GOVERNED_EVENT_VERSION,
    ),
    "authentication_recovery_proof_provided",
  ],
]);

function resolveCategory(event: DomainEvent<unknown>): TrustEvidenceCategory {
  const category = EVENT_TYPE_TO_CATEGORY.get(event.eventType);
  if (!category || !isTrustEvidenceCategory(category)) {
    throw unsupportedTrustSignalEventTypeError(event.eventType);
  }
  return category;
}

function resolveCustomerIdentityId(event: DomainEvent<unknown>): string {
  const payload = event.payload as { customerIdentityId?: unknown } | null | undefined;
  const customerIdentityId = payload?.customerIdentityId;
  if (typeof customerIdentityId !== "string" || customerIdentityId.trim().length === 0) {
    throw malformedTrustSignalEventError(event.eventId);
  }
  return customerIdentityId;
}

function resolveOccurredAt(event: DomainEvent<unknown>): Date {
  const occurredAt = new Date(event.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) {
    throw malformedTrustSignalEventError(event.eventId);
  }
  return occurredAt;
}

async function assertCustomerIdentityExists(
  db: Firestore,
  event: DomainEvent<unknown>,
  customerIdentityId: string,
): Promise<void> {
  try {
    await lookupCustomerIdentityById(db, {
      customerIdentityId,
      purpose: "internal_service",
      eventId: event.eventId,
      correlationId: event.correlationId,
      actor: event.actor,
      occurredAt: event.occurredAt,
    });
  } catch (error) {
    if (error instanceof IdentityDomainError && error.category === "RESOURCE_NOT_FOUND") {
      throw unknownCustomerIdentityForTrustEvidenceError(customerIdentityId);
    }
    // A malformed (not missing) `users/{id}` document — fail closed the
    // same way, and map it into ITM-B's own error type so
    // `trustEventHandler.ts` classifies it non-retryable rather than
    // falling through to the generic retryable default (a genuinely
    // corrupt identity record cannot be fixed by retrying).
    if (error instanceof IdentityDomainError && error.category === "VALIDATION_FAILED") {
      throw malformedCustomerIdentityForTrustEvidenceError(customerIdentityId);
    }
    // Any other category (e.g. a transient `TEMPORARY_UNAVAILABLE`/
    // `INTEGRATION_FAILED` from the identity repository) is left to
    // propagate unmapped, so the outbox handler's existing retryable
    // default applies unchanged.
    throw error;
  }
}

/**
 * Idempotently ingests one governed authentication trust signal into the
 * ITM trust record. Safe to call more than once with the same event
 * (`applied: false` on a duplicate) and safe to call out of order across
 * the two governed event categories (§7.1).
 */
export async function ingestAuthenticationSignal(
  db: Firestore,
  event: DomainEvent<unknown>,
): Promise<IngestTrustEvidenceOutcome> {
  const category = resolveCategory(event);
  const customerIdentityId = resolveCustomerIdentityId(event);
  const occurredAt = resolveOccurredAt(event);

  const existingRecord = await getTrustRecordByCustomerIdentityId(db, customerIdentityId);
  if (!existingRecord) {
    await assertCustomerIdentityExists(db, event, customerIdentityId);
  }

  return ingestTrustEvidence(db, {
    customerIdentityId,
    category,
    eventId: event.eventId,
    correlationId: event.correlationId,
    occurredAt,
    actorId: null,
  });
}
