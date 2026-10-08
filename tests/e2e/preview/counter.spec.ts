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
import { expect, test, type Locator, type Page } from "@playwright/test";
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

/** One phone-oriented Staff shell at every viewport size (Founder Pass 2): the bottom bar is permanent. */
const staffNav = (page: Page) => page.getByRole("navigation", { name: "Counter navigation" });
const quickActionsButton = (page: Page) =>
  staffNav(page).getByRole("button", { name: "Quick actions" });
const goToPlace = (page: Page, name: "Counter" | "Activity" | "Profile") =>
  staffNav(page).getByRole("link", { name }).click();

/** Nothing the Staff must tap may sit under the fixed bottom bar (at any viewport width). */
async function expectClearOfBottomBar(page: Page, locator: ReturnType<Page["locator"]>) {
  await expect(staffNav(page)).toBeVisible();
  await page.waitForFunction(
    () =>
      new Promise<boolean>((resolve) => {
        const before = window.scrollY;
        setTimeout(() => resolve(window.scrollY === before), 150);
      }),
    undefined,
    { polling: 50 },
  );
  const bar = (await staffNav(page).boundingBox())!;
  const box = (await locator.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(bar.y + 0.5);
}

const recentRows = (page: Page) =>
  page.getByRole("region", { name: "Your recent submissions" }).getByRole("listitem");

/** Units awaiting the customer's confirmation, read from the visible status (0 when none is shown). */
async function awaitingUnits(card: Locator): Promise<number> {
  const match = (await card.innerText()).match(/(\d+) purchases? awaiting customer confirmation/);
  return match ? Number(match[1]) : 0;
}

/** The limited loyalty status the Counter shows once the customer and programme are known. */
const loyaltyProgress = (page: Page) => page.getByTestId("counter-loyalty-progress");
const loyaltyReward = (page: Page) => page.getByTestId("counter-loyalty-reward");

test.describe.configure({ mode: "serial" });

test.describe("Staff Counter — Founder Preview (real stack)", () => {
  test("Staff land directly on the Counter with a minimal Staff bar — no Owner/Manager destinations", async ({
    page,
  }) => {
    await openCounterAsDiane(page);
    const nav = staffNav(page);
    // Staff-only shell at every width: three PLACES in a permanent bottom bar plus one quick-ACTION button.
    await expect(nav.getByRole("link")).toHaveText(["Counter", "Activity", "Profile"]);
    await expect(nav.getByRole("button")).toHaveCount(1);
    await expect(quickActionsButton(page)).toBeVisible();
    await expect(page.getByRole("button", { name: "Français" })).toHaveCount(0);
    const appBox = (await page.getByTestId("staff-app").boundingBox())!;
    expect(appBox.width).toBeLessThanOrEqual(513);
    // The Counter is transaction-only: no Activity list and no New customer workflow on it.
    await expect(page.getByText("Your recent submissions")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /New customer\?/ })).toHaveCount(0);
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

    // Serve next customer stays reachable above the bottom bar on a phone.
    await expectClearOfBottomBar(page, page.getByRole("button", { name: "Serve next customer" }));

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

    const attempts: { idempotencyKey: string; purchaseDate: string; quantity: number }[] = [];
    const purchaseIds: string[] = [];
    let first = true;
    await page.route("**/recordPurchase", async (route) => {
      attempts.push(route.request().postDataJSON().data);
      if (first) {
        first = false;
        const committed = await route.fetch(); // the server really commits…
        purchaseIds.push((await committed.json()).result.purchase.id);
        await route.abort("failed"); // …and the response never reaches the browser
        return;
      }
      const retried = await route.fetch();
      purchaseIds.push((await retried.json()).result.purchase.id);
      await route.fulfill({ response: retried });
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

    // Exactly ONE Purchase: the retry returned the very Purchase the lost response had committed.
    expect(purchaseIds).toHaveLength(2);
    expect(purchaseIds[1]).toBe(purchaseIds[0]);

    // And Activity shows it as the newest row.
    await page.getByRole("button", { name: "Serve next customer" }).click();
    await goToPlace(page, "Activity");
    const newest = recentRows(page).nth(0);
    const hint = `Loyalty Number ending ${loyaltyNumberOf("yves").slice(-3)}`;
    await expect(newest).toContainText(hint);
    await expect(newest).toContainText("1 × Hair wash");
  });

  test("limited loyalty status appears BEFORE recording: normal, awaiting-separately, and reward available", async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (url.endsWith("/recordPurchase")) requests.push("recordPurchase");
      if (url.endsWith("/getCounterLoyaltyContext")) requests.push("getCounterLoyaltyContext");
    });
    await openCounterAsDiane(page);
    await page.getByRole("radio", { name: "Express Styling Circle" }).check();

    await page.getByLabel("Loyalty Number").fill(loyaltyNumberOf("jeanclaude"));
    await expect(loyaltyProgress(page)).toContainText("8 of 10 verified");
    await expect(loyaltyProgress(page)).toContainText(
      "2 more verified purchases until the 11th is on us",
    );
    await expectClearOfBottomBar(page, page.getByRole("button", { name: "Record purchase" }));

    // A purchase awaiting the customer is reported SEPARATELY and never added to the verified count.
    await page.getByLabel("Loyalty Number").fill(loyaltyNumberOf("esther"));
    await expect(loyaltyProgress(page)).toContainText("9 of 10 verified");
    await expect(loyaltyProgress(page)).toContainText("1 purchase awaiting customer confirmation");
    await expect(loyaltyProgress(page)).not.toContainText("10 of 10");

    // Reward available: a prominent alert before any purchase is recorded; nothing is redeemed.
    await page.getByLabel("Loyalty Number").fill(loyaltyNumberOf("chantal"));
    await expect(loyaltyReward(page)).toContainText("11th reward available");
    await expect(loyaltyReward(page)).toContainText("Let the customer know their reward is ready.");
    await expect(page.getByRole("button", { name: /redeem|confirm reward/i })).toHaveCount(0);

    // Reading status recorded nothing, and it names no one.
    expect(requests).not.toContain("recordPurchase");
    expect(requests.filter((r) => r === "getCounterLoyaltyContext").length).toBeGreaterThanOrEqual(
      3,
    );
    await expect(page.locator("body")).not.toContainText(
      /Habimana|Jean-Claude|Irakoze|Esther|Uwimana|Chantal/,
    );
  });

  test("a Staff-recorded purchase does NOT advance the verified count: it shows as one more awaiting the customer", async ({
    page,
  }) => {
    await openCounterAsDiane(page);
    await chooseExpress(page, "Hair wash");
    await page.getByLabel("Loyalty Number").fill(loyaltyNumberOf("jeanclaude"));
    await expect(loyaltyProgress(page)).toContainText("8 of 10 verified");
    const awaitingBefore = await awaitingUnits(loyaltyProgress(page));
    await page.getByRole("button", { name: "Record purchase" }).click();
    await expect(page.getByRole("heading", { name: "Purchase recorded." })).toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: "Purchase recorded." }),
    ).not.toContainText(/verified|10 of 10/i);

    // Next customer: the same customer again — still 8 verified, plus ONE more awaiting confirmation.
    await page.getByRole("button", { name: "Serve next customer" }).click();
    await chooseExpress(page, "Hair wash");
    await page.getByLabel("Loyalty Number").fill(loyaltyNumberOf("jeanclaude"));
    await expect(loyaltyProgress(page)).toContainText("8 of 10 verified");
    await expect(loyaltyProgress(page)).not.toContainText("9 of 10");
    await expect.poll(() => awaitingUnits(loyaltyProgress(page))).toBe(awaitingBefore + 1);
  });

  test("with a reward available an ordinary purchase can still be recorded — and nothing is redeemed", async ({
    page,
  }) => {
    await openCounterAsDiane(page);
    await chooseExpress(page, "Blow-dry");
    await page.getByLabel("Loyalty Number").fill(loyaltyNumberOf("chantal"));
    await expect(loyaltyReward(page)).toBeVisible();
    const awaitingBefore = await awaitingUnits(loyaltyReward(page));
    await page.getByRole("button", { name: "Record purchase" }).click();
    await expect(page.getByRole("heading", { name: "Purchase recorded." })).toBeVisible();
    await page.getByRole("button", { name: "Serve next customer" }).click();
    await chooseExpress(page, "Blow-dry");
    await page.getByLabel("Loyalty Number").fill(loyaltyNumberOf("chantal"));
    // Still the reward (10 verified, reward open); the new purchase waits for the customer.
    await expect(loyaltyReward(page)).toContainText("11th reward available");
    await expect.poll(() => awaitingUnits(loyaltyReward(page))).toBe(awaitingBefore + 1);
  });

  test("a code the server cannot resolve gives a quiet neutral note — never a hint why — and recording is not blocked by it", async ({
    page,
  }) => {
    await openCounterAsDiane(page);
    await chooseExpress(page, "Blow-dry");
    await page.getByLabel("Loyalty Number").fill("ZZZ222");
    await expect(
      page.getByText(
        "Loyalty status isn't available right now. You can still record the purchase.",
      ),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Record purchase" })).toBeEnabled();
  });

  test("Activity is its own view: the member's own submissions, paged with 'Load more', neutral status only", async ({
    page,
  }) => {
    await openCounterAsDiane(page);
    await goToPlace(page, "Activity");
    await expect(page).toHaveURL(/\/dashboard\/activity$/);
    await expect(page.getByRole("heading", { name: "Activity", level: 1 })).toBeFocused();
    const section = page.getByRole("region", { name: "Your recent submissions" });
    await expect(recentRows(page).first()).toBeVisible();
    await expect(section).toContainText(/Loyalty Number ending|Scanned QR code/);
    await expect(section).toContainText(/Awaiting business review|Waiting for customer|Verified/);
    const firstPage = await recentRows(page).count();
    expect(firstPage).toBe(20);
    await page.getByRole("button", { name: "Load more" }).click();
    await expect.poll(() => recentRows(page).count()).toBeGreaterThan(firstPage);
    await expect(section).not.toContainText(/threshold|reviewer|Patrick|Grace/i);
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
    );
    await expectClearOfBottomBar(
      page,
      page
        .getByRole("button", { name: "Load more" })
        .or(page.getByText("That's everything you've recorded."))
        .first(),
    );
  });

  test("quick action 'Help a new customer join' opens the sign-up sheet and the dual-role 'Personal' instruction", async ({
    page,
  }) => {
    await openCounterAsDiane(page);
    await quickActionsButton(page).click();
    await page
      .getByRole("dialog", { name: "Quick actions" })
      .getByRole("button", { name: /^Help a new customer join/ })
      .click();
    const sheet = page.getByRole("dialog", { name: "Help a new customer join" });
    await expect(
      sheet.getByRole("img", { name: "QR code that opens the 11thONUS sign-up page" }),
    ).toBeVisible();
    await expect(sheet.getByText(/choose “Personal” after signing in/)).toBeVisible();
    const origin = new URL(page.url()).origin;
    await expect(sheet.getByText(`${origin}/`, { exact: true })).toBeVisible();
    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(quickActionsButton(page)).toBeFocused();
  });

  test("quick action 'Scan customer QR' from Activity returns to the Counter and opens the scanner section", async ({
    page,
  }) => {
    await openCounterAsDiane(page);
    await goToPlace(page, "Activity");
    await expect(page.getByRole("heading", { name: "Activity", level: 1 })).toBeVisible();
    await quickActionsButton(page).click();
    await page
      .getByRole("dialog", { name: "Quick actions" })
      .getByRole("button", { name: /^Scan customer QR/ })
      .click();
    await expect(page).toHaveURL(/\/dashboard\/counter$/);
    // A real camera may be live or (headless, no device/permission) explained — either way the scanner
    // section opened and the Loyalty Number fallback is offered; the transaction form is intact.
    await expect(
      page
        .getByRole("button", { name: "Cancel scanning" })
        .or(page.getByRole("alert").filter({ hasText: /camera/i })),
    ).toBeVisible();
  });

  test("places keep the transaction safe: Counter → Activity → Profile → Counter, Record stays above the bar", async ({
    page,
  }) => {
    await openCounterAsDiane(page);
    await chooseExpress(page, "Blow-dry");
    await page.getByLabel("Loyalty Number").fill(loyaltyNumberOf("esther"));
    await expect(loyaltyProgress(page)).toContainText("9 of 10 verified");
    const record = page.getByRole("button", { name: "Record purchase" });
    await expectClearOfBottomBar(page, record);

    await goToPlace(page, "Activity");
    await expect(page.getByRole("heading", { name: "Activity", level: 1 })).toBeVisible();
    await goToPlace(page, "Profile");
    await expect(page.getByRole("heading", { name: "Profile", level: 1 })).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard\/activity$/);
    await goToPlace(page, "Counter");

    // The in-progress transaction survived every hop (and nothing was recorded by moving around).
    await expect(page.getByLabel("Loyalty Number")).toHaveValue(loyaltyNumberOf("esther"));
    await expect(page.getByRole("radio", { name: "Blow-dry" })).toBeChecked();
    await expect(loyaltyProgress(page)).toContainText("9 of 10 verified");
    await expectClearOfBottomBar(page, record);
  });

  test("Profile: own sign-in identity, Business and role; language; Switch Business / Personal leads to the chooser", async ({
    page,
  }) => {
    await openCounterAsDiane(page);
    await goToPlace(page, "Profile");
    await expect(page.getByRole("heading", { name: "Profile", level: 1 })).toBeFocused();
    await expect(page.getByText(emailOf("staff_bella"))).toBeVisible();
    await expect(page.getByText("Bella Salon").first()).toBeVisible();
    await expect(page.getByText("Staff", { exact: true })).toBeVisible();
    for (const forbidden of ["Team", "Permissions", "Business Terms", "Reward Programs"]) {
      await expect(page.getByRole("link", { name: forbidden })).toHaveCount(0);
    }
    await page.getByRole("link", { name: "Switch business or Personal" }).click();
    await expect(page).toHaveURL(/\/business\/?$/);
  });

  test("a dual-role person (Diane) finds her own customer identity under Personal", async ({
    page,
  }) => {
    await signInAs(page, "staff_bella");
    await page.getByRole("link", { name: "Personal" }).click();
    await expect(page).toHaveURL(/\/customer/);
  });

  test("French: the language is chosen on Profile and the whole Staff app follows", async ({
    page,
  }) => {
    await openCounterAsDiane(page);
    await goToPlace(page, "Profile");
    await page.getByRole("button", { name: "Français" }).click();
    await expect(page.getByRole("heading", { name: "Profil", level: 1 })).toBeVisible();
    const frNav = page.getByRole("navigation", { name: "Navigation de la caisse" });
    await expect(frNav.getByRole("link")).toHaveText(["Caisse", "Activité", "Profil"]);
    await frNav.getByRole("link", { name: "Caisse" }).click();
    await expect(page.getByRole("heading", { name: "Caisse", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Enregistrer l'achat" })).toBeVisible();
    await expect(page.getByLabel("Numéro de fidélité")).toBeVisible();
    await page.getByRole("radio", { name: "Express Styling Circle" }).check();
    await page.getByLabel("Numéro de fidélité").fill(loyaltyNumberOf("jeanclaude"));
    await expect(loyaltyProgress(page)).toContainText("8 sur 10 vérifiés");
    await frNav.getByRole("link", { name: "Profil" }).click();
    await page.getByRole("button", { name: "English" }).click();
    await expect(page.getByRole("heading", { name: "Profile", level: 1 })).toBeVisible();
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
    await expect(page.getByTestId("staff-bottom-nav")).toHaveCount(0); // Staff-only mobile shell
    await page.goto(page.url().replace(/dashboard$/, "dashboard/counter"));
    await expect(page.getByRole("heading", { name: "Counter", level: 1 })).toBeVisible();
    await expect(page.getByTestId("staff-bottom-nav")).toHaveCount(0);
  });
});
