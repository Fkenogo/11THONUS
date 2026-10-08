/**
 * "New customer?" assistance (`EA-BL-001-CORR-002-B`, D3 — tokenless two-device self-registration).
 *
 * Preserves the prototype's secondary walk-in affordance but replaces the conflicting action: instead
 * of Staff creating a member, the Counter shows a STATIC public sign-up address (as text and as a QR)
 * for the customer to open on their own phone. No account, credential, session, handoff token or
 * customer data is created or carried here.
 */

import { useEffect, useId, useRef, useState } from "react";
import { UserPlus } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "../../i18n";
import { publicSignUpUrl } from "./signUpUrl";
import { STAFF_SECTION_IDS, revealSection, useStaffSectionRequest } from "./staffSections";

export function NewCustomerPanel() {
  const { t } = useTranslation("business");
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const url = publicSignUpUrl();
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [revealTick, setRevealTick] = useState(0);

  // Bottom-bar "New customer": open this existing panel (if collapsed), then bring it into view.
  useStaffSectionRequest("newCustomer", () => {
    setOpen(true);
    setRevealTick((tick) => tick + 1);
  });
  useEffect(() => {
    if (revealTick > 0) revealSection(sectionRef.current, headingRef.current);
  }, [revealTick]);

  return (
    <section
      ref={sectionRef}
      id={STAFF_SECTION_IDS.newCustomer}
      className="scroll-mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-12 w-full items-center justify-between gap-2 rounded-xl px-1 text-left text-sm font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
      >
        <span className="flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-amber-600" aria-hidden="true" />
          {t("counter.newCustomer.toggle")}
        </span>
        <span aria-hidden="true" className="text-xs text-slate-500">
          {open ? "−" : "+"}
        </span>
      </button>

      <div id={panelId} hidden={!open} className="mt-3 space-y-4">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-sm font-bold text-slate-900 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
        >
          {t("counter.newCustomer.heading")}
        </h2>
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
      </div>
    </section>
  );
}
