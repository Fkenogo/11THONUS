# ENG-P2-001-07 Implementation Report — Identity Recovery Foundation

**Date:** 2026-08-05
**Status:** Implemented, TDD, all new/modified tests passing — pending Founder-authorized review/merge

## 1. Executive summary

Implements the identity-owned portion of Identity Recovery: a provider-neutral recovery-proof contract, a bounded, exact-match (non-enumerable) identity-lookup boundary (Customer Identity ID / Loyalty Number / current QR reference), and an atomic, idempotent recovery orchestration built entirely on the merged `-01`/`-05`/`-06` foundation. No new dependency, no Authentication/ITM/UI implementation, no Firestore Rules change (existing deny-by-default catch-all already covers the one new collection this package introduces).

## 2. Starting repository state

Primary checkout `/Users/theo/11THONUS`, branch `chore/eng-p1-001-closure`, same 33 pre-existing unrelated dirty entries throughout — inspected read-only, never touched.

## 3. Clean-worktree evidence

`git worktree add -b feat/eng-p2-001-07-identity-recovery-foundation <path> origin/main`. Confirmed `0/0` divergence against `origin/main`, clean tree, no rebase/merge in progress, before any edit.

## 4. Starting commit and branch

`d1c3155ea3a469ca7b1c793bfe689507b376ba13` (the exact required merge commit), branch `feat/eng-p2-001-07-identity-recovery-foundation`. `-01`, `-03`, `-04`, `-05`, `-06` all confirmed present. Pre-edit baseline: functions unit 310/310, real Firebase Emulator Suite 85/85.

## 5. Pre-edit analysis

Delivered in full as chat text before any edit (14 points): recovery's meaning in the current architecture; eligible/ordinary-reactivation/terminal lifecycle states; the proof/lookup/restoration/relinking/ITM boundary (narrower than `ENG-P2-001-PLAN-001` §2's original `-07` scope — this task's own current brief, being more specific and more recent, is followed); the recovery-proof contract; the lookup model; duplicate-prevention strategy; the transaction boundary; the idempotency model; audit evidence; the failure/conflict model; every file expected to change; files inspected but unchanged.

## 6. Recovery architecture

Recovery restores an existing Identity Aggregate's lifecycle state after an already-completed, out-of-scope proof process — it is never itself the proof. Three layers: (1) `recoveryProof.ts` — pure, Firebase-free validation of an already-completed proof; (2) `identityRecoveryRepository.ts` — resolves a bounded lookup reference to a concrete identity, then delegates; (3) `identityLifecycleRepository.ts`'s extended `recoverCustomerIdentityStatus` (`-06`) — the single atomic transaction performing proof-reuse reservation, status transition, and event emission.

## 7. Recovery-proof contract

`RecoveryProof` (`recoveryProof.ts`): `result` (`accepted`/`rejected`), `methodCategory` (closed 5-category enum derived from TRD12 §12.30, excluding the Business Ownership Recovery category which is §12.32's separate concern), `proofReference` (opaque string, never a credential), `authority`, `completedAt`, `targetCustomerIdentityId`, optional `expiresAt`. `validateRecoveryProof` rejects: missing/malformed reference, rejected result, target mismatch, expiry (where governed) — each via a dedicated `IdentityDomainError` factory.

## 8. Identity lookup boundary

`RecoveryLookupReference` — a closed discriminated union of exactly three routes, each an exact-match, doc-ID-keyed, non-enumerable read against already-merged, immutable mappings: Customer Identity ID (`-05`), Loyalty Number (`loyaltyNumbers/{value}`, read via the already-exported `fromLoyaltyNumberDocument` converter — no new export added to `-03`'s repository), current QR reference (`-04`'s already-exported `getActiveQrIdentityByReference`, which already fails closed on unknown/invalidated references). Authentication-subject-reference and support-managed-reference routes are assessed and deliberately deferred — no reverse index exists yet without new schema, out of this Foundation's bounded scope. A lookup miss throws `unknownCustomerIdentityError`; it never creates an identity.

## 9. Recovery eligibility

Unchanged from `-06`: `suspended`/`locked` only. `dormant → active` remains ordinary reactivation (the general `transitionIdentityStatus` path, unmodified). `registered → active` remains activation. `closed`/`archived` remain non-recoverable (rejected by `assertTransitionPermitted`, unmodified).

## 10. Recovery orchestration service

`identityRecoveryRepository.ts`'s `recoverCustomerIdentityByReference` resolves the reference, then calls `-06`'s extended `recoverCustomerIdentityStatus`, which (inside one transaction): reads the identity and the proof-reuse reservation doc; rejects if the identity doesn't exist or the proof was already used; calls `-06`'s `recoverCustomerIdentity` (eligibility check + status transition + event, unmodified in its own logic, extended only to accept and forward proof evidence); writes the status update, the proof-reuse reservation doc, and the outbox entry, all atomically. Never creates a second identity; never alters the Customer Identity ID, Loyalty Number, or QR reference (none of these fields are read or written by this path).

## 11. Authentication boundary

Not implemented, per this task's explicit instruction (narrower than the decomposition plan's original `-07` text). The recovery result exposes no authentication-relinking action — only the existing, provider-neutral `authority`/`recoveryProofReference` fields already on the domain event, which a future Authentication capability may consume as a handoff signal. No provider-specific field, import, or logic exists anywhere in this package.

## 12. ITM boundary

Not implemented. No trust computation, no trust-level change, no read of any trust reference. The `IdentityRecovered` event (already the existing `-06`/`-07`-extended event) is the only outbound signal a future ITM capability would consume, and it carries no trust evidence.

## 13. Duplicate-prevention strategy

Every lookup route is inherently 1:1 (doc-ID reads cannot return multiple documents), so true "ambiguous match" cannot arise mechanically within this Foundation's exact-match-only design — assessed and disclosed rather than given a fabricated, untestable trigger (heuristic duplicate detection is `-08`'s explicit scope). The one real, reachable, tested duplicate/conflict condition: the proof's own `targetCustomerIdentityId` disagreeing with the identity the lookup reference resolves to (covers both "proof for a different identity" and "a Loyalty Number/QR reference already linked to another identity") — `recoveryProofIdentityMismatchError`.

## 14. Persistence and atomicity

One Firestore transaction per recovery command (`recoverCustomerIdentityStatus`), mirroring `-05`/`-06`'s established pattern exactly: all reads (identity, proof-reuse doc) before all writes (status update, proof-reuse doc, outbox entry) — no competing repository pattern introduced. `expectedCurrentStatus` staleness (via the pre-existing `-06` mechanism, reused by `transitionCustomerIdentityStatus`) and the new proof-reuse reservation both fail the whole transaction atomically — no partial recovery can remain.

## 15. Firestore Rules assessment or changes

No `firestore.rules` change. The existing deny-by-default catch-all (`match /{document=**} { allow read, write: if false; }`) already covers the one new collection this package introduces (`recoveryProofReferences`) — confirmed by two new targeted Rules emulator tests (client write forgery denied; unauthenticated read denied), joining the existing 23 Rules tests (25/25 total).

## 16. Domain events and audit evidence

Reuses the existing `IdentityRecovered` event (`-06`), additively extended with `resultingStatus`, `recoveryProofReference`, `proofMethodCategory` — the same class of additive, same-capability, zero-external-consumer extension already accepted once this session (PR #61's correction). No new event type invented. No OTP, phone, email, token, password, raw document, or trust evidence in any field (privacy-asserted by existing tests, unchanged).

## 17. Errors

New, reachable, and tested: `recoveryProofMissingError`, `recoveryProofRejectedError`, `recoveryProofExpiredError`, `recoveryProofIdentityMismatchError`, `recoveryProofAlreadyUsedError`, `recoveryCommandConflictError`, `invalidRecoveryProofMethodCategoryError` — all appended to the existing `IdentityDomainError` class, all reusing the existing 14 closed categories. Reused unchanged: `unknownCustomerIdentityError`, `recoveryNotPermittedError`, `staleIdentityStatusError`, `identityRepositoryUnavailableError`. Assessed, deliberately not implemented (no reachable trigger in this Foundation's own scope, disclosed rather than fabricated): `ambiguousIdentityMatchError`/a distinct `duplicateIdentityRiskError` beyond the identity-mismatch case above.

## 18. Idempotency and concurrency

Two independent, composable mechanisms: (1) the existing `checkAndReserveIdempotencyKey` convention (command-level retry — a retried identical command short-circuits before ever reaching the proof-reuse check); (2) a new `recoveryProofReferences/{proofReference}` doc-ID-keyed collection (proof-level reuse — a genuinely different command presenting an already-consumed proof reference fails, even under a fresh idempotency key). Both are exercised by real Firebase Emulator Suite tests: repeated identical command, reused proof under a different idempotency key, stale expected status (reused from `-06`), event/outbox uniqueness.

## 19. Security and privacy

No identity enumeration (every lookup route is exact-match against an immutable mapping — no partial search). Proof replay is rejected structurally (the proof-reuse reservation). The proof reference is never itself treated as a credential — it is an opaque reservation key only, never used to authenticate or authorize any subsequent action beyond this one recovery command. No PII in any new event field. No raw Firestore/foreign-domain error (a caught `QrIdentityDomainError` at the QR lookup boundary is rewrapped into `unknownCustomerIdentityError`, keeping this package's error surface a single, bounded `IdentityDomainError` type). Rate-limiting and full abuse-prevention are explicitly deferred (see §Deferred items) — this Foundation establishes the fail-closed mechanics, not the operational controls.

## 20. Files inspected

`firestore.rules`, `loyaltyNumberRepository.ts`/`loyaltyNumberDocument.ts`, `qrIdentityRepository.ts`/`qrIdentityRecordDocument.ts`/`qrIdentityErrors.ts`, `customerIdentityRepository.ts`, `userDocument.ts`, `identityStatus.ts`, `errorCategories.ts`, `DEC-IDENTITY-001`/amended `DEC-SEC-001`/amended `DEC-PROV-004` (Decision Register), `ENG-P2-ARCH-001` §§3, 6–9, `ENG-P2-001-PLAN-001` §§2 (`-07` entry), 7 (Authentication/ITM interface boundaries), 14 (Ambiguity 1), TRD12 §§12.30–12.32, PRD2 §24.

## 21. Files created

`functions/src/domains/identity/models/recoveryProof.ts` (+`.test.ts`, 9 tests), `functions/src/domains/identity/repositories/identityRecoveryRepository.ts` (+`.emulator.test.ts`, 6 tests).

## 22. Files modified (narrow, additive only)

`identityEvents.ts`/`.test.ts` (`IdentityRecoveredPayload` +3 fields), `identityLifecycleService.ts`/`.test.ts` (`recoverCustomerIdentity` threads the 3 fields through, unchanged logic otherwise), `identityLifecycleRepository.ts`/`.emulator.test.ts` (`recoverCustomerIdentityStatus` gains proof validation + reuse-reservation, +5 emulator tests), `identityErrors.ts`/`.test.ts` (+7 factories), `firestoreRules.emulator.test.ts` (+2 tests, no Rules-file change).

## 23. Code-diff summary

9 files, 2 new. Net addition only — no existing branch of any pre-existing function was removed or altered in behavior for a caller that doesn't opt into the new proof fields.

## 24. Tests added or modified

`recoveryProof.test.ts` (9), `identityErrors.test.ts` (+7), `identityEvents.test.ts` (`IdentityRecovered` block extended), `identityLifecycleService.test.ts` (recovery block extended with proof fields), `identityLifecycleRepository.emulator.test.ts` (+5: proof-target-mismatch, expired proof, reused proof, plus 3 existing recovery tests extended), `identityRecoveryRepository.emulator.test.ts` (6, new), `firestoreRules.emulator.test.ts` (+2).

## 25. Validation commands and results

`pnpm lint` clean · `pnpm format:check` clean · `tsc --noEmit` clean · functions unit **327/327** (up from 310 baseline) · targeted new/modified emulator files **20/20** + Rules **25/25**, run in isolation to avoid unrelated system-load-induced concurrency flakiness (disclosed below) · full `pnpm emulators:validate` run multiple times under host system load average 16–20 (confirmed via `uptime`/`ps aux`, unrelated `Claude Helper`/`ChatGPT Classic`/`Safari` processes) — every failure observed was in a pre-existing, unrelated, already-disclosed concurrency-race test class (`outboxProcessor.emulator.test.ts`, `qrIdentityRepository.emulator.test.ts`), never in this task's own new/modified files, which passed cleanly every time they were exercised.

## 26. Dependencies added

None.

## 27. Configuration changes

None.

## 28. Risks

None new beyond the already-disclosed, pre-existing local emulator concurrency-flakiness class (environmental, not a regression). The narrower Authentication-boundary scope than `ENG-P2-001-PLAN-001` §2's original `-07` text is disclosed above (§5/§11) as a deliberate, current-brief-driven choice, not a silent scope reduction.

## 29. Deferred items

SMS/email/Google/Apple/passkey recovery, full support-case management, document/government-ID/merchant-assisted proof, ITM trust recalculation, automatic duplicate merging, customer-facing recovery UI, administrative recovery dashboard, notifications, rate-limiting implementation, production migration, Authentication-subject-reference and support-managed-reference lookup routes (no reverse index exists yet), a persisted recovery-request record (not required by the current decomposition plan — only the orchestration input contract, `RecoverCustomerIdentityByReferenceParams`, is defined; the deferral is explicit, not silent).

## 30. Rollback instructions

Revert the PR's merge commit on `main`; no live data affected (no production deployment, no migration).

## 31. `IMPLEMENTATION_CHANGES.md` update

New dated entry appended (2026-08-05 — ENG-P2-001-07).

## 32. Documentation changes-log update

New entry added at the top of `docs/00-governance/documentation-changes-log.md`.

## 33. Persistent task-level Markdown record

This report serves that role, per this task's own instruction.

## 34. PR evidence

Recorded in the completion report delivered in chat after PR creation (branch, head SHA, mergeability, CI status, unresolved-thread count).
