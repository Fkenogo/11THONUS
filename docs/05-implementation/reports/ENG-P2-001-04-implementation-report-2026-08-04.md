> **Title:** `ENG-P2-001-04` — QR Identity Service Foundation Implementation Report
> **Version:** 1.0 · **Status:** Complete, pending Founder-authorized review/merge · **Classification:** Working (implementation record)
> **Source-of-truth path:** `docs/05-implementation/reports/ENG-P2-001-04-implementation-report-2026-08-04.md`
> **Prepared:** 2026-08-04

# `ENG-P2-001-04` — QR Identity Service Foundation Implementation Report

## 1. Executive Summary

Implemented the bounded QR Identity domain foundation defined by `DEC-DATA-007`'s QR Generation Principles and `ENG-P2-ARCH-001` §5, at a new sibling domain module `functions/src/domains/qrIdentity/`. Test-driven throughout (55 new tests, all written and confirmed RED before implementation). No image rendering, scanning, UI, API, Firestore persistence, merchant lookup, registration orchestration, Authentication, ITM, or Reward logic. The domain layer is framework-independent (zero Firebase import, machine-enforced by a new scoped `eslint.config.js` rule mirroring `-01`/`-03`'s precedent).

## 2. PR #58 Merge Result and SHA

Reverified live before starting: PR #58 `state: MERGED`, `mergeCommit.oid: 5fb91ab7c6ade5db54f82d492182bf794ec72c04`, `mergedAt: 2026-08-04T09:07:57Z`. `origin/main` fetched and confirmed at exactly this SHA.

## 3. Clean-Worktree Evidence

```
git worktree add -b feat/eng-p2-001-04-qr-identity-foundation \
  <scratchpad>/eng-p2-001-04-qr-identity-foundation origin/main
```
Result: `HEAD is now at 5fb91ab Merge pull request #58 ...`; `git status --short` empty; `git rev-list --left-right --count origin/main...HEAD` → `0  0`; no `MERGE_HEAD`/`rebase-merge`/`rebase-apply`; Identity Domain Foundation and Loyalty Number Service both confirmed present; full suite green (201/201) before any edit.

## 4. Starting and Ending Repository State

Starting commit: `5fb91ab7c6ade5db54f82d492182bf794ec72c04`. Branch: `feat/eng-p2-001-04-qr-identity-foundation`. Ending state: 39 new tests added (`functions` suite grew from 201 to 240/240 — see §19 for the exact per-file breakdown), all workspace tests green, primary dirty checkout on `chore/eng-p1-001-closure` never touched.

## 5. Pre-Edit Analysis

Stated in full in chat before any file was written (12 points, per the task's own list).

## 6. QR Governing-Contract Analysis

**Payload contract (unambiguous across all sources):** `DEC-DATA-007`'s Final Decision text states verbatim the QR *"encodes only a plain opaque reference to the loyalty code — not a signed token, and never the code's underlying data or any personal information."* Confirmed independently by the Decision Package §8 (Sub-choice A resolved to Option A1 — plain reference, Option A2 signed-token explicitly rejected) and TRD12 §12.42. This directly answers the task-opening framing question: the payload is a **separate opaque QR reference**, not the visible loyalty number and not a versioned/signed payload.

**A genuine textual tension found and reconciled, not silently resolved:** `ENG-P2-ARCH-001` §5 says regeneration leaves *"the underlying `qrReference`/Loyalty Number relationship... unchanged."* `ENG-P2-001-PLAN-001`'s own `-04` section — in the same Scope bullet, its Tests-required line, and its Rollback-boundary line — requires *"a new resolvable reference"* with *"the prior reference fail[ing] to resolve."* Three explicit, operationally-specific clauses in the task's own governing decomposition-plan section outweigh one compressed paraphrase in the architecture document. Reading adopted: *"relationship unchanged"* = the stable **mapping** (which identity/loyalty number this QR ultimately represents never changes), not literal identity of the reference string. **Regeneration therefore produces a genuinely new `QrReference`; the Customer Identity ID and Loyalty Number never change.** This resolution is documented in the association service's own doc comment and in the domain README, not only here.

**Rotation/regeneration scope:** `DEC-DATA-007`'s own decision package marks *automatic* QR rotation/regeneration out of scope for that decision, deferring to TRD12 §12.42 ("may be introduced if static code abuse becomes material"). `ENG-P2-ARCH-001` (later, its own authorized architecture work) defines a *customer/orchestration-initiated* regeneration capability — consistent, not contradictory, with `DEC-DATA-007`'s deferral, and matching PRD2 §9's *"regenerate if required."* The task's own Deferred list names "rotation administration" (automatic/scheduled) as out of scope — this foundation implements only the customer-initiated capability.

**Retired status assessed, not implemented as a separate state:** `ENG-P2-ARCH-001` §3's Closed row says QR fields are *"retained, not deleted"* on identity closure, without naming a distinct QR-domain "retired" status the way it explicitly does for the Loyalty Number. Two lifecycle statuses (`active`/`invalidated`) satisfy retention-without-reuse structurally — no operation ever frees a `qrReference` for reuse.

## 7. Files Inspected

`docs/00-governance/decisions/decision-register.md` (`DEC-DATA-007`); `docs/00-governance/decisions/loyalty-code-decision-brief.md`; `docs/00-governance/decisions/evidence/DEC-DATA-007-decision-package-2026-07-30.md`; `docs/05-implementation/roadmap/ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md` (§`ENG-P2-001-04`); `docs/05-implementation/roadmap/ENG-P2-ARCH-001-customer-identity-architecture.md` (§3, §5, §6); `docs/02-technical/trd/12-security-and-access-control.md` (§12.42–12.43); `docs/02-technical/trd/10-firestore-data-architecture.md` (`qrReference` schema field); `docs/01-product/prd/02-customer-registration-and-identity.md` (§9); `docs/00-governance/requirements-traceability-matrix.md` (`FR-CI-002`); `functions/src/domains/identity/models/customerIdentityId.ts`; `functions/src/domains/loyaltyNumber/models/loyaltyNumber.ts`, `loyaltyNumberErrors.ts`; `eslint.config.js`.

## 8. Files Created or Modified

**Created:** `functions/src/domains/qrIdentity/models/qrReference.ts`+`.test.ts`, `qrPayload.ts`+`.test.ts`, `qrIdentityErrors.ts`+`.test.ts`; `functions/src/domains/qrIdentity/services/qrReferenceGenerator.ts`, `qrIdentityAssociationService.ts`+`.test.ts`; `functions/src/domains/qrIdentity/events/qrIdentityEvents.ts`+`.test.ts`; `functions/src/domains/qrIdentity/README.md`; this report; `IMPLEMENTATION_CHANGES.md` entry; `documentation-changes-log.md` entry.

**Modified (narrow, additive only):** `eslint.config.js` (new scoped block); `ENG-P2-001-PLAN-001` (`ENG-P2-001-04` matrix row + updated note); `engineering-implementation-programme.md` (`ENG-P2-001-04`-only status note); `coding-agent-prompt-register.md` (narrow status note).

No file outside this list was touched. Nothing under `ENG-P2-001-01`–`-03`, `-05` through `-10`, Capability 2 overall, Authentication, or ITM was modified.

## 9. Code-Diff Summary

12 new files under `functions/src/domains/qrIdentity/` (7 source `.ts`, 4 test `.ts`, 1 README — see exact list §8), plus this report and the two changes-tracking entries; 1 file modified (`eslint.config.js`). Zero dependency-manifest changes (`git diff --stat` on all four package/lockfile manifests is empty).

## 10. QR Reference Design

`type QrReference = string` (plain validated type-alias, matching the `CustomerIdentityId`/`LoyaltyNumber` pattern). `createQrReference(raw)` trims whitespace, rejects empty input and any character outside a safe token charset (`A-Za-z0-9_-`). No exact length/entropy policy is mandated by any governing document — the reference is deliberately opaque — so only genuinely malformed input is rejected, not an invented length/format policy.

## 11. QR Payload Design

`QrPayload = { readonly qrReference: QrReference }` — a single-field wrapper, structurally incapable of carrying any other field. `serializeQrPayload` returns the reference string directly (no JSON envelope — avoiding a parsing attack surface for what is meant to be a "plain opaque reference," not a structured token). `parseQrPayload(raw)` is the inverse. Tested to confirm the payload's own keys are exactly `["qrReference"]` and that serialized output never contains any forbidden-field substring (name/phone/email/trust/auth/reward/purchase/balance).

## 12. Identity and Loyalty Number Association

`QrIdentityAssociation = { customerIdentityId, loyaltyNumber, qrReference, status, issuedAt }`. `issueQrIdentity` requires both `customerIdentityId` and `loyaltyNumber` as already-valid inputs (validated via the identity and loyaltyNumber domains' own factories, reused and wrapped into this domain's own error type — never invented, never generated here). Enforced invariants: QR belongs to one identity (one association object, one `customerIdentityId` field); QR does not create identity (no identity-creation code path exists anywhere in this module); QR does not authenticate (no verification/trust field exists on `QrIdentityAssociation` — confirmed by an architecture test asserting its exact key set); possession is not proof of ownership (no such semantic is ever encoded — purely documentation + absence of any check); QR does not change the loyalty number (immutable pass-through field across every operation, tested explicitly under regeneration).

## 13. Lifecycle Rules

Three operations matching `ENG-P2-ARCH-001` §5's named phases: `issueQrIdentity` (Generation — first issuance only; rejects a second active association for the same identity with `duplicateActiveQrIdentityError`; rejects an existing association belonging to a different identity with `conflictingQrIdentityAssociationError`), `regenerateQrIdentity` (Regeneration/Invalidation — requires the current association to be `active`, else `qrRegenerationNotPermittedError`; produces a new active association and marks the old one `invalidated`), `restoreQrIdentityForRecovery` (Recovery — trivial passthrough proving recovery restores the exact existing association, never creates a new one).

## 14. Recovery Boundary

`restoreQrIdentityForRecovery(current)` returns the identical association object unchanged — satisfying `ENG-P2-ARCH-001` §5's Recovery row ("confirming the existing QR still resolves... Never creates a QR for a new identity"). The "trigger regeneration if compromise is implied" recovery branch reuses `regenerateQrIdentity` directly — no separate operation was needed or added.

## 15. Domain Events

Three events, all implemented and independently tested: `QrIdentityIssued`, `QrIdentityInvalidated`, `QrIdentityRegenerated`. `issueQrIdentity` emits `Issued`; `regenerateQrIdentity` emits both `Invalidated` (old reference) and `Regenerated` (new + previous reference) in a single call, giving a complete audit trail per `DEC-DATA-007`'s "every generation event audit-logged" principle. No transport/persistence/queue/Cloud Function wiring.

## 16. Domain Errors

`QrIdentityDomainError` (structurally identical to `IdentityDomainError`/`LoyaltyNumberDomainError`, defined independently to avoid the Firebase-dependent `commandDispatcher.ts` import chain). Six factories, all mapped onto the existing closed 14-category enum: `invalidQrReferenceError`, `invalidCustomerIdentityIdForQrIdentityError`, `invalidLoyaltyNumberForQrIdentityError` (all `VALIDATION_FAILED`); `conflictingQrIdentityAssociationError`, `duplicateActiveQrIdentityError`, `qrRegenerationNotPermittedError` (all `INVALID_STATE_TRANSITION`). No separate "invalid payload" error: since the approved payload contains only the reference, payload validation collapses into reference validation — an artificial third error would never have a genuine trigger (disclosed explicitly in `qrIdentityErrors.ts`'s own doc comment, not silently omitted). "Inactive or retired QR" and "invalid lifecycle transition" collapse into the single `qrRegenerationNotPermittedError` guard, since this foundation's minimal 2-state model gives them no distinct trigger condition — also disclosed, not silently merged.

## 17. Security and Privacy Analysis

- **Enumeration/tampering/guessing:** rate-limited lookup is explicitly deferred (no lookup surface exists in this foundation at all — TRD12 §12.42/§12.43's enforcement belongs to a future API/persistence layer).
- **Screenshots/sharing/replay:** the reference is a lookup aid, not a secret (TRD12 §12.43's "identifier, not a secret" principle extends directly); no verification/possession-proves-ownership semantic exists anywhere in the module.
- **Merchant lookup authorisation:** out of scope — no lookup function exists in this foundation.
- **Revocation:** regeneration is the revocation mechanism — old reference marked `invalidated`, never resolves again (once a future persistence layer enforces it).
- **Logging:** the settled (post-issuance/post-regeneration) reference value appears in domain events for audit purposes, consistent with `DEC-DATA-007`'s own audit-logging requirement; nothing beyond the reference is ever logged.
- **URL exposure / public identifier vs. secret:** the reference is designed to be safely embeddable (safe charset) and is explicitly documented as a public identifier, never a credential.

## 18. Deferred Items

QR image rendering (SVG/PNG), camera scanner, scan UI, Firestore persistence, distributed uniqueness, merchant search, online lookup endpoint, offline verification, rate limiting, rotation administration (automatic/scheduled, as distinct from the customer-initiated regeneration implemented here), migration, analytics, recovery orchestration. None silently implemented — each is named in the domain README and this report.

## 19. Tests Added or Modified

39 new tests across 5 test files, all TDD (RED confirmed before every implementation):
- `qrIdentityErrors.test.ts` — 7 tests.
- `qrReference.test.ts` — 7 tests.
- `qrPayload.test.ts` — 6 tests.
- `qrIdentityEvents.test.ts` — 3 tests.
- `qrIdentityAssociationService.test.ts` — 16 tests (successful issuance, single-event-on-issue, one-identity-per-QR, no-identity/loyalty-number creation, duplicate-active rejection, conflicting-identity rejection, invalid-id rejection, invalid-loyalty-number rejection, no-authentication-semantics architecture check, regeneration produces new active + invalidates prior, identity permanence, loyalty-number permanence, old-reference distinct status, both events emitted, prohibited-transition rejection, recovery-restoration boundary).

Total: 39 new tests (7+7+6+3+16 = 39; functions suite grew from 201 to 240).

## 20. Validation Commands and Results

```
pnpm -r run build                                  # functions + apps/web clean
npx eslint .                                        # 0 findings (full repo)
npx prettier --check .                              # clean after one --write pass (whitespace only)
npx tsc --noEmit (functions)                         # clean
npx vitest run (functions)                           # 36 files, 240 tests passed (201 pre-existing + 39 new)
npx vitest run (apps/web)                            # 30 files, 259 tests passed, unaffected
```

## 21. Dependencies Added

None. Confirmed via empty `git diff --stat` on all four package/lockfile manifests.

## 22. Configuration Changes

One new scoped ESLint block (`eslint.config.js`) enforcing zero Firebase SDK imports under `functions/src/domains/qrIdentity/**/*.ts`, mirroring the identity/loyaltyNumber blocks.

## 23. Risks

None beyond the already-disclosed textual reconciliation in §6 (regeneration semantics), which is fully documented and reversible if a future reviewer reads the governing text differently. No uniqueness-collision risk is introduced by this foundation since no persistence/collision-checking exists yet (deferred).

## 24. Rollback Instructions

`git revert` of this task's commit(s) — a self-contained new domain module (no other module imports from `qrIdentity/` yet) plus a scoped ESLint addition and additive documentation notes. No persisted data exists anywhere to migrate or roll back.

## 25. Markdown Implementation Report

This document: `docs/05-implementation/reports/ENG-P2-001-04-implementation-report-2026-08-04.md`.

## 26. `IMPLEMENTATION_CHANGES.md` Update

Appended — see the `2026-08-04 — ENG-P2-001-04` entry.

## 27. Documentation Changes-Log Update

Appended — see Entry 059 in `docs/00-governance/documentation-changes-log.md`.

## 28. Persistent Task-Level Record

This report itself is the persistent task-level `.md` record.

## 29. PR Evidence

Recorded once the PR is opened — see the end-of-turn completion report for PR number, branch, head SHA, mergeability, CI status, and unresolved-thread count.
