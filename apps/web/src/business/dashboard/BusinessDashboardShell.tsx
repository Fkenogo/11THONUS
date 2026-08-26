/**
 * The Business Dashboard shell (`ENG-P3-002-UI-IMP-B`, per `ENG-P3-002-UI-RECON-001` Part VIII).
 * The first shared layout/route structure in this codebase: a mobile hamburger-triggered
 * expandable menu and a persistent desktop sidebar around the same nested `<Outlet />` — never a
 * participant-style bottom bar on either viewport (Founder-rejected). Reused unmodified by
 * Packages C/D/F for their own destinations; this package wires only Dashboard Home (DASH-01)
 * behind it, everything else behind `DashboardComingSoon`.
 */

import { useEffect, useId, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher, useTranslation } from "../../i18n";
import { cn } from "../../lib/utils";
import type { BusinessContext } from "../api/businessContext";

export function BusinessDashboardShell({ context }: { context: BusinessContext }) {
  const { t } = useTranslation("business");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const base = `/business/${context.businessId}/dashboard`;
  const navItems = [
    { to: base, end: true, labelKey: "dashboard.nav.home" },
    { to: `${base}/profile`, end: false, labelKey: "dashboard.nav.profile" },
    { to: `${base}/locations`, end: false, labelKey: "dashboard.nav.locations" },
    { to: `${base}/team`, end: false, labelKey: "dashboard.nav.team" },
    { to: `${base}/terms`, end: false, labelKey: "dashboard.nav.terms" },
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
        <span className="font-semibold">{context.displayName}</span>
        <button
          ref={menuButtonRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? t("dashboard.nav.closeMenu") : t("dashboard.nav.openMenu")}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </header>

      <nav
        id={menuId}
        aria-label={t("dashboard.nav.label")}
        className={cn(
          "border-b border-[var(--color-border)] p-4 md:block md:w-64 md:shrink-0 md:border-b-0 md:border-r md:p-6",
          menuOpen ? "block" : "hidden",
        )}
      >
        <p className="mb-4 hidden font-semibold md:block">{context.displayName}</p>
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
