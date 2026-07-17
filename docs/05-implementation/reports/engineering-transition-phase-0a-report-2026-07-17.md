# Engineering Transition Phase 0A — Implementation Report

**Programme label:** Engineering Transition Phase 0A — Planning and Decision Preparation
**Date:** 17 July 2026
**Performed by:** Claude (AI agent), per founder instruction "TASK — Engineering Transition Phase 0A: Implementation Programme, D1 Decision Preparation & Prompt Register"
**Changes Log entry:** [Entry 011](../../00-governance/documentation-changes-log.md#entry-011--engineering-transition-phase-0a-implementation-programme-d1-decision-preparation--prompt-register)

> **This phase does not begin TRD22 Phase 0. No application code was written. No engineering implementation began.**

---

## 1. Executive Summary

This phase converts TRD22's delivery roadmap into a tracked engineering programme without writing a line of application code. It produced: the [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) (all 17 TRD22 phases, extracted verbatim from TRD22 §22.10–22.29, broken into 47 small, reviewable work packages); the [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md) (the founder-readable, prompt-by-prompt tracker); the [Engineering Transition D1 Agenda](../../00-governance/decisions/engineering-transition-d1-agenda.md) (all 11 D1 decisions consolidated in engineering-phase order); the [Loyalty Code Decision Brief](../../00-governance/decisions/loyalty-code-decision-brief.md) (founder-facing preparation for DEC-DATA-007, including exact capacity/collision calculations); and a first prompt draft, [ENG-P0-001](../prompts/ENG-P0-001-draft.md), explicitly marked **not authorized for execution**. All 47 work packages are currently `Blocked`. No Decision Register entry was approved or modified; no requirement was changed; no repository, Firebase resource, or deployment was created.

## 2. Repository State Before Work

No application repository exists. This entire phase operated exclusively within the `docs/` documentation tree. No `git init`, package manifest, or source file was created anywhere outside `docs/`.

## 3. Files Reviewed

Every document listed in the task's "Governing Documents" section was read in full or re-confirmed from prior-phase context: the Platform Constitution; the Version 1.0 Documentation Declaration; the Documentation Manifest v1; the Canonical Reference; the Design Decision Knowledge Base; the Documentation Changes Log; the Decision Register (including full live text of all 11 D1 records, read directly rather than relied on from summary counts); the Founder Decision Agenda; the External Dependencies Register; the Assumptions Register; the Decision Governance Workflow; the Decision Update Procedure; the Requirements Traceability & Implementation Matrix (programmatically queried, 934 rows); the Traceability Maintenance Guide; the Requirement ID Mapping; TRD19, TRD20, TRD22 (re-read in full for §22.9–22.29's exact phase roadmap, dependency map, critical path, and vertical slice), and TRD23; all 11 documents under `docs/06-engineering-governance/`; the Version 1.0 Engineering Readiness Report; the Phase 7 report; and the phase tracker.

## 4. Files Created (6)

1. `docs/05-implementation/change-tracking/engineering-implementation-programme.md`
2. `docs/05-implementation/change-tracking/coding-agent-prompt-register.md`
3. `docs/00-governance/decisions/engineering-transition-d1-agenda.md`
4. `docs/00-governance/decisions/loyalty-code-decision-brief.md`
5. `docs/05-implementation/prompts/ENG-P0-001-draft.md`
6. `docs/05-implementation/reports/engineering-transition-phase-0a-report-2026-07-17.md` (this file)

## 5. Files Modified (5)

1. `docs/README.md`
2. `docs/05-implementation/reports/README.md`
3. `docs/05-implementation/change-tracking/documentation-phases.md`
4. `docs/00-governance/decisions/README.md`
5. `docs/00-governance/documentation-changes-log.md`

No other file was touched. No product requirement, requirement ID, or Decision Register entry was modified.

## 6. TRD22 Phase Extraction Summary

All 17 phases (Phase 0–16) were extracted directly from TRD22 §22.10–22.26 — objective, deliverables, and exit criteria copied and summarized from the live document, never reconstructed from memory. The dependency map (§22.27), critical path (§22.28), and recommended vertical slice (§22.29) were extracted the same way and reproduced in the Programme §B.0. Every phase name and section number cited in the Programme matches TRD22's own numbering exactly.

## 7. Engineering Programme Structure

The [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) contains: a Programme Overview (§A: purpose, governing documents, relationship to TRD22/Traceability Matrix/Engineering Governance, maintenance rules, and the prompt execution rule); a Full Engineering Phase Roadmap (§B: a 17-row phase summary table plus 17 detailed phase profiles, each with purpose, primary domains, entry/exit criteria, requirement families, decision/provider/legal dependencies, expected tests, expected deployment state, manual QA requirement, and current status); and Programme-Level Notes (§C).

## 8. Work-Package Count by Phase

| Phase | Work Packages | Phase | Work Packages |
|---|---|---|---|
| P0 | 2 | P9 | 3 |
| P1 | 3 | P10 | 3 |
| P2 | 4 | P11 | 3 |
| P3 | 3 | P12 | 2 |
| P4 | 2 | P13 | 3 |
| P5 | 3 | P14 | 3 |
| P6 | 3 | P15 | 3 |
| P7 | 3 | P16 | 2 |
| P8 | 2 | | |

**Total: 47 work packages across 17 phases.**

## 9. Prompt Register Summary

The [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md) lists all 47 work packages with a compact summary (phase, title, representative requirement IDs, decision dependencies, status, and placeholders for report/commit/deployment/manual-QA references), a defined 12-state status vocabulary with explicit per-status update authority, and the prompt execution rule. Current distribution: **0 Ready, 47 Blocked, 0 in any later stage.**

## 10. D1 Decision Review

All 11 D1-priority decisions were read from the live Decision Register (not summary counts) and are consolidated in the [Engineering Transition D1 Agenda](../../00-governance/decisions/engineering-transition-d1-agenda.md):

- **Founder (2):** DEC-LOY-008 (overflow Verified Unit allocation — blocks Phase 7, flagged as the single most important remaining product decision), DEC-ID-003 (permission inheritance semantics — blocks Phase 2).
- **Engineering (7):** DEC-SEC-001 (auth approach/fallback — Phase 2), DEC-TECH-003 (frontend tooling — Phase 0), DEC-TECH-004 (repository structure — Phase 0), DEC-TECH-005 (Firebase region — Phase 1), DEC-TECH-006 (event delivery/outbox — Phase 1), DEC-TECH-007 (idempotency storage — Phase 1), DEC-DATA-007 (loyalty number/QR generation — Phase 2).
- **Provider (2):** DEC-PROV-004 (phone OTP delivery route — Phase 2), DEC-PROV-005 (error monitoring provider — Phase 1).

For each, the agenda records the plain-language question, why it matters now, documented options and consequences, existing recommendation and basis, who must provide input (Founder/Engineering/Provider), the affected phase and requirement IDs, and — critically — exactly what may and must not proceed before it resolves. No decision was approved.

## 11. Loyalty Code Decision Brief Summary

DEC-DATA-007 was confirmed as the correct, and only, live record governing loyalty-number and QR-reference generation (verified by direct read of the register — no other record addresses this question). The [Loyalty Code Decision Brief](../../00-governance/decisions/loyalty-code-decision-brief.md) proposes a 3-letter + 3-digit format (`ABC-234`, optionally checksum-enhanced as `ABC-234-X`), analyzes an ambiguity-reduced character set (excluding I/O, optionally S/B, and digits 2–9), and computes exact capacity figures: 7,077,888 codes in the recommended alphabet (excluding I/O, digits 2–9), with collision/retry rates calculated via the birthday-paradox approximation — under 1% at Burundi-launch MVP scale (100,000 customers ≈ 0.71% retry rate), rising to a level worth revisiting only beyond roughly 1–5 million registrations (a future scaling note, not an MVP blocker). The brief documents security/privacy boundaries (code is an identifier, never a password; lookup rate-limiting; minimal confirmation data only) and 10 planning-level generation requirements (server-side generation, transactional uniqueness, retry-on-collision, immutable assignment, retired-code non-reuse, QR linkage, audit logging, safe lookup). No generator was implemented; no register entry was modified.

## 12. Engineering Standards Readiness

Reviewed the existing placeholder (`docs/03-standards/engineering-standards/README.md`, 11 listed areas). Assessment:

- **Can be authored now, independent of any open decision:** transaction policy; testing structure and coverage requirements (structure only — TRD19 already defines the technical test architecture); logging and correlation-ID standards (conceptual design, independent of the outbox mechanism's final shape); error codes and error contracts (can draw on TRD11/TRD19 already-approved content).
- **Depend on DEC-TECH-003/004 (Phase 0 decisions):** repository layout and package boundaries (directly = DEC-TECH-004); TypeScript rules (naming conventions benefit from, though don't strictly require, DEC-TECH-003's tooling choice).
- **Depend on DEC-TECH-005/006/007 (Phase 1 decisions):** Firebase conventions — specifically Functions region/runtime naming (DEC-TECH-005); command and event patterns/contracts/envelopes/outbox (directly = DEC-TECH-006); idempotency implementation (directly = DEC-TECH-007).
- **Depend on remaining Loyalty-domain decisions:** state-transition implementation, which the placeholder itself flags as including "the open reward_redeemed durability question" — tied to DEC-LOY-008 and possibly other Batch B loyalty decisions not yet fully resolved.
- **Depend on repository existing:** migration scripts and framework (needs a real repository structure to reference, though the policy itself is largely already defined in TRD22 §22.42).

**Recommendation:** author Engineering Standards as a **structured suite** (multiple focused documents, mirroring how `docs/06-engineering-governance/` was structured in Phase 6) rather than one document, in two passes: **Pass 1** — repository layout, TypeScript rules, transaction policy, testing structure, logging/correlation-ID standards, error codes — authored immediately once DEC-TECH-003/004 resolve, and may run in parallel with ENG-P0-001/002 since it is documentation, not code. **Pass 2** — Firebase conventions (region-specific), command/event patterns, idempotency implementation, state-transition tables — authored once DEC-TECH-005/006/007 (and the relevant Loyalty decisions) resolve, timed alongside Phase 1. This report does not author any Engineering Standards content, consistent with the task's instruction not to author standards whose content is not yet fully determined.

## 13. First Executable Work-Package Recommendation

**ENG-P0-001 (Repository, tooling and test-framework scaffold)** is recommended as the first executable work package, **conditional on DEC-TECH-003 and DEC-TECH-004 being resolved first.**

- **Why it can start (once its two conditions are met):** it has no dependency on any product decision, provider, or legal input — DEC-TECH-003 and DEC-TECH-004 are both Engineering-owned (Founder input is "No" / "informed only" per their own register entries), require no external feasibility proof (unlike, say, DEC-SEC-001 or DEC-TECH-005), and DEC-TECH-004 already carries a clear TRD-documented default (monorepo). This makes resolving these two the fastest realistic path to a genuinely `Ready` work package anywhere in the entire 47-item programme.
- **What remains blocked:** every other work package in the programme — ENG-P0-002 depends on ENG-P0-001; Phase 1 depends on Phase 0 plus 4 further D1 decisions (DEC-TECH-005/006/007, DEC-PROV-005); and so on down the full dependency chain in the Programme §B.0.
- **Decisions it avoids:** all product-level decisions (DEC-LOY-008, DEC-ID-003, DEC-SEC-001, DEC-DATA-007) and all provider/legal decisions — Phase 0 is pure infrastructure with no product-domain code.
- **Decisions it requires:** DEC-TECH-003, DEC-TECH-004 only.
- **Requirements it covers:** IM-006, IM-007, FR-OPS-004 (implementation-governance and operations rules, not product requirements).
- **Expected files/repository areas:** planning-level only (repository root, package manifests, TS/lint/test config) — no concrete paths are invented ahead of DEC-TECH-004's resolution.
- **Validation expectations:** build, lint, typecheck, test-runner smoke test, emulator start.
- **Git initialization/repository creation:** **included** — this is literally Phase 0's first deliverable per TRD22 §22.10.
- **Deployment:** **not included** — Phase 0 has no deployment target.
- **Separate Engineering Standards phase first:** **not required** as a hard precondition for ENG-P0-001 specifically (TRD22 Phase 0 itself does not require the full standards suite to exist first), though Pass 1 of the recommended Engineering Standards suite (§12) should run alongside or immediately after it.

## 14. First Prompt Draft Location

`docs/05-implementation/prompts/ENG-P0-001-draft.md` — built to the exact 12-section structure required by the [Implementation Prompt Standard](../../06-engineering-governance/implementation-prompt-standard.md), explicitly marked **DRAFT — NOT YET AUTHORIZED FOR EXECUTION**, with its "Before Making Changes" section stating the DEC-TECH-003/004 precondition and its "Verification Commands" section deliberately left as a placeholder rather than guessed (consistent with the standard's prohibition on an agent guessing scope).

## 15. Blocked Work Packages

**All 47.** Every work package in the Programme carries `Blocked` status. The blocking reason for each is stated individually in its programme entry; in aggregate: 2 (Phase 0) blocked by DEC-TECH-003/004; 3 (Phase 1) blocked by DEC-TECH-005/006/007 and DEC-PROV-005 plus Phase 0 completion; 4 (Phase 2) blocked by DEC-SEC-001, DEC-ID-003, DEC-DATA-007, DEC-PROV-004 plus Phase 1 completion; the remaining 39 are blocked transitively by their phase's predecessor phase, per the dependency map (Programme §B.0), with a further handful carrying their own phase-specific decision (DEC-LOY-009 for Phase 4; DEC-PROD-008 for one Phase 6 work package; DEC-LOY-008 for two Phase 7 work packages; DEC-PROV-002 for one Phase 9 work package; DEC-PROV-001/DEC-LEGAL-003/004 for Phase 10; DEC-LEGAL-001/005/006 for one Phase 14 work package; DEC-LEGAL-002 for one Phase 15 work package).

## 16. Ready Work Packages

**None.** This is expected and correct — Engineering Transition Phase 0A prepares the programme and identifies the first *executable* work package without authorizing its execution, per the task's explicit constraints.

## 17. Validation Results

- Every TRD22 phase (0–16, 17 total) is represented in the Programme. ✅
- Every work package belongs to exactly one phase. ✅ (47/47)
- Every Prompt ID is unique. ✅ (`ENG-P0-001` through `ENG-P16-002`, 47 unique IDs, no collisions)
- Every Requirement ID cited exists in the Requirements Traceability & Implementation Matrix. ✅ (verified programmatically against all 934 matrix rows at creation time)
- Every Decision ID cited exists in the live Decision Register. ✅ (verified by direct read of each cited record)
- Every D1 decision appears in the transition agenda. ✅ (11/11)
- Blocked work packages identify the exact blocker. ✅
- Ready work packages have no unresolved blocker hidden in scope. ✅ (vacuously true — there are 0 Ready work packages)
- The Prompt Register matches the Implementation Programme. ✅ (47 rows in each, one-to-one)
- The first prompt draft follows the Implementation Prompt Standard. ✅ (all 12 sections present)
- No application code was created. ✅
- No Decision Register entry was modified. ✅
- No requirement was changed. ✅
- All documentation links resolve. ✅ — full-suite check: 110 markdown files scanned, **0 broken links** (re-run after all Phase 0A files and cross-references were in place).

## 18. Commands Executed

Documentation review (`Read`/`Grep`), no destructive commands. Validation: Python-based full-suite relative-link checking (`os.walk` + resolution, run via the sandboxed shell) before and after this phase's edits; Python-based programmatic extraction of the Requirements Traceability Matrix (934 rows parsed into ID/type/title/source/domain) and domain/keyword-scoped querying to select verified-existing requirement IDs per work package; Python-based exact capacity and birthday-paradox collision-probability calculations for the Loyalty Code Decision Brief. No package installation, no build, no test execution (none applicable — no application repository exists).

## 19. Dependencies Added

None. This phase created and edited markdown documentation files only.

## 20. Configuration Changes

None.

## 21. Risks

1. **47 work packages are now visible and trackable, but all are blocked** — if the 9-plus D1 decisions identified across Phases 0–2 (and the further D2+ decisions affecting later phases) are not actively worked through, the programme could stall at the very first phase. Mitigation: the D1 Agenda sequences exactly which decisions unblock which phase, starting with the two lowest-friction ones (DEC-TECH-003/004).
2. **Requirement IDs cited per work package are representative, not exhaustive** — a work package's actual implementation may touch more requirements than the 3–8 cited. Mitigation: every work package and phase profile explicitly states this and points to the Traceability Matrix's Domain column for the complete set; this is a disclosed scope-communication choice, not a gap.
3. **The Loyalty Code Decision Brief's capacity analysis assumes the proposed 3+3 format is adopted as-is** — if the Founder or Engineering Lead choose a different format, the capacity/collision figures in §11 would need to be recalculated. Mitigation: the brief states this is a proposal for review, not a confirmed design, and the calculation method is shown so it can be re-run for any alternative format.
4. **This report's decision statuses are a snapshot as of 17 July 2026** — same caveat as the Version 1.0 Engineering Readiness Report; the Decision Register is live and should be re-checked by ID before any work package is actually promoted to `Ready`.

## 22. Rollback Instructions

Every file created in this phase is new and additive; every modified file received a scoped, logged addition (Changes Log Entry 011), not a rewrite of prior content. To roll back: delete the 6 files listed in §4, and revert the 5 files in §5 to their pre-Phase-0A content (fully reconstructable from Entry 010's end-state, the immediately preceding changes-log entry). No data migration, schema change, repository, or deployment exists to roll back — this remains a documentation-only phase.

## 23. Markdown Implementation Report

This document, together with the [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) and the [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md), constitutes the complete markdown implementation report for Engineering Transition Phase 0A.

## 24. Documentation Changes Log Update

[Entry 011](../../00-governance/documentation-changes-log.md#entry-011--engineering-transition-phase-0a-implementation-programme-d1-decision-preparation--prompt-register) appended, listing all 6 created files, all 5 modified files, the extraction/validation method, and validation results.

## 25. Phase Tracker Update

`docs/05-implementation/change-tracking/documentation-phases.md` gained a new row for "Engineering Transition Phase 0A," explicitly labeled **Planning and Decision Preparation** (not TRD22 Phase 0 itself), linking this report; the closing summary paragraph updated to state all 47 work packages are `Blocked`, the first (ENG-P0-001) requires DEC-TECH-003/004 to become `Ready`, and TRD22 Phase 0 begins only on explicit Founder and ChatGPT Technical Lead authorization.

## 26. Confirmation That No Engineering Implementation Began

Confirmed on every dimension the task specified: no application code was written; no application implementation was initialized; no Firebase resources were created; nothing was deployed; no production data was created; no Decision Register entry was approved or its outcome changed; no requirement wording or requirement ID was changed; no repository structure, frontend tooling, Firebase region, event-delivery architecture, or idempotency storage was invented or selected; no provider was selected; no file outside the 11 listed in §4–5 was modified; no audit or archive evidence was touched; and **TRD22 Phase 0 was not marked started** — the phase tracker (§25) explicitly records it as not yet begun, pending Founder and ChatGPT Technical Lead authorization of the first prompt after reviewing this report and the D1 decision agenda.
