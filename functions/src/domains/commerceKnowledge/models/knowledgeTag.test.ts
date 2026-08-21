import { describe, expect, it } from "vitest";
import { createKnowledgeTag, transitionKnowledgeTagStatus } from "./knowledgeTag";

const now = new Date("2026-08-21T00:00:00.000Z");

function validParams() {
  return {
    id: "tag-1",
    tagGroup: "product_attribute" as const,
    canonicalName: "Organic",
    slug: "organic",
    createdAt: now,
  };
}

describe("createKnowledgeTag", () => {
  it("constructs a valid tag in draft status", () => {
    const tag = createKnowledgeTag(validParams());
    expect(tag.status).toBe("draft");
    expect(tag.tagGroup).toBe("product_attribute");
    expect(tag.searchTerms).toEqual([]);
    expect(tag.schemaVersion).toBe(1);
  });

  it("rejects a blank canonicalName", () => {
    expect(() => createKnowledgeTag({ ...validParams(), canonicalName: " " })).toThrow();
  });

  it("rejects a blank slug", () => {
    expect(() => createKnowledgeTag({ ...validParams(), slug: "" })).toThrow();
  });

  it("rejects an undocumented tagGroup", () => {
    expect(() =>
      createKnowledgeTag({ ...validParams(), tagGroup: "unknown_group" as never }),
    ).toThrow();
  });

  it("accepts each governed tagGroup", () => {
    for (const tagGroup of [
      "business_attribute",
      "product_attribute",
      "customer_interest",
      "system_behaviour",
    ] as const) {
      expect(() => createKnowledgeTag({ ...validParams(), tagGroup })).not.toThrow();
    }
  });

  it("does not carry an inline translations map — KnowledgeTranslation is the sole localization authority (design §9.3)", () => {
    const tag = createKnowledgeTag(validParams()) as Record<string, unknown>;
    expect(tag).not.toHaveProperty("translations");
  });

  it("has no businessId, branchId, ownerUserId, or membershipId field", () => {
    const tag = createKnowledgeTag(validParams()) as Record<string, unknown>;
    expect(tag).not.toHaveProperty("businessId");
    expect(tag).not.toHaveProperty("branchId");
    expect(tag).not.toHaveProperty("ownerUserId");
    expect(tag).not.toHaveProperty("membershipId");
  });
});

describe("transitionKnowledgeTagStatus — shares KnowledgeNode's canonical lifecycle", () => {
  it("draft -> in_review -> active is allowed", () => {
    const tag = createKnowledgeTag(validParams());
    const { tag: inReview } = transitionKnowledgeTagStatus(tag, "in_review", { updatedAt: now });
    const { tag: active } = transitionKnowledgeTagStatus(inReview, "active", { updatedAt: now });
    expect(active.status).toBe("active");
  });

  it("rejects draft -> active directly", () => {
    const tag = createKnowledgeTag(validParams());
    expect(() => transitionKnowledgeTagStatus(tag, "active", { updatedAt: now })).toThrow();
  });

  it("active -> retired -> archived is allowed; archived is terminal", () => {
    const tag = createKnowledgeTag(validParams());
    const { tag: inReview } = transitionKnowledgeTagStatus(tag, "in_review", { updatedAt: now });
    const { tag: active } = transitionKnowledgeTagStatus(inReview, "active", { updatedAt: now });
    const { tag: retired } = transitionKnowledgeTagStatus(active, "retired", { updatedAt: now });
    const { tag: archived } = transitionKnowledgeTagStatus(retired, "archived", {
      updatedAt: now,
    });
    expect(archived.status).toBe("archived");
    expect(() => transitionKnowledgeTagStatus(archived, "active", { updatedAt: now })).toThrow();
  });
});
