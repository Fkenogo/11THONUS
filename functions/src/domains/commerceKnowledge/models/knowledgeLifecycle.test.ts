import { describe, expect, it } from "vitest";
import {
  KNOWLEDGE_LIFECYCLE_STATUSES,
  isKnowledgeLifecycleStatus,
  isValidKnowledgeLifecycleTransition,
  isTerminalKnowledgeLifecycleStatus,
} from "./knowledgeLifecycle";

describe("KNOWLEDGE_LIFECYCLE_STATUSES", () => {
  it("is exactly the five DEC-DATA-005-resolved values, no sixth state", () => {
    expect(KNOWLEDGE_LIFECYCLE_STATUSES).toEqual([
      "draft",
      "in_review",
      "active",
      "retired",
      "archived",
    ]);
  });

  it("does not reintroduce pending_review/approved/published as KnowledgeNode states", () => {
    expect(KNOWLEDGE_LIFECYCLE_STATUSES).not.toContain("pending_review");
    expect(KNOWLEDGE_LIFECYCLE_STATUSES).not.toContain("approved");
    expect(KNOWLEDGE_LIFECYCLE_STATUSES).not.toContain("published");
  });
});

describe("isKnowledgeLifecycleStatus", () => {
  it("accepts each governed value", () => {
    for (const status of KNOWLEDGE_LIFECYCLE_STATUSES) {
      expect(isKnowledgeLifecycleStatus(status)).toBe(true);
    }
  });

  it("rejects an undocumented value", () => {
    expect(isKnowledgeLifecycleStatus("published")).toBe(false);
    expect(isKnowledgeLifecycleStatus("")).toBe(false);
    expect(isKnowledgeLifecycleStatus("ACTIVE")).toBe(false);
  });
});

describe("isValidKnowledgeLifecycleTransition — DEC-DATA-005 §9.4 matrix", () => {
  it("draft -> in_review is allowed", () => {
    expect(isValidKnowledgeLifecycleTransition("draft", "in_review")).toBe(true);
  });

  it("in_review -> active is allowed", () => {
    expect(isValidKnowledgeLifecycleTransition("in_review", "active")).toBe(true);
  });

  it("in_review -> draft is allowed (governed rework)", () => {
    expect(isValidKnowledgeLifecycleTransition("in_review", "draft")).toBe(true);
  });

  it("active -> retired is allowed", () => {
    expect(isValidKnowledgeLifecycleTransition("active", "retired")).toBe(true);
  });

  it("retired -> archived is allowed", () => {
    expect(isValidKnowledgeLifecycleTransition("retired", "archived")).toBe(true);
  });

  it("archived has no outgoing transition (terminal)", () => {
    expect(isValidKnowledgeLifecycleTransition("archived", "active")).toBe(false);
    expect(isValidKnowledgeLifecycleTransition("archived", "retired")).toBe(false);
    expect(isValidKnowledgeLifecycleTransition("archived", "draft")).toBe(false);
  });

  it("rejects draft -> active (must pass through in_review)", () => {
    expect(isValidKnowledgeLifecycleTransition("draft", "active")).toBe(false);
  });

  it("rejects retired -> active (no un-retiring; forward-chain via replacementNodeId only)", () => {
    expect(isValidKnowledgeLifecycleTransition("retired", "active")).toBe(false);
  });

  it("rejects archived -> retired (no reversal of terminal state)", () => {
    expect(isValidKnowledgeLifecycleTransition("archived", "retired")).toBe(false);
  });

  it("rejects active -> draft (no such edge in the resolved matrix)", () => {
    expect(isValidKnowledgeLifecycleTransition("active", "draft")).toBe(false);
  });

  it("rejects active -> archived directly (must pass through retired)", () => {
    expect(isValidKnowledgeLifecycleTransition("active", "archived")).toBe(false);
  });
});

describe("isTerminalKnowledgeLifecycleStatus", () => {
  it("archived is terminal", () => {
    expect(isTerminalKnowledgeLifecycleStatus("archived")).toBe(true);
  });

  it("draft/in_review/active/retired are not terminal", () => {
    expect(isTerminalKnowledgeLifecycleStatus("draft")).toBe(false);
    expect(isTerminalKnowledgeLifecycleStatus("in_review")).toBe(false);
    expect(isTerminalKnowledgeLifecycleStatus("active")).toBe(false);
    expect(isTerminalKnowledgeLifecycleStatus("retired")).toBe(false);
  });
});
