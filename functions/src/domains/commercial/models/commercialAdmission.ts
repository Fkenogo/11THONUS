/**
 * Commercial admission vocabulary (`WP-COM-05b`;
 * `11THONUS-COMMERCIAL-DESIGN-001` v1.1 + CORR-002 §8.3-§8.7, §8.5.1, §22).
 *
 * The Commercial side of the admission gate: given a locked account and the
 * facts the Purchase side supplies, decide ADMIT or HOLD, and describe the
 * immutable provenance an ADMIT must record. Pure types and one pure decision
 * function -- no SQL, no Loyalty/Purchase dependency. (The Purchase domain
 * defines the port it calls; these types are structurally identical to it and
 * the composition root binds the two.)
 *
 * FD-A: usable capacity = accounting balance - reserved units (capacity
 * already promised to admitted Circle positions). Raw ledger balance alone is
 * never usable capacity. No subscription tier exists.
 */

import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import type { CommercialActor, CommercialAccount, CommercialBucket } from "./commercialFoundation";
import { availableCapacity, reservedUnits } from "./commercialFoundation";

/** The system actor that authors admission audit rows (design §18). */
export const COMMERCIAL_ADMISSION_ACTOR: CommercialActor = {
  type: "system",
  id: "system:commercial-admission",
};

/** Ledger idempotency scope of one Verified Unit's reservation (design §23). */
export function reservationLedgerScopeKey(verifiedUnitId: string): string {
  return `reserve:${verifiedUnitId}`;
}

export const ADMISSION_HOLD_REASONS = [
  "not_established",
  "restricted",
  "stream_queue",
  "business_queue",
  "insufficient_capacity",
] as const;
export type AdmissionHoldReason = (typeof ADMISSION_HOLD_REASONS)[number];

export const ADMISSION_DECIDERS = ["customer_verify", "admission_processor"] as const;
export type AdmissionDecider = (typeof ADMISSION_DECIDERS)[number];

/** What a Business-wide hold queue looks like to a candidate (read under the account lock). */
export type AdmissionBusinessQueueFacts = { readonly earlierHeldInBusiness: boolean };

export type CommercialAdmissionEvaluationInput = {
  readonly businessId: string;
  /** Circle positions this Purchase begins: `ceil((U+q)/10) - ceil(U/10)`. 0 = inside an admitted position. */
  readonly newBlocks: number;
  /** Index of the first begun position (= its Circle sequence number). Meaningful when `newBlocks > 0`. */
  readonly firstBlockIndex: number;
  /** The stream already has an earlier held Purchase (read under the stream lock). */
  readonly streamHasEarlierHold: boolean;
  /**
   * Reads the Business hold queue. Invoked ONLY after the account lock is held
   * (plain read; it must take no Loyalty lock), so the queue and the capacity
   * it is judged against are one consistent view.
   */
  readonly readBusinessQueue: (
    tx: PlatformPostgresTransaction,
  ) => Promise<AdmissionBusinessQueueFacts>;
};

/** The account state the decision read under the lock (reproducible provenance). */
export type AdmissionSnapshot = {
  readonly accountVersion: number;
  readonly trialRemainingUnits: number;
  readonly paidBalanceUnits: number;
  readonly trialReservedUnits: number;
  readonly paidReservedUnits: number;
  readonly availableBefore: number;
  readonly reservedBefore: number;
  readonly serviceRestriction: "none" | "restricted";
};

export type AdmissionBlockPlan = {
  readonly blockIndex: number;
  readonly fundingBucket: CommercialBucket;
};

export type AdmissionPlan = {
  readonly blocks: readonly AdmissionBlockPlan[];
  readonly snapshot: AdmissionSnapshot;
};

export type CommercialAdmissionEvaluation =
  | {
      readonly outcome: "admit";
      /** `null` when the Purchase begins no new position: nothing is reserved or recorded. */
      readonly plan: AdmissionPlan | null;
    }
  | {
      readonly outcome: "hold";
      readonly reason: AdmissionHoldReason;
      readonly snapshot: AdmissionSnapshot | null;
    };

export function snapshotAccount(account: CommercialAccount): AdmissionSnapshot {
  return {
    accountVersion: account.version,
    trialRemainingUnits: account.trialRemainingUnits,
    paidBalanceUnits: account.paidBalanceUnits,
    trialReservedUnits: account.trialReservedUnits,
    paidReservedUnits: account.paidReservedUnits,
    availableBefore: availableCapacity(account),
    reservedBefore: reservedUnits(account),
    serviceRestriction: account.serviceRestriction,
  };
}

/**
 * The earmark rule (INV-CAP-PROV, design §8.5.1): for each begun position, in
 * index order, `trial` while uncommitted trial (`trial_remaining -
 * trial_reserved`, less what this admission already earmarked) is positive,
 * else `paid`. A pure function of the locked account state. The availability
 * check has already ensured the paid remainder is covered, so no paid earmark
 * is ever taken against a paid pool that cannot cover it.
 */
export function planAdmissionBlocks(
  account: CommercialAccount,
  firstBlockIndex: number,
  newBlocks: number,
): AdmissionBlockPlan[] {
  const blocks: AdmissionBlockPlan[] = [];
  let uncommittedTrial = account.trialRemainingUnits - account.trialReservedUnits;
  for (let i = 0; i < newBlocks; i += 1) {
    const useTrial = uncommittedTrial > 0;
    if (useTrial) uncommittedTrial -= 1;
    blocks.push({ blockIndex: firstBlockIndex + i, fundingBucket: useTrial ? "trial" : "paid" });
  }
  return blocks;
}

export type CommercialAdmissionDecisionInput = {
  /** The locked account, or `null` when the Business has none (or it was not needed). */
  readonly account: CommercialAccount | null;
  readonly newBlocks: number;
  readonly firstBlockIndex: number;
  readonly streamHasEarlierHold: boolean;
  readonly businessQueue: AdmissionBusinessQueueFacts | null;
};

/**
 * ADMIT or HOLD (design §8.6), a pure function of the locked state:
 *
 *  - a Purchase inside an already-admitted position (`newBlocks = 0`) is never
 *    held for capacity (active-Circle grace), only behind an earlier held
 *    Purchase of its own stream (units must enter a stream in order);
 *  - a Purchase beginning new position(s) is held when: its stream already has
 *    an earlier hold; the Business has no account (not commercially
 *    established); the account is administratively restricted; an earlier
 *    Purchase of the Business is still held (no overtaking); or usable
 *    capacity (balance - reserved) is below the positions needed.
 */
export function decideCommercialAdmission(
  input: CommercialAdmissionDecisionInput,
): CommercialAdmissionEvaluation {
  const snapshot = input.account === null ? null : snapshotAccount(input.account);
  if (input.streamHasEarlierHold) {
    return { outcome: "hold", reason: "stream_queue", snapshot };
  }
  if (input.newBlocks === 0) {
    return { outcome: "admit", plan: null };
  }
  if (input.account === null || snapshot === null) {
    return { outcome: "hold", reason: "not_established", snapshot: null };
  }
  if (input.account.serviceRestriction === "restricted") {
    return { outcome: "hold", reason: "restricted", snapshot };
  }
  if (input.businessQueue?.earlierHeldInBusiness === true) {
    return { outcome: "hold", reason: "business_queue", snapshot };
  }
  if (snapshot.availableBefore < input.newBlocks) {
    return { outcome: "hold", reason: "insufficient_capacity", snapshot };
  }
  return {
    outcome: "admit",
    plan: {
      blocks: planAdmissionBlocks(input.account, input.firstBlockIndex, input.newBlocks),
      snapshot,
    },
  };
}

export type CommercialAdmission = {
  readonly id: string;
  readonly businessId: string;
  readonly purchaseRecordId: string;
  readonly verifiedUnitId: string;
  readonly ledgerEntryId: string;
  readonly blocksReserved: number;
  readonly firstBlockIndex: number;
  readonly streamRef: string;
  readonly decidedBy: AdmissionDecider;
  readonly accountVersion: number;
  readonly availableBefore: number;
  readonly reservedBefore: number;
  readonly admissionScopeKey: string;
  readonly correlationId: string;
  readonly decidedAt: Date;
};

export type CommercialAdmissionBlock = {
  readonly id: string;
  readonly admissionId: string;
  readonly businessId: string;
  readonly streamRef: string;
  readonly blockIndex: number;
  readonly fundingBucket: CommercialBucket;
  readonly correlationId: string;
  readonly earmarkedAt: Date;
};
