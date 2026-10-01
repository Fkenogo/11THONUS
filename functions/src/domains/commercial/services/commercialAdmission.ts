/**
 * Commercial admission service (`WP-COM-05b`;
 * design §8.4, §8.6, §8.13, §22.1-§22.3).
 *
 * The Commercial half of the admission gate. It is called by the Purchase
 * domain through a port the Purchase side defines; the composition root binds
 * the two. It never imports a Purchase/Loyalty repository, never writes a
 * Loyalty row, and never creates a Circle, Verified Unit or Reward.
 *
 * `evaluateCommercialAdmission` -- the decision. It takes the Commercial
 * account lock (`FOR UPDATE`) ONLY when the Purchase begins new Circle
 * position(s) and its stream has no earlier hold: a Purchase inside an
 * already-admitted position (active-Circle grace) takes no Commercial lock and
 * reads no Commercial row. The lock is taken AFTER the Purchase, stream and
 * current-Cycle locks the caller already holds (design §22.1), so the account
 * row is never held while waiting on a Loyalty row that a transaction waiting
 * for the account holds. It writes NOTHING: a HOLD must leave no row behind.
 *
 * `recordCommercialAdmission` -- after an ADMIT, and only AFTER the Verified
 * Unit row exists, writes in parent-before-child order: the
 * `capacity_reserved` ledger entry (counters move under the same lock),
 * the immutable admission row, one immutable earmark per begun position, and
 * the audit row. Rolling the transaction back removes all of it.
 *
 * `recordCommercialAdmissionHold` -- audit only (the Purchase domain owns the
 * state change). No ledger entry, no reservation, no earmark.
 */

import type { PlatformPostgresTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import {
  COMMERCIAL_ADMISSION_ACTOR,
  decideCommercialAdmission,
  reservationLedgerScopeKey,
  type AdmissionDecider,
  type AdmissionHoldReason,
  type AdmissionPlan,
  type AdmissionSnapshot,
  type CommercialAdmissionEvaluation,
  type CommercialAdmissionEvaluationInput,
} from "../models/commercialAdmission";
import { CommercialDomainError } from "../models/commercialErrors";
import { lockCommercialAccount } from "../repositories/commercialAccountRepository";
import {
  insertAdmission,
  insertAdmissionBlock,
} from "../repositories/commercialAdmissionRepository";
import { appendCommercialAuditEvent } from "../repositories/commercialAuditRepository";
import { postCommercialLedgerEntry } from "./postCommercialLedgerEntry";

export async function evaluateCommercialAdmission(
  tx: PlatformPostgresTransaction,
  input: CommercialAdmissionEvaluationInput,
): Promise<CommercialAdmissionEvaluation> {
  // No account lock when no capacity is needed or the stream queue already decides it.
  if (input.newBlocks === 0 || input.streamHasEarlierHold) {
    return decideCommercialAdmission({
      account: null,
      newBlocks: input.newBlocks,
      firstBlockIndex: input.firstBlockIndex,
      streamHasEarlierHold: input.streamHasEarlierHold,
      businessQueue: null,
    });
  }
  const account = await lockCommercialAccount(tx, input.businessId);
  // The hold queue is read under the account lock, only when it can matter.
  const businessQueue =
    account !== null && account.serviceRestriction !== "restricted"
      ? await input.readBusinessQueue(tx)
      : null;
  return decideCommercialAdmission({
    account,
    newBlocks: input.newBlocks,
    firstBlockIndex: input.firstBlockIndex,
    streamHasEarlierHold: false,
    businessQueue,
  });
}

export type RecordCommercialAdmissionInput = {
  readonly businessId: string;
  readonly purchaseRecordId: string;
  /** The Verified Unit row MUST already exist in this transaction (immediate FKs). */
  readonly verifiedUnitId: string;
  readonly streamRef: string;
  readonly plan: AdmissionPlan;
  readonly decidedBy: AdmissionDecider;
  /** `admit:<purchase_id>` -- reserved by the caller only after the locked ADMIT. */
  readonly admissionScopeKey: string;
  readonly correlationId: string;
};

export async function recordCommercialAdmission(
  tx: PlatformPostgresTransaction,
  input: RecordCommercialAdmissionInput,
): Promise<void> {
  const blocks = input.plan.blocks;
  if (blocks.length === 0) {
    throw new CommercialDomainError(
      "VALIDATION_FAILED",
      "An admission must begin at least one Circle position.",
    );
  }
  const trialDelta = blocks.filter((b) => b.fundingBucket === "trial").length;
  const paidDelta = blocks.length - trialDelta;

  // c. reservation ledger entry (counters move together, under the account lock).
  const posted = await postCommercialLedgerEntry(tx, {
    businessId: input.businessId,
    entryType: "capacity_reserved",
    bucket: trialDelta > 0 ? "trial" : "paid",
    unitsDelta: 0,
    trialReservedDelta: trialDelta,
    paidReservedDelta: paidDelta,
    sourceReference: { type: "verified_unit", id: input.verifiedUnitId },
    reasonCode: "admission",
    reasonText: "Capacity reserved for new Circle position(s) at admission.",
    idempotencyScopeKey: reservationLedgerScopeKey(input.verifiedUnitId),
    createdBy: COMMERCIAL_ADMISSION_ACTOR.id,
    correlationId: input.correlationId,
  });
  if (posted.outcome !== "posted") {
    throw new CommercialDomainError(
      "INVALID_STATE_TRANSITION",
      `A capacity reservation already exists for Verified Unit ${input.verifiedUnitId}.`,
    );
  }

  // d. admission row (FK Verified Unit, Purchase, ledger entry).
  const admission = await insertAdmission(tx, {
    businessId: input.businessId,
    purchaseRecordId: input.purchaseRecordId,
    verifiedUnitId: input.verifiedUnitId,
    ledgerEntryId: posted.entry.id,
    blocksReserved: blocks.length,
    firstBlockIndex: blocks[0].blockIndex,
    streamRef: input.streamRef,
    decidedBy: input.decidedBy,
    accountVersion: input.plan.snapshot.accountVersion,
    availableBefore: input.plan.snapshot.availableBefore,
    reservedBefore: input.plan.snapshot.reservedBefore,
    admissionScopeKey: input.admissionScopeKey,
    correlationId: input.correlationId,
  });

  // e. one earmark per begun Circle position (funding bucket fixed here, forever).
  for (const block of blocks) {
    await insertAdmissionBlock(tx, {
      admissionId: admission.id,
      businessId: input.businessId,
      streamRef: input.streamRef,
      blockIndex: block.blockIndex,
      fundingBucket: block.fundingBucket,
      correlationId: input.correlationId,
    });
  }

  await appendCommercialAuditEvent(tx, {
    actor: COMMERCIAL_ADMISSION_ACTOR,
    actionType: "admission_admitted",
    targetType: "commercial_admission",
    targetId: admission.id,
    businessId: input.businessId,
    reasonCode: input.decidedBy,
    reasonText: "Purchase admitted; new Circle position(s) reserved and earmarked.",
    reference: input.purchaseRecordId,
    correlationId: input.correlationId,
    idempotencyKey: input.admissionScopeKey,
    result: "succeeded",
    beforeSnapshot: input.plan.snapshot,
    afterSnapshot: {
      blocksReserved: blocks.length,
      earmarks: blocks.map((b) => ({ blockIndex: b.blockIndex, fundingBucket: b.fundingBucket })),
      ledgerEntryId: posted.entry.id,
      accountVersion: posted.entry.accountVersion,
    },
    ledgerEntryId: posted.entry.id,
  });
}

export type RecordCommercialAdmissionHoldInput = {
  readonly businessId: string;
  readonly purchaseRecordId: string;
  readonly reason: AdmissionHoldReason;
  readonly snapshot: AdmissionSnapshot | null;
  readonly correlationId: string;
};

/** Audit only. The held outcome reserves nothing and earmarks nothing. */
export async function recordCommercialAdmissionHold(
  tx: PlatformPostgresTransaction,
  input: RecordCommercialAdmissionHoldInput,
): Promise<void> {
  await appendCommercialAuditEvent(tx, {
    actor: COMMERCIAL_ADMISSION_ACTOR,
    actionType: "admission_held",
    targetType: "purchase_admission",
    targetId: input.purchaseRecordId,
    businessId: input.businessId,
    reasonCode: input.reason,
    reasonText: "Purchase held pending admission; it is preserved and re-evaluated later.",
    reference: input.purchaseRecordId,
    correlationId: input.correlationId,
    result: "succeeded",
    afterSnapshot: input.snapshot ?? { established: false },
  });
}
