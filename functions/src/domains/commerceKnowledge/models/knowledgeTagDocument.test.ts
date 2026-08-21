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

  it("returns null for a legacy inline translations map — not part of the resolved shape", () => {
    // Presence of a stray `translations` field must not resurrect the old
    // TRD10-declared inline shape; the parser simply ignores unknown keys
    // and still succeeds provided the governed fields are well-formed.
    const tag = fromKnowledgeTagDocument("tag-1", {
      ...validRawDocument(),
      translations: { en: "Organic" },
    });
    expect(tag).not.toBeNull();
    expect(tag).not.toHaveProperty("translations");
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
