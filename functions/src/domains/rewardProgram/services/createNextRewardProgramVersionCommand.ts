/**
 * `createNextRewardProgramVersion` command (`PLATFORM-BASELINE-005A`).
 *
 * Creates a new editable draft (version N+1), seeded from the current
 * active version's snapshot, without mutating that version. Does not
 * publish automatically. Rejects creating a second simultaneous
 * next-version draft while one already exists (Section 21) -- the
 * smallest invariant needed for deterministic editing.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import { withPlatformTransaction } from "../../../infrastructure/postgres/postgresTransaction";
import { authorizeRewardProgramManage } from "./rewardProgramAuthorization";
import { validateAllReferences } from "./rewardProgramKnowledgeValidation";
import { resolveQualifyingItemSnapshots } from "./rewardProgramQualificationValidation";
import { rewardProgramRequestHash } from "./rewardProgramRequestHash";
import {
  checkAndReserveIdempotencyKey,
  completeIdempotencyKeyInTransaction,
} from "../repositories/idempotencyRepository";
import {
  getLatestVersionForProgram,
  getRewardProgramById,
  insertNextDraftVersion,
} from "../repositories/rewardProgramRepository";
import { writeRewardProgramOutboxEntry } from "../repositories/rewardProgramOutboxRepository";
import type { RewardProgramVersionRow } from "../models/rewardProgram";
import {
  rewardProgramCrossBusinessMismatchError,
  rewardProgramIdempotencyConflictError,
  rewardProgramIdempotencyInProgressError,
  rewardProgramNotFoundError,
} from "../models/rewardProgramErrors";
import { RewardProgramDomainError } from "../models/rewardProgramErrors";

export type CreateNextRewardProgramVersionRequest = {
  readonly businessId: string;
  readonly rewardProgramId: string;
  readonly rewardDescription: string;
  readonly standardRewardNodeId?: string | null;
  readonly multipleUnitsAllowed: boolean;
  readonly sharedLoyaltyNumberAllowed: boolean;
  readonly bulkReviewThreshold?: number | null;
  readonly effectiveFrom: Date;
  readonly effectiveUntil?: Date | null;
  /** Structural qualification identity (`PLATFORM-BASELINE-013B`): validated + snapshotted server-side. */
  readonly qualifyingItemIds: readonly string[];
};

export async function createNextRewardProgramVersion(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: {
    readonly userId: string;
    readonly request: CreateNextRewardProgramVersionRequest;
    readonly idempotencyKey: string;
    readonly correlationId: string;
  },
): Promise<RewardProgramVersionRow> {
  await authorizeRewardProgramManage(db, params.userId, params.request.businessId);

  const existing = await getRewardProgramById(pool, params.request.rewardProgramId);
  if (!existing) {
    throw rewardProgramNotFoundError();
  }
  if (existing.program.businessId !== params.request.businessId) {
    throw rewardProgramCrossBusinessMismatchError();
  }

  await validateAllReferences(db, {
    rewardProgramCategoryId: existing.program.rewardProgramCategoryId,
    standardRewardNodeId: params.request.standardRewardNodeId,
  });
  const qualifyingItems = await resolveQualifyingItemSnapshots(
    pool,
    db,
    params.request.businessId,
    params.request.qualifyingItemIds,
  );

  const contentFingerprint = JSON.stringify({
    rewardDescription: params.request.rewardDescription,
    standardRewardNodeId: params.request.standardRewardNodeId ?? null,
    multipleUnitsAllowed: params.request.multipleUnitsAllowed,
    sharedLoyaltyNumberAllowed: params.request.sharedLoyaltyNumberAllowed,
    bulkReviewThreshold: params.request.bulkReviewThreshold ?? null,
    effectiveFrom: params.request.effectiveFrom.toISOString(),
    effectiveUntil: params.request.effectiveUntil?.toISOString() ?? null,
    qualifyingItemIds: params.request.qualifyingItemIds,
  });
  const requestHash = rewardProgramRequestHash(
    "createNextVersion",
    params.userId,
    params.request.businessId,
    params.request.rewardProgramId,
    contentFingerprint,
  );

  return withPlatformTransaction(pool, async (tx) => {
    const reservation = await checkAndReserveIdempotencyKey(tx, {
      idempotencyKey: params.idempotencyKey,
      operationType: "rewardProgram.createNextVersion",
      actorId: params.userId,
      requestHash,
      correlationId: params.correlationId,
    });
    if (reservation.outcome === "duplicate") {
      return reservation.responseSnapshot as RewardProgramVersionRow;
    }
    if (reservation.outcome === "in_progress") {
      throw rewardProgramIdempotencyInProgressError();
    }
    if (reservation.outcome === "conflict") {
      throw rewardProgramIdempotencyConflictError();
    }

    const latest = await getLatestVersionForProgram(tx, params.request.rewardProgramId);
    if (!latest) {
      throw rewardProgramNotFoundError();
    }
    if (latest.status === "draft") {
      // Section 21: do not permit two ambiguous simultaneous next-version
      // drafts -- the existing draft must be published or the caller must
      // continue editing it via `updateRewardProgramDraft`.
      throw new RewardProgramDomainError(
        "INVALID_STATE_TRANSITION",
        "A draft version already exists for this Reward Program; publish or edit it before creating another.",
      );
    }

    const nextDraft = await insertNextDraftVersion(tx, {
      programId: params.request.rewardProgramId,
      baseVersion: latest,
      actorId: params.userId,
      draft: {
        rewardDescription: params.request.rewardDescription,
        standardRewardNodeId: params.request.standardRewardNodeId ?? null,
        multipleUnitsAllowed: params.request.multipleUnitsAllowed,
        sharedLoyaltyNumberAllowed: params.request.sharedLoyaltyNumberAllowed,
        bulkReviewThreshold: params.request.bulkReviewThreshold ?? null,
        effectiveFrom: params.request.effectiveFrom,
        effectiveUntil: params.request.effectiveUntil ?? null,
        qualifyingItemIds: params.request.qualifyingItemIds,
      },
      qualifyingItems,
    });

    await writeRewardProgramOutboxEntry(tx, {
      eventType: "reward_program_version_draft_created",
      aggregateId: params.request.rewardProgramId,
      payload: { versionId: nextDraft.id, version: nextDraft.version },
      actorId: params.userId,
      correlationId: params.correlationId,
      idempotencyKey: params.idempotencyKey,
    });

    await completeIdempotencyKeyInTransaction(tx, params.idempotencyKey, nextDraft.id, nextDraft);
    return nextDraft;
  });
}
