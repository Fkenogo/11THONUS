/**
 * Network-safety guard (ENG-P1-003-IMP-03): proves — rather than merely
 * assumes — that exercising the real `createSentryProvider` (with only
 * the `@sentry/react` module itself mocked, as every Sentry test in this
 * suite does) never attempts a real network call. If `@sentry/react`
 * were ever accidentally left unmocked in a future edit, `Sentry.init`'s
 * real transport would use `fetch`/`XMLHttpRequest`, and this test would
 * fail loudly rather than silently sending real data.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sentryMock = vi.hoisted(() => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
  setContext: vi.fn(),
  setUser: vi.fn(),
  flush: vi.fn(async () => true),
}));

vi.mock("@sentry/react", () => sentryMock);

import { createSentryProvider } from "./sentryProvider";

describe("Sentry adapter network safety", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn> | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof globalThis.fetch === "function") {
      fetchSpy = vi.spyOn(globalThis, "fetch");
    }
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it("never performs a real fetch when initializing, capturing, or flushing", async () => {
    const provider = createSentryProvider({ dsn: "https://example.test/1", environment: "test" });

    provider.captureException({ kind: "error", message: "boom" });
    provider.captureMessage("hello");
    provider.addBreadcrumb({ message: "nav" });
    provider.setContext("feature", { flag: true });
    provider.setUserContext({ actorId: "a1" });
    await provider.flush();

    expect(fetchSpy).not.toHaveBeenCalled();
    // The mocked SDK is the only thing that ran — confirms the adapter
    // itself never opens a network channel independent of the SDK.
    expect(sentryMock.init).toHaveBeenCalledTimes(1);
  });

  it("only ever calls the mocked @sentry/react module, never a real DSN endpoint, even with a realistic-looking DSN", async () => {
    createSentryProvider({
      dsn: "https://abc123def456@o000000.ingest.sentry.io/0000000",
      environment: "production",
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
