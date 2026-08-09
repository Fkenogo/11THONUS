# AUTH-04 — Frontend Sign-in Flows (Phone OTP + Google) (Implementation Report)

> **Title:** AUTH-04 — Frontend Sign-in Flows (Phone OTP + Google)
> **Version:** 1.0 · **Status:** Implemented (TDD) — pending fresh Founder-authorized review/merge · **Classification:** Working (implementation report)
> **Governing documents:** [`AUTH-BP`](../roadmap/AUTH-BP-authentication-blueprint-2026-08-08.md) §1/§3/§5/§6/§9/§12/§13/§15; [`AUTH-03` report](AUTH-03-registration-signin-orchestration-2026-08-08.md); [`ENG-P2-ARCH-001`](../roadmap/ENG-P2-ARCH-001-customer-identity-architecture.md) §7; [`DEC-AUTH-001`](../../00-governance/decisions/decision-register.md); [`DEC-TECH-005`](../../00-governance/decisions/dec-tech-005-firebase-region-decision-brief.md) (region)
> **Source-of-truth path:** `docs/05-implementation/reports/AUTH-04-frontend-sign-in-flows-2026-08-09.md`
> **Last controlled update:** 2026-08-09 (`AUTH-04` v1.0 — created)

**Authorization.** Founder-authorized — the **fourth** Authentication implementation package under `AUTH-BP`, authorized by the Founder in this task ("TASK — AUTH-04 Implementation"; the fresh, explicit implementation authorization the governing documents require before an `AUTH-*` package may begin; recorded per the AUTH-01/AUTH-02/AUTH-03 convention in the changes-log Entry 097, this report, `IMPLEMENTATION_CHANGES.md`, Master Workflow §17, and CDR-001 §5). AUTH-01, AUTH-02, AUTH-CORR-001, and AUTH-03 are prerequisites and are on `main` (AUTH-03 merged as `98896492…`; post-merge CI green); they are treated as established architecture, not redesigned.

## 1. Entry state and prerequisite verification
Verified from the repository before any change:
- `origin/main` = local `main` = `98896492075846b7df87b2d0e12fd5139aa1ced5`, divergence **0/0**, no git locks or in-progress operations.
- **AUTH-03 merged:** PR #90 `MERGED`; merge commit `98896492…` has parents `08aa1bc` (prior `main`) + **`f805edb`** (the *corrected* AUTH-03 head), so the corrected idempotency/atomicity implementation is on `main`, superseding the original `9c18cea`. Post-merge CI **success** (run 31307008689), merged 2026-08-09T09:53:47Z.
- Work performed in a **clean linked worktree** at `.claude/worktrees/auth-04` based directly on `origin/main`; the inherited dirty primary worktree (`chore/eng-p1-001-closure`) was **not** touched.
- Baseline before implementation: typecheck clean; web 258/259 (the one failure the pre-existing `ENG-P1-002-CR1`/`EXT-TECH-001` phone-auth-harness latency flake).

## 2. Programme-currency synchronization (Phase A2)
The AUTH-03 closure noted that Master Workflow §17 and CDR-001 §5 might still describe AUTH-03 as "pending review/merge". Both were **stale** and were reconciled with dated superseding notes recording AUTH-03 = merged/closed (PR #90, `98896492…`) and AUTH-04 = the next authorized implementation task. Historical wording preserved; no code, capability boundary, numbering, or competing source of truth introduced.

## 3. Scope (AUTH-BP §12/§15)
**Frontend sign-in flows** — Phone OTP (reCAPTCHA/App-Check) + Google — building on the merged `apps/web/src/infrastructure/firebase/*` composition root and the `dev/phoneAuthHarness` reference; **disabled-by-default** provider config; consuming the merged AUTH-03 `authenticate` callable. Location: `apps/web/src/authentication/*`.

**Not** in scope (deliberately untouched): session/access management — expiry, protected-action gating, privileged re-auth, sign-out (**AUTH-07**); account linking (**AUTH-05**); recovery proof (**AUTH-06**); the `CustomerAuthenticated` ITM/audit trust-signal emission (**AUTH-08** — AUTH-04 emits **no** domain events); any `functions/` change; any new error category; any capability renumbering.

## 4. Files created / modified
| File | Change |
|---|---|
| `apps/web/src/infrastructure/firebase/functions.ts` | **New.** Region-bound (`europe-west1`), emulator-aware Cloud Functions client accessor, mirroring `firestore.ts`/`auth.ts`. The composition root is the only place allowed to call `firebase/*` directly (per its own contract), so the callable client is added here. |
| `apps/web/src/infrastructure/firebase/index.ts` | **Modified (additive).** Wires `functions` into `FirebasePlatform`. |
| `apps/web/src/authentication/idempotencyKey.ts` | **New.** CSPRNG key generator + `isSafeAuthenticationIdempotencyKey` mirroring the AUTH-03 backend `assertSafeIdempotencyKey` contract. |
| `apps/web/src/authentication/providerConfig.ts` | **New.** Closed MVP provider registry (`phone_otp`, `google_sign_in`), **disabled-by-default**, exact-"true" flags, fail-closed. |
| `apps/web/src/authentication/authenticateClient.ts` | **New.** `authenticate(input, deps)` — reads the verified ID token, calls the callable with a stable safe key, **reuses the key on a bounded transient retry**; `AuthenticateError` + enumeration-resistant `mapCallableErrorCode`. |
| `apps/web/src/authentication/authenticateCallable.ts` | **New.** Real transport adapter (`httpsCallable(functions, "authenticate")`) normalizing `FirebaseError` → mapped `AuthenticateError`; `toCallAuthenticate` factored out for unit testing. |
| `apps/web/src/authentication/phoneSignInFlow.ts` | **New.** `startPhoneSignIn` / `confirmPhoneSignIn` (Phone OTP → verified user → `authenticate` as `phone_otp`). |
| `apps/web/src/authentication/googleSignInFlow.ts` | **New.** `signInWithGoogle` (popup → verified user → `authenticate` as `google_sign_in`). |
| `apps/web/src/authentication/SignInPanel.tsx` | **New.** Customer-facing surface: renders only enabled providers, drives both flows, shows outcome/stable errors, renders no credential material. Imports no `firebase/*` transport. |
| `apps/web/src/authentication/createSignInActions.ts` | **New.** Production composition wiring the panel's actions from a `FirebasePlatform` (enabled providers + real flows + one shared callable adapter). |
| (each module above) `*.test.ts(x)` | **New.** Colocated TDD tests — 39 new web tests. |

## 5. Pre-change architecture analysis
- **Execution path AUTH-04 completes:** client provider sign-in (Firebase Auth) → verified Firebase user → `authenticate` callable (AUTH-03, on `main`) → identity resolution/registration/session. AUTH-04 supplies the *client half* only.
- **Reused merged components:** `infrastructure/firebase/{app,auth,appCheck,firestore,storage,index}` composition root; the `dev/phoneAuthHarness` reCAPTCHA/`signInWithPhoneNumber`/confirm pattern; `config/env`'s explicit-source, fail-closed pattern; the AUTH-03 `authenticate` callable contract (`{ rawToken, referenceType, idempotencyKey } → { mode, customerIdentityId, session }`) and its `assertSafeIdempotencyKey` / `CATEGORY_TO_HTTPS` transport contracts.
- **Why this strategy fits:** the composition root explicitly forbids calling `firebase/*` outside itself, so the callable client is an **additive** accessor there (not a redesign); all provider/backend interactions in the component are **injected actions**, matching the blueprint's network-safety-harness testing strategy (§13) and keeping live transport out of tests.

## 6. Consuming the corrected AUTH-03 idempotency guarantee
AUTH-04 **consumes, never weakens** the corrected AUTH-03 behavior:
- The client key is generated **once per sign-in attempt** and is a single safe Firestore path segment (`crypto.randomUUID()`), provably accepted by the backend `assertSafeIdempotencyKey` — so P2-4 (path-bearing key) can never be triggered from the client.
- On a **bounded transient retry** (`unavailable`), the **same** key is resent, so the AUTH-03 request-level replay gate returns the *original* outcome (the P2-3 guarantee) and a partially-applied registration resumes on the same identity (the P1-1/P1-2 guarantees) — never a divergent `signed_in`/orphan.
- A definitive answer (`permission-denied`/`not-found`/`aborted`/`invalid-argument`) is **not** retried; it surfaces immediately. `aborted` (`IDEMPOTENCY_CONFLICT`) is surfaced as `conflict`, never auto-retried (which would be wrong).

## 7. Security / privacy (TRD10 §10.6.1, AUTH-BP §11/§15)
- No raw ID token or OTP is stored, logged, or returned — the token is read once via `getIdToken()` and passed to the callable; only the provider-neutral outcome flows out (unit-asserted: the returned object is exactly `{mode, customerIdentityId, session}` and contains no token).
- The `SignInPanel` imports **no `firebase/*` transport** (network-safety harness); the OTP input is a `type="password"` field cleared on verify and never re-rendered (unit-asserted the OTP is absent from the DOM after verification).
- Callable errors map to a small, stable client-code set with fixed messages — no server message echoed (enumeration resistance); `permission-denied` intentionally covers both forbidden and suspended (the backend does not distinguish them at the boundary).
- **Disabled-by-default & no keys:** every provider is off unless an exact-"true" flag enables it (fail-closed for absent/"false"/malformed); no real DSN/site key/token is committed (secret scan clean). Deny-by-default Firestore Rules are unaffected — the frontend calls the existing server callable, opening no client write path.

## 8. Tests added (TDD, RED→GREEN)
39 new web tests, each written test-first and observed failing before implementation:
- `idempotencyKey.test.ts` (4) — generated key satisfies the backend safe contract; unique per call; predicate accepts/rejects the same cases the backend does.
- `providerConfig.test.ts` (7) — closed registry; disabled-by-default; exact-"true" only; no cross-enable; empty by default.
- `infrastructure/firebase/functions.test.ts` (4) — bound to app; region `europe-west1`; emulator-aware; idempotent.
- `infrastructure/firebase/index.test.ts` (+1) — `functions` wired into `FirebasePlatform`.
- `authenticateClient.test.ts` (7) — payload shape + safe key; **same key reused on transient retry**; non-transient surfaced immediately; bounded-retry limit; no credential material returned; error-code mapping.
- `authenticateCallable.test.ts` (3) — success passthrough; `FirebaseError`→mapped `AuthenticateError`; unknown→opaque `failed`.
- `phoneSignInFlow.test.ts` (2) / `googleSignInFlow.test.ts` (2) — provider-neutral bridge to `authenticate` with the correct `referenceType`; popup failure never reaches the backend.
- `SignInPanel.test.tsx` (6) — disabled-by-default fail-closed message; renders only enabled providers; Google + Phone happy paths; stable non-leaking error; OTP never left in the DOM.
- `createSignInActions.test.ts` (4) — enabled-provider resolution; Google/phone-send/phone-confirm wiring.

## 9. Complete validation results (2026-08-09)
- `pnpm typecheck` clean (functions + web); `pnpm lint` (`eslint .`) clean; `pnpm format:check` clean; `pnpm build` clean (functions + web).
- **Web unit suite: 298/298** (259 baseline + 39 AUTH-04; the previously-flaky `PhoneAuthHarnessPage` latency test passed this run).
- **Functions unit suite: 491/491** — unchanged (AUTH-04 changed no `functions/` file).
- **`pnpm emulators:validate`: 189/190** — the single failure is the inherited `ENG-P1-002-CR1` command-dispatcher / identity-lifecycle concurrency-timing flake (see §12).
- **RED→GREEN evidence:** every module's test was created and run failing (module/feature missing) before its implementation, then passing after — captured across the TDD loop for all 39 tests.

## 10. Commands executed
`git worktree` (native) from `origin/main`; branch `feat/auth-04-frontend-sign-in-flows`; `pnpm install --frozen-lockfile`; per-module TDD loop (`vitest run <file>` RED → implement → GREEN); `pnpm typecheck`; `pnpm lint`; `prettier --write`/`format:check`; `pnpm --filter web test`; `pnpm --filter functions test`; `pnpm build`; `pnpm emulators:validate`; secret scan; `git diff origin/main -- functions/` (empty).

## 11. Dependencies added / configuration changes
**None.** (`firebase`, `react`, `react-router-dom` already present.) New provider flags (`VITE_AUTH_ENABLE_PHONE_OTP` / `VITE_AUTH_ENABLE_GOOGLE_SIGN_IN`) are read-only and disabled-by-default; no value committed. No Firestore index, no Rules change.

## 12. Pre-existing failures / flakes encountered (with evidence)
`pnpm emulators:validate` reported 1–2 failures across runs (189/190, then 188/190), always in `functions/src/shared/commands/commandDispatcher.emulator.test.ts` ("concurrent-worker safety (ENG-P1-002-CR1)…") and/or `functions/src/domains/identity/repositories/identityLifecycleRepository.emulator.test.ts` ("two concurrent conflicting transitions…"). **Evidence they are inherited and unrelated to AUTH-04:** `git diff origin/main -- functions/` is **empty** — the entire `functions/` tree (source, tests, emulator config) is byte-identical to `origin/main`, so these results are `origin/main`'s own; the count varies run-to-run (the signature of a timing flake); and AUTH-02/AUTH-CORR-001 already documented this same concurrency flakiness. Left untouched per task constraints (no opportunistic flake fix; the `ENG-P1-002-CR1`/`EXT-TECH-001` timing flakes must not be touched).

## 13. Invariants preserved
Global authentication-reference uniqueness (server-owned; AUTH-04 opens no write path); the corrected AUTH-03 request-level/credential-keyed idempotency guarantees (consumed via stable-key reuse); the shared idempotency safe-key contract (mirrored, not redefined); the closed 14-category taxonomy (mapped onto existing transport codes, **no new category**); Authentication → Identity/shared/infrastructure dependency direction; fail-closed behavior (disabled-by-default providers, verification-gated backend); no raw credential persistence; `CustomerAuthenticated` emission unchanged (**AUTH-08**); deny-by-default Rules unaffected; no `functions/` change.

## 14. Risks & observations
- Low. Additive frontend over already-merged, already-tested interfaces.
- The reCAPTCHA/App-Check DOM lifecycle for a **live customer route** and production reCAPTCHA site-key provisioning are Release/Production-Readiness (G2) / AUTH-09 hardening concerns (flagged in AUTH-BP §16), **not** per-package criteria; AUTH-04 ships the tested flow + composition with providers **disabled-by-default** and mounts no live public route.
- `CustomerAuthenticated` ITM/audit emission and session management remain AUTH-08/AUTH-07 respectively.

## 15. Rollback instructions
`git revert` the AUTH-04 commit, or discard the branch pre-merge. Removes `apps/web/src/authentication/*` and `infrastructure/firebase/functions.ts`, and restores `FirebasePlatform` to its prior shape. No data/migration impact (providers ship disabled; no production caller until enabled + deployed).

## Final Gate
- **Disabled-by-default provider registry; fail-closed; no real keys committed.** ✅
- **Phone OTP + Google flows bridge a verified user to the AUTH-03 callable; provider-neutral.** ✅
- **Consumes the corrected AUTH-03 idempotency (stable safe key, reused on transient retry).** ✅
- **No credential material stored/logged/returned/rendered; enumeration-resistant errors.** ✅
- **Emits no domain events (`CustomerAuthenticated` remains AUTH-08); no session-mgmt/linking/recovery; no `functions/` change.** ✅
- **Full validation green except the inherited `ENG-P1-002-CR1` emulator concurrency flake (byte-identical `functions/` tree).** ✅
- **AUTH-04 implemented and validated, pending fresh Founder-authorized review/merge — not self-merged; AUTH-05+ not started.** ✅
