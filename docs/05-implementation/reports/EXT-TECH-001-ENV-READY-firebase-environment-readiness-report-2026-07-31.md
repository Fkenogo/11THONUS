> **Title:** Firebase Environment Readiness for Phone Authentication
> **Status:** Environment-readiness assessment and bounded configuration task. **One live Firebase configuration change applied** (SMS Region Policy, `eleventh-on-us-dev`, allowlisting Burundi). No delivery test performed, no `EXT-TECH-001` resolution, no additional authentication provider enabled, no application code modified.
> **Task:** `EXT-TECH-001-ENV-READY`
> **Source-of-truth path:** `docs/05-implementation/reports/EXT-TECH-001-ENV-READY-firebase-environment-readiness-report-2026-07-31.md`
> **Prepared:** 2026-07-31

---

## 1. Executive Summary

This task merged `PR #47`, verified the resulting `main` state, then audited the live `eleventh-on-us-dev` Firebase project's readiness to execute the eventual `EXT-TECH-001-DELIVERY-TEST` (real-SMS phone-OTP delivery validation against Burundi carriers), per the Founder's confirmed decision that **Phone Authentication is the only enabled authentication provider at this stage** — no Google Sign-In, no other provider.

The audit found the environment materially more advanced than the prior read-only check (`EXT-TECH-001-EVIDENCE`, 2026-07-31, `404 CONFIGURATION_NOT_FOUND`): **Phone Number sign-in is now enabled** on the live project, Blaze billing is confirmed active, and no other sign-in provider (email, anonymous, Google) is present. The one missing, decisive prerequisite was the **SMS Region Policy** — set to `allowlistOnly` with an empty allowlist, meaning it silently blocked SMS to every region, including Burundi. This task applied the single, narrowly-scoped, necessary configuration change: added Burundi (`BI`) to the SMS Region Policy allowlist via a direct, read-verified `PATCH` to the Identity Toolkit Admin API, touching only the `smsRegionConfig` field and nothing else. Every other provider, MFA state, and quota setting was independently re-verified unchanged immediately after.

**Delivery-test readiness classification: Ready with Conditions.** The Firebase-side technical environment is now fully capable of sending phone-verification SMS to Burundi numbers. The remaining conditions are non-technical and outside this task's authorization: real phone numbers on Burundi's three carriers, and Founder/Engineering-Lead authorization to actually execute the test.

## 2. Starting Repository State

`main` at `c0bdf39` (post-`PR #46`); `PR #47` open, `CLEAN`/`MERGEABLE`, CI-green.

## 3. PR #47 Merge Confirmation and Merge SHA

Re-verified `OPEN`/`CLEAN`/`MERGEABLE`/CI-green (`gh pr checks 47`: pass, run `30642423775`). Merged via `gh pr merge 47 --merge`. **Merge commit SHA: `787624a9e24cdb6e26cb202d89be443c7d80ce13`.**

## 4. Ending Repository State

Local `main` fast-forwarded to `787624a`; `git rev-list --left-right --count origin/main...main` = `0 0`; `git status --short` empty; no `MERGE_HEAD`/`rebase-merge`/`rebase-apply`. Post-merge CI green (run `30643529352`, `conclusion: success`).

## 5. Firebase Environment Audit (Stage B)

All checks performed read-only against `eleventh-on-us-dev` before any configuration change, via `gcloud auth print-access-token` + direct REST calls, and `gcloud services list`/`gcloud billing projects describe`.

| Item | Finding | Classification |
|---|---|---|
| Phone Authentication enabled | `signIn.phoneNumber.enabled: true` | **Configured** |
| Other sign-in providers | `email`, `anonymous`: absent from config; no Google/other provider present | **Configured** (correctly, per Founder decision — Phone Auth only) |
| Authentication service provisioned | `subtype: FIREBASE_AUTH`, project has a live Identity Toolkit config (not `CONFIGURATION_NOT_FOUND` as of this check — advanced since the prior task's 2026-07-31 read) | **Configured** |
| Identity Platform status | Standard Firebase Auth (`FIREBASE_AUTH` subtype), not upgraded to the separate paid Identity Platform tier — not required for phone sign-in | **Not Required** |
| Blaze billing status | `billingEnabled: true`, `billingAccountName: billingAccounts/01F4EF-27618C-79B4A7` | **Configured** |
| SMS quota | `quota: {}` — no custom override; default Firebase limits apply (900/min, 3,000/day project-wide; 50/min, 500/hour per-IP) | **Configured** (default is adequate for a bounded test) |
| API enablement | `identitytoolkit.googleapis.com` enabled; `firebase.googleapis.com`, `firebaseappcheck.googleapis.com`, `firebasehosting.googleapis.com`, `firebaseinstallations.googleapis.com`, `firebaseremoteconfig(realtime).googleapis.com`, `firebaserules.googleapis.com`, `firebasestorage.googleapis.com`, `fcm.googleapis.com` all enabled | **Configured** |
| Firebase project configuration | `.firebaserc`: `dev`/`staging` aliases only, no `production` | **Configured** (correct dev/production separation) |
| Required Google Cloud services | `recaptchaenterprise.googleapis.com` **not** enabled | **Not Required** — classic Firebase Auth phone sign-in uses Firebase's own hosted reCAPTCHA v2 flow (`RecaptchaVerifier`), which requires no separate GCP API or site-key registration; reCAPTCHA Enterprise is an opt-in upgrade, not needed here |
| App registration status | `firebase.googleapis.com/v1beta1/projects/eleventh-on-us-dev/webApps` returns `{}` — zero Web Apps registered | **Not Required for this task** — no registered Web App is needed for Firebase Console-driven manual phone-verification testing or for the existing emulator-based test suite; would become required only when `ENG-P2-001` builds an actual client integration (out of this task's scope) |
| SHA fingerprints | N/A — web-only project, no Android/iOS app registered | **Not Required** |
| Web configuration | `client.apiKey` present in the live config (project-level Web API key); `apps/web/.env.example` already documents all required `VITE_FIREBASE_*` fields as placeholders | **Configured** (documentation); real values are a local `.env.local` matter for whoever runs a manual test, not a repository concern |
| Emulator compatibility | `firebase.json` `emulators.auth.port: 9099`, already wired since `ENG-P1-001`; fully separate from live project's SMS Region Policy — emulator never sends real SMS regardless of live config | **Configured** — no change needed |
| reCAPTCHA configuration | See "Required Google Cloud services" above — handled automatically by Firebase's hosted v2 flow | **Not Required** (automatic) |
| Firebase SDK configuration | `apps/web/src/infrastructure/firebase/auth.ts` (from `ENG-P1-001`) already provides `getFirebaseAuth()` with emulator-connect support; no phone-auth-specific client code exists yet (correctly — that is `ENG-P2-001` scope) | **Configured** for current scope; phone-specific client code is out of this task's authorization |
| Environment variables | `apps/web/.env.example` documents `VITE_FIREBASE_API_KEY`/`AUTH_DOMAIN`/`PROJECT_ID`/etc. as blank placeholders — correct, no real values committed | **Configured** |
| Development vs production separation | `.firebaserc` has no `production` alias; only `dev`/`staging` exist; `eleventh-on-us-staging`'s own Auth config independently checked and found **not yet configured** (`404 CONFIGURATION_NOT_FOUND`) — confirming this task's changes are scoped to `dev` only, `staging` untouched | **Configured** (correct separation; `staging` intentionally left alone — this task's scope is the development environment) |
| **SMS Region Policy** | `smsRegionConfig: { allowlistOnly: {} }` — policy type `allowlistOnly` already set, but the allowlist itself was **empty**, meaning every region including Burundi was silently blocked | **Missing** — the one item requiring a configuration change |

## 6. Configuration Applied (Stage C)

**One change, and only one, was made:** `eleventh-on-us-dev`'s Identity Toolkit `smsRegionConfig` was updated via `PATCH https://identitytoolkit.googleapis.com/admin/v2/projects/eleventh-on-us-dev/config?updateMask=smsRegionConfig` with body `{"smsRegionConfig": {"allowlistOnly": {"allowedRegions": ["BI"]}}}` — `BI` is Burundi's two-letter CLDR/ISO 3166-1 region code, confirmed against the Identity Toolkit Admin API's own discovery-document schema (`GoogleCloudIdentitytoolkitAdminV2AllowlistOnly.allowedRegions`) before applying.

**Justification:** without this, `ENG-P2-RES-000`'s and `RES-001`'s own findings both establish that Firebase's default SMS Region Policy allows *no* regions for a new project — any attempt to send an OTP to a Burundi number would fail silently before ever reaching a carrier, regardless of every other configuration item being correct. This is the single, well-defined, evidence-grounded prerequisite named by the prior `EXT-TECH-001-EVIDENCE` report's own §5 item 8 ("Firebase Rules/server-side validation are affected" analogue for infrastructure — the SMS Region Policy is the equivalent infrastructure gate) and by `RES-001`'s §10 Risk Assessment ("a project that is provisioned but never has Burundi explicitly allowlisted would silently fail every customer registration attempt").

**Verified immediately after, via a fresh `GET`:** `smsRegionConfig` now reads `{"allowlistOnly": {"allowedRegions": ["BI"]}}`; `signIn.phoneNumber.enabled` still `true`; no `email`/`anonymous`/other provider present; `mfa.state` still `DISABLED`; `quota` still `{}` (default) — confirming the `PATCH`'s `updateMask` correctly scoped the write to `smsRegionConfig` alone and touched nothing else.

**No other configuration was changed.** Google Sign-In, email/password, anonymous authentication, and MFA were not enabled — confirmed both before and after this task's one change. No production project or configuration was touched. `eleventh-on-us-staging` was read (to confirm dev/production separation) but not modified.

## 7. Environment Readiness Matrix (Stage D)

| Requirement | Status | Evidence | Action |
|---|---|---|---|
| Authentication (Firebase Auth service) | Ready | Live config returned `subtype: FIREBASE_AUTH` | None |
| Phone Provider | Ready | `signIn.phoneNumber.enabled: true` | None (already enabled before this task) |
| Other providers (must remain disabled) | Ready | `email`/`anonymous`/other absent from `signIn` | None — verified, not touched |
| Billing (Blaze) | Ready | `billingEnabled: true` | None (already enabled, per `ENG-P1-001` manual verification, 2026-07-21) |
| Identity Platform (upgrade tier) | Not Required | Standard Firebase Auth suffices for phone sign-in at this scale | None |
| Firebase APIs | Ready | 9 required Firebase/GCP APIs confirmed enabled | None |
| reCAPTCHA | Ready (automatic) | No separate GCP API/site key needed for classic phone sign-in's hosted v2 flow | None |
| SMS Region Policy | **Ready — corrected by this task** | `allowedRegions: ["BI"]`, verified post-change | Applied (§6) |
| SMS Quota | Ready | Default limits apply, no override needed for a bounded test | None |
| Test Environment (Emulator) | Ready | `firebase.json` `emulators.auth.port: 9099`, unaffected by live project changes | None |
| SDK (client config) | Ready (for current repo scope) | `apps/web/.env.example` documents all required fields; no phone-specific client code exists yet (correctly out of scope) | None |
| App Registration | Not Required | No registered Web App needed for Console-driven manual testing or the existing emulator suite | None |
| Logging | Ready | `monitoring.requestLogging: {}` present in live config (default logging active) | None |
| SMS capability (overall) | Ready | Phone provider enabled + Blaze billing + Burundi allowlisted = infrastructure capable of attempting real SMS delivery | None further required from this task |

## 8. Delivery-Test Readiness (Stage E)

**Classification: Ready with Conditions.**

The Firebase-side technical environment (`eleventh-on-us-dev`) is now fully capable of attempting real phone-verification SMS delivery to Burundi numbers: Phone Authentication is the sole enabled provider (per the Founder's decision), Blaze billing is active, and the SMS Region Policy now explicitly allows Burundi. No further Firebase configuration is required to *attempt* the test.

**Remaining prerequisites, all outside this task's authorization:**
1. Real phone numbers on each of Burundi's three carriers (Lumitel, Econet Leo, Onatel) — physical access this task's environment does not have.
2. Explicit Founder/Engineering-Lead authorization to execute `EXT-TECH-001-DELIVERY-TEST` itself — this task prepares the environment only, per its own explicit prohibition on performing the carrier delivery test.
3. A concrete decision on *how* the test will be triggered — most likely Firebase Console's own Authentication testing UI (no application code required) rather than a purpose-built web client, since building client-side phone-auth UI would constitute Phase 2 application-feature development, outside this task's and any prior task's authorization.

## 9. Files Modified

**Created:** this report; changes-tracking entries. **Modified:** `docs/00-governance/documentation-changes-log.md` (Entry 047, append-only); `docs/changes/IMPLEMENTATION_CHANGES.md` (append-only). **No repository source file was modified** — the only substantive change this task made was to live Firebase infrastructure (§6), not to any file in this repository.

## 10. Configuration Changes

One live Firebase configuration change, fully detailed in §6: `eleventh-on-us-dev`'s `smsRegionConfig.allowlistOnly.allowedRegions` set to `["BI"]`. No repository configuration file (`.firebaserc`, `firebase.json`, `.env.example`) was modified — all were confirmed already correct.

## 11. Firebase Services Enabled

None newly enabled by this task. Phone Authentication, Blaze billing, and all required Firebase APIs were already enabled prior to this task's audit (Phone Auth specifically was found already enabled — a change since the prior task's `404 CONFIGURATION_NOT_FOUND` finding, made outside this task, consistent with the Founder's own confirmed decision framing this task around). This task's only action was the SMS Region Policy allowlist entry (§6), which is a policy configuration, not a service-enablement action.

## 12. Firebase Services Intentionally Left Disabled

Per the Founder's explicit decision (**Phone Authentication is the only enabled authentication provider at this stage**): Google Sign-In, Email/Password authentication, Anonymous authentication, Multi-Factor Authentication, and Apple Sign-In all remain disabled — confirmed absent from the live `signIn` config both before and after this task's one change, and not enabled by this task. `recaptchaenterprise.googleapis.com` was left disabled (not required — see §5). Identity Platform's paid upgrade tier was left inactive (not required for phone sign-in at this scale). Production Firebase project: none exists; none was created.

## 13. Remaining Prerequisites

See §8 — real Burundi carrier phone numbers; Founder/Engineering-Lead authorization to execute the delivery test; a decision on the test-triggering mechanism (Console-driven recommended, requiring no application code).

## 14. Commands Executed

`gh pr view 47`, `gh pr checks 47`, `gh pr merge 47 --merge`, `gh pr view 47 --json state,mergeCommit,mergedAt`, `git fetch origin`, `git checkout main`, `git pull origin main --ff-only`, `git rev-list --left-right --count origin/main...main`, `git status --short`, `gh run list --branch main`, `gh run watch <id> --exit-status`, `gh run view <id> --json status,conclusion`; `gcloud auth print-access-token --account=fredkenogo@gmail.com`; `curl -X GET https://identitytoolkit.googleapis.com/admin/v2/projects/eleventh-on-us-dev/config` (before and after); `gcloud services list --enabled --project=eleventh-on-us-dev`; `gcloud billing projects describe eleventh-on-us-dev`; `curl -X GET https://firebase.googleapis.com/v1beta1/projects/eleventh-on-us-dev/webApps`; `curl -X GET https://firebaseappcheck.googleapis.com/v1/projects/eleventh-on-us-dev/services`; `curl "https://identitytoolkit.googleapis.com/\$discovery/rest?version=v2"` (schema lookup for `SmsRegionConfig`); `curl -X PATCH https://identitytoolkit.googleapis.com/admin/v2/projects/eleventh-on-us-dev/config?updateMask=smsRegionConfig` (the one configuration change); `curl -X GET https://identitytoolkit.googleapis.com/admin/v2/projects/eleventh-on-us-staging/config` (read-only, confirmed unconfigured, not touched); `cat .firebaserc`; `cat apps/web/.env.example`; `grep`/`Read` of `firebase.json`, `apps/web/src/infrastructure/firebase/auth.ts`.

## 15. Risks

None introduced. The one configuration change is additive, narrowly scoped (touched only `smsRegionConfig`, verified by re-read), zero-cost (allowlisting a region does not itself send or charge for SMS), and trivially reversible (empty the `allowedRegions` array to restore the pre-change deny-all state). No other provider, billing setting, or quota was altered. No application code was touched. No carrier test was performed, and no real SMS was sent by this task.

## 16. Rollback Instructions

**Live infrastructure:** `PATCH https://identitytoolkit.googleapis.com/admin/v2/projects/eleventh-on-us-dev/config?updateMask=smsRegionConfig` with body `{"smsRegionConfig": {"allowlistOnly": {"allowedRegions": []}}}` restores the pre-task deny-all-regions state. **Repository:** `git revert` of this task's own commit — a new report plus one append-only changes-log entry; no other repository content to roll back. PR #47's merge is independently reversible per its own disclosed rollback instructions, requiring fresh Founder authorization, out of scope here.

## 17. Markdown Implementation Report

This document.

## 18. Updated `.md` Changes-Tracking Record

`docs/changes/IMPLEMENTATION_CHANGES.md` and `docs/00-governance/documentation-changes-log.md` (Entry 047) both updated (see the accompanying commit).
