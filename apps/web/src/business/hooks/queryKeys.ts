/** The exact query-key/invalidation map from design §24 — one place, so mutations invalidate narrowly and consistently. */

export const businessQueryKeys = {
  owned: () => ["business", "owned"] as const,
  accessible: () => ["business", "accessible"] as const,
  context: (businessId: string) => ["business", businessId] as const,
  branch: (businessId: string) => ["businessBranch", businessId] as const,
  categories: () => ["commerceKnowledge", "businessCategories"] as const,
  types: (categoryId: string) => ["commerceKnowledge", "businessTypes", categoryId] as const,
  /**
   * `PLATFORM-BASELINE-008`: unlike the pre-existing `categories`/`types`
   * keys above, these three include `languageCode` — paired with
   * `staleTime: Infinity` (`businessQueries.ts`), an unscoped key would
   * mean switching EN<->FR never refetches (React Query has no reason to
   * treat the cached entry as stale), leaving stale-language labels on
   * screen after a language switch (review finding, PR #255).
   */
  rewardProgramCategories: (languageCode: string) =>
    ["commerceKnowledge", "rewardProgramCategories", languageCode] as const,
  qualifyingNodes: (categoryId: string, languageCode: string) =>
    ["commerceKnowledge", "qualifyingNodes", categoryId, languageCode] as const,
  /**
   * `PLATFORM-BASELINE-010B`: the qualifying-node selector's DEFAULT
   * discovery scope (Business-Type-pre-filtered). `languageCode`-scoped
   * for the same reason as `rewardProgramCategories`/`qualifyingNodes`
   * above.
   */
  qualifyingNodesForBusinessType: (businessTypeId: string, languageCode: string) =>
    ["commerceKnowledge", "qualifyingNodesForBusinessType", businessTypeId, languageCode] as const,
  /**
   * `PLATFORM-BASELINE-010B`: the qualifying-node selector's broader
   * "escape hatch" search — keyed on the exact search text typed, so each
   * distinct query is cached/refetched independently, and `languageCode`
   * for the same EN/FR-cache-bleed reason as every other Commerce
   * Knowledge read key above.
   */
  searchQualifyingNodes: (searchText: string, languageCode: string) =>
    ["commerceKnowledge", "searchQualifyingNodes", searchText, languageCode] as const,
  knowledgeNodeLabels: (nodeIds: readonly string[], languageCode: string) =>
    ["commerceKnowledge", "nodeLabels", [...nodeIds].sort().join(","), languageCode] as const,
  staffInvitations: (businessId: string) => ["staffInvitations", businessId] as const,
  staffMemberships: (businessId: string) => ["staffMemberships", businessId] as const,
  rewardPrograms: (businessId: string) => ["rewardPrograms", businessId] as const,
  rewardProgram: (businessId: string, rewardProgramId: string) =>
    ["rewardProgram", businessId, rewardProgramId] as const,
  purchases: (businessId: string, status: string) => ["purchases", businessId, status] as const,
  purchase: (businessId: string, purchaseRecordId: string) =>
    ["purchase", businessId, purchaseRecordId] as const,
};
