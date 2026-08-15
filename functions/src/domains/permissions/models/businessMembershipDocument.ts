/**
 * `businessMemberships` collection Firestore document reader (`ENG-P2-004B`,
 * override parsing extended by `ENG-P2-004D`).
 *
 * Reads the structural fields `ENG-P2-004-DESIGN-001` §6.9's evaluator
 * needs: `userId`, `businessId`, `role`, `status` (TRD10 §10.6.4), plus
 * `permissions` — the persisted `PermissionOverride` array.
 *
 * **`ENG-P2-004D` persistence correction (Founder-approved Option C,
 * see the `businessMembershipDocument.test.ts` header):** the
 * previously-undesigned `permissions` encoding is now resolved as TRD10
 * §10.6.4 defines it — a Firestore array of structured override maps,
 * `Array<{permissionId, direction, grantedBy, grantedAt}>`. `businessId`
 * and `membershipId` are never persisted per-element (an override is
 * never global, design §5) — they're filled in here from this
 * document's own `businessId`/`id`, matching
 * `EvaluationPermissionOverride`'s shape (`evaluator/types.ts`), which
 * does not carry `grantedBy`/`grantedAt` — those two fields are
 * validated for well-formedness only, not propagated, since the
 * evaluator's precedence logic (§4) never needs them.
 *
 * A document with **no** persisted override state (`permissions` absent
 * or `[]`, and no `permissionSetId`) is safely read as `overrides: []`.
 * Every element of a non-empty `permissions` array must independently
 * satisfy the shape above; **any single malformed element fails the
 * whole document closed** (`null`) — no partial acceptance — since a
 * malformed element could be concealing a revocation this reader cannot
 * recover (§6.11, AD-4). A **non-blank** `permissionSetId` is still
 * treated as `"malformed"` — that field's serialization remains
 * undesigned and out of this correction's scope (fixed after Codex
 * review findings, PR #107 — the `permissions` case in review pass 1,
 * the `permissionSetId` case in review pass 4).
 *
 * Framework-independent by machine-enforced rule
 * (`eslint.config.js`, `permissions/models/**`) — no `firebase-admin`
 * import, so a Firestore `Timestamp` is recognized structurally (duck
 * typing on `.toDate()`) rather than by importing its type.
 */

import { isRole } from "./role";
import { isWellFormedPermissionId } from "./permissionId";
import {
  PERMISSION_OVERRIDE_DIRECTIONS,
  type PermissionOverrideDirection,
} from "./permissionOverride";
import type {
  EvaluationBusinessMembership,
  EvaluationPermissionOverride,
} from "../evaluator/types";

const MEMBERSHIP_STATUSES = ["invited", "active", "suspended", "removed"] as const;

function isMembershipStatus(value: unknown): value is EvaluationBusinessMembership["status"] {
  return typeof value === "string" && (MEMBERSHIP_STATUSES as readonly string[]).includes(value);
}

function isOverrideDirection(value: unknown): value is PermissionOverrideDirection {
  return (
    typeof value === "string" &&
    (PERMISSION_OVERRIDE_DIRECTIONS as readonly string[]).includes(value)
  );
}

function isTimestampLike(value: unknown): value is { toDate: () => Date } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  );
}

/**
 * Parses one raw `permissions[]` element. Returns `null` (fail-closed) for
 * anything that isn't exactly `{permissionId, direction, grantedBy,
 * grantedAt}` — including the pre-004D-correction bare permission-id
 * string shape, which must not be silently accepted or discarded.
 */
function parseOverrideElement(
  raw: unknown,
  businessId: string,
  membershipId: string,
): EvaluationPermissionOverride | null {
  if (typeof raw !== "object" || raw === null) return null;
  const element = raw as Partial<{
    permissionId: unknown;
    direction: unknown;
    grantedBy: unknown;
    grantedAt: unknown;
  }>;

  if (typeof element.permissionId !== "string" || !isWellFormedPermissionId(element.permissionId)) {
    return null;
  }
  if (!isOverrideDirection(element.direction)) return null;
  if (typeof element.grantedBy !== "string" || element.grantedBy.trim().length === 0) return null;
  if (!isTimestampLike(element.grantedAt)) return null;

  return {
    permissionId: element.permissionId,
    direction: element.direction,
    businessId,
    membershipId,
  };
}

function parseOverrides(
  raw: unknown,
  businessId: string,
  membershipId: string,
): readonly EvaluationPermissionOverride[] | null {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) return null;
  if (raw.length === 0) return [];

  const overrides: EvaluationPermissionOverride[] = [];
  for (const element of raw) {
    const parsed = parseOverrideElement(element, businessId, membershipId);
    if (!parsed) return null;
    overrides.push(parsed);
  }
  return overrides;
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
    permissionSetId: unknown;
  }>;

  if (typeof data.userId !== "string" || data.userId.length === 0) return null;
  if (typeof data.businessId !== "string" || data.businessId.length === 0) return null;
  if (typeof data.role !== "string" || !isRole(data.role)) return null;
  if (!isMembershipStatus(data.status)) return null;
  if (
    data.permissionSetId !== undefined &&
    !(typeof data.permissionSetId === "string" && data.permissionSetId.trim().length === 0)
  ) {
    return null;
  }

  const overrides = parseOverrides(data.permissions, data.businessId, id);
  if (overrides === null) return null;

  return {
    id,
    userId: data.userId,
    businessId: data.businessId,
    role: data.role,
    status: data.status,
    overrides,
  };
}
