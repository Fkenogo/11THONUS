import { describe, expect, it } from "vitest";
import {
  issueQrIdentity,
  regenerateQrIdentity,
  restoreQrIdentityForRecovery,
} from "./qrIdentityAssociationService";
import { QrIdentityDomainError } from "../models/qrIdentityErrors";
import type { QrReferenceGenerator } from "./qrReferenceGenerator";

const actor = { actorType: "system" as const, actorId: "qr-identity-service" };
const envelope = {
  eventId: "evt-1",
  correlationId: "corr-1",
  actor,
  occurredAt: "2026-08-04T00:00:00.000Z",
};
const now = new Date("2026-08-04T00:00:00.000Z");

class FixedSequenceGenerator implements QrReferenceGenerator {
  private index = 0;
  constructor(private readonly sequence: string[]) {}
  generateReference(): string {
    const value = this.sequence[this.index];
    if (value === undefined) {
      throw new Error("FixedSequenceGenerator exhausted");
    }
    this.index += 1;
    return value;
  }
}

describe("issueQrIdentity", () => {
  it("issues a new active association for an identity with no existing QR", () => {
    const result = issueQrIdentity({
      ...envelope,
      customerIdentityId: "cust_1",
      loyaltyNumber: "ABC-234",
      issuedAt: now,
      generator: new FixedSequenceGenerator(["ref1"]),
    });

    expect(result.association.customerIdentityId).toBe("cust_1");
    expect(result.association.loyaltyNumber).toBe("ABC234");
    expect(result.association.qrReference).toBe("ref1");
    expect(result.association.status).toBe("active");
    expect(result.association.issuedAt).toBe(now);
  });

  it("emits exactly one QrIdentityIssued event", () => {
    const result = issueQrIdentity({
      ...envelope,
      customerIdentityId: "cust_1",
      loyaltyNumber: "ABC-234",
      issuedAt: now,
      generator: new FixedSequenceGenerator(["ref1"]),
    });

    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.eventType).toBe("qrIdentity.qr_identity_issued.v1");
  });

  it("carries the QR belonging to exactly one identity — different identities get different associations", () => {
    const first = issueQrIdentity({
      ...envelope,
      customerIdentityId: "cust_1",
      loyaltyNumber: "ABC-234",
      issuedAt: now,
      generator: new FixedSequenceGenerator(["ref1"]),
    });
    const second = issueQrIdentity({
      ...envelope,
      customerIdentityId: "cust_2",
      loyaltyNumber: "DEF-567",
      issuedAt: now,
      generator: new FixedSequenceGenerator(["ref2"]),
    });

    expect(first.association.customerIdentityId).toBe("cust_1");
    expect(second.association.customerIdentityId).toBe("cust_2");
    expect(first.association.qrReference).not.toBe(second.association.qrReference);
  });

  it("does not create the identity or the loyalty number — both are required inputs, never generated here", () => {
    const result = issueQrIdentity({
      ...envelope,
      customerIdentityId: "cust_1",
      loyaltyNumber: "ABC-234",
      issuedAt: now,
      generator: new FixedSequenceGenerator(["ref1"]),
    });
    expect(result.association.loyaltyNumber).toBe("ABC234");
  });

  it("rejects duplicate issuance when an active association already exists for the identity", () => {
    const existingAssociation = {
      customerIdentityId: "cust_1",
      loyaltyNumber: "ABC234",
      qrReference: "ref1",
      status: "active" as const,
      issuedAt: now,
    };

    expect(() =>
      issueQrIdentity({
        ...envelope,
        customerIdentityId: "cust_1",
        loyaltyNumber: "ABC-234",
        issuedAt: now,
        existingAssociation,
        generator: new FixedSequenceGenerator([]),
      }),
    ).toThrow(QrIdentityDomainError);
  });

  it("rejects issuance when an existing association belongs to a different identity", () => {
    const existingAssociation = {
      customerIdentityId: "cust_OTHER",
      loyaltyNumber: "ABC234",
      qrReference: "ref1",
      status: "active" as const,
      issuedAt: now,
    };

    expect(() =>
      issueQrIdentity({
        ...envelope,
        customerIdentityId: "cust_1",
        loyaltyNumber: "ABC-234",
        issuedAt: now,
        existingAssociation,
        generator: new FixedSequenceGenerator([]),
      }),
    ).toThrow(QrIdentityDomainError);
  });

  it("rejects an invalid customer identity id", () => {
    expect(() =>
      issueQrIdentity({
        ...envelope,
        customerIdentityId: "",
        loyaltyNumber: "ABC-234",
        issuedAt: now,
        generator: new FixedSequenceGenerator([]),
      }),
    ).toThrow(QrIdentityDomainError);
  });

  it("rejects an invalid loyalty number", () => {
    expect(() =>
      issueQrIdentity({
        ...envelope,
        customerIdentityId: "cust_1",
        loyaltyNumber: "not-a-loyalty-number",
        issuedAt: now,
        generator: new FixedSequenceGenerator([]),
      }),
    ).toThrow(QrIdentityDomainError);
  });

  it("has no authentication semantics — the association carries no verification/trust/credential field", () => {
    const result = issueQrIdentity({
      ...envelope,
      customerIdentityId: "cust_1",
      loyaltyNumber: "ABC-234",
      issuedAt: now,
      generator: new FixedSequenceGenerator(["ref1"]),
    });
    expect(Object.keys(result.association).sort()).toEqual(
      ["customerIdentityId", "issuedAt", "loyaltyNumber", "qrReference", "status"].sort(),
    );
  });
});

describe("regenerateQrIdentity", () => {
  const activeAssociation = {
    customerIdentityId: "cust_1",
    loyaltyNumber: "ABC234",
    qrReference: "ref1",
    status: "active" as const,
    issuedAt: now,
  };

  it("produces a new active association and invalidates the prior one", () => {
    const result = regenerateQrIdentity({
      ...envelope,
      current: activeAssociation,
      regeneratedAt: now,
      generator: new FixedSequenceGenerator(["ref2"]),
    });

    expect(result.active.qrReference).toBe("ref2");
    expect(result.active.status).toBe("active");
    expect(result.invalidated.qrReference).toBe("ref1");
    expect(result.invalidated.status).toBe("invalidated");
  });

  it("preserves identity permanence — customerIdentityId never changes across regeneration", () => {
    const result = regenerateQrIdentity({
      ...envelope,
      current: activeAssociation,
      regeneratedAt: now,
      generator: new FixedSequenceGenerator(["ref2"]),
    });
    expect(result.active.customerIdentityId).toBe("cust_1");
    expect(result.invalidated.customerIdentityId).toBe("cust_1");
  });

  it("preserves loyalty-number permanence — the loyalty number never changes across regeneration", () => {
    const result = regenerateQrIdentity({
      ...envelope,
      current: activeAssociation,
      regeneratedAt: now,
      generator: new FixedSequenceGenerator(["ref2"]),
    });
    expect(result.active.loyaltyNumber).toBe("ABC234");
    expect(result.invalidated.loyaltyNumber).toBe("ABC234");
  });

  it("the old reference fails to resolve (behaviourally: it is marked invalidated, distinct status from active)", () => {
    const result = regenerateQrIdentity({
      ...envelope,
      current: activeAssociation,
      regeneratedAt: now,
      generator: new FixedSequenceGenerator(["ref2"]),
    });
    expect(result.invalidated.status).not.toBe("active");
  });

  it("emits QrIdentityInvalidated and QrIdentityRegenerated events", () => {
    const result = regenerateQrIdentity({
      ...envelope,
      current: activeAssociation,
      regeneratedAt: now,
      generator: new FixedSequenceGenerator(["ref2"]),
    });
    const eventTypes = result.events.map((e) => e.eventType);
    expect(eventTypes).toContain("qrIdentity.qr_identity_invalidated.v1");
    expect(eventTypes).toContain("qrIdentity.qr_identity_regenerated.v1");
  });

  it("rejects regeneration of an already-invalidated association (prohibited transition)", () => {
    const invalidated = { ...activeAssociation, status: "invalidated" as const };
    expect(() =>
      regenerateQrIdentity({
        ...envelope,
        current: invalidated,
        regeneratedAt: now,
        generator: new FixedSequenceGenerator(["ref2"]),
      }),
    ).toThrow(QrIdentityDomainError);
  });
});

describe("restoreQrIdentityForRecovery", () => {
  it("restores the existing association unchanged — never creates a new QR or identity", () => {
    const current = {
      customerIdentityId: "cust_1",
      loyaltyNumber: "ABC234",
      qrReference: "ref1",
      status: "active" as const,
      issuedAt: now,
    };
    const restored = restoreQrIdentityForRecovery(current);
    expect(restored).toEqual(current);
    expect(restored).toBe(current);
  });
});
