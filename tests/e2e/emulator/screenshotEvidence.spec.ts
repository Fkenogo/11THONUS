/**
 * ENG-P3-002-UI-IMP-H, Phase L2 — screenshot evidence. Captures the
 * required screens against the real, running app (emulator-backed, real
 * data from real callables — no mockups) at mobile (390x844) and desktop
 * (1440x900), plus a French subset. Deterministic fixtures only (see
 * `helpers.ts`); no secrets or real credentials. Screenshots are saved to
 * `docs/05-implementation/evidence/ENG-P3-002-UI-IMP-H/` and are the input
 * to the hand-authored `screenshot-index.md` alongside them (this spec
 * captures; the index records the visual-review findings from actually
 * opening each file).
 */
import { expect, test, type Page } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createBusinessThroughWizard,
  defaultEstablishmentFixture,
  finishSetupToDashboard,
  freshTestEmail,
  signUpNewUser,
} from "./helpers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCE_DIR = path.join(
  __dirname,
  "../../../docs/05-implementation/evidence/ENG-P3-002-UI-IMP-H",
);

const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };

async function shot(page: Page, filename: string) {
  await page.screenshot({ path: path.join(EVIDENCE_DIR, filename), fullPage: true });
}

test.describe("Screenshot evidence (Phase L2) — English", () => {
  test("establishment steps 1-3, mobile + desktop", async ({ page }) => {
    for (const [viewport, tag] of [
      [MOBILE, "mobile"],
      [DESKTOP, "desktop"],
    ] as const) {
      await page.setViewportSize(viewport);
      await signUpNewUser(page, freshTestEmail(`shot-est-${tag}`));
      await page.goto("/business/new");
      await shot(page, `01-establishment-step-1-${tag}-en.png`);

      await page.getByLabel("Business name").fill(defaultEstablishmentFixture.businessName);
      const categorySelect = page.getByLabel("Business category");
      await expect(categorySelect.locator("option")).not.toHaveCount(1, { timeout: 15_000 });
      await categorySelect.selectOption({ index: 1 });
      await page.getByLabel("Phone number").fill(defaultEstablishmentFixture.contactPhone);
      await page.getByRole("button", { name: "Continue" }).click();
      await shot(page, `02-establishment-step-2-${tag}-en.png`);

      await page.getByLabel("Country").fill(defaultEstablishmentFixture.countryCode);
      await page.getByLabel("City").fill(defaultEstablishmentFixture.city);
      await page.getByLabel("Location name").fill(defaultEstablishmentFixture.locationName);
      await page.getByLabel("Currency").fill(defaultEstablishmentFixture.currencyCode);
      await page.getByLabel("Timezone").fill(defaultEstablishmentFixture.timezone);
      await page.getByRole("button", { name: "Continue" }).click();
      await page.waitForURL(/\/business\/(?!new)[^/]+$/, { timeout: 20_000 });
      await expect(page.getByRole("button", { name: "Finish setup" })).toBeVisible({
        timeout: 15_000,
      });
      await shot(page, `03-establishment-step-3-review-${tag}-en.png`);
    }
  });

  test("Dashboard Home, Business Profile, Main Location, Team (active + pending + invite dialog), Business Terms, Display Name (incomplete + complete) — mobile + desktop", async ({
    page,
  }) => {
    for (const [viewport, tag] of [
      [MOBILE, "mobile"],
      [DESKTOP, "desktop"],
    ] as const) {
      await page.setViewportSize(viewport);
      await signUpNewUser(page, freshTestEmail(`shot-dash-${tag}`));
      const businessId = await createBusinessThroughWizard(page);
      await finishSetupToDashboard(page, businessId);
      await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible({
        timeout: 15_000,
      });
      await shot(page, `04-dashboard-home-${tag}-en.png`);

      await page.goto(`/business/${businessId}/dashboard/profile`);
      await expect(page.getByRole("heading", { name: "Business Profile" })).toBeVisible({
        timeout: 15_000,
      });
      // Finding (Phase L2, not fixed — see screenshot-index.md): the
      // Category label briefly renders the raw internal id ("cat_bakery")
      // for ~100ms before `useBusinessCategoriesQuery`'s cached data
      // resolves and it re-renders as "Bakery" — self-heals fast enough
      // that it's not user-visible, but wait for the resolved label so the
      // saved evidence reflects steady state, not the transient race.
      await expect(page.getByText("Bakery", { exact: true })).toBeVisible({ timeout: 5_000 });
      await shot(page, `05-business-profile-${tag}-en.png`);

      await page.goto(`/business/${businessId}/dashboard/locations`);
      await expect(page.getByRole("heading", { name: "Locations" })).toBeVisible({
        timeout: 15_000,
      });
      await shot(page, `06-main-location-${tag}-en.png`);

      await page.goto(`/business/${businessId}/dashboard/terms`);
      await expect(page.getByRole("heading", { name: "Business Terms" })).toBeVisible({
        timeout: 15_000,
      });
      await shot(page, `07-business-terms-unavailable-${tag}-en.png`);
      // "Accepted" state is documented as unreachable in
      // screenshot-index.md — TERMS_READABLE_CONTENT_AVAILABLE is
      // hard-pinned false (DEC-LEGAL-002 open), so no real UI path exists
      // to accept Terms in this environment. Not faked here.

      await page.goto(`/business/${businessId}/dashboard/team`);
      await expect(page.getByRole("heading", { name: "Team" })).toBeVisible({ timeout: 15_000 });
      await shot(page, `08-team-active-only-${tag}-en.png`);

      await page.getByRole("button", { name: "Invite team member" }).click();
      await shot(page, `09-team-invite-dialog-${tag}-en.png`);
      const inviteeEmail = freshTestEmail(`shot-invitee-${tag}`);
      await page.getByLabel("Email", { exact: true }).fill(inviteeEmail);
      await page.getByRole("button", { name: "Send invitation" }).click();
      // Wait for the real state change (form closes on success, the new
      // invitation appears in Pending) rather than `networkidle`, which
      // resolves before the mutation's onSuccess/query-invalidation cycle
      // finishes settling.
      await expect(page.getByText(inviteeEmail)).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText("No pending invitations.")).toHaveCount(0);
      await shot(page, `10-team-pending-invite-${tag}-en.png`);

      await page.goto("/profile");
      await expect(page.getByLabel("Display name")).toBeVisible({ timeout: 15_000 });
      await shot(page, `11-display-name-incomplete-${tag}-en.png`);
      await page.getByLabel("Display name").fill("Founder Test Name");
      await page.getByRole("button", { name: "Save" }).click();
      await expect(page.getByText("Founder Test Name")).toBeVisible({ timeout: 10_000 });
      await shot(page, `12-display-name-complete-${tag}-en.png`);
    }
  });
});

test.describe("Screenshot evidence (Phase L2) — French subset", () => {
  test("Dashboard Home, Business Profile, Main Location, Business Terms, Team — mobile + desktop", async ({
    page,
  }) => {
    for (const [viewport, tag] of [
      [MOBILE, "mobile"],
      [DESKTOP, "desktop"],
    ] as const) {
      await page.setViewportSize(viewport);
      // Reset persisted i18n language between loop iterations — the
      // previous iteration may have left the page in French, which would
      // otherwise break `signUpNewUser`'s English-language selectors.
      await page.goto("/");
      await page.evaluate(() => localStorage.clear());
      await signUpNewUser(page, freshTestEmail(`shot-fr-${tag}`));
      const businessId = await createBusinessThroughWizard(page);
      await finishSetupToDashboard(page, businessId);
      await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible({
        timeout: 15_000,
      });
      // On mobile, the Language switcher lives inside the hamburger-collapsed
      // nav — open it first (matches the real user path on that viewport).
      if (tag === "mobile") {
        await page.getByRole("button", { name: /menu|navigation/i }).click();
      }
      const frToggle = page.getByRole("button", { name: "Français" });
      await frToggle.waitFor({ state: "visible" });
      await frToggle.click();
      await expect(frToggle).toHaveAttribute("aria-pressed", "true");
      if (tag === "mobile") {
        await page.keyboard.press("Escape"); // close the nav before the screenshot
      }

      await shot(page, `13-dashboard-home-${tag}-fr.png`);
      await page.goto(`/business/${businessId}/dashboard/profile`);
      await expect(page.getByRole("heading", { name: "Profil de l'entreprise" })).toBeVisible({
        timeout: 15_000,
      });
      await shot(page, `14-business-profile-${tag}-fr.png`);
      await page.goto(`/business/${businessId}/dashboard/locations`);
      await expect(page.getByRole("heading", { name: "Emplacements" })).toBeVisible({
        timeout: 15_000,
      });
      await shot(page, `15-main-location-${tag}-fr.png`);
      await page.goto(`/business/${businessId}/dashboard/terms`);
      await expect(page.getByRole("heading", { name: "Conditions de l'entreprise" })).toBeVisible({
        timeout: 15_000,
      });
      await shot(page, `16-business-terms-${tag}-fr.png`);
      await page.goto(`/business/${businessId}/dashboard/team`);
      await expect(page.getByRole("heading", { name: "Équipe" })).toBeVisible({
        timeout: 15_000,
      });
      await shot(page, `17-team-${tag}-fr.png`);
    }
  });
});
