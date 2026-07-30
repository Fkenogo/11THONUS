> **Title:** DEC-DATA-007 Dependency & Scope Analysis
> **Version:** 1.0 · **Status:** Analysis only — NOT a decision package, NOT recorded, NOT approved
> **Task:** `RES-005` (Capability 2 Resolution Sprint, `ENG-P2-RES-000`)
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/DEC-DATA-007-dependency-scope-analysis-2026-07-30.md`
> **Prepared:** 2026-07-30

---

## 1. Executive Summary

This document performs a structured dependency and scope analysis for `DEC-DATA-007` ("Loyalty number and QR reference generation"), as required before its engineering decision package is prepared. **It produces no decision package, records no Founder decision, and authorizes no implementation.**

The analysis' central finding is a **scope-framing discrepancy**, disclosed in full at §3: this task's own background describes `DEC-DATA-007` as "the final unresolved foundational decision" in the same sequence as `DEC-PROV-004`, `DEC-SEC-001`, and `DEC-ID-003` — implying comparable Founder-level, identity/trust/permission character. The live Decision Register entry and the Resolution Plan's own `RES-007` work package describe something materially different: an Engineering-Lead-owned, zero-Founder-input, zero-dependency technical decision about an identifier-generation algorithm. Both descriptions are repository-consistent on their own terms; they are simply describing the same DEC ID from two different vantage points (programme sequencing vs. decision substance). This analysis reports the discrepancy rather than silently resolving it in either direction.

Once that framing is separated out, `DEC-DATA-007`'s substantive relationship to the three confirmed decisions is **narrow and indirect**: one inherited constraint from `DEC-SEC-001` (loyalty numbers must survive identity recovery unchanged), one architectural precondition from `DEC-PROV-004` (loyalty-number issuance happens only after canonical identity resolution), and no meaningful relationship to `DEC-ID-003` at all (different actor category — business roles vs. customer identifiers). **Decision readiness: Ready to prepare decision package** — see §5.

## 2. Method

Direct reads performed before analysis: `DEC-DATA-007`'s live Decision Register entry; the Decision Register's `DEC-PROV-004`, `DEC-SEC-001`, `DEC-ID-003` entries; the Resolution Plan (`ENG-P2-RES-000-capability-2-resolution-plan.md`, full document, including §3 `RES-007`, §4 Ownership Matrix, §7 Capability Authorisation Gate); `ENG-P2-000B` (`DEC-DATA-007`'s original dependency-analysis source); PRD2 (`02-customer-registration-and-identity.md`, §4 Identity Components, §8 Loyalty Number Generation, §9 QR Code Requirements, §12 Friends and Family Model); TRD12 (`12-security-and-access-control.md`) §12.5 Account Linking, §12.6 Account Identity Rules (AIR-001–006), §12.42 QR Code Security, §12.43 Loyalty Number Security; the Requirements Traceability Matrix (`grep` for loyalty-number/QR rows); the Engineering Implementation Programme's Phase 2 profile and Decision Dependencies rows; `CDR-001`. **Added during pre-merge review:** `loyalty-code-decision-brief.md` (full document), located via a directory listing of `docs/00-governance/decisions/` that the original research pass did not perform — see §6's disclosed correction.

## 3. Repository Position on `DEC-DATA-007` — As Currently Recorded

**Decision Register entry (live, unchanged by this analysis):**
- `Category: Data · Status: OPEN_ENGINEERING · Priority: D1`
- `Decision question:` Define the loyalty-number format/generation algorithm (opaque, non-sequential, non-revealing) and the QR opaque/signed reference scheme.
- `Context:` PRD2 §8 delegates the algorithm to the TRD; no TRD section specifies it; only constraints exist.
- `Options identified:` to be proposed (random alphanumeric + checksum; signed QR token) — this Register field itself has not been updated, but a concrete, already-drafted proposal exists outside the Register in `loyalty-code-decision-brief.md` (see §6, "Correction applied during pre-merge review").
- `Founder decision required: No · Decision owner: Engineering Lead · Blocks: customer identity issuance`
- `Dependencies: —`

**Resolution Plan's own characterization (`RES-007`, §3):** "The Engineering Lead defines the loyalty-number format/generation algorithm... within the constraints PRD2 §8–9 and TRD12's QR privacy requirements already establish. No Founder decision required." The Ownership Matrix (§4) lists `RES-007`: Owner = Engineering Lead, Supporting Role = none. `ENG-P2-000B` (§5 Step 5, the source `RES-007` traces to) independently reached the same conclusion: `DEC-DATA-007` has "zero dependency on anything and [is] resolvable today through ordinary governance action," alongside `DEC-ID-003` — the two decisions are grouped there only because both are dependency-free and Founder-independent, not because they share subject matter.

**This task's own background section**, by contrast, frames `DEC-DATA-007` as sitting in the same sequence as the three identity/trust/permission decisions and asks for dependency analysis against them "before engineering prepares its decision package," using language ("foundational decision," analysis against decisions governing "customer identity, permissions, verification, trust, or data ownership") that reads naturally as describing a decision of comparable Founder-level, identity-strategy character.

**Both framings are individually accurate — they describe different things.** In the Engineering Implementation Programme's Phase 2 profile and the Resolution Plan's Capability Authorisation Gate (§7), `DEC-DATA-007` is grouped with the other three D1 decisions **because all four gate the same downstream milestone** (`ENG-P2-001`/`ENG-P2-004`), not because they share subject matter or decision authority. `DEC-DATA-007` is a **sequencing peer** of the other three (all four must close before the gate opens) but not a **substantive peer** (it is not a Founder decision, does not touch identity/authentication/permission architecture, and has no Register-recorded dependency on any of them). This distinction is the single most important finding of this analysis and governs everything in §4–§6 below.

## 4. Dependency Analysis

```
DEC-PROV-004 (CONFIRMED)          DEC-SEC-001 (CONFIRMED)          DEC-ID-003 (CONFIRMED — PR #36 open,
  Identity 1 resolution:            Identity Recovery Principles:      pending merge)
  canonical phone → platform          "loyalty participation            Business-side role/permission
  user (Identity 1)                   continues... recovery              model (Owner/Manager/Staff)
       │                              restores continuity"                    │
       │  precondition                       │  inherited constraint         │  NO SUBSTANTIVE
       │  (issuance timing only)             │  (must not redesign)          │  RELATIONSHIP
       ▼                                     ▼                                ▼
  ┌─────────────────────────────────────────────────────────────┐    (different actor
  │  DEC-DATA-007 — Loyalty number / QR generation algorithm     │◄────category: business
  │  (Identity 2 & 3 of PRD2's 5 Customer Identity Components)   │     roles, not customer
  │  Engineering-Lead-owned · No Founder decision · Dependencies: — │   identifiers)
  └─────────────────────────────────────────────────────────────┘
```

**Inherited assumptions (settled by the confirmed decisions; `DEC-DATA-007` must operate within them, not re-derive them):**

1. **Issuance timing, from `DEC-PROV-004`.** `DEC-PROV-004`'s Final Decision establishes "the verified mobile phone number is the customer's canonical identity" and that identity resolution happens via Firebase Phone Sign-In or Google Sign-In. PRD2's own Registration Journey (§5, Step 6) already sequences loyalty-number/QR generation *after* account creation (Step 4) and profile completion (Step 5) — i.e., after canonical identity (Identity 1) is resolved. `DEC-DATA-007` inherits this ordering as a precondition: a loyalty number is generated *for* an already-resolved platform user, never as part of resolving one. This is an existing PRD2 sequencing fact, not something `DEC-PROV-004` newly imposed — `DEC-PROV-004`'s confirmation does not change this precondition, it only removes ambiguity about *what* resolves Identity 1 first.
2. **Persistence through recovery, from `DEC-SEC-001`.** The Founder's recorded Identity Recovery Principles (Register `Final decision`, principle 4: "loyalty participation continues across recovery") and the broader Identity Recovery statement ("recovery restores an existing customer identity; it never creates a replacement identity... retain[ing] loyalty participation, purchase history, rewards, recognition") already foreclose one possible design direction for `DEC-DATA-007`: the loyalty number must never be reissued, rotated, or regenerated as part of any authentication-recovery flow. AIR-003 (TRD12 §12.6, pre-existing, unaffected by `DEC-SEC-001`) independently states the same constraint: "changing a phone number or email shall not change the platform user ID or customer loyalty number." `DEC-DATA-007`'s remaining scope is the *generation algorithm* for a number that, once issued, is already known (by three independent sources — PRD2 §8, AIR-003, and `DEC-SEC-001`'s principles) to be permanent.
3. **No relationship to `DEC-ID-003`.** `DEC-ID-003` governs permission inheritance for *business-side* role contexts (Owner/Manager/Staff acting within a business). `DEC-DATA-007` concerns a *customer-side* identifier with no role or permission semantics at all — PRD2 §12 and TRD12 §12.43 are explicit that a loyalty number carries no authorization ("quoting a loyalty number shall never authenticate," "the loyalty number is an identifier, not a secret"). The two decisions are grouped in the Resolution Plan and Capability Authorisation Gate only because both happen to gate the same milestone and both happen to have no Founder/external dependency — there is no design-level interaction to analyze.

**Not a dependency (verified, not assumed):** the Decision Register's own `Dependencies: —` field for `DEC-DATA-007` is corroborated independently by `ENG-P2-000B` §5 ("`DEC-DATA-007` → none") and by this analysis's own reading of PRD2/TRD12 — no document found conditions the loyalty-number/QR algorithm on any output of `DEC-PROV-004`, `DEC-SEC-001`, or `DEC-ID-003` beyond the two inherited constraints above, both of which are boundary conditions, not open questions `DEC-DATA-007` needs those decisions to answer.

## 5. Scope Boundary

**Already Resolved — must not be reconsidered by `DEC-DATA-007`:**
- That a permanent, unique, non-reused loyalty number exists for every customer (PRD2 §8, pre-existing).
- That the loyalty number must not reveal registration date, country, or sequential customer count (PRD2 §8, pre-existing).
- That the loyalty number is not a secret and never authenticates (AIR-005, AIR-006, TRD12 §12.43, PRD2 §12 — all pre-existing).
- That the loyalty number survives phone/email changes and authentication-recovery events (AIR-003, pre-existing; reinforced by `DEC-SEC-001`'s Identity Recovery Principles, now `CONFIRMED`).
- That the QR code represents only the loyalty identity and must never contain phone number, email, authentication credentials, full profile, or a direct Firestore document path (TRD12 §12.42, pre-existing).
- That loyalty-number/QR generation happens after canonical identity (Identity 1) resolution, per PRD2's existing Registration Journey sequencing and `DEC-PROV-004`'s now-confirmed authentication strategy.
- Any element of `DEC-PROV-004`, `DEC-SEC-001`, or `DEC-ID-003`'s own content — not reopened, reinterpreted, or revisited by this analysis, per this task's explicit constraint.

**Remaining Scope — questions `DEC-DATA-007` must still resolve:**
- The concrete loyalty-number format (e.g., random alphanumeric with checksum, as tentatively noted in the Register's `Options identified` field, or an alternative) that satisfies the non-sequential/non-revealing constraints.
- The concrete QR payload scheme — an opaque public reference vs. a signed lookup token (TRD12 §12.42 permits either: "an opaque public reference or signed lookup value") — including collision handling and lookup mechanism.
- Generation-service ownership and invocation point within the registration flow (PRD2 §5 Step 6).

**Out of Scope — belongs to other work packages or future implementation:**
- Any change to customer authentication mechanisms, identity recovery flows, or the Progressive Trust Model (`DEC-PROV-004`/`DEC-SEC-001` territory).
- Any change to business-side role or permission semantics (`DEC-ID-003` territory).
- The `Identity Domain Service` implementation itself, or any code (`ENG-P2-001`/`ENG-P2-004` territory — explicitly future work, not authorized by this analysis or by `DEC-DATA-007`'s eventual resolution).
- Whether rotating/time-limited QR codes are introduced — TRD12 §12.42 already defers this ("may be introduced if static code abuse becomes material"); this analysis does not pull it into current scope.

## 6. Repository Consistency Review

**Internal consistency:** the repository documents governing `DEC-DATA-007` (PRD2 §8–9, TRD12 §12.42–12.43, AIR-003/005/006, the Decision Register entry, and the Resolution Plan's `RES-007`) are mutually consistent with each other. No contradiction was found among them — unlike the PRD10/PRD1 conflict `DEC-ID-003` existed to resolve, `DEC-DATA-007`'s source documents agree on every constraint; only the generation algorithm itself is undefined.

**Correction applied during pre-merge review — a pre-existing decision brief was missed by this analysis's initial research pass.** `docs/00-governance/decisions/loyalty-code-decision-brief.md` (dated 2026-07-17, pre-dating this Resolution Sprint) already proposes a concrete loyalty-code format (`ABC-234`, with an optional checksum-enhanced `ABC-234-X` variant), a full character-set/ambiguity analysis (§4), an exact-calculation collision-probability table across five customer-count scenarios (§5), and ten planning-level generation requirements including transactional uniqueness checking and automatic retry-on-collision (§7). This document is itself explicitly "decision preparation only... not approved," has not modified the Decision Register, and its own §9 recommends the next step be Founder/Engineering Lead review "through the normal Decision Update Procedure — not through this brief." Its existence does not change §3–§5 above (the scope boundary, dependency analysis, and framing discrepancy are all unaffected — this brief is itself scoped to exactly `DEC-DATA-007`'s Remaining Scope as defined here), but it materially changes §7's "new prerequisites" characterization below, which has been corrected accordingly.

**Outdated assumptions found, disclosed but not corrected (per this task's constraint):**
1. **The Engineering Implementation Programme's Phase 2 "Blocking Reason" row** (`engineering-implementation-programme.md` line 217) still reads "DEC-SEC-001, DEC-DATA-007 OPEN; DEC-PROV-004 OPEN_PROVIDER" and a separate row (line 208) still lists `DEC-ID-003` under a column implying it is not yet closed. `DEC-SEC-001` and `DEC-PROV-004` are now `CONFIRMED`; `DEC-ID-003` is `CONFIRMED` on PR #36 (open, CI-green, pending merge authorization). Only `DEC-DATA-007` itself remains genuinely open. This is the same downstream-tracker staleness already disclosed in the `RES-004A` recording and its predecessors — not a new finding, but directly relevant to any reader using the Programme table to judge `DEC-DATA-007`'s remaining blocking set.
2. **The Requirements Traceability Matrix has no row referencing `DEC-DATA-007` at all.** Several loyalty-number business rules exist in the RTM (`BR-006`, `BR-016`–`BR-018`, `BR-021`, `BR-022`), but none cite `DEC-DATA-007` as their related decision — they cite `DEC-LOY-007`, `DEC-ID-001`, or nothing. This is a traceability gap distinct from `DEC-ID-003`'s situation (which has an RTM row, `AP-008`, that is merely stale) — `DEC-DATA-007` was apparently never linked into the RTM at all. Disclosed as a follow-on item; not corrected here, as RTM structure is a downstream-sync action outside this analysis task's scope.
3. **No wording in `DEC-DATA-007`'s own Register entry, PRD2, or TRD12 is factually outdated** by the confirmation of `DEC-PROV-004`/`DEC-SEC-001`/`DEC-ID-003` — the two inherited constraints identified in §4 were already true before those three decisions were recorded (AIR-003 and PRD2's Friends and Family model both pre-date this Resolution Sprint); their confirmation removes residual doubt but does not change `DEC-DATA-007`'s own text.
4. **The Register's own `Options identified` field is stale relative to `loyalty-code-decision-brief.md`.** The field still reads "to be proposed" even though a concrete proposal has existed in the repository since 2026-07-17. This is a cross-reference gap, not a factual contradiction — the brief itself, correctly, never modified the Register (it says so explicitly in its own §9). Disclosed as a follow-on item for whoever prepares `DEC-DATA-007`'s formal decision package, since that package is the natural place to fold the brief's proposal into the Register's `Options identified` field; not corrected here, as this analysis task modifies no file other than its own artifact.

**No document updates were necessary to complete this analysis** — the scope boundary in §5 is fully derivable from already-consistent, unambiguous source text. No correction was applied to any file other than this new analysis artifact and the required changes-log entry.

## 7. Implementation Prerequisites

**Inherited from Identity Strategy (`DEC-PROV-004`):** none beyond the sequencing precondition in §4.1 — no new prerequisite is created by `DEC-PROV-004`'s confirmation; the ordering was already implicit in PRD2's Registration Journey.

**Inherited from Identity Recovery (`DEC-SEC-001`):** the constraint that generation logic must be idempotent with respect to an existing platform user. **Correction applied during pre-merge review:** the initial draft of this constraint stated it as "invoked exactly once... and never re-invoked," which mischaracterizes idempotency — idempotency does not forbid repeated invocation, it requires that repeated invocations produce the same effect. A registration flow that times out after the server assigns a loyalty number must still allow the client to retry without creating a second assignment. The correct invariant, consistent with `ENG-P1-002`'s already-implemented idempotency-service pattern (`functions/src/shared/idempotency`) and with the pre-existing `loyalty-code-decision-brief.md` §7.6 ("Immutable assignment"), is: **at most one immutable loyalty-number assignment per platform user, with repeat calls returning the existing result.** This is a design constraint to carry into the eventual decision package, not a new prerequisite this analysis creates.

**Inherited from Permission Model (`DEC-ID-003`):** none identified — no permission or role-resolution logic is implicated in loyalty-number or QR generation.

**New prerequisites unique to `DEC-DATA-007` — corrected during pre-merge review to account for `loyalty-code-decision-brief.md` (§6 above):**
1. **Collision-handling strategy — already proposed, not undesigned.** `loyalty-code-decision-brief.md` §5 provides an exact-calculation collision-probability table (0.07% retry rate at 10,000 customers, rising to 7.06% at 1,000,000) and §7.2–7.3 specifies transactional uniqueness checking with automatic retry-on-collision, plus a future-scaling note (expand the codespace if retry rates climb at regional-expansion scale). The remaining prerequisite is to **evaluate and, if sound, adopt this existing proposal** against the constraints newly reconfirmed by §4–§5 above — not to draft a strategy from nothing.
2. **QR lookup/verification mechanism — partially proposed, one sub-choice still open.** The brief's §7.8 states the QR encodes a reference to the loyalty code itself (reducing QR lookup to loyalty-code lookup, per §7.10's "safe customer lookup" requirement), but leaves unresolved — in its own words (§7.8, §8) — whether that reference is a plain opaque token or a signed token, which TRD12 §12.42 permits either way. This narrower sub-choice remains genuinely open; the broader "how does lookup work" question does not.
3. **Enumerated options — already drafted, not absent.** Correcting this analysis's original claim that `DEC-DATA-007`'s Register entry states only "to be proposed" and therefore a future decision package "must draft the actual candidate algorithms/schemes": a concrete format (`ABC-234`/`ABC-234-X`), three character-set alphabet options with exact codespace sizes, and ten generation requirements already exist in `loyalty-code-decision-brief.md`. The remaining prerequisite is to **evaluate and refine the existing proposal** against `DEC-PROV-004`/`DEC-SEC-001`/`DEC-ID-003`'s now-confirmed constraints (§4–§5 above) and carry it into a formal decision package — not to originate candidate options.

## 8. Decision Readiness

**Ready to prepare decision package.**

**Rationale:** the scope boundary in §5 is unambiguous and fully evidence-grounded; no repository conflict exists (§6) comparable to the PRD1/PRD10 conflict `DEC-ID-003` had to reconcile; the two genuine inherited constraints (§4.1–4.2) are boundary conditions a future decision package can simply state and respect, not open questions requiring further upstream resolution; `DEC-DATA-007` has no recorded or discovered dependency on any unresolved item; and — corrected during pre-merge review — candidate algorithms and schemes are **not** absent: `loyalty-code-decision-brief.md` already provides a concrete format proposal, collision analysis, and generation requirements (§6–§7 above). The readiness case is therefore stronger than this analysis's original draft stated: a future decision package's task is to evaluate and formally adopt (or revise) an existing, well-evidenced proposal against the now-confirmed `DEC-PROV-004`/`DEC-SEC-001`/`DEC-ID-003` constraints, and resolve the one narrow open sub-choice (§7, prerequisite 2: plain vs. signed QR token) — not to originate a design from nothing.

**One caveat, disclosed rather than resolved:** the scope-framing discrepancy identified in §3 (Founder-level framing in this task's background vs. the Register's own Engineering-Lead-owned, no-Founder-decision framing) should be resolved explicitly before or during the next task, so that whoever prepares `DEC-DATA-007`'s decision package knows whether a Founder decision is actually being requested (a scope expansion beyond the Register's current field) or whether the existing `Founder decision required: No` / Engineering-Lead-ownership stands. This analysis does not resolve that question itself — it is a governance-ownership question, not an engineering scope question, and this task's own constraints prohibit inventing new governance.

## 9. Files Created or Modified

**Created:** `docs/00-governance/decisions/evidence/DEC-DATA-007-dependency-scope-analysis-2026-07-30.md` (this document). **Modified:** `docs/changes/IMPLEMENTATION_CHANGES.md` (append). **Not modified:** the Decision Register; `DEC-PROV-004`, `DEC-SEC-001`, or `DEC-ID-003`'s entries or decision packages; PRD2; TRD12; the Requirements Traceability Matrix; the Engineering Implementation Programme; any application code; any other document.

## 10. Commands Executed

Live re-read of `DEC-DATA-007`'s Decision Register entry and the `DEC-PROV-004`/`DEC-SEC-001`/`DEC-ID-003` entries; full read of the Resolution Plan (`ENG-P2-RES-000-capability-2-resolution-plan.md`); full read of `ENG-P2-000B`'s `DEC-DATA-007`-relevant sections (`grep -n "DEC-DATA-007"`); read of PRD2 §4–§12 (`02-customer-registration-and-identity.md`); read of TRD12 §12.5–12.7, §12.42–12.43 (`12-security-and-access-control.md`); `grep -n` search of the Requirements Traceability Matrix and Engineering Implementation Programme for `DEC-DATA-007`/loyalty-number/QR references; `git fetch`/`checkout main`/`pull --ff-only` before branching to confirm a clean, synced starting point.

## 11. Dependencies Added

None.

## 12. Configuration Changes

None.

## 13. Risks

None introduced — this is a read-only analysis task; no governance document, decision, or code was changed. The disclosed downstream-tracker staleness (Programme, RTM) and the unresolved scope-framing question (§8 caveat) are pre-existing conditions made explicit by this analysis, not created by it.

## 14. Rollback Instructions

`git revert` of this task's own commit — a single new analysis document plus one changes-log append.

## 15. Markdown Analysis Report

This document: [`docs/00-governance/decisions/evidence/DEC-DATA-007-dependency-scope-analysis-2026-07-30.md`](DEC-DATA-007-dependency-scope-analysis-2026-07-30.md).

## 16. Changes Log

Updated: [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../../changes/IMPLEMENTATION_CHANGES.md).
