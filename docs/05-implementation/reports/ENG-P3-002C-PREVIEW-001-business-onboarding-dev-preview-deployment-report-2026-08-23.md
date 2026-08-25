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

## Addendum — 2026-08-24 (`ENG-P3-002C-PREVIEW-001-CSP-001`): App Check CSP Correction — Source Fix, Not Yet Deployed

This addendum records the narrowly scoped source correction for the App Check CSP defect
conclusively identified by the separate `ENG-P3-002C-PREVIEW-001-APPCHECK-002` diagnostic (recorded
on the still-open, still-unmerged draft PR #164 at the time this task started — not yet part of
this document's base `origin/main` history, so referenced here by task ID rather than addendum
number to avoid a numbering collision once both land).

- **Entry:** `origin/main` confirmed at `5783aaa40b225c8495baa70e41e6b78a371310aa`; PR #160/#163
  ancestry reconfirmed. Work performed in a fresh, isolated `git worktree`.
- **Confirmed defect before modification:** both existing CSP `connect-src` directives in
  `firebase.json` (for `source: "/index.html"` and `source: "/"`) omit
  `https://firebaseappcheck.googleapis.com` and `https://content-firebaseappcheck.googleapis.com` —
  independently re-verified by direct inspection, not assumed from the prior diagnostic's word.
- **Why two CSP blocks, and whether both needed correction:** Firebase Hosting's header `source`
  glob matches the *original* requested path, not the SPA rewrite's destination — confirmed via
  live `curl` against the deployed preview that a direct/cold request to a client-side route (e.g.
  `/dev/founder-qa-sign-in`) returns **no** CSP header at all, while `/` and `/index.html` both do.
  In practice this doesn't undermine the fix: a browser's document CSP is fixed at whichever
  response was actually navigated to and persists across client-side (`history.pushState`)
  navigation for the rest of that session — and `/`/`/index.html` are the realistic entry points for
  this preview. Both blocks were therefore genuinely in scope and both were corrected identically.
  The separate observation that most SPA sub-routes carry no CSP header at all on a direct/cold
  request is disclosed as an out-of-scope, pre-existing finding — not fixed here, since widening
  the header `source` patterns is a broader change than this task's narrow authorization.
- **Fix strategy:** extend `connect-src` on both blocks with exactly the two required origins.
  Nothing else touched — no `*`, no bare `https:`, no directive removed, no `unsafe-eval`, no
  `script-src` change, no reCAPTCHA/App-Check/Rules change.
- **TDD:** an existing config-validation test module,
  `apps/web/src/infrastructure/hosting/hostingCsp.test.ts` (reads `firebase.json` directly, no
  mocking), already covered this exact class of regression for a different origin
  (`AUTH-PREVIEW-READINESS-001`). Extended it with one new assertion requiring both App Check
  origins in `connect-src` on every declared document route. **RED:** failed against the
  unmodified config (`AssertionError: expected … to contain 'https://firebaseappcheck.googleapis.c…'`),
  all 7 pre-existing assertions still passing. **GREEN:** all 8 pass after the fix.
- **Validation:** web suite 504/504 (one unrelated, pre-existing timing-sensitive perf assertion
  flaked once, reproduced clean on immediate rerun — not caused by this change, confirmed by its
  total unrelatedness to CSP/hosting code); functions suite 1563/1563 (untouched, confirmed no
  regression); typecheck clean; lint clean (0 errors, 1 pre-existing unrelated warning); format
  clean; ordinary `pnpm build` clean; `build:founder-qa-preview` clean. CSP is a Hosting-config
  header, not bundled into the JS output, so the builds themselves are structurally unaffected by
  this change — validated for completeness regardless.
- **Security/non-regression diff:** `git diff firebase.json` shows exactly two one-line additions
  (`https://firebaseappcheck.googleapis.com https://content-firebaseappcheck.googleapis.com`
  appended to `connect-src` in both blocks) — no other character changed. Total change scope:
  `firebase.json` and its regression test only.
- **No Firebase deployment performed.** No Firestore Rules, App Check registration, reCAPTCHA
  configuration, Cloud Functions, Commerce Knowledge seed, or QA identity touched. Production and
  staging untouched — no command in this task referenced either project.
- **Status (unchanged by this task):** `ENG-P3-002C-PREVIEW-001` = source correction ready for
  review, not yet deployed. `ENG-P3-002C`, `ENG-P3-002`, Capability 3 all unchanged — `ENG-P3-002`
  remains Open, still separately blocked on `DEC-LEGAL-002` regardless of this correction's outcome.
- **Rollback:** `git revert` the merge commit once merged, or simply do not merge — the change is a
  two-origin CSP allowlist addition with no data/schema/deployed-resource impact.

## Final gate (`ENG-P3-002C-PREVIEW-001-CSP-001`)

**ENG-P3-002C-PREVIEW-001-CSP-001 READY FOR FOUNDER REVIEW — NO DEPLOYMENT PERFORMED**

---

## Addendum — 2026-08-24 (`ENG-P3-002C-PREVIEW-001-RECOVERY-001`): Hosting Preview Redeploy & App Check Runtime Verification

**Narrative recap** (the intermediate chapters below were captured in detail on the still-open,
now-conflicting draft PR #164 — `ENG-P3-002C-PREVIEW-001-APPCHECK-002`; summarized here rather than
merged, to avoid resolving an unrelated file conflict against a stale branch point):
after Addendum 1 (App Check registration missing), the Founder registered a reCAPTCHA v3 key and
its secret in Firebase Console App Check. A follow-up attempt confirmed the app-boot defect fixed,
but surfaced a **new, narrower** failure: real App Check token exchange returned 403 and
self-throttled — traced, via a genuinely fresh browser context, to the site's own CSP `connect-src`
blocking `content-firebaseappcheck.googleapis.com` (not a reCAPTCHA domain-allowlist gap, which was
independently disputed and disproven). That CSP gap was fixed and independently reviewed under
`ENG-P3-002C-PREVIEW-001-CSP-001` (merged `c03f6f6`) and its review (merged `c582ae9`, closure sync
`c582ae9`) — both already fully documented as their own addenda above/in `IMPLEMENTATION_CHANGES.md`.

**This task redeployed the Hosting preview from that merged fix and ran the runtime verification.**

- **Entry:** `origin/main` confirmed at `c582ae9e535e68620fdaedbd0d2f4f6a43e1d158`, exactly as
  expected; PR #165/#166 ancestry confirmed; CI green. Fresh `git worktree`, active/default Firebase
  project reconfirmed to be the bare `eleventh-on-us` — every command explicitly targeted
  `--project eleventh-on-us-dev`.
- **Phase B re-confirmation (read-only, nothing redeployed):** all 14 onboarding functions still
  present; Commerce Knowledge seed still present (`knowledgeNodes`/`knowledgeTranslations`
  collections, 27 nodes); `platformConfig/businessTerms` still absent; App Check registration still
  active (`siteSecretSet: true`); existing DEV QA identity (`founder-qa-appcheck002@11thonus-dev-preview.test`,
  UID `xbI8n0WeKdSlfUc4NtxQohYOPzX2`) still exists. Nothing redeployed, reseeded, or recreated.
- **Preview env / builds:** `.env.founder-qa-preview.local` recreated in the worktree only
  (gitignored, never staged, no secret — only the public Site Key), real DEV SDK config re-fetched
  fresh. `founder-qa-preview` build: preview-auth chunk, `/business` route strings, `ReCaptchaV3Provider`,
  the public Site Key, and both App Check CSP origins (via `firebase.json`, now merged) all
  confirmed present; zero `TEST_ONLY`, zero secrets, zero PWA artifacts. Ordinary `pnpm build`
  reconfirmed structurally excludes the preview-auth entry.
- **Hosting redeploy:** `firebase hosting:channel:deploy eng-p3-002c-founder-qa --project eleventh-on-us-dev --expires 7d`.
  **Same channel, same hostname** (`https://eleventh-on-us-dev--eng-p3-002c-founder-qa-8lho2gn4.web.app`)
  — no new hostname, so no new reCAPTCHA-domain question. New expiry 2026-08-31 11:15:47. `live`
  channel confirmed unaffected. Served CSP confirmed via `curl` to now include both App Check
  origins.
- **App Check runtime proof — PASSED, rigorously, twice.** First pass: genuinely fresh browser
  context (App Check's own IndexedDB throttle store explicitly cleared before load) navigating
  directly to `/dev/founder-qa-sign-in` — app booted, sign-in UI rendered, reCAPTCHA scripts loaded
  (`window.grecaptcha` present), **zero console/network errors of any kind**. **Second, more
  rigorous pass** (added because a direct/cold request to `/dev/founder-qa-sign-in` itself carries
  **no** CSP header at all — confirmed again via `curl`, a pre-existing SPA-route-coverage gap, see
  below — meaning the first pass alone couldn't distinguish "the origin fix works" from "there was
  no CSP to violate in the first place"): reloaded fresh at `/` (which **does** carry the corrected
  CSP), then client-side-routed to `/dev/founder-qa-sign-in` via `history.pushState`+`popstate`
  (no full reload, so the governing document CSP stayed the one from `/`) — reCAPTCHA loaded, zero
  errors, confirming the fix genuinely works **under actual CSP enforcement**, not merely in its
  absence.
- **Sign-in / Customer Identity:** the existing QA identity's password was reset via the Identity
  Toolkit Admin API (same UID/email — not a new identity; the previous session's password was
  correctly never persisted, so it was unrecoverable) and used to sign in through the real product
  "Sign in with email" flow. Succeeded on the first attempt, zero App Check/console errors, real
  callable traffic (`authenticate`) completed normally.
- **`/business` resolution:** resolved correctly to the New Business form (zero-owned-Business
  state) — confirmed again via a completely fresh navigation later in the session (session/token
  persistence across page loads working correctly).
- **Business Categories:** loaded correctly from the governed Commerce Knowledge seed — all 14
  category names (Bakery, Barber, Burger, Car Wash, Coffee Shop, Gym, Juice Bar, Laundry, Pizza,
  Restaurant, Retail, Salon, Spa, Vehicle Service) present in the selector, exactly matching the
  seeded manifest.
- **NEW, SEPARATE, PRE-EXISTING DEFECT FOUND — Business creation is currently broken for every
  caller, unrelated to App Check.** Filled the New Business form correctly (verified every field
  against the backend's own validation source: `countryCode`/`currencyCode` match
  `^[A-Z]{2}$`/`^[A-Z]{3}$`, `contactPhone` just needs to be non-blank) and submitted — rejected
  every time with a governed, correctly-localized error banner ("Something about that wasn't
  valid…", not a raw Firebase error — the governed error-handling contract itself works correctly).
  Intercepted the actual `fetch()` response via injected JS to see the real payload:
  `{"error":{"details":{"field":"supportedLanguages"},"message":"business_creation_failed","status":"INVALID_ARGUMENT"}}`.
  Traced to source: `functions/src/index.ts`'s `parseSupportedLanguages` unconditionally requires a
  real array via `Array.isArray(value)`, but `apps/web/src/business/onboarding/NewBusinessPage.tsx`'s
  `handleSubmit` never includes a `supportedLanguages` field in its payload at all — this is a
  genuine, pre-existing frontend/backend contract mismatch, not caused by any App Check or CSP work
  in this workstream, and **not fixed here** per this task's explicit stop rule ("if a source change
  becomes necessary: STOP and report instead of editing"). No partial data was left behind — the
  Firestore write is transactional and the validation failure happens before it (confirmed: no
  `businesses` collection exists in DEV). **Provisional identifier for a future correction task:
  `ENG-P3-002B-CORR-SUPPORTEDLANGUAGES-001`** (pending the Founder's own numbering).
- **Downstream Phase H items not reachable:** Business context hydration of a real Business,
  category/type persistence beyond selection, Branch update, and Staff invitation all require an
  existing Business — blocked by the defect above, not attempted further (would require fabricating
  state, which is prohibited).
- **Terms boundary:** `platformConfig/businessTerms` reconfirmed absent both before and after this
  task (direct Firestore check). Not independently re-exercised through the UI this round (blocked
  upstream by the Business-creation defect), but the governed absence itself is unaffected by
  anything in this task.
- **EN:** confirmed on the reachable New Business page (English labels, English error banner).
- **FR:** confirmed by switching `i18next` language on the reachable page — all UI chrome correctly
  localized ("Parlez-nous de votre entreprise", "Nom de l'entreprise", etc.); Commerce Knowledge
  category *labels* remain English (expected — the seed loader only publishes EN translations
  currently, not a defect).
- **Mobile:** resized to 375×812 — form fields stack correctly, no horizontal overflow, all labels
  and inputs legible and usably sized.
- **SPA direct-route CSP-coverage finding — reconfirmed, and shown to directly affect this
  preview's realistic usage pattern:** a fresh, cache-busted `curl` against
  `/dev/founder-qa-sign-in` (the exact URL the Founder QA checklist instructs Founders to visit
  directly) still returns **no** `Content-Security-Policy` header at all, even after the CSP fix —
  only `/` and `/index.html` carry it. Functionally harmless here (no CSP present means nothing is
  blocked, so App Check still worked in the first, less-rigorous browser pass above) — but it means
  the realistic Founder entry path doesn't actually exercise the CSP protection at all, which is a
  real, if non-blocking, hardening gap. Recorded under the existing provisional identifier
  `ENG-HOSTING-CSP-COVERAGE-001` — not implemented here.
- **Security/environment audit:** clean — no secret committed or exposed (only the public Site Key,
  browser-visible by design); no App Check bypass/debug-token/enforcement change (services remain
  `UNENFORCED`, unchanged); no Rules change; no Functions redeploy; no reseed; no second QA identity
  created (existing one reused, only its password reset via the normal Admin mechanism); no
  production/staging command issued by this task.
- **Files:** this addendum only; the Founder QA checklist (see below). No source code changed.
- **Status:** `ENG-P3-002C-PREVIEW-001` = DEV preview operational (App Check validated). `ENG-P3-002C`
  = integration validation merged; DEV preview operational; Founder QA ready/pending — **with a
  newly disclosed Business-creation blocker that will prevent completing most of the QA checklist
  until `ENG-P3-002B-CORR-SUPPORTEDLANGUAGES-001` is separately corrected.** `ENG-P3-002` = unchanged
  — Open, blocked on Founder QA and `DEC-LEGAL-002`. Capability 3 = unchanged — Open, partially
  implemented, not closed. `ENG-P3-002` explicitly not closed by this task.
- **Rollback:** nothing to roll back structurally — the Hosting redeploy is a same-channel release
  (Firebase retains prior releases; `firebase hosting:clone`/console rollback available if ever
  needed); the QA identity's password reset is reversible by resetting it again; no other DEV state
  changed.

## Final gate (`ENG-P3-002C-PREVIEW-001-RECOVERY-001`)

**ENG-P3-002C DEV PREVIEW RECOVERED — APP CHECK VALIDATED; FOUNDER QA MAY BEGIN**

(with the newly disclosed, separate `ENG-P3-002B-CORR-SUPPORTEDLANGUAGES-001` Business-creation
defect blocking full completion of the checklist until corrected — see the Founder QA checklist
update for the exact disclosure)

---

## Addendum — 2026-08-24 (`ENG-P3-002C-PREVIEW-001-BUSINESS-CREATE-REVALIDATION-001`): Hosted Business-Creation Revalidation — PASSED, Founder QA May Continue

This addendum records the revalidation task authorized to prove, in the real hosted DEV
environment, that the merged `supportedLanguages` correction (`ENG-P3-002B-CORR-SUPPORTEDLANGUAGES-001`,
PR #168 merge `096faed984840a5793853f9630435dd218ec064f`, closure sync PR #169 merge
`8bbdaa942a499c68cf2edddd895e8aa5e198bbc0`) actually fixes hosted Business creation. Prior
failure history above is preserved unmodified.

**1. Entry origin/main SHA:** `8bbdaa942a499c68cf2edddd895e8aa5e198bbc0`, confirmed via
`git fetch origin` + `git rev-parse origin/main`.

**2. Deployment worktree:**
`/private/tmp/claude-501/-Users-theo-11THONUS/d7d0a4fc-3331-4893-a70a-6b83d9d18b88/scratchpad/deploy-eng-p3-002c-revalidation`,
created via `git worktree add … origin/main`, `git status --short` clean throughout, HEAD pinned
at `8bbdaa9` for the entire task.

**3. Merged correction verification:** PR #168 (`fix/eng-p3-002b-corr-supportedlanguages-001`,
merged `096faed9`) and PR #169 (closure sync, merged `8bbdaa94`) both confirmed `MERGED` with
`baseRefName: main` via `gh pr view`, both ancestors of `origin/main`. CI (`Build, Lint, Test,
Emulator Validation`) confirmed `pass` on PR #169. Source-level re-confirmation (not trusted from
the prior report alone): [`apps/web/src/business/api/createBusiness.ts:35`](../../../apps/web/src/business/api/createBusiness.ts)
now types `supportedLanguages: string[]` on `CreateBusinessRequest`, and
[`functions/src/domains/business/models/businessBootstrap.ts:99`](../../../functions/src/domains/business/models/businessBootstrap.ts)
persists `request.supportedLanguages` — the frontend now always sends the field, closing the
contract mismatch. No later runtime commit supersedes this correction (PR #169 is docs-only,
byte-identical runtime tree confirmed via the CI diff).

**4. DEV Functions verification:** `functions_list_functions` (MCP, `--project eleventh-on-us-dev`
equivalent) returned exactly the same 14 onboarding-required functions as every prior
verification (`acceptBusinessTerms`, `authenticate`, `createBusiness`, `createStaffInvitation`,
`getBusinessContext`, `getOwnedBusinesses`, `listBusinessCategories`,
`listBusinessTypesForCategory`, `listStaffInvitations`, `listStaffMemberships`,
`revokeStaffInvitation`, `submitBusinessForVerification`, `updateBusinessBranchProfile`,
`updateBusinessProfile`), all `v2`/`europe-west1`/`nodejs20`/256MB. Nothing redeployed.

**5. Commerce Knowledge verification:** `firestore_list_collections` on the database root
confirmed `knowledgeNodes`/`knowledgeTranslations` still present, alongside the newly-created
`businesses`/`businessBranches`/`businessCodeReservations`/`businessMemberships` collections
(created by this task's own Business-creation proof, not pre-existing). Not reseeded.

**6. Existing QA identity verification:** `auth_get_users` confirmed
`founder-qa-appcheck002@11thonus-dev-preview.test` (UID `xbI8n0WeKdSlfUc4NtxQohYOPzX2`) still
exists, unchanged. **Not a new identity.** Per explicit Founder authorization in this session, its
password was reset via the Identity Toolkit Admin API (`accounts:update`, same UID/email) so it
could be signed in with — the new password was generated locally, used only in-session, and is
**not recorded anywhere in this report, the repository, or any persistent file** (the temporary
file it was briefly held in was deleted at the end of the task). The prior session's password was
equally unrecoverable and is superseded.

**7. Terms-config verification:** `firestore_get_document` on `platformConfig/businessTerms`
returned "not found" both before and after this task — still absent, untouched.

**8. App Check verification:** direct `GET` on the App Check Admin API's
`recaptchaV3Config` resource for the DEV web app (via local user ADC + `x-goog-user-project`)
returned `siteSecretSet: true`, unchanged from the prior recovery task. The public reCAPTCHA site
key was sourced by extracting it from the JS bundle already live on the existing preview channel
(`6Lef_pUtAAAAAHjqQlM45JU420ImjOXpz3j-Q6pb`) — it is a public, browser-embedded value by design,
not a secret, and no new value was fabricated or guessed.

**9. Preview build result:** `pnpm --filter web run build:founder-qa-preview` — clean. Verified in
`dist/assets/*.js`: `supportedLanguages` string present; DEV project ID (`eleventh-on-us-dev`)
embedded; `/business/new`, `/business/:businessId` route strings present; the App Check site key
embedded; zero `TEST_ONLY` markers; zero PWA artifacts (`sw.js`/`registerSW.js`/`manifest.webmanifest`
all absent); zero private-key/service-account/`siteSecret` string matches (secret scan clean).

**10. Ordinary build result:** `pnpm --filter web run build` — clean, PWA service worker
generated as expected (`sw.js`, `workbox-*.js`, `registerSW.js`, `manifest.webmanifest` all
present). Confirmed the Founder-QA sign-in entry (`FounderQaPreviewSignInRoute`,
`founder-qa-sign-in`, `VITE_ENABLE_DEV_AUTH_PREVIEW`) is **absent** from this build's output (0
matches) — structurally excluded, as designed. Founder-qa-preview was then rebuilt fresh
(deterministic, identical output hashes) before the Hosting deploy, since the ordinary build
overwrote `dist/`.

**11. Hosting deploy command:**
```
firebase hosting:channel:deploy eng-p3-002c-founder-qa --project eleventh-on-us-dev --expires 7d --non-interactive
```

**12. Preview URL:** `https://eleventh-on-us-dev--eng-p3-002c-founder-qa-8lho2gn4.web.app`
(same hostname as every prior deploy — no new reCAPTCHA-domain question).

**13. Preview expiry:** 2026-08-31 13:22:49.

**14. Deployed SHA:** `8bbdaa942a499c68cf2edddd895e8aa5e198bbc0`.

**15. Browser boot result:** PASSED. Fresh browser context, navigated to
`/dev/founder-qa-sign-in`. App booted, sign-in UI rendered, zero console errors.

**16. App Check result:** PASSED. reCAPTCHA loaded (`presentation "reCAPTCHA"` node present in
the accessibility tree), zero App Check console/network errors at any point in the session.

**17. Sign-in result:** PASSED. Signed in as `founder-qa-appcheck002@11thonus-dev-preview.test`
via "Sign in with email" on the first attempt — redirected straight through to the New Business
form (zero-owned-Business state), zero console errors.

**18. `/business` resolver result:** PASSED — resolved to `/business/new` on first sign-in, and to
`/business/xkLYdH17O2zy8ruDjtln` after creation, confirmed via `window.location.href` and via a
completely fresh navigation later in the session (session persistence across reloads correct).

**19. Hosted `createBusiness` request proof:** PASSED. Filled every New Business field
("Founder QA Revalidation Business", category Salon, country `BI`, city Bujumbura, phone
`+25779000000`, currency `BIF`, timezone `Africa/Bujumbura`) and submitted through the real
product UI — no raw error, no governed-error banner, redirected to `/business/xkLYdH17O2zy8ruDjtln`
and the wizard opened at the Terms step (past Classification).

**20. `supportedLanguages` request result:** PASSED — confirmed by reading the persisted document
directly (`firestore_get_document`), not by re-parsing client network traffic: `supportedLanguages`
is a real empty array (`"supportedLanguages":{"arrayValue":{}}`), exactly `[]`, matching the
frontend's default.

**21. Business creation result:** PASSED. Document `businesses/xkLYdH17O2zy8ruDjtln` created,
`createdAt`/`updatedAt` timestamped 2026-08-24T11:30:00.840Z.

**22. Persisted `supportedLanguages` result:** `[]` — see item 20.

**23. Business status result:** `draft`.

**24. Owner result:** `ownerUserId: d1943784-9f27-4ed4-9716-02e39c7d29c5` — confirmed
server-derived, not client-supplied: `users/d1943784-9f27-4ed4-9716-02e39c7d29c5` carries a
`linked` `authenticationReferences` entry with `referenceId: xbI8n0WeKdSlfUc4NtxQohYOPzX2` — the
exact Firebase Auth UID of the identity that was actually signed in.

**25. Business Code result:** `BIZ7X2PYN` — assigned.

**26. Default Branch result:** PASSED. `businessBranches/aN4RpKJoVk8DUlo2T4z1` created with
`businessId: xkLYdH17O2zy8ruDjtln`, `displayName`/`countryCode`/`city` matching the submitted
form, same-millisecond `createdAt` as the Business.

**27. Context hydration result:** PASSED. Re-navigating to `/business/xkLYdH17O2zy8ruDjtln`
resolved via `getBusinessContext` to the same wizard state (Terms step, same disabled-Submit
Review data) with zero console errors — no re-creation, no duplicate offered.

**28. Refresh/resume result:** PASSED — confirmed twice (once directly after creation, once after
a completely fresh navigation later in the session): same step, same data, no reset to step 1, no
lost progress after editing the Branch and adding a Staff invitation.

**29. Category result:** PASSED. All 14 seeded categories (Bakery, Barber, Burger, Car Wash,
Coffee Shop, Gym, Juice Bar, Laundry, Pizza, Restaurant, Retail, Salon, Spa, Vehicle Service)
present in the selector; `Salon` (`cat_salon`) persisted and shown pre-selected on return to that
step; `primaryCategoryId: cat_salon` confirmed in the persisted document.

**30. Business Type result:** **Not independently re-exercised this round** — the reachable
onboarding-wizard UI at this step only surfaces Business Category selection, not a separate
Business Type control; no Business Type field was present to test on the Classification step in
this build. Not a regression from any prior finding (none of the prior passing addenda reached a
Business Type selector either). Recorded as not-yet-observed rather than asserted PASS/FAIL.

**31. Branch update result:** PASSED. Edited "Location name" on the Main location step to
`Founder QA Revalidation Business - Main Branch`, clicked Continue; `businessBranches/aN4RpKJoVk8DUlo2T4z1`
re-fetched directly from Firestore shows `displayName` updated and `updatedAt` advanced to
2026-08-24T11:31:53 — confirmed to survive a subsequent full page refresh.

**32. Staff invitation result:** PASSED (after one self-corrected input error — see below). As the
Owner, on the still-`draft` Business, submitted a Staff invitation
(`founder-qa-staff-invite@11thonus-dev-preview.test`, role `staff`) — appeared in the list as
"staff — pending"; Business `status` reconfirmed `draft` afterward (unchanged). **Process note, not
a product defect:** the first attempt used role value `"Staff"` (capitalized, overwriting the
form's correctly-defaulted lowercase `"staff"`) and was correctly rejected
(`staff_invitation_command_failed`, field `role`) by the transport-level closed-enum validation in
`functions/src/index.ts`'s `parseCreateStaffInvitationRequest` — this is the validation working as
designed against a tester input error, not a runtime defect; the retry with the correct value
succeeded immediately.

**33. Terms unavailable result:** PASSED. No checkbox, no accept button, plain "The Business Terms
are currently unavailable…" message; the Review step's "Submit for verification" button confirmed
`disabled: true` via direct DOM inspection — no submit bypass exists.

**34. EN result:** PASSED — confirmed on the reachable wizard (Business category, Main location,
Terms, Team, Review tabs; all field labels and messages in English).

**35. FR result:** PASSED — switched `i18next` language to `fr` via `localStorage`, reloaded: all
UI chrome correctly localized ("Catégorie d'entreprise", "Emplacement principal", "Conditions",
"Équipe", "Vérification", "Conditions de l'entreprise…", "Continuer") — matches the prior
recovery task's finding that Commerce Knowledge category *labels* remain English (expected, no
governed FR seed yet — not re-disclosed as new).

**36. Mobile result:** PASSED. Resized to 375×812: `document.body.scrollWidth === window.innerWidth`
(375px, zero horizontal overflow); the step-tab row wraps to two lines cleanly; all labels/controls
remain legible and usably sized.

**37. SPA CSP finding impact:** `ENG-HOSTING-CSP-COVERAGE-001` reconfirmed still present — a fresh
`curl -I` against `/dev/founder-qa-sign-in` directly still returns no `Content-Security-Policy`
header at all (only `/` and `/index.html` carry it, per the existing Hosting `headers` config).
Does not materially affect this journey: the actual QA session in this task navigated through `/`
first (which does carry the corrected CSP, including both App Check origins), then client-routed
internally, so the governing document CSP was the enforced one throughout. Not fixed here, per
this task's explicit non-scope.

**38. Security/environment audit:** clean. No secret committed or exposed (only the public
reCAPTCHA site key, browser-visible by design, and it was already public in the previously-live
bundle); no App Check bypass/debug-token/enforcement change; no Rules change (`git diff
firestore.rules` in the worktree: 0 lines); no Functions redeploy; no reseed; no second QA identity
created (existing one reused, only its password reset via the standard Admin mechanism, at your
explicit authorization); no production/staging command issued by any step of this task.

**39. Production/staging non-impact proof:** every Firebase CLI/MCP command in this task
explicitly targeted `eleventh-on-us-dev` (`--project eleventh-on-us-dev` or the MCP active-project
set to the same); `firebase_get_environment` reconfirmed the CLI's bare default project is
`eleventh-on-us` (not dev, not staging, not production) and was never relied upon implicitly. The
`live` Hosting channel's last-release timestamp is confirmed unchanged by the redeploy (only the
named preview channel's timestamp advanced).

**40. Files modified:** this addendum (deployment report) and the Founder QA checklist update
(see below) only. No runtime source code changed by this task.

**41. Code diff summary:** none — this was a deployment/revalidation task; the `supportedLanguages`
fix itself was already merged by the prior `ENG-P3-002B-CORR-SUPPORTEDLANGUAGES-001` task (see
that task's own report/PR).

**42. Commands executed:** `git fetch origin`, `git rev-parse origin/main`, `gh pr view 168/169`,
`gh pr checks 169`, `git worktree add`, `pnpm install --frozen-lockfile`, `pnpm run typecheck`,
`pnpm --filter web run test`, `pnpm --filter functions run test`, `pnpm run lint`,
`pnpm --filter web run build:founder-qa-preview` (×2), `pnpm --filter web run build`,
`firebase hosting:channel:list --project eleventh-on-us-dev`,
`firebase hosting:channel:deploy eng-p3-002c-founder-qa --project eleventh-on-us-dev --expires 7d`,
`curl` (CSP header checks, live bundle extraction), Identity Toolkit Admin API
`accounts:update` (password reset, explicitly authorized), App Check Admin API `recaptchaV3Config`
GET, Firestore MCP reads (`firestore_get_document`/`firestore_list_collections`/`runQuery`),
browser navigation/console/network/DOM inspection against the deployed preview URL.

**43. Dependencies/config changes:** none.

**44. Firebase deployment changes:** one Hosting release to the existing
`eng-p3-002c-founder-qa` preview channel on `eleventh-on-us-dev` (same hostname, new expiry, new
SHA). No Functions, Rules, or `live`-channel changes.

**45. DEV data changes:** one real Business (`businesses/xkLYdH17O2zy8ruDjtln`), one Branch
(`businessBranches/aN4RpKJoVk8DUlo2T4z1`), one Staff invitation, and one Business Code reservation
(`BIZ7X2PYN`) — all created through the real hosted UI/callables as the QA-journey proof this
task exists to produce, not incidental. The QA identity's password was reset (see item 6). No
other DEV state changed.

**46. Tests/validation executed:** web unit 505/505; functions unit 1563/1563; typecheck clean
(both packages); lint clean (0 errors, 1 pre-existing unrelated warning); both builds clean;
hosted end-to-end Business-creation journey (this addendum, items 15–36).

**47. Findings:**
- (Informational, not a defect) Business Type selection was not reachable/observed on this pass —
  item 30.
- (Confirmed pre-existing, non-blocking, not fixed here) `ENG-HOSTING-CSP-COVERAGE-001` — item 37.
- (Tester error, not a defect) capitalized `"Staff"` role value correctly rejected by existing
  closed-enum validation — item 32.
- No new runtime defect was discovered. The `supportedLanguages` correction is proven to work end
  to end in the real hosted DEV environment.

**48. Remaining blockers:** `DEC-LEGAL-002` (Terms content) still blocks reaching
`pending_verification` through the real UI — unchanged, out of this task's scope. Business Type
selector reachability unconfirmed (item 30) — worth a future, separately-scoped look, not a
blocker to Founder QA continuing.

**49. Founder QA checklist status:** updated (see below) with this revalidation's result. **Still
not marked complete** — a full Founder-run pass through the checklist itself has not been executed
by this task (this task proves the blocker is cleared and exercises most items directly, but the
checklist's own "run it yourself" instruction stands).

**50. `ENG-P3-002C` status:** **DEV preview operational and materially QA-ready.**

**51. `ENG-P3-002` status:** **Open** — blocked only on `DEC-LEGAL-002` and the Founder's own
completion of the QA checklist. Not closed by this task.

**52. Capability 3 status:** **Open** — partially implemented, not closed.

**53. Risks:** none newly introduced. The QA identity's password was changed (item 6) — anyone
relying on the previous password will need it reset again; this is expected and low-impact for a
disposable DEV QA fixture. The Hosting preview channel expires 2026-08-31 — re-deploy before then
if QA continues past that date.

**54. Rollback:** nothing to roll back structurally — the Hosting redeploy is a same-channel
release (Firebase retains prior releases; console rollback available if ever needed); the QA
identity's password reset is reversible by resetting it again; the created Business/Branch/
invitation are real, correct, reusable QA fixtures — not cleaned up, since they are the intended
proof artifact and harmless to leave in DEV.

**55. Persistent deployment report path:** this document.

**56. Exact next Founder action:** Continue (or delegate) a full run of the
[Founder QA checklist](ENG-P3-002C-founder-qa-checklist-2026-08-22.md) against the same preview URL
using the QA identity (request current credentials from the engineering session that reset them —
never persisted in any document). `DEC-LEGAL-002` remains the only structural blocker to reaching
`pending_verification` through the real UI.

## Final gate (`ENG-P3-002C-PREVIEW-001-BUSINESS-CREATE-REVALIDATION-001`)

**ENG-P3-002C HOSTED ONBOARDING REVALIDATED — BUSINESS CREATION WORKS; FOUNDER QA MAY CONTINUE**

---

## Addendum — 2026-08-24 (`ENG-P3-002-CORR-LANGSWITCH-001-REVALIDATION`): Hosted Language-Switch Revalidation — PASSED, EN/FR Founder QA Finding Resolved

This addendum records the hosted revalidation of the merged `ENG-P3-002-CORR-LANGSWITCH-001`
correction (PR #170, merge `2a2af4a2575e4dec0ab987e0cdd72507f3283543`; independent review/closure
PR #171, merge `0cd7d059bb390ccb7c6750311b1c1ffa9adcadd8`) — the fix for the Founder QA FAIL finding
that no language-switching control was reachable anywhere inside the Business onboarding journey.
**Not authorized to change source; none was changed.**

**1. Entry:** `origin/main` confirmed at `0cd7d059bb390ccb7c6750311b1c1ffa9adcadd8`, exactly as
expected. PR #170/#171 ancestry and CI green reconfirmed via `gh pr view`/`gh run list`. Fresh,
clean `git worktree` at that exact SHA. `.firebaserc`: `dev → eleventh-on-us-dev` confirmed. Active
Firebase project explicitly `eleventh-on-us-dev` throughout — every command passed
`--project eleventh-on-us-dev` explicitly.

**2. Phase B re-confirmation (source, not the implementation report):** `LanguageSwitcher` present
and functioning at all three claimed placements (`NewBusinessPage.tsx`, `OnboardingWizard.tsx`,
`SubmittedStatusPage.tsx`); `LanguageSwitcher.tsx`/`i18n/config.ts` confirmed byte-identical to the
pre-correction baseline (0-line diff); `BusinessResolverPage.tsx`/`BusinessWizardPage.tsx` edge
states confirmed to still carry zero switcher references (unchanged, as designed); no
backend/Firebase/config file touched by the correction.

**3. DEV preflight (read-only, nothing redeployed):** all 14 onboarding functions unchanged;
Commerce Knowledge seed unchanged; `platformConfig/businessTerms` still absent; existing QA
identity (`founder-qa-appcheck002@11thonus-dev-preview.test`) still exists, still usable with its
existing session-only credential — not reset; existing DEV Business
(`xkLYdH17O2zy8ruDjtln`, "Founder QA Revalidation Business", status `draft`) still exists; App
Check registration still active (`siteSecretSet: true`). Nothing redeployed, reseeded, or
recreated.

**4. Preview env / builds:** `.env.founder-qa-preview.local` recreated in the worktree only
(gitignored, never staged), real DEV SDK config and the existing public App Check Site Key reused.
`founder-qa-preview` build: `/business/new` and `/business/:businessId` route strings, the
`Français` switcher string, and both EN ("Tell us about your business") and FR ("Parlez-nous de
votre entreprise") resource strings all confirmed present in the built bundle; zero `TEST_ONLY`,
zero secrets, zero PWA artifacts. Ordinary `pnpm build` reconfirmed the Founder-QA sign-in entry
remains structurally excluded (0 matches) and correctly includes PWA artifacts.

**5. Hosting redeploy:** `firebase hosting:channel:deploy eng-p3-002c-founder-qa --project eleventh-on-us-dev --expires 7d`.
**Same channel, same hostname** (`https://eleventh-on-us-dev--eng-p3-002c-founder-qa-8lho2gn4.web.app`)
— no new hostname, so no reCAPTCHA-domain question. New expiry 2026-08-31 17:58:06. Deployed SHA
`0cd7d059bb390ccb7c6750311b1c1ffa9adcadd8`. `live` channel confirmed unaffected.

**6. Browser boot / App Check / sign-in — PASSED.** Genuinely fresh browser context, navigated
directly to `/dev/founder-qa-sign-in`. App booted, sign-in UI rendered. One recurring, unexplained
console message (`Failed to load resource: the server responded with a status of 400/403 ()`) was
observed on every page load throughout this session, with no corresponding request ever captured
by the browser tool's network log (the tool does not appear to capture cross-origin
reCAPTCHA/App-Check/Identity-Toolkit XHR/fetch traffic at all — confirmed by the total absence of
any `identitytoolkit`/`cloudfunctions` entries in the network log even for calls that demonstrably
succeeded). **Disclosed transparently rather than suppressed:** functional behavior was unaffected
at every step this session — sign-in succeeded on the first attempt, the existing Business resolved
correctly, Branch data loaded correctly, and no user-facing error of any kind appeared — so this is
recorded as an unexplained, non-blocking console artifact, not a regression. Signed in as the
existing QA identity via "Sign in with email" — succeeded, redirected to
`/business/xkLYdH17O2zy8ruDjtln`.

**7. Existing Business/context result:** the existing DEV Business resolved correctly — no
duplicate offered, no re-creation, wizard opened directly at the "Terms" step (matching its actual
completeness state), Review step showing the exact same data as before this task
("Founder QA Revalidation Business", `cat_salon`, "SQ- Main Branch, Bujumbura" — the Founder's own
prior manual edit — 2 pending team invitations) — conclusive proof the Business/context is the
same persisted record, not reset.

**8. PRIORITY — language access proof, hosted, visual (not inferred from unit tests):**
   - **Route/step recorded before switching:** `/business/xkLYdH17O2zy8ruDjtln`, step "Terms"
     (`aria-current="step"` on the Terms button).
   - **EN → FR:** clicking "Français" changed all step-nav labels ("Catégorie d'entreprise",
     "Emplacement principal", **Conditions**, "Équipe", "Vérification") and the Terms-unavailable
     body text to French, confirmed via live page text extraction.
   - **Route preserved:** URL unchanged (`/business/xkLYdH17O2zy8ruDjtln`).
   - **Step preserved:** `aria-current="step"` moved to the same step, now labelled "Conditions"
     (the French label for Terms) — the step itself did not change, only its rendered label.
   - **Business/context preserved:** navigated to the Review tab in French — showed the identical
     Business name, category, Branch, and team-invitation count as before the switch.
   - **Refresh/persistence:** hard-navigated (fresh page load) to the same URL — locale remained
     French (per the existing `LanguageDetector` localStorage architecture), session remained
     signed in, wizard resumed at the same "Terms" step — confirming both locale persistence and
     session/context persistence survive a full reload.
   - **FR → EN:** clicked "English" — all copy reverted exactly, route and step (`aria-current`)
     unchanged throughout.
   - **`/business/new` placement, separately verified:** navigated directly (no new Business
     created) — switcher visible, typed "Hosted Revalidation Probe" into the Business name field,
     switched to French — title changed to "Parlez-nous de votre entreprise", the entered value
     survived unchanged under its new French label ("Nom de l'entreprise"). Form never submitted;
     no DEV data created by this check.
   - **`SubmittedStatusPage` placement:** **not independently re-exercised hosted** — the existing
     Business remains `draft` (not `pending_verification`), and per this task's own instruction not
     to fabricate data solely to reach a state, this state was not forced. Source-level
     confirmation from Phase B (§2 above) stands in its place — the switcher's presence there was
     verified by direct inspection of the merged, unmodified code, consistent with the same pattern
     already proven working in the other two placements.

**9. French visible-content observations (Phase H, bounded, no fix):** every UI-chrome string
observed (page titles, field labels, step-nav labels, Terms-unavailable message, Review-step
labels, Continue/Submit button text) translates correctly to French. **Confirmed, unchanged,
already-disclosed limitation:** the 14 seeded Commerce Knowledge category labels (Bakery, Barber,
Burger, Car Wash, Coffee Shop, Gym, Juice Bar, Laundry, Pizza, Restaurant, Retail, Salon, Spa,
Vehicle Service) remain in English under the French UI — expected, since the seed loader only
publishes EN translations currently; not a defect, not new, not fixed here. No hardcoded
English-only UI-chrome string was found that should have been localized but wasn't.

**10. Terms EN/FR boundary — PASSED, both languages.** English: "The Business Terms are currently
unavailable. Please check back soon before submitting your business." French: "Les Conditions de
l'entreprise sont actuellement indisponibles. Veuillez revenir bientôt avant de soumettre votre
entreprise." No checkbox, no accept button, in either language. The Review step's
"Submit for verification"/"Soumettre pour vérification" button reconfirmed structurally disabled
(`disabled: true`, matching the prior revalidation task's own DOM-level check) in both languages —
no submission bypass in either language. `platformConfig/businessTerms` reconfirmed absent both
before and after this task. `DEC-LEGAL-002` unaffected, still `OPEN_LEGAL`.

**11. Mobile language access — PASSED.** Resized to 375×812 on `/business/new`: the "English /
Français" switcher renders at the top, fully legible, no overflow, no collapse. Switching language
at this width functions identically to desktop (confirmed by direct interaction). **The known,
separate mobile-navigation Founder FAIL finding is explicitly unchanged and not addressed by this
task** — the step-navigation tab row still presents as a desktop-style tab bar at this width; no
navigation redesign was attempted, per this task's explicit scope boundary.

**12. Loading/error edge-state observation (unchanged, non-blocking, already disclosed in the
correction's own report):** `OnboardingWizard`'s integrity-error branch and `BusinessWizardPage`'s
loading/error/`lifecycle.notAvailable` states still carry no language switcher — not reached in
this session's real journey (the existing Business never entered those states), consistent with
the correction's own disclosed, intentionally out-of-scope boundary.

**13. Design-handoff observation capture (Phase L, observation only — no Stitch work performed):**
routes encountered this session: `/dev/founder-qa-sign-in` (sign-in preview shell, EN/FR toggle,
Google + email/password, reCAPTCHA-protected), `/business/new` (single-column form: Business name,
category select from a live 14-item Commerce Knowledge list, country/city/phone/currency/timezone
free-text fields, disabled-until-complete Continue button), `/business/:businessId` (five-tab
step nav — Business category / Main location / Terms / Team / Review — rendered as a wrapping pill
row; each tab is independently navigable at any time, not gated sequentially). States observed:
"Loading your business…" (transient resolver spinner state), Terms step (plain unavailable message,
no interactive Terms content), Team step (email/phone delivery-type selector, role free-text field
defaulting to `staff`, a flat pending-invitation list showing only role+status — no invitee
identity, matching the separately-tracked invitation-identity finding), Review step (read-only
summary of name/category/location, per-step "please finish this step" warnings for incomplete
steps, disabled Submit). Mobile behaviour: the step-nav row wraps to two lines at 375px; form
fields stack single-column with no overflow at every screen visited. Language behaviour: switcher
renders identically (top-of-page, two autonym-labelled buttons, `aria-pressed` on the active one)
at all three placements and at both viewport widths tested.

**14. Security/environment audit:** clean — no secret committed or exposed; no App Check
bypass/enforcement change; no Rules change; no Functions redeploy; no reseed; no new/reset QA
identity (existing credential reused as-is, since it remained valid); no production/staging
command issued.

**15. Files:** this addendum, the Founder QA checklist update, `IMPLEMENTATION_CHANGES.md`. No
source code changed.

**16. Status:** `ENG-P3-002C` = hosted engineering/integration validated; **the EN/FR visible-usability
Founder QA finding is now RESOLVED**, re-proven in the real hosted environment — Founder QA remains
otherwise pending (mobile navigation still FAIL, unaddressed by design; invitation-identity finding
still open, non-blocking). `ENG-P3-002` = unchanged, Open, blocked on Founder QA completion and
`DEC-LEGAL-002`. Capability 3 = unchanged, Open, not closed.

**17. Rollback:** nothing to roll back structurally — the Hosting redeploy is a same-channel
release (Firebase retains prior releases); no DEV data was created or altered by this task.

## Final gate (`ENG-P3-002-CORR-LANGSWITCH-001-REVALIDATION`)

**ENG-P3-002 LANGUAGE ACCESSIBILITY REVALIDATED — EN/FR FOUNDER QA FINDING RESOLVED; UI DESIGN
HANDOFF MAY BEGIN**
