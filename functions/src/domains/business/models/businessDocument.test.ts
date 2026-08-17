import { describe, expect, it } from "vitest";
import { createBusiness } from "./business";
import { fromBusinessDocument, toBusinessDocumentFields } from "./businessDocument";

function timestampLike(date: Date) {
  return { toDate: () => date };
}

const validRaw = {
  businessCode: "BIZABCDEF",
  displayName: "Kwetu Café",
  ownerUserId: "user-1",
  primaryCategoryId: "category-1",
  countryCode: "BI",
  currencyCode: "BIF",
  timezone: "Africa/Bujumbura",
  city: "Bujumbura",
  contactPhone: "+25761234567",
  supportedLanguages: ["fr", "en"],
  status: "draft",
  createdAt: timestampLike(new Date("2026-08-17T00:00:00.000Z")),
  updatedAt: timestampLike(new Date("2026-08-17T00:00:00.000Z")),
  schemaVersion: 1,
};

describe("fromBusinessDocument", () => {
  it("parses a valid raw document", () => {
    const business = fromBusinessDocument("biz-1", validRaw);
    expect(business?.id).toBe("biz-1");
    expect(business?.businessCode).toBe("BIZABCDEF");
    expect(business?.status).toBe("draft");
  });

  it("parses every optional field when present", () => {
    const business = fromBusinessDocument("biz-1", {
      ...validRaw,
      legalName: "Kwetu Café SARL",
      businessTypeId: "type-1",
      address: "12 Rue",
      contactEmail: "owner@example.com",
      logoUrl: "https://example.com/logo.png",
      subscriptionId: "sub-1",
    });
    expect(business?.legalName).toBe("Kwetu Café SARL");
    expect(business?.businessTypeId).toBe("type-1");
    expect(business?.address).toBe("12 Rue");
    expect(business?.contactEmail).toBe("owner@example.com");
    expect(business?.logoUrl).toBe("https://example.com/logo.png");
    expect(business?.subscriptionId).toBe("sub-1");
  });

  it("leaves optional fields undefined when absent", () => {
    const business = fromBusinessDocument("biz-1", validRaw);
    expect(business?.legalName).toBeUndefined();
    expect(business?.subscriptionId).toBeUndefined();
  });

  it("returns null (never throws) for a structurally invalid document", () => {
    expect(fromBusinessDocument("biz-1", {})).toBeNull();
    expect(fromBusinessDocument("biz-1", { ...validRaw, businessCode: "not-a-code" })).toBeNull();
    expect(fromBusinessDocument("biz-1", { ...validRaw, status: "unknown_status" })).toBeNull();
    expect(fromBusinessDocument("biz-1", { ...validRaw, supportedLanguages: [] })).toBeNull();
    expect(() => fromBusinessDocument("biz-1", null)).not.toThrow();
    expect(() => fromBusinessDocument("biz-1", "a string")).not.toThrow();
  });

  it("accepts all 8 governed statuses", () => {
    for (const status of [
      "draft",
      "pending_verification",
      "trial",
      "active",
      "suspended",
      "expired",
      "closed",
      "archived",
    ]) {
      expect(fromBusinessDocument("biz-1", { ...validRaw, status })?.status).toBe(status);
    }
  });
});

describe("toBusinessDocumentFields", () => {
  it("round-trips a domain value into a plain Firestore-shaped object using Date (no Timestamp)", () => {
    const business = createBusiness({
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

    const fields = toBusinessDocumentFields(business);
    expect(fields.businessCode).toBe("BIZABCDEF");
    expect(fields.status).toBe("draft");
    expect(fields.createdAt).toBeInstanceOf(Date);
    expect(fields).not.toHaveProperty("id");
  });
});
