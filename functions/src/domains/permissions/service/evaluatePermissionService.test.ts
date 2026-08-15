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

describe("evaluatePermission — request object itself missing/null (Codex review pass 5, PR #107)", () => {
  it.each([null, undefined, "not-an-object", 42])(
    "resolves to a deny decision (never throws) when request is %p",
    async (badRequest) => {
      const decision = await evaluatePermission(
        dbThatShouldNeverBeCalled(),
        badRequest as unknown as AuthorizationRequest,
      );

      expect(decision.allowed).toBe(false);
      expect(decision.errorCategory).toBe("AUTH_REQUIRED");
    },
  );
});

describe("evaluatePermission — businessId containing a Firestore path separator (Codex review pass 6, PR #107)", () => {
  it("never reaches the repository for a businessId containing '/' — resolves to VALIDATION_FAILED", async () => {
    const decision = await evaluatePermission(dbThatShouldNeverBeCalled(), {
      userId: "user-1",
      businessId: "a/b",
      permission: "customer.viewProtectedProfile",
    });

    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("VALIDATION_FAILED");
  });
});

describe("evaluatePermission — short-circuit blank context/subject before any repository read (Codex review pass 7, PR #107)", () => {
  // Uses a spy that records calls instead of throwing, so the assertion
  // genuinely proves non-invocation — `dbThatShouldNeverBeCalled()`'s
  // throw-and-catch masks this class of defect, since the repository's
  // own try/catch swallows the throw and the pure evaluator's downstream
  // empty-field check produces the same final decision regardless of
  // whether the (wasted) repository call happened.
  function dbWithSpy() {
    const collectionSpy = vi.fn(() => ({
      doc: vi.fn(() => ({ get: vi.fn().mockResolvedValue({ exists: false }) })),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({ empty: true, size: 0, docs: [] }),
    }));
    return { collectionSpy, db: { collection: collectionSpy } as unknown as Firestore };
  }

  it("never reaches the repository when businessId trims to an empty string", async () => {
    const { collectionSpy, db } = dbWithSpy();

    const decision = await evaluatePermission(db, {
      userId: "user-1",
      businessId: "   ",
      permission: "customer.viewProtectedProfile",
    });

    expect(collectionSpy).not.toHaveBeenCalled();
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("VALIDATION_FAILED");
  });

  it("never reaches the repository when userId is blank but businessId is well-formed", async () => {
    const { collectionSpy, db } = dbWithSpy();

    const decision = await evaluatePermission(db, {
      userId: "   ",
      businessId: "biz-a",
      permission: "customer.viewProtectedProfile",
    });

    expect(collectionSpy).not.toHaveBeenCalled();
    expect(decision.allowed).toBe(false);
    expect(decision.errorCategory).toBe("AUTH_REQUIRED");
  });
});
