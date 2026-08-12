import "@testing-library/jest-dom/vitest";
// Initialize the centralized i18n instance (I18N-001) once for every web test,
// so components using `useTranslation` render real translations (English by
// default) without each test bootstrapping i18n.
import "../i18n/config";
