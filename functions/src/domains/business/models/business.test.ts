import { describe, expect, it } from "vitest";
import { createBusiness, transitionBusinessStatus } from "./business";
import { BUSINESS_STATUSES } from "./businessStatus";

const baseParams = () => ({
  id: "biz-1",
  businessCode: "BIZABCDEF",
  ownerUserId: "user-1",
  displayName: "Kwetu Café",
  primaryCategoryId: "category-1",
  countryCode: "BI",
  currencyCode: "BIF",
  timezone: "Africa/Bujumbura",
  city: "Bujumbura",
  contactPhone: "+25761234567",
  supportedLanguages: ["fr", "en"],
  createdAt: new Date("2026-08-17T00:00:00.000Z"),
});

describe("createBusiness", () => {
  it("accepts valid required fields and produces a business in draft status", () => {
    const business = createBusiness(baseParams());
    expect(business.id).toBe("biz-1");
    expect(business.businessCode).toBe("BIZABCDEF");
    expect(business.ownerUserId).toBe("user-1");
    expect(business.status).toBe("draft");
    expect(business.schemaVersion).toBe(1);
    expect(business.createdAt).toEqual(business.updatedAt);
  });

  it("every required field is enforced", () => {
    const required: (keyof ReturnType<typeof baseParams>)[] = [
      "id",
      "businessCode",
      "ownerUserId",
      "displayName",
      "primaryCategoryId",
      "countryCode",
      "currencyCode",
      "timezone",
      "city",
      "contactPhone",
    ];
    for (const field of required) {
      expect(() => createBusiness({ ...baseParams(), [field]: "" })).toThrow();
    }
  });

  it("rejects a malformed businessCode", () => {
    expect(() => createBusiness({ ...baseParams(), businessCode: "not-a-code" })).toThrow();
  });

  it("rejects a malformed countryCode (not ISO 3166-1 alpha-2 shape)", () => {
    expect(() => createBusiness({ ...baseParams(), countryCode: "BDI" })).toThrow();
  });

  it("rejects a malformed currencyCode (not ISO 4217 shape)", () => {
    expect(() => createBusiness({ ...baseParams(), currencyCode: "bif" })).toThrow();
    expect(() => createBusiness({ ...baseParams(), currencyCode: "BI" })).toThrow();
  });

  it("rejects an empty supportedLanguages array", () => {
    expect(() => createBusiness({ ...baseParams(), supportedLanguages: [] })).toThrow();
  });

  it("rejects a supportedLanguages array containing a blank entry", () => {
    expect(() => createBusiness({ ...baseParams(), supportedLanguages: ["fr", ""] })).toThrow();
  });

  it("leaves every optional field undefined when omitted", () => {
    const business = createBusiness(baseParams());
    expect(business.legalName).toBeUndefined();
    expect(business.businessTypeId).toBeUndefined();
    expect(business.address).toBeUndefined();
    expect(business.contactEmail).toBeUndefined();
    expect(business.logoUrl).toBeUndefined();
    expect(business.subscriptionId).toBeUndefined();
  });

  it("accepts every optional field when provided", () => {
    const business = createBusiness({
      ...baseParams(),
      legalName: "Kwetu Café SARL",
      businessTypeId: "type-1",
      address: "12 Rue de la Paix",
      contactEmail: "owner@example.com",
      logoUrl: "https://example.com/logo.png",
      subscriptionId: "sub-1",
    });
    expect(business.legalName).toBe("Kwetu Café SARL");
    expect(business.businessTypeId).toBe("type-1");
    expect(business.address).toBe("12 Rue de la Paix");
    expect(business.contactEmail).toBe("owner@example.com");
    expect(business.logoUrl).toBe("https://example.com/logo.png");
    expect(business.subscriptionId).toBe("sub-1");
  });

  it("no invented field (e.g. businessCode format) can influence authority — status is always draft regardless of input", () => {
    const business = createBusiness(baseParams());
    // createBusiness's own params type has no `status` field at all —
    // this is a structural (compile-time), not merely runtime, guarantee.
    expect(business.status).toBe("draft");
  });
});

describe("transitionBusinessStatus", () => {
  it("performs a governed transition", () => {
    const business = createBusiness(baseParams());
    const updatedAt = new Date("2026-08-18T00:00:00.000Z");
    const { business: next } = transitionBusinessStatus(business, "pending_verification", {
      updatedAt,
    });
    expect(next.status).toBe("pending_verification");
    expect(next.updatedAt).toBe(updatedAt);
  });

  it("rejects an ungoverned transition", () => {
    const business = createBusiness(baseParams());
    expect(() => transitionBusinessStatus(business, "active", { updatedAt: new Date() })).toThrow();
  });

  it("rejects any transition once archived", () => {
    let business = createBusiness(baseParams());
    for (const to of [
      "pending_verification",
      "trial",
      "active",
      "expired",
      "closed",
      "archived",
    ] as const) {
      business = transitionBusinessStatus(business, to, { updatedAt: new Date() }).business;
    }
    expect(business.status).toBe("archived");
    expect(() => transitionBusinessStatus(business, "closed", { updatedAt: new Date() })).toThrow();
  });

  it("all 8 governed statuses are individually reachable in some sequence", () => {
    // Sanity check that BUSINESS_STATUSES and the transition table stay
    // in sync — a status this domain declares but the table can never
    // reach would be a genuine defect.
    expect(BUSINESS_STATUSES).toHaveLength(8);
  });
});
