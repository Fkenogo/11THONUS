import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CommandEnvelope } from "./commandEnvelope";

const { checkAndReserveIdempotencyKey, completeIdempotencyKey, failIdempotencyKey } = vi.hoisted(
  () => ({
    checkAndReserveIdempotencyKey: vi.fn(),
    completeIdempotencyKey: vi.fn(),
    failIdempotencyKey: vi.fn(),
  }),
);
vi.mock("../idempotency/idempotencyService", () => ({
  checkAndReserveIdempotencyKey,
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
  checkAndReserveIdempotencyKey.mockReset();
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
    expect(checkAndReserveIdempotencyKey).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it("authenticates the actor from trusted context, never from the client-supplied envelope", async () => {
    checkAndReserveIdempotencyKey.mockResolvedValue({ outcome: "acquired" });
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

  it("uses a single atomic check-and-reserve call — never a separate check followed by a separate reserve", async () => {
    checkAndReserveIdempotencyKey.mockResolvedValue({ outcome: "acquired" });
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

    expect(checkAndReserveIdempotencyKey).toHaveBeenCalledTimes(1);
    expect(checkAndReserveIdempotencyKey).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ idempotencyKey: "idem-1" }),
    );
  });

  it("returns the cached result without invoking the handler when reservation reports 'duplicate' with a stored response", async () => {
    checkAndReserveIdempotencyKey.mockResolvedValue({
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
  });

  it("never fabricates a success when reservation reports 'duplicate' but the completed record has no responseSnapshot", async () => {
    checkAndReserveIdempotencyKey.mockResolvedValue({
      outcome: "duplicate",
      record: { status: "completed" },
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
      outcome: "error",
      error: expect.objectContaining({ code: "TEMPORARY_UNAVAILABLE", retryable: true }),
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns a retryable TEMPORARY_UNAVAILABLE error, not a fabricated success, when reservation reports 'in_progress'", async () => {
    checkAndReserveIdempotencyKey.mockResolvedValue({ outcome: "in_progress" });
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
      outcome: "error",
      error: expect.objectContaining({ code: "TEMPORARY_UNAVAILABLE", retryable: true }),
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns the conflict error without invoking the handler when reservation reports 'conflict'", async () => {
    const conflictError = {
      code: "IDEMPOTENCY_CONFLICT",
      messageKey: "x",
      correlationId: "corr-1",
      retryable: false,
    };
    checkAndReserveIdempotencyKey.mockResolvedValue({ outcome: "conflict", error: conflictError });
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

  it("calls the handler and completes the key on success once reservation reports 'acquired'", async () => {
    checkAndReserveIdempotencyKey.mockResolvedValue({ outcome: "acquired" });
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

    expect(completeIdempotencyKey).toHaveBeenCalledWith(db, "idem-1", undefined, {
      purchaseId: "p-1",
    });
    expect(result).toEqual({ outcome: "success", result: { purchaseId: "p-1" }, fromCache: false });
  });

  it("translates a thrown DomainCommandError into a PlatformErrorResponse and fails the idempotency key", async () => {
    checkAndReserveIdempotencyKey.mockResolvedValue({ outcome: "acquired" });
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
    checkAndReserveIdempotencyKey.mockResolvedValue({ outcome: "acquired" });
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
    checkAndReserveIdempotencyKey.mockResolvedValue({ outcome: "acquired" });
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
