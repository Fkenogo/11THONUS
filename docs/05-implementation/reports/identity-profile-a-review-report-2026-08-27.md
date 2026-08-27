# `IDENTITY-PROFILE-A-REVIEW` — Independent Review, Correction, Merge & Closure (2026-08-27)

**Independent review of draft PR #189, performed in a fresh isolated worktree checked out at the
PR's exact head — the implementation report was not trusted as proof; the authorized capability
was re-derived directly from `FD-IDENTITY-DISPLAY-001`/`FD-IDENTITY-001`/`DEC-IDENTITY-001`/TRD10,
every write/read path was traced against real source, and the fix was mutation-tested. One genuine
test-coverage gap found and corrected on the PR. Merged clean.**

## 1. Entry PR/head/CI

- `gh pr view 189`: `baseRefName main`, `headRefOid 3a2e21ff018b98ac8fb5ebc451d2aeefe669b786`
  (matches the reported submitted head exactly), `isDraft true`, `mergeable MERGEABLE`,
  `mergeStateStatus CLEAN`, `commitCount 1` — no later unreviewed commit at entry.
- `gh pr checks 189` at entry: **pass** (`Build, Lint, Test, Emulator Validation`, 5m57s).
- `FD-IDENTITY-DISPLAY-001` (`82bd5c6`) and `FD-P3-002-G-001` (`b2e9116`) both independently
  reconfirmed ancestors of `origin/main` (`git merge-base --is-ancestor`).
- No `IDENTITY-PROFILE-B`/Package-G-completion/Package-F/Package-H branch or PR existed
  (`git branch -a`, `git ls-remote --heads origin`, both empty for those patterns).
- Fresh isolated worktree created at the exact PR head, detached HEAD.

## 2. Final reviewed head

`3332934450ef0916993a24400e0a922e25ebdf81` (one correction commit added on the PR branch, see §7).

## 3. Governing-authority result

Independently re-derived, not trusted from the implementation report: `FD-IDENTITY-DISPLAY-001`
(re-read in full) authorizes exactly — authoritative `users.displayName`; authenticated self-write;
authenticated self-read; missing-value support (absent, never fabricated); the exact §5 MVP
validation contract. It does **not** authorize generic profile editing, editing another person's
Display Name, Business-Owner Staff-name editing, directory/search, `CustomerProfile` name reuse,
Firebase Auth `displayName` sync, photo, telephone, moderation, uniqueness, Package G projection, or
frontend UI. **Confirmed: the implementation is limited to exactly the authorized set** — no file
in the diff touches `apps/web/`, `customerProfile.ts`, Firebase Auth data, photo/Storage, or
telephone; no Package G/F file was touched.

## 4. User-schema result

TRD10 §10.6.1 re-confirmed directly: `displayName: string` (required) on the `users` document,
alongside `authUid`/`primaryPhone?`/`primaryEmail?`/etc. — none of which this PR populates or
reads. `DEC-IDENTITY-001`'s Standard Participation Principle re-confirmed via
`customerIdentity.ts`'s own header citation; the PR introduces no registration-time gate (no file
in the diff touches `registrationSignInService.ts` or `customerIdentity.ts`'s registration path).

## 5. Authoritative-field result

**Clean.** `users/{userId}.displayName` used exactly as authorized; no `StaffMembership.displayName`,
`UserDisplayProfile` collection, or any second identity source anywhere in the diff (confirmed by
direct read of every new/modified file).

## 6. Write-path result

Traced `setDisplayName` end-to-end: `index.ts`'s `setDisplayName` callable →
`parseSetDisplayNameRequest` → `resolveAuthenticatedIdentityActor` → `displayNameRepository.ts`'s
`setDisplayName` → `checkAndReserveIdempotencyKey` → `db.runTransaction` (`getCustomerIdentityById`
fail-closed check + `transaction.update()`) → `completeIdempotencyKey`/`failIdempotencyKey`. All
nine Phase C checks independently verified:
1. **Server-derived caller identity** — confirmed (§8).
2. **No target `userId`/selector in the request** — confirmed by direct read of
   `parseSetDisplayNameRequest`'s return object (exactly `rawToken`/`referenceType`/`displayName`/
   `idempotencyKey`).
3. **Caller cannot update another User** — confirmed structurally (no target field exists to
   supply) and now also proven by a dedicated regression test (§7).
4. **Only `displayName` + legitimate write metadata modified** — `transaction.update(ref, {
   displayName, ...stampUpdate(...) })` touches exactly those keys.
5. **Unrelated fields survive** — proven by the existing "unrelated User fields are preserved"
   emulator test, and independently reconfirmed by mutation (§22).
6. **Cannot create/normalize a malformed User document** — `setDisplayName` never creates a `users`
   document; it only ever `.update()`s an existing one, gated by `getCustomerIdentityById`'s prior
   existence/shape check inside the same transaction.
7. **Missing User document fails closed** — `getCustomerIdentityById` throws `RESOURCE_NOT_FOUND`;
   proven by the "fails closed for a target Customer Identity that does not exist" emulator test.
8. **Schema integrity enforced** — `getCustomerIdentityById`'s `fromUserDocument` call fails closed
   (`VALIDATION_FAILED`) on any malformed stored shape; no new integrity logic bypasses this.
9. **No full-document round-trip can erase `displayName` later** — see §10, independently and
   exhaustively verified, not merely accepted from the report's reasoning.

## 7. Server-derived-identity result

**PASS.** `resolveAuthenticatedIdentityActor` derives `userId` exclusively from a verified provider
credential (`TokenVerifierPort` → `resolveAuthenticatedCredential`) — no request field feeds
`userId` directly. Confirmed by direct read of `authenticatedIdentityActor.ts` and its own unit
tests (unchanged by this review).

## 8. Cross-user-spoofing result

**Genuine test-coverage gap found and corrected (§ Corrections).** The transport-layer parsers
(`parseSetDisplayNameRequest`/`parseGetMyDisplayNameRequest`) were already safe **by construction**
(only named fields are copied into the returned object — a client-supplied `userId`/
`customerIdentityId`/`targetUserId` was already silently dropped, verified by direct code read
before any fix), but — unlike every other authority-sensitive parser in this codebase
(`parseCreateBusinessCommand`, `parseBusinessProfilePatch`, `parseCreateStaffInvitationRequest`,
`parseAcceptBusinessTermsRequest`, all of which have a dedicated exported "mass-assignment
boundary" regression test) — this safety property was **unverified by any test**. This is exactly
the kind of silent regression risk a future refactor could reintroduce without any test failing.
Classified as a genuine finding requiring correction, not a hypothetical. Fixed on the PR (§
Corrections) with RED→GREEN evidence.

## 9. Targeted-update safety result

**PASS, proven by direct mutation, not merely accepted from the report.** Temporarily changed
`setDisplayName`'s `transaction.update(...)` to `transaction.set(...)` (simulating the exact
full-document-overwrite defect this section asks to rule out) — 4 of 13 emulator tests immediately
failed, including the exact "unrelated User fields are preserved" test and two cascading
`readDisplayName` failures caused by the resulting malformed document (missing `id`/`status`/etc.
that `.set()` no longer preserved). Reverted; confirmed byte-identical to the pre-mutation file via
`diff`; all 13 tests green again. The `getCustomerIdentityById` pre-check inside the same
transaction and the `.update()` (never `.set()`) combination is proven safe, not merely reasoned
about.

## 10. Existing serializer/write-path compatibility result

**Clean — independently and exhaustively verified (Phase H).** Searched the entire repository for
every place a `users/{id}` document is parsed, serialized, replaced, updated, or transactionally
rewritten (`grep -rln '"users"' functions/src`), then read every write call in every matching file:

- `customerIdentityRepository.ts` — the **only** full-document `.set()` on `users/{id}` anywhere in
  the codebase, and it is gated by `if (snapshot.exists) throw duplicateCustomerIdentityError` —
  structurally can never fire against an existing document (the only case where `displayName`
  could already be set). Create-only, not a destructive path.
- `identityLifecycleRepository.ts` (status transitions, identity recovery) — `transaction.update(ref,
  { status, ...stampUpdate(...) })` only.
- `authenticationReferenceRepository.ts` (link/unlink provider) — `transaction.update(identityRef,
  { authenticationReferences, ...stampUpdate(...) })` only, at both call sites.
- `identityLookupRepository.ts` — read-only, no writes at all.
- `registrationSignInService.ts` — references the collection name only for lookup; delegates all
  actual writes to `createCustomerIdentity` (already covered above).
- `displayNameRepository.ts` itself (this PR's own file) — `transaction.update()` only, per §9.

**No existing or new write path performs a full-document `.set()` against an existing `users/{id}`
document anywhere in this codebase.** `.update()`'s Firestore semantics leave every unlisted
top-level field (including `displayName`, once set) untouched by construction. No material finding
here — the report's own reasoning is independently confirmed correct, not merely trusted.

## 11. Read-path result

Traced `getMyDisplayName` end-to-end: callable → `parseGetMyDisplayNameRequest` (no target field,
confirmed) → `resolveAuthenticatedIdentityActor` → `displayNameRepository.ts`'s `readDisplayName`
→ `getCustomerIdentityById` (fail-closed existence/integrity) → direct raw-document field read.
Self-read only (no arbitrary-user parameter anywhere in the request or the repository function
signature); no `CustomerProfile`/Firebase Auth fallback (confirmed absent by grep and by the
"never falls back" emulator test); no email/phone exposure (the DTO returns only `displayName`);
malformed User documents fail closed via the same `getCustomerIdentityById` reuse. **No general
user directory was created** — `readDisplayName`'s only parameter is the id the caller already
proved ownership of via `resolveAuthenticatedIdentityActor`; there is no code path that accepts an
arbitrary id from a request.

## 12. Missing-name result

**PASS.** `extractDisplayName` returns `undefined` for an unset/non-string/empty value — never a
placeholder. Proven by the "represents a missing Display Name as genuinely absent" test, and
independently reproven by mutation (§22, item 5).

## 13. Validation result

**PASS**, independently re-verified against `FD-IDENTITY-DISPLAY-001` §5 line by line: trim ✓,
empty rejected ✓, whitespace-only rejected ✓, 1 char accepted ✓, 50 accepted ✓, 51 rejected ✓,
Unicode accepted ✓, duplicate Display Names accepted (no uniqueness check exists anywhere) ✓, no
username/handle syntax (no regex/format restriction beyond length) ✓, no moderation/profanity
subsystem (confirmed absent) ✓.

## 14. Unicode-character-counting result

**Classified explicitly, per this task's own instruction, rather than silently accepted.**
`normalizeDisplayName` measures length via JavaScript's `string.length` — UTF-16 **code units**,
not Unicode codepoints or grapheme clusters. For all Basic Multilingual Plane content (ordinary
Latin, accented Latin, most CJK, Korean, Cyrillic, Arabic, etc.) code-unit length equals
human-perceived character count, so no mismatch exists for the overwhelming majority of real names.
For **astral-plane characters** (many emoji, some rare CJK Extension B+ characters, mathematical
alphanumeric symbols) — each counts as **2** code units, and grapheme clusters built from multiple
codepoints (skin-tone-modified emoji, ZWJ sequences, some combining-mark sequences) count even
higher. The practical effect: the effective limit for astral-plane-heavy content is stricter than a
literal "50 characters" reading would suggest (e.g., 50 basic emoji would already exceed the limit
at 25, since most emoji are 2 code units each). **This was already disclosed in the implementation's
own code comment** (`displayName.ts`: "Unicode is measured in UTF-16 code units... no
grapheme-cluster segmentation is invented here") — not silently redefined. `FD-IDENTITY-DISPLAY-001`
§5 itself does not specify code-unit vs. codepoint vs. grapheme-cluster semantics, so this is a
reasonable, explicitly-disclosed MVP interpretation, not a defect. **No correction required** — the
ambiguity is inherent to the disposition's own plain-language wording, and `Intl.Segmenter`-based
grapheme counting would be new, unauthorized behavior to introduce unilaterally. Recorded here as a
classified finding for future reference, consistent with the task's explicit instruction not to
silently redefine "character."

## 15. Non-uniqueness result

**PASS**, independently reconfirmed: no uniqueness index, reservation collection, or lookup-by-name
capability exists anywhere in the diff. Emulator test proves two distinct identities share a
Display Name without conflict.

## 16. CustomerProfile boundary

**PASS.** Zero references to `customerProfile`/`CustomerProfile`/`firstName`/`lastName` anywhere in
the 8 touched/new `functions/` files (confirmed by `grep`). The "never falls back to CustomerProfile
or Firebase Auth data" emulator test independently proves the seeded `users` document itself has no
such fields to fall back to even if the code tried.

## 17. Firebase Auth boundary

**PASS.** `authenticatedIdentityActor.ts` uses Firebase Auth (via `TokenVerifierPort`) strictly for
credential verification (proving *who is calling*), never as a data source — no
`getUser().displayName`/email/phone read anywhere in this PR's diff.

## 18. Directory/search prohibition result

**PASS.** No new query, no lookup-by-name/email, no list/search endpoint anywhere in the diff.
`readDisplayName`'s sole parameter is always the caller's own resolved id.

## 19. Idempotency result

**PASS.** `setDisplayName` reuses the existing, already-governed `checkAndReserveIdempotencyKey`/
`completeIdempotencyKey`/`failIdempotencyKey` facility — the same one every other mutating command
in this codebase already uses (`createCustomerIdentity`, `acceptStaffInvitation`,
`updateBusinessProfile`). No new locking/versioning mechanism was introduced; none was needed —
Firestore's own transaction protocol already serializes concurrent writers to the same document,
and idempotency-key reservation prevents a client retry from double-processing. This does not
create undesirable "ordinary profile editing" semantics: two *different* legitimate sequential
updates (different idempotency keys) both succeed and the later one wins — proven by the "updates
an already-set Display Name" test (§20).

## 20. Concurrency result

**PASS**, proven by three tests, independently re-run: identical retry (same key, same content) →
same result, no second write (§ idempotent test); sequential update to a different value (different
keys) → the later value wins, exactly last-write-wins, matching every other identity mutation's
existing semantics (§ "updates an already-set Display Name"); failed attempt → reservation rolls
back, an identical retry with corrected preconditions succeeds (§ rollback test, fixed for a genuine
test-design flaw during original authoring — verified the fix itself, not just the passing result).
True concurrent (simultaneous) writes are not separately stress-tested — consistent with this
codebase's own precedent (`createCustomerIdentity` has no such test either), relying instead on
Firestore's platform-guaranteed transaction isolation. Not a gap requiring correction.

## 21. Privacy/security review

Independently re-verified against every item in Phase G: no `CustomerProfile` first/last name, no
email, no phone, no Firebase Auth `displayName`, no provider identity/IDs, no authentication
metadata, no arbitrary `users` field beyond `displayName`/`updatedAt`/`updatedBy` is read or
exposed anywhere in the diff. No new directory/search/list endpoint. Errors
(`invalidDisplayNameError`, `identityActorNotEligibleError`) do not echo the submitted value or any
protected identity data into their messages — confirmed by direct read of both factories.

## 22. Mutation-testing evidence

Performed and fully reverted (confirmed byte-identical via `diff` after each revert):

1. **Client-supplied target user ID / writing another User's Display Name (items 1-2):** not
   mutated directly (the request parsers have no target field to mutate into a vulnerability without
   changing the type signature) — instead **closed the coverage gap** with a dedicated
   mass-assignment regression test (RED→GREEN, §7/§ Corrections), the correct response per Phase K
   when the gap is in test coverage rather than in behavior.
2. **Whitespace-only input accepted (item 3):** disabled the min-length check in
   `normalizeDisplayName` — 3 of 10 unit tests failed (empty, whitespace-only, category checks).
   Reverted; confirmed byte-identical; 10/10 green.
3. **>50 characters accepted (item 4):** already directly covered by the existing "rejects a
   51-character value" unit test — verified this test genuinely exercises the boundary (not
   re-mutated separately, since removing the max-length check would trivially fail that exact,
   already-present assertion).
4. **Fabricating a missing name (item 5):** changed `extractDisplayName`'s fallback from
   `undefined` to `"Unnamed User"` — 2 of 13 emulator tests failed (the missing-value test and the
   no-fallback test). Reverted; confirmed byte-identical; 13/13 green.
5. **Firebase Auth/CustomerProfile fallback (item 6):** not applicable to mutate — no such import
   exists anywhere in the new code to introduce a fallback from without adding a new dependency,
   which would itself be the material finding this task warns to watch for. Confirmed absent by
   `grep` instead (§16/§17).
6. **Overwriting unrelated User fields (item 7):** changed `setDisplayName`'s `transaction.update()`
   to `transaction.set()` — 4 of 13 emulator tests failed (§9). Reverted; confirmed byte-identical;
   13/13 green.

All mutations were performed on already-tracked files and fully reverted before continuing; no
shared production infrastructure (Firestore Rules, CI config, other domains) was mutated.

## 23. Findings

**One genuine finding, corrected (see §24).** The transport-layer request parsers
(`parseSetDisplayNameRequest`/`parseGetMyDisplayNameRequest`) were safe by construction but
untested — the only authority-sensitive parsers in this codebase without their own
"mass-assignment boundary" regression test, breaking an otherwise-universal convention. No other
material finding across Phases B-J; the Unicode-character-counting nuance (§14) is classified, not
corrected, per the task's own instruction (an inherent ambiguity in the disposition's plain-language
wording, already explicitly disclosed in code, not a defect).

## 24. Corrections performed

On PR #189 (commit `3332934`):
1. Exported `parseSetDisplayNameRequest`/`parseGetMyDisplayNameRequest` (previously
   module-private), mirroring `parseCreateBusinessCommand`'s own "Exported only for the
   mass-assignment regression test" precedent exactly.
2. Added two new `describe` blocks to `index.test.ts` (4 new tests) proving: a client-supplied
   `userId`/`customerIdentityId`/`targetUserId`/`updatedBy`/`updatedAt` is structurally absent from
   the parsed output even when present on the payload; missing/non-string `displayName` is
   rejected; missing `rawToken`/`idempotencyKey` is rejected.
3. **RED→GREEN demonstrated explicitly:** temporarily reverted the `export` keywords — the test
   file failed to even import the (now again private) functions (`TypeError: ... is not a
   function`), 2 of 21 tests failing. Restored `export` — all 21 tests passed.
4. One incidental lint fix during the correction (`@typescript-eslint/no-unused-vars` on a
   destructuring-omit pattern in the new test) — rewritten to an equivalent, lint-clean form with
   identical test semantics.

No production behavior changed by this correction — export + tests only. No unrelated file was
touched; no unrelated improvement was absorbed.

## 25. Full validation

Re-run fresh, on the corrected head, after the correction:

- **Focused Display Name tests:** PASS (10 + 6 + 13 = 29/29, plus the 4 new mass-assignment tests
  in `index.test.ts` = 21/21 in that file).
- **Full functions unit suite:** PASS — 145 files, 1583 tests (up from 1579 pre-correction, +4 new).
- **Full Firebase Emulator Suite:** PASS — 53 files, 701 passed, 2 pre-existing unrelated skips.
- **Web tests:** not run — no `apps/web/` file touched by this PR or this review; shared contracts
  unchanged.
- **Typecheck:** clean.
- **Lint:** clean (one genuine lint error introduced by the correction's first draft was found and
  fixed — see §24 item 4).
- **Format:** `prettier --check` found one issue in the corrected test file; fixed with `--write`,
  re-verified clean.
- **Build:** not independently re-run in this review (CI's own build step covers it; unchanged
  since the original PR's own successful build, and no build-affecting file was touched by the
  correction).
- **Secret scan:** `git diff` grepped for key/secret/token/password/`AIza`/PEM-header patterns — no
  matches.

No flake observed at any point; every failure encountered during this review was a deliberate,
fully-reverted mutation (§22) or the genuine, corrected coverage gap (§24) — none was a
false-positive/flaky result.

## 26. Files modified during review

- `functions/src/index.ts` (2 `export` keyword additions + 2 doc comments; no behavior change)
- `functions/src/index.test.ts` (2 new `describe` blocks, 4 new tests)
- This closure-sync report and the `docs/changes/IMPLEMENTATION_CHANGES.md` entry (this PR)

No other file was modified by this review. All mutation-testing changes (§22) were reverted before
committing anything.

## 27. Final code-diff summary

PR #189's final diff (across both commits): 10 files, 1290 + 77 insertions = 1367 total insertions,
0 deletions. The correction commit (`3332934`) is additive-only: 2 `export` keywords, 2 doc
comments, 4 new tests.

## 28. Commands executed

```
gh pr view 189 --json ...
gh pr checks 189
git fetch origin
git merge-base --is-ancestor 82bd5c6... / b2e9116... origin/main
git branch -a / git ls-remote --heads origin   (overlap search)
git worktree add <path> 3a2e21f... --detach
grep -rn '"users"' functions/src --include="*.ts" | grep -v test   (Phase H exhaustive search)
[read every matching file's write calls directly]
cd /Users/theo/11THONUS-identity-profile-a (the original authoring worktree, reused for the correction commit)
[export the two parsers; add tests]
npx vitest run src/index.test.ts   (RED, then GREEN)
npx tsc --noEmit / npx eslint / npx prettier --check --write
git add / commit / push
[mutation-testing cycle: cp <file> /tmp/<file>.orig; Edit; run tests; cp back; diff to confirm identical]
firebase emulators:start --only firestore,auth --project demo-11thonus
FIRESTORE_EMULATOR_HOST=... npx vitest run --config vitest.emulator.config.ts [focused, then full]
npx vitest run --config vitest.config.ts   (full unit)
gh pr checks 189   (post-correction)
gh pr ready 189
gh pr merge 189 --merge --delete-branch
git fetch origin
git cat-file -p <merge-commit>   (verify two-parent merge commit)
git merge-base --is-ancestor <merge-commit> origin/main
gh run list --repo Fkenogo/11THONUS --branch main
```

## 29. Dependencies

None added or changed.

## 30. Config/Firebase/Rules changes

None. `/users/{id}` remains `allow read, write: if false` — unaffected by this review or its
correction.

## 31. Merge SHA

`4137315b41e0ab7ff4e5cac3cffe90a2478bb73e` — a genuine two-parent merge commit (`git cat-file -p`
confirms parents `82bd5c6...` (`main` tip) and `3332934...` (the PR branch tip)), matching this
repository's own established `feat/`-PR merge convention (independently confirmed by inspecting the
merge commits of PRs #173/#179/#181, all two-parent merges, not squashes) — squash was deliberately
**not** substituted.

## 32. Closure-sync SHA

Recorded once this closure-sync PR is committed/merged — see the companion commit for branch
`docs/identity-profile-a-review-closure-sync`.

## 33. Post-merge CI

**Green on the third attempt — the two prior failures were pre-existing, unrelated environmental
flakiness, not a regression from this PR. Reported honestly, distinguished from regression with
direct evidence, not assumed.**

- **Attempt 1** (`gh run` `33078975365`, initial): **FAILED** — `identityLifecycleRepository.emulator.test.ts`
  > `two concurrent conflicting transitions resolve safely` timed out at exactly 5000ms
  (vitest's default test timeout). This file was **not touched by PR #189** (`git diff
  82bd5c6..4137315 --name-only | grep identityLifecycle` → no output) — confirmed unrelated by
  direct diff inspection, not assumption. All other 700/703 tests (2 pre-existing skips) passed.
- **Attempt 2** (`gh run rerun --failed`, same run id): **FAILED again — but a different,
  also-unrelated test**: `knowledgeNodeRepository.emulator.test.ts` >
  `two concurrent creations under the same fresh id race safely` — also timed out at exactly
  5000ms, in the unrelated `commerceKnowledge` domain, also untouched by this PR. A second,
  independent concurrency-race test hitting the identical failure mode.
- **Historical corroboration:** the same failure signature (`Test timed out in 5000ms` on a
  `Promise.allSettled`-based concurrency-race test) was found on `origin/main`'s CI history from
  **before this PR existed** — run `33047130065` (commit `3b029740`, 2026-08-27 06:47, well before
  `IDENTITY-PROFILE-A` began) failed identically in
  `staffMembershipIntegration.emulator.test.ts` > `SCENARIO 12 — concurrency`. This is a
  pre-existing, recurring pattern in this repository's CI environment (multiple unrelated domains'
  concurrency tests occasionally exceeding a tight 5000ms default timeout under variable
  shared-runner load), not something introduced by this PR.
- **Attempt 3** (`gh run rerun --failed`, same run id): **SUCCESS** — full suite green, no retry
  needed beyond this.

**Conclusion: this is a pre-existing, environment-level CI flake affecting concurrency-race tests
across at least four unrelated files/domains (`identityLifecycleRepository`, `knowledgeNodeRepository`,
`staffMembershipIntegration`, and by the same signature likely others), not a regression from
`IDENTITY-PROFILE-A`.** No file this PR touches shares any dependency with the failing tests. Fixing
the underlying timeout-margin issue (e.g., raising these tests' individual timeouts) is explicitly
out of this review's scope — it is a pre-existing, unrelated, cross-domain test-infrastructure
concern, not an `IDENTITY-PROFILE-A` authority question, and "do not absorb unrelated improvements"
(Phase K) directly governs this. **Flagged here as a genuine finding worth its own future,
separately-scoped correction task** (something like a `CORR-CONCURRENCY-TEST-TIMEOUT-001`), not
silently fixed or silently ignored.

## 34. Risks

Unchanged from the original implementation report (§33 there): no moderation by design (accepted
MVP limitation), no frontend contract yet (deliberate, no consumer exists), no domain event for
Display Name changes (deliberate, disclosed). This review adds one classified-but-accepted
observation: the UTF-16 code-unit "character" counting semantics (§14) may surprise a future
implementer working with heavily astral-plane content; already disclosed in code, now also
disclosed here. **New:** a pre-existing, cross-domain CI flakiness pattern (§33) — concurrency-race
tests occasionally exceeding a tight 5000ms default timeout under shared-runner load — surfaced
during post-merge validation, unrelated to this PR but worth its own future correction task.

## 35. Rollback

Revert the merge commit `4137315`; both constituent commits (`3a2e21f`, `3332934`) are purely
additive with no persistence migration, so rollback is a clean, isolated revert with no downstream
dependency.

## 36. Review-report path

`docs/05-implementation/reports/identity-profile-a-review-report-2026-08-27.md` (this document).

## 37. IDENTITY-PROFILE-A final status

**Merged and closed.** Platform Display Name backend foundation (`users.displayName` self-service
create/update/read) is live on `main`, fully within `FD-IDENTITY-DISPLAY-001`'s authorized scope,
independently reviewed, one coverage gap corrected, mutation-tested, CI-green.

## 38. IDENTITY-PROFILE-B status

Not started. Not authorized by this task.

## 39. Package G status

Unchanged — active-member completion not started; still requires its own fresh authorization
(can now resolve against this merged foundation once authorized).

## 40. Package F/H status

Both not started. Not authorized by this task.

## 41. ENG-P3-002 status

Open. Not closed by this task.

## 42. Capability 3 status

Open. Not closed by this task.

## 43. Exact next Founder action

Separately authorize `IDENTITY-PROFILE-B` (profile-completion UI) and/or Package G's active-member
completion — both may now proceed independently and in parallel, since the shared backend
foundation (`setDisplayName`/`getMyDisplayName`/`readDisplayName`) is merged, reviewed, and
available.

---

## Final gate

**IDENTITY-PROFILE-A MERGED AND CLOSED — PLATFORM DISPLAY NAME FOUNDATION AVAILABLE FOR SEPARATELY
AUTHORIZED CONSUMERS.**
