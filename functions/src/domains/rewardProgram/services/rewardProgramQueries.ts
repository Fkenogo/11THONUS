/**
 * Reward Program reads (`PLATFORM-BASELINE-005A`).
 *
 * Membership-gated only -- no `rewardProgram.manage`/`.view` permission
 * check (Section 22, corrected by `PLATFORM-BASELINE-005-
 * REVIEW-FINDINGS-001`'s permission-model refinement). Never creates,
 * repairs, or mutates data.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { PlatformPostgresPool } from "../../../infrastructure/postgres/postgresPool";
import {
  authorizeRewardProgramRead,
  canReadBusinessReviewThreshold,
} from "./rewardProgramAuthorization";
import {
  getRewardProgramById,
  listRewardProgramsForBusiness,
} from "../repositories/rewardProgramRepository";
import type {
  RewardProgramVersionRow,
  RewardProgramVersionView,
  RewardProgramView,
  RewardProgramWithVersions,
} from "../models/rewardProgram";
import {
  rewardProgramCrossBusinessMismatchError,
  rewardProgramNotFoundError,
} from "../models/rewardProgramErrors";

function withoutThreshold(
  version: RewardProgramVersionRow | null,
): RewardProgramVersionView | null {
  if (version === null) {
    return null;
  }
  const view: { -readonly [K in keyof RewardProgramVersionRow]?: RewardProgramVersionRow[K] } = {
    ...version,
  };
  delete view.businessReviewQuantityThreshold;
  return view as RewardProgramVersionView;
}

/** Server-side redaction: only Business Review authority holders receive the routing threshold. */
async function shapeForCaller(
  db: Firestore,
  userId: string,
  businessId: string,
  entry: RewardProgramWithVersions,
): Promise<RewardProgramView> {
  if (await canReadBusinessReviewThreshold(db, userId, businessId)) {
    return entry;
  }
  return {
    program: entry.program,
    currentVersion: withoutThreshold(entry.currentVersion),
    draftVersion: withoutThreshold(entry.draftVersion),
  };
}

export async function getRewardProgram(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: {
    readonly userId: string;
    readonly businessId: string;
    readonly rewardProgramId: string;
  },
): Promise<RewardProgramView> {
  await authorizeRewardProgramRead(db, params.userId, params.businessId);
  const result = await getRewardProgramById(pool, params.rewardProgramId);
  if (!result) {
    throw rewardProgramNotFoundError();
  }
  if (result.program.businessId !== params.businessId) {
    throw rewardProgramCrossBusinessMismatchError();
  }
  return shapeForCaller(db, params.userId, params.businessId, result);
}

export async function listRewardPrograms(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: { readonly userId: string; readonly businessId: string },
): Promise<readonly RewardProgramView[]> {
  await authorizeRewardProgramRead(db, params.userId, params.businessId);
  const entries = await listRewardProgramsForBusiness(pool, params.businessId);
  const reviewer = await canReadBusinessReviewThreshold(db, params.userId, params.businessId);
  return reviewer
    ? entries
    : entries.map((e) => ({
        program: e.program,
        currentVersion: withoutThreshold(e.currentVersion),
        draftVersion: withoutThreshold(e.draftVersion),
      }));
}
