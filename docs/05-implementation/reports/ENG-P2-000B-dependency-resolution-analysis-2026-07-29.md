> **Title:** ENG-P2-000B — Dependency Resolution Analysis
> **Status:** Complete. Analysis exercise only — no code implemented, no governance document modified, no Founder decision created or resolved.
> **Date:** 2026-07-29
> **Classification:** Dependency-graph analysis. Determines whether the graph is correct and what a deterministic resolution path looks like. Does not itself authorize implementation or resolve any decision.

# ENG-P2-000B — Dependency Resolution Analysis

## 1. Executive Summary

The dependency chain blocking Capability 2 (Customer Identity) is narrower and more differentiated than the Engineering Implementation Programme's flat "Blocked — depends on Phase 1 and 4 D1 decisions" status communicates. Of the four D1 decisions, only **two** (`DEC-SEC-001`, `DEC-PROV-004`) are genuinely gated on external evidence (`EXT-TECH-001`, a real-world Firebase/Burundi OTP delivery proof); the other two (`DEC-DATA-007`, `DEC-ID-003`) have **zero dependency** on anything and are resolvable today through ordinary governance action. The reported `DEC-SEC-001`/`DEC-PROV-004` "circular dependency" is, on close reading of both decisions' actual content, better understood as a **sequencing dependency mediated by a shared external gate**, not a true unresolvable deadlock — the Decision Register's `Dependencies` field simply has no way to express "co-resolved once shared evidence lands," so it records a mutual reference that reads as circular without being one in practice. `DEC-LEGAL-005` sits outside this chain entirely — its dependency is `EXT-LEG-004` (a Burundi legal review), unrelated to `EXT-TECH-001`, and per the Register's own words it blocks "registration policy text," not `ENG-P2-001`'s technical build.

**The single unresolved item that structurally prevents any Customer Identity engineering work from starting is `EXT-TECH-001`.** Everything downstream of it (`DEC-PROV-004`, then `DEC-SEC-001`) cannot close without it. `DEC-DATA-007` and `DEC-ID-003` do not depend on it and could close in parallel today without touching the external-proof chain at all.

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

## 5. Resolution Order

Assuming no new engineering work begins (i.e., this addresses only the governance/evidence steps, not `ENG-P2-001`/`004`'s own build work):

| Step | Required action | Owner | Expected outcome |
|---|---|---|---|
| 1 | Obtain `EXT-TECH-001` evidence: Firebase phone-OTP delivery to Burundi numbers — reliability, cost, abuse controls, test-number strategy — from Firebase/Google and local carriers. | Engineering Lead | External Dependencies Register status: `PENDING` → `EVIDENCE_RECEIVED`; evidence filed per the register's own "Evidence location" convention. |
| 2 | Using Step 1's evidence, decide `DEC-PROV-004` (Firebase-native OTP vs. external SMS route for Burundi numbers). | Engineering Lead | `DEC-PROV-004`: `OPEN_PROVIDER` → a recorded Final Decision; no Founder involvement identified in its own fields (see §6 disclosure on this). |
| 3 | Using Steps 1–2, confirm `DEC-SEC-001` (primary authentication approach + fallback definition), then route to the Founder for the countersign the decision's own fields require. | Engineering Lead, then Founder (countersign only) | `DEC-SEC-001`: `OPEN_ENGINEERING` → Founder-countersigned Final Decision. |
| 4 *(parallel, no dependency on 1–3)* | Decide `DEC-DATA-007` (loyalty-number/QR generation algorithm). | Engineering Lead | `DEC-DATA-007`: `OPEN_ENGINEERING` → recorded Final Decision; independently actionable today. |
| 5 *(parallel, no dependency on 1–3)* | Decide `DEC-ID-003` (permission inheritance semantics) — already on "founder agenda Batch C" per the decision's own Notes field. | Founder (with Engineering) | `DEC-ID-003`: `OPEN_FOUNDER` → recorded Final Decision; independently actionable today. |
| 6 *(does not block `ENG-P2-001`/`004` technical start; blocks registration policy text and the Phase 2/14 legal gate only)* | (a) Correct the Programme's Phase 2 profile's `DEC-LEGAL-005` "D3/pilot-tier, not a Phase 2 blocker" mischaracterization (documentation-only fix); (b) separately pursue `EXT-LEG-004` (Burundi legal adviser review) to resolve the underlying decision itself. | (a) Engineering/governance; (b) Founder + legal adviser | (a) Programme text matches the Register's own `Priority: D2`/`Required by: Phase 2` fields; (b) `DEC-LEGAL-005`: `OPEN_LEGAL` → Final Decision. |
| 7 *(after 2–5 close)* | Synchronize the Engineering Implementation Programme's Phase 2 Work-Packages table: update `ENG-P2-001`/`ENG-P2-004` Status and Blocking Reason cells to reflect which decisions have actually closed. | Engineering/governance | Programme table stops stating a flat "Blocked" against decisions that have since resolved. |

Steps 1→2→3 form the only genuinely sequential chain (each requires the prior step's output). Steps 4 and 5 are fully independent and can run at any time, including now, in parallel with Steps 1–3. Step 6(a) is independent and low-effort; Step 6(b) is independent of the `EXT-TECH-001` chain entirely (a different external dependency, `EXT-LEG-004`). Step 7 is a pure repository-synchronization action that only makes sense once at least some of Steps 2–5 have actually closed.

## 6. Founder Decision Preparation

| Item | Category | Basis |
|---|---|---|
| `DEC-ID-003` | **Founder decision** (full) | Register field: `Founder decision required: Yes`; owner `Founder (with Engineering)`. |
| `DEC-SEC-001` | **Founder decision** (countersign only — lighter-weight than a full decision) | Register field: `Founder decision required: Countersign only`; owner `Engineering Lead`. |
| `DEC-PROV-004` | **Engineering task** | Owner: `Engineering Lead`. **Disclosure:** this decision's compact-format Register entry does not include an explicit `Founder decision required` field (unlike the full-format entries for `DEC-ID-003`/`DEC-SEC-001`). This classification is drawn from the absence of any Founder owner or countersign language in the entry, consistent with `ENG-P2-000A`'s same reading — it is an inference from omission, not an explicitly stated field value, and is flagged as such rather than presented as directly confirmed. |
| `DEC-DATA-007` | **Engineering task** | Register field: `Founder decision required: No`; owner `Engineering Lead`. |
| `EXT-TECH-001` evidence gathering | **Engineering task** | Register field: `Owner: Engineering Lead`; this is evidence-gathering against an external provider, not a decision. |
| Programme's `DEC-LEGAL-005` "D3/pilot-tier" text | **Documentation correction** | Established as Repository Error by `ENG-P2-000A` §6 — no Founder or Engineering decision involved, only a text correction to match the Register's own fields. |
| `DEC-LEGAL-005` itself (the underlying minimum-account-age/children's-data decision) | **Founder decision**, gated on a **separate external dependency** (`EXT-LEG-004`, not `EXT-TECH-001`) | Register field: `Owner: Founder + legal adviser`. |
| Phase 2 Work-Packages table Status/Blocking Reason cells | **Repository synchronization** | No decision or Founder action — a bookkeeping update to be performed once the decisions above actually close, not before. |

## 7. Capability Impact

**Avoiding the general "Phase 2 is blocked" framing, the precise, current blocking chain for each affected work package is:**

- **`ENG-P2-001` (customer identity — auth, profile, loyalty number, QR) is blocked by exactly two open items in a strict chain: `EXT-TECH-001` (unresolved, `PENDING`) → `DEC-PROV-004` (cannot close without it) → `DEC-SEC-001` (cannot close without `DEC-PROV-004`, plus needs Founder countersign).** `DEC-DATA-007` is also listed against `ENG-P2-001` in the Programme, but it is **not** part of this externally-gated chain — it is open only because it has not yet been decided, not because anything blocks it; it has zero dependencies of its own.
- **`ENG-P2-004` (role context and permission resolution) is blocked by `DEC-ID-003`, a standalone Founder decision with zero dependencies**, plus its own structural precondition that `ENG-P2-001..003` complete first (unrelated to any decision — a work-sequencing precondition, and itself the subject of the CDR-001 interleaving finding disclosed in the corrected `ENG-P2-000` report, §10).
- **No engineering work package in Capability 2 is currently blocked by `DEC-LEGAL-005`** — its own Register fields state it blocks "registration policy text," not a named work package's Decision or Provider Dependencies. `ENG-P2-000A`'s finding that the Programme's contrary framing ("not a Phase 2 blocker") is itself a Repository Error stands, but correcting that error would not change which work packages are blocked — only the Programme's stated reasoning about `DEC-LEGAL-005`.

**In one sentence:** the single item structurally preventing any Customer Identity engineering work from beginning is `EXT-TECH-001`; everything else currently marked "Blocked" against Capability 2 either flows from that one external gate (`DEC-PROV-004`, `DEC-SEC-001`) or is independently open with no blocking dependency at all (`DEC-DATA-007`, `DEC-ID-003`).

## 8. Final Recommendation

- **Is the dependency graph internally consistent?** Mostly yes. Every `Dependencies` field checked against its counterpart is mutually consistent — `EXT-TECH-001`'s own `Blocks` field names exactly `DEC-SEC-001, DEC-PROV-004`, matching both decisions' own `Dependencies` fields naming `EXT-TECH-001` back. The one genuine imprecision is the `DEC-SEC-001`↔`DEC-PROV-004` mutual reference (§4), which is a repository modelling limitation, not a logical contradiction — it does not actually deadlock, because a valid resolution order exists (`EXT-TECH-001` → `DEC-PROV-004` → `DEC-SEC-001`).
- **Is the current sequencing optimal?** No. The Programme currently presents all four D1 decisions as a single undifferentiated blocking set ("the largest concentration of D1 blockers of any phase"), which obscures that `DEC-DATA-007` and `DEC-ID-003` have zero dependency on anything and could close today, in parallel with the `EXT-TECH-001` evidence-gathering effort, without waiting on it at all.
- **Does an alternative sequencing exist without redesigning the programme?** Yes. Run Steps 4 and 5 (§5) — `DEC-DATA-007` and `DEC-ID-003` — immediately and in parallel with Step 1 (`EXT-TECH-001` evidence-gathering), rather than treating the four decisions as a single collective gate. This requires no new engineering work package, no change to any decision's own fields, and no Programme redesign — it is a scheduling/prioritization clarification for how the *existing* decisions get worked, not a change to what they are or what they require.

## 9. Risks

- **If `EXT-TECH-001` evidence-gathering is not prioritized because it reads as "one of four equally-blocked decisions":** the true critical path (`EXT-TECH-001` → `DEC-PROV-004` → `DEC-SEC-001`) may not receive the urgency it needs relative to `DEC-DATA-007`/`DEC-ID-003`, which are lower-effort and could create a false sense of progress if resolved first without also starting the external evidence-gathering in parallel.
- **If the `DEC-SEC-001`↔`DEC-PROV-004` mutual `Dependencies` field is read literally by a future reviewer without this analysis's context:** it could be mistaken for a genuine deadlock requiring a new Founder decision to break, when no such intervention is actually needed — a valid resolution order already exists.
- **If Step 7 (Programme table sync) is skipped after Steps 2–5 close:** the Programme would continue stating work packages are `Blocked` against decisions that have since resolved, reintroducing the same "flat blocked status" imprecision this analysis found.

## 10. Assumptions

- `DEC-PROV-004`'s lack of an explicit `Founder decision required` field is treated as implying Engineering-only ownership (§6) — this is an inference from the absence of Founder-owner language in a compact-format entry, not a directly stated field value, and is disclosed as such rather than presented as confirmed fact.
- The natural resolution order `DEC-PROV-004` → `DEC-SEC-001` (§4) is derived from reading each decision's own question text, not from any explicit sequencing field in the Register (the Register has no sequencing field at all) — a different reviewer could reasonably argue the order is interchangeable given both ultimately need the same evidence; this analysis's position is that `DEC-SEC-001`'s fallback-definition component benefits from knowing `DEC-PROV-004`'s answer, which is the basis for placing it second, not a claim that the reverse order is impossible.
- `DEC-LEGAL-005`'s exclusion from the `EXT-TECH-001`-rooted graph is based on its `Dependencies` field naming only `EXT-LEG-004` — confirmed directly, not assumed.

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
