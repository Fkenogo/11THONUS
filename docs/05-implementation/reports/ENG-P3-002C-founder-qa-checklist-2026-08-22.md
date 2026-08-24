> **Title:** ENG-P3-002C — Founder QA Checklist (Business Onboarding)
> **Status:** Not yet executed. This is a checklist to run, not a record of a run.
> **2026-08-24 (`ENG-P3-002C-PREVIEW-001-RECOVERY-001`) — hosted preview is now up and App Check is
> validated; a NEW, separate blocker limits what you can currently test:**
> **Preview URL:** `https://eleventh-on-us-dev--eng-p3-002c-founder-qa-8lho2gn4.web.app`
> **Sign-in entry:** `/dev/founder-qa-sign-in` on that URL.
> **Channel:** `eng-p3-002c-founder-qa` · **Project:** `eleventh-on-us-dev` · **Expires:**
> 2026-08-31 11:15 · **Deployed source SHA:** `c582ae9e535e68620fdaedbd0d2f4f6a43e1d158`.
> **App Check:** validated working — the app boots, reCAPTCHA loads, and a valid App Check token is
> obtained, confirmed under a genuinely fresh browser session with the actual CSP enforced (not
> merely its absence). The original boot failure and the subsequent CSP block are both resolved.
> **Login:** email `founder-qa-appcheck002@11thonus-dev-preview.test` — ask the engineering session
> for the current password separately; it is never written in this or any persistent document.
> **NEW blocker found during verification — Business creation is currently broken for everyone,
> unrelated to App Check:** submitting the "Tell us about your business" form always fails with
> "Something about that wasn't valid" (the governed error banner works correctly; this is not a raw
> error). Root cause: the backend's `createBusiness` callable requires a `supportedLanguages` field
> the frontend never sends. **This blocks checklist items 2 onward** (everything that needs an
> existing Business) until a separate correction lands — provisionally tracked as
> `ENG-P3-002B-CORR-SUPPORTEDLANGUAGES-001`. You can still exercise: sign-in (item 1), the `/business`
> resolver redirecting to the New Business form, the Business Category list populating from the
> seeded Commerce Knowledge data, and EN/FR/mobile rendering on that one page.
> **Known, separate, non-blocking finding:** direct visits to `/dev/founder-qa-sign-in` (the URL
> above) currently receive no Content-Security-Policy header at all from Hosting — harmless (nothing
> is blocked either way) but tracked as `ENG-HOSTING-CSP-COVERAGE-001` for a future hardening pass.
> Full detail in the
> [deployment report](ENG-P3-002C-PREVIEW-001-business-onboarding-dev-preview-deployment-report-2026-08-23.md).
>
> ---
> **2026-08-23 (`ENG-P3-002C-PREVIEW-001-DEPLOY-001`) — hosted preview deployed but currently BLOCKED, do not attempt yet (superseded above):**
> a real DEV Hosting preview channel now exists —
> `https://eleventh-on-us-dev--eng-p3-002c-founder-qa-8lho2gn4.web.app`
> (channel `eng-p3-002c-founder-qa`, project `eleventh-on-us-dev`, expires 2026-08-30, built from
> reviewed `origin/main` `948b0498b20a67921fa947aeac9f6cc979626d4c`) — but the whole app currently
> fails to boot on it: Firebase App Check initialization throws
> (`App Check site key is required outside development`) before React ever renders, because no
> `europe-west1` App Check site key is configured for `eleventh-on-us-dev` and the
> `founder-qa-preview` build mode reuses the ordinary `main.tsx` bootstrap (which requires App
> Check outside dev), unlike the isolated `sign-in-preview.html` build which deliberately avoids
> it. See the
> [deployment report](ENG-P3-002C-PREVIEW-001-business-onboarding-dev-preview-deployment-report-2026-08-23.md)
> for full detail. **Do not attempt this checklist against that URL until a correction is reviewed
> and redeployed** — the page will be blank.
> **Prerequisite (pre-existing, still true for now):** run this checklist against a local `pnpm dev` + `firebase emulators:start` session until the hosted preview is unblocked.
> **Reconciled 2026-08-23** (`ENG-P2-004-CORR-003`): item (1) below is corrected — Owner Staff invitation during `draft`/`pending_verification` onboarding now succeeds (checklist item 10 updated accordingly). Items (2) and (3) are unaffected and still apply.
> **Known, already-disclosed limitations** (do not re-report these as new findings — they are recorded in the closure report): ~~(1) Team → Invite will always fail with a visible "you don't have permission" message for any Business still in `draft` — this is real, reported, not yet fixed.~~ (1) Team → Invite now succeeds for the Owner while the Business is still `draft`/`pending_verification` (`ENG-P2-004-CORR-003`) — a Manager still cannot be newly granted `staff.manage` in those statuses, since `staff.assignPermissions` still requires `trial`/`active`; this is an accepted, documented consequence, not a bug to report. (2) There is no production sign-in route yet — reach `/business` via the dev-only sign-in harness or by signing in through the emulator directly. (3) Terms acceptance will always show "currently unavailable" — this is correct, designed behavior, not a bug to report.

## Checklist

1. **Sign in / enter Business area.** Authenticate (via the dev harness or emulator), navigate to `/business`. *Expected:* redirected to `/business/new` (no Business yet).
2. **Create Business.** Fill every field, submit. *Expected:* lands on `/business/:businessId`, wizard opens at the Classification step.
3. **Resume.** Reload the page mid-wizard. *Expected:* same step (or later, if something was already saved), not reset to step 1, not lost.
4. **Edit Business.** Confirm the created Business's name/details are reflected correctly in Review later.
5. **Category.** Select a Category from the real list (not hardcoded). Confirm it persists after Continue.
6. **Optional Type.** If the selected Category has Types, confirm they're selectable and optional; if none, confirm a plain "no types available" message, not an error.
7. **Branch.** Edit the main-location fields, confirm they save.
8. **Terms — unavailable behavior.** Confirm: no checkbox, no accept button, a plain "Terms are currently unavailable" message, and Continue/Submit stay disabled. Confirm no legal text, no URL, nothing resembling real Terms content appears anywhere.
9. **Team — skip.** Confirm "Skip for now" always works regardless of any invite attempt.
10. **Staff invitation.** As the Owner, attempt to invite someone (while the Business is still `draft`, before Terms/submission). *Expected (reconciled 2026-08-23):* the invitation succeeds and appears in the Staff/Team list — this is now correct, governed behavior (`ENG-P2-004-CORR-003`), not a denial. If instead you see a "you don't have permission" message here, that is a regression and should be reported as a new finding.
11. **Refresh** at every step of the wizard — confirm no lost progress, no crash.
12. **Review.** Confirm the review screen accurately reflects what was actually entered (name, category, location) and shows Terms as not accepted.
13. **Submission boundary.** Confirm Submit stays disabled while Terms are unavailable — there is currently no way to reach `pending_verification` through the real UI until Terms content exists. This is expected, not a bug.
14. **`pending_verification` state** — if test-only Terms configuration is available in your environment (backend engineering evidence only, never customer-facing), confirm that after a successful submission the Business shows a clear "submitted — pending verification" state, not a raw status string.
15. **English.** Walk the whole reachable flow in English — check for any awkward, missing, or backend-jargon-sounding text.
16. **French.** Switch language, repeat — check for missing translations (falls back to English if missing — note where that happens) and any overflow/awkward French phrasing.
17. **Mobile.** Resize to a phone-width viewport (or use device emulation) — confirm no horizontal scrolling, touch targets are reasonably sized, and the step navigation/buttons remain usable.
18. **Cross-Business isolation sanity check.** If you have access to two different authenticated identities, confirm one can never see or select the other's Business through the resolver or any URL.

## Outcome

Record PASS/FAIL per item and any new finding not already listed in the closure report's known limitations. Founder QA status remains **pending** until this is actually run.
