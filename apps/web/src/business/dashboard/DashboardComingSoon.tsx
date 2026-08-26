/**
 * Restrained not-yet-implemented treatment for Dashboard destinations named by the approved
 * design but not authorized as functional Package B content (Profile/Locations/Team/Terms —
 * Packages C/D/F). No fabricated functionality; just the section's real nav label and a link
 * back to Dashboard Home.
 */

import { Link } from "react-router-dom";
import { useTranslation } from "../../i18n";

const SECTION_TITLE_KEYS = {
  profile: "dashboard.nav.profile",
  locations: "dashboard.nav.locations",
  team: "dashboard.nav.team",
  terms: "dashboard.nav.terms",
} as const;

export function DashboardComingSoon({
  section,
  businessId,
}: {
  section: keyof typeof SECTION_TITLE_KEYS;
  businessId: string;
}) {
  const { t } = useTranslation("business");
  return (
    <section>
      <h1 className="mb-2 text-xl font-semibold">{t(SECTION_TITLE_KEYS[section])}</h1>
      <p className="mb-4 text-[var(--color-muted-foreground)]">{t("dashboard.comingSoon.body")}</p>
      <Link to={`/business/${businessId}/dashboard`} className="text-sm underline">
        {t("dashboard.comingSoon.backAction")}
      </Link>
    </section>
  );
}
