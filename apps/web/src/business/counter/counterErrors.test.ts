import { describe, expect, it } from "vitest";
import { BusinessApiError } from "../api/businessCallableClient";
import { classifyCounterError, isUncertainCounterError } from "./counterErrors";

describe("classifyCounterError", () => {
  it.each([
    ["customer_artifact_invalid_or_not_found", "customer_artifact"],
    ["programme_unavailable", "programme"],
    ["qualifying_item_invalid", "item"],
    ["quantity_invalid", "quantity"],
    ["generic_validation_failed", "generic"],
  ] as const)("validation reason %s → %s", (reason, kind) => {
    expect(classifyCounterError(new BusinessApiError("validation_failed", reason))).toBe(kind);
  });

  it("an unknown or missing reason is the generic message (never an invented cause)", () => {
    expect(classifyCounterError(new BusinessApiError("validation_failed", "something_else"))).toBe(
      "generic",
    );
    expect(classifyCounterError(new BusinessApiError("validation_failed", "constructor"))).toBe(
      "generic",
    );
    expect(classifyCounterError(new BusinessApiError("validation_failed"))).toBe("generic");
  });

  it("only network/uncertain outcomes are retryable with the same intent", () => {
    expect(classifyCounterError(new BusinessApiError("unavailable"))).toBe("uncertain");
    expect(classifyCounterError(new BusinessApiError("timeout"))).toBe("uncertain");
    for (const code of [
      "auth_required",
      "auth_forbidden",
      "not_found",
      "conflict",
      "failed",
    ] as const) {
      expect(isUncertainCounterError(classifyCounterError(new BusinessApiError(code)))).toBe(false);
    }
    expect(isUncertainCounterError("uncertain")).toBe(true);
  });

  it("session and authorisation failures are their own kinds", () => {
    expect(classifyCounterError(new BusinessApiError("auth_required"))).toBe("session");
    expect(classifyCounterError(new BusinessApiError("auth_forbidden"))).toBe("forbidden");
    expect(classifyCounterError(new Error("boom"))).toBe("generic");
    expect(classifyCounterError(undefined)).toBe("generic");
  });
});
