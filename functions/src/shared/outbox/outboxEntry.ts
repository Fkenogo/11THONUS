/**
 * Event outbox schema (ENG-P1-002; extended under ENG-P1-002-CR1).
 *
 * `OutboxEntry<T>`, derived field-for-field from TRD11 §11.17 (idempotent
 * processing, retry count, next retry time, status, error details,
 * dead-letter transition), §11.29 (bounded exponential backoff;
 * retryable vs. non-retryable classification), and §11.30 (dead-letter
 * record fields: event, failure classification, processing attempts,
 * last error, affected aggregate — carried via `event.aggregateId` —
 * recommended action).
 *
 * `claimedAt` (ENG-P1-002-CR1) is the one field added beyond that original
 * set, added with explicit Founder authorization after the original
 * concurrency-safety design — using Firestore's own document `updateTime`
 * metadata as an implicit ownership token — was empirically disproven: a
 * Firestore write that sets a field to the value it already holds (e.g. a
 * worker reclaiming an already-`"processing"` entry, which writes
 * `status: "processing"` again) does not advance `updateTime`, so two
 * distinct claims of the same entry could not always be told apart.
 * `claimedAt` is written fresh on every claim/reclaim (see
 * `outboxProcessor.ts`) specifically to serve as that ownership token, and
 * secondarily as the basis for expired-claim detection.
 */

import type { Timestamp } from "firebase-admin/firestore";
import type { DomainEvent } from "../events/domainEvent";

export type OutboxStatus = "pending" | "processing" | "completed" | "dead_letter";

export type OutboxErrorClassification = "retryable" | "non_retryable";

export type OutboxLastError = {
  message: string;
  classification: OutboxErrorClassification;
  occurredAt: Timestamp;
};

export type OutboxDeadLetterReason =
  | "max_retries_exceeded"
  | "invalid_payload_for_version"
  | "missing_source_record"
  | "repeated_corruption";

export type OutboxDeadLetter = {
  reason: OutboxDeadLetterReason;
  processingAttempts: number;
  recommendedAction: string;
};

export type OutboxEntry<T = unknown> = {
  id: string;
  event: DomainEvent<T>;
  status: OutboxStatus;
  retryCount: number;
  nextRetryAt?: Timestamp;
  lastError?: OutboxLastError;
  deadLetter?: OutboxDeadLetter;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  claimedAt?: Timestamp;
};
