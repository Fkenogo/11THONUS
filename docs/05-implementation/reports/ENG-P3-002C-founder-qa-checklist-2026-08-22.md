> **Title:** ENG-P3-002C — Founder QA Checklist (Business Onboarding)
> **Status:** Not yet executed. This is a checklist to run, not a record of a run.
> **2026-08-23 (`ENG-P3-002C-PREVIEW-001-DEPLOY-001`) — hosted preview deployed but currently BLOCKED, do not attempt yet:**
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
