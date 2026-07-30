# Decisions — Index

**Created in documentation Phase 3 (16 July 2026), replacing the pre-Phase-3 placeholder.** This folder is the governance home for every decision, dependency and assumption that shapes 11thONUS. **Phase 3 created these records; it did not approve any open founder decision.**

## Files and what to use them for

| File | Use it when… |
|---|---|
| [**decision-register.md**](decision-register.md) | You need the authoritative status of any decision (103 records: 37 confirmed, 52 open across founder/engineering/provider/legal, 10 deferred, 4 superseded). Coding agents check here before implementing decision-adjacent behavior. |
| [**founder-decision-agenda.md**](founder-decision-agenda.md) | You are the founder and want to work through your remaining 24 open decisions in plain language, in small batches, in implementation order (Batch A ✅ complete → Batch B core loyalty → … → Batch E pilot). |
| [**external-dependencies-register.md**](external-dependencies-register.md) | You need to know what evidence must come from outside (technical proofs, providers, agreements, legal reviews, pilot evidence), who owns obtaining it, and what it blocks. |
| [**assumptions-register.md**](assumptions-register.md) | You need the 15 MVP assumptions (AS-001..015) and their pilot validation plan. Assumptions are beliefs to validate — not decisions. |
| [**phase-3-reconciliation.md**](phase-3-reconciliation.md) | You want proof that every raw audit item maps to a record (traceability of the register itself). |
| [**engineering-transition-d1-agenda.md**](engineering-transition-d1-agenda.md) | You want the 11 D1-priority decisions that block TRD22 Phases 0–2 pulled into one engineering-sequenced view (a transition-focused companion to the founder agenda, created in Engineering Transition Phase 0A). |
| [**loyalty-code-decision-brief.md**](loyalty-code-decision-brief.md) | You want the founder-facing decision preparation for DEC-DATA-007 (public loyalty code / QR reference format, capacity analysis, security boundaries) — created in Engineering Transition Phase 0A. |
| [**engineering-decision-closure-recommendations.md**](engineering-decision-closure-recommendations.md) | You want to see the sourced closure analysis for DEC-TECH-004, -006, -007 (all 3 now CONFIRMED, applied in Engineering Decision Sprint 2) versus the decisions that remain genuinely open (DEC-SEC-001, DEC-TECH-005, DEC-DATA-007), with full source citations — created in Engineering Transition Phase 0B. **`DEC-SEC-001` is also now CONFIRMED (30 July 2026, `RES-003`/`RES-003A`/`RES-003B`) — see the document's own Status Update box.** |
| [**dec-tech-003-engineering-stack-recommendation.md**](dec-tech-003-engineering-stack-recommendation.md) | You want the full Version 1 frontend engineering stack evaluation for DEC-TECH-003 (engineering characteristics, requirements, candidate evaluation, trade-offs, long-term thinking, final recommendation) — created in Engineering Decision Sprint 1, 17 July 2026. **DEC-TECH-003 is CONFIRMED (applied in Engineering Decision Sprint 2, 17 July 2026).** |
| [**phase-0-authorization.md**](../../05-implementation/phase-0-authorization.md) | You want the official authorization to begin engineering — engineering baseline, approved decisions, prerequisites satisfied, Phase 0 scope and exclusions — created in Engineering Decision Sprint 2, 17 July 2026. |

## Process documents (Phase 3A)

- [**Decision Governance Workflow**](../decision-governance-workflow.md) — the complete lifecycle from "decision identified" to "coding agents may implement": responsibilities, approval rules, version control, amendments, superseded/rejected handling, Constitution and Canonical Reference interaction.
- [**Decision Update Procedure**](../decision-update-procedure.md) — the exact 8-step checklist for recording an approved decision and propagating it.

## Rules

1. **OPEN records** (`OPEN_FOUNDER`, `OPEN_ENGINEERING`, `OPEN_PROVIDER`, `OPEN_LEGAL`): no coding agent or editor may resolve them, assume a recommendation is approved, or infer an answer. Ambiguity = stop and report (TRD Ch. 22 §22.40).
2. **Approval:** the decision owner records Final decision / Decision date / Approved by in the register; status flips to CONFIRMED; the *Document corrections required* field drives follow-up edits; everything is logged in the [changes log](../documentation-changes-log.md).
3. The register **records** decisions — it never overrides the Constitution, PRD or TRD without a controlled amendment to those documents.
4. SUPERSEDED and REJECTED records remain permanently visible.
5. A FALSIFIED assumption immediately opens or reopens a register decision.
6. TRD Chapter 23's OPD/OTD/LCD/AS catalogues (assumption IDs renamed from `A-*` to `AS-*` in Phase 4 — see the [Requirement ID Mapping](../requirement-id-mapping.md)) remain the historical source; the register is now the operational record (each register entry cites its TRD23 origin).
