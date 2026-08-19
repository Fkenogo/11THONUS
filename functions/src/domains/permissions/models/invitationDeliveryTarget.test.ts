import { describe, it, expect } from "vitest";
import {
  createInvitationDeliveryTarget,
  isInvitationDeliveryType,
} from "./invitationDeliveryTarget";

describe("invitationDeliveryTarget", () => {
  it("creates a valid email target", () => {
    expect(createInvitationDeliveryTarget({ type: "email", value: "a@b.com" })).toEqual({
      type: "email",
      value: "a@b.com",
    });
  });

  it("creates a valid phone target", () => {
    expect(createInvitationDeliveryTarget({ type: "phone", value: "+15551234567" })).toEqual({
      type: "phone",
      value: "+15551234567",
    });
  });

  it("rejects an unsupported delivery type", () => {
    expect(() => createInvitationDeliveryTarget({ type: "loyaltyNumber", value: "1" })).toThrow(
      /delivery type/i,
    );
  });

  it("rejects a blank value", () => {
    expect(() => createInvitationDeliveryTarget({ type: "email", value: "  " })).toThrow(/value/i);
  });

  it("isInvitationDeliveryType rejects username/social/QR types", () => {
    expect(isInvitationDeliveryType("username")).toBe(false);
    expect(isInvitationDeliveryType("social")).toBe(false);
    expect(isInvitationDeliveryType("qr")).toBe(false);
    expect(isInvitationDeliveryType("loyaltyNumber")).toBe(false);
  });
});
