# PLATFORM-BASELINE-005A — Reward Program Foundation — Implementation Report

**Date:** 2026-09-13
**Authority:** `PLATFORM-BASELINE-005` design report + `CORR-001` + `FOUNDER-DISPOSITION-001` + `REVIEW-FINDINGS-001` (all merged, PR #250).
**Status:** IMPLEMENTED / AWAITING INDEPENDENT REVIEW.

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

Revert this package's commit(s) on `feat/platform-baseline-005a-reward-program-foundation` (or the eventual merge commit on `main`). Roll back the five migrations via the existing `migrateDown(pool, migrationsDir, 5)` mechanism (proven safe in `rewardProgramMigrations.postgres.test.ts`) before or as part of the revert if the migrations were ever applied to a shared/staging database — they were not applied to any shared environment by this package (only to disposable local/test databases during development). No Firestore data was created or modified by this package (zero writes to any Firestore collection).

## 37. PR number

To be recorded once opened (§13 of the final report below).

## 38. Exact PR head

To be recorded once opened.

## 39. CI status

To be recorded once the PR's CI run completes.

## 40. Final disposition

**PLATFORM-BASELINE-005A — IMPLEMENTED / AWAITING INDEPENDENT REVIEW.**

Not merged. Not self-approved.
