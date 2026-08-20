/**
 * Role-change PermissionOverride reconciliation (`ENG-P2-003C-CORR-001`).
 *
 * Founder policy: "fresh elevated authority requires fresh authorization."
 * A `PermissionOverride` that becomes structurally invalid for a
 * membership's role must not remain in `permissions[]` to potentially
 * become effective again on a later role change back — `permissions[]` is
 * CURRENT configuration (FD-003D-1, `ENG-P2-003-DESIGN-001` §29), not a
 * history log.
 *
 * This module owns exactly one decision: for a given stored override and a
 * NEW role, is that override still structurally valid? It answers that by
 * re-running the override through `createPermissionOverride` — `ENG-P2-004A`'s
 * own authoritative validity constructor — with `targetRole` set to the new
 * role, and treating a thrown error as "no longer valid, remove." No new
 * validity rule is invented here; `permissionOverride.ts` is imported
 * unmodified.
 *
 * A grant is role-scoped (`explicitGrantEligibleRole` names exactly one
 * role), so a grant valid for the old role is always invalid for the other
 * of {"manager", "staff"} and vice versa. A revoke has no role dependency
 * in the existing contract (only `explicitRevocationSupported`, a static
 * catalogue flag) — so a revoke, once valid, remains valid across every
 * role a membership could hold. This module does not special-case that
 * distinction; it falls out of reusing `createPermissionOverride` as-is.
 */

import { createPermissionOverride } from "./permissionOverride";
import type { Role } from "./role";
import type { RawPermissionOverrideRecord } from "./businessMembershipDocument";

export type RoleChangeOverrideReconciliationResult = {
  readonly retained: readonly RawPermissionOverrideRecord[];
  readonly removed: readonly RawPermissionOverrideRecord[];
};

export function reconcilePermissionOverridesForRoleChange(
  overrides: readonly RawPermissionOverrideRecord[],
  context: { businessId: string; membershipId: string; newRole: Role },
): RoleChangeOverrideReconciliationResult {
  const retained: RawPermissionOverrideRecord[] = [];
  const removed: RawPermissionOverrideRecord[] = [];

  for (const override of overrides) {
    try {
      createPermissionOverride({
        permissionId: override.permissionId,
        direction: override.direction,
        businessId: context.businessId,
        membershipId: context.membershipId,
        grantedBy: override.grantedBy,
        grantedAt: override.grantedAt,
        targetRole: context.newRole,
      });
      retained.push(override);
    } catch {
      // Any construction-time rejection (role-ineligible grant, direction
      // not supported, etc.) means this override is no longer structurally
      // valid for the new role — remove it from current configuration.
      removed.push(override);
    }
  }

  return { retained, removed };
}
