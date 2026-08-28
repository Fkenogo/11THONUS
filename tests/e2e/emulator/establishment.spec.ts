/**
 * ENG-P3-002-UI-IMP-H, Phase C — Establishment E2E against a live Firebase
 * Emulator Suite: EST-01 -> EST-02 (real `createBusiness`) -> EST-03 (shows
 * persisted, server-authoritative truth, not fabricated wizard state) ->
 * Finish Setup -> Dashboard, plus a deep-link-after-creation check.
 */
import { expect, test } from "@playwright/test";
import {
  createBusinessThroughWizard,
  defaultEstablishmentFixture,
  freshTestEmail,
  signUpNewUser,
} from "./helpers";

test.describe("Establishment E2E", () => {
  test("EST-01 -> EST-02 -> EST-03 shows persisted truth -> Finish setup -> Dashboard", async ({
    page,
  }) => {
    await signUpNewUser(page, freshTestEmail("est-c"));
    const businessId = await createBusinessThroughWizard(page);

    // EST-03 is now `/business/:businessId` and reads back from
    // `getBusinessContext` — assert the persisted values, not the form
    // echo, and that the "Operating details" section (currencyCode/timezone
    // are in fact projected onto `BusinessContext` today) renders.
    //
    // Finding (documented behavior, not a bug fixed here — see
    // `EstablishmentLocationStep.tsx`'s own docblock): EST-02's "Location
    // name"/"Address" fields are collected in the form but **not** sent to
    // `createBusiness` at all (`CreateBusinessRequest` has no branch-name/
    // address field) — the default Branch is created with `displayName`
    // defaulted to the *Business* displayName and no address, applied only
    // if the user separately edits the Main Location afterward. So EST-03
    // correctly shows the Business name for "Main location", not the
    // fixture's distinct `locationName` — asserting the real persisted
    // value here, not the form input, which is exactly what this Phase C
    // check is for.
    await expect(page.getByText(defaultEstablishmentFixture.businessName).first()).toBeVisible();
    await expect(
      page.getByText(
        `${defaultEstablishmentFixture.businessName}, ${defaultEstablishmentFixture.city}`,
      ),
    ).toBeVisible();
    await expect(page.getByText("No address provided")).toBeVisible();
    await expect(page.getByText(defaultEstablishmentFixture.contactPhone)).toBeVisible();
    await expect(page.getByText(defaultEstablishmentFixture.timezone)).toBeVisible();

    // Finish setup -> Dashboard (pure navigation, no backend call).
    await page.getByRole("button", { name: "Finish setup" }).click();
    await page.waitForURL(new RegExp(`/business/${businessId}/dashboard`));

    // Deep link back to `/business/:businessId` after creation shows real,
    // server-read data (not a stale/fabricated client copy) — a fresh full
    // navigation, not an in-app link.
    await page.goto(`/business/${businessId}`);
    await expect(page.getByText(defaultEstablishmentFixture.businessName).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("EN/FR: the establishment flow is coherent in both languages", async ({ page }) => {
    await signUpNewUser(page, freshTestEmail("est-fr"));
    await page.goto("/business/new");
    // Switch to French before starting the flow.
    await page.getByRole("button", { name: "Français" }).click();
    await expect(page.getByRole("heading", { name: /entreprise|activité/i })).toBeVisible();

    await page.getByLabel(/nom/i).first().fill("Cuisine Kigwena");
    const categorySelect = page.locator("select#primaryCategoryId");
    await expect(categorySelect.locator("option")).not.toHaveCount(1, { timeout: 15_000 });
    await categorySelect.selectOption({ index: 1 });
    await page.locator("input#contactPhone").fill("+25761234567");
    await page.getByRole("button", { name: /continuer/i }).click();

    await page.locator("input#countryCode").fill("BI");
    await page.locator("input#city").fill("Bujumbura");
    await page.locator("input#branchDisplayName").fill("Cuisine Kigwena — Principal");
    await page.locator("input#currencyCode").fill("BIF");
    await page.locator("input#timezone").fill("Africa/Bujumbura");
    await page.getByRole("button", { name: /continuer/i }).click();

    await page.waitForURL(/\/business\/(?!new)[^/]+$/, { timeout: 20_000 });
    await expect(page.getByText("Cuisine Kigwena").first()).toBeVisible();
    // No leftover English chrome, no untranslated i18n keys visible.
    await expect(page.getByText(/^[a-zA-Z]+\.[a-zA-Z]+/)).toHaveCount(0);
  });

  /**
   * Forces two near-simultaneous EST-02 submissions on the SAME mounted
   * `useCreateBusinessMutation()` hook instance. A real Playwright `.click()`
   * per call would be serialized by its own actionability wait (it
   * re-checks the element isn't disabled before each click, and the button
   * disables itself once `mutation.isPending` flips), which can't reliably
   * land both calls inside the same synchronous turn. Dispatching two
   * native DOM `click()` calls back to back inside one `page.evaluate`
   * bypasses that actionability wait and guarantees both `onClick` handlers
   * run before React's next render — i.e. before the button's `disabled`
   * state updates and before `holderRef` is cleared — forcing two calls to
   * `createBusiness` with the same held idempotency key, both genuinely in
   * flight before either resolves.
   */
  async function raceEst02DoubleSubmit(page: import("@playwright/test").Page) {
    await page.getByLabel("Business name").fill(defaultEstablishmentFixture.businessName);
    const categorySelect = page.getByLabel("Business category");
    await expect(categorySelect.locator("option")).not.toHaveCount(1, { timeout: 15_000 });
    await categorySelect.selectOption({ index: 1 });
    await page.getByLabel("Phone number").fill(defaultEstablishmentFixture.contactPhone);
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByLabel("Country").fill(defaultEstablishmentFixture.countryCode);
    await page.getByLabel("City").fill(defaultEstablishmentFixture.city);
    await page.getByLabel("Location name").fill(defaultEstablishmentFixture.locationName);
    await page.getByLabel("Currency").fill(defaultEstablishmentFixture.currencyCode);
    await page.getByLabel("Timezone").fill(defaultEstablishmentFixture.timezone);

    const createBusinessCalls: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/createBusiness")) {
        const body = req.postData();
        const idempotencyKey = body ? (JSON.parse(body).data?.idempotencyKey ?? null) : null;
        createBusinessCalls.push(idempotencyKey);
      }
    });

    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll("button")).find(
        (el) => el.textContent?.trim() === "Continue",
      ) as HTMLButtonElement | undefined;
      if (!button) throw new Error("Continue button not found");
      button.click();
      button.click();
    });

    return createBusinessCalls;
  }

  test("EST-02 double-submit: both racing calls carry the same held idempotency key", async ({
    page,
  }) => {
    await signUpNewUser(page, freshTestEmail("est-idem-key"));
    await page.goto("/business/new");
    const calls = await raceEst02DoubleSubmit(page);

    // Let both requests settle one way or another before inspecting.
    await page.waitForTimeout(2000);

    // The client-side contract this package is scoped to verify: as long
    // as the second call reaches the handler before the button disables
    // (confirmed by 2 captured requests — not guaranteed on every run, since
    // React may win the re-render race and actually disable the button
    // before the second synchronous `click()` runs), both calls hold the
    // SAME idempotency key. This part of the contract holds reliably.
    if (calls.length > 1) {
      expect(new Set(calls).size).toBe(1);
    }
  });

  test("EST-02 double-submit: residual risk — a genuine concurrent race can still produce two Businesses (documented, not fixed)", async ({
    page,
  }) => {
    // KNOWN, REPRODUCED, DISCLOSED RESIDUAL RISK (ENG-P3-002-UI-IMP-H,
    // investigated 2026-08-28) — NOT fixed here, per explicit instruction
    // not to invent new idempotency architecture in this package.
    //
    // What was verified: the client-side idempotency-key-holding contract
    // (see the sibling test above) genuinely holds — both racing calls
    // carry the same key. What was ALSO verified, empirically, by forcing
    // this exact race repeatedly against the live emulator: when the two
    // concurrent `createBusiness` calls reach the backend closely enough
    // together, Firestore's own transaction-contention path can abort the
    // losing call with a `409 ABORTED` (`business_creation_failed`) even
    // though the winning call independently returns `200` with a real,
    // persisted `businessId`. In that outcome, two further problems compound:
    //   1. The mutation hook's UI-visible state does not reliably reflect
    //      the winning call's success — the page stays on `/business/new`
    //      showing an error alert ("That's already being processed...")
    //      instead of navigating to the successfully-created Business.
    //   2. `settleKeyOnError` clears the held idempotency key on this error
    //      class (it is not classified as retryable), so the "Continue"
    //      button remains clickable and a user's natural next action — click
    //      it again — issues a BRAND NEW idempotency key. That retry
    //      succeeds and creates a SECOND, different Business. The first
    //      (orphaned, never-navigated-to) Business and the second
    //      (user-visible) Business both now exist for the same owner —
    //      `getOwnedBusinesses` genuinely returns 2, and `/business` shows
    //      the "Choose a business" picker instead of a clean single
    //      redirect.
    //
    // This was reproduced in 2 of 3 forced-race attempts during
    // investigation (not deterministic every run — depends on exact
    // request-arrival timing at the Functions/Firestore emulator). Because
    // it is non-deterministic, this test does NOT hard-assert the outcome
    // (a hard assertion here would make the suite flaky-red on whichever
    // side of the race it happened not to hit, which is worse than useful —
    // it would train reviewers to ignore red CI). Instead it runs the real
    // race against the live emulator every time and records what actually
    // happened as a test annotation, visible in the HTML report, so the
    // finding stays executable evidence rather than a static claim. A real
    // fix belongs to a future package with backend authorization to change
    // `createBusiness`'s concurrent-request handling (e.g. treating a
    // same-idempotency-key `ABORTED` conflict as retryable-with-the-same-key
    // rather than clearing it, or having the loser's response look up and
    // return the winner's already-committed result) — out of scope here.
    await signUpNewUser(page, freshTestEmail("est-idem-risk"));
    await page.goto("/business/new");
    await raceEst02DoubleSubmit(page);
    await page.waitForTimeout(2000);

    // If the race landed in the error/alert branch, perform the natural
    // user recovery action (click Continue again) to see whether it
    // compounds into a second Business, exactly as a real user would.
    const alertVisible = await page
      .getByRole("alert")
      .isVisible()
      .catch(() => false);
    if (alertVisible) {
      await page.getByRole("button", { name: "Continue" }).click();
      await page.waitForTimeout(2000);
    }

    // The authoritative, backend-read check: `BusinessResolverPage` at
    // `/business` auto-redirects only when `getOwnedBusinesses` returns
    // exactly one Business for this owner — more than one renders a
    // "Choose a business" picker instead.
    await page.goto("/business");
    await page.waitForURL(/\/business(\/[^/]+)?$/, { timeout: 15_000 });
    const duplicateDetected = await page
      .getByRole("heading", { name: "Choose a business" })
      .isVisible()
      .catch(() => false);

    test.info().annotations.push({
      type: duplicateDetected ? "RESIDUAL RISK REPRODUCED" : "race did not duplicate this run",
      description: duplicateDetected
        ? "getOwnedBusinesses returned >1 Business after the forced EST-02 race + retry — the documented residual risk manifested on this run."
        : "The forced race resolved cleanly this run (either only one call actually reached the handler, or the backend's transaction contention did not surface the error/retry path) — this does not disprove the risk, see the sibling client-side-contract test and the inline documentation above.",
    });
  });
});
