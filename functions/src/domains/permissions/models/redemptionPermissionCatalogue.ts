/**
 * Redemption Confirmation Permission Catalogue (`CAPABILITY-6-REDEMPTION-ENGINE-001`,
 * `DEC-LOY-018` / `FD-REDEMPTION-AUTHORITY-001`).
 *
 * A structurally separate catalogue module holding exactly
 * `redemption.confirm` — the explicit governed redemption-confirmation
 * capability — per the `DEC-LOY-017` precedent (`qualifyingItemPermissionCatalogue.ts`):
 * a new authority is minted in its own disjoint module rather than by
 * widening an unrelated catalogue, and `reward.override` ("outside normal
 * redemption rules") is NOT reused for normal redemption.
 *
 * Unlike `DEC-LOY-017`'s role-default-only catalogue, redemption
 * confirmation carries the full sensitive lifecycle: Owner floor,
 * Manager default with explicit revoke/re-grant, Staff explicit grant,
 * `staff.assignPermissions`-governed overrides, and mandatory audit.
 * Those semantics are exactly the sensitive-catalogue semantics, so this
 * module defines the entry in the sensitive entry shape and the sensitive
 * catalogue registers it (`sensitivePermissionCatalogue.ts`) — the
 * definition stays structurally separate while evaluation, override
 * administration, and audit reuse the existing architecture with no
 * redemption-specific bypass.
 *
 * Authority (`DEC-LOY-018` D-2, PRD01 §11 `Process redemptions` matrix row,
 * PRD01 §12.5):
 * - Owner holds confirmation by default via the existing Owner floor
 *   (ordinary membership overrides cannot target Owners, so the floor is
 *   not revocable — unchanged invariant);
 * - Manager holds confirmation by default (`owner_and_manager_default`
 *   inheritance), revocable and re-grantable through the normal governed
 *   override mechanism;
 * - Staff (and any other supported non-Owner role) holds nothing by
 *   default and may receive the capability only by explicit grant where
 *   eligible — the grant confers no role change and no unrelated
 *   permission;
 * - Platform Administrators receive no Business redemption authority by
 *   virtue of that status (`Role` is the closed owner/manager/staff union
 *   and the evaluator has no platform-administrator path);
 * - Customers cannot grant or exercise Business confirmation authority
 *   (no Business membership satisfies the gate).
 *
 * Lifecycle (`DEC-LOY-011`, `DEC-LOY-018` suspension semantics): commercial
 * suspension is default-redeemable, so — following the `ENG-P2-004-CORR-003`
 * per-permission-override precedent (`staff.manage`) — this entry names
 * `["trial", "active", "suspended"]` rather than inheriting the legacy
 * `{trial, active}` set. Programme operational status (retired/paused) is
 * deliberately NOT gated here: PRD06 §5 keeps retired-programme rewards
 * redeemable and `DEC-LOY-013(a)` keeps paused-programme redemption
 * unruled, so inventing a programme-status deny would be new Product
 * Truth, not an implementation of it.
 */

import type { PermissionId } from "./permissionId";
import type { Role } from "./role";
import type { BusinessLifecycleStatus } from "../evaluator/types";
// Type-only edge toward the sensitive catalogue: the sensitive catalogue
// registers this module's entry at load time, so a runtime import back
// would be a module-load cycle. Cross-catalogue id separation is enforced
// by this module's own test instead.
import type { SensitivePermissionCatalogueEntry } from "./sensitivePermissionCatalogue";

export const REDEMPTION_CONFIRM_PERMISSION_ID = "redemption.confirm" as PermissionId;

/**
 * `DEC-LOY-011` commercial-suspension default-allow: redemption confirmation
 * stays eligible while the Business is suspended. Terminal/restricted
 * states (draft, pending_verification, expired, closed, archived) remain
 * ineligible — fail closed.
 */
export const REDEMPTION_CONFIRM_ELIGIBLE_STATUSES: readonly BusinessLifecycleStatus[] = [
  "trial",
  "active",
  "suspended",
];

/**
 * `DEC-LOY-018`/`CORR-001` multi-role grant eligibility: Managers (re-grant
 * after explicit revocation) and Staff/trusted members (explicit governed
 * grant) are both eligible. Order is significant only for display — the
 * evaluator and override constructor treat this as a set.
 */
export const REDEMPTION_CONFIRM_GRANT_ELIGIBLE_ROLES: readonly Role[] = ["manager", "staff"];

export const REDEMPTION_CONFIRM_CATALOGUE_ENTRY: SensitivePermissionCatalogueEntry = {
  id: REDEMPTION_CONFIRM_PERMISSION_ID,
  meaning: "Confirm an available Reward as redeemed for the Business (Capability 6)",
  owningDomain: "Reward domain",
  defaultState: "owner_and_manager_default",
  inheritAllowed: true,
  explicitGrantRequired: true,
  explicitGrantEligibleRoles: REDEMPTION_CONFIRM_GRANT_ELIGIBLE_ROLES,
  explicitRevocationSupported: true,
  auditRequirement: "mandatory",
  rationale: ["c"],
  eligibleBusinessStatuses: REDEMPTION_CONFIRM_ELIGIBLE_STATUSES,
};

// NOTE: no module-load-time cross-catalogue separation check here — this
// module must stay runtime-dependency-free toward the sensitive catalogue
// (which registers the entry below) to avoid a load cycle. Separation is
// enforced by `redemptionPermissionCatalogue.test.ts`, which imports every
// catalogue predicate.

export function isRedemptionPermission(permissionId: string): boolean {
  return permissionId === REDEMPTION_CONFIRM_PERMISSION_ID;
}
