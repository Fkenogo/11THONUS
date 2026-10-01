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
 *  3. (via `admitPurchaseToLoyalty`, WP-COM-05a -- the write sequence below was
 *     extracted unchanged into that internal operation) creation-time version
 *     binding governs (snapshot, never re-resolved to program-current --
 *     FD-PVL-003);
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
 * WP-COM-05a/05b: the Commercial admission gate defaults to `off`, which always
 * admits -- behaviour is identical to before the extraction, no Commercial data
 * is read and no Commercial lock is taken. With the gate `enforce`d
 * (`admitOrHoldPurchase`) the result is a DISCRIMINATED outcome: `admitted`
 * (a Verified Unit exists) or `pending_admission` (valid, received and preserved,
 * not yet admitted -- NOT an error). A hold writes no Loyalty state, no Commercial
 * reservation and no admission idempotency key; re-verifying a held Purchase reports
 * its current state without forcing admission.
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
import { lockPurchaseRecordById } from "../repositories/purchaseRecordRepository";
import { admitPurchaseToLoyalty } from "./admitPurchaseToLoyalty";
import { admitOrHoldPurchase } from "./admitOrHoldPurchase";
import { decidePurchaseAdmission, resolvePurchaseAdmissionGateMode } from "./purchaseAdmissionGate";
import type { PurchaseAdmissionGateMode } from "./purchaseAdmissionGate";
import type { PurchaseAdmissionCapacityPort } from "./purchaseAdmissionPort";
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

/** The Purchase was admitted into Loyalty: a Verified Unit exists. */
export type VerifyPurchaseAdmitted = {
  /** Absent on responses stored before WP-COM-05b: treat a missing value as `admitted`. */
  readonly outcome?: "admitted";
  readonly purchase: PurchaseRecordRow;
  readonly verifiedUnit: VerifiedUnitRow;
  readonly cycle: LoyaltyCycleRow;
  readonly reward: RewardRow | null;
};

/**
 * WP-COM-05b: the Purchase is valid, received and preserved, but not yet admitted into
 * Loyalty (`pending_admission`). Not an error. No Verified Unit, Cycle or Reward exists, and
 * no commercial reason or figure is carried (Participants see no Commercial data).
 */
export type VerifyPurchaseHeld = {
  readonly outcome: "pending_admission";
  readonly purchase: PurchaseRecordRow;
};

export type VerifyPurchaseResult = VerifyPurchaseAdmitted | VerifyPurchaseHeld;

type VerifyPurchaseParams = {
  /** Server-resolved Customer Identity id (current auth chain — never a client claim). */
  readonly customerIdentityId: string;
  readonly request: VerifyPurchaseRequest;
  readonly idempotencyKey: string;
  readonly correlationId: string;
};

// Gate `off` (the default) can only admit, so its result type cannot be a hold.
export async function verifyPurchase(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: VerifyPurchaseParams & { readonly admissionGateMode?: "off" },
): Promise<VerifyPurchaseAdmitted>;
export async function verifyPurchase(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: VerifyPurchaseParams & {
    readonly admissionGateMode?: string;
    /** Required when the gate is `enforce`; bound at the composition root. */
    readonly commercialAdmission?: PurchaseAdmissionCapacityPort;
  },
): Promise<VerifyPurchaseResult>;
export async function verifyPurchase(
  _db: Firestore,
  pool: PlatformPostgresPool,
  params: VerifyPurchaseParams & {
    readonly admissionGateMode?: string;
    readonly commercialAdmission?: PurchaseAdmissionCapacityPort;
  },
): Promise<VerifyPurchaseResult> {
  const gateMode: PurchaseAdmissionGateMode = resolvePurchaseAdmissionGateMode(
    params.admissionGateMode,
  );
  if (gateMode === "enforce" && !params.commercialAdmission) {
    // Fail closed: never silently admit (or hold) without the Commercial decision.
    throw new Error('Purchase admission gate mode "enforce" requires a Commercial admission port.');
  }
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

    if (gateMode === "enforce") {
      const port = params.commercialAdmission as PurchaseAdmissionCapacityPort;
      if (locked.status === "pending_admission") {
        // Re-verifying a held Purchase reports its current state; it never forces admission
        // (that would bypass capacity) and writes nothing beyond completing this request's key.
        const heldAlready: VerifyPurchaseHeld = {
          outcome: "pending_admission",
          purchase: locked,
        };
        await completeIdempotencyKeyInTransaction(
          tx,
          params.idempotencyKey,
          locked.id,
          heldAlready,
        );
        return heldAlready;
      }
      if (locked.status !== "waiting_for_customer") {
        throw purchaseStaleStateError("waiting_for_customer", locked.status);
      }
      const decided = await admitOrHoldPurchase(tx, {
        locked,
        fromStatus: "waiting_for_customer",
        actor: { type: "customer", id: params.customerIdentityId },
        correlationId: params.correlationId,
        idempotencyKey: params.idempotencyKey,
        port,
        decidedBy: "customer_verify",
        onHold: "record",
      });
      const enforcedResult: VerifyPurchaseResult =
        decided.outcome === "held"
          ? { outcome: "pending_admission", purchase: decided.purchase }
          : {
              outcome: "admitted",
              purchase: decided.purchase,
              verifiedUnit: decided.verifiedUnit,
              cycle: decided.cycle,
              reward: decided.reward,
            };
      await completeIdempotencyKeyInTransaction(
        tx,
        params.idempotencyKey,
        locked.id,
        enforcedResult,
      );
      return enforcedResult;
    }

    if (locked.status !== "waiting_for_customer") {
      throw purchaseStaleStateError("waiting_for_customer", locked.status);
    }

    // Gate OFF => always admit (no Commercial read), in the original statement order.
    decidePurchaseAdmission(gateMode);
    const admitted = await admitPurchaseToLoyalty(tx, {
      locked,
      fromStatus: "waiting_for_customer",
      actor: { type: "customer", id: params.customerIdentityId },
      correlationId: params.correlationId,
      idempotencyKey: params.idempotencyKey,
    });

    const result: VerifyPurchaseAdmitted = admitted;
    await completeIdempotencyKeyInTransaction(
      tx,
      params.idempotencyKey,
      admitted.purchase.id,
      result,
    );
    return result;
  });
}
