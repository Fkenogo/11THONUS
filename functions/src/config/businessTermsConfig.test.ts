import { afterEach, describe, expect, it } from "vitest";
import {
  BUSINESS_TERMS_CONFIG_ENV_VAR,
  getCurrentlyRequiredBusinessTermsVersion,
} from "./businessTermsConfig";

describe("businessTermsConfig", () => {
  const original = process.env[BUSINESS_TERMS_CONFIG_ENV_VAR];

  afterEach(() => {
    if (original === undefined) {
      delete process.env[BUSINESS_TERMS_CONFIG_ENV_VAR];
    } else {
      process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = original;
    }
  });

  it("returns null (fails closed) when unset", () => {
    delete process.env[BUSINESS_TERMS_CONFIG_ENV_VAR];
    expect(getCurrentlyRequiredBusinessTermsVersion()).toBeNull();
  });

  it("returns null (fails closed) when set to an empty/whitespace-only string", () => {
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = "   ";
    expect(getCurrentlyRequiredBusinessTermsVersion()).toBeNull();
  });

  it("returns the trimmed configured value when set", () => {
    process.env[BUSINESS_TERMS_CONFIG_ENV_VAR] = "  TEST_ONLY_FIXTURE_v0  ";
    expect(getCurrentlyRequiredBusinessTermsVersion()).toBe("TEST_ONLY_FIXTURE_v0");
  });

  it("never returns a value that looks like a real, legally-approved production Terms version by default (no hard-coded fallback)", () => {
    delete process.env[BUSINESS_TERMS_CONFIG_ENV_VAR];
    const value = getCurrentlyRequiredBusinessTermsVersion();
    expect(value).not.toBe("v1");
    expect(value).not.toBe("1.0");
    expect(value).toBeNull();
  });
});
