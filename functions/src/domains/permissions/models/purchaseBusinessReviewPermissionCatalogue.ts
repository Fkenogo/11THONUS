/**
 * Business Review Permission Catalogue (`EA-BL-001-CORR-002-BR`, `DEC-PROD-015`).
 *
 * A structurally separate catalogue module holding exactly `purchase.businessReview` — the
 * governed authority to APPROVE or REJECT a Purchase that the Business Review gate has routed to
 * `business_review_required` — following the `DEC-LOY-017` / `DEC-LOY-018` precedent
 * (`qualifyingItemPermissionCatalogue.ts`, `redemptionPermissionCatalogue.ts`): a new authority is
 * minted in its own disjoint module rather than by widening an unrelated catalogue, and the
 * Sensitive catalogue registers it so evaluation, override administration (`staff.assignPermissions`)
 * and mandatory audit reuse the existing architecture with no review-specific bypass.
 *
 * Authority (Founder-approved, `DEC-PROD-015` + BR authorisation PR #303):
 * - Owner holds the permission by default via the existing Owner floor (non-revocable: ordinary
 *   membership overrides cannot target Owners).
 * - Manager holds it by default (`owner_and_manager_default` inheritance), revocable and
 *   re-grantable through the normal governed override mechanism.
 * - Staff is INELIGIBLE at MVP, and that is structural rather than a default-deny: `Staff` is not in
 *   `explicitGrantEligibleRoles`, so (1) `createPermissionOverride` refuses any Staff-targeted
 *   grant, (2) `evaluatePermission` independently refuses a fabricated/stale Staff grant
 *   (`GRANT_NOT_HONORED`) because it revalidates eligibility rather than trusting stored override
 *   presence, (3) the Staff role template inherits nothing, and (4) a role change away from Manager
 *   reconciles a stored Manager grant away. Staff may still RECORD purchases (`purchase.record`).
 * - Platform Administrators hold no tenant Business Review authority by virtue of that status
 *   (`Role` is the closed owner/manager/staff union; the evaluator has no platform-administrator
 *   path). Customers hold no Business membership, so no Business Review authority.
 *
 * Self-review is NOT a permission concern: it is a per-purchase invariant enforced inside the
 * review transaction (`reviewer_user_id != recorded_by_user_id`), with a database CHECK backstop.
 *
 * Lifecycle: the legacy Sensitive set (`trial`, `active`), same as `purchase.record`. The
 * commercial-`suspended` default-allow of redemption does NOT transfer: reviewing new purchases for a
 * suspended Business stays fail-closed.
 */

import type { PermissionId } from "./permissionId";
import type { Role } from "./role";
// Type-only edge toward the sensitive catalogue (which registers this entry at load time): a runtime
// import back would be a module-load cycle. Cross-catalogue id separation is enforced by this
// module's own test instead.
import type { SensitivePermissionCatalogueEntry } from "./sensitivePermissionCatalogue";

export const PURCHASE_BUSINESS_REVIEW_PERMISSION_ID = "purchase.businessReview" as PermissionId;

/** Manager re-grant after explicit revocation ONLY. Staff is deliberately absent: no grant path exists. */
export const PURCHASE_BUSINESS_REVIEW_GRANT_ELIGIBLE_ROLES: readonly Role[] = ["manager"];

export const PURCHASE_BUSINESS_REVIEW_CATALOGUE_ENTRY: SensitivePermissionCatalogueEntry = {
  id: PURCHASE_BUSINESS_REVIEW_PERMISSION_ID,
  meaning: "Approve or reject a Purchase awaiting Business Review (before Customer verification)",
  owningDomain: "Purchase domain",
  defaultState: "owner_and_manager_default",
  inheritAllowed: true,
  explicitGrantRequired: true,
  explicitGrantEligibleRoles: PURCHASE_BUSINESS_REVIEW_GRANT_ELIGIBLE_ROLES,
  explicitRevocationSupported: true,
  auditRequirement: "mandatory",
  rationale: ["c"],
  // No `eligibleBusinessStatuses` override on purpose: absence means the unchanged legacy Sensitive set
  // {trial, active} (`evaluatePermission.ts`), which is exactly the lifecycle this permission wants.
};

export function isPurchaseBusinessReviewPermission(permissionId: string): boolean {
  return permissionId === PURCHASE_BUSINESS_REVIEW_PERMISSION_ID;
}
