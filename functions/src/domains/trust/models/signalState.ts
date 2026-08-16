/**
 * Signal state (CAP-P2-ITM-A).
 *
 * The bounded, latest-known-state record of governed evidence facts
 * (`ITM-DESIGN-001` §5, §7) — "has this fact ever been true," not a
 * sequence-dependent state machine (§7.1: ingestion must be commutative/
 * idempotent per event, not order-dependent). Only `hasSuccessfulAuthentication`
 * is governed at Capability-2 MVP (§6.6's band-membership condition); no
 * other signal category has a currently-available data source (§7).
 *
 * `accountAgeDays` is deliberately **not** a field here: §6.6.4 defines it
 * as derived at read time from Customer Identity's own `Registered`
 * timestamp (referenced, never duplicated/stored — §5's "avoid
 * duplicating Customer Identity profile data" instruction). Computing and
 * persisting it is ITM-C's read-path responsibility, not ITM-A's.
 *
 * This module validates and represents the *shape* of signal state only.
 * It does not mutate it — updating `hasSuccessfulAuthentication` from an
 * ingested `CustomerAuthenticated` event is ITM-B's event-consumption
 * responsibility, not ITM-A's (ITM-A "owns domain contracts only").
 */

import { invalidSignalStateFieldError } from "./trustErrors";

export type SignalState = {
  readonly hasSuccessfulAuthentication: boolean;
};

export type CreateSignalStateParams = {
  hasSuccessfulAuthentication: boolean;
};

export function createSignalState(params: CreateSignalStateParams): SignalState {
  if (typeof params.hasSuccessfulAuthentication !== "boolean") {
    throw invalidSignalStateFieldError("hasSuccessfulAuthentication");
  }

  return {
    hasSuccessfulAuthentication: params.hasSuccessfulAuthentication,
  };
}
