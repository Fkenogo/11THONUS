> **Title:** ENG-P0-001 — Repository, Tooling and Test-Framework Scaffold (Prompt Draft)
> **Version:** draft 1.1 · **Status:** Draft — decisions confirmed, Ready; not yet issued · **Classification:** Working (governance record)
> **Governing document:** [Implementation Prompt Standard](../../06-engineering-governance/implementation-prompt-standard.md)
> **Source-of-truth path:** `docs/05-implementation/prompts/ENG-P0-001-draft.md`
> **Last controlled update:** 2026-07-17 (Engineering Decision Sprint 2 — both blocking decisions CONFIRMED; work package status Ready)

# ENG-P0-001 — Repository, Tooling and Test-Framework Scaffold

> **DRAFT — DECISIONS CONFIRMED, STATUS `READY` — NOT YET ISSUED**
>
> Both of this work package's blocking decisions, **DEC-TECH-003** (frontend tooling set) and **DEC-TECH-004** (repository structure), are now **CONFIRMED** in the live [Decision Register](../../00-governance/decisions/decision-register.md) (Engineering Decision Sprint 2, 2026-07-17) and Engineering Phase 0 has been formally authorized — see [`docs/05-implementation/phase-0-authorization.md`](../phase-0-authorization.md). This prompt is recorded as `Ready` in the [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md). It has still **not been issued** to a coding agent: issuing a prompt is a distinct stage of the [AI Collaboration Workflow](../../06-engineering-governance/ai-collaboration-workflow.md) (Founder/ChatGPT Technical Lead action), separate from this document's own confirmation that its preconditions are met. The confirmed direction is: Vite, React Router, TanStack Query, React Hook Form + Zod, shadcn/ui + Tailwind CSS, Lucide, Recharts, TanStack Table, vite-plugin-pwa/Workbox, Vitest + React Testing Library + Playwright, ESLint + Prettier, pnpm (full rationale: [DEC-TECH-003 Engineering Stack Evaluation & Recommendation](../../00-governance/decisions/dec-tech-003-engineering-stack-recommendation.md)); monorepo structure per [DEC-TECH-004](../../00-governance/decisions/decision-register.md).
>
> **History:** prepared in Engineering Transition Phase 0A with both decisions open; DEC-TECH-004 gained a prepared closure recommendation in Phase 0B; DEC-TECH-003 gained a full evidence-based recommendation in Engineering Decision Sprint 1; both were formally confirmed in Engineering Decision Sprint 2 (2026-07-17).

Built to the exact structure required by the [Implementation Prompt Standard](../../06-engineering-governance/implementation-prompt-standard.md).

---

## 1. Project Context

This is the first work package of the 11thONUS engineering implementation programme, following the Version 1.0 documentation baseline (Phases 1–7 of the documentation governance programme) and Engineering Transition Phase 0A (planning and decision preparation). It corresponds to TRD22 §22.10, Phase 0 — Repository and Delivery Foundation, and is tracked as **ENG-P0-001** in the [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) and the [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md).

## 2. Context

- **Relevant Constitution principles:** CP-002 (Architecture Before Features), CP-003 (Build Once, Extend Forever).
- **PRD section:** none directly — this is pure technical foundation, not product behavior.
- **TRD chapter:** TRD22 §22.10 (Phase 0 objective, deliverables, exit criteria).
- **Affected domain:** None (infrastructure only) — TRD22 §22.10's exit criteria explicitly require "no product-domain implementation has begun outside the approved structure."
- **Current implementation state:** No repository exists yet. This is the first engineering work package of the entire programme.

## 3. Objective

Produce a buildable, lintable, testable repository skeleton — matching the resolved DEC-TECH-003 (frontend tooling) and DEC-TECH-004 (repository structure) direction — with no product-domain code introduced.

## 4. Before Making Changes

The agent (or the ChatGPT Technical Lead, before issuing this prompt) must confirm:

1. **DEC-TECH-003 (frontend tooling set) is CONFIRMED** ✅ — satisfied, Engineering Decision Sprint 2, 2026-07-17: Vite, React Router, TanStack Query, React Hook Form + Zod, shadcn/ui + Tailwind CSS, Vitest + React Testing Library + Playwright, ESLint + Prettier, pnpm.
2. **DEC-TECH-004 (repository structure) is CONFIRMED** ✅ — satisfied, Engineering Decision Sprint 2, 2026-07-17: monorepo.
3. The resolved decisions are cited by ID in the actual (non-draft) version of this prompt before it is issued — still required at issuance time, not yet performed (this remains a *draft*).
4. No other Phase 0 precondition is outstanding (Phase 0 has no decision dependency besides these two) — confirmed, both satisfied.

Both decisions are now confirmed; the remaining step before execution is issuing a finalized (non-draft) version of this prompt through the [AI Collaboration Workflow](../../06-engineering-governance/ai-collaboration-workflow.md), not resolving any further ambiguity.

## 5. Task

Initialize the repository per the resolved DEC-TECH-004 structure; scaffold frontend and Cloud Functions workspaces per the resolved DEC-TECH-003 tooling; configure TypeScript strict mode, formatting, linting, and the chosen test framework; configure the Firebase Emulator Suite; add an environment-configuration template (no secrets committed).

## 6. In Scope

- Repository initialization (root config, package manifests).
- Workspace scaffolding for frontend and Cloud Functions per the resolved tooling decision.
- TypeScript strict-mode configuration.
- Formatting and linting configuration.
- Test-framework installation and a placeholder passing test.
- Firebase Emulator Suite configuration (no live Firebase project required at this step — that is Phase 1, ENG-P1-001).
- Environment-configuration template (`.env.example` or equivalent — placeholder keys only, no real values).

## 7. Out of Scope

- Any product-domain code (Identity, Purchase, Loyalty, Reward, or any other domain).
- Firebase project creation or any live Firebase resource (Phase 1).
- CI pipeline configuration, PR/change-report templates, and the documentation/changes folder skeleton (ENG-P0-002 — the next work package).
- Any deployment.
- Selecting or second-guessing DEC-TECH-003/004 — those are inputs to this prompt, not something this work package decides.

## 8. Constraints

- Maintain the current documentation architecture; do not modify any file under `docs/` as part of this work package (repository code and documentation are separate concerns at this stage).
- Do not modify unrelated files.
- Do not bypass domain services (none exist yet to bypass — noted for completeness per the standard's constraint template).
- No direct authoritative client writes (not applicable at this stage — noted for completeness).
- Preserve localization and security boundaries (not yet applicable — no product code exists).
- Avoid speculative refactoring — this is a first-time scaffold, not a refactor.
- Per TRD22 §22.10's own exit criteria: no product-domain implementation may begin outside the approved structure this work package creates.

## 9. Acceptance Criteria

- The project builds successfully.
- The chosen test framework runs (even if only a placeholder test exists) and passes.
- The Firebase Emulator Suite starts without error.
- Lint and typecheck both pass with zero errors.
- No product-domain file exists anywhere in the repository.
- The repository structure matches the resolved DEC-TECH-004 decision exactly.
- The scaffolded tooling matches the resolved DEC-TECH-003 decision exactly.

## 10. Required Tests / Validation

- Build command succeeds.
- Lint command succeeds.
- Typecheck command succeeds.
- Test-runner executes the placeholder suite and reports a pass.
- Emulator Suite start-up smoke test.

## 11. Verification Commands

*(To be filled in with the actual commands once DEC-TECH-003/004 are resolved and the specific tooling is known — e.g. the equivalents of `npm run build`, `npm run lint`, `npm run typecheck`, `npm test`, `firebase emulators:start`. Left as a placeholder in this draft rather than guessed, per the Implementation Prompt Standard's prohibition on an agent guessing scope.)*

## 12. Reporting Requirements

Per the [Implementation Prompt Standard](../../06-engineering-governance/implementation-prompt-standard.md) §3, the agent's Implementation Report must include: files created; command/tooling choices actually used (confirming they match the resolved DEC-TECH-003/004 decisions); commands executed; test results; dependencies added; configuration created; risks; rollback instructions (for a first commit, this is "delete the repository / reset to empty," stated explicitly); unresolved issues; the markdown implementation report itself; and the update to the persistent changes-tracking file (TRD22 §22.39).

---

## Status

This draft is recorded as **ENG-P0-001** in the [Coding-Agent Prompt Register](../change-tracking/coding-agent-prompt-register.md) with status **`Ready`** (Engineering Decision Sprint 2, 2026-07-17 — both DEC-TECH-003 and DEC-TECH-004 CONFIRMED). It must still be finalized with the resolved decisions cited in a non-draft version and formally issued, following the [AI Collaboration Workflow](../../06-engineering-governance/ai-collaboration-workflow.md) from stage 1 (Founder) onward — reaching `Ready` does not skip any workflow stage; it means this work package is now eligible to enter that workflow.

**Phase 0B validation (2026-07-17):** this draft was re-reviewed against the [Version 1 Engineering Blueprint](../../02-technical/version-1-engineering-blueprint.md) and [Engineering Standards Pass 1](../../03-standards/engineering-standards/README.md). Nothing important is missing, nothing premature is present, and no implementation assumption (specific tool names, file paths beyond the standard's tool-agnostic structure, or invented configuration) has crept in.

**Engineering Decision Sprint 2 validation (2026-07-17):** both blocking decisions are now CONFIRMED and Phase 0 is authorized (see [`phase-0-authorization.md`](../phase-0-authorization.md)). This draft is validated as ready-to-issue; issuing it (finalizing the non-draft version and moving it through the AI Collaboration Workflow) remains a distinct, not-yet-taken next step, outside this governance sprint's scope.
