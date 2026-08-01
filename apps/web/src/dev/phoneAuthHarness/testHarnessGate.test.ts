import { describe, expect, it } from "vitest";
import { isTestHarnessBuildEnabled } from "./testHarnessGate";

const APPROVED = {
  testHarnessFlag: "true",
  mode: "test-harness",
  projectId: "eleventh-on-us-dev",
};

describe("isTestHarnessBuildEnabled", () => {
  it("is enabled only for the exact approved flag + mode + project combination", () => {
    expect(isTestHarnessBuildEnabled(APPROVED)).toBe(true);
  });

  it("fails closed for an ordinary production build (no flag, ordinary mode)", () => {
    expect(
      isTestHarnessBuildEnabled({
        testHarnessFlag: undefined,
        mode: "production",
        projectId: "eleventh-on-us-dev",
      }),
    ).toBe(false);
  });

  it("fails closed for an ordinary dev-server build (no flag, dev mode)", () => {
    expect(
      isTestHarnessBuildEnabled({
        testHarnessFlag: undefined,
        mode: "development",
        projectId: "eleventh-on-us-dev",
      }),
    ).toBe(false);
  });

  it("fails closed when the flag is missing entirely", () => {
    expect(isTestHarnessBuildEnabled({ ...APPROVED, testHarnessFlag: undefined })).toBe(false);
  });

  it("fails closed when the flag is an empty string", () => {
    expect(isTestHarnessBuildEnabled({ ...APPROVED, testHarnessFlag: "" })).toBe(false);
  });

  it('fails closed when the flag is the literal string "false"', () => {
    expect(isTestHarnessBuildEnabled({ ...APPROVED, testHarnessFlag: "false" })).toBe(false);
  });

  it("fails closed for malformed/truthy-but-not-exact flag values", () => {
    expect(isTestHarnessBuildEnabled({ ...APPROVED, testHarnessFlag: "1" })).toBe(false);
    expect(isTestHarnessBuildEnabled({ ...APPROVED, testHarnessFlag: "yes" })).toBe(false);
    expect(isTestHarnessBuildEnabled({ ...APPROVED, testHarnessFlag: "TRUE" })).toBe(false);
  });

  it("fails closed for the wrong project ID even with the flag and mode correct", () => {
    expect(isTestHarnessBuildEnabled({ ...APPROVED, projectId: "eleventh-on-us" })).toBe(false);
    expect(isTestHarnessBuildEnabled({ ...APPROVED, projectId: "eleventh-on-us-staging" })).toBe(
      false,
    );
    expect(isTestHarnessBuildEnabled({ ...APPROVED, projectId: "demo-11thonus" })).toBe(false);
    expect(isTestHarnessBuildEnabled({ ...APPROVED, projectId: undefined })).toBe(false);
  });

  it("fails closed for an unknown/missing project ID", () => {
    expect(isTestHarnessBuildEnabled({ ...APPROVED, projectId: "" })).toBe(false);
  });

  it("fails closed for the wrong Vite mode even with the flag and project correct", () => {
    expect(isTestHarnessBuildEnabled({ ...APPROVED, mode: "production" })).toBe(false);
    expect(isTestHarnessBuildEnabled({ ...APPROVED, mode: "development" })).toBe(false);
    expect(isTestHarnessBuildEnabled({ ...APPROVED, mode: undefined })).toBe(false);
  });
});
