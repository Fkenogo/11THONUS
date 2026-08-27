import { describe, expect, it, vi } from "vitest";
import { toCallGetMyDisplayName, toCallSetDisplayName } from "./displayName";
import { IdentityApiError } from "./identityCallableClient";
import type { AuthenticatedActor } from "./identityCallableClient";

function makeActor(overrides: Partial<AuthenticatedActor> = {}): AuthenticatedActor {
  return {
    getIdToken: vi.fn(async () => "raw-token"),
    referenceType: "google_sign_in",
    ...overrides,
  };
}

describe("toCallGetMyDisplayName", () => {
  it("attaches rawToken/referenceType and returns the plain result", async () => {
    const callable = vi.fn(async () => ({ data: { displayName: "Amélie Dubois" } }));
    const call = toCallGetMyDisplayName(callable);
    const actor = makeActor();

    const result = await call(actor);

    expect(callable).toHaveBeenCalledWith({
      rawToken: "raw-token",
      referenceType: "google_sign_in",
    });
    expect(result).toEqual({ displayName: "Amélie Dubois" });
  });

  it("returns an undefined displayName as genuinely absent, never fabricated", async () => {
    const callable = vi.fn(async () => ({ data: {} }));
    const call = toCallGetMyDisplayName(callable);

    const result = await call(makeActor());

    expect(result).toEqual({});
    expect(result.displayName).toBeUndefined();
  });

  it("never accepts a client-supplied target user id — no such parameter exists", () => {
    // Structural proof: the function signature accepts only an actor, no id.
    expect(toCallGetMyDisplayName(vi.fn()).length).toBe(1);
  });

  it("normalizes a thrown callable error into an IdentityApiError, never the raw message", async () => {
    const callable = vi.fn(async () => {
      throw { code: "functions/invalid-argument", message: "internal detail" };
    });
    const call = toCallGetMyDisplayName(callable);

    await expect(call(makeActor())).rejects.toBeInstanceOf(IdentityApiError);
    await expect(call(makeActor())).rejects.toMatchObject({ code: "validation_failed" });
  });
});

describe("toCallSetDisplayName", () => {
  it("sends displayName + idempotencyKey alongside the actor's token/referenceType", async () => {
    const callable = vi.fn(async () => ({ data: { displayName: "김민준" } }));
    const call = toCallSetDisplayName(callable);
    const actor = makeActor();

    const result = await call(actor, { displayName: "김민준", idempotencyKey: "key-1" });

    expect(callable).toHaveBeenCalledWith({
      displayName: "김민준",
      idempotencyKey: "key-1",
      rawToken: "raw-token",
      referenceType: "google_sign_in",
    });
    expect(result).toEqual({ displayName: "김민준" });
  });

  it("returns the backend-authoritative saved value, not a local echo", async () => {
    // Server may normalize (trim) — the adapter must return exactly what came back.
    const callable = vi.fn(async () => ({ data: { displayName: "Trimmed Name" } }));
    const call = toCallSetDisplayName(callable);

    const result = await call(makeActor(), {
      displayName: "  Trimmed Name  ",
      idempotencyKey: "key-2",
    });

    expect(result.displayName).toBe("Trimmed Name");
  });
});
