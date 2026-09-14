/**
 * Reward Program Permission Catalogue (`PLATFORM-BASELINE-005A`).
 *
 * A third, structurally separate catalogue — same shape family as
 * `ordinaryPermissionCatalogue.ts` (a closed array + id-keyed lookup +
 * role-default table), but deliberately its own disjoint table rather
 * than an addition to either existing catalogue, per the approved design
 * (`PLATFORM-BASELINE-005` §14/`CORR-001.6`): the ordinary catalogue is a
 * closed set the Founder previously approved to hold exactly its four
 * `ENG-P2-004-CORR-001` entries (`FD-CORR-3`) — appending to it would
 * reopen that specific closed instrument for an unrelated purpose. A new
 * module avoids that without inventing any new authorization algorithm;
 * `evaluatePermission.ts` gains only a third classification/authorization
 * branch that is a structural copy of the existing ordinary-permission
 * branch's own logic (see that file's `classifyPermission`/Step 5a-reward
 * additions).
 *
 * Exactly one entry: `rewardProgram.manage`, Owner-only in this first
 * package (`PLATFORM-BASELINE-005-FOUNDER-DISPOSITION-001` FD-2; no
 * Manager/Staff path — see the design report `CORR-001.5`/`.6` for why no
 * existing authority answers the Manager question, so none is invented).
 * No `rewardProgram.view` entry exists — reads are membership-gated only,
 * matching this codebase's actual existing read precedent
 * (`getBusinessContext`, `listStaffMemberships`, etc.), not a new
 * catalogue-gated policy (`CORR-001.6`).
 */

import type { PermissionId } from "./permissionId";
import type { Role } from "./role";
import type { BusinessLifecycleStatus } from "../evaluator/types";
import { isSensitivePermission } from "./sensitivePermissionCatalogue";
import { isOrdinaryPermission } from "./ordinaryPermissionCatalogue";
import {
  unrecognisedRewardProgramPermissionError,
  permissionCannotBeInMultipleCataloguesError,
} from "./permissionErrors";

export type RewardProgramPermissionCatalogueEntry = {
  readonly id: PermissionId;
  readonly roleDefaults: Readonly<Record<Role, boolean>>;
  readonly eligibleBusinessStatuses: readonly BusinessLifecycleStatus[];
};

/** Owner-only in this first package — no Manager override path exists yet. */
const OWNER_ONLY_DEFAULT: Readonly<Record<Role, boolean>> = {
  owner: true,
  manager: false,
  staff: false,
};

/** `trial`/`active` — the approved first-cut Business eligibility (`PLATFORM-BASELINE-005` §13). */
const REWARD_PROGRAM_ELIGIBLE_STATUSES: readonly BusinessLifecycleStatus[] = ["trial", "active"];

export const REWARD_PROGRAM_PERMISSION_CATALOGUE: readonly RewardProgramPermissionCatalogueEntry[] =
  [
    {
      id: "rewardProgram.manage",
      roleDefaults: OWNER_ONLY_DEFAULT,
      eligibleBusinessStatuses: REWARD_PROGRAM_ELIGIBLE_STATUSES,
    },
  ] as const;

export const REWARD_PROGRAM_PERMISSION_IDS: readonly PermissionId[] =
  REWARD_PROGRAM_PERMISSION_CATALOGUE.map((entry) => entry.id);

const CATALOGUE_BY_ID: ReadonlyMap<PermissionId, RewardProgramPermissionCatalogueEntry> = new Map(
  REWARD_PROGRAM_PERMISSION_CATALOGUE.map((entry) => [entry.id, entry]),
);

// Structural-separation invariant, mirroring `ordinaryPermissionCatalogue.ts`'s
// own module-load-time check — a future edit that accidentally reused an id
// already claimed by either existing catalogue fails immediately, everywhere.
for (const id of REWARD_PROGRAM_PERMISSION_IDS) {
  if (isSensitivePermission(id) || isOrdinaryPermission(id)) {
    throw permissionCannotBeInMultipleCataloguesError(id);
  }
}

export function isRewardProgramPermission(permissionId: string): boolean {
  return CATALOGUE_BY_ID.has(permissionId);
}

export function getRewardProgramPermissionEntry(
  permissionId: PermissionId,
): RewardProgramPermissionCatalogueEntry {
  const entry = CATALOGUE_BY_ID.get(permissionId);
  if (!entry) {
    throw unrecognisedRewardProgramPermissionError(permissionId);
  }
  return entry;
}
