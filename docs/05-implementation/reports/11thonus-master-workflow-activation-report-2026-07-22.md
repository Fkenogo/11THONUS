> **Title:** 11thONUS Master Workflow Correction, Approval and Activation — Report
> **Status:** Complete — the Master Workflow itself is now version 1.0, Active
> **Date:** 2026-07-22
> **Classification:** Documentation and governance task — no application code, test, dependency, `.firebaserc`, Firebase Rules, or live-infrastructure file was touched; `ENG-P1-001-CLOSE` was not executed

# 11thONUS Master Workflow Correction, Approval and Activation — Report

## 1. Executive Summary

Corrected the three defects the Founder/Technical Lead review identified in the Master Workflow v0.1 draft: a phase-map gate-classification error (decision statuses had been substituted for TRD22's actual behavioral exit criteria in seven rows — audited all seventeen, found no others), an MW-001/MW-002 reconciliation gap (both were already complete but shown as future work), and an overly broad App Check deferral deadline ("Before Production" corrected to the actual trigger: first externally-accessible Staging web deployment against live Firebase). Applied three narrow wording clarifications the review also requested (§10, §14, §15). Recorded Founder and Technical Lead approval and activated the document at **version 1.0, Status: Active — governed delivery control record**, effective 2026-07-22. Synchronized the six cross-referenced documents narrowly — none of their work-package status fields were touched.

`ENG-P1-001` remains `Approved`. `ENG-P1-002` and `ENG-P1-003` remain `Blocked`. **`ENG-P1-001-CLOSE`** — commit, push, CI verification, Definition-of-Done reconciliation, status transition to `Complete`, and `ENG-P1-002`'s unblocking — is the exact next authorized task, and was **not** executed by this task.

## 2. Mandatory Entry-Check Result

All ten items confirmed before any edit, per the task's explicit entry check:

1. Current phase: **Phase 1** — confirmed.
2. Current active work package: **`ENG-P1-001`** — confirmed.
3. Official status: **`Approved`, not `Complete`** — confirmed.
4. Infrastructure closure criteria: **satisfied** — confirmed (Master Workflow §7, unaffected by this task).
5. Current authorized governance action: **Master Workflow correction and activation** — this task.
6. Next implementation-adjacent task after activation: **`ENG-P1-001-CLOSE`** — confirmed, and left unexecuted.
7. `ENG-P1-002` remains **Blocked** — confirmed, unchanged.
8. `ENG-P1-003` remains **Blocked** — confirmed, unchanged.
9. No other agent modifying overlapping documentation — confirmed via `git status --short` matching exactly the state the prior task left.
10. No application or infrastructure changes authorized — respected throughout; verified in §22.

No conflict was found; no stop condition was triggered.

## 3. Pre-Change Analysis

Reviewed in full before editing: the Master Workflow v0.1 itself, its Creation Report, the Engineering Implementation Programme (§B.1 summary table and §B.2 detailed phase profiles, the authoritative source for every Entry/Exit Criteria correction below), TRD Chapter 22 (via the Programme's own faithful extraction — not re-derived independently, per the task's "source from the Programme/TRD22" instruction), the live Decision Register (re-checked for `DEC-LEGAL-006`'s status, used in the corrected P14 row), the Definition of Done, the AI Collaboration Workflow, the Implementation Prompt Standard, the full `ENG-P1-001` evidence chain, and `docs/changes/IMPLEMENTATION_CHANGES.md`. No material conflict was found requiring a stop before editing.

## 4. Phase-Map Defect Analysis

The v0.1 §6 table used a single "Exit Gate" column that, for **P4, P6, P7, P9, P10, P14, and P15**, actually held a decision or provider status (e.g., P4's Exit Gate literally read `DEC-LOY-009 CONFIRMED (already true)`) rather than TRD22's own behavioral exit criterion for that phase. This is a genuine **gate-classification defect**, not merely a wording issue: "the decision governing this phase is resolved" and "the phase functionally exits per TRD22" are two independently-satisfiable gates — a phase can have every decision resolved and still not exit (behavioral criteria unmet), or, in principle, have unresolved D2/D3-priority decisions that don't block exit at all. Collapsing them into one column risks a reader concluding a phase has exited once its decisions clear, which is not TRD22's own definition of "exit."

**All seventeen rows (P0–P16) were audited**, not only the seven flagged, against the Programme's own §B.2 extraction of TRD22 §22.10–22.26's exit criteria (verbatim, cited section-by-section) and §B.1's Decision Dependencies column. P0, P1, P2, P3, P5, P8, P11, P12, P13, and P16 already carried genuine behavioral exit criteria in their Exit Gate cells — no defect found in those ten.

## 5. Phase-Map Corrections

§6 rebuilt with three separate columns — **Entry Gate**, **Decision / Provider / Legal Gate**, **Exit Gate (TRD22, behavioral)** — for all seventeen phases. Every exit criterion is a direct, faithful restatement of the Programme's own TRD22-sourced text, cited to its exact TRD22 section (§22.10–§22.26). Every decision/provider/legal dependency is moved into its own column, with status shown exactly as recorded in the Programme/Decision Register (e.g., P4: `DEC-LOY-009 — CONFIRMED 2026-07-18`; P14: `DEC-LEGAL-001/003/005/006 (D2/D3) — 006 CONFIRMED, others open`, the `006` status independently re-verified live against the Decision Register, not assumed). **No decision was resolved, restated as resolved, or altered.** No new phase criterion was invented — every cell traces to the Programme or TRD22.

## 6. MW-001/MW-002 Reconciliation

§8 previously listed `MW-001` ("Create and approve the Master Workflow") and `MW-002` ("Reconcile execution trackers...") as the *first two items* of a forward-looking sequence — both were, in fact, already substantially complete (drafting and the six cross-reference integrations) at the time the v0.1 document was created; only Founder/Technical-Lead *approval* remained outstanding. §8 now records:

- `MW-001A` — Master Workflow creation — **Complete** (2026-07-22, prior task).
- `MW-002` — Tracker and workflow integration (the six cross-referenced documents) — **Complete within `MW-001A`** (2026-07-22, prior task).
- `MW-001B` — Master Workflow review, correction, and approval — **Current** (this task, 2026-07-22).

§17 updated to state plainly that `MW-001A`/`MW-002`/`MW-001B` are complete and the next authorized action is **`ENG-P1-001-CLOSE`**. The engineering sequence itself (`ENG-P1-001-CLOSE` → `ENG-P1-002-PREP` → `ENG-P1-002` → `ENG-P1-002-REVIEW` → `DEC-PROV-005` → `ENG-P1-003` → `PHASE-1-CLOSE` → `PHASE-2-GATE`) was **not** changed, per the task's explicit instruction.

## 7. App Check Deferral Correction

§13's App Check row previously stated the latest resolution point as "Before Production (Phase 16)" — technically true but materially understating how soon it actually matters, since a Staging deployment (well before Production) already needs it if that deployment is externally accessible and talks to live Firebase. Corrected to:

> *"Before the first externally accessible Staging web deployment that initializes against live Firebase, or earlier once the Firebase Web App and approved domain are available; in all cases before Production."*

Reason, owner, resume trigger, and blocking status updated per the task's exact specification: reason is the absence of a registered Web App, approved domain, and reCAPTCHA/App Check provider configuration; owner is the Founder (Web App/domain) and Engineering Lead (provider configuration); resume trigger is preparation of the first live Staging web deployment; it does **not** block `ENG-P1-001-CLOSE` or `ENG-P1-002`; the safety control recorded is `ENG-P1-001`'s existing fail-closed behavior (non-development builds refuse to boot without a real site key). **App Check was not configured in this task** — this is a documentation correction only.

## 8. Non-Blocking Wording Corrections

1. **§10** — no longer implies `ENG-P0-001`/`ENG-P0-002` are "active or immediately next." Reworded to state they are shown for immediate context only, both being `Complete`.
2. **§14** — added: after activation, Technical-Lead-drafted updates take effect only upon Founder/Technical-Lead approval per §20's model; a coding agent may never approve a Master Workflow change (paralleling the existing rule that a coding agent never approves its own Technical Review or resolves a Decision Register entry).
3. **§15** — added: the entry-check requirement applies prospectively from the document's effective date and does not retroactively invalidate `ENG-P0-001`, `ENG-P0-002`, or the already-completed `ENG-P1-001` work.

None of these three edits altered the document's structure or any other section's substance.

## 9. Approval Record

§20 updated exactly as specified:

| Field | Value |
|---|---|
| Founder approval | Approved — Kenogo |
| Technical Lead approval | Approved — ChatGPT Technical Lead |
| Approval date | 2026-07-22 |
| Resulting version | 1.0 |
| Effective status | Active |

§20 explicitly states the scope of this approval: it applies to the Master Workflow governance document only. **It does not** mark `ENG-P1-001` `Complete`, authorize `ENG-P1-002` implementation, resolve any Decision Register entry, or deploy anything.

## 10. Version Transition

§1 (Document Control): `Version 0.1 → 1.0`; `Status: Proposed — awaiting Founder and Technical Lead approval → Active — governed delivery control record`; `Classification` set to *"Active governance coordination record — Engineering Governance group (not a constitutional or product authority document; see §4)"*, explicitly matching the task's instruction not to call it constitutional or product authority; `Effective date: 2026-07-22`; `Last controlled update: 2026-07-22`. §19 (Version History) gained the `1.0` row alongside the preserved `0.1` row — the prior draft entry was not deleted, only appended to.

## 11. Current Programme Position

Unchanged by this task, restated for completeness: Phase 0 Complete; Phase 1 In Progress (`ENG-P1-001` Approved, infrastructure closure criteria satisfied, not Complete); Phase 2 Blocked (four open D1 decisions, independently re-verified live during this task's own review: `DEC-SEC-001` `OPEN_ENGINEERING`, `DEC-ID-003` `OPEN_FOUNDER`, `DEC-DATA-007` `OPEN_ENGINEERING`, `DEC-PROV-004` `OPEN_PROVIDER`).

## 12. Exact Next Authorized Task

**`ENG-P1-001-CLOSE`** — commit, push, CI verification, Definition-of-Done reconciliation, status transition to `Complete`, and `ENG-P1-002`'s transition from `Blocked` to `Ready`. **Not executed by this task**, per its explicit constraint.

## 13. Cross-Reference Updates

- [`docs/README.md`](../../README.md) — banner and navigation entries updated: no longer describe the Master Workflow as `Proposed`; now read `v1.0, Active`; next authorized task named as `ENG-P1-001-CLOSE`.
- [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) — its existing Master Workflow cross-reference paragraph updated with the version/status/next-task refresh; no work-package status field touched.
- [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md) — same narrow refresh; no work-package status field touched.
- [AI Collaboration Workflow](../../06-engineering-governance/ai-collaboration-workflow.md) and [Implementation Prompt Standard](../../06-engineering-governance/implementation-prompt-standard.md) — reviewed; neither previously asserted a Master Workflow version or "Proposed" status, so neither required an update to satisfy this task's specific requirement (their generic references remain accurate as written).
- [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md) — one new append-only entry; no prior entry edited.

## 14. Conflicts Found

None beyond the three defects this task was explicitly convened to correct (§4–§7 above), each already identified by the Founder/Technical Lead review, not newly discovered by this task.

## 15. Conflicts Corrected

All three: the phase-map gate-classification defect (§5), the MW-001/MW-002 reconciliation gap (§6), and the App Check deferral deadline (§7) — plus the three requested wording clarifications (§8). No decision was resolved. No sequencing beyond the task-approved `ENG-P1-001-CLOSE → PHASE-2-GATE` chain was introduced or altered.

## 16. Files Created

- `docs/05-implementation/reports/11thonus-master-workflow-activation-report-2026-07-22.md` (this report).

## 17. Files Modified

- [`docs/05-implementation/11thonus-master-workflow.md`](../11thonus-master-workflow.md) — §1, §6, §8, §10, §13, §14, §15, §17, §19, §20.
- [`docs/README.md`](../../README.md) — narrow banner/navigation refresh (§13).
- [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) — one-paragraph refresh (§13).
- [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md) — one-paragraph refresh (§13).
- [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md) — one new append-only entry.

No application code, test, dependency, `.firebaserc`, Firebase Rules, `firebase.json`, or any other live-infrastructure-adjacent file was touched.

## 18. Diff Summary

`11thonus-master-workflow.md`: §6's table rebuilt (9 columns → richer 3-gate structure, all 17 rows), §8 restructured (governance-progression table + unchanged engineering-sequence table), §1/§19/§20 activation fields, plus three short wording additions (§10, §14, §15) and one update to §17. `docs/README.md`, the Programme, and the Prompt Register: one paragraph/sentence each, narrowly reworded. `IMPLEMENTATION_CHANGES.md`: one new append-only section. Two new files: this report (no other new file).

## 19. Commands Executed

```
grep -n "^#### Phase\|Exit Criteria (TRD22" docs/05-implementation/change-tracking/engineering-implementation-programme.md
grep -n "^#### Phase\|Entry Criteria:" docs/05-implementation/change-tracking/engineering-implementation-programme.md
grep -n "^\*\*DEC-LEGAL-006" -A 2 docs/00-governance/decisions/decision-register.md
grep -n "Master.*Workflow\|11thonus-master-workflow" docs/README.md
grep -n "Master Delivery Workflow\|Master Workflow" docs/05-implementation/change-tracking/engineering-implementation-programme.md
grep -n "Master Delivery Workflow\|Master Workflow" docs/05-implementation/change-tracking/coding-agent-prompt-register.md
grep -n "Master Delivery Workflow\|Master Workflow" docs/06-engineering-governance/ai-collaboration-workflow.md docs/06-engineering-governance/implementation-prompt-standard.md

git branch --show-current
git status --short
git diff --check
git diff --stat
git diff --name-only

pnpm format:check

(full documentation relative-link validation — custom script over docs/**/*.md)
(phase-map structural validation — every row checked for Entry Gate / Decision-Provider-Legal Gate / Exit Gate populated, no decision ID as sole exit criterion)
(MW-sequence consistency check — Master Workflow §8/§17 vs. Programme vs. Prompt Register)
(ENG-P0-001–ENG-P1-003 status consistency check)
(App Check deferral consistency check)
(version/status consistency check across the six cross-referenced documents)
(duplicate-navigation check)
(confirmation no application/test/dependency/Firebase/live-infrastructure file changed)
```

## 20. Dependencies Added

None.

## 21. Configuration Changes

None. No `.firebaserc`, `firebase.json`, `storage.rules`, `firestore.rules`, or any live-infrastructure-adjacent file was touched.

## 22. Validation Results

| Check | Result |
|---|---|
| `git branch --show-current` | `main` |
| `git status --short` | matches expected scope exactly |
| `git diff --check` | clean |
| `pnpm format:check` | clean |
| Documentation relative-link check | zero genuinely broken links (directory targets correctly treated as resolved) |
| Phase-map structural validation | all 17 rows carry Entry Gate, Decision/Provider/Legal Gate, and Exit Gate; zero rows use a decision ID as the sole exit criterion |
| MW-sequence consistency (Master Workflow / Programme / Prompt Register) | consistent — `ENG-P1-001-CLOSE` is the next task in all three |
| `ENG-P0-001`–`ENG-P1-003` status consistency | consistent — no status field changed anywhere |
| App Check deferral consistency | consistent — the corrected trigger appears once, in §13, referenced nowhere else that would need updating |
| Version/status consistency across the six cross-referenced documents | consistent — `docs/README.md`, the Programme, and the Prompt Register all read v1.0/Active; the AI Collaboration Workflow and Implementation Prompt Standard never asserted a version, so remain accurate unchanged |
| Duplicate-navigation check | Master Workflow still referenced exactly twice in `docs/README.md` (banner + document group), both intentional |
| No application/test/dependency/Firebase/live-infrastructure file changed | confirmed via `git status --short` / `git diff --stat` |

## 23. Risks

- The Master Workflow's phase-map now carries more structured detail (three gate columns for 17 phases) — a larger surface to keep synchronized if TRD22 is ever amended; mitigated by every cell citing its exact TRD22 section, making future drift easy to spot.
- This is now the second controlled version of the Master Workflow (0.1 → 1.0) — future changes must go through §14's change-control procedure, including the newly-clarified rule that a coding agent cannot self-approve a change.

## 24. Rollback Instructions

All changes in this task are uncommitted. To revert:

- **Revert** `docs/05-implementation/11thonus-master-workflow.md` to its v0.1 state (undoing §1, §6, §8, §10, §13, §14, §15, §17, §19, §20).
- **Revert** the narrow refreshes in `docs/README.md`, the Engineering Implementation Programme, and the Coding-Agent Prompt Register.
- **Delete** this report.
- **Revert** the single appended entry in `docs/changes/IMPLEMENTATION_CHANGES.md` (remove only this task's section; do not touch any entry above it).

## 25. Approval Actions Required

None further — Founder and Technical Lead approval for the Master Workflow document itself is recorded in §20 (§9 above). No other approval is required by this task.

## 26. Status

Master Workflow: **version 1.0, Active**. Founder approval: recorded. Technical Lead approval: recorded. Phase-map gates correctly classified into three columns. MW reconciliation matches actual completed work. App Check deadline corrected to an evidence-aligned trigger. Current next authorized task: **`ENG-P1-001-CLOSE`**. `ENG-P1-001` remains `Approved`. `ENG-P1-002` remains `Blocked`. `ENG-P1-003` remains `Blocked`. No application code changed. No live infrastructure changed. Nothing committed or pushed.
