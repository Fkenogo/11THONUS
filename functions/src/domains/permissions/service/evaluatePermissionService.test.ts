/**
 * Regression test for a Codex review finding (P2, review pass 3, PR #107):
 * `request.userId?.trim()` / `request.businessId?.trim()` only guard
 * against `null`/`undefined` — a non-string value from an unvalidated
 * external payload (e.g. `businessId: 123`, a caller not enforcing the
 * `AuthorizationRequest` TypeScript type at the network boundary) would
 * throw a `TypeError` at `.trim()` rather than resolving to the required
 * fail-closed decision. Uses a mock `Firestore` — no real reads should
 * ever be attempted for a request this malformed.
 */

import { describe, it, expect, vi } from "vitest";
import { evaluatePermission } from "./evaluatePermissionService";
import type { Firestore } from "firebase-admin/firestore";
import type { AuthorizationRequest } from "../evaluator/types";

function dbThatShouldNeverBeCalled(): Firestore {
  const fail = vi.fn(() => {
    throw new Error("repository should not be reached for a malformed request");
  });
  return { collection: fail } as unknown as Firestore;
}

describe("evaluatePermission — malformed request field types (Codex review pass 3, PR #107)", () => {
  it("resolves to a deny decision (never throws) for a non-string userId", async () => {
    const malformedRequest = {
      userId: 123,
      businessId: "biz-a",
      permission: "customer.viewProtectedProfile",
    } as unknown as AuthorizationRequest;

    const decision = await evaluatePermission(dbThatShouldNeverBeCalled(), malformedRequest);

    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_REQUIRED");
  });

  it("resolves to a deny decision (never throws) for a non-string businessId", async () => {
    const malformedRequest = {
      userId: "user-1",
      businessId: { nested: "object" },
      permission: "customer.viewProtectedProfile",
    } as unknown as AuthorizationRequest;

    const decision = await evaluatePermission(dbThatShouldNeverBeCalled(), malformedRequest);

    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("VALIDATION_FAILED");
  });
});
