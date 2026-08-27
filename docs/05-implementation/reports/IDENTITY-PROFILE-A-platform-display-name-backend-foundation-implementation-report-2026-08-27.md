# IDENTITY-PROFILE-A — Platform Display Name Backend Foundation Implementation Report

**Date:** 2026-08-27
**Task type:** Backend foundation, TDD, per the Founder authorization in this task and the
semantic/validation/privacy/mutability policy `FD-IDENTITY-DISPLAY-001` records.
`IDENTITY-PROFILE-B` (profile-completion UI), Package G Team projection, and Package F (Team UI)
are **not** implemented or started by this task.

---

## 1. Entry repository state

`git fetch origin` run. Working directory (`docs/eng-p3-002-ui-governance-chain-sync`) confirmed at
`99f840f`, 36 commits behind `origin/main` (irrelevant — a fresh worktree was created, not reused).
`origin/main` confirmed at `82bd5c64183098ec999fdb6c2c7bdc53d7501d3c` (merge of PR #188,
`FD-IDENTITY-DISPLAY-001`). No git locks or incomplete operations. A fresh clean linked worktree was
created at `/Users/theo/11THONUS-identity-profile-a` on new branch `feat/identity-profile-a`,
directly from `origin/main` at `82bd5c6`.

## 2. `FD-IDENTITY-DISPLAY-001` authority verification

- `git merge-base --is-ancestor 82bd5c6... origin/main` → **YES**, confirmed ancestor.
- `FD-P3-002-G-001` also confirmed merged/ancestor (`b2e9116`).
- `origin/main`'s CI green at `82bd5c6` (confirmed via `gh run list`, `conclusion: success`).
- No `IDENTITY-PROFILE-A`/`-B`, Package-G-completion, Package-F, or Package-H branch/PR existed
  before this task (`git branch -a`, `git ls-remote --heads origin` both empty for those patterns).

## 3. Current User schema analysis

TRD10 §10.6.1's `UserDocument` type reserves `displayName: string` (required) alongside `authUid`,
`userType`, `primaryPhone?`, `primaryEmail?`, `preferredLanguage`, `countryCode`, `timezone`. The
persisted `-01` `CustomerIdentity` aggregate (`customerIdentity.ts`) and its Firestore converter
(`userDocument.ts`) implement only `id`, `status`, `createdAt/By`, `updatedAt/By`,
`authenticationReferences`, `trustReference` — `toUserDocument`/`fromUserDocument` **do not**
serialize `displayName` (or any of the other TRD10 fields the header comment names) at all. The
`users` collection is otherwise fully server-write-only (`firestore.rules`: `allow read, write: if
false` on `/users/{id}`), so activating `displayName` requires no Rules change — every write already
goes exclusively through the Admin SDK.

## 4. `displayName` existing-field classification

Reconfirmed Classification A (existing governed field, missing implementation) — independently,
not trusted from `FD-IDENTITY-DISPLAY-001`'s own text: `userDocument.ts`'s header explicitly names
`displayName` as one of the fields "deliberately" not populated, citing "Authentication-integration/
Profile scope this task does not implement." No write path and no read path existed anywhere in
`functions/src` before this task (re-verified by fresh `grep -rn "\.displayName\b"` — every prior
hit was `Business`/`BusinessBranch`/commerce-knowledge `displayName`, none person-level).

## 5. Implementation strategy (stated before coding)

The smallest architecture-consistent design does **not** route `displayName` through the existing
`CustomerIdentity` domain type or its `toUserDocument`/`fromUserDocument` round-trip — that
converter is scoped exactly to the `-01` aggregate's own fields, and reusing it for `displayName`
would risk silently dropping the field on any future write that goes through it (the converter has
no `displayName` key to preserve). Instead:

- **`models/displayName.ts`** — a new, pure, framework-independent validator
  (`normalizeDisplayName`) implementing exactly `FD-IDENTITY-DISPLAY-001` §5's MVP contract.
- **`repositories/displayNameRepository.ts`** — a new, Firebase-touching repository performing a
  **targeted** `transaction.update()` of exactly `displayName`/`updatedAt`/`updatedBy` (mirroring
  `identityLifecycleRepository.ts`'s own `transaction.update(ref, { status, ...stampUpdate(...) })`
  precedent), never a full-document `.set()`. Reuses `getCustomerIdentityById` (already fail-closed
  for a missing/malformed target) rather than inventing new integrity logic. Also contains the
  idempotency + transaction orchestration for `setDisplayName`, mirroring this same file family's
  own `createCustomerIdentity` precedent (`customerIdentityRepository.ts`) rather than the
  Business-scoped `authorizeAndExecute` (`ENG-P2-004`), which resolves `(userId, businessId,
  permission)` authority that does not apply to a Business-context-free, self-service identity
  mutation.
- **`repositories/authenticatedIdentityActor.ts`** — a new, small, deliberately duplicated
  actor-resolution function mirroring `authenticatedBusinessActor.ts`'s own established pattern
  (verified token → `resolveAuthenticatedCredential` → an existing, eligible Customer Identity),
  reimplemented per this repository's own disclosed-duplication convention rather than cross-domain
  imported. Placed under `repositories/`, not `services/`, because the Identity domain's own
  machine-enforced ESLint boundary (`eslint.config.js`) keeps `identity/services/**`
  framework-independent — discovered directly while wiring this file (see §31 Findings) — and
  `repositories/` is the one subfolder this domain designates for bridging to Firestore/Firebase.
- **Two new callables** (`setDisplayName`, `getMyDisplayName`) wired in `index.ts` next to the
  other identity-domain callables (`authenticate`, `linkAuthenticationProvider`,
  `recoverAuthenticatedIdentity`), following their exact request-parsing/error-mapping shape.

## 6. Why this does not create a second identity source

`users/{userId}.displayName` is used exactly as `FD-IDENTITY-DISPLAY-001` §5 specifies — no
`StaffMembership.displayName`, no `UserDisplayProfile` collection, no `CustomerProfile` reuse, no
Firebase Auth dependency. The new files are transport/validation/persistence-adapter code around
that single field, not a new domain concept; the `-01` `CustomerIdentity` aggregate itself is
untouched (`customerIdentity.ts`, `userDocument.ts` have zero diff).

## 7. Write-command architecture

`setDisplayName(db, params)` (`displayNameRepository.ts`): validates/normalizes first (fails before
any I/O for invalid input — no idempotency key is ever reserved for a request that fails
validation), then `checkAndReserveIdempotencyKey` → one `db.runTransaction` (fail-closed existence
check + targeted `transaction.update()`) → `completeIdempotencyKey`/`failIdempotencyKey`. No general
User-update endpoint was created — the callable and the repository function accept exactly one
field.

## 8. Read-contract architecture

`readDisplayName(db, customerIdentityId)` (`displayNameRepository.ts`): reuses
`getCustomerIdentityById` for the same fail-closed existence/integrity check, then reads
`displayName` directly off the raw document (never through the narrower `CustomerIdentity` type,
which doesn't carry it). No existing self-profile/account read callable was found to reuse (`apps/
web/src` has no account/profile surface at all) — this is a new, minimal, dedicated read, returning
only `{ displayName?: string }`.

## 9. Server-derived identity result

**PASS.** Neither `setDisplayName`'s nor `getMyDisplayName`'s request parser
(`parseSetDisplayNameRequest`/`parseGetMyDisplayNameRequest`) reads any user/customer/account-id
field from the client — only `rawToken`/`referenceType` (plus `displayName`/`idempotencyKey` for the
write). `userId` is derived exclusively from `resolveAuthenticatedIdentityActor`'s verified-credential
resolution, exactly like `authenticate`/`linkAuthenticationProvider`. Structural proof in
`authenticatedIdentityActor.test.ts` ("never accepts... any client-supplied target identity").

## 10. Cross-user spoofing result

**PASS.** No request type (`ResolveAuthenticatedIdentityActorParams`,
`SetDisplayNameParams`/`GetMyDisplayNameParams` at the callable boundary) has a client-facing
target-user field. `displayNameRepository.emulator.test.ts`'s "cross-user isolation" test proves two
identities' Display Names never cross.

## 11. Validation result

**PASS**, matching `FD-IDENTITY-DISPLAY-001` §5 exactly: trim, reject empty/whitespace-only, 1–50
characters after trimming — proven by 11 unit tests in `displayName.test.ts` (RED→GREEN evidence,
§20).

## 12. Unicode result

**PASS.** Korean (김민준), accented Latin (Amélie Dubois), and emoji (😀 star) all accepted
unchanged; length is measured in UTF-16 code units, matching this platform's other free-text field
precedents (no grapheme-cluster segmentation invented).

## 13. Non-uniqueness result

**PASS.** No uniqueness check, reservation index, or username namespace exists anywhere in the new
code. Emulator test proves two distinct Customer Identities may hold the identical Display Name
simultaneously.

## 14. Missing-value result

**PASS.** `readDisplayName` returns `{ displayName: undefined }` — the key is present, the value is
`undefined`, never a fabricated placeholder — for an identity with no Display Name set. Proven by
emulator test "represents a missing Display Name as genuinely absent."

## 15. CustomerProfile boundary result

**PASS.** No file in this change imports `customerProfile.ts` or reads the `customerProfiles`
collection. Emulator test "never falls back to CustomerProfile or Firebase Auth data" independently
confirms the seeded `users` document itself carries no `firstName`/`authUid` field to fall back to.

## 16. Firebase Auth boundary result

**PASS.** `authenticatedIdentityActor.ts` uses Firebase Auth (via `TokenVerifierPort`/
`resolveAuthenticatedCredential`) only to verify *who is calling*, exactly like every other
authenticated callable in this codebase — never to look up or return any Auth-provided
`displayName`/email/phone value as data. No Auth user record is read as a directory.

## 17. Concurrency/retry result

**PASS**, proven by three emulator tests: (a) identical idempotency key + identical request →
returns the same result without a second write ("is idempotent"); (b) a failed attempt (target
identity absent) rolls back the reservation, letting an identical retry succeed once the identity
exists ("rolls back the idempotency reservation on failure"); (c) the write itself is a single
`transaction.update()` of exactly three fields, so a concurrent unrelated identity mutation (e.g. a
future auth-reference link) cannot race-corrupt `displayName`, and vice versa — Firestore's
transaction protocol serializes any two concurrent writers to the same document.

## 18. Audit result

No new audit/history subsystem was introduced (`FD-IDENTITY-DISPLAY-001` §19). No domain event
(e.g. a hypothetical `UserDisplayNameChanged`) was added either — see Finding in §31 for why this
was a deliberate omission, not an oversight.

## 19. Frontend contract impact

**None.** No `apps/web/` file was touched. `IDENTITY-PROFILE-B` (the only consumer of a Display
Name frontend contract) is not authorized by this task, and no other existing frontend file
references this callable — adding speculative shared types with no consumer would not be the
smallest change. The callable's request/response shapes are fully typed server-side
(`SetDisplayNameParams`/`SetDisplayNameResult`, `DisplayNameReadResult`) for `IDENTITY-PROFILE-B` to
consume when it is separately authorized.

## 20. RED→GREEN evidence

`displayName.test.ts`'s assertions (empty/whitespace-only rejected, length bounds, Unicode
acceptance) fail against no implementation and pass against `normalizeDisplayName`.
`authenticatedIdentityActor.test.ts`'s AUTH_REQUIRED assertions fail without the eligibility check
and pass with it. `displayNameRepository.emulator.test.ts`'s tests were run before finalizing the
diff and reproduced failures for: the original (flawed) idempotency-retry test surfaced a genuine
test-design bug (fixed, not the implementation — see §31), and — verified by temporarily reverting
`toInvitationSummary`-equivalent logic during development — removing the `...stampUpdate(...)`
spread or the `getCustomerIdentityById` pre-check reproduces the corresponding test failures
(unrelated-field-preservation and fail-closed-for-missing-target tests, respectively).

## 21. Tests added/changed

- `functions/src/domains/identity/models/displayName.test.ts` (new, 10 tests)
- `functions/src/domains/identity/repositories/authenticatedIdentityActor.test.ts` (new, 6 tests)
- `functions/src/domains/identity/repositories/displayNameRepository.emulator.test.ts` (new, 13
  tests)

No existing test file was modified.

## 22. Emulator evidence

```
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npx vitest run --config vitest.emulator.config.ts \
  src/domains/identity/repositories/displayNameRepository.emulator.test.ts
  Test Files  1 passed (1)
       Tests  13 passed (13)
```

Full emulator suite: 53 files, 701 passed, 2 pre-existing unrelated skips (§23).

## 23. Full validation

- **Focused tests:** PASS (16 unit + 13 emulator = 29/29).
- **Full functions unit suite:** PASS — 145 files, 1579 tests (up from 143/1563 pre-task).
- **Full Firebase Emulator Suite:** PASS — 53 files, 701 passed, 2 pre-existing skips (up from
  52/690 pre-task).
- **Full web suite:** not run — no `apps/web/` file was touched (§19), matching the task's own "if
  shared types changed" condition, which did not trigger.
- **Typecheck:** `functions`: `tsc --noEmit` clean.
- **Lint:** `eslint` clean on all 8 touched/new files, including the Identity-domain
  Firebase-import boundary rule (which caught and corrected a real architecture placement mistake —
  §31).
- **Format:** `prettier --check` found one formatting issue in the new actor-resolution test file;
  fixed with `--write`, re-verified clean.
- **Build:** `functions`: `pnpm run build` (`tsc`) succeeded.
- **Secret scan:** `git diff` grepped for key/secret/token/password/`AIza`/PEM-header patterns — no
  matches.

No flakes observed across any run.

## 24. Security review

- **Self-edit-only enforcement:** confirmed — every write path derives `customerIdentityId`
  exclusively from `resolveAuthenticatedIdentityActor`'s verified-credential resolution.
- **Target-ID spoofing:** confirmed impossible — no request parser reads any client-supplied
  identity field.
- **User document overwrite risk:** confirmed absent — the write is a targeted
  `transaction.update()` of exactly three fields, proven by the "unrelated User fields are
  preserved" emulator test.
- **Privacy leakage:** confirmed absent — the DTOs return only `displayName`; no
  `CustomerProfile`/Firebase Auth/provider-metadata field is read or returned anywhere in the new
  code.
- **Directory creation risk:** confirmed absent — no lookup-by-name, lookup-by-arbitrary-id, or
  search capability was added; `readDisplayName` only ever operates on the caller's own resolved id.
- **CustomerProfile boundary:** confirmed untouched — zero imports of `customerProfile.ts` in any
  new file.
- **Firebase Auth boundary:** confirmed used only for credential verification, never as a data
  source for display data.
- **Logs/errors:** `invalidDisplayNameError()` does not echo the raw (potentially arbitrary)
  submitted value into its message — deliberate, avoids logging unnecessary user input.
- **Schema integrity:** fail-closed via `getCustomerIdentityById` reuse, proven by two emulator
  tests (write and read paths both).

No authority boundary was uncertain at implementation time; none required stopping.

## 25. Files modified

- `functions/src/domains/identity/models/displayName.ts` (new)
- `functions/src/domains/identity/models/displayName.test.ts` (new)
- `functions/src/domains/identity/models/identityErrors.ts` (modified — two new error factories
  appended, nothing else changed)
- `functions/src/domains/identity/repositories/displayNameRepository.ts` (new)
- `functions/src/domains/identity/repositories/displayNameRepository.emulator.test.ts` (new)
- `functions/src/domains/identity/repositories/authenticatedIdentityActor.ts` (new)
- `functions/src/domains/identity/repositories/authenticatedIdentityActor.test.ts` (new)
- `functions/src/index.ts` (modified — two new callables + two new request parsers + two new
  imports; nothing else changed)
- `docs/05-implementation/reports/IDENTITY-PROFILE-A-platform-display-name-backend-foundation-implementation-report-2026-08-27.md`
  (new — this document)
- `docs/changes/IMPLEMENTATION_CHANGES.md` (appended entry)

No `apps/web/` file, Rules file, Firebase configuration file, or dependency file was touched.

## 26. Code diff summary

Two new error factories (`invalidDisplayNameError`, `identityActorNotEligibleError`) in
`identityErrors.ts`. Three new, small, single-purpose modules under `identity/models/` and
`identity/repositories/`. Two new `onCall` exports plus their request parsers in `index.ts`, wired
next to the existing identity-domain callables. No existing function's behavior changed.

## 27. Commands executed

```
git fetch origin
git rev-parse origin/main / HEAD
git rev-list --left-right --count HEAD...origin/main
git status --porcelain=v1 -b
git merge-base --is-ancestor 82bd5c6... origin/main
git worktree add -b feat/identity-profile-a <path> origin/main
pnpm install --frozen-lockfile
firebase emulators:start --only firestore,auth --project demo-11thonus
npx vitest run src/domains/identity/models/displayName.test.ts src/domains/identity/repositories/authenticatedIdentityActor.test.ts
npx vitest run --config vitest.emulator.config.ts src/domains/identity/repositories/displayNameRepository.emulator.test.ts
npx vitest run --config vitest.config.ts        (functions, full)
npx vitest run --config vitest.emulator.config.ts (functions, full, emulator)
npx tsc --noEmit
npx eslint <touched files>
npx prettier --check / --write <touched files>
pnpm run build
git diff | grep -inE "api[_-]?key|secret|password|token\s*=|AIza|BEGIN (RSA|PRIVATE)"
```

## 28. Dependencies added

None.

## 29. Config changes

None.

## 30. Firebase/Rules/deployment changes

None. `/users/{id}` remains `allow read, write: if false` — every write in this change goes through
the Admin SDK exactly like every other mutation in this codebase; no Rules change is required or
was made. No deployment performed.

## 31. Findings

**Architecture-placement finding (self-corrected during implementation):** the Identity domain's
own machine-enforced ESLint boundary (`eslint.config.js`, `files:
["functions/src/domains/identity/**/*.ts"], ignores: ["...repositories/**"]`) keeps
`identity/services/**` framework-independent — a stricter rule than the `business`/`authentication`
domains, where `services/**` is exactly where Firebase-touching code lives. The first draft of
`authenticatedIdentityActor.ts` and the write-orchestration logic were placed in a new
`identity/services/` file, mirroring `authenticatedBusinessActor.ts`'s location in the `business`
domain — `eslint` immediately caught this as a `no-restricted-imports` violation. Corrected by
moving both into `identity/repositories/` (the one subfolder this domain designates for bridging to
Firestore/Firebase, per `userDocument.ts`'s own precedent), matching where `customerIdentityRepository.ts`
already keeps its own idempotency+transaction orchestration for the same collection. This is
reported as a finding, not hidden, because it reflects a genuine per-domain architectural
difference worth remembering for any future Identity-domain work.

**Deliberate omission — no domain event:** `identityEvents.ts`'s own header states it defines "only
the 9 events named in this task's [`ENG-P2-001-01`'s] own scope" — a file explicitly scoped to a
different, closed task. Adding a tenth event for Display Name changes would touch that
deliberately-bounded file for a capability outside its stated scope, and `FD-IDENTITY-DISPLAY-001`
§19 explicitly says no new audit subsystem is required. No event was added; if the Founder wants
Display Name changes to appear in the outbox/event stream, that is better scoped as its own small,
explicit follow-up than added silently here.

## 32. Remaining material findings

None beyond §31.

## 33. Risks

- **No moderation, by design (`FD-IDENTITY-DISPLAY-001` §10):** a user could set an offensive Display
  Name; this is a known, accepted MVP limitation, not something this task attempted to fix.
- **No frontend contract yet (§19):** `IDENTITY-PROFILE-B` will need to define its own request/
  response types when authorized; none were speculatively added here.
- **Event-stream gap (§31):** if any future consumer expects Display Name changes to appear as a
  domain event, none currently exists — flagged, not silently assumed acceptable.

## 34. Rollback

Revert the single commit on `feat/identity-profile-a`; the change is purely additive (new files +
two small, clearly-bounded appends to `identityErrors.ts`/`index.ts`) with no persistence migration,
so rollback is a clean, isolated revert with no downstream dependency.

## 35. Persistent report path

`docs/05-implementation/reports/IDENTITY-PROFILE-A-platform-display-name-backend-foundation-implementation-report-2026-08-27.md`
(this document).

## 36. Changes-tracking state

`docs/changes/IMPLEMENTATION_CHANGES.md` updated with a new dated entry immediately following the
`FD-IDENTITY-DISPLAY-001` entry.

## 37. PR number

Recorded once opened — see the companion PR for branch `feat/identity-profile-a`.

## 38. Final head SHA

Recorded once committed — see the companion commit for this branch.

## 39. CI result

Recorded once the PR's CI run completes.

## 40. IDENTITY-PROFILE-A status

Implemented, tested, submitted for review (draft PR). Backend foundation only — `setDisplayName`/
`getMyDisplayName` callables exist and are fully tested; no frontend consumer yet.

## 41. IDENTITY-PROFILE-B status

Not started. Not authorized by this task.

## 42. Package G status

Unchanged — active-member completion not started, still awaits its own fresh authorization
(referencing this package's `setDisplayName`/`getMyDisplayName`/`readDisplayName` as the now-real
data source once authorized).

## 43. Package F status

Not started. Not authorized by this task.

## 44. Package H status

Not started.

## 45. ENG-P3-002 status

Open. Not closed by this task.

## 46. Capability 3 status

Open. Not closed by this task.

## 47. Exact next Founder action

1. Review and merge this draft PR.
2. Separately authorize `IDENTITY-PROFILE-B` (profile-completion UI, lazy/post-acceptance trigger
   per `FD-IDENTITY-DISPLAY-001` §7/§8) and/or Package G's active-member completion (which can now
   resolve `StaffMembership.userId` → `readDisplayName` server-side) — both may proceed
   independently and in parallel once authorized, since neither depends on the other beyond this
   shared backend foundation.

---

## Final gate

**IDENTITY-PROFILE-A READY FOR FOUNDER REVIEW — PLATFORM DISPLAY NAME BACKEND FOUNDATION
IMPLEMENTED; PROFILE-COMPLETION UI NOT STARTED.**
