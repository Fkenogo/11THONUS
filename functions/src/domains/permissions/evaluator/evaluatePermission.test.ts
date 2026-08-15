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

function baseInput(overrides: Partial<EvaluationInput> = {}): EvaluationInput {
  return {
    request: { userId: "user-1", businessId: "biz-a", permission: "customer.viewProtectedProfile" },
    business: { kind: "found", business: ACTIVE_BUSINESS },
    membership: { kind: "found", membership: membership() },
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

  it("row 2: business not found → deny, BUSINESS_INACTIVE (§4.1.1/§6.11)", () => {
    const decision = evaluateAuthorizationDecision(baseInput({ business: { kind: "not_found" } }));
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("BUSINESS_INACTIVE");
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
});

describe("evaluateAuthorizationDecision — fail-closed / integrity (Phase G, matrix §I)", () => {
  it("malformed stored membership (unrecognized role) → deny, AUTH_FORBIDDEN (§6.11, AD-4)", () => {
    const decision = evaluateAuthorizationDecision(
      baseInput({ membership: { kind: "malformed" } }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("malformed stored business config → deny, BUSINESS_INACTIVE (§6.11, AD-4)", () => {
    const decision = evaluateAuthorizationDecision(baseInput({ business: { kind: "malformed" } }));
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("BUSINESS_INACTIVE");
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
  it("identical input always produces an identical decision (excluding evaluatedAt)", () => {
    const input = baseInput();
    const d1 = evaluateAuthorizationDecision(input);
    const d2 = evaluateAuthorizationDecision(input);
    expect(d1.allowed).toBe(d2.allowed);
    expect(d1.reasonCode).toBe(d2.reasonCode);
    expect(d1.permissionSource).toBe(d2.permissionSource);
    expect(d1.errorCategory).toBe(d2.errorCategory);
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
    expect(decision.errorCategory).toBe("BUSINESS_INACTIVE");
  });
});
