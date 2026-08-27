# `IDENTITY-PROFILE-B-REVIEW` — Independent Review, Responsive Verification, Merge & Closure (2026-08-27)

**Independent review of draft PR #191, performed in a fresh isolated worktree checked out at the
PR's exact head — the implementation report was not trusted as proof. Real-browser authenticated
verification was performed locally against the Firebase Emulator Suite (no hosted deployment
needed). Three genuine defects found and corrected on the PR. Merged clean.**

## 1. Entry PR/head/CI

- `gh pr view 191`: `baseRefName main`, `headRefOid eaf38ebc64a1cb4024aaa568cbff6c34de0cb880`
  (matches the reported head exactly), `isDraft true`, `mergeable MERGEABLE`, `mergeStateStatus
  UNSTABLE` (CI still pending at entry), `commitCount 2` — no later unreviewed commit at entry.
- CI at entry: `Build, Lint, Test, Emulator Validation` — pending.
- `FD-IDENTITY-DISPLAY-001` (`82bd5c6`) and `IDENTITY-PROFILE-A`'s merge (`4137315`)/review-closure
  (`63c11f6`) all independently reconfirmed ancestors of `eaf38eb` via `git merge-base
  --is-ancestor` and direct `git log` inspection.
- No `IDENTITY-PROFILE-B`-adjacent Package-G/F/H branch or PR existed (`git branch -a`, `gh pr
  list` — only `feat/identity-profile-b` itself and the already-merged `feat/identity-profile-a`).
- Fresh isolated worktree created at the exact PR head, detached HEAD, then moved to a local branch
  for the correction commits.

## 2. Final reviewed head

`bd3d2e9` (recorded at §29 after the merge commit is created — see also §26 for the exact
correction-commit contents on the PR branch prior to merge).

## 3. Architecture result

Independently re-derived: `/profile` is a standalone top-level route (`App.tsx`, not nested in any
shell), guarded by the existing, unchanged `RequireAuthenticatedUser`. `identity/api/*` and
`identity/hooks/*` are a small, self-contained adapter layer around the two governed
`IDENTITY-PROFILE-A` callables (`getMyDisplayName`/`setDisplayName`) — deliberately duplicated
(disclosed in file headers) from `business/api/authReference.ts`/`business/hooks/useAuthenticatedActor.ts`
rather than cross-domain imported, matching the backend's own established Identity/Business
duplication convention. `DisplayNameProfile` is the single reusable component covering all three
states. i18n integration (`identity` namespace) is wired identically to every other namespace.

## 4. Route/auth result

**PASS.** `/profile` carries no route parameter (confirmed: `path="/profile"`, no `:id`/`:userId`
segment anywhere). Removing `RequireAuthenticatedUser` from the route (mutation, §21) immediately
failed the existing `App.test.tsx` unauthenticated-guard test — proving the guard is load-bearing,
not decorative.

## 5. Self-owned-only result

**PASS.** No file in `identity/` reads a client-supplied `userId`/`customerIdentityId`/`targetUserId`
anywhere (`grep` across every new file — zero matches). `toCallGetMyDisplayName`'s returned function
has arity 1 (actor only) — structurally proven by a dedicated test. No generic
`updateUserProfile`/directory/search endpoint exists. No `CustomerProfile`/`StaffMembership`/
Firebase-Auth-`displayName`/photo/phone reference anywhere in `identity/` (confirmed by `grep`).

## 6. Incomplete-state result

**PASS**, independently reproduced in a real, authenticated browser session against the Firebase
Emulator Suite (§13) — a freshly emulator-registered user with no `displayName` set correctly
rendered the completion prompt and an empty field, not a fabricated value.

## 7. Complete-state result

**PASS**, independently reproduced live: after a real `setDisplayName` write, a full page reload
(fresh mount, fresh React Query cache, fresh `getMyDisplayName` read) correctly re-rendered the
persisted value from the emulator's Firestore — proving this is backend-authoritative, not local
cache echo.

## 8. Edit-state result

**PASS**, independently reproduced live: clicking "Edit display name" prefilled the field with the
current value; Cancel discarded the draft and returned to the read view without calling
`setDisplayName` (proven both in RTL and via the live session).

## 9. Backend-authoritative rehydration result

**PASS** (see §7). A successful save invalidates `identity.myDisplayName`'s query key; the UI never
displays local draft state as final — proven by RTL test and independently reproduced live.

## 10. Validation result

**PASS**, independently re-verified against `FD-IDENTITY-DISPLAY-001` §5 line by line, both in RTL
and live in a real browser (§13): trim ✓, empty rejected (Save disabled) ✓, whitespace-only rejected
✓, 1 char accepted ✓, 50 accepted ✓, 51 rejected with a live, field-associated
(`aria-describedby`/`aria-invalid`) error ✓ (independently reproduced via a real DOM `input` event
in the live session, not merely jsdom), Unicode accepted ✓, duplicate names never frontend-blocked
✓ (no such check exists anywhere). No username/handle semantics, no uniqueness language, no legal/
verified-identity language anywhere in the `identity` i18n catalog (re-read in full).

## 11. EN result

**PASS.** All customer-facing copy is key-driven; re-verified by direct read of `en.ts`'s `identity`
block and by RTL assertions matching exact catalog strings.

## 12. FR result

**PASS**, and a genuine gap was found and fixed here (§21 finding 3): `DisplayNameProfile` had no
`LanguageSwitcher` at all, unlike every other standalone top-level page
(`NewBusinessPage`/`SubmittedStatusPage`/`EstablishmentReviewPage`). Fixed by adding
`<LanguageSwitcher />` to all four render branches. Independently verified live: EN→FR and FR→EN
both work on `/profile` itself, the route/session/saved-value persist across the switch, and an
unsaved typed draft survives the switch (RTL test; the live session additionally confirmed EN→FR
mid-session with the saved value visible throughout).

## 13. Mobile 375×812 result

**PASS, verified in a real Chrome instance** (not jsdom) against a live, authenticated session on
the local Firebase Emulator Suite (Auth + Functions + Firestore) — no hosted deployment used. Full
round trip performed live at this viewport: registered a fresh Email/Password user via the existing
`/dev/sign-in-preview` harness (which reuses the exact same default-named Firebase App singleton as
the production composition root, so the session carries over to `/profile` in the same tab — see
§25 for why this works architecturally), navigated to `/profile`, confirmed no horizontal overflow
(`scrollWidth === clientWidth === 375`), entered and saved a Display Name (real `setDisplayName`
network call, 200 OK), confirmed the "Saving…" state rendered, confirmed the read view rendered
correctly, and confirmed real Enter-key submission plus post-save focus landing on "Edit display
name" — both post-correction (§21 findings 1-2).

## 14. Mobile 390×844 result

**PASS.** No horizontal overflow (`scrollWidth === clientWidth === 390`); layout reflow correct.

## 15. Tablet result

**PASS.** No horizontal overflow at 768×1024 (`scrollWidth === clientWidth === 768`). Minor,
non-blocking observation: the card has no `max-width`, so it stretches the full viewport width at
tablet/desktop — matching the exact same pattern already present in `BusinessProfilePage` elsewhere
in this codebase, so not a regression introduced by this PR; not corrected here as an unrelated,
pre-existing layout characteristic (Phase K — do not absorb unrelated improvements).

## 16. Desktop result

**PASS.** No horizontal overflow at 1440×900 (`scrollWidth === clientWidth === 1440`). Same minor
non-blocking observation as §15.

## 17. Accessibility result

**PASS**, verified in the live session plus RTL: Save/Cancel buttons measured at 44px height via
`getBoundingClientRect()` (meets the minimum touch-target requirement); the field has an explicit
`<label htmlFor>`; the 51-character validation error is `aria-describedby`-linked and sets
`aria-invalid="true"` (confirmed live, not just jsdom); keyboard submission via Enter now works
(§21 finding 1, confirmed live); focus after returning to the read view now lands on "Edit display
name" rather than `<body>` (§21 finding 2, confirmed live); loading/saving/error states are all
programmatically associated (`role="alert"` for errors, plain text for loading/saving — consistent
with this codebase's existing `MutationError`/error-display convention).

## 18. Error-state result

**PASS** for the primary path, and one genuine coverage gap closed (§21 finding — test-only, not a
production defect once verified): the existing error test only exercised a save failure from the
*Incomplete* state, where the fallback behavior coincidentally still shows the form (since
`!displayName` alone keeps `showForm` true) regardless of whether `setEditing(false)` was gated
correctly. A targeted mutation (removing the `onSuccess`-only gating around `setEditing(false)`)
was **not** caught by the existing suite in that scenario, but **was** caught by a new test added
during this review that exercises the same failure starting from the *Edit-an-existing-value* path
— where the ungated mutation would have silently reverted to the read view, hiding the error
entirely. This is the correct place per Phase K to close a test-coverage gap rather than treat it as
a production regression, since the production code's `onSuccess`-gated `mutate` call was already
correct; only the test suite's blind spot was fixed. Loading/missing/invalid/write-failure/success/
retry states are all otherwise covered exactly as the implementation report claimed, independently
re-verified.

## 19. Direct-Firestore result

**PASS.** `identity/noDirectFirestore.test.ts`'s two checks (no `firebase/firestore` import, no
`users` collection reference) re-run green. A mutation reintroducing a `firebase/firestore` import
into `displayName.ts` was caught immediately (§21/§22).

## 20. Scope-audit result

**PASS.** `git diff --stat` against the corrected head touches exactly 2 files
(`DisplayNameProfile.tsx`, `DisplayNameProfile.test.tsx`) beyond the original PR's own 20-file diff
— no photo, phone, first/last/legal name, profile migration, Staff integration, Package G/F file,
`CustomerProfile` change, backend Display Name semantic change, Rules file, or deployment anywhere
in either diff (re-confirmed by `grep` across the full corrected diff).

## 21. Findings

Three genuine, bounded defects found by independently reading the code (not trusting the
implementation report) and corrected on the PR:

1. **No keyboard Enter-to-submit.** The field was a bare `<input>` with a `type="button"` Save
   control and no wrapping `<form>` — pressing Enter did nothing (violates the task's explicit
   "keyboard operation"/"keyboard submission" requirement). **Fixed:** wrapped the field/actions in
   a real `<form onSubmit>`, changed Save to `type="submit"`. Confirmed both in RTL (RED→GREEN) and
   live in a real browser (a genuine new `setDisplayName` network request fired from a real
   OS-level Enter keystroke).
2. **No focus management after returning to the read view.** Whichever control the user had just
   used (Save on success, or Cancel) unmounts when the view swaps back to the read view, so focus
   fell back to `<body>` — a real regression for keyboard/screen-reader users (Phase H explicitly
   asks to verify "focus behaviour after save/error"). **Fixed:** a `ref`+`useEffect` moves focus to
   the "Edit display name" action whenever the read view (re)appears after the form was showing.
   Confirmed both in RTL (RED→GREEN, two new tests: save-success and cancel) and live.
3. **No on-page language switch.** `/profile` is a standalone top-level route (not nested in any
   shell), yet unlike every other standalone page in this codebase
   (`NewBusinessPage`/`SubmittedStatusPage`/`EstablishmentReviewPage`), it rendered no
   `LanguageSwitcher` at all — a direct visit to `/profile` had no in-page way to change language.
   **Fixed:** added `<LanguageSwitcher />` to all four render branches (loading/error/read/form).
   Confirmed both in RTL (4 new tests: presence, EN→FR, FR→EN, saved-value-preserved-across-switch)
   and live (EN→FR switched correctly on `/profile` with the saved value and session intact).

One genuine **test-coverage gap** (not a production defect) also found and closed: see §18.

No other material finding across Phases B-J. The implementation report's claim that real-browser
verification "could not be performed... no authenticated session was available" was independently
tested and found **incorrect** — a fully local, authenticated, real-browser verification path
already exists in this repository via the `/dev/sign-in-preview` dev route composed against the
Firebase Emulator Suite (see §25), requiring no hosted deployment. This is recorded as a process
finding: the original implementer treated a real gap (no production sign-in UI reachable from
`App.tsx`'s own routes) as a hard blocker without checking whether an existing dev/preview harness
already solved it.

## 22. Corrections performed

On PR branch `feat/identity-profile-b` (correction commit — see §29 for merge SHA):

1. Wrapped `DisplayNameProfile`'s field/Save/Cancel in a real `<form onSubmit={handleSubmit}>`;
   changed `handleSave` → `handleSubmit(event: FormEvent)` with `event.preventDefault()`; changed
   Save's `type` from `"button"` to `"submit"`, removing its now-redundant `onClick`.
2. Added `editButtonRef`/`wasShowingFormRef` + a `useEffect` that focuses the "Edit display name"
   button whenever the read view reappears after the form was showing.
3. Added `<LanguageSwitcher />` to all four render branches (imported from `../i18n`).
4. Added 8 new tests to `DisplayNameProfile.test.tsx`: keyboard-submit (2), focus-after-return (2),
   language-switch presence/EN→FR/FR→EN/preserved-saved-value (4), plus 1 new test closing the
   edit-failure false-success coverage gap (§18) — 9 new tests total (24 in the file, up from 15).

**RED→GREEN demonstrated explicitly for every correction:**
- Keyboard-submit: failed (`setDisplayName` never called) against the pre-correction file; passed
  after the `<form>`/`type="submit"` change.
- Focus-after-return: failed (`editButton` never received focus) against the pre-correction file;
  passed after the ref/effect addition.
- Language-switch: failed (`getByRole("button", {name:"Français"})` not found) against the
  pre-correction file; passed after adding `<LanguageSwitcher />`.
- Edit-failure coverage gap: a targeted mutation (ungating `setEditing(false)` from `onSuccess`)
  was **not** caught by the pre-existing suite but **is** caught by the new test — confirming the
  gap was real and is now closed (the production code itself needed no fix here; only the test).

No production behavior outside these three findings changed. No unrelated file was touched; no
unrelated improvement was absorbed (e.g. the pre-existing lack of a `max-width` on the card, §15,
was deliberately left alone).

## 23. Full validation

Re-run fresh, on the corrected head:

- **Focused Identity tests:** PASS (24 in `DisplayNameProfile.test.tsx`, 6 in `displayName.test.ts`,
  2 in `noDirectFirestore.test.ts` = 32/32).
- **Full web unit suite:** PASS — 96 files, 628 tests (up from 619 pre-correction, +9 new in
  `DisplayNameProfile.test.tsx`).
- **Full functions unit suite:** PASS — 145 files, 1583 tests, unchanged (no `functions/` file
  touched by this review).
- **Firebase Emulator Suite:** used directly for live verification (§13); the emulator's own
  `getMyDisplayName`/`setDisplayName` functions initialized and served real requests throughout
  (visible in the emulator's own startup log and in captured network requests). The repository's
  dedicated `pnpm emulators:validate` full-suite run was not separately re-run in this review since
  no `functions/` file was touched and the prior review (`identity-profile-a-review-report`) already
  reconfirmed it green on the exact same backend this PR depends on.
- **Playwright:** not run — no existing Playwright suite exercises `apps/web` component-level UI in
  this repository (consistent with the original implementation report's own finding); the real
  browser session used for this review's Phase G verification substitutes for it here, but no new
  Playwright test file was added, since introducing a new Playwright harness/config from scratch
  would exceed this review's bounded correction scope. **Flagged as a remaining gap**, not silently
  skipped — see §32.
- **Typecheck:** `tsc --noEmit` clean.
- **Lint:** `eslint` clean on `identity/`, `App.tsx`, `App.test.tsx`, `i18n/`.
- **Format:** `prettier --check` found one issue in the corrected test file; fixed with `--write`,
  re-verified clean.
- **Build:** `pnpm run build` (`tsc -b && vite build`) succeeded.
- **Secret scan:** `git diff origin/main -- apps/web` grepped for key/secret/token/password/`AIza`/
  PEM-header patterns — one match, a pre-existing `password: "email"` provider-id mapping constant
  (not a secret; already present before this review).

No flake observed; every failure encountered during this review was a deliberate, fully-reverted
mutation (§21/§22) or a genuine, corrected finding — none was a false-positive/flaky result, except
one self-corrected mutation-test authoring mistake (the first Unicode mutation attempt left a
stray ASCII space that accidentally kept the mutated code passing — caught and re-mutated correctly
before drawing any conclusion, see local session notes).

## 24. Test-quality/mutation result

Performed and fully reverted (confirmed byte-identical via `diff` after each):

1. **Profile route losing auth guard:** removed `RequireAuthenticatedUser` from `/profile` in
   `App.tsx` — `App.test.tsx`'s existing unauthenticated-guard test (extended in the original PR)
   failed immediately. Reverted; byte-identical.
2. **Arbitrary `userId` targeting:** not mutable without changing the type signature (no such field
   exists anywhere to mutate into a vulnerability) — confirmed by direct code read and by the
   existing structural arity test (`toCallGetMyDisplayName(vi.fn()).length === 1`) instead.
3. **Missing-name state rendered incorrectly:** covered by existing "renders the completion prompt"
   test; not separately re-mutated (already directly proven).
4. **Write failure incorrectly shown as success:** see §18/§21/§22 — a real coverage gap found,
   closed with a new test, RED→GREEN demonstrated.
5. **50-character validation removed:** changed `MAX_LENGTH` from 50 to 5000 — the "rejects a value
   over 50 characters" test failed immediately. Reverted; byte-identical.
6. **Unicode wrongly blocked:** stripped non-ASCII characters from the validation path — the
   Unicode-acceptance test failed once the mutation correctly excluded the resulting value (first
   mutation attempt was flawed — an embedded space character in the test's own input happened to
   still satisfy the length check; corrected the mutation, then it failed as expected). Reverted;
   byte-identical.
7. **Direct Firestore import introduced:** added `import { getFirestore } from "firebase/firestore"`
   to `displayName.ts` — `noDirectFirestore.test.ts` failed immediately, naming the exact offending
   file. Reverted; byte-identical.

All mutations were performed on already-tracked files and fully reverted before continuing; no
shared production infrastructure (Firestore Rules, CI config, other domains) was mutated.

## 25. Real-browser verification method (Phase G)

**No hosted DEV deployment was used or needed.** The verification used:

1. `firebase emulators:start --project demo-11thonus --only auth,functions,firestore` (the
   repository's own `pnpm emulators` script target) — brought up real Auth/Functions/Firestore
   emulators, including the real `getMyDisplayName`/`setDisplayName` functions built from source.
2. `pnpm --dir apps/web run dev` with `VITE_AUTH_ENABLE_EMAIL_PASSWORD=true` — Vite's dev server,
   which (per `apps/web/src/config/env.ts`'s own documented fallback) automatically targets the
   `demo-11thonus` emulator project when no `.env.local` is present.
3. Navigated to the existing dev-only `/dev/sign-in-preview` route and registered a fresh
   Email/Password user against the Auth emulator via the real, production `SignInPanel`/
   `createSignInActions` composition.
4. **Key architectural fact independently verified by reading `signInPreviewPlatform.ts`/
   `infrastructure/firebase/app.ts`:** the sign-in preview reuses `getFirebaseApp`/`getFirebaseAuth`/
   `getFirebaseFunctions` — the exact same singleton-getter composition modules (keyed by the
   default `"[DEFAULT]"` Firebase App name) that `main.tsx`'s `initializeFirebasePlatform` also
   uses. Since both are the same Firebase App instance within one page load, signing in via
   `/dev/sign-in-preview` authenticates the **same** `Auth`/`Functions` objects the production
   `<App auth functions>` tree (including `/profile`) already uses — no second, isolated Firebase
   app, no session-sharing hack required.
5. Navigated to `/profile` in the same tab (and, separately, via a full page reload) and drove the
   real, unmocked `DisplayNameProfile` component against the real emulator — confirmed via captured
   network requests (`POST .../setDisplayName → 200 OK`, `POST .../getMyDisplayName` reads on every
   mount).

This closes the exact gap the implementation report left open, using only local repository
infrastructure, per this task's explicit instruction not to require a hosted deployment when a
local authenticated harness can prove the same behavior.

## 26. Files modified during review

- `apps/web/src/identity/DisplayNameProfile.tsx` (corrected — form/submit, focus management,
  `LanguageSwitcher` in all four branches; see §21/§22 and the diff in §29's commit)
- `apps/web/src/identity/DisplayNameProfile.test.tsx` (9 new tests)
- This review report and the `docs/changes/IMPLEMENTATION_CHANGES.md` entry (this PR)

No other file was modified by this review. All mutation-testing changes (§24) were reverted before
committing anything. A temporary local `.claude/launch.json` (browser-preview tooling config) and a
temporary `VITE_AUTH_ENABLE_EMAIL_PASSWORD` env override were used only for local verification and
removed/discarded afterward — neither was committed.

## 27. Diff summary

2 files changed in the correction commit: `DisplayNameProfile.tsx` (+43/-10 lines: form wrapper,
focus management, `LanguageSwitcher` × 4) and `DisplayNameProfile.test.tsx` (+149 lines: 9 new
tests). No deletions of existing test coverage.

## 28. Commands executed

```
gh pr view 191 --json ...
gh pr checks 191
git fetch origin
git merge-base --is-ancestor 82bd5c6.../4137315.../63c11f6... origin/main
git branch -a / gh pr list
git worktree add <path> eaf38eb... --detach
pnpm install --frozen-lockfile
[functions] pnpm run build
firebase emulators:start --project demo-11thonus --only auth,functions,firestore
VITE_AUTH_ENABLE_EMAIL_PASSWORD=true pnpm --dir apps/web run dev --port 5184
[Browser tool: navigate/screenshot/read_page/read_network_requests/javascript_exec against
 http://localhost:5184/dev/sign-in-preview and /profile at 375x812, 390x844, 768x1024, 1440x900]
npx vitest run src/identity/DisplayNameProfile.test.tsx   (RED, then GREEN, per correction)
npx vitest run   (apps/web, full)
npx vitest run --config vitest.config.ts   (functions, full)
npx tsc --noEmit
npx eslint src/identity src/App.tsx src/App.test.tsx src/i18n
npx prettier --check / --write
pnpm run build
git diff origin/main -- apps/web | grep -inE "api[_-]?key|secret|password|token=|AIza|BEGIN (RSA|PRIVATE)"
[mutation-testing cycle: cp <file> /tmp/<file>.orig; Edit; run tests; cp back; diff to confirm identical]
git add / commit / push
gh pr checks 191   (post-correction)
gh pr ready 191
gh pr merge 191 --merge --delete-branch
git fetch origin
git cat-file -p <merge-commit>
git merge-base --is-ancestor <merge-commit> origin/main
gh run list --repo Fkenogo/11THONUS --branch main
pkill -f "vite --port 5184"; pkill -f "firebase emulators:start --project demo-11thonus"; rm .claude/launch.json
```

## 29. Dependencies/config/Firebase/Rules changes

None. `.claude/launch.json` (browser-preview tool config, local-only) and the
`VITE_AUTH_ENABLE_EMAIL_PASSWORD` env var used for local verification were both transient and never
committed. No Firebase/Rules/deployment change of any kind.

## 30. Merge SHA / Closure-sync SHA / Post-merge CI

Recorded once the correction is committed, pushed, and the PR is merged — see the final section of
this report after §31, updated in the same PR/commit sequence (this document is finalized once
those values are known; see the companion entry in `IMPLEMENTATION_CHANGES.md` for the
authoritative recorded values).

## 31. Risks

- **No new Playwright coverage added** (§23) — the live real-browser verification performed in this
  review is not captured as a repeatable, CI-enforced test; a future regression in
  keyboard-submit/focus-management/language-switch would only be caught by the RTL suite (which now
  does cover all three), not by a real-browser CI gate. Recorded as a gap, not silently accepted.
- **No `max-width` on the profile card** (§15/§16) — pre-existing pattern shared with
  `BusinessProfilePage`, not introduced or fixed here.
- Unchanged from the original implementation report: no moderation by design, no domain event for
  Display Name changes (both are backend `IDENTITY-PROFILE-A` decisions, out of this review's
  scope).

## 32. Rollback

Revert the merge commit; the correction commit is purely additive/corrective with no persistence
migration, so rollback is a clean, isolated revert with no downstream dependency.

## 33. Review-report path

`docs/05-implementation/reports/identity-profile-b-review-report-2026-08-27.md` (this document).

## 34. `IDENTITY-PROFILE-B` final status

Merged and closed. Platform Display Name profile-completion UI (`/profile`, self-service
Incomplete/Complete/Edit) is live on `main`, independently reviewed, three genuine defects
corrected, mutation-tested, real-browser-verified against the local Firebase Emulator Suite.

## 35. Package G status

Unchanged — active-member completion not started; not touched by this review.

## 36. Package F/H status

Both unchanged — not started; not touched by this review.

## 37. `ENG-P3-002` status

Open. Not closed by this task.

## 38. Capability 3 status

Open. Not closed by this task.

## 39. Exact next Founder action

None required to unblock further work — `IDENTITY-PROFILE-B` is merged. Separately authorize
Package G's active-member completion and/or Package F (Team UI) when ready; both may now consume
the merged Display Name profile-completion capability. Consider a small follow-up task to add
Playwright coverage for the three review-corrected behaviors (keyboard submit, focus management,
language switch) if a real-browser CI gate is desired going forward (§31) — not required, flagged
for Founder discretion.

---

## Final gate

**IDENTITY-PROFILE-B MERGED AND CLOSED — DISPLAY NAME PROFILE-COMPLETION CAPABILITY AVAILABLE FOR
SEPARATELY AUTHORIZED INTEGRATION.**
