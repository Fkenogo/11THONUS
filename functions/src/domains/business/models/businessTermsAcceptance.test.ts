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

  /**
   * `ENG-P3-002A` independent review, Phase I — adversarial collision
   * proof. `termsVersion` in particular is ungoverned, operator-supplied
   * free text (`businessTermsConfigRepository.ts` has no charset
   * restriction on it) — an underscore, or any other character, can appear
   * in any of the three components. Raw `"_"` concatenation would collide
   * here; the length-prefixed encoding must not.
   */
  it("does not collide when a component boundary could be reinterpreted around an underscore — (a_b, c, d) vs (a, b_c, d)", () => {
    const first = businessTermsAcceptanceId("a_b", "c", "d");
    const second = businessTermsAcceptanceId("a", "b_c", "d");
    expect(first).not.toBe(second);
  });

  it("does not collide across many adversarially-crafted underscore-shifted triples", () => {
    const triples: Array<[string, string, string]> = [
      ["biz", "cust_1", "v1"],
      ["biz_cust", "1", "v1"],
      ["biz", "cust", "1_v1"],
      ["biz_cust_1", "v1", "x"],
    ];
    const ids = triples.map(([a, b, c]) => businessTermsAcceptanceId(a, b, c));
    // Every distinct triple produced a distinct id.
    expect(new Set(ids).size).toBe(triples.length);
  });

  it("rejects a component containing '/' — never silently corrupts the Firestore document path", () => {
    expect(() => businessTermsAcceptanceId("biz/evil", "cust_1", "v1")).toThrow();
    expect(() => businessTermsAcceptanceId("biz_1", "cust/evil", "v1")).toThrow();
    expect(() => businessTermsAcceptanceId("biz_1", "cust_1", "v1/evil")).toThrow();
  });

  it("rejects an id that would exceed Firestore's 1500-byte document-id limit — fails closed, never silently truncates", () => {
    const huge = "x".repeat(2000);
    expect(() => businessTermsAcceptanceId("biz_1", "cust_1", huge)).toThrow();
  });

  it("a future Terms-version naming convention (e.g. containing digits, dots, or underscores) still cannot create an ambiguous composite id", () => {
    const a = businessTermsAcceptanceId("biz_1", "cust_1", "2026.08.21_v1");
    const b = businessTermsAcceptanceId("biz_1", "cust_1", "2026.08.21_v2");
    expect(a).not.toBe(b);
    const c = businessTermsAcceptanceId("biz_1", "cust_1", "10.value");
    const d = businessTermsAcceptanceId("biz_1", "cust_1", "1");
    expect(c).not.toBe(d);
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
