import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDisplayName, getLoyaltyNumber, getQrIdentity } = vi.hoisted(() => ({
  getDisplayName: vi.fn(),
  getLoyaltyNumber: vi.fn(),
  getQrIdentity: vi.fn(),
}));

vi.mock("../domains/identity/repositories/displayNameRepository", () => ({
  readDisplayName: getDisplayName,
}));
vi.mock("../domains/loyaltyNumber/repositories/loyaltyNumberRepository", () => ({
  getLoyaltyNumberAssignmentForIdentity: getLoyaltyNumber,
}));
vi.mock("../domains/qrIdentity/repositories/qrIdentityRepository", () => ({
  getActiveQrIdentityByCustomerIdentityId: getQrIdentity,
}));

import { readCustomerIdentityPresentation } from "./customerIdentityPresentationWiring";

describe("readCustomerIdentityPresentation", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns the canonical identity artifacts scoped to the supplied authenticated identity", async () => {
    getDisplayName.mockResolvedValue({ displayName: "Amina N." });
    getLoyaltyNumber.mockResolvedValue({ loyaltyNumber: "LN-123456" });
    getQrIdentity.mockResolvedValue({ qrReference: "qr_opaque_123" });

    const result = await readCustomerIdentityPresentation({} as never, "customer-a");

    expect(getDisplayName).toHaveBeenCalledWith(expect.anything(), "customer-a");
    expect(getLoyaltyNumber).toHaveBeenCalledWith(expect.anything(), "customer-a");
    expect(getQrIdentity).toHaveBeenCalledWith(expect.anything(), "customer-a");
    expect(result).toEqual({
      displayName: "Amina N.",
      loyaltyNumber: "LN-123456",
      qrReference: "qr_opaque_123",
      status: "ready",
    });
  });

  it("does not invent missing identity artifacts", async () => {
    getDisplayName.mockResolvedValue({});
    getLoyaltyNumber.mockResolvedValue(undefined);
    getQrIdentity.mockResolvedValue(undefined);

    await expect(readCustomerIdentityPresentation({} as never, "customer-a")).resolves.toEqual({
      displayName: null,
      loyaltyNumber: null,
      qrReference: null,
      status: "pending",
    });
  });
});
