import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OperationalLog } from "./operationalLog";

const { write } = vi.hoisted(() => ({ write: vi.fn() }));
vi.mock("firebase-functions/logger", () => ({ write }));

const { log } = await import("./logger");

const baseEntry: OperationalLog = {
  timestamp: "2026-07-25T00:00:00.000Z",
  environment: "staging",
  severity: "info",
  domain: "shared",
  service: "commandDispatcher",
  operation: "dispatch",
  correlationId: "corr-1",
};

beforeEach(() => {
  write.mockClear();
});

describe("log", () => {
  it("writes the entry with the severity mapped to Cloud Logging's uppercase form", () => {
    log(baseEntry);

    expect(write).toHaveBeenCalledWith(expect.objectContaining({ severity: "INFO" }));
  });

  it("includes every field from the entry in the written payload", () => {
    log(baseEntry);

    expect(write).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: "shared",
        service: "commandDispatcher",
        operation: "dispatch",
        correlationId: "corr-1",
      }),
    );
  });

  it.each(["debug", "warning", "error", "critical"] as const)(
    "maps severity %s to its Cloud Logging form",
    (severity) => {
      log({ ...baseEntry, severity });

      const expected = { debug: "DEBUG", warning: "WARNING", error: "ERROR", critical: "CRITICAL" }[
        severity
      ];
      expect(write).toHaveBeenCalledWith(expect.objectContaining({ severity: expected }));
    },
  );

  it("throws instead of writing when result looks JWT-shaped", () => {
    expect(() =>
      log({ ...baseEntry, result: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.abc123signature" }),
    ).toThrow(/sensitive/i);
    expect(write).not.toHaveBeenCalled();
  });

  it("throws instead of writing when errorCode looks like a long token", () => {
    // Deliberately not shaped like any real provider's key-prefix convention
    // (e.g. Stripe's "sk_live_") — a generic long alphanumeric string is
    // enough to exercise the "long token/credential-shaped" pattern without
    // resembling an actual secret format.
    expect(() => log({ ...baseEntry, errorCode: "x7Qp2mZ9vLk4Rt8Ws1Ny6Ab3Cd5Ef0Gh" })).toThrow(
      /sensitive/i,
    );
    expect(write).not.toHaveBeenCalled();
  });

  it("throws instead of writing when result looks like a 6-digit OTP", () => {
    expect(() => log({ ...baseEntry, result: "482913" })).toThrow(/sensitive/i);
    expect(write).not.toHaveBeenCalled();
  });

  it("does not throw for ordinary free-text result values", () => {
    expect(() => log({ ...baseEntry, result: "succeeded" })).not.toThrow();
    expect(write).toHaveBeenCalled();
  });

  it.each(["IDEMPOTENCY_CONFLICT", "SUBSCRIPTION_LIMIT_REACHED", "PURCHASE_ALREADY_RESPONDED"])(
    "does not throw for the SCREAMING_SNAKE_CASE error category %s, despite its length",
    (category) => {
      expect(() => log({ ...baseEntry, errorCode: category })).not.toThrow();
      expect(write).toHaveBeenCalled();
    },
  );

  it.each(["idempotency_conflict", "validation_failed", "unexpected_error", "domain_error"])(
    "does not throw for the dispatcher's own lower_snake_case result label %s, despite its length",
    (result) => {
      expect(() => log({ ...baseEntry, result })).not.toThrow();
      expect(write).toHaveBeenCalled();
    },
  );
});
