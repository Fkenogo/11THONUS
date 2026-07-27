import { beforeEach, describe, expect, it } from "vitest";
import {
  beginWorkflow,
  clearCorrelationId,
  endWorkflow,
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

  it("Stage 2: beginWorkflow always mints a fresh id, unlike resolveCorrelationId's reuse-if-present behaviour", () => {
    const existing = resolveCorrelationId();
    const fresh = beginWorkflow();
    expect(fresh).not.toBe(existing);
    expect(getCurrentCorrelationId()).toBe(fresh);
  });

  it("Stage 2: beginWorkflow generates a different id for each unrelated workflow", () => {
    const first = beginWorkflow();
    const second = beginWorkflow();
    expect(second).not.toBe(first);
  });

  it("Stage 2: endWorkflow clears the id only when it is still the active one", () => {
    const id = beginWorkflow();
    endWorkflow(id);
    expect(getCurrentCorrelationId()).toBeUndefined();
  });

  it("Stage 2: endWorkflow is a safe no-op when the id is no longer active", () => {
    const first = beginWorkflow();
    endWorkflow(first);
    setCorrelationId("unrelated-id");
    endWorkflow(first);
    expect(getCurrentCorrelationId()).toBe("unrelated-id");
  });

  it("Stage 2: a later-started concurrent workflow is not clobbered by an earlier workflow's delayed end (compare-and-clear)", () => {
    const workflowA = beginWorkflow();
    const workflowB = beginWorkflow();
    expect(getCurrentCorrelationId()).toBe(workflowB);

    // Workflow A's async operation finishes late and ends itself — this
    // must not erroneously clear workflow B's still-active id.
    endWorkflow(workflowA);
    expect(getCurrentCorrelationId()).toBe(workflowB);

    endWorkflow(workflowB);
    expect(getCurrentCorrelationId()).toBeUndefined();
  });
});
