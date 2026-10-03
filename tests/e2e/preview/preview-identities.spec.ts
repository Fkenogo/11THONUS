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
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
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
  const authRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.port === "28101" && url.pathname.endsWith("/accounts:signInWithPassword");
  });
  await page.getByRole("button", { name: "Sign in with email" }).click();
  await authRequest;
  // Wait for the real post-sign-in routing (customer area or the Business resolver) before the
  // caller navigates elsewhere — otherwise an in-flight `authenticate` call can be cancelled.
  await expect(page).toHaveURL(/\/(customer|business)/);
}

async function captureEvidence(page: Page, testInfo: { project: { name: string } }, name: string) {
  const directory = fileURLToPath(
    new URL("../../../docs/05-implementation/evidence/EA-BL-001/", import.meta.url),
  );
  mkdirSync(directory, { recursive: true });
  await page.screenshot({
    path: join(directory, `${name}-${testInfo.project.name}.png`),
    fullPage: true,
  });
}

test.describe("Founder Preview identities", () => {
  test("Owner (Bella Salon) reaches the Business Dashboard", async ({ page }) => {
    await signInAs(page, "owner_bella");
    await page.getByRole("link", { name: /Bella Salon — Owner/ }).click();
    await expect(page).toHaveURL(/\/business\/[^/]+\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
    await captureEvidence(page, test.info(), "owner-shell");
    await page.goto(page.url().replace(/dashboard$/, "dashboard/reward-programs"));
    await expect(page.getByText("Premium Cut Circle").first()).toBeVisible();
  });

  test("Manager (Bella Salon) is offered Bella as Manager", async ({ page }) => {
    await signInAs(page, "manager_bella");
    const business = page.getByRole("link", { name: /Bella Salon — Manager/ });
    await expect(business).toBeVisible();
    await business.click();
    await expect(page).toHaveURL(/\/business\/[^/]+\/dashboard$/);
    await captureEvidence(page, test.info(), "manager-shell");
  });

  test("Staff (Diane) is offered both Businesses she staffs, only as Staff", async ({ page }) => {
    await signInAs(page, "staff_bella");
    await expect(page.getByRole("link", { name: /Bella Salon — Staff/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Sparkle Car Wash — Staff/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /— Owner/ })).toHaveCount(0);
    await page.getByRole("link", { name: /Bella Salon — Staff/ }).click();
    await expect(page).toHaveURL(/\/business\/[^/]+\/dashboard$/);
    await captureEvidence(page, test.info(), "staff-shell");
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
    await page.goto("/customer");
    await captureEvidence(page, test.info(), "customer-shell");
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

test.describe("EA-BL-001 entry journeys", () => {
  test("Grace Owner is a seeded identity and reaches authenticated Owner context from the real entry", async ({
    page,
  }) => {
    expect(emailOf("owner_bella")).toBe("grace.owner@preview.example.test");
    await signInAs(page, "owner_bella");
    await expect(page.getByRole("link", { name: /Bella Salon — Owner/ })).toBeVisible();
  });

  test("invalid credentials show a bounded error without leaving entry", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Email", { exact: true }).fill(emailOf("owner_bella"));
    await page.getByLabel("Password", { exact: true }).fill("definitely-wrong-preview-password");
    const authRequest = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return url.port === "28101" && url.pathname.endsWith("/accounts:signInWithPassword");
    });
    await page.getByRole("button", { name: "Sign in with email" }).click();
    await authRequest;
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
    await captureEvidence(page, test.info(), "entry-error");
  });

  test("Create Account validates and completes supported customer registration", async ({
    page,
  }) => {
    await page.goto("/");
    await captureEvidence(page, test.info(), "sign-in");
    await page.getByRole("button", { name: /Create account/ }).click();
    await captureEvidence(page, test.info(), "create-account");

    await page
      .getByLabel("Email", { exact: true })
      .fill(`ea-bl-${Date.now()}-${test.info().project.name}@example.test`);
    await page.getByLabel("Password", { exact: true }).fill("Create-Account-Preview-2026!");
    await page.getByLabel("Confirm password", { exact: true }).fill("does-not-match");
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText(/passwords don't match/i);
    await captureEvidence(page, test.info(), "entry-validation-error");

    await page.getByLabel("Confirm password", { exact: true }).fill("Create-Account-Preview-2026!");
    const registrationRequest = page.waitForRequest((request) => {
      const url = new URL(request.url());
      return url.port === "28101" && url.pathname.endsWith("/accounts:signUp");
    });
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await registrationRequest;
    await expect(page).toHaveURL(/\/customer$/);
    await expect(page.getByText(/Loyalty Number has been issued/i)).toBeVisible();
    await captureEvidence(page, test.info(), "registered-customer-shell");
  });

  test("mobile and desktop entry layouts stay within the viewport", async ({ page }) => {
    await page.goto("/");
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
  });

  test("sign out returns the authenticated Customer to the entry experience", async ({ page }) => {
    await signInAs(page, "customer_amina");
    const navigation = page.getByRole("navigation", { name: "Customer navigation" });
    if (test.info().project.name.includes("mobile")) {
      await page.getByRole("button", { name: "Open navigation" }).click();
    }
    await navigation.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  });
});
