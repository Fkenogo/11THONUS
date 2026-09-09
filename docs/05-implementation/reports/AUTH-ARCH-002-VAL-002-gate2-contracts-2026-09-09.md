# AUTH-ARCH-002-VAL-002 — Gate 2 Exact Validation Contracts (FEF High-Risk Review Gate 2)

> **Status:** **READY FOR FEF HIGH-RISK GATE 2 INDEPENDENT REVIEW — NOT APPROVED FOR LIVE EXECUTION**
> (Gate 2 preparation only. This artifact defines exact test contracts; it creates no tenant,
> credential, user, API call, subscription, term, migration, production state, or provider selection.
> Gate 2 approval itself is a separate independent-review disposition and is not declared here.
> Live execution is not begun.)
> **Classification:** Validation-contract specification only — NO SELECTION / NO MIGRATION /
> NO IMPLEMENTATION / NO LIVE EXECUTION / NO TENANT CREATION / NO PROVIDER CALLS
> **Date:** 2026-09-09
> **Repository:** `https://github.com/Fkenogo/11THONUS.git` (authoritative source of truth)
> **Entry `origin/main`:** `b6c2d23f71a6aac2e6ee99f6eec2d129c406061d`
> (PR #239 merge; Gate 1 APPROVED / MERGED / CLOSED; handoff SHA confirmed current, no drift)
> **Branch:** `docs/auth-arch-002-val-002-gate2-prep-001`
> (clean isolated worktree from the entry SHA; primary worktrees untouched)
> **Governing work package:** `AUTH-ARCH-002-VAL-002` — Auth0 Live Hard-Invariant Validation
> (`docs/05-implementation/reports/AUTH-ARCH-002-VAL-002-work-package-2026-09-08.md`),
> status **AUTHORISED — READY FOR CONTROLLED VALIDATION EXECUTION** under `FD-AUTH-ARCH-002-VAL-002`
> (Entry 191), as amended by `FD-AUTH-ARCH-002-VAL-002-AMEND-001` (A-1/A-2/A-3, Entry 194).
> **Governing Gate 1 approach:** `AUTH-ARCH-002-VAL-002-gate1-approach-2026-09-09.md`,
> status **GATE 1 APPROVED — READY FOR FEF HIGH-RISK GATE 2** (§24, review `5154523016`).
> **Authority boundary:** Gate 2 consumes the approved Gate 1 contracts. It redesigns nothing.
> Every fixed Gate 1 rule below is cited to its Gate 1 section; every value Gate 1 left to Gate 2
> to fix (poll cadence, JWKS cache TTL, trial counts, evidence field list) is fixed exactly once
> here and never re-tuned during execution.

## 0. How to read this artifact (Gate 2 purpose)

Gate 2 answers exactly one question (task §2):

Can another qualified executor take this specification and perform the validation without making
new security, architecture, authority or test-design decisions?

If not, Gate 2 is not ready.

Consequences applied throughout:

- Every test case names its identity, phase, endpoint, HTTP method, exact scope, dashboard-vs-API
  path, request shape, expected status, readback, verdict rule, evidence fields, and cleanup.
- No material choice is left to live execution. Where the provider may return more than one shape,
  every admissible shape is listed with its verdict — the executor records which occurred, never
  invents a new verdict.
- Result vocabulary is closed (§15/§21): PASS, FAIL, INCOMPLETE, BLOCKED — AUTHORITY REQUIRED,
  POTENTIAL HARD PROVIDER BLOCKER (only where the section explicitly allows it).
- Unavailable evidence is never converted into PASS (§15). Failed fixed hypotheses are never
  redesigned during execution (§15/§22).

Total exact test cases defined: **109** (E: 10, R5: 12, R7: 10, S: 8, T: 6, MFA: 14, AM: 16,
J: 12, AP: 9, LOC: 4, C: 8), plus the 11-phase M2M ledger (§7), 13-item secret checklist (§18),
and 18-item cleanup checklist (§19). Counts are reconciled in §21.

## 1. Entry verification (E-01–E-10)

The executor runs these checks first, in order, and records the exact observed values. Any FAIL
stops execution per §22 (STOP AND REPORT — the base has drifted or authority is missing).

| ID | Check | Exact method | PASS condition |
| --- | --- | --- | --- |
| E-01 | Remote state fetched; entry SHA recorded | `git fetch origin`; `git rev-parse origin/main` | Observed SHA `b6c2d23f71a6aac2e6ee99f6eec2d129c406061d`; no drift; recorded with timestamp |
| E-02 | Gate 1 canonical status APPROVED | Read Gate 1 report header + §24 on `origin/main` | Status string exactly `GATE 1 APPROVED — READY FOR FEF HIGH-RISK GATE 2`; review `5154523016` cited |
| E-03 | VAL-002 AUTHORISED | WP header + Entries 191/194 on `origin/main` | `FD-AUTH-ARCH-002-VAL-002` recorded; `FD-AUTH-ARCH-002-VAL-002-AMEND-001` (A-1/A-2/A-3) recorded |
| E-04 | `DEC-AUTH-002` unchanged | Decision Register `DEC-AUTH-002` Status field | `CONFIRMED`; Auth0 LEADING CANDIDATE — NOT SELECTED; no replacement provider approved |
| E-05 | `DEC-SEC-005` R1–R10 unchanged | Decision Register `DEC-SEC-005` | All ten rules R1–R10 present verbatim; no amendment record after Entry 178/181 |
| E-06 | `DEC-DATA-008` unchanged | Decision Register `DEC-DATA-008` | `CONFIRMED`; PostgreSQL direction recorded; no provisioning authorized |
| E-07 | `AUTH-MFA-003D` remains blocked | WP §Related blocked state + programme record | `AUTH-MFA-003D-IMPL-001` authorisation-VALID / execution-BLOCKED; no resumption record |
| E-08 | No live validation started | `git log origin/main --oneline` contains no execution/completion report for VAL-002; reports dir holds only the WP + Gate 1 + this Gate 2 file | Zero execution-evidence commits; zero tenant identifiers in the repo |
| E-09 | No Auth0 validation tenant/resources exist | Repo-wide scan for tenant domains, `AUTH0_*` secret material, client IDs | No tenant domain, credential, secret, or live Auth0 state anywhere in the repository |
| E-10 | `FD-COM-001` untouched by this task | No contact with any `FD-COM-001` record; basis exclusion per `DEC-DATA-008` precedent | Zero `FD-COM-001` reads/writes in this task's diff |

E-01–E-10 verdicts: PASS (proceed) or FAIL (STOP / BLOCKED — AUTHORITY REQUIRED, §22).
INCOMPLETE is not available for entry checks — the repository either verifies or it does not.

## 2. Authority (consumed, never created)

- `DEC-AUTH-002` / `FD-AUTH-ARCH-001`: external managed IdP direction; Auth0 NOT selected.
- `DEC-SEC-005` / `FD-MFA-R` R1–R10: fixed security invariants (especially R5, R7); unchanged.
- `DEC-SEC-004` / `FD-MFA-2`: TOTP-only factor policy where still applicable; unchanged.
- `DEC-DATA-008` / `FD-DATA-ARCH-001`: PostgreSQL direction; acknowledged, unchanged, no work scoped.
- `FD-AUTH-ARCH-002-VAL-001` (Entry 188): validation-environment authority (tenant may exist).
- `FD-AUTH-ARCH-002-VAL-002` (Entry 191): bounded execution authority for the WP programme only.
- `FD-AUTH-ARCH-002-VAL-002-AMEND-001` (Entry 194): A-1 (at most one login-capable app, Gate 2
  inventory-first relief), A-2 (exactly one custom validation API), A-3 (at most two Login Flow
  Actions, one preferred), each subject to Gate 2 necessity (§7.4); plus cleanup authority.
- Gate 1 approach (Entries 192–198, review `5154523016`): the fixed design authority this artifact
  instantiates. Gate 1 approval does not waive Gate 2, final review, or any Entry Gate checkpoint.
- FEF: `FEF-EWPCS-001` v1.0 (APPROVED — ACTIVE) with WP template `FEF-EWPCS-001-TPL-WP-001`
  (WP §13) and Completion Report template (WP §16). Gate 2 is the WP §13 second checkpoint
  ("before broader validation execution").

This artifact creates no authority and waives no checkpoint (WP §13; Gate 1 §2).

## 3. Prerequisites (execution environment)

P-01. Clean isolated worktree/branch from the verified `origin/main` SHA; `git status` empty at
entry; no unresolved merge/rebase/cherry-pick state.
P-02. Operator identity established: Founder-controlled Auth0 account/organization (Gate 1 §3.2);
never personal/contractor-personal/production-billing. Recorded, never a personal account.
P-03. Secret-handling controls operational before any provider state beyond minimal tenant setup
(§18 checklist verified item-by-item; `umask 077`, history suppression, traps active).
P-04. Execution browser available for Universal Login ceremonies (interactive, silent
`prompt=none`, MFA challenge) with capturable cookie jar and timestamp logging.
P-05. Two separate HTTP clients/processes available for R7 races (operators A/B, §5.4).
P-06. Local harness runtime available for the disposable Functions/JWKS/API experiment (§9):
HTTPS endpoint, JWKS fetch, RS256 verification, independent `Authorization` / `X-Firebase-AppCheck`
header evaluation. No production Function is touched (constraint §9.7).
P-07. DEV Firebase project `eleventh-on-us-dev` read access OR a local/emulated App Check fixture
for §10 (fixture preferred). No new Firebase/App Check resource without separate authority.
P-08. Commercial contact path available for §20 requests (or affected items recorded outstanding).
P-09. Google test contact available for AM-03 (AC-19), or AM-03 recorded INCOMPLETE with cause —
never bypassed with N/A.
P-10. Clock synchronization verified on executor, harness, and (where observable) tenant logs;
all evidence timestamps recorded in UTC ISO-8601 plus local monotonic dispatch timestamps.

Missing P-05 ⇒ R7 races INCOMPLETE (never PASS by single-client sequencing).
Missing P-07 with no fixture ⇒ §10 INCOMPLETE — STOP, ADDITIONAL AUTHORITY REQUIRED if a new
resource would be needed. Missing P-09 ⇒ AM-03 INCOMPLETE (never PASS, never N/A).

## 4. Resource inventory (provider objects)

| ID | Object | Authority | Creation path (dashboard preferred) | Cleanup |
| --- | --- | --- | --- | --- |
| T-0 | Exactly one validation tenant `11thonus-val-<yyyymmdd>-<short-random>`, purpose tag `11THONUS-AUTH-ARCH-002-VAL-002 (non-production validation)`, region EU | WP + `FD-AUTH-ARCH-002-VAL-001` | Dashboard tenant creation | Conditional delete (§19 CL-18) |
| M2M | Exactly one M2M client for Management API, phase-scoped grants (§7), short-lived tokens | WP | Dashboard application creation | Delete/disable + secret revoke (§19 CL-05) |
| A-1 | At most one login-capable test application, SPA public client, no secret; Authorization Code + PKCE (S256); `offline_access`; callbacks `http://localhost:{port}/callback` + one disposable `https://` test origin (exact values recorded at creation) | AMEND-001, subject to §7.4 necessity | Dashboard preferred; `POST /api/v2/clients` only if operationally required | `DELETE /api/v2/clients/{id}` + absent-readback |
| A-2 | Exactly one custom validation API, identifier `https://api.11thonus.val`, default lifetime; access-token lifetime pinned to **300 s** (Gate 1 §11.1) | AMEND-001, subject to §7.4 necessity | Dashboard preferred; `POST /api/v2/resource-servers` only if required | `DELETE /api/v2/resource-servers/{id}` + absent-readback |
| A-3 | At most two Login Flow Actions (one preferred): G-ACT (session-generation claim) + M-ACT (namespaced MFA claim); trigger: post-login flow | AMEND-001, subject to §7.4 necessity | Dashboard preferred; Actions Management API only if required | Unbind trigger, restore bindings, delete versions/action + readback |
| CONN | Default `Username-Password-Authentication` database connection + default `google-oauth2` (developer keys) | Tenant defaults; M-21a configuration-only | Dashboard toggles only | Restore enablement states (never delete defaults) |

No Google Cloud project, production Google OAuth keys, custom domains, Organizations, roles,
email-provider overrides, or standing credentials are created (§7.4 prohibited list).

## 5. Identity inventory (disposable validation identities)

All identities are synthetic test contacts created for this validation and destroyed in cleanup.
No real personal, business, customer, or production administrator identity is used anywhere.
Default isolation rule (Gate 1 §4.2): one identity serves one stateful scenario; sharing is
permitted only for stateless read-only observations.

| ID | Purpose | First factor | MFA state | AC coverage |
| --- | --- | --- | --- | --- |
| `VAL-U-01` | Ordinary email/password product path | Email/password (database connection) | None — never enrolled, never in factor/revocation tests | AM-01/AM-04/AM-05 |
| `VAL-A-01` | MFA administrator-equivalent | Email/password | TOTP enrolled; genuine challenge observed; never destructively tested | MFA-01, AM-10 |
| `VAL-F-01a` | F1-only baseline | Email/password | F1 only, then deleted | R7-01 |
| `VAL-F-01b` | F1+F2 replacement safety | Email/password | F1 then F1+F2 | R7-02 |
| `VAL-F-01c` | Already-absent F1 retry | Email/password | F1 enrolled→deleted→stale replay | R7-03 |
| `VAL-F-01d` | Confirmed-F2 stale retry | Email/password | F1+F2, F1 deleted, stale F1 replay | R7-04/R7-07 |
| `VAL-F-01e` | Delete-vs-pending-confirm race | Email/password | F1 + confirming F2; single race use | R7-05 |
| `VAL-F-01f` | Confirm-vs-delete race | Email/password | F1 + confirming F2; single race use | R7-06 |
| `VAL-R-01` | R5 revocation + cutoff race | Email/password | TOTP enrolled for the scenario | R5-01–R5-12, T-*, S-* |
| `VAL-L-01` + `VAL-L-02` | Account linking pair | Email/password primaries | As the linking matrix requires | AM-07/AM-08 |
| `VAL-G-01` | Google supported-method test | Google test contact | As the matrix requires | AM-03 |
| `VAL-X-pool` | Raw isolated provider experiments | Email/password | Per-experiment; one identity per experiment, destroyed with it | X-observations (§5.6) |

## 6. Configuration baseline (fixed before execution)

CFG-01. Tenant: non-production validation/test classification; EU region (operational choice, not a
residency approval); disposable callbacks only; no production email/SMS sender (disposable test
mailboxes); tenant logs retained as sanitized evidence.
CFG-02. A-1 (if created): SPA public client; Authorization Code + PKCE S256; Refresh Token Rotation
enabled with automatic reuse-detection; absolute + idle expiries recorded from tenant/application
settings; `max_age=0` used on selected logins to force provider-native `auth_time` into ID tokens.
CFG-03. A-2 (if created): identifier `https://api.11thonus.val`; access-token lifetime **300 s**
(pinned to the MFA freshness window, Gate 1 §11.1).
CFG-04. A-3 actions (if created): exact predicates in §§8/11 of this artifact (P-refresh exclusion,
P-MFA 8 conditions); namespaced claims only (`https://11thonus.val/session_generation`,
`https://11thonus.val/mfa`); no other claim, metadata write, or business logic.
CFG-05. M2M: short-lived tokens (minimum lifetime the tenant supports; never standing); fresh token
after every grant mutation; prior-scope renewal forbidden.
CFG-06. JWKS verifier (harness): `RS256` allowlist only; JWKS URL
`https://{tenant}/.well-known/jwks.json`; bounded cache TTL **10 minutes** + single on-demand
refresh on unknown `kid` only (§9.4).
CFG-07. Polling: fixed cadence **every 5 s up to 5 min** from the `202` timestamp; if converging
(monotonic progress on readbacks), extended sampling up to **15 min**; then declare
non-convergence (§8.5). Records the full 202-to-confirmed latency distribution.
CFG-08. R7 races: minimum **3 repeated trials** per race; barrier + delays + correlation IDs +
timestamps (§5.4); poll to stable provider state after every run.
CFG-09. MFA freshness: `MFA_EVIDENCE_MAX_AGE_SECONDS = 300`; predicate
`0 <= token.iat - mfa_time <= 300` (no abs; fixed hypothesis, never re-tuned).
CFG-10. Before-snapshots (§19 CL-10) captured for every modifiable setting before modification.

## 7. M2M phase ledger (executable; dashboard/operator grant-change protocol)

Fixed protocol at every phase boundary (Gate 1 §6, CORR-004 — no API self-modification; M-22–M-24
retired, superseded historical evidence only, never executable):

```text
STOP → RECORD (exact current grant/scopes) → OPERATOR CHANGE (Dashboard: Applications > APIs >
Auth0 Management API > Machine to Machine Applications > expand validation client, set exactly the
next-phase scope set) → CONFIRM (operator states resulting set) → FRESH TOKEN (obtained AFTER the
mutation) → VERIFY EXACT SCOPES (token scope-claim must exactly contain the required phase scopes
and no prohibited destructive scope; mismatch stops the phase) → EXECUTE
```

Pinned grant identity verified before each mutation: `client_id` = exact validation M2M client ID
AND `audience` = Auth0 Management API audience for the validation tenant AND
`subject_type = "client"`. A grant matching only client ID/audience without the expected subject
type is never used. At each boundary the agent outputs `PHASE GRANT CHANGE REQUIRED` (current
phase, next phase, scopes to remove/add, expected resulting set) and pauses for operator
confirmation — an expected checkpoint, not a blocker. No standing aggregate grant. No phase
inherits scopes it does not need. Simultaneous destructive-scope possession is limited to one
subphase set at a time (F1–F5 never overlap).

Per-identity C→D micro-transition (R7 track): each R7 destructive identity completes its
`R5-BARRIER-R7` revocation part (§9.6) under the Phase C grant, then the operator narrows the
grant C→D through the full checkpoint above (fresh Phase D token, scope-claim verified), and only
then does the F1 binding verification + deletion + readback execute under Phase D. The grant never
holds Phase C and Phase D destructive scopes simultaneously; six micro-transitions (one per
`VAL-F-01a`–`VAL-F-01f` barrier) are planned checkpoints, not blockers. R5-12 follows the same
micro-transition on `VAL-R-01`.

| Phase | Purpose | Exact scope set held | Endpoint/method family | Expected status | Readback | Cleanup | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A — Read-only inventory / setup verification | Inventory tenant state; confirm plan/entitlement (AC-28/29); before-snapshots; §7.4 necessity decisions | `read:users`, `read:guardian_enrollments`, `read:sessions`, `read:refresh_tokens`, `read:logs`, `read:prompts`, `read:clients`, `read:resource_servers`, `read:actions`, `read:connections` | `GET` only (M-01/M-04/M-05/M-06/M-11/M-19/M-20 + client/resource-server/action/connection reads) | 200 (404 on by-ID absence reads is a valid absence oracle where §8.5/§5 defines it) | N/A (this phase is readback) | None | Entitlement table; snapshots; grant record |
| B — Identity/MFA scenario setup | Create `VAL-*` users; enrollment tickets; verification tickets/jobs; enroll F1/F2; linking setup; genuine-login observations | `create:users`, `read:users`, `update:users` (M-15/M-16/M-18-job only), `create:guardian_enrollment_tickets`, `read:guardian_enrollments`, `create:user_tickets` | `POST /api/v2/users`; `POST /api/v2/guardian/enrollments/ticket`; `POST /api/v2/tickets/*`; `POST /api/v2/jobs/verification-email`; `PATCH /api/v2/users/{id}` (conditional); `POST /api/v2/users/{id}/identities` (`VAL-L-*` only) | 200/201/204 per contract | M-01/M-04 enrollment reads; user GET | Via Phase F | User IDs; enrollment IDs (masked); ticket outcomes |
| C — Revocation tests | Session/refresh revocation + readback polling + old-context exercise (R5 suite) | `read:sessions`, `delete:sessions`, `read:refresh_tokens`, `delete:refresh_tokens`, `read:guardian_enrollments` (R5-06 M-01 factor-still-bound readback only; no guardian write) | `DELETE /api/v2/sessions/{sessionId}`; `DELETE /api/v2/users/{userId}/sessions` (R5-04e, conditional); `POST /api/v2/sessions/{id}/revoke`; `POST /api/v2/users/{id}/revoke-access` (body `{session_id?, preserve_refresh_tokens? default false}`); `DELETE /api/v2/refresh-tokens/{id}`; `POST /api/v2/refresh-tokens/revoke` (M-13, entitlement-gated); `GET /api/v2/guardian/enrollments/{id}` (R5-06 readback only) | 202 (async — never confirmation); then polling per CFG-07 | M-05/M-06 + M-11 polling to absence; M-01 factor-bound readback; failed exchange attempt as behavioral readback | None (new logins mint new sessions) | 202-to-confirmed latencies; 4-attempt exercise log |
| D — Destructive exact-factor test | F1 deletion by exact ID + immediate readback only (R7 suite; R5-12 on `VAL-R-01`) | `delete:guardian_enrollments`, `read:guardian_enrollments`, `read:users` (M-04 user-enrollment-list readback; each Phase D token independently carries this exact set) | `DELETE /api/v2/guardian/enrollments/{id}` (F1 ID only); `GET /api/v2/guardian/enrollments/{id}`; `GET /api/v2/users/{id}/enrollments` (+ `authentication-methods` where the matrix requires) | 204 (HTTP outcome, not safety verdict) | M-01 absence + user enrollment list without the ID | Re-enroll via M-03 where the protocol requires (Phase B token, separate checkpoint) | HTTP outcome; audit-log excerpt; F2 usability proof |
| E — API/Action contract validation | Read A-2/A-3 config; deploy Actions; JWKS rotation observation (J suite) | `read:resource_servers`, `read:actions`, `update:actions` (+ `create:actions`/`delete:actions` only in the exact creation/removal step) | Actions Management API; resource-server reads | 200/201/204 per contract | GET action/version; tenant-log deploy event | Unbind + delete versions/action | Deploy events; rotation log |
| F1 — Cleanup identities/factors | Unlink (M-16), delete users (M-17), delete enrollments | `update:users` (unlink only), `delete:users`, `read:users`, `delete:guardian_enrollments`, `read:guardian_enrollments` | `DELETE /api/v2/users/{id}/identities/{provider}/{user_id}`; `DELETE /api/v2/users/{id}`; `DELETE /api/v2/guardian/enrollments/{id}` | 200/204 | GET 404/absent for every deleted object | — (is cleanup) | Absent-readbacks |
| F2 — Cleanup sessions/tokens | Revoke/terminate sessions + refresh tokens | `delete:sessions`, `read:sessions`, `delete:refresh_tokens`, `read:refresh_tokens` | M-07–M-13 as applicable | 202 then absence | Session/token lists empty | — (is cleanup) | Empty-list readbacks |
| F3 — Cleanup Actions | Unbind trigger, restore bindings, delete versions/action | `delete:actions`, `read:actions` | Actions API + dashboard trigger unbind | 200/204 | Absent-readback | — (is cleanup) | Binding restoration record |
| F4 — Cleanup resource server | Remove API grants (operator, dashboard), delete A-2 | `delete:resource_servers`, `read:resource_servers` | `DELETE /api/v2/resource-servers/{id}` | 200/204 | Absent-readback | — (is cleanup) | Grant-removal record |
| F5 — Cleanup client/application | Delete A-1/M2M clients, revoke secrets | `delete:clients`, `read:clients` | `DELETE /api/v2/clients/{id}` | 200/204 | Absent/disabled readback; operator confirms M2M grant removed or reduced to the authorized retained state | — (is cleanup) | Deletion + revocation attestation |
| F6 — Final read-only verification | Absent-readbacks for every deleted object; evidence inventory | `read:users`, `read:guardian_enrollments`, `read:sessions`, `read:refresh_tokens`, `read:clients`, `read:resource_servers`, `read:actions`, `read:logs` | `GET` only | 200 present-where-retained / 404 absent-where-deleted | N/A (this phase is readback) | None | Final inventory; settings-restoration verification |

### 7.4 A-1/A-2/A-3 necessity decisions (Gate 2 decides; AMEND-001 requires it)

- N-A1: Phase A read-only inventory first — if a usable default login-capable app exists, reuse it
  as configuration-only and A-1 falls away (no creation). Otherwise A-1 creation is necessary for
  AC-11/12/14/16/17/18/19/20/22–25 (interactive Universal Login + ID-token audience + JWT path).
  Record the inventory finding either way.
- N-A2: A-2 is necessary iff any JWT access-token evidence (AC-11/12/16/22–25) is to be executed —
  without a registered API, access tokens are opaque and JWKS verification is impossible. If only
  ID-token observations were executed, A-2 would be unnecessary and the JWT track INCOMPLETE.
- N-A3: A-3 is necessary iff namespaced generation/MFA claims (AC-11/16) are to be emitted — no
  native claim carries the generation signal. One Action preferred; two maximum. A-3 is
  validation-only: no cutoff or Action-claim architecture is approved by creating it.

Unknown/unavailable scopes or endpoint contracts at execution: STOP / INCOMPLETE (§22). Authority
is never widened during execution to compensate.

### 7.5 Scope-consistency matrix (CORR-001 audit: zero tests requiring undeclared phase scopes)

Each row binds a test (or sub-case) to its executing phase, exact endpoint, required scope, and the
phase-grant membership verdict. Browser/Universal Login ceremonies carry no M2M scope (marked —).
Phases are never broadened speculatively: C gains only the R5-06 M-01 read; D gains only the M-04
read; R5-12's delete executes under Phase D via the §7 micro-transition.

| Test | Phase | Endpoint (method) | Required scope | In phase grant? |
| --- | --- | --- | --- | --- |
| R5-01 setup | B | `POST /api/v2/users`; `POST /api/v2/guardian/enrollments/ticket`; `GET /api/v2/guardian/enrollments/{id}`; `GET /api/v2/users/{id}/enrollments` | `create:users`; `create:guardian_enrollment_tickets`; `read:guardian_enrollments`; `read:users` | Yes (all in B) |
| R5-01 login | B | Universal Login (browser) | — | — |
| R5-04a | C | `DELETE /api/v2/sessions/{sessionId}` | `delete:sessions` | Yes |
| R5-04b | C | `POST /api/v2/sessions/{id}/revoke` | `delete:sessions` + `delete:refresh_tokens` | Yes |
| R5-04c | C | `POST /api/v2/users/{id}/revoke-access` body `{preserve_refresh_tokens: false}` | `delete:sessions` + `delete:refresh_tokens` | Yes |
| R5-04d | C | `POST /api/v2/users/{id}/revoke-access` body `{preserve_refresh_tokens: true}` | `delete:sessions` + `delete:refresh_tokens` | Yes |
| R5-04e (conditional) | C | `DELETE /api/v2/users/{userId}/sessions` (only if M-07 path insufficient) | `delete:sessions` | Yes |
| R5-05 (M-12) | C | `DELETE /api/v2/refresh-tokens/{id}` per token | `delete:refresh_tokens` | Yes |
| R5-05 (M-13, gated) | C | `POST /api/v2/refresh-tokens/revoke` | `delete:refresh_tokens` | Yes |
| R5-06 observer | C | `GET /api/v2/users/{id}/sessions`; `GET /api/v2/sessions/{id}`; `GET /api/v2/users/{user_id}/refresh-tokens`; `GET /api/v2/refresh-tokens/{id}`; `GET /api/v2/guardian/enrollments/{F1}` | `read:sessions`; `read:refresh_tokens`; `read:guardian_enrollments` | Yes (all in C) |
| R5-08–R5-11 exercise | C | Silent `prompt=none` + refresh exchange via A-1 (browser) | — | — |
| R5-12 binding re-read | D | `GET /api/v2/users/{id}/enrollments`; `GET /api/v2/guardian/enrollments/{F1}` | `read:users`; `read:guardian_enrollments` | Yes (both in D) |
| R5-12 delete + readback | D | `DELETE /api/v2/guardian/enrollments/{F1}`; M-01/M-04 readbacks | `delete:guardian_enrollments`; `read:guardian_enrollments`; `read:users` | Yes (all in D) |
| R5-BARRIER-R7 revocation part (×6) | C | R5-04a–R5-04d selection per §9.6 + R5-05 M-12 + R5-06 reads | As R5-04–R5-06 rows | Yes |
| R5-BARRIER-R7 delete gate (×6) | D | Binding re-read + `DELETE …/{F1}` + readbacks (invoked only on barrier PASS) | `read:users`; `read:guardian_enrollments`; `delete:guardian_enrollments` | Yes |
| R7-01–R7-07 deletes + readbacks | D | `DELETE /api/v2/guardian/enrollments/{F1}`; `GET /api/v2/guardian/enrollments/{id}`; `GET /api/v2/users/{id}/enrollments` | `delete:guardian_enrollments`; `read:guardian_enrollments`; `read:users` | Yes (all in D) |
| R7 factor establishment | B | `POST /api/v2/guardian/enrollments/ticket`; M-01/M-04 reads | `create:guardian_enrollment_tickets`; `read:guardian_enrollments`; `read:users` | Yes (all in B) |
| R7-10 / MFA-01 challenges | Any | Universal Login MFA challenge (browser) | — | — |
| AM matrix (B) | B | `POST /api/v2/users`; `POST /api/v2/tickets/*`; `POST /api/v2/jobs/verification-email`; `PATCH /api/v2/users/{id}` (AM-06/09 conditional); `POST /api/v2/users/{id}/identities` (AM-07/08) | `create:users`; `create:user_tickets`; `update:users` (M-15/M-16/M-18-job only); `read:users` | Yes (all in B) |
| AM logins / LOC / AP-01–AP-09 | Browser/harness | Universal Login; disposable HTTPS harness | — (App Check fixture token, not an Auth0 scope) | — |
| J-02 rotation observation | E (+ dashboard) | Signing-key rotate-without-revoke (dashboard); JWKS `GET` (no scope) | — for JWKS fetch; `read:actions`/`read:resource_servers` for config reads | Yes |
| F1–F6 cleanup | F1–F6 | Per §7 ledger rows | Per-subphase sets (F1–F5 never overlap) | Yes |

Audit result: every test's every endpoint resolves to a scope held by its executing phase token.
No test relies on a previous-phase token. **Zero tests requiring undeclared phase scopes.**

## 8. R5 test suite (R5-01–R5-12; AC-06–AC-10)

Mandatory order for every authoritative recovery-style F1 deletion (Gate 1 §8; no test-identity
exemption). `202 Accepted` is never confirmation — it only starts the CFG-07 clock. Dispatch
(R5-04/R5-05) plus the R5-07 barrier record is followed by two concurrent activities: Track A —
convergence observer (R5-06 polling) and Track B — old-context attacker exercise (R5-08 first
attempt immediately, pre-convergence). R5-09/R5-10/R5-11 are gated on their respective readbacks.
No executor runtime selection: §8.4 fixes exactly which primitive each sub-case dispatches.

| ID | Step (exact) | Operation / endpoint | Expected response | Readback / verdict |
| --- | --- | --- | --- | --- |
| R5-01 | Establish identity/factor/session state on `VAL-R-01` | Phase B: create user, TOTP enroll, genuine login; record session ID + enrollment ID | 200/201 creates; login succeeds | M-01/M-04 confirm enrollment; session listed |
| R5-02 | Capture pre-cutoff browser/session context | Record cookie jar + session ID from readback | N/A (capture) | Context inventory stored (sanitized: IDs masked, no token values) |
| R5-03 | Capture applicable refresh tokens | Record token identifiers + client/audience per token | N/A (capture) | Identifier inventory (no token values persisted) |
| R5-04 | Execute session revocation — exact dispatched sub-cases per §8.4 (no scenario choice at runtime) | R5-04a M-07 primary; R5-04b M-09 combined; R5-04c M-10 `preserve_refresh_tokens: false`; R5-04d M-10 `preserve_refresh_tokens: true`; R5-04e M-08 conditional only | 202 per dispatch (each starts its own CFG-07 clock) | Poll M-05/M-06 per CFG-07; record `t_revoke_dispatch` per sub-case (§8.7) |
| R5-05 | Execute refresh-token revocation | `DELETE /api/v2/refresh-tokens/{id}` per token (M-12, always); `POST /api/v2/refresh-tokens/revoke` (M-13) only if the §8.4 entitlement check passes, else M-12 only with the M-13 fallback recorded | Success / 202 | Poll M-11 per CFG-07 |
| R5-06 | Track A — convergence observer: poll/read back provider state | `GET /api/v2/users/{id}/sessions`, `GET /api/v2/sessions/{id}`, `GET /api/v2/users/{user_id}/refresh-tokens`, `GET /api/v2/refresh-tokens/{id}`, `GET /api/v2/guardian/enrollments/{F1}` | Converging reads | Full latency distribution recorded; record `t_provider_converged` when §8.5 shapes hold |
| R5-07 | Establish the approved validation cutoff barrier — recorded AT revocation dispatch, frozen thereafter | Record `user.revokedBefore` epoch (Contract T) / revoked generation set (Contract S) for the scenario identity at `t_revoke_dispatch`; strongly-consistent read on the enforcement path (no short-TTL verdict caching) | Barrier record | Barrier timestamp/sets fixed for R5-08–R5-11 and the §9.6 invocations |
| R5-08 | Track B — retry captured pre-cutoff context IMMEDIATELY after dispatch, DURING convergence (concurrent with R5-06; never after polling completes) | Silent `prompt=none` + refresh exchange with a captured pre-cutoff refresh token; first attempt dispatched before convergence is established | Record provider response verbatim; record `t_old_context_attempt_1` | Valid only if `t_old_context_attempt_1 < t_provider_converged` (§8.7); else R5-08 = INCOMPLETE. Any minted token → verifier rule (§8.6) |
| R5-09 | Retry AFTER session readback indicates absence | Same attempts as R5-08 | Record verbatim | Any minted token → verifier rule |
| R5-10 | Retry AFTER refresh-token readback indicates absence | Same attempts as R5-08 | Record verbatim | Any minted token → verifier rule |
| R5-11 | Retry AFTER the bounded convergence period ends | Same attempts as R5-08 | Record verbatim | Any minted token → verifier rule |
| R5-12 | Verify exact F1 binding; F1 deletion allowed ONLY after provider + application barriers pass — executes under Phase D via the §7 micro-transition | Re-read enrollments immediately before delete (Phase D token); then `DELETE /api/v2/guardian/enrollments/{F1}` | 204 | M-01 absence + enrollment list without F1 |

### 8.4 R5 path matrix (CORR-001: every primitive has an exact test; no runtime selection)

| R5 sub-case | Revocation primitive | Endpoint (method + body) | Scope | Session effect | Refresh-token effect | Required readback | Expected verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R5-04a | M-07 single-session delete (primary path) | `DELETE /api/v2/sessions/{sessionId}` (no body) | `delete:sessions` | Target session revoked (async) | None by this call | M-05 absent + M-06 list without the session | PASS if §8.5 session shape converges within CFG-07; else INCOMPLETE (observability) or FAIL (disproven contract) |
| R5-04b | M-09 combined session+refresh revoke | `POST /api/v2/sessions/{id}/revoke` (no body) | `delete:sessions` + `delete:refresh_tokens` | Session revoked + associated refresh tokens revoked (async) | Associated refresh tokens revoked | M-05/M-06 + M-11 to absence | PASS if both shapes converge; else as R5-04a |
| R5-04c | M-10 user-level revoke, `preserve_refresh_tokens: false` | `POST /api/v2/users/{id}/revoke-access` body `{"preserve_refresh_tokens": false}` (plus `session_id` where the scenario targets one session) | `delete:sessions` + `delete:refresh_tokens` | Sessions revoked | Refresh tokens NOT preserved (revoked) | M-05/M-06 empty + M-11 empty/404 + failed exchange | PASS if both converge; M-10 is explicitly exercised — never skipped because another path passes |
| R5-04d | M-10 user-level revoke, `preserve_refresh_tokens: true` (distinguisher) | `POST /api/v2/users/{id}/revoke-access` body `{"preserve_refresh_tokens": true}` | `delete:sessions` + `delete:refresh_tokens` | Sessions revoked | Refresh tokens PRESERVED (still usable) — proves the flag's two behaviours differ | M-05/M-06 empty AND M-11 still lists the tokens AND a preserved-token exchange succeeds | PASS iff sessions are gone while refresh tokens survive (with the residual recorded as the exact R5 hazard the cutoff must close); if the provider does not support both values, INCOMPLETE with the exact limitation — never PASS by assumption |
| R5-04e (conditional) | M-08 bulk session delete — only if the M-07 path is insufficient for the scenario | `DELETE /api/v2/users/{userId}/sessions` (no body) | `delete:sessions` | All user sessions revoked (async) | None by this call | M-06 empty | Executed only on recorded M-07 insufficiency; otherwise recorded NOT EXECUTED with cause (conditional path, not a verdict) |
| R5-05 M-13 (gated) | M-13 bulk refresh revoke — only if GA release + validation entitlement confirmed on the tenant | `POST /api/v2/refresh-tokens/revoke` (bulk by ID list / user / user+client / user+client+audience; no Online Refresh Tokens) | `delete:refresh_tokens` | None by this call | Bulk revoked (202) | M-11 polling | Availability check: Phase A entitlement read + tenant behaviour probe; if unavailable, STOP this path and execute M-12 only; affected bulk-path evidence INCOMPLETE — never widened, never PASS |

Four-attempt preservation: R5-08 (attempt 1, pre-convergence, Track B) → R5-09 (attempt 2, gated
on session absence) → R5-10 (attempt 3, gated on refresh absence) → R5-11 (attempt 4, after full
bounded convergence). Polling (Track A) never consumes the attempt phases before Track B runs:
attempt 1 is concurrent with polling, attempts 2–4 are readback-gated, never polling-starved.

### 8.5 Confirmation shapes (exact; fixed here)

- Session confirmation: `GET /api/v2/users/{id}/sessions` returns an empty list AND
  `GET /api/v2/sessions/{id}` shows absence for every scenario session (absent shape recorded
  verbatim — no assumed 404 contract; whatever the tenant returns is the oracle for that tenant).
- Refresh confirmation: refresh-token list empty AND by-ID refresh read 404 for every scenario
  token (M-11 404 is the refresh absence oracle) AND a refresh-exchange attempt with a revoked
  token fails (behavioral readback).
- Already-issued access/ID JWTs are non-revocable provider-side and remain valid until `exp` —
  documented provider behaviour, not a confirmation failure; the §8.6/§10 race determines the
  application boundary.
- Non-convergence: if CFG-07 expires without confirmation, or readback is unavailable, the scenario
  STOPS — F1 is not deleted. Missing entitlement/observability ⇒ INCOMPLETE; disproven fail-closed
  contract ⇒ FAIL (POTENTIAL HARD AUTH0 BLOCKER where §10.2 applies). Never PASS by expiry.

### 8.6 Verifier rule (per contract under test; Gate 1 §§8.1/10.2 preserved)

- Under Contract T: ACCEPT only if `token.authGenerationTime` is present AND
  `token.authGenerationTime > user.revokedBefore` (strict; equality ⇒ REJECT) AND the token is
  cryptographically valid (signature/`iss`/`aud`/`exp`).
- Under Contract S: ACCEPT only if
  `token.sessionGenerationId ∈ acceptedGenerationIds AND ∉ revokedGenerationIds`
  (opaque equality/set-membership only — §12 rules) AND the token is cryptographically valid.
- REJECT (fail closed) on missing/ambiguous generation evidence, on any failed comparison — even
  when `token.iat > cutoff` — or when the mint came from a pre-cutoff authentication generation.
- A genuinely fresh post-cutoff primary authentication must produce distinguishable accepted
  evidence under the contract under test (fresh challenge where MFA applies).
- Application boundary (A) passes iff R5-08–R5-11 yield zero accepted tokens minted from the old
  generation AND the fresh post-cutoff authentication verifies, for every contract evaluated.
  Provider boundary (P) per §8.5. F1 deletion (R5-12) requires BOTH.

### 8.7 Timing contract (CORR-001: pre-convergence validity is proven, never assumed)

Timestamps (UTC ISO-8601 + local monotonic, correlation ID per dispatch):

- `t_revoke_dispatch`: the moment each R5-04/R5-05 revocation request is sent (per sub-case).
- `t_old_context_attempt_1`: the moment the Track B first attempt (R5-08) is sent.
- `t_provider_converged`: the moment Track A first observes the full §8.5 confirmation shapes.
- Subsequent attempts: `t_attempt_2/3/4` for R5-09/R5-10/R5-11 with their gating readbacks.
- Token issuance/response timestamps for every provider response and every minted token.

Validity rule: `t_old_context_attempt_1 < t_provider_converged` is REQUIRED for the
pre-convergence test to be valid. If that ordering cannot be demonstrated (attempt 1 sent at or
after observed convergence, or convergence time unobservable): R5-08 = INCOMPLETE — never PASS.
A falsely serial executor (poll to convergence first, then "retry") violates this rule and yields
INCOMPLETE, never a reassuring PASS. The same ordering rule governs every `R5-BARRIER-R7`
invocation (§9.6).

## 9. R7 test suite (R7-01–R7-10; AC-01–AC-05)

Preconditions for every case: the §8 barrier is established for the scenario first — on the SAME
identity that undergoes the destructive call (§9.6; no `VAL-R-01` inheritance, no test-identity
exemption). Every destructive step in R7-01–R7-07 executes only after `R5-BARRIER-R7` PASS for
that same identity; the Exact-steps column's delete is gated by it (§9.7). F1/F2 IDs are
recorded from readback (never assumed); every destructive call is followed by readback; `204` is an
HTTP outcome, not a safety verdict. R7 failure ⇒ AUTH0 NOT QUALIFIED (no averaging, §24).

| ID | Case (identity) | Exact steps | PASS | FAIL (hard R7) |
| --- | --- | --- | --- | --- |
| R7-01 | F1-only baseline (`VAL-F-01a`) | Enroll F1 → `GET /users/{id}/enrollments` record F1 ID → `GET /guardian/enrollments/{F1}` confirm `confirmed` → `DELETE …/{F1}` (record HTTP + scope + audit excerpt) → readback: `GET {F1}` absence (shape recorded, no assumed 404) + enrollment list without F1 | F1 gone; audit binds exactly one deletion to the F1 ID; no other factor named/affected | Any other enrollment affected; F1 still present; audit missing/ambiguous |
| R7-02 | F1+F2 replacement safety (`VAL-F-01b`) | Establish F1, record ID; establish F2 (requires multi-enrollment/ticket path — if the provider forbids a second TOTP factor, record as blocking evidence, never simulate); record F2 ID; confirm both `confirmed`; `DELETE …/{F1}`; readback F1 absent + F2 present `confirmed` + genuine F2 TOTP challenge succeeds (§9.5) | F1 absent AND F2 present AND genuine F2 challenge succeeds AND audit binds deletion to F1 alone | F2 missing/altered/unusable/replaced |
| R7-03 | Already-absent F1 retry (`VAL-F-01c`) | Fresh enroll F1 → delete F1 → verify absence (never inherited) → replay `DELETE …/{old-F1-ID}`; record exact status + error shape (no assumed 404) | Stale delete affects nothing; idempotency verdict with observed status table | Any other factor removed/disabled/altered |
| R7-04 | Confirmed-F2 stale retry (`VAL-F-01d`) | Establish F1+F2 → delete F1 → replay stale F1 delete against confirmed F2; prove no aliasing/positional delete | F2 untouched; confirmed + usable | Any effect on F2 |
| R7-05 | Race A: delete dispatched while F2 confirmation pending (`VAL-F-01e`), ≥3 trials | §9.4 apparatus; B begins F2 enrollment, holds pre-confirmation; barrier-synced A dispatches `DELETE …/{F1}` while confirmation pending; prove A-dispatch < B-confirm + completion order; poll to stable state; replay stale F1 delete; genuine F2 challenge (if F2 never reaches `confirmed` through no fault of the delete, INCOMPLETE with cause) | Overlap demonstrated AND order proven AND F2 survives every run with post-run genuine challenge success, or provider refuses the stale call without side effects | Any run removes/corrupts F2 |
| R7-06 | Race B: confirm dispatched while delete in flight (`VAL-F-01f`), ≥3 trials | §9.4 apparatus; A dispatches `DELETE …/{F1}`; barrier-synced B dispatches F2 confirmation before delete observably completes; prove B-dispatch < A-completion; record provider completion order from tenant logs; poll stable; replay stale F1; genuine F2 challenge | As R7-05 | As R7-05 |
| R7-07 | Race C: stale F1 delete after F2 confirmed (`VAL-F-01d` end-state or dedicated fresh pair) | With F2 `confirmed` and F1 deleted, replay `DELETE …/{old-F1-ID}`; verify F2 untouched + genuine-challenge-usable | Stale call without side effects | Any effect on F2 |
| R7-08 | Delete-vs-pending-confirm ordering proof (meta-case over R7-05 trials) | Dispatch/completion timestamp pairs + tenant-log order per trial; correlation IDs | All 3 trials show the intended overlap window with proven order | Overlap unprovable in any trial ⇒ that trial INCOMPLETE, never PASS |
| R7-09 | Confirm-vs-delete ordering proof (meta-case over R7-06 trials) | As R7-08 for Race B | As R7-08 | As R7-08 |
| R7-10 | Genuine F2 usability proof (applies to R7-02/R7-05/R7-06/R7-07) | Genuine TOTP challenge using F2 (Universal Login MFA challenge with a validator-generated code) after the scenario | F2 enrolled AND genuine second-factor challenge succeeds | Challenge fails ⇒ FAIL; challenge unexecutable ⇒ INCOMPLETE (never PASS) |

### 9.4 Overlap apparatus (all races; Gate 1 §7 Scenario 4 preserved)

Synchronized start barrier across two separate clients/processes (operator A = deleter, operator B
= enroller); controlled client-side delays where possible; per-run correlation IDs sent with (or
logged alongside) each operation; local monotonic timestamps at dispatch and observed completion;
provider/tenant log timestamps where available; immutable F1/F2 IDs recorded before dispatch;
minimum 3 repeated trials per race; poll to stable provider state after every run; replay the stale
F1 deletion after stabilization; verify exact factor state; close with the genuine F2 challenge.
If intended ordering/overlap cannot be demonstrated: INCOMPLETE — never PASS.

### 9.5 F2 usability rule

R7 requires more than F2 remaining listed. Usability is proven ONLY by a genuine TOTP challenge
using F2 that succeeds. No "closest" substitute. If unexecutable, R7 remains INCOMPLETE.

### 9.6 `R5-BARRIER-R7` subprotocol (CORR-001: mandatory reusable barrier, invoked per identity)

`R5-BARRIER-R7(i)` runs on R7 identity `i` (`VAL-F-01a`–`VAL-F-01f`) before that identity's
destructive F1 call. It is not a new top-level numbered case: every invocation produces
independent evidence (own timestamps, readbacks, verdict recorded under the invoking R7 case),
and the invoking R7 PASS requires the barrier invocation to PASS for that identity (§9.7).
Revocation steps run under the Phase C grant; the binding verification + delete gate runs under
Phase D after the §7 micro-transition.

| Step | Action (same identity `i`) | Phase/grant | Evidence |
| --- | --- | --- | --- |
| B-0 | Establish authenticated context: genuine login on `i` yielding at least one provider session and (where the flow issues one) a refresh token. R7 identities with no active session/refresh state are NOT exempt — this step creates the revocable state the barrier must exercise. If provider semantics genuinely make no revocable state available for `i`, record the exact observed state and apply the governed fail-closed oracle (STOP before delete; INCOMPLETE with cause) rather than inventing an exemption. | Browser via A-1 (no M2M scope) | Session/refresh inventory for `i` |
| B-1 | Capture `i`'s active sessions (cookie jar + session IDs from readback). | Capture (+ `read:sessions` under C) | Sanitized context inventory |
| B-2 | Capture all known refresh tokens/contexts for `i` (identifiers + client/audience; no values). | Capture (+ `read:refresh_tokens` under C) | Sanitized identifier inventory |
| B-3 | Dispatch the applicable provider revocation path for `i` (§8.4 selection: R5-04a–R5-04d as the scenario requires, M-10 path included where §9.6 scope needs it; R5-05 M-12 per token; M-13 only if entitled). Record `t_revoke_dispatch` + R5-07 barrier epoch for `i`. | C | Dispatch log + barrier record |
| B-4 | Begin provider readback (Track A, R5-06 reads incl. M-01 factor-bound read). | C | Polling log |
| B-5 | Begin application-side old-context rejection exercise (Track B, R5-08 first attempt immediately, pre-convergence; §8.7 timing rule applies). | C (browser) | `t_old_context_attempt_1`; ordering proof |
| B-6 | Establish the required Contract S/T application boundary for `i` (§§8.6/10.2). | Evaluation | Boundary record |
| B-7 | Confirm the dual R5 oracle for `i` (P per §8.5 + A per §8.6 over attempts 1–4). | Evaluation | P+A verdict |
| B-8 | Verify immutable F1 binding for `i` (re-read enrollments immediately before delete). | D (after micro-transition) | Binding record |
| B-9 | ONLY then execute the invoking R7 case's F1 deletion. | D | 204 + readbacks per the R7 row |

If the barrier cannot be established for `i` (non-convergence, unavailable readback, timing
unprovable, missing entitlement): that R7 case is INCOMPLETE / STOP BEFORE F1 DELETE. Never
proceed destructively. Barrier FAIL for `i` ⇒ invoking R7 case cannot PASS (§9.7).

### 9.7 R7 result dependency (explicit)

```text
R7 test PASS
requires
R5 barrier PASS for same identity (R5-BARRIER-R7(i) PASS, or R5-01–R5-12 PASS on VAL-R-01
for the VAL-R-01-scoped T/S/MFA observations only)
AND
R7 exact-factor/race assertions PASS
```

Barrier FAIL ⇒ R7 cannot PASS (FAIL). Barrier INCOMPLETE ⇒ R7 = INCOMPLETE. Barrier
BLOCKED ⇒ R7 = BLOCKED. No destructive factor test may override the R5 verdict. R7-08/R7-09
(meta-cases) inherit the barrier verdicts of their underlying race trials; R7-10 (challenge
proof, non-destructive) requires no barrier but requires the surviving F2 state it proves.

## 10. Cutoff / generation experiment (T-01–T-06, S-01–S-08; AC-11–AC-13)

Candidate architecture only — validation, not approval. Bare JWT `iat` is disproved as sufficient
(Gate 1 §10). Epoch reads on the enforcement path are strongly consistent (no short-TTL verdict
caching; JWKS caching alone acceptable).

### 10.1 Pinned sources (Gate 1 §10.1 preserved; Gate 2 tests, never redesigns)

- G-1a interactive branch: source `event.session.id` (string, opaque). Emit
  `https://11thonus.val/session_generation` = `event.session.id` ONLY when `event.session` exists
  AND `event.session.id` is present and non-empty AND the transaction is not a refresh-token
  exchange. No parsing, ordering, or numeric comparison.
- G-1a refresh branch: source `event.refresh_token.session_id` (only if the documented event
  contract exposes it for the flow). Emit ONLY when refresh is positively identified
  (P-refresh: `event.refresh_token` present) AND the field exists and is non-empty. Unavailable ⇒
  emit no claim ⇒ Contract S INCOMPLETE for refresh-minted tokens. Never substitute
  `event.session.id` during refresh when the session object is unavailable.
- Both-present invariant: if one transaction presents both IDs, require equality before emitting.
  Differ ⇒ emit no claim, fail closed, record a Contract S safety failure. Gate 2 never chooses
  which ID "wins."
- Absence rules: interactive without `event.session.id` ⇒ no claim ⇒ reject/incomplete; refresh
  without `event.refresh_token.session_id` ⇒ no claim ⇒ reject/incomplete; ambiguous flow
  classification ⇒ no claim ⇒ reject; mismatch ⇒ no claim ⇒ safety failure.
- G-1b: exact field `min(event.authentication.methods[*].timestamp)`, ISO-8601 string normalized
  by the Action to Unix seconds (Number). Hypothesis: minimum records the session's initial primary
  authentication, unchanged by silent/refresh minting, renewed on fresh login. Any refresh-driven
  change disqualifies the candidate.
- G-2 (ID-token path only): exact claim `auth_time` (NumericDate, seconds); `max_age=0` forces the
  fresh-authentication boundary. Expected silent/refresh behaviour (tenant-verified): `auth_time`
  retains original-authentication time, never mint time. Absent ⇒ REJECT. Says nothing about
  access-token suitability.
- Ruled out: bare `iat`; minted-and-persisted UUIDs (forbidden state); client-supplied values; any
  numeric ordering on the opaque G-1a string.

### 10.2 Test cases

| ID | Case | Steps | PASS | FAIL-DISQUALIFIED / INCOMPLETE |
| --- | --- | --- | --- | --- |
| T-01 | G-1b stability matrix (`VAL-R-01`) | Record normalized `min(timestamp)` across: initial interactive auth / silent `prompt=none` / refresh exchange / session continuation / post-cutoff mint from old context / fresh post-cutoff auth | Stable across silent+refresh+continuation; renewed on fresh auth | Refresh-driven change ⇒ G-1b DISQUALIFIED |
| T-02 | G-2 `auth_time` behaviour (`VAL-R-01`) | `max_age=0` logins; record ID-token `auth_time` across the same six flows | Silent/refresh retain original-auth time; fresh login renews; absent ⇒ reject observed | Any mint-time `auth_time` on silent/refresh ⇒ G-2 DISQUALIFIED for the cutoff purpose |
| T-03 | Contract T race | Pre-cutoff context → establish `revokedBefore` → provider mints from old generation afterwards → apply `authGenerationTime > revokedBefore` (strict) | Old-generation race token rejected; fresh post-cutoff accepted; missing-signal rejected | False accept ⇒ Contract T FAIL-DISQUALIFIED |
| T-04 | Contract T equality boundary | Token with `authGenerationTime == revokedBefore` | REJECT (fail-closed boundary) | Accept ⇒ FAIL-DISQUALIFIED |
| T-05 | Contract T type check | Both sides Unix seconds (Number) | Types hold; no coercion path exercised | Type/coercion ambiguity ⇒ INCOMPLETE with cause |
| T-06 | R5 acceptance via Contract T | §8.6 rule over R5-08–R5-11 tokens for G-1b and G-2 independently | Zero accepted old-generation tokens + fresh auth verifies | Any accepted old token ⇒ FAIL; ungatherable ⇒ INCOMPLETE |
| S-01 | G-1a interactive emission | Interactive login with `event.session` present; record emitted claim | Claim == `event.session.id`, opaque, no transform | No emission ⇒ INCOMPLETE for the interactive path |
| S-02 | G-1a refresh emission | Refresh exchange; record claim vs `event.refresh_token.session_id` | Claim == refresh session ID where exposed; no claim where unexposed (INCOMPLETE for refresh-minted tokens) | Substitution of `event.session.id` on refresh ⇒ FAIL (safety violation) |
| S-03 | Both-present equality | Transaction presenting both IDs, equal | Emitted | — |
| S-04 | Both-present mismatch | Transaction presenting both IDs, differing | No claim + recorded Contract S safety failure | Emission of either ID ⇒ FAIL-DISQUALIFIED |
| S-05 | Interactive absence | Interactive path without `event.session.id` | No claim; verifier rejects | Accept ⇒ FAIL |
| S-06 | Refresh absence | Refresh path without `event.refresh_token.session_id` | No claim; verifier rejects | Accept ⇒ FAIL |
| S-07 | Opaque-operation discipline | Review Action + verifier code paths | Only equality/inequality/set-membership on G-1a values; no numeric interpretation, lexical ordering, generation arithmetic, or inferred sequencing | Any forbidden operation ⇒ FAIL (hypothesis violated) |
| S-08 | Contract S race + stability matrix | Same six flows as T-01 for the G-1a value; §8.6 Contract S rule over R5-08–R5-11 | Same session ⇒ same value across login/silent/refresh; fresh auth ⇒ new value; zero accepted old-generation tokens | Instability ⇒ Contract S INCOMPLETE/FAIL per §10.3; false accept ⇒ FAIL-DISQUALIFIED |

### 10.3 Contract verdicts (independent per contract)

PASS (all §8 attempts + stability matrix green, zero safety violations) / FAIL-DISQUALIFIED (any
false accept of an old generation — the contract is dead, not the provider) / INCOMPLETE
(entitlement-gated field unavailable). The R5 acceptance boundary is satisfied iff ≥1 contract
PASSES with zero safety violations. If both contracts are disqualified on safety grounds, that is a
POTENTIAL HARD AUTH0 BLOCKER (§15/§24). No clean contract ⇒ no qualification path via cutoff.

## 11. MFA test suite (MFA-01–MFA-14; AC-14–AC-16)

Fixed hypothesis (Gate 1 §11.1, never re-tuned): `MFA_EVIDENCE_MAX_AGE_SECONDS = 300`;
`0 <= token.iat - mfa_time <= 300` (no abs). Fixed allowlist: `name === "mfa" && type === "otp"`.
Fixed claim: `{ "method": "otp", "mfa_time": "<provider timestamp>" }` (both strings, timestamp
verbatim). Durable result: `verifiedSecondFactor: boolean` (provider-neutral; Auth0 names never
durable). F2 must remain genuinely usable through a successful TOTP challenge (§9.5).

### 11.1 P-MFA predicate (exact; the Action emits ONLY IF ALL hold)

1. Post-login trigger execution (binding fact).
2. `event.refresh_token` ABSENT (excludes refresh exchange).
3. `event.transaction.protocol` ∈ {`oidc-basic-profile`, `oidc-implicit-profile`,
   `oidc-hybrid-profile`} (interactive browser login only; excludes `oauth2-refresh-token`,
   `oauth2-token-exchange`, `oauth2-password`, `oauth2-device-code`, CIBA variants; unlisted
   observed protocol ⇒ predicate-false, recorded).
4. `event.transaction.prompt` absent OR without `'none'` (excludes silent; corroborated by
   `event.request.query.prompt` where present).
5. `event.authentication.methods` contains an entry with `name === 'mfa'` AND `type === 'otp'`
   AND present `timestamp` (string ISO-8601). Rejected: `sms`, `phone`, `email`,
   `push-notification`, recovery-code types, unknown/missing types. Tenant mismatch (real TOTP
   completion produces a different representation) ⇒ predicate FAILS ⇒ INCOMPLETE until governed
   correction — never silent allowlist expansion.
6. `mfa_time` satisfies `0 <= token.iat - mfa_time <= 300` (parsed epoch; future/missing/malformed/
   outside-window ⇒ fail).
7. Generation evidence for the tested contract is acceptable (§§8.6/10.2).

FORBIDDEN sources: enrollment state (`event.user.multifactor`, `enrolledFactors`); `user_metadata`;
`app_metadata`; `client.metadata`; historical session metadata; prior auth state; `event.stats`;
persisted custom state (`api.cache`-family, transaction `metadata` round-trips, metadata writes);
client flags/request params (except the documented prompt/protocol discriminators);
refresh-carried values (`event.refresh_token.*` except proving refresh-ness); any prior Action-run value.

### 11.2 Test vectors (all mandatory; none may yield `verifiedSecondFactor = true` except MFA-01)

| ID | Vector | Method | Expected |
| --- | --- | --- | --- |
| MFA-01 | Genuine TOTP (`VAL-A-01`) | Hosted/Universal Login + MFA challenge completed; record `amr` (expect `mfa` present, redacted excerpt), ID-token vs access-token behaviour, namespaced claim emission | `verifiedSecondFactor = true` via §11.3 chain only |
| MFA-02 | Refresh (`VAL-A-01` session) | Refresh-token exchange; observe `amr`/`acr` omission + claim behaviour | `false`; stale login-time claim rejected via freshness+generation rule |
| MFA-03 | Silent/SSO (`prompt=none`) | Silent renewal without new challenge | `false` |
| MFA-04 | Historical MFA reuse | Session with prior successful MFA, later reuse without new challenge (T-MFA-SSO falsification) | `false`; if P-MFA emits without a genuine new challenge ⇒ P-MFA DISQUALIFIED, access-token path INCOMPLETE with fallback to ID-token `amr` only (bound never widened) |
| MFA-05 | Stale timestamp | `iat - mfa_time > 300` | `false` |
| MFA-06 | Future timestamp | `iat - mfa_time < 0` | `false` |
| MFA-07 | Malformed timestamp | Unparseable `mfa_time` | `false` |
| MFA-08 | Missing evidence | No claim / no `amr` | `false` |
| MFA-09 | Wrong factor: SMS/phone | `type` sms/phone entry | `false` (rejected by allowlist) |
| MFA-10 | Wrong factor: email/push/recovery | Corresponding entry | `false` |
| MFA-11 | Tampered/custom claim | Re-signed payload with altered namespaced claim | Signature failure ⇒ `false` |
| MFA-12 | Enrollment-only state | TOTP enrolled, primary-only login (`VAL-U-01`-style on an enrolled identity) | `false` (enrollment never counts as proof) |
| MFA-13 | Client-supplied flag / metadata | Forged claim/SDK flag; `user_metadata`/`app_metadata` MFA flag; replayed persisted Action value | `false` in all three sub-cases |
| MFA-14 | Refresh-carry measurement (T-MFA-REFRESH-CARRY) | Determine whether refreshed tokens retain un-re-emitted claims | Stripped ⇒ stronger (record); retained ⇒ covered by 300 s bound + 300 s A-2 lifetime (residual recorded); never `true` from carry alone |

### 11.3 Provider-neutral mapping (candidate mapping Gate 2 proves)

```text
verified Auth0 token (signature/iss/aud/exp valid)
→ validated current-transaction MFA evidence:
  (a) ID token: amr contains 'mfa' (fresh-login issuance; absent on silent/refresh), OR
  (b) access token: namespaced claim present per §11.1 with method exactly "otp" AND
      0 <= iat − mfa_time <= 300 AND generation accepted under Contract T or S
→ AuthenticatedCredential.verifiedSecondFactor (boolean, provider-neutral)
```

Full chain required; any break (bad signature, wrong iss/aud, expired, predicate unsatisfied,
absent/ambiguous/stale evidence, failed generation comparison) ⇒ `false`. If T-MFA-SSO disproves
P-MFA, path (b) is removed and only path (a) remains.

## 12. Authentication-method validation matrix (AM-01–AM-16; AC-17–AC-21)

Mandatory non-Google path: email/password (AM-01) proves users without Google accounts can use
11thONUS. Google (AM-03) is a supported-method test, never a universal user requirement: AC-19
PASSES only through the required tenant test, else remains VALIDATION INCOMPLETE (never N/A).
Product requirements are not expanded.

| ID | Method (AC) | Identity | Exact steps | PASS |
| --- | --- | --- | --- | --- |
| AM-01 | Email/password (AC-17) | `VAL-U-01` | Universal Login database-connection sign-in; record flow + session | Complete non-Google authentication works |
| AM-02 | Email verification (AC-18a) | `VAL-U-01` (+ ticket) | `POST /api/v2/tickets/*` / `POST /api/v2/jobs/verification-email`; complete verification; read back `email_verified` | Verified state observed end-to-end |
| AM-03 | Google (AC-19) | `VAL-G-01` (test contact only) | Default `google-oauth2` + developer keys; dashboard "Try Connection" (M-21a config) + app-level Universal Login via A-1 (M-21b) | Tenant login succeeds; else INCOMPLETE with cause (creds unavailable / test unexecutable) — never PASS, never N/A |
| AM-04 | Password reset (AC-18b) | `VAL-U-01` | `POST /api/v2/tickets/password-change`; complete reset; sign in with new password | Reset + new-password sign-in observed |
| AM-05 | Password change (AC-18c) | `VAL-U-01` | Authenticated change flow; old password fails, new succeeds | Change semantics observed |
| AM-06 | Account blocking (AC-21-adjacent) | `VAL-U-01` (Phase B `PATCH /api/v2/users/{id}` blocked=true, then restored) | Blocked login fails; unblocked login succeeds | Block semantics observed; state restored |
| AM-07 | Account linking (AC-21a) | `VAL-L-01` + `VAL-L-02` | `POST /api/v2/users/{id}/identities`; read back identities array | Linked identities observed |
| AM-08 | Account unlinking/deletion (AC-21b) | `VAL-L-01` + `VAL-L-02` | `DELETE /api/v2/users/{id}/identities/{provider}/{user_id}`; delete secondary user | Unlinked state + secondary deletion observed |
| AM-09 | Account deletion (AC-21c) | Disposable `VAL-X-*` | `DELETE /api/v2/users/{id}`; readback absent | Deletion + absence observed |
| AM-10 | TOTP enrollment (AC-14-setup) | `VAL-A-01` | Ticket/Universal Login enrollment; `GET` confirms `confirmed` | Enrollment observed (proof requires MFA-01 challenge) |
| AM-11 | Administrative recovery observation | `VAL-R-01` track | Recovery-style F1 deletion only via the §8 order (no separate recovery UX invented) | §8 order honoured; no bypass |
| AM-12 | Step-up / fresh authentication | `VAL-A-01` | `max_age=0` (or `prompt=login`) login; ID-token `auth_time` renewed | Fresh-auth boundary observed |
| AM-13 | EN experience (AC-20a) | A-1 Universal Login | Full login + MFA screens in EN; prompt text readback (`read:prompts`) | EN matrix green |
| AM-14 | FR experience (AC-20b) | A-1 Universal Login | Full login + MFA screens in FR; prompt text readback | FR matrix green; EN/FR parity |
| AM-15 | Passwordless SMS (where required by the matrix) | Per matrix | Only where the governed matrix requires; phone auth is optional/non-default pilot scope (Gate 1 §16) | Executed where required (PASS/FAIL/INCOMPLETE per outcome); where the governed matrix does not require it, no test executes and no verdict is recorded — scope note only, mapped in §21 (never N/A to bypass AC-19) |
| AM-16 | Secondary linked/unlinked identity state | `VAL-L-02` | Recreated counterpart handling; final state per §19 CL-12 | States recorded; cleanup per §19 |

## 13. Functions/API contract (J-01–J-12; AC-22–AC-26)

Disposable validation API/harness only (approved direction: HTTPS + Auth0 Bearer access token +
JWKS verification + separate App Check header). No production Function is modified. Verification
order is fixed and failures are terminal at the first failing step:

```text
1. Presence: Authorization header present (absent ⇒ 401, stop)
2. Shape: JWT three-segment parse (malformed ⇒ reject, stop)
3. Algorithm: alg == RS256 (none/HS*/other ⇒ reject before key lookup, stop)
4. Key: kid resolves in JWKS (unknown ⇒ one controlled refresh, §9.4; still absent ⇒ reject, stop)
5. Signature: RS256 verify with resolved key (bad signature ⇒ reject, stop)
6. Claims: iss == https://{tenant}/ AND aud == A-2 identifier (wrong ⇒ reject, stop)
7. Lifetime: exp valid, iat sane (expired ⇒ reject, stop)
8. Generation seam: Contract T/S check per §§8.6/10 (§12 S-*/T-* expectations)
9. MFA mapping: §11.3 observed (record only; never fails closed beyond its own rule)
10. Reference mapping: sub extracted as opaque external reference (never durable identity)
11. App Check AND: §14 evaluated independently, then AND applied
```

| ID | Case | Expected |
| --- | --- | --- |
| J-01 | Valid current-key token verifies | PASS (200 with verified identity context) |
| J-02 | Legitimate published rotated key (Case A) | MUST PASS: cache miss → exactly ONE controlled JWKS refresh → key found → signature verifies → PASS |
| J-03 | Arbitrary unknown `kid` (Case B) | MUST FAIL CLOSED: after the one refresh still absent ⇒ REJECT; no second refresh, no retry storm, no fallback key, verification never disabled |
| J-04 | Wrong algorithm (`none`) | REJECT before key lookup |
| J-05 | Wrong algorithm (`HS256`/other) | REJECT before key lookup |
| J-06 | Wrong key type/use (`kty` non-RSA; `use` missing or not `sig`) | REJECT (fail closed for tokens requiring those keys) |
| J-07 | Malformed JWKS | Fail closed for affected tokens; INCOMPLETE with cause where the provider itself serves the malformed set |
| J-08 | JWKS endpoint failure/outage | Fail closed; affected checks INCOMPLETE (never bypass); last-good set preserved, misses fail closed |
| J-09 | Bounded cache behaviour | TTL 10 min (CFG-06) + single on-demand refresh on unknown `kid` only; refresh failures preserve last-good set |
| J-10 | Removed old key | Tokens under the removed `kid` follow Case B after cache refresh |
| J-11 | Wrong issuer / wrong audience / expired / malformed / tampered payload | Each REJECT (AC-23/AC-25 negatives) |
| J-12 | `AuthenticationReference` mapping | Provider `sub` stays an opaque external reference — never durable identity/role/permission authority (AC-26) |

Mechanics precedent: the VAL-001 disposable harness (11/11, `/tmp`, uncommitted) proves verification
mechanics only; tenant behaviour requires tenant evidence. Mechanics results are never reported as
tenant-observed behaviour.

## 14. App Check contract (AP-01–AP-09; AC-27)

Independent AND enforcement (Gate 1 §13 preserved). Separate headers, separately evaluated, then
AND-applied. Identity acceptance = Auth0 token verifies (401 class on failure); attestation
acceptance = App Check token verifies against the pinned project (403 class on failure). Pinned
environment: `eleventh-on-us-dev` or local/emulated fixture (fixture preferred). No new
Firebase/App Check resource without separate authority (else STOP — ADDITIONAL AUTHORITY
REQUIRED). App Check never substitutes for identity, authorization, or MFA.

| ID | Auth0 | App Check | Expected final outcome |
| --- | --- | --- | --- |
| AP-01 | valid | valid | ALLOW — 200 with verified identity context |
| AP-02 | valid | missing | DENY — 403 (attestation required) |
| AP-03 | missing | valid | DENY — 401 (attestation never establishes identity) |
| AP-04 | invalid | valid | DENY — 401 |
| AP-05 | valid | invalid | DENY — 403 |
| AP-06 | valid | expired | DENY — 403 |
| AP-07 | valid | wrong project/app | DENY — 403 |
| AP-08 | neither | neither | DENY — 401 |
| AP-09 | valid | replayed (past single-use/expiry window where testable) | DENY — 403; if replay is not testable with the pinned fixture, INCOMPLETE with recorded cause (never assumed accept) |

## 15. Localization tests (LOC-01–LOC-04; AC-20 detail)

LOC-01: EN login matrix (AM-13) with exact prompt-text excerpts (redacted, `read:prompts`).
LOC-02: FR login matrix (AM-14) with EN/FR parity statement per screen.
LOC-03: EN/FR MFA challenge screens (TOTP enrollment + challenge copy parity).
LOC-04: EN/FR error/rejection screens (fail-closed messages generic; no factor/oracle leakage in
either locale).

## 16. Commercial evidence plan (C-01–C-08; AC-28–AC-32)

Evidence only — no purchase, no terms, no paid commitment without separate Founder approval.
Request sent ≠ evidence received. Missing decision-material evidence without an explicit
Founder/designated-authority waiver for the specific item ⇒
VALIDATION INCOMPLETE — COMMERCIAL EVIDENCE REQUIRED (no agent waiver).

| ID | Evidence request (AC) | Source | Received content |
| --- | --- | --- | --- |
| C-01 | Enterprise pricing for the exact required APIs at pilot MAU (AC-30) | Vendor quote | Price + MAU band + date; or OUTSTANDING with source |
| C-02 | Required API entitlement, API-by-API (AC-28/29) | Tenant inspection (Phase A) + vendor confirmation | Entitlement table for M-01–M-21 (which need Enterprise) |
| C-03 | Session/revocation entitlement (AC-29 detail) | Tenant inspection + vendor confirmation | Session/refresh endpoint availability on the contracted plan |
| C-04 | EU tenant/residency statement (AC-31) | Vendor statement | Region/data-location statement (EU option; no Africa region) |
| C-05 | Support level and SLA (AC-31-adjacent) | Vendor statement | Support/SLA terms as evidence (no acceptance) |
| C-06 | Burundi SMS economics at pilot volumes (AC-32a) | Vendor/gateway source | Pricing + volumes + date; or OUTSTANDING |
| C-07 | Rwanda SMS economics at pilot volumes (AC-32b) | Vendor/gateway source | Pricing + volumes + date; or OUTSTANDING |
| C-08 | Applicable gateway options (AC-32c) | Vendor/gateway source | Twilio vs custom Action phone provider assumptions; built-in Auth0 SMS evaluation-only limit (100 lifetime messages) recorded |

## 17. Evidence specification (per-test template; AC-33)

Every test case retains exactly these fields (sanitized before persistence, §18):

```text
test_case_id, AC mapping, identity, phase, operation, endpoint, HTTP method, exact scope,
dashboard-vs-API path, sanitized request (IDs masked; no secrets/tokens/codes/seeds),
sanitized response (status + shape; values redacted), timestamps (UTC ISO-8601 + monotonic),
provider readback (verbatim shapes where oracle-relevant), correlation ID, factor IDs
(masked as appropriate), claim shape (redacted excerpts only), token scope-claim (phase ops),
pass/fail determination, reason, cleanup confirmation, operator checkpoint record (phase
boundaries), evidence-capture actor + tool versions.
```

Never persisted anywhere (repository, reports, logs, artifacts, chat): access tokens, refresh
tokens, client secrets, TOTP seeds, TOTP codes, QR secrets, private credentials, cookie values,
or App Check/service-account credentials. Claim shapes only, values redacted. No screenshots,
recordings, or pastes containing sensitive authentication material (§18).

## 18. Secret-handling execution checklist (SEC-01–SEC-13; AC-34)

Gate 1 §14/§14.1 controls preserved; Gate 2 fixes how each is verified.

| ID | Control | Verification method |
| --- | --- | --- |
| SEC-01 | `umask 077` for secret-bearing file creation | Shell startup check logged; created-file mode inspected (`stat`) |
| SEC-02 | No `set -x` (or equivalent tracing) in secret sessions | Session options dumped at start/end; no trace output in evidence |
| SEC-03 | No CLI secret literals (env/file-descriptor passing only) | Command history + evidence grep for literal patterns before persistence |
| SEC-04 | Shell-history suppression (`HISTFILE` unset/redirected or equivalent) | Post-session history inspection proving no secret landed |
| SEC-05 | Minimum child-process environment (secrets exported only to the exact command, narrowest scope) | Env snapshot diff per invocation; no ambient secret export |
| SEC-06 | Cleanup traps (temp files removed, env vars unset on exit/error/signal) | Trap handlers listed; post-exit filesystem + env verification |
| SEC-07 | Trusted/local-only execution by the authorized operator | Executor identity + host recorded; no untrusted-runner execution |
| SEC-08 | No live secrets in PR CI (CI runs documentation checks only) | CI workflow inspection; CI logs contain zero secret material |
| SEC-09 | Sanitized persisted output (redaction before disk/artifact/report) | Pre-persistence redaction pass logged per evidence file |
| SEC-10 | No screenshots/recordings/pastes with QR/seeds/codes/tokens/secrets/keys | Explicit attestation per evidence batch; violation ⇒ rotation + quarantine |
| SEC-11 | Repository scan (full diff) | Secret scan over the full diff, clean verdict recorded |
| SEC-12 | Evidence/artifact scan (reports, fixtures, logs, harness output) | Secret scan over all evidence artifacts, clean verdict recorded |
| SEC-13 | Credential revocation (M2M secret revoked/rotated, client deleted/disabled; refresh tokens revoked; sessions terminated; temp keys destroyed) | Revocation attestations + readbacks in §19 |

## 19. Cleanup contract (CL-01–CL-18; AC-35)

Exact checklist; record before-state where restoration is required (CL-10). Never delete provider
defaults — restore them. Unresolved mandatory cleanup ⇒
VALIDATION INCOMPLETE — CLEANUP REQUIRED (§24).

| ID | Resource | Action | Verification |
| --- | --- | --- | --- |
| CL-01 | Validation identities (`VAL-*`, incl. `VAL-X-pool`, `VAL-L-02`/recreated counterparts) | `DELETE /api/v2/users/{id}` (Phase F1) | `GET` absent per user |
| CL-02 | MFA enrollments (F1/F2 per identity) | `DELETE /api/v2/guardian/enrollments/{id}` per enrollment | M-01 absence + enrollment lists clean |
| CL-03 | Sessions | Revoke/terminate (M-07–M-10, Phase F2) | Session lists empty / introspection absent |
| CL-04 | Refresh tokens | Revoke/delete (M-12/M-13, Phase F2) | M-11 empty + by-ID 404 + failed exchange |
| CL-05 | M2M credentials + client | Disable/delete client; revoke secret (Phase F5) | Absent/disabled readback; revocation attestation |
| CL-06 | Test application A-1 | Delete (Phase F5) | `GET` absent |
| CL-07 | Custom validation API A-2 + client grants | Remove grants (operator, dashboard) + `DELETE /api/v2/resource-servers/{id}` (Phase F4) | Absent-readback; grant-removal record |
| CL-08 | Actions A-3 | Unbind Login Flow trigger BEFORE deleting; restore original bindings from snapshot; delete versions + action (Phase F3) | Absent-readback; binding restoration record |
| CL-09 | Action trigger binding restoration | Restore from CL-10 snapshot | Bindings match snapshot |
| CL-10 | Before-snapshots | Capture key names + non-secret values for every modified setting (Action bindings, connection enablement, app callbacks/settings, tenant/signing settings, API grants, email/prompt settings) | Snapshot inventory complete before first modification |
| CL-11 | Connection/application settings restoration | Restore enablement states, callbacks, settings (defaults restored, never deleted) | States match snapshot |
| CL-12 | Secondary linked/unlinked identities | Delete `VAL-L-02` + any recreated counterpart | Absent-readbacks |
| CL-13 | Client grants (A-2 API) | `DELETE /api/v2/client-grants/{id}` or dashboard equivalent | Absent-readback |
| CL-14 | Temporary files (`/tmp` scripts, fixtures) | Delete; never committed | Filesystem verification |
| CL-15 | Environment variables (secrets) | Unset via traps (SEC-06) | Env verification |
| CL-16 | Credentials/secrets (all validation) | Revoke/rotate/destroy (SEC-13) | Attestations |
| CL-17 | Issued JWT residual-expiry record | Record residual-expiry window per token type (no provider deletion exists for issued JWTs) | Window table in evidence |
| CL-18 | Tenant retention/deletion decision | Delete tenant only if the approved cleanup plan requires it AND provider/account permissions permit API deletion; otherwise execute the exact documented manual cleanup requirement; record tenant-log retention limits | Decision + authority recorded; manual-cleanup statement where applicable |

## 20. Complete pass/fail matrix (reconciliation)

Every test case terminates per §21. This matrix binds each case to its AC and Gate 1 section:

E-01–E-10 → entry (§1). R5-01–R5-12 → AC-06–AC-10 (Gate 1 §8), with dispatched sub-cases
R5-04a–R5-04e + M-13 gate (§8.4) and the concurrent Track A/B ordering (§§8.6/8.7). R7-01–R7-10 →
AC-01–AC-05 (Gate 1 §7), each destructive case gated on its `R5-BARRIER-R7(i)` invocation (§§9.6/9.7).
S-01–S-08 → AC-11/13 Contract S (Gate 1 §10). T-01–T-06 → AC-11/12 Contract T
(Gate 1 §10). MFA-01–MFA-14 → AC-14–AC-16 (Gate 1 §11). AM-01–AM-16 → AC-17–AC-21
(Gate 1 §§5/12). J-01–J-12 → AC-22–AC-26 (Gate 1 §12). AP-01–AP-09 → AC-27 (Gate 1 §13).
LOC-01–LOC-04 → AC-20 (Gate 1 §12/AM). C-01–C-08 → AC-28–AC-32 (Gate 1 §16).
SEC-01–SEC-13 → AC-34 (Gate 1 §14). CL-01–CL-18 → AC-35 (Gate 1 §15). AC-33 → §17.
AC-36 → completion report (§24).

Hard-gate rules: any R7 FAIL ⇒ AUTH0 NOT QUALIFIED (no averaging); any old context minting an
accepted token after the required boundary ⇒ R5 FAIL; both contracts disqualified on safety
grounds ⇒ POTENTIAL HARD AUTH0 BLOCKER; unresolved mandatory cleanup ⇒ VALIDATION INCOMPLETE —
CLEANUP REQUIRED; missing decision-material commercial evidence without waiver ⇒ VALIDATION
INCOMPLETE — COMMERCIAL EVIDENCE REQUIRED.

## 21. Result model (closed vocabulary)

Every test terminates as exactly one of:

- **PASS** — all steps green per the case's stated rule, evidence complete.
- **FAIL** — the fixed hypothesis is disproven (reported for architectural/provider disposition;
  never redesigned during execution).
- **INCOMPLETE** — evidence ungatherable (missing entitlement/observability/credentials, overlap
  unprovable, untestable replay) with recorded cause; never converted into PASS.
- **BLOCKED — AUTHORITY REQUIRED** — missing authority, prerequisite, or required resource
  (including new Firebase/App Check resources, §10/§14).
- **POTENTIAL HARD PROVIDER BLOCKER** — only where the section explicitly allows it (§§8/10: R5
  boundary unclosable with any clean contract; R7 hard failure at provider level).

Case counts: 109 exact numbered test cases (E: 10, R5: 12, R7: 10, S: 8, T: 6, MFA: 14,
AM: 16, J: 12, AP: 9, LOC: 4, C: 8) — unchanged by CORR-001. Counting rule: only top-level
numbered IDs count; lettered dispatched sub-cases (R5-04a–R5-04e, M-13 gate) are fixed variants
inside R5-04/R5-05 producing independent evidence under the parent number, and `R5-BARRIER-R7`
invocations produce independent per-identity evidence under the invoking R7 number. The canonical
numbered matrix is unchanged, so the reconciled count remains 109. R5 cases: 12. R7 cases: 10.
Contract S cases: 8. MFA cases: 14.
Auth-method matrix: 16 (Google AM-03 supported-test only; non-Google AM-01 mandatory).
Functions/JWKS cases: 12. App Check cases: 9. M2M phases: 11 (A/B/C/D/E/F1–F6).

### 21.1 Vocabulary audit (CORR-001: closed vocabulary enforced artifact-wide)

Searched terms reconciled — none terminates a case outside the §21 vocabulary:

| Term | Occurrences | Status |
| --- | --- | --- |
| `NOT TESTABLE` | None remain (AP-09 corrected to INCOMPLETE with cause) | Removed as a verdict |
| `N/A` | P-09/AM-03/§22 prose ("never N/A" prohibitions); Phase A/F6/R5-02/R5-03 table cells ("N/A (capture/readback)" field markers) | Prohibition text or non-verdict field marker only; never a case result |
| `NOT REQUIRED` / scope note | AM-15 conditional (no test executes where the governed matrix does not require it) | Scope note, not a verdict; no case terminates with it |
| `NOT EXECUTED with cause` | R5-04e conditional path only | Conditional-path record, not a verdict; the path executes or is recorded unexecuted with cause |
| `SKIP` / `UNKNOWN` / `DEFERRED` | None as verdicts anywhere in the artifact | — |
| `POTENTIAL HARD PROVIDER BLOCKER` | §§8/10 only, where explicitly authorized | Governed use only |

Every numbered case terminates in exactly one of PASS / FAIL / INCOMPLETE /
BLOCKED — AUTHORITY REQUIRED / POTENTIAL HARD PROVIDER BLOCKER (last only where authorized).

## 22. Stop conditions (STOP AND REPORT)

STOP (no further provider state; report BLOCKED — DECISION REQUIRED / AUTHORITY REQUIRED) if any:

1. Entry check E-01–E-10 FAILs (drift, changed authority, missing authorization).
2. `DEC-SEC-005`/R1–R10, `DEC-AUTH-002`, or `DEC-DATA-008` has changed.
3. Founder authorization of the exact package (E-03) cannot be verified.
4. Validation requires a new product/domain/architecture decision (including approving the domain
   cutoff — evidence may be gathered; approval is separate).
5. A security/integrity issue invalidates the approach (including observed exact-factor unsafety).
6. Scope cannot complete without materially changing an out-of-scope area (production state,
   migration, 003D resumption, persistence work, FD-COM-001 contact).
7. Unknown/unavailable scopes or endpoint contracts (never widen authority to compensate).
8. Required validation cannot be performed (missing tenant-creation capability ⇒ BLOCKED, not failure).
9. New Firebase/App Check resources required (STOP — ADDITIONAL AUTHORITY REQUIRED).
10. Destructive/irreversible action required but not explicitly authorized (incl. paid commitments).
11. Repo head/base materially drifted.
12. `202`-to-confirmed non-convergence or unavailable readback (§8.5 — F1 not deleted).
13. Current repository state conflicts materially with the handoff (per task §1).

Google tenant test unexecutable ⇒ AM-03 INCOMPLETE (never N/A bypass). Required commercial
evidence unobtainable without waiver ⇒ INCOMPLETE — COMMERCIAL EVIDENCE REQUIRED. Mandatory
cleanup unresolvable without retention authority ⇒ INCOMPLETE — CLEANUP REQUIRED. Missing
paid/Enterprise entitlement ⇒ affected evidence unavailable (INCOMPLETE), never provider failure,
never PASS.

## 23. Execution order (phases with gates)

```text
E-01–E-10 (entry; §1) → P-01–P-10 (prerequisites; §3) → Phase A (inventory, entitlement,
snapshots, N-A1/N-A2/N-A3 necessity; §7) → [Gate: A-1/A-2/A-3 created only as decided]
→ Phase B (identities, F1/F2, tickets, linking setup; §7) → MFA-12/MFA-01 observations,
AM-01–AM-16 matrix, LOC-01–LOC-04 → Phase C (R5-01–R5-11: dispatch + barrier record, then
CONCURRENT Track A observer (R5-06) + Track B attacker exercise (R5-08 attempt 1 pre-convergence),
then readback-gated R5-09/R5-10/R5-11; §8) → T-*/S-* cutoff experiment (§10) →
MFA-02–MFA-14 vectors (§11) → R7 track: per-identity R5-BARRIER-R7 under Phase C grant, §7
C→D micro-transition, then binding + delete + readback under Phase D (R7-01–R7-07; R5-12 on
VAL-R-01 follows the same micro-transition; §§9/9.6) → Phase E (J-01–J-12, AP-01–AP-09; §§13/14)
→ C-01–C-08 commercial capture (§16) → Phases F1–F6 (CL-01–CL-18; §19)
→ SEC-11/SEC-12 final scans (§18) → completion report AC-36 (§24)
```

Gate 1 (approach) is approved; Gate 2 (this artifact) requires independent review before broader
execution (Phase B setup beyond minimal tenant state waits for Gate 2 approval per WP §13).
No F1 deletion before its scenario's validated revocation barrier (R5-12 / R5-BARRIER-R7 B-9).
F1–F5 never overlap.
Tenant experimentation with test identities is not exempt from R5.

## 24. Final qualification rules (AC-36 shape; decided by execution, not here)

Maximum self-declared states (WP §14): AUTH0 QUALIFIED — AWAITING INDEPENDENT REVIEW (only when
all hard R5/R7 gates pass, required tenant behavioral tests pass, AM-03 passes, MFA claim evidence
passes, Functions/API contract evidence passes, mandatory cleanup complete or explicitly authorized,
and decision-material commercial evidence complete or explicitly waived) / AUTH0 NOT QUALIFIED —
AWAITING INDEPENDENT REVIEW (any hard R5/R7 invariant failure without a separately approved
11thONUS architecture legitimately satisfying it; commercial failure may also disqualify) /
VALIDATION INCOMPLETE — BOUNDED EVIDENCE STILL REQUIRED (incl. COMMERCIAL EVIDENCE REQUIRED and
BOUNDED EVIDENCE / CLEANUP REQUIRED variants) / BLOCKED — DECISION REQUIRED (authority/entitlement/
scope blocker). Never self-declared: selected, migration authorised, APPROVED, MERGED, CLOSED.
No averaging of security results. No redesign of failed hypotheses during execution.

## 25. Repository changes (this Gate 2 preparation task)

- New documentation-only Gate 2 contracts report (this file). Preserves every approved Gate 1
  contract without redesign: session-generation Contract S (§12 of this artifact; Gate 1 §10.1
  opaque branches, both-present equality, fail-closed absence/mismatch, equality-only operations);
  R5 revocation sequence + dual oracle + four-attempt exercise + CFG-07 cadence (§8; Gate 1 §8);
  R7 six-identity isolation + three races + genuine F2 proof (§9; Gate 1 §§4/7); MFA `otp`
  allowlist + 300 s hypothesis + `0 <= iat - mfa_time <= 300` + P-MFA + T-MFA-SSO (§11; Gate 1
  §11); phase-scoped dashboard/operator ledger with pinned grant identity, no self-modification
  (§7; Gate 1 §6); SPA + PKCE + rotation (§6 CFG-02; Gate 1 §5.2); HTTPS+Bearer+JWKS harness with
  Case A/B distinction (§13; Gate 1 §12); App Check ENFORCE matrix (§14; Gate 1 §13); secret
  controls (§18; Gate 1 §14); cleanup lifecycle (§19; Gate 1 §15); commercial evidence-only plan
  (§16; Gate 1 §16).
- Required tracking records: `docs/00-governance/documentation-changes-log.md` (Entries 199–200) and
  `docs/changes/IMPLEMENTATION_CHANGES.md` (Gate 2 preparation + CORR-001 entries).
- CORR-001 (this correction, bounded — no Gate 1 redesign): Phase C gains `read:guardian_enrollments`
  for the R5-06 M-01 readback; Phase D gains `read:users` for the M-04 readback, each Phase D token
  independently carrying the exact set (§7 + §7.5 audit: zero undeclared scopes); R5 paths assigned
  exactly (R5-04a M-07 / R5-04b M-09 / R5-04c–d M-10 both `preserve_refresh_tokens` values /
  R5-04e conditional M-08 / M-13 gated with M-12 fallback; §8.4 matrix); R5-08 runs concurrent with
  R5-06 polling (Track A/B) with the `t_old_context_attempt_1 < t_provider_converged` validity rule
  (§8.7), four attempts preserved and readback-gated; `R5-BARRIER-R7` invoked per R7 destructive
  identity with the §7 C→D micro-transition and the §9.7 dependency (barrier FAIL/INCOMPLETE/BLOCKED
  propagates); AP-09 corrected to INCOMPLETE with cause (§21.1 audit); numbered count reconciled at
  109 (lettered sub-cases and barrier invocations produce independent evidence under parent numbers).
- Production-code changes: **NONE**. Dependencies/config changes: **NONE**. Auth0 tenant/resources
  created: **NONE**. Live Auth0 API calls: **NONE**. `DEC-AUTH-002`, `DEC-SEC-005`/R1–R10,
  `DEC-DATA-008`, `FD-COM-001`, and the `AUTH-MFA-003D-IMPL-001` blocked state are consumed,
  unmodified. Auth0 remains LEADING CANDIDATE — NOT SELECTED.

## 26. Gate 2 completion state (GATE-2-PREP-001 + CORR-001: prepared, review pending)

**READY FOR FEF HIGH-RISK GATE 2 INDEPENDENT REVIEW — NOT APPROVED FOR LIVE EXECUTION**

This artifact is internally complete: 109 exact numbered test cases with per-case identity, phase,
endpoint, method, scope, request shape, expected status, readback, verdict rule, evidence fields,
and cleanup; exact R5 path assignment with the M-10 distinguisher; concurrent pre-convergence
Track A/B with proven timing; per-identity R5 barriers with the C→D micro-transition; 11-phase M2M
ledger with the §7.5 consistency audit; closed result vocabulary with the §21.1 audit; 24-section
coverage per the task §16 list (entry, authority, prerequisites, resources, identities, baseline,
ledger, method matrix, R5, R7, MFA, Contract S, Functions/JWKS, App Check, linking, localization,
commercial, secrets, cleanup, evidence template, pass/fail matrix, stop conditions, execution order,
qualification rules). Phase scopes reconcile exactly; all R5 paths are assigned; pre-convergence
timing is executable; every destructive R7 identity invokes its own R5 barrier; verdict vocabulary
is closed; no test-design choice remains for execution. Live execution introduces no material design
decision beyond recording observed provider shapes against the fixed verdicts.
Gate 2 approval, tenant creation, execution, qualification, and selection are all outstanding and
separately governed. Auth0 is NOT SELECTED. Do not self-approve Gate 2. Do not merge unless
separately instructed.
