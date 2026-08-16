import { describe, expect, it } from "vitest";
import { createTrustRecord, type CreateTrustRecordParams } from "./trustRecord";
import { TrustDomainError } from "./trustErrors";

const now = new Date("2026-08-16T00:00:00.000Z");

function baseParams(overrides: Partial<CreateTrustRecordParams> = {}): CreateTrustRecordParams {
  return {
    trustRecordId: "trust-record-1",
    customerIdentityId: "customer-1",
    verificationState: { phoneVerified: false, emailVerified: false },
    signalState: { hasSuccessfulAuthentication: false },
    trustLevel: "unverified",
    version: 1,
    status: "active",
    reasonReferences: [],
    createdAt: now,
    createdBy: null,
    updatedAt: now,
    updatedBy: null,
    ...overrides,
  };
}

describe("createTrustRecord", () => {
  it("accepts a valid minimal trust record", () => {
    const record = createTrustRecord(baseParams());
    expect(record.trustRecordId).toBe("trust-record-1");
    expect(record.customerIdentityId).toBe("customer-1");
    expect(record.trustLevel).toBe("unverified");
    expect(record.status).toBe("active");
    expect(record.reasonReferences).toEqual([]);
  });

  it("accepts a record with authentication evidence and a provisional level", () => {
    const record = createTrustRecord(
      baseParams({
        trustLevel: "provisional",
        signalState: { hasSuccessfulAuthentication: true },
        reasonReferences: [
          {
            category: "customer_authenticated",
            eventId: "evt-1",
            correlationId: "corr-1",
            occurredAt: now,
          },
        ],
      }),
    );
    expect(record.trustLevel).toBe("provisional");
    expect(record.reasonReferences).toHaveLength(1);
  });

  it("accepts recovery-proof evidence without it affecting trust level (AD-ITM-2)", () => {
    const record = createTrustRecord(
      baseParams({
        trustLevel: "unverified",
        reasonReferences: [
          {
            category: "authentication_recovery_proof_provided",
            eventId: "evt-2",
            correlationId: "corr-2",
            occurredAt: now,
          },
        ],
      }),
    );
    expect(record.trustLevel).toBe("unverified");
    expect(record.reasonReferences[0].category).toBe("authentication_recovery_proof_provided");
  });

  it("rejects a blank trustRecordId", () => {
    expect(() => createTrustRecord(baseParams({ trustRecordId: "" }))).toThrow(TrustDomainError);
  });

  it("rejects a whitespace-only trustRecordId", () => {
    expect(() => createTrustRecord(baseParams({ trustRecordId: "   " }))).toThrow(TrustDomainError);
  });

  it("rejects a blank customerIdentityId reference", () => {
    expect(() => createTrustRecord(baseParams({ customerIdentityId: "" }))).toThrow(
      TrustDomainError,
    );
  });

  it("rejects an unrecognised trustLevel", () => {
    expect(() => createTrustRecord(baseParams({ trustLevel: "gold" }))).toThrow(TrustDomainError);
  });

  it("rejects duplicate evidence with the same eventId (idempotency-key identity)", () => {
    const duplicateEvidence = [
      {
        category: "customer_authenticated" as const,
        eventId: "evt-1",
        correlationId: "corr-1",
        occurredAt: now,
      },
      {
        category: "customer_authenticated" as const,
        eventId: "evt-1",
        correlationId: "corr-2",
        occurredAt: now,
      },
    ];
    expect(() => createTrustRecord(baseParams({ reasonReferences: duplicateEvidence }))).toThrow(
      TrustDomainError,
    );
  });

  it("rejects malformed evidence (unrecognised category)", () => {
    expect(() =>
      createTrustRecord(
        baseParams({
          reasonReferences: [
            {
              category: "purchase_history" as never,
              eventId: "evt-1",
              correlationId: "corr-1",
              occurredAt: now,
            },
          ],
        }),
      ),
    ).toThrow(TrustDomainError);
  });

  it("rejects a malformed (non-positive) version", () => {
    expect(() => createTrustRecord(baseParams({ version: 0 }))).toThrow(TrustDomainError);
  });

  it("rejects an unrecognised status", () => {
    expect(() => createTrustRecord(baseParams({ status: "banned" }))).toThrow(TrustDomainError);
  });

  it("rejects updatedAt earlier than createdAt", () => {
    expect(() =>
      createTrustRecord(
        baseParams({
          createdAt: now,
          updatedAt: new Date(now.getTime() - 1000),
        }),
      ),
    ).toThrow(TrustDomainError);
  });

  it("has no numeric-score field on the public contract", () => {
    const record = createTrustRecord(baseParams()) as unknown as Record<string, unknown>;
    expect(record.trustScore).toBeUndefined();
    expect(record.score).toBeUndefined();
    expect(record.riskScore).toBeUndefined();
  });

  it("has no PII/credential field on the public contract", () => {
    const record = createTrustRecord(baseParams()) as unknown as Record<string, unknown>;
    expect(record.email).toBeUndefined();
    expect(record.phoneNumber).toBeUndefined();
    expect(record.password).toBeUndefined();
    expect(record.token).toBeUndefined();
    expect(record.otp).toBeUndefined();
  });

  it("has no operator-visibility field on the public contract", () => {
    const record = createTrustRecord(baseParams()) as unknown as Record<string, unknown>;
    expect(record.operatorNote).toBeUndefined();
    expect(record.visibleToOperator).toBeUndefined();
  });

  it("exposes the exact expected field set (closed shape)", () => {
    const record = createTrustRecord(baseParams());
    expect(Object.keys(record).sort()).toEqual(
      [
        "trustRecordId",
        "customerIdentityId",
        "verificationState",
        "signalState",
        "trustLevel",
        "version",
        "status",
        "reasonReferences",
        "createdAt",
        "createdBy",
        "updatedAt",
        "updatedBy",
      ].sort(),
    );
  });
});
