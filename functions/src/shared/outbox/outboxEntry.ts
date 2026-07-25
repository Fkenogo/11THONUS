/**
 * Event outbox schema (ENG-P1-002).
 *
 * `OutboxEntry<T>`, derived field-for-field from TRD11 §11.17 (idempotent
 * processing, retry count, next retry time, status, error details,
 * dead-letter transition), §11.29 (bounded exponential backoff;
 * retryable vs. non-retryable classification), and §11.30 (dead-letter
 * record fields: event, failure classification, processing attempts,
 * last error, affected aggregate — carried via `event.aggregateId` —
 * recommended action).
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
};
