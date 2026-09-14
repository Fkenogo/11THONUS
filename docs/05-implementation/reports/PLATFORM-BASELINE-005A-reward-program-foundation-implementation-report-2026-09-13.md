# PLATFORM-BASELINE-005A — Reward Program Foundation — Implementation Report

**Date:** 2026-09-13
**Authority:** `PLATFORM-BASELINE-005` design report + `CORR-001` + `FOUNDER-DISPOSITION-001` + `REVIEW-FINDINGS-001` (all merged, PR #250).
**Status:** CORRECTED / AWAITING INDEPENDENT RE-REVIEW (superseded by `PLATFORM-BASELINE-005A-CORR-001`, see the appended section below).

## 1. Entry origin/main SHA

`f955bcebbea673291422c16a3ad4a43ab2ba3b26` (`origin/main`, fetched fresh — the `PLATFORM-BASELINE-005` design PR #250 merge commit). Confirmed unchanged before starting.

## 2. Worktree/branch state

Isolated worktree `/private/tmp/11thonus-pb005a`, branch `feat/platform-baseline-005a-reward-program-foundation`, created from `origin/main` at the SHA above. The primary worktree (`/Volumes/PRODUCTION/Projects/11THONUS`, in-progress `docs/dec-legal-002-bt-draft-007` legal work) was never touched, stashed, reset, or committed.

## 3. Implementation strategy

Before writing code, inspected the actual current codebase (not the design report alone) for every seam this package needed to reuse:

- `functions/src/infrastructure/postgres/{postgresConfig,postgresPool,postgresTransaction,migrationRunner}.ts` — the exact transaction/migration primitives to build on, unmodified.
- `functions/src/domains/permissions/evaluator/evaluatePermission.ts` and both existing catalogues — confirmed the evaluator classifies only `sensitive`/`ordinary`/`unknown` and denies everything else, exactly as `PLATFORM-BASELINE-005-REVIEW-FINDINGS-001`'s RF-1 finding described — the evaluator genuinely needed the three-branch addition the design's correction specified, not an assumption.
- `functions/src/domains/commerceKnowledge/{repositories/knowledgeNodeRepository,models/referenceEligibility,models/knowledgeNodeType}.ts` — reused unmodified for Commerce Knowledge validation.
- `functions/src/domains/permissions/repositories/businessMembershipRepository.ts` (`getBusinessMembershipByUserAndBusiness`) — reused unmodified for membership-gated reads (no `rewardProgram.view` permission, per RF-1/`REVIEW-FINDINGS-001`'s permission-model correction).
- `functions/src/index.ts`'s existing whitelist-parser/`resolveAuthenticatedBusinessActor`/`toHttpsError` conventions — mirrored exactly for the six new callables.
- `apps/web/src/business/api/businessCallableClient.ts` (`toCallWithActor`), `apps/web/src/business/hooks/businessMutations.ts` (`createIdempotencyKeyHolder`, `settleKeyOnError`) — reused unmodified.

No material contradiction was found between the current codebase and the approved, merged design — the only gap the design's own `REVIEW-FINDINGS-001` had already flagged (the evaluator needing a new branch) was implemented exactly as that correction specified.

## 4. Existing code reused

| Item | Classification | Notes |
|---|---|---|
| `postgresPool.ts`/`postgresTransaction.ts`/`postgresConfig.ts` | PRESERVE | Unmodified; `withPlatformTransaction` is the sole entry point every Reward Program write uses |
| `migrationRunner.ts` | PRESERVE | Unmodified; first real product migrations applied through it |
| `evaluatePermission.ts` | PRESERVE + ADAPT | Three-branch addition (classification, per-class eligibility gate, role-default resolution) — structural copy of the existing ordinary-permission branch, no new algorithm |
| `ordinaryPermissionCatalogue.ts`/`sensitivePermissionCatalogue.ts` | PRESERVE | Unmodified — the new `rewardProgramPermissionCatalogue.ts` is a disjoint third module, not an addition to either |
| `permissionErrors.ts` | PRESERVE + ADAPT | Two new error factories added (`unrecognisedRewardProgramPermissionError`, `permissionCannotBeInMultipleCataloguesError`), nothing existing changed |
| `commerceKnowledge/repositories/knowledgeNodeRepository.ts` (`getKnowledgeNodeById`) | PRESERVE | Unmodified |
| `commerceKnowledge/models/referenceEligibility.ts` (`isEligibleForNewReference`) | PRESERVE | Unmodified, reused exactly for publish-time and add-time validation |
| `resolveAuthenticatedBusinessActor` | PRESERVE | Unmodified — every callable resolves the actor the same way every other Business-domain callable does |
| `businessCallableClient.ts`/`idempotencyKeyHolder.ts`/`businessMutations.ts`'s `settleKeyOnError` | PRESERVE | Unmodified, reused by the new web hooks |
| `BusinessDashboardRoutes.tsx`/`BusinessDashboardShell.tsx` | PRESERVE + ADAPT | One new `<Route>` and one new nav item added; nothing else changed |
| `formPrimitives.tsx` (`Button`/`TextField`/`Checkbox`) | PRESERVE | Unmodified UI primitives, no new dependency |

Nothing was retired — no prior Reward Program implementation existed anywhere in the repository (confirmed by exhaustive search before starting, matching `PLATFORM-BASELINE-005`'s own finding).

## 5. Files modified

**Modified (12):**
`apps/web/src/business/dashboard/BusinessDashboardRoutes.tsx`, `apps/web/src/business/dashboard/BusinessDashboardShell.tsx`, `apps/web/src/business/hooks/queryKeys.ts`, `apps/web/src/i18n/locales/en.ts`, `apps/web/src/i18n/locales/fr.ts`, `functions/src/domains/permissions/evaluator/evaluatePermission.ts`, `functions/src/domains/permissions/evaluator/evaluatePermission.test.ts`, `functions/src/domains/permissions/models/permissionErrors.ts`, `functions/src/index.ts`, `functions/src/index.test.ts`, `functions/src/infrastructure/postgres/migrations/README.md`, `functions/src/infrastructure/postgres/platformFoundationReadiness.postgres.test.ts` (updated to reflect the shipped migrations directory no longer being empty).

**Added (23):**
- `functions/src/infrastructure/postgres/migrations/000{1..5}_*.sql` + matching `.down.sql` (10 files)
- `functions/src/infrastructure/postgres/rewardProgramMigrations.postgres.test.ts`
- `functions/src/domains/permissions/models/rewardProgramPermissionCatalogue.ts`
- `functions/src/domains/rewardProgram/models/{rewardProgram,rewardProgramErrors}.ts`
- `functions/src/domains/rewardProgram/repositories/{rewardProgramRepository,idempotencyRepository,rewardProgramOutboxRepository}.ts`
- `functions/src/domains/rewardProgram/services/{createRewardProgramCommand,updateRewardProgramDraftCommand,publishRewardProgramVersionCommand,createNextRewardProgramVersionCommand,rewardProgramQueries,rewardProgramAuthorization,rewardProgramKnowledgeValidation,rewardProgramRequestHash}.ts`
- `functions/src/domains/rewardProgram/services/rewardProgramCommands.postgres.test.ts`
- `apps/web/src/business/api/rewardProgramMutations.ts`
- `apps/web/src/business/hooks/{rewardProgramMutations,rewardProgramQueries}.ts`
- `apps/web/src/business/dashboard/RewardProgramManagementPage.tsx` (+ `.test.tsx`)
- This report.

No file outside this list was touched. No decision-register modification. No Firebase Rules change.

## 6. PostgreSQL migrations added

Five migrations (the first real product schema this codebase's migration runner has ever applied — `PLATFORM-BASELINE-001` shipped the directory empty):

1. `0001_create_reward_programs` — `reward_programs` table (no FK on `current_version_id` yet — circular dependency, resolved in 0002).
2. `0002_create_reward_program_versions` — `reward_program_versions` table + the deferred `reward_programs.current_version_id` FK.
3. `0003_create_reward_program_version_qualifying_nodes` — junction table.
4. `0004_create_idempotency_keys` — generic, cross-domain-reusable PostgreSQL idempotency infrastructure.
5. `0005_create_reward_program_outbox` — domain-scoped transactional outbox.

Every migration has a `.down.sql` rollback (proven in `rewardProgramMigrations.postgres.test.ts`).

## 7. Final schema

**`reward_programs`:** `id UUID PK`, `business_id TEXT` (opaque Firestore ref, indexed), `display_name TEXT`, `reward_program_category_id TEXT` (opaque Firestore ref), `shared_loyalty_number_allowed BOOLEAN` (current-value projection only — see §11), `status TEXT CHECK (draft|active|paused|retired|archived)`, `current_version_id UUID NULL FK`, `created_at/created_by/updated_at/updated_by`, `schema_version`.

**`reward_program_versions`:** `id UUID PK`, `reward_program_id UUID FK`, `version INTEGER`, `required_verified_units INTEGER CHECK (=10)`, `reward_quantity INTEGER CHECK (=1)`, `shared_loyalty_number_allowed BOOLEAN` (authoritative — §11), `reward_description TEXT`, `standard_reward_node_id TEXT NULL`, `multiple_units_allowed BOOLEAN`, `bulk_review_threshold INTEGER NULL`, `effective_from/effective_until`, `status TEXT CHECK (draft|active|superseded)`, `created_at/created_by/approved_at/updated_at`, `row_version INTEGER` (concurrency token — §9), `schema_version`.

**`reward_program_version_qualifying_nodes`:** junction, `(reward_program_version_id, knowledge_node_id)` composite PK, optional `business_display_name`.

**`idempotency_keys`:** generic (not Reward-Program-prefixed, so a future PostgreSQL-authoritative domain can reuse it) — `idempotency_key PK`, `operation_type`, `actor_id`, `request_hash`, `status CHECK (processing|completed|failed)`, `result_reference`, `response_snapshot JSONB`, `correlation_id`, `reserved_at/completed_at`.

**`reward_program_outbox`:** `id UUID PK`, `event_type`, `aggregate_type`, `aggregate_id`, `payload JSONB`, `actor_id`, `correlation_id`, `idempotency_key NULL`, `occurred_at`.

Table/column names are exactly the ones PROPOSED BY PLATFORM-BASELINE-005 (§8 of the design's `CORR-001`) — not inherited from any prior package.

## 8. Constraints/indexes

- `reward_programs.status`, `reward_program_versions.status` — `CHECK` closed enums.
- `reward_program_versions.required_verified_units = 10`, `.reward_quantity = 1` — `CHECK`, database-enforced (defense-in-depth alongside the `FIXED_REQUIRED_VERIFIED_UNITS`/`FIXED_REWARD_QUANTITY` code constants).
- `UNIQUE (reward_program_id, version)` — no duplicate version numbers.
- Partial `UNIQUE INDEX ... WHERE status = 'active'` — at most one active version per program, database-enforced.
- `reward_program_version_qualifying_nodes` composite PK — no duplicate node reference within one version.
- FKs: `reward_program_versions.reward_program_id → reward_programs.id` (`ON DELETE RESTRICT`), `reward_programs.current_version_id → reward_program_versions.id`, junction `→ reward_program_versions.id` (`ON DELETE CASCADE`).
- Indexes: `reward_programs(business_id)`, `reward_programs(business_id, status)`, `reward_program_versions(reward_program_id)`, `reward_program_version_qualifying_nodes(knowledge_node_id)`.

All proven directly against real PostgreSQL in `rewardProgramMigrations.postgres.test.ts` (constraint-violation tests, not mocks).

## 9. Versioning behavior

Program identity (`reward_programs.id`) is stable across every version. `reward_program_versions.id` is a separate, immutable-once-published identity. Version numbers are server-derived, monotonic per program (`createNextRewardProgramVersion` computes `baseVersion.version + 1`; no client-selected version number is ever accepted — proven by the mass-assignment test in `index.test.ts`). Publishing a version atomically (one PostgreSQL transaction) supersedes the prior active version, activates the new one, and updates `reward_programs.current_version_id` — the partial unique index makes "two simultaneously active versions" a database-level impossibility, not merely an application-layer promise.

Draft editing uses an integer `row_version` optimistic-concurrency counter (not `updated_at`) — a timestamp round-tripped through a JS `Date` loses the microsecond precision PostgreSQL's `now()` stores, which caused a genuine test failure during development (documented and fixed — see §32).

## 10. Fixed invariant enforcement

`requiredVerifiedUnits`/`rewardQuantity` are server-derived from `functions/src/config/loyaltyInvariants.ts`'s existing code constants (`REQUIRED_VERIFIED_UNITS_MVP`, `REWARD_QUANTITY_FIXED`) in every write command — never read from client input (the whitelist parsers in `index.ts` structurally exclude these fields) — and additionally enforced by database `CHECK` constraints. Proven by `index.test.ts`'s mass-assignment tests and `rewardProgramMigrations.postgres.test.ts`'s constraint-violation tests. The UI never renders either as an editable field (proven by `RewardProgramManagementPage.test.tsx`).

## 11. `sharedLoyaltyNumberAllowed` snapshot implementation

Per `PLATFORM-BASELINE-005-REVIEW-FINDINGS-001` (RF-2): authoritative, immutable per-version snapshot lives on `reward_program_versions.shared_loyalty_number_allowed`, set once at version creation. `reward_programs.shared_loyalty_number_allowed` is explicitly documented (in the migration SQL comment and the TypeScript model's doc comment) as a current-value convenience projection only — no command in this implementation reads it as historical authority; every command that needs the value in force for a specific version reads it from that version's own row.

## 12. Commerce Knowledge validation flow

`rewardProgramKnowledgeValidation.ts` reuses `getKnowledgeNodeById`/`isEligibleForNewReference` unmodified:
- **Draft creation/editing:** every newly-added or changed category/qualifying/reward-node reference must be `active` and of the correct governed type (`reward_program_category` for the category; `standard_product`/`standard_service` for qualifying and reward nodes).
- **Publish:** every reference on the version being published is re-validated as `active` via a fresh Firestore read, immediately before the PostgreSQL transaction begins (never inside it — see §13).
- **Historical read:** never re-validated; a published version remains interpretable forever regardless of later Commerce Knowledge changes.

## 13. Cross-store race contract

Exactly the `PLATFORM-BASELINE-005-REVIEW-FINDINGS-001` RF-3 contract, implemented in `publishRewardProgramVersionCommand.ts`: (A) authoritative Firestore validation read before the PostgreSQL transaction opens; (B) the PostgreSQL transaction atomically performs only PostgreSQL-side writes (version activation, supersession, pointer update, idempotency, outbox); (C) the Firestore read is never part of that transaction's conflict set; (D) the bounded race (a node retiring between the validation read and the PostgreSQL commit) is accepted, not hidden — a version validated at its publication point is never retroactively invalidated by a later retirement, proven directly in `rewardProgramCommands.postgres.test.ts` ("a historical published version remains valid after its qualifying node is later retired"). Described in every code comment and this report as "server-authoritative publish-time validation with a disclosed bounded cross-store race window" — never as distributed-atomic. No distributed transaction or lock was introduced.

## 14. Permission catalogue implementation

`rewardProgramPermissionCatalogue.ts` — a new, structurally separate third catalogue (same shape as `ordinaryPermissionCatalogue.ts`), exactly one entry: `rewardProgram.manage` (Owner: allow, Manager/Staff: deny, `eligibleBusinessStatuses: ["trial", "active"]`). A module-load-time invariant check rejects any id collision with either existing catalogue. No `rewardProgram.view` entry — reads are membership-gated only (§16).

## 15. Evaluator integration

`evaluatePermission.ts` gained the smallest possible third classification/authorization path, a structural copy of the existing ordinary-permission branch (per `REVIEW-FINDINGS-001`'s RF-1 disposition, exactly as specified):
1. `classifyPermission` returns `"rewardProgram"` when `isRewardProgramPermission` matches.
2. A per-class lifecycle-eligibility gate (mirrors the ordinary branch's own gate) denies `BUSINESS_INACTIVE` when the Business status isn't `trial`/`active`.
3. A role-default resolution branch (mirrors the ordinary branch's own logic exactly) allows only the Owner; everything else falls through unchanged to the existing `NO_APPLICABLE_GRANT` fail-closed fallthrough.

`permissionId.ts` needed **no** change — it validates shape only, not a closed enum (confirmed by direct reading; an earlier draft of this report incorrectly assumed otherwise and was corrected before implementation). Proven by 9 new evaluator unit tests (`evaluatePermission.test.ts`).

## 16. Business eligibility

Exactly the approved first-cut: `trial`/`active` only, enforced via the catalogue's `eligibleBusinessStatuses` inside the evaluator (§15) — not inferred or widened. `draft`, `pending_verification`, `suspended`, `expired`, `closed`, `archived` all deny `BUSINESS_INACTIVE`. Reads are membership-gated only (any active role, including Staff) — no `rewardProgram.manage` requirement for `getRewardProgram`/`listRewardPrograms`, matching the existing `getBusinessContext`/`listStaffMemberships` precedent exactly.

## 17. Commands implemented

Exactly the four approved commands, no generic dispatch endpoint:

| Command | Actor | Authorization | Idempotency | Audit/outbox |
|---|---|---|---|---|
| `createRewardProgram` | server-resolved | `rewardProgram.manage` | PG-transactional | `reward_program_created` |
| `updateRewardProgramDraft` | server-resolved | `rewardProgram.manage` | PG-transactional | none (draft edits aren't events) |
| `publishRewardProgramVersion` | server-resolved | `rewardProgram.manage` | PG-transactional, peek-before-precheck (see §32) | `reward_program_version_published` |
| `createNextRewardProgramVersion` | server-resolved | `rewardProgram.manage` | PG-transactional | `reward_program_version_draft_created` |

`pause`/`retire`/`archive` are **not implemented**, per `FOUNDER-DISPOSITION-001` FD-2.

## 18. Reads implemented

`getRewardProgram`/`listRewardPrograms` — membership-gated, no idempotency (reads aren't keyed), never mutate.

## 19. Idempotency implementation

`idempotencyRepository.ts` — every write command reserves, mutates, and completes an idempotency key inside **one** `withPlatformTransaction` call (never a separate follow-up write, unlike the Firestore pattern `PLATFORM-BASELINE-003-CORR-001`/`004A-CORR-001` had to correct). A consequence: no separate "fail" call is needed — a thrown command rolls back the whole transaction including the reservation row itself, so the next attempt observes "no existing record" (treated identically to a resolved "failed" record: retryable). Same-key/same-request replay returns the cached `response_snapshot`; same-key/different-request conflicts. Proven directly in `rewardProgramCommands.postgres.test.ts` (replay, conflict, and — for publish specifically — the peek-before-precheck fix in §32).

## 20. Audit/outbox implementation

`rewardProgramOutboxRepository.ts` — every event write happens inside the same transaction as its triggering mutation. Four event types implemented: `reward_program_created`, `reward_program_version_published`, `reward_program_version_draft_created` (draft edits are deliberately not events — mutable working state, not a durable business fact). No secrets/tokens in any payload (payloads carry only ids and version numbers).

## 21. UI implemented

`RewardProgramManagementPage.tsx`, mounted at `/business/:businessId/dashboard/reward-programs` (new nav item, new route, no redesign of the existing shell). List existing programs → create → configure/edit draft → publish → create next version, all on one bounded page (mirrors `TeamManagementPage.tsx`'s own single-page precedent). `requiredVerifiedUnits`/`rewardQuantity` are shown as fixed, read-only explanatory text, never an input. Role-based control visibility (Owner sees management actions, others don't) is convenience only — the server remains the sole enforcement point.

**Known simplification, disclosed:** qualifying-node/category/reward-node references are entered as raw Commerce Knowledge ids in a plain text field, not a searchable catalogue picker — building that picker component was judged out of scope for "minimal Business UI" (§25/§26 of the approved design explicitly warns against a large redesign). This is a real, usable surface for local Founder preview and for the automated test suite, but a production-quality catalogue picker is future work.

## 22. EN/FR changes

Full `rewardProgram` i18n namespace added to both `en.ts`/`fr.ts` with key parity (verified by the existing `i18n.test.tsx` parity test, unmodified, still passing). One new nav-label key (`dashboard.nav.rewardPrograms`) added to both locales.

## 23. Local preview method

Canonical Git (this worktree/branch) + Firebase Emulator Suite (Firestore, for Business/Membership/Commerce-Knowledge) + local PostgreSQL via the existing `docker-compose.postgres.yml` (`11thonus-pb004a-postgres-1`, already running throughout this session) + the existing `pnpm --filter web run dev` dev server (`VITE_USE_FIREBASE_EMULATOR=true`). No hosted preview, no Railway/Neon, no new fixture beyond what already exists (`seedTestOnlyTermsFixture.mjs` remains untouched and unused by this package — Reward Program's own tests seed their own Business/membership/Commerce-Knowledge fixtures directly via the existing emulator repository functions, exactly like every other domain's emulator test in this codebase).

## 24. Tests added

- `rewardProgramMigrations.postgres.test.ts` — 11 tests (discovery, bootstrap, idempotent re-run, rollback+reapply, 7 constraint-violation tests) against real PostgreSQL.
- `rewardProgramCommands.postgres.test.ts` — 13 cross-store integration tests (create/replay/conflict/deny paths, draft update + stale-concurrency rejection, publish + supersession + replay + double-publish rejection + invalid-node rejection + post-retirement historical-validity proof, create-next-version + simultaneous-draft rejection, membership-gated reads + cross-Business denial) against real PostgreSQL **and** the real Firestore Emulator together.
- `evaluatePermission.test.ts` — 9 new unit tests for the `rewardProgram.manage` evaluator branch (Owner allow/deny-by-status, Manager/Staff deny, override never honored, cross-Business deny, unauthenticated deny, unknown-permission fail-closed non-regression).
- `index.test.ts` — mass-assignment regression tests for all four write-command parsers.
- `RewardProgramManagementPage.test.tsx` — 10 RTL tests (loading/error/empty states, Owner-vs-Staff control visibility, fixed-field non-editability, create-form submission, publish-button wiring).
- `platformFoundationReadiness.postgres.test.ts` — updated (not new) to reflect the shipped migrations directory no longer being empty.

## 25. Commands executed

```
git fetch --all --prune && git rev-parse origin/main
git worktree add /private/tmp/11thonus-pb005a origin/main -b feat/platform-baseline-005a-reward-program-foundation
pnpm install
pnpm --filter functions typecheck / pnpm --filter web typecheck
pnpm run lint / pnpm run format:check / pnpm run format
pnpm --filter functions test  (unit)
pnpm --filter web test  (unit)
firebase emulators:exec --only firestore --project demo-11thonus "PLATFORM_ENV=test PLATFORM_POSTGRES_URL=... npx vitest run --config vitest.postgres.config.ts [rewardProgramMigrations|rewardProgramCommands|(full)]"
pnpm run emulators:validate  (full Firebase Emulator Suite)
pnpm run build
pnpm run test:e2e
docker exec 11thonus-pb004a-postgres-1 psql ... (test-database cleanup between iterative runs)
```

## 26. PostgreSQL integration results

`rewardProgramMigrations.postgres.test.ts` + `rewardProgramCommands.postgres.test.ts` together with the pre-existing `migrationRunner.postgres.test.ts`/`platformFoundationReadiness.postgres.test.ts`/`postgresTransaction.postgres.test.ts`: **5 files / 47 tests, all pass**, run fresh against a clean database via `firebase emulators:exec --only firestore ... vitest run --config vitest.postgres.config.ts`.

## 27. Emulator results

Full Firebase Emulator Suite validation (`pnpm run emulators:validate`, the entire functions codebase, not just the postgres-adjacent subset): **65 test files, 833 tests passed, 3 pre-existing skipped (836 total)**, exit code 0. Confirms the six new callables (`createRewardProgram`, `updateRewardProgramDraft`, `publishRewardProgramVersion`, `createNextRewardProgramVersion`, `getRewardProgram`, `listRewardPrograms`) initialize cleanly alongside every existing function and introduce zero regressions elsewhere in the suite.

## 28. Unit/web test results

`pnpm --filter functions test`: **158 files / 1736 tests, all pass** (1718 pre-existing + 18 new evaluator/index tests).
`pnpm --filter web test`: **110 files / 783 tests, all pass** (769 pre-existing + 14 new — 10 `RewardProgramManagementPage` + others incidental to the run).

## 29. Typecheck/lint/format/build

`pnpm --filter functions typecheck`: clean. `pnpm --filter web typecheck`: clean. `pnpm run lint`: 0 errors (1 pre-existing, unrelated warning). `pnpm run format:check`: clean. `pnpm run build`: clean (functions `tsc` + web `tsc -b && vite build`; only the pre-existing chunk-size warning).

## 30. Dependencies added

**None.** No new package in any `package.json`. Reused the existing `pg` driver, `withPlatformTransaction`, and every existing web/UI dependency.

## 31. Config changes

**None.** No environment variable, Firebase config, or Firestore Rules change.

## 32. Schema changes

See §7. Two implementation-time corrections worth recording explicitly (found and fixed during test-driven development, not left standing):
1. **Optimistic-concurrency field:** the original plan (per the merged design) used `updated_at` for draft-edit concurrency; a real test against PostgreSQL immediately proved this fails even with zero real concurrency, because a `TIMESTAMPTZ`'s microsecond precision does not round-trip through a JS `Date` (millisecond precision) losslessly. Corrected to an integer `row_version` counter before this report was written — the schema in §7 already reflects the corrected design, not the original one.
2. **Publish idempotency-replay ordering:** the original command order checked "is this version still a draft" *before* checking idempotency, which made a same-key replay of an already-published version fail (the replay's own precondition check saw the version its own first call had already published, and rejected the replay). Corrected with a read-only `peekIdempotencyKey` short-circuit before any precondition check — the report and code both reflect the corrected flow.

## 33. Risks

- Cross-store publish race window (§13) — disclosed, not eliminated; accepted per the approved design.
- The web UI's plain-text Commerce Knowledge id entry (§21) is a real, disclosed simplification, not a production-ready catalogue picker.
- `idempotency_keys` is deliberately generic/shared-name — a future domain reusing it must not collide on `operation_type`/key namespacing (mitigated: `operation_type` is always domain-prefixed, e.g. `"rewardProgram.create"`).
- This is the first real use of the PostgreSQL migration runner against genuine product schema — higher scrutiny value, addressed with a dedicated 11-test migration suite proving bootstrap/idempotent-rerun/rollback/reapply against real PostgreSQL.

## 34. Known limitations

1. No pause/retire/archive (deliberately, per `FOUNDER-DISPOSITION-001` FD-2 — `DEC-LOY-013` remains unresolved for those operations' semantics).
2. No plan-capacity enforcement (deliberately, per the approved design — `DEC-SUB-008` unresolved).
3. Commerce Knowledge references are entered as raw ids, not a searchable picker (§21).
4. No dedicated Playwright e2e spec for the Reward Program page was added — the existing dashboard-harness pattern renders real callable-backed data against a fixture actor, and wiring a compatible PostgreSQL+Firestore-emulator-backed fixture for it was judged to require more scaffolding than "one meaningful path without excessive fixture scaffolding" (the task's own bar) justifies in this package; the RTL suite (§24) and the direct cross-store integration suite (§24, §26) together cover the same logical paths a Playwright spec would exercise, just not through a real browser. Disclosed as a gap, not silently skipped.

## 35. Explicit exclusions

Pause, retire, archive, migration between Reward Programs, seasonal variants, Purchase, Verification, Verified Units, Loyalty Cycle, overflow allocation, Reward issuance, Redemption, billing/commercial accounting, plan-capacity enforcement, hosted preview, Cloud SQL provisioning, authentication-provider changes, Firestore Reward Program persistence, dual-write/dual-authority storage.

## 36. Rollback instructions

Revert this package's commit(s) on `feat/platform-baseline-005a-reward-program-foundation` (or the eventual merge commit on `main`). Roll back the migrations via the existing `migrateDown(pool, migrationsDir, N)` mechanism (proven safe in `rewardProgramMigrations.postgres.test.ts`) before or as part of the revert if the migrations were ever applied to a shared/staging database — they were not applied to any shared environment by this package (only to disposable local/test databases during development). **Updated by `CORR-001`:** the migration set is now six files (0001-0006, see the CORR-001 section below), so a full rollback is `migrateDown(pool, migrationsDir, 6)`. No Firestore data was created or modified by this package (zero writes to any Firestore collection).

## 37. PR number

[Fkenogo/11THONUS#251](https://github.com/Fkenogo/11THONUS/pull/251)

## 38. Exact PR head

`244ddc4008ac51b98763f0ede869f2a7afc50a5c` (branch `feat/platform-baseline-005a-reward-program-foundation`). `e291a986ce6e48f9a4432c886b5c9cbefa679417` was the pre-correction head the independent review's six findings were raised against.

## 39. CI status

**Green.** See CORR-001.23 for the exact run and the one CI-workflow fix required to get there.

## 40. Final disposition

**PLATFORM-BASELINE-005A-CORR-001 — CORRECTED / AWAITING INDEPENDENT RE-REVIEW.** See the CORR-001 section below for full detail. Not merged.

---

# PLATFORM-BASELINE-005A-CORR-001 — Independent Review Corrections

**Date:** 2026-09-13
**Scope:** Bounded correction of six independent-review findings (P1×2, P2×4) raised on PR #251 by `chatgpt-codex-connector[bot]`, plus one additional integrity check this task specification required inspecting independently (same-program ownership of `reward_programs.current_version_id`).
**Status:** CORRECTED / AWAITING INDEPENDENT RE-REVIEW. Not merged.

## CORR-001.1 Recovery entry state

- PR #251: `state=OPEN`, `mergeable=MERGEABLE`, `mergeStateStatus=UNSTABLE`, base `f955bcebbea673291422c16a3ad4a43ab2ba3b26` (unchanged, still `origin/main`'s head at package start), head `e291a986ce6e48f9a4432c886b5c9cbefa679417` (the original implementation's final report-only commit). CI on that head: `Build, Lint, Test, Emulator Validation` — **FAILURE**.
- Six open, unresolved review threads on that head, one per finding below — none replied to, none resolved.
- `git fetch origin` confirmed the local worktree's branch tip exactly matched `origin/feat/platform-baseline-005a-reward-program-foundation` (`0` ahead, `0` behind) — the branch itself had received no new commits since the original implementation.

## CORR-001.2 Previous agent work discovered

A prior correction agent had been assigned this task but never committed, pushed, or communicated its state. `git log`/`git reflog`/`git stash list` on the branch showed no additional commits and no stash entries — every trace of its work existed only as **uncommitted changes in the same isolated worktree's working tree** (`/private/tmp/11thonus-pb005a`, the same worktree the original implementation used): 17 modified tracked files, 3 new untracked files (a new web hook test, and a new migration `0006` pair). No `.output`/scratch artifacts, no partial commits, no WIP markers.

On inspection, this uncommitted work was **substantially complete and materially correct** for all six findings plus the additional same-program integrity check — not a half-finished attempt. It had simply never been validated, committed, or pushed. It had **not** been run against a live PostgreSQL instance, the Firestore emulator, or lint/format at any point (three genuine defects, described below, were caught only once actual validation ran).

## CORR-001.3 Previous valid work preserved

All of the previous agent's design and implementation choices were preserved unchanged as a correct starting point:

- The `RewardProgramWithVersions` (`currentVersion`/`draftVersion`) read-model shape (Finding 1) — exactly the conceptual shape this task specified, propagated consistently through the repository, domain model, query service, callable transport, web wire types, and UI.
- The atomic `INSERT ... ON CONFLICT (idempotency_key) DO NOTHING RETURNING ...` reservation pattern (Finding 2) — the only race-free approach for a key that may not yet exist.
- The `keyForRequest` rotation reuse from `businessMutations.ts` for all four Reward Program mutation hooks (Finding 3) — no new idempotency-hook framework invented, exactly as instructed.
- The complete-draft-snapshot round-trip for `standardRewardNodeId`/`bulkReviewThreshold`/`effectiveUntil` (Finding 4).
- The same-transaction `reward_programs.shared_loyalty_number_allowed` projection update inside `publishVersion` (Finding 5).
- The `rewardProgramIdempotencyConflictError()`/`rewardProgramIdempotencyInProgressError()` domain-error factories mapping to the existing closed `IDEMPOTENCY_CONFLICT`/`TEMPORARY_UNAVAILABLE` categories (Finding 6), applied identically across all four write commands.
- The new forward-only migration `0006_reward_program_pointer_integrity` adding a composite `(current_version_id, id) → (id, reward_program_id)` foreign key plus a partial unique index enforcing at most one editable draft per program (the additional integrity check) — correctly issued as a **new** migration rather than a rewrite of 0001-0005, matching this task's migration-safety instruction; migrations 0001-0005 were confirmed byte-for-byte untouched (`git diff --stat` empty against all five).
- Extensive real-PostgreSQL and RTL regression coverage already written for every finding (concurrency tests using `Promise.allSettled` against the shared `pool`, not sequential calls).

None of this was rewritten. Corrections below are additive/fix-only.

## CORR-001.4 Findings re-verified against current code (classification)

| Finding | Classification on entry | Root cause (confirmed against current code) |
|---|---|---|
| 1 — draft lost on read | Already correctly fixed (uncommitted) | `getRewardProgramById`/`listRewardProgramsForBusiness` returned only `currentVersion`, sourced solely from the nullable `current_version_id` pointer, so a program's own draft (new or N+1) was invisible after any refetch |
| 2 — idempotency reservation race | Already correctly fixed (uncommitted) | `SELECT ... FOR UPDATE` cannot lock a row that does not exist; two concurrent first attempts both observed "absent" and raced on `INSERT` |
| 3 — hook key rotation | Already correctly fixed (uncommitted) | Each Reward Program mutation hook is mounted once for the whole management page (not once per program), so a retained key from one program's retryable failure could be replayed against a different program |
| 4 — silent field loss on edit | Already correctly fixed (uncommitted) | The edit form only carried the fields it rendered; `standardRewardNodeId`/`bulkReviewThreshold`/`effectiveUntil` were never read from the draft or sent back, so the server's update replaced them with the request's (absent) values |
| 5 — stale shared-number projection | Already correctly fixed (uncommitted) | `publishVersion`'s `UPDATE reward_programs` set `current_version_id`/`status` but never `shared_loyalty_number_allowed`, so the projection could contradict the newly active version's own snapshot |
| 6 — plain errors bypass domain mapping | Already correctly fixed (uncommitted) | All four write commands threw bare `new Error("IDEMPOTENCY_CONFLICT" / "IDEMPOTENCY_IN_PROGRESS")` on a reservation conflict/in-progress outcome, which `toHttpsError` does not recognize and maps to `internal` |
| Additional — same-program pointer integrity | Not yet addressed by the original implementation; corrected (uncommitted) by the same prior agent | The original single-column FK (`current_version_id → reward_program_versions(id)`) proved only that the pointer named *some* existing version row, not one belonging to the same program |

No finding required a design contradiction, a Founder decision, or a scope change to resolve. No finding was found to already be fixed on `main`/elsewhere, superseded, or in need of reversal.

## CORR-001.5 Defects found and fixed during THIS validation pass

Three genuine defects survived the previous agent's uncommitted work because it was never run. All are test/lint-only; no production code changed as a result:

1. **Two unused imports** (`insertNextDraftVersion`, `insertRewardProgramWithFirstDraft`) left in `rewardProgramCommands.postgres.test.ts` after the previous agent's edits — `pnpm run lint` failed with 2 errors. Fixed by removing the unused imports (the third import from that statement, `publishVersion`, is used by the Finding 5 rollback test and was kept).
2. **Stale pre-CORR-001 test assertion**: `createRewardProgram: same key + different request content conflicts` asserted `.rejects.toThrow("IDEMPOTENCY_CONFLICT")` — a message-substring match against the OLD plain-`Error` shape Finding 6 replaces. Fixed by asserting `instanceof RewardProgramDomainError` and `category === "IDEMPOTENCY_CONFLICT"` instead, consistent with every other CORR-001 test.
3. **Broken Finding 6 in-progress test**: the seeded "in-progress reservation" row was inserted under a throwaway key (`nextId("seedkey")`) while the actual `updateRewardProgramDraft` call under test used a DIFFERENT, freshly generated key (`nextId("key")`) — reservations are looked up strictly by key, never by hash, so the seeded row could never collide with the call being tested; the command ran to normal completion instead of hitting the in-progress branch, and the test's own `expect.unreachable(...)` fired, masking the real assertion behind a confusing "expected AssertionError to be instance of RewardProgramDomainError" failure. Fixed by seeding the in-progress row under the SAME key (`heldKey`) the tested call reuses.
4. **`platformFoundationReadiness.postgres.test.ts` Case B** still asserted the pre-`CORR-001` five-migration set (`["0001".."0005"]`); with migration `0006` now shipped, `migrateUp` correctly applies six migrations and the stale assertion failed. Updated to `["0001".."0006"]`.

All four fixes were verified by re-running the affected suites; no other test needed to change.

## CORR-001.6 Finding 1 — Management read must return the editable draft

**Root cause:** confirmed in CORR-001.4.
**Correction:** `RewardProgramWithCurrentVersion` renamed to `RewardProgramWithVersions` with two independent nullable fields, `currentVersion` (unchanged pointer semantics) and `draftVersion` (the program's latest version, but only while `status = 'draft'`, via a new `getEditableDraftVersion` repository helper) — propagated through `getRewardProgramById`, `listRewardProgramsForBusiness`, `rewardProgramQueries.ts`, the callable transport (no explicit serialization needed — the callables return the query result directly), the web wire type `RewardProgramWithVersionsWire`, and `RewardProgramManagementPage.tsx` (edit/save/publish now target `draftVersion`; "create next version" is eligible only when `currentVersion` is active AND `draftVersion` is null). No stale reference to the old type name remains anywhere in the repository (verified by repo-wide grep).
**Tests:** two dedicated real-PostgreSQL flows in `rewardProgramCommands.postgres.test.ts` ("Finding 1 flow A" — fresh unpublished program refetches as `currentVersion=null`/`draftVersion=v1`, edited and published from that refetched state; "Finding 1 flow B" — publish v1 + create v2 draft refetches as `currentVersion=v1(active)`/`draftVersion=v2`, edited and published, then a further refetch confirms `currentVersion=v2`/`draftVersion=null`); three RTL tests on `RewardProgramManagementPage.test.tsx` proving the UI renders the correct actions from each of the three read-model shapes (unpublished-with-draft, published-with-draft, published-no-draft). Both re-query from persistence via the read boundary, per the task's explicit instruction not to rely on command return values.

## CORR-001.7 Finding 2 — Atomic first-use idempotency reservation

**Root cause:** confirmed in CORR-001.4.
**Correction:** `checkAndReserveIdempotencyKey` now attempts `INSERT ... ON CONFLICT (idempotency_key) DO NOTHING RETURNING ...` first; a successful insert (`rows.length > 0`) is an unconditional "acquired". Only when the insert is silently skipped (key already exists) does the function fall back to `SELECT ... FOR UPDATE` on the now-guaranteed-existing row, which is the only point row-locking is meaningful. The misleading original doc comment (claiming `FOR UPDATE` alone serialized concurrent first attempts) was corrected to describe the actual atomic pattern and why the old one was unsafe.
**Real-concurrency tests** (all using `Promise.allSettled` against the shared connection pool — genuine concurrent transactions, not sequential calls, verified safe under this file's `fileParallelism: false` postgres-suite setting which only serializes test *files*, not the concurrent client connections within one test):
- Same key + same request, concurrent: no raw database error surfaces to either caller (every rejection is a `RewardProgramDomainError`), and exactly one program/version is created.
- Same key + different request, concurrent: exactly one program is created; the loser receives a governed outcome, never a raw unique-violation.
- Completed same-key/same-request replay: covered by the pre-existing (non-concurrent) `createRewardProgram: same-key replay` test, unchanged.
- Rollback: a stale-row-version failure inside `updateRewardProgramDraft`'s transaction rolls back its reservation, domain state, AND outbox together (verified by exact row/outbox/key counts before and after), and a subsequent retry with a fresh key proceeds normally.

## CORR-001.8 Finding 3 — Rotate idempotency key when target/request changes

**Root cause:** confirmed in CORR-001.4.
**Correction:** all four Reward Program mutation hooks (`useCreateRewardProgramMutation`, `useUpdateRewardProgramDraftMutation`, `usePublishRewardProgramVersionMutation`, `useCreateNextRewardProgramVersionMutation`) now call the existing `keyForRequest(holder, lastRequestRef, JSON.stringify(payload))` helper (reused unmodified from `businessMutations.ts`, the same helper `PLATFORM-BASELINE-004A-CORR-001` introduced for the Team page's shared list-action hooks) instead of `holder.getKey()` directly. A retry of the identical request replays the same key; any materially different request (different program, version, or field values) rotates to a fresh key. No new idempotency-hook abstraction was introduced.
**Tests:** `apps/web/src/business/hooks/rewardProgramMutations.test.tsx` (new file) renders the real hook with the real `keyForRequest` helper and a mocked callable that can reject retryably or resolve, and captures every key sent: a retry of the exact same request keeps the key; a materially different request (different `rewardProgramId` or field values) rotates to a new key; success clears/rotates per the existing convention.

## CORR-001.9 Finding 4 — Preserve optional draft fields during UI edit

**Root cause:** confirmed in CORR-001.4.
**Correction:** `DraftFormState` gained `standardRewardNodeId`/`bulkReviewThreshold`/`effectiveUntil`, populated from the draft on `startEdit` and always included, unchanged, in the update/create-next-version payload — never exposed as editable controls (matching current approved product scope), but never silently dropped either.
**Tests:** "Finding 4: saving an edit preserves the optional fields the form does not expose" (RTL) — a draft seeded with all three optional fields set, the user edits only `rewardDescription`, and the mutation payload is asserted to carry the description change alongside the three untouched original values plus the unmodified qualifying-node list; a companion test proves "create next version" also carries the current version's optional fields forward.

## CORR-001.10 Finding 5 — Update current shared-number projection on publish

**Root cause:** confirmed in CORR-001.4.
**Correction:** `publishVersion`'s `UPDATE reward_programs` statement now also sets `shared_loyalty_number_allowed = $2` from the just-published version row's own `RETURNING`-clause value, inside the same transaction as the pointer/status update. The version row itself remains the sole historical authority; this write only refreshes the current-value convenience projection.
**Tests:** "Finding 5: publishing a changed shared-number version updates the program projection in the same transaction, and a failed publication leaves the projection unchanged" — publishes v1 (`shared=false`), creates and publishes v2 (`shared=true`), and separately proves a simulated mid-transaction failure (an injected `throw` after `publishVersion` runs, inside its own `withPlatformTransaction` call) leaves the program's projection, pointer, and the draft version's status completely unchanged, before the real publication is exercised.

## CORR-001.11 Finding 6 — Map idempotency outcomes through domain errors

**Root cause:** confirmed in CORR-001.4.
**Correction:** two new factories, `rewardProgramIdempotencyConflictError()` (category `IDEMPOTENCY_CONFLICT`, wire code `aborted`) and `rewardProgramIdempotencyInProgressError()` (category `TEMPORARY_UNAVAILABLE`, wire code `unavailable`) — both existing entries in the closed 14-category taxonomy, already mapped in `functions/src/index.ts`'s `CATEGORY_TO_HTTPS`. All four write commands (`createRewardProgram`, `updateRewardProgramDraft`, `publishRewardProgramVersion`, `createNextRewardProgramVersion`) now throw these instead of `new Error("IDEMPOTENCY_CONFLICT"/"IDEMPOTENCY_IN_PROGRESS")`. `toHttpsError` was exported (previously private) solely so `index.test.ts` can exercise the mapping directly.
**Tests:** two dedicated real-PostgreSQL command-level tests (in-progress reservation with a matching request hash surfaces `TEMPORARY_UNAVAILABLE`; a same-key reservation held for a materially different request surfaces `IDEMPOTENCY_CONFLICT`) plus three callable-transport unit tests in `index.test.ts` (`toHttpsError` maps each category to its governed code and never to `internal`).

## CORR-001.12 Additional integrity check — `current_version_id` same-program ownership

**Finding:** the original single-column FK (`reward_programs.current_version_id → reward_program_versions(id)`, migration 0002) proved only that the pointer named *some* existing version row — not one belonging to the same Reward Program. A relational, declarative fix is possible without any architectural change.
**Disposition:** corrected via a **new** migration, `0006_reward_program_pointer_integrity.sql` (existing migrations 0001-0005 were confirmed untouched, byte-for-byte). It (a) adds `UNIQUE (id, reward_program_id)` to `reward_program_versions` (harmless — `id` is already the primary key, so this is a redundant-but-necessary composite uniqueness target for the next step), (b) drops the old single-column FK and replaces it with a composite FK `(current_version_id, id) REFERENCES reward_program_versions (id, reward_program_id)`, which PostgreSQL's `MATCH SIMPLE` (the default) still treats as satisfied whenever either referencing column is `NULL` — preserving the pointer's nullable-until-first-publication semantics exactly — and (c) additionally adds a partial unique index `reward_program_versions_one_draft_per_program` (`WHERE status = 'draft'`), turning Finding 1's "at most one editable draft per program" read-model assumption into a database-enforced invariant rather than a command-layer convention. No trigger was needed; both invariants are expressible declaratively.
**Migration safety:** PR #251 remains unmerged; these migrations have never been applied to any shared/staging/production environment (only to disposable local Docker Postgres instances during development and this validation pass) — a new forward migration was therefore judged safe and preferable to modifying 0001-0005, per this task's own instruction to avoid rewriting migrations relied upon outside the feature branch. No migration-runner checksum concern arises because 0001-0005's file contents are unchanged; only a new 0006 checksum is newly recorded.
**Tests:** two new real-PostgreSQL tests in `rewardProgramMigrations.postgres.test.ts` — one proves a cross-program pointer assignment is rejected with a foreign-key violation while a same-program assignment succeeds; the other proves the partial unique index rejects a second simultaneous draft per program while allowing an unlimited number of `superseded` historical drafts and exactly one new draft after each publish cycle. The migration-count assertions in this file and in `platformFoundationReadiness.postgres.test.ts` were updated from five to six migrations throughout.

## CORR-001.13 Review-thread handling

All six original threads were independently re-verified against the current (corrected) code before any reply — none were assumed correct from a prior agent's claim, since the prior agent had never replied to or resolved any of them. Each was replied to with the exact correction and test evidence (see the PR for the verbatim replies) and resolved only after the corrected commit was pushed and the full validation suite re-run clean against it. A fresh scan of PR #251 immediately before finalizing this report found no thread beyond the original six and no new reviewer/bot comment.

## CORR-001.14 Final risk state

- The cross-store publish race window (RF-3, unchanged from the original implementation) remains disclosed, not eliminated — this correction package did not touch that contract.
- The web UI's plain-text Commerce Knowledge id entry (unchanged, disclosed in the original report) remains a known simplification.
- The new composite FK and partial unique index add real, tested database-level protection with no observed performance concern at this data scale (single-digit rows per program).

## CORR-001.15 Remaining known limitations

Identical to the original implementation report's §34, plus: the "one editable draft per program" invariant is now enforced twice (repository read-model convention AND database constraint) — intentionally, per this task's explicit instruction to prefer a real relational invariant over trusting application logic alone.

## CORR-001.16 Commands executed (this correction pass only)

```
git fetch --all --prune && git status --short && git log --oneline -5 (worktree audit)
gh pr view 251 --json headRefOid,baseRefOid,mergeable,mergeStateStatus,state,statusCheckRollup
gh api repos/Fkenogo/11THONUS/pulls/251/comments (review-thread audit)
git diff --stat / git diff -- <each changed file> (technical review of uncommitted work)
pnpm --filter functions typecheck / pnpm --filter web typecheck
pnpm run lint (found + fixed 2 errors)
pnpm run format:check / pnpm exec prettier --write <5 files>
pnpm --filter functions test -- --run rewardProgram evaluatePermission index.test
pnpm --filter web test -- --run RewardProgram rewardProgram
docker exec <postgres> psql ... (test-database cleanup between iterations)
firebase emulators:exec --only firestore ... npx vitest run --config vitest.postgres.config.ts (3 iterations: 2 found+fixed real test bugs, 1 confirmed clean + reproduced a transient shared-machine contention failure as non-regression)
pnpm --filter functions test (full) / pnpm --filter web test (full)
pnpm run build
pnpm run emulators:validate (full Firebase Emulator Suite)
pnpm run emulators (temporary local UI-disable in firebase.json to avoid a port-4000 conflict with another concurrent session on this shared machine; reverted immediately after, confirmed clean via git diff before any commit)
pnpm run test:e2e (Playwright, full suite)
git add / git commit / git push (see below)
gh api repos/Fkenogo/11THONUS/pulls/251/comments/<id>/replies (thread replies, 6x)
gh api graphql (fetch review-thread node ids; resolveReviewThread mutation, 6x)
gh pr checks 251 (found CI FAILURE on the pushed correction commit)
gh run view <id> --log-failed (diagnosed: PostgreSQL integration tests step lacked the Firestore emulator the new cross-store test file requires)
pnpm exec firebase emulators:exec --only firestore --project demo-11thonus "PLATFORM_ENV=test PLATFORM_POSTGRES_URL=... pnpm --filter functions test:postgres" (verified the CI-equivalent command locally before committing the workflow fix)
git add .github/workflows/ci.yml / git commit / git push (CI-workflow fix)
gh pr checks 251 (confirmed green on the final head)
```

## CORR-001.17 Dependencies added

None.

## CORR-001.18 Config changes

None persisted. A local, temporary `firebase.json` `emulators.ui.enabled: false` edit was made and reverted (confirmed via `git diff` showing no residual change) to work around a port-4000 conflict with another session's emulator instance on this shared machine while running the Playwright suite locally — never committed.

## CORR-001.19 Schema/migration changes

One new migration pair, `0006_reward_program_pointer_integrity.{sql,down.sql}` — see CORR-001.12. Migrations 0001-0005 unchanged.

## CORR-001.20 Test results (final corrected head)

- Targeted Reward Program + permission/evaluator + index unit tests: **4 files / 282 tests pass**.
- Targeted Reward Program web/RTL tests: **2 files / 17 tests pass**.
- Real PostgreSQL + Firestore-emulator cross-store suite (5 files, including the new concurrency and integrity tests): **57/57 pass** (reproduced clean twice after fixing the 3 defects in CORR-001.5; one intermediate run hit one transient, non-reproducing failure in an unrelated pre-existing test caused by shared-database contention on this multi-session machine — confirmed non-regression by an immediate clean re-run with no code change).
- Full functions unit suite: **158 files / 1739 tests pass**.
- Full web unit suite: **111 files / 790 tests pass**.
- Full Firebase Emulator Suite (`emulators:validate`): **65 files / 833 passed, 3 pre-existing skips, 0 failed**.
- Typecheck (functions + web): clean.
- Lint: clean (1 pre-existing, unrelated warning) — after fixing the 2 errors in CORR-001.5.
- Format check: clean — after formatting the 5 previously-unformatted files.
- Build: clean (pre-existing chunk-size warning only).
- Playwright e2e (full suite): **37/37 pass**.

## CORR-001.21 Review-thread state

All six original `chatgpt-codex-connector[bot]` threads replied to with the exact correction and test evidence, and resolved after the corrected commit was pushed and validated. See the PR for the verbatim reply text and thread links.

## CORR-001.22 New review findings

None found on a fresh scan of PR #251 immediately before finalizing this report (comments, reviews, and check-run annotations).

## CORR-001.23 CI status on final head

**Green.** `Build, Lint, Test, Emulator Validation` — SUCCESS on head `244ddc4008ac51b98763f0ede869f2a7afc50a5c` (`https://github.com/Fkenogo/11THONUS/actions/runs/34810706131`). `mergeStateStatus: CLEAN`, `mergeable: MERGEABLE`. Getting here required one additional bounded fix beyond the six findings and the pointer-integrity check: the "PostgreSQL integration tests" CI step ran `pnpm --filter functions test:postgres` directly, but the new cross-store test file (`rewardProgramCommands.postgres.test.ts`, added by the original `PLATFORM-BASELINE-005A` implementation) requires `FIRESTORE_EMULATOR_HOST` to be set and threw its own env guard on every CI run since that PR was opened — CI was already `FAILURE` on the pre-correction head `e291a986ce6e48f9a4432c886b5c9cbefa679417`, undetected because the original implementation session never checked CI status before reporting success. Fixed in commit `244ddc4` by wrapping that step in `firebase emulators:exec --only firestore` (moving the Java-setup step earlier so it is available in time) and verified locally against the exact command shape before pushing (5 files / 57 tests pass). This is a CI-workflow fix only — no test or product code changed in that commit.

## CORR-001.24 Worktree safety confirmation

The primary worktree, `/Volumes/PRODUCTION/Projects/11THONUS`, was inspected (`git status --short --branch`) at the start of this task and found unchanged from its prior in-progress `docs/dec-legal-002-bt-draft-007` state (same modified-file list: `canonical-reference.md`, `assumptions-register.md`, `decision-register.md`, `documentation-changes-log.md`, and the PRD/TRD files already in progress there) — it was never stashed, reset, cleaned, checked out, or committed to. All correction work happened exclusively in the pre-existing isolated worktree `/private/tmp/11thonus-pb005a` on branch `feat/platform-baseline-005a-reward-program-foundation`, the same worktree the original implementation and the incomplete prior correction attempt both used.

## CORR-001.25 Rollback instructions (this correction)

Revert the correction commit(s) on `feat/platform-baseline-005a-reward-program-foundation`. If migration `0006` was ever applied to a shared/staging database (it was not by this package), roll it back first via `migrateDown(pool, migrationsDir, 1)` from a six-migration state, or `migrateDown(pool, migrationsDir, 6)` for a full reset.

## CORR-001.26 CI-workflow fix (required to reach a green final head)

Pushing the correction commit (`708a936`) surfaced that CI had already been `FAILURE` on the ORIGINAL, pre-correction head (`e291a986`) — a fact the original `PLATFORM-BASELINE-005A` implementation session never checked before declaring "IMPLEMENTED / AWAITING INDEPENDENT REVIEW". Root cause: `.github/workflows/ci.yml`'s "PostgreSQL integration tests" step ran `pnpm --filter functions test:postgres` directly, but `rewardProgramCommands.postgres.test.ts` (the cross-store command test the original implementation added) requires `FIRESTORE_EMULATOR_HOST` to be set and throws its own `beforeAll` guard otherwise — every CI run since PR #251 opened failed that one file. This is a CI-plumbing gap, not a design or product-code defect, and required no architectural decision to fix: the step was wrapped in `firebase emulators:exec --only firestore --project demo-11thonus "..."` (mirroring the exact command already used for local validation throughout this package), and the JDK 21 setup step (required by the Firestore Emulator) was moved earlier so it is available in time. Verified locally against the identical command shape before pushing (5 files / 57 tests pass), then confirmed green in actual CI on commit `244ddc4` (`Build, Lint, Test, Emulator Validation` — SUCCESS, run `34810706131`). Only `.github/workflows/ci.yml` changed in this commit — no test or product code.

## CORR-001.27 Final disposition

**PLATFORM-BASELINE-005A-CORR-001 — CORRECTED / AWAITING INDEPENDENT RE-REVIEW.**

Not merged. Final PR head `244ddc4008ac51b98763f0ede869f2a7afc50a5c`, CI green.

Not merged. Not self-approved.
