# AUTH-ARCH-002-VAL-002 — Gate 1 Approach (FEF High-Risk Review Gate 1)

> **Status:** **GATE 1 APPROVED — READY FOR FEF HIGH-RISK GATE 2**
> (GATE-1-CLOSE-001, 2026-09-09: independent final review `5154523016` approved Gate 1 on exact head
> `897cad7`; see §24 — Gate 2 defines and independently reviews exact test contracts before any live
> execution; Auth0 remains NOT SELECTED)
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

## 6. M2M design — phase-scoped least privilege (CORR-004: dashboard/operator-only revision)

No standing aggregate grant. Narrower tokens alone are insufficient: the standing client authorization
itself is narrowed at every phase boundary — by the designated operator in the Auth0 Dashboard, never
by the execution agent modifying its own grant. The API-driven client-grant mutation fallback
(M-22–M-24) is RETIRED: `update:client_grants` is highly privileged precisely because it can let an
application grant further permissions to itself, which is unacceptable for this controlled programme.
M-22–M-24 remain below as superseded historical evidence only — not executable validation-agent
operations. No automatic escalation. No standing aggregate grant. No self-modifying client grant.

**Management API grant identity (pinned):** the one standing M2M grant is identified by the triple
`client_id` = exact validation M2M client ID AND `audience` = Auth0 Management API audience for the
validation tenant AND `subject_type = "client"`. Gate 2 verifies all three before each grant mutation;
a grant matching only client ID/audience without the expected subject type is never used.

**Operator-controlled phase transition (every boundary, fixed protocol):**

1. Execution agent stops; records the exact current grant/scopes.
2. Designated operator changes the grant in Auth0 Dashboard (Applications > APIs > Auth0 Management
   API > Machine to Machine Applications > expand validation client) to exactly the next-phase scope
   set; operator confirms completion with the resulting set.
3. Execution agent performs read-only verification where authorized (dashboard readback recorded; token
   scope-claim check needs no grant scope).
4. A new Management API token is obtained AFTER the mutation.
5. Token scope claim must exactly contain the required phase scopes and no prohibited destructive
   scope — mismatch stops the phase.
6. Only then may the phase continue.

**Human/operator checkpoint semantics:** grant reduction is a planned Gate 2 contract checkpoint. At each
boundary the execution agent outputs `PHASE GRANT CHANGE REQUIRED` with current phase, next phase,
scopes to remove, scopes to add, and the expected resulting scope set — then pauses until operator
confirmation is recorded. This is an expected controlled execution checkpoint, not a blocker.

Grant lifecycle per phase (operator mutation → resulting set → token → scope-verify → ops → removal →
post-phase readback) follows the protocol above at every boundary. No phase operation may rely on a
scope outside its phase table.

No additional M2M scopes exist for grant mutation: the operator path needs none, and the retired
API-driven fallback is not available. Grant-object removal at closure is performed by the operator in
the dashboard.

| Phase | Purpose | Exact scope set held | Dashboard/operator (no M2M scope) |
| --- | --- | --- | --- |
| A — Read-only inventory / setup verification | Inventory tenant state; confirm plan/entitlement; before-snapshots; grant-mutation setup | `read:users`, `read:guardian_enrollments`, `read:sessions`, `read:refresh_tokens`, `read:logs`, `read:prompts`, `read:clients`, `read:resource_servers`, `read:actions`, `read:connections` | Tenant/entitlement inspection; before-snapshots; grant narrowing itself |
| B — Identity/MFA scenario setup | Create `VAL-*` users; update/block where matrix requires; enrollment tickets; verification tickets/jobs; enroll F1/F2; linking setup; genuine-login observations | `create:users`, `read:users`, `update:users` (M-15/M-16/M-18-verification-job only — nothing broader), `create:guardian_enrollment_tickets`, `read:guardian_enrollments`, `create:user_tickets` | A-1/A-2/A-3 creation; connection toggles; callbacks |
| C — Revocation tests | Session/refresh revocation + readback polling + old-context exercise | `read:sessions`, `delete:sessions`, `read:refresh_tokens`, `delete:refresh_tokens` | — |
| D — Destructive exact-factor test | F1 deletion by exact ID + immediate readback only | `delete:guardian_enrollments`, `read:guardian_enrollments` | — |
| E — API/Action contract validation | Read A-2/A-3 configuration; deploy Actions; JWKS rotation observation | `read:resource_servers`, `read:actions`, `update:actions` (+ `create:actions`/`delete:actions` only in the exact creation/removal step) | A-2/A-3 creation/deletion; Action bind/unbind; signing-key rotation |
| F1 — Cleanup identities/factors | Unlink (M-16), delete users (M-17), delete enrollments | `update:users` (unlink only), `delete:users`, `read:users`, `delete:guardian_enrollments`, `read:guardian_enrollments` | — |
| F2 — Cleanup sessions/tokens | Revoke/terminate sessions + refresh tokens | `delete:sessions`, `read:sessions`, `delete:refresh_tokens`, `read:refresh_tokens` | — |
| F3 — Cleanup Actions | Unbind trigger, restore bindings, delete versions/action | `delete:actions`, `read:actions` | Trigger unbind; binding restoration |
| F4 — Cleanup resource server | Remove API grants (operator, dashboard), delete A-2 | `delete:resource_servers`, `read:resource_servers` | Grant removal; grant-object removal |
| F5 — Cleanup client/application | Delete A-1/M2M clients, revoke secrets | `delete:clients`, `read:clients` | Client deletion; secret revocation; final operator verification that the M2M Management API grant is removed or reduced to the authorized retained state |
| F6 — Final read-only verification | Absent-readbacks for every deleted object; evidence inventory | `read:users`, `read:guardian_enrollments`, `read:sessions`, `read:refresh_tokens`, `read:clients`, `read:resource_servers`, `read:actions`, `read:logs` | Settings-restoration verification; grant-state confirmation via token scope-claim + operator dashboard read |

Rules: short-lived tokens (minimum lifetime the tenant supports; never a standing token); renewal with
a prior scope set is forbidden; no phase inherits scopes it does not need (Phase C never holds
`delete:guardian_enrollments`; Phase D never holds session/refresh delete); every token's granted
scopes are recorded with every finding that uses it; simultaneous destructive-scope possession is
limited to one subphase set at a time (F1–F5 never overlap). Phase B exit explicitly removes
`update:users` (Phase C does not require it — reconfirmed: no phase inherits it automatically). The per-item ledger (§6.1) fixes the exact
contracts Gate 2 instantiates per phase.

| # | Operation | Endpoint | Scope | Why required | Read / destructive | Execution agent needs it | Cleanup operation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M-01 | Read enrollment by ID (F1/F2 readback) | `GET /api/v2/guardian/enrollments/{id}` | `read:guardian_enrollments` | Immutable F1/F2 identification + before/after readback (AC-01/03) | Read | Yes | None (read-only) |
| M-02 | Delete enrollment by exact ID (F1 only) | `DELETE /api/v2/guardian/enrollments/{id}` | `delete:guardian_enrollments` | Exact-factor track (AC-02); the only destructive factor call | Destructive (→ `204`) | Yes, Phase D only, gated on the §8.1 barrier | Re-enroll via M-03 where the protocol requires |
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
| M-17 | Delete validation user | `DELETE /api/v2/users/{id}` | `delete:users` | Cleanup of every created identity | Destructive | Yes (Phase F1) | Readback `GET` must 404/absent |
| M-18 | Password-change / verification tickets + jobs | `POST /api/v2/tickets/password-change`, verification tickets, `POST /api/v2/jobs/verification-email` | `create:user_tickets` (+ `update:users` for jobs) | AC-18 flows | Write, non-destructive | Yes | None (tickets expire) |
| M-19 | Tenant log readback (audit evidence) | Tenant logs endpoints | `read:logs` | Audit-log excerpts per AC (sanitized) | Read | Yes | None |
| M-20 | Prompt text read (EN/FR matrix) | Prompts endpoints | `read:prompts` | AC-20 evidence | Read | Conditional | None |
| M-21a | Enable default connections on the test application (dashboard only) | Dashboard: application Connections tab | None (no M2M scope; human-operator dashboard toggle) | AC-19 + login-matrix prerequisites | Configuration of already-authorized resources | Yes, dashboard-only | Disable on cleanup |
| M-21b | Create login-capable test application (if no usable default app exists) | Dashboard Create Application, or `POST /api/v2/clients` | `create:clients` (+ `read:clients`, `delete:clients` for readback/cleanup) | Interactive Universal Login tests (AC-14/17/18/19/20) — an M2M app cannot perform interactive login | **BOUNDED AUTHORITY GRANTED under `FD-AUTH-ARCH-002-VAL-002-AMEND-001`** (A-1; subject to Gate 2 necessity + read-only inventory first) | Conditional on Gate 2 necessity | `DELETE /api/v2/clients/{id}` + readback |
| M-21c | Register custom validation API (resource server, e.g. `https://api.11thonus.val`) | Dashboard Create API, or `POST /api/v2/resource-servers` | `create:resource_servers` (+ read/delete for readback/cleanup) | JWT access-token evidence path (AC-16) + Functions harness JWT verification (AC-22–AC-25) + cutoff race tokens (AC-11/12) — without a registered API, access tokens are opaque, not JWT | **BOUNDED AUTHORITY GRANTED under `FD-AUTH-ARCH-002-VAL-002-AMEND-001`** (A-2; subject to Gate 2 necessity) | Conditional on Gate 2 necessity | `DELETE /api/v2/resource-servers/{id}` + readback |
| M-21d | Create/deploy Login Flow Action(s) for namespaced claims | Dashboard Create + Deploy Action, or Actions Management API | `create:actions`, `update:actions` (+ read/delete for readback/cleanup) | Emit `https://11thonus.val/session_generation` (G-1a) and `https://11thonus.val/mfa` (§11.1) — no native claim carries the generation signal | **BOUNDED AUTHORITY GRANTED under `FD-AUTH-ARCH-002-VAL-002-AMEND-001`** (A-3; at most two, one preferred; subject to Gate 2 necessity) | Conditional on Gate 2 necessity | Delete action versions/action + readback |
| M-22 | SUPERSEDED — Read M2M client grant (retired API fallback; historical evidence only) | `GET /api/v2/client-grants` was the fallback read | `read:client_grants` (never granted) | Would have proven grant narrowing; replaced by operator dashboard readback + token scope-claim check | — (not executable) | Never (dashboard-only) | None |
| M-23 | SUPERSEDED — Update M2M client grant scope set (retired API fallback; historical evidence only) | `PATCH /api/v2/client-grants/{id}` was the fallback mutation | `update:client_grants` (never granted — retired as an unnecessary privileged self-modification path) | Would have narrowed the standing grant; replaced by operator dashboard mutation | — (not executable) | Never (dashboard-only) | None |
| M-24 | SUPERSEDED — Delete client grant object (retired API fallback; historical evidence only) | `DELETE /api/v2/client-grants/{id}` was the fallback removal | `delete:client_grants` (never granted) | Would have removed API-created grants; replaced by operator dashboard removal at closure | — (not executable) | Never (dashboard-only) | None |

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

**Verifier rule (applied to every token observed, per contract under test — §10.2):** under Contract T,
ACCEPT only if `token.authGenerationTime` is present AND `token.authGenerationTime > user.revokedBefore`
AND the token is cryptographically valid (signature/`iss`/`aud`/`exp`); under Contract S, ACCEPT only
if `token.sessionGenerationId ∈ acceptedGenerationIds AND ∉ revokedGenerationIds` AND the token is
cryptographically valid. REJECT (fail closed) on missing/ambiguous generation evidence, on any failed
comparison — even when `token.iat > cutoff` — or when the mint came from a pre-cutoff authentication
generation. A genuinely fresh post-cutoff primary authentication must produce distinguishable accepted
evidence under the contract under test (fresh challenge where MFA applies).

**(A) passes** iff attempts 1–4 yield zero accepted tokens minted from the old generation AND the fresh
post-cutoff authentication verifies, for every contract Gate 2 evaluates. **If no trustworthy Auth0
signal supports the distinction (§10.2 verdicts), Gate 2 classifies a potential hard Auth0/R5 failure**
— it does not invent another signal, weaken the oracle, or pass by expiry.

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

### 10.1 Pinned candidate generation sources and verifier contracts (CORR-003 — types fixed)

The single `gen` abstraction is removed. Two independent candidate contracts are tested; Gate 2 proves
or disproves each as fixed below and designs no comparison semantics. Documented Auth0 facts used:
the post-login event exposes `event.session.id` (string, "ID of the current session"),
`event.authentication.methods` (session-completed methods; first-factor values include `pwd`,
`federated`, `sms`; completed MFA appears as `{name: 'mfa', timestamp}` with string timestamps),
`event.refresh_token.session_id` on refresh flows (Enterprise, browser flows), and `event.transaction`
(`id`, `prompt` as array of string, `protocol` from a documented value set); ID tokens carry
provider-native `auth_time` (NumericDate) when `max_age` (e.g. `max_age=0`) or `prompt=login` is
requested; custom claims must be namespaced; the signed JWT is built after Actions run.

- **G-1a (opaque session generation, CORR-004 branches): exact fields pinned per flow.**
  - *Interactive branch:* source `event.session.id`, type string (opaque). Emit
    `https://11thonus.val/session_generation` = `event.session.id` ONLY when `event.session` exists
    AND `event.session.id` is present and non-empty AND the transaction is not a refresh-token
    exchange (per the P-refresh exclusion below). No parsing. No ordering. No numeric comparison.
  - *Refresh branch:* source `event.refresh_token.session_id` (only if Auth0's documented event
    contract exposes it for the relevant flow). Emit the claim = `event.refresh_token.session_id`
    ONLY when the refresh-token context is positively identified (P-refresh: `event.refresh_token`
    present) AND `event.refresh_token.session_id` exists and is non-empty. If the documented/runtime
    field is unavailable ⇒ emit no session-generation claim ⇒ **Contract S INCOMPLETE / candidate
    fails closed** for refresh-minted tokens. Do NOT substitute `event.session.id` during refresh when
    the session object is unavailable (Auth0 documents the session object may be unavailable on
    refresh-token grants — Gate 2 assumes nothing).
  - *Both-present invariant:* if one transaction presents both `event.session.id` and
    `event.refresh_token.session_id`, require `event.session.id === event.refresh_token.session_id`
    before emitting. If they differ ⇒ emit no claim, fail closed, and record a Contract S safety
    failure for that scenario. Gate 2 never chooses which ID "wins."
  - *Absence rules (final):* interactive path without `event.session.id` ⇒ no Contract S claim ⇒
    reject/incomplete; refresh path without `event.refresh_token.session_id` ⇒ no claim ⇒
    reject/incomplete; ambiguous flow classification ⇒ no claim ⇒ reject; mismatch ⇒ no claim ⇒
    Contract S safety failure. Gate 2 tests these rules but never redesigns them.
  - *Stability/change proof:* Gate 2 proves whether Auth0 session identifiers provide the required
    semantics (same session ⇒ same value across login/silent/refresh; fresh auth ⇒ new value). If
    not, Contract S fails as an Auth0 candidate (FAIL-DISQUALIFIED or INCOMPLETE per §10.2).
- **G-1b (ordered generation timestamp): exact field `min(event.authentication.methods[*].timestamp)`,
  type ISO-8601 string normalized by the Action to Unix seconds (Number).** Testable hypothesis: the
  minimum timestamp records the session's initial primary authentication (generation), unchanged by
  later silent/refresh minting, renewed on fresh login. Gate 2 proves or disproves stability per flow;
  any refresh-driven change disqualifies the candidate.
- **G-2 (ID-token path only): exact claim `auth_time`, type NumericDate (seconds).** `max_age=0`
  forces a fresh-authentication boundary: the returned ID token's `auth_time` proves when the accepted
  primary authentication occurred. Expected silent/refresh behavior (tenant-verified): `auth_time`
  retains the original-authentication time, never mint time. Absent ⇒ REJECT. G-2 proves the ID-token
  path only and says nothing about access-token suitability — recorded explicitly.
- **Ruled out:** bare `iat`; minted-and-persisted UUIDs (forbidden state); client-supplied values; any
  numeric ordering applied to the opaque G-1a string. The key-inventory probe is NOT a source-selection
  mechanism: sources are pinned above; Gate 2 verifies presence/value-behavior only, and a pinned field
  absent on the validation entitlement renders that contract INCOMPLETE (never a redesign).

### 10.2 Candidate verifier contracts (Gate 1 defines; Gate 2 only instantiates)

**Contract T — ordered timestamp** (serves G-1b and G-2):

```text
token.authGenerationTime > user.revokedBefore
```

Types: both sides Unix seconds (Number); strict inequality (equality ⇒ REJECT — fail-closed boundary).
`user.revokedBefore` is the 11thONUS per-user revocation epoch, strongly-consistently read. For G-1b,
`token.authGenerationTime` is the normalized claim value; for G-2 it is the ID-token `auth_time`.

**Contract S — opaque session generation** (serves G-1a):

```text
token.sessionGenerationId ∈ user.acceptedGenerationIds
AND token.sessionGenerationId ∉ user.revokedGenerationIds
```

Strictly opaque: no `>`, no `<`, no timestamp comparison, no parsing, no coercion — equality and set
membership only. Types: opaque strings. `acceptedGenerationIds` is the set of session generations from
genuinely fresh post-cutoff authentications (normally one); `revokedGenerationIds` accumulates
pre-cutoff generations at revocation time. Both sets are strongly-consistently read; no caching of the
verdict.

**Stability matrix Gate 2 records per candidate** (initial interactive auth / silent `prompt=none` /
refresh-token exchange / session continuation / post-cutoff mint from old context / genuinely fresh
post-cutoff auth): emitted value, changed-or-stable verdict, present-or-absent verdict.
**Contract verdicts (independent per contract):** PASS (all §8.1 attempts + stability matrix green with
zero safety violations), FAIL-DISQUALIFIED (any false accept of an old generation — the contract is
dead, not the provider), or INCOMPLETE (entitlement-gated field unavailable, e.g. session fields).
The R5 acceptance boundary is satisfied iff ≥1 contract PASSES with zero safety violations. If both
contracts are disqualified on safety grounds, that is a potential **hard Auth0/R5 failure**. No clean
contract ⇒ Gate 1 would still be blocked — both contracts above are clean, so Gate 1 proceeds.
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

### 11.1 Namespaced MFA-claim derivation contract (CORR-003 — exact predicate, no invented time)

Documented facts constraining the design: the post-login trigger runs on interactive login AND on
refresh-token exchange; `event.authentication.methods` accumulates session-completed methods, so
"methods contains `mfa`" alone cannot prove a fresh challenge; the post-login event exposes
`event.refresh_token` (present on refresh exchanges), `event.transaction.protocol` (documented value
set including `oauth2-refresh-token`), `event.transaction.prompt` (array of string), and
`event.request.query` (authorization-request query parameters). No transaction-start timestamp exists —
that concept is removed entirely and no window is computed against an invented transaction baseline
(the fixed `MFA_EVIDENCE_MAX_AGE_SECONDS` bound below is 11thONUS validation policy, not a provider
field).

**Candidate predicate P-MFA (to prove or disprove in tenant validation — Gate 2 tests it, never
invents it). EMIT `https://11thonus.val/mfa` ONLY IF ALL hold:**

1. Post-login trigger execution (binding fact — the Action runs only here).
2. `event.refresh_token` is ABSENT (excludes refresh-token exchange, which never contains a fresh
   second-factor challenge).
3. `event.transaction.protocol` ∈ {`oidc-basic-profile`, `oidc-implicit-profile`, `oidc-hybrid-profile`}
   (interactive browser login protocols only — excludes `oauth2-refresh-token`, `oauth2-token-exchange`,
   `oauth2-password`, `oauth2-device-code`, CIBA variants; Gate 2 confirms each observed value against
   this allowlist and records any unlisted protocol as predicate-false).
4. `event.transaction.prompt` is absent OR does not contain `'none'` (excludes silent `prompt=none`;
   corroborated by `event.request.query.prompt` where present).
5. `event.authentication.methods` contains an entry with `name === 'mfa'` AND `type === 'otp'` AND
   a present `timestamp` (string, ISO-8601 as observed). `otp` is the Auth0 validation representation
   for the TOTP factor candidate. Rejected without exception: `sms`, `phone`, `email`,
   `push-notification`, recovery-code types, unknown types, missing types, and any entry accepted
   merely because its name is `mfa`. Gate 2 verifies that actual TOTP completion produces exactly
   `name === 'mfa' AND type === 'otp'`; if Auth0 represents TOTP differently in the tenant, the
   candidate predicate FAILS and validation becomes INCOMPLETE until governed correction is made —
   Gate 2 never silently expands the allowlist.
6. `mfa_time` (the entry's timestamp, parsed ISO-8601 → Unix seconds) satisfies the fixed numeric
   predicate below.
7. Required generation-candidate evidence for the tested contract is acceptable (§§8.1/10.2).

**Fixed freshness bound (validation hypothesis — CORR-004, not production policy):**

```text
MFA_EVIDENCE_MAX_AGE_SECONDS = 300
```

Stated once, fixed here, never derived dynamically and never re-tuned in Gate 2 to make a test pass.
Justification: 300 s comfortably exceeds normal issuance latency (seconds to tens of seconds including
clock skew between Auth0, the Action runtime, and the verifier), while being far shorter than any
session, revocation-convergence, or attack-reuse window — so session-old MFA cannot masquerade as
current-transaction evidence. A-2 access-token lifetime is pinned to the same 300 s as validation
configuration (Gate 2 configures the value, never decides it), bounding every tested access token's
usable life to the freshness window.

**Numeric predicate (fixed):**

```text
0 <= token.iat - mfa_time <= MFA_EVIDENCE_MAX_AGE_SECONDS
```

No absolute-value comparison: future `mfa_time` (`iat - mfa_time < 0`) fails; missing timestamp fails;
malformed/unparseable timestamp fails; outside-window timestamp fails. `mfa_time` is the parsed epoch
of the ISO string copied verbatim into the claim.

**Silent/session-continuation discriminator (exact documented fields):** refresh issuance is
excluded by clause 2 (`event.refresh_token` present); silent authorization is excluded by clause 4
(`event.transaction.prompt` containing `'none'`, corroborated by `event.request.query.prompt`);
non-interactive continuations are excluded by clause 3 (protocol not in the interactive allowlist).
These three documented fields are the complete discriminator set — no other signal is used.

**Session reuse falsification (T-MFA-SSO, preserved):** explicitly test a session with prior
successful MFA followed by later interactive-looking/silent reuse without a new TOTP challenge. If the
fixed P-MFA predicate (clauses 1–7 above) emits the MFA claim without a genuine new challenge,
**P-MFA is DISQUALIFIED** — the freshness bound is not widened or altered in Gate 2 to make the test
pass; the access-token MFA path becomes INCOMPLETE with fallback to the provider-native ID-token `amr`
path only.

**FORBIDDEN sources (the Action must never read these for MFA satisfaction):** MFA enrollment state
(`event.user.multifactor` enrollment array, `event.user.enrolledFactors`, and equivalents);
`user_metadata`; `app_metadata`; `client.metadata`; historical session metadata; prior authentication
state; `event.stats` or other history; persisted custom state (`api.cache`-family, `event.transaction`
`metadata` round-trips, metadata writes); client flags or request parameters (except the documented
`prompt`/`protocol` discriminator fields above); refresh-carried values (`event.refresh_token.*` used
for anything except proving refresh-ness); any value written by a previous Action run.

**Claim shape (exact candidate):**

```json
{
  "method": "otp",
  "mfa_time": "<ISO-8601 timestamp string, copied verbatim from the qualifying methods entry>"
}
```

`method` is the fixed string `"otp"` — the claim never says `"totp"` or any other factor name, because
`"otp"` is the Auth0 method representation being validated. `mfa_time` is the provider timestamp
verbatim (string). The Action emits nothing unless all eight P-MFA conditions hold.

Types: both strings, exactly as observed — no normalization into invented epochs at emission.
Verifier rule: ACCEPT as MFA evidence only if the numeric predicate
`0 <= token.iat - mfa_time <= MFA_EVIDENCE_MAX_AGE_SECONDS` holds (parsed epoch; malformed ⇒ fail)
AND the token's generation satisfies the R5 acceptance boundary (§§8.1/10.2). A refresh-minted token
carrying a login-time claim value is stale by construction and fails this rule; tenant test
T-MFA-REFRESH-CARRY measures whether refreshed tokens even retain un-re-emitted claims (stripped ⇒
stronger; retained ⇒ covered by the 300 s bound + 300 s A-2 lifetime, residual recorded). Absence ⇒
`verifiedSecondFactor = false`.
Ambiguity (multiple conflicting `mfa` entries, unparseable timestamp) ⇒ absent ⇒ `false`.

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
  (b) access token: namespaced claim present per the §11.1 P-MFA predicate with method exactly
      "otp" AND numeric predicate 0 <= iat − mfa_time <= MFA_EVIDENCE_MAX_AGE_SECONDS (300) AND
      generation accepted under Contract T or Contract S (§§8.1/10.2)
→ AuthenticatedCredential.verifiedSecondFactor (boolean, provider-neutral)
```

Auth0-specific claim names (`https://11thonus.val/mfa`, `https://11thonus.val/session_generation`,
`amr`, `auth_time`) never enter durable domain semantics — the adapter translates them to the boolean
and discards them. `verifiedSecondFactor = true` requires the full chain; any break (bad signature,
wrong iss/aud, expired, predicate unsatisfied, absent/ambiguous/stale evidence, failed generation
comparison) yields `false`. If T-MFA-SSO disproves P-MFA, path (b) is removed and only path (a) remains.

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
  per §13 (ENFORCE with exact allow/deny outcomes; attestation never a substitute); JWKS rotation handled per §12.2
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

## 13. App Check treatment — ENFORCED in the disposable experiment (CORR-003 decision)

App Check (device/app attestation) is orthogonal to user authentication: it attests *which app instance*
calls, never *which user* or *what they may do*. For this disposable experiment Gate 1 chooses
**ENFORCE** (both required — AND policy), so every matrix row has an exact final outcome. This is an
experiment-policy decision only, not a production enforcement decision.

- **Pinned non-production environment:** existing DEV Firebase project `eleventh-on-us-dev` with its
  already-authorized configuration, or a local/emulated App Check fixture (fixture preferred — zero
  provider contact). No new Firebase/App Check resource is created in this task or Gate 2 without
  separate authority; if conclusive testing requires one, Gate 2 stops for authority. Production
  Firebase configuration is forbidden.
- **Transport:** Auth0 JWT via `Authorization: Bearer <jwt>`; App Check token via `X-Firebase-AppCheck`.
  The harness evaluates each independently, then applies the AND policy.
- **Separated acceptances:** identity acceptance = Auth0 token verifies per §§11–12 (401 class on
  failure); attestation acceptance = App Check token verifies against the pinned project (403 class on
  failure). Endpoint policy: ALLOW requires both.
- **Final matrix (exact expected contract Gate 2 implements):**

| # | Auth0 | App Check | Expected result |
| --- | --- | --- | --- |
| 1 | valid | valid | ALLOW — HTTP 200 with verified identity context |
| 2 | valid | missing | DENY — HTTP 403 (attestation required) |
| 3 | missing | valid | DENY — HTTP 401 (attestation never establishes identity) |
| 4 | invalid | valid | DENY — HTTP 401 |
| 5 | valid | invalid | DENY — HTTP 403 |
| 6 | valid | expired | DENY — HTTP 403 |
| 7 | valid | wrong project/app | DENY — HTTP 403 |
| 8 | neither | neither | DENY — HTTP 401 |
| 9 | valid | replayed (reused past its single-use/expiry window where testable) | DENY — HTTP 403 (replayed attestation rejected; if replay is not testable with the pinned fixture, record NOT TESTABLE with cause — never an assumed accept) |

- App Check never establishes user identity, authorization, or MFA satisfaction under any row; a 200
  carries Auth0-identity context only.

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
  M-21a–M-21d, §19–§20: provider-resource authority reassessment and AMEND-001 grant), CORR-002
  (§21: independent-review corrections P1-1–P1-4/P2-1–P2-3), and CORR-003 (§22: focused re-review
  corrections — Contracts T/S, executable grant narrowing with F1–F6, exact MFA predicate P-MFA,
  App Check ENFORCE), CORR-004 (§23: final three bounded issues — G-1a branches, dashboard-only
  grant control, exact `otp` allowlist with fixed freshness bound), and GATE-1-CLOSE-001 (§24: final
  approval disposition recording, no contract change).
- Bounded WP wording correction: Required Tests table AC-19 "non-applicability" → VALIDATION
  INCOMPLETE with cause (no authority change).
- Required tracking records: `docs/00-governance/documentation-changes-log.md` (Entries 192–198) and
  `docs/changes/IMPLEMENTATION_CHANGES.md` (Gate 1 + CORR-001 + AMEND-001 + CORR-002 + CORR-003 +
  CORR-004 + CLOSE-001 entries, with the prior `AUTH-ARCH-002-VAL-WP-001-AUTH-001` authorization record restored).
- Production-code changes: **NONE**. Dependencies/config changes: **NONE**. Auth0 resources created:
  **NONE**. Live Auth0 API calls: **NONE**. `DEC-AUTH-002`, `DEC-SEC-005`/R1–R10, `DEC-DATA-008`,
  `FD-COM-001`, and the `AUTH-MFA-003D-IMPL-001` blocked state are consumed, unmodified.

## 19. Gate 1 completion state (GATE-1-CLOSE-001: approved 2026-09-09)

**GATE 1 APPROVED — READY FOR FEF HIGH-RISK GATE 2**

Independent final review `AUTH-ARCH-002-VAL-002-GATE-1-REVIEW-004` (GitHub review `5154523016`,
2026-09-09) approved Gate 1 on exact head `897cad7c8579af138c0e474851e4410778c6514a` with all prior
findings closed and no regression in any approved contract. CORR-001–CORR-004 history (§§20–23) is
preserved. Gate 2 is NOT STARTED; live validation is NOT STARTED; no provider resource was created;
Auth0 is NOT SELECTED. Gate 2 must still define and independently review the exact test contracts
before any live execution.

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

## 22. CORR-003 — focused re-review correction record (2026-09-09)

Review basis preserved: `AUTH-ARCH-002-VAL-002-GATE-1-REVIEW-002` (GitHub review `5153098758` on PR #239
head `14f1dfc`; prior review `5152282071` and §§20–21 history preserved, not rewritten). This record
corrects the four remaining bounded issues; closed areas (R5 dual oracle, R7 concurrency, isolated
identities, F2 usability, SPA + PKCE, M-10/M-13, JWKS, secret handling, cleanup semantics, AC-19) are
not reopened. Settled authority preserved unchanged (`DEC-AUTH-002`, `DEC-SEC-005`/R1–R10,
`DEC-DATA-008`, `FD-AUTH-ARCH-002-VAL-002`, `FD-AUTH-ARCH-002-VAL-002-AMEND-001`; AC-01–AC-36 unchanged).
Auth0 remains LEADING CANDIDATE — NOT SELECTED; no new Founder authority required or created.

| # | Remaining issue | Correction (section) |
| --- | --- | --- |
| 1 | Generation representation/type consistency | §10.1 pins exact fields/types (`event.session.id` string opaque; `min(methods[*].timestamp)` → Unix seconds; `auth_time` NumericDate); key-inventory-as-selection removed; §10.2 defines Contract T (`authGenerationTime > revokedBefore`, strict) and Contract S (equality-only set membership) independently with per-contract PASS/FAIL-DISQUALIFIED/INCOMPLETE verdicts; §8.1 verifier rule rewritten per contract |
| 2 | Executable grant narrowing | §6 pins dashboard-first mutation (exact navigation + scope checkboxes) with API-driven fallback (`GET`/`PATCH /client-grants/{id}`, M-22–M-24); 7-step phase lifecycle with grant-before/mutation/token/scope-verify/ops/removal/readback; Phase B reconciled with `update:users`; Phase F split into F1–F6 with per-subphase grants; F6 readback scopes complete |
| 3 | MFA freshness predicate | §11.1 replaced by exact predicate P-MFA (post-login binding + absent `event.refresh_token` + interactive `protocol` allowlist + non-`none` `prompt` + `mfa` entry with timestamp + TOTP detail allowlist); transaction-start concept removed; T-MFA-SSO falsification test defined with INCOMPLETE-fallback to ID-token `amr`; exact claim shape (strings verbatim) + verifier F-MFA freshness bound + T-MFA-REFRESH-CARRY measurement; §11.3 mapping updated |
| 4 | App Check final outcomes | §13 ENFORCE (AND policy) with exact 9-row allow/deny table (200/401/403 classes) including replay semantics; acceptances separated (401 identity vs 403 attestation) |

Gate 2 readiness: Gate 2 translates into executable test cases only — generation data type, cutoff
comparison, session-generation mapping, client-grant mutation mechanism, phase scopes, cleanup grant
schedule, MFA current-transaction predicate, silent-flow discriminator, and App Check enforcement
semantics are all decided above. State: READY FOR FINAL FOCUSED FEF HIGH-RISK GATE 1 RE-REVIEW (§19).

## 23. CORR-004 — final focused correction record (2026-09-09)

Review basis preserved: `AUTH-ARCH-002-VAL-002-GATE-1-REVIEW-003` (GitHub review `5153676350` on PR #239
head `2d0fa3e`; prior reviews `5152282071`/`5153098758` and §§20–22 history preserved, not rewritten).
This record corrects the final three bounded issues; closed areas (R5 dual oracle, Contracts T/S
separation, G-1b, G-2, R7 isolation/concurrency, F2 usability, SPA + PKCE, M-10/M-13, JWKS, App Check,
secrets, cleanup lifecycle, AC-19, bounded provider-resource authority) are not reopened. Settled
authority preserved unchanged (`DEC-AUTH-002`, `DEC-SEC-005`/R1–R10, `DEC-DATA-008`,
`FD-AUTH-ARCH-002-VAL-002`, `FD-AUTH-ARCH-002-VAL-002-AMEND-001`; AC-01–AC-36 unchanged). Auth0 remains
LEADING CANDIDATE — NOT SELECTED; no new Founder authority required or created.

| # | Remaining issue | Correction (section) |
| --- | --- | --- |
| 1 | G-1a refresh source + both-present + mismatch | §10.1 pins interactive branch (`event.session.id`, opaque string, non-refresh only) and refresh branch (`event.refresh_token.session_id` where exposed, else no claim ⇒ Contract S INCOMPLETE); both-present equality required with mismatch ⇒ no claim + safety failure; final absence rules per path; Contract S kept strictly opaque (no `>`/`<`/parsing/coercion) |
| 2 | M2M standing-grant mutation executable | §6 retires the M-22–M-24 API fallback (superseded historical evidence, not executable — no privileged self-modification); dashboard/operator-only mutation with pinned grant identity (`client_id` + Management API audience + `subject_type="client"`); 6-step operator checkpoint with `PHASE GRANT CHANGE REQUIRED` output; Phase B `update:users` reconfirmed with B-exit removal; F1–F6 operator-controlled with F5 closure verification and read-only F6 |
| 3 | MFA allowlist + freshness constant | §11.1 pins `name === "mfa" AND type === "otp"` (sms/phone/email/push/recovery/unknown/missing rejected; tenant mismatch ⇒ predicate fails/INCOMPLETE, never silent expansion); `MFA_EVIDENCE_MAX_AGE_SECONDS = 300` stated once with justification (validation hypothesis, never re-tuned); numeric predicate `0 <= iat - mfa_time <= 300` (no abs; future/missing/malformed/outside-window fail); A-2 lifetime pinned to 300 s; 8-condition final P-MFA; T-MFA-SSO disqualification rule without bound-widening; claim shape `{"method": "otp", "mfa_time": "<provider timestamp>"}`; domain stays provider-neutral boolean |

Gate 2 readiness: Gate 2 tests only whether the fixed rules work — interactive vs refresh G-1a source,
both-present/mismatch behavior, Contract S comparison, client-grant mutation mechanism, operator
checkpoint, grant identity, MFA method allowlist, freshness constant and arithmetic are all decided
above. State: READY FOR FINAL FEF HIGH-RISK GATE 1 APPROVAL REVIEW (§19, superseded by §24).

## 24. GATE-1-CLOSE-001 — final approval and closure record (2026-09-09)

- **Disposition:** **GATE 1 APPROVED — READY FOR FEF HIGH-RISK GATE 2**, per independent final review
  `AUTH-ARCH-002-VAL-002-GATE-1-REVIEW-004` (GitHub review `5154523016`, 2026-09-09) on exact head
  `897cad7c8579af138c0e474851e4410778c6514a` (PR #239 OPEN at review; no commit after the reviewed
  head; CI SUCCESS on the exact head; no new material finding).
- **Scope confirmed at approval:** documentation/governance closure only — Gate 2 NOT STARTED, live
  validation NOT STARTED, no Auth0 tenant/resources/credentials created, no provider API executed,
  Auth0 LEADING CANDIDATE — NOT SELECTED, no migration, no 003D resumption, no PostgreSQL work.
- **Contracts preserved as approved (substance unaltered by this closure):** G-1a interactive
  (`event.session.id`) / refresh (`event.refresh_token.session_id`) branches with both-present
  equality and fail-closed absence/mismatch; Contract S opaque equality/set-membership only;
  dashboard/operator grant mutation with pinned grant identity and phase-scoped minimum authority, no
  standing aggregate destructive set, no self-modifying grants; MFA predicate `name === "mfa" AND
  type === "otp"` with `MFA_EVIDENCE_MAX_AGE_SECONDS = 300`, numeric predicate
  `0 <= token.iat - mfa_time <= 300`, no Gate 2 tuning, T-MFA-SSO disqualification.
- **History preserved:** §§20–23 (CORR-001–CORR-004) and reviews `5152282071`/`5153098758`/`5153676350`
  retained unrewritten; this section only records the disposition.
- **Next:** Gate 2 must define and independently review exact test contracts before any live execution.
  Tenant creation is not authorized to begin by this closure alone.
