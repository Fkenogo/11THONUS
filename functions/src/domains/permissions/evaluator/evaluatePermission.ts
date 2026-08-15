/**
 * Permission evaluator — pure decision function (`ENG-P2-004B`).
 *
 * Implements `ENG-P2-004-DESIGN-001` §6.9's evaluation algorithm exactly,
 * in the approved order, short-circuiting on first deny. Pure: it never
 * touches Firestore (machine-enforced — this whole directory is scoped by
 * the repo-root `eslint.config.js` `no-restricted-imports` rule to forbid
 * any Firebase SDK import, `evaluator/**`/`repositories/**` and
 * `service/**` excepted), never mutates its input, and is a function of
 * its input alone (design §6.18 purity, §13 item 1 determinism). The
 * Firestore-touching orchestrator that performs the two authoritative
 * reads and calls this function lives in
 * `../service/evaluatePermissionService.ts`, kept out of this file
 * specifically so this decision logic stays under the same
 * framework-independence guarantee `models/` already has.
 *
 * Reconciliation note (see PR description / implementation report for full
 * detail): design §4.1 item 6 states role/template defaults satisfy
 * "non-sensitive permissions only," while design §3.2 rows 7-8
 * (`customer.viewProtectedProfile`, `report.exportFinancial`) are marked
 * `inheritAllowed: true` with "Explicit grant required? No (role-default)"
 * for Owner/Manager specifically, and `ENG-P2-004A`'s already-merged
 * `SENSITIVE_PERMISSION_ROLE_TEMPLATES` (roleTemplate.ts) encodes exactly
 * that carve-out. This evaluator treats that merged, Founder-approved
 * contract as authoritative for those two catalogue rows: a sensitive
 * permission may be satisfied by a role's default template if — and only
 * if — the catalogue itself marks it inheritable for that role
 * (`SENSITIVE_PERMISSION_ROLE_TEMPLATES`); every other sensitive permission
 * (§3.3's never-implicitly-inheritable set) still strictly requires an
 * explicit grant or the Owner floor, matching §4.1.4 exactly.
 */

import { isWellFormedPermissionId } from "../models/permissionId";
import { isSensitivePermission } from "../models/sensitivePermissionCatalogue";
import {
  SENSITIVE_PERMISSION_ROLE_TEMPLATES,
  isPermissionInRoleTemplateDefault,
} from "../models/roleTemplate";
import type { AuthorizationDecision, EvaluationInput, ReasonCode } from "./types";
import type { ErrorCategory } from "../../../shared/errors/errorCategories";

function deny(reasonCode: ReasonCode, errorCategory: ErrorCategory): AuthorizationDecision {
  return { allowed: false, reasonCode, errorCategory, evaluatedAt: new Date() };
}

export function evaluateAuthorizationDecision(input: EvaluationInput): AuthorizationDecision {
  const { request, business, membership } = input;

  // Step 1: subject.
  if (!request.userId || request.userId.trim().length === 0) {
    return deny("NO_SUBJECT", "AUTH_REQUIRED");
  }

  // Step 2 (context validation, ahead of the business-record read per §5.4 —
  // a malformed/missing businessId cannot even be looked up).
  if (!request.businessId || request.businessId.trim().length === 0) {
    return deny("MISSING_BUSINESS_CONTEXT", "VALIDATION_FAILED");
  }

  // Step 2: business-state gate (§4.1.1).
  if (business.kind === "transient_failure") {
    return deny("BUSINESS_READ_FAILURE", "TEMPORARY_UNAVAILABLE");
  }
  if (business.kind === "not_found") {
    return deny("BUSINESS_NOT_FOUND", "BUSINESS_INACTIVE");
  }
  if (business.kind === "malformed") {
    return deny("BUSINESS_CONFIG_MALFORMED", "BUSINESS_INACTIVE");
  }
  if (business.business.status !== "active") {
    return deny("BUSINESS_NOT_ACTIVE", "BUSINESS_INACTIVE");
  }

  // Step 3: membership-state gate (§4.1.2), including business-context isolation (§5.6).
  if (membership.kind === "transient_failure") {
    return deny("MEMBERSHIP_READ_FAILURE", "TEMPORARY_UNAVAILABLE");
  }
  if (membership.kind === "not_found") {
    return deny("MEMBERSHIP_NOT_FOUND", "AUTH_FORBIDDEN");
  }
  if (membership.kind === "malformed") {
    return deny("MEMBERSHIP_CONFIG_MALFORMED", "AUTH_FORBIDDEN");
  }
  const resolvedMembership = membership.membership;
  if (
    resolvedMembership.businessId !== request.businessId ||
    resolvedMembership.userId !== request.userId
  ) {
    // Defence-in-depth: the repository is expected to resolve strictly by
    // (userId, businessId), so this should be structurally unreachable —
    // but the evaluator never trusts a membership record for the wrong
    // subject/business even if one somehow reached it (§5.6).
    return deny("MEMBERSHIP_BUSINESS_MISMATCH", "AUTH_FORBIDDEN");
  }
  if (resolvedMembership.status !== "active") {
    return deny("MEMBERSHIP_NOT_ACTIVE", "AUTH_FORBIDDEN");
  }

  // Step 4: permission identifier shape (§4.1.7).
  if (!isWellFormedPermissionId(request.permission)) {
    return deny("MALFORMED_PERMISSION_ID", "VALIDATION_FAILED");
  }
  const permission = request.permission;
  const role = resolvedMembership.role;

  // Step 5: Owner floor (§3.6, INV-1) — evaluated before overrides, since
  // an Owner's sensitive-permission set is structural, not a target of any
  // override (permissionOverride.ts already refuses overrides on Owner
  // memberships; this is the runtime half of that same invariant).
  if (role === "owner" && isSensitivePermission(permission)) {
    return {
      allowed: true,
      reasonCode: "OWNER_FLOOR",
      role,
      permissionSource: "owner-floor",
      evaluatedAt: new Date(),
    };
  }

  // Overrides embedded in the resolved membership only — an override
  // stamped for a different business or membership is never trusted
  // (§5.6 cross-business isolation, defence-in-depth beyond repository scoping).
  const applicableOverrides = resolvedMembership.overrides.filter(
    (override) =>
      override.permissionId === permission &&
      override.businessId === request.businessId &&
      override.membershipId === resolvedMembership.id,
  );

  // Step 6: explicit revocation (§4.1.3) — checked, and wins, before grant or sensitivity.
  if (applicableOverrides.some((override) => override.direction === "revoke")) {
    return deny("EXPLICIT_REVOCATION", "AUTH_FORBIDDEN");
  }

  // Step 7: explicit grant (§4.1.5) — satisfies sensitivity too.
  if (applicableOverrides.some((override) => override.direction === "grant")) {
    return {
      allowed: true,
      reasonCode: "EXPLICIT_GRANT",
      role,
      permissionSource: "explicit-grant",
      evaluatedAt: new Date(),
    };
  }

  // Step 8: sensitive-permission gate (§4.1.4), with the §3.2 rows 7-8
  // role-default carve-out (see module header note).
  if (isSensitivePermission(permission)) {
    if (isPermissionInRoleTemplateDefault(SENSITIVE_PERMISSION_ROLE_TEMPLATES[role], permission)) {
      return {
        allowed: true,
        reasonCode: "ROLE_DEFAULT_ALLOW",
        role,
        permissionSource: "role-default",
        evaluatedAt: new Date(),
      };
    }
    return deny("SENSITIVE_PERMISSION_NOT_GRANTED", "AUTH_FORBIDDEN");
  }

  // Step 9: non-sensitive role/template default (§4.1.6). No governed
  // non-sensitive baseline table exists yet (ENG-P2-004A explicitly
  // deferred it — see roleTemplate.ts's module header); until one is
  // added, this check can only ever match a sensitive-catalogue id, which
  // step 8 above already exhausted, so this branch is a documented no-op
  // placeholder for that future baseline table rather than dead code.
  if (isPermissionInRoleTemplateDefault(SENSITIVE_PERMISSION_ROLE_TEMPLATES[role], permission)) {
    return {
      allowed: true,
      reasonCode: "ROLE_DEFAULT_ALLOW",
      role,
      permissionSource: "role-default",
      evaluatedAt: new Date(),
    };
  }

  // Step 10: fail closed.
  return deny("NO_APPLICABLE_GRANT", "AUTH_FORBIDDEN");
}
