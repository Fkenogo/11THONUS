/**
 * Commercial consumption projection vocabulary (`WP-COM-04`;
 * `11THONUS-COMMERCIAL-DESIGN-001` v1.1 + CORR-002 §5, §20, §22).
 *
 * FD-B: one Commercial unit is consumed when a Circle's governed 10-unit
 * earning side completes and its Reward becomes available. Redemption does
 * NOT create consumption. Each consumption is exactly ONE unit; nothing here
 * carries a money amount to charge (no settlement, invoice or provider).
 */

import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type { CommercialBucket, CommercialActor } from "./commercialFoundation";

/** The system actor that authors every projection audit row (design §18). */
export const COMMERCIAL_PROJECTION_ACTOR: CommercialActor = {
  type: "system",
  id: "system:commercial-projection",
};

/** Ledger idempotency scope for one Circle's consumption (design §5.2). */
export function consumptionLedgerScopeKey(loyaltyCycleId: string): string {
  return `consume:${loyaltyCycleId}`;
}

export const CONSUMPTION_BUCKET_SOURCES = ["earmark", "consumption_time_fallback"] as const;
export type ConsumptionBucketSource = (typeof CONSUMPTION_BUCKET_SOURCES)[number];

/**
 * Loyalty facts about ONE Reward, as read (never written) by Commercial.
 * `state` is read only to decide eligibility; Commercial never changes it.
 */
export type RewardSourceFact = {
  readonly rewardId: string;
  readonly loyaltyCycleId: string;
  readonly businessId: string;
  readonly rewardProgramId: string;
  readonly state: string;
  /** When the Reward became available == when the unit was consumed (FD-B). */
  readonly availableAt: Date;
};

export type ConsumptionClaim = {
  readonly id: string;
  readonly businessId: string;
  readonly sourceRewardId: string;
  readonly sourceLoyaltyCycleId: string;
  readonly correlationId: string;
  readonly claimedAt: Date;
};

export type ConsumptionEvent = {
  readonly id: string;
  readonly claimId: string;
  readonly businessId: string;
  readonly rewardProgramId: string;
  readonly sourceLoyaltyCycleId: string;
  readonly sourceFactAt: Date;
  readonly unitCount: 1;
  readonly bucket: CommercialBucket;
  readonly earmarkId: string | null;
  readonly bucketSource: ConsumptionBucketSource;
  /** The locked account version the funding decision read (before this debit). */
  readonly accountVersion: number;
  readonly priceScheduleId: string | null;
  readonly unitPriceUsdMinor: number | null;
  readonly localCurrency: string | null;
  readonly localUnitPriceMinor: number | null;
  readonly ledgerEntryId: string;
  readonly correlationId: string;
  readonly recordedAt: Date;
};

/**
 * Immutable admission provenance for a Circle, when one exists (INV-CAP-PROV,
 * design §8.5.1). NO earmark source exists yet (admission earmarks are
 * WP-COM-05); this is the future-compatible shape the projection already
 * honours. An earmark implies the matching bucket RESERVATION is held, so the
 * consumption releases it in the same ledger entry.
 */
export type ConsumptionEarmark = {
  readonly earmarkId: string;
  readonly bucket: CommercialBucket;
};

/**
 * Port that looks an earmark up for a Reward. Called UNDER the Commercial
 * account lock, so an implementation MUST NOT take any Loyalty row lock
 * (`FOR UPDATE` / `FOR NO KEY UPDATE` / `FOR SHARE`) -- plain reads only
 * (design §22.1). Return `null` when there is no earmark (fallback applies).
 */
export type ConsumptionEarmarkResolver = (
  tx: PlatformPostgresTransaction,
  source: RewardSourceFact,
) => Promise<ConsumptionEarmark | null>;

/** Today's resolver: no admission earmark source exists, so every Reward takes the flagged fallback. */
export const noAdmissionEarmarks: ConsumptionEarmarkResolver = async () => null;

export type ProjectionNotEligibleReason =
  | "reward_not_found"
  | "reward_state_not_countable"
  | "no_commercial_account"
  | "before_commercial_effective_from";

export type ProjectConsumptionResult =
  | {
      readonly outcome: "projected";
      readonly event: ConsumptionEvent;
      readonly ledgerEntryId: string;
    }
  | { readonly outcome: "already_projected"; readonly event: ConsumptionEvent }
  | { readonly outcome: "not_eligible"; readonly reason: ProjectionNotEligibleReason };

/** Observability derived by query (design §5.7); never stored state. */
export type ConsumptionProjectionMetrics = {
  readonly unprojectedRewardCount: number;
  /** Age in seconds of the oldest unprojected Reward at `asOf`, or `null` when none. */
  readonly oldestUnprojectedAgeSeconds: number | null;
  readonly fallbackConsumptionCount: number;
  readonly projectionFailureCount: number;
  readonly asOf: Date;
};
