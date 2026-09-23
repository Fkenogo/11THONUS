/**
 * `recordPurchase` command (`PLATFORM-BASELINE-006A`, design §12).
 *
 * The approved 19-step ordered contract:
 *  1. authenticate (callable resolves `userId`; never trusted from input);
 *  2. resolve Business actor/membership from Firestore (evaluator);
 *  3. parse exactly one presented Customer artifact (callable parses;
 *     re-validated here);
 *  4. resolve the Customer artifact in Firestore (provisional — acceptance
 *     is decided in-transaction at step 10);
 *  5. validate live Firestore-owned authorities (Business, membership,
 *     current-QR-if-QR-path, Branch);
 *  6. BEGIN PostgreSQL transaction;
 *  7. lock Reward Program; 8. lock current Reward Program Version;
 *  8.5 prove the supplied Business-owned Qualifying Item is on the LOCKED
 *     version's frozen qualification set and derive the display snapshot
 *     (`PLATFORM-BASELINE-013C`; never Commerce Knowledge, never a
 *     client-supplied name);
 *  9. prove program∈Business, program active, version is current/active,
 *     and read the locked `sharedLoyaltyNumberAllowed` /
 *     `multipleUnitsAllowed`;
 *  10. shared-gate on the LOCKED version (LN + `shared=false` ⇒ reject);
 *  11. quantity against LOCKED version rules (`>= 1`;
 *      `multipleUnitsAllowed=false` ⇒ exactly 1);
 *  12. reserve idempotency key (`purchase.create`);
 *  13. insert Purchase snapshot (`waiting_for_customer`);
 *  14. lifecycle event; 15. Trust Event (`purchase.recorded`);
 *  16. Notification Intent (recorded → Customer);
 *  17. outbox (`purchase_recorded`); 18. complete idempotency; 19. COMMIT.
 *
 * Quantity-note (design §12 vs 005A schema): the design's "optional
 * Maximum Units per Purchase Record" has no governed schema home — the
 * 005A `reward_program_versions` table carries no maximum column, and
 * `bulk_review_threshold` is review-visibility-only per DEC-LOY-003 (never
 * a hard cap). No cap is invented here; quantity is governed by
 * `quantity >= 1` (DB CHECK) and the locked `multipleUnitsAllowed` rule.
 * See the 006A implementation report.
 */

import type { Firestore } from "firebase-admin/firestore";
import { randomUUID } from "node:crypto";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import { withPlatformTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKeyInTransaction,
  peekIdempotencyKey,
} from "../../rewardProgram/repositories/idempotencyRepository";
import {
  lookupCustomerIdentityByLoyaltyNumber,
  lookupCustomerIdentityByQrReference,
} from "../../identity/repositories/identityLookupRepository";
import { getLoyaltyNumberAssignmentForIdentity } from "../../loyaltyNumber/repositories/loyaltyNumberRepository";
import { createLoyaltyNumber } from "../../loyaltyNumber/models/loyaltyNumber";
import { createQrReference } from "../../qrIdentity/models/qrReference";
import { readDefaultBranchForBusiness } from "../../business/repositories/businessRepository";
import { isWellFormedQualifyingItemId } from "../../qualifyingItem/models/qualifyingItem";
import { authorizePurchaseRecord } from "./purchaseAuthorization";
import { purchaseRequestHash } from "./purchaseRequestHash";
import {
  insertPurchaseRecord,
  appendPurchaseRecordEvent,
} from "../repositories/purchaseRecordRepository";
import {
  lockRewardProgramById,
  lockRewardProgramVersionById,
  readLockedVersionQualifyingItem,
} from "../repositories/purchaseProgramScopeRepository";
import { insertTrustEvent } from "../repositories/trustEventRepository";
import { insertNotificationIntent } from "../repositories/purchaseOutboxRepository";
import { writePurchaseOutboxEntry } from "../repositories/purchaseOutboxRepository";
import type { PresentedArtifactType, PurchaseRecordRow, RecorderRole } from "../models/purchase";
import {
  purchaseArtifactError,
  purchaseIdempotencyConflictError,
  purchaseIdempotencyInProgressError,
  purchaseProgramError,
  purchaseQualifyingItemError,
  purchaseQuantityError,
  purchaseSharedPolicyError,
  purchaseValidationError,
} from "../models/purchaseErrors";

export type RecordPurchaseRequest = {
  readonly businessId: string;
  readonly rewardProgramId: string;
  readonly loyaltyNumberValue?: string | null;
  readonly qrReference?: string | null;
  readonly quantity: number;
  /**
   * Structural Business-owned item identity (`PLATFORM-BASELINE-013C`).
   * Required; resolved server-side against the LOCKED version's frozen
   * qualification set. The client never supplies a name, a Commerce
   * Knowledge id, or a Reward Program/version id.
   */
  readonly qualifyingItemId: string;
  readonly unitValueMinor?: number | null;
  readonly currency?: string | null;
  readonly purchaseDate: Date;
  readonly notes?: string | null;
};

export type RecordPurchaseResult = {
  readonly purchase: PurchaseRecordRow;
};

function parsePresentedArtifact(request: RecordPurchaseRequest): {
  readonly type: PresentedArtifactType;
  readonly reference: string;
} {
  const hasLn =
    typeof request.loyaltyNumberValue === "string" && request.loyaltyNumberValue.trim().length > 0;
  const hasQr = typeof request.qrReference === "string" && request.qrReference.trim().length > 0;
  if (hasLn === hasQr) {
    throw purchaseValidationError(
      "Exactly one Customer artifact is required: either a Loyalty Number or a QR Identity reference.",
    );
  }
  if (hasLn) {
    try {
      createLoyaltyNumber(request.loyaltyNumberValue as string);
    } catch {
      throw purchaseArtifactError("The presented Loyalty Number is not a valid artifact.");
    }
    return { type: "loyalty_number", reference: request.loyaltyNumberValue as string };
  }
  let qr: string;
  try {
    qr = createQrReference(request.qrReference as string);
  } catch {
    throw purchaseArtifactError("The presented QR Identity reference is not a valid artifact.");
  }
  return { type: "qr_identity", reference: qr };
}

export async function recordPurchase(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: {
    readonly userId: string;
    readonly request: RecordPurchaseRequest;
    readonly idempotencyKey: string;
    readonly correlationId: string;
  },
): Promise<RecordPurchaseResult> {
  const request = params.request;

  if (!Number.isInteger(request.quantity) || request.quantity < 1) {
    throw purchaseQuantityError("Quantity must be an integer of at least 1.");
  }
  if (
    typeof request.qualifyingItemId !== "string" ||
    request.qualifyingItemId.trim().length === 0
  ) {
    throw purchaseValidationError("A qualifying item is required.");
  }
  if (!(request.purchaseDate instanceof Date) || Number.isNaN(request.purchaseDate.getTime())) {
    throw purchaseValidationError("A valid purchase date is required.");
  }
  if (request.purchaseDate.getTime() > Date.now()) {
    throw purchaseValidationError("The purchase date cannot be in the future.");
  }
  if ((request.unitValueMinor == null) !== (request.currency == null)) {
    throw purchaseValidationError("Unit value and currency must be provided together, or neither.");
  }
  if (
    request.unitValueMinor != null &&
    (!Number.isInteger(request.unitValueMinor) || request.unitValueMinor < 0)
  ) {
    throw purchaseValidationError("Unit value must be a non-negative integer of minor units.");
  }
  if (request.currency != null && request.currency.trim().length === 0) {
    throw purchaseValidationError("Currency must not be blank when a unit value is provided.");
  }

  // Step 2: Business actor/membership (Firestore) + resolved recorder role.
  const { role }: { readonly role: RecorderRole } = await authorizePurchaseRecord(
    db,
    params.userId,
    request.businessId,
  );

  // Step 3: exactly one presented artifact.
  const artifact = parsePresentedArtifact(request);

  // Peek short-circuit for genuine replays (005A publish-replay pattern):
  // the full request hash is computable before the expensive Firestore
  // reads, but the provisional artifact resolution below is read-only, so
  // the authoritative in-transaction reservation remains the correctness
  // guarantee — the peek only avoids redundant precondition work.
  const fingerprint = JSON.stringify({
    artifactType: artifact.type,
    artifactReference: artifact.reference,
    rewardProgramId: request.rewardProgramId,
    quantity: request.quantity,
    qualifyingItemId: request.qualifyingItemId,
    unitValueMinor: request.unitValueMinor ?? null,
    currency: request.currency ?? null,
    purchaseDate: request.purchaseDate.toISOString(),
    notes: request.notes ?? null,
  });
  const requestHash = purchaseRequestHash(
    "create",
    params.userId,
    request.businessId,
    request.rewardProgramId,
    fingerprint,
  );
  const peek = await peekIdempotencyKey(pool, params.idempotencyKey, requestHash);
  if (peek.outcome === "duplicate") {
    return peek.responseSnapshot as RecordPurchaseResult;
  }

  // Step 4: provisional Customer artifact resolution (Firestore).
  const lookupEnvelope = {
    eventId: randomUUID(),
    correlationId: params.correlationId,
    actor: { actorType: "user" as const, actorId: params.userId, role },
    occurredAt: new Date().toISOString(),
  };
  const lookup =
    artifact.type === "loyalty_number"
      ? await lookupCustomerIdentityByLoyaltyNumber(db, {
          ...lookupEnvelope,
          loyaltyNumber: artifact.reference,
          purpose: "merchant_transaction",
        })
      : await lookupCustomerIdentityByQrReference(db, {
          ...lookupEnvelope,
          qrReference: artifact.reference,
          purpose: "merchant_transaction",
        });
  const customerIdentityId = lookup.customerIdentityId;

  // Step 5a: canonical Loyalty Number snapshot (server-derived, total over
  // resolved identities per DEC-CUST-ID-ART-001 — absent is fail-closed).
  const assignment = await getLoyaltyNumberAssignmentForIdentity(db, customerIdentityId);
  if (!assignment) {
    throw purchaseArtifactError("The resolved Customer has no Loyalty Number artifact.");
  }
  const canonicalLoyaltyNumberValue = assignment.loyaltyNumber as string;

  // Step 5b: default Branch (informational metadata) — authoritative
  // Firestore read before the PG txn. Commerce Knowledge is no longer
  // consulted on this path: a purchase's item identity is the Business-owned
  // `qualifyingItemId`, proven in-transaction against the locked version's
  // frozen set. Any optional Commerce Knowledge classification belongs to
  // the live item and is never a purchase qualification requirement.
  const branch = await readDefaultBranchForBusiness(db, request.businessId);

  return withPlatformTransaction(pool, async (tx) => {
    // Steps 7–8: lock Program + current Version.
    const program = await lockRewardProgramById(tx, request.rewardProgramId);
    if (!program || program.businessId !== request.businessId) {
      throw purchaseProgramError("The Reward Program does not belong to this Business.");
    }
    if (program.status !== "active") {
      throw purchaseProgramError("The Reward Program is not active.");
    }
    if (!program.currentVersionId) {
      throw purchaseProgramError("The Reward Program has no published version.");
    }
    const version = await lockRewardProgramVersionById(tx, program.currentVersionId);
    if (!version || version.rewardProgramId !== program.id || version.status !== "active") {
      throw purchaseProgramError("The Reward Program has no active published version.");
    }

    // Step 8.5: prove the supplied Business Qualifying Item is on the LOCKED
    // version's frozen qualification set and derive the human-readable item
    // snapshot server-side (`PLATFORM-BASELINE-013C`). The locked version is
    // the same row just proven current+active, so a concurrent publish
    // cannot race this check (PB-012 §17A CF-2). Foreign-Business,
    // fabricated, non-qualifying, and malformed ids all reject identically
    // (no cross-Business existence disclosure). Retirement is deliberately
    // NOT consulted: it blocks new draft bindings, never a purchase against
    // an already-published version (PB-012 §7 Q6).
    if (!isWellFormedQualifyingItemId(request.qualifyingItemId)) {
      throw purchaseQualifyingItemError();
    }
    const boundItem = await readLockedVersionQualifyingItem(tx, {
      versionId: version.id,
      qualifyingItemId: request.qualifyingItemId,
    });
    if (!boundItem) {
      throw purchaseQualifyingItemError();
    }
    const itemLabel = boundItem.itemNameAtVersion;

    // Step 10: shared-gate on the LOCKED version (FD-PVL-005).
    if (artifact.type === "loyalty_number" && !version.sharedLoyaltyNumberAllowed) {
      throw purchaseSharedPolicyError();
    }

    // Step 11: quantity against LOCKED version rules.
    if (!version.multipleUnitsAllowed && request.quantity !== 1) {
      throw purchaseQuantityError(
        "This Reward Program allows exactly one unit per Purchase Record.",
      );
    }

    // Step 12: reserve idempotency.
    const reservation = await checkAndReserveIdempotencyKey(tx, {
      idempotencyKey: params.idempotencyKey,
      operationType: "purchase.create",
      actorId: params.userId,
      requestHash,
      correlationId: params.correlationId,
    });
    if (reservation.outcome === "duplicate") {
      return reservation.responseSnapshot as RecordPurchaseResult;
    }
    if (reservation.outcome === "in_progress") {
      throw purchaseIdempotencyInProgressError();
    }
    if (reservation.outcome === "conflict") {
      throw purchaseIdempotencyConflictError();
    }

    // Step 13: insert the Purchase snapshot.
    const purchase = await insertPurchaseRecord(tx, {
      businessId: request.businessId,
      customerIdentityId,
      presentedArtifactType: artifact.type,
      presentedArtifactReference: artifact.reference,
      canonicalLoyaltyNumberValue,
      rewardProgramId: program.id,
      rewardProgramVersionId: version.id,
      sharedLoyaltyNumberAllowed: version.sharedLoyaltyNumberAllowed,
      multipleUnitsAllowed: version.multipleUnitsAllowed,
      branchId: branch.id,
      recordedByUserId: params.userId,
      recordedByRole: role,
      quantity: request.quantity,
      qualifyingItemId: request.qualifyingItemId,
      itemLabel,
      unitValueMinor: request.unitValueMinor ?? null,
      currency: request.currency ?? null,
      purchaseDate: request.purchaseDate,
      notes: request.notes ?? null,
      correlationId: params.correlationId,
    });

    // Step 14: lifecycle event (∅ → waiting_for_customer).
    const creationEvent = await appendPurchaseRecordEvent(tx, {
      purchaseRecordId: purchase.id,
      fromStatus: null,
      toStatus: "waiting_for_customer",
      actorType: role,
      actorId: params.userId,
      reason: null,
      eventPayload: {
        rewardProgramVersionId: version.id,
        programCurrentVersionId: program.currentVersionId,
      },
      correlationId: params.correlationId,
    });

    // Step 15: authoritative Trust Event (causal + subject: the record itself).
    await insertTrustEvent(tx, {
      eventType: "purchase.recorded",
      causalPurchaseRecordId: purchase.id,
      sourcePurchaseRecordEventId: creationEvent.id,
      subjectType: "purchase_record",
      subjectId: purchase.id,
      businessId: purchase.businessId,
      customerIdentityId: purchase.customerIdentityId,
      actorType: role,
      actorId: params.userId,
      actorRole: role,
      correlationId: params.correlationId,
      payload: {
        rewardProgramId: purchase.rewardProgramId,
        rewardProgramVersionId: purchase.rewardProgramVersionId,
        qualifyingItemId: purchase.qualifyingItemId,
        quantity: purchase.quantity,
        presentedArtifactType: purchase.presentedArtifactType,
      },
    });

    // Step 16: Notification Intent (recorded → Customer).
    await insertNotificationIntent(tx, {
      intentType: "purchase_recorded_customer",
      purchaseRecordId: purchase.id,
      sourcePurchaseRecordEventId: creationEvent.id,
      recipientType: "customer",
      recipientId: purchase.customerIdentityId,
      payload: { purchaseRecordId: purchase.id, businessId: purchase.businessId },
      correlationId: params.correlationId,
    });

    // Step 17: outbox.
    await writePurchaseOutboxEntry(tx, {
      eventType: "purchase_recorded",
      aggregateId: purchase.id,
      payload: { businessId: purchase.businessId, purchaseRecordId: purchase.id },
      actorId: params.userId,
      correlationId: params.correlationId,
      idempotencyKey: params.idempotencyKey,
    });

    // Step 18: complete idempotency. Step 19: COMMIT (via withPlatformTransaction).
    const result: RecordPurchaseResult = { purchase };
    await completeIdempotencyKeyInTransaction(tx, params.idempotencyKey, purchase.id, result);
    return result;
  });
}
