> **Title:** Testing Conventions
> **Version:** 1.0 · **Status:** Active standard (Pass 1) · **Classification:** Supporting Standard
> **Governing document:** [Engineering Standards index](README.md); TRD19 (Quality Engineering)
> **Source-of-truth path:** `docs/03-standards/engineering-standards/testing-conventions.md`
> **Last controlled update:** 2026-07-17 (Engineering Transition Phase 0B — created)

# Testing Conventions

## 1. Scope

This standard fixes where tests live, how they are named, and what a test must and must not do — the code-level structure that TRD19 (Quality Engineering) assumes but does not itself specify at the file/folder level. TRD19 remains authoritative for *what* must be tested (§19.4 Test Pyramid, §19.5 Testing Categories, and the specific category chapters §19.6–19.40); this standard governs *how* those tests are organized in the repository. It does not restate TRD19's content.

## 2. Test Location

Per [Repository and Folder Standards](repository-and-folder-standards.md) §4, every domain owns a `tests/` folder holding that domain's unit and integration tests. Cross-domain/end-to-end tests that do not belong to a single domain live in the repository-root `tests/` folder. A test never lives outside both locations (no "orphan" test files scattered alongside source files, and no single monolithic top-level test folder holding every domain's tests).

## 3. Test File Naming

Test files mirror the file under test with a `.test.ts` (or `.test.tsx` for component tests) suffix, per [Naming Conventions](naming-conventions.md) §2 — e.g. `verifyPurchase.ts` → `verifyPurchase.test.ts`. Test suite/describe-block names use the exact domain vocabulary (Purchase Record, Verified Unit, Loyalty Cycle) rather than informal shorthand, consistent with [Naming Conventions](naming-conventions.md) §3.

## 4. Test Pyramid Mapping (TRD19 §19.4)

| TRD19 category | Repository location | Runs in CI |
|---|---|---|
| Unit tests (§19.6, §19.7) | `<domain>/tests/` | Every commit |
| Component tests (§19.8) | `<domain>/tests/` (frontend domains) | Every commit |
| Integration tests (§19.9, using the Firebase Emulator Suite per §19.10) | `<domain>/tests/` or root `tests/integration/` for cross-domain flows | Every commit |
| Security Rules tests (§19.11) | root `tests/security-rules/` | Every commit |
| End-to-end / cross-domain flow tests (e.g. the full Purchase → Verification → Reward flow) | root `tests/e2e/` | CI, gated per TRD19's release-readiness cadence rather than every commit if execution time requires it |

## 5. Every Sensitive Operation Ships With Its Tests

Per Delivery Principle DIP-004 ("Tests Travel with Features," TRD22 §22.8) and TRD19's mandatory categories (§19.12 Command Contract, §19.13 Event Contract, §19.14 Idempotency, §19.17 State Transition), a work package implementing any sensitive write operation (the TRD10 §10.30 list: Purchase Record creation, customer verification, dispute submission, Verified Unit issuance, reward creation, redemption, payment confirmation, webhook processing, notification scheduling) is not accepted at Technical Review without an idempotency test and a state-transition test for that operation, in addition to its functional tests.

## 6. Test Code Standards

- Test files are exempt from the "no `any`" rule ([TypeScript Conventions](typescript-conventions.md) §3) only for constructing deliberately malformed test fixtures, and even then a comment states why.
- Tests do not call live external providers (payment, SMS, email) — provider calls are mocked/stubbed at the adapter boundary ([Version 1 Engineering Blueprint](../../02-technical/version-1-engineering-blueprint.md) §3, Integration domain), consistent with TRD19 §19.33 (Payment Provider Testing).
- Tests do not depend on execution order or shared mutable state between test files.
- Tests use the Firebase Emulator Suite (TRD19 §19.10) rather than a live Firebase project for anything touching Firestore/Functions/Auth — this is a Phase 0 deliverable (TRD22 §22.10) precisely so tests can run without cost or production risk.

## 7. Coverage Expectation

A numeric coverage percentage is not fixed in Pass 1 — TRD19 does not mandate one, and inventing a threshold here would be exactly the kind of unsupported architectural choice this phase avoids. What is fixed: every domain service function that enforces a business rule (per the Traceability Matrix's rule/business-rule IDs) has at least one test asserting that rule, and every sensitive write has the idempotency/state-transition coverage in §5. Technical Review ([Technical Review Standard](../../06-engineering-governance/technical-review-standard.md)) checks this rule-by-rule, not against a blanket percentage.

## 8. What This Standard Does Not Cover

- Manual/exploratory testing — governed by [Manual Testing Standard](../../06-engineering-governance/manual-testing-standard.md).
- Release-level test gates — governed by TRD19 §19.51–19.52 (Release Candidate, Release Gates).
- Load/performance/cost testing thresholds — TRD19 §19.30–19.32 remain authoritative; not restated here.
