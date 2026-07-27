import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ObservabilityConfig } from "./config";

const sentryMock = {
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
  setContext: vi.fn(),
  setUser: vi.fn(),
  flush: vi.fn(async () => true),
};

vi.mock("@sentry/react", () => sentryMock);

async function importFreshSelectProvider() {
  vi.resetModules();
  const mod = await import("./providerSelection");
  return mod.selectProvider;
}

function baseConfig(overrides: Partial<ObservabilityConfig> = {}): ObservabilityConfig {
  return { enabled: false, provider: "noop", environment: "test", ...overrides };
}

describe("selectProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("selects the no-op provider when diagnostics are disabled, even with a sentry provider and dsn set", async () => {
    const selectProvider = await importFreshSelectProvider();
    const provider = selectProvider(
      baseConfig({ enabled: false, provider: "sentry", dsn: "https://example.test/1" }),
    );

    expect(provider.isEnabled()).toBe(false);
    expect(sentryMock.init).not.toHaveBeenCalled();
  });

  it("selects the no-op provider when enabled but the provider is explicitly noop", async () => {
    const selectProvider = await importFreshSelectProvider();
    const provider = selectProvider(baseConfig({ enabled: true, provider: "noop" }));

    expect(provider.isEnabled()).toBe(false);
    expect(sentryMock.init).not.toHaveBeenCalled();
  });

  it("selects the no-op provider when the provider is sentry but no DSN is configured", async () => {
    const selectProvider = await importFreshSelectProvider();
    const provider = selectProvider(
      baseConfig({ enabled: true, provider: "sentry", dsn: undefined }),
    );

    expect(provider.isEnabled()).toBe(false);
    expect(sentryMock.init).not.toHaveBeenCalled();
  });

  it("selects the no-op provider when the provider is sentry but the DSN is an empty string", async () => {
    const selectProvider = await importFreshSelectProvider();
    const provider = selectProvider(baseConfig({ enabled: true, provider: "sentry", dsn: "" }));

    expect(provider.isEnabled()).toBe(false);
    expect(sentryMock.init).not.toHaveBeenCalled();
  });

  it("selects the Sentry adapter only when enabled, provider is sentry, and a non-empty DSN is present", async () => {
    const selectProvider = await importFreshSelectProvider();
    const provider = selectProvider(
      baseConfig({ enabled: true, provider: "sentry", dsn: "https://example.test/1" }),
    );

    expect(sentryMock.init).toHaveBeenCalledTimes(1);
    expect(provider.isEnabled()).toBe(true);
  });

  it("falls back to the no-op provider if constructing the Sentry adapter itself throws", async () => {
    vi.doMock("./sentryProvider", () => ({
      createSentryProvider: () => {
        throw new Error("construction failed");
      },
    }));
    const selectProvider = await importFreshSelectProvider();

    const provider = selectProvider(
      baseConfig({ enabled: true, provider: "sentry", dsn: "https://example.test/1" }),
    );

    expect(provider.isEnabled()).toBe(false);
    vi.doUnmock("./sentryProvider");
  });
});
