/**
 * Runtime language selection (I18N-001; TRD16 §16.40 "language switching").
 * A minimal, accessible en/fr switcher over the centralized i18n instance —
 * the switching mechanism itself, not a themed product control. The chosen
 * language is persisted by the LanguageDetector's localStorage cache.
 */
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, type SupportedLanguage } from "./config";

/**
 * Autonyms — each language labelled in its OWN name, so a speaker can find
 * their language regardless of the current UI language.
 */
const LANGUAGE_AUTONYM: Record<SupportedLanguage, string> = {
  en: "English",
  fr: "Français",
};

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation("common");
  const current: SupportedLanguage = (SUPPORTED_LANGUAGES as readonly string[]).includes(
    i18n.language,
  )
    ? (i18n.language as SupportedLanguage)
    : DEFAULT_LANGUAGE;

  return (
    <div role="group" aria-label={t("language.label")}>
      {SUPPORTED_LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          aria-pressed={lng === current}
          onClick={() => void i18n.changeLanguage(lng)}
        >
          {LANGUAGE_AUTONYM[lng]}
        </button>
      ))}
    </div>
  );
}
