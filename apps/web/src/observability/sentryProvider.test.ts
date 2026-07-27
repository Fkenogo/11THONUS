import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SanitizedException } from "./sanitizeException";

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

async function importFreshProvider() {
  vi.resetModules();
  const mod = await import("./sentryProvider");
  return mod.createSentryProvider;
}

describe("createSentryProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes the SDK with the supplied dsn, environment and release", async () => {
    const createSentryProvider = await importFreshProvider();
    createSentryProvider({ dsn: "https://example.test/1", environment: "test", release: "1.2.3" });

    expect(sentryMock.init).toHaveBeenCalledTimes(1);
    const options = sentryMock.init.mock.calls[0][0];
    expect(options.dsn).toBe("https://example.test/1");
    expect(options.environment).toBe("test");
    expect(options.release).toBe("1.2.3");
  });

  it("disables every default automatic integration (empty integrations list)", async () => {
    const createSentryProvider = await importFreshProvider();
    createSentryProvider({ dsn: "https://example.test/1", environment: "test" });

    const options = sentryMock.init.mock.calls[0][0];
    expect(options.integrations).toEqual([]);
  });

  it("disables default PII collection explicitly", async () => {
    const createSentryProvider = await importFreshProvider();
    createSentryProvider({ dsn: "https://example.test/1", environment: "test" });

    expect(sentryMock.init.mock.calls[0][0].sendDefaultPii).toBe(false);
  });

  it("initializes the SDK only once even if the factory is called again (StrictMode-safe)", async () => {
    const createSentryProvider = await importFreshProvider();
    createSentryProvider({ dsn: "https://example.test/1", environment: "test" });
    createSentryProvider({ dsn: "https://example.test/1", environment: "test" });

    expect(sentryMock.init).toHaveBeenCalledTimes(1);
  });

  it("maps a sanitized Error-shaped exception to a reportable Error with matching name/message/stack", async () => {
    const createSentryProvider = await importFreshProvider();
    const provider = createSentryProvider({ dsn: "https://example.test/1", environment: "test" });

    const sanitized: SanitizedException = {
      kind: "error",
      name: "TypeError",
      message: "sanitized message",
      stack: "TypeError: sanitized message\n    at somewhere",
    };
    provider.captureException(sanitized, { correlationId: "corr-1" });

    expect(sentryMock.captureException).toHaveBeenCalledTimes(1);
    const [reportable, context] = sentryMock.captureException.mock.calls[0];
    expect(reportable).toBeInstanceOf(Error);
    expect(reportable.name).toBe("TypeError");
    expect(reportable.message).toBe("sanitized message");
    expect(reportable.stack).toBe(sanitized.stack);
    expect(context.extra).toEqual({ correlationId: "corr-1" });
  });

  it("maps a sanitized non-Error thrown value without throwing", async () => {
    const createSentryProvider = await importFreshProvider();
    const provider = createSentryProvider({ dsn: "https://example.test/1", environment: "test" });

    const sanitized: SanitizedException = {
      kind: "thrown-value",
      properties: { value: "[REDACTED]" },
    };
    expect(() => provider.captureException(sanitized)).not.toThrow();
    expect(sentryMock.captureException).toHaveBeenCalledTimes(1);
  });

  it("handles a non-SanitizedException-shaped input defensively without throwing", async () => {
    const createSentryProvider = await importFreshProvider();
    const provider = createSentryProvider({ dsn: "https://example.test/1", environment: "test" });

    expect(() => provider.captureException("unexpected raw string")).not.toThrow();
    expect(sentryMock.captureException).toHaveBeenCalledTimes(1);
  });

  it("never throws even if the Sentry SDK's captureException itself throws", async () => {
    const createSentryProvider = await importFreshProvider();
    const provider = createSentryProvider({ dsn: "https://example.test/1", environment: "test" });
    sentryMock.captureException.mockImplementationOnce(() => {
      throw new Error("sdk down");
    });

    expect(() => provider.captureException({ kind: "error", message: "x" })).not.toThrow();
  });

  it("maps captureMessage to Sentry.captureMessage with context as extra", async () => {
    const createSentryProvider = await importFreshProvider();
    const provider = createSentryProvider({ dsn: "https://example.test/1", environment: "test" });

    provider.captureMessage("hello", { correlationId: "corr-2" });

    expect(sentryMock.captureMessage).toHaveBeenCalledWith("hello", {
      extra: { correlationId: "corr-2" },
    });
  });

  it("maps addBreadcrumb fields through to Sentry.addBreadcrumb", async () => {
    const createSentryProvider = await importFreshProvider();
    const provider = createSentryProvider({ dsn: "https://example.test/1", environment: "test" });

    provider.addBreadcrumb({ message: "navigated", category: "navigation", data: { to: "/x" } });

    expect(sentryMock.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ message: "navigated", category: "navigation", data: { to: "/x" } }),
    );
  });

  it("maps setContext to Sentry.setContext", async () => {
    const createSentryProvider = await importFreshProvider();
    const provider = createSentryProvider({ dsn: "https://example.test/1", environment: "test" });

    provider.setContext("feature", { flag: "on" });

    expect(sentryMock.setContext).toHaveBeenCalledWith("feature", { flag: "on" });
  });

  it("maps clearContext to Sentry.setContext(key, null)", async () => {
    const createSentryProvider = await importFreshProvider();
    const provider = createSentryProvider({ dsn: "https://example.test/1", environment: "test" });

    provider.clearContext("feature");

    expect(sentryMock.setContext).toHaveBeenCalledWith("feature", null);
  });

  it("maps setUserContext to Sentry.setUser with only the approved identity fields", async () => {
    const createSentryProvider = await importFreshProvider();
    const provider = createSentryProvider({ dsn: "https://example.test/1", environment: "test" });

    provider.setUserContext({ actorId: "actor-1", businessId: "biz-1", customerId: "cust-1" });

    expect(sentryMock.setUser).toHaveBeenCalledWith({
      id: "actor-1",
      actorId: "actor-1",
      businessId: "biz-1",
      customerId: "cust-1",
    });
  });

  it("maps clearing user context (undefined) to Sentry.setUser(null)", async () => {
    const createSentryProvider = await importFreshProvider();
    const provider = createSentryProvider({ dsn: "https://example.test/1", environment: "test" });

    provider.setUserContext(undefined);

    expect(sentryMock.setUser).toHaveBeenCalledWith(null);
  });

  it("delegates flush to Sentry.flush", async () => {
    const createSentryProvider = await importFreshProvider();
    const provider = createSentryProvider({ dsn: "https://example.test/1", environment: "test" });

    await provider.flush();

    expect(sentryMock.flush).toHaveBeenCalledTimes(1);
  });

  it("flush never throws even if Sentry.flush rejects", async () => {
    const createSentryProvider = await importFreshProvider();
    const provider = createSentryProvider({ dsn: "https://example.test/1", environment: "test" });
    sentryMock.flush.mockRejectedValueOnce(new Error("flush failed"));

    await expect(provider.flush()).resolves.toBeUndefined();
  });

  it("reports itself as enabled once initialization has succeeded", async () => {
    const createSentryProvider = await importFreshProvider();
    const provider = createSentryProvider({ dsn: "https://example.test/1", environment: "test" });

    expect(provider.isEnabled()).toBe(true);
  });

  it("never throws even if Sentry.init itself throws, and reports itself as not enabled", async () => {
    sentryMock.init.mockImplementationOnce(() => {
      throw new Error("init failed");
    });
    const createSentryProvider = await importFreshProvider();

    let provider;
    expect(() => {
      provider = createSentryProvider({ dsn: "https://example.test/1", environment: "test" });
    }).not.toThrow();
    expect(provider!.isEnabled()).toBe(false);
  });
});
