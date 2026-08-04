/**
 * Identity recovery boundary (ENG-P2-001-06).
 *
 * Implements only the *lifecycle* portion of recovery: restoring an
 * existing, access-lost identity's status back to `active`. Never
 * touches authentication-credential proof, Loyalty Number, or QR
 * reference — those are untouched by construction (this function only
 * reads/writes `status`/`updatedAt`/`updatedBy`) or belong to other
 * packages entirely (`-07` orchestrates the proof step upstream of this
 * call; ITM owns risk-gating which paths are permitted).
 *
 * Recovery-eligible source statuses are `suspended` and `locked` only —
 * `dormant` explicitly does not require a recovery step
 * (`ENG-P2-ARCH-001` §3: "Renewed activity → Active directly"), and
 * `active`/`registered`/`closed`/`archived` have nothing to recover
 * from or are terminal-in. `IdentityRecovered` is emitted as a
 * transition/audit marker only — `Recovered` is never written as a
 * persistent `IdentityStatus` value (`ENG-P2-001-PLAN-001` §14
 * Ambiguity 1's own recommended resolution, adopted here — see the
 * ENG-P2-001-06 implementation report §5).
 */

import { transitionIdentityStatus, type CustomerIdentity } from "../models/customerIdentity";
import { recoveryNotPermittedError } from "../models/identityErrors";
import type { TransitionAuthority } from "../models/transitionAuthority";
import type { EventActor, DomainEvent } from "../../../shared/events/domainEvent";
import {
  buildIdentityRecoveredEvent,
  type IdentityRecoveredPayload,
} from "../events/identityEvents";

const RECOVERY_ELIGIBLE_STATUSES: readonly CustomerIdentity["status"][] = ["suspended", "locked"];

const RECOVERY_REASON = "support_recovery" as const;

type EventEnvelope = {
  eventId: string;
  correlationId: string;
  actor: EventActor;
  occurredAt: string;
};

export type RecoverCustomerIdentityParams = EventEnvelope & {
  recoveredAt: Date;
  recoveredBy: string | null;
  authority: TransitionAuthority;
};

export function recoverCustomerIdentity(
  identity: CustomerIdentity,
  params: RecoverCustomerIdentityParams,
): { identity: CustomerIdentity; event: DomainEvent<IdentityRecoveredPayload> } {
  if (!RECOVERY_ELIGIBLE_STATUSES.includes(identity.status)) {
    throw recoveryNotPermittedError(identity.id);
  }

  const previousStatus = identity.status;

  const transitioned = transitionIdentityStatus(identity, "active", {
    eventId: params.eventId,
    correlationId: params.correlationId,
    actor: params.actor,
    occurredAt: params.occurredAt,
    updatedAt: params.recoveredAt,
    updatedBy: params.recoveredBy,
    authority: params.authority,
    reason: RECOVERY_REASON,
  });

  const event = buildIdentityRecoveredEvent({
    eventId: params.eventId,
    correlationId: params.correlationId,
    actor: params.actor,
    occurredAt: params.occurredAt,
    customerIdentityId: identity.id,
    previousStatus,
    authority: params.authority,
    reason: RECOVERY_REASON,
  });

  return { identity: transitioned.identity, event };
}
