/**
 * "Help a new customer join" (`EA-BL-001-CORR-002-B`, D3 — tokenless two-device self-registration),
 * now a Staff quick ACTION (Founder Preview Pass 3) rather than a permanent part of the Counter page.
 *
 * Unchanged Product Truth: instead of Staff creating a member, the sheet shows a STATIC public sign-up
 * address (as text and as a QR) for the customer to open on their own phone. No account, credential,
 * session, handoff token or customer data is created or carried here.
 */

import { useId } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "../../i18n";
import { publicSignUpUrl } from "./signUpUrl";
import { StaffSheet } from "./StaffSheet";

export function NewCustomerSheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation("business");
  const titleId = useId();
  const url = publicSignUpUrl();

  return (
    <StaffSheet
      title={t("counter.newCustomer.heading")}
      titleId={titleId}
      closeLabel={t("counter.quick.close")}
      onClose={onClose}
      testId="staff-new-customer-sheet"
    >
      <p className="text-sm text-slate-600">{t("counter.newCustomer.intro")}</p>

      <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="rounded-lg bg-white p-3">
          <QRCodeSVG
            value={url}
            size={176}
            role="img"
            aria-label={t("counter.newCustomer.qrLabel")}
          />
        </div>
        <div className="w-full text-center">
          <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            {t("counter.newCustomer.urlLabel")}
          </p>
          <p className="font-mono text-sm break-all text-slate-900 select-all">{url}</p>
        </div>
      </div>

      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
        <li>{t("counter.newCustomer.step1")}</li>
        <li>{t("counter.newCustomer.step2")}</li>
        <li>{t("counter.newCustomer.step3")}</li>
      </ol>

      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <span className="font-semibold">{t("counter.newCustomer.dualRole")}</span>
      </p>
    </StaffSheet>
  );
}
