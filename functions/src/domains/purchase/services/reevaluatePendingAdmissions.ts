/**
 * `reevaluatePendingAdmissions` -- repeat-safe processor for held Purchases
 * (`WP-COM-05b`, `CORR-001`; design §8.11-§8.13, §22.3 sequence 2).
 *
 * POLICY: FIFO SCAN ORDER + SKIP-AND-CONTINUE (Founder decision, CORR-001). Strict
 * first-fit-blocks-the-queue ("stop at the first Purchase that does not fit") is NOT used:
 * a Purchase's admission cost (`newBlocks`) varies, so one large held Purchase must not
 * starve smaller later ones that fit.
 *
 * A callable service, not a scheduler: nothing in THIS file is scheduled or signalled
 * (`WP-COM-06a` invokes it from `heldPurchaseRecovery.ts`, which the composition root wires to a
 * post-commit signal and to a periodic recovery function). Per Business it examines `pending_admission` Purchases in deterministic oldest-first
 * order `(purchase_date ASC, id ASC)`, ONE TRANSACTION PER PURCHASE:
 *
 *   Purchase lock `FOR UPDATE` (a Purchase that is no longer `pending_admission` is
 *   `not_pending` and ignored) -> stream -> Cycle -> [account] -> DECISION.
 *     HOLD  -> the transaction writes NOTHING (no key, no row, no state change); the Purchase
 *              stays `pending_admission` and the scan CONTINUES with the next-oldest.
 *     ADMIT -> the same `admitOrHoldPurchase` ADMIT path as a live verification, with the
 *              `system` actor: reserve `admit:<purchase_id>` after the decision, Verified
 *              Unit first, Commercial children after it, the remaining Loyalty writes.
 *
 * What still orders Purchases: (1) the scan order itself, oldest first, every run; (2) the
 * STREAM rule -- a Purchase is not admitted while an OLDER Purchase of the same customer/program
 * stream is still held, so units enter a stream in order. The Business-wide "no overtaking"
 * rule (design §8.11 rule 2) is deliberately NOT applied by the processor: that rule is exactly
 * what would re-create head-of-line blocking.
 *
 * RESIDUAL STARVATION RISK (recorded, not mitigated here): because larger-cost Purchases can
 * be skipped while smaller ones continue to be admitted, a large Purchase can stay held for a
 * long time under sustained small admissions. Every run re-evaluates it first (oldest-first);
 * no priority aging, reservation guarantee or hidden queue exists. A later operational policy
 * can add one if observed backlog warrants it.
 *
 * Safe to repeat and to run concurrently: per-Purchase transactions serialise on the Purchase
 * lock, capacity decisions serialise on the Commercial account lock, the loser of a race sees
 * `not_pending`, and a hold never leaves an idempotency reservation behind that could poison
 * another worker. Restoration of capacity (a settlement, a credit, a trial grant, restoring
 * standing) only PERMITS admission; it never admits by itself -- this processor does.
 */

import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import { withPlatformTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import {
  listBusinessesWithPendingAdmission,
  lockPurchaseRecordById,
} from "../repositories/purchaseRecordRepository";
import {
  listPendingAdmissionWindow,
  readPurchaseStatus,
  type PendingScanCursor,
} from "../repositories/heldPurchaseRecoveryRepository";
import { classifyAdmissionFailure } from "./admissionFailureClassification";
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
  /**
   * Upper bound of held Purchases examined per Business in one pass, oldest first (default
   * 1000). Skip-and-continue examines the whole window every pass, so a Purchase beyond it is
   * not examined until older ones are admitted.
   */
  readonly maxPerBusiness?: number;
  /** Upper bound of Businesses examined when `businessId` is omitted (default 100). */
  readonly maxBusinesses?: number;
  /**
   * `WP-COM-06a`: resume the FIFO scan STRICTLY AFTER this position (a continuation window beyond
   * the head window). Omit for the normal head window. Only meaningful with `businessId`.
   */
  readonly after?: PendingScanCursor | null;
  /** Extra attempts for a TRANSIENT per-Purchase failure (default 1). */
  readonly transientRetries?: number;
  /**
   * Delay before a transient retry (`100 ms x attempt`). Supplied by the caller
   * (`heldPurchaseRecovery.ts` passes a real timer); the processor itself schedules nothing and
   * retries immediately when none is given.
   */
  readonly sleep?: (ms: number) => Promise<void>;
  /** Called for every per-Purchase failure that is not a concurrency winner. Must not throw. */
  readonly onPurchaseFailure?: (failure: PurchaseProcessingFailure) => void;
};

export type PurchaseProcessingFailure = {
  readonly businessId: string;
  readonly purchaseId: string;
  readonly failureClass: "transient" | "permanent";
  readonly code: string;
};

export type PendingAdmissionOutcome =
  | { readonly purchaseId: string; readonly outcome: "admitted" }
  | {
      readonly purchaseId: string;
      readonly outcome: "held";
      readonly reason: PurchaseAdmissionHoldReason;
    }
  | { readonly purchaseId: string; readonly outcome: "not_pending" }
  | {
      readonly purchaseId: string;
      readonly outcome: "failed";
      readonly failureClass: "transient" | "permanent";
      readonly code: string;
    };

/** What one Business pass examined (scan-window observability, `WP-COM-06a`). */
export type BusinessScanStats = {
  readonly businessId: string;
  /** Rows examined in this pass (<= `windowLimit`). */
  readonly examined: number;
  readonly windowLimit: number;
  /** More held Purchases exist beyond this window: it was SATURATED. */
  readonly saturated: boolean;
  /** FIFO position of the last row examined; the resume point for a continuation window. */
  readonly lastCursor: PendingScanCursor | null;
  readonly admitted: number;
  readonly held: number;
  readonly heldByReason: Readonly<Partial<Record<PurchaseAdmissionHoldReason, number>>>;
  /**
   * Held for `insufficient_capacity` while a YOUNGER Purchase of this Business was admitted in
   * the same pass -- the large-cost starvation indicator the policy's "residual risk" names.
   */
  readonly skippedOvertaken: number;
  readonly notPending: number;
  readonly failedTransient: number;
  readonly failedPermanent: number;
  /** Set when the whole Business pass failed (e.g. its window query); other Businesses continue. */
  readonly passError?: { readonly code: string };
};

export type ReevaluatePendingAdmissionsResult = {
  readonly results: readonly PendingAdmissionOutcome[];
  readonly admittedCount: number;
  readonly heldCount: number;
  readonly notPendingCount: number;
  readonly failedCount: number;
  readonly businesses: readonly BusinessScanStats[];
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
  const stats: BusinessScanStats[] = [];
  for (const businessId of businesses) {
    const pass = await reevaluateBusinessWindow(pool, params, businessId);
    results.push(...pass.results);
    stats.push(pass.stats);
  }
  return {
    results,
    admittedCount: results.filter((r) => r.outcome === "admitted").length,
    heldCount: results.filter((r) => r.outcome === "held").length,
    notPendingCount: results.filter((r) => r.outcome === "not_pending").length,
    failedCount: results.filter((r) => r.outcome === "failed").length,
    businesses: stats,
  };
}

/**
 * One bounded FIFO window of one Business. Never throws: a failing Purchase is recorded and the
 * scan continues with the next-oldest; a failing window query is recorded as `passError`.
 */
async function reevaluateBusinessWindow(
  pool: PlatformPostgresPool,
  params: ReevaluatePendingAdmissionsParams,
  businessId: string,
): Promise<{ results: PendingAdmissionOutcome[]; stats: BusinessScanStats }> {
  const windowLimit = params.maxPerBusiness ?? 1000;
  const results: PendingAdmissionOutcome[] = [];
  const heldByReason: Partial<Record<PurchaseAdmissionHoldReason, number>> = {};
  let lastCursor: PendingScanCursor | null = null;
  let saturated = false;
  let passError: { code: string } | undefined;
  try {
    const window = await listPendingAdmissionWindow(pool, {
      businessId,
      limit: windowLimit,
      after: params.after ?? null,
    });
    saturated = window.hasMore;
    for (const row of window.rows) {
      const outcome = await reevaluateOneIsolated(pool, params, businessId, row.id);
      results.push(outcome);
      lastCursor = row.cursor;
      if (outcome.outcome === "held") {
        heldByReason[outcome.reason] = (heldByReason[outcome.reason] ?? 0) + 1;
      }
      // Skip-and-continue: a Purchase that does not fit stays `pending_admission`, unchanged,
      // and the scan moves on to the next-oldest one.
    }
  } catch (error) {
    passError = { code: classifyAdmissionFailure(error).code };
  }
  const count = (o: PendingAdmissionOutcome["outcome"]) =>
    results.filter((r) => r.outcome === o).length;
  const failed = results.filter(
    (r): r is Extract<PendingAdmissionOutcome, { outcome: "failed" }> => r.outcome === "failed",
  );
  const stats: BusinessScanStats = {
    businessId,
    examined: results.length,
    windowLimit,
    saturated,
    lastCursor,
    admitted: count("admitted"),
    held: count("held"),
    heldByReason,
    skippedOvertaken: countOvertaken(results),
    notPending: count("not_pending"),
    failedTransient: failed.filter((f) => f.failureClass === "transient").length,
    failedPermanent: failed.filter((f) => f.failureClass === "permanent").length,
    ...(passError === undefined ? {} : { passError }),
  };
  return { results, stats };
}

function countOvertaken(results: readonly PendingAdmissionOutcome[]): number {
  let lastAdmitted = -1;
  results.forEach((r, i) => {
    if (r.outcome === "admitted") lastAdmitted = i;
  });
  return results.filter(
    (r, i) => i < lastAdmitted && r.outcome === "held" && r.reason === "insufficient_capacity",
  ).length;
}

/**
 * One Purchase with failure isolation (`WP-COM-06a`). Returns an outcome for EVERY Purchase:
 * a TRANSIENT failure is retried (bounded); a concurrency winner is `not_pending` (confirmed by
 * a fresh read); anything else is a recorded `failed` outcome. It never throws.
 */
async function reevaluateOneIsolated(
  pool: PlatformPostgresPool,
  params: ReevaluatePendingAdmissionsParams,
  businessId: string,
  purchaseId: string,
): Promise<PendingAdmissionOutcome> {
  const retries = params.transientRetries ?? 1;
  const sleep = params.sleep ?? (async () => {});
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await reevaluateOne(pool, params, purchaseId);
    } catch (error) {
      let classified = classifyAdmissionFailure(error);
      if (classified.failureClass === "concurrent_winner") {
        // Trust but verify: a stale-state error is a benign race ONLY if the Purchase really
        // moved on. A still-pending Purchase with a state error is an invariant breach.
        let status: string | null | undefined;
        try {
          status = await readPurchaseStatus(pool, purchaseId);
        } catch {
          status = undefined;
        }
        if (status !== undefined && status !== "pending_admission") {
          return { purchaseId, outcome: "not_pending" };
        }
        classified =
          status === undefined
            ? { failureClass: "transient", code: "STATUS_READ_FAILED" }
            : { failureClass: "permanent", code: "INVARIANT_STATE_ERROR_WHILE_PENDING" };
      }
      if (classified.failureClass === "transient" && attempt < retries) {
        await sleep(100 * (attempt + 1));
        continue;
      }
      const failureClass = classified.failureClass === "transient" ? "transient" : "permanent";
      try {
        params.onPurchaseFailure?.({ businessId, purchaseId, failureClass, code: classified.code });
      } catch {
        // An observer must never break the pass.
      }
      return { purchaseId, outcome: "failed", failureClass, code: classified.code };
    }
  }
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
      // Skip-and-continue: the Business-wide no-overtaking rule is not applied here.
      applyBusinessQueue: false,
    });
    return decided.outcome === "held"
      ? { purchaseId, outcome: "held", reason: decided.reason }
      : { purchaseId, outcome: "admitted" };
  });
}
