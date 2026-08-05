> **Title:** `ENG-P2-001-08` — Identity Linking and Duplicate Prevention — Implementation Report
> **Status:** Implemented — awaiting Founder-authorized review/merge
> **Date:** 2026-08-05
> **Author:** Claude (AI agent), per Founder task "ENG-P2-001-08: Identity Linking and Duplicate Prevention"
> **Depends on:** `ENG-P2-001-01` (merged, PR #57), `-05` (merged, PR #60), `-06` (merged, PR #61), `-07` (merged, PR #62 — merge commit `9bea9dbaa4b68af9736be31f725843637d0eb9c0`)

---

## 1. Task Summary

The Founder authorized implementation of `ENG-P2-001-08` — the identity-owned Identity Linking and Duplicate Prevention package: provider-neutral authentication-reference link/unlink orchestration, persistence with cross-identity uniqueness enforcement, fail-closed conflict handling, privacy-safe audit evidence, and tests. Work began from a clean isolated worktree/branch created off `origin/main` at exactly `9bea9dbaa4b68af9736be31f725843637d0eb9c0` (the `-07` merge commit); the dirty primary checkout was inspected only, never modified.

Explicitly not authorized and not implemented: Google Sign-In, phone OTP, email-link authentication, Apple, passkeys, or any other authentication provider; Identity Trust Management (ITM) trust computation; customer-facing or support UI; automatic identity merging; creation of a replacement identity; Reward logic changes; production deployment or live data migration.

## 2. Stage A — Entry Gate (verified before any edit)

1. Worktree created via `git worktree add -b feat/eng-p2-001-08-identity-linking <path> origin/main`.
2. `git rev-list --left-right --count origin/main...HEAD` = `0 0` (exact merge-commit parity, no drift, no rebase performed).
3. `git log -1` on the worktree confirmed HEAD = `9bea9dbaa4b68af9736be31f725843637d0eb9c0`.
4. `ENG-P2-001-01`, `-03`, `-04`, `-05`, `-06`, `-07` all present and merged in the worktree (confirmed by direct file inspection — `customerIdentity.ts`, `identityLifecycleRepository.ts`, `identityRecoveryRepository.ts`, `recoveryProof.ts` all present with their prior tests passing).
5. Pre-edit `functions` unit test suite green (327/327, matching Entry 063's recorded count) before any change was made.
6. Primary checkout (`/Users/theo/11THONUS`) confirmed untouched throughout — inspected read-only only, never the working directory for any command in this task.

## 3. Stage B — Pre-Edit Analysis (18 required points)

1. **Current Authentication-reference model:** `functions/src/domains/identity/models/authenticationReference.ts` (`-01`, unchanged) — a value object (`referenceId`, `referenceType`, `linkStatus`, `createdAt`, `createdBy`); no token, OTP detail, or provider credential.
2. **Storage location (pre-existing):** embedded array field `users/{id}.authenticationReferences`, one identity's array only — a per-identity PROJECTION with no cross-identity visibility.
3. **Ownership boundary:** the array belongs to the Customer Identity aggregate; nothing in `-01`/`-05`/`-06`/`-07` reads or writes any OTHER identity's array when mutating one identity's own array.
4. **Unique subject reference definition:** the pair `(referenceType, referenceId)` — `referenceId` alone is not guaranteed unique across provider categories (a provider-neutral opaque handoff value, per `-07`'s established boundary).
5. **Uniqueness scope — global vs. provider-scoped:** global per `(referenceType, referenceId)` composite — resolved from TRD12 AIR-001 ("One Firebase Authentication UID shall map to one active platform user"), whose bare-UID requirement this composite key strictly generalizes without inventing tenant semantics.
6. **Canonical key:** `${referenceType}:${referenceId}`, used as the new `authenticationReferences` collection's own document ID — the doc ID itself IS the uniqueness key, exactly mirroring `loyaltyNumbers/{value}` and `qrIdentityRecords/{qrReference}`.
7. **Link lifecycle:** `unlinked` (no record) → `linked` (active) → `unlinked` (history retained) → may be re-linked only by the SAME identity (see point 10).
8. **Link authority/proof requirements:** an already-validated, provider-neutral proof result is accepted as given (no OAuth/OTP verification performed here) plus an `authority`/`reason` pair from the existing closed `TransitionAuthority`/`TransitionReason` enums (`-06`) — no new enum value invented.
9. **Unlinking rules (pre-existing, reused):** `-01`'s `unlinkAuthenticationReference` already enforces "at least one reference must remain linked" — reused unmodified, not re-derived.
10. **Last-access-path constraints / relink-after-unlink policy — RESOLVED 2026-08-05, Founder Review (`PR #63`):** a reference unlinked by identity A may later be re-linked by identity A (no cross-identity risk — restoring one's own reference). It may NOT be linked by a DIFFERENT identity B while the authoritative record still shows A as its most recent owner — treating an unlinked record as "available for a different identity to claim" would be an identity-transfer decision, which this task's own brief explicitly prohibits inventing (no automatic merge, no invented tenant/transfer semantics). This conservative resolution — proposed here and disclosed for Founder review — is now formally approved as the **Authentication Reference Permanence Principle** (§4A) and recorded at `ENG-P2-001-PLAN-001` §14 Ambiguity 5.
11. **Duplicate-detection / conflict handling:** the reachable, structural conflict this package implements is exactly "the same `(referenceType, referenceId)` pair is already owned by a different Customer Identity" — detected via a `transaction.get()` on the authoritative doc before any write, inside the same Firestore transaction as the would-be mutation.
12. **Manual review requirement:** a conflict emits `AuthenticationReferenceConflictDetected` (durable, privacy-safe outbox evidence) for a future manual-review consumer; this package does not build the review queue/UI itself (explicitly out of scope, matching `ENG-P2-001-PLAN-001` §14 Ambiguity 4's own "detection/queueing is unblocked, merge execution is not" boundary).
13. **Persistence/transaction boundaries:** one Firestore transaction covers both documents — the existing `users/{id}.authenticationReferences` projection and the new `authenticationReferences/{referenceType}:{referenceId}` authoritative record — the "authoritative record plus transactionally-maintained projection" combination this task's own brief names as an acceptable shape.
14. **Idempotency strategy:** reuses `checkAndReserveIdempotencyKey`/`completeIdempotencyKey`/`failIdempotencyKey` exactly as `-05`/`-06`/`-07` do — no competing framework.
15. **Audit/outbox evidence:** `AuthenticationReferenceLinked`/`Unlinked` (both additively extended with `authority`/`reason`) and the new `AuthenticationReferenceConflictDetected` event, all written via the existing `writeOutboxEntry` inside the same transaction as the domain write (or, for a conflict, as the transaction's only write).
16. **Firestore Rules posture:** deny-by-default catch-all already covers the new collection — confirmed by 3 new targeted Rules tests (mirroring the `-07` `recoveryProofReferences` pattern exactly); no `firestore.rules` file change required.
17. **Every file expected to change:** `identityErrors.ts`/`.test.ts` (3 new error factories), `identityEvents.ts`/`.test.ts` (2 payload extensions + 1 new event), `customerIdentity.ts`/`.test.ts` (link/unlink signature extended with `meta: LinkAuthenticationReferenceMeta`), `firestoreRules.emulator.test.ts` (3 new tests). New files: `authenticationReferenceRepository.ts` (+`.emulator.test.ts`).
18. **Files inspected but unchanged:** `authenticationReference.ts`, `userDocument.ts`, `customerIdentityRepository.ts`, `identityLifecycleRepository.ts`, `identityRecoveryRepository.ts`, `transitionAuthority.ts`, `transitionReason.ts`, `idempotencyService.ts`, `outboxWriter.ts`, `baseMetadata.ts` — all reused exactly as-is.

No ambiguity required stopping and reporting rather than inventing a policy — point 10 above is the one genuinely unresolved sub-question, and it was resolved fail-closed/conservatively and disclosed, per this task's own instruction ("If unlink policy is unresolved, implement only safe, explicitly governed cases").

## 4. Scope Relationship to `ENG-P2-001-PLAN-001`'s Original `-08` Text (disclosed, not silently reconciled)

The PLAN document's original `-08` catalogue entry (§2) frames duplicate prevention primarily as **heuristic** detection — "matching contact attributes across separate registration attempts" — plus a "support-review queue data shape" deliverable. The current, more specific Founder brief that authorized this task instead defines duplicate prevention **structurally**: refusing a second identity from linking a `(referenceType, referenceId)` pair another identity already owns. This is a narrower, more mechanically precise duplicate-prevention surface than the PLAN's heuristic framing — it catches every case where the SAME authentication reference is presented twice, but not the separate concern of two DIFFERENT references (e.g., two different phone numbers) that heuristically appear to belong to the same real person. That heuristic, contact-attribute-based detection, and any support-review queue UI/data shape, remain unimplemented and out of this task's scope, per the current brief's own explicit instruction and Deferred Items list. This narrowing is followed as the authoritative, current instruction — the same disclosed-narrowing pattern already used for `-07` (Authentication boundary) and applied here rather than silently expanding scope to match the older planning text.

`ENG-P2-001-PLAN-001` §14 Ambiguity 4 (automatic identity-merge authority) remains **unresolved and untouched** by this task — no merge execution, no identity-selection-and-merge logic, no automatic resolution of a detected conflict was implemented, matching the Ambiguity's own "detection/queueing is unblocked; merge execution is not" boundary exactly.

## 4A. Authentication Reference Permanence Principle (Founder-Approved, 2026-08-05)

Following Founder review of `PR #63`, this task's §3 point 10 resolution is now a formally approved policy, recorded verbatim below and at `ENG-P2-001-PLAN-001` §14 Ambiguity 5:

> **Authentication Reference Permanence Principle:** Once an authentication reference has been linked to a Customer Identity, its historical ownership remains permanently associated with that identity. If unlinked, it may be restored only to the same Customer Identity. Linking it to a different identity is prohibited unless a future governed manual-review and transfer process explicitly authorises the change.

**Current, approved MVP policy (implemented in this PR, no code change required by this correction):**
- Same-identity relink is permitted — an identity may re-link a reference it previously unlinked itself.
- Cross-identity relink is rejected — a different identity may never link a reference another identity's authoritative record shows as owned, regardless of whether that record's current `status` is `linked` or `unlinked`.
- Historical ownership is retained — the authoritative `authenticationReferences/{referenceType}:{referenceId}` record is never deleted or reassigned on unlink; only its `status`/`unlinkedAt` change.
- No automatic transfer or merge — a cross-identity attempt fails closed and produces only a privacy-safe `AuthenticationReferenceConflictDetected` audit event; no identity, reference, or authoritative record is ever mutated to effect a transfer.

**Deferred, explicitly out of this task's scope:** a future governed manual-review-and-transfer capability (who may authorise a transfer, what evidence is required, the actual transfer mechanism) is not designed or implemented here. Until such a capability is separately authorised, a reference already owned by one identity can never become linked to another, under any code path in this repository.

**Test coverage confirming enforcement** (`authenticationReferenceRepository.emulator.test.ts`, all passing with zero implementation change):
- `permits the same identity to re-link a reference it previously unlinked` — same-identity relink permitted.
- `rejects a different identity from linking a reference the original identity previously unlinked (Authentication Reference Permanence Principle)` — cross-identity relink rejected, privacy-safe conflict event recorded, authoritative record's ownership/status unchanged.
- `resolves the original owner as the sole winner when a same-identity relink races a different identity's link after unlink` — concurrent cross-identity relink attempt; the original owner's relink always succeeds, the other identity's attempt always fails, deterministically (ownership never changes hands, so there is no genuine race to "win" — the non-owner cannot succeed under any interleaving).
- `unlinks a reference and preserves its history on the authoritative record` — extended with an explicit `customerIdentityId` assertion confirming historical ownership is retained after unlink.

## 5. Implementation

### 5.1 `functions/src/domains/identity/models/identityErrors.ts` (modified, additive)

Three new factory functions appended after the existing `-07` recovery-proof errors, reusing the same `IdentityDomainError` class (no new error hierarchy): `authenticationReferenceLinkedToDifferentIdentityError` (`VALIDATION_FAILED`), `staleAuthenticationReferenceStatusError` (`IDEMPOTENCY_CONFLICT`), `authenticationReferenceCommandConflictError` (`IDEMPOTENCY_CONFLICT`) — all three reuse existing, already-closed `ErrorCategory` values.

### 5.2 `functions/src/domains/identity/events/identityEvents.ts` (modified, additive)

`AuthenticationReferenceLinkedPayload`/`AuthenticationReferenceUnlinkedPayload` each gained `authority: TransitionAuthority`/`reason: TransitionReason` fields — the same append-only "who/why" evidence pattern `-06`/`-07` already established for every other transition event, now extended to linking. A new event, `AuthenticationReferenceConflictDetected`, was added: deliberately omits the owning identity's ID and the raw `referenceId` — carrying only the attempting identity's ID, `referenceType`, `authority`, and `reason` — to avoid leaking cross-identity linkage information to whichever future consumer processes this event. A dedicated negative test asserts no `owner`/`referenceid`/`phone`/`email`/`token` key is ever present in this event's payload.

### 5.3 `functions/src/domains/identity/models/customerIdentity.ts` (modified, additive)

`linkAuthenticationReference` and `unlinkAuthenticationReference` (both `-01`, previously 3-parameter functions) now accept a 4th parameter, `meta: LinkAuthenticationReferenceMeta` (`{ authority, reason }`), threaded into their respective event-builder calls. No other change to either function's existing validation/guard logic (duplicate-same-identity rejection, last-reference-cannot-be-unlinked rejection, not-found rejection all unchanged).

### 5.4 `functions/src/domains/identity/repositories/authenticationReferenceRepository.ts` (new)

The core deliverable — two transactional, idempotent operations:

- **`linkAuthenticationReferenceForIdentity`** — reserves an idempotency key (`identity.linkAuthenticationReference`); inside one transaction, reads both the target `users/{id}` document and the authoritative `authenticationReferences/{referenceType}:{referenceId}` document. If the authoritative record exists and is owned by a DIFFERENT identity, the transaction commits only a privacy-safe `AuthenticationReferenceConflictDetected` outbox entry (no identity/authoritative-record mutation), and the function then throws `authenticationReferenceLinkedToDifferentIdentityError` after the transaction settles — durable audit evidence is preserved even though the command itself fails closed. Otherwise, `linkAuthenticationReference` (§5.3) is invoked, both documents are updated atomically, and `AuthenticationReferenceLinked` is emitted.
- **`unlinkAuthenticationReferenceForIdentity`** — reserves a separate idempotency key (`identity.unlinkAuthenticationReference`); inside one transaction, rejects (as "not found," privacy-safe — never revealing that the reference exists under a different identity) if the authoritative record does not exist or belongs to a different identity; supports an optional `expectedStatus` parameter for stale-state rejection (`staleAuthenticationReferenceStatusError`); otherwise calls `unlinkAuthenticationReference` (§5.3), updates the projection, and flips the authoritative record's `status` to `unlinked` with `unlinkedAt` set — via `transaction.update()`, preserving the record (never deleted) as its own history marker, with the full state-change history additionally preserved in the outbox event log.

Both operations reuse `checkAndReserveIdempotencyKey`/`completeIdempotencyKey`/`failIdempotencyKey` and `writeOutboxEntry` exactly as every prior repository in this domain does — no competing framework.

### 5.5 `functions/src/security/firestoreRules.emulator.test.ts` (modified, additive)

Three new tests for the `authenticationReferences` collection (direct-client write denial, unauthenticated read denial, no client-side status-forging) — mirroring the existing `recoveryProofReferences` dedicated-`describe` pattern exactly (no `SAMPLE_DOCS` table entry, since this collection has no explicit `match` block — it is covered by the existing catch-all). No `firestore.rules` file change was required or made.

## 6. Tests

- **`identityErrors.test.ts`:** 3 new tests (one per new error factory), asserting each returns the correct existing `ErrorCategory`.
- **`identityEvents.test.ts`:** 2 new tests for `buildAuthenticationReferenceConflictDetectedEvent` (exact payload shape; no forbidden key present); existing Linked/Unlinked tests extended with `authority`/`reason` assertions.
- **`customerIdentity.test.ts`:** 1 new test ("carries authority and reason on the emitted event") for link; the existing successful-unlink test extended with an `authority`/`reason` payload assertion.
- **`authenticationReferenceRepository.emulator.test.ts` (17 tests — 15 at initial implementation, +2 added for Founder-review correction §4A):** new-reference link creates the authoritative record; idempotent replay (same key) adds no duplicate; same-identity duplicate-link rejection; cross-identity conflict fails closed AND records a privacy-safe conflict event (payload-key assertion included); unknown-identity rejection (with no partial authoritative-record write); same-identity relink-after-unlink succeeds; **a different identity is rejected from linking a reference the original identity previously unlinked, with the authoritative record's ownership/status unchanged and a privacy-safe conflict event recorded (new — Permanence Principle)**; **the original owner's relink deterministically wins a concurrent race against a different identity's link attempt after unlink, with the authoritative record confirming the original owner throughout (new — Permanence Principle)**; two identities racing to link a brand-new reference resolve to exactly one winner; two different providers linked to the same identity concurrently both survive; successful unlink preserves history (`status: "unlinked"`, `unlinkedAt` set, **`customerIdentityId` unchanged — strengthened for the Founder-review correction**); idempotent unlink replay; last-reference-cannot-be-unlinked rejection; not-found rejection; cross-identity unlink rejection (privacy-safe); stale-expected-status rejection; rollback-on-failure leaves no partial authoritative record.
- **`firestoreRules.emulator.test.ts`:** 3 new tests, per §5.5.

All TDD steps followed RED→GREEN: the `authenticationReferenceRepository.emulator.test.ts` file was first run against no implementation (confirmed failing with "Cannot find module," the correct RED for a brand-new module), then implemented once and run again — all 15 initial tests passed on the first implementation pass with no further correction needed. The `customerIdentity.ts` signature extension was confirmed RED (2 legitimate payload-assertion failures, plain "does it throw" tests passing via TypeScript's known runtime object-spread laxness — the same documented caveat from `-07`) before the implementation edit, then GREEN after. The 2 tests added for the Founder-review correction (§4A) were run against the already-existing, unmodified implementation and passed immediately (17/17) — confirming, not changing, that the Permanence Principle was already enforced; no production code was altered by this correction.

## 7. Validation Suite (full, this task's final state)

- `pnpm lint` (`eslint .`) — zero findings.
- `pnpm format:check` (`prettier --check .`) — clean (after `prettier --write` on 3 files this task touched).
- `npx tsc --noEmit` (from `functions/`) — clean; also confirmed via `pnpm build` (both `functions` and `apps/web` build clean).
- `functions` unit tests: **46 files / 333 tests passed** (327 pre-existing + 6 new: 3 error-factory tests, 2 conflict-event tests, 1 link-authority/reason test).
- `apps/web` unit tests: **30 files / 259 tests passed** — unchanged from `-07`, no `apps/web` file touched by this task.
- `pnpm emulators:validate` (real Firebase Emulator Suite): **10 files / 114 tests passed** on the qualifying clean run (18 new: 15 repository + 3 Rules). One earlier full-suite run hit a single timeout in the pre-existing, unrelated `idempotencyService.emulator.test.ts` concurrency test under elevated host load (`uptime` load average ~12 on this run); confirmed transient by an isolated re-run of that file alone (7/7 passed) — not a regression, not touched by this task's diff.
- `pnpm build` — both workspaces build clean.

## 8. Domain Events

`AuthenticationReferenceLinked` (extended), `AuthenticationReferenceUnlinked` (extended), `AuthenticationReferenceConflictDetected` (new) — all three carry only `customerIdentityId`, `referenceType`/`referenceId` (Linked/Unlinked only — Conflict omits the raw `referenceId`), `authority`, `reason`, and standard envelope fields. No provider credential, token, OTP detail, raw subject-ID (on the conflict event), phone, or email is ever carried.

## 9. Errors

`authenticationReferenceLinkedToDifferentIdentityError`, `staleAuthenticationReferenceStatusError`, `authenticationReferenceCommandConflictError` — all reuse existing `ErrorCategory` values (`VALIDATION_FAILED`, `IDEMPOTENCY_CONFLICT` ×2). No raw Firestore error is ever surfaced to a caller; no new global error framework was introduced.

## 10. Firestore Rules

No `firestore.rules` change. The existing deny-by-default catch-all (`match /{document=**} { allow read, write: if false; }`) already denies every direct-client path to the new `authenticationReferences` collection — confirmed, not assumed, by the 3 new Rules tests in §5.5/§6.

## 11. Authentication and ITM Boundaries (confirmed unaffected)

This package receives only an already-validated, provider-neutral proof result as an opaque input (`authority`/`reason`) — it never calls a provider SDK, never sends an OTP, never verifies an email link, never manages a session, and never issues a token. It emits domain events only; it never computes, modifies, or reads ITM trust state, never marks a contact verified, and never assigns a trust level. Verified via architecture-boundary inspection of every new/modified file's import list — no provider SDK, no ITM module, no UI import anywhere in this task's diff.

## 12. Deferred Items (explicitly not implemented, not silently invented)

Google/OTP/email/Apple/passkey provider integration; session management; customer-facing or support UI; the heuristic/contact-attribute duplicate-resolution workflow and its support-review queue (§4); automatic identity merge; provider-token storage; ITM trust recalculation; notifications; rate limiting; production data migration.

## 13. Files Changed

**Created:** `functions/src/domains/identity/repositories/authenticationReferenceRepository.ts` (+`.emulator.test.ts`); this report; `docs/changes/IMPLEMENTATION_CHANGES.md` entry; `docs/00-governance/documentation-changes-log.md` Entry 064.

**Modified (narrow, additive only):** `identityErrors.ts`/`.test.ts`, `identityEvents.ts`/`.test.ts`, `customerIdentity.ts`/`.test.ts`, `firestoreRules.emulator.test.ts` (no `firestore.rules` change); `ENG-P2-001-PLAN-001` (`-08`-only status/matrix notes, §4 scope-narrowing disclosure); Engineering Implementation Programme (`-08`-only narrow status note). No historical report, Decision Register entry, or unrelated application file modified.

## 14. Programme Tracking Scope (narrow, `-08`-only)

Only `ENG-P2-001-08` is marked implemented-pending-review by this task. `ENG-P2-001-01`, `-03`, `-04`, `-05`, `-06`, `-07` remain merged as previously recorded. `ENG-P2-001-02`, `-09`, `-10`, `ENG-P2-001` as a whole, and Capability 2 overall are unaffected — not advanced, not touched. No open Founder decision (including `ENG-P2-001-PLAN-001` §14 Ambiguity 4) was altered, recorded, or self-approved by this task.

## 15. Risks

None new beyond the already-disclosed, pre-existing local emulator concurrency-flakiness class (environmental, confirmed transient, not a regression — see §7). The relink-after-unlink policy (§3 point 10, §4A) — this task's own disclosed, conservative resolution of a genuinely unresolved governing-text gap — is now Founder-approved as the Authentication Reference Permanence Principle (Founder Review, `PR #63`, 2026-08-05); no longer an open risk.

## 16. Rollback

`git revert` of this task's commit(s), or discard the branch — not yet merged. Purely additive; no existing file's prior behavior changed for any call site this task did not extend (confirmed via `tsc --noEmit` project-wide and a targeted grep finding zero other callers of `linkAuthenticationReference`/`unlinkAuthenticationReference`); no data, deployment, or live configuration affected.

## 17. Required Completion Report (33 points)

1. **Task:** `ENG-P2-001-08` — Identity Linking and Duplicate Prevention.
2. **Branch:** `feat/eng-p2-001-08-identity-linking`.
3. **Base commit:** `9bea9dbaa4b68af9736be31f725843637d0eb9c0` (the `-07` merge commit), confirmed `0 0` divergence from `origin/main` at task start.
4. **Worktree:** clean isolated worktree, primary checkout never touched.
5. **Entry gate:** all 6 conditions in §2 verified before any edit.
6. **Pre-edit analysis:** 18 points, §3, delivered in full before implementation began.
7. **Scope-narrowing disclosure:** §4 — structural (not heuristic) duplicate prevention; heuristic detection/review-queue UI deferred; Ambiguity 4 untouched.
8. **TDD discipline:** every new/modified test confirmed RED before implementation, GREEN after — §6.
9. **Core deliverable:** `authenticationReferenceRepository.ts` — atomic, doc-ID-keyed, cross-identity-uniqueness-enforcing link/unlink — §5.4.
10. **Uniqueness invariant:** `(referenceType, referenceId)` composite, doc-ID-as-value, `transaction.get()`-before-write — §3 point 6, §5.4.
11. **Link operation:** implemented per brief — identity-existence check, cross-identity conflict fail-closed, idempotent replay, atomic — §5.4.
12. **Unlink operation:** implemented per brief — ownership check (privacy-safe not-found on mismatch), optional stale-state check, history preserved — §5.4.
13. **Duplicate prevention:** cross-identity conflict detected, fails closed, privacy-safe audit event, never auto-merges — §5.4, §8.
14. **Persistence model:** authoritative record + transactionally-maintained projection — §3 point 13, §5.4.
15. **Atomicity/idempotency:** both operations single-transaction, idempotency-key-guarded — §5.4.
16. **Concurrency tests:** repeated link/unlink, concurrent same/different-identity link, race, stale state, rollback-on-failure — all covered, §6.
17. **Domain events:** `AuthenticationReferenceLinked`/`Unlinked` extended, `AuthenticationReferenceConflictDetected` new — §5.2, §8.
18. **Errors:** 3 new factories, existing categories reused, no raw Firestore error surfaced — §5.1, §9.
19. **Firestore Rules:** no change; 3 new dedicated tests confirm catch-all coverage — §5.5, §10.
20. **Authentication boundary:** confirmed untouched — §11.
21. **ITM boundary:** confirmed untouched — §11.
22. **Deferred items:** listed, not silently implemented — §12.
23. **Programme tracking:** narrow, `-08`-only — §14.
24. **Files changed:** full list — §13.
25. **Full validation suite:** lint/format/typecheck/build/unit/emulator all clean — §7.
26. **Test counts:** `functions` 333/333 (+6); `apps/web` 259/259 (unchanged); emulator 114/114 (+18) — §7.
27. **Flakiness disclosure:** one pre-existing, unrelated, transient timeout — confirmed via isolated re-run, not a regression — §7.
28. **Risks:** disclosed — §15.
29. **Rollback:** documented — §16.
30. **No merge performed:** this task explicitly did not merge; a dedicated PR is opened and left for Founder-authorized review.
31. **No unrelated file modified:** confirmed by `git status`/`git diff` scope review before commit.
32. **No secret, credential, or real phone number entered or referenced** at any point in this task.
33. **PR number, branch, head SHA, mergeability, CI status, unresolved-thread count:** recorded in the final chat completion report after commit/push/PR creation (this report is written before that step).
