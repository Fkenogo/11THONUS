import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { Auth, User, Unsubscribe } from "firebase/auth";
import { useAuthenticatedActor } from "./useAuthenticatedActor";

function fakeAuth(user: User | null): Auth {
  return {
    onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
      callback(user);
      return () => {};
    },
  } as unknown as Auth;
}

describe("useAuthenticatedActor", () => {
  it("resolves an actor with a working getIdToken and the mapped referenceType", async () => {
    const user = {
      uid: "u-1",
      providerData: [{ providerId: "google.com" }],
      getIdToken: async () => "token-abc",
    } as unknown as User;

    const auth = fakeAuth(user);
    const { result } = renderHook(() => useAuthenticatedActor(auth));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.status).toBe("ready");
    if (result.current.status === "ready") {
      expect(result.current.actor.referenceType).toBe("google_sign_in");
      await expect(result.current.actor.getIdToken()).resolves.toBe("token-abc");
    }
  });

  it("reports an unauthenticated status when no user is signed in", async () => {
    const auth = fakeAuth(null);
    const { result } = renderHook(() => useAuthenticatedActor(auth));

    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));
  });

  it("reports an error status when the signed-in user's provider cannot be mapped", async () => {
    const user = {
      uid: "u-1",
      providerData: [{ providerId: "apple.com" }],
      getIdToken: async () => "token-abc",
    } as unknown as User;

    const auth = fakeAuth(user);
    const { result } = renderHook(() => useAuthenticatedActor(auth));

    await waitFor(() => expect(result.current.status).toBe("error"));
  });
});
