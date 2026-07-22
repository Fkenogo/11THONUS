> **Title:** ENG-P1-001 Billing Verification and Storage Completion
> **Status:** Partial — billing independently verified for both environments; Storage creation blocked for Development by a newly-discovered, non-billing technical obstacle; Staging Storage not attempted (billing not enabled)
> **Date:** 2026-07-21
> **Classification:** Founder-authorized live-infrastructure task — read-only billing verification plus one attempted (unsuccessful) live-resource creation; no bucket, Rules, Functions, Hosting, or App Check resource was created

# ENG-P1-001 Billing Verification and Storage Completion

## 1. Executive Summary

Billing was independently verified for both projects, exactly as instructed — the Founder's "Blaze paid plan" statement was not assumed to apply to both environments. **Development (`eleventh-on-us-dev`) has billing enabled**, attached to an active/open billing account. **Staging (`eleventh-on-us-staging`) does not have billing enabled** — confirmed twice, not a transient read. This is the "Development billing-enabled, Staging not" asymmetric case this task's decision logic anticipates.

Per the task's explicit permission for that case, Development Storage creation was attempted (a clearly safe, isolated, reversible, useful action). It did **not** succeed. Not because of billing — the `firestore`/`firebasestorage` prerequisites and billing itself were all in place — but because of a **distinct, newly-discovered technical obstacle**: creating a bucket at `eleventh-on-us-dev.firebasestorage.app` via `gcloud storage buckets create` returns `"Another user owns the domain... or a parent domain"`. This is a Google-managed domain-namespace restriction on the `.firebasestorage.app` suffix that generic GCS bucket creation cannot satisfy, regardless of billing; it persisted identically across five attempts spanning roughly 100 seconds, ruling out the propagation-lag pattern seen earlier with Firestore's API enablement. No non-interactive Firebase CLI command exists in this environment for creating the Firebase-managed default bucket the correct way. Per this task's explicit "do not improvise" instruction, no workaround was attempted.

**No Storage bucket was created for either environment.** No Rules, Functions, Hosting, or App Check resource was created or deployed. `eleventh-on-us` and all other unrelated projects were untouched. `ENG-P1-001` remains **Approved** — not `Complete`. `ENG-P1-002` remains **Blocked**, not started. Nothing was committed or pushed.

## 2. Pre-Change Analysis

- **Git/working-tree state:** unchanged from the prior task — `main` branch, the same ENG-P1-001 change set plus pre-existing unrelated governance-document changes from earlier tasks this session. `.firebaserc` already matched the approved `dev`/`staging` mapping exactly; no edit was needed.
- **Active account:** re-confirmed `fredkenogo@gmail.com` on both `gcloud` and Firebase CLI before any live command.
- **Infrastructure state entering this task:** both projects `ACTIVE`, Firebase-enabled, Firestore Native at `europe-west1`, minimal Auth enabled with zero users, no Functions/Cloud Run/Hosting deployment, no Storage bucket — exactly as the prior Provisioning Retry report recorded.
- **Symmetry:** not achievable in this task — billing itself is asymmetric between the two environments (§4–5), and even where billing exists (Development), a second, unrelated obstacle blocked completion. Both projects therefore end this task in the same practical state (no bucket), for two different reasons.
- **Storage creation strategy:** enable `firebasestorage.googleapis.com` (narrowly required for Storage itself, permitted under Part E's exception), then create the bucket named `<project-id>.firebasestorage.app` (matching the existing `eleventh-on-us` project's own bucket-naming convention) with `--location=europe-west1` via `gcloud storage buckets create`.
- **Immutable-location risk:** none realized — no bucket was created, so no location was ever committed to. Had creation succeeded, the location would have been immutable from that point.
- **Validation strategy:** independent `gcloud`/`firebase` verification after every action; full repository validation suite re-run per Part G even though no repository file required a change.
- **Stop conditions anticipated:** billing asymmetry (anticipated, occurred, handled per the task's own decision logic); a non-`europe-west1` location being proposed (did not occur — no location was ever reached); an unanticipated technical obstacle unrelated to billing (occurred — the domain-ownership error — and is treated with the same "stop, do not improvise" discipline as an explicitly-listed stop condition).
- **Expected files to change:** initially none were expected to require changes (this task is primarily a live-infrastructure verification), and in the end none did, beyond this new report and the required tracking-document notes.

## 3. Active Account Confirmation

**Verified fact.** `gcloud config get-value account` and `firebase login:list` both confirmed `fredkenogo@gmail.com` immediately before any live command. Every project-scoped command in this task carried an explicit `--project`/positional ID and, where supported, `--account=fredkenogo@gmail.com`. `gcloud config set project` was never run.

## 4. Development Billing Status

**Verified fact**, via `gcloud billing projects describe eleventh-on-us-dev`:

- Billing attached: **Yes**
- Billing account active/open: **Yes**
- Same or different account from `eleventh-on-us`'s own billing account: **different** (independently compared; the account identifier is redacted per this task's instruction — see §6).

## 5. Staging Billing Status

**Verified fact**, via `gcloud billing projects describe eleventh-on-us-staging`, checked twice (once initially, once as an explicit re-check to rule out a transient read):

- Billing attached: **No**
- `billingAccountName` is empty; `billingEnabled: false` on both checks, identical result.

## 6. Billing-Account Activity Confirmation (Redacted)

| Environment | Billing attached | Account active/open | Same account as `eleventh-on-us` |
|---|---|---|---|
| Development | Yes | Yes | No — different billing account |
| Staging | No | N/A — no account attached | N/A |

No billing account ID appears anywhere in this report, in accordance with this task's explicit instruction. (If needed for reference, the actual identifiers were surfaced only in the interactive session, never written to a tracked file.)

## 7. Symmetry Assessment

**Asymmetric, exactly as this task's decision logic anticipated and required disclosing prominently.** Development has billing; Staging does not. Per the explicit instruction for this case ("You may either: stop before creating either Storage bucket; or create Development Storage only if doing so is clearly safe and useful... Do not mark the infrastructure complete"), this task proceeded with an attempt at Development Storage only, judged clearly safe (isolated to one project, fully reversible, no cross-environment dependency) and useful (unblocks Development-only work without waiting on a Staging billing decision). **The attempt did not succeed** (§8), so in practice both environments remain without a Storage bucket at the end of this task — but for two independently-verified, different reasons: Staging is blocked by billing; Development is blocked by an unrelated domain-provisioning obstacle. **This asymmetry (in root cause, not in outcome) is reported prominently and the infrastructure is explicitly not marked complete.**

## 8. Development Storage Creation Result

**Not created.** Sequence attempted:

1. Confirmed no bucket already existed (`gcloud storage buckets list --project=eleventh-on-us-dev` → 0 items) — both before and after every subsequent step.
2. Confirmed intended bucket name: `eleventh-on-us-dev.firebasestorage.app` (matching the existing `eleventh-on-us` project's own bucket-naming convention, independently observed in an earlier task).
3. Confirmed intended location: `europe-west1`, passed explicitly via `--location=europe-west1`.
4. Enabled `firebasestorage.googleapis.com` (was not previously enabled on this project; narrowly required for Storage itself, permitted under this task's Part E exception) — succeeded.
5. Ran `gcloud storage buckets create gs://eleventh-on-us-dev.firebasestorage.app --location=europe-west1 --project=eleventh-on-us-dev` — **failed**: `HTTPError 403: Another user owns the domain eleventh-on-us-dev.firebasestorage.app or a parent domain.`
6. Retried five times with a 20-second bounded wait between attempts (the same pattern that successfully resolved a real API-enablement propagation delay for Firestore in the prior task) — **identical error every time**, ruling out propagation lag as the cause.
7. No non-interactive Firebase CLI command for Firebase-managed default-bucket creation was found in this environment (`firebase help` lists no dedicated `storage` subcommand).
8. Stopped. No further creation attempt, no alternative naming/region substitution, no console-adjacent workaround was attempted, per this task's explicit "do not improvise" instruction.

**Root-cause assessment:** `*.firebasestorage.app` is a Google-managed domain namespace; the standard, supported way to provision it is through Firebase's own bucket-provisioning path (typically the Firebase Console's "Get Started" flow for Storage, or `firebase init storage` in an interactive session), which carries domain-delegation permissions a direct end-user `gcloud storage buckets create` call does not have — independent of billing state. This is consistent with, though distinct from, the manual-completion pattern already used once in this session for Firebase enablement itself.

## 9. Development Immutable Storage Location

Not applicable — no bucket was created, so no location was ever committed.

## 10. Staging Storage Creation Result

**Not attempted.** Per this task's explicit stop condition ("billing is not enabled for Development" triggers a hard stop; the symmetric case for Staging is that Staging's own Storage creation is correctly gated behind its own billing state, per Part C's "only after confirming Staging billing is enabled"), Staging billing was confirmed disabled (§5), so Staging Storage creation was never started.

## 11. Staging Immutable Storage Location

Not applicable — creation was never attempted.

## 12. Bucket Security Configuration

Not applicable — no bucket exists for either project, so there is no configuration (public access, lifecycle rules, retention policy) to report. `gcloud storage buckets list` for both projects independently confirmed zero buckets both before and after this task.

## 13. Bucket Object-Count Confirmation

Not applicable — no bucket exists; zero objects by construction.

## 14. APIs Enabled Before and After

| API | Development — before | Development — after | Staging |
|---|---|---|---|
| `firestore.googleapis.com` | enabled (prior task) | unchanged | enabled (prior task), unchanged |
| `identitytoolkit.googleapis.com` | enabled (prior task) | unchanged | enabled (prior task), unchanged |
| `firebaseappcheck.googleapis.com` | enabled (prior task) | unchanged | not enabled, unchanged |
| `firebasestorage.googleapis.com` | **not enabled** | **enabled (this task)** | not enabled, unchanged |
| `cloudfunctions.googleapis.com` | not enabled | unchanged — not enabled | not enabled, unchanged |
| `run.googleapis.com` | not enabled | unchanged — not enabled | not enabled, unchanged |

`firebasestorage.googleapis.com` is the only API this task enabled, on Development only, narrowly required to even attempt Storage bucket creation (the attempt itself did not succeed, but the API enablement is real and independently verified via `gcloud services list --enabled`).

## 15. Functions/Cloud Run/Hosting Read-Only Checks

For both projects, independently checked:

- `cloudfunctions.googleapis.com`: **not enabled**, either project.
- `run.googleapis.com`: **not enabled**, either project.
- Cloud Functions deployed: none possible — the API itself is disabled.
- Cloud Run services deployed: none possible — the API itself is disabled.
- Hosting: both projects have exactly one auto-registered default site (`eleventh-on-us-dev.web.app`, `eleventh-on-us-staging.web.app` respectively) — a zero-config side effect of adding Firebase to a project, not a deployment. No release/version has been deployed to either site (no `firebase deploy` was ever run).

## 16. App Check Deferral Status

**Intentionally deferred, unchanged from the prior task.** No Web App was registered on either project in this task. No reCAPTCHA site key, placeholder domain, or temporary production key was created. No Firebase client configuration was added anywhere in the repository. `apps/web/src/infrastructure/firebase/appCheck.ts`'s existing fail-closed behavior (throws outside development when no site key is configured) was not touched and remains exactly as implemented and Technical-Review-approved earlier in ENG-P1-001.

## 17. `.firebaserc` Verification

**Verified fact.** Current contents, read directly from the file at the start of this task:

```json
{
  "projects": {
    "dev": "eleventh-on-us-dev",
    "staging": "eleventh-on-us-staging"
  }
}
```

Matches the approved mapping exactly — no `"default"` key, no production alias. No edit was made (the file already matched; this task's instruction was to change it "unless the current contents differ," and they did not differ).

## 18. Emulator-Isolation Verification

**Verified fact**, independently re-run: `pnpm emulators:validate` initializes `functions[europe-west1-ping]` under the fake `demo-11thonus` project (the npm script passes `--project demo-11thonus` explicitly, unaffected by `.firebaserc`'s `dev`/`staging` aliases). The Emulator Suite did not connect to Development or Staging at any point in this task.

## 19. Files Created

- `docs/05-implementation/reports/ENG-P1-001-billing-and-storage-completion-2026-07-21.md` (this report).

## 20. Files Modified

- [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) — dated note only; `Status` field unchanged (`Approved`).
- [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md) — dated note and report link only; `Status` field unchanged (`Approved`).
- [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md) — one new append-only entry.

No application code, test, `.env.example`, `.firebaserc`, `.gitignore`, or Firebase configuration file was touched by this task.

## 21. Code Diff Summary

None — no repository source file was modified. This task's only lasting artifacts are the new report and the tracking-document notes.

## 22. Commands Executed

```
gcloud config get-value account
firebase login:list
cat .firebaserc

gcloud billing projects describe eleventh-on-us-dev --account=fredkenogo@gmail.com
gcloud billing projects describe eleventh-on-us-staging --account=fredkenogo@gmail.com   (run twice, identical result)
gcloud billing accounts describe <redacted-id> --account=fredkenogo@gmail.com --format="value(open,displayName)"

gcloud storage buckets list --project=eleventh-on-us-dev --account=fredkenogo@gmail.com
gcloud services list --enabled --project=eleventh-on-us-dev --account=fredkenogo@gmail.com --format="value(config.name)"
gcloud services enable firebasestorage.googleapis.com --project=eleventh-on-us-dev --account=fredkenogo@gmail.com
gcloud storage buckets create gs://eleventh-on-us-dev.firebasestorage.app --location=europe-west1 --project=eleventh-on-us-dev --account=fredkenogo@gmail.com   (5 attempts, bounded 20s retry, identical failure every time)
gcloud storage buckets list --project=eleventh-on-us-dev --account=fredkenogo@gmail.com   (re-confirm 0 items)

firebase help   (confirmed no dedicated storage-provisioning subcommand)

gcloud services list --enabled --project=eleventh-on-us-dev/staging --account=fredkenogo@gmail.com --format="value(config.name)" | grep -i cloudfunctions
gcloud services list --enabled --project=eleventh-on-us-dev/staging --account=fredkenogo@gmail.com --format="value(config.name)" | grep -i "^run.googleapis.com"
firebase hosting:sites:list --project eleventh-on-us-dev/staging --account=fredkenogo@gmail.com

pnpm install --frozen-lockfile
pnpm -r run typecheck
pnpm lint
pnpm format:check
pnpm -r run build
pnpm -r run test
pnpm emulators:validate
```

## 23. Dependencies Added

None.

## 24. Configuration Changes

None to the repository. Live-infrastructure configuration change: `firebasestorage.googleapis.com` enabled on `eleventh-on-us-dev` (§14) — an API enablement, not a resource creation; reversible via `gcloud services disable` if ever desired, though there is no reason to disable it given the next attempt at Storage creation will need it again.

## 25. Validation Results

| Command | Result |
|---|---|
| `git diff --check` | ✅ clean |
| `pnpm install --frozen-lockfile` | ✅ lockfile unchanged |
| `pnpm -r run typecheck` | ✅ clean, both workspaces |
| `pnpm lint` | ✅ zero findings |
| `pnpm format:check` | ✅ clean |
| `pnpm -r run build` | ✅ both workspaces; same pre-existing bundle-size warning |
| `pnpm -r run test` | ✅ 34/34, unchanged from the prior task |
| `pnpm emulators:validate` | ✅ `functions[europe-west1-ping]` under `demo-11thonus`, independently re-confirmed unaffected |

## 26. Security Review

No API key, App ID, service-account key, or billing-account identifier was written to any tracked file. The billing account identifier used for the one-time `gcloud billing accounts describe` lookup was never echoed into a file — only its `open`/`displayName` fields were used, and those are reported here without the identifier (§6). No bucket was created, so no bucket-level IAM, public-access, or lifecycle configuration exists to review.

## 27. Unrelated-Project Isolation Confirmation

**Verified fact.** Every live command in this task carried an explicit `--project`/positional ID; `gcloud config set project` was never run. `eleventh-on-us` was not referenced by any command in this task (the billing-account comparison in §4 used the already-known, previously-recorded state of `eleventh-on-us`'s billing from an earlier task, not a fresh query against that project). No other project on the account was touched.

## 28. Risks

- **Storage remains unavailable for both environments** — Development is blocked by the domain-ownership/provisioning-mechanism issue (§8), independent of billing; Staging is blocked by billing (§5). Neither is resolved by this task.
- **The domain-ownership obstacle is new information**, not previously known: prior tasks' analysis assumed billing was the sole blocker to Storage. This changes the picture for future ENG-P1-001 closure work — Storage completion now depends on either a manual Firebase Console step (the same pattern already used once for Firebase enablement) or Founder guidance on an alternative provisioning path.
- **`firebasestorage.googleapis.com` is now enabled on Development** with no bucket behind it — a harmless, inert state, but worth noting so a future task doesn't assume the API being enabled implies the bucket exists.

## 29. Remaining Founder Action

1. **Resolve Development Storage bucket creation** — most likely via the Firebase Console's "Get Started" flow for Cloud Storage on `eleventh-on-us-dev` (selecting `europe-west1` explicitly during that flow), mirroring how Firebase enablement was completed manually earlier in this session. This task does not perform that step.
2. **Decide on Staging billing** — attach a billing account to `eleventh-on-us-staging` (Founder-only action, not performed here) if Staging Storage is to proceed, or explicitly confirm Staging should remain unbilled for now.
3. **App Check completion** and **Storage Rules deployment** remain separately deferred, as in prior tasks — not part of this task's scope either.

## 30. Rollback Instructions

**Documentation side** (uncommitted, safe to discard):

- Delete this report.
- Revert the dated notes in the Engineering Implementation Programme and Coding-Agent Prompt Register (status fields were never changed).
- Revert the appended `IMPLEMENTATION_CHANGES.md` entry.

**Infrastructure side:** the only live change this task made was enabling `firebasestorage.googleapis.com` on `eleventh-on-us-dev` — reversible via `gcloud services disable firebasestorage.googleapis.com --project=eleventh-on-us-dev` if ever desired, though disabling it would only need to be re-enabled for the next Storage attempt, so no rollback is recommended in practice. No bucket, Rules, Functions, Hosting release, or App Check resource was created, so there is nothing further to roll back.

## 31. Status

`ENG-P1-001` remains **Approved**. Not `Committed`, `Pushed`, `Deployed`, or `Complete`. `ENG-P1-002` remains **Blocked**, not `Ready`, and was **not started**. This task completes only the portion of the billing-dependent infrastructure slice that could be verified and safely attempted; Storage itself remains incomplete for both environments, for two independently-diagnosed reasons, both disclosed prominently rather than glossed over.

## 32. Tracking-Document Changes

- [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) — dated note appended; `Status` field unchanged (`Approved`).
- [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md) — dated note and report link appended; `Status` field unchanged (`Approved`).
- [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md) — one new append-only entry (below).
