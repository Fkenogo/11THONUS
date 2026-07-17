> **Title:** Engineering Standards — Index
> **Version:** 1.0 · **Status:** Pass 1 active; Pass 2 reserved · **Classification:** Supporting Standard
> **Governing document:** TRD22 §22.10; TRD23 §23.36; consolidation audit §24
> **Source-of-truth path:** `docs/03-standards/engineering-standards/README.md`
> **Last controlled update:** 2026-07-17 (Engineering Decision Sprint 2 — Pass 2 index updated: DEC-TECH-003/006/007 now CONFIRMED; Pass 1 authored Engineering Transition Phase 0B)

# Engineering Standards

The Engineering Standards are a required pre-implementation document (TRD Chapter 22 §22.10, Chapter 23 §23.36; consolidation audit §24). They define **product-implementation technical standards** and **must not change product behavior defined by the TRD**.

## Pass 1 — Complete (Engineering Transition Phase 0B, 2026-07-17)

Everything fully knowable without an unresolved architecture decision:

- [Repository and Folder Standards](repository-and-folder-standards.md) — repository layout, domain-folder ownership (DEC-TECH-004 basis)
- [Naming Conventions](naming-conventions.md) — files, folders, identifiers
- [TypeScript Conventions](typescript-conventions.md) — strict mode, `any`/`unknown`, domain types, immutability
- [Linting and Formatting Conventions](linting-and-formatting-conventions.md) — policy and confirmed tool names (ESLint/Prettier, per DEC-TECH-003, CONFIRMED)
- [Testing Conventions](testing-conventions.md) — test location/naming, TRD19 category mapping
- [Logging Conventions](logging-conventions.md) — operationalizes TRD20 §20.23–20.26 / TRD11 §11.36
- [Error Handling Conventions](error-handling-conventions.md) — operationalizes TRD11 §11.34–11.35
- [Documentation Conventions](documentation-conventions.md) — domain READMEs, code comments, traceability
- [Commit Conventions](commit-conventions.md) — pointer to [Git Workflow](../../06-engineering-governance/git-workflow.md) §4, plus two product-code additions

## Pass 2 — Reserved (Not Yet Authored)

**Update (Engineering Decision Sprint 2, 2026-07-17):** DEC-TECH-003, DEC-TECH-004, DEC-TECH-006, and DEC-TECH-007 are now **CONFIRMED** in the live Decision Register (see the [Decision Register](../../00-governance/decisions/decision-register.md) and the [Phase 0 Authorization](../../05-implementation/phase-0-authorization.md) record). This removes the architectural-ambiguity reason for deferring the DEC-TECH-003/006/007-gated items below to Pass 2 — those items are now eligible to be authored as soon as engineering capacity allows, most naturally alongside the work packages that need them (ENG-P0-001 for frontend tooling configuration; ENG-P1-002 for event/idempotency schema detail). They remain listed as Pass 2 (not yet authored), not because a decision is still open, but because writing file/code-level configuration detail before the relevant work package begins would be premature specification. Only **DEC-TECH-005** (Firebase region) still gates an item below on genuine architectural ambiguity.

- Firebase regional conventions (Firestore location, Functions region/runtime naming) — depends on **DEC-TECH-005** (Firebase region, OPEN_ENGINEERING). Still blocked on an open decision.
- Event contracts and outbox collection schema detail — pattern-level choice is **CONFIRMED** (**DEC-TECH-006**); the exact collection/field design is deferred implementation detail per [TRD11 §11.17](../../02-technical/trd/11-cloud-functions-and-domain-services.md) and OTD-006, authored alongside ENG-P1-002.
- Idempotency implementation (per-operation schema) — policy-level choice is **CONFIRMED** (**DEC-TECH-007**); which operations use a dedicated collection vs. deterministic IDs is Pass 2 detail, authored alongside ENG-P1-002.
- State-transition implementation (approved transition tables per entity, including the open `reward_redeemed` durability question).
- Firestore collection/field naming — depends on DEC-TECH-005 (region) directly; the DEC-TECH-006/007 portion is no longer decision-gated, only sequencing-gated (see above).
- Frontend build-tool-specific tooling configuration — **DEC-TECH-003** (frontend tooling set) is **CONFIRMED**; exact config files are authored alongside ENG-P0-001, not blocked by any open decision.
- Migration scripts and framework.
- Transaction policy detail beyond TRD10 §10.29's already-approved list of atomic operations.

Pass 2 items gated on DEC-TECH-005 remain blocked until that decision resolves; all other Pass 2 items above are unblocked at the decision level and await only their corresponding work package's execution — see the [Version 1 Engineering Blueprint](../../02-technical/version-1-engineering-blueprint.md) and [Engineering Implementation Programme](../../05-implementation/change-tracking/engineering-implementation-programme.md) for how these gate specific work packages.

## Relationship to Engineering Governance

> **Note (Phase 6, 2026-07-16):** coding-agent task/prompt structure, implementation reporting, change tracking, stop conditions, and phase review process are governed by [`docs/06-engineering-governance/`](../../06-engineering-governance/README.md) (Coding Agent Standard, Implementation Prompt Standard, Technical Review Standard), which operationalizes TRD Chapter 22 §22.38–22.41. That content is **not** duplicated here — this suite remains scoped to product-implementation technical standards only, as listed above.

## Relationship to the Version 1 Engineering Blueprint

The [Version 1 Engineering Blueprint](../../02-technical/version-1-engineering-blueprint.md) (Engineering Transition Phase 0B) is the architecture-level reference these standards implement at the file/code level. Where the two ever appear to differ, the Blueprint's source citations (TRD8/9/10/11/16/20) govern, and this suite is corrected.
