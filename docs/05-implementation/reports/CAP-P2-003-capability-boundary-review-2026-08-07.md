> **Title:** CAP-P2-003 — Capability 2 Boundary Review (Programme Architecture)
> **Version:** 1.0 · **Status:** Programme-architecture review (evidence + recommendations only; no restructuring) · **Classification:** Working (execution-layer review record)
> **Governing document:** [`CDR-001`](../roadmap/CDR-001-capability-delivery-roadmap.md); [`DEC-IDENTITY-001`](../../00-governance/decisions/decision-register.md); [`IDENTITY-ALIGN-001`](IDENTITY-ALIGN-001-implementation-report-2026-08-01.md); [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md)
> **Source-of-truth path:** `docs/05-implementation/reports/CAP-P2-003-capability-boundary-review-2026-08-07.md`
> **Last controlled update:** 2026-08-07 (`CAP-P2-003` — created)

# CAP-P2-003 — Capability 2 Boundary Review

> **[Disposition marker — `CAP-P2-004` / `DEC-GOV-008`, 2026-08-07]** The Founder adopted this review's evidence-supported **Option C** (in-boundary concern-level completion reporting) — recorded as [`DEC-GOV-008`](../../00-governance/decisions/decision-register.md) and implemented in [`CDR-001` §5](../roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity). Capability numbering and boundaries remain unchanged; Option B (renumbering split) was not adopted. This review's original analysis and conclusion are preserved unchanged as historical evidence.

**A read-only programme-architecture review of whether the current Capability 2 boundary — Customer Identity + Authentication + ITM + `ENG-P2-004`, as one customer-facing capability — remains appropriate now that the Customer Identity concern has matured into a complete, ten-package implementation stream while Authentication and ITM remain unbuilt. No product-architecture redesign, no restructuring, no code, no renumbering. Final conclusion: FOUNDER DECISION REQUIRED. A full renumbering split (Option B) is *not* evidence-supported; the boundary as a customer-facing definition remains sound; the genuine open choice is whether to adopt an in-boundary concern-level closure/reporting refinement (Option C) to handle the maturity asymmetry — a Founder programme-structure judgment.**

## 1. Repository Entry / Final State

- **Entry:** isolated worktree `cap-p2-003` off `origin/main` @ `be958b7f3981cd464c7cc0be5c5798b3d2bc2155` (PR #76 / `ENG-P2-001-02` merge); `0 0` divergence; clean; no locks. Dirty primary checkout untouched. (Note: the `CAP-P2-002` review report is on unmerged PR #77 and is not part of this baseline; its conclusion is referenced from context only.)
- **Final:** unchanged except this review report and its changes-log entry. No programme document, capability identifier, code, or roadmap modified.

## 2. Current Capability Model

Per `CDR-001` §5 (authoritative), **Capability 2 — Customer Identity** is one customer-facing capability comprising three **architectural concerns** (per `DEC-IDENTITY-001`, 2026-08-01) plus a shared work package:

- **Constituent concerns:**
  1. **Customer Identity** — permanent identity triad (Internal Customer ID, Loyalty Number, Customer QR), profile, identity-linking, recovery. Customer-facing.
  2. **Authentication** — providers only (phone OTP, Google, email); proves a returning credential; does not own trust. Customer-facing as a sign-in mechanism.
  3. **Identity Trust Management (ITM)** — **internal-only, never customer-facing**; owns verification, progressive trust, risk-based gating. Explicitly *"not a numbered roadmap capability"* (`CDR-001` §5.3).
- **Engineering packages:** `ENG-P2-001` (currently one work package spanning all three concerns; decomposition along the concerns is future engineering-design work, not performed) and `ENG-P2-004` (role context & permission resolution — shared with Capability 3).
- **Dependencies:** Capability 1; Decision dependencies `DEC-SEC-001`, `DEC-DATA-007`, `DEC-PROV-004`, `DEC-ID-003`, `DEC-IDENTITY-001` (all CONFIRMED); external `EXT-TECH-001` (phone-OTP provider, PENDING) scoped to Authentication/ITM.
- **Governance assumptions:** capabilities are defined by **customer-observable delivery sequencing**, not by architectural concern (`CDR-001` §5 "Why no new top-level capability number"; `IDENTITY-ALIGN-001` §4). A customer experiences registration, authentication, and any verification as **one moment**, so the three concerns sit inside one capability positioned between Capability 1 and Capability 3.

## 3. Evidence Since Original Definition

The programme has matured markedly for the Customer Identity concern specifically:

- **Engineering packages completed:** `ENG-P2-001` decomposed (`ENG-P2-001-PLAN-001`) into **ten** child packages `-01`–`-10`; **all ten implemented, TDD-tested, merged** (PRs through #76).
- **Implementation scale:** ~46 identity-domain source files across `domains/identity`, `loyaltyNumber`, `qrIdentity`, `identityAudit`.
- **Testing maturity:** **420/420** `functions` unit tests + 13 real Firebase Emulator Suite test files on merged `main`; post-merge CI green.
- **Architecture reviews:** `ENG-P2-ARCH-REVIEW-001` (+ `-CORR-001`–`-004`) and `ENG-P2-ARCH-REVIEW-002` (PASS WITH CONDITIONS) — both covering the Customer Identity concern (`-01`,`-03`–`-10`; `-02` post-dates Review-002).
- **Governance decisions:** `DEC-IDENTITY-001` (concern separation), `DEC-PROD-012` (CLOSED, Option D), `F9B-DEC-001` (error taxonomy), FEF adoption.
- **Documentation maturity:** ten implementation reports, `CDR-001`, Programme, Master Workflow, PLAN-001 all synchronised.
- **Operational independence (asymmetry):** the Customer Identity concern is functionally self-contained (identity creation, loyalty number, QR, lifecycle, recovery, linking, lookup, audit) and does **not** depend at runtime on Authentication or ITM (per `DEC-IDENTITY-001`'s Standard Participation Principle: identity exists without verification). **Authentication and ITM have zero implemented packages, no decomposition, and no architecture beyond boundary contracts in `ENG-P2-ARCH-001`.**

## 4. Capability Boundary Assessment

- **Customer Identity** now demonstrates several characteristics of an independently *governable* stream: a bounded domain, its own architecture reviews, ten merged packages, its own test/CI surface, and runtime independence from Auth/ITM. It is *implementation-independent*.
- **However, independent *governability* is not the same as independent *customer-facing capability status*.** `CDR-001` defines a capability as a **customer-observable delivery milestone**, not an implementation stream. By that definition:
  - **Authentication** is customer-facing but is experienced *within the same registration/sign-in moment* as identity — not as a milestone a customer reaches separately after Capability 2 and before Capability 3.
  - **ITM is internal-only and never customer-facing** — by `CDR-001`'s own criterion it *cannot* be a top-level customer capability.
- **Conclusion:** the Customer Identity concern is independently *implementable and reviewable* (evidence-strong), but neither Authentication nor (especially) ITM meets the customer-observable-milestone bar for promotion to a separate top-level capability. The maturity asymmetry is real, but it argues for a **closure/reporting refinement within the boundary**, not for boundary revision.

## 5. Programme Architecture Options

### Option A — Maintain the existing Capability 2 structure (no change)
Keep Customer Identity + Authentication + ITM + `ENG-P2-004` as one capability. **Effects:** governance/roadmap/traceability unchanged; zero migration cost; consistent with `CDR-001` and `DEC-IDENTITY-001`. **Cost:** Capability 2 cannot "close" while Auth/ITM/`ENG-P2-004` are unbuilt; reporting conflates a complete stream with unstarted work (the `CAP-P2-002` NOT-READY tension).

### Option B — Split into Capability 2 (Customer Identity) / Capability 3 (Authentication) / Capability 4 (ITM), renumbering 3–8 onward
**Effects:** lets Customer Identity close independently; cleaner per-concern sequencing. **Costs / evidence against:** (a) **ITM is internal-only** — promoting it to a customer-facing capability directly contradicts `CDR-001`'s capability definition; (b) Authentication is not an independently-sequenced customer milestone; (c) a **large renumbering ripple** across the RTM, Engineering Implementation Programme, Coding-Agent Prompt Register, Capability Authorisation Gate, and `CDR-001` §2/§6/§7/§8 — exactly the "unintended capability renumbering" prior tasks' criteria required avoiding; (d) `DEC-IDENTITY-001` **already considered and declined** this split. **Assessment: not evidence-supported.**

### Option C — Retain the Capability 2 boundary; add an in-boundary concern-level completion/closure model (evidence-supported alternative discovered in review)
Keep the capability number and boundary unchanged, but formally recognise the **Customer Identity concern (`ENG-P2-001`) as an independently-closable sub-stream** with its own concern-completion milestone, while Authentication, ITM, and `ENG-P2-004` remain tracked sub-concerns/work packages inside Capability 2 with their own later gates. **Effects:** resolves the maturity asymmetry and the `CAP-P2-002` reporting tension (a done concern can be recorded "complete" without declaring the whole capability closed); no renumbering; consistent with `CDR-001`'s customer-sequencing principle and with its own note that a future task *may* revisit sequencing. **Cost:** a modest governance addition (a "concern completion" status vocabulary) — a documentation/process change, not a boundary revision. This is the middle path `CDR-001` §5's closing sentence anticipates.

## 6. Impact Assessment (per viable option)

| Dimension | Option A (maintain) | Option B (split + renumber) | Option C (in-boundary concern closure) |
|---|---|---|---|
| Programme governance | Unchanged | Major — new capabilities, authority relationships | Minor — add concern-completion status |
| Engineering planning | Unchanged | New per-capability plans/gates | Unchanged (concern gates within Cap 2) |
| Implementation sequencing | Unchanged | Re-sequenced across 3 capabilities | Unchanged |
| Reporting | Conflated (done + unstarted) | Cleaner per-capability | Cleaner (concern-level) without renumber |
| Roadmap | Unchanged | Renumber 3–8→? ripple | Unchanged |
| Documentation | Unchanged | Broad edits (RTM, Programme, Prompt Register, Gate, CDR-001 §2/§6/§7/§8) | Bounded (status vocabulary + CDR-001 note) |
| Traceability | Unchanged (F11 deferred) | RTM capability-column re-map | Unchanged |
| FEF alignment | Unchanged | Re-map capability→FEF | Minor note |
| Future delivery | Auth/ITM inside Cap 2 | Auth/ITM as own capabilities | Auth/ITM as tracked sub-concerns |

## 7. Migration Impact (if boundaries were changed — Option B, illustrative only; not performed)

- **Documents requiring updates:** `CDR-001` (§2 status table, §5–§8), Engineering Implementation Programme, Coding-Agent Prompt Register, Master Delivery Workflow, RTM (capability column), Capability Authorisation Gate (`ENG-P2-RES-000`), `FEF-ALIGNMENT.md`, Canonical Reference, PRD/TRD cross-references citing capability numbers by position.
- **Engineering identifiers affected:** capability numbers 3–8 (renumbered); potentially `ENG-P3-*`…`ENG-P8-*` prefixes if the programme keys package IDs to capability/phase numbers (would require careful confirmation before any change).
- **Roadmap implications:** every downstream capability's position shifts by one or more.
- **Historical preservation:** all superseded numbering must be preserved (bracket-marker convention), not overwritten.
- **Risks:** high ripple/error surface; contradiction with ITM-internal principle; re-litigating `DEC-IDENTITY-001`.

Option C migration is far smaller: add a concern-completion status to the Programme/status vocabulary and a note to `CDR-001` §5; no identifier or numbering change.

## 8. Recommendation

**No evidence-supported recommendation for a boundary *revision* (Option B) — and clear evidence *against* it.** The repository evidence (ITM internal-only; capabilities defined by customer-observable sequencing; `DEC-IDENTITY-001` already declined the split; renumbering ripple) shows Option B is not warranted.

Between **Option A (strict maintenance)** and **Option C (in-boundary concern-closure refinement)**, the choice is a genuine **Founder programme-structure judgment**: both are consistent with the authoritative capability definition; Option C better resolves the maturity/reporting asymmetry surfaced by `CAP-P2-002` at a modest governance cost, but adopting a new status vocabulary is a Founder call, not one the repository uniquely determines. Per the task's rule, no Founder preference is inferred.

## 9. Overall Analysis Summary

The Customer Identity concern has matured into a complete, independently-implemented, independently-reviewed stream, creating a real asymmetry with the unbuilt Authentication and ITM concerns. That asymmetry is a **reporting/closure-granularity** issue, not a signal that the customer-facing capability boundary is wrong. The boundary itself remains sound under `CDR-001`'s definition; ITM cannot be a customer capability; Authentication is part of the same customer moment. The appropriate response space is A vs. C — a Founder decision.

## 10. Validation

- Repository integrity: `git status` clean; `0 0`; entry SHA `be958b7`.
- Cross-document consistency: `CDR-001` §2/§5, Programme, Master Workflow, `IDENTITY-ALIGN-001`, `DEC-IDENTITY-001`, RTM reviewed and mutually consistent on the current boundary.
- Capability traceability / programme consistency: capability numbering intact (0,1,2…8); no identifier touched.
- Absence of unrelated modifications: only this report + changes-log entry.

## 11. Files Modified

- **Created:** this report.
- **Modified:** `docs/00-governance/documentation-changes-log.md` (Entry 083). No programme document, capability identifier, code, or roadmap changed.

## 12. Commands Executed (significant)

Read-only: `git worktree add`; entry-gate `git fetch`/`rev-list`/`status`; `grep`/`sed`/`find` across `CDR-001`, Programme, `IDENTITY-ALIGN-001`, Decision Register, RTM; `gh`/`git` for baseline evidence. No build/test/code command (review-only, no code touched).

## 13. Dependencies Added / Configuration Changes

None / none.

## 14. Risks

- **Reporting risk (status quo):** Option A leaves the "Capability 2 appears done because ten packages merged" tension unresolved.
- **Over-correction risk:** Option B would introduce a large, error-prone renumbering and contradict the ITM-internal principle.
- **Decision-latency risk:** leaving A-vs-C unresolved keeps the capability's closure/reporting semantics ambiguous.

## 15. Final Gate

**FOUNDER DECISION REQUIRED.**

The current capability *boundary* is not shown by evidence to require revision (Option B is evidence-ruled-out; the customer-facing definition remains sound), but whether to adopt an in-boundary concern-level closure/reporting refinement (Option C) versus strict maintenance (Option A) is a Founder programme-structure judgment the repository informs but does not uniquely determine. No restructuring performed; Authentication, ITM, `ENG-P2-004`, and Capability 2 closure not begun. Stop for Founder review.
