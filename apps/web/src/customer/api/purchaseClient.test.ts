import { describe, expect, it } from "vitest";
import { IdentityApiError } from "../../identity/api/identityCallableClient";
import {
  toCallVerifyPurchase,
  toCallAvailableRewards,
  type CustomerPurchaseWire,
} from "./purchaseClient";

const actor = { getIdToken: async () => "t", referenceType: "email" } as const;

const purchaseWire: CustomerPurchaseWire = {
  id: "p-1",
  businessId: "b-1",
  customerIdentityId: "cust-1",
  presentedArtifactType: "loyalty_number",
  presentedArtifactReference: "ABC234",
  canonicalLoyaltyNumberValue: "ABC234",
  rewardProgramId: "rp-1",
  rewardProgramVersionId: "v-1",
  quantity: 2,
  itemLabel: "Coffee",
  purchaseDate: "2026-09-14T10:00:00.000Z",
  notes: null,
  status: "waiting_for_customer",
  verifiedAt: null,
  rejectionReason: null,
  disputeReason: null,
  createdAt: "2026-09-14T10:00:00.000Z",
};

describe("toCallVerifyPurchase", () => {
  it("sends only the purchase id and idempotency key — never a customer identity", async () => {
    const call = toCallVerifyPurchase(async (payload) => {
      expect(payload).toEqual({
        purchaseRecordId: "p-1",
        idempotencyKey: "key-1",
        rawToken: "t",
        referenceType: "email",
      });
      return { data: { purchase: purchaseWire } };
    });
    const result = await call(actor, { purchaseRecordId: "p-1", idempotencyKey: "key-1" });
    expect(result).toEqual({ purchase: purchaseWire });
  });

  it("maps transport failures without surfacing the server message", async () => {
    const call = toCallVerifyPurchase(async () => {
      throw Object.assign(new Error("purchase_command_failed"), { code: "functions/aborted" });
    });
    await expect(
      call(actor, { purchaseRecordId: "p-1", idempotencyKey: "k" }),
    ).rejects.toBeInstanceOf(IdentityApiError);
  });
});

describe("toCallAvailableRewards", () => {
  it("sends no targeting payload — the server scopes by actor identity", async () => {
    const call = toCallAvailableRewards(async (payload) => {
      expect(payload).toEqual({ rawToken: "t", referenceType: "email" });
      return { data: { rewards: [] } };
    });
    const result = await call(actor, {});
    expect(result.rewards).toEqual([]);
  });
});
