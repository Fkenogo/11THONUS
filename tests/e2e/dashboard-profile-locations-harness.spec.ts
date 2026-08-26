/**
 * Real-browser regression for Package C's Business Profile / Locations screens
 * (`ENG-P3-002-UI-IMP-C`) — proves behaviour jsdom-based component tests cannot: actual Tailwind
 * breakpoint layout, real viewport overflow, and genuine focus/edit-mode transitions. Runs against
 * `/dev/dashboard-harness` (development-only, never shipped — see `DashboardHarnessPage.tsx`), the
 * same fixed local `BusinessContext` fixture the Package B shell harness already uses, so this
 * spec has no emulator/Firebase Auth dependency either.
 */
import { expect, test } from "@playwright/test";

const PROFILE_PATH = "/dev/dashboard-harness/profile";
const LOCATIONS_PATH = "/dev/dashboard-harness/locations";

test.describe("Business Profile screen — mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("no horizontal overflow, edit control reachable and touch-friendly", async ({ page }) => {
    await page.goto(PROFILE_PATH);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBe(overflow.clientWidth);

    await expect(page.getByRole("heading", { name: "Business Profile" })).toBeVisible();
    const editButton = page.getByRole("button", { name: "Edit" }).first();
    const box = await editButton.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test("entering and cancelling edit mode returns focus-reachable read view with no overflow", async ({
    page,
  }) => {
    await page.goto(PROFILE_PATH);
    await page.getByRole("button", { name: "Edit" }).first().click();
    await expect(page.getByRole("heading", { name: "Edit Business Profile" })).toBeVisible();

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBe(overflow.clientWidth);

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("heading", { name: "Business Profile" })).toBeVisible();
  });
});

test.describe("Business Profile screen — desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("renders Business Code with a restrained, non-commerce caption, inside the shared Dashboard shell", async ({
    page,
  }) => {
    await page.goto(PROFILE_PATH);
    await expect(
      page.getByRole("navigation", { name: "Business Dashboard navigation" }),
    ).toBeVisible();
    await expect(page.getByText("HARNESSCODE1")).toBeVisible();
    await expect(page.getByText(/internal reference for 11thONUS support/i)).toBeVisible();
    await expect(page.getByText(/integration/i)).toHaveCount(0);
  });
});

test.describe("Business Profile screen — tablet/intermediate", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("no horizontal overflow at the tablet breakpoint", async ({ page }) => {
    await page.goto(PROFILE_PATH);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBe(overflow.clientWidth);
  });
});

test.describe("Locations screen — mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("no horizontal overflow, no Add-new-location control, edit reachable", async ({ page }) => {
    await page.goto(LOCATIONS_PATH);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBe(overflow.clientWidth);

    await expect(page.getByRole("heading", { name: "Locations" })).toBeVisible();
    await expect(page.getByRole("button", { name: /add new location/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
  });
});

test.describe("Locations screen — desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("edit mode pre-fills persisted values and Save/Cancel are both reachable", async ({
    page,
  }) => {
    await page.goto(LOCATIONS_PATH);
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(page.getByRole("heading", { name: "Edit Location" })).toBeVisible();
    await expect(page.getByLabel("Location name")).toHaveValue("Main Branch");
    await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  });
});

test.describe("Business Profile / Locations — language switching", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("EN -> FR -> EN preserves the current screen and Business identity on Profile", async ({
    page,
  }) => {
    await page.goto(PROFILE_PATH);
    await expect(page.getByRole("heading", { name: "Business Profile" })).toBeVisible();

    await page.getByRole("button", { name: "Français" }).click();
    await expect(page.getByRole("heading", { name: "Profil de l'entreprise" })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard-harness\/profile$/);

    await page.getByRole("button", { name: "English" }).click();
    await expect(page.getByRole("heading", { name: "Business Profile" })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard-harness\/profile$/);
  });

  test("EN -> FR -> EN preserves the current screen on Locations", async ({ page }) => {
    await page.goto(LOCATIONS_PATH);
    await expect(page.getByRole("heading", { name: "Locations" })).toBeVisible();

    await page.getByRole("button", { name: "Français" }).click();
    await expect(page.getByRole("heading", { name: "Emplacements" })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard-harness\/locations$/);

    await page.getByRole("button", { name: "English" }).click();
    await expect(page.getByRole("heading", { name: "Locations" })).toBeVisible();
  });
});
