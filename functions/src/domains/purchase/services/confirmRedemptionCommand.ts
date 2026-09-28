/**
 * `confirmRedemption` command (`CAPABILITY-6-REDEMPTION-ENGINE-001`,
 * `DEC-LOY-018` / `FD-REDEMPTION-AUTHORITY-001`).
 *
 * Business-authenticated, server-authoritative. The client supplies only a
 * `businessId` and a `rewardId`; EVERYTHING authoritative is resolved
 * server-side: the caller's CURRENT membership and permission state, the
 * Reward's Business ownership, the Reward's state, its Customer, its Cycle
 * and its governing version. No client-supplied state, ownership, customer
 * identity, role, or permission status is ever read.
 *
 * Order (Firestore, then one PostgreSQL transaction):
 *
 *  0. resolve the authenticated actor and reject an unauthenticated caller;
 *  1. LIVE `redemption.confirm` evaluation through the existing permission
 *     architecture — Owner floor, Manager default/revoke/re-grant, Staff
 *     explicit grant/revoke all fall out of it with no redemption-specific
 *     branch (§4: a permission revoked before confirmation no longer
 *     authorises it). This evaluation is the accountable one and is audited
 *     (`auditRequirement: "mandatory"`, 004C);
 *  2. peek the idempotency key (a genuine same-key/same-request replay of
 *     an already-completed confirmation returns the stored result without
 *     re-running any precondition);
 *  3. one transaction in canonical global lock order
 *     (idempotency → stream → cycle → reward → appends): reserve the key →
 *     NON-LOCKING Reward peek for lock-key discovery only → lock the
 *     stream → lock the governing Cycle → LOCK the Reward → re-check
 *     existence/ownership/state off the LOCKED row → re-evaluate authority
 *     AT the mutation boundary → conditional `available → redeemed` →
 *     write the redemption evidence row → complete the governing Loyalty
 *     Cycle (`reward_available → reward_redeemed`) → open the next Loyalty
 *     Cycle under the first forward-allocated unit's version (provisional
 *     continuity version when opened empty) → forward-allocate pending
 *     Verified Units (reaching the threshold creates the next Reward) →
 *     Trust Events → Notification Intents → complete the key → COMMIT.
 *
 * The Reward lock NEVER precedes the stream/cycle locks: locking the
 * Reward first and then inserting redemption evidence (which takes a
 * key-share on the governing Cycle through its FKs) before locking the
 * stream inverts the verify path — which holds stream + current-cycle and
 * then takes a key-share on the cycle through its own reward insert — and
 * deadlocks with PostgreSQL `40P01`
 * (`CAPABILITY-6-REDEMPTION-ENGINE-001-CORR-002`). The pre-lock peek takes
 * no lock, so it cannot invert anything; every precondition is still
 * decided off the locked row plus the conditional transition, so no race
 * opens between validation and mutation.
 *
 * Exactly-once is enforced at four independent layers: the idempotency
 * key, the `FOR UPDATE` lock, the conditional `UPDATE … WHERE state =
 * 'available'`, and the `redemptions_one_per_reward` unique constraint.
 * There is never a second successful transition for one Reward.
 *
 * THE REWARD'S CYCLE IS NOT COMPLETE WHEN THE REWARD BECOMES AVAILABLE.
 * `reward_available` is a CURRENT cycle state: both
 * `loyalty_cycles_one_current_per_customer_program` and `lockCurrentCycle`
 * count `active`/`reward_available` as current. Only `reward_redeemed` — a
 * canonical stored state in PRD06 and TRD10 §10.11.2 — ends the cycle, and
 * until redemption happens the single-current-cycle slot stays taken, so the
 * Customer could never earn again. TRD11 §11.26 therefore requires this
 * command to close the cycle, create the next one, and allocate pending
 * Verified Units. No reversal, restoration, or undo path exists here
 * (`DEC-LOY-004`).
 */

import type { Firestore } from "firebase-admin/firestore";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import { withPlatformTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKeyInTransaction,
  peekIdempotencyKey,
} from "../../rewardProgram/repositories/idempotencyRepository";
import { redemptionRequestHash } from "./purchaseRequestHash";
import { authorizeRedemptionConfirm } from "./purchaseAuthorization";
import {
  lockRewardById,
  peekRewardScopeById,
  transitionRewardToRedeemed,
  insertRedemption,
} from "../repositories/redemptionRepository";
import { insertTrustEvent } from "../repositories/trustEventRepository";
import { insertNotificationIntent } from "../repositories/purchaseOutboxRepository";
import {
  LOYALTY_CYCLE_THRESHOLD,
  addAllocatedUnitsToCycle,
  convertPendingPositionToAllocated,
  ensureAndLockCycleStream,
  getCycleById,
  insertRewardForCycle,
  listPendingAllocationPositions,
  lockCycleById,
  markCycleRewardAvailable,
  markCycleRewardRedeemed,
  openCycleUnderStreamLock,
} from "../repositories/loyaltyCycleRepository";
import { readVersionRewardTerms } from "../repositories/purchaseProgramScopeRepository";
import type { RedemptionRow, RewardRow } from "../models/purchase";
import {
  purchaseIdempotencyConflictError,
  purchaseIdempotencyInProgressError,
  purchaseValidationError,
  redemptionCycleStateError,
  redemptionRewardNotFoundError,
  redemptionStaleStateError,
} from "../models/purchaseErrors";

export type ConfirmRedemptionRequest = {
  readonly rewardId: string;
};

/**
 * `rewards.id` is a PostgreSQL `UUID` column. Anything that is not a canonical
 * UUID can never match a persisted Reward, so it is rejected before it reaches
 * the database — otherwise the lock query raises `22P02` and the caller sees an
 * internal error instead of the governed "no such Reward" outcome.
 */
const REWARD_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ConfirmRedemptionResult = {
  readonly reward: RewardRow;
  readonly redemption: RedemptionRow;
  /** The Cycle closed by this redemption (`reward_available` → `reward_redeemed`). */
  readonly completedLoyaltyCycleId: string;
  /** The next Cycle opened in the same transaction, so the Customer can keep earning. */
  readonly nextLoyaltyCycleId: string;
  /** Pending Verified Units forward-allocated into the next Cycle (0 when none). */
  readonly unitsAllocatedForward: number;
  /** Set when forward allocation carried the next Cycle to the 10-unit threshold. */
  readonly nextReward: RewardRow | null;
};

/**
 * Trust Event `actor_type` for a redemption-caused event is the confirming
 * member's OWN resolved role, reusing the existing `PurchaseActorType`
 * vocabulary exactly as `recordPurchaseCommand` already does for
 * `purchase.recorded`. Accountability itself is always the individual
 * member: `actor_id` is the authenticated user, the resolved membership id
 * is on the redemption row, and the role is audit context only — never a
 * role standing in for a person.
 */

export async function confirmRedemption(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: {
    /** Server-resolved authenticated user id (current auth chain — never a client claim). */
    readonly userId: string;
    readonly businessId: string;
    readonly request: ConfirmRedemptionRequest;
    readonly idempotencyKey: string;
    readonly correlationId: string;
  },
): Promise<ConfirmRedemptionResult> {
  const rewardId = params.request.rewardId;
  if (!rewardId || rewardId.trim().length === 0) {
    throw purchaseValidationError("A Reward id is required.");
  }
  // Shape-check the id BEFORE it reaches PostgreSQL. `rewards.id` is a UUID
  // column, so a non-UUID value would make the lock query raise `22P02`
  // (invalid_text_representation) and surface as an internal error instead of
  // the intended indistinguishable "not found". A malformed id is simply not a
  // Reward this caller could ever redeem, so it is reported the same way a
  // well-formed id that matches nothing is.
  if (!REWARD_ID_PATTERN.test(rewardId)) {
    throw redemptionRewardNotFoundError(rewardId);
  }

  // Live authority, resolved on EVERY attempt before any state is read or
  // written. Never skipped, never cached, never taken from the request.
  // This first evaluation is the accountable one and is audited (004C).
  await authorizeRedemptionConfirm(db, params.userId, params.businessId, {
    idempotencyKey: params.idempotencyKey,
    requireAudit: true,
  });

  const requestHash = redemptionRequestHash(
    "confirm",
    params.userId,
    params.businessId,
    rewardId,
    rewardId,
  );
  const peek = await peekIdempotencyKey(pool, params.idempotencyKey, requestHash);
  if (peek.outcome === "duplicate") {
    return peek.responseSnapshot as ConfirmRedemptionResult;
  }

  return withPlatformTransaction(pool, async (tx) => {
    const reservation = await checkAndReserveIdempotencyKey(tx, {
      idempotencyKey: params.idempotencyKey,
      operationType: "redemption.confirm",
      actorId: params.userId,
      requestHash,
      correlationId: params.correlationId,
    });
    if (reservation.outcome === "duplicate") {
      return reservation.responseSnapshot as ConfirmRedemptionResult;
    }
    if (reservation.outcome === "in_progress") {
      throw purchaseIdempotencyInProgressError();
    }
    if (reservation.outcome === "conflict") {
      throw purchaseIdempotencyConflictError();
    }

    // Canonical global lock order (idempotency → stream → cycle → reward
    // → appends; `CAPABILITY-6-REDEMPTION-ENGINE-001-CORR-002`). The Reward
    // id is known from the request but its stream key and governing cycle
    // id live on the row, so the transaction peeks the row WITHOUT a lock
    // purely to discover which stream/cycle locks to take. The peek takes
    // no lock and decides nothing: existence, ownership, and state are all
    // re-decided off the `FOR UPDATE` row below, and the conditional
    // transition remains the backstop — so a Reward that changes between
    // the peek and the lock cannot slip through.
    //
    // The peek is scoped to the calling Business, so a foreign id takes no
    // foreign-stream lock at all and reads as absent — the same
    // indistinguishable not-found a nonexistent id produces.
    const peeked = await peekRewardScopeById(tx, {
      rewardId,
      businessId: params.businessId,
    });
    if (!peeked) {
      throw redemptionRewardNotFoundError(rewardId);
    }

    // Stream first (serializes every same-customer/program lifecycle
    // transaction — verify and redemption alike), exactly as the verify
    // transaction does.
    await ensureAndLockCycleStream(tx, {
      businessId: peeked.businessId,
      customerIdentityId: peeked.customerIdentityId,
      rewardProgramId: peeked.rewardProgramId,
    });

    // Governing cycle BEFORE the Reward. This is the inversion the
    // correction removes: previously the Reward was locked first and the
    // redemption-evidence insert then held a key-share on this cycle while
    // waiting for the stream — while a concurrent verify held the stream
    // and waited for this same cycle (`lockCurrentCycle` `FOR UPDATE`
    // conflicts with the key-share). PostgreSQL `40P01`.
    const governingCycle = await lockCycleById(tx, peeked.loyaltyCycleId);
    if (!governingCycle) {
      throw redemptionCycleStateError("missing");
    }

    // Lock second, then read every authoritative field off the LOCKED row —
    // never off the peek, never off the request.
    const locked = await lockRewardById(tx, rewardId);
    if (!locked) {
      throw redemptionRewardNotFoundError(rewardId);
    }
    // Tenant isolation: ownership is a property of the persisted Reward,
    // never of the request. A membership in another Business confers
    // nothing here even if it somehow held the permission.
    //
    // A Reward owned by another Business is reported EXACTLY like a Reward
    // that does not exist, so a caller authorised in this Business cannot
    // probe for the existence of Reward ids in other tenants by comparing
    // `not-found` against `permission-denied` (both are RESOURCE_NOT_FOUND /
    // the same message, and neither is echoed to the client by `toHttpsError`).
    if (locked.businessId !== params.businessId) {
      throw redemptionRewardNotFoundError(rewardId);
    }
    if (locked.state !== "available") {
      throw redemptionStaleStateError(locked.state);
    }

    // Authority revalidation AT THE MUTATION BOUNDARY. The first evaluation
    // happens before the idempotency peek and this transaction, so a grant
    // revoked, a membership suspended, or a membership removed while this
    // call waited on the idempotency key or the Reward row lock would
    // otherwise let a stale `role`/`membershipId` redeem the Reward.
    //
    // Re-resolving here, immediately before the conditional UPDATE and while
    // the Reward row is already locked, is the `revalidate-live` half of the
    // accepted evaluate-then-mutate model (ENG-P2-004B design §§18/30 and the
    // `PLATFORM-BASELINE-006` §33.3 P2-12 row: "checked-at-validation +
    // snapshot + no-distributed-txn + revalidate-live"). A Firestore
    // transaction cannot span this PostgreSQL transaction, so the residual
    // window — a revocation committing after this read but before COMMIT — is
    // inherent to the two-store architecture and is not newly introduced here.
    //
    // `requireAudit: false`: the accountable decision for this attempt was
    // already recorded above, under the same idempotency key.
    const reauthorized = await authorizeRedemptionConfirm(db, params.userId, params.businessId, {
      idempotencyKey: params.idempotencyKey,
      requireAudit: false,
    });
    const role = reauthorized.role;
    const membershipId = reauthorized.membershipId;

    const redeemedAt = new Date();
    const reward = await transitionRewardToRedeemed(tx, { rewardId, redeemedAt });
    if (!reward) {
      // Lost the conditional transition — fail closed.
      throw redemptionStaleStateError("redeemed");
    }

    const redemption = await insertRedemption(tx, {
      rewardId: reward.id,
      loyaltyCycleId: reward.loyaltyCycleId,
      businessId: reward.businessId,
      customerIdentityId: reward.customerIdentityId,
      rewardProgramId: reward.rewardProgramId,
      rewardProgramVersionId: reward.rewardProgramVersionId,
      confirmedByUserId: params.userId,
      // Individual attribution always comes from the mutation-boundary
      // re-resolution, so the recorded membership/role are the ones actually
      // in force at the instant the Reward changed state.
      confirmedByMembershipId: reauthorized.membershipId,
      confirmedByRole: reauthorized.role,
      idempotencyKey: params.idempotencyKey,
      correlationId: params.correlationId,
    });

    // The stream and governing-cycle locks above are already held (taken
    // before the Reward lock, in canonical order), so the close below
    // cannot wait on anything the verify path holds out of order — the
    // `40P01` inversion is gone, not retried.
    const completedCycle = await markCycleRewardRedeemed(tx, reward.loyaltyCycleId);
    if (!completedCycle) {
      // Lost the conditional close (or the Cycle was never reward_available).
      // Fail closed: the entire redemption rolls back.
      throw redemptionCycleStateError(governingCycle.state);
    }

    // Next-cycle version binding (`CAPABILITY-6-REDEMPTION-ENGINE-001-CORR-002`,
    // DEC-LOY-008 addendum 2026-09-28 / DEC-PROD-014): a Cycle's governing
    // version is the version of the FIRST Verified Unit allocated into it —
    // the same rule the verify path implements by opening under its opening
    // Purchase's creation-time snapshot version. The programme version that
    // happens to be current at redemption time MUST NOT govern: it would
    // make equivalent earning produce different Rewards depending on which
    // path opened the cycle.
    //
    // The pending positions are listed BEFORE the open (still after the
    // stream/cycle locks, so no order is inverted — no other path locks
    // pending rows, and same-stream redemptions already serialize on the
    // stream) because the FIRST position in deterministic forward-allocation
    // order is the first unit the new Cycle will hold, hence its governor.
    //
    // "Deterministic" here is the CORR-003 governed rule, not insertion
    // order: `listPendingAllocationPositions` orders by the underlying
    // Purchase's accepted commercial occurrence
    // (`purchase_record.purchase_date`, then `verified_unit_id`, then
    // `allocation_order`). Allocation-position `created_at` is database
    // scheduling and MUST NOT decide which unit is first, or two executions
    // of the same accepted earning history would bind different governing
    // versions (and different Reward terms) purely by transaction order.
    // With no pending units the Cycle opens EMPTY under the completed
    // Cycle's version as a provisional continuity value (the non-null
    // schema requires a version; no earning exists yet to bind) — and the
    // verify path adopts the first future allocation's version before any
    // unit lands (`adoptCycleGoverningVersionForFirstAllocation`), so the
    // provisional value can never decide Reward terms.
    const pendingPositions = await listPendingAllocationPositions(tx, {
      customerIdentityId: reward.customerIdentityId,
      rewardProgramId: reward.rewardProgramId,
    });
    const firstForwardVersionId =
      pendingPositions.length > 0
        ? pendingPositions[0].rewardProgramVersionId
        : completedCycle.openedUnderVersionId;
    let nextCycle = await openCycleUnderStreamLock(tx, {
      businessId: reward.businessId,
      customerIdentityId: reward.customerIdentityId,
      rewardProgramId: reward.rewardProgramId,
      openedUnderVersionId: firstForwardVersionId,
      correlationId: params.correlationId,
    });

    // Forward-allocate outstanding PENDING Verified Units in order (DEC-LOY-008:
    // "pending units apply forward in order once the reward is redeemed and the
    // next cycle is created, continuing sequentially across subsequent cycles").
    //
    // DEC-LOY-002 forbids ever holding two current Cycles, so allocation fills
    // the new Cycle only up to the threshold and then STOPS: if the new Cycle
    // reaches 10 it becomes `reward_available` (its own Reward) and the
    // remaining pending units wait for the following redemption, exactly as an
    // ordinary over-threshold verify leaves them pending.
    let capacity = LOYALTY_CYCLE_THRESHOLD - nextCycle.allocatedUnits;
    let allocatedForward = 0;
    const convertedPositionIds: string[] = [];
    for (const position of pendingPositions) {
      if (capacity <= 0) {
        break;
      }
      const move = Math.min(position.allocatedQuantity, capacity);
      const converted = await convertPendingPositionToAllocated(tx, {
        position,
        loyaltyCycleId: nextCycle.id,
        quantity: move,
        correlationId: params.correlationId,
      });
      await addAllocatedUnitsToCycle(tx, { cycleId: nextCycle.id, units: move });
      convertedPositionIds.push(converted.allocatedPositionId);
      allocatedForward += move;
      capacity -= move;
    }

    // Threshold crossing inside the new Cycle: BR-064/FR-RL-001 make the next
    // Reward available immediately at 10, and `rewards_one_per_cycle` makes it
    // exactly once. This is the existing verify-threshold mechanism reused
    // verbatim, not a second one.
    let nextReward: RewardRow | null = null;
    nextCycle = (await getCycleById(tx, nextCycle.id)) ?? nextCycle;
    if (nextCycle.state === "active" && nextCycle.allocatedUnits === LOYALTY_CYCLE_THRESHOLD) {
      const terms = await readVersionRewardTerms(tx, nextCycle.openedUnderVersionId);
      if (!terms) {
        throw purchaseValidationError(
          "The new Loyalty Cycle's governing Reward Program Version was not found.",
        );
      }
      nextReward = await insertRewardForCycle(tx, {
        loyaltyCycleId: nextCycle.id,
        businessId: reward.businessId,
        customerIdentityId: reward.customerIdentityId,
        rewardProgramId: reward.rewardProgramId,
        rewardProgramVersionId: nextCycle.openedUnderVersionId,
        rewardDescription: terms.rewardDescription,
        correlationId: params.correlationId,
      });
      nextCycle = await markCycleRewardAvailable(tx, nextCycle.id);
    }

    // Trust Events: the availability pair mirrored for redemption
    // (`0020`). Redemption is caused by a Business confirmation, not by a
    // Purchase lifecycle transition, so the causal Purchase columns are
    // NULL and the Redemption id is the causation.
    const rewardRedeemedEvent = await insertTrustEvent(tx, {
      eventType: "reward.redeemed",
      causalPurchaseRecordId: null,
      sourcePurchaseRecordEventId: null,
      subjectType: "reward",
      subjectId: reward.id,
      subjectRewardId: reward.id,
      businessId: reward.businessId,
      customerIdentityId: reward.customerIdentityId,
      actorType: role,
      actorId: params.userId,
      actorRole: role,
      correlationId: params.correlationId,
      payload: {
        rewardId: reward.id,
        loyaltyCycleId: reward.loyaltyCycleId,
        redemptionId: redemption.id,
        rewardProgramId: reward.rewardProgramId,
        rewardProgramVersionId: reward.rewardProgramVersionId,
        resultingState: "redeemed",
        confirmedByMembershipId: membershipId,
        confirmedByRole: role,
        redeemedAt: redeemedAt.toISOString(),
      },
    });
    await insertTrustEvent(tx, {
      eventType: "loyalty_cycle.reward_redeemed",
      causalPurchaseRecordId: null,
      sourcePurchaseRecordEventId: null,
      subjectType: "loyalty_cycle",
      subjectId: reward.loyaltyCycleId,
      subjectLoyaltyCycleId: reward.loyaltyCycleId,
      businessId: reward.businessId,
      customerIdentityId: reward.customerIdentityId,
      actorType: role,
      actorId: params.userId,
      actorRole: role,
      causationId: rewardRedeemedEvent.id,
      correlationId: params.correlationId,
      payload: {
        loyaltyCycleId: reward.loyaltyCycleId,
        rewardId: reward.id,
        redemptionId: redemption.id,
        // The Cycle genuinely transitions here: `reward_available` is a
        // CURRENT state, and this event is emitted only alongside the
        // conditional `markCycleRewardRedeemed` that moves it to the
        // canonical `reward_redeemed` state. It records a real transition,
        // not the arrival of a Reward.
        fromState: "reward_available",
        resultingState: "reward_redeemed",
        nextLoyaltyCycleId: nextCycle.id,
        nextLoyaltyCycleSequenceNumber: nextCycle.sequenceNumber,
        unitsAllocatedForward: allocatedForward,
        convertedAllocationPositionIds: convertedPositionIds,
      },
    });

    // A pending forward-allocation can carry the new Cycle straight to the
    // threshold. That is a real Reward becoming available, so the same
    // governed availability pair is disclosed (PRD07 §18 / TRD11 §11.26).
    // Causation is the redemption, not a Purchase lifecycle transition, so
    // the causal Purchase columns are NULL for these two types too.
    if (nextReward) {
      const nextRewardAvailableEvent = await insertTrustEvent(tx, {
        eventType: "reward.available",
        causalPurchaseRecordId: null,
        sourcePurchaseRecordEventId: null,
        subjectType: "reward",
        subjectId: nextReward.id,
        subjectRewardId: nextReward.id,
        businessId: reward.businessId,
        customerIdentityId: reward.customerIdentityId,
        actorType: "system",
        actorId: "loyalty-cycle-allocation",
        causationId: rewardRedeemedEvent.id,
        correlationId: params.correlationId,
        payload: {
          rewardId: nextReward.id,
          loyaltyCycleId: nextCycle.id,
          rewardProgramId: reward.rewardProgramId,
          rewardProgramVersionId: nextReward.rewardProgramVersionId,
          resultingState: "available",
          causedBy: "pending_verified_unit_forward_allocation",
          redemptionId: redemption.id,
        },
      });
      await insertTrustEvent(tx, {
        eventType: "loyalty_cycle.reward_available",
        causalPurchaseRecordId: null,
        sourcePurchaseRecordEventId: null,
        subjectType: "loyalty_cycle",
        subjectId: nextCycle.id,
        subjectLoyaltyCycleId: nextCycle.id,
        businessId: reward.businessId,
        customerIdentityId: reward.customerIdentityId,
        actorType: "system",
        actorId: "loyalty-cycle-allocation",
        causationId: nextRewardAvailableEvent.id,
        correlationId: params.correlationId,
        payload: {
          loyaltyCycleId: nextCycle.id,
          rewardId: nextReward.id,
          allocatedUnits: nextCycle.allocatedUnits,
          fromState: "active",
          resultingState: "reward_available",
          causedBy: "pending_verified_unit_forward_allocation",
        },
      });
    }

    // Notification Intents: the Customer learns the Reward is consumed and
    // the Business gets its own governed confirmation record. Both are
    // anchored on the redemption (Purchase columns NULL, `0020` shape
    // CHECK), with the partial unique index giving redemption intents the
    // same one-per-(source, type, recipient) dedup purchase intents have.
    await insertNotificationIntent(tx, {
      intentType: "reward_redeemed_customer",
      purchaseRecordId: null,
      sourcePurchaseRecordEventId: null,
      sourceRedemptionId: redemption.id,
      recipientType: "customer",
      recipientId: reward.customerIdentityId,
      payload: {
        redemptionId: redemption.id,
        rewardId: reward.id,
        loyaltyCycleId: reward.loyaltyCycleId,
        businessId: reward.businessId,
      },
      correlationId: params.correlationId,
    });
    await insertNotificationIntent(tx, {
      intentType: "reward_redeemed_business",
      purchaseRecordId: null,
      sourcePurchaseRecordEventId: null,
      sourceRedemptionId: redemption.id,
      recipientType: "business",
      recipientId: reward.businessId,
      payload: {
        redemptionId: redemption.id,
        rewardId: reward.id,
        loyaltyCycleId: reward.loyaltyCycleId,
      },
      correlationId: params.correlationId,
    });

    // The forward allocation may itself have made the NEXT Reward available.
    // PRD07 §18 governs notifying the Customer "when a reward becomes
    // available", and this one was not caused by a Purchase Record transition
    // but by pending Verified Units crossing into the new Cycle — so it is
    // anchored on the same redemption. Intent rows only; still no delivery.
    if (nextReward) {
      await insertNotificationIntent(tx, {
        intentType: "reward_available_customer",
        purchaseRecordId: null,
        sourcePurchaseRecordEventId: null,
        sourceRedemptionId: redemption.id,
        recipientType: "customer",
        recipientId: reward.customerIdentityId,
        payload: {
          redemptionId: redemption.id,
          rewardId: nextReward.id,
          loyaltyCycleId: nextCycle.id,
          businessId: reward.businessId,
          causedBy: "pending_verified_unit_forward_allocation",
        },
        correlationId: params.correlationId,
      });
    }

    const result: ConfirmRedemptionResult = {
      reward,
      redemption,
      completedLoyaltyCycleId: completedCycle.id,
      nextLoyaltyCycleId: nextCycle.id,
      unitsAllocatedForward: allocatedForward,
      nextReward,
    };
    await completeIdempotencyKeyInTransaction(tx, params.idempotencyKey, redemption.id, result);
    return result;
  });
}
