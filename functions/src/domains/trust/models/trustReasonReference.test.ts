import { describe, expect, it } from "vitest";
import { createTrustReasonReference } from "./trustReasonReference";
import { TrustDomainError } from "./trustErrors";

const baseParams = {
  category: "customer_authenticated" as const,
  eventId: "evt-1",
  correlationId: "corr-1",
  occurredAt: new Date("2026-08-01T00:00:00.000Z"),
};

describe("createTrustReasonReference", () => {
  it("accepts a well-formed authentication-signal evidence reference", () => {
    const reference = createTrustReasonReference(baseParams);
    expect(reference).toEqual(baseParams);
  });

  it("accepts a recovery-proof evidence reference (AD-ITM-2: evidence only, neutral)", () => {
    const reference = createTrustReasonReference({
      ...baseParams,
      category: "authentication_recovery_proof_provided",
    });
    expect(reference.category).toBe("authentication_recovery_proof_provided");
  });

  it("carries no progression/trust-movement field of any kind (AD-ITM-2 neutrality)", () => {
    const reference = createTrustReasonReference(baseParams) as unknown as Record<string, unknown>;
    expect(reference.direction).toBeUndefined();
    expect(reference.trustImpact).toBeUndefined();
    expect(reference.delta).toBeUndefined();
    expect(reference.weight).toBeUndefined();
    expect(Object.keys(reference).sort()).toEqual(
      ["category", "correlationId", "eventId", "occurredAt"].sort(),
    );
  });

  it("rejects an unrecognised category", () => {
    expect(() =>
      createTrustReasonReference({ ...baseParams, category: "purchase_history" as never }),
    ).toThrow(TrustDomainError);
  });

  it("rejects a blank eventId", () => {
    expect(() => createTrustReasonReference({ ...baseParams, eventId: "" })).toThrow(
      TrustDomainError,
    );
  });

  it("rejects a blank correlationId", () => {
    expect(() => createTrustReasonReference({ ...baseParams, correlationId: "  " })).toThrow(
      TrustDomainError,
    );
  });

  it("rejects an invalid occurredAt", () => {
    expect(() =>
      createTrustReasonReference({ ...baseParams, occurredAt: new Date("not-a-date") }),
    ).toThrow(TrustDomainError);
  });
});
