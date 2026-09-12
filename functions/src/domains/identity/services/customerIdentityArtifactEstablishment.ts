/**
 * Customer Identity artifact establishment (`PLATFORM-BASELINE-002`,
 * `FD-CUST-ID-ART-001`).
 *
 * Server-authoritative, idempotent orchestration ensuring every canonical
 * `active` Customer Identity has exactly one Loyalty Number and exactly one
 * current QR Identity bound to that Customer Identity/Loyalty Number
 * relationship. Operates on the stable `CustomerIdentityId` only — never a
 * Firebase UID, provider subject, or raw token subject (`DEC-AUTH-002`).
 *
 * Strategy — validate first, repair only what is missing, fail closed on
 * contradiction:
 *
 *   1. Read the identity; not-found and malformed records fail closed via
 *      the existing `getCustomerIdentityById` contract, and any non-`active`
 *      status fails closed (`identityNotActiveError`).
 *   2. List every `loyaltyNumbers` record for the identity (authoritative
 *      for existence/count; the `customerProfiles` projection is only ever
 *      consulted for agreement, never as the source of truth). Zero →
 *      create exactly one via the existing `issueLoyaltyNumberForIdentity`
 *      (transactional, outbox-emitting, idempotent). One → reuse after
 *      format/binding/projection-agreement validation. More than one, a
 *      malformed/incompatible value, or a disagreeing projection → fail
 *      closed, no mutation.
 *   3. List every `qrIdentityRecords` record for the identity. Any record
 *      bound to a different Loyalty Number, more than one `active` record,
 *      or a projection pointer resolving to anything but the validated
 *      current record → fail closed (never silently rewrite a binding, never
 *      change the Loyalty Number). No `active` record and no contradictory
 *      pointer → create exactly one via the existing
 *      `issueQrIdentityForIdentity`. One valid current record → reuse.
 *
 * Retry safety: the two issue steps use deterministic per-identity
 * idempotency keys with a stable request hash, so every trigger
 * (registration, sign-in re-entry, recovery, explicit repair) converges on
 * the same logical operation. A bounded retry (3 attempts) around the whole
 * establish pass absorbs a genuinely-concurrent loser's
 * `IDEMPOTENCY_CONFLICT` — the retry revalidates first, so it can only
 * observe the winner's committed state, never duplicate it.
 *
 * Reads performed here never create or repair anything; creation happens
 * only inside the two existing issuing repository functions, and only when
 * the preceding validation proved something is actually missing. This
 * function itself holds no idempotency key — it is stateless convergence.
 *
 * No Business, membership, Reward Program, Branch, Purchase, or Terms
 * dependency; no PostgreSQL; no new events beyond the creation events the
 * issuing repositories already emit.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { EventActor } from "../../../shared/events/domainEvent";
import type { CustomerIdentityId } from "../models/customerIdentityId";
import { identityNotActiveError } from "../models/identityErrors";
import { getCustomerIdentityById } from "../repositories/customerIdentityRepository";
import { createLoyaltyNumber, type LoyaltyNumber } from "../../loyaltyNumber/models/loyaltyNumber";
import {
  conflictingLoyaltyNumberAssignmentError,
  multipleLoyaltyNumberAssignmentsError,
} from "../../loyaltyNumber/models/loyaltyNumberErrors";
import {
  getLoyaltyNumberAssignmentForIdentity,
  issueLoyaltyNumberForIdentity,
  listLoyaltyNumberAssignmentsForIdentity,
} from "../../loyaltyNumber/repositories/loyaltyNumberRepository";
import type { LoyaltyNumberCandidateGenerator } from "../../loyaltyNumber/services/loyaltyNumberGenerator";
import { RandomLoyaltyNumberCandidateGenerator } from "../../loyaltyNumber/services/randomLoyaltyNumberCandidateGenerator";
import type { QrReference } from "../../qrIdentity/models/qrReference";
import {
  conflictingQrIdentityAssociationError,
  duplicateActiveQrIdentityError,
} from "../../qrIdentity/models/qrIdentityErrors";
import {
  getActiveQrIdentityByCustomerIdentityId,
  issueQrIdentityForIdentity,
  listQrIdentityRecordsForIdentity,
} from "../../qrIdentity/repositories/qrIdentityRepository";
import type { QrReferenceGenerator } from "../../qrIdentity/services/qrReferenceGenerator";
import { RandomQrReferenceGenerator } from "../../qrIdentity/services/randomQrReferenceGenerator";

/** Deterministic per-identity issue keys — every trigger converges on one logical operation. */
function loyaltyNumberEnsureKey(customerIdentityId: string): string {
  return `customer-identity-artifacts:ensure:loyalty-number:${customerIdentityId}`;
}

function qrIdentityEnsureKey(customerIdentityId: string): string {
  return `customer-identity-artifacts:ensure:qr-identity:${customerIdentityId}`;
}

function ensureRequestHash(customerIdentityId: string): string {
  return `customer-identity-artifacts:ensure:${customerIdentityId}`;
}

/** Bounded convergence retry for a genuinely-concurrent loser's conflict. */
const MAX_ESTABLISH_ATTEMPTS = 3;

function isIdempotencyConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { category?: unknown }).category === "IDEMPOTENCY_CONFLICT"
  );
}

export type EnsureCustomerIdentityArtifactsParams = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
  /** Stable 11thONUS identity — never a Firebase UID or provider subject. */
  customerIdentityId: string;
  /** Instant recorded as `assignedAt`/`issuedAt` on any artifact this run creates. */
  now: Date;
  /** Attribution for any artifact this run creates (registration uses the identity id). */
  createdBy: string | null;
  /** Injectable for deterministic tests; defaults to the CSPRNG production generators. */
  loyaltyNumberGenerator?: LoyaltyNumberCandidateGenerator;
  qrReferenceGenerator?: QrReferenceGenerator;
};

/**
 * Minimal server-owned result contract — the settled identifiers downstream
 * services need, nothing more. `loyaltyNumber` and `qrReference` ARE the
 * record ids (doc-ID-as-value pattern), so no separate id fields exist.
 */
export type CustomerIdentityArtifactEstablishment = {
  customerIdentityId: CustomerIdentityId;
  loyaltyNumber: LoyaltyNumber;
  qrReference: QrReference;
  status: "established";
};

export async function ensureCustomerIdentityArtifacts(
  db: Firestore,
  params: EnsureCustomerIdentityArtifactsParams,
): Promise<CustomerIdentityArtifactEstablishment> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ESTABLISH_ATTEMPTS; attempt++) {
    try {
      return await establishOnce(db, params);
    } catch (error) {
      if (!isIdempotencyConflict(error) || attempt === MAX_ESTABLISH_ATTEMPTS) {
        throw error;
      }
      lastError = error;
    }
  }
  throw lastError;
}

async function establishOnce(
  db: Firestore,
  params: EnsureCustomerIdentityArtifactsParams,
): Promise<CustomerIdentityArtifactEstablishment> {
  const identity = await getCustomerIdentityById(db, params.customerIdentityId);
  if (identity.status !== "active") {
    throw identityNotActiveError(identity.id, identity.status);
  }

  const loyaltyNumber = await ensureLoyaltyNumber(db, params, identity.id);
  const qrReference = await ensureCurrentQrIdentity(db, params, identity.id, loyaltyNumber);

  return {
    customerIdentityId: identity.id,
    loyaltyNumber,
    qrReference,
    status: "established",
  };
}

/**
 * Exactly-one Loyalty Number invariant. Returns the valid value, creating
 * it only when none exists. Every contradiction fails closed before any
 * write in this step.
 */
async function ensureLoyaltyNumber(
  db: Firestore,
  params: EnsureCustomerIdentityArtifactsParams,
  customerIdentityId: CustomerIdentityId,
): Promise<LoyaltyNumber> {
  const existing = await listLoyaltyNumberAssignmentsForIdentity(db, customerIdentityId);

  if (existing.length > 1) {
    throw multipleLoyaltyNumberAssignmentsError(customerIdentityId, existing.length);
  }

  if (existing.length === 1) {
    const candidate = existing[0];
    // A stored value outside the governed format is incompatible state, not
    // something to reuse or silently replace.
    createLoyaltyNumber(candidate.loyaltyNumber);
    // The projection pointer, when present, must agree with the
    // authoritative record — a pointer elsewhere is a contradictory binding.
    const viaProjection = await getLoyaltyNumberAssignmentForIdentity(db, customerIdentityId);
    if (
      viaProjection &&
      (viaProjection.loyaltyNumber !== candidate.loyaltyNumber ||
        viaProjection.customerIdentityId !== customerIdentityId)
    ) {
      throw conflictingLoyaltyNumberAssignmentError(customerIdentityId);
    }
    return candidate.loyaltyNumber;
  }

  const issued = await issueLoyaltyNumberForIdentity(db, {
    eventId: `${params.eventId}:loyalty-number`,
    correlationId: params.correlationId,
    actor: params.actor,
    occurredAt: params.occurredAt,
    customerIdentityId,
    assignedAt: params.now,
    createdBy: params.createdBy,
    generator: params.loyaltyNumberGenerator ?? new RandomLoyaltyNumberCandidateGenerator(),
    idempotencyKey: loyaltyNumberEnsureKey(customerIdentityId),
    requestHash: ensureRequestHash(customerIdentityId),
  });
  return issued.loyaltyNumber;
}

/**
 * Exactly-one-current-QR invariant for the ensured Loyalty Number. Returns
 * the current reference, creating it only when no valid current record
 * exists. Never rewrites a binding and never changes the Loyalty Number.
 */
async function ensureCurrentQrIdentity(
  db: Firestore,
  params: EnsureCustomerIdentityArtifactsParams,
  customerIdentityId: CustomerIdentityId,
  loyaltyNumber: LoyaltyNumber,
): Promise<QrReference> {
  const records = await listQrIdentityRecordsForIdentity(db, customerIdentityId);

  for (const record of records) {
    if (record.loyaltyNumber !== loyaltyNumber) {
      throw conflictingQrIdentityAssociationError(customerIdentityId);
    }
  }

  const activeRecords = records.filter((record) => record.status === "active");
  if (activeRecords.length > 1) {
    throw duplicateActiveQrIdentityError(customerIdentityId);
  }

  const pointer = await getActiveQrIdentityByCustomerIdentityId(db, customerIdentityId);

  if (activeRecords.length === 1) {
    const candidate = activeRecords[0];
    // A pointer resolving to anything but the validated current record is a
    // contradictory binding — governed writes never leave it disagreeing.
    if (pointer && pointer.qrReference !== candidate.qrReference) {
      throw conflictingQrIdentityAssociationError(customerIdentityId);
    }
    return candidate.qrReference;
  }

  // No current record. A pointer that still resolves to an existing record
  // is a contradictory binding (governed writes never point at a
  // non-current record); only an absent or dangling pointer may be replaced
  // by fresh establishment.
  if (pointer) {
    throw conflictingQrIdentityAssociationError(customerIdentityId);
  }

  const issued = await issueQrIdentityForIdentity(db, {
    eventId: `${params.eventId}:qr-identity`,
    correlationId: params.correlationId,
    actor: params.actor,
    occurredAt: params.occurredAt,
    customerIdentityId,
    loyaltyNumber,
    issuedAt: params.now,
    createdBy: params.createdBy,
    generator: params.qrReferenceGenerator ?? new RandomQrReferenceGenerator(),
    idempotencyKey: qrIdentityEnsureKey(customerIdentityId),
    requestHash: ensureRequestHash(customerIdentityId),
  });
  return issued.qrReference;
}
