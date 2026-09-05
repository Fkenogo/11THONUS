/**
 * Centralized frontend internationalization (I18N-001) — the single i18n
 * instance for `apps/web`, per TRD16 §16.40 (one centralized framework:
 * translation-key lookup, namespaces, runtime language switching, English
 * fallback, persistence, pluralization/format-ready) and TRD13 (English
 * primary/default, French supported).
 *
 * Resources are bundled (not lazily fetched) so initialization is synchronous
 * and Suspense-free — the two launch languages are small. Persistence and
 * unauthenticated language selection use the standard browser LanguageDetector
 * (localStorage cache + navigator, English fallback); authenticated-user
 * `preferredLanguage` is applied through `applyPreferredLanguage`
 * (`preferredLanguage.ts`). No geolocation-based selection.
 */
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { fr } from "./locales/fr";

export const SUPPORTED_LANGUAGES = ["en", "fr"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** English is the primary/default and the fallback for every other locale. */
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

/** localStorage key the detector caches the chosen language under. */
export const LANGUAGE_STORAGE_KEY = "i18nextLng";

export const resources = {
  en: {
    common: en.common,
    auth: en.auth,
    business: en.business,
    identity: en.identity,
    mfa: en.mfa,
  },
  fr: {
    common: fr.common,
    auth: fr.auth,
    business: fr.business,
    identity: fr.identity,
    mfa: fr.mfa,
  },
} as const;

/** Base language code (`fr-FR` → `fr`), constrained to a supported language. */
export function baseLanguage(language: string | null | undefined): SupportedLanguage {
  const base = (language ?? "").split("-")[0];
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(base)
    ? (base as SupportedLanguage)
    : DEFAULT_LANGUAGE;
}

/**
 * Keep the document root `lang` attribute in sync with the active language so
 * screen readers and language-aware browser features treat the UI correctly
 * (accessibility). Applied on initial detection and on every change.
 */
function syncDocumentLanguage(): void {
  if (typeof document !== "undefined") {
    document.documentElement.lang = baseLanguage(i18n.resolvedLanguage ?? i18n.language);
  }
}
i18n.on("languageChanged", syncDocumentLanguage);

if (!i18n.isInitialized) {
  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: [...SUPPORTED_LANGUAGES],
      // Resolve region variants (e.g. `fr-FR`) to the base language.
      nonExplicitSupportedLngs: true,
      load: "languageOnly",
      ns: ["common", "auth", "business", "identity", "mfa"],
      defaultNS: "common",
      returnNull: false,
      // React escapes interpolated values already.
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      },
      react: { useSuspense: false },
    });
}

// Apply once for the language resolved during initialization (the
// `languageChanged` handler above covers every subsequent switch).
syncDocumentLanguage();

export default i18n;
