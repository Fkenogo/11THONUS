/**
 * `/business/:businessId/dashboard` — the minimum architecture-consistent Business Dashboard
 * destination boundary `ENG-P3-002-UI-IMP-A` (Package A) is authorized to create
 * (`ENG-P3-002-UI-RECON-001` Package A scope: "create only the minimum architecture-consistent
 * destination/placeholder required... Do NOT implement Package B's Dashboard shell in Package
 * A"). This is deliberately not the real Dashboard shell — no navigation, no management-area
 * entry points, no Terms/Team/activation content. Package B builds the real shell at this same
 * route.
 */

import { LanguageSwitcher, useTranslation } from "../../i18n";
import type { BusinessContext } from "../api/businessContext";

export function DashboardPlaceholder({ context }: { context: BusinessContext }) {
  const { t } = useTranslation("business");
  return (
    <main className="mx-auto max-w-lg p-6 text-center">
      <LanguageSwitcher />
      <h1 className="mb-2 text-xl font-semibold">{t("dashboardPlaceholder.title")}</h1>
      <p className="text-[var(--color-muted-foreground)]">{context.displayName}</p>
    </main>
  );
}
