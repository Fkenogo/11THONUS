/**
 * Public surface of the centralized localization foundation (I18N-001).
 * Import from here rather than reaching into individual modules.
 */
import "./config";

export {
  default as i18n,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  resources,
  type SupportedLanguage,
} from "./config";
export {
  applyPreferredLanguage,
  normalizePreferredLanguage,
  isSupportedLanguage,
} from "./preferredLanguage";
export { LanguageSwitcher } from "./LanguageSwitcher";
export { useTranslation, Trans } from "react-i18next";
