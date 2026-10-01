/**
 * Purchase-side admission capacity port (`WP-COM-05b`;
 * design §4.3 rule 2, §8.2, §8.3, §8.4).
 *
 * The Purchase domain DEFINES this port and calls it; it never imports the
 * Commercial domain. The composition root binds a Commercial implementation
 * (`composition/commercialAdmissionBinding.ts`). The shapes are intentionally
 * duplicated structurally on the Commercial side (the domains share no import
 * path); the binding file's assignment is what keeps them compatible.
 *
 * Contract: `evaluate` runs AFTER the caller holds the Purchase, stream and
 * current-Cycle locks. It may take the Commercial account lock (only when
 * `newBlocks > 0` and the stream has no earlier hold) and writes nothing.
 * `recordAdmission` runs after the Verified Unit row exists. `recordHold` is
 * audit-only. A hold reserves no idempotency key and no capacity.
 *
 * Also here: the Purchase-owned arithmetic the decision needs -- the stream's
 * opaque `stream_ref` digest and the block arithmetic (design §8.3).
 */

import { createHash } from "node:crypto";
import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import { LOYALTY_CYCLE_THRESHOLD } from "../repositories/loyaltyCycleRepository";

export type PurchaseAdmissionBucket = "trial" | "paid";

export type PurchaseAdmissionHoldReason =
  "not_established" | "restricted" | "stream_queue" | "business_queue" | "insufficient_capacity";

export type PurchaseAdmissionDecider = "customer_verify" | "admission_processor";

export type PurchaseAdmissionSnapshot = {
  readonly accountVersion: number;
  readonly trialRemainingUnits: number;
  readonly paidBalanceUnits: number;
  readonly trialReservedUnits: number;
  readonly paidReservedUnits: number;
  readonly availableBefore: number;
  readonly reservedBefore: number;
  readonly serviceRestriction: "none" | "restricted";
};

export type PurchaseAdmissionPlan = {
  readonly blocks: readonly {
    readonly blockIndex: number;
    readonly fundingBucket: PurchaseAdmissionBucket;
  }[];
  readonly snapshot: PurchaseAdmissionSnapshot;
};

export type PurchaseAdmissionEvaluation =
  | { readonly outcome: "admit"; readonly plan: PurchaseAdmissionPlan | null }
  | {
      readonly outcome: "hold";
      readonly reason: PurchaseAdmissionHoldReason;
      readonly snapshot: PurchaseAdmissionSnapshot | null;
    };

export type PurchaseAdmissionEvaluationInput = {
  readonly businessId: string;
  readonly newBlocks: number;
  readonly firstBlockIndex: number;
  readonly streamHasEarlierHold: boolean;
  /** Called by the port only after it holds the account lock (plain read, no Loyalty lock). */
  readonly readBusinessQueue: (
    tx: PlatformPostgresTransaction,
  ) => Promise<{ readonly earlierHeldInBusiness: boolean }>;
};

export type PurchaseAdmissionRecordInput = {
  readonly businessId: string;
  readonly purchaseRecordId: string;
  readonly verifiedUnitId: string;
  readonly streamRef: string;
  readonly plan: PurchaseAdmissionPlan;
  readonly decidedBy: PurchaseAdmissionDecider;
  readonly admissionScopeKey: string;
  readonly correlationId: string;
};

export type PurchaseAdmissionHoldRecordInput = {
  readonly businessId: string;
  readonly purchaseRecordId: string;
  readonly reason: PurchaseAdmissionHoldReason;
  readonly snapshot: PurchaseAdmissionSnapshot | null;
  readonly correlationId: string;
};

export interface PurchaseAdmissionCapacityPort {
  evaluate(
    tx: PlatformPostgresTransaction,
    input: PurchaseAdmissionEvaluationInput,
  ): Promise<PurchaseAdmissionEvaluation>;
  recordAdmission(
    tx: PlatformPostgresTransaction,
    input: PurchaseAdmissionRecordInput,
  ): Promise<void>;
  recordHold(
    tx: PlatformPostgresTransaction,
    input: PurchaseAdmissionHoldRecordInput,
  ): Promise<void>;
}

/**
 * The idempotency key of one Purchase's admission (design §23). Reserved ONLY
 * after the locked decision is ADMIT; a HOLD never touches it (CORR-002).
 */
export function admissionIdempotencyKey(purchaseRecordId: string): string {
  return `admit:${purchaseRecordId}`;
}

/**
 * Opaque, deterministic digest of one allocation stream (design §8.5.1):
 * Commercial stores no raw customer identity, and the projection side can
 * recompute the same value from a Reward's Cycle.
 */
export function computeStreamRef(params: {
  readonly businessId: string;
  readonly customerIdentityId: string;
  readonly rewardProgramId: string;
}): string {
  return createHash("sha256")
    .update(`${params.businessId}\u001f${params.customerIdentityId}\u001f${params.rewardProgramId}`)
    .digest("hex");
}

/**
 * Circle positions a Purchase of `quantity` begins on a stream that already
 * holds `unitsBefore` admitted units (design §8.3):
 * `ceil((U+q)/10) - ceil(U/10)`, the first begun position being
 * `ceil(U/10) + 1` (block index = Circle sequence number).
 */
export function computeNewBlocks(
  unitsBefore: number,
  quantity: number,
): { readonly newBlocks: number; readonly firstBlockIndex: number } {
  const t = LOYALTY_CYCLE_THRESHOLD;
  const before = Math.ceil(unitsBefore / t);
  const after = Math.ceil((unitsBefore + quantity) / t);
  return { newBlocks: after - before, firstBlockIndex: before + 1 };
}
