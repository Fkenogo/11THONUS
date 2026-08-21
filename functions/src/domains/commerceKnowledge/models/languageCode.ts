/**
 * Localization boundary (`ENG-P3-001A`, design §11).
 *
 * English is primary/required; French is supported/required-at-launch.
 * Mirrors `apps/web/src/i18n/config.ts`'s own `SUPPORTED_LANGUAGES`/
 * `DEFAULT_LANGUAGE`/fallback contract exactly, so a future frontend
 * consumer never needs a second source of truth for which languages are
 * governed. Kirundi/Swahili/Kinyarwanda are explicitly NOT added here —
 * the Commerce Knowledge Standard/Knowledge Studio's "planned" language
 * lists are a documentation-currency discrepancy relative to actual
 * implementation scope (design §6), not a decision this module makes.
 */

export const SUPPORTED_LANGUAGE_CODES = ["en", "fr"] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];

export const DEFAULT_LANGUAGE_CODE: LanguageCode = "en";

export function isSupportedLanguageCode(value: string): value is LanguageCode {
  return (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(value);
}

/**
 * Design §11: a read for a language with no `published` `KnowledgeTranslation`
 * must fall back to English — never a blank label or a raw internal key.
 * At current EN/FR-only scope, English is always the fallback for any
 * requested language (including English itself, a no-op fallback).
 */
export function resolveFallbackLanguageCode(requested: LanguageCode): LanguageCode {
  void requested;
  return DEFAULT_LANGUAGE_CODE;
}
