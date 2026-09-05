import { describe, expect, it, vi } from "vitest";
import { MfaApiError } from "./mfaCallableClient";
import type { AuthenticatedActor } from "./mfaCallableClient";
import {
  toCallDiscoverPlatformAdministrator,
  type DiscoverPlatformAdministratorResult,
} from "./discoverPlatformAdministrator";

const actor: AuthenticatedActor = {
  getIdToken: async () => "raw-token",
  referenceType: "google_sign_in",
};

describe("toCallDiscoverPlatformAdministrator", () => {
  it("attaches the actor rawToken and referenceType and unwraps the result", async () => {
    const callable = vi.fn(async (): Promise<{ data: DiscoverPlatformAdministratorResult }> => ({
      data: { isPlatformAdministrator: true },
    }));
    const call = toCallDiscoverPlatformAdministrator(callable);

    const result = await call(actor);

    expect(result).toEqual({ isPlatformAdministrator: true });
    expect(callable).toHaveBeenCalledWith({
      rawToken: "raw-token",
      referenceType: "google_sign_in",
    });
  });

  it("sends nothing identity-selecting beyond the governed transport fields", async () => {
    const seen: Record<string, unknown>[] = [];
    const callable = vi.fn(
      async (
        payload: Record<string, unknown>,
      ): Promise<{ data: DiscoverPlatformAdministratorResult }> => {
        seen.push(payload);
        return { data: { isPlatformAdministrator: false } };
      },
    );
    const call = toCallDiscoverPlatformAdministrator(callable);

    await call(actor);

    expect(Object.keys(seen[0]).sort()).toEqual(["rawToken", "referenceType"]);
  });

  it("normalizes a thrown ServerCode into an MfaApiError", async () => {
    const callable = vi.fn(async () => {
      throw { code: "functions/unavailable" };
    });
    const call = toCallDiscoverPlatformAdministrator(callable);

    await expect(call(actor)).rejects.toMatchObject({ code: "unavailable" });
    await expect(call(actor)).rejects.toBeInstanceOf(MfaApiError);
  });

  it("collapses unknown codes into the opaque failed code and never echoes the raw message", async () => {
    const callable = vi.fn(async () => {
      throw { code: "functions/internal", message: "TOP-SECRET-INTERNAL-DETAILS" };
    });
    const call = toCallDiscoverPlatformAdministrator(callable);

    const error = await call(actor).then(
      () => null,
      (e: unknown) => e,
    );
    expect((error as { code?: string }).code).toBe("failed");
    expect(JSON.stringify(error)).not.toContain("TOP-SECRET");
  });
});
