/**
 * Permission evaluator — Qualifying Item permission (`PLATFORM-BASELINE-013A.2`,
 * `DEC-LOY-017`). Covers PB-012 §15 cases Y, Z, AA and the evaluator half of
 * AC. Kept in its own file (mirroring `evaluatePermission.corr003.test.ts`)
 * so the pre-existing evaluator test file carries zero diff.
 */

import { describe, expect, it } from "vitest";
import { evaluateAuthorizationDecision } from "./evaluatePermission";
import type { EvaluationBusinessMembership, EvaluationInput } from "./types";

const FIXED_NOW = new Date("2026-09-19T00:00:00.000Z");

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

function input(permission: string, overrides: Partial<EvaluationInput> = {}): EvaluationInput {
  return {
    request: { userId: "user-1", businessId: "biz-a", permission },
    business: { kind: "found", business: { id: "biz-a", status: "active" } },
    membership: { kind: "found", membership: membership() },
    now: FIXED_NOW,
    ...overrides,
  };
}

const MANAGE = "qualifyingItem.manage";

describe("evaluateAuthorizationDecision — qualifyingItem.manage role matrix (test Y)", () => {
  it.each(["owner", "manager"] as const)("%s + active = allow (role-default)", (role) => {
    const decision = evaluateAuthorizationDecision(
      input(MANAGE, { membership: { kind: "found", membership: membership({ role }) } }),
    );
    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("role-default");
    expect(decision.reasonCode).toBe("ROLE_DEFAULT_ALLOW");
    expect(decision.role).toBe(role);
  });

  it.each(["owner", "manager"] as const)("%s + trial = allow", (role) => {
    const decision = evaluateAuthorizationDecision(
      input(MANAGE, {
        business: { kind: "found", business: { id: "biz-a", status: "trial" } },
        membership: { kind: "found", membership: membership({ role }) },
      }),
    );
    expect(decision.allowed).toBe(true);
  });

  it("staff + active = deny (NO_APPLICABLE_GRANT / AUTH_FORBIDDEN)", () => {
    const decision = evaluateAuthorizationDecision(
      input(MANAGE, { membership: { kind: "found", membership: membership({ role: "staff" }) } }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe("NO_APPLICABLE_GRANT");
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
    expect(decision.role).toBe("staff");
  });

  it.each(["draft", "pending_verification", "suspended", "expired", "closed", "archived"])(
    "owner + %s Business = deny BUSINESS_INACTIVE (only trial/active are eligible)",
    (status) => {
      const decision = evaluateAuthorizationDecision(
        input(MANAGE, {
          business: { kind: "found", business: { id: "biz-a", status } as never },
          membership: { kind: "found", membership: membership({ role: "owner" }) },
        }),
      );
      expect(decision.allowed).toBe(false);
      expect(decision.errorCategory).toBe("BUSINESS_INACTIVE");
    },
  );

  it("a suspended membership is denied even for an Owner", () => {
    const decision = evaluateAuthorizationDecision(
      input(MANAGE, {
        membership: {
          kind: "found",
          membership: membership({ role: "owner", status: "suspended" }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
  });

  it("a grant override never lets Staff manage Qualifying Items (no explicit-grant path)", () => {
    const decision = evaluateAuthorizationDecision(
      input(MANAGE, {
        membership: {
          kind: "found",
          membership: membership({
            role: "staff",
            overrides: [
              {
                permissionId: MANAGE,
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

  it("a revoke override is never consulted (role default still applies, mirroring the other domain catalogues)", () => {
    const decision = evaluateAuthorizationDecision(
      input(MANAGE, {
        membership: {
          kind: "found",
          membership: membership({
            role: "manager",
            overrides: [
              {
                permissionId: MANAGE,
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

  it("cross-Business membership (Business B membership presented for Business A) is denied", () => {
    const decision = evaluateAuthorizationDecision(
      input(MANAGE, {
        membership: {
          kind: "found",
          membership: membership({ role: "owner", businessId: "biz-b" }),
        },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe("MEMBERSHIP_BUSINESS_MISMATCH");
  });

  it("no membership at all is denied MEMBERSHIP_NOT_FOUND", () => {
    const decision = evaluateAuthorizationDecision(
      input(MANAGE, { membership: { kind: "not_found" } }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe("MEMBERSHIP_NOT_FOUND");
  });

  it("a sibling id under the same namespace is not governed and fails closed", () => {
    const decision = evaluateAuthorizationDecision(
      input("qualifyingItem.view", {
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });
});

// Test Z — the regression gate against the tempting shortcut of widening
// `rewardProgram.manage` instead of adding a distinct permission.
describe("evaluateAuthorizationDecision — rewardProgram.manage is NOT widened (test Z)", () => {
  it("Manager is still denied rewardProgram.manage while allowed qualifyingItem.manage", () => {
    const managerMembership = {
      kind: "found" as const,
      membership: membership({ role: "manager" }),
    };
    const rewardProgram = evaluateAuthorizationDecision(
      input("rewardProgram.manage", { membership: managerMembership }),
    );
    const qualifyingItem = evaluateAuthorizationDecision(
      input(MANAGE, { membership: managerMembership }),
    );
    expect(rewardProgram.allowed).toBe(false);
    expect(rewardProgram.errorCategory).toBe("AUTH_FORBIDDEN");
    expect(qualifyingItem.allowed).toBe(true);
  });

  it("Owner still holds rewardProgram.manage; Staff holds neither", () => {
    const owner = evaluateAuthorizationDecision(
      input("rewardProgram.manage", {
        membership: { kind: "found", membership: membership({ role: "owner" }) },
      }),
    );
    const staff = evaluateAuthorizationDecision(
      input("rewardProgram.manage", {
        membership: { kind: "found", membership: membership({ role: "staff" }) },
      }),
    );
    expect(owner.allowed).toBe(true);
    expect(staff.allowed).toBe(false);
  });
});

// Test AA — Platform Administrator boundary. The evaluator's input carries
// no platform-administrator concept at all: authority is derived solely from
// an active Business membership role. A subject with no membership in the
// Business is denied regardless of who they are elsewhere on the platform.
describe("evaluateAuthorizationDecision — Platform Administrator boundary (test AA)", () => {
  it("a platform-administrator-labelled subject with no Business membership is denied", () => {
    const decision = evaluateAuthorizationDecision({
      request: { userId: "platform-admin-1", businessId: "biz-a", permission: MANAGE },
      business: { kind: "found", business: { id: "biz-a", status: "active" } },
      membership: { kind: "not_found" },
      now: FIXED_NOW,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe("MEMBERSHIP_NOT_FOUND");
  });

  it("an extra platform-administrator flag smuggled into the request grants nothing", () => {
    const request = {
      userId: "platform-admin-1",
      businessId: "biz-a",
      permission: MANAGE,
      isPlatformAdministrator: true,
      platformAdministrator: true,
    } as never;
    const decision = evaluateAuthorizationDecision({
      request,
      business: { kind: "found", business: { id: "biz-a", status: "active" } },
      membership: { kind: "not_found" },
      now: FIXED_NOW,
    });
    expect(decision.allowed).toBe(false);
  });
});
