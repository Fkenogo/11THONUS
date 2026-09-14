/**
 * Purchase Permission Catalogue (`PLATFORM-BASELINE-006A`).
 *
 * A fourth, structurally separate catalogue — same shape family as
 * `rewardProgramPermissionCatalogue.ts` (a closed array + id-keyed lookup +
 * role-default table), but deliberately its own disjoint table rather than
 * an addition to any existing catalogue: the ordinary catalogue is a
 * closed set the Founder previously approved to hold exactly its four
 * `ENG-P2-004-CORR-001` entries (`FD-CORR-3`), and the reward-program
 * catalogue holds exactly its single `PLATFORM-BASELINE-005` entry —
 * appending to either would reopen that specific closed instrument for an
 * unrelated purpose. A new module avoids that without inventing any new
 * authorization algorithm; `evaluatePermission.ts` gains only a fourth
 * classification/authorization branch that is a structural copy of the
 * existing ordinary/reward-program branches' own logic.
 *
 * Exactly one entry: `purchase.record`, Staff/Manager/Owner in this package
 * (product-governed by PRD5 §8, which authorizes Staff, Manager, and
 * Business Owner — unlike the Owner-only `rewardProgram.manage`).
 * No `purchase.view` entry exists — reads are membership/ownership-gated
 * only, matching this codebase's actual existing read precedent
 * (`getBusinessContext`, `listStaffMemberships`, 005A reward reads), not a
 * new catalogue-gated policy.
 */

import type { PermissionId } from "./permissionId";
import type { Role } from "./role";
import type { BusinessLifecycleStatus } from "../evaluator/types";
import { isSensitivePermission } from "./sensitivePermissionCatalogue";
import { isOrdinaryPermission } from "./ordinaryPermissionCatalogue";
import { isRewardProgramPermission } from "./rewardProgramPermissionCatalogue";
import {
  unrecognisedPurchasePermissionError,
  permissionCannotBeInMultipleCataloguesError,
} from "./permissionErrors";

export type PurchasePermissionCatalogueEntry = {
  readonly id: PermissionId;
  readonly roleDefaults: Readonly<Record<Role, boolean>>;
  readonly eligibleBusinessStatuses: readonly BusinessLifecycleStatus[];
};

/** PRD5 §8 authorizes Staff, Manager, and Business Owner to record purchases. */
const RECORD_DEFAULT: Readonly<Record<Role, boolean>> = {
  owner: true,
  manager: true,
  staff: true,
};

/** `trial`/`active` — the approved first-cut Business eligibility (design §11). */
const PURCHASE_ELIGIBLE_STATUSES: readonly BusinessLifecycleStatus[] = ["trial", "active"];

export const PURCHASE_PERMISSION_CATALOGUE: readonly PurchasePermissionCatalogueEntry[] = [
  {
    id: "purchase.record",
    roleDefaults: RECORD_DEFAULT,
    eligibleBusinessStatuses: PURCHASE_ELIGIBLE_STATUSES,
  },
] as const;

export const PURCHASE_PERMISSION_IDS: readonly PermissionId[] = PURCHASE_PERMISSION_CATALOGUE.map(
  (entry) => entry.id,
);

const CATALOGUE_BY_ID: ReadonlyMap<PermissionId, PurchasePermissionCatalogueEntry> = new Map(
  PURCHASE_PERMISSION_CATALOGUE.map((entry) => [entry.id, entry]),
);

// Structural-separation invariant, mirroring the other catalogue modules'
// own module-load-time checks — a future edit that accidentally reused an id
// already claimed by any existing catalogue fails immediately, everywhere.
for (const id of PURCHASE_PERMISSION_IDS) {
  if (isSensitivePermission(id) || isOrdinaryPermission(id) || isRewardProgramPermission(id)) {
    throw permissionCannotBeInMultipleCataloguesError(id);
  }
}

export function isPurchasePermission(permissionId: string): boolean {
  return CATALOGUE_BY_ID.has(permissionId);
}

export function getPurchasePermissionEntry(
  permissionId: PermissionId,
): PurchasePermissionCatalogueEntry {
  const entry = CATALOGUE_BY_ID.get(permissionId);
  if (!entry) {
    throw unrecognisedPurchasePermissionError(permissionId);
  }
  return entry;
}
