import { describe, expect, it } from "vitest";
import { generateCorrelationId, resolveCorrelationId } from "./correlationId";

describe("generateCorrelationId", () => {
  it("returns a non-empty string", () => {
    expect(generateCorrelationId().length).toBeGreaterThan(0);
  });

  it("returns a different value on each call", () => {
    expect(generateCorrelationId()).not.toBe(generateCorrelationId());
  });
});

describe("resolveCorrelationId", () => {
  it("returns the existing correlation ID unchanged when one is supplied", () => {
    expect(resolveCorrelationId("existing-corr-id")).toBe("existing-corr-id");
  });

  it("generates a new correlation ID when none is supplied", () => {
    const resolved = resolveCorrelationId(undefined);

    expect(resolved.length).toBeGreaterThan(0);
  });

  it("never regenerates an existing correlation ID across repeated calls", () => {
    const first = resolveCorrelationId("existing-corr-id");
    const second = resolveCorrelationId(first);

    expect(second).toBe("existing-corr-id");
  });
});
