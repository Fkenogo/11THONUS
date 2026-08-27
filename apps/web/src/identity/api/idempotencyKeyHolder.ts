/**
 * An idempotency key belongs to one logical mutation, not one HTTP attempt.
 * Held until the outcome is known (success or definitive failure), reused
 * across retries in between. Deliberately duplicated from
 * `business/api/idempotencyKeyHolder.ts` (disclosed duplication, see
 * `identityCallableClient.ts`'s header) — a tiny, framework-independent
 * utility, not a shared authority worth a cross-domain import.
 */

export type IdempotencyKeyHolder = {
  getKey: () => string;
  clear: () => void;
};

export function createIdempotencyKeyHolder(
  newKey: () => string = () => crypto.randomUUID(),
): IdempotencyKeyHolder {
  let key: string | null = null;
  return {
    getKey: () => {
      if (key === null) {
        key = newKey();
      }
      return key;
    },
    clear: () => {
      key = null;
    },
  };
}
