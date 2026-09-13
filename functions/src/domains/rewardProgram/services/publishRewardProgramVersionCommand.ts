/**
 * `publishRewardProgramVersion` command (`PLATFORM-BASELINE-005A`).
 *
 * Implements the exact cross-store publication contract corrected by
 * `PLATFORM-BASELINE-005-REVIEW-FINDINGS-001` (RF-3): an authoritative
 * Firestore validation read happens BEFORE the PostgreSQL transaction
 * begins (never inside it -- it is not part of that transaction's
 * conflict set); the PostgreSQL transaction then atomically performs
 * every PostgreSQL-side publication write. The resulting bounded race
 * (a node retiring between the validation read and the PostgreSQL commit)
 * is accepted, not hidden -- a version that passed validation at its
 * publication point is never retroactively invalidated by a later
 * retirement, the same rule already applied to a published version's
 * entire subsequent lifetime.
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
  peekIdempotencyKey,
} from "../repositories/idempotencyRepository";
import {
  getDraftVersionForUpdate,
  getRewardProgramById,
  getVersionById,
  publishVersion,
} from "../repositories/rewardProgramRepository";
import { writeRewardProgramOutboxEntry } from "../repositories/rewardProgramOutboxRepository";
import type { RewardProgramVersionRow } from "../models/rewardProgram";
import {
  rewardProgramCrossBusinessMismatchError,
  rewardProgramNotFoundError,
  rewardProgramVersionNotDraftError,
  rewardProgramVersionNotFoundError,
} from "../models/rewardProgramErrors";

export type PublishRewardProgramVersionRequest = {
  readonly businessId: string;
  readonly rewardProgramId: string;
  readonly versionId: string;
};

export async function publishRewardProgramVersion(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: {
    readonly userId: string;
    readonly request: PublishRewardProgramVersionRequest;
    readonly idempotencyKey: string;
    readonly correlationId: string;
  },
): Promise<RewardProgramVersionRow> {
  await authorizeRewardProgramManage(db, params.userId, params.request.businessId);

  const requestHash = rewardProgramRequestHash(
    "publish",
    params.userId,
    params.request.businessId,
    params.request.versionId,
    "publish",
  );

  // Idempotent-replay short-circuit, BEFORE any precondition check: a
  // genuine same-key/same-request replay must not re-run the "is this
  // still a draft" precondition against state the FIRST call already
  // changed (the version this replay targets is no longer "draft"
  // precisely because that first call already published it). This peek
  // is read-only and non-reserving -- the real correctness guarantee
  // (conflict/in-progress detection, atomic reserve) still comes from
  // `checkAndReserveIdempotencyKey` inside the transaction below,
  // regardless of what this peek finds.
  const peek = await peekIdempotencyKey(pool, params.idempotencyKey, requestHash);
  if (peek.outcome === "duplicate") {
    return peek.responseSnapshot as RewardProgramVersionRow;
  }

  const existing = await getRewardProgramById(pool, params.request.rewardProgramId);
  if (!existing) {
    throw rewardProgramNotFoundError();
  }
  if (existing.program.businessId !== params.request.businessId) {
    throw rewardProgramCrossBusinessMismatchError();
  }

  // Step 1 of the RF-3 contract: read the draft's current qualifying/
  // category/reward-node references directly (not the cached
  // `existing.currentVersion`, which is the *prior active* version, not
  // the draft being published).
  const draftPreview = await getVersionById(pool, params.request.versionId);
  if (!draftPreview || draftPreview.rewardProgramId !== params.request.rewardProgramId) {
    throw rewardProgramVersionNotFoundError();
  }
  if (draftPreview.status !== "draft") {
    throw rewardProgramVersionNotDraftError();
  }

  // Step 2: authoritative Firestore validation, BEFORE the PostgreSQL
  // transaction begins -- this read is never part of that transaction's
  // conflict set (RF-3, item F). A node retiring in the window between
  // this line and the transaction's commit is the disclosed, accepted
  // race (RF-3, item G) -- not eliminated by this design.
  await validateAllReferences(db, {
    rewardProgramCategoryId: existing.program.rewardProgramCategoryId,
    standardRewardNodeId: draftPreview.standardRewardNodeId,
    qualifyingNodes: draftPreview.qualifyingNodes,
  });

  // Step 3: only now does the PostgreSQL publication transaction begin.
  return withPlatformTransaction(pool, async (tx) => {
    const reservation = await checkAndReserveIdempotencyKey(tx, {
      idempotencyKey: params.idempotencyKey,
      operationType: "rewardProgram.publish",
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

    // Re-check draft state under the transaction's row lock (prevents a
    // concurrent publish/edit racing between the pre-check above and this
    // transaction's start on the PostgreSQL side, per Section 20).
    const lockedDraft = await getDraftVersionForUpdate(tx, params.request.versionId);
    if (!lockedDraft || lockedDraft.status !== "draft") {
      throw rewardProgramVersionNotDraftError();
    }

    const published = await publishVersion(tx, {
      programId: params.request.rewardProgramId,
      versionId: params.request.versionId,
      actorUpdatedBy: params.userId,
    });

    await writeRewardProgramOutboxEntry(tx, {
      eventType: "reward_program_version_published",
      aggregateId: params.request.rewardProgramId,
      payload: { versionId: published.id, version: published.version },
      actorId: params.userId,
      correlationId: params.correlationId,
      idempotencyKey: params.idempotencyKey,
    });

    await completeIdempotencyKeyInTransaction(tx, params.idempotencyKey, published.id, published);
    return published;
  });
}
