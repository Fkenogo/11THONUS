# PLATFORM-BASELINE-002 — Customer Identity Artifact Establishment — Implementation Report

**Date:** 2026-09-11
**Authority:** `FD-CUST-ID-ART-001` (Founder, supplied in the task brief), recorded as `DEC-CUST-ID-ART-001` (CONFIRMED) in the Decision Register by this package.
**Note on record type:** this task's identifier (`PLATFORM-BASELINE-002`) is not a numbered `ENG-Pn-nnn` work package under the Engineering Implementation Programme, so no EIR was drafted against that template and no `engineering-implementation-programme.md` / `coding-agent-prompt-register.md` row was added — following the `PLATFORM-BASELINE-001` precedent (its report states the Founder/reviewer decides on any `ENG-Pn` retrofit). This report serves as the required `.md` change-tracking record.

## 1. Exact base SHA

`abccd06bdb22c58c3df298272a768cf78f860444` (`origin/main` — the `PLATFORM-BASELINE-001` merge commit, verified current by `git fetch` immediately before branching; `main` has not drifted).

## 2. Branch/worktree

Branch: `feat/platform-baseline-002-customer-identity-artifacts`, created from the base SHA above in a dedicated, isolated git worktree outside the primary worktree (which holds unrelated in-progress legal/commercial work that was never touched, stashed, reset, or committed).

## 3. Files modified

Added (3): `functions/src/domains/identity/services/customerIdentityArtifactEstablishment.ts` (+ emulator test), this report.

Modified (15): `functions/src/domains/loyaltyNumber/repositories/loyaltyNumberRepository.ts`, `functions/src/domains/qrIdentity/repositories/qrIdentityRepository.ts`, `functions/src/domains/identity/models/identityErrors.ts` (+ test), `functions/src/domains/loyaltyNumber/models/loyaltyNumberErrors.ts` (+ test), `functions/src/domains/authentication/services/registrationSignInService.ts` (+ unit test, + emulator test), `functions/src/domains/authentication/services/identityRecoveryService.ts` (+ unit test, + emulator test), `eslint.config.js`, `docs/00-governance/decisions/decision-register.md`, `docs/00-governance/documentation-changes-log.md`.

No file outside these was touched.

## 4. Code diff summary

- New `ensureCustomerIdentityArtifacts` orchestration (identity `services/`, Firebase-adapter-capable via a precedented eslint exemption): validate-first, repair-only-what-is-missing, fail-closed contradictions, deterministic per-identity issue keys, bounded `IDEMPOTENCY_CONFLICT` retry (3 attempts), `CustomerIdentityId`-only inputs.
- Two read-only single-field list helpers in the owning LN/QR repositories (no composite index required).
- Two new error factories in the existing closed 14-category taxonomy (no new category).
- Wiring at the three shared service boundaries (registration, sign-in re-entry, recovery) via `ensureArtifacts?` deps seams; no transport/handler copies, no new callable, no `index.ts` change.
- Governance: `DEC-CUST-ID-ART-001` recorded verbatim (CONFIRMED, Founder, 2026-09-11); register summary CONFIRMED 47→48, Total 107→108; changes-log Entry 212.

## 5. Existing architecture analysis

- **Customer Identity** (`identity/models/customerIdentity.ts`): aggregate owns no LN/QR data (header states this explicitly); `registerCustomerIdentity` creates the identity directly `active` (`DEC-IDENTITY-001` Standard Participation); transitions via `transitionIdentityStatus`; recovery via `recoverCustomerIdentity`.
- **Persistence** (`users` collection; `customerIdentityRepository`, `identityLifecycleRepository`): transactional + `checkAndReserveIdempotencyKey`/`complete`/`fail` + `writeOutboxEntry(transaction, db, event)` — the convention this package reuses without modification.
- **Loyalty Number** (`loyaltyNumber/`): `loyaltyNumbers/{value}` doc-ID-as-value; assignment resolved via `customerProfiles/{id}.loyaltyNumber` projection; pure `issueLoyaltyNumber` (existing-assignment reuse, cross-identity conflict error, bounded collision retry, `LoyaltyNumberIssued` event); transactional `issueLoyaltyNumberForIdentity` (+ projection upsert + outbox).
- **QR Identity** (`qrIdentity/`): `qrIdentityRecords/{reference}` doc-ID-as-value with `status: active|invalidated` + `replacedByReference` audit retention; current QR via `customerProfiles/{id}.qrReference`; pure `issueQrIdentity`/`regenerateQrIdentity`; transactional `issueQrIdentityForIdentity` / `regenerateQrIdentityForIdentity` (+ outbox).
- **Reads are already side-effect-free**: `-09` lookups, `getLoyaltyNumberAssignment(ForIdentity|ByValue)`, `getActiveQrIdentity*` never write (the `-09` module header documents this as a hard rule).
- **No production orchestration existed**: `crossPackageIdentityIntegration.emulator.test.ts` composes create+issue manually in tests only; `PRODUCT-ALIGN-002`'s changes-log entries explicitly record that wiring establishment into `registrationSignInService.ts` was a sanctioned stop condition awaiting this package — confirming this integration is the authorized next step, not a contradiction.
- **Eslint**: only Firebase-SDK import restrictions per domain exist; no identity↔loyaltyNumber↔qrIdentity↔authentication cross-domain import ban (only the Platform Administration isolation boundary). The new identity `services/` file carries a precedented per-file exemption (commerceKnowledge pattern).

## 6. Identified activation path(s)

Every production-reachable path into canonical `active` (verified by grep, non-test callers only):

1. **Registration** — `authenticate` callable → `handleAuthenticate` → `registerOrSignIn.register()` → `createCustomerIdentity` (born `active`). The sole production creation path.
2. **Recovery** — `recoverAuthenticatedIdentity` callable → `handleRecoverIdentity` → `recoverAuthenticatedIdentity` → `recoverCustomerIdentityByReference` → `recoverCustomerIdentityStatus` (`suspended`/`locked` → `active`).
3. **Generic `transitionCustomerIdentityStatus`** — zero production callers (tests only); left untouched, no bypass exists.
4. **Sign-in of an already-`active` identity** — not an activation, but the re-entry point (covers pre-package artifact-less identities and interrupted-registration retries); also triggers establishment (idempotent no-op when converged).

## 7. Artifact establishment architecture

`Customer Identity becomes active → ensureCustomerIdentityArtifacts (shared) → ensure Loyalty Number → ensure current QR Identity.` The orchestration runs **after** the committing transition (never inside the identity transaction), so a transition commit never rolls back on artifact failure and establishment stays independently retryable/repairable. All three triggers call the one shared operation; logic is never copied into transport handlers; `index.ts` is unchanged.

## 8. Loyalty Number invariant implementation

Authoritative `loyaltyNumbers` records listed per identity (single-field query): 0 → create exactly one via `issueLoyaltyNumberForIdentity` (deterministic key `customer-identity-artifacts:ensure:loyalty-number:{id}`, stable hash, default CSPRNG generator); 1 → reuse after format (`createLoyaltyNumber`), self-consistency (doc-id == value), and projection-agreement validation; >1 → `multipleLoyaltyNumberAssignmentsError` (VALIDATION_FAILED); malformed/incompatible value or disagreeing projection → `malformedLoyaltyNumberRecordError` / `conflictingLoyaltyNumberAssignmentError`. No silent choice, no auto-delete, no extra creation.

## 9. QR Identity invariant implementation

Authoritative `qrIdentityRecords` listed per identity: any record bound to a different Loyalty Number → `conflictingQrIdentityAssociationError`; >1 `active` → `duplicateActiveQrIdentityError`; 1 valid current → reuse after projection-pointer agreement (a pointer resolving elsewhere fails closed — governed writes never leave it disagreeing); 0 current + absent/dangling pointer → create exactly one via `issueQrIdentityForIdentity` (deterministic key); 0 current + pointer resolving to an existing record → fail closed (governed writes never point at a non-current record, so this is out-of-band). Bindings are never rewritten; the Loyalty Number never changes on QR (re)issue.

## 10. Repair semantics

Explicit server-side operation only (never in reads): active + no LN → create LN then QR; active + valid LN + no QR → create QR only; active + valid LN + valid current QR → no-op returning the established state. Contradictions (two LNs, wrong-LN QR, multiple current QRs, malformed records) fail with no mutation — proven by test.

## 11. Concurrency/idempotency strategy

Deterministic per-operation, per-identity idempotency keys + stable request hash make every trigger converge on one logical operation; Firestore transactions + doc-ID-as-value uniqueness provide atomicity; a bounded 3-attempt retry on `IDEMPOTENCY_CONFLICT` lets a simultaneous loser revalidate into the winner's committed state. Proven by a real-emulator simultaneous-establishment test (exactly one LN, one current QR, convergent retry) plus idempotent-rerun and interrupted-run tests. Mocked repositories were not used for any concurrency invariant.

## 12. Read-side purity evidence

No read was modified. New list helpers are pure reads. Emulator test proves `lookupCustomerIdentityById` (internal_service) + `getLoyaltyNumberAssignmentForIdentity` + `getActiveQrIdentityByCustomerIdentityId` on an artifact-less active identity add zero documents, zero outbox entries, zero idempotency records (baseline-compared). Sign-in integration is on the authentication **command** path (session issuance), not a read surface; every §7-listed read (getters, discovery callables, profile/home/QR/auth reads) is untouched.

## 13. Error/fail-closed behavior

Existing taxonomy only (closed 14 categories): not-found → `unknownCustomerIdentityError` (RESOURCE_NOT_FOUND); non-active → new `identityNotActiveError` (INVALID_STATE_TRANSITION); multiple LNs → new `multipleLoyaltyNumberAssignmentsError` (VALIDATION_FAILED, F9B mapping); wrong/multiple QR → existing `conflictingQrIdentityAssociationError` / `duplicateActiveQrIdentityError` (INVALID_STATE_TRANSITION); malformed records → existing malformed-record errors (VALIDATION_FAILED, thrown by converters); persistence failures propagate unchanged. Contradictions never become success.

## 14. Tests added

- `customerIdentityArtifactEstablishment.emulator.test.ts` (14 tests): fresh, idempotent-rerun (write-nothing proof), repair A, repair B/interrupted-run retry, 6 contradiction cases (duplicate LNs, wrong-LN QR, multiple active QRs, cross-identity pointer, malformed LN, malformed QR), non-active, unknown identity, simultaneous concurrency, read purity.
- Wiring unit tests: 3 (register/sign-in/refused-sign-in) in `registrationSignInService.test.ts`, 1 (post-recovery) in `identityRecoveryService.test.ts`.
- Error-factory unit cases: `identityNotActiveError`, `multipleLoyaltyNumberAssignmentsError`.
- Integration emulator tests: registration-establishes + sign-in-reuse (2), recovery-establishes (1).

## 15. Emulator test results

Full suite: **62 files passed, 789 tests passed, 2 skipped, 0 failed** (run via `firebase emulators:exec` with firestore 8180/auth 9299 alternate-port config — port 8080 was held by another session's unrelated emulator; same suites and assertions as canonical `emulators:validate`).

## 16. Full regression results

- `pnpm --filter functions run test`: **157 files / 1705 tests passed** (was 1699; +6 new unit tests).
- Emulator regression: §15 (clean).
- `pnpm run lint`: 0 errors (1 pre-existing unrelated `apps/web` warning); `pnpm run format:check`: clean; `pnpm run typecheck` (all workspaces): clean; `pnpm run build`: clean.

## 17. PostgreSQL regression result

`PLATFORM_ENV=test pnpm --filter functions test:postgres` against a disposable Postgres 16 container (started `--wait`, torn down `-v`): **3 files / 23 tests passed** — no cross-foundation regression (this package touches no Postgres code).

## 18. CI run/result

_To be recorded after exact-head CI completes on the PR head below._

## 19. Dependencies added

None. No lockfile change.

## 20. Config changes

`eslint.config.js` only (two-file exemption with precedented rationale comment). No CI, deployment, secret, or Firebase config change.

## 21. Schema/persistence changes

None: no new collection, no new field, no new index (single-field queries need none), no PostgreSQL table, no dual-write, no synchronization. Reuses `users`, `customerProfiles`, `loyaltyNumbers`, `qrIdentityRecords`, `authenticationReferences`, `idempotencyRecords`, `outboxEntries`.

## 22. Governance/decision record changes

`decision-register.md`: added `DEC-CUST-ID-ART-001` (CONFIRMED, Founder, 2026-09-11, `FD-CUST-ID-ART-001` quoted verbatim); summary CONFIRMED 47→48, Total 107→108. `documentation-changes-log.md`: Entry 212. No other governance document touched; no related decision invented; other decisions' statuses unchanged.

## 23. Risks

- Every sign-in now performs a few extra Firestore reads (identity already read; +profile + two single-field queries) — read-only when established; acceptable for correctness-guaranteed re-entry.
- A transient establishment failure inside registration surfaces as a request error after the identity commit; the retry becomes a sign-in that repairs via the same operation — by design, documented in-code.
- Simultaneous triggers may observe one retryable `IDEMPOTENCY_CONFLICT` before converging (bounded, then success).

## 24. Known limitations

- `transitionCustomerIdentityStatus` has no production caller, so no generic post-transition hook was added; if a future production caller transitions identities to `active` outside registration/recovery, it must invoke the shared ensure operation (documented in the service header).
- No transport (callable) exposes ensure directly; repair is via the three wired flows or explicit server-side invocation.
- No CI job change; the new emulator file runs in the existing `test:emulator` suite.

## 25. Rollback instructions

`git revert` the PR merge (or drop the branch / do not merge). No dependency, schema, index, secret, or config change to unwind; disposable Postgres/Emulator instances already torn down.

## 26. PR number

[#247](https://github.com/Fkenogo/11THONUS/pull/247) — opened after successful local validation. Not merged, per instruction.

## 27. Exact PR head SHA

Substantive implementation commit: `f1af56ff4df43574f0e71222983d1d62a19df939`. Any commit after it contains only this report's PR-number/head-SHA/CI notes (no code change); the exact reviewed head is the branch tip at review time.

## 28. Markdown implementation report

This document.

## 29. `.md` change-tracking record

This document (same `PLATFORM-BASELINE-001` precedent: the report is the tracking record; no `ENG-Pn` retrofit).
