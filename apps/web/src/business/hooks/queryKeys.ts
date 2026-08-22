/** The exact query-key/invalidation map from design §24 — one place, so mutations invalidate narrowly and consistently. */

export const businessQueryKeys = {
  owned: () => ["business", "owned"] as const,
  context: (businessId: string) => ["business", businessId] as const,
  branch: (businessId: string) => ["businessBranch", businessId] as const,
  categories: () => ["commerceKnowledge", "businessCategories"] as const,
  types: (categoryId: string) => ["commerceKnowledge", "businessTypes", categoryId] as const,
  staffInvitations: (businessId: string) => ["staffInvitations", businessId] as const,
  staffMemberships: (businessId: string) => ["staffMemberships", businessId] as const,
};
