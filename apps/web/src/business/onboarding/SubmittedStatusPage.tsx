/** The minimal `pending_verification` landing (design §15/§18) — a status page, not a dashboard. */

import { useTranslation } from "../../i18n";
import type { BusinessContext } from "../api/businessContext";

export function SubmittedStatusPage({ context }: { context: BusinessContext }) {
  const { t } = useTranslation("business");
  return (
    <main className="mx-auto max-w-md p-8 text-center">
      <h1 className="mb-2 text-xl font-semibold">{t("submitted.title")}</h1>
      <p className="text-[var(--color-muted-foreground)]">{t("submitted.body")}</p>
      <p className="mt-4 text-sm">{context.displayName}</p>
    </main>
  );
}
