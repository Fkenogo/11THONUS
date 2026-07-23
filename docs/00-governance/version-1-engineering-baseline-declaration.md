> **Title:** 11thONUS Version 1.0 Engineering Baseline Declaration
> **Version:** 1.0 · **Status:** Current Engineering Baseline · **Classification:** Governing (governance record — engineering handover)
> **Governing document:** 11thONUS Platform Constitution; operates within the existing hierarchy established by [Platform Constitution Part VII](platform-constitution.md) — this document does not amend that hierarchy
> **Source-of-truth path:** `docs/00-governance/version-1-engineering-baseline-declaration.md`
> **Last controlled update:** 2026-07-19 (Phase 0E, Engineering Authorization & Governance Closure — §2/§5/§9/§10 updated to reflect `DEC-LEGAL-006` and `DEC-TECH-005` both `CONFIRMED` and `ENG-P1-001` moved to `Ready`; references added to the [Version 1.0 Engineering Authorization Record](version-1-engineering-authorization-record.md) and [Version 1.0 Governance Completion Milestone](version-1-governance-completion-milestone.md). Previously, same day: Engineering Sprint 0A — §2/§3/§5 updated to reflect `DEC-TECH-005`'s scope expansion; previously: 2026-07-19, created)
> **Supersedes as engineering entry point:** nothing is deleted or superseded — this document becomes the recommended *first read*, sitting alongside the [Version 1.0 Documentation Declaration](version-1-documentation-declaration.md) it derives its authority from, and the [Version 1.0 Engineering Authorization Record](version-1-engineering-authorization-record.md), which formally activates it

# 11thONUS Version 1.0 Engineering Baseline Declaration

## 1. Purpose

This document is the formal handover from documentation governance to engineering implementation. It declares that:

- **Version 1 documentation is complete** — the Platform Constitution, Product Requirements Document, Technical Requirements Document, Engineering Standards, Decision Register, Requirements Traceability Matrix, and the Verified Loyalty governance chain are all internally consistent, cross-referenced, and current, per the audits and declarations cited throughout this document.
- **Engineering implementation begins from this controlled baseline** — every coding-agent prompt, implementation report, and technical review from this point forward should cite this declaration as its entry point rather than independently rediscovering which documents are authoritative.
- **Behaviour shall be derived only from approved governing documents** — never from audit reports, historical preparation material, superseded records, archived content, or implementation reports, all of which describe *how the baseline was reached*, not what the baseline *is*. See §6.

This is not a new Product Requirements Document, not a new Technical Requirements Document, and not a new source of product or technical behaviour. It duplicates nothing substantive — every claim below is a reference to an existing, already-authoritative document.

## 2. Version Status

| Area | Status | Basis |
|---|---|---|
| Documentation | Complete | [Version 1.0 Documentation Declaration](version-1-documentation-declaration.md) |
| Governance | Complete | This declaration, closing the governance chain in §3/§4 below |
| Frozen Domains | Active (1 domain) | §4 — Verified Loyalty only; see *Verified Loyalty Governance Freeze v1.0* (not yet committed — see note below) |
| Product | Approved | PRD Sections 00–10 ([index](../01-product/prd/README.md)), [Product Experience Principles](../01-product/product-experience-principles.md), [Product Design](../07-product-design/README.md) |
| Engineering Documentation Baseline | Ready | Engineering Standards, Engineering Blueprint, Engineering Implementation Programme all Active |
| Engineering Implementation | **Authorized — `ENG-P1-001` Ready** | Phase 0 `Complete`; `DEC-TECH-005` and `DEC-LEGAL-006` both `CONFIRMED` (2026-07-19, Phase 0E); `ENG-P1-001` moved `Blocked → Ready`; `DEC-PROV-005` remains `OPEN_PROVIDER`, blocking `ENG-P1-003` specifically, not `ENG-P1-001` — see §5 and the [Version 1.0 Engineering Authorization Record](version-1-engineering-authorization-record.md) |
| Version | 1.0 | This document |

**Note on the "Engineering Implementation" row:** this row previously read "In progress, partially blocked" while `DEC-TECH-005` and `DEC-LEGAL-006` remained open. Both are now `CONFIRMED` (§8 of the Authorization Record) and `ENG-P1-001` is `Ready`. This does not mean every Phase 1 work package is unblocked — `ENG-P1-003` remains `Blocked` on the separate, still-open `DEC-PROV-005` — so this row states the precise current position rather than a blanket "Ready."

## 3. Engineering Baseline

The following documents are authoritative for Version 1.0. This section references them; it does not restate their content. Where a document has its own index, the index is linked rather than every chapter individually.

| Document | Authority | Path |
|---|---|---|
| Platform Constitution | Governing (highest) | [`platform-constitution.md`](platform-constitution.md) |
| Product Definition (PRD Section 00 — Product Foundation) | Authoritative Product | [`../01-product/prd/00-product-foundation.md`](../01-product/prd/00-product-foundation.md) |
| Product Requirements Document (PRD, all sections) | Authoritative Product | [PRD index](../01-product/prd/README.md) |
| Technical Requirements Document (TRD, all chapters) | Authoritative Technical | [TRD index](../02-technical/trd/README.md) |
| Product Experience Principles | Authoritative Product (design/frontend philosophy) | [`../01-product/product-experience-principles.md`](../01-product/product-experience-principles.md) |
| Product Design | Authoritative Product (approved UX direction) | [Product Design index](../07-product-design/README.md) |
| Engineering Blueprint | Authoritative Technical (consolidated architecture reference) | [`../02-technical/version-1-engineering-blueprint.md`](../02-technical/version-1-engineering-blueprint.md) |
| Engineering Standards | Supporting Standard | [Engineering Standards index](../03-standards/engineering-standards/README.md) |
| Decision Register | Working (governance record) — the log of what was actually decided | [`decisions/decision-register.md`](decisions/decision-register.md) |
| Requirements Traceability Matrix | Working (governance record) | [`requirements-traceability-matrix.md`](requirements-traceability-matrix.md) |
| Engineering Implementation Programme | Working (governance record — work-package tracker) | [`../05-implementation/change-tracking/engineering-implementation-programme.md`](../05-implementation/change-tracking/engineering-implementation-programme.md) |
| Cloud Environment & Deployment Strategy | Working (governance process) — operationalizes `DEC-TECH-005` | [`../06-engineering-governance/cloud-environment-and-deployment-strategy.md`](../06-engineering-governance/cloud-environment-and-deployment-strategy.md) |
| Verified Loyalty Principles | Authoritative (governance) — constitutional reference for the Reward Lifecycle Engine domain | `verified-loyalty-principles.md` (not yet committed — see note below) |
| Verified Loyalty Governance Freeze v1.0 | Governing (domain freeze declaration) | `verified-loyalty-governance-freeze-v1.md` (not yet committed — see note below) |

The full authority-level classification (Governing / Authoritative Product / Authoritative Technical / Supporting Standard / Working / Audit evidence / Archived) is defined in the [Documentation Index](../README.md) §2 and inventoried document-by-document in the [Documentation Manifest v1](documentation-manifest-v1.md). This declaration does not redefine those classifications.

## 4. Frozen Domains

Exactly one governance domain is currently frozen:

- **Verified Loyalty** (the Reward Lifecycle Engine: Verified Units, Loyalty Cycles, Reward Lifecycle, Reward Expiry, Reward Program Lifecycle, and merchant redemption-support responsibility) — see *Verified Loyalty Governance Freeze v1.0* (not yet committed — see note below) for the full scope, authoritative hierarchy, and amendment policy. This declaration does not restate that freeze's content and does not alter it.

No other domain is currently frozen. In particular — and stated explicitly because it would be easy to assume otherwise — **Trust Management, Operational Integrity, and platform-wide Verified Commerce capability are not frozen**, per the Freeze document's own explicit scope boundary.

> **Note (2026-07-22, ENG-P1-001 pre-merge correction):** every reference in this document to *Verified Loyalty Principles* and *Verified Loyalty Governance Freeze v1.0* is deliberately unlinked, not deleted. Both documents exist in the working tree from an earlier, separate governance task but are not yet committed — they belong to a distinct Loyalty-domain governance backlog outside `ENG-P1-001`'s scope and are not part of this pull request. Linking to them here would leave an unresolved internal link in the committed repository. No claim in this document about the Verified Loyalty domain's frozen status or resolved decisions is altered by this correction — only the clickable-link mechanism is removed, pending that backlog's own dedicated commit, at which point these references should be restored as links.

## 5. Open Decisions

This section summarizes, rather than re-derives, the current decision state. The authoritative, current list is always the [Decision Register](decisions/decision-register.md) itself; the [Founder Decision Agenda](decisions/founder-decision-agenda.md) batches the founder-facing subset.

- **`ENG-P1-001` blocker — resolved (2026-07-19, Phase 0E):** **`DEC-TECH-005`** (Cloud Environment & Deployment Strategy — region: `europe-west1`) and **`DEC-LEGAL-006`** (cross-border hosting — engineering authorized, production compliance mandatory) are both `CONFIRMED`. `ENG-P1-001` is `Ready`. See the [Version 1.0 Engineering Authorization Record](version-1-engineering-authorization-record.md) §8.
- **Remaining Phase 1 item:** **`DEC-PROV-005`** (error monitoring provider, `OPEN_PROVIDER`) blocks `ENG-P1-003` specifically, not `ENG-P1-001` — independently resolvable, no dependency chain (per the Engineering Readiness Review's Finding D-2).
- **Broader D1-priority decisions:** consult the [Decision Register](decisions/decision-register.md) directly for the current full list — this declaration does not reproduce a count likely to go stale.
- **Verified Loyalty domain:** fully resolved — `DEC-LOY-008`, `DEC-LOY-009`, `DEC-LOY-013`, `DEC-LOY-014`, `DEC-LOY-015` are all `CONFIRMED`, per *Verified Loyalty Governance Freeze v1.0* (not yet committed — see note below). No open decision remains within the frozen scope.

## 6. Engineering Authority

**Engineering shall derive behaviour only from:**

- governing documents (§3 above);
- confirmed decisions (`CONFIRMED` entries in the [Decision Register](decisions/decision-register.md));
- traceability (the [Requirements Traceability Matrix](requirements-traceability-matrix.md));
- engineering standards ([Engineering Standards](../03-standards/engineering-standards/README.md), the [Engineering Blueprint](../02-technical/version-1-engineering-blueprint.md), and the [Engineering Implementation Programme](../05-implementation/change-tracking/engineering-implementation-programme.md)).

**Engineering shall not derive behaviour from:**

- audit reports (e.g. the Governance Stability Audit, the Independent Freeze Audit) — these record findings at a point in time; they are evidence that a correction was needed or verified, not a source of product behaviour themselves;
- historical preparation documents (e.g. Decision Sprint preparation material) — these capture context *before* a decision was made and may describe options that were **not** the one approved;
- superseded documents (any Decision Register entry marked `SUPERSEDED`, and any document explicitly marked historical) — preserved for governance history, never current authority;
- archived material (`docs/90-audits/`, `docs/99-archive/`) — point-in-time or retired records, never implemented directly;
- implementation reports (`docs/05-implementation/reports/`) — these record what was done and why; they are not themselves requirements.

Where an engineering prompt, implementation, or technical review needs to establish "what is the current behaviour," it must trace the claim to a document in the "shall derive" list above. If a document in the "shall not derive" list is the only place a behaviour appears to be described, that behaviour is not yet authoritative — it requires either a `CONFIRMED` decision or a corresponding update to a governing document before engineering may build against it.

## 7. Engineering Principles

These summarize principles engineers must follow; the detailed standards are authoritative and referenced, not restated:

- **Constitution first** — no document, decision, or implementation may contradict the [Platform Constitution](platform-constitution.md).
- **Traceability mandatory** — every implemented behaviour traces to a requirement, business rule, or principle in the [Requirements Traceability Matrix](requirements-traceability-matrix.md); no undocumented requirement is inferred to fill a gap.
- **Decisions before implementation** — where a `CONFIRMED` decision is required and does not yet exist, implementation waits; see the [Decision Governance Workflow](decision-governance-workflow.md).
- **No undocumented behaviour** — if it isn't in a governing document per §3, it isn't a requirement, regardless of what an audit, preparation document, or prior report may have suggested (§6).
- **Preserve auditability** — every change is logged (the [Documentation Changes Log](documentation-changes-log.md), `docs/changes/IMPLEMENTATION_CHANGES.md`, and the Requirements Traceability Matrix's Implementation Status column); nothing is corrected silently.
- **Backward compatibility unless governed otherwise** — existing behaviour is not broken by new work unless a `CONFIRMED` decision or governing-document update explicitly authorizes the change.

Detailed process standards: [Coding Agent Standard](../06-engineering-governance/coding-agent-standard.md), [Implementation Prompt Standard](../06-engineering-governance/implementation-prompt-standard.md), [Technical Review Standard](../06-engineering-governance/technical-review-standard.md), [Definition of Done](../06-engineering-governance/definition-of-done.md), [AI Collaboration Workflow](../06-engineering-governance/ai-collaboration-workflow.md).

## 8. Controlled Change Process

No behaviour established by the documents in §3 may be changed by editing a PRD, TRD, engineering document, or Decision Register entry in isolation. Any future change requires, in order:

1. **A Founder Decision** — via the [Decision Governance Workflow](decision-governance-workflow.md); a `CONFIRMED` decision is never edited in place, only superseded by a new record with the prior text preserved.
2. **A Governance Update** — the affected governing documents (Constitution, PRD, TRD, Verified Loyalty Principles, or others) corrected to match the new decision.
3. **A Traceability Update** — the [Requirements Traceability Matrix](requirements-traceability-matrix.md) updated per the [Traceability Maintenance Guide](traceability-maintenance-guide.md), free of duplicate or orphaned IDs.
4. **A Version Increment** — this declaration's own version incremented (e.g. to 1.1) when the engineering baseline itself changes, logged in §9 below rather than silently overwritten; and the [Documentation Changes Log](documentation-changes-log.md) / `docs/changes/IMPLEMENTATION_CHANGES.md` updated as they are for every change.

This is the same process already governing the [Version 1.0 Documentation Declaration](version-1-documentation-declaration.md) §4 and *Verified Loyalty Governance Freeze v1.0* §4 (not yet committed — see note below) — this document does not introduce a new process, it applies the existing one to the engineering-baseline handover itself.

## 9. Version Record

| Version | Date | Status |
|---|---|---|
| 1.0 | 2026-07-19 | Current Engineering Baseline |
| 1.0 (authorized) | 2026-07-19 | Engineering formally authorized — see the [Version 1.0 Engineering Authorization Record](version-1-engineering-authorization-record.md) and the [Version 1.0 Governance Completion Milestone](version-1-governance-completion-milestone.md) |

## 10. Transition Statement

**Governance Version 1 is complete.** The 11thONUS Documentation Governance Programme — Platform Constitution through Product Requirements, Technical Requirements, Engineering Standards, the Decision Register, the Requirements Traceability Matrix, the Engineering Blueprint, the Engineering Implementation Programme, and the Verified Loyalty governance chain (Principles → Governance Stability Audit → Correction Pass → Independent Freeze Audit → Governance Freeze Finalization) — has reached a consistent, cross-referenced, and current state, independently verified by the [Engineering Readiness Review (Phase 0D)](../05-implementation/reports/engineering-readiness-review-phase-0d-2026-07-19.md).

**Engineering Version 1 is now formally authorized.** Phase 0 is `Complete`; `DEC-TECH-005` and `DEC-LEGAL-006` — the two decisions the Readiness Review identified as the sole remaining blockers — are both `CONFIRMED`; `ENG-P1-001` is `Ready`. The [Version 1.0 Engineering Authorization Record](version-1-engineering-authorization-record.md) is the formal authorization; the [Version 1.0 Governance Completion Milestone](version-1-governance-completion-milestone.md) is the permanent historical marker of this transition.

**Future implementation shall reference this declaration** as the entry point for what is authoritative, what is frozen, what remains open, and what engineering may and may not treat as a source of behaviour — rather than each future coding-agent prompt, implementation report, or technical review independently rediscovering the documentation landscape from scratch.

The project transitions, from this point, from designing the platform to building it.
