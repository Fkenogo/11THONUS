import { describe, expect, it } from "vitest";
import { isFounderQaPreviewBuildEnabled } from "./founderQaPreviewGate";

const APPROVED = {
  previewFlag: "true",
  mode: "founder-qa-preview",
  projectId: "eleventh-on-us-dev",
};

describe("isFounderQaPreviewBuildEnabled", () => {
  it("is enabled only for the exact approved flag + mode + project combination", () => {
    expect(isFounderQaPreviewBuildEnabled(APPROVED)).toBe(true);
  });

  it("fails closed for an ordinary production build (no flag, ordinary mode)", () => {
    expect(
      isFounderQaPreviewBuildEnabled({
        previewFlag: undefined,
        mode: "production",
        projectId: "eleventh-on-us-dev",
      }),
    ).toBe(false);
  });

  it("fails closed for an ordinary dev-server build (no flag, dev mode)", () => {
    expect(
      isFounderQaPreviewBuildEnabled({
        previewFlag: undefined,
        mode: "development",
        projectId: "eleventh-on-us-dev",
      }),
    ).toBe(false);
  });

  it("fails closed when the flag is missing entirely", () => {
    expect(isFounderQaPreviewBuildEnabled({ ...APPROVED, previewFlag: undefined })).toBe(false);
  });

  it("fails closed when the flag is an empty string", () => {
    expect(isFounderQaPreviewBuildEnabled({ ...APPROVED, previewFlag: "" })).toBe(false);
  });

  it('fails closed when the flag is the literal string "false"', () => {
    expect(isFounderQaPreviewBuildEnabled({ ...APPROVED, previewFlag: "false" })).toBe(false);
  });

  it("fails closed for malformed/truthy-but-not-exact flag values", () => {
    expect(isFounderQaPreviewBuildEnabled({ ...APPROVED, previewFlag: "1" })).toBe(false);
    expect(isFounderQaPreviewBuildEnabled({ ...APPROVED, previewFlag: "yes" })).toBe(false);
    expect(isFounderQaPreviewBuildEnabled({ ...APPROVED, previewFlag: "TRUE" })).toBe(false);
  });

  it("fails closed for the wrong project ID even with the flag and mode correct", () => {
    expect(isFounderQaPreviewBuildEnabled({ ...APPROVED, projectId: "eleventh-on-us" })).toBe(
      false,
    );
    expect(
      isFounderQaPreviewBuildEnabled({ ...APPROVED, projectId: "eleventh-on-us-staging" }),
    ).toBe(false);
    expect(isFounderQaPreviewBuildEnabled({ ...APPROVED, projectId: "demo-11thonus" })).toBe(false);
    expect(isFounderQaPreviewBuildEnabled({ ...APPROVED, projectId: undefined })).toBe(false);
    expect(isFounderQaPreviewBuildEnabled({ ...APPROVED, projectId: "" })).toBe(false);
  });

  it("fails closed for the wrong Vite mode even with the flag and project correct", () => {
    expect(isFounderQaPreviewBuildEnabled({ ...APPROVED, mode: "production" })).toBe(false);
    expect(isFounderQaPreviewBuildEnabled({ ...APPROVED, mode: "development" })).toBe(false);
    expect(isFounderQaPreviewBuildEnabled({ ...APPROVED, mode: "sign-in-preview" })).toBe(false);
    expect(isFounderQaPreviewBuildEnabled({ ...APPROVED, mode: "test-harness" })).toBe(false);
    expect(isFounderQaPreviewBuildEnabled({ ...APPROVED, mode: undefined })).toBe(false);
  });
});
