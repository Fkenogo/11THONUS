/**
 * Proves mutation-success invalidation stays scoped to the acting
 * customer's own identity-scoped cache keys (`PLATFORM-BASELINE-006A-CORR-002`)
 * — never a bare, actor-independent key that could touch another
 * customer's entries in the shared `QueryClient`.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { Auth, User, Unsubscribe } from "firebase/auth";
import { useVerifyPurchaseMutation } from "./purchaseMutations";
import { customerPurchaseQueryKeys } from "./queryKeys";

const verifyPurchase = vi.fn();

vi.mock("../api/purchaseClient", () => ({
  makeCustomerPurchaseCalls: () => ({
    verifyPurchase: (...args: unknown[]) => verifyPurchase(...args),
  }),
}));

function fakeAuth(user: User | null): Auth {
  return {
    onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
      callback(user);
      return () => {};
    },
  } as unknown as Auth;
}

function fakeUser(uid: string): User {
  return {
    uid,
    providerData: [{ providerId: "google.com" }],
    getIdToken: async () => `token-${uid}`,
  } as unknown as User;
}

function wrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("useVerifyPurchaseMutation invalidation scope", () => {
  it("invalidates only Customer A's identity-scoped keys, never a bare or another customer's key", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const auth = fakeAuth(fakeUser("uid-customer-a"));
    const platform = { auth, functions: {} as never };

    verifyPurchase.mockResolvedValueOnce({ purchase: { id: "p-1" } });
    const { result } = renderHook(() => useVerifyPurchaseMutation(platform), {
      wrapper: wrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ purchaseRecordId: "p-1" });
    });

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(3));
    const invalidatedKeys = invalidateSpy.mock.calls.map((call) => call[0]?.queryKey);
    expect(invalidatedKeys).toContainEqual(customerPurchaseQueryKeys.waiting("uid-customer-a"));
    expect(invalidatedKeys).toContainEqual(
      customerPurchaseQueryKeys.purchase("uid-customer-a", "p-1"),
    );
    expect(invalidatedKeys).toContainEqual(customerPurchaseQueryKeys.rewards("uid-customer-a"));

    // Never the unscoped pre-fix shape and never another customer's scope.
    for (const key of invalidatedKeys) {
      expect(key).toContain("uid-customer-a");
      expect(key).not.toContain("uid-customer-b");
    }
  });
});
