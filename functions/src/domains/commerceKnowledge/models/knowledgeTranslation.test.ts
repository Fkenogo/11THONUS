import { describe, expect, it } from "vitest";
import {
  createKnowledgeTranslation,
  transitionKnowledgeTranslationStatus,
} from "./knowledgeTranslation";

const now = new Date("2026-08-21T00:00:00.000Z");

function validParams() {
  return {
    entityType: "knowledge_node" as const,
    entityId: "node-category-1",
    languageCode: "en" as const,
    displayName: "Coffee Shop",
    createdAt: now,
  };
}

describe("createKnowledgeTranslation", () => {
  it("constructs a valid translation in draft status with a deterministic composite id", () => {
    const translation = createKnowledgeTranslation(validParams());
    expect(translation.status).toBe("draft");
    expect(translation.id).toBe("knowledge_node_node-category-1_en");
    expect(translation.entityType).toBe("knowledge_node");
    expect(translation.entityId).toBe("node-category-1");
    expect(translation.languageCode).toBe("en");
    expect(translation.synonyms).toEqual([]);
  });

  it("is reusable, unmodified, for a KnowledgeTag entity — the one authoritative localization mechanism (design §9.3)", () => {
    const translation = createKnowledgeTranslation({
      ...validParams(),
      entityType: "knowledge_tag",
      entityId: "tag-1",
    });
    expect(translation.id).toBe("knowledge_tag_tag-1_en");
    expect(translation.entityType).toBe("knowledge_tag");
  });

  it("rejects an entityId containing a Firestore path separator (review Phase I)", () => {
    expect(() => createKnowledgeTranslation({ ...validParams(), entityId: "abc/def" })).toThrow();
  });

  it("produces collision-free composite ids even when entityId itself contains underscores resembling entityType/languageCode tokens (review Phase I)", () => {
    // entityType/languageCode are both fixed, non-prefixing, closed-set
    // literals — an entityId containing "_en"/"_fr"-like substrings must
    // not be able to produce the same id as an otherwise-different triple.
    const a = createKnowledgeTranslation({
      entityType: "knowledge_node",
      entityId: "abc_en",
      languageCode: "fr",
      displayName: "A",
      createdAt: now,
    });
    const b = createKnowledgeTranslation({
      entityType: "knowledge_node",
      entityId: "abc",
      languageCode: "en",
      displayName: "B",
      createdAt: now,
    });
    expect(a.id).not.toBe(b.id);

    const c = createKnowledgeTranslation({
      entityType: "knowledge_tag",
      entityId: "node_abc",
      languageCode: "en",
      displayName: "C",
      createdAt: now,
    });
    const d = createKnowledgeTranslation({
      entityType: "knowledge_node",
      entityId: "abc",
      languageCode: "en",
      displayName: "D",
      createdAt: now,
    });
    expect(c.id).not.toBe(d.id);
  });

  it("rejects a blank displayName", () => {
    expect(() => createKnowledgeTranslation({ ...validParams(), displayName: " " })).toThrow();
  });

  it("rejects an unsupported language code", () => {
    expect(() =>
      createKnowledgeTranslation({ ...validParams(), languageCode: "de" as never }),
    ).toThrow();
  });

  it("accepts fr as a supported language code", () => {
    const translation = createKnowledgeTranslation({ ...validParams(), languageCode: "fr" });
    expect(translation.id).toBe("knowledge_node_node-category-1_fr");
  });

  it("has no businessId, branchId, ownerUserId, or membershipId field", () => {
    const translation = createKnowledgeTranslation(validParams()) as Record<string, unknown>;
    expect(translation).not.toHaveProperty("businessId");
    expect(translation).not.toHaveProperty("branchId");
    expect(translation).not.toHaveProperty("ownerUserId");
    expect(translation).not.toHaveProperty("membershipId");
  });
});

describe("transitionKnowledgeTranslationStatus", () => {
  it("draft -> reviewed is allowed", () => {
    const translation = createKnowledgeTranslation(validParams());
    const { translation: reviewed } = transitionKnowledgeTranslationStatus(
      translation,
      "reviewed",
      { updatedAt: now, reviewedBy: "editor-1" },
    );
    expect(reviewed.status).toBe("reviewed");
    expect(reviewed.reviewedBy).toBe("editor-1");
  });

  it("reviewed -> published is allowed", () => {
    const translation = createKnowledgeTranslation(validParams());
    const { translation: reviewed } = transitionKnowledgeTranslationStatus(
      translation,
      "reviewed",
      { updatedAt: now, reviewedBy: "editor-1" },
    );
    const { translation: published } = transitionKnowledgeTranslationStatus(reviewed, "published", {
      updatedAt: now,
    });
    expect(published.status).toBe("published");
  });

  it("published -> draft is allowed (governed correction cycle, same document)", () => {
    const translation = createKnowledgeTranslation(validParams());
    const { translation: reviewed } = transitionKnowledgeTranslationStatus(
      translation,
      "reviewed",
      { updatedAt: now, reviewedBy: "editor-1" },
    );
    const { translation: published } = transitionKnowledgeTranslationStatus(reviewed, "published", {
      updatedAt: now,
    });
    const { translation: backToDraft } = transitionKnowledgeTranslationStatus(published, "draft", {
      updatedAt: now,
    });
    expect(backToDraft.status).toBe("draft");
    // Review Phase J: no governing source (TRD10 §10.7.2, design §9.4/§M)
    // states reviewedBy/reviewedAt must be cleared when status returns to
    // draft — retained as a historical "when was this last reviewed"
    // record (consistent with the platform's "Archive, Do Not Erase"
    // retention posture elsewhere in this design) rather than invented
    // clearing policy with no source basis.
    expect(backToDraft.reviewedBy).toBe("editor-1");
    expect(backToDraft.reviewedAt).toEqual(now);
  });

  it("rejects draft -> published directly (must pass through reviewed)", () => {
    const translation = createKnowledgeTranslation(validParams());
    expect(() =>
      transitionKnowledgeTranslationStatus(translation, "published", { updatedAt: now }),
    ).toThrow();
  });
});
