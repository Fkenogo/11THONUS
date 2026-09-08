# AUTH-ARCH-001 — Authentication & Identity-Provider Architecture Reassessment

> **Status:** **ASSESSMENT CORRECTED — AWAITING FOUNDER ARCHITECTURE-DIRECTION DISPOSITION — PROVIDER VALIDATION REQUIRED**
> **Classification:** Controlled architecture assessment — no implementation
> **Date:** 2026-09-07; corrected 2026-09-08 under `AUTH-ARCH-001-CORR-001`
> **Repository authority assessed:** `origin/main` `b0a039b2af2e4f869c5534ccb8d8705fdece661a`
> **Architecture-class disposition:** **CHANGE** — move from Firebase Authentication to a separately controlled external managed IdP boundary while retaining Firebase application/data services.
> **Provider-selection disposition:** **TARGET PROVIDER NOT YET SELECTED — VALIDATION REQUIRED.** No candidate has yet proven every hard invariant. Auth0 is the leading candidate only; it is **VALIDATION REQUIRED**, not selected.
> **Authority boundary:** this report recommends; it neither approves a provider, changes `DEC-SEC-004`/`DEC-SEC-005`/`FD-MFA-R`, authorizes a migration, nor resumes `AUTH-MFA-003D-IMPL-001`.
> **Correction record:** `AUTH-ARCH-001-CORR-001` corrects the Cognito qualification (previously eliminated on incomplete `AdminSetUserMFAPreference` grounds without assessing `AdminDeleteSoftwareToken`), the Auth0 session/refresh-token/JWT revocation analysis (previously treated `202 Accepted` session deletion as sufficient for R5 without a fail-closed confirmation point), and the final disposition (previously presented Auth0 Enterprise as the qualified target subject only to gates). Stage 1 requirements, Stage 2 blast-radius, controlled-provider-dependency principle and Firebase application/data-platform analysis are unchanged.

## 1. Executive conclusion

The correct pre-pilot architecture is **an external managed identity provider with Firebase Hosting, Cloud Functions, Firestore and Storage retained**. Authentication must be treated as an independently replaceable infrastructure boundary, not as a reason to relocate unrelated application services.

Firebase Authentication / Google Identity Platform is not suitable as the target provider under the currently approved policy. The repository's provider-feasibility evidence establishes that its service-account administrative MFA update is whole-list replacement with no factor-addressed delete, ETag, version or compare-and-swap guard. It can remove a concurrently enrolled replacement factor and so cannot meet `DEC-SEC-005` R5/R7 and `AUTH-MFA-003D-IMPL-001` AC-09/10/18. This is a hard security-invariant failure, not a transition-cost preference.

**Auth0 Customer Identity Enterprise** is the leading candidate only and is classified **VALIDATION REQUIRED**, not selected. Its documented Management API deletes a named Guardian enrollment, supports Management-API/M2M administration, supplies an MFA `amr` claim in a signed ID token, and documents user-session deletion. However, its session/refresh-token deletion operations are documented as asynchronous and eventually consistent returning `202 Accepted`, deleting sessions does not necessarily revoke refresh tokens (separate Enterprise-only revocation operations exist), and already-issued signed JWT access tokens cannot be revoked and remain valid until expiry. No documented fail-closed confirmation point establishing revocation success before factor deletion has been proven, and any domain-side token-revocation cutoff at the Functions boundary would be part of the candidate architecture requiring Founder/security authority confirmation — it is not implemented here. Those gates concern hard R5/R7 invariants, not commercial commitment alone; they do not restore Firebase's missing hard capability. No provider account creation or proof of concept was performed in this task.

The current domain design is materially better than a simple Firebase-only application: customer identity, business relationships, authorization and audit are owned in 11thONUS records, and the authentication domain already has a token-verifier port. However, Firebase UIDs have leaked into durable authentication references, Platform Administrator record keys, invitation entitlement lookup, and a legacy actor helper. These are material, remediable migration seams. They do not require a business-data migration in the pre-pilot state, but must be corrected as part of any approved architecture programme.

## 2. Entry state and assessment method

| Item | Evidence |
| --- | --- |
| Authoritative remote | `https://github.com/Fkenogo/11THONUS.git` (`origin`) |
| Exact fetched `origin/main` | `b0a039b2af2e4f869c5534ccb8d8705fdece661a` — 2026-09-07 merge of PR #233 |
| Assessment branch/worktree | `codex/auth-arch-001-assessment` in isolated `.claude/worktrees/auth-arch-001`, created from that SHA; clean at assessment start |
| Primary worktree | Dirty on unrelated `docs/dec-legal-002-bt-draft-007`; not modified or used for assessment edits |
| Open PRs inspected | #34 and #164; neither is authentication architecture work |
| Relevant merged chain | PR #232 (`AUTH-MFA-003D` design/Founder disposition) and PR #233 (official work package) |
| Provider feasibility located | Unmerged evidence branch `codex/auth-mfa-003d-provider-001`, commit `618c6e5`; its report was inspected as repository evidence, not merged authority |
| Assessment order | Stage 1 requirements → Stage 2 repository blast radius → Stage 3 qualification → Stage 4 architecture comparison → Stage 5 recommendation |

No provider account, configuration, live API call, emulator mutation, application code, dependency, Rules file, environment variable, or production data was changed.

## 3. Governing authorities reviewed

| Authority | What it governs / finding |
| --- | --- |
| [Authentication Blueprint](../roadmap/AUTH-BP-authentication-blueprint-2026-08-08.md) §§0–16 | Authentication is an access layer, never durable identity; MVP methods are Google, email/password and optional phone OTP; `TokenVerifierPort` is the intended seam. |
| [Authentication foundation decisions](AUTH-P0-001-authentication-foundation-decisions-2026-08-07.md) / `DEC-AUTH-001` | Customer authentication is separate from staff; duplicate identity is refer-only; Burundi SMS is a production-launch dependency, not a build gate. The original email deferral is superseded by `AUTH-CORR-003`, as the Blueprint records. |
| [Customer Identity architecture](../roadmap/ENG-P2-ARCH-001-customer-identity-architecture.md) and `TRD10` §§10.4, 10.6 | 11thONUS owns durable customer identity, business membership and identity lifecycle; Firestore stores references, never credentials, secrets or provider tokens. |
| `AUTH-01`, `AUTH-02`, `AUTH-03`, `AUTH-05`–`AUTH-09` implementation reports and source | Verify a provider credential server-side, resolve a customer identity by an authentication reference, fail closed on conflict, and keep identity recovery distinct from credential proof. |
| [Platform Administration TRD](../../02-technical/trd/18-platform-governance-and-administration.md), `ENG-P3-003A`, `DEC-SEC-002` | Platform Administrator role/lifecycle/authorization are domain-owned; every administrator requires MFA, and MFA proof is session-specific rather than an enrollment flag. |
| `DEC-SEC-004` / `FD-MFA-2` | Platform Administrator MFA is TOTP-only, unconditional, server-verifiable, non-bypassable, and not customer or Business MFA. |
| `DEC-SEC-005` / `FD-MFA-R` R1–R10, [approved 003D design §34](AUTH-MFA-003D-DESIGN-001-platform-administrator-mfa-recovery-assessment-2026-09-07.md#34-founder-disposition--fd-mfa-r-recorded-as-dec-sec-005) | Exact-factor recovery, mandatory fail-closed revocation, no lifecycle change, re-enrollment/fresh challenge, audit vocabulary, independent approval and Founder-only break-glass are fixed. |
| [003D work package](AUTH-MFA-003D-IMPL-001-work-package-2026-09-07.md) | Current implementation package is authorized only subject to remaining gates; it expressly stops if provider exact-factor safety is absent. |
| Provider-feasibility evidence (`618c6e5`) | Firebase/Identity Platform lacks an administrative exact-factor conditional mutation; this is the active hard provider blocker. |
| [Infrastructure disposition](../../00-governance/11thonus-infrastructure-disposition-v1.md) and [MTAIP-001 alignment assessment](mtaip-001-product-alignment-assessment-11thonus-2026-08-28.md) | Firebase was retained because it fit then-known requirements, not because MTAIP mandates it. Provider specificity is not itself a defect; reassessment is required when product/security evidence changes. |
| [Miledge Platform Architecture declaration](../../../MILEDGE-PLATFORM-ARCHITECTURE.md) | Project architecture remains governed by 11thONUS authority; Miledge mapping neither mandates Firebase nor authorizes a provider migration. |

The canonical external MTAIP-001 policy itself is not stored in this repository; the project alignment assessment expressly records that fact. This report relies only on the repository's controlled disposition and evidence record, and does not manufacture missing Miledge authority.

## 4. Stage 1 — Canonical Authentication & Identity Requirements Catalogue

`Hard invariant` means a candidate cannot be the target architecture if it cannot meet the row without a new Founder decision. `Important` shapes the architecture. `Preference` is a selection trade-off. `Deferred` is explicitly outside the pilot architecture.

| Area | Canonical requirement | Class | Authority / evidence | Status of evidence |
| --- | --- | --- | --- | --- |
| Durable identity | Customer identity is 11thONUS-owned, durable and distinct from authentication. | **Hard invariant** | `ENG-P2-ARCH-001` §7; AUTH-BP §0/§1 | Approved requirement |
| Business identity | Business, branch, membership and staff-role relationships are domain records, not provider roles/claims. | **Hard invariant** | TRD10 §§10.4, 10.6.3–10.6.4; `ENG-P2-002/003` designs | Approved requirement |
| Authentication reference | A verified credential resolves through an authentication reference to one customer identity; no provider auto-merges identities. | **Hard invariant** | AUTH-BP §§3–7; `DEC-AUTH-001` D-A3 | Approved requirement |
| Provider relationship | Provider subject/reference is an opaque reference, not durable identity or business authority. | **Hard invariant** | AUTH-BP §§0, 3–4; TRD10 §10.6.1 | Approved requirement |
| Customer methods | Google + email/password are MVP; phone OTP is authorized but optional/non-default. | **Important** | AUTH-BP §3; `AUTH-CORR-003` | Approved requirement |
| Phone market readiness | Burundi/Rwanda SMS operation must be validated before live enablement; lack of SMS must not block the other core methods. | **Important** | `DEC-AUTH-001` D-A4; AUTH-BP §14 | Approved requirement |
| Credential lifecycle | Sign-up/sign-in, provider linking/unlinking, email verification, password reset/change, account disablement/removal and credential proof must be provider-supported. | **Important** | AUTH-BP §§5–8; PRD2; existing `AUTH-03/05/06` behavior | Mixed: approved scope; provider details are implementation evidence |
| Session/token | Backend verifies a signed token and rejects revoked/disabled sessions; sensitive actions require fresh proof. | **Hard invariant** | AUTH-BP §9; `AUTH-02`, `AUTH-07`, `DEC-SEC-001` | Approved requirement |
| Administrator identity | Platform Administrator status, roles and lifecycle are 11thONUS domain authority, separate from Business roles. | **Hard invariant** | TRD18; `ENG-P3-003A`; `DEC-GOV-011` | Approved requirement |
| Administrator MFA | Every Platform Administrator has TOTP-only MFA; no SMS, customer or Business MFA is introduced by this scope. | **Hard invariant** | `DEC-SEC-004` / `FD-MFA-2` | Approved requirement |
| MFA trust | Privileged authorization consumes server-verified evidence that the *current session* completed MFA; enrollment state/custom client flags are insufficient. | **Hard invariant** | `DEC-SEC-004`; `AUTH-MFA-001`; `firebaseTokenVerifier.ts` | Approved requirement + implementation evidence |
| MFA recovery | R1–R10: independent authorization, no self-approval, persistent exact-factor binding, one-hour expiry, audit, no lifecycle alteration, re-enrollment and fresh MFA challenge. | **Hard invariant** | `DEC-SEC-005` / `FD-MFA-R` | Approved requirement |
| Revocation/recovery order | Target sessions are revoked and success is confirmed before an approved factor removal; failure stops recovery. | **Hard invariant** | `DEC-SEC-005` R5; 003D WP AC-07/08 | Approved requirement |
| Exact-factor safety | Recovery may remove only F1 identified in the persistent record and must never remove concurrent replacement F2. | **Hard invariant** | `DEC-SEC-005` R7; 003D WP AC-09/10/18 | Approved requirement |
| Operations | Machine-to-machine/provider administration, attributable break-glass, user administration, audit and incident diagnostics are required. | **Hard invariant** | `DEC-SEC-005` R4/R10; TRD18 | Approved requirement |
| Authorization | Provider claims are authentication evidence only; authorization remains domain-role/permission evaluation. | **Hard invariant** | AUTH-BP; `ENG-P2-004D`; `ENG-P3-003A` | Approved requirement |
| Rules/data | Credentials, OTP secrets and tokens never enter Firestore; direct client data access is deny-by-default until a governed shape exists. | **Hard invariant** | TRD10 §10.6.1; current `firestore.rules` / `storage.rules` | Approved requirement + implementation evidence |
| Engineering | Browser SDK, backend JWT verification/admin API, deterministic unit tests, integration testing, local development and CI are required. | **Important** | AUTH-BP §§13–15; engineering standards | Approved requirement |
| Localization | Customer-facing authentication uses English and French parity. | **Important** | AUTH-BP §15; existing `apps/web` i18n implementation | Approved requirement + implementation evidence |
| Pilot size | The repository establishes a pre-pilot state and does not establish a committed MAU, administrator population or provider budget. | **Unresolved requirement** | MPA declaration §5; no authoritative scale/cost ceiling found | Do not infer |
| Cost | Pilot/early-production cost must include MAU, SMS/MFA messages and operating effort, not just a headline subscription. | **Important** | Task requirement; MTAIP disposition §18 cost trigger | Assessment criterion, not a new product decision |
| Passkeys/Apple/email-link | Additive future methods; they must not drive this pre-pilot decision. | **Deferred** | AUTH-BP §3 | Approved deferral |
| Customer/Business MFA | Not authorized in this assessment. | **Deferred** | `DEC-SEC-004`; 003D WP scope | Approved deferral |

### Hard-invariant consequence

An IdP that cannot execute R5/R7 exact-factor recovery is not an eligible target even if it has strong web SDKs, an emulator, low cost or historical implementation. Conversely, no current authority requires zero provider coupling or a provider-agnostic Rules engine.

## 5. Stage 2 — Current architecture and durable-identity assessment

### 5.1 Current flow

```text
Firebase Web SDK → Firebase ID token → callable rawToken
      → Firebase Admin verifyIdToken(token, true)
      → AuthenticatedCredential { referenceType, referenceId, MFA fact }
      → authenticationReferences/{type}:{referenceId}
      → users/{customerIdentityId}
      → 11thONUS business / permissions / Platform Administrator authority
```

The favorable part is real: `functions/src/domains/authentication/models/*` and `ports/tokenVerifierPort.ts` do not import Firebase; `firebaseTokenVerifier.ts` is an adapter. Customer identity is a generated `customerIdentityId`, and Firestore documents own customer, business, membership, role, lifecycle and audit semantics. Firebase Rules do not currently use `request.auth`, `auth.uid` or custom claims: all direct client operations are denied. Functions use a raw token in callable data and independently verify it, rather than treating callable `request.auth` as the authorization authority.

### 5.2 Where the boundary leaks

The current `referenceId` is always `decoded.uid`. That is a provider-specific identifier stored in the authentication-reference record and customer projection. This is acceptable only as a provider reference, but the same value also drives Platform Administrator documents, invitation verified-contact lookup and a legacy actor model. These uses elevate a Firebase UID beyond the desired reference boundary.

The preferred target boundary is therefore:

```text
Provider subject / token / session
  → IdP adapter and provider-reference record
  → 11thONUS AuthenticationReference (provider key + opaque subject)
  → 11thONUS CustomerIdentityId
  → 11thONUS authorization, business and administrator domains
```

No durable business, loyalty or business-membership document was found to use a Firebase UID as its own primary domain identifier. The leakage is concentrated at the identity/authentication edge and is therefore high-impact but controllable before pilot.

## 6. Repository dependency and blast-radius matrix

| Component | Current Firebase dependency | Type / classification | Severity | Migration impact | Controlled seam? |
| --- | --- | --- | --- | --- | --- |
| Authentication domain models/port | Provider-neutral credential and verifier contract | **Controlled dependency seam** | Low | Adapter replacement only | Yes |
| `firebaseTokenVerifier.ts` | Admin `verifyIdToken(..., true)`, Firebase claims, UID, error taxonomy | Healthy boundary coupling | High | Replace adapter/JWT validation and claim mapping | Yes |
| Authentication references | `referenceId = Firebase UID`; Firebase provider labels map to types | **Architecture leakage** | High | Re-key/reference migration; dual lookup during controlled transition | Partly |
| Customer identity documents | Generated `customerIdentityId`; reference projection only | Controlled dependency seam | Low | Preserve documents; update references, not identity IDs | Yes |
| Account linking | Requires same Firebase principal and compares UIDs | **Architecture leakage** | High | Redesign linking semantics around provider-subject/link proof | No |
| Platform Administrator records | `platformAdministrators/{userId}` receives resolved Firebase UID/reference ID | **Architecture leakage** | Critical | Rebind to durable customer/administrator identity before transition | No |
| Platform MFA | Firebase Web TOTP, `firebase.sign_in_second_factor`, Admin/Identity Platform APIs | Healthy coupling at auth boundary, but provider fails invariant | Critical | Replace MFA flows, evidence mapping, recovery adapter | Partly |
| Business/staff invitation entitlement | Admin `getUser(firebaseUid)` retrieves verified email/phone | **Architecture leakage** | High | Replace with provider contact-verification adapter / controlled contact proof | No |
| Legacy command actor helper | `userId` and `authUid` both copied from Firebase `uid`; claims copied | **Architecture leakage** | Moderate | Split domain actor ID from provider principal; do not trust provider claims as domain roles | No |
| Functions transport | Firebase callable/Hosting/App Check; raw Firebase token in payload; Admin SDK | Healthy infrastructure coupling | High | Token transport/verifier changes; callable can remain only with a safe external-token contract | Partly |
| Function authorization | Domain services resolve identity/roles after verification; no custom claims authority found | Controlled dependency seam | Moderate | Replace verifier and principal mapping; retain domain authorization | Yes |
| Firestore Rules | Firebase platform Rules, but all data paths deny client access; no `request.auth` dependence | Healthy platform coupling | Low | No authentication-rule redesign required for current posture | Yes |
| Storage Rules | Firebase platform Rules, deny-all | Healthy platform coupling | Low | No authentication-rule redesign required for current posture | Yes |
| Web authentication | Firebase Auth SDK, Google/email/phone flows, auth state, sign-out, TOTP enrollment/challenge | Healthy boundary coupling | Critical | New SDK/Universal Login or equivalent UX; localization/regression rewrite | Partly |
| Callable client/API | `httpsCallable`, raw token payload, Firebase Functions endpoint | Healthy platform coupling | Moderate | Bridge external JWT safely; evaluate callable vs HTTPS boundary | Partly |
| CSP/Hosting | Firebase Auth/Identity Toolkit/Secure Token endpoints and Firebase hosting/function URLs | Healthy infrastructure coupling | Moderate | CSP/configuration change; Hosting need not move | Yes |
| Tests | Auth Emulator, Admin emulator users, Firebase token fixtures, Firebase SDK mocks | Healthy test-platform coupling | High | Replace/extend with IdP test tenant or deterministic JWT contract; retain Firestore emulator tests | Partly |
| CI/local development | Firebase CLI and Auth/Functions/Firestore/Storage emulators; zero-secret CI | Healthy infrastructure coupling | High | New IdP test configuration/secret strategy; Firebase emulator remains for data services | Partly |
| Operations/audit | Firebase Admin user lookup, service account, Firebase console, platform audit in Firestore | Mixed: audit is domain-owned; provider user ops are coupling | High | M2M credentials, IdP logs/support tooling and incident runbooks | Partly |

### 6.1 Required migration categories

| Impact required by a change | Repository evidence |
| --- | --- |
| Disappears with an adapter change | Pure authentication models/ports, session context shape, identity/business domain logic, Firestore data ownership, domain permission evaluators. |
| Authentication-domain modification | Firebase verifier, provider registry/claim mapping, account linking, session evidence mapping, MFA recovery adapter. |
| Security-Rule redesign | **None for current deny-all Rules.** A future direct-client Rules feature must be separately designed against the eventually selected provider (after validation), not assumed here. |
| Functions authorization change | Verifier wiring, raw-token protocol or transport, principal-to-durable-identity mapping, Firebase UID actor leakage. |
| Web UX change | All client sign-in/sign-out/auth-state/method-linking/password/reset/phone and TOTP UX; EN/FR parity retained. |
| Test/emulator change | Firebase Auth emulator suites/mocks and CI need an IdP testing strategy; Firestore/Storage/Functions emulator suites remain. |
| CI/CD and local change | Firebase CLI stays for app services, but IdP tenant settings, M2M secret management and deterministic JWT/test setup are added. |
| Data migration | Authentication reference provider subject mappings; Platform Administrator keys; invitation-contact proof references; no evidence that business/loyalty primary records need remapping. |
| Durable continuity threat | Highest at auth-reference and Platform Administrator keys. Customer IDs and business domain IDs are preserved if the migration is designed around a domain-owned mapping. |

## 7. Operational and deployment findings

`firebase.json` couples Hosting CSP to Identity Toolkit/Secure Token, Functions, App Check, Firestore/Storage Rules and the full Emulator Suite. It does **not** prove that Firestore, Storage, Hosting or Functions must move if authentication changes. The critical existing safety fact is the deny-all Rules posture and server-governed data access.

The present Firebase Auth emulator is valuable but incomplete: repository authority already correctly records that it cannot prove a TOTP challenge/recovery contract. An external IdP increases test and secret-management burden, particularly because a provider test tenant cannot be treated as a zero-secret emulator. The future architecture must retain pure-domain tests, issue deterministic signed-JWT fixtures at the adapter boundary, use a segregated non-production IdP tenant for contract tests, and preserve Firebase emulators for application/data integration.

## 8. Stage 3 — Provider qualification

Qualification started only after the requirements and blast radius above.

Classification used: **QUALIFIED** (documentation proves the hard invariants) · **ELIMINATED** (fails a hard invariant for a stated exact reason) · **VALIDATION REQUIRED** (hard invariant remains unproven; must not be treated as selected).

| Candidate / class | Qualification result | Reason |
| --- | --- | --- |
| Firebase Authentication / Google Identity Platform retained | **ELIMINATED** | Incumbent remains assessed, but the provider-feasibility record establishes no service-account, exact-factor conditional TOTP removal. Whole-list MFA update can erase F2; client/v2 withdrawal requires the locked-out user's session. Hard R5/R7 failure. |
| Amazon Cognito | **ELIMINATED** | Reassessed against its actual TOTP administrative API (see §8A). `AdminDeleteSoftwareToken` is explicitly documented for administrator-assisted lost-TOTP recovery, but it takes only `Username` + `UserPoolId`, exposes no immutable enrollment identifier, addresses the user's *current* software token rather than an enrollment ID, and Cognito permits only one TOTP software token (a verified replacement displaces the existing token). A stale recovery authorization can therefore delete a replacement F2, with no documented provider-side concurrency/precondition guard. `AdminUserGlobalSignOut` narrows the race but does not prove R5/R7 (see §8A). Eliminated for the exact-factor/replacement-factor reason, not for `AdminSetUserMFAPreference` alone. |
| WorkOS MFA composable API | **ELIMINATED** | It can delete a named factor, but its MFA documentation positions it as a composable MFA API rather than a complete replacement customer IdP, and SMS MFA is documented as US-only. It does not qualify for authorized Burundi/Rwanda optional phone and would add an unnecessary primary-identity composition. |
| Self-hosted Keycloak | **ELIMINATED** | Not a managed-IdP candidate for this pre-pilot decision. It adds security patching, availability, database, mail/SMS and identity-operation responsibility with no approved operational staffing/cost envelope. This is an assessment inference, not a claim that Keycloak lacks every technical capability. |
| Okta Customer Identity | **ELIMINATED (commercial)** | Official APIs support factor-addressed deletion and clearing user sessions/tokens. Published Customer Identity base pricing starts at $3,000/month and MFA is in a B2C suite with inquiry pricing; no pilot budget authority supports that commitment. Not carried forward to validation. |
| Auth0 Customer Identity | **VALIDATION REQUIRED (leading candidate — NOT SELECTED)** | Official Management API documents a named Guardian enrollment delete (`DELETE /api/v2/guardian/enrollments/{id}` → `204`), M2M management administration, signed-token MFA evidence and user-session management. However, session deletion, refresh-token revocation and bulk revocation all return `202 Accepted`, run asynchronously and are eventually consistent; session deletion does not necessarily revoke refresh tokens (separate Enterprise-only operations); and already-issued JWT access tokens cannot be revoked. No documented fail-closed confirmation point before F1 deletion has been proven (see §§8B–8C). Must not be called the selected target until V1–V5 hard-invariant validation completes. |

No provider is classified QUALIFIED. Firebase may remain ELIMINATED under current R5/R7.

### 8A. Cognito correction — `AdminDeleteSoftwareToken` exact-factor analysis (CORR-001)

The pre-correction assessment eliminated Cognito on `AdminSetUserMFAPreference` (MFA-type preference, documented as not resetting an existing TOTP). That was incomplete: it did not assess the administrator-assisted lost-TOTP recovery operation. The corrected analysis, against current official AWS documentation, is:

- `AdminDeleteSoftwareToken` deletes "a user's registered time-based one-time password (TOTP) multi-factor authentication (MFA) factor, also known as a software token", removes "the user's software token registration and any preference for TOTP MFA", and is explicitly prescribed — "Use this operation when a user loses access to their TOTP-generating device, for example, a lost or reset phone, and needs to register a new one." After deletion the user "can register a new TOTP factor with `AssociateSoftwareToken`". It returns `ResourceNotFoundException` when the user has no software token registration to delete. (A matching administrator capability was announced 2026-08-26 as removing the need to recreate accounts for locked-out users.)
- Request parameters are only `Username` + `UserPoolId`. **No immutable TOTP enrollment identifier is exposed to administration** (contrast Auth0's `dev_…` enrollment IDs and Firebase's read-only enrollment IDs). The operation therefore **targets the user's current software token, not an enrollment ID**.
- Cognito **permits only one TOTP software token per user**: "Amazon Cognito disassociates the existing software token when your user verifies a new token in a `VerifySoftwareToken` request." `AssociateSoftwareToken` begins setup (access token with `aws.cognito.signin.user.admin` scope, or a challenge-session string) and `VerifySoftwareToken` marks it verified. A replacement token that is associated/verified displaces the prior token server-side.
- Applied to the 11thONUS invariant (recovery authorized for original factor F1 → replacement F2 may appear → old authorization must never remove F2): a stale recovery authorization that calls `AdminDeleteSoftwareToken` after F2 has been enrolled **deletes the replacement token F2**, because the call cannot name F1. **No provider-side concurrency/precondition mechanism** (no enrollment ID, ETag, version, or compare-and-swap guard) is documented for this operation to prevent that.
- `AdminUserGlobalSignOut` (IAM-authorized, synchronous HTTP 200) invalidates "the identity, access, and refresh tokens that Amazon Cognito issued to a user": token-authorized user-pool API operations authorized with a signed-out user's access token (`aws.cognito.signin.user.admin` scope) are rejected (`Access Token has been revoked`), signed-out refresh tokens are rejected in refresh requests, and signed-out ID tokens are rejected at `GetId` with `ServerSideTokenCheck`. It therefore narrows the self-service enrollment window (which requires an access token or challenge session). But the documentation also states **"Other requests might be valid until your user's token expires"** and that the operation **doesn't clear the managed-login session cookie** (the browser session must additionally be directed to the logout endpoint). No session-inventory/readback API establishing a confirmed "no active sessions, no new enrollment possible" point is documented. Session revocation therefore **does not create a sufficiently controlled mutation boundary** to cure the missing exact-factor addressability: the delete remains unaddressed, and no fail-closed confirmation point before F1 removal is proven.
- Capability context (assessed only as needed, not as qualification grounds): Cognito user pools support Google/Facebook/Amazon/Apple social sign-in via managed login, username/password and SRP flows, SMS/email-message MFA via linked SNS/SES resources (own delivery costs and sandbox/production requirements), email verification/password-reset flows, and server-side JWT verification against the pool JWKS (`RS256`, `iss`/`aud`/`client_id`/`exp`/`token_use` checks; `aws-jwt-verify` recommended). These satisfy product-shape expectations but are immaterial given the hard-invariant failure.

**Conclusion:** Cognito still fails R7, and is **ELIMINATED for the correct exact-factor/replacement-factor reason**: unaddressed single-token delete with no enrollment identifier or precondition, so a stale recovery authorization can remove F2; session revocation narrows but does not close the race and provides no documented fail-closed confirmation point. No Cognito-specific validation gate is carried forward.

### 8B. Auth0 correction — session/refresh-token revocation and confirmation semantics (CORR-001)

The exact-factor finding is preserved: `DELETE /api/v2/guardian/enrollments/{id}` removes "a specific multi-factor authentication (MFA) enrollment", addressed by enrollment ID, returning `204 Enrollment successfully deleted` (with a `GET` by ID readback for enrollment details). This is strong evidence for exact-factor addressability and is retained.

The session/revocation analysis is corrected. Current official Auth0 documentation states:

- Session Management API endpoints (`DELETE /api/v2/sessions/{id}`, `DELETE /api/v2/users/{userId}/sessions`, `POST /api/v2/sessions/{id}/revoke`, `POST /api/v2/users/{id}/revoke-access`) are **Enterprise-plan-only** and **all return `202` ("Session deletion request accepted")**.
- **"Delete session operations run asynchronously, and are eventually consistent."** The same eventual-consistency caveat is documented for refresh-token revocation (`DELETE`) operations.
- **"Refresh tokens can remain active after a session has expired or been deleted, or after the user logs out."** Session deletion must therefore be paired with refresh-token revocation: the Management API refresh-token endpoints (view/revoke by ID, list/revoke-all for a user, bulk revoke by ID list / user / user+client / user+client+audience) are likewise **Enterprise-only**, and `POST /sessions/{id}/revoke` / `POST /users/{id}/revoke-access` revoke associated refresh tokens only when not preserved (`preserve_refresh_tokens: false`).

Assessed against fixed R5 (target authentication sessions must be revoked and revocation success confirmed before factor reset), what must be revoked in the proposed 11thONUS/Auth0 architecture is therefore **all five layers**: (1) Auth0 SSO/browser sessions, (2) refresh tokens (separate operation — never assumed revoked by session deletion), (3) already-issued API access tokens (see §8C — not revocable provider-side), (4) ID tokens if relied upon as session evidence (same non-revocation property), and (5) any 11thONUS server/application session state.

**`202 request accepted` must not be equated with `revocation confirmed`.** No documented synchronous fail-closed confirmation point has been found: the readback paths (`GET /api/v2/users/{userId}/sessions`, `GET` refresh tokens for a user) observe an eventually consistent store and cannot by themselves prove that revocation has completed before F1 is deleted. Whether polling/quiescence/readback sequencing can constitute a sufficient confirmation contract is exactly what V2 must validate against a prospective Enterprise tenant and contract. Until then, **R5 satisfaction is NOT PROVEN for Auth0**.

### 8C. Token-acceptance architecture — already-issued JWTs (CORR-001)

Architecture B verifies externally issued JWTs at the Functions boundary. Current Auth0 documentation and support statements are explicit: **once issued, an access token cannot be revoked; JWT access tokens are valid until they expire** (bearer, self-contained; Auth0 recommends short lifetimes). Deleting Auth0 sessions and revoking refresh tokens therefore **does not immediately invalidate already-issued signed access tokens**.

Consequences for the candidate architecture:

1. Existing signed access tokens are **not** immediately invalidated by session/refresh-token deletion.
2. An **application-side revocation mechanism is required** if R5's "target sessions are revoked" is to mean the Functions boundary rejects pre-revocation tokens: namely a **domain-owned session/version/revocation cutoff checked during token verification** (e.g. reject tokens whose session/auth-time precedes the recorded revocation point).
3. 11thONUS can maintain such a cutoff as domain-owned state (consistent with controlled provider dependency: provider IDs remain opaque namespaced references; acceptance policy stays 11thONUS authority; the existing `TokenVerifierPort` seam is the natural enforcement point).
4. Such a mechanism is **compatible in principle** with controlled provider dependency and existing security authority, but it is **not proven, designed, or implemented** here.
5. Stating "Auth0 alone satisfies R5" would be false. The cutoff must be stated explicitly as **part of the candidate architecture**, and because it introduces a new revocation-enforcement mechanism at the trust boundary, its design requires **Founder/security authority confirmation in AUTH-ARCH-002** — marked as such, not smuggled in as an approved redesign and not implemented in this task.

### Official provider evidence used

- Firebase / Identity Platform: the repository's dated provider-feasibility assessment plus official [project account update](https://cloud.google.com/identity-platform/docs/reference/rest/v1/projects.accounts/update), [MFA enrollment withdraw](https://cloud.google.com/identity-platform/docs/reference/rest/v2/accounts.mfaEnrollment/withdraw), [Admin MFA management](https://firebase.google.com/docs/auth/admin/manage-mfa-users), and [pricing](https://cloud.google.com/identity-platform/pricing).
- Auth0: [delete a specific Guardian enrollment](https://auth0.com/docs/api/management/v2/guardian/delete-enrollments-by-id), [M2M authentication-method management](https://auth0.com/docs/secure/multi-factor-authentication/manage-mfa-auth0-apis/manage-authentication-methods-with-management-api), [MFA `amr` token evidence](https://auth0.com/docs/secure/multi-factor-authentication/step-up-authentication/configure-step-up-authentication-for-web-apps), [user-session administration](https://auth0.com/docs/manage-users/sessions/manage-user-sessions-with-auth0-management-api), [revoke a session (`POST /sessions/{id}/revoke` → 202)](https://auth0.com/docs/api/management/v2/sessions/revoke-session), [delete a session (`DELETE /sessions/{id}` → 202)](https://auth0.com/docs/api/management/v2/sessions/delete-session), [revoke selected resources from a user (`POST /users/{id}/revoke-access` → 202)](https://auth0.com/docs/api/management/v2/users/user-revoke-access), [bulk refresh-token revocation (`POST /refresh-tokens/revoke` → 202)](https://auth0.com/docs/api/management/v2/refresh-tokens/revoke-refresh-tokens), [refresh-token revocation guidance (Management refresh-token endpoints Enterprise-only; revocation async, eventually consistent)](https://auth0.com/docs/secure/tokens/refresh-tokens/revoke-refresh-tokens), [session-management launch notes (session termination does not revoke refresh tokens; refresh-token revocation async)](https://auth0.com/blog/introducing-session-management-api/), [access-token non-revocability ("Once issued, an access token cannot be revoked")](https://auth0.com/docs/secure/tokens/access-tokens/management-api-access-tokens), [user administration/export/import](https://auth0.com/docs/manage-users/user-accounts/manage-users-using-the-management-api), [bulk import](https://auth0.com/docs/manage-users/user-migration/bulk-user-imports), [passwordless/social/phone capability](https://auth0.com/docs/authenticate/passwordless), and [current pricing](https://auth0.com/pricing?pm=true).
- Cognito: [AdminDeleteSoftwareToken](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_AdminDeleteSoftwareToken.html), [AdminUserGlobalSignOut](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_AdminUserGlobalSignOut.html), [AssociateSoftwareToken](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_AssociateSoftwareToken.html), [VerifySoftwareToken](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_VerifySoftwareToken.html), [TOTP software token MFA](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-mfa-totp.html), [AdminSetUserMFAPreference](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_AdminSetUserMFAPreference.html), [user pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools.html), [social IdP integration](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-social-idp.html), [SMS/email MFA](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-mfa-sms-email-message.html), [JWT verification](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html), and the [2026-08-26 TOTP-reset announcement](https://aws.amazon.com/about-aws/whats-new/2026/08/amazon-cognito-totp-reset/).
- WorkOS: [MFA factor API](https://workos.com/docs/reference/mfa/factor) and [MFA product constraints](https://workos.com/docs/mfa).
- Okta: [MFA/factor guidance](https://developer.okta.com/docs/guides/mfa/-/main/), [factor delete endpoint reference](https://developer.okta.com/okta-sdk-java/3.0.2/apidocs/com/okta/sdk/resource/user/factor/UserFactor.html), [session/token revocation](https://developer.okta.com/docs/guides/revoke-tokens/main/), and [Customer Identity pricing](https://www.okta.com/en-gb/pricing/).

## 9. Stage 4 — Detailed architecture alternatives

| Architecture | Resulting architecture | Security/capability | Complexity / transition | Controlled provider dependency |
| --- | --- | --- | --- | --- |
| **A. Retain Firebase Auth / Identity Platform** | Existing Firebase web SDK, Admin verifier, Auth Emulator and Firebase TOTP. | Fails R5/R7 exact-factor recovery. Cannot be the target while authority stands. | Lowest apparent transition cost; unacceptable hard security gap. | Existing domain seam is partly controlled, but UID/claim leakage remains. |
| **B. External managed IdP + retain Firebase app/data services** **(recommended as architecture direction; provider NOT selected)** | Browser uses external IdP OIDC Authorization Code + PKCE/hosted login or approved SDK; Functions verifies external JWT through a new adapter **plus an explicit domain-owned token-revocation cutoff (candidate-architecture element, authority confirmation required — see §§8C/9.1)**; Firestore/Storage/Hosting/Functions stay. All business/admin authorization remains server/domain-owned. | Auth0's documented named enrollment delete meets the exact-factor API shape; R5 revocation confirmation, refresh-token revocation and already-issued-JWT treatment are **unproven and gated at V2/V4**, not satisfied by provider alone. | High auth/web/test/operations change; low Firestore/Storage/data-platform change. Pre-pilot means no live-user/password migration is evidenced. | Strongest: opaque `issuer+subject` is held only as provider reference; customer/admin/business authority stays 11thONUS-owned. |
| **C. External IdP bridged into Firebase Auth custom tokens** | External identity first, then mint Firebase custom token so client services receive Firebase `request.auth`. | Adds a token-broker and creates two session/token authorities; recovery needs must still be solved at the external provider. | Higher security and incident complexity than B; current deny-all Rules give no benefit that justifies it. | Weakens control through dual identity/session mapping. Not recommended. |

### 9.1 Recommended target architecture (B — direction only; provider validation required)

1. A separately controlled external managed IdP is credential, login, password/email/social/phone capability, TOTP factor and session authority (leading candidate Auth0, VALIDATION REQUIRED — not selected).
2. A new `TokenVerifierPort` adapter validates issuer, audience, signature, expiry, revocation/session contract and derives only `providerKey`, opaque subject, verified authentication time and `amr`-based MFA fact. Because provider-deleted sessions/refresh tokens do not invalidate already-issued JWTs, the candidate architecture explicitly includes a **domain-owned session/version/revocation cutoff checked during token verification** (reject pre-revocation tokens at the Functions boundary). This cutoff is a stated part of the candidate architecture, not an implementation; its design requires Founder/security authority confirmation in AUTH-ARCH-002.
3. A new 11thONUS provider-reference mapping stores the immutable provider namespace plus subject and resolves it to existing `CustomerIdentityId`. It must not use bare subject as a primary domain key.
4. Platform Administrator and permission records are keyed by durable 11thONUS identity/administrator identity, never the IdP subject. Provider MFA evidence is input to authorization, never a provider role/claim authority.
5. Auth0 Management API credentials are held as server secrets with least scopes; recovery reads/acts on the immutable provider factor identifier and writes the existing 11thONUS recovery/audit lifecycle.
6. Firebase remains the application platform. Rules stay deny-all until a later controlled feature requires direct data access. Functions can either accept a validated external bearer token at a hardened HTTPS boundary or retain a callable only after confirming the external-token transport is not confused with Firebase `request.auth`.

### 9.2 MFA recovery comparison

| Requirement | Firebase / Identity Platform | Auth0 Enterprise target |
| --- | --- | --- |
| Exact factor identifier | Reads IDs but admin mutation replaces MFA list. | Guardian enrollment is addressed by enrollment ID (`204` on delete; `GET` by ID readback). Exact-factor shape proven at API level; concurrent-replacement behavior stays in V1. |
| Administrative exact delete | Not documented/supported with a safe conditional operation. | `DELETE /api/v2/guardian/enrollments/{id}` is documented as deleting a specific enrollment. |
| Replacement F2 safety | Unsafe stale write can overwrite F2. | Directly addressing F1 means F2 is not named; validate not-found/idempotency and tenant behavior before implementation (V1). |
| Server-verifiable second factor | Firebase `firebase.sign_in_second_factor` claim. | Auth0 documents `amr` containing `mfa` after successful MFA; adapter must validate signed token and exact token conditions. |
| Revoke before reset | Firebase refresh-token revocation plus verification, but does not fix factor mutation gap. | **NOT PROVEN.** Session/refresh-token/bulk-revocation operations return `202 Accepted`, run asynchronously and are eventually consistent; session deletion does not imply refresh-token revocation; already-issued JWTs remain valid until expiry. R5 confirmation requires V2 plus the §8C domain-side cutoff (authority confirmation required). `202` ≠ confirmed. |
| Provider audit / admin boundary | Firebase service account/console; app audit is Firestore. | Auth0 Management API/M2M and tenant logs; retain 11thONUS as authoritative recovery audit. |

## 10. Comparison by decision dimension

| Dimension | Firebase retained | Auth0 Enterprise / Architecture B | Decision effect |
| --- | --- | --- | --- |
| Hard security requirements | Fails exact-factor administrative recovery. | Exact-factor API shape present; **R5 revocation confirmation, refresh-token revocation completeness and already-issued-JWT treatment unproven (V2/V4)**. Auth0 alone does not satisfy R5. | Firebase disqualified; Auth0 validation-gated, not selected. |
| Domain integrity | Good intended seam, but Firebase UID leaks into record keys and entitlement lookup. | Requires an explicit provider-reference mapping; provides an opportunity to remove leaks. | B preferred. |
| Application complexity | Lowest short-term. | High in web authentication, adapter, MFA and operations; Firestore/Storage largely unaffected. | Transition cost, not a veto. |
| Custom security code | Existing recovery would need unsafe workaround or policy change. | Requires JWT/M2M/recovery adapter but uses factor-addressed provider API. | B is safer if bounded to adapters. |
| Testing/local development | Excellent Firebase emulator, but no TOTP recovery proof. | More test-tenant/contract burden; pure-domain tests and Firebase data emulators remain. | B needs a test strategy gate. |
| Operations | Familiar Firebase console/service account. | New IdP tenant, M2M credential, logs, support and incident runbooks. | B operational programme required. |
| Transition risk | No migration, but leaves hard blocker. | Pre-pilot lowers user/password/data risk; strongest risk is implementation regression and incorrect mapping. | B favored before pilot. |
| Pilot cost | Identity Platform: first 50,000 Tier-1 MAU free; Burundi SMS listed at $0.45 and Rwanda at $0.18 per SMS as of assessment. | Auth0 Free advertises up to 25,000 MAU, Professional is published at $240/month, but the required session management is documented as Enterprise-only and Enterprise pricing requires a quote. | Security rules out A; Founder must approve B commercial commitment. |
| Lock-in | Firebase SDK/token/provider labels and UID leakage. | IdP OIDC and management APIs; controlled if 11thONUS retains domain IDs/roles/audit and keeps provider IDs as namespaced references. | B improves controlled dependency, not provider independence. |

## 11. Cost, market, operations and transition

No authoritative expected pilot MAU, SMS volume, administrator count, or approved IdP budget was found. The assessment therefore does not invent a total-cost figure.

- Firebase's current published pricing is attractive at small scale, but current official pricing lists SMS at **$0.45 Burundi** and **$0.18 Rwanda**, while the hard factor-recovery gap is not purchasable away in the reviewed APIs.
- Auth0's public price page shows Free up to 25,000 MAU and Professional at **$240/month**. The relevant user-session Management API and the refresh-token Management API endpoints are both documented as **Enterprise-only**. The actual target cost is therefore a contractual quote plus SMS/phone, support, logging, secret-management and engineering cost—not $0 or $240 by assumption.
- Okta is technically credible but its published Customer Identity base starts at **$3,000/month**, before the required B2C/MFA suite inquiry price. It is not proportionate without a Founder-approved cost case.
- The pilot is pre-launch: no repository evidence establishes users needing password export/migration. If any test/development users exist, provider reference mapping and reauthentication/password-reset policy must be a controlled migration decision; password hashes and MFA secrets must not be copied by assumption.

## 12. Material uncertainties and bounded validation required (CORR-001 rewrite)

These are hard-requirement validation gates for the leading candidate, not authorization to build a PoC in this task. Auth0 is VALIDATION REQUIRED: V1–V5 must prove the hard invariants before any provider can be selected. (Cognito was eliminated in §8A; no Cognito-specific validation is carried forward.)

| ID | Decision-material question | Bounded validation / provider confirmation | Effect if it fails |
| --- | --- | --- | --- |
| V1 | **Exact-factor semantics.** Can the Auth0 Enterprise tenant list a target's TOTP enrollment, delete exactly Guardian enrollment F1 through M2M (`DELETE /api/v2/guardian/enrollments/{id}` → `204`), read back F1 by ID, and prove a specific F1 deletion (including concurrent-replacement ordering and already-deleted-F1 handling) cannot affect F2? | Non-production tenant contract test with two TOTP enrollments; record IDs, concurrent replacement ordering, HTTP outcomes (`204` vs error), `GET`-by-ID readback and audit logs. No real customer or production tenant. | Re-open provider qualification; do not begin recovery implementation. |
| V2 | **Complete revocation contract.** Does the contracted plan expose session deletion + refresh-token revocation, what is the effect on already-issued JWTs, and what confirmation/fail-closed semantics are available so that revocation success is confirmed before F1 removal? Covers: Auth0 SSO/browser sessions; refresh tokens (separate operation); already-issued access/ID JWTs (non-revocable provider-side); 11thONUS server/application session state; `202 Accepted` vs confirmed; fail-closed ordering before F1 deletion. | Written provider entitlement confirmation plus non-production contract test sequencing session deletion + refresh-token revocation + readback (`GET` sessions / refresh tokens for the user) + the §8C domain-side cutoff check; specify whether asynchronous, eventually consistent completion can be confirmed before deletion, and at what polling/quiescence bound. | Target fails R5 as provider-alone, or needs the domain-side cutoff design (authority confirmation required), a different external IdP, or a Founder decision. Do not proceed to factor deletion on `202` alone. |
| V3 | **Required product methods.** Can the target product meet Google, email/password, verification/reset, optional phone requirements, and EN/FR parity without unauthorized UX change? | Configuration/design proof and non-production end-to-end test matrix using test contacts only: Google, email/password, email verification, password reset/change, optional Burundi/Rwanda phone OTP economics/deliverability, EN/FR experience, account-linking semantics. | Narrow product choice or re-qualify provider. |
| V4 | **Functions/token architecture.** Can a Firebase Functions boundary safely authenticate an external OIDC bearer token while retaining App Check and no direct data access — including the token-revocation/cutoff model (expiry, short lifetimes, domain-owned cutoff check) and the callable-vs-HTTPS transport decision? | Design review plus a non-production end-to-end token-verification contract test; decide callable versus HTTPS boundary before code; specify the cutoff enforcement point, clock-skew bounds and fail-closed behavior on verification/readback failure. | Architecture B transport/cutoff must be redesigned, not bypassed with Firebase custom tokens (Architecture C remains not recommended). |
| V5 | **Commercial/operational.** What are the Enterprise entitlement, pricing/quote, support, region/data-processing terms, and Burundi/Rwanda phone/SMS economics for the pilot? | Supplier commercial/security review; confirm session-management and refresh-token Management API entitlement on the contracted plan; no account purchase in this assessment. | Founder may direct another qualified external provider to validation, but cannot restore Firebase unless security policy changes. |

## 13. Founder decisions required (CORR-001: architecture direction separated from provider selection)

1. **Decision A — architecture direction:** approve or reject **CHANGE** to Architecture B as a class, including the principle that Firebase application/data services remain while Firebase Authentication does not. Approving Direction A does not approve any vendor.
2. **Decision B — provider selection:** **do not approve a final provider now.** No candidate has proven every hard invariant (Auth0 is VALIDATION REQUIRED). If Direction A is accepted, authorize instead a bounded provider-validation programme (AUTH-ARCH-002, see §15) that validates only qualified/near-qualified candidates against rewritten V1–V5.
3. **Migration-program authorization:** if Architecture B is accepted, authorize a separate controlled programme that first removes provider UID leakage, specifies domain/provider-reference mappings, validates V1–V5, and then plans implementation. It must not start from `AUTH-MFA-003D-IMPL-001`.

No new Founder decision is requested to weaken R1–R10, alter `DEC-SEC-005`, permit a recovery workaround, or alter administrator lifecycle. If the evidence is insufficient at validation, the programme returns for Founder disposition rather than selecting a provider by default.

No new Founder decision is requested to weaken R1–R10, alter `DEC-SEC-005`, permit a recovery workaround, or alter administrator lifecycle.

## 14. Effect on `AUTH-MFA-003D-IMPL-001`

`AUTH-MFA-003D-IMPL-001` remains **BLOCKED — DECISION REQUIRED** at its provider-capability gate. It must not be resumed, reinterpreted, or implemented under Firebase.

If the Founder accepts CHANGE, this work package is affected—not silently superseded. A future architecture programme must decide whether it is retired/replaced or explicitly re-baselined against the validated IdP after V1/V2. The approved R1–R10 policy remains fixed and transfers as a security requirement; only the provider adapter/architecture changes.

## 15. Recommended next controlled step

Create an **AUTH-ARCH-002 — External IdP Hard-Invariant Validation** package only after Founder direction. This future package validates only qualified/near-qualified candidates (currently: Auth0 as VALIDATION REQUIRED) against rewritten V1–V5. Its first gate must be V1–V5 and a data/reference migration design including the §8C token-revocation cutoff (design only; Founder/security authority confirmation required before it becomes enforcement). Its scope must exclude production configuration, live users, Firebase service migration, provider cutover, provider account purchase beyond a segregated non-production validation tenant as authorized, and `AUTH-MFA-003D` implementation. It must not migrate authentication, change production config, alter Firebase services, or resume MFA recovery implementation. On successful validation, a separate Founder-approved migration/implementation programme can be designed; if validation fails, provider qualification re-opens.

## 16. Assessment completion record

| Required record | Result |
| --- | --- |
| Exact entry SHA | `b0a039b2af2e4f869c5534ccb8d8705fdece661a` |
| Governing authorities and requirements | Reviewed and catalogued in §§3–4 |
| Repository areas inspected | Authentication/identity/permissions/platform administration, Functions, Rules, Storage Rules, web, tests, CI, Firebase config, Hosting CSP, observability and operational paths |
| Current Firebase findings | Strong application-platform fit and useful auth adapter; hard provider recovery failure; Rules are currently auth-neutral deny-all |
| Architecture leakage | Firebase UID durable reference keying, same-principal linking, Platform Administrator keys, verified-contact lookup and legacy actor UID/claims |
| Provider results | Firebase, Cognito, WorkOS and Keycloak eliminated; Okta commercially eliminated; Auth0 VALIDATION REQUIRED (leading candidate, NOT selected); no provider QUALIFIED |
| Architecture alternatives | A retained Firebase, B external IdP retaining Firebase app/data, C dual-token bridge; B recommended as architecture direction; provider selection explicitly deferred |
| Security/MFA result | Firebase cannot meet fixed exact-factor recovery. Cognito cannot meet exact-factor recovery (unaddressed single-token delete; stale authorization can remove F2). Auth0 has the named-factor primitive (`204` exact delete); R5 revocation confirmation, refresh-token completeness and already-issued-JWT treatment remain unproven — `202` ≠ confirmed; domain-side cutoff required as explicit candidate-architecture element. |
| Correction applied | `AUTH-ARCH-001-CORR-001` (2026-09-08): Cognito reassessed on `AdminDeleteSoftwareToken`/`AdminUserGlobalSignOut`/`AssociateSoftwareToken`; Auth0 corrected on async eventually consistent `202` session/refresh revocation, refresh-token independence/Enterprise scope, and JWT non-revocability; disposition split into architecture-direction CHANGE vs provider NOT YET SELECTED; V1–V5 rewritten with explicit hard requirements; Decision A/B structure; AUTH-ARCH-002 validation programme scoped |
| Cost/operations | Firebase lower public cost but blocked; Auth0 session control requires Enterprise quote; no pilot budget/volume was found |
| Code diff | None — documentation only |
| Dependencies/configuration/live changes | None |
| Tests/validation performed | Static repository/history/configuration/Rules inspection; official current provider-documentation research; `git diff --check` and Markdown link validation recorded with this branch |
| Rollback | Revert the assessment documentation commit; no runtime/data/provider rollback exists because none changed |

**ASSESSMENT CORRECTED — AWAITING FOUNDER ARCHITECTURE-DIRECTION DISPOSITION — PROVIDER VALIDATION REQUIRED**

> Architecture-class disposition: CHANGE is supportable now (external managed IdP boundary + retain Firebase app/data platform). Provider-selection disposition: TARGET PROVIDER NOT YET SELECTED — VALIDATION REQUIRED.
