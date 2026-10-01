/**
 * Commercial capacity-increase signal (`WP-COM-06a`).
 *
 * A BEST-EFFORT, POST-COMMIT signal. After a Commercial command has COMMITTED a change that can
 * increase the usable admission capacity of a Business, the command runner tells an injected
 * notifier "Business X may now be able to admit held Purchases". It is NOT a transactional
 * outbox: nothing is written in the command's PostgreSQL transaction, the signal may be lost
 * (crash between commit and notify, notifier failure, timeout), and a lost signal never undoes
 * or blocks the committed mutation. Periodic recovery (a separate scheduled processor) is what
 * guarantees held Purchases are eventually re-evaluated.
 *
 * DEPENDENCY DIRECTION: Commercial defines this port and calls it; it imports nothing from the
 * Purchase domain. The composition root binds the port to the held-Purchase processor's trigger.
 * Pure types: no SQL, no I/O.
 */

/**
 * The only mutations that can raise `balance - reserved` or lift a restriction. Closed list --
 * adding a reason is a design decision, not a convenience (see the WP-COM-06a report §6).
 */
export const CAPACITY_INCREASE_REASONS = [
  "settlement_confirmed",
  "trial_granted",
  "trial_adjusted_up",
  "credit_adjusted_up",
  "standing_restored",
] as const;
export type CapacityIncreaseReason = (typeof CAPACITY_INCREASE_REASONS)[number];

export type CapacityIncreaseSignal = {
  readonly businessId: string;
  readonly reason: CapacityIncreaseReason;
  readonly correlationId: string;
};

export interface CapacityIncreaseNotifier {
  /** May reject; the command runner isolates every failure (it never reaches the caller). */
  notify(signal: CapacityIncreaseSignal): Promise<void>;
}

/** Default upper bound a command waits for the notifier before giving up (signal is best-effort). */
export const DEFAULT_CAPACITY_SIGNAL_TIMEOUT_MS = 3000;
