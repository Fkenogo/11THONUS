/**
 * `updateRewardProgramDraft` command (`PLATFORM-BASELINE-005A`).
 *
 * Edits only a draft (unpublished) version's editable fields. Rejects a
 * published version, wrong-Business/wrong-program targeting, and a stale
 * concurrent edit (Section 19 optimistic concurrency via `rowVersion`).
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
import {
  getDraftVersionForUpdate,
  getRewardProgramById,
  updateDraftVersion,
} from "../repositories/rewardProgramRepository";
import type { QualifyingNode, RewardProgramVersionRow } from "../models/rewardProgram";
import {
  rewardProgramCrossBusinessMismatchError,
  rewardProgramNotFoundError,
  rewardProgramVersionNotDraftError,
  rewardProgramVersionNotFoundError,
  staleDraftUpdateError,
} from "../models/rewardProgramErrors";

export type UpdateRewardProgramDraftRequest = {
  readonly businessId: string;
  readonly rewardProgramId: string;
  readonly versionId: string;
  readonly expectedRowVersion: number;
  readonly rewardDescription: string;
  readonly standardRewardNodeId?: string | null;
  readonly multipleUnitsAllowed: boolean;
  readonly sharedLoyaltyNumberAllowed: boolean;
  readonly bulkReviewThreshold?: number | null;
  readonly effectiveFrom: Date;
  readonly effectiveUntil?: Date | null;
  readonly qualifyingNodes: readonly QualifyingNode[];
};

export async function updateRewardProgramDraft(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: {
    readonly userId: string;
    readonly request: UpdateRewardProgramDraftRequest;
    readonly idempotencyKey: string;
    readonly correlationId: string;
  },
): Promise<RewardProgramVersionRow> {
  await authorizeRewardProgramManage(db, params.userId, params.request.businessId);

  // Pre-check outside the PG transaction: confirm the program/version
  // belong to the requested Business before doing any Firestore
  // validation work (cheap fail-fast; the transaction below re-locks and
  // re-checks the version row regardless, closing any TOCTOU gap on the
  // PostgreSQL side).
  const existingProgram = await getRewardProgramById(pool, params.request.rewardProgramId);
  if (!existingProgram) {
    throw rewardProgramNotFoundError();
  }
  if (existingProgram.program.businessId !== params.request.businessId) {
    throw rewardProgramCrossBusinessMismatchError();
  }

  await validateAllReferences(db, {
    rewardProgramCategoryId: existingProgram.program.rewardProgramCategoryId,
    standardRewardNodeId: params.request.standardRewardNodeId,
    qualifyingNodes: params.request.qualifyingNodes,
  });

  const contentFingerprint = JSON.stringify({
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
    "updateDraft",
    params.userId,
    params.request.businessId,
    params.request.versionId,
    contentFingerprint,
  );

  return withPlatformTransaction(pool, async (tx) => {
    const reservation = await checkAndReserveIdempotencyKey(tx, {
      idempotencyKey: params.idempotencyKey,
      operationType: "rewardProgram.updateDraft",
      actorId: params.userId,
      requestHash,
      correlationId: params.correlationId,
    });
    if (reservation.outcome === "duplicate") {
      return reservation.responseSnapshot as RewardProgramVersionRow;
    }
    if (reservation.outcome === "in_progress") {
      throw new Error("IDEMPOTENCY_IN_PROGRESS");
    }
    if (reservation.outcome === "conflict") {
      throw new Error("IDEMPOTENCY_CONFLICT");
    }

    const currentDraft = await getDraftVersionForUpdate(tx, params.request.versionId);
    if (!currentDraft || currentDraft.rewardProgramId !== params.request.rewardProgramId) {
      throw rewardProgramVersionNotFoundError();
    }
    if (currentDraft.status !== "draft") {
      throw rewardProgramVersionNotDraftError();
    }

    const updated = await updateDraftVersion(tx, {
      versionId: params.request.versionId,
      expectedRowVersion: params.request.expectedRowVersion,
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
    if (!updated) {
      throw staleDraftUpdateError();
    }

    await completeIdempotencyKeyInTransaction(tx, params.idempotencyKey, updated.id, updated);
    return updated;
  });
}
