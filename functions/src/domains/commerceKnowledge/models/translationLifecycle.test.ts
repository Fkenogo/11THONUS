import { describe, expect, it } from "vitest";
import {
  TRANSLATION_LIFECYCLE_STATUSES,
  isTranslationLifecycleStatus,
  isValidTranslationLifecycleTransition,
} from "./translationLifecycle";

describe("TRANSLATION_LIFECYCLE_STATUSES", () => {
  it("is exactly the three TRD10 §10.7.2 values, unchanged", () => {
    expect(TRANSLATION_LIFECYCLE_STATUSES).toEqual(["draft", "reviewed", "published"]);
  });
});

describe("isTranslationLifecycleStatus", () => {
  it("accepts each governed value", () => {
    for (const status of TRANSLATION_LIFECYCLE_STATUSES) {
      expect(isTranslationLifecycleStatus(status)).toBe(true);
    }
  });

  it("rejects an undocumented value, including the canonical-lifecycle's own values", () => {
    expect(isTranslationLifecycleStatus("active")).toBe(false);
    expect(isTranslationLifecycleStatus("in_review")).toBe(false);
    expect(isTranslationLifecycleStatus("")).toBe(false);
  });
});

describe("isValidTranslationLifecycleTransition — §9.4 matrix", () => {
  it("draft -> reviewed is allowed", () => {
    expect(isValidTranslationLifecycleTransition("draft", "reviewed")).toBe(true);
  });

  it("reviewed -> published is allowed", () => {
    expect(isValidTranslationLifecycleTransition("reviewed", "published")).toBe(true);
  });

  it("reviewed -> draft is allowed (governed correction cycle)", () => {
    expect(isValidTranslationLifecycleTransition("reviewed", "draft")).toBe(true);
  });

  it("published -> draft is allowed (governed correction cycle, same document)", () => {
    expect(isValidTranslationLifecycleTransition("published", "draft")).toBe(true);
  });

  it("rejects draft -> published (must pass through reviewed)", () => {
    expect(isValidTranslationLifecycleTransition("draft", "published")).toBe(false);
  });

  it("rejects published -> reviewed (not a recorded transition)", () => {
    expect(isValidTranslationLifecycleTransition("published", "reviewed")).toBe(false);
  });
});
