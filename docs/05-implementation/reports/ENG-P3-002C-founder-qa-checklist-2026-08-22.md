> **Title:** ENG-P3-002C — Founder QA Checklist (Business Onboarding)
> **Status:** Founder QA now actually run (partial). One of two genuine FAIL findings has since
> been corrected and hosted-revalidated — checklist is still NOT complete/passed (mobile navigation
> FAIL remains open). See the results table and full classification in
> [`ENG-P3-002C-FOUNDER-QA-001`](ENG-P3-002C-FOUNDER-QA-001-founder-qa-evidence-and-classification-2026-08-24.md).
> **2026-08-24 (`ENG-P3-002-CORR-LANGSWITCH-001-REVALIDATION`) — item 16 (French) RESOLVED, proven
> hosted (supersedes the FAIL recorded below for that item only):** `ENG-P3-002-CORR-LANGSWITCH-001`
> (PR #170, merge `2a2af4a`; review/closure PR #171, merge `0cd7d05`) added the existing
> `LanguageSwitcher` to `/business/new`, the full onboarding wizard (all five steps), and the
> submitted-status page. Redeployed to the same preview URL/channel
> (`https://eleventh-on-us-dev--eng-p3-002c-founder-qa-8lho2gn4.web.app`, expires 2026-08-31 17:58,
> SHA `0cd7d059bb390ccb7c6750311b1c1ffa9adcadd8`) and re-proven live, visually, against the existing
> QA identity and the existing Business (`xkLYdH17O2zy8ruDjtln`, reused, not re-created): the
> switcher is visibly reachable on `/business/new` and throughout the wizard; EN→FR and FR→EN both
> work; the current route and wizard step are unaffected by the switch; the existing Business's
> Review data (name, category, Branch, team-invitation count) is unaffected by the switch; the
> chosen language survives a full page refresh, and the signed-in session/wizard step also survive
> that refresh. Terms-unavailable behaviour and the disabled Submit button reconfirmed correct in
> both languages. Mobile (375×812): switcher reachable, no overflow, switching still works — **the
> separate mobile-navigation FAIL (item 17) is unchanged and NOT addressed by this task.** Full
> evidence: [deployment report addendum](ENG-P3-002C-PREVIEW-001-business-onboarding-dev-preview-deployment-report-2026-08-23.md#addendum--2026-08-24-eng-p3-002-corr-langswitch-001-revalidation-hosted-language-switch-revalidation--passed-enfr-founder-qa-finding-resolved).
> **Item 16 (French) reclassified PASS/RESOLVED.** Item 17 (mobile) remains FAIL, unchanged. Founder
> QA overall status is still not complete/passed.
> **2026-08-24 (`ENG-P3-002C-FOUNDER-QA-001`) — Founder QA executed against the existing preview and
> existing Business (`xkLYdH17O2zy8ruDjtln`, reused, not re-created), using the existing QA identity:**
> **PASS:** items 1 (sign-in), 2 (create Business — reused existing), 3 (resume), 5 (category), 6
> (Business Type — Salon types incl. Barbershop/Children's/Express/Family/Luxury/Mobile/Premium
> Salon, "No specific type" available — first direct confirmation of this item), 7 (branch/main
> location, editable), 8 (Terms unavailable behaviour), 9 (Team functional flow, pending invitations
> displayed), 10 (staff invitation), 12 (review accuracy), 13 (submission boundary correctly blocked).
> **FAIL:** item 16 (French) — no language-switching control exists anywhere inside the onboarding
> wizard (confirmed by source inspection: `LanguageSwitcher` is wired only into the sign-in screen,
> never `apps/web/src/business/`); the underlying translations work when forced programmatically,
> but a real user/Founder cannot reach French from inside the flow. **Genuine gap, not a Founder
> oversight.** Item 17 (mobile) — the step-navigation row (Business category / Main location /
> Terms / Team / Review) reads as desktop-style tab navigation on a phone viewport; functionally
> usable (no overflow, legible) but rejected by the Founder as an unacceptable mobile pattern. No
> documented requirement mandates a specific pattern (only draft, general "usable on mobile"
> objectives exist) — recorded as a Founder-acceptance FAIL regardless.
> **NOT TESTED:** item 14 (`pending_verification`, correctly blocked by `DEC-LEGAL-002`, expected),
> item 18 (cross-Business isolation, needs a second identity, out of this round's scope).
> **DEFERRED:** overall visual presentation — Founder expects Stitch-governed refinement, but **no
> Stitch concept exists for Business onboarding yet** (confirmed against `docs/07-product-design/`
> and `CDR-001` §9's traceability table) — deferred pending one being commissioned, not deferred to
> an existing plan.
> **NON-BLOCKING FINDING:** pending Staff invitations display only `role — status` (e.g.
> "staff — pending"), no invitee identity — confirmed as a genuine backend DTO gap (deliberately
> minimal by design, per `staffTransportReadService.ts`), not a frontend display omission, and not
> governed by any documented privacy decision. Non-blocking for this checklist; a real gap if the
> Founder wants it addressed.
> **Status effect:** `ENG-P3-002C` = hosted engineering/integration validated; Founder QA pending.
> `ENG-P3-002` = Open, blocked on Founder QA completion and `DEC-LEGAL-002`. Capability 3 = Open.
> None closed by this entry. Full governing-document citations and Phase-D disposition reasoning in
> the linked report.
>
> ---
> **2026-08-24 (`ENG-P3-002C-PREVIEW-001-BUSINESS-CREATE-REVALIDATION-001`) — Business-creation
> blocker RESOLVED and re-proven in the real hosted DEV environment (supersedes the entry below):**
> **Preview URL:** `https://eleventh-on-us-dev--eng-p3-002c-founder-qa-8lho2gn4.web.app`
> **Sign-in entry:** `/dev/founder-qa-sign-in` on that URL.
> **Channel:** `eng-p3-002c-founder-qa` · **Project:** `eleventh-on-us-dev` · **Expires:**
> 2026-08-31 13:22 · **Deployed source SHA:** `8bbdaa942a499c68cf2edddd895e8aa5e198bbc0`.
> **Login:** email `founder-qa-appcheck002@11thonus-dev-preview.test` — the password was reset
> during this revalidation task at explicit Founder authorization; ask the engineering session for
> the current password separately, it is never written in this or any persistent document.
> **What is now proven end-to-end against the real hosted environment (not just code inspection):**
> checklist items 1–5, 7, 8, 9, 10, 11 (partially), 12, 13, 15, 16, 17 all directly exercised and
> PASSED — see the
> [deployment report addendum](ENG-P3-002C-PREVIEW-001-business-onboarding-dev-preview-deployment-report-2026-08-23.md#addendum--2026-08-24-eng-p3-002c-preview-001-business-create-revalidation-001-hosted-business-creation-revalidation--passed-founder-qa-may-continue)
> for the full evidence trail (persisted Firestore state, request/response proof, exact commands).
> **Still not independently confirmed:** item 6 (Business Type selector — not reachable on the
> current wizard's Classification step, not yet re-scoped), item 14 (`pending_verification` —
> still blocked by `DEC-LEGAL-002`, unchanged), item 18 (cross-Business isolation — needs a second
> identity, not attempted this round).
> **Known, separate, non-blocking finding, unchanged:** direct visits to `/dev/founder-qa-sign-in`
> still receive no Content-Security-Policy header at all from Hosting (`ENG-HOSTING-CSP-COVERAGE-001`)
> — harmless, tracked for a future hardening pass, not fixed here.
>
> ---
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

**Recorded 2026-08-24 (`ENG-P3-002C-FOUNDER-QA-001`).** Founder QA status: **partially executed,
NOT complete** — two FAIL findings block a clean pass. Full governing-document classification for
each finding is in
[`ENG-P3-002C-FOUNDER-QA-001-founder-qa-evidence-and-classification-2026-08-24.md`](ENG-P3-002C-FOUNDER-QA-001-founder-qa-evidence-and-classification-2026-08-24.md).
This run reused the existing DEV Business (`xkLYdH17O2zy8ruDjtln`) and the existing QA identity —
no new Business or identity was created.

| # | Item | Result |
|---|---|---|
| 1 | Sign in / enter Business area | PASS |
| 2 | Create Business | PASS (existing Business reused, per instruction) |
| 3 | Resume | PASS |
| 4 | Edit Business (name reflected in Review) | NOT SEPARATELY TESTED |
| 5 | Category | PASS |
| 6 | Optional Type | PASS — first direct confirmation in this workstream; Salon types (Barbershop, Children's Salon, Express Salon, Family Salon, Luxury Salon, Mobile Salon, Premium Salon) plus "No specific type" all available |
| 7 | Branch | PASS |
| 8 | Terms — unavailable behavior | PASS |
| 9 | Team — skip | PASS (functional flow confirmed operational) |
| 10 | Staff invitation | PASS |
| 11 | Refresh at every step | NOT SEPARATELY TESTED (implicitly exercised by items 2–3, 12–13) |
| 12 | Review | PASS |
| 13 | Submission boundary | PASS |
| 14 | `pending_verification` state | NOT TESTED — correctly blocked by `DEC-LEGAL-002` (unchanged, expected) |
| 15 | English | PASS |
| 16 | French | **FAIL** — no language-switching control reachable from inside the onboarding wizard (confirmed by source inspection); translations themselves work, access path does not. Genuine gap, not overridden by prior automated evidence. |
| 17 | Mobile | **FAIL** — step navigation reads as desktop-style tabs on a phone viewport; functionally usable but rejected by the Founder as an unacceptable mobile pattern. No specific documented pattern requirement exists (only draft, general "usable on mobile" objectives) — recorded as a Founder-acceptance FAIL regardless. |
| 18 | Cross-Business isolation | NOT TESTED (needs a second identity, out of this round's scope) |

**Additional findings, not itemized in the original 18:**
- **Overall visual presentation — DEFERRED.** No Stitch design concept exists yet for Business
  onboarding (confirmed against `docs/07-product-design/` and `CDR-001` §9) — deferred pending one
  being commissioned, not deferred to an already-existing plan.
- **Pending Staff invitation display (no invitee identity shown) — non-blocking finding.**
  Confirmed as a genuine backend transport-DTO gap (deliberately minimal "Phase N" design), not a
  frontend omission, and not governed by any documented privacy decision. Does not block this
  checklist; a real gap if the Founder wants it addressed.

**Status effect of this run:** `ENG-P3-002C` = hosted engineering/integration validated, Founder QA
pending (unchanged). `ENG-P3-002` = Open, blocked on Founder QA completion and `DEC-LEGAL-002`
(unchanged). Capability 3 = Open (unchanged). Nothing closed by this entry.
