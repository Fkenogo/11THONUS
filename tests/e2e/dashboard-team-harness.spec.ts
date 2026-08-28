/**
 * Real-browser regression for Package F's Team Management screen
 * (`ENG-P3-002-UI-IMP-F`) — proves behaviour jsdom-based component tests cannot: actual Tailwind
 * breakpoint layout, real viewport overflow with long identity values, and genuine EN/FR
 * switching. Runs against `/dev/dashboard-harness` (development-only, never shipped — see
 * `DashboardHarnessPage.tsx`), the same fixed local `BusinessContext` fixture the Package B/C/D
 * harness specs already use, extended with a long Display Name and a long invitation email so
 * overflow can be verified against real content, not just short fixture strings.
 */
import { expect, test } from "@playwright/test";

const TEAM_PATH = "/dev/dashboard-harness/team";

test.describe("Team Management screen — mobile (375x812)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("no horizontal overflow, with a long Display Name and a long invitation email present", async ({
    page,
  }) => {
    await page.goto(TEAM_PATH);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBe(overflow.clientWidth);

    await expect(page.getByText("Marie-Christine Ndayishimiye Nkurunziza")).toBeVisible();
    await expect(
      page.getByText("a-very-long-example-invitation-address-for-overflow-testing@example.com"),
    ).toBeVisible();
  });

  test("Invite team member button meets the 44px touch-target minimum", async ({ page }) => {
    await page.goto(TEAM_PATH);
    const box = await page.getByRole("button", { name: "Invite team member" }).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe("Team Management screen — mobile (390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("no horizontal overflow at the 390x844 breakpoint", async ({ page }) => {
    await page.goto(TEAM_PATH);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBe(overflow.clientWidth);
    await expect(page.getByRole("heading", { name: "Team", exact: true })).toBeVisible();
  });
});

test.describe("Team Management screen — tablet/intermediate (768x1024)", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("no horizontal overflow at the tablet breakpoint", async ({ page }) => {
    await page.goto(TEAM_PATH);
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBe(overflow.clientWidth);
  });
});

test.describe("Team Management screen — desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("renders inside the shared Dashboard shell, with real active-member and invitation content", async ({
    page,
  }) => {
    await page.goto(TEAM_PATH);
    await expect(
      page.getByRole("navigation", { name: "Business Dashboard navigation" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Team", exact: true })).toBeVisible();
    await expect(page.getByText("Safi")).toBeVisible();
    await expect(page.getByText("Jean-Claude")).toBeVisible();
    await expect(page.getByText("Unnamed team member")).toBeVisible();
    await expect(page.getByText("elise.m@example.com")).toBeVisible();
  });

  test("never exposes a userId, phone number, or an unsupported Resend/role-edit action", async ({
    page,
  }) => {
    await page.goto(TEAM_PATH);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).not.toMatch(/harness-mem-/i);
    expect(bodyText).not.toMatch(/\+25761234567/);
    expect(bodyText).not.toMatch(/resend/i);
    await expect(page.getByRole("button", { name: /more/i })).toHaveCount(0);
  });

  test("invite form opens, and its Role select offers exactly staff/manager", async ({ page }) => {
    await page.goto(TEAM_PATH);
    await page.getByRole("button", { name: "Invite team member" }).click();
    const roleSelect = page.getByLabel("Role");
    const optionValues = await roleSelect
      .locator("option")
      .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
    expect(optionValues).toEqual(["staff", "manager"]);
  });

  test("revoke requires confirmation before the action is final", async ({ page }) => {
    await page.goto(TEAM_PATH);
    await page
      .getByRole("listitem")
      .filter({ hasText: "elise.m@example.com" })
      .getByRole("button", { name: "Cancel invitation" })
      .click();
    await expect(page.getByRole("button", { name: "Yes, cancel invitation" })).toBeVisible();
    await expect(page.getByText("elise.m@example.com")).toHaveCount(0);
  });
});

test.describe("Team Management screen — language switching", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("EN -> FR -> EN preserves the route, Business identity, and Team data; identity values stay untranslated", async ({
    page,
  }) => {
    await page.goto(TEAM_PATH);
    await expect(page.getByRole("heading", { name: "Team", exact: true })).toBeVisible();
    await expect(page.getByText("Safi")).toBeVisible();

    await page.getByRole("button", { name: "Français" }).click();
    await expect(page.getByRole("heading", { name: "Équipe", exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard-harness\/team$/);
    await expect(page.getByText("Safi")).toBeVisible();
    await expect(page.getByText("elise.m@example.com")).toBeVisible();
    await expect(page.getByText("Propriétaire")).toBeVisible();

    await page.getByRole("button", { name: "English" }).click();
    await expect(page.getByRole("heading", { name: "Team", exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard-harness\/team$/);
    await expect(page.getByText("Owner")).toBeVisible();
  });
});
