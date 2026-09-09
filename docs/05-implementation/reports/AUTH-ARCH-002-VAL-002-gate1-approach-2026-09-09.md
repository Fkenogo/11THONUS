# AUTH-ARCH-002-VAL-002 — Gate 1 Approach (FEF High-Risk Review Gate 1)

> **Status:** **READY FOR FOCUSED FEF HIGH-RISK GATE 1 RE-REVIEW**
> (CORR-002, 2026-09-09: independent-review findings P1-1–P1-4/P2-1–P2-3 corrected; see §21 —
> Gate 1 approval itself is the independent re-reviewer's disposition, not declared here)
> **Classification:** Validation-approach review only — NO SELECTION / NO MIGRATION / NO IMPLEMENTATION / NO LIVE EXECUTION
> **Date:** 2026-09-09
> **Repository:** `https://github.com/Fkenogo/11THONUS.git` (authoritative source of truth)
> **Entry `origin/main`:** `8a918e02216bd01a40040aefa9bf62f463f91d76` (PR #238 merge; expected handoff SHA confirmed current, no drift)
> **Branch:** `docs/auth-arch-002-val-002-gate1` (clean isolated worktree from the entry SHA; primary worktrees untouched)
> **Governing work package:** `AUTH-ARCH-002-VAL-002` — Auth0 Live Hard-Invariant Validation
> (`docs/05-implementation/reports/AUTH-ARCH-002-VAL-002-work-package-2026-09-08.md`),
> status **AUTHORISED — READY FOR CONTROLLED VALIDATION EXECUTION** under `FD-AUTH-ARCH-002-VAL-002`
> (Entry 191).
> **Authority boundary:** this report finalizes the validation *approach*. It creates no tenant, credential,
> user, API call, subscription, term, migration, production state, or provider selection. Gate 1 approval
> itself is a separate independent-review disposition and is not declared here. Gate 2 is not begun.

## 1. Entry-gate re-verification (Gate 1 entry)

| # | Check | Method | Result |
| --- | --- | --- | --- |
| 1 | Remote state fetched | `git fetch origin` in the primary checkout | Fetched 2026-09-09; `origin/main` unchanged |
| 2 | Current `origin/main` recorded | `git rev-parse origin/main` | `8a918e02216bd01a40040aefa9bf62f463f91d76` — matches the expected handoff SHA exactly; no drift |
| 3 | Exact authorised WP exists on `main` | `git show origin/main:<WP path>` | Present; 16 FEF sections intact; status AUTHORISED — READY FOR CONTROLLED VALIDATION EXECUTION |
| 4 | Founder execution authorization exists | Decision/changes logs, Entries 189/190/191 | `FD-AUTH-ARCH-002-VAL-002` recorded 2026-09-08 against reviewed head `2e6e139`; bounded to the WP programme only |
| 5 | R1–R10 unchanged | Decision Register `DEC-SEC-005` (`FD-MFA-R`) | CONFIRMED; no amendment; `DEC-SEC-004`/`FD-MFA-2` unchanged where applicable |
| 6 | Auth0 remains NOT SELECTED | WP + Entries 186/188/189/191 | LEADING CANDIDATE — NOT SELECTED everywhere; recommendation C (`VALIDATION INCOMPLETE — SPECIFIC BOUNDED EVIDENCE REQUIRED`) still governs |
| 7 | No tenant or credentials created | Repo-wide `AUTH0_*`/tenant-domain scan; env key inventory expectation (Firebase keys only) | No tenant, M2M credential, or live Auth0 state anywhere in the repository; only documentation references exist |
| 8 | No migration started | Recent history of `functions/src/domains/authentication/`; WP Out-of-Scope | No migration, Firebase Auth removal, or real-user/administrator movement |
| 9 | Clean isolated worktree | Dedicated worktree + `docs/`-prefixed branch from the entry SHA | Clean; no merge/rebase/cherry-pick state; `git status` empty at entry |
| 10 | FD-COM-001 protected | No contact with any `FD-COM-001` record in this task | Untouched; excluded from the VAL-002 evidence basis per `DEC-DATA-008` precedent |

Related blocked state (context only, unchanged): `AUTH-MFA-003D-IMPL-001` remains
authorisation-VALID (`FD-AUTH-MFA-003D-IMPL-001`) / execution-BLOCKED
(DECISION REQUIRED — AUTHENTICATION ARCHITECTURE REASSESSMENT). This task does not resume it.
`DEC-DATA-008` / `FD-DATA-ARCH-001` (PostgreSQL direction) is acknowledged and unchanged; no persistence
work is scoped here.

**Entry Gate result: PASS — Gate 1 review may proceed.** No `BLOCKED — DECISION REQUIRED` condition met.

## 2. FEF authority

Active framework `Fkenogo/founder-engineering-framework`; applicable controls `FEF-EWPCS-001`
(Engineering Work Package & Closure Standard v1.0, APPROVED — ACTIVE, effective 2026-09-07) with the
official Work Package Template (`FEF-EWPCS-001-TPL-WP-001`) and Completion Report Template, per the WP
source record (`2db8b70`). Gate 1 is the WP §13 first High-Risk Review checkpoint
("before creating security-sensitive provider state beyond minimal tenant setup"). Founder authorization
(`FD-AUTH-ARCH-002-VAL-002`) does not waive Gate 1, Gate 2, or final review. FEF creates no missing
authority and grants none beyond the WP's explicit permission tables.

## 3. Tenant isolation design (finalized approach)

### 3.1 Proposed validation tenant characteristics

Exactly one tenant, created only after Gate 1 independent review clears, and only the minimal setup
needed for Gate 2 contract review may precede broader execution:

- Non-production only; environment classification **validation/test**, never staging or production.
- Dedicated to the 11thONUS `AUTH-ARCH-002` bounded validation; no other workload or experiment shares it.
- No real customers; no real Platform Administrators; no production administrator identities.
- No production data; no production secrets; no production callbacks/redirects (allowlist holds only
  disposable local/test URLs required by the harness).
- No production databases; no production Firebase configuration; no production Auth0 application
  (a separate disposable test application/client is registered inside the validation tenant only).
- No production email/SMS sender identity; verification/reset emails route to disposable test mailboxes only.
- Tenant logs/audit are validation evidence and are sanitized before capture (§11).

### 3.2 Naming, region, ownership, retention

- **Naming convention:** `11thonus-val-<yyyymmdd>-<short-random>` (e.g. `11thonus-val-20260909-a4f2`);
  the human-readable purpose tag is `11THONUS-AUTH-ARCH-002-VAL-002 (non-production validation)`.
  The exact created name and tenant domain are recorded in the execution evidence log.
- **Region selection rationale:** Auth0 public-cloud regions are US, UK, EU, AU, JP, CA — there is
  **no Africa region**. The validation tenant is created in **EU** (nearest residency option to the
  Rwanda/Burundi operating context; also the region the eventual region/data-location evidence in §12
  must confirm). Region choice is operational, not a data-residency approval; residency consequences for
  any future production tenant remain a separate decision.
- **Owner/account boundary:** Founder-controlled Auth0 account/organization; never a personal,
  contractor-personal, or production-billing account. Billing linkage (if any is required for an
  Enterprise-capable trial) is recorded but no paid commitment is entered and no terms are accepted
  without separate Founder approval.
- **Retention/cleanup default:** DELETE the tenant at closure unless the approved cleanup plan
  (§10) plus explicit Founder/operational-plan retention authority keeps it as a standing non-production
  test tenant. Unresolved mandatory cleanup yields
  `VALIDATION INCOMPLETE — BOUNDED EVIDENCE / CLEANUP REQUIRED`, never qualification.
- **Enterprise capability required: YES (conditional).** The session-management and refresh-token
  Management APIs are documented Enterprise-plan-only. If the validation tenant lacks the entitlement,
  the affected evidence (AC-06/AC-07/AC-09/AC-10 and the R5 confirmation bound) is recorded as
  unavailable (`VALIDATION INCOMPLETE`), never silently as failure or as a pass.

## 4. Validation identity design (finalized approach)

### 4.1 Minimum disposable identity set

| ID | Purpose | First factor | MFA state | Isolation rule |
| --- | --- | --- | --- | --- |
| `VAL-U-01` | Ordinary email/password product path (AC-17/AC-18) | Email/password (database connection) | None | Never enrolled with TOTP; never used in factor/revocation tests |
| `VAL-A-01` | MFA-enabled administrator-equivalent (AC-14/AC-15) | Email/password | TOTP enrolled, genuine challenge observed | Never the subject of a destructive factor test |
| `VAL-F-01a` | F1-only baseline (§7 Scenario 1) | Email/password | F1 only, then deleted | Dedicated; destroyed after readback |
| `VAL-F-01b` | F1+F2 exact deletion (§7 Scenario 2) | Email/password | F1, then F1+F2 | Dedicated; never shared with any retry/race variant |
| `VAL-F-01c` | Already-absent F1 retry (§7 Scenario 3) | Email/password | F1 enrolled then deleted, then stale replay | Dedicated; prior end-state recreated fresh, never inherited |
| `VAL-F-01d` | Confirmed-F2 stale retry (§7 Scenario 3 variant) | Email/password | F1+F2, F1 deleted, stale F1 replay against confirmed F2 | Dedicated |
| `VAL-F-01e` | Delete-vs-pending-confirm race (§7 Race A) | Email/password | F1 + confirming F2 | Dedicated; single race use |
| `VAL-F-01f` | Confirm-vs-delete race (§7 Race B) | Email/password | F1 + confirming F2 | Dedicated; single race use |
| `VAL-R-01` | R5 revocation + cutoff-race identity (§§7/9) | Email/password | TOTP enrolled for the scenario | Dedicated; cutoff epoch applies to this identity only |
| `VAL-L-01` (+ secondary `VAL-L-02`) | Account-linking semantics (AC-21) | Email/password primaries | As the linking matrix requires | Dedicated pair; never merged with any other test identity |
| `VAL-G-01` | Google supported-method test (AC-19) | Google test contact | As the matrix requires | Test contact only; never a real personal/business account |
| `VAL-X-pool` | Raw isolated provider experiments (§8) | Email/password | Per-experiment | One disposable identity per experiment; destroyed with the experiment |

### 4.2 Isolation principle

One identity serves one stateful scenario — the six R7 variants (`VAL-F-01a`–`VAL-F-01f`) never share
state, because provider session/enrollment state is security-critical evidence and inheritance across
variants can produce false positives. The only permitted alternative to distinct identities is
independently recreated-and-proven clean state (fresh enrollment IDs differing from every prior run,
empty session/refresh readbacks before dispatch, recorded in evidence); Gate 2 uses distinct identities
by default. Sharing is otherwise permitted only for stateless read-only observations (e.g. JWKS fetch,
plan/entitlement inspection). The revocation/cutoff identity (`VAL-R-01`) and the linking pair are never
shared. No real personal, business, or customer account is used anywhere; all addresses/contacts are
synthetic test contacts created for this validation and destroyed in cleanup. Google may use a dedicated
test account; no real identity is required for any track.

## 5. Google validation semantics (preserved)

- Google is a **supported authentication method to be validated** (approved MVP provider per
  `DEC-AUTH-001` D-A2 as amended; `AUTH-ARCH-002` §16 requires it in the tenant V3 matrix).
- Google is **not mandatory for every 11thONUS user**; AC-17 proves a complete non-Google
  authentication path (email/password) for users who do not have or do not wish to use a Google account.
- Gate 1 defines the Google test (`VAL-G-01` on the tenant with test contacts) solely as proof of
  optional supported-method compatibility.
- If test credentials are unavailable or the tenant test cannot be executed later, the recorded result is
  `VALIDATION INCOMPLETE` (AC-19) — never a pass, never a waiver, and never a conversion of Google into
  a universal user requirement.

### 5.1 Google resource boundary (CORR-001 reassessment, current official Auth0 documentation)

1. The validation tenant ships a usable Google social connection by default: every new tenant has the
   `google-oauth2` connection present, and Auth0 developer keys permit testing a social IdP without
   registering own Google OAuth credentials (testing only, never production). Classification:
   **ALREADY EXISTS BY TENANT DEFAULT**. No Google Cloud project, OAuth client, or new Auth0 connection
   is required for AC-19 — creating any of those is **NOT REQUIRED** and must not be done to widen scope.
2. Enabling the default `google-oauth2` connection for the test application (dashboard toggle) and the
   dashboard-level "Try Connection" check are **CONFIGURATION OF ALREADY-AUTHORIZED RESOURCE**
   (controlled use of the authorized tenant; M-21a, no M2M scope).
3. App-level Google login (Universal Login with `VAL-G-01`) additionally requires a login-capable
   Auth0 application. Official documentation documents application creation as an explicit setup step
   (Dashboard Create Application / `POST /api/v2/clients`) with no guaranteed usable default, and an
   M2M application cannot perform interactive login. Classification: **NEW PROVIDER RESOURCE CREATION
   REQUIRED** (M-21b) — not in the WP permission table, therefore an authority gap (see §20).
4. Developer-keys limitations are recorded as evidence caveats (Auth0 branding on consent, no custom
   domains, degraded SSO/federated-logout/`prompt=none`/redirect-Actions behaviour, and no reliable
   MFA over a dev-keys session). AC-19 therefore proves login compatibility only — never Google+MFA
   combined evidence, which the MFA track covers separately via email/password + TOTP.

Result: the connection-level AC-19 check can proceed under current authority; the app-level AC-19 login
test was **BLOCKED FOR AC-19 — ADDITIONAL PROVIDER RESOURCE AUTHORITY REQUIRED** (M-21b) until amendment.
Authority is now **BOUNDED GRANTED under `FD-AUTH-ARCH-002-VAL-002-AMEND-001`** (A-1, subject to Gate 2
read-only inventory first: reuse a usable default app instead of creating where possible). Blocked is
recorded where authority is absent, never passed, never waived.

### 5.2 Validation application type and OAuth flow (Gate 1 decision — CORR-002)

Gate 2 does not choose SPA versus Regular Web Application. Gate 1 selects **Single-Page Application
(public client, no client secret)** on the following evidence assessment:

| Requirement | SPA verdict |
| --- | --- |
| Universal Login (email/password, Google, MFA enrolment/challenge) | Fully supported; identical ceremony to any confidential client |
| Google login | Supported via the default connection |
| Silent authorization (`prompt=none` hidden iframe) | Documented SPA pattern (`checkSession`/`getTokenSilently` iframe fallback) |
| Refresh-token testing | Supported via Refresh Token Rotation (`offline_access`, `useRefreshTokens`); rotation + reuse-detection observable as revocation evidence |
| Browser/session behavior | Session cookie + SSO/silent flows observable in the test browser |
| Client-secret handling | **Decisive:** no secret exists, so none can leak, persist, or require rotation — minimal secret surface for a disposable harness |

- **OAuth/OIDC flow:** Authorization Code + PKCE (S256) via Universal Login; `offline_access` scope for
  rotation testing; `max_age=0` on selected logins to force provider-native `auth_time` into ID tokens.
- **PKCE:** required (public client; S256 code challenge per authorization request).
- **Refresh behavior:** rotating refresh tokens with automatic reuse-detection observation; absolute +
  idle expiries recorded from tenant/application settings.
- **Secret exposure model:** none — public client holds no secret; M2M secret handling stays confined to
  the phase-scoped Management API client (§6).
- **Callbacks/logout:** disposable origins only — `http://localhost:{port}/callback` for the local harness
  plus one disposable `https://` test origin if the matrix requires it; logout/back-channel URLs from the
  same allowlist. No production callback, domain, or secret. Exact values fixed at Gate 2 and restored at
  cleanup (§15).
- **Why SPA best represents the required evidence:** it exercises every required ceremony (interactive,
  silent, refresh, MFA) with the smallest standing secret material, and matches the 11thONUS
  PWA-style web client shape better than a server-side confidential client would.

A-1 is not created in Gate 1.

## 6. M2M design — phase-scoped least privilege (CORR-002 revision)

No standing aggregate grant. The M2M client never holds the full M-01–M-21d scope set at once. Authority
is issued per phase with short-lived Management API tokens carrying the smallest subset for that phase,
and destructive grants are removed/revoked immediately after the phase closes. Scope reduction between
phases is executed as: request a new token with only the next phase's scopes → verify the new token's
`scope` claim lists exactly that subset → revoke/allow-expiry of the prior token → record both token
scope sets in evidence. Dashboard operations are preferred wherever they remove an M2M scope entirely.

| Phase | Purpose | M2M scopes held (only) | Dashboard-preferred (no M2M scope) |
| --- | --- | --- | --- |
| A — Read-only inventory / setup verification | Inventory tenant state (apps, connections, APIs, Actions, entitlements, signing keys); confirm plan/entitlement; take configuration before-snapshots | `read:users`, `read:guardian_enrollments`, `read:sessions`, `read:refresh_tokens`, `read:logs`, `read:prompts`, `read:clients`, `read:resource_servers`, `read:actions`, `read:connections` | Tenant/entitlement inspection; before-snapshots |
| B — Identity/MFA scenario setup | Create `VAL-*` users; enrollment tickets; enroll F1/F2; genuine-login observations | `create:users`, `read:users`, `create:guardian_enrollment_tickets`, `read:guardian_enrollments`, `create:user_tickets` | A-1/A-2/A-3 creation; connection toggles; callbacks |
| C — Revocation tests | Session/refresh revocation + readback polling + old-context exercise | `read:sessions`, `delete:sessions`, `read:refresh_tokens`, `delete:refresh_tokens` | — |
| D — Destructive exact-factor test | F1 deletion by exact ID + immediate readback only | `delete:guardian_enrollments`, `read:guardian_enrollments` | — |
| E — API/Action contract validation | Read A-2/A-3 configuration; deploy Actions; JWKS rotation observation | `read:resource_servers`, `read:actions`, `update:actions` (+ `create:actions`/`delete:actions` only in the exact creation/removal step) | A-2/A-3 creation/deletion; Action bind/unbind; signing-key rotation |
| F — Cleanup | Delete users/enrollments/apps/APIs/Actions/grants; revoke tokens/sessions; final absent-readbacks | `delete:users`, `delete:guardian_enrollments`, `delete:clients`, `delete:resource_servers`, `delete:actions`, `delete:client_grants`, `delete:sessions`, `delete:refresh_tokens`, `read:logs` | Client deletion; trigger unbinding; settings restoration |

Rules: short-lived tokens (minimum lifetime the tenant supports; never a standing token); after each
phase the prior token is revoked where the API permits and otherwise expires unrenewed — renewal with
the prior scope set is forbidden; no phase inherits destructive scopes it does not need (e.g. Phase C
never holds `delete:guardian_enrollments`; Phase D never holds session/refresh delete); every token's
granted scopes are recorded with every finding that uses it. The per-item ledger (§6.1) fixes the exact
contracts Gate 2 instantiates per phase.

| # | Operation | Endpoint | Scope | Why required | Read / destructive | Execution agent needs it | Cleanup operation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M-01 | Read enrollment by ID (F1/F2 readback) | `GET /api/v2/guardian/enrollments/{id}` | `read:guardian_enrollments` | Immutable F1/F2 identification + before/after readback (AC-01/03) | Read | Yes | None (read-only) |
| M-02 | Delete enrollment by exact ID (F1 only) | `DELETE /api/v2/guardian/enrollments/{id}` | `delete:guardian_enrollments` | Exact-factor track (AC-02); the only destructive factor call | Destructive (→ `204`) | Yes, gated on the §7 barrier | Re-enroll via M-03 where the protocol requires |
| M-03 | Create enrollment ticket (re-enroll F2) | `POST /api/v2/guardian/enrollments/ticket` | `create:guardian_enrollment_tickets` | Establish F2 / re-enroll after deletion | Write, non-destructive | Yes | Delete the resulting enrollment (M-02 on the new ID) |
| M-04 | List user enrollments / auth methods | `GET /api/v2/users/{id}/enrollments`, `GET /api/v2/users/{id}/authentication-methods` | `read:users` (+ M-01 scope family) | F1/F2 inventory before destructive calls | Read | Yes | None |
| M-05 | Introspect session by ID | `GET /api/v2/sessions/{sessionId}` | `read:sessions` | Revocation readback (AC-06/AC-10) | Read | Yes | None |
| M-06 | List user sessions | `GET /api/v2/users/{userId}/sessions` | `read:sessions` | Revocation readback + convergence polling | Read | Yes | None |
| M-07 | Delete session by ID | `DELETE /api/v2/sessions/{sessionId}` | `delete:sessions` | Session revocation sequencing (→ `202`) | Destructive-async | Yes | None (new logins mint new sessions) |
| M-08 | Delete all user sessions | `DELETE /api/v2/users/{userId}/sessions` | `delete:sessions` | Bulk session revocation path | Destructive-async | Conditional (only if M-07 path is insufficient) | None |
| M-09 | Revoke session + associated refresh tokens | `POST /api/v2/sessions/{id}/revoke` | `delete:sessions` + `delete:refresh_tokens` | Combined revoke path (→ `202`) | Destructive-async | Yes | None |
| M-10 | Revoke selected user resources | `POST /api/v2/users/{id}/revoke-access` (GA; body `{session_id?, preserve_refresh_tokens? default false}`) | `delete:sessions` + `delete:refresh_tokens` (exact, per official OpenAPI — no discovery needed) | User-level revoke path (→ `202`) | Destructive-async | Conditional (Phase C) | None |
| M-11 | Inspect refresh tokens | `GET /api/v2/users/{user_id}/refresh-tokens` (200, paginated) and `GET /api/v2/refresh-tokens/{id}` (200 present / 404 absent) | `read:refresh_tokens` | Refresh readback + absence proof (AC-07/AC-10); 404 on the by-ID read is the absence oracle | Read | Yes (Phase C) | None |
| M-12 | Delete refresh token by ID | `DELETE /api/v2/refresh-tokens/{id}` | `delete:refresh_tokens` | Targeted refresh revocation | Destructive-async | Yes | None |
| M-13 | Bulk revoke refresh tokens (conditional path) | `POST /api/v2/refresh-tokens/revoke` (scope `delete:refresh_tokens`, → `202`; bulk by ID list / user / user+client / user+client+audience; no Online Refresh Tokens) | `delete:refresh_tokens` | Bulk path ONLY if Gate 2 confirms GA release + validation entitlement on the tenant; otherwise this path STOPS and Phase C uses the authorized documented alternative (M-12 per-ID deletes). No scope widening to compensate | Destructive-async | Conditional (Phase C, entitlement-gated) | None |
| M-14 | Validation-user lifecycle (create/read) | `POST /api/v2/users`, `GET /api/v2/users[/by-email]` | `create:users`, `read:users` | Create/dispose §4 identities | Write (create), read | Yes | M-17 |
| M-15 | Validation-user update (block/password set) | `PATCH /api/v2/users/{id}` | `update:users` | Disablement + password-set observations | Write | Conditional (only where the matrix requires) | Restore-then-delete via M-17 |
| M-16 | Account linking / unlinking | `POST /api/v2/users/{id}/identities`, `DELETE /api/v2/users/{id}/identities/{provider}/{user_id}` | `update:users` | Linking semantics (AC-21) | Write | Yes, on `VAL-L-*` only | Unlink + delete users |
| M-17 | Delete validation user | `DELETE /api/v2/users/{id}` | `delete:users` | Cleanup of every created identity | Destructive | Yes (cleanup phase) | Readback `GET` must 404/absent |
| M-18 | Password-change / verification tickets + jobs | `POST /api/v2/tickets/password-change`, verification tickets, `POST /api/v2/jobs/verification-email` | `create:user_tickets` (+ `update:users` for jobs) | AC-18 flows | Write, non-destructive | Yes | None (tickets expire) |
| M-19 | Tenant log readback (audit evidence) | Tenant logs endpoints | `read:logs` | Audit-log excerpts per AC (sanitized) | Read | Yes | None |
| M-20 | Prompt text read (EN/FR matrix) | Prompts endpoints | `read:prompts` | AC-20 evidence | Read | Conditional | None |
| M-21a | Enable default connections on the test application (dashboard only) | Dashboard: application Connections tab | None (no M2M scope; human-operator dashboard toggle) | AC-19 + login-matrix prerequisites | Configuration of already-authorized resources | Yes, dashboard-only | Disable on cleanup |
| M-21b | Create login-capable test application (if no usable default app exists) | Dashboard Create Application, or `POST /api/v2/clients` | `create:clients` (+ `read:clients`, `delete:clients` for readback/cleanup) | Interactive Universal Login tests (AC-14/17/18/19/20) — an M2M app cannot perform interactive login | **BOUNDED AUTHORITY GRANTED under `FD-AUTH-ARCH-002-VAL-002-AMEND-001`** (A-1; subject to Gate 2 necessity + read-only inventory first) | Conditional on Gate 2 necessity | `DELETE /api/v2/clients/{id}` + readback |
| M-21c | Register custom validation API (resource server, e.g. `https://api.11thonus.val`) | Dashboard Create API, or `POST /api/v2/resource-servers` | `create:resource_servers` (+ read/delete for readback/cleanup) | JWT access-token evidence path (AC-16) + Functions harness JWT verification (AC-22–AC-25) + cutoff race tokens (AC-11/12) — without a registered API, access tokens are opaque, not JWT | **BOUNDED AUTHORITY GRANTED under `FD-AUTH-ARCH-002-VAL-002-AMEND-001`** (A-2; subject to Gate 2 necessity) | Conditional on Gate 2 necessity | `DELETE /api/v2/resource-servers/{id}` + readback |
| M-21d | Create/deploy Login Flow Action(s) for namespaced claims | Dashboard Create + Deploy Action, or Actions Management API | `create:actions`, `update:actions` (+ read/delete for readback/cleanup) | Emit `https://11thonus.val/*` namespaced session-generation claim (AC-11) and MFA claim (AC-16) — no native token claim carries the generation signal | **BOUNDED AUTHORITY GRANTED under `FD-AUTH-ARCH-002-VAL-002-AMEND-001`** (A-3; at most two, one preferred; subject to Gate 2 necessity) | Conditional on Gate 2 necessity | Delete action versions/action + readback |

Refused by default: any scope not in this matrix; any `update:users` use outside M-15/M-16;
any production-tenant credential; any standing (non-expiring, non-rotated) secret. The M2M client
secret is revoked/disabled and the client deleted at closure (§10).

### 6.1 Per-item API contract ledger (fixed before Gate 2 — CORR-002)

For every item: exact endpoint, exact scope, release/availability, entitlement, purpose, expected
response, readback, cleanup, dashboard-vs-API decision. All Management API contracts below are GA per
current official Auth0 OpenAPI unless noted; session/refresh-token endpoints additionally require
Enterprise entitlement (Gate 2 verifies on the tenant; missing entitlement ⇒ affected evidence
INCOMPLETE, never failure, never widening).

| # | Exact endpoint(s) | Exact scope | Release / entitlement | Expected response | Readback | Cleanup | Dashboard vs API |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M-01 | `GET /api/v2/guardian/enrollments/{id}` | `read:guardian_enrollments` | GA; any plan | 200 enrollment (`id`, `status` pending/confirmed, type) | Same call before/after | None | API (Phase A/B/D) |
| M-02 | `DELETE /api/v2/guardian/enrollments/{id}` | `delete:guardian_enrollments` | GA; any plan | 204; documented errors 400/401/403 (no assumed 404 contract) | M-01 must show absence; user enrollment list must not contain the ID | Re-enroll via M-03 where protocol requires | API (Phase D only) |
| M-03 | `POST /api/v2/guardian/enrollments/ticket` | `create:guardian_enrollment_tickets` | GA; any plan | Ticket (single-use); documented ~5-day expiry | Resulting enrollment via M-01 | Delete enrollment (M-02 on new ID) | API (Phase B) |
| M-04 | `GET /api/v2/users/{id}/enrollments`, `GET /api/v2/users/{id}/authentication-methods` | `read:users` | GA; any plan | Enrollment inventory | Cross-check with M-01 | None | API (Phase A/B/D) |
| M-05 | `GET /api/v2/sessions/{sessionId}` | `read:sessions` | GA; **Enterprise** | 200 session detail / 404 absent | Absence on introspection | None | API (Phase A/C) |
| M-06 | `GET /api/v2/users/{userId}/sessions` | `read:sessions` | GA; **Enterprise** | 200 session list | Empty list = session confirmation | None | API (Phase A/C) |
| M-07 | `DELETE /api/v2/sessions/{sessionId}` | `delete:sessions` | GA; **Enterprise** | 202 accepted (never confirmation) | M-05/M-06 polling to absence | None | API (Phase C) |
| M-08 | `DELETE /api/v2/users/{userId}/sessions` | `delete:sessions` | GA; **Enterprise** | 202 | M-06 polling to empty | None | API (Phase C, only if M-07 path insufficient) |
| M-09 | `POST /api/v2/sessions/{id}/revoke` | `delete:sessions` + `delete:refresh_tokens` | GA; **Enterprise** | 202 | M-05/M-06 + M-11 polling | None | API (Phase C) |
| M-10 | `POST /api/v2/users/{id}/revoke-access` (body `{session_id?, preserve_refresh_tokens? default false}`) | `delete:sessions` + `delete:refresh_tokens` (exact per official OpenAPI) | GA; **Enterprise** | 202 | M-05/M-06 + M-11 polling | None | API (Phase C) |
| M-11 | `GET /api/v2/users/{user_id}/refresh-tokens` (200 paginated); `GET /api/v2/refresh-tokens/{id}` (200 present / 404 absent) | `read:refresh_tokens` | GA; **Enterprise** | 200 list / 200 item / 404 absent | 404 on by-ID read = refresh absence oracle; plus behavioral readback (exchange attempt with revoked token must fail) | None | API (Phase A/C) |
| M-12 | `DELETE /api/v2/refresh-tokens/{id}` | `delete:refresh_tokens` | GA; **Enterprise** | Success; token unusable thereafter | M-11 404 + failed exchange attempt | None | API (Phase C; primary per-token path) |
| M-13 | `POST /api/v2/refresh-tokens/revoke` (bulk by ID list / user / user+client / user+client+audience; no Online Refresh Tokens) | `delete:refresh_tokens` | Endpoint + scope confirmed; **release/entitlement verified at Gate 2** — if unavailable or Early Access without validation entitlement, this path STOPS and Phase C uses M-12 only | 202 if usable | M-11 polling | None | API (Phase C, entitlement-gated) |
| M-14 | `POST /api/v2/users`; `GET /api/v2/users`, `GET /api/v2/users-by-email` | `create:users`, `read:users` | GA; any plan | Created user / user record | GET present | M-17 | API (Phase B/F) |
| M-15 | `PATCH /api/v2/users/{id}` | `update:users` | GA; any plan | Updated user | GET reflects change | Restore-then-delete via M-17 | API (Phase B, conditional) |
| M-16 | `POST /api/v2/users/{id}/identities`; `DELETE /api/v2/users/{id}/identities/{provider}/{user_id}` | `update:users` | GA; any plan | Linked / unlinked identities | Identities array readback | Unlink + delete users | API (Phase B/F, `VAL-L-*` only) |
| M-17 | `DELETE /api/v2/users/{id}` | `delete:users` | GA; any plan | Deleted | GET 404/absent | — (is cleanup) | API (Phase F) |
| M-18 | `POST /api/v2/tickets/password-change`, verification tickets; `POST /api/v2/jobs/verification-email` | `create:user_tickets` (+ `update:users` for jobs) | GA; any plan | Ticket / job accepted | Ticket use / user record | Tickets expire | API (Phase B) |
| M-19 | `GET /api/v2/logs`, `GET /api/v2/logs/{id}` | `read:logs` (+ `read:logs_users` if user-scoped) | GA; any plan | Log entries (rate-limited; retention-bounded) | N/A (evidence source) | None | API (Phase A–F) |
| M-20 | Prompts read endpoints | `read:prompts` | GA; any plan | Prompt text | N/A | None | API (Phase B, observe-only; no text customization) |
| M-21a | Application Connections tab; connection "Try" | None | N/A (tenant defaults) | Toggle state; Try returns profile | Toggle readback | Disable toggles (restore) | **Dashboard only** |
| M-21b | Dashboard Create Application, or `POST /api/v2/clients` | `create:clients` (+ `read:clients`, `delete:clients`) | GA; any plan | Client record | GET client | `DELETE /api/v2/clients/{id}` + readback | **Dashboard preferred**; API only if operationally required |
| M-21c | Dashboard Create API, or `POST /api/v2/resource-servers` | `create:resource_servers` (+ read/delete) | GA; any plan | Resource-server record | GET record | `DELETE /api/v2/resource-servers/{id}` + readback | **Dashboard preferred**; API only if required |
| M-21d | Dashboard Create + Deploy Action, or Actions Management API | `create:actions`, `update:actions` (+ read/delete) | GA; any plan | Deployed action + version | GET action/version; tenant-log deploy event | Unbind trigger, delete versions/action + readback | **Dashboard preferred**; API only if required |

No scope remains "to be discovered during execution": every scope above is fixed from official provider
evidence. If the tenant contradicts any contract, Gate 2 marks the affected test INCOMPLETE until
confirmed — never a widening, never a pass.

## 7. R7 F1/F2 exact-factor validation protocol (finalized approach)

Preconditions for every scenario: the §8 R5 revocation barrier is established for the scenario first;
F1/F2 identifiers are recorded from readback (never assumed); every destructive call is followed by
readback; all IDs are masked in evidence. `DELETE …/enrollments/{id}` returning `204` is an HTTP outcome,
not yet a safety verdict — the verdict comes from readback.

### Scenario 1 — F1 only (AC-01/AC-02 baseline, identity `VAL-F-01a`)

1. On `VAL-F-01a`, enroll TOTP factor F1 (via ticket/Universal Login as Gate 2 specifies).
2. `GET /users/{id}/enrollments` → record immutable F1 enrollment ID (`totp|dev_…` shape expected).
3. `GET /guardian/enrollments/{F1}` → verify `status: confirmed`, type metadata; record.
4. `DELETE /guardian/enrollments/{F1}` → record HTTP outcome + scope used + audit-log excerpt.
5. Readback: `GET {F1}` must show absence (error shape recorded — no assumed 404 contract);
   `GET /users/{id}/enrollments` must not list F1.
6. **Pass:** F1 gone on readback; audit shows exactly one deletion bound to the F1 ID; no other factor
   named or affected. **Fail:** any other enrollment affected, F1 still present, or audit missing/ambiguous.

### Scenario 2 — F1 + F2 replacement safety (AC-03 core, identity `VAL-F-01b`)

1. Establish F1 on fresh `VAL-F-01b`; record F1 ID; confirm via readback.
2. Establish F2 (second TOTP enrollment; requires `allow_multiple_enrollments`/ticket path — Gate 2
   states the exact precondition; if the provider forbids a second TOTP factor, record that as
   blocking evidence for AC-03 rather than simulating it).
3. Record F2 ID; `GET` both enrollments; confirm both `confirmed`.
4. Execute deletion bound to F1 only (`DELETE …/{F1}`); record outcome + audit.
5. Readback: F1 absent; **F2 still present, `confirmed`, and usable** — usability is proven ONLY by a
   genuine TOTP challenge using F2 that succeeds (§7.5). No "closest" substitute may establish R7.
6. **Pass:** F1 absent AND F2 present AND genuine F2 challenge succeeds AND audit binds the deletion to
   F1 alone. **Fail (hard R7):** F2 missing, altered, unusable, or replaced — result is
   `AUTH0 NOT QUALIFIED` unless a separately approved 11thONUS architecture legitimately satisfies R7
   (no averaging, no reinterpretation). **INCOMPLETE (not pass):** a genuine F2 challenge cannot be
   executed — R7 remains INCOMPLETE.

### Scenario 3 — stale retry / already-absent F1 (AC-04/AC-05, identities `VAL-F-01c`/`VAL-F-01d`)

1. On fresh `VAL-F-01c`: enroll F1, delete F1, verify absence (fresh end-state, never inherited).
2. Replay `DELETE …/{old-F1-ID}`; record the exact status code and error shape (whatever the tenant
   returns; no 404 contract is assumed).
3. On fresh `VAL-F-01d`: establish F1+F2, delete F1, then replay the stale F1 delete against confirmed
   F2 and prove no other factor is affected (no aliasing, no positional delete).
4. **Pass:** stale delete affects nothing; idempotency verdict stated with the observed status table.
   **Fail:** any other factor removed, disabled, or altered by the stale call.

### Scenario 4 — genuine overlap races (CORR-002 revision)

A controlled stale sequence (`B enrolls F2 → A deletes F1`) does NOT prove concurrency. Each race below
forces genuine overlap and proves it; if the intended overlap/order cannot be demonstrated, the run is
**VALIDATION INCOMPLETE**, never PASS.

Overlap apparatus (all races): synchronized start barrier across two separate clients/processes (operator
A = deleter, operator B = enroller); controlled client-side delays where possible; per-run correlation
IDs sent with (or logged alongside) each operation; local monotonic timestamps at dispatch and at
observed completion; provider/tenant log timestamps where available; immutable F1/F2 IDs recorded
*before* dispatch; minimum 3 repeated trials per race; poll to stable provider state after every run;
replay the stale F1 deletion after stabilization; verify exact factor state; close every run with the
genuine F2 TOTP challenge (§7.5).

### Race A — F1 delete dispatched while F2 enrollment confirmation is pending (`VAL-F-01e`)

1. B begins F2 enrollment and holds it pre-confirmation; barrier-synchronized, A dispatches
   `DELETE …/{F1}` while confirmation is still pending.
2. Prove dispatch order (A-dispatch timestamp < B-confirm timestamp) and completion order from both
   client timestamps and tenant logs.
3. Poll to stable state; verify F1 absent and F2 (`confirmed` or still confirming) intact; replay stale
   F1 delete; genuine F2 challenge on stabilization (if F2 never reaches `confirmed` through no fault
   of the delete, record INCOMPLETE with cause rather than forcing the challenge).

### Race B — F2 confirmation dispatched while F1 deletion is in flight (`VAL-F-01f`)

1. A dispatches `DELETE …/{F1}`; barrier-synchronized, B dispatches F2 confirmation while the delete
   has not yet observably completed.
2. Prove the overlap window (B-dispatch timestamp < A-completion timestamp); record which operation
   the provider completed first from tenant-log order.
3. Poll to stable state; verify exact factor state; replay stale F1 delete; genuine F2 challenge.

### Race C — stale F1 delete after F2 is confirmed (on `VAL-F-01d` end-state or a dedicated fresh pair)

1. With F2 `confirmed` and F1 already deleted, replay `DELETE …/{old-F1-ID}`.
2. Verify F2 untouched and still genuine-challenge-usable afterwards.

**Pass (all races):** overlap demonstrated with timestamps AND losing/winning order proven AND F2
survives every run with a genuine post-run challenge success, or the provider refuses the stale call
without side effects (refusal + ordering evidence recorded). **Fail (hard R7):** any run removes or
corrupts F2. **INCOMPLETE:** overlap cannot be demonstrated, trial count not met, or F2 usability
cannot be genuinely challenged.

### Scenario 5 — genuine F2 usability proof (§7.5, applies to Scenarios 2–4)

R7 requires more than F2 remaining listed. After the relevant F1 deletion/race scenario, perform a
genuine TOTP challenge using F2 (Universal Login MFA challenge against the surviving enrollment with a
validator-generated code). Required result: F2 remains enrolled AND F2 successfully satisfies an actual
second-factor challenge. If a genuine F2 challenge cannot be executed, R7 remains INCOMPLETE.

Gate 1 performs none of these tests; it fixes the sequences, readbacks, and verdicts above so Gate 2
reviews exact contracts without redesigning the architecture.

## 8. R5 revocation protocol (finalized approach)

Mandatory order for every authoritative recovery-style F1 deletion (no test-identity exemption):

```text
controlled recovery scenario
→ provider session revocation request (M-07/M-08/M-09/M-10 as Gate 2 assigns)
→ refresh-token revocation request (M-12/M-13; verify preserve_refresh_tokens behaviour)
→ determine provider completion via readback polling
→ establish 11thONUS revocation/cutoff barrier where applicable (§9)
→ verify revocation state
→ verify exact F1 binding (re-read current enrollments immediately before the delete)
→ only then remove F1 (M-02)
```

- **Polled provider state:** `GET /users/{id}/sessions` (session list),
  `GET /sessions/{id}` (introspection), refresh-token list/get, `GET /guardian/enrollments/{F1}`
  (factor still bound). `202 Accepted` is never treated as confirmation — it only starts the clock.
- **What counts as confirmation:** sessions list empty (or target session determinably gone on
  introspection — exact shape fixed at Gate 2 from tenant observation), refresh tokens revoked/absent
  on readback, and the issued-JWT/refresh/session layers observed separately per AC-06–AC-08.
- **Eventually consistent:** session deletion, refresh revocation, and bulk paths (all `202`, async).
  Already-issued access/ID JWTs are non-revocable provider-side and remain valid until `exp` — this is
  documented provider behaviour, not a confirmation failure, and is the gap the §9 cutoff must close.
- **Cannot be synchronously proven:** that no in-flight mint (refresh flow racing the revocation window)
  will produce a post-cutoff JWT from a pre-cutoff generation — hence the §9 race test and the
  fail-closed missing-claim rule.
- **Bounded wait/measurement:** poll at a fixed cadence (Gate 2 fixes exact cadence, e.g. every
  5 s up to 5 min, then extended sampling if converging), record the full 202-to-confirmed latency
  distribution per operation, and declare either a convergence bound or non-convergence.
- **Stop rule:** if revocation cannot be confirmed within the bound, or readback is unavailable, the
  scenario stops — F1 is not deleted, and the outcome is recorded (VALIDATION INCOMPLETE on missing
  entitlement/observability; NOT QUALIFIED on a disproven fail-closed contract — never a pass by expiry).

### 8.1 R5 end-to-end confirmation oracle (CORR-002 — the testable fail-closed condition)

F1 deletion is forbidden unless BOTH conditions hold:

- **(P) Provider-side required readback:** session list empty AND session introspection absent for every
  scenario session (M-05/M-06) AND refresh-token list empty AND by-ID refresh read 404 for every
  scenario refresh token (M-11) AND revocation-window polling converged within the declared bound.
- **(A) Application-side acceptance boundary:** the old-context exercise below passes AND the verifier
  rule below holds on every observed token.

**Old-context capture (before cutoff, on `VAL-R-01`):** record the active browser/session context
(session cookie jar + session ID from readback), every refresh token issued for the scenario (token
identifiers + which client/audience), and any other provider authentication context that can mint
(ID-token/refresh pairs observed at login).

**Old-context exercise (after the 11thONUS cutoff/barrier is established), all four attempts mandatory:**

1. Attempt to use the pre-cutoff browser session (silent `prompt=none` + refresh exchange with a
   captured pre-cutoff refresh token) BEFORE provider readback completes.
2. Repeat AFTER session readback indicates absence.
3. Repeat AFTER refresh-token readback/revocation indicates absence.
4. Repeat AFTER the bounded provider convergence period ends.

For each attempt record: what was attempted, provider response (new tokens minted vs error shape), and —
for any token minted — the 11thONUS verifier verdict.

**Verifier rule (applied to every token observed):** let `gen` be the token's session-generation value
per §10 and `cutoff` the 11thONUS epoch. ACCEPT only if `gen` is present, unambiguous, ≥ `cutoff`, AND
the token is cryptographically valid (signature/`iss`/`aud`/`exp`). REJECT (fail closed) if `gen` is
missing or ambiguous, if `gen < cutoff` — even when `token.iat > cutoff` — or if the token mint came
from a pre-cutoff authentication generation. A genuinely fresh post-cutoff primary authentication must
produce distinguishable accepted evidence (`gen ≥ cutoff`, fresh challenge where MFA applies).

**(A) passes** iff attempts 1–4 yield zero accepted tokens minted from the old generation AND the fresh
post-cutoff authentication verifies. **If no trustworthy Auth0 signal can support the `gen` distinction
(§10 tenant-verification fails), Gate 2 classifies this as a potential hard Auth0/R5 failure** — it
does not invent another signal, weaken the oracle, or pass by expiry.

## 9. Separate raw provider experiments (boundary)

Provider behaviour that must be characterized without representing a valid 11thONUS recovery is fenced
as **non-authoritative isolated provider experiments**: disposable `VAL-X-*` identity, single isolated
factor, no session/revocation semantics claimed, no other factor or real identity in scope. Examples:
raw delete response semantics per status code; already-absent enrollment behaviour; token response
structure (`iss`/`sub`/`aud`/`azp`/`exp`/`iat`/`scope` shapes; absence of `auth_time`/`sid` in access
tokens); enrollment-ticket expiry/single-use shape. Such experiments yield provider-semantics evidence
only; they are never represented as R5-compliant recovery, never weaken R5 conclusions, and no R5
qualification is inferred from them. The execution report must label them explicitly and keep their
evidence separate from the §§7–8 tracks.

## 10. Domain-owned cutoff experiment (candidate — validation only, not approval)

**Question:** can 11thONUS establish a synchronous fail-closed revocation boundary for
already-issued/provider-race tokens? The cutoff remains **unapproved candidate architecture** requiring
validation evidence plus separate Founder/security authority; Gate 1 specifies the experiment, not the verdict.

- **Bare JWT `iat` is disproved as sufficient** (VAL-001 §8: a pre-revocation session/refresh can mint a
  JWT after the cutoff with a post-cutoff `iat`). The comparison must use an immutable pre-cutoff
  session-generation signal and fail closed when that signal is absent.

### 10.1 Narrowed candidate generation sources (CORR-002 — explicit testable mechanisms)

Vague option lists are removed. Gate 2 tests exactly these candidates, in order. Documented Auth0 facts
used: post-login Actions run on interactive login AND on refresh-token exchange; the post-login event
exposes `event.authentication.methods` (session-completed methods; first-factor values include `pwd`,
`federated`, `sms`; completed MFA appears as `{name: 'mfa', timestamp}`) and, on refresh flows,
`event.refresh_token` (id, `created_at`, session binding for browser flows, `last_exchanged_at`);
ID tokens carry provider-native `auth_time` when `max_age` (e.g. `max_age=0`) or `prompt=login` is
requested; custom claims must be namespaced; the signed JWT is built after Actions run.

- **G-1a (primary, Action-derived): namespaced generation claim sourced from the provider session.**
  The Action reads the session identifier exposed in the post-login event for the current transaction
  (candidate field: the session object/ID bound to the login; Gate 2 first dumps the sanitized event
  key inventory — key names only, never values — to pin the exact field) and emits it as
  `https://11thonus.val/generation`. Why generation, not mint time: the session identifier is created
  once per interactive authentication and is identical across every token minted within that session,
  changing only on genuinely fresh authentication. Tenant must verify: identical value across initial
  login, silent, and refresh-derived tokens of one session; new value after fresh primary
  authentication; field present in all three flows.
- **G-1b (secondary, Action-derived): generation = earliest `event.authentication.methods[].timestamp`.**
  The Action emits the minimum timestamp across the session-completed methods (the initial primary
  factor time). Why generation: the first entry records when the session's authentication began, not
  when any later token was minted. Tenant must verify: unchanged across silent/refresh exchanges; new
  value on fresh authentication; `mfa`-entry timestamps distinguished from the minimum.
- **G-2 (ID-token path only, provider-native): `auth_time` with `max_age=0` requested.** Tenant verifies
  presence in ID tokens on forced re-authentication and stability semantics across refresh/silent
  (expected: original-authentication time, not mint time). Access tokens cannot use G-2 (no `auth_time`
  natively) — the API path requires G-1a/G-1b.
- **Ruled out:** any Action-minted UUID persisted in user/app metadata or `api.cache`-style custom
  state (relies on forbidden persisted state per §11.1); bare `iat`; any client-supplied value.

**Stability matrix Gate 2 records per candidate** (initial interactive auth / silent `prompt=none` /
refresh-token exchange / session continuation / post-cutoff mint from old context / genuinely fresh
post-cutoff auth): emitted value, changed-or-stable verdict, present-or-absent verdict.
**Absence behavior:** missing generation field in any flow ⇒ claim absent ⇒ verifier REJECTS.
**Ambiguity behavior:** two different values for one session, or a value that changes on refresh ⇒
candidate DISQUALIFIED, verifier REJECTS anything relying on it.
**Verifier comparison rule:** per §8.1 (`gen` present, unambiguous, ≥ `cutoff`, else reject).
**Fail-closed on unavailable event field:** if the required event field is absent in any required flow,
the Action emits nothing for that flow (never a fallback value, never a cached value).
**Uncertainty recorded:** whether `event.session`-family fields are exposed in the interactive (non-
refresh) post-login event, and whether `methods` timestamps freeze at session start or update per
exchange, is NOT established by documentation — Gate 2's key-inventory probe + stability matrix decides.
If no candidate tenant-verifies, Gate 2 classifies a potential **hard Auth0/R5 failure**; no substitute
signal is invented and no authority or guarantee is manufactured.
- **Test race:**
  ```text
  pre-cutoff session/refresh context exists (VAL-R-01)
  → 11thONUS cutoff epoch established for the identity
  → provider mints a token afterwards from the old authentication generation
  → verifier must still reject it
  ```
- **Success criteria (all required):** (a) the tenant demonstrably emits a trustworthy generation signal
  into the validated token type, or the server-side block path is fully specified; (b) the race token is
  rejected; (c) a token from a fresh post-cutoff authentication is accepted; (d) a token missing the
  signal is rejected (fail-closed). Epoch reads on the enforcement path must be strongly consistent —
  no short-TTL caching of the revocation verdict (JWKS caching alone is acceptable).
- **Failure mode:** if Auth0 cannot provide a trustworthy claim for this experiment, that is a potential
  hard blocker to be proven in later execution (NOT QUALIFIED unless a separately approved architecture
  legitimately satisfies R5).

## 11. MFA evidence protocol (finalized approach)

On the tenant, with genuine TOTP enrollments only (enrollment alone never counts as proof), Gate 2/live
execution verifies and records:

1. Genuine TOTP-authenticated login evidence (hosted/Universal Login + MFA challenge completed).
2. `amr` contents post-MFA (expect `mfa` present) with redacted excerpts — never raw tokens.
3. ID-token behaviour (claims carrying MFA evidence) vs access-token behaviour (no `amr` by default;
   namespaced Action claim path where required).
4. Silent-renewal behaviour (expect `amr`/`acr` omitted — MFA did not occur in that exchange).
5. Refresh behaviour (what survives a refresh; what is omitted).
6. Namespaced Action claim emission into access tokens, if the evidence path requires it.
7. Absence-of-evidence handling: missing/ambiguous evidence fails closed (no privileged access).
8. Mapping rule preserved: `verifiedSecondFactor = true` only from cryptographically verified genuine
   second-factor evidence on the current token — never from enrollment state, client flags, persisted
   markers, or refresh-carried staleness. Exact mapping in §11.3; Gate 2 tests it, never designs it.

### 11.1 Namespaced MFA-claim derivation contract (CORR-002 — exact Action rule)

Documented fact constraining the design: the post-login trigger runs on interactive login AND on
refresh-token exchange, and `event.authentication.methods` accumulates session-completed methods — so a
naive "methods contains `mfa` ⇒ satisfied" rule would manufacture stale satisfaction on refreshed
tokens. The Action obeys this exact rule:

**EMIT `https://11thonus.val/mfa = { method, mfa_time }` ONLY IF ALL hold:**

1. The current transaction is an interactive login: `event.refresh_token` is ABSENT (its presence proves
   a refresh-token exchange, which never contains a fresh second-factor challenge).
2. `event.authentication.methods` contains an entry with `name === 'mfa'`.
3. That entry's `timestamp` falls within the current transaction window (freshness: timestamp ≥ the
   transaction start as observed in the event; Gate 2 pins the exact comparison against tenant
   behavior — e.g. transaction/request time available in the event).
4. `method` is drawn from the tenant-observed factor detail for the completed challenge (TOTP path
   expected; Gate 2 pins the allowed value set from observation — values are allowlisted, never
   open-ended).

**FORBIDDEN sources (the Action must never read these for MFA satisfaction):** MFA enrollment state
(`event.user.multifactor` enrollment array and equivalents); `user_metadata`; `app_metadata`;
`client.metadata`; historical session metadata; prior authentication state; `event.stats` or other
history; persisted custom state (`api.cache`-family, metadata round-trips); client flags or request
parameters; refresh-carried values (`event.refresh_token.*` used for anything except proving
refresh-ness); any value written by a previous Action run.

**Consequences:** on silent authorization, refresh-token exchange, and normal token renewal the claim is
ABSENT (post-login either does not run, or runs with `event.refresh_token` present, or runs without a
fresh in-transaction `mfa` entry). If Auth0 does not expose sufficient provider-verified
current-transaction evidence on the tenant, the claim stays absent. Absence ⇒
`verifiedSecondFactor = false`. Ambiguity (multiple `mfa` entries with conflicting timestamps, or
timestamp outside any sane transaction window) ⇒ absent ⇒ `false`.

### 11.2 MFA negative cases (all mandatory at Gate 2; none may yield `verifiedSecondFactor = true`)

1. Enrolled-but-not-challenged user (TOTP enrolled, primary-only login). 2. Client-supplied MFA boolean
   (forged claim/SDK flag). 3. `user_metadata` MFA flag. 4. `app_metadata` MFA flag. 5. Old persisted
   Action value replayed. 6. Refresh-token exchange token carrying a login-time claim value (stale by
   construction — verifier must reject via freshness+generation rule). 7. Silent authorization token.
8. Normal token renewal without fresh challenge. 9. Tampered namespaced claim (re-signed payload with
   altered claim → signature failure). 10. Missing claim. 11. Malformed claim (wrong type/shape/value).

### 11.3 Provider-neutral mapping (candidate mapping Gate 2 proves)

```text
verified Auth0 token (signature/iss/aud/exp valid)
→ validated current-transaction MFA evidence:
  (a) ID token: amr contains 'mfa' (fresh-login issuance; absent on silent/refresh by provider behavior), OR
  (b) access token: namespaced claim present per §11.1 with allowlisted method AND mfa_time fresh
      within the token's own generation AND generation ≥ cutoff (§§8.1/10.1)
→ AuthenticatedCredential.verifiedSecondFactor (boolean, provider-neutral)
```

Auth0-specific claim names (`https://11thonus.val/mfa`, `amr`) never enter durable domain semantics —
the adapter translates them to the boolean and discards them. `verifiedSecondFactor = true` requires the
full chain; any break (bad signature, wrong iss/aud, expired, absent/ambiguous/stale evidence,
generation < cutoff) yields `false`.

## 12. Functions/API validation architecture (finalized approach)

Disposable transport experiment only — no production Functions are implemented or converted.

- **Leading direction:** HTTPS endpoint + `Authorization: Bearer <Auth0 JWT>` + server-side JWKS
  verification (`https://{tenant}/.well-known/jwks.json`, RS256, allowlisted `alg`, `kid` resolution
  with rotation refresh, `iss`/`aud`/`exp` enforcement, `sub` extraction as an opaque external reference).
- **Comparison:** Firebase callable behaviour is referenced only as necessary (current callables carry a
  raw token re-verified server-side; `request.auth` is unused for authorization; no App Check wired).
  The callable-vs-HTTPS transport decision is design detail for a future migration programme, but the
  contract test plus the decision evidence are required here (AC-22–AC-27).
- **Harness matrix (each with pass/fail fixed at Gate 2):** valid token verifies; expired rejected;
  wrong issuer rejected; wrong audience rejected; malformed rejected; tampered payload (bad signature)
  rejected; `alg=none`/non-allowlisted `alg` rejected; MFA-evidence mapping observed (§11.3);
  revocation-cutoff seam enforced (`pre-cutoff-generation` and `missing-generation-signal` rejections;
  post-cutoff acceptance); `AuthenticationReference` mapping holds (provider subject stays an opaque
  external reference — never durable identity/role/permission authority); App Check coexistence validated
  per §12.3 (attestation independent of user auth; never a substitute); JWKS rotation handled per §12.2
  (Cases A/B distinguished — never conflated).

### 12.2 JWKS rotation matrix (CORR-002 — Cases A/B distinguished)

- **Allowed algorithms:** `RS256` only. `none`, `HS256`/`HS384`/`HS512`, and any non-allowlisted `alg`
  are rejected before key lookup.
- **Key expectations:** RSA keys with `use: 'sig'` and stable `kid`s from
  `https://{tenant}/.well-known/jwks.json`.
- **Case A — legitimate newly rotated key: MUST PASS.** Provider publishes the new key in JWKS; token
  uses the new `kid`; verifier's cache initially misses → exactly ONE controlled JWKS refresh occurs →
  key found → signature verifies against the allowlist → token PASSES (assuming all other checks pass).
- **Case B — arbitrary unknown `kid`: MUST FAIL CLOSED.** After the one controlled refresh the key is
  still absent → token REJECTED. No second refresh, no retry storm, no fallback key, and verification
  is never disabled to "recover" from an unknown key.
- **Old-key behavior:** a previously published key still listed in JWKS verifies normally (rotation
  grace); once removed from JWKS, tokens under that `kid` follow Case B after cache refresh.
- **Cache policy:** bounded TTL (Gate 2 fixes the value, order of minutes) + single on-demand refresh on
  unknown `kid` only; refresh failures preserve the last good JWKS set and fail closed on misses.
- **JWKS endpoint outage:** fail closed — no token verifies against a stale-miss; outage is recorded as
  INCOMPLETE for the affected checks, never a bypass.
- **Malformed JWKS / key-use violations** (`use` missing or not `sig`, non-RSA `kty`, malformed `n`/`e`):
  fail closed for tokens requiring those keys; recorded as INCOMPLETE with cause where the provider
  itself serves the malformed set.
- **Mechanics precedent:** the VAL-001 disposable harness (11/11, `/tmp`, uncommitted) proves the
  verification mechanics pattern; the tenant harness proves provider behaviour. Mechanics results are
  never reported as tenant-observed behaviour.

### 12.1 Harness resource boundary (CORR-001 reassessment)

The disposable harness (local code, JWKS fixtures) itself requires no provider resource. The *tokens it
must verify*, however, do:

1. JWT access tokens exist only for a registered custom API (without an audience, Auth0 issues opaque
   access tokens, which cannot be JWKS-verified; Management API audience tokens are M2M-scoped and are
   not user tokens). Registering the validation API is **NEW PROVIDER RESOURCE CREATION REQUIRED**
   (M-21c) — not in the WP permission table, therefore an authority gap (see §20).
2. The namespaced access-token MFA claim (AC-16) and the Action-emitted generation claim (AC-11) each
   require creating and deploying a Login Flow Action — **NEW PROVIDER RESOURCE CREATION REQUIRED**
   (M-21d), likewise a gap. The purely domain-side server-block closing needs no provider object and
   stays authorized; it cannot substitute for the Action-emitted claim evidence.
3. Tenant signing-key rotation for the unknown-`kid` test (rotate-without-revoke only) is
   **CONFIGURATION OF ALREADY-AUTHORIZED RESOURCE** (tenant settings; reversible; no new object).
4. ID-token evidence (audience = test-application client ID) needs no API but does need the M-21b
   test application.

Result: the Functions/API track was **BLOCKED FOR AC-16/AC-22–AC-25 (JWT access-token parts) —
ADDITIONAL PROVIDER RESOURCE AUTHORITY REQUIRED** until amendment. Authority is now **BOUNDED GRANTED
under `FD-AUTH-ARCH-002-VAL-002-AMEND-001`** (A-1 + A-2, plus A-3 for namespaced claims — each subject to
Gate 2 deciding it is actually necessary). ID-token-only observations could proceed under prior authority
but cannot satisfy the track alone. No unauthorized creation is performed to route around any blocker.

## 13. App Check treatment (CORR-002 matrix)

App Check (device/app attestation) is orthogonal to user authentication: it attests *which app instance*
calls, never *which user* or *what they may do*. Firebase App Check can continue protecting
Functions/API independently of Firebase Authentication. Current gap noted for the future migration
design only: no `enforceAppCheck` is wired today.

- **Pinned non-production environment:** existing DEV Firebase project `eleventh-on-us-dev` with its
  already-authorized configuration, or a local/emulated App Check fixture (fixture preferred — zero
  provider contact). No new Firebase/App Check resource is created in this task or Gate 2 without
  separate authority; if conclusive testing requires one, Gate 2 stops for authority. Production
  Firebase configuration is forbidden.
- **Transport:** Auth0 JWT via `Authorization: Bearer <jwt>`; App Check token via `X-Firebase-AppCheck`.
  The harness validates each independently and never lets one substitute for the other.
- **Gate 2 coexistence matrix (each case: Auth0 verdict × App Check verdict × expected harness outcome):**
  1. both valid → Auth0 verified per §§11–12, App Check valid → request evaluated on Auth0 identity;
  2. valid Auth0 / missing App Check → Auth0 identity established, attestation absent (recorded);
  3. missing Auth0 / valid App Check → REJECT (attestation never establishes user identity or MFA);
  4. invalid Auth0 / valid App Check → REJECT;
  5. valid Auth0 / invalid App Check → Auth0 identity established, attestation failed (recorded);
  6. expired App Check → attestation failed; Auth0 evaluated independently;
  7. wrong Firebase project/app in App Check token → attestation failed;
  8. replayed App Check token where meaningful → attestation failed/flagged;
  9. neither valid → REJECT.
- App Check never establishes user identity, authorization, or MFA satisfaction under any case.

## 14. Secret-handling plan (finalized approach)

- **Storage:** tenant/client/M2M secrets live only in secure local handling (environment variables /
  secret store of the execution operator) and the Auth0 dashboard; never in the repository, reports,
  logs, or chat transcripts. No `.env` committed; no repository credential files.
- **Shell/environment access:** secrets passed via environment, never command-line literals persisted to
  history where avoidable; redacted in any captured output; temporary scripts reside in `/tmp`, are never
  committed, and are deleted at closure.
- **Evidence sanitization:** enrollment IDs masked where appropriate; tokens, TOTP seeds/codes, private
  keys, and client secrets never stored — claim *shapes* with sensitive values redacted only.
  No raw TOTP seeds/codes retained beyond the live enrollment ceremony.
- **Scanning:** full-diff secret scan before every push plus a final scan recorded in the completion
  report (scopes: secrets, tokens, seeds, codes, private keys, client credentials).
- **Closure revocation:** validation M2M secret revoked/rotated, client deleted/disabled; validation
  refresh tokens revoked; sessions terminated; temporary keys destroyed. Evidence required per §15.

### 14.1 Operational secret controls (CORR-002 additions — all mandatory at Gate 2/live execution)

- `umask 077` for any shell/process creating secret-bearing files; no `set -x` (or equivalent tracing)
  in any session handling secrets; no secret literals in command arguments (environment/file-descriptor
  passing only).
- Shell-history suppression for the execution session (`HISTFILE` unset/redirected or equivalent; verify
  no secret landed in history afterwards); minimum child-process environment (secrets exported only to
  the exact command needing them, in the narrowest scope).
- Cleanup traps: temporary secret-bearing files removed and environment variables unset on exit,
  error, and signal (trap handlers verified, not assumed).
- Trusted/local-only live provider execution by the authorized operator; no provider-secret execution
  in untrusted PR CI (CI runs documentation checks only — it never receives tenant/M2M/TOTP/App Check
  material).
- Output sanitization before persistence: every captured log/response redacted (masks from the
  evidence plan) before it touches disk, artifact, or report.
- No screenshots, screen recordings, or pastes containing QR codes, TOTP seeds/codes, bearer tokens,
  refresh tokens, client secrets, private keys, or service-account/App Check credentials — violation
  triggers secret rotation plus evidence quarantine.
- Final scans (both recorded): repository secret scan AND evidence/artifact secret scan (reports,
  fixtures, logs, harness output) — clean verdicts required for both.

## 15. Cleanup plan (finalized approach)

| Resource | Action | Classification |
| --- | --- | --- |
| Validation users (`VAL-*`) | `DELETE /users/{id}` + readback proving absence | Mandatory delete |
| TOTP enrollments | `DELETE /guardian/enrollments/{id}` per enrollment | Mandatory delete |
| Sessions | Revoke/terminate where supported (M-07–M-10) | Mandatory revoke (best-effort + readback where API permits) |
| Refresh tokens | Revoke/delete (M-12/M-13) | Mandatory revoke |
| M2M client + secret | Disable/delete client; revoke secret | Mandatory delete + revoke |
| Temporary app/connection | Delete A-1/A-2 objects (authorized creations); default connections are RESTORED, never deleted | Mandatory delete (created) / mandatory restore (defaults) |
| Google validation configuration | Remove test connection config | Mandatory delete (or restore-to-absent) |
| Validation tenant itself | Delete if the approved cleanup plan requires it AND provider/account permissions permit API deletion; otherwise execute the exact documented manual cleanup requirement | Conditional (Founder/operational-plan authority for any retention as a standing test tenant); manual cleanup if API unavailable |

**Evidence required to prove cleanup:** created/removed/retained inventory with retention authorities;
per-resource readback (user `GET` absent, enrollment absent, session/token lists empty, client
absent/disabled); secrets revoked/rotated attestation; manual-cleanup statement where applicable.
Unresolved mandatory cleanup ⇒ `VALIDATION INCOMPLETE — BOUNDED EVIDENCE / CLEANUP REQUIRED`.

### 15.1 Cleanup lifecycle additions (CORR-002 — all mandatory)

- Sanitized before-snapshot of EVERY configuration item modified (Action trigger bindings, connection
  enablement, application callbacks/settings, tenant settings, signing-key state, API grants,
  email/prompt settings touched). Snapshots carry key names + non-secret values only.
- A-3: unbind the Login Flow trigger BEFORE deleting Actions; restore the original trigger bindings
  from the before-snapshot; delete action versions and the action itself where provider semantics
  permit, with absent-readback.
- Restore (not delete): connection enablement states, application callbacks/settings, tenant/signing
  configuration, and default connection settings — defaults are restored to their snapshotted state,
  never deleted.
- Delete the secondary user recreated during unlink tests (`VAL-L-02` and any re-created counterpart).
- Remove A-2 API client grants (`DELETE /api/v2/client-grants/{id}` or dashboard equivalent + readback).
- Revoke all validation refresh tokens and terminate all validation sessions (M-07–M-13 as applicable).
- Issued access/ID JWTs: handled through the tested cutoff/expiry semantics (§§8.1/10.1) — no provider
  deletion exists for already-issued JWTs; record the residual-expiry window per token type.
- Record Auth0 tenant-log retention limits (what evidence ages out and when) and the tenant
  retention/deletion decision with its authority.

## 16. Commercial / vendor evidence plan (evidence only — no purchase, no terms)

Supplier engagement is bounded evidence gathering; a sent request is not complete evidence. Missing
decision-material evidence without an explicit Founder/designated-authority waiver for the specific item
yields `VALIDATION INCOMPLETE — COMMERCIAL EVIDENCE REQUIRED` (no agent waiver).

- **Auth0/provider contact — must request and record (obtained / outstanding with source, never invented):**
  Enterprise price for the exact required APIs at pilot MAU; required API entitlement (which of M-01–M-21
  need Enterprise); environment/tenant entitlement (child-tenant/subscription treatment for
  dev/validation/prod tenants); region/data-residency statement (EU option; no Africa region; private-cloud
  only if relevant); support level and SLA; session/refresh API availability on the contracted plan;
  commercial limitations (M2M token quotas, log retention, rate limits affecting the R5 polling design).
- **SMS/gateway evidence:** phone auth is governed as optional/non-default pilot scope (not a build gate);
  record Burundi pricing and Rwanda pricing at pilot volumes; record gateway/provider assumptions (Twilio
  vs custom Action phone provider; built-in Auth0 SMS is evaluation-only, 100 lifetime messages).
  Unknown economics are recorded outstanding, not assumed.

## 17. Gate 2 artifact definition (what Gate 2 must receive — not executed here)

1. Finalized test cases per AC-01–AC-36 with test-case IDs and the §4 identity each runs against.
2. Exact API operations per test (endpoint, method, scope from §6, in the §8 order).
3. Sanitized request/response expectations (status codes incl. the no-assumed-404 rule; response shapes;
   redaction rules).
4. Pass/fail matrix per criterion, including the hard-gate rules (R7 failure ⇒ NOT QUALIFIED; no averaging).
5. F1/F2 protocol (§7) with exact preconditions (multi-enrollment support, ticket flow, usability proof).
6. Revocation protocol (§8) with exact poll cadence, bounds, and confirmation shapes.
7. Cutoff experiment (§10) with claim/codeexcerpts expectations and race procedure.
8. MFA claim expectations (§11: `amr`, refresh/silent omission, namespaced access-token claim).
9. Functions transport harness design (§12) plus the callable-vs-HTTPS decision evidence format.
10. Cleanup checklist (§15) with per-resource verification readbacks.
11. Evidence-capture template (per-criterion fields: operation names, HTTP statuses, masked IDs, response
    structure, timing observations, readback, redacted claim shapes, test-case IDs/results, cleanup proof).

## 18. Repository changes (this Gate 1 task)

- New documentation-only Gate 1 approach report (this file), including CORR-001 (§5.1, §12.1,
  M-21a–M-21d, §19–§20: provider-resource authority reassessment and AMEND-001 grant) and CORR-002
  (§21: independent-review corrections P1-1–P1-4/P2-1–P2-3 — R5 oracle, phase-scoped M2M, A-1 SPA
  decision, R7 isolation/concurrency/usability, MFA-claim derivation, JWKS/App Check matrices, secret
  and cleanup controls, AC-19 wording).
- Bounded WP wording correction: Required Tests table AC-19 "non-applicability" → VALIDATION
  INCOMPLETE with cause (no authority change).
- Required tracking records: `docs/00-governance/documentation-changes-log.md` (Entries 192–195) and
  `docs/changes/IMPLEMENTATION_CHANGES.md` (Gate 1 + CORR-001 + AMEND-001 + CORR-002 entries, with the
  prior `AUTH-ARCH-002-VAL-WP-001-AUTH-001` authorization record restored).
- Production-code changes: **NONE**. Dependencies/config changes: **NONE**. Auth0 resources created:
  **NONE**. Live Auth0 API calls: **NONE**. `DEC-AUTH-002`, `DEC-SEC-005`/R1–R10, `DEC-DATA-008`,
  `FD-COM-001`, and the `AUTH-MFA-003D-IMPL-001` blocked state are consumed, unmodified.

## 19. Gate 1 completion state (CORR-002: independent-review corrections applied 2026-09-09)

**READY FOR FOCUSED FEF HIGH-RISK GATE 1 RE-REVIEW**

Independent review `AUTH-ARCH-002-VAL-002-GATE-1-REVIEW-001` (GitHub review `5152282071`,
disposition GATE 1 CORRECTION REQUIRED) findings P1-1–P1-4 and P2-1–P2-3 are corrected in §§4–15
per the §21 record; AMEND-001 authority is preserved and unchanged. Gate 1 approval itself is not
declared here; it is the independent re-reviewer's disposition on the exact corrected head. Gate 2 is
not begun. Auth0 is not selected. All validation requirements stand unweakened.

## 20. CORR-001 — provider-resource authority reassessment (2026-09-09)

Prompted by independent review (P1: the M-21 row implied creating Auth0 connections and non-M2M
clients outside the WP permission table, which authorizes only the tenant, validation identities, one
least-privilege M2M app, validation API calls, and the listed deletes — "any provider action not listed
here is NOT authorised"). Gate 1 was reassessed against current official Auth0 documentation without
broadening the WP. Rule applied: *creating* a new provider object needs explicit authority; *using or
configuring* what the authorized tenant (or an authorized creation) already provides does not.

### 20.1 Authorized-resource classification

| Resource | Verdict | Basis |
| --- | --- | --- |
| Validation tenant | Authorized (creation YES) | WP permission table |
| Validation identities (`VAL-*` users) | Authorized (creation YES) | WP permission table |
| Least-privilege M2M application | Authorized (creation YES) | WP permission table |
| Guardian/session/refresh-token/user/ticket/log Management API calls (M-01–M-20) | Authorized | "Perform validation API calls: YES" |
| Default `Username-Password-Authentication` database connection | **ALREADY EXISTS BY TENANT DEFAULT** — use as-is | Tenant default user store; no creation step documented |
| Default `google-oauth2` social connection + Auth0 developer keys (AC-19) | **ALREADY EXISTS BY TENANT DEFAULT** — test without own Google credentials | Every new tenant ships the Google connection; dev keys support testing (non-production only) |
| Enabling default connections per application; dashboard "Try Connection"; callbacks; tenant settings; signing-key rotate-without-revoke; default email provider | **CONFIGURATION OF ALREADY-AUTHORIZED RESOURCE** (M-21a) | Controlled use of the authorized tenant; no new provider object; no M2M scope |
| Login-capable test application (M-21b) | **NEW PROVIDER RESOURCE CREATION REQUIRED** — gap | Creation is a documented setup step; no usable default guaranteed; M2M apps cannot do interactive login |
| Custom validation API / resource server (M-21c) | **NEW PROVIDER RESOURCE CREATION REQUIRED** — gap | JWT access tokens exist only for registered APIs; otherwise opaque |
| Login Flow Action(s) for namespaced claims (M-21d) | **NEW PROVIDER RESOURCE CREATION REQUIRED** — gap | No native claim carries the generation signal; Actions must be created and deployed |
| Google Cloud project / production Google OAuth keys | **NOT REQUIRED** — must not be created | Dev-keys default connection suffices for AC-19 login compatibility |

### 20.2 Bounded authority amendment required (exact)

| # | Resource type | Purpose (AC) | Minimum scope | Creation action | Cleanup action | Why existing authority is insufficient |
| --- | --- | --- | --- | --- | --- | --- |
| A-1 | One login-capable test application (SPA or Regular Web App, e.g. `11thonus-val-harness`) | Interactive Universal Login tests: genuine TOTP sign-in (AC-14), email/password (AC-17), verification/reset (AC-18), Google login (AC-19), EN/FR matrix (AC-20); ID-token audience for AC-16/AC-22 | `create:clients`, `read:clients`, `delete:clients` (or dashboard creation by the authorized operator; M2M holds only read/delete if dashboard creates) | Dashboard Create Application, or `POST /api/v2/clients` | `DELETE /api/v2/clients/{id}` + absent-readback | WP authorizes only M2M-app creation; M2M apps use client-credentials grant and cannot perform interactive login; no usable default app is guaranteed by documentation. Conditional relief: if Gate 2's tenant inventory (read-only) finds a usable default app, use it as configuration-only and A-1 falls away — Gate 1 does not assume it. |
| A-2 | One custom validation API / resource server (e.g. identifier `https://api.11thonus.val`, 24 h default lifetime acceptable) | JWT access-token evidence path (AC-16), Functions harness verification incl. negatives (AC-22–AC-25), cutoff race tokens (AC-11/12) | `create:resource_servers`, `read:resource_servers`, `delete:resource_servers` (`update:resource_servers` only if lifetime tuning is needed) | Dashboard Create API, or `POST /api/v2/resource-servers` | `DELETE /api/v2/resource-servers/{id}` + absent-readback | JWT access tokens are issued only for registered custom APIs; without one, tokens are opaque and the AC-16/AC-22–AC-25 JWT contract cannot be executed at all. Unlisted action under the WP rule. |
| A-3 | At most two Login Flow Actions (namespaced session-generation claim + namespaced MFA claim, e.g. `https://11thonus.val/*`) | Action-emitted generation claim for the cutoff race (AC-11) and namespaced access-token MFA claim (AC-16) | `create:actions`, `update:actions`, `read:actions`, `delete:actions` (deploy + remove) | Dashboard Create + Deploy Action, or Actions Management API equivalents | Delete action versions and the action + absent-readback | No native access-token claim carries the session-generation signal (VAL-001 §§7–8); the claim must be emitted by a created extensibility object. Unlisted action under the WP rule. |

Connection enablement for A-1 stays dashboard-only (no `update:connections`/`update:clients` M2M scope
granted). No production keys, custom domains, email-provider overrides, Organizations, roles, or
standing credentials are requested. All three objects are disposable, validation-tenant-scoped, and
covered by the existing WP delete permission ("Delete temporary applications/connections created for
validation") once their *creation* is authorized.

### 20.3 Blocked tracks (requirements preserved, not weakened)

- AC-19 app-level login: **BLOCKED FOR AC-19** pending A-1 (connection-level "Try" may proceed now).
- AC-16/AC-22–AC-25 JWT access-token parts: **BLOCKED** pending A-1 + A-2 (+ A-3 for namespaced claims).
- AC-11 cutoff race: **BLOCKED** pending A-1 + A-2 + A-3 (server-side block design work, needing no
  provider object, may proceed as documentation-only).
- Everything executable under current authority (F1/F2, revocation, ID-token observations, product
  methods except app-level Google login, commercial evidence) is unaffected by this blocker. No Founder
  decision is broadened by Gate 1 itself; the amendment above is a request, not an authorization.

### 20.4 Amendment grant (AMEND-001, 2026-09-09 — recorded on PR #239)

Founder amendment `FD-AUTH-ARCH-002-VAL-002-AMEND-001` grants items A-1–A-3 exactly as specified in
§20.2 (same resource types, purposes, minimum scopes, creation/cleanup actions), each subject to Gate 2
deciding the resource is actually necessary — including the A-1 read-only tenant-inventory relief
(reuse a usable default app instead of creating where possible) and the A-3 one-preferred/two-max rule.
The authoritative WP permission table now carries this authority; M-21b/c/d above reflect the grant.
Google semantics preserved: supported-method validation only (AC-19), complete non-Google path mandatory
(AC-17), no `DEC-AUTH-001` change; default `google-oauth2` + developer keys only, no Google Cloud
project or production credentials. A-3 is validation-only: no cutoff or Action-claim architecture is
approved, and a failed validation may fail qualification without redesigning the requirement. Cleanup
authority (client/resource-server/Action deletion with absent-readback, secret revocation) is part of the
grant; qualification stays unavailable while mandatory cleanup is unresolved. Gate 1 state: see §19.

## 21. CORR-002 — independent-review correction record (2026-09-09)

Review basis preserved: `AUTH-ARCH-002-VAL-002-GATE-1-REVIEW-001` (GitHub review `5152282071` on PR #239
head `3d276f1`, disposition GATE 1 CORRECTION REQUIRED). This record corrects — it does not delete,
rewrite, or pretend the original approach passed. Settled authority preserved unchanged:
`DEC-AUTH-002`, `FD-AUTH-ARCH-001`, `DEC-SEC-005`/R1–R10, `DEC-DATA-008`, `FD-AUTH-ARCH-002-VAL-002`,
`FD-AUTH-ARCH-002-VAL-002-AMEND-001`; AC-01–AC-36 preserved (one WP wording fix: AC-19
"non-applicability" → VALIDATION INCOMPLETE with cause — governed semantics, no authority change).
Auth0 remains LEADING CANDIDATE — NOT SELECTED; no new Founder decision required or created.

| Finding | Correction (section) |
| --- | --- |
| P1-1 R5 oracle + generation source | §8.1 dual-gate oracle (provider readback AND application boundary) with four-attempt old-context exercise and verifier rule; §10.1 narrowed candidates G-1a (session-ID claim)/G-1b (earliest-methods-timestamp)/G-2 (ID-token `auth_time` with `max_age=0`); tenant key-inventory probe + stability matrix; fail-closed absence/ambiguity; hard-blocker classification if none verifies; minted-persisted generation ruled out |
| P1-2 phase-scoped least privilege | §6 Phases A–F with per-phase scope sets, short-lived tokens, inter-phase reduction protocol, dashboard preference; §6.1 full contract ledger (endpoint/scope/release/entitlement/response/readback/cleanup/dashboard-vs-API); M-10 scope resolved exact from official OpenAPI; M-13 entitlement-gated with M-12 fallback and no widening |
| A-1 type/flow at Gate 1 | §5.2: SPA (public client, no secret) + Authorization Code + PKCE + rotation; silent/secret/callback/logout decisions fixed; not created |
| P1-3 R7 isolation + concurrency + usability | §4: six dedicated identities `VAL-F-01a`–`VAL-F-01f` (clean-recreation alternative defined); §7 Scenario 4 replaced by Races A/B/C with barrier/delays/separate clients/correlation IDs/timestamps/repeats and INCOMPLETE-if-no-overlap rule; §7.5 genuine F2 TOTP challenge required, "closest" wording removed, INCOMPLETE if unexecutable |
| P1-4 MFA-claim derivation | §11.1 exact emit rule (interactive-only via absent `event.refresh_token` + fresh in-transaction `mfa` entry + allowlisted method) with forbidden-source list; §11.2 eleven mandatory negatives; §11.3 provider-neutral mapping for Gate 2 to prove |
| P2-1 JWKS | §12.2 Cases A (pass) / B (fail closed) with RS256-only, RSA/`use:sig`, old-key grace, bounded cache + single refresh, outage/malformed fail-closed, no verification disabling |
| P2-1 App Check | §13 matrix (9 cases, separate transports, `eleventh-on-us-dev`/fixture pin, no new resources, never identity/MFA) |
| P2-2 secrets | §14.1 operational controls (`umask 077`, no `set -x`, no CLI literals, history suppression, minimal env, traps, local-only execution, redaction, screenshot ban incl. App Check/service-account material, dual final scans) |
| P2-2 cleanup | §15.1 lifecycle (trigger unbind + binding restoration, settings restoration, secondary-user deletion, API-grant removal, token/session revocation, JWT residual-expiry record, log/tenant retention records, defaults restored-not-deleted, before-snapshots) |
| P2-3 AC-19 wording | WP Required Tests table corrected; zero "non-applicability" occurrences remain |

Gate 2 readiness: Gate 2 now only writes exact test cases from this fixed design — generation source,
oracle, MFA derivation, app type/flow, privilege schedule, concurrency method, secret and cleanup
controls are all decided above. State: READY FOR FOCUSED FEF HIGH-RISK GATE 1 RE-REVIEW (§19).
