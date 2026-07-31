> **Title:** Phase 1 Exit-Criteria Determination and Capability 2 Entry Mobilisation Report
> **Version:** 1.0 · **Status:** Assurance and mobilisation determination — not an implementation record
> **Task:** `ENG-P1-EXIT-001` (Phase 1 Exit-Criteria Determination and Capability 2 Entry Mobilisation)
> **Source-of-truth path:** `docs/05-implementation/reports/ENG-P1-EXIT-001-phase-1-exit-determination-and-mobilisation-report-2026-07-31.md`
> **Prepared:** 2026-07-31

---

## 1. Executive Summary

This task merged `PR #41` (Capability 2 closure finalisation), verified the resulting consolidated `main` state, and then conducted a bounded, evidence-based determination of whether Phase 1 (`TRD22 §22.11`) has satisfied its governing exit criteria — a determination the Programme's own Phase 1 row explicitly flagged as outstanding ("a separate determination not made by this administrative-closure action").

**Finding: all four of TRD22 §22.11's exit criteria are satisfied by direct, live repository evidence.** No code was modified to reach this finding — it is a read against pre-existing test suites, pre-existing Rules files, and the CI run this task itself triggered by merging `PR #41`. **Recommendation: Phase 1 Exit Approved.**

This does **not** mean Capability 2 (`ENG-P2-001`) may begin. The Resolution Plan's own eight-item Capability Authorisation Gate (§7) is the actual governing gate for `ENG-P2-001`, and three of its items remain open, entirely independent of Phase 1's own exit criteria: `EXT-TECH-001` (`PENDING`), `DEC-PROD-012` (`OPEN_FOUNDER`), and `BaseMetadata`/TRD10 §10.5 conformance (uncorrected in code). This task does not resolve, and is not authorized to resolve, any of the three. §8 below classifies each precisely and §9 sequences the controlled path to closing them.

## 2. Starting Repository State

- Branch: `main`, at `9a3eeeb` (after this task's own Stage A merge — see §3).
- Prior state (before this task began): `main` at `348df06` (`PR #40` merged), `PR #41` open, `CLEAN`/`MERGEABLE`, CI-green.
- Capability 2 status: `Ready with Conditions` (per the [Capability 2 Resolution Sprint Closure Record](capability-2-resolution-sprint-closure-record-2026-07-31.md)).

## 3. Stage A — PR #41 Merge Confirmation

- Re-verified `PR #41`: `state: OPEN`, `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`, CI `Build, Lint, Test, Emulator Validation` — `pass` (run `30612222712`).
- Merged via `gh pr merge 41 --merge`. **Merge commit SHA: `9a3eeebb637dc19eb39a92d49db2efaca0e1ae95`.**
- Local `main` synchronized: `git fetch && git checkout main && git pull origin main --ff-only` — fast-forwarded `348df06..9a3eeeb`.
- Verified: `git rev-list --left-right --count origin/main...main` = `0 0`; `git status --short` empty; no `MERGE_HEAD`/`rebase-merge`/`rebase-apply` present.
- Post-merge CI on `main`'s exact resulting commit: green (run `30612587845`, all 20 steps passed, no flake).
- Capability 2 Resolution Sprint Closure Record confirmed present at `docs/05-implementation/reports/capability-2-resolution-sprint-closure-record-2026-07-31.md`, confirmed still stating `Ready with Conditions`.

**Stage A passed completely.** Proceeding to Stage B.

## 4. Ending Repository State (as of this report)

`main` at `9a3eeeb` prior to this task's own Stage-B/D commit; this report and its accompanying tracker corrections are committed on a dedicated branch (see §12) and not self-merged, per the task's own constraint.

## 5. Phase 1 Governing Exit Criteria

**What formally governs Phase 1 exit:** `TRD22 §22.11 ("Phase 1 - Firebase and Shared Platform Foundation")`, specifically its own **Exit Criteria** sub-section — four bullets, distinct from and narrower than the same section's 19-item **Deliverables** list. This narrow/broad distinction is TRD22's own structure, applied consistently to every phase (Phase 0's exit, for example, was determined against its own 5-bullet Exit Criteria, not its Deliverables). This determination applies the same standard: **the four Exit Criteria bullets are the governing gate; the Deliverables list is scope context, not itself a phase-exit blocker**, consistent with the task's own instruction not to convert implementation prerequisites into governance blockers unless the governing source requires it — TRD22 does not require full Deliverables-list completion as an Exit Criterion.

TRD22 §22.11's four Exit Criteria, verbatim:
1. "shared server command can authenticate, validate, log and return a standard response";
2. "outbox event can be written and processed idempotently";
3. "unauthorized direct writes are denied";
4. "emulator tests pass."

**What evidence is required for each:** direct code/test inspection showing the described behavior exists and is exercised by a passing test (criteria 1, 2), direct inspection of the live Security/Storage Rules files (criterion 3), and a passing CI/emulator run (criterion 4).

**Governing authority classification:** all four criteria are objective, technical, binary facts — not product or commercial judgment calls, and TRD22 names no separate approval authority for phase-exit determination distinct from the criteria themselves being met. Consistent with this repository's own precedent (Phase 0's exit, and `ENG-P1-003`'s "Founder-authorized administrative closure" pattern), this determination is **administrative/evidentiary** in nature — it is being made under this task's own explicit Founder authorization to "conduct a bounded Phase 1 exit-criteria determination," not as a new, separate Founder policy decision requiring its own disposition. No Founder disposition is invented or recorded beyond the explicit authorization this task itself already carries.

## 6. Phase 1 Exit-Criteria Matrix

| # | Criterion | Governing Source | Requirement | Required Evidence | Current Evidence | Status | Blocking Effect | Responsible Authority | Required Follow-up |
|---|---|---|---|---|---|---|---|---|---|
| C1 | Shared command: authenticate, validate, log, respond | TRD22 §22.11 Exit Criteria | A shared server command primitive must authenticate the actor, validate the request, log the outcome, and return a standard (non-ad-hoc) response shape | Passing unit tests exercising each of the four behaviors against the `dispatchCommand` orchestrator | `functions/src/shared/commands/commandDispatcher.test.ts`: `"authenticates the actor from trusted context, never from the client-supplied envelope"` (L64); `"rejects a malformed envelope with VALIDATION_FAILED..."` (L43); `"logs an OperationalLog entry for every dispatch outcome"` (L261); `PlatformErrorResponse`/success-response translation on every branch (L106–L261). CI `Unit / component tests` step: pass (run `30612587845`) | **Satisfied** | None | Administrative (evidentiary) | None |
| C2 | Outbox: written and processed idempotently | TRD22 §22.11 Exit Criteria | An outbox event can be durably written and, when processed, is not re-applied on retry/replay/concurrent-worker contention | Passing unit and real-emulator tests covering write, single processing, and concurrent-worker safety | `outboxWriter.test.ts`, `outboxProcessor.test.ts`: write/pending-transition coverage. `outboxProcessor.emulator.test.ts`: `"never reprocesses a completed entry (event replay safety)"` (L112); `"two workers racing to claim the same pending entry: exactly one obtains ownership"` (L137, `ENG-P1-002-CR1` atomic-claim correction); `"end to end: two concurrent processOutboxEntries runs never both invoke the handler for the same entry"` (L246). CI `Firebase Emulator Suite validation` step: pass | **Satisfied** | None | Administrative (evidentiary) | None |
| C3 | Unauthorized direct writes denied | TRD22 §22.11 Exit Criteria | Direct (non-server) writes to Firestore/Storage must be rejected | Live `firestore.rules`/`storage.rules` content | Direct read (2026-07-31): both files read `allow read, write: if false;` for all documents/paths — a blanket deny, established Phase 0 (`ENG-P0-001`, commit `3a50710`), confirmed unmodified/unregressed through `ENG-P1-003`'s own closure audit | **Satisfied** | None for the literal criterion text. **Distinct, disclosed gap (not blocking):** no automated Rules test exists validating this behavior against the emulator (`find . -iname "*rules*.test.*"` — zero matches); the current posture is a deliberate blanket-deny placeholder, not domain-specific (per-collection/per-role) authorization — already registered as `ENG-SEC-001`, outside this task's scope to solve | Administrative (evidentiary) | `ENG-SEC-001` (already registered, unchanged by this task) |
| C4 | Emulator tests pass | TRD22 §22.11 Exit Criteria | The Firebase Emulator Suite validation step of the standard CI pipeline passes | A green CI run on the current `main` HEAD | GitHub Actions run `30612587845` on `main`, commit `9a3eeeb`: `Firebase Emulator Suite validation` — pass; all 20 pipeline steps pass; no flake this run | **Satisfied** | None | Administrative (evidentiary) | None |

**Deliverables-list note (not a formal exit criterion, disclosed for completeness):** TRD22 §22.11's 19-item Deliverables list includes several items with no corresponding implementation found in this task's search: a genuine **production** Firebase project (`.firebaserc` contains only `dev`/`staging` aliases — no production project was ever provisioned, confirmed by direct read and by `ENG-P1-001`'s own closure report §5); a **feature-flag abstraction** (no matches anywhere in `functions/src`/`apps/web/src`); a **Rules Service interface** and a **Knowledge Service interface** (referenced only in planning documents — TRD11, TRD20, the `ENG-P1-002` blueprint, the RTM — never in source code). App Check **is** implemented (`apps/web/src/infrastructure/firebase/appCheck.ts`), so it is not part of this gap. None of these four items are named in TRD22 §22.11's own Exit Criteria text, and per §5's governing-standard analysis above, their absence does **not** block Phase 1 exit. They are correctly classified as either deferred Deliverables-list scope or genuine Phase-2+ implementation prerequisites — not as unresolved governance decisions, and not converted into an exit blocker by this determination.

## 7. Phase 1 Exit Recommendation

**Phase 1 Exit Approved.**

All four of TRD22 §22.11's governing Exit Criteria are satisfied by direct, current, live-repository evidence — no criterion is Unsatisfied, no criterion lacks sufficient evidence, and no criterion required inferring completion from a task name or a historical status label. This recommendation is evidence-based per §6 above, and is recorded here as an administrative/evidentiary determination under this task's own explicit Founder authorization — no new Founder disposition is invented or recorded, and none is required, since none of the four criteria presented an unresolved judgment call.

The Deliverables-list gaps disclosed in §6 (production project, feature-flag abstraction, Rules Service interface, Knowledge Service interface) do not alter this recommendation; they are registered in §10 as classified follow-on items, not as conditions on this approval.

## 8. Capability 2 Entry Blocker Register

| Blocker | Category | Owner | Status | Dependency | Blocking Effect | Required Next Action |
|---|---|---|---|---|---|---|
| `EXT-TECH-001` — Firebase phone-OTP delivery to Burundi numbers (reliability, cost, abuse controls, test-number strategy) | External evidence dependency | Engineering Lead (evidence-gathering); provider is Firebase/Google + local carriers | `PENDING` (External Dependencies Register) | `DEC-SEC-001`, `DEC-PROV-004` (both `CONFIRMED`); customer registration | Blocks **Capability Authorisation Gate item 1** (Phase 2 `ENG-P2-001` entry) and, per `DEC-PROV-004`'s own Principle 8/9, production activation. Does **not** block Phase 1 exit — its own "Required by phase" field is `Phase 2`. Can proceed independently — no dependency on any other open item | Evidence-gathering task (test-number OTP delivery trial across Burundi carriers) — not performed by this task |
| `DEC-PROD-012` — Optional gender values and wording | Unresolved governance decision | Founder + legal adviser (`Founder decision required: Yes, with legal input`) | `OPEN_FOUNDER`; no decision package exists yet (`Final decision: —`) | `EXT-LEG-001` | Blocks **Capability Authorisation Gate item 6** (Phase 2 `ENG-P2-001` entry, since `ENG-P2-001`'s scope includes "profile") and profile schema freeze. Does **not** block Phase 1 exit — its own "Required by phase" field is `Phase 2`. Cannot proceed fully independently of `EXT-LEG-001` (legal input on cultural/legal appropriateness for Burundi) | A `DEC-PROD-012` decision-package preparation task (evidence/options only) followed by a separate Founder decision-recording task — neither performed by this task |
| `BaseMetadata`/TRD10 §10.5 conformance | Documentation conformance + code conformance (two distinct corrections) | Engineering Lead | Uncorrected — confirmed by direct comparison (§9 below) | Sequential: documentation correction (`RES-005.2a`) must complete before code correction (`RES-005.2b`) | Blocks **Capability Authorisation Gate item 7** and, per the Resolution Plan's own `ENG-P2-000` §13 finding, "any Phase 2 work package from persisting a document at all." Does **not** block Phase 1 exit (Phase 1 itself never persists a document via `BaseMetadata` in a way this conflict affects; the conflict was disclosed, not created, during `ENG-P1-002`) | `RES-005.2a` (Blueprint §3.3 text correction) then `RES-005.2b` (code correction) — neither performed by this task |
| Phase 1 exit-criteria determination | Formerly an open administrative item | Engineering (evidentiary) | **Now closed by this report** — see §7 | None | Formerly blocked Phase 2 entry alongside the Capability Authorisation Gate; **no longer a blocker** | None — closed |

## 9. Classification of the BaseMetadata Correction Sequence

Direct comparison performed (2026-07-31):

- **Version 1 Engineering Blueprint §3.3** ("Standard Document Metadata"): lists the shared metadata field as `version`.
- **TRD10 §10.5**: every collection schema in the chapter lists the field as `schemaVersion` (10 occurrences checked).
- **Current source code** (`functions/src/shared/metadata/baseMetadata.ts`): `BaseMetadata` type declares `version: number`, matching the Blueprint, conflicting with TRD10.

**Confirmed: the correct sequence remains (1) documentation correction, then (2) code correction** — i.e. `RES-005.2a` (correct the Blueprint's §3.3 text to align with TRD10's `schemaVersion`, since TRD10 is the authoritative Technical Requirements source the Blueprint itself is meant to translate, per the Resolution Plan's own §8 risk disclosure: "if the code correction is attempted before the Blueprint §3.3 text itself is corrected, the implementer would be conforming to an as-yet-uncorrected document, risking the same class of drift `ENG-P2-000A` originally found") followed by `RES-005.2b` (correct `baseMetadata.ts` to `schemaVersion`, and any dependent call sites). Neither correction is performed by this task.

## 10. Classification of the 11 Outstanding Resolution Sprint Prerequisites

Restated from the [Closure Record](capability-2-resolution-sprint-closure-record-2026-07-31.md) §7, each now classified against Phase 2 entry vs. specific work packages vs. deferrable vs. informational:

| # | Prerequisite | Classification |
|---|---|---|
| 1 | Identity-resolution flow for first-OTP-failure customers (`DEC-SEC-001`) | Required before the specific `ENG-P2-001` sub-flow it affects (OTP-failure handling), not before `ENG-P2-001` entry as a whole; deferrable until that sub-flow's implementation |
| 2 | Sensitive Permission Catalogue (`DEC-ID-003`) | Required before `ENG-P2-004` (permission resolver) implementation; not required for `ENG-P2-001`–`003` or for Phase 2 entry itself |
| 3 | Override-Resolution Rule (`DEC-ID-003`) | Same as #2 — required before `ENG-P2-004`, not before Phase 2 entry |
| 4 | Permission Evaluation and Audit Design (`DEC-ID-003`) | Same as #2 — required before `ENG-P2-004`, not before Phase 2 entry |
| 5 | Cross-business role-context isolation guarantee (`DEC-ID-003`) | Same as #2 — required before `ENG-P2-004`, not before Phase 2 entry |
| 6 | Checksum-algorithm selection, conditional on `-X` adoption (`DEC-DATA-007`) | Deferrable indefinitely — only required if the `-X` checksum variant is ever adopted; the confirmed baseline (`ABC-234`, no checksum) needs it not at all |
| 7 | Generation-service ownership/invocation point (`DEC-DATA-007`) | Required before `ENG-P2-001`'s loyalty-code-issuance sub-component specifically; not before Phase 2 entry as a whole |
| 8 | `BaseMetadata`/TRD10 §10.5 conformance | Required before **any** Phase 2 work package persists a document — the broadest-blocking item on this list; see §8/§9 above |
| 9 | `EXT-TECH-001` Burundi OTP evidence | Required before Phase 2 entry (Capability Authorisation Gate item 1) and before production activation; see §8 |
| 10 | `DEC-PROD-012` gender values | Required before Phase 2 entry (Capability Authorisation Gate item 6) and before profile schema freeze; see §8 |
| 11 | Downstream tracker synchronization | Informational only — closed for the named trackers by `RES-007B` (2026-07-31); no implementation blocker |

## 11. Remaining-Work Sequencing Plan

| Task ID (proposed) | Title | Objective | Authority | Dependencies | Entry Conditions | Exit Conditions | Change Type | Parallel? | Merge Order | Founder Review? |
|---|---|---|---|---|---|---|---|---|---|---|
| `ENG-P1-EXIT-001` (this task) | Phase 1 Exit Determination + Mobilisation | Determine Phase 1 exit; classify blockers; sequence remaining work | Engineering (evidentiary), Founder-authorized | `RES-007B` merged | — | This report merged | Governance state (documentation) | — | 1st (of this batch) | Yes (standing constraint — do not self-merge) |
| `RES-005.2a` | BaseMetadata Blueprint Correction | Correct Version 1 Engineering Blueprint §3.3 `version` → `schemaVersion` | Engineering Lead | `ENG-P1-EXIT-001` merged | Blueprint §3.3 text confirmed conflicting (this report, §9) | Blueprint §3.3 reads `schemaVersion`, consistent with TRD10 §10.5 | Documentation | Yes — parallel with `EXT-TECH-001`/`DEC-PROD-012` evidence-gathering | 2nd | No (documentation-only correction of an already-disclosed conflict; Engineering Lead authority per Resolution Plan §4) |
| `RES-005.2b` | BaseMetadata Code Conformance Correction | Correct `functions/src/shared/metadata/baseMetadata.ts` (and dependent call sites) `version` → `schemaVersion` | Engineering Lead | `RES-005.2a` merged (sequential — not parallel with `.2a`, per Resolution Plan §8's own risk disclosure) | Blueprint §3.3 corrected first | Code matches corrected Blueprint and TRD10; tests updated and green | Application code | No — strictly after `RES-005.2a` | 3rd | Yes (code change, even though narrowly scoped) |
| `EXT-TECH-001-EVIDENCE` | Burundi OTP Delivery Evidence Gathering | Obtain and file test-number OTP delivery evidence across Burundi carriers | Engineering Lead | None (independently actionable per the External Dependencies Register) | — | `EXT-TECH-001` status moves to `EVIDENCE_RECEIVED` or `CLOSED` | External evidence | Yes — parallel with `RES-005.2a`/`.2b` and `DEC-PROD-012-PREP` | Independent | No (evidence-filing; Engineering Lead owned) |
| `DEC-PROD-012-PREP` | Gender Values Decision Package | Prepare options/evidence for `DEC-PROD-012`, including `EXT-LEG-001` legal input | Engineering Lead (with legal input) | None | — | Decision package ready for Founder decision | Governance preparation | Yes — parallel with the above | Independent | No (preparation only, per the established "prepare, then record" discipline) |
| `DEC-PROD-012-DEC` | Gender Values Founder Decision Recording | Record the Founder's decision on `DEC-PROD-012` | Founder | `DEC-PROD-012-PREP` merged | Decision package exists | Decision Register `DEC-PROD-012` → `CONFIRMED` (or formally recorded defer-and-omit) | Governance decision | No — sequential after `-PREP` | After `-PREP` | **Yes — Founder decision point** |
| `ENG-P2-GATE-001` | Capability Authorisation Gate Reassessment | Re-verify all 8 items of Resolution Plan §7 against live state once the above close | Engineering (evidentiary) | `RES-005.2b`, `EXT-TECH-001-EVIDENCE`, `DEC-PROD-012-DEC` all closed | All three independent blockers closed | Gate items 1–8 all read `Satisfied` against live repo/register state | Governance verification | No | Final, after all above | Yes — the Founder-facing checkpoint before mobilising `ENG-P2-001` |
| `ENG-P2-001` | Customer Identity Implementation | Begin Phase 2 implementation | Engineering, Founder-mobilised | `ENG-P2-GATE-001` passed | Capability Authorisation Gate fully satisfied | — | Application code | — | After gate reassessment | Yes — a fresh mobilisation gate, not implied by any of the above |

**Founder decision points:** `DEC-PROD-012-DEC` (the only genuine new decision-recording point in this sequence — the disposition itself, not its preparation). **Engineering approval points:** `RES-005.2a`, `RES-005.2b` (Engineering Lead sign-off, per Resolution Plan §4's Ownership Matrix), `ENG-P2-GATE-001` (Engineering-evidentiary, then Founder-facing checkpoint). **Code-change tasks:** `RES-005.2b` only. **Final Capability Authorisation Gate:** `ENG-P2-GATE-001`.

## 12. Mobilisation Recommendation

**Recommend one next executable task: `RES-005.2a` (BaseMetadata Blueprint Correction).**

Rationale: it is the only remaining item that is (a) purely a documentation correction of an already-disclosed, unambiguous conflict (Blueprint `version` vs. TRD10 `schemaVersion`, confirmed in §9), (b) fully within Engineering Lead authority without requiring Founder decision or external evidence, (c) a hard sequential prerequisite to `RES-005.2b` (which the Resolution Plan's own §8 explicitly warns against reordering), and (d) the item this report is best positioned to hand off precisely, having just confirmed the exact conflict and the exact required correction. `EXT-TECH-001-EVIDENCE` and `DEC-PROD-012-PREP` are equally independently mobilisable in parallel, but neither is recommended as *the single* next task since the assignment calls for one.

**This task does not authorise or begin `RES-005.2a`.**

## 13. Files Created or Modified

**Created:** this report. **Modified (narrow, exit-determination-recording only):** `docs/05-implementation/change-tracking/engineering-implementation-programme.md` (Phase 1 row — records the exit-criteria determination outcome); `docs/05-implementation/11thonus-master-workflow.md` (Phase 2 narrative — corrects the now-stale "not yet formally made" claim about Phase 1 exit); `docs/changes/IMPLEMENTATION_CHANGES.md` (append); `docs/00-governance/documentation-changes-log.md` (append). **Not modified:** the Decision Register; `RES-007`/`RES-007B`'s own closure records (historical); the Resolution Plan; `CDR-001`; the Requirements Traceability Matrix; the Coding-Agent Prompt Register; any application code; any PRD/TRD.

## 14. Code Diff Summary

None. No application code was modified — `functions/src/shared/metadata/baseMetadata.ts` was read for comparison (§9) but not edited.

## 15. Commands Executed

`gh pr view 41` (pre-merge state), `gh pr checks 41`, `git status --short`, `git branch --show-current`, `gh pr merge 41 --merge`, `gh pr view 41 --json state,mergeCommit,mergedAt`, `git fetch origin`, `git checkout main`, `git pull origin main --ff-only`, `git rev-list --left-right --count origin/main...main`, `gh run list --branch main`, `gh run watch <id> --exit-status`; direct `grep`/`find`/`cat`/`Read` of TRD22 §22.11, the Version 1 Engineering Blueprint §3.3, TRD10 §10.5, `firestore.rules`, `storage.rules`, `.firebaserc` (via the `ENG-P1-001` closure report), `commandDispatcher.test.ts`, `outboxProcessor.emulator.test.ts`, `baseMetadata.ts`, the Decision Register's `DEC-PROD-012` entry, and the External Dependencies Register's `EXT-TECH-001` row.

## 16. Dependencies Added

None.

## 17. Configuration Changes

None.

## 18. Risks

None introduced. This task performed one already-reviewed PR merge (content unaltered by this task) and a read-only evidentiary determination. No application code changed; no unresolved decision recorded; no implementation authorized or begun.

## 19. Rollback Instructions

Tracker-recording changes (§13): `git revert` of this task's own commit. `PR #41`'s merge is not rolled back by that revert; it is independently reversible per its own disclosed rollback instructions, requiring fresh Founder authorization, out of scope here.

## 20. Changes-Tracking Update

`docs/changes/IMPLEMENTATION_CHANGES.md` updated with a new entry for this task (see the accompanying commit).
