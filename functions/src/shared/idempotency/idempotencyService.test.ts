import { describe, expect, it } from "vitest";
import type { IdempotencyRecord } from "./idempotencyRecord";
import { evaluateIdempotency } from "./idempotencyService";

const existingRecord: IdempotencyRecord = {
  id: "idem-1",
  idempotencyKey: "idem-1",
  operationType: "purchase.recordPurchase",
  actorId: "actor-1",
  requestHash: "hash-abc",
  status: "completed",
  resultReference: "purchases/p-1",
  createdAt: {} as never,
};

describe("evaluateIdempotency", () => {
  it("returns 'new' when no existing record is found", () => {
    const result = evaluateIdempotency(undefined, "hash-abc", "corr-1");

    expect(result).toEqual({ outcome: "new" });
  });

  it("returns 'duplicate' with the existing record when the request hash matches", () => {
    const result = evaluateIdempotency(existingRecord, "hash-abc", "corr-1");

    expect(result).toEqual({ outcome: "duplicate", record: existingRecord });
  });

  it("returns 'conflict' with an IDEMPOTENCY_CONFLICT error when the request hash differs", () => {
    const result = evaluateIdempotency(existingRecord, "hash-different", "corr-1");

    expect(result).toEqual({
      outcome: "conflict",
      error: {
        code: "IDEMPOTENCY_CONFLICT",
        messageKey: "errors.idempotencyConflict",
        correlationId: "corr-1",
        retryable: false,
      },
    });
  });
});
