> **Title:** Commit Conventions
> **Version:** 1.0 · **Status:** Active standard (Pass 1) · **Classification:** Supporting Standard
> **Governing document:** [Engineering Standards index](README.md); [Git Workflow](../../06-engineering-governance/git-workflow.md) §4
> **Source-of-truth path:** `docs/03-standards/engineering-standards/commit-conventions.md`
> **Last controlled update:** 2026-07-17 (Engineering Transition Phase 0B — created)

# Commit Conventions

## 1. This Is a Pointer, Not a Second Standard

The commit message format is already fully specified in [Git Workflow](../../06-engineering-governance/git-workflow.md) §4:

```
<type>(<domain>): <short description> [<requirement/decision IDs>]
```

with `<type>` one of `feat`, `fix`, `docs`, `refactor`, `test`, `chore`; `<domain>` the affected 11thONUS domain or `governance`; and requirement/decision IDs cited from the [Traceability Matrix](../../00-governance/requirements-traceability-matrix.md)/[Decision Register](../../00-governance/decisions/decision-register.md) where applicable. This entry exists in the Engineering Standards suite only so "commit conventions" is discoverable alongside the other ten Pass 1 topics — it is not restated or amended here, and if the two documents ever appear to differ, [Git Workflow](../../06-engineering-governance/git-workflow.md) §4 governs.

## 2. Two Additions Specific to Product Code (Not Already Covered)

- **One logical change per commit.** A commit corresponds to one coherent step within a work package's approved scope (e.g. "add the domain model," "add the repository," "add the callable function") rather than bundling unrelated changes — this makes the Technical Review diff ([Technical Review Standard](../../06-engineering-governance/technical-review-standard.md)) reviewable change-by-change, not just as one large final diff.
- **`<domain>` matches the folder.** The commit's `<domain>` tag matches the domain folder actually touched ([Repository and Folder Standards](repository-and-folder-standards.md) §4) — e.g. a commit touching `src/domains/loyalty/` is tagged `loyalty`, not a looser product-area name. Cross-domain commits (rare — most work packages are domain-scoped) use the domain most centrally affected and name the others in the commit body.

## 3. What This Standard Does Not Cover

- Branching, push, pull, verify, deploy, and release tagging — all governed by [Git Workflow](../../06-engineering-governance/git-workflow.md) §2–§7, unchanged.
