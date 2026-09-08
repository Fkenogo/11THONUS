# AUTH-ARCH-002 — External IdP Hard-Invariant Validation (Auth0)

> **Status:** **VALIDATION COMPLETE — `VALIDATION INCOMPLETE — SPECIFIC BOUNDED EVIDENCE REQUIRED` (recommendation C)**
> **Classification:** Controlled architecture/provider validation — NO MIGRATION / NO IMPLEMENTATION
> **Date:** 2026-09-08
> **Repository authority assessed:** `origin/main` `ee899032b4734260697c47635aaaa136aadf7cda`
> **Governing authority:** `DEC-AUTH-002` / `FD-AUTH-ARCH-001` (direction CHANGE approved; no provider selected); `DEC-SEC-005` / `FD-MFA-R` R1–R10 (fixed, unchanged); `AUTH-MFA-003D-IMPL-001` (authorisation VALID, execution BLOCKED — unchanged)
> **Authority boundary:** this report validates; it neither selects a provider, alters `DEC-AUTH-002`/`DEC-SEC-005`, authorizes migration/procurement/implementation, creates tenants/accounts, nor resumes `AUTH-MFA-003D-IMPL-001`.

## 1. Entry state and method

| Item | Evidence |
| --- | --- |
| Exact fetched `origin/main` | `ee89903` — 2026-09-08 merge of PR #234 (`AUTH-ARCH-001` closure) |
| `DEC-AUTH-002` | Present on `origin/main`: Decision A APPROVED/CHANGE, provider NOT selected, `AUTH-ARCH-002` as next step |
| `DEC-SEC-005` | Present, R1–R10 fixed; not amended here |
| Final `AUTH-ARCH-001` assessment | `COMPLETE / FOUNDER-DISPOSED`; Auth0 VALIDATION REQUIRED — NOT SELECTED; V1–V5 + §§8A/8B/8C as validation input |
| Current authentication implementation | Inspected read-only: `TokenVerifierPort` contract, `firebaseTokenVerifier.ts`, `AuthenticationReference` model/repository, `accountLinkingService.ts`, callable transport, deny-all Rules, web SDK flows, test suites (detail in §§7–12) |
| `AUTH-MFA-003D-IMPL-001` | Still BLOCKED — DECISION REQUIRED — AUTHENTICATION ARCHITECTURE REASSESSMENT; not resumed |
| Worktree/branch | Isolated `auth-arch-002` worktree, branch `codex/auth-arch-002-validation` from `ee89903`; primary FD-COM-001 worktree untouched |
| Provider evidence | Current official Auth0/AWS documentation research only (fetched 2026-09-08); **no Auth0 tenant, account, M2M credential, or live call** exists or was created in this task |

This is a **kill-or-qualify validation**. It does not assume Auth0 passes. Classification per hard invariant: **PASS** (documentation proves it) · **FAIL** (documentation disproves it) · **VALIDATION REQUIRED** (only a bounded non-production tenant/contract test or quote can prove it).

## 2. V1 — Exact-factor MFA recovery (R7 / AC-09/10/18)

Hard requirement: a recovery approved for F1 must never remove replacement F2.

Current official Auth0 documentation establishes the API shape:

- Guardian enrollments carry stable identifiers (`totp|dev_…`, `sms|dev_…`, etc.); the MFA API lists authenticators with `id`, `authenticator_type` and `active` (unconfirmed enrollments show `active: false` and must be ignored for challenge purposes).
- `GET /api/v2/guardian/enrollments/{id}` returns the enrollment (`id`, `status` pending/confirmed, type metadata) with scope `read:guardian_enrollments` — a synchronous readback path for F1.
- `DELETE /api/v2/guardian/enrollments/{id}` removes "a specific multi-factor authentication (MFA) enrollment" with scope `delete:guardian_enrollments`, returning `204`. The operation names one enrollment ID; it cannot name F2 while deleting F1.
- Multiple enrollments per user are supported (`allow_multiple_enrollments`, enrollment tickets), so an F1-with-F2-present state is representable and testable.
- Re-enrollment after deletion uses enrollment tickets (`POST /api/v2/guardian/enrollments/ticket`, scope `create:guardian_enrollment_tickets`; single-use, 5-day expiry) or Universal Login / MFA API flows.

What documentation alone does **not** prove (hence tenant-gated):

- Delete-F1-with-F2-present end-to-end behavior on a real tenant (F2 untouched, F1 gone, audit emitted).
- Already-absent-F1 behavior (error shape / idempotency — the documented delete responses list 400/401/403 with no stated 404-or-idempotent contract).
- Concurrency/race behavior (two admins, or delete racing enrollment confirmation).
- Exact M2M scope set and least-privilege wiring on the contracted plan.

**V1 result: API shape PASS; behavioral proof VALIDATION REQUIRED.** V1 does not fail on paper — unlike Firebase (whole-list overwrite) and Cognito (unaddressed single-token delete), the addressed delete exists — but R7 demands demonstration, not shape. Bounded test specified in §16.

## 3. V2 — Complete revocation contract (R5)

R5: revocation must be **fail-closed before factor reset proceeds**. The full authentication state is five layers:

1. **Auth0 browser/SSO sessions** — `DELETE /sessions/{id}`, `DELETE /users/{userId}/sessions`, `POST /sessions/{id}/revoke`, `POST /users/{id}/revoke-access`. Enterprise-plan-only; all return `202 Accepted`; async; eventually consistent.
2. **Refresh tokens** — separate Management endpoints (by ID, all-for-user, bulk by user/client/audience), also Enterprise-only and async/eventually consistent. Session deletion does **not** imply refresh-token revocation (`preserve_refresh_tokens` defaults must be verified on the tenant).
3. **Already-issued access JWTs** — not revocable provider-side; cryptographically valid until `exp`.
4. **ID tokens** — same non-revocation property where relied upon.
5. **11thONUS application/session acceptance state** — domain-owned; see §4.

`202 Accepted` is not confirmation. The documentable confirmation path is readback polling (`GET /users/{userId}/sessions`, `GET` refresh tokens for the user, `GET` enrollment by ID) against an eventually consistent store, sequenced before F1 deletion, plus the §4 domain cutoff as the synchronous enforcement point. Whether polling-plus-quiescence constitutes a sufficient fail-closed contract can only be settled against a real Enterprise tenant and contract.

**V2 result: VALIDATION REQUIRED.** No documented synchronous provider-side confirmation point exists; the architecture to satisfy R5 is fully specifiable (§§3–4) but unproven.

## 4. Domain-owned token revocation/cutoff

Candidate architecture (design only — not implemented):

```text
Auth0 JWT → 11thONUS TokenVerifierPort → signature/issuer/audience/expiry
→ 11thONUS-owned revocation/session cutoff → durable identity resolution → domain authorization
```

Assessment:

- **Mechanism:** on recovery approval, record a domain-owned revocation epoch (per-user session version / security epoch with cut-off timestamp) in Firestore alongside the existing recovery lifecycle; the verifier adapter rejects any token whose `iat`/`auth_time` (verified from the signed token) precedes the epoch. Synchronous, fail-closed, provider-independent enforcement at the exact boundary that already exists (`TokenVerifierPort.verify()`).
- **Security properties:** closes the already-issued-JWT gap that the provider cannot close; converts async provider revocation into a synchronous domain verdict; replay of pre-revocation tokens fails closed even while Auth0 converges.
- **Concurrency:** epoch write is a single Firestore transaction with the recovery record; concurrent recovery attempts serialize on the same record (existing AC-09/10/18 ordering applies).
- **Storage:** one small epoch document per recovery target (or a version field on the administrator/customer security record) — negligible.
- **Per-request effect:** one Firestore read per verification (cacheable for short windows with fail-closed on cache failure); consistent with the current per-request `verifyIdToken(..., true)` cost model.
- **Cache behavior:** short-TTL cache keyed by (user, epoch); any doubt → re-read or reject. Exact TTL is AUTH-ARCH-002-follow-on design detail, not decided here.
- **Operational burden:** low — no new infrastructure, no new provider dependency; uses the existing Firestore emulator-tested repository seam.
- **Controlled-dependency compatibility:** fully compatible — provider IDs stay opaque references; acceptance policy stays 11thONUS authority; no Auth0 roles/claims become domain authority.

**New authority required: YES — Founder/security authority must confirm the cutoff as a revocation-enforcement mechanism** (it is a new trust-boundary behavior, even though it lives inside already-approved architecture). Record the requirement; do not treat the cutoff as approved.

## 5. V3 — Required authentication methods

| Requirement | Auth0 support | Class |
| --- | --- | --- |
| Email/password (database connection) | Native (Auth0 database connection; signup/login) | Native |
| Email verification | Native (verification email jobs `POST /jobs/verification-email`, verification tickets) | Native |
| Password reset / change | Native (Authentication API reset flow; Management password-change tickets with `ttl_sec`/expiry; direct `PATCH /users/{id}` set under password policy) | Native |
| Google sign-in | Native social connection | Native |
| Phone/SMS OTP (optional) | Passwordless SMS connection via Twilio or **custom phone provider** (Actions `custom-phone-provider`) — any gateway routable, so Burundi/Rwanda feasibility is a gateway question, not an Auth0-region question; built-in Auth0 SMS capped at 100 lifetime messages (evaluation only) | Native capability, gateway-dependent economics |
| Account linking | Management API (`POST /users/{id}/identities`, server-side `update:users` or user-initiated `update:current_user_identities` with verified secondary JWT); metadata must be merged manually pre-link; verified-email discipline required (§10) | Native, adapter-disciplined |
| Account disablement / removal | Native (`blocked` flag via `PATCH`, `DELETE /users/{id}`) | Native |
| Reauthentication / fresh proof | Native (step-up via `acr_values` + Actions; `maxAge`; refresh does NOT re-prove — §6) | Native |
| TOTP enrollment / challenge | Native (Guardian + Universal Login + MFA API; enrollment tickets) | Native |
| Administrative MFA recovery | Native primitives (per-enrollment delete + tickets + session/refresh revocation APIs) | Native, Enterprise-gated for session/refresh |
| EN/FR parity | Native (Universal Login localized incl. `fr-FR`/`fr-CA`; `ui_locales` + tenant `enabled_locales`; per-prompt custom text via `read:prompts`/`update:prompts`) | Native |

No approved method needs silent replacement. **V3 result: PASS** (phone economics gated at V6).

## 6. V4 — Server-verifiable MFA evidence

- After hosted-login MFA, the ID token carries `amr` containing `mfa` (plus `acr`); backend validation = signature + `iss`/`aud`/`exp` + presence-and-contents check for `mfa`.
- **Freshness semantics (material):** `amr`/`acr` are **omitted on silent-authentication and Refresh-Token renewals** — intentional Auth0 behavior ("MFA did not occur in this particular exchange"). Refreshed tokens therefore prove authentication, not fresh MFA.
- **Access tokens do not carry `amr` by default**; MFA evidence for an API audience requires a custom **namespaced** claim via Action (the bare `amr` key is restricted).
- Consequence for `AuthenticatedCredential.verifiedSecondFactor` (provider-neutral boolean): semantics are preservable and arguably tighten — `true` only when the *current* token proves MFA; absent evidence fails closed; privileged actions use step-up re-authentication (fresh challenge), which matches R9's fresh-challenge requirement better than a sticky enrollment flag.
- Enrollment vs genuine challenge is distinguishable: only a completed MFA challenge injects `amr`; enrollment alone does not.

**V4 result: PASS at documentation level** (adapter contract specifiable now; tenant test to confirm exact claim values and refresh behavior).

## 7. V5 — Functions/API authentication boundary

Current implementation (read-only inspection): callables carry `rawToken` in the payload and re-verify server-side (`verifyIdToken(rawToken, true)`); `request.auth` is **unused for authorization** in auth/identity callables; no App Check enforcement is currently wired (`enforceAppCheck` absent); sole `onRequest` endpoint is an open `ping`.

Determination:

- Firebase callable `request.auth` **cannot remain useful** for Auth0 tokens (Firebase verifies only Firebase-issued tokens). Two viable shapes: (a) retain callables as **dumb bearer transport** (raw Auth0 token in payload, verified in the adapter — least client churn, but keeps Firebase session baggage and callable/CORS quirks); (b) move authenticated endpoints to **ordinary HTTPS handlers** with `Authorization: Bearer` validation against the Auth0 JWKS (`https://{tenant}/.well-known/jwks.json`, RS256, `iss`/`aud`/`exp` checks) — cleaner trust story, explicit CORS allowlist, bearer-header transport (CSRF-low for a non-cookie PWA), versionable routes.
- Recommended direction for the future migration design: **(b) HTTPS handlers**, with callables retained only where Firebase client-SDK ergonomics outweigh the dual-authority confusion. Transport decision is design detail for the migration programme, not this validation.
- Secrets/config: tenant domain, audience/API identifier, JWKS URI, M2M client credentials as server secrets with least scopes; Deploy CLI pattern available for tenant-as-code across dev/staging/prod tenants.
- Local dev/CI/test isolation: deterministic self-signed JWT + mock JWKS fixtures for unit/contract tests at the `TokenVerifierPort` seam (no live tenant per test); one segregated non-production tenant for contract tests only.

**V5 result: PASS** (architecture fully specifiable; no implementation here).

## 8. App Check

App Check (device/app attestation) is orthogonal to user authentication and authorization: it attests *which app instance* calls, never *which user* or *what they may do*. Firebase App Check can continue protecting Functions/API independently of Firebase Authentication — the attestation chain does not depend on the Auth0 token. Current gap noted: no `enforceAppCheck` is wired today, so enabling it is a hardening item for the migration design, not a reason to keep Firebase Auth. App Check must never substitute for user auth. **Result: PASS.**

## 9. Identity mapping

`Auth0 subject → AuthenticationReference(provider = auth0, subject) → CustomerIdentityId`, preserving the existing `{referenceType}:{referenceId}` keying with a new `auth0_*` provider namespace and dual-lookup during transition. Existing Firebase UID leakage (auth-reference keying, Platform Administrator keys, verified-contact lookup, legacy actor helper, same-principal linking gate) is corrected by re-keying to durable 11thONUS identity in the migration design — no data migrated here.

Temptation audit: Auth0 Organizations, roles, and permissions must **not** become durable authority — the B2C customer model needs no Organizations; domain roles/permissions stay in 11thONUS evaluators. Expected answer holds: domain ownership preserved. **Result: PASS.**

## 10. Account linking

Auth0 linking (`POST /users/{id}/identities`, primary/secondary model, unlink creates standalone profile) is compatible **only under adapter discipline**: preserve the current same-principal gate, verified-email requirement (Auth0 sample code itself throws on unverified secondary email), global-uniqueness/conflict fail-closed (`ConflictDetected`, never merge/transfer), and last-reference-protected unlink. Auth0 must not auto-merge identities (it does not by default; suggested-linking UX must be gated by 11thONUS rules). Metadata merge must precede the link call (provider discards secondary metadata). **Result: PASS with adapter discipline** (do not adopt Auth0 linking behavior bare).

## 11. Administrator operations

| Operation | Endpoint / scope |
| --- | --- |
| User lookup/search/export | `GET /users`, `/users-by-email`, export jobs — `read:users` |
| Create (database/passwordless) | `POST /users` — `create:users` |
| Update incl. block, password set | `PATCH /users/{id}` — `update:users` |
| Delete | `DELETE /users/{id}` — `delete:users` |
| Password-reset / verification tickets | Tickets API — `create:user_tickets`; verification-email jobs — `update:users` |
| MFA enrollment listing | `GET /guardian/enrollments/{id}`, `GET /users/{id}/authentication-methods`, `multifactor` array — `read:guardian_enrollments` (+ read:users) |
| Exact-factor deletion | `DELETE /guardian/enrollments/{id}` — `delete:guardian_enrollments`; enrollment tickets — `create:guardian_enrollment_tickets` |
| Sessions / refresh tokens | Session + refresh-token endpoints — `read:sessions`, `delete:sessions`, `read:refresh_tokens`, `delete:refresh_tokens` (Enterprise) |
| Account linking (server) | `POST /users/{id}/identities` — `update:users` |
| Logs/audit | Tenant logs + log streaming (paid tiers) / Enterprise administration |
| Break-glass | M2M application with least scopes + existing 11thONUS independent-approval/audit lifecycle; no standing user session required |

All required operations exist with documentable least scopes. **Result: PASS.**

## 12. Testing and local development

- **Unit/contract (default):** deterministic locally signed JWT fixtures + mocked JWKS at the `TokenVerifierPort` seam; existing Firestore-emulator suites retained for domain logic; Firebase Auth-emulator-coupled tests (~59 emulator files, ~212 unit files in scope) re-pointed to fixtures — sizable but mechanical rewrite, gated to the migration programme.
- **Contract (bounded):** one segregated non-production tenant for V1/V2/MFA-evidence tests only; Deploy CLI tenant-as-code; CI secrets limited to test-tenant M2M credentials.
- **E2E:** Universal Login flows against the test tenant with test contacts only; MFA testability via Guardian test enrollments (no production users).
- No live tenant dependency per test. **Result: PASS (strategy).**

## 13. V6 — Commercial and operational qualification (fresh 2026 pricing, auth0.com)

- Plans: Free $0 ≤25,000 MAU (no MFA, community support); B2C Essentials from $35/mo @500 MAU (Pro MFA); B2C Professional from $240/mo @500 MAU (Enterprise MFA); **Enterprise custom quote** — required for the session-management and refresh-token Management APIs, 99.99% SLA, private deployment. M2M tokens 1k/1k/5k/5k across tiers.
- Tenants: separate tenants per environment encouraged; self-service plans bill per tenant; Enterprise child tenants share the subscription. Deploy CLI supports tenant-as-code promotion.
- Regions (public cloud): US, UK, EU, AU, JP, CA — **no Africa region**; EU is the nearest residency option. Private Cloud (Enterprise) offers 60+ regions.
- Phone/SMS: built-in Auth0 SMS is evaluation-only (100 lifetime); production requires Twilio or a custom gateway via Actions — Burundi/Rwanda delivery and per-message economics are therefore **gateway decisions with unknown pricing in this assessment**.
- **Decision-material unknowns:** exact Enterprise quote for the required session/refresh APIs; SMS gateway economics for Burundi/Rwanda at pilot scale. Both require supplier engagement, not documentation.

**V6 result: pricing PASS as published; procurement-gating unknowns VALIDATION REQUIRED (quote + gateway economics).**

## 14. Security comparison against Firebase

Auth0 resolves the exact Firebase blocker: addressed per-enrollment administrative delete (`204`) replaces whole-list overwrite, and administrator-assisted lost-TOTP recovery has a documented primitive (Guardian delete + enrollment ticket + `MFA_SETUP`-equivalent re-enrollment). No new hard blocker appears at documentation level. The R5 burden shifts form: from "impossible factor mutation" to "asynchronous revocation + non-revocable JWTs", which the §4 domain cutoff + V2 contract are designed to close — pending proof. `AUTH-MFA-003D` R1–R10 transfer unchanged as requirements; only the provider adapter changes.

## 15. Required decision matrix

| Hard invariant | Result | Basis |
| --- | --- | --- |
| R7/AC-09/10/18 exact-factor (F1 never removes F2) | **VALIDATION REQUIRED** | Addressed delete proven in docs; behavioral proof needs tenant test |
| R5 fail-closed revocation before factor reset | **VALIDATION REQUIRED** | 202/async/JWT-non-revocation documented; confirmation contract + cutoff need proof + authority |
| R1–R4/R6/R8–R10 (authorization, lifecycle, expiry, re-enrollment, audit, break-glass) | **PASS** | Primitives + admin APIs documented; domain lifecycle unchanged |
| Customer methods + EN/FR (V3) | **PASS** | All native; phone economics gated at V6 |
| Server-verifiable MFA evidence (V4) | **PASS** | `amr` contract + refresh-freshness semantics documented |
| Functions/API boundary + App Check (V5/§8) | **PASS** | HTTPS+JWKS shape specifiable; App Check independent |
| Identity mapping + linking discipline (§§9–10) | **PASS** | Adapter-disciplined design preserves domain authority |
| Admin operations (§11) | **PASS** | Full endpoint/scope coverage documented |
| Testing strategy (§12) | **PASS** | Fixture-first, bounded tenant use |
| Commercial/operational (V6) | **PASS with VALIDATION REQUIRED unknowns** | Published pricing current; Enterprise quote + SMS economics unknown and decision-material |

No hard invariant is unaddressed. No invariant FAILS on documentation — but two (R7 behavioral proof, R5 confirmation) cannot PASS without the bounded tenant test, so provider selection cannot be recommended.

## 16. Provider recommendation

**C — `VALIDATION INCOMPLETE — SPECIFIC BOUNDED EVIDENCE REQUIRED`**

Auth0 is not qualified merely for being stronger than Firebase; it independently satisfies every statically provable invariant, but R7-behavior and R5-confirmation demand demonstration. The bounded evidence programme (non-production Enterprise-capable test tenant as authorized, no production users/config):

1. V1: list F1/F2 TOTP enrollments → delete F1 by ID (`204`) → read back F1/F2 → prove F2 untouched; already-absent-F1 handling; idempotency determination; concurrent delete-vs-enroll ordering; record scopes, HTTP outcomes, audit logs.
2. V2: session delete + refresh-token revoke sequencing → readback polling → determine the confirmation bound before F1 deletion; verify `preserve_refresh_tokens` behavior; record `202`-to-confirmed latency distribution.
3. V4: confirm `amr` values, refresh omission, and namespaced access-token MFA claim behavior on the tenant.
4. V6: Enterprise quote for the exact required APIs; SMS gateway pricing for Burundi/Rwanda pilot volumes.
5. Authority: Founder/security confirmation of the §4 domain cutoff as revocation enforcement.

If that evidence passes, Auth0 returns as `QUALIFIED — READY FOR FOUNDER PROVIDER SELECTION`. If the tenant disproves exact-factor safety or no fail-closed revocation contract emerges, the result becomes `NOT QUALIFIED — PROVIDER SELECTION REOPENED` without revisiting the approved architecture direction.

## 17. Records and completion

- Files: this assessment (new); documentation-changes-log; implementation-changes record.
- Production/config/provider changes: **NONE**. No tenants/accounts created; no code/config/dependencies altered; `DEC-AUTH-002`/`DEC-SEC-005` untouched; `AUTH-MFA-003D-IMPL-001` still blocked.
- Validation: documentation diff/link checks; `git diff --check`; CI on the PR head; automated-review inspection; no self-merge of the assessment PR (merge only per Founder instruction).

**`VALIDATION INCOMPLETE — SPECIFIC BOUNDED EVIDENCE REQUIRED`**
