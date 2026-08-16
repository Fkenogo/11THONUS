/**
 * Trust-signal outbox handler adapter (CAP-P2-ITM-B).
 *
 * Adapts `trustSignalIngestionService.ingestAuthenticationSignal` to the
 * shared outbox's `OutboxEventHandler` shape (`shared/outbox/outboxProcessor.ts`)
 * so it can be driven by the existing, already-reliable
 * `processOutboxEntries` claim/retry/dead-letter machinery — no second
 * queue, no competing consumer framework (Phase C/S instruction).
 *
 * Error classification (Phase O, mapped to the existing closed taxonomy):
 * a `TrustDomainError` is always a fail-closed, non-retryable condition —
 * `VALIDATION_FAILED` (unsupported event type, malformed payload) or
 * `RESOURCE_NOT_FOUND` (unknown customer identity) — retrying an
 * unsupported/malformed event or a permanently-missing identity cannot
 * succeed on a later attempt. Any other thrown error (e.g. a transient
 * Firestore failure) is left to propagate unmapped, so
 * `processOutboxEntries`'s existing default (retryable, bounded backoff)
 * applies unchanged.
 *
 * **Not wired to a live scheduled trigger by this package.** No other
 * domain in this codebase currently invokes `processOutboxEntries` from a
 * deployed Cloud Function — `identityAudit` (`-10`) is a pure read-side
 * query over `outboxEntries`, not a `processOutboxEntries` consumer, and
 * no `onSchedule`/pub-sub wiring exists anywhere yet. Inventing the
 * platform's first live scheduled-consumer wiring would be a Firebase/
 * deployment-config change, which is outside this package's authorized
 * scope (task header; `ITM-DESIGN-001` §20's "no Firebase/deployment
 * change" exclusion). This handler is fully exercised against the real
 * emulator via direct calls to `processOutboxEntries(db, handleTrustSignalEvent)`
 * (see `trustEventHandler.emulator.test.ts`) — proving the consumption
 * contract works — without deploying a new trigger.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { DomainEvent } from "../../../shared/events/domainEvent";
import { NonRetryableProcessingError } from "../../../shared/outbox/outboxProcessor";
import { TrustDomainError } from "../models/trustErrors";
import { ingestAuthenticationSignal } from "./trustSignalIngestionService";

export async function handleTrustSignalEvent(
  db: Firestore,
  event: DomainEvent<unknown>,
): Promise<void> {
  try {
    await ingestAuthenticationSignal(db, event);
  } catch (error) {
    if (error instanceof TrustDomainError) {
      const deadLetterReason =
        error.category === "RESOURCE_NOT_FOUND"
          ? "missing_source_record"
          : "invalid_payload_for_version";
      throw new NonRetryableProcessingError(error.message, deadLetterReason);
    }
    throw error;
  }
}
