/**
 * Qualifying Item authorization boundary (`PLATFORM-BASELINE-013A.2`,
 * `DEC-LOY-017` / `FD-QUALIFYING-ITEM-ROLE-AUTHORITY-001`).
 *
 * Writes: `qualifyingItem.manage` through the existing (now five-catalogue)
 * `evaluatePermission` chain -- Owner and Manager, never Staff, server-
 * resolved and never a client-supplied role/authority. There is no UI-only
 * role check anywhere in this domain: `evaluatePermission` is the sole
 * authority. A Platform Administrator holds no Business membership by
 * virtue of that status and is therefore denied like any other outsider.
 *
 * Reads: membership-gated only -- no `qualifyingItem.view` permission --
 * matching the Reward Program and Purchase read precedent
 * (`authorizeRewardProgramRead`, `authorizeBusinessPurchaseRead`). Every
 * active member of the Business, Staff included, may view and select the
 * Business's items for frontline transaction recording; none of them
 * thereby receives `qualifyingItem.manage`.
 */

import type { Firestore } from "firebase-admin/firestore";
import { evaluatePermission } from "../../permissions/service/evaluatePermissionService";
import { getBusinessMembershipByUserAndBusiness } from "../../permissions/repositories/businessMembershipRepository";
import { QualifyingItemDomainError } from "../models/qualifyingItemErrors";
import type { ErrorCategory } from "../../../shared/errors/errorCategories";

export async function authorizeQualifyingItemManage(
  db: Firestore,
  userId: string,
  businessId: string,
): Promise<void> {
  const decision = await evaluatePermission(db, {
    userId,
    businessId,
    permission: "qualifyingItem.manage",
  });
  if (!decision.allowed) {
    throw new QualifyingItemDomainError(
      (decision.errorCategory as ErrorCategory | undefined) ?? "AUTH_FORBIDDEN",
      "Not authorized to manage Qualifying Items for this Business.",
    );
  }
}

export async function authorizeQualifyingItemRead(
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
    throw new QualifyingItemDomainError(
      "AUTH_FORBIDDEN",
      "Not authorized to read Qualifying Items for this Business.",
    );
  }
}
