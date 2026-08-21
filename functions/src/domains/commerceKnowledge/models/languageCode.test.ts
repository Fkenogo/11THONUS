import { describe, expect, it } from "vitest";
import {
  SUPPORTED_LANGUAGE_CODES,
  DEFAULT_LANGUAGE_CODE,
  isSupportedLanguageCode,
  resolveFallbackLanguageCode,
} from "./languageCode";

describe("SUPPORTED_LANGUAGE_CODES", () => {
  it("is exactly EN (primary/required) and FR (supported) — no additional MVP languages", () => {
    expect(SUPPORTED_LANGUAGE_CODES).toEqual(["en", "fr"]);
  });

  it("DEFAULT_LANGUAGE_CODE is English", () => {
    expect(DEFAULT_LANGUAGE_CODE).toBe("en");
  });
});

describe("isSupportedLanguageCode", () => {
  it("accepts en/fr", () => {
    expect(isSupportedLanguageCode("en")).toBe(true);
    expect(isSupportedLanguageCode("fr")).toBe(true);
  });

  it("rejects an unsupported or malformed code", () => {
    expect(isSupportedLanguageCode("de")).toBe(false);
    expect(isSupportedLanguageCode("EN")).toBe(false);
    expect(isSupportedLanguageCode("")).toBe(false);
    expect(isSupportedLanguageCode("rn")).toBe(false); // Kirundi — doc-currency discrepancy, not current scope
  });
});

describe("resolveFallbackLanguageCode", () => {
  it("returns English as the fallback for any requested language", () => {
    expect(resolveFallbackLanguageCode("fr")).toBe("en");
    expect(resolveFallbackLanguageCode("en")).toBe("en");
  });
});
