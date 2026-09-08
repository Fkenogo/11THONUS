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
| Auth0 leading candidate but NOT SELECTED | `AUTH-ARCH-002` (PR #235 basis — pinned: branch `codex/auth-arch-002-validation`, immutable head `1f34a4e58dfccb6fde5d11221d8b6a821b4bf7b0`, artifact `docs/05-implementation/reports/AUTH-ARCH-002-external-idp-hard-invariant-validation-2026-09-08.md`; cited content verified at that commit: recommendation C status line, §4 hardened cutoff, §15 matrix, §16 seven-item gate), recommendation C | Confirmed |
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
- Tests: V5 harness 11/11 (disposable, `/tmp`; full script preserved in the Appendix below for reproducibility); repo CI on the PR head (below).

## Appendix — V5 disposable harness (evidence artifact, not repo code)

Executed `node /tmp/val001-v5-harness.cjs` (Node v22.23.2, zero dependencies, synthetic keys/tokens only) → `VAL-001 V5 harness: 11/11 checks passed`. Embedded verbatim so a future review can reproduce the result without the ephemeral `/tmp` file:

```cjs
// VAL-001 disposable contract harness (NOT repo code — /tmp only, never committed).
// Validates the Architecture-A verification mechanics for an external IdP JWT:
// RS256 via local JWKS, issuer/audience/expiry, negative cases, sub + session-generation
// signal extraction, and the domain-cutoff comparison seam (auth_time-based, fail-closed).
const { generateKeyPairSync, createSign, createVerify, createHash } = require('node:crypto');

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const b64urlJson = (o) => b64url(JSON.stringify(o));

// ---- keypair + JWKS (simulates Auth0 tenant signing key) ----
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = publicKey.export({ format: 'jwk' });
const KID = 'val-001-test-key';
const JWKS = { keys: [{ ...jwk, kid: KID, alg: 'RS256', use: 'sig' }] };

const TENANT = 'https://val-001-test.us.auth0.com/';
const AUD = 'https://api.11thonus.test';
const NOW = Math.floor(Date.now() / 1000);

function mint(payload, kid = KID, alg = 'RS256') {
  const header = b64urlJson({ alg, typ: 'JWT', kid });
  const body = b64urlJson(payload);
  const sig = createSign('RSA-SHA256').update(`${header}.${body}`).sign(privateKey);
  return `${header}.${body}.${b64url(sig)}`;
}
function basePayload(over = {}) {
  return { iss: TENANT, aud: AUD, sub: 'auth0|test-subject-1', iat: NOW - 60, auth_time: NOW - 300, exp: NOW + 300, ...over };
}
// ---- verifier under test (mirrors the proposed TokenVerifierPort adapter logic) ----
function verify(token, { jwks, iss, aud, cutoffEpoch }) {
  const fail = (r) => ({ ok: false, reason: r });
  const parts = token.split('.');
  if (parts.length !== 3) return fail('malformed');
  let h, p;
  try { h = JSON.parse(Buffer.from(parts[0], 'base64url')); p = JSON.parse(Buffer.from(parts[1], 'base64url')); }
  catch { return fail('malformed'); }
  if (h.alg !== 'RS256') return fail('alg-not-allowlisted');
  const key = (jwks.keys || []).find((k) => k.kid === h.kid);
  if (!key) return fail('unknown-kid');
  const keyObj = require('node:crypto').createPublicKey({ key, format: 'jwk' });
  const sigOk = createVerify('RSA-SHA256').update(`${parts[0]}.${parts[1]}`).verify(keyObj, Buffer.from(parts[2], 'base64url'));
  if (!sigOk) return fail('bad-signature');
  if (p.iss !== iss) return fail('wrong-issuer');
  if (p.aud !== aud) return fail('wrong-audience');
  if (typeof p.exp !== 'number' || p.exp <= NOW) return fail('expired');
  // cutoff seam: immutable session-generation signal only; fail closed when absent
  if (typeof p.auth_time !== 'number' || !Number.isFinite(p.auth_time)) return fail('missing-auth-time');
  if (p.auth_time < cutoffEpoch) return fail('pre-cutoff-generation');
  return { ok: true, sub: p.sub, auth_time: p.auth_time };
}

const CUTOFF = NOW - 120; // revocation epoch: session generation older than this is dead
let pass = 0, total = 0;
function check(name, cond) { total++; if (cond) pass++; else console.log('FAIL:', name); }

// 1. valid token (session generation after cutoff) passes, sub + auth_time extracted
let r = verify(mint(basePayload({ iat: NOW - 50, auth_time: NOW - 50 })), { jwks: JWKS, iss: TENANT, aud: AUD, cutoffEpoch: CUTOFF });
check('valid passes', r.ok && r.sub === 'auth0|test-subject-1' && r.auth_time === NOW - 50);
// 2. wrong issuer
check('wrong issuer', verify(mint(basePayload({ iss: 'https://evil.example.com/' })), { jwks: JWKS, iss: TENANT, aud: AUD, cutoffEpoch: CUTOFF }).reason === 'wrong-issuer');
// 3. wrong audience
check('wrong audience', verify(mint(basePayload({ aud: 'https://other.example/' })), { jwks: JWKS, iss: TENANT, aud: AUD, cutoffEpoch: CUTOFF }).reason === 'wrong-audience');
// 4. expired
check('expired', verify(mint(basePayload({ exp: NOW - 1 })), { jwks: JWKS, iss: TENANT, aud: AUD, cutoffEpoch: CUTOFF }).reason === 'expired');
// 5. malformed
check('malformed', verify('not.a.jwt.at.all.extra', { jwks: JWKS, iss: TENANT, aud: AUD, cutoffEpoch: CUTOFF }).reason === 'malformed');
// 6. tampered payload (bad signature)
{
  const t = mint(basePayload()).split('.');
  const evil = b64urlJson({ ...basePayload(), sub: 'auth0|attacker' });
  check('tampered', verify(`${t[0]}.${evil}.${t[2]}`, { jwks: JWKS, iss: TENANT, aud: AUD, cutoffEpoch: CUTOFF }).reason === 'bad-signature');
}
// 7. alg confusion (alg=none)
check('alg-none', verify(mint(basePayload(), KID, 'none'), { jwks: JWKS, iss: TENANT, aud: AUD, cutoffEpoch: CUTOFF }).reason === 'alg-not-allowlisted');
// 8. unknown kid (rotation case → refresh path, fail closed here)
check('unknown kid', verify(mint(basePayload(), 'unknown-kid'), { jwks: JWKS, iss: TENANT, aud: AUD, cutoffEpoch: CUTOFF }).reason === 'unknown-kid');
// 9. pre-cutoff generation rejected even though iat is fresh (THE §9 race)
check('post-cutoff iat + pre-cutoff auth_time rejected',
  verify(mint(basePayload({ iat: NOW - 5, auth_time: NOW - 300 })), { jwks: JWKS, iss: TENANT, aud: AUD, cutoffEpoch: CUTOFF }).reason === 'pre-cutoff-generation');
// 10. missing auth_time fails closed
{
  const { auth_time, ...noAT } = basePayload();
  check('missing auth_time', verify(mint(noAT), { jwks: JWKS, iss: TENANT, aud: AUD, cutoffEpoch: CUTOFF }).reason === 'missing-auth-time');
}
// 11. fresh post-recovery session passes
check('post-cutoff generation passes',
  verify(mint(basePayload({ iat: NOW - 5, auth_time: NOW - 10 })), { jwks: JWKS, iss: TENANT, aud: AUD, cutoffEpoch: CUTOFF }).ok === true);

console.log(`\nVAL-001 V5 harness: ${pass}/${total} checks passed`);
process.exit(pass === total ? 0 : 1);
```

**`VALIDATION INCOMPLETE — SPECIFIC BOUNDED EVIDENCE STILL REQUIRED`**
