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
import { authorizeRewardProgramRead } from "./rewardProgramAuthorization";
import {
  getRewardProgramById,
  listRewardProgramsForBusiness,
} from "../repositories/rewardProgramRepository";
import type { RewardProgramWithCurrentVersion } from "../models/rewardProgram";
import {
  rewardProgramCrossBusinessMismatchError,
  rewardProgramNotFoundError,
} from "../models/rewardProgramErrors";

export async function getRewardProgram(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: {
    readonly userId: string;
    readonly businessId: string;
    readonly rewardProgramId: string;
  },
): Promise<RewardProgramWithCurrentVersion> {
  await authorizeRewardProgramRead(db, params.userId, params.businessId);
  const result = await getRewardProgramById(pool, params.rewardProgramId);
  if (!result) {
    throw rewardProgramNotFoundError();
  }
  if (result.program.businessId !== params.businessId) {
    throw rewardProgramCrossBusinessMismatchError();
  }
  return result;
}

export async function listRewardPrograms(
  db: Firestore,
  pool: PlatformPostgresPool,
  params: { readonly userId: string; readonly businessId: string },
): Promise<readonly RewardProgramWithCurrentVersion[]> {
  await authorizeRewardProgramRead(db, params.userId, params.businessId);
  return listRewardProgramsForBusiness(pool, params.businessId);
}
