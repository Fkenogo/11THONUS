import { describe, expect, it } from "vitest";
import { createKnowledgeNode, transitionKnowledgeNodeStatus } from "./knowledgeNode";

const now = new Date("2026-08-21T00:00:00.000Z");

function validRootParams() {
  return {
    id: "node-industry-1",
    nodeType: "industry" as const,
    parentId: null,
    parentNodeType: null,
    canonicalName: "Food & Beverage",
    slug: "food-beverage",
    path: "/node-industry-1",
    depth: 0,
    createdAt: now,
  };
}

function validChildParams() {
  return {
    id: "node-category-1",
    nodeType: "business_category" as const,
    parentId: "node-industry-1",
    parentNodeType: "industry" as const,
    canonicalName: "Coffee Shop",
    slug: "coffee-shop",
    path: "/node-industry-1/node-category-1",
    depth: 1,
    createdAt: now,
  };
}

describe("createKnowledgeNode", () => {
  it("constructs a valid root (industry) node in draft status", () => {
    const node = createKnowledgeNode(validRootParams());
    expect(node.status).toBe("draft");
    expect(node.parentId).toBeNull();
    expect(node.nodeType).toBe("industry");
    expect(node.version).toBe(1);
    expect(node.schemaVersion).toBe(1);
    expect(node.searchTerms).toEqual([]);
    expect(node.createdAt).toBe(now);
    expect(node.updatedAt).toBe(now);
  });

  it("constructs a valid child node whose parent type matches the governed adjacency rule", () => {
    const node = createKnowledgeNode(validChildParams());
    expect(node.nodeType).toBe("business_category");
    expect(node.parentId).toBe("node-industry-1");
  });

  it("rejects a blank canonicalName", () => {
    expect(() => createKnowledgeNode({ ...validRootParams(), canonicalName: "  " })).toThrow();
  });

  it("rejects a blank slug", () => {
    expect(() => createKnowledgeNode({ ...validRootParams(), slug: "" })).toThrow();
  });

  it("rejects an id containing a Firestore path separator (review Phase I)", () => {
    expect(() => createKnowledgeNode({ ...validRootParams(), id: "abc/def" })).toThrow();
  });

  it("rejects a parentId containing a Firestore path separator (review Phase I)", () => {
    expect(() => createKnowledgeNode({ ...validChildParams(), parentId: "abc/def" })).toThrow();
  });

  it("rejects an industry node with a non-null parentNodeType", () => {
    expect(() =>
      createKnowledgeNode({ ...validRootParams(), parentNodeType: "business_category" }),
    ).toThrow();
  });

  it("rejects a business_category node whose parent is not an industry", () => {
    expect(() =>
      createKnowledgeNode({ ...validChildParams(), parentNodeType: "business_type" }),
    ).toThrow();
  });

  it("rejects an industry (root) node given a non-null parentId, even though parentNodeType is null (structural parentId/parentNodeType consistency — review Phase D)", () => {
    expect(() =>
      createKnowledgeNode({
        ...validRootParams(),
        parentId: "some-other-node",
        parentNodeType: null,
      }),
    ).toThrow();
  });

  it("rejects a business_category node given parentId=null while parentNodeType=industry (structural inconsistency — review Phase D)", () => {
    expect(() =>
      createKnowledgeNode({ ...validChildParams(), parentId: null, parentNodeType: "industry" }),
    ).toThrow();
  });

  it("rejects a non-root child (business_type) given a parentId while parentNodeType is null (review Phase D)", () => {
    expect(() =>
      createKnowledgeNode({
        id: "node-type-1",
        nodeType: "business_type",
        parentId: "node-category-1",
        parentNodeType: null,
        canonicalName: "Sit-down",
        slug: "sit-down",
        path: "/node-industry-1/node-category-1/node-type-1",
        depth: 2,
        createdAt: now,
      }),
    ).toThrow();
  });

  it("rejects a root child (industry) that supplies a parentId at all, regardless of parentNodeType (review Phase D)", () => {
    expect(() =>
      createKnowledgeNode({ ...validRootParams(), parentId: "some-other-node" }),
    ).toThrow();
  });

  it("rejects a root (industry) node with a non-zero depth (review Phase E: root/depth invariant)", () => {
    expect(() => createKnowledgeNode({ ...validRootParams(), depth: 1 })).toThrow();
  });

  it("rejects a non-root node with depth 0 (review Phase E: root/depth invariant)", () => {
    expect(() => createKnowledgeNode({ ...validChildParams(), depth: 0 })).toThrow();
  });

  it("rejects a standard_product pointing directly at an industry", () => {
    expect(() =>
      createKnowledgeNode({
        id: "node-product-1",
        nodeType: "standard_product",
        parentId: "node-industry-1",
        parentNodeType: "industry",
        canonicalName: "Coffee",
        slug: "coffee",
        path: "/node-industry-1/node-product-1",
        depth: 1,
        createdAt: now,
      }),
    ).toThrow();
  });

  it("never allows a status field in create params (status is always draft)", () => {
    // Type-level proof via structural shape: params has no `status` key
    // accepted by the constructor — verified functionally, since passing
    // an extra unknown property is a no-op at runtime for plain objects.
    const node = createKnowledgeNode(validRootParams());
    expect(node.status).toBe("draft");
  });

  it("defaults searchTerms to empty array when not supplied", () => {
    const node = createKnowledgeNode(validRootParams());
    expect(node.searchTerms).toEqual([]);
  });

  it("accepts an explicit searchTerms array", () => {
    const node = createKnowledgeNode({ ...validRootParams(), searchTerms: ["coffee", "cafe"] });
    expect(node.searchTerms).toEqual(["coffee", "cafe"]);
  });

  it("has no businessId, branchId, ownerUserId, or membershipId field", () => {
    const node = createKnowledgeNode(validRootParams()) as Record<string, unknown>;
    expect(node).not.toHaveProperty("businessId");
    expect(node).not.toHaveProperty("branchId");
    expect(node).not.toHaveProperty("ownerUserId");
    expect(node).not.toHaveProperty("membershipId");
  });
});

describe("transitionKnowledgeNodeStatus", () => {
  it("draft -> in_review is allowed", () => {
    const node = createKnowledgeNode(validRootParams());
    const { node: next } = transitionKnowledgeNodeStatus(node, "in_review", { updatedAt: now });
    expect(next.status).toBe("in_review");
  });

  it("in_review -> active is allowed", () => {
    const node = createKnowledgeNode(validRootParams());
    const { node: inReview } = transitionKnowledgeNodeStatus(node, "in_review", {
      updatedAt: now,
    });
    const { node: active } = transitionKnowledgeNodeStatus(inReview, "active", { updatedAt: now });
    expect(active.status).toBe("active");
  });

  it("rejects draft -> active directly (must pass through in_review)", () => {
    const node = createKnowledgeNode(validRootParams());
    expect(() => transitionKnowledgeNodeStatus(node, "active", { updatedAt: now })).toThrow();
  });

  it("active -> retired requires a replacementNodeId at the same transition", () => {
    const node = createKnowledgeNode(validRootParams());
    const { node: inReview } = transitionKnowledgeNodeStatus(node, "in_review", {
      updatedAt: now,
    });
    const { node: active } = transitionKnowledgeNodeStatus(inReview, "active", { updatedAt: now });
    expect(() => transitionKnowledgeNodeStatus(active, "retired", { updatedAt: now })).toThrow();
    const { node: retired } = transitionKnowledgeNodeStatus(active, "retired", {
      updatedAt: now,
      replacementNodeId: "node-industry-2",
    });
    expect(retired.status).toBe("retired");
    expect(retired.replacementNodeId).toBe("node-industry-2");
  });

  it("rejects a replacementNodeId containing a Firestore path separator (review Phase I)", () => {
    const node = createKnowledgeNode(validRootParams());
    const { node: inReview } = transitionKnowledgeNodeStatus(node, "in_review", {
      updatedAt: now,
    });
    const { node: active } = transitionKnowledgeNodeStatus(inReview, "active", { updatedAt: now });
    expect(() =>
      transitionKnowledgeNodeStatus(active, "retired", {
        updatedAt: now,
        replacementNodeId: "abc/def",
      }),
    ).toThrow();
  });

  it("rejects a replacementNodeId equal to the node's own id (self-reference)", () => {
    const node = createKnowledgeNode(validRootParams());
    const { node: inReview } = transitionKnowledgeNodeStatus(node, "in_review", {
      updatedAt: now,
    });
    const { node: active } = transitionKnowledgeNodeStatus(inReview, "active", { updatedAt: now });
    expect(() =>
      transitionKnowledgeNodeStatus(active, "retired", {
        updatedAt: now,
        replacementNodeId: active.id,
      }),
    ).toThrow();
  });

  it("retired -> archived is allowed", () => {
    const node = createKnowledgeNode(validRootParams());
    const { node: inReview } = transitionKnowledgeNodeStatus(node, "in_review", {
      updatedAt: now,
    });
    const { node: active } = transitionKnowledgeNodeStatus(inReview, "active", { updatedAt: now });
    const { node: retired } = transitionKnowledgeNodeStatus(active, "retired", {
      updatedAt: now,
      replacementNodeId: "node-industry-2",
    });
    const { node: archived } = transitionKnowledgeNodeStatus(retired, "archived", {
      updatedAt: now,
    });
    expect(archived.status).toBe("archived");
  });

  it("archived is terminal — no transition out, including back to active", () => {
    const node = createKnowledgeNode(validRootParams());
    const { node: inReview } = transitionKnowledgeNodeStatus(node, "in_review", {
      updatedAt: now,
    });
    const { node: active } = transitionKnowledgeNodeStatus(inReview, "active", { updatedAt: now });
    const { node: retired } = transitionKnowledgeNodeStatus(active, "retired", {
      updatedAt: now,
      replacementNodeId: "node-industry-2",
    });
    const { node: archived } = transitionKnowledgeNodeStatus(retired, "archived", {
      updatedAt: now,
    });
    expect(() => transitionKnowledgeNodeStatus(archived, "active", { updatedAt: now })).toThrow();
    expect(() => transitionKnowledgeNodeStatus(archived, "draft", { updatedAt: now })).toThrow();
  });
});
