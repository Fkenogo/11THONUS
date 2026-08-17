import { describe, expect, it } from "vitest";
import { createBusinessBranch } from "./businessBranch";
import {
  fromBusinessBranchDocument,
  toBusinessBranchDocumentFields,
} from "./businessBranchDocument";

function timestampLike(date: Date) {
  return { toDate: () => date };
}

describe("fromBusinessBranchDocument", () => {
  const validRaw = {
    businessId: "biz-1",
    displayName: "Main Street",
    countryCode: "BI",
    city: "Bujumbura",
    createdAt: timestampLike(new Date("2026-08-17T00:00:00.000Z")),
    updatedAt: timestampLike(new Date("2026-08-17T00:00:00.000Z")),
    schemaVersion: 1,
  };

  it("parses a valid raw document", () => {
    const branch = fromBusinessBranchDocument("branch-1", validRaw);
    expect(branch).toEqual({
      id: "branch-1",
      businessId: "biz-1",
      displayName: "Main Street",
      countryCode: "BI",
      city: "Bujumbura",
      address: undefined,
      createdAt: new Date("2026-08-17T00:00:00.000Z"),
      updatedAt: new Date("2026-08-17T00:00:00.000Z"),
      schemaVersion: 1,
    });
  });

  it("parses an optional address when present", () => {
    const branch = fromBusinessBranchDocument("branch-1", { ...validRaw, address: "12 Rue" });
    expect(branch?.address).toBe("12 Rue");
  });

  it("returns null (never throws) for a structurally invalid document", () => {
    expect(fromBusinessBranchDocument("branch-1", {})).toBeNull();
    expect(
      fromBusinessBranchDocument("branch-1", { ...validRaw, businessId: undefined }),
    ).toBeNull();
    expect(
      fromBusinessBranchDocument("branch-1", { ...validRaw, createdAt: "not-a-timestamp" }),
    ).toBeNull();
    expect(() => fromBusinessBranchDocument("branch-1", null)).not.toThrow();
  });

  it("returns null for a document carrying a stray isPrimary/status/timezone/branchCode field's absence is fine, but wrong-typed required fields fail closed", () => {
    expect(fromBusinessBranchDocument("branch-1", { ...validRaw, schemaVersion: "1" })).toBeNull();
  });
});

describe("toBusinessBranchDocumentFields", () => {
  it("round-trips a domain value into a plain Firestore-shaped object using Date (no Timestamp)", () => {
    const branch = createBusinessBranch({
      id: "branch-1",
      businessId: "biz-1",
      displayName: "Main Street",
      countryCode: "BI",
      city: "Bujumbura",
      createdAt: new Date("2026-08-17T00:00:00.000Z"),
    });

    const fields = toBusinessBranchDocumentFields(branch);
    expect(fields).toEqual({
      businessId: "biz-1",
      displayName: "Main Street",
      countryCode: "BI",
      city: "Bujumbura",
      address: undefined,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
      schemaVersion: 1,
    });
    expect(fields.createdAt).toBeInstanceOf(Date);
    expect(fields).not.toHaveProperty("id");
  });
});
