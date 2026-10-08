/**
 * Staff Profile (`EA-BL-001-CORR-002-B`, Founder Preview Pass 3): a light, read-mostly view of who is
 * signed in and where they are working, plus the secondary shell actions that used to crowd the
 * transaction screen — language, Switch Business / Personal, and sign out.
 *
 * Deliberately NOT a management surface: no Staff or permission management, no employment record, no
 * settings, no customer data. It shows only the member's own sign-in identity (from their own session),
 * the current Business and the role context. Sign out is the existing client-session clear.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, Repeat2 } from "lucide-react";
import { LanguageSwitcher, useTranslation } from "../../i18n";
import { signOutCurrentSession } from "../../authentication/signOutFlow";
import { cn } from "../../lib/utils";
import { useBusinessApiPlatform } from "../BusinessApiContext";
import type { BusinessContext } from "../api/businessContext";

const FOCUS_RING = "focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none";
const CARD = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";
const LABEL = "text-[11px] font-semibold tracking-wider text-slate-500 uppercase";

export function StaffProfilePage({ context }: { context: BusinessContext }) {
  const { t } = useTranslation("business");
  const { auth } = useBusinessApiPlatform();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutFailed, setSignOutFailed] = useState(false);
  const user = auth.currentUser;
  const identity = user?.displayName || user?.email || user?.phoneNumber || null;

  async function signOut() {
    setSigningOut(true);
    setSignOutFailed(false);
    try {
      await signOutCurrentSession(auth);
    } catch {
      setSignOutFailed(true);
      setSigningOut(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-4 pb-4">
      <header className="min-w-0">
        <h1
          tabIndex={-1}
          data-staff-view-heading
          className="font-display text-xl leading-tight font-bold text-slate-900 focus:outline-none"
        >
          {t("counter.profile.title")}
        </h1>
        <p className="text-sm text-slate-500">{t("counter.profile.subtitle")}</p>
      </header>

      <section aria-label={t("counter.profile.title")} className={cn(CARD, "space-y-3")}>
        {identity ? (
          <div>
            <p className={LABEL}>{t("counter.profile.account")}</p>
            <p className="text-sm font-semibold break-all text-slate-900">{identity}</p>
          </div>
        ) : null}
        <div>
          <p className={LABEL}>{t("counter.profile.business")}</p>
          <p className="text-sm font-semibold text-slate-900">{context.displayName}</p>
        </div>
        <div>
          <p className={LABEL}>{t("counter.profile.role")}</p>
          <p className="text-sm font-semibold text-slate-900">{t("counter.profile.roleValue")}</p>
        </div>
      </section>

      <section aria-labelledby="staff-profile-language" className={cn(CARD, "space-y-3")}>
        <h2 id="staff-profile-language" className={LABEL}>
          {t("counter.profile.language")}
        </h2>
        <div className="flex [&_button]:min-h-11 [&_button]:flex-1 [&_button]:rounded-lg [&_button]:border [&_button]:border-slate-300 [&_button]:px-3 [&_button]:text-sm [&_button]:font-semibold [&_button]:text-slate-800 [&_button]:focus-visible:ring-2 [&_button]:focus-visible:ring-amber-500 [&_button]:focus-visible:outline-none [&_button[aria-pressed=true]]:border-amber-700 [&_button[aria-pressed=true]]:bg-amber-100 [&_button[aria-pressed=true]]:text-amber-950 [&>div]:flex [&>div]:w-full [&>div]:gap-2">
          <LanguageSwitcher />
        </div>
      </section>

      <section aria-labelledby="staff-profile-switch" className={cn(CARD, "space-y-3")}>
        <h2 id="staff-profile-switch" className={LABEL}>
          {t("counter.profile.switchHeading")}
        </h2>
        <p className="text-sm text-slate-600">{t("counter.profile.switchHint")}</p>
        <Link
          to="/business"
          className={cn(
            "flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-800",
            FOCUS_RING,
          )}
        >
          <Repeat2 className="h-4 w-4" aria-hidden="true" />
          {t("counter.shell.switchContext")}
        </Link>
      </section>

      <section className={cn(CARD, "space-y-2")}>
        <button
          type="button"
          onClick={() => void signOut()}
          disabled={signingOut}
          aria-busy={signingOut}
          className={cn(
            "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-800 disabled:opacity-60",
            FOCUS_RING,
          )}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {signingOut ? t("counter.profile.signingOut") : t("counter.profile.signOut")}
        </button>
        {signOutFailed ? (
          <p role="alert" className="text-sm text-rose-800">
            {t("counter.profile.signOutError")}
          </p>
        ) : null}
      </section>
    </div>
  );
}
