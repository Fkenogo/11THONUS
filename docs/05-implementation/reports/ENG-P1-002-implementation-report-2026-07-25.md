> **Title:** ENG-P1-002 — Shared Engineering Foundation Implementation Report
> **Version:** 1.0 · **Status:** Final · **Classification:** Working (historical record)
> **Governing task:** "TASK — ENG-P1-002: Shared Engineering Foundation Implementation"
> **Source-of-truth path:** `docs/05-implementation/reports/ENG-P1-002-implementation-report-2026-07-25.md`
> **Date:** 2026-07-25

## Entry Verification (performed before Step 1)

- `origin/main` HEAD: `d1c458b356abdb484f4df517fead5a5e0f24d45f`.
- `ENG-P1-002` confirmed `Ready` on the live Engineering Implementation Programme and Coding-Agent Prompt Register before implementation began; `DEC-TECH-006`/`DEC-TECH-007` confirmed `CONFIRMED`; the EIR governance stream confirmed at `EIR-03`, `EIR-ENG-P1-001` `Administratively Closed`.
- The [ENG-P1-002 Engineering Blueprint](../prompts/ENG-P1-002-engineering-blueprint-2026-07-25.md) (PR [#11](https://github.com/Fkenogo/11THONUS/pull/11)) was, at the time this task began, still open/unmerged on `main` — disclosed as a non-blocking observation, consistent with this programme's own precedent: the Founder's own task message is itself the specific, written authorization ("the blueprint is now the implementation contract"), independent of whether that document is merged.
- `functions/src/` confirmed to contain only `config/region.ts`, `index.ts`, `infrastructure/firebase/admin.ts` — no `shared/` folder existed before this task.

## 1. Files Created

38 files under `functions/src/shared/` (18 source modules, 17 unit test files, 3 emulator-integration test files):

- `metadata/{baseMetadata,serverTimestamp}.ts` (+ tests)
- `errors/{errorCategories,platformError}.ts` (+ tests)
- `correlation/correlationId.ts` (+ test)
- `logging/{operationalLog,logger}.ts` (+ tests)
- `commands/{commandEnvelope,commandDispatcher}.ts` (+ tests, `commandDispatcher` also has an emulator test)
- `events/{domainEvent,eventNaming}.ts` (+ tests)
- `idempotency/{idempotencyRecord,idempotencyService}.ts` (+ unit test, + emulator test)
- `outbox/{outboxEntry,outboxWriter,outboxProcessor}.ts` (+ unit tests, `outboxProcessor` also has an emulator test)
- `validation/{actorValidation,requestValidation}.ts` (+ tests)
- `functions/vitest.emulator.config.ts` — new Vitest config scoped to `**/*.emulator.test.ts`, run separately from the default fast unit suite
- `docs/05-implementation/reports/ENG-P1-002-implementation-report-2026-07-25.md` (this report)

## 2. Files Modified

- `functions/vitest.config.ts` — excludes `**/*.emulator.test.ts` from the default `pnpm test` run (those require a live Firestore emulator)
- `functions/package.json` — added `test:emulator` script
- `package.json` (root) — `emulators:validate` now runs `pnpm --filter functions test:emulator` inside `firebase emulators:exec`, replacing a placeholder `console.log` smoke check with real Firestore-backed coverage (see §7 Risks — Architectural Observations)
- `docs/05-implementation/change-tracking/engineering-implementation-programme.md` — `ENG-P1-002` status `Ready` → `Under Review`
- `docs/05-implementation/change-tracking/coding-agent-prompt-register.md` — `ENG-P1-002` row status `Ready` → `Under Review`
- `docs/changes/IMPLEMENTATION_CHANGES.md` — new dated entry (TRD22 §22.39)
- `docs/00-governance/documentation-changes-log.md` — new entry

No file outside this list was touched. No governance document was expanded; only existing status fields and standing changes logs were updated, per established precedent for every prior implementation work package.

## 3. Summary of Changes

Implemented the shared `authenticate → validate → log → respond` command foundation every later domain service will depend on: the Command Contract (`CommandEnvelope<T>`), Event Contract (`DomainEvent<T>` + naming standard), Correlation-ID service, Logging Contract (`OperationalLog` + shared logger), Idempotency service (Firestore-backed, `idempotencyRecords` collection), Event Outbox (schema + transactional writer + retry/dead-letter processor), shared Error Contract (`PlatformErrorResponse` + the 14 TRD11 §11.35 categories), and the shared request/actor validation that ties them together in `dispatchCommand`. Every type is copied field-for-field from already-approved TRD11/TRD10/TRD20 text, per the Engineering Blueprint's own Contract Realization section — nothing here introduces a new architectural concept. No domain command, event, or business rule was written; no Firestore Security Rules were authored; no new deployed Cloud Function was added.

## 4. Commands Executed

```
pnpm install --frozen-lockfile
npx vitest run <scoped path>          (RED, then GREEN, per file — TDD throughout)
npx tsc --noEmit                       (after each module with real type surface)
pnpm typecheck / pnpm lint / pnpm format:check / npx prettier --write <files>
pnpm test                              (full unit suite, both workspaces)
pnpm build                             (full build, both workspaces)
pnpm emulators:validate                (real Firebase Emulator Suite — Firestore, Functions, etc. —
                                         wrapping `pnpm --filter functions test:emulator`)
```

## 5. Test Results

- **Unit tests** (`pnpm test`, no emulator): **87/87 passing** in `functions` (across 20 test files), **31/31 passing** in `apps/web` (unaffected, unchanged).
- **Emulator integration tests** (`pnpm emulators:validate`, real Firestore/Functions emulator): **14/14 passing** across 3 files — `idempotencyService.emulator.test.ts` (5 tests: new/duplicate/conflict/completed/failed round trip), `outboxProcessor.emulator.test.ts` (5 tests: success/retry/dead-letter/no-silent-disappearance/not-yet-due), `commandDispatcher.emulator.test.ts` (4 tests: full round trip, idempotent cache hit, conflict rejection, `DomainCommandError` translation).
- **Contract validation:** every `CommandEnvelope<T>`/`DomainEvent<T>`/`OperationalLog`/`IdempotencyRecord`/`OutboxEntry<T>`/`PlatformErrorResponse` shape is exercised by at least one test constructing a real, fully-populated instance and asserting on its fields.
- `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build` — all clean across both workspaces.
- Two real defects were found and fixed via this same TDD/emulator-testing process — see §7.

## 6. Dependencies

None added. Everything is built on packages already present in `functions/package.json` (`firebase-admin`, `firebase-functions`) and Node's own built-in `node:crypto` module (`randomUUID`, `createHash`) — no new `dependencies` or `devDependencies` entry was required.

## 7. Risks

| Risk | Category | Notes |
|---|---|---|
| Sensitive-content log guard needed two rounds of correction, discovered via the real emulator run | Resolved during this task | The logger's heuristic for refusing to log secret-shaped values initially false-positived on this project's own `SCREAMING_SNAKE_CASE` error categories and `lower_snake_case` result labels (both are long, letters-plus-underscore strings that collided with the "long token" pattern). Fixed via TDD (failing regression test → corrected regex) both times; confirmed by a subsequent clean full emulator run. This is exactly the class of defect emulator testing exists to catch before it reaches a shared module every future domain depends on. |
| Backoff/retry parameters (1s initial, ×2 multiplier, 5 attempts) are this work package's own disclosed choice, not numerically specified by TRD11 §11.29 | Architectural observation, disclosed per the Engineering Blueprint's own Risks §10 | Not a defect; flagged for confirmation if a future domain's SLA needs different values. |
| `userId`/`authUid` in `CommandActor` are currently treated as identical (both set to Firebase Auth's `uid`) | Architectural observation | TRD11 §11.7 defines both fields without elaborating a distinction between a platform-internal user ID and the raw Auth UID; this work package's own disclosed assumption, to be confirmed once Identity (Phase 2) introduces its own user-ID model. |
| Two minor inaccuracies discovered in the Engineering Blueprint's own text during implementation | Architectural observation, blueprint not altered | (1) The Testing Blueprint described a "password string passed into an arbitrary payload," but `OperationalLog` (TRD20 §20.23) is a closed shape with no generic payload field — the logger's guard was scoped instead to the two free-text fields the type actually has (`result`, `errorCode`). (2) The blueprint's Repository Impact table said `functions/src/index.ts` would be modified to "export the shared module surface" — in practice nothing needed changing, since no new Cloud Function is deployed by this work package and nothing yet consumes the shared modules; `index.ts` was left untouched. Both are disclosed here rather than silently reconciled, per the task's own permission to correct only *factual* blueprint errors, not redesign. |
| `emulators:validate`'s previous placeholder (`console.log`) is now real test coverage, changing CI's emulator-step runtime | Low | The emulator startup itself (which previously proved `functions[europe-west1-ping]` initializes) is unchanged; the wrapped command now additionally runs 14 real Firestore-backed tests, adding a few seconds to CI, not a behavior change to what's being validated at the infrastructure level. |
| No domain yet exists to prove `dispatchCommand` against real business logic | Expected, not a risk | Matches TRD22 §22.11's own Phase 1 exit criterion ("shared server command can authenticate, validate, log and return a standard response") — a synthetic example command is the correct proof at this stage; the first real domain command (Phase 2+) is the true end-to-end validation. |

## 8. Rollback Instructions

All work is additive: a new `functions/src/shared/` tree, plus two small, isolated script/config changes (`vitest.config.ts`'s exclude list, two `package.json` script additions, one new `vitest.emulator.config.ts`). No Firestore collection exists in any live environment yet — no domain writes to `idempotencyRecords` or `outboxEntries` until a future domain work package uses this shared layer. Rollback: revert the commit(s) on `chore/eng-p1-002-shared-foundation` (or, once merged, `git revert` the merge commit on `main`). Tracker status reverts alongside (back to `Ready`).

---

## Addendum — Commit, Push, PR, and CI Evidence

*(Appended once validation, commit, push, and PR creation completed.)*
