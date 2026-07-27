import { describe, expect, it } from "vitest";
import { sanitize, sanitizeText, REDACTED } from "./sanitize";

describe("sanitize", () => {
  it("redacts a top-level sensitive key", () => {
    const result = sanitize({ password: "hunter2", username: "alice" }) as Record<string, unknown>;
    expect(result.password).toBe(REDACTED);
    expect(result.username).toBe("alice");
  });

  it("redacts common sensitive key variants case-insensitively", () => {
    const input = {
      accessToken: "abc",
      refresh_token: "def",
      Authorization: "Bearer xyz",
      cookie: "session=1",
      apiKey: "k-123",
      cardNumber: "4111111111111111",
      cvv: "123",
      email: "person@example.com",
    };
    const result = sanitize(input) as Record<string, unknown>;
    for (const key of Object.keys(input)) {
      expect(result[key]).toBe(REDACTED);
    }
  });

  it("redacts sensitive fields nested inside a request-body-shaped object", () => {
    const input = {
      requestBody: {
        customerId: "cust_123",
        payment: { cardNumber: "4111111111111111", cvv: "123" },
      },
    };
    const result = sanitize(input) as Record<string, unknown>;
    const requestBody = result.requestBody as Record<string, unknown>;
    const payment = requestBody.payment as Record<string, unknown>;
    expect(requestBody.customerId).toBe("cust_123");
    expect(payment.cardNumber).toBe(REDACTED);
    expect(payment.cvv).toBe(REDACTED);
  });

  it("handles arrays, redacting sensitive fields inside array elements", () => {
    const input = { items: [{ token: "abc", label: "first" }, { label: "second" }] };
    const result = sanitize(input) as { items: Array<Record<string, unknown>> };
    expect(result.items[0].token).toBe(REDACTED);
    expect(result.items[0].label).toBe("first");
    expect(result.items[1].label).toBe("second");
  });

  it("redacts a JWT-shaped string value even under a non-obvious key name", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
    const result = sanitize({ note: jwt }) as Record<string, unknown>;
    expect(result.note).toBe(REDACTED);
  });

  it("does not crash on a circular reference and does not recurse forever", () => {
    const circular: Record<string, unknown> = { name: "a" };
    circular.self = circular;
    expect(() => sanitize(circular)).not.toThrow();
  });

  it("does not crash on an unusually deep structure", () => {
    let deep: Record<string, unknown> = { value: "bottom" };
    for (let i = 0; i < 50; i++) {
      deep = { nested: deep };
    }
    expect(() => sanitize(deep)).not.toThrow();
  });

  it("does not mutate the caller's original object", () => {
    const input = { password: "hunter2", nested: { token: "abc" } };
    const snapshot = JSON.parse(JSON.stringify(input));
    sanitize(input);
    expect(input).toEqual(snapshot);
  });

  it("preserves non-sensitive structure and primitive values unchanged", () => {
    const input = { operation: "purchase.record", durationMs: 42, ok: true, tags: ["a", "b"] };
    expect(sanitize(input)).toEqual(input);
  });

  it("handles null and primitive top-level values without throwing", () => {
    expect(() => sanitize(null)).not.toThrow();
    expect(() => sanitize("plain string")).not.toThrow();
    expect(() => sanitize(42)).not.toThrow();
    expect(() => sanitize(undefined)).not.toThrow();
  });
});

describe("sanitizeText", () => {
  it("redacts a JWT-shaped substring embedded within a larger sentence", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
    const text = sanitizeText(`request failed, token was ${jwt} at the time`);
    expect(text).not.toContain(jwt);
    expect(text).toContain(REDACTED);
    expect(text).toContain("request failed");
    expect(text).toContain("at the time");
  });

  it("redacts an authorization-header-like substring", () => {
    const text = sanitizeText("sending Authorization: Bearer abc123xyz456secretvalue to the API");
    expect(text).not.toContain("abc123xyz456secretvalue");
    expect(text).toContain(REDACTED);
  });

  it("redacts a cookie-like substring", () => {
    const text = sanitizeText("failed with cookie: session_id=abcdef123456; other=1");
    expect(text).not.toContain("abcdef123456");
  });

  it("redacts a payment-card-like digit run", () => {
    const text = sanitizeText("charge declined for card 4111 1111 1111 1111 please retry");
    expect(text).not.toContain("4111 1111 1111 1111");
    expect(text).toContain(REDACTED);
  });

  it("redacts a long token/API-key-shaped substring", () => {
    const text = sanitizeText(`config loaded with key ${"a".repeat(32)} ready`);
    expect(text).not.toContain("a".repeat(32));
    expect(text).toContain(REDACTED);
  });

  it("preserves ordinary prose and short identifiers unchanged", () => {
    const text = sanitizeText("purchase.record failed for correlationId short-id-1 at line 42");
    expect(text).toBe("purchase.record failed for correlationId short-id-1 at line 42");
  });

  it("preserves stack-trace structure (file paths, line numbers, function names) while redacting an embedded secret", () => {
    const secret = "sk_live_" + "b".repeat(24);
    const stack = `Error: boom\n    at handleSubmit (src/app/checkout.ts:42:17)\n    at token=${secret}`;
    const text = sanitizeText(stack)!;
    expect(text).toContain("at handleSubmit (src/app/checkout.ts:42:17)");
    expect(text).not.toContain(secret);
  });

  it("returns undefined when given undefined, and an unchanged empty string for empty input", () => {
    expect(sanitizeText(undefined)).toBeUndefined();
    expect(sanitizeText("")).toBe("");
  });

  it("never throws on adversarial input", () => {
    expect(() => sanitizeText("a".repeat(5000))).not.toThrow();
    expect(() => sanitizeText("\n\n\n...===...")).not.toThrow();
  });
});
