> **Title:** TypeScript Conventions
> **Version:** 1.0 · **Status:** Active standard (Pass 1) · **Classification:** Supporting Standard
> **Governing document:** [Engineering Standards index](README.md); DEC-TECH-002 (React + TypeScript, CONFIRMED)
> **Source-of-truth path:** `docs/03-standards/engineering-standards/typescript-conventions.md`
> **Last controlled update:** 2026-07-17 (Engineering Transition Phase 0B — created)

# TypeScript Conventions

## 1. Scope

Language-level rules for all TypeScript code (frontend and Cloud Functions), independent of which specific build tool, router, or component library DEC-TECH-003 ultimately names — these rules apply regardless of that choice.

## 2. Strict Mode — Mandatory

Per TRD22 §22.10 (Phase 0 deliverable: "TypeScript strict mode"), every workspace in the repository enables the compiler's full strict family: `strict: true` (which implies `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitThis`, `alwaysStrict`). No workspace, package, or individual file opts out. `// @ts-ignore` / `// @ts-expect-error` are permitted only with an inline comment stating why, and are treated as a Technical Review flag ([Technical Review Standard](../../06-engineering-governance/technical-review-standard.md)) requiring justification, not a silent pass.

## 3. `any` Is Not a Default Escape Hatch

`any` is never used to silence a type error. Where a type is genuinely unknown (e.g. a third-party payload before validation), it is typed `unknown` and narrowed before use. Every use of `any` in a pull request is treated as a finding at Technical Review unless the Implementation Report explains why no narrower type exists.

## 4. Domain Types Are the Source of Truth

Every domain's `models/` (per [Repository and Folder Standards](repository-and-folder-standards.md) §4) defines the authoritative TypeScript types for that domain's data. Other domains and the frontend import these types rather than redeclaring their own shape of the same entity — this is what the monorepo structure (DEC-TECH-004) exists to make possible (OTD-002's "strong type and contract reuse" basis).

## 5. No Cross-Domain Type Reach-Through

A domain may depend on another domain's exported, public types (e.g. a stable ID or status enum) but never reaches into another domain's internal/private types or repository return shapes. This mirrors the folder-ownership rule in [Repository and Folder Standards](repository-and-folder-standards.md) §4 at the type level.

## 6. Null and Undefined

`strictNullChecks` (via §2) makes `null`/`undefined` explicit in every type that can hold them. Optional properties (`?:`) are used for genuinely optional data; `| undefined` is used where absence is a meaningful, checked state (e.g. "not yet resolved"). The two are not used interchangeably.

## 7. Function Signatures

Every exported function has an explicit return type (not inferred) so a signature change is a visible diff, not a silent inference change elsewhere in the codebase. Internal (non-exported) helper functions may rely on inference.

## 8. Enums vs. Union Literal Types

Prefer string union literal types (`type PurchaseStatus = "awaiting_verification" | "verified" | ...`) over TypeScript `enum` for domain state values, since union types serialize predictably to/from Firestore and JSON without an extra mapping layer. `enum` is acceptable only where a genuinely closed, non-serialized, code-internal set is intended.

## 9. Immutability

Domain model types are treated as immutable at the type level (`readonly` properties) wherever the model represents an authoritative record that should never be mutated in place by client code — consistent with TRD10's "authoritative document" model. Local, ephemeral UI state is not required to be `readonly`.

## 10. What This Standard Does Not Cover

- Formatting/linting rule specifics (line length, quote style, import order) — see [Linting and Formatting Conventions](linting-and-formatting-conventions.md).
- Firestore-specific schema/versioning conventions — reserved for Pass 2 (TRD10 §10.31 Schema Versioning already governs the product rule; the TypeScript-level convention for representing `schemaVersion` is authored once collection schemas are known).
