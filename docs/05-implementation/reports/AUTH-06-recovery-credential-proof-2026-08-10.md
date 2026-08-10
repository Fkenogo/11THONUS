# AUTH-06 — Recovery Credential Proof (Implementation Report)

> **Title:** AUTH-06 — Recovery Credential Proof
> **Version:** 1.1 · **Status:** Implemented, test-first (TDD); one automated PR-review P1 corrected in place — pending Founder-authorized review/merge · **Classification:** Working (implementation report)
> **Governing document:** [`AUTH-BP` Authentication Blueprint](../roadmap/AUTH-BP-authentication-blueprint-2026-08-08.md) §8/§12/§15; [`ENG-P2-ARCH-001`](../roadmap/ENG-P2-ARCH-001-customer-identity-architecture.md) §7; [`DEC-AUTH-001`](../../00-governance/decisions/decision-register.md)
> **Source-of-truth path:** `docs/05-implementation/reports/AUTH-06-recovery-credential-proof-2026-08-10.md`
> **Last controlled update:** 2026-08-10 (`AUTH-06` — created; §16.1 v1.1 automated-review P1 correction — proof-reference bound to the verified proof)

**Authorization.** Founder-authorized — the **sixth** Authentication implementation package under `AUTH-BP`, authorized by the Founder in this task ("TASK — AUTH-06 Implementation"; the fresh, explicit implementation authorization the governing documents require before an `AUTH-*` package may begin; recorded per the AUTH-01/-02/-03/-04/-05 convention in the changes-log Entry 100, this report, `IMPLEMENTATION_CHANGES.md`, Master Workflow §17, and CDR-001 §5). AUTH-01–AUTH-05 and the merged Customer Identity concern (`ENG-P2-001-01…-10`) are prerequisites and are on `main`; they are treated as established architecture, not redesigned.

## 1. Entry state and prerequisite verification

- `origin/main` = `6c18ca6da373d5105ff895dfce4644910f0d8d95` after `git fetch --prune`.
- **AUTH-05 = merged/closed:** PR [#92](https://github.com/Fkenogo/11THONUS/pull/92) `MERGED` (merge commit `6c18ca6`), merged 2026-08-10T07:40:27Z by Kenogo; **post-merge CI green** (run 31366820398, workflow "CI", conclusion `success`).
- **Full prerequisite chain on `main`:** AUTH-01 (#87), AUTH-02 (#88), AUTH-CORR-001 (#89), AUTH-03 (#90), AUTH-04 (#91), AUTH-CORR-002 (#94), AUTH-05 (#92); the merged `-06` `identityLifecycleRepository` (`recoverCustomerIdentityStatus`), `-07` `identityRecoveryRepository` (`recoverCustomerIdentityByReference`) + `RecoveryProof` model, `-09` `identityLookupRepository`, the AUTH-02 `credentialResolutionService`/`TokenVerifierPort`, and the shared idempotency/outbox foundation.
- **Clean linked worktree** created directly from `origin/main`: branch `feat/auth-06-recovery-credential-proof`, HEAD `6c18ca6` (worktree base), `git rev-list --left-right --count origin/main...HEAD` = `0 0` at creation, clean status, no merge/rebase/cherry-pick in progress, no Git locks. The dirty primary worktree (`chore/eng-p1-001-closure`) was **not** touched (only read-only git commands ran against it); no unrelated linked worktrees were modified or cleaned up.

## 2. Programme-currency synchronization (Phase A2)

On entry the Master Workflow §17 and CDR-001 §5 still described **AUTH-05 as "pending Founder-authorized review/merge" / "reconstructed on `main`; not self-merged; AUTH-06+ not started"** (AUTH-05's own resumption bullet), never reconciled after PR #92 merged. Per repository convention this was corrected with **dated superseding notes** — a new "AUTH-05 merge/closure sync" bullet in Master Workflow §17 and a `[UPDATED 2026-08-10 — AUTH-05 merged]` note in CDR-001 §5 — preserving the historical text (no old report rewritten), and AUTH-06 recorded as the current freshly authorized task. No code, capability boundary, or numbering changed; no competing source of truth was created.

## 3. Scope (AUTH-BP §8/§12/§15)

**Recovery credential proof** — the authentication-layer step of account recovery: **perform the provider proof** and hand a *proven* `RecoveryProof` to the merged `-07` `identityRecoveryRepository`. AUTH-06 verifies a recovery provider credential (AUTH-02 `TokenVerifierPort`), resolves it to its **owning** Customer Identity through the AUTH-02 `resolveAuthenticatedCredential` (`-09`), constructs an `accepted` `RecoveryProof` bound to that identity, and delegates the actual status restoration to `-07`/`-06`. Location: `functions/src/domains/authentication/services/`.

**Not** in scope (deliberately untouched):
- the **out-of-band recovery entry / lookup surface** (§8 step 1) — resolving a candidate by Loyalty Number / QR / Customer Identity ID stays `-07`/`-09`; AUTH-06 **does not widen** it (it derives the target from the proven credential itself);
- **risk-based verification strength** (§8 step 4) — consumed as a reference (ITM), never computed by Authentication;
- **post-recovery provider re-linking** — the `-07` implementation report explicitly records that recovery "exposes no authentication-relinking action" and defers relink as a separate future concern; AUTH-06 performs the recovery proof only and does not link/relink providers (that is `-08`/AUTH-05 territory);
- **recovery eligibility / state machine** — which statuses are recoverable (`suspended`/`locked`) stays `-06`-owned; AUTH-06 forwards and `-06` fails closed on a non-recoverable state;
- the `AuthenticationRecoveryProofProvided` **event emission** (AUTH-08 — see §6); `CustomerAuthenticated` (AUTH-08); session/access gating (AUTH-07); frontend recovery UI; duplicate-identity **merge**; any new error category; any change to `-06`/`-07`/`-08`/`-09`/AUTH-01–AUTH-05 or the shared idempotency facility.

## 4. Authoritative requirement, acceptance criteria & boundaries

**Requirement (AUTH-BP §8).** (1) an out-of-band entry resolves a candidate identity — *not* AUTH-06; (2) **Authentication performs the actual provider proof (OTP/Google) and constructs a proven `RecoveryProof`**; (3) hand the proven reference to `identityRecoveryRepository` (`-07`), which validates no duplicate, transitions status (`-06`), preserves history/loyalty/QR/trust references, and emits `IdentityRecovered`; (4) risk-based verification strength is proportional to risk — consumed as a reference, not computed by Authentication.

**Design decision — target derived from the proof (identity integrity).** The recovery target is **always** the identity that the verified recovery credential resolves to (`-09`), never a caller-supplied id. A caller can therefore only recover the identity that actually owns the proven provider — closing the account-takeover vector a caller-supplied target would open. A credential resolving to no identity fails closed (`RESOURCE_NOT_FOUND`, enumeration-resistant) before any `-07` mutation. This mirrors AUTH-05's `resolveActingIdentity` pattern; unlike AUTH-05 it applies **no active-state gate** — recovery is *for* non-active identities, and recovery eligibility is `-06`'s to enforce.

**Acceptance criteria (AUTH-BP §15 exit criteria):** acceptance met verbatim; unit + real-emulator tests pass; local validation actually run; report + changes-tracking produced; committed/pushed; no unrelated files modified; no credential material persisted (verified).

**Events owned:** none — AUTH-06 emits nothing itself. **Events consumed (emitted by `-06`/`-07`):** `IdentityRecovered` (`identity.identity_recovered.v1`). **Explicitly deferred:** `AuthenticationRecoveryProofProvided` (AUTH-08); `CustomerAuthenticated` (AUTH-08).

**Responsibility boundaries preserved:** AUTH-02 owns token verification + credential→identity resolution; AUTH-03 owns registration/sign-in; AUTH-05 owns linking/unlinking; `-07`/`-06` own recovery orchestration/state; `-08`/`-09` own reference ownership/resolution; the shared idempotency facility remains authoritative.

## 5. Files created / modified

**Created:**
- `functions/src/domains/authentication/services/identityRecoveryService.ts` — the AUTH-06 orchestration (`recoverAuthenticatedIdentity`): map provider → recovery method category, resolve the proven credential to its owning identity, construct the `accepted` `RecoveryProof`, hand it to `-07`.
- `functions/src/domains/authentication/services/identityRecoveryService.test.ts` — 7 unit tests (mocked seams).
- `functions/src/domains/authentication/services/identityRecoveryService.emulator.test.ts` — 6 real-emulator tests (through the actual `-09`/`-07`/`-06`).
- `functions/src/domains/authentication/services/identityRecoveryEndpointService.ts` — the endpoint composition (`handleRecoverIdentity`): verify the recovery credential via `TokenVerifierPort`, build a governed envelope/command, delegate, shape a credential-free result.
- `functions/src/domains/authentication/services/identityRecoveryEndpointService.test.ts` — 2 unit tests.

**Modified (additive only):**
- `functions/src/index.ts` — one additive `recoverAuthenticatedIdentity` `onCall` (+ `parseRecoverIdentityRequest`); no existing callable changed. The `CATEGORY_TO_HTTPS` map already covers every AUTH-06 outcome (`RESOURCE_NOT_FOUND`, `ACCOUNT_SUSPENDED`, `AUTH_FORBIDDEN`, `INVALID_STATE_TRANSITION`).

No change to `-06`/`-07`/`-08`/`-09`, AUTH-01–AUTH-05, the shared idempotency/outbox facility, `firestore.rules`, or any `apps/web` file.

## 6. Domain events

AUTH-06 **emits no domain events of its own**, consistent with AUTH-03/AUTH-05 and the explicit `authenticationEvents.ts` boundary ("Emission … is AUTH-08, not this module"). The recovery state-change event `IdentityRecovered` is emitted by the merged `-06`/`-07` inside their own recovery transaction. The `AuthenticationRecoveryProofProvided` fire-and-forget trust signal (AUTH-BP §10; contract already declared by AUTH-01) is a fire-and-forget ITM/audit signal whose **emission is deferred to AUTH-08**, per §12's responsibility allocation — examined against §8/§10 wording and deferred, exactly as AUTH-03 deferred `CustomerAuthenticated`.

## 7. Security / privacy / identity integrity

- **No credential material** is read, written, logged, or returned (TRD10 §10.6.1): the orchestration references no `rawToken`/OTP/secret; the endpoint verifies the token and discards it; the constructed `RecoveryProof.proofReference` is an **opaque, CSPRNG-generated** identifier (never a credential/token/OTP). Secret grep over the AUTH-06 `functions/` diff: clean (the only `rawToken` occurrence is the endpoint input field name).
- **Identity integrity:** the recovered identity is derived solely from the resolved owner of the proven provider — a foreign or unlinked credential cannot recover another identity (fail closed, enumeration-resistant `RESOURCE_NOT_FOUND`). Proven with the "proving B recovers B, never a co-suspended A" emulator test.
- **Fail-closed & closed taxonomy:** every error is one of the closed 14 categories (no new category). A deferred provider (no recovery mapping) fails closed (`AUTH_FORBIDDEN`); a non-recoverable state is refused by `-06`.
- **No client write path** opened (Admin-SDK callable); deny-by-default Rules unchanged.

## 8. Idempotency / concurrency / recovery semantics

Idempotency is **consumed** from `-07`, not re-implemented: the client key is namespaced (`authentication.recover:<key>`) with a deterministic, credential-bound `requestHash` (equal across retries). A same-key retry short-circuits inside `-07`'s `checkAndReserveIdempotencyKey` (`duplicate` → returns the current identity) **before** the freshly-generated `proofReference` is consulted, so recovery occurs exactly once and a single `IdentityRecovered` is emitted (proven by the emulator retry test). `-07`'s own proof-reuse rejection and transactional status restoration are unchanged. The client idempotency key is validated up front by AUTH-03's `assertSafeIdempotencyKey` (rejects path-bearing / unsafe keys before any resolution or recovery).

## 9. Tests added — RED → GREEN

All new behaviour was authored test-first (module-absent RED → GREEN):
- **Unit — `identityRecoveryService.test.ts` (7):** resolves the proven credential and hands an `accepted` proof to `-07` (target derived from the proof); `google_sign_in` → `linked_provider`; resolves-to-no-identity → `RESOURCE_NOT_FOUND`, `-07` never called; unsafe idempotency key rejected before resolution/recovery; a `-07` error propagates unchanged; deterministic namespaced key + request hash across retries; no credential material on the constructed proof.
- **Unit — `identityRecoveryEndpointService.test.ts` (2):** verifies the credential and delegates with a governed envelope/command, returning a credential-free result; a verifier failure fails closed without calling the orchestration.
- **Real Firebase Emulator — `identityRecoveryService.emulator.test.ts` (6):** recover a suspended identity by proving its still-controlled phone provider (→ `active`, `identity.identity_recovered.v1` emitted); `google_sign_in` proof → `linked_provider`; **target derived from the proof** (proving B recovers B; a co-suspended A untouched); resolves-to-no-identity → `RESOURCE_NOT_FOUND`, no state change; same-key retry recovers exactly once (single `IdentityRecovered`); an **active** identity is refused by `-06` (recovery-not-permitted), no state change.

## 10. Validation results (from the clean worktree)

- `pnpm -r typecheck` — clean (functions + web). `pnpm lint` (`eslint .`) — clean. `pnpm format:check` — clean. `pnpm build` — clean (functions + web, PWA generated).
- `pnpm --filter functions test` — **functions 522/522** (+9 AUTH-06 unit tests; 513 → 522).
- `pnpm --filter web test` — **web 300/300** (unchanged; no `apps/web` change).
- `pnpm emulators:validate` — **full suite 211/211** (19 files; +6 AUTH-06 emulator tests; 205 → 211). No inherited flake recurred on this run.
- e2e (Playwright) — run by CI (canonical gate); AUTH-06 is backend-only (functions), no `apps/web` change.
- Secret/security scan over the AUTH-06 diff — clean.

## 11. Commands executed (key)

`git fetch --prune`; `git rev-parse origin/main`; `gh pr view 92`; `gh run list --branch main`; `corepack pnpm install`; `pnpm --filter functions test`; `pnpm -r typecheck`; `pnpm lint`; `pnpm format:check`; `pnpm --filter web test`; `pnpm build`; `pnpm emulators:validate` (`firebase emulators:exec … test:emulator`).

## 12. Dependencies / configuration / migrations

**Dependencies added:** none. **Configuration changes:** none. **Migrations / schema:** none (recovery consumes the existing `users`/`recoveryProofReferences` collections through `-07`; no new collection or index).

## 13. Risks / observations / verified inherited flakes

- **Risk:** low — additive backend orchestration over already-merged, tested interfaces; no completed capability modified.
- **Verified inherited flakes (not touched):** the `ENG-P1-002-CR1` command-dispatcher / identity-lifecycle concurrency-timing flake and the `EXT-TECH-001` phone-auth-harness latency flake are environmental and unrelated to AUTH-06 (the `functions/` recovery paths they touch are unchanged by AUTH-06); they did not recur on this run's `emulators:validate` (211/211). CI is the authoritative emulator gate.
- **Observation:** `AuthenticationRecoveryProofProvided` and `CustomerAuthenticated` remain AUTH-08 concerns; the `-07` "deferred provider relink" note is dispositioned as out-of-scope (§3).

## 14. Rollback

`git revert` of this package's commit(s), or discard the branch — not merged. Removes the five `identityRecovery*` modules and the additive `recoverAuthenticatedIdentity` callable; restores `index.ts` to its prior shape. No data/migration impact.

## 15. Version control / PR

- Branch: `feat/auth-06-recovery-credential-proof` (off `origin/main` `6c18ca6`).
- Commit: `b34203edf6b375cb70ffb267f44fa5fc7fae6b55`.
- PR: [#95](https://github.com/Fkenogo/11THONUS/pull/95) (base `main`). **Not** self-merged; AUTH-07+ not started.

## 16. PR / CI / final review gate

- **PR:** [#95](https://github.com/Fkenogo/11THONUS/pull/95).
- **First reviewed head:** `b34203edf6b375cb70ffb267f44fa5fc7fae6b55` — CI **success** (run 31370677780). **Corrected head (P1 fix):** `e3a817a…` (see §16.1).
- CI annotations were only pre-existing Node-20 / setup-java-v4 deprecation warnings (not AUTH-06-related, non-blocking).

### 16.1 Review-findings disposition

The automated reviewer (`chatgpt-codex-connector`) posted **one** finding against head `b34203e`; no human review comments; no other unresolved threads.

| # | Finding | Severity | Validity | Disposition |
|---|---|---|---|---|
| R1 | **Bind proof references to the verified provider proof.** A fresh random `proofReference` per request defeats `-07`'s proof-reuse protection — a captured still-valid token replayed with a new idempotency key after a later re-suspension mints an unused `recoveryProofReferences` doc each time, so one captured proof can repeatedly undo administrative suspensions. | **P1** | **Valid** (in AUTH-06 scope — AUTH-06 constructs the proof reference; security / identity-integrity / idempotency) | **Fixed** — the endpoint now derives the `proofReference` as a one-way SHA-256 digest of the **verified token** (`authrec:<hex>`) and the service uses it verbatim instead of a random UUID. The same captured proof yields the same reference and is rejected by `-07`'s reuse protection; a genuinely new authentication (a fresh token) yields a new reference so a later legitimate recovery still succeeds. The digest is one-way, non-reversible, and not a credential (TRD10 §10.6.1); the token is never persisted/logged/returned. **Regression coverage added:** endpoint unit test (stable-per-token, opaque, non-token) + emulator test (replay of the same proof after a re-suspension is refused; identity stays suspended). Fixed **entirely within AUTH-06** — no AUTH-02/`-07`/completed-capability change. Commit `e3a817a`. |

**Re-validation after the fix (corrected head `e3a817a`):** functions **523/523** (+1), web **300/300**, `pnpm emulators:validate` **212/212** (+1 anti-replay regression); typecheck/lint/format/build clean; secret scan clean.

- **No unresolved material P1/P2 finding remains.** (Confirmed again against the corrected head after CI — §16.2.)

### 16.2 Second review pass (corrected head)

- **Corrected code head:** `c7741aa5dd5ca0ee796042a8192afdfbd5921bbc` — CI **success** (run 31372494254, "Build, Lint, Test, Emulator Validation").
- **Re-inspection of all review comments against the corrected head:** the sole automated P1 inline comment (anchored to the superseded head `b34203e`, `original_line` 159) now maps to no line in the current diff (`line: null`) — GitHub marks it **outdated** because the random-UUID line it flagged was replaced by the verified-proof-bound reference. No human review comments (0); no other reviews; no unresolved threads.
- **Result:** the only finding is R1 (P1), **fixed and regression-covered** on `c7741aa`. **No unresolved material P1/P2 finding remains** (correctness / security / privacy / identity integrity / concurrency / atomicity / retry / idempotency / architecture / responsibility boundaries / data integrity).
- **Final reviewed code head:** `c7741aa5dd5ca0ee796042a8192afdfbd5921bbc`. Any subsequent commit on the branch is **documentation-only** (this disposition record); its CI is recorded with the completion report.

## 17. Final gate

**AUTH-06 READY FOR FOUNDER REVIEW/MERGE.** Acceptance criteria met verbatim; TDD RED→GREEN; functions 523/523, web 300/300, `emulators:validate` 212/212, typecheck/lint/format/build/secret-scan clean; CI green on the final reviewed code head `c7741aa`; the one automated P1 finding fixed with regression coverage and no unresolved material P1/P2 finding remaining. **Not** self-merged; AUTH-07+ not started; the dirty primary worktree untouched; no unrelated worktree cleanup performed.

## 17. Final gate

_See the completion report / final gate statement._
