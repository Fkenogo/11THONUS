import { describe, expect, it, vi } from "vitest";
import {
  BusinessApiError,
  isRetryableBusinessErrorCode,
  toCallWithActor,
} from "./businessCallableClient";

describe("isRetryableBusinessErrorCode", () => {
  it("treats unavailable and timeout as retryable (same unchanged action, keep the idempotency key)", () => {
    expect(isRetryableBusinessErrorCode("unavailable")).toBe(true);
    expect(isRetryableBusinessErrorCode("timeout")).toBe(true);
  });

  it("treats every other code as a definitive, non-retryable outcome", () => {
    expect(isRetryableBusinessErrorCode("validation_failed")).toBe(false);
    expect(isRetryableBusinessErrorCode("auth_forbidden")).toBe(false);
    expect(isRetryableBusinessErrorCode("conflict")).toBe(false);
    expect(isRetryableBusinessErrorCode("failed")).toBe(false);
  });
});

describe("toCallWithActor", () => {
  it("attaches rawToken and referenceType from the actor to the payload", async () => {
    const callable = vi.fn(async () => ({ data: { ok: true } }));
    const call = toCallWithActor(callable);

    await call(
      { getIdToken: async () => "token-123", referenceType: "google_sign_in" },
      { businessId: "b-1" },
    );

    expect(callable).toHaveBeenCalledWith({
      businessId: "b-1",
      rawToken: "token-123",
      referenceType: "google_sign_in",
    });
  });

  it("returns the callable's data on success", async () => {
    const call = toCallWithActor(async () => ({ data: { businessId: "b-1" } }));

    const result = await call({ getIdToken: async () => "t", referenceType: "email" }, {});

    expect(result).toEqual({ businessId: "b-1" });
  });

  it("normalizes a FirebaseError code into a BusinessApiError, never leaking the server message", async () => {
    const call = toCallWithActor(async () => {
      throw Object.assign(new Error("internal stack trace with secrets"), {
        code: "functions/invalid-argument",
      });
    });

    await expect(
      call({ getIdToken: async () => "t", referenceType: "email" }, {}),
    ).rejects.toBeInstanceOf(BusinessApiError);
    await expect(
      call({ getIdToken: async () => "t", referenceType: "email" }, {}),
    ).rejects.toMatchObject({ code: "validation_failed" });
  });
});
