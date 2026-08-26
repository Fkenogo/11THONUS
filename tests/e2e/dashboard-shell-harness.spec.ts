/**
 * Real-browser regression for the Business Dashboard shell/navigation
 * (`ENG-P3-002-UI-IMP-B-REVIEW` Phase G/H) — proves behaviour jsdom-based component tests cannot:
 * actual Tailwind breakpoint layout, real viewport overflow, and genuine mouse/keyboard focus
 * transfer. Runs against `/dev/dashboard-harness` (development-only, never shipped — see
 * `DashboardHarnessPage.tsx`), a fixed local `BusinessContext` fixture with no Firebase Auth/
 * network dependency, so this spec has no emulator dependency either.
 */
import { expect, test } from "@playwright/test";

const HARNESS_PATH = "/dev/dashboard-harness";

test.describe("Business Dashboard shell — mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("no horizontal overflow, hamburger visible, sidebar hidden", async ({ page }) => {
    await page.goto(HARNESS_PATH);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBe(overflow.clientWidth);

    await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Business Dashboard navigation" }),
    ).toBeHidden();
  });

  test("hamburger opens the menu, moves focus into it, and Escape closes it and returns focus", async ({
    page,
  }) => {
    await page.goto(HARNESS_PATH);
    const trigger = page.getByRole("button", { name: "Open navigation" });
    await trigger.click();

    const nav = page.getByRole("navigation", { name: "Business Dashboard navigation" });
    await expect(nav).toBeVisible();
    await expect(page.getByRole("button", { name: "Close navigation" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(page.getByRole("link", { name: "Overview" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(nav).toBeHidden();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  });

  test("open nav links are touch-friendly (>=44px tall) and Business identity stays visible while open", async ({
    page,
  }) => {
    // Menu-closes-after-selecting-a-destination is proven by
    // BusinessDashboardShell.test.tsx (real click + close assertion, mounted at
    // the matching production path). This harness shares the app's one live
    // router with production routes, and the shell's links are hardcoded
    // absolute `/business/...` paths (correct for the real mount) — clicking
    // one here would leave the harness and hit the real authenticated route
    // instead of testing the harness. This test instead proves the real-browser
    // fact jsdom cannot: actual rendered touch-target size.
    await page.goto(HARNESS_PATH);
    await page.getByRole("button", { name: "Open navigation" }).click();
    const nav = page.getByRole("navigation", { name: "Business Dashboard navigation" });
    const teamLink = nav.getByRole("link", { name: "Team" });
    const box = await teamLink.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await expect(page.locator("header").getByText("Acme Salon")).toBeVisible();
  });
});

test.describe("Business Dashboard shell — desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("persistent sidebar is visible with no hamburger trigger, no horizontal overflow", async ({
    page,
  }) => {
    await page.goto(HARNESS_PATH);
    await expect(
      page.getByRole("navigation", { name: "Business Dashboard navigation" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Open navigation" })).toBeHidden();

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBe(overflow.clientWidth);
  });

  test("direct navigation (refresh-equivalent) to a nested Dashboard route resolves correctly", async ({
    page,
  }) => {
    // aria-current correctness for the active link is proven by
    // BusinessDashboardShell.test.tsx against the real production mount path
    // (`/business/:businessId/dashboard/*`) — this harness is intentionally
    // mounted at a different dev-only path (`/dev/dashboard-harness/*`), so the
    // shell's absolute `/business/...` NavLink hrefs never match this harness's
    // own location and aria-current cannot be meaningfully asserted here. This
    // test instead proves what a real browser adds: a hard navigation straight
    // to a nested URL (refresh-equivalent) actually resolves the correct screen.
    await page.goto(`${HARNESS_PATH}/profile`);
    await expect(page.getByRole("heading", { name: "Business Profile" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Business Dashboard navigation" }),
    ).toBeVisible();
  });
});

test.describe("Business Dashboard shell — tablet/intermediate", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("persistent sidebar appears at the md breakpoint with no overflow", async ({ page }) => {
    await page.goto(HARNESS_PATH);
    await expect(
      page.getByRole("navigation", { name: "Business Dashboard navigation" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Open navigation" })).toBeHidden();

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBe(overflow.clientWidth);
  });
});

test.describe("Business Dashboard shell — language switching", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("EN -> FR -> EN preserves the current nested route and Business identity", async ({
    page,
  }) => {
    await page.goto(`${HARNESS_PATH}/team`);
    await expect(page.getByRole("heading", { name: "Team" })).toBeVisible();

    await page.getByRole("button", { name: "Français" }).click();
    await expect(page.getByRole("heading", { name: "Équipe" })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard-harness\/team$/);
    await expect(page.locator("nav").getByText("Acme Salon")).toBeVisible();

    await page.getByRole("button", { name: "English" }).click();
    await expect(page.getByRole("heading", { name: "Team" })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard-harness\/team$/);
  });
});
