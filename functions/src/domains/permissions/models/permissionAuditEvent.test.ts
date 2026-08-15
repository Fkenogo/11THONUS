import { describe, it, expect } from "vitest";
import { mapReasonCodeToDecisionSource } from "./permissionAuditEvent";
import { REASON_CODES } from "../evaluator/types";

describe("mapReasonCodeToDecisionSource", () => {
  it("maps every closed ReasonCode to a governed decisionSource without throwing", () => {
    for (const reasonCode of REASON_CODES) {
      expect(() => mapReasonCodeToDecisionSource(reasonCode)).not.toThrow();
    }
  });

  it("maps the allow-path reason codes correctly", () => {
    expect(mapReasonCodeToDecisionSource("OWNER_FLOOR")).toBe("owner-floor");
    expect(mapReasonCodeToDecisionSource("ROLE_DEFAULT_ALLOW")).toBe("role-default");
    expect(mapReasonCodeToDecisionSource("EXPLICIT_GRANT")).toBe("explicit-grant");
  });

  it("maps the explicit-revocation deny reason code correctly", () => {
    expect(mapReasonCodeToDecisionSource("EXPLICIT_REVOCATION")).toBe("explicit-revocation");
  });

  it("maps sensitive-gate deny reason codes to sensitive-rule", () => {
    expect(mapReasonCodeToDecisionSource("SENSITIVE_PERMISSION_NOT_GRANTED")).toBe(
      "sensitive-rule",
    );
    expect(mapReasonCodeToDecisionSource("GRANT_NOT_HONORED")).toBe("sensitive-rule");
    expect(mapReasonCodeToDecisionSource("MALFORMED_OVERRIDE_DIRECTION")).toBe("sensitive-rule");
    expect(mapReasonCodeToDecisionSource("NO_APPLICABLE_GRANT")).toBe("sensitive-rule");
  });

  it("maps membership-gate reason codes to membership-state-gate", () => {
    expect(mapReasonCodeToDecisionSource("MEMBERSHIP_NOT_FOUND")).toBe("membership-state-gate");
    expect(mapReasonCodeToDecisionSource("MEMBERSHIP_NOT_ACTIVE")).toBe("membership-state-gate");
    expect(mapReasonCodeToDecisionSource("MEMBERSHIP_BUSINESS_MISMATCH")).toBe(
      "membership-state-gate",
    );
  });

  it("maps malformed permission id to unknown-permission", () => {
    expect(mapReasonCodeToDecisionSource("MALFORMED_PERMISSION_ID")).toBe("unknown-permission");
  });

  it("maps business-gate and pure request-validation reason codes to business-state-gate", () => {
    expect(mapReasonCodeToDecisionSource("BUSINESS_NOT_FOUND")).toBe("business-state-gate");
    expect(mapReasonCodeToDecisionSource("BUSINESS_NOT_ACTIVE")).toBe("business-state-gate");
    expect(mapReasonCodeToDecisionSource("NO_SUBJECT")).toBe("business-state-gate");
    expect(mapReasonCodeToDecisionSource("MISSING_BUSINESS_CONTEXT")).toBe("business-state-gate");
  });
});
