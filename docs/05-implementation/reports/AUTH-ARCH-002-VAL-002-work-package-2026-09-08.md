# AUTH-ARCH-002-VAL-002 — Auth0 Live Hard-Invariant Validation

- **Template ID:** FEF-EWPCS-001-TPL-WP-001
- **Parent standard:** FEF-EWPCS-001 — Engineering Work Package & Closure Standard v1.0
- **Template status:** APPROVED — ACTIVE companion template
- **Template effective date:** 2026-09-07
- **FEF source:** `Fkenogo/founder-engineering-framework`, branch `origin/docs/fef-ewpcs-001-companion-templates` at `2db8b7026382a288cfa7fa18483e60341d1fb052` (standard `docs/engineering/FEF-EWPCS-001-ENGINEERING-WORK-PACKAGE-CLOSURE-STANDARD.md`; templates `docs/templates/FEF-EWPCS-001-WORK-PACKAGE-TEMPLATE.md` and `docs/templates/FEF-EWPCS-001-COMPLETION-REPORT-TEMPLATE.md`). No custom structure is invented where the FEF template governs.
- **Instantiation status:** **AUTHORISED** under `FD-AUTH-ARCH-002-VAL-002` (Founder execution authorization recorded 2026-09-08; see Current programme state for execution state, which authorization plus the remaining Entry Gate and High-Risk Review Gate checkpoints determine).
- **Founder authorization date:** 2026-09-08
- **Founder-reviewed pre-authorization WP head:** `2e6e139b711f61747e555038ea707f883697ef00`
- **Founder execution authorization reference:** `FD-AUTH-ARCH-002-VAL-002`
- **Correction history:** CORR-001 (four PR #238 review findings corrected; see Entry 190). Authorization recorded after correction; no substantive acceptance criterion, security invariant, validation/cleanup requirement, or qualification gate changed by this recording.
- **Authority amendment AMEND-001:** `FD-AUTH-ARCH-002-VAL-002-AMEND-001` (Founder bounded provider-resource authority amendment recorded 2026-09-09 on PR #239; need identified by Gate 1 CORR-001 §20 items A-1–A-3). Adds only the minimum disposable validation objects — at most one login-capable application (A-1), exactly one custom validation API/resource server (A-2), at most two Login Flow Actions with one preferred (A-3) — plus their cleanup and default-connection configuration; see the amended provider permission table. No AC-01–AC-36, R1–R10, High-Risk Review Gate, selection state, Merge = NO, or production-prohibition change; no domain-cutoff or Action-claim architecture approval; original authorization history preserved.
- **Provider selection state:** Auth0 remains **LEADING CANDIDATE — NOT SELECTED**; this package does not select a provider.

> This is the sole authoritative project work package for `AUTH-ARCH-002-VAL-002`. It instantiates the official FEF template and records a controlled validation-execution contract with bounded Founder execution authorization; it does not select Auth0, migrate authentication, amend product or security policy, authorise production state, or create any provider tenant, credential, or live validation result.

# Work Package

- **Work Package ID:** `AUTH-ARCH-002-VAL-002`
- **Title:** Auth0 Live Hard-Invariant Validation
- **Objective:** Validate, in a segregated non-production Auth0 environment, whether Auth0 satisfies the hard 11thONUS authentication/security invariants required for provider selection, with particular focus on exact-factor recovery, session/token revocation, MFA evidence, external-token transport, and operational/commercial fit, without creating production dependency or migration state.
- **Primary concern:** qualify or disqualify Auth0 from Founder provider selection.
- **Repository:** `Fkenogo/11THONUS`
- **Authoritative remote:** `https://github.com/Fkenogo/11THONUS.git` (`origin`)
- **Base branch:** `main`
- **Expected entry SHA:** `375c145dbc63ff174e8682c8f055d50d1fda5e61` at work-package authoring (PR #237 merge, verified against `origin/main` before authoring); the future execution agent must fetch and record the current authoritative `origin/main` SHA before execution.
- **Working branch / branch rule:** Create a dedicated `codex/`- or `docs/`-prefixed execution branch from the verified current `origin/main`; do not execute in a dirty primary worktree. This authoring task uses branch `docs/auth-arch-002-val-002-wp` in an isolated worktree.
- **Governing authority:** `DEC-AUTH-002` / `FD-AUTH-ARCH-001` (external managed IdP direction; Auth0 NOT selected); `AUTH-ARCH-001` (closed assessment basis); `AUTH-ARCH-002` (recommendation C — validation incomplete, specific bounded evidence required); `AUTH-ARCH-002-VAL-001` (bounded evidence programme; authorised for bounded live validation, not yet executed); `DEC-SEC-005` / `FD-MFA-R` R1–R10 (fixed security invariants, unchanged); `DEC-SEC-004` / `FD-MFA-2` where still applicable; `DEC-DATA-008` / `FD-DATA-ARCH-001` (independently settled persistence direction, acknowledged and unchanged).
- **Validation-environment authority:** `FD-AUTH-ARCH-002-VAL-001` (recorded per `AUTH-ARCH-002-VAL-AUTH-001`, Entry 188) — creation and/or controlled use of a segregated non-production Auth0 validation tenant solely for the bounded `AUTH-ARCH-002` hard-invariant validation. Authorization ≠ execution.
- **Current programme state:** **AUTHORISED — READY FOR CONTROLLED VALIDATION EXECUTION.** Founder authorisation (`FD-AUTH-ARCH-002-VAL-002`) recorded 2026-09-08 against reviewed pre-authorization WP head `2e6e139b711f61747e555038ea707f883697ef00`. This bounded execution authority permits only the validation programme defined by this WP after merge; it does not select Auth0, authorize migration or a production tenant, authorize production users or data, resume `AUTH-MFA-003D`, authorize PostgreSQL implementation, change R1–R10, make Google authentication mandatory for users, waive any validation or commercial evidence requirement, or waive the remaining Entry Gate or High-Risk Review Gate checkpoints.
- **Related blocked state (context only, unchanged):** `AUTH-MFA-003D-IMPL-001` remains authorisation-VALID / execution-BLOCKED (`FD-AUTH-MFA-003D-IMPL-001` VALID; BLOCKED — DECISION REQUIRED — AUTHENTICATION ARCHITECTURE REASSESSMENT). This package does not resume it.
- **Work package owner / execution agent:** Future validation-execution agent, subject to Founder authorisation of this exact package and all remaining gates.
- **Review authority:** Independent security/engineering reviewer on the exact execution head, plus Gate 1 / Gate 2 / final reviewers as defined in §13.
- **Approval authority:** Founder or an explicitly designated approval authority. Provider selection itself remains a separate future Founder disposition and is not granted here.

## 1. Entry Gate

Confirm before validation execution:

- [x] Repository and authoritative remote verified for this work-package authoring (`origin/main` `375c145dbc63ff174e8682c8f055d50d1fda5e61`).
- [x] Base branch and authoring entry SHA verified; `origin/main` confirmed current at authoring (no drift from the expected handoff SHA).
- [x] Clean isolated worktree; no unresolved merge/rebase/cherry-pick state.
- [x] Exact Work Package ID (`AUTH-ARCH-002-VAL-002`) reconciled with repository conventions — no `VAL-002` record exists; smallest compatible identifier used; programme title not materially renamed.
- [x] Governing authority identified and consumed from repository evidence: `DEC-AUTH-002`, `FD-AUTH-ARCH-001`, `AUTH-ARCH-001`, `AUTH-ARCH-002`, `AUTH-ARCH-002-VAL-001`, `FD-AUTH-ARCH-002-VAL-001`, `DEC-SEC-005` / `FD-MFA-R` R1–R10, `DEC-DATA-008`, and the current `AUTH-MFA-003D-IMPL-001` blocked state. No new product/security authority created.
- [x] FEF-EWPCS-001 v1.0 and its Work Package and Completion Report templates verified **APPROVED — ACTIVE**, effective 2026-09-07 (source recorded above).
- [x] Dependencies checked (§5); satisfied vs remaining execution dependencies distinguished.
- [x] `origin/main` CI verified healthy at authoring (recent main-branch CI runs SUCCESS, including PR #235/#236/#237 merges).
- [x] No Auth0 tenant, credential, provider call, production code, configuration, dependency, or migration state created in this authoring task.
- [x] Founder execution authorization for this exact bounded package recorded 2026-09-08 as `FD-AUTH-ARCH-002-VAL-002`, against reviewed pre-authorization WP head `2e6e139b711f61747e555038ea707f883697ef00`.
- [ ] Future execution agent: fetch authoritative remote state and record the current `origin/main` SHA and branch ahead/behind state; stop if the base has materially drifted.
- [ ] Future execution agent: use a clean, isolated worktree with no unresolved merge, rebase, or cherry-pick state.
- [ ] Future execution agent: verify this exact FEF work package is merged and remains authoritative, and that Founder authorisation of this exact package is recorded.
- [ ] Future execution agent: verify `FD-AUTH-ARCH-002-VAL-001` still applies and no governing authority (`DEC-SEC-005`, R1–R10, `DEC-AUTH-002`) has changed.
- [ ] Future execution agent: confirm access to Auth0 account/tenant-creation capability, required validation entitlement, M2M setup availability, Google/social test credentials (required for AC-19), commercial contact path, and SMS-evidence sources — or record the affected evidence as unavailable per §15 rather than assuming it.
- [ ] Future execution agent: verify the secret-handling plan (§13-adjacent contract in Required Implementation) is in place before creating any provider state beyond minimal tenant setup.

### Hard Authority Stop

The execution agent verifies authority; it does not create or reinterpret it. `FD-AUTH-ARCH-002-VAL-001` authorises the validation *environment*; it does not authorise *execution* of this work package. `DEC-AUTH-002`, `DEC-SEC-005`, the assessments, a roadmap position, or a plausible package identifier do **not** independently authorise execution, amend R1–R10, waive any Entry Gate or High-Risk Review Gate checkpoint, or select a provider. Validation success does not equal provider selection.

If the recorded Founder authorisation of this exact package cannot be verified, or an execution-time authority, prerequisite, entitlement, or security invariant is missing, report:

**BLOCKED — DECISION REQUIRED**

## 2. In Scope

Once Founder-authorised, this work package may execute exactly the bounded live validation below — and nothing else:

- Creation and/or controlled use of **one** segregated non-production Auth0 validation tenant.
- Validation-only users (disposable test identities; no real customers, no production administrator identities, no production data).
- Least-privilege M2M client/credentials for Management API validation calls.
- TOTP enrollment/recovery tests.
- F1/F2 exact-factor tests (list F1/F2 enrollments; delete F1 by ID; read back F1/F2; prove F2 untouched).
- Retry/idempotency tests (already-absent-F1 handling; idempotency determination; concurrent delete-vs-enroll ordering).
- Session deletion/revocation tests, including readback-polling convergence and 202-to-confirmed latency distribution.
- Refresh-token revocation tests, including `preserve_refresh_tokens` behaviour verification.
- JWT lifecycle/claim tests (issued-JWT behaviour after revocation; `iss`/`sub`/`aud`/`azp`/`exp`/`iat`/`scope` shapes; no `auth_time`/`sid` assumption).
- MFA evidence tests (`amr` values, refresh/silent omission, namespaced access-token MFA claim behaviour).
- Email/password tests; verification/reset flows.
- Google tenant login tests with test contacts (required per AC-19; unavailable credentials ⇒ VALIDATION INCOMPLETE, not a pass).
- EN/FR localization tests.
- External JWT → Functions/API disposable contract validation (end-to-end contract test plus the callable-vs-HTTPS transport decision evidence).
- App Check coexistence validation.
- Account-linking validation (linking semantics).
- Management API scope verification (least-privilege scopes, e.g. `read:guardian_enrollments`, `delete:guardian_enrollments`, `create:guardian_enrollment_tickets`).
- Enterprise plan/API entitlement confirmation.
- Commercial quote request (Enterprise quote for the exact required APIs).
- Burundi/Rwanda SMS/gateway evidence gathering (pricing for pilot volumes).
- Region/data-location confirmation (EU-residency and related operational facts).
- Sanitized evidence capture per §11-area Evidence Required.
- Cleanup of validation resources per §14-adjacent contract in Required Implementation.

## 3. Out of Scope

This work package must not decide, redesign, migrate, replace, or expand any of the following:

- Selecting Auth0 as the production identity provider (a separate future Founder disposition).
- Production Auth0 tenant creation.
- Production migration of any kind.
- Firebase Auth removal or alteration.
- Real-user migration.
- Real Platform Administrator migration.
- Resuming `AUTH-MFA-003D-IMPL-001` (remains authorisation-VALID / execution-BLOCKED).
- Changing R1–R10 or `DEC-SEC-005`.
- PostgreSQL implementation; Cloud SQL provisioning; combined architecture transition.
- Production Functions conversion.
- Unrelated authentication refactoring.
- Entering any paid contract or accepting paid terms (supplier engagement is evidence-only).
- Merge, approval, or closure of this package by the execution agent.

## 4. Deferred Decisions

- Google/social test credential sourcing and test-contact selection are execution details; the Google tenant test itself is required (AC-19), not optional — nothing about its necessity is assumed or decided here beyond the cited authority.
- Auth0 Enterprise-capable validation entitlement: if any required API or behaviour needs an entitlement the validation tenant lacks, the affected evidence is recorded as unavailable (VALIDATION INCOMPLETE), not as a failure — see §15.
- Whether the validation tenant itself is retained as the standing non-production test tenant or cleaned up is a Founder/operational-plan decision (see Required Implementation, cleanup item); the execution agent does not decide retention.
- The §4 domain-owned token/session revocation cutoff remains candidate architecture requiring validation evidence plus separate Founder/security authority; it is not approved here.
- Commercial quote availability, SMS-gateway pricing depth, and region/data-location answers depend on vendor contact and are recorded as obtained or outstanding — never invented.
- Live validation execution sequencing within the authorised scope is an execution detail governed by the §13 review gates, not decided here.

A deferred matter is not implementation authority.

## 5. Dependencies

| Dependency | Type | State | Effect on this work package |
|---|---|---|---|
| `DEC-AUTH-002` / `FD-AUTH-ARCH-001` — external managed IdP direction approved | Architecture direction | Satisfied | Authorises validation scoping; Auth0 NOT selected. |
| `FD-AUTH-ARCH-002-VAL-001` — validation-environment authority recorded (Entry 188) | Founder environment authority | Satisfied | Permits a segregated non-production tenant for bounded validation only; does not authorise this WP's execution. |
| `AUTH-ARCH-002` (recommendation C) + `AUTH-ARCH-002-VAL-001` (bounded evidence programme, disposable V5 harness 11/11, doc-level findings) | Validation basis | Satisfied | Defines the exact bounded evidence still required; findings preserved, not re-decided. |
| `DEC-DATA-008` / `FD-DATA-ARCH-001` — PostgreSQL direction independently settled | Adjacent architecture | Satisfied (acknowledged, unchanged) | No persistence decision is taken or needed here. |
| `origin/main` + CI healthy at authoring | Repository health | Satisfied (re-verify at execution) | Authoring baseline sound; execution must re-verify. |
| Access to Auth0 account/tenant-creation capability | Execution prerequisite | Remaining — verify at execution | Without it, live execution cannot begin; report BLOCKED — DECISION REQUIRED. |
| Auth0 Enterprise-capable validation entitlement, if required APIs need it | Execution prerequisite | Remaining — verify at execution | Missing entitlement is recorded as unavailable evidence (VALIDATION INCOMPLETE), never silently as failure. |
| Least-privilege M2M setup | Execution prerequisite | Remaining — verify at execution | Required before validation API calls. |
| Google/social test credentials | Execution prerequisite | Remaining — verify at execution | The Google tenant test is required (AC-19); if credentials cannot be sourced, record VALIDATION INCOMPLETE. |
| Commercial contact path for the Enterprise quote | Execution prerequisite | Remaining — verify at execution | Quote outstanding is recorded, not assumed. |
| SMS-gateway pricing evidence sources (Burundi/Rwanda) | Execution prerequisite | Remaining — verify at execution | Economics outstanding are recorded, not invented. |

Dependencies are genuine: parallel workstreams (`AUTH-MFA-003D-IMPL-001` blocked track, `DEC-DATA-008` persistence direction, FD-COM-001 commercial work) do not block each other and are not re-decided here.

## 6. Required Implementation

When Founder-authorised, execute one bounded validation programme that consumes — not reinterprets — the governing authority:

1. Pass Gate 1 (validation-approach review, §13) before creating security-sensitive provider state beyond minimal tenant setup.
2. Create and/or configure exactly one segregated non-production Auth0 validation tenant with disposable validation-only identities; no real customers, production administrator identities, or production data.
3. Create one least-privilege M2M client; verify Management API scopes before use; record scopes with every finding.
4. Pass Gate 2 (contract/test review, §13) before broader validation execution.
5. Establish validation identity/factor state and create the controlled recovery scenario: enroll disposable F1/F2 TOTP factors on disposable validation identities and record immutable enrollment identifiers. No destructive factor call is permitted before the revocation barrier in item 6.
6. Establish the validated revocation confirmation/cutoff barrier for the scenario (AC-06–AC-10): initiate session delete + refresh-token revoke sequencing; readback-poll to determine the confirmation bound; verify `preserve_refresh_tokens` behaviour; record the 202-to-confirmed latency distribution; observe issued-JWT, session, and refresh-token behaviour separately. `202 Accepted` is never treated as confirmation.
7. Only after the item-6 barrier is established for the scenario: verify exact target-factor binding, then execute the exact-factor track (AC-01–AC-05) — delete F1 by exact immutable ID; read back F1/F2; prove F2 untouched; test already-absent-F1 handling; determine idempotency (an absent F1 never deletes another factor); test concurrent delete-vs-enroll ordering; record scopes, HTTP outcomes, and audit logs. Every F1 deletion is explicitly gated on the validated revocation barrier. Tenant experimentation with test identities is not exempt from R5: the validation must prove the approved architecture, not violate it. Then execute the domain-cutoff track (AC-11–AC-13): prove or disprove the candidate generation/cutoff claim; test the post-cutoff mint race; test fail-closed missing-claim behaviour. The cutoff itself remains unapproved candidate architecture.
8. Where provider behaviour must be observed independently of a full approved recovery sequence, it may be characterized only as a **non-authoritative isolated provider experiment**: a disposable isolated-factor test that is explicitly not a valid 11thONUS recovery execution, cannot affect another factor or any real identity, yields evidence about provider semantics only, and from which no R5 qualification is inferred. Raw provider characterization must never be blurred with the approved recovery path.
9. Execute the MFA-evidence track (AC-14–AC-16): observe genuine TOTP sign-in evidence; observe silent/refresh behaviour; establish the access-token evidence path (including any namespaced Action claim).
10. Execute the product-methods track (AC-17–AC-21): email/password, verification/reset, Google on the tenant with test contacts, EN/FR matrix, and account-linking semantics.
11. Execute the Functions/API track (AC-22–AC-27): external-token-to-Functions end-to-end contract test; issuer/audience/expiry enforcement; JWKS rotation and unknown-`kid` handling; malformed / wrong-issuer / wrong-audience negatives; `AuthenticationReference` mapping (provider subject stays an opaque external reference, never durable identity/role/permission authority); App Check coexistence.
12. Execute the operations/commercial track (AC-28–AC-32): identify the required plan; confirm Enterprise-only APIs; request the Enterprise quote and obtain the decision-material commercial evidence (quote/pricing, entitlement confirmation, region/data-location, SMS economics). A sent request is not complete evidence. If the vendor has not supplied required evidence, record VALIDATION INCOMPLETE — COMMERCIAL EVIDENCE REQUIRED unless the Founder/designated approval authority explicitly waives the specific item; the execution agent cannot waive. No contract commitment; no paid terms without separate Founder approval.
13. Capture sanitized evidence for every criterion (AC-33): API operation names, HTTP statuses, enrollment IDs masked where appropriate, response structure, timing observations, readback, token-claim shapes with sensitive values redacted, test-case IDs/results, and cleanup evidence. Never store secrets, tokens, TOTP seeds, TOTP codes, private keys, or client secrets — in the repository or elsewhere outside the secure handling boundary.
14. Apply the secret-handling contract (AC-34): secure environment/local secret storage only; no repository credential files; no `.env` commit; full final secret scan with confirmation recorded in the completion report; cleanup/revocation of validation credentials where appropriate.
15. Apply the provider-resource cleanup contract (AC-35): remove test identities, M2M clients, refresh tokens, sessions, temporary MFA enrollments, and temporary apps/connections; record which resources were created, removed, intentionally retained (with retention authority), and which secrets were revoked/rotated. The validation tenant itself is deleted only if the approved cleanup plan requires tenant deletion and provider/account permissions permit API deletion; otherwise state and execute the exact manual cleanup requirement. Unresolved mandatory cleanup yields VALIDATION INCOMPLETE — BOUNDED EVIDENCE / CLEANUP REQUIRED, not qualification.
16. Apply the provider-qualification rule (§15-adjacent): do not average security results. A failure of a hard R5/R7 invariant means **AUTH0 NOT QUALIFIED** unless a separately approved 11thONUS security architecture legitimately satisfies the invariant. Commercial failure may also disqualify even if technically suitable. Missing paid/Enterprise entitlement is recorded as unavailable evidence, never silently as failure.
17. Close with the FEF completion report (AC-36) declaring exactly one of the §14 maximum states; claim no provider selection and no migration authority.

## 7. Invariants / Constraints to Preserve

- R1–R10 are preserved exactly as approved (`DEC-SEC-005` / `FD-MFA-R`); no new Founder decision, recovery model, role, lifecycle, or customer-facing MFA authority is invented.
- **R7 exact-factor invariant:** a recovery authorized for F1 must never delete replacement F2. The approved recovery binds to the exact original factor enrollment; retries never remove a replacement factor.
- **R5 revocation invariant:** factor reset cannot proceed until the 11thONUS architecture has established its required fail-closed revocation state. Required order: approved recovery → revoke target sessions → revocation succeeds → verify approved factor binding → remove approved factor. No natural-expiry downgrade.
- **MFA evidence invariant:** `verifiedSecondFactor` remains true only from cryptographically verified genuine second-factor evidence. Recovery restores the ability to establish MFA; it never manufactures, substitutes, or bypasses genuine second-factor proof.
- **Durable identity invariant:** the Auth0 subject remains an external authentication reference and never becomes durable 11thONUS identity/role/permission authority. Controlled provider dependency holds: the provider may own credential verification, ceremonies, MFA mechanisms, and provider sessions; 11thONUS retains durable identity, roles, permissions, business relationships, recovery policy, and domain authorization.
- **No production shortcut:** validation success does not equal provider selection. No production dependency or migration state may be created as a side effect of validation.
- No TOTP secrets, TOTP codes, tokens, client secrets, or private keys in the repository, reports, or logs at any time.

## 8. Prohibited Shortcuts

- No speculative product or architecture decisions.
- No unrelated refactoring or dependency upgrades unless explicitly authorised.
- No new governed domain terminology without identified authority.
- No silent resolution of deferred or unresolved decisions.
- No expansion beyond the stated work-package scope.
- No selecting Auth0, no production tenant, no migration, no Firebase Auth removal, no real-user or real-administrator migration.
- No F1 deletion before the validated revocation barrier for that scenario — no test-identity exemption from R5.
- No blurring of non-authoritative isolated provider experiments with the approved recovery path; no R5 qualification inferred from raw provider characterization.
- No qualification claim while mandatory cleanup is unresolved.
- No waiving of decision-material commercial evidence by the execution agent.
- No resuming `AUTH-MFA-003D-IMPL-001` and no changing R1–R10 or `DEC-SEC-005`.
- No PostgreSQL implementation, Cloud SQL provisioning, combined architecture transition, or production Functions conversion.
- No averaging of security results across criteria to dilute a hard-invariant failure.
- No treating missing paid/Enterprise entitlement as provider failure.
- No entering paid contracts or accepting paid terms.
- No inferring provider permission from tool access.

## 9. Acceptance Criteria

| ID | Acceptance criterion | Evidence required |
|---|---|---|
| AC-01 | F1 is identified immutably (exact provider enrollment identifier bound before any destructive call). | Test-case IDs; list-enrollment readback with IDs masked. |
| AC-02 | F1 deletion by exact ID is addressed (HTTP outcome, scope used, audit log recorded). | Operation names; HTTP statuses; response structure; audit-log excerpts (sanitized). |
| AC-03 | F2 survives a stale F1 recovery (post-delete readback proves F2 untouched). | Before/after readback; result verdict. |
| AC-04 | An absent F1 cannot delete another factor (no aliasing, no positional delete). | Negative-test results. |
| AC-05 | Retry semantics are understood (already-absent-F1 handling; idempotency determination; documented status codes incl. absence of any assumed 404 contract). | Status-code table; idempotency verdict. |
| AC-06 | Session behaviour is observed (session delete outcome; what the provider confirms and when). | Operation names; statuses; timing observations; readback. |
| AC-07 | Refresh-token behaviour is observed (revoke outcome; `preserve_refresh_tokens` behaviour verified). | Operation names; statuses; readback. |
| AC-08 | Issued-JWT behaviour is observed (effect — if any — of revocation on already-issued tokens until `exp`). | Claim shapes (redacted); expiry observations. |
| AC-09 | Asynchronous completion bounds are measured (202-to-confirmed latency distribution via readback polling). | Timing distribution; polling method; convergence bound or declared non-convergence. |
| AC-10 | Provider readback is understood (which state is pollable; what counts as confirmation; `202 Accepted` never treated as confirmation). | Readback contract statement with evidence. |
| AC-11 | The candidate generation/cutoff claim is proved or disproved on the tenant. | Tenant-observed claim behaviour; verdict. |
| AC-12 | The post-cutoff mint race is tested. | Race-test results. |
| AC-13 | Fail-closed missing-claim behaviour is tested. | Negative-test results. |
| AC-14 | Genuine TOTP sign-in evidence is observed on the tenant. | Sanitized sign-in evidence; claim excerpts (redacted). |
| AC-15 | Silent/refresh behaviour is observed (what survives a refresh; what is omitted). | Refresh-cycle observations. |
| AC-16 | The access-token evidence path is understood (default claims vs any namespaced MFA claim). | Token-claim shapes (redacted). |
| AC-17 | Email/password authentication works on the validation tenant. | Test-case IDs/results. |
| AC-18 | Verification and reset flows work on the validation tenant. | Test-case IDs/results. |
| AC-19 | Google login is tested on the validation tenant with test contacts. Google is an approved MVP provider per `DEC-AUTH-001` (D-A2 as amended) and `AUTH-ARCH-002` §16 requires it in the tenant V3 matrix, not assumed from documentation. If test credentials are unavailable or the tenant test cannot be executed, the result is VALIDATION INCOMPLETE, not a pass. A complete non-Google authentication path (email/password, AC-17) is proven for users who do not have or do not wish to use a Google account. | Tenant test results, or recorded VALIDATION INCOMPLETE with cause. |
| AC-20 | EN/FR experience is verified. | Locale-matrix results. |
| AC-21 | Account-linking semantics are validated. | Linking-test results. |
| AC-22 | External JWT verification succeeds through the disposable Functions/API harness. | Harness results; verification method. |
| AC-23 | Issuer, audience, and expiry are enforced. | Positive + boundary test results. |
| AC-24 | JWKS rotation and unknown-`kid` handling are verified. | Rotation/unknown-key test results. |
| AC-25 | Malformed, wrong-issuer, and wrong-audience tokens are rejected. | Negative-test results. |
| AC-26 | `AuthenticationReference` mapping holds (provider subject recorded only as an opaque external reference). | Mapping evidence; no durable-identity leakage. |
| AC-27 | App Check coexistence is validated. | Coexistence test results. |
| AC-28 | The required plan for the exact needed APIs is identified. | Plan/entitlement statement with source. |
| AC-29 | Enterprise-only APIs among the required set are confirmed or ruled out. | API-by-API entitlement table. |
| AC-30 | The required Enterprise quote/pricing is obtained. If the vendor has not supplied it, the result is VALIDATION INCOMPLETE — COMMERCIAL EVIDENCE REQUIRED unless the Founder/designated approval authority explicitly waives this specific item; the execution agent cannot waive. A sent request is not complete evidence. | Quote record, or recorded VALIDATION INCOMPLETE / explicit waiver reference. |
| AC-31 | Region/data-location is confirmed. | Region statement with source. |
| AC-32 | SMS/gateway economics for Burundi/Rwanda pilot volumes are obtained and recorded. If unavailable, the result is VALIDATION INCOMPLETE — COMMERCIAL EVIDENCE REQUIRED unless explicitly waived by Founder/designated approval authority; no agent waiver. | Pricing evidence, or recorded VALIDATION INCOMPLETE / explicit waiver reference. |
| AC-33 | Sanitized evidence is captured for every executed criterion with no secret material stored. | Evidence inventory; secret-scan confirmation. |
| AC-34 | The secret-handling contract is followed end to end (secure storage only; no repo credential files; no `.env` commit; final scan). | Handling attestation; full final secret-scan result. |
| AC-35 | Provider-resource cleanup is executed and evidenced: every created resource is listed as removed or intentionally retained with retention authority; secrets revoked/rotated where applicable. Unresolved mandatory cleanup yields VALIDATION INCOMPLETE — BOUNDED EVIDENCE / CLEANUP REQUIRED, not qualification. Tenant deletion proceeds only if the approved cleanup plan requires it and provider/account permissions permit API deletion; otherwise the exact manual cleanup requirement is stated and executed. | Created/removed/retained inventory with authorities; cleanup readback; manual-cleanup statement if applicable. |
| AC-36 | The completion report declares exactly one §14 maximum state and claims no selection or migration. | Completed FEF report; exact head for review. |

## 10. Required Tests and Validation

| Test / validation | Required command or method | Expected result |
|---|---|---|
| WP authoring validation (this task) | `git diff --check`; Markdown relative-link validation; 16-section/template-field checklist (§20-adjacent); `prettier --check` on changed files | All pass; PR CI SUCCESS on the exact head. |
| Exact-factor tenant tests (AC-01–AC-05) | Auth0 Management API calls from the authorised tenant harness; readback after every destructive call | Each AC PASS, FAIL with evidence, or recorded unavailable. |
| Revocation tenant tests (AC-06–AC-10) | Session/refresh revoke sequencing with readback-polling timing | Confirmation bound measured or non-convergence declared. |
| Cutoff tenant tests (AC-11–AC-13) | Candidate cutoff claim + mint-race + missing-claim harness | Claim proved or disproved; no assumed sufficiency. |
| MFA-evidence tenant tests (AC-14–AC-16) | Genuine TOTP sign-in + refresh-cycle observation | Evidence path stated with redacted excerpts. |
| Product-method tests (AC-17–AC-21) | Tenant authentication matrix with test contacts only | Matrix results or recorded non-applicability (AC-19). |
| Functions/API contract tests (AC-22–AC-27) | Disposable external-JWT → Functions/API harness (positives + negatives) | Contract verdict per AC. |
| Operations/commercial evidence (AC-28–AC-32) | Plan/entitlement inspection; quote request; region + SMS evidence gathering | Obtained, or recorded as VALIDATION INCOMPLETE — COMMERCIAL EVIDENCE REQUIRED unless the specific item is waived by Founder/designated authority; nothing invented; no agent waiver. |
| Secret scan | Full-diff and final secret scan for secrets/tokens/seeds/codes/keys | Clean, with confirmation recorded. |
| Cleanup verification | Post-execution provider readback of identities, clients, tokens, sessions, temporary resources | Cleaned, or explicitly retained tenant with decision reference. |
| Full CI | Repository PR workflow on the exact execution-report head | Required checks successful. |

Do not report doc-level, emulator, or harness-mechanics behaviour as tenant-observed behaviour. Tenant claims require tenant evidence.

## 11. Evidence Required

At minimum, preserve as applicable:

- repository entry state (remote, base branch, SHA, worktree state, ahead/behind);
- Founder authorisation of this exact package and the `FD-AUTH-ARCH-002-VAL-001` environment authority;
- changed-file inventory and no-unrelated-change review;
- Gate 1, Gate 2, and final review records with exact heads reviewed;
- per-criterion sanitized evidence: API operation names; HTTP statuses; enrollment IDs masked where appropriate; response structure; timing observations; readback; token-claim shapes with sensitive values redacted; test-case IDs/results;
- commercial/region/SMS evidence, waiver references for any Founder-waived item, or outstanding statements with sources (outstanding decision-material evidence forces VALIDATION INCOMPLETE per §14);
- cleanup evidence: which resources were created, removed, and intentionally retained (with retention authority); secrets revoked/rotated where applicable; manual-cleanup statement if tenant deletion is not API-executable;
- resulting commit SHA; remote branch / PR state; deviations and unresolved issues; decisions deliberately not taken.

Additional evidence:

- M2M scopes used per call group; 202-to-confirmed latency distribution; entitlement table for required APIs.

Use `FEF-EWPCS-001-COMPLETION-REPORT-TEMPLATE.md` for validation completion. The report must distinguish repository-verified facts from interpretation, and tenant-observed behaviour from documentation inference.

## 12. Agent Permissions

Explicitly marked; no permission is inferred from tool access.

| Action | Permission | Conditions |
|---|---|---|
| Edit files | YES | Only after Founder authorisation and within this bounded scope. |
| Commit | YES | Validation evidence, reports, and required records only. |
| Push | YES | To the dedicated execution branch only. |
| Open PR | YES | Against the verified base branch, after required validation. |
| Resolve review threads | YES after substantive correction | Only where explicitly authorised during correction/review. |
| Update programme/governance records | YES, bounded to this WP | Only required validation evidence and established closure records; never to create authority. |
| Merge | NO | Never inferred from tooling; Founder/designated authority controls merge. |

Provider actions, once this work package is Founder-authorised:

| Provider action | Permission |
|---|---|
| Create non-production Auth0 tenant | YES |
| Create validation identities | YES |
| Create least-privilege M2M app | YES |
| Perform validation API calls | YES |
| Delete validation users/identities created by this validation | YES |
| Delete or disable the validation M2M client | YES |
| Revoke/delete validation refresh tokens | YES |
| Terminate/revoke validation sessions where supported | YES |
| Remove temporary MFA enrollments | YES |
| Delete temporary applications/connections created for validation | YES |
| Delete the validation tenant | CONDITIONAL — YES only if the approved cleanup plan requires tenant deletion AND provider/account permissions permit API deletion; otherwise execute the exact manual cleanup requirement |
| Create at most one disposable login-capable validation application (A-1, e.g. `11thonus-val-harness`; SPA or Regular Web App per Gate 2 necessity; read-only tenant inventory first — reuse/configure a usable default app instead of creating where possible; no production callbacks/domains/secrets; no standing creation rights) | CONDITIONAL — YES only under `FD-AUTH-ARCH-002-VAL-002-AMEND-001`, for the bounded validation programme subject to Gate 2 deciding A-1 is actually necessary |
| Create exactly one disposable custom validation API/resource server (A-2, e.g. `https://api.11thonus.val`; default configuration preferred; update only if Gate 2 proves a validation setting must change; no publicly reachable endpoint implied) | CONDITIONAL — YES only under `FD-AUTH-ARCH-002-VAL-002-AMEND-001`, for the bounded validation programme subject to Gate 2 deciding A-2 is actually necessary |
| Create at most two disposable Login Flow Actions (A-3; one preferred where sufficient; candidate generation-evidence and namespaced-MFA purposes only; no production authorization or business logic; validation only — not architecture approval) | CONDITIONAL — YES only under `FD-AUTH-ARCH-002-VAL-002-AMEND-001`, for the bounded validation programme subject to Gate 2 deciding each Action is actually necessary |
| Configure already-existing default connections, validation callbacks, and tenant test settings (default `google-oauth2` with developer keys for non-production login-compatibility only; no additional Google connection; no Google Cloud project or production Google OAuth credentials) | YES under `FD-AUTH-ARCH-002-VAL-002-AMEND-001` clarification (controlled use of authorized tenant/default resources; no new provider object) |
| Delete the A-1 application, A-2 resource server, and A-3 Actions/versions at cleanup, with absent-readback where supported, plus secret revocation | YES under `FD-AUTH-ARCH-002-VAL-002-AMEND-001` (cleanup half of the disposable authority; unresolved mandatory cleanup still yields VALIDATION INCOMPLETE — BOUNDED EVIDENCE / CLEANUP REQUIRED) |
| Create production tenant | NO |
| Enter paid contract | NO |
| Migrate users | NO |

Do not infer provider permission from tool access. Any provider action not listed here is NOT authorised. No broader provider administration is authorised.

## 13. High-Risk Review Gate

Is early review required before full implementation? **YES**

- **Implementation approach review (Gate 1):** before creating security-sensitive provider state beyond minimal tenant setup, independently review tenant isolation; identity/test-user design; M2M scopes; the F1/F2 test protocol; the revocation test protocol; the secret-handling plan; and the cleanup plan.
- **Contract/tests review (Gate 2):** before broader validation execution, independently review test cases; expected results; pass/fail criteria; the token-cutoff experiment; JWT claim expectations; the Functions transport harness; and evidence capture.
- **Final review:** independent review of the exact evidence before Founder provider-selection disposition.

Founder authorisation of this work package does not waive any checkpoint in this sequence.

## 14. Expected Completion State

Current state: **AUTHORISED — READY FOR CONTROLLED VALIDATION EXECUTION** (Founder authorization `FD-AUTH-ARCH-002-VAL-002` recorded 2026-09-08 against reviewed head `2e6e139b711f61747e555038ea707f883697ef00`; see Entry 191). Authorization permits only the bounded validation programme defined by this WP after merge. The remaining Entry Gate checks and High-Risk Review Gate checkpoints in §§1/13 remain mandatory before execution.

The validation execution agent's maximum self-declared state is exactly one of:

**AUTH0 QUALIFIED — AWAITING INDEPENDENT REVIEW**

**AUTH0 NOT QUALIFIED — AWAITING INDEPENDENT REVIEW**

or

**VALIDATION INCOMPLETE — BOUNDED EVIDENCE STILL REQUIRED**

**AUTH0 QUALIFIED — AWAITING INDEPENDENT REVIEW** is available only when all of the following hold: all hard R5/R7 gates pass; required tenant behavioral tests pass; the Google tenant test passes (AC-19); required MFA claim evidence passes; required Functions/API contract evidence passes; mandatory cleanup is complete or explicitly authorized for retention (AC-35); and decision-material commercial evidence (AC-28–AC-32) is complete or explicitly waived by Founder/designated approval authority. Otherwise use **VALIDATION INCOMPLETE — BOUNDED EVIDENCE STILL REQUIRED** (including VALIDATION INCOMPLETE — COMMERCIAL EVIDENCE REQUIRED and VALIDATION INCOMPLETE — BOUNDED EVIDENCE / CLEANUP REQUIRED as applicable) or **AUTH0 NOT QUALIFIED — AWAITING INDEPENDENT REVIEW** as appropriate.

The execution agent may not self-declare provider selected, migration authorised, `APPROVED`, `MERGED`, or `CLOSED`. A hard R5/R7 invariant failure means AUTH0 NOT QUALIFIED unless a separately approved 11thONUS security architecture legitimately satisfies the invariant; commercial failure may also disqualify even if technically suitable. If an authority, entitlement, validation, or scope blocker occurs, use **BLOCKED — DECISION REQUIRED**.

## 15. Stop / Escalation Conditions

Stop and report rather than assume if any of the following occurs:

- governing authority cannot be established, or `DEC-SEC-005` / R1–R10 / `DEC-AUTH-002` has changed;
- Founder authorisation of this exact package cannot be verified;
- validation requires a new product/domain/architecture decision (including approving the domain cutoff — evidence may be gathered; approval is separate);
- a security or integrity issue invalidates the approved approach (including any observed exact-factor unsafety);
- scope cannot be completed without materially changing an out-of-scope area (production state, migration, 003D resumption, persistence work);
- repository head or base state has materially drifted;
- required validation cannot be performed (including missing tenant-creation capability — report BLOCKED, not failure);
- the Google tenant test cannot be executed (AC-19) — record VALIDATION INCOMPLETE, not a pass;
- required commercial evidence cannot be obtained and no Founder/designated waiver exists for the specific item — record VALIDATION INCOMPLETE — COMMERCIAL EVIDENCE REQUIRED;
- mandatory cleanup cannot be completed and retention is not explicitly authorized — record VALIDATION INCOMPLETE — BOUNDED EVIDENCE / CLEANUP REQUIRED;
- a required paid/Enterprise entitlement is unavailable — record the affected evidence as unavailable (VALIDATION INCOMPLETE), never silently as provider failure;
- a destructive or irreversible action is required but not explicitly authorised (including production-adjacent state and paid commitments).

## 16. Completion Report Requirement

On validation completion, use:

`FEF-EWPCS-001-COMPLETION-REPORT-TEMPLATE.md`

The completion report must distinguish repository-verified facts from interpretation, and tenant-observed behaviour from documentation inference. It must record the exact head, authority used, scope reconciliation, files, per-criterion results under the qualification rule stated in Required Implementation item 16 and §14, validation/CI state, secret-scan confirmation, cleanup evidence (created/removed/retained inventory with authorities), Founder waiver references for any waived commercial or retention item, deviations, unresolved issues, deliberate non-decisions, permission compliance, and independent-review handover. It must claim no provider selection and no migration authority.
