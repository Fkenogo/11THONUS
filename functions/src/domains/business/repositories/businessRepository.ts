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

import type { Firestore, Transaction } from "firebase-admin/firestore";
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
import type { Business } from "../models/business";
import type { BusinessBranch } from "../models/businessBranch";
import { fromBusinessDocument, toBusinessDocumentFields } from "../models/businessDocument";
import {
  fromBusinessBranchDocument,
  toBusinessBranchDocumentFields,
} from "../models/businessBranchDocument";
import { reserveBusinessCode } from "../services/businessCodeReservationService";
import { RandomBusinessCodeCandidateGenerator } from "../services/randomBusinessCodeCandidateGenerator";
import type { BusinessCodeCandidateGenerator } from "../services/businessCodeGenerator";
import type { BusinessCodeUniquenessPort } from "../services/businessCodeUniquenessPort";
import type { TransactionWriter } from "../../permissions/service/authorizeAndExecute";
import { validateBusinessClassificationReferences } from "../services/businessClassificationValidation";

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

      // `ENG-P3-001C` Phase G/O: authoritative Commerce Knowledge reads,
      // still read-only, still before any write in this transaction — so a
      // rejection here leaves no partial Business state, and the read
      // participates in the same atomic boundary as the writes below (no
      // evaluate-then-write TOCTOU gap: both commit or both abort together).
      await validateBusinessClassificationReferences(transaction, db, {
        primaryCategoryId: request.primaryCategoryId,
        businessTypeId: request.businessTypeId,
      });

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

/**
 * `ENG-P2-002C` read helper — used from a protected command's
 * `authorizeAndExecute` `mutation.prepare` phase, which is given the full
 * `Transaction` (read-capable). Returns `null` for a missing or
 * structurally malformed document — the command layer maps that to
 * `businessNotFoundError` (`RESOURCE_NOT_FOUND`), never a raw Firestore
 * "not found" leak.
 */
export async function readBusinessById(
  transaction: Transaction,
  db: Firestore,
  businessId: string,
): Promise<Business | null> {
  const snapshot = await transaction.get(db.collection(BUSINESSES_COLLECTION).doc(businessId));
  if (!snapshot.exists) return null;
  return fromBusinessDocument(businessId, snapshot.data());
}

/**
 * `ENG-P2-002C` read helper with tenant isolation built in (Phase N): a
 * branch that exists but whose own `businessId` does not match the
 * authorized `businessId` context returns `null` — structurally identical
 * to "does not exist," so a caller can never distinguish "wrong business"
 * from "no such branch" (enumeration resistance), and can never escape the
 * authorized Business context by supplying another business's branch id.
 */
export async function readBusinessBranchForBusiness(
  transaction: Transaction,
  db: Firestore,
  businessId: string,
  branchId: string,
): Promise<BusinessBranch | null> {
  const snapshot = await transaction.get(db.collection(BRANCHES_COLLECTION).doc(branchId));
  if (!snapshot.exists) return null;
  const branch = fromBusinessBranchDocument(branchId, snapshot.data());
  if (!branch || branch.businessId !== businessId) return null;
  return branch;
}

/**
 * `ENG-P3-002A` read transport addendum (§9, §40): lists every Business
 * owned by `ownerUserId`, sourced from `Business.ownerUserId` directly —
 * the field already set, once, at bootstrap (`bootstrapBusiness` above)
 * and never mutated by any existing command (no ownership-transfer
 * command exists in this codebase). This is deliberately **not** a second
 * ownership model: it is the same `ownerUserId` field
 * `evaluatePermission.ts`'s membership-derived `role: "owner"` is itself
 * always consistent with at MVP (bootstrap sets both the Business's
 * `ownerUserId` and the initial membership's `role: "owner"` atomically,
 * in the same transaction, and nothing since diverges them). A single
 * equality-filter query — automatically indexed, no composite index
 * required (mirrors `getBusinessMembershipByUserAndBusiness`'s own
 * "equality-only queries need no manual index" precedent).
 *
 * ENG-P3-002A independent review correction, Phase M: the original
 * implementation silently dropped any document that failed to parse,
 * citing listKnowledgeNodeChildren's precedent -- that precedent does not
 * transfer here. listKnowledgeNodeChildren backs a customer-facing
 * selection list, where hiding one corrupt taxonomy option is genuinely
 * fail-safe (the customer just does not see that option; no caller draws
 * an "eligibility"-shaped conclusion from its absence). This function
 * backs getOwnedBusinesses -- an authority/hydration query the onboarding
 * frontend uses to decide "does this owner already have a Business."
 * Silently omitting a malformed-but-real owned Business would make it
 * invisible to that decision, and the frontend would incorrectly conclude
 * the owner has none, offering "create a new Business" to an owner who
 * already has one (corrupted, not absent). That is not a safe silent
 * omission -- it actively produces an unsafe conclusion. This function now
 * fails the whole read closed if any of the caller's own ownerUserId
 * documents fails to parse, surfacing the corruption rather than hiding
 * it -- matching the reasoning ENG-P3-001B's independent review already
 * established for distinguishing "silent omission is fine" from "silent
 * omission hides integrity-relevant state."
 */
export async function listBusinessesByOwner(
  db: Firestore,
  ownerUserId: string,
): Promise<Business[]> {
  const snapshot = await db
    .collection(BUSINESSES_COLLECTION)
    .where("ownerUserId", "==", ownerUserId)
    .get();
  const businesses: Business[] = [];
  for (const doc of snapshot.docs) {
    const business = fromBusinessDocument(doc.id, doc.data());
    if (!business) {
      throw new BusinessDomainError(
        "VALIDATION_FAILED",
        `Business document "${doc.id}" owned by "${ownerUserId}" is malformed -- cannot safely determine this owner's existing Business set.`,
      );
    }
    businesses.push(business);
  }
  return businesses;
}

/**
 * `ENG-P3-002A` addendum (§9, §37.7), corrected by the `ENG-P3-002A`
 * independent review (Phase K/L — priority integrity finding).
 *
 * **The invariant, read directly from the actual bootstrap code
 * (`bootstrapBusiness` above):** `businesses/{id}` + `businessBranches/{id}`
 * (+ the initial Owner membership + the code reservation) are all written
 * inside exactly one Firestore transaction. There is no persisted
 * intermediate state where a Business exists with zero Branch documents —
 * a `draft` Business has exactly one Branch document the instant it
 * exists, and nothing in this codebase ever deletes a Branch. Therefore a
 * persisted Business with **zero** Branch documents is not a normal,
 * resumable "Branch profile not yet completed" onboarding state — it can
 * only mean structural corruption (a bug, a manual data mutation, a
 * partial/failed migration). The legitimate "Branch profile incomplete"
 * state is a Branch document that *exists*, with blank/default optional
 * fields (`address`, etc.) — a different, non-corrupted case this function
 * must not conflate with "no Branch document at all."
 *
 * **The original implementation's defect:** it returned `null` for zero
 * Branch documents — structurally identical to "not yet built," which
 * `getBusinessContext`/the frontend's resume logic could only read as
 * "Branch profile not yet completed," silently masking real structural
 * corruption as a normal mid-onboarding state.
 *
 * **The correction:** zero Branch documents now fails closed identically
 * to the existing multi-Branch case (both are violations of the same
 * governed single-Branch invariant, `ENG-P2-002-DESIGN-001` FD-1) — this
 * function now always returns an actual `BusinessBranch` on success, never
 * `null`, for a Business that exists at all. A malformed Branch document
 * (fails `fromBusinessBranchDocument` parsing, or belongs to a different
 * `businessId`) fails closed the same way.
 */
export async function readDefaultBranchForBusiness(
  db: Firestore,
  businessId: string,
): Promise<BusinessBranch> {
  const snapshot = await db
    .collection(BRANCHES_COLLECTION)
    .where("businessId", "==", businessId)
    .limit(2)
    .get();
  if (snapshot.empty) {
    throw new BusinessDomainError(
      "VALIDATION_FAILED",
      `Business "${businessId}" has no Branch document — the single-branch bootstrap invariant is violated (structural corruption, not an incomplete-profile state).`,
    );
  }
  if (snapshot.size > 1) {
    throw new BusinessDomainError(
      "VALIDATION_FAILED",
      `Business "${businessId}" has more than one Branch document — the single-branch MVP invariant is violated.`,
    );
  }
  const doc = snapshot.docs[0]!;
  const branch = fromBusinessBranchDocument(doc.id, doc.data());
  if (!branch || branch.businessId !== businessId) {
    throw new BusinessDomainError(
      "VALIDATION_FAILED",
      `Business "${businessId}"'s Branch document is malformed or does not belong to this Business.`,
    );
  }
  return branch;
}

/**
 * `ENG-P2-002C` write helper — the `mutation.apply` phase only has a
 * write-only `TransactionWriter` (`authorizeAndExecute.ts`'s own
 * TOCTOU-safety boundary: no `.get` available after the audit write has
 * started), so this takes that narrower type rather than a full `Transaction`.
 */
export function writeBusinessUpdate(
  writer: TransactionWriter,
  db: Firestore,
  business: Business,
): void {
  writer.set(
    db.collection(BUSINESSES_COLLECTION).doc(business.id),
    stripUndefined(toBusinessDocumentFields(business)),
  );
}

export function writeBusinessBranchUpdate(
  writer: TransactionWriter,
  db: Firestore,
  branch: BusinessBranch,
): void {
  writer.set(
    db.collection(BRANCHES_COLLECTION).doc(branch.id),
    stripUndefined(toBusinessBranchDocumentFields(branch)),
  );
}
