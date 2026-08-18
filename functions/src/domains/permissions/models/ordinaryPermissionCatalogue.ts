/**
 * Ordinary (non-sensitive) Permission Catalogue (`ENG-P2-004-CORR-001`).
 *
 * The closed, governed set of four "ordinary" business-administration
 * permissions the Founder authorized in the CORR-001 disposition
 * (FD-CORR-1 through FD-CORR-7) to unblock `ENG-P2-002C`. This module is
 * the direct counterpart to `sensitivePermissionCatalogue.ts` for that
 * disposition — same shape family (a closed array + id-keyed lookup), but
 * a deliberately **separate, disjoint** table (FD-CORR-2: "Keep ordinary
 * permissions structurally separate from SENSITIVE_PERMISSION_CATALOGUE").
 * Nothing here is added to, or read by, the sensitive catalogue, and vice
 * versa — `evaluatePermission.ts` is the only place the two are ever
 * consulted together, and only to classify which one (if either) governs
 * a given request.
 *
 * This catalogue is intentionally **not** a general non-sensitive
 * baseline-permission table. `permissionId.ts` still leaves the wider
 * non-sensitive permission space (e.g. `purchase.record`) ungoverned —
 * that gap is unchanged by this correction (FD-CORR-2: "Do not globally
 * widen Business-status eligibility"). Only the four ids FD-CORR-3
 * approved exist here; every other permission id, sensitive or not,
 * remains exactly as governed (or ungoverned) as it was before this file
 * existed.
 */

import type { PermissionId } from "./permissionId";
import type { Role } from "./role";
import type { BusinessLifecycleStatus } from "../evaluator/types";
import { isSensitivePermission } from "./sensitivePermissionCatalogue";
import {
  unrecognisedOrdinaryPermissionError,
  permissionCannotBeBothSensitiveAndOrdinaryError,
} from "./permissionErrors";

export type OrdinaryPermissionCatalogueEntry = {
  readonly id: PermissionId;
  /** FD-CORR-4: Owner=allow, Manager=deny, Staff=deny for all four entries — specific to this table, not a platform-wide role rule. */
  readonly roleDefaults: Readonly<Record<Role, boolean>>;
  /** FD-CORR-5/7: the exact approved per-permission Business lifecycle-eligibility set. */
  readonly eligibleBusinessStatuses: readonly BusinessLifecycleStatus[];
};

const OWNER_ONLY_DEFAULT: Readonly<Record<Role, boolean>> = {
  owner: true,
  manager: false,
  staff: false,
};

/** FD-CORR-5/7: profile/branch-profile editing — draft, pending_verification, trial, active, expired. Not suspended (administrator-imposed restriction), not closed/archived (terminal). */
const PROFILE_EDIT_ELIGIBLE_STATUSES: readonly BusinessLifecycleStatus[] = [
  "draft",
  "pending_verification",
  "trial",
  "active",
  "expired",
];

/** FD-CORR-5/7: any non-terminal status may close — mirrors `businessStatus.ts`'s structural "any → closed" row exactly. */
const CLOSE_ELIGIBLE_STATUSES: readonly BusinessLifecycleStatus[] = [
  "draft",
  "pending_verification",
  "trial",
  "active",
  "suspended",
  "expired",
];

/**
 * The four catalogue entries, in FD-CORR-3's own approved order. Closed
 * set — no additional entry may be added without a further Founder
 * disposition (FD-CORR-2/3).
 */
export const ORDINARY_PERMISSION_CATALOGUE: readonly OrdinaryPermissionCatalogueEntry[] = [
  {
    id: "business.updateProfile",
    roleDefaults: OWNER_ONLY_DEFAULT,
    eligibleBusinessStatuses: PROFILE_EDIT_ELIGIBLE_STATUSES,
  },
  {
    id: "businessBranch.updateProfile",
    roleDefaults: OWNER_ONLY_DEFAULT,
    eligibleBusinessStatuses: PROFILE_EDIT_ELIGIBLE_STATUSES,
  },
  {
    id: "business.submitForVerification",
    roleDefaults: OWNER_ONLY_DEFAULT,
    // FD-CORR-3: authorizes only the narrow draft → pending_verification
    // submission action — eligible in `draft` alone, never any other
    // status. This is what keeps the permission from ever being read as
    // generic lifecycle authority.
    eligibleBusinessStatuses: ["draft"],
  },
  {
    id: "business.close",
    roleDefaults: OWNER_ONLY_DEFAULT,
    eligibleBusinessStatuses: CLOSE_ELIGIBLE_STATUSES,
  },
] as const;

export const ORDINARY_PERMISSION_IDS: readonly PermissionId[] = ORDINARY_PERMISSION_CATALOGUE.map(
  (entry) => entry.id,
);

const CATALOGUE_BY_ID: ReadonlyMap<PermissionId, OrdinaryPermissionCatalogueEntry> = new Map(
  ORDINARY_PERMISSION_CATALOGUE.map((entry) => [entry.id, entry]),
);

// Structural-separation invariant (FD-CORR-2), enforced at module load
// rather than merely documented — a future edit to either catalogue that
// accidentally reused an id would fail immediately, everywhere, rather
// than silently creating an ambiguous permission the evaluator would have
// to arbitrate between.
for (const id of ORDINARY_PERMISSION_IDS) {
  if (isSensitivePermission(id)) {
    throw permissionCannotBeBothSensitiveAndOrdinaryError(id);
  }
}

export function isOrdinaryPermission(permissionId: string): boolean {
  return CATALOGUE_BY_ID.has(permissionId);
}

export function getOrdinaryPermissionEntry(
  permissionId: PermissionId,
): OrdinaryPermissionCatalogueEntry {
  const entry = CATALOGUE_BY_ID.get(permissionId);
  if (!entry) {
    throw unrecognisedOrdinaryPermissionError(permissionId);
  }
  return entry;
}
