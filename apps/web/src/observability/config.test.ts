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
    const config = loadObservabilityConfig({
      VITE_OBSERVABILITY_ENABLED: "true",
      VITE_OBSERVABILITY_PROVIDER: "sentry",
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

  it("never includes a DSN or secret-shaped field on the returned config", () => {
    const config = loadObservabilityConfig({});
    expect(config).not.toHaveProperty("dsn");
    expect(config).not.toHaveProperty("secret");
    expect(config).not.toHaveProperty("apiKey");
  });
});
