import { describe, expect, it } from "vitest";
import type { IdempotencyRecord } from "./idempotencyRecord";
import { evaluateIdempotency } from "./idempotencyService";

function recordWithStatus(status: IdempotencyRecord["status"]): IdempotencyRecord {
  return {
    id: "idem-1",
    idempotencyKey: "idem-1",
    operationType: "purchase.recordPurchase",
    actorId: "actor-1",
    requestHash: "hash-abc",
    status,
    resultReference: "purchases/p-1",
    createdAt: {} as never,
  };
}

describe("evaluateIdempotency", () => {
  it("returns 'new' when no existing record is found", () => {
    const result = evaluateIdempotency(undefined, "hash-abc", "corr-1");

    expect(result).toEqual({ outcome: "new" });
  });

  it("returns 'duplicate' with the existing record when the request hash matches and status is 'completed'", () => {
    const existing = recordWithStatus("completed");
    const result = evaluateIdempotency(existing, "hash-abc", "corr-1");

    expect(result).toEqual({ outcome: "duplicate", record: existing });
  });

  it("returns 'in_progress' — never a fabricated duplicate — when the request hash matches a record still 'processing'", () => {
    const existing = recordWithStatus("processing");
    const result = evaluateIdempotency(existing, "hash-abc", "corr-1");

    expect(result).toEqual({ outcome: "in_progress" });
  });

  it("returns 'new' when the request hash matches a 'failed' record, allowing the operation to be retried", () => {
    const existing = recordWithStatus("failed");
    const result = evaluateIdempotency(existing, "hash-abc", "corr-1");

    expect(result).toEqual({ outcome: "new" });
  });

  it("returns 'conflict' with an IDEMPOTENCY_CONFLICT error when the request hash differs, regardless of status", () => {
    for (const status of ["processing", "completed", "failed"] as const) {
      const result = evaluateIdempotency(recordWithStatus(status), "hash-different", "corr-1");

      expect(result).toEqual({
        outcome: "conflict",
        error: {
          code: "IDEMPOTENCY_CONFLICT",
          messageKey: "errors.idempotencyConflict",
          correlationId: "corr-1",
          retryable: false,
        },
      });
    }
  });
});
