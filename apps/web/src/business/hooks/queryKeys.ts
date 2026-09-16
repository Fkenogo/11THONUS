/** The exact query-key/invalidation map from design §24 — one place, so mutations invalidate narrowly and consistently. */

export const businessQueryKeys = {
  owned: () => ["business", "owned"] as const,
  accessible: () => ["business", "accessible"] as const,
  context: (businessId: string) => ["business", businessId] as const,
  branch: (businessId: string) => ["businessBranch", businessId] as const,
  categories: () => ["commerceKnowledge", "businessCategories"] as const,
  types: (categoryId: string) => ["commerceKnowledge", "businessTypes", categoryId] as const,
  rewardProgramCategories: () => ["commerceKnowledge", "rewardProgramCategories"] as const,
  qualifyingNodes: (categoryId: string) =>
    ["commerceKnowledge", "qualifyingNodes", categoryId] as const,
  knowledgeNodeLabels: (nodeIds: readonly string[]) =>
    ["commerceKnowledge", "nodeLabels", [...nodeIds].sort().join(",")] as const,
  staffInvitations: (businessId: string) => ["staffInvitations", businessId] as const,
  staffMemberships: (businessId: string) => ["staffMemberships", businessId] as const,
  rewardPrograms: (businessId: string) => ["rewardPrograms", businessId] as const,
  rewardProgram: (businessId: string, rewardProgramId: string) =>
    ["rewardProgram", businessId, rewardProgramId] as const,
  purchases: (businessId: string, status: string) => ["purchases", businessId, status] as const,
  purchase: (businessId: string, purchaseRecordId: string) =>
    ["purchase", businessId, purchaseRecordId] as const,
};
