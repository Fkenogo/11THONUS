/**
 * Customer purchase query-key map (`PLATFORM-BASELINE-006A`) — one place,
 * narrow invalidation.
 *
 * Every key is scoped by `identityScope` (the signed-in Firebase user's
 * `uid`, from `useAuthenticatedActor`'s `ready` state — never a
 * client-supplied Customer Identity ID) so that the app-wide singleton
 * `QueryClient` (`main.tsx`) can never resolve one customer's cached
 * waiting purchases, purchase detail, or rewards from another customer's
 * entries after a sign-out/sign-in transition in the same SPA session
 * (`PLATFORM-BASELINE-006A-CORR-002`).
 */

export const customerPurchaseQueryKeys = {
  waiting: (identityScope: string) => ["customerPurchases", "waiting", identityScope] as const,
  purchase: (identityScope: string, purchaseRecordId: string) =>
    ["customerPurchase", identityScope, purchaseRecordId] as const,
  rewards: (identityScope: string) => ["customerRewards", "available", identityScope] as const,
};
