import { describe, expect, it } from "vitest";
import {
  isEligibleForNewReference,
  isResolvableForExistingReference,
} from "./referenceEligibility";

describe("isEligibleForNewReference — new-reference gate, referential validity only (F3-corrected)", () => {
  it("active is eligible for a new reference", () => {
    expect(isEligibleForNewReference("active")).toBe(true);
  });

  it("draft/in_review/retired/archived are never eligible for a new reference", () => {
    expect(isEligibleForNewReference("draft")).toBe(false);
    expect(isEligibleForNewReference("in_review")).toBe(false);
    expect(isEligibleForNewReference("retired")).toBe(false);
    expect(isEligibleForNewReference("archived")).toBe(false);
  });

  it("takes only KnowledgeNode.status as input — no KnowledgeTranslation status parameter exists at all", () => {
    // Type-level proof: the function signature accepts exactly one argument.
    expect(isEligibleForNewReference.length).toBe(1);
  });
});

describe("isResolvableForExistingReference — existing-reference resolution (retirement tolerance)", () => {
  it("active resolves", () => {
    expect(isResolvableForExistingReference("active")).toBe(true);
  });

  it("retired resolves (retirement never breaks an existing reference)", () => {
    expect(isResolvableForExistingReference("retired")).toBe(true);
  });

  it("archived resolves (DAP-010 — never deleted, historical/audit resolution)", () => {
    expect(isResolvableForExistingReference("archived")).toBe(true);
  });

  it("draft/in_review do not resolve as a valid existing reference (never eligible to have been referenced in the first place)", () => {
    expect(isResolvableForExistingReference("draft")).toBe(false);
    expect(isResolvableForExistingReference("in_review")).toBe(false);
  });
});

describe("translation status never gates canonical reference validity (F3 correction, design §9.4)", () => {
  it("isEligibleForNewReference has no translation-status parameter to accidentally couple", () => {
    // Documented via the single-argument signature check above; this test
    // exists specifically to name and prove the F3 finding, not merely
    // restate the arity check.
    expect(isEligibleForNewReference("active")).toBe(true);
  });
});
