import { describe, expect, it } from "vitest";
import {
  CommerceKnowledgeDomainError,
  invalidKnowledgeNodeFieldError,
  invalidKnowledgeTagFieldError,
  invalidKnowledgeTranslationFieldError,
  invalidKnowledgeLifecycleTransitionError,
  invalidTranslationLifecycleTransitionError,
  invalidParentTypeError,
  hierarchyCycleDetectedError,
  invalidReplacementNodeReferenceError,
  invalidLanguageCodeError,
  invalidSchemaVersionError,
  knowledgeNodeNotEligibleForReferenceError,
} from "./commerceKnowledgeErrors";

describe("CommerceKnowledgeDomainError", () => {
  it("carries the category and message it is constructed with", () => {
    const error = new CommerceKnowledgeDomainError("VALIDATION_FAILED", "bad thing");
    expect(error.category).toBe("VALIDATION_FAILED");
    expect(error.message).toBe("bad thing");
    expect(error.name).toBe("CommerceKnowledgeDomainError");
  });

  it("is an instance of Error", () => {
    const error = new CommerceKnowledgeDomainError("VALIDATION_FAILED", "bad thing");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("field-level error factories map to VALIDATION_FAILED", () => {
  it("invalidKnowledgeNodeFieldError", () => {
    const error = invalidKnowledgeNodeFieldError("canonicalName", "");
    expect(error.category).toBe("VALIDATION_FAILED");
    expect(error.fieldErrors?.[0].field).toBe("canonicalName");
  });

  it("invalidKnowledgeTagFieldError", () => {
    const error = invalidKnowledgeTagFieldError("slug", "");
    expect(error.category).toBe("VALIDATION_FAILED");
    expect(error.fieldErrors?.[0].field).toBe("slug");
  });

  it("invalidKnowledgeTranslationFieldError", () => {
    const error = invalidKnowledgeTranslationFieldError("displayName", "");
    expect(error.category).toBe("VALIDATION_FAILED");
    expect(error.fieldErrors?.[0].field).toBe("displayName");
  });

  it("invalidLanguageCodeError", () => {
    const error = invalidLanguageCodeError("de");
    expect(error.category).toBe("VALIDATION_FAILED");
  });

  it("invalidSchemaVersionError", () => {
    const error = invalidSchemaVersionError(0);
    expect(error.category).toBe("VALIDATION_FAILED");
  });

  it("invalidReplacementNodeReferenceError", () => {
    const error = invalidReplacementNodeReferenceError("node-1");
    expect(error.category).toBe("VALIDATION_FAILED");
  });
});

describe("lifecycle-transition error factories map to INVALID_STATE_TRANSITION", () => {
  it("invalidKnowledgeLifecycleTransitionError", () => {
    const error = invalidKnowledgeLifecycleTransitionError("archived", "active");
    expect(error.category).toBe("INVALID_STATE_TRANSITION");
  });

  it("invalidTranslationLifecycleTransitionError", () => {
    const error = invalidTranslationLifecycleTransitionError("published", "reviewed");
    expect(error.category).toBe("INVALID_STATE_TRANSITION");
  });
});

describe("hierarchy error factories", () => {
  it("invalidParentTypeError maps to VALIDATION_FAILED", () => {
    const error = invalidParentTypeError("standard_product", "industry");
    expect(error.category).toBe("VALIDATION_FAILED");
  });

  it("hierarchyCycleDetectedError maps to VALIDATION_FAILED", () => {
    const error = hierarchyCycleDetectedError("node-1");
    expect(error.category).toBe("VALIDATION_FAILED");
  });
});

describe("knowledgeNodeNotEligibleForReferenceError", () => {
  it("maps to VALIDATION_FAILED", () => {
    const error = knowledgeNodeNotEligibleForReferenceError("node-1", "retired");
    expect(error.category).toBe("VALIDATION_FAILED");
  });
});
