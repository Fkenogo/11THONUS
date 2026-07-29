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
2. **Resolve engineering conformance** — correct the `BaseMetadata` shape conflict `ENG-P2-000A` found blocks any Phase 2 work package from persisting a document at all: both the Version 1 Engineering Blueprint §3.3 text and the already-shipped `functions/src/shared/metadata/baseMetadata.ts` code must be aligned to TRD10 §10.5, per `ENG-P2-000A`'s own two-part correction finding.
3. **Synchronise repository documentation** — correct the Engineering Implementation Programme's `DEC-LEGAL-005` mischaracterization (a confirmed Repository Error per `ENG-P2-000A`) and, once the decisions above close, update the Programme's Phase 2 Work-Packages table so it reflects actual state rather than a flat "Blocked" status.
4. **Prepare Capability 2 for implementation** — produce a single, objective, evidence-based gate (§7) that states exactly what must be true before `ENG-P2-001` may begin, so that authorization is a verification exercise, not a judgment call.

## 3. Resolution Work Packages

Every work package below is traced to its source finding. None were invented beyond the brief's named list except `RES-006` and `RES-007`, which are separately justified against repository evidence at their own entries. **Correction made before merge:** the original version of this plan omitted a work package for `DEC-DATA-007` despite naming it as a required Capability Authorisation Gate item (§7), and scoped the `BaseMetadata` correction as planning only, with no owned package to execute the code and Blueprint-text fixes the gate also requires. Both gaps are corrected below (`RES-007`; the expanded `RES-005.2`).

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
  2. **`BaseMetadata` alignment — the two-part correction `ENG-P2-000A` §5 itself defines.** `ENG-P2-000A` found `functions/src/shared/metadata/baseMetadata.ts` implements the Version 1 Engineering Blueprint §3.3 shape rather than TRD10 §10.5's shape (four confirmed field-level differences: `version`/`schemaVersion` naming, audit-field nullability, `deletedAt`/`archivedAt` semantics, and `languageCode` vs. `currencyCode`/`timezone` scoped fields), and that TRD10 governs per the Blueprint's own self-declared §0 authority rule. `ENG-P2-000A` §5 states explicitly this requires a "mechanical, two-part correction: (1) align the Blueprint's §3.3 text to TRD10's shape... (2) align `baseMetadata.ts`'s implementation to the corrected shape." **Corrected in this plan before merge:** the original draft scoped only a correction *plan* for the code, and omitted the Blueprint text entirely — leaving the Capability Authorisation Gate (§7) with no owned path to satisfaction. Both parts are now owned sub-deliverables:
     - **`RES-005.2a` — Blueprint §3.3 text correction.** Align the Version 1 Engineering Blueprint's §3.3 (Standard Document Metadata) text to TRD10 §10.5's shape. Documentation-only; no Founder decision required per `ENG-P2-000A`'s own finding that this is a mechanical application of the Blueprint's pre-existing self-declared rule.
     - **`RES-005.2b` — `baseMetadata.ts` code correction.** Update `functions/src/shared/metadata/baseMetadata.ts` to conform to the corrected shape from `RES-005.2a`, following this repository's established Test-Driven Development discipline (failing test first, minimal implementation, full validation suite). This is the actual code change the Capability Authorisation Gate (§7 item 7) requires — it is a defined, owned work package in this plan; its *execution* remains future work, in the same sense that `RES-001`–`004`/`006`/`007` are also defined-but-not-yet-executed work packages.
  3. **Phase 2 programme synchronisation** — once `RES-002`/`003`/`004`/`006`/`007` close, update the Engineering Implementation Programme's Phase 2 Work-Packages table Status and Blocking Reason cells so it stops stating a flat "Blocked" against decisions that have since resolved.

### RES-006 — DEC-PROD-012 Profile Schema Decision *(addition beyond the brief's named list, evidence-justified below)*

- **Traces to:** `ENG-P2-000` §9 (corrected pre-merge finding — see [`IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md), "ENG-P2-000: Pre-Merge Correction," Finding 1).
- **Why it is included despite not being in the task brief's named RES-001..005 list:** the brief's constraint is "do not invent additional work unless supported by repository evidence." `ENG-P2-000`'s own corrected analysis — merged to `main` as part of the completed readiness programme this plan is required to trace to — found that `DEC-PROD-012` (optional gender values and wording) is a genuine Phase 2 dependency: the Decision Register's own fields state `Required by phase: Phase 2 (progressive profile)`, `Blocks: profile schema freeze`, `Risks if unresolved: schema churn`. This is distinct from, and was previously conflated with, the fact that gender never blocks the *customer's* registration experience. Since `ENG-P2-001`'s own scope (per CDR-001) explicitly includes "profile," and the Programme's own Preconditions do not currently name `DEC-PROD-012`, omitting it here would leave a known, evidence-backed schema-freeze risk out of the resolution programme.
- **Scope:** the Founder (with legal input per the decision's own `Founder decision required: Yes (with legal input)` field) selects the gender enum value set and wording, or formally adopts a governed defer-and-omit approach for the `customerProfiles.gender` field.
- **Sequencing:** independent of `RES-001`–`004` — no dependency relationship exists between `DEC-PROD-012` and `EXT-TECH-001`/`DEC-SEC-001`/`DEC-PROV-004`/`DEC-ID-003` in the Decision Register.

### RES-007 — DEC-DATA-007 Resolution *(addition beyond the brief's named list, evidence-justified below)*

- **Traces to:** `ENG-P2-000B` §5 Step 5.
- **Why it is included despite not being in the task brief's named RES-001..005 list:** `ENG-P2-000B` §5 assigns `DEC-DATA-007` (loyalty-number/QR generation algorithm) to the Engineering Lead as an independent, parallel step, and `ENG-P2-000B`'s own corrected §7 established it is one of the three items that must close before `ENG-P2-001` unblocks — it is already named as a required item in this plan's own Capability Authorisation Gate (§7 item 4). **Corrected before merge:** the original draft named `DEC-DATA-007` in the gate without assigning it any work package, meaning the plan's own six defined packages could all close while this gate condition remained unsatisfiable. This package closes that gap.
- **Scope:** the Engineering Lead defines the loyalty-number format/generation algorithm (opaque, non-sequential, non-revealing) and the QR opaque/signed reference scheme, within the constraints PRD2 §8–9 and TRD12's QR privacy requirements already establish. No Founder decision required (Register field: `Founder decision required: No`).
- **Sequencing:** independent — the Register's own field reads `Dependencies: —` for this decision.

## 4. Ownership Matrix

| Work Package | Owner | Supporting Role | Inputs | Deliverables | Completion Criteria |
|---|---|---|---|---|---|
| `RES-001` | Engineering Lead | Firebase/Google, local carriers (external) | Firebase Auth documentation; carrier test access | Evidence filed in External Dependencies Register | `EXT-TECH-001` status: `PENDING` → `EVIDENCE_RECEIVED` |
| `RES-002` | Engineering Lead | Founder (countersign) | `RES-001` evidence | Governance-prerequisite record; Decision Register entry update | `DEC-PROV-004`: `OPEN_PROVIDER` → Founder-countersigned Final Decision |
| `RES-003` | Engineering Lead | Founder (countersign) | `RES-001` evidence; `RES-002` outcome | Decision Register entry update | `DEC-SEC-001`: `OPEN_ENGINEERING` → Founder-countersigned Final Decision |
| `RES-004` | Founder | Engineering Lead | PRD1 §7/§12, PRD10 §13, TRD12 (already cited in the Register's own entry) | Decision Register entry update | `DEC-ID-003`: `OPEN_FOUNDER` → Final Decision, Approved by recorded |
| `RES-005.1` | Engineering/governance | — | Live Decision Register text | Corrected Programme text | Programme text matches Register's `Priority: D2`/`Required by: Phase 2` fields |
| `RES-005.2a` | Engineering/governance | — | TRD10 §10.5; Blueprint §3.3/§0 | Corrected Blueprint §3.3 text | Blueprint §3.3 shape matches TRD10 §10.5 |
| `RES-005.2b` | Engineering Lead | — | `RES-005.2a` corrected shape; existing `baseMetadata.ts` and its callers | Code change (TDD: failing test → implementation → full validation suite) | `functions/src/shared/metadata/baseMetadata.ts` conforms to TRD10 §10.5's shape; existing tests and callers updated accordingly |
| `RES-005.3` | Engineering/governance | — | Confirmed closure of `RES-002`/`003`/`004`/`006`/`007` | Synchronized Programme table | Programme Status/Blocking Reason cells reflect actual decision state |
| `RES-006` | Founder (with legal input) | Engineering Lead | TRD10 §10.6.2 enum; OPD-009; DR-PROD-011 (already cited in the Register's own entry) | Decision Register entry update | `DEC-PROD-012`: `OPEN_FOUNDER` → Final Decision, or a formally recorded defer-and-omit adoption |
| `RES-007` | Engineering Lead | — | PRD2 §8–9; TRD12 QR privacy requirements (already cited in the Register's own entry) | Decision Register entry update | `DEC-DATA-007`: `OPEN_ENGINEERING` → Final Decision |

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
RES-007 (DEC-DATA-007 — Engineering decision)   ── parallel, no dependency on RES-001..003
RES-005.1 (DEC-LEGAL-005 doc correction)        ── parallel, no dependency on RES-001..003
RES-005.2a (Blueprint §3.3 text correction)     ── parallel, no dependency on RES-001..003
   │
   ▼
RES-005.2b (baseMetadata.ts code correction, TDD)

 ══════════════ GATE B: RES-002/003/004/006/007/005.2b all closed ══════════════
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

**Sequential work:** `RES-001` → `RES-002a` → `RES-002b` → `RES-003` is the one genuinely sequential chain gating the OTP decisions (each step requires the prior step's output; `ENG-P2-000B` §5 established this). `RES-005.2a` → `RES-005.2b` is a second, independent sequential pair — the Blueprint text must be corrected before the code can be written to conform to it.

**Parallel work:** `RES-004`, `RES-006`, `RES-007`, `RES-005.1`, and the `RES-005.2a`→`RES-005.2b` pair have no dependency on the OTP chain and can all run concurrently with `RES-001`–`003` and with each other, starting immediately.

**Completion gates:** Gate A (sequential OTP chain closed) is not itself the authorization gate — it is an internal checkpoint. Gate B requires the OTP chain plus all three parallel Founder/Engineering decisions (`RES-004`/`006`/`007`) and the `BaseMetadata` code correction (`RES-005.2b`) closed before the Programme table sync (`RES-005.3`) is meaningful. **Corrected before merge:** the original Gate B omitted `RES-007` (not yet defined) and `RES-005.2b` (not yet an owned package) — both are now included, since the Capability Authorisation Gate (§7) cannot open without them. The Capability Authorisation Gate (§7) is the final, external gate.

## 6. Parallel Execution Opportunities

All conclusions here are drawn directly from the Decision Register's own `Dependencies` fields, cross-checked in `ENG-P2-000B` §3 (Complete Dependency Graph) — none are inferred beyond that already-completed cross-check.

- **`RES-004` (`DEC-ID-003`) can start immediately, in parallel with `RES-001`.** The Register's own field reads `Dependencies: —` for this decision; it is a self-contained Founder judgment call already flagged as ready ("founder agenda Batch C").
- **`RES-006` (`DEC-PROD-012`) can start immediately, in parallel with `RES-001`.** No dependency edge exists between it and `EXT-TECH-001`/`DEC-SEC-001`/`DEC-PROV-004`/`DEC-ID-003` in the Register.
- **`RES-007` (`DEC-DATA-007`) can start immediately, in parallel with `RES-001`.** The Register's own field reads `Dependencies: —` for this decision; it requires no Founder involvement (`Founder decision required: No`) and no external evidence.
- **`RES-005.1` (`DEC-LEGAL-005` documentation correction) can start immediately.** It is a text correction against already-established evidence (`ENG-P2-000A` §6); it has no technical dependency on any decision closing first.
- **`RES-005.2a` (Blueprint §3.3 text correction) can start immediately.** The conflict and its correct target shape (TRD10 §10.5) are already established facts, independent of the OTP or profile decisions.
- **`RES-005.2b` (`baseMetadata.ts` code correction) can start once `RES-005.2a` closes, in parallel with `RES-001`–`004`/`006`/`007`.** It depends only on the Blueprint text being corrected first (so the code has a single, unambiguous target shape to conform to), not on any of the OTP or Founder decisions.
- **`RES-005.3` (Programme table synchronisation) cannot start until `RES-002`, `RES-003`, `RES-004`, `RES-006`, `RES-007`, and `RES-005.2b` have all closed** — updating the table before then would itself introduce a new inaccuracy, the same class of error `ENG-P2-000B` found in the original flat "Blocked" framing.

## 7. Capability Authorisation Gate

`ENG-P2-001` — Customer Identity Implementation may begin **only when all of the following are objectively verifiable against live repository/register state:**

1. `EXT-TECH-001` status in the External Dependencies Register is `EVIDENCE_RECEIVED` or `CLOSED` (not `PENDING`).
2. `DEC-PROV-004` status in the Decision Register is a Final Decision with `Approved by` recorded, including the Founder countersign this plan's `RES-002` correction requires.
3. `DEC-SEC-001` status in the Decision Register is a Final Decision with the Founder countersign its own fields already require.
4. `DEC-DATA-007` status in the Decision Register is a Final Decision (from `RES-007`). **Included per `ENG-P2-000B`'s corrected §7 finding:** although `DEC-DATA-007` has no dependency of its own and is independently actionable, the Programme's own table lists it as a current Decision Dependency and Precondition for `ENG-P2-001` — it must close before the gate is satisfied, not merely before it is convenient to close.
5. `DEC-ID-003` status in the Decision Register is a Final Decision (from `RES-004`).
6. `DEC-PROD-012` status in the Decision Register is a Final Decision, or a formally recorded defer-and-omit adoption (from `RES-006`) — included because `ENG-P2-001`'s own scope includes "profile," and the Register names this decision as blocking profile schema freeze specifically.
7. The Version 1 Engineering Blueprint §3.3 and `functions/src/shared/metadata/baseMetadata.ts` both conform to TRD10 §10.5's shape (from `RES-005.2a` and `RES-005.2b`, both owned work packages in §3/§4 of this plan, not merely a plan document) — per `ENG-P2-000` §13's finding that this conflict "blocks any Phase 2 work package from persisting a document at all."
8. The Engineering Implementation Programme's Phase 2 Work-Packages table (from `RES-005.3`) reflects the state confirmed in items 1–7 above — a verification step, not itself a substantive blocker.

**Explicitly not required by this gate:** `DEC-LEGAL-005`'s underlying Founder+legal-adviser decision. Per the Decision Register's own fields (confirmed by `ENG-P2-000`/`ENG-P2-000A`), it blocks "registration policy text," not `ENG-P2-001`'s technical build — only the Programme's documentation text needs correcting (`RES-005.1`), not the decision itself, for this gate to open.

## 8. Risks

Only remaining execution risk is addressed here — no previously closed analysis is repeated.

- **Founder countersign bottleneck on `RES-002`/`RES-003`:** both decisions require Founder countersign in sequence after Engineering Lead work completes; if Founder availability is constrained, this could stall the one genuinely sequential chain even after the underlying technical work is done.
- **`RES-005.2b` executed without `RES-005.2a` closing first:** if the code correction is attempted before the Blueprint §3.3 text itself is corrected, the implementer would be conforming to an as-yet-uncorrected document, risking the same class of drift `ENG-P2-000A` originally found. This is why `RES-005.2a` → `RES-005.2b` is modeled as its own sequential pair (§5), not two independent parallel items.
- **`RES-005.3` performed prematurely:** if the Programme table is synchronized before all of `RES-002`/`003`/`004`/`006`/`007`/`005.2b` have genuinely closed (rather than merely being in progress), it would reintroduce a documentation inaccuracy of the same kind this resolution programme exists to correct.
- **`RES-006`/`RES-007` treated as optional because they are not in the brief's named list:** since both work packages were added by this plan rather than named in the task brief, there is a risk a future reader treats them as discretionary; §3's evidence trail and §7 items 4/6 are written to make clear both are required gate items, not optional additions.

## 9. Success Criteria

The Resolution Programme (not this document) is successful when:

1. All work packages (`RES-001`–`007`, with `RES-005` counted as its four sub-items `005.1`/`005.2a`/`005.2b`/`005.3`) have reached their individually stated completion criteria (§4).
2. The Engineering Implementation Programme's Phase 2 Work-Packages table accurately reflects that state (`RES-005.3`).
3. No new Founder decision was created in the course of executing this plan — only the four pre-existing D1 decisions (`DEC-SEC-001`, `DEC-PROV-004`, `DEC-ID-003`, `DEC-DATA-007`) plus `DEC-PROD-012` and the already-established `BaseMetadata`/`DEC-LEGAL-005` corrections were resolved.
4. The Capability Authorisation Gate (§7) can be verified as satisfied purely by reading live repository/register state — no interpretation or inference required.

## 10. Exit Criteria

The evidence that demonstrates Capability 2 is authorized for implementation is a single, reproducible check against live repository state: all eight items in §7's Capability Authorisation Gate read as satisfied when the Decision Register, External Dependencies Register, `baseMetadata.ts`, the Version 1 Engineering Blueprint §3.3, and the Engineering Implementation Programme's Phase 2 table are inspected directly. No separate authorization report is required beyond this verification — the gate is the exit criterion.

## 11. Constraints Observed

Per this task's own brief: the Engineering Implementation Programme was not redesigned; CDR-001 was not redesigned; no completed readiness work (`ENG-P2-000`/`ENG-P2-000A`/`ENG-P2-000B`) was reopened or re-analyzed; no new Founder decision was created (`RES-004`/`RES-006`/`RES-007` route pre-existing, already-registered decisions to the Founder or Engineering Lead — they do not create new ones); no unrelated repository file was modified; the current repository architecture is unchanged. No code was implemented and `ENG-P2-001` has not begun — `RES-005.2b` is a defined, owned work package for a future code change, consistent with how `RES-001`–`004`/`006`/`007` are also defined-but-not-yet-executed.

## 12. Risks From This Document Itself

None — this is a read-only planning document; no code, governance document, decision, or CDR-001 content was changed by producing it.

## 13. Assumptions

- `RES-002` and `RES-003` are presented as a strict sequential chain per `ENG-P2-000B`'s own corrected finding; the Ownership Matrix (§4) presents them separately for the brief's required RES-002/RES-003 split, while §5's diagram makes explicit that `RES-002` internally contains the governance-prerequisite sub-step `ENG-P2-000B` identified as a precondition to sequential closure.
- `RES-006`'s and `RES-007`'s inclusion are judgment calls, not directly instructed items — each justified at its own entry (§3) with a specific evidence trail, per the task's "do not invent additional work unless supported by repository evidence" constraint, and flagged distinctly rather than folded silently into the brief's named list. `RES-007` was added during pre-merge review after the original draft named `DEC-DATA-007` in the Capability Authorisation Gate (§7) without assigning it any owning work package — the gap was found and closed before merge, not present in this plan's final form.

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
