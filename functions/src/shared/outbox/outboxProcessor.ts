/**
 * Outbox processor (ENG-P1-002, corrected under ENG-P1-002-CR1).
 *
 * The reliability guarantee behind the outbox pattern: reads unpublished
 * entries, invokes a caller-supplied handler ("publishes or processes
 * the event", TRD11 §11.17 — the handler itself is domain-specific and
 * out of this work package's scope, per the Engineering Blueprint's own
 * Explicit Exclusions), and persists the next state via
 * `decideNextOutboxState` — the pure decision logic implementing TRD11
 * §11.29 (bounded exponential backoff; retryable vs. non-retryable
 * classification) and §11.30 (dead-letter transition).
 *
 * Backoff parameters (1s initial delay, ×2 multiplier, 5 attempts before
 * dead-letter) are not numerically specified anywhere in TRD11 §11.29
 * ("bounded exponential backoff" only) — this is this work package's own
 * disclosed implementation choice within the approved pattern, not an
 * invented architecture. `CLAIM_TIMEOUT_MS` (ENG-P1-002-CR1) is the same
 * category of disclosed numeric choice.
 *
 * Concurrent-worker safety (ENG-P1-002-CR1 Correction B): a worker never
 * mutates an entry directly. It first calls `claimOutboxEntry`, which
 * atomically (inside a Firestore transaction) verifies the entry is
 * either a due `"pending"` entry or a `"processing"` entry whose claim has
 * expired, then writes `status: "processing"`. `OutboxStatus` already
 * declared `"processing"` as a valid value (TRD11 §11.17's own schema);
 * this correction is the first code that actually uses it as a real
 * exclusivity marker.
 *
 * Ownership is tracked via `OutboxEntry.claimedAt` (`outboxEntry.ts`,
 * added under ENG-P1-002-CR1 with explicit Founder authorization) — a
 * client-generated `Timestamp` written fresh on every claim/reclaim, used
 * both to compute claim age (for expired-claim detection) and as the
 * exact ownership token a later transition must still match. An earlier
 * design used Firestore's own document `updateTime` metadata instead of a
 * persisted field, to avoid a schema change; that was empirically
 * disproven during this correction — a write that sets a field to the
 * value it already holds (exactly what a same-status reclaim does) does
 * not advance `updateTime`, so two distinct claims of the same entry
 * could not always be told apart. `claimedAt` replaces it. A worker that
 * later tries to complete/retry/dead-letter an entry does so via
 * `applyOwnedTransition`, which fails (without throwing — it reports
 * `false`) if the entry's current `claimedAt` no longer matches the value
 * the worker captured at claim time, i.e. some other worker reclaimed it
 * since. A stale worker's transition is therefore silently discarded
 * rather than overwriting a newer owner's state.
 */

import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import type { DomainEvent } from "../events/domainEvent";
import { serverTimestamp } from "../metadata/serverTimestamp";
import type { OutboxDeadLetterReason, OutboxEntry, OutboxErrorClassification } from "./outboxEntry";

const COLLECTION = "outboxEntries";
const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 1_000;
const BACKOFF_MULTIPLIER = 2;

// A claim (status "processing") older than this is presumed abandoned by a
// worker that crashed or timed out mid-processing, and becomes eligible for
// another worker to reclaim. Not specified by TRD11 — this work package's
// own disclosed choice, in the same spirit as the backoff constants above.
const CLAIM_TIMEOUT_MS = 5 * 60_000;

export class RetryableProcessingError extends Error {}

export class NonRetryableProcessingError extends Error {
  readonly deadLetterReason: OutboxDeadLetterReason;

  constructor(
    message: string,
    deadLetterReason: OutboxDeadLetterReason = "invalid_payload_for_version",
  ) {
    super(message);
    this.deadLetterReason = deadLetterReason;
  }
}

export type ProcessingOutcome =
  | { result: "success" }
  | {
      result: "failure";
      classification: OutboxErrorClassification;
      message: string;
      deadLetterReason?: OutboxDeadLetterReason;
    };

export type NextOutboxState =
  | { status: "completed" }
  | {
      status: "pending";
      retryCount: number;
      nextRetryDelayMs: number;
      lastError: { message: string; classification: OutboxErrorClassification };
    }
  | {
      status: "dead_letter";
      deadLetter: {
        reason: OutboxDeadLetterReason;
        processingAttempts: number;
        recommendedAction: string;
      };
    };

export function decideNextOutboxState(
  entry: OutboxEntry,
  outcome: ProcessingOutcome,
): NextOutboxState {
  if (outcome.result === "success") {
    return { status: "completed" };
  }

  const attempts = entry.retryCount + 1;

  if (outcome.classification === "non_retryable" || attempts >= MAX_RETRIES) {
    const reason =
      outcome.deadLetterReason ??
      (outcome.classification === "non_retryable"
        ? "invalid_payload_for_version"
        : "max_retries_exceeded");
    return {
      status: "dead_letter",
      deadLetter: {
        reason,
        processingAttempts: attempts,
        recommendedAction:
          outcome.classification === "non_retryable"
            ? "Inspect payload/version compatibility before reprocessing."
            : "Investigate downstream failure before manual replay.",
      },
    };
  }

  return {
    status: "pending",
    retryCount: attempts,
    nextRetryDelayMs: INITIAL_BACKOFF_MS * BACKOFF_MULTIPLIER ** entry.retryCount,
    lastError: { message: outcome.message, classification: outcome.classification },
  };
}

export type OutboxEventHandler = (event: DomainEvent<unknown>) => Promise<void>;

function classifyThrown(error: unknown): ProcessingOutcome {
  if (error instanceof NonRetryableProcessingError) {
    return {
      result: "failure",
      classification: "non_retryable",
      message: error.message,
      deadLetterReason: error.deadLetterReason,
    };
  }

  return {
    result: "failure",
    classification: "retryable",
    message: error instanceof Error ? error.message : String(error),
  };
}

export type OutboxClaim = { entry: OutboxEntry; claimedAt: Timestamp };

/**
 * Atomically claims a single entry for exclusive processing, or returns
 * `undefined` if it is not currently eligible (already claimed by a live
 * worker, not yet due, or already in a terminal state). Re-verifies
 * eligibility from a fresh transactional read — the caller's candidate
 * list (from `collectClaimCandidateIds`) is only a best-effort hint.
 */
export async function claimOutboxEntry(
  db: Firestore,
  entryId: string,
  claimTimeoutMs: number = CLAIM_TIMEOUT_MS,
): Promise<OutboxClaim | undefined> {
  const ref = db.collection(COLLECTION).doc(entryId);
  // Generated once, client-side, before the transaction — the exact value
  // written is already known, so no follow-up read is needed to learn it.
  const claimTimestamp = Timestamp.now();

  const claimedEntry = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) {
      return undefined;
    }

    const entry = { id: snapshot.id, ...snapshot.data() } as OutboxEntry;
    const now = Timestamp.now();
    const claimAgeMs = entry.claimedAt ? now.toMillis() - entry.claimedAt.toMillis() : Infinity;

    const isDuePending =
      entry.status === "pending" &&
      (!entry.nextRetryAt || entry.nextRetryAt.toMillis() <= now.toMillis());
    const isExpiredClaim = entry.status === "processing" && claimAgeMs >= claimTimeoutMs;

    if (!isDuePending && !isExpiredClaim) {
      return undefined;
    }

    transaction.update(ref, { status: "processing", claimedAt: claimTimestamp });
    return { ...entry, status: "processing" as const, claimedAt: claimTimestamp };
  });

  if (!claimedEntry) {
    return undefined;
  }

  return { entry: claimedEntry, claimedAt: claimTimestamp };
}

/**
 * Applies a state transition only if `claimedAt` still matches the
 * entry's current `claimedAt` field — i.e. only if this worker's claim
 * has not been superseded by another worker's reclaim since. Returns
 * `false` (without throwing) for a stale claim; the caller simply drops
 * the transition rather than overwriting a newer owner's state.
 *
 * Exported (in addition to being used internally by
 * `processOutboxEntries`) specifically so the stale-worker-rejection
 * guarantee can be exercised directly against the real emulator — see
 * `outboxProcessor.emulator.test.ts`.
 */
export async function applyOwnedTransition(
  db: Firestore,
  entryId: string,
  claimedAt: Timestamp,
  mutation: Record<string, unknown>,
): Promise<boolean> {
  const ref = db.collection(COLLECTION).doc(entryId);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const currentClaimedAt = snapshot.exists
      ? (snapshot.data() as OutboxEntry).claimedAt
      : undefined;

    if (!currentClaimedAt || !currentClaimedAt.isEqual(claimedAt)) {
      return false;
    }

    transaction.update(ref, mutation);
    return true;
  });
}

async function collectClaimCandidateIds(db: Firestore, limit: number): Promise<string[]> {
  const snapshot = await db
    .collection(COLLECTION)
    .where("status", "in", ["pending", "processing"])
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.id);
}

export async function processOutboxEntries(
  db: Firestore,
  handler: OutboxEventHandler,
  limit = 10,
): Promise<void> {
  const candidateIds = await collectClaimCandidateIds(db, limit);

  for (const entryId of candidateIds) {
    const claim = await claimOutboxEntry(db, entryId);
    if (!claim) {
      // Not eligible right now — already owned by a live worker, not yet
      // due, or already terminal. Another worker's concern, not an error.
      continue;
    }

    try {
      await handler(claim.entry.event);
      await applyOwnedTransition(db, entryId, claim.claimedAt, {
        status: "completed",
        completedAt: serverTimestamp(),
      });
    } catch (error) {
      const outcome = classifyThrown(error);
      const next = decideNextOutboxState(claim.entry, outcome);

      if (next.status === "pending") {
        await applyOwnedTransition(db, entryId, claim.claimedAt, {
          status: "pending",
          retryCount: next.retryCount,
          nextRetryAt: Timestamp.fromMillis(Date.now() + next.nextRetryDelayMs),
          lastError: { ...next.lastError, occurredAt: serverTimestamp() },
        });
      } else if (next.status === "dead_letter") {
        await applyOwnedTransition(db, entryId, claim.claimedAt, {
          status: "dead_letter",
          deadLetter: next.deadLetter,
        });
      }
    }
  }
}
