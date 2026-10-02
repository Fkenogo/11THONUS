/**
 * EA-003 — Business Owner / Manager experience, as a Founder would walk it.
 *
 * Runs against the canonical EA-002 Founder Preview (`pnpm preview:start`, deterministic seed) with
 * the REAL sign-in screen and REAL production routes — no harness, no mocked data, no preview-only
 * product path. Runs at desktop and at Pixel 7 size (projects `chromium-preview` and
 * `chromium-preview-mobile`). Asserts behaviour, not pixels.
 *
 * Evidence: set `EA003_EVIDENCE=1` to also write the Founder-review screenshots to
 * `docs/05-implementation/evidence/EA-003/` (off by default so ordinary runs leave the tree clean).
 *
 * Read-only: nothing here mutates seeded data, so the specs can run in any order against one seed.
 */
import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
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

const evidenceDir = fileURLToPath(
  new URL("../../../docs/05-implementation/evidence/EA-003/", import.meta.url),
);
const captureEvidence = process.env.EA003_EVIDENCE === "1";

async function shot(page: Page, name: string, fullPage = true) {
  if (!captureEvidence) return;
  mkdirSync(evidenceDir, { recursive: true });
  const kind = test.info().project.name.endsWith("mobile") ? "mobile" : "desktop";
  await page.screenshot({
    path: `${evidenceDir}${name}-${kind}.png`,
    fullPage,
    animations: "disabled",
  });
}

async function signInAs(page: Page, key: string) {
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill(emailOf(key));
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in with email" }).click();
  await expect(page).toHaveURL(/\/(customer|business)/);
}

async function enterBusiness(page: Page, linkName: RegExp) {
  await page.getByRole("link", { name: linkName }).click();
  await expect(page).toHaveURL(/\/business\/[^/]+\/dashboard$/);
  await expect(page.getByTestId("command-centre")).toBeVisible();
}

const isMobile = () => test.info().project.name.endsWith("mobile");

/** Navigate through the real primary navigation (drawer on a phone, sidebar on desktop). */
async function goTo(page: Page, destination: string) {
  if (isMobile()) {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  await page
    .getByRole("navigation", { name: "Business Dashboard navigation" })
    .getByRole("link", { name: destination, exact: true })
    .click();
  if (isMobile()) {
    // Selecting a destination closes the drawer.
    await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
  }
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const el = document.scrollingElement as HTMLElement;
    return el.scrollWidth - el.clientWidth;
  });
  expect(overflow, "page must not scroll sideways").toBeLessThanOrEqual(1);
}

async function expectTouchTargets(page: Page, selector: string) {
  const boxes = await page
    .locator(selector)
    .evaluateAll((els) =>
      els
        .filter((el) => (el as HTMLElement).offsetParent !== null)
        .map((el) => (el as HTMLElement).getBoundingClientRect().height),
    );
  expect(boxes.length).toBeGreaterThan(0);
  for (const height of boxes) expect(height).toBeGreaterThanOrEqual(44);
}

test.describe("EA-003 · Business Owner (Bella Salon)", () => {
  test("home → attention → programme → customers → team → location → commercial consequence", async ({
    page,
  }) => {
    await signInAs(page, "owner_bella");
    await enterBusiness(page, /Bella Salon — Owner/);

    // Business status + role are stated, in the shell.
    await expect(page.getByTestId("viewer-role").first()).toHaveText("Owner");
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();

    // ── Attention states drawn from real data ──────────────────────────────────
    const attention = page.getByRole("region", { name: "Needs your attention" });
    await expect(attention.locator('[data-attention="rewardsReady"]')).toBeVisible(); // Kevin 10/10
    await expect(attention.locator('[data-attention="waitingForCustomer"]')).toBeVisible(); // Moses
    await expect(attention.locator('[data-attention="underReview"]')).toBeVisible(); // Chantal
    // A purchase waiting for the customer is never presented as progress.
    await expect(
      attention
        .locator('[data-attention="waitingForCustomer"]')
        .getByText(/only count toward a Circle once the customer verifies/),
    ).toBeVisible();
    // No prototype-only approval flow exists.
    await expect(page.getByRole("button", { name: /^(Approve|Reject)$/ })).toHaveCount(0);
    await shot(page, "01-owner-home");

    // ── Loyalty at a glance + programme snapshot (real read models) ───────────
    const glance = page.getByRole("region", { name: "Loyalty at a glance" });
    await expect(glance.locator('[data-tile="live"]')).toContainText("1");
    await expect(glance.getByRole("progressbar").first()).toBeVisible();
    const programs = page.getByRole("region", { name: "Reward Programs" });
    await expect(programs.getByText("Premium Cut Circle")).toBeVisible();
    await expect(programs.getByText("Family Care Circle")).toBeVisible();
    await expect(programs.getByText("Not published yet")).toBeVisible(); // the draft

    // ── Programme ───────────────────────────────────────────────────────────────
    await goTo(page, "Reward Programs");
    await expect(page).toHaveURL(/\/dashboard\/reward-programs$/);
    await expect(page.getByText("Premium Cut Circle").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Reward Program" })).toBeVisible(); // Owner-only
    await expectNoHorizontalOverflow(page);
    await shot(page, "02-owner-programme");

    // ── Customer / Circle / Reward activity ─────────────────────────────────────
    await goTo(page, "Customer Rewards");
    await expect(page.getByRole("heading", { name: "Customer Rewards" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Rewards ready" })).toBeVisible();
    await expect(page.getByText(/9 of 10 verified units/).first()).toBeVisible(); // Esther
    await expect(page.getByText(/7 of 10 verified units/).first()).toBeVisible(); // Jean-Claude
    // The Reward ID gap (EA-001 B4) is respected: no redeem action is offered on this surface.
    await expect(page.getByRole("button", { name: /redeem/i })).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await shot(page, "03-owner-customer-reward-activity");

    // ── Team ────────────────────────────────────────────────────────────────────
    await goTo(page, "Team");
    await expect(page.getByRole("heading", { name: "Team", level: 1 })).toBeVisible();
    await expect(page.getByText("Patrick Mugisha")).toBeVisible();
    await expect(page.getByText("Diane Kamikazi")).toBeVisible();
    await expect(page.getByRole("button", { name: "Invite team member" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Change role" }).first()).toBeVisible(); // Owner-only
    await expectNoHorizontalOverflow(page);
    await shot(page, "04-owner-team");

    // ── Location ────────────────────────────────────────────────────────────────
    await goTo(page, "Locations");
    await expect(page.getByRole("heading", { name: "Locations" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    // ── Commercial consequence ──────────────────────────────────────────────────
    // Bella's Commercial state is healthy and the admission gate is off in the preview, so no
    // Purchase is held and no "paused" notice is shown. The Command Centre never fabricates a
    // standing, and never exposes balances, ledgers, settlements or processor detail.
    await goTo(page, "Overview");
    await expect(page.getByText("New Circles are paused")).toHaveCount(0);
    const body = (await page.locator("main").textContent()) ?? "";
    expect(body).not.toMatch(/earmark|settlement|ledger|processor|scheduler|postgres/i);
    await shot(page, "05-owner-commercial-state");
  });

  test("mobile ergonomics: drawer navigation, touch targets, no sideways scroll", async ({
    page,
  }) => {
    test.skip(!isMobile(), "phone-only assessment");
    await signInAs(page, "owner_bella");
    await enterBusiness(page, /Bella Salon — Owner/);
    await expectNoHorizontalOverflow(page);

    const trigger = page.getByRole("button", { name: "Open navigation" });
    const box = await trigger.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);

    await trigger.click();
    const nav = page.getByRole("navigation", { name: "Business Dashboard navigation" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link")).toHaveCount(8);
    await expectTouchTargets(page, 'nav[aria-label="Business Dashboard navigation"] a');
    await shot(page, "00-owner-drawer", false);
    await page.keyboard.press("Escape");
    await expect(nav).toBeHidden();
    // Primary Command Centre links are thumb-sized.
    await expectTouchTargets(page, '[data-testid="command-centre"] a');
  });
});

test.describe("EA-003 · Business Manager (Bella Salon)", () => {
  test("home → activity → rewards → team/locations; Owner-only controls absent", async ({
    page,
  }) => {
    await signInAs(page, "manager_bella");
    await enterBusiness(page, /Bella Salon — Manager/);
    await expect(page.getByTestId("viewer-role").first()).toHaveText("Manager");

    // Same operational picture as the Owner.
    const attention = page.getByRole("region", { name: "Needs your attention" });
    await expect(attention.locator('[data-attention="rewardsReady"]')).toBeVisible();
    await expect(attention.locator('[data-attention="waitingForCustomer"]')).toBeVisible();
    await shot(page, "06-manager-home");

    await goTo(page, "Customer Rewards");
    await expect(page.getByRole("heading", { name: "Rewards ready" })).toBeVisible();
    await expect(page.getByText(/verified units/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /redeem/i })).toHaveCount(0);
    await shot(page, "07-manager-activity");

    await goTo(page, "Purchases");
    await expect(page.getByRole("heading", { name: "Purchase Records" })).toBeVisible();

    // Team + locations are reachable as authorised…
    await goTo(page, "Team");
    await expect(page.getByRole("heading", { name: "Team", level: 1 })).toBeVisible();
    await expect(page.getByText("Diane Kamikazi")).toBeVisible();
    // …but Owner-only controls are absent (and enforced server-side regardless).
    await expect(page.getByRole("button", { name: "Change role" })).toHaveCount(0);

    await goTo(page, "Locations");
    await expect(page.getByRole("heading", { name: "Locations" })).toBeVisible();

    await goTo(page, "Reward Programs");
    await expect(page.getByText("Premium Cut Circle").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Reward Program" })).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });
});

test.describe("EA-003 · Other Businesses (seed breadth)", () => {
  test("Sparkle Car Wash Owner sees their own Circles, not Bella's", async ({ page }) => {
    await signInAs(page, "owner_sparkle");
    await enterBusiness(page, /Sparkle Car Wash — Owner/);
    await expect(
      page.getByTestId("command-centre").getByRole("heading", { name: "Wash 10+1" }),
    ).toBeVisible();
    await expect(page.getByTestId("command-centre").getByText("Premium Cut Circle")).toHaveCount(0);
    await expect(
      page
        .getByRole("region", { name: "Needs your attention" })
        .locator('[data-attention="rewardsReady"]'),
    ).toBeVisible(); // Yves
  });

  test("Tembo Fitness Owner (restricted new Circles): no fabricated Commercial standing", async ({
    page,
  }) => {
    await signInAs(page, "owner_tembo");
    await enterBusiness(page, /Tembo Fitness — Owner/);
    // No Business-facing Commercial read model exists yet (WP-COM-08). The experience therefore
    // shows only canonical Purchase state; with the admission gate off nothing is held.
    await expect(
      page.getByTestId("command-centre").getByRole("heading", { name: "Gym Visits" }),
    ).toBeVisible();
    await expect(page.getByText(/restricted|balance|credit/i)).toHaveCount(0);
  });
});

test.describe("EA-003 · Staff routing is unchanged", () => {
  test("Staff reaches the shell but not the Owner/Manager Command Centre", async ({ page }) => {
    await signInAs(page, "staff_bella");
    await page.getByRole("link", { name: /Bella Salon — Staff/ }).click();
    await expect(page).toHaveURL(/\/business\/[^/]+\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
    await expect(page.getByTestId("command-centre")).toHaveCount(0);
  });
});
