> **Title:** ENG-P2-ARCH-CORR-003 — Audit Projection and Lookup Atomicity Documentation Corrections
> **Version:** 1.0 · **Status:** Correction implementation record — pending Founder-authorized merge · **Classification:** Working (execution-layer correction record)
> **Governing document:** [`ENG-P2-ARCH-REVIEW-001` Architecture Review Report](ENG-P2-ARCH-REVIEW-001-capability-2-customer-identity-architecture-review-2026-08-06.md) Findings F3, F4
> **Source-of-truth path:** `docs/05-implementation/reports/ENG-P2-ARCH-CORR-003-audit-projection-and-lookup-atomicity-corrections-2026-08-06.md`
> **Last controlled update:** 2026-08-06 (`ENG-P2-ARCH-CORR-003` — created)

# ENG-P2-ARCH-CORR-003 — Audit Projection and Lookup Atomicity Documentation Corrections

**This task resolves two bounded findings: F3 (audit-catalogue gap) and F4 (doc-comment mismatch). No Customer Profile, Authentication, ITM, UI, API, Rewards, or unrelated identity behaviour was modified. The outbox and lookup architecture were not redesigned.**

## 1. Executive Summary

F3: `trust_reference_updated` is a real, `-01`-defined domain event with no case in `auditPayloadProjection.ts`, falling to the generic `payloadOmitted: true` fallback. Investigation confirmed the event is unit-tested and constructible but **never emitted by any repository** — a defined domain capability with no current persistence call site, not dead code. Determination: **explicit privacy-safe projection required** — an allow-listed case returning `{}` (its only field, `trustRecordId`, is an opaque enumerable reference, treated identically to `recoveryProofReference`/`referenceId` elsewhere in the catalogue). F4: `identityLookupRepository.ts`'s header comment claimed single-transaction atomicity between the identity read and the audit write. Investigation confirmed the runtime behaviour is sound (no data-integrity defect, no partial state possible from a pure `.get()`) but the comment's specific "atomically" claim was inaccurate — the real guarantee is sequential coupling via exception propagation. Determination: **comment-only correction**, zero behaviour change. Both findings corrected; all validation green.

## 2. Starting Repository State

`origin/main` at merge commit `9e37b4b5706c7846bcd523ff7f1b0c53ed6d2394` (PR #68, confirmed present via `git merge-base --is-ancestor`).

## 3. Clean-Worktree Evidence

- `git worktree add -b fix/eng-p2-arch-corr-003-audit-projection-lookup-docs <path> origin/main`; `git status --porcelain` empty; `git rev-list --left-right --count origin/main...HEAD` → `0 0`; no `.git/MERGE_HEAD`/`rebase-merge`/`rebase-apply`.
- Architecture Review Report present; F1/F2 confirmed `[CORRECTED]`; F3/F4 confirmed still open.
- Baseline: `tsc --noEmit` clean, `pnpm lint` clean, 399/399 `functions` unit tests, full Emulator Suite exited successfully.

## 4. Starting Commit and Branch

`9e37b4b` on `fix/eng-p2-arch-corr-003-audit-projection-lookup-docs`.

## 5. F3 Evidence and Determination

**Evidence:** `identityEvents.ts:199` defines `buildTrustReferenceUpdatedEvent`; `auditPayloadProjection.ts:62-110` (pre-fix) had no matching `case`. Root-cause investigation: `buildTrustReferenceUpdatedEvent` is called by `setTrustReference` (`customerIdentity.ts:273-290`), a real, unit-tested domain function — but a repo-wide grep confirms **no repository calls `setTrustReference`**, so the event never reaches the outbox in any current execution path. This is `-01`'s own forward-defined aggregate capability (per `ENG-P2-ARCH-001` §8, "Trust strengthens identity. Trust never creates identity" — the identity side holds a reference, ITM owns the actual trust computation and, presumably, the future write path), not dead/obsolete code requiring separate governance action.

**Determination: Option 1 — Explicit privacy-safe projection required.** Payload shape: `{ customerIdentityId, trustRecordId }`. `customerIdentityId` is never itself part of any event's payload projection anywhere in this catalogue (it's carried separately as the audit record's own top-level field). `trustRecordId` is an opaque, enumerable pointer to an external ITM record — structurally identical to `recoveryProofReference`/`referenceId`, both already "deliberately never picked" elsewhere in this catalogue. The correct projection is therefore `{}`, matching the established `loyalty_number_issued`/`qr_identity_issued`/`qr_identity_invalidated`/`qr_identity_regenerated` pattern exactly.

## 6. Final Trust-Reference Audit Projection

```ts
case "trust_reference_updated":
  // trustRecordId is an opaque, enumerable pointer to an external ITM
  // record — deliberately never picked...
  return {};
```

No trust score, evidence, verification state, or provider data was ever present on this payload to begin with — nothing beyond `trustRecordId` needed omitting.

## 7. F4 Evidence and Determination

**Evidence:** `identityLookupRepository.ts:60-65` (pre-fix): *"Every lookup runs inside a Firestore transaction so audit-worthy attempts... can emit a privacy-safe `IdentityLookupAttempted` event atomically with the read that produced it."* Direct code trace: `runLookup` fully `await`s `resolve()` (a plain, non-transactional `.get()` via the underlying repositories) to completion; only afterward, and only if `shouldAudit()` returns true, does it call `emitAuditEvent`, which opens its own separate `db.runTransaction`. These are two sequential operations, never one transaction.

**Determination: comment-only correction — runtime behaviour is sound.** No data-integrity defect exists: a `.get()` cannot produce torn/partial writes. The actual guarantee (for audited outcomes, the caller never receives a "resolved" result whose audit write failed, because `emitAuditEvent`'s rejection propagates through the shared `catch` block) is real, deterministic, and already fully proven by the unmodified `identityLookupRepository.emulator.test.ts` suite. Only the comment's specific claim of single-transaction atomicity was inaccurate.

## 8. Final Lookup Consistency Model

- Identity read: plain, non-transactional `.get()`.
- Audit write (for outcomes requiring audit): its own, separate Firestore transaction — never the same transaction as the read.
- Can lookup succeed while audit persistence fails? For audited outcomes, no — the audit-write failure propagates and the caller never sees a "resolved" result. For non-audited outcomes (ordinary internal-service/merchant-transaction successes), audit is never attempted at all — a deliberate, disclosed policy.
- Can audit persistence succeed when lookup fails? Yes, by design — failed/not-found audited outcomes are audited too, per the existing `shouldAudit` policy table.
- Best-effort, required, or fail-closed? Required-but-sequential: never silently swallowed, but not single-transaction atomicity either.
- Retries idempotent? Yes — the audit event's outbox document is keyed by the caller-supplied `eventId` (a `.set()` on a deterministic doc ID), so a replay naturally deduplicates.

This model is now stated accurately in the corrected header comment.

## 9. Code Changes

- `functions/src/domains/identityAudit/models/auditPayloadProjection.ts`: added one explicit `case "trust_reference_updated": return {};` with an explanatory comment, inserted alongside the existing settled-identifier cases it matches in spirit.
- `functions/src/domains/identity/repositories/identityLookupRepository.ts`: header-comment block replaced (lines 60-67, pre-fix) with an accurate description of the actual consistency model. **Zero code lines changed** — confirmed via `git diff`, every changed line is a comment (`*`-prefixed JSDoc) line.

## 10. Documentation Changes

- `docs/05-implementation/reports/ENG-P2-001-10-implementation-report-2026-08-05.md` §38.3 — added a `trust_reference_updated` row to the audit payload catalogue, in place, historical text preserved.
- Architecture Review Report — F3 and F4 entries updated in place (bracket-marker convention).
- This correction report.
- `IMPLEMENTATION_CHANGES.md`, `documentation-changes-log.md` entries.

## 11. Tests Added or Modified

- `auditPayloadProjection.test.ts` — one new test: `"omits the raw trust record reference from a trust_reference_updated payload, returning no fields (ENG-P2-ARCH-CORR-003, Finding F3)"`. RED confirmed first (asserted `{}`, received `{ payloadOmitted: true }`), then GREEN after the fix.
- `identityLookupRepository.emulator.test.ts` — **not modified**. Since F4 is a comment-only correction with zero behaviour change, this file's continued, unmodified pass across the full suite is itself the required regression proof (existing success path unchanged, existing failure path unchanged, audit-write behaviour unchanged, no new transaction coupling, no duplicate audit event on replay, privacy-minimised result preserved — all already covered by this file's pre-existing tests).

## 12. Validation Commands and Results

| Command | Result |
|---|---|
| `pnpm --filter functions exec tsc --noEmit` | Clean |
| `pnpm lint` | Clean |
| `pnpm format:check` | Clean |
| `pnpm --filter functions exec vitest run` (targeted: `auditPayloadProjection`) | 11/11 (RED confirmed before the fix, GREEN after) |
| `pnpm --filter functions exec vitest run` (full) | 400/400 (399 baseline + 1 new) |
| `firebase emulators:exec ... "test:emulator"` (full suite, run twice) | 172/172 both times, clean |
| `pnpm --filter web exec vitest run` | 259/259 |
| `pnpm build` (both workspaces) | Clean |

## 13. Dependencies Added

None.

## 14. Configuration Changes

None.

## 15. Security and Privacy Assessment

F3's fix closes a genuine audit-catalogue gap for a real, defined event — should any future ITM integration wire `setTrustReference` into a repository, the audit-query layer will now correctly return `{}` (explicit, known-safe) rather than relying on the unrecognised-event fallback (which is safe but semantically misleading — it signals "unknown event type," not "known event, deliberately minimised"). No new field is exposed anywhere; the change is strictly more explicit, never less safe. F4's fix is documentation-only and has no security or privacy effect — the underlying enumeration-resistance, fail-closed behaviour, and audit-minimisation guarantees proven in the architecture review remain fully intact and unmodified.

## 16. Risks

None new. F3 is additive (a new explicit case, currently unreachable since no repository emits the event). F4 changes zero executable code.

## 17. Deferred Findings

F5–F11 from `ENG-P2-ARCH-REVIEW-001` are unaffected and remain open, per this task's own scope constraint. No change was made to any of them.

## 18. Rollback Instructions

`git revert` of this task's commit, or discard the branch — not yet merged. Purely additive/documentation (one new switch case, one new test, one comment block, three doc updates); no data, deployment, or live configuration affected either way.

## 19-21. Tracking Updates

See §10 for the full documentation file list. `IMPLEMENTATION_CHANGES.md` and `documentation-changes-log.md` entries are appended below this report's own commit.

## 22. Architecture Review Report Updates

F3 and F4 entries updated in place (bracket-marker convention, original text struck through and preserved, not deleted) to record the corrections and link to this report. F1/F2 remain `[CORRECTED]`; F5–F11 remain untouched.

## 23. PR Details

See the completion report delivered in chat for PR number, branch, head SHA, mergeability, CI status, and unresolved-thread count (recorded after the PR is opened, per the task's own required sequencing).
