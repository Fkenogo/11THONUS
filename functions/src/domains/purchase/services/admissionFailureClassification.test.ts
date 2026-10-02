/**
 * WP-COM-06a -- failure classification table (no database). The REAL PostgreSQL errors are
 * classified in `commercial/heldPurchaseProcessor.postgres.test.ts`.
 */

import { describe, expect, it } from "vitest";
import {
  purchaseIdempotencyConflictError,
  purchaseIdempotencyInProgressError,
  purchaseStaleStateError,
  purchaseValidationError,
} from "../models/purchaseErrors";
import { classifyAdmissionFailure } from "./admissionFailureClassification";

const pg = (code: string) => Object.assign(new Error("db"), { code });

describe("classifyAdmissionFailure", () => {
  it.each([
    ["40001", "SERIALIZATION_FAILURE"],
    ["40P01", "DEADLOCK_DETECTED"],
    ["55P03", "LOCK_NOT_AVAILABLE"],
    ["57014", "STATEMENT_TIMEOUT"],
    ["53300", "TOO_MANY_CONNECTIONS"],
    ["57P01", "ADMIN_SHUTDOWN"],
  ])("SQLSTATE %s is transient (%s)", (code, label) => {
    expect(classifyAdmissionFailure(pg(code))).toEqual({ failureClass: "transient", code: label });
  });

  it.each(["08000", "08006", "ECONNRESET", "ETIMEDOUT"])(
    "connection failure %s is transient",
    (code) => {
      expect(classifyAdmissionFailure(pg(code)).failureClass).toBe("transient");
    },
  );

  it("connection-pool exhaustion / terminated connections are transient", () => {
    expect(
      classifyAdmissionFailure(new Error("timeout exceeded when trying to connect")).failureClass,
    ).toBe("transient");
    expect(
      classifyAdmissionFailure(new Error("Connection terminated unexpectedly")).failureClass,
    ).toBe("transient");
  });

  it.each(["23502", "23503", "23505", "23514"])("constraint violation %s is permanent", (code) => {
    expect(classifyAdmissionFailure(pg(code))).toEqual({
      failureClass: "permanent",
      code: `CONSTRAINT_${code}`,
    });
  });

  it("another worker moving the Purchase is a concurrent winner (the processor then confirms by re-reading)", () => {
    expect(
      classifyAdmissionFailure(purchaseStaleStateError("pending_admission", "verified")),
    ).toEqual({
      failureClass: "concurrent_winner",
      code: "CONCURRENT_STATE_CHANGE",
    });
  });

  it("an admission key held by an in-flight transaction is transient; a conflicting key is permanent", () => {
    expect(classifyAdmissionFailure(purchaseIdempotencyInProgressError()).failureClass).toBe(
      "transient",
    );
    expect(classifyAdmissionFailure(purchaseIdempotencyConflictError())).toEqual({
      failureClass: "permanent",
      code: "IDEMPOTENCY_CONFLICT",
    });
  });

  it("malformed / invariant-breaking data and unknown errors are permanent (fail loud, never benign)", () => {
    expect(classifyAdmissionFailure(purchaseValidationError("bad")).failureClass).toBe("permanent");
    expect(classifyAdmissionFailure(new Error("???"))).toEqual({
      failureClass: "permanent",
      code: "UNCLASSIFIED",
    });
    expect(classifyAdmissionFailure(undefined).failureClass).toBe("permanent");
    expect(classifyAdmissionFailure(pg("XX000")).failureClass).toBe("permanent");
  });
});
