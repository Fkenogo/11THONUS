/**
 * Permission evaluator — `redemption.confirm` decision matrix
 * (`CAPABILITY-6-REDEMPTION-ENGINE-001`, `DEC-LOY-018`).
 *
 * Pure-evaluator tests only (same discipline as
 * `evaluatePermission.test.ts`): no Firestore, no repository I/O. Proves
 * the DEC-LOY-018 authority model falls out of the EXISTING sensitive
 * evaluation path with no redemption-specific branch:
 * Owner floor (irrevocable), Manager default + revoke + re-grant, Staff
 * default-deny + grant + revoke, suspended-Business allow (DEC-LOY-011),
 * terminal-Business deny, and non-member deny (Platform Administrator and
 * Customer reduce to this — the evaluator has no platform path and
 * Customers hold no Business membership).
 */

import { describe, it, expect } from "vitest";
import { evaluateAuthorizationDecision } from "./evaluatePermission";
import type { EvaluationInput, EvaluationBusinessMembership, EvaluationBusiness } from "./types";
import type { Role } from "../models/role";

const PERMISSION = "redemption.confirm";
const FIXED_NOW = new Date("2026-09-27T00:00:00.000Z");

function business(status: EvaluationBusiness["status"] = "active"): EvaluationBusiness {
  return { id: "biz-a", status };
}

function member(params: {
  role: Role;
  status?: EvaluationBusinessMembership["status"];
  overrides?: EvaluationBusinessMembership["overrides"];
}): EvaluationBusinessMembership {
  return {
    id: "mem-1",
    userId: "user-1",
    businessId: "biz-a",
    role: params.role,
    status: params.status ?? "active",
    overrides: params.overrides ?? [],
  };
}

function grant(businessId = "biz-a", membershipId = "mem-1") {
  return {
    permissionId: PERMISSION,
    direction: "grant" as const,
    businessId,
    membershipId,
  };
}

function revoke(businessId = "biz-a", membershipId = "mem-1") {
  return {
    permissionId: PERMISSION,
    direction: "revoke" as const,
    businessId,
    membershipId,
  };
}

function decide(params: {
  role: Role;
  businessStatus?: EvaluationBusiness["status"];
  membershipStatus?: EvaluationBusinessMembership["status"];
  overrides?: EvaluationBusinessMembership["overrides"];
  membershipKind?: "found" | "not_found";
}): ReturnType<typeof evaluateAuthorizationDecision> {
  const input: EvaluationInput = {
    request: { userId: "user-1", businessId: "biz-a", permission: PERMISSION },
    business: { kind: "found", business: business(params.businessStatus ?? "active") },
    membership:
      params.membershipKind === "not_found"
        ? { kind: "not_found" }
        : {
            kind: "found",
            membership: member({
              role: params.role,
              status: params.membershipStatus,
              overrides: params.overrides,
            }),
          },
    now: FIXED_NOW,
  };
  return evaluateAuthorizationDecision(input);
}

describe("redemption.confirm — Owner authority (DEC-LOY-018 D-2)", () => {
  it("Owner is allowed by default through the Owner floor", () => {
    const decision = decide({ role: "owner" });
    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("owner-floor");
    expect(decision.reasonCode).toBe("OWNER_FLOOR");
  });

  it("Owner floor survives an (unconstructible, here independently-built) revoke override — ordinary overrides cannot remove Owner authority", () => {
    const decision = decide({ role: "owner", overrides: [revoke()] });
    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("owner-floor");
  });
});

describe("redemption.confirm — Manager authority (default, revoke, re-grant)", () => {
  it("Manager is allowed by default (PRD01 matrix row, preserved)", () => {
    const decision = decide({ role: "manager" });
    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("role-default");
  });

  it("explicitly revoked Manager is denied (revoke wins over the default)", () => {
    const decision = decide({ role: "manager", overrides: [revoke()] });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe("EXPLICIT_REVOCATION");
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("re-granted Manager (revoke replaced by a grant, the override store's single-record semantics) is allowed via explicit grant", () => {
    const decision = decide({ role: "manager", overrides: [grant()] });
    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("explicit-grant");
    expect(decision.reasonCode).toBe("EXPLICIT_GRANT");
  });
});

describe("redemption.confirm — Staff authority (default-deny, grant, revoke)", () => {
  it("Staff is denied by default (no default, no grant)", () => {
    const decision = decide({ role: "staff" });
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("explicitly granted Staff is allowed (delegation without promotion)", () => {
    const decision = decide({ role: "staff", overrides: [grant()] });
    expect(decision.allowed).toBe(true);
    expect(decision.permissionSource).toBe("explicit-grant");
  });

  it("revoked Staff grant is denied", () => {
    const decision = decide({ role: "staff", overrides: [revoke()] });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe("EXPLICIT_REVOCATION");
  });
});

describe("redemption.confirm — generalisation regression (existing permissions unchanged)", () => {
  it("a Staff grant of a Manager-only permission is still not honored (fail closed, not fallen through)", () => {
    const input: EvaluationInput = {
      request: { userId: "user-1", businessId: "biz-a", permission: "staff.manage" },
      business: { kind: "found", business: business("active") },
      membership: {
        kind: "found",
        membership: member({
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
      now: FIXED_NOW,
    };
    const decision = evaluateAuthorizationDecision(input);
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe("GRANT_NOT_HONORED");
  });

  it("a Manager grant of a Staff-only permission is still not honored (fail closed)", () => {
    const input: EvaluationInput = {
      request: {
        userId: "user-1",
        businessId: "biz-a",
        permission: "customer.viewProtectedProfile",
      },
      business: { kind: "found", business: business("active") },
      membership: {
        kind: "found",
        membership: member({
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
      now: FIXED_NOW,
    };
    const decision = evaluateAuthorizationDecision(input);
    // A stray ineligible grant fails CLOSED (GRANT_NOT_HONORED) rather than
    // falling through to the Manager role default — the PR #107 correction,
    // preserved unchanged by the generalisation.
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe("GRANT_NOT_HONORED");
  });
});

describe("redemption.confirm — Business lifecycle (DEC-LOY-011)", () => {
  it.each(["trial", "active", "suspended"] as const)(
    "Business status=%s keeps Manager confirmation eligible (default-redeemable)",
    (status) => {
      expect(decide({ role: "manager", businessStatus: status }).allowed).toBe(true);
    },
  );

  it.each(["draft", "pending_verification", "expired", "closed", "archived"] as const)(
    "Business status=%s denies confirmation (fail closed, BUSINESS_INACTIVE)",
    (status) => {
      const decision = decide({ role: "manager", businessStatus: status });
      expect(decision.allowed).toBe(false);
      expect(decision.errorCategory).toBe("BUSINESS_INACTIVE");
    },
  );
});

describe("redemption.confirm — membership and isolation", () => {
  it("no Business membership (Platform Administrator without one, Customer, stranger) is denied", () => {
    const decision = decide({ role: "manager", membershipKind: "not_found" });
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it.each(["invited", "suspended", "removed"] as const)(
    "inactive membership (%s) is denied even with a grant",
    (status) => {
      const decision = decide({ role: "staff", membershipStatus: status, overrides: [grant()] });
      expect(decision.allowed).toBe(false);
      expect(decision.errorCategory).toBe("AUTH_FORBIDDEN");
    },
  );

  it("an override stamped for another Business is ignored (cross-business isolation)", () => {
    const decision = decide({ role: "staff", overrides: [grant("biz-other")] });
    expect(decision.allowed).toBe(false);
  });
});
