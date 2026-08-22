import { describe, expect, it, vi } from "vitest";
import { createIdempotencyKeyHolder } from "./idempotencyKeyHolder";

describe("createIdempotencyKeyHolder", () => {
  it("generates a key lazily and reuses it across repeated getKey() calls (retries of the same action)", () => {
    const newKey = vi.fn().mockReturnValueOnce("key-1").mockReturnValueOnce("key-2");
    const holder = createIdempotencyKeyHolder(newKey);

    expect(holder.getKey()).toBe("key-1");
    expect(holder.getKey()).toBe("key-1");
    expect(newKey).toHaveBeenCalledOnce();
  });

  it("issues a fresh key after clear() — a genuinely new action", () => {
    const newKey = vi.fn().mockReturnValueOnce("key-1").mockReturnValueOnce("key-2");
    const holder = createIdempotencyKeyHolder(newKey);

    expect(holder.getKey()).toBe("key-1");
    holder.clear();
    expect(holder.getKey()).toBe("key-2");
  });

  it("does not regenerate the key merely because clear() was never called (unresolved outcome keeps the key alive for retry)", () => {
    const newKey = vi.fn().mockReturnValue("key-1");
    const holder = createIdempotencyKeyHolder(newKey);

    holder.getKey();
    holder.getKey();
    holder.getKey();

    expect(newKey).toHaveBeenCalledOnce();
  });
});
