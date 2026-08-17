/**
 * Business bootstrap persistence (`ENG-P2-002B`, Phases H/I/M/O/P).
 *
 * The atomic bootstrap consistency boundary (§13.1, Phase I): `businesses/{id}`
 * + `businessBranches/{id}` + `businessMemberships/{id}` (initial Owner) +
 * `businessCodeReservations/{code}` + a `BusinessCreated` outbox entry commit
 * inside exactly one Firestore transaction — no persistent intermediate state
 * where only some of these exist.
 *
 * `businessCode` uniqueness (Phase G/H) mirrors
 * `functions/src/domains/loyaltyNumber/repositories/loyaltyNumberRepository.ts`'s
 * own precedent exactly: the reservation document's id *is* the code value
 * (`businessCodeReservations/{businessCode}`), so `transaction.get()` on that
 * id atomically checks existence within the transaction — no separate index
 * collection concept beyond that one doc-per-code. `businesses/{id}` stays
 * keyed by an opaque Firestore id (unlike Loyalty Number, a Business has
 * other lookups a businessCode-as-primary-key would complicate), so a
 * dedicated reservation doc — not a second identifier subsystem — carries
 * the uniqueness guarantee.
 *
 * Idempotency (Phase M) reuses the existing shared service unchanged. The
 * request hash binds the *resolved* `ownerUserId`, not just the request
 * body, so a replayed idempotency key under a different resolved identity is
 * a fail-closed conflict rather than a silent cross-owner reuse — and,
 * conversely, one Customer Identity creating two *different* Businesses with
 * two different idempotency keys is never blocked (Phase N: TRD10 §10 permits
 * multi-business ownership; idempotency only prevents replay of the *same*
 * request, never legitimate repeat creation under a fresh key).
 *
 * Transaction read/write ordering (Phase P): every read (the businessCode
 * candidate-collision loop) completes before any write is issued — required
 * by real Firestore transaction semantics, not just the mock. Firebase
 * document ids for the new Business/Branch/Membership are allocated before
 * the transaction opens (`.doc()` without an argument only mints an id
 * client-side, it performs no I/O), so no read against them is needed.
 */

import type { Firestore } from "firebase-admin/firestore";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKey,
  failIdempotencyKey,
} from "../../../shared/idempotency/idempotencyService";
import { writeOutboxEntry } from "../../../shared/outbox/outboxWriter";
import type { EventActor } from "../../../shared/events/domainEvent";
import { buildBusinessCreatedEvent } from "../events/businessEvents";
import { BusinessDomainError } from "../models/businessErrors";
import {
  buildBootstrapBusinessInput,
  toCreateBusinessResult,
  type CreateBusinessRequest,
  type CreateBusinessResult,
} from "../models/businessBootstrap";
import { toBusinessDocumentFields } from "../models/businessDocument";
import { toBusinessBranchDocumentFields } from "../models/businessBranchDocument";
import { reserveBusinessCode } from "../services/businessCodeReservationService";
import { RandomBusinessCodeCandidateGenerator } from "../services/randomBusinessCodeCandidateGenerator";
import type { BusinessCodeCandidateGenerator } from "../services/businessCodeGenerator";
import type { BusinessCodeUniquenessPort } from "../services/businessCodeUniquenessPort";

const BUSINESSES_COLLECTION = "businesses";
const BRANCHES_COLLECTION = "businessBranches";
const MEMBERSHIPS_COLLECTION = "businessMemberships";
const BUSINESS_CODE_RESERVATIONS_COLLECTION = "businessCodeReservations";
const OPERATION_TYPE = "business.create";

export type BootstrapBusinessParams = {
  /** Server-derived Customer Identity id — never client-supplied (Phase D/F). */
  ownerUserId: string;
  idempotencyKey: string;
  actor: EventActor;
  correlationId: string;
  now: Date;
  newId: () => string;
  /** Injection seam for deterministic collision testing (Phase S). */
  generator?: BusinessCodeCandidateGenerator;
};

/**
 * Deterministic hash over every client-controlled field plus the
 * server-resolved `ownerUserId` — same key + same request replays; same key
 * + a materially different request (including a different resolved owner)
 * is a fail-closed `IDEMPOTENCY_CONFLICT` (Phase M).
 */
function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(value) as Array<keyof T>) {
    if (value[key] !== undefined) {
      result[key] = value[key];
    }
  }
  return result;
}

function stableRequestHash(ownerUserId: string, request: CreateBusinessRequest): string {
  const sortedEntries = Object.keys(request)
    .sort()
    .map((key) => [key, (request as Record<string, unknown>)[key]] as const);
  return `${OPERATION_TYPE}:${ownerUserId}:${JSON.stringify(sortedEntries)}`;
}

export async function bootstrapBusiness(
  db: Firestore,
  request: CreateBusinessRequest,
  params: BootstrapBusinessParams,
): Promise<CreateBusinessResult> {
  const requestHash = stableRequestHash(params.ownerUserId, request);

  const reservation = await checkAndReserveIdempotencyKey(db, {
    idempotencyKey: params.idempotencyKey,
    operationType: OPERATION_TYPE,
    actorId: params.ownerUserId,
    requestHash,
    correlationId: params.correlationId,
  });

  if (reservation.outcome === "duplicate") {
    return reservation.record.responseSnapshot as CreateBusinessResult;
  }
  if (reservation.outcome === "in_progress") {
    throw new BusinessDomainError(
      "IDEMPOTENCY_CONFLICT",
      `Business creation for idempotency key "${params.idempotencyKey}" is already in progress.`,
    );
  }
  if (reservation.outcome === "conflict") {
    throw new BusinessDomainError(
      reservation.error.code,
      reservation.error.messageKey,
      reservation.error.fieldErrors,
    );
  }

  const generator = params.generator ?? new RandomBusinessCodeCandidateGenerator();
  // Allocated client-side only (no I/O) — safe to mint before the transaction opens.
  const businessId = db.collection(BUSINESSES_COLLECTION).doc().id;
  const branchId = db.collection(BRANCHES_COLLECTION).doc().id;
  const membershipId = db.collection(MEMBERSHIPS_COLLECTION).doc().id;

  try {
    const result = await db.runTransaction(async (transaction) => {
      const uniquenessPort: BusinessCodeUniquenessPort = {
        isAlreadyReserved: async (candidate: string) => {
          const ref = db.collection(BUSINESS_CODE_RESERVATIONS_COLLECTION).doc(candidate);
          const snapshot = await transaction.get(ref);
          return snapshot.exists;
        },
      };

      // Reads only, up to MAX_BUSINESS_CODE_GENERATION_ATTEMPTS — no write is
      // issued in this transaction until a free candidate is found.
      const { businessCode } = await reserveBusinessCode({ generator, uniquenessPort });

      const input = buildBootstrapBusinessInput(request, {
        ownerUserId: params.ownerUserId,
        businessId,
        branchId,
        businessCode,
        now: params.now,
      });

      const businessRef = db.collection(BUSINESSES_COLLECTION).doc(businessId);
      const branchRef = db.collection(BRANCHES_COLLECTION).doc(branchId);
      const membershipRef = db.collection(MEMBERSHIPS_COLLECTION).doc(membershipId);
      const reservationRef = db.collection(BUSINESS_CODE_RESERVATIONS_COLLECTION).doc(businessCode);

      // Writes only from here — every read above has already resolved.
      // `toBusinessDocumentFields`/`toBusinessBranchDocumentFields` legitimately
      // return `undefined` for absent optional fields (the domain layer stays
      // framework-independent, ENG-P2-002A) — the Admin SDK rejects `undefined`
      // document values outright, so this persistence layer strips them before
      // writing rather than persisting a spurious explicit `null`.
      transaction.set(businessRef, stripUndefined(toBusinessDocumentFields(input.business)));
      transaction.set(branchRef, stripUndefined(toBusinessBranchDocumentFields(input.branch)));
      // The frozen ENG-P2-004D `businessMembership` shape (TRD10 §10.6.4):
      // initial Owner membership, no overrides — Owner authority is the
      // structural floor invariant, never an explicit permission grant.
      transaction.set(membershipRef, {
        userId: params.ownerUserId,
        businessId,
        role: "owner" as const,
        status: "active" as const,
        permissions: [] as const,
        createdAt: params.now,
        updatedAt: params.now,
      });
      transaction.set(reservationRef, { businessId, reservedAt: params.now });

      const event = buildBusinessCreatedEvent({
        eventId: params.newId(),
        correlationId: params.correlationId,
        actor: params.actor,
        occurredAt: params.now.toISOString(),
        businessId,
        ownerUserId: params.ownerUserId,
        branchId,
        businessCode,
      });
      writeOutboxEntry(transaction, db, event);

      return toCreateBusinessResult(input);
    });

    await completeIdempotencyKey(db, params.idempotencyKey, result.businessId, result);
    return result;
  } catch (error) {
    await failIdempotencyKey(db, params.idempotencyKey);
    throw error;
  }
}
