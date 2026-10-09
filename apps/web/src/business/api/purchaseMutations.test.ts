import { describe, expect, it } from "vitest";
import { BusinessApiError } from "./businessCallableClient";
import { isRetryableBusinessErrorCode } from "./businessCallableClient";
import {
  toCallRecordPurchase,
  toCallListMyRecentCounterPurchases,
  toCallGetCounterLoyaltyContext,
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

/**
 * `EA-BL-001-CORR-002-B` §22.2: a dropped connection / lost response must keep the idempotency key.
 * The Firebase SDK reports it as `functions/internal` (status 0); the shared mapping calls that a
 * definitive `failed`, which would make the key holder DISCARD the key. `recordPurchase` classifies
 * it as uncertain (retryable) instead — every other callable is unchanged.
 */
describe("toCallRecordPurchase — uncertain/network failures are retryable", () => {
  const request = {
    businessId: "b-1",
    rewardProgramId: "rp-1",
    quantity: 1,
    qualifyingItemId: "3f2b8c1e-9d4a-4e6b-8a1c-0d5e7f9a2b3c",
    purchaseDate: "2026-09-14T10:00:00.000Z",
    idempotencyKey: "k",
  };
  const failWith = (error: unknown) =>
    toCallRecordPurchase(async () => {
      throw error;
    })(actor, request);
  const codeOf = async (error: unknown) =>
    ((await failWith(error).catch((e: unknown) => e)) as BusinessApiError).code;

  it.each([
    "functions/internal",
    "functions/unknown",
    "functions/cancelled",
    "functions/unavailable",
    "functions/deadline-exceeded",
  ])("%s is retryable, so the held key survives", async (code) => {
    const mapped = await codeOf(Object.assign(new Error("x"), { code }));
    expect(isRetryableBusinessErrorCode(mapped)).toBe(true);
  });

  it("a bare network error with no Firebase code is uncertain too", async () => {
    expect(isRetryableBusinessErrorCode(await codeOf(new TypeError("Failed to fetch")))).toBe(true);
  });

  it.each([
    ["functions/invalid-argument", "validation_failed"],
    ["functions/permission-denied", "auth_forbidden"],
    ["functions/unauthenticated", "auth_required"],
    ["functions/aborted", "conflict"],
    ["functions/not-found", "not_found"],
  ])("a definitive %s stays non-retryable (%s)", async (code, expected) => {
    const mapped = await codeOf(Object.assign(new Error("x"), { code }));
    expect(mapped).toBe(expected);
    expect(isRetryableBusinessErrorCode(mapped)).toBe(false);
  });

  it("carries only a known closed `reason` from a validation failure, never a raw message", async () => {
    const err = (await failWith(
      Object.assign(new Error("Loyalty Number ABC234 unknown"), {
        code: "functions/invalid-argument",
        details: { reason: "programme_unavailable", field: "x", secret: "s" },
      }),
    ).catch((e: unknown) => e)) as BusinessApiError;
    expect(err.reason).toBe("programme_unavailable");
    expect(JSON.stringify(err)).not.toContain("ABC234");
  });

  it("ignores an unknown reason token and a reason on a non-validation error", async () => {
    const unknown = (await failWith(
      Object.assign(new Error("x"), {
        code: "functions/invalid-argument",
        details: { reason: "totally_new_token" },
      }),
    ).catch((e: unknown) => e)) as BusinessApiError;
    expect(unknown.reason).toBeUndefined();
    const forbidden = (await failWith(
      Object.assign(new Error("x"), {
        code: "functions/permission-denied",
        details: { reason: "programme_unavailable" },
      }),
    ).catch((e: unknown) => e)) as BusinessApiError;
    expect(forbidden.reason).toBeUndefined();
  });
});

describe("toCallListMyRecentCounterPurchases", () => {
  it("sends only the Business scope and limit — never a recorder id", async () => {
    const call = toCallListMyRecentCounterPurchases(async (payload) => {
      expect(payload).toEqual({
        businessId: "b-1",
        limit: 5,
        rawToken: "t",
        referenceType: "email",
      });
      return { data: { purchases: [], nextCursor: null } };
    });
    expect((await call(actor, { businessId: "b-1", limit: 5 })).purchases).toEqual([]);
  });

  it("carries the opaque cursor for 'load more' and nothing else", async () => {
    const call = toCallListMyRecentCounterPurchases(async (payload) => {
      expect(payload).toEqual({
        businessId: "b-1",
        limit: 20,
        cursor: "opaque",
        rawToken: "t",
        referenceType: "email",
      });
      return { data: { purchases: [], nextCursor: "next" } };
    });
    expect((await call(actor, { businessId: "b-1", limit: 20, cursor: "opaque" })).nextCursor).toBe(
      "next",
    );
  });
});

describe("toCallGetCounterLoyaltyContext", () => {
  it("sends exactly the Business, the Programme and ONE presented artifact — never a Customer id", async () => {
    const seen: Record<string, unknown>[] = [];
    const call = toCallGetCounterLoyaltyContext(async (payload) => {
      seen.push(payload);
      return {
        data: {
          verifiedUnits: 3,
          requiredVerifiedUnits: 10,
          rewardStatus: "none" as const,
          awaitingCustomerConfirmationUnits: 0,
        },
      };
    });
    await call(actor, { businessId: "b-1", rewardProgramId: "rp-1", loyaltyNumberValue: "ABC234" });
    await call(actor, { businessId: "b-1", rewardProgramId: "rp-1", qrReference: "qr-ref" });
    expect(seen).toEqual([
      {
        businessId: "b-1",
        rewardProgramId: "rp-1",
        loyaltyNumberValue: "ABC234",
        rawToken: "t",
        referenceType: "email",
      },
      {
        businessId: "b-1",
        rewardProgramId: "rp-1",
        qrReference: "qr-ref",
        rawToken: "t",
        referenceType: "email",
      },
    ]);
  });
});
