/**
 * Permission evaluator — pure decision function (`ENG-P2-004B`).
 *
 * Implements `ENG-P2-004-DESIGN-001` §6.9's evaluation algorithm exactly,
 * in the approved order, short-circuiting on first deny. Pure: it never
 * touches Firestore (machine-enforced — this whole directory is scoped by
 * the repo-root `eslint.config.js` `no-restricted-imports` rule to forbid
 * any Firebase SDK import, `evaluator/**`/`repositories/**` and
 * `service/**` excepted), never mutates its input, and is a genuine
 * function of its input alone (design §6.18 purity, §13 item 1
 * determinism) — including `evaluatedAt`, which is read from
 * `input.now` rather than the wall clock, so calling this function twice
 * with the same `EvaluationInput` always produces byte-identical output
 * (Codex review, PR #107; a wall-clock read inside a "pure" function
 * would silently violate the acceptance criterion).
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
 *
 * **`ENG-P2-004-CORR-001` per-permission lifecycle gate (Founder-approved
 * correction, FD-CORR-1/2).** The single global `business.status ∈
 * {trial, active}` gate below governed every permission identically,
 * which structurally denied all four Founder-approved ordinary Business
 * permissions (`business.updateProfile`, `businessBranch.updateProfile`,
 * `business.submitForVerification`, `business.close`) on a `draft`
 * Business — including the Owner's own bootstrap-created business,
 * before it could ever be submitted for verification (`CAP-P3-BIZ-AUTH-001`
 * forensic finding). The permission requested is now classified
 * (sensitive / ordinary / unknown) immediately after the Business record
 * resolves, and that classification's own governed lifecycle-eligibility
 * set is applied — the sensitive catalogue's `{trial, active}` gate is
 * unchanged, byte-for-byte, for every sensitive permission; the four
 * ordinary permissions each carry their own Founder-approved eligibility
 * set (`ordinaryPermissionCatalogue.ts`); an unknown/unconfigured
 * permission has no lifecycle gate at all applied here and instead denies
 * later, exactly as it already did (`NO_APPLICABLE_GRANT`) — this
 * correction never widens what an unconfigured permission can do.
 *
 * Ordinary permissions are resolved through their own dedicated
 * role-default lookup (`ORDINARY_PERMISSION_CATALOGUE`), reached
 * immediately after the sensitive-only Owner floor and returning before
 * the override-resolution steps run at all — `PermissionOverride`
 * grant/revoke resolution is therefore never consulted for an ordinary
 * permission (FD-CORR-6: ordinary permissions do not support explicit
 * grant/revoke in this correction), and every override-adjacent branch
 * below (steps 6-9) keeps operating exactly as it did before this
 * correction for every permission that reaches it.
 *
 * **`ENG-P2-004-CORR-003` per-permission Sensitive lifecycle gate
 * (Founder-approved correction).** The single global Sensitive gate
 * (`{trial, active}`) conflicted with the approved Business onboarding
 * journey, which offers Staff invitation (`staff.manage`) while the
 * Business is still `draft`/`pending_verification`. Mirroring
 * `ENG-P2-004-CORR-001`'s own per-permission precedent for ordinary
 * permissions, the Sensitive catalogue now supports an optional
 * per-entry `eligibleBusinessStatuses` override
 * (`sensitivePermissionCatalogue.ts`); the Sensitive branch below reads
 * that override when present, and falls back to the legacy
 * `{trial, active}` set (`LEGACY_OPERATIONAL_SENSITIVE_STATUSES`) when
 * absent. Only `staff.manage`'s catalogue entry carries an override —
 * every other Sensitive permission's lifecycle eligibility is unchanged,
 * byte-for-byte (Phase G backward-compatibility proof). This is
 * catalogue-configuration policy, not evaluator branching: no
 * `permission === "staff.manage"` special case exists in this file.
 */

import { isWellFormedPermissionId } from "../models/permissionId";
import type { Role } from "../models/role";
import {
  isSensitivePermission,
  getSensitivePermissionEntry,
} from "../models/sensitivePermissionCatalogue";
import {
  SENSITIVE_PERMISSION_ROLE_TEMPLATES,
  isPermissionInRoleTemplateDefault,
} from "../models/roleTemplate";
import {
  isOrdinaryPermission,
  getOrdinaryPermissionEntry,
} from "../models/ordinaryPermissionCatalogue";
import type { AuthorizationDecision, EvaluationInput, PermissionSource, ReasonCode } from "./types";
import type { ErrorCategory } from "../../../shared/errors/errorCategories";

/**
 * "Operational" per PRD Section 3 §4 (Business Lifecycle, verbatim):
 * Trial — "Business may begin operating under trial rules"; Active —
 * "Business fully operational." Every other state's own description
 * explicitly says otherwise (Draft "incomplete", Pending Verification
 * "awaiting... verification", Suspended "access restricted", Expired
 * "operational features disabled", Closed "permanently closed",
 * Archived "no operational activity"). Corrected after independent
 * final security review — the original narrow "only literal 'active'"
 * interpretation was too restrictive and denied businesses PRD
 * explicitly describes as operating (Codex review pass 6, PR #107).
 *
 * Sensitive-catalogue-only, unchanged by `ENG-P2-004-CORR-001` — the
 * four ordinary permissions each carry their own lifecycle-eligibility
 * set instead of this one (see the module header note and
 * `ordinaryPermissionCatalogue.ts`).
 *
 * `ENG-P2-004-CORR-003`: this is now the *legacy fallback* used only when
 * a Sensitive catalogue entry has no explicit `eligibleBusinessStatuses`
 * override — see the module header note. Every Sensitive permission
 * except `staff.manage` still resolves through this exact set.
 */
const LEGACY_OPERATIONAL_SENSITIVE_STATUSES = new Set(["active", "trial"]);

type PermissionClass = "sensitive" | "ordinary" | "unknown";

function classifyPermission(permission: string): PermissionClass {
  if (isSensitivePermission(permission)) {
    return "sensitive";
  }
  if (isOrdinaryPermission(permission)) {
    return "ordinary";
  }
  return "unknown";
}

function deny(
  now: Date,
  reasonCode: ReasonCode,
  errorCategory: ErrorCategory,
  role?: Role,
): AuthorizationDecision {
  return role
    ? {
        allowed: false,
        reasonCode,
        errorCategory,
        role,
        permissionSource: "n/a-denied" as PermissionSource,
        evaluatedAt: now,
      }
    : { allowed: false, reasonCode, errorCategory, evaluatedAt: now };
}

export function evaluateAuthorizationDecision(input: EvaluationInput): AuthorizationDecision {
  const { request, business, membership, now } = input;

  // Step 1: subject. `AuthorizationRequest`'s TypeScript type does not
  // validate an untrusted runtime payload — checked with `typeof` before
  // `.trim()` so a non-string value (e.g. a caller not enforcing the type
  // at the network boundary) resolves to the ordinary fail-closed
  // decision instead of throwing (Codex review pass 3, PR #107).
  if (typeof request.userId !== "string" || request.userId.trim().length === 0) {
    return deny(now, "NO_SUBJECT", "AUTH_REQUIRED");
  }

  // Step 2 (context validation, ahead of the business-record read per §5.4 —
  // a malformed/missing businessId cannot even be looked up).
  if (typeof request.businessId !== "string" || request.businessId.trim().length === 0) {
    return deny(now, "MISSING_BUSINESS_CONTEXT", "VALIDATION_FAILED");
  }
  // A "/" is a Firestore document-path separator, not a valid character
  // in a single document ID — a businessId containing one is malformed
  // client input, not a value any repository read should ever be
  // attempted against (it would either throw an SDK error, mis-mapped to
  // TEMPORARY_UNAVAILABLE and inviting pointless retries, or silently
  // resolve to an unintended nested document path). Rejected here as
  // ordinary client-supplied validation failure (Codex review pass 6, PR #107).
  if (request.businessId.includes("/")) {
    return deny(now, "MALFORMED_BUSINESS_CONTEXT", "VALIDATION_FAILED");
  }

  // Step 2: business-state gate (§4.1.1). Per §6.11 verbatim: "a missing
  // business document ... [is] treated as deny ... client-facing outcome
  // is AUTH_FORBIDDEN" — only a business record that was successfully
  // read and whose own `status` field legitimately says non-active maps
  // to `BUSINESS_INACTIVE` (§11's "Business inactive/suspended" row).
  // Missing/malformed/mismatched-identity are all server-owned data
  // conditions (AD-4), not a legitimate "business is inactive" read —
  // corrected after independent re-derivation from §6.11 during the
  // Founder-authorized final security review (a broader instance of the
  // same class of bug Codex review pass 3 flagged for the malformed case
  // only).
  if (business.kind === "transient_failure") {
    return deny(now, "BUSINESS_READ_FAILURE", "TEMPORARY_UNAVAILABLE");
  }
  if (business.kind === "not_found") {
    return deny(now, "BUSINESS_NOT_FOUND", "AUTH_FORBIDDEN");
  }
  if (business.kind === "malformed") {
    return deny(now, "BUSINESS_CONFIG_MALFORMED", "AUTH_FORBIDDEN");
  }
  if (business.business.id !== request.businessId) {
    // Defence-in-depth mirroring the membership-mismatch check below: an
    // independently constructed EvaluationInput could combine an active
    // Business-A result with a Business-B request (stale/misrouted
    // repository read) — the evaluator never trusts a business record
    // whose own id doesn't match the requested context (§5.6, Codex
    // review pass 2, PR #107).
    return deny(now, "BUSINESS_CONTEXT_MISMATCH", "AUTH_FORBIDDEN");
  }
  // Step 2 (cont.) — permission classification + per-class lifecycle
  // eligibility (`ENG-P2-004-CORR-001`, FD-CORR-1/2). Classification uses
  // the raw, not-yet-format-validated `request.permission` — both
  // catalogues are exact-match membership checks against a closed id set,
  // so a malformed string simply classifies as "unknown" here and is
  // rejected by its own format check at Step 4 below, exactly as before
  // this correction (Codex-review-equivalent reasoning: classification
  // must never be able to throw on untrusted input).
  const permissionClass = classifyPermission(request.permission);
  if (permissionClass === "sensitive") {
    // `ENG-P2-004-CORR-003`: per-permission override when the catalogue
    // entry names one (currently `staff.manage` only), else the
    // unchanged legacy `{trial, active}` set — see module header note.
    const sensitiveEntry = getSensitivePermissionEntry(request.permission);
    const eligibleSensitiveStatuses: ReadonlySet<string> = sensitiveEntry.eligibleBusinessStatuses
      ? new Set(sensitiveEntry.eligibleBusinessStatuses)
      : LEGACY_OPERATIONAL_SENSITIVE_STATUSES;
    if (!eligibleSensitiveStatuses.has(business.business.status)) {
      return deny(now, "BUSINESS_NOT_ACTIVE", "BUSINESS_INACTIVE");
    }
  } else if (permissionClass === "ordinary") {
    const ordinaryEntry = getOrdinaryPermissionEntry(request.permission);
    if (!ordinaryEntry.eligibleBusinessStatuses.includes(business.business.status)) {
      return deny(now, "BUSINESS_NOT_ACTIVE", "BUSINESS_INACTIVE");
    }
  }
  // permissionClass === "unknown": no lifecycle gate applies here — an
  // unconfigured permission was never eligible on any Business status
  // before this correction either; it is still rejected below (Step 9),
  // just not by this gate (defence-in-depth: adding a gate for a class
  // with no governed eligibility table would mean inventing one).

  // Step 3: membership-state gate (§4.1.2), including business-context isolation (§5.6).
  if (membership.kind === "transient_failure") {
    return deny(now, "MEMBERSHIP_READ_FAILURE", "TEMPORARY_UNAVAILABLE");
  }
  if (membership.kind === "not_found") {
    return deny(now, "MEMBERSHIP_NOT_FOUND", "AUTH_FORBIDDEN");
  }
  if (membership.kind === "malformed") {
    return deny(now, "MEMBERSHIP_CONFIG_MALFORMED", "AUTH_FORBIDDEN");
  }
  const resolvedMembership = membership.membership;
  if (
    resolvedMembership.businessId !== request.businessId ||
    resolvedMembership.userId !== request.userId
  ) {
    // Defence-in-depth: the repository is expected to resolve strictly by
    // (userId, businessId), so this should be structurally unreachable —
    // but the evaluator never trusts a membership record for the wrong
    // subject/business even if one somehow reached it (§5.6). A
    // membership was still structurally *found* here, so the decision
    // contract's "role, if a membership was found" still applies (§6.2,
    // Codex review pass 2, PR #107).
    return deny(now, "MEMBERSHIP_BUSINESS_MISMATCH", "AUTH_FORBIDDEN", resolvedMembership.role);
  }
  if (resolvedMembership.status !== "active") {
    return deny(now, "MEMBERSHIP_NOT_ACTIVE", "AUTH_FORBIDDEN", resolvedMembership.role);
  }

  const role = resolvedMembership.role;

  // Step 4: permission identifier shape (§4.1.7).
  if (!isWellFormedPermissionId(request.permission)) {
    return deny(now, "MALFORMED_PERMISSION_ID", "VALIDATION_FAILED", role);
  }
  const permission = request.permission;

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
      evaluatedAt: now,
    };
  }

  // Step 5a (`ENG-P2-004-CORR-001`, FD-CORR-2/4/6): ordinary permissions
  // resolve entirely through their own role-default table and return here
  // — they never reach the override-resolution steps below at all. This
  // is what keeps FD-CORR-6 ("do NOT add ordinary-permission explicit
  // grant/revoke support") true by construction: an override record
  // stamped against an ordinary permission (however it got there) is
  // simply never inspected, so it can neither grant unconfigured access
  // nor revoke the Owner's configured default. `permissionClass` was
  // already resolved from the same `request.permission` above; using
  // `isOrdinaryPermission(permission)` again here would be redundant, but
  // is checked directly (rather than trusting the outer `permissionClass`
  // closure) so this branch's correctness does not depend on that
  // variable never being reassigned above — a defence-in-depth match to
  // this evaluator's existing style (Codex review precedent throughout
  // this file).
  if (isOrdinaryPermission(permission)) {
    const ordinaryEntry = getOrdinaryPermissionEntry(permission);
    if (ordinaryEntry.roleDefaults[role]) {
      return {
        allowed: true,
        reasonCode: "ROLE_DEFAULT_ALLOW",
        role,
        permissionSource: "role-default",
        evaluatedAt: now,
      };
    }
    return deny(now, "NO_APPLICABLE_GRANT", "AUTH_FORBIDDEN", role);
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

  // Corrupt override state fails closed rather than being treated as
  // absent: an applicable override whose `direction` is neither "grant"
  // nor "revoke" cannot be soundly interpreted — it may have been an
  // intended revocation that corruption obscured — so evaluation must
  // not silently fall through to whatever the rest of the algorithm
  // would otherwise decide (which could itself be an allow via
  // role-default). Corrected after independent final security review;
  // an earlier version of this evaluator treated an unrecognized
  // direction as absent, which a dedicated test then incorrectly
  // asserted as the expected (and unsafe) behavior (Codex review, PR #107).
  if (
    applicableOverrides.some(
      (override) => override.direction !== "grant" && override.direction !== "revoke",
    )
  ) {
    return deny(now, "MALFORMED_OVERRIDE_DIRECTION", "AUTH_FORBIDDEN", role);
  }

  // Step 6: explicit revocation (§4.1.3) — checked, and wins, before grant or sensitivity.
  if (applicableOverrides.some((override) => override.direction === "revoke")) {
    return deny(now, "EXPLICIT_REVOCATION", "AUTH_FORBIDDEN", role);
  }

  // Step 7: explicit grant (§4.1.5) — satisfies sensitivity too, but only
  // for a role the catalogue actually names as grant-eligible for this
  // permission (§3.2's per-row "Explicit grant required?" role
  // qualifier). `createPermissionOverride` already enforces this at
  // construction time, but `EvaluationInput`/overrides are independently
  // constructible repository-owned data, so this is revalidated here
  // rather than trusted on presence alone (Codex review, PR #107).
  //
  // An applicable grant that fails eligibility now fails CLOSED
  // (AUTH_FORBIDDEN) rather than being treated as absent and falling
  // through to the sensitive gate/role-default below. An earlier version
  // of this evaluator let an ineligible grant fall through, which was
  // safe only by coincidence for an ungoverned permission (step 8/9/10
  // always deny those anyway) but unsafe for a sensitive permission
  // whose role-default carve-out (§3.2 rows 7-8) could still allow it —
  // e.g. a stray/corrupted grant on a Manager's membership for
  // `customer.viewProtectedProfile` (eligible role: Staff) would fall
  // through to an allow via role-default, silently coexisting with
  // override state that cannot be trusted (it could be a corrupted
  // intended revocation that became a syntactically valid grant).
  // Corrected after independent final security review, Codex review
  // pass 5, PR #107 — this is the same "corrupt override state must
  // deny, never be treated as absent" principle already applied to
  // malformed override directions above.
  const grantOverride = applicableOverrides.find((override) => override.direction === "grant");
  if (grantOverride) {
    if (isSensitivePermission(permission)) {
      const entry = getSensitivePermissionEntry(permission);
      if (entry.explicitGrantRequired && entry.explicitGrantEligibleRole === role) {
        return {
          allowed: true,
          reasonCode: "EXPLICIT_GRANT",
          role,
          permissionSource: "explicit-grant",
          evaluatedAt: now,
        };
      }
    }
    return deny(now, "GRANT_NOT_HONORED", "AUTH_FORBIDDEN", role);
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
        evaluatedAt: now,
      };
    }
    return deny(now, "SENSITIVE_PERMISSION_NOT_GRANTED", "AUTH_FORBIDDEN", role);
  }

  // Step 9: non-sensitive role/template default (§4.1.6), consulting only
  // `SENSITIVE_PERMISSION_ROLE_TEMPLATES` — this is provably unreachable
  // for every permission this evaluator currently knows how to classify.
  // A sensitive-catalogue id is always exhausted by step 8 above; an
  // ordinary-catalogue id (`ENG-P2-004-CORR-001`) always returns earlier,
  // at Step 5a, via its own dedicated `ORDINARY_PERMISSION_CATALOGUE`
  // role-default table — never this one; any other id matches no role
  // template here by construction (`SENSITIVE_PERMISSION_ROLE_TEMPLATES`
  // is derived exclusively from the sensitive catalogue's inheritable
  // entries — see `roleTemplate.ts`). Retained rather than removed as a
  // documented no-op placeholder: a *third*, still-ungoverned non-
  // sensitive baseline permission space (e.g. `purchase.record`) remains
  // outside both catalogues — `ENG-P2-004A` explicitly declined to invent
  // one, and `ENG-P2-004-CORR-001` was explicitly authorized only for the
  // four named ordinary ids, not a general baseline (FD-CORR-2: "Do not
  // globally widen Business-status eligibility"). This step is where that
  // future baseline's own role-default check would go, once (if ever)
  // Founder-authorized (Codex review, PR #107; see the `ENG-P2-004B`
  // implementation report §14).
  if (isPermissionInRoleTemplateDefault(SENSITIVE_PERMISSION_ROLE_TEMPLATES[role], permission)) {
    return {
      allowed: true,
      reasonCode: "ROLE_DEFAULT_ALLOW",
      role,
      permissionSource: "role-default",
      evaluatedAt: now,
    };
  }

  // Step 10: fail closed.
  return deny(now, "NO_APPLICABLE_GRANT", "AUTH_FORBIDDEN", role);
}
