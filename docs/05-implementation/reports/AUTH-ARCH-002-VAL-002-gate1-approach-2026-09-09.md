# AUTH-ARCH-002-VAL-002 — Gate 1 Approach (FEF High-Risk Review Gate 1)

> **Status:** **BLOCKED — BOUNDED PROVIDER RESOURCE AUTHORITY AMENDMENT REQUIRED**
> (CORR-001, 2026-09-09; see §20 — required provider-object creations exceed the WP permission table)
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
| `VAL-F-01` | F1/F2 exact-factor identity (§6) | Email/password | F1, then F1+F2 per protocol | Dedicated; no other scenario touches it |
| `VAL-R-01` | R5 revocation + cutoff-race identity (§§7/9) | Email/password | TOTP enrolled for the scenario | Dedicated; cutoff epoch applies to this identity only |
| `VAL-L-01` (+ secondary `VAL-L-02`) | Account-linking semantics (AC-21) | Email/password primaries | As the linking matrix requires | Dedicated pair; never merged with any other test identity |
| `VAL-G-01` | Google supported-method test (AC-19) | Google test contact | As the matrix requires | Test contact only; never a real personal/business account |
| `VAL-X-pool` | Raw isolated provider experiments (§8) | Email/password | Per-experiment | One disposable identity per experiment; destroyed with the experiment |

### 4.2 Isolation principle

One identity serves one stateful scenario. Sharing is permitted only for stateless read-only
observations (e.g. JWKS fetch, plan/entitlement inspection). The F1/F2 identity (`VAL-F-01`), the
revocation/cutoff identity (`VAL-R-01`), and the linking pair are never shared, because provider-side
session, enrollment, and linking state could otherwise contaminate evidence. No real personal, business,
or customer account is used anywhere; all addresses/contacts are synthetic test contacts created for
this validation and destroyed in cleanup.

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
test is **BLOCKED FOR AC-19 — ADDITIONAL PROVIDER RESOURCE AUTHORITY REQUIRED** (M-21b) until the §20
amendment is granted. Blocked is recorded, never passed, never waived.

## 6. M2M design — least-privilege permission matrix (finalized approach)

One M2M client, created after Gate 1 clearance, holding exactly the scopes below and nothing broader.
Scopes are verified on the tenant before use and recorded with every finding. If the tenant shows a
scope name differing from current documentation (e.g. `user-revoke-access`), the execution agent records
the observed contract and Gate 2 re-reviews before broader use — scope drift is evidence, not an excuse
to widen.

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
| M-10 | Revoke selected user resources | `POST /api/v2/users/{id}/revoke-access` | Least observed scope at execution (documented family: session/refresh scopes) | User-level revoke path | Destructive-async | Conditional | None |
| M-11 | Inspect refresh tokens | Refresh-token `GET`/list endpoints | `read:refresh_tokens` | Refresh readback (AC-07/AC-10) | Read | Yes | None |
| M-12 | Delete refresh token by ID | `DELETE /api/v2/refresh-tokens/{id}` | `delete:refresh_tokens` | Targeted refresh revocation | Destructive-async | Yes | None |
| M-13 | Bulk revoke refresh tokens | `POST /api/v2/refresh-tokens/revoke` | `delete:refresh_tokens` | Bulk path + `preserve_refresh_tokens` verification (→ `202`) | Destructive-async | Yes | None |
| M-14 | Validation-user lifecycle (create/read) | `POST /api/v2/users`, `GET /api/v2/users[/by-email]` | `create:users`, `read:users` | Create/dispose §4 identities | Write (create), read | Yes | M-17 |
| M-15 | Validation-user update (block/password set) | `PATCH /api/v2/users/{id}` | `update:users` | Disablement + password-set observations | Write | Conditional (only where the matrix requires) | Restore-then-delete via M-17 |
| M-16 | Account linking / unlinking | `POST /api/v2/users/{id}/identities`, `DELETE /api/v2/users/{id}/identities/{provider}/{user_id}` | `update:users` | Linking semantics (AC-21) | Write | Yes, on `VAL-L-*` only | Unlink + delete users |
| M-17 | Delete validation user | `DELETE /api/v2/users/{id}` | `delete:users` | Cleanup of every created identity | Destructive | Yes (cleanup phase) | Readback `GET` must 404/absent |
| M-18 | Password-change / verification tickets + jobs | `POST /api/v2/tickets/password-change`, verification tickets, `POST /api/v2/jobs/verification-email` | `create:user_tickets` (+ `update:users` for jobs) | AC-18 flows | Write, non-destructive | Yes | None (tickets expire) |
| M-19 | Tenant log readback (audit evidence) | Tenant logs endpoints | `read:logs` | Audit-log excerpts per AC (sanitized) | Read | Yes | None |
| M-20 | Prompt text read (EN/FR matrix) | Prompts endpoints | `read:prompts` | AC-20 evidence | Read | Conditional | None |
| M-21a | Enable default connections on the test application (dashboard only) | Dashboard: application Connections tab | None (no M2M scope; human-operator dashboard toggle) | AC-19 + login-matrix prerequisites | Configuration of already-authorized resources | Yes, dashboard-only | Disable on cleanup |
| M-21b | Create login-capable test application (if no usable default app exists) | Dashboard Create Application, or `POST /api/v2/clients` | `create:clients` (+ `read:clients`, `delete:clients` for readback/cleanup) | Interactive Universal Login tests (AC-14/17/18/19/20) — an M2M app cannot perform interactive login | **Creation — REQUIRES ADDITIONAL AUTHORITY (see §20)** | Conditional on §20 amendment | `DELETE /api/v2/clients/{id}` + readback |
| M-21c | Register custom validation API (resource server, e.g. `https://api.11thonus.val`) | Dashboard Create API, or `POST /api/v2/resource-servers` | `create:resource_servers` (+ read/delete for readback/cleanup) | JWT access-token evidence path (AC-16) + Functions harness JWT verification (AC-22–AC-25) + cutoff race tokens (AC-11/12) — without a registered API, access tokens are opaque, not JWT | **Creation — REQUIRES ADDITIONAL AUTHORITY (see §20)** | Conditional on §20 amendment | `DELETE /api/v2/resource-servers/{id}` + readback |
| M-21d | Create/deploy Login Flow Action(s) for namespaced claims | Dashboard Create + Deploy Action, or Actions Management API | `create:actions`, `update:actions` (+ read/delete for readback/cleanup) | Emit `https://11thonus.val/*` namespaced session-generation claim (AC-11) and MFA claim (AC-16) — no native token claim carries the generation signal | **Creation — REQUIRES ADDITIONAL AUTHORITY (see §20)** | Conditional on §20 amendment | Delete action versions/action + readback |

Refused by default: any scope not in this matrix; any `update:users` use outside M-15/M-16;
any production-tenant credential; any standing (non-expiring, non-rotated) secret. The M2M client
secret is revoked/disabled and the client deleted at closure (§10).

## 7. R7 F1/F2 exact-factor validation protocol (finalized approach)

Preconditions for every scenario: the §8 R5 revocation barrier is established for the scenario first;
F1/F2 identifiers are recorded from readback (never assumed); every destructive call is followed by
readback; all IDs are masked in evidence. `DELETE …/enrollments/{id}` returning `204` is an HTTP outcome,
not yet a safety verdict — the verdict comes from readback.

### Scenario 1 — F1 only (AC-01/AC-02 baseline)

1. On `VAL-F-01`, enroll TOTP factor F1 (via ticket/Universal Login as Gate 2 specifies).
2. `GET /users/{id}/enrollments` → record immutable F1 enrollment ID (`totp|dev_…` shape expected).
3. `GET /guardian/enrollments/{F1}` → verify `status: confirmed`, type metadata; record.
4. `DELETE /guardian/enrollments/{F1}` → record HTTP outcome + scope used + audit-log excerpt.
5. Readback: `GET {F1}` must show absence (error shape recorded — no assumed 404 contract);
   `GET /users/{id}/enrollments` must not list F1.
6. **Pass:** F1 gone on readback; audit shows exactly one deletion bound to the F1 ID; no other factor
   named or affected. **Fail:** any other enrollment affected, F1 still present, or audit missing/ambiguous.

### Scenario 2 — F1 + F2 replacement safety (AC-03 core)

1. Establish F1 on a fresh `VAL-F-01` state; record F1 ID; confirm via readback.
2. Establish F2 (second TOTP enrollment; requires `allow_multiple_enrollments`/ticket path — Gate 2
   states the exact precondition; if the provider forbids a second TOTP factor, record that as
   blocking evidence for AC-03 rather than simulating it).
3. Record F2 ID; `GET` both enrollments; confirm both `confirmed`.
4. Execute deletion bound to F1 only (`DELETE …/{F1}`); record outcome + audit.
5. Readback: F1 absent; **F2 still present, `confirmed`, and usable** (usability = a genuine TOTP
   challenge against F2 succeeds, or the closest provider-supported proof Gate 2 defines).
6. **Pass:** F1 absent AND F2 present-and-usable AND audit binds the deletion to F1 alone.
   **Fail (hard R7):** F2 missing, altered, unusable, or replaced — result is
   `AUTH0 NOT QUALIFIED` unless a separately approved 11thONUS architecture legitimately satisfies R7
   (no averaging, no reinterpretation).

### Scenario 3 — stale retry / already-absent F1 (AC-04/AC-05)

1. Starting from Scenario 1 end-state (F1 already absent), replay `DELETE …/{old-F1-ID}`.
2. Record the exact status code and error shape (400/401/403/404-or-idempotent — whatever the tenant
   returns; the documented contract lists no 404, so Gate 2 must not assume one).
3. With F2 present (Scenario 2 end-state variant), replay the stale F1 delete and prove no other factor
   is affected (no aliasing, no positional delete).
4. **Pass:** stale delete affects nothing; idempotency verdict stated with the observed status table.
   **Fail:** any other factor removed, disabled, or altered by the stale call.

### Scenario 4 — concurrent/replacement race

Approximation (no provider-side lock is assumed to exist):

```text
recovery bound to F1 → F2 appears (concurrent enrollment) → stale F1 operation executes → readback
```

1. Operator A prepares an F1-bound deletion (ID recorded, revocation barrier established).
2. Operator B (or an automated second path) enrolls/confirms F2 on the same identity before A's delete executes.
3. A executes the stale F1 delete; both operators record timestamps; audit-log order is captured.
4. Variants: delete-before-confirm (F2 mid-enrollment, `active: false`) and confirm-before-delete.
5. **Pass:** in every variant F2 (confirmed or confirming) survives the stale F1 operation, or the
   provider refuses the stale call without side effects. **Fail:** any variant removes or corrupts F2.
   If the provider serializes the operations, the serialization evidence (ordering + error shape) is
   recorded as the race verdict.

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
- **Candidate signals to test on the tenant:** `auth_time` presence in tokens; session-generation
  identifier; Action-emitted namespaced generation claim in access tokens (bare `amr` key is restricted —
  custom claims must be namespaced); server-side blocked-until-fresh-auth state as the purely
  domain-side closing.
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
   markers, or refresh-carried staleness.

## 12. Functions/API validation architecture (finalized approach)

Disposable transport experiment only — no production Functions are implemented or converted.

- **Leading direction:** HTTPS endpoint + `Authorization: Bearer <Auth0 JWT>` + server-side JWKS
  verification (`https://{tenant}/.well-known/jwks.json`, RS256, allowlisted `alg`, `kid` resolution
  with rotation refresh, `iss`/`aud`/`exp` enforcement, `sub` extraction as an opaque external reference).
- **Comparison:** Firebase callable behaviour is referenced only as necessary (current callables carry a
  raw token re-verified server-side; `request.auth` is unused for authorization; no App Check wired).
  The callable-vs-HTTPS transport decision is design detail for a future migration programme, but the
  contract test plus the decision evidence are required here (AC-22–AC-27).
- **Harness matrix (each with pass/fail fixed at Gate 2):** valid token verifies; unknown `kid`
  (rotation) fails closed; expired rejected; wrong issuer rejected; wrong audience rejected; malformed
  rejected; tampered payload (bad signature) rejected; `alg=none`/non-allowlisted `alg` rejected;
  MFA-evidence mapping observed; revocation-cutoff seam enforced (`pre-cutoff-generation` and
  `missing-generation-signal` rejections; post-cutoff acceptance); `AuthenticationReference` mapping
  holds (provider subject stays an opaque external reference — never durable identity/role/permission
  authority); App Check coexistence validated (attestation independent of user auth; never a substitute).
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

Result: the Functions/API track is **BLOCKED FOR AC-16/AC-22–AC-25 (JWT access-token parts) —
ADDITIONAL PROVIDER RESOURCE AUTHORITY REQUIRED** until the §20 amendment is granted. ID-token-only
observations could proceed under current authority but cannot satisfy the track; the track as a whole is
blocked, never passed by omission. No unauthorized creation is performed to route around the blocker.

## 13. App Check treatment

App Check (device/app attestation) is orthogonal to user authentication: it attests *which app instance*
calls, never *which user* or *what they may do*. Firebase App Check can continue protecting
Functions/API independently of Firebase Authentication. The experiment verifies coexistence (attested +
unattested calls against the harness; App Check never substitutes for the bearer-user verification, and
bearer verification never depends on App Check). Current gap noted for the future migration design only:
no `enforceAppCheck` is wired today.

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

## 15. Cleanup plan (finalized approach)

| Resource | Action | Classification |
| --- | --- | --- |
| Validation users (`VAL-*`) | `DELETE /users/{id}` + readback proving absence | Mandatory delete |
| TOTP enrollments | `DELETE /guardian/enrollments/{id}` per enrollment | Mandatory delete |
| Sessions | Revoke/terminate where supported (M-07–M-10) | Mandatory revoke (best-effort + readback where API permits) |
| Refresh tokens | Revoke/delete (M-12/M-13) | Mandatory revoke |
| M2M client + secret | Disable/delete client; revoke secret | Mandatory delete + revoke |
| Temporary app/connection | Delete | Mandatory delete |
| Google validation configuration | Remove test connection config | Mandatory delete (or restore-to-absent) |
| Validation tenant itself | Delete if the approved cleanup plan requires it AND provider/account permissions permit API deletion; otherwise execute the exact documented manual cleanup requirement | Conditional (Founder/operational-plan authority for any retention as a standing test tenant); manual cleanup if API unavailable |

**Evidence required to prove cleanup:** created/removed/retained inventory with retention authorities;
per-resource readback (user `GET` absent, enrollment absent, session/token lists empty, client
absent/disabled); secrets revoked/rotated attestation; manual-cleanup statement where applicable.
Unresolved mandatory cleanup ⇒ `VALIDATION INCOMPLETE — BOUNDED EVIDENCE / CLEANUP REQUIRED`.

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
  M-21a–M-21d, §19–§20: provider-resource authority reassessment concluding
  BLOCKED — BOUNDED PROVIDER RESOURCE AUTHORITY AMENDMENT REQUIRED).
- Required tracking records: `docs/00-governance/documentation-changes-log.md` (Entries 192–193) and
  `docs/changes/IMPLEMENTATION_CHANGES.md` (Gate 1 entry + CORR-001 entry, with the prior
  `AUTH-ARCH-002-VAL-WP-001-AUTH-001` authorization record restored).
- Production-code changes: **NONE**. Dependencies/config changes: **NONE**. Auth0 resources created:
  **NONE**. Live Auth0 API calls: **NONE**. `DEC-AUTH-002`, `DEC-SEC-005`/R1–R10, `DEC-DATA-008`,
  `FD-COM-001`, and the `AUTH-MFA-003D-IMPL-001` blocked state are consumed, unmodified.

## 19. Gate 1 completion state (CORR-001 revised)

**BLOCKED — BOUNDED PROVIDER RESOURCE AUTHORITY AMENDMENT REQUIRED**

Gate 1 approval is not declared here; it is the independent reviewer's disposition on the exact head.
Gate 2 is not begun. Auth0 is not selected. The validation requirements themselves are not weakened:
Google (AC-19), the non-Google path (AC-17), and Functions/API contract validation (AC-16/AC-22–AC-25)
remain mandatory — missing authority means INCOMPLETE/BLOCKED, never PASS.

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
