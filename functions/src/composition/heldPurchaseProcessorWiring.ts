/**
 * Composition root: held-Purchase processor activation and recovery (`WP-COM-06a`).
 *
 * Binds the pure orchestration in `domains/purchase/services/heldPurchaseRecovery.ts` to
 * Firestore (signal documents, continuation state, persisted run summaries) and to the
 * structured logger. It imports no Commercial module: the Commercial capacity-signal port is
 * satisfied STRUCTURALLY here (`createAdmissionSignalNotifier` returns an object of the shape
 * `{ notify(signal) }`), and the compiler checks that shape where a Commercial command is
 * given this notifier. The Commercial admission port itself still comes from
 * `commercialAdmissionBinding.ts`, the one binding allowed to import Commercial.
 *
 * SIGNALLING SEMANTICS (not a transactional outbox):
 *   Commercial mutation COMMITS in PostgreSQL
 *   -> the command runner (after commit) calls `notify`, which writes ONE Firestore signal
 *      document per Business per time window (`create()`; a second signal in the same window
 *      finds the document and only merges reason metadata -- that is the coalescing)
 *   -> a Firestore `onDocumentWritten` Function claims the new count and runs the Business-scoped processor.
 *   The signal is best-effort: nothing in the PostgreSQL transaction guarantees it. A lost
 *   signal is recovered by the scheduled sweep (`runHeldPurchaseRecoveryJob`).
 *
 * ENABLEMENT: the processor does nothing unless the Commercial admission gate is enforced
 * (`PURCHASE_ADMISSION_GATE_MODE=enforce`) or an operator explicitly sets
 * `HELD_PURCHASE_PROCESSOR_MODE=drain` (to drain held Purchases after the gate was rolled back).
 * Default: both unset -> every entry point returns immediately without touching PostgreSQL.
 */

import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { PlatformPostgresPool } from "../infrastructure/postgres/postgresPool";
import { log } from "../shared/logging/logger";
import type { OperationalLog } from "../shared/logging/operationalLog";
import {
  processBusinessHeldPurchases,
  runHeldPurchaseRecovery,
  type BusinessPassSummary,
  type HeldPurchaseProcessorDeps,
  type HeldPurchaseProcessorObserver,
  type HeldPurchaseRecoveryStateStore,
  type HeldPurchaseRunSummary,
} from "../domains/purchase/services/heldPurchaseRecovery";
import {
  getHeldPurchaseBacklog,
  type HeldPurchaseBacklog,
  type PendingScanCursor,
} from "../domains/purchase/repositories/heldPurchaseRecoveryRepository";
import { DEFAULT_MAX_PURCHASES_PER_BUSINESS_WINDOW } from "../domains/purchase/services/heldPurchaseRecovery";
import { createCommercialAdmissionPort } from "./commercialAdmissionBinding";

/**
 * Recovery cadence. DEPLOYMENT-TIME configuration: it is read by the Functions deploy
 * (Cloud Scheduler job), so changing it means editing this constant and redeploying. It is not
 * a runtime setting.
 */
export const HELD_PURCHASE_RECOVERY_SCHEDULE = "every 5 minutes";

export const HELD_PURCHASE_SIGNAL_COLLECTION = "heldPurchaseReevaluationSignals";
export const HELD_PURCHASE_SIGNAL_DOCUMENT = `${HELD_PURCHASE_SIGNAL_COLLECTION}/{signalId}`;
export const HELD_PURCHASE_STATE_COLLECTION = "heldPurchaseProcessorState";
export const HELD_PURCHASE_RUN_COLLECTION = "heldPurchaseProcessorRuns";

/** Coalescing window: all signals for one Business inside one window share one document. */
export const SIGNAL_COALESCING_WINDOW_MS = 60_000;
/** Retention hint for signal and run documents (a Firestore TTL policy on `expiresAt` applies it). */
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export function isHeldPurchaseProcessorEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return (
    env["PURCHASE_ADMISSION_GATE_MODE"] === "enforce" ||
    env["HELD_PURCHASE_PROCESSOR_MODE"] === "drain"
  );
}

/** Deterministic coalescing id: Business + window start. NOT the trigger reason. */
export function admissionSignalDocumentId(businessId: string, now: Date, windowMs: number): string {
  const windowStart = Math.floor(now.getTime() / windowMs) * windowMs;
  return `${encodeURIComponent(businessId)}__${windowStart}`;
}

export type AdmissionSignal = {
  readonly businessId: string;
  readonly reason: string;
  readonly correlationId: string;
};

/** Structurally the Commercial `CapacityIncreaseNotifier`. */
export function createAdmissionSignalNotifier(
  db: Firestore,
  options: { readonly now?: () => Date; readonly windowMs?: number } = {},
): { notify(signal: AdmissionSignal): Promise<void> } {
  const now = options.now ?? (() => new Date());
  const windowMs = options.windowMs ?? SIGNAL_COALESCING_WINDOW_MS;
  return {
    async notify(signal) {
      const at = now();
      const ref = db
        .collection(HELD_PURCHASE_SIGNAL_COLLECTION)
        .doc(admissionSignalDocumentId(signal.businessId, at, windowMs));
      try {
        await ref.create({
          businessId: signal.businessId,
          windowStart: Timestamp.fromMillis(Math.floor(at.getTime() / windowMs) * windowMs),
          reasons: [signal.reason],
          signalCount: 1,
          claimedCount: 0,
          firstCorrelationId: signal.correlationId,
          createdAt: Timestamp.fromDate(at),
          expiresAt: Timestamp.fromMillis(at.getTime() + RETENTION_MS),
        });
      } catch (error) {
        if ((error as { code?: unknown }).code !== 6 /* ALREADY_EXISTS */) throw error;
        // Coalesced: another signal for this Business already opened this window. Merge the
        // reason as metadata and bump `signalCount`. The write trigger fires again, but only a
        // handler that CLAIMS the new count (`claimAdmissionSignal`) processes -- so a signal
        // arriving after the first handler finished is still processed, and N signals that
        // arrive while it runs are served by at most one follow-up run.
        await ref.update({
          reasons: FieldValue.arrayUnion(signal.reason),
          signalCount: FieldValue.increment(1),
        });
      }
    },
  };
}

type TailCursorDoc = { purchaseDate: string; id: string };

export function createFirestoreRecoveryStateStore(db: Firestore): HeldPurchaseRecoveryStateStore {
  const state = db.collection(HELD_PURCHASE_STATE_COLLECTION);
  const tailRef = (businessId: string) => state.doc(`tail__${encodeURIComponent(businessId)}`);
  return {
    async getBusinessCursor() {
      const snap = await state.doc("businessCursor").get();
      const value = snap.data()?.["after"];
      return typeof value === "string" ? value : null;
    },
    async setBusinessCursor(cursor) {
      await state
        .doc("businessCursor")
        .set({ after: cursor, updatedAt: FieldValue.serverTimestamp() });
    },
    async getTailCursor(businessId) {
      const data = (await tailRef(businessId).get()).data() as Partial<TailCursorDoc> | undefined;
      return typeof data?.purchaseDate === "string" && typeof data.id === "string"
        ? { purchaseDate: data.purchaseDate, id: data.id }
        : null;
    },
    async setTailCursor(businessId, cursor: PendingScanCursor | null) {
      if (cursor === null) {
        await tailRef(businessId).delete();
      } else {
        await tailRef(businessId).set({
          purchaseDate: cursor.purchaseDate,
          id: cursor.id,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    },
  };
}

function baseLog(
  correlationId: string,
  fields: Pick<OperationalLog, "severity" | "operation"> & Partial<OperationalLog>,
): OperationalLog {
  return {
    timestamp: new Date().toISOString(),
    environment: process.env["NODE_ENV"] ?? "unknown",
    domain: "purchase",
    service: "held_purchase_processor",
    correlationId,
    ...fields,
  };
}

/** Serialises a run summary for Firestore (Dates become Timestamps; no undefined). */
function serialiseRun(summary: HeldPurchaseRunSummary): Record<string, unknown> {
  const backlog = summary.backlog;
  return {
    correlationId: summary.correlationId,
    status: summary.status,
    startedAt: Timestamp.fromDate(summary.startedAt),
    durationMs: summary.durationMs,
    businessesExamined: summary.businessesExamined,
    businessesFailed: summary.businessesFailed,
    businessesSaturated: summary.businessesSaturated,
    purchasesExamined: summary.purchasesExamined,
    admittedFromPending: summary.admittedFromPending,
    stillHeld: summary.stillHeld,
    skippedForCapacity: summary.skippedForCapacity,
    skippedOvertaken: summary.skippedOvertaken,
    notPending: summary.notPending,
    failedTransient: summary.failedTransient,
    failedPermanent: summary.failedPermanent,
    cursorStart: summary.cursorStart,
    cursorEnd: summary.cursorEnd,
    wrapped: summary.wrapped,
    budgetExhausted: summary.budgetExhausted,
    stateError: summary.stateError,
    errorCode: summary.errorCode ?? null,
    backlog:
      backlog === null
        ? null
        : {
            totalPending: backlog.totalPending,
            businessesWithPending: backlog.businessesWithPending,
            oldestPurchaseDate:
              backlog.oldestPurchaseDate === null
                ? null
                : Timestamp.fromDate(backlog.oldestPurchaseDate),
            oldestPendingAgeSeconds:
              backlog.oldestPurchaseDate === null
                ? null
                : Math.max(
                    0,
                    Math.round(
                      (summary.startedAt.getTime() - backlog.oldestPurchaseDate.getTime()) / 1000,
                    ),
                  ),
            businessesOverWindow: backlog.businessesOverWindow,
            topBusinesses: backlog.topBusinesses.map((b) => ({
              businessId: b.businessId,
              pending: b.pending,
              oldestPurchaseDate: Timestamp.fromDate(b.oldestPurchaseDate),
            })),
          },
    expiresAt: Timestamp.fromMillis(summary.startedAt.getTime() + RETENTION_MS),
  };
}

/**
 * Observer: structured logs (the closed `OperationalLog` shape) plus persisted operational state
 * (one document per run and a `latest` document). Metrics beyond log counts live in the persisted
 * documents; nothing is exported to Cloud Monitoring until log-based metrics/alerts are
 * configured (runbook §6).
 */
export function createHeldPurchaseObserver(db: Firestore): HeldPurchaseProcessorObserver {
  return {
    purchaseFailure(failure) {
      log(
        baseLog(failure.correlationId, {
          severity: failure.failureClass === "permanent" ? "error" : "warning",
          operation: "held_purchase_failed",
          businessId: failure.businessId,
          aggregateType: "purchase",
          aggregateId: failure.purchaseId,
          result: failure.failureClass,
          errorCode: failure.code,
        }),
      );
    },
    businessPass(summary: BusinessPassSummary) {
      const failed = summary.head.passError ?? summary.tail?.passError;
      log(
        baseLog(summary.correlationId, {
          severity: failed ? "error" : "info",
          operation: `held_purchase_business_pass_${summary.trigger}`,
          businessId: summary.businessId,
          result: failed ? "business_pass_failed" : "ok",
          durationMs: summary.durationMs,
          ...(failed ? { errorCode: failed.code } : {}),
        }),
      );
      if (summary.headSaturated) {
        // More held Purchases exist beyond the head window: the tail window is rotating
        // through them; this is the "Business at its scan limit" signal.
        log(
          baseLog(summary.correlationId, {
            severity: "warning",
            operation: "held_purchase_scan_window_saturated",
            businessId: summary.businessId,
            result: "saturated",
          }),
        );
      }
    },
    async runCompleted(summary) {
      log(
        baseLog(summary.correlationId, {
          severity:
            summary.status === "failed"
              ? "error"
              : summary.status === "partial"
                ? "warning"
                : "info",
          operation: "held_purchase_recovery_run",
          result: summary.status,
          durationMs: summary.durationMs,
          ...(summary.errorCode ? { errorCode: summary.errorCode } : {}),
        }),
      );
      const doc = serialiseRun(summary);
      await db.collection(HELD_PURCHASE_RUN_COLLECTION).doc(summary.correlationId).set(doc);
      await db
        .collection(HELD_PURCHASE_STATE_COLLECTION)
        .doc("latest")
        .set({ ...doc, updatedAt: FieldValue.serverTimestamp() });
    },
  };
}

export function createHeldPurchaseProcessorDeps(
  db: Firestore,
  pool: PlatformPostgresPool,
  overrides: Partial<HeldPurchaseProcessorDeps> = {},
): HeldPurchaseProcessorDeps {
  return {
    pool,
    port: createCommercialAdmissionPort(),
    store: createFirestoreRecoveryStateStore(db),
    observer: createHeldPurchaseObserver(db),
    ...overrides,
  };
}

/** Scheduled recovery body. `null` when the processor is disabled. Throws when the run FAILED. */
export async function runHeldPurchaseRecoveryJob(
  db: Firestore,
  pool: PlatformPostgresPool,
  options: {
    readonly env?: NodeJS.ProcessEnv;
    readonly overrides?: Partial<HeldPurchaseProcessorDeps>;
  } = {},
): Promise<HeldPurchaseRunSummary | null> {
  if (!isHeldPurchaseProcessorEnabled(options.env)) return null;
  const summary = await runHeldPurchaseRecovery(
    createHeldPurchaseProcessorDeps(db, pool, options.overrides),
    { correlationId: `held-recovery:${randomUUID()}` },
  );
  if (summary.status === "failed") {
    throw new Error(`held-Purchase recovery run failed (${summary.errorCode ?? "UNKNOWN"})`);
  }
  return summary;
}

/**
 * Claims every signal counted so far on one signal document. True when there is unclaimed work
 * (`signalCount > claimedCount`): the caller then processes the Business. False when an earlier
 * invocation already claimed it (including this handler's own claim write re-firing the trigger).
 * Transactional, so concurrent invocations cannot both claim the same count.
 */
export async function claimAdmissionSignal(db: Firestore, signalId: string): Promise<boolean> {
  const ref = db.collection(HELD_PURCHASE_SIGNAL_COLLECTION).doc(signalId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data();
    if (!snap.exists || data === undefined) return false;
    const count = typeof data["signalCount"] === "number" ? data["signalCount"] : 1;
    const claimed = typeof data["claimedCount"] === "number" ? data["claimedCount"] : 0;
    if (claimed >= count) return false;
    tx.update(ref, { claimedCount: count });
    return true;
  });
}

/** Signal handler body (Firestore `onDocumentWritten`). `null` when disabled or malformed. */
export async function handleAdmissionSignal(
  db: Firestore,
  pool: PlatformPostgresPool,
  signal: { readonly signalId: string; readonly data: Record<string, unknown> | undefined },
  options: {
    readonly env?: NodeJS.ProcessEnv;
    readonly overrides?: Partial<HeldPurchaseProcessorDeps>;
  } = {},
): Promise<BusinessPassSummary | null> {
  if (!isHeldPurchaseProcessorEnabled(options.env)) return null;
  const businessId = signal.data?.["businessId"];
  const correlationId = `held-signal:${signal.signalId}`;
  if (typeof businessId !== "string" || businessId.length === 0) {
    log(
      baseLog(correlationId, {
        severity: "error",
        operation: "held_purchase_signal_malformed",
        result: "ignored",
        errorCode: "MISSING_BUSINESS_ID",
      }),
    );
    return null;
  }
  if (!(await claimAdmissionSignal(db, signal.signalId))) return null; // nothing new to process
  return processBusinessHeldPurchases(
    createHeldPurchaseProcessorDeps(db, pool, options.overrides),
    {
      businessId,
      trigger: "signal",
      correlationId,
    },
  );
}

/** On-demand backlog snapshot (read-only query service; used by tooling and tests). */
export function readHeldPurchaseBacklog(
  pool: PlatformPostgresPool,
  options: { readonly windowLimit?: number; readonly topBusinesses?: number } = {},
): Promise<HeldPurchaseBacklog> {
  return getHeldPurchaseBacklog(pool, {
    topBusinesses: options.topBusinesses ?? 20,
    windowLimit: options.windowLimit ?? DEFAULT_MAX_PURCHASES_PER_BUSINESS_WINDOW,
  });
}
