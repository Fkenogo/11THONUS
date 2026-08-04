import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";
import {
  toQrIdentityRecordDocument,
  fromQrIdentityRecordDocument,
} from "./qrIdentityRecordDocument";
import { QrIdentityDomainError } from "../models/qrIdentityErrors";
import type { QrIdentityAssociation } from "../services/qrIdentityAssociationService";

const now = Timestamp.fromDate(new Date("2026-08-04T00:00:00.000Z"));

function buildAssociation(): QrIdentityAssociation {
  return {
    customerIdentityId: "cust_1",
    loyaltyNumber: "ABC234",
    qrReference: "ref_1",
    status: "active",
    issuedAt: new Date("2026-08-04T00:00:00.000Z"),
  };
}

describe("toQrIdentityRecordDocument", () => {
  it("uses the qrReference value as the document id", () => {
    const doc = toQrIdentityRecordDocument(buildAssociation(), "cust_1");
    expect(doc.id).toBe("ref_1");
    expect(doc.qrReference).toBe("ref_1");
    expect(doc.customerIdentityId).toBe("cust_1");
    expect(doc.loyaltyNumber).toBe("ABC234");
    expect(doc.status).toBe("active");
    expect(doc.replacedByReference ?? null).toBeNull();
  });

  it("carries an invalidated status and replacedByReference when marking a record superseded", () => {
    const doc = toQrIdentityRecordDocument(
      { ...buildAssociation(), status: "invalidated" },
      "cust_1",
      { replacedByReference: "ref_2" },
    );
    expect(doc.status).toBe("invalidated");
    expect(doc.replacedByReference).toBe("ref_2");
  });
});

describe("fromQrIdentityRecordDocument", () => {
  it("round-trips a valid document back into a QrIdentityAssociation", () => {
    const raw = {
      id: "ref_1",
      schemaVersion: 1,
      status: "active",
      qrReference: "ref_1",
      customerIdentityId: "cust_1",
      loyaltyNumber: "ABC234",
      issuedAt: now,
      replacedByReference: null,
      createdAt: now,
      createdBy: "cust_1",
      updatedAt: now,
      updatedBy: "cust_1",
    };

    const association = fromQrIdentityRecordDocument(raw);
    expect(association.qrReference).toBe("ref_1");
    expect(association.customerIdentityId).toBe("cust_1");
    expect(association.loyaltyNumber).toBe("ABC234");
    expect(association.status).toBe("active");
  });

  it("rejects a malformed document missing customerIdentityId", () => {
    expect(() => fromQrIdentityRecordDocument({ id: "ref_1" })).toThrow(QrIdentityDomainError);
  });

  it("rejects a document with an unrecognised status value", () => {
    const raw = {
      id: "ref_1",
      schemaVersion: 1,
      status: "not_a_real_status",
      qrReference: "ref_1",
      customerIdentityId: "cust_1",
      loyaltyNumber: "ABC234",
      issuedAt: now,
      createdAt: now,
      createdBy: "cust_1",
      updatedAt: now,
      updatedBy: "cust_1",
    };
    expect(() => fromQrIdentityRecordDocument(raw)).toThrow(QrIdentityDomainError);
  });
});
