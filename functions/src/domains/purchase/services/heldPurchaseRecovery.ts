/**
 * Held-Purchase processor activation and recovery (`WP-COM-06a`).
 *
 * Orchestrates the canonical `reevaluatePendingAdmissions` (`WP-COM-05b`) for two callers and
 * adds NO admission logic of its own: every admission still goes through
 * `admitOrHoldPurchase` under the Purchase, stream, Cycle and Commercial-account locks, so FIFO
 * scan, skip-and-continue, same-stream ordering and the capacity policy are exactly 05b's.
 *
 *   processBusinessHeldPurchases -- ONE Business. Used by the post-commit signal handler
 *       (best-effort, coalesced per Business + time window upstream) and by recovery.
 *   runHeldPurchaseRecovery      -- a bounded, fair sweep across Businesses (periodic recovery
 *       for missed signals).
 *
 * FAIRNESS (no starvation):
 *   - Across Businesses: Businesses are listed in a STABLE keyset order (`business_id`) after a
 *     PERSISTED cursor, `maxBusinesses` per run; the cursor advances after every Business and
 *     wraps to the start when the list is exhausted. Every Business holding a Purchase is
 *     therefore reached within ceil(B / maxBusinesses) + 1 runs, however large B is.
 *   - Within a Business: the HEAD window (oldest `maxPerBusiness`) is examined on every pass, so
 *     FIFO priority is untouched. When the head window is SATURATED (more held Purchases exist
 *     beyond it), one more TAIL window is examined strictly after a persisted tail cursor
 *     (initially: right after the head window), advancing each pass and wrapping when exhausted.
 *     A permanently-held head window therefore cannot hide rows beyond it forever.
 *
 * ISOLATION: a failing Purchase is recorded and the pass continues; a failing Business is
 * recorded and the run continues; state-store (cursor) failures degrade to "head window only"
 * / "start from the beginning" and are reported, never fatal.
 *
 * Pure orchestration: no Firebase, no scheduler, no logger import. The composition root supplies
 * the state store and observer, and binds the wiring to Cloud Functions.
 */

import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import {
  getHeldPurchaseBacklog,
  listBusinessesWithPendingAdmissionAfter,
  type HeldPurchaseBacklog,
  type PendingScanCursor,
} from "../repositories/heldPurchaseRecoveryRepository";
import { classifyAdmissionFailure } from "./admissionFailureClassification";
import type { PurchaseAdmissionCapacityPort } from "./purchaseAdmissionPort";
import {
  reevaluatePendingAdmissions,
  type BusinessScanStats,
  type PurchaseProcessingFailure,
} from "./reevaluatePendingAdmissions";

export const DEFAULT_MAX_BUSINESSES_PER_RUN = 100;
export const DEFAULT_MAX_PURCHASES_PER_BUSINESS_WINDOW = 1000;
/** Stop starting new Businesses after this long (the Function timeout is larger). */
export const DEFAULT_RUN_BUDGET_MS = 240_000;

/** Persisted continuation state (fairness). Implemented over Firestore by the composition root. */
export interface HeldPurchaseRecoveryStateStore {
  getBusinessCursor(): Promise<string | null>;
  setBusinessCursor(cursor: string | null): Promise<void>;
  getTailCursor(businessId: string): Promise<PendingScanCursor | null>;
  setTailCursor(businessId: string, cursor: PendingScanCursor | null): Promise<void>;
}

export type BusinessPassSummary = {
  readonly businessId: string;
  readonly trigger: "signal" | "recovery";
  readonly correlationId: string;
  readonly head: BusinessScanStats;
  readonly tail: BusinessScanStats | null;
  /** The head window was saturated: held Purchases exist beyond it. */
  readonly headSaturated: boolean;
  /** The tail cursor could not be read/written (fairness degraded for this pass). */
  readonly stateError: boolean;
  readonly durationMs: number;
};

export type HeldPurchaseRunSummary = {
  readonly correlationId: string;
  readonly status: "succeeded" | "partial" | "failed";
  readonly startedAt: Date;
  readonly durationMs: number;
  readonly businessesExamined: number;
  readonly businessesFailed: number;
  readonly businessesSaturated: number;
  readonly purchasesExamined: number;
  readonly admittedFromPending: number;
  readonly stillHeld: number;
  readonly skippedForCapacity: number;
  readonly skippedOvertaken: number;
  readonly notPending: number;
  readonly failedTransient: number;
  readonly failedPermanent: number;
  readonly cursorStart: string | null;
  readonly cursorEnd: string | null;
  /** The run reached the end of the Business list and reset the cursor. */
  readonly wrapped: boolean;
  /** The run stopped early on its time budget; the cursor marks where the next run resumes. */
  readonly budgetExhausted: boolean;
  readonly stateError: boolean;
  readonly backlog: HeldPurchaseBacklog | null;
  readonly errorCode?: string;
};

export interface HeldPurchaseProcessorObserver {
  purchaseFailure?(failure: PurchaseProcessingFailure & { readonly correlationId: string }): void;
  businessPass?(summary: BusinessPassSummary): void;
  runCompleted?(summary: HeldPurchaseRunSummary): Promise<void> | void;
}

export type HeldPurchaseProcessorDeps = {
  readonly pool: PlatformPostgresPool;
  readonly port: PurchaseAdmissionCapacityPort;
  readonly store: HeldPurchaseRecoveryStateStore;
  readonly observer?: HeldPurchaseProcessorObserver;
  readonly now?: () => Date;
  readonly maxBusinesses?: number;
  readonly maxPerBusiness?: number;
  readonly runBudgetMs?: number;
  readonly sleep?: (ms: number) => Promise<void>;
};

const realSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function safe(fn: (() => unknown) | undefined): Promise<void> {
  if (fn === undefined) return;
  try {
    await fn();
  } catch {
    // An observer failing must never break processing. (Observers are logging/persistence
    // adapters; they report their own failures.)
  }
}

/** One Business: head window, then (only if the head is saturated) one rotating tail window. */
export async function processBusinessHeldPurchases(
  deps: HeldPurchaseProcessorDeps,
  params: {
    readonly businessId: string;
    readonly trigger: "signal" | "recovery";
    readonly correlationId: string;
  },
): Promise<BusinessPassSummary> {
  const now = deps.now ?? (() => new Date());
  const started = now().getTime();
  const maxPerBusiness = deps.maxPerBusiness ?? DEFAULT_MAX_PURCHASES_PER_BUSINESS_WINDOW;
  const base = {
    pool: deps.pool,
    port: deps.port,
    correlationId: params.correlationId,
    maxPerBusiness,
    sleep: deps.sleep ?? realSleep,
    onPurchaseFailure: (failure: PurchaseProcessingFailure) => {
      void safe(() =>
        deps.observer?.purchaseFailure?.({ ...failure, correlationId: params.correlationId }),
      );
    },
  };

  const headResult = await reevaluatePendingAdmissions(deps.pool, {
    ...base,
    businessId: params.businessId,
  });
  const head = headResult.businesses[0]!;
  let tail: BusinessScanStats | null = null;
  let stateError = false;

  if (head.passError === undefined) {
    if (head.saturated) {
      let after: PendingScanCursor | null = head.lastCursor;
      try {
        after = (await deps.store.getTailCursor(params.businessId)) ?? head.lastCursor;
      } catch {
        stateError = true;
      }
      if (after !== null) {
        const tailResult = await reevaluatePendingAdmissions(deps.pool, {
          ...base,
          businessId: params.businessId,
          after,
        });
        tail = tailResult.businesses[0]!;
        if (tail.passError === undefined) {
          try {
            // More beyond the tail window: resume after it next time. Exhausted: wrap (clear).
            await deps.store.setTailCursor(
              params.businessId,
              tail.saturated ? tail.lastCursor : null,
            );
          } catch {
            stateError = true;
          }
        }
      }
    } else {
      // No rows beyond the head window any more: drop a stale tail cursor.
      try {
        if ((await deps.store.getTailCursor(params.businessId)) !== null) {
          await deps.store.setTailCursor(params.businessId, null);
        }
      } catch {
        stateError = true;
      }
    }
  }

  const summary: BusinessPassSummary = {
    businessId: params.businessId,
    trigger: params.trigger,
    correlationId: params.correlationId,
    head,
    tail,
    headSaturated: head.saturated,
    stateError,
    durationMs: now().getTime() - started,
  };
  await safe(() => deps.observer?.businessPass?.(summary));
  return summary;
}

/** Periodic recovery: a bounded, fair sweep. Never throws; the summary carries the outcome. */
export async function runHeldPurchaseRecovery(
  deps: HeldPurchaseProcessorDeps,
  params: { readonly correlationId: string },
): Promise<HeldPurchaseRunSummary> {
  const now = deps.now ?? (() => new Date());
  const startedAt = now();
  const maxBusinesses = deps.maxBusinesses ?? DEFAULT_MAX_BUSINESSES_PER_RUN;
  const maxPerBusiness = deps.maxPerBusiness ?? DEFAULT_MAX_PURCHASES_PER_BUSINESS_WINDOW;
  const budgetMs = deps.runBudgetMs ?? DEFAULT_RUN_BUDGET_MS;

  let stateError = false;
  let cursorStart: string | null = null;
  try {
    cursorStart = await deps.store.getBusinessCursor();
  } catch {
    stateError = true; // start from the beginning: fail toward fairness, not toward silence
  }

  const passes: BusinessPassSummary[] = [];
  let cursorEnd: string | null = cursorStart;
  let wrapped = false;
  let budgetExhausted = false;
  let errorCode: string | undefined;

  try {
    let businesses = await listBusinessesWithPendingAdmissionAfter(deps.pool, {
      after: cursorStart,
      limit: maxBusinesses,
    });
    if (businesses.length === 0 && cursorStart !== null) {
      // Past the last Business: wrap within this same run rather than waste it.
      businesses = await listBusinessesWithPendingAdmissionAfter(deps.pool, {
        after: null,
        limit: maxBusinesses,
      });
      wrapped = true;
    }
    const listExhausted = businesses.length < maxBusinesses;

    let processedAll = true;
    for (const businessId of businesses) {
      if (now().getTime() - startedAt.getTime() > budgetMs) {
        budgetExhausted = true;
        processedAll = false;
        break;
      }
      try {
        const pass = await processBusinessHeldPurchases(deps, {
          businessId,
          trigger: "recovery",
          correlationId: params.correlationId,
        });
        passes.push(pass);
        stateError ||= pass.stateError;
      } catch (error) {
        // Defensive: processBusiness is built not to throw; still never let one Business end the run.
        passes.push(failedPass(businessId, params.correlationId, error));
      }
      cursorEnd = businessId;
      try {
        await deps.store.setBusinessCursor(businessId);
      } catch {
        stateError = true;
      }
    }
    if (processedAll && listExhausted) {
      cursorEnd = null; // reached the end of the Business list: next run starts at the beginning
      wrapped = true;
      try {
        await deps.store.setBusinessCursor(null);
      } catch {
        stateError = true;
      }
    }
  } catch (error) {
    errorCode = classifyAdmissionFailure(error).code;
  }

  let backlog: HeldPurchaseBacklog | null = null;
  try {
    backlog = await getHeldPurchaseBacklog(deps.pool, {
      topBusinesses: 10,
      windowLimit: maxPerBusiness,
    });
  } catch {
    // Backlog is observability only; its failure is visible as `backlog: null`.
  }

  const sum = (f: (s: BusinessScanStats) => number) =>
    passes.reduce((n, p) => n + f(p.head) + (p.tail ? f(p.tail) : 0), 0);
  const businessesFailed = passes.filter(
    (p) => p.head.passError !== undefined || p.tail?.passError !== undefined,
  ).length;
  const failedTransient = sum((s) => s.failedTransient);
  const failedPermanent = sum((s) => s.failedPermanent);
  const status: HeldPurchaseRunSummary["status"] =
    errorCode !== undefined
      ? "failed"
      : businessesFailed > 0 || failedTransient > 0 || failedPermanent > 0
        ? "partial"
        : "succeeded";

  const summary: HeldPurchaseRunSummary = {
    correlationId: params.correlationId,
    status,
    startedAt,
    durationMs: now().getTime() - startedAt.getTime(),
    businessesExamined: passes.length,
    businessesFailed,
    businessesSaturated: passes.filter((p) => p.headSaturated).length,
    purchasesExamined: sum((s) => s.examined),
    admittedFromPending: sum((s) => s.admitted),
    stillHeld: sum((s) => s.held),
    skippedForCapacity: sum((s) => s.heldByReason.insufficient_capacity ?? 0),
    skippedOvertaken: sum((s) => s.skippedOvertaken),
    notPending: sum((s) => s.notPending),
    failedTransient,
    failedPermanent,
    cursorStart,
    cursorEnd,
    wrapped,
    budgetExhausted,
    stateError,
    backlog,
    ...(errorCode === undefined ? {} : { errorCode }),
  };
  await safe(() => deps.observer?.runCompleted?.(summary));
  return summary;
}

function failedPass(
  businessId: string,
  correlationId: string,
  error: unknown,
): BusinessPassSummary {
  const stats: BusinessScanStats = {
    businessId,
    examined: 0,
    windowLimit: 0,
    saturated: false,
    lastCursor: null,
    admitted: 0,
    held: 0,
    heldByReason: {},
    skippedOvertaken: 0,
    notPending: 0,
    failedTransient: 0,
    failedPermanent: 0,
    passError: { code: classifyAdmissionFailure(error).code },
  };
  return {
    businessId,
    trigger: "recovery",
    correlationId,
    head: stats,
    tail: null,
    headSaturated: false,
    stateError: false,
    durationMs: 0,
  };
}
