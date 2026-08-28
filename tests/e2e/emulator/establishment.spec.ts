/**
 * ENG-P3-002-UI-IMP-H, Phase C — Establishment E2E against a live Firebase
 * Emulator Suite: EST-01 -> EST-02 (real `createBusiness`) -> EST-03 (shows
 * persisted, server-authoritative truth, not fabricated wizard state) ->
 * Finish Setup -> Dashboard, plus a deep-link-after-creation check.
 */
import { expect, test } from "@playwright/test";
import {
  createBusinessThroughWizard,
  defaultEstablishmentFixture,
  freshTestEmail,
  signUpNewUser,
} from "./helpers";

test.describe("Establishment E2E", () => {
  test("EST-01 -> EST-02 -> EST-03 shows persisted truth -> Finish setup -> Dashboard", async ({
    page,
  }) => {
    await signUpNewUser(page, freshTestEmail("est-c"));
    const businessId = await createBusinessThroughWizard(page);

    // EST-03 is now `/business/:businessId` and reads back from
    // `getBusinessContext` — assert the persisted values, not the form
    // echo, and that the "Operating details" section (currencyCode/timezone
    // are in fact projected onto `BusinessContext` today) renders.
    //
    // Finding (documented behavior, not a bug fixed here — see
    // `EstablishmentLocationStep.tsx`'s own docblock): EST-02's "Location
    // name"/"Address" fields are collected in the form but **not** sent to
    // `createBusiness` at all (`CreateBusinessRequest` has no branch-name/
    // address field) — the default Branch is created with `displayName`
    // defaulted to the *Business* displayName and no address, applied only
    // if the user separately edits the Main Location afterward. So EST-03
    // correctly shows the Business name for "Main location", not the
    // fixture's distinct `locationName` — asserting the real persisted
    // value here, not the form input, which is exactly what this Phase C
    // check is for.
    await expect(page.getByText(defaultEstablishmentFixture.businessName).first()).toBeVisible();
    await expect(
      page.getByText(
        `${defaultEstablishmentFixture.businessName}, ${defaultEstablishmentFixture.city}`,
      ),
    ).toBeVisible();
    await expect(page.getByText("No address provided")).toBeVisible();
    await expect(page.getByText(defaultEstablishmentFixture.contactPhone)).toBeVisible();
    await expect(page.getByText(defaultEstablishmentFixture.timezone)).toBeVisible();

    // Finish setup -> Dashboard (pure navigation, no backend call).
    await page.getByRole("button", { name: "Finish setup" }).click();
    await page.waitForURL(new RegExp(`/business/${businessId}/dashboard`));

    // Deep link back to `/business/:businessId` after creation shows real,
    // server-read data (not a stale/fabricated client copy) — a fresh full
    // navigation, not an in-app link.
    await page.goto(`/business/${businessId}`);
    await expect(page.getByText(defaultEstablishmentFixture.businessName).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("EN/FR: the establishment flow is coherent in both languages", async ({ page }) => {
    await signUpNewUser(page, freshTestEmail("est-fr"));
    await page.goto("/business/new");
    // Switch to French before starting the flow.
    await page.getByRole("button", { name: "Français" }).click();
    await expect(page.getByRole("heading", { name: /entreprise|activité/i })).toBeVisible();

    await page.getByLabel(/nom/i).first().fill("Cuisine Kigwena");
    const categorySelect = page.locator("select#primaryCategoryId");
    await expect(categorySelect.locator("option")).not.toHaveCount(1, { timeout: 15_000 });
    await categorySelect.selectOption({ index: 1 });
    await page.locator("input#contactPhone").fill("+25761234567");
    await page.getByRole("button", { name: /continuer/i }).click();

    await page.locator("input#countryCode").fill("BI");
    await page.locator("input#city").fill("Bujumbura");
    await page.locator("input#branchDisplayName").fill("Cuisine Kigwena — Principal");
    await page.locator("input#currencyCode").fill("BIF");
    await page.locator("input#timezone").fill("Africa/Bujumbura");
    await page.getByRole("button", { name: /continuer/i }).click();

    await page.waitForURL(/\/business\/(?!new)[^/]+$/, { timeout: 20_000 });
    await expect(page.getByText("Cuisine Kigwena").first()).toBeVisible();
    // No leftover English chrome, no untranslated i18n keys visible.
    await expect(page.getByText(/^[a-zA-Z]+\.[a-zA-Z]+/)).toHaveCount(0);
  });
});
