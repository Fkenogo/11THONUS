import { describe, expect, it } from "vitest";
import { BusinessApiError } from "./businessCallableClient";
import {
  toCallRecordPurchase,
  toCallListPurchasesForBusiness,
  type PurchaseRecordWire,
} from "./purchaseMutations";

const actor = { getIdToken: async () => "t", referenceType: "email" } as const;

const purchaseWire: PurchaseRecordWire = {
  id: "p-1",
  businessId: "b-1",
  customerIdentityId: "cust-1",
  presentedArtifactType: "loyalty_number",
  presentedArtifactReference: "ABC234",
  canonicalLoyaltyNumberValue: "ABC234",
  rewardProgramId: "rp-1",
  rewardProgramVersionId: "v-1",
  sharedLoyaltyNumberAllowed: true,
  multipleUnitsAllowed: true,
  branchId: "branch-1",
  recordedByUserId: "staff-1",
  recordedByRole: "staff",
  quantity: 2,
  qualifyingItemId: "3f2b8c1e-9d4a-4e6b-8a1c-0d5e7f9a2b3c",
  itemLabel: "Coffee",
  knowledgeNodeId: null,
  unitValueMinor: null,
  currency: null,
  purchaseDate: "2026-09-14T10:00:00.000Z",
  notes: null,
  status: "waiting_for_customer",
  verifiedAt: null,
  rejectionReason: null,
  disputeReason: null,
  correlationId: "corr-1",
  createdAt: "2026-09-14T10:00:00.000Z",
  updatedAt: "2026-09-14T10:00:00.000Z",
  schemaVersion: 1,
};

describe("toCallRecordPurchase", () => {
  it("sends exactly one presented artifact plus commercial fields — never identity/version/recorder authority", async () => {
    const call = toCallRecordPurchase(async (payload) => {
      expect(payload).toEqual({
        businessId: "b-1",
        rewardProgramId: "rp-1",
        loyaltyNumberValue: "ABC234",
        quantity: 2,
        qualifyingItemId: "3f2b8c1e-9d4a-4e6b-8a1c-0d5e7f9a2b3c",
        purchaseDate: "2026-09-14T10:00:00.000Z",
        idempotencyKey: "key-1",
        rawToken: "t",
        referenceType: "email",
      });
      return { data: { purchase: purchaseWire } };
    });

    const result = await call(actor, {
      businessId: "b-1",
      rewardProgramId: "rp-1",
      loyaltyNumberValue: "ABC234",
      quantity: 2,
      qualifyingItemId: "3f2b8c1e-9d4a-4e6b-8a1c-0d5e7f9a2b3c",
      purchaseDate: "2026-09-14T10:00:00.000Z",
      idempotencyKey: "key-1",
    });
    expect(result.purchase.id).toBe("p-1");
  });

  it("maps transport failures to BusinessApiError without surfacing the server message", async () => {
    const call = toCallRecordPurchase(async () => {
      throw Object.assign(new Error("purchase_command_failed"), { code: "functions/aborted" });
    });
    await expect(
      call(actor, {
        businessId: "b-1",
        rewardProgramId: "rp-1",
        quantity: 1,
        qualifyingItemId: "3f2b8c1e-9d4a-4e6b-8a1c-0d5e7f9a2b3c",
        purchaseDate: "2026-09-14T10:00:00.000Z",
        idempotencyKey: "k",
      }),
    ).rejects.toBeInstanceOf(BusinessApiError);
  });
});

describe("toCallListPurchasesForBusiness", () => {
  it("passes the Business scope and optional status filter through", async () => {
    const call = toCallListPurchasesForBusiness(async (payload) => {
      expect(payload).toEqual({
        businessId: "b-1",
        status: "waiting_for_customer",
        rawToken: "t",
        referenceType: "email",
      });
      return { data: { purchases: [] } };
    });
    const result = await call(actor, { businessId: "b-1", status: "waiting_for_customer" });
    expect(result.purchases).toEqual([]);
  });
});
