/**
 * `createRewardProgram` command (`PLATFORM-BASELINE-005A`).
 *
 * Creates a Reward Program's stable identity plus its version-1 draft in
 * one PostgreSQL transaction. Does not publish (Section 18: publish is a
 * separate, explicit command).
 */

import type { Firestore } from "firebase-admin/firestore";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import { withPlatformTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import { authorizeRewardProgramManage } from "./rewardProgramAuthorization";
import { validateAllReferences } from "./rewardProgramKnowledgeValidation";
import { rewardProgramRequestHash } from "./rewardProgramRequestHash";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKeyInTransaction,
} from "../repositories/idempotencyRepository";
import { insertRewardProgramWithFirstDraft } from "../repositories/rewardProgramRepository";
import { writeRewardProgramOutboxEntry } from "../repositories/rewardProgramOutboxRepository";
import { FIXED_REQUIRED_VERIFIED_UNITS, FIXED_REWARD_QUANTITY } from "../models/rewardProgram";
import type {
  QualifyingNode,
  RewardProgramRow,
  RewardProgramVersionRow,
} from "../models/rewardProgram";

export type CreateRewardProgramRequest = {
  readonly businessId: string;
  readonly displayName: string;
  readonly rewardProgramCategoryId: string;
  readonly rewardDescription: string;
  readonly standardRewardNodeId?: string | null;
  readonly multipleUnitsAllowed: boolean;
  readonly sharedLoyaltyNumberAllowed: boolean;
  readonly bulkReviewThreshold?: number | null;
  readonly effectiveFrom: Date;
  readonly effectiveUntil?: Date | null;
  readonly qualifyingNodes: readonly QualifyingNode[];
};

export type CreateRewardProgramResult = {
  readonly program: RewardProgramRow;
  readonly version: RewardProgramVersionRow;
};

export async function createRewardProgram(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: {
    readonly userId: string;
    readonly request: CreateRewardProgramRequest;
    readonly idempotencyKey: string;
    readonly correlationId: string;
  },
): Promise<CreateRewardProgramResult> {
  // Business lifecycle eligibility (trial/active) is enforced inside
  // `authorizeRewardProgramManage` itself, via the evaluator's per-class
  // eligibility gate for the `rewardProgram` catalogue -- no separate
  // check is needed here (would duplicate the evaluator's own job).
  await authorizeRewardProgramManage(db, params.userId, params.request.businessId);
  await validateAllReferences(db, params.request);

  const contentFingerprint = JSON.stringify({
    displayName: params.request.displayName,
    rewardProgramCategoryId: params.request.rewardProgramCategoryId,
    rewardDescription: params.request.rewardDescription,
    standardRewardNodeId: params.request.standardRewardNodeId ?? null,
    multipleUnitsAllowed: params.request.multipleUnitsAllowed,
    sharedLoyaltyNumberAllowed: params.request.sharedLoyaltyNumberAllowed,
    bulkReviewThreshold: params.request.bulkReviewThreshold ?? null,
    effectiveFrom: params.request.effectiveFrom.toISOString(),
    effectiveUntil: params.request.effectiveUntil?.toISOString() ?? null,
    qualifyingNodes: params.request.qualifyingNodes,
  });
  const requestHash = rewardProgramRequestHash(
    "create",
    params.userId,
    params.request.businessId,
    params.request.businessId,
    contentFingerprint,
  );

  return withPlatformTransaction(pool, async (tx) => {
    const reservation = await checkAndReserveIdempotencyKey(tx, {
      idempotencyKey: params.idempotencyKey,
      operationType: "rewardProgram.create",
      actorId: params.userId,
      requestHash,
      correlationId: params.correlationId,
    });
    if (reservation.outcome === "duplicate") {
      return reservation.responseSnapshot as CreateRewardProgramResult;
    }
    if (reservation.outcome === "in_progress") {
      throw new Error("IDEMPOTENCY_IN_PROGRESS");
    }
    if (reservation.outcome === "conflict") {
      throw new Error("IDEMPOTENCY_CONFLICT");
    }

    const { program, version } = await insertRewardProgramWithFirstDraft(tx, {
      businessId: params.request.businessId,
      displayName: params.request.displayName,
      rewardProgramCategoryId: params.request.rewardProgramCategoryId,
      actorId: params.userId,
      requiredVerifiedUnits: FIXED_REQUIRED_VERIFIED_UNITS,
      rewardQuantity: FIXED_REWARD_QUANTITY,
      draft: {
        rewardDescription: params.request.rewardDescription,
        standardRewardNodeId: params.request.standardRewardNodeId ?? null,
        multipleUnitsAllowed: params.request.multipleUnitsAllowed,
        sharedLoyaltyNumberAllowed: params.request.sharedLoyaltyNumberAllowed,
        bulkReviewThreshold: params.request.bulkReviewThreshold ?? null,
        effectiveFrom: params.request.effectiveFrom,
        effectiveUntil: params.request.effectiveUntil ?? null,
        qualifyingNodes: params.request.qualifyingNodes,
      },
    });

    await writeRewardProgramOutboxEntry(tx, {
      eventType: "reward_program_created",
      aggregateId: program.id,
      payload: { businessId: program.businessId, versionId: version.id },
      actorId: params.userId,
      correlationId: params.correlationId,
      idempotencyKey: params.idempotencyKey,
    });

    const result: CreateRewardProgramResult = { program, version };
    await completeIdempotencyKeyInTransaction(tx, params.idempotencyKey, program.id, result);
    return result;
  });
}
