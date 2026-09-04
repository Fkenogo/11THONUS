> **Title:** AUTH-MFA-002 — Platform Administrator MFA Environment & Provider Readiness Assessment
> **Status:** Assessment complete — ready for Founder review
> **Classification:** Working (assessment record)
> **Task:** `AUTH-MFA-002`

# AUTH-MFA-002 — Platform Administrator MFA Environment & Provider Readiness Assessment

## 1. Executive Summary

AUTH-MFA-001 completed the server-side MFA verification foundation: `AuthenticatedCredential.verifiedSecondFactor` is derived from Firebase's cryptographically-verified `sign_in_second_factor` token claim, and the platform-administrator evaluator correctly denies access when it is absent (`MFA_NOT_ESTABLISHED`). However, **no real platform administrator can currently complete an MFA-authenticated session** because three prerequisites remain unsatisfied:

1. **Firebase Authentication with Identity Platform upgrade** — MFA is not available on the standard Firebase Authentication tier. 11thONUS's `eleventh-on-us-dev` project runs standard `FIREBASE_AUTH`. An upgrade to Firebase Authentication with Identity Platform is mandatory before any MFA capability can be enabled.
2. **TOTP MFA enablement at project level** — even after Identity Platform upgrade, TOTP must be explicitly enabled via project configuration.
3. **Client-side enrollment and challenge UI** — no user-facing flow exists for a platform administrator to enroll a TOTP factor or complete a second-factor challenge during sign-in.

### Recommended MFA Policy

**TOTP only** for platform administrators. TOTP is provider-independent, works offline, has zero marginal cost, and is portable across all African jurisdictions without telecom dependency. SMS is not recommended as a primary factor due to carrier reliability, cost, and geographic portability concerns.

### Success Gate

**`MFA READINESS REQUIRES FOUNDER DECISION — IDENTITY PLATFORM UPGRADE AND TOTP PRIMARY FACTOR POLICY`**

---

## 2. Entry Gate Verification

All 15 entry-gate conditions verified against current `origin/main`:

| # | Condition | Status | Evidence |
|---|---|---|---|
| 1 | Current `origin/main` | **Verified** | `f5f66c12dffe79c635a2636b47f578620e82ce6e` (PR #226 merge commit) |
| 2 | PR #226 merged | **Verified** | Merge commit is tip of `origin/main` |
| 3 | Merge SHA | **Verified** | `f5f66c12dffe79c635a2636b47f578620e82ce6e` matches handover (`f5f66c1`) |
| 4 | Post-merge CI | **Verified** | CI reported green by prior task (`AUTH-MFA-001-CLOSE-READINESS-001`) |
| 5 | AUTH-MFA-001 implementation exists | **Verified** | `functions/src/domains/authentication/services/firebaseTokenVerifier.ts` |
| 6 | `AuthenticatedCredential.verifiedSecondFactor` | **Verified** | `functions/src/domains/authentication/models/authenticatedCredential.ts:63` |
| 7 | Firebase adapter derives from verified token | **Verified** | `firebaseTokenVerifier.ts:145-147` reads `decoded.firebase.sign_in_second_factor` |
| 8 | ENG-P3-003A fail-closed without MFA | **Verified** | `evaluateKnowledgePlatformPermission.ts:89-91` denies with `MFA_NOT_ESTABLISHED` |
| 9 | DEC-SEC-002 governing | **Verified** | Decision Register: CONFIRMED, D2 priority |
| 10 | DEC-GOV-011 / FD-KS-1 governing | **Verified** | Decision Register: CONFIRMED, 2026-09-03 |
| 11 | Only `knowledge_editor` and `knowledge_approver` enabled | **Verified** | `platformAdministratorRole.ts` — 2 roles only |
| 12 | ENG-P3-003B not started | **Verified** | No `KnowledgeDraft` model, no draft lifecycle code |
| 13 | No newer MFA decision | **Verified** | No DEC-SEC-003 or later MFA-related entry in Decision Register |
| 14 | Primary worktree state | **Verified** | On `docs/dec-legal-002-bt-draft-007` with uncommitted FD-COM-001 changes |
| 15 | FD-COM-001 isolated | **Verified** | Fresh worktree created from `origin/main` at `/Volumes/PRODUCTION/Projects/_worktrees/11THONUS/temporary/auth-mfa-002` |

### Governing Documents Inspected

| Document | Path | Status |
|---|---|---|
| DEC-SEC-002 | `docs/00-governance/decisions/decision-register.md:650-659` | CONFIRMED |
| DEC-GOV-011 (FD-KS-1) | `docs/00-governance/decisions/decision-register.md:197-217` | CONFIRMED |
| AUTH-MFA-001 Implementation Report | `docs/05-implementation/reports/AUTH-MFA-001-platform-administrator-verified-mfa-authentication-extension-implementation-report-2026-09-04.md` | Read |
| AUTH-MFA-001-CLOSE-READINESS-001 | `docs/05-implementation/reports/AUTH-MFA-001-CLOSE-READINESS-001-pr-226-ci-fix-and-verification-2026-09-04.md` | Read |
| EXT-TECH-001-ENV-READY | `docs/05-implementation/reports/EXT-TECH-001-ENV-READY-firebase-environment-readiness-report-2026-07-31.md` | Read |
| ENG-P3-003-DESIGN-001 | `docs/05-implementation/roadmap/ENG-P3-003-DESIGN-001-knowledge-studio-architecture-delivery-design.md` | Read |
| ENG-P3-003A Implementation Report | `docs/05-implementation/reports/ENG-P3-003A-platform-administrator-authorization-foundation-implementation-report-2026-09-03.md` | Read |
| Engineering Implementation Programme | `docs/05-implementation/change-tracking/engineering-implementation-programme.md` | Read |

### AUTH-MFA-001 Implementation Verification

The complete MFA data chain was verified by direct code inspection:

```
Firebase verifyIdToken (cryptographic signature check)
    → firebaseTokenVerifier.ts :: verifiedSecondFactorFromClaim(decoded.firebase.sign_in_second_factor)
    → AuthenticatedCredential.verifiedSecondFactor (provider-neutral boolean)
    → deriveVerifiedMfaSatisfied(credential) (one-line bridge)
    → resolvePlatformAdministratorAuthorization(... verifiedMfaSatisfied ...)
    → evaluateKnowledgePlatformPermission(... verifiedMfaSatisfied !== true → MFA_NOT_ESTABLISHED ...)
```

`PlatformAdministrator.mfaRequired` (always `true`) is **never consulted as evidence** by the evaluator — it records the requirement declaratively; compliance must come from the server-verified token claim through the chain above.

---

## 3. Phase 1 — Current Firebase MFA Environment State

### 3.1 Firebase Projects

| Alias | Project ID | Purpose | Authentication | MFA State | Evidence Type |
|---|---|---|---|---|---|
| `dev` | `eleventh-on-us-dev` | Development | Phone Auth enabled (standard `FIREBASE_AUTH`) | **DISABLED** | Direct (EXT-TECH-001-ENV-READY, 2026-07-31) |
| `staging` | `eleventh-on-us-staging` | Staging | **Not configured** (`404 CONFIGURATION_NOT_FOUND`) | N/A | Direct (EXT-TECH-001-ENV-READY, 2026-07-31) |
| `production` | **Does not exist** | — | — | — | Direct (.firebaserc has no production alias) |
| emulator | `demo-11thonus` | Emulator testing | Emulator only | N/A | Current repository evidence |

### 3.2 Key Environment Facts

- **Billing:** Blaze (pay-as-you-go) active on both `dev` and `staging` — confirmed by EXT-TECH-001-ENV-READY.
- **Phone Authentication:** Enabled on `dev` (sole enabled provider per Founder decision); `staging` not configured.
- **SMS Region Policy:** `allowlistOnly` with `["BI"]` (Burundi) — configured by EXT-TECH-001-ENV-READY.
- **Identity Platform upgrade:** **Not activated.** Standard Firebase Auth (`FIREBASE_AUTH` subtype) only. This is the critical gap.
- **SDK versions:** Client `firebase@^12.16.0`; Admin `firebase-admin@^13.6.0` (installed `13.10.0`); Functions `firebase-functions@^7.0.0`.
- **Authentication providers configured in code:** Google, Email/Password, Phone OTP — all gated behind `VITE_AUTH_ENABLE_*` environment flags (disabled by default).

### 3.3 Evidence Confidence Assessment

| Finding | Confidence | Basis |
|---|---|---|
| `dev` MFA disabled | **Historical** (July 2026) | EXT-TECH-001-ENV-READY report; may have changed since |
| `dev` uses standard Firebase Auth | **Historical** (July 2026) | EXT-TECH-001-ENV-READY report; Identity Platform upgrade not activated at that time |
| `staging` not configured | **Historical** (July 2026) | EXT-TECH-001-ENV-READY report; may have changed since |
| No production project | **Current repository evidence** | `.firebaserc` has no production alias |
| Blaze billing active | **Historical** (July 2026) | EXT-TECH-001-ENV-READY report |

**Note:** The July 2026 MFA-state evidence is nearly 5 weeks old. The Firebase Console could have been changed since. The Identity Platform upgrade and MFA enablement should be re-verified at the time of AUTH-MFA-003A implementation.

---

## 4. Phase 2 — Firebase MFA Capabilities Verified

### 4.1 SDK Capability Confirmation

Both installed SDKs fully support TOTP and SMS MFA:

**Client SDK (`firebase@12.16.0` / `@firebase/auth`):**

| Capability | Export | Status |
|---|---|---|
| TOTP enrollment | `TotpMultiFactorGenerator`, `TotpSecret` | **Supported** (lines 3521, 3574 of `auth-public.d.ts`) |
| TOTP sign-in assertion | `TotpMultiFactorGenerator.assertionForSignIn()` | **Supported** |
| TOTP factor ID | `FactorId.TOTP = "totp"` | **Supported** (line 1209) |
| SMS enrollment | `PhoneMultiFactorGenerator` | **Supported** (line 2629) |
| MFA challenge resolver | `getMultiFactorResolver()` | **Supported** (line 1338) |
| MFA user operations | `multiFactor(user)` | **Supported** (line 1776) |
| MFA session | `MultiFactorSession` | **Supported** (line 1930) |

**Admin SDK (`firebase-admin@13.10.0`):**

| Capability | Type/Interface | Status |
|---|---|---|
| TOTP user info | `TotpMultiFactorInfo` | **Supported** (line 114, `user-record.d.ts`) |
| Token MFA claim | `DecodedIdToken.firebase.sign_in_second_factor` | **Supported** (line 94, `token-verifier.d.ts`) |
| TOTP provider config | `TotpMultiFactorProviderConfig` | **Supported** (line 434, `auth-config.d.ts`) |
| Project config manager | `getAuth().projectConfigManager().updateProjectConfig()` | **Supported** for TOTP enablement |

### 4.2 Critical Prerequisite: Identity Platform Upgrade

Firebase documentation explicitly states:

> "If you've upgraded to Firebase Authentication with Identity Platform, you can add time-based one-time password (TOTP) multi-factor authentication (MFA) to your app."

The Identity Platform comparison table confirms:

| Feature | Identity Platform | Firebase Authentication |
|---|---|---|
| **Multi-factor authentication** | **Yes** | **No** |

This means **MFA cannot be enabled on the current standard Firebase Authentication tier.** An upgrade to Firebase Authentication with Identity Platform is a mandatory prerequisite.

**Upgrade implications (from Firebase documentation):**
- **No code migration required** — existing client and admin SDK code continues to work unchanged.
- **Billing impact:** Blaze plan projects are charged beyond 50,000 MAUs (monthly active users). The free tier is 50,000 MAUs.
- **DAU limits:** Standard Firebase Auth has no DAU limit; Identity Platform limits Spark plan to 3,000 DAUs (not relevant — 11thONUS is on Blaze).
- **Additional features unlocked:** MFA, blocking functions, user activity logging, SAML/OIDC, multi-tenancy, enterprise SLA.
- **Upgrade method:** Firebase Console → Authentication Settings → Upgrade.

### 4.3 TOTP Mechanism Summary

**Enrollment flow (client-side):**
1. `multiFactor(user).getSession()` → `MultiFactorSession`
2. `TotpMultiFactorGenerator.generateSecret(session)` → `TotpSecret`
3. `TotpSecret.generateQrCodeUrl(accountName, issuer)` → QR code URI
4. User scans QR code with authenticator app (Google Authenticator, Authy, etc.)
5. User enters current TOTP code
6. `TotpMultiFactorGenerator.assertionForEnrollment(secret, otp)` → `TotpMultiFactorAssertion`
7. `multiFactor(user).enroll(assertion, displayName)` → enrollment complete

**Sign-in challenge flow (client-side):**
1. `signInWithEmailAndPassword(auth, email, password)` (or other primary factor)
2. Firebase throws `auth/multi-factor-auth-required` error
3. `getMultiFactorResolver(auth, error)` → `MultiFactorResolver`
4. User selects TOTP factor from `resolver.hints`
5. User enters current TOTP from authenticator app
6. `TotpMultiFactorGenerator.assertionForSignIn(hint.uid, otp)` → `TotpMultiFactorAssertion`
7. `resolver.resolveSignIn(assertion)` → `UserCredential` (MFA-authenticated session)

**Server-side verification (already implemented):**
- After MFA challenge completion, the refreshed ID token contains `firebase.sign_in_second_factor: "totp"`
- `firebaseTokenVerifier.ts` derives `verifiedSecondFactor: true` from this claim
- `deriveVerifiedMfaSatisfied(credential)` bridges to the platform-administrator evaluator
- Evaluator allows access when `verifiedMfaSatisfied === true`

---

## 5. Phase 3 — Platform-Administrator MFA Policy Options

### 5.1 Options Assessment

| Option | Description | Security | Cost | Cross-Country Portability | Recovery | Complexity |
|---|---|---|---|---|---|---|
| **A: TOTP only** | Authenticator app only | High (offline, no carrier) | Zero marginal | Excellent (no telecom) | Requires admin reset | Low-Medium |
| **B: SMS only** | Phone OTP only | Medium (SIM-swap risk) | Per-SMS cost | Poor (carrier-dependent) | Phone number change | Low |
| **C: TOTP primary + SMS fallback** | TOTP default, SMS recovery | High | Low (SMS only for recovery) | Good (TOTP primary) | Dual-path | Medium-High |
| **D: Both equally** | User chooses TOTP or SMS | Variable | Variable | Variable | Dual-path | Medium |
| **E: Other** | WebAuthn/passkeys, hardware keys | Highest | Device cost | Good | Complex | High |

### 5.2 Recommendation: Option A — TOTP Only

**Recommendation:** Platform administrators use TOTP only.

**Rationale:**

1. **No telecom dependency.** TOTP works offline via authenticator app. No reliance on Burundi/Rwanda/East African mobile networks, no SMS delivery delays, no carrier outages blocking administrator access.

2. **Cross-country portability.** 11thONUS expands across East Africa and wider African markets. TOTP works identically in Burundi, Rwanda, Uganda, Kenya, Tanzania, or any other jurisdiction — no SMS region policy management, no carrier negotiation, no roaming concerns.

3. **Zero marginal cost.** No per-SMS charges. TOTP is entirely free after setup.

4. **Higher security.** TOTP is not vulnerable to SIM-swap attacks, SS7 interception, or SMS interception. The 30-second rotating code provides stronger assurance than a static SMS delivery channel.

5. **Operational simplicity.** One factor type to implement, test, support, and recover from. No dual-path complexity.

6. **Firebase alignment.** TOTP is well-supported in the installed SDK versions. The enrollment and challenge APIs are clean and well-documented.

7. **Low support burden.** For a small internal population of platform administrators (likely fewer than 10), authenticator-app enrollment is manageable with brief documentation.

**Against this recommendation:**
- Authenticator app dependency — administrators must install Google Authenticator, Authy, or equivalent.
- No SMS fallback if an administrator loses their authenticator device — requires controlled admin reset.

**Mitigation:** Controlled administrative factor reset (see Phase 8) addresses device loss without needing SMS as a fallback.

### 5.3 Important: This Is Not a Customer MFA Strategy

This recommendation applies exclusively to the small internal population of platform administrators. It does not affect Business users or customers. Customer MFA (if ever needed) is a separate, future governance question.

---

## 6. Phase 4 — Firebase/Identity Platform Enablement Requirements

### 6.1 Required Changes

| # | Action | Class | Environment | Prerequisite |
|---|---|---|---|---|
| 1 | Upgrade `eleventh-on-us-dev` to Firebase Authentication with Identity Platform | **D** (Founder decision) + **E** (Firebase Console action) | dev | Founder authorization |
| 2 | Enable TOTP MFA at project level via `updateProjectConfig` or REST API | **A** (configuration) | dev | Identity Platform upgrade |
| 3 | Verify email verification requirement (if enforced by Identity Platform) | **A** (configuration check) | dev | Identity Platform upgrade |
| 4 | Upgrade `eleventh-on-us-staging` to Identity Platform (when staging is configured) | **D** + **E** | staging | Staging environment setup |
| 5 | Enable TOTP MFA on staging | **A** | staging | Identity Platform upgrade on staging |
| 6 | Production Identity Platform upgrade (when production project exists) | **D** + **E** | production | Production project creation |
| 7 | Enable TOTP MFA on production | **A** | production | Identity Platform upgrade |

### 6.2 Class Definitions

| Class | Meaning |
|---|---|
| A | Configuration only (no code change) |
| B | Code change required |
| C | Operational procedure |
| D | Founder/product decision required |
| E | External/provider dependency (Firebase Console action) |

### 6.3 Billing Implications

- **Current state:** Blaze billing active on `dev` and `staging`. No per-user charges on standard Firebase Auth.
- **After Identity Platform upgrade:** Blaze plan projects get 50,000 MAUs free, then charged per-MAU. For a small platform-administrator population, this is unlikely to incur measurable cost.
- **TOTP enablement:** Zero cost. TOTP is a configuration setting, not a billed feature.
- **SMS (if ever used as fallback):** Per-SMS charges apply. Not recommended; see Phase 3.

### 6.4 TOTP Enablement Command (for AUTH-MFA-003A)

```typescript
// Using Firebase Admin SDK (firebase-admin@^13.6.0, installed 13.10.0)
import { getAuth } from 'firebase-admin/auth';

await getAuth().projectConfigManager().updateProjectConfig({
  multiFactorConfig: {
    providerConfigs: [{
      state: "ENABLED",
      totpProviderConfig: {
        adjacentIntervals: 5  // Accept TOTPs from 5 adjacent 30-second windows
      }
    }]
  }
});
```

Or via REST API:
```bash
curl -X PATCH "https://identitytoolkit.googleapis.com/admin/v2/projects/eleventh-on-us-dev/config?updateMask=mfa" \
    -H "Authorization: Bearer $(gcloud auth print-access-token)" \
    -H "Content-Type: application/json" \
    -H "X-Goog-User-Project: eleventh-on-us-dev" \
    -d '{
        "mfa": {
          "providerConfigs": [{
            "state": "ENABLED",
            "totpProviderConfig": {
              "adjacentIntervals": 5
            }
          }]
       }
    }'
```

---

## 7. Phase 5 — Existing Authentication Impact Assessment

### 7.1 Critical Question: Can We Enable MFA Without Affecting Ordinary Users?

**Answer: Yes.** Firebase MFA architecture cleanly separates capability enablement from enforcement.

**How Firebase MFA works at the project level:**

1. When MFA is enabled at the project level, users **may** enroll a second factor — but enrollment is voluntary unless the application explicitly requires it.
2. Firebase only throws `auth/multi-factor-auth-required` during sign-in if the **specific user attempting to sign in** has an enrolled second factor.
3. Users without an enrolled second factor continue to sign in normally — no challenge is presented.
4. The application can require MFA only for specific user populations (e.g., platform administrators) through its own authorization logic.

**11thONUS's architecture already implements this separation correctly:**

- The platform-administrator evaluator (`evaluateKnowledgePlatformPermission.ts`) checks `verifiedMfaSatisfied` only when evaluating platform-administrator authorization requests.
- Ordinary Business/customer authentication (`authenticateCallable.ts`, `authenticateClient.ts`) does not check or require MFA.
- `AuthenticatedCredential.verifiedSecondFactor` defaults to `false` and is consumed only by `deriveVerifiedMfaSatisfied()` in the platform-administration domain.

**Therefore:** Enabling TOTP MFA at the Firebase project level will not change the sign-in experience for any Business user or customer who has not enrolled a second factor. Only platform administrators who have been both (a) provisioned with a platform-administrator role AND (b) enrolled a TOTP factor will be affected — and they will be challenged for TOTP during sign-in, which is the intended security behavior.

### 7.2 Impact Matrix

| User Population | Impact of Firebase MFA Enablement |
|---|---|
| Business users (email/password sign-in) | **None** — no second factor enrolled, no challenge presented |
| Business users (Google sign-in) | **None** — same as above |
| Business users (phone OTP sign-in) | **None** — same as above |
| Customers | **None** — no second factor enrolled, no challenge presented |
| Platform administrators (not yet enrolled) | **None initially** — they sign in normally; the evaluator denies access with `MFA_NOT_ESTABLISHED` (existing fail-closed behavior) |
| Platform administrators (after TOTP enrollment) | **Challenge presented** — TOTP code required during sign-in; evaluator allows access upon successful MFA verification |

### 7.3 Email Verification Requirement

Firebase documentation states: "MFA requires email verification." This may mean:
- Users enrolling MFA must have a verified email address.
- OR: The project must have email verification enabled.

**Impact on 11thONUS:** If enforced, this means platform administrators must have a verified email before enrolling TOTP. The existing email/password sign-in provider can support email verification. This should be verified during AUTH-MFA-003A after Identity Platform upgrade.

**If email verification is enforced:** Platform administrators using email/password sign-in would need email verification before TOTP enrollment. Administrators using Google sign-in already have a verified email through Google's OAuth flow.

---

## 8. Phase 6 — Administrator Enrollment Architecture

### 8.1 Minimum Safe Enrollment Flow

```
Provisioned platform administrator signs in (primary factor only)
    → Evaluator denies: MFA_NOT_ESTABLISHED (existing behavior)
    → Application detects: user is platform administrator, MFA not yet enrolled
    → Redirects to TOTP enrollment screen
    → Enrollment flow:
        1. multiFactor(user).getSession() → MultiFactorSession
        2. TotpMultiFactorGenerator.generateSecret(session) → TotpSecret
        3. Display QR code (TotpSecret.generateQrCodeUrl()) + manual entry key
        4. User scans QR code with authenticator app
        5. User enters current 6-digit TOTP code
        6. TotpMultiFactorGenerator.assertionForEnrollment(secret, otp) → assertion
        7. multiFactor(user).enroll(assertion, "Platform Admin TOTP")
        8. Refresh ID token (enrollment revokes existing sessions per Firebase behavior)
        → New ID token contains sign_in_second_factor claim
        → Subsequent sign-in triggers MFA challenge
```

### 8.2 Security Invariants

| Invariant | Implementation |
|---|---|
| MFA enrollment must never grant platform-administrator authority | Enrollment is a client-side Firebase operation; platform-administrator authority comes from the `platformAdministrators/{userId}` Firestore document, provisioned separately via `bootstrapPlatformAdministrator()` |
| Identity + role + verified MFA = authorized request | These remain three separate axes: identity (Firebase Auth), role (Firestore document), MFA (token claim) |
| An ordinary user who enrolls MFA remains an ordinary user | MFA enrollment does not create or modify any `platformAdministrators/{userId}` document |
| Self-service administrator elevation prevented | Only `bootstrapPlatformAdministrator()` (Admin SDK only, never wired to any callable) can create platform-administrator records |

### 8.3 Enrollment Timing Options

| Option | Description | Recommendation |
|---|---|---|
| Post-provisioning forced enrollment | Immediately after bootstrap, redirect to enrollment before any platform-admin action | **Recommended** — ensures MFA is established before first use |
| First-login enrollment | On first sign-in after provisioning, require enrollment | Acceptable alternative |
| Voluntary enrollment | Administrator may enroll at any time | **Not recommended** — delays MFA compliance |
| Grace period | Allow N days before requiring enrollment | **Not recommended** — weakens security posture |

---

## 9. Phase 7 — Sign-In Challenge Architecture

### 9.1 Current Gap

The existing sign-in flows (`emailPasswordSignInFlow.ts`, `googleSignInFlow.ts`, `phoneSignInFlow.ts`) do not handle Firebase's `auth/multi-factor-auth-required` error. When a TOTP-enrolled user signs in, Firebase throws this error, and the current code has no handler for it.

### 9.2 Required Client-Side Changes

```typescript
// Conceptual — not implementing, just documenting the architecture
try {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  // Primary factor succeeded — proceed normally
} catch (error) {
  if (error.code === 'auth/multi-factor-auth-required') {
    const resolver = getMultiFactorResolver(auth, error);
    // Show MFA challenge UI
    // For TOTP: prompt user for authenticator app code
    const assertion = TotpMultiFactorGenerator.assertionForSignIn(
      resolver.hints[0].uid,
      userEnteredCode
    );
    const userCredential = await resolver.resolveSignIn(assertion);
    // MFA-authenticated session established
  }
}
```

### 9.3 Interaction with Existing Auth State

- The `authenticateClient.ts` / `authenticateCallable.ts` flow sends the raw Firebase ID token to the backend.
- After MFA challenge completion, the refreshed ID token will contain `sign_in_second_factor: "totp"`.
- The backend's `firebaseTokenVerifier.ts` will derive `verifiedSecondFactor: true`.
- No changes needed to the backend authentication flow — it already handles the new claim correctly.

### 9.4 Preservation of Business/Customer Auth

- Business and customer sign-in flows remain unchanged for non-MFA-enrolled users.
- The `auth/multi-factor-auth-required` error is only thrown for users with enrolled second factors.
- The MFA challenge UI should be isolated to the platform-administration sign-in path, not mixed into the general sign-in panel.

---

## 10. Phase 8 — Recovery and Lockout

### 10.1 Scenarios

| Scenario | Risk | Mitigation |
|---|---|---|
| Administrator loses authenticator device | Locked out of MFA | Controlled admin reset |
| Administrator changes phone (new device, same number) | Authenticator app data lost | Re-install authenticator app, re-scan QR (if saved) or controlled reset |
| Administrator changes authenticator app | Old enrollments may be inaccessible | Controlled admin reset |
| Factor compromised | Security risk | Controlled admin reset + factor unenrollment |
| Administrator leaves organisation | Account should be deactivated | `bootstrapPlatformAdministrator` can set status to `removed` |

### 10.2 Supported Firebase Recovery Mechanisms

| Mechanism | Firebase-Supported | Application Responsibility |
|---|---|---|
| Factor unenrollment (Admin SDK) | Yes — `admin.auth().updateUser(uid, { multiFactor: { enrolledFactors: null } })` | Orchestration, audit logging |
| Factor re-enrollment | Yes — same enrollment flow | UI, session management |
| Backup factor (e.g., secondary TOTP or SMS) | Yes — Firebase supports multiple enrolled factors | UI for secondary factor setup |
| Recovery codes | **Not natively supported by Firebase** | Would require custom implementation |

### 10.3 Recommended Recovery Architecture

For the small platform-administrator population:

1. **No backup factor for MVP** — adds complexity for a tiny population.
2. **Controlled administrative reset** — another platform administrator (or the Founder) can trigger factor unenrollment via an Admin SDK operation, allowing the affected administrator to re-enroll.
3. **Audit trail** — every reset is logged via `platformAdministrationAuditRepository`.
4. **Fail-closed** — if an administrator's factor is reset, they must re-enroll before regaining platform-administrator access.

### 10.4 Founder Decision Required

The recovery mechanism needs explicit authorization:
- Who may authorize a factor reset? (Founder only? Any platform administrator?)
- Is a second approver required? (Separation of duties)
- Is a time-limited recovery window appropriate?

---

## 11. Phase 9 — Rollout Architecture

### 11.1 Recommended Environment Rollout Sequence

```
1. local/emulator
   → Test TOTP enrollment + challenge in emulator environment
   → Verify verifiedSecondFactor derivation end-to-end
   → Verify ENG-P3-003A authorization with MFA

2. eleventh-on-us-dev
   → Upgrade to Identity Platform (Founder-authorized)
   → Enable TOTP MFA via project config
   → Test enrollment flow
   → Test MFA challenge flow
   → Test server-side verifiedSecondFactor
   → Test ENG-P3-003A authorization
   → Test recovery/reset

3. eleventh-on-us-staging (when configured)
   → Repeat dev validation sequence

4. production (when created)
   → Repeat dev validation sequence
   → Controlled first administrator enrollment
   → Production end-to-end authorization validation
```

### 11.2 Rollback Strategy

**Identity Platform upgrade:** Firebase documentation states the upgrade is permanent — there is no downgrade path from Identity Platform back to standard Firebase Auth. This makes the upgrade a one-way decision. The Founder should be informed of this before authorizing.

**TOTP enablement:** Can be disabled by setting `multiFactorConfig.providerConfigs[0].state: "DISABLED"` or removing the `mfa` field from the project config. This does not unenroll existing factors but prevents new enrollments and new challenges.

**Full rollback:** If MFA must be completely reversed, existing factor enrollments would need to be removed via Admin SDK, and the project config updated to disable MFA. This is an administrative operation, not a code rollback.

---

## 12. Phase 10 — Implementation Sequence

### 12.1 Proposed Subsequent Packages

| Package | Objective | Prerequisites | Implementation Boundary | Tests Required | Config Dependency | Founder Decision | Completion Gate |
|---|---|---|---|---|---|---|---|
| **AUTH-MFA-003A** | Identity Platform upgrade + TOTP enablement on `dev` | Founder decision on upgrade + TOTP policy | Firebase Console upgrade; project config update; verification | Emulator TOTP enrollment test; project config read-back verification | Identity Platform upgrade; TOTP config | Yes (upgrade + policy) | TOTP enabled on `dev`; enrollment possible via SDK |
| **AUTH-MFA-003B** | Platform administrator TOTP enrollment UI | AUTH-MFA-003A | Client-side enrollment flow in `apps/web/` | Enrollment unit tests; emulator enrollment integration test | None | No (engineering detail) | Administrator can enroll TOTP factor |
| **AUTH-MFA-003C** | MFA sign-in challenge handling | AUTH-MFA-003A; AUTH-MFA-003B | Client-side challenge flow in `apps/web/` | Challenge unit tests; emulator challenge integration test | None | No (engineering detail) | MFA-enrolled administrator can complete sign-in |
| **AUTH-MFA-003D** | Administrator MFA recovery/reset | AUTH-MFA-003A | Admin SDK reset operation; audit logging | Recovery unit tests; emulator recovery test | None | Yes (recovery authorization policy) | Locked-out administrator can regain access |
| **AUTH-MFA-003E** | End-to-end operational validation | AUTH-MFA-003A through D | Full integration test on `dev` | End-to-end emulator test; manual `dev` verification | None | No | Production-ready MFA path validated on `dev` |

### 12.2 ENG-P3-003 Dependency Analysis

```
ENG-P3-003A (COMPLETE — authorization foundation)
    ↓
AUTH-MFA-001 (COMPLETE — server-side MFA verification)
    ↓
AUTH-MFA-002 (THIS ASSESSMENT — readiness determination)
    ↓
AUTH-MFA-003A (Identity Platform + TOTP enablement)
    ↓
AUTH-MFA-003B + AUTH-MFA-003C (enrollment + challenge UI)
    ↓
    → ENG-P3-003B can begin (KnowledgeDraft model)
    → AUTH-MFA-003D (recovery) can proceed in parallel
    ↓
AUTH-MFA-003E (end-to-end validation)
    ↓
Knowledge Studio MVP can operate with legitimate MFA-authenticated administrators
```

**Key insight:** `ENG-P3-003B` (KnowledgeDraft model) does not strictly depend on MFA client implementation — it is a data model task. However, the Knowledge Studio MVP cannot be *used* by real administrators until MFA is operational end-to-end. Therefore:

- `ENG-P3-003B` can be authorized to proceed in parallel with `AUTH-MFA-003B`/`AUTH-MFA-003C`.
- Knowledge Studio UI work should not begin until MFA enrollment and challenge flows are implemented.
- The Knowledge Studio MVP "operational readiness" gate requires MFA to be end-to-end functional.

---

## 13. Decision Matrix

| Question | Current State | Evidence | Recommendation | Authority Required |
|---|---|---|---|---|
| Firebase MFA enabled? | **DISABLED** (July 2026) | EXT-TECH-001-ENV-READY; may be stale | Must be re-verified at AUTH-MFA-003A time | N/A (informational) |
| Identity Platform upgrade required? | **Yes — current tier does not support MFA** | Firebase documentation comparison table; `FIREBASE_AUTH` subtype confirmed | Upgrade required | **Founder decision** (one-way upgrade) |
| Environment coverage | `dev` configured; `staging` unconfigured; `production` does not exist | `.firebaserc`; EXT-TECH-001-ENV-READY | Upgrade `dev` first; staging/production when ready | Founder (for each environment) |
| Supported factors | TOTP and SMS both supported in SDKs | SDK type definitions verified; Firebase documentation | TOTP recommended | **Founder decision** (policy) |
| TOTP suitability | **Excellent** — offline, free, portable, no telecom dependency | SDK support confirmed; Firebase documentation | TOTP primary | Founder (policy) |
| SMS suitability | **Poor for platform admins** — carrier-dependent, cost, SIM-swap risk | Firebase documentation; telecom analysis | Not recommended as primary | Founder (policy) |
| Recommended admin factor policy | **Option A: TOTP only** | Phase 3 analysis | TOTP only | **Founder decision** |
| Billing/plan implications | Blaze active; Identity Platform adds MAU-based pricing | Firebase documentation | 50,000 MAU free tier sufficient for admin population | Founder (informational) |
| Existing-user impact | **None** — MFA enforcement is per-user, not project-wide | Firebase MFA architecture; 11thONUS evaluator separation | Enable with confidence | N/A (engineering confirmation) |
| Enrollment approach | Post-provisioning forced enrollment | Phase 6 analysis | Mandatory before first platform-admin action | Founder (operational policy) |
| Challenge handling | Not implemented; SDK supports it | Client SDK type definitions; Firebase documentation | Required (AUTH-MFA-003C) | No (engineering) |
| Recovery/reset | Not implemented; Admin SDK supports factor unenrollment | Admin SDK documentation | Controlled admin reset (AUTH-MFA-003D) | **Founder decision** (authorization policy) |
| Rollout sequence | Emulator → dev → staging → production | Phase 9 analysis | Staged rollout | Founder (for each stage) |
| ENG-P3-003 dependency | ENG-P3-003B can proceed in parallel; UI work blocked | Phase 10 analysis | Parallel where safe | No (engineering sequencing) |

---

## 14. Founder Decision Bundle

If one or more genuine Founder decisions are required, they are consolidated here as a single decision bundle.

### FD-MFA-2 — Platform Administrator MFA Policy and Identity Platform Upgrade

**Decision 1: Identity Platform Upgrade**

| | |
|---|---|
| **Question** | Should `eleventh-on-us-dev` be upgraded from standard Firebase Authentication to Firebase Authentication with Identity Platform? |
| **Options** | (A) Upgrade now; (B) Defer until production project exists; (C) Do not upgrade |
| **Engineering recommendation** | (A) Upgrade now — MFA cannot be enabled without this upgrade; the upgrade is a prerequisite for all subsequent AUTH-MFA-003 packages |
| **Consequences** | One-way upgrade (no downgrade path); unlocks MFA, blocking functions, user activity logging, enterprise SLA; Blaze pricing adds MAU-based charges beyond 50,000 free MAUs |
| **What remains blocked until decision** | AUTH-MFA-003A cannot proceed; all subsequent MFA packages blocked; ENG-P3-003B can proceed independently |
| **What can proceed independently** | ENG-P3-003B (KnowledgeDraft data model); non-MFA engineering work |

**Decision 2: Platform Administrator MFA Factor Policy**

| | |
|---|---|
| **Question** | Should platform administrators use TOTP only, SMS only, TOTP + SMS, or another model for multi-factor authentication? |
| **Options** | (A) TOTP only; (B) SMS only; (C) TOTP primary + SMS fallback; (D) Both equally supported; (E) Other (specify) |
| **Engineering recommendation** | (A) TOTP only — no telecom dependency, zero cost, works offline, portable across all African jurisdictions, higher security than SMS |
| **Consequences** | TOTP only means administrators must install an authenticator app; no SMS fallback if device is lost (mitigated by controlled admin reset); simplest implementation and support model |
| **What remains blocked until decision** | AUTH-MFA-003A factor configuration; AUTH-MFA-003B enrollment UI scope; AUTH-MFA-003C challenge UI scope |
| **What can proceed independently** | Identity Platform upgrade decision; ENG-P3-003B; non-MFA work |

**Decision 3: Administrator MFA Recovery Authorization**

| | |
|---|---|
| **Question** | Who may authorize a platform administrator's MFA factor reset, and what separation-of-duties requirements apply? |
| **Options** | (A) Founder only; (B) Any active platform administrator; (C) Founder + one active administrator (dual authorization); (D) Other (specify) |
| **Engineering recommendation** | (C) Founder + one active administrator — balances security with operational availability |
| **Consequences** | Determines the AUTH-MFA-003D recovery-flow authorization logic; affects operational support burden |
| **What remains blocked until decision** | AUTH-MFA-003D recovery implementation scope |
| **What can proceed independently** | AUTH-MFA-003A through C; ENG-P3-003B |

---

## 15. Files Modified

**Created:**
- `docs/05-implementation/reports/AUTH-MFA-002-platform-administrator-mfa-readiness-assessment-2026-09-04.md` (this report)

**Modified:**
- `docs/00-governance/documentation-changes-log.md` (Entry 163 appended)

**No application source code was modified.**

---

## 16. Code Diff Summary

Documentation only. Zero application code changes.

---

## 17. Commands Executed

- `git status` — primary worktree state verification
- `git worktree list` — worktree inventory
- `git fetch origin` — remote state refresh
- `git log -1 origin/main` — tip commit verification
- `git worktree add ... origin/main -b docs/auth-mfa-002-platform-admin-readiness` — isolated worktree creation
- `git merge-base --is-ancestor f5f66c1... origin/main` — PR #226 merge verification
- Read-only codebase inspection via Task agents (explore) — AUTH-MFA-001 implementation, governance documents, Firebase configuration, SDK types
- Firebase MFA documentation retrieval via WebSearch — TOTP MFA, SMS MFA, Identity Platform comparison

---

## 18. Dependencies Added

None.

---

## 19. Configuration Changes

None.

---

## 20. Tests/Checks Executed

This is a documentation-only task. No application tests were run. The repository's CI checks should run automatically when the PR is opened.

---

## 21. CI Result

Pending — will be verified after PR is opened.

---

## 22. Automated Review Findings and Dispositions

Pending — will be assessed after PR is opened.

---

## 23. Risks

1. **Stale environment evidence.** The MFA-state evidence from EXT-TECH-001-ENV-READY is from 2026-07-31 (nearly 5 weeks old). The Firebase Console may have been changed since. **Mitigation:** Re-verify MFA state at AUTH-MFA-003A implementation time.

2. **Identity Platform upgrade is one-way.** Firebase does not support downgrading from Identity Platform to standard Firebase Auth. **Mitigation:** Founder should be explicitly informed before authorizing; the upgrade unlocks useful features beyond MFA.

3. **Email verification requirement.** Firebase documentation states "MFA requires email verification." If enforced, this adds a prerequisite for TOTP enrollment. **Mitigation:** Verify after Identity Platform upgrade; email verification can be implemented if needed.

4. **TOTP authenticator-app dependency.** Administrators must install and use an authenticator app. For a small internal population this is manageable, but it is a real operational dependency. **Mitigation:** Brief enrollment documentation; supported authenticator apps: Google Authenticator, Authy, Microsoft Authenticator, 1Password, etc.

5. **Recovery without SMS.** If an administrator loses their authenticator device and no backup factor exists, they are locked out until a controlled admin reset. **Mitigation:** Controlled admin reset (AUTH-MFA-003D) with audit trail.

---

## 24. Rollback Instructions for Repository Changes

```bash
git revert <commit-sha>  # Reverts the documentation-only commit
```

No application code to roll back.

---

## 25. Assessment Report Path

```
docs/05-implementation/reports/AUTH-MFA-002-platform-administrator-mfa-readiness-assessment-2026-09-04.md
```

---

## 26. Documentation Changes-Log Entry

Entry 163 appended to `docs/00-governance/documentation-changes-log.md`.

---

## 27. Commit SHA

Pending — will be recorded after commit.

---

## 28. PR Number

Pending — will be recorded after PR creation.

---

## 29. Exact PR Head SHA

Pending — will be recorded after PR creation.

---

## 30. PR State

Pending — will be recorded after PR creation.

---

## 31. Confirmation PR Was Not Self-Merged

Will be confirmed after PR creation. PR will be left open for Founder review.

---

## 32. Confirmation No Firebase Configuration Was Changed

**Confirmed.** No Firebase Console, `.firebaserc`, `firebase.json`, or project configuration was modified. The Identity Platform upgrade and TOTP enablement are recommended in this report but not performed.

---

## 33. Confirmation No MFA UI Was Implemented

**Confirmed.** No enrollment UI, challenge UI, or recovery UI was implemented. This report is documentation only.

---

## 34. Confirmation ENG-P3-003B Was Not Started

**Confirmed.** No `KnowledgeDraft` model, draft lifecycle, or Knowledge Studio code was created or modified.

---

## 35. Confirmation FD-COM-001 Remained Untouched

**Confirmed.** The isolated worktree was created from `origin/main` with no access to the primary worktree's uncommitted FD-COM-001 changes.

---

## 36. Final Success Gate

### `MFA READINESS REQUIRES FOUNDER DECISION — IDENTITY PLATFORM UPGRADE AND TOTP PRIMARY FACTOR POLICY`

Three conditions prevent a real 11thONUS platform administrator from completing an MFA-authenticated session:

1. **Firebase Authentication with Identity Platform upgrade not performed** — MFA is not available on the current standard Firebase Authentication tier. This is the first gate.
2. **TOTP MFA not enabled at project level** — even after upgrade, TOTP must be explicitly enabled. This depends on (1).
3. **No client-side enrollment or challenge UI** — no user-facing flow exists to enroll a TOTP factor or complete a second-factor challenge. This depends on (1) and (2).

All three are addressable through a clear, staged implementation path. None requires architectural redesign. The server-side foundation (AUTH-MFA-001) is complete and correct.

---

## 37. Exact Founder Next Action

Review and decide on **FD-MFA-2** (Section 14):

1. Authorize Identity Platform upgrade for `eleventh-on-us-dev`.
2. Confirm platform-administrator MFA factor policy (TOTP recommended).
3. Confirm administrator MFA recovery authorization policy.

Upon Founder approval, AUTH-MFA-003A (Identity Platform upgrade + TOTP enablement) can be authorized and executed.
