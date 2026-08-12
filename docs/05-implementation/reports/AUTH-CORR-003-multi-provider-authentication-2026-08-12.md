# AUTH-CORR-003 — Multi-Provider Authentication Policy Alignment — Implementation Report

> **Package:** `AUTH-CORR-003` — Founder-directed correction implementing the multi-provider authentication policy (Google + Email/Password + optional Phone OTP), resumed after `I18N-001` merged.
> **Date:** 2026-08-12. **Depends on:** merged `I18N-001` (localization foundation) — verified on `main`.

## 1. Entry main SHA & I18N-001 verification

- `origin/main` = `0bc89754f2ea2dacc62216cbe23da7111b089021`.
- **I18N-001 verified merged & authoritative:** PR #99 MERGED (merge `0bc8975`); main CI green; `apps/web/src/i18n/{config,locales/en,locales/fr}` present on main; AUTH-04 copy migrated to translation keys (`useTranslation` in `SignInPanel`). AUTH-CORR-003 unimplemented at entry (no email mapping); AUTH-HOSTED-PREVIEW-001 blocked/obsolete-pending-correction; AUTH-10 not started. Dirty primary worktree untouched.

## 2. Founder provider-policy decision recorded

MVP approved customer authentication providers: **Google Sign-In**, **Email/Password** (initial direct-email mechanism; email-link/passwordless deferred), **Phone OTP — optional, non-default, non-mandatory** (SMS unavailability must never block Google/Email registration). Authentication is **not** identity: one 11thONUS customer identity → one Firebase principal → one or more approved methods; phone/email may also be profile/contact attributes and changing them never redefines identity.

## 3. Governing documents amended/superseded (history preserved)

- **`DEC-AUTH-001` D-A2** — original "Phone OTP + Google; Email/Password Deferred" struck through + dated AUTH-CORR-003 amendment (Google + Email/Password + optional Phone OTP).
- **`DEC-SEC-001`** — "phone OTP primary" amended: phone is now one optional method, not primary/mandatory; recovery order unchanged.
- **`DEC-PROV-004`** — point-3 "initial approved mechanisms" extended to include Email/Password; Phone OTP's SMS route now optional (points 8/9 never block registration).
- **`TRD12 §12.4.1`** — MVP-scope note added (already equal-providers; email/password already listed).
- **`AUTH-BP §3`** (provider list), **§1 summary**, **§14** (hosted-preview closure → multi-provider criteria, Phase G).
- **`CDR-001 §5`**, **Master Workflow §17**, `IMPLEMENTATION_CHANGES.md`, documentation-changes-log (Entry 105).

## 4. Final MVP provider matrix

| Provider | Firebase `sign_in_provider` | `referenceType` | MVP status | Notes |
|---|---|---|---|---|
| Google | `google.com` | `google_sign_in` | Included | retained |
| Email/Password | `password` (authoritative) | `email` | **Included (new)** | Firebase Auth; no custom password store |
| Phone OTP | `phone` | `phone_otp` | Included, **optional/non-default** | SMS readiness = `EXT-TECH-001`, non-blocking |
| Apple / email-link / passkeys | — | — | Deferred | additive, future |

## 5–14. Per-package impact

- **AUTH-01:** unchanged — `AuthenticationReferenceType` already includes `email`.
- **AUTH-02 (changed):** added `password → "email"` to the closed `VERIFIED_PROVIDER_TO_REFERENCE_TYPE` allow-list (Firebase `sign_in_provider` for Email/Password confirmed `password` via authoritative Firebase docs). Verified authUid remains `referenceId`; tuple identity, fail-closed allow-list, and all AUTH-02 guarantees preserved; unsupported providers still fail closed.
- **AUTH-03:** unchanged — orchestration is provider-neutral; credential-keyed idempotency intact.
- **AUTH-04 (changed):** `providerConfig` `AuthProviderId` + registry + flag gains `email` (disabled-by-default); new `emailPasswordSignInFlow.ts` (`registerWithEmailPassword`/`signInWithEmailPassword` bridging to the AUTH-03 `authenticate` callable as an `email` credential); `createSignInActions` wires `registerWithEmail`/`signInWithEmail`; `SignInPanel` gains the Email/Password section (email + password, Create account + Sign in), Google retained, Phone optional. Wrong-identity and deadline-replay fixes preserved (email reuses the same `authenticate` retry/idempotency path). Password cleared after use; never stored/logged/returned.
- **AUTH-CORR-002:** unchanged — tuple `(referenceType, referenceId)` model validated; `email` is another reference type.
- **AUTH-05:** unchanged — same-Firebase-principal linking is provider-agnostic.
- **AUTH-06 (changed, minimal):** added `email → "email_verification"` to the recovery method-category map — an additive mapping under **existing governed semantics** (`email_verification` category already exists; `DEC-SEC-001` recovery order includes Email Verification). No AUTH-06 redesign; no new Founder decision required.
- **AUTH-07 / AUTH-08:** unchanged — session/freshness and audit/event `referenceType` are provider-neutral.
- **AUTH-09 / hosted-preview (Phase G):** AUTH-BP §14 closure rewritten to multi-provider (Email/Password + Google mandatory PASS; Phone OTP provider-capable/test-number, SMS-readiness non-blocking).

## 15. Customer identity/profile distinction

Preserved — phone/email are authentication references and/or profile contact attributes; neither is identity. No identity-model redesign.

## 16. Localization usage

All new customer-facing auth strings use the centralized I18N-001 mechanism (`auth` namespace: `emailLabel`, `passwordLabel`, `createAccount`, `emailSignIn`) with English + French. No hard-coded customer copy introduced (test-verified).

## 17. Files modified / created

**Backend:** `functions/src/domains/authentication/services/firebaseTokenVerifier.ts` (+ test); `.../identityRecoveryService.ts` (+ test).
**Frontend:** `apps/web/src/authentication/{providerConfig.ts (+test), emailPasswordSignInFlow.ts (new +test), createSignInActions.ts (+test), SignInPanel.tsx, SignInPanel.test.tsx, SignInPanel.i18n.test.tsx}`; `apps/web/src/i18n/locales/{en,fr}.ts`.
**Docs:** this report + the governance amendments (§3).

## 18–20. Diff / tests / RED→GREEN

TDD across all 15 required proofs. RED cycles observed and resolved: AUTH-02 unsupported-provider test flipped (removed `password`) + email-derivation test added; `providerConfig` registry-shape test updated. GREEN: functions **566/566** (+2), web **335/335** (+13).

## 21–24. Provider results

Email/Password **registration** ✓ (`createUserWithEmailAndPassword` → `email` credential → AUTH-03); Email/Password **sign-in** ✓ (`signInWithEmailAndPassword`); **Google regression** ✓ (unchanged, tests green); **Phone optional/non-default** ✓ (UI renders no phone controls when only Email/Google enabled; Google completes with no phone interaction).

## 25. Security / privacy

Firebase is the sole credential authority — no custom password storage, no password persisted/logged/returned (test asserts password absent from payload, result, and console). No raw token/OTP persisted. Closed 14-category taxonomy, fail-closed verification, deny-by-default Rules all preserved (no `firestore.rules` change).

## 26. Full validation

typecheck/lint/format/build clean; functions **566/566**; web **335/335**; e2e **1/1**; emulator suite via CI. _(Full results appended after CI.)_

## 27. Manual Firebase configuration required from the Founder (`eleventh-on-us-dev`)

_(Do NOT performed by this task.)_ To exercise the corrected hosted-preview:
- **Enable Email/Password** provider (Authentication → Sign-in method).
- **Confirm Google** provider enabled with a valid OAuth client + consent screen.
- **Phone** provider may remain enabled (optional); Firebase **test phone numbers** configured for no-live-SMS testing.
- **Authorized domains** include the hosted-preview channel URL.
- No production secret values in this report.

## 28. Dependencies / config

No new runtime dependencies (email flow uses existing `firebase/auth`). New disabled-by-default build flag `VITE_AUTH_ENABLE_EMAIL_PASSWORD`.

## 29–32. Programme / risks / rollback

Programme records amended (§3). Risks: Phone OTP live enablement still needs `EXT-TECH-001` readiness (non-blocking). Rollback: revert the AUTH-CORR-003 commit(s) — removes the email mapping, flow, UI, and recovery mapping; restores the phone+Google MVP. No data/migration impact.

## 30. PR review findings & dispositions (PR #100)

Codex reviewer ran on first head `0389184` — **2 findings, both VALID and in-scope**, fixed in place with regression tests (history preserved):

- **F-R1 (P1, correctness — critical):** the callable-boundary allow-list `MVP_REFERENCE_TYPES` in `functions/src/index.ts` still contained only `phone_otp`/`google_sign_in`, so `parseAuthenticateRequest`/`parseReferenceType` rejected every email authenticate/link/unlink/recovery request with `invalid-argument` **before verification** — the email flow was broken end-to-end (the AUTH-02 verifier map alone was insufficient). **Fixed:** added `email` to `MVP_REFERENCE_TYPES`; exported it and added `functions/src/index.test.ts` (3 tests) asserting the boundary admits exactly Google + Email/Password + Phone OTP and still rejects deferred providers.
- **F-R2 (P2, semantic accuracy):** AUTH-06 classified an email/**password** proof as `email_verification`, but `firebaseTokenVerifier` proves only `sign_in_provider` (password knowledge), never the token's `email_verified` claim — so recovery/audit records could overclaim mailbox verification. **Fixed:** email now maps to **`linked_provider`** (control of a previously-linked credential, exactly like Google); `email_verification` is reserved for a genuine inbox-proof mechanism (email-link/passwordless, deferred). Comment + test updated (asserts `linked_provider`, never `email_verification`).

Re-validation after fixes: functions **567/567** (+ boundary regression); typecheck/lint/format clean. **No unresolved material P1/P2 finding remains.**

## 31–38 / final

PR **#100**, final reviewed head recorded after the fix re-push. Not self-merged. Hosted-preview not executed. AUTH-10 not started. Dirty primary worktree untouched.
