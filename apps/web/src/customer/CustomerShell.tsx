/**
 * The Customer shell (`PRODUCT-ALIGN-002`) — persistent navigation (Home ·
 * Scan · Rewards · Activity · Account) around a nested `<Outlet />`, mirroring
 * `BusinessDashboardShell`'s mobile hamburger-menu / desktop-sidebar layout
 * and its "no bottom bar" convention (kept consistent across both shells
 * rather than re-litigated here).
 *
 * This is a product-shell integration surface only: every destination is
 * either the customer's own identity/loyalty-number/QR surface (Home, with an
 * explicit "not yet issued" state — no loyalty number or QR is actually
 * issued to any user yet, see `CustomerHomePage`) or an honest "not yet
 * available" stub (Scan, Rewards, Activity, Account). No Purchase,
 * Verification, Verified Unit, progress, or redemption logic is implemented
 * or fabricated here.
 */

import { useEffect, useId, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher, useTranslation } from "../i18n";
import { cn } from "../lib/utils";

const BASE = "/customer";

export function CustomerShell() {
  const { t } = useTranslation("customer");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const navItems = [
    { to: BASE, end: true, labelKey: "nav.home" },
    { to: `${BASE}/scan`, end: false, labelKey: "nav.scan" },
    { to: `${BASE}/rewards`, end: false, labelKey: "nav.rewards" },
    { to: `${BASE}/activity`, end: false, labelKey: "nav.activity" },
    { to: `${BASE}/account`, end: false, labelKey: "nav.account" },
  ] as const;

  useEffect(() => {
    if (menuOpen) {
      firstLinkRef.current?.focus();
    }
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <div className="min-h-screen md:flex">
      <header className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] p-4 md:hidden">
        <span className="font-semibold">{t("nav.label")}</span>
        <button
          ref={menuButtonRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </header>

      <nav
        id={menuId}
        aria-label={t("nav.label")}
        className={cn(
          "border-b border-[var(--color-border)] p-4 md:block md:w-64 md:shrink-0 md:border-b-0 md:border-r md:p-6",
          menuOpen ? "block" : "hidden",
        )}
      >
        <ul className="flex flex-col gap-1">
          {navItems.map((item, index) => (
            <li key={item.to}>
              <NavLink
                ref={index === 0 ? firstLinkRef : undefined}
                to={item.to}
                end={item.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-11 items-center rounded-md px-3 py-2.5 text-sm leading-normal",
                    isActive
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                      : "text-[var(--color-foreground)]",
                  )
                }
              >
                {t(item.labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <LanguageSwitcher />
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
