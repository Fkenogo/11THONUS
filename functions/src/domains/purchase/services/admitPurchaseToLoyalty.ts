/**
 * `admitPurchaseToLoyalty` -- the internal Loyalty-admission write sequence
 * (`WP-COM-05a`, 11THONUS-COMMERCIAL-DESIGN-001 v1.1 + CORR-002 §8.4/§8.13/§22).
 *
 * Extracted VERBATIM (same statements, same order) from `verifyPurchase` so a
 * later package can admit a held (`pending_admission`) Purchase without
 * re-implementing the verification logic. It is a structural extraction: with
 * the admission gate OFF, `verifyPurchase` produces exactly the same rows,
 * events and result as before.
 *
 * CALLER CONTRACT (the seam, not a command):
 *  - runs inside the caller's `withPlatformTransaction`;
 *  - the caller has ALREADY taken the canonical earlier locks -- the client
 *    idempotency key (when there is one), then the Purchase row `FOR UPDATE`
 *    (`lockPurchaseRecordById`) -- and passes the locked row in `locked`;
 *  - the caller has already authorised the actor and checked `locked.status`
 *    equals `fromStatus` (the conditional transition below is the race
 *    backstop either way: zero rows => stale-state error, nothing committed);
 *  - the caller owns the idempotency completion (`completeIdempotencyKey…`)
 *    and any Commercial decision. This function reserves/completes NO
 *    idempotency key (CORR-002: nothing is reserved before a future locked
 *    ADMIT decision), reads NO Commercial row and takes NO Commercial lock.
 *
 * Lock order (unchanged): [idempotency] → purchase (caller) → stream → cycle
 * → reward → appends. Writes, in order: transition Purchase → transition
 * event → Verified Unit (exactly one per Purchase; partial-unique backstop) →
 * stream (ensure+lock) → current Cycle (lock/open) → first-allocation version
 * binding → allocation positions + events → Cycle counters → Reward at
 * exactly 10 (UNIQUE per Cycle) → Trust Events → Notification Intents →
 * outbox. Any failure throws and the caller's transaction rolls back
 * everything.
 */

import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import {
  transitionPurchaseToVerified,
  appendPurchaseRecordEvent,
  type PurchaseAdmissionSourceStatus,
} from "../repositories/purchaseRecordRepository";
import { insertVerifiedUnitCredit } from "../repositories/verifiedUnitRepository";
import {
  LOYALTY_CYCLE_THRESHOLD,
  adoptCycleGoverningVersionForFirstAllocation,
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
  PurchaseActorType,
  PurchaseRecordRow,
  RewardRow,
  VerifiedUnitRow,
} from "../models/purchase";
import { purchaseStaleStateError, purchaseValidationError } from "../models/purchaseErrors";

export type AdmitPurchaseToLoyaltyResult = {
  readonly purchase: PurchaseRecordRow;
  readonly verifiedUnit: VerifiedUnitRow;
  readonly cycle: LoyaltyCycleRow;
  readonly reward: RewardRow | null;
};

export type AdmitPurchaseToLoyaltyParams = {
  /** The Purchase row, already locked `FOR UPDATE` by the caller in this transaction. */
  readonly locked: PurchaseRecordRow;
  /** The status the transition leaves: `waiting_for_customer` (live verify) or `pending_admission` (re-admission). */
  readonly fromStatus: PurchaseAdmissionSourceStatus;
  /** Who the admission is attributed to: the Customer on live verify; `system` on a later re-admission. */
  readonly actor: { readonly type: PurchaseActorType; readonly id: string };
  readonly correlationId: string;
  /** Carried onto the outbox entries only (never reserved/completed here). */
  readonly idempotencyKey: string;
};

export async function admitPurchaseToLoyalty(
  tx: PlatformPostgresTransaction,
  params: AdmitPurchaseToLoyaltyParams,
): Promise<AdmitPurchaseToLoyaltyResult> {
  const purchaseRecordId = params.locked.id;
  const locked = params.locked;
  const actor = params.actor;
  const verifiedAt = new Date();
  const purchase = await transitionPurchaseToVerified(tx, {
    purchaseId: purchaseRecordId,
    verifiedAt,
    fromStatus: params.fromStatus,
  });
  if (!purchase) {
    // Lost the row race between lock and transition — fail closed.
    throw purchaseStaleStateError(params.fromStatus, locked.status);
  }

  // Version-delta traceability note (FD-PVL-003): the snapshot governs;
  // program-current is logged, never applied.
  const programCurrentVersionId = await readProgramCurrentVersionId(tx, purchase.rewardProgramId);
  const verifyEvent = await appendPurchaseRecordEvent(tx, {
    purchaseRecordId: purchase.id,
    fromStatus: params.fromStatus,
    toStatus: "verified",
    actorType: actor.type,
    actorId: actor.id,
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
    createdBy: actor.id,
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

  // First-allocation version binding (`CAPABILITY-6-REDEMPTION-ENGINE-001-CORR-002`,
  // DEC-LOY-008 addendum 2026-09-28 / DEC-PROD-014): a Cycle's governing
  // version is the version of the FIRST Verified Unit allocated into it.
  // A Cycle opened by this path already carries its opening Purchase's
  // version, so this is a no-op for it. A Cycle opened EMPTY by a
  // redemption (provisional continuity version, no earning yet) adopts
  // the first earning activity's version here, before any unit lands —
  // so equivalent earning produces the same Reward whichever path opened
  // the Cycle. Never rebinds a non-empty Cycle (conditional inside).
  if (
    cycle.allocatedUnits === 0 &&
    cycle.openedUnderVersionId !== purchase.rewardProgramVersionId
  ) {
    const adopted = await adoptCycleGoverningVersionForFirstAllocation(tx, {
      cycleId: cycle.id,
      versionId: purchase.rewardProgramVersionId,
    });
    if (!adopted) {
      // Impossible while holding the stream + cycle locks (nothing else
      // can allocate here) — fail closed rather than allocate under a
      // version the first unit did not determine.
      throw purchaseValidationError(
        "The Loyalty Cycle could not be bound to its first allocation version.",
      );
    }
    cycle = adopted;
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
      throw purchaseValidationError("The Cycle's governing Reward Program Version was not found.");
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
    actorType: actor.type,
    actorId: actor.id,
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
    actorType: actor.type,
    actorId: actor.id,
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
      actorType: actor.type,
      actorId: actor.id,
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
      actorType: actor.type,
      actorId: actor.id,
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
      actorType: actor.type,
      actorId: actor.id,
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
    actorId: actor.id,
    correlationId: params.correlationId,
    idempotencyKey: params.idempotencyKey,
  });
  await writePurchaseOutboxEntry(tx, {
    eventType: "verified_units_issued",
    aggregateId: purchase.id,
    payload: { verifiedUnitId: verifiedUnit.id, quantity: verifiedUnit.quantity },
    actorId: actor.id,
    correlationId: params.correlationId,
    idempotencyKey: params.idempotencyKey,
  });
  if (allocatedNow > 0) {
    await writePurchaseOutboxEntry(tx, {
      eventType: "loyalty_cycle_allocated",
      aggregateId: purchase.id,
      payload: { loyaltyCycleId: cycle.id, allocatedQuantity: allocatedNow },
      actorId: actor.id,
      correlationId: params.correlationId,
      idempotencyKey: params.idempotencyKey,
    });
  }
  if (reward) {
    await writePurchaseOutboxEntry(tx, {
      eventType: "loyalty_cycle_reward_available",
      aggregateId: purchase.id,
      payload: { loyaltyCycleId: cycle.id },
      actorId: actor.id,
      correlationId: params.correlationId,
      idempotencyKey: params.idempotencyKey,
    });
    await writePurchaseOutboxEntry(tx, {
      eventType: "reward_available",
      aggregateId: purchase.id,
      payload: { rewardId: reward.id, loyaltyCycleId: cycle.id },
      actorId: actor.id,
      correlationId: params.correlationId,
      idempotencyKey: params.idempotencyKey,
    });
  }

  return { purchase, verifiedUnit, cycle, reward };
}
