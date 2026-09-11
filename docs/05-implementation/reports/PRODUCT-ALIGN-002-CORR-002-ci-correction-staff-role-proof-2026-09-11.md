# `PRODUCT-ALIGN-002-CORR-002` — CI Correction, Staff-Role Routing Proof

**Date:** 2026-09-11
**PR:** [#244](https://github.com/Fkenogo/11THONUS/pull/244) (`main` ← `worktree-agent-a9452c5e6d9185e3f`)
**Prior approved-review head under correction:** `d5515f317b8c9b2e6f77b5d3002f57795407a8e3`
**New pushed head:** `40c595d412dc18638da7b06f632db75af2d72c4c`

## Purpose

Make PR #244 reviewable by correcting the CI failure at its exact head and adding one requested, narrowly-scoped test-coverage gap. No scope broadening, no architecture change, no touch to `DEC-LOY-009`/`DEC-LOY-008`, the Loyalty Number/QR deferral, Business-access discovery architecture, Customer/Business context selection behavior, Terms fixture fail-closed guards, authentication-provider architecture, or PostgreSQL/Supabase work.

## 1. Files modified

- `tests/e2e/emulator/seedTestOnlyTermsFixture.mjs` — Prettier formatting only.
- `apps/web/src/business/onboarding/BusinessResolverPage.test.tsx` — one new test.
- `tests/e2e/app-shell.spec.ts` — assertion corrected.
- `docs/00-governance/documentation-changes-log.md` — Entry 212 added.
- This report (new).

## 2. Diff summary

**Commit `beb342a`** (2 files, 29 insertions, 1 deletion):
- Reformatted `seedTestOnlyTermsFixture.mjs`'s multi-line `authEmulatorHost` guard condition per Prettier's line-wrap rule. Zero semantic change — confirmed by diffing before/after content aside from whitespace/line-break placement.
- Added `BusinessResolverPage.test.tsx` test: `"routes an active staff member to the Business dashboard alongside Personal"` — asserts a `role: "staff"` entry with `status: "active"` renders both the `"Personal"` link (→ `/customer`) and the business link (→ `/business/b-3/dashboard`) with visible `"Staff"` role text.

**Commit `40c595d`** (1 file, 6 insertions, 3 deletions):
- `tests/e2e/app-shell.spec.ts`: replaced the assertion `getByRole("heading", { name: "11thONUS — Engineering Foundation" })` (the `AppShell` placeholder `PRODUCT-ALIGN-002` already removed from `/`) with `getByRole("heading", { name: "Sign in" })` (the real `SignInPage` heading an unauthenticated browser session sees at `/` today, via `RootEntry`). Added an explanatory comment. No application behavior changed.

## 3. Commands executed (local)

| Command | Result |
|---|---|
| `pnpm format:check` | ✅ pass |
| `pnpm typecheck` (functions + web) | ✅ pass |
| `pnpm lint` | ✅ pass (1 pre-existing unrelated `react-refresh/only-export-components` warning in `BusinessApiContext.tsx`) |
| `pnpm --filter web test` | ✅ 748/748 passing, 106 files |
| `pnpm --filter functions test` | ✅ 1652/1652 passing |
| `pnpm emulators:validate` | ✅ 760 passed, 2 pre-existing disclosed skips, 0 failed |
| `pnpm --filter web build` | ✅ pass |
| `pnpm exec playwright test --project=chromium tests/e2e/app-shell.spec.ts` | ✅ 1/1 passing (confirms the fix before pushing) |
| `pnpm test:e2e` (full chromium + chromium-dashboard-harness) | ✅ 32/32 passing |

## 4. GitHub CI result

- Run: [34587413161](https://github.com/Fkenogo/11THONUS/actions/runs/34587413161)
- Head: `40c595d412dc18638da7b06f632db75af2d72c4c`
- Workflow: `CI` / Job: `Build, Lint, Test, Emulator Validation`
- **Conclusion: SUCCESS** — all 17 executed steps green: Set up job, Checkout, Set up pnpm, Set up Node, Install dependencies, Build, Lint, Format check, Typecheck, Unit/component tests, Install Playwright browsers, Playwright e2e, Set up Java, Verify Java runtime, Firebase Emulator Suite validation, Upload failure diagnostics (skipped — no failure), Complete job.

An intermediate run ([34586959859](https://github.com/Fkenogo/11THONUS/actions/runs/34586959859), head `beb342a`) failed at the Playwright e2e step — this surfaced the previously-hidden stale `app-shell.spec.ts` assertion (see §2), which format:check had always masked by failing first on every prior run. That failure was corrected in commit `40c595d` and the subsequent run is fully green.

## 5. Staff-role test result

`BusinessResolverPage.test.tsx`'s new test passes, proving: an actor-scoped `getAccessibleBusinesses` result containing an active `role: "staff"` membership is (a) included (not filtered out), (b) rendered with a visible "Staff" role label, and (c) routed to `/business/:businessId/dashboard` — the same governed path already proven for `manager`. Combined with the pre-existing backend-layer `"staff"` coverage in `businessReadService.emulator.test.ts`, the literal `"staff"` role is now proven at both the service and client-routing layers.

## 6. Dependencies added

None.

## 7. Config changes

None.

## 8. Risks

- None introduced. Both fixes are corrections to test/tooling artifacts, not application behavior.
- The `app-shell.spec.ts` fix depends on `SignInPage`'s heading text (`t("entry.signInTitle")` = `"Sign in"`) remaining stable; if that copy changes, this e2e test will need a matching update (same coupling every other text-based e2e assertion in this suite already has).

## 9. Rollback

Revert commits `40c595d` and/or `beb342a` on branch `worktree-agent-a9452c5e6d9185e3f`, or simply do not merge PR #244. No infrastructure, production config, or shared state was touched.

## 10. Exact new head SHA

`40c595d412dc18638da7b06f632db75af2d72c4c`

## 11. Changed files since `d5515f3`

```
apps/web/src/business/onboarding/BusinessResolverPage.test.tsx | 24 ++++++++++++++++++++++
tests/e2e/app-shell.spec.ts                                     |  9 +++++---
tests/e2e/emulator/seedTestOnlyTermsFixture.mjs                 |  6 +++++-
3 files changed, 35 insertions(+), 4 deletions(-)
```

No unrelated files changed — confirmed via `git diff --stat d5515f3...HEAD` and `git status --short` (clean) after each commit.

## 12. Review comments/threads

None present on PR #244 at the time of this report (`gh api repos/Fkenogo/11THONUS/pulls/244/reviews` and `.../comments` both returned zero).

## Final disposition

**`PRODUCT-ALIGN-002-CORR-002` COMPLETE — READY FOR FINAL INDEPENDENT REVIEW**
