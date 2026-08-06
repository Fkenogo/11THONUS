import { describe, expect, it } from "vitest";
import { projectAuditPayload } from "./auditPayloadProjection";

describe("projectAuditPayload", () => {
  it("omits the raw loyalty number from a loyalty_number_issued payload", () => {
    const projected = projectAuditPayload("loyaltyNumber.loyalty_number_issued.v1", {
      customerIdentityId: "cust_1",
      loyaltyNumber: { value: "ABC-234" },
    });

    expect(JSON.stringify(projected)).not.toContain("ABC-234");
    expect(projected).not.toHaveProperty("loyaltyNumber");
  });

  it("omits the raw qr reference from a qr_identity_issued payload", () => {
    const projected = projectAuditPayload("qrIdentity.qr_identity_issued.v1", {
      customerIdentityId: "cust_1",
      qrReference: "raw-qr-value-123",
    });

    expect(JSON.stringify(projected)).not.toContain("raw-qr-value-123");
    expect(projected).not.toHaveProperty("qrReference");
  });

  it("omits the raw qr reference from a qr_identity_invalidated payload", () => {
    const projected = projectAuditPayload("qrIdentity.qr_identity_invalidated.v1", {
      customerIdentityId: "cust_1",
      qrReference: "raw-qr-value-456",
    });

    expect(JSON.stringify(projected)).not.toContain("raw-qr-value-456");
  });

  it("omits both current and previous raw qr reference from a qr_identity_regenerated payload", () => {
    const projected = projectAuditPayload("qrIdentity.qr_identity_regenerated.v1", {
      customerIdentityId: "cust_1",
      qrReference: "new-qr-789",
      previousQrReference: "old-qr-000",
    });

    const serialized = JSON.stringify(projected);
    expect(serialized).not.toContain("new-qr-789");
    expect(serialized).not.toContain("old-qr-000");
  });

  it("omits the raw authentication reference id from a linked payload but keeps referenceType/authority/reason", () => {
    const projected = projectAuditPayload("identity.authentication_reference_linked.v1", {
      customerIdentityId: "cust_1",
      referenceId: "raw-provider-subject-abc",
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_requested",
    });

    expect(JSON.stringify(projected)).not.toContain("raw-provider-subject-abc");
    expect(projected).toMatchObject({
      referenceType: "google_sign_in",
      authority: "customer_initiated",
      reason: "customer_requested",
    });
  });

  it("omits the raw authentication reference id from an unlinked payload", () => {
    const projected = projectAuditPayload("identity.authentication_reference_unlinked.v1", {
      customerIdentityId: "cust_1",
      referenceId: "raw-provider-subject-def",
      authority: "customer_initiated",
      reason: "customer_requested",
    });

    expect(JSON.stringify(projected)).not.toContain("raw-provider-subject-def");
    expect(projected).toMatchObject({
      authority: "customer_initiated",
      reason: "customer_requested",
    });
  });

  it("never includes a raw lookup value on an identity_lookup_attempted payload (none was ever present)", () => {
    const projected = projectAuditPayload("identity.identity_lookup_attempted.v1", {
      customerIdentityId: "cust_1",
      lookupType: "loyalty_number",
      purpose: "support",
      outcome: "resolved",
    });

    expect(projected).toEqual({
      lookupType: "loyalty_number",
      purpose: "support",
      outcome: "resolved",
    });
  });

  it("omits the raw recovery proof reference from an identity_recovered payload", () => {
    const projected = projectAuditPayload("identity.identity_recovered.v1", {
      customerIdentityId: "cust_1",
      previousStatus: "suspended",
      resultingStatus: "active",
      authority: "support_initiated",
      reason: "support_assisted_recovery",
      recoveryProofReference: "raw-proof-reference-xyz",
      proofMethodCategory: "phone_otp",
    });

    expect(JSON.stringify(projected)).not.toContain("raw-proof-reference-xyz");
    expect(projected).toMatchObject({
      previousStatus: "suspended",
      resultingStatus: "active",
      authority: "support_initiated",
      reason: "support_assisted_recovery",
      proofMethodCategory: "phone_otp",
    });
  });

  it("preserves authority/reason/previousStatus for a lifecycle transition event", () => {
    const projected = projectAuditPayload("identity.customer_identity_activated.v1", {
      customerIdentityId: "cust_1",
      previousStatus: "dormant",
      authority: "system_initiated",
      reason: "automatic_reactivation",
    });

    expect(projected).toEqual({
      previousStatus: "dormant",
      authority: "system_initiated",
      reason: "automatic_reactivation",
    });
  });

  it("omits the raw trust record reference from a trust_reference_updated payload, returning no fields (ENG-P2-ARCH-CORR-003, Finding F3)", () => {
    const projected = projectAuditPayload("identity.trust_reference_updated.v1", {
      customerIdentityId: "cust_1",
      trustRecordId: "raw-trust-record-id-xyz",
    });

    expect(JSON.stringify(projected)).not.toContain("raw-trust-record-id-xyz");
    expect(projected).toEqual({});
  });

  it("fails closed for an unrecognised event type — never passes through an arbitrary payload", () => {
    const projected = projectAuditPayload("identity.some_future_event.v1", {
      customerIdentityId: "cust_1",
      somethingSensitive: "phone:+15551234567",
    });

    expect(JSON.stringify(projected)).not.toContain("phone:+15551234567");
    expect(projected).toEqual({ payloadOmitted: true });
  });
});
