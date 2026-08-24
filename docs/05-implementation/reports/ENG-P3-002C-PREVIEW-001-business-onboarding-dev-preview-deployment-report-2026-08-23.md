# ENG-P3-002C-PREVIEW-001-DEPLOY-001 — Business Onboarding DEV Deployment & Hosted Preview: Deployment Report

**Date:** 2026-08-23
**Task:** `ENG-P3-002C-PREVIEW-001-DEPLOY-001`. Authorized to modify `eleventh-on-us-dev` only. Not
authorized to touch production/staging, resolve `DEC-LEGAL-002`, or begin `ENG-P3-003`.
**Outcome: BLOCKED at the browser-smoke-validation step (Phase L/N).** Functions deployment and
Commerce Knowledge seed succeeded and are safe/idempotent. The Hosting preview channel deployed
successfully but the app fails to boot on it — a genuine, previously-undetected integration defect,
not a deployment-process failure. No DEV Auth QA identity was created (correctly withheld per Phase M,
since preview connectivity never succeeded). No source code was changed by this task.

## 1. Pre-deploy entry gate

- `origin/main` fetched and confirmed at `948b0498b20a67921fa947aeac9f6cc979626d4c`, exactly as
  expected. PR #160 merge (`5e37c76`) and PR #161 merge (`948b049`) both confirmed ancestors.
  CI green on both.
- Deployment performed from a fresh `git worktree` at that exact SHA
  (`/private/tmp/.../scratchpad/deploy-eng-p3-002c-preview-001`), confirmed `git status --short`
  clean throughout. `/Users/theo/11THONUS` untouched except for this report and the checklist
  update (committed separately, see §12).
- `.firebaserc`: `dev` → `eleventh-on-us-dev` confirmed. `firebase.json` functions/hosting config
  confirmed unchanged from the reviewed source.
- **Active/default Firebase project confirmed to be the bare `eleventh-on-us`** (via
  `firebase_get_environment`), not `eleventh-on-us-dev` — every single Firebase CLI/MCP command in
  this task explicitly passed `--project eleventh-on-us-dev` (functions deploy, seed script,
  Hosting channel deploy, `artifacts:setpolicy`). No command relied on the active/default project.

## 2. Pre-deploy state snapshot (baseline)

- **Functions:** only `authenticate` (`europe-west1`, v2 callable, nodejs20, 256MB) — unchanged
  from every prior verification in this workstream.
- **Hosting:** only the `live` channel (`https://eleventh-on-us-dev.web.app`, never expires).
- **Firestore top-level collections:** `authenticationReferences`, `idempotencyRecords`,
  `outboxEntries`, `users` — no Commerce Knowledge collections.
- **`platformConfig/businessTerms`:** confirmed absent (`firestore_get_document` → not found).
  Required to stay absent per Phase F — never created, never touched by this task.
- **DEV Auth provider config / existing QA identity:** not separately queried (no identity was
  ever created — see §9, so nothing to verify against).

## 3. Function inventory (Phase C — corrected from the historical "15" figure)

Derived from `functions/src/index.ts` exports **and** cross-checked against every
`httpsCallable(functions, "…")` call site under `apps/web/src/business/api/*.ts` (excluding
tests). The exact, final onboarding-required list — **13 net-new deploys**, not 15:

`createBusiness`, `updateBusinessProfile`, `updateBusinessBranchProfile`,
`submitBusinessForVerification`, `getOwnedBusinesses`, `getBusinessContext`,
`listBusinessCategories`, `listBusinessTypesForCategory`, `createStaffInvitation`,
`revokeStaffInvitation`, `listStaffInvitations`, `listStaffMemberships`, `acceptBusinessTerms`.

Plus the already-deployed `authenticate` = **14 total** onboarding-required functions in DEV after
this deploy. **`closeBusiness` deliberately excluded** — exported in source but not consumed by any
frontend Business API adapter, per the task's explicit instruction not to deploy it unless
genuinely consumed. `linkAuthenticationProvider`, `unlinkAuthenticationProvider`,
`recoverAuthenticatedIdentity`, and `ping` also deliberately excluded — unrelated to the onboarding
preview.

## 4. Pre-deploy validation (all from the exact deployment SHA)

- `pnpm install --frozen-lockfile` clean.
- Web unit tests: **503/503 passed**, 78 files.
- Functions unit tests: **1563/1563 passed**, 143 files.
- Emulator validation (`firebase emulators:exec … "pnpm --filter functions test:emulator"`):
  **683/685 passed, 2 skipped, 0 failed** (52 files) — no flake hit this run.
- Typecheck (both packages): clean.
- Lint (`pnpm run lint`, repo-wide — ran clean in this pristine worktree, unlike the primary
  checkout which is polluted by ~2M leftover files under `.claude/worktrees/**`): **0 errors**, 1
  pre-existing unrelated warning (`BusinessApiContext.tsx` fast-refresh notice).
- Format check (repo-wide): clean.
- Ordinary `pnpm build`: clean, PWA service worker generated as expected.
- `pnpm run build:founder-qa-preview`: clean — verified the preview-route chunk present, `/business`
  route modules present, DEV project ID embedded, zero `TEST_ONLY` markers, zero PWA artifacts,
  zero staging/bare-prod project leakage.
- Playwright e2e (`pnpm run test:e2e`): **1/1 passed** (`app-shell.spec.ts`).
- Secret scan (source + built `dist/`): zero matches for private keys, service-account markers, or
  credentials.

No known functional failure blocked deployment at this stage.

## 5. Commerce Knowledge seed (Phase G)

Existing DEV Firestore had no Commerce Knowledge collections — clean to load. Used the smallest
safe invocation: a temporary, **never-committed** TypeScript script
(`functions/scripts-tmp-seed-runner.ts`, deleted immediately after use, confirmed via
`git status --short` to have left zero trace) run with `npx tsx`, calling the existing, already
emulator-tested `runCommerceKnowledgeSeed(db, BURUNDI_PILOT_SEED_MANIFEST, { now })` against a
`firebase-admin` app explicitly initialized with `projectId: "eleventh-on-us-dev"`, authenticated
via local Application Default Credentials (no production credentials used, no credential written
anywhere).

- **First run:** exit 0. `manifestVersion: "burundi-pilot-v1"`. **27 created, 0 unchanged, 0
  reconciled** — the full governed Burundi pilot manifest (6 Industries, 14 Business Categories,
  7 Business Types under `cat_salon`), exactly as authored by `ENG-P3-001B`. No expanded content,
  no invented translations, no Reward Program Categories, no Terms content.
- **Second run (idempotency proof):** exit 0. **0 created, 27 unchanged, 0 reconciled** — byte-for-byte
  the same 27 node IDs reported unchanged, zero duplication, zero conflict.
- No existing DEV Knowledge data conflicted with the manifest (none existed).

## 6. Functions deployment (Phase H)

- **First deploy attempt** (`firebase deploy --only "functions:createBusiness,functions:updateBusinessProfile,…(13 names, comma-joined)" --project eleventh-on-us-dev --non-interactive`)
  created `createBusiness` successfully, then **halted** on a non-code, first-time-2nd-gen-deploy
  condition: "No cleanup policy detected for repositories in europe-west1" (Artifact Registry has
  no image-retention policy yet for this region — a routine, expected condition on the very first
  2nd-gen Cloud Functions deploy to a region, not a code or security defect). Per Phase H, stopped
  and reported the exact partial state before retrying: `firebase functions:list` showed
  `authenticate` + `createBusiness` only.
- **Remediation:** ran `firebase functions:artifacts:setpolicy --project eleventh-on-us-dev --location europe-west1 --force`
  once — a one-time, DEV-project-only Artifact Registry housekeeping action (image cleanup after 1
  day), not a code change, not in the task's non-scope list, and the standard Firebase-recommended
  resolution for this exact condition. Result: "Successfully set up cleanup policy that deletes
  images older than 1 days."
- **Remaining deploys:** issued in two further batches (12 functions total, using repeated
  `functions:<name>` targets per invocation — a single comma-list inside one `functions:` prefix
  was observed to deploy only the first name in this environment, so each target was listed with
  its own `functions:` prefix instead, which deployed correctly). All 12 succeeded — every "creating
  Node.js 20 (2nd Gen) function …" line paired with a "Successful create operation" line, zero
  failures.
- **Exact commands:**
  ```
  firebase deploy --only "functions:createBusiness,functions:updateBusinessProfile,functions:updateBusinessBranchProfile,functions:submitBusinessForVerification,functions:getOwnedBusinesses,functions:getBusinessContext,functions:listBusinessCategories,functions:listBusinessTypesForCategory,functions:createStaffInvitation,functions:revokeStaffInvitation,functions:listStaffInvitations,functions:listStaffMemberships,functions:acceptBusinessTerms" --project eleventh-on-us-dev --non-interactive
  firebase functions:artifacts:setpolicy --project eleventh-on-us-dev --location europe-west1 --force
  firebase deploy --only "functions:updateBusinessProfile,functions:updateBusinessBranchProfile,functions:submitBusinessForVerification,functions:getOwnedBusinesses,functions:getBusinessContext,functions:listBusinessCategories,functions:listBusinessTypesForCategory,functions:createStaffInvitation,functions:revokeStaffInvitation,functions:listStaffInvitations,functions:listStaffMemberships,functions:acceptBusinessTerms" --project eleventh-on-us-dev --non-interactive
  firebase deploy --only "functions:updateBusinessBranchProfile,functions:submitBusinessForVerification" --project eleventh-on-us-dev --non-interactive
  firebase deploy --only "functions:getOwnedBusinesses,functions:getBusinessContext,functions:listBusinessCategories,functions:listBusinessTypesForCategory,functions:createStaffInvitation,functions:revokeStaffInvitation,functions:listStaffInvitations,functions:listStaffMemberships,functions:acceptBusinessTerms" --project eleventh-on-us-dev --non-interactive
  ```
  (The batching reflects the retry/remediation sequence above, not an intended design — the final
  post-deploy inventory in §7 is what matters.)
- **Post-deploy `firebase functions:list --project eleventh-on-us-dev`** — all 14 expected
  functions present, all `v2` callable, `europe-west1`, `nodejs20`, 256MB, no unrelated function
  newly created (`closeBusiness`, provider-link/recovery functions, `ping` all absent from DEV).
  Production untouched throughout (never targeted).

## 7. Final post-deploy function inventory

`acceptBusinessTerms`, `authenticate`, `createBusiness`, `createStaffInvitation`,
`getBusinessContext`, `getOwnedBusinesses`, `listBusinessCategories`,
`listBusinessTypesForCategory`, `listStaffInvitations`, `listStaffMemberships`,
`revokeStaffInvitation`, `submitBusinessForVerification`, `updateBusinessBranchProfile`,
`updateBusinessProfile` — 14 functions, all `europe-west1`/`nodejs20`/`v2 callable`/256MB.

## 8. Preview frontend env & build (Phases I–J)

- Real DEV web-app SDK config fetched fresh via `firebase apps:sdkconfig web <appId> --project eleventh-on-us-dev`
  (app `11thONUS Web`, `1:709450867178:web:191ba4b9b50be870a99293`) — not taken from memory.
- `.env.founder-qa-preview.local` created in the deployment worktree only: confirmed via
  `git check-ignore -v` (matched by `apps/web/.gitignore:13`, the pre-existing `*.local` rule) and
  an empty `git status --short` for that path throughout — **never committed, never staged.**
- `pnpm run build:founder-qa-preview`: clean. Verified: `FounderQaPreviewSignInRoute-CyrSNmK9.js`
  chunk present, `/business` route modules present in the main chunk, DEV project ID
  (`eleventh-on-us-dev`) embedded, zero `TEST_ONLY` markers, zero PWA artifacts
  (`sw.js`/`registerSW.js`/`manifest.webmanifest` all absent), zero staging/bare-prod project
  leakage. **Deployment build SHA: `948b0498b20a67921fa947aeac9f6cc979626d4c`** (the exact
  reviewed `origin/main`, no local modification).
- One process note: an intermediate `pnpm run test:e2e` invocation (§4) rebuilt `dist/` with an
  ordinary production build as a side effect of its `webServer` config, overwriting the
  founder-qa-preview build. **Rebuilt fresh immediately before the Hosting deploy** (§9) and
  re-verified identical output hashes (deterministic build) before deploying — the artifact
  actually deployed to Hosting was re-confirmed correct, not the stale ordinary build.

## 9. Hosting preview channel (Phase K)

```
firebase hosting:channel:deploy eng-p3-002c-founder-qa --project eleventh-on-us-dev --expires 7d --non-interactive
```

- **Channel:** `eng-p3-002c-founder-qa`
- **Preview URL:** `https://eleventh-on-us-dev--eng-p3-002c-founder-qa-8lho2gn4.web.app`
- **Expiry:** 2026-08-30 15:34:37
- **Deployed SHA:** `948b0498b20a67921fa947aeac9f6cc979626d4c`
- The `live` channel confirmed unaffected (`hosting:channel:list` shows its last-release time
  unchanged at 2026-07-21, only the new named channel has a fresh release). URL confirmed to
  resolve (200 responses for `/`, `/assets/*`, and `/dev/founder-qa-sign-in` — the SPA rewrite
  correctly serves `index.html` for the preview route).

## 10. Auth preview entry — BLOCKED (Phase L)

Opened the preview URL and navigated to `/dev/founder-qa-sign-in` in a real browser. **The entire
application fails to boot** — not just the new route. Console:

```
Uncaught Error: App Check site key is required outside development (VITE_APP_CHECK_SITE_KEY is not
set). Refusing to initialize without App Check protection in a non-development environment.
  at apps/web/src/infrastructure/firebase/appCheck.ts (bundled: index-tozh6D6C.js)
```

**Root cause, traced precisely:** `main.tsx` calls `initializeFirebasePlatform(getAppEnv())`
synchronously before any React rendering. That function initializes Firebase App Check
(`initializeFirebaseAppCheck`), which **throws** whenever `siteKey` is missing and `isDev` (i.e.
`import.meta.env.DEV`) is `false` — by design, per `appCheck.ts`'s own comment: "a misconfigured
non-development build must fail closed, not boot unprotected." No `europe-west1` App Check site
key has ever been provisioned for `eleventh-on-us-dev` (registering one is explicitly a
Founder-authorized infrastructure action per that same file's comment, not something this task's
scope or tooling can do). `founder-qa-preview` is a real `vite build` (`import.meta.env.DEV` is
always `false`), so this throw is unconditional for this build mode as currently architected.

**Why the prior code-review (`ENG-P3-002C-PREVIEW-001`, PR #160) did not catch this:** every
verification performed there was build-output *inspection* (`grep dist/` for route/chunk markers)
— never an actual browser load against a live, non-emulated Firebase project. The isolated
`sign-in-preview.html` build (the pre-existing `AUTH-PREVIEW-READINESS-001` precedent this task's
architecture was modeled on) **deliberately avoids** `initializeFirebasePlatform`/App Check
entirely — its own `signInPreviewPlatform.ts` doc comment says so explicitly, for exactly this
reason. `FounderQaPreviewSignInRoute` was designed to reuse the *ordinary* `main.tsx`/`App.tsx`
bootstrap (specifically so the real `/business` routes would be reachable, not just sign-in) — but
that reuse also pulled in the App-Check-gated shared root the isolated build was built to avoid.
This is a genuine architectural gap introduced by this workstream's own design choice, not a
pre-existing repository defect and not a Terms/legal issue.

**Per this task's explicit governance ("if a runtime defect was discovered: STOP and create a
separate correction path instead… a newly-discovered source defect must go through PR/review
first"), no source change was attempted here.** Deployment stopped at this point.

## 11. Downstream phases not executed (Phases M–P)

- **Phase M (DEV QA identity):** **not created.** Per the task's own instruction ("do not create the
  QA identity until the preview/auth route and Functions deployment are both confirmed working"),
  and since preview connectivity never succeeded, no identity was fabricated. Nothing to roll back
  here.
- **Phase N (hosted smoke journey):** not performed — blocked at step 1 (open preview URL / reach
  sign-in). Cannot proceed without a working App Check resolution.
- **Phase O (server-side Terms):** not applicable — no DEV Terms config was touched, consistent
  with the requirement regardless of the blocker.
- **Phase P (security check):** partially satisfiable from what was observed — the preview only
  ever reached `eleventh-on-us-dev` endpoints (no production/staging Firebase calls observed in
  network traffic before the crash), no credentials were exposed in console/network, Firestore
  Rules were never modified (confirmed via `git diff --stat` on the deployment worktree — zero
  changes to `firestore.rules`). The "preview sign-in gate cannot activate in ordinary production
  build" property was already independently re-verified during the PR #160 review (build-matrix
  grep checks) and is unaffected by this finding — the gate itself works correctly; the app simply
  cannot boot at all on this build mode until the App Check issue is resolved, which is a stricter
  failure than the gate not activating, not a weaker one.

## 12. Founder QA checklist update

`docs/05-implementation/reports/ENG-P3-002C-founder-qa-checklist-2026-08-22.md` updated with the
real preview URL, channel, SHA, and expiry, and an explicit notice that the checklist **must not
be attempted against that URL yet** — the page is currently blank. No QA identity, no password,
recorded. Founder QA status remains **PENDING** (not marked complete, as instructed).

## 13. Files modified

- `docs/05-implementation/reports/ENG-P3-002C-founder-qa-checklist-2026-08-22.md` (updated)
- `docs/05-implementation/reports/ENG-P3-002C-PREVIEW-001-business-onboarding-dev-preview-deployment-report-2026-08-23.md` (this file, new)

No runtime source code changed. `functions/scripts-tmp-seed-runner.ts` was created and deleted
within the disposable deployment worktree only — never part of any commit, never pushed.

## 14. Commands executed

See §5, §6, §8, §9 for the exact Firebase/seed commands. Additionally: `git fetch origin`,
`git worktree add … 948b049`, `pnpm install --frozen-lockfile`, `pnpm run typecheck`,
`pnpm --filter web run test`, `pnpm --filter functions run test`, `pnpm run emulators:validate`,
`pnpm run lint`, `pnpm run format:check`, `pnpm --filter web run build`,
`pnpm run build:founder-qa-preview` (×2, after the e2e rebuild), `npx playwright install chromium --with-deps`,
`pnpm run test:e2e`, `firebase apps:list --project eleventh-on-us-dev`,
`firebase apps:sdkconfig web … --project eleventh-on-us-dev`, browser navigation/console/network
inspection against the deployed preview URL.

## 15. Dependencies/config changes

None in the repository. One DEV-project-level infrastructure change: an Artifact Registry cleanup
policy for `europe-west1` container images (§6) — housekeeping only, reversible, does not affect
functions/hosting behavior.

## 16. Firebase deployment changes

- **Functions:** 13 new callables deployed to `eleventh-on-us-dev` (§6–7). None deployed to
  staging/production.
- **Hosting:** one new preview channel (`eng-p3-002c-founder-qa`) deployed to `eleventh-on-us-dev`
  (§9). Live channel untouched.
- **Firestore:** 27 Commerce Knowledge documents created (§5). `platformConfig/businessTerms`
  untouched (still absent). Firestore Rules unchanged.
- **Auth:** no user created.

## 17. DEV data changes

27 Commerce Knowledge nodes (governed Burundi pilot manifest, idempotent, reversible by deleting
those specific documents if ever needed — not done, not requested). No other Firestore writes.

## 18. PR number

None — this deployment task made no source changes requiring a PR. The two documentation files in
§13 are committed directly (see the next commit), per the task's own allowance ("documentation
updates may be committed on a bounded branch… do not mix new runtime code into the
deployment-report PR").

## 19. CI result

Not applicable to this task (no code PR opened).

## 20. Status (Phase U)

- **`ENG-P3-002C-PREVIEW-001`** = preview-auth code merged (unchanged from the prior task); **DEV
  deployment attempted — functions and seed live, Hosting preview channel live but currently
  non-functional (App Check boot failure); Founder QA cannot begin yet.**
- **`ENG-P3-002C`** = integration validation merged; **DEV preview deployed but blocked** — not
  "available" in a usable sense; Founder QA pending.
- **`ENG-P3-002`** = Open — blocked on Founder QA (now further blocked on this App Check defect)
  and `DEC-LEGAL-002`.
- **`ENG-P3-003`** = Not started.
- **Capability 3** = Open — partially implemented; not closed.

`ENG-P3-002` is explicitly **not** closed by this task.

## 21. Risks

- The Hosting preview channel and 14 deployed functions are live and reachable but the frontend
  cannot currently be exercised through the hosted preview at all — not just the new sign-in route.
  Any future attempt to reach `/business` on this exact build (even by direct URL) will hit the
  same App Check crash, since it happens before routing.
- The Artifact Registry cleanup policy change (§6/§15) is a one-time, project-level setting; it
  will also silently apply to any *future* 2nd-gen function deploys to this region — expected,
  intended, not a regression risk.
- No risk to production or staging — neither was targeted by any command in this task.

## 22. Rollback / cleanup

- **Hosting preview channel:** left in place (not deleted) — it is isolated, expires automatically
  2026-08-30, and re-deploying a fixed build to the same channel name is simpler than recreating
  it. To delete early: `firebase hosting:channel:delete eng-p3-002c-founder-qa --project eleventh-on-us-dev`.
- **Functions:** the 13 newly deployed functions are left in place — they are correct, tested,
  harmless (callable only, no destructive side effect from existing), and will be needed again once
  the App Check issue is fixed. Not deleted, per the task's own instruction not to auto-delete
  newly deployed functions absent an explicit rollback request.
- **Seed data:** the 27 Commerce Knowledge documents are left in place — governed, correct,
  reusable, explicitly not to be destructively removed merely to "undo" a preview attempt.
- **DEV Auth identity:** none was created — nothing to clean up.
- **`platformConfig/businessTerms`:** untouched, still absent — correct final state regardless of
  the blocker.

## 23. Persistent deployment report path

This document.

## 24. Exact next Founder action

Authorize a **separate, source-changing correction task** to resolve the App Check boot failure for
the `founder-qa-preview` build mode before Founder QA can begin. Two known candidate approaches
(neither implemented here, both requiring their own RED→GREEN TDD, review, and merge before any
redeploy):

1. **Provision a real `europe-west1` App Check site key** for `eleventh-on-us-dev` (a Founder/
   infrastructure-level action per `appCheck.ts`'s own documented boundary — reCAPTCHA site
   registration is not automatable from this tooling) and pass it via
   `VITE_APP_CHECK_SITE_KEY` in the (still gitignored, still uncommitted)
   `.env.founder-qa-preview.local` at build time.
2. **Restructure `founder-qa-preview`'s bootstrap** to compose `auth`/`functions` the same way
   `sign-in-preview.html` already does (bypassing `initializeFirebasePlatform`/App Check) while
   still mounting the full `App` component and its `/business` routes — a real source change to
   `main.tsx`'s composition root, scoped to this build mode only, needing its own review.

Once corrected and merged, re-run this deployment task's Phases H–T from the newly reviewed SHA
(functions/seed already deployed and idempotent — only the frontend build + Hosting channel
redeploy and the remaining Phases L–T need to be repeated).

## Final gate

**ENG-P3-002C PREVIEW DEPLOYMENT BLOCKED — DEV/AUTH/SEED/INTEGRATION ISSUE REQUIRES REVIEW**

---

## Addendum — 2026-08-23 (`ENG-P3-002C-PREVIEW-001-APPCHECK-001`): App Check Recovery Investigation — STILL BLOCKED, Founder/infrastructure action required

**Original failure preserved above, unmodified.** This addendum records what was investigated to
recover the boot failure, and why it remains blocked — this is not a claim that the preview now
works.

- **PR #162 disposition:** confirmed docs-only, accurate, mergeable — marked ready and merged as
  `ab19344940a8ca219446e3a7d3de05cdcf006d46`. `origin/main` advanced only through that docs merge;
  runtime tree (`functions/src`, `apps/web/src`, `firebase.json`, `.firebaserc`, `firestore.rules`)
  confirmed byte-identical to the previously reviewed `948b049` via `git diff` (0 lines) — the
  reviewed deployment SHA and the current `origin/main` are runtime-equivalent.
- **App Check architecture re-confirmed from source, not from memory:** `appCheck.ts` uses
  `ReCaptchaV3Provider`, keyed on `VITE_APP_CHECK_SITE_KEY`, and throws whenever no site key is
  present and `isDev` is false. Critically re-derived precisely this time: `isDev` here is
  `env.useEmulator` (from `initializeFirebasePlatform`'s call site), not `import.meta.env.DEV`
  directly — and `useEmulator` itself defaults to `import.meta.env.DEV` only when
  `VITE_USE_FIREBASE_EMULATOR` is unset. For the `founder-qa-preview` build (a real `vite build`,
  `DEV=false`, no emulator flag set), this resolves to `isDev=false`, so a site key is mandatory.
  No behavior contradicts the original report's conclusion.
- **Backend enforcement re-confirmed:** `functions/src/index.ts` sets no `enforceAppCheck` option on
  any `onCall`. Independently confirmed via the App Check Admin API's `services` list for this
  project — `firestore.googleapis.com`, `identitytoolkit.googleapis.com`, and
  `firebasestorage.googleapis.com` are all `UNENFORCED`. App Check is therefore purely a
  client-side initialization requirement here, not a server-side gate — Phase M's callable-traffic
  proof reduces to "client-side token acquisition succeeds," since nothing server-side would ever
  reject a request for missing/invalid attestation in the current configuration.
- **Comment staleness (Phase C, not fixed — recorded only):** `appCheck.ts`'s comment still says
  "No `europe-west1` project exists yet" and frames the missing key as a Cloud-Functions-region
  concern. Both are now inaccurate: the DEV project has existed for weeks, and App Check/reCAPTCHA
  configuration is project/web-app/domain-scoped, not Cloud Functions-region-scoped. Classified as
  **F1/F2 documentation debt**, deliberately not touched under this infrastructure-only task.
- **DEV Web App re-confirmed fresh:** `11thONUS Web`, `1:709450867178:web:191ba4b9b50be870a99293`,
  project `eleventh-on-us-dev` — identical to every prior verification, re-fetched via
  `firebase apps:sdkconfig`, not trusted from memory.
- **Existing App Check state — the actual blocker, precisely determined:** queried the Firebase App
  Check Admin API directly (`GET .../apps/{appId}/recaptchaV3Config`, authenticated via local
  Application Default Credentials with an explicit `x-goog-user-project` quota header). The
  resource **exists** but reports no `siteSecretSet` field in its response — per the API's own
  schema documentation, `siteSecretSet` is an output-only boolean that is the *only* way to
  determine whether a site secret was ever set (the secret itself is never returned). Its absence
  from the JSON response means it defaults to `false`: **no reCAPTCHA v3 site secret has ever been
  registered for this app.** The `tokenTtl`/`minValidScore` values returned (`86400s`/`0.5`) are
  the API's own documented defaults, not evidence of prior configuration — Firebase returns a
  default-valued config object on GET even for a never-configured resource. This conclusively
  confirms: **the missing piece is not a frontend build-config oversight — no DEV reCAPTCHA v3 site
  key/secret pair exists anywhere yet.**
- **Why this cannot be provisioned by this task's tooling:** the App Check Admin API's
  `recaptchaV3Config.siteSecret` field is documented as "Required. Input only" — the API only lets
  you *register* an already-obtained secret; it has no method to *generate* a new reCAPTCHA v3
  site key/secret pair. Classic (non-Enterprise) reCAPTCHA v3 site keys are created exclusively
  through Google's interactive reCAPTCHA admin console
  (`https://www.google.com/recaptcha/admin/create`), tied to a signed-in Google account — there is
  no REST/CLI/MCP-automatable path to create one. This is precisely the condition this task's own
  Phase F anticipated: **STOP and give the Founder the exact console click-path and fields.**
- **Hostname requirement determined in advance (Phase G), for the Founder to use directly:** the
  reCAPTCHA v3 site must authorize **both**
  `eleventh-on-us-dev--eng-p3-002c-founder-qa-8lho2gn4.web.app` (the exact current preview channel
  host — not covered by authorizing the live host, they are different hosts) **and**
  `eleventh-on-us-dev.web.app` (the live DEV host, in case it is ever used for App Check-protected
  testing later). Do not add production/staging domains — none are governed or required here. Note:
  the preview channel's subdomain suffix (`8lho2gn4`) is tied to *this* channel instance; if the
  channel is ever deleted and recreated under the same name, Firebase may assign a different
  suffix, which would require re-adding the new host to the reCAPTCHA site's domain list.
- **Exact Founder action required (two steps, ~5 minutes):**
  1. Go to `https://www.google.com/recaptcha/admin/create`, sign in with the Google account that
     administers the `eleventh-on-us-dev` Firebase project. Create a key with: **Label** — e.g.
     `11thONUS DEV App Check`; **reCAPTCHA type** — **reCAPTCHA v3** (not v2, not Enterprise);
     **Domains** — add both hostnames listed above. Submit. This produces a **Site Key** (public)
     and a **Secret Key** (sensitive — never share this with an AI agent or commit it anywhere).
  2. Go to the Firebase Console → `eleventh-on-us-dev` project → **Build → App Check** → find the
     `11thONUS Web` app → **Register** (or **Manage**) → provider **reCAPTCHA v3** → paste the
     **Secret Key** from step 1 into Firebase Console directly (Firebase's own UI performs the
     `siteSecret` registration server-side; the secret never needs to leave the Founder's browser).
     Save.
  3. Hand the resulting **public Site Key only** back for the next deployment task to place in
     `VITE_APP_CHECK_SITE_KEY` inside the gitignored `.env.founder-qa-preview.local` — this value
     is safe to share; it is embedded in the public JS bundle by design.
- **No further phases attempted:** per Phase Q's explicit stop rule, no application source was
  patched to work around the missing key (e.g. no debug-token shortcut, no bypass, no dev-mode
  switch for the hosted preview — all correctly avoided per Phase H). No rebuild, no redeploy, no
  QA identity, no smoke journey. `platformConfig/businessTerms` reconfirmed absent, unchanged.
  Functions (14) and the Hosting preview channel (`eng-p3-002c-founder-qa`, last release still
  2026-08-23 15:34:46, unchanged by this task) both reconfirmed live and untouched by this
  investigation. Zero source code changed. Zero DEV data
  changed.

## Final gate (addendum)

**ENG-P3-002C PREVIEW BLOCKED — DEV APP CHECK CONFIGURATION REQUIRES FOUNDER/INFRASTRUCTURE
ACTION**

---

## Addendum 2 — 2026-08-24 (`ENG-P3-002C-PREVIEW-001-APPCHECK-002`): Preview Recovery Attempt — Boot Fixed, App Check Token Exchange Still Fails (New, Narrower Finding)

**Original failures preserved above, unmodified.** The Founder completed the reCAPTCHA v3
registration described in Addendum 1 (site named "11thONUS DEV App Check", secret registered in
Firebase Console → App Check → `11thONUS Web`; public Site Key
`6Lef_pUtAAAAAHjqQlM45JU420ImjOXpz3j-Q6pb` supplied). This addendum records what was verified,
what improved, and a new, narrower, still-unresolved App Check finding.

- **Entry:** `origin/main` confirmed at `5783aaa40b225c8495baa70e41e6b78a371310aa`; PR #160/#162/#163
  merges all confirmed ancestors; CI green. Work performed in a fresh, now-removed `git worktree`.
- **App Check registration independently confirmed via the Admin API** (not taken on the Founder's
  word alone): `GET .../recaptchaV3Config` for the DEV web app now returns `"siteSecretSet": true`
  (previously absent/false in Addendum 1). `GET .../services` reconfirms **enforcement remains
  UNENFORCED** for Firestore/Storage/Identity Toolkit — no enforcement change made or requested,
  matching this task's explicit constraint.
- **Site key configured** in a fresh, gitignored `.env.founder-qa-preview.local`
  (`VITE_APP_CHECK_SITE_KEY=6Lef_pUtAAAAAHjqQlM45JU420ImjOXpz3j-Q6pb`) alongside the real DEV SDK
  config, re-fetched fresh via `firebase apps:sdkconfig`. Confirmed gitignored and never staged
  throughout (`git check-ignore -v` / empty `git status --short`). Only the public site key was
  used — the secret was never requested, seen, or handled by this task.
- **Build validation:** relevant existing tests (`founderQaPreview`, `App.test.tsx`, `appCheck.test.ts`)
  — 22/22 passed. `pnpm run build:founder-qa-preview` — clean; preview-auth chunk present,
  `/business` routes present, `ReCaptchaV3Provider` present, DEV project ID embedded, the new site
  key embedded, zero `TEST_ONLY` markers, zero secret patterns, zero PWA artifacts (as governed for
  this mode). Ordinary `pnpm build` re-confirmed unaffected — zero preview markers, zero site key,
  PWA present as before. Deterministic rebuild re-verified identical output before deploying.
- **Hosting redeploy:** `firebase hosting:channel:deploy eng-p3-002c-founder-qa --project eleventh-on-us-dev --expires 7d`.
  **Same channel, same hostname** (`https://eleventh-on-us-dev--eng-p3-002c-founder-qa-8lho2gn4.web.app`)
  — the hostname did not change, so no new hostname-authorization question arises. New expiry
  2026-08-31. `live` channel confirmed unaffected (unchanged release time).
- **Real browser boot test — the original defect is fixed:** opened the preview URL in a real
  browser. The application now boots successfully and the Founder-QA sign-in UI renders (Google +
  Email/Password options, EN/FR switcher) — the hard, page-blocking App Check throw from the
  original deployment report is **resolved**. Direct JS introspection confirmed the reCAPTCHA
  script loaded successfully (`www.google.com/recaptcha/api.js` and
  `www.gstatic.com/recaptcha/releases/…`, `window.grecaptcha` defined as an object) with zero
  console errors at boot.
- **New, narrower finding — App Check token exchange itself fails:** attempting the product's
  normal "Create account" flow (email/password) triggered a real App Check token fetch, which
  failed:
  ```
  [error] Failed to load resource: the server responded with a status of 403 ()
  [warn] @firebase/app-check: AppCheck: 403 error. Attempts allowed again after 01d:00m:00s (appCheck/initial-throttle).
  [warn] @firebase/app-check: AppCheck: Requests throttled due to previous 403 error. …
  [warn] @firebase/auth: Auth (12.16.0): Error while retrieving App Check token: FirebaseError: AppCheck: Requests throttled …
  ```
  This is a genuine rejection from the token-exchange backend on the **first** attempt (before any
  throttling existed), not a transient network blip — and the client-side SDK has now
  self-throttled this exact site key for **~24 hours**, so no further retry against it is possible
  from this browser context today regardless of any config fix made in the meantime.
- **Most likely, source-grounded cause:** exactly the risk this task's own Addendum 1 flagged in
  advance — reCAPTCHA v3 domain authorization is almost certainly still scoped to
  `eleventh-on-us-dev.web.app` only, **not** the distinct Hosting-preview hostname
  `eleventh-on-us-dev--eng-p3-002c-founder-qa-8lho2gn4.web.app` actually serving this preview. A
  403 on the very first token-exchange attempt is the textbook symptom of a domain the reCAPTCHA
  site key was never authorized for. This cannot be confirmed or fixed programmatically — the
  classic (non-Enterprise) reCAPTCHA v3 domain allowlist is only editable through the interactive
  `google.com/recaptcha/admin` console for the site's owning Google account; there is no
  service-account-queryable API for it.
- **Because App Check enforcement remains UNENFORCED (by design, unchanged — confirmed above),
  this token-exchange failure did not block the product flow itself:** the "Create account" action
  still succeeded end-to-end — a real DEV Firebase Auth user was created
  (`founder-qa-appcheck002@11thonus-dev-preview.test`, confirmed via a direct, explicit-project
  Identity Toolkit query, not the Firebase MCP's `auth_get_users` tool, which was found to only
  ever query the active/default `eleventh-on-us` project regardless of intent — a tooling
  limitation noted for future tasks, not a DEV/prod mix-up), and the app navigated to `/business` →
  the New Business ("Tell us about your business") form. **This is real, useful evidence that the
  onboarding backend itself works end-to-end** — but it is not evidence that App Check is fixed,
  and per this task's explicit governance ("if App Check still fails: STOP… do not patch around App
  Check"), this is not reported as a clean recovery. No Business document was created (the form was
  reached but not submitted) — confirmed via `firestore_list_collections` showing no new
  `businesses` collection.
- **Stopped here, as governed.** Did not proceed through the full Phase H hosted onboarding smoke
  journey as an "authorized/complete" pass — reaching `/business` happened incidentally while
  diagnosing the App Check token failure, not as a declared, clean Phase F pass. No further QA
  identities created. No workaround, bypass, debug token, or enforcement change attempted.
- **QA identity created (as a side effect, disclosed transparently):** email
  `founder-qa-appcheck002@11thonus-dev-preview.test`, UID `xbI8n0WeKdSlfUc4NtxQohYOPzX2`, created
  via the product's own normal email/password registration flow (real `authenticate` callable, real
  Identity Toolkit user) — not fabricated, no direct Firestore/UID injection. **Password never
  recorded here or anywhere persistent** — it was generated for this session only and is not
  reusable from this report.
- **Security/environment audit:** no secret committed or exposed (confirmed via source + bundle
  scan); only the public site key is browser-visible; no App Check bypass/debug token/enforcement
  change; Firestore Rules unchanged (`git diff --stat` against the deployment worktree shows zero
  changes); no production/staging command issued by this task (every Firebase CLI/MCP/REST call
  explicitly targeted `eleventh-on-us-dev`); no unrelated function/data mutation; no fake Terms
  content — `platformConfig/businessTerms` reconfirmed absent both before and after this task.
- **Files:** this addendum and a matching `IMPLEMENTATION_CHANGES.md` entry. No source code
  changed. The Founder QA checklist was **not** updated to "ready" — App Check token acquisition is
  still broken, so the checklist correctly continues to say do not attempt yet.
- **Exact next Founder action:** verify, in the `google.com/recaptcha/admin` console, that the
  reCAPTCHA v3 key "11thONUS DEV App Check" lists **both**
  `eleventh-on-us-dev--eng-p3-002c-founder-qa-8lho2gn4.web.app` **and**
  `eleventh-on-us-dev.web.app` under Domains — add the preview hostname if it is missing. Because
  of the ~24h client-side throttle already triggered against this exact site key, re-verification
  should be attempted with a fresh browser session (private/incognito window, or simply waiting out
  the throttle) rather than the same session used here.

## Final gate (addendum 2)

**ENG-P3-002C PREVIEW BLOCKED — DEV APP CHECK CONFIGURATION REQUIRES FOUNDER/INFRASTRUCTURE
ACTION**
