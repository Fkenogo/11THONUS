> **Title:** Naming Conventions
> **Version:** 1.0 · **Status:** Active standard (Pass 1) · **Classification:** Supporting Standard
> **Governing document:** [Engineering Standards index](README.md)
> **Source-of-truth path:** `docs/03-standards/engineering-standards/naming-conventions.md`
> **Last controlled update:** 2026-07-17 (Engineering Transition Phase 0B — created)

# Naming Conventions

## 1. Scope

File, folder, identifier, and requirement-reference naming for product-implementation code. This does not redefine the documentation repository's own naming (kebab-case files, established Phase 2) or requirement-ID conventions (already governed by the [Requirement ID Mapping](../../00-governance/requirement-id-mapping.md)) — it extends the same discipline into application code.

## 2. Files and Folders

| Item | Convention | Example |
|---|---|---|
| Folders | kebab-case | `commerce-knowledge/`, `reward-programs/` |
| React/UI component files | PascalCase, matching the exported component | `RewardProgressCard.tsx` |
| Non-component TypeScript files (services, repositories, utilities) | camelCase | `purchaseRepository.ts`, `verifyPurchase.ts` |
| Test files | mirror the file under test, suffixed | `verifyPurchase.test.ts` |
| Cloud Function entry files | camelCase, verb-led, matching the function's callable/event name | `recordPurchase.ts`, `onPurchaseVerified.ts` |
| Type-only files | camelCase, suffixed where the file is exclusively types | `purchase.types.ts` |

## 3. Identifiers (within code)

| Item | Convention | Example |
|---|---|---|
| Variables, functions | camelCase | `verifiedUnitCount` |
| Types, interfaces, classes | PascalCase | `PurchaseRecord`, `LoyaltyCycle` |
| Enums and enum members | PascalCase type name; PascalCase or UPPER_SNAKE members, consistent within a file | `PurchaseStatus.AwaitingVerification` |
| Constants (module-level, immutable) | UPPER_SNAKE_CASE | `MAX_VERIFIED_UNITS_PER_CYCLE` |
| Boolean variables/functions | `is`/`has`/`can`/`should` prefix | `isEligibleForReward`, `hasActiveSubscription` |
| React hooks | `use` prefix | `useLoyaltyProgress` |

Names follow the platform's own domain vocabulary exactly as the Constitution, PRD, and Canonical Reference define it — "Verified Unit," "Loyalty Cycle," "On Us Moment," "Purchase Record" — never an engineer's informal shorthand (e.g. not `stamp`, `point`, `punch`). This is a direct extension of TAP-004/CP-004 (terminology discipline) into code.

## 4. Firestore Collections and Fields

Reserved for **Pass 2** — collection naming depends on the Firebase project/region decision (DEC-TECH-005) and the finalized idempotency/outbox schema detail (DEC-TECH-006/007's deferred implementation layer, per the [Engineering Decision Closure Recommendations](../../00-governance/decisions/engineering-decision-closure-recommendations.md)). Naming these now would invent schema ahead of the architecture that governs it.

## 5. Requirement and Decision ID References in Code

Where a comment, commit message, or test name references a requirement or decision, it uses the exact ID from the [Requirements Traceability & Implementation Matrix](../../00-governance/requirements-traceability-matrix.md) or [Decision Register](../../00-governance/decisions/decision-register.md) — never a paraphrase or an invented shorthand ID.

## 6. Branch and Environment Names

Already governed — see [Git Workflow](../../06-engineering-governance/git-workflow.md) §7 (branch strategy) and TRD20 §20.6 (Environment Naming). Not duplicated here.

## 7. What This Standard Does Not Cover

- Commit message format — see [Commit Conventions](commit-conventions.md).
- Cloud Function *deployment* naming (region/runtime-qualified names) — reserved for Pass 2, tied to DEC-TECH-005.
