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
