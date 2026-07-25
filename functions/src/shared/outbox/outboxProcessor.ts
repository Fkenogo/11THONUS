/**
 * Outbox processor (ENG-P1-002).
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
 * invented architecture.
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

export async function processOutboxEntries(
  db: Firestore,
  handler: OutboxEventHandler,
  limit = 10,
): Promise<void> {
  const now = Timestamp.now();
  const snapshot = await db
    .collection(COLLECTION)
    .where("status", "==", "pending")
    .limit(limit)
    .get();

  for (const doc of snapshot.docs) {
    const entry = { id: doc.id, ...doc.data() } as OutboxEntry;

    if (entry.nextRetryAt && entry.nextRetryAt.toMillis() > now.toMillis()) {
      continue;
    }

    try {
      await handler(entry.event);
      await doc.ref.update({ status: "completed", completedAt: serverTimestamp() });
    } catch (error) {
      const outcome = classifyThrown(error);
      const next = decideNextOutboxState(entry, outcome);

      if (next.status === "pending") {
        await doc.ref.update({
          status: "pending",
          retryCount: next.retryCount,
          nextRetryAt: Timestamp.fromMillis(Date.now() + next.nextRetryDelayMs),
          lastError: { ...next.lastError, occurredAt: serverTimestamp() },
        });
      } else if (next.status === "dead_letter") {
        await doc.ref.update({ status: "dead_letter", deadLetter: next.deadLetter });
      }
    }
  }
}
