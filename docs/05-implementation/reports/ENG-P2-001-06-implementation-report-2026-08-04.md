# ENG-P2-001-06 Implementation Report — Identity Lifecycle and Status Management

**Date:** 2026-08-04
**Author:** Claude (AI agent), governed execution loop
**Work package:** `ENG-P2-001-06` — Identity Lifecycle and Status Management (per [`ENG-P2-001-PLAN-001`](../roadmap/ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md) §`ENG-P2-001-06`)
**Branch:** `feat/eng-p2-001-06-identity-lifecycle`
**Entry commit:** `49a1a2c21efc8e91823df866eaa39f7a48d7462f` (PR #60 merge — `ENG-P2-001-05` Identity Persistence)

This report also serves as the persistent task-level Markdown record for this work package (item 32 of the required completion report) — this file, cross-referenced from `IMPLEMENTATION_CHANGES.md` and `documentation-changes-log.md`, rather than a separate formal Engineering Implementation Record, since this task's brief did not invoke that heavier-weight, separately-gated process.

## 1. Executive summary

Implements a controlled lifecycle and status-management layer for Customer Identity, layered directly on `-01`'s already-merged status model and `-05`'s already-merged persistence foundation. `-01`'s `IdentityStatus` type, transition table, and `transitionIdentityStatus` function are reused unmodified; this package adds bounded transition-authority and transition-reason value objects, a recovery boundary (`recoverCustomerIdentity`, restricted to `suspended`/`locked` sources), the one domain event `-01` explicitly deferred (`IdentityBecameDormant`), a new `IdentityRecovered` event, and a transactional, idempotent persistence layer. `ENG-P2-001-PLAN-001` §14 Ambiguity 1 (`Recovered`: persistent status vs. transition/event/marker) is resolved — per its own table, no Founder input was required — exactly matching `-01`'s already-adopted enum. No Firestore Rules change was needed.

## 2. Starting repository state

Primary checkout (`/Users/theo/11THONUS`, branch `chore/eng-p1-001-closure`) inspected only — 33 pre-existing unrelated dirty entries, unchanged throughout, never touched.

## 3. Clean-worktree evidence

- `git fetch origin main` confirmed `origin/main` at `49a1a2c21efc8e91823df866eaa39f7a48d7462f`.
- `git worktree add -b feat/eng-p2-001-06-identity-lifecycle <path> origin/main`.
- `git rev-list --left-right --count origin/main...HEAD` = `0 0`.
- Working tree clean; no merge/rebase in progress.
- `functions/src/domains/{identity,loyaltyNumber,qrIdentity}` all present (`-01`/`-03`/`-04`); `functions/src/domains/*/repositories/` and `functions/src/security/` present (`-05`).
- Baseline validation before any edit: `functions` unit 275/275; emulator suite 74/74 (after two transient system-load retries, matching this session's already-disclosed flakiness class); `apps/web` unit 259/259 (one transient timing-flake, `PhoneAuthHarnessPage.test.tsx`, confirmed resolved on isolated retry, unrelated to `functions/`).

## 4. Starting commit and branch

`49a1a2c21efc8e91823df866eaa39f7a48d7462f`, branch `feat/eng-p2-001-06-identity-lifecycle`.

## 5. Pre-edit analysis

Delivered in full as chat text before any edit — status model, definitions, classification, the `Recovered` determination, transition matrix, authority/reason models, persistence/audit/idempotency requirements, and the complete file-change list. Key finding: `-01`'s merged domain layer already implements the full required transition matrix and status set; the actual gap for this package is the application/persistence layer plus the two genuinely-missing events (`IdentityBecameDormant`, `IdentityRecovered`).

## 6. Status model

Reused `-01`'s `IDENTITY_STATUSES` (`registered`, `active`, `dormant`, `suspended`, `locked`, `closed`, `archived`) and `PERMITTED_TRANSITIONS` verbatim — no change. `Recovered` is not a member (see §11).

## 7. Transition matrix

Unchanged from `-01`: `registered→active`; `active↔dormant`; `active↔suspended`; `active↔locked`; `{dormant,suspended,locked}→closed`; `closed→archived`; `archived→[]` (terminal). `closed→active` and `archived→anything` remain unpermitted, already enforced by `assertTransitionPermitted`.

## 8. Transition authority model

New `functions/src/domains/identity/models/transitionAuthority.ts`: closed category `customer_initiated | system_initiated | support_initiated | administrator_initiated | security_policy_initiated`, grounded in TRD12 §12.13 (customer-requested closure), §12.30–31 (support-assisted recovery), §12.33 (administrative suspension). No role/permission system, no UI; validated shape only — the application boundary that maps a real caller to a category is a future package's concern.

## 9. Transition reason model

New `functions/src/domains/identity/models/transitionReason.ts`: `customer_inactivity | customer_request | suspected_compromise | administrative_suspension | policy_breach | support_recovery | account_closure | archival_retention_completion | system_lifecycle_rule`. Bounded category only — no arbitrary free-text narrative in domain events, logs, or this value object.

## 10. Lifecycle-service implementation

`recoverCustomerIdentity` (new, `functions/src/domains/identity/services/identityLifecycleService.ts`) is the only new domain-layer service. General transitions reuse `-01`'s existing `transitionIdentityStatus` directly — no parallel state machine was built.

## 11. Recovery boundary

`recoverCustomerIdentity` restricts recovery-eligible source statuses to `suspended`/`locked` only (`dormant` explicitly does not require recovery, `ENG-P2-ARCH-001` §3: "Renewed activity → Active directly"; `active`/`registered`/`closed`/`archived` have nothing to recover from or are terminal). Preserves Customer Identity ID, authentication references, and trust reference by construction (the function only reads/writes `status`/`updatedAt`/`updatedBy`); Loyalty Number and QR reference are untouched by construction (separate collections, never referenced). Emits `IdentityRecovered` carrying `previousStatus` and `authority`. Never creates a second identity — confirmed by test (`result.identity.id === identity.id`, `result.identity !== identity` object identity only). `Recovered` is implemented as this event only, never as a persisted `IdentityStatus` value — `ENG-P2-001-PLAN-001` §14 Ambiguity 1's own row states "Founder input required? No," recommending exactly this resolution; `-01`'s already-merged `IDENTITY_STATUSES` enum already has no `recovered` member. Ambiguity 1 marked resolved in the roadmap doc (§20 below). Excluded per this task's own brief: OTP, email recovery, Google account linking, identity proof, support-case workflow, merchant verification, recovery UI — all deferred to `-07`/Authentication/ITM.

## 12. Persistence changes

New `functions/src/domains/identity/repositories/identityLifecycleRepository.ts`: `transitionCustomerIdentityStatus` and `recoverCustomerIdentityStatus`, both reusing `-05`'s `checkAndReserveIdempotencyKey`/`completeIdempotencyKey`/`failIdempotencyKey` convention and one-transaction-per-command pattern verbatim. `transitionCustomerIdentityStatus` additionally validates an optional `expectedCurrentStatus` inside the transaction (stale-state rejection) before applying the transition. Both write `lastTransitionAuthority`/`lastTransitionReason` directly onto the `users/{id}` document as plain audit fields — not part of `UserDocument`'s typed shape, a deliberate choice over retrofitting `-01`'s already-merged domain-event payloads (a breaking change to reviewed code). Immutable identifiers (`id`, `createdAt`, `createdBy`) are never touched.

## 13. Firestore Rules assessment

**No change required.** `-05`'s existing `users/{customerIdentityId} { allow read, write: if false; }` block already denies every direct-client mutation path this package's own security requirements name (self-activation, self-unsuspension, self-unlocking, cross-identity closure, archival, transition-metadata forgery, audit-field modification) — there is no differentiated per-action rule to add when the baseline is a blanket deny. No new Rules test was required for this reason; `-05`'s existing, already-merged, mutation-tested Rules suite continues to cover `users/{id}` unchanged.

## 14. Idempotency and concurrency strategy

Reused `-05`'s idempotency convention exactly (no competing framework). Tested: repeated identical transition (no duplicate event); repeated recovery command (no duplicate event); a stale expected-status assumption (rejected); repeated closure and repeated archival (each idempotency-keyed separately, no duplicate event per key); two concurrent conflicting transition attempts under the same idempotency key (exactly one Firestore-transaction winner, verified via `Promise.allSettled`, final status deterministic).

## 15. Domain events

New: `IdentityBecameDormant` (`{customerIdentityId, previousStatus}`) — fills the gap `-01`'s own code comment explicitly deferred to this task; `IdentityRecovered` (`{customerIdentityId, previousStatus, authority}`). Both added to the existing, already-merged `functions/src/domains/identity/events/identityEvents.ts` — no new event-contract module. `customerIdentity.ts`'s `buildStatusEvent` extended with one new `if (toStatus === "dormant")` branch (its prior "no event for dormant" comment removed, since this task's own scope now fills that gap) — the existing `active↔suspended↔locked↔closed↔archived` event branches are byte-for-byte unchanged. Neither payload carries phone numbers, emails, tokens, or trust evidence — verified by test.

## 16. Errors

Four new factories added to the existing, already-merged `IdentityDomainError` class (no new error hierarchy): `invalidTransitionAuthorityError`/`invalidTransitionReasonError` (`VALIDATION_FAILED`), `staleIdentityStatusError` (`IDEMPOTENCY_CONFLICT`), `recoveryNotPermittedError` (`INVALID_STATE_TRANSITION`). No raw Firestore errors exposed.

## 17. Audit and observability

Every transition records: previous status (event payload or pre-image comparison), new status (document + event type), reason category, authority category, actor reference (`updatedBy`/`recoveredBy`), timestamp (`updatedAt`/`recoveredAt`), correlation/event ID (existing envelope fields), and — for recovery specifically — the authority carried directly in the `IdentityRecovered` payload. Nothing sensitive is logged; the transition-reason/authority value objects are closed categories, not narrative.

## 18. Files inspected

`customerIdentity.ts`, `identityStatus.ts`, `identityEvents.ts`, `customerIdentityRepository.ts`, `userDocument.ts` (all `-01`/`-05`, reused not duplicated); `firestore.rules` (confirmed sufficient, unchanged); PRD2 §7; TRD10 §10.6.1; TRD12 §12.6 (`AIR-001`–`006`), §12.13, §12.30–34; `ENG-P2-ARCH-001` §3, §6; `ENG-P2-001-PLAN-001` §14 Ambiguity 1; `ENG-P2-GATE-001` §8; Decision Register (`DEC-SEC-001` 8 Identity Recovery Principles, `DEC-IDENTITY-001`).

## 19. Files created

`functions/src/domains/identity/models/{transitionAuthority,transitionReason}.ts` (+`.test.ts`); `functions/src/domains/identity/services/identityLifecycleService.ts` (+`.test.ts`); `functions/src/domains/identity/repositories/identityLifecycleRepository.ts` (+`.emulator.test.ts`); this report.

## 20. Files modified (narrow, additive only)

`customerIdentity.ts`/`.test.ts` (one new event branch; one pre-existing test updated to reflect the now-in-scope event, per TDD); `identityEvents.ts`/`.test.ts` (two new event builders); `identityErrors.ts`/`.test.ts` (four new factories); `docs/02-technical/trd/10-firestore-data-architecture.md` §10.6.1 (`users.status` enum corrected: `pending`→`registered`, `dormant` added, amendment-in-place); `ENG-P2-001-PLAN-001` (`-06` "Updated" callout, summary-table row, §14 Ambiguity 1 marked resolved); Engineering Implementation Programme, Coding-Agent Prompt Register (narrow `-06`-only notes).

## 21. Code-diff summary

+10 files created (6 source + 4 test/emulator-test), 6 existing files extended additively (2 domain-event-builder additions, 1 new event branch, 4 error factories, 1 doc correction, tracker prepends). Zero files deleted. Zero unrelated files touched.

## 22. Tests added or modified

Unit: `transitionAuthority.test.ts` (7), `transitionReason.test.ts` (7), `identityLifecycleService.test.ts` (9), `identityErrors.test.ts` (+4), `identityEvents.test.ts` (+4), `customerIdentity.test.ts` (1 updated, not net-new). Emulator: `identityLifecycleRepository.emulator.test.ts` (10 — valid transition, outbox write, illegal-transition rejection, stale-state rejection, idempotent replay, repeated closure/archival, concurrent-conflict resolution, recovery success + event, duplicate-recovery replay, recovery-ineligible rejection).

## 23. Validation commands and results

- `pnpm lint` — zero findings repo-wide.
- `pnpm format:check` — clean (after `prettier --write` on 3 files flagged for drift).
- `pnpm typecheck` — clean (`apps/web`, `functions`).
- `pnpm test` — `functions` 45 files/309 tests passed (275 pre-existing + 34 new); `apps/web` 30 files/259 tests passed (1 pre-existing timing-flake confirmed transient on isolated retry, unrelated to `functions/`).
- `pnpm emulators:validate` — 8 files/84 tests passed (74 pre-existing + 10 new), clean on the qualifying run (two earlier attempts hit the same disclosed pre-existing concurrency-timeout flakiness class under elevated local system load, unrelated to this diff).
- `pnpm build` — clean.

## 24. Dependencies added

None.

## 25. Configuration changes

None (no `package.json`, `tsconfig.json`, `vitest.config.ts`, or `firestore.rules` change).

## 26. Security and privacy assessment

Direct client mutation of `users/{id}` remains fully denied (§13). No sensitive data enters any event payload, error message, or the two new audit fields (§9, §17). No caller-supplied authority claim is accepted without passing through this package's own closed-category validation. No production deployment, no live-data migration — this worktree never ran a deploy command; the live `eleventh-on-us-dev` project (confirmed via read-only Firestore listing) still holds zero documents in any Identity-domain collection.

## 27. Risks

- The genuine implementation gap found and fixed during TDD (`expectedCurrentStatus` check initially declared in the type but never checked) is now covered by a dedicated regression test.
- `Dormant`'s inactivity-threshold configuration point is not implemented — no automatic dormancy scheduling exists; a future package must add it (explicitly deferred, not silently invented).
- Two local emulator-suite runs hit the same pre-existing, already-disclosed concurrency-timeout flakiness class (traced to elevated local system load during the `-05` merge task in this same session); the qualifying, clean run is the evidence of record, consistent with this project's established handling of that issue.

## 28. Deferred items

Full recovery orchestration; recovery identity-proof methods (OTP, email, Google linking); support-case workflows; customer-facing lifecycle UI; merchant-facing controls; administrative dashboards; automatic dormancy scheduling; ITM-driven transition policy; fraud-driven suspension; notification; retention execution; production data migration. None implemented silently.

## 29. Markdown implementation report

This document.

## 30. `IMPLEMENTATION_CHANGES.md` update

New dated entry appended (see the file itself).

## 31. Documentation changes-log update

New entry appended to `docs/00-governance/documentation-changes-log.md`.

## 32. Persistent task-level Markdown record

This document (see the note under the title).

## 33. PR evidence

Recorded after PR creation, in the final completion report delivered in chat (per this task's own instruction not to merge without fresh Founder authorization).
