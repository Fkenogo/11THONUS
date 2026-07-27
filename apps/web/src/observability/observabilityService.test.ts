import { describe, expect, it, vi } from "vitest";
import { createObservabilityService } from "./observabilityService";
import { REDACTED } from "./sanitize";

function createSpyProvider(isEnabled = true) {
  return {
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    addBreadcrumb: vi.fn(),
    setContext: vi.fn(),
    clearContext: vi.fn(),
    setUserContext: vi.fn(),
    flush: vi.fn(async () => undefined),
    isEnabled: () => isEnabled,
  };
}

const enabledConfig = { enabled: true, provider: "noop" as const, environment: "test" };
const disabledConfig = { enabled: false, provider: "noop" as const, environment: "test" };

describe("createObservabilityService", () => {
  it("makes no provider call at all when configuration is disabled", () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({ config: disabledConfig, provider });

    service.captureException(new Error("boom"));
    service.captureMessage("hello");
    service.addBreadcrumb({ message: "clicked" });
    service.setContext("feature", { flag: true });
    service.setUserContext({ actorId: "a1" });

    expect(provider.captureException).not.toHaveBeenCalled();
    expect(provider.captureMessage).not.toHaveBeenCalled();
    expect(provider.addBreadcrumb).not.toHaveBeenCalled();
    expect(provider.setContext).not.toHaveBeenCalled();
    expect(provider.setUserContext).not.toHaveBeenCalled();
  });

  it("delegates correctly to the provider when configuration is enabled", () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({ config: enabledConfig, provider });

    service.captureMessage("hello");

    expect(provider.captureMessage).toHaveBeenCalledTimes(1);
    expect(provider.captureMessage).toHaveBeenCalledWith("hello", undefined);
  });

  it("never propagates a provider failure back to the caller", () => {
    const provider = createSpyProvider();
    provider.captureException.mockImplementation(() => {
      throw new Error("provider is down");
    });
    const service = createObservabilityService({ config: enabledConfig, provider });

    expect(() => service.captureException(new Error("original"))).not.toThrow();
  });

  it("does not let an observability failure alter the calling operation's own result", () => {
    const provider = createSpyProvider();
    provider.captureException.mockImplementation(() => {
      throw new Error("provider is down");
    });
    const service = createObservabilityService({ config: enabledConfig, provider });

    function simulatedOperation(): string {
      try {
        throw new Error("business failure");
      } catch (error) {
        service.captureException(error);
        return "handled";
      }
    }

    expect(simulatedOperation()).toBe("handled");
  });

  it("preserves non-sensitive diagnostic data while capturing an exception", () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({ config: enabledConfig, provider });

    service.captureException(new Error("boom"), {
      operation: "purchase.record",
      password: "hunter2",
    });

    const [, context] = provider.captureException.mock.calls[0];
    expect(context.operation).toBe("purchase.record");
    expect(context.password).toBe(REDACTED);
  });

  it("CR1: redacts a sensitive value embedded in the raw exception message — not only the context argument", () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({ config: enabledConfig, provider });
    const secret = "e".repeat(32);

    service.captureException(new Error(`db write failed, key=${secret}`));

    const [sanitizedError] = provider.captureException.mock.calls[0];
    expect(sanitizedError.message).not.toContain(secret);
    expect(sanitizedError.message).toContain(REDACTED);
    expect(sanitizedError.kind).toBe("error");
    expect(sanitizedError.name).toBe("Error");
  });

  it("CR1: sanitizes a non-Error thrown value before it reaches the provider", () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({ config: enabledConfig, provider });

    service.captureException({ reason: "bad state", password: "hunter2" });

    const [sanitizedError] = provider.captureException.mock.calls[0];
    expect(sanitizedError.kind).toBe("thrown-value");
    expect(sanitizedError.properties.value.password).toBe(REDACTED);
    expect(sanitizedError.properties.value.reason).toBe("bad state");
  });

  it("CR1: sanitizes custom own properties on a thrown Error", () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({ config: enabledConfig, provider });
    const error = new Error("boom") as Error & { apiKey?: string };
    error.apiKey = "f".repeat(32);

    service.captureException(error);

    const [sanitizedError] = provider.captureException.mock.calls[0];
    expect(sanitizedError.properties.apiKey).toBe(REDACTED);
  });

  it("CR1: does not mutate the caller's original Error or context object", () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({ config: enabledConfig, provider });
    const error = new Error("boom");
    const originalMessage = error.message;
    const context = { password: "hunter2" };

    service.captureException(error, context);

    expect(error.message).toBe(originalMessage);
    expect(context.password).toBe("hunter2");
  });

  it("CR1: does not crash on a circular custom property or a circular cause chain", () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({ config: enabledConfig, provider });
    const error = new Error("boom") as Error & { self?: unknown };
    error.self = error;

    expect(() => service.captureException(error)).not.toThrow();
  });

  it("CR1: redacts a sensitive value embedded in a captureMessage string, not only its context", () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({ config: enabledConfig, provider });
    const secret = "g".repeat(32);

    service.captureMessage(`config loaded with key ${secret}`);

    const [sanitizedMessage] = provider.captureMessage.mock.calls[0];
    expect(sanitizedMessage).not.toContain(secret);
    expect(sanitizedMessage).toContain(REDACTED);
  });

  it("sanitizes breadcrumb data before delegating", () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({ config: enabledConfig, provider });

    service.addBreadcrumb({ message: "submitted form", data: { token: "abc", step: "checkout" } });

    const [breadcrumb] = provider.addBreadcrumb.mock.calls[0];
    expect(breadcrumb.data.token).toBe(REDACTED);
    expect(breadcrumb.data.step).toBe("checkout");
  });

  it("CR1: sanitizes the breadcrumb message and category themselves, not only breadcrumb.data", () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({ config: enabledConfig, provider });
    const secret = "h".repeat(32);

    service.addBreadcrumb({ message: `submitted token=${secret}`, category: `cat-${secret}` });

    const [breadcrumb] = provider.addBreadcrumb.mock.calls[0];
    expect(breadcrumb.message).not.toContain(secret);
    expect(breadcrumb.category).not.toContain(secret);
  });

  it("attaches the current correlation id to captured context when available", () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({
      config: enabledConfig,
      provider,
      getCorrelationId: () => "corr-123",
    });

    service.captureMessage("hello", { source: "test" });

    const [, context] = provider.captureMessage.mock.calls[0];
    expect(context.correlationId).toBe("corr-123");
    expect(context.source).toBe("test");
  });

  it("ENG-P1-003-IMP-03: never redacts a UUID-shaped correlation id, as documented — a real crypto.randomUUID() value is long enough to otherwise match sanitize()'s generic long-token pattern", () => {
    const provider = createSpyProvider();
    const realUuid = "31199c39-3024-4062-9340-c787edb83bf5"; // crypto.randomUUID()-shaped, 36 chars
    const service = createObservabilityService({
      config: enabledConfig,
      provider,
      getCorrelationId: () => realUuid,
    });

    service.captureMessage("hello");

    const [, context] = provider.captureMessage.mock.calls[0];
    expect(context.correlationId).toBe(realUuid);
  });

  it("handles a missing correlation-context provider safely", () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({ config: enabledConfig, provider });

    expect(() => service.captureMessage("hello")).not.toThrow();
    const [, context] = provider.captureMessage.mock.calls[0];
    expect(context).toBeUndefined();
  });

  it("handles a correlation-context accessor that returns undefined safely", () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({
      config: enabledConfig,
      provider,
      getCorrelationId: () => undefined,
    });

    expect(() => service.captureMessage("hello")).not.toThrow();
  });

  it("delegates setContext and clearContext", () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({ config: enabledConfig, provider });

    service.setContext("feature", { flag: true });
    service.clearContext("feature");

    expect(provider.setContext).toHaveBeenCalledWith("feature", { flag: true });
    expect(provider.clearContext).toHaveBeenCalledWith("feature");
  });

  it("delegates setUserContext, including clearing it with undefined", () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({ config: enabledConfig, provider });

    service.setUserContext({ actorId: "a1" });
    service.setUserContext(undefined);

    expect(provider.setUserContext).toHaveBeenNthCalledWith(1, { actorId: "a1" });
    expect(provider.setUserContext).toHaveBeenNthCalledWith(2, undefined);
  });

  it("CR1: passes through all three approved identifier fields when present", () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({ config: enabledConfig, provider });

    service.setUserContext({ actorId: "a1", businessId: "b1", customerId: "c1" });

    expect(provider.setUserContext).toHaveBeenCalledWith({
      actorId: "a1",
      businessId: "b1",
      customerId: "c1",
    });
  });

  it("CR1: strips any field not on the approved allow-list before it reaches the provider, even if the caller supplies one at runtime", () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({ config: enabledConfig, provider });
    // Bypass compile-time typing the way a real caller could at runtime
    // (e.g. spreading a larger object into the user-context call).
    const overBroad = { actorId: "a1", name: "Alice Example", email: "alice@example.com" } as never;

    service.setUserContext(overBroad);

    const [passed] = provider.setUserContext.mock.calls[0];
    expect(passed).toEqual({ actorId: "a1" });
    expect(passed.name).toBeUndefined();
    expect(passed.email).toBeUndefined();
  });

  it("CR1: drops a non-string value smuggled under an approved field name", () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({ config: enabledConfig, provider });
    const overBroad = { actorId: { nested: "object" } } as never;

    service.setUserContext(overBroad);

    const [passed] = provider.setUserContext.mock.calls[0];
    expect(passed.actorId).toBeUndefined();
  });

  it("isEnabled reflects both configuration and provider readiness", () => {
    expect(
      createObservabilityService({
        config: enabledConfig,
        provider: createSpyProvider(true),
      }).isEnabled(),
    ).toBe(true);
    expect(
      createObservabilityService({
        config: enabledConfig,
        provider: createSpyProvider(false),
      }).isEnabled(),
    ).toBe(false);
    expect(
      createObservabilityService({
        config: disabledConfig,
        provider: createSpyProvider(true),
      }).isEnabled(),
    ).toBe(false);
  });

  it("CR1: makes no provider call when configuration is requested enabled but the provider itself is not ready (e.g. the no-op provider) — 'requested' and 'effectively active' are not conflated", () => {
    const provider = createSpyProvider(false);
    const service = createObservabilityService({ config: enabledConfig, provider });

    service.captureException(new Error("boom"));
    service.captureMessage("hello");
    service.addBreadcrumb({ message: "clicked" });
    service.setContext("feature", { flag: true });
    service.setUserContext({ actorId: "a1" });

    expect(provider.captureException).not.toHaveBeenCalled();
    expect(provider.captureMessage).not.toHaveBeenCalled();
    expect(provider.addBreadcrumb).not.toHaveBeenCalled();
    expect(provider.setContext).not.toHaveBeenCalled();
    expect(provider.setUserContext).not.toHaveBeenCalled();
    expect(service.isEnabled()).toBe(false);
  });

  it("flush resolves even when the configuration is disabled", async () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({ config: disabledConfig, provider });
    await expect(service.flush()).resolves.toBeUndefined();
    expect(provider.flush).not.toHaveBeenCalled();
  });

  it("flush never throws even if the provider's own flush rejects", async () => {
    const provider = createSpyProvider();
    provider.flush.mockImplementation(async () => {
      throw new Error("network down");
    });
    const service = createObservabilityService({ config: enabledConfig, provider });
    await expect(service.flush()).resolves.toBeUndefined();
  });
});
