import { describe, expect, it } from "vitest";
import { isSignInPreviewBuildEnabled } from "./signInPreviewGate";

const APPROVED = {
  previewFlag: "true",
  mode: "sign-in-preview",
  projectId: "eleventh-on-us-dev",
};

describe("isSignInPreviewBuildEnabled", () => {
  it("is enabled only for the exact approved flag + mode + project combination", () => {
    expect(isSignInPreviewBuildEnabled(APPROVED)).toBe(true);
  });

  it("fails closed for an ordinary production build (no flag, ordinary mode)", () => {
    expect(
      isSignInPreviewBuildEnabled({
        previewFlag: undefined,
        mode: "production",
        projectId: "eleventh-on-us-dev",
      }),
    ).toBe(false);
  });

  it("fails closed for an ordinary dev-server build (no flag, dev mode)", () => {
    expect(
      isSignInPreviewBuildEnabled({
        previewFlag: undefined,
        mode: "development",
        projectId: "eleventh-on-us-dev",
      }),
    ).toBe(false);
  });

  it("fails closed when the flag is missing entirely", () => {
    expect(isSignInPreviewBuildEnabled({ ...APPROVED, previewFlag: undefined })).toBe(false);
  });

  it("fails closed when the flag is an empty string", () => {
    expect(isSignInPreviewBuildEnabled({ ...APPROVED, previewFlag: "" })).toBe(false);
  });

  it('fails closed when the flag is the literal string "false"', () => {
    expect(isSignInPreviewBuildEnabled({ ...APPROVED, previewFlag: "false" })).toBe(false);
  });

  it("fails closed for malformed/truthy-but-not-exact flag values", () => {
    expect(isSignInPreviewBuildEnabled({ ...APPROVED, previewFlag: "1" })).toBe(false);
    expect(isSignInPreviewBuildEnabled({ ...APPROVED, previewFlag: "yes" })).toBe(false);
    expect(isSignInPreviewBuildEnabled({ ...APPROVED, previewFlag: "TRUE" })).toBe(false);
  });

  it("fails closed for the wrong project ID even with the flag and mode correct", () => {
    expect(isSignInPreviewBuildEnabled({ ...APPROVED, projectId: "eleventh-on-us" })).toBe(false);
    expect(isSignInPreviewBuildEnabled({ ...APPROVED, projectId: "eleventh-on-us-staging" })).toBe(
      false,
    );
    expect(isSignInPreviewBuildEnabled({ ...APPROVED, projectId: "demo-11thonus" })).toBe(false);
    expect(isSignInPreviewBuildEnabled({ ...APPROVED, projectId: undefined })).toBe(false);
    expect(isSignInPreviewBuildEnabled({ ...APPROVED, projectId: "" })).toBe(false);
  });

  it("fails closed for the wrong Vite mode even with the flag and project correct", () => {
    expect(isSignInPreviewBuildEnabled({ ...APPROVED, mode: "production" })).toBe(false);
    expect(isSignInPreviewBuildEnabled({ ...APPROVED, mode: "development" })).toBe(false);
    expect(isSignInPreviewBuildEnabled({ ...APPROVED, mode: "test-harness" })).toBe(false);
    expect(isSignInPreviewBuildEnabled({ ...APPROVED, mode: undefined })).toBe(false);
  });
});
