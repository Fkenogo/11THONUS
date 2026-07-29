> **Title:** ENG-P2-000A — Phase 2 Governance Reconciliation
> **Status:** Complete. Read-only reconciliation exercise — no code implemented, no governance document modified, no new Founder decision created.
> **Date:** 2026-07-29
> **Classification:** Governance reconciliation and classification. Recommendation only — does not itself resolve any decision, correct any document, or authorize implementation.

# ENG-P2-000A — Phase 2 Governance Reconciliation

## 1. Executive Summary

This reconciliation re-examined every issue [ENG-P2-000](ENG-P2-000-capability-2-readiness-review-2026-07-29.md) raised, against full, untruncated primary-source evidence rather than the shorter excerpts the original review cited. The exercise **confirms rather than dissolves** the "Not Ready" finding, but **substantially refines its precision**:

- The four D1 decisions are **not a single undifferentiated blocker**. Two (`DEC-DATA-007`, `DEC-ID-003`) have **zero external dependency** and are resolvable today through ordinary governance action — one purely by Engineering, one purely by the Founder. The other two (`DEC-SEC-001`, `DEC-PROV-004`) form a **genuine, previously-undisclosed circular dependency** on each other, and both ultimately gate on a **real-world external technical proof** (Burundi OTP delivery feasibility, `EXT-TECH-001`) that no amount of governance or documentation work can substitute for.
- The `BaseMetadata` conflict is a **genuine, four-point field-shape conflict**, but it is **already resolved at the authority level** — the Blueprint's own governing text states "if this Blueprint and a TRD chapter ever appear to disagree, the TRD chapter governs." TRD10 is therefore already authoritative; no Founder decision is needed. What remains is a mechanical correction — and the already-shipped `ENG-P1-002` code (`baseMetadata.ts`) currently follows the *Blueprint's* naming, not TRD10's, meaning the correction applies to already-merged code, not merely to future Phase 2 work.
- `DEC-LEGAL-005` is a **genuine Repository Error** in the Engineering Implementation Programme: the Programme calls it "D3/pilot-tier, not a Phase 2 blocker," but the Decision Register's own explicit `Priority` field for that exact decision reads **D2**, and its own `Required by phase` field reads **Phase 2**. `D3` is a real, formally-defined priority tier elsewhere in the Register — it is simply the wrong tier for this decision. This changes Phase 2 readiness narrowly: it blocks "registration policy text" specifically (per the Register's own words), not the underlying technical build.

**Updated recommendation: Still Not Ready** — but with a materially clearer, more actionable path than ENG-P2-000 could state, detailed in §10.

## 2. Governance Issues Reviewed

1. `DEC-SEC-001` — Customer authentication approach and fallback
2. `DEC-PROV-004` — Phone OTP delivery route
3. `DEC-ID-003` — Permission inheritance semantics
4. `DEC-DATA-007` — Loyalty number and QR reference generation
5. The `BaseMetadata`/TRD10 §10.5 field-shape conflict
6. The `DEC-LEGAL-005` priority/blocking-status discrepancy between the Decision Register and the Engineering Implementation Programme

## 3. Dependency Reconciliation Matrix

Every dependency the Programme records against Phase 2, traced to its source, its authority, its current status, and whether it genuinely blocks Customer Identity specifically (as distinct from Phase 2's other two work packages, `ENG-P2-002`/`003`, which belong to Business Identity, Capability 3).

| Dependency | Source | Authority | Status | Genuinely blocks Customer Identity? |
|---|---|---|---|---|
| `DEC-SEC-001` | Programme Entry Criteria; `ENG-P2-001` Decision Dependencies | Decision Register (authoritative) | `OPEN_ENGINEERING` | Yes — blocks `ENG-P2-001` |
| `DEC-PROV-004` | Programme Entry Criteria; `ENG-P2-001` Provider Dependencies | Decision Register (authoritative) | `OPEN_PROVIDER` | Yes — blocks `ENG-P2-001` |
| `DEC-DATA-007` | Programme Entry Criteria; `ENG-P2-001` Decision Dependencies | Decision Register (authoritative) | `OPEN_ENGINEERING` | Yes — blocks `ENG-P2-001` |
| `DEC-ID-003` | Programme Entry Criteria; `ENG-P2-004` Decision Dependencies | Decision Register (authoritative) | `OPEN_FOUNDER` | Yes — blocks `ENG-P2-004` |
| `BaseMetadata`/TRD10 §10.5 | Programme Entry Criteria (carried forward from `ENG-P1-002` Technical Review) | TRD10 (authoritative per Blueprint §0's own rule) | Unresolved — code currently non-conforming | Yes — blocks document persistence for both `ENG-P2-001` and `ENG-P2-004` |
| `DEC-LEGAL-005` | Decision Register only (Programme dismisses it) | Decision Register (authoritative) | `OPEN_LEGAL` | Narrowly — blocks "registration policy text" (Register's own words), not the technical build |

`ENG-P2-001` (Customer identity — auth, profile, loyalty number, QR) and `ENG-P2-004` (Role context and permission resolution) are the two work packages [CDR-001](../roadmap/CDR-001-capability-delivery-roadmap.md) maps to Capability 2. **No single dependency blocks both** — `DEC-SEC-001`/`DEC-PROV-004`/`DEC-DATA-007` block only `ENG-P2-001`; `DEC-ID-003` blocks only `ENG-P2-004`. But because every work package in Capability 2 has at least one unresolved dependency, **the union of these dependencies blocks the capability as a whole**, even though no individual dependency does.

## 4. Founder Decision Reconciliation

Each decision's **full, untruncated** Decision Register entry was re-read for this reconciliation — the original ENG-P2-000 review's evidence, while accurate as far as it went, cited only the first five lines of each entry and missed the `Founder decision required`, `Decision owner`, and `Dependencies` fields below.

| Decision | Status | Founder decision required | Decision owner | Dependencies | Blocks | Affects |
|---|---|---|---|---|---|---|
| `DEC-SEC-001` | `OPEN_ENGINEERING` | **Countersign only** | Engineering Lead | `EXT-TECH-001` (Burundi OTP feasibility proof, external); `DEC-PROV-004` | customer registration | `ENG-P2-001` only |
| `DEC-PROV-004` | `OPEN_PROVIDER` | *(not specified — compact-format entry)* | Engineering Lead | `EXT-TECH-001`; `DEC-SEC-001` | customer authentication | `ENG-P2-001` only |
| `DEC-ID-003` | `OPEN_FOUNDER` | **Yes** | Founder (with Engineering) | *(none)* | authorization implementation; freeze | `ENG-P2-004` only |
| `DEC-DATA-007` | `OPEN_ENGINEERING` | **No** | Engineering Lead | *(none)* | customer identity issuance | `ENG-P2-001` only |

**A genuine, previously-undisclosed finding: `DEC-SEC-001` and `DEC-PROV-004` are mutually dependent.** `DEC-SEC-001`'s own `Dependencies` field lists `DEC-PROV-004`; `DEC-PROV-004`'s own `Dependencies` field lists `DEC-SEC-001`. Read strictly, this is a circular dependency — neither can be marked final while the other remains open. In practice this is resolvable because both also depend on the same external proof (`EXT-TECH-001`), meaning they are almost certainly intended to be closed together, as a pair, once that proof exists — but the Register's text does not say this explicitly, and a strict reading of the two `Dependencies` fields alone would deadlock. This is disclosed here as found; this task does not resolve it, only reports it.

**The practical, evidence-based split this reconciliation surfaces:**
- **`DEC-DATA-007` and `DEC-ID-003` have zero dependency on anything outside the repository's own governance process.** `DEC-DATA-007` requires no Founder involvement at all ("Founder decision required: No") and could be closed by an Engineering Lead proposing and confirming a generation algorithm. `DEC-ID-003` requires a real but self-contained Founder judgment call (reconciling two PRD sections) with nothing else blocking it — its own Notes field states it is already on "founder agenda Batch C."
- **`DEC-SEC-001` and `DEC-PROV-004` cannot be closed by governance or documentation work alone.** Both ultimately require `EXT-TECH-001` — an external, real-world technical proof of OTP delivery feasibility in Burundi — which is not a repository artifact and cannot be produced by this or any documentation-only task.

## 5. BaseMetadata Reconciliation

**Sources read in full for this reconciliation:** [TRD10 §10.5](../../02-technical/trd/10-firestore-data-architecture.md) (Standard Document Metadata); [Version 1 Engineering Blueprint §3.3](../../02-technical/version-1-engineering-blueprint.md) (Standard Document Metadata, TRD8 §8.7); the Blueprint's own §0 (Purpose and Status); and the actual shipped code at `functions/src/shared/metadata/baseMetadata.ts`.

**Does a genuine conflict exist? Yes — four concrete differences, read directly from both texts:**

| Field | TRD10 §10.5 | Blueprint §3.3 | Difference |
|---|---|---|---|
| Version field name | `schemaVersion: number` | `version` | Different field name for the same concept |
| Audit-field nullability | `createdBy: string \| null`, `updatedBy: string \| null` (explicit) | Not typed at all — only field names listed | TRD10 specifies nullability; Blueprint is silent |
| Soft-delete/archive fields | `archivedAt?: Timestamp \| null`, `archivedBy?: string \| null` | `deletedAt`, `deletedBy` | Different naming and framing (archive vs. delete) — TRD10's naming matches PRD2 §7's "Archived" account status; Blueprint's does not |
| Optional scoped fields | `countryCode`, `currencyCode`, `timezone` | `countryCode`, `languageCode` | TRD10 lacks `languageCode` (a mandatory PRD2 §6 field); Blueprint lacks `currencyCode`/`timezone` |

**Which document is authoritative? TRD10 — not by this reconciliation's judgment, but by the Blueprint's own explicit, pre-existing self-declared rule.** The Blueprint's §0 states, verbatim: *"This document does not create new architecture... If this Blueprint and a TRD chapter ever appear to disagree, **the TRD chapter governs** and this document is corrected — exactly the same rule the Canonical Reference already follows for product content."* This is not a new authority relationship this reconciliation is establishing — it already exists, in the Blueprint's own text, and simply needs to be applied.

**A significant additional finding: the already-shipped code does not follow the authoritative document.** `functions/src/shared/metadata/baseMetadata.ts` (built under `ENG-P1-002`, merged, `Complete`) implements the **Blueprint's** shape — `version: number`, `deletedAt?`/`deletedBy?`, `languageCode?`, non-nullable `createdBy`/`updatedBy` — not TRD10's. Its own docstring cites the Blueprint by name. This means the conflict is not purely forward-looking (a question for Phase 2 to resolve before it starts); it is retroactive — a work package the Programme already marks `Complete` shipped code that does not conform to the document this reconciliation confirms is authoritative.

**Is synchronization sufficient, or is Founder approval required?** Synchronization is sufficient. No Founder decision is needed to determine *which* document is authoritative — that question is already answered by the Blueprint's own governing text. What remains is a mechanical, two-part correction: (1) align the Blueprint's §3.3 text to TRD10's shape (the Blueprint's own rule requires this once a disagreement is confirmed), and (2) align `baseMetadata.ts`'s implementation to the corrected shape. Neither requires new Founder deliberation; both are Engineering-executable once scheduled. This reconciliation does not perform either correction — see Constraints.

## 6. DEC-LEGAL-005 Reconciliation

**Sources compared:** the Decision Register's own `DEC-LEGAL-005` entry, and the Engineering Implementation Programme's Phase 2 profile, "Legal Dependencies" line.

| Field | Decision Register (`DEC-LEGAL-005`) | Engineering Implementation Programme (Phase 2 profile) |
|---|---|---|
| Priority | **D2** | "D3/pilot-tier" |
| Required by | **Phase 2 (registration policy) / Phase 14 gate** | "not a Phase 2 blocker" |
| Blocks | **registration policy text** | (implicitly: nothing, per the Programme's own framing) |

**Which document is correct?** The Decision Register. Its `DEC-LEGAL-005` entry states, explicitly and unambiguously: `Status: OPEN_LEGAL · Priority: D2 · ... Required by: Phase 2 (registration policy) / Phase 14 gate · Blocks: registration policy text`. The Register's own §3 Priority Definitions table confirms `D2` means "Required before the dependent implementation phase" and `D3` means "Required before pilot or launch" — two distinct, formally-defined tiers, both real (`D3` is correctly used elsewhere in the Register, e.g. `DEC-PROV-006`, `DEC-PROV-007`, `DEC-LEGAL-002`). The Programme's citation does not match the tier the Register itself assigns to this specific decision.

**Is the discrepancy real?** Yes — this is not a matter of interpretation. The two documents state factually different priority tiers and factually different blocking conclusions for the same named decision.

**Is it simply stale documentation?** No evidence supports this. `git log` on the Decision Register shows no commit has touched `DEC-LEGAL-005` since the register's own establishment — there is no prior state in which the Programme's "D3" characterization was ever correct. This is most accurately classified as a **Repository Error** (a factual misstatement, most likely introduced when the Programme's Phase 2 profile was first written) rather than a synchronization gap that tracked a real prior state.

**Does it change Phase 2 readiness?** Yes, narrowly. It does not reopen the technical/engineering build — nothing in `DEC-LEGAL-005` blocks `ENG-P2-001`'s or `ENG-P2-004`'s code. But per the Register's own words, it blocks **registration policy text** specifically — meaning the actual copy a customer sees during registration regarding minimum account age, guardian requirements, and family-account use of a loyalty number cannot be finalized without this decision, regardless of how ready the underlying engineering is.

**Is Founder action required?** Yes — but this was already true before this reconciliation, and is not a new requirement this task is creating. `DEC-LEGAL-005`'s own `Owner` field reads "Founder + legal adviser," `Status: OPEN_LEGAL`. What this reconciliation adds is the finding that the Programme was incorrectly telling readers this decision does not apply to Phase 2 at all.

## 7. Authority Comparison Table

| Inconsistency | Authoritative document | Conflicting document | Nature | Recommended resolution |
|---|---|---|---|---|
| `BaseMetadata` field shape | TRD10 §10.5 (per the Blueprint's own §0 self-declared rule) | Version 1 Engineering Blueprint §3.3; and the already-shipped `functions/src/shared/metadata/baseMetadata.ts`, which follows the Blueprint | Four-point field-shape conflict (naming, nullability, delete/archive semantics, scoped fields) | Engineering correction: align Blueprint §3.3's text and `baseMetadata.ts`'s implementation to TRD10 §10.5. No Founder decision needed. |
| `DEC-LEGAL-005` priority/blocking status | Decision Register (explicit `Priority: D2`, `Required by: Phase 2`, `Blocks: registration policy text`) | Engineering Implementation Programme, Phase 2 profile ("D3/pilot-tier, not a Phase 2 blocker") | Factual discrepancy — the Programme's citation of another document's field is simply wrong | Documentation correction: sync the Programme's Legal Dependencies line to the Register's actual values. The underlying decision (`DEC-LEGAL-005` itself) remains separately open and still requires Founder + legal adviser action — that requirement is unaffected by this correction. |

This reconciliation identifies these authority relationships; it does not modify either document, per this task's explicit constraints.

## 8. Resolution Classification

| Issue | Classification |
|---|---|
| `DEC-SEC-001` open | Founder Decision Required (light — countersign only), gated on an external technical proof |
| `DEC-PROV-004` open | Engineering Planning Issue, gated on the same external technical proof and on `DEC-SEC-001` |
| `DEC-ID-003` open | Founder Decision Required (full — no external gate, ready to decide) |
| `DEC-DATA-007` open | Engineering Planning Issue (no Founder involvement required, no external gate) |
| `BaseMetadata`/TRD10 §10.5 conflict | Documentation Synchronisation + Engineering Planning Issue (two-part: Blueprint text, then shipped code) — **Not** Founder Decision Required |
| `DEC-LEGAL-005` vs. Programme discrepancy | Repository Error (the Programme's citation is factually wrong) |
| `DEC-LEGAL-005` itself (the underlying legal decision) | Founder Decision Required (pre-existing, unaffected by the Repository Error above) |
| `DEC-SEC-001`↔`DEC-PROV-004` circular dependency | Repository Error (or, at minimum, an under-specified resolution order) — disclosed, not resolved |

## 9. Customer Identity Impact Assessment

**Blocking (genuinely prevent Customer Identity implementation, at least in part):**

- `DEC-DATA-007` — blocks `ENG-P2-001`'s core deliverable (the loyalty number itself). **Resolvable today, Engineering-only, no external gate.**
- `DEC-ID-003` — blocks `ENG-P2-004`. **Resolvable today, Founder-only, no external gate.**
- `DEC-SEC-001` + `DEC-PROV-004` (as a pair) — block `ENG-P2-001`'s authentication mechanism. **Not resolvable through governance work alone** — both require `EXT-TECH-001`, a real-world Burundi OTP delivery proof.
- `BaseMetadata` conflict — blocks document persistence for both `ENG-P2-001` and `ENG-P2-004`, and also affects already-shipped `ENG-P1-002` code. **Resolvable through Engineering correction, no Founder gate, no external gate.**

**Non-blocking (do not prevent the technical build, though they affect completeness of the customer-facing product):**

- `DEC-LEGAL-005` — blocks "registration policy text" specifically (per the Register), not the technical build. Engineering could build the registration flow's mechanics with placeholder policy text while this resolves in parallel.
- `DEC-PROD-012` (optional gender enum, referenced in ENG-P2-000 §8) — gender is already confirmed optional and non-blocking for participation; only its exact value set remains open, and only blocks "profile schema freeze," not registration itself.

**Net assessment:** three of the four originally-identified D1 decisions are more tractable than ENG-P2-000 could establish — `DEC-DATA-007` and `DEC-ID-003` require no external input at all, and the `BaseMetadata` conflict requires no Founder input at all. Only the `DEC-SEC-001`/`DEC-PROV-004` pair genuinely requires something this or any documentation task cannot produce — real-world technical validation.

## 10. Updated Readiness Recommendation

# Still Not Ready

This is not a downgrade from ENG-P2-000's own finding, nor an upgrade — it is the same overall conclusion, now backed by a materially more precise, evidence-verified account of *why*, and *which parts* are tractable versus which are not.

**What changed since ENG-P2-000, evidence-backed:**
- The `BaseMetadata` conflict is **not** a Founder-blocking item — it is a known-answer Engineering correction (TRD10 wins, per the Blueprint's own rule), applicable to already-shipped code.
- Two of the four D1 decisions (`DEC-DATA-007`, `DEC-ID-003`) have **no external dependency** and could close through ordinary governance action without waiting on anything outside the repository.
- `DEC-LEGAL-005` genuinely does affect Phase 2 (contradicting the Programme's current text), but only registration policy text, not the technical build — and this was already a real, pre-existing Founder+legal obligation, not a new one.
- The `DEC-SEC-001`/`DEC-PROV-004` pair is the one genuine hard blocker this reconciliation could not resolve or soften: both require external, real-world technical proof of Burundi OTP delivery feasibility.

**What would move this to Ready with Conditions:** resolution of `DEC-DATA-007` (Engineering-only) and `DEC-ID-003` (Founder-only) — both immediately actionable — plus the Engineering correction of the `BaseMetadata` conflict (Blueprint text + `baseMetadata.ts`). At that point, `ENG-P2-004` and the loyalty-identity-generation portion of `ENG-P2-001` could proceed while `DEC-SEC-001`/`DEC-PROV-004` remain pending — a narrower, but real, "Ready with Conditions" state, if the Founder wishes to sequence work that way. This reconciliation does not recommend that sequencing decision; it only identifies that the evidence would support considering it.

**What would move this fully to Ready:** the above, plus resolution of `DEC-SEC-001`/`DEC-PROV-004` (which requires obtaining `EXT-TECH-001`'s external proof first) and the `DEC-LEGAL-005` documentation correction plus its own underlying Founder+legal resolution.

## 11. Risks

- **None from this reconciliation itself** — read-only; no code, decision, or governance document changed.
- **Risk of continued documentation drift** if the `DEC-LEGAL-005` Repository Error and the `BaseMetadata` Blueprint-vs-code inconsistency are left uncorrected — both are now disclosed twice (ENG-P2-000 and this task) without being fixed, increasing the chance a future reader trusts the Programme's (incorrect) Legal Dependencies line or the Blueprint's (superseded) `BaseMetadata` shape.
- **Risk if `DEC-SEC-001`/`DEC-PROV-004` are treated as resolvable by decision alone:** they are not — any attempt to "just decide" without the underlying `EXT-TECH-001` proof would be deciding without evidence, contrary to this whole engagement's own discipline.

## 12. Assumptions

- The `DEC-SEC-001`↔`DEC-PROV-004` circular dependency is assumed to be an intentional "resolve together once `EXT-TECH-001` lands" design, not a genuine deadlock — this is the most charitable reading consistent with both decisions sharing the same external dependency, but the Register's text does not say this explicitly, and this reconciliation does not resolve the ambiguity, only discloses it.
- `DEC-PROV-004`'s missing explicit `Founder decision required` field is read as consistent with the compact one-line format shared by other `DEC-PROV-*` entries (`005`, `006`, `007`), which this reconciliation treats as a lighter-weight, Engineering-Lead-driven decision class — not confirmed by an explicit statement anywhere in the Register.
- No assumption was made about `DEC-LEGAL-005`'s eventual outcome — only that the Programme's current characterization of its priority and Phase 2 applicability is factually inconsistent with the Register's own explicit fields.

## 13. Files Modified

None. This is a read-only reconciliation; no existing document was edited, no new Founder decision was created, no code was changed.

## 14. Commands Executed

Direct full reads (not `grep`-truncated excerpts) of `docs/00-governance/decisions/decision-register.md` entries for `DEC-SEC-001`, `DEC-PROV-004`, `DEC-ID-003`, `DEC-DATA-007`, `DEC-LEGAL-005`, and the Register's own §3 Priority Definitions table; `docs/02-technical/trd/10-firestore-data-architecture.md` §10.5; `docs/02-technical/version-1-engineering-blueprint.md` §0 and §3.3; `functions/src/shared/metadata/baseMetadata.ts`; `docs/05-implementation/change-tracking/engineering-implementation-programme.md` Phase 2 profile and work-package table; `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` Capability 2 entry; `git log --oneline -- docs/00-governance/decisions/decision-register.md` (staleness check); `grep -n "\bD3\b"` across the full Decision Register (priority-tier verification); `awk` scripts to extract each decision's complete entry rather than a truncated excerpt.

## 15. Dependencies Added

None.

## 16. Configuration Changes

None.

## 17. Rollback Instructions

`git revert` of this task's own commit (this report plus the `IMPLEMENTATION_CHANGES.md` entry) — a pure documentation addition with no effect on any other file.
