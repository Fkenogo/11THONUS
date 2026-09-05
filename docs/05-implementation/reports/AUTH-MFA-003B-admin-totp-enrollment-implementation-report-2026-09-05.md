> **Title:** AUTH-MFA-003B — Client-Side TOTP Enrollment Experience for Platform Administrators — Implementation Report
> **Status:** Implemented — awaiting Founder Technical Review
> **Classification:** Working (implementation record)
>
> **Superseding clarification (`AUTH-MFA-003B-CORR-001`, automated technical review, PR #230):** Sections of this report describing the original pre-review behaviour are **superseded by `AUTH-MFA-003B-CORR-001`** (see §14) and are retained only as historical evidence of the intermediate state. In particular: (a) the discovery query key is now **scoped to the authenticated caller's Firebase `uid`** (previously user-independent — the app-wide singleton `QueryClient` could serve one user's cached admin answer to another); (b) the render gates now check the `completion`/`unverified-email` step states **before** the already-enrolled and unverified-email-entry gates (previously a just-enrolled factor ended up on the already-enrolled screen instead of completion); (c) post-enrollment sign-out is now **attempted automatically** when the completion state is reached, with a bounded retry surfaced only if that automatic invocation fails (previously it required a button press — the pre-review report's §5 "Completion step" wording must be read with this correction); (d) a failed enrollment is now **bounded-classified** into `invalid-code` / `unverified-email` / `other` (previously every non-verify-email failure was presented as an invalid code). All final-state conclusions and validation in this report must be read with this correction applied.

# AUTH-MFA-003B — Client-Side TOTP Enrollment Experience for Platform Administrators — Implementation Report

## 1. Entry state and base SHA

`origin/main` at `9dedc3f71a5bb50595f519ce8f66d31c226c595d` (merge of PR #229, `AUTH-MFA-003A1` — the trusted `discoverPlatformAdministrator` callable this package consumes), verified by `git fetch origin && git rev-parse origin/main` before this task began. A fresh isolated worktree was created from that exact SHA at `/Volumes/PRODUCTION/Projects/_worktrees/11THONUS/temporary/auth-mfa-003b` (branch `feat/auth-mfa-003b-admin-totp-enrollment`). The primary working directory's unrelated, uncommitted `FD-COM-001` commercial-model work was never opened, read, stashed, committed, or altered. `pnpm install` was executed inside the worktree to materialize `node_modules` (which added `qrcode.react`, see §5).

## 2. Authorization and task authority

- **Base decision authority:** `DEC-SEC-004` (Founder disposition `FD-MFA-2`, Status **CONFIRMED**, Decision Register) — TOTP-only platform-administrator MFA, controlled auditable recovery, no customer/Business MFA.
- **Package charter:** `AUTH-MFA-003B` — the client-side TOTP enrollment experience for Platform Administrators, gated on the trusted discovery answer (`AUTH-MFA-002` §8A.5 names discovery as the consumer access layer), reusing the existing web architecture, in English and French, with transient local-only secret handling.
- **Authoritative enrollment sequence:** `AUTH-MFA-002` §8.1 — discovery → `multiFactor.getSession` → `TotpMultiFactorGenerator.generateSecret` → QR + manual key → `assertionForEnrollment` → `multiFactor(user).enroll(assertion, "Platform Admin TOTP")` → sign-out (end-user re-authentication with the new second factor).
- This package is **client-side, code-only**. It performs **no live Firebase configuration change, no Identity Platform/TOTP mutation, no enrollment of any real administrator, no deployment, no `firebase deploy`**. It adds one scoped web runtime dependency (`qrcode.react`) and consumes the already-merged `AUTH-MFA-003A1` callable.

## 3. Architecture verification findings (abridged)

Verified against the code on this branch before any code was written:

- `functions/src/index.ts` line 521 exposes the `discoverPlatformAdministrator` `onCall` (built by `AUTH-MFA-003A1`) returning exactly `{ isPlatformAdministrator: boolean }`; the client consumes it via `httpsCallable` and the transport adapter pattern — never Firestore.
- `@firebase/auth@1.13.3` exposes the full TOTP enrollment chain (`AUTH-MFA-003A-CORR-001` evidence): `multiFactor(user)` → `multiFactorUser.getSession()` → `TotpMultiFactorGenerator.generateSecret(session)` → `TotpSecret` (`secretKey`, `codeLength`, `codeIntervalSeconds`, `enrollmentCompletionDeadline`, `generateQrCodeUrl(accountName?, issuer?)`) → `TotpMultiFactorGenerator.assertionForEnrollment(secret, otp)` → `multiFactorUser.enroll(assertion, displayName)`; `user.emailVerified` is the enrollment precondition; `MultiFactorInfo.factorId === "totp"` marks an enrolled TOTP factor.
- **The Auth emulator cannot execute TOTP enrollment** (installed emulator hard-codes MFA enrollment to PHONE_SMS; `firebase-tools#6224`/b/288313571 — `AUTH-MFA-003A-CORR-001` finding). Every TOTP SDK interaction is therefore reached through an injectable seam (`createMfaEnrollmentFlow(deps)`) and validated with mocks, mirroring the repository's existing seam patterns.
- Screen conventions from `identity/DisplayNameProfile.tsx` and its test: screens take `{ auth, functions }` props; tests use vitest + `QueryClientProvider` + `vi.spyOn` on namespace imports; API adapters follow `makeCallX(functions)` / `toCallX(callable)`; data access via `useXQuery` react-query hooks; hooks `useX` bring the actor; `LanguageSwitcher` appears on every standalone page.
- The shared error authority is `authentication/authenticateClient.ts` (`AuthenticateError` + `mapCallableErrorCode`); the transport adapter and `authReference` resolution are deliberately duplicated per domain in this codebase (`identity/.../identityCallableClient.ts`, `business/.../businessCallableClient.ts`) — the mfa package follows that disclosed-duplication convention rather than importing cross-domain internals.
- `signOutCurrentSession(auth, { signOut })` exists in `authentication/signOutFlow.ts` and is the designed sign-out seam for the post-enrollment re-authentication boundary.
- No QR rendering library existed in any workspace; `react-qr-code` (maintenance) and `qrcode.react` were considered; `qrcode.react@^4.2.0` was chosen (zero dependencies, React 19 peer support, bundled types via `lib/index.d.ts`, `QRCodeSVG` accepts `role`/`aria-label`).
- `App.test.tsx` does not exhaustively enumerate the route table — adding a guarded route is safe. The `i18n` foundation test enforces exact EN/FR structural key parity, which every new namespace must satisfy.

## 4. Files created and modified

**Created (all under `apps/web/src/authentication/mfa/` unless noted)**

1. `api/mfaCallableClient.ts` — `MfaApiError extends AuthenticateError`, `isRetryableMfaErrorCode`, `AuthenticatedActor`, `toCallWithActor` transport adapter.
2. `api/authReference.ts` — duplicated `resolveAuthReferenceType` (`google.com` → `google_sign_in`, `password` → `email`, `phone` → `phone_otp`) and `UnresolvedAuthReferenceError`, following the existing identity/business adapter duplication convention.
3. `api/discoverPlatformAdministrator.ts` — `makeCallDiscoverPlatformAdministrator` / `toCallDiscoverPlatformAdministrator` for the `discoverPlatformAdministrator` callable, `DiscoverPlatformAdministratorResult`.
4. `api/discoverPlatformAdministrator.test.ts` — 3 tests (attaches `rawToken`/`referenceType`; sends nothing identity-selecting beyond the governed transport fields; normalizes a thrown server error into an `MfaApiError`, never a raw message).
5. `hooks/queryKeys.ts` — `mfaQueryKeys.platformAdministratorDiscovery`.
6. `hooks/useMfaSession.ts` — `UseMfaSessionState` (`loading` | `unauthenticated` | `error` | `ready { user, actor }`).
7. `hooks/usePlatformAdministratorDiscoveryQuery.ts` — react-query wrapper over the discovery adapter, enabled only when the session is `ready`.
8. `mfaSdkFlow.ts` — `createMfaEnrollmentFlow(deps)` (injectable `multiFactor` + `TotpMultiFactorGenerator`), `defaultMfaSdkDeps`, `EnrollmentPreview { secret, qrCodeUrl, secretKey, codeLength, codeIntervalSeconds }`, `MFA_FACTOR_DISPLAY_NAME = "Platform Admin TOTP"`, `TOTP_ISSUER = "11thONUS"`, `hasEnrolledTotpFactor(user)`, `startEnrollment(user)`, `completeEnrollment(user, secret, otp)`, `isEnrollmentEmailUnverifiedError`. Header documents the trust model and the (never-claimed) session invariants.
9. `mfaSdkFlow.test.ts` — 9 tests (factor detection incl. non-TOTP; `getSession`→`generateSecret` chain; QR URI account-name/issuer/secret; no-email account-name omission; assertion + governed factor display name on enroll; `auth/unverified-email` classification).
10. `TotpQr.tsx` — `QRCodeSVG` wrapper exposing `role="img"` + `aria-label`, no persistence.
11. `MfaEnrollmentPage.tsx` — the page (state machine, gates; see §5/§6/§7).
12. `MfaEnrollmentPage.test.tsx` — 23 tests (see §10).

**Modified**

13. `apps/web/package.json` + `pnpm-lock.yaml` — added `qrcode.react@^4.2.0` (sole new runtime dependency).
14. `apps/web/src/i18n/locales/en.ts`, `fr.ts` — full `mfa` namespace (page/access/intro/setup/verify/completion; incl. `qrLabel`, `manualKeyLabel`, `manualKeyHint`, `codeLengthLabel`, `codeLengthValue`).
15. `apps/web/src/i18n/config.ts` — resources now `{ common, auth, business, identity, mfa }`; `ns: ["common","auth","business","identity","mfa"]`.
16. `apps/web/src/App.tsx` — `/auth/mfa/enroll` route wrapped in `RequireAuthenticatedUser` with the `SignInRequired` fallback (`apps/web/src/App.test.tsx` — signed-out fallback test added).

## 5. Design decisions (trust model, UX state machine, secret handling, localization)

- **Consumption gate:** the page offers the introduction only after (a) a session is resolved, (b) the trusted discovery callable answers `isPlatformAdministrator: true`, and (c) the account precondition holds. Discovery is **routing-only** — it never grants any server-side capability; backend authorization continues to require a genuinely MFA-authenticated session and `resolvePlatformAdministratorAuthorization` (unchanged).
- **Account preconditions, fail closed:** `user.emailVerified === false` blocks upfront with a bounded message (email verification is a Firebase enrollment prerequisite — `AUTH-MFA-003A-CORR-001`); an already-enrolled TOTP factor (`factorId === "totp"`) blocks re-enrollment. Both are re-checked at the verification step, where an SDK `auth/unverified-email` reject drops the secret and moves to the verified-email blocked state.
- **Step machine:** `intro → setup → verify → completion`, plus the `unverified-email` blocked state. Intermediate states (`loading`, discovery `pending`/`error`) render bounded UI; discovery failure renders a mapped message with an explicit Retry affordance (react-query `refetch`), never a raw error string.
- **Setup step:** the preview comes from `startEnrollment` (session → secret). It renders the in-page QR (`TotpQr`, `role="img"`, descriptive label), the manual entry key (monospace) with a hint, and the code-length/refresh-interval fact from `TotpSecret.codeLength`/`codeIntervalSeconds` (localized). `Cancel` at any point drops the transient preview and returns to intro.
- **Verify step:** a single OTP input; **Confirm stays disabled until exactly the secret's code length** is entered; Enter submits; submission is disabled while in flight (no double submit); a rejected code (`auth/invalid-verification-code`) shows an inline error and stays on verify with a retry path; any other SDK error is mapped through the `AuthenticateError` taxonomy to a bounded message (never the raw text).
- **Completion step:** on success the in-memory secret is dropped and the page moves to a completion state, then signs the caller out via the `signOutCurrentSession(auth, { signOut })` seam — the AUTH-MFA-002 §8.1 designed boundary forcing full re-authentication with the new second factor. A sign-out failure surfaces a bounded retry message. **Enrollment never establishes an MFA-authenticated session and no client flag (no `mfaSatisfied`/`mfaVerified` type state) is created or persisted.**
- **Secret lifecycle:** the `TotpSecret` (and any QR/assertion material) exists only in component state: cleared on cancel, on terminal error, on completion, and on unmount; never written to web storage (`localStorage`/`sessionStorage`), URLs, logs, analytics, or reports. A dedicated test asserts zero `Storage.prototype.setItem` calls across the full happy path.
- **No forced refresh:** the flow never calls `getIdToken(true)`/forced token refresh to simulate verification; the `emailVerified` gate uses the resolver-observed user state and the SDK's own enrollment precondition.
- **Localization:** the `mfa` namespace is fully translated (EN/FR) with exact structural parity enforced by the existing i18n foundation test; a mid-flow language switch preserves the entered OTP, the manual key, and the route/state.

## 6. Error mapping truth table (client)

| Server/callable result | Client presentation |
|---|---|
| `unauthenticated` | `auth_required` — sign-in-required fallback |
| `not-found` | `not_found` — bounded message |
| `invalid-argument` | `validation_failed` — bounded message |
| `aborted` / `already-exists` | `conflict` — bounded message |
| `functions/unavailable` | `unavailable` — retryable, Retry affordance |
| `deadline-exceeded` | `timeout` — retryable, Retry affordance |
| anything else | `failed` — retryable, Retry affordance |
| SDK `auth/invalid-verification-code` | inline on-verify error, stays on verify, retry allowed |
| SDK `auth/unverified-email` | verified-email blocked state; secret dropped (fail-closed) |

No raw server/SDK error message is ever rendered; tests assert the absence of raw text in discovery-failure, enrollment-failure, and sign-out-failure presentations.

## 7. Security analysis

| Threat | Mitigation in the implementation |
|---|---|
| Client self-asserts administrator status | Admission flows only from the server-verified `discoverPlatformAdministrator` answer; no client boolean grants anything server-side (backend never reads client MFA flags); route additionally requires an authenticated session |
| Client reads `platformAdministrators` directly | Deny-all Firestore rules unchanged; the page performs no Firestore reads at all (test-proven) |
| Discovery leaks roles/status | Discovery response is single-key; the page renders no record contents |
| TOTP secret exfiltration | In-memory only; cleared on cancel/terminal error/completion/unmount; zero web-storage writes (test-proven); no URL/log/analytics/report embedding; screenshots and this report contain no secret material |
| Raw error/internals leakage | All errors surfaced through the `AuthenticateError`/`MfaApiError` taxonomy or bounded inline text (test-proven) |
| Enrollment impersonates an MFA-authenticated session | Never: no session persists post-enrollment; completion signs out so the next access requires full authentication with the second factor; no `getIdToken(true)` shortcut |
| Unverified email enrolls | Blocked upfront and fail-closed on the SDK `auth/unverified-email` reject at finalization |
| Re-enrollment over an existing TOTP factor | Blocked when `factorId === "totp"` is already enrolled; server enforcement independently governs |
| OS/language/route arbitrage | Route gated by `RequireAuthenticatedUser`; LanguageSwitcher only toggles locale, never the secret or state |

## 8. Boundaries honored (what this package did NOT do)

No live Firebase configuration change; no Identity Platform or TOTP mutation; no real administrator enrolled; no TOTP secret created, persisted, or reported (only test fixtures with synthetic keys); no `firebase deploy`; no MFA-authenticated session claimed; no client MFA flag created; no authorized-action gate changed (`resolvePlatformAdministratorAuthorization` untouched); no functions change (no server test touched — suites unchanged); no Firestore Rules change; no `AUTH-MFA-003C` (challenge UI), `AUTH-MFA-003D` (removal/recovery), or later package work begun; no new auth provider; no change to any merged record's existing entries. The primary worktree's `FD-COM-001` work was untouched.

## 9. Tests and results (executed in the isolated worktree)

- **New tests:** 35 directly in the mfa package (23 page + 9 SDK-flow + 3 discovery adapter) + 1 new `App.test.tsx` route test; `containsNoRawErrorText`-style assertions built into the error-path tests; `noStorageWrites` test spies on `Storage.prototype.setItem` across the happy path; a synthetic-secret, zero-persistence fixture policy for every test.
- `pnpm test` (repo): **functions unit 153 files / 1651 passed** (unchanged) and **apps/web 101 files / 698 passed** — full green.
- `pnpm typecheck` (repo): clean (web + functions).
- `pnpm lint` (repo): clean — the single pre-existing `react-refresh/only-export-components` warning in `apps/web/src/business/BusinessApiContext.tsx` (untouched file) is not introduced by this change.
- `pnpm format:check`: clean.
- `pnpm build` (repo): clean.
- `pnpm emulators:validate` (full emulator suite via `firebase emulators:exec`): **59 files / 756 passed / 2 skipped** — full green (functions untouched; run for the CI-equivalent baseline).
- The Auth Emulator cannot execute TOTP enrollment (`AUTH-MFA-003A-CORR-001` finding), so the live TOTP chain is covered by the injectable-seam unit tests plus the already-established SDK capability evidence; no emulator test for TOTP was attempted or faked.
- No CI run was triggered (no push yet as of this report); the CI-equivalent commands above are the local verification baseline.

## 10. Deploy/rollback

- **Deploy:** web-only package; deployment is the normal future web build/deploy at go-live (not executed here — no live change).
- **Rollback:** repository-level — do not merge / revert the PR. No live Firebase configuration, no Identity Platform state, no deployment, and no compiled artifact shipped; reverting the PR's files restores the pre-package state exactly. The single scoped runtime dependency is contained to `apps/web`.

## 11. Risks

- **No live enrollment exercised:** no real administrator has enrolled (zero secret material existed). The live-DEV enrollment-reachability test remains held for Founder disposition per `AUTH-MFA-003A-CORR-001`; it does not block this UI package.
- **Emulator limitation:** the authentic TOTP chain cannot be executed against the Auth emulator; the injectable seam + mocks are the evidence boundary, recorded honestly rather than faked.
- **Dependency surface:** one web-only runtime dependency added (`qrcode.react@^4.2.0`, zero transitive deps). It renders the QR only; no secret passes through it beyond the in-memory SVG.
- **Follow-on packages:** the challenge UI (`AUTH-MFA-003C`) and removal/recovery (`AUTH-MFA-003D`) remain unprefixed; until then, post-enrollment access is by full re-authentication as designed.

## 12. Governance / delivery record

**AUTHORIZED:** `DEC-SEC-004` (`FD-MFA-2`) + AUTH-MFA-002 §8.1/§8A.2/§8A.5 task charter (`AUTH-MFA-003B`).
**EXECUTED:** client-side code-only enrollment experience (page + SDK seam + adapters + tests + i18n + records); no live environment touched; one scoped web dependency added.
**NOT AUTHORIZED / NOT EXECUTED:** any live change, real enrollment, MFA-authenticated session claim, challenge UI, recovery, later packages.

## 13. Gate

`AUTH-MFA-003B CLIENT-SIDE TOTP ENROLLMENT EXPERIENCE IMPLEMENTED — TRUSTED CALLABLE-GATED (DISCOVERY ROUTING-ONLY) — AUTH-MFA-002 §8.1 SEQUENCE VIA INJECTABLE SDK SEAM — QR + MANUAL KEY + CODE-LENGTH FACTS — IN-MEMORY-ONLY SECRET, DROPPED ON CANCEL/ERROR/COMPLETION/UNMOUNT, ZERO WEB-STORAGE WRITES — NO MFA-AUTHENTICATED SESSION CLAIMED, POST-ENROLLMENT SIGN-OUT VIA EXISTING SEAM — EMAIL-VERIFIED + ALREADY-ENROLLED GATES FAIL-CLOSED — NO RAW ERROR LEAKAGE — FULL EN/FR PARITY — 35 NEW MFA TESTS + ROUTE TEST GREEN (WEB 698/698, FUNCTIONS 1651 UNCHANGED, EMULATOR 756/758) — NO LIVE CONFIG CHANGE, NO REAL ENROLLMENT — READY FOR FOUNDER TECHNICAL REVIEW`

## 14. Automated technical review corrections (`-CORR-001`, PR #230, resume of the same branch)

The automated reviewer (`chatgpt-codex-connector`) submitted four findings against this package; all four were substantiated at the pre-correction head `fb3430a00290d62c767a80ee3e6784acf10920a1` and corrected in place on the same PR branch.

### 14.1 P1-01 — discovery cache must be scoped to the authenticated user (Security)

- **Finding:** `usePlatformAdministratorDiscoveryQuery` used the static key `mfaQueryKeys.platformAdministratorDiscovery()` (`["mfa","platform-administrator-discovery"]`). Because `apps/web/src/main.tsx` creates a *singleton* `QueryClient` shared app-wide, a cached `{ isPlatformAdministrator: true }` for one signed-in user could be served to a different signed-in user within the retention window — a cross-user privilege-lookup hazard for user-dependent routing data.
- **Fix:** the key is now `mfaQueryKeys.platformAdministratorDiscovery(uid)` = `["mfa","platform-administrator-discovery",uid]`, derived from `useMfaSession`'s `ready.user.uid` (Firebase UID) or the constant `"no-session"` when not ready. The query remains `enabled` only when ready, and the server callable stays the authority. Two same-`QueryClient` regression tests drive a switchable fake auth: admin → ordinary user (the ordinary user must *never* see the cached admin `true`; enrollment controls remain hidden until **their own** discovery resolves false → denied) and ordinary → a different admin (controls reappear only after the incoming user's own callable-backed entry resolves true). The pre-correction cache entry for a user leaving is immaterial — each uid owns a distinct key.
- **Boundary kept:** no client persistent admin flag; discovery answer remains routing-only; no invalidation-timing reliance (keying, not invalidation, is the mechanism).

### 14.2 P1-02 — completion precedence over the already-enrolled gate (Correctness)

- **Finding:** the render gates evaluated `flow.hasEnrolledTotpFactor(session.user)` *before* `step === "completion"`. On a genuine enrollment the Firebase user's factor list gains the `totp` factor, so the completion state was masked by the already-enrolled screen — the exact success the UI was supposed to announce.
- **Fix:** render ordering now checks the terminal step states first — `step === "completion"` and `step === "unverified-email"` are evaluated **before** the unverified-email-entry gate and the already-enrolled (`hasEnrolledTotpFactor`) gate. The already-enrolled gate still fail-closes the entry/setup/verify steps for an account that already had a `totp` factor before arriving; it no longer steals the completion (or unverified-email) presentation reached *during* this flow. Regression test: `hasEnrolledTotpFactor` toggles `false → true` the moment `completeEnrollment` resolves, and completion (not already-enrolled) is still what renders.

### 14.3 P2-01 — automatic post-enrollment sign-out with a fail-closed retry (Behaviour)

- **Finding:** sign-out was only initiated by a button press on the completion step; nothing forced the AUTH-MFA-002 §8.1 re-authentication boundary to engage on enrollment success.
- **Fix:** reaching the completion state now triggers `signOutCurrentSession(auth)` **automatically** (a `useEffect` keyed on `step === "completion"`). Successful sign-out → the Firebase session becomes unauthenticated → the page hands off to the bounded sign-in-required/`RequireAuthenticatedUser` fallback; **no MFA-authenticated session is ever claimed** and there is no auto re-sign-in or `getIdToken(true)` substitute. A failure of that automatic invocation surfaces a bounded sign-out-retry state (dedicated retry button + message); the retry invokes the same seam again, and no additional authorization callable is fired. The happy path renders **no** bypass/skip affordance. Regression tests: automatic invocation with no click; completion wins over already-enrolled even after the factor appears; failed automatic sign-out → bounded retry → re-attempt; successful sign-out → sign-in-required handoff with no completion/MFA claim and no retry button; exactly one discovery call across the retry (no extra authorization callable).

### 14.4 P2-02 — bounded enrollment-failure classification (Behaviour/UX)

- **Finding:** every enrollment failure other than `auth/unverified-email` was presented with the *invalid-code* message on the verify step — networking, provisioner, stale-session, and internal failures all masqueraded as "that code didn't work."
- **Fix:** `mfaSdkFlow.ts` now exports `classifyMfaEnrollmentError` → `"invalid-code" | "unverified-email" | "other"` (Firebase code vocabulary stays inside the SDK module). The page maps: `auth/invalid-verification-code` → inline invalid-code message, stays on verify, secret retained, retry allowed; `auth/unverified-email` → verified-email blocked state, secret dropped; **everything else (terminal)** → generic bounded message, secret dropped, restart from intro (fresh `startEnrollment` on retry), never the raw error, never the invalid-code claim. Regression tests cover all three categories plus the raw-detail non-leak.

### 14.5 Correction validation

- Files touched by the correction: `mfaSdkFlow.ts` (+ classifier, replaced `isEnrollmentEmailUnverifiedError`), `MfaEnrollmentPage.tsx` (gates reorder, classifier wiring, automatic sign-out + retry), `hooks/queryKeys.ts` + `hooks/usePlatformAdministratorDiscoveryQuery.ts` (uid-scoped key), `i18n/locales/en.ts` + `fr.ts` (`completion.signOut` → `signOutFailed`/`signOutRetry`, exact parity), and the mfa tests (page suite 23 → 28; flow suite now asserts the classifier). No server file touched; `discoverPlatformAdministrator`/`resolveAuthenticatedIdentityActorReadOnly`/Firestore rules/`deriveVerifiedMfaSatisfied`/`resolvePlatformAdministratorAuthorization`/`evaluateKnowledgePlatformPermission` unchanged.
- Full re-validation at the `-CORR-001` head: repo `pnpm test` green — **functions 153 files / 1651 passed** (unchanged), **apps/web 101 files / 704 passed** (6 net-new mfa tests); `pnpm typecheck`, `pnpm build`, `pnpm lint`, `pnpm format:check` clean; `pnpm emulators:validate` **59 files / 756 passed / 2 skipped** (functions untouched, CI-equivalent baseline). No live change, no real enrollment, no secret material.
- Each of the four review threads was replied to with this evidence and resolved via the GitHub review API (`isResolved: true`) only after the correction was verified. PR #230 at the `-CORR-001` head remains OPEN / MERGEABLE for Founder Technical Review, not self-merged. Recorded also in `IMPLEMENTATION_CHANGES.md` and `documentation-changes-log.md` Entry 173.