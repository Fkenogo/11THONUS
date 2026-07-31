> **Title:** EXT-TECH-001 Evidence Resolution and Gate Determination
> **Status:** Evidence-resolution and gate-assurance task. **Gate determination: Still Pending.** No governance decision made or recorded, no Founder decision touched, no application code modified, no vendor selected, no Phase 2 implementation begun, no external evidence fabricated.
> **Task:** `EXT-TECH-001-EVIDENCE`
> **Source-of-truth path:** `docs/05-implementation/reports/EXT-TECH-001-EVIDENCE-resolution-report-2026-07-31.md`
> **Prepared:** 2026-07-31

---

## 1. Executive Summary

This task merged `PR #45`, verified the resulting `main` state, then investigated `EXT-TECH-001` (Firebase phone-OTP delivery to Burundi numbers: reliability, cost, abuse controls, test-number strategy) against live repository and infrastructure evidence to determine its Capability Authorisation Gate status. A prior, thorough evidence package (`docs/00-governance/decisions/evidence/EXT-TECH-001-engineering-evidence-package-2026-07-29.md`, `RES-001`) already exists and is re-validated here rather than repeated: it establishes that Firebase's classic phone sign-in has no first-party country exclusion of Burundi, that Burundi's telecom infrastructure is technically capable of carrying SMS, and that at least one third-party aggregator explicitly supports Burundi — but it explicitly discloses that the one decisive piece of evidence, a real SMS delivery test against Burundi's three carriers, has not been performed and cannot be obtained through documentation research.

This task independently re-verified that gap is still open: (1) the live External Dependencies Register still reads `PENDING`; (2) a direct, read-only query against the live `eleventh-on-us-dev` Firebase project's Identity Platform Admin config returned `CONFIGURATION_NOT_FOUND`, confirming Firebase Authentication has never been configured on any live project — the SMS Region Policy has certainly not been set and no test SMS has been sent; (3) two of the evidence package's decisive documentation facts (Blaze-plan billing requirement, SMS quota figures) were independently re-fetched from Firebase's own current documentation and found unchanged. **Gate determination: Still Pending** — the required evidence (a real, empirical SMS-delivery test to Burundi's three carriers) is well-defined, owned, and not fabricable; it has simply not yet been obtained, and obtaining it requires physical access to real Burundi phone numbers on all three carriers, which is outside both this task's authorization and this environment's capability.

A genuine, evidence-grounded staleness was found and corrected in the External Dependencies Register's own `EXT-TECH-001` row: its `Blocks` field still names `DEC-SEC-001` and `DEC-PROV-004` as blocked by this item, but both decisions' own Decision Register entries (recorded 2026-07-30, after the register row was last written) explicitly state `EXT-TECH-001` is **not** a blocker to either decision — both closed independently, treating the Burundi SMS-delivery proof as a launch-readiness/production-verification matter rather than a decision precondition. This is corrected below (§14).

**Capability 2 remains `Blocked`.** `DEC-PROD-012` is unchanged (`OPEN_FOUNDER`) and was not touched by this task.

## 2. Starting Repository State

`main` at `e931112` (post-`PR #44`); `PR #45` open, `CLEAN`/`MERGEABLE`, CI-green.

## 3. PR #45 Merge Confirmation and Merge SHA

Re-verified `OPEN`/`CLEAN`/`MERGEABLE`/CI-green (`gh pr checks 45`: "Build, Lint, Test, Emulator Validation — pass"). Merged via `gh pr merge 45 --merge`. **Merge commit SHA: `c4c89b3352ee744d43ad0945a75b4567d9992105`.**

## 4. Ending Repository State (post-merge)

Local `main` fast-forwarded to `c4c89b3`; `git rev-list --left-right --count origin/main...main` = `0 0`; `git status --short` empty; no `MERGE_HEAD`/`rebase-merge`/`rebase-apply`. Post-merge CI green on `main` (run `30640517701`, "Build, Lint, Test, Emulator Validation" pass, 1m53s). Confirmed live: `BaseMetadata` gate item remains recorded `Resolved`; Capability 2 remains `Blocked` on `EXT-TECH-001`/`DEC-PROD-012` only, per direct re-read of the Engineering Implementation Programme's Phase 2 rows.

## 5. EXT-TECH-001 Subject and Authority

1. **Full title/subject:** "Firebase phone-OTP delivery to Burundi numbers: reliability, cost, abuse controls, test-number strategy" — the exact wording of the live External Dependencies Register row.
2. **Why it exists:** `TRD23` §23.22 `OTD-004` requires validating "Firebase phone authentication support; Burundi number delivery; cost; abuse controls; fallback authentication; test-phone strategy," which no approved document had performed as of `ENG-P2-000B`'s dependency analysis (2026-07-29).
3. **Requirement/gate it supports:** the Resolution Plan's own Capability Authorisation Gate (`ENG-P2-RES-000` §7, item 1) — `ENG-P2-001` (Customer Identity Implementation) "may begin only when... `EXT-TECH-001` status in the External Dependencies Register is `EVIDENCE_RECEIVED` or `CLOSED` (not `PENDING`)."
4. **Authoritative source:** the External Dependencies Register (`docs/00-governance/decisions/external-dependencies-register.md`) is the governing register; the Resolution Plan (`ENG-P2-RES-000`) is the governing gate document that makes this item a precondition to implementation.
5. **Evidence owner:** Engineering Lead (per the Register's `Owner` column).
6. **Approval authority:** the item's completion criterion (per `ENG-P2-RES-000` §3, `RES-001`'s Ownership Matrix row) is purely evidentiary — "Evidence filed in External Dependencies Register," status `PENDING → EVIDENCE_RECEIVED`. No Founder countersign is named as required to move this specific register status, unlike `DEC-PROV-004`/`DEC-SEC-001`. The Register's `Provider / adviser / authority` column names "Firebase/Google + local carriers" as the external source the evidence must come from.
7. **Category:** Technical Proof (external technical/vendor-behavior evidence) — a factual question about a third-party service's real-world behavior in a specific country, per the Register's own category taxonomy and per `engineering-decision-closure-recommendations.md`'s own framing ("a factual question about a third-party service's behavior in a specific country, not something resolvable by re-reading existing documentation").
8. **Internally generated or externally supplied:** the *documentation* half (product capability, quotas, billing requirements, regional-policy mechanics, general Burundi telecom-market facts) is internally obtainable via primary-source research, and was obtained by `RES-001` (2026-07-29) and independently re-confirmed by this task (§9 below). The *decisive* half — actual SMS delivery success to real Burundi phone numbers on Lumitel, Econet Leo, and Onatel — is empirical, real-world evidence that must be generated by physically sending and receiving SMS through those carriers; it cannot be produced by documentation research, by this coding environment, or by this task's authorization.
9. **Resolvable entirely within the repository:** No. The decisive evidence requires real Burundi phone numbers on three named carriers and a live, billing-enabled Firebase project with its SMS Region Policy configured — none of which this task's environment or authorization provides.
10. **Founder input required:** Not for the evidence-gathering step itself (Engineering-Lead-owned per the Register). Founder input becomes relevant only downstream, at `DEC-PROV-004`'s countersign (already `CONFIRMED`, 2026-07-30) and at any future production-activation gate — neither reopened by this task.

No ambiguity was found in `EXT-TECH-001`'s identity, governing source, ownership, or approval authority — all are explicit and consistent across the Register, the Resolution Plan, and `ENG-P2-000B`. This task therefore proceeded to Stage C rather than stopping and reporting.

## 6. Evidence Owner and Approval Authority

Evidence owner: **Engineering Lead**. Approval authority for the register-status transition (`PENDING → EVIDENCE_RECEIVED`): the Resolution Plan's Ownership Matrix names no separate approver beyond the evidence itself being filed — this is a factual-completion gate, not a decision requiring countersign. `DEC-PROD-012`, by contrast, requires Founder decision — unaffected by, and not conflated with, this item.

## 7. Evidence Inventory

| Artefact / source | Location | Owner | Date | Evidence claim | Validation status | Gaps | Relevance |
|---|---|---|---|---|---|---|---|
| `EXT-TECH-001` Engineering Evidence Package | `docs/00-governance/decisions/evidence/EXT-TECH-001-engineering-evidence-package-2026-07-29.md` | Engineering Lead (`RES-001`) | 2026-07-29 | Firebase-native OTP is technically viable in principle for Burundi; no first-party exclusion; Burundi telecom capable of SMS; ≥1 external-route alternative exists | Authoritative for documentation-derivable facts; explicitly discloses the real-delivery-test gap itself | Real-SMS carrier delivery test not performed | Primary input into `DEC-PROV-004` (already used, `CONFIRMED`) and into this gate determination |
| External Dependencies Register, `EXT-TECH-001` row | `docs/00-governance/decisions/external-dependencies-register.md` | Engineering Lead | last controlled update predates 2026-07-30 decision recordings | Status `PENDING`; assumption "Delivery is feasible (A-untested)"; `Blocks` field names `DEC-SEC-001`, `DEC-PROV-004` | **Partially stale** — `Blocks` field superseded by both named decisions' own 2026-07-30 entries (see §14) | `Blocks` field needed correction | Authoritative live status — governs Gate item 1 |
| `DEC-SEC-001` Decision Register entry | `docs/00-governance/decisions/decision-register.md` (line ~568) | Founder (recorded `RES-003B`) | 2026-07-30 | `EXT-TECH-001` "remains PENDING, a launch-readiness/production-verification matter... not a blocker to this decision" | Authoritative, current | None | Confirms `EXT-TECH-001` does not gate `DEC-SEC-001`, but does not itself change Gate item 1 |
| `DEC-PROV-004` Decision Register entry | `docs/00-governance/decisions/decision-register.md` (line ~1105) | Founder (recorded `RES-002B`) | 2026-07-30 | "`EXT-TECH-001` remains PENDING... per Principle 8... production SMS validation across Burundi carriers... gates production activation, not this decision" | Authoritative, current | None | Same as above |
| Resolution Plan, Capability Authorisation Gate §7 item 1 | `docs/05-implementation/roadmap/ENG-P2-RES-000-capability-2-resolution-plan.md` | Engineering Lead (plan author) | 2026-07-29, `Status: Complete` (unaltered) | Gate item 1: `EXT-TECH-001` must be `EVIDENCE_RECEIVED`/`CLOSED`, not `PENDING`, before `ENG-P2-001` may begin | Authoritative, current — **not superseded** by the two decisions above; those decisions changed their own dependency treatment of `EXT-TECH-001`, they did not amend the Gate document itself | See §13 observation | Directly governs this task's determination |
| Live `eleventh-on-us-dev` Identity Platform Admin config | `identitytoolkit.googleapis.com/admin/v2/projects/eleventh-on-us-dev/config` | N/A (live infrastructure) | Queried 2026-07-31 (this task) | `404 CONFIGURATION_NOT_FOUND` | Directly queried, read-only, this task | Confirms Firebase Auth has never been configured on the dev project | Corroborates "no delivery test has occurred" |
| `.firebaserc` | `.firebaserc` | N/A | Re-read 2026-07-31 (this task) | Only `dev`/`staging` aliases; no `production` | Directly read, this task | — | Confirms no production project exists to run a production-scale test against |
| Firebase Auth billing/quota documentation | `firebase.google.com/docs/auth/limits` | Google/Firebase | Re-fetched 2026-07-31 (this task) | Blaze-plan billing account required for SMS; quotas 900/min, 3,000/day project-wide, 50/min & 500/hour per-IP | Directly re-fetched, current, matches `RES-001`'s 2026-07-29 finding exactly | — | Confirms no material documentation drift in 2 days |
| Google Cloud Identity Platform SMS Region Policy documentation | `docs.cloud.google.com/identity-platform/docs/admin/sms-regions` | Google Cloud | Re-fetched 2026-07-31 (this task) | No explicit Burundi mention either way; policy must be explicitly configured | Directly re-fetched, current, consistent with `RES-001`'s finding | — | Confirms no material documentation drift in 2 days |
| `ENG-P1-001` Manual Storage Verification Report | `docs/05-implementation/reports/ENG-P1-001-manual-storage-verification-2026-07-21.md` | N/A (prior task) | 2026-07-21 | Both `eleventh-on-us-dev` and `eleventh-on-us-staging` are Blaze-plan billing-enabled | Authoritative, prior task, independently corroborated by this task's live `gcloud services list` check | — | Establishes a live billing-enabled project already exists — narrows, but does not close, the remaining gap |
| Requirements Traceability Matrix | `docs/00-governance/requirements-traceability-matrix.md` | N/A | Checked 2026-07-31 (this task) | No `EXT-TECH-001` reference exists | Confirmed directly via `grep`, not assumed | N/A | Nothing to correct |

## 8. Evidence Requirement Matrix

| Evidence requirement | Governing source | Required proof | Existing evidence | Status | Owner | Follow-up |
|---|---|---|---|---|---|---|
| Classic Firebase phone sign-in has no first-party Burundi exclusion | `TRD23` `OTD-004`; `ENG-P2-RES-000` §3 `RES-001` | Firebase official documentation | `RES-001` §3 (S1–S4 primary sources); independently re-fetched by this task (§9) | **Satisfied** | Engineering Lead | None |
| Burundi telecom capable of carrying SMS | `RES-001` §4 | Carrier/market research | `RES-001` §4 (S7, search-synthesis, disclosed as directional not authoritative) | **Partially Satisfied** | Engineering Lead | Optional: a primary regulator (ARCT Burundi) source, not required to close the gate below |
| Firebase-native SMS actually reaches Burundi numbers reliably, on all three carriers | `ENG-P2-RES-000` §7 item 1 (the decisive gate criterion) | A real SMS delivery test against Lumitel, Econet Leo, and Onatel from a live, billing-enabled, SMS-Region-Policy-configured Firebase project | None — explicitly disclosed as absent by `RES-001` §7/§10/§11, and independently reconfirmed absent by this task's live `CONFIGURATION_NOT_FOUND` check | **Missing** | Engineering Lead | The single required next action — see §13 |
| Per-SMS cost for Burundi | `RES-001` §9 | Firebase billing data for real Burundi sends | None — no Burundi-specific tier published anywhere | **Missing** | Engineering Lead | Obtainable only as a byproduct of the same real delivery test |
| Abuse-control adequacy (rate limits, reCAPTCHA, SMS Region Policy) | `RES-001` §6 | Firebase official documentation | `RES-001` §3/§6, independently re-confirmed by this task (§9) | **Satisfied** | Engineering Lead | None |
| Test-phone-number strategy for CI/QA | `RES-001` §7 | Firebase official documentation | `RES-001` §7 (10 test-number limit, no real SMS) | **Satisfied** | Engineering Lead | None |
| External Dependencies Register `EXT-TECH-001` row currency | This register, live | Correct `Blocks`/status fields | Row's `Blocks` field stale relative to `DEC-SEC-001`/`DEC-PROV-004`'s own 2026-07-30 entries | **Invalid** (as found) → corrected by this task, §14 | Engineering Lead | None further |

Absence of a contradictory finding on any "Satisfied" row is not, by itself, treated as proof — each "Satisfied" determination above rests on a directly-cited, re-verified primary source, not merely the absence of a counter-claim.

## 9. Evidence Validation Findings

**Documentation evidence re-validated, not re-derived from scratch:** given `RES-001`'s evidence package is only 2 days old and already rigorously sourced (dated citations, source-reliability notes, explicit assumption disclosure), this task performed a bounded, targeted re-verification of the two most decisive documentation facts rather than repeating the full research pass:
- `firebase.google.com/docs/auth/limits`, re-fetched 2026-07-31: confirmed unchanged — Blaze-plan billing account required for phone-sign-in SMS; quotas 900/min & 3,000/day project-wide, 50/min & 500/hour per-IP. Matches `RES-001` §3/§9 exactly.
- `docs.cloud.google.com/identity-platform/docs/admin/sms-regions`, re-fetched 2026-07-31: confirmed unchanged in substance — no explicit Burundi mention either way; the policy must be explicitly configured (allowlist or denylist). No material drift found; the automated fetch-summary of this specific re-check did not itself surface the "default policy allows no regions for new projects" sentence `RES-001` quoted, which this task flags as a minor extraction-method variance (small-model summarization, not a raw diff) rather than a contradiction — the decisive fact for this determination (Burundi's status is not resolved by documentation either way, and must be tested) is unaffected either way.

**Live infrastructure evidence gathered directly by this task (new, not present in `RES-001`):**
- `gcloud auth print-access-token` + a direct, read-only `GET` against `identitytoolkit.googleapis.com/admin/v2/projects/eleventh-on-us-dev/config` returned `404 CONFIGURATION_NOT_FOUND` — Firebase Authentication has never been initialized/configured on the live `eleventh-on-us-dev` project. This directly confirms no SMS Region Policy has been set and no phone-auth configuration of any kind exists yet.
- `gcloud services list --enabled --project=eleventh-on-us-dev` confirms `identitytoolkit.googleapis.com` is enabled (the API is available) but, per the config check above, unconfigured.
- `.firebaserc` re-read: only `dev`/`staging` aliases exist; no `production` alias.
- Repository-wide search confirmed `functions/src` still contains no domain code (only `commands`/`correlation`/`errors`/`events`/`idempotency`/`logging`/`metadata`/`outbox`/`validation` infrastructure modules) and no phone-auth-specific code anywhere — unchanged since `RES-001`'s equivalent 2026-07-29 finding.

**Limitations:** this task did not, and could not, obtain real Burundi phone numbers on Lumitel, Econet Leo, or Onatel; did not configure the live project's SMS Region Policy (a configuration action distinct from evidence-gathering, and explicitly reserved to `RES-002`/`RES-003` by `RES-001` §3); and did not send or attempt to send any real SMS. No external evidence was fabricated to fill this gap.

## 10. External Verification Performed or Still Required

**Performed:** re-fetch of two Firebase/Google Cloud official documentation pages (§9), confirming no material change since `RES-001`'s 2026-07-29 research.

**Still required, and outside this task's capability/authorization:** a direct, real-SMS delivery test against each of Burundi's three carriers (Lumitel, Econet Leo, Onatel), from a Blaze-plan project with its SMS Region Policy explicitly allowlisting Burundi, using real phone numbers on each carrier, with delivery (or non-delivery) directly observed and recorded. This requires physical access to Burundi mobile numbers and is not obtainable via documentation research, `WebFetch`/`WebSearch`, or any read-only infrastructure query available to this task. It is the Engineering Lead's named action per the Register, and remains the single blocking evidence item.

## 11. Gate Determination

**Still Pending.**

- **Determination:** `EXT-TECH-001`'s Capability Authorisation Gate condition (`ENG-P2-RES-000` §7 item 1) is **Still Pending**. The required evidence — a real SMS-delivery test confirming Firebase-native OTP reaches Burundi numbers on all three carriers — is well-defined and expected, but has not yet been obtained. It cannot be obtained by documentation research (already exhausted by `RES-001` and re-confirmed current by this task) and cannot be obtained within this task's authorization or environment (no access to real Burundi phone numbers).
- **Supporting evidence:** §7–§10 above; the live External Dependencies Register status (`PENDING`); the live `CONFIGURATION_NOT_FOUND` result confirming zero progress since `RES-001`; `RES-001`'s own explicit, disclosed gap statement.
- **Approval authority:** Engineering Lead (evidence-filing); no Founder countersign is itself required to move this specific register status, per the Resolution Plan's own Ownership Matrix.
- **Remaining conditions:** exactly one — perform the real-SMS delivery test described above and file its result against the External Dependencies Register, moving `EXT-TECH-001` to `EVIDENCE_RECEIVED` (if delivery succeeds on an acceptable basis) or `CLOSED` (if a decision is made to proceed via the external-route alternative instead, per `DEC-PROV-004`'s already-approved "Firebase-native OTP + Google Sign-In within a broader... Strategy" — note `DEC-PROV-004` is closed and does not itself require this test to have occurred first, per its own decision text).
- **Effect on Capability 2:** the Gate's item 1 remains unsatisfied; `ENG-P2-001` (Customer Identity Implementation) may not begin per the Resolution Plan's own explicit text, independent of every other Gate item's status.
- **Next action:** see §12 below.

This determination was reached from what the evidence actually shows (a well-defined, un-fabricable gap that has not moved in two days), not from the mere absence of a contradictory finding.

## 12. Capability 2 Status

**Capability 2 (Identity, Roles and Business Context / Phase 2) remains `Blocked`.**

Of the Capability Authorisation Gate's 8 items (`ENG-P2-RES-000` §7):
- Items 2–6 (`DEC-PROV-004`, `DEC-SEC-001`, `DEC-DATA-007`, `DEC-ID-003`, `DEC-PROD-012`) — items 2–5 are all `CONFIRMED`/Final Decisions (directly re-verified in the live Decision Register during this task); item 6 (`DEC-PROD-012`) remains `OPEN_FOUNDER`, unchanged, not touched by this task.
- Item 7 (`BaseMetadata`/TRD10 §10.5 conformance) — `Resolved`, per `RES-005.2b` (2026-07-31), independently re-confirmed live by this task at Stage A.
- Item 8 (Programme table reflects items 1–7) — a verification step; not independently assessed by this task beyond the Programme rows already confirmed accurate at Stage A.
- **Item 1 (`EXT-TECH-001`) — Still Pending, per this task's own determination above.**

Capability 2 is therefore blocked on exactly two independent, unresolved Gate items: **`EXT-TECH-001` (Still Pending, this task)** and **`DEC-PROD-012` (`OPEN_FOUNDER`, unchanged)**. Resolving one does not resolve or excuse the other; this task does not declare Capability 2 implementation-ready.

## 13. Recommended Next Executable Task

**`EXT-TECH-001-DELIVERY-TEST`** — a Founder/Engineering-Lead-authorized, bounded task to configure the `eleventh-on-us-dev` project's SMS Region Policy to allow Burundi, enable phone sign-in on a Blaze-plan basis, and send a small number of real test SMS to genuine Lumitel, Econet Leo, and Onatel numbers, recording delivery success/failure per carrier, cost per SMS, and any abuse-control friction encountered — then file the result against the External Dependencies Register to move `EXT-TECH-001` to `EVIDENCE_RECEIVED` or `CLOSED`. This requires real phone-number access this coding environment does not have and is the single action that would close the last engineering-evidence Gate item.

A secondary observation, not a competing recommendation: this task found the Resolution Plan's Capability Authorisation Gate document (§7 item 1, dated 2026-07-29) has not been revisited since `DEC-SEC-001`/`DEC-PROV-004` (2026-07-30) each independently reclassified `EXT-TECH-001` as a launch-readiness matter rather than a decision blocker for themselves specifically. The Gate document's own item 1 text is unambiguous and unmodified, so this task applied it as written rather than inferring a relaxation from the two decisions' notes — but a future `ENG-P2-GATE-001`-style reassessment (already identified, not executed, in the `ENG-P1-EXIT-001` report) may be the appropriate venue to decide, with Founder/Engineering-Lead authority, whether the Gate itself should be narrowed to match the two decisions' own treatment. This task does not make that call; it is disclosed as an observation only, consistent with the explicit prohibition on this task resolving `DEC-PROD-012` or declaring Capability 2 ready.

This task does not execute either.

## 14. Files Created or Modified

**Created:** this report.

**Modified:** `docs/00-governance/decisions/external-dependencies-register.md` — the `EXT-TECH-001` row's `Blocks` column corrected from `DEC-SEC-001, DEC-PROV-004; customer registration` to reflect that both named decisions' own 2026-07-30 Decision Register entries explicitly state `EXT-TECH-001` no longer blocks them (both `CONFIRMED` independently); the field now reads the item's real current blocking scope — the Capability Authorisation Gate (`ENG-P2-001` implementation start) and production customer registration. `Status` left `PENDING` (unchanged — no evidence justifies a status change) and `Evidence location` updated to reference both the existing `RES-001` evidence package and this report.

**Why this file was in scope despite not being pre-listed:** the staleness was discovered directly during Stage C/D evidence-inventory investigation of `EXT-TECH-001`'s own register row — a direct dependency of the item this task exists to investigate, not an unrelated file. Justification, per the task's own "Files and Scope Control" requirement: (a) dependency — the row is `EXT-TECH-001`'s sole authoritative live register entry; (b) live, not historical — it is the register itself, actively read by every downstream tracker; (c) within scope — Stage H explicitly names "EXT-TECH-001 register entry" as an artefact to review for updates; (d) validation coverage — the correction was checked against both cited Decision Register entries' exact text (quoted in §7 above) before editing, and `npx prettier --check` confirmed formatting is unchanged elsewhere in the file.

**Not modified:** the Resolution Plan (fixed, `Status: Complete` planning document — preserved per this chain's established precedent; its Gate item 1 text remains the governing, current criterion and was not altered); the Requirements Traceability Matrix (confirmed, no `EXT-TECH-001` reference exists); the Engineering Implementation Programme, Master Workflow, `CDR-001`, Coding-Agent Prompt Register (all already accurately state `EXT-TECH-001` `PENDING`/Capability 2 `Blocked` — nothing in them was found factually false by this task's investigation, so none required correction, consistent with the narrow-scoping precedent this chain has applied throughout); `DEC-PROD-012` and any other Decision Register entry; any application code; the `RES-001` evidence package itself (historical, preserved unmodified).

## 15. Code Diff Summary

None. No application code was created or modified.

## 16. Commands Executed

`gh pr view 45`, `gh pr checks 45`, `gh pr merge 45 --merge`, `gh pr view 45 --json state,mergeCommit,mergedAt`, `git fetch origin`, `git checkout main`, `git pull origin main --ff-only`, `git rev-list --left-right --count origin/main...main`, `git status --short`, `gh run list --branch main`, `gh run watch <id> --exit-status`; `grep -rln "EXT-TECH-001" docs/`; direct reads of the External Dependencies Register, the `RES-001` Evidence Package, the Decision Register (`DEC-SEC-001`, `DEC-PROV-004`, `DEC-DATA-007`, `DEC-ID-003`, `DEC-PROD-012` entries), the Resolution Plan §7 Capability Authorisation Gate, `engineering-decision-closure-recommendations.md`; `WebFetch` against `docs.cloud.google.com/identity-platform/docs/admin/sms-regions` and `firebase.google.com/docs/auth/limits`; `gcloud auth print-access-token` + `curl` against `identitytoolkit.googleapis.com/admin/v2/projects/eleventh-on-us-dev/config`; `gcloud services list --enabled --project=eleventh-on-us-dev`; `cat .firebaserc`; `find functions/src -maxdepth 1 -type d`; `grep` for `EXT-TECH-001` in the Requirements Traceability Matrix.

## 17. Dependencies Added

None.

## 18. Configuration Changes

None. No live Firebase/GCP project configuration was changed — all infrastructure queries performed by this task were read-only (`GET`/`list`/`describe`-class calls only).

## 19. Risks

None introduced. One already-reviewed PR merged with content unaltered by this task. All live-infrastructure interaction was strictly read-only. The single register correction (§14) is a factual accuracy fix grounded in two directly-quoted, already-recorded Decision Register entries, not a new judgment call. No external evidence was fabricated; the gate was not marked satisfied in the absence of proof.

## 20. Rollback Instructions

`git revert` of this task's own commit — a new report plus one narrow register-field correction; PR #45's merge is independently reversible per its own disclosed rollback instructions, requiring fresh Founder authorization, out of scope here.

## 21. Markdown Evidence-Resolution Report

This document.

## 22. Changes-Tracking Updates

`docs/changes/IMPLEMENTATION_CHANGES.md` and `docs/00-governance/documentation-changes-log.md` (Entry 045) both updated (see the accompanying commit).

## 23. Persistent Changes Record

This report, at its stated source-of-truth path, is the persistent `.md` changes record for `EXT-TECH-001-EVIDENCE`.

---

## Testing-Methodology Observation (Non-Blocking, Recorded Per Instruction)

The prior `RES-005.2b` task disclosed that `functions/tsconfig.json` excludes `src/**/*.test.ts` from `tsc --noEmit` (the command `pnpm typecheck` and CI's Typecheck step actually run), meaning TypeScript type-only assertions inside `.test.ts` files (e.g. `@ts-expect-error`, typed object-literal construction) provide no real compile-time enforcement in this repository's actual CI pipeline. This is confirmed already recorded in `RES-005.2b`'s own Code Conformance Report §12 (`docs/05-implementation/reports/RES-005.2b-basemetadata-code-conformance-report-2026-07-31.md`) and in `IMPLEMENTATION_CHANGES.md`'s `RES-005.2b` entry — it is not re-recorded as a new finding here, per the instruction not to duplicate it. This task did not modify test infrastructure, `functions/tsconfig.json`, or `vitest.config.ts`, and did not treat this observation as connected to `EXT-TECH-001` — no governing source connects them. Future type-contract tests should use either an explicitly compiled type-test target or a repository-approved type-testing mechanism, exactly as `RES-005.2b` already recorded.
