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

    test("the Staff shell is a top bar with only the Counter and a context switch (no admin links, no bottom bar)", async ({
      page,
    }) => {
      await page.goto(PATH);
      const nav = page.getByRole("navigation", { name: "Counter navigation" });
      await expect(nav.getByRole("link")).toHaveCount(2);
      await expect(page.getByRole("link", { name: "Team" })).toHaveCount(0);
      const box = await nav.boundingBox();
      expect(box!.y).toBeLessThan(200);
      await expectTapTargets(page, []);
    });

    test("the Record action stays in view while the page scrolls (sticky, safe-area aware)", async ({
      page,
    }) => {
      await page.goto(`${PATH}?fixture=many`);
      await page.mouse.wheel(0, 400);
      const box = await page.getByRole("button", { name: "Record purchase" }).boundingBox();
      const viewport = page.viewportSize()!;
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
      expect(box!.y).toBeGreaterThanOrEqual(0);
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
      await page.getByRole("button", { name: "Français" }).click();
      await expect(page.getByRole("button", { name: "Enregistrer l'achat" })).toBeVisible();
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
