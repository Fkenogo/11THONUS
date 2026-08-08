# AUTH-02 — Token Verification & Identity Resolution (Implementation Report)

> **Title:** AUTH-02 — Token Verification & Identity Resolution
> **Version:** 1.0 · **Status:** Implemented (TDD) — pending Founder-authorized review/merge · **Classification:** Working (implementation report)
> **Governing documents:** [`AUTH-BP` Authentication Blueprint](../roadmap/AUTH-BP-authentication-blueprint-2026-08-08.md) §3/§4/§12; [`AUTH-01` report](AUTH-01-authentication-domain-contracts-2026-08-08.md); [`ENG-P2-ARCH-001`](../roadmap/ENG-P2-ARCH-001-customer-identity-architecture.md) §7; [`DEC-AUTH-001`](../../00-governance/decisions/decision-register.md)
> **Source-of-truth path:** `docs/05-implementation/reports/AUTH-02-token-verification-and-identity-resolution-2026-08-08.md`
> **Last controlled update:** 2026-08-08 (`AUTH-02` — created)

**Scope.** The second Authentication implementation package, per AUTH-BP §12. It makes the pure AUTH-01 contracts executable: (A) a **Firebase Admin ID-token verification adapter** implementing the AUTH-01 `TokenVerifierPort`, and (B) a **credential → identity resolution service** that resolves a verified credential to a governed `AuthResult` through the merged Customer Identity `-09` lookup, with (C) governed error mapping onto the closed 14-category taxonomy and (D) security/privacy preservation. **No** registration/sign-in orchestration (AUTH-03), UI, account linking, recovery, session gating, ITM, staff auth, duplicate merging, or new providers.

## 1. Files Modified
| File | Change |
|---|---|
| `functions/src/domains/authentication/services/firebaseTokenVerifier.ts` (+`.test.ts`) | **New.** Firebase-Admin `TokenVerifierPort` adapter. `createFirebaseAdminTokenVerifier(verifyIdToken, { now })` (injected seam) + `firebaseAdminTokenVerifier()` production wiring (`getAuth(getAdminApp()).verifyIdToken`). Turns a raw Firebase ID token → provider-neutral `AuthenticatedCredential` (`referenceId` = Firebase authUid, AUTH-BP §3); `verifyIdToken(token, true)` (checkRevoked); closed-taxonomy error mapping. |
| `functions/src/domains/authentication/services/credentialResolutionService.ts` (+`.test.ts`, +`.emulator.test.ts`) | **New.** `resolveAuthenticatedCredential(db, credential, envelope, deps?)`. Consumes (never modifies) the merged `-09` `lookupCustomerIdentityByAuthenticationReference` with `purpose: "authentication"`; found → `resolvedAuthResult`, `RESOURCE_NOT_FOUND` → `unregisteredAuthResult`; all other errors propagate (fail closed). |
| `eslint.config.js` | Added `ignores: ["functions/src/domains/authentication/services/**"]` to the authentication no-Firebase block — the adapter/service sub-layer is the one place a Firebase SDK import is permitted (mirrors identity's `repositories/**`). Pure `models/`+`ports/` remain machine-enforced Firebase-free. |

## 2. Code Diff Summary
A new `functions/src/domains/authentication/services/` layer with two adapters and their tests. The verifier is unit-tested at its Firebase seam (a test double stands in for `verifyIdToken`); the resolver is unit-tested at its identity-lookup seam **and** against the real Firestore emulator. `referenceId` is bound to the Firebase authUid exactly as AUTH-BP §3 specifies ("`referenceId (Firebase authUid)`"). The verified credential carries only a single non-sensitive `signInProvider` signal — **no token, OTP, phone, or email**. All Firebase-error paths are normalized to `AuthenticationDomainError` on the closed 14-category taxonomy; the raw Firebase error never escapes the adapter. Resolution deliberately does **not** gate on identity access-state (`suspended`/`locked`) — that is the returning-user sign-in-orchestration step (AUTH-BP §6 step 2, AUTH-03).

## 3. Commands Executed
`git worktree add -b feat/auth-02-… origin/main`; `pnpm install --frozen-lockfile`; wrote 2 unit `*.test.ts` (RED) → `pnpm test src/domains/authentication/services` (2 failed, modules missing) → implemented 2 modules + eslint `ignores` → `pnpm test …/services` (20 passed, GREEN); added `credentialResolutionService.emulator.test.ts`; `pnpm --dir functions typecheck`; `pnpm lint`; `pnpm format:check` → `npx prettier --write` (2 files) → re-check; full `pnpm test` (functions **467/467**); `pnpm build`; `pnpm emulators:validate` (emulator suite); boundary/dependency/secret greps; `git add`/commit/push.

## 4. Dependencies Added
**None.** `firebase-admin` was already a dependency (used by `infrastructure/firebase/admin.ts`).

## 5. Configuration Changes
**None** (the `eslint.config.js` `ignores` addition is a lint-boundary rule, not runtime configuration).

## 6. Validation Performed
- **TDD:** RED (2 failing unit tests, modules absent) → minimal GREEN → refactor. Emulator test added for the real-Firestore resolution path.
- **Unit tests:** 20 new AUTH-02 unit tests (11 verifier + 9 resolver); full `functions` suite **467/467** (was 447 at AUTH-01). Verifier proven at its Firebase seam with a test double (no live Firebase; `DEC-AUTH-001` D-A4).
- **Emulator:** `credentialResolutionService.emulator.test.ts` (3 tests) — real Firestore emulator: (1) an identity with a `-08`-linked Google reference → `resolved`; (2) an unseeded reference → `unregistered`; (3) an identity's **initial embedded** reference that was never `-08`-linked → `unregistered` (pins the verified `-01`/`-09` boundary — see §12). Run via `firebase emulators:exec` (result: **3/3 passed**). The remaining 4 failures in the full `pnpm emulators:validate` run are **pre-existing** identity concurrency/timing emulator tests (`identityLifecycleRepository.emulator.test.ts` concurrent-transition scenarios — the documented CI-flakiness pattern), unrelated to AUTH-02; none is in the `authentication/` tree.
- **Compile/Lint/Format:** `tsc --noEmit` clean; `eslint .` clean (incl. the new boundary); `prettier --check .` clean. **Build:** `pnpm build` (web + functions) clean.
- **Boundary proof:** `grep firebase functions/src/domains/authentication/{models,ports}` → none (pure layers Firebase-free). **Direction:** identity/shared/infrastructure import **no** authentication (grep-verified). **Privacy:** `rawToken` only consumed (guard + `verifyIdToken`), never logged/stored/returned; no logging in the services; `signInProvider` is the only provider signal carried.
- **Repository integrity:** working-tree scope = `eslint.config.js` + the new `authentication/services/` dir only; no unrelated files.

## 7. Risks
Low–moderate. Additive; consumes merged, already-tested Customer Identity interfaces; the pure contracts are unchanged. The Firebase verification internals are Firebase's own tested code — AUTH-02 tests our mapping at the injection seam, not Firebase's verification. The end-to-end mint-and-verify of a real Firebase ID token (a live client sign-in) is exercised where a real token flow exists — the sign-in integration (AUTH-03) — not here; AUTH-02's verifier contract is proven at the seam per the brief's "test doubles / no live production Firebase in CI".

## 8. Rollback Instructions
`git revert` the AUTH-02 commit (or discard the branch pre-merge). Removes the `authentication/services/` dir and the eslint `ignores`; no data/migration impact (no production caller exists yet — AUTH-03+ not implemented).

## 9. Markdown Implementation Report
This document.

## 10. Implementation-Changes Tracking
Appended to [`IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md); changes-log Entry 093; `CDR-001` §5 (AUTH-02 implemented-pending-merge note); Master Delivery Workflow §17 (next = `AUTH-03`, unauthorised to begin).

## 11. Blueprint / Merged-Code Reconciliation
No **material** conflict between AUTH-BP and the merged code was found. One terse phrase in the AUTH-BP §12 one-line AUTH-02 description — "link via `-08`" — refers to the registration/account-linking flows (AUTH-BP §5 step 3 / §7), which the AUTH-02 task brief explicitly places **out of scope**. AUTH-02 therefore implements **verification + resolution only** (AUTH-BP §3 + §4) and does not implement linking. This is a scope narrowing by the controlling task brief, recorded here rather than silently expanded.

## 12. Cross-Package Finding (for AUTH-03) — Initial-reference resolvability gap

**Verified during AUTH-02 emulator testing; not an AUTH-02 defect; no code changed here.**

The merged Customer Identity code leaves an identity's **initial** authentication reference (the one passed to `createCustomerIdentity({ initialAuthenticationReference })`) in a state where it is **not resolvable** by the returning-user sign-in path:

- `customerIdentityRepository.createCustomerIdentity` (`-01`) writes the initial reference **only** into the `users/{id}` document's *embedded* `authenticationReferences[]` projection (via `toUserDocument`). It does **not** write the authoritative `authenticationReferences/{type}:{id}` uniqueness document.
- `identityLookupRepository.lookupCustomerIdentityByAuthenticationReference` (`-09`) resolves **only** via `getActiveAuthenticationReferenceOwner`, which reads the authoritative `authenticationReferences/{type}:{id}` document. So the initial reference resolves to **not-found** → AUTH-02 correctly returns `unregistered`.
- `authenticationReferenceRepository.linkAuthenticationReferenceForIdentity` (`-08`) **cannot** be used to retroactively write the authoritative document for that same initial reference: its domain check (`linkAuthenticationReference(current, …)`) sees the id already present in the embedded aggregate and throws `duplicateAuthenticationReferenceError` (VALIDATION_FAILED).

**Consequence for AUTH-BP §5:** the registration flow assumes `createCustomerIdentity` "links the reference atomically" such that the returning user resolves on next sign-in (§5 step 3 → §6). As merged, that round-trip does **not** hold for the initial reference. **AUTH-03 (registration) must ensure the initial reference is written to the authoritative `authenticationReferences/{type}:{id}` collection** — e.g., by registering it through `-08` **as part of the same registration act** (before/instead of embedding-only), or by a small, separately-authorized Customer Identity change so `-01` writes the authoritative document. **This is not fixed in AUTH-02** (registration is out of scope) and requires a **Founder decision** for AUTH-03; AUTH-02's resolver is correct and complete for the resolution contract. Google/second-provider references linked via `-08` resolve correctly today (proven by the passing emulator test).

## Final Gate
- **Firebase Admin ID-token verification adapter implemented** — `TokenVerifierPort` via `getAuth(getAdminApp()).verifyIdToken`, injectable seam. ✅
- **Verified credential resolved to identity** — via merged `-09` `lookupCustomerIdentityByAuthenticationReference` (purpose `authentication`), consumed not modified. ✅
- **Governed `AuthResult`** — found → `resolved`; not-found → `unregistered`; other errors propagate (fail closed). ✅
- **Errors on the closed 14-category taxonomy** — no new category. ✅
- **Security/privacy** — no Firebase in pure domain; no raw token persisted/logged/returned; no credential material in Firestore or the credential; reCAPTCHA/App Check unchanged. ✅
- **Direction preserved** — Authentication → Customer Identity/shared/infrastructure; the reverse never occurs. ✅
- **No AUTH-03 orchestration / UI / linking / recovery / session gating / ITM / staff / merge / new providers.** ✅
