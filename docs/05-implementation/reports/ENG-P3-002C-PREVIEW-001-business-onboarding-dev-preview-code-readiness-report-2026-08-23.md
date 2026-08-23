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

## 23. CI result

Draft PR [#160](https://github.com/Fkenogo/11THONUS/pull/160), head `f23f95d`. First CI run
(`32636542420`) failed on a single, unrelated test:
`functions/src/domains/business/repositories/businessRepository.emulator.test.ts` ›
`bootstrapBusiness — idempotency` › "handles concurrent same-key, same-request calls without
creating duplicate side effects" — `Error: Test timed out in 5000ms`. This PR makes **zero**
changes under `functions/` (confirmed via `git diff origin/main HEAD -- functions/` — 0 lines),
and this failure matches the same disclosed class of environmental/timing flake already recorded
elsewhere in `docs/changes/IMPLEMENTATION_CHANGES.md` (e.g. the `ITM-D`/`CAP-P2-G2-001` entries'
`idempotencyService.emulator.test.ts` timeout, reproduced as clean on immediate rerun with no code
change). Re-ran via `gh run rerun 32636542420 --failed`: **passed clean, 5m24s.** No code changed
between the two runs. PR is `OPEN`/`MERGEABLE`.

---

## §24. Independent Final Review, Correction & Merge

- **Date:** 2026-08-23. **Entry:** PR #160 reconfirmed `OPEN`/`DRAFT` (undrafted at merge, see
  below), head `dc2a05323708eff89d198a05b652b62b83d6d913`, CI `success` on that exact SHA
  (confirmed via `gh api …/commits/<sha>/check-runs`), no later unreviewed commits. DEV Firebase
  state re-verified read-only and unchanged since §1–2: still only `authenticate` deployed, still
  only the `live` Hosting channel. Review performed in a fresh detached-HEAD `git worktree` at the
  exact head, separate from the primary checkout, which was left untouched throughout.
- **Re-derivation:** `App.tsx`, `founderQaPreviewGate.ts`, `FounderQaPreviewSignInRoute.tsx`,
  `viteBuildModes.ts`, `vite.config.ts`, `package.json`, and the full PR diff were read directly
  from the clean worktree, not taken on the prior report's authority.
- **Gate-duplication finding (F2, fixed):** the two expressions — `App.tsx`'s literal
  `import.meta.env.*` ternary and `founderQaPreviewGate.ts`'s
  `isFounderQaPreviewBuildEnabled` — were confirmed **exactly equivalent**: the same three
  exact-string comparisons (`previewFlag === "true"`, `mode === "founder-qa-preview"`,
  `projectId === "eleventh-on-us-dev"`), same order, same constants. The duplication is required —
  collapsing them into one runtime function call at the `App.tsx` site would defeat Rollup's static
  dead-code elimination (§7/§H below). The prior comment calling the helper the "single source of
  truth" was inaccurate: the helper is never called at that site, so it cannot be the thing that
  actually governs behavior there. **Fixed**: `App.tsx`'s comment now states the literal condition
  is what actually governs the gate, and the helper is a separately-tested *reference
  representation* of the identical logic — and explicitly documents that the two can drift silently
  since nothing wires them together, mitigated by manual/review sync plus the extended build-matrix
  check below.
- **Drift-detection result:** per the task's own instruction, no new automated build-inspection
  machinery was added (none exists for the pre-existing `test-harness`/`sign-in-preview` builds
  either — the established repo convention is a manually-run, report-disclosed `pnpm build` +
  `grep dist/` check, and adding a parameterized runtime wrapper around the `App.tsx` literal would
  weaken the exact static-elimination property being verified). Instead, the practical drift check
  was **extended to the full matrix at real build level**, directly against the literal `App.tsx`
  expression (not merely the mirrored pure helper):
  - `--mode founder-qa-preview`, correct project, **`VITE_ENABLE_DEV_AUTH_PREVIEW=false`** →
    `grep dist/` for every preview marker: **zero matches** (route absent).
  - `--mode founder-qa-preview`, correct flag, **`VITE_FIREBASE_PROJECT_ID=eleventh-on-us-staging`**
    (wrong project) → **zero matches** (route absent).
  - `--mode founder-qa-preview`, correct flag + project (positive case, re-confirmed) →
    `dist/assets/FounderQaPreviewSignInRoute-*.js` chunk present.
  - Ordinary `pnpm build` (no preview env involved at all) → **zero matches**, PWA
    (`dist/sw.js`/`workbox-*.js`) present as expected.
  - `--mode sign-in-preview` re-built and reconfirmed unaffected by the `viteBuildModes.ts` change:
    `dist/sign-in-preview.html` present, 79 modules only, no `/business` route module, no PWA.
- **Fail-closed matrix:** re-confirmed via the existing 9-case `founderQaPreviewGate.test.ts` suite
  (missing/empty/`"false"`/malformed flag; wrong project incl. `eleventh-on-us`,
  `eleventh-on-us-staging`, `demo-11thonus`; wrong mode incl. `production`, `development`,
  `sign-in-preview`, `test-harness`) **plus** the two additional real-build cases above, which the
  original report had not build-tested directly (it had build-tested only the "no flag at all"
  and "fully correct" extremes). No coercive/truthy logic found anywhere in either expression.
- **Build-mode review:** confirmed unchanged — `founder-qa-preview` uses the ordinary `index.html`
  (`htmlEntryForMode` returns `undefined`), `/business` route modules remain in the main chunk, PWA
  is excluded for all three preview modes via the (correctly) wider `isTemporaryPreviewMode` check,
  `test-harness`/`sign-in-preview` behavior is unchanged, and the ordinary production build still
  includes PWA as before. One additional finding (F1/F2, fixed): `vite.config.ts`'s top comment
  still described only "two dedicated hosted builds" and claimed every other build is "completely
  unaffected" — stale as of the `viteBuildModes.ts` change, since `founder-qa-preview` is a third
  mode that *is* affected (PWA exclusion) even though it keeps the ordinary HTML entry. Corrected to
  describe all three modes and the HTML-entry/PWA-exclusion distinction accurately. `vite.config.ts`
  itself was otherwise untouched by PR #160 — this was a genuine, source-grounded documentation
  defect introduced as a side effect of the `viteBuildModes.ts` change, not a hypothetical concern.
- **Authentication composition:** `FounderQaPreviewSignInRoute` confirmed to reuse
  `SignInPreviewPage`/`createSignInActions` unmodified, produce a real Firebase-authenticated
  principal (no hardcoded `userId`/`customerIdentityId` anywhere in the component or its test),
  navigate to `/business` only from the `onSignedIn` callback (which `SignInPanel` invokes only on
  genuine successful sign-in), and perform no backend identity-resolution bypass. No finding.
- **Production exposure — merge gate:** re-run and reconfirmed (see drift-detection bullets above).
  **PASS.**
- **Env/secret review:** re-confirmed no password, test-user credential, service-account secret, or
  private key anywhere in source, this report, or `docs/changes/IMPLEMENTATION_CHANGES.md`. The one
  local env file with a Firebase client API key (public config, not a secret, by Firebase's own
  design) remains gitignored (`apps/web/.gitignore:13`) and was never staged (confirmed via
  `git status --short` returning empty for that path throughout, including during the four
  additional builds above).
- **Normal build safety:** re-ran a real `pnpm build`/`npx vite build` with no Founder-QA env
  present at all — succeeded, preview entry structurally absent (see above). Not relied on unit
  tests alone.
- **Test quality:** `FounderQaPreviewSignInRoute.test.tsx`'s positive case asserts
  `screen.getByLabelText(en.auth.signIn.emailLabel)` — a real DOM element rendered by the actual
  `SignInPanel` composition, not a stub — genuinely proving the real sign-in surface renders, not a
  vacuous truthy check. `App.test.tsx`'s new fail-closed case asserts the absence of the "Sign-in
  preview" heading at `/dev/founder-qa-sign-in` in the ordinary test environment (Vitest's `MODE`
  is `"test"`, never `"founder-qa-preview"`), which is a genuine negative assertion, not a
  tautology. `viteBuildModes.test.ts` asserts concrete return values per mode against the module's
  documented contract (isolation, PWA exclusion), not a restatement of its own if-branches with no
  independent expectation. No weak test found; none corrected.
- **Repo-wide lint/format:** reconfirmed pre-existing and unrelated — `.claude/worktrees/**`
  (~2M files, left over from prior agent runs, predating this task) is excluded from neither
  ESLint's `ignores` nor `.prettierignore`. Not modified under this task, per instruction. Recorded
  here again as hygiene debt, not fixed. Scoped `eslint`/`prettier --check` against every file
  touched by the review corrections (`App.tsx`, `vite.config.ts`): clean.
- **Scope audit:** `git diff --stat` for the review's own corrections touches exactly
  `apps/web/src/App.tsx` and `apps/web/vite.config.ts` (comments only, zero logic changed — the
  `FOUNDER_QA_PREVIEW_ENABLED` expression and `htmlEntryForMode`/`includePwaForMode` bodies are
  byte-identical to before). Zero changes to `functions/src`, `firestore.rules`, `firebase.json`,
  `.firebaserc`, `storage.rules`, Commerce Knowledge, Terms config, backend authorization, or
  production auth behavior. No deployment performed.
- **Full validation (re-run fresh after corrections):** focused preview-gate/route/build-mode tests
  and the full web suite — **503/503 passed**, 78 files; typecheck (both packages) clean; scoped
  lint/format on the corrected files clean; ordinary build clean; `founder-qa-preview` build clean
  (all four matrix builds above); secret scan clean. Functions unit suite not re-run in this review
  pass (zero `functions/` changes exist anywhere in this PR, already exhaustively confirmed in §10
  of the original report and by this review's own `git diff --stat`).
- **Findings classification:** two findings, both **F2 (maintainability/documentation
  accuracy)** — the inaccurate "single source of truth" wording, and the stale `vite.config.ts`
  "two dedicated builds" comment. Both are source-grounded (found by direct inspection, not
  speculative) and both were fixed. **Zero F3 (architecture/integrity) or F4 (security) findings.**
  No unresolved material finding of any severity.
- **Merge:** PR marked ready for review (`gh pr ready 160`), then merged via
  `gh pr merge 160 --merge --delete-branch` — a regular merge commit, matching this repository's
  established convention (every prior merge on `main` is a "Merge pull request #N from …" merge
  commit, confirmed via `git log --merges`, never a squash) — see the exact merge SHA and
  post-merge verification recorded in the next commit to this report / `docs/changes/IMPLEMENTATION_CHANGES.md`.
- **Deployment package definition for the next Founder authorization** (unchanged in substance from
  §22, restated as the exact post-merge handoff): deploy, from the exact merged SHA, only (1) the
  15 onboarding-only Cloud Functions callables to `eleventh-on-us-dev`; (2) the governed Burundi
  Commerce Knowledge seed via a one-off local script invoking the existing
  `runCommerceKnowledgeSeed`, run twice to prove idempotency; (3) a DEV-only Firebase Auth test
  identity (mechanism reported, never the credential); (4) a `founder-qa-preview` Hosting preview
  channel (`firebase hosting:channel:deploy eng-p3-002c-founder-qa --project eleventh-on-us-dev`);
  (5) the browser smoke journey against the resulting URL. No source change should be mixed into
  that deployment unless a new defect is discovered during it. `platformConfig/businessTerms`
  stays absent — no action.
- **Status (unchanged by this review):** `ENG-P3-002C-PREVIEW-001` = preview-auth code merged,
  deployment not yet performed. `ENG-P3-002C` = integration validation merged; DEV preview not yet
  available; Founder QA pending. `ENG-P3-002` = Open — blocked on DEV preview/Founder QA and
  `DEC-LEGAL-002`. Capability 3 = Open — partially implemented; not closed.
- **Primary worktree:** `/Users/theo/11THONUS` untouched throughout this review — all independent
  verification performed in a separate `git worktree` at the exact PR head; the primary checkout's
  own working branch received only the two corrected files, committed and pushed normally.
- **Risks:** unchanged from §19, plus: the gate-duplication drift risk is now explicitly documented
  rather than implicitly assumed; mitigation is manual/review sync (no shared runtime reference is
  safe to introduce without weakening the static-elimination guarantee).
- **Rollback:** unchanged — entirely additive; `git revert` the merge commit; no schema, data, or
  deployed resource to unwind.

## Final gate

**ENG-P3-002C-PREVIEW-001 CODE MERGED AND CLOSED — DEV DEPLOYMENT AWAITS FRESH FOUNDER AUTHORIZATION**
