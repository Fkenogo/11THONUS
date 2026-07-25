import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CommandEnvelope } from "./commandEnvelope";

const { checkIdempotency, reserveIdempotencyKey, completeIdempotencyKey, failIdempotencyKey } =
  vi.hoisted(() => ({
    checkIdempotency: vi.fn(),
    reserveIdempotencyKey: vi.fn(),
    completeIdempotencyKey: vi.fn(),
    failIdempotencyKey: vi.fn(),
  }));
vi.mock("../idempotency/idempotencyService", () => ({
  checkIdempotency,
  reserveIdempotencyKey,
  completeIdempotencyKey,
  failIdempotencyKey,
}));

const { log } = vi.hoisted(() => ({ log: vi.fn() }));
vi.mock("../logging/logger", () => ({ log }));

const { DomainCommandError, dispatchCommand } = await import("./commandDispatcher");

const db = {} as never;
const auth = { uid: "trusted-uid" };

const validEnvelope: CommandEnvelope<{ amount: number }> = {
  commandId: "cmd-1",
  commandType: "purchase.recordPurchase.v1",
  commandVersion: 1,
  idempotencyKey: "idem-1",
  actor: { userId: "attacker-supplied", authUid: "attacker-supplied" },
  correlationId: "corr-1",
  payload: { amount: 100 },
};

beforeEach(() => {
  checkIdempotency.mockReset();
  reserveIdempotencyKey.mockReset();
  completeIdempotencyKey.mockReset();
  failIdempotencyKey.mockReset();
  log.mockReset();
});

describe("dispatchCommand", () => {
  it("rejects a malformed envelope with VALIDATION_FAILED before touching idempotency or the handler", async () => {
    const handler = vi.fn();

    const result = await dispatchCommand({
      db,
      rawEnvelope: { not: "a valid envelope" },
      auth,
      domain: "purchase",
      service: "recordPurchase",
      operation: "dispatch",
      handler,
    });

    expect(result).toEqual({
      outcome: "error",
      error: expect.objectContaining({ code: "VALIDATION_FAILED" }),
    });
    expect(checkIdempotency).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it("authenticates the actor from trusted context, never from the client-supplied envelope", async () => {
    checkIdempotency.mockResolvedValue({ outcome: "new" });
    const handler = vi.fn().mockResolvedValue({ purchaseId: "p-1" });

    await dispatchCommand({
      db,
      rawEnvelope: validEnvelope,
      auth,
      domain: "purchase",
      service: "s",
      operation: "o",
      handler,
    });

    expect(handler).toHaveBeenCalledWith(
      { amount: 100 },
      expect.objectContaining({ userId: "trusted-uid", authUid: "trusted-uid" }),
      expect.any(String),
    );
  });

  it("returns the cached result without invoking the handler when the idempotency check reports 'duplicate'", async () => {
    checkIdempotency.mockResolvedValue({
      outcome: "duplicate",
      record: { responseSnapshot: { purchaseId: "cached" }, status: "completed" },
    });
    const handler = vi.fn();

    const result = await dispatchCommand({
      db,
      rawEnvelope: validEnvelope,
      auth,
      domain: "purchase",
      service: "s",
      operation: "o",
      handler,
    });

    expect(result).toEqual({
      outcome: "success",
      result: { purchaseId: "cached" },
      fromCache: true,
    });
    expect(handler).not.toHaveBeenCalled();
    expect(reserveIdempotencyKey).not.toHaveBeenCalled();
  });

  it("returns the conflict error without invoking the handler when the idempotency check reports 'conflict'", async () => {
    const conflictError = {
      code: "IDEMPOTENCY_CONFLICT",
      messageKey: "x",
      correlationId: "corr-1",
      retryable: false,
    };
    checkIdempotency.mockResolvedValue({ outcome: "conflict", error: conflictError });
    const handler = vi.fn();

    const result = await dispatchCommand({
      db,
      rawEnvelope: validEnvelope,
      auth,
      domain: "purchase",
      service: "s",
      operation: "o",
      handler,
    });

    expect(result).toEqual({ outcome: "error", error: conflictError });
    expect(handler).not.toHaveBeenCalled();
  });

  it("reserves the idempotency key, calls the handler, and completes the key on success", async () => {
    checkIdempotency.mockResolvedValue({ outcome: "new" });
    const handler = vi.fn().mockResolvedValue({ purchaseId: "p-1" });

    const result = await dispatchCommand({
      db,
      rawEnvelope: validEnvelope,
      auth,
      domain: "purchase",
      service: "s",
      operation: "o",
      handler,
    });

    expect(reserveIdempotencyKey).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ idempotencyKey: "idem-1" }),
    );
    expect(completeIdempotencyKey).toHaveBeenCalledWith(db, "idem-1", undefined, {
      purchaseId: "p-1",
    });
    expect(result).toEqual({ outcome: "success", result: { purchaseId: "p-1" }, fromCache: false });
  });

  it("translates a thrown DomainCommandError into a PlatformErrorResponse and fails the idempotency key", async () => {
    checkIdempotency.mockResolvedValue({ outcome: "new" });
    const handler = vi
      .fn()
      .mockRejectedValue(new DomainCommandError("REWARD_NOT_AVAILABLE", "reward is gone"));

    const result = await dispatchCommand({
      db,
      rawEnvelope: validEnvelope,
      auth,
      domain: "purchase",
      service: "s",
      operation: "o",
      handler,
    });

    expect(result).toEqual({
      outcome: "error",
      error: expect.objectContaining({ code: "REWARD_NOT_AVAILABLE" }),
    });
    expect(failIdempotencyKey).toHaveBeenCalledWith(db, "idem-1");
  });

  it("fails the idempotency key and rethrows an unexpected (non-DomainCommandError) exception rather than swallowing it", async () => {
    checkIdempotency.mockResolvedValue({ outcome: "new" });
    const handler = vi.fn().mockRejectedValue(new Error("unexpected bug"));

    await expect(
      dispatchCommand({
        db,
        rawEnvelope: validEnvelope,
        auth,
        domain: "purchase",
        service: "s",
        operation: "o",
        handler,
      }),
    ).rejects.toThrow("unexpected bug");
    expect(failIdempotencyKey).toHaveBeenCalledWith(db, "idem-1");
  });

  it("logs an OperationalLog entry for every dispatch outcome", async () => {
    checkIdempotency.mockResolvedValue({ outcome: "new" });
    const handler = vi.fn().mockResolvedValue({ purchaseId: "p-1" });

    await dispatchCommand({
      db,
      rawEnvelope: validEnvelope,
      auth,
      domain: "purchase",
      service: "s",
      operation: "o",
      handler,
    });

    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: "purchase",
        service: "s",
        operation: "o",
        correlationId: "corr-1",
      }),
    );
  });
});
