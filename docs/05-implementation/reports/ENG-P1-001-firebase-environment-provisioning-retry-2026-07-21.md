> **Title:** ENG-P1-001 Firebase Development and Staging Environment Provisioning — Retry
> **Status:** Development and Staging projects created and region-validated; Storage stopped at the billing gate; App Check partially assessed; no billing attached; no Production; no deployment
> **Date:** 2026-07-21
> **Classification:** Founder-authorized live-infrastructure provisioning — real Firebase/GCP resources were created in this task. The previous attempt (`ENG-P1-001-firebase-environment-provisioning-2026-07-21.md`) remains unchanged as historical evidence of a correct stop-condition event, not superseded.

# ENG-P1-001 Firebase Development and Staging Environment Provisioning — Retry

## 1. Executive Summary

Using the corrected, syntactically valid project IDs `eleventh-on-us-dev` and `eleventh-on-us-staging`, both the Development and Staging Google Cloud/Firebase projects were created successfully under `fredkenogo@gmail.com`, region `europe-west1`. Both preferred IDs were available on the first attempt — no fallback was needed. Firebase was added to both (`eleventh-on-us-dev` confirmed via manual Firebase Console attachment per Founder instruction mid-task; `eleventh-on-us-staging` added via CLI). A default Firestore Native database was created for each project, independently verified at `locationId: europe-west1` — exactly matching `DEC-TECH-005`, on the free tier, no billing required. Cloud Storage bucket creation was attempted for both and **stopped at the billing gate**: Google Cloud returned `"The billing account for the owning project is disabled in state absent"` — no bucket was created for either project, no billing was attached, no alternative region was accepted. Minimal Firebase Authentication was enabled (API only, zero users, zero sign-in providers) for both. The Firebase App Check API was enabled for Development (no billing required), but full App Check configuration remains blocked on manual, external steps (a registered Web App and a reCAPTCHA site key tied to a real domain) that this task does not perform. A safe `.firebaserc` repository mapping was created with explicit `dev`/`staging` aliases only — no default project, no production alias — and the Firebase Emulator Suite was independently re-verified to still use the fake `demo-11thonus` project, unaffected.

`eleventh-on-us` was independently re-confirmed unchanged throughout. No Production project exists. No billing was attached. No deployment was performed. `ENG-P1-001` remains **Approved** — not `Complete`. `ENG-P1-002` remains **Blocked** and was not started.

## 2. Previous Blocker Resolution

The previous attempt's four approved IDs (`11thonus-dev`, `11thonus-dev-rw`, `11thonus-staging`, `11thonus-staging-rw`) all started with the digit `1`, which Google Cloud's project-ID syntax rule disallows (must start with a lowercase letter). The Founder's corrected IDs (`eleventh-on-us-dev`, `eleventh-on-us-staging`, and their `-rw` fallbacks) all start with the letter `e` and satisfy the rule. Both preferred IDs were available on the first attempt — confirmed by successful creation, not merely syntax validation — so no fallback was exercised for either environment.

## 3. Active Account Confirmation

**Verified fact.** Re-checked via `gcloud config get-value account` and `firebase login:list` immediately before any live command in this task: `fredkenogo@gmail.com` on both. Every `gcloud`/`firebase` command in this task carried an explicit `--account=fredkenogo@gmail.com` (where supported) and an explicit project ID/`--project` flag — no command relied on the ambient active `gcloud` project, and `gcloud config set project` was never run.

## 4. Preferred IDs Attempted

1. `eleventh-on-us-dev` (Development, preferred) — **succeeded**.
2. `eleventh-on-us-staging` (Staging, preferred) — **succeeded**.

## 5. Fallback Usage

None. Both preferred IDs were available on the first attempt; `eleventh-on-us-dev-rw` and `eleventh-on-us-staging-rw` were never invoked.

## 6. Final Project IDs

- Development: `eleventh-on-us-dev`
- Staging: `eleventh-on-us-staging`

## 7. Display Names

- Development: `11thONUS Development` — confirmed via `gcloud projects describe`, exact match to the approved value.
- Staging: `11thONUS Staging` — confirmed via `gcloud projects describe`, exact match to the approved value.

Both projects: `lifecycleState: ACTIVE`; no `parent`/organization or folder field present (consistent with the account's zero-organization state, independently confirmed in the prior Closure Preflight); billing unattached at creation time (`billingEnabled: false` on both, confirmed immediately after creation, before any further action — no automatic billing attachment occurred).

## 8. Firebase Enablement

- **Development (`eleventh-on-us-dev`):** the CLI's own `firebase projects:addfirebase` call was interrupted by a tool-permission failure mid-task; the Founder reported it was completed manually via the Firebase Console and instructed this task to treat the project as Firebase-enabled. This was independently corroborated, not merely trusted: the project subsequently appeared in `firebase projects:list` (a list that only includes Firebase-enabled projects), consistent with successful manual enablement.
- **Staging (`eleventh-on-us-staging`):** `firebase projects:addfirebase eleventh-on-us-staging` was run directly by this task and returned `"🎉 Your Firebase project is ready!"`. Independently re-verified via `gcloud services list --enabled`, which showed `firebase.googleapis.com` and the standard companion Firebase services (`firebasehosting`, `firebaseinstallations`, `firebaseremoteconfig`, `firebaserules`, etc.) enabled — confirmed directly, not only via the (initially laggy) `firebase projects:list` aggregation.

## 9. Firestore Configuration

For both projects: `gcloud firestore databases create --database="(default)" --location=europe-west1 --type=firestore-native`. Both required `firestore.googleapis.com` to be explicitly enabled first (a no-billing, in-scope action per Cloud Environment & Deployment Strategy §7, since Firestore is required by the already-`CONFIRMED` `DEC-TECH-005`); both then required a brief wait for API-enablement propagation before the create call succeeded (a known GCP consistency-lag behavior, resolved by bounded retry rather than assumption).

## 10. Firestore Immutable Location

**Verified fact, from the direct API response of each creation call, not inferred:**

- Development: `locationId: europe-west1`, `type: FIRESTORE_NATIVE`, `freeTier: true`.
- Staging: `locationId: europe-west1`, `type: FIRESTORE_NATIVE`, `freeTier: true`.

Both exactly match the approved region and `DEC-TECH-005`. No alternative location (`nam5`, `eur3`, `us-east1`, or otherwise) was proposed by the tooling at any point — the previously-verified evidence that `europe-west1` is directly selectable (from the prior Closure Preflight) held true in practice.

## 11. Storage Attempt and Result

Attempted for both projects: `gcloud storage buckets create gs://<project-id>.firebasestorage.app --location=europe-west1`. **Both failed identically and immediately, before any resource was created:**

```
ERROR: (gcloud.storage.buckets.create) HTTPError 403: The billing account for the
owning project is disabled in state absent.
```

This is Google Cloud's own billing-requirement error, not a region or naming issue — confirming Storage requires an attached billing account, independent of region choice. Per this task's explicit instruction, no billing was attached, no alternative region was attempted, and no further Storage action was taken. `gcloud storage buckets list` independently confirmed zero buckets exist for either project after the attempt.

## 12. Storage Location

Not applicable — no bucket was created for either project.

## 13. Authentication Initialization

For both projects: `gcloud services enable identitytoolkit.googleapis.com` — succeeded, no billing required. Independently verified enabled via `gcloud services list --enabled`. No sign-in provider was configured. `firebase auth:export` against both projects returned `CONFIGURATION_NOT_FOUND` — confirming no Auth configuration exists beyond the bare API enablement, and by construction, zero users exist (there is no user store to export from). This is the intended minimum: the Auth service is reachable for future SDK-level validation, nothing more was configured.

## 14. App Check Status

`firebaseappcheck.googleapis.com` was enabled for Development — succeeded, no billing required, independently verified via `gcloud services list --enabled`. **Not completed, and explicitly not attempted:** App Check attaches to a specific registered Firebase Web App (`firebase apps:list` confirmed **zero** Web Apps are registered on either project), and a functioning reCAPTCHA v3 site key must be registered against a real domain via the separate Google reCAPTCHA admin console (external to Firebase/GCP project settings) — or reCAPTCHA Enterprise, whose enablement was not tested and may itself be billing-gated. **No real or placeholder production site key was created or exposed.** This remains a manual, external, domain-dependent step for a future task, not performed here.

## 15. Billing State

**Verified fact.** Neither project has billing attached: `gcloud billing projects describe` confirmed `billingEnabled: false` for both, both before and after every action in this task. No billing account was selected, inferred, or attached by this task. The one attempted billing-requiring action (Storage) was correctly stopped rather than resolved by attaching billing.

## 16. Billing Blocker

**Cloud Storage bucket creation** is the one service in this task's scope that cannot proceed without billing, confirmed by direct attempt against both projects (§11). No other attempted service (project creation, Firebase addition, Firestore, Auth API, App Check API) required billing. Per this task's explicit instruction, the open billing accounts (display names, IDs, and open/closed state) were listed directly in this session's chat response, not written into this report, the change log, or any tracked repository file — a separately authorized billing-selection task is required before Storage can proceed.

## 17. Repository Alias Mapping

`.firebaserc` created at the repository root:

```json
{
  "projects": {
    "dev": "eleventh-on-us-dev",
    "staging": "eleventh-on-us-staging"
  }
}
```

No `"default"` key and no `"production"` alias — a deployment command that doesn't explicitly pass `--project dev`/`--project staging`/an explicit project ID will not silently resolve to a live project. Independently re-verified after this file was created: `pnpm emulators:validate` still initializes `functions[europe-west1-ping]` under the fake `demo-11thonus` project (the emulator scripts pass `--project demo-11thonus` explicitly, which is unaffected by `.firebaserc`'s aliases).

**One additional, narrowly-scoped correction made in this task:** `.gitignore` previously listed `.firebaserc` alongside genuinely sensitive files (`service-account*.json`, `firebase-debug.log`). `.firebaserc` contains no secret — only project-ID aliases, comparable in sensitivity to the already-tracked `firebase.json`. An ignored mapping file cannot serve as the "controlled repository mapping" this task's Part F explicitly asks for (nothing to share with the Founder or a future CI run), so the single `.firebaserc` line was removed from `.gitignore`, directly in service of this task's own stated goal — not an unrelated change. Neither `.gitignore` nor `.firebaserc` was staged or committed; both remain in the working tree for the Founder's own review before committing.

## 18. Files Created

- `.firebaserc` (repository root) — `dev`/`staging` project aliases only.
- `docs/05-implementation/reports/ENG-P1-001-firebase-environment-provisioning-retry-2026-07-21.md` (this report).

## 19. Files Modified

- `.gitignore` — removed the `.firebaserc` line (§17).
- [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) — dated note only; `ENG-P1-001`'s `Status` field unchanged (`Approved`).
- [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md) — dated note and report link only; `Status` field unchanged (`Approved`).
- [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md) — one new append-only entry.

No application code, test, dependency, or `.env.example` file was touched — the newly created projects' real config values (API keys, App IDs) were never generated or populated into any environment file, consistent with "Do not commit real environment values."

## 20. Commands Executed

```
gcloud config get-value account
firebase login:list
firebase projects:list --account=fredkenogo@gmail.com

gcloud projects create eleventh-on-us-dev --name="11thONUS Development" --account=fredkenogo@gmail.com
gcloud projects describe eleventh-on-us-dev --account=fredkenogo@gmail.com
gcloud billing projects describe eleventh-on-us-dev --account=fredkenogo@gmail.com
firebase projects:addfirebase eleventh-on-us-dev --account=fredkenogo@gmail.com   (interrupted; completed manually per Founder, independently corroborated)

gcloud projects create eleventh-on-us-staging --name="11thONUS Staging" --account=fredkenogo@gmail.com
gcloud projects describe eleventh-on-us-staging --account=fredkenogo@gmail.com
gcloud billing projects describe eleventh-on-us-staging --account=fredkenogo@gmail.com
firebase projects:addfirebase eleventh-on-us-staging --account=fredkenogo@gmail.com

gcloud services enable firestore.googleapis.com --project=eleventh-on-us-dev --account=fredkenogo@gmail.com
gcloud firestore databases create --database="(default)" --location=europe-west1 --type=firestore-native --project=eleventh-on-us-dev --account=fredkenogo@gmail.com   (bounded retry for propagation)
gcloud services enable firestore.googleapis.com --project=eleventh-on-us-staging --account=fredkenogo@gmail.com
gcloud firestore databases create --database="(default)" --location=europe-west1 --type=firestore-native --project=eleventh-on-us-staging --account=fredkenogo@gmail.com   (bounded retry for propagation)

gcloud storage buckets create gs://eleventh-on-us-dev.firebasestorage.app --location=europe-west1 --project=eleventh-on-us-dev --account=fredkenogo@gmail.com   (failed — billing required)
gcloud storage buckets create gs://eleventh-on-us-staging.firebasestorage.app --location=europe-west1 --project=eleventh-on-us-staging --account=fredkenogo@gmail.com   (failed — billing required)
gcloud storage buckets list --project=eleventh-on-us-dev --account=fredkenogo@gmail.com
gcloud storage buckets list --project=eleventh-on-us-staging --account=fredkenogo@gmail.com

gcloud services enable identitytoolkit.googleapis.com --project=eleventh-on-us-dev --account=fredkenogo@gmail.com
gcloud services enable identitytoolkit.googleapis.com --project=eleventh-on-us-staging --account=fredkenogo@gmail.com
firebase auth:export <tmp> --project eleventh-on-us-dev --account=fredkenogo@gmail.com   (CONFIGURATION_NOT_FOUND, no users; tmp file deleted)
firebase auth:export <tmp> --project eleventh-on-us-staging --account=fredkenogo@gmail.com   (CONFIGURATION_NOT_FOUND, no users; tmp file deleted)

gcloud services enable firebaseappcheck.googleapis.com --project=eleventh-on-us-dev --account=fredkenogo@gmail.com
firebase apps:list --project eleventh-on-us-dev --account=fredkenogo@gmail.com   (no apps found)

gcloud projects describe eleventh-on-us-dev/staging --format="value(...)"   (per-project verification pass)
gcloud billing projects describe eleventh-on-us-dev/staging
gcloud firestore databases describe --database="(default)" --project=eleventh-on-us-dev/staging
gcloud functions list --project=eleventh-on-us-dev/staging   (SERVICE_DISABLED — API never enabled, confirming zero Functions possible)
gcloud run services list --project=eleventh-on-us-dev/staging   (SERVICE_DISABLED — API never enabled, confirming zero Cloud Run possible)
firebase hosting:sites:list --project eleventh-on-us-dev   (default site registered automatically, no release/deployment)
gcloud projects describe eleventh-on-us --format="value(...)"   (unchanged, spot-check)
firebase projects:list --account=fredkenogo@gmail.com | grep -i prod   (empty — no Production project)

gcloud billing accounts list --format="table(displayName,open)"

pnpm install --frozen-lockfile
pnpm -r run typecheck
pnpm lint
pnpm format:check
pnpm -r run build
pnpm -r run test
pnpm emulators:validate
```

## 21. Validation Results

| Check | Development | Staging |
|---|---|---|
| Project exists | ✅ `eleventh-on-us-dev`, `ACTIVE` | ✅ `eleventh-on-us-staging`, `ACTIVE` |
| Firebase enabled | ✅ (manual, independently corroborated) | ✅ (CLI, independently corroborated) |
| Display name correct | ✅ `11thONUS Development` | ✅ `11thONUS Staging` |
| Project ID approved | ✅ preferred ID, no fallback used | ✅ preferred ID, no fallback used |
| Firestore location | ✅ `europe-west1` | ✅ `europe-west1` |
| Storage location | N/A — not created (billing-blocked) | N/A — not created (billing-blocked) |
| Auth users | ✅ zero (`CONFIGURATION_NOT_FOUND`) | ✅ zero (`CONFIGURATION_NOT_FOUND`) |
| Sign-in provider beyond minimum | ✅ none | ✅ none |
| Functions deployed | ✅ none (API never enabled) | ✅ none (API never enabled) |
| Cloud Run deployed | ✅ none (API never enabled) | ✅ none (API never enabled) |
| Hosting deployment | ✅ default site registered, no release pushed | not individually re-checked; identical automatic-registration-only state expected |
| Application data | ✅ none — no bucket, no documents written | ✅ none |
| Billing state | ✅ `billingEnabled: false` | ✅ `billingEnabled: false` |
| No Production project | ✅ confirmed via full project list grep | ✅ (same check) |
| `eleventh-on-us` unchanged | ✅ re-confirmed, `ACTIVE`, unaltered | ✅ (same check) |

Repository validation (re-run after `.firebaserc`/`.gitignore` changed):

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | ✅ lockfile unchanged |
| `pnpm -r run typecheck` | ✅ clean, both workspaces |
| `pnpm lint` | ✅ zero findings |
| `pnpm format:check` | ✅ clean |
| `pnpm -r run build` | ✅ both workspaces; same pre-existing bundle-size warning |
| `pnpm -r run test` | ✅ 34/34 |
| `pnpm emulators:validate` | ✅ `functions[europe-west1-ping]` under the fake `demo-11thonus` project — **independently confirmed unaffected by the new `.firebaserc`** |

## 22. Security Review

No API key, App ID, service-account key, or billing-account identifier was written to any tracked file. Real Firebase client config (`apiKey`, `appId`, etc.) for either new project was never fetched or written anywhere — `apps/web/.env.example` remains values-free and was not touched by this task. `.firebaserc` contains only project-ID strings, no credentials. Billing account IDs, gathered for the required stop-gate report, were presented only in this session's direct chat response, never written to this file, the change log, or any tracked file, per explicit instruction.

## 23. Unrelated-Project Isolation Confirmation

**Verified fact.** `eleventh-on-us` was independently re-checked (§9 of the validation table) and confirmed unchanged. Every live-resource command in this task carried an explicit `--project`/positional project ID and, where supported, an explicit `--account=fredkenogo@gmail.com` — none relied on the ambient active `gcloud` project. `gcloud config set project` was never run at any point in this task. No command referenced any of the other 17 unrelated projects on this account.

## 24. Remaining Founder Action

1. **Billing-account selection** for whenever Cloud Storage (and, later, Cloud Functions/Cloud Run deployment) becomes necessary — the open accounts were listed with full identifiers directly in this session's chat, not in this report; a separately authorized billing-selection task is required before Storage can be created.
2. **App Check completion** — registering a Web App on each project and obtaining a reCAPTCHA v3 (or Enterprise) site key tied to a real domain are manual, external, domain-dependent steps not performed here.
3. No other prior open item changed — production timing and owning-account decisions from the original Closure Preflight remain as previously recorded (production still deferred; owning account confirmed as `fredkenogo@gmail.com` and now exercised).

## 25. Risks

- Storage (and by extension, any feature depending on Cloud Storage) cannot proceed until a billing account is selected and attached by the Founder — a real, disclosed gap, not silently worked around.
- App Check remains only partially configured; until a Web App and a real site key exist, the client-side fail-closed behavior implemented earlier in ENG-P1-001 (throwing outside development when no site key is present) means any future non-development build pointed at these projects would fail at boot until that manual step is completed — this is the intended, safe behavior, not a defect, but worth the Founder's awareness before attempting a non-development build against either project.
- The two new projects currently have no registered Web App and thus no `firebaseConfig` object yet — populating `apps/web/.env.local` against either project is not yet possible and was not attempted in this task.

## 26. Rollback Instructions

**Documentation/repository side** (uncommitted, safe to discard):

- Delete `.firebaserc`.
- Revert `.gitignore` (restore the `.firebaserc` line).
- Delete this report.
- Revert the dated notes in the Engineering Implementation Programme and Coding-Agent Prompt Register (status fields were never changed).
- Revert the appended `IMPLEMENTATION_CHANGES.md` entry.

**Infrastructure side** (real, requires deliberate action — not performed by this task, listed for completeness only): the two created projects (`eleventh-on-us-dev`, `eleventh-on-us-staging`) can be deleted via `gcloud projects delete <project-id>` if the Founder decides not to proceed — both are within Google Cloud's standard 30-day soft-delete recovery window, and neither has billing, application data, or deployed services attached, so deletion (if ever desired) would be low-risk. This task does not perform or recommend deletion; it is noted only as the available rollback path.

## 27. Status

`ENG-P1-001` remains **Approved**. Not `Committed`, `Pushed`, `Deployed`, or `Complete` — project creation, even successful, does not by itself satisfy commit/push/deploy/completion requirements per the Definition of Done. `ENG-P1-002` remains **Blocked** and was **not started**.

## 28. Tracking-Document Changes

- [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) — dated note appended; `Status` field unchanged (`Approved`).
- [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md) — dated note and report link appended; `Status` field unchanged (`Approved`).
- [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md) — one new append-only entry (below).
