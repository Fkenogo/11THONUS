# ENG-P3-001C — Business Classification Reference Validation Integration

## 1. Entry state (Phase A)

- `git fetch origin` confirmed `origin/main` at `1ed943c815202103174d71cc758b315df81f9026`.
- Branch `eng-p3-001c` created from `origin/main` at that exact SHA (`git checkout -B eng-p3-001c origin/main`).
- `ENG-P3-001A` (PR #144, merge `43eb962d9681904b1e22b84d4a329ee2739f771c`) and `ENG-P3-001B` (PR #146, merge `449717186f4666868586ff7b077795abe51a0bf9`) and both closure-sync PRs (#145, #147) confirmed **MERGED** via `gh pr list --repo Fkenogo/11THONUS --state all`.
- `gh pr checks 144/145/146/147`: all four **`pass`** ("Build, Lint, Test, Emulator Validation").
- `gh pr list --state all` (full history sweep) and `git branch -r`: no open PR, no closed-unmerged PR, and no remote branch for `ENG-P3-001C`/`002`/`003` — no overlapping work found.
- `functions/src/domains/commerceKnowledge/repositories/*` and `functions/src/domains/commerceKnowledge/models/*` read directly (not assumed): `knowledgeNodeRepository.ts`, `referenceEligibility.ts`, `knowledgeNode.ts`, `knowledgeNodeType.ts`, `commerceKnowledgeErrors.ts`, `knowledgeNodeDocument.ts`.
- `functions/src/domains/business/*` read directly: `businessBootstrap.ts`, `business.ts`, `businessErrors.ts`, `businessRepository.ts`, `businessBootstrapEndpointService.ts`, `businessProfileCommand.ts`.
- `functions/src/domains/permissions/service/authorizeAndExecute.ts` read directly — the transaction-phase ordering this task's TOCTOU argument depends on.
- No material divergence found between the pre-verified entry description and the actual repository state. No Phase A STOP condition triggered.

## 2. Scope authorization

Founder-authorized `ENG-P3-001C` only: integration of authoritative Commerce Knowledge validation into Business classification references (create + profile-update paths). Explicitly **not** authorized and **not touched**: Commerce Knowledge taxonomy content, new seed records, Reward Program Category/Product/Service mapping, French taxonomy content, Business onboarding UI, Knowledge Studio, search, new permission identifiers, Firestore Rules, deployment, `ENG-P3-002`, `ENG-P3-003`.

## 3. Pre-implementation strategy (stated before coding, Phase B)

- **Where validation belongs**: a single new module, `functions/src/domains/business/services/businessClassificationValidation.ts`, taking a caller-owned `Transaction` — never opening its own — so its reads always participate in the caller's own atomic write boundary.
- **Which Business commands consume it**: `bootstrapBusiness` (`businessRepository.ts`, the create path) and `updateBusinessProfileCommand`'s `prepare` phase (`businessProfileCommand.ts`, the profile-update path). No other Business command touches `primaryCategoryId`/`businessTypeId`.
- **Which Commerce Knowledge reads are authoritative**: a single new read-only repository function, `getKnowledgeNodeInTransaction` (`knowledgeNodeRepository.ts`), added because no existing repository export took a caller-supplied `Transaction` for a single-node lookup — `getKnowledgeNodeById` is non-transactional, and `resolveHierarchyPlacement`/`validateReplacementNode` do more than a plain lookup. Node hierarchy (`parentId`) is read directly from the persisted document — never inferred from id naming conventions.
- **What is validated at create time**: `primaryCategoryId` always; `businessTypeId` only if present. Both against `isEligibleForNewReference` (001A, reused unmodified — active only).
- **What is validated at profile-update time**: only when the patch actually supplies `primaryCategoryId` and/or `businessTypeId` — validated as the *merged* resulting pair (the same merge `updateBusinessProfile` performs for these two fields), so a category change that would leave a stale, incompatible `businessTypeId` in place is rejected.
- **What remains outside 001C**: any change to Commerce Knowledge taxonomy content or seed data; Reward Program Category/Product/Service mapping; French taxonomy content; onboarding UI/Knowledge Studio/search; any permission-catalogue change.

No conflict was found between this strategy and the actual merged 001A/001B contracts. No Phase B STOP condition triggered.

## 4. Phase C — current gap reproduction (genuine RED evidence)

Rather than write one throwaway demonstration test, the actual defect was reproduced by wiring the validation into `bootstrapBusiness` first and running the full, **unmodified** emulator suite (`pnpm emulators:validate`) against it. Result: **61 pre-existing tests failed**, across four files (`businessRepository.emulator.test.ts`, `businessProfileLifecycle.emulator.test.ts`, `staffInvitation.emulator.test.ts`, `staffMembershipIntegration.emulator.test.ts`), every failure the identical error:

```
BusinessDomainError: primaryCategoryId "cat_food" does not resolve to an existing Commerce Knowledge node.
```

This is direct, genuine proof that — before this task — every one of these pre-existing, previously-passing test suites was creating real Businesses with `primaryCategoryId = "cat_food"`, a string that resolved to **no Commerce Knowledge node whatsoever**, and the create path accepted it silently. This is the live defect the task asked to prove, reproduced through the real emulator-backed create path, not by source inspection alone.

The fixtures were then corrected (§8) — a legitimate, expected consequence of closing a real gap those tests were unknowingly relying on — and the suite returned to green.

## 5. Files added

```
functions/src/domains/business/services/businessClassificationValidation.ts
functions/src/domains/business/services/businessClassificationValidation.emulator.test.ts
```

## 6. Files modified

- `functions/src/domains/commerceKnowledge/repositories/knowledgeNodeRepository.ts` — additive: one new function, `getKnowledgeNodeInTransaction`.
- `functions/src/domains/business/models/businessErrors.ts` — additive: seven new error factories (`primaryCategoryNotFoundError`, `primaryCategoryInvalidTypeError`, `primaryCategoryNotEligibleError`, `businessTypeNotFoundError`, `businessTypeInvalidTypeError`, `businessTypeNotEligibleError`, `businessTypeCategoryMismatchError`), all mapped onto the existing closed `ErrorCategory` taxonomy.
- `functions/src/domains/business/repositories/businessRepository.ts` — one call to `validateBusinessClassificationReferences` inserted into `bootstrapBusiness`'s transaction, after the businessCode-reservation reads and before any write.
- `functions/src/domains/business/services/businessProfileCommand.ts` — the same validation call inserted into `updateBusinessProfileCommand`'s `mutation.prepare` phase, conditional on the patch touching either classification field.
- `eslint.config.js` — the two new files added to the pre-existing `business/**` no-`firebase-admin` carve-out list (same precedent already covering `businessRepository.ts`/`businessProfileCommand.ts`/etc. — not a new exception category).
- Four pre-existing emulator test files updated to seed a real, test-local, active `business_category` Commerce Knowledge fixture (`cat_food` under a new `ind_test` industry) instead of relying on an unvalidated placeholder string: `businessRepository.emulator.test.ts`, `businessProfileLifecycle.emulator.test.ts`, `staffInvitation.emulator.test.ts`, `staffMembershipIntegration.emulator.test.ts`. Each seed is guarded by an existence check (`knowledgeNodes` is not cleared between emulator test *files* on the one shared emulator instance) so re-seeding across files never races/conflicts.
- `docs/05-implementation/change-tracking/engineering-implementation-programme.md` — one appended `[UPDATED 2026-08-21]` note (Capability 3 / `ENG-P3-001` row), matching the existing append-only convention.

## 7. Validation module design

```ts
export async function validateBusinessClassificationReferences(
  transaction: Transaction,
  db: Firestore,
  input: { primaryCategoryId: string; businessTypeId?: string },
): Promise<void>
```

- Reads `primaryCategoryId` via `getKnowledgeNodeInTransaction`. Rejects: not found (`RESOURCE_NOT_FOUND`), wrong `nodeType` (`VALIDATION_FAILED`), not `isEligibleForNewReference` (`VALIDATION_FAILED` — covers `draft`/`in_review`/`retired`/`archived` uniformly, since `isEligibleForNewReference` is `status === "active"` only).
- If `businessTypeId` is `undefined`, returns successfully — no second read, no error. This is a first-class supported path, not an edge case (Phase F, §9 below).
- Otherwise reads `businessTypeId` the same way. Rejects: not found, wrong `nodeType`, not eligible, and — the one check unique to this module — `businessType.parentId !== input.primaryCategoryId` (`businessTypeCategoryMismatchError`), read directly from the persisted document's own `parentId` field, never inferred from id naming.
- Throws (never returns a result union) on any violation — the caller's transaction aborts on any thrown error, guaranteeing no partial Business write.

## 8. Test fixture strategy (Phase P discipline)

No governed seed manifest (`burundiPilotSeedManifest.ts`) was touched. Every fixture in this task — including the four corrected pre-existing files — was created through the Commerce Knowledge repository's own `createKnowledgeNodePersisted`/`transitionKnowledgeNodeStatusPersisted`/`retireKnowledgeNodePersisted` functions, scoped to each test file, exactly as the task requires. The one deliberately-malformed document (Phase N item 15) was written directly to Firestore, bypassing every repository construction guarantee, specifically to simulate corrupted existing data — the one legitimate reason to bypass the repository's own constructors in a test.

## 9. Phase F — businessTypeId optionality re-confirmed

`TRD10 §10.6.3` (`docs/02-technical/trd/10-firestore-data-architecture.md:324`) declares `businessTypeId?: string` verbatim — optional in the governing schema itself, matching `business.ts`'s own `CreateBusinessParams`/`Business` type (already optional, unchanged by this task). No new mandatory-type rule was invented. `validateBusinessClassificationReferences` treats `businessTypeId === undefined` as a fully valid, first-class input — Phase N item 9 (`active category + no businessTypeId -> PASS`) is a direct, passing test of this.

## 10. Phase G/H — integration points

**Create (`bootstrapBusiness`, `businessRepository.ts`)**: the validation call sits inside the existing single Firestore transaction, after the businessCode-reservation read loop (still read-only at that point) and before the first `transaction.set`. No new transaction was opened; `ENG-P2-002B`'s existing transaction/repository pattern was reused unmodified — no redesign.

**Profile update (`updateBusinessProfileCommand`, `businessProfileCommand.ts`)**: the validation call sits inside `authorizeAndExecute`'s existing `mutation.prepare` phase, which — per `authorizeAndExecute.ts`'s own documented phase ordering (Phase 1 authorization reads/evaluation → **Phase 2 `prepare`, read-capable, only on allow** → Phase 3 sensitive-decision audit write → Phase 4 `apply`, write-only) — runs strictly before any write in the same transaction. Only triggered when the patch actually supplies `primaryCategoryId` and/or `businessTypeId`; an update that never touches classification never re-reads Commerce Knowledge at all (proven by a dedicated test, §12).

Category-change/type-mismatch handling (Phase H's specific concern): the *merged* resulting `(primaryCategoryId, businessTypeId)` pair is what gets validated — not the patch fields in isolation — so a category change that would leave a stale, now-incompatible `businessTypeId` untouched by the patch is rejected as a mismatch, not silently persisted.

**Phase H STOP-condition disposition**: "what happens to `businessTypeId` on an incompatible category change" is genuinely unspecified by any governing source found (`ENG-P3-001-DESIGN-001`, TRD10, the Commerce Knowledge Standard) — no auto-clear policy is invented. Per the task's own explicit permitted fallback, this is implemented as a hard validation-error rejection (the caller must submit a consistent pair), reported here rather than silently resolved.

## 11. Phase I — existing references untouched

`isResolvableForExistingReference` (001A) is never called from this module — 001C only ever validates *new* writes (create, and the fields a profile-update patch actually supplies), never re-validates an already-persisted Business's stored `primaryCategoryId`/`businessTypeId`. Proven directly: Phase N item 17 creates a Business against an active category, retires that category afterward, and asserts the Business document is still readable with its original `primaryCategoryId` unchanged — no re-validation, no rewrite, no error.

## 12. Phase J — replacement-node semantics not resolved here

`replacementNodeId` is never read or consulted by this module. A retired node's `replacementNodeId` is resolution/history metadata (001B's own domain); this task does not implement automatic substitution of a retired reference with its replacement on a new write, because no governing source explicitly requires it (checked directly in `ENG-P3-001-DESIGN-001` — no such requirement found). Phase N item 7 (retired category on a new write) asserts rejection, not silent substitution.

## 13. Phase K — error taxonomy

Seven new `BusinessDomainError` factories, all mapped onto the pre-existing 14-category `ErrorCategory` taxonomy — no fifteenth category introduced:

| Condition | Category |
|---|---|
| `primaryCategoryId` not found (or malformed document) | `RESOURCE_NOT_FOUND` |
| `primaryCategoryId` wrong `nodeType` | `VALIDATION_FAILED` |
| `primaryCategoryId` not `active` | `VALIDATION_FAILED` |
| `businessTypeId` not found (or malformed document) | `RESOURCE_NOT_FOUND` |
| `businessTypeId` wrong `nodeType` | `VALIDATION_FAILED` |
| `businessTypeId` not `active` | `VALIDATION_FAILED` |
| `businessTypeId`/`primaryCategoryId` hierarchy mismatch | `VALIDATION_FAILED` |

"Malformed Commerce Knowledge document" is not a distinct category — it is folded into "not found," matching `getKnowledgeNodeInTransaction`'s own documented contract, which itself mirrors `resolveHierarchyPlacement`'s pre-existing precedent in `knowledgeNodeRepository.ts` (that function does not distinguish "missing" from "corrupted" either). No raw Firestore error is ever surfaced — every path returns a `BusinessDomainError`.

## 14. Phase L — authorization boundary

No new permission identifier was created. `functions/src/domains/permissions/` is untouched (confirmed via `git diff --stat` against `origin/main` — zero files in that directory changed). The create path's authority remains the existing bootstrap-eligibility check (`ELIGIBLE_OWNER_IDENTITY_STATUSES`, unmodified); the profile-update path's authority remains the existing `business.updateProfile` permission evaluated by `authorizeAndExecute` (unmodified). `validateBusinessClassificationReferences` performs Commerce Knowledge reads only — no write, no evaluator call, no new gate.

## 15. Phase M — tenant/global boundary re-proven

`git diff` confirms: no field named `businessId` was added to `KnowledgeNode` or any Commerce Knowledge model; no Commerce Knowledge document is copied into any Business collection; `Business` stores only the two id-string references it already stored (`primaryCategoryId: string`, `businessTypeId?: string` — both pre-existing fields, unchanged shape). `businessClassificationValidation.ts` only ever reads `knowledgeNodes/{id}` and never writes to it.

## 16. Phase N — required test matrix (all 20 items + extras)

New file: `functions/src/domains/business/services/businessClassificationValidation.emulator.test.ts`, real Firebase Emulator Suite, **22/22 passing**:

1. valid active Business Category, no `businessTypeId` → PASS
2. nonexistent category → reject (`RESOURCE_NOT_FOUND`)
3. Industry id used as category → reject (`VALIDATION_FAILED`)
4. Business Type id used as category → reject (`VALIDATION_FAILED`)
5. draft category → reject
6. in_review category → reject
7. retired category → reject for new write
8. archived category → reject for new write
9. active category + no `businessTypeId` → PASS
10. active category + valid child Business Type → PASS
11. nonexistent Business Type → reject
12. wrong-type node (a Business Category) used as Business Type → reject
13. inactive (draft) Business Type → reject
14. Business Type under a different category → reject
15. malformed persisted Business Type document → fails closed
16. missing French translation does not reject an otherwise-valid canonical reference (no `KnowledgeTranslation` document exists at all in this fixture set — the test's success is the proof)
17. existing Business with a later-retired category remains readable
18. profile update to a valid category/type pair → PASS
19. profile update to an invalid category/type → reject, no partial write
20. category change creating a type mismatch → reject, no partial write

Plus: "no partial Business write on a rejected create," and "a profile update that never touches classification never re-reads Commerce Knowledge."

## 17. Phase O — transaction/TOCTOU review (read carefully — per the task, this is the most important section)

**Question**: can a Commerce Knowledge node's `status` change between validation and the Business write it guards?

**Answer, verified directly against the actual code (not assumed)**:

- `bootstrapBusiness` (`businessRepository.ts`): the entire function body — businessCode reservation reads, the new classification-validation reads, `buildBootstrapBusinessInput`, and every `transaction.set` — executes inside **one** `db.runTransaction(...)` call. Firestore transactions provide snapshot isolation: every read inside a transaction observes a single consistent point-in-time view, and the whole transaction commits or aborts atomically. Because the classification-validation reads and the Business/Branch/Membership/reservation/outbox writes are all inside the same transaction, there is no window between "validated" and "written" in which an external actor's own transaction could retire the just-validated node and have that retirement land in between — Firestore's optimistic-concurrency contention detection would instead force this transaction to retry from scratch against fresh reads if the read set were invalidated by a concurrent commit, and the read set here explicitly includes the `knowledgeNodes/{id}` document being validated (via `transaction.get`, not a bare `db.collection(...).get()`).
- `updateBusinessProfileCommand` (`businessProfileCommand.ts`) via `authorizeAndExecute.ts`: `mutation.prepare` — where the classification-validation call now lives — receives the same `Transaction` object `authorizeAndExecute`'s own authorization reads and the later `mutation.apply` write both use, and Phase 2 (`prepare`) is documented and confirmed (by reading the function body directly) to run strictly before Phase 3/4 (the audit write and the protected mutation write), all inside the one `db.runTransaction(...)` `authorizeAndExecute` opens. Same argument applies.

**Conclusion**: same-transaction reads were achievable in both integration points using the existing transaction model exactly as it already exists — no new architecture decision was required, and Firestore transactions do support cross-collection reads from any collection inside one transaction (confirmed directly: `resolveHierarchyPlacement` in the already-merged `knowledgeNodeRepository.ts` already reads `knowledgeNodes` documents inside a transaction opened by a Business-adjacent caller pattern; this task's `getKnowledgeNodeInTransaction` follows the identical shape). This satisfies the task's stated preference ("prefer that — validate inside the same transaction that writes the Business document, so it's atomic") without any hand-waving: both the read and the write are provably part of one atomic unit, and Firestore's own transaction-retry semantics — not application code — is what protects against a lost concurrent update to the read set.

No Phase O STOP condition was triggered; no new architecture decision was required.

## 18. Phase Q — completion effect

If this PR merges cleanly: `ENG-P3-001A` = Complete, `ENG-P3-001B` = Complete, `ENG-P3-001C` = Complete. The `ENG-P3-001` concern itself can reasonably be assessed **Complete**, subject only to the explicitly-deferred Commerce Knowledge content-expansion items already reported by `ENG-P3-001B` (Reward Program Categories, Standard Products/Services, French glossary, additional Business Types beyond Salon) — none of which block classification-reference validation from functioning correctly against whatever content does exist. Capability 3 is **not** automatically closed by this task — that remains a distinct Founder decision (Capability 3 spans more than `ENG-P3-001`), and `ENG-P3-002`/`ENG-P3-003` remain untouched, separate concerns.

## 19. Phase S — independent self-review

A fresh review pass of the diff (as if reviewing someone else's work), checking every item the task names:

- **No arbitrary IDs accepted**: confirmed by Phase N items 2/3/4/11/12/15 (nonexistent, wrong-type-as-category, wrong-type-as-businessType, nonexistent businessType, wrong-type-as-businessType, malformed-document) — all reject.
- **Type/category relationship enforced**: confirmed by item 14 (`businessType.parentId` read from the actual persisted document, compared against `primaryCategoryId` — not inferred from naming).
- **Inactive nodes rejected for new writes**: confirmed by items 5/6/7/8/13 (draft/in_review/retired/archived category, and inactive-draft business type).
- **Translation status irrelevant to canonical validity**: confirmed by item 16 — no `KnowledgeTranslation` document exists anywhere in this fixture set, and the reference still validates successfully; the validation module never imports or reads the translation repository at all (`git diff` confirms no such import was added).
- **No tenant leakage**: confirmed (§15) — no `businessId` field added anywhere in Commerce Knowledge, no document copying.
- **No seed expansion**: confirmed — `git diff --stat` shows `burundiPilotSeedManifest.ts` untouched.
- **No permission change**: confirmed — `functions/src/domains/permissions/` untouched.
- **No UI/search/Studio work**: confirmed — no `apps/web` files touched.
- **Transaction consistency credible**: §17 above, verified against actual transaction-phase code, not asserted.
- **No partial Business write possible on any rejection path**: every validation call is a plain `throw` inside a function that runs strictly before any `transaction.set`/`writer.set` call in both integration points — a thrown error aborts the enclosing `db.runTransaction` entirely (Firestore's own guarantee: a transaction callback that throws commits nothing). Directly tested (Phase N's "no partial write" tests, items 19/20).

No defect was found during this review pass requiring a fix.

## 20. Full validation results

- Focused emulator suite (`businessClassificationValidation.emulator.test.ts`, isolated run): **22/22 passing**.
- `pnpm --filter functions test` (unit): **1420/1420 passing**, 141 files.
- `pnpm emulators:validate` (full Firebase Emulator Suite): **612/612 passing**, 45 files — two consecutive clean full runs (a third run mid-development hit two isolated, full-suite-load-only timing failures — see §21 — both confirmed to pass cleanly in file-level isolation, and both final full runs after that were clean).
- `pnpm --filter web test`: **397/397 passing**, 51 files (unaffected by this backend-only change; run for completeness per the task's required validation list).
- `pnpm typecheck` (both workspaces): clean.
- `pnpm lint`: clean (after adding the two new files to the pre-existing `eslint.config.js` `business/**` firebase-admin carve-out, matching precedent exactly).
- `pnpm format:check`: clean (after one `prettier --write` pass on two files this task authored).
- `pnpm build` (both workspaces): clean (pre-existing `apps/web` chunk-size warning only, unrelated to this change).
- Manual secret-pattern scan (`git diff` + new files, grepped for API-key/secret/password/private-key/token/AIza/sk_live/sk_test patterns): clean.
- No Firebase deployment performed. No Firestore/Storage Rules file touched.

## 21. Observed flakes — reported, not silently absorbed

During full-suite runs, two timing-sensitive failures were observed, neither reproducible in file-level isolation:

1. `businessRepository.emulator.test.ts` → "handles concurrent same-key, same-request calls without creating duplicate side effects" — timed out at the default 5000ms vitest test budget once under full 45-file/612-test sequential-file load against the one shared emulator instance. Passed cleanly (11/11) run in isolation.
2. `authorizeAndExecute.emulator.test.ts` → a concurrent-write race-count assertion (`touchedCount`) observed `3` instead of the expected `2` once under the same full-suite load. This file was **not modified by this task at all** — passed cleanly (22/22) run in isolation.

Both are instances of the pre-existing, already-Founder-registered backlog item `ENG-CI-001` ("Firebase Emulator CI Stabilisation — investigate and resolve the recurring `functions/` real-Firestore-emulator concurrency-test timing flake... without changing application behaviour," `docs/05-implementation/change-tracking/engineering-implementation-programme.md` §C.1) — a known, tracked, pre-existing condition, not a regression this task introduced. No application code was changed to paper over either flake; both are reported here as observed evidence, matching the task's "report, don't invent" discipline.

## 22. STOP conditions encountered

One, in Phase H: whether an incompatible category/type combination on profile update should auto-clear `businessTypeId` is genuinely unspecified by any governing source found. Disposed per the task's own explicit permitted fallback — implemented as a hard rejection requiring a consistent pair, not an invented auto-clear policy. See §10 above. No other STOP condition was triggered; every other phase's requirements were fully implementable from the already-governed sources found.

## 23. Explicitly out of scope (confirmed untouched)

Commerce Knowledge taxonomy content, new seed records, Reward Program Category/Product/Service mapping, French taxonomy content, Business onboarding UI, Knowledge Studio, search, new permission identifiers, Firestore Rules, deployment, `ENG-P3-002`, `ENG-P3-003`. Confirmed via `git diff --stat` against `origin/main`: only `functions/src/domains/business/`, `functions/src/domains/commerceKnowledge/repositories/knowledgeNodeRepository.ts`, `functions/src/domains/permissions/service/*.emulator.test.ts` (test fixtures only, not production permission code), `eslint.config.js`, and this docs pair were touched.
