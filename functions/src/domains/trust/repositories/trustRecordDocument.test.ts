import { describe, expect, it } from "vitest";
import { fromTrustRecordDocument, toTrustRecordDocument } from "./trustRecordDocument";
import { createTrustRecord } from "../models/trustRecord";

function fakeTimestamp(date: Date): { toDate: () => Date } {
  return { toDate: () => date };
}

describe("trustRecordDocument (CAP-P2-ITM-B)", () => {
  it("round-trips a trust record through the Firestore document shape", () => {
    const record = createTrustRecord({
      trustRecordId: "cust-1",
      customerIdentityId: "cust-1",
      verificationState: { phoneVerified: false, emailVerified: false },
      signalState: { hasSuccessfulAuthentication: true },
      trustLevel: "provisional",
      version: 2,
      status: "active",
      reasonReferences: [
        {
          category: "customer_authenticated",
          eventId: "evt-1",
          correlationId: "corr-1",
          occurredAt: new Date("2026-08-01T00:00:00.000Z"),
        },
      ],
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      createdBy: null,
      updatedAt: new Date("2026-08-01T00:00:00.000Z"),
      updatedBy: null,
    });

    const document = toTrustRecordDocument(record);

    // Simulate what Firestore hands back: real Date values become
    // Timestamp-like objects with `toDate()`.
    const rawFromFirestore = {
      ...document,
      createdAt: fakeTimestamp(record.createdAt),
      updatedAt: fakeTimestamp(record.updatedAt),
      reasonReferences: document.reasonReferences.map((r) => ({
        ...r,
        occurredAt: fakeTimestamp(record.reasonReferences[0]!.occurredAt),
      })),
    };

    const roundTripped = fromTrustRecordDocument("cust-1", rawFromFirestore);

    expect(roundTripped).toEqual(record);
  });

  it("throws the ITM-A domain error for a malformed persisted document (fails closed)", () => {
    expect(() =>
      fromTrustRecordDocument("cust-1", {
        customerIdentityId: "cust-1",
        verificationState: { phoneVerified: false, emailVerified: false },
        signalState: { hasSuccessfulAuthentication: false },
        trustLevel: "not-a-real-level",
        version: 1,
        status: "active",
        reasonReferences: [],
        createdAt: fakeTimestamp(new Date("2026-07-01T00:00:00.000Z")),
        createdBy: null,
        updatedAt: fakeTimestamp(new Date("2026-07-01T00:00:00.000Z")),
        updatedBy: null,
      }),
    ).toThrow(/not a recognised trust level/);
  });
});
