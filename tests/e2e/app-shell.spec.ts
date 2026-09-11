import { expect, test } from "@playwright/test";

// `/` is the `PRODUCT-ALIGN-002` root-route resolver (`RootEntry`): for an
// unauthenticated browser session it renders the real sign-in surface
// (`SignInPage`). This replaces the old literal "11thONUS — Engineering
// Foundation" placeholder heading assertion, which asserted the `AppShell`
// stub `PRODUCT-ALIGN-002` removed from `/`.
test("application shell loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});
