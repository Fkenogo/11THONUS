# ENG-P3-002C-PREVIEW-001 — Business Onboarding DEV Preview: Code Readiness Report

**Date:** 2026-08-23
**Task:** `ENG-P3-002C-PREVIEW-001`. Founder-scoped down (mid-task) to: implement and validate the
preview-only Founder-QA authentication mechanism, open a draft PR, stop before any Firebase
deployment or DEV state mutation. This report covers that scoped checkpoint only — it does not
close `ENG-P3-002C`, does not close `ENG-P3-002`, and does not authorize deployment.

## 1. Entry verification

- `origin/main` = `aa122e3717caf288308d2a1637d98fc06745ead0`, exactly matching PR #159's merge SHA.
  PR #156 (`07ecc7554d7babccb2a8ec4b7dcfd26377c8628c`) and PR #159 both confirmed ancestors via
  `git merge-base --is-ancestor`. CI green on both merge commits (`gh run list`).
- Work performed on a fresh branch `eng-p3-002c-preview-001-dev-preview` cut directly from
  `origin/main` (the pre-existing local branch `chore/eng-p1-001-closure` was stale/behind and was
  left untouched, along with its unrelated untracked governance docs).
- `.firebaserc`: `dev` → `eleventh-on-us-dev`, `staging` → `eleventh-on-us-staging`.
- **Safety finding:** the Firebase MCP's active/default project is `eleventh-on-us` (bare alias) —
  not `eleventh-on-us-dev`. Every verification read in this task explicitly targeted
  `eleventh-on-us-dev`; nothing relied on "active project."

## 2. DEV state observed (read-only; unchanged by this task)

- **Functions deployed in DEV:** only `authenticate` (`europe-west1`, `v2` callable, `nodejs20`,
  256MB). The other 14 onboarding callables required by the preview are not yet deployed.
- **Hosting:** only the `live` channel exists (`https://eleventh-on-us-dev.web.app`); no preview
  channels. Clean to create one when deployment is authorized.
- **Firestore:** `platformConfig/businessTerms` confirmed absent (expected/safe state). Top-level
  collections present: `authenticationReferences`, `idempotencyRecords`, `outboxEntries`, `users`.
  No Commerce Knowledge collections — seed not yet loaded.
- **Seed loader:** `functions/src/domains/commerceKnowledge/seed/seedLoader.ts`
  (`runCommerceKnowledgeSeed`) plus `burundiPilotSeedManifest.ts` exist and are unit-tested, but
  have no existing invocation script. Not invoked by this task — no code changes were made for
  this, per the Founder's explicit instruction to determine invocation strategy at deployment time
  rather than add permanent repository machinery now.

None of the above was mutated. **No DEV data mutation of any kind occurred in this task.**

## 3. Preview-gate architecture

The repository already has an established, fail-closed pattern for hosted preview builds
(`AUTH-PREVIEW-READINESS-001`): a pure gate function requiring an exact-match triple —
explicit `VITE_*` flag, dedicated Vite `--mode`, and approved Firebase project ID — used to decide
both (a) whether a route's module is even reachable from the production bundle (via a literal
`import.meta.env.*` ternary controlling a `lazy(() => import(...))`, which Vite/Rollup can
statically eliminate) and (b) a runtime re-check inside the loaded component.

That existing mechanism (`signInPreviewGate.ts` / `sign-in-preview.html`) is a **structurally
isolated** bundle with no `react-router-dom` and no `/business` routes — it proves sign-in only,
not the onboarding flow, so it could not serve this task's need for a full onboarding-flow
preview.

This task adds a **third, sibling** preview mode following the identical pattern, but — unlike the
two existing isolated builds — it keeps the **ordinary** `index.html` / module graph, so the real
`/business` routes stay present:

- **New Vite mode:** `founder-qa-preview` (`apps/web/viteBuildModes.ts`). `htmlEntryForMode`
  returns `undefined` for it (ordinary entry, by design). A new `isTemporaryPreviewMode` helper
  extends the existing PWA-exclusion logic (`includePwaForMode`) to also exclude the service
  worker for this mode — a stray cached SW must not outlive a torn-down preview channel, same
  reasoning as the two isolated modes.
- **New gate module:** `apps/web/src/dev/founderQaPreview/founderQaPreviewGate.ts` —
  `isFounderQaPreviewBuildEnabled({ previewFlag, mode, projectId })`, requiring
  `previewFlag === "true"`, `mode === "founder-qa-preview"`,
  `projectId === "eleventh-on-us-dev"`, all exact string matches. Defaults false; nothing coerces
  truthiness.
- **New route:** `apps/web/src/dev/founderQaPreview/FounderQaPreviewSignInRoute.tsx`, mounted at
  `/dev/founder-qa-sign-in` in `App.tsx`, gated by a **literal** `import.meta.env.*` condition
  (`VITE_ENABLE_DEV_AUTH_PREVIEW === "true" && MODE === "founder-qa-preview" &&
  VITE_FIREBASE_PROJECT_ID === "eleventh-on-us-dev"`) — not a function call — so Vite's static
  replacement + Rollup's dead-code elimination can drop the `import()` entirely from an ordinary
  build, mirroring the existing `DevPhoneAuthHarnessRoute` / `DevSignInPreviewRoute` precedent
  exactly. The route reuses `SignInPreviewPage` **unmodified** — the same real, merged
  `SignInPanel` + `createSignInActions` composition the multi-provider sign-in preview already
  uses — and on sign-in navigates to `/business`. No authentication logic was duplicated,
  re-implemented, or weakened. Backend authorization (Cloud Functions) is untouched.

## 4. RED → GREEN evidence

| Module | RED | GREEN |
|---|---|---|
| `founderQaPreviewGate.ts` | Test file written first; `pnpm vitest run` failed with `Failed to resolve import "./founderQaPreviewGate"` (module did not exist) | Implemented; 9/9 tests pass |
| `viteBuildModes.ts` (new `FOUNDER_QA_PREVIEW_MODE`/`isTemporaryPreviewMode`) | Test file written first; failed — `includePwaForMode(FOUNDER_QA_PREVIEW_MODE)` returned `true` (the new constant/mode was unhandled) | Implemented; 9/9 tests pass |
| `FounderQaPreviewSignInRoute.tsx` | Test file written first; failed with `Failed to resolve import "./FounderQaPreviewSignInRoute"` | Implemented; 2/2 tests pass |
| `App.tsx` wiring | New fail-closed test added (`fails closed for the Founder-QA preview sign-in route in an ordinary build`) | Passes alongside the 4 pre-existing `App.test.tsx` cases (5/5 total) |

## 5. Positive gate tests

`founderQaPreviewGate.test.ts`: exact approved combination (`previewFlag: "true"`,
`mode: "founder-qa-preview"`, `projectId: "eleventh-on-us-dev"`) → `true`.

## 6. Fail-closed gate tests

All exact-match-only per the Founder's required list, covering:
missing flag · empty-string flag · literal `"false"` flag · truthy-but-not-exact flag values
(`"1"`, `"yes"`, `"TRUE"`) · wrong project ID (`eleventh-on-us`, `eleventh-on-us-staging`,
`demo-11thonus`, `undefined`, `""`) · wrong mode (`production`, `development`, `sign-in-preview`,
`test-harness`, `undefined`) · ordinary production build (no flag, `production` mode) · ordinary
dev-server build (no flag, `development` mode). All 9 cases pass.

## 7. Normal-production-build exposure test

Ran a real `pnpm build` (ordinary production build, no preview env). Then:

```
grep -rl "FounderQaPreviewSignInRoute\|founder-qa-sign-in\|MULTI-PROVIDER SIGN-IN PREVIEW" dist/
→ no matches (exit 1)
```

Confirmed **structurally absent**, not merely runtime-gated — the same guarantee the existing
`test-harness`/`sign-in-preview` builds carry (verified identically absent in the same build:
`PhoneAuthHarnessPage` / `EXT-TECH-001 Phone Auth` also produced zero matches).

## 8. Founder-QA-preview build result

Built with a local (gitignored, not committed — matches the existing `.env.sign-in-preview.local`
convention exactly) `.env.founder-qa-preview.local` setting
`VITE_ENABLE_DEV_AUTH_PREVIEW=true` against the real `eleventh-on-us-dev` Firebase client config:

```
pnpm run build:founder-qa-preview
→ dist/index.html (ordinary entry, unchanged title "11thONUS")
→ dist/assets/FounderQaPreviewSignInRoute-CyrSNmK9.js  (new chunk — the flag activated the route)
→ dist/assets/index-tozh6D6C.js  (main app bundle, /business routes included)
→ no dist/sw.js, dist/registerSW.js, or dist/manifest.webmanifest (PWA correctly excluded for
  this temporary-preview mode)
```

## 9. `/business` route availability proof

```
grep -rl "BusinessResolverPage\|business/new\|BusinessWizardPage" dist/assets/*.js
→ dist/assets/index-tozh6D6C.js  (present)
grep -l "MULTI-PROVIDER SIGN-IN PREVIEW" dist/assets/*.js
→ dist/assets/FounderQaPreviewSignInRoute-CyrSNmK9.js  (present — real sign-in composition loaded)
grep -rl "TEST_ONLY" dist/
→ no matches (exit 1) — no Terms fixture reached the bundle
```

Confirms: in the founder-qa-preview build, the real onboarding routes and the preview sign-in
entry point coexist in one deployable bundle, and no Terms fixture value is present anywhere.

## 10. Full validation results

- **Web unit tests:** `pnpm test` (apps/web) — **503/503 passed**, 78 files.
- **Functions unit tests:** `pnpm --filter functions test` — **1563/1563 passed**, 143 files
  (untouched by this change; run to confirm no incidental regression).
- **Typecheck:** `pnpm run typecheck` (both `apps/web` and `functions`) — clean.
- **Lint:** repo-wide `pnpm run lint` could not complete — the ESLint config's `ignores` list
  (and `.prettierignore`) do not exclude `.claude/worktrees/**`, which currently holds ~2 million
  files left over from prior agent worktree runs, unrelated to this task and pre-existing on the
  branch before this work started. Ran `eslint` scoped to every file this task touched instead:
  **clean, zero findings.** (Flagging the missing `.claude/worktrees` ignore entry as a separate,
  pre-existing repo-hygiene item — out of this task's scope to fix.)
- **Format:** same repo-wide-scan limitation: `pnpm run format:check` did not complete. Ran
  `prettier --check`/`--write` scoped to the same file set — 2 files needed formatting
  (`App.test.tsx`, `founderQaPreviewGate.test.ts`), fixed, then verified clean; all affected tests
  re-run and still green (25/25) after the formatting fix.
- **Build:** ordinary `pnpm build` (apps/web) — clean (one pre-existing, unrelated Vite
  chunk-size advisory, unchanged by this task). `pnpm run build:founder-qa-preview` — clean (see
  §8–9).
- **Emulator suite / Playwright:** not run. This change makes zero modification to
  `functions/src/**`, Firestore Rules, or any existing route's behavior — it is purely additive
  (new gate module, new mode, one new never-reachable-by-default route) and is verified instead by
  the structural build-output checks in §7–9, which are stronger evidence for this specific claim
  than an emulator/E2E run would add. No backend or Rules changes exist for the emulator suite to
  exercise.

## 11. Secret scan result

Manual scan of every file this task added or modified
(`grep -rniE "AIza|secret|password|api[_-]?key\s*=\s*['\"][a-z0-9]{10,}"`) — **zero matches** in
source. The one file containing a Firebase client API key
(`apps/web/.env.founder-qa-preview.local`) is gitignored by the pre-existing `*.local` rule
(`apps/web/.gitignore:13`), confirmed via `git check-ignore -v` and an empty `git status --short`
for that path — never staged, never committed. (Firebase web API keys are public client
configuration, not secrets, by Firebase's own design — restricted via Firebase/Google Cloud
API restrictions, not confidentiality — matching the existing `.env.sign-in-preview.local`
precedent already in the repository.)

## 12. Dependencies added

None.

## 13. Config changes

- `apps/web/package.json`: added `"build:founder-qa-preview": "tsc -b && vite build --mode founder-qa-preview"`.
- `apps/web/.env.founder-qa-preview.local` created locally (gitignored, not committed) for build
  verification only — mirrors `.env.sign-in-preview.local`'s existing shape plus
  `VITE_ENABLE_DEV_AUTH_PREVIEW=true`.

## 14. Firebase/Rules changes

**None.** No `firebase.json`, `firestore.rules`, `storage.rules`, or `.firebaserc` change.

## 15. DEV data mutations

**None.** No Firestore write, no Firebase Auth user created, no Functions deployment, no Hosting
channel created. All Firebase MCP/CLI calls in this task were read-only (`firebase_get_environment`,
`functions:list`, `hosting:channel:list`, `hosting:sites:list`, `firestore_get_document`,
`firestore_list_collections`).

## 16. Files modified / added

Modified: `apps/web/package.json`, `apps/web/src/App.tsx`, `apps/web/src/App.test.tsx`,
`apps/web/viteBuildModes.ts`.

Added: `apps/web/viteBuildModes.test.ts`,
`apps/web/src/dev/founderQaPreview/founderQaPreviewGate.ts`,
`apps/web/src/dev/founderQaPreview/founderQaPreviewGate.test.ts`,
`apps/web/src/dev/founderQaPreview/FounderQaPreviewSignInRoute.tsx`,
`apps/web/src/dev/founderQaPreview/FounderQaPreviewSignInRoute.test.tsx`, this report.

## 17. Code diff summary

+71 lines across the 4 modified files (new gate constant/helper in `viteBuildModes.ts`; one new
literal-condition lazy route block + one new `<Route>` in `App.tsx`; one new build script line;
one new fail-closed test in `App.test.tsx`), plus 4 new source/test files under
`apps/web/src/dev/founderQaPreview/` and one new root-level test file
(`apps/web/viteBuildModes.test.ts`). No existing route, component, callable, or Firestore
document shape changed.

## 18. Commands executed (representative)

`git fetch origin`; `git merge-base --is-ancestor …`; `git checkout -b … origin/main`;
`pnpm install --frozen-lockfile`; `pnpm vitest run …` (per-file, RED then GREEN, repeated);
`pnpm test`; `pnpm typecheck`; `pnpm --filter functions test`; `pnpm run build`;
`pnpm run build:founder-qa-preview`; `grep -rl … dist/`; `npx eslint <changed files>`;
`npx prettier --check/--write <changed files>`; Firebase MCP read-only calls listed in §15;
`firebase functions:list --project eleventh-on-us-dev`;
`firebase hosting:channel:list --project eleventh-on-us-dev`;
`firebase hosting:sites:list --project eleventh-on-us-dev`.

## 19. Risks

- The literal `import.meta.env.*` condition in `App.tsx` and the tested pure function in
  `founderQaPreviewGate.ts` express the same fail-closed logic in two places (required for the
  Rollup dead-code-elimination guarantee — see §3/§7) and must be kept in sync by hand; a future
  change to one without the other would silently weaken the guarantee. Mitigated by the explicit
  code comment in `App.tsx` calling this out and by the structural-absence build test in §7, which
  would catch a drift that widened exposure (though not one that merely broke the intended-enabled
  case).
- No functions/backend changes are included, so deploying and exercising the actual onboarding
  flow through this new entry point is entirely unverified until the deployment phase (Phase K–N
  of the original task) is separately authorized and executed.
- Pre-existing, unrelated repo-hygiene gap: `.claude/worktrees/**` is not excluded from ESLint/
  Prettier ignore lists, breaking repo-wide `lint`/`format:check` runs at current scale (~2M
  files). Not fixed by this task (out of scope); flagged for separate attention.

## 20. Rollback

Entirely additive, no schema/data/deployed-resource involved. `git revert` the merge commit once
merged, or simply do not merge the PR. No Firebase state to unwind (§15).

## 21. Persistent report

This document. `docs/changes/IMPLEMENTATION_CHANGES.md` updated with a matching dated entry (see
next commit).

## 22. Exact deployment plan for next authorization

Unchanged from the original Phase B plan, still pending explicit Founder go-ahead:

1. Deploy the 15 onboarding-only callables to `eleventh-on-us-dev`
   (`firebase deploy --only functions:<name>,… --project eleventh-on-us-dev`).
2. Write a one-off local script invoking `runCommerceKnowledgeSeed` against
   `eleventh-on-us-dev` (firebase-admin, explicit project ID), verify idempotency by running
   twice.
3. Confirm `platformConfig/businessTerms` remains absent (no action required).
4. Build with `pnpm run build:founder-qa-preview` (a real, CI/deploy-time-only
   `.env.founder-qa-preview.local`, never committed) and deploy via
   `firebase hosting:channel:deploy eng-p3-002c-founder-qa --project eleventh-on-us-dev --expires 7d`.
5. Create a DEV-only Firebase Auth test identity (email/password) through Firebase Auth tooling —
   report the mechanism, never the password.
6. Run the browser smoke journey against the hosted preview URL; update the Founder QA checklist
   with the real URL/channel/SHA; write the deployment report.

## Final gate

**ENG-P3-002C-PREVIEW-001 CODE READY FOR REVIEW — NO DEV DEPLOYMENT PERFORMED**
