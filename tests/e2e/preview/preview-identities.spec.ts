/**
 * Founder Preview (EA-002) — proves the deterministic preview identities and data work through
 * the REAL sign-in surface and the REAL production routes. No harness route, no mocked DTO.
 *
 * Requires a running, seeded preview:   pnpm preview:start     (web on http://localhost:5173)
 * Run with:                             pnpm test:e2e:preview
 *
 * These specs deliberately assert only what the product already renders today (EA-002 builds no
 * new screens): sign-in, the Business/"Personal" resolver, the Dashboard, the customer's
 * Customer Identity & Circle slice. Role authorisation is the production authorisation.
 */
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const identitiesFile = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../preview/identities.json", import.meta.url)), "utf8"),
);

const { password, identities } = identitiesFile as {
  password: string;
  identities: { key: string; email: string }[];
};

const emailOf = (key: string): string => {
  const found = identities.find((i) => i.key === key);
  if (!found) throw new Error(`Unknown preview identity ${key}`);
  return found.email;
};

async function signInAs(page: Page, key: string) {
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill(emailOf(key));
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in with email" }).click();
  // Wait for the real post-sign-in routing (customer area or the Business resolver) before the
  // caller navigates elsewhere — otherwise an in-flight `authenticate` call can be cancelled.
  await expect(page).toHaveURL(/\/(customer|business)/);
}

test.describe("Founder Preview identities", () => {
  test("Owner (Bella Salon) reaches the Business Dashboard", async ({ page }) => {
    await signInAs(page, "owner_bella");
    await page.getByRole("link", { name: /Bella Salon — Owner/ }).click();
    await expect(page).toHaveURL(/\/business\/[^/]+\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
    await page.goto(page.url().replace(/dashboard$/, "dashboard/reward-programs"));
    await expect(page.getByText("Premium Cut Circle").first()).toBeVisible();
  });

  test("Manager (Bella Salon) is offered Bella as Manager", async ({ page }) => {
    await signInAs(page, "manager_bella");
    await expect(page.getByRole("link", { name: /Bella Salon — Manager/ })).toBeVisible();
  });

  test("Staff (Diane) is offered both Businesses she staffs, only as Staff", async ({ page }) => {
    await signInAs(page, "staff_bella");
    await expect(page.getByRole("link", { name: /Bella Salon — Staff/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Sparkle Car Wash — Staff/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /— Owner/ })).toHaveCount(0);
  });

  test("Owner awaiting verification (Ubuntu Books) is routed to the establishment boundary", async ({
    page,
  }) => {
    await signInAs(page, "owner_ubuntu");
    await page.getByRole("link", { name: /Ubuntu Books — Owner/ }).click();
    await expect(page).toHaveURL(/\/business\/[^/]+$/);
    await expect(page.getByText("Submitted — pending verification")).toBeVisible();
  });

  test("Customer with a purchase waiting (Moses) sees pending units separately from verified progress", async ({
    page,
  }) => {
    await signInAs(page, "customer_moses");
    await expect(page).toHaveURL(/\/customer$/);
    await page
      .getByRole("navigation", { name: "Customer navigation" })
      .getByRole("link", { name: "Circles" })
      .click();
    const bella = page.locator("article").filter({ hasText: "Premium Cut Circle" });
    await expect(
      bella.getByRole("img", { name: "0 verified units, 1 waiting for confirmation" }),
    ).toBeVisible();
    await expect(bella.getByText("1 waiting for confirmation")).toBeVisible();
    await expect(bella.getByText("Reward unlocked")).toHaveCount(0);
    // Moses also has a separate Mutima reward earned with ten Verified Units; that reward is not
    // caused by the Pending Bella purchase and must remain truthful in the same overview.
    const mutima = page.locator("article").filter({ hasText: "Mini-Mart Regulars" });
    await expect(mutima.getByText("Reward unlocked")).toBeVisible();
    await page.getByRole("link", { name: "Activity" }).click();
    await expect(page.getByText("Purchase recorded").first()).toBeVisible();
  });

  test("Customer with a Reward available (Kevin) sees the prominent server-backed home experience", async ({
    page,
  }) => {
    await signInAs(page, "customer_kevin");
    await expect(page.getByText("Circle completed")).toBeVisible();
    await expect(page.getByText("Your 11th Haircut is on Bella Salon!")).toBeVisible();
    await expect(page.getByText("A free haircut").first()).toBeVisible();
    await page.getByRole("button", { name: "Show my code" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("img", { name: "Loyalty QR code" })).toBeVisible();
  });

  test("Customer mid-Circle (Amina) sees identity, active progress and customer navigation", async ({
    page,
  }) => {
    await signInAs(page, "customer_amina");
    await expect(page.getByRole("button", { name: "My 11thONUS code" })).toBeVisible();
    await expect(
      page.getByRole("img", { name: "5 verified units, 0 waiting for confirmation" }),
    ).toBeVisible();
    const navigation = page.getByRole("navigation", { name: "Customer navigation" });
    await expect(navigation.getByRole("link", { name: "Home" })).toBeVisible();
    await navigation.getByRole("link", { name: "Circles" }).click();
    await expect(page.getByText("Premium Cut Circle")).toBeVisible();
    await navigation.getByRole("link", { name: "Activity" }).click();
    await expect(
      page.getByRole("heading", { name: "Recognition Activity", level: 1 }),
    ).toBeVisible();
  });

  test("Customer post-redemption state (Aline) acknowledges redemption and next-cycle continuity", async ({
    page,
  }) => {
    await signInAs(page, "customer_aline");
    await expect(page.getByText("Reward redeemed").first()).toBeVisible();
    await expect(page.getByText("Enjoy your reward")).toBeVisible();
    await expect(
      page.getByText(
        /Your A free haircut was redeemed at Bella Salon\. Your next Circle is ready when you are\./,
      ),
    ).toBeVisible();
    await expect(page.getByText(/Diane Kamikazi|Confirmed by|Confirmer/i)).toHaveCount(0);
    await page
      .getByRole("navigation", { name: "Customer navigation" })
      .getByRole("link", { name: "Circles" })
      .click();
    await expect(page.getByText("Cycle 2").first()).toBeVisible();
  });

  test("Customer Home and Circle navigation retain French parity on mobile", async ({ page }) => {
    await signInAs(page, "customer_amina");
    await page.getByRole("button", { name: "Français" }).click();
    await expect(page.getByRole("button", { name: "Mon code 11thONUS" })).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Navigation client" })
        .getByRole("link", { name: "Cercles" }),
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: "Navigation client" })
      .getByRole("link", { name: "Cercles" })
      .click();
    await expect(page.getByRole("heading", { name: "Mes cercles de fidélité" })).toBeVisible();
    await expect(page.getByText(/5 sur 10|5 de 10/i)).toBeVisible();
  });

  test("Operator signs in; no Operator screens exist yet (EA-002 builds none)", async ({
    page,
  }) => {
    await signInAs(page, "operator");
    await expect(page).toHaveURL(/\/customer$/);
  });

  test("New Owner with no Business is routed to the customer area, not a fabricated Business", async ({
    page,
  }) => {
    await signInAs(page, "owner_new");
    await expect(page).toHaveURL(/\/customer$/);
    await expect(page.getByText("Start Your First Loyalty Circle")).toBeVisible();
    await expect(page.getByText("No active Loyalty Circles yet.")).toBeVisible();
  });
});
