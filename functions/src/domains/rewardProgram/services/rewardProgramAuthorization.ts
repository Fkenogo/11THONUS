/**
 * Reward Program authorization boundary (`PLATFORM-BASELINE-005A`).
 *
 * Writes: `rewardProgram.manage` through the existing (now three-catalogue)
 * `evaluatePermission` chain -- Owner-only in this first package, server-
 * resolved, never a client-supplied role/authority (Section 16).
 *
 * Reads: membership-gated only, no `rewardProgram.view` permission --
 * matches this codebase's actual existing read precedent
 * (`getBusinessContext`, `listStaffMemberships`), corrected into the
 * design by `PLATFORM-BASELINE-005-REVIEW-FINDINGS-001`'s permission-model
 * refinement.
 */

import type { Firestore } from "firebase-admin/firestore";
import { evaluatePermission } from "../../permissions/service/evaluatePermissionService";
import { getBusinessMembershipByUserAndBusiness } from "../../permissions/repositories/businessMembershipRepository";
import { RewardProgramDomainError } from "../models/rewardProgramErrors";
import type { ErrorCategory } from "../../../shared/errors/errorCategories";

export async function authorizeRewardProgramManage(
  db: Firestore,
  userId: string,
  businessId: string,
): Promise<void> {
  const decision = await evaluatePermission(db, {
    userId,
    businessId,
    permission: "rewardProgram.manage",
  });
  if (!decision.allowed) {
    throw new RewardProgramDomainError(
      (decision.errorCategory as ErrorCategory | undefined) ?? "AUTH_FORBIDDEN",
      "Not authorized to manage Reward Programs for this Business.",
    );
  }
}

export async function authorizeRewardProgramRead(
  db: Firestore,
  userId: string,
  businessId: string,
): Promise<void> {
  const membership = await getBusinessMembershipByUserAndBusiness(db, userId, businessId);
  if (
    membership.kind !== "found" ||
    membership.membership.status !== "active" ||
    membership.membership.businessId !== businessId ||
    membership.membership.userId !== userId
  ) {
    throw new RewardProgramDomainError(
      "AUTH_FORBIDDEN",
      "Not authorized to read Reward Programs for this Business.",
    );
  }
}
