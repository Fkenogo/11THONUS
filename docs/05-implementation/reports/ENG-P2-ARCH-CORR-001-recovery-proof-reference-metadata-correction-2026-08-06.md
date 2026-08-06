> **Title:** ENG-P2-ARCH-CORR-001 — Recovery Proof Reference Metadata Contract Correction
> **Version:** 1.0 · **Status:** Correction implementation record — pending Founder-authorized merge · **Classification:** Working (execution-layer correction record)
> **Governing document:** [`ENG-P2-ARCH-REVIEW-001` Architecture Review Report](ENG-P2-ARCH-REVIEW-001-capability-2-customer-identity-architecture-review-2026-08-06.md) Finding F1; `shared/metadata/baseMetadata.ts` (`BaseMetadata` contract, TRD10 §10.5)
> **Source-of-truth path:** `docs/05-implementation/reports/ENG-P2-ARCH-CORR-001-recovery-proof-reference-metadata-correction-2026-08-06.md`
> **Last controlled update:** 2026-08-06 (`ENG-P2-ARCH-CORR-001` — created)

# ENG-P2-ARCH-CORR-001 — Recovery Proof Reference Metadata Contract Correction

**This task corrects one narrow, bounded defect (Finding F1). No Customer Profile, Authentication, ITM, UI, or unrelated correction was implemented.**

## 1. Executive Summary

`ENG-P2-ARCH-REVIEW-001`'s Finding F1 (P1) identified that `recoveryProofReferences`' first-ever write used `stampUpdate()` instead of `stampCreate()`, leaving every reservation document missing `createdAt`, `createdBy`, `id`, and `schemaVersion`. This task corrects the defect with the smallest architecture-consistent fix: a new typed write-side builder, `toRecoveryProofReferenceDocument()`, mirroring the established `loyaltyNumberDocument.ts` pattern for doc-ID-as-key reservation records. No read-side converter was added, since nothing in the codebase reads this document's fields back besides `.exists()` — adding one would be unused code, the same defect already flagged elsewhere (F7). Five tests were added or strengthened (1 unit test file, 4 new unit tests; 3 emulator tests strengthened) proving complete creation metadata, immutability across idempotent replay, and no-reservation-on-failed-transaction. All validation is green: typecheck, lint, format, 399/399 `functions` unit tests, 164/164 real Firebase Emulator Suite tests (including Rules), 259/259 `apps/web` tests, both workspace builds.

## 2. PR #66 Merge Result and SHA

Confirmed merged before this task began: merge commit `82a731da57a90a063f283564f75862edc0249ead`, state `MERGED`, on `main`.

## 3. Starting Repository State

`origin/main` at `82a731d` (PR #66). Isolated worktree created via fully-qualified absolute path (no `-C` nesting): `git worktree add -b fix/eng-p2-arch-corr-001-recovery-proof-metadata <path> origin/main`.

## 4. Clean-Worktree Evidence

- `git status --porcelain`: empty (clean) at creation.
- `git rev-list --left-right --count origin/main...HEAD`: `0 0`.
- `.git/MERGE_HEAD`, `.git/rebase-merge`, `.git/rebase-apply`: none present.
- Architecture Review Report present at `docs/05-implementation/reports/ENG-P2-ARCH-REVIEW-001-...md`.
- F1 confirmed still live: `grep -n "stampUpdate\|stampCreate" identityLifecycleRepository.ts` showed `stampUpdate(params.recoveredBy)` at the recovery-proof write (then line 246).
- Baseline: `pnpm -r exec tsc --noEmit` clean, `pnpm lint` clean, `pnpm --filter functions exec vitest run` — 395/395 green, on first attempt.

## 5. F1 Evidence and Root Cause

`identityLifecycleRepository.ts:243-247` (pre-fix): inside `recoverCustomerIdentityStatus`'s transaction, `transaction.set(proofRef, { proofReference, customerIdentityId, ...stampUpdate(params.recoveredBy) })`. `stampUpdate()` (`baseMetadata.ts:69-71`) returns only `{updatedAt, updatedBy}`. This `.set()` only ever executes when `proofSnapshot.exists` is `false` (line 220 already throws otherwise) — i.e. it is always a first write, never a genuine update — so the correct stamp function was `stampCreate()`, and `id`/`schemaVersion`/`status` (each domain's own responsibility per `baseMetadata.ts`'s own doc comment) were never set at all. Root cause: the write was authored by analogy to the adjacent `transaction.update(ref, {status: recovered.status, ...stampUpdate(...)})` line immediately above it (a genuine update to the pre-existing `users/{id}` document), and the distinction between the two operations' correct stamp function was missed.

## 6. Metadata Authority Analysis

- `BaseMetadata` (`baseMetadata.ts:34-49`): every document requires `id`, `schemaVersion`, `status`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`; `id`/`schemaVersion`/`status` are each domain's own responsibility to set (no universal default).
- `recoveryProofReferences` classification: an **idempotency/reservation record** — a consumed-proof marker, the same architectural role as `idempotencyRecords` (shared infra) and `loyaltyNumbers`/`qrIdentityRecords` (doc-ID-as-key uniqueness reservations). Not an authoritative domain entity; not an audit record (the outbox/`identity_recovered` event is the audit trail).
- No document type, converter, or schema existed for this collection prior to this task — confirmed by repo-wide search; `models/recoveryProof.ts` is a different type (the upstream-completed proof input, not the persisted marker).
- Nothing in the codebase reads this document's fields back — confirmed by repo-wide grep for `RECOVERY_PROOF_REFERENCES_COLLECTION`/`recoveryProofReferences`: exactly two non-test references, both in `identityLifecycleRepository.ts` (the constant and the collection path); only `.exists` is ever checked.
- The governing contract is not ambiguous: `BaseMetadata`'s shape is fully specified, and `loyaltyNumberDocument.ts` establishes an unambiguous, directly analogous precedent (a doc-ID-as-key reservation record, `stampCreate`-based, no optional scoped fields).

## 7. Final Document Contract

`functions/src/domains/identity/repositories/recoveryProofReferenceDocument.ts`:

```ts
export type RecoveryProofReferenceDocument = BaseMetadata & {
  proofReference: string;
  customerIdentityId: string;
};

export function toRecoveryProofReferenceDocument(
  proofReference: string,
  customerIdentityId: string,
  actorId: string | null,
): RecoveryProofReferenceDocument
```

Fields written: `id` (= `proofReference`, matching the doc-ID), `schemaVersion` (`1`), `status` (`"active"`, matching the sibling-collection convention for "this record exists and is the valid one"), `proofReference`, `customerIdentityId`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy` (all four via `stampCreate(actorId)`). No optional `BaseMetadata` scoped fields (`businessId`, `countryCode`, etc.) — this collection is not tenant/geo-scoped, matching `loyaltyNumberDocument.ts`'s own omission. **No read-side `from...` converter** — deliberate, per §6.

## 8. Code Changes

- `identityLifecycleRepository.ts`: import added; the raw `{proofReference, customerIdentityId, ...stampUpdate(...)}` literal replaced with `toRecoveryProofReferenceDocument(params.recoveryProof.proofReference, params.customerIdentityId, params.recoveredBy)`; header doc comment above `recoverCustomerIdentityStatus` updated to describe the new builder and remove the now-inaccurate `stampUpdate` reference.
- No change to the transaction structure, the `proofSnapshot.exists` reuse-prevention check, the `checkAndReserveIdempotencyKey`/`completeIdempotencyKey`/`failIdempotencyKey` calls, `writeOutboxEntry`, or the `users/{id}` update (which correctly continues using `stampUpdate`, since it is a genuine update to a pre-existing document).

## 9. Data and Migration Assessment

**Classification: no migration required.**

- Live development/staging project: no deploy evidence found anywhere in git history for this capability (only unrelated Hosting/`EXT-TECH-001` commits); `.firebaserc` declares only project aliases, no deploy record.
- Repository fixtures: none — no seed-data files exist anywhere in the repository.
- Emulator seed data: none persists — the emulator test's own `beforeEach` deletes the entire `recoveryProofReferences` collection before every test run.
- Even hypothetically, an old-shape document would continue to correctly satisfy the sole consumer (the `.exists()` reuse-prevention check), so no compatibility-read handling is required either.
- No destructive or rewriting action was taken or needed; no live records exist to migrate.

## 10. Atomicity and Idempotency Verification

- The reservation write remains inside the same `db.runTransaction` block as the `users/{id}` status update and the outbox event write — unchanged, still fully atomic (proven by the existing, unmodified transaction structure and the emulator test suite).
- Idempotent replay (same idempotency key): short-circuits via `checkAndReserveIdempotencyKey`'s `"duplicate"` outcome before the transaction is ever entered — confirmed unchanged, and now additionally proven not to touch `recoveryProofReferences` at all on replay (§14, strengthened test).
- Proof-reuse prevention (different idempotency key, already-consumed proof): unchanged — `proofSnapshot.exists` check still throws `recoveryProofAlreadyUsedError` before any write.
- Failed transaction (e.g. invalid current status): domain validation (`recoverCustomerIdentity`) throws before either `transaction.set()`/`transaction.update()` call is reached, so Firestore's transaction semantics guarantee no partial write — now explicitly asserted by a strengthened test.

## 11. Security and Privacy Verification

- `proofReference` remains an opaque identifier only (per `models/recoveryProof.ts`'s own contract) — no raw credential, OTP, or identity-document value is ever persisted; unaffected by this correction.
- Direct client access: `firestore.rules`' trailing wildcard deny-all still covers `recoveryProofReferences` (unchanged, not touched by this task); the collection's dedicated Rules tests in `firestoreRules.emulator.test.ts` (lines 131-152, pre-existing) continue to pass unmodified.
- No new field beyond the governed `BaseMetadata` set plus the two pre-existing domain fields is written — confirmed by a dedicated unit test asserting the exact key set.

## 12. Files Inspected

`baseMetadata.ts`; `identityLifecycleRepository.ts` (full); `recoveryProof.ts`; `loyaltyNumberDocument.ts`/`.test.ts`; `loyaltyNumberRepository.ts`; `idempotencyRecord.ts`; `customerProfileDocument.ts`; `identityLifecycleRepository.emulator.test.ts` (full); `firestoreRules.emulator.test.ts`; TRD10 §10.5 (via `baseMetadata.ts`'s own citation, not separately re-read); `.firebaserc`; git history (`git log --all --grep="deploy"`).

## 13. Files Created or Modified

- **Created:** `functions/src/domains/identity/repositories/recoveryProofReferenceDocument.ts`; `recoveryProofReferenceDocument.test.ts`; this report.
- **Modified:** `identityLifecycleRepository.ts`; `identityLifecycleRepository.emulator.test.ts`; `ENG-P2-ARCH-REVIEW-001-...md` (F1 status only); `docs/changes/IMPLEMENTATION_CHANGES.md`; `docs/00-governance/documentation-changes-log.md`.
- **Not modified:** any Firestore Rule, index, Firebase configuration, unrelated source file, or any other historical implementation report.

## 14. Tests Added or Modified

- `recoveryProofReferenceDocument.test.ts` (new, 4 tests): doc-ID-as-proof-reference; full `BaseMetadata` creation shape; null-actor (system-initiated) handling; exact key-set assertion (no extra fields).
- `identityLifecycleRepository.emulator.test.ts` (3 tests strengthened, no new file):
  - `"restores a suspended identity to active and emits IdentityRecovered"` — now asserts the exact key set and every field's value on the persisted `recoveryProofReferences` document.
  - `"rejects duplicate recovery commands beyond idempotent replay"` — now asserts exactly one reservation document exists after the first call and still exactly one (with an unchanged `createdAt`) after the idempotent-replay call.
  - `"rejects recovery for an identity not in a recovery-eligible status"` — now asserts zero reservation documents exist after the failed call.
- "Malformed persisted records fail safely where typed validation exists" — **not applicable**, and explicitly not forced: no read-side converter exists (§6/§7), so there is no typed validation path to test.

## 15. Validation Commands and Results

| Command | Result |
|---|---|
| `pnpm -r exec tsc --noEmit` | Clean |
| `pnpm lint` | Clean |
| `pnpm format:check` | Clean |
| `pnpm --filter functions exec vitest run` | 399/399 (395 baseline + 4 new) |
| `firebase emulators:exec --project demo-11thonus "pnpm --filter functions test:emulator"` | 164/164 across 12 files, including the 3 strengthened recovery tests and the pre-existing Rules tests |
| `pnpm --filter web exec vitest run` | 259/259 (one transient failure on first attempt — the session's already-documented `apps/web` lazy-route flake under host contention, unrelated to this change and untouched by it; clean 259/259 on immediate retry) |
| `pnpm build` (both workspaces) | Clean |

RED confirmed before the fix: the strengthened emulator test failed with exactly the expected missing-fields diff (`id`, `schemaVersion`, `status`, `createdAt`, `createdBy` all absent) when run against the unfixed code, before `toRecoveryProofReferenceDocument` was wired in.

## 16. Dependencies Added

None.

## 17. Configuration Changes

None.

## 18. Risks

None new. This correction narrows/completes an already-bounded write; no existing exported function's external behavior changed (the reservation document's field values are unchanged in substance — `proofReference`, `customerIdentityId` — only the previously-missing `BaseMetadata` fields were added).

## 19. Deferred Findings

F2–F12 and the informational findings from `ENG-P2-ARCH-REVIEW-001` are unaffected and remain open, per this task's own scope constraint. No change was made to any of them.

## 20. Rollback Instructions

`git revert` of this task's commit, or discard the branch — not yet merged. Purely additive/narrowing (one new file pair, three targeted edits to `identityLifecycleRepository.ts`/its test, and documentation); no data, deployment, or live configuration affected either way.

## 21-24. Tracking Updates

See §13 for the full file list. The Architecture Review Report's F1 entry was updated in place (bracket-marker convention, original text struck through and preserved, not deleted) to record the correction and link to this report — this is the only finding-status change made; F2-F12 remain untouched. `IMPLEMENTATION_CHANGES.md` and `documentation-changes-log.md` entries are appended below this report's own commit. This report itself serves as the persistent task-level Markdown record.

**Programme/Prompt Register: no update applied.** The Engineering Implementation Programme's `-07` entry states that Identity Recovery "is now implemented, test-first" — this remains true; the entry does not claim the recovery-proof-reservation metadata was already correct, so no correction is required there. The Coding-Agent Prompt Register's `ENG-P2-001` row makes no claim about this specific defect either. Both were reviewed and found to require no edit for this narrow correction — a considered decision, not an oversight.

## 25. PR Details

See the completion report delivered in chat for PR number, branch, head SHA, mergeability, CI status, and unresolved-thread count (recorded after the PR is opened, per the task's own required sequencing).
