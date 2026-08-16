/**
 * Trust record status (CAP-P2-ITM-A).
 *
 * Whether the trust record itself is currently usable as input for
 * risk-gating (`ITM-DESIGN-001` §5, §5.1) — a distinct, ITM-internal
 * concept from Customer Identity's own `Suspended`/`Locked` states.
 *
 * §5.1/§8.3 define `frozen`/`suspended` as *states* the record's shape
 * must be able to represent, but explicitly do **not** authorize the
 * *triggers* that would set them at Capability-2 MVP (no fraud-review
 * capability exists yet). Consistent with that boundary and with
 * `AD-ITM-3` (no regression/suspension policy inside ITM-A–D at MVP),
 * this module validates the closed status set only — it defines no
 * transition function between statuses. A future governed package may
 * add one once a real trigger exists.
 */

import { invalidTrustRecordStatusError } from "./trustErrors";

export const TRUST_RECORD_STATUSES = ["active", "frozen", "suspended"] as const;

export type TrustRecordStatus = (typeof TRUST_RECORD_STATUSES)[number];

export function createTrustRecordStatus(value: string): TrustRecordStatus {
  if ((TRUST_RECORD_STATUSES as readonly string[]).includes(value)) {
    return value as TrustRecordStatus;
  }
  throw invalidTrustRecordStatusError(value);
}

export function isTrustRecordStatus(value: string): value is TrustRecordStatus {
  return (TRUST_RECORD_STATUSES as readonly string[]).includes(value);
}
