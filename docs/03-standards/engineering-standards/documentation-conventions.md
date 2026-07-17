> **Title:** Documentation Conventions (Code-Level)
> **Version:** 1.0 · **Status:** Active standard (Pass 1) · **Classification:** Supporting Standard
> **Governing document:** [Engineering Standards index](README.md)
> **Source-of-truth path:** `docs/03-standards/engineering-standards/documentation-conventions.md`
> **Last controlled update:** 2026-07-17 (Engineering Transition Phase 0B — created)

# Documentation Conventions (Code-Level)

## 1. Scope

This standard governs documentation *inside the application repository* — code comments, domain README files, and generated API references. It is distinct from, and does not alter, the documentation-governance rules for this `docs/` suite itself (Constitution, PRD, TRD, Decision Register, this Engineering Standards suite) — those remain governed by the [Decision Governance Workflow](../../00-governance/decision-governance-workflow.md) and the rules in [`docs/README.md`](../../README.md) §6.

## 2. Domain README

Every domain folder ([Repository and Folder Standards](repository-and-folder-standards.md) §4) contains a `README.md` stating: the domain's authoritative ownership (quoting its row from the [Canonical Reference](../../00-governance/canonical-reference.md) §6 Ownership Model), the domain's own Cloud Functions with a one-line purpose each, and links to the domain's requirement IDs in the [Requirements Traceability & Implementation Matrix](../../00-governance/requirements-traceability-matrix.md). It is written once the domain's first work package lands and updated whenever a function is added or removed — it is not a speculative document authored ahead of the code it describes.

## 3. Code Comments

Comments explain *why*, not *what* — the code itself, following [Naming Conventions](naming-conventions.md), should make the *what* self-evident. A comment is required wherever code implements a specific, non-obvious business rule, and the comment cites the rule's ID from the Traceability Matrix (e.g. `// BR-042: overflow units held as pending allocation until reward redemption`) so the rule and its implementation stay traceable to each other without a separate cross-reference document. Comments are not used to disable type/lint checks silently — see [TypeScript Conventions](typescript-conventions.md) §2 and [Linting and Formatting Conventions](linting-and-formatting-conventions.md) §3 for that specific, justified-only exception.

## 4. Function-Level Documentation

Every exported function in a domain's `services/`, `repositories/`, or `functions/` folder carries a doc comment (JSDoc/TSDoc style) stating its purpose, parameters, return value, and — where it implements a sensitive operation (TRD10 §10.30's list) — its idempotency behavior. This is what a generated API reference (if the project later adopts one) is built from; Pass 1 does not mandate a specific generator, only the doc-comment discipline that makes one possible later.

## 5. Requirement and Decision Traceability in Code

Per [Naming Conventions](naming-conventions.md) §5, any comment referencing a requirement or decision uses its exact ID. This is the code-level half of the Traceability Matrix's promise — every requirement ID is expected to eventually resolve to an implementation location, and citing the ID in the implementing code is how that resolution stays checkable without manually re-deriving it.

## 6. What a Work Package's Implementation Report Documents (Reminder, Not a New Rule)

The Implementation Report itself (files created, commands run, tests, risks, rollback) is already fully specified by the [Implementation Prompt Standard](../../06-engineering-governance/implementation-prompt-standard.md) §3 and is not restated here — this standard covers documentation that lives *in the code*, that standard covers documentation that reports *on the work*.

## 7. What This Standard Does Not Cover

- This `docs/` governance suite's own conventions (metadata blocks, changes log, decision records) — unchanged, governed by existing Phase 1–7 rules.
- Auto-generated API documentation tooling selection — deferred; not required for Phase 0/1.
