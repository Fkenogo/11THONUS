# AUTH-ARCH-002-VAL-001 — Auth0 Bounded Provider Evidence Programme

> **Status:** **EVIDENCE RECORDED — LIVE PORTION STOPPED (NO AUTHORISED TENANT)**
> **Classification:** Validation only — NO SELECTION / NO MIGRATION / NO IMPLEMENTATION
> **Date:** 2026-09-08
> **Repository:** `https://github.com/Fkenogo/11THONUS.git` (authoritative source of truth)
> **Entry `origin/main`:** `ee899032b4734260697c47635aaaa136aadf7cda`
> **Branch:** `codex/auth-arch-002-val-001` (isolated worktree; PR #235 remains the untouched assessment basis)
> **Authority boundary:** this report records evidence; it does not select Auth0, migrate authentication, remove Firebase Authentication, resume `AUTH-MFA-003D-IMPL-001`, change R1–R10, create production configuration, migrate users, or decide persistence.

## 1. Governing authority (verified from repository evidence)

| Premise | Repository evidence | Verdict |
| --- | --- | --- |
| External managed IdP direction approved | `DEC-AUTH-002` / `FD-AUTH-ARCH-001` present on `origin/main` | Confirmed |
| Firebase Authentication no longer the target | `DEC-AUTH-002` final decision text | Confirmed |
| Auth0 leading candidate but NOT SELECTED | `AUTH-ARCH-002` (PR #235 basis), recommendation C | Confirmed |
| Provider validation still required | `AUTH-ARCH-002` §16 bounded evidence | Confirmed |
| `AUTH-MFA-003D-IMPL-001` remains blocked | WP file: authorisation VALID, execution BLOCKED — DECISION REQUIRED — AUTHENTICATION ARCHITECTURE REASSESSMENT | Confirmed |
| R1–R10 fixed | `DEC-SEC-005` / `FD-MFA-R` present (7 references), unamended | Confirmed |

Premises hold — not `BLOCKED — DECISION REQUIRED`. No authority inferred.

## 2. FEF alignment

Active framework `Fkenogo/founder-engineering-framework` inspected read-only (558 paths). Applicable controls: `FEF-EWPCS-001` §§3.1–3.5 (entry-gate discipline: repository state, governing authority, objective, scope, dependencies). FEF is not used to create missing authority. Per §3.5, the live tenant-backed portion is **blocked by external validation** (missing dependency: authorised segregated tenant + resource-creation authority). No FEF implementation WP is instantiated for the blocked live portion — instantiating one now would presume the missing authorization. The stop rule in §3 below is the FEF-consistent outcome.

## 3. Validation-environment authority (live-portion stop)

Checks performed (read-only): repository-wide search for Auth0 tenant/credentials (only `AUTH-ARCH-001` assessment mentions found); local env key inventory (Firebase keys only; **no `AUTH0_*` entries**); no Founder authorization for tenant creation/procurement anywhere in the decision register.

- No authorised segregated Auth0 validation tenant exists.
- No authority exists to create one (`DEC-AUTH-002` authorizes direction + validation scoping, not resource creation).
- **Live portion STOPPED per task §3.** No provider resources created "merely because they are needed."

Required authorization/resource (exact): (a) Founder authorization to create and fund a segregated non-production Auth0 tenant (Enterprise-capable, per §16 evidence scope) with validation-only M2M credentials under least privilege, isolated from production, free of real customers/administrators; (b) a controlled FEF validation work package governing the live execution, if FEF is judged to require one; (c) supplier engagement for the Enterprise quote and SMS-gateway economics. Until then, V1-B/C/D behavioral, V2 observed-completion, V4 token-observation, and V5 live-contract evidence remain **UNRESOLVED (blocked, not failed).**

## 4. Validation standard applied

Kill-or-qualify: attempt to disprove Auth0. Evidence classes: **DOCUMENTED PROVIDER GUARANTEE** · **OBSERVED VALIDATION BEHAVIOUR** · **11THONUS REPOSITORY EVIDENCE** · **INFERENCE** · **UNRESOLVED**. No observation is promoted to a guarantee; R1–R10 are not weakened for provider limitations.

## 5. V1 — Exact-factor administrative recovery (doc-level + stopped live)

Documented (guarantee-level for shape): Guardian enrollment IDs (`totp|dev_…`); `GET /guardian/enrollments/{id}` (`read:guardian_enrollments`, `200` with pending/confirmed status); `DELETE /guardian/enrollments/{id}` (`delete:guardian_enrollments`, `204`, names one enrollment); multiple enrollments supported; enrollment tickets (`create:guardian_enrollment_tickets`, single-use, 5-day expiry).

Disproof attempts and their outcomes:

- **V1-A exact F1 deletion:** endpoint/identifier/scopes/response/readback all documented → shape sufficient. Behavioral execution needs the tenant → UNRESOLVED (blocked).
- **V1-B F1/F2 race:** no documentation suggests deletion addresses anything but the named enrollment (contrast Firebase whole-list / Cognito unaddressed delete). No provider-side weakness found on paper — but the R7 result requires the tenant sequence → UNRESOLVED (blocked).
- **V1-C retry/absent F1:** documented delete responses are 204/400/401/403 with **no stated 404-or-idempotent contract** → retry semantics UNRESOLVED (tenant must determine; an absent F1 must never remove another factor — unproven until tested).
- **V1-D concurrency/replay:** no documented serialisation or precondition primitive on Guardian delete → UNRESOLVED (tenant must determine ordering/error semantics).
- **V1-E least privilege:** minimum scopes identified (`read:guardian_enrollments`, `delete:guardian_enrollments`, `create:guardian_enrollment_tickets`); no broad scopes needed → DOCUMENTED.

**V1 verdict: shape sufficient, no doc-level disproof; behavioral proof INCOMPLETE (blocked on tenant). Not a FAIL.**

## 6. V2 — Revocation contract (doc-level + stopped live)

Five layers validated separately against current docs (all Enterprise-gated session/refresh APIs; `202 Accepted` async/eventually consistent throughout; refresh tokens survive session deletion unless revoked with `preserve_refresh_tokens: false`; issued access/ID JWTs non-revocable, valid until `exp`; readback via `GET` sessions / refresh-tokens / enrollment-by-ID).

Critical rule preserved: `202 Accepted` is never described as confirmation. Whether readback polling converges within a bound sufficient for fail-closed factor reset is **UNRESOLVED (blocked on tenant)**. Residual usability after requested revocation is documented as nonzero during convergence — the exact gap the §4 cutoff must close.

## 7. Issued-JWT behavior (§8) — documented disproof of the naive assumption

Confirmed from the official custom-API access-token sample: claims are `iss, sub, aud[], azp, exp, iat, scope` — **no `auth_time`, no `sid`**. (`sid` exists in ID Tokens/Logout Tokens per session docs; APIs must not consume ID tokens for authorization.) Provider session/refresh deletion does not affect issued JWTs. **Do not assume session revocation invalidates issued JWTs — disproved assumption recorded.**

## 8. Cutoff feasibility (§9) — material gap recorded, closings identified

The documented access-token shape makes the §9 race real: a pre-revocation session/refresh token can mint a JWT **after** the 11thONUS cutoff with a post-cutoff `iat`, and nothing in the native token marks it as pre-cutoff generation. A bare-`iat` cutoff is therefore **disproved as sufficient** (kill-or-qualify working as intended).

Feasible closings (design only, no implementation authorised):

- (a) Action-emitted **namespaced** session-generation claim (tenant must prove emission into access tokens; bare `amr` key is restricted);
- (b) server-side block-until-fresh-post-recovery-authentication (purely domain-side; needs the "re-authenticated after cutoff" signal design + Founder/security authority).

Cutoff feasibility verdict: **DECISION REQUIRED** (unchanged classification, harder evidence) — tenant proof of (a) or adoption + authority for (b). The V5 harness below proves the comparison logic, not claim availability.

## 9. V5 disposable contract (OBSERVED VALIDATION BEHAVIOUR — mechanics only)

Disposable harness `/tmp/val001-v5-harness.cjs` (dependency-free Node 22 `node:crypto`; synthetic keys/tokens only; never committed; no repo impact): local RSA keypair + JWKS, RS256 sign/verify, allowlisted `alg`, `kid` resolution, `iss`/`aud`/`exp` checks, `sub` extraction, cutoff seam comparing session-generation with fail-closed on absence.

Command: `node /tmp/val001-v5-harness.cjs` → **11/11 checks passed**: valid passes; wrong issuer; wrong audience; expired; malformed; tampered payload (bad signature); `alg=none` rejected; unknown `kid` (rotation → fail closed); **post-cutoff `iat` + pre-cutoff `auth_time` rejected (the §9 race)**; missing `auth_time` fails closed; fresh post-recovery generation passes. (One initial harness-expectation error — a "valid" fixture whose `auth_time` predated the cutoff was correctly rejected — was fixed in the fixture, confirming the seam bites.)

Proves: Architecture-A verification mechanics + cutoff comparison logic. Does not prove: provider claim availability, JWKS operations, or any live behavior.

## 10. V3 / V4 / V6 confirmations

- **V3 methods:** no change to `AUTH-ARCH-002` §5 — all requirements natively supportable; phone remains gateway-dependent; V3 tenant matrix stays in the evidence gate.
- **V4 MFA evidence:** `amr=[mfa]` post-hosted-MFA, omitted on silent/refresh renewal, absent from access tokens by default (namespaced Action claim required). `verifiedSecondFactor` discipline preserved (true only from verified genuine-satisfaction evidence; no client/persisted substitute).
- **V6 commercial:** September-2026 pricing re-confirmed current (Free $0 ≤25k; B2C Essentials $35@500; B2C Pro $240@500; Enterprise quote-only for required APIs; regions US/UK/EU/AU/JP/CA, no Africa). No Enterprise price invented → **`COMMERCIAL VALIDATION INCOMPLETE — FOUNDER/ACCOUNT CONTACT REQUIRED`**: request (i) Enterprise quote for session + refresh-token Management APIs at pilot MAU, (ii) SMS-gateway pricing for Burundi/Rwanda pilot volumes, (iii) EU-residency confirmation.
- **Burundi/Rwanda:** governed phone requirement is optional/non-default; delivery via Twilio or custom Action gateway; economics unknown → part of the commercial request above.

## 11. DATA-ARCH-001 interface facts (auth-related only, no persistence decisions)

Future combined architecture must consume: `AuthenticationReference` `{provider}:{subject}` keying (new `auth0_*` namespace; dual-lookup transition); per-user revocation-epoch storage colocated with the recovery lifecycle; no new persistence demands beyond one small epoch record per recovery target. No PostgreSQL/Firestore decisions made.

## 12. Evidence matrix (§19)

| Gate | Result |
| --- | --- |
| Exact F1 deletion | INCOMPLETE (shape documented; execution blocked) |
| F1/F2 replacement safety | INCOMPLETE (no doc weakness; tenant sequence blocked) |
| Retry/idempotency | INCOMPLETE (no 404/idempotent contract documented) |
| Session revocation | INCOMPLETE (202/async documented; bounded completion blocked) |
| Refresh-token revocation | INCOMPLETE (same) |
| Issued-JWT treatment | PASS (non-revocable until `exp` — documented) |
| Domain cutoff feasibility | DECISION REQUIRED (bare-`iat` disproved; closings (a)/(b) need tenant proof + authority) |
| MFA evidence | INCOMPLETE (contract documented; tenant observation blocked) |
| Email/password | PASS (documented) |
| Email verification/reset | PASS (documented) |
| Google | PASS (documented) |
| TOTP | PASS (documented primitives; admin recovery execution blocked) |
| EN/FR | PASS (documented; tenant matrix in gate) |
| Functions transport | DECISION REQUIRED (mechanics proven 11/11; callable-vs-HTTPS + live contract in gate) |
| App Check compatibility | PASS (independent attestation; enforcement design-only) |
| Identity mapping | PASS (design preserves domain authority) |
| Account linking | PASS (adapter-disciplined; live discipline check in gate) |
| Operations | PASS (endpoint/scope coverage documented) |
| Commercial | INCOMPLETE (published pricing current; quote + gateway economics require vendor contact) |

No hard R5/R7 failure observed; no behavioral PASS claimed where a tenant is required. A hard failure cannot be outweighed — none is recorded, and none is cleared either.

## 13. Closure records

- `AUTH-MFA-003D-IMPL-001` not resumed (still blocked); R1–R10 unaltered.
- Secret scan: full diff inspected — **no secrets** (no client/M2M secrets, tokens, TOTP material, keys, or credentials; only synthetic `auth0|test-subject-1` fixture identifiers inside `/tmp`, never committed).
- Rollback/cleanup: revert the VAL-001 commit(s); delete `/tmp/val001-v5-harness.cjs`; close the PR unmerged if directed; no provider/data cleanup exists (nothing created).
- Tests: V5 harness 11/11 (disposable, `/tmp`); repo CI on the PR head (below).

**`VALIDATION INCOMPLETE — SPECIFIC BOUNDED EVIDENCE STILL REQUIRED`**
