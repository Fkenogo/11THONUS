# `PRODUCT-ALIGN-002` — Product Entry & Identity Routing — Implementation Report

**Date:** 2026-09-11
**Performed by:** Claude (AI agent), isolated worktree/branch
**Scope:** Product-shell integration only. No Reward Program, Purchase, Verification, Verified
Unit, progress, or redemption logic implemented. No Supabase Auth, PostgreSQL, or hosted preview
infrastructure touched. No fabricated purchase/reward/progress/activity/loyalty-number/QR data —
every not-yet-available surface renders an honest empty state.

## 1. Summary

`apps/web/src/App.tsx`'s `/` route rendered a literal "Phase 0 infrastructure scaffold" `AppShell`
placeholder, and no customer-facing shell existed in the codebase. This task:

1. Replaced `AppShell` with a real root resolver (`RootEntry.tsx`) that routes an authenticated
   visitor to `/business` (if they own a business) or the new `/customer` shell (otherwise), and an
   unauthenticated visitor to a real sign-in surface (`SignInPage.tsx`).
2. Built the Customer shell (`apps/web/src/customer/`) with Home · Scan · Rewards · Activity ·
   Account navigation.
3. Recorded two narrow Founder directives (`FD-LOY-009`, `FD-PREVIEW-TERMS-001`) in the Decision
   Register as Notes addenda, per the existing `DEC-SEC-004`/`DEC-SEC-005` precedent.
4. Added a Founder-authorized, emulator-only `TEST_ONLY_FIXTURE_*` Terms seed script and a
   clean-checkout emulator startup flow.

## 2. Files modified

- `apps/web/src/App.tsx` — removed the literal `AppShell`/"Phase 0" placeholder; wired `RootEntry`
  at `/` and `/customer/*` behind `RequireAuthenticatedUser`.
- `apps/web/src/App.test.tsx` — replaced the stale "Phase 0 heading" assertion; added coverage for
  the never-blank loading state, the real sign-in heading at `/`, and the `/customer/*` auth guard.
- `apps/web/src/i18n/config.ts` — registered the new `customer` namespace.
- `apps/web/src/i18n/locales/en.ts` / `fr.ts` — added the `customer` namespace (nav, entry
  loading/error/retry, home not-yet-issued state, per-page stub copy).
- `README.md` — documented `pnpm emulators:clean` and the clean-checkout local startup flow
  (install → build functions → start emulators → seed → web dev server).
- `package.json` — added `emulators:clean` and `seed:test-only-terms-fixture` scripts.
- `docs/00-governance/decisions/decision-register.md` — two Notes addenda (`DEC-LOY-009`,
  `DEC-LEGAL-002`) and the file's own header "Last controlled update"/"Prior update" rotation.
- `docs/00-governance/documentation-changes-log.md` — new Entry 210, header rotation.

## 3. Files created

- `apps/web/src/RootEntry.tsx` — the `/` resolver (auth-state loading → sign-in → business-access
  resolution → redirect).
- `apps/web/src/RootEntry.test.tsx` — resolver routing tests (loading, unauthenticated, owns a
  business, owns none, error+retry, pending).
- `apps/web/src/authentication/SignInPage.tsx` — production sign-in composition (real
  `createSignInActions` + `SignInPanel`, managed reCAPTCHA lifecycle).
- `apps/web/src/authentication/recaptchaLifecycle.ts` — deliberately duplicated from
  `dev/signInPreview/recaptchaLifecycle.ts` (disclosed duplication, matching this repo's own
  `identityCallableClient.ts` precedent) so the production sign-in path does not depend on a
  `dev/`-owned module.
- `apps/web/src/customer/CustomerShell.tsx` — persistent nav + `<Outlet />`, mirroring
  `BusinessDashboardShell`'s layout and no-bottom-bar convention.
- `apps/web/src/customer/CustomerRoutes.tsx` — nested `/customer/*` route table, mirroring
  `BusinessDashboardRoutes`.
- `apps/web/src/customer/CustomerHomePage.tsx` — loyalty number/QR "not yet issued" surface.
- `apps/web/src/customer/CustomerNotAvailablePage.tsx` — generic honest stub (Scan/Rewards/
  Activity/Account).
- `apps/web/src/customer/CustomerShell.test.tsx` — nav (EN/FR) and per-page stub coverage.
- `tests/e2e/emulator/seedTestOnlyTermsFixture.mjs` — Founder-authorized emulator-only Terms
  fixture seed script.

## 4. Code diff summary (prose)

**Root resolver.** `RootEntry` subscribes to `onAuthStateChanged` directly (same primitive as
`RequireAuthenticatedUser`) so it can render its own translated loading state rather than the
existing primitive's `null`-while-loading behavior. Unauthenticated renders `SignInPage`.
Authenticated renders `AuthenticatedEntry`, which calls the existing, unmodified
`useOwnedBusinessesQuery()` — pending → loading text; error → translated error text plus a retry
button calling `query.refetch()`; zero businesses → `<Navigate to="/customer" replace />`; one or
more → `<Navigate to="/business" replace />` (the existing `BusinessResolverPage`, untouched).

**Sign-in.** `SignInPage` mirrors `SignInPreviewPage`'s already-governed composition
(`createSignInActions` + `SignInPanel` + a managed reCAPTCHA verifier for the optional Phone flow)
but drops the preview-only banner/`noindex` logic — it is the real production surface, not a
preview. No authentication logic was duplicated or modified; `SignInPanel`,
`createSignInActions`, `authenticateClient`, `authenticateCallable`, `providerConfig` are all
unmodified.

**Customer shell.** `CustomerShell` copies `BusinessDashboardShell`'s exact layout mechanics
(mobile hamburger menu, desktop sidebar, `NavLink`, focus/Escape handling) for a 5-item nav (Home,
Scan, Rewards, Activity, Account) under `/customer`. `CustomerRoutes` nests `CustomerHomePage` at
the index route and `CustomerNotAvailablePage` (parametrized by translation keys) at `scan`,
`rewards`, `activity`, `account`.

**Loyalty number / QR.** Re-verified by grep immediately before writing `CustomerHomePage`:
`functions/src/domains/loyaltyNumber/services/loyaltyNumberIssuanceService.ts` and
`functions/src/domains/qrIdentity/services/qrIdentityAssociationService.ts` exist but are never
imported/invoked from any registration or authentication service, and `functions/src/index.ts`
exposes no callable referencing either domain. `CustomerHomePage` therefore renders an explicit
"You don't have a loyalty number yet." / "Your loyalty QR code isn't available yet." state — no
number is generated client-side, no QR image (real or placeholder) is rendered. No new Cloud
Function or client callable was added, per task scope.

**i18n.** A `customer` namespace was added to both locales with nav labels, entry-level
loading/error/retry strings, the home not-yet-issued copy, and per-page "not yet available" stub
copy for Scan/Rewards/Activity/Account — no hardcoded English string appears in any new JSX.

**Emulator Terms fixture.** `seedTestOnlyTermsFixture.mjs` mirrors the existing
`seedCommerceKnowledge.mjs` convention (resolve `require` against `functions/node_modules`,
`firebase-admin` against `FIRESTORE_EMULATOR_HOST`). It refuses to run (exit 1, loud stderr message)
unless `FIRESTORE_EMULATOR_HOST` is set and the resolved project id is `demo-11thonus`, then writes
`platformConfig/businessTerms` with `currentVersion: "TEST_ONLY_FIXTURE_BUSINESS_TERMS_v0"` (plus a
`__testOnlyFixture: true` marker and a `seededAt` timestamp). It does not import, reference, or
modify `assertCurrentBusinessTermsAccepted` or any file under
`functions/src/domains/business/services/businessLifecycleCommand.ts`'s production Terms path.

## 5. Commands executed and actual output

```
$ pnpm install
... Done in 9.2s

$ pnpm --filter web typecheck
> tsc -b --noEmit
(clean exit, no output)

$ pnpm lint
> eslint .
apps/web/src/business/BusinessApiContext.tsx
  26:17  warning  Fast refresh only works when a file only exports components ...
✖ 1 problem (0 errors, 1 warning)
```
(pre-existing warning, unrelated to this change — `BusinessApiContext.tsx` was not touched)

```
$ pnpm --filter web test -- --run
 Test Files  105 passed (105)
      Tests  746 passed (746)

$ pnpm --filter web build
> tsc -b && vite build
✓ 2343 modules transformed.
✓ built in 406ms
(dev-only markers — "PhoneAuthHarnessPage", "MULTI-PROVIDER SIGN-IN PREVIEW" — confirmed absent
from dist/assets/*.js by grep)

$ pnpm typecheck   # repo root: functions + web
functions typecheck: Done
apps/web typecheck: Done
```

Emulator/seed verification (manual, not part of the standard `pnpm` scripts):

```
$ node tests/e2e/emulator/seedTestOnlyTermsFixture.mjs
seedTestOnlyTermsFixture: refusing to run — FIRESTORE_EMULATOR_HOST is not set. ...
exit: 1

$ firebase emulators:start --project demo-11thonus --only firestore   # started in background
... All emulators ready!

$ FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node tests/e2e/emulator/seedTestOnlyTermsFixture.mjs
TEST_ONLY_FIXTURE Business Terms seed: platformConfig/businessTerms.currentVersion =
"TEST_ONLY_FIXTURE_BUSINESS_TERMS_v0" (project=demo-11thonus)
exit: 0
```

`functions/src` was not modified, so `pnpm --filter functions test` was not required by task scope
and was not re-run beyond the standard `pnpm typecheck` above (functions typecheck passed clean).

## 6. Dependencies added

None. Zero new npm packages in any workspace.

## 7. Config changes

- `package.json`: added `emulators:clean` and `seed:test-only-terms-fixture` scripts.
- `README.md`: documented the clean-checkout local startup flow.
- No Firestore Rules, Firebase project config, or CI workflow change.

## 8. Governance records changed

`docs/00-governance/decisions/decision-register.md`:

- Header "Last controlled update" rotated to a 2026-09-11 `PRODUCT-ALIGN-002` entry; the prior
  2026-09-10 `AUTH-ARCH-003-CORR-004` entry preserved as "Prior update".
- `DEC-LOY-009` Notes field — appended an addendum recording `FD-LOY-009` (2026-09-11): Founder
  directs `rewardQuantity = 1` as the fixed MVP default. Status **unchanged** (`OPEN_FOUNDER`);
  "Final decision" field **unchanged** (blank) — this narrows only the MVP default and does not
  resolve the decision's broader `rewardQuantity > 1` configurability question.
- `DEC-LEGAL-002` Notes field — appended an addendum recording `FD-PREVIEW-TERMS-001`
  (2026-09-11): Founder authorizes the emulator-only `TEST_ONLY_FIXTURE_*` Terms record for
  local/emulator Founder-preview flows only. Status **unchanged** (`OPEN_LEGAL`); Terms
  configuration **unchanged** (`NOT CONFIGURED` in every real environment).
- `DEC-LOY-008` was **not** touched. The untracked `DEC-LOY-014`/`DEC-LOY-015` references in
  `docs/00-governance/verified-loyalty-principles.md` /
  `verified-loyalty-governance-freeze-v1.md` do not exist in the register and were left alone —
  explicitly out of scope per task instruction.

`docs/00-governance/documentation-changes-log.md`: new Entry 210 (this task); header
"Last controlled update"/"Prior update" rotated accordingly, per Rule 4 of `README.md`.

No other governance document was modified. `master-workflow.md` and `CDR-001` were grepped for any
text directly and provably describing the pre-change root route/`AppShell` behavior; no such text
was found (they describe Phase/Capability status, not the literal root-route component), so neither
was edited — there was no stale claim of this specific kind to correct.

## 9. Tests added and results

- `apps/web/src/RootEntry.test.tsx` (6 tests): never-blank loading, unauthenticated → sign-in
  heading, authenticated+owns-a-business → `/business`, authenticated+no-business →
  `/customer`, error state shows recovery text + retry button, pending state shows loading (never
  blank). All passing.
- `apps/web/src/customer/CustomerShell.test.tsx` (6 tests): EN nav + Home not-yet-issued copy, FR
  nav, and one honest-stub assertion per Scan/Rewards/Activity/Account destination. All passing.
- `apps/web/src/App.test.tsx`: replaced the stale Phase-0-heading test with a never-blank-loading
  test and a real-sign-in-heading test at `/`; added a `/customer/*` auth-guard test. All passing.
- Full web suite: **105 files / 746 tests passing** (up from the pre-existing baseline plus these
  additions).

## 10. Risks

- **"Not yet issued" loyalty/QR state.** Confirmed no issuance path exists today; the UI is
  honest about this. Risk: if a future task wires the callable, `CustomerHomePage` is the one
  place to update — flagged in its own doc comment.
- **Business-vs-customer routing signal gap.** A Staff member with membership but no ownership has
  no client-visible signal today (`listStaffMemberships` needs a `businessId`; no cross-business
  membership-listing callable exists server-side). Such a user currently lands in the customer
  shell. This is a pre-existing gap, not created by this task, and is not fixed here (no new
  callable was authorized).
- **`SignInPage`/`recaptchaLifecycle.ts` duplication.** Deliberate, matching this repo's own
  disclosed-duplication convention, but it does mean two near-identical reCAPTCHA-lifecycle
  modules exist (`dev/signInPreview/` and `authentication/`) that could drift if one changes
  without the other.
- **Root bundle size.** The production build already warns about a >500 kB main chunk (a
  pre-existing condition, not introduced by this task); the new `RootEntry`/`SignInPage`/customer
  code adds to that chunk since none of it is behind an `import.meta.env.DEV`-style dynamic import
  (it is the real production entry, unlike the dev/preview routes it's contrasted with).

## 11. Rollback instructions

Branch: this task's isolated worktree branch (see `git branch --show-current`/`git log` in the
worktree). To discard entirely: delete the branch and remove the worktree
(`git worktree remove <path>`) without merging. No production data, Firebase project, or shared
branch was touched — the only shared-state effect is the two Decision Register Notes addenda and
this changes-log entry, which live only on this task's own commits.

## 12. Documentation-changes-log entry

Per `README.md` Rule 4 ("Any change to a governed document under `docs/` requires an entry in
`documentation-changes-log.md`"), Entry 210 was added recording every governance-document edit made
by this task (the two Decision Register addenda). No other `docs/` file was modified.
