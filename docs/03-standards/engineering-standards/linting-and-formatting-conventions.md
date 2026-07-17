> **Title:** Linting and Formatting Conventions
> **Version:** 1.0 · **Status:** Active standard (Pass 1) · **Classification:** Supporting Standard
> **Governing document:** [Engineering Standards index](README.md)
> **Source-of-truth path:** `docs/03-standards/engineering-standards/linting-and-formatting-conventions.md`
> **Last controlled update:** 2026-07-17 (Engineering Decision Sprint 2 — §5 updated: tool selection now CONFIRMED; created Engineering Transition Phase 0B)

# Linting and Formatting Conventions

## 1. Scope

This standard fixes the *policy* every workspace's lint and format tooling must enforce, independent of the specific linter/formatter package. The specific tool selection — part of **DEC-TECH-003** (frontend tooling set) — is now **CONFIRMED** and recorded in §5 below without changing the policy itself.

## 2. Formatting Policy

- Formatting is fully automated and non-negotiable at review time — no pull request/work package is merged with unformatted code, and no reviewer manually debates formatting choices (spacing, quote style, trailing commas) that the formatter already decides.
- One formatter configuration applies to the entire monorepo (per [Repository and Folder Standards](repository-and-folder-standards.md)) — no per-domain or per-package formatting variance.
- Formatting runs automatically before commit (a pre-commit hook or equivalent) so formatting drift never reaches Technical Review.

## 3. Linting Policy

- Lint rules enforce, at minimum: no unused variables/imports, no implicit `any` (reinforcing [TypeScript Conventions](typescript-conventions.md) §3), consistent import ordering, no unreachable code, and the project's [Naming Conventions](naming-conventions.md) where mechanically enforceable.
- **Zero warnings at merge.** TRD22 §22.10's Phase 0 exit criteria require lint to pass; this standard clarifies that "pass" means zero errors *and* zero warnings — a warning is not a lower class of acceptable defect, it is a deferred error.
- Lint-rule overrides (`eslint-disable` or equivalent) require an inline comment stating why, exactly like the `@ts-ignore` rule in [TypeScript Conventions](typescript-conventions.md) §2, and are a Technical Review flag.
- Domain-boundary violations (a domain importing another domain's internal code — [Repository and Folder Standards](repository-and-folder-standards.md) §4) are enforced by lint tooling wherever the chosen tool supports import-boundary rules, not left to manual review alone.

## 4. CI Enforcement

Per TRD22 §22.10/§22.11 and TRD20 §20.11 (Continuous Integration), lint and format checks run in CI on every pushed commit, independent of and in addition to local pre-commit enforcement — CI is the authoritative gate; local hooks are a convenience that catches issues earlier.

## 5. Tool Selection — Confirmed

**Update (Engineering Decision Sprint 2, 2026-07-17):** **DEC-TECH-003 is CONFIRMED** in the live Decision Register. The confirmed tools are **ESLint** (linting) and **Prettier** (formatting), evaluated together with the rest of the Version 1 stack (Vite, React Router, TanStack Query, and the full toolchain) — see the [DEC-TECH-003 Engineering Stack Evaluation & Recommendation](../../00-governance/decisions/dec-tech-003-engineering-stack-recommendation.md). The exact rule-set configuration files and CI command names remain a Pass 2 activity, produced when ENG-P0-001 is actually issued and executed, not by this confirmation itself. This section's policy (§1–4 above) applies unchanged.

## 6. What This Standard Does Not Cover

- Test-file linting exceptions (e.g. relaxed rules for test fixtures) — see [Testing Conventions](testing-conventions.md) §6.
- The actual configuration file syntax — that is implementation, produced when ENG-P0-001 is executed, not this standard.
