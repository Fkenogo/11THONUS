/**
 * Permission identifier (`ENG-P2-004A`).
 *
 * A validated permission identifier — `"domain.action"`, dot-namespaced,
 * matching the form every catalogue entry in `sensitivePermissionCatalogue.ts`
 * already uses (e.g. `"staff.manage"`, `"transaction.reverse"`).
 *
 * This is deliberately **not** a closed enum of every permission the
 * platform will ever have. `ENG-P2-004-DESIGN-001` §3.2 enumerates the
 * eight *sensitive* permissions exactly (see `sensitivePermissionCatalogue.ts`
 * for that closed set) but explicitly leaves the non-sensitive baseline
 * permission space ungoverned at the identifier level — "non-sensitive
 * baseline permissions ... remain governed by TRD12 §12.11's ordinary
 * resolution path and PRD1 §7–§8's role-default lists, unchanged by this
 * package." Minting a closed universal enum here would invent identifiers
 * no governed document defines. `PermissionId` therefore validates only
 * the *shape* every permission id must have; `isSensitivePermission`
 * (`sensitivePermissionCatalogue.ts`) is the closed-membership check for
 * the subset this design package does govern precisely.
 */

import { invalidPermissionIdError } from "./permissionErrors";

const PERMISSION_ID_PATTERN = /^[a-z][a-zA-Z0-9]*\.[a-z][a-zA-Z0-9]*$/;

export type PermissionId = string;

export function createPermissionId(value: string): PermissionId {
  if (PERMISSION_ID_PATTERN.test(value)) {
    return value;
  }
  throw invalidPermissionIdError(value);
}

export function isWellFormedPermissionId(value: string): boolean {
  return PERMISSION_ID_PATTERN.test(value);
}
