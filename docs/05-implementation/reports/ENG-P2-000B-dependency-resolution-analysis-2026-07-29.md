> **Title:** ENG-P2-000B — Dependency Resolution Analysis
> **Status:** Complete. Analysis exercise only — no code implemented, no governance document modified, no Founder decision created or resolved.
> **Date:** 2026-07-29
> **Classification:** Dependency-graph analysis. Determines whether the graph is correct and what a deterministic resolution path looks like. Does not itself authorize implementation or resolve any decision.

# ENG-P2-000B — Dependency Resolution Analysis

## 1. Executive Summary

The dependency chain blocking Capability 2 (Customer Identity) is narrower and more differentiated than the Engineering Implementation Programme's flat "Blocked — depends on Phase 1 and 4 D1 decisions" status communicates. Of the four D1 decisions, only **two** (`DEC-SEC-001`, `DEC-PROV-004`) are genuinely gated on external evidence (`EXT-TECH-001`, a real-world Firebase/Burundi OTP delivery proof); the other two (`DEC-DATA-007`, `DEC-ID-003`) have **zero dependency** on anything and are resolvable today through ordinary governance action. The reported `DEC-SEC-001`/`DEC-PROV-004` "circular dependency" is, on close reading of both decisions' actual content, better understood as a **sequencing dependency mediated by a shared external gate**, not a true unresolvable deadlock — the Decision Register's `Dependencies` field simply has no way to express "co-resolved once shared evidence lands," so it records a mutual reference that reads as circular without being one in practice. `DEC-LEGAL-005` sits outside this chain entirely — its dependency is `EXT-LEG-004` (a Burundi legal review), unrelated to `EXT-TECH-001`, and per the Register's own words it blocks "registration policy text," not `ENG-P2-001`'s technical build.

**The single unresolved item that structurally prevents any Customer Identity engineering work from starting is `EXT-TECH-001`.** Everything downstream of it (`DEC-PROV-004`, then `DEC-SEC-001`) cannot close without it. `DEC-DATA-007` and `DEC-ID-003` do not depend on it and could close in parallel today without touching the external-proof chain at all. **Two corrections to this report's original analysis, made before merge:** (1) the literal `DEC-PROV-004`↔`DEC-SEC-001` `Dependencies` edge is authoritative under the Register's own governance rules and cannot simply be reasoned around — a formal governance action is required before either can close sequentially (§4, §5 Step 2); (2) `DEC-PROV-004` (choosing the customer OTP delivery route) affects authentication behavior and therefore requires Founder countersign under the Register's general approval rule (§1: "Engineering, provider and legal items are approved by their named owner and, where they affect product behavior, countersigned by the founder"), not the "no Founder involvement" reading this report originally drew from the absence of a decision-specific field (§6).

## 2. EXT-TECH-001 Analysis

- **What it is:** an entry in the [External Dependencies Register](../../00-governance/decisions/external-dependencies-register.md), Category "Technical Proof": *"Firebase phone-OTP delivery to Burundi numbers: reliability, cost, abuse controls, test-number strategy."*
- **Where it is defined:** `docs/00-governance/decisions/external-dependencies-register.md`, row `EXT-TECH-001` (the register's sole authoritative source — it is also referenced, not redefined, in six report files and the Decision Register's `Dependencies` fields for `DEC-SEC-001`/`DEC-PROV-004`).
- **What capability it governs:** Capability 2 (Customer Identity) — specifically customer authentication and OTP delivery route selection. The register's own `Blocks` field states: `DEC-SEC-001, DEC-PROV-004; customer registration`.
- **Which documents reference it:** `decision-register.md` (`DEC-SEC-001` and `DEC-PROV-004` `Dependencies` fields), `external-dependencies-register.md` (its defining row), and five implementation reports (`engineering-transition-phase-0b-report-2026-07-17.md`, `eng-decision-sprint-2-report-2026-07-17.md`, `phase-3-decision-register-report-2026-07-16.md`, `engineering-readiness-review-phase-0d-2026-07-19.md`, `engineering-decision-closure-recommendations.md`) plus `ENG-P2-000A`'s own reconciliation report and `IMPLEMENTATION_CHANGES.md`.
- **Current status:** `PENDING` (per the register's own `Status` column — one of four defined values: PENDING / IN_PROGRESS / EVIDENCE_RECEIVED / CLOSED). No evidence has been filed; the `Evidence location` cell reads `— (to be filed on receipt)`.
- **Owner:** Engineering Lead (per the register's `Owner` column).
- **Provider / adviser:** Firebase/Google + local carriers (per the register's `Provider / adviser / authority` column) — this is genuinely external; no repository document can substitute for it.
- **Its own dependencies:** none — it is a root node. Nothing in the repository is required before this evidence-gathering can begin; it depends only on Engineering Lead action against a third-party provider.
- **Whether it remains unresolved:** yes. Confirmed via direct read of the register (`Status: PENDING`) — not inferred from the decisions that depend on it.

## 3. Complete Dependency Graph

All relationships below are read directly from each item's own `Dependencies` field in the Decision Register or External Dependencies Register — none inferred.

```
EXT-TECH-001 (external, PENDING, owner: Engineering Lead)
   │
   ├──► DEC-PROV-004 (OPEN_PROVIDER, owner: Engineering Lead)  ◄─┐
   │                                                              │ mutual reference
   └──► DEC-SEC-001  (OPEN_ENGINEERING, owner: Engineering Lead,│  (§4)
                       Founder countersign only)  ─────────────┘

DEC-DATA-007 (OPEN_ENGINEERING, owner: Engineering Lead)
   — Dependencies: none —

DEC-ID-003 (OPEN_FOUNDER, owner: Founder + Engineering)
   — Dependencies: none —

DEC-LEGAL-005 (OPEN_LEGAL, owner: Founder + legal adviser)
   │
   └──► EXT-LEG-004 (external, Burundi legal review — separate register row,
                      unrelated to EXT-TECH-001)
```

**Direct dependencies** (explicitly named in a `Dependencies` field):
- `DEC-SEC-001` → `EXT-TECH-001`; `DEC-SEC-001` → `DEC-PROV-004`.
- `DEC-PROV-004` → `EXT-TECH-001`; `DEC-PROV-004` → `DEC-SEC-001`.
- `DEC-LEGAL-005` → `EXT-LEG-004`.
- `DEC-DATA-007` → none (`Dependencies: —`).
- `DEC-ID-003` → none (`Dependencies: —`).

**Indirect dependencies** (not stated on the decision itself, but present through the Engineering Implementation Programme's work-package preconditions):
- `ENG-P2-001` (Capability 2's core work package) indirectly depends on `EXT-TECH-001` through `DEC-SEC-001`/`DEC-PROV-004`, both named as its Decision/Provider Dependencies in the Programme's Phase 2 Work-Packages table.
- `ENG-P2-004` (role/permission resolution) depends directly on `DEC-ID-003` (named in the Programme table) and structurally on `ENG-P2-001..003` completing first (a work-sequencing precondition, not a decision dependency).

**Informational references** (mentioned in a governing document but not a hard blocking relationship):
- The Programme's Phase 2 profile states "Legal Dependencies: None direct (`DEC-LEGAL-005`... is D3/pilot-tier, not a Phase 2 blocker)" — already established by `ENG-P2-000A` §6 as a **Repository Error** (the Register's own fields say `Priority: D2`, `Required by: Phase 2`). This is a documentation inconsistency, not a dependency-graph edge; `DEC-LEGAL-005` has no `Dependencies`-field link to any of `DEC-SEC-001`/`DEC-PROV-004`/`DEC-DATA-007`/`DEC-ID-003`/`EXT-TECH-001`, and none was found by this analysis.

## 4. Circular Dependency Assessment

**Finding: this is a sequencing dependency mediated by a shared external gate, recorded in a way that superficially resembles a circular dependency — not a genuine unresolvable deadlock.**

Evidence for this conclusion, read directly from each decision's own question text:

- `DEC-PROV-004`'s decision question is narrow: *"Firebase-native OTP vs external SMS route for Burundi numbers."* This is answerable directly from `EXT-TECH-001`'s evidence (delivery reliability/cost/abuse-control data for each route) — it does not require knowing `DEC-SEC-001`'s outcome first.
- `DEC-SEC-001`'s decision question is broader: *"Confirm Firebase phone OTP as primary customer authentication... and define the fallback... if OTP delivery proves unreliable/costly."* Confirming the primary approach and, specifically, defining the **fallback**, is more naturally decided *after* the delivery route is known (i.e., after `DEC-PROV-004`), because the fallback's design depends on which route was chosen and why.

Read this way, the two decisions have a natural one-directional order — `DEC-PROV-004` first, `DEC-SEC-001` second — both gated on the same upstream evidence (`EXT-TECH-001`). The Decision Register's `Dependencies` field, however, has no vocabulary for "resolve together, in this order, once shared evidence exists" — it only supports a flat list of IDs. The result is that each decision's `Dependencies` field names the other, which, read as a strict prerequisite graph, looks like `A needs B AND B needs A` — a textbook deadlock. But neither decision's own question text actually requires the *final, confirmed value* of the other to be computed; `DEC-PROV-004` only needs `EXT-TECH-001`, and `DEC-SEC-001` only benefits from `DEC-PROV-004`'s answer for the fallback design, which is a **sequencing preference**, not a computational precondition.

**Classification: primarily a repository modelling issue** (the `Dependencies` field's schema cannot express ordered co-resolution against a shared external gate), **secondarily a sequencing dependency** (there is a natural, non-circular order: `EXT-TECH-001` → `DEC-PROV-004` → `DEC-SEC-001`). It is **not** a genuine circular dependency in the sense of two decisions that cannot be computed without each other's final value, and it is **not** a pure documentation issue — the fields are accurate as written, just insufficiently expressive for this relationship. This finding is disclosed, not acted on: no change was made to the Decision Register's schema or either decision's fields, consistent with this task's constraints.

**Correction made before merge — this classification is not, by itself, an executable instruction.** The Register's own `Dependencies` field is the authoritative dependency graph (§1: agents "may never select an option, assume a recommendation is approved, or infer a decision from an example"). Concluding from the decisions' question text that `DEC-PROV-004` does not really need `DEC-SEC-001`'s final value does not remove the recorded edge — `DEC-PROV-004`'s own `Dependencies` field still literally lists `DEC-SEC-001`, which remains open until Step 3 of §5. A sequential closure of Step 2 then Step 3, as this report's own resolution order proposes, is therefore **not executable as written under the current, unamended Register** without a prior formal governance action. §5's Step 2 has been revised to require this action explicitly, rather than treating the question-text reasoning above as itself sufficient authorization to proceed.

## 5. Resolution Order

Assuming no new engineering work begins (i.e., this addresses only the governance/evidence steps, not `ENG-P2-001`/`004`'s own build work):

| Step | Required action | Owner | Expected outcome |
|---|---|---|---|
| 1 | Obtain `EXT-TECH-001` evidence: Firebase phone-OTP delivery to Burundi numbers — reliability, cost, abuse controls, test-number strategy — from Firebase/Google and local carriers. | Engineering Lead | External Dependencies Register status: `PENDING` → `EVIDENCE_RECEIVED`; evidence filed per the register's own "Evidence location" convention. |
| 2 | **Governance prerequisite, added by pre-merge correction.** Before `DEC-PROV-004` can close, formally address its literal `Dependencies: EXT-TECH-001; DEC-SEC-001` field — this report's §4 reasoning that `DEC-PROV-004` does not need `DEC-SEC-001`'s final value is not itself authorization to bypass the recorded edge. Choose one: (a) the Engineering Lead formally records, in the Decision Register, that `DEC-PROV-004` is resolved using `EXT-TECH-001` evidence alone, correcting/waiving the `DEC-SEC-001` edge; or (b) `DEC-PROV-004` and `DEC-SEC-001` are closed together as a single combined governance action rather than two sequential ones. | Engineering Lead (a); Engineering Lead + Founder (b) | The literal circular edge no longer blocks Step 3/4 from proceeding, by an explicit governance action rather than by this report's own inference. |
| 3 | Using Step 1's evidence and Step 2's governance action, decide `DEC-PROV-004` (Firebase-native OTP vs. external SMS route for Burundi numbers), then route to the Founder for countersign. | Engineering Lead, then Founder (countersign) | `DEC-PROV-004`: `OPEN_PROVIDER` → Founder-countersigned Final Decision. **Corrected by pre-merge review:** this decision affects authentication behavior and therefore requires Founder countersign under the Register's general approval rule (§1), not "no Founder involvement" as this report originally stated (see §6). |
| 4 | Using Steps 1–3, confirm `DEC-SEC-001` (primary authentication approach + fallback definition), then route to the Founder for the countersign the decision's own fields require. | Engineering Lead, then Founder (countersign only) | `DEC-SEC-001`: `OPEN_ENGINEERING` → Founder-countersigned Final Decision. |
| 5 *(parallel, no dependency on 1–4)* | Decide `DEC-DATA-007` (loyalty-number/QR generation algorithm). | Engineering Lead | `DEC-DATA-007`: `OPEN_ENGINEERING` → recorded Final Decision; independently actionable today. |
| 6 *(parallel, no dependency on 1–4)* | Decide `DEC-ID-003` (permission inheritance semantics) — already on "founder agenda Batch C" per the decision's own Notes field. | Founder (with Engineering) | `DEC-ID-003`: `OPEN_FOUNDER` → recorded Final Decision; independently actionable today. |
| 7 *(does not block `ENG-P2-001`/`004` technical start; blocks registration policy text and the Phase 2/14 legal gate only)* | (a) Correct the Programme's Phase 2 profile's `DEC-LEGAL-005` "D3/pilot-tier, not a Phase 2 blocker" mischaracterization (documentation-only fix); (b) separately pursue `EXT-LEG-004` (Burundi legal adviser review) to resolve the underlying decision itself. | (a) Engineering/governance; (b) Founder + legal adviser | (a) Programme text matches the Register's own `Priority: D2`/`Required by: Phase 2` fields; (b) `DEC-LEGAL-005`: `OPEN_LEGAL` → Final Decision. |
| 8 *(after 3–6 close)* | Synchronize the Engineering Implementation Programme's Phase 2 Work-Packages table: update `ENG-P2-001`/`ENG-P2-004` Status and Blocking Reason cells — including `DEC-DATA-007`, which must also close before `ENG-P2-001` unblocks (§7) — to reflect which decisions have actually closed. | Engineering/governance | Programme table stops stating a flat "Blocked" against decisions that have since resolved. |

Steps 1→2→3→4 form the only genuinely sequential chain (each requires the prior step's output, and Step 2 is itself a required governance action, not a formality). Steps 5 and 6 are fully independent and can run at any time, including now, in parallel with Steps 1–4. Step 7(a) is independent and low-effort; Step 7(b) is independent of the `EXT-TECH-001` chain entirely (a different external dependency, `EXT-LEG-004`). Step 8 is a pure repository-synchronization action that only makes sense once at least some of Steps 3–6 have actually closed.

## 6. Founder Decision Preparation

| Item | Category | Basis |
|---|---|---|
| `DEC-ID-003` | **Founder decision** (full) | Register field: `Founder decision required: Yes`; owner `Founder (with Engineering)`. |
| `DEC-SEC-001` | **Founder decision** (countersign only — lighter-weight than a full decision) | Register field: `Founder decision required: Countersign only`; owner `Engineering Lead`. |
| `DEC-PROV-004` | **Engineering task + Founder countersign** | Owner: `Engineering Lead`. This decision's compact-format Register entry does not include an explicit per-decision `Founder decision required` field (unlike the full-format entries for `DEC-ID-003`/`DEC-SEC-001`) — an earlier draft of this report read that omission as "no Founder involvement," consistent with `ENG-P2-000A`'s same reading. **Corrected by pre-merge review:** the Register's §1 governance rule applies register-wide regardless of whether a specific entry restates it: *"Engineering, provider and legal items are approved by their named owner and, where they affect product behavior, countersigned by the founder."* `DEC-PROV-004` selects the customer OTP delivery route, which directly determines authentication behavior — it therefore requires Founder countersign under this general rule, and the earlier "no Founder involvement" reading is withdrawn. |
| `DEC-DATA-007` | **Engineering task** | Register field: `Founder decision required: No`; owner `Engineering Lead`. |
| `EXT-TECH-001` evidence gathering | **Engineering task** | Register field: `Owner: Engineering Lead`; this is evidence-gathering against an external provider, not a decision. |
| Programme's `DEC-LEGAL-005` "D3/pilot-tier" text | **Documentation correction** | Established as Repository Error by `ENG-P2-000A` §6 — no Founder or Engineering decision involved, only a text correction to match the Register's own fields. |
| `DEC-LEGAL-005` itself (the underlying minimum-account-age/children's-data decision) | **Founder decision**, gated on a **separate external dependency** (`EXT-LEG-004`, not `EXT-TECH-001`) | Register field: `Owner: Founder + legal adviser`. |
| Phase 2 Work-Packages table Status/Blocking Reason cells | **Repository synchronization** | No decision or Founder action — a bookkeeping update to be performed once the decisions above actually close, not before. |

## 7. Capability Impact

**Avoiding the general "Phase 2 is blocked" framing, the precise, current blocking chain for each affected work package is:**

- **`ENG-P2-001` (customer identity — auth, profile, loyalty number, QR) currently has three open items against it in the Programme's own Decision/Provider Dependencies and Blocking Reason cells: `DEC-SEC-001`, `DEC-PROV-004`, and `DEC-DATA-007` — all three must close before `ENG-P2-001` unblocks.** **Corrected by pre-merge review:** an earlier draft of this section said `ENG-P2-001` was blocked by "exactly two" items, which understated the current blocking set by treating `DEC-DATA-007` as not counting because it has no dependency of its own. Having zero dependencies makes `DEC-DATA-007` independently *actionable* — it does not make it cease to be one of the three items the Programme requires closed before `ENG-P2-001` unblocks. Of the three, only two (`DEC-SEC-001`, `DEC-PROV-004`) sit in the externally-gated chain: `EXT-TECH-001` (unresolved, `PENDING`) → governance prerequisite (§5 Step 2) → `DEC-PROV-004` → `DEC-SEC-001` (each requiring Founder countersign, §6). `DEC-DATA-007` has no such gate and could close today, but `ENG-P2-001` remains blocked until it actually does.
- **`ENG-P2-004` (role context and permission resolution) is blocked by `DEC-ID-003`, a standalone Founder decision with zero dependencies**, plus its own structural precondition that `ENG-P2-001..003` complete first (unrelated to any decision — a work-sequencing precondition, and itself the subject of the CDR-001 interleaving finding disclosed in the corrected `ENG-P2-000` report, §10).
- **No engineering work package in Capability 2 is currently blocked by `DEC-LEGAL-005`** — its own Register fields state it blocks "registration policy text," not a named work package's Decision or Provider Dependencies. `ENG-P2-000A`'s finding that the Programme's contrary framing ("not a Phase 2 blocker") is itself a Repository Error stands, but correcting that error would not change which work packages are blocked — only the Programme's stated reasoning about `DEC-LEGAL-005`.

**In one sentence:** the single item structurally preventing any Customer Identity engineering work from beginning is `EXT-TECH-001`; everything else currently marked "Blocked" against Capability 2 either flows from that one external gate (`DEC-PROV-004`, `DEC-SEC-001`) or is independently open with no blocking dependency at all (`DEC-DATA-007`, `DEC-ID-003`).

## 8. Final Recommendation

- **Is the dependency graph internally consistent?** Mostly yes. Every `Dependencies` field checked against its counterpart is mutually consistent — `EXT-TECH-001`'s own `Blocks` field names exactly `DEC-SEC-001, DEC-PROV-004`, matching both decisions' own `Dependencies` fields naming `EXT-TECH-001` back. The one genuine imprecision is the `DEC-SEC-001`↔`DEC-PROV-004` mutual reference (§4), which is a repository modelling limitation, not a logical contradiction — it does not deadlock *permanently*, because a valid resolution order exists (`EXT-TECH-001` → `DEC-PROV-004` → `DEC-SEC-001`). It does, however, remain literally blocking until the formal governance action in §5 Step 2 is taken — this report's own reasoning about the natural order is not itself sufficient to unblock it, a distinction an earlier draft of this section did not make clearly enough.
- **Is the current sequencing optimal?** No. The Programme currently presents all four D1 decisions as a single undifferentiated blocking set ("the largest concentration of D1 blockers of any phase"), which obscures that `DEC-DATA-007` and `DEC-ID-003` have zero dependency on anything and could close today, in parallel with the `EXT-TECH-001` evidence-gathering effort, without waiting on it at all.
- **Does an alternative sequencing exist without redesigning the programme?** Yes. Run Steps 5 and 6 (§5) — `DEC-DATA-007` and `DEC-ID-003` — immediately and in parallel with Step 1 (`EXT-TECH-001` evidence-gathering) and Step 2 (the governance-waiver prerequisite), rather than treating the four decisions as a single collective gate. This requires no new engineering work package, no change to any decision's own fields, and no Programme redesign — it is a scheduling/prioritization clarification for how the *existing* decisions get worked, not a change to what they are or what they require. It does **not**, however, reduce `ENG-P2-001`'s blocking set below three items (§7) — `DEC-DATA-007` still must close, just not on the `EXT-TECH-001` critical path.

## 9. Risks

- **If `EXT-TECH-001` evidence-gathering is not prioritized because it reads as "one of four equally-blocked decisions":** the true critical path (`EXT-TECH-001` → governance prerequisite → `DEC-PROV-004` → `DEC-SEC-001`) may not receive the urgency it needs relative to `DEC-DATA-007`/`DEC-ID-003`, which are lower-effort and could create a false sense of progress if resolved first without also starting the external evidence-gathering in parallel.
- **If the `DEC-SEC-001`↔`DEC-PROV-004` mutual `Dependencies` field is treated as self-resolving by this report's own question-text reasoning, without the formal governance action §5 Step 2 now requires:** the literal Register edge would remain unaddressed, and any attempt to close `DEC-PROV-004` while `DEC-SEC-001` is still open would proceed without the authorization the Register's own rules require. This risk was raised directly against an earlier draft of this report and is the reason Step 2 was added.
- **If `DEC-PROV-004` is closed without Founder countersign** on the reasoning that its entry has no explicit countersign field: this would violate the Register's general approval rule (§1), since the decision affects authentication behavior. This risk was raised directly against an earlier draft of this report and is the reason §6's classification was corrected.
- **If Step 8 (Programme table sync) is skipped after Steps 3–6 close:** the Programme would continue stating work packages are `Blocked` against decisions that have since resolved, reintroducing the same "flat blocked status" imprecision this analysis found.

## 10. Assumptions

- The natural resolution order `DEC-PROV-004` → `DEC-SEC-001` (§4) is derived from reading each decision's own question text, not from any explicit sequencing field in the Register (the Register has no sequencing field at all) — a different reviewer could reasonably argue the order is interchangeable given both ultimately need the same evidence; this analysis's position is that `DEC-SEC-001`'s fallback-definition component benefits from knowing `DEC-PROV-004`'s answer, which is the basis for placing it second, not a claim that the reverse order is impossible. This ordering preference is explicitly *not* itself an authorization to close the decisions sequentially without the governance action §5 Step 2 requires.
- `DEC-LEGAL-005`'s exclusion from the `EXT-TECH-001`-rooted graph is based on its `Dependencies` field naming only `EXT-LEG-004` — confirmed directly, not assumed.
- **Withdrawn assumption:** an earlier draft treated `DEC-PROV-004`'s lack of an explicit `Founder decision required` field as implying Engineering-only ownership. This is superseded by §6's corrected finding: the Register's general approval rule (§1) applies regardless of whether a specific entry restates it, and `DEC-PROV-004` requires Founder countersign.

## 11. Files Modified

None. This is a read-only analysis; no existing document was edited.

## 12. Commands Executed

`grep -rn "EXT-TECH-001"` across `docs/` to enumerate every referencing document; direct reads of `docs/00-governance/decisions/external-dependencies-register.md` (full file) and `docs/00-governance/decisions/decision-register.md` (full entries for `DEC-ID-003`, `DEC-SEC-001`, `DEC-DATA-007`, plus the compact-format `DEC-PROV-004`/`DEC-LEGAL-005` lines, located via `grep -n` and read directly rather than through truncated excerpts); cross-reference of `EXT-TECH-001`'s `Blocks` field against `DEC-SEC-001`/`DEC-PROV-004`'s own `Dependencies` fields for mutual consistency.

## 13. Dependencies Added

None.

## 14. Configuration Changes

None.

## 15. Rollback Instructions

`git revert` of this task's own commit — a single new report file plus one changes-log append.

## 16. Markdown Dependency Analysis Report

This document: [`docs/05-implementation/reports/ENG-P2-000B-dependency-resolution-analysis-2026-07-29.md`](ENG-P2-000B-dependency-resolution-analysis-2026-07-29.md).

## 17. Changes Log

Updated: [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md).
