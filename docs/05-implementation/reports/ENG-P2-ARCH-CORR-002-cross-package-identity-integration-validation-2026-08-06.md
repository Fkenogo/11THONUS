> **Title:** ENG-P2-ARCH-CORR-002 — Cross-Package Identity Integration Validation
> **Version:** 1.0 · **Status:** Correction implementation record — pending Founder-authorized merge · **Classification:** Working (execution-layer correction record)
> **Governing document:** [`ENG-P2-ARCH-REVIEW-001` Architecture Review Report](ENG-P2-ARCH-REVIEW-001-capability-2-customer-identity-architecture-review-2026-08-06.md) Finding F2
> **Source-of-truth path:** `docs/05-implementation/reports/ENG-P2-ARCH-CORR-002-cross-package-identity-integration-validation-2026-08-06.md`
> **Last controlled update:** 2026-08-06 (`ENG-P2-ARCH-CORR-002` — created)

# ENG-P2-ARCH-CORR-002 — Cross-Package Identity Integration Validation

**This is a test-only correction. No production code was changed. No Customer Profile, Authentication provider, ITM, UI, public API, or Reward logic was implemented.**

## 1. Executive Summary

`ENG-P2-ARCH-REVIEW-001` Finding F2 (P2) identified three concrete cross-package integration-test gaps. This task adds a single new dedicated emulator test file, `crossPackageIdentityIntegration.emulator.test.ts` (8 tests across 7 required scenarios), sequencing real, already-merged public repository functions exactly as a future orchestration boundary would call them. No test-only business logic was introduced anywhere; no production code change was required. All 7 scenarios pass. **F2 is marked corrected.**

## 2. Starting Repository State

`origin/main` at merge commit `264c29e6381e0b07a6a31ed6767bf13ad42db250` (PR #67, confirmed merged and present via `git merge-base --is-ancestor`).

## 3. Clean-Worktree Evidence

- `git worktree add -b test/eng-p2-arch-corr-002-cross-package-integration <path> origin/main`; `git status --porcelain` empty at creation; `git rev-list --left-right --count origin/main...HEAD` → `0 0`; no `.git/MERGE_HEAD`/`rebase-merge`/`rebase-apply`.
- Architecture Review Report present; F1 confirmed `[CORRECTED]`; F2 confirmed still open (grep of the findings table).
- `ENG-P2-001-01` and `-03` through `-10` confirmed present via directory listing.
- Baseline: `tsc --noEmit` clean, `pnpm lint` clean, 399/399 `functions` unit tests, `firebase emulators:exec` full suite exited successfully.

## 4. Starting Commit and Branch

`264c29e` on `test/eng-p2-arch-corr-002-cross-package-integration`.

## 5. F2 Evidence and Scope

Architecture Review §4.10/Findings F2: two of three package-level emulator suites already exercise real cross-package writes as *setup* (`identityLookupRepository.emulator.test.ts`, `identityRecoveryRepository.emulator.test.ts`), but three concrete gaps remained: (a) QR regeneration's new-reference-resolves and old-reference-fails were never asserted together in one test through the full lookup facade; (b) no idempotent-replay test spanned two packages; (c) the audit write path and audit read path were never joined in one test.

## 6. Pre-Edit Analysis

Full analysis delivered in chat before implementation began, covering: the exact finding and evidence; already-partially-covered vs. single-package-only behaviors; existing factories/fixtures/helpers (`seedIdentity`, `envelope`, `FixedGenerator`, per-file collection-clearing `beforeEach`); existing idempotency/outbox conventions (`checkAndReserveIdempotencyKey`/`completeIdempotencyKey`/`failIdempotencyKey`, one outbox write per transaction); existing repository orchestration boundaries (no composite orchestrator exists anywhere in `functions/src/domains`, confirmed by repo-wide grep — the one genuine cross-package production boundary is `identityRecoveryRepository.ts`'s `recoverCustomerIdentityByReference`); which scenarios are testable through public contracts (all 7); how business-logic duplication was avoided (every assertion reads real return values or real persisted documents; `FixedGenerator` only removes randomness, never duplicates uniqueness/issuance logic); emulator state isolation (one dedicated file, own Firestore app instance, own `beforeEach`, deterministic per-scenario ID suffixes); concurrency/replay testing (`fileParallelism: false` unchanged/governed; Scenario 7 uses a real `Promise.all()` race over two genuine repository calls targeting the same document); files expected to change (one new test file; this report; two changelog entries; the Architecture Review Report's F2 status — no production file).

## 7. Integration-Test Architecture

One new file, `functions/src/domains/identity/repositories/crossPackageIdentityIntegration.emulator.test.ts`, following the established per-file convention exactly (own `initializeApp`, own Firestore instance, own `beforeEach` clearing all 8 identity-domain collections, `beforeAll` emulator-presence guard, `afterAll` app cleanup). Every scenario calls real exported functions from `customerIdentityRepository.ts`, `authenticationReferenceRepository.ts`, `identityLifecycleRepository.ts`, `identityRecoveryRepository.ts`, `identityLookupRepository.ts`, `loyaltyNumberRepository.ts`, `qrIdentityRepository.ts`, and `identityAuditQueryRepository.ts` — no new production export, no test-only orchestration function.

## 8. Scenarios Implemented

All 7 required scenarios, as 8 `it()` blocks (Scenario 5 has two: the success path and the failed-recovery-does-not-consume-proof path):

1. Identity Issuance Chain
2. Cross-Package Idempotent Replay
3. QR Regeneration and Lookup
4. Lifecycle Transition and Audit
5. Recovery Integration (success + failure-does-not-consume-proof)
6. Authentication Reference Linking and Lookup
7. Combined Conflict and Rollback (recovery racing with closure)

## 9. Cross-Package Coverage Matrix

| Scenario | Packages crossed | Existing coverage | New coverage | Result | Remaining limitation |
|---|---|---|---|---|---|
| 1. Identity Issuance Chain | identity, loyaltyNumber, qrIdentity, identityAudit | Repository-integration (setup-only, in `identityLookupRepository.emulator.test.ts`) | Full chain in one test: uniqueness, ownership links, expected outbox events, raw-vs-minimised audit projection | **PASS** | No production orchestration/composite command exists yet (deferred to a future Registration API task); longest real chain of 3 sequential repository calls exercised instead, per the task's own guidance |
| 2. Cross-Package Idempotent Replay | identity, loyaltyNumber, qrIdentity | Unit/repository-integration (single-package idempotency only) | Full 3-step governed sequence replayed with the same idempotency keys; no duplicates across the whole chain; metadata immutability | **PASS** | No single composite command exists to replay atomically as one call; replay proven per-command across the governed sequence, as instructed |
| 3. QR Regeneration and Lookup | identity (lookup), qrIdentity | Repository-integration (old-reference-fails only, package-level and partial cross-package) | Full 10-point chain in one test: active resolves, regeneration, old invalidated+stored, new active, identity/LN unchanged, active/old lookups, audit minimisation, retry-no-third-reference | **PASS** | None material |
| 4. Lifecycle Transition and Audit | identity (lifecycle), identityAudit | Repository-integration (transitions tested; audit-query join never asserted together) | Ordinary + terminal transition, audit-query join, duplicate-replay-no-dup-event, stale-transition-no-partial-write, all in one test | **PASS** | None material |
| 5. Recovery Integration | identity (recovery/lifecycle), loyaltyNumber, qrIdentity, identityAudit | Repository-integration (recovery-via-reference tested; audit join and explicit LN/QR/AuthRef preservation not joined) | Full join: identity/LN/QR/AuthRef preserved, proof reserved once, event once, audit omits raw proof, idempotent replay, failed recovery does not consume proof | **PASS** | Recovery via Authentication-Reference or support-managed reference is explicitly out of `-07`'s bounded scope (no reverse index exists) — a pre-existing, documented production scope boundary, not a gap introduced by this task |
| 6. Authentication Reference Linking and Lookup | identity (linking + lookup), identityAudit | Repository-integration (link/unlink/conflict tested; audit-query join never asserted together) | Full join: link, active lookup, unlink-preserves-history, same-identity relink, cross-identity fails closed, conflict audit omits raw subject reference, permanent identifiers unchanged | **PASS** | None material |
| 7. Combined Conflict and Rollback | identity (lifecycle + recovery) | None — this exact race had no test anywhere | Real `Promise.allSettled()` race via genuine Firestore-transaction-level contention on `users/{id}`; exactly-one-winner, no partial state, no duplicate outbox evidence, immutable identifiers | **PASS** | This is a race between two concerns within the identity package's own modules (lifecycle vs. recovery), not a race spanning two entirely separate packages — QR/LN issuance and identity lifecycle write to disjoint documents, so no genuinely cross-package document-level race exists in this architecture; the task's own suggested scenario list anchors this exact case |

**Coverage-level distinction:** all 8 new tests are **emulator integration coverage** (real Firestore, real transactions, real production code paths) at the **repository-contract** level. None reaches **full orchestration coverage** (no production orchestrator exists) or **UI/API coverage** (deliberately, explicitly deferred — no UI/API exists for this capability yet).

## 10-16. Scenario Results

See §9 (matrix) for the per-scenario pass/fail and evidence summary; full assertion detail is in the test file itself (`crossPackageIdentityIntegration.emulator.test.ts`), matching this repository's established convention of the test file being the authoritative evidence record.

## 17. New Findings Discovered

None. No production defect was surfaced by any of the 7 scenarios.

## 18. Production-Code Changes

**None.** Confirmed via `git diff --stat -- functions/src apps/ firestore.rules firestore.indexes.json storage.rules .firebaserc firebase.json` scoped away from the new test file — zero output. The default no-production-change expectation held throughout.

## 19. Files Inspected

All 8 pre-existing `*.emulator.test.ts` files (convention/signature reference); `identityRecoveryRepository.ts`, `authenticationReferenceRepository.ts`, `identityLifecycleRepository.ts`, `identityAuditQueryRepository.ts`, `qrIdentityRepository.ts`, `loyaltyNumberRepository.ts`, `customerIdentityRepository.ts`, `identityLookupRepository.ts` (exact exported param shapes); `identityEvents.ts`, `eventNaming.ts` (real namespaced `eventType` format, `<domain>.<name>.v<version>`); `loyaltyNumber.ts` (canonical-format regex, `[A-HJ-NP-Z]{3}[2-9]{3}` — excludes I/O and 0/1); `transitionAuthority.ts`, `transitionReason.ts`, `auditQueryAuthority.ts`, `identityStatus.ts`, `identityLifecycleService.ts` (recovery-eligible statuses, `suspended`/`locked`); `recoveryProof.ts`, `authenticationReference.ts`.

## 20. Files Created or Modified

- **Created:** `functions/src/domains/identity/repositories/crossPackageIdentityIntegration.emulator.test.ts`; this report.
- **Modified:** `ENG-P2-ARCH-REVIEW-001-...md` (F2 status only); `docs/changes/IMPLEMENTATION_CHANGES.md`; `docs/00-governance/documentation-changes-log.md`.
- **Not modified:** any production source file, any Firestore Rule, index, Firebase configuration, or unrelated file.

## 21. Tests Added or Modified

One new file, 8 new tests (all passing): `crossPackageIdentityIntegration.emulator.test.ts` — Scenario 1 (1 test), Scenario 2 (1 test), Scenario 3 (1 test), Scenario 4 (1 test), Scenario 5 (2 tests), Scenario 6 (1 test), Scenario 7 (1 test). No existing test file was modified.

## 22. Validation Commands and Results

| Command | Result |
|---|---|
| `pnpm --filter functions exec tsc --noEmit` | Clean |
| `pnpm lint` | Clean |
| `pnpm format:check` | Clean (after one `prettier --write` pass on the new file) |
| `pnpm --filter functions exec vitest run` | 399/399 (unchanged — no unit-tested code touched) |
| `firebase emulators:exec ... "test:emulator -- crossPackageIdentityIntegration.emulator.test.ts"` (targeted) | 172/172 across 13 files (164 baseline + 8 new), clean |
| `firebase emulators:exec ... "test:emulator"` (full suite, run twice) | 172/172 both runs; one earlier run showed a single unrelated transient failure in `authenticationReferenceRepository.emulator.test.ts`'s pre-existing concurrency test (this session's already-documented flakiness pattern under host load, confirmed transient by the clean retry, untouched by this task) |
| `pnpm --filter web exec vitest run` | 259/259 |
| `pnpm build` (both workspaces) | Clean |

**Confirmed:** (1) tests pass individually (targeted run); (2) tests pass as a grouped integration suite (all 8 together); (3) tests pass in the full emulator suite (172/172, twice); (4) no production behavior was duplicated inside test helpers (`FixedGenerator` only injects a deterministic value, all assertions read real returned/persisted state); (5) no unrelated package was modified; (6) no live Firebase deployment occurred (no `firebase deploy` run, no live project configured); (7) F2 is marked corrected — all required integration coverage passed.

## 23. Dependencies Added

None.

## 24. Configuration Changes

None.

## 25. Security and Privacy Assessment

Every scenario that touches audit output (1, 3, 4, 5, 6) explicitly asserts the minimised-payload guarantee holds under cross-package conditions — raw Loyalty Numbers, QR references, and recovery-proof references are confirmed absent from `queryAuditRecordsBy*` results even when the same values are confirmed present in the raw `outboxEntries` documents in the same test. Scenario 6 additionally confirms the conflict-detection audit event omits the raw authentication subject reference. No new attack surface, credential, or PII path was introduced — this task is test-only.

## 26. Risks

None new. No production code changed; only test coverage was added.

## 27. Remaining Limitations

- No production orchestration/composite command exists for the full identity-issuance chain or for whole-chain idempotent replay — both are tested via the longest real chain of governed package commands, not a single call, as explicitly permitted by the task brief.
- Recovery via Authentication-Reference or support-managed reference remains untestable because no production code implements that lookup route (a pre-existing, disclosed `-07` scope boundary).
- No genuinely cross-package (two separate domain packages) document-level race exists in this architecture to test for Scenario 7 — QR/LN issuance and identity lifecycle write to disjoint Firestore documents; the implemented recovery-vs-closure race is the most realistic race the current architecture can genuinely exercise, matching the task's own suggested scenario.
- UI/API-layer coverage remains entirely deferred — no UI or API exists for this capability yet.

## 28. F2 Final Status

**Corrected.** All 7 required scenarios (8 tests) pass; zero production defects found; zero P0–P3 findings recorded by this task.

## 29. Deferred Findings

F3–F11 (and the informational findings) from `ENG-P2-ARCH-REVIEW-001` are unaffected and remain open, per this task's own scope constraint. No change was made to any of them.

## 30. Rollback Instructions

`git revert` of this task's commit, or discard the branch — not yet merged. Purely additive (one new test file plus documentation); no production code, data, deployment, or live configuration affected either way.

## 31-34. Tracking Updates

See §20 for the full file list. The Architecture Review Report's F2 entry is updated in place (bracket-marker convention, original text struck through and preserved, not deleted) to record the correction and link to this report. `IMPLEMENTATION_CHANGES.md` and `documentation-changes-log.md` entries are appended alongside this report's own commit. This report itself serves as the persistent task-level Markdown record. F3–F11 are explicitly not marked corrected. Customer Profile, Authentication, ITM, and Capability 2 overall status are unchanged and not advanced.

## 35. PR Details

See the completion report delivered in chat for PR number, branch, head SHA, mergeability, CI status, and unresolved-thread count (recorded after the PR is opened, per the task's own required sequencing).
