> **Title:** AUTH-MFA-003D-DESIGN-001 — Platform Administrator MFA Recovery & Reset — Policy and Architecture Assessment
> **Status:** **DESIGN / ASSESSMENT — NOT IMPLEMENTED — READY FOR FOUNDER RECOVERY POLICY DISPOSITION**
> **Classification:** Assessment (design record, completed)
> **Task:** `AUTH-MFA-003D-DESIGN-001`
> **Baseline:** `origin/main` at `a7b3a43756837390d60137a96883c8925b8e306e` (PR #231 merge commit, 2026-09-06)
> **Retrieval date:** 2026-09-07

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

### 6C. Firebase Auth REST API for TOTP Removal

**Capability:** The Firebase Auth REST API (`identitytoolkit/v3/relyingparty/accounts:update`) supports updating `mfaInfo` which includes TOTP factors. This bypasses the Node.js Admin SDK limitation.

**Alternative:** The Identity Platform Admin API (`identityplatform/v1/accounts`) also supports full MFA factor management including TOTP.

**Recommendation:** Implementation should target the Identity Platform Admin API (Google Cloud) as the primary path, with the Firebase Auth REST API as fallback.

### 6D. Session/Refresh Token Revocation

**Capability:** `revokeRefreshTokens(uid)` updates `tokensValidAfterTime` to current time.

**Behavior:**
- **Refresh tokens:** Revoked immediately — no new ID tokens can be obtained
- **Existing ID tokens:** NOT immediately invalidated — remain valid until natural expiry (~1 hour)
- **Verification with revocation check:** `verifyIdToken(idToken, true)` compares `iat` against `tokensValidAfterTime`; if `iat < tokensValidAfterTime`, throws `auth/id-token-revoked`
- **Network cost:** Requires an extra RPC call per verification (~50-200ms latency)

**11thonus uses this:** The token verifier already calls `verifyIdToken(rawToken, true)` with `checkRevoked=true` [firebaseTokenVerifier.ts:169]. Revocation checking is already active.

**Source:** https://firebase.google.com/docs/auth/admin/manage-sessions (retrieved 2026-09-07)

### 6E. Client-Side TOTP Unenrollment

**Capability:** `multiFactor(user).unenroll(mfaEnrollmentId)` — requires recent re-authentication (`auth/requires-recent-login`).

**Behavior:**
- Sessions are NOT automatically revoked on unenrollment
- If the most recently enabled factor is unenrolled, user receives `auth/user-token-expired` and is logged out
- Email notification sent to user

**11thonus uses this:** Not yet — no client-side unenrollment code exists. The `MfaEnrollmentPage` explicitly states "this page never re-enrolls, removes, or replaces factors (removal/replacement is `AUTH-MFA-003D`)."

### 6F. Factor Reset Behavior Summary

| Action | Sessions revoked? | Next sign-in challenged? |
|--------|-------------------|--------------------------|
| Admin removes TOTP factor via API | **No** (must also call `revokeRefreshTokens`) | No — no factor enrolled, so no challenge |
| Client unenrolls TOTP | No (unless most recent factor) | No — no factor enrolled |
| `revokeRefreshTokens` alone | Yes (refresh tokens) | Existing ID tokens survive ~1 hour |

**Critical implication for recovery:** Removing a TOTP factor and revoking sessions are **separate operations** that must both be performed. Neither automatically triggers the other.

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

## §10. Normal Recovery Options

### Who May Request Recovery

| Candidate | Assessment | Recommendation |
|-----------|------------|----------------|
| Affected administrator | Cannot prove identity without MFA | May request, but must provide identity evidence |
| Another administrator | Can vouch for identity, but limited at MVP | Valid requestor |
| Founder/operator | Highest authority | Valid requestor |
| Backend operator | Service-account access | Valid requestor (break-glass) |

### Who May Approve Recovery

| Candidate | Assessment | Recommendation |
|-----------|------------|----------------|
| Affected administrator | **No self-approval** | Explicit prohibition |
| Another administrator | Valid if independent of target | One independent approver minimum |
| Founder/operator | Highest authority | May approve any recovery |
| `knowledge_approver` | Not a security-recovery role | **Cannot approve** without separate authority |

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

## §11. Identity Evidence

Evidence that a recovery requestor is who they claim:

| Evidence Type | Strength | Assessment |
|---------------|----------|------------|
| Primary-factor authentication (password/Google) | Strong — proves possession of primary credential | Required |
| Verified email | Moderate — proves email access, not identity | Supplementary only |
| External verification (phone, ID) | Strong — independent channel | Not available at MVP |
| Operator verification | Strong — human verification | Break-glass path |
| Independent administrator approval | Strong — peer verification | Normal path |

**Critical distinction:** Verified email is **not** MFA and must never be treated as proof of second-factor ownership.

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
| **Current protection** | `revokeRefreshTokens` invalidates refresh tokens; `verifyIdToken(token, true)` checks revocation |
| **Gap** | Stolen ID token valid for up to ~1 hour after revocation |
| **Mitigation** | Short token lifetime + revocation check; privileged actions have 5-minute freshness gate |
| **Founder decision** | No — existing protections are adequate |

### T4: Malicious administrator resets another admin's TOTP

| Aspect | Detail |
|--------|--------|
| **Current protection** | No recovery mechanism exists yet |
| **Gap** | A compromised administrator could reset a co-administrator's TOTP to gain their account |
| **Mitigation** | Normal path requires independent approver; break-glass requires Founder authorization; full audit trail |
| **Founder decision** | Yes — who may approve recovery? (§15, Decision 2) |

### T5: Malicious target + approver collusion

| Aspect | Detail |
|--------|--------|
| **Current protection** | None (no recovery mechanism) |
| **Gap** | Colluding administrator and approver could perform unauthorized recovery |
| **Mitigation** | Audit trail makes collusion detectable; break-glass path requires Founder; mandatory post-reset enrollment means colluding party gets no standing access |
| **Founder decision** | Yes — is audit trail sufficient or is two-person approval required? (§15, Decision 3) |

### T6: Single-administrator lockout

| Aspect | Detail |
|--------|--------|
| **Current protection** | None (no recovery mechanism) |
| **Gap** | If sole administrator loses TOTP and no break-glass path exists, platform is locked |
| **Mitigation** | Backend service-account-only break-glass recovery; bootstrap precedent already exists |
| **Founder decision** | Yes — break-glass authority and process (§15, Decision 4) |

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
| **Gap** | Same recovery action could be replayed |
| **Mitigation** | Idempotency check: if factor is already removed, operation is a no-op; execution state tracking prevents duplicate processing |
| **Founder decision** | No — technical implementation detail |

### T9: Duplicate recovery execution

| Aspect | Detail |
|--------|--------|
| **Current protection** | None |
| **Gap** | Parallel recovery requests could cause race conditions |
| **Mitigation** | Firestore transaction with read-before-write; recovery request state machine prevents concurrent execution |
| **Founder decision** | No — technical implementation detail |

### T10: Wrong target identity

| Aspect | Detail |
|--------|--------|
| **Current protection** | None |
| **Gap** | Recovery could target the wrong administrator |
| **Mitigation** | Target identity must be verified through primary-factor authentication; `platformAdministrators/{userId}` doc-id-as-key prevents mismatch |
| **Founder decision** | No — technical implementation detail |

### T11: Factor removed but audit write fails

| Aspect | Detail |
|--------|--------|
| **Current protection** | None |
| **Gap** | TOTP factor removed but audit record not written — unauditable state change |
| **Mitigation** | Firestore transaction: audit write and factor removal in same transaction where possible; if cross-service (Firebase Auth + Firestore), audit write must succeed even if factor removal confirmation is delayed |
| **Founder decision** | No — technical implementation detail |

### T12: Factor removed but session revocation fails

| Aspect | Detail |
|--------|--------|
| **Current protection** | None |
| **Gap** | TOTP factor removed but `revokeRefreshTokens` fails — administrator retains active MFA session |
| **Mitigation** | Session revocation must be attempted before factor removal; if revocation fails, factor removal should not proceed; existing sessions expire within ~1 hour naturally |
| **Founder decision** | No — technical implementation detail |

### T13: Session revocation succeeds but factor reset fails

| Aspect | Detail |
|--------|--------|
| **Current protection** | None |
| **Gap** | Sessions revoked but TOTP factor not removed — administrator locked out with no MFA but sessions also revoked |
| **Mitigation** | Factor removal is the critical operation; if it fails after session revocation, administrator must re-enroll with old factor (still exists) or operator retries factor removal |
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
| **Founder decision** | Yes — expiry requirement (§15, Decision 8) |

---

## §14. Atomicity and Partial-Failure Model

### Cross-Service Boundary

Firebase Auth operations and Firestore transactions **cannot be assumed atomic together**. Factor removal happens in Firebase Auth (REST API or Identity Platform API); session revocation happens in Firebase Auth (`revokeRefreshTokens`); audit and recovery state happen in Firestore.

### Recommended Orchestration Model

```
recovery request (Firestore: mfaRecoveryRequests collection)
→ approval (Firestore: status update in same collection)
→ execution claimed (Firestore: idempotency check, status → "executing")
→ session revocation (Firebase Auth: revokeRefreshTokens)
→ factor reset (Firebase Auth REST API: remove TOTP factor)
→ execution completion (Firestore: status → "completed", audit record)
```

### Failure Handling

| Failure Point | Recovery Strategy |
|---------------|-------------------|
| Session revocation fails | Retry; if persistent, proceed to factor removal (existing sessions expire naturally within ~1 hour) |
| Factor removal fails | Do not mark as completed; retry; if persistent, operator must investigate |
| Audit write fails after factor removal | Compensation: retry audit write; factor is already removed — state is recoverable |
| Execution state update fails after factor removal | Same as audit failure — retry; factor removal is the critical operation |
| All steps succeed but completion write fails | Retry; idempotency prevents double-execution |

### Idempotency

- Recovery execution must be idempotent: if factor is already removed, operation completes without error
- Recovery request must have unique ID (UUID) to prevent duplicate processing
- Execution state machine: `pending → approved → executing → completed | failed`

---

## §15. Recommended MVP Architecture

### Normal Path

```
1. Recovery requested
   - Requestor authenticates (primary factor: password/Google)
   - Requestor identifies target administrator
   - Server verifies requestor is not the target (no self-approval)
   - Firestore: mfaRecoveryRequest record created (status: "pending")

2. Independent authorized actor approves
   - Approver authenticates (primary + MFA — if they have MFA)
   - Server verifies approver is an active platform administrator
   - Server verifies approver is independent of target
   - Firestore: status → "approved", approval recorded

3. Execution
   - Operator (or automated process) initiates execution
   - Server verifies approval is valid (not expired, not revoked)
   - Server verifies target status is still "active"
   - Firebase Auth: revokeRefreshTokens(targetUserId)
   - Firebase Auth REST API: remove TOTP factor
   - Firestore: status → "completed", audit record written

4. Target signs in
   - Primary sign-in (email/password or Google)
   - No TOTP challenge (factor was removed)
   - MFA enrollment flow triggered
   - New TOTP secret generated, QR scanned, code verified
   - Factor enrolled

5. Forced sign-out
   - Client sign-out (clears local session)

6. Fresh primary sign-in

7. TOTP challenge
   - Server verifies decoded.firebase.sign_in_second_factor
   - verifiedSecondFactor: true
   - Privileged authorization available again
```

### Break-Glass Path

```
1. Founder/authorized operator action
   - Backend/service-account-only execution (no public endpoint)
   - Same trust boundary as bootstrapPlatformAdministrator

2. Targeted administrator only
   - Target userId must be a known platform administrator

3. Execution
   - Firebase Auth: revokeRefreshTokens(targetUserId)
   - Firebase Auth REST API: remove TOTP factor
   - Firestore: audit record written (action: "mfa_breakglass_executed")

4. No role/lifecycle change
   - PlatformAdministrator.status remains "active"
   - No new roles granted
   - No access elevation

5. Mandatory fresh enrollment + challenge
   - Same as normal path steps 4-7
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

---

## §16. Recovery State Model

### Option A: Operational Command (No Persistent Request)

Recovery is executed as a single atomic operation (like bootstrap) — no persistent request object.

**Pros:** Simpler; matches bootstrap precedent; no expiry management needed.
**Cons:** No audit of the request/approval phase; no recovery trail; approver's decision not recorded.

### Option B: Persistent Recovery Request Object (Recommended)

A `mfaRecoveryRequests` Firestore collection tracks the full lifecycle:

```typescript
type MfaRecoveryRequest = {
  readonly id: string;                    // UUID
  readonly targetUserId: string;          // Platform administrator userId
  readonly requestorUserId: string;       // Who requested
  readonly requestorReference: string;    // Audit reference
  readonly reason: string;                // Human-readable reason
  readonly status: "pending" | "approved" | "denied" | "executing" | "completed" | "expired" | "failed";
  readonly requestedAt: Date;
  readonly expiresAt?: Date;              // Approval expiry
  readonly approvedBy?: string;           // Approver userId
  readonly approvedAt?: Date;
  readonly deniedBy?: string;
  readonly deniedAt?: Date;
  readonly denialReason?: string;
  readonly executedAt?: Date;
  readonly executedBy?: string;
  readonly completedAt?: Date;
  readonly failureReason?: string;
  readonly correlationId: string;
  readonly schemaVersion: number;
};
```

**Pros:** Full audit trail; expiry support; recovery state machine; idempotency; partial-failure tracking.
**Cons:** More complex; requires Firestore collection and rules.

**Recommendation: Option B** — the audit and state-management benefits outweigh the complexity for a security-critical operation.

---

## §17. Administrator Lifecycle Interaction

| Option | Assessment | Recommendation |
|--------|------------|----------------|
| Remain `active` during recovery | Simpler; no lifecycle disruption; recovery is a MFA operation, not a status change | **Recommended** |
| Suspend during recovery | Adds complexity; requires reactivation; conflates MFA state with access state | Not recommended |
| Separate recovery state object | Clean separation; `mfaRecoveryRequests` tracks recovery independently of status | **Recommended** — use Option B from §16 |

**Rationale:** Recovery is about MFA factor management, not about whether the administrator should have access. An administrator who has lost their TOTP factor but can still authenticate with their primary factor should remain `active` — they just can't complete privileged operations until MFA is re-established.

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

### Decision 1: Normal Recovery Authority

| Aspect | Detail |
|--------|--------|
| **Current authority** | DEC-SEC-004 approves "controlled, auditable, non-bypassable recovery" |
| **Technical constraint** | Firebase Admin SDK cannot remove TOTP factors (bug #2995); REST API or Identity Platform API required |
| **Options** | A) Any active administrator may request; another independent administrator approves. B) Only Founder/operator may approve. C) Only Founder may initiate and approve. |
| **Recommended** | Option A for normal path; Option B/C for break-glass |
| **Consequence** | Determines how many humans must be involved in a recovery; affects operational burden and security |

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
| **Recommended** | Option D — one independent approver minimum; operator-only for break-glass |
| **Consequence** | Determines how many humans must agree; two-person approval may be impractical at MVP |

### Decision 4: Single-Administrator Break-Glass Authority

| Aspect | Detail |
|--------|--------|
| **Current authority** | No existing policy; bootstrap precedent shows backend-only execution is viable |
| **Technical constraint** | Bootstrap already uses service-account-only execution as trust boundary |
| **Options** | A) Backend service-account-only execution (same as bootstrap). B) Founder/operator explicit command. C) Both A and B with different audit trails. |
| **Recommended** | Option C — backend execution with Founder authorization |
| **Consequence** | Determines who can unlock a sole administrator; must not create a standing privilege |

### Decision 5: Mandatory Session Revocation

| Aspect | Detail |
|--------|--------|
| **Current authority** | No existing policy |
| **Technical constraint** | `revokeRefreshTokens` revokes refresh tokens but not existing ID tokens (~1 hour window) |
| **Options** | A) Always revoke all sessions before factor reset. B) Revoke sessions only if compromised access suspected. C) Never revoke; rely on natural expiry. |
| **Recommended** | Option A — always revoke |
| **Consequence** | Option A is safest; the 1-hour ID token window is acceptable given the forced re-enrollment requirement |

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

## §20. Files Modified

**This design task modifies only documentation files.** No production code, configuration, or Firebase state is changed.

| File | Change |
|------|--------|
| `docs/05-implementation/reports/AUTH-MFA-003D-DESIGN-001-platform-administrator-mfa-recovery-assessment-2026-09-07.md` | New — this report |
| `docs/changes/IMPLEMENTATION_CHANGES.md` | Not modified in this task (to be updated when implementation begins) |
| `docs/00-governance/documentation-changes-log.md` | Not modified in this task (to be updated when implementation begins) |

---

## §21. Production-Code Modifications

**Expected: NONE**

**Actual: NONE**

No `functions/src/**`, `apps/web/src/**`, Firestore Rules, Firebase configuration, package manifests, lockfiles, or dependencies were modified.

---

## §22. Diff Summary

This task produces a documentation-only diff. The final commit adds one new report file.

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

### Repository Status

Only one new file is added to the worktree. No existing files are modified.

---

## §27. PR Handling

**No PR exists.** This design assessment produces a single report file. A PR will be created when the report is ready for review.

---

## §28. Risks and Unresolved Issues

| Risk | Severity | Mitigation |
|------|----------|------------|
| Firebase Admin SDK TOTP bug (#2995) | **High** | Must use REST API or Identity Platform API for factor removal |
| No live recovery testing possible at MVP | Medium | Design validated against Firebase capabilities; live testing deferred to AUTH-MFA-003D implementation |
| Single-administrator lockout | Medium | Break-glass path addresses this; requires Founder decision |
| 1-hour ID token window after revocation | Low | Acceptable given mandatory re-enrollment; sessions expire naturally |
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
- Firebase capability constraints identified (including critical Admin SDK bug)
- Repository architecture fully inspected
- Threat model complete (15 scenarios)
- Atomicity model defined
- Normal and break-glass paths specified
- All 10 Founder decision questions prepared with options and recommendations

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
