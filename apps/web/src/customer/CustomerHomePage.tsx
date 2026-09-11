/**
 * `/customer` — the customer's own identity/loyalty-number/QR surface
 * (`PRODUCT-ALIGN-002`).
 *
 * No loyalty number or QR is actually issued to any user today: re-verified
 * by grep before writing this component —
 * `functions/src/domains/loyaltyNumber`/`functions/src/domains/qrIdentity`
 * are scaffolded (models/repositories/services) but
 * `loyaltyNumberIssuanceService`/`qrIdentityAssociationService` are never
 * invoked from the registration/authentication path, and
 * `functions/src/index.ts` exposes no callable for either. This page
 * therefore renders an explicit "not yet issued" empty state — it never
 * fabricates a loyalty number or generates a placeholder/fake QR code. If a
 * loyalty number/QR read callable is added in a future task, this is the
 * component to wire it into (following the `identityCallableClient.ts`
 * `toCallWithActor` pattern — actor-scoped, no direct Firestore reads).
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
        <p className="text-[var(--color-muted-foreground)]">{t("home.notYetIssued")}</p>
      </section>

      <section
        aria-labelledby="customer-qr-heading"
        className="rounded-md border border-[var(--color-border)] p-4"
      >
        <h2 id="customer-qr-heading" className="mb-2 text-sm font-medium">
          {t("home.qrLabel")}
        </h2>
        <p className="text-[var(--color-muted-foreground)]">{t("home.qrNotYetIssued")}</p>
      </section>
    </div>
  );
}
