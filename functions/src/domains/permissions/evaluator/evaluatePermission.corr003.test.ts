/**
 * ENG-P2-004-CORR-003 — permanent evaluator-level correction coverage.
 *
 * Founder-authorized bounded correction: `staff.manage`'s Sensitive
 * lifecycle gate is widened to `{draft, pending_verification, trial,
 * active}` so Staff/Manager invitation is not blocked while the Business
 * is still in its pre-operational onboarding states. Every other Sensitive
 * permission's lifecycle eligibility remains byte-for-byte unchanged
 * (`{trial, active}`).
 *
 * Phase mapping (see the implementation report for the full matrix):
 *   - Phase G: legacy Sensitive fallback — every OTHER Sensitive id, all 8
 *     Business statuses.
 *   - Phase H: staff.manage's own lifecycle matrix, all 8 Business statuses.
 *   - Phase I: Owner proof.
 *   - Phase J: Manager proof (no grant vs. valid grant).
 *   - Phase K: Staff proof (default/template/override attack paths).
 *   - Phase L: action-neutrality (staff.manage governs invite/suspend/remove
 *     uniformly — no action-specific gate exists at the evaluator level).
 *   - Phase O: security non-regression — the eight non-scope Sensitive ids
 *     still deny in draft/pending_verification.
 */

import { describe, it, expect } from "vitest";
import { evaluateAuthorizationDecision } from "./evaluatePermission";
import type {
  EvaluationInput,
  EvaluationBusinessMembership,
  EvaluationBusiness,
  BusinessLifecycleStatus,
} from "./types";
import { SENSITIVE_PERMISSION_IDS } from "../models/sensitivePermissionCatalogue";

const STAFF_MANAGE_ELIGIBLE_STATUSES = [
  "draft",
  "pending_verification",
  "trial",
  "active",
] as const;
const STAFF_MANAGE_INELIGIBLE_STATUSES = ["suspended", "expired", "closed", "archived"] as const;

const OTHER_SENSITIVE_IDS = SENSITIVE_PERMISSION_IDS.filter((id) => id !== "staff.manage");

function membership(
  overrides: Partial<EvaluationBusinessMembership> = {},
): EvaluationBusinessMembership {
  return {
    id: "mem-1",
    userId: "user-1",
    businessId: "biz-a",
    role: "owner",
    status: "active",
    overrides: [],
    ...overrides,
  };
}

const FIXED_NOW = new Date("2026-08-22T00:00:00.000Z");

function inputFor(
  permission: string,
  status: BusinessLifecycleStatus,
  membershipOverrides: Partial<EvaluationBusinessMembership> = {},
): EvaluationInput {
  const business: EvaluationBusiness = { id: "biz-a", status };
  return {
    request: { userId: "user-1", businessId: "biz-a", permission },
    business: { kind: "found", business },
    membership: { kind: "found", membership: membership(membershipOverrides) },
    now: FIXED_NOW,
  };
}

// ---------------------------------------------------------------------------
// Phase G — legacy Sensitive fallback: every Sensitive id OTHER than
// staff.manage must retain exactly the pre-CORR-003 {trial, active} gate.
// ---------------------------------------------------------------------------
describe("ENG-P2-004-CORR-003 Phase G — legacy Sensitive fallback (every non-staff.manage id, all 8 statuses)", () => {
  for (const permission of OTHER_SENSITIVE_IDS) {
    describe(`${permission}`, () => {
      it.each([
        "draft",
        "pending_verification",
        "suspended",
        "expired",
        "closed",
        "archived",
      ] as const)(
        "status=%s → deny BUSINESS_INACTIVE (Owner role, so any allow could only come from the lifecycle gate itself)",
        (status) => {
          const decision = evaluateAuthorizationDecision(
            inputFor(permission, status, { role: "owner" }),
          );
          expect(decision.allowed).toBe(false);
          expect(decision.errorCategory).toBe("BUSINESS_INACTIVE");
          expect(decision.reasonCode).toBe("BUSINESS_NOT_ACTIVE");
        },
      );

      it.each(["trial", "active"] as const)(
        "status=%s → proceeds past the lifecycle gate to normal role/permission evaluation (Owner floor allows)",
        (status) => {
          const decision = evaluateAuthorizationDecision(
            inputFor(permission, status, { role: "owner" }),
          );
          expect(decision.allowed).toBe(true);
          expect(decision.reasonCode).toBe("OWNER_FLOOR");
        },
      );
    });
  }
});

// ---------------------------------------------------------------------------
// Phase H — staff.manage's own lifecycle matrix (Owner role, isolates the
// lifecycle gate itself from role-semantics questions covered in Phase I-K).
// ---------------------------------------------------------------------------
describe("ENG-P2-004-CORR-003 Phase H — staff.manage lifecycle matrix (Owner role)", () => {
  it.each(STAFF_MANAGE_ELIGIBLE_STATUSES)(
    "status=%s → eligible (passes the lifecycle gate)",
    (status) => {
      const decision = evaluateAuthorizationDecision(
        inputFor("staff.manage", status, { role: "owner" }),
      );
      expect(decision.allowed).toBe(true);
    },
  );

  it.each(STAFF_MANAGE_INELIGIBLE_STATUSES)(
    "status=%s → deny BUSINESS_INACTIVE (unchanged, still ineligible)",
    (status) => {
      const decision = evaluateAuthorizationDecision(
        inputFor("staff.manage", status, { role: "owner" }),
      );
      expect(decision.allowed).toBe(false);
      expect(decision.errorCategory).toBe("BUSINESS_INACTIVE");
      expect(decision.reasonCode).toBe("BUSINESS_NOT_ACTIVE");
    },
  );
});

// ---------------------------------------------------------------------------
// Phase I — Owner proof: draft/pending_verification/trial/active all allow,
// via the existing, unchanged Owner-floor mechanism (§3.6/INV-1) — no new
// pre-operational Owner bypass is introduced.
// ---------------------------------------------------------------------------
describe("ENG-P2-004-CORR-003 Phase I — Owner proof", () => {
  it.each(STAFF_MANAGE_ELIGIBLE_STATUSES)(
    "Owner + active membership + status=%s + staff.manage → allow via the existing OWNER_FLOOR reason/source (no new bypass)",
    (status) => {
      const decision = evaluateAuthorizationDecision(
        inputFor("staff.manage", status, { role: "owner" }),
      );
      expect(decision.allowed).toBe(true);
      expect(decision.reasonCode).toBe("OWNER_FLOOR");
      if (decision.allowed) {
        expect(decision.permissionSource).toBe("owner-floor");
      }
    },
  );
});

// ---------------------------------------------------------------------------
// Phase J — Manager proof: no grant → deny in every newly-eligible status;
// a pre-existing valid grant → allow in the newly-eligible statuses.
// ---------------------------------------------------------------------------
describe("ENG-P2-004-CORR-003 Phase J — Manager proof", () => {
  it.each(STAFF_MANAGE_ELIGIBLE_STATUSES)(
    "Manager WITHOUT an explicit staff.manage grant + status=%s → deny (no default, no new pre-operational grant path)",
    (status) => {
      const decision = evaluateAuthorizationDecision(
        inputFor("staff.manage", status, { role: "manager" }),
      );
      expect(decision.allowed).toBe(false);
      expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
    },
  );

  it.each(STAFF_MANAGE_ELIGIBLE_STATUSES)(
    "Manager WITH an already-valid staff.manage grant + status=%s → allow via EXPLICIT_GRANT (persisted state, not a new grant mechanism)",
    (status) => {
      const decision = evaluateAuthorizationDecision(
        inputFor("staff.manage", status, {
          role: "manager",
          overrides: [
            {
              permissionId: "staff.manage",
              direction: "grant",
              businessId: "biz-a",
              membershipId: "mem-1",
            },
          ],
        }),
      );
      expect(decision.allowed).toBe(true);
      expect(decision.reasonCode).toBe("EXPLICIT_GRANT");
      if (decision.allowed) {
        expect(decision.permissionSource).toBe("explicit-grant");
      }
    },
  );
});

// ---------------------------------------------------------------------------
// Phase K — Staff proof: Staff can never acquire/hold staff.manage through
// any allowed mechanism (role default, role template, or override grant),
// in every newly-eligible status.
// ---------------------------------------------------------------------------
describe("ENG-P2-004-CORR-003 Phase K — Staff proof", () => {
  it.each(STAFF_MANAGE_ELIGIBLE_STATUSES)(
    "Staff with no override + status=%s → deny (no role default/template exists for staff.manage)",
    (status) => {
      const decision = evaluateAuthorizationDecision(
        inputFor("staff.manage", status, { role: "staff" }),
      );
      expect(decision.allowed).toBe(false);
      expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
    },
  );

  it.each(STAFF_MANAGE_ELIGIBLE_STATUSES)(
    "Staff with a (malformed/attacker-injected) grant override + status=%s → still deny (catalogue names only Manager as grant-eligible; role revalidated, not trusted from override presence)",
    (status) => {
      const decision = evaluateAuthorizationDecision(
        inputFor("staff.manage", status, {
          role: "staff",
          overrides: [
            {
              permissionId: "staff.manage",
              direction: "grant",
              businessId: "biz-a",
              membershipId: "mem-1",
            },
          ],
        }),
      );
      expect(decision.allowed).toBe(false);
      expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
    },
  );
});

// ---------------------------------------------------------------------------
// Phase L — action-neutrality: staff.manage governs invite/suspend/remove
// uniformly at the permission-evaluation layer (the command layer maps all
// three actions onto the same "staff.manage" permission id — see
// staffMembershipLifecycleCommand.ts / createStaffInvitationService.ts —
// so there is nothing action-specific for the evaluator to gate; this test
// documents that the SAME decision results regardless of which action the
// caller ultimately performs with the resulting allow).
// ---------------------------------------------------------------------------
describe("ENG-P2-004-CORR-003 Phase L — action-neutral lifecycle gate", () => {
  it.each(STAFF_MANAGE_ELIGIBLE_STATUSES)(
    "the evaluator's staff.manage decision for status=%s does not vary by action — only one permission id is ever evaluated (Owner)",
    (status) => {
      const first = evaluateAuthorizationDecision(
        inputFor("staff.manage", status, { role: "owner" }),
      );
      const second = evaluateAuthorizationDecision(
        inputFor("staff.manage", status, { role: "owner" }),
      );
      expect(first.allowed).toBe(true);
      expect(second.allowed).toBe(true);
      expect(first.reasonCode).toBe(second.reasonCode);
    },
  );
});

// ---------------------------------------------------------------------------
// Phase O — security non-regression: the eight explicitly out-of-scope
// Sensitive permissions must still deny in draft and pending_verification.
// ---------------------------------------------------------------------------
describe("ENG-P2-004-CORR-003 Phase O — security non-regression (out-of-scope Sensitive ids, draft/pending_verification)", () => {
  const NON_SCOPE_PERMISSIONS = [
    "staff.assignPermissions",
    "staff.assignRole",
    "business.transferOwnership",
    "business.configureFraudRules",
    "transaction.reverse",
    "reward.override",
    "customer.viewProtectedProfile",
    "report.exportFinancial",
  ] as const;

  for (const permission of NON_SCOPE_PERMISSIONS) {
    it.each(["draft", "pending_verification"] as const)(
      `${permission} + status=%s → deny`,
      (status) => {
        const decision = evaluateAuthorizationDecision(
          inputFor(permission, status, { role: "owner" }),
        );
        expect(decision.allowed).toBe(false);
        expect(decision.errorCategory).toBe("BUSINESS_INACTIVE");
      },
    );
  }
});
