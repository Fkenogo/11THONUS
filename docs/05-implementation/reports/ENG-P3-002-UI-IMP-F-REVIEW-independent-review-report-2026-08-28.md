# ENG-P3-002-UI-IMP-F-REVIEW — Independent Review, Correction, Merge & Closure

**Date:** 2026-08-28
**Task:** Independent review of draft PR #193 (Package F — Team Management UI). The implementation
report was not trusted as proof; every claim was independently re-verified from source, and CI's
own actual result was checked directly rather than assumed green.

---

## 1. Entry PR/head/CI

PR #193, base `main`, 2 commits, head `8fb7ba5c5f04c21bbc1e36572586f694e30bc9b3` — confirmed via
`gh pr view 193`. **CI was actually failing** (`mergeStateStatus: UNSTABLE`), specifically the
"Playwright e2e" job — a real regression, not a flake: the implementation report itself admits
"Playwright was not additionally invoked" during the original implementation, so this failure was
never locally observed before the PR was opened.

## 2. Final reviewed head

`61227c42dcbf7ac641c2abc54fd9c9576d697337` on branch `feat/eng-p3-002-ui-imp-f-team-management`,
after this review's corrections were committed on top of `8fb7ba5`; CI passed against this exact
head (`gh run view` → `conclusion: success`) before merge.

## 3. Package F scope result

**Confirmed, independently, not assumed from the report.** Re-read `ENG-P3-002-UI-RECON-001` Part
XV/Brief 6, `ENG-P3-002-UI-HANDOFF-001` Brief 6, `FD-P3-002-G-001`, `FD-IDENTITY-DISPLAY-001`, and
re-derived the exact Staff callable set directly from `functions/src/index.ts`'s exported `onCall`s:
only `createStaffInvitation`, `revokeStaffInvitation`, `listStaffInvitations`,
`listStaffMemberships` exist — confirmed unchanged by this PR (`git diff
9d3b701..8fb7ba5 -- functions/` is empty). No Package H content, no unsupported Staff mutation, was
found anywhere in the diff.

## 4. Active-member result

**PASS.** Every `MemberRow` reads only `membership.displayName`/`role`/`status` from the final,
merged Package G transport. Verified for Owner (`Safi`), Manager (`Jean-Claude`), and Staff (both
named `Amara`/`Blaise` and unnamed) in both the unit suite and a real browser. No `userId`, email,
phone, or provider data renders anywhere (unit test + real-browser body-text scan, both negative).

## 5. Missing-name result

**PASS.** EN: "Unnamed team member"; FR: "Membre sans nom" — both neutral, no fabricated name, no
email substitution. Confirmed in the unit suite and in the real dev harness (French locale render).

## 6. Pending-invitation result

**PASS, visually and semantically distinct.** Separate "Pending invitations" section with its own
heading; status label "Pending"/"En attente" (never "Active"); email shown only for
`deliveryType === "email"`; a neutral "Invitation sent"/"Invitation envoyée" fallback for phone
delivery — no phone number, no fabricated name. No user/customer lookup exists anywhere in the
invite flow (confirmed by source inspection and a real-browser assertion that no "already"/"exists"
copy ever appears while typing).

## 7. Invite-flow result

**PASS.** Traced end-to-end: `InviteForm` collects `deliveryType`/`deliveryValue`/`role` only,
calling `createStaffInvitation` with exactly `{ role, deliveryTarget: { type, value } }` — no other
field. Role options are the real `staff`/`manager` closed-enum vocabulary (`INVITATION_ROLE_OPTIONS`
matches `invitationRole.ts`'s `INVITATION_ROLES` exactly), never the Stitch mockup's invented
"Admin"/"Editor". Submit disables on `isPending`, and the shared `IdempotencyKeyHolder` (the same
`ENG-P3-002B`-established primitive every other mutation in this codebase uses) reuses one key
across any duplicate submit until the outcome is known, so no duplicate invitation can be created
even if the UI-level disable were somehow bypassed. On success, `staffInvitations` is invalidated
(backend-authoritative refresh) — no optimistic invitation is fabricated client-side at any point.
Verified in a real browser (form open, submit, role-select content).

## 8. Revoke-flow result

**PASS, one defect found and fixed.** Only `status === "invited"` invitations ever render a
"Cancel invitation" control (enforced by the parent's own `pendingInvitations` filter, not by the
row component, so a non-pending invitation can never expose it — confirmed by both a mutation test
and a dedicated existing-suite test). Revoking requires an inline confirmation step before the real
`revokeStaffInvitation` call fires. **Defect found:** the confirmation's "Yes, cancel invitation"/
"Cancel" buttons had no `disabled={revokeMutation.isPending}` guard, unlike the equivalent Invite
submit button — a rapid double-click could dispatch two `mutate()` calls before the first settled.
**Not a security issue** (the shared idempotency-key holder reuses the same key across both calls,
so the backend still treats it as one logical action), but a real UI-consistency/safety gap against
this task's own "double-click/retry remains safe" bar. **Fixed** (§26): both buttons now disable
while `revokeMutation.isPending`, proven by a new RED→GREEN unit test. A failed revoke shows the
existing `MutationError` copy and leaves the invitation's status/visibility completely unchanged in
the UI (proven by a new test, §24, mutation 7).

## 9. Unsupported-actions audit

**PASS.** Confirmed absent by direct source inspection and real-browser body-text/role scans: no
"Resend" (no callable exists — confirmed again via `functions/src/index.ts`), no role-change
control (no callable exists), no active-member removal/suspend/reactivate control (no callable
exists — `Role`/`MembershipStatus` models were re-checked; only `"active"` is ever produced by
current write paths), no per-member "more options" menu, no invented permissions-editing UI.

## 10. Role/status result

**PASS, correctly distinguished.** `roleLabel`/`statusLabel` are shared lookup objects with
disjoint key sets per domain — membership status only ever looks up `"active"`; invitation status
only ever looks up `"invited"/"accepted"/"revoked"/"expired"` — so membership and invitation status
are never collapsed into one generic "Pending"/"Active" presentation; each row shows its own
domain's real value under its own real label. No Stitch-invented "Admin"/"Editor" label leaked in
anywhere — the invite Role `<select>`'s options are generated directly from
`INVITATION_ROLE_OPTIONS` (`["staff", "manager"]`), confirmed by both a unit test asserting the
exact option values and a real-browser assertion of the same.

## 11. Dashboard integration

**PASS.** Team route (`team`) is a sibling `<Route>` inside the same, unmodified
`BusinessDashboardShell`/`<Outlet />` every other Dashboard destination uses — no second shell, no
new guard, no participant-style bottom navigation. Mobile hamburger menu exposes the "Team" link
identically to Profile/Locations/Terms (pre-existing `BusinessDashboardShell` nav array, unchanged).
Desktop sidebar exposes the same. Direct-URL navigation/refresh to `/business/:businessId/dashboard/team`
resolves correctly (real-browser + existing `BusinessDashboardRoutes.test.tsx` coverage, extended
in the original PR with the necessary staff-hook mocks).

## 12. Tenant isolation

**PASS, unchanged.** `TeamManagementPage` reads/writes only through `context.businessId` — the
already-server-authorized `BusinessContext` value `BusinessDashboardBoundaryPage` fetches via
`getBusinessContext` before any Dashboard destination (including Team) ever mounts. No client-side
Firestore access, no way to substitute another Business's id at this layer; cross-Business
enumeration resistance is enforced entirely server-side by the unmodified
`listStaffMemberships`/`listStaffInvitations` (re-verified unchanged in this PR's `functions/` diff,
which is empty).

## 13. EN result

**PASS.** Full `teamManagement.*` namespace, verified against real rendered content in a browser
(not just jsdom).

## 14. FR result

**PASS.** Full French parity, verified in a real browser: route, Business identity ("Acme Salon"),
and Team data (`Safi`, `elise.m@example.com`) all preserved across EN→FR→EN; "Propriétaire"/"Owner"
role label correctly localizes; dynamic identity values (names, emails) correctly remain
untranslated in both directions (new dedicated e2e coverage, §24/§27).

## 15. Mobile 375 result

**PASS.** 375×812: no horizontal overflow, confirmed with real long-content fixtures (a 39-character
Display Name, a 73-character invitation email) added to the dev harness specifically for this
review — the original PR's harness fixtures were all short strings, which would not have caught a
real overflow defect had one existed. Invite button meets the 44px touch-target minimum (new e2e
assertion).

## 16. Mobile 390 result

**PASS.** 390×844 — **a real-browser breakpoint the original implementation never automated**
(Packages B/C/D each ship a dedicated Playwright spec covering both 375 and 390; Package F's
original PR had no equivalent spec at all, relying only on manual screenshots taken during
implementation, per its own report). New `dashboard-team-harness.spec.ts` (§24/§27) closes this gap
with an automated, CI-enforced check at this exact breakpoint.

## 17. Tablet result

**PASS.** 768×1024: persistent sidebar, no overflow (new automated e2e coverage; previously only
manually screenshotted).

## 18. Desktop result

**PASS.** 1280×800: shell integration, real active-member/invitation content, invite-form Role
options, and the revoke-confirmation flow all verified with automated Playwright coverage (new).

## 19. Accessibility result

**One real defect found and fixed.** Heading hierarchy (`h1`/`h2`), list semantics
(`<ul>`/`<li>`), accessible action names, `role="alert"` for the read-error panel and
`MutationError`, and keyboard-operable native controls were all confirmed correct. Status is
conveyed by text ("Active"/"Pending"/etc.), never by color alone. **Defect:** neither the invite
form's Cancel action nor the revoke-confirmation's dismissal returned focus anywhere — real-browser
inspection of `document.activeElement` after closing either showed focus had fallen to `<body>`,
a genuine violation of this task's own Phase L "focus restoration after close" requirement (the
implementation report's own accessibility section did not claim to have verified this with
`document.activeElement`, and its "no true modal, no focus trap" framing turned out to have missed
the narrower disclosure-pattern focus-return requirement, which applies regardless of whether the
interaction is a true modal). **Fixed** (§26): both the "Invite team member" button and each row's
own "Cancel invitation" button now receive focus back after their respective sub-flow closes,
proven by two new RED→GREEN unit tests and independently re-confirmed with a real
`document.activeElement` check in a live browser both before (fails) and after (passes) the fix.

## 20. Empty/error-state result

**PASS, one gap closed.** Owner-only, active-only, pending-only, active+pending, missing-name, long
identity values (§15), read-failure (a real `role="alert"` panel, never presented as an ordinary
empty Team — a genuine Package G integrity failure is never silently collapsed into "no one on your
team"), invitation-creation failure, and retry were all already covered. **Gap closed:** revocation
failure had no existing test proving the failure surfaces and the invitation's state stays
unchanged — added (§8/§24, mutation 7).

## 21. Security/privacy result

**PASS.** No direct Firestore (own architectural test, §22), no user directory, no arbitrary
identity lookup, no cross-Business enumeration path, no `CustomerProfile` import, no Firebase Auth
Admin SDK call, no provider metadata, no internal `userId` ever rendered (unit test + real-browser
body-text scan). Invitation email renders only within the already-tenant-scoped Team read, never
via any lookup-by-email capability.

## 22. Direct-Firestore result

**PASS, confirmed by a real architectural test, not just a manual grep.** A pre-existing,
recursive `apps/web/src/business/dashboard/noDirectFirestore.test.ts` (from Package B) scans every
non-test `.ts`/`.tsx` file under the Dashboard directory for the string `"firebase/firestore"` — it
automatically covers `TeamManagementPage.tsx` without modification. Verified directly with a
mutation test (§24, mutation 8): introducing a real `firebase/firestore` import into
`TeamManagementPage.tsx` was caught by this exact test, not merely by an incidental jsdom crash.

## 23. Stitch-invention audit

**PASS, re-confirmed independently against the raw `code.html` text content** (not trusted from the
implementation report): "PROGRES" wordmark not carried into the shipped screen (uses the existing
shell chrome only); the `more_vert` per-member menu, "Resend" action, and invented "Admin"/"Editor"
roles with fabricated capability descriptions are all absent from the shipped code, confirmed by
both static grep and the new e2e "never exposes... an unsupported Resend/role-edit action" test.

## 24. Mutation-testing evidence

Nine deliberate mutations applied to `TeamManagementPage.tsx`, one at a time, each fully reverted
before the next (confirmed byte-identical via `diff` after every revert):

| # | Mutation | Result before this review's fixes |
|---|---|---|
| 1 | Active-member email fallback (`membership.displayName ?? "unnamed-member@example.com"`) | **Caught** — 1 test failed |
| 2 | Fabricated Display Name (`?? "Team Member"`) | **Caught** — 1 test failed |
| 3 | Invitation shown as active Staff (`pendingInvitations = invitations` unfiltered) | **Caught** — 1 test failed |
| 4 | Unsupported Resend action added | **NOT CAUGHT** — all 19 tests still passed |
| 5 | Unsupported role-change action added to `MemberRow` | **Caught** — 1 test failed (via the Owner-no-buttons test) |
| 6 | Invite failure rendered with no `MutationError` (false success) | **Caught** — 1 test failed |
| 7 | Revoke failure rendered with no `MutationError` (false success) | **NOT CAUGHT** — all 19 tests still passed |
| 8 | Direct `firebase/firestore` import | **Caught** — by the pre-existing `noDirectFirestore.test.ts`, not the component's own suite |
| 9 | Raw `membershipId` rendered in a member row | **Caught** — 1 test failed |

**Two genuine test-coverage gaps found (mutations 4 and 7)** — both closed with new tests
("never renders an unsupported Resend action anywhere on the page"; "shows a revoke failure without
implying success, and leaves the invitation state unchanged"), each independently re-verified to
fail against its corresponding mutation before being confirmed to pass against the real,
unmutated code. All nine mutations were re-run against the corrected test suite after adding the
two new tests to confirm they are now all caught (re-confirmed for 4 and 7 specifically).

## 25. Findings

1. **CI regression (real, not flaky):** `dashboard-shell-harness.spec.ts`'s pre-existing
   language-switching test asserted `getByRole("heading", { name: "Team" })`, which is a
   case-insensitive substring match by Playwright default — Package F's own, correctly-governed
   `<h2>Team members</h2>` heading made this locator ambiguous (matches both the `<h1>` and the
   `<h2>`), failing CI on every run. The production heading hierarchy itself is correct
   (Phase L requires exactly this `h1`/`h2` structure); the pre-existing test's locator was simply
   under-specified for a screen that used to have only one heading.
2. **Missing real-browser Playwright coverage for Package F entirely** — the implementation report
   explicitly disclosed this ("Playwright was not additionally invoked"), relying only on manual
   screenshots. This is why the CI regression above was never caught before the PR was opened, and
   why the 390×844 breakpoint (explicitly required by this review's own Phase K) had no automated
   coverage at all.
3. **Revoke-confirmation double-submit guard missing** (§8) — not a security defect (idempotency
   key reuse already protects the backend effect) but a real UI-consistency gap against the
   Invite button's own established pattern.
4. **Focus not restored after closing either inline sub-flow** (§19) — a genuine accessibility
   defect, verified directly against `document.activeElement` in a live browser, not merely
   inferred from the presence of native focusable elements.
5. **Two genuine unit-test coverage gaps** (§24, mutations 4 and 7) — an unsupported "Resend"
   action and a silently-succeeding revoke failure could both have been introduced without any
   existing test noticing.

None of these findings are Package H-scope, none touch a backend contract, and none required
un-doing any of the original implementation's actual product decisions (identity display, allowed
actions, exclusions) — every finding is a coverage/correction gap in how those decisions were
verified, not a wrong decision.

## 26. Corrections

- `tests/e2e/dashboard-shell-harness.spec.ts`: added `exact: true` to the three heading-name
  assertions in the language-switching test, so it matches only the real `<h1>` (production markup
  unchanged — this is a test-locator fix, not a copy change).
- `apps/web/src/business/dashboard/TeamManagementPage.tsx`: added
  `disabled={revokeMutation.isPending}` to both revoke-confirmation buttons; added focus-restoration
  (`inviteButtonRef`/`revokeButtonRefs`, each paired with a `useEffect` that focuses the trigger
  button when its sub-flow closes) for both the invite form and the revoke confirmation.
- `apps/web/src/components/ui/formPrimitives.tsx`: extended the shared `Button` primitive to accept
  an optional `ref` (React 19 supports `ref` as an ordinary prop on function components) — a
  minimal, additive, backward-compatible change with no effect on any of its other call sites
  (confirmed by the full, unchanged-elsewhere web unit suite, §27).
- `apps/web/src/business/dashboard/TeamManagementPage.test.tsx`: added 4 new tests (double-submit
  guard, revoke-failure display, no-Resend, both focus-restoration cases).
- `apps/web/src/dev/dashboardHarness/DashboardHarnessPage.tsx`: added one long-Display-Name member
  and one long-email invitation to the dev-only, zero-network fixture, so real overflow could be
  verified against real content rather than only short strings.
- `tests/e2e/dashboard-team-harness.spec.ts` (new): 9 tests covering 375×812, 390×844, 768×1024,
  desktop shell/content/invite/revoke, and EN/FR — the dedicated per-package Playwright spec every
  other Dashboard package (B/C/D) already had, which Package F was missing entirely.

No production behavior governed by `ENG-P3-002-UI-RECON-001`/`FD-P3-002-G-001`/
`FD-IDENTITY-DISPLAY-001` was changed — every correction either fixes a test, adds test coverage,
or fixes a genuine but narrow implementation defect (double-submit guard, focus restoration) within
Package F's own already-authorized scope.

## 27. Full validation

- **Focused Package F unit tests:** `TeamManagementPage.test.tsx` — 24/24 passing (was 19; +4 from
  the mutation-testing gaps and the focus-restoration fix, +1 net from the double-submit test).
- **Full web unit suite:** 96/96 files, **652/652 tests passing** (was 96/650 before this review's
  additions).
- **Full functions unit suite:** 145/145 files, 1583 tests, unchanged (no `functions/` file
  touched).
- **Full Firebase Emulator Suite:** `firebase emulators:exec "cd functions && pnpm run
  test:emulator"` (project alias `dev`) — 53/53 files, **722 passed, 2 skipped, 0 failed** — run
  before the final web-only fixes (focus restoration, `formPrimitives.tsx`), which do not touch
  `functions/` and cannot affect this result; re-confirmed unaffected by the full, unchanged
  functions unit-suite re-run after those fixes.
- **Playwright e2e:** **32/32 passing** (23 pre-existing + 9 new Team-specific tests) — this is the
  exact suite CI runs; the original CI-failing run is now fixed and independently re-verified
  locally.
- **Web typecheck:** clean (before and after the `formPrimitives.tsx`/`TeamManagementPage.tsx`
  changes).
- **Functions typecheck:** clean, unchanged.
- **Web build:** succeeds (pre-existing chunk-size advisory only).
- **Lint:** 0 errors (1 pre-existing, unrelated warning, unchanged).
- **Format:** clean after one `prettier --write` pass on this review's own edited files.
- **Secret scan:** `git diff` scanned for credential/token/key/PEM patterns — clean (the only
  matches are a test-fixture literal, `mem-secret-uid-1`, used specifically to assert it never
  renders, and this document's own prose).
- **No flakes observed:** every suite above was run to completion at least twice during this review
  (once before, once after corrections) with identical pass counts each time.

## 28. Files modified during review

- `apps/web/src/business/dashboard/TeamManagementPage.tsx`
- `apps/web/src/business/dashboard/TeamManagementPage.test.tsx`
- `apps/web/src/components/ui/formPrimitives.tsx`
- `apps/web/src/dev/dashboardHarness/DashboardHarnessPage.tsx`
- `tests/e2e/dashboard-shell-harness.spec.ts`
- `tests/e2e/dashboard-team-harness.spec.ts` (new)
- This report and the `docs/changes/IMPLEMENTATION_CHANGES.md` entry.

No other file touched. No `functions/`, Rules, Firebase configuration, or dependency file was
modified.

## 29. Final diff summary

6 files changed on top of the original PR's `8fb7ba5` (5 modified, 1 new), all additive or narrowly
corrective: +164/-9 lines (component + test + primitive + harness + one e2e-locator fix), plus the
new 139-line Team-specific Playwright spec. No existing callable, hook, DTO, route, or governed
copy string was removed or changed in meaning — every original implementation decision (identity
display rules, allowed actions, exclusions) stands unchanged; this review only tightened
verification and fixed two narrow, bounded UI defects (double-submit guard, focus restoration) plus
one test-locator fix.

## 30. Commands executed

```
git fetch origin
gh pr view 193 --json ...
gh pr checks 193
gh run view <run-id> --log-failed
git worktree add <path> 8fb7ba5c5f04c21bbc1e36572586f694e30bc9b3
git merge-base --is-ancestor <Package G SHA> HEAD
pnpm install --frozen-lockfile
pnpm exec vitest run src/business/dashboard/TeamManagementPage.test.tsx   (baseline, then per-mutation RED, then GREEN, repeated)
pnpm exec vitest run src/business/dashboard/noDirectFirestore.test.ts
pnpm --filter web test
pnpm --filter web typecheck
pnpm --filter functions typecheck
pnpm --filter functions test
pnpm run lint
pnpm run format:check / prettier --write <files> / pnpm run format:check
pnpm --filter web run build
pnpm exec playwright install chromium --with-deps
pnpm run test:e2e                                                        (baseline failing, then fixed, then re-run clean, repeated)
firebase use dev
firebase emulators:exec "cd functions && pnpm run test:emulator"
git diff | grep -inE "api[_-]?key|secret|password|..."
(real-browser: preview_start a local Vite dev server against this worktree, navigate to
 /dev/dashboard-harness/team, verify document.activeElement before/after each fix)
```

## 31. Dependencies/config/Firebase/Rules changes

None. No `package.json` dependency added or changed, no `firebase.json`/`firestore.rules`/
`firestore.indexes.json`/Storage Rules touched, no environment variable added.

## 32. Merge SHA

`da46e15871ab427edf429bc4f2b40d677c0f39b5` — merge commit for PR #193 into `main`
(`gh pr merge 193 --merge`), confirmed via `gh pr view 193 --json mergeCommit,mergedAt,state`
(`state: MERGED`).

## 33. Closure-sync SHA

Recorded in this same commit — see the companion commit for branch
`docs/eng-p3-002-ui-imp-f-review-closure-sync`.

## 34. Post-merge CI

**PASS.** GitHub Actions run `33157259347` against `main`'s post-merge head
`da46e15871ab427edf429bc4f2b40d677c0f39b5` completed with `conclusion: success` (`gh run view
33157259347 --json status,conclusion`).

## 35. Risks

- **`formPrimitives.tsx`'s `Button` ref support is new, shared surface area** — though additive and
  backward-compatible (confirmed by the full, unaffected web unit suite across every other `Button`
  consumer), any future change to this primitive should preserve the optional, non-breaking nature
  of the `ref` prop.
- **The dev-harness's added long-identity fixtures are development-only, build-time-eliminated
  code** (same `import.meta.env.DEV` gate as every other harness route) — no production risk, but
  future packages extending this harness should keep adding obviously-synthetic long values rather
  than real-looking ones, to avoid ever being mistaken for real data.
- **No true dialog/modal primitive still exists in this codebase** — the focus-restoration fix
  follows the WAI-ARIA disclosure pattern (return focus to the trigger), which is correct for an
  inline-toggle interaction but is not identical to full modal focus-trapping. This matches what
  Phase L's own checklist actually requires for this interaction shape and is not a deferred gap.

## 36. Rollback

Revert this review's merge commit — every correction is additive or narrowly scoped (one
`disabled` attribute pair, one small focus-restoration effect pair, one optional `ref` prop on a
shared primitive, one e2e-locator specificity fix, new tests) — no existing behavior, contract, or
governed copy string is removed, so a revert cannot break any other caller and cleanly restores the
pre-review state (which would, however, still have the pre-existing CI failure and both defects
this review found).

## 37. Review-report path

`docs/05-implementation/reports/ENG-P3-002-UI-IMP-F-REVIEW-independent-review-report-2026-08-28.md`
(this document).

## 38. Package F final status

**Independently reviewed, corrected, and merged.**

## 39. Package H status

Not started. No Package-H file created or modified by this review.

## 40. ENG-P3-002 status

**Open.** Not closed by this review.

## 41. Capability 3 status

**Open.** Not closed by this review.

## 42. Exact next Founder action

None required for this PR's own closure — it is merged per this repository's established
implementation-PR convention (independent review complete, all findings corrected, full validation
clean, CI green on the final head). The Founder's next decision remains, as before,
**whether/when to authorize Package H** (hosted deployment/Founder QA of the full
Establishment→Dashboard→Team experience) — not requested or implied by this review's completion.

---

## FINAL GATE

**PACKAGE F MERGED AND CLOSED — TEAM MANAGEMENT UI READY FOR PACKAGE H INTEGRATION / FOUNDER QA**
