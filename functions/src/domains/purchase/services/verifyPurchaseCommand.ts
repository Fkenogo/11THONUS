/**
 * `verifyPurchase` command (`PLATFORM-BASELINE-006A`, design §§14/16,
 * FD-PVL-002/FD-PVL-003/FD-PVL-004).
 *
 * Customer-authenticated (the callable server-resolves the Customer
 * Identity from the current auth chain; a client-supplied customer id is
 * never trusted). One PostgreSQL transaction, global lock ordering
 * (idempotency → purchase → stream → cycle → reward → appends):
 *
 *  1. reserve/check idempotency (`purchase.verify`);
 *  2. lock Purchase; re-check `waiting_for_customer` + ownership against
 *     the server-resolved identity;
 *  3. creation-time version binding governs (snapshot, never re-resolved
 *     to program-current — FD-PVL-003);
 *  4. transition → `verified` (conditional; race losers fail closed);
 *  5. append the transition event;
 *  6. issue exactly one Verified Unit credit (`quantity` = purchase qty);
 *  7. ensure + lock the allocation stream; resolve/lock the current Cycle
 *     (open it under the stream lock when none exists);
 *  8. allocate up to capacity 10; overflow becomes pending positions
 *     (never a second concurrent active cycle); at exactly 10 create the
 *     minimum Reward entitlement exactly once + flip the Cycle;
 *  9. causal + subject Trust Events (repeatable `loyalty_cycle.allocated`
 *     dedups per source transition);
 *  10. Notification Intents (verified → Business; reward → Customer);
 *  11. outbox events; 12. complete idempotency; COMMIT.
 *
 * Any failure rolls back everything.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import { withPlatformTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKeyInTransaction,
  peekIdempotencyKey,
} from "../../rewardProgram/repositories/idempotencyRepository";
import { purchaseRequestHash } from "./purchaseRequestHash";
import {
  lockPurchaseRecordById,
  transitionPurchaseToVerified,
  appendPurchaseRecordEvent,
} from "../repositories/purchaseRecordRepository";
import { insertVerifiedUnitCredit } from "../repositories/verifiedUnitRepository";
import {
  LOYALTY_CYCLE_THRESHOLD,
  ensureAndLockCycleStream,
  lockCurrentCycle,
  openCycleUnderStreamLock,
  addAllocatedUnitsToCycle,
  markCycleRewardAvailable,
  insertAllocationPosition,
  appendAllocationEvent,
  insertRewardForCycle,
} from "../repositories/loyaltyCycleRepository";
import {
  readVersionRewardTerms,
  readProgramCurrentVersionId,
} from "../repositories/purchaseProgramScopeRepository";
import { insertTrustEvent } from "../repositories/trustEventRepository";
import {
  insertNotificationIntent,
  writePurchaseOutboxEntry,
} from "../repositories/purchaseOutboxRepository";
import type {
  LoyaltyCycleRow,
  PurchaseRecordRow,
  RewardRow,
  VerifiedUnitRow,
} from "../models/purchase";
import {
  purchaseNotFoundError,
  purchaseOwnershipError,
  purchaseStaleStateError,
  purchaseIdempotencyConflictError,
  purchaseIdempotencyInProgressError,
  purchaseValidationError,
} from "../models/purchaseErrors";

export type VerifyPurchaseRequest = {
  readonly purchaseRecordId: string;
};

export type VerifyPurchaseResult = {
  readonly purchase: PurchaseRecordRow;
  readonly verifiedUnit: VerifiedUnitRow;
  readonly cycle: LoyaltyCycleRow;
  readonly reward: RewardRow | null;
};

export async function verifyPurchase(
  _db: Firestore,
  pool: PlatformPostgresPool,
  params: {
    /** Server-resolved Customer Identity id (current auth chain — never a client claim). */
    readonly customerIdentityId: string;
    readonly request: VerifyPurchaseRequest;
    readonly idempotencyKey: string;
    readonly correlationId: string;
  },
): Promise<VerifyPurchaseResult> {
  const purchaseRecordId = params.request.purchaseRecordId;
  if (!purchaseRecordId || purchaseRecordId.trim().length === 0) {
    throw purchaseValidationError("A Purchase Record id is required.");
  }

  const requestHash = purchaseRequestHash(
    "verify",
    params.customerIdentityId,
    "",
    purchaseRecordId,
    purchaseRecordId,
  );
  const peek = await peekIdempotencyKey(pool, params.idempotencyKey, requestHash);
  if (peek.outcome === "duplicate") {
    return peek.responseSnapshot as VerifyPurchaseResult;
  }

  return withPlatformTransaction(pool, async (tx) => {
    const reservation = await checkAndReserveIdempotencyKey(tx, {
      idempotencyKey: params.idempotencyKey,
      operationType: "purchase.verify",
      actorId: params.customerIdentityId,
      requestHash,
      correlationId: params.correlationId,
    });
    if (reservation.outcome === "duplicate") {
      return reservation.responseSnapshot as VerifyPurchaseResult;
    }
    if (reservation.outcome === "in_progress") {
      throw purchaseIdempotencyInProgressError();
    }
    if (reservation.outcome === "conflict") {
      throw purchaseIdempotencyConflictError();
    }

    const locked = await lockPurchaseRecordById(tx, purchaseRecordId);
    if (!locked) {
      throw purchaseNotFoundError(purchaseRecordId);
    }
    if (locked.customerIdentityId !== params.customerIdentityId) {
      throw purchaseOwnershipError();
    }
    if (locked.status !== "waiting_for_customer") {
      throw purchaseStaleStateError("waiting_for_customer", locked.status);
    }

    const verifiedAt = new Date();
    const purchase = await transitionPurchaseToVerified(tx, {
      purchaseId: purchaseRecordId,
      verifiedAt,
    });
    if (!purchase) {
      // Lost the row race between lock and transition — fail closed.
      throw purchaseStaleStateError("waiting_for_customer", locked.status);
    }

    // Version-delta traceability note (FD-PVL-003): the snapshot governs;
    // program-current is logged, never applied.
    const programCurrentVersionId = await readProgramCurrentVersionId(tx, purchase.rewardProgramId);
    const verifyEvent = await appendPurchaseRecordEvent(tx, {
      purchaseRecordId: purchase.id,
      fromStatus: "waiting_for_customer",
      toStatus: "verified",
      actorType: "customer",
      actorId: params.customerIdentityId,
      reason: null,
      eventPayload: {
        rewardProgramVersionId: purchase.rewardProgramVersionId,
        programCurrentVersionId,
        versionRebound: programCurrentVersionId !== purchase.rewardProgramVersionId,
      },
      correlationId: params.correlationId,
    });

    // Exactly one credit per Purchase (partial-unique backstop).
    const verifiedUnit = await insertVerifiedUnitCredit(tx, {
      purchaseRecordId: purchase.id,
      businessId: purchase.businessId,
      customerIdentityId: purchase.customerIdentityId,
      rewardProgramId: purchase.rewardProgramId,
      rewardProgramVersionId: purchase.rewardProgramVersionId,
      quantity: purchase.quantity,
      reasonCode: "purchase_verified",
      correlationId: params.correlationId,
      createdBy: params.customerIdentityId,
    });

    // Serialized allocation (mechanism B).
    await ensureAndLockCycleStream(tx, {
      businessId: purchase.businessId,
      customerIdentityId: purchase.customerIdentityId,
      rewardProgramId: purchase.rewardProgramId,
    });
    let cycle = await lockCurrentCycle(tx, {
      customerIdentityId: purchase.customerIdentityId,
      rewardProgramId: purchase.rewardProgramId,
    });
    if (!cycle) {
      cycle = await openCycleUnderStreamLock(tx, {
        businessId: purchase.businessId,
        customerIdentityId: purchase.customerIdentityId,
        rewardProgramId: purchase.rewardProgramId,
        openedUnderVersionId: purchase.rewardProgramVersionId,
        correlationId: params.correlationId,
      });
    }

    let allocatedNow = 0;
    let pendingNow = purchase.quantity;
    if (cycle.state === "active") {
      const room = LOYALTY_CYCLE_THRESHOLD - cycle.allocatedUnits;
      allocatedNow = Math.min(purchase.quantity, Math.max(room, 0));
      pendingNow = purchase.quantity - allocatedNow;
    }

    let allocationOrder = 0;
    if (allocatedNow > 0) {
      const position = await insertAllocationPosition(tx, {
        verifiedUnitId: verifiedUnit.id,
        loyaltyCycleId: cycle.id,
        businessId: purchase.businessId,
        customerIdentityId: purchase.customerIdentityId,
        rewardProgramId: purchase.rewardProgramId,
        rewardProgramVersionId: purchase.rewardProgramVersionId,
        allocatedQuantity: allocatedNow,
        allocationOrder,
        state: "allocated",
      });
      allocationOrder += 1;
      await appendAllocationEvent(tx, {
        allocationPositionId: position.id,
        verifiedUnitId: verifiedUnit.id,
        fromState: "none",
        toState: "allocated",
        fromCycleId: null,
        toCycleId: cycle.id,
        quantity: allocatedNow,
        reason: "initial_placement",
        correlationId: params.correlationId,
      });
      cycle = await addAllocatedUnitsToCycle(tx, { cycleId: cycle.id, units: allocatedNow });
    }
    if (pendingNow > 0) {
      const position = await insertAllocationPosition(tx, {
        verifiedUnitId: verifiedUnit.id,
        loyaltyCycleId: null,
        businessId: purchase.businessId,
        customerIdentityId: purchase.customerIdentityId,
        rewardProgramId: purchase.rewardProgramId,
        rewardProgramVersionId: purchase.rewardProgramVersionId,
        allocatedQuantity: pendingNow,
        allocationOrder,
        state: "pending",
      });
      await appendAllocationEvent(tx, {
        allocationPositionId: position.id,
        verifiedUnitId: verifiedUnit.id,
        fromState: "none",
        toState: "pending",
        fromCycleId: null,
        toCycleId: null,
        quantity: pendingNow,
        reason: "initial_placement",
        correlationId: params.correlationId,
      });
    }

    // Threshold sub-transaction (REQUIRED at exactly 10, same transaction).
    let reward: RewardRow | null = null;
    if (cycle.state === "active" && cycle.allocatedUnits === LOYALTY_CYCLE_THRESHOLD) {
      const terms = await readVersionRewardTerms(tx, cycle.openedUnderVersionId);
      if (!terms) {
        throw purchaseValidationError(
          "The Cycle's governing Reward Program Version was not found.",
        );
      }
      reward = await insertRewardForCycle(tx, {
        loyaltyCycleId: cycle.id,
        businessId: purchase.businessId,
        customerIdentityId: purchase.customerIdentityId,
        rewardProgramId: purchase.rewardProgramId,
        rewardProgramVersionId: cycle.openedUnderVersionId,
        rewardDescription: terms.rewardDescription,
        correlationId: params.correlationId,
      });
      cycle = await markCycleRewardAvailable(tx, cycle.id);
    }

    // Trust Events: causal purchase.verified + subject events.
    await insertTrustEvent(tx, {
      eventType: "purchase.verified",
      causalPurchaseRecordId: purchase.id,
      sourcePurchaseRecordEventId: verifyEvent.id,
      subjectType: "purchase_record",
      subjectId: purchase.id,
      businessId: purchase.businessId,
      customerIdentityId: purchase.customerIdentityId,
      actorType: "customer",
      actorId: params.customerIdentityId,
      correlationId: params.correlationId,
      payload: {
        rewardProgramId: purchase.rewardProgramId,
        rewardProgramVersionId: purchase.rewardProgramVersionId,
        quantity: purchase.quantity,
      },
    });
    await insertTrustEvent(tx, {
      eventType: "verified_units.issued",
      causalPurchaseRecordId: purchase.id,
      sourcePurchaseRecordEventId: verifyEvent.id,
      subjectType: "verified_unit",
      subjectId: verifiedUnit.id,
      subjectVerifiedUnitId: verifiedUnit.id,
      businessId: purchase.businessId,
      customerIdentityId: purchase.customerIdentityId,
      actorType: "customer",
      actorId: params.customerIdentityId,
      correlationId: params.correlationId,
      payload: { verifiedUnitId: verifiedUnit.id, quantity: verifiedUnit.quantity },
    });
    if (allocatedNow > 0) {
      await insertTrustEvent(tx, {
        eventType: "loyalty_cycle.allocated",
        causalPurchaseRecordId: purchase.id,
        sourcePurchaseRecordEventId: verifyEvent.id,
        subjectType: "loyalty_cycle",
        subjectId: cycle.id,
        subjectLoyaltyCycleId: cycle.id,
        businessId: purchase.businessId,
        customerIdentityId: purchase.customerIdentityId,
        actorType: "customer",
        actorId: params.customerIdentityId,
        correlationId: params.correlationId,
        payload: { loyaltyCycleId: cycle.id, allocatedQuantity: allocatedNow },
      });
    }
    if (reward) {
      await insertTrustEvent(tx, {
        eventType: "loyalty_cycle.reward_available",
        causalPurchaseRecordId: purchase.id,
        sourcePurchaseRecordEventId: verifyEvent.id,
        subjectType: "loyalty_cycle",
        subjectId: cycle.id,
        subjectLoyaltyCycleId: cycle.id,
        businessId: purchase.businessId,
        customerIdentityId: purchase.customerIdentityId,
        actorType: "customer",
        actorId: params.customerIdentityId,
        correlationId: params.correlationId,
        payload: { loyaltyCycleId: cycle.id },
      });
      await insertTrustEvent(tx, {
        eventType: "reward.available",
        causalPurchaseRecordId: purchase.id,
        sourcePurchaseRecordEventId: verifyEvent.id,
        subjectType: "reward",
        subjectId: reward.id,
        subjectRewardId: reward.id,
        businessId: purchase.businessId,
        customerIdentityId: purchase.customerIdentityId,
        actorType: "customer",
        actorId: params.customerIdentityId,
        correlationId: params.correlationId,
        payload: { rewardId: reward.id, loyaltyCycleId: cycle.id },
      });
    }

    // Notification Intents: verified → Business; reward → Customer.
    await insertNotificationIntent(tx, {
      intentType: "purchase_verified_business",
      purchaseRecordId: purchase.id,
      sourcePurchaseRecordEventId: verifyEvent.id,
      recipientType: "business",
      recipientId: purchase.businessId,
      payload: { purchaseRecordId: purchase.id, customerIdentityId: purchase.customerIdentityId },
      correlationId: params.correlationId,
    });
    if (reward) {
      await insertNotificationIntent(tx, {
        intentType: "reward_available_customer",
        purchaseRecordId: purchase.id,
        sourcePurchaseRecordEventId: verifyEvent.id,
        recipientType: "customer",
        recipientId: purchase.customerIdentityId,
        payload: { purchaseRecordId: purchase.id, rewardId: reward.id, loyaltyCycleId: cycle.id },
        correlationId: params.correlationId,
      });
    }

    // Outbox.
    await writePurchaseOutboxEntry(tx, {
      eventType: "purchase_verified",
      aggregateId: purchase.id,
      payload: { businessId: purchase.businessId, purchaseRecordId: purchase.id },
      actorId: params.customerIdentityId,
      correlationId: params.correlationId,
      idempotencyKey: params.idempotencyKey,
    });
    await writePurchaseOutboxEntry(tx, {
      eventType: "verified_units_issued",
      aggregateId: purchase.id,
      payload: { verifiedUnitId: verifiedUnit.id, quantity: verifiedUnit.quantity },
      actorId: params.customerIdentityId,
      correlationId: params.correlationId,
      idempotencyKey: params.idempotencyKey,
    });
    if (allocatedNow > 0) {
      await writePurchaseOutboxEntry(tx, {
        eventType: "loyalty_cycle_allocated",
        aggregateId: purchase.id,
        payload: { loyaltyCycleId: cycle.id, allocatedQuantity: allocatedNow },
        actorId: params.customerIdentityId,
        correlationId: params.correlationId,
        idempotencyKey: params.idempotencyKey,
      });
    }
    if (reward) {
      await writePurchaseOutboxEntry(tx, {
        eventType: "loyalty_cycle_reward_available",
        aggregateId: purchase.id,
        payload: { loyaltyCycleId: cycle.id },
        actorId: params.customerIdentityId,
        correlationId: params.correlationId,
        idempotencyKey: params.idempotencyKey,
      });
      await writePurchaseOutboxEntry(tx, {
        eventType: "reward_available",
        aggregateId: purchase.id,
        payload: { rewardId: reward.id, loyaltyCycleId: cycle.id },
        actorId: params.customerIdentityId,
        correlationId: params.correlationId,
        idempotencyKey: params.idempotencyKey,
      });
    }

    const result: VerifyPurchaseResult = { purchase, verifiedUnit, cycle, reward };
    await completeIdempotencyKeyInTransaction(tx, params.idempotencyKey, purchase.id, result);
    return result;
  });
}
