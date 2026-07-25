import { describe, expect, it } from "vitest";
import type { OperationalLog } from "./operationalLog";

describe("OperationalLog", () => {
  it("accepts an entry with only the required fields", () => {
    const entry: OperationalLog = {
      timestamp: "2026-07-25T00:00:00.000Z",
      environment: "staging",
      severity: "info",
      domain: "shared",
      service: "commandDispatcher",
      operation: "dispatch",
      correlationId: "corr-1",
    };

    expect(entry.severity).toBe("info");
  });

  it("accepts an entry with every optional field populated", () => {
    const entry: OperationalLog = {
      timestamp: "2026-07-25T00:00:00.000Z",
      environment: "staging",
      severity: "error",
      domain: "shared",
      service: "commandDispatcher",
      operation: "dispatch",
      correlationId: "corr-1",
      commandId: "cmd-1",
      eventId: "evt-1",
      actorId: "actor-1",
      businessId: "biz-1",
      customerId: "cust-1",
      aggregateType: "Purchase",
      aggregateId: "agg-1",
      result: "failed",
      durationMs: 42,
      errorCode: "VALIDATION_FAILED",
    };

    expect(Object.keys(entry)).toHaveLength(17);
  });
});
