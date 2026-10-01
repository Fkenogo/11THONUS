/**
 * `admitOrHoldPurchase` -- the ENFORCED Commercial admission decision
 * (`WP-COM-05b`; design §8.4, §8.13, §22.1, §22.3 sequences 1 and 2).
 *
 * One operation shared by the live customer verification and the held-Purchase
 * processor, so neither contains a copy of the other. It answers: *does this
 * valid Purchase require starting a new Circle position, and if so is there
 * usable Commercial capacity for it?*
 *
 * CALLER CONTRACT: runs inside the caller's `withPlatformTransaction`; the
 * caller has already taken the earlier locks -- [client idempotency key] then
 * the Purchase `FOR UPDATE` -- authorised the actor and checked the status
 * equals `fromStatus`.
 *
 * CONCRETE LOCK / WRITE SEQUENCE (the order is the proof, and is tested):
 *
 *   LOCK PHASE -- decision inputs; NOTHING is written for a Purchase that is held
 *     1. stream      ensure + lock `FOR UPDATE`
 *     2. cycle       lock the current Cycle `FOR UPDATE` (NOT opened here)
 *     3. read U      net admitted units of the stream (plain read under the stream lock)
 *        read the stream hold queue
 *     4. account     Commercial account `FOR UPDATE` -- ONLY if the Purchase begins new
 *                    Circle position(s) and its stream has no earlier hold (inside the port)
 *     5. read the Business hold queue (under the account lock) and DECIDE
 *
 *   HOLD  -> (live verify) `waiting_for_customer -> pending_admission` + a neutral,
 *            payload-free event + the Commercial audit row;
 *            (processor)   nothing at all. No idempotency key, no Verified Unit, no Cycle,
 *            no Reward, no Trust Event, no reservation, no earmark. A stream row this
 *            transaction created is discarded.
 *   ADMIT -> 6. reserve `admit:<purchase_id>` (only now -- after the locked decision)
 *            7. Purchase -> verified + event
 *            8. INSERT Verified Unit                       <- the PARENT row exists from here
 *            9. reservation ledger entry, admission row, earmark rows   (children, FK-safe)
 *           10. remaining Loyalty writes, unchanged (open Cycle if none, allocation, Reward,
 *               Trust Events, intents, outbox)
 *           11. complete `admit:<purchase_id>`
 *
 * No Reward lock, no price lock, and no Commercial lock before the Purchase, stream and
 * Cycle locks exist anywhere on this path. After step 4 no new `FOR UPDATE` is taken on any
 * existing Loyalty row. A Purchase continuing an already-admitted position (active-Circle
 * grace) takes NO Commercial lock and writes NO Commercial row.
 */

import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKeyInTransaction,
} from "../../rewardProgram/repositories/idempotencyRepository";
import {
  discardUnusedCycleStream,
  ensureAndLockCycleStreamTracked,
  lockCurrentCycle,
  sumAdmittedStreamUnits,
} from "../repositories/loyaltyCycleRepository";
import {
  appendPurchaseRecordEvent,
  existsEarlierHeldPurchaseInBusiness,
  existsEarlierHeldPurchaseInStream,
  transitionPurchaseToPendingAdmission,
  type PurchaseAdmissionSourceStatus,
} from "../repositories/purchaseRecordRepository";
import type { PurchaseActorType, PurchaseRecordRow } from "../models/purchase";
import {
  purchaseIdempotencyConflictError,
  purchaseIdempotencyInProgressError,
  purchaseStaleStateError,
} from "../models/purchaseErrors";
import {
  admitPurchaseToLoyalty,
  type AdmitPurchaseToLoyaltyResult,
} from "./admitPurchaseToLoyalty";
import {
  admissionIdempotencyKey,
  computeNewBlocks,
  computeStreamRef,
  type PurchaseAdmissionCapacityPort,
  type PurchaseAdmissionDecider,
  type PurchaseAdmissionHoldReason,
} from "./purchaseAdmissionPort";

export type AdmitOrHoldPurchaseParams = {
  /** The Purchase row, already locked `FOR UPDATE` by the caller in this transaction. */
  readonly locked: PurchaseRecordRow;
  readonly fromStatus: PurchaseAdmissionSourceStatus;
  readonly actor: { readonly type: PurchaseActorType; readonly id: string };
  readonly correlationId: string;
  /** Carried onto the outbox entries only (the client key on a live verify). */
  readonly idempotencyKey: string;
  readonly port: PurchaseAdmissionCapacityPort;
  readonly decidedBy: PurchaseAdmissionDecider;
  /**
   * `record`: a HOLD transitions the Purchase to `pending_admission` and writes its event
   * (live verify). `none`: a HOLD writes nothing (processor re-evaluation of an already
   * held Purchase). Either way a HOLD never touches an idempotency key.
   */
  readonly onHold: "record" | "none";
};

export type AdmitOrHoldPurchaseResult =
  | ({ readonly outcome: "admitted" } & AdmitPurchaseToLoyaltyResult)
  | {
      readonly outcome: "held";
      readonly purchase: PurchaseRecordRow;
      readonly reason: PurchaseAdmissionHoldReason;
    };

export async function admitOrHoldPurchase(
  tx: PlatformPostgresTransaction,
  params: AdmitOrHoldPurchaseParams,
): Promise<AdmitOrHoldPurchaseResult> {
  const locked = params.locked;
  const stream = {
    businessId: locked.businessId,
    customerIdentityId: locked.customerIdentityId,
    rewardProgramId: locked.rewardProgramId,
  };
  // The processor judges a candidate against Purchases ahead of it in FIFO order; a live
  // verify (the Purchase is not yet queued) is judged against every held Purchase.
  const ordering = {
    excludePurchaseId: locked.id,
    ahead:
      params.fromStatus === "pending_admission"
        ? { purchaseDate: locked.purchaseDate, id: locked.id }
        : null,
  };

  // ---- LOCK PHASE (nothing is written for a held Purchase) -----------------------------
  const { created: streamCreated } = await ensureAndLockCycleStreamTracked(tx, stream);
  const cycle = await lockCurrentCycle(tx, {
    customerIdentityId: locked.customerIdentityId,
    rewardProgramId: locked.rewardProgramId,
  });
  const unitsBefore = await sumAdmittedStreamUnits(tx, stream);
  const { newBlocks, firstBlockIndex } = computeNewBlocks(unitsBefore, locked.quantity);
  const streamHasEarlierHold = await existsEarlierHeldPurchaseInStream(tx, {
    ...stream,
    ...ordering,
  });

  const evaluation = await params.port.evaluate(tx, {
    businessId: locked.businessId,
    newBlocks,
    firstBlockIndex,
    streamHasEarlierHold,
    readBusinessQueue: async (queueTx) => ({
      earlierHeldInBusiness: await existsEarlierHeldPurchaseInBusiness(queueTx, {
        businessId: locked.businessId,
        ...ordering,
      }),
    }),
  });

  // ---- HOLD -----------------------------------------------------------------------------
  if (evaluation.outcome === "hold") {
    if (streamCreated) {
      // No Loyalty structure survives a hold.
      await discardUnusedCycleStream(tx, stream);
    }
    if (params.onHold === "none") {
      return { outcome: "held", purchase: locked, reason: evaluation.reason };
    }
    const held = await transitionPurchaseToPendingAdmission(tx, { purchaseId: locked.id });
    if (!held) {
      throw purchaseStaleStateError(params.fromStatus, locked.status);
    }
    await appendPurchaseRecordEvent(tx, {
      purchaseRecordId: held.id,
      fromStatus: params.fromStatus,
      toStatus: "pending_admission",
      actorType: params.actor.type,
      actorId: params.actor.id,
      // Deliberately neutral and payload-free: the Purchase event is read by Customers and by
      // Business staff, who must see no commercial reason or figure (FD-D). The decision
      // snapshot (hold reason, availability) lives in the Commercial audit row only.
      reason: "awaiting_admission",
      eventPayload: null,
      correlationId: params.correlationId,
    });
    await params.port.recordHold(tx, {
      businessId: locked.businessId,
      purchaseRecordId: held.id,
      reason: evaluation.reason,
      snapshot: evaluation.snapshot,
      correlationId: params.correlationId,
    });
    return { outcome: "held", purchase: held, reason: evaluation.reason };
  }

  // ---- ADMIT ----------------------------------------------------------------------------
  // The admission key is reserved ONLY NOW, after the locked ADMIT decision (CORR-002). The
  // Purchase lock makes this transaction the only possible holder, so it cannot wait.
  const admitKey = admissionIdempotencyKey(locked.id);
  const reservation = await checkAndReserveIdempotencyKey(tx, {
    idempotencyKey: admitKey,
    operationType: "purchase.admit",
    actorId: params.actor.id,
    requestHash: `purchase.admit:${locked.id}`,
    correlationId: params.correlationId,
  });
  if (reservation.outcome === "in_progress") throw purchaseIdempotencyInProgressError();
  if (reservation.outcome === "conflict") throw purchaseIdempotencyConflictError();
  if (reservation.outcome === "duplicate") {
    // A completed admission for a Purchase that is not yet verified cannot exist.
    throw purchaseStaleStateError(params.fromStatus, locked.status);
  }

  const plan = evaluation.plan;
  const streamRef = computeStreamRef(stream);
  const admitted = await admitPurchaseToLoyalty(tx, {
    locked,
    fromStatus: params.fromStatus,
    actor: params.actor,
    correlationId: params.correlationId,
    idempotencyKey: params.idempotencyKey,
    lockedAllocation: { cycle },
    afterVerifiedUnit:
      plan === null
        ? undefined
        : async (hookTx, ctx) => {
            await params.port.recordAdmission(hookTx, {
              businessId: ctx.purchase.businessId,
              purchaseRecordId: ctx.purchase.id,
              verifiedUnitId: ctx.verifiedUnit.id,
              streamRef,
              plan,
              decidedBy: params.decidedBy,
              admissionScopeKey: admitKey,
              correlationId: params.correlationId,
            });
          },
  });
  await completeIdempotencyKeyInTransaction(tx, admitKey, admitted.purchase.id, {
    outcome: "admitted",
    purchaseRecordId: admitted.purchase.id,
    verifiedUnitId: admitted.verifiedUnit.id,
    blocksReserved: plan?.blocks.length ?? 0,
  });
  return { outcome: "admitted", ...admitted };
}
