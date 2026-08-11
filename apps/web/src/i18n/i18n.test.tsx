import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n, { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from "./config";
import { en } from "./locales/en";
import { fr } from "./locales/fr";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { applyPreferredLanguage, normalizePreferredLanguage } from "./preferredLanguage";

beforeEach(async () => {
  localStorage.clear();
  await i18n.changeLanguage("en");
});

afterEach(async () => {
  await i18n.changeLanguage("en");
  localStorage.clear();
});

describe("i18n foundation", () => {
  it("is initialized with English as the default/fallback language", () => {
    expect(i18n.isInitialized).toBe(true);
    expect(DEFAULT_LANGUAGE).toBe("en");
    expect(i18n.options.fallbackLng).toContain("en");
    expect(i18n.language).toBe("en");
  });

  it("renders English by default", () => {
    expect(i18n.t("auth:signIn.continueWithGoogle")).toBe("Continue with Google");
    expect(i18n.t("common:language.label")).toBe("Language");
  });

  it("renders French when the language is selected", async () => {
    await i18n.changeLanguage("fr");
    expect(i18n.t("auth:signIn.continueWithGoogle")).toBe("Continuer avec Google");
    expect(i18n.t("common:language.label")).toBe("Langue");
  });

  it("falls back to English when a key is missing in French", async () => {
    // A throwaway namespace present only in English proves fallbackLng resolves
    // to English — without mutating the shipped catalogs.
    i18n.addResourceBundle("en", "__probe", { only: "English only" }, true, true);
    try {
      await i18n.changeLanguage("fr");
      expect(i18n.t("__probe:only")).toBe("English only");
    } finally {
      i18n.removeResourceBundle("en", "__probe");
    }
  });

  it("persists the chosen language to localStorage (unauthenticated persistence)", async () => {
    await i18n.changeLanguage("fr");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("fr");
  });

  it("keeps the English and French catalogs structurally in parity", () => {
    const keyPaths = (obj: unknown, prefix = ""): string[] =>
      obj && typeof obj === "object"
        ? Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
            v && typeof v === "object" ? keyPaths(v, `${prefix}${k}.`) : [`${prefix}${k}`],
          )
        : [];
    expect(keyPaths(fr).sort()).toEqual(keyPaths(en).sort());
  });
});

describe("LanguageSwitcher", () => {
  it("switches the active language at runtime", async () => {
    render(<LanguageSwitcher />);
    // Autonyms: the French button is labelled "Français" in any UI language.
    await userEvent.click(screen.getByRole("button", { name: "Français" }));
    await waitFor(() => expect(i18n.language).toBe("fr"));
    // The switched language is marked pressed.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Français" })).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );
  });

  it("offers exactly the supported languages", () => {
    render(<LanguageSwitcher />);
    expect(screen.getAllByRole("button")).toHaveLength(SUPPORTED_LANGUAGES.length);
  });
});

describe("applyPreferredLanguage (authenticated-profile integration point)", () => {
  it("applies a supported preferredLanguage", async () => {
    expect(applyPreferredLanguage("fr")).toBe("fr");
    expect(i18n.language).toBe("fr");
  });

  it("normalizes region variants and casing", () => {
    expect(normalizePreferredLanguage("fr-FR")).toBe("fr");
    expect(normalizePreferredLanguage("EN")).toBe("en");
  });

  it("ignores unsupported/absent values, leaving the English default", () => {
    expect(normalizePreferredLanguage("es")).toBeNull();
    expect(normalizePreferredLanguage(null)).toBeNull();
    expect(applyPreferredLanguage("es")).toBe("en");
    expect(i18n.language).toBe("en");
  });
});
