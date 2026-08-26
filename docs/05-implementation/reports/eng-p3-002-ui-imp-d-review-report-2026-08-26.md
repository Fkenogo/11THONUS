# `ENG-P3-002-UI-IMP-D-REVIEW` — Independent Review, Correction, Merge & Closure (2026-08-26)

**Independent review of draft PR #181, performed in a fresh isolated worktree checked out at the
PR's exact head — the implementation report was not trusted as proof; every claim below was
independently re-derived from source.** One test-coverage gap (F1) and one Stitch-audit
documentation gap (F2), both bounded and corrected within Package D's own scope. No architecture,
security, or scope-boundary finding.

## 1. Entry PR/head/CI

- `gh pr view 181`: `baseRefName main`, `headRefOid e34302c8882bff402ee73144bcde4220d20b7e03`,
  `isDraft true`, `state OPEN`, `mergeable MERGEABLE`, `mergeStateStatus CLEAN`.
- `gh pr view 181 --json commits` confirms `e34302c` is the actual last commit — no later
  unreviewed commit exists.
- **CI infrastructure note (transparently disclosed, treated per this task's own instruction as
  historical/not-to-be-investigated for Package C, but live-blocking for this PR):** at review
  start, `gh pr checks 181` reported "no checks reported" and `gh run list` showed zero workflow
  runs registered for this branch/PR at all — the same GitHub Actions backlog symptom seen after
  Package C's closure sync (a `workflow_dispatch` run from that task was still `queued` with zero
  jobs after 55+ minutes). A manual `gh workflow run CI --ref feat/eng-p3-002-ui-imp-d` eventually
  succeeded, and PR #181's own check subsequently registered and passed
  (`32987140056`, 5m11s, **pass**). No code or workflow-file change was needed — this was
  GitHub-side runner backlog, not a defect in this PR.
- Fresh isolated worktree created at the exact PR head (`git worktree add
  /Users/theo/11THONUS-eng-p3-002-ui-imp-d-review e34302c...`), detached HEAD.
- Ancestry independently verified: `git rev-list --left-right --count HEAD...origin/main` → `2 0`;
  `git merge-base HEAD origin/main` → `ff0390d` (exactly `origin/main`'s tip at review start).
- `git diff --stat origin/main..HEAD`: 8 files, confined to `apps/web/src/business/dashboard/`,
  `apps/web/src/business/onboarding/steps/TermsStep.tsx`, one new e2e spec, the report, and the
  changes log — zero `functions/`, Rules, or Firebase-config diff, independently confirmed.
- No Package E/F/G/H worktree or branch exists anywhere in the repository.

## 2. Final reviewed head

`84a881ec3b3578f0f62efe40b117ccbebd813e31` — one correction commit added on top of `e34302c`
during this review (§21: one new 390×844 responsive test, plus this report's own
audit-completeness note), pushed to the same PR branch before merge.

**CI infrastructure note (continued, transparently disclosed):** after pushing `84a881e`, the
`pull_request`-triggered check never registered on PR #181 itself (`gh pr checks 181` reported "no
checks reported" repeatedly over several minutes), the same GitHub Actions backlog symptom as §1.
A manual `gh workflow run CI --ref feat/eng-p3-002-ui-imp-d` against this exact head (run
`32988318960`) completed **success**, independently proving this commit's code passes the full CI
pipeline (build, lint, test, emulator validation) even though the PR's own check status never
populated. `mergeStateStatus` remained `CLEAN`/`MERGEABLE` throughout (no branch-protection status
check is configured to block on this). Proceeded to merge on that evidence rather than waiting
indefinitely on a GitHub-side registration issue unrelated to this PR's content.

The true final pre-merge head is `47775ea9c28a737925046a72b86f5017b8e78e83` (a docs-only
CI-evidence-note commit on top of `84a881e`). A second manual dispatch against this exact head
(run `32989094979`) also completed **success**, confirming the final merged content green.

## 3. Package D scope verification

Re-read `ENG-P3-002-UI-RECON-001` Part XV directly from source (not the implementation report).
Verbatim, confirms the reported scope exactly: *"Package D — Business Terms (ACT-01)... relocate
Terms into a standalone Dashboard-reachable surface... Submit remains genuinely disabled per real
`isReadyToSubmit`..."*

**Whether Submit-for-Verification is genuinely part of Package D was independently confirmed from
RECON-001 alone, without relying on `UI-HANDOFF-001` or Stitch**, via RECON-001's own separate,
dedicated "ACT-01 — Business Terms" per-screen analysis section (lines 231–254, distinct from the
Part XV package table): *"**Backend:** `acceptBusinessTerms`, and indirectly
`submitBusinessForVerification`'s server-side enforcement (unchanged either way)"* and
*"**Backend change required:** only if 'Effective Date' is kept... otherwise none;
`acceptBusinessTerms`/`submitBusinessForVerification` are unchanged either way."* RECON-001 itself
names both callables as this screen's dependencies in a section that predates and is independent
of the Part XV decomposition text. Confirmed: **yes, Package D genuinely includes both (1) Business
Terms acceptance and (2) Submit for Verification/activation transition** — not an inference from
the wider `UI-HANDOFF-001` brief alone.

## 4. TermsStep reuse result

Read `TermsStep.tsx` in full. The `hideContinue` addition:
- **Genuinely additive:** new optional prop, default `false`.
- **Defaults to existing behavior:** with `hideContinue` omitted, the render tree is byte-identical
  to the pre-Package-D version (verified: the only new code is a `{!hideContinue && (...)}`
  wrapper around the pre-existing Continue block).
- **No regression to previous callers:** `TermsStep.test.tsx` has zero diff from this PR (`git diff
  origin/main..HEAD -- apps/web/src/business/onboarding/steps/TermsStep.test.tsx` empty) and all 6
  of its tests still pass unmodified.
- **No hidden wizard-specific assumption leaks into Dashboard use:** the prop only gates the
  Continue button block; every other branch (`unavailable`/`accepted`/checkbox-and-accept) is
  identical regardless of `hideContinue`, and none of it references wizard-only state.
- **No duplication:** `DashboardTermsPage` does not reimplement the checkbox/accept/unavailable
  logic — it passes different props into the same component.
- **No semantic change to acceptance itself:** `onAccept`/`isAccepting`/`acceptError`/
  `termsAcceptance.accepted` are unchanged; only the Continue *footer* is affected.
- **Mutation-tested (§19):** flipping the default to `true` made 3 of `TermsStep.test.tsx`'s own
  existing tests fail for the correct reason (Continue button unexpectedly present/hidden),
  confirming the existing suite itself protects this boundary without any new test being required
  for the default specifically.

## 5. Terms configuration-state matrix

Independently reconstructed from `termsAvailability.ts`, `TermsStep.tsx`, and
`businessLifecycleCommand.ts` (not the implementation report):

| State | Source of truth | UI treatment |
|---|---|---|
| Unavailable/unconfigured | `TERMS_READABLE_CONTENT_AVAILABLE = false` (hard-pinned, `DEC-LEGAL-002` open) or backend `unavailable` error | Neutral "currently unavailable" message; no checkbox, no accept button, Submit disabled |
| Available, not accepted | `TERMS_READABLE_CONTENT_AVAILABLE = true` (not reachable today) + `termsAcceptance.accepted = false` | Checkbox + Accept button; Submit disabled |
| Current version accepted | `termsAcceptance.accepted = true` (server-computed against the *current* required version) | "You accepted the Business Terms." status; Submit enabled once other readiness conditions hold |
| Previously accepted a now-superseded version | `resolveTermsAcceptanceProjection` (backend, unmodified) — returns `accepted: false` unless the stored acceptance's version matches the *current* required version, so this collapses to the same "not accepted" UI state as never-accepted | Same as "not accepted" — not misleadingly shown as satisfied; `assertCurrentBusinessTermsAccepted` independently re-enforces this server-side at submit time (proven by existing emulator tests per RECON-001's own test-plan citation) |
| Loading | `useBusinessContextQuery`'s `pending` status, handled one level up by the existing, unmodified `BusinessDashboardBoundaryPage` before `DashboardTermsPage` ever mounts | `resolve.loading` copy — no duplicate loading logic needed inside Package D |
| Read/configuration failure | `useBusinessContextQuery`'s `error` status (same boundary) or a `MutationError`-rendered `unavailable` code from a live mutation attempt | `integrityError` copy (context-level) or the neutral Terms-unavailable message (mutation-level) — never a raw error |

**Verified the UI never invites an action that cannot be performed:** the Accept button only
renders when content is actually available (never today); Submit is always visible but its
`disabled` state is computed from the same real `isReadyToSubmit` the backend independently
re-checks — never a client-only illusion of readiness. The Package B review's Terms-unavailable
vs. Terms-outstanding distinction is preserved unchanged (zero diff to `termsAvailability.ts`).

## 6. Terms acceptance result

Traced `acceptBusinessTerms` (unmodified — confirmed via `git diff --stat` showing zero
`functions/` diff) through to its command layer (not re-read line-by-line here since it is
untouched by this PR and was not itself in question; confirmed only that the frontend adapter and
mutation hook wiring the implementation reused are unmodified: `businessMutations.ts`'s
`useAcceptBusinessTermsMutation` — same idempotency-key-holder pattern as every other mutation in
this codebase, `onSuccess` invalidates `businessQueryKeys.context`, `onError` clears the key only
for non-retryable codes). No frontend-owned substitute for backend-authoritative acceptance state
was introduced. Failure handling: `MutationError`/`isUnavailableError` gate, unchanged. No direct
Firestore access anywhere in the diff (confirmed by grep and by the existing, dynamically-scanning
`noDirectFirestore.test.ts` guard, which automatically covers `DashboardTermsPage.tsx`).

## 7. `isReadyToSubmit` derivation/result

Re-read `completeness.ts` directly (zero diff from this PR, confirmed via `git diff`).
`isReadyToSubmit = isBusinessDetailsComplete && isClassificationComplete && isBranchComplete &&
isTermsComplete`. Confirmed `DashboardTermsPage` imports this exact function
(`../onboarding/completeness`) and does not recreate or locally weaken it (grep: only one
`isReadyToSubmit`-shaped predicate exists in the entire diff, imported not reimplemented).
Independently verified all six required scenarios:

- Incomplete establishment + Terms accepted → **cannot submit** (`isBusinessDetailsComplete`/
  `isClassificationComplete`/`isBranchComplete` gate independently of Terms).
- Establishment complete + Terms unavailable → **cannot submit** (`isTermsComplete` requires
  `accepted === true`, structurally unreachable while unavailable).
- Establishment complete + current Terms unaccepted → **cannot submit** (same predicate).
- Establishment complete + current Terms accepted → **may submit** (all four conjuncts true).
- **Team invitation/member state has no effect:** confirmed `completeness.ts` never references
  staff/invitation data anywhere; `isReadyToSubmit`'s only inputs are `Business`/`BusinessBranch`/
  `termsAcceptance` fields.
- **No unrelated Dashboard/profile field is an accidental prerequisite:** `contactEmail`,
  `logoUrl`, `legalName`, `supportedLanguages`, `currencyCode`, `timezone` are absent from every
  completeness predicate — confirmed by reading the full file.

Mutation-tested (§19): removing `isTermsComplete` from the conjunction made a
`DashboardTermsPage.test.tsx` test fail for the correct reason.

## 8. Submission lifecycle result

Read `businessLifecycleCommand.ts` in full (unmodified — zero `functions/` diff). Confirmed:
- **Only the governed source status may submit:** `business.submitForVerification`'s permission
  catalogue entry restricts eligibility to `draft` only; the evaluator denies every other status
  before `prepare` runs (this file relies on that governed narrowness rather than duplicating it,
  by its own header comment).
- **`draft → pending_verification`** is the only transition this command performs, enforced twice:
  structurally via `transitionBusinessStatus`/`isValidBusinessStatusTransition` (unchanged), and via
  the permission catalogue's status restriction.
- **Terms enforcement is server-side:** `assertCurrentBusinessTermsAccepted` runs inside the same
  Firestore transaction as the lifecycle write itself — both the current-version read and the
  acceptance read are TOCTOU-safe against a concurrent Terms-version change (the header comment's
  own documented Phase V analysis).
- **Authorization is server-side:** `authorizeAndExecute`'s permission evaluation runs before
  `prepare`, so an unauthorized caller never even reaches the Terms-acceptance check (no state
  leak to a denied caller).
- **Fails closed** on missing Terms configuration (`businessTermsConfigurationUnavailableError`)
  and on stale/absent acceptance (`currentBusinessTermsNotAcceptedError`).
- **Frontend never fabricates `pending_verification`:** `DashboardTermsPage` branches on
  `context.status` read from the server; the only way that value changes is a real backend write
  followed by cache invalidation and re-fetch (`useSubmitBusinessForVerificationMutation`'s
  `onSuccess`, unmodified).
- **Dashboard route remains valid after transition:** `BusinessDashboardBoundaryPage` is never
  status-gated (FD-4, unmodified) — confirmed by reading it fresh; `/dashboard/terms` continues to
  resolve correctly post-transition, now rendering the `pending_verification` branch.

## 9. Duplicate/retry/double-submit result

`authorizeAndExecute` wraps the entire command transaction with the shared, already-proven
client-retry idempotency mechanism (`idempotencyService`) used by every command in this codebase —
confirmed by reading `authorizeAndExecute.ts`'s own header and idempotency calls, not merely
assumed. `useSubmitBusinessForVerificationMutation` holds one idempotency key per mounted hook
instance, cleared only on success or a definitive (non-retryable) failure — a rapid double-click
before the button's `disabled` state visually updates would replay the *same* idempotency key, so
the backend's own conditional-write idempotency check (not a frontend guard) prevents a duplicate
lifecycle transition or duplicate side effect. This is the same protection pattern every other
mutation button in this codebase already relies on (Profile Save, Location Save, Accept Terms) —
Package D does not weaken or bypass it, and inventing a bespoke frontend double-click guard here
would diverge from the established, already-proven architecture rather than improve it.

## 10. Post-submission result

Independently re-verified `DashboardTermsPage`'s `pending_verification` branch: renders only
`submitted.title`/`submitted.body` (existing, reused, unmodified copy) — no Submit button, no
Terms checkbox/accept control, no "Active"/"Verified" claim, no trial/activation language.
Confirmed by both `DashboardTermsPage.test.tsx` (jsdom, direct prop injection simulating a
`pending_verification` context — equivalent to a refresh/deep-link scenario since the component has
no internal step state, it renders purely from the `context` prop on every mount) and by mutation
testing (§19: forcing the branch to be skipped made the "submitted" test fail for the correct
reason, proving the branch is load-bearing, not vacuously always taking the same path).

## 11. `DEC-LEGAL-002` boundary result

Confirmed directly from the Decision Register (`docs/00-governance/decisions/decision-register.md`
line 1221): **`DEC-LEGAL-002` — Status: `OPEN_LEGAL`, "Final decision/date/approved: —"** — genuinely
unresolved at the ultimate source of truth, not merely referenced as open in downstream docs.
Confirmed Package D invents none of: a legal Terms body, an Effective Date, legal version
presentation, fabricated acceptance wording, or consent mechanics beyond the existing governed
`terms.agreeLabel` checkbox/button contract — verified by grep across the full diff and by
`TermsStep.test.tsx`'s own existing negative assertions (no URL, no `.pdf`, no fabricated legal
text), unmodified and still passing.

## 12. Dashboard architecture result

Confirmed via import inspection: `DashboardTermsPage.tsx` imports no shell/context/auth module
beyond what Packages B/C already established (`useTranslation`, `Button`, the two existing
mutation hooks, `isReadyToSubmit`, `TermsStep`, `MutationError`, `BusinessContext` type). Mounted
as a plain child route of the unmodified `BusinessDashboardShell`/`BusinessDashboardRoutes`. No
second shell, no second auth path, no new Business context store. Direct/deep-link navigation
verified via Playwright (`page.goto(TERMS_PATH)` cold-loads correctly, both in the `draft` and
`pending_verification` fixture states via the jsdom test). Tenant isolation: unchanged, inherited
from the untouched backend commands (§8).

## 13. EN/FR result

No new i18n keys added by this PR (confirmed: zero diff to `en.ts`/`fr.ts`) — 100% reuse of
existing, already-translated `terms.*`/`actions.submit`/`submitted.*` keys. Re-verified in a real
browser: EN → FR → EN preserves the current route (`/dashboard-harness/terms`) and Business
identity. Since every string is pre-existing and already had EN/FR parity from prior packages,
there is no new-copy parity gap to check.

## 14. Responsive result

Re-ran the full real-browser suite plus **one new test added by this review** (§21) at 375×812,
**390×844 (previously untested by this package — a genuine coverage gap, now closed)**, 768×1024,
and 1280×800: no horizontal overflow at any breakpoint; Submit button visible with a measured
touch target.

## 15. Accessibility result

`TermsStep`'s existing `role="status"`/`Checkbox`/`Button` semantics reused unmodified. The new
Submit section uses a plain native `<button>` with the existing `MutationError`
(`role="alert"`) failure pattern. Disabled-state semantics use the native `disabled` attribute
(screen-reader and keyboard-correct, not a CSS-only fake-disable). No new keyboard trap. Loading
state has no bespoke announcement beyond the existing `disabled` + visual dimming — consistent
with every other mutation button in this codebase (not a new gap Package D introduced).
Double-trigger protection: see §9 (server-side idempotency, not a UI-level debounce — sufficient,
consistent with established architecture).

## 16. Stitch invention audit

Independently re-opened all three ACT-01 Stitch assets, including `act_01_business_terms_desktop/
code.html`, which the original implementation report's audit trail claimed was "inspected" but
never itself quoted in its findings. **Additional invention found, not previously flagged:** the
desktop variant is materially different from — and more elaborate than — the mobile
`action_required` variant. It fabricates a full, real-sounding five-section legal document
("Business Terms of Service," "Last Updated: October 24, 2023," sections on Account Registration,
Acceptable Use, Fees and Payment, Data Privacy) rather than the mobile mockup's bracket-placeholder
text; a *different* fabricated version number ("Version 2.1" vs. the mobile assets' "Version 1.0"
— the mockup set is internally inconsistent, corroborating RECON-001's own Part IX finding that
these assets contain unreconciled inconsistencies); an elaborate consent-checkbox wording beyond
the governed simple "I agree to the Business Terms" copy; and ungoverned "Settings"/"Sign Out"
nav items. Grepped the implementation and both locale files for this content
(`version 2.1`, `last updated`, `acknowledge that i have read`, `sign out`, `action required`,
section titles) — **zero matches**, confirming none of it leaked into the shipped screen. Recorded
here as a documentation-completeness finding (F2, §21) — the original audit should have explicitly
quoted this file's content rather than only citing the filename.

## 17. Security/tenant-isolation result

Unchanged — no backend file touched by this PR. Both callables retain their existing
`authorizeAndExecute`-based tenant-isolation and permission checks (§6/§8, read not modified).

## 18. Direct-Firestore result

Zero `firebase/firestore` imports anywhere in the diff; the existing, dynamically-scanning
`noDirectFirestore.test.ts` guard automatically covers the new file and passes.

## 19. Test-quality/mutation result

Five deliberate mutations, each confirmed to fail the correct existing test(s) for the correct
reason, then fully reverted (`git status`/`git diff` confirmed clean afterward):

1. **Readiness predicate weakened** (`isReadyToSubmit` dropped `isTermsComplete`) →
   `DashboardTermsPage.test.tsx`'s "Submit disabled while not ready" test failed as expected.
2. **Unavailable Terms treated as merely outstanding** (`unavailable` hardcoded `false` in
   `TermsStep`) → 3 tests failed across `TermsStep.test.tsx` and `DashboardTermsPage.test.tsx`.
3. **Submit exposed after `pending_verification`** (branch condition short-circuited to `false`) →
   the "submitted state" test failed as expected.
4. **Failed submission treated as success** (`MutationError` given `undefined` instead of the real
   error) → the "shows the mutation error" test failed as expected.
5. **`hideContinue` default flipped to `true`** → 3 of `TermsStep.test.tsx`'s own existing tests
   failed as expected, confirming the default is genuinely load-bearing and already protected.

All five mutations were caught without any test modification, confirming the suite exercises real
behavior, not just its happy path.

## 20. Findings

- **F1 (test-coverage gap, corrected).** The 390×844 mobile breakpoint — explicitly required by
  this review's own checklist and already covered for Packages B/C — was untested for Package D
  (only 375×812 was covered). Closed with one new real-browser test (§21).
- **F2 (documentation-completeness gap, corrected).** The desktop ACT-01 Stitch mockup's more
  elaborate invented content (§16) was never explicitly quoted in the original audit trail, even
  though the file was nominally "inspected." No functional defect — verified nothing leaked in —
  but the audit record itself was incomplete.

No functional, security, or scope-boundary defect found.

## 21. Corrections made

- Added `tests/e2e/dashboard-terms-harness.spec.ts` test: "no horizontal overflow at the 390x844
  breakpoint" (mobile describe block, matching Packages B/C's own dual-mobile-size convention).
- This review report itself closes F2 by explicitly quoting the desktop mockup's invented content
  and confirming its absence from the implementation (§16).
- No implementation file (`DashboardTermsPage.tsx`, `TermsStep.tsx`,
  `BusinessDashboardRoutes.tsx`, locale files) was touched by this review — the original
  implementation required no functional correction.

## 22. Remaining material findings

None — both findings above were fully closed within Package D's own bounded scope, no new
authorization needed.

## 23. Full validation

- `vitest run` (web, isolated review worktree): **595/595**, re-verified in the PR branch worktree
  after the e2e addition (unaffected — the addition is Playwright-only).
- `pnpm --filter functions run test`: **1563/1563**, unaffected.
- `pnpm run typecheck` (web + functions): clean.
- `eslint .`: clean except the same 1 pre-existing, unrelated warning (`BusinessApiContext.tsx`).
- `prettier --check`: clean.
- **Firebase Emulator Suite** (`pnpm run emulators:validate`): **688/690** (2 pre-existing skips,
  matching precedent), clean first run, no flake.
- Playwright `chromium` (production build): 1/1.
- Playwright `chromium-dashboard-harness`: **22/22** (21 pre-existing Package B/C/D + 1 new
  390×844 test from this review).
- Secret scan: manual grep across the full diff — clean.
- CI: PR #181's own check passed (`32987140056`, 5m11s) after the earlier GitHub-side runner
  backlog cleared (§1) — not a code defect.

## 24–25. Files modified & diff summary (this review's own changes only)

- `tests/e2e/dashboard-terms-harness.spec.ts` — one new `test.describe` block (390×844 overflow
  check), +14 lines.
- This review report (new) and the `IMPLEMENTATION_CHANGES.md` entry (new section) — documentation
  only.

## 26. Commands executed

`gh pr view/checks`, `gh run list`, `gh workflow run` (CI infrastructure recovery), `git worktree
add` (isolated review copy), `git rev-list`/`git merge-base`/`git diff --stat` (ancestry+scope),
`grep`/`Read` across governance docs (`ENG-P3-002-UI-RECON-001`, the Decision Register), domain
commands, and all three Stitch assets, `pnpm install`, `pnpm run typecheck`/`lint`, `npx prettier
--check`, `npx vitest run` (web, functions), `pnpm run emulators:validate`, `npx playwright install
chromium`, `npx playwright test` (both projects), targeted `python3` mutation edits + re-run +
revert (×5), `git commit`, `git push`, `gh pr ready`, `gh pr merge`.

## 27–29. Dependencies/config/Firebase/Rules changes

None, by this review or by the original PR. Zero `package.json`, Firebase project config,
`firestore.rules`, `firestore.indexes.json`, or `storage.rules` diff at any point.

## 30–32. Merge SHA, closure-sync SHA, post-merge CI

Recorded after merge — see the closure addendum appended to this report post-merge (this section is
completed as the final step of this same review task, not a separate task).

## 33–36. Package/Capability status

- **Package D status:** merged and closed by this review (pending §30's merge confirmation).
- **Packages E/F/G/H status:** not started; no overlapping work exists in this diff.
- **`ENG-P3-002` status:** unchanged — Open.
- **Capability 3 status:** unchanged — Open.

## 37. Risks

Unchanged from the implementation report's own assessment — low. This review added one responsive
test and closed one documentation gap; no behavior changed.

## 38. Rollback

Revert the merge commit. `terms` route returns to Package B's `DashboardComingSoon` placeholder;
`TermsStep.tsx`'s `hideContinue` prop reverts cleanly (no other caller uses it).

## 39. Persistent review-report path

This file.

## 40. Changes-tracking update

A matching entry recorded in `docs/changes/IMPLEMENTATION_CHANGES.md` under
`## ENG-P3-002-UI-IMP-D-REVIEW`.

## 41. Exact next Founder action

None required to close Package D — it is merged and closed by this review. Packages E/F/G/H remain
unauthorized; the next Founder action is authorizing whichever of those (or Package H's deployment
task) should run next.
