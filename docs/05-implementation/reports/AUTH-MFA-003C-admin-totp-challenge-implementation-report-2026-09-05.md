> **Title:** AUTH-MFA-003C — Fresh Sign-In TOTP Challenge Handling for Platform Administrators — Implementation Report
> **Status:** Implemented — PR opened for Founder Technical Review (not self-merged)
> **Classification:** Working (implementation record)

> **SUPERSEDED (AUTH-MFA-003C-CORR-001):** the original implementation's
> first-factor selection behavior is **replaced**. `createPendingMfaChallenge`
> no longer maps `totpHints` to a `factorUids` list and silently selects index
> 0. The corrected semantics require **exactly one** supported TOTP factor;
> zero supported TOTP hints **and** an ambiguous multiple-TOTP configuration
> both fail closed with `MfaChallengeUnavailableError` → `auth_forbidden` — no
> challenge UI, no AUTH-03 bridge, no downgrade, no silent first-factor
> selection, and the public `factorUids` field is removed (the single
> enrollment ID is internal to the challenge closure). See §13.

# AUTH-MFA-003C — Fresh Sign-In TOTP Challenge Handling for Platform Administrators — Implementation Report

## 1. Entry state and base SHA

`origin/main` at `849284425eca6bd159054bf0438b0a4afc9cece1` (the merge commit of PR #230, `AUTH-MFA-003B` — the client-side TOTP enrollment package whose post-enrollment sign-out now forces every subsequent sign-in through the second-factor challenge this task builds). Verified by `git fetch origin && git rev-parse origin/main` before this task began. A fresh isolated worktree was created from that exact SHA at `/Volumes/PRODUCTION/Projects/_worktrees/11THONUS/temporary/auth-mfa-003c` (branch `feat/auth-mfa-003c-admin-totp-challenge`). The primary working directory's unrelated, uncommitted `FD-COM-001` commercial-model work (branch `docs/dec-legal-002-bt-draft-007`, HEAD `a404a53`) was never opened, read, stashed, committed, or altered. `pnpm install` was executed inside the worktree (pnpm v9.15.9, 6.7s). The branch has no upstream configured — it is pushed only by explicit refspec `git push origin HEAD:feat/auth-mfa-003c-admin-totp-challenge`.

## 2. Authorization and task authority

- **Base decision authority:** `DEC-SEC-004` (Founder disposition `FD-MFA-2`, Status **CONFIRMED**) — TOTP-only platform-administrator MFA, controlled auditable recovery, no customer/Business MFA.
- **Package charter:** `AUTH-MFA-003C` — the fresh-sign-in TOTP challenge experience for Platform Administrators (per `AUTH-MFA-002` §8.1 step 5 → next sign-in challenged): intercept `auth/multi-factor-auth-required` raised by a first-factor sign-in, resolve it through the SDK's `MultiFactorResolver` with a TOTP assertion, and then execute the existing AUTH-03 `authenticate` bridge **only with the token of the MFA-resolved Firebase user**. TOTP-only policy; no SMS challenge UI. English and French, exact parity, no third locale. Full test suite green and CI green at the exact merged head; PR opened for Founder technical review — **no self-merge**.
- **Provider scope (verified against current Firebase production behaviour):** official Firebase Authentication documentation (multi-factor page) states *"Every provider supports MFA, except phone auth, anonymous auth, and Apple Game Center."* The popup-based federated first factor is explicitly documented to raise `auth/multi-factor-auth-required` after `signInWithPopup` when the user is MFA-enrolled, and is resolvable via `MultiFactorResolver`. Therefore:
  - **Email/Password** → MFA-capable first factor (intercepted in `signInWithEmailPassword`; registration shares the same seam guard — a fresh `createUserWithEmailAndPassword` cannot raise MFA-required, but the guard is symmetric and fail-closed).
  - **Google Sign-In** → MFA-capable first factor (intercepted in `signInWithGoogle`; `signInWithPopup` raises MFA-required).
  - **Phone OTP** → **not** MFA-capable as a first factor (`phoneSignInFlow` unchanged — Firebase never raises MFA-required for a phone first factor). No interception code was added there and none could ever trigger; this is Firebase's own provider constraint, not a new policy decision. Recorded as a designed-in limitation, not silently invented policy.
- This package is **client-side, code-only**, adds **no dependency**, performs **no live Firebase change**, and touches **no server file**.

## 3. Strategy (written before code changes)

### 3.1 Where interception happens
The first-factor Firebase SDK calls execute inside the **flow adapters' injected seams** — the exact place where the real SDK rejects with `auth/multi-factor-auth-required`. Interception therefore lives in a shared guard inside `emailPasswordSignInFlow.ts` and `googleSignInFlow.ts`: catch the error, and when `code === "auth/multi-factor-auth-required"`, build a `PendingMfaChallenge` (a bounded, self-contained result object) and return it instead of throwing. Any *other* error (wrong password, popup closed, network) passes through unchanged, preserving all existing non-MFA behaviour.

### 3.2 The challenge object — transient, non-serializable, resolver-bound
`PendingMfaChallenge` carries no raw SDK state across module boundaries beyond what its own closure needs:
- created **only when the resolver exposes exactly one** TOTP factor (`totpHints.length === 1`); zero and multiple-TOTP configurations both throw `MfaChallengeUnavailableError`. No client factor-selection policy is ever applied and the public surface never lists factor IDs, enrollment timestamps, factor metadata, or phone hints (`AUTH-MFA-003C-CORR-001` supersedes the original `factorUids`-list first-factor selection);
- `submit(code)` → `TotpMultiFactorGenerator.assertionForSignIn(enrollmentId, code)` (the single enrolled factor, internal to the closure) → `resolver.resolveSignIn(assertion)` → `authenticate({ getIdToken: () => resolvedUser.getIdToken(), referenceType }, deps)` → the **only** bridge call, executed **only** with the MFA-resolved user's ID token;
- `clear()` → drops the resolver reference (mutable holder set to `null`) and marks the challenge inactive; the held TOTP code is never stored — it exists only as the submit argument and is cleared by the panel after every attempt.

The resolver, the code, and any derived material exist **only** in component memory: never in `localStorage`/`sessionStorage`/IndexedDB, never in URLs/route state, never serialized, never sent to Cloud Functions, never logged. The AUTH-03 bridge receives only the Firebase ID token (`rawToken`), never the resolver.

### 3.3 Reference-type preservation
`referenceType` (`"email"` / `"google_sign_in"`) is captured at challenge creation and reused verbatim on the post-resolution `authenticate` call — the MFA-resolved session is authenticated as the same first-factor credential it started from, so no new `authReference` identity is invented.

### 3.4 Fail-closed paths
- **No TOTP factor available** or **ambiguous multiple-TOTP configuration** (`resolver.hints` yields zero `factorId === "totp"` hints, or more than one): `createPendingMfaChallenge` throws `MfaChallengeUnavailableError`, surfaced to the panel as the existing `auth_forbidden` code ("This account can't sign in right now."). No bypass, no override, no fabricated success, no misleading bypass-suggesting UI, and **no silent first-factor selection** (`AUTH-MFA-003C-CORR-001`). A platform admin cannot complete sign-in without a resolvable, unambiguous TOTP factor.
- **Stale/expired resolution** (`auth/invalid-multi-factor-session`, `auth/multi-factor-info-not-found`): the challenge is cleared and the panel returns to the first-factor surface with a generic sign-in error; the user must start a fresh sign-in (normal TOTP behaviour — no infinite retry against a dead resolver).
- **Rejected code** (`auth/invalid-verification-code`): inline "code didn't work" error, the OTP input is cleared, the resolver is retained for an immediate retry with a fresh code. Never a raw Firebase message.
- **Any other resolution failure**: cleared challenge + generic error, restart.
- **No client MFA flag of any kind** is created, read, or persisted (`mfaSatisfied`/`mfaVerified`/`isMfaAuthenticated`/`secondFactorComplete` — none exist in this codebase; the server derives `verifiedSecondFactor` exclusively from the Firebase-verified `firebase.sign_in_second_factor` token claim via `firebaseTokenVerifier.ts`, which no client field can influence). No `getIdToken(true)` forced-refresh shortcut — the MFA-authenticated session comes only from `resolveSignIn`.

### 3.5 UI state machine (SignInPanel)
`signIn`/`signInWithGoogle`/`registerWithEmail` actions now return `AuthenticateOutcome | PendingMfaChallenge`. On a challenge:
- the panel stores it transiently in component state and renders the TOTP challenge form (numeric input, 6-digit gating matching the enrollment `codeLength` fact, in-flight disabled state) **in place of** the provider buttons — no parallel sign-in surface;
- success → `onSignedIn(outcome)` and the challenge is cleared;
- the challenge is cleared on cancel, on terminal error, on success, and on unmount (`useEffect` cleanup).

### 3.6 Localization
New `mfa.challenge` group in `en.ts` / `fr.ts` with exact structural parity (title, body, code label, confirm, verifying, cancel, invalid-code error, session-expired error, generic error). No Kirundi/Kinyarwanda/Swahili.

### 3.7 Testing strategy (Auth Emulator limitation)
The installed Auth Emulator (`firebase-tools@^15.24.0`) supports MFA **for PHONE_SMS second factors only** (emulator `mfaConfig = { state: "ENABLED", enabledProviders: ["PHONE_SMS"] }`; official docs: "The Authentication emulator supports prototyping and testing the SMS multi-factor authentication flows"; the emulator has no TOTP code path). The TOTP sign-in challenge **cannot be executed against the emulator**, exactly as TOTP enrollment could not (`AUTH-MFA-003A-CORR-001` finding). Every SDK interaction is therefore reached through injectable seams (`MfaChallengeSdkDeps`: `getResolver` + `TotpMultiFactorGenerator`) and validated with mocks; the emulator limitation is documented, never faked, and no emulator test is attempted. This mirrors the proven 003B seam pattern.

## 4. Provider/policy compatibility finding (recorded)

| First factor | Firebase MFA support (per official docs + SDK) | 003C behaviour |
|---|---|---|
| Email/Password | Supported — `signInWithEmailAndPassword` raises `auth/multi-factor-auth-required` for MFA users | Intercept → TOTP challenge → resolve → AUTH-03 bridge |
| Google (OAuth popup) | Supported — `signInWithPopup` raises `auth/multi-factor-auth-required` for MFA users | Intercept → TOTP challenge → resolve → AUTH-03 bridge |
| Phone OTP | **Not supported** as a first factor for MFA (docs: "except phone auth, anonymous auth, and Apple Game Center") | Unchanged — no interception, no new policy invented |

This is Firebase's own supported-first-factor set (the factor challenge authority, per AUTH-MFA-002 §5). No new policy is decided; platform-administrator TOTP remains the sole second-factor policy (`DEC-SEC-004`).

## 5. Files created and modified (as built)

**Created:**
- `apps/web/src/authentication/mfa/mfaSdkChallenge.ts` — SDK-isolated challenge module (`MFA_REQUIRED_ERROR_CODE`, `MFA_CHALLENGE_CODE_LENGTH`, `isMfaRequiredError`, `createPendingMfaChallenge`, `MfaChallengeUnavailableError`, `classifyMfaChallengeError`, `PendingMfaChallenge`, `isPendingMfaChallenge`, `MfaChallengeSdkDeps`, `defaultMfaChallengeSdkDeps`);
- `apps/web/src/authentication/mfa/mfaSdkChallenge.test.ts` (12 tests; **+3 CORR-001**: ambiguous multiple-TOTP fail-closed, mixed-SMS-single-TOTP submission, no-metadata-leak surface assertion);
- `apps/web/src/authentication/SignInPanel.mfaChallenge.test.tsx` (9 tests; **+2 CORR-001**: multiple-TOTP `auth_forbidden` with no challenge UI / no factor list, no factor-selection surface present).

**Modified:**
- `apps/web/src/authentication/emailPasswordSignInFlow.ts` (+ `emailPasswordSignInFlow.test.ts`) — `EmailPasswordSignInResult`, `challengeSdk` seam, MFA-required interception on register + sign-in;
- `apps/web/src/authentication/googleSignInFlow.ts` (+ `googleSignInFlow.test.ts`) — `GoogleSignInResult`, `challengeSdk` seam, MFA-required interception on the popup first factor;
- `apps/web/src/authentication/SignInPanel.tsx` — actions union widened, transient challenge state, challenge step render, cancel/unmount release;
- `apps/web/src/i18n/locales/en.ts` + `fr.ts` — `mfa.challenge` group, exact structural parity.
- `createSignInActions.ts` required **no edit** — its action types are flow-typed, so the widened flow unions flow through the composition unchanged.
- `phoneSignInFlow.ts` unchanged by design (Firebase does not support phone as an MFA first factor).

## 6. Security analysis (implemented invariants)

- The only ID token that ever reaches AUTH-03 for an MFA user is the MFA-resolved user's token — test-proven: `submit` resolves through `resolveSignIn`, and the challenge tests assert a single AUTH-03 call carrying exactly the MFA-resolved token (the pre-MFA token string never appears in any outgoing payload).
- The resolver and the TOTP code live only in component state; the code is cleared after every submission and the resolver is dropped on success, cancel, terminal error, and unmount; zero web-storage writes; no serialization; nothing sent to Cloud Functions except the resolved ID token.
- `auth_forbidden` fail-closed on a missing/unresolvable TOTP factor (`MfaChallengeUnavailableError`); no bypass path.
- No client MFA claim of any kind; no `getIdToken(true)` forced-refresh shortcut; no parallel sign-in surface while the challenge is pending; no raw Firebase error text rendered (bounded `invalid-code` / `session-expired` / `other` classification only).
- Server-side derivation (`firebase.sign_in_second_factor` via `firebaseTokenVerifier.ts`) is untouched and not client-influenceable — functions regression suite unchanged (153 files / 1651).

## 7. Validation plan

Executed in the worktree: apps/web suite, functions suite, `pnpm typecheck`, `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm emulators:validate` (functions untouched). Then explicit-refspec push, PR against current main, CI green at exact head, automated-review inspection, genuine-finding fixes only; **no self-merge**.

## 7.5 Validation results

| Check | Result |
|---|---|
| apps/web `vitest` | **103 files / 732 passed** (+4 net-new CORR-001 tests over the 003C head's 725) |
| functions unit | **153 files / 1651 passed** (unchanged — no server code touched) |
| `pnpm typecheck` (web + functions) | clean |
| `pnpm --filter web build` | clean (pre-existing chunk-size warning only) |
| `pnpm lint` (root `eslint .`) | **0 errors** (one pre-existing `apps/web` react-refresh warning in an untouched file) |
| `pnpm format:check` | clean |
| `pnpm emulators:validate` | **59 files / 756 passed / 2 skipped** (unchanged; functions untouched) |

New test breakdown: `mfaSdkChallenge.test.ts` 12 (code-only matching, single-TOTP challenge creation alongside phone hints, fail-closed no-hint, **fail-closed ambiguous multiple-TOTP with no assertion/resolve/bridge calls**, submit → assertion → resolveSignIn → bridge-with-resolved-token + preserved referenceType, **mixed SMS + single TOTP submits only the single TOTP factor**, **no-metadata-leak surface (public keys are exactly `kind`/`submit`/`clear`)**, pre-MFA-token-never-sent, `clear()` disables a late submit, error classification, type guard); `SignInPanel.mfaChallenge.test.tsx` 9 (challenge replaces provider surface, 6-digit gating + non-numeric stripping, success → `onSignedIn` + resolver released, invalid-code inline retry with cleared code and no raw message, terminal session-expired → resolver released + generic error, cancel → resolver released, no-TOTP → `auth_forbidden`, **multiple-TOTP → `auth_forbidden` with no challenge UI and no factor list**, **challenge step exposes only code input + confirm/cancel — no radio/listbox factor selector**); flow suites (email/register/google interception returning a bounded challenge with no early AUTH-03 bridge, **email + google ambiguous multiple-TOTP fail-closed with no assertion, no resolution, and no AUTH-03 bridge**, google challenge resolve).

## 8. Gate

`AUTH-MFA-003C-CORR-001 COMPLETE — ZERO TOTP FACTORS FAIL CLOSED — EXACTLY ONE TOTP FACTOR CHALLENGED — MULTIPLE TOTP FACTORS FAIL CLOSED — NO SILENT FIRST-FACTOR SELECTION — AUTH-03 STILL RUNS ONLY AFTER MFA RESOLUTION — TOKEN STILL COMES FROM MFA-RESOLVED USER — NO CLIENT MFA CLAIM — NO 003D WORK — CI GREEN ON EXACT HEAD — PR #231 READY FOR FOUNDER TECHNICAL REVIEW`

## 9. Configuration

None. No live Firebase / Identity Platform / TOTP change, no deployment, no real identity enrolled or signed in, no secret material created or persisted, no dependency added, no Firestore Rules / functions / dependency / tooling change. The client already depends on `firebase@^12.16.0` / `@firebase/auth@^1.13.x`, whose installed type surface (`auth-public.d.ts`, `@firebase/auth@1.13.3`) supplies `MultiFactorResolver`, `TotpMultiFactorGenerator.assertionForSignIn`, and the `auth/*` error codes used.

## 10. Migrations

None.

## 11. Risks and residuals

- **No live MFA sign-in exercised.** The Auth Emulator supports only PHONE_SMS second factors (`mfaConfig` default `{"state":"ENABLED","enabledProviders":["PHONE_SMS"]}`; docs: "the Authentication emulator supports prototyping and testing the SMS multi-factor authentication flows"); its SDK also has no TOTP code path (`firebase-tools` PR #9062 upstream SMS finalization, b/288313571 lineage). The TOTP challenge therefore **cannot be executed against the emulator**, mirroring the `AUTH-MFA-003A-CORR-001` enrollment finding. The full SDK chain is proven through the injectable `MfaChallengeSdkDeps` seam with mocks; the limitation is documented, never faked, and no emulator test is attempted.
- **Live-DEV reachability.** A live DEV TOTP challenge test requires a privileged temporary verified MFA identity and is held for Founder disposition (same status as the enrollment reachability test).
- **Not started:** `AUTH-MFA-003D` (second-factor removal / recovery), `003E`, `ENG-P3-003B`, Knowledge Studio.
- **Provider boundary**: phone OTP remains non-MFA-capable (Firebase constraint) — a platform admin who attempts phone sign-in is not challenged; documented as a designed-in limitation, not new policy.

## 12. Delivery

- Records: `docs/changes/IMPLEMENTATION_CHANGES.md` entry appended; `docs/00-governance/documentation-changes-log.md` **Entry 174** added (newest); this report finalized.
- Branch: `feat/auth-mfa-003c-admin-totp-challenge`, pushed via explicit refspec `git push origin HEAD:feat/auth-mfa-003c-admin-totp-challenge`.
- PR opened against the current `origin/main` (base `849284425eca6bd159054bf0438b0a4afc9cece1`); CI verified green at the exact merged head; the automated technical review is inspected and only genuine findings are corrected. **No self-merge** — the PR remains open for Founder Technical Review.

## 13. Correction record — AUTH-MFA-003C-CORR-001 (fail closed on ambiguous multiple TOTP factors)

**Reviewed head:** `755b8649ff9820debd405d84889771b9b01bb243` (pre-correction PR #231 head; verified unchanged at entry).

**Defect:** `createPendingMfaChallenge` filtered `resolver.hints` to TOTP factors, mapped them to a public `factorUids` list, and used `factorUids[0]` — silently selecting the **first** TOTP factor when an account carried more than one. No governed decision authorizes a "first TOTP factor wins" selection policy.

**Correction (supersedes the original selection behavior):**
- `totpHints.length !== 1` → `throw new MfaChallengeUnavailableError()` (zero **and** multiple both fail closed; the existing bounded marker already maps to `auth_forbidden`, no downgrade, no SMS fallback, no new selection UI, no client guessing).
- `enrollmentId = totpHints[0].uid` only after the exactly-one guard — the single selected factor stays **internal to the challenge closure**.
- Public surface narrowed: `PendingMfaChallenge` is now exactly `{ kind, submit, clear }` — the `factorUids` field is removed. `submit` needs no factor list; the UI renders only the 6-digit code input with confirm/cancel. No factor display names, enrollment timestamps, phone hints, or administrator identity details are exposed.
- No AUTH-03 bridge, no `assertionForSignIn`, and no `resolveSignIn` are ever reached for zero or ambiguous-multiple configurations (module- and flow-level test-proven for both email and google first factors).

**Semantics after correction:**

| Resolver TOTP hints | Behavior |
|---|---|
| 0 | Fail closed — `MfaChallengeUnavailableError` → `auth_forbidden`, no challenge UI, no AUTH-03 |
| 1 | Normal bounded TOTP challenge; `submit` asserts only that factor and bridges only the MFA-resolved user's token |
| 2+ | Fail closed — ambiguous unsupported configuration, same `auth_forbidden`, no silent selection |

**Tests added (+4 net):** module `mfaSdkChallenge.test.ts` 9→12 (ambiguous multiple-TOTP no-assertion/no-resolve/no-bridge; mixed SMS + single TOTP submits only the TOTP factor; no-metadata-leak surface keys === `kind`/`submit`/`clear`); `emailPasswordSignInFlow.test.ts` and `googleSignInFlow.test.ts` each add a flow-level ambiguous multiple-TOTP fail-closed regression; `SignInPanel.mfaChallenge.test.tsx` 7→9 (multiple-TOTP `auth_forbidden` with no challenge UI and no factor list; challenge step exposes no factor selector). Existing no-TOTP fail-closed, SMS-only rejection, exactly-one MFA-resolved-token, and pre-MFA-token-never-sent tests retained.

**Validation at the corrected head:** apps/web **103 files / 732 passed**; functions **153 / 1651 passed**; typecheck / build / lint (0 errors) / `format:check` clean; emulators **59 / 756 passed / 2 skipped**. CI green at the exact corrected head. No new automated-review findings were posted at entry or at re-inspection after the push. Records updated (this §13, `IMPLEMENTATION_CHANGES.md`, log Entry 175). **No self-merge.**