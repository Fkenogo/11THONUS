import { describe, expect, it } from "vitest";
import {
  fromKnowledgeTranslationDocument,
  toKnowledgeTranslationDocumentFields,
} from "./knowledgeTranslationDocument";
import { createKnowledgeTranslation } from "./knowledgeTranslation";

const now = new Date("2026-08-21T00:00:00.000Z");
const timestampLike = { toDate: () => now };

function validRawDocument() {
  return {
    entityType: "knowledge_node",
    entityId: "node-1",
    languageCode: "en",
    displayName: "Coffee Shop",
    synonyms: [],
    status: "published",
    createdAt: timestampLike,
    updatedAt: timestampLike,
    schemaVersion: 1,
  };
}

describe("fromKnowledgeTranslationDocument", () => {
  it("parses a well-formed document", () => {
    const translation = fromKnowledgeTranslationDocument(
      "knowledge_node_node-1_en",
      validRawDocument(),
    );
    expect(translation).not.toBeNull();
    expect(translation?.entityType).toBe("knowledge_node");
    expect(translation?.languageCode).toBe("en");
  });

  it("returns null for an unsupported language code", () => {
    expect(
      fromKnowledgeTranslationDocument("x", { ...validRawDocument(), languageCode: "de" }),
    ).toBeNull();
  });

  it("returns null for an undocumented entityType", () => {
    expect(
      fromKnowledgeTranslationDocument("x", { ...validRawDocument(), entityType: "made_up" }),
    ).toBeNull();
  });

  it("returns null for an undocumented status", () => {
    expect(
      fromKnowledgeTranslationDocument("x", { ...validRawDocument(), status: "approved" }),
    ).toBeNull();
  });

  it("returns null for a non-object", () => {
    expect(fromKnowledgeTranslationDocument("x", null)).toBeNull();
  });

  it("returns null for a blank displayName", () => {
    expect(
      fromKnowledgeTranslationDocument("x", { ...validRawDocument(), displayName: "" }),
    ).toBeNull();
  });

  it("returns null for a NaN/Infinity/-Infinity/fractional schemaVersion (review Phase F)", () => {
    for (const badValue of [NaN, Infinity, -Infinity, 1.5]) {
      expect(
        fromKnowledgeTranslationDocument("x", { ...validRawDocument(), schemaVersion: badValue }),
      ).toBeNull();
    }
  });
});

describe("toKnowledgeTranslationDocumentFields", () => {
  it("round-trips a domain translation into plain document fields, id excluded", () => {
    const translation = createKnowledgeTranslation({
      entityType: "knowledge_node",
      entityId: "node-1",
      languageCode: "en",
      displayName: "Coffee Shop",
      createdAt: now,
    });
    const fields = toKnowledgeTranslationDocumentFields(translation) as Record<string, unknown>;
    expect(fields).not.toHaveProperty("id");
    expect(fields.entityId).toBe("node-1");
  });
});
