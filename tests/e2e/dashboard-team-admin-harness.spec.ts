/**
 * `PLATFORM-BASELINE-004A` — real-browser proof for the Team Management
 * workforce administration controls that jsdom cannot give: the Owner's
 * role-change/lifecycle controls render on non-owner rows (and never on
 * the Owner row), new buttons meet the 44px touch-target minimum, the
 * suspend confirm gate appears before any callable fires, and the page
 * still has no horizontal overflow with the controls present.
 *
 * Runs against `/dev/dashboard-harness` (development-only, never shipped),
 * whose viewer is seeded as the Business Owner — the mutation callables
 * behind the controls are inert here, so no spec below asserts a mutation
 * outcome.
 */
import { expect, test } from "@playwright/test";

const TEAM_PATH = "/dev/dashboard-harness/team";

test.describe("Team administration controls — desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("owner sees suspend/remove/role controls on a non-owner row and none on the owner row", async ({
    page,
  }) => {
    await page.goto(TEAM_PATH);
    await expect(page.getByRole("heading", { name: "Team", exact: true })).toBeVisible();

    const memberRow = page.locator("li", { hasText: "Jean-Claude" });
    await expect(memberRow.getByRole("button", { name: "Suspend" })).toBeVisible();
    await expect(memberRow.getByRole("button", { name: "Remove" })).toBeVisible();
    await expect(memberRow.getByRole("button", { name: "Change role" })).toBeVisible();

    const ownerRow = page.locator("li", { hasText: "Safi" });
    await expect(ownerRow.getByRole("button")).toHaveCount(0);
  });

  test("suspend opens an inline confirm gate before any callable can fire", async ({ page }) => {
    await page.goto(TEAM_PATH);
    const memberRow = page.locator("li", { hasText: "Jean-Claude" });
    await memberRow.getByRole("button", { name: "Suspend" }).click();
    await expect(page.getByRole("button", { name: "Yes, suspend" })).toBeVisible();
  });

  test("pending invitations offer copy-link alongside revoke", async ({ page }) => {
    await page.goto(TEAM_PATH);
    const invitationRow = page.locator("li", {
      hasText: "a-very-long-example-invitation-address-for-overflow-testing@example.com",
    });
    await expect(invitationRow.getByRole("button", { name: "Copy invitation link" })).toBeVisible();
  });
});

test.describe("Team administration controls — mobile (375x812)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("no horizontal overflow with management controls rendered", async ({ page }) => {
    await page.goto(TEAM_PATH);
    await expect(page.getByRole("heading", { name: "Team", exact: true })).toBeVisible();
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBe(overflow.clientWidth);
  });

  test("management buttons meet the 44px touch-target minimum", async ({ page }) => {
    await page.goto(TEAM_PATH);
    for (const name of ["Suspend", "Remove", "Change role", "Copy invitation link"] as const) {
      const box = await page.getByRole("button", { name }).first().boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });
});
