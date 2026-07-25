import { describe, expect, it } from "vitest";
import { createPlatformError } from "./platformError";

describe("createPlatformError", () => {
  it("builds a response with the category as code", () => {
    const error = createPlatformError("VALIDATION_FAILED", "errors.validationFailed", "corr-1");

    expect(error).toEqual({
      code: "VALIDATION_FAILED",
      messageKey: "errors.validationFailed",
      correlationId: "corr-1",
      retryable: false,
    });
  });

  it("defaults retryable to false when not specified", () => {
    const error = createPlatformError("AUTH_REQUIRED", "errors.authRequired", "corr-2");

    expect(error.retryable).toBe(false);
  });

  it("honors an explicit retryable value", () => {
    const error = createPlatformError(
      "TEMPORARY_UNAVAILABLE",
      "errors.temporaryUnavailable",
      "corr-3",
      {
        retryable: true,
      },
    );

    expect(error.retryable).toBe(true);
  });

  it("includes fieldErrors only when provided", () => {
    const withoutFieldErrors = createPlatformError(
      "VALIDATION_FAILED",
      "errors.validationFailed",
      "corr-4",
    );
    const withFieldErrors = createPlatformError(
      "VALIDATION_FAILED",
      "errors.validationFailed",
      "corr-5",
      {
        fieldErrors: [{ field: "email", code: "REQUIRED", messageKey: "errors.emailRequired" }],
      },
    );

    expect(withoutFieldErrors).not.toHaveProperty("fieldErrors");
    expect(withFieldErrors.fieldErrors).toEqual([
      { field: "email", code: "REQUIRED", messageKey: "errors.emailRequired" },
    ]);
  });
});
