/**
 * `reevaluatePendingAdmissions` -- repeat-safe processor for held Purchases
 * (`WP-COM-05b`; design §8.11-§8.13, §22.3 sequence 2).
 *
 * A callable service, not a scheduler: nothing here is scheduled (no scheduler
 * exists in the repository; that belongs to a later package). It re-evaluates
 * `pending_admission` Purchases in deterministic FIFO order
 * `(purchase_date ASC, id ASC)`, ONE TRANSACTION PER PURCHASE:
 *
 *   Purchase lock `FOR UPDATE` (a Purchase that is no longer `pending_admission` is
 *   `not_pending` and ignored) -> stream -> Cycle -> [account] -> DECISION.
 *     HOLD  -> the transaction writes NOTHING (no key, no row, no state change) and the pass
 *              STOPS for that Business: a later Purchase never overtakes an earlier one.
 *     ADMIT -> the same `admitOrHoldPurchase` ADMIT path as a live verification, with the
 *              `system` actor: reserve `admit:<purchase_id>` after the decision, Verified
 *              Unit first, Commercial children after it, the remaining Loyalty writes.
 *
 * Safe to repeat and to run concurrently: per-Purchase transactions serialise on the
 * Purchase lock, the loser sees `not_pending`, and a hold never leaves an idempotency
 * reservation behind that could poison another worker. Restoration of capacity (a settlement,
 * a credit, a trial grant, restoring standing) only PERMITS admission; it never admits by
 * itself -- this processor does.
 */

import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import { withPlatformTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import {
  listBusinessesWithPendingAdmission,
  listPendingAdmissionPurchaseIds,
  lockPurchaseRecordById,
} from "../repositories/purchaseRecordRepository";
import type { PurchaseActorType } from "../models/purchase";
import { admitOrHoldPurchase } from "./admitOrHoldPurchase";
import {
  admissionIdempotencyKey,
  type PurchaseAdmissionCapacityPort,
  type PurchaseAdmissionHoldReason,
} from "./purchaseAdmissionPort";

/** The system actor that authors a re-admission (design §8.12). */
export const ADMISSION_PROCESSOR_ACTOR: {
  readonly type: PurchaseActorType;
  readonly id: string;
} = { type: "system", id: "system:commercial-admission" };

export type ReevaluatePendingAdmissionsParams = {
  /** Omit to process every Business that currently holds a Purchase. */
  readonly businessId?: string;
  readonly port: PurchaseAdmissionCapacityPort;
  readonly correlationId: string;
  /** Upper bound of Purchases examined per Business in one pass (default 100). */
  readonly maxPerBusiness?: number;
  /** Upper bound of Businesses examined when `businessId` is omitted (default 100). */
  readonly maxBusinesses?: number;
};

export type PendingAdmissionOutcome =
  | { readonly purchaseId: string; readonly outcome: "admitted" }
  | {
      readonly purchaseId: string;
      readonly outcome: "held";
      readonly reason: PurchaseAdmissionHoldReason;
    }
  | { readonly purchaseId: string; readonly outcome: "not_pending" };

export type ReevaluatePendingAdmissionsResult = {
  readonly results: readonly PendingAdmissionOutcome[];
  readonly admittedCount: number;
  readonly heldCount: number;
  readonly notPendingCount: number;
};

export async function reevaluatePendingAdmissions(
  pool: PlatformPostgresPool,
  params: ReevaluatePendingAdmissionsParams,
): Promise<ReevaluatePendingAdmissionsResult> {
  const businesses =
    params.businessId !== undefined
      ? [params.businessId]
      : await listBusinessesWithPendingAdmission(pool, params.maxBusinesses ?? 100);

  const results: PendingAdmissionOutcome[] = [];
  for (const businessId of businesses) {
    const candidates = await listPendingAdmissionPurchaseIds(pool, {
      businessId,
      limit: params.maxPerBusiness ?? 100,
    });
    for (const purchaseId of candidates) {
      const outcome = await reevaluateOne(pool, params, purchaseId);
      results.push(outcome);
      // No overtaking (design §8.11): stop at the first Purchase that still does not fit.
      if (outcome.outcome === "held") break;
    }
  }
  return {
    results,
    admittedCount: results.filter((r) => r.outcome === "admitted").length,
    heldCount: results.filter((r) => r.outcome === "held").length,
    notPendingCount: results.filter((r) => r.outcome === "not_pending").length,
  };
}

/** One Purchase, one transaction. Exported for focused testing; prefer `reevaluatePendingAdmissions`. */
export async function reevaluateOne(
  pool: PlatformPostgresPool,
  params: Pick<ReevaluatePendingAdmissionsParams, "port" | "correlationId">,
  purchaseId: string,
): Promise<PendingAdmissionOutcome> {
  return withPlatformTransaction(pool, async (tx): Promise<PendingAdmissionOutcome> => {
    const locked = await lockPurchaseRecordById(tx, purchaseId);
    if (!locked || locked.status !== "pending_admission") {
      return { purchaseId, outcome: "not_pending" };
    }
    const decided = await admitOrHoldPurchase(tx, {
      locked,
      fromStatus: "pending_admission",
      actor: ADMISSION_PROCESSOR_ACTOR,
      correlationId: params.correlationId,
      idempotencyKey: admissionIdempotencyKey(locked.id),
      port: params.port,
      decidedBy: "admission_processor",
      onHold: "none",
    });
    return decided.outcome === "held"
      ? { purchaseId, outcome: "held", reason: decided.reason }
      : { purchaseId, outcome: "admitted" };
  });
}
