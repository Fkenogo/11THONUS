import { describe, expect, it } from "vitest";
import type { OutboxEntry } from "./outboxEntry";
import {
  decideNextOutboxState,
  NonRetryableProcessingError,
  RetryableProcessingError,
} from "./outboxProcessor";

function entryWithRetryCount(retryCount: number): OutboxEntry {
  return {
    id: "evt-1",
    event: {
      eventId: "evt-1",
      eventType: "purchase.purchaseRecorded.v1",
      eventVersion: 1,
      sourceDomain: "purchase",
      aggregateType: "Purchase",
      aggregateId: "agg-1",
      correlationId: "corr-1",
      actor: { actorType: "user", actorId: "actor-1" },
      occurredAt: "2026-07-25T00:00:00.000Z",
      payload: undefined,
    },
    status: "pending",
    retryCount,
    createdAt: {} as never,
  };
}

describe("decideNextOutboxState", () => {
  it("moves to completed on success", () => {
    const result = decideNextOutboxState(entryWithRetryCount(0), { result: "success" });

    expect(result).toEqual({ status: "completed" });
  });

  it("moves to pending with an incremented retry count and bounded exponential backoff on a retryable failure", () => {
    const result = decideNextOutboxState(entryWithRetryCount(0), {
      result: "failure",
      classification: "retryable",
      message: "Firestore contention",
    });

    expect(result).toMatchObject({ status: "pending", retryCount: 1 });
    if (result.status === "pending") {
      expect(result.nextRetryDelayMs).toBeGreaterThan(0);
    }
  });

  it("doubles the backoff delay on each successive retryable failure", () => {
    const first = decideNextOutboxState(entryWithRetryCount(0), {
      result: "failure",
      classification: "retryable",
      message: "boom",
    });
    const second = decideNextOutboxState(entryWithRetryCount(1), {
      result: "failure",
      classification: "retryable",
      message: "boom",
    });

    if (first.status === "pending" && second.status === "pending") {
      expect(second.nextRetryDelayMs).toBe(first.nextRetryDelayMs * 2);
    } else {
      throw new Error("expected both results to be 'pending'");
    }
  });

  it("moves to dead_letter on a non-retryable failure regardless of retry count", () => {
    const result = decideNextOutboxState(entryWithRetryCount(0), {
      result: "failure",
      classification: "non_retryable",
      message: "unsupported event version",
      deadLetterReason: "invalid_payload_for_version",
    });

    expect(result).toEqual({
      status: "dead_letter",
      deadLetter: {
        reason: "invalid_payload_for_version",
        processingAttempts: 1,
        recommendedAction: expect.any(String),
      },
    });
  });

  it("moves to dead_letter once max retries are exceeded, even for a retryable failure", () => {
    const result = decideNextOutboxState(entryWithRetryCount(4), {
      result: "failure",
      classification: "retryable",
      message: "still failing",
    });

    expect(result).toMatchObject({
      status: "dead_letter",
      deadLetter: { reason: "max_retries_exceeded" },
    });
  });

  it("no event ever disappears silently — every failure path returns pending or dead_letter, never a discard", () => {
    const outcomes = [
      { result: "failure" as const, classification: "retryable" as const, message: "a" },
      { result: "failure" as const, classification: "non_retryable" as const, message: "b" },
    ];

    for (const outcome of outcomes) {
      const result = decideNextOutboxState(entryWithRetryCount(0), outcome);
      expect(["pending", "dead_letter"]).toContain(result.status);
    }
  });
});

describe("RetryableProcessingError / NonRetryableProcessingError", () => {
  it("carries a message like a normal Error", () => {
    expect(new RetryableProcessingError("temporary").message).toBe("temporary");
  });

  it("carries an optional dead-letter reason, defaulting to invalid_payload_for_version", () => {
    expect(new NonRetryableProcessingError("bad payload").deadLetterReason).toBe(
      "invalid_payload_for_version",
    );
    expect(
      new NonRetryableProcessingError("missing record", "missing_source_record").deadLetterReason,
    ).toBe("missing_source_record");
  });
});
