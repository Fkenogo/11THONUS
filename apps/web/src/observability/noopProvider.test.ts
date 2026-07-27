import { describe, expect, it } from "vitest";
import { createNoopProvider } from "./noopProvider";

describe("createNoopProvider", () => {
  it("reports itself as not enabled", () => {
    expect(createNoopProvider().isEnabled()).toBe(false);
  });

  it("never throws from captureException, with or without context", () => {
    const provider = createNoopProvider();
    expect(() => provider.captureException(new Error("boom"))).not.toThrow();
    expect(() => provider.captureException(new Error("boom"), { any: "value" })).not.toThrow();
    expect(() => provider.captureException("not an Error instance")).not.toThrow();
  });

  it("never throws from captureMessage", () => {
    const provider = createNoopProvider();
    expect(() => provider.captureMessage("something happened")).not.toThrow();
  });

  it("never throws from addBreadcrumb", () => {
    const provider = createNoopProvider();
    expect(() => provider.addBreadcrumb({ message: "clicked button" })).not.toThrow();
  });

  it("never throws from setContext/clearContext", () => {
    const provider = createNoopProvider();
    expect(() => provider.setContext("feature", { flag: true })).not.toThrow();
    expect(() => provider.clearContext("feature")).not.toThrow();
  });

  it("never throws from setUserContext, including clearing it", () => {
    const provider = createNoopProvider();
    expect(() => provider.setUserContext({ actorId: "abc" })).not.toThrow();
    expect(() => provider.setUserContext(undefined)).not.toThrow();
  });

  it("flush resolves without performing any network call", async () => {
    await expect(createNoopProvider().flush()).resolves.toBeUndefined();
  });

  it("exposes no Sentry-specific or provider-specific concept", () => {
    const provider = createNoopProvider();
    const forbidden = ["scope", "hub", "envelope", "dsn", "eventId", "getCurrentHub", "withScope"];
    for (const key of forbidden) {
      expect(Object.keys(provider)).not.toContain(key);
    }
    // captureException must not hand back a provider-specific event id.
    expect(provider.captureException(new Error("boom"))).toBeUndefined();
  });
});
