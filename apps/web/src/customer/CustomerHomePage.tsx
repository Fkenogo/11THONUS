/**
 * `/customer` — the customer's own identity/loyalty-number/QR surface
 * (`PRODUCT-ALIGN-002`).
 *
 * Registration/authentication issues Loyalty Number and QR artefacts
 * server-side. This page states that those artefacts are not yet available
 * in the app because the customer-scoped read seam is missing; it never
 * fabricates a value or reads Firestore directly.
 *
 * If a QR is ever rendered here, it represents the customer's own loyalty
 * identity presented for staff to scan — this page never offers a
 * "scan a business" affordance (that would invert the trust model).
 */

import { useTranslation } from "../i18n";

export function CustomerHomePage() {
  const { t } = useTranslation("customer");

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <h1 className="text-xl font-semibold">{t("home.title")}</h1>

      <section
        aria-labelledby="customer-loyalty-number-heading"
        className="rounded-md border border-[var(--color-border)] p-4"
      >
        <h2 id="customer-loyalty-number-heading" className="mb-2 text-sm font-medium">
          {t("home.loyaltyNumberLabel")}
        </h2>
        <p className="text-[var(--color-muted-foreground)]">{t("home.notYetAvailable")}</p>
      </section>

      <section
        aria-labelledby="customer-qr-heading"
        className="rounded-md border border-[var(--color-border)] p-4"
      >
        <h2 id="customer-qr-heading" className="mb-2 text-sm font-medium">
          {t("home.qrLabel")}
        </h2>
        <p className="text-[var(--color-muted-foreground)]">{t("home.qrNotYetAvailable")}</p>
      </section>
    </div>
  );
}
