> **Title:** ENG-P1-001 Manual Storage Provisioning Verification and Infrastructure Closure Assessment
> **Status:** Infrastructure closure criteria satisfied — work package remains `Approved`, not `Complete`
> **Date:** 2026-07-21
> **Classification:** Read-only live-infrastructure verification, plus two local-repository-file corrections (no live resource created, deleted, or reconfigured)

# ENG-P1-001 Manual Storage Provisioning Verification and Infrastructure Closure Assessment

## 1. Executive Summary

Every one of the Founder's five manual steps was independently verified against live infrastructure, not assumed. **Staging billing is now enabled**, sharing the same active billing account as Development. **Both Storage buckets exist**, exactly one per project, both in `EUROPE-WEST1`, both empty, both belonging to the correct project. **Both projects' live Storage Rules are the restrictive, deny-by-default set** (`allow read, write: if false;`) — confirmed by directly querying the Firebase Rules API, not by reading the local repository file (which, on inspection, had drifted to an unrelated, unsafe open test-mode template — see §15 for why this did not represent a live security exposure).

Two local-repository-only discrepancies were found and corrected in this task, both pre-existing drift from local tooling runs, neither reflecting the actual live, secure state:

1. **`.firebaserc`** had acquired an unauthorized `"default": "eleventh-on-us"` key, violating the "no default alias" rule this session has enforced from the start. Removed — `.firebaserc` now contains only `dev`/`staging`, exactly as approved.
2. **`storage.rules`** (the local file) had been overwritten with Firebase's default open test-mode template, diverging from both the live rules and the original ENG-P0-001 governed baseline. Restored to the deny-by-default baseline, matching the verified-live state.

All other checks — Firestore region, Auth, App Check, Functions, Cloud Run, Hosting, unrelated-project isolation — remain exactly as the prior task recorded, unaffected by the Founder's manual work. Full repository validation passes (34/34 tests), and the Emulator Suite remains independently confirmed on `demo-11thonus`.

**Infrastructure closure criteria satisfied.** `ENG-P1-001` remains **Approved** — not `Complete`. `ENG-P1-002` remains **Blocked**, not started. Nothing was committed or pushed.

## 2. Pre-Verification Analysis

- **Git/working-tree state:** unchanged in scope from the prior task, plus two locally-drifted files (`.firebaserc`, `storage.rules`) discovered and corrected in this task, and a cosmetic `firebase.json` formatting drift resolved by the repository's own `pnpm format` tooling.
- **Expected live state entering this task:** per the prior report, both projects Firebase-enabled, Firestore at `europe-west1`, no Storage bucket, Development billing enabled/Staging not, no Functions/Cloud Run/Hosting deployment, App Check deferred.
- **Verification strategy:** independent `gcloud`/`firebase` read-only queries for every claim; for Storage Rules specifically, querying the live Firebase Rules API directly (`firebaserules.googleapis.com`) rather than trusting the local repository file, since the two can diverge (and did).
- **Findings that would block closure:** billing not enabled for either project; a bucket in the wrong region; a bucket with existing objects; open/public Storage Rules live on either project; any unintended Functions/Hosting/Cloud Run deployment; a live `.firebaserc` default or production alias; any tracked secret.
- **Expected files to change:** none anticipated going in (this is a verification task); in practice, two local-drift corrections (`.firebaserc`, `storage.rules`) plus a cosmetic `firebase.json` reformat were required to bring the repository back in line with the verified-safe live state, plus this report and the required tracking-document notes.
- **Why this task does not deploy Rules or application code:** the live Rules already match the correct, restrictive posture (independently confirmed) — there is nothing to deploy to fix. Formal, domain-aware Rules authorship remains ENG-P1-003's scope, not this task's; deploying anything here would exceed this task's read-only verification mandate even where the outcome would be benign.

## 3. Active Account Confirmation

**Verified fact.** `gcloud config get-value account` and `firebase login:list` both confirmed `fredkenogo@gmail.com` before any live query in this task. Every project-scoped command carried an explicit `--project` and, where supported, `--account=fredkenogo@gmail.com`. `gcloud config set project` was never run.

## 4. Development Billing Verification

**Verified fact**, via `gcloud billing projects describe eleventh-on-us-dev`:

- Billing enabled: **Yes**
- Attached account active/open: **Yes**
- Unchanged from the prior task's finding.

## 5. Staging Billing Verification

**Verified fact**, via `gcloud billing projects describe eleventh-on-us-staging`:

- Billing enabled: **Yes** — **changed since the prior task**, confirming the Founder's manual Blaze upgrade succeeded.
- Attached account active/open: **Yes**.

## 6. Billing Symmetry Result

**Verified fact.** Development and Staging use the **same** billing account (independently compared via `billingAccountName`, identifiers redacted per instruction). Both symmetric, both active. No asymmetry remains.

## 7. Development Bucket Identity

**Verified fact**, read directly from `gcloud storage buckets list --project=eleventh-on-us-dev` (bucket list read first, name not assumed): exactly one bucket, `eleventh-on-us-dev.firebasestorage.app`, belonging to `eleventh-on-us-dev` (confirmed via the bucket's own project-scoped ACL entries referencing project number `709450867178`, matching `eleventh-on-us-dev`'s own project number).

## 8. Development Bucket Location

**Verified fact**, from `gcloud storage buckets describe`: `location: EUROPE-WEST1`, `location_type: region` (single-region, not a multi-region alias) — exactly the required, canonical representation. No bucket exists in any other region for this project.

## 9. Development Security Configuration

**Verified fact**, from the bucket's full raw description:

- Storage class: `REGIONAL` (standard, correct for a single-region bucket).
- ACLs: only `project-owners`/`project-editors`/`project-viewers` entities present — **no `allUsers` or `allAuthenticatedUsers` grant**, confirming no public access at the ACL layer.
- `public_access_prevention: inherited` — not explicitly enforced at the bucket level (the account has no GCP organization, so there is no org policy to inherit from). **Non-blocking observation, not a defect**: the operative access control for this bucket is the Firebase Storage Security Rules layer (§15), independently confirmed to deny all read/write; this is standard for a Firebase-auto-provisioned default bucket, not something introduced or weakened by this task or the Founder's actions.
- `uniform_bucket_level_access: false` (fine-grained/ACL-based access control) — the Firebase-managed default for auto-provisioned buckets, not a deviation.
- `soft_delete_policy`: 7-day retention (`604800` seconds) — Google Cloud Storage's own current platform default for newly created buckets, not a Firebase- or Founder-configured setting.
- No `retentionPolicy` (bucket lock) field present — no retention policy configured, as expected.
- No `lifecycle` configuration present — no lifecycle rules, as expected.
- No `encryption` field present — default Google-managed encryption, standard.

## 10. Development Object Count

**Verified fact.** `gcloud storage ls gs://eleventh-on-us-dev.firebasestorage.app/**` returned "no matches found" — **zero objects**.

## 11. Staging Bucket Identity

**Verified fact**, read directly from `gcloud storage buckets list --project=eleventh-on-us-staging`: exactly one bucket, `eleventh-on-us-staging.firebasestorage.app`, belonging to `eleventh-on-us-staging` (ACL entities reference project number `762828307295`, matching).

## 12. Staging Bucket Location

**Verified fact:** `location: EUROPE-WEST1`, `location_type: region`. No bucket in any other region.

## 13. Staging Security Configuration

**Verified fact**, independently checked, not assumed symmetric from Development: identical pattern — `REGIONAL` storage class, no public ACL grant, `public_access_prevention: inherited` (same non-blocking observation as §9), `uniform_bucket_level_access: false`, 7-day soft-delete default, no retention policy, no lifecycle rules, default encryption.

## 14. Staging Object Count

**Verified fact.** `gcloud storage ls gs://eleventh-on-us-staging.firebasestorage.app/**` returned "no matches found" — **zero objects**.

## 15. Storage Rules Comparison

**This is the most consequential finding in this task, and it required looking past the local repository file to the actual live state.**

- **Live rules, both projects — verified fact**, queried directly via the Firebase Rules API (`firebaserules.googleapis.com/v1/projects/{project}/releases` → `.../rulesets/{id}`), not the local file: both `eleventh-on-us-dev` and `eleventh-on-us-staging` have exactly one active release under `firebase.storage/<bucket-name>`, each pointing to a ruleset whose content is:
  ```
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      match /{allPaths=**} {
        allow read, write: if false;
      }
    }
  }
  ```
  **This is the restrictive/deny-by-default rule set** — confirming the Founder's Console selection of "the restrictive/production Storage Rules option" succeeded on both projects. Release timestamps (`2026-07-21T19:08:09Z` Development, `2026-07-21T19:09:13Z` Staging) are consistent with the Founder's reported manual work.
- **No public unauthenticated read/write path exists on either project.**
- **The local repository's `storage.rules` file, as found at the start of this task, did NOT match this live state** — it contained the Firebase CLI's default open test-mode template (`allow read, write: if request.time < timestamp.date(2026, 8, 15);`), a 30-day-expiring, fully-open rule. `git diff` confirmed this was a genuine change from the tracked baseline (`3a50710`, ENG-P0-001), which had the same deny-by-default content as the verified-live rules.
- **Root-cause assessment:** the local file discrepancy is consistent with `firebase init storage` having been run locally at some point (its own default behavior is to write this exact open-template file to disk), independent of and unrelated to the Console-based rule *selection* the Founder performed for each project. **The live, deployed rules were never open** — this was a local file drift, not a live security exposure, and is treated accordingly (not as the Part C "Console created open test-mode rules" blocker scenario, which was checked for and ruled out by the direct live-rules query).
- **Correction made in this task:** `storage.rules` was restored to the deny-by-default content matching both the original governed baseline and the verified-live state. This is a repository-file correction, not a deployment — no `firebase deploy` command was run at any point in this task.
- **Expected divergence going forward:** the live rules' exact deny-by-default content will remain the correct baseline until ENG-P1-003 authors and deploys the formal, domain-aware deny-by-default Rules set — that is expected, governed, future work, not a gap this task needed to close.

## 16. Firebase Recognition

**Verified fact**, both projects: `firebasestorage.googleapis.com` enabled (independently checked via `gcloud services list --enabled`); no second default bucket exists (`gcloud storage buckets list` returned exactly one bucket per project); the bucket names (`<project-id>.firebasestorage.app`) are the Firebase-managed naming convention itself, confirming Firebase recognizes each bucket as its own default bucket (a non-Firebase-recognized bucket would not carry this domain suffix). No test file was uploaded to verify this by any other means.

## 17. Firestore Region Re-Verification

**Verified fact**, re-checked independently in this task, not assumed unchanged: both `eleventh-on-us-dev` and `eleventh-on-us-staging` remain `locationId: europe-west1`, `type: FIRESTORE_NATIVE` — unaffected by the Founder's Storage/billing work, exactly as every prior task recorded.

## 18. Functions/Cloud Run/Hosting Checks

**Verified fact**, both projects, unchanged from the prior task:

- `cloudfunctions.googleapis.com`: not enabled, either project.
- `run.googleapis.com`: not enabled, either project.
- Zero Functions, zero Cloud Run services possible (APIs disabled).
- Each project has exactly one auto-registered default Hosting site (`eleventh-on-us-dev.web.app`, `eleventh-on-us-staging.web.app`) with no release ever deployed.

## 19. App Check Deferral Confirmation

**Verified fact.** No Web App registered on either project (`firebase apps:list` → "No apps found," both). `firebaseappcheck.googleapis.com` remains enabled on Development only (unchanged from the prior task, not touched in this task); not enabled on Staging. No `recaptchaenterprise`/reCAPTCHA API enabled on either project. No real or placeholder site key exists anywhere. No Firebase client configuration was added to any repository file. App Check remains intentionally deferred, exactly as recorded previously.

## 20. `.firebaserc` Verification

**Finding, corrected in this task.** At the start of this task, `.firebaserc` read:

```json
{
  "projects": {
    "dev": "eleventh-on-us-dev",
    "staging": "eleventh-on-us-staging",
    "default": "eleventh-on-us"
  }
}
```

The `"default": "eleventh-on-us"` key was **not** present when this file was last verified (the prior task's report confirmed the mapping matched the approved `dev`/`staging`-only content exactly) and violates the standing, repeatedly-enforced "no default alias" rule — a default alias reintroduces the exact accidental-deployment risk this session has guarded against from the first provisioning task. **Corrected**: the file now reads exactly:

```json
{
  "projects": {
    "dev": "eleventh-on-us-dev",
    "staging": "eleventh-on-us-staging"
  }
}
```

No production alias. File remains untracked but not gitignored (eligible to be committed, per the correction made in an earlier task).

## 21. Emulator Isolation

**Verified fact**, independently re-run after the `storage.rules`/`.firebaserc` corrections: `pnpm emulators:validate` initializes `functions[europe-west1-ping]` under the fake `demo-11thonus` project. The emulator scripts pass `--project demo-11thonus` explicitly, unaffected by `.firebaserc`'s aliases. Storage emulator started using the (now-corrected) deny-by-default `storage.rules` — the emulator's security posture was, if anything, made *more* correct by this task's correction, never weakened.

## 22. Files Created

- `docs/05-implementation/reports/ENG-P1-001-manual-storage-verification-2026-07-21.md` (this report).

## 23. Files Modified

- `.firebaserc` — removed the unauthorized `"default": "eleventh-on-us"` key (§20).
- `storage.rules` — restored to the deny-by-default baseline, matching the verified-live rules and the original governed content (§15).
- `firebase.json` — cosmetic-only; `pnpm format` (standard repository tooling) reformatted a local drift (multi-line vs. single-line arrays) back to the exact original formatting — confirmed via `git diff firebase.json` returning empty after the fix.
- [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) — dated note only; `Status` field unchanged (`Approved`).
- [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md) — dated note and report link only; `Status` field unchanged (`Approved`).
- [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md) — one new append-only entry.

No application code, test, or `.env.example` file was touched. No bucket, Rules deployment, Functions, Hosting release, Web App, or App Check resource was created, deleted, or reconfigured live.

## 24. Code Diff Summary

`.firebaserc`: −1 line (the unauthorized `default` key). `storage.rules`: reverted to the tracked baseline — `git diff storage.rules` returns empty. `firebase.json`: reverted to the tracked baseline — `git diff firebase.json` returns empty. Net effect: the repository's live-adjacent configuration files are now byte-for-byte consistent with their last-governed state, with `.firebaserc` (untracked, not gitignored) matching the approved mapping exactly.

## 25. Commands Executed

```
gcloud config get-value account
firebase login:list
cat .firebaserc
cat storage.rules
cat firebase.json
git log --oneline -- .firebaserc storage.rules firebase.json
git diff firebase.json
git diff storage.rules

gcloud billing projects describe eleventh-on-us-dev --account=fredkenogo@gmail.com
gcloud billing projects describe eleventh-on-us-staging --account=fredkenogo@gmail.com
gcloud billing accounts describe <redacted> --account=fredkenogo@gmail.com --format="value(open,displayName)"

gcloud storage buckets list --project=eleventh-on-us-dev/staging --account=fredkenogo@gmail.com --format="table(name,location,storageClass,timeCreated)"
gcloud storage buckets describe gs://eleventh-on-us-dev.firebasestorage.app --account=fredkenogo@gmail.com --format=json
gcloud storage buckets describe gs://eleventh-on-us-staging.firebasestorage.app --account=fredkenogo@gmail.com --format=json
gcloud storage ls gs://eleventh-on-us-dev.firebasestorage.app/** --account=fredkenogo@gmail.com
gcloud storage ls gs://eleventh-on-us-staging.firebasestorage.app/** --account=fredkenogo@gmail.com

gcloud auth print-access-token --account=fredkenogo@gmail.com
curl -H "Authorization: Bearer <token>" -H "x-goog-user-project: <project>" https://firebaserules.googleapis.com/v1/projects/<project>/releases
curl -H "Authorization: Bearer <token>" -H "x-goog-user-project: <project>" https://firebaserules.googleapis.com/v1/<ruleset-name>

gcloud services list --enabled --project=eleventh-on-us-dev/staging --account=fredkenogo@gmail.com --format="value(config.name)"
firebase apps:list --project eleventh-on-us-dev/staging --account=fredkenogo@gmail.com
firebase hosting:sites:list --project eleventh-on-us-dev/staging --account=fredkenogo@gmail.com
gcloud firestore databases describe --database="(default)" --project=eleventh-on-us-dev/staging --account=fredkenogo@gmail.com --format="value(locationId,type)"
firebase auth:export <tmp> --project eleventh-on-us-dev/staging --account=fredkenogo@gmail.com   (CONFIGURATION_NOT_FOUND both; tmp files deleted)

pnpm format:check   (flagged firebase.json)
pnpm format   (fixed)
pnpm install --frozen-lockfile
pnpm -r run typecheck
pnpm lint
pnpm format:check
pnpm -r run build
pnpm -r run test
pnpm emulators:validate
```

## 26. Dependencies Added

None.

## 27. Configuration Changes

`.firebaserc` and `storage.rules` corrected as described (§23). No live Firebase/GCP configuration was changed by this task — every live-infrastructure command was read-only (`describe`, `list`, `ls`, the Rules API's `GET`-only endpoints).

## 28. Validation Results

| Command | Result |
|---|---|
| `git diff --check` | ✅ clean |
| `pnpm install --frozen-lockfile` | ✅ lockfile unchanged |
| `pnpm -r run typecheck` | ✅ clean, both workspaces |
| `pnpm lint` | ✅ zero findings |
| `pnpm format:check` | ✅ clean (after the `firebase.json` auto-fix) |
| `pnpm -r run build` | ✅ both workspaces; same pre-existing bundle-size warning |
| `pnpm -r run test` | ✅ **34/34** |
| `pnpm emulators:validate` | ✅ `functions[europe-west1-ping]` under `demo-11thonus`; Storage emulator loaded the corrected deny-by-default rules |

## 29. Security Review

No API key, App ID, service-account key, or billing-account identifier was written to any tracked file in this task. The billing account comparison (§6) and the account-active check used only `open`/`displayName` fields, never the identifier, in any file. The Rules API bearer token used for the live-rules query was generated on demand via `gcloud auth print-access-token` and never persisted or logged to a file. Both live Storage Rules were independently confirmed restrictive (deny-all), not assumed. The one local-file security-adjacent finding (`storage.rules` drift) was corrected in the safe direction (restrictive), and was never live — no window of actual public exposure existed on either project's real Storage bucket at any point this task could observe.

## 30. Unrelated-Project Isolation

**Verified fact.** Every live command in this task carried an explicit `--project`/positional ID; `gcloud config set project` was never run. `eleventh-on-us` was not queried by any command in this task (its state was not re-verified here, since this task's scope is explicitly limited to the two Phase 1 projects). No other project on the account was referenced.

## 31. Infrastructure Closure Assessment

Evaluated against every stated criterion:

| Criterion | Result |
|---|---|
| Both projects Firebase-enabled | ✅ |
| Both projects billing attached and active | ✅ (same account, active) |
| Both Firestore databases in `europe-west1` | ✅ |
| Both Storage buckets in `europe-west1` | ✅ |
| Both buckets empty | ✅ |
| No public/open Storage Rules | ✅ (live rules deny-all on both, independently confirmed) |
| No unintended deployments | ✅ (no Functions, Cloud Run, Hosting release, Web App, App Check completion) |
| Aliases correct | ✅ (after this task's `.firebaserc` correction) |
| Emulator isolation intact | ✅ |
| No secrets tracked | ✅ |
| All validation passes | ✅ (34/34, clean build/lint/format/typecheck) |

**Infrastructure closure criteria satisfied.**

This is a criteria-satisfaction statement, not a work-package status transition. `ENG-P1-001` remains **Approved**. The formal transition to `Complete` requires a separate commit, push, CI verification, and Definition-of-Done reconciliation task, per this task's own explicit instruction.

## 32. Risks

- `public_access_prevention: inherited` on both buckets (§9/§13) is a non-blocking observation: no GCP organization exists on this account to enforce it, so it is not actively blocking a future public-ACL grant at the bucket-IAM layer, though Storage Security Rules currently deny all access regardless. Worth considering for future hardening (plausibly ENG-P1-003's security-foundation scope), not a defect in this task's outcome.
- The root cause of the `storage.rules`/`.firebaserc` local drift (most likely a `firebase init` run at some point during the Founder's manual Console work) is not fully certain — this task diagnosed and corrected the symptom (the drifted files) with direct evidence (git diff against the tracked baseline, live-state comparison), but did not, and could not, directly observe which specific local action produced the drift.
- The 7-day soft-delete retention (§9/§13) is a Google Cloud platform default, not independently evaluated against 11thONUS's own data-retention posture — noted for awareness, not treated as a blocker here.

## 33. Remaining Founder Actions

None required to reach the state this report certifies (infrastructure closure criteria satisfied). Looking ahead, beyond this task's scope: App Check completion (Web App registration + real reCAPTCHA key against a real domain) remains deferred to a future task; the formal, domain-aware Storage/Firestore Rules deployment remains ENG-P1-003's scope; the formal `Complete` transition for `ENG-P1-001` (commit, push, CI, Definition-of-Done reconciliation) is a separate, not-yet-authorized task.

## 34. Rollback Instructions

**Documentation/repository side** (uncommitted, safe to discard):

- Delete this report.
- Revert `.firebaserc` and `storage.rules` to their state at the start of this task, if reverting these corrections is ever desired (not recommended — both corrections restore the repository to its previously-governed, safer state).
- Revert the dated notes in the Engineering Implementation Programme and Coding-Agent Prompt Register (status fields were never changed).
- Revert the appended `IMPLEMENTATION_CHANGES.md` entry.

**Infrastructure side:** no live resource was created, deleted, or reconfigured by this task — every live-infrastructure command was read-only. There is nothing to roll back on the infrastructure side.

## 35. Status

`ENG-P1-001` remains **Approved**. Not `Committed`, `Pushed`, `Deployed`, or `Complete`. `ENG-P1-002` remains **Blocked**, not `Ready`, and was **not started**. Per this task's explicit instruction, the maximum status statement recorded is: **Infrastructure closure criteria satisfied.**

## 36. Tracking-Document Changes

- [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) — dated note appended; `Status` field unchanged (`Approved`).
- [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md) — dated note and report link appended; `Status` field unchanged (`Approved`).
- [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md) — one new append-only entry (below).
