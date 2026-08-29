# ENG-P3-002-UI-IMP-H — Implementation Report (Integration, E2E QA & Closure Evidence)

**Branch:** `feat/eng-p3-002-ui-imp-h` off `main` at `cf6867b` (Packages A-G merged, CI-green).
**Head at closure:** `b1a9ccf752bb4ebade280010033ea36a3eb243cc` (13 commits, this report's own commit will follow).
**HOSTED FOUNDER QA: DEFERRED / NOT REQUIRED FOR CURRENT CLOSURE ASSESSMENT** — Founder decision; no hosted preview exists for this package, and this is not treated as a failed or blocked deliverable.

## What Package H did

An integration-and-closure pass over Packages A-G, validating the whole
governed business-onboarding-and-management journey end-to-end against a
live Firebase Emulator Suite (real `createBusiness`, `createStaffInvitation`,
`setDisplayName`, etc. — no mocked DTOs), fixing only bounded defects found
along the way, and producing the E2E/accessibility/screenshot evidence a
Founder go/no-go decision needs.

## Validation summary (all re-run fresh at HEAD `b1a9ccf`)

| Check | Result |
|---|---|
| `pnpm typecheck` (apps/web + functions) | PASS |
| `pnpm lint` | PASS (0 errors; 1 pre-existing warning, unrelated to this package) |
| `pnpm format:check` | PASS |
| `pnpm test` — functions | PASS: 145 files / 1583 tests |
| `pnpm test` — apps/web | PASS: 97 files / 656 tests |
| Functions emulator integration suite (`*.emulator.test.ts`, run directly against the already-running emulator since `pnpm emulators:validate`'s own `firebase emulators:exec` cannot bind ports already held by this session's long-running emulator — practical equivalent, see note below) | PASS: 53 files / 722 tests, 2 pre-existing skips |
| `pnpm test:e2e` (fixture-backed Playwright harness suite) | PASS: 32/32 |
| `pnpm test:e2e:emulator` (live, emulator-backed Playwright suite — Phases C/G/H/I/J/M/L2 combined, this is Phase P's consolidation) | PASS: 18/18 |
| `pnpm --filter web run build` (production build) | PASS |
| Secret scan (grep for credential/key patterns across the full diff) | Clean — only match is `TEST_PASSWORD = "Correct-Horse-Battery-Staple-1"`, a labeled deterministic fixture constant used solely against the Auth Emulator, not a real credential |

**Note on `pnpm emulators:validate`:** its own `firebase emulators:exec` tries to start a second emulator instance and fails on port conflicts with this session's already-running one (used throughout this package's work). Running the same test files (`vitest run --config vitest.emulator.config.ts`) directly against the existing running emulator with `FIRESTORE_EMULATOR_HOST`/`FIREBASE_AUTH_EMULATOR_HOST` set is the exact same test suite, exercised the same way — the wrapper script just orchestrates emulator lifecycle, which was unnecessary here since one was already up.

## Defects found and fixed this package (all RED→GREEN, commit-referenced)

1. **`a1321f9`** — Optional-field mutations (`createBusiness`, `updateBusinessProfile`, `updateBusinessBranchProfile`) serialized an unset field as JSON `null` (Firebase callable SDK behavior) where the backend's `parseOptionalString` only accepts a genuinely absent key — broke the ordinary "no Business Type selected" happy path at EST-02, plus 4 other call sites. Fixed via a new `optionalField()` helper.
2. **`6b683e0`** — Frontend `InvitationStatus` used `"invited"`; the backend's real, closed vocabulary is `"pending"` — every created invitation was silently invisible in the Team "Pending invitations" list.
3. **`d35f19d`** — `/profile` (Display Name page) had zero page padding, flush against the viewport edge.
4. **`df4e17f`** — EST-03 (review/edit) had no page-width constraint — cards stretched edge-to-edge on desktop.

## Defect investigated, found real, NOT fixed (residual, disclosed risk)

**EST-02 double-submit / idempotency** (`e133884`) — forced a genuine concurrent-request race (two native DOM `click()` calls dispatched synchronously, bypassing Playwright's actionability wait). Confirmed:
- The client-side idempotency-key-holding contract genuinely holds (both racing calls carry the same key) — deterministic, hard-asserted test, always passes.
- Under a real backend race (reproduced in 2 of 3 forced attempts), Firestore's transaction-contention path can abort the losing call (`409 ABORTED`) while the winning call independently succeeds with a real `businessId`; the mutation hook's UI-visible state doesn't reliably surface that success (stays on `/business/new` with an error alert instead of navigating); because the error clears the held idempotency key, the user's natural retry issues a new key and creates a **second, different Business** for the same owner.
- **Not fixed** — explicitly out of scope per instruction not to invent new idempotency architecture in this package. A real fix requires backend authorization to change `createBusiness`'s concurrent-request handling (e.g. treating a same-key `ABORTED` conflict as retryable-with-the-same-key, or having the loser look up and return the winner's committed result).
- The test that proves this runs for real every execution and records the outcome as a test annotation rather than a hard assertion, because the race is non-deterministic and a hard assertion would make the suite flaky-red on whichever side it didn't hit that run.

## Closure Matrix — ENG-P3-002 (Packages A-H)

| Package | Implemented | Reviewed | Merged | E2E Verified | Founder Visual QA Evidence | Open Finding |
|---|---|---|---|---|---|---|
| A — Business Establishment (EST-01/02/03) | Yes | Yes (independent review, PR history) | Yes (`main`) | Yes — Package H Phase C, live emulator | Yes — screenshots #1-6 | See "EST-02 idempotency residual risk" below (blocking-for-awareness, non-blocking-for-merge) |
| B — Dashboard Shell + Home | Yes | Yes | Yes | Yes — Package H Phase D/J (existing harness suite + live cross-package cache checks) | Yes — screenshots #7-8 | None new |
| C — Business Profile / Locations | Yes | Yes | Yes | Yes — Package H Phase E/F/J, live | Yes — screenshots #9-12 | Transient category-id→label flash (below, non-blocking-deferred) |
| D — Business Terms / Activation | Yes | Yes | Yes | Yes, to the extent reachable — Package H Phase G, live | Yes — screenshots #13-14 | Terms re-acceptance/versioning pending `DEC-LEGAL-002` (separately-governed-future-scope) |
| E — Identity Display Name | Yes | Yes | Yes | Yes — Package H Phase I, live (the priority "key gap," now closed) | Yes — screenshots #21-24 | None new |
| F — Team Management | Yes | Yes | Yes | Yes — Package H Phase H, live | Yes — screenshots #15-20 | Unsupported Team actions (below, by-design, not a gap) |
| G — Staff transport identity projection | Yes | Yes | Yes | Yes — exercised by Phase H/I live specs | N/A (backend-only) | None new |
| H — Integration, E2E QA & closure (this package) | Yes | Self-verified this session (full regression, Phase S); independent human review still pending | Not yet (branch, PR to follow) | Yes — 18/18 live emulator tests + 32/32 fixture harness tests | Yes — 34 screenshots + index + Founder checklist | See below |

## Open findings — explicit classification

| Finding | Classification | Notes |
|---|---|---|
| `Business.address` vs `BusinessBranch.address` split | **Blocking for a real product decision, non-blocking for this closure** | Unresolved data-model question from before Package H; confirmed still live (EST-02's Location/Address fields are collected but never sent to `createBusiness`, by design pending this decision). Package H did not touch it, per explicit instruction. |
| `legalName`/`logoUrl`/`supportedLanguages` — Business Profile read-contract gap | **Non-blocking-deferred** | `getBusinessContext`'s DTO still omits these three; `updateBusinessProfile`'s patch type accepts `legalName` but there's no way to display what was saved. Confirmed still open, not touched. |
| **Correction to a prior note**: `currencyCode`/`timezone` | **Not an open finding — resolved before Package H** | An earlier checkpoint in this session incorrectly carried forward a stale claim that these were unresolved. They ARE already projected onto `BusinessContext` (confirmed by reading `businessContext.ts` and `EstablishmentReviewPage.tsx`'s own docblock, which documents the correction) and render correctly on EST-03/Dashboard. Do not list as unresolved going forward. |
| Terms re-acceptance/versioning policy | **Separately-governed-future-scope** | Pending `DEC-LEGAL-002` (OPEN_LEGAL). `TERMS_READABLE_CONTENT_AVAILABLE` is hard-pinned `false` by design — the Terms gate is currently permanently unsatisfiable in this environment, which is expected, not a bug. |
| Unsupported Team actions (Resend/role-change/removal/suspend/directory/search) | **By design, not a gap** | Confirmed absent from the UI and from the callable surface; explicitly out of scope per governing docs. |
| No multi-branch / "Add new location" UI | **By design, not a gap** | Confirmed absent; single Main Location only, per governing docs. |
| Transient category-id→label flash (`cat_bakery` → `Bakery`, ~100-150ms) | **Non-blocking-deferred** | Self-heals every time (confirmed via direct polling); not visible to a real user under normal interaction; the underlying `data ?? fallback-to-id` pattern repeats on 3 pages, so a proper fix (skeleton/suspense) is broader than a one-line bounded change. |
| `LanguageSwitcher` cosmetic spacing ("EnglishFrançais" reads run-on) | **Non-blocking-deferred** | Purely cosmetic; does not affect the axe scan (zero violations) or keyboard operability; a real fix touches a shared component used on every page, larger blast radius than this package's bounded-fix scope. |
| **EST-02 idempotency residual risk** (a genuine concurrent double-submit can create two Businesses) | **Blocking for awareness, but classified non-blocking-for-this-closure** — see reasoning below | Investigated, reproduced, documented with executable evidence (`e133884`). Not fixed per explicit instruction not to invent new idempotency architecture in this package. This is the one item in this table that most warrants a dedicated, backend-authorized follow-up package before this flow sees materially higher traffic — flagged here explicitly so it isn't lost, not silently deferred. |

*Why "blocking for awareness, non-blocking for this closure": the race requires near-simultaneous double-clicking on a single form's Continue button — not a normal single click, not a network retry, not page-refresh-and-resubmit (all of which were separately verified safe/expected in Phase C). It's a real gap, but a narrow one, and fixing it correctly requires backend transaction-handling authority this package doesn't have. Recommending it as the top follow-up item, not as a reason to hold the whole closure.*

## ENG-P3-002 closure recommendation

**`ENG-P3-002 COMPLETE WITH DOCUMENTED DEFERRED ITEMS`**

Every package (A-H) is implemented, reviewed, merged (H pending its own PR,
opened as part of this closure pass), and E2E-verified against real,
live emulator-backed data — including the one flow (Display Name → Team
visibility) that was the explicit gap going into Package H. The open
items above are all either by-design, separately-governed future-scope
(the legal-content decision), or narrow-and-disclosed (the two findings
marked non-blocking-deferred, and the one residual idempotency risk). None
of them represent an unverified or silently-skipped part of the governed
journey. `ENG-P3-002 BLOCKED` would misstate the actual state — nothing
here is stopping forward progress — and `READY FOR FOUNDER ACCEPTANCE`
would overstate it, since acceptance is the Founder's own decision to make
after reviewing this evidence (including the visual QA checklist), not
something an implementation report can declare on its own.

### ENG-P3-002 closure ≠ "Capability 3 complete"

**Capability 3 is explicitly NOT marked complete anywhere in this report or
its PR.** These are two different governance decisions:
- **ENG-P3-002 closure** is a statement about *this engineering initiative*
  — did the planned packages get built, integrated, and verified against
  their own governing specs. That's what this report assesses.
- **"Capability 3 complete"** (per the broader roadmap/capability tracking
  this repository maintains elsewhere) is a *product/business* determination
  — whether the underlying capability is ready to be relied on for real
  operation, which folds in considerations this engineering report has no
  authority over: the still-open legal-content decision blocking real Terms
  acceptance, the Business.address data-model question, whether the
  EST-02 idempotency risk is acceptable at real traffic levels, and
  whatever else the Founder weighs that isn't a code-correctness question.
  Marking that complete is a Founder decision, not an engineering-report
  conclusion, and this report does not attempt to make it.

## Files changed across the full Package H session (this report's own commit not yet counted)

30 files (excluding the 34 evidence PNGs and this report/checklist):
`apps/web/src/business/api/optionalField.ts`, `optionalField.test.ts`,
`staffLists.ts`, `staffLists.test.ts`,
`business/dashboard/BusinessProfilePage.tsx`, `LocationsPage.tsx`,
`TeamManagementPage.tsx`, `TeamManagementPage.test.tsx`,
`business/onboarding/establishment/EstablishmentLocationStep.tsx`,
`EstablishmentReviewPage.tsx`, `business/onboarding/steps/BranchStep.tsx`,
`ClassificationStep.tsx`, `TeamStep.tsx`,
`dev/dashboardHarness/DashboardHarnessPage.tsx`,
`identity/DisplayNameProfile.tsx`, `eslint.config.js`, `package.json`,
`playwright.config.ts`, `pnpm-lock.yaml`, and 8
`tests/e2e/emulator/*` files (`accessibility.spec.ts`,
`cross-package-cache.spec.ts`, `display-name-team.spec.ts`,
`establishment.spec.ts`, `helpers.ts`, `screenshotEvidence.spec.ts`,
`seedCommerceKnowledge.mjs`, `terms-and-team.spec.ts`), plus
`docs/05-implementation/evidence/ENG-P3-002-UI-IMP-H/screenshot-index.md`
and the Founder visual QA checklist.
