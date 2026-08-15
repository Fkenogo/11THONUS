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
 * §14), not this package's. Returning `overrides: []` here is an honest,
 * explicit scope boundary, not a silent behavioral gap: the evaluator's
 * override-precedence logic (§4.1.3/§4.1.5, §6.9 steps 6-7) is fully
 * proven against directly-constructed fixtures in
 * `evaluator/evaluatePermission.test.ts`; only the real Firestore
 * round-trip of override *persistence* awaits a governed schema decision
 * this package does not invent.
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
  }>;

  if (typeof data.userId !== "string" || data.userId.length === 0) return null;
  if (typeof data.businessId !== "string" || data.businessId.length === 0) return null;
  if (typeof data.role !== "string" || !isRole(data.role)) return null;
  if (!isMembershipStatus(data.status)) return null;

  return {
    id,
    userId: data.userId,
    businessId: data.businessId,
    role: data.role,
    status: data.status,
    overrides: [],
  };
}
