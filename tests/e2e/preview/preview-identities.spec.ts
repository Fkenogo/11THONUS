/**
 * Founder Preview (EA-002) — proves the deterministic preview identities and data work through
 * the REAL sign-in surface and the REAL production routes. No harness route, no mocked DTO.
 *
 * Requires a running, seeded preview:   pnpm preview:start     (web on http://localhost:5173)
 * Run with:                             pnpm test:e2e:preview
 *
 * These specs deliberately assert only what the product already renders today (EA-002 builds no
 * new screens): sign-in, the Business/"Personal" resolver, the Dashboard, the customer's
 * "Waiting for you" and Rewards pages. Role authorisation is the production authorisation.
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

  test("Customer with a purchase waiting (Moses) sees it under Waiting for you", async ({
    page,
  }) => {
    await signInAs(page, "customer_moses");
    await expect(page).toHaveURL(/\/customer$/);
    await page.goto("/customer/activity");
    await expect(page.getByRole("heading", { name: "Waiting for you" })).toBeVisible();
    await expect(page.getByText("Nothing is waiting for your review right now.")).toHaveCount(0);
  });

  test("Customer with a Reward available (Kevin) sees it on Rewards", async ({ page }) => {
    await signInAs(page, "customer_kevin");
    await page.goto("/customer/rewards");
    await expect(page.getByText("A free haircut")).toBeVisible();
  });

  test("Customer mid-Circle (Amina) has no Reward yet", async ({ page }) => {
    await signInAs(page, "customer_amina");
    await page.goto("/customer/rewards");
    await expect(page.getByText("A free haircut")).toHaveCount(0);
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
  });
});
