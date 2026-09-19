/**
 * Qualifying Item Permission Catalogue (`PLATFORM-BASELINE-013A.2`,
 * `DEC-LOY-017` / `FD-QUALIFYING-ITEM-ROLE-AUTHORITY-001`).
 *
 * A fifth, structurally separate catalogue — same shape family as
 * `purchasePermissionCatalogue.ts` (a closed array + id-keyed lookup +
 * role-default table), and deliberately its own disjoint table rather than
 * an addition to any existing catalogue, for the same reason the third and
 * fourth catalogues were: the ordinary catalogue is a closed Founder-
 * approved instrument (`FD-CORR-3`), and `rewardProgram.manage` is
 * Owner-only (`PLATFORM-BASELINE-005-FOUNDER-DISPOSITION-001` FD-2) and
 * gates Reward Program creation, editing and publication. Widening it to
 * let Managers manage Qualifying Items would silently hand Managers Reward
 * Program publication authority `DEC-LOY-017` does not grant. A new module
 * answers the Founder's requirement without inventing an authorization
 * algorithm; `evaluatePermission.ts` gains only a fifth classification/
 * authorization branch that is a structural copy of the existing ones.
 *
 * Exactly one entry: `qualifyingItem.manage` — Owner and Manager may
 * create, rename/edit, retire, and optionally classify a Business's
 * Qualifying Items; Staff may not. No `qualifyingItem.view` entry exists:
 * Staff view/select through membership-gated reads, matching this
 * codebase's existing read precedent (Reward Program and Purchase reads),
 * never by being handed the management permission.
 *
 * Platform Administrators receive no authority here by virtue of that
 * status: `Role` is the closed owner/manager/staff union and the evaluator
 * has no platform-administrator path (`DEC-LOY-017` clause 3).
 */

import type { PermissionId } from "./permissionId";
import type { Role } from "./role";
import type { BusinessLifecycleStatus } from "../evaluator/types";
import { isSensitivePermission } from "./sensitivePermissionCatalogue";
import { isOrdinaryPermission } from "./ordinaryPermissionCatalogue";
import { isRewardProgramPermission } from "./rewardProgramPermissionCatalogue";
import { isPurchasePermission } from "./purchasePermissionCatalogue";
import {
  unrecognisedQualifyingItemPermissionError,
  permissionCannotBeInMultipleCataloguesError,
} from "./permissionErrors";

export type QualifyingItemPermissionCatalogueEntry = {
  readonly id: PermissionId;
  readonly roleDefaults: Readonly<Record<Role, boolean>>;
  readonly eligibleBusinessStatuses: readonly BusinessLifecycleStatus[];
};

/** `DEC-LOY-017`: Owner and Manager manage; Staff view/select only (via reads, not this permission). */
const MANAGE_DEFAULT: Readonly<Record<Role, boolean>> = {
  owner: true,
  manager: true,
  staff: false,
};

/** `trial`/`active` — matches the Reward Program and Purchase catalogues. */
const QUALIFYING_ITEM_ELIGIBLE_STATUSES: readonly BusinessLifecycleStatus[] = ["trial", "active"];

export const QUALIFYING_ITEM_PERMISSION_CATALOGUE: readonly QualifyingItemPermissionCatalogueEntry[] =
  [
    {
      id: "qualifyingItem.manage",
      roleDefaults: MANAGE_DEFAULT,
      eligibleBusinessStatuses: QUALIFYING_ITEM_ELIGIBLE_STATUSES,
    },
  ] as const;

export const QUALIFYING_ITEM_PERMISSION_IDS: readonly PermissionId[] =
  QUALIFYING_ITEM_PERMISSION_CATALOGUE.map((entry) => entry.id);

const CATALOGUE_BY_ID: ReadonlyMap<PermissionId, QualifyingItemPermissionCatalogueEntry> = new Map(
  QUALIFYING_ITEM_PERMISSION_CATALOGUE.map((entry) => [entry.id, entry]),
);

// Structural-separation invariant, mirroring the other catalogue modules'
// own module-load-time checks — a future edit that accidentally reused an id
// already claimed by any existing catalogue fails immediately, everywhere.
for (const id of QUALIFYING_ITEM_PERMISSION_IDS) {
  if (
    isSensitivePermission(id) ||
    isOrdinaryPermission(id) ||
    isRewardProgramPermission(id) ||
    isPurchasePermission(id)
  ) {
    throw permissionCannotBeInMultipleCataloguesError(id);
  }
}

export function isQualifyingItemPermission(permissionId: string): boolean {
  return CATALOGUE_BY_ID.has(permissionId);
}

export function getQualifyingItemPermissionEntry(
  permissionId: PermissionId,
): QualifyingItemPermissionCatalogueEntry {
  const entry = CATALOGUE_BY_ID.get(permissionId);
  if (!entry) {
    throw unrecognisedQualifyingItemPermissionError(permissionId);
  }
  return entry;
}
