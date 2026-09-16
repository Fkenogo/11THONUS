import { describe, expect, it } from "vitest";
import { businessQueryKeys } from "./queryKeys";

/**
 * Review finding (PR #255): `staleTime: Infinity` (`businessQueries.ts`)
 * means React Query only refetches when the query KEY changes -- an
 * unscoped key would leave stale-language labels on screen after an
 * EN<->FR switch. These three Commerce Knowledge read keys must include
 * `languageCode` so a language switch produces a genuinely different key.
 */
describe("businessQueryKeys — language-scoped Commerce Knowledge reads (PLATFORM-BASELINE-008)", () => {
  it("rewardProgramCategories: distinct keys for distinct languages, stable for the same language", () => {
    const en = businessQueryKeys.rewardProgramCategories("en");
    const fr = businessQueryKeys.rewardProgramCategories("fr");
    const enAgain = businessQueryKeys.rewardProgramCategories("en");
    expect(en).not.toEqual(fr);
    expect(en).toEqual(enAgain);
  });

  it("qualifyingNodes: distinct keys for distinct languages (same category), stable for the same language", () => {
    const en = businessQueryKeys.qualifyingNodes("cat-1", "en");
    const fr = businessQueryKeys.qualifyingNodes("cat-1", "fr");
    const enAgain = businessQueryKeys.qualifyingNodes("cat-1", "en");
    expect(en).not.toEqual(fr);
    expect(en).toEqual(enAgain);
  });

  it("knowledgeNodeLabels: distinct keys for distinct languages (same ids), stable for the same language and id order", () => {
    const en = businessQueryKeys.knowledgeNodeLabels(["node-a", "node-b"], "en");
    const fr = businessQueryKeys.knowledgeNodeLabels(["node-a", "node-b"], "fr");
    const enReordered = businessQueryKeys.knowledgeNodeLabels(["node-b", "node-a"], "en");
    expect(en).not.toEqual(fr);
    expect(en).toEqual(enReordered);
  });
});
