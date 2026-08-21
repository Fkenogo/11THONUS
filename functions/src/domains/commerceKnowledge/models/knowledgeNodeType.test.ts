import { describe, expect, it } from "vitest";
import {
  KNOWLEDGE_NODE_TYPES,
  isKnowledgeNodeType,
  isValidParentNodeType,
  wouldCreateHierarchyCycle,
} from "./knowledgeNodeType";

describe("KNOWLEDGE_NODE_TYPES", () => {
  it("is exactly the six governed hierarchy levels", () => {
    expect(KNOWLEDGE_NODE_TYPES).toEqual([
      "industry",
      "business_category",
      "business_type",
      "reward_program_category",
      "standard_product",
      "standard_service",
    ]);
  });
});

describe("isKnowledgeNodeType", () => {
  it("accepts each governed value", () => {
    for (const type of KNOWLEDGE_NODE_TYPES) {
      expect(isKnowledgeNodeType(type)).toBe(true);
    }
  });

  it("rejects an undocumented category name", () => {
    expect(isKnowledgeNodeType("category")).toBe(false);
    expect(isKnowledgeNodeType("")).toBe(false);
  });
});

describe("isValidParentNodeType — approved adjacency chain (design §7.1.1)", () => {
  it("industry requires parentId null (root)", () => {
    expect(isValidParentNodeType("industry", null)).toBe(true);
    expect(isValidParentNodeType("industry", "business_category")).toBe(false);
  });

  it("business_category's only allowed parent is industry", () => {
    expect(isValidParentNodeType("business_category", "industry")).toBe(true);
    expect(isValidParentNodeType("business_category", null)).toBe(false);
    expect(isValidParentNodeType("business_category", "business_type")).toBe(false);
  });

  it("business_type's only allowed parent is business_category", () => {
    expect(isValidParentNodeType("business_type", "business_category")).toBe(true);
    expect(isValidParentNodeType("business_type", "industry")).toBe(false);
  });

  it("reward_program_category's only allowed parent is business_type", () => {
    expect(isValidParentNodeType("reward_program_category", "business_type")).toBe(true);
    expect(isValidParentNodeType("reward_program_category", "business_category")).toBe(false);
  });

  it("standard_product/standard_service's only allowed parent is reward_program_category", () => {
    expect(isValidParentNodeType("standard_product", "reward_program_category")).toBe(true);
    expect(isValidParentNodeType("standard_service", "reward_program_category")).toBe(true);
    expect(isValidParentNodeType("standard_product", "business_type")).toBe(false);
  });

  it("fails closed: a standard_product pointing directly at an industry is invalid", () => {
    expect(isValidParentNodeType("standard_product", "industry")).toBe(false);
  });

  it("fails closed: any node type paired with a completely unrelated parent type is invalid", () => {
    expect(isValidParentNodeType("business_category", "standard_product")).toBe(false);
    expect(isValidParentNodeType("standard_service", "standard_product")).toBe(false);
  });
});

describe("wouldCreateHierarchyCycle — pure contract over a supplied ancestor chain", () => {
  it("returns false when the candidate parent's ancestor chain does not include the node itself", () => {
    // node "c" being parented under "b", whose ancestor chain is [a] — no cycle
    expect(wouldCreateHierarchyCycle("c", ["a"])).toBe(false);
  });

  it("returns true when the candidate parent's ancestor chain already includes the node itself", () => {
    // node "a" being reparented under a descendant whose ancestor chain includes "a" — cycle
    expect(wouldCreateHierarchyCycle("a", ["b", "a"])).toBe(true);
  });

  it("returns true for a direct self-parent (degenerate one-hop cycle)", () => {
    expect(wouldCreateHierarchyCycle("a", ["a"])).toBe(true);
  });

  it("returns false for an empty ancestor chain (candidate parent is a root)", () => {
    expect(wouldCreateHierarchyCycle("a", [])).toBe(false);
  });
});
