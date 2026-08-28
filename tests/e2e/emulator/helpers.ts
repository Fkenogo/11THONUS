/**
 * Shared helpers for Package H's emulator-backed Playwright E2E specs
 * (`ENG-P3-002-UI-IMP-H`). Every helper here drives the **real** production
 * UI/components against a live Firebase Emulator Suite (`pnpm emulators`,
 * project `demo-11thonus`) through the real callables — no mocked DTOs, no
 * fixture harness routes. The only test-only surface used is
 * `/dev/sign-in-preview` (a `import.meta.env.DEV`-gated route that already
 * exists for AUTH-PREVIEW-READINESS-001), which mounts the real, unmodified
 * `SignInPanel`/`createSignInActions` composition — it does not fake sign-in,
 * it is simply the dev-server entry point since there's no production
 * sign-in route wired in `App.tsx` yet.
 */
import { expect, type Page } from "@playwright/test";

/** A fresh, unique test identity so parallel/rerun test invocations never collide. */
export function freshTestEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
}

export const TEST_PASSWORD = "Correct-Horse-Battery-Staple-1";

/**
 * Registers a brand-new Email/Password user against the Auth emulator via
 * the real `SignInPanel` (register mode), leaving the browser `page`
 * authenticated (Firebase Auth's real client-side session) for subsequent
 * navigation to any `RequireAuthenticatedUser`-gated route in the same tab.
 */
export async function signUpNewUser(page: Page, email: string, password = TEST_PASSWORD) {
  await page.goto("/dev/sign-in-preview");
  await page.getByRole("button", { name: /create account|new here/i }).click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("status")).toContainText(/signed in/i, { timeout: 15_000 });
}

export type EstablishmentFixture = {
  businessName: string;
  contactPhone: string;
  countryCode: string;
  city: string;
  locationName: string;
  currencyCode: string;
  timezone: string;
};

export const defaultEstablishmentFixture: EstablishmentFixture = {
  businessName: "Kigwena Kitchen",
  contactPhone: "+25761234567",
  countryCode: "BI",
  city: "Bujumbura",
  locationName: "Kigwena Kitchen — Main",
  currencyCode: "BIF",
  timezone: "Africa/Bujumbura",
};

/**
 * Drives EST-01 -> EST-02 (the real `createBusiness` callable fires on
 * Continue) through the actual `/business/new` wizard. Returns the created
 * `businessId`, read back from the post-creation URL
 * (`/business/:businessId`, EST-03) — never fabricated client-side.
 */
export async function createBusinessThroughWizard(
  page: Page,
  fixture: EstablishmentFixture = defaultEstablishmentFixture,
): Promise<string> {
  await page.goto("/business/new");

  // EST-01 — Identity. The category <select> starts with only its
  // placeholder option until `getBusinessCategories` resolves (real
  // Commerce Knowledge read against the emulator) — wait for a real option
  // to exist before selecting it, rather than racing the query.
  await page.getByLabel("Business name").fill(fixture.businessName);
  const categorySelect = page.getByLabel("Business category");
  await expect(categorySelect.locator("option")).not.toHaveCount(1, { timeout: 15_000 });
  await categorySelect.selectOption({ index: 1 });
  await page.getByLabel("Phone number").fill(fixture.contactPhone);
  await page.getByRole("button", { name: "Continue" }).click();

  // EST-02 — Main Location (createBusiness fires on Continue)
  await page.getByLabel("Country").fill(fixture.countryCode);
  await page.getByLabel("City").fill(fixture.city);
  await page.getByLabel("Location name").fill(fixture.locationName);
  await page.getByLabel("Currency").fill(fixture.currencyCode);
  await page.getByLabel("Timezone").fill(fixture.timezone);
  await page.getByRole("button", { name: "Continue" }).click();

  // Excludes `/business/new` itself (the wizard's own route, which this
  // regex would otherwise also match) — wait specifically for the
  // post-creation `/business/:businessId` URL.
  await page.waitForURL(/\/business\/(?!new)[^/]+$/, { timeout: 20_000 });
  const match = page.url().match(/\/business\/(?!new)([^/]+)$/);
  if (!match) throw new Error(`Expected /business/:businessId URL, got ${page.url()}`);
  return match[1];
}

/** EST-03 -> Dashboard, via the real "Finish setup" action. */
export async function finishSetupToDashboard(page: Page, businessId: string) {
  await page.getByRole("button", { name: "Finish setup" }).click();
  await page.waitForURL(new RegExp(`/business/${businessId}/dashboard`), { timeout: 15_000 });
}
