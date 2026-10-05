import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Gift, History, Home, QrCode, UserRound, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Auth } from "firebase/auth";
import type { Functions } from "firebase/functions";
import { LanguageSwitcher, useTranslation } from "../i18n";
import { useCustomerIdentityPresentationQuery } from "./hooks/experienceQueries";
import type { CustomerIdentityPresentationWire } from "./api/customerExperienceClient";

export type CustomerShellContext = {
  identity: CustomerIdentityPresentationWire | undefined;
  openIdentity: () => void;
};

function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toLocaleUpperCase() ?? "")
      .join("") || "11"
  );
}

export function CustomerShell({ auth, functions }: { auth: Auth; functions: Functions }) {
  const { t } = useTranslation("customer");
  const { pathname } = useLocation();
  const identityQuery = useCustomerIdentityPresentationQuery({ auth, functions });
  const identity = identityQuery.data;
  const [showQr, setShowQr] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showQr) closeButtonRef.current?.focus();
  }, [showQr]);

  useEffect(() => {
    if (!showQr) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowQr(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showQr]);

  const navItems = [
    { to: "/customer", end: true, label: t("nav.home"), icon: Home },
    { to: "/customer/circles", end: false, label: t("nav.circles"), icon: Gift },
    { to: "/customer/activity", end: false, label: t("nav.activity"), icon: History },
    { to: "/customer/profile", end: false, label: t("nav.profile"), icon: UserRound },
  ];
  const displayName = identity?.displayName || t("experience.memberFallback");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-md justify-end px-4 pt-2 sm:px-0">
        <LanguageSwitcher />
      </div>
      <header className="mx-auto flex max-w-md items-center justify-between gap-2 px-4 py-2 sm:px-0">
        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white shadow-sm">
            {initialsOf(displayName)}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-400">{t("experience.member")}</div>
            <div className="truncate text-sm font-bold leading-tight text-slate-900">
              {displayName}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowQr(true)}
          disabled={!identity?.qrReference || !identity?.loyaltyNumber}
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-slate-900 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <QrCode aria-hidden="true" className="h-4 w-4 text-amber-400" />
          <span className="max-[410px]:hidden">{t("experience.codeCta")}</span>
          <span className="min-[411px]:hidden">11thONUS</span>
        </button>
      </header>

      {identityQuery.isError ? (
        <div className="mx-auto max-w-md px-4 pb-2 sm:px-0">
          <div
            className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs text-rose-800"
            role="alert"
          >
            <span>{t("experience.identityError")}</span>
            <button
              type="button"
              onClick={() => void identityQuery.refetch()}
              className="ml-2 min-h-11 font-semibold underline"
            >
              {t("experience.retry")}
            </button>
          </div>
        </div>
      ) : identity?.status === "pending" ? (
        <div className="mx-auto max-w-md px-4 pb-2 sm:px-0">
          <p
            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950"
            role="status"
          >
            {t("experience.identityPending")}
          </p>
        </div>
      ) : null}

      <main className="mx-auto max-w-md px-4 pb-24 pt-2 sm:px-0" key={pathname}>
        <Outlet
          context={{ identity, openIdentity: () => setShowQr(true) } satisfies CustomerShellContext}
        />
      </main>

      <nav
        aria-label={t("nav.label")}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-md"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4 items-center gap-1">
          {navItems.map(({ to, end, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                aria-label={label}
                className={({ isActive }) =>
                  `relative flex min-h-12 flex-col items-center justify-center rounded-xl px-1 py-1 transition active:scale-95 ${isActive ? "font-bold text-amber-700" : "font-medium text-slate-500 hover:text-slate-900"}`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive ? (
                      <span
                        aria-hidden="true"
                        className="absolute top-1 h-0.5 w-6 rounded-full bg-amber-600"
                      />
                    ) : null}
                    <Icon
                      aria-hidden="true"
                      className={`mt-1 h-5 w-5 ${isActive ? "stroke-[2.25]" : "stroke-[1.75]"}`}
                    />
                    <span className="mt-1 max-w-full truncate text-[10px] leading-none tracking-tight">
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {showQr && identity?.qrReference && identity.loyaltyNumber ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowQr(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-identity-dialog-title"
            className="w-full max-w-xs space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl"
          >
            <div className="flex justify-end">
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setShowQr(false)}
                aria-label={t("experience.close")}
                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                {t("experience.identityTitle")}
              </span>
              <h2
                id="customer-identity-dialog-title"
                className="font-display text-lg font-bold text-slate-900"
              >
                {displayName}
              </h2>
              <p className="font-mono text-xs font-semibold text-slate-500">
                {identity.loyaltyNumber}
              </p>
            </div>
            <div className="inline-block rounded-2xl border-2 border-slate-900 bg-white p-3 shadow-inner">
              <QRCodeSVG
                value={identity.qrReference}
                size={192}
                level="M"
                includeMargin
                aria-label={t("home.qrLabel")}
              />
            </div>
            <p className="text-xs leading-relaxed text-slate-500">{t("experience.identityHelp")}</p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              {t("experience.identityPrivacy")}
            </p>
          </section>
        </div>
      ) : null}
    </div>
  );
}
