import { describe, expect, it } from "vitest";
import { sanitizeException } from "./sanitizeException";
import { REDACTED } from "./sanitize";

describe("sanitizeException", () => {
  it("preserves useful non-sensitive name, message, and stack information for a plain Error", () => {
    const error = new Error("purchase.record failed for correlationId short-id-1");
    const result = sanitizeException(error);

    expect(result.kind).toBe("error");
    expect(result.name).toBe("Error");
    expect(result.message).toBe("purchase.record failed for correlationId short-id-1");
    expect(result.stack).toContain("Error");
  });

  it("redacts a sensitive value embedded in Error.message", () => {
    const secret = "sk_live_" + "a".repeat(24);
    const error = new Error(`request failed, token was ${secret}`);
    const result = sanitizeException(error);

    expect(result.message).not.toContain(secret);
    expect(result.message).toContain(REDACTED);
  });

  it("redacts a sensitive value embedded in the stack text", () => {
    const secret = "b".repeat(32);
    const error = new Error("boom");
    error.stack = `Error: boom\n    at handler (src/x.ts:1:1) token=${secret}`;
    const result = sanitizeException(error);

    expect(result.stack).not.toContain(secret);
    expect(result.stack).toContain("at handler (src/x.ts:1:1)");
  });

  it("sanitizes custom own properties on an Error instance", () => {
    const error = new Error("boom") as Error & { apiKey?: string; code?: string };
    error.apiKey = "c".repeat(32);
    error.code = "PURCHASE_FAILED";
    const result = sanitizeException(error);

    expect((result.properties as Record<string, unknown>).apiKey).toBe(REDACTED);
    expect((result.properties as Record<string, unknown>).code).toBe("PURCHASE_FAILED");
  });

  it("wraps and sanitizes a non-Error thrown string", () => {
    const result = sanitizeException("plain string failure");
    expect(result.kind).toBe("thrown-value");
    expect((result.properties as Record<string, unknown>).value).toBe("plain string failure");
  });

  it("wraps and sanitizes a non-Error thrown object, redacting sensitive keys", () => {
    const result = sanitizeException({ reason: "bad input", password: "hunter2" });
    const value = (result.properties as Record<string, unknown>).value as Record<string, unknown>;
    expect(value.reason).toBe("bad input");
    expect(value.password).toBe(REDACTED);
  });

  it("bounds a chain of causes rather than recursing without limit", () => {
    const root = new Error("root cause");
    const middle = new Error("middle", { cause: root });
    const top = new Error("top", { cause: middle });

    const result = sanitizeException(top);
    expect(result.cause?.message).toBe("middle");
    expect(result.cause?.cause?.message).toBe("root cause");
  });

  it("sanitizes a sensitive value inside a nested cause message", () => {
    const secret = "d".repeat(32);
    const root = new Error(`db failure token=${secret}`);
    const top = new Error("top", { cause: root });

    const result = sanitizeException(top);
    expect(result.cause?.message).not.toContain(secret);
  });

  it("does not crash on a circular cause chain", () => {
    const a = new Error("a") as Error & { cause?: unknown };
    const b = new Error("b") as Error & { cause?: unknown };
    a.cause = b;
    b.cause = a;

    expect(() => sanitizeException(a)).not.toThrow();
  });

  it("does not crash on a circular custom property", () => {
    const error = new Error("boom") as Error & { self?: unknown };
    error.self = error;

    expect(() => sanitizeException(error)).not.toThrow();
  });

  it("never throws on an unusual thrown value (null, undefined, number)", () => {
    expect(() => sanitizeException(null)).not.toThrow();
    expect(() => sanitizeException(undefined)).not.toThrow();
    expect(() => sanitizeException(42)).not.toThrow();
  });
});
