/**
 * One intentional Counter submission (`EA-BL-001-CORR-002-B`, assessment §22.2/§23.1).
 *
 * A "transaction intent" keeps THREE things together for the life of one submission: the exact
 * payload, the exact `purchaseDate`, and the exact idempotency key. `resolvePurchaseDateInstant`
 * returns a fresh "now" for today, and the existing mutation hook derives its key from the payload
 * signature — so recomputing the date on a retry would change the signature, rotate the key and let a
 * committed-but-unacknowledged first attempt be recorded a second time. This holder therefore:
 *
 *  - captures `purchaseDate` ONCE, when the intent is first prepared (the only call site of
 *    `resolvePurchaseDateInstant` on the Counter);
 *  - hands back the SAME intent (payload, date, key) for an unchanged transaction — which is what an
 *    uncertain/network retry submits;
 *  - starts a FRESH intent (new date, new key) only when a transaction-defining input changes, or
 *    after `discard()` (a definitive outcome, or Serve next customer).
 *
 * It is plain, framework-free state so the lifecycle is provable in isolation.
 */

import {
  resolvePurchaseDateInstant as defaultResolvePurchaseDate,
  todayDateInputValue as defaultTodayDateInput,
} from "../dashboard/purchaseDateInput";
import type { RecordPurchaseRequest } from "../api/purchaseMutations";

export type CounterArtifact =
  | { readonly kind: "loyalty_number"; readonly value: string }
  | { readonly kind: "qr_identity"; readonly value: string };

export type CounterIntentInput = {
  readonly rewardProgramId: string;
  readonly qualifyingItemId: string;
  readonly quantity: number;
  readonly artifact: CounterArtifact;
};

export type CounterIntentRequest = Omit<RecordPurchaseRequest, "businessId" | "idempotencyKey">;

export type CounterIntent = {
  /** Identity of the transaction-defining input this intent was prepared for. */
  readonly signature: string;
  /** Exact payload INCLUDING the once-captured `purchaseDate`. */
  readonly request: CounterIntentRequest;
  readonly idempotencyKey: string;
};

export type CounterIntentHolder = {
  /** The held intent, if any (an intent is held from `prepare` until `discard`). */
  current: () => CounterIntent | null;
  /** Same input → the SAME intent; changed input (or none held) → a fresh intent. */
  prepare: (input: CounterIntentInput) => CounterIntent;
  /** Drop the held intent: the next `prepare` captures a fresh date and key. */
  discard: () => void;
};

export type CounterIntentDeps = {
  readonly now?: () => Date;
  readonly newKey?: () => string;
  readonly resolvePurchaseDate?: (dateInputValue: string, now: Date) => string;
  readonly todayDateInput?: (now: Date) => string;
};

/** Canonical Loyalty Number entry form for the signature only (the server canonicalises the real value). */
export function normaliseArtifactValue(artifact: CounterArtifact): string {
  const trimmed = artifact.value.trim();
  return artifact.kind === "loyalty_number" ? trimmed.toUpperCase() : trimmed;
}

export function counterIntentSignature(input: CounterIntentInput): string {
  return JSON.stringify([
    input.rewardProgramId,
    input.qualifyingItemId,
    input.quantity,
    input.artifact.kind,
    normaliseArtifactValue(input.artifact),
  ]);
}

export function createCounterIntentHolder(deps: CounterIntentDeps = {}): CounterIntentHolder {
  const now = deps.now ?? (() => new Date());
  const newKey = deps.newKey ?? (() => crypto.randomUUID());
  const resolvePurchaseDate = deps.resolvePurchaseDate ?? defaultResolvePurchaseDate;
  const todayDateInput = deps.todayDateInput ?? defaultTodayDateInput;
  let held: CounterIntent | null = null;

  return {
    current: () => held,
    prepare: (input) => {
      const signature = counterIntentSignature(input);
      if (held !== null && held.signature === signature) {
        return held;
      }
      const instant = now();
      const artifactValue = normaliseArtifactValue(input.artifact);
      held = {
        signature,
        request: {
          rewardProgramId: input.rewardProgramId,
          qualifyingItemId: input.qualifyingItemId,
          quantity: input.quantity,
          ...(input.artifact.kind === "loyalty_number"
            ? { loyaltyNumberValue: artifactValue }
            : { qrReference: artifactValue }),
          purchaseDate: resolvePurchaseDate(todayDateInput(instant), instant),
        },
        idempotencyKey: newKey(),
      };
      return held;
    },
    discard: () => {
      held = null;
    },
  };
}
