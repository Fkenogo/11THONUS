import { beforeEach, describe, expect, it } from "vitest";
import {
  clearCorrelationId,
  getCurrentCorrelationId,
  resolveCorrelationId,
  setCorrelationId,
} from "./correlationContext";

describe("correlationContext", () => {
  beforeEach(() => {
    clearCorrelationId();
  });

  it("has no correlation ID until one is resolved or set", () => {
    expect(getCurrentCorrelationId()).toBeUndefined();
  });

  it("resolveCorrelationId generates and stores a new id when none exists", () => {
    const id = resolveCorrelationId();
    expect(id.length).toBeGreaterThan(0);
    expect(getCurrentCorrelationId()).toBe(id);
  });

  it("resolveCorrelationId never regenerates an already-stored id", () => {
    const first = resolveCorrelationId();
    const second = resolveCorrelationId();
    expect(second).toBe(first);
  });

  it("resolveCorrelationId adopts and keeps an explicitly supplied id (e.g. from a backend response)", () => {
    const adopted = resolveCorrelationId("backend-issued-id");
    expect(adopted).toBe("backend-issued-id");
    expect(getCurrentCorrelationId()).toBe("backend-issued-id");
    // A later call with no argument must keep the adopted id, not replace it.
    expect(resolveCorrelationId()).toBe("backend-issued-id");
  });

  it("setCorrelationId overwrites the current id explicitly", () => {
    setCorrelationId("explicit-id");
    expect(getCurrentCorrelationId()).toBe("explicit-id");
  });

  it("clearCorrelationId removes the current id", () => {
    setCorrelationId("some-id");
    clearCorrelationId();
    expect(getCurrentCorrelationId()).toBeUndefined();
  });

  it("generates a different id on each fresh workflow (after clearing)", () => {
    const first = resolveCorrelationId();
    clearCorrelationId();
    const second = resolveCorrelationId();
    expect(second).not.toBe(first);
  });
});
