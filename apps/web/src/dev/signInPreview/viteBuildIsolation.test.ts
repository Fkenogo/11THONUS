/**
 * Build-isolation regression coverage (AUTH-PREVIEW-READINESS-001).
 *
 * Proves — through the pure build-mode helper `vite.config.ts` consumes — that
 * the isolated `sign-in-preview` build has its own dedicated HTML entry
 * (structurally excluding the ordinary app's `index.html` module graph, i.e.
 * every customer/admin route), omits the PWA service worker, and that neither
 * the ordinary production build nor the existing `test-harness` build is
 * disturbed.
 */
import { describe, expect, it } from "vitest";
import {
  htmlEntryForMode,
  includePwaForMode,
  isIsolatedPreviewMode,
  SIGN_IN_PREVIEW_MODE,
  TEST_HARNESS_MODE,
} from "../../../viteBuildModes";

describe("sign-in-preview build isolation", () => {
  it("uses the dedicated sign-in-preview.html entry (no ordinary index.html app graph)", () => {
    expect(htmlEntryForMode(SIGN_IN_PREVIEW_MODE)).toBe("sign-in-preview.html");
  });

  it("omits the PWA service worker from the preview build", () => {
    expect(includePwaForMode(SIGN_IN_PREVIEW_MODE)).toBe(false);
  });

  it("treats sign-in-preview as an isolated build", () => {
    expect(isIsolatedPreviewMode(SIGN_IN_PREVIEW_MODE)).toBe(true);
  });

  it("leaves the ordinary production build untouched (default entry, PWA present)", () => {
    expect(htmlEntryForMode("production")).toBeUndefined();
    expect(includePwaForMode("production")).toBe(true);
    expect(isIsolatedPreviewMode("production")).toBe(false);
  });

  it("leaves the ordinary development build untouched (default entry, PWA present)", () => {
    expect(htmlEntryForMode("development")).toBeUndefined();
    expect(includePwaForMode("development")).toBe(true);
  });

  it("preserves the existing test-harness build entry and its PWA omission", () => {
    expect(htmlEntryForMode(TEST_HARNESS_MODE)).toBe("harness.html");
    expect(includePwaForMode(TEST_HARNESS_MODE)).toBe(false);
    expect(isIsolatedPreviewMode(TEST_HARNESS_MODE)).toBe(true);
  });
});
