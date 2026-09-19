# PLATFORM-BASELINE-013A.2 — Business-Owned Qualifying Item Domain, Permission & Callable Foundation: Implementation Report

> **Classification:** Implementation. Additive runtime/domain foundation only.
> **Date:** 2026-09-19 · **Performed by:** Claude (AI agent)
> **Governing design:** [`PLATFORM-BASELINE-012` implementation-readiness design](platform-baseline-012-business-owned-qualifying-item-implementation-readiness-design-2026-09-18.md) — §5 (entity model), §11 (optional Commerce Knowledge mapping), §15 (test plan, cases A–C, F/G application halves, U, V, Y–AC), §16 (package `PB-013A.2` and its Amendment 001), §17A.
> **Governing decisions:** `DEC-LOY-016` / `FD-REWARD-QUALIFYING-ITEM-001` (Business-owned item; Commerce Knowledge mapping optional classification only); `DEC-LOY-017` / `FD-QUALIFYING-ITEM-ROLE-AUTHORITY-001` (Owner and Manager manage; Staff view/select only; no routine Platform Administrator authority).
> **Predecessor:** [`PLATFORM-BASELINE-013A.1` persistence foundation](platform-baseline-013a1-qualifying-item-persistence-foundation-implementation-report-2026-09-18.md) (migrations `0016`/`0017`, merged as PR #260).
> **Scope:** exactly the package the corrected PB-012 delivery sequence names `PB-013A.2`: the `QualifyingItem` domain model, repository, commands, `qualifyingItem.manage` permission, membership-gated read, and four **new** callables. **No existing Reward Program or purchase contract was changed. `PLATFORM-BASELINE-013B`/`C`/`D`/`E` were not started.**

---

## 1. Entry `origin/main` SHA

`git fetch origin` executed; `origin/main` verified exactly **`1bb3e8ec0bc718035596ddb8552c0db7c262069a`** (merge of PR #260, `PLATFORM-BASELINE-013A.1`) — the exact SHA named by the task. No drift.

## 2. Branch / worktree

- **Branch:** `feat/platform-baseline-013a2-qualifying-item-domain-foundation`, created from `1bb3e8e`. (The native worktree tool auto-named it `worktree-feat+platform-baseline-013a2-…`; it was renamed locally to the requested name before any commit or push.)
- **Worktree:** `/Volumes/PRODUCTION/Projects/11THONUS/.claude/worktrees/feat+platform-baseline-013a2-qualifying-item-domain-foundation` — a separate git worktree created by the harness's native worktree tool. Disclosure: unlike PB-013A.1 (which used a sibling `-worktrees/` directory), this path lives under the primary repository directory's `.claude/worktrees/`, as the native tool places it. It is a distinct git worktree with its own working tree; no primary-worktree file was touched (§36).

## 3. Final head SHA

- **Implementation (code) head:** `b76b95fb63cbbd2655f41ef284caefcca009b983` — the commit carrying all code and tests.
- **Final PR head:** the tip of the PR branch, which additionally includes this report and the changes-log entry as a docs-only commit. A commit cannot contain its own SHA; the exact final head is stated in the task hand-off message and on the PR.

## 4. PR number / state

**PR #261** — <https://github.com/Fkenogo/11THONUS/pull/261> — `OPEN`, not draft, base `main`, `MERGEABLE`. **Not merged**, per instruction.

## 5. Analysis performed before modification

Read directly from the repository (not inferred from prompts), before any code was written:

- **PB-012** in full (§1–§30 incl. Amendment 001 and Correction 001) — notably §5 (entity model), §11, §15 (case list), §16 (package boundaries), §17A (CF-1–CF-4, which belong to 013C), and the `DEC-LOY-017` permission amendment.
- **PB-013A.1** implementation/closure report and migrations `0016`/`0017` (schema, `UNIQUE (id, business_id)`, `ON DELETE RESTRICT`, the `active`/`retired` `CHECK`).
- **Permission architecture:** `rewardProgramPermissionCatalogue.ts`, `purchasePermissionCatalogue.ts`, `permissionErrors.ts`, `permissionId.ts`, all of `evaluatePermission.ts` (classification, per-class lifecycle gate, Steps 5a/5b/5c, override steps, fail-closed tail), `evaluatePermission.test.ts` conventions.
- **Reward Program domain conventions:** model + error class, Postgres repository (`Queryable`/`PlatformPostgresTransaction` seam), a full command (`createRewardProgram`, `updateRewardProgramDraft`), authorization (`authorizeRewardProgramManage` / membership-only `authorizeRewardProgramRead`), queries, `rewardProgramRequestHash`, the generic `idempotencyRepository`, and `rewardProgramKnowledgeValidation` (the `assertNodeEligible` predicate set).
- **Transport conventions in `index.ts`:** `toHttpsError` + `CATEGORY_TO_HTTPS`, `parseNonEmptyString`/`parseBusinessId`/`parseActorRequest`, `resolveAuthenticatedBusinessActor`, the whitelist-parser + `onCall` pattern of the Reward Program callables, and `index.test.ts`'s mass-assignment test style.
- **Test infrastructure:** `vitest.*.config.ts`, the cross-store `rewardProgramCommands.postgres.test.ts` (Firestore + Postgres) seeding helpers, `platformFoundationReadiness.postgres.test.ts`.

**Findings that shaped the design (none contradicted the task; no STOP condition arose):**
1. The Reward Program/Purchase catalogues are disjoint modules with a module-load invariant and a structural-copy evaluator branch — the smallest coherent amendment (per `DEC-LOY-017`) is a fifth module + Step 5d, exactly as PB-012 Amendment 001 specifies.
2. `reward_program_outbox` is Reward-Program-specific (`aggregate_type` hard-coded) and PB-012 specifies no Qualifying Item event, so **no outbox events are written** (§17).
3. `assertNodeEligible` is not exported; rather than modify a Reward Program file, the equivalent predicate set is reproduced over the same Commerce Knowledge primitives (§11).
4. The purchase domain already reuses the generic idempotency repository across domains — precedent for reusing it here.

**Implementation strategy** followed: TDD in dependency order (permission catalogue → evaluator → model → repository → services → transport), one failing test observed before each production module where an executable RED was possible (see §21/§25 for the one place it was not, and how it was compensated).

## 6. Files modified

**18 files, all under `functions/src/`, plus this report and the changes-log entry under `docs/`.**

*Modified (3):*
1. `functions/src/index.ts` — new imports, one `toHttpsError` branch, four whitelist parsers, four callables (204 lines added, none removed).
2. `functions/src/domains/permissions/evaluator/evaluatePermission.ts` — fifth class, lifecycle-gate branch, Step 5d (formatting-neutral apart from re-wrapping the `PermissionClass` union).
3. `functions/src/domains/permissions/models/permissionErrors.ts` — `unrecognisedQualifyingItemPermissionError`; the multi-catalogue error message now names five catalogues.

*New (15):*
4. `functions/src/domains/permissions/models/qualifyingItemPermissionCatalogue.ts`
5. `functions/src/domains/permissions/models/qualifyingItemPermissionCatalogue.test.ts`
6. `functions/src/domains/permissions/evaluator/evaluatePermission.qualifyingItem.test.ts`
7. `functions/src/domains/qualifyingItem/models/qualifyingItem.ts`
8. `functions/src/domains/qualifyingItem/models/qualifyingItemErrors.ts`
9. `functions/src/domains/qualifyingItem/models/qualifyingItem.test.ts`
10. `functions/src/domains/qualifyingItem/repositories/qualifyingItemRepository.ts`
11. `functions/src/domains/qualifyingItem/repositories/qualifyingItemRepository.postgres.test.ts`
12. `functions/src/domains/qualifyingItem/services/qualifyingItemAuthorization.ts`
13. `functions/src/domains/qualifyingItem/services/qualifyingItemKnowledgeValidation.ts`
14. `functions/src/domains/qualifyingItem/services/qualifyingItemRequestHash.ts`
15. `functions/src/domains/qualifyingItem/services/qualifyingItemCommands.ts`
16. `functions/src/domains/qualifyingItem/services/qualifyingItemQueries.ts`
17. `functions/src/domains/qualifyingItem/services/qualifyingItemCommands.postgres.test.ts`
18. `functions/src/qualifyingItemTransport.test.ts`

*Docs (2):* this report; `docs/00-governance/documentation-changes-log.md` (Entry 245).

**Deliberately zero-diff:** `index.test.ts`, `evaluatePermission.test.ts`, `rewardProgramPermissionCatalogue.ts`, `purchasePermissionCatalogue.ts`, every `rewardProgram/**` and `purchase/**` file, every migration, `apps/**`.

## 7. Code diff summary

`git diff origin/main --stat` at the code head: **18 files changed, 2996 insertions, 3 deletions** (the 3 deletions are the re-wrapped `PermissionClass` line, the `Step 9` comment line, and the multi-catalogue error message line). Production code is roughly 1,150 lines including comments (911 lines across the nine new production modules — catalogue, model, errors, repository, authorization, knowledge validation, request hash, commands, queries — plus about 255 added to `index.ts`, the evaluator, and the error module); the remainder is tests.

## 8. QualifyingItem domain model

`functions/src/domains/qualifyingItem/models/qualifyingItem.ts` — mirrors migration `0016` column for column, using the migration's exact naming:

| Field | Type | Source column |
|---|---|---|
| `id` | `string` (UUID) | `id` |
| `businessId` | `string` | `business_id` |
| `name` | `string` | `name` |
| `knowledgeNodeId` | `string \| null` | `knowledge_node_id` (**optional**) |
| `status` | `"active" \| "retired"` (`QUALIFYING_ITEM_STATUSES` const tuple) | `status` |
| `createdAt` / `updatedAt` | `Date` | `created_at` / `updated_at` |
| `createdBy` / `updatedBy` | `string` | `created_by` / `updated_by` |
| `schemaVersion` | `number` | `schema_version` |

Also exported: `normalizeQualifyingItemName` (trim; non-empty; ≤ 100 chars) and `isWellFormedQualifyingItemId` (UUID shape, so a malformed id fails as "not found" instead of a driver error). `QualifyingItemDomainError` uses only the existing closed 14 error categories.

## 9. Repository implementation

`repositories/qualifyingItemRepository.ts`, on the existing Postgres seam (`PoolClient | PlatformPostgresPool` for reads, `PlatformPostgresTransaction` for writes; no `pg` import in services): `insertQualifyingItem`, `getQualifyingItem`, `listQualifyingItems`, `updateQualifyingItem`, `retireQualifyingItem`. **No delete function exists** (asserted by test). Every statement that addresses an item by id also predicates on `business_id` (§15).

## 10. Lifecycle implementation

`active → retired` is the only transition. `updateQualifyingItem`/`retireQualifyingItem` require `status = 'active'` in the `WHERE` clause; a retired item is **terminal and read-only** (cannot be renamed, reclassified, or retired again; the command maps this to `INVALID_STATE_TRANSITION`). The row, id, name, and audit fields persist, so historical identity survives (`ON DELETE RESTRICT` on the 0017 junction remains the second line of defence). **No reactivation** is offered (see §39).

## 11. Optional Commerce Knowledge treatment

`knowledgeNodeId` is **optional classification only** and is never a creation gate:
- `null`/absent → **zero Commerce Knowledge reads** (proved by a recording-proxy test that asserts no `knowledgeNodes` collection access across create + rename) and a Business can create/operate an item with an empty Commerce Knowledge catalogue.
- A **supplied** value is validated by `qualifyingItemKnowledgeValidation.ts`: the node must exist, be `standard_product` or `standard_service`, and be `isEligibleForNewReference` (active) — the same predicate set as the Reward Program domain's `assertNodeEligible` (PB-012 §5/§11), reproduced over the same Commerce Knowledge primitives so the qualifyingItem domain neither depends on nor modifies the Reward Program domain and raises its own error. A fabricated, wrong-typed, or non-active node is rejected and nothing is persisted.
- **An unchanged mapping is never re-validated**: renaming an item whose node was later retired in Commerce Knowledge succeeds (tested); clearing a mapping (`null`) needs no read.
- No Commerce Knowledge record is copied into Postgres; no seed data was added.

## 12. `qualifyingItem.manage` implementation

Fifth catalogue module `permissions/models/qualifyingItemPermissionCatalogue.ts`: one entry, `roleDefaults = {owner: true, manager: true, staff: false}`, `eligibleBusinessStatuses = ["trial", "active"]`, a module-load invariant that throws `permissionCannotBeInMultipleCataloguesError` if the id is ever also claimed by the Sensitive, Ordinary, Reward Program, or Purchase catalogue, and `isQualifyingItemPermission` / `getQualifyingItemPermissionEntry` lookups. In `evaluatePermission.ts`: a `"qualifyingItem"` classification, a per-class lifecycle gate (`BUSINESS_NOT_ACTIVE` / `BUSINESS_INACTIVE`), and **Step 5d** — a structural copy of Steps 5b/5c returning `ROLE_DEFAULT_ALLOW` / `NO_APPLICABLE_GRANT` before any override step. No special-case role check exists anywhere.

## 13. Exact Owner / Manager / Staff behaviour

| Role | create / update / retire (`qualifyingItem.manage`) | list (membership-gated read) |
|---|---|---|
| Owner | **allow** (`ROLE_DEFAULT_ALLOW`) | allow |
| Manager | **allow** (`ROLE_DEFAULT_ALLOW`) | allow |
| Staff | **deny** (`NO_APPLICABLE_GRANT` / `AUTH_FORBIDDEN`) | **allow** |

Business must be `trial` or `active` for management (others → `BUSINESS_INACTIVE`); a `suspended`/`removed`/`invited` membership is denied. A grant override never lets Staff manage; a revoke override is never consulted (identical to the other domain catalogues). `rewardProgram.manage` is unchanged: a Manager is still denied it (tested at evaluator and service level).

## 14. Platform Admin authority treatment

**No automatic authority.** `Role` is the closed `owner|manager|staff` union and `evaluatePermission` has no platform-administrator branch, bypass, or cross-Business path; Step 5d adds none. Tested (a) at evaluator level (an admin-labelled subject with no membership → `MEMBERSHIP_NOT_FOUND`; a smuggled `isPlatformAdministrator` flag grants nothing) and (b) end to end against real Firestore with a genuine `platformAdministrators/{uid}` document and no membership: create, rename, retire, and list are all `AUTH_FORBIDDEN` and persist nothing.

## 15. Business isolation implementation

Ownership is **structural**, not a pre-check: every repository read and write is `WHERE id = $1 AND business_id = $2`. A caller acting for Business B that supplies Business A's item id matches zero rows; the result is indistinguishable from a fabricated id (`RESOURCE_NOT_FOUND`), so there is neither cross-Business mutation nor existence disclosure. Additionally the actor must hold a role in the *claimed* `businessId` (`evaluatePermission`/membership lookup), so claiming another Business's id fails `AUTH_FORBIDDEN` first. (Mutation testing confirms the tests bite: removing the `business_id` predicate from `retire` fails the repository and service cross-Business tests.)

## 16. Read / select authority

`listQualifyingItems` is **membership-gated only** (`authorizeQualifyingItemRead`: active membership of the Business, matching business and user) — the same precedent as `authorizeRewardProgramRead`/`authorizeBusinessPurchaseRead`; no `qualifyingItem.view` permission exists. Every active member, Staff included, may view and select; none thereby receives `qualifyingItem.manage`. Always scoped to the caller's Business (tested: no leakage across Businesses; Business A's actor cannot list Business B; a Platform Administrator without membership cannot list; a suspended member cannot). Default filter is `active` (the selectable set); `retired`/`all` are available to any member. The frontline purchase picker continues to use the existing `listRewardPrograms` path (PB-012 §7 Q2) — unchanged.

## 17. Service / command implementation

`services/qualifyingItemCommands.ts` — `createQualifyingItem`, `updateQualifyingItem` (rename and/or optional classification; `undefined` = unchanged, `null` = clear), `retireQualifyingItem`. Each: (1) `authorizeQualifyingItemManage` via `evaluatePermission`; (2) validate (name normalisation; supplied mapping); (3) run the mutation **and** its idempotency reservation in one `withPlatformTransaction`, reusing the generic `checkAndReserveIdempotencyKey`/`completeIdempotencyKeyInTransaction` (`operationType` `qualifyingItem.create|update|retire`; server-built content hash including actor, Business, target and fingerprint). Not-found vs retired is distinguished by a Business-scoped re-read after a zero-row mutation.

Decision disclosed: **no outbox event is written** — `reward_program_outbox` is Reward-Program-specific and PB-012 defines no Qualifying Item event; audit is carried by `created_by`/`updated_by`/`updated_at`. Adding a dedicated outbox is a separate, additive decision.

## 18. New callable / API surfaces

Four **new** `onCall` callables in `functions/src/index.ts`: `createQualifyingItem`, `updateQualifyingItem`, `retireQualifyingItem`, `listQualifyingItems`. Each: parse → `resolveAuthenticatedBusinessActor` (server-resolved `userId`, never client-supplied) → command/query → `toHttpsError`. There is intentionally **no** `getQualifyingItem` callable (PB-012 §16 lists only create/list/rename/retire; single-item read exists at repository level and backs the commands) and **no delete** callable (asserted by test).

## 19. Request parsing / error mapping

Whitelist parsers (`parseCreateQualifyingItemRequest`, `parseUpdateQualifyingItemRequest`, `parseRetireQualifyingItemRequest`, `parseListQualifyingItemsRequest`) read only `businessId`, `name`, `knowledgeNodeId`, `qualifyingItemId`, `statusFilter` — never `id`, `status`, audit fields, timestamps, `schemaVersion`, role/actor fields, `itemLabel`, or any Reward Program field (tested with a malicious payload). `knowledgeNodeId` absent/`null` parses to `null` on create (never required); on update, omitted = unchanged vs `null` = clear are kept distinct. Errors: a new `QualifyingItemDomainError` branch in `toHttpsError` maps the existing 14-category taxonomy through `CATEGORY_TO_HTTPS` to the fixed client message `qualifying_item_command_failed` (never echoing the domain message). A malformed/fabricated id is deliberately parsed as a plain non-empty string and fails safely in the domain as `RESOURCE_NOT_FOUND`.

## 20. Cross-Business security tests

In `qualifyingItemCommands.postgres.test.ts` (real Postgres + Firestore) and `qualifyingItemRepository.postgres.test.ts`: Owner of A cannot create in B (`AUTH_FORBIDDEN`); actor of B renames/retires A's item → `RESOURCE_NOT_FOUND`, item untouched; actor of A reaches B's item while authorised in A → `RESOURCE_NOT_FOUND`; actor of A claiming B's `businessId` → `AUTH_FORBIDDEN`; each Business lists only its own items; A cannot list B; fabricated well-formed UUID, malformed id, and an injection-shaped id all fail safely (`RESOURCE_NOT_FOUND`, table intact).

## 21. Lifecycle tests

Repository: active→retired preserves the row/id/name/audit; second retire and update-after-retire match no row; `all`/`active`/`retired` filters. Service: Owner and Manager retire; Staff/Platform-Admin cannot; retire-again and rename/reclassify-after-retire → `INVALID_STATE_TRANSITION` with the item unchanged; retire is idempotent under replay (same key returns the original result instead of failing as already-retired); row count unchanged after retirement (no hard delete). *Reward Program binding lifecycle cases (PB-012 J: retired item rejected in a new draft, still valid on a published version) belong to `PLATFORM-BASELINE-013B` and are not exercised here.*

## 22. Permission tests

`qualifyingItemPermissionCatalogue.test.ts` (8) and `evaluatePermission.qualifyingItem.test.ts` (21): exact role matrix (Owner/Manager allow, Staff deny), `trial`/`active` only (6 non-eligible statuses tested), suspended membership, grant/revoke override behaviour, cross-Business membership, no-membership, unrelated sibling id (`qualifyingItem.view`) fails closed, **`rewardProgram.manage` not widened** (Manager denied it while allowed `qualifyingItem.manage`; Owner still holds it; Staff neither), Platform Administrator boundary (§14), and catalogue disjointness across all five catalogues. The whole permission domain (29 files / 582 tests, which includes these 29 new tests) passes, and the pre-existing permission test files are unmodified. *Limitation:* the module-load `throw` is asserted structurally (the id is claimed by no other catalogue), not by forcing a collision — the same level of coverage the four existing catalogues have.

## 23. Optional-mapping tests

Create with no mapping and an empty Commerce Knowledge catalogue succeeds; zero Commerce Knowledge reads on create+rename (recording proxy over `db`); supplied active `standard_product` and `standard_service` accepted and persisted; nonexistent / wrong-type (`reward_program_category`) / non-active (`draft`) mappings rejected with nothing persisted; mapping can be set later, changed, and cleared; invalid mapping on update rejected with the item unchanged; renaming an item whose mapped node was later retired succeeds (no revalidation).

## 24. Commands executed

All run from the isolated worktree; Node 20.20.0 invoked by absolute path (the shell's default `node` is 18 and the repo requires ≥ 20).

```bash
git fetch origin && git rev-parse origin/main               # 1bb3e8ec…
# baseline (before any change)
node node_modules/vitest/vitest.mjs run                      # 158 files / 1765 tests
node node_modules/typescript/bin/tsc --noEmit                # clean
# unit, per module (TDD)
node node_modules/vitest/vitest.mjs run src/domains/permissions src/domains/qualifyingItem src/qualifyingItemTransport.test.ts src/index.test.ts
# postgres (scratch database on the repo's local Postgres, port 54329)
PLATFORM_ENV=test PLATFORM_POSTGRES_URL=postgres://postgres:postgres@localhost:54329/pb013a2_qualifying_item_test \
  node node_modules/vitest/vitest.mjs run --config vitest.postgres.config.ts [<filter>]
# cross-store + emulator (private Firebase emulators on ports 8187/9187, config kept outside the repo)
firebase emulators:exec --only auth,firestore --project demo-11thonus --config <scratchpad>/firebase.pb013a2.json "<vitest command>"
node ../node_modules/eslint/bin/eslint.js .                  # repo root
node node_modules/prettier/bin/prettier.cjs --check|--write <touched files>
node node_modules/typescript/bin/tsc [--noEmit]
git diff --cached --check
```

## 25. Exact test results

| Suite | Result |
|---|---|
| Baseline functions unit suite (before changes) | 158 files / 1765 tests pass |
| **Functions unit suite (final, committed head)** | **162 files / 1844 tests pass** (+4 files, +79 tests) |
| — new unit files | catalogue 8 · evaluator 21 · model 19 · transport 31 = **79** |
| Postgres — `qualifyingItemRepository` | **23 pass** |
| Postgres — `qualifyingItemCommands` (Postgres + Firestore) | **59 pass** |
| **Postgres suite, all 8 files (fresh DB, run 1)** | **216 / 216 pass** (incl. existing `purchaseCommands`, `rewardProgramCommands`, all migration suites) |
| Postgres suite, existing suites only (my 2 files excluded) | 6 files / 134 pass (134 + 82 new = 216) |
| Postgres suite, deterministic split: everything except readiness → readiness alone | 7 files / 209 pass → 7 / 7 pass |
| **Firestore emulator suite (Auth + Firestore emulators)** | **65 files / 864 pass, 3 skipped, 0 failed** |
| `tsc --noEmit` (committed head) | exit 0 |
| `tsc` build | exit 0 |
| ESLint, repo root | 0 errors, 1 pre-existing warning (`apps/web/src/business/BusinessApiContext.tsx`, untouched) |
| Prettier | applied to touched files; HEAD baseline of `evaluatePermission.ts` verified prettier-clean beforehand |
| `git diff --check` | clean |

**Failures encountered, investigated (none waved away):**
1. **54 emulator failures on the first emulator run** (3 files: `staffInvitation`, `staffMembershipIntegration`, `acceptStaffInvitationIdempotency`). All shared one error — *"No Firebase project was found for the provided credential"* — because I had started only the Firestore emulator; those suites call Firebase Auth. **Evidence:** re-run with the Auth emulator added → 65/65 files pass, 864 tests, 0 failures. Environmental, and proven so by the passing re-run *plus* the uniform error text, not by re-run alone.
2. **1 Postgres failure** (`platformFoundationReadiness` → "reports migration foundation not established on a fresh database"). Root cause: that test assumes a fresh database but the file only cleans up *after* each test, so it fails whenever a suite that leaves the schema migrated runs immediately before it (vitest orders files by cache, so the order varies). **This is a pre-existing hazard**, reproduced with **none** of this package's files: on a fresh DB, running only the existing `rewardProgramCommands` suite and then only the readiness suite fails identically. Full-suite run 1 (readiness first) passed 216/216; run 2 (existing `rewardProgramCommands` ran immediately before readiness) failed that one test; the deterministic split above passes. The two new Postgres files now `migrateDown` + drop `schema_migrations` in `afterAll` so they can never be that trigger. **Not fixed for the existing suites** (out of scope; flagged in §30/§39).
3. **Executable RED caveat.** The cross-store command suite was written before the services, but I could not observe it fail first (it needs the emulator, which was set up afterwards) and it passed 59/59 on its first execution. To compensate, **mutation testing**: I removed the `business_id` predicate from `retireQualifyingItem` and the authorization call from `createQualifyingItem`; 14 tests failed (cross-Business retire at repository and service level; the whole create-authorization/lifecycle matrix), then I reverted both mutations. All other suites had a genuine observed RED (module missing / 12 evaluator + 29 transport assertions failing) before implementation.

## 26. CI state / result

Exact-head CI (`Build, Lint, Test, Emulator Validation`) on PR #261: see the hand-off message and the PR checks for the final-head result; at the moment this section was written the run on the code head `b76b95f` was `pending`. **[Final CI result is recorded in the changes-log entry and the hand-off message once complete.]**

## 27. Dependencies added

**None.** No `package.json` or `pnpm-lock.yaml` change.

## 28. Config changes

**None** in the repository. (`firebase.json`, `vitest.*.config.ts`, `eslint.config.js`, workflows: untouched.) A temporary Firebase emulator config used ports 8187/9187/4487/4587 to avoid another session's emulator on 8080/4400; it lived in the session scratchpad outside the repo.

## 29. Schema / migration changes

**None.** No `.sql` file added or modified; the package reads/writes only the `qualifying_items` table created by `0016` and the shared `idempotency_keys` table. Highest migration remains `0017`.

## 30. Risks

1. **Idempotent-replay snapshot typing.** As in the Reward Program domain, a replayed response is the JSON-serialised original, so `Date` fields come back as ISO strings; the cast to `QualifyingItem` is nominal. Wire-identical for the callable; noted, not changed (consistent with existing convention).
2. **Cross-store validation window.** A supplied mapping is validated against Firestore before the Postgres transaction; a node retired in between is a bounded race, the same disclosed window as Reward Program publish (RF-3). An already-saved mapping is never invalidated retroactively.
3. **Idempotency keys are globally unique** (existing `idempotency_keys` design): a key reused by a different actor/request yields `IDEMPOTENCY_CONFLICT`, never a replay of another actor's result.
4. **Pre-existing test-isolation hazard** (`platformFoundationReadiness` vs any suite that leaves the schema migrated) — not introduced or fixed here; see §25.
5. **No reactivation, no outbox event, 100-char name bound, duplicate names permitted** — engineering defaults listed in §39.
6. **Emulator tooling side effect:** running `firebase emulators:exec` downloaded `cloud-firestore-emulator-v1.21.0.jar` and removed the outdated `v1.20.2` jar from the user's `~/.cache/firebase/emulators/` (the CLI's automatic behaviour). Other local sessions will simply re-download if they need the old jar.
7. **Latent gap for 013B/013C (not a defect here):** Reward Program version binding and purchase binding remain to be built; until then no path consumes these items.

## 31. Rollback instructions

Purely additive code: revert the PR's commits (`git revert` of the merge, or drop the branch before merge). **No schema or data migration to undo.** Rows already written to `qualifying_items` (and `idempotency_keys` rows with `operation_type` `qualifyingItem.*`) are inert without the code: nothing else reads them, and `0016`/`0017` remain valid. Rollback order relative to later packages is unchanged from PB-012 §26 (013A.2 reverts after 013B–E).

## 32. `rewardProgram.manage` was not widened — confirmed

`rewardProgramPermissionCatalogue.ts` has **zero diff**; `rewardProgram.manage` remains `{owner: true, manager: false, staff: false}`, `Owner`-only. Tests assert this at evaluator and service level (Manager still denied), and `authorizeRewardProgramManage` is exercised unmodified.

## 33. Reward Program contracts were not changed — confirmed

No file under `functions/src/domains/rewardProgram/**` is modified; `parseQualifyingNodes`, `parseRewardProgramDraftFields`, and the four Reward Program callables/parsers in `index.ts` are untouched (the 204-line `index.ts` diff is purely additive, placed after `listRewardPrograms`). The existing `rewardProgramCommands.postgres.test.ts` passes unmodified. The qualifyingItem domain imports only the generic `idempotencyRepository` from that domain (same as the purchase domain does).

## 34. Purchase contracts were not changed — confirmed

No file under `functions/src/domains/purchase/**` is modified; `parseRecordPurchaseRequest` (and its `itemLabel`/`knowledgeNodeId` fields), `purchaseRequestHash`, persistence, and Trust Events are untouched; the existing `purchaseCommands.postgres.test.ts` passes unmodified (part of the 216).

## 35. PB-013B / C / D / E were not started — confirmed

No Reward Program → Qualifying Item binding, no replacement of `reward_program_version_qualifying_nodes`, no `qualifyingItemId` on purchases, no migration `0018`/`0019`, no `QualifyingNodeSelector.tsx` change, no UI change of any kind (`apps/**` zero diff).

## 36. Primary legal worktree untouched — confirmed

`/Volumes/PRODUCTION/Projects/11THONUS` (branch `docs/dec-legal-002-bt-draft-007`, carrying unrelated uncommitted legal-drafting work) — no working-tree file was read, modified, or checked out. Disclosure of the only interaction: the initial `git fetch origin`, `git rev-parse`, and `git worktree list` were executed from that directory (they read/update the shared `.git` remote-tracking refs and worktree registry only). All edits, tests, commits, and the push were made from the isolated worktree in §2.

## 37. Markdown report path

`docs/05-implementation/reports/platform-baseline-013a2-qualifying-item-domain-permission-foundation-implementation-report-2026-09-19.md` (this file).

## 38. Changes-log entry

`docs/00-governance/documentation-changes-log.md` — new **Entry 245**, inserted ahead of Entry 242 (the file's current first entry), with the header's "Last controlled update"/"Prior update" chain extended.

## 39. New findings requiring Founder / product input

None blocks review or merge. Engineering defaults chosen where the approved design was silent; each is easily changed additively:

1. **Retired items are terminal — no reactivation.** `DEC-LOY-017` authorises "archive", not "unarchive". A retired item cannot be renamed, reclassified, or restored. *Confirm terminal, or authorise a reactivation operation.*
2. **Editing a retired item is blocked** (as a consequence of 1). *Confirm.*
3. **Retired items are visible to Staff** via `listQualifyingItems` with `statusFilter` `retired`/`all` (membership-gated; default is `active`). *Confirm whether Staff should see retired items or only Owner/Manager.*
4. **Name length bound of 100 characters** — an abuse-surface bound, not a product rule (`name` is unbounded `TEXT`). *Confirm or adjust.*
5. **Duplicate names remain permitted** (PB-012 FQ-2 default; still open). Not changed here.
6. **`updateQualifyingItem` carries the optional classification** in addition to rename, because `DEC-LOY-017` authorises Owner/Manager to "optionally classify" and PB-012 §16 named only "rename". *Confirm this reading.*
7. **No outbox/audit event** for Qualifying Item mutations (audit via `created_by`/`updated_by`/`updated_at` only). *Confirm sufficient for Phase 1, or specify an event.*

Separately, an **engineering (not product) item**: the pre-existing `platformFoundationReadiness.postgres.test.ts` ordering hazard (§25/§30) merits its own small hygiene fix (a `beforeAll` cleanup, or every schema-leaving suite cleaning up) — recommended as a separate package, not bundled here.

---

## FINAL DISPOSITION

**PLATFORM-BASELINE-013A.2 — IMPLEMENTED / ADDITIVE DOMAIN & PERMISSION FOUNDATION ESTABLISHED / AWAITING INDEPENDENT REVIEW.**

Not merged. `PLATFORM-BASELINE-013B` onward remain not started.
