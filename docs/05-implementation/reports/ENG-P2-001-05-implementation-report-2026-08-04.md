# ENG-P2-001-05 Implementation Report — Customer Identity Persistence Foundation

**Date:** 2026-08-04
**Author:** Claude (AI agent), governed execution loop
**Work package:** `ENG-P2-001-05` — Identity Persistence (per [`ENG-P2-001-PLAN-001`](../roadmap/ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md) §`ENG-P2-001-05`)
**Branch:** `feat/eng-p2-001-05-identity-persistence-foundation`
**Entry commit:** `689a7521b5bb563dc47ef66c3b442278b63c8ff0` (PR #59 merge — `ENG-P2-001-04` QR Identity Service Foundation)

## 1. Objective

Implement the Firestore-backed persistence layer proving nine specific invariants hold for real, against the real Firebase Emulator Suite, for the three already-merged domain foundations (`ENG-P2-001-01` Identity, `-03` Loyalty Number, `-04` QR Identity):

1. Permanent Customer Identity ID uniqueness.
2. One active Loyalty Number per identity.
3. Loyalty Numbers globally unique, never recycled.
4. One active QR reference per identity at a time.
5. Regenerated QR references invalidate the prior one atomically.
6. Old QR references retained for audit and fail closed for active lookup.
7. Customer Identity ID and Loyalty Number never change during QR regeneration.
8. Retries do not create duplicate records.
9. Direct client writes cannot bypass trusted server-side write paths.

## 2. Stage A — Entry Gate

- Primary checkout inspected only (never touched, stashed, or checked out from) — pre-existing unrelated dirty state confirmed unrelated to this task.
- `git fetch origin main:main` confirmed local `main` at `689a7521b5bb563dc47ef66c3b442278b63c8ff0`.
- Worktree created via `git worktree add -b feat/eng-p2-001-05-identity-persistence-foundation <path> origin/main`.
- `git rev-list --left-right --count origin/main...HEAD` = `0 0` — zero divergence at start.
- Working tree clean, no in-progress merge/rebase.
- All three domain foundations present at `functions/src/domains/{identity,loyaltyNumber,qrIdentity}/`; `pnpm test` green (240/240) before any edit.

## 3. Stage B — Pre-Edit Design Decisions (disclosed, not silently invented)

1. **Collection layout:** `users` (Identity, `-01`), `customerProfiles` (shared shell — `-01`/`-03`/`-04` project their own field onto it; full profile is `-02`'s future scope), `loyaltyNumbers` (`-03`), `qrIdentityRecords` (`-04`) — one new collection each for `loyaltyNumbers`/`qrIdentityRecords`, not previously named as their own collections in this task's own Scope bullet (corrected in the roadmap update, §9 below).
2. **Uniqueness enforcement:** doc-ID-as-value (`loyaltyNumbers/{value}`, `qrIdentityRecords/{value}`) — Firestore has no native unique-constraint mechanism across documents; using the value itself as the document ID makes `transaction.get()` before `transaction.set()` sufficient, mirroring the existing `checkAndReserveIdempotencyKey` pattern exactly. No pre-query-then-unprotected-write anywhere.
3. **`customerProfiles` is a projection, not authoritative** — `loyaltyNumbers`/`qrIdentityRecords` are authoritative for uniqueness and history; `customerProfiles.loyaltyNumber`/`.qrReference` exist purely so "what's this identity's current number/QR" needs one read, not a query.
4. **Idempotency:** reused `checkAndReserveIdempotencyKey`/`completeIdempotencyKey`/`failIdempotencyKey` (`shared/idempotency/idempotencyService.ts`, ENG-P1-002) for all three operations (identity creation, Loyalty Number issuance, QR issuance/regeneration) — no competing framework introduced, per this task's own explicit instruction.
5. **Transaction boundary:** one Firestore transaction per operation — all reads (existing-assignment lookup, uniqueness candidate checks) precede all writes, which Firestore transactions require and enforce; domain writes and their outbox entries commit together, so a thrown error at any point leaves zero partial state.
6. **QR collision handling:** the `-04` domain service (`issueQrIdentity`/`regenerateQrIdentity`) has no built-in retry loop — QR references are high-entropy `crypto.randomUUID()` tokens, so a collision is treated as exceptional and fails closed (`qrRegenerationTransactionConflictError`) rather than this persistence layer inventing a retry policy the domain foundation never specified.
7. **Converters never leak Firestore shapes into the domain layer** — every `to*Document`/`from*Document` function lives in `repositories/`, the one subfolder in each domain permitted to import `firebase-admin` (Repository and Folder Standards §4); a corresponding `eslint.config.js` scoping correction was required (§8 below).
8. **Firestore Rules stay deny-by-default for all four collections, no allow branch** — see §7.
9. **Migration:** `no-migration-required` — no data exists anywhere to migrate.

## 4. Implementation

### 4.1 Concrete generators (new, `-05`'s own responsibility per each port's own doc comment)

- `RandomLoyaltyNumberCandidateGenerator` (`loyaltyNumber/services/`) — `crypto.randomInt`-backed, drawn from the approved codespace.
- `RandomQrReferenceGenerator` (`qrIdentity/services/`) — `crypto.randomUUID()`-backed opaque token.

### 4.2 Error-factory extensions (reusing each domain's existing error class — no new hierarchy)

- `identityErrors.ts`: `duplicateCustomerIdentityError`, `unknownCustomerIdentityError`, `malformedCustomerIdentityRecordError`, `identityRepositoryUnavailableError`.
- `loyaltyNumberErrors.ts`: `duplicateLoyaltyNumberRecordError`, `malformedLoyaltyNumberRecordError`, `loyaltyNumberRepositoryUnavailableError`.
- `qrIdentityErrors.ts`: `duplicateActiveQrRecordError`, `invalidatedQrReferenceError`, `unknownQrReferenceError`, `malformedQrIdentityRecordError`, `qrIdentityRepositoryUnavailableError`, `qrRegenerationTransactionConflictError`.
- `IDEMPOTENCY_CONFLICT` (already in the closed 14-category `ErrorCategory` enum) is reused directly for both the shared idempotency service's `"conflict"` outcome and its `"in_progress"` outcome — no new category invented.

### 4.3 Converters (`repositories/*Document.ts`, one pair of `to*`/`from*` functions each)

- `userDocument.ts` — `users` collection.
- `customerProfileDocument.ts` — `customerProfiles` (read-direction only; each domain's own repository writes its own field).
- `loyaltyNumberDocument.ts` — `loyaltyNumbers/{value}`.
- `qrIdentityRecordDocument.ts` — `qrIdentityRecords/{value}`, including `replacedByReference` for audit-linking on invalidation.

### 4.4 Repositories (transactional)

- `customerIdentityRepository.ts` — `createCustomerIdentity` (idempotent, transactional, defence-in-depth existence check beneath the idempotency layer), `getCustomerIdentityById`.
- `loyaltyNumberRepository.ts` — `issueLoyaltyNumberForIdentity` (transaction-scoped `LoyaltyNumberUniquenessPort` reading via `transaction.get()`, running the existing `issueLoyaltyNumber` domain service unmodified), `getLoyaltyNumberAssignmentForIdentity`.
- `qrIdentityRepository.ts` — `issueQrIdentityForIdentity`, `regenerateQrIdentityForIdentity` (the full atomic regeneration: load current active → verify via the domain service → generate/validate new reference → write new active record → mark old `invalidated` with `replacedByReference` → update `customerProfiles.qrReference` → commit), `getActiveQrIdentityByCustomerIdentityId`, `getActiveQrIdentityByReference` (fails closed), `getQrIdentityRecordForAudit` (admin/audit path only, ignores status).

### 4.5 Firestore Rules (`firestore.rules`)

Added four collection-scoped `match` blocks (`users`, `customerProfiles`, `loyaltyNumbers`, `qrIdentityRecords`), each `allow read, write: if false` — explicit, not merely inherited from the pre-existing fallback. **No direct customer read was opened.** The task's own instruction was to review whether this slice should permit any read, not to assume one — no customer-facing profile UI, merchant lookup UI, or QR scanner exists yet anywhere in this codebase (all still deferred, §6), so there is no actual consumer for a client-side read today. Opening one now would mean inventing its shape ahead of the task that defines it. This is a disclosed divergence from `ENG-P2-001-PLAN-001`'s own Deliverables wording ("this package adds collection-specific allow rules") — corrected in the roadmap doc (§9).

## 5. A genuine cross-cutting finding, found and fixed (test-first)

`issueLoyaltyNumber`/`regenerateQrIdentity` (both already-merged, `-03`/`-04`) reuse the caller-supplied `eventId` verbatim across every event they return from one call — a Loyalty Number collision-plus-issued pair, or a QR invalidated-plus-regenerated pair, both carry the *same* `eventId`. `writeOutboxEntry` (ENG-P1-002, shared) keys the outbox document by `event.eventId`. Writing such a multi-event batch unchanged inside one transaction meant the second `transaction.set()` silently overwrote the first — an outbox entry for a collision or an invalidation would vanish. Caught by the loyalty-number collision-retry emulator test (asserted a `collision_detected` outbox entry existed; it didn't). Fixed narrowly in both repositories only: when more than one event is returned from a single call, the *outbox document id* (not the event's own stored `eventId` field) is suffixed with an index — `withOutboxEventId`/`writeIssuanceOutboxEntry` helpers. The event payload's own `eventId` field is left untouched, preserving whatever the domain service intended it to carry. This is a repository-layer fix; the two domain services themselves were not modified (out of this task's scope).

## 6. Explicitly deferred (not implemented, disclosed)

Registration orchestration; customer-facing profile UI; merchant lookup UI; QR rendering/scanner; Authentication linking workflows; ITM verification; recovery orchestration (`restoreQrIdentityForRecovery` has no repository wrapper — no caller exists yet); administrative identity merge; exceptional Loyalty Number replacement; production migration (none needed — no data exists); analytics; notification; Reward integration.

## 7. Firestore Rules Tests (new — first in this repository)

`functions/src/security/firestoreRules.emulator.test.ts`, using `@firebase/rules-unit-testing` (new devDependency, plus its `firebase` peer dependency at the same `^12.16.0` version `apps/web` already pins — no version drift). 23 tests: for each of the four collections — unauthenticated read/write denied, ordinary-authenticated read/write denied (including for the client's own identity), authenticated-as-someone-else write denied; plus a QR-specific test proving a client cannot flip an `invalidated` record back to `active`; plus a sanity check that the deny-all fallback still holds for a collection with no dedicated `match` block; plus a harness-sanity test proving `withSecurityRulesDisabled` writes succeed (proves failures above come from the rules, not a broken harness). **Mutation-tested**: temporarily loosened the `users` rule to `allow read, write: if true` and re-ran — 5 of the `users` tests failed as expected, confirming the suite genuinely detects a regression, not vacuously passing; rules restored and re-verified green.

## 8. A pre-existing eslint-scope gap, found and corrected

The `no-restricted-imports` Firebase-isolation rule (`eslint.config.js`, one block per domain, from `-01`/`-03`/`-04`) matched `functions/src/domains/{identity,loyaltyNumber,qrIdentity}/**/*.ts` — recursively, including the new `repositories/` subfolder this task is the first to populate. Its own error message already said "Persistence-layer mapping belongs in a future ENG-P2-001-05 module instead," but the glob was never updated to exclude that subfolder once it existed. Added an `ignores: ["functions/src/domains/<domain>/repositories/**"]` to each of the three existing blocks — narrow, disclosed, and consistent with what the rule's own message already anticipated; `models/`/`services/` in each domain remain fully restricted.

## 9. Documentation updated (narrow)

- `ENG-P2-001-PLAN-001` — `-05` section: new "Updated 2026-08-04" callout (implementation summary, the `loyaltyNumbers`/`qrIdentityRecords` collection-naming correction, and the disclosed Rules-wording divergence); summary table `-05` row updated to "Implemented ... pending Founder-authorized review/merge." `-01`–`-04`'s own existing text untouched.
- Engineering Implementation Programme, Coding-Agent Prompt Register — narrow `ENG-P2-001-05`-only status notes prepended/appended alongside the existing `-01`/`-03`/`-04` notes, which are themselves untouched. `-02`, `-06` through `-10`, `ENG-P2-001` as a whole, and Capability 2 overall remain `Blocked`/unimplemented — none advanced by this update. No open Founder decision altered.
- `IMPLEMENTATION_CHANGES.md`, `documentation-changes-log.md` — new dated entries (this task only).

## 10. Validation

- `pnpm lint` — zero findings repo-wide (after the eslint-scope correction in §8 and removing one genuinely-unused `expect` import in the new Rules test file).
- `pnpm format:check` — clean (after `prettier --write` on 8 files flagged for formatting drift).
- `pnpm typecheck` — clean (`apps/web` and `functions`).
- `pnpm test` — `functions` 42 files / 275 tests passed (240 pre-existing + 35 new); `apps/web` 30 files / 259 tests passed, unaffected.
- `pnpm emulators:validate` (`firebase emulators:exec` wrapping `pnpm --filter functions test:emulator`) — 7 files / 74 tests passed (23 pre-existing + 51 new). Two pre-existing, already-known-flaky concurrency race tests (`outboxProcessor.emulator.test.ts`, `commandDispatcher.emulator.test.ts` — the same class flagged during PR #59's own CI run) timed out on one run and passed cleanly on an immediate re-run with no code change — transient, disclosed, not a regression from this task's changes (confirmed by `git diff` showing neither file touched).
- `pnpm build` — clean (`functions` `tsc`; `apps/web` `tsc -b && vite build`; pre-existing chunk-size warning unrelated to this task).
- `fileParallelism: false` added to `functions/vitest.emulator.config.ts` — a required, disclosed correction: multiple emulator test files now intentionally reset the shared `idempotencyRecords`/`outboxEntries` collections in their own `beforeEach`; running files in parallel (the prior default) let one file's cleanup delete records another file's in-flight test still depended on, causing genuine cross-file interference (reproduced, then fixed, then re-verified with all files together).

## 11. Files created

- `functions/src/domains/identity/repositories/{userDocument,customerProfileDocument,customerIdentityRepository}.ts` (+`.test.ts`/`.emulator.test.ts`)
- `functions/src/domains/loyaltyNumber/repositories/{loyaltyNumberDocument,loyaltyNumberRepository}.ts` (+`.test.ts`/`.emulator.test.ts`)
- `functions/src/domains/loyaltyNumber/services/randomLoyaltyNumberCandidateGenerator.ts` (+`.test.ts`)
- `functions/src/domains/qrIdentity/repositories/{qrIdentityRecordDocument,qrIdentityRepository}.ts` (+`.test.ts`/`.emulator.test.ts`)
- `functions/src/domains/qrIdentity/services/randomQrReferenceGenerator.ts` (+`.test.ts`)
- `functions/src/security/firestoreRules.emulator.test.ts`
- This report.

## 12. Files modified

- `firestore.rules` — four new collection-scoped deny blocks.
- `eslint.config.js` — three `ignores` additions (§8).
- `functions/vitest.emulator.config.ts` — `fileParallelism: false` (§10).
- `functions/package.json`, `pnpm-lock.yaml` — `@firebase/rules-unit-testing`, `firebase` added as devDependencies.
- `functions/src/domains/identity/models/identityErrors.ts`/`.test.ts` — 4 new factories/tests appended.
- `functions/src/domains/loyaltyNumber/models/loyaltyNumberErrors.ts`/`.test.ts` — 3 new factories/tests appended.
- `functions/src/domains/qrIdentity/models/qrIdentityErrors.ts`/`.test.ts` — 6 new factories/tests appended.
- `ENG-P2-001-PLAN-001`, Engineering Implementation Programme, Coding-Agent Prompt Register — narrow `-05`-only notes (§9).

No historical report, Decision Register entry, or unrelated application file modified.

## 13. Dependencies added

`@firebase/rules-unit-testing` (devDependency, Rules testing) and its peer `firebase` (devDependency, at the version `apps/web` already pins — no drift).

## 14. Configuration changes

`eslint.config.js` (3 `ignores` additions), `functions/vitest.emulator.config.ts` (`fileParallelism: false`), `firestore.rules` (4 new deny blocks). No `tsconfig.json` change.

## 15. Risks and residual items

- No direct customer read path exists for any of the four collections yet — by design (§7), but a future task (`-09` Query/Lookup or equivalent) will need to open a narrowly-scoped read, not widen this task's own deny posture.
- `restoreQrIdentityForRecovery` has no repository-layer caller — recovery orchestration (`-07`) will need to add one; the domain function itself is unchanged and ready.
- The two flaky concurrency tests (§10) are pre-existing and unrelated to this task's diff — already disclosed once during PR #59; still not fixed, same as then.
- QR reference collision handling fails closed rather than retrying (§4.5/§3 item 6) — acceptable given `crypto.randomUUID()`'s entropy, but a future reviewer could decide differently; documented as a disclosed choice, not asserted as the only possible one.

## 16. Rollback

`git revert` of this task's commit(s), or discard the branch — not yet merged. Purely additive; no existing file's runtime behavior changed (the eslint/vitest-config changes only widen what one subfolder may import and how emulator test files are scheduled); no data, deployment, or live configuration affected.

## 17. Report links

This report. Related: [`ENG-P2-001-01`](ENG-P2-001-01-implementation-report-2026-08-02.md), [`ENG-P2-001-03`](ENG-P2-001-03-implementation-report-2026-08-04.md), [`ENG-P2-001-04`](ENG-P2-001-04-implementation-report-2026-08-04.md).
