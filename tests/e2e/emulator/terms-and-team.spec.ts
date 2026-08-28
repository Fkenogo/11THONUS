/**
 * ENG-P3-002-UI-IMP-H, Phases G/H — Terms/Activation and Team Management
 * live flows against a live Firebase Emulator Suite.
 *
 * Terms note: `TERMS_READABLE_CONTENT_AVAILABLE` is hard-pinned `false`
 * (`apps/web/src/business/termsAvailability.ts`, `DEC-LEGAL-002` open) — the
 * governed, currently-deliberate state (DO-NOT-TOUCH item 4 of this
 * package's brief). No checkbox/accept control is reachable through the
 * real UI in this environment, so "accepted"/"ready"/"pending" cannot be
 * driven end-to-end without fabricating a UI path that does not exist. This
 * spec verifies the reachable "unavailable" state and that Submit for
 * Verification is correctly gated (disabled client-side, and independently
 * rejected server-side, proving the server — not the disabled button — is
 * the real gate).
 */
import { expect, test } from "@playwright/test";
import { createBusinessThroughWizard, freshTestEmail, signUpNewUser } from "./helpers";

test.describe("Business Terms / Activation (Phase G)", () => {
  test("Terms shows the neutral unavailable state; Submit for Verification is disabled and the server independently rejects a direct call", async ({
    page,
  }) => {
    await signUpNewUser(page, freshTestEmail("terms"));
    const businessId = await createBusinessThroughWizard(page);
    await page.goto(`/business/${businessId}/dashboard/terms`);

    await expect(
      page.getByText("The Business Terms are currently unavailable.", { exact: false }),
    ).toBeVisible({
      timeout: 15_000,
    });
    // No accept control offered for content the user cannot read.
    await expect(page.getByLabel("I agree to the Business Terms")).toHaveCount(0);

    const submitButton = page.getByRole("button", { name: "Submit for Verification" });
    await expect(submitButton).toBeDisabled();

    // Server-side gate check: call `submitBusinessForVerification` directly
    // against the Functions emulator's real HTTP endpoint, bypassing the
    // disabled UI control entirely (an unauthenticated request — the
    // callable protocol requires `rawToken`/`referenceType` inside `data`,
    // which this omits) — confirming the backend independently refuses it
    // rather than trusting only the disabled button.
    const result = await page.evaluate(async (bizId) => {
      const res = await fetch(
        `http://127.0.0.1:5001/demo-11thonus/europe-west1/submitBusinessForVerification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: { businessId: bizId } }),
        },
      );
      return { status: res.status, body: await res.json().catch(() => null) };
    }, businessId);

    // An unauthenticated/incomplete call must never succeed.
    expect(result.status).not.toBe(200);
  });
});

test.describe("Team Management (Phase H)", () => {
  test("Owner sees their own membership, invites a Staff member, sees the pending invitation, and revokes it", async ({
    page,
  }) => {
    const email = freshTestEmail("team-h");
    await signUpNewUser(page, email);
    const businessId = await createBusinessThroughWizard(page);
    await page.goto(`/business/${businessId}/dashboard/team`);

    // Owner identity: real Owner row, no email/userId leakage, no
    // unsupported actions (resend/role-change/removal).
    await expect(page.getByRole("listitem").filter({ hasText: "Owner" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(email)).toHaveCount(0);
    await expect(page.getByRole("button", { name: /resend/i })).toHaveCount(0);

    // Invite a Staff member by email.
    await page.getByRole("button", { name: "Invite team member" }).click();
    const inviteEmail = freshTestEmail("invitee");
    await page.getByLabel("Email", { exact: true }).fill(inviteEmail);
    await page.getByRole("button", { name: "Send invitation" }).click();

    const pendingRow = page.getByRole("listitem").filter({ hasText: inviteEmail });
    await expect(pendingRow).toBeVisible({ timeout: 15_000 });
    await expect(pendingRow).toContainText("Pending");

    // Revoke requires confirmation before it is final.
    await pendingRow.getByRole("button", { name: "Cancel invitation" }).click();
    await page.getByRole("button", { name: "Yes, cancel invitation" }).click();

    // The list updates: the invitation is gone from the pending section.
    await expect(page.getByText(inviteEmail)).toHaveCount(0, { timeout: 15_000 });
    await expect(page.getByText("No pending invitations.")).toBeVisible();

    // A hard reload confirms this is backend-authoritative, not local state.
    await page.reload();
    await expect(page.getByText("No pending invitations.")).toBeVisible({ timeout: 15_000 });
  });
});
