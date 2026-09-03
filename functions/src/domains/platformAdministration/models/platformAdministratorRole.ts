/**
 * Platform-administrator role vocabulary (`ENG-P3-003A`).
 *
 * TRD18 §18.5 defines eleven platform-administrator roles. `FD-KS-1`
 * (`DEC-GOV-011`, Founder disposition, 2026-09-03) approves activating
 * **only two** of them, for Knowledge Studio MVP: `knowledge_editor`
 * (TRD18 §18.5.5) and `knowledge_approver` (TRD18 §18.5.6).
 *
 * `platform_super_administrator` (TRD18 §18.5.1) is deliberately **not**
 * included — `ENG-P3-003-DESIGN-001` v1.0 had proposed it as an implicit
 * holder of every `knowledge.*` permission, but `FD-KS-1`'s exact wording
 * ("enable only: `knowledge_editor`, `knowledge_approver`. Do not activate
 * the remainder of TRD18's administrator-role catalogue") does not name it
 * as approved — it is one of "the remainder," deferred like every other
 * TRD18 role, until its own administrative capability is separately
 * authorized. This is a closed, exhaustive set: a third value must never be
 * added without its own Founder disposition narrowing `DEC-GOV-007`
 * further, exactly as `DEC-GOV-011` did for these two.
 */

import { invalidPlatformAdministratorRoleError } from "./platformAdministrationErrors";

export const PLATFORM_ADMINISTRATOR_ROLES = ["knowledge_editor", "knowledge_approver"] as const;

export type PlatformAdministratorRole = (typeof PLATFORM_ADMINISTRATOR_ROLES)[number];

export function isPlatformAdministratorRole(value: string): value is PlatformAdministratorRole {
  return (PLATFORM_ADMINISTRATOR_ROLES as readonly string[]).includes(value);
}

export function createPlatformAdministratorRole(value: string): PlatformAdministratorRole {
  if (isPlatformAdministratorRole(value)) {
    return value;
  }
  throw invalidPlatformAdministratorRoleError(value);
}
