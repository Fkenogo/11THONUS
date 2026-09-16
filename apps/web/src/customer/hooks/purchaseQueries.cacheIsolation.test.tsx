/**
 * Reproduces the confirmed P1 defect (`PLATFORM-BASELINE-006A-CORR-002`):
 * with a single long-lived `QueryClient` (`main.tsx`), signing Customer A
 * out and Customer B in during the same SPA session must never let
 * Customer B synchronously see Customer A's cached waiting purchases,
 * purchase detail, or rewards before Customer B's own fetch resolves.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { Auth, User, Unsubscribe } from "firebase/auth";
import {
  useWaitingPurchasesQuery,
  useCustomerPurchaseQuery,
  useAvailableRewardsQuery,
} from "./purchaseQueries";

const waitingPurchases = vi.fn();
const purchaseDetail = vi.fn();
const availableRewards = vi.fn();

vi.mock("../api/purchaseClient", () => ({
  makeCustomerPurchaseCalls: () => ({
    waitingPurchases: (...args: unknown[]) => waitingPurchases(...args),
    purchaseDetail: (...args: unknown[]) => purchaseDetail(...args),
    availableRewards: (...args: unknown[]) => availableRewards(...args),
  }),
}));

function fakeUser(uid: string): User {
  return {
    uid,
    providerData: [{ providerId: "google.com" }],
    getIdToken: async () => `token-${uid}`,
  } as unknown as User;
}

/** An `Auth` whose `onAuthStateChanged` callback we can fire on demand, simulating sign-out/sign-in transitions within one mounted session — never re-subscribing, exactly like the real app's single `onAuthStateChanged` listener. */
function makeControllableAuth() {
  let listener: ((user: User | null) => void) | null = null;
  const auth = {
    onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
      listener = callback;
      return () => {
        listener = null;
      };
    },
  } as unknown as Auth;
  return {
    auth,
    emit: (user: User | null) => listener?.(user),
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function wrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const functions = {} as never;

afterEach(() => {
  vi.clearAllMocks();
});

describe("customer purchase query cache isolation across an identity transition", () => {
  it("never exposes Customer A's waiting purchases to Customer B before B's own fetch resolves", async () => {
    const queryClient = new QueryClient();
    const { auth, emit } = makeControllableAuth();
    const platform = { auth, functions };

    waitingPurchases.mockResolvedValueOnce({ purchases: [{ id: "a-purchase" }] });
    const { result } = renderHook(() => useWaitingPurchasesQuery(platform), {
      wrapper: wrapper(queryClient),
    });

    emit(fakeUser("uid-customer-a"));
    await waitFor(() => expect(result.current.data).toEqual({ purchases: [{ id: "a-purchase" }] }));

    // Customer A signs out.
    emit(null);

    // Customer B becomes ready in the SAME QueryClient/session. Their
    // fetch is held open deliberately so the test can assert on the
    // synchronous state before it settles.
    const bFetch = deferred<{ purchases: { id: string }[] }>();
    waitingPurchases.mockReturnValueOnce(bFetch.promise);
    emit(fakeUser("uid-customer-b"));

    await waitFor(() => expect(waitingPurchases).toHaveBeenCalledTimes(2));
    // The defect under test: Customer B must not synchronously render
    // Customer A's stale cached data while B's own request is in flight.
    expect(result.current.data).not.toEqual({ purchases: [{ id: "a-purchase" }] });
    expect(result.current.isPending).toBe(true);

    bFetch.resolve({ purchases: [{ id: "b-purchase" }] });
    await waitFor(() => expect(result.current.data).toEqual({ purchases: [{ id: "b-purchase" }] }));

    // Customer A's now-orphaned cache entry is untouched (isolated, not
    // wiped) — it simply lives under a key Customer B's session never reads.
    expect(queryClient.getQueryData(["customerPurchases", "waiting", "uid-customer-a"])).toEqual({
      purchases: [{ id: "a-purchase" }],
    });
    expect(queryClient.getQueryData(["customerPurchases", "waiting", "uid-customer-b"])).toEqual({
      purchases: [{ id: "b-purchase" }],
    });
  });

  it("never exposes Customer A's purchase-detail cache to Customer B", async () => {
    const queryClient = new QueryClient();
    const { auth, emit } = makeControllableAuth();
    const platform = { auth, functions };

    purchaseDetail.mockResolvedValueOnce({ purchase: { id: "p-1", owner: "a" }, events: [] });
    const { result } = renderHook(() => useCustomerPurchaseQuery(platform, "p-1"), {
      wrapper: wrapper(queryClient),
    });

    emit(fakeUser("uid-customer-a"));
    await waitFor(() =>
      expect(result.current.data).toEqual({ purchase: { id: "p-1", owner: "a" }, events: [] }),
    );

    emit(null);
    const bFetch = deferred<{ purchase: { id: string; owner: string }; events: unknown[] }>();
    purchaseDetail.mockReturnValueOnce(bFetch.promise);
    emit(fakeUser("uid-customer-b"));

    await waitFor(() => expect(purchaseDetail).toHaveBeenCalledTimes(2));
    expect(result.current.data).not.toEqual({ purchase: { id: "p-1", owner: "a" }, events: [] });
    expect(result.current.isPending).toBe(true);

    bFetch.resolve({ purchase: { id: "p-1", owner: "b" }, events: [] });
    await waitFor(() =>
      expect(result.current.data).toEqual({ purchase: { id: "p-1", owner: "b" }, events: [] }),
    );
  });

  it("never exposes Customer A's available rewards to Customer B", async () => {
    const queryClient = new QueryClient();
    const { auth, emit } = makeControllableAuth();
    const platform = { auth, functions };

    availableRewards.mockResolvedValueOnce({ rewards: [{ id: "reward-a" }] });
    const { result } = renderHook(() => useAvailableRewardsQuery(platform), {
      wrapper: wrapper(queryClient),
    });

    emit(fakeUser("uid-customer-a"));
    await waitFor(() => expect(result.current.data).toEqual({ rewards: [{ id: "reward-a" }] }));

    emit(null);
    const bFetch = deferred<{ rewards: { id: string }[] }>();
    availableRewards.mockReturnValueOnce(bFetch.promise);
    emit(fakeUser("uid-customer-b"));

    await waitFor(() => expect(availableRewards).toHaveBeenCalledTimes(2));
    expect(result.current.data).not.toEqual({ rewards: [{ id: "reward-a" }] });
    expect(result.current.isPending).toBe(true);

    bFetch.resolve({ rewards: [{ id: "reward-b" }] });
    await waitFor(() => expect(result.current.data).toEqual({ rewards: [{ id: "reward-b" }] }));
  });

  it("still serves cached data instantly on refetch for the SAME customer (no regression)", async () => {
    const queryClient = new QueryClient();
    const { auth, emit } = makeControllableAuth();
    const platform = { auth, functions };

    waitingPurchases.mockResolvedValue({ purchases: [{ id: "a-purchase" }] });
    const { result, unmount } = renderHook(() => useWaitingPurchasesQuery(platform), {
      wrapper: wrapper(queryClient),
    });
    emit(fakeUser("uid-customer-a"));
    await waitFor(() => expect(result.current.data).toEqual({ purchases: [{ id: "a-purchase" }] }));
    unmount();

    // Customer A remounts the surface (e.g. re-navigates) without ever
    // signing out — same identity scope, same QueryClient.
    const { result: secondMount } = renderHook(() => useWaitingPurchasesQuery(platform), {
      wrapper: wrapper(queryClient),
    });
    emit(fakeUser("uid-customer-a"));
    await waitFor(() =>
      expect(secondMount.current.data).toEqual({ purchases: [{ id: "a-purchase" }] }),
    );
  });
});
