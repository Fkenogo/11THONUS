> **Title:** ENG-P2-RES-000 — Capability 2 Resolution Plan
> **Status:** Complete. Planning document — converts completed analysis into an execution programme. No code implemented, no governance document modified, no Founder decision created or resolved, no implementation of Capability 2 has begun.
> **Date:** 2026-07-29
> **Classification:** Engineering planning document. Operational reference for the remaining pre-implementation work on Capability 2 — Customer Identity.

# ENG-P2-RES-000 — Capability 2 Resolution Plan

## 1. Executive Summary

This plan exists because the completed readiness and governance programme — [`ENG-P2-000`](../reports/ENG-P2-000-capability-2-readiness-review-2026-07-29.md), [`ENG-P2-000A`](../reports/ENG-P2-000A-phase-2-governance-reconciliation-2026-07-29.md), and [`ENG-P2-000B`](../reports/ENG-P2-000B-dependency-resolution-analysis-2026-07-29.md) — answered "what is blocking Capability 2 and why," but produced no operational plan for closing those blockers. Each of the three prior tasks was explicitly scoped as read-only analysis; none proposed an execution sequence, assigned ownership, or defined the exact evidence that authorizes implementation to begin. This plan is that missing operational layer.

**Relationship to the completed programme:** this document does not repeat, re-derive, or reopen any finding from `ENG-P2-000`/`ENG-P2-000A`/`ENG-P2-000B` — it takes their conclusions as given and converts each into a bounded work package with an owner, inputs, deliverables, and completion criteria. Every work package below traces to a specific finding in one of those three reports (§3 provides the full traceability).

**What constitutes completion:** this plan itself is complete when it exists as an approved, evidence-traceable operational reference — it does not require any of its own work packages to have closed. The *programme* it describes is complete when the Capability Authorisation Gate (§7) is satisfied and `ENG-P2-001` — Customer Identity Implementation is authorized to begin.

## 2. Resolution Objectives

1. **Remove governance blockers** — close the four D1 decisions (`DEC-SEC-001`, `DEC-PROV-004`, `DEC-ID-003`, `DEC-DATA-007`) that gate `ENG-P2-001`/`ENG-P2-004`, following the resolution order and governance prerequisites `ENG-P2-000B` established.
2. **Resolve engineering conformance** — plan the correction of the `BaseMetadata` shape conflict between the already-shipped `functions/src/shared/metadata/baseMetadata.ts` and TRD10 §10.5, which `ENG-P2-000A` found blocks any Phase 2 work package from persisting a document at all.
3. **Synchronise repository documentation** — correct the Engineering Implementation Programme's `DEC-LEGAL-005` mischaracterization (a confirmed Repository Error per `ENG-P2-000A`) and, once the decisions above close, update the Programme's Phase 2 Work-Packages table so it reflects actual state rather than a flat "Blocked" status.
4. **Prepare Capability 2 for implementation** — produce a single, objective, evidence-based gate (§7) that states exactly what must be true before `ENG-P2-001` may begin, so that authorization is a verification exercise, not a judgment call.

## 3. Resolution Work Packages

Every work package below is traced to its source finding. None were invented beyond the brief's named list except `RES-006`, which is separately justified against repository evidence at its own entry.

### RES-001 — EXT-TECH-001 Evidence Package

- **Traces to:** `ENG-P2-000B` §2 (EXT-TECH-001 Analysis) and §5 Step 1.
- **Scope:** obtain the Firebase phone-OTP-to-Burundi delivery proof — reliability, cost, abuse controls, test-number strategy — from Firebase/Google and local carriers, and file it against the [External Dependencies Register](../../00-governance/decisions/external-dependencies-register.md) `EXT-TECH-001` row.
- **Why it is the root of the plan:** `ENG-P2-000B` §7 established this is the single item that structurally prevents any Customer Identity engineering work from starting; `DEC-PROV-004` and `DEC-SEC-001` cannot close without it.

### RES-002 — DEC-PROV-004 Resolution

- **Traces to:** `ENG-P2-000B` §5 Steps 2–3, §6 (corrected Founder-countersign finding).
- **Scope:** two sequential actions, both prerequisites to closing the decision:
  1. **Governance prerequisite** — formally address `DEC-PROV-004`'s literal `Dependencies: EXT-TECH-001; DEC-SEC-001` field before it can close. `ENG-P2-000B`'s own corrected §4/§5 established that reasoning from the decisions' question text is *not* itself authorization to bypass this recorded edge — an explicit governance action is required: either (a) the Engineering Lead formally records that `DEC-PROV-004` is resolved using `EXT-TECH-001` evidence alone, correcting/waiving the `DEC-SEC-001` edge, or (b) `DEC-PROV-004` and `DEC-SEC-001` (`RES-003`) are closed together as a single combined governance action.
  2. **Decision** — using `RES-001`'s evidence, decide Firebase-native OTP vs. external SMS route for Burundi numbers, then route to the Founder for countersign. This decision affects authentication behavior and therefore requires Founder countersign under the Decision Register's general approval rule (§1: "Engineering, provider and legal items are approved by their named owner and, where they affect product behavior, countersigned by the founder") — this is a correction `ENG-P2-000B` made to its own initial "no Founder involvement" draft, confirmed here.

### RES-003 — DEC-SEC-001 Resolution

- **Traces to:** `ENG-P2-000B` §5 Step 4.
- **Scope:** using `RES-001`'s evidence and `RES-002`'s outcome, confirm Firebase phone OTP as primary customer authentication and define the fallback (email link, password+recovery, or assisted registration), then route to the Founder for the countersign the decision's own Register fields already require (`Founder decision required: Countersign only`).
- **Sequencing:** strictly follows `RES-002` — `ENG-P2-000B` §4 found `DEC-SEC-001`'s fallback-definition component benefits from knowing `DEC-PROV-004`'s delivery-route answer first, and the literal Register dependency (§4 correction) requires `RES-002`'s governance prerequisite to have run before this can close.

### RES-004 — DEC-ID-003 Founder Decision Package

- **Traces to:** `ENG-P2-000B` §5 Step 6, §6.
- **Scope:** the Founder decides the permission-resolution algorithm (how PRD10's role inheritance and PRD1's explicit configurable grants combine) — a self-contained decision with zero dependencies on any other item in this plan, already on "founder agenda Batch C" per the decision's own Notes field in the Decision Register.
- **Sequencing:** fully independent — no dependency on `RES-001`/`002`/`003` and no dependency they have on it.

### RES-005 — Repository Synchronisation

- **Traces to:** `ENG-P2-000A` §6 (BaseMetadata Reconciliation), §6 (DEC-LEGAL-005 Reconciliation); `ENG-P2-000B` §5 Steps 7–8.
- **Scope**, three sub-items:
  1. **`DEC-LEGAL-005` correction** — the Engineering Implementation Programme's Phase 2 profile states "Legal Dependencies: None direct (`DEC-LEGAL-005`... is D3/pilot-tier, not a Phase 2 blocker)," which `ENG-P2-000A` established is a Repository Error: the Decision Register's own fields state `Priority: D2`, `Required by: Phase 2`, `Blocks: registration policy text`. Correct the Programme's text to match the Register. This is a documentation-only fix — it does not change which work packages are blocked (per `ENG-P2-000B` §7, no named work package is currently blocked by `DEC-LEGAL-005`), only the Programme's stated reasoning.
  2. **`BaseMetadata` alignment planning** — plan the correction of `functions/src/shared/metadata/baseMetadata.ts`, which `ENG-P2-000A` found implements the Version 1 Engineering Blueprint §3.3 shape rather than TRD10 §10.5's shape (four confirmed field-level differences: `version`/`schemaVersion` naming, audit-field nullability, `deletedAt`/`archivedAt` semantics, and `languageCode` vs. `currencyCode`/`timezone` scoped fields). TRD10 governs per the Blueprint's own self-declared §0 authority rule. This work package plans the correction (scope, affected callers, sequencing relative to `ENG-P2-001`); it does not perform the code change, consistent with this document's own no-implementation constraint (§ Constraints).
  3. **Phase 2 programme synchronisation** — once `RES-002`/`003`/`004` (and `RES-006`, below) close, update the Engineering Implementation Programme's Phase 2 Work-Packages table Status and Blocking Reason cells so it stops stating a flat "Blocked" against decisions that have since resolved.

### RES-006 — DEC-PROD-012 Profile Schema Decision *(addition beyond the brief's named list, evidence-justified below)*

- **Traces to:** `ENG-P2-000` §9 (corrected pre-merge finding — see [`IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md), "ENG-P2-000: Pre-Merge Correction," Finding 1).
- **Why it is included despite not being in the task brief's named RES-001..005 list:** the brief's constraint is "do not invent additional work unless supported by repository evidence." `ENG-P2-000`'s own corrected analysis — merged to `main` as part of the completed readiness programme this plan is required to trace to — found that `DEC-PROD-012` (optional gender values and wording) is a genuine Phase 2 dependency: the Decision Register's own fields state `Required by phase: Phase 2 (progressive profile)`, `Blocks: profile schema freeze`, `Risks if unresolved: schema churn`. This is distinct from, and was previously conflated with, the fact that gender never blocks the *customer's* registration experience. Since `ENG-P2-001`'s own scope (per CDR-001) explicitly includes "profile," and the Programme's own Preconditions do not currently name `DEC-PROD-012`, omitting it here would leave a known, evidence-backed schema-freeze risk out of the resolution programme.
- **Scope:** the Founder (with legal input per the decision's own `Founder decision required: Yes (with legal input)` field) selects the gender enum value set and wording, or formally adopts a governed defer-and-omit approach for the `customerProfiles.gender` field.
- **Sequencing:** independent of `RES-001`–`004` — no dependency relationship exists between `DEC-PROD-012` and `EXT-TECH-001`/`DEC-SEC-001`/`DEC-PROV-004`/`DEC-ID-003` in the Decision Register.

## 4. Ownership Matrix

| Work Package | Owner | Supporting Role | Inputs | Deliverables | Completion Criteria |
|---|---|---|---|---|---|
| `RES-001` | Engineering Lead | Firebase/Google, local carriers (external) | Firebase Auth documentation; carrier test access | Evidence filed in External Dependencies Register | `EXT-TECH-001` status: `PENDING` → `EVIDENCE_RECEIVED` |
| `RES-002` | Engineering Lead | Founder (countersign) | `RES-001` evidence | Governance-prerequisite record; Decision Register entry update | `DEC-PROV-004`: `OPEN_PROVIDER` → Founder-countersigned Final Decision |
| `RES-003` | Engineering Lead | Founder (countersign) | `RES-001` evidence; `RES-002` outcome | Decision Register entry update | `DEC-SEC-001`: `OPEN_ENGINEERING` → Founder-countersigned Final Decision |
| `RES-004` | Founder | Engineering Lead | PRD1 §7/§12, PRD10 §13, TRD12 (already cited in the Register's own entry) | Decision Register entry update | `DEC-ID-003`: `OPEN_FOUNDER` → Final Decision, Approved by recorded |
| `RES-005` | Engineering/governance | Founder + legal adviser (for the underlying `DEC-LEGAL-005` decision only, not the documentation fix) | Live Decision Register text; TRD10 §10.5; Blueprint §3.3/§0 | (1) corrected Programme text; (2) `BaseMetadata` correction plan document; (3) synchronized Programme table | (1) Programme text matches Register fields; (2) plan document exists and is reviewed; (3) Programme Status/Blocking Reason cells reflect actual decision state |
| `RES-006` | Founder (with legal input) | Engineering Lead | TRD10 §10.6.2 enum; OPD-009; DR-PROD-011 (already cited in the Register's own entry) | Decision Register entry update | `DEC-PROD-012`: `OPEN_FOUNDER` → Final Decision, or a formally recorded defer-and-omit adoption |

## 5. Dependency Diagram

```
RES-001 (EXT-TECH-001 evidence)
   │
   ▼
RES-002a (governance prerequisite: waive/correct DEC-SEC-001 edge, or combine with RES-003)
   │
   ▼
RES-002b (decide DEC-PROV-004; Founder countersign)
   │
   ▼
RES-003 (confirm DEC-SEC-001; Founder countersign)
   │
   ▼
 ══════════════ GATE A: sequential OTP chain closed ══════════════

RES-004 (DEC-ID-003 — Founder decision)         ── parallel, no dependency on RES-001..003
RES-006 (DEC-PROD-012 — Founder decision)       ── parallel, no dependency on RES-001..003
RES-005.1 (DEC-LEGAL-005 doc correction)        ── parallel, no dependency on RES-001..003
RES-005.2 (BaseMetadata alignment planning)     ── parallel, no dependency on RES-001..003

 ══════════════ GATE B: RES-002/003/004/006 all closed ══════════════
   │
   ▼
RES-005.3 (Programme table synchronisation)
   │
   ▼
 ══════════════ CAPABILITY AUTHORISATION GATE (§7) ══════════════
   │
   ▼
ENG-P2-001 — Customer Identity Implementation authorized to begin
```

**Sequential work:** `RES-001` → `RES-002a` → `RES-002b` → `RES-003` is the one genuinely sequential chain (each step requires the prior step's output; `ENG-P2-000B` §5 established this).

**Parallel work:** `RES-004`, `RES-006`, `RES-005.1`, and `RES-005.2` have no dependency on the OTP chain or on each other and can all run concurrently with `RES-001`–`003` and with each other, starting immediately.

**Completion gates:** Gate A (sequential chain closed) is not itself the authorization gate — it is an internal checkpoint. Gate B requires the sequential chain plus both parallel Founder decisions closed before the Programme table sync (`RES-005.3`) is meaningful. The Capability Authorisation Gate (§7) is the final, external gate.

## 6. Parallel Execution Opportunities

All conclusions here are drawn directly from the Decision Register's own `Dependencies` fields, cross-checked in `ENG-P2-000B` §3 (Complete Dependency Graph) — none are inferred beyond that already-completed cross-check.

- **`RES-004` (`DEC-ID-003`) can start immediately, in parallel with `RES-001`.** The Register's own field reads `Dependencies: —` for this decision; it is a self-contained Founder judgment call already flagged as ready ("founder agenda Batch C").
- **`RES-006` (`DEC-PROD-012`) can start immediately, in parallel with `RES-001`.** No dependency edge exists between it and `EXT-TECH-001`/`DEC-SEC-001`/`DEC-PROV-004`/`DEC-ID-003` in the Register.
- **`RES-005.1` (`DEC-LEGAL-005` documentation correction) can start immediately.** It is a text correction against already-established evidence (`ENG-P2-000A` §6); it has no technical dependency on any decision closing first.
- **`RES-005.2` (`BaseMetadata` alignment planning) can start immediately.** Planning the correction does not require any of `RES-001`–`004`/`006` to have closed — the conflict and its correct target shape (TRD10 §10.5) are already established facts, independent of the OTP or profile decisions.
- **`RES-005.3` (Programme table synchronisation) cannot start until `RES-002`, `RES-003`, `RES-004`, and `RES-006` have all closed** — updating the table before then would itself introduce a new inaccuracy, the same class of error `ENG-P2-000B` found in the original flat "Blocked" framing.

## 7. Capability Authorisation Gate

`ENG-P2-001` — Customer Identity Implementation may begin **only when all of the following are objectively verifiable against live repository/register state:**

1. `EXT-TECH-001` status in the External Dependencies Register is `EVIDENCE_RECEIVED` or `CLOSED` (not `PENDING`).
2. `DEC-PROV-004` status in the Decision Register is a Final Decision with `Approved by` recorded, including the Founder countersign this plan's `RES-002` correction requires.
3. `DEC-SEC-001` status in the Decision Register is a Final Decision with the Founder countersign its own fields already require.
4. `DEC-DATA-007` status in the Decision Register is a Final Decision. **Included per `ENG-P2-000B`'s corrected §7 finding:** although `DEC-DATA-007` has no dependency of its own and is independently actionable, the Programme's own table lists it as a current Decision Dependency and Precondition for `ENG-P2-001` — it must close before the gate is satisfied, not merely before it is convenient to close.
5. `DEC-ID-003` status in the Decision Register is a Final Decision (from `RES-004`).
6. `DEC-PROD-012` status in the Decision Register is a Final Decision, or a formally recorded defer-and-omit adoption (from `RES-006`) — included because `ENG-P2-001`'s own scope includes "profile," and the Register names this decision as blocking profile schema freeze specifically.
7. `functions/src/shared/metadata/baseMetadata.ts` conforms to TRD10 §10.5's shape (from `RES-005.2`'s plan being executed — execution itself is out of this plan's scope, but the gate cannot open without it, per `ENG-P2-000` §13's finding that this conflict "blocks any Phase 2 work package from persisting a document at all").
8. The Engineering Implementation Programme's Phase 2 Work-Packages table (from `RES-005.3`) reflects the state confirmed in items 1–6 above — a verification step, not itself a substantive blocker.

**Explicitly not required by this gate:** `DEC-LEGAL-005`'s underlying Founder+legal-adviser decision. Per the Decision Register's own fields (confirmed by `ENG-P2-000`/`ENG-P2-000A`), it blocks "registration policy text," not `ENG-P2-001`'s technical build — only the Programme's documentation text needs correcting (`RES-005.1`), not the decision itself, for this gate to open.

## 8. Risks

Only remaining execution risk is addressed here — no previously closed analysis is repeated.

- **Founder countersign bottleneck on `RES-002`/`RES-003`:** both decisions require Founder countersign in sequence after Engineering Lead work completes; if Founder availability is constrained, this could stall the one genuinely sequential chain even after the underlying technical work is done.
- **`RES-005.2` planning outpacing execution:** the `BaseMetadata` alignment plan can be produced quickly (§6), but the Capability Authorisation Gate (§7 item 7) requires the *code* to conform, not merely a plan to exist — if execution of that plan is not scheduled as a distinct follow-on work package, the gate could stall on an unstarted implementation task after all decisions have closed.
- **`RES-005.3` performed prematurely:** if the Programme table is synchronized before all of `RES-002`/`003`/`004`/`006` have genuinely closed (rather than merely being in progress), it would reintroduce a documentation inaccuracy of the same kind this resolution programme exists to correct.
- **`RES-006` treated as optional because it is not in the brief's named list:** since this work package was added by this plan rather than named in the task brief, there is a risk a future reader treats it as discretionary; §3's evidence trail and §7 item 6 are written to make clear it is a required gate item, not an optional addition.

## 9. Success Criteria

The Resolution Programme (not this document) is successful when:

1. All six work packages (`RES-001`–`006`) have reached their individually stated completion criteria (§4).
2. The Engineering Implementation Programme's Phase 2 Work-Packages table accurately reflects that state (`RES-005.3`).
3. No new Founder decision was created in the course of executing this plan — only the four pre-existing D1 decisions (`DEC-SEC-001`, `DEC-PROV-004`, `DEC-ID-003`, `DEC-DATA-007`) plus `DEC-PROD-012` and the already-established `BaseMetadata`/`DEC-LEGAL-005` corrections were resolved.
4. The Capability Authorisation Gate (§7) can be verified as satisfied purely by reading live repository/register state — no interpretation or inference required.

## 10. Exit Criteria

The evidence that demonstrates Capability 2 is authorized for implementation is a single, reproducible check against live repository state: all eight items in §7's Capability Authorisation Gate read as satisfied when the Decision Register, External Dependencies Register, `baseMetadata.ts`, and the Engineering Implementation Programme's Phase 2 table are inspected directly. No separate authorization report is required beyond this verification — the gate is the exit criterion.

## 11. Constraints Observed

Per this task's own brief: the Engineering Implementation Programme was not redesigned; CDR-001 was not redesigned; no completed readiness work (`ENG-P2-000`/`ENG-P2-000A`/`ENG-P2-000B`) was reopened or re-analyzed; no new Founder decision was created (`RES-004`/`RES-006` route pre-existing, already-registered decisions to the Founder — they do not create new ones); no unrelated repository file was modified; the current repository architecture is unchanged. No code was implemented and `ENG-P2-001` has not begun.

## 12. Risks From This Document Itself

None — this is a read-only planning document; no code, governance document, decision, or CDR-001 content was changed by producing it.

## 13. Assumptions

- `RES-002` and `RES-003` are presented as a strict sequential chain per `ENG-P2-000B`'s own corrected finding; the Ownership Matrix (§4) presents them separately for the brief's required RES-002/RES-003 split, while §5's diagram makes explicit that `RES-002` internally contains the governance-prerequisite sub-step `ENG-P2-000B` identified as a precondition to sequential closure.
- `RES-006`'s inclusion is a judgment call, not a directly instructed item — justified at its own entry (§3) with the specific evidence trail, per the task's "do not invent additional work unless supported by repository evidence" constraint, and flagged distinctly rather than folded silently into the brief's named list.

## 14. Files Modified

None. This is a new planning document; no existing document was edited.

## 15. Commands Executed

Direct reads of `docs/00-governance/decisions/decision-register.md` (`DEC-DATA-007`, `DEC-ID-003`, `DEC-SEC-001`, plus compact-format `DEC-PROV-004`/`DEC-LEGAL-005`/`DEC-PROD-012` lines) and `docs/00-governance/decisions/external-dependencies-register.md` to confirm no status has changed since `ENG-P2-000B` merged; re-read of the corrected, merged `ENG-P2-000`/`ENG-P2-000A`/`ENG-P2-000B` reports and `IMPLEMENTATION_CHANGES.md` to source every work package's traceability; `find`/`ls` of `docs/05-implementation/` to confirm document placement precedent (`roadmap/` alongside `CDR-001`).

## 16. Dependencies Added

None.

## 17. Configuration Changes

None.

## 18. Rollback Instructions

`git revert` of this task's own commit — a single new planning document plus one changes-log append.

## 19. Markdown Resolution Plan

This document: [`docs/05-implementation/roadmap/ENG-P2-RES-000-capability-2-resolution-plan.md`](ENG-P2-RES-000-capability-2-resolution-plan.md).

## 20. Changes Log

Updated: [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md).
