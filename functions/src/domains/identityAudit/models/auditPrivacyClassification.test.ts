import { describe, expect, it } from "vitest";
import {
  classifyIdentityEventPrivacy,
  AUDIT_PRIVACY_CLASSIFICATIONS,
} from "./auditPrivacyClassification";

describe("classifyIdentityEventPrivacy", () => {
  it("classifies loyalty number issuance as class 3 (personal data)", () => {
    expect(classifyIdentityEventPrivacy("loyaltyNumber.loyalty_number_issued.v1")).toBe(
      "class_3_personal_data",
    );
  });

  it("classifies qr identity issuance as class 3 (personal data)", () => {
    expect(classifyIdentityEventPrivacy("qrIdentity.qr_identity_issued.v1")).toBe(
      "class_3_personal_data",
    );
  });

  it("classifies a lifecycle transition as class 2 (internal operational)", () => {
    expect(classifyIdentityEventPrivacy("identity.customer_identity_activated.v1")).toBe(
      "class_2_internal_operational",
    );
  });

  it("classifies identity lookup attempts as class 2 (internal operational)", () => {
    expect(classifyIdentityEventPrivacy("identity.identity_lookup_attempted.v1")).toBe(
      "class_2_internal_operational",
    );
  });

  it("classifies an unrecognised event type as class 2 (internal operational), the conservative default", () => {
    expect(classifyIdentityEventPrivacy("identity.some_future_event.v1")).toBe(
      "class_2_internal_operational",
    );
  });

  it("classifies AUTH-08 authentication trust signals as class 2 (internal operational)", () => {
    // Both carry only categorical context (reference type, proof-method
    // category) — no personal data, no secret/credential material.
    expect(classifyIdentityEventPrivacy("authentication.customer_authenticated.v1")).toBe(
      "class_2_internal_operational",
    );
    expect(
      classifyIdentityEventPrivacy("authentication.authentication_recovery_proof_provided.v1"),
    ).toBe("class_2_internal_operational");
  });

  it("exposes the full closed set of classifications", () => {
    expect(AUDIT_PRIVACY_CLASSIFICATIONS).toEqual([
      "class_1_public",
      "class_2_internal_operational",
      "class_3_personal_data",
      "class_4_sensitive_personal_data",
      "class_5_secrets_and_credentials",
    ]);
  });
});
