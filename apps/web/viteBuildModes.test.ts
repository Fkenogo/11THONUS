import { describe, expect, it } from "vitest";
import {
  FOUNDER_QA_PREVIEW_MODE,
  SIGN_IN_PREVIEW_MODE,
  TEST_HARNESS_MODE,
  htmlEntryForMode,
  includePwaForMode,
  isIsolatedPreviewMode,
  isTemporaryPreviewMode,
} from "./viteBuildModes";

describe("htmlEntryForMode", () => {
  it("returns the dedicated HTML entry for each isolated preview mode", () => {
    expect(htmlEntryForMode(TEST_HARNESS_MODE)).toBe("harness.html");
    expect(htmlEntryForMode(SIGN_IN_PREVIEW_MODE)).toBe("sign-in-preview.html");
  });

  it("returns undefined for the founder-qa-preview mode (ordinary index.html, /business routes stay present)", () => {
    expect(htmlEntryForMode(FOUNDER_QA_PREVIEW_MODE)).toBeUndefined();
  });

  it("returns undefined for ordinary modes", () => {
    expect(htmlEntryForMode("production")).toBeUndefined();
    expect(htmlEntryForMode("development")).toBeUndefined();
  });
});

describe("isIsolatedPreviewMode", () => {
  it("is true only for the structurally-isolated preview modes", () => {
    expect(isIsolatedPreviewMode(TEST_HARNESS_MODE)).toBe(true);
    expect(isIsolatedPreviewMode(SIGN_IN_PREVIEW_MODE)).toBe(true);
  });

  it("is false for founder-qa-preview and ordinary modes", () => {
    expect(isIsolatedPreviewMode(FOUNDER_QA_PREVIEW_MODE)).toBe(false);
    expect(isIsolatedPreviewMode("production")).toBe(false);
    expect(isIsolatedPreviewMode("development")).toBe(false);
  });
});

describe("isTemporaryPreviewMode", () => {
  it("is true for every isolated preview mode and for founder-qa-preview", () => {
    expect(isTemporaryPreviewMode(TEST_HARNESS_MODE)).toBe(true);
    expect(isTemporaryPreviewMode(SIGN_IN_PREVIEW_MODE)).toBe(true);
    expect(isTemporaryPreviewMode(FOUNDER_QA_PREVIEW_MODE)).toBe(true);
  });

  it("is false for ordinary modes", () => {
    expect(isTemporaryPreviewMode("production")).toBe(false);
    expect(isTemporaryPreviewMode("development")).toBe(false);
  });
});

describe("includePwaForMode", () => {
  it("excludes the PWA service worker for every temporary preview mode, including founder-qa-preview", () => {
    expect(includePwaForMode(TEST_HARNESS_MODE)).toBe(false);
    expect(includePwaForMode(SIGN_IN_PREVIEW_MODE)).toBe(false);
    expect(includePwaForMode(FOUNDER_QA_PREVIEW_MODE)).toBe(false);
  });

  it("includes the PWA service worker for ordinary builds", () => {
    expect(includePwaForMode("production")).toBe(true);
    expect(includePwaForMode("development")).toBe(true);
  });
});
