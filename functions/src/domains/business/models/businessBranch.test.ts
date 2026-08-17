import { describe, expect, it } from "vitest";
import { createBusinessBranch } from "./businessBranch";

const baseParams = () => ({
  id: "branch-1",
  businessId: "biz-1",
  displayName: "Main Street",
  countryCode: "BI",
  city: "Bujumbura",
  createdAt: new Date("2026-08-17T00:00:00.000Z"),
});

describe("createBusinessBranch", () => {
  it("accepts a valid minimal branch (address omitted)", () => {
    const branch = createBusinessBranch(baseParams());
    expect(branch).toEqual({
      id: "branch-1",
      businessId: "biz-1",
      displayName: "Main Street",
      countryCode: "BI",
      city: "Bujumbura",
      address: undefined,
      createdAt: baseParams().createdAt,
      updatedAt: baseParams().createdAt,
      schemaVersion: 1,
    });
  });

  it("accepts an optional address", () => {
    const branch = createBusinessBranch({ ...baseParams(), address: "12 Rue de la Paix" });
    expect(branch.address).toBe("12 Rue de la Paix");
  });

  it("sets createdAt and updatedAt equal at creation", () => {
    const branch = createBusinessBranch(baseParams());
    expect(branch.updatedAt).toBe(branch.createdAt);
  });

  it("rejects a blank id", () => {
    expect(() => createBusinessBranch({ ...baseParams(), id: "" })).toThrow();
  });

  it("rejects a blank businessId", () => {
    expect(() => createBusinessBranch({ ...baseParams(), businessId: "  " })).toThrow();
  });

  it("rejects a blank displayName", () => {
    expect(() => createBusinessBranch({ ...baseParams(), displayName: "" })).toThrow();
  });

  it("rejects a malformed countryCode (not ISO 3166-1 alpha-2 shape)", () => {
    expect(() => createBusinessBranch({ ...baseParams(), countryCode: "BDI" })).toThrow();
    expect(() => createBusinessBranch({ ...baseParams(), countryCode: "bi" })).toThrow();
    expect(() => createBusinessBranch({ ...baseParams(), countryCode: "" })).toThrow();
  });

  it("rejects a blank city", () => {
    expect(() => createBusinessBranch({ ...baseParams(), city: "" })).toThrow();
  });

  it("has no isPrimary field on the returned shape", () => {
    const branch = createBusinessBranch(baseParams());
    expect(branch).not.toHaveProperty("isPrimary");
  });

  it("has no status field on the returned shape", () => {
    const branch = createBusinessBranch(baseParams());
    expect(branch).not.toHaveProperty("status");
  });

  it("has no timezone field on the returned shape", () => {
    const branch = createBusinessBranch(baseParams());
    expect(branch).not.toHaveProperty("timezone");
  });

  it("has no branchCode field on the returned shape", () => {
    const branch = createBusinessBranch(baseParams());
    expect(branch).not.toHaveProperty("branchCode");
  });
});
