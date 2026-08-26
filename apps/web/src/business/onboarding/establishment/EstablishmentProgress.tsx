/**
 * EstablishmentProgress — lightweight "Step X of 3" visual indicator for the establishment
 * flow (EST-01/EST-02/EST-03), `ENG-P3-002-UI-IMP-A-CORR-001` Finding 3 (`F1-1` in the prior
 * independent review report). Presentation only: no persisted step model, no URL-derived
 * lifecycle semantics beyond the routing that already exists, no tab navigation, and it does
 * not resurrect the retired `OnboardingWizard`. `current`/`total` are plain props the caller
 * already knows locally — `NewBusinessPage`'s own `step` state distinguishes EST-01 from
 * EST-02, and `EstablishmentReviewPage` is always step 3 of 3 by construction (a persisted
 * `draft` Business is always establishment-complete, per `BusinessWizardPage`'s own header
 * comment).
 */

import { useTranslation } from "../../../i18n";

export function EstablishmentProgress({ current, total }: { current: number; total: number }) {
  const { t } = useTranslation("business");
  return (
    <p role="status" className="mb-4 text-sm text-[var(--color-muted-foreground)]">
      {t("progress.step", { current, total })}
    </p>
  );
}
