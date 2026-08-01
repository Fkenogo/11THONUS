import { describe, expect, it } from "vitest";
import { isHarnessEnabled } from "./harnessGate";

describe("isHarnessEnabled", () => {
  it("is enabled when the dev flag is true", () => {
    expect(isHarnessEnabled(true)).toBe(true);
  });

  it("fails closed when the dev flag is false", () => {
    expect(isHarnessEnabled(false)).toBe(false);
  });

  it("fails closed for any non-strict-true value at runtime", () => {
    // Runtime robustness check: a caller could pass a truthy non-boolean
    // (e.g. a stray `1`) if `import.meta.env.DEV` were ever misconfigured
    // upstream. The gate must not coerce truthiness — only exact `true`
    // enables the harness.
    expect(isHarnessEnabled(1 as unknown as boolean)).toBe(false);
  });
});
