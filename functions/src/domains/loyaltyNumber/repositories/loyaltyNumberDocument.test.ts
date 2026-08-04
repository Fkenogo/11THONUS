import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";
import { toLoyaltyNumberDocument, fromLoyaltyNumberDocument } from "./loyaltyNumberDocument";
import { LoyaltyNumberDomainError } from "../models/loyaltyNumberErrors";
import type { LoyaltyNumberAssignment } from "../services/loyaltyNumberIssuanceService";

const now = Timestamp.fromDate(new Date("2026-08-04T00:00:00.000Z"));

function buildAssignment(): LoyaltyNumberAssignment {
  return {
    customerIdentityId: "cust_1",
    loyaltyNumber: "ABC234",
    assignedAt: new Date("2026-08-04T00:00:00.000Z"),
  };
}

describe("toLoyaltyNumberDocument", () => {
  it("uses the loyalty number value as the document id", () => {
    const doc = toLoyaltyNumberDocument(buildAssignment(), "cust_1");
    expect(doc.id).toBe("ABC234");
    expect(doc.loyaltyNumber).toBe("ABC234");
    expect(doc.customerIdentityId).toBe("cust_1");
  });
});

describe("fromLoyaltyNumberDocument", () => {
  it("round-trips a valid document back into a LoyaltyNumberAssignment", () => {
    const raw = {
      id: "ABC234",
      schemaVersion: 1,
      status: "active",
      loyaltyNumber: "ABC234",
      customerIdentityId: "cust_1",
      issuedAt: now,
      createdAt: now,
      createdBy: "cust_1",
      updatedAt: now,
      updatedBy: "cust_1",
    };

    const assignment = fromLoyaltyNumberDocument(raw);
    expect(assignment.loyaltyNumber).toBe("ABC234");
    expect(assignment.customerIdentityId).toBe("cust_1");
    expect(assignment.assignedAt).toBeInstanceOf(Date);
  });

  it("rejects a malformed document missing customerIdentityId", () => {
    expect(() => fromLoyaltyNumberDocument({ id: "ABC234" })).toThrow(LoyaltyNumberDomainError);
  });
});
