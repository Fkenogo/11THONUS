import { describe, expect, it, vi } from "vitest";
import { reauthenticateForPrivilegedAction } from "./privilegedReauthenticationFlow";

describe("reauthenticateForPrivilegedAction", () => {
  it("forces a fresh provider proof, then returns a force-refreshed ID token", async () => {
    const getIdToken = vi.fn(async (): Promise<string> => "fresh-id-token");
    const reauthenticate = vi.fn(async () => ({ user: { getIdToken } }));
    const auth = {} as never;

    const token = await reauthenticateForPrivilegedAction(auth, { reauthenticate });

    expect(reauthenticate).toHaveBeenCalledWith(auth);
    // Force refresh so the new token carries the updated auth_time (the freshness
    // anchor the backend privileged gate enforces).
    expect(getIdToken).toHaveBeenCalledWith(true);
    expect(token).toBe("fresh-id-token");
  });

  it("propagates a re-authentication failure without reading a token", async () => {
    const reauthenticate = vi.fn(async () => {
      throw new Error("reauth cancelled");
    });

    await expect(
      reauthenticateForPrivilegedAction({} as never, { reauthenticate }),
    ).rejects.toThrow("reauth cancelled");
  });
});
