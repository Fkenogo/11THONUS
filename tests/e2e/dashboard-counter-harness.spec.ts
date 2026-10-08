/**
 * Real-browser regression for the Staff Counter (`EA-BL-001-CORR-002-B`) — proves what jsdom cannot:
 * actual phone-first Tailwind layout, no horizontal overflow down to 320px, real tap-target sizes,
 * the two-column desktop adaptation, the scanner view driven by a real (fake-device) camera stream
 * with the camera genuinely closed on cancel, and axe accessibility. Runs against
 * `/dev/counter-harness` (development-only, never shipped), which mounts the REAL `StaffShell` +
 * `CounterPage` on local fixture data — no Firebase, no network.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PATH = "/dev/counter-harness";

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

/** The bar's top edge: nothing the Staff needs may extend below it. */
async function bottomNavTop(page: Page) {
  const box = await bottomNav(page).boundingBox();
  expect(box, "bottom navigation").not.toBeNull();
  return box!.y;
}

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

async function expectAboveBottomNav(
  page: Page,
  locator: ReturnType<Page["locator"]>,
  label: string,
) {
  await waitForScrollIdle(page);
  const box = await locator.boundingBox();
  expect(box, label).not.toBeNull();
  expect(box!.y + box!.height, `${label} must not sit under the bottom bar`).toBeLessThanOrEqual(
    (await bottomNavTop(page)) + 0.5,
  );
}

for (const width of [320, 375, 390]) {
  test.describe(`Counter — phone ${width}px`, () => {
    test.use({ viewport: { width, height: 740 } });

    test("single programme: no horizontal overflow; scan, number and Record are prominent and reachable", async ({
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
      // One column: the Record action sits below the identify card, never beside it.
      const identify = await page.getByRole("region", { name: /Identify customer/ }).boundingBox();
      const record = await page.getByRole("button", { name: "Record purchase" }).boundingBox();
      expect(identify && record && record.y > identify.y).toBe(true);
    });

    test("many programmes and items with long names still fit the phone width", async ({
      page,
    }) => {
      await page.goto(`${PATH}?fixture=many`);
      await expect(page.getByRole("radio", { name: /Premium Cut Circle/ })).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await page.getByRole("radio", { name: "Family Care Circle" }).check();
      // More than six items collapse to a single, large select rather than a long list.
      await expect(page.getByLabel("Item")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });

    test("Staff mobile shell: Business name, a fixed bottom bar with exactly four icon+label actions, no duplicated top controls", async ({
      page,
    }) => {
      await page.goto(PATH);
      await expect(page.getByText("Bella Salon", { exact: true }).first()).toBeVisible();
      const nav = bottomNav(page);
      await expect(nav).toBeVisible();
      await expect(nav.getByRole("button")).toHaveText([
        "Counter",
        "New customer",
        "Activity",
        "More",
      ]);
      await expect(page.getByRole("link", { name: "Team" })).toHaveCount(0);
      // Secondary controls moved into More: not duplicated in the header.
      await expect(page.getByRole("button", { name: "Français" })).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Switch business or Personal" })).toHaveCount(0);
      // Fixed to the bottom edge, full width, practical touch targets, never clipped.
      const box = (await nav.boundingBox())!;
      const viewport = page.viewportSize()!;
      expect(Math.round(box.y + box.height)).toBe(viewport.height);
      expect(box.width).toBeGreaterThanOrEqual(viewport.width - 1);
      for (const name of ["Counter", "New customer", "Activity", "More"]) {
        const target = (await nav.getByRole("button", { name }).boundingBox())!;
        expect(target.height, name).toBeGreaterThanOrEqual(44);
        expect(target.width, name).toBeGreaterThanOrEqual(44);
        expect(target.x, name).toBeGreaterThanOrEqual(0);
        expect(target.x + target.width, name).toBeLessThanOrEqual(viewport.width);
      }
      await expectNoHorizontalOverflow(page);
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
      const record = (await page.getByRole("button", { name: "Record purchase" }).boundingBox())!;
      expect(record.y).toBeGreaterThanOrEqual(0);
    });

    test("scrolled to the very end, the last Activity row is fully visible above the bottom bar", async ({
      page,
    }) => {
      await page.goto(PATH);
      const rows = page
        .getByRole("region", { name: "Your recent submissions" })
        .getByRole("listitem");
      await expect(rows.last()).toBeVisible();
      await page.evaluate(() =>
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
      );
      await expectAboveBottomNav(page, rows.last(), "last Activity row");
    });

    test("Counter / New customer / Activity move within the one Counter page: no navigation, state kept", async ({
      page,
    }) => {
      await page.goto(PATH);
      const url = page.url();
      await page.getByLabel("Loyalty Number").fill("abc234");
      const nav = bottomNav(page);

      await nav.getByRole("button", { name: "New customer" }).click();
      await expect(page.getByRole("button", { name: /New customer\?/ })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await expect(page.getByRole("heading", { name: "New customer" })).toBeFocused();
      await expect(page.getByRole("img", { name: /sign-up page/ })).toBeVisible();
      await expect(nav.getByRole("button", { name: "New customer" })).toHaveAttribute(
        "aria-current",
        "true",
      );
      // The jump lands on the panel heading, in view and clear of the bar…
      await expectAboveBottomNav(
        page,
        page.getByRole("heading", { name: "New customer" }),
        "New customer heading",
      );
      // …and the end of the revealed panel can be scrolled fully clear of the bar.
      await page.evaluate(() =>
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
      );
      await expectAboveBottomNav(page, page.getByText(/choose “Personal”/), "dual-role note");

      await nav.getByRole("button", { name: "Activity" }).click();
      await expect(page.getByRole("heading", { name: "Your recent submissions" })).toBeFocused();
      await expect(nav.getByRole("button", { name: "Activity" })).toHaveAttribute(
        "aria-current",
        "true",
      );

      await nav.getByRole("button", { name: "Counter" }).click();
      await expect(page.getByRole("heading", { name: "Counter", level: 1 })).toBeFocused();
      await expect(page.getByLabel("Loyalty Number")).toHaveValue("ABC234");
      await expect(nav.getByRole("button", { name: "Counter" })).toHaveAttribute(
        "aria-current",
        "true",
      );
      // No route change and no extra history entries: Back keeps its normal meaning.
      expect(page.url()).toBe(url);
      expect(await page.evaluate(() => window.history.length)).toBeLessThanOrEqual(2);
    });

    test("More: language + Switch Business / Personal only; Escape closes and returns focus to More", async ({
      page,
    }) => {
      await page.goto(PATH);
      const more = bottomNav(page).getByRole("button", { name: "More" });
      await more.click();
      const dialog = page.getByRole("dialog", { name: "More options" });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("button", { name: "Français" })).toBeVisible();
      await expect(dialog.getByRole("link")).toHaveText(["Switch business or Personal"]);
      for (const target of [
        dialog.getByRole("button", { name: "Français" }),
        dialog.getByRole("link"),
        dialog.getByRole("button", { name: "Close" }),
      ]) {
        expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      await expectNoHorizontalOverflow(page);
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(more).toBeFocused();
    });

    test("new-customer panel: static sign-up QR and address fit; dual-role copy is present", async ({
      page,
    }) => {
      await page.goto(PATH);
      await page.getByRole("button", { name: /New customer\?/ }).click();
      await expect(
        page.getByRole("img", { name: "QR code that opens the 11thONUS sign-up page" }),
      ).toBeVisible();
      await expect(page.getByText(/choose “Personal” after signing in/)).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });

    test("recent submissions fit with long item names and show neutral status only", async ({
      page,
    }) => {
      await page.goto(PATH);
      const section = page.getByRole("region", { name: "Your recent submissions" });
      await expect(section.getByText("Awaiting business review")).toBeVisible();
      await expect(section).not.toContainText(/threshold|reviewer/i);
      await expectNoHorizontalOverflow(page);
    });

    test("French renders without overflow", async ({ page }) => {
      await page.goto(PATH);
      await bottomNav(page).getByRole("button", { name: "More" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Français" }).click();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Enregistrer l'achat" })).toBeVisible();
      const frNav = page.getByRole("navigation", { name: "Navigation de la caisse" });
      await expect(frNav.getByRole("button")).toHaveText([
        "Caisse",
        "Nouveau client",
        "Activité",
        "Plus",
      ]);
      // Every French label fits inside its own bar cell at this width (no clipping).
      for (const button of await frNav.getByRole("button").all()) {
        const clipped = await button.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
        expect(clipped).toBe(false);
      }
      await expectNoHorizontalOverflow(page);
    });

    test("axe: no accessibility violations (light) on the Counter and the new-customer panel", async ({
      page,
    }) => {
      await page.goto(`${PATH}?fixture=many`);
      await expect(page.getByRole("heading", { name: "Counter", level: 1 })).toBeVisible();
      await page.getByRole("button", { name: /New customer\?/ }).click();
      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`),
      ).toEqual([]);
    });

    test("axe: the bottom bar and the open More sheet have no violations", async ({ page }) => {
      await page.goto(PATH);
      await expect(bottomNav(page)).toBeVisible();
      let results = await new AxeBuilder({ page }).analyze();
      expect(results.violations.map((v) => v.id)).toEqual([]);
      await bottomNav(page).getByRole("button", { name: "More" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`),
      ).toEqual([]);
    });
  });
}

test.describe("Counter — camera scanner (fake capture device)", () => {
  test.use({
    viewport: { width: 375, height: 740 },
    permissions: ["camera"],
  });

  test("opens a real camera stream, reports an active scanner, and cancel genuinely stops the camera", async ({
    page,
  }) => {
    await page.goto(PATH);
    await page.getByRole("button", { name: "Scan customer QR" }).click();
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

test.describe("Counter — desktop adaptation", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("adapts to two columns: Identify beside Programme/Record; the sticky bar becomes inline", async ({
    page,
  }) => {
    await page.goto(PATH);
    await expectNoHorizontalOverflow(page);
    const identify = await page.getByRole("region", { name: /Identify customer/ }).boundingBox();
    const programme = await page
      .getByRole("region", { name: /Programme/ })
      .first()
      .boundingBox();
    expect(identify && programme && programme.x > identify.x + identify.width - 1).toBe(true);
    const record = await page.getByRole("button", { name: "Record purchase" }).boundingBox();
    expect(record!.width).toBeLessThan(800);
  });

  test("axe: no violations on desktop", async ({ page }) => {
    await page.goto(PATH);
    await expect(page.getByRole("heading", { name: "Counter", level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`),
    ).toEqual([]);
  });
});

test.describe("Counter — dark colour scheme", () => {
  test.use({ viewport: { width: 375, height: 740 }, colorScheme: "dark" });

  test("remains readable and overflow-free", async ({ page }) => {
    await page.goto(PATH);
    await expect(page.getByRole("button", { name: "Record purchase" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
