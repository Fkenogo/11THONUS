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

  it("sanitizes breadcrumb data before delegating", () => {
    const provider = createSpyProvider();
    const service = createObservabilityService({ config: enabledConfig, provider });

    service.addBreadcrumb({ message: "submitted form", data: { token: "abc", step: "checkout" } });

    const [breadcrumb] = provider.addBreadcrumb.mock.calls[0];
    expect(breadcrumb.data.token).toBe(REDACTED);
    expect(breadcrumb.data.step).toBe("checkout");
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
