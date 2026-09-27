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
 *     authorises it);
 *  2. peek the idempotency key (a genuine same-key/same-request replay of
 *     an already-completed confirmation returns the stored result without
 *     re-running any precondition);
 *  3. one transaction: reserve the key → LOCK the Reward → re-check
 *     existence/ownership/state → conditional `available → redeemed` →
 *     write the redemption evidence row → Trust Events → Notification
 *     Intents → complete the key → COMMIT.
 *
 * Exactly-once is enforced at four independent layers: the idempotency
 * key, the `FOR UPDATE` lock, the conditional `UPDATE … WHERE state =
 * 'available'`, and the `redemptions_one_per_reward` unique constraint.
 * There is never a second successful transition for one Reward.
 *
 * NO cycle mutation: the cycle was already `reward_available` when the
 * Reward was created and is left untouched. No reversal, restoration, or
 * undo path exists here (`DEC-LOY-004`).
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
  transitionRewardToRedeemed,
  insertRedemption,
} from "../repositories/redemptionRepository";
import { insertTrustEvent } from "../repositories/trustEventRepository";
import { insertNotificationIntent } from "../repositories/purchaseOutboxRepository";
import type { RedemptionRow, RewardRow } from "../models/purchase";
import {
  purchaseIdempotencyConflictError,
  purchaseIdempotencyInProgressError,
  purchaseValidationError,
  redemptionRewardNotFoundError,
  redemptionStaleStateError,
  redemptionTenantIsolationError,
} from "../models/purchaseErrors";

export type ConfirmRedemptionRequest = {
  readonly rewardId: string;
};

export type ConfirmRedemptionResult = {
  readonly reward: RewardRow;
  readonly redemption: RedemptionRow;
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

  // Live authority, resolved on EVERY attempt before any state is read or
  // written. Never skipped, never cached, never taken from the request.
  const { role, membershipId } = await authorizeRedemptionConfirm(
    db,
    params.userId,
    params.businessId,
  );

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

    // Lock first, then read every authoritative field off the LOCKED row.
    const locked = await lockRewardById(tx, rewardId);
    if (!locked) {
      throw redemptionRewardNotFoundError(rewardId);
    }
    // Tenant isolation: ownership is a property of the persisted Reward,
    // never of the request. A membership in another Business confers
    // nothing here even if it somehow held the permission.
    if (locked.businessId !== params.businessId) {
      throw redemptionTenantIsolationError();
    }
    if (locked.state !== "available") {
      throw redemptionStaleStateError(locked.state);
    }

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
      confirmedByMembershipId: membershipId,
      confirmedByRole: role,
      idempotencyKey: params.idempotencyKey,
      correlationId: params.correlationId,
    });

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
        resultingState: "redeemed",
      },
    });

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

    const result: ConfirmRedemptionResult = { reward, redemption };
    await completeIdempotencyKeyInTransaction(tx, params.idempotencyKey, redemption.id, result);
    return result;
  });
}
