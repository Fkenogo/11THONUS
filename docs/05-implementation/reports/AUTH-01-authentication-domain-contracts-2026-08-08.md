# AUTH-01 — Authentication Domain Contracts (Implementation Report)

> **Title:** AUTH-01 — Authentication Domain Contracts
> **Version:** 1.0 · **Status:** Implemented (TDD) — pending Founder-authorized review/merge · **Classification:** Working (implementation report)
> **Governing document:** [`AUTH-BP` Authentication Blueprint](../roadmap/AUTH-BP-authentication-blueprint-2026-08-08.md); [`ENG-P2-ARCH-001`](../roadmap/ENG-P2-ARCH-001-customer-identity-architecture.md) §7; [`DEC-AUTH-001`](../../00-governance/decisions/decision-register.md)
> **Source-of-truth path:** `docs/05-implementation/reports/AUTH-01-authentication-domain-contracts-2026-08-08.md`
> **Last controlled update:** 2026-08-08 (`AUTH-01` — created)

**Scope.** The first Authentication implementation package, per AUTH-BP §12. The Authentication **domain layer and contracts** every subsequent Authentication package depends on — interfaces and domain behaviour only. **No** UI, Firebase Auth orchestration, provider logic, account linking, session management, or recovery. Pure domain: no Firebase import (machine-enforced).

## 1. Files Modified
| File | Change |
|---|---|
| `functions/src/domains/authentication/models/authenticationErrors.ts` (+`.test.ts`) | **New.** `AuthenticationDomainError` class + 8 factories on the closed 14-category taxonomy (no new category); enumeration-resistant credential-not-found error. |
| `functions/src/domains/authentication/models/authenticatedCredential.ts` (+`.test.ts`) | **New.** `AuthenticatedCredential` (provider-neutral, reference-only — no token/secret) + `createAuthenticatedCredential` validation. Reuses `AuthenticationReferenceType`. |
| `functions/src/domains/authentication/models/authResult.ts` (+`.test.ts`) | **New.** `AuthResult` discriminated union (`resolved`/`unregistered`) + constructors — the resolution *outcome* contract (no resolution act). |
| `functions/src/domains/authentication/models/sessionContext.ts` (+`.test.ts`) | **New.** `SessionContext` shape + `createSessionContext` validation — the resolved access-context contract (no session management). |
| `functions/src/domains/authentication/models/authenticationEvents.ts` (+`.test.ts`) | **New.** Auth event **type contracts** (`CustomerAuthenticated`, `AuthenticationRecoveryProofProvided`) + source-domain constant — contracts only, no emission. |
| `functions/src/domains/authentication/ports/tokenVerifierPort.ts` (+`.test.ts`) | **New.** `TokenVerifierPort` provider-neutral interface + `RawProviderCredential` — contract only (AUTH-02 implements the Firebase adapter). |
| `eslint.config.js` | Added a machine-enforced no-Firebase boundary block for `functions/src/domains/authentication/**` (mirrors the identity/loyaltyNumber/qrIdentity precedents; AUTH-BP §15). |

## 2. Code Diff Summary
A new `functions/src/domains/authentication/{models,ports}` domain: pure TypeScript contracts + validating constructors. All types are `readonly`; validation raises `AuthenticationDomainError` on the closed 14-category taxonomy. Provider neutrality is preserved by **reusing** the merged `AuthenticationReferenceType` (`phone_otp`/`google_sign_in`/`email`/`future_provider`) rather than redefining it. No credential material is representable (no token/secret/OTP fields; asserted by tests). No repository call, no Firebase import, no orchestration.

## 3. Commands Executed
`git worktree add -b feat/auth-01-… origin/main`; `pnpm install --frozen-lockfile`; wrote 6 `*.test.ts` (RED) → `pnpm test src/domains/authentication` (6 failed, modules missing) → implemented 6 modules + eslint block → `pnpm test` (GREEN); `pnpm typecheck`; full `pnpm test` (447/447); `pnpm lint`; `pnpm format:check` → `npx prettier --write` → re-check/re-test; `pnpm build`; boundary/dependency greps; `git add`/secret scan/`git commit`/`git push`.

## 4. Dependencies Added
**None.**

## 5. Configuration Changes
**None** (the `eslint.config.js` addition is a lint-boundary rule, not runtime configuration; no dependency, env, or build config changed).

## 6. Validation Performed
- **Architecture consistency:** Authentication provides access, never owns/duplicates identity; consumes the merged `AuthenticationReferenceType`; dependency direction Authentication → Identity/shared confirmed (identity/shared import **no** authentication — grep-verified).
- **Compile:** `tsc --noEmit` clean. **Lint:** `eslint .` clean (incl. the new boundary). **Format:** `prettier --check .` clean. **Unit tests:** 20 new AUTH-01 tests; full `functions` suite **447/447** (was 427). **Build:** `pnpm build` (web+functions) clean.
- **Boundary proof:** `grep firebase functions/src/domains/authentication/` → none. **Repository integrity:** working-tree scope = `eslint.config.js` + the new `authentication/` dir only; no unrelated files.

## 7. Risks
Low — additive, pure-domain contracts, fully unit-tested; no runtime wiring, no Firebase, no data path. The contracts are the seam AUTH-02+ build on; if a downstream package needs a shape not yet defined, it extends additively (no rework of AUTH-01 expected).

## 8. Rollback Instructions
`git revert` the AUTH-01 commit (or discard the branch pre-merge). Removes the `authentication/` domain and the eslint block; no data/migration impact (no production caller exists yet — AUTH-02+ not implemented).

## 9. Markdown Implementation Report
This document.

## 10. Implementation-Changes Tracking
Appended to [`IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md); changes-log Entry 092; Programme/Master-Workflow AUTH-stream notes updated (AUTH-01 delivered; next = AUTH-02, unauthorised to begin).

## Final Gate
- **Authentication domain contracts implemented** — `AuthenticatedCredential`, `AuthResult`, `SessionContext`, auth event contracts, `AuthenticationDomainError` factories, `TokenVerifierPort`. ✅
- **Provider neutrality preserved** — reuses `AuthenticationReferenceType`; no provider hardcoding. ✅
- **Existing Customer Identity interfaces reused** — `AuthenticationReferenceType`/`AuthenticationReference`; no duplication. ✅
- **No Authentication orchestration implemented.** ✅
- **No Firebase Auth implementation** — no Firebase import (machine-enforced). ✅
- **No UI implementation.** ✅
