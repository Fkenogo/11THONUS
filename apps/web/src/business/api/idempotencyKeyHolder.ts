/**
 * An idempotency key belongs to one logical mutation, not one HTTP attempt
 * (Founder correction, `ENG-P3-002B`): generated when the user initiates an
 * action, held until that action's outcome is known (success, or a
 * definitive/non-retryable failure), and reused across every automatic or
 * manual retry in between. `clear()` is the caller's signal that the
 * outcome is now known — call it on success or on a definitive failure
 * (e.g. `validation_failed`), never on a transient one (`unavailable`,
 * `timeout`), so a retry of the same unchanged action keeps replaying the
 * same key rather than forking a new mutation server-side.
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
