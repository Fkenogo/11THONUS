import { beforeEach, describe, expect, it, vi } from "vitest";

const { write } = vi.hoisted(() => ({ write: vi.fn() }));
vi.mock("firebase-functions/logger", () => ({ write }));

const { emitIdentityOperationalSignal, IDENTITY_OPERATIONAL_SIGNALS } =
  await import("./identityOperationalSignals");

beforeEach(() => {
  write.mockClear();
});

describe("emitIdentityOperationalSignal", () => {
  it.each(IDENTITY_OPERATIONAL_SIGNALS)("accepts the known signal %s", (signal) => {
    emitIdentityOperationalSignal({
      signal,
      sourceDomain: "identity",
      correlationId: "corr-1",
      result: "failure",
    });

    expect(write).toHaveBeenCalledWith(
      expect.objectContaining({ operation: signal, correlationId: "corr-1" }),
    );
  });

  it("rejects an unrecognised signal name", () => {
    expect(() =>
      emitIdentityOperationalSignal({
        // @ts-expect-error deliberately invalid for this test
        signal: "not_a_real_signal",
        sourceDomain: "identity",
        correlationId: "corr-1",
        result: "failure",
      }),
    ).toThrow();
  });

  it("maps sourceDomain to the log's domain field and tags the identityAudit service", () => {
    emitIdentityOperationalSignal({
      signal: "issuance_failed",
      sourceDomain: "loyaltyNumber",
      correlationId: "corr-2",
      result: "failure",
    });

    expect(write).toHaveBeenCalledWith(
      expect.objectContaining({ domain: "loyaltyNumber", service: "identityAudit" }),
    );
  });

  it("carries an optional customerIdentityId as the log's customerId field", () => {
    emitIdentityOperationalSignal({
      signal: "recovery_failed",
      sourceDomain: "identity",
      correlationId: "corr-3",
      result: "failure",
      customerIdentityId: "cust_1",
    });

    expect(write).toHaveBeenCalledWith(expect.objectContaining({ customerId: "cust_1" }));
  });

  it("carries an optional errorCode", () => {
    emitIdentityOperationalSignal({
      signal: "persistence_unavailable",
      sourceDomain: "identity",
      correlationId: "corr-4",
      result: "failure",
      errorCode: "INTEGRATION_FAILED",
    });

    expect(write).toHaveBeenCalledWith(
      expect.objectContaining({ errorCode: "INTEGRATION_FAILED" }),
    );
  });

  it("never accepts a free-text message field — result is categorical only", () => {
    emitIdentityOperationalSignal({
      signal: "issuance_succeeded",
      sourceDomain: "identity",
      correlationId: "corr-5",
      result: "success",
    });

    const written = write.mock.calls[write.mock.calls.length - 1]?.[0] as Record<string, unknown>;
    expect(written).not.toHaveProperty("message");
    expect(written).not.toHaveProperty("phone");
    expect(written).not.toHaveProperty("email");
  });
});
