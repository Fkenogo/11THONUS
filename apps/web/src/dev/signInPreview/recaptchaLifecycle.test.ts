import { describe, expect, it, vi } from "vitest";
import { createManagedRecaptcha } from "./recaptchaLifecycle";

function fakes() {
  const cleared: string[] = [];
  const removed: HTMLElement[] = [];
  let n = 0;
  const nodes: HTMLElement[] = [];
  return {
    cleared,
    removed,
    nodes,
    deps: {
      createVerifier: (node: HTMLElement) => {
        const id = `v${++n}`;
        (node as HTMLElement & { _id?: string })._id = id;
        return { id, clear: () => cleared.push(id) };
      },
      createNode: () => {
        const node = document.createElement("div");
        nodes.push(node);
        return node;
      },
      removeNode: (node: HTMLElement) => removed.push(node),
    },
  };
}

describe("createManagedRecaptcha", () => {
  it("creates a fresh node and verifier on first request", () => {
    const f = fakes();
    const managed = createManagedRecaptcha(f.deps);

    const v = managed.getVerifier();

    expect(v.id).toBe("v1");
    expect(f.nodes).toHaveLength(1);
    expect(f.cleared).toEqual([]);
    expect(f.removed).toEqual([]);
  });

  it("clears the previous verifier and removes its node before creating the next", () => {
    const f = fakes();
    const managed = createManagedRecaptcha(f.deps);

    managed.getVerifier();
    const first = f.nodes[0];
    const v2 = managed.getVerifier();

    expect(v2.id).toBe("v2");
    expect(f.cleared).toEqual(["v1"]); // previous cleared exactly once
    expect(f.removed).toEqual([first]); // previous node removed
    expect(f.nodes).toHaveLength(2);
  });

  it("tears down the current verifier and node on teardown", () => {
    const f = fakes();
    const managed = createManagedRecaptcha(f.deps);

    managed.getVerifier();
    managed.teardown();

    expect(f.cleared).toEqual(["v1"]);
    expect(f.removed).toEqual([f.nodes[0]]);
  });

  it("teardown is a no-op when nothing has been created", () => {
    const f = fakes();
    const managed = createManagedRecaptcha(f.deps);

    expect(() => managed.teardown()).not.toThrow();
    expect(f.cleared).toEqual([]);
    expect(f.removed).toEqual([]);
  });

  it("teardown is idempotent (no double clear/remove)", () => {
    const f = fakes();
    const managed = createManagedRecaptcha(f.deps);

    managed.getVerifier();
    managed.teardown();
    managed.teardown();

    expect(f.cleared).toEqual(["v1"]);
    expect(f.removed).toHaveLength(1);
  });

  it("a clear() that throws never blocks node removal or state reset", () => {
    const f = fakes();
    const deps = {
      ...f.deps,
      createVerifier: () => ({
        id: "boom",
        clear: vi.fn(() => {
          throw new Error("x");
        }),
      }),
    };
    const managed = createManagedRecaptcha(deps);

    managed.getVerifier();
    expect(() => managed.teardown()).not.toThrow();
    expect(f.removed).toHaveLength(1); // node still removed despite clear() throwing
  });
});
