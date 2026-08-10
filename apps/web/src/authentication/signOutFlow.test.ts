import { describe, expect, it, vi } from "vitest";
import { signOutCurrentSession } from "./signOutFlow";

describe("signOutCurrentSession", () => {
  it("clears the client session via the injected Firebase signOut", async () => {
    const auth = {} as never;
    const signOut = vi.fn(async () => undefined);

    await signOutCurrentSession(auth, { signOut });

    expect(signOut).toHaveBeenCalledWith(auth);
  });

  it("propagates a sign-out failure", async () => {
    const signOut = vi.fn(async () => {
      throw new Error("network");
    });

    await expect(signOutCurrentSession({} as never, { signOut })).rejects.toThrow("network");
  });
});
