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
import {
  evaluatePermission,
  evaluatePermissionWithContext,
} from "../../permissions/service/evaluatePermissionService";
import { recordSensitiveDecisionStandalone } from "../../permissions/service/permissionAuditService";
import { getBusinessMembershipByUserAndBusiness } from "../../permissions/repositories/businessMembershipRepository";
import { PurchaseDomainError } from "../models/purchaseErrors";
import type { ErrorCategory } from "../../../shared/errors/errorCategories";
import type { RecorderRole } from "../models/purchase";

/**
 * The closed set of Business roles that may ever be recorded as the
 * confirming member's role. Mirrors `redemptions.confirmed_by_role`'s CHECK
 * constraint exactly — audit context only; accountability itself is always
 * the individual membership id, never this role.
 */
export type RedemptionConfirmerRole = Extract<RecorderRole, "owner" | "manager" | "staff">;

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

/**
 * Redemption confirmation authority (`CAPABILITY-6-REDEMPTION-ENGINE-001`,
 * `DEC-LOY-018` D-2 / `FD-REDEMPTION-AUTHORITY-001`).
 *
 * Resolved LIVE at the point of confirmation through the single existing
 * permission architecture — `evaluatePermissionWithContext` — never from
 * client-supplied role/authority and never from a cached decision. That is
 * what makes a permission revoked between page load and confirmation stop
 * authorising the confirmation: the membership document and its overrides
 * are re-read on every attempt.
 *
 * There is no redemption-specific branch here and no second authorization
 * architecture. `redemption.confirm` is an ordinary sensitive-catalogue
 * entry, so this function does exactly what `authorizePurchaseRecord`
 * already does for `purchase.record`: call the evaluator, translate a
 * refusal into the domain's stable AUTH error, and return the role the
 * evaluator itself resolved so it can be recorded as audit context.
 *
 * The evaluator has no Platform Administrator path and Customers hold no
 * Business membership, so both reduce to the same fail-closed refusal here
 * without a special case. The returned `membershipId` is the RESOLVED
 * membership's own id (individual attribution, `DEC-ID-002`) — never a
 * generic role string standing in for an accountable person.
 */
export async function authorizeRedemptionConfirm(
  db: Firestore,
  userId: string,
  businessId: string,
  params: { readonly idempotencyKey: string; readonly requireAudit: boolean },
): Promise<{ readonly role: RedemptionConfirmerRole; readonly membershipId: string }> {
  const { decision, membership } = await evaluatePermissionWithContext(db, {
    userId,
    businessId,
    permission: "redemption.confirm",
  });

  // `redemption.confirm` is registered with `auditRequirement: "mandatory"`, so
  // every accountable decision about it — allow AND deny — must be audited
  // (004C). The established `authorizeAndExecute` boundary composes that audit
  // write with the protected mutation inside ONE Firestore transaction; this
  // command's mutation is a PostgreSQL transaction, which cannot be nested in a
  // Firestore one, so the audit is written through the same
  // `recordSensitiveDecision` primitive in its own transaction. The invariant
  // 004C protects — a sensitive decision is never acted on without its audit
  // record — still holds, and it is written BEFORE this function returns, so
  // no redemption can commit without it.
  //
  // `requireAudit: false` is used only for the mid-transaction revalidation
  // (see `confirmRedemptionCommand`): that second read must not emit a second
  // decision record for the same attempt, because the first evaluation of the
  // same (userId, businessId, permission, idempotencyKey) is the accountable
  // one and `recordSensitiveDecision` is itself idempotent per event.
  if (params.requireAudit) {
    await recordSensitiveDecisionStandalone(
      db,
      {
        decision,
        request: { userId, businessId, permission: "redemption.confirm" },
        membershipId: membership.kind === "found" ? membership.membership.id : undefined,
        idempotencyKey: params.idempotencyKey,
      },
      new Date(),
    );
  }

  if (!decision.allowed) {
    throw new PurchaseDomainError(
      (decision.errorCategory as ErrorCategory | undefined) ?? "AUTH_FORBIDDEN",
      "Not authorized to confirm reward redemptions for this Business.",
    );
  }
  if (membership.kind !== "found") {
    // Unreachable while `decision.allowed` is true (the evaluator denies
    // every no-membership case), but kept so attribution can never be
    // recorded without a resolved membership to attribute it to.
    throw new PurchaseDomainError(
      "AUTH_FORBIDDEN",
      "Not authorized to confirm reward redemptions for this Business.",
    );
  }
  const role = decision.role;
  if (role !== "owner" && role !== "manager" && role !== "staff") {
    throw new PurchaseDomainError(
      "AUTH_FORBIDDEN",
      "Not authorized to confirm reward redemptions for this Business.",
    );
  }
  return { role, membershipId: membership.membership.id };
}
