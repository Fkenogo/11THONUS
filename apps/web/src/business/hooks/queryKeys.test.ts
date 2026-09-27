import { describe, expect, it } from "vitest";
import { businessQueryKeys } from "./queryKeys";

/**
 * Review finding (PR #255): `staleTime: Infinity` (`businessQueries.ts`)
 * means React Query only refetches when the query KEY changes -- an
 * unscoped key would leave stale-language labels on screen after an
 * EN<->FR switch. These Commerce Knowledge read keys must include
 * `languageCode` so a language switch produces a genuinely different key.
 * (`PLATFORM-BASELINE-013E` removed the category-scoped `qualifyingNodes`
 * key with its dead query hook; the backend callable itself is retained.)
 */
describe("businessQueryKeys — language-scoped Commerce Knowledge reads (PLATFORM-BASELINE-008)", () => {
  it("rewardProgramCategories: distinct keys for distinct languages, stable for the same language", () => {
    const en = businessQueryKeys.rewardProgramCategories("en");
    const fr = businessQueryKeys.rewardProgramCategories("fr");
    const enAgain = businessQueryKeys.rewardProgramCategories("en");
    expect(en).not.toEqual(fr);
    expect(en).toEqual(enAgain);
  });

  it("knowledgeNodeLabels: distinct keys for distinct languages (same ids), stable for the same language and id order", () => {
    const en = businessQueryKeys.knowledgeNodeLabels(["node-a", "node-b"], "en");
    const fr = businessQueryKeys.knowledgeNodeLabels(["node-a", "node-b"], "fr");
    const enReordered = businessQueryKeys.knowledgeNodeLabels(["node-b", "node-a"], "en");
    const enDuplicated = businessQueryKeys.knowledgeNodeLabels(
      ["node-b", "node-a", "node-a"],
      "en",
    );
    expect(en).not.toEqual(fr);
    expect(en).toEqual(enReordered);
    expect(en).toEqual(enDuplicated);
  });
});

/**
 * `PLATFORM-BASELINE-013B`: the Business's own Qualifying Item library is
 * Business-authored free text, stored once and never translated -- its
 * query key is deliberately NOT language-scoped (one cached entry serves
 * every locale), while remaining Business-scoped (no cross-Business cache
 * bleed).
 */
describe("businessQueryKeys — Qualifying Item library (PLATFORM-BASELINE-013B)", () => {
  it("qualifyingItems: distinct keys per Business, stable for the same Business, with no language dimension", () => {
    const a = businessQueryKeys.qualifyingItems("biz-1");
    const b = businessQueryKeys.qualifyingItems("biz-2");
    const aAgain = businessQueryKeys.qualifyingItems("biz-1");
    expect(a).not.toEqual(b);
    expect(a).toEqual(aAgain);
    expect(JSON.stringify(a)).not.toContain("en");
  });
});

/** `BUSINESS-REWARD-CYCLE-VISIBILITY-001`: Business-scoped, no cross-Business cache bleed. */
describe("businessQueryKeys — Business Reward / Loyalty-Cycle visibility", () => {
  it("rewards and cycle-progress keys are distinct per Business and from each other", () => {
    expect(businessQueryKeys.businessAvailableRewards("biz-1")).not.toEqual(
      businessQueryKeys.businessAvailableRewards("biz-2"),
    );
    expect(businessQueryKeys.businessCycleProgress("biz-1")).not.toEqual(
      businessQueryKeys.businessCycleProgress("biz-2"),
    );
    expect(businessQueryKeys.businessAvailableRewards("biz-1")).not.toEqual(
      businessQueryKeys.businessCycleProgress("biz-1"),
    );
  });
});
