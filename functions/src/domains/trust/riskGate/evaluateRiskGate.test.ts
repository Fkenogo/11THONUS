import { describe, expect, it } from "vitest";
import { evaluateRiskGate } from "./evaluateRiskGate";
import { RISK_REQUIREMENT_RULE_VERSION } from "./riskRequirement";
import { CURRENT_TRUST_RULE_VERSION } from "../derivation/types";
import type { EffectiveTrustResult } from "../derivation/types";
import type { TrustLevel } from "../models/trustLevel";
import type { EffectiveTrustReadResult } from "./types";

const NOW = new Date("2026-08-17T00:00:00.000Z");

function derived(effectiveTrustLevel: TrustLevel): EffectiveTrustReadResult {
  const result: EffectiveTrustResult = {
    customerIdentityId: "cust-1",
    effectiveTrustLevel,
    ruleVersion: CURRENT_TRUST_RULE_VERSION,
    evaluatedAt: NOW,
    basis: {
      hasSuccessfulAuthentication: effectiveTrustLevel !== "unverified",
      accountAgeDays: 40,
    },
  };
  return { kind: "derived", result };
}

describe("evaluateRiskGate — pure decision function (CAP-P2-ITM-D)", () => {
  describe("Requirement = TRUST_UNVERIFIED_OR_ABOVE", () => {
    it("unverified satisfies", () => {
      const outcome = evaluateRiskGate({
        riskRequirement: "TRUST_UNVERIFIED_OR_ABOVE",
        effectiveTrust: derived("unverified"),
        now: NOW,
      });
      expect(outcome.decision).toBe("sufficient");
      expect(outcome.reasonCode).toBe("TRUST_SUFFICIENT");
    });

    it("provisional satisfies", () => {
      const outcome = evaluateRiskGate({
        riskRequirement: "TRUST_UNVERIFIED_OR_ABOVE",
        effectiveTrust: derived("provisional"),
        now: NOW,
      });
      expect(outcome.decision).toBe("sufficient");
    });

    it("established satisfies", () => {
      const outcome = evaluateRiskGate({
        riskRequirement: "TRUST_UNVERIFIED_OR_ABOVE",
        effectiveTrust: derived("established"),
        now: NOW,
      });
      expect(outcome.decision).toBe("sufficient");
    });
  });

  describe("Requirement = TRUST_PROVISIONAL_OR_ABOVE", () => {
    it("unverified fails", () => {
      const outcome = evaluateRiskGate({
        riskRequirement: "TRUST_PROVISIONAL_OR_ABOVE",
        effectiveTrust: derived("unverified"),
        now: NOW,
      });
      expect(outcome.decision).toBe("insufficient");
      expect(outcome.reasonCode).toBe("TRUST_INSUFFICIENT");
    });

    it("provisional satisfies", () => {
      const outcome = evaluateRiskGate({
        riskRequirement: "TRUST_PROVISIONAL_OR_ABOVE",
        effectiveTrust: derived("provisional"),
        now: NOW,
      });
      expect(outcome.decision).toBe("sufficient");
    });

    it("established satisfies", () => {
      const outcome = evaluateRiskGate({
        riskRequirement: "TRUST_PROVISIONAL_OR_ABOVE",
        effectiveTrust: derived("established"),
        now: NOW,
      });
      expect(outcome.decision).toBe("sufficient");
    });
  });

  describe("Requirement = TRUST_ESTABLISHED_OR_ABOVE", () => {
    it("unverified fails", () => {
      const outcome = evaluateRiskGate({
        riskRequirement: "TRUST_ESTABLISHED_OR_ABOVE",
        effectiveTrust: derived("unverified"),
        now: NOW,
      });
      expect(outcome.decision).toBe("insufficient");
    });

    it("provisional fails", () => {
      const outcome = evaluateRiskGate({
        riskRequirement: "TRUST_ESTABLISHED_OR_ABOVE",
        effectiveTrust: derived("provisional"),
        now: NOW,
      });
      expect(outcome.decision).toBe("insufficient");
    });

    it("established satisfies", () => {
      const outcome = evaluateRiskGate({
        riskRequirement: "TRUST_ESTABLISHED_OR_ABOVE",
        effectiveTrust: derived("established"),
        now: NOW,
      });
      expect(outcome.decision).toBe("sufficient");
    });
  });

  it("malformed requirement fails closed (unavailable, VALIDATION_FAILED) — no fallback to a lower requirement", () => {
    const outcome = evaluateRiskGate({
      riskRequirement: "not-a-real-requirement",
      effectiveTrust: derived("established"),
      now: NOW,
    });
    expect(outcome.decision).toBe("unavailable");
    expect(outcome.reasonCode).toBe("UNKNOWN_RISK_REQUIREMENT");
    expect(outcome.errorCategory).toBe("VALIDATION_FAILED");
    expect(outcome.requiredTrustLevel).toBeUndefined();
  });

  it("blank requirement fails closed, never defaults to TRUST_UNVERIFIED_OR_ABOVE", () => {
    const outcome = evaluateRiskGate({
      riskRequirement: "",
      effectiveTrust: derived("established"),
      now: NOW,
    });
    expect(outcome.decision).toBe("unavailable");
    expect(outcome.reasonCode).toBe("UNKNOWN_RISK_REQUIREMENT");
  });

  it("effective trust unavailable -> unavailable decision, propagates the underlying error category", () => {
    const outcome = evaluateRiskGate({
      riskRequirement: "TRUST_PROVISIONAL_OR_ABOVE",
      effectiveTrust: { kind: "unavailable", errorCategory: "RESOURCE_NOT_FOUND" },
      now: NOW,
    });
    expect(outcome.decision).toBe("unavailable");
    expect(outcome.reasonCode).toBe("EFFECTIVE_TRUST_UNAVAILABLE");
    expect(outcome.errorCategory).toBe("RESOURCE_NOT_FOUND");
    expect(outcome.effectiveTrustLevel).toBeUndefined();
    // A valid requirement's required level is still resolvable and reported even when trust itself is unavailable.
    expect(outcome.requiredTrustLevel).toBe("provisional");
  });

  it("unsupported effective-trust rule version fails closed rather than silently comparing across versions", () => {
    const outcome = evaluateRiskGate({
      riskRequirement: "TRUST_PROVISIONAL_OR_ABOVE",
      effectiveTrust: {
        kind: "derived",
        result: {
          customerIdentityId: "cust-1",
          effectiveTrustLevel: "established",
          ruleVersion: CURRENT_TRUST_RULE_VERSION + 1,
          evaluatedAt: NOW,
          basis: { hasSuccessfulAuthentication: true, accountAgeDays: 999 },
        },
      },
      now: NOW,
    });
    expect(outcome.decision).toBe("unavailable");
    expect(outcome.reasonCode).toBe("UNSUPPORTED_TRUST_RULE_VERSION");
    expect(outcome.errorCategory).toBe("VALIDATION_FAILED");
  });

  it("reports the risk-requirement rule version on every decision, sufficient or not", () => {
    const outcome = evaluateRiskGate({
      riskRequirement: "TRUST_PROVISIONAL_OR_ABOVE",
      effectiveTrust: derived("established"),
      now: NOW,
    });
    expect(outcome.ruleVersion).toBe(RISK_REQUIREMENT_RULE_VERSION);
  });

  it("evaluatedAt is taken from input.now, not the wall clock (purity)", () => {
    const outcome = evaluateRiskGate({
      riskRequirement: "TRUST_UNVERIFIED_OR_ABOVE",
      effectiveTrust: derived("unverified"),
      now: NOW,
    });
    expect(outcome.evaluatedAt).toEqual(NOW);
  });

  it("identical inputs produce identical (deterministic) output", () => {
    const input = {
      riskRequirement: "TRUST_PROVISIONAL_OR_ABOVE" as const,
      effectiveTrust: derived("provisional"),
      now: NOW,
    };
    expect(evaluateRiskGate(input)).toEqual(evaluateRiskGate(input));
  });

  it("no PII/credential material appears anywhere on the decision", () => {
    const outcome = evaluateRiskGate({
      riskRequirement: "TRUST_ESTABLISHED_OR_ABOVE",
      effectiveTrust: derived("established"),
      now: NOW,
    });
    const serialized = JSON.stringify(outcome);
    expect(serialized).not.toMatch(/@/); // no email-shaped content
    expect(Object.keys(outcome).sort()).toEqual(
      [
        "decision",
        "effectiveTrustLevel",
        "evaluatedAt",
        "reasonCode",
        "requiredTrustLevel",
        "ruleVersion",
      ].sort(),
    );
  });
});
