import { describe, expect, it } from "vitest";
import { fromKnowledgeTagDocument, toKnowledgeTagDocumentFields } from "./knowledgeTagDocument";
import { createKnowledgeTag } from "./knowledgeTag";

const now = new Date("2026-08-21T00:00:00.000Z");
const timestampLike = { toDate: () => now };

function validRawDocument() {
  return {
    tagGroup: "product_attribute",
    canonicalName: "Organic",
    slug: "organic",
    status: "active",
    searchTerms: [],
    createdAt: timestampLike,
    updatedAt: timestampLike,
    schemaVersion: 1,
  };
}

describe("fromKnowledgeTagDocument", () => {
  it("parses a well-formed document", () => {
    const tag = fromKnowledgeTagDocument("tag-1", validRawDocument());
    expect(tag).not.toBeNull();
    expect(tag?.tagGroup).toBe("product_attribute");
  });

  it("fails closed on a legacy inline translations field — review Phase H: no live Commerce Knowledge data exists requiring tolerance, so the obsolete dual-authority shape is rejected outright, not silently discarded", () => {
    const tag = fromKnowledgeTagDocument("tag-1", {
      ...validRawDocument(),
      translations: { en: "Organic" },
    });
    expect(tag).toBeNull();
  });

  it("returns null for an undocumented tagGroup", () => {
    expect(
      fromKnowledgeTagDocument("tag-1", { ...validRawDocument(), tagGroup: "made_up" }),
    ).toBeNull();
  });

  it("returns null for an undocumented status", () => {
    expect(
      fromKnowledgeTagDocument("tag-1", { ...validRawDocument(), status: "published" }),
    ).toBeNull();
  });

  it("returns null for a non-object", () => {
    expect(fromKnowledgeTagDocument("tag-1", null)).toBeNull();
  });

  it("returns null for a malformed schemaVersion", () => {
    expect(
      fromKnowledgeTagDocument("tag-1", { ...validRawDocument(), schemaVersion: -1 }),
    ).toBeNull();
  });

  it("returns null for a NaN/Infinity/-Infinity/fractional schemaVersion (review Phase F)", () => {
    for (const badValue of [NaN, Infinity, -Infinity, 1.5]) {
      expect(
        fromKnowledgeTagDocument("tag-1", { ...validRawDocument(), schemaVersion: badValue }),
      ).toBeNull();
    }
  });
});

describe("toKnowledgeTagDocumentFields", () => {
  it("round-trips a domain tag into plain document fields, id excluded, no translations key", () => {
    const tag = createKnowledgeTag({
      id: "tag-1",
      tagGroup: "product_attribute",
      canonicalName: "Organic",
      slug: "organic",
      createdAt: now,
    });
    const fields = toKnowledgeTagDocumentFields(tag) as Record<string, unknown>;
    expect(fields).not.toHaveProperty("id");
    expect(fields).not.toHaveProperty("translations");
    expect(fields.tagGroup).toBe("product_attribute");
  });
});
