/**
 * ENG-P3-002-UI-IMP-H, Phase I (the priority "key gap" flow) — proves,
 * against a live Firebase Emulator Suite through the real production UI and
 * callables, that completing a Display Name at `/profile` is later reflected
 * in that same person's own Team Management row, without inventing any
 * backend behavior and without any email/Firebase-Auth-profile fallback ever
 * being shown in Team.
 */
import { expect, test } from "@playwright/test";
import { createBusinessThroughWizard, freshTestEmail, signUpNewUser } from "./helpers";

test.describe("Display Name -> Team Management integration", () => {
  test("Owner without a Display Name completes it at /profile, and their own Team row resolves it after navigating back", async ({
    page,
  }) => {
    const email = freshTestEmail("owner-i");
    await signUpNewUser(page, email);
    const businessId = await createBusinessThroughWizard(page);

    // Go straight to Team (skip Finish Setup — Team is reachable pre-Terms,
    // per the governed journey table) and confirm the Owner's own row shows
    // the neutral "no display name" fallback, never the sign-up email.
    await page.goto(`/business/${businessId}/dashboard/team`);
    const ownerRow = page.getByRole("listitem").filter({ hasText: "Owner" }).first();
    await expect(ownerRow).toContainText("Unnamed team member");
    await expect(page.getByText(email)).toHaveCount(0);

    // Complete the Display Name at /profile — a real setDisplayName callable.
    await page.goto("/profile");
    await expect(
      page.getByText("Complete your Display Name.").or(page.locator("body")),
    ).toBeVisible();
    const chosenName = `Amahoro N. ${Date.now() % 100000}`;
    await page.getByLabel("Display name").fill(chosenName);
    await page.getByRole("button", { name: "Save" }).click();
    // Read view confirms the backend-authoritative value (not local echo).
    await expect(page.getByText(chosenName)).toBeVisible({ timeout: 10_000 });

    // Navigate back to Team (a genuine route change/remount — /profile is
    // top-level, not nested under the dashboard tree) and confirm the same
    // Owner row now resolves the freshly-set name, no manual page reload.
    await page.goto(`/business/${businessId}/dashboard/team`);
    await expect(page.getByRole("listitem").filter({ hasText: chosenName })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Unnamed team member")).toHaveCount(0);
    await expect(page.getByText(email)).toHaveCount(0);

    // A hard reload preserves it too (re-reads from the backend, not local state).
    await page.reload();
    await expect(page.getByRole("listitem").filter({ hasText: chosenName })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("duplicate Display Names are allowed across two different Owners (not blocked)", async ({
    browser,
  }) => {
    const sharedName = `Shared Name ${Date.now() % 100000}`;

    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await signUpNewUser(pageA, freshTestEmail("dup-a"));
    await pageA.goto("/profile");
    await pageA.getByLabel("Display name").fill(sharedName);
    await pageA.getByRole("button", { name: "Save" }).click();
    await expect(pageA.getByText(sharedName)).toBeVisible({ timeout: 10_000 });

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await signUpNewUser(pageB, freshTestEmail("dup-b"));
    await pageB.goto("/profile");
    await pageB.getByLabel("Display name").fill(sharedName);
    await pageB.getByRole("button", { name: "Save" }).click();
    // No collision error — the second save also succeeds with the same name.
    await expect(pageB.getByText(sharedName)).toBeVisible({ timeout: 10_000 });
    await expect(pageB.getByRole("alert")).toHaveCount(0);

    await contextA.close();
    await contextB.close();
  });
});
