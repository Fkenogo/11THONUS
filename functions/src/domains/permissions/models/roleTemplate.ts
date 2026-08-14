/**
 * Role/default-template contract (`ENG-P2-004A`).
 *
 * `ENG-P2-004-DESIGN-001` §6.6: "A static, versioned role-default table
 * (Owner/Manager/Staff → default permission set) — content matches PRD1
 * §7–§8's existing default/restriction lists; this package does not
 * redefine those defaults, only names where they live as an evaluator
 * input." This module is that naming: the `RoleTemplate` contract and its
 * validation invariants. It does not attempt to reproduce PRD1 §7–§8's
 * full non-sensitive baseline permission lists in identifier form — no
 * governed document mints permission identifiers for that non-sensitive
 * baseline (see `permissionId.ts`), so inventing one here would not be a
 * transcription of approved content, it would be new content.
 *
 * What *is* precisely specified by the approved design is the Sensitive
 * Permission Catalogue's own "Inherit?"/"Default state" columns (§3.2,
 * `sensitivePermissionCatalogue.ts`): exactly two entries
 * (`customer.viewProtectedProfile`, `report.exportFinancial`) are
 * inheritable, and both default to Owner+Manager. `DEFAULT_ROLE_TEMPLATES`
 * below is derived entirely from that single source of truth — not
 * duplicated/hand-maintained data — so it can never drift from the
 * catalogue.
 *
 * Structural invariant (`DEC-ID-003`, `ENG-P2-004-DESIGN-001` §3.3):
 * a role template's default permissions may **never** include a sensitive
 * permission that the catalogue marks non-inheritable, for *any* role,
 * including Owner — Owner's access to those permissions comes from the
 * runtime "owner floor" evaluation rule (`ENG-P2-004B`, design §3.6,
 * §6.9 step 5), never from template inheritance. This module enforces
 * that invariant at construction time; it does not evaluate anything.
 */

import type { PermissionId } from "./permissionId";
import { isWellFormedPermissionId } from "./permissionId";
import { type Role, createRole } from "./role";
import {
  isSensitivePermission,
  getSensitivePermissionEntry,
  getInheritableSensitivePermissionEntries,
} from "./sensitivePermissionCatalogue";
import {
  invalidPermissionIdError,
  sensitivePermissionCannotBeImplicitInRoleTemplateError,
  duplicatePermissionInRoleTemplateError,
} from "./permissionErrors";

export type RoleTemplate = {
  readonly role: Role;
  readonly defaultPermissions: readonly PermissionId[];
};

export function createRoleTemplate(
  role: string,
  defaultPermissions: readonly string[],
): RoleTemplate {
  const validatedRole = createRole(role);
  const seen = new Set<PermissionId>();

  for (const permissionId of defaultPermissions) {
    if (!isWellFormedPermissionId(permissionId)) {
      throw invalidPermissionIdError(permissionId);
    }
    if (seen.has(permissionId)) {
      throw duplicatePermissionInRoleTemplateError(validatedRole, permissionId);
    }
    seen.add(permissionId);

    if (isSensitivePermission(permissionId)) {
      const entry = getSensitivePermissionEntry(permissionId);
      if (!entry.inheritAllowed) {
        throw sensitivePermissionCannotBeImplicitInRoleTemplateError(validatedRole, permissionId);
      }
    }
  }

  return { role: validatedRole, defaultPermissions: [...defaultPermissions] };
}

export function isPermissionInRoleTemplateDefault(
  template: RoleTemplate,
  permissionId: PermissionId,
): boolean {
  return template.defaultPermissions.includes(permissionId);
}

/**
 * Every catalogue-inheritable sensitive permission (§3.2 rows 7–8),
 * derived at module-load time from `sensitivePermissionCatalogue.ts` —
 * never hand-duplicated.
 */
const CATALOGUE_INHERITABLE_IDS: readonly PermissionId[] =
  getInheritableSensitivePermissionEntries().map((entry) => entry.id);

/**
 * The only role-default content this design precisely specifies:
 * Owner and Manager both default to the catalogue's inheritable entries;
 * Staff defaults to none of them (design §3.2 rows 7–8, "No (role-default),
 * Yes for Staff" under "Explicit grant required?"). This does **not**
 * claim to be Owner/Manager/Staff's *complete* default permission set —
 * the non-sensitive baseline remains outside this catalogue's and this
 * module's scope (see this file's header comment).
 */
export const DEFAULT_ROLE_TEMPLATES: Readonly<Record<Role, RoleTemplate>> = {
  owner: createRoleTemplate("owner", CATALOGUE_INHERITABLE_IDS),
  manager: createRoleTemplate("manager", CATALOGUE_INHERITABLE_IDS),
  staff: createRoleTemplate("staff", []),
};
