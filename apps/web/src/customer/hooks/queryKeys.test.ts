import { describe, expect, it } from "vitest";
import { customerPurchaseQueryKeys } from "./queryKeys";

describe("customerPurchaseQueryKeys", () => {
  it("produces distinct waiting/purchase/rewards keys for different identity scopes", () => {
    expect(customerPurchaseQueryKeys.waiting("uid-a")).not.toEqual(
      customerPurchaseQueryKeys.waiting("uid-b"),
    );
    expect(customerPurchaseQueryKeys.purchase("uid-a", "p-1")).not.toEqual(
      customerPurchaseQueryKeys.purchase("uid-b", "p-1"),
    );
    expect(customerPurchaseQueryKeys.rewards("uid-a")).not.toEqual(
      customerPurchaseQueryKeys.rewards("uid-b"),
    );
  });

  it("produces the same key for the same identity scope, so same-customer caching is unaffected", () => {
    expect(customerPurchaseQueryKeys.waiting("uid-a")).toEqual(
      customerPurchaseQueryKeys.waiting("uid-a"),
    );
    expect(customerPurchaseQueryKeys.purchase("uid-a", "p-1")).toEqual(
      customerPurchaseQueryKeys.purchase("uid-a", "p-1"),
    );
    expect(customerPurchaseQueryKeys.rewards("uid-a")).toEqual(
      customerPurchaseQueryKeys.rewards("uid-a"),
    );
  });
});
