/**
 * Permission evaluator — `purchase.businessReview` decision matrix
 * (`EA-BL-001-CORR-002-BR`, `DEC-PROD-015`).
 *
 * Pure-evaluator tests (no Firestore). Proves: Owner floor, Manager default + revoke + re-grant,
 * Staff STRUCTURAL ineligibility (a fabricated/stale Staff grant is not honoured — the evaluator
 * revalidates eligibility instead of trusting stored override presence), and non-member deny
 * (Platform Administrator and Customer reduce to this: no platform path, no Business membership).
 */

import { describe, it, expect } from "vitest";
import { evaluateAuthorizationDecision } from "./evaluatePermission";
import type { EvaluationInput, EvaluationBusinessMembership, EvaluationBusiness } from "./types";
import type { Role } from "../models/role";

const PERMISSION = "purchase.businessReview";
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

describe("purchase.businessReview — Owner and Manager", () => {
  it("Owner is allowed through the Owner floor, even against a stored revoke", () => {
    const d = decide({ role: "owner" });
    expect(d.allowed).toBe(true);
    expect(d.permissionSource).toBe("owner-floor");
    expect(decide({ role: "owner", overrides: [revoke()] }).allowed).toBe(true);
  });

  it("Manager is allowed by default; revoke denies; re-grant allows", () => {
    expect(decide({ role: "manager" })).toMatchObject({
      allowed: true,
      permissionSource: "role-default",
    });
    const revoked = decide({ role: "manager", overrides: [revoke()] });
    expect(revoked.allowed).toBe(false);
    expect(revoked.reasonCode).toBe("EXPLICIT_REVOCATION");
    expect(decide({ role: "manager", overrides: [grant()] })).toMatchObject({
      allowed: true,
      permissionSource: "explicit-grant",
    });
  });
});

describe("purchase.businessReview — Staff is structurally ineligible", () => {
  it("Staff is denied by default", () => {
    const d = decide({ role: "staff" });
    expect(d.allowed).toBe(false);
    expect(d.errorCategory).toBe("AUTH_FORBIDDEN");
  });

  it("a fabricated/stale persisted Staff grant is NOT honoured (evaluator-layer independent of the constructor)", () => {
    const d = decide({ role: "staff", overrides: [grant()] });
    expect(d.allowed).toBe(false);
    expect(d.reasonCode).toBe("GRANT_NOT_HONORED");
  });

  it("a Staff member cannot gain authority through any override direction", () => {
    expect(decide({ role: "staff", overrides: [revoke()] }).allowed).toBe(false);
  });
});

describe("purchase.businessReview — lifecycle and non-members", () => {
  it("non-members (Platform Administrator by status alone, Customers) are denied", () => {
    expect(decide({ role: "owner", membershipKind: "not_found" }).allowed).toBe(false);
  });

  it("an inactive membership is denied", () => {
    expect(decide({ role: "owner", membershipStatus: "suspended" }).allowed).toBe(false);
  });

  it("a commercially suspended Business stays fail-closed (no redemption-style default-allow)", () => {
    expect(decide({ role: "owner", businessStatus: "suspended" }).allowed).toBe(false);
  });
});
