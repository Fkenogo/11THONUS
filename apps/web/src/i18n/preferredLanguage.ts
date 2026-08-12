/**
 * Integration point for an authenticated customer's governed profile
 * `preferredLanguage` (TRD13 §13; identity/profile `preferredLanguage`).
 *
 * The web app has no authenticated-profile wiring yet, so this is the single
 * seam a future authenticated surface calls to honour the customer's stored
 * language. It applies the preference only when it maps to a supported
 * language; unsupported/absent values are ignored so the detector + English
 * fallback stand. It never infers language from geolocation.
 */
import i18n, { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, type SupportedLanguage } from "./config";

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return typeof value === "string" && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Normalize an arbitrary stored preference (`"fr"`, `"fr-FR"`, `"FR"`) to a
 * supported language code, or `null` when it is not supported.
 */
export function normalizePreferredLanguage(
  preferredLanguage: string | null | undefined,
): SupportedLanguage | null {
  if (typeof preferredLanguage !== "string") return null;
  const base = preferredLanguage.trim().slice(0, 2).toLowerCase();
  return isSupportedLanguage(base) ? base : null;
}

/**
 * Apply the customer's stored `preferredLanguage` when supported. Returns the
 * language actually in effect afterwards (always a supported language).
 */
export function applyPreferredLanguage(
  preferredLanguage: string | null | undefined,
): SupportedLanguage {
  const normalized = normalizePreferredLanguage(preferredLanguage);
  if (normalized && i18n.language !== normalized) {
    void i18n.changeLanguage(normalized);
  }
  return isSupportedLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE;
}
