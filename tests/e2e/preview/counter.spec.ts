/**
 * Founder Preview — Staff Counter (`EA-BL-001-CORR-002-B`) end-to-end on the REAL stack: real sign-in,
 * real routes, real callables, real PostgreSQL. No harness route, no mocked response.
 *
 * Requires a running, seeded preview:   pnpm preview:start
 * Run with:                             pnpm test:e2e:preview      (desktop + phone project)
 *
 * MUTATES DATA (it records Purchases as Staff). After a run use `pnpm preview:reset` to return to the
 * pristine deterministic state (`pnpm preview:verify` will otherwise report the new Purchases).
 *
 * The "response lost after commit" journey is genuine: the request is forwarded to the real server
 * (which commits the Purchase) and the response is then dropped, so the browser sees a network
 * failure. The retry must then recover the original — one Purchase, same key, same purchaseDate.
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

const seedState = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../../.preview/state.json", import.meta.url)), "utf8"),
) as { identities: Record<string, { loyaltyNumber?: string }> };
const loyaltyNumberOf = (customer: string): string => {
  const ln = seedState.identities[`customer_${customer}`]?.loyaltyNumber;
  if (!ln) throw new Error(`No seeded Loyalty Number for ${customer}`);
  return ln;
};

async function signInAs(page: Page, key: string) {
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill(emailOf(key));
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in with email" }).click();
  await expect(page).toHaveURL(/\/(customer|business)/);
}

async function openCounterAsDiane(page: Page) {
  await signInAs(page, "staff_bella");
  await page.getByRole("link", { name: /Bella Salon — Staff/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/counter$/);
  await expect(page.getByRole("heading", { name: "Counter", level: 1 })).toBeVisible();
}

async function chooseExpress(page: Page, item: "Blow-dry" | "Hair wash") {
  await page.getByRole("radio", { name: "Express Styling Circle" }).check();
  await page.getByRole("radio", { name: item }).check();
}

const recentRows = (page: Page) =>
  page.getByRole("region", { name: "Your recent submissions" }).getByRole("listitem");

test.describe.configure({ mode: "serial" });

test.describe("Staff Counter — Founder Preview (real stack)", () => {
  test("Staff land directly on the Counter with a minimal Staff bar — no Owner/Manager destinations", async ({
    page,
  }) => {
    await openCounterAsDiane(page);
    const nav = page.getByRole("navigation", { name: "Counter navigation" });
    await expect(nav.getByRole("link")).toHaveCount(2);
    for (const admin of ["Team", "Business Terms", "Reward Programs", "Customer Rewards"]) {
      await expect(page.getByRole("link", { name: admin })).toHaveCount(0);
    }
    // Two real programmes; the Business name only (no fabricated station).
    await expect(page.getByRole("radio", { name: "Premium Cut Circle" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Express Styling Circle" })).toBeVisible();
    await expect(page.getByText(/Bella Salon/).first()).toBeVisible();
    await expect(page.getByText(/Front Desk|Station/)).toHaveCount(0);
  });

  test("normal purchase by Loyalty Number: truthful 'recorded, customer must confirm, nothing earned'", async ({
    page,
  }) => {
    const programmeBodies: string[] = [];
    page.on("response", async (response) => {
      if (response.url().endsWith("/listRewardPrograms")) {
        programmeBodies.push(await response.text());
      }
    });
    await openCounterAsDiane(page);
    await chooseExpress(page, "Hair wash");
    await page.getByLabel("Loyalty Number").fill(loyaltyNumberOf("chantal").toLowerCase());
    await page.getByRole("button", { name: "Record purchase" }).click();
    await expect(page.getByRole("heading", { name: "Purchase recorded." })).toBeVisible();
    await expect(
      page.getByText("The customer needs to confirm it. Nothing has been earned yet."),
    ).toBeVisible();
    // The outcome card promises nothing: no units, progress, cycle or reward.
    await expect(
      page.getByRole("status").filter({ hasText: "Purchase recorded." }),
    ).not.toContainText(/verified|units|reward|cycle|\d+ of \d+/i);

    // The Business Review threshold never reached this Staff browser.
    await expect.poll(() => programmeBodies.length).toBeGreaterThan(0);
    for (const body of programmeBodies)
      expect(body).not.toContain("businessReviewQuantityThreshold");

    // Serve next customer: a clean form, focus on the first control.
    await page.getByRole("button", { name: "Serve next customer" }).click();
    await expect(page.getByLabel("Loyalty Number")).toHaveValue("");
    await expect(page.getByRole("heading", { name: "Purchase recorded." })).toHaveCount(0);
  });

  test("a quantity at the hidden threshold is routed to Business Review — a success, with nothing revealed", async ({
    page,
  }) => {
    await openCounterAsDiane(page);
    await chooseExpress(page, "Blow-dry");
    await page.getByLabel("Loyalty Number").fill(loyaltyNumberOf("chantal"));
    await page.getByRole("textbox", { name: "Quantity" }).fill("5");
    await page.getByRole("button", { name: "Record purchase" }).click();
    await expect(page.getByRole("heading", { name: "Purchase recorded." })).toBeVisible();
    await expect(
      page.getByText("Business review is required before customer confirmation."),
    ).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByText(/threshold|reviewer|approve|reject|5 or more/i)).toHaveCount(0);
  });

  test("an unknown number and a QR-only programme refuse identically (policy not revealed)", async ({
    page,
  }) => {
    await openCounterAsDiane(page);
    await chooseExpress(page, "Hair wash");
    await page.getByLabel("Loyalty Number").fill("ZZZ222");
    await page.getByRole("button", { name: "Record purchase" }).click();
    const unknown = page.getByRole("alert").filter({ hasText: "couldn't find that customer code" });
    await expect(unknown).toBeVisible();
    const unknownText = await unknown.innerText();

    // Premium Cut is QR-only: a REAL, existing customer's number is refused with the same words.
    await page.getByRole("radio", { name: "Premium Cut Circle" }).check();
    await page.getByRole("radio", { name: "Haircut" }).check();
    await page.getByLabel("Loyalty Number").fill(loyaltyNumberOf("moses"));
    await page.getByRole("button", { name: "Record purchase" }).click();
    const policy = page.getByRole("alert").filter({ hasText: "couldn't find that customer code" });
    await expect(policy).toBeVisible();
    expect(await policy.innerText()).toBe(unknownText);
  });

  test("response lost AFTER commit: the retry recovers the original — one Purchase, same key, same date", async ({
    page,
  }) => {
    await openCounterAsDiane(page);
    await expect(recentRows(page).first()).toBeVisible();
    const before = await recentRows(page).count();

    const attempts: { idempotencyKey: string; purchaseDate: string; quantity: number }[] = [];
    let first = true;
    await page.route("**/recordPurchase", async (route) => {
      attempts.push(route.request().postDataJSON().data);
      if (first) {
        first = false;
        await route.fetch(); // the server really commits…
        await route.abort("failed"); // …and the response never reaches the browser
        return;
      }
      await route.continue();
    });

    await chooseExpress(page, "Hair wash");
    await page.getByLabel("Loyalty Number").fill(loyaltyNumberOf("yves"));
    await page.getByRole("button", { name: "Record purchase" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "We couldn't confirm the result" }),
    ).toBeVisible();
    await expect(page.getByLabel("Loyalty Number")).toHaveValue(loyaltyNumberOf("yves"));

    await page.waitForTimeout(1500); // a recomputed purchaseDate would now differ
    await page.getByRole("button", { name: "Retry — it won't record twice" }).click();
    await expect(page.getByRole("heading", { name: "Purchase recorded." })).toBeVisible();
    await expect(page.getByText("recorded once")).toBeVisible();

    expect(attempts).toHaveLength(2);
    expect(attempts[1].idempotencyKey).toBe(attempts[0].idempotencyKey);
    expect(attempts[1].purchaseDate).toBe(attempts[0].purchaseDate);
    expect(attempts[1]).toEqual(attempts[0]);

    // Exactly ONE new Purchase landed (the feed refreshes after success).
    await page.getByRole("button", { name: "Serve next customer" }).click();
    await expect.poll(() => recentRows(page).count()).toBe(Math.min(before + 1, 10));
  });

  test("own recent submissions: populated for Diane; shows neutral status and no reviewer/threshold", async ({
    page,
  }) => {
    await openCounterAsDiane(page);
    const section = page.getByRole("region", { name: "Your recent submissions" });
    await expect(recentRows(page).first()).toBeVisible();
    await expect(section).toContainText(/Loyalty Number ending|Scanned QR code/);
    await expect(section).toContainText(/Awaiting business review|Waiting for customer|Verified/);
    await expect(section).not.toContainText(/threshold|reviewer|Patrick|Grace/i);
  });

  test("new-customer panel and the dual-role 'Personal' instruction", async ({ page }) => {
    await openCounterAsDiane(page);
    await page.getByRole("button", { name: /New customer\?/ }).click();
    await expect(
      page.getByRole("img", { name: "QR code that opens the 11thONUS sign-up page" }),
    ).toBeVisible();
    await expect(page.getByText(/choose “Personal” after signing in/)).toBeVisible();
    const origin = new URL(page.url()).origin;
    await expect(page.getByText(`${origin}/`, { exact: true })).toBeVisible();
  });

  test("a dual-role person (Diane) finds her own customer identity under Personal", async ({
    page,
  }) => {
    await signInAs(page, "staff_bella");
    await page.getByRole("link", { name: "Personal" }).click();
    await expect(page).toHaveURL(/\/customer/);
  });

  test("French", async ({ page }) => {
    await openCounterAsDiane(page);
    await page.getByRole("button", { name: "Français" }).click();
    await expect(page.getByRole("heading", { name: "Caisse", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Enregistrer l'achat" })).toBeVisible();
    await expect(page.getByLabel("Numéro de fidélité")).toBeVisible();
    await page.getByRole("button", { name: "English" }).click();
  });

  test("the Owner keeps the unchanged Business Dashboard and may still open the Counter", async ({
    page,
  }) => {
    await signInAs(page, "owner_bella");
    await page.getByRole("link", { name: /Bella Salon — Owner/ }).click();
    await expect(page).toHaveURL(/\/business\/[^/]+\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
    const menu = page.getByRole("button", { name: "Open navigation" });
    if (await menu.isVisible()) await menu.click(); // phone width: the unchanged hamburger menu
    const nav = page.getByRole("navigation", { name: "Business Dashboard navigation" });
    await expect(nav.getByRole("link", { name: "Team" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Counter" })).toHaveCount(0); // not added to the nav
    await page.goto(page.url().replace(/dashboard$/, "dashboard/counter"));
    await expect(page.getByRole("heading", { name: "Counter", level: 1 })).toBeVisible();
  });
});
