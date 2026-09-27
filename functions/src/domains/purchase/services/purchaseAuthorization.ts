/**
 * Purchase authorization boundary (`PLATFORM-BASELINE-006A`, design §11).
 *
 * Writes: `purchase.record` through the existing (now four-catalogue)
 * `evaluatePermission` chain — Staff/Manager/Owner per PRD5 §8,
 * server-resolved, never a client-supplied role/authority. Returns the
 * resolved role so `recordPurchase` stores `recorded_by_role` as audit
 * display (the role the evaluator itself resolved, not a client claim).
 *
 * Reads: membership-gated only (no catalogue entry — matches the 005A
 * reward-read precedent). Customer verify/reject/dispute: pure ownership
 * check (`purchase.customer_identity_id == server-resolved identity`),
 * enforced inside the command transaction after the row lock.
 */

import type { Firestore } from "firebase-admin/firestore";
import { evaluatePermission } from "../../permissions/service/evaluatePermissionService";
import { getBusinessMembershipByUserAndBusiness } from "../../permissions/repositories/businessMembershipRepository";
import { PurchaseDomainError } from "../models/purchaseErrors";
import type { ErrorCategory } from "../../../shared/errors/errorCategories";
import type { RecorderRole } from "../models/purchase";

export async function authorizePurchaseRecord(
  db: Firestore,
  userId: string,
  businessId: string,
): Promise<{ readonly role: RecorderRole }> {
  const decision = await evaluatePermission(db, {
    userId,
    businessId,
    permission: "purchase.record",
  });
  if (!decision.allowed) {
    throw new PurchaseDomainError(
      (decision.errorCategory as ErrorCategory | undefined) ?? "AUTH_FORBIDDEN",
      "Not authorized to record Purchases for this Business.",
    );
  }
  if (decision.role !== "staff" && decision.role !== "manager" && decision.role !== "owner") {
    throw new PurchaseDomainError(
      "AUTH_FORBIDDEN",
      "Not authorized to record Purchases for this Business.",
    );
  }
  return { role: decision.role };
}

export async function authorizeBusinessPurchaseRead(
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
    throw new PurchaseDomainError(
      "AUTH_FORBIDDEN",
      "Not authorized to read Purchases for this Business.",
    );
  }
}

/**
 * Business-wide Customer Reward / Loyalty-Cycle visibility
 * (`BUSINESS-REWARD-CYCLE-VISIBILITY-001`): Owner and Manager only.
 *
 * A read, so — like every Business read — it is re-derived from the
 * caller's own live membership rather than a permission-catalogue entry
 * (the catalogues govern mutating authority; `businessCallerAuthority.ts`
 * §21). Role narrowing on that membership mirrors
 * `resolveAuthorizedBusinessForOwnerAction` without minting a permission.
 * PRD1 §6.3/§7.3 give Owner "view reports"/"view all business purchase
 * records" and Manager "view operational reports"/"view transactions";
 * PRD1 §8.2/§8.3 limit Staff to "limited customer progress needed to
 * complete the transaction" and forbid exporting customer lists, so this
 * Business-wide list excludes Staff. There is no Platform Administrator
 * path: only a Business membership can satisfy this gate. Every failure
 * (no membership, inactive, wrong Business, Staff) is the same
 * AUTH_FORBIDDEN, so the cases are indistinguishable to the caller.
 */
export async function authorizeBusinessLoyaltyVisibilityRead(
  db: Firestore,
  userId: string,
  businessId: string,
): Promise<void> {
  const membership = await getBusinessMembershipByUserAndBusiness(db, userId, businessId);
  if (
    membership.kind !== "found" ||
    membership.membership.status !== "active" ||
    membership.membership.businessId !== businessId ||
    membership.membership.userId !== userId ||
    (membership.membership.role !== "owner" && membership.membership.role !== "manager")
  ) {
    throw new PurchaseDomainError(
      "AUTH_FORBIDDEN",
      "Not authorized to view Customer rewards and progress for this Business.",
    );
  }
}
