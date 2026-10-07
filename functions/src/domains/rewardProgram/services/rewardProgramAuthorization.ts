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

/**
 * Whether the caller may READ the Business Review routing threshold of a Reward Program Version
 * (`EA-BL-001-CORR-002-BR`): exactly the Owner / authorised Manager who hold the live
 * `purchase.businessReview` authority. Staff record Purchases (they see the routing OUTCOME) but must
 * never learn the configured threshold -- it would let a recorder size Purchases to dodge review.
 * Unaudited, non-throwing, never from a client claim.
 */
export async function canReadBusinessReviewThreshold(
  db: Firestore,
  userId: string,
  businessId: string,
): Promise<boolean> {
  const decision = await evaluatePermission(db, {
    userId,
    businessId,
    permission: "purchase.businessReview",
  });
  return decision.allowed && (decision.role === "owner" || decision.role === "manager");
}
