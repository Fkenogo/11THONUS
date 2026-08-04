> **Title:** `ENG-P2-001-03` — Loyalty Number Service Foundation Implementation Report
> **Version:** 1.0 · **Status:** Complete, pending Founder-authorized review/merge · **Classification:** Working (implementation record)
> **Source-of-truth path:** `docs/05-implementation/reports/ENG-P2-001-03-implementation-report-2026-08-04.md`
> **Prepared:** 2026-08-04

# `ENG-P2-001-03` — Loyalty Number Service Foundation Implementation Report

## 1. Executive Summary

Implemented the bounded Loyalty Number domain foundation defined by `DEC-DATA-007`, `ENG-P2-ARCH-001`, and `ENG-P2-001-PLAN-001`, at a new sibling domain module `functions/src/domains/loyaltyNumber/`. Test-driven throughout (39 new tests, all written and confirmed RED before implementation). No Firestore persistence, no QR, no Customer Profile, no Authentication, no ITM, no UI/API, no registration orchestration, no reward logic — matching the task's explicit prohibited list. The domain layer is framework-independent (zero Firebase import, machine-enforced by a new scoped `eslint.config.js` rule mirroring `ENG-P2-001-01`'s precedent).

## 2. Starting Repository State

Primary checkout (`/Users/theo/11THONUS`) on branch `chore/eng-p1-001-closure` with 32 pre-existing uncommitted governance-doc changes unrelated to this task — inspected only, never modified. `origin/main` at `fc6e7df53f326c172e85c9e3a2c212cb16835bab` (the `ENG-P2-001-01`/PR #57 merge commit).

## 3. Clean-Worktree Creation Evidence

```
git worktree add -b feat/eng-p2-001-03-loyalty-number-foundation \
  <scratchpad>/eng-p2-001-03-loyalty-number-foundation origin/main
```
Result: `HEAD is now at fc6e7df Merge pull request #57 ...`; `git status --short` empty; `git rev-list --left-right --count origin/main...HEAD` → `0  0`; no `MERGE_HEAD`/`rebase-merge`/`rebase-apply` present; `functions/src/domains/identity/models/` and `events/` confirmed present (PR #57's 15 identity files); Identity Domain Foundation tests confirmed passing (68/68) before any edit.

## 4. Starting Commit and Branch

- Starting commit: `fc6e7df53f326c172e85c9e3a2c212cb16835bab`
- Branch: `feat/eng-p2-001-03-loyalty-number-foundation`

## 5. Pre-Edit Analysis

Stated in full in chat before any file was written. Summary:

- **`DEC-DATA-007` (verbatim Final Decision, CONFIRMED `RES-006A` 2026-07-30):** server-side-only random generation; alphabet excludes `I`/`O`; baseline `ABC-234`, no checksum (`ABC-234-X` deferred); permanent, never regenerated/rotated/reissued including during recovery; assigned only after canonical identity resolution; case-insensitive, canonical stored form unformatted, display formatting at render time only; retired never reassigned on closure; every generation event audit-logged; transactional uniqueness at assignment time; collision → automatic customer-invisible retry, small bounded max-retry, fallback alerting on exceed; idempotency — at most one immutable assignment per platform user, repeats return the existing result.
- **Format/character set:** confirmed via the `DEC-DATA-007` Decision Package §6/§11 capacity table (Option B1 adopted): 3 letters (A–Z excluding `I`,`O` = 24) + 3 digits (2–9, excluding `0`,`1` = 8) → 7,077,888 codespace.
- **Separator:** presentation-only (Decision Package §9 item 5) — canonical stored form is unformatted uppercase.
- **Uniqueness scope:** platform-wide (per "existing assigned codes"/"one assignment per platform user").
- **Retry bound:** governance specifies only a qualitative "small maximum-retry count," no exact figure anywhere in the repository (confirmed by full-text search across `docs/`). `DEC-DATA-007`'s own text frames comparable specifics as "implementation-design questions for the future generator service, not resolved by this decision" — treated the retry bound the same way. Set to `MAX_ISSUANCE_ATTEMPTS = 5`, documented with rationale (at the brief's own worst-case 1,000,000-customer collision rate ≈7.06%, 5 consecutive collisions ≈1.7×10⁻⁷ — effectively unreachable at MVP scale while remaining small/bounded). Disclosed here as an engineering-judgment parameter, not silently decided.
- **Permanence/replacement:** never regenerated; recovery restores the same number to the same identity (`ENG-P2-ARCH-001` §4/§6); replacement is "not a normal operation... not designed by this document" — no replacement operation exposed.
- **Relationships:** references `CustomerIdentityId` (from `-01`) by value only; never modifies it; no dependency on Authentication or ITM; QR (`-04`) will consume this service's output.
- **Repo conventions (from `-01`):** plain validated string type-alias value objects with a throwing factory; domain-local `Error` subclass (`category`/`message`/`fieldErrors`) mapped onto the closed 14-category enum; shared `DomainEvent<T>`/`buildEventType` contract; co-located `.test.ts` files; TDD RED→GREEN.
- **Domain module placement:** new sibling domain `functions/src/domains/loyaltyNumber/` (not nested inside `identity/`), following the exact same documented folder pattern `-01` established. Rationale stated in full in chat.
- **Files expected to change:** listed in full in chat before editing (all new files under the new domain module, plus `eslint.config.js` and additive documentation/tracking notes) — matches what was actually changed (§7 below).

## 6. Files Inspected

`docs/00-governance/decisions/decision-register.md` (`DEC-DATA-007` entry); `docs/00-governance/decisions/loyalty-code-decision-brief.md`; `docs/00-governance/decisions/evidence/DEC-DATA-007-decision-package-2026-07-30.md`; `docs/05-implementation/roadmap/ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md` (§`ENG-P2-001-03`); `docs/05-implementation/roadmap/ENG-P2-ARCH-001-customer-identity-architecture.md` (§4 Loyalty Number Lifecycle); `docs/00-governance/canonical-reference.md` (§5 domain table); `docs/03-standards/engineering-standards/repository-and-folder-standards.md` (§3–4); `functions/src/shared/events/domainEvent.ts`, `eventNaming.ts`; `functions/src/shared/errors/errorCategories.ts`, `platformError.ts`; `functions/src/domains/identity/models/identityErrors.ts`, `customerIdentityId.ts`; `functions/src/domains/identity/events/identityEvents.ts`; `functions/src/domains/identity/README.md`; `eslint.config.js`.

## 7. Files Created or Modified

**Created (all new):**
- `functions/src/domains/loyaltyNumber/models/loyaltyNumber.ts` + `.test.ts`
- `functions/src/domains/loyaltyNumber/models/loyaltyNumberErrors.ts` + `.test.ts`
- `functions/src/domains/loyaltyNumber/services/loyaltyNumberGenerator.ts`
- `functions/src/domains/loyaltyNumber/services/loyaltyNumberUniquenessPort.ts`
- `functions/src/domains/loyaltyNumber/services/loyaltyNumberIssuanceService.ts` + `.test.ts`
- `functions/src/domains/loyaltyNumber/events/loyaltyNumberEvents.ts` + `.test.ts`
- `functions/src/domains/loyaltyNumber/README.md`
- This report; `docs/changes/IMPLEMENTATION_CHANGES.md` entry; `docs/00-governance/documentation-changes-log.md` entry.

**Modified (narrow, additive only):**
- `eslint.config.js` — new scoped `no-restricted-imports` block for `functions/src/domains/loyaltyNumber/**/*.ts`.
- `docs/05-implementation/roadmap/ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md` — `ENG-P2-001-03` matrix row status note only.
- `docs/05-implementation/change-tracking/engineering-implementation-programme.md` — `ENG-P2-001` Current Status paragraph, `ENG-P2-001-03`-only note prepended, nothing else touched.
- `docs/05-implementation/change-tracking/coding-agent-prompt-register.md` — narrow `ENG-P2-001-03` status note (no pre-existing row for `-03`, so none was overwritten).

No file outside this list was touched. Nothing under `ENG-P2-001-02`, `-04` through `-10`, Capability 2 overall, Authentication, ITM, or `DEC-PROD-012` was modified.

## 8. Code-Diff Summary

`git diff --stat` (worktree branch vs `origin/main`): 1 file modified (`eslint.config.js`, +32/-0 net new block), 15 new files under `functions/src/domains/loyaltyNumber/` (7 source `.ts`, 4 test `.ts` — see exact count in §9 below), plus documentation. Zero dependency-manifest changes (`git diff --stat package.json functions/package.json pnpm-lock.yaml apps/web/package.json` is empty).

## 9. Loyalty Number Value-Object Design

`type LoyaltyNumber = string` (plain validated type-alias, matching `CustomerIdentityId`'s established pattern, not a wrapper object). `createLoyaltyNumber(raw)` accepts `ABC-234` or `ABC234`, any case, trims and normalizes to canonical uppercase-unformatted (`ABC234`); throws `invalidLoyaltyNumberFormatError` on anything else, including the deferred `ABC-234-X`/`ABC234X` extended format. `formatLoyaltyNumberForDisplay(value)` applies the hyphen at render time only. Equality is trivial `===` (canonical string); serialization is a plain string, no encode/decode boundary needed.

## 10. Format and Validation Rules

Canonical pattern: `^[A-HJ-NP-Z]{3}[2-9]{3}$` (3 letters excluding `I`/`O`, 3 digits excluding `0`/`1`). Accepted input pattern additionally permits an optional hyphen between position 3 and 4, case-insensitive. Rejects: wrong length, excluded letters/digits, non-alphanumeric characters, the 7-character checksum-enhanced format, empty input.

## 11. Issuance-Service Design

`issueLoyaltyNumber(params)` — pure async function, no hidden state. Validates `customerIdentityId` (reusing identity's own `createCustomerIdentityId`, wrapped into `LoyaltyNumberDomainError` so the thrown error type stays within this domain's own boundary). If `existingAssignment` is supplied: returns it unchanged (idempotent short-circuit, zero events, zero generator/uniqueness-port calls) after confirming it belongs to the same identity (else `conflictingLoyaltyNumberAssignmentError`). If `identityEligibleForIssuance === false` and no existing assignment: throws `identityNotEligibleForIssuanceError` (a defensive guard for a state that should be structurally unreachable through the normal Registered-time issuance flow, included per the task's own required error list). Otherwise loops up to `MAX_ISSUANCE_ATTEMPTS`, generating a candidate via the injected `LoyaltyNumberCandidateGenerator`, validating it through `createLoyaltyNumber` (defense in depth), checking it via the injected `LoyaltyNumberUniquenessPort`.

## 12. Uniqueness and Collision Strategy

`LoyaltyNumberUniquenessPort.isAlreadyAssigned(candidate): Promise<boolean>` — interface only, no Firestore implementation (deferred). On a reported collision, the service emits `LoyaltyNumberIssuanceCollisionDetected` (identity + attempt number only, never the candidate value) and retries with a fresh candidate. On success, emits `LoyaltyNumberIssued` (identity + final number) alongside any collision events accumulated during that call. On exhaustion after `MAX_ISSUANCE_ATTEMPTS`, throws `loyaltyNumberIssuanceExhaustedError` (`TEMPORARY_UNAVAILABLE`) — no event is emitted from inside the throwing path (see §15); a uniqueness-port failure (thrown by the injected port) is caught and re-thrown as `loyaltyNumberUniquenessCheckFailedError` (`INTEGRATION_FAILED`), never left as a raw/unhandled exception.

## 13. Idempotency Behaviour

At most one issuance per identity across repeat calls: once an `existingAssignment` is passed in (the future persistence layer's responsibility to look up and supply), every subsequent call returns it unchanged, generating nothing new and calling neither the generator nor the uniqueness port. Verified by a dedicated "does not create a second number for the same identity across repeat calls" test using a generator that would throw if invoked a second time.

## 14. Permanence and Lifecycle Rules

No replacement operation exists anywhere in the module's exported surface (verified by an architecture test asserting no export matches `/release|free|recycl|reuse/i`). A "recovery-facing lookup" is the same idempotent short-circuit path — tested explicitly under that name. Retirement-without-reuse (closed/archived identities keep their number, it is never freed) is a consequence of "no release operation exists," not a separately-coded rule — this module has no notion of identity status at all beyond the optional `identityEligibleForIssuance` escape hatch, keeping it decoupled from `IdentityStatus`.

## 15. Domain Events

Three events, all implemented and independently tested: `LoyaltyNumberIssued`, `LoyaltyNumberIssuanceCollisionDetected`, `LoyaltyNumberIssuanceFailed`. The first two are actively emitted by `issueLoyaltyNumber` itself. `LoyaltyNumberIssuanceFailed`'s builder exists and is unit-tested but is **not** invoked internally by the issuance service — the service throws `loyaltyNumberIssuanceExhaustedError` on exhaustion instead (consistent with `-01`'s own precedent of some event builders existing for paths the current aggregate doesn't itself traverse). A future orchestration/outbox layer catching that error can construct the event from the builder. Documented explicitly in the domain README, not a silent gap. No transport/persistence/queue/Cloud Function wiring. Payloads never carry a rejected/colliding candidate value (verified by a dedicated test), per `DEC-DATA-007`'s non-revealing constraint.

## 16. Domain Errors

`LoyaltyNumberDomainError` (structurally identical to `IdentityDomainError`, defined independently to avoid `commandDispatcher.ts`'s Firebase-dependent import chain). Six factories, all mapped onto the existing closed 14-category enum: `invalidLoyaltyNumberFormatError` (`VALIDATION_FAILED`), `invalidCustomerIdentityIdForLoyaltyNumberError` (`VALIDATION_FAILED`), `loyaltyNumberIssuanceExhaustedError` (`TEMPORARY_UNAVAILABLE`), `conflictingLoyaltyNumberAssignmentError` (`INVALID_STATE_TRANSITION`), `identityNotEligibleForIssuanceError` (`INVALID_STATE_TRANSITION`), `loyaltyNumberUniquenessCheckFailedError` (`INTEGRATION_FAILED`). No new category introduced.

## 17. Security and Privacy Analysis

- **Enumeration/brute-force/predictability:** the value object rejects malformed input but performs no lookup itself — enumeration resistance is a future persistence/API-layer concern (rate-limiting), correctly out of this foundation's scope, noted in the deferred-items list.
- **Exposure in logs/events:** collision events never carry the candidate value (tested); the issued event does carry the final assigned number (necessary for the audit trail `DEC-DATA-007` itself requires: "every generation event audit-logged").
- **Collision information leakage:** attempt counts are logged, never the specific candidates tried.
- **Not a credential:** nothing in this module treats `LoyaltyNumber` as authenticating anything — no verification, OTP, or trust semantics exist anywhere in the module.
- **Merchant search boundary:** entirely deferred (no lookup-by-number capability exists in this foundation at all).

## 18. Deferred Items

Firestore persistence and unique indexing; transactions; distributed collision handling; registration orchestration; QR payload generation/rendering; merchant-facing lookup; customer-facing display; migration/backfill; exceptional replacement; administrative override; recovery orchestration; monitoring/production-rate analysis. None silently implemented — each is named in the module README and this report.

## 19. Tests Added or Modified

39 new tests across 4 files, all TDD (RED confirmed before every implementation):
- `loyaltyNumberErrors.test.ts` — 7 tests.
- `loyaltyNumber.test.ts` — 12 tests (valid/invalid formats, case normalization, separator handling, excluded letters/digits, deferred-format rejection, equality, serialization, display formatting).
- `loyaltyNumberEvents.test.ts` — 3 tests (all three event builders, including the no-candidate-leakage assertion).
- `loyaltyNumberIssuanceService.test.ts` — 17 tests: successful issuance, single-event-on-first-success, different identities get different numbers, existing-assignment idempotent return, recovery-facing lookup, no-second-number-across-repeat-calls, conflicting-assignment rejection, single collision retry, multiple consecutive collisions, no-candidate-in-collision-event, exhaustion at the bounded limit, deterministic candidate sequence, uniqueness-port failure boundary, ineligible-identity rejection, ineligible-but-already-assigned still returns existing number, invalid customer identity id, no-release/recycle architecture check.

## 20. Validation Commands and Results

```
pnpm install --frozen-lockfile                    # clean
pnpm -r run build                                 # functions + apps/web clean
npx eslint functions/src/domains/loyaltyNumber eslint.config.js   # 0 findings
npx eslint .                                       # 0 findings (full repo)
npx prettier --check functions/src/domains/loyaltyNumber eslint.config.js  # clean after one --write pass
npx prettier --check .                             # clean (full repo)
npx tsc --noEmit (functions)                        # clean
npx vitest run (functions)                          # 31 files, 201 tests passed (94 pre-existing + 68 identity + 39 new)
npx vitest run (apps/web)                           # 30 files, 259 tests passed, unaffected
```

## 21. Dependencies Added

None. `git diff --stat` on all four package/lockfile manifests is empty.

## 22. Configuration Changes

One new scoped ESLint block (`eslint.config.js`) enforcing zero Firebase SDK imports under `functions/src/domains/loyaltyNumber/**/*.ts`, mirroring the existing identity-domain block.

## 23. Risks

None beyond the already-disclosed, non-blocking codespace-exhaustion case `DEC-DATA-007` itself names as "not a design defect." The `MAX_ISSUANCE_ATTEMPTS = 5` figure is an engineering-judgment parameter within governance's "small, bounded" envelope (not itself governed by an exact number) — disclosed in §5 and here, adjustable by a future task without any governance change if reviewed and found insufficient.

## 24. Rollback Instructions

`git revert` of this task's commit(s) — a self-contained new domain module (no other module imports from `loyaltyNumber/` yet) plus a scoped ESLint addition and additive documentation notes. No persisted data exists anywhere to migrate or roll back.

## 25. Markdown Implementation Report

This document: `docs/05-implementation/reports/ENG-P2-001-03-implementation-report-2026-08-04.md`.

## 26. `IMPLEMENTATION_CHANGES.md` Update

Appended — see the `2026-08-04 — ENG-P2-001-03` entry.

## 27. Documentation Changes-Log Update

Appended — see Entry 058 in `docs/00-governance/documentation-changes-log.md`.

## 28. Persistent Task-Level Record

This report itself is the persistent task-level `.md` record.

## 29. PR Evidence

Recorded once the PR is opened — see the end-of-turn completion report for PR number, branch, head SHA, mergeability, CI status, and unresolved-thread count.
