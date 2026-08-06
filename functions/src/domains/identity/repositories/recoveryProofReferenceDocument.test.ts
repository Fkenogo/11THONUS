import { describe, expect, it } from "vitest";
import { toRecoveryProofReferenceDocument } from "./recoveryProofReferenceDocument";

describe("toRecoveryProofReferenceDocument", () => {
  it("uses the proof reference value as the document id", () => {
    const doc = toRecoveryProofReferenceDocument("proof_cust_1", "cust_1", "support_1");
    expect(doc.id).toBe("proof_cust_1");
    expect(doc.proofReference).toBe("proof_cust_1");
    expect(doc.customerIdentityId).toBe("cust_1");
  });

  it("carries the full BaseMetadata creation shape", () => {
    const doc = toRecoveryProofReferenceDocument("proof_cust_2", "cust_2", "support_1");
    expect(doc.schemaVersion).toBe(1);
    expect(doc.status).toBe("active");
    expect(doc).toHaveProperty("createdAt");
    expect(doc).toHaveProperty("createdBy", "support_1");
    expect(doc).toHaveProperty("updatedAt");
    expect(doc).toHaveProperty("updatedBy", "support_1");
  });

  it("accepts a null actor for system-initiated recovery", () => {
    const doc = toRecoveryProofReferenceDocument("proof_cust_3", "cust_3", null);
    expect(doc.createdBy).toBeNull();
    expect(doc.updatedBy).toBeNull();
  });

  it("writes no field beyond the governed BaseMetadata plus the two domain fields", () => {
    const doc = toRecoveryProofReferenceDocument("proof_cust_4", "cust_4", "support_1");
    expect(Object.keys(doc).sort()).toEqual(
      [
        "id",
        "schemaVersion",
        "status",
        "proofReference",
        "customerIdentityId",
        "createdAt",
        "createdBy",
        "updatedAt",
        "updatedBy",
      ].sort(),
    );
  });
});
