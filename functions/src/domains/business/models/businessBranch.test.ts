import { describe, expect, it } from "vitest";
import { createBusinessBranch, updateBusinessBranchProfile } from "./businessBranch";

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

describe("updateBusinessBranchProfile (ENG-P2-002C)", () => {
  const updatedAt = new Date("2026-08-19T00:00:00.000Z");

  it("updates only the supplied mutable fields", () => {
    const branch = createBusinessBranch(baseParams());
    const updated = updateBusinessBranchProfile(branch, { displayName: "New Branch", updatedAt });
    expect(updated.displayName).toBe("New Branch");
    expect(updated.updatedAt).toBe(updatedAt);
    expect(updated.city).toBe(branch.city);
    expect(updated.countryCode).toBe(branch.countryCode);
  });

  it("re-validates the resulting state", () => {
    const branch = createBusinessBranch(baseParams());
    expect(() => updateBusinessBranchProfile(branch, { displayName: "", updatedAt })).toThrow();
    expect(() => updateBusinessBranchProfile(branch, { city: "", updatedAt })).toThrow();
    expect(() => updateBusinessBranchProfile(branch, { countryCode: "bi", updatedAt })).toThrow();
  });

  it("allows clearing address back to undefined", () => {
    const branch = createBusinessBranch({ ...baseParams(), address: "123 Main St" });
    const updated = updateBusinessBranchProfile(branch, { address: undefined, updatedAt });
    expect(updated.address).toBeUndefined();
  });

  it("the params type has no id/businessId/createdAt/schemaVersion key at all", () => {
    const branch = createBusinessBranch(baseParams());
    // @ts-expect-error — id is not part of the update-params shape.
    updateBusinessBranchProfile(branch, { id: "attacker-id", updatedAt });
    // @ts-expect-error — businessId is not part of the update-params shape.
    updateBusinessBranchProfile(branch, { businessId: "attacker-business", updatedAt });
    // @ts-expect-error — createdAt is not part of the update-params shape.
    updateBusinessBranchProfile(branch, { createdAt: new Date(0), updatedAt });
    // @ts-expect-error — schemaVersion is not part of the update-params shape.
    updateBusinessBranchProfile(branch, { schemaVersion: 999, updatedAt });
  });

  it("runtime: forged params never move id/businessId/createdAt/schemaVersion", () => {
    const branch = createBusinessBranch(baseParams());
    const forged = {
      displayName: "Legit Update",
      updatedAt,
      id: "attacker-id",
      businessId: "attacker-business",
      createdAt: new Date(0),
      schemaVersion: 999,
    } as unknown as Parameters<typeof updateBusinessBranchProfile>[1];

    const updated = updateBusinessBranchProfile(branch, forged);

    expect(updated.id).toBe(branch.id);
    expect(updated.businessId).toBe(branch.businessId);
    expect(updated.createdAt).toBe(branch.createdAt);
    expect(updated.schemaVersion).toBe(branch.schemaVersion);
    expect(updated.displayName).toBe("Legit Update");
  });
});
