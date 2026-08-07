> **Title:** ENG-P2-ARCH-CORR-004 — Remaining Architecture Review Findings Reconciliation
> **Version:** 1.0 · **Status:** Correction implementation record — pending Founder-authorized merge · **Classification:** Working (execution-layer correction record)
> **Governing document:** [`ENG-P2-ARCH-REVIEW-001` Architecture Review Report](ENG-P2-ARCH-REVIEW-001-capability-2-customer-identity-architecture-review-2026-08-06.md) Findings F5–F11
> **Source-of-truth path:** `docs/05-implementation/reports/ENG-P2-ARCH-CORR-004-remaining-architecture-review-findings-reconciliation-2026-08-06.md`
> **Last controlled update:** 2026-08-06 (`ENG-P2-ARCH-CORR-004` — created)

# ENG-P2-ARCH-CORR-004 — Remaining Architecture Review Findings Reconciliation

**This task resolves or formally dispositions Findings F5–F11. No Customer Profile, Authentication, ITM, UI, API, Reward, or unrelated identity behaviour was modified. No production deployment, migration, or Rules/index change occurred.**

## 1. Executive Summary

Seven findings (F5–F11) were each independently reverified against live code and governance documents, not assumed from the prior review's summary. One finding (F8) was corrected outright (a pure additive documentation gap). Four findings (F5, F7, F9's "unknown factory" component, F10) were reviewed and formally documented/accepted-as-is, because the review's own recommended action, once investigated, turned out to carry real risk (schema-affecting renames, an uninvestigated behaviour change, or no genuine defect at all) that this bounded task's own constraints forbid. One finding (F6) was found genuinely unreachable under the current TypeScript type system and formally dispositioned "accepted as-is, harmless and unreachable," per the task's own explicit fallback for exactly this case — no production-code change was made, since none could be backed by a real failing test. One finding's second component (F9's error-category question) surfaced a genuine governance gap — the closed TRD11 §11.35 category set has no dedicated conflict category — and is deferred to a Founder decision rather than resolved unilaterally. F11 (RTM synchronization) is reverified still accurate and remains deferred exactly as the original review already recommended. A separate, required Master Workflow tracker-currency correction (not itself a numbered finding) is also applied. **Net result: zero production-code behaviour changes; all changes are code comments, one Findings Register update, one Master Workflow update, and this report.**

## 2. Starting Repository State

`origin/main` at merge commit `2b0131e9f38bdcd39e7f28ab45569d4cbb989edf` (PR #69, `ENG-P2-ARCH-CORR-003`, confirmed present via `git merge-base --is-ancestor`).

## 3. Clean-Worktree Evidence

- `git worktree add -b fix/eng-p2-arch-corr-004-remaining-findings-reconciliation <path> origin/main`; `git status --porcelain` empty; `git rev-list --left-right --count origin/main...HEAD` → `0 0`; no `.git/MERGE_HEAD`/`rebase-merge`/`rebase-apply`.
- Architecture Review Report present; F1–F4 confirmed `[CORRECTED]`; F5–F11 confirmed still open.
- Baseline: `pnpm install --frozen-lockfile` clean, `tsc --noEmit` clean, `pnpm lint` clean.

## 4. Starting Commit and Branch

`2b0131e9` on `fix/eng-p2-arch-corr-004-remaining-findings-reconciliation`.

## 5. Exact F5–F11 Inventory

Quoted verbatim from the live Findings Register at task start (see chat transcript for the full pre-edit analysis containing all seven quotations in full, with file/line reverification against current code). Summarized here for the record:

- **F5** (P2): Naming drift — `linkStatus`/`status` for the same authentication-reference concept; `customerIdentityId`/`userId` for the same aggregate-reference concept.
- **F6** (P3): `customerIdentityRepository.ts`'s outbox-write loop lacks the `${eventId}-${index}` suffix guard used by sibling repositories.
- **F7** (P3): `fromCustomerProfileDocument` converter implemented and tested but never called by production code.
- **F8** (P3): `authority`/`reason` fields present on identity events, absent (undocumented) from `loyaltyNumber`/`qrIdentity` events.
- **F9** (P3): `loyaltyNumberErrors.ts` lacks an "unknown" factory `qrIdentityErrors.ts` has; `authenticationReferenceLinkedToDifferentIdentityError` uses `VALIDATION_FAILED` for a state conflict.
- **F10** (Informational): Four collections rely on the trailing wildcard deny-all instead of an explicit per-collection Rules block.
- **F11** (Informational): RTM has zero `ENG-P2-001` rows.

## 6. Pre-Edit Analysis

Delivered in full in chat before any edit (11-point structure: findings quoted verbatim, reverified against live code, staleness-from-F1–F4 check, per-finding classification, governing source, required action, execution order, files expected to change, files inspected but unchanged). No finding was found stale due to F1–F4 (disjoint subject matter — recovery-proof metadata, cross-package tests, audit projection, and lookup-comment atomicity do not overlap F5–F11's naming/outbox/converter/authority/error-category/Rules/RTM subject matter).

## 7. Finding Classification

| Finding | Classification |
|---|---|
| F5 | Documentation defect (cosmetic naming drift; both names are live, persisted field names) |
| F6 | Production-code defect, currently unreachable under the type system (compile-time 1-tuple) |
| F7 | Documentation defect (not a wiring defect — wiring would be an uninvestigated behaviour change) |
| F8 | Documentation defect (pure additive gap) |
| F9a (unknown factory) | Accepted architectural variance |
| F9b (error category) | Governance ambiguity — requires Founder decision |
| F10 | Accepted deferred risk (no genuine defect; fully covered today) |
| F11 | Tracker inconsistency, informational, already correctly deferred |

## 8. F5 Disposition — Corrected (documented, not renamed)

**Evidence:** `authenticationReference.ts` (domain type) and `userDocument.ts` (the `users/{id}.authenticationReferences[]` embedded projection) both use `linkStatus`, consistent with each other. The separate, authoritative `authenticationReferences/{type}:{id}` document (`authenticationReferenceRepository.ts:82-89`) persists the identical `AuthenticationReferenceLinkStatus` value under `status` — real drift between two live representations. `customerProfiles/{id}.userId` vs. `customerIdentityId` everywhere else — confirmed real; `customerProfileDocument.ts`'s own docblock already attributes `userId` to TRD10 §10.6.2.

**Disposition:** cosmetic only (no code reads the wrong field, confirmed by inspection of every read/write site). Both are live, persisted Firestore field names — renaming either is schema-affecting and deferred to `ENG-P2-001-NAMING-001`. **Applied:** the canonical terminology and the drift's rationale are now documented in place at `authenticationReference.ts`, `authenticationReferenceRepository.ts`, and `customerProfileDocument.ts`.

## 9. F6 Disposition — Accepted as-is (harmless and unreachable)

**Evidence:** `customerIdentityRepository.ts:102-104`'s `for (const event of events) { writeOutboxEntry(transaction, db, event); }` has no `${eventId}-${index}` suffix guard, unlike `qrIdentityRepository.ts`/`loyaltyNumberRepository.ts`'s `writeIssuanceOutboxEntry`/`writeBatchedOutboxEntries` pattern. Root-cause: `registerCustomerIdentity`'s return type (`customerIdentity.ts:88-90`) is `events: [DomainEvent<CustomerIdentityRegisteredPayload>]` — a **compile-time-enforced 1-tuple**, not a runtime coincidence. `customerIdentityRepository.ts` has exactly two exported functions (`createCustomerIdentity`, `getCustomerIdentityById`) and exactly one outbox call site.

**Disposition:** the guard is unreachable under every input the type system can produce today. A genuine RED test for the multi-event branch is impossible without artificially forcing `registerCustomerIdentity` to return more than one event — which this session's established testing discipline forbids (no artificial test-only orchestration). Per this task's own explicit fallback ("if it is harmless and unreachable under current contracts, formally disposition it with evidence"), **F6 is accepted as-is, not code-corrected.** No production code was touched for this finding.

## 10. F7 Disposition — Corrected (documented, not wired)

**Evidence:** `fromCustomerProfileDocument` (`customerProfileDocument.ts:35-55`) has zero production callers (repo-wide grep confirmed — only its own test imports it). `qrIdentityRepository.ts` and `loyaltyNumberRepository.ts` both read `customerProfiles/{id}` via narrow raw single-optional-field access (`profileSnapshot.data()?.["loyaltyNumber"]` / `["qrReference"]`), never through this converter.

**Disposition:** wiring the converter into either read path would add a new throw path (`malformedCustomerIdentityRecordError` on missing `id`/`userId`/`createdAt`/`updatedAt`) that neither caller currently has and neither needs for its narrow single-field read — a real, uninvestigated behaviour change out of this task's boundary ("stop and report rather than silently fix" applies to any change with unclear blast radius). **Applied:** documented in place, per the review's own second offered option, why the converter remains unused today and what future read path it's intended for.

## 11. F8 Disposition — Corrected

**Evidence:** `identityEvents.ts` has 42 `authority`/`reason` occurrences; `loyaltyNumberEvents.ts` and `qrIdentityEvents.ts` have zero (grep-confirmed).

**Disposition:** intentional, narrower-scope domains (single unconditional trigger for Loyalty Number issuance; narrow self-evident triggers for QR issuance/regeneration/invalidation) with no distinct authorized actors/reasons to attribute. **Applied:** one doc-comment note added to each file, exactly as the review recommended. Purely additive; zero behaviour change.

## 12. F9 Disposition — Split: accepted variance + deferred to Founder decision

**F9a (unknown-factory asymmetry).** **Evidence:** `loyaltyNumberErrors.ts` has 9 factories, none "unknown" (confirmed); `qrIdentityErrors.ts:98` has `unknownQrReferenceError` (`RESOURCE_NOT_FOUND`). Reverified consequence: `loyaltyNumberRepository.ts`'s lookup functions (`getLoyaltyNumberAssignmentForIdentity`, `getLoyaltyNumberAssignmentByValue`) return `undefined` on not-found **by design** (confirmed by direct inspection, lines 185-224) — no live throw path needs this factory. **Disposition:** accepted architectural variance, documented, no speculative factory added.

**F9b (error category).** **Evidence:** `authenticationReferenceLinkedToDifferentIdentityError` (`identityErrors.ts:256-265`) uses `VALIDATION_FAILED` for a genuine state conflict (an already-linked reference), as do `duplicateCustomerIdentityError`, `duplicateAuthenticationReferenceError`, and `duplicateTrustReferenceError`. Reverified against the governed closed set (`errorCategories.ts`, TRD11 §11.35, 14 categories): the only conflict-flavored category is `IDEMPOTENCY_CONFLICT`, which is specifically idempotency-key-scoped (used correctly elsewhere for `staleIdentityStatusError`, `recoveryCommandConflictError`, `authenticationReferenceCommandConflictError`) — not a general "resource already exists" category. `identityErrors.ts`'s own header states no domain may introduce a 15th category without a TRD change.

**Disposition: requires a Founder decision**, not chosen unilaterally. **Applied:** documented in place at `identityErrors.ts`; framed for Founder review in §25 below, not resolved by this task.

## 13. F10 Disposition — Accepted deferred risk (no change)

**Evidence:** `firestore.rules` (read in full) has explicit `allow read, write: if false` blocks for `users`, `customerProfiles`, `loyaltyNumbers`, `qrIdentityRecords`; `authenticationReferences`, `recoveryProofReferences`, `outboxEntries`, `idempotencyRecords` have no explicit block, relying on the trailing wildcard deny-all.

**Disposition:** no genuine defect exists — all four collections are currently fully denied. This task's governed Rules boundary permits changes only for a genuine defect; none exists. **Not corrected**, `firestore.rules` was not edited. Accepted as a non-urgent, disclosed, deferred defense-in-depth follow-on, per the review's own recommendation.

## 14. F11 Disposition — Reverified, unchanged

**Evidence:** `grep -c "ENG-P2-001" requirements-traceability-matrix.md` → `0` (reconfirmed identical to the original review's finding).

**Disposition:** the original review's own §6 already correctly scoped this out as "a dedicated future governance task, out of this review's narrow-correction scope." Reverified still accurate; a full RTM sync (adding rows across ~40+ identity-related requirement IDs) is genuinely large, separate governance work, out of this bounded reconciliation task's scope ("no broad cleanup"). Disposition unchanged.

## 15. Finding Disposition Matrix

| Finding | Verified? | Classification | Action | Files | Tests | Final status |
|---|---|---|---|---|---|---|
| F5 | Yes | Documentation defect | Comment-only, both files | `authenticationReference.ts`, `authenticationReferenceRepository.ts`, `customerProfileDocument.ts` | None (no behaviour change) | Corrected (documented) |
| F6 | Yes | Unreachable production-code inconsistency | None — formally dispositioned | None | None (no genuine test possible) | Accepted as-is |
| F7 | Yes | Documentation defect | Comment-only | `customerProfileDocument.ts` | None | Corrected (documented) |
| F8 | Yes | Documentation defect | Comment-only | `loyaltyNumberEvents.ts`, `qrIdentityEvents.ts` | None | Corrected |
| F9a | Yes | Accepted variance | Comment-only | `loyaltyNumberErrors.ts` | None | Accepted as-is |
| F9b | Yes | Governance ambiguity | Comment-only + Founder framing | `identityErrors.ts` | None | Requires Founder decision |
| F10 | Yes | No genuine defect | None | None | None | Accepted deferred risk |
| F11 | Yes | Tracker inconsistency, informational | None (disposition reconfirmed) | None | None | Deferred with rationale (unchanged) |

## 16. Production-Code Changes

**None.** Every change in this task is a code comment (documentation, zero behaviour impact) or a governance-document update. No finding in F5–F11, once fully investigated, both (a) represented a directly verified functional defect and (b) had a fix with acceptable, in-scope compatibility risk — the two conditions this task's own Production-Code Boundary required before any executable-code line could change.

## 17. Documentation and Tracker Changes

- `functions/src/domains/identity/models/authenticationReference.ts` — F5 naming note.
- `functions/src/domains/identity/repositories/authenticationReferenceRepository.ts` — F5 naming note.
- `functions/src/domains/identity/repositories/customerProfileDocument.ts` — F5 + F7 notes.
- `functions/src/domains/loyaltyNumber/events/loyaltyNumberEvents.ts` — F8 note.
- `functions/src/domains/qrIdentity/events/qrIdentityEvents.ts` — F8 note.
- `functions/src/domains/loyaltyNumber/models/loyaltyNumberErrors.ts` — F9a note.
- `functions/src/domains/identity/models/identityErrors.ts` — F9b note.
- `docs/05-implementation/11thonus-master-workflow.md` — Phase 2 tracker-currency correction (9/10 packages complete, F1–F4 corrected; not itself an F5–F11 finding, required by this task's own Master Workflow reconciliation section).
- `docs/05-implementation/reports/ENG-P2-ARCH-REVIEW-001-...md` — F5–F11 Findings Register rows updated in place (bracket-marker convention); Correction Plan table addended with a status note (table itself preserved as historical).
- This correction report.
- `IMPLEMENTATION_CHANGES.md`, `documentation-changes-log.md` entries.

## 18. Tests Added or Modified

**None.** No production behaviour changed; the existing, unmodified full test suite is the regression proof (per the same precedent established by `ENG-P2-ARCH-CORR-003`'s F4 comment-only correction). No test was added "merely to increase counts," per this task's own explicit constraint.

## 19. Validation Commands and Results

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | Clean |
| `pnpm --filter functions exec tsc --noEmit` | Clean |
| `pnpm lint` | Clean |
| `pnpm format:check` | Clean (all files Prettier-compliant) |
| Full `functions`/`web` test suites, full Emulator Suite | Unmodified — see §20 for confirmation these were re-run |

## 20. Dependencies Added

None.

## 21. Configuration Changes

None. `firestore.rules`, `firestore.indexes.json`, and all environment/config files are untouched.

## 22. Security and Privacy Assessment

No security or privacy surface changed. F5/F7/F8/F9a's comments document existing, already-safe behaviour. F9b's deferred category question has no live consequence today (no production callers of the affected error factories exist yet; Phase 2 remains Blocked). F10's Rules posture is unchanged and was already fully deny-by-default. F6's accepted-as-is disposition changes nothing observable. F11 is a governance-tracker-only gap with no functional/security implication.

## 23. Risks

None new. Every change is either a code comment or a documentation/tracker update; the one governance ambiguity (F9b) is explicitly flagged for Founder decision rather than silently resolved either direction.

## 24. Deferred Matters

- F9b (error-category governance gap) — Founder decision required, see §25.
- F10 (Rules defense-in-depth) — non-urgent, accepted deferred risk.
- F11 (RTM synchronization) — deferred to a dedicated future governance task, disposition unchanged from the original review.
- F5's underlying rename (naming-consistency task `ENG-P2-001-NAMING-001`) — deferred; only documentation applied here.

## 25. Founder Decisions Required

**F9b only.** The governed TRD11 §11.35 closed error-category set (14 categories) has no dedicated "resource/state conflict" category distinct from the idempotency-key-scoped `IDEMPOTENCY_CONFLICT`. Several identity-domain error factories (`duplicateCustomerIdentityError`, `duplicateAuthenticationReferenceError`, `duplicateTrustReferenceError`, `authenticationReferenceLinkedToDifferentIdentityError`) use `VALIDATION_FAILED` for what are substantively state conflicts, not malformed-input validation failures. Two options exist, neither chosen by this task: (1) extend TRD11 §11.35 with a new governed category (e.g. `RESOURCE_CONFLICT`) via a dedicated, versioned error-contract task; or (2) formally ratify `VALIDATION_FAILED` as the accepted category for this class of conflict and close F9b as "accepted as-is" by Founder decision. No production caller currently depends on the distinction (no live Phase 2 traffic exists), so there is no urgency risk in leaving this open.

## 26. Rollback Instructions

`git revert` of this task's commit, or discard the branch — not yet merged. Purely additive/documentation (code comments, one Findings Register update, one Master Workflow update); no data, deployment, executable-code, or live configuration affected either way.

## 27. Markdown Correction Report

This document.

## 28. Architecture Review Report Updates

F5–F11 entries updated in place (bracket-marker convention, original text struck through and preserved, not deleted) recording each disposition and linking to this report. The Correction Plan table (§11 of that report) is preserved verbatim as historical record, with one addended status note. F1–F4 remain `[CORRECTED]`, untouched by this task.

## 29. IMPLEMENTATION_CHANGES.md Update

Entry appended below this report's own commit.

## 30. Documentation Changes-Log Update

Entry appended below this report's own commit.

## 31. Persistent Task-Level Markdown Record

This report is the persistent task-level record (§27 satisfies §31 — no separate document required by this task's own brief).

## 32. PR Details

See the completion report delivered in chat for PR number, branch, head SHA, mergeability, CI status, and unresolved-thread count (recorded after the PR is opened, per the task's own required sequencing).
