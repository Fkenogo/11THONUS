> **Title:** ENG-P1-001 Firebase Development and Staging Environment Provisioning
> **Status:** Blocked at Part A — stop condition reached before any live resource was created
> **Date:** 2026-07-21
> **Classification:** Founder-authorized live-infrastructure provisioning attempt — no Firebase/GCP resource was created, modified, or deleted

# ENG-P1-001 Firebase Development and Staging Environment Provisioning

## 1. Executive Summary

This task was authorized to create the `11thonus-dev` and `11thonus-staging` Firebase/GCP projects (with `-rw` fallbacks) under `fredkenogo@gmail.com`, region `europe-west1`, no billing attachment, no Production. **Project creation could not proceed for either environment.** All four Founder-approved project IDs — `11thonus-dev`, `11thonus-dev-rw`, `11thonus-staging`, `11thonus-staging-rw` — were rejected by Google Cloud's own project-ID validation rule before reaching an availability check: **GCP project IDs must start with a lowercase letter, and all four approved candidates start with the digit `1`.** This is a platform-level naming-format constraint, not a global-uniqueness collision, and it applies identically to every one of the four approved IDs — there is no fallback left to try, and per this task's explicit instruction ("Do not invent another ID"), none was invented.

This is a symmetric block: neither Development nor Staging was created, so there is no partial-provisioning asymmetry to report. `eleventh-on-us` was independently confirmed unchanged. No billing was attached, enabled, or even reached — Part D's billing gate was never triggered because Part A itself did not complete. Four open billing accounts exist on the account, all with the generic Firebase-generated display name "Firebase Payment," indistinguishable from one another by name — none can be recommended as "intended for 11thONUS" per this task's own evidentiary bar (display-name evidence only), so no recommendation is made.

`ENG-P1-001` remains **Approved**. `ENG-P1-002` remains **Blocked**. `ENG-P1-002` was not started. Nothing was committed or pushed.

## 2. Pre-Provisioning Analysis

- **Repository and Git state:** branch `main`, unchanged from the prior closure task's working tree (same uncommitted ENG-P1-001 change set plus pre-existing, unrelated governance-document changes from earlier tasks this session).
- **Active account:** confirmed via `gcloud config get-value account` and `firebase login:list` immediately before any live command — `fredkenogo@gmail.com` on both. No `.firebaserc` exists.
- **Firestore location mapping — verified, not guessed:** `gcloud firestore locations list --project=eleventh-on-us` (a read-only query against the global Firestore location catalogue, not a mutation of that project) confirmed `europe-west1` is a directly selectable Firestore Native single-region `locationId`, separate from and in addition to the `eur3` multi-region. This resolves the mapping question `DEC-TECH-005` requires: `europe-west1` is usable directly, with no conflict. This finding stands regardless of the blocker below and is reusable for the next provisioning attempt.
- **Existing `11thonus`-named projects:** none, on this account, before this task began.
- **Provisioning sequence attempted:** `gcloud projects create <id> --name="<display name>" --account=fredkenogo@gmail.com`, explicit `--account` and explicit project ID on every call — no reliance on the ambient active `gcloud` project.

## 3. Active Account Confirmation

**Verified fact.** `gcloud config get-value account` → `fredkenogo@gmail.com`. `firebase login:list` → `Logged in as fredkenogo@gmail.com`. Both match the Founder-authorized account exactly. No stop condition was triggered on this basis.

## 4. Project IDs Attempted

All four, in this order, each with an explicit `--account=fredkenogo@gmail.com` and explicit project ID (no reliance on ambient `gcloud config`):

1. `11thonus-dev` (preferred, Development)
2. `11thonus-dev-rw` (approved fallback, Development)
3. `11thonus-staging` (preferred, Staging)
4. `11thonus-staging-rw` (approved fallback, Staging)

**Result, identical for all four:**

```
ERROR: (gcloud.projects.create) argument PROJECT_ID: Bad value [<id>]:
Project IDs are immutable and can be set only during project creation.
They must start with a lowercase letter and can have lowercase ASCII
letters, digits or hyphens. Project IDs must be between 6 and 30 characters.
```

This is Google Cloud's own project-ID syntax validation, rejected client-side by `gcloud` before any server-side availability check occurs. The root cause is identical across all four: each starts with the digit `1`, and GCP project IDs must start with a lowercase **letter**. This is not an availability/uniqueness conflict — it is a format rule that no candidate in the approved set can satisfy, because every approved candidate (preferred and fallback, both environments) shares the same `11thonus-` prefix.

## 5. Final Project IDs Created

**None.** Confirmed via `firebase projects:list | grep -c "11thonus"` → `0` after all four attempts.

## 6. Display Names

Not applicable — no project was created, so no display name was ever set.

## 7. Firebase Enablement Results

Not applicable — Firebase cannot be added to a project that does not exist. This step was never reached.

## 8. Firestore Configuration and Immutable Location

Not created. The location-mapping question was independently resolved in advance (§2): `europe-west1` is confirmed as a valid, directly selectable Firestore Native location, consistent with `DEC-TECH-005`. This remains valid evidence for whenever provisioning is retried; no re-verification will be needed at that time.

## 9. Storage Configuration and Immutable Location

Not created. Whether the default Firebase Storage bucket can be created without a Blaze billing plan was not tested, because project creation itself did not succeed — there was no project to test it against. This remains an open question for the next attempt.

## 10. Authentication Initialization

Not performed. No project exists to enable `identitytoolkit.googleapis.com` against.

## 11. App Check Status

Not assessed against a live project. No project exists.

## 12. Billing Status

**Verified fact:** no billing account was attached to anything by this task — none could be, since no project was created to attach it to. The Part D billing gate this task defines (list accounts, do not attach, stop for Founder selection) was not reached in its intended sequence (after project creation); it is answered here instead, ahead of schedule, as useful groundwork for the next attempt (§14).

## 13. Services Blocked by Billing

Undetermined — Storage and Functions were never tested against a live project (§9). This remains open for the next provisioning attempt, once valid project IDs exist.

## 14. Available Billing-Account Display Names

**Verified fact**, via `gcloud billing accounts list --format="table(displayName,open)"` (display names and open/closed status only — no account IDs, per this task's explicit instruction not to expose sensitive identifiers):

| Display Name | Open |
|---|---|
| Firebase Payment | Yes |
| Firebase Payment | No |
| Firebase Payment | Yes |
| Firebase Payment | Yes |
| My Billing Account | No |
| Kenogo | No |
| Firebase Payment | Yes |

Four accounts are currently open. **No recommendation is made.** Per this task's own instruction ("Recommend which account appears intended for 11thONUS only when there is explicit evidence in its display name"), none of the four open accounts' display names reference 11thONUS, this project, or anything else distinguishing — three share the identical generic, Firebase-auto-generated name "Firebase Payment," and the fourth open account has no name suggesting 11thONUS either. Selecting among them requires the Founder's direct knowledge of which account corresponds to which real-world billing arrangement — that cannot be inferred from display names alone, and this task does not guess.

## 15. Repository Mapping Changes

None. Part C (creating `.firebaserc` with `dev`/`staging` aliases) requires both projects to exist first — neither does. `.firebaserc` remains absent, exactly as before this task. The Firebase Emulator Suite configuration (`firebase.json`, fake project `demo-11thonus`) is unchanged and was not touched.

## 16. Files Created

- `docs/05-implementation/reports/ENG-P1-001-firebase-environment-provisioning-2026-07-21.md` (this report).

## 17. Files Modified

- [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) — a dated note only, referencing this report; `ENG-P1-001`'s `Status` field unchanged (`Approved`).
- [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md) — a dated note and report link only; `ENG-P1-001`'s `Status` field unchanged (`Approved`).
- [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md) — one new append-only entry.

No application code, test, dependency, `.env.example`, or Firebase/emulator configuration file was touched — there was nothing to update, since no project was created and no new variable names or setup instructions became necessary.

## 18. Commands Executed

```
git branch --show-current
git status --short

firebase login:list
gcloud auth list
gcloud config get-value account
ls -la .firebaserc
firebase projects:list | grep -iE "11thonus|eleventh"

gcloud firestore locations list --project=eleventh-on-us   (read-only global catalogue query)

gcloud projects create 11thonus-dev --name="11thONUS Development" --account=fredkenogo@gmail.com
gcloud projects create 11thonus-dev-rw --name="11thONUS Development" --account=fredkenogo@gmail.com
gcloud projects create 11thonus-staging --name="11thONUS Staging" --account=fredkenogo@gmail.com
gcloud projects create 11thonus-staging-rw --name="11thONUS Staging" --account=fredkenogo@gmail.com

firebase projects:list | grep -c "11thonus"
gcloud projects describe eleventh-on-us --format="value(lifecycleState,name)"
gcloud billing accounts list --format="table(displayName,open)"
```

No `pnpm`/repository-validation command was re-run in this task — no application file changed, so re-running the full validation suite would not exercise anything new; the last full independent validation (typecheck/lint/format/build/test/emulator, 34/34 tests) remains the current, accurate state from the prior closure task and is unaffected by this task's outcome.

## 19. Validation Results

- **Zero live resources created, modified, or deleted** — confirmed via `firebase projects:list` (count of `11thonus`-named projects: `0`) and a direct `gcloud projects describe eleventh-on-us` spot-check (`lifecycleState: ACTIVE`, `name: eleventh-on-us` — identical to its pre-task state).
- **No unrelated project touched** — every `gcloud projects create` attempt failed client-side on argument validation before any server-side call could affect any existing project; no other `gcloud`/`firebase` command in this task referenced any project other than `eleventh-on-us` (read-only) and the four rejected candidate IDs.
- **No billing attached** — confirmed by construction (no project existed to attach it to) and by never issuing a `gcloud billing projects link` command.
- **No secret exposed** — billing account IDs were deliberately not printed in this report (§14, display names and open/closed status only).
- **Emulator Suite untouched** — `firebase.json`'s `demo-11thonus` fake project configuration was not read, written, or referenced by any command in this task.

## 20. Security Review

No credential, API key, service-account key, or billing-account identifier was printed to any file in this task. All `gcloud`/`firebase` commands used the explicit `--account=fredkenogo@gmail.com` flag (where the command supported it) rather than relying on ambient `gcloud config`, per this task's explicit safety requirement. No command in this task could have affected an unrelated project — the client-side ID-format rejection occurred before any project-scoped operation was possible.

## 21. Unrelated-Project Isolation Confirmation

**Verified fact.** `eleventh-on-us` was independently re-checked after all four creation attempts (`gcloud projects describe eleventh-on-us --format="value(lifecycleState,name)"` → `ACTIVE eleventh-on-us`, unchanged). None of the other 18 unrelated projects on this account (client/personal work, not enumerated here) were referenced by any command in this task. No `gcloud config set project` was ever run, so the ambient active project (`xampreps`, from the prior task's preflight — unrelated to 11thONUS) was never relied upon and remains whatever it already was.

## 22. Risks

- **The approved ID set (`11thonus-*`) is structurally unusable as specified** — every candidate starts with a digit, which GCP disallows unconditionally. This is not a transient or account-specific issue; it will fail identically on any future retry with the same IDs, on any account. Retrying this task unmodified will reproduce the identical block.
- **No project exists yet**, so `ENG-P1-001`'s original "Deployment Required: Yes (dev/staging projects, `europe-west1`)" requirement (Engineering Implementation Programme) remains entirely unmet — this task made zero progress toward it, beyond independently confirming the Firestore `europe-west1` location mapping (§2), which remains valid and reusable.
- Storage-bucket billing requirements (§9, §13) remain genuinely unknown until a project actually exists to test against — flagged as an open question, not assumed either way.

## 23. Required Founder Action

**This task cannot proceed further without new input. Specifically required:**

1. **New approved project IDs that satisfy GCP's naming rule** (must start with a lowercase letter, 6–30 characters, lowercase letters/digits/hyphens only). The `11thonus-*` pattern cannot work as specified. Example patterns that would satisfy the platform's own rule (offered as illustrations of the *constraint*, not as proposed IDs — this task does not select a replacement ID on its own authority, consistent with "Do not invent another ID"): a leading letter prefix such as `on-11thonus-dev` or spelling the platform name out (`eleventhonus-dev`) would both syntactically qualify, but the actual choice is the Founder's.
2. **Selection of exactly one open billing account** from the four listed in §14 (by display name — the Founder will need to distinguish the three identically-named "Firebase Payment" accounts from their own records, since this task cannot do so from display names alone), for whenever billing does become relevant (Storage/Functions, §9/§13) — not needed for this specific blocker, but restated here since it was gathered as part of this task's preflight and remains a known upcoming requirement.

No other Founder decision from the prior Closure Preflight Report (production timing, owning account/organization) is affected by this outcome — the owning-account decision (`fredkenogo@gmail.com`) was already exercised and remains valid for the retry; only the project IDs themselves need to change.

## 24. Rollback Instructions

Nothing to roll back on the infrastructure side — no live resource was created, modified, or deleted. Documentation-side rollback, if desired:

- **Delete** `docs/05-implementation/reports/ENG-P1-001-firebase-environment-provisioning-2026-07-21.md` (this file).
- **Revert** the dated notes added to the Engineering Implementation Programme and Coding-Agent Prompt Register (status fields were never changed by this task, so no status revert is needed).
- **Revert** the single appended entry in `docs/changes/IMPLEMENTATION_CHANGES.md` (remove only this task's section; do not touch any entry above it).

## 25. Status

`ENG-P1-001` remains **Approved**. Not `Committed`, `Pushed`, `Deployed`, or `Complete`. `ENG-P1-002` remains **Blocked**. `ENG-P1-002` was not started. No Production project exists. No billing was attached. No deployment was performed.

**Stop condition reached, exactly as this task's own governance requires: "an approved project ID and its approved fallback are both unavailable" (here, unusable for a naming-format reason common to all four candidates) → stop and report, do not improvise.** This report is that stop-and-report.

## 26. Tracking-Document Changes

- [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) — dated note appended; `Status` field unchanged (`Approved`).
- [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md) — dated note and report link appended; `Status` field unchanged (`Approved`).
- [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md) — one new append-only entry (below).
