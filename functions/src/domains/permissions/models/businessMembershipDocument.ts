/**
 * `businessMemberships` collection Firestore document reader (`ENG-P2-004B`).
 *
 * Reads exactly the structural fields `ENG-P2-004-DESIGN-001` §6.9's
 * evaluator needs: `userId`, `businessId`, `role`, `status` (TRD10
 * §10.6.4). Deliberately does **not** attempt to parse `permissions`
 * (`string[]`) or `permissionSetId` into `PermissionOverride` records —
 * `ENG-P2-004A`'s `permissionOverride.ts` already documents that the
 * override persistence/serialization mapping is undesigned and is
 * `ENG-P2-004D`'s repository/infrastructure integration work (design
 * §14), not this package's.
 *
 * A document with **no** persisted override state (`permissions` absent
 * or `[]`) is safely read as `overrides: []`. A document with a
 * **non-empty** `permissions` array is treated as `"malformed"`
 * (`null`), not silently discarded as `overrides: []` — this codebase
 * has no governed serialization for that field yet, so a non-empty value
 * could encode a revocation or grant this reader cannot recover; failing
 * closed (§6.11, AD-4) is the only sound outcome until 004D resolves the
 * serialization question, rather than risking a role-default permission
 * being allowed when the stored state actually revokes it (fixed after a
 * Codex review finding on PR #107).
 */

import { isRole } from "./role";
import type { EvaluationBusinessMembership } from "../evaluator/types";

const MEMBERSHIP_STATUSES = ["invited", "active", "suspended", "removed"] as const;

function isMembershipStatus(value: unknown): value is EvaluationBusinessMembership["status"] {
  return typeof value === "string" && (MEMBERSHIP_STATUSES as readonly string[]).includes(value);
}

/**
 * Returns `null` (never throws) for a structurally invalid document — the
 * caller (the repository) maps that to a `"malformed"` read result, which
 * the evaluator's fail-closed gate (§6.11, AD-4) denies.
 */
export function fromBusinessMembershipDocument(
  id: string,
  raw: unknown,
): EvaluationBusinessMembership | null {
  const data = raw as Partial<{
    userId: unknown;
    businessId: unknown;
    role: unknown;
    status: unknown;
    permissions: unknown;
  }>;

  if (typeof data.userId !== "string" || data.userId.length === 0) return null;
  if (typeof data.businessId !== "string" || data.businessId.length === 0) return null;
  if (typeof data.role !== "string" || !isRole(data.role)) return null;
  if (!isMembershipStatus(data.status)) return null;
  if (
    data.permissions !== undefined &&
    !(Array.isArray(data.permissions) && data.permissions.length === 0)
  ) {
    return null;
  }

  return {
    id,
    userId: data.userId,
    businessId: data.businessId,
    role: data.role,
    status: data.status,
    overrides: [],
  };
}
