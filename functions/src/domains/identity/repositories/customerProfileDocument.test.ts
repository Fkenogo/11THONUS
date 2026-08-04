import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";
import { fromCustomerProfileDocument } from "./customerProfileDocument";
import { IdentityDomainError } from "../models/identityErrors";

const now = Timestamp.fromDate(new Date("2026-08-04T00:00:00.000Z"));

describe("fromCustomerProfileDocument", () => {
  it("parses a minimal shell document (loyaltyNumber/qrReference optional)", () => {
    const raw = {
      id: "cust_1",
      userId: "cust_1",
      schemaVersion: 1,
      status: "active",
      createdAt: now,
      createdBy: "cust_1",
      updatedAt: now,
      updatedBy: "cust_1",
    };
    const profile = fromCustomerProfileDocument(raw);
    expect(profile.id).toBe("cust_1");
    expect(profile.userId).toBe("cust_1");
    expect(profile.loyaltyNumber).toBeUndefined();
    expect(profile.qrReference).toBeUndefined();
  });

  it("parses a shell document carrying loyaltyNumber and qrReference", () => {
    const raw = {
      id: "cust_1",
      userId: "cust_1",
      loyaltyNumber: "ABC234",
      qrReference: "ref1",
      schemaVersion: 1,
      status: "active",
      createdAt: now,
      createdBy: "cust_1",
      updatedAt: now,
      updatedBy: "cust_1",
    };
    const profile = fromCustomerProfileDocument(raw);
    expect(profile.loyaltyNumber).toBe("ABC234");
    expect(profile.qrReference).toBe("ref1");
  });

  it("rejects a malformed document missing userId", () => {
    expect(() => fromCustomerProfileDocument({ id: "cust_1" })).toThrow(IdentityDomainError);
  });
});
