import { describe, expect, it } from "vitest";
import { loadPostgresConfig } from "./postgresConfig";

describe("loadPostgresConfig", () => {
  it("throws when PLATFORM_ENV is missing", () => {
    expect(() => loadPostgresConfig({})).toThrow(/PLATFORM_ENV is required/);
  });

  it("throws when PLATFORM_ENV is an unrecognised value", () => {
    expect(() => loadPostgresConfig({ PLATFORM_ENV: "staging" })).toThrow(
      /PLATFORM_ENV must be one of/,
    );
  });

  it("throws when PLATFORM_ENV=production and PLATFORM_POSTGRES_URL is missing", () => {
    expect(() => loadPostgresConfig({ PLATFORM_ENV: "production" })).toThrow(
      /PLATFORM_POSTGRES_URL is required/,
    );
  });

  it("never silently falls back to a local/shared default in production", () => {
    let thrown = false;
    try {
      loadPostgresConfig({ PLATFORM_ENV: "production" });
    } catch {
      thrown = true;
    }
    expect(thrown).toBe(true);
  });

  it("defaults to the documented local connection string when PLATFORM_ENV=local", () => {
    const config = loadPostgresConfig({ PLATFORM_ENV: "local" });
    expect(config.connectionString).toContain("eleventhonus_platform_local");
    expect(config.environment).toBe("local");
    expect(config.ssl).toBe(false);
  });

  it("defaults to the documented test connection string when PLATFORM_ENV=test", () => {
    const config = loadPostgresConfig({ PLATFORM_ENV: "test" });
    expect(config.connectionString).toContain("eleventhonus_platform_test");
    expect(config.environment).toBe("test");
  });

  it("honours an explicit PLATFORM_POSTGRES_URL in any environment", () => {
    const config = loadPostgresConfig({
      PLATFORM_ENV: "production",
      PLATFORM_POSTGRES_URL: "postgres://user:pass@example-host:5432/db",
    });
    expect(config.connectionString).toBe("postgres://user:pass@example-host:5432/db");
  });

  it("defaults SSL to true in production and false in local/test", () => {
    expect(
      loadPostgresConfig({
        PLATFORM_ENV: "production",
        PLATFORM_POSTGRES_URL: "postgres://x/db",
      }).ssl,
    ).toBe(true);
    expect(loadPostgresConfig({ PLATFORM_ENV: "local" }).ssl).toBe(false);
  });

  it("allows an explicit SSL override", () => {
    expect(loadPostgresConfig({ PLATFORM_ENV: "local", PLATFORM_POSTGRES_SSL: "true" }).ssl).toBe(
      true,
    );
  });

  it("rejects a non-positive-integer pool size", () => {
    expect(() =>
      loadPostgresConfig({ PLATFORM_ENV: "local", PLATFORM_POSTGRES_POOL_MAX: "0" }),
    ).toThrow(/must be a positive base-10 integer/);
    expect(() =>
      loadPostgresConfig({ PLATFORM_ENV: "local", PLATFORM_POSTGRES_POOL_MAX: "abc" }),
    ).toThrow(/must be a positive base-10 integer/);
  });

  it("rejects a numeric value with a suffix instead of silently truncating it", () => {
    expect(() =>
      loadPostgresConfig({ PLATFORM_ENV: "local", PLATFORM_POSTGRES_POOL_MAX: "3workers" }),
    ).toThrow(/must be a positive base-10 integer/);
    expect(() =>
      loadPostgresConfig({
        PLATFORM_ENV: "local",
        PLATFORM_POSTGRES_CONNECTION_TIMEOUT_MS: "1000ms",
      }),
    ).toThrow(/must be a positive base-10 integer/);
  });

  it("rejects a numeric value with a prefix", () => {
    expect(() =>
      loadPostgresConfig({ PLATFORM_ENV: "local", PLATFORM_POSTGRES_POOL_MAX: "workers3" }),
    ).toThrow(/must be a positive base-10 integer/);
  });

  it("rejects decimals, negatives, zero, and leading zeros", () => {
    expect(() =>
      loadPostgresConfig({ PLATFORM_ENV: "local", PLATFORM_POSTGRES_POOL_MAX: "1.5" }),
    ).toThrow(/must be a positive base-10 integer/);
    expect(() =>
      loadPostgresConfig({ PLATFORM_ENV: "local", PLATFORM_POSTGRES_POOL_MAX: "-3" }),
    ).toThrow(/must be a positive base-10 integer/);
    expect(() =>
      loadPostgresConfig({ PLATFORM_ENV: "local", PLATFORM_POSTGRES_POOL_MAX: "0" }),
    ).toThrow(/must be a positive base-10 integer/);
    expect(() =>
      loadPostgresConfig({ PLATFORM_ENV: "local", PLATFORM_POSTGRES_POOL_MAX: "007" }),
    ).toThrow(/must be a positive base-10 integer/);
  });

  it("rejects a whitespace-only numeric value (explicit but malformed, not silently defaulted)", () => {
    expect(() =>
      loadPostgresConfig({ PLATFORM_ENV: "local", PLATFORM_POSTGRES_POOL_MAX: "   " }),
    ).toThrow(/must be a positive base-10 integer/);
  });

  it("accepts a plain positive integer after trimming surrounding whitespace", () => {
    const config = loadPostgresConfig({
      PLATFORM_ENV: "local",
      PLATFORM_POSTGRES_POOL_MAX: " 5 ",
    });
    expect(config.poolMax).toBe(5);
  });

  it("applies documented numeric defaults when not overridden", () => {
    const config = loadPostgresConfig({ PLATFORM_ENV: "local" });
    expect(config.poolMax).toBe(3);
    expect(config.idleTimeoutMillis).toBe(10_000);
    expect(config.connectionTimeoutMillis).toBe(5_000);
  });
});

describe("loadPostgresConfig — SSL validation", () => {
  it("accepts an explicit SSL true", () => {
    expect(loadPostgresConfig({ PLATFORM_ENV: "local", PLATFORM_POSTGRES_SSL: "true" }).ssl).toBe(
      true,
    );
  });

  it("accepts an explicit SSL false", () => {
    expect(
      loadPostgresConfig({
        PLATFORM_ENV: "production",
        PLATFORM_POSTGRES_URL: "postgres://x/db",
        PLATFORM_POSTGRES_SSL: "false",
      }).ssl,
    ).toBe(false);
  });

  it("uses the governed environment default when SSL is absent", () => {
    expect(loadPostgresConfig({ PLATFORM_ENV: "local" }).ssl).toBe(false);
    expect(
      loadPostgresConfig({ PLATFORM_ENV: "production", PLATFORM_POSTGRES_URL: "postgres://x/db" })
        .ssl,
    ).toBe(true);
  });

  it("treats an empty SSL value as unset (existing convention)", () => {
    expect(loadPostgresConfig({ PLATFORM_ENV: "local", PLATFORM_POSTGRES_SSL: "" }).ssl).toBe(
      false,
    );
  });

  it("rejects a typo'd SSL value instead of silently disabling SSL", () => {
    expect(() =>
      loadPostgresConfig({ PLATFORM_ENV: "local", PLATFORM_POSTGRES_SSL: "treu" }),
    ).toThrow(/PLATFORM_POSTGRES_SSL/);
  });

  it("rejects a casing variant not in the documented contract", () => {
    expect(() =>
      loadPostgresConfig({ PLATFORM_ENV: "local", PLATFORM_POSTGRES_SSL: "TRUE" }),
    ).toThrow(/PLATFORM_POSTGRES_SSL/);
  });
});
