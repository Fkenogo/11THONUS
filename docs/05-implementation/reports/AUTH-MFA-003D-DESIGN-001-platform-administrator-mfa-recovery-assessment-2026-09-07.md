> **Title:** AUTH-MFA-003D-DESIGN-001 — Platform Administrator MFA Recovery & Reset — Policy and Architecture Assessment
> **Status:** **DESIGN / ASSESSMENT — NOT IMPLEMENTED — READY FOR FOUNDER RECOVERY POLICY DISPOSITION**
> **Classification:** Assessment (design record, completed; superseding correction `AUTH-MFA-003D-DESIGN-001-CORR-001` applied 2026-09-07)
> **Task:** `AUTH-MFA-003D-DESIGN-001`
> **Baseline:** `origin/main` at `a7b3a43756837390d60137a96883c8925b8e306e` (PR #231 merge commit, 2026-09-06)
> **Retrieval date:** 2026-09-07
> **Correction head:** PR #232 pre-correction `3f38b99668daccedc7ec4982c6fc794538accf06` → corrected `AUTH-MFA-003D-DESIGN-001-CORR-001`

> **Correction notice (`AUTH-MFA-003D-DESIGN-001-CORR-001`):** This report was reviewed by an automated reviewer on PR #232; eight substantive findings were raised and all were confirmed genuine and corrected in place. The original assessment text is preserved below, with corrections applied to the affected sections and a consolidated correction record appended as **§33**. Read §33 for the authoritative post-correction state where it supersedes earlier sections.

# AUTH-MFA-003D-DESIGN-001 — Platform Administrator MFA Recovery & Reset Policy and Architecture Assessment

## §1. Executive Summary

This assessment evaluates the policy, architecture, and Firebase capability constraints for Platform Administrator MFA recovery/reset — the controlled process by which an administrator who has lost access to their TOTP factor can restore the ability to establish MFA again.

**Critical finding:** Firebase Admin SDK has a known, unfixed bug (GitHub issue #2995) that prevents `updateUser` from writing TOTP factors. TOTP factor removal requires the Firebase Auth REST API or Identity Platform API directly. This is a material architecture constraint that must be addressed in any implementation.

**Core architectural principle:** Recovery restores the *ability* to establish MFA again. It does not itself grant privileged access. No recovery mechanism may manufacture MFA proof.

**Status:** No production code modifications are included. This is a design-only assessment. The recommended final state is **READY FOR FOUNDER RECOVERY POLICY DISPOSITION** — all material questions have been researched and presented; the Founder must now make recovery-policy decisions.

---

## §2. Takeover Discovery

### 2A. Previous Agent Work

The previous agent created:
- Local branch `docs/auth-mfa-003d-design-001` from `origin/main` (`a7b3a43`)
- Worktree at `.claude/worktrees/auth-mfa-003d` (now pruned but still listed)

**Zero commits were added.** The branch is identical to `origin/main`. No report file was created. No PR was opened. No uncommitted work exists. The worktree was pruned but the branch reference remains.

**Assessment:** The previous agent established only the branch skeleton. No substantive work was completed. This task begins the design assessment from scratch.

> **CORR-001 note:** §2 describes the state at task *genesis* (branch skeleton, no PR). That historical state is preserved. The live state at the time of CORR-001 is: branch `docs/auth-mfa-003d-design-001` is pushed to `origin` with **PR #232** open; PR head `3f38b99668daccedc7ec4982c6fc794538accf06` (pre-correction). See §33.

### 2B. Repository State

| Item | Value |
|------|-------|
| `origin/main` SHA | `a7b3a43756837390d60137a96883c8925b8e306e` |
| Baseline `a7b3a43` is ancestor of `origin/main` | **Yes** — it IS `origin/main` |
| Commits since baseline | **None** |
| Relevant local branch | `docs/auth-mfa-003d-design-001` (at `a7b3a43`) |
| Relevant remote branch | **None** (never pushed) |
| Open PR | **None** |
| Uncommitted files on branch | **None** |

### 2C. Primary Worktree Confirmation

The primary 11thonus worktree is on `docs/dec-legal-002-bt-draft-007` (`a404a53`) with unrelated FD-COM-001 work. It has not been modified, stashed, reset, or committed over by this task.

---

## §3. Governing Authority

| Document | Reference | Status |
|----------|-----------|--------|
| DEC-SEC-002 | MFA required for all platform administrators, unconditionally | CONFIRMED |
| DEC-SEC-004 (FD-MFA-2) | TOTP-only factor policy; controlled, auditable, non-bypassable recovery approved | CONFIRMED |
| DEC-GOV-011 (FD-KS-1) | Only `knowledge_editor` and `knowledge_approver` activated | CONFIRMED |
| AUTH-MFA-002 | Recovery "must be controlled, auditable, non-bypassable" | CONFIRMED |

**Recovery requirements from governing authority:**
- No permanent MFA exemption
- No client assertion of recovery
- No silent MFA bypass
- No self-service bypass that defeats MFA
- TOTP is the only approved Platform Administrator MFA factor
- No SMS MFA

---

## §4. Existing MFA Trust Boundary

The authoritative server-side MFA verification chain:

```
Firebase verifyIdToken(rawToken, checkRevoked=true)
  → decoded.firebase.sign_in_second_factor (cryptographically verified claim)
  → verifiedSecondFactorFromClaim() [firebaseTokenVerifier.ts:145-147]
  → AuthenticatedCredential.verifiedSecondFactor [boolean, required, never defaulted true]
  → deriveVerifiedMfaSatisfied(credential) [deriveVerifiedMfaSatisfied.ts — one-line bridge]
  → resolvePlatformAdministratorAuthorization(... verifiedMfaSatisfied ...)
  → evaluateKnowledgePlatformPermission(... verifiedMfaSatisfied !== true → MFA_NOT_ESTABLISHED ...)
```

**Key invariant:** `PlatformAdministrator.mfaRequired` (always `true`) is **never consulted as evidence**. It records the *requirement*; compliance comes from the server-verified token claim through the chain above.

**Recovery must never manufacture this evidence.** A recovery action that sets `verifiedSecondFactor: true` or `mfaSatisfied: true` on any persisted record or client-asserted claim would violate the trust boundary.

---

## §5. Existing Recovery Principle

The design must preserve:

> **Recovery restores the ability to establish MFA again. It does not itself grant privileged access.**

Expected conceptual end-state:

```
recovery authorized
→ old factor reset (TOTP factor removed)
→ existing sessions revoked (revokeRefreshTokens)
→ no privileged MFA session remains
→ fresh primary sign-in (email/password or Google)
→ fresh TOTP enrollment (new secret generated, new QR scanned)
→ sign-out
→ fresh primary sign-in
→ fresh TOTP challenge (server verifies real second-factor evidence)
→ server verifies real second-factor evidence via decoded.firebase.sign_in_second_factor
→ privileged authorization available again
```

**This is validated against Firebase capabilities** (see §6).

---

## §6. Firebase Capability Findings

### 6A. MFA Factor Listing

**Capability:** Admin SDK `getUser()` returns `userRecord.multiFactor.enrolledFactors` with properties `uid`, `displayName`, `factorId`, `enrollmentTime`.

**Source:** https://firebase.google.com/docs/auth/admin/manage-mfa-users (retrieved 2026-09-07)

**11thonus uses this:** Not yet — no Admin SDK MFA factor listing code exists. Future AUTH-MFA-003D implementation will need this.

### 6B. Admin SDK Factor Removal — CRITICAL BUG

**Capability (intended):** `updateUser(uid, { multiFactor: { enrolledFactors: [...] } })` fully overwrites the user's enrolled factors. To remove a specific factor: fetch current list, filter out target, write back remaining.

**Actual behavior with TOTP:** GitHub issue #2995 (Oct 2025, **still open as of 2026-09-07**): calling `updateUser` with any TOTP factor in the `enrolledFactors` array throws:

```
FirebaseAuthError: Unsupported second factor "{"uid":"...","factorId":"totp",...}" provided.
```

The `UpdateMultiFactorInfoRequest` type only supports `"phone"` factors in write operations. TOTP factors can be **read** via `getUser()` but **cannot be written back** via `updateUser`.

**Impact:** The standard Admin SDK path for factor removal does not work for TOTP. The implementation **must use the Firebase Auth REST API or Identity Platform API** directly for TOTP factor removal.

**Source:** https://github.com/firebase/firebase-admin-node/issues/2995 (retrieved 2026-09-07)

### 6C. Server-Side TOTP Factor-Removal API — RECONCILED (CORR-001)

> **Correction:** The original text conflated three different mechanisms. The verified, authoritative service-account/backend path is the **Identity Platform v1 Admin API `projects.accounts.update`** (not the client-facing `mfaEnrollment:withdraw`, and not the legacy `identitytoolkit/v3` REST). This is the recommended primary path for AUTH-MFA-003D execution. Verified against current Google Cloud reference docs (retrieved 2026-09-07).

**Primary (recommended) — Identity Platform v1 Admin `projects.accounts.update`:**
- **Endpoint:** `POST https://identitytoolkit.googleapis.com/v1/projects/{targetProjectId}/accounts:update`
- **Authentication:** Google OAuth 2.0 **service-account** credential (not an end-user ID token). Requires IAM permission `firebaseauth.users.update` on the target project. OAuth scopes: `https://www.googleapis.com/auth/identitytoolkit` or `https://www.googleapis.com/auth/cloud-platform`. A service account with `firebaseauth.users.update` can perform this.
- **User selection:** pass `localId` (the user's UID) — this is the administrator/backend selection mechanism; do **not** pass an end-user `idToken` for admin execution.
- **Factor reset semantics:** the `mfa` field is an `MfaInfo` object that **"will overwrite any previous multi-factor related information on the account."** Setting `mfa` to an empty `enrolledFactors` list removes all MFA enrollments; to remove one specific factor the executor supplies the remaining factor list. Therefore it supports both **all-factor removal** and **selective removal** (rewrite the list without the target). The `targetFactorEnrollmentId` precondition is enforced in application logic before invoking this API.
- **Tenant:** if the user belongs to an Identity Platform tenant, include `tenantId` (or use the tenant-scoped path `v1/projects/{project}/tenants/{tenant}/accounts:update`).
- **Session change:** this admin API **does not automatically revoke sessions**. Session revocation is a separate operation (see §6D). The v1 `accounts:update` request also accepts a `validSince` field (the `tokensValidAfterTime`); the AUTH-03D executor must call `revokeRefreshTokens(uid)` (or set `validSince`) explicitly. **This is the Android textual gap removed by CORR-001.**
- **Current status:** supported (current Identity Platform v1 Admin REST reference; `projects.accounts.update`, updated 2025-05-30).

**Not the service-account/backend path — `accounts.mfaEnrollment:withdraw` (v2):**
- **Endpoint:** `POST https://identitytoolkit.googleapis.com/v2/accounts/mfaEnrollment:withdraw`
- **Authentication:** **requires the user's own ID token** (`idToken`) — it is the client/SDK-facing unenrollment operation (`multiFactor(user).unenroll`), **not** a service-account/backend operation.
- **Semantics:** revokes **one** second factor identified by `mfaEnrollmentId`; returns newly issued `idToken`/`refreshToken` for that user. Not usable for the locked-out target (no valid user token available at execution time) and not the break-glass operator path. **Not recommended** for AUTH-MFA-003D backend execution.

**Admin SDK `updateUser` — remains BLOCKED by issue #2995:**
- `updateUser(uid, { multiFactor: { enrolledFactors: [...] } })` cannot be used to write back a TOTP factor (throws `Unsupported second factor ... "factorId":"totp"`), so it is not a reliable backend path for factor removal while the bug is open.

**Legacy note (superseded):** the earlier report text referencing `identitytoolkit/v3/relyingparty/accounts:update` (Firebase Auth REST, API-key–based, `mfaInfo`) was a legacy/v1 Firebase Auth variant. For a service account executing a governed recovery, the **v1 Admin** `projects.accounts.update` (documented above) is the recommended, verified primary path; a fallback to the legacy Firebase Auth REST `accounts:update` with a service-account OAuth2 token is possible but not preferred, and its semantics must be re-verified at implementation time. **Do not** use the end-user `mfaEnrollment:withdraw` for backend execution.

**Source:** https://cloud.google.com/identity-platform/docs/reference/rest/v1/projects.accounts/update and https://cloud.google.com/identity-platform/docs/reference/rest/v2/accounts.mfaEnrollment/withdraw (retrieved 2026-09-07).

### 6D. Session/Refresh Token Revocation — ID-token lifetime vs backends acceptance (CORR-001)

**Capability:** `revokeRefreshTokens(uid)` updates `tokensValidAfterTime` to the current time. Subsequent `verifyIdToken(idToken, true)` compares the token's `iat` against `tokensValidAfterTime`: if `iat < tokensValidAfterTime` the token is rejected as revoked.

**Behavior — two distinct facts:**
1. **Cryptographic token lifetime:** an already-issued Firebase ID token carries an `exp` roughly one hour from issuance; its signed expiry does not change after revocation.
2. **11thONUS backend acceptance:** the backend does **not** accept a previously issued token for that one-hour window. Every production verification calls `verifyIdToken(rawToken, true)` (revocation checking enabled) at [firebaseTokenVerifier.ts:174](../../../functions/src/domains/authentication/services/firebaseTokenVerifier.ts) (`await verifyIdToken(raw.rawToken, true)`); the freshness anchor `authenticatedAtFromClaim(decoded.auth_time)` is at `:201`. Once revocation is authoritative, a token issued before `tokensValidAfterTime` is **rejected as revoked** by this backend — revocation is effective immediately for this server, not deferred ~1 hour.

**Therefore:** there is **no one-hour privileged-access window** against 11thONUS after `revokeRefreshTokens(uid)`. Client-held tokens may still exist and still cryptographically verify (their `exp` is unchanged) until they reach their one-hour `exp`, but the 11thONUS backend rejects any token issued before `tokensValidAfterTime` because verification calls `verifyIdToken(rawToken, true)`. No residual "~1 hour usable session" risk is accepted in the threat analysis or the Founder decisions. Real propagation/cache timing (the short interval — typically tens of milliseconds to a few seconds — for `tokensValidAfterTime` to become authoritative across Firebase's verification plane) is a much smaller and bounded propagation concern, distinct from the one-hour signed-lifetime of a token, and is not treated as an accepted one-hour access window.

**11thonus uses this:** the token verifier already calls `verifyIdToken(raw.rawToken, true)` with `checkRevoked=true` at [firebaseTokenVerifier.ts:174](../../../functions/src/domains/authentication/services/firebaseTokenVerifier.ts) (with the `auth_time` freshness anchor at `:201`). Revocation checking is already active.

**Source:** https://firebase.google.com/docs/auth/admin/manage-sessions (retrieved 2026-09-07).

### 6E. Client-Side TOTP Unenrollment

**Capability:** `multiFactor(user).unenroll(mfaEnrollmentId)` — requires recent re-authentication (`auth/requires-recent-login`) and the user's own session token.

**Behavior:**
- Under the hood this invokes the client-facing `v2/accounts/mfaEnrollment:withdraw` (see §6C); sessions are NOT automatically revoked on unenrollment
- If the most recently enabled factor is unenrolled, user receives `auth/user-token-expired` and is logged out
- Email notification sent to user

**11thonus uses this:** Not yet — no client-side unenrollment code exists. The `MfaEnrollmentPage` explicitly states "this page never re-enrolls, removes, or replaces factors (removal/replacement is `AUTH-MFA-003D`)." Client unenrollment is **not** the recommended backend execution path for recovery (it needs the target's own session token, unavailable to a locked-out user or break-glass operator).

### 6F. Factor Reset Behavior Summary

| Action | Sessions revoked? | Backend acceptance after revocation | Next sign-in challenged? |
|--------|-------------------|--------------------------------------|--------------------------|
| Admin removes TOTP factor via Identity Platform v1 Admin `projects.accounts.update` (`mfa` overwrite) | **No** — must also call `revokeRefreshTokens(uid)` as a separate step | Pre-revocation ID tokens rejected once revocation is authoritative (no ~1 h usable window against 11thONUS) | No — no factor enrolled, so no challenge |
| Client unenrolls TOTP (`mfaEnrollment:withdraw`) | No (unless most recent factor) | — | No — no factor enrolled |
| `revokeRefreshTokens` alone | Yes (refresh tokens) | Pre-revocation ID tokens rejected; signed `exp` (~1 h) unchanged but unusable against backend | No — factor still enrolled, so a later sign-in still challenges |

**Critical implication for recovery:** Removing a TOTP factor and revoking sessions are **separate operations** that must both be performed. Neither automatically triggers the other — the Identity Platform v1 Admin `projects.accounts.update` does not revoke sessions on its own, exactly as `revokeRefreshTokens` alone does not remove the factor. The recovery-execution orchestration (see §14) must therefore sequence them, and must **fail closed** if revocation fails.

---

## §7. Repository Architecture — Complete Inspection

### 7A. Platform Administration

| Component | File | Status |
|-----------|------|--------|
| Domain model | `functions/src/domains/platformAdministration/models/platformAdministrator.ts` | Complete |
| Roles | `platformAdministratorRole.ts` — closed set: `knowledge_editor`, `knowledge_approver` | Complete |
| Status lifecycle | `platformAdministratorStatus.ts` — `invited → active → suspended → removed` | Complete |
| Audit record | `platformAdministrationAuditRecord.ts` — append-only | Complete |
| Audit repository | `platformAdministrationAuditRepository.ts` — write-only seam | Complete |
| Admin repository | `platformAdministratorRepository.ts` — doc-id-as-key pattern | Complete |
| Bootstrap | `bootstrapPlatformAdministrator.ts` — backend/service-account only, no public endpoint | Complete |
| Discovery | `discoverPlatformAdministrator.ts` — read-only, routing only | Complete |
| Permission evaluator | `evaluateKnowledgePlatformPermission.ts` — fail-closed, MFA-gated | Complete |
| Authorization resolver | `resolvePlatformAdministratorAuthorization.ts` — transactional read-audit-write | Complete |
| MFA derivation | `deriveVerifiedMfaSatisfied.ts` — one-line bridge from credential | Complete |
| MFA integration test | `mfaIntegration.emulator.test.ts` — full chain verified | Complete |
| Error taxonomy | `platformAdministrationErrors.ts` — uses existing closed 14-category set | Complete |
| Permission catalogue | `knowledgePermissionCatalogue.ts` — role-default grants, no override | Complete |

### 7B. Authentication — MFA

| Component | File | Status |
|-----------|------|--------|
| Token verifier | `functions/src/domains/authentication/services/firebaseTokenVerifier.ts` — derives `verifiedSecondFactor` from `sign_in_second_factor` claim | Complete |
| Authenticated credential | `functions/src/domains/authentication/models/authenticatedCredential.ts` — `verifiedSecondFactor: boolean` (required) | Complete |
| TOTP enrollment (SDK) | `apps/web/src/authentication/mfa/mfaSdkFlow.ts` — SDK isolation, injectable seam | Complete |
| TOTP enrollment (page) | `apps/web/src/authentication/mfa/MfaEnrollmentPage.tsx` — self-contained, routing via discovery | Complete |
| TOTP challenge (SDK) | `apps/web/src/authentication/mfa/mfaSdkChallenge.ts` — bounded challenge, fail-closed | Complete |
| MFA challenge (panel) | `apps/web/src/authentication/SignInPanel.tsx` — `PendingMfaChallenge` integration | Complete |
| Auth bridge | `apps/web/src/authentication/authenticateClient.ts` — AUTH-03 session bridge | Complete |

### 7C. Session Management

| Component | File | Status |
|-----------|------|--------|
| Token verification | `firebaseTokenVerifier.ts` — `verifyIdToken(rawToken, true)` with revocation checking | Complete |
| Session access | `sessionAccessService.ts` — identity-protected + privileged re-auth gates | Complete |
| Privileged freshness | `privilegedReauthentication.ts` — 5-minute default, measured from `authenticatedAt` | Complete |
| Sign-out | `signOutFlow.ts` — client-only `signOut`, no backend revocation | Complete |
| Backend session store | **None** — Firebase Auth is the sole token authority | By design |

### 7D. Existing Recovery Precedent

| Component | File | Status |
|-----------|------|--------|
| Identity recovery service | `functions/src/domains/authentication/services/identityRecoveryService.ts` | Merged |
| Recovery proof model | `functions/src/domains/identity/models/recoveryProof.ts` | Merged |
| Identity recovery repository | `functions/src/domains/identity/repositories/identityRecoveryRepository.ts` | Merged |
| Recovery proof categories | `phone_otp`, `email_verification`, `linked_provider`, `support_assisted`, `administrator_assisted` | Merged |

**Precedent value:** The existing `administrator_assisted` recovery proof category in `RecoveryProof` provides a named slot for a platform-administrator MFA recovery action. However, the current implementation is customer-identity-scoped and does not address platform-administrator MFA factor management.

### 7E. Audit Architecture

| Component | File | Status |
|-----------|------|--------|
| Platform admin audit | `platformAdministrationAuditRecords` collection — append-only | Complete |
| Current action vocabulary | `platform_administrator_bootstrapped`, `knowledge_permission_evaluated` | Closed set (2 entries) |
| Identity audit | `outboxEntries` projection — different domain, not reusable | By design |

**Recovery will require extending the audit action vocabulary** — see §12.

---

## §8. Role/Authority Findings

### Current Roles

| Role | Status | Security-recovery relevance |
|------|--------|----------------------------|
| `knowledge_editor` | Active (MVP) | **Not a security-recovery role** — grants knowledge draft/edit permissions |
| `knowledge_approver` | Active (MVP) | **Not a security-recovery role** — grants knowledge approve/publish/retire permissions |
| `platform_super_administrator` | Deferred (FD-KS-1) | Do not activate for recovery |
| Other TRD18 roles | Deferred | Do not activate for recovery |

**Finding:** Neither active role is governed as a security-recovery role. Recovery authority must be established separately, not inferred from knowledge-studio permissions.

### Bootstrap Precedent

`bootstrapPlatformAdministrator.ts` demonstrates the backend/service-account-only execution boundary:
- No public endpoint (never wired to `onCall`/`onRequest`)
- No Firebase ID token required
- Authority comes from Admin SDK service-account access
- Audited in same transaction as record creation
- Idempotent/retry-safe
- Fails closed on conflict

**This is the strongest existing precedent for break-glass recovery execution.** The same trust boundary can be reused.

---

## §9. Single-Administrator Break-Glass Problem

### The Problem

If only one platform administrator exists and they lose TOTP access:
- No other administrator can approve recovery
- The administrator cannot approve their own recovery (self-approval prohibition)
- The platform is locked out of Knowledge Studio privileged operations

### Assessment

| Option | Viable? | Notes |
|--------|---------|-------|
| Self-approval | **No** | Violates DEC-SEC-004 non-bypassable requirement |
| Second administrator | **No** — at MVP, only 1-2 administrators may exist | Insufficient for two-person approval |
| Backend service-account-only execution | **Yes** | Same trust boundary as bootstrap; no new mechanism |
| Operator verification + single approval | **Yes** | Requires explicit Founder authority |

### Recommended Approach

The break-glass path should use the **same trust boundary as bootstrapPlatformAdministrator**:
1. Backend service-account execution only (no public endpoint)
2. Targeted to a specific administrator only
3. Requires explicit Founder/operator authorization (not a standing permission)
4. Full audit trail
5. No role/lifecycle elevation
6. Mandatory fresh enrollment + challenge after reset

This is the only path that satisfies all requirements without introducing new trust boundaries.

---

## §10. Normal Recovery Options — REVISED (CORR-001)

> **Correction:** The affected administrator who has lost TOTP **cannot** use the normal authenticated application path. In the lost-TOTP scenario: primary factor accepted → Firebase raises `auth/multi-factor-auth-required` → no resolved `UserCredential` → no AUTH-03 token → no normal authenticated application session. The target therefore cannot create an authenticated recovery request through the existing sign-in path. Request initiation is instead designed as **Option A** (independently authenticated actor/operator creates the request on the target's behalf) or **Option B** (a bounded pre-MFA recovery proof). See §10B below.

### 10A. Who May Request Recovery

| Candidate | Assessment | Recommendation |
|-----------|------------|----------------|
| Affected administrator (via normal app path) | **Not technically possible** — primary factor alone never yields an authenticated session in the lost-TOTP scenario | Not a valid requestor through the normal path |
| Another (MFA-satisfied) administrator/operator | Can attest target identity; limited at MVP | Valid requestor (Option A) |
| Affected administrator (via a bounded pre-MFA proof) | Proves primary-factor possession without a privileged session (see §10B) | Valid requestor **only** if Founder authorizes Option B and the proof is strictly bounded to request creation |
| Founder/operator | Highest authority | Valid requestor |
| Backend operator | Service-account access | Valid requestor (break-glass) |

### 10B. Locked-Out Requester Path — Two Design Options (CORR-001)

Because the lost-TOTP target cannot authenticate through the normal path, request initiation must be **Option A** or **Option B** (Founder decision; see §19, Decision 1). **Neither is implemented here** — this is a design decision.

**Option A — independently authenticated actor/operator creates the request.** Another authorized, MFA-satisfied administrator/operator (or Founder/operator) attests the target and creates the `MfaRecoveryRequest` on the target's behalf. This requires no new authentication mechanism; it relies on the existing server-verified MFA path for the requester and an explicit authorization (Founder decision) that such a requester may initiate recovery.

**Option B — bounded pre-MFA recovery proof.** A separate recovery-request mechanism accepts evidence available **before** TOTP resolution, but that evidence must not itself grant privileged access. If this option is proposed, the design must define:
- **What proves primary-factor possession:** a fresh challenge against the target's primary credential (e.g., a signed primary-factor sign-in step that is deliberately allowed to stop at the `multi-factor-auth-required` boundary) or another Founder-approved proof (e.g., a one-time operator-issued code) — the specific mechanism is itself a Founder decision (see §19).
- **How the server verifies it without AUTH-03 completion:** the verification must be a dedicated, non-privileged server check that confirms primary-factor possession but produces **no** authenticated-application session and **no** AUTH-03 token, and does not reach `verifiedSecondFactor`/MFA-satisfied state.
- **How it is bounded to recovery-request creation only:** the proof is consumed and invalidated for a single `MfaRecoveryRequest` in `pending` status, is not usable for any privileged operation, does not mint a session/refresh token, and expires with the request.
- **Why it cannot become a privilege bypass:** it never produces MFA evidence (`verifiedMfaSatisfied`), never sets `verifiedSecondFactor`, never grants privileged access, and is server-verified via a non-privileged path with no elevation.

The Founder decision section must reflect that the affected target cannot simply use the existing authenticated application path (see §19, Decision 1).

### Who May Approve Recovery (CORR-001)

| Candidate | Assessment | Recommendation |
|-----------|------------|----------------|
| Affected administrator | **No self-approval** | Explicit prohibition |
| Another Platform Administrator | Valid only if **active** AND presenting the existing **server-verified MFA** path (`verifiedMfaSatisfied === true`); independent of target | One independent MFA-satisfied approver minimum |
| Founder/operator | Highest authority | May approve any recovery (separate governed trust boundary when acting as operator) |
| `knowledge_approver` | Not a security-recovery role | **Cannot approve** without separate authority and without satisfying the MFA requirement |

**Mandatory approver MFA:** DEC-SEC-002 requires MFA for all Platform Administrators without exception. In-product approval therefore requires an **active** Platform Administrator whose request presents the server-verified MFA evidence (`verifiedMfaSatisfied === true` via the token's `sign_in_second_factor` claim). There is **no active-status-only approval, no factorless administrator approval, and no client-declared MFA state**. The backend/service-account break-glass operator is a distinct authority (see §11) and is **not** a Platform Administrator browser session.

### Approval Cardinality

| Model | Pros | Cons | Recommendation |
|-------|------|------|----------------|
| One independent approver | Simple, workable at MVP | Single point of collusion | **Recommended for MVP** |
| Two-person approval | Stronger | Impractical with 1-2 administrators | Future consideration |
| Operator-only | Strongest | Founder must act for every recovery | Break-glass path only |

### Self-Approval Assessment

**Recommendation: No self-approval.**

Rationale:
- Self-approval defeats the purpose of independent verification
- An attacker with password but not TOTP could initiate self-recovery
- The bootstrap precedent shows operator-only execution is viable
- At MVP with 1-2 administrators, the break-glass path handles the single-admin case

---

## §11. Identity Evidence and Break-Glass Authority — REVISED (CORR-001)

Evidence that a recovery requestor is who they claim (note: for a lost-TOTP target this is **not** a normal authenticated session — see §10B):

| Evidence Type | Strength | Assessment |
|---------------|----------|------------|
| Primary-factor possession (via a **bounded pre-MFA proof**, corroborated by an actor) | Strong — proves possession of primary credential without a privileged session | Required for Option B |
| Verified email | Moderate — proves email access, not identity | Supplementary only |
| External verification (phone, ID) | Strong — independent channel | Not available at MVP |
| Operator verification | Strong — human verification | Break-glass path |
| Independent administrator approval (MFA-satisfied) | Strong — peer verification | Normal path |

**Critical distinction:** Verified email is **not** MFA and must never be treated as proof of second-factor ownership. Primary-factor possession alone is **not** MFA and must not be treated as establishing a privileged session.

### Break-Glass Authority (distinct trust boundary)

The break-glass authority uses the **bootstrap precedent** (`bootstrapPlatformAdministrator.ts` — backend/service-account-only, no public endpoint), but it is explicitly **not** an in-product administrator permission:
- Backend/service-account authority is a **different trust boundary** from an in-app Platform Administrator permission.
- Break-glass does **not** require browser MFA because it is not an administrator browser session — it is a governed operational trust boundary.
- It must require **explicit operator authorization** for each invocation (never a standing permission).
- It must be **fully audited**.
- It **cannot alter roles or lifecycle** (status remains `active`; no role elevation).
- It **cannot grant privileged access** — it only removes the lost factor to restore the path to new MFA establishment.
- There is **no public break-glass endpoint**.

---

## §12. Audit Vocabulary — Proposed Minimum

The current `PLATFORM_ADMINISTRATION_AUDIT_ACTION_TYPES` is a closed set with exactly 2 entries:
- `platform_administrator_bootstrapped`
- `knowledge_permission_evaluated`

Recovery will require extending this set. **This design task does not modify the TypeScript vocabulary** (per scope), but proposes the minimum required additions for AUTH-MFA-003D implementation:

| Proposed Action Type | Trigger | Actor | Target |
|---------------------|---------|-------|--------|
| `mfa_recovery_requested` | Recovery request submitted | Requestor | Target administrator |
| `mfa_recovery_approved` | Recovery request approved | Approver | Target administrator |
| `mfa_recovery_executed` | Factor reset + session revocation completed | Executor (operator) | Target administrator |
| `mfa_recovery_denied` | Recovery request denied | Denier | Target administrator |
| `mfa_recovery_expired` | Recovery request expired without approval | System | Target administrator |

**Source distinction:** These are **repository authority** proposals. The exact vocabulary is a Founder decision — see §19.

---

## §13. Threat Analysis

### T1: Attacker has password but not TOTP

| Aspect | Detail |
|--------|--------|
| **Current protection** | `evaluateKnowledgePlatformPermission` denies with `MFA_NOT_ESTABLISHED` when `verifiedSecondFactor` is false |
| **Gap** | Attacker could initiate password reset → new password → still no TOTP → still denied |
| **Mitigation** | Password reset does not bypass MFA; recovery requires separate authorization |
| **Founder decision** | No — current architecture already protects |

### T2: Attacker controls email but not TOTP

| Aspect | Detail |
|--------|--------|
| **Current protection** | Email is primary factor only; MFA still required for privileged operations |
| **Gap** | Attacker could attempt to use email recovery flow to reset TOTP |
| **Mitigation** | TOTP recovery must require independent authorization beyond email verification |
| **Founder decision** | No — architecture should enforce this |

### T3: Attacker steals an existing authenticated session

| Aspect | Detail |
|--------|--------|
| **Current protection** | `revokeRefreshTokens(uid)` invalidates refresh tokens and updates `tokensValidAfterTime`; every production verification calls `verifyIdToken(raw.rawToken, true)` at [firebaseTokenVerifier.ts:174](../../../functions/src/domains/authentication/services/firebaseTokenVerifier.ts), so a token issued before `tokensValidAfterTime` is rejected by 11thONUS |
| **Gap** | A stolen **refresh token** is invalidated by revocation; a stolen **already-issued ID token** keeps its signed `exp` (~1 h) but is rejected by 11thONUS once revocation is authoritative (no one-hour usable window against this backend) |
| **Mitigation** | Session revocation at recovery-execution time rejects pre-revocation tokens at the backend; the privileged 5-minute freshness gate further bounds privileged actions; recovery execution also fails closed if revocation cannot complete so a stale MFA-authenticated session cannot outlive the reset |
| **Founder decision** | No — existing protections are adequate; the one-hour signed-lifetime is not an accepted one-hour privileged-access window |

### T4: Malicious administrator resets another admin's TOTP

| Aspect | Detail |
|--------|--------|
| **Current protection** | No recovery mechanism exists yet |
| **Gap** | A compromised administrator could reset a co-administrator's TOTP to gain their account |
| **Mitigation** | Normal path requires independent approver; break-glass requires Founder authorization; full audit trail |
| **Founder decision** | Yes — who may approve recovery? (§19, Decision 2) |

### T5: Malicious target + approver collusion

| Aspect | Detail |
|--------|--------|
| **Current protection** | None (no recovery mechanism) |
| **Gap** | Colluding administrator and approver could perform unauthorized recovery |
| **Mitigation** | Audit trail makes collusion detectable; break-glass path requires Founder; mandatory post-reset enrollment means colluding party gets no standing access |
| **Founder decision** | Yes — is audit trail sufficient or is two-person approval required? (§19, Decision 3) |

### T6: Single-administrator lockout

| Aspect | Detail |
|--------|--------|
| **Current protection** | None (no recovery mechanism) |
| **Gap** | If sole administrator loses TOTP and no break-glass path exists, platform is locked |
| **Mitigation** | Backend service-account-only break-glass recovery; bootstrap precedent already exists |
| **Founder decision** | Yes — break-glass authority and process (§19, Decision 4) |

### T7: Compromised service account

| Aspect | Detail |
|--------|--------|
| **Current protection** | Service-account access is the highest trust boundary; bootstrap already relies on it |
| **Gap** | Compromised service account could execute unauthorized recovery |
| **Mitigation** | Service-account access is an operational security concern, not a recovery-design concern; same risk exists for bootstrap |
| **Founder decision** | No — operational security, not recovery policy |

### T8: Replayed recovery execution

| Aspect | Detail |
|--------|--------|
| **Current protection** | None (no recovery mechanism) |
| **Gap** | Same recovery action could be replayed and accidentally remove a newly enrolled replacement factor (retry hazard) |
| **Mitigation** | Execution binds to the original `targetFactorEnrollmentId` (immutable precondition). On retry the executor verifies the current target still holds the originally approved enrollment: if already gone → idempotent/complete (no-op); if a different (replacement) factor exists → fail closed and require a new recovery decision; it **never** removes by "current factor list" |
| **Founder decision** | No — technical implementation detail |

### T9: Duplicate recovery execution

| Aspect | Detail |
|--------|--------|
| **Current protection** | None |
| **Gap** | Parallel recovery requests could cause race conditions |
| **Mitigation** | Firestore transaction with read-before-write on a single `MfaRecoveryRequest` doc; the status state machine (`pending → approved → executing → completed | failed | expired`) plus an idempotency claim on the `targetUserId`/`targetFactorEnrollmentId` prevents concurrent execution; approval cardinality governed by a dedicated authorization check, not inferred from request fields |
| **Founder decision** | No — technical implementation detail |

### T10: Wrong target identity

| Aspect | Detail |
|--------|--------|
| **Current protection** | None |
| **Gap** | Recovery could target the wrong administrator |
| **Mitigation** | The request creation path supplies a bounded recovery proof (or an authorized actor/operator attests the target); the executor validates the exact `targetUserId` and the exact `targetFactorEnrollmentId`; `platformAdministrators/{userId}` doc-id-as-key prevents mismatch; the recovery request binds the factor being reset so a retargeted or re-enrolled identity cannot be operated on |
| **Founder decision** | No — technical implementation detail |

### T11: Factor removed but audit write fails

| Aspect | Detail |
|--------|--------|
| **Current protection** | None |
| **Gap** | TOTP factor removed (in Firebase Auth) but audit record not written (Firestore) — unauditable state change |
| **Mitigation** | Firebase Auth and Firestore **cannot be one atomic transaction**; the design therefore uses a compensation/eventual-consistency model: persist a durable execution record *before* the external factor-removal call, then on completion write the audit; on audit-write failure retry the Firestore write against the durable record (idempotent). The recovery request's own state is the source of truth for reconciliation |
| **Founder decision** | No — technical implementation detail |

### T12: Factor removed but session revocation fails

| Aspect | Detail |
|--------|--------|
| **Current protection** | None |
| **Gap** | If factor removal proceeds after `revokeRefreshTokens` fails, an MFA-authenticated session could remain usable after the factor is gone — privileged access left behind |
| **Mitigation** | **Fail closed:** approved recovery → revoke refresh tokens → if revocation fails the request remains `failed`/retryable and factor reset **MUST NOT proceed**; no downgrade relying on natural token expiry. Factor reset executes only after revocation succeeds |
| **Founder decision** | No — technical implementation detail |

### T13: Session revocation succeeds but factor reset fails

| Aspect | Detail |
|--------|--------|
| **Current protection** | None |
| **Gap** | Sessions revoked but TOTP factor not removed — target has no working MFA session and the old factor still exists |
| **Mitigation** | The request stays `executing`/`failed` for retry. On retry the executor re-verifies target is `active` and that the approved `targetFactorEnrollmentId` still matches the current factor; because revocation already succeeded, no MFA-authenticated session survives the gap. Operator (service-account) retries factor removal via the Identity Platform v1 Admin API |
| **Founder decision** | No — technical implementation detail |

### T14: Administrator suspended/removed during recovery

| Aspect | Detail |
|--------|--------|
| **Current protection** | Status lifecycle exists (`active → suspended → removed`) |
| **Gap** | Recovery could complete for a suspended/removed administrator |
| **Mitigation** | Recovery execution must verify target status is still `active` at execution time; if status changed, recovery is denied |
| **Founder decision** | No — technical implementation detail |

### T15: Recovery request outlives intended validity

| Aspect | Detail |
|--------|--------|
| **Current protection** | None |
| **Gap** | A recovery request approved yesterday may no longer reflect current intent |
| **Mitigation** | Recovery approvals should expire (recommended: 1 hour); expired requests require re-approval |
| **Founder decision** | Yes — expiry requirement (§19, Decision 8) |

---

## §14. Atomicity and Partial-Failure Model — REVISED (CORR-001)

### Cross-Service Boundary

Firebase Auth operations and Firestore transactions **cannot be assumed atomic together, and cannot be in one atomic transaction**. Factor removal happens in Firebase Auth via the Identity Platform v1 Admin `projects.accounts.update`; session revocation happens in Firebase Auth (`revokeRefreshTokens`); approval, persistent recovery state, and audit records live in Firestore. These are separate systems with independent failure domains.

### Recovery-Execution Invariant (fail-closed)

The following ordering is **mandatory** and fails closed:

```
approved recovery
→ verify target still active
→ verify approved factor enrollment still matches (targetFactorEnrollmentId)
→ revoke refresh tokens (revokeRefreshTokens)
→ IF revocation fails: STOP — request stays failed/retryable; factor reset MUST NOT proceed
→ revocation succeeds
→ THEN factor reset may proceed (Identity Platform v1 Admin projects.accounts.update)
→ persist completion + audit
```

**Why factor reset must not proceed after revocation failure:** removing the factor while an MFA-authenticated session remains valid could leave a previously authenticated (MFA-satisfied) session with privileged access after the factor is gone. The design must fail closed, not rely on natural token expiry as a fallback.

### Recommended Orchestration Model (Facet: request → approval → execution → recovery)

```
request (Firestore: mfaRecoveryRequests, status "pending", binds targetUserId + targetFactorEnrollmentId)
→ approval (Firestore: status → "approved", approvedBy = active admin with verifiedMfaSatisfied === true)
→ execution claimed (Firestore: transaction read-before-write, status → "executing")
→ re-verify target active
→ re-verify approved targetFactorEnrollmentId still matches current factor
→ revoke refresh tokens (Firebase Auth: revokeRefreshTokens)
→ IF revocation fails → status stays executing/failed; retry locally; escalate to operator; DO NOT remove factor
→ factor reset (Identity Platform v1 Admin projects.accounts.update, mfa overwrite for targetFactorEnrollmentId)
→ persist completion (Firestore: status → "completed", audit record) — durable and idempotent
```

### Failure Handling (revised)

| Failure Point | Recovery Strategy |
|---------------|-------------------|
| **Session revocation fails** | **Fail closed.** Request stays `executing`/`failed`, retry, escalate to break-glass operator. Factor reset **MUST NOT proceed**. No downgrade relying on natural expiry. |
| **Factor removal fails after revocation succeeded** | Do not mark completed; request stays `executing`/`failed`; retry via break-glass operator using Identity Platform v1 Admin `projects.accounts.update`; no MFA session survives the gap (revocation already succeeded). |
| **Audit write fails after factor removal** | Compensation: retry the Firestore audit write against the durable `MfaRecoveryRequest` record (idempotent). Factor already removed; state recoverable. |
| **Execution-state update fails after factor removal** | Same as audit failure — the durable request record is the source of truth; retry to reach `completed`. |
| **All steps succeed but completion write fails** | Retry; idempotency guaranteed by binding to `targetFactorEnrollmentId` — a retry that finds the original factor gone treats the reset step as already completed (idempotent). |
| **Replacement factor appears before retry** | Detect that the current factor differs from the approved `targetFactorEnrollmentId` → fail closed and require a NEW recovery decision; do not remove the replacement factor. |

### Explicit Retry-State Semantics

- **Revocation succeeded / factor removal failed:** request remains `executing`/`failed`; safe to retry factor removal (idempotent, replay-safe) because revocation has already succeeded.
- **Factor already absent because a prior attempt succeeded:** the executor verifies `targetFactorEnrollmentId` is no longer present → treat reset as already completed (idempotent complete).
- **Replacement factor appears before retry:** the current factor differs from the approved `targetFactorEnrollmentId` → fail closed; require a new recovery decision; never remove the replacement.
- **Completion write fails after external operations:** the durable `MfaRecoveryRequest` record lets the retry reconcile actual Firebase Auth state with Firestore state and settle on one terminal status.

### Idempotency

- Execution binds to the **immutable `targetFactorEnrollmentId`** captured at approval time (never to a "current factor list" re-read at retry time). This makes replay/retry safe and prevents accidental removal of a replacement factor.
- Recovery request has a unique ID (UUID) and a `correlationId` to prevent duplicate processing.
- Execution state machine: `pending → approved → executing → completed | failed | expired`, with `denied` reachable from `pending`.

---

## §15. Recommended MVP Architecture — REVISED (CORR-001)

> **Correction:** The prior normal path asserted the locked-out target could "authenticate (primary factor)" and submit a request, and that an approver needed "primary + MFA — if they have MFA". Both are corrected below. The four phases are now explicitly separated: **request initiation**, **approval**, **execution**, and **target recovery**. The affected administrator who lost TOTP cannot simply use the existing authenticated application path (primary factor accepted → `auth/multi-factor-auth-required` → no resolved `UserCredential` → no AUTH-03 token → no session), so request creation is delegated to a bounded pre-MFA mechanism or an independently authenticated actor/operator (see §10B).

### Normal Path (four separated phases)

```
PHASE 1 — REQUEST INITIATION
   Option A (independently authenticated actor/operator):
     - Mandated by Founder decision; an authorized (MFA-satisfied) administrator/operator creates
       the recovery request on the target's behalf, attesting the target identity.
     - Server verifies the requestor is NOT the target (no self-approval).
     - Firestore: MfaRecoveryRequest created (status "pending"), binding targetUserId +
       targetFactorEnrollmentId.
   Option B (bounded pre-MFA recovery proof) — if selected:
     - The target proves primary-factor possession via a separate server-verifiable mechanism that
       does NOT complete MFA, does NOT produce an AUTH-03 token, and does NOT establish a privileged
       session (see §10B for the exact boundary).
     - Server verifies the proof WITHOUT AUTH-03 completion and bounds it strictly to recovery-request
       creation; it cannot be reused to obtain privileged access.
   Founder decision required: which option(s) to authorize (see §19).

PHASE 2 — APPROVAL
   - Approver must be an ACTIVE Platform Administrator presenting the existing server-verified MFA
     path: verifiedMfaSatisfied === true (from the token's sign_in_second_factor claim via
     firebaseTokenVerifier → AuthenticatedCredential.verifiedSecondFactor → deriveVerifiedMfaSatisfied).
   - NO active-status-only approval; NO factorless administrator approval; NO client-declared MFA state.
   - Server verifies approver is independent of target.
   - Firestore: status → "approved", approvedBy + approvedAt recorded.

PHASE 3 — EXECUTION
   - Privileged, idempotent, bound to targetFactorEnrollmentId.
   - Re-verify approval valid (not expired, not revoked).
   - Re-verify target still ACTIVE.
   - Re-verify approved targetFactorEnrollmentId still matches the current factor.
   - Firebase Auth: revokeRefreshTokens(targetUserId)  ← revocation FIRST
   - IF revocation fails: STOP; request stays executing/failed; factor reset MUST NOT proceed.
   - Identity Platform v1 Admin: projects.accounts.update (mfa overwrite) removes the approved factor.
   - Firestore: status → "completed", audit record written (idempotent).

PHASE 4 — TARGET RECOVERY
   - Target performs a fresh primary sign-in (email/password or Google).
   - No TOTP challenge (the approved factor was removed).
   - Mandatory new TOTP enrollment (new secret, QR, code verified).
   - Forced sign-out (client clears local session).
   - Fresh primary sign-in.
   - TOTP challenge: server verifies decoded.firebase.sign_in_second_factor → verifiedSecondFactor: true
   - Privileged authorization available again.
```

### Break-Glass Path (backend/service-account trust boundary)

> **Correction (§11):** The break-glass authority is a **different trust boundary** from an in-product administrator permission. Backend/service-account authority is used for recovery the same way `bootstrapPlatformAdministrator.ts` uses it — it is **not** an in-app permission, does **not** require browser MFA, requires **explicit operator authorization**, is **fully audited**, **cannot alter roles/lifecycle**, **cannot grant privileged access**, and **only restores the path to new MFA establishment**. There is **no public break-glass endpoint**.

```
1. Founder/authorized operator action
   - Backend/service-account-only execution (no public endpoint — same trust boundary as bootstrap).
   - Explicit operator authorization required for each invocation (not a standing permission).

2. Targeted to one known Platform Administrator only
   - Target userId must be a known platform administrator; execution binds the approved
     targetFactorEnrollmentId.

3. Execution (mirrors Phase 3)
   - Re-verify target active; re-verify approved factor enrollment matches.
   - Firebase Auth: revokeRefreshTokens(targetUserId); if it fails → STOP (fail closed).
   - Identity Platform v1 Admin: projects.accounts.update removes the approved factor.
   - Firestore: audit record written (action "mfa_breakglass_executed").

4. No role/lifecycle change
   - PlatformAdministrator.status remains "active"; no new roles; no access elevation.
   - Recovery only restores the ability to establish MFA; it grants no privileged access.

5. Mandatory fresh enrollment + challenge (same as Phase 4).
```

### Architecture Validation

**Validated:** Both models satisfy the governing requirements:
- Controlled: explicit authorization required
- Auditable: every action recorded
- Non-bypassable: no path skips MFA re-establishment
- No manufacturing of MFA evidence

**Rejected alternatives:**
- Self-service recovery: violates non-bypassable requirement
- Email-only verification: not sufficient evidence for MFA recovery
- Persistent MFA exemption flag: violates no-permanent-exemption requirement
- Client-asserted recovery: violates no-client-assertion requirement
- A recovery path that lets the locked-out target authenticate through the normal MFA sign-in flow (not technically possible — primary factor alone never yields an authenticated session in the lost-TOTP scenario)

---

## §16. Recovery State Model

### Option A: Operational Command (No Persistent Request)

Recovery is executed as a single atomic operation (like bootstrap) — no persistent request object.

**Pros:** Simpler; matches bootstrap precedent; no expiry management needed.
**Cons:** No audit of the request/approval phase; no recovery trail; approver's decision not recorded.

### Option B: Persistent Recovery Request Object (Recommended) — REVISED (CORR-001)

A `mfaRecoveryRequests` Firestore collection tracks the full lifecycle. **The invariant added by CORR-001 is that the authorization binds to the exact factor being reset** — the request captures the immutable `targetFactorEnrollmentId` (or equivalent provider-specific immutable identifier) before execution, so retries can never remove a replacement factor. No secrets and no TOTP codes are ever stored in this record.

```typescript
type MfaRecoveryRequest = {
  readonly id: string;                    // UUID
  readonly targetUserId: string;          // Platform administrator userId
  readonly targetFactorEnrollmentId: string; // IMMUTABLE provider-specific enrollment id of the
                                            // exact TOTP factor being reset (captured before execution)
  readonly requestorUserId: string;       // Who requested (independent actor/operator, or proof claimant)
  readonly requestorReference: string;    // Audit reference
  readonly requestMode: "independent-actor" | "pre-mfa-proof" | "break-glass-operator";
  readonly reason: string;                // Human-readable reason
  readonly status: "pending" | "approved" | "denied" | "executing" | "completed" | "expired" | "failed";
  readonly requestedAt: Date;
  readonly approvedBy: string;            // Approver userId (active admin with verifiedMfaSatisfied === true)
  readonly approvedAt: Date;
  readonly approvedMfaEvidence: boolean;  // TRUE only when the approver presented the server-verified
                                          // second-factor claim; never client-declared
  readonly deniedBy?: string;
  readonly deniedAt?: Date;
  readonly denialReason?: string;
  readonly executedAt?: Date;
  readonly executedBy?: string;           // Backend/service-account executor (break-glass) or operator
  readonly completedAt?: Date;
  readonly expiresAt: Date;               // Approval expiry
  readonly failureReason?: string;
  readonly correlationId: string;
  readonly schemaVersion: number;
};
```

> **Note:** This schema is a conceptual proposal to be finalized at implementation time; the exact field names/types are not mandatory. The load-bearing invariant is the binding to `targetFactorEnrollmentId` (the specific original factor), a verified-approver MFA-evidencing flag, and the absence of secrets/TOTP codes.

**Pros:** Full audit trail; expiry support; recovery state machine; idempotency; partial-failure tracking; the `targetFactorEnrollmentId` binding makes execution/retries safe against a replacement factor.
**Cons:** More complex; requires Firestore collection and rules.

**Recommendation: Option B** — the audit and state-management benefits outweigh the complexity for a security-critical operation.

---

## §17. Administrator Lifecycle Interaction

| Option | Assessment | Recommendation |
|--------|------------|----------------|
| Remain `active` during recovery | Simpler; no lifecycle disruption; recovery is a MFA operation, not a status change | **Recommended** |
| Suspend during recovery | Adds complexity; requires reactivation; conflates MFA state with access state | Not recommended |
| Separate recovery state object | Clean separation; `mfaRecoveryRequests` tracks recovery independently of status | **Recommended** — use Option B from §16 |

**Rationale:** Recovery is about MFA factor management, not about whether the administrator should have access. An administrator who has lost their TOTP factor can complete a primary sign-in (but cannot complete the MFA step or obtain a privileged AUTH-03 session — see §10B); they should remain `active` in lifecycle terms — the recovery is tracked separately and they simply cannot complete privileged operations until MFA is re-established.

**Status lifecycle remains unchanged:**
```
invited → active → suspended → removed
```

No fifth state is added. Recovery is tracked in a separate `mfaRecoveryRequests` collection, not in the administrator's status.

---

## §18. Post-Reset State

### Mandatory Actions After Recovery

| Action | Required? | Technical Basis |
|--------|-----------|-----------------|
| New TOTP enrollment | **Yes** | Recovery's purpose is to restore ability to establish MFA |
| Forced sign-out | **Yes** | Clear any stale client session state |
| Fresh primary sign-in | **Yes** | Establishes a clean authentication session |
| Fresh TOTP challenge | **Yes** | Server verifies real second-factor evidence |
| Server verifies `sign_in_second_factor` | **Yes** | Only way to produce `verifiedSecondFactor: true` |

**No shortcut is technically or architecturally appropriate.** The existing chain (`firebaseTokenVerifier → AuthenticatedCredential.verifiedSecondFactor → deriveVerifiedMfaSatisfied → evaluateKnowledgePlatformPermission`) is the only path to privileged authorization.

---

## §19. Founder Decisions Required

> **This section requires Founder disposition before AUTH-MFA-003D implementation can begin.**

### Decision 1: Normal Recovery Authority (CORR-001)

| Aspect | Detail |
|--------|--------|
| **Current authority** | DEC-SEC-004 approves "controlled, auditable, non-bypassable recovery" |
| **Technical constraint** | (a) Firebase Admin SDK cannot remove TOTP factors (bug #2995); Identity Platform v1 Admin API required. (b) The lost-TOTP target **cannot use the normal authenticated application path** — primary factor alone yields `auth/multi-factor-auth-required` with no resolved `UserCredential`, no AUTH-03 token, no session — so request initiation must be Option A or Option B below. |
| **Options** | A) An independently authenticated, MFA-satisfied administrator/operator creates the request on the target's behalf; another independent MFA-satisfied administrator approves. B) A bounded pre-MFA recovery proof (see §10B Option B) lets the target attest primary-factor possession without a privileged session, combined with independent approval. C) Only Founder/operator may initiate and approve. |
| **Recommended** | **A or B for request initiation** (Founder picks the requestor model — this is itself an open decision) **plus** one independent MFA-satisfied approver for the normal path; operator-only for break-glass. |
| **Requires Founder decision** | Whether recovery request initiation is authorized via Option A (independent actor) and/or Option B (bounded pre-MFA proof). If Option B is disallowed, only Option A / break-glass can initiate. |
| **Consequence** | Determines how many humans must be involved and whether the locked-out target has any self-attestation channel; affects operational burden and security |

### Decision 2: Self-Approval Prohibition

| Aspect | Detail |
|--------|--------|
| **Current authority** | No existing policy |
| **Technical constraint** | Self-approval would require the affected administrator to approve their own reset |
| **Options** | A) Absolute prohibition — target cannot approve their own recovery. B) Permitted with additional evidence (e.g., verified email + operator confirmation). |
| **Recommended** | Option A — absolute prohibition |
| **Consequence** | At MVP with 1-2 administrators, self-approval prohibition means the break-glass path is the only option for a sole administrator |

### Decision 3: Approval Cardinality

| Aspect | Detail |
|--------|--------|
| **Current authority** | No existing policy |
| **Technical constraint** | At MVP, 1-2 platform administrators may exist |
| **Options** | A) One independent approver. B) Two-person approval. C) Operator-only (break-glass). D) Hybrid: one approver for normal path, operator-only for break-glass. |
| **Recommended** | Option D — one independent **MFA-satisfied** approver minimum; operator-only for break-glass |
| **Consequence** | Determines how many humans must agree; two-person approval may be impractical at MVP; the approver must present server-verified MFA evidence (`verifiedMfaSatisfied === true`), never active-status-only |

### Decision 4: Single-Administrator Break-Glass Authority

| Aspect | Detail |
|--------|--------|
| **Current authority** | No existing policy; bootstrap precedent shows backend-only execution is viable |
| **Technical constraint** | Bootstrap already uses service-account-only execution as trust boundary |
| **Options** | A) Backend service-account-only execution (same as bootstrap). B) Founder/operator explicit command. C) Both A and B with different audit trails. |
| **Recommended** | Option C — backend execution with Founder authorization |
| **Consequence** | Determines who can unlock a sole administrator; must not create a standing privilege. Note: this is a **separate governed trust boundary** from in-product administrator approval — it uses the bootstrap/backend service-account boundary, is fully audited, cannot alter roles/lifecycle, and does **not** require browser MFA (it is not an administrator browser session); see §11 |

### Decision 5: Mandatory Session Revocation (CORR-001)

| Aspect | Detail |
|--------|--------|
| **Current authority** | No existing policy |
| **Technical constraint** | `revokeRefreshTokens` revokes refresh tokens and (on next use) the session; critically, **11thONUS Firestore backend rejects ID tokens issued before revocation** because `firebaseTokenVerifier.ts:174` calls `verifyIdToken(raw.rawToken, true)` with revocation checking enabled. There is therefore **no one-hour privileged-access window** against this backend after revocation. |
| **Options** | A) Always revoke all sessions before factor reset (revocation-fail-closed; factor reset only after revocation succeeds). B) Revoke sessions only if compromised access suspected. C) Never revoke; rely on natural expiry. |
| **Recommended** | Option A — always revoke, and **fail closed** (if revocation fails, factor reset MUST NOT proceed) |
| **Consequence** | Option A is safest and closes the only stale-token surface; revocation-fail-closed prevents any path that resets a factor while old sessions might still be accepted |

### Decision 6: Administrator Lifecycle During Recovery

| Aspect | Detail |
|--------|--------|
| **Current authority** | No existing policy |
| **Technical constraint** | Status lifecycle is `invited → active → suspended → removed`; adding a fifth state is prohibited |
| **Options** | A) Remain `active` during recovery. B) Temporarily `suspended` during recovery. C) Separate recovery state object (not in status). |
| **Recommended** | Option C — recovery tracked in separate `mfaRecoveryRequests` collection |
| **Consequence** | Clean separation; no lifecycle disruption; recovery doesn't affect general access |

### Decision 7: Persistent Recovery Request vs Operational Command

| Aspect | Detail |
|--------|--------|
| **Current authority** | No existing policy |
| **Technical constraint** | Firestore append-only audit pattern already exists |
| **Options** | A) Single atomic command (like bootstrap). B) Persistent `mfaRecoveryRequests` object with full lifecycle. |
| **Recommended** | Option B — persistent object |
| **Consequence** | Option B provides audit trail, expiry support, and partial-failure tracking; more complex but appropriate for security-critical operation |

### Decision 8: Recovery Approval Expiry

| Aspect | Detail |
|--------|--------|
| **Current authority** | No existing policy |
| **Technical constraint** | Approval may become stale if not executed promptly |
| **Options** | A) Approvals expire after 1 hour. B) Approvals expire after 24 hours. C) No expiry. D) Configurable per recovery request. |
| **Recommended** | Option A — 1 hour expiry |
| **Consequence** | Prevents stale approvals; forces timely execution; balances security with operational practicality |

### Decision 9: Mandatory Fresh Enrollment + Challenge

| Aspect | Detail |
|--------|--------|
| **Current authority** | DEC-SEC-004 requires non-bypassable recovery |
| **Technical constraint** | Only `decoded.firebase.sign_in_second_factor` produces `verifiedSecondFactor: true` |
| **Options** | A) Mandatory: enrollment → sign-out → sign-in → challenge. B) Optional: enrollment completes recovery. |
| **Recommended** | Option A — mandatory |
| **Consequence** | No shortcut; ensures server-verified MFA evidence; no architectural bypass possible |

### Decision 10: Proposed Audit Vocabulary

| Aspect | Detail |
|--------|--------|
| **Current authority** | `PLATFORM_ADMINISTRATION_AUDIT_ACTION_TYPES` is a closed 2-entry set |
| **Technical constraint** | Extending the vocabulary is a TypeScript change (not in this design scope) |
| **Proposed additions** | `mfa_recovery_requested`, `mfa_recovery_approved`, `mfa_recovery_executed`, `mfa_recovery_denied`, `mfa_recovery_expired` |
| **Founder decision** | Approve, modify, or defer the proposed vocabulary |
| **Consequence** | Determines what recovery actions are auditable; deferring means recovery would be unauditable |

---

## §20. Files Modified (CORR-001)

**This design task modifies only documentation files.** No production code, configuration, or Firebase state is changed.

> **Correction (finding #8):** The prior report said only the report file was added and that the two governance files were "not modified". The actual diff is **exactly three files** — the new report plus two governance logs updated to record this assessment (and again for the CORR-001 correction):

| File | Change |
|------|--------|
| `docs/05-implementation/reports/AUTH-MFA-003D-DESIGN-001-platform-administrator-mfa-recovery-assessment-2026-09-07.md` | New — this report (extended by CORR-001 with §33) |
| `docs/changes/IMPLEMENTATION_CHANGES.md` | **Modified** — DESIGN-001 entry added; CORR-001 entry appended (superseding) |
| `docs/00-governance/documentation-changes-log.md` | **Modified** — Entry 176 (DESIGN-001) added; Entry 177 (CORR-001) added; incorrect baseline SHA corrected to `a7b3a43756837390d60137a96883c8925b8e306e` |

No other files were touched by this task.

---

## §21. Production-Code Modifications

**Expected: NONE**

**Actual: NONE**

No `functions/src/**`, `apps/web/src/**`, Firestore Rules, Firebase configuration, package manifests, lockfiles, or dependencies were modified.

---

## §22. Diff Summary (CORR-001)

This task produces a documentation-only diff spanning exactly **three files**: the new report, `docs/changes/IMPLEMENTATION_CHANGES.md`, and `docs/00-governance/documentation-changes-log.md`. No production code, configuration, dependencies, or Firebase state are changed.

---

## §23. Dependencies Added

**Expected: NONE**

**Actual: NONE**

---

## §24. Configuration Changes

**Expected: NONE**

**Actual: NONE**

---

## §25. Live Environment Changes

**Must be: NONE**

**Actual: NONE**

No Firebase configuration, Identity Platform, TOTP provider, or project settings were modified.

---

## §26. Validation

### Formatting

The report follows the existing report convention (YAML-style header, numbered sections, tables, code blocks).

### Docs Integrity

The report is self-contained and references existing files/decisions without creating circular dependencies.

### Repository Status (CORR-001)

Exactly three documentation files are part of this task's diff (see §20): the report plus the two governance logs. No production source files are modified.

---

## §27. PR Handling (CORR-001)

PR **#232** (`AUTH-MFA-003D-DESIGN-001`) carries this design assessment. It received an automated review with **eight findings**; CORR-001 corrects all eight (see §33). The PR remains **open** (not merged), awaiting Founder recovery-policy disposition after the corrections.

---

## §28. Risks and Unresolved Issues

| Risk | Severity | Mitigation |
|------|----------|------------|
| Firebase Admin SDK TOTP bug (#2995) | **High** | Must use Identity Platform v1 Admin `projects.accounts.update` for factor removal (Admin SDK blocked) |
| No live recovery testing possible at MVP | Medium | Design validated against Firebase capabilities; live testing deferred to AUTH-MFA-003D implementation |
| Single-administrator lockout | Medium | Break-glass path addresses this; requires Founder decision |
| Stale ID tokens after revocation | **Low (mitigated)** | No one-hour window: backend runs `verifyIdToken(raw.rawToken, true)` at `firebaseTokenVerifier.ts:174`; pre-revocation tokens are rejected |
| Recovery approval expiry timing | Low | Founder decision required; default recommendation is 1 hour |

---

## §29. Rollback Instructions

This task produces a documentation-only change. Rollback:

```bash
git revert <commit-sha>
```

No live environment changes to roll back.

---

## §30. Final Recommendation

**READY FOR FOUNDER RECOVERY POLICY DISPOSITION**

All material questions have been researched and presented:
- Firebase capability constraints identified (including critical Admin SDK bug and the verified v1 Admin / rejected v2 withdrawal backend APIs)
- Repository architecture fully inspected
- Threat model complete (15 scenarios)
- Atomicity model defined (fail-closed execution)
- Normal and break-glass paths specified (four-phase correction)
- Locked-out requester path defined with two design options (§10B)
- All 10 Founder decision questions prepared with options and recommendations
- Eight automated-review findings confirmed and corrected (see §33)

The Founder can now make recovery-policy decisions without requiring another agent to discover missing fundamentals.

---

## §31. Boundary Confirmation

| Boundary | Status |
|----------|--------|
| Recovery implementation (AUTH-MFA-003D) | **NOT STARTED** — this is design only |
| AUTH-MFA-003E | **NOT STARTED** |
| ENG-P3-003B | **NOT STARTED** |
| Knowledge Studio implementation | **NOT STARTED** |
| Live recovery/reset testing | **NOT PERFORMED** |
| Production code modified | **NONE** |
| Firebase configuration changed | **NONE** |
| Live environment changed | **NONE** |

---

## §32. Success Gate

**AUTH-MFA-003D-DESIGN-001 PARTIAL WORK RECOVERED AND REVIEWED — VALID PRIOR WORK PRESERVED (branch skeleton only, no substantive work) — INCOMPLETE/UNSUPPORTED WORK CORRECTED (no work to correct) — CURRENT FIREBASE FACTOR-RESET AND SESSION-REVOCATION CAPABILITIES VERIFIED — RECOVERY ROLE/AUDIT/LIFECYCLE BOUNDARIES ASSESSED — SINGLE-ADMIN BREAK-GLASS PROBLEM ASSESSED — ATOMICITY AND THREAT MODEL COMPLETE — FOUNDER DECISION QUESTIONS COMPLETE — NO PRODUCTION IMPLEMENTATION — NO LIVE ENVIRONMENT CHANGE — READY FOR FOUNDER RECOVERY POLICY DISPOSITION**

---

## §33. Correction Record — AUTH-MFA-003D-DESIGN-001-CORR-001

**Purpose:** Consolidated, superseding correction record for the eight automated-review findings on PR #232. This section is the authoritative record of what CORR-001 changed and why. It supersedes any earlier wording in sections referenced below.

**Evidence basis (verified against the repository and Firebase/Google API documentation on 2026-09-07):**
- `functions/src/domains/authentication/services/firebaseTokenVerifier.ts:174` calls `verifyIdToken(raw.rawToken, true)` (revocation checking enabled) — the 11thONUS backend rejects ID tokens issued before revocation; there is **no one-hour privileged-access window** against this backend.
- `apps/web/src/authentication/emailPasswordSignInFlow.ts:54-76` and `apps/web/src/authentication/mfa/mfaSdkChallenge.ts:167-174` handle `auth/multi-factor-auth-required` and never resolve a `UserCredential` without the second factor — a lost-TOTP user cannot obtain a privileged AUTH-03 session through the normal sign-in path.
- `functions/src/domains/platformAdministration/services/bootstrapPlatformAdministrator.ts` is the break-glass trust-boundary precedent (backend/service-account-only, no public endpoint).
- Identity Platform v1 Admin: `POST https://identitytoolkit.googleapis.com/v1/projects/{targetProjectId}/accounts:update` with Google OAuth2 service-account credential and IAM `firebaseauth.users.update`; selects the user by `localId`, uses `mfa` = `MfaInfo` (overwrites all MFA info, so supports both all-factor and selective removal); **does not** auto-revoke sessions (revocation is a separate explicit `revokeRefreshTokens` step).
- The v2 `accounts.mfaEnrollment:withdraw` (`POST /v2/accounts/mfaEnrollment:withdraw`) is **not** the backend path: it requires the user's own `idToken`, revokes one factor, and reissues tokens; it is the client-facing API invoked by `multiFactor.unenroll()`.
- Firebase Admin SDK `updateUser` remains **blocked** for MFA by `firebase/firebase-admin-node#2995`.
- Baseline (correct): `origin/main` = `a7b3a43756837390d60137a96883c8925b8e306e` (PR #231 merge). The prior log entry contained an invalid truncated SHA (`...6837390...`), now corrected in both occurrences.
- The actual diff is exactly three files (see §20): the report, `docs/changes/IMPLEMENTATION_CHANGES.md`, and `docs/00-governance/documentation-changes-log.md`.

### Eight Findings — Corrections Applied

| # | Finding (automated review) | Determination | Correction |
|---|----------------------------|---------------|------------|
| 1 | Locked-out requester path (affected administrator cannot request via normal app path) | **Confirmed genuine** | §10A/§10B rewritten; §15 normal path revised to four separated phases; request initiation via Option A (independent actor) or Option B (bounded pre-MFA proof) |
| 2 | Approver MFA requirement (approver must be MFA-satisfied, not just active) | **Confirmed genuine** | §10 "Who May Approve" corrected: requires active Platform Administrator presenting `verifiedMfaSatisfied === true` via `sign_in_second_factor`; no active-status-only or client-declared MFA |
| 3 | Revocation fail-closed property (factor reset must not proceed if revocation fails) | **Confirmed genuine** | §14/§15/§19(D5)/§28 updated: revocation-first, fail-closed invariant; no natural-expiry downgrade |
| 4 | Factor-enrollment binding (`targetFactorEnrollmentId` binds reset to the specific factor) | **Confirmed genuine** | §16 Option B schema, §15 execution, §14 idempotency all bind execution to the immutable `targetFactorEnrollmentId`; replacement factor → fail closed |
| 5 | ID-token lifetime vs backend acceptance (~1 hour window claim) | **Confirmed genuine** | Corrected: `verifyIdToken(rawToken, true)` rejects pre-revocation tokens; **no one-hour window** against this backend (§6D, §19 D5, §28) |
| 6 | Factor-removal API (v1 Admin vs Admin SDK vs v2 withdrawal) | **Confirmed genuine** | §6C reconciled: v1 Admin `projects.accounts.update` is the backend path; v2 `mfaEnrollment:withdraw` is client-sided and requires the user's own token; Admin SDK blocked by #2995 |
| 7 | Baseline SHA correctness (%5B...%5D incorrect SHA in logs) | **Confirmed genuine** | Both incorrect occurrences in `documentation-changes-log.md` corrected to `a7b3a43756837390d60137a96883c8925b8e306e` |
| 8 | File inventory (diff is 3 files, not 1; governance logs ARE modified) | **Confirmed genuine** | §20/§22/§26 corrected to the actual three-file diff |

### Superseded Statements (replaced in this revision)

The following prior statements are superseded by the corrected content in the sections cited:
1. "Requestor authenticates (primary factor)" as the normal-path step 1 — **replaced** (§15 Phase 1).
2. "Approver authenticates (primary + MFA — if they have MFA)" and "if they have MFA" hedging — **replaced** by a mandatory approver-MFA requirement (§10, §15 Phase 2).
3. "Firebase Auth REST API: remove TOTP factor" ambiguous wording — **replaced** by the v1 Admin `projects.accounts.update` backend path (§6C, §15 Phase 3).
4. "~1 hour window" after `revokeRefreshTokens` — **replaced** (§6D, §19 D5, §28).
5. "Only one new file is added" — **replaced** by the exact three-file diff (§20, §22, §26).
6. Baseline SHA `...6837390...` in the change log — **corrected** to `a7b3a43756837390d60137a96883c8925b8e306e`.

### Scope Confirmation

CORR-001 remains **design/assessment-only**:
- No `functions/src/**`, `apps/web/src/**`, Firestore Rules, Firebase configuration, package manifests, lockfiles, or dependencies modified.
- No AUTH-MFA-003D implementation started; PR #232 remains open and unmerged.
- No live environment change.

### Final State After CORR-001

**AUTH-MFA-003D-DESIGN-001 — CORRECTED — EIGHT AUTOMATED-REVIEW FINDINGS CONFIRMED AND CORRECTED — SUPERSEDING CORRECTION RECORD IN §33 — FOUNDER DECISION QUESTIONS COMPLETE AND UPDATED — NO PRODUCTION IMPLEMENTATION — NO LIVE ENVIRONMENT CHANGE — READY FOR FOUNDER RECOVERY POLICY DISPOSITION**
