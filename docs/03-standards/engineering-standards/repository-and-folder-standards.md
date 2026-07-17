> **Title:** Repository and Folder Standards
> **Version:** 1.0 · **Status:** Active standard (Pass 1) · **Classification:** Supporting Standard
> **Governing document:** [Engineering Standards index](README.md); TRD22 §22.10; TRD8 §8.4
> **Source-of-truth path:** `docs/03-standards/engineering-standards/repository-and-folder-standards.md`
> **Last controlled update:** 2026-07-17 (Engineering Decision Sprint 2 — §3 updated: DEC-TECH-003 now CONFIRMED; created Engineering Transition Phase 0B)

# Repository and Folder Standards

## 1. Scope

This standard defines how the 11thONUS application repository is structured on disk. It governs product-implementation code only. It does not govern this documentation repository (already structured per Phase 2), nor the coding-agent process (governed by [`06-engineering-governance/`](../../06-engineering-governance/README.md)).

## 2. Repository Structure — CONFIRMED

Per **DEC-TECH-004** (see [Engineering Decision Closure Recommendations](../../00-governance/decisions/engineering-decision-closure-recommendations.md) §3): the platform uses a **single monorepo** containing frontend and Cloud Functions code, with shared types. This is not a Pass 1 invention — it is the structure TRD8 §8.4 already assumes and OTD-002 already recommends.

## 3. Top-Level Layout

Per TRD8 §8.4, engineering mirrors the platform's domain model. The confirmed top-level layout is:

```
/
├── src/
│   ├── domains/          — one folder per domain (§4)
│   ├── shared/            — cross-domain utilities, types, contracts
│   ├── config/             — environment and runtime configuration
│   ├── infrastructure/     — Firebase client/Admin SDK init, adapters
│   └── ui/                 — shared UI primitives (design-system level)
├── tests/                  — cross-cutting/integration tests (domain tests live inside each domain — §4)
├── docs/                   — this documentation suite (already exists, unchanged)
└── (workspace-specific root config — package manifests, TypeScript config, lint/format config, CI config)
```

**DEC-TECH-003** (frontend tooling set) is now **CONFIRMED** (Vite, React Router, TanStack Query, and the full Version 1 stack — see [DEC-TECH-003 Engineering Stack Evaluation & Recommendation](../../00-governance/decisions/dec-tech-003-engineering-stack-recommendation.md)). The exact frontend/Functions workspace split (e.g. `apps/web`, `functions/`, or an equivalent layout) implementing that confirmed tooling is Pass 2 detail, recorded here once ENG-P0-001 is actually executed — this standard does not invent that specific layout ahead of the work package that produces it.

## 4. Domain Folder Standard

Per the [Canonical Reference](../../00-governance/canonical-reference.md) §5, the platform has 15 domains: Identity, Commerce Knowledge, Rules, Reward Programs, Purchase, Loyalty, Reward, Trust, Notification, Reporting, Search, Subscription, Integration, Administration, Intelligence (future).

Every domain folder owns, per TRD8 §8.4:

- `models/` — data shapes for that domain's authoritative documents;
- `services/` — business logic;
- `repositories/` — Firestore access for that domain's owned collections only;
- `validation/` — request/data validation;
- `functions/` — the domain's Cloud Functions (callable, event, scheduled — see the [Version 1 Engineering Blueprint](../../02-technical/version-1-engineering-blueprint.md) §3);
- `events/` — event definitions the domain publishes/subscribes to;
- `tests/` — the domain's own unit and integration tests;
- `README.md` — the domain's own documentation (§8 of [Documentation Conventions](documentation-conventions.md)).

A domain folder never contains another domain's authoritative model or repository code — this mirrors the Decision Register's Ownership Model (Canonical Reference §6) exactly; a folder-level violation is a domain-boundary violation regardless of whether it compiles.

## 5. Intelligence Domain

Per the Canonical Reference, Intelligence is a **future** domain. Its folder is not created until a work package explicitly scopes it; an empty placeholder folder is not created speculatively (Engineering Principle: no temporary or speculative architecture — see [Engineering Principles](../../06-engineering-governance/engineering-principles.md)).

## 6. What This Standard Does Not Cover

- Naming of files/folders/identifiers within this structure — see [Naming Conventions](naming-conventions.md).
- The specific build-tool-driven workspace mechanics (e.g. how the confirmed monorepo tooling wires these folders into buildable packages) — DEC-TECH-003 is CONFIRMED; this mechanical detail is Pass 2, authored alongside ENG-P0-001.
- Firestore collection naming and schema — reserved for Pass 2 (DEC-TECH-006/007 pattern/policy is CONFIRMED; per-operation/collection detail awaits ENG-P1-002; region naming still depends on the open DEC-TECH-005).

## 7. Relationship to Other Documents

- [TRD8 §8.4](../../02-technical/trd/08-firebase-platform-architecture.md) — the authoritative source this standard operationalizes; if they ever conflict, TRD8 governs and this standard is corrected.
- [Version 1 Engineering Blueprint](../../02-technical/version-1-engineering-blueprint.md) — the architecture-level description this standard implements at the file-system level.
- [Engineering Decision Closure Recommendations](../../00-governance/decisions/engineering-decision-closure-recommendations.md) — DEC-TECH-004's closure basis.
