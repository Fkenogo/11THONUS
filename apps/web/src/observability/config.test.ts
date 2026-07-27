import { describe, expect, it } from "vitest";
import { loadObservabilityConfig } from "./config";

describe("loadObservabilityConfig", () => {
  it("defaults to disabled with the no-op provider when nothing is set", () => {
    const config = loadObservabilityConfig({});
    expect(config.enabled).toBe(false);
    expect(config.provider).toBe("noop");
  });

  it("stays disabled even if VITE_OBSERVABILITY_ENABLED is true but no known provider is set", () => {
    const config = loadObservabilityConfig({ VITE_OBSERVABILITY_ENABLED: "true" });
    expect(config.provider).toBe("noop");
    expect(config.enabled).toBe(true);
  });

  it("respects an explicit false", () => {
    const config = loadObservabilityConfig({ VITE_OBSERVABILITY_ENABLED: "false" });
    expect(config.enabled).toBe(false);
  });

  it("throws a clear error for an invalid boolean value, matching the env.ts precedent", () => {
    expect(() => loadObservabilityConfig({ VITE_OBSERVABILITY_ENABLED: "yes" })).toThrowError(
      /VITE_OBSERVABILITY_ENABLED/,
    );
  });

  it("fails safely (forces disabled, forces the noop provider) for an unsupported provider identifier", () => {
    // ENG-P1-003-IMP-03: "sentry" moved from this test's example unsupported
    // value to a genuinely supported one (see the tests below) — "bugsnag"
    // now plays the role of a still-unsupported identifier.
    const config = loadObservabilityConfig({
      VITE_OBSERVABILITY_ENABLED: "true",
      VITE_OBSERVABILITY_PROVIDER: "bugsnag",
    });
    expect(config.provider).toBe("noop");
    expect(config.enabled).toBe(false);
  });

  it("accepts the explicit noop provider identifier", () => {
    const config = loadObservabilityConfig({
      VITE_OBSERVABILITY_ENABLED: "true",
      VITE_OBSERVABILITY_PROVIDER: "noop",
    });
    expect(config.provider).toBe("noop");
    expect(config.enabled).toBe(true);
  });

  it("ENG-P1-003-IMP-03: accepts the explicit sentry provider identifier", () => {
    const config = loadObservabilityConfig({
      VITE_OBSERVABILITY_ENABLED: "true",
      VITE_OBSERVABILITY_PROVIDER: "sentry",
      VITE_OBSERVABILITY_DSN: "https://example.test/1",
    });
    expect(config.provider).toBe("sentry");
    expect(config.enabled).toBe(true);
  });

  it("ENG-P1-003-IMP-03: reads an optional DSN from VITE_OBSERVABILITY_DSN", () => {
    const config = loadObservabilityConfig({ VITE_OBSERVABILITY_DSN: "https://example.test/1" });
    expect(config.dsn).toBe("https://example.test/1");
  });

  it("ENG-P1-003-IMP-03: leaves dsn undefined when not set — no invented value", () => {
    const config = loadObservabilityConfig({});
    expect(config.dsn).toBeUndefined();
  });

  it("derives environment from the supplied Vite mode", () => {
    const config = loadObservabilityConfig({}, { MODE: "staging" });
    expect(config.environment).toBe("staging");
  });

  it("defaults environment to development when no mode is supplied", () => {
    const config = loadObservabilityConfig({});
    expect(config.environment).toBe("development");
  });

  it("passes through an optional release identifier when present", () => {
    const config = loadObservabilityConfig({ VITE_OBSERVABILITY_RELEASE: "2026.07.26" });
    expect(config.release).toBe("2026.07.26");
  });

  it("leaves release undefined when not set — no invented value", () => {
    const config = loadObservabilityConfig({});
    expect(config.release).toBeUndefined();
  });

  it("never includes a secret-shaped field on the returned config (a DSN is a public identifier, not a secret — ENG-P1-003-IMP-03 adds an explicit, optional dsn field, never a secret/apiKey one)", () => {
    const config = loadObservabilityConfig({});
    expect(config).not.toHaveProperty("secret");
    expect(config).not.toHaveProperty("apiKey");
    expect(config).not.toHaveProperty("authToken");
  });
});
