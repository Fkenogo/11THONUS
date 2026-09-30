/**
 * Commercial consumption projection (`WP-COM-04`;
 * design §5.4, §22.3 sequences 3 and 4).
 *
 * Projects ONE authoritative Loyalty fact -- "this Circle's earning side
 * completed and its Reward is available" -- into ONE Commercial unit
 * consumed. It is a projection: it only ever READS the Reward. It writes no
 * Loyalty row, changes no Reward state, and redemption plays no part.
 *
 * ONE PostgreSQL transaction per Reward, in this fixed order:
 *
 *   1. read the Reward (plain SELECT, no lock) and check eligibility
 *   2. CLAIM: insert the unclassified claim (composite FK to the Reward)
 *      -- the only statement that touches a Loyalty row (FOR KEY SHARE on the
 *      Reward), and it runs BEFORE the account lock (design §4.4 rule iii)
 *   3. LOCK the Business's Commercial account row (FOR UPDATE)
 *   4. RESOLVE FUNDING under that lock: the admission earmark when one exists,
 *      else the exceptional fallback decided from the locked counters
 *   5. FINALIZE atomically: ledger debit + account counters, consumption event,
 *      audit row
 *   6. COMMIT -- claim, event, debit, counters and audit land together or not
 *      at all. Any failure in 3-5 rolls the claim back too, leaving the Reward
 *      eligible for the next pass; no stuck "processing" state can exist.
 *
 * Lock order: after step 3 the transaction takes NO Loyalty lock (the earmark
 * port is contractually read-only) and inserts no row with a Loyalty foreign
 * key, so it is a sink in the wait graph (design §22.2).
 *
 * Never fails because paid capacity is exhausted or negative: an already
 * admitted Circle must be able to complete. The paid balance may go below zero
 * (no floor, no maximum). Only genuine integrity violations throw.
 */

import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import { withPlatformTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import {
  COMMERCIAL_PROJECTION_ACTOR,
  consumptionLedgerScopeKey,
  noAdmissionEarmarks,
  type ConsumptionEarmarkResolver,
  type ProjectConsumptionResult,
} from "../models/commercialConsumption";
import type { CommercialBucket } from "../models/commercialFoundation";
import { CommercialDomainError, commercialAccountNotFoundError } from "../models/commercialErrors";
import {
  getCommercialAccount,
  lockCommercialAccount,
} from "../repositories/commercialAccountRepository";
import { appendCommercialAuditEvent } from "../repositories/commercialAuditRepository";
import {
  getConsumptionEventByCycle,
  insertConsumptionClaim,
  insertConsumptionEvent,
} from "../repositories/commercialConsumptionRepository";
import { getEffectivePriceSchedule } from "../repositories/commercialPriceRepository";
import {
  COUNTABLE_REWARD_STATES,
  getRewardSource,
} from "../repositories/commercialRewardSourceRepository";
import { postCommercialLedgerEntry } from "./postCommercialLedgerEntry";

export type ProjectCommercialConsumptionInput = {
  readonly rewardId: string;
  readonly correlationId: string;
  /** Defaults to `noAdmissionEarmarks`: no earmark source exists until WP-COM-05. */
  readonly earmarkResolver?: ConsumptionEarmarkResolver;
};

export async function projectCommercialConsumption(
  pool: PlatformPostgresPool,
  input: ProjectCommercialConsumptionInput,
): Promise<ProjectConsumptionResult> {
  const resolveEarmark = input.earmarkResolver ?? noAdmissionEarmarks;

  return withPlatformTransaction(pool, async (tx): Promise<ProjectConsumptionResult> => {
    // 1. Identify -- non-locking read of the authoritative Loyalty fact.
    const source = await getRewardSource(tx, input.rewardId);
    if (source === null) return { outcome: "not_eligible", reason: "reward_not_found" };
    if (!(COUNTABLE_REWARD_STATES as readonly string[]).includes(source.state)) {
      return { outcome: "not_eligible", reason: "reward_state_not_countable" };
    }
    const preview = await getCommercialAccount(tx, source.businessId);
    if (preview === null) return { outcome: "not_eligible", reason: "no_commercial_account" };
    // Never billed retroactively; `commercial_effective_from` is immutable, so
    // this non-locking decision cannot go stale.
    if (source.availableAt < preview.commercialEffectiveFrom) {
      return { outcome: "not_eligible", reason: "before_commercial_effective_from" };
    }
    const already = await getConsumptionEventByCycle(tx, source.loyaltyCycleId);
    if (already !== null) return { outcome: "already_projected", event: already };

    // 2. Claim -- BEFORE the account lock. Carries no bucket and no amount.
    const claim = await insertConsumptionClaim(tx, {
      businessId: source.businessId,
      sourceRewardId: source.rewardId,
      sourceLoyaltyCycleId: source.loyaltyCycleId,
      correlationId: input.correlationId,
    });
    if (claim === null) {
      // Another projector owns or has finished this Reward. It committed (we
      // waited for it), so its event is visible to this next statement.
      const winner = await getConsumptionEventByCycle(tx, source.loyaltyCycleId);
      if (winner === null) {
        throw new CommercialDomainError(
          "TEMPORARY_UNAVAILABLE",
          "Consumption claim exists without its event; retry.",
        );
      }
      return { outcome: "already_projected", event: winner };
    }

    // 3. Lock the account. From here on: no Loyalty lock, no Loyalty-FK insert.
    const account = await lockCommercialAccount(tx, source.businessId);
    if (account === null) throw commercialAccountNotFoundError(source.businessId);

    // 4. Resolve funding UNDER the lock. Nothing was classified before this point.
    const earmark = await resolveEarmark(tx, source);
    let bucket: CommercialBucket;
    let earmarkId: string | null;
    let releasesReservation: boolean;
    if (earmark !== null) {
      // Normal governed runtime (INV-CAP-PROV): the bucket IS the earmark;
      // account state plays no part and the held reservation is released.
      bucket = earmark.bucket;
      earmarkId = earmark.earmarkId;
      releasesReservation = true;
    } else {
      // Exceptional fallback (migration / reconciliation / rollout only):
      // uncommitted trial first, then paid, from the counters read while the
      // account row is locked (CORR-002). Recorded with `account_version`.
      bucket = account.trialRemainingUnits - account.trialReservedUnits > 0 ? "trial" : "paid";
      earmarkId = null;
      releasesReservation = false;
    }
    const bucketSource = earmark !== null ? "earmark" : "consumption_time_fallback";

    // Pricing provenance (design §13): the schedule in force when the Reward
    // became available. Absent schedule => no snapshot; never a default price.
    const schedule = await getEffectivePriceSchedule(
      tx,
      account.settlementMarket,
      source.availableAt,
    );

    // 5. Finalize atomically. Exactly ONE unit; paid may go negative (no floor).
    const posted = await postCommercialLedgerEntry(tx, {
      businessId: source.businessId,
      entryType: "consumption",
      bucket,
      unitsDelta: -1,
      trialReservedDelta: releasesReservation && bucket === "trial" ? -1 : 0,
      paidReservedDelta: releasesReservation && bucket === "paid" ? -1 : 0,
      sourceReference: { type: "loyalty_cycle", id: source.loyaltyCycleId },
      reasonCode: bucketSource,
      reasonText: "Circle earning side completed and its Reward became available.",
      idempotencyScopeKey: consumptionLedgerScopeKey(source.loyaltyCycleId),
      createdBy: COMMERCIAL_PROJECTION_ACTOR.id,
      correlationId: input.correlationId,
    });
    if (posted.outcome !== "posted") {
      // A debit for this Cycle exists with no claim/event: never silently adopt it.
      throw new CommercialDomainError(
        "INVALID_STATE_TRANSITION",
        `A consumption ledger entry already exists for Cycle ${source.loyaltyCycleId} without a consumption event.`,
      );
    }

    const event = await insertConsumptionEvent(tx, {
      claimId: claim.id,
      businessId: source.businessId,
      rewardProgramId: source.rewardProgramId,
      sourceLoyaltyCycleId: source.loyaltyCycleId,
      sourceFactAt: source.availableAt,
      bucket,
      earmarkId,
      bucketSource,
      accountVersion: account.version,
      price:
        schedule === null
          ? null
          : {
              scheduleId: schedule.id,
              usdEquivalentMinor: schedule.usdEquivalentMinor,
              currency: schedule.currency,
              localUnitPriceMinor: schedule.localUnitPriceMinor,
            },
      ledgerEntryId: posted.entry.id,
      correlationId: input.correlationId,
    });

    await appendCommercialAuditEvent(tx, {
      actor: COMMERCIAL_PROJECTION_ACTOR,
      actionType: "consumption_recorded",
      targetType: "consumption_event",
      targetId: event.id,
      businessId: source.businessId,
      reasonCode: bucketSource,
      reasonText: "One Commercial unit consumed: the Circle's Reward became available.",
      reference: source.loyaltyCycleId,
      correlationId: input.correlationId,
      idempotencyKey: consumptionLedgerScopeKey(source.loyaltyCycleId),
      result: "succeeded",
      beforeSnapshot: {
        accountVersion: account.version,
        trialRemainingUnits: account.trialRemainingUnits,
        paidBalanceUnits: account.paidBalanceUnits,
        trialReservedUnits: account.trialReservedUnits,
        paidReservedUnits: account.paidReservedUnits,
      },
      afterSnapshot: {
        accountVersion: posted.entry.accountVersion,
        trialRemainingUnits: posted.entry.trialAfter,
        paidBalanceUnits: posted.entry.paidAfter,
        trialReservedUnits: posted.entry.trialReservedAfter,
        paidReservedUnits: posted.entry.paidReservedAfter,
        bucket,
        bucketSource,
        earmarkId,
        unitCount: 1,
        rewardId: source.rewardId,
        localCurrency: schedule?.currency ?? null,
        localUnitPriceMinor: schedule?.localUnitPriceMinor ?? null,
        usdEquivalentMinor: schedule?.usdEquivalentMinor ?? null,
      },
      ledgerEntryId: posted.entry.id,
      priceScheduleId: schedule?.id,
    });

    return { outcome: "projected", event, ledgerEntryId: posted.entry.id };
  });
}
