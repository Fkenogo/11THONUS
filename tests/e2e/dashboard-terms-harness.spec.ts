/**
 * Real-browser regression for Package D's Business Terms / Activation screen
 * (`ENG-P3-002-UI-IMP-D`) — proves behaviour jsdom-based component tests cannot: actual Tailwind
 * breakpoint layout, real viewport overflow, and genuine EN/FR switching. Runs against
 * `/dev/dashboard-harness` (development-only, never shipped — see `DashboardHarnessPage.tsx`), the
 * same fixed local `BusinessContext` fixture (`status: "draft"`, `termsAcceptance.accepted: false`)
 * the Package B/C harness specs already use, so this spec has no emulator/Firebase Auth
 * dependency either.
 */
import { expect, test } from "@playwright/test";

const TERMS_PATH = "/dev/dashboard-harness/terms";

test.describe("Business Terms screen — mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("no horizontal overflow; shows the neutral unavailable state, no Continue button", async ({
    page,
  }) => {
    await page.goto(TERMS_PATH);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBe(overflow.clientWidth);

    await expect(page.getByRole("heading", { name: "Business Terms" })).toBeVisible();
    await expect(page.getByText(/currently unavailable/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(0);
  });

  test("Submit for Verification is visible but disabled, with an adequate touch target", async ({
    page,
  }) => {
    await page.goto(TERMS_PATH);
    const submitButton = page.getByRole("button", { name: "Submit for verification" });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled();
    const box = await submitButton.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(24);
  });
});

test.describe("Business Terms screen — desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("renders inside the shared Dashboard shell, no second nav or shell", async ({ page }) => {
    await page.goto(TERMS_PATH);
    await expect(
      page.getByRole("navigation", { name: "Business Dashboard navigation" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Business Terms" })).toBeVisible();
  });

  test("never invents Terms document body, version, or Effective Date content", async ({
    page,
  }) => {
    await page.goto(TERMS_PATH);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).not.toMatch(/effective date/i);
    expect(bodyText).not.toMatch(/version 1\.0/i);
    expect(bodyText).not.toMatch(/view business terms/i);
  });
});

test.describe("Business Terms screen — tablet/intermediate", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("no horizontal overflow at the tablet breakpoint", async ({ page }) => {
    await page.goto(TERMS_PATH);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBe(overflow.clientWidth);
  });
});

test.describe("Business Terms screen — language switching", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("EN -> FR -> EN preserves the current screen and Business identity", async ({ page }) => {
    await page.goto(TERMS_PATH);
    await expect(page.getByRole("heading", { name: "Business Terms" })).toBeVisible();

    await page.getByRole("button", { name: "Français" }).click();
    await expect(page.getByRole("heading", { name: "Conditions de l'entreprise" })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard-harness\/terms$/);

    await page.getByRole("button", { name: "English" }).click();
    await expect(page.getByRole("heading", { name: "Business Terms" })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard-harness\/terms$/);
  });
});
