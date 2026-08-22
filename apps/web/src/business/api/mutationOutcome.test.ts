import { describe, expect, it } from "vitest";
import { BusinessApiError } from "./businessCallableClient";
import { unwrapMutationResult } from "./mutationOutcome";

describe("unwrapMutationResult", () => {
  it("returns the payload when the mutation outcome is executed", () => {
    expect(
      unwrapMutationResult({ outcome: "executed", decision: {}, result: { businessId: "b-1" } }),
    ).toEqual({ businessId: "b-1" });
  });

  it("throws a forbidden BusinessApiError when the outcome is denied", () => {
    expect(() => unwrapMutationResult({ outcome: "denied", decision: {} })).toThrow(
      BusinessApiError,
    );
    try {
      unwrapMutationResult({ outcome: "denied", decision: {} });
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BusinessApiError);
      expect((error as BusinessApiError).code).toBe("auth_forbidden");
    }
  });

  it("returns undefined for a duplicate outcome (idempotent replay, already applied)", () => {
    expect(unwrapMutationResult({ outcome: "duplicate" })).toBeUndefined();
  });

  it("throws a retryable conflict BusinessApiError when a concurrent call is already in progress", () => {
    try {
      unwrapMutationResult({ outcome: "in_progress" });
      throw new Error("expected throw");
    } catch (error) {
      expect(error).toBeInstanceOf(BusinessApiError);
      expect((error as BusinessApiError).code).toBe("conflict");
    }
  });
});
