/**
 * Real-browser regression for the Staff app (`EA-BL-001-CORR-002-B`) — proves what jsdom cannot:
 * the ONE phone-oriented Staff shell at every width (320 → 1440 px: centred, bounded, single column,
 * permanent bottom bar), the three places (Counter / Activity / Profile) and the quick-action sheets,
 * the limited loyalty status above the Record action, no horizontal overflow down to 320 px, real
 * tap-target sizes, the scanner view driven by a real (fake-device) camera stream with the camera
 * genuinely closed on cancel, and axe accessibility. Runs against `/dev/counter-harness`
 * (development-only, never shipped), which mounts the REAL `StaffShell` + pages on local fixture data —
 * no Firebase, no network.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

const PATH = "/dev/counter-harness/counter";
const ACTIVITY_PATH = "/dev/counter-harness/activity";
const PROFILE_PATH = "/dev/counter-harness/profile";

/** The ONE Staff shell is exercised at phone, tablet and wide-laptop widths alike. */
const WIDTHS = [320, 375, 390, 768, 1024, 1440];
const APP_MAX_WIDTH = 512; // max-w-lg

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBe(overflow.clientWidth);
}

async function expectTapTargets(page: Page, names: (string | RegExp)[]) {
  for (const name of names) {
    const box = await page.getByRole("button", { name }).first().boundingBox();
    expect(box, String(name)).not.toBeNull();
    expect(box!.height, String(name)).toBeGreaterThanOrEqual(44);
  }
}

const bottomNav = (page: Page) => page.getByRole("navigation", { name: "Counter navigation" });
const fab = (page: Page) => bottomNav(page).getByRole("button", { name: "Quick actions" });

/** Smooth scrolling is animated: wait until the scroll position stops changing before measuring. */
async function waitForScrollIdle(page: Page) {
  await page.waitForFunction(
    () =>
      new Promise<boolean>((resolve) => {
        const before = window.scrollY;
        setTimeout(() => resolve(window.scrollY === before), 150);
      }),
    undefined,
    { timeout: 5000, polling: 50 },
  );
}

async function scrollToEnd(page: Page) {
  await page.evaluate(() =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
  );
  await waitForScrollIdle(page);
}

/** The bar's top edge: nothing the Staff needs may extend below it. */
async function bottomNavTop(page: Page) {
  const box = await bottomNav(page).boundingBox();
  expect(box, "bottom navigation").not.toBeNull();
  return box!.y;
}

async function expectAboveBottomNav(page: Page, locator: Locator, label: string) {
  await waitForScrollIdle(page);
  const box = await locator.boundingBox();
  expect(box, label).not.toBeNull();
  expect(box!.y + box!.height, `${label} must not sit under the bottom bar`).toBeLessThanOrEqual(
    (await bottomNavTop(page)) + 0.5,
  );
}

async function openQuickActions(page: Page) {
  await fab(page).click();
  const dialog = page.getByRole("dialog", { name: "Quick actions" });
  await expect(dialog).toBeVisible();
  return dialog;
}

for (const width of WIDTHS) {
  test.describe(`Staff app — ${width}px`, () => {
    test.use({ viewport: { width, height: 740 } });

    test("Counter: no horizontal overflow; scan, number and Record are prominent and reachable", async ({
      page,
    }) => {
      await page.goto(PATH);
      await expect(page.getByRole("heading", { name: "Counter", level: 1 })).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expect(page.getByRole("button", { name: "Scan customer QR" })).toBeVisible();
      await expect(page.getByLabel("Loyalty Number")).toBeVisible();
      await expect(page.getByRole("button", { name: "Record purchase" })).toBeVisible();
      await expectTapTargets(page, [
        "Scan customer QR",
        "Record purchase",
        "Decrease quantity",
        "Increase quantity",
      ]);
      // The Counter is transaction-only now: no Activity list, no embedded New customer workflow.
      await expect(page.getByText("Your recent submissions")).toHaveCount(0);
      await expect(page.getByRole("button", { name: /New customer\?/ })).toHaveCount(0);
    });

    test("many programmes and items with long names still fit the app width", async ({ page }) => {
      await page.goto(`${PATH}?fixture=many`);
      await expect(page.getByRole("radio", { name: /Premium Cut Circle/ })).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await page.getByRole("radio", { name: "Family Care Circle" }).check();
      // More than six items collapse to a single, large select rather than a long list.
      await expect(page.getByLabel("Item")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });

    test("one shell at every width: compact header, no top-nav variant, a single column, a centred bounded app", async ({
      page,
    }) => {
      await page.goto(PATH);
      await expect(page.getByRole("heading", { name: "Counter", level: 1 })).toBeVisible();
      const viewport = page.viewportSize()!;
      const app = page.getByTestId("staff-app");
      const appBox = (await app.boundingBox())!;
      expect(appBox.width).toBeLessThanOrEqual(APP_MAX_WIDTH + 1);
      expect(appBox.width).toBeGreaterThanOrEqual(Math.min(viewport.width, APP_MAX_WIDTH) - 1);
      expect(Math.abs(appBox.x + appBox.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(1);
      const header = app.locator("header").first();
      await expect(header).toContainText("Staff counter");
      await expect(header).toContainText("Bella Salon");
      await expect(header.getByRole("link")).toHaveCount(0);
      await expect(header.getByRole("button")).toHaveCount(0);
      expect((await header.boundingBox())!.height).toBeLessThanOrEqual(72);
      // No Staff top-nav variant: the only navigation is the bottom bar; no language control up top.
      await expect(page.getByRole("navigation")).toHaveCount(1);
      await expect(page.getByRole("link", { name: "Switch business or Personal" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Français" })).toHaveCount(0);
      // Single vertical flow: Identify, then Programme/Record beneath it, same left edge and width.
      const identify = (await page
        .getByRole("region", { name: /Identify customer/ })
        .boundingBox())!;
      const programme = (await page
        .getByRole("region", { name: /Programme/ })
        .first()
        .boundingBox())!;
      const record = (await page.getByRole("button", { name: "Record purchase" }).boundingBox())!;
      expect(programme.y).toBeGreaterThanOrEqual(identify.y + identify.height - 1);
      expect(Math.abs(programme.x - identify.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(programme.width - identify.width)).toBeLessThanOrEqual(1);
      expect(record.x).toBeGreaterThanOrEqual(appBox.x);
      expect(record.x + record.width).toBeLessThanOrEqual(appBox.x + appBox.width + 1);
      await expectNoHorizontalOverflow(page);
    });

    test("bottom bar: three places + one quick-action button; fixed, centred, bounded, ≥44px targets, safe-area aware", async ({
      page,
    }) => {
      await page.goto(PATH);
      const nav = bottomNav(page);
      await expect(nav).toBeVisible();
      await expect(nav.getByRole("link")).toHaveText(["Counter", "Activity", "Profile"]);
      await expect(nav.getByRole("button")).toHaveCount(1);
      await expect(nav.getByRole("link", { name: "Counter" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      // New customer is an ACTION (sheet), never a destination.
      await expect(nav.getByRole("link", { name: /new customer/i })).toHaveCount(0);
      const box = (await nav.boundingBox())!;
      const viewport = page.viewportSize()!;
      expect(Math.round(box.y + box.height)).toBe(viewport.height);
      expect(box.width).toBeLessThanOrEqual(APP_MAX_WIDTH + 1);
      expect(box.width).toBeGreaterThanOrEqual(Math.min(viewport.width, APP_MAX_WIDTH) - 1);
      expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(1);
      const targets: Locator[] = [
        nav.getByRole("link", { name: "Counter" }),
        nav.getByRole("link", { name: "Activity" }),
        nav.getByRole("link", { name: "Profile" }),
        fab(page),
      ];
      for (const target of targets) {
        const t = (await target.boundingBox())!;
        expect(t.height).toBeGreaterThanOrEqual(44);
        expect(t.width).toBeGreaterThanOrEqual(44);
        expect(t.x).toBeGreaterThanOrEqual(box.x);
        expect(t.x + t.width).toBeLessThanOrEqual(box.x + box.width + 0.5);
      }
      await expectNoHorizontalOverflow(page);
    });

    test("the quick-action button is visually distinct and inside the bar (no overlap with content above it)", async ({
      page,
    }) => {
      await page.goto(PATH);
      const nav = (await bottomNav(page).boundingBox())!;
      const button = (await fab(page).boundingBox())!;
      expect(button.y).toBeGreaterThanOrEqual(nav.y);
      expect(button.y + button.height).toBeLessThanOrEqual(nav.y + nav.height);
      // A filled round button: far larger than a text link's target and fully circular.
      const radius = await fab(page).evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
      expect(parseFloat(radius)).toBeGreaterThanOrEqual(button.height / 2 - 1);
    });

    test("the bottom bar stays fixed while scrolling and never covers the Record action", async ({
      page,
    }) => {
      await page.goto(`${PATH}?fixture=many`);
      await page.mouse.wheel(0, 400);
      const viewport = page.viewportSize()!;
      const nav = (await bottomNav(page).boundingBox())!;
      expect(Math.round(nav.y + nav.height)).toBe(viewport.height);
      await expectAboveBottomNav(
        page,
        page.getByRole("button", { name: "Record purchase" }),
        "Record purchase",
      );
    });

    test("Activity is its own routed view: own rows fit, neutral status, last row clear of the bar, no navigation side effects", async ({
      page,
    }) => {
      await page.goto(PATH);
      await page.getByLabel("Loyalty Number").fill("abc234");
      await bottomNav(page).getByRole("link", { name: "Activity" }).click();
      await expect(page).toHaveURL(/\/dev\/counter-harness\/activity$/);
      await expect(page.getByRole("heading", { name: "Activity", level: 1 })).toBeFocused();
      await expect(bottomNav(page).getByRole("link", { name: "Activity" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      const section = page.getByRole("region", { name: "Your recent submissions" });
      await expect(section.getByText("Awaiting business review")).toBeVisible();
      await expect(section).not.toContainText(/threshold|reviewer|colleague/i);
      await expectNoHorizontalOverflow(page);
      await scrollToEnd(page);
      await expectAboveBottomNav(page, section.getByRole("listitem").last(), "last Activity row");
      // The transaction in progress on the Counter was not lost by looking at Activity.
      await bottomNav(page).getByRole("link", { name: "Counter" }).click();
      await expect(page.getByLabel("Loyalty Number")).toHaveValue("ABC234");
      await expect(page.getByRole("heading", { name: "Counter", level: 1 })).toBeFocused();
    });

    test("Activity: 'Load more' is a large, reachable control when the server offers another page", async ({
      page,
    }) => {
      await page.goto(`${ACTIVITY_PATH}?fixture=paged`);
      const more = page.getByRole("button", { name: "Load more" });
      await expect(more).toBeVisible();
      expect((await more.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await scrollToEnd(page);
      await expectAboveBottomNav(page, more, "Load more");
    });

    test("Profile is its own routed view: identity/context only, language, Switch Business / Personal, sign out — all ≥44px", async ({
      page,
    }) => {
      await page.goto(PROFILE_PATH);
      await expect(page.getByRole("heading", { name: "Profile", level: 1 })).toBeVisible();
      await expect(page.getByText("Bella Salon").first()).toBeVisible();
      await expect(page.getByText("Staff", { exact: true })).toBeVisible();
      for (const forbidden of ["Team", "Permissions", "Business Terms", "Reward Programs"]) {
        await expect(page.getByRole("link", { name: forbidden })).toHaveCount(0);
      }
      for (const target of [
        page.getByRole("button", { name: "Français" }),
        page.getByRole("link", { name: "Switch business or Personal" }),
        page.getByRole("button", { name: "Sign out" }),
      ]) {
        expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      await expectNoHorizontalOverflow(page);
      await scrollToEnd(page);
      await expectAboveBottomNav(page, page.getByRole("button", { name: "Sign out" }), "Sign out");
    });

    test("quick actions: a sheet with exactly Scan customer QR and Help a new customer join; Escape returns focus to the button", async ({
      page,
    }) => {
      await page.goto(PATH);
      const dialog = await openQuickActions(page);
      await expect(dialog.getByRole("button", { name: /^Scan customer QR/ })).toBeVisible();
      await expect(dialog.getByRole("button", { name: /^Help a new customer join/ })).toBeVisible();
      for (const target of [
        dialog.getByRole("button", { name: /^Scan customer QR/ }),
        dialog.getByRole("button", { name: /^Help a new customer join/ }),
        dialog.getByRole("button", { name: "Close" }),
      ]) {
        expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      // One-handed: the actions sit in the lower half of the screen, within thumb reach of the bar.
      const scanBox = (await dialog
        .getByRole("button", { name: /^Scan customer QR/ })
        .boundingBox())!;
      expect(scanBox.y).toBeGreaterThan(page.viewportSize()!.height / 2);
      await expectNoHorizontalOverflow(page);
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(fab(page)).toBeFocused();
    });

    test("quick action 'Help a new customer join': the existing sign-up QR sheet fits, with the dual-role note", async ({
      page,
    }) => {
      await page.goto(PATH);
      const quick = await openQuickActions(page);
      await quick.getByRole("button", { name: /^Help a new customer join/ }).click();
      const sheet = page.getByRole("dialog", { name: "Help a new customer join" });
      await expect(sheet).toBeVisible();
      await expect(
        sheet.getByRole("img", { name: "QR code that opens the 11thONUS sign-up page" }),
      ).toBeVisible();
      await expect(sheet.getByText(/choose “Personal” after signing in/)).toBeVisible();
      await expectNoHorizontalOverflow(page);
      const box = (await sheet.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height + 0.5);
      await sheet.getByRole("button", { name: "Close" }).click();
      await expect(sheet).toHaveCount(0);
      await expect(fab(page)).toBeFocused();
    });

    test("Loyalty status (normal): shown above Record once the customer and programme are known; Record stays reachable", async ({
      page,
    }) => {
      await page.goto(PATH);
      await expect(page.getByTestId("counter-loyalty-progress")).toHaveCount(0);
      await page.getByLabel("Loyalty Number").fill("abc234");
      const card = page.getByTestId("counter-loyalty-progress");
      await expect(card).toBeVisible();
      await expect(card).toContainText("8 of 10 verified");
      await expect(card).toContainText("2 more verified purchases until the 11th is on us");
      await expectNoHorizontalOverflow(page);
      const cardBox = (await card.boundingBox())!;
      const recordBox = (await page
        .getByRole("button", { name: "Record purchase" })
        .boundingBox())!;
      expect(cardBox.y).toBeLessThan(recordBox.y);
      await expectAboveBottomNav(
        page,
        page.getByRole("button", { name: "Record purchase" }),
        "Record purchase",
      );
    });

    test("Loyalty status: pending is shown SEPARATELY and never as 10 of 10", async ({ page }) => {
      await page.goto(PATH);
      await page.getByLabel("Loyalty Number").fill("nea999");
      const card = page.getByTestId("counter-loyalty-progress");
      await expect(card).toContainText("9 of 10 verified");
      await expect(card).toContainText("1 purchase awaiting customer confirmation");
      await expect(card).toContainText("1 more verified purchase until the 11th is on us");
      await expect(card).not.toContainText("10 of 10");
    });

    test("Loyalty status (reward available): a prominent alert BEFORE recording; no redemption control", async ({
      page,
    }) => {
      await page.goto(PATH);
      await page.getByLabel("Loyalty Number").fill("rwd777");
      const alert = page.getByTestId("counter-loyalty-reward");
      await expect(alert).toBeVisible();
      await expect(alert).toContainText("11th reward available");
      await expect(alert).toContainText("Let the customer know their reward is ready.");
      await expect(page.getByRole("button", { name: /redeem|confirm reward/i })).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
      await expectAboveBottomNav(
        page,
        page.getByRole("button", { name: "Record purchase" }),
        "Record purchase",
      );
    });

    test("French renders without overflow: language is changed on Profile and the whole app follows", async ({
      page,
    }) => {
      await page.goto(PROFILE_PATH);
      await page.getByRole("button", { name: "Français" }).click();
      await expect(page.getByRole("heading", { name: "Profil", level: 1 })).toBeVisible();
      const frNav = page.getByRole("navigation", { name: "Navigation de la caisse" });
      await expect(frNav.getByRole("link")).toHaveText(["Caisse", "Activité", "Profil"]);
      await expect(frNav.getByRole("button", { name: "Actions rapides" })).toBeVisible();
      // Every French label fits inside its own bar cell at this width (no clipping).
      for (const link of await frNav.getByRole("link").all()) {
        const clipped = await link.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
        expect(clipped).toBe(false);
      }
      await expectNoHorizontalOverflow(page);
      await frNav.getByRole("link", { name: "Caisse" }).click();
      await expect(page.getByRole("button", { name: "Enregistrer l'achat" })).toBeVisible();
      await page.getByLabel("Numéro de fidélité").fill("abc234");
      await expect(page.getByTestId("counter-loyalty-progress")).toContainText("8 sur 10 vérifiés");
      await expectNoHorizontalOverflow(page);
      const sheet = await (async () => {
        await frNav.getByRole("button", { name: "Actions rapides" }).click();
        return page.getByRole("dialog", { name: "Actions rapides" });
      })();
      await expect(sheet.getByRole("button", { name: /^Scanner le QR du client/ })).toBeVisible();
      await expect(sheet.getByRole("button", { name: /^Aider un nouveau client/ })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });

    test("axe: no violations on the Counter with a loyalty card and on the quick-action sheets", async ({
      page,
    }) => {
      await page.goto(`${PATH}?fixture=many`);
      await expect(page.getByRole("heading", { name: "Counter", level: 1 })).toBeVisible();
      await page.getByLabel("Loyalty Number").fill("abc234");
      await page.getByRole("radio", { name: "Wash 10+1" }).check();
      await expect(page.getByTestId("counter-loyalty-progress")).toBeVisible();
      const violations = async () =>
        (await new AxeBuilder({ page }).analyze()).violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`,
        );
      expect(await violations()).toEqual([]);

      await page.getByLabel("Loyalty Number").fill("rwd777");
      await expect(page.getByTestId("counter-loyalty-reward")).toBeVisible();
      expect(await violations()).toEqual([]);

      const quick = await openQuickActions(page);
      expect(await violations()).toEqual([]);
      await quick.getByRole("button", { name: /^Help a new customer join/ }).click();
      await expect(page.getByRole("dialog", { name: "Help a new customer join" })).toBeVisible();
      expect(await violations()).toEqual([]);
    });

    test("axe: Activity and Profile have no violations", async ({ page }) => {
      for (const path of [ACTIVITY_PATH, PROFILE_PATH]) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        const results = await new AxeBuilder({ page }).analyze();
        expect(
          results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`),
        ).toEqual([]);
      }
    });
  });
}

test.describe("Staff app — camera scanner (fake capture device)", () => {
  test.use({
    viewport: { width: 375, height: 740 },
    permissions: ["camera"],
  });

  async function expectLiveThenCancel(page: Page) {
    const cancel = page.getByRole("button", { name: "Cancel scanning" });
    await expect(cancel).toBeVisible();
    await expect(cancel).toBeFocused();
    await expect(page.getByText("Point the camera at the customer's QR code.")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    // Cancel stays reachable above the Staff bottom bar.
    await expectAboveBottomNav(page, cancel, "Cancel scanning");

    const live = await page.evaluate(() => {
      const video = document.querySelector("video");
      const stream = video?.srcObject as MediaStream | null;
      return stream?.getTracks().map((track) => track.readyState) ?? [];
    });
    expect(live).toEqual(["live"]);

    // Keep a handle on the track to prove it is stopped after cancel.
    await page.evaluate(() => {
      const video = document.querySelector("video");
      (window as unknown as { __track: MediaStreamTrack }).__track = (
        video?.srcObject as MediaStream
      ).getTracks()[0];
    });
    await cancel.click();
    await expect(page.getByRole("button", { name: "Scan customer QR" })).toBeFocused();
    await expect(page.locator("video")).toHaveCount(0);
    const state = await page.evaluate(
      () => (window as unknown as { __track: MediaStreamTrack }).__track.readyState,
    );
    expect(state).toBe("ended");
  }

  test("opens a real camera stream, reports an active scanner, and cancel genuinely stops the camera", async ({
    page,
  }) => {
    await page.goto(PATH);
    await page.getByRole("button", { name: "Scan customer QR" }).click();
    await expectLiveThenCancel(page);
  });

  test("the Scan quick action, even from Profile, returns to the Counter and opens the same live scanner", async ({
    page,
  }) => {
    await page.goto(PROFILE_PATH);
    const quick = await openQuickActions(page);
    await quick.getByRole("button", { name: /^Scan customer QR/ }).click();
    await expect(page).toHaveURL(/\/dev\/counter-harness\/counter$/);
    await expectLiveThenCancel(page);
  });

  test("leaving the Counter while scanning stops the camera", async ({ page }) => {
    await page.goto(PATH);
    await page.getByRole("button", { name: "Scan customer QR" }).click();
    await expect(page.getByRole("button", { name: "Cancel scanning" })).toBeVisible();
    await page.waitForFunction(() => Boolean(document.querySelector("video")?.srcObject));
    await page.evaluate(() => {
      const video = document.querySelector("video");
      (window as unknown as { __track: MediaStreamTrack }).__track = (
        video?.srcObject as MediaStream
      ).getTracks()[0];
    });
    await bottomNav(page).getByRole("link", { name: "Activity" }).click();
    await expect(page.getByRole("heading", { name: "Activity", level: 1 })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { __track: MediaStreamTrack }).__track.readyState,
        ),
      )
      .toBe("ended");
  });

  test("axe: the open scanner view has no violations", async ({ page }) => {
    await page.goto(PATH);
    await page.getByRole("button", { name: "Scan customer QR" }).click();
    await expect(page.getByRole("button", { name: "Cancel scanning" })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`),
    ).toEqual([]);
  });
});

test.describe("Staff app — wide screen is the same phone app", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("no desktop Staff UI: no two-column Counter, no top nav, side whitespace on both sides", async ({
    page,
  }) => {
    await page.goto(PATH);
    await expect(page.getByRole("heading", { name: "Counter", level: 1 })).toBeVisible();
    const app = (await page.getByTestId("staff-app").boundingBox())!;
    expect(app.x).toBeGreaterThan(300);
    expect(1440 - (app.x + app.width)).toBeGreaterThan(300);
    const identify = (await page.getByRole("region", { name: /Identify customer/ }).boundingBox())!;
    const programme = (await page
      .getByRole("region", { name: /Programme/ })
      .first()
      .boundingBox())!;
    expect(programme.y).toBeGreaterThanOrEqual(identify.y + identify.height - 1);
    await expect(page.getByRole("navigation")).toHaveCount(1);
    await expect(bottomNav(page)).toBeVisible();
  });
});

test.describe("Staff app — dark colour scheme", () => {
  test.use({ viewport: { width: 375, height: 740 }, colorScheme: "dark" });

  test("remains readable and overflow-free", async ({ page }) => {
    await page.goto(PATH);
    await expect(page.getByRole("button", { name: "Record purchase" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
