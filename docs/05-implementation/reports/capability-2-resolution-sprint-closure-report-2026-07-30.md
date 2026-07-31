> **Title:** Capability 2 Resolution Sprint — Closure Review
> **Version:** 1.0 · **Status:** Assurance review — recommends, does not itself apply, closure
> **Task:** `RES-007` (Capability 2 Resolution Sprint, `ENG-P2-RES-000`)
> **Source-of-truth path:** `docs/05-implementation/reports/capability-2-resolution-sprint-closure-report-2026-07-30.md`
> **Prepared:** 2026-07-30

---

## 1. Executive Summary

This is a read-only assurance review of the Capability 2 Resolution Sprint (`RES-001`–`RES-006A`), performed against **live repository state**, not against the intended end-state of any unmerged pull request. No new engineering decision is created, reopened, or implemented by this review.

**The central finding governs every section below:** of the four planned foundational decisions, only two — `DEC-PROV-004` and `DEC-SEC-001` — are `CONFIRMED` in the live Decision Register on `main`. The other two — `DEC-ID-003` and `DEC-DATA-007` — have each completed the full governed decision lifecycle (prepared, reviewed, corrected, Founder-authorized where required, recorded) but those recordings exist only on open, unmerged pull requests (`#36`, `#37`, `#38`, `#39`), all currently `MERGEABLE`/`CLEAN` with CI green. **Governance process completion and live-repository-state completion are two different facts, and this review keeps them distinct throughout.**

Independent of the four decisions' merge status, this review also found three unrelated, pre-existing blockers to the Resolution Plan's own Capability Authorisation Gate (§7): the `EXT-TECH-001` Burundi OTP evidence remains `PENDING`; `DEC-PROD-012` (optional gender values) remains `OPEN_FOUNDER`; and the `BaseMetadata`/TRD10 §10.5 field-naming conformance gap (`version` vs. `schemaVersion`) that `ENG-P2-000A` identified has never been corrected in code. None of these three items were in scope for `RES-001`–`RES-006A` and none are solved by this review — they are registered in §6 below.

This review also found that downstream tracking artefacts (Master Workflow, Coding-Agent Prompt Register, `CDR-001`) still describe **all four** decisions — including the two already `CONFIRMED` for several weeks — as open, a staleness gap materially broader than anything this Resolution Sprint itself created.

**Closure recommendation: Ready with Conditions** — see §8 for the exact, evidence-based conditions.

## 2. Closure Strategy

*(Required "Before Making Changes" statement, reproduced here for the permanent record.)*

This review evaluates live `main` state as the source of truth, cross-referencing unmerged-PR content only to establish what governance work has been completed and reviewed, never as a substitute for confirmed repository state. It distinguishes: (a) decisions whose full lifecycle is complete and merged; (b) decisions whose full lifecycle is complete but not yet merged; (c) items the Resolution Sprint never addressed because they were out of its planned scope; (d) pre-existing tracker staleness this Sprint did not create. No decision is reopened, no new governance is invented, and no downstream tracker is edited by this review — all synchronization needs are registered as outstanding, per this task's own constraints.

## 3. Resolution Closure Report

**Objectives achieved:**
- All four planned foundational decisions (`DEC-PROV-004`, `DEC-SEC-001`, `DEC-ID-003`, `DEC-DATA-007`) have completed the full governed decision lifecycle: engineering evidence gathered, options evaluated, engineering recommendation prepared, Founder or Engineering Lead decision obtained, and the decision recorded in the Decision Register with verbatim `Final decision` text.
- Two of the four (`DEC-PROV-004`, `DEC-SEC-001`) are live-`CONFIRMED` and have been for several weeks (`RES-002B`/`RES-003B`, merged via PR #31/#33).
- The remaining two (`DEC-ID-003`, `DEC-DATA-007`) have completed recording and passed CI-green, review-resolved PRs, awaiting merge authorization only.
- A genuine documentation-audit finding (`DOC-P1-007`, PRD1/PRD10 role-inheritance conflict) was independently re-verified and resolved through `DEC-ID-003`'s confirmation.
- A pre-existing decision-preparation asset (`loyalty-code-decision-brief.md`, dated 2026-07-17) was discovered, evaluated, and formally adopted into `DEC-DATA-007`'s decision package rather than being duplicated or ignored — a `RES-006` pre-merge correction caught and fixed the initial oversight of this document.

**Decisions resolved (governance-process sense — see §4 for live-state distinction):**
`DEC-PROV-004` (Approved with Conditions, Firebase-native OTP + Google Sign-In), `DEC-SEC-001` (Authentication Recovery Order + Identity Recovery Principles), `DEC-ID-003` (Permission inheritance model + Identity and Accountability Principle), `DEC-DATA-007` (loyalty-code format + QR reference scheme + collision/idempotency behaviour).

**Major governance outcomes:**
- Established and repeatedly applied a "prepare, then record" two-step discipline across all four decisions, each pair split into its own Founder-authorized task and its own PR, never self-recorded within the same task that performed the analysis.
- Corrected multiple genuine technical/governance errors caught by automated pre-merge review before any decision was recorded — most materially, a Firebase account-linking technical error in `DEC-SEC-001`'s original draft (§5, RES-003) and a false "unblocks `ENG-P2-004`" claim in `DEC-DATA-007`'s recording (RES-006A) that would have implied `DEC-ID-003` was also closed when it was not.
- Established that `DEC-DATA-007`, despite superficially reading as a "foundational decision" of comparable weight to the other three, is in fact an Engineering-Lead-owned, zero-Founder-input decision — a scope-framing discrepancy identified and disclosed (`RES-005`) rather than silently resolved in either direction.

**Key engineering conclusions:**
- No permission-resolution, authentication, or identifier-generation implementation code exists anywhere in the repository — every decision in this Sprint was a pure design/governance decision, not a code migration.
- Three implementation prerequisites remain explicitly undesigned and disclosed, not solved: the Sensitive Permission Catalogue, the Override-Resolution Rule, and Permission Evaluation and Audit Design (all `DEC-ID-003`); two more remain for `DEC-DATA-007` (checksum-algorithm selection, generation-service invocation point).
- The `BaseMetadata`/TRD10 §10.5 conformance gap `ENG-P2-000A` identified before this Sprint began remains unresolved in code — `functions/src/shared/metadata/baseMetadata.ts` still uses `version`, TRD10 still specifies `schemaVersion`.

## 4. Decision Verification Matrix

| Decision | Planned | Completed (governance) | Recorded | Live `main` status | Downstream trackers synced | Implementation status | Outstanding prerequisites |
|---|---|---|---|---|---|---|---|
| `DEC-PROV-004` | Yes (`RES-002`) | Yes | Yes — `CONFIRMED`, PR #31 merged 2026-07-30 | `CONFIRMED` | **No** — Master Workflow, Prompt Register, `CDR-001` still show `OPEN_PROVIDER`/open | Not started (no code exists) | `EXT-TECH-001` Burundi OTP delivery proof remains `PENDING` — a launch-readiness condition per the decision's own Principle 8/9, not a governance blocker |
| `DEC-SEC-001` | Yes (`RES-003`) | Yes | Yes — `CONFIRMED`, PR #33 merged 2026-07-30 | `CONFIRMED` | **No** — same trackers still show `OPEN_ENGINEERING`/open | Not started | The identity-resolution flow for "customer's first OTP attempt fails" (`RES-003` §9) remains undesigned |
| `DEC-ID-003` | Yes (`RES-004`) | Yes | Yes — content complete, PR #36 open, `MERGEABLE`/`CLEAN`, CI green, 0 unresolved threads | **`OPEN_FOUNDER`** (unmerged) | No (and cannot be, until merged) | Not started | Sensitive Permission Catalogue; Override-Resolution Rule; Permission Evaluation and Audit Design; cross-business role-context isolation |
| `DEC-DATA-007` | Yes (`RES-005`/`RES-006`/`RES-006A`) | Yes | Yes — content complete, PR #39 open, `MERGEABLE`/`CLEAN`, CI green, 0 unresolved threads (PRs #37, #38 also open/clean, both prerequisites to #39's own cited evidence) | **`OPEN_ENGINEERING`** (unmerged) | No (and cannot be, until merged) | Not started | Checksum-algorithm selection (if `-X` variant pursued); generation-service ownership/invocation point |

**Reading this matrix:** every "Recorded" cell is `Yes` — meaning the governance work itself is done for all four decisions. Only the "Live `main` status" column diverges: two `CONFIRMED`, two still showing their pre-Sprint open status because their recording PRs have not been merged. This distinction is the single most important fact in this review.

## 5. Repository Consistency Review

**No contradictory governance found within confirmed decisions.** `DEC-PROV-004` and `DEC-SEC-001`'s recorded principles are mutually consistent (re-verified directly); `DEC-ID-003`'s Identity and Accountability Principle explicitly states it does not alter either; `DEC-DATA-007`'s recorded principles explicitly respect all three others' constraints (issuance-timing precondition, recovery-permanence constraint) without redeciding them.

**Stale live tracking artefacts found — extensive, and largely pre-existing this Sprint:**
1. **Master Workflow** (`docs/05-implementation/11thonus-master-workflow.md`, lines 101, 149, 253, 257, 270–273): every reference to Phase 2's decision dependencies still lists all four decisions as open — including `DEC-PROV-004` and `DEC-SEC-001`, which have been `CONFIRMED` on `main` since PR #31/#33 merged. This staleness **predates and is broader than** this Resolution Sprint's own unmerged-PR gap; it was not corrected by `ENG-P2-RES-ADMIN-003` (which touched Master Workflow for other reasons but not these specific lines) or by any task since.
2. **Coding-Agent Prompt Register** (`docs/05-implementation/change-tracking/coding-agent-prompt-register.md`, lines 51, 54): `ENG-P2-001`/`ENG-P2-004` rows still list all four decisions as blocking, same staleness pattern.
3. **`CDR-001`** (`docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md`, line 118): Capability 2's Dependencies line states all four decisions are "currently open," same staleness pattern.
4. **Engineering Implementation Programme**: Phase 2's Decision Dependencies/Blocking Reason cells (previously disclosed by `RES-004A`/`RES-005`/`RES-006A`) still show pre-Sprint statuses for `DEC-ID-003`/`DEC-DATA-007`, correctly still show `DEC-SEC-001`/`DEC-PROV-004` as resolved-elsewhere in some cells but not consistently.
5. **Requirements Traceability Matrix**: `AP-008`'s row (linked to `DEC-ID-003`) still reads "Affected by open decision(s) `DEC-ID-003` — do not implement," correctly reflecting live `main` state (since `DEC-ID-003` is genuinely still open there) but will become stale the moment PR #36 merges without a follow-up sync. `DEC-DATA-007` has no RTM row at all (a traceability gap distinct from mere staleness, disclosed by `RES-005`).

**Naming/traceability inconsistency found (documentation-audit finding, not corrected):** the Resolution Plan's own §3 Work Package definitions label `RES-005` as "Repository Synchronisation," `RES-006` as the `DEC-PROD-012` Founder decision, and `RES-007` as the `DEC-DATA-007` resolution. The live session's actual Founder-issued task briefs used `RES-005` for "`DEC-DATA-007` Dependency & Scope Analysis" and `RES-006`/`RES-006A` for `DEC-DATA-007`'s decision package and recording — none of which match the Plan's own internal numbering, and `DEC-PROD-012` (the Plan's actual `RES-006`) was never addressed by this Sprint at all. This is disclosed as a documentation-traceability finding; correcting the Resolution Plan's own numbering, or renaming the already-created evidence files, is outside this review's "do not modify unrelated files" / "do not reopen resolved decisions" constraints and is registered as a follow-on in §6.

**Frozen historical artefacts:** confirmed unchanged — `engineering-transition-d1-agenda.md`, the Phase 3B/Batch A closure reports, and all pre-Sprint audit reports were not touched by this review or by any `RES-00x` task, consistent with their frozen/historical classification.

**All confirmed decisions consistently represented within the Decision Register itself:** `DEC-PROV-004`/`DEC-SEC-001`'s `CONFIRMED` entries, and `DEC-ID-003`/`DEC-DATA-007`'s pending recordings (verified via `git show` against their respective branches), are each internally self-consistent — `Options identified`/`Recommended direction` preserved as historical engineering framing in every case, `Final decision` fields carrying verbatim Founder/Engineering-Lead text, no field silently overwritten.

**Register Summary internal consistency (live `main`):** `CONFIRMED` 40, `OPEN_FOUNDER` 24, `OPEN_ENGINEERING` 14, total 103 — self-consistent as currently printed. This total does **not** yet reflect `DEC-ID-003`'s or `DEC-DATA-007`'s pending `CONFIRMED` transitions, since those recordings are unmerged; each pending PR (`#36`, `#39`) independently recomputes the table correctly relative to its own branch point, and will reconcile once merged in sequence.

## 6. Implementation Readiness Assessment

**Governance Complete:**
- `DEC-PROV-004` and `DEC-SEC-001`: fully complete — recorded, merged, live.
- `DEC-ID-003` and `DEC-DATA-007`: governance-process complete (analysis, recommendation, decision obtained, recorded, reviewed, CI-green) but **not yet live** — merge authorization is the only remaining governance action, not further analysis or decision-making.

**Engineering Ready:**
- None of Capability 2's four work packages (`ENG-P2-001`–`ENG-P2-004`) have begun implementation. "Ready" here means the *governance precondition* is satisfiable, not that engineering has started.
- Once `DEC-ID-003`/`DEC-DATA-007` merge, `ENG-P2-004` (role/permission resolution) and the `DEC-DATA-007` component of `ENG-P2-001` (customer identity) would have their respective decision-dependency gates satisfied.

**Engineering Prerequisites Remaining (see §7 for the full register):**
- `DEC-ID-003`: Sensitive Permission Catalogue, Override-Resolution Rule, Permission Evaluation and Audit Design, cross-business role-context isolation.
- `DEC-DATA-007`: checksum-algorithm selection (conditional), generation-service invocation point.
- `DEC-SEC-001`: the "first OTP attempt fails" identity-resolution flow.
- Cross-cutting, pre-existing: `BaseMetadata`/TRD10 `schemaVersion` conformance (blocks *any* Phase 2 document persistence, per `ENG-P2-000A`'s original finding — this is the single most consequential unresolved item for actually starting implementation, independent of any decision in this Sprint).

**Deferred Items:**
- `EXT-TECH-001` (Burundi OTP delivery evidence) — `PENDING`, a production-readiness condition per `DEC-PROV-004`'s own recorded Principle 8/9, not a Phase 2 *governance* blocker but a real blocker to production activation.
- `DEC-PROD-012` (optional gender values) — `OPEN_FOUNDER`, gates the Capability Authorisation Gate item 6 but was never in this Resolution Sprint's planned scope (it is the Resolution Plan's own actual `RES-006`, never actioned under that or any other label in this session).
- Downstream tracker synchronization (§5) — registered, not performed, consistent with every prior `RES-00x` task's own disclosed scope boundary.

## 7. Outstanding Prerequisites Register

Consolidated from every `RES-00x` artefact's own disclosures — none solved here, only registered, per this task's explicit instruction.

| # | Prerequisite | Inherited from | Status | Blocks |
|---|---|---|---|---|
| 1 | Identity-resolution flow for first-OTP-failure customers | `DEC-SEC-001` (`RES-003` §9) | Undesigned | Full `DEC-SEC-001` implementation |
| 2 | Sensitive Permission Catalogue | `DEC-ID-003` | Undesigned | `ENG-P2-004` permission resolver |
| 3 | Override-Resolution Rule | `DEC-ID-003` | Undesigned | `ENG-P2-004` permission resolver |
| 4 | Permission Evaluation and Audit Design | `DEC-ID-003` | Undesigned | `ENG-P2-004` permission resolver |
| 5 | Cross-business role-context isolation guarantee | `DEC-ID-003` (`RES-004` §8 item 3) | Undesigned | `ENG-P2-004` multi-business role safety |
| 6 | Checksum-algorithm selection (conditional on `-X` adoption) | `DEC-DATA-007` | Deferred, not yet needed | Only the checksum variant, not baseline `ABC-234` |
| 7 | Generation-service ownership/invocation point | `DEC-DATA-007` | Undesigned | `ENG-P2-001` loyalty-code issuance |
| 8 | `BaseMetadata`/TRD10 §10.5 `schemaVersion` conformance | Pre-Sprint (`ENG-P2-000A`), Resolution Plan `RES-005.2a`/`RES-005.2b` (never executed under any label) | Undesigned/uncorrected | Any Phase 2 work package persisting a document at all |
| 9 | `EXT-TECH-001` Burundi OTP delivery evidence | Pre-Sprint (`ENG-P2-000B`) | `PENDING` | Production activation of `DEC-PROV-004`/`DEC-SEC-001`, not their governance confirmation |
| 10 | `DEC-PROD-012` gender values and wording | Pre-Sprint, Resolution Plan's own actual `RES-006` (never actioned) | `OPEN_FOUNDER` | Profile schema freeze; Capability Authorisation Gate item 6 |
| 11 | Downstream tracker synchronization (Master Workflow, Prompt Register, `CDR-001`, RTM) for all four decisions | Every `RES-00x` recording task in this Sprint, each disclosing rather than performing | Deferred | No implementation blocker directly, but governance-record accuracy for any future reader |

## 8. Resolution Sprint Lessons Learned

**Governance improvements:**
- The "prepare, then record" two-step discipline (separate task, separate PR, separate Founder authorization for analysis vs. decision) worked well and caught genuine errors at each stage — it should be retained as the default pattern for future Founder-level decisions.
- The Resolution Plan's own internal work-package numbering (`RES-005`/`RES-006`/`RES-007`) was not actually followed by the live session's task issuance, creating a traceability gap between the planning document and what was actually executed. Future resolution sprints should either update the Plan's own numbering to match live task issuance, or have live tasks explicitly reference the Plan's numbering when they diverge.

**Engineering improvements:**
- Multiple genuine technical/architectural findings (Firebase account-linking semantics, idempotency-invariant wording, a pre-existing decision-preparation document missed on first pass) were caught only by automated pre-merge review, not by the original analysis. This is working as intended but suggests initial research passes should more systematically enumerate existing files in a target directory (`ls`/directory listing) before concluding "no proposal exists," rather than relying solely on Register-field text.

**Repository improvements:**
- The persistent gap between live Decision Register state and downstream trackers (Master Workflow, Prompt Register, `CDR-001`) — now shown to be older and broader than this Sprint itself — suggests these trackers should either be regenerated from the Register programmatically, or a dedicated, recurring "tracker sync" task should run after every batch of decision recordings rather than being repeatedly deferred as follow-on.
- `BaseMetadata`/TRD10 conformance (`ENG-P2-000A`'s finding) has now been an open, disclosed blocker across at least four separate reviews (`ENG-P2-000A`, the Resolution Plan itself, and now this closure review) without being scheduled as an owned, executed work package — `RES-005.2a`/`RES-005.2b` exist as *defined* packages in the Resolution Plan but were never *actioned* under any label in this session.

**Recommended Founder Engineering Framework enhancements:**
- Consider requiring that a decision-recording task's own PR only be opened after its immediate prerequisite decision's PR has merged (or requiring the recording to explicitly state a "pending-merge" caveat, as `RES-006A` was corrected to do) — this Sprint's unmerged-PR chain (`#36`→`#37`→`#38`→`#39`) made every subsequent task's evidence citations provisional in a way that added review friction.
- Consider a lightweight "gate check" step before any closure-review task: a single command or script that reports live Register status for every decision named in a Resolution Plan, rather than requiring an agent to manually re-derive this from `grep`.

## 9. Closure Recommendation

**Ready with Conditions.**

**Supporting evidence:** all four decisions have completed their full governed decision lifecycle with no outstanding analysis or decision-making work remaining — the only action needed to reach full live-state closure is merging four already-clean, CI-green, review-resolved PRs (`#36`, `#37`, `#38`, `#39`) in their natural dependency order (`#37`→`#38`→`#39` for `DEC-DATA-007`'s own chain; `#36` independently). No contradictory governance exists within what has been confirmed. No new Founder or engineering decision is required to reach closure — only merge authorization, which this review does not itself grant.

**Conditions for full closure, in order:**
1. Merge PR #36 (`RES-004A`), #37 (`RES-005`), #38 (`RES-006`), #39 (`RES-006A`) — each individually re-verified clean/mergeable/CI-green/0-unresolved-threads as of this review.
2. A dedicated downstream-synchronization task (not this review) to update Master Workflow, Coding-Agent Prompt Register, `CDR-001`, RTM, and the Engineering Implementation Programme to reflect all four decisions' `CONFIRMED` status — this gap is now broader than the current Sprint and should be addressed as its own task, consistent with the `ENG-P2-RES-ADMIN-003` precedent.
3. Independent of the above: `EXT-TECH-001` (Burundi OTP evidence), `DEC-PROD-012` (gender values), and the `BaseMetadata`/`schemaVersion` conformance correction remain separate, pre-existing blockers to the Capability Authorisation Gate's full satisfaction (§7 of the Resolution Plan) and to actual implementation start — none are Resolution Sprint governance items, and none are resolved by this review.

**Capability 2 is not yet ready for engineering implementation to begin** — not because any decision remains unresolved in substance, but because (a) two of the four decisions are not yet live on `main`, and (b) three unrelated, pre-existing prerequisites (external evidence, a separate Founder decision, and a code-conformance fix) remain open regardless of decision status.

## 10. Files Created or Modified

**Created:** `docs/05-implementation/reports/capability-2-resolution-sprint-closure-report-2026-07-30.md` (this document). **Modified:** `docs/changes/IMPLEMENTATION_CHANGES.md` (append). **Not modified:** the Decision Register; any `DEC-*` entry or decision package; Master Workflow; the Engineering Implementation Programme; the Coding-Agent Prompt Register; `CDR-001`; the Requirements Traceability Matrix; the Resolution Plan; any application code; any other document.

## 11. Commands Executed

Live re-read of the Decision Register's `DEC-PROV-004`/`DEC-SEC-001`/`DEC-ID-003`/`DEC-DATA-007` entries on `main`; `git show` of `DEC-ID-003`'s corrected entry from the unmerged `docs/res-004a-dec-id-003-decision-recording` branch; full re-read of the Resolution Plan (`ENG-P2-RES-000-capability-2-resolution-plan.md`), including §3 Work Packages, §4 Ownership Matrix, §7 Capability Authorisation Gate; `gh pr view` on PRs #32, #36, #37, #38, #39 for live mergeability/CI/review-thread state; `grep -n` searches across Master Workflow, the Coding-Agent Prompt Register, `CDR-001`, the Requirements Traceability Matrix, and the External Dependencies Register for all four decision IDs; direct read of `functions/src/shared/metadata/baseMetadata.ts` and TRD10 §10.5 to re-verify the `schemaVersion`/`version` conformance gap; `git fetch`/`checkout main`/`pull --ff-only` before branching to confirm a clean, synced starting point.

## 12. Dependencies Added

None.

## 13. Configuration Changes

None.

## 14. Risks

None introduced — this is a read-only assurance review; no governance document, decision, tracker, or code was changed. The disclosed tracker staleness, the unmerged-PR gap, and the three unrelated pre-existing blockers are pre-existing conditions made explicit by this review, not created by it. The primary risk this review itself flags is a *false sense of readiness* if the "Recorded: Yes" status of `DEC-ID-003`/`DEC-DATA-007` were mistaken for live closure — this report exists specifically to prevent that misreading.

## 15. Rollback Instructions

`git revert` of this task's own commit — a single new closure-report document plus one changes-log append.

## 16. Markdown Capability 2 Resolution Closure Report

This document: [`docs/05-implementation/reports/capability-2-resolution-sprint-closure-report-2026-07-30.md`](capability-2-resolution-sprint-closure-report-2026-07-30.md).

## 17. Changes Log

Updated: [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md).
