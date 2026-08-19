/**
 * Permission evaluator — core decision-table tests (`ENG-P2-004B`).
 *
 * Written before `evaluatePermission.ts` exists (Phase D genuine RED
 * evidence). Tests the pure `evaluateAuthorizationDecision` function only —
 * no Firestore, no repository I/O (see `evaluatePermission.emulator.test.ts`
 * and `*Repository.emulator.test.ts` for real-persistence proof). Every
 * case below maps 1:1 to a row in
 * `docs/05-implementation/reports/ENG-P2-004B-test-matrix-2026-08-15.md`.
 */

import { describe, it, expect } from "vitest";
import { evaluateAuthorizationDecision } from "./evaluatePermission";
import type { EvaluationInput, EvaluationBusinessMembership, EvaluationBusiness } from "./types";

const ACTIVE_BUSINESS: EvaluationBusiness = { id: "biz-a", status: "active" };

function membership(
  overrides: Partial<EvaluationBusinessMembership> = {},
): EvaluationBusinessMembership {
  return {
    id: "mem-1",
    userId: "user-1",
    businessId: "biz-a",
    role: "manager",
    status: "active",
    overrides: [],
    ...overrides,
  };
}

const FIXED_NOW = new Date("2026-08-15T00:00:00.000Z");

function baseInput(overrides: Partial<EvaluationInput> = {}): EvaluationInput {
  return {
    request: { userId: "user-1", businessId: "biz-a", permission: "customer.viewProtectedProfile" },
    business: { kind: "found", business: ACTIVE_BUSINESS },
    membership: { kind: "found", membership: membership() },
    now: FIXED_NOW,
    ...overrides,
  };
}

describe("evaluateAuthorizationDecision — §4.2 decision table (verbatim rows)", () => {
  it("row 1: business inactive → deny (§4.1.1)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({ business: { kind: "found", business: { id: "biz-a", status: "suspended" } } }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("BUSINESS_INACTIVE");
  });

  it("business status=trial is operational, not inactive — PRD3 §4 verbatim: 'Trial: Business may begin operating under trial rules' (Codex review pass 6, PR #107)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({ business: { kind: "found", business: { id: "biz-a", status: "trial" } } }),
    );
    expect(decision.allowed).toBe(true);
  });

  it.each(["draft", "pending_verification", "suspended", "expired", "closed", "archived"] as const)(
    "business status=%s is NOT operational (PRD3 §4: only Trial and Active are described as operating) → deny, BUSINESS_INACTIVE",
    (status) => {
      const decision = evaluateAuthorizationDecision(
        baseInput({ business: { kind: "found", business: { id: "biz-a", status } } }),
      );
      expect(decision.allowed).toBe(false);
      expect(decision.errorCategory).toBe("BUSINESS_INACTIVE");
    },
  );

  it("row 2: business not found → deny, AUTH_FORBIDDEN (§6.11 verbatim: 'a missing business document ... client-facing outcome is AUTH_FORBIDDEN')", () => {
    const decision = evaluateAuthorizationDecision(baseInput({ business: { kind: "not_found" } }));
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("row 3: membership missing → deny, AUTH_FORBIDDEN (§4.1.2)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({ membership: { kind: "not_found" } }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it.each(["invited", "suspended", "removed"] as const)(
    "row 4: membership status=%s → deny, AUTH_FORBIDDEN (§4.1.2/§4.4.8, AD-4)",
    (status) => {
      const decision = evaluateAuthorizationDecision(
        baseInput({ membership: { kind: "found", membership: membership({ status }) } }),
      );
      expect(decision.allowed).toBe(false);
      expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
    },
  );

  it("row 5: role default=yes, revoke=yes, sensitive=no → deny (revoke beats role default, §4.1.3)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        membership: {
          kind: "found",
          membership: membership({
            role: "manager",
            overrides: [
              {
                permissionId: "customer.viewProtectedProfile",
                direction: "revoke",
                businessId: "biz-a",
                membershipId: "mem-1",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("row 6: role default=yes, revoke=yes, sensitive=yes → deny (revoke checked before sensitivity, §4.1.3)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        membership: {
          kind: "found",
          membership: membership({
            role: "manager",
            overrides: [
              {
                permissionId: "customer.viewProtectedProfile",
                direction: "revoke",
                businessId: "biz-a",
                membershipId: "mem-1",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
  });

  it("row 7: role default=no, grant=yes, sensitive=no → allow, explicit-grant (§4.1.5)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "transaction.reverse" },
        membership: {
          kind: "found",
          membership: membership({
            role: "manager",
            overrides: [
              {
                permissionId: "transaction.reverse",
                direction: "grant",
                businessId: "biz-a",
                membershipId: "mem-1",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("explicit-grant");
  });

  it("row 8: role default=no, grant=yes, sensitive=yes → allow, explicit grant satisfies sensitivity (§4.1.5)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "staff.manage" },
        membership: {
          kind: "found",
          membership: membership({
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
        },
      }),
    );
    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("explicit-grant");
  });

  it("row 9: role default=no, grant=no, sensitive=yes → deny (§4.1.4)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "staff.manage" },
        membership: { kind: "found", membership: membership({ role: "manager" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("catalogue rows 7-8 carve-out: sensitive+inheritAllowed+role-eligible (Manager, customer.viewProtectedProfile, no explicit grant) → ALLOW, role-default (§3.2 rows 7-8, SENSITIVE_PERMISSION_ROLE_TEMPLATES)", () => {
    // §3.2 rows 7-8 mark these two permissions "Inherit? Yes" / "Explicit grant
    // required? No (role-default)" for Owner+Manager specifically — the catalogue's
    // own default-state column stands in for an explicit grant for eligible roles.
    // This is the one documented exception to §4.1 item 6's general "role default
    // satisfies non-sensitive permissions only" phrasing, and is exactly what 004A's
    // already-merged `SENSITIVE_PERMISSION_ROLE_TEMPLATES` (roleTemplate.ts) encodes:
    // Owner and Manager both default to the catalogue's two inheritable entries.
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: {
          userId: "user-1",
          businessId: "biz-a",
          permission: "customer.viewProtectedProfile",
        },
        membership: { kind: "found", membership: membership({ role: "manager" }) },
      }),
    );
    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("role-default");
  });

  it("catalogue rows 7-8 carve-out does NOT extend to a role the catalogue's defaultState doesn't name (Staff, customer.viewProtectedProfile, no explicit grant) → DENY (§3.2 'Yes for Staff' = grant required)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: {
          userId: "user-1",
          businessId: "biz-a",
          permission: "customer.viewProtectedProfile",
        },
        membership: { kind: "found", membership: membership({ role: "staff" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("row 10: sensitive, never-inheritable (inheritAllowed=false), role default cannot satisfy it under any circumstance (staff.manage, Manager role, §4.1.4 general rule)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "staff.manage" },
        membership: { kind: "found", membership: membership({ role: "manager" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
  });

  it("row 11: role default=yes, sensitive=no → allow, role-default (§4.1.6)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        membership: { kind: "found", membership: membership({ role: "manager" }) },
      }),
    );
    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("role-default");
  });

  it("row 12: unknown/malformed permission id → deny, VALIDATION_FAILED (§4.1.7)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "not a valid id" },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("VALIDATION_FAILED");
  });

  it("row 13: Owner, any sensitive permission, no override on file → ALLOW, owner-floor (§3.6, INV-1)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "staff.manage" },
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("owner-floor");
  });

  it("ENG-P2-004-CORR-002: Owner is allowed staff.assignRole via the owner floor, no override on file", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "staff.assignRole" },
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("owner-floor");
  });

  it("ENG-P2-004-CORR-002: Manager has no inherited/default allow for staff.assignRole", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "staff.assignRole" },
        membership: { kind: "found", membership: membership({ role: "manager" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("ENG-P2-004-CORR-002: Staff has no inherited/default allow for staff.assignRole", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "staff.assignRole" },
        membership: { kind: "found", membership: membership({ role: "staff" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("ENG-P2-004-CORR-002: a malformed persisted grant-looking override for staff.assignRole on a Manager membership still denies (fails closed, no grant path exists to honor)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "staff.assignRole" },
        membership: {
          kind: "found",
          membership: membership({
            role: "manager",
            overrides: [
              {
                permissionId: "staff.assignRole",
                direction: "grant",
                businessId: "biz-a",
                membershipId: "mem-1",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });
});

describe("evaluateAuthorizationDecision — Owner-floor scope and invariant (independent final review, §3.6/INV-1)", () => {
  it("Owner receives NO bypass for a well-formed but ungoverned (non-catalogue) permission — the floor is scoped to the sensitive catalogue only", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "some.ungoverned" },
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("Owner's sensitive-permission floor cannot be narrowed by any override record, even a directly-constructed revoke (§3.6: 'never narrowed below the full sensitive-permission set by any override record')", () => {
    // permissionOverride.ts already refuses to construct an override
    // targeting an Owner membership at all — this is the evaluator-level
    // defence-in-depth proof of the same invariant for a directly
    // constructed EvaluationInput (repository-owned data, independently
    // constructible).
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "staff.manage" },
        membership: {
          kind: "found",
          membership: membership({
            role: "owner",
            overrides: [
              {
                permissionId: "staff.manage",
                direction: "revoke",
                businessId: "biz-a",
                membershipId: "mem-1",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("owner-floor");
  });
});

describe("evaluateAuthorizationDecision — interaction cases (independent final review, Phase O)", () => {
  it("business-mismatch denial takes precedence over an otherwise-valid grant (business gate evaluated before membership/overrides)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-b", permission: "transaction.reverse" },
        business: { kind: "found", business: { id: "biz-a", status: "active" } },
        membership: {
          kind: "found",
          membership: membership({
            businessId: "biz-b",
            role: "manager",
            overrides: [
              {
                permissionId: "transaction.reverse",
                direction: "grant",
                businessId: "biz-b",
                membershipId: "mem-1",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("inactive-membership denial takes precedence over an otherwise-valid grant (membership gate evaluated before overrides)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "transaction.reverse" },
        membership: {
          kind: "found",
          membership: membership({
            status: "suspended",
            role: "manager",
            overrides: [
              {
                permissionId: "transaction.reverse",
                direction: "grant",
                businessId: "biz-a",
                membershipId: "mem-1",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("an override with an unrecognized/malformed direction value fails closed — it is NOT treated as absent, since it may have been an intended revocation corruption obscured (Codex review pass 4, PR #107)", () => {
    // Corrected after independent final security review: an earlier
    // version of this test asserted the opposite (ignored → role-default
    // allow), which Codex review pass 4 correctly identified as unsafe —
    // corrupt override state must deny, not silently fall through to
    // whatever the rest of the algorithm would otherwise decide.
    const decision = evaluateAuthorizationDecision(
      baseInput({
        membership: {
          kind: "found",
          membership: membership({
            role: "manager",
            overrides: [
              {
                permissionId: "customer.viewProtectedProfile",
                direction: "unknown-direction" as unknown as "grant",
                businessId: "biz-a",
                membershipId: "mem-1",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });
});

describe("evaluateAuthorizationDecision — fail-closed / integrity (Phase G, matrix §I)", () => {
  it("malformed stored membership (unrecognized role) → deny, AUTH_FORBIDDEN (§6.11, AD-4)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({ membership: { kind: "malformed" } }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("malformed stored business config → deny, AUTH_FORBIDDEN (§6.11, AD-4 — server-owned data-integrity failure, not a legitimate 'business is inactive' read)", () => {
    const decision = evaluateAuthorizationDecision(baseInput({ business: { kind: "malformed" } }));
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("transient business read failure → deny, TEMPORARY_UNAVAILABLE, never allow (§11)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({ business: { kind: "transient_failure" } }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("TEMPORARY_UNAVAILABLE");
  });

  it("transient membership read failure → deny, TEMPORARY_UNAVAILABLE, never allow (§11)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({ membership: { kind: "transient_failure" } }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("TEMPORARY_UNAVAILABLE");
  });

  it("non-string userId (untrusted external payload) → deny, AUTH_REQUIRED, never throws (Codex review pass 3, PR #107)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: {
          userId: 123 as unknown as string,
          businessId: "biz-a",
          permission: "customer.viewProtectedProfile",
        },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_REQUIRED");
  });

  it("non-string businessId (untrusted external payload) → deny, VALIDATION_FAILED, never throws (Codex review pass 3, PR #107)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: {
          userId: "user-1",
          businessId: { nested: "object" } as unknown as string,
          permission: "customer.viewProtectedProfile",
        },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("VALIDATION_FAILED");
  });

  it("no authenticated subject → deny, AUTH_REQUIRED", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "", businessId: "biz-a", permission: "customer.viewProtectedProfile" },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_REQUIRED");
  });

  it("missing businessId → deny, VALIDATION_FAILED", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "", permission: "customer.viewProtectedProfile" },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("VALIDATION_FAILED");
  });

  it("businessId containing a Firestore path separator ('/') is rejected as malformed context before any repository read is even relevant → deny, VALIDATION_FAILED (Codex review pass 6, PR #107)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: {
          userId: "user-1",
          businessId: "a/b",
          permission: "customer.viewProtectedProfile",
        },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("VALIDATION_FAILED");
  });
});

describe("evaluateAuthorizationDecision — cross-business isolation (Phase I, matrix §J)", () => {
  it("resolved membership businessId mismatching request businessId is never trusted (defence-in-depth, §5.6)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: {
          userId: "user-1",
          businessId: "biz-b",
          permission: "customer.viewProtectedProfile",
        },
        business: { kind: "found", business: { id: "biz-b", status: "active" } },
        membership: { kind: "found", membership: membership({ businessId: "biz-a" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("override stamped for another business is ignored, evaluated as absent (§5.6)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "transaction.reverse" },
        membership: {
          kind: "found",
          membership: membership({
            role: "staff",
            overrides: [
              {
                permissionId: "transaction.reverse",
                direction: "grant",
                businessId: "biz-b",
                membershipId: "mem-1",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
  });

  it("override stamped for another membershipId is ignored, evaluated as absent (§5.6)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "transaction.reverse" },
        membership: {
          kind: "found",
          membership: membership({
            role: "staff",
            overrides: [
              {
                permissionId: "transaction.reverse",
                direction: "grant",
                businessId: "biz-a",
                membershipId: "someone-elses-membership",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
  });
});

describe("evaluateAuthorizationDecision — adversarial: grant role-eligibility revalidation (Codex review, PR #107)", () => {
  it("does not honor a grant for a sensitive permission on a role the catalogue does not name as eligible (Staff granted staff.manage, catalogue names only Manager)", () => {
    // `createPermissionOverride` already rejects this combination at
    // construction time, but `EvaluationInput` is independently
    // constructible (repository-owned data may be malformed or from a
    // future/legacy write path) — the evaluator must not trust an
    // override's mere presence without revalidating catalogue eligibility.
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "staff.manage" },
        membership: {
          kind: "found",
          membership: membership({
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
        },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("does not honor a grant for a permission the catalogue marks as having no grant path at all (business.transferOwnership, explicitGrantRequired=false)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: {
          userId: "user-1",
          businessId: "biz-a",
          permission: "business.transferOwnership",
        },
        membership: {
          kind: "found",
          membership: membership({
            role: "manager",
            overrides: [
              {
                permissionId: "business.transferOwnership",
                direction: "grant",
                businessId: "biz-a",
                membershipId: "mem-1",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
  });

  it("does not honor a grant for staff.assignRole (no grant path at all, ENG-P2-004-CORR-002)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: {
          userId: "user-1",
          businessId: "biz-a",
          permission: "staff.assignRole",
        },
        membership: {
          kind: "found",
          membership: membership({
            role: "manager",
            overrides: [
              {
                permissionId: "staff.assignRole",
                direction: "grant",
                businessId: "biz-a",
                membershipId: "mem-1",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("still honors a grant for a sensitive permission on the catalogue-eligible role (Manager granted staff.manage)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "staff.manage" },
        membership: {
          kind: "found",
          membership: membership({
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
        },
      }),
    );
    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("explicit-grant");
  });

  it("an applicable but catalogue-ineligible grant fails closed even when the role would otherwise get the permission via role-default (Codex review pass 5, PR #107)", () => {
    // customer.viewProtectedProfile's catalogue-eligible grant role is
    // Staff; a Manager already holds it via role-default (§3.2 rows 7-8).
    // A grant override on the Manager's own membership is applicable but
    // ineligible — treating it as "absent" would let a corrupted/
    // misassigned override (e.g. one meant for a different membership,
    // or a corrupted intended revocation that became a syntactically
    // valid grant) silently coexist with an allow decision. Corrupt/
    // inconsistent override state must deny, matching the same principle
    // already applied to malformed override directions.
    const decision = evaluateAuthorizationDecision(
      baseInput({
        membership: {
          kind: "found",
          membership: membership({
            role: "manager",
            overrides: [
              {
                permissionId: "customer.viewProtectedProfile",
                direction: "grant",
                businessId: "biz-a",
                membershipId: "mem-1",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("an applicable grant for a well-formed but ungoverned permission fails closed (consistent treatment, defence-in-depth for a future non-sensitive baseline table)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "some.ungoverned" },
        membership: {
          kind: "found",
          membership: membership({
            role: "staff",
            overrides: [
              {
                permissionId: "some.ungoverned",
                direction: "grant",
                businessId: "biz-a",
                membershipId: "mem-1",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });
});

describe("evaluateAuthorizationDecision — adversarial: revoked-permission replay (§9 abuse #3)", () => {
  it("a permission granted then revoked at the same membership denies on replay, even though the grant record itself is still present", () => {
    // Models a client retrying a call after a revocation lands: both a
    // stale "grant" and the new "revoke" happen to be present on the
    // membership (e.g. an append-only override log) — revocation must
    // still win (§4.1.3, checked before grant).
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "transaction.reverse" },
        membership: {
          kind: "found",
          membership: membership({
            role: "manager",
            overrides: [
              {
                permissionId: "transaction.reverse",
                direction: "grant",
                businessId: "biz-a",
                membershipId: "mem-1",
              },
              {
                permissionId: "transaction.reverse",
                direction: "revoke",
                businessId: "biz-a",
                membershipId: "mem-1",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });
});

describe("evaluateAuthorizationDecision — resolved context on denied decisions (Codex review P2, PR #107)", () => {
  it("an explicit-revocation denial still carries the resolved role and permissionSource: n/a-denied", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        membership: {
          kind: "found",
          membership: membership({
            role: "manager",
            overrides: [
              {
                permissionId: "customer.viewProtectedProfile",
                direction: "revoke",
                businessId: "biz-a",
                membershipId: "mem-1",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.role).toBe("manager");
    expect(decision.permissionSource).toBe("n/a-denied");
  });

  it("a sensitive-permission-not-granted denial still carries the resolved role and permissionSource: n/a-denied", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "staff.manage" },
        membership: { kind: "found", membership: membership({ role: "manager" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.role).toBe("manager");
    expect(decision.permissionSource).toBe("n/a-denied");
  });

  it("a no-applicable-grant denial still carries the resolved role and permissionSource: n/a-denied", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "unknown.permission" },
        membership: { kind: "found", membership: membership({ role: "staff" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.role).toBe("staff");
    expect(decision.permissionSource).toBe("n/a-denied");
  });

  it("a pre-membership denial (e.g. business inactive) has no role, since no membership was resolved", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({ business: { kind: "found", business: { id: "biz-a", status: "suspended" } } }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.role).toBeUndefined();
  });
});

describe("evaluateAuthorizationDecision — determinism & purity (Phase K, matrix §K)", () => {
  it("identical input always produces a byte-identical decision, including evaluatedAt (genuine purity — evaluatedAt is a function of input.now, never the wall clock, Codex review pass 4, PR #107)", () => {
    const input = baseInput();
    const d1 = evaluateAuthorizationDecision(input);
    const d2 = evaluateAuthorizationDecision(input);
    expect(d1).toEqual(d2);
    expect(d1.evaluatedAt).toBe(FIXED_NOW);
  });

  it("does not mutate its input", () => {
    const input = baseInput();
    const snapshot = JSON.stringify(input);
    evaluateAuthorizationDecision(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe("evaluateAuthorizationDecision — every §11 outcome maps only to the closed 14-category taxonomy", () => {
  it("never returns an error category outside the closed set", () => {
    const closed = new Set([
      "AUTH_REQUIRED",
      "AUTH_FORBIDDEN",
      "ACCOUNT_SUSPENDED",
      "BUSINESS_INACTIVE",
      "SUBSCRIPTION_LIMIT_REACHED",
      "INVALID_STATE_TRANSITION",
      "PURCHASE_ALREADY_RESPONDED",
      "REWARD_NOT_AVAILABLE",
      "REWARD_ALREADY_REDEEMED",
      "IDEMPOTENCY_CONFLICT",
      "VALIDATION_FAILED",
      "RESOURCE_NOT_FOUND",
      "TEMPORARY_UNAVAILABLE",
      "INTEGRATION_FAILED",
    ]);
    const decision = evaluateAuthorizationDecision(
      baseInput({ membership: { kind: "not_found" } }),
    );
    if (decision.errorCategory) {
      expect(closed.has(decision.errorCategory)).toBe(true);
    }
  });
});

describe("evaluateAuthorizationDecision — adversarial: grants for unrecognized permission ids (Codex review pass 2, PR #107)", () => {
  it("does not honor a grant for a well-formed but ungoverned permission identifier (e.g. admin.superuser)", () => {
    // No governed non-sensitive permission registry exists yet (matching
    // the step-9 role-default gap documented above) — a grant can only be
    // honored against the one governed identifier space that exists, the
    // sensitive catalogue. Honoring a grant for any other well-formed
    // identifier would let a malformed/legacy/mistyped override authorize
    // a request against an identifier nothing actually governs.
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "admin.superuser" },
        membership: {
          kind: "found",
          membership: membership({
            role: "staff",
            overrides: [
              {
                permissionId: "admin.superuser",
                direction: "grant",
                businessId: "biz-a",
                membershipId: "mem-1",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });
});

describe("evaluateAuthorizationDecision — resolved context on inactive-membership denials (Codex review pass 2, PR #107)", () => {
  it.each(["invited", "suspended", "removed"] as const)(
    "a membership-not-active denial (status=%s) still carries the resolved role and permissionSource: n/a-denied",
    (status) => {
      const decision = evaluateAuthorizationDecision(
        baseInput({ membership: { kind: "found", membership: membership({ status }) } }),
      );
      expect(decision.allowed).toBe(false);
      expect(decision.role).toBe("manager");
      expect(decision.permissionSource).toBe("n/a-denied");
    },
  );

  it("a membership-business-mismatch denial still carries the resolved role and permissionSource: n/a-denied", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        membership: { kind: "found", membership: membership({ businessId: "biz-other" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.role).toBe("manager");
    expect(decision.permissionSource).toBe("n/a-denied");
  });
});

describe("evaluateAuthorizationDecision — business-context isolation on the business record itself (Codex review pass 2, PR #107)", () => {
  it("denies when a found business result's own id does not match the request's businessId, even if status is active and membership matches", () => {
    // Defence-in-depth mirroring the existing membership-mismatch check:
    // an independently constructed EvaluationInput could combine an
    // active Business-A result with a Business-B request (e.g. a stale
    // or misrouted repository read) — the evaluator must not trust a
    // business record whose own id doesn't match the requested context.
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: {
          userId: "user-1",
          businessId: "biz-b",
          permission: "customer.viewProtectedProfile",
        },
        business: { kind: "found", business: { id: "biz-a", status: "active" } },
        membership: {
          kind: "found",
          membership: membership({ businessId: "biz-b" }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });
});

// ---------------------------------------------------------------------------
// ENG-P2-004-CORR-001 — Ordinary Permission Catalogue correction.
// ---------------------------------------------------------------------------

function ordinaryInput(overrides: Partial<EvaluationInput> = {}): EvaluationInput {
  return baseInput({
    request: { userId: "user-1", businessId: "biz-a", permission: "business.updateProfile" },
    ...overrides,
  });
}

describe("evaluateAuthorizationDecision — ordinary permissions: business.updateProfile (FD-CORR-3/4/5)", () => {
  it("Owner + draft = allow", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        business: { kind: "found", business: { id: "biz-a", status: "draft" } },
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("role-default");
  });

  it("Owner + pending_verification = allow", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        business: { kind: "found", business: { id: "biz-a", status: "pending_verification" } },
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    expect(decision.allowed).toBe(true);
  });

  it("Owner + trial = allow", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        business: { kind: "found", business: { id: "biz-a", status: "trial" } },
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    expect(decision.allowed).toBe(true);
  });

  it("Owner + active = allow", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        business: { kind: "found", business: { id: "biz-a", status: "active" } },
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    expect(decision.allowed).toBe(true);
  });

  it("Owner + suspended = deny (administrator-imposed restriction, FD-CORR-5/7)", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        business: { kind: "found", business: { id: "biz-a", status: "suspended" } },
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("BUSINESS_INACTIVE");
  });

  it("Owner + expired = allow (expiry is not itself an enforcement state, FD-CORR-5/7)", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        business: { kind: "found", business: { id: "biz-a", status: "expired" } },
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    expect(decision.allowed).toBe(true);
  });

  it("Owner + closed = deny (terminal)", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        business: { kind: "found", business: { id: "biz-a", status: "closed" } },
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("BUSINESS_INACTIVE");
  });

  it("Owner + archived = deny (terminal)", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        business: { kind: "found", business: { id: "biz-a", status: "archived" } },
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("BUSINESS_INACTIVE");
  });

  it("Manager + active = deny (FD-CORR-4)", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        membership: { kind: "found", membership: membership({ role: "manager" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
    expect(decision.role).toBe("manager");
  });

  it("Staff + active = deny (FD-CORR-4)", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        membership: { kind: "found", membership: membership({ role: "staff" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
    expect(decision.role).toBe("staff");
  });
});

describe("evaluateAuthorizationDecision — ordinary permissions: businessBranch.updateProfile (identical treatment)", () => {
  it("Owner + draft = allow, Owner + suspended = deny, Manager/Staff = deny", () => {
    const allow = evaluateAuthorizationDecision(
      ordinaryInput({
        request: {
          userId: "user-1",
          businessId: "biz-a",
          permission: "businessBranch.updateProfile",
        },
        business: { kind: "found", business: { id: "biz-a", status: "draft" } },
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    expect(allow.allowed).toBe(true);

    const denySuspended = evaluateAuthorizationDecision(
      ordinaryInput({
        request: {
          userId: "user-1",
          businessId: "biz-a",
          permission: "businessBranch.updateProfile",
        },
        business: { kind: "found", business: { id: "biz-a", status: "suspended" } },
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    expect(denySuspended.allowed).toBe(false);

    for (const role of ["manager", "staff"] as const) {
      const denyRole = evaluateAuthorizationDecision(
        ordinaryInput({
          request: {
            userId: "user-1",
            businessId: "biz-a",
            permission: "businessBranch.updateProfile",
          },
          membership: { kind: "found", membership: membership({ role }) },
        }),
      );
      expect(denyRole.allowed).toBe(false);
    }
  });
});

describe("evaluateAuthorizationDecision — ordinary permission: business.submitForVerification narrowness (Phase H)", () => {
  it("Owner + draft = allow", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        request: {
          userId: "user-1",
          businessId: "biz-a",
          permission: "business.submitForVerification",
        },
        business: { kind: "found", business: { id: "biz-a", status: "draft" } },
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    expect(decision.allowed).toBe(true);
  });

  it("Manager + draft = deny", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        request: {
          userId: "user-1",
          businessId: "biz-a",
          permission: "business.submitForVerification",
        },
        business: { kind: "found", business: { id: "biz-a", status: "draft" } },
        membership: { kind: "found", membership: membership({ role: "manager" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
  });

  it("Staff + draft = deny", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        request: {
          userId: "user-1",
          businessId: "biz-a",
          permission: "business.submitForVerification",
        },
        business: { kind: "found", business: { id: "biz-a", status: "draft" } },
        membership: { kind: "found", membership: membership({ role: "staff" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
  });

  it.each([
    "pending_verification",
    "trial",
    "active",
    "suspended",
    "expired",
    "closed",
    "archived",
  ] as const)(
    "Owner + %s = deny — cannot authorize any transition other than draft→pending_verification, even for the Owner",
    (status) => {
      const decision = evaluateAuthorizationDecision(
        ordinaryInput({
          request: {
            userId: "user-1",
            businessId: "biz-a",
            permission: "business.submitForVerification",
          },
          business: { kind: "found", business: { id: "biz-a", status } },
          membership: { kind: "found", membership: membership({ role: "owner" }) },
        }),
      );
      expect(decision.allowed).toBe(false);
      expect(decision.errorCategory).toBe("BUSINESS_INACTIVE");
    },
  );
});

describe("evaluateAuthorizationDecision — ordinary permission: business.close (FD-CORR-5/7 exact matrix)", () => {
  it.each(["draft", "pending_verification", "trial", "active", "suspended", "expired"] as const)(
    "Owner + %s = allow",
    (status) => {
      const decision = evaluateAuthorizationDecision(
        ordinaryInput({
          request: { userId: "user-1", businessId: "biz-a", permission: "business.close" },
          business: { kind: "found", business: { id: "biz-a", status } },
          membership: { kind: "found", membership: membership({ role: "owner" }) },
        }),
      );
      expect(decision.allowed).toBe(true);
    },
  );

  it.each(["closed", "archived"] as const)("Owner + %s = deny (terminal)", (status) => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "business.close" },
        business: { kind: "found", business: { id: "biz-a", status } },
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("BUSINESS_INACTIVE");
  });

  it("Manager = deny, Staff = deny", () => {
    for (const role of ["manager", "staff"] as const) {
      const decision = evaluateAuthorizationDecision(
        ordinaryInput({
          request: { userId: "user-1", businessId: "biz-a", permission: "business.close" },
          membership: { kind: "found", membership: membership({ role }) },
        }),
      );
      expect(decision.allowed).toBe(false);
    }
  });
});

describe("evaluateAuthorizationDecision — unknown ordinary permission (Phase N/Phase F/K: fail-closed)", () => {
  it("an unconfigured permission id (well-formed, no catalogue entry) denies regardless of role or business status", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "purchase.record" },
        business: { kind: "found", business: { id: "biz-a", status: "draft" } },
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
  });
});

describe("evaluateAuthorizationDecision — ordinary permission + override: no grant/revoke support (FD-CORR-6, Phase K)", () => {
  it("a grant override on an ordinary permission does not bypass the Manager role default (Manager stays denied)", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        membership: {
          kind: "found",
          membership: membership({
            role: "manager",
            overrides: [
              {
                permissionId: "business.updateProfile",
                direction: "grant",
                businessId: "biz-a",
                membershipId: "mem-1",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
  });

  it("a grant override on an ordinary permission does not bypass the Staff role default either (Staff stays denied — ENG-P2-004-CORR-001 independent review, Phase G)", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        membership: {
          kind: "found",
          membership: membership({
            role: "staff",
            overrides: [
              {
                permissionId: "business.updateProfile",
                direction: "grant",
                businessId: "biz-a",
                membershipId: "mem-1",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
  });

  it("a revoke override on an ordinary permission does not block the Owner's role-default allow (overrides are simply not consulted for ordinary permissions)", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        membership: {
          kind: "found",
          membership: membership({
            role: "owner",
            overrides: [
              {
                permissionId: "business.updateProfile",
                direction: "revoke",
                businessId: "biz-a",
                membershipId: "mem-1",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("role-default");
  });

  it("a malformed-direction override on an ordinary permission does not affect the outcome either (ordinary permissions never inspect override state)", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        membership: {
          kind: "found",
          membership: membership({
            role: "owner",
            overrides: [
              {
                permissionId: "business.updateProfile",
                direction: "not-a-real-direction" as never,
                businessId: "biz-a",
                membershipId: "mem-1",
              },
            ],
          }),
        },
      }),
    );
    expect(decision.allowed).toBe(true);
  });
});

describe("evaluateAuthorizationDecision — ordinary permission interaction cases (Phase O)", () => {
  it("ordinary permission + malformed membership → deny, AUTH_FORBIDDEN", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({ membership: { kind: "malformed" } }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("ordinary permission + inactive (invited) membership → deny, AUTH_FORBIDDEN", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        membership: { kind: "found", membership: membership({ status: "invited", role: "owner" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("ordinary permission + wrong business (membership businessId mismatch) → deny, AUTH_FORBIDDEN", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        membership: {
          kind: "found",
          membership: membership({ businessId: "biz-other", role: "owner" }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("ordinary permission + malformed business → deny, AUTH_FORBIDDEN", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({ business: { kind: "malformed" } }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("ordinary permission + unsupported (ineligible) Business status → deny, BUSINESS_INACTIVE", () => {
    const decision = evaluateAuthorizationDecision(
      ordinaryInput({
        business: { kind: "found", business: { id: "biz-a", status: "suspended" } },
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("BUSINESS_INACTIVE");
  });

  it("sensitive permission + draft → still denies BUSINESS_INACTIVE (non-regression: the per-permission gate did not loosen the sensitive gate)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: { userId: "user-1", businessId: "biz-a", permission: "staff.manage" },
        business: { kind: "found", business: { id: "biz-a", status: "draft" } },
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("BUSINESS_INACTIVE");
  });

  it("sensitive permission + pending_verification → still denies BUSINESS_INACTIVE (non-regression)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({
        request: {
          userId: "user-1",
          businessId: "biz-a",
          permission: "customer.viewProtectedProfile",
        },
        business: { kind: "found", business: { id: "biz-a", status: "pending_verification" } },
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("BUSINESS_INACTIVE");
  });
});
