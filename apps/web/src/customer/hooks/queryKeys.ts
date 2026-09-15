/** Customer purchase query-key map (`PLATFORM-BASELINE-006A`) — one place, narrow invalidation. */

export const customerPurchaseQueryKeys = {
  waiting: () => ["customerPurchases", "waiting"] as const,
  purchase: (purchaseRecordId: string) => ["customerPurchase", purchaseRecordId] as const,
  rewards: () => ["customerRewards", "available"] as const,
};
