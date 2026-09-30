/**
 * Commercial consumption reconciliation and lag observability (`WP-COM-04`;
 * design §5.3, §5.6, §5.7).
 *
 * `reconcileCommercialConsumption` is the bounded, callable, repeat-safe pass
 * that finds Rewards with no Commercial consumption (a stateless anti-join
 * over the durable Reward fact -- no watermark that could skip a row) and
 * projects each in its OWN transaction via `projectCommercialConsumption`.
 * "Backfill" is the same call: running it again never double-consumes,
 * because the claim, event and ledger scope key are unique per Cycle.
 *
 * It is a SERVICE SEAM only. No scheduler exists in this repository (design
 * §3.8); wiring one is a later work package (WP-COM-10). Nothing calls this
 * from a Loyalty path, so a Commercial fault can never roll back a Reward.
 *
 * A failing Reward never aborts the pass: the failure is recorded on a
 * separate connection (it must survive the rolled-back attempt) and the pass
 * continues; the Reward stays eligible for the next pass.
 */

import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import type {
  ConsumptionEarmarkResolver,
  ConsumptionProjectionMetrics,
} from "../models/commercialConsumption";
import {
  countFallbackConsumptions,
  countProjectionFailures,
  insertProjectionFailure,
} from "../repositories/commercialConsumptionRepository";
import {
  getUnprojectedRewardStats,
  listUnprojectedRewardSources,
} from "../repositories/commercialRewardSourceRepository";
import { projectCommercialConsumption } from "./projectCommercialConsumption";

export const DEFAULT_RECONCILIATION_LIMIT = 50;
const MAX_RECONCILIATION_LIMIT = 500;
const MAX_ERROR_MESSAGE_LENGTH = 500;

export type ReconcileCommercialConsumptionInput = {
  readonly correlationId: string;
  /** Upper bound on Rewards attempted in this pass. Default 50, max 500. */
  readonly limit?: number;
  /** Optionally restrict the pass to one Business. */
  readonly businessId?: string;
  readonly earmarkResolver?: ConsumptionEarmarkResolver;
  /** Clock for the lag figures (tests). */
  readonly now?: Date;
};

export type ReconcileCommercialConsumptionReport = {
  /** Unprojected Rewards examined in this pass. */
  readonly scanned: number;
  readonly projected: number;
  /** Projected in this pass with no earmark (flagged fallback). */
  readonly projectedViaFallback: number;
  readonly alreadyProjected: number;
  readonly notEligible: number;
  readonly failed: number;
  /** Observability AFTER the pass. */
  readonly metrics: ConsumptionProjectionMetrics;
};

/** Lag and health of the projection, derived by query (never stored state). */
export async function getConsumptionProjectionMetrics(
  pool: PlatformPostgresPool,
  now: Date = new Date(),
): Promise<ConsumptionProjectionMetrics> {
  const [stats, fallbackConsumptionCount, projectionFailureCount] = await Promise.all([
    getUnprojectedRewardStats(pool),
    countFallbackConsumptions(pool),
    countProjectionFailures(pool),
  ]);
  return {
    unprojectedRewardCount: stats.count,
    oldestUnprojectedAgeSeconds:
      stats.oldestAvailableAt === null
        ? null
        : Math.max(0, Math.floor((now.getTime() - stats.oldestAvailableAt.getTime()) / 1000)),
    fallbackConsumptionCount,
    projectionFailureCount,
    asOf: now,
  };
}

export async function reconcileCommercialConsumption(
  pool: PlatformPostgresPool,
  input: ReconcileCommercialConsumptionInput,
): Promise<ReconcileCommercialConsumptionReport> {
  const limit = Math.min(
    Math.max(1, Math.floor(input.limit ?? DEFAULT_RECONCILIATION_LIMIT)),
    MAX_RECONCILIATION_LIMIT,
  );
  const candidates = await listUnprojectedRewardSources(pool, {
    limit,
    businessId: input.businessId,
  });

  let projected = 0;
  let projectedViaFallback = 0;
  let alreadyProjected = 0;
  let notEligible = 0;
  let failed = 0;

  for (const candidate of candidates) {
    try {
      const result = await projectCommercialConsumption(pool, {
        rewardId: candidate.rewardId,
        correlationId: input.correlationId,
        earmarkResolver: input.earmarkResolver,
      });
      if (result.outcome === "projected") {
        projected += 1;
        if (result.event.bucketSource === "consumption_time_fallback") projectedViaFallback += 1;
      } else if (result.outcome === "already_projected") {
        alreadyProjected += 1;
      } else {
        notEligible += 1;
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      const errorClass = error instanceof Error ? error.name : "UnknownError";
      // Best effort: recording a failure must never abort the pass.
      await insertProjectionFailure(pool, {
        businessId: candidate.businessId,
        sourceLoyaltyCycleId: candidate.loyaltyCycleId,
        errorClass,
        errorMessage: message.slice(0, MAX_ERROR_MESSAGE_LENGTH),
        correlationId: input.correlationId,
      }).catch(() => undefined);
    }
  }

  return {
    scanned: candidates.length,
    projected,
    projectedViaFallback,
    alreadyProjected,
    notEligible,
    failed,
    metrics: await getConsumptionProjectionMetrics(pool, input.now),
  };
}
