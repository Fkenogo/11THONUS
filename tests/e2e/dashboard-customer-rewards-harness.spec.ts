/**
 * Real-browser regression for the read-only Customer Rewards screen
 * (`BUSINESS-REWARD-CYCLE-VISIBILITY-001`) — proves what jsdom cannot:
 * actual mobile-first Tailwind layout, real viewport overflow with long
 * program/reward text, one-column cards on mobile widening at `md`, and the
 * absence of any action control. Runs against `/dev/dashboard-harness`
 * (development-only, never shipped), whose viewer is the Business Owner and
 * whose reward/cycle data is local fixture data shaped like the server read
 * model.
 */
import { expect, test, type Page } from "@playwright/test";

const PATH = "/dev/dashboard-harness/customer-rewards";

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBe(overflow.clientWidth);
}

test.describe("Customer Rewards screen — mobile (375x812)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("no horizontal overflow with long program and reward text; cards stack in one column", async ({
    page,
  }) => {
    await page.goto(PATH);
    await expect(page.getByRole("heading", { name: "Customer Rewards", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Rewards ready" })).toBeVisible();
    await expect(page.getByText("Customer loyalty number ABC234").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const cards = page.getByRole("region", { name: "Customer progress" }).getByRole("listitem");
    await expect(cards).toHaveCount(2);
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(first && second && second.y > first.y + first.height - 1).toBe(true);
    expect(first && Math.abs((second?.x ?? 0) - first.x) < 1).toBe(true);
  });

  test("shows progress bars and no action buttons in the page content", async ({ page }) => {
    await page.goto(PATH);
    const main = page.getByRole("main");
    await expect(main.getByRole("progressbar")).toHaveCount(2);
    await expect(main.getByRole("button")).toHaveCount(0);
  });
});

test.describe("Customer Rewards screen — tablet (768x1024)", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("no horizontal overflow; progress cards sit side by side from md up", async ({ page }) => {
    await page.goto(PATH);
    await expectNoHorizontalOverflow(page);
    const cards = page.getByRole("region", { name: "Customer progress" }).getByRole("listitem");
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(first && second && Math.abs(second.y - first.y) < 1).toBe(true);
  });
});

test.describe("Customer Rewards screen — desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("renders inside the shared Dashboard shell with its own navigation entry", async ({
    page,
  }) => {
    await page.goto(PATH);
    const nav = page.getByRole("navigation", { name: "Business Dashboard navigation" });
    const link = nav.getByRole("link", { name: "Customer Rewards" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", /\/dashboard\/customer-rewards$/);
    await expect(page.getByRole("heading", { name: "Customer progress" })).toBeVisible();
  });
});
