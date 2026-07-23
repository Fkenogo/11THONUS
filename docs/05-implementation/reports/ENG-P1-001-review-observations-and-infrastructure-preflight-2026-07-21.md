> **Title:** ENG-P1-001 Closure Preflight and Review-Observation Corrections
> **Status:** Corrections applied and validated; infrastructure preflight complete (read-only) — `ENG-P1-001` remains `Approved`, not `Complete`
> **Date:** 2026-07-21
> **Classification:** Correction + read-only infrastructure preflight — no live Firebase/GCP resource was created, modified, or deleted

# ENG-P1-001 Closure Preflight and Review-Observation Corrections

## 1. Executive Summary

Two things happened in this task. **Part A** corrected all four non-blocking findings from the Independent Technical Review (2026-07-20): the duplicate `.env.example` (CFG-1) was consolidated into the single, already-established canonical location (`apps/web/.env.example`); App Check (AC-1) now fails closed outside development instead of warning-and-continuing unconditionally, implemented test-first; the misleading test-cleanup comment (AT-1) was removed; and the Admin SDK singleton test (AD-1) was made order-independent via genuine `deleteApp` cleanup. All four corrections were independently validated — 34/34 tests pass (up from 32, +2 new App Check tests), full build/lint/typecheck/format clean, Emulator Suite independently re-confirmed.

**Part B** performed a read-only infrastructure preflight against the currently authenticated Firebase CLI / gcloud account. It independently confirmed `eleventh-on-us` is unsuitable as the `europe-west1` development project — its Firestore location (`nam5`) and Storage bucket location (`US-EAST1`) are both immutable and neither matches the approved region. No GCP organization exists on this account; billing is already technically possible (an active billing account exists and is already attached to `eleventh-on-us`), but attaching billing to a *new* project remains a Founder-only action under governance regardless of what this account can technically do. Six specific items remain required from the Founder before any project can be created — none are inferred here.

`ENG-P1-001` remains `Approved`. It is not `Committed`, `Pushed`, `Deployed`, or `Complete`. `ENG-P1-002` remains `Blocked`. `ENG-P1-002` was not started.

## 2. Repository Analysis

**Current workflow state:** `ENG-P1-001` is `Approved` (Independent Technical Review, 2026-07-20, verdict: Approved with non-blocking observations). Not committed, pushed, deployed, or complete. `ENG-P1-002` is `Blocked` on `ENG-P1-001` reaching `Complete` (not merely `Approved`).

**The four review findings, restated exactly as the Technical Review recorded them:**

1. **CFG-1 (Medium)** — a `.env.example` already existed at `apps/web/.env.example` (tracked since ENG-P0-001, `3a50710`); ENG-P1-001 created a second, overlapping one at the repository root instead of reconciling with it, and its own Implementation Report's claim that no example file previously existed was factually inaccurate.
2. **AC-1 (Medium)** — App Check's missing-site-key handling was identical in development and any future production build (warn-and-continue in both), which does not itself fail closed if a production deployment were ever misconfigured.
3. **AT-1 (Low)** — `app.test.ts`'s `afterEach` hook's comment claimed test cleanup the code did not actually perform.
4. **AD-1 (Low)** — `admin.test.ts`'s two tests were order-dependent within the file.

**Minimal correction strategy:** for CFG-1, determine the canonical file location from actual Vite behavior rather than convention alone — the ENG-P0-001 Technical Review (2026-07-17) had already established, and this session's own ENG-P1-001 Technical Review independently re-confirmed, that Vite's env-loading directory for `apps/web` defaults to `apps/web/` itself (pnpm runs scripts with cwd set to the package directory; no `envDir` override exists in `vite.config.ts`), so a root-level `.env.local`/`.env.example` is never actually read by any real command. The canonical location is therefore unambiguous: `apps/web/.env.example`, already the established convention. For AC-1, the smallest change that achieves fail-closed behavior is a single new branch in `initializeFirebaseAppCheck` — no redesign of the composition root or `main.tsx`'s boot sequence is needed, since a thrown error there propagates naturally into a hard boot failure. For AT-1 and AD-1, both are test-file-only corrections with zero production-code impact.

**Infrastructure preflight strategy:** inspect the currently authenticated Firebase CLI and `gcloud` session using only read/list/describe commands (`firebase projects:list`, `firebase login:list`, `gcloud auth list`, `gcloud config list`, `gcloud billing accounts list`, `gcloud organizations list`, `gcloud projects describe`, `gcloud firestore databases list`, `gcloud storage buckets list`, `gcloud services list --enabled`) — no `create`, `enable`, `delete`, or `deploy` command was run against any project at any point.

**Actions requiring explicit Founder authorization** (per Cloud Environment & Deployment Strategy §7, unchanged by this task): creating a new Firebase/GCP project; enabling any Google Cloud API/service not already tied to a `CONFIRMED` decision; enabling or modifying billing; selecting/changing a project's region (already exercised for the region itself via `DEC-TECH-005`, but not yet exercised for *which specific projects* get created); deploying to Production. This task performed none of these.

**Facts still unknown, listed exhaustively in §18.**

**Files expected to change:** `apps/web/.env.example` (rewritten), root `.env.example` (deleted), `apps/web/src/infrastructure/firebase/appCheck.ts` and `appCheck.test.ts` (fail-closed behavior + tests), `apps/web/src/infrastructure/firebase/app.test.ts` (misleading hook removed), `functions/src/infrastructure/firebase/admin.test.ts` (order-independence), the ENG-P1-001 Implementation Report (two targeted corrections), the ENG-P1-001 Technical Review's own tracking cross-references remain unchanged (it is a permanent historical record, not corrected retroactively — its findings are being *closed*, not rewritten), the Engineering Implementation Programme and Coding-Agent Prompt Register (notes only — status fields unchanged, per this task's explicit instruction), and `docs/changes/IMPLEMENTATION_CHANGES.md` (new entry).

**Validation approach:** TDD (Red-Green-Refactor) for AC-1's new behavior; direct verification (re-run, re-read) for AT-1/AD-1's test-file corrections; full workspace `typecheck`/`lint`/`format:check`/`build`/`test`/`emulators:validate` re-run after all four corrections; explicit order-independence proof for AD-1 (tests re-run in reversed order in a throwaway file, then discarded); explicit single-canonical-file and zero-secret-pattern checks for CFG-1.

## 3. Review Findings Addressed

| Finding | Status | Evidence |
|---|---|---|
| CFG-1 | **Closed** | Root `.env.example` deleted; `apps/web/.env.example` is now the sole file, rewritten with all variables (including the 3 optional ones the root file introduced), a corrected comment explaining *why* this location is canonical (not merely convention), and copy/setup instructions. Implementation Report's false claim and overstated risk both corrected in place, citing the Technical Review. |
| AC-1 | **Closed** | `initializeFirebaseAppCheck` now throws a clear, named error when `!options.siteKey && !options.isDev`; unchanged (warn + `undefined`) in development. Implemented test-first — RED confirmed before the fix, GREEN confirmed after. |
| AT-1 | **Closed** | `app.test.ts`'s no-op `afterEach` (toggled an unrelated property, claimed cleanup it didn't perform) removed; replaced with an accurate one-line comment naming the real isolation mechanism (randomized app names). |
| AD-1 | **Closed** | `admin.test.ts` now deletes every registered Admin app in `afterEach`, so each test starts from a guaranteed-empty registry. Order-independence was proven, not assumed — the same two tests were run in reversed order in a throwaway file and both passed identically. |

## 4. Files Created

- `docs/05-implementation/reports/ENG-P1-001-review-observations-and-infrastructure-preflight-2026-07-21.md` (this report).

## 5. Files Modified

- `apps/web/.env.example` — rewritten: consolidated content from the deleted root file, refreshed comment explaining the canonical-location reasoning, copy/setup instructions added.
- `apps/web/src/infrastructure/firebase/appCheck.ts` — fail-closed behavior added (AC-1).
- `apps/web/src/infrastructure/firebase/appCheck.test.ts` — tests updated/added for all four dev/prod × configured/unconfigured combinations.
- `apps/web/src/infrastructure/firebase/app.test.ts` — misleading `afterEach` removed (AT-1).
- `functions/src/infrastructure/firebase/admin.test.ts` — genuine `deleteApp` cleanup added for order-independence (AD-1).
- `docs/05-implementation/reports/ENG-P1-001-implementation-report-2026-07-20.md` — two targeted corrections (the false "no `.env.example` existed" claim; the overstated `.env.local` risk claim). No other section rewritten.
- [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) — a dated note only; `ENG-P1-001`'s `Status` field remains `Approved`.
- [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md) — a dated note only; `ENG-P1-001`'s `Status` field remains `Approved`.
- [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md) — one new append-only entry.

## 6. Files Deleted

- `.env.example` (repository root) — superseded by the consolidated `apps/web/.env.example`.

## 7. Code Diff Summary

`apps/web/.env.example` (tracked, git diff): +31/-5 lines — consolidated content, refreshed comment, 3 new optional variables carried over from the deleted root file. The remaining four touched files (`appCheck.ts`, `appCheck.test.ts`, `app.test.ts`, `admin.test.ts`) are all part of ENG-P1-001's own still-uncommitted change set, so they carry no independent `git diff` against `main` — their current line counts are `appCheck.ts` 50 (was 43), `appCheck.test.ts` 84 (was 67), `app.test.ts` 32 (was 38, net smaller after removing the misleading hook), `admin.test.ts` 25 (was 18).

## 8. Tests Added or Changed

`appCheck.test.ts`: 6 tests (was 4) —

1. `"warns and returns undefined when no site key is configured in development"` (renamed/re-scoped from the prior "returns undefined and logs a clear reason..." test, now explicit about `isDev: true`).
2. `"throws a clear error when no site key is configured outside development"` — **new**, the core AC-1 test.
3. `"initializes App Check when a site key is provided in development"` — **new**, explicit dev-configured path.
4. `"initializes App Check when a site key is provided outside development"` (renamed/re-scoped from the prior "initializes App Check when a site key is provided" test, now explicit about `isDev: false`).
5. `"sets the debug token global in dev mode when a debug token is provided"` — unchanged.
6. `"does not set the debug token global outside dev mode"` — unchanged (already had a site key, unaffected by the new throw branch).

`admin.test.ts`: 2 tests, unchanged in count and assertions, but now preceded by an `afterEach` cleanup hook making both order-independent.

`app.test.ts`: 2 tests, unchanged in count and assertions; only the file-level `afterEach` hook was removed.

## 9. Commands Executed

```
git branch --show-current
git status --short
git diff --check
git diff --stat
git diff --name-only

pnpm vitest run src/infrastructure/firebase/appCheck.test.ts   (RED, then GREEN)
pnpm vitest run src/infrastructure/firebase/index.test.ts src/config/env.test.ts   (regression check)
pnpm vitest run src/infrastructure/firebase/app.test.ts
pnpm vitest run src/infrastructure/firebase/admin.test.ts
(admin.test.ts re-run with reversed test order in a throwaway file, then discarded)

pnpm install --frozen-lockfile
pnpm -r run typecheck
pnpm lint
pnpm format:check   (1 file needed pnpm format --write; re-verified clean)
pnpm -r run build
pnpm -r run test
pnpm emulators:validate

grep -rEn "AIza[0-9A-Za-z_-]{35}|-----BEGIN (RSA )?PRIVATE KEY-----|sk_live_|sk_test_" apps/web/src functions/src apps/web/.env.example
find . -name ".env.example" -not -path "*/node_modules/*"

firebase login:list
firebase projects:list
gcloud auth list
gcloud config list
gcloud billing accounts list
gcloud organizations list
gcloud projects describe eleventh-on-us
gcloud firestore databases list --project=eleventh-on-us
gcloud storage buckets list --project=eleventh-on-us --format="table(name,location,storageClass)"
gcloud services list --enabled --project=eleventh-on-us
gcloud billing projects describe eleventh-on-us
ls -la .firebaserc   (confirmed absent)
```

## 10. Validation Results

| Command | Result |
|---|---|
| `git diff --check` | ✅ clean |
| `pnpm install --frozen-lockfile` | ✅ lockfile unchanged, up to date |
| `pnpm -r run typecheck` | ✅ both workspaces, strict, clean |
| `pnpm lint` | ✅ zero findings |
| `pnpm format:check` | ✅ clean (after one auto-fix during this task) |
| `pnpm -r run build` | ✅ both workspaces; `apps/web` bundle 779.91 kB / 237.37 kB gzip — same pre-existing chunk-size warning, not introduced by this task |
| `pnpm -r run test` | ✅ **34/34** (`apps/web`: 8 files / 29 tests, up from 27; `functions`: 3 files / 5 tests, unchanged) |
| `pnpm emulators:validate` | ✅ `functions[europe-west1-ping]` initialized correctly; clean shutdown; `demo-11thonus` fake project only |
| AC-1 RED confirmation | ✅ new throw-test failed for the correct reason (`AssertionError: expected [Function] to throw an error`) before the fix |
| AD-1 order-independence | ✅ both tests re-run in reversed order in a throwaway file — both passed |
| Exactly one `.env.example` | ✅ `find . -name ".env.example" -not -path "*/node_modules/*"` → `./apps/web/.env.example` only |
| No secret pattern | ✅ zero matches across `apps/web/src`, `functions/src`, `apps/web/.env.example` |
| Documentation links | ✅ the new cross-reference link in the Implementation Report resolves to this report's own path (verified — same directory) |
| No live Firebase/GCP resource changed | ✅ every Part B command used was `list`/`describe`/`auth list`/`config list` only — no `create`/`enable`/`delete`/`deploy` was run |

## 11. Dependencies Added

None.

## 12. Configuration Changes

`apps/web/.env.example` content changed (names/comments only, no real values — see §5). No `.env`, `firebase.json`, `vite.config.ts`, `tsconfig.json`, or `.firebaserc` was modified. `.firebaserc` still does not exist.

## 13. Firebase Account Preflight

**Verified facts**, from `firebase login:list` / `gcloud auth list` / `gcloud config list`:

- Active Firebase CLI account: `fredkenogo@gmail.com` (the operator's personal Google account).
- Active `gcloud` account: same, `fredkenogo@gmail.com`; active `gcloud` config project was `xampreps` (an unrelated project) before this preflight — unchanged by this task, since no `gcloud config set` command was run.
- **This is a personal/agency account, not a dedicated 11thONUS organization account.** `firebase projects:list` returned 19 accessible Firebase projects total; only one (`eleventh-on-us`) relates to 11thONUS. The other 18 belong to unrelated client/personal work and are not named individually in this permanent report, consistent with the task's instruction not to expose identifiers unnecessarily beyond what is needed to answer the preflight questions.
- **Organization/folder context:** `gcloud organizations list` returned zero items — this account has no Google Cloud organization. Every project (including `eleventh-on-us`) is a standalone, unorganized project. There is no folder hierarchy to report.
- **Billing accounts:** multiple billing accounts are visible to this account (`gcloud billing accounts list`), a mix of open and closed. Specific account IDs are not reproduced in this permanent report (sensitive alphanumeric identifiers, not needed to answer the governance question — see §17). At least one open billing account is already attached to `eleventh-on-us` (`billingEnabled: true`), confirming this account has the *technical* capability to attach billing to a project. This does not change the governance answer in §17 — that capability existing on this personal account is not the same as Founder authorization to use it for a new 11thONUS project.

**Recommendation, not a fact:** before any project creation, the Founder should decide whether new 11thONUS projects are created under this same personal account (matching `eleventh-on-us`'s own precedent) or a new, dedicated Google Cloud organization/account — this is squarely a Founder decision (§18, item 6), not inferred here.

## 14. Existing Project Assessment

**Verified facts about `eleventh-on-us`** (read-only `gcloud`/`firebase` inspection):

- Created `2026-07-16`; `lifecycleState: ACTIVE`; Firebase-enabled.
- Firestore: one `(default)` database, `type: FIRESTORE_NATIVE`, **`locationId: nam5`** (a North America multi-region). Firestore's database location is immutable once set — it cannot be changed in place; the only way to relocate is to create a new database (effectively a new project-level setup) and migrate data.
- Cloud Storage: one bucket (`eleventh-on-us.firebasestorage.app`), **`location: US-EAST1`**. GCS bucket location is likewise immutable without recreating the bucket.
- One registered Web app (`11th-on-us`).
- Billing: enabled, attached to an existing billing account on this personal account.
- Enabled APIs: the default Firebase-project set (`firebase`, `firestore`, `identitytoolkit` (Auth), `firebasestorage`, `firebasehosting`, `cloudfunctions`, `fcm`, `firebaseremoteconfig`, etc.) plus several unrelated defaults (BigQuery family, App Engine, Cloud Trace) that appear to be standard Firebase-console-driven auto-enablement, not anything this repository's own `firebase.json` requires. **No App Check / reCAPTCHA API is enabled** — confirmed via a direct grep of the enabled-services list (zero matches for `appcheck`/`recaptcha`).

**Conclusion, independently confirmed, not merely repeated from the Technical Review or Cloud Environment Strategy:** `eleventh-on-us` **is** development-stage-only (no Functions/Cloud Run deployed, matching the Cloud Environment Strategy's own prior description) **and is unsuitable** as the target `europe-west1` development project — both its Firestore and Storage locations are immutable and neither matches `europe-west1`. Using it would require either (a) a full data-plane recreation (new Firestore database + new Storage bucket within the same project, which Firestore doesn't support for the *default* database without project-level workarounds) or (b) treating it as fully retired in favor of new, correctly-regioned projects. This task does not decide which — that is an implementation decision explicitly left open by the Cloud Environment & Deployment Strategy §4 ("Which existing project (if any) becomes `dev`... is an implementation decision for Phase 1, not decided here").

## 15. Proposed Development Project ID

**Recommendation, not a decision:** following the Cloud Environment & Deployment Strategy §4's own example pattern (`<platform>-<environment>`, explicitly stated to be "example naming convention only — no project ID is fixed by this document"), a candidate development project ID would be **`11thonus-dev`**. This is a proposal for Founder confirmation, not an approved value — see §18, item 2.

## 16. Proposed Staging Project ID

**Recommendation, not a decision:** following the same pattern, a candidate staging project ID would be **`11thonus-staging`**. Also a proposal requiring Founder confirmation — see §18, item 2.

## 17. Project-ID Availability Results

**Verified fact:** neither `11thonus-dev` nor `11thonus-staging` appears among the 19 projects currently accessible to this account (`firebase projects:list`, independently grepped for `11thonus`/`eleventh` — only `eleventh-on-us` matched).

**Unresolved, cannot be determined read-only:** Firebase/GCP project IDs are globally unique across *all* Google Cloud customers, not just this account. There is no read-only API or CLI command that checks global ID availability without attempting actual creation — availability can only be conclusively confirmed at creation time, which this task does not perform. This is disclosed as an open question, not assumed to resolve favorably.

**APIs and services project provisioning would require**, based on this repository's actual `firebase.json` (not speculative): `firebase.googleapis.com`, `firestore.googleapis.com`, `firebasestorage.googleapis.com`, `firebasehosting.googleapis.com`, `cloudfunctions.googleapis.com`, `identitytoolkit.googleapis.com` (Auth), plus the supporting services Firebase's own project-initialization flow enables automatically (`serviceusage`, `cloudresourcemanager`, `firebaseinstallations`, `fcm`/`fcmregistrations`, `firebaserules`, `logging`, `monitoring`, `pubsub`, `cloudbuild`/`artifactregistry` for Functions v2 deploys). App Check (`firebaseappcheck.googleapis.com`) and its reCAPTCHA provider are **not** currently enabled on `eleventh-on-us` and would need explicit enablement (an Engineering-Lead-level action per Cloud Environment & Deployment Strategy §7, since it is tied to the already-`CONFIRMED` App Check foundation requirement) once a real project exists.

## 18. Billing and Ownership Requirements

**Verified fact:** billing attachment is a distinct action from project creation, and Cloud Environment & Deployment Strategy §7 assigns "Enable or modify billing" to **Founder only** — no exception for an Engineering Lead or coding agent. This is unaffected by the fact that this personal account already has open billing accounts and has already attached one to `eleventh-on-us`; governance authority, not technical capability, is the controlling constraint.

**Required Founder decisions before any project creation** (verbatim from the task's own required list, each answered against what is and is not already governed):

1. **Founder authorization to create development and staging projects** — not yet given in any governing document reviewed; `DEC-TECH-005`/`DEC-LEGAL-006` authorize the *region and legal position*, not the act of creating specific projects. **Required from the Founder.**
2. **Approved project IDs** — no ID is fixed by any governing document (Cloud Environment & Deployment Strategy §4 explicitly states its `<platform>-<environment>` pattern is "example... only"). §15–16 above are proposals only. **Required from the Founder.**
3. **Approved display names** — not addressed by any governing document. **Required from the Founder.**
4. **Approved billing-account handling** — not addressed; which billing account (of the several visible on this personal account) or a new one, and under what account/organization, is undecided. **Required from the Founder.**
5. **Whether production should also be created now or deferred** — the Cloud Environment & Deployment Strategy §4 lists Development, Staging, and Production as the three environments needing separate projects, but does not sequence *when* each is created relative to the others; the Engineering Implementation Programme's ENG-P1-001 row names only "dev/staging projects," not production. **Required from the Founder**, though the existing Programme text leans toward dev/staging first.
6. **Confirmation of the account/organization under which new projects must be owned** — no governing document specifies this. The current authenticated account is personal (§13); whether 11thONUS projects should live there (matching `eleventh-on-us`'s own precedent) or under a new dedicated organization is entirely open. **Required from the Founder.**

No governing document reviewed resolves any of these six items; none is inferred here.

## 19. Risks

- The 19-project personal-account context (§13) means any future project-creation action, once authorized, must be executed carefully to avoid any interaction with the other 18 unrelated projects (e.g., accidental `gcloud config set project` pointing subsequent commands at the wrong project) — a process risk for whoever executes the eventual creation step, not a defect in this task.
- Global project-ID availability for the two proposed candidate IDs (§17) is unconfirmed and can only be resolved at creation time — a real, disclosed unknown, not assumed to be fine.
- `eleventh-on-us`'s immutable Firestore/Storage locations (§14) mean any decision to reuse vs. retire that project has a real cost either way (data migration vs. project abandonment) — not analyzed further here, as it is explicitly out of this task's read-only scope and awaits the Founder decisions in §18.
- The AC-1 fix changes `initializeFirebaseAppCheck` from never-throwing to throwing under one new condition (`!isDev && !siteKey`). This is intentional (fail-closed), but it means `initializeFirebasePlatform`/`main.tsx`'s boot sequence would now hard-fail in that specific combination — verified this combination is unreachable in every current test and emulator path (all use `useEmulator: true` → `isDev: true`), so no existing behavior regressed, but this is now a live constraint any future production `.env` configuration must satisfy.

## 20. Rollback Instructions

Every file this task created, modified, or deleted, individually:

- **Delete** `docs/05-implementation/reports/ENG-P1-001-review-observations-and-infrastructure-preflight-2026-07-21.md` (this file).
- **Restore** the root `.env.example` (recreate with its prior content) and **revert** `apps/web/.env.example` to its pre-task content, if reverting CFG-1's correction is desired (not recommended — this would reintroduce the finding).
- **Revert** `apps/web/src/infrastructure/firebase/appCheck.ts` — remove the `if (!options.isDev) { throw ... }` branch, restoring unconditional warn-and-continue.
- **Revert** `apps/web/src/infrastructure/firebase/appCheck.test.ts` — restore the original 4 tests (both `isDev: false`).
- **Revert** `apps/web/src/infrastructure/firebase/app.test.ts` — restore the removed `afterEach` hook (not recommended — it was misleading).
- **Revert** `functions/src/infrastructure/firebase/admin.test.ts` — remove the `afterEach` cleanup hook and its `deleteApp`/`getApps` import additions.
- **Revert** the two targeted corrections in the ENG-P1-001 Implementation Report (restore the original "No `.env.example` existed" and original `.env.local` risk wording).
- **Revert** the dated notes added to the Engineering Implementation Programme and Coding-Agent Prompt Register (status fields were never changed by this task, so no status revert is needed).
- **Revert** the single appended entry in `docs/changes/IMPLEMENTATION_CHANGES.md` (remove only this task's section; do not touch any entry above it).

Nothing in this task was committed or pushed; rollback today is discarding the working-tree changes above. No live Firebase/GCP resource was touched, so there is nothing to roll back on the infrastructure side.

## 21. Status

`ENG-P1-001` remains **Approved**. Not `Committed`, `Pushed`, `Deployed`, or `Complete`. `ENG-P1-002` remains **Blocked**. `ENG-P1-002` was not started.

**Required Stop Gate reached.** Per this task's explicit instruction, development/staging Firebase project creation will not proceed unless a later prompt explicitly provides all six items in §18 — Founder authorization, approved project IDs, approved display names, approved billing-account handling, a production-timing decision, and confirmation of the owning account/organization. None of the six is inferred here.

## 22. Tracking-Document Changes

- [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) — dated note appended to the Phase 1 status narrative and the `ENG-P1-001` row's `Notes` field, referencing this report; `Status` field unchanged (`Approved`).
- [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md) — dated note appended; `Status` field unchanged (`Approved`).
- [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md) — one new append-only entry (below).
