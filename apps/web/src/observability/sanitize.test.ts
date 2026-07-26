import { describe, expect, it } from "vitest";
import { sanitize, REDACTED } from "./sanitize";

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
