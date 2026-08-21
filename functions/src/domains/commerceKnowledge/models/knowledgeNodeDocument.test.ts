import { describe, expect, it } from "vitest";
import { fromKnowledgeNodeDocument, toKnowledgeNodeDocumentFields } from "./knowledgeNodeDocument";
import { createKnowledgeNode } from "./knowledgeNode";

const now = new Date("2026-08-21T00:00:00.000Z");
const timestampLike = { toDate: () => now };

function validRawDocument() {
  return {
    parentId: null,
    nodeType: "industry",
    canonicalName: "Food & Beverage",
    slug: "food-beverage",
    path: "/node-1",
    depth: 0,
    status: "active",
    version: 1,
    searchTerms: ["food"],
    createdAt: timestampLike,
    updatedAt: timestampLike,
    schemaVersion: 1,
  };
}

describe("fromKnowledgeNodeDocument", () => {
  it("parses a well-formed document", () => {
    const node = fromKnowledgeNodeDocument("node-1", validRawDocument());
    expect(node).not.toBeNull();
    expect(node?.id).toBe("node-1");
    expect(node?.nodeType).toBe("industry");
    expect(node?.status).toBe("active");
  });

  it("returns null, never throws, for a non-object", () => {
    expect(fromKnowledgeNodeDocument("node-1", null)).toBeNull();
    expect(fromKnowledgeNodeDocument("node-1", "not-an-object")).toBeNull();
    expect(() => fromKnowledgeNodeDocument("node-1", undefined)).not.toThrow();
  });

  it("returns null for an undocumented nodeType", () => {
    expect(
      fromKnowledgeNodeDocument("node-1", { ...validRawDocument(), nodeType: "made_up" }),
    ).toBeNull();
  });

  it("returns null for an undocumented status (e.g. stale pending_review)", () => {
    expect(
      fromKnowledgeNodeDocument("node-1", { ...validRawDocument(), status: "pending_review" }),
    ).toBeNull();
  });

  it("returns null for a malformed schemaVersion", () => {
    expect(
      fromKnowledgeNodeDocument("node-1", { ...validRawDocument(), schemaVersion: 0 }),
    ).toBeNull();
    expect(
      fromKnowledgeNodeDocument("node-1", { ...validRawDocument(), schemaVersion: "1" }),
    ).toBeNull();
  });

  it("returns null for malformed timestamps", () => {
    expect(
      fromKnowledgeNodeDocument("node-1", { ...validRawDocument(), createdAt: "not-a-timestamp" }),
    ).toBeNull();
  });

  it("returns null for a blank canonicalName", () => {
    expect(
      fromKnowledgeNodeDocument("node-1", { ...validRawDocument(), canonicalName: "" }),
    ).toBeNull();
  });

  it("accepts an explicit replacementNodeId and optional fields", () => {
    const node = fromKnowledgeNodeDocument("node-1", {
      ...validRawDocument(),
      status: "retired",
      replacementNodeId: "node-2",
      description: "desc",
      iconKey: "icon",
    });
    expect(node?.replacementNodeId).toBe("node-2");
    expect(node?.description).toBe("desc");
  });
});

describe("toKnowledgeNodeDocumentFields", () => {
  it("round-trips a domain node into plain document fields, id excluded", () => {
    const node = createKnowledgeNode({
      id: "node-1",
      nodeType: "industry",
      parentId: null,
      parentNodeType: null,
      canonicalName: "Food & Beverage",
      slug: "food-beverage",
      path: "/node-1",
      depth: 0,
      createdAt: now,
    });
    const fields = toKnowledgeNodeDocumentFields(node) as Record<string, unknown>;
    expect(fields).not.toHaveProperty("id");
    expect(fields.nodeType).toBe("industry");
    expect(fields.status).toBe("draft");
    expect(fields.createdAt).toBe(now);
  });
});
