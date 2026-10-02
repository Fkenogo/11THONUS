/**
 * The Business Dashboard shell (`ENG-P3-002-UI-IMP-B`, per `ENG-P3-002-UI-RECON-001` Part VIII).
 * The first shared layout/route structure in this codebase: a mobile hamburger-triggered
 * expandable menu and a persistent desktop sidebar around the same nested `<Outlet />` — never a
 * participant-style bottom bar on either viewport (Founder-rejected). Reused unmodified by every
 * Dashboard destination (Home, Profile, Locations, Team, Terms).
 */

import { useEffect, useId, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher, useTranslation } from "../../i18n";
import { cn } from "../../lib/utils";
import type { BusinessContext } from "../api/businessContext";

export type DashboardViewerRole = "owner" | "manager" | "staff";

export function BusinessDashboardShell({
  context,
  role,
}: {
  context: BusinessContext;
  /** The viewer's own live role, when known. Labels the shell only; never gates anything. */
  role?: DashboardViewerRole;
}) {
  const { t } = useTranslation("business");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const base = `/business/${context.businessId}/dashboard`;
  // EA-003: day-to-day operation first (programmes, customers, purchases), then the people and
  // places, then the business record. Same destinations as before; only the order changed.
  const navItems = [
    { to: base, end: true, labelKey: "dashboard.nav.home" },
    { to: `${base}/reward-programs`, end: false, labelKey: "dashboard.nav.rewardPrograms" },
    { to: `${base}/customer-rewards`, end: false, labelKey: "dashboard.nav.customerRewards" },
    { to: `${base}/purchases`, end: false, labelKey: "dashboard.nav.purchases" },
    { to: `${base}/team`, end: false, labelKey: "dashboard.nav.team" },
    { to: `${base}/locations`, end: false, labelKey: "dashboard.nav.locations" },
    { to: `${base}/profile`, end: false, labelKey: "dashboard.nav.profile" },
    { to: `${base}/terms`, end: false, labelKey: "dashboard.nav.terms" },
  ] as const;

  const roleBadge = role ? (
    <span
      data-testid="viewer-role"
      className="rounded-full border border-[var(--color-border)] px-2.5 py-0.5 text-xs font-medium"
    >
      {t(`resolve.roles.${role}`)}
    </span>
  ) : null;

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
      <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-semibold">{context.displayName}</span>
          {roleBadge}
        </div>
        <button
          ref={menuButtonRef}
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)]"
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
          // Mobile: a full-height drawer laid over the page (below the sticky header) so opening
          // it never pushes content down. Desktop: a persistent sidebar.
          "bg-[var(--color-background)] p-4 md:static md:z-auto md:block md:w-64 md:shrink-0 md:overflow-visible md:border-r md:border-[var(--color-border)] md:p-6",
          menuOpen
            ? "fixed inset-x-0 bottom-0 top-16 z-30 block overflow-y-auto border-t border-[var(--color-border)] md:border-t-0"
            : "hidden",
        )}
      >
        <div className="mb-4 hidden flex-col items-start gap-2 md:flex">
          <p className="font-semibold">{context.displayName}</p>
          {roleBadge}
        </div>
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
                    "flex min-h-12 items-center rounded-md px-3 py-2.5 text-sm leading-normal md:min-h-11",
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
