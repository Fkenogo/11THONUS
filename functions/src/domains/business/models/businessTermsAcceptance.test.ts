import { describe, expect, it } from "vitest";
import {
  businessTermsAcceptanceId,
  createBusinessTermsAcceptance,
  fromBusinessTermsAcceptanceDocument,
  toBusinessTermsAcceptanceDocumentFields,
} from "./businessTermsAcceptance";

function timestampLike(date: Date) {
  return { toDate: () => date };
}

describe("businessTermsAcceptanceId", () => {
  it("is deterministic for the same (businessId, acceptingCustomerIdentityId, termsVersion) tuple", () => {
    const a = businessTermsAcceptanceId("biz_1", "cust_1", "TEST_v1");
    const b = businessTermsAcceptanceId("biz_1", "cust_1", "TEST_v1");
    expect(a).toBe(b);
  });

  it("differs for a different termsVersion — a newer version never collides with an older one's id", () => {
    const v1 = businessTermsAcceptanceId("biz_1", "cust_1", "TEST_v1");
    const v2 = businessTermsAcceptanceId("biz_1", "cust_1", "TEST_v2");
    expect(v1).not.toBe(v2);
  });

  it("differs for a different businessId", () => {
    const a = businessTermsAcceptanceId("biz_1", "cust_1", "TEST_v1");
    const b = businessTermsAcceptanceId("biz_2", "cust_1", "TEST_v1");
    expect(a).not.toBe(b);
  });

  it("differs for a different acceptingCustomerIdentityId", () => {
    const a = businessTermsAcceptanceId("biz_1", "cust_1", "TEST_v1");
    const b = businessTermsAcceptanceId("biz_1", "cust_2", "TEST_v1");
    expect(a).not.toBe(b);
  });
});

describe("createBusinessTermsAcceptance", () => {
  const now = new Date("2026-08-21T00:00:00.000Z");

  it("constructs a valid acceptance record", () => {
    const acceptance = createBusinessTermsAcceptance({
      id: "",
      acceptingCustomerIdentityId: "cust_1",
      businessId: "biz_1",
      termsVersion: "TEST_v1",
      acceptedAt: now,
      languageCode: "en",
    });
    expect(acceptance.acceptingCustomerIdentityId).toBe("cust_1");
    expect(acceptance.businessId).toBe("biz_1");
    expect(acceptance.termsVersion).toBe("TEST_v1");
    expect(acceptance.languageCode).toBe("en");
    expect(acceptance.schemaVersion).toBe(1);
    expect(acceptance.createdAt).toEqual(now);
  });

  it("rejects a blank acceptingCustomerIdentityId", () => {
    expect(() =>
      createBusinessTermsAcceptance({
        id: "",
        acceptingCustomerIdentityId: "  ",
        businessId: "biz_1",
        termsVersion: "TEST_v1",
        acceptedAt: now,
        languageCode: "en",
      }),
    ).toThrow();
  });

  it("rejects an unsupported languageCode", () => {
    expect(() =>
      createBusinessTermsAcceptance({
        id: "",
        acceptingCustomerIdentityId: "cust_1",
        businessId: "biz_1",
        termsVersion: "TEST_v1",
        acceptedAt: now,
        languageCode: "kir",
      }),
    ).toThrow();
  });

  it("rejects an invalid acceptedAt", () => {
    expect(() =>
      createBusinessTermsAcceptance({
        id: "",
        acceptingCustomerIdentityId: "cust_1",
        businessId: "biz_1",
        termsVersion: "TEST_v1",
        acceptedAt: new Date(NaN),
        languageCode: "en",
      }),
    ).toThrow();
  });
});

describe("fromBusinessTermsAcceptanceDocument", () => {
  const now = new Date("2026-08-21T00:00:00.000Z");

  it("round-trips a well-formed document", () => {
    const acceptance = createBusinessTermsAcceptance({
      id: "",
      acceptingCustomerIdentityId: "cust_1",
      businessId: "biz_1",
      termsVersion: "TEST_v1",
      acceptedAt: now,
      languageCode: "en",
      collectionMethod: "onboarding_wizard",
    });
    const fields = toBusinessTermsAcceptanceDocumentFields(acceptance);
    const raw = {
      ...fields,
      acceptedAt: timestampLike(now),
      createdAt: timestampLike(now),
    };
    const restored = fromBusinessTermsAcceptanceDocument(acceptance.id, raw);
    expect(restored).toEqual(acceptance);
  });

  it("returns null (fails closed) for a malformed document — never throws", () => {
    expect(fromBusinessTermsAcceptanceDocument("id_1", { businessId: "biz_1" })).toBeNull();
    expect(fromBusinessTermsAcceptanceDocument("id_1", null)).toBeNull();
    expect(fromBusinessTermsAcceptanceDocument("", {})).toBeNull();
  });

  it("returns null for an unsupported languageCode value", () => {
    const raw = {
      acceptingCustomerIdentityId: "cust_1",
      businessId: "biz_1",
      termsVersion: "TEST_v1",
      acceptedAt: timestampLike(now),
      createdAt: timestampLike(now),
      languageCode: "kir",
      schemaVersion: 1,
    };
    expect(fromBusinessTermsAcceptanceDocument("id_1", raw)).toBeNull();
  });
});
