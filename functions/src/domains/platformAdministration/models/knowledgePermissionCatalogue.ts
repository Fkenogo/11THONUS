/**
 * Knowledge Studio permission catalogue — role-default grants
 * (`ENG-P3-003A`).
 *
 * `FD-KS-1`/`DEC-GOV-011` MVP grants (`ENG-P3-003-DESIGN-001` §6.2, with
 * `platform_super_administrator`'s column removed — that role is not
 * approved, see `platformAdministratorRole.ts`):
 *
 * | Permission              | knowledge_editor | knowledge_approver |
 * |--------------------------|:---:|:---:|
 * | knowledge.view           |  ✓  |  ✓  |
 * | knowledge.create_draft    |  ✓  |  —  |
 * | knowledge.edit_draft      |  ✓  |  —  |
 * | knowledge.approve         |  —  |  ✓  |
 * | knowledge.publish         |  —  |  ✓  |
 * | knowledge.retire          |  —  |  ✓  |
 * | knowledge.bulk_import     |  —  |  —  |
 *
 * `knowledge.bulk_import` is granted to neither MVP role — TRD18 §18.5.1
 * scoped it to Platform Super Administrator only, which is not activated
 * (`FD-KS-1`); it stays ungranted, not reassigned to either Knowledge role,
 * and remains deferred per `ENG-P3-003-DESIGN-001` §17 (`ENG-P3-003G`).
 *
 * This is a closed, structural mapping — not a per-administrator override
 * table. `FD-KS-1` approved no per-permission override/grant mechanism for
 * Knowledge Studio MVP, unlike the Business permission model's
 * `PermissionOverride`; adding one is out of this package's scope.
 */

import type { PlatformAdministratorRole } from "./platformAdministratorRole";
import type { KnowledgePermissionId } from "./knowledgePermissionId";
import { KNOWLEDGE_PERMISSION_IDS } from "./knowledgePermissionId";
import { PLATFORM_ADMINISTRATOR_ROLES } from "./platformAdministratorRole";

const ROLE_PERMISSION_DEFAULTS: Readonly<
  Record<PlatformAdministratorRole, ReadonlySet<KnowledgePermissionId>>
> = {
  knowledge_editor: new Set(["knowledge.view", "knowledge.create_draft", "knowledge.edit_draft"]),
  knowledge_approver: new Set([
    "knowledge.view",
    "knowledge.approve",
    "knowledge.publish",
    "knowledge.retire",
  ]),
};

/** Structural completeness check, enforced at module load (mirrors `ordinaryPermissionCatalogue.ts`'s own load-time invariant style). */
for (const role of PLATFORM_ADMINISTRATOR_ROLES) {
  if (!(role in ROLE_PERMISSION_DEFAULTS)) {
    throw new Error(
      `Knowledge permission catalogue is missing a role-default entry for "${role}".`,
    );
  }
}

/**
 * Whether `role` grants `permission` by its MVP default. Pure, no
 * per-administrator override lookup — `FD-KS-1` approved none for MVP.
 */
export function roleGrantsKnowledgePermission(
  role: PlatformAdministratorRole,
  permission: KnowledgePermissionId,
): boolean {
  return ROLE_PERMISSION_DEFAULTS[role].has(permission);
}

/** Every permission at least one MVP role grants — `knowledge.bulk_import` is deliberately absent. */
export const GRANTABLE_KNOWLEDGE_PERMISSIONS: readonly KnowledgePermissionId[] =
  KNOWLEDGE_PERMISSION_IDS.filter((permission) =>
    PLATFORM_ADMINISTRATOR_ROLES.some((role) => roleGrantsKnowledgePermission(role, permission)),
  );
