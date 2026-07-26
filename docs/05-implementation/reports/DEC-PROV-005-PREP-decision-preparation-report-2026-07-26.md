> **Title:** DEC-PROV-005-PREP Decision-Preparation Report
> **Status:** Evidence and recommendation package complete — submitted for Founder review. `DEC-PROV-005` not resolved. No provider selected or configured. No dependency installed. No code modified. `ENG-P1-003` not begun.
> **Date:** 2026-07-26
> **Classification:** Target-only addition (decision-preparation evidence, not previously existing)

# DEC-PROV-005-PREP Decision-Preparation Report

## 1. Executive Summary

Executed "TASK — DEC-PROV-005-PREP: Error Monitoring Provider Decision Evidence and Founder Brief" following the merge of PR #14/#15 and administrative closure of `EIR-ENG-P1-002`. All 8 required entry conditions were verified before research began — including a disclosed recurrence of the previously-Founder-accepted emulator-timing CI flakiness on PR #15's exact merge commit (2 failures, then a clean pass, on zero code difference; see §7). Researched three qualified options — Firebase/Google Cloud native, Sentry, and a bounded hybrid — against the required 18 evaluation criteria, using current official Sentry and Google Cloud documentation/pricing pages accessed 2026-07-26, distinguishing verified facts from reasoned inference and provisional assumption throughout. Produced the five required deliverables. **`DEC-PROV-005` remains `OPEN_PROVIDER`.** No option was marked approved. The Technical Lead recommendation (Option C, bounded hybrid) is offered for discussion only, per the task's own instruction.

## 2. Research Method

Direct fetch of official vendor/provider pages was attempted first for every claim; where a fetch returned truncated or redirected content (Google Cloud's own `cloud.google.com/products/observability/pricing`, `logging/pricing`, and `monitoring/pricing` pages all returned truncated or unresolvable content across repeated attempts), corroborating search-engine synthesis was used instead and explicitly labeled secondary in the Source Register, following the same disclosure discipline `DEC-LEGAL-006`/`DEC-TECH-005`'s evidence packs established. Every external fact is dated to its 2026-07-26 access date. Internal facts (existing architecture, existing code) were read directly from the live repository in a fresh worktree, not recalled from memory.

## 3. Files Created

- [`docs/00-governance/decisions/evidence/DEC-PROV-005-error-monitoring-evidence-2026-07-26.md`](../../00-governance/decisions/evidence/DEC-PROV-005-error-monitoring-evidence-2026-07-26.md) — Evidence Pack (11 sections: decision question, architecture baseline, options, methodology, architecture boundary, 18-criteria comparison, security/privacy, cost, unresolved questions, recommendation).
- [`docs/00-governance/decisions/evidence/DEC-PROV-005-founder-brief-2026-07-26.md`](../../00-governance/decisions/evidence/DEC-PROV-005-founder-brief-2026-07-26.md) — Founder Decision Brief (Option A/B/C comparison, strengths/weaknesses/consequences/burden/privacy per option, recommendation, exact decision required).
- [`docs/00-governance/decisions/evidence/DEC-PROV-005-source-register-2026-07-26.md`](../../00-governance/decisions/evidence/DEC-PROV-005-source-register-2026-07-26.md) — Source Register (12 external sources, 13 internal sources, full reliability-limitation disclosure).
- [`docs/00-governance/decisions/evidence/DEC-PROV-005-proposed-updates-2026-07-26.md`](../../00-governance/decisions/evidence/DEC-PROV-005-proposed-updates-2026-07-26.md) — Proposed-but-unapplied Decision Register update, clearly labeled as such throughout.
- `docs/05-implementation/reports/DEC-PROV-005-PREP-decision-preparation-report-2026-07-26.md` — this report.

## 4. Files Modified

- `docs/00-governance/documentation-changes-log.md` — one new append-only entry (Entry 029).
- `docs/changes/IMPLEMENTATION_CHANGES.md` — one new append-only dated entry.

No other file was modified. Per this task's explicit constraint, the Decision Register itself, the Engineering Implementation Programme, the Coding-Agent Prompt Register, application code, dependencies, Firebase configuration, live infrastructure, EIR files, and Master Workflow sequencing were **not** touched.

## 5. Sources Reviewed

**12 external (7 Sentry, 5 Google Cloud) + 13 internal repository sources.** Full detail, including per-source reliability limitations, in the [Source Register](../../00-governance/decisions/evidence/DEC-PROV-005-source-register-2026-07-26.md).

- **Directly fetched and confirmed primary:** 4 external sources (Sentry pricing page, Sentry React SDK docs, Sentry Node/GCP-Functions SDK docs, Google Cloud Error Reporting docs).
- **Search-synthesized, secondary:** 7 external sources — used only where a direct fetch failed (Google Cloud's own pricing pages returned truncated content on every attempt; this is disclosed, not hidden, and flagged in Evidence Pack §10 item 6 as needing re-verification before any budget commitment).
- **Internal:** 13 repository sources — the Decision Register, TRD20/TRD23, the Cloud Environment & Deployment Strategy, the Engineering Implementation Programme/Prompt Register/Master Workflow, and the actual `ENG-P1-002` code (`logger.ts`, `operationalLog.ts`, `errorCategories.ts`, `platformError.ts`, `correlationId.ts`) that any provider decision must sit behind.

## 6. Evidence-Quality Assessment

No claim in the Evidence Pack blends verified fact with inference or assumption without labeling which is which — this was a specific, repeated instruction in the governing task and is enforced section-by-section in the Evidence Pack (§5 states the three-tier method; §7's comparison table and §9's cost assessment apply it row-by-row; §10 lists six specific unresolved questions rather than allowing them to be silently absorbed into the recommendation). The single most significant finding — that Cloud Error Reporting has no browser JavaScript SDK and its own documentation directs client apps to the mobile-only Firebase Crashlytics — is a **verified fact** read directly from Google's own current documentation (source G4, direct fetch), not an inference; it is the load-bearing fact behind the Technical Lead's recommendation.

## 7. Entry-Condition Verification and CI Disclosure

All 8 entry conditions in the governing task were verified against the live repository (fresh worktree on `origin/main`) before any research began:

1. PR #15 merged — commit `1b07b55be9fc92526e2067486ad6014972f4b980`.
2. Post-merge CI on that exact commit — **green, but only after a disclosed rerun sequence**: the first run failed on two different emulator-suite assertions across two different test files; a rerun on the unchanged commit failed again on a third, different assertion in the same file; a second rerun passed cleanly. PR #15 changed only documentation/records files (`gh pr diff --name-only` confirmed zero application-code changes), so this is a recurrence of the exact same emulator-timing residual risk already disclosed and Founder-accepted in the `ENG-P1-002` Technical Review, not a new defect — disclosed here rather than silently treated as routine.
3. `EIR-ENG-P1-002` — `Administratively Closed` (confirmed via `records/version-1/phase-1/ENG-P1-002.md` §1).
4. `ENG-P1-002` — remains `Complete` (confirmed via `records/history-index.md`).
5. `ENG-P1-003` — remains `Blocked` (confirmed via `records/history-index.md`, the Programme, and the Prompt Register).
6. `DEC-PROV-005` — confirmed `OPEN_PROVIDER`, confirmed as `ENG-P1-003`'s sole stated provider dependency across the Programme, Prompt Register, and Master Workflow.
7. No existing document resolves or fully evaluates `DEC-PROV-005` — every repository match for the string is either the Decision Register entry itself, a tracker cross-reference, or the Cloud Environment & Deployment Strategy §8's explicit statement that it defers this decision.
8. Master Workflow, Programme, Decision Register, Engineering Blueprint, and relevant TRDs (TRD20 §20.22–20.36, TRD23 §23.23) reviewed before research began.

No stop condition was triggered.

## 8. Validation Results

| Check | Result |
|---|---|
| `git status --short` | Exactly the 5 created files + 2 modified log files |
| `git diff --check` | Clean |
| `npx prettier --write` (docs subset) | Clean |
| Repository-aware relative-link validator | Clean — 0 broken links |
| Source-link and citation review | Every external claim in the Evidence Pack traces to a Source Register entry; every Source Register entry states its access date and reliability tier |
| Duplicate decision-package check | No prior `DEC-PROV-005` evidence pack, brief, or source register existed before this task (confirmed by repository search in §7 item 7) |
| Proposed-update status check | `DEC-PROV-005-proposed-updates-2026-07-26.md` confirmed to state, in three separate places, that it is unapplied and requires Founder action |
| Secret-pattern scan | Clean — no API key, DSN, or credential-shaped string in any created file (none was needed; no account was created) |
| `git diff --check` | Clean (duplicate check per required list — re-run, still clean) |
| Repository-status verification | `Decision Register`, `Engineering Implementation Programme`, `Coding-Agent Prompt Register`, application code, dependencies, Firebase configuration, EIR files, and Master Workflow sequencing all confirmed byte-for-byte unchanged |

## 9. Risks

None from this task's own output — it is evidence-only. Two risks are carried forward as explicit unresolved questions for whichever option the Founder eventually selects (Evidence Pack §10, items 1–2): potential incidental sensitive-data capture in stack traces (provider-independent), and an unevaluated cross-border legal question specific to Sentry if selected. Neither is created by this task; both are disclosed so they are not silently inherited by a future implementation task.

## 10. Rollback

This task wrote only new, additively-created evidence files plus two append-only log entries. Rollback, if ever needed, is a plain `git revert` of the commit — no existing file was edited, no tracker status was changed, and no external system was touched.

## 11. Next Step

Per the Founder's own stated sequence: the Founder reviews the evidence and recommendation, gives a technical view, presents the options, confirms `DEC-PROV-005` through the normal Decision Governance Workflow, and only then is the `ENG-P1-003` blueprint task prepared. None of that is performed by this report.
