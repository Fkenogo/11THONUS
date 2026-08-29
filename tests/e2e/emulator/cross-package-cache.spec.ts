/**
 * ENG-P3-002-UI-IMP-H, Phase J — cross-package state consistency against a
 * live Firebase Emulator Suite: a mutation in one area must not leave stale
 * state visible elsewhere.
 *
 * Coverage note: the Display Name -> Team pairing is covered in
 * `display-name-team.spec.ts` (Phase I) and Invite/revoke -> Team list is
 * covered in `terms-and-team.spec.ts` (Phase H) — not duplicated here.
 * "Terms acceptance -> Dashboard readiness" and "Submit -> Dashboard state"
 * are NOT covered here: `TERMS_READABLE_CONTENT_AVAILABLE` is hard-pinned
 * `false` (DO-NOT-TOUCH item 4), so Terms can never actually be accepted in
 * this environment through the real UI — there is no way to reach either
 * pairing's starting state without fabricating a path that does not exist.
 */
import { expect, test } from "@playwright/test";
import { createBusinessThroughWizard, freshTestEmail, signUpNewUser } from "./helpers";

test.describe("Cross-package cache consistency (Phase J)", () => {
  test("Business Profile edit -> Dashboard Home shows the updated identity, no stale cache", async ({
    page,
  }) => {
    await signUpNewUser(page, freshTestEmail("cache-profile"));
    const businessId = await createBusinessThroughWizard(page);
    await page.goto(`/business/${businessId}/dashboard`);
    // The nav sidebar and the main-content heading both render the Business
    // identity (nav is duplicated off-canvas for the mobile hamburger menu,
    // so target the `main` landmark specifically to avoid an ambiguous or
    // hidden-duplicate match).
    const homeMain = page.getByRole("main");
    await expect(homeMain.getByText("Kigwena Kitchen", { exact: false })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto(`/business/${businessId}/dashboard/profile`);
    await page.getByRole("button", { name: "Edit" }).click();
    const renamed = `Kigwena Kitchen Renamed ${Date.now() % 100000}`;
    await page.getByLabel("Business name").fill(renamed);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("main").getByText(renamed)).toBeVisible({ timeout: 15_000 });

    // Navigate to Home (a different query key, `businessContext`) and
    // confirm it reflects the rename rather than a stale cached copy.
    await page.goto(`/business/${businessId}/dashboard`);
    await expect(homeMain.getByText(renamed, { exact: false })).toBeVisible({ timeout: 15_000 });
    await expect(homeMain.getByText("Kigwena Kitchen", { exact: true })).toHaveCount(0);
  });

  test("Main Location edit persists and is not stale after navigating away and back", async ({
    page,
  }) => {
    await signUpNewUser(page, freshTestEmail("cache-location"));
    const businessId = await createBusinessThroughWizard(page);
    await page.goto(`/business/${businessId}/dashboard/locations`);
    await page.getByRole("button", { name: "Edit" }).click();

    const newCity = `Gitega-${Date.now() % 100000}`;
    await page.getByLabel("City").fill(newCity);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText(newCity)).toBeVisible({ timeout: 15_000 });

    // Away to Home, then back to Locations — confirm the edit is still
    // there (backend-authoritative), not reverted to a stale cached value.
    await page.goto(`/business/${businessId}/dashboard`);
    await page.goto(`/business/${businessId}/dashboard/locations`);
    await expect(page.getByText(newCity)).toBeVisible({ timeout: 15_000 });
  });
});
