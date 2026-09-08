# AUTH-MFA-003D-IMPL-001 — Platform Administrator MFA Recovery & Reset

- **Template ID:** FEF-EWPCS-001-TPL-WP-001
- **Parent standard:** FEF-EWPCS-001 — Engineering Work Package & Closure Standard v1.0
- **Template status:** APPROVED — ACTIVE companion template
- **Template effective date:** 2026-09-07
- **Instantiation status:** **AUTHORISED** under `FD-AUTH-MFA-003D-IMPL-001` (Founder authorization recorded 2026-09-07; VALID historically and constitutionally — see Current programme state for execution state, which authorization alone does not determine).
- **Founder authorization date:** 2026-09-07
- **Founder-reviewed pre-authorization WP head:** `b32eef5d576c4e9ad0bbea43d424f02ed6fba095`
- **Founder execution authorization reference:** `FD-AUTH-MFA-003D-IMPL-001`

> This is the sole authoritative project work package for `AUTH-MFA-003D-IMPL-001`. It instantiates the official FEF template and records bounded Founder execution authorization; it does not amend security policy or authorize production/live deployment.

# Work Package

- **Work Package ID:** `AUTH-MFA-003D-IMPL-001`
- **Title:** Platform Administrator MFA Recovery & Reset
- **Objective:** Implement the Founder-approved Platform Administrator MFA recovery/reset policy without weakening the existing MFA trust boundary.
- **Repository:** `Fkenogo/11THONUS`
- **Authoritative remote:** `https://github.com/Fkenogo/11THONUS.git` (`origin`)
- **Base branch:** `main`
- **Expected entry SHA:** `ebdb7cc80ba4930c4075321899b58df0620efc6a` at work-package authoring (PR #232 merge); the future execution agent must fetch and record the current authoritative `origin/main` SHA before implementation.
- **Working branch / branch rule:** Create a dedicated `codex/`-prefixed implementation branch from the verified current `origin/main`; do not implement in a dirty primary worktree.
- **Governing authority:** `DEC-SEC-005` / `FD-MFA-R` R1–R10; `DEC-SEC-004` / `FD-MFA-2` where still applicable; merged `AUTH-MFA-003D-DESIGN-001` and `AUTH-MFA-003D-DESIGN-001-CORR-001` (PR #232); existing `AUTH-03` server-authentication trust architecture.
- **Founder / designated authorisation record:** **`FD-AUTH-MFA-003D-IMPL-001` — Founder execution authorization recorded 2026-09-07.** Founder reviewed pre-authorization WP head `b32eef5d576c4e9ad0bbea43d424f02ed6fba095` and authorizes this bounded work package under `FEF-EWPCS-001` v1.0 and `DEC-SEC-005` / `FD-MFA-R` R1–R10. This is execution authority only: it does not create a new security-policy decision, amend R1–R10, or permit engineering to redesign them.
- **Current programme state:** **BLOCKED — DECISION REQUIRED — AUTHENTICATION ARCHITECTURE REASSESSMENT.** Founder authorisation (`FD-AUTH-MFA-003D-IMPL-001`) remains VALID; work-package execution is BLOCKED and implementation has NOT STARTED. Blocker: the FEF Entry Gate provider-capability check failed — no supported Firebase/Identity Platform administrative mechanism satisfies the exact-factor recovery invariant (see §14 and blocker references below). The current architecture decision track is `AUTH-ARCH-001` (PR #234); this work package must not resume until the Founder architecture/provider disposition resolves its blocker. Authorization alone does not override failed Entry/High-Risk gates.
- **Blocker evidence (supporting the blocked state; none of it amends authority):** (a) `AUTH-MFA-003D-PROVIDER-001` provider-feasibility evidence (unmerged evidence branch `codex/auth-mfa-003d-provider-001`, commit `618c6e5`; Result C — NO SAFE PROVIDER MECHANISM AVAILABLE — RECOVERY DESIGN BLOCKED) — inspected as repository evidence, not merged authority and not elevated to Founder authority; (b) `AUTH-ARCH-001` authentication & identity-provider architecture reassessment (PR #234), which records `AUTH-MFA-003D-IMPL-001` as **BLOCKED — DECISION REQUIRED** at its provider-capability gate. R1–R10, AC-01–AC-23 and the approved recovery policy are unchanged by this state correction.
- **Work package owner / execution agent:** Future implementation agent, subject to this recorded authorization and all remaining gates.
- **Review authority:** Independent security/engineering reviewer on the exact implementation head.
- **Approval authority:** Founder or an explicitly designated approval authority.

## 1. Entry Gate

Confirm before implementation:

- [x] Repository and authoritative remote verified for this work-package recording.
- [x] Base branch and authoring entry SHA verified (`origin/main` `ebdb7cc80ba4930c4075321899b58df0620efc6a`).
- [x] Exact Work Package ID and bounded objective reconciled with existing project authority.
- [x] Governing decisions, approved design basis, PR #232 closure, PR #233 state, and current Platform Administration audit architecture inspected.
- [x] FEF-EWPCS-001 v1.0 and its Work Package and Completion Report templates verified **APPROVED — ACTIVE**, effective 2026-09-07.
- [x] Founder execution authorization for this exact bounded package recorded 2026-09-07 as `FD-AUTH-MFA-003D-IMPL-001`, against reviewed pre-authorization WP head `b32eef5d576c4e9ad0bbea43d424f02ed6fba095`.
- [ ] Future execution agent: fetch authoritative remote state and record current `origin/main` SHA and branch ahead/behind state.
- [ ] Future execution agent: use a clean, isolated worktree with no unresolved merge, rebase, or cherry-pick state.
- [ ] Future execution agent: verify this exact FEF work package is merged and remains authoritative.
- [ ] Future execution agent: verify the recorded `FD-AUTH-MFA-003D-IMPL-001` authorization still applies to this exact authoritative package and that no governing authority has changed.
- [ ] Future execution agent: verify Node 20, pinned package manager/runtime, required Firebase/Firestore emulator services, and required credentials only for authorised non-live validation.
- [ ] Future execution agent: re-verify the supported Firebase/Identity Platform administrative factor-removal API and its exact-factor safety before coding.

### Hard Authority Stop

The execution agent verifies authority; it does not create or reinterpret it. `FD-AUTH-MFA-003D-IMPL-001` records Founder authorization for this exact bounded package only. `DEC-SEC-005`, `DEC-SEC-004`, the approved design basis, this template instantiation, a roadmap position, or a plausible package identifier do **not** independently authorise implementation, amend R1–R10, or waive any remaining Entry Gate or High-Risk Review Gate checkpoint.

If the recorded authorization cannot be verified, or an execution-time authority, prerequisite, provider capability, or security invariant is missing, report:

**BLOCKED — DECISION REQUIRED**

## 2. In Scope

- Server-governed Platform Administrator TOTP MFA recovery-request, approval, execution, denial, expiry, retry/reconciliation, and audit behaviour required by R1–R10.
- Exact original-factor binding, mandatory session revocation, provider-state re-read after revocation, and factor removal only when exact-factor safety is demonstrable.
- The smallest architecture-compatible normal recovery management surface, if a UI is necessary, with exact English/French key parity.
- Required repository-layer, callable/service, Firestore transaction, audit-vocabulary, provider-adapter, and test changes strictly necessary for this workflow.
- Break-glass execution only through the already-governed backend/service-account boundary and only with explicit Founder authorisation evidence.
- Required completion evidence and project records under established conventions.

## 3. Out of Scope

- Customer or Business MFA; SMS MFA; any non-TOTP Platform Administrator factor.
- Any MFA bypass, client-declared MFA state, persistent MFA exemption, custom-claim recovery bypass, or client-side factor removal.
- Redesign of `AUTH-03`, Firebase token trust, Platform Administrator lifecycle, roles, Knowledge permissions, or unrelated administration UI.
- Activating a new Platform Administrator role, altering `invited → active → suspended → removed`, or changing R1–R10.
- Production/staging Identity Platform changes, live recovery/reset, deployment, or environment promotion.
- `AUTH-MFA-003E`, unrelated authentication work, broad outbox design, dependency upgrades, or general cleanup.
- Merge, approval, or closure of this package by the implementation agent.

## 4. Deferred Decisions

- The currently supported administrative provider API must be re-verified immediately before implementation. If it cannot enforce exact-factor safety, no substitute may be selected here.
- The exact operational representation of per-invocation Founder break-glass authorisation must use an established auditable convention; a client boolean or inferred intent is prohibited.
- Any new recovery audit delivery mechanism beyond the current transactional Platform Administration audit architecture requires separate authority.
- Live recovery, session-revocation, deployment, and environment validation remain separately controlled.

A deferred matter is not implementation authority.

## 5. Dependencies

| Dependency | Type | State | Effect on this work package |
|---|---|---|---|
| `DEC-SEC-005` / `FD-MFA-R` R1–R10 | Founder security policy | Confirmed | Fixed recovery policy; does not authorise execution. |
| `DEC-SEC-004` / `FD-MFA-2` and `DEC-SEC-002` | Existing security authority | Confirmed | Preserves TOTP-only, server-side, non-bypassable Administrator MFA boundary. |
| `AUTH-MFA-003D-DESIGN-001` + `-CORR-001` / PR #232 | Approved design basis | Merged | Supplies approved design and current architecture findings. |
| `FD-AUTH-MFA-003D-IMPL-001` for this exact WP | Founder execution authority | **Authorised — recorded 2026-09-07** | Satisfies this authority dependency only; all remaining Entry Gate and High-Risk Review Gate checks remain mandatory before implementation. |
| Current Firebase/Identity Platform administrative factor API | External provider validation | Re-verification required | Hard blocker if it cannot safely remove only the approved factor. |
| Platform Administration audit repository / Firestore transactions | Existing architecture | Available | Recovery completion and Platform Administration audit must be transactionally coordinated. |
| Firebase Auth / Firestore emulators and authorised test environment | Validation dependency | Verify at execution | Required for applicable integration and concurrency evidence; no unsupported live TOTP-emulator claim. |

## 6. Required Implementation

When authorised, implement one bounded recovery workflow that consumes—not reinterprets—R1–R10:

1. A normal recovery request is created on the target's behalf by an independent active Platform Administrator with server-verified MFA; the target does not receive a pre-MFA self-service recovery path.
2. Normal approval rejects self-approval and requires one independent active Platform Administrator whose MFA is proven through the existing `firebase.sign_in_second_factor` → `verifiedMfaSatisfied === true` trust chain.
3. Persist a recovery request bound to the immutable original provider enrollment identifier and a controlled lifecycle. Never persist TOTP secrets, codes, or recovery credentials.
4. Enforce a server-time one-hour approval expiry if execution has not begun; denial and expiry are terminal and cannot be revived in place.
5. Claim execution idempotently and protect duplicate/replay, approval/denial, expiry/execution, and simultaneous-execution races with existing transactional command patterns.
6. Execute the mandatory sequence: approved request → revoke target sessions → confirm revocation success → retrieve authoritative current provider factor state → verify the approved exact-factor binding immediately before reset → remove only that approved factor.
7. If revocation fails, stop before reset. If the exact original factor is absent on a first execution without durable evidence of a prior provider-reset attempt, do not treat the recovery as successful or emit `mfa_recovery_executed`.
8. Treat a replacement or otherwise conflicting factor state as fail-closed. An old approval never permits deletion of a replacement factor. If provider semantics cannot guarantee that invariant, stop **BLOCKED — DECISION REQUIRED**.
9. Reconcile provider-reset success plus Firestore persistence failure only through durable evidence that a prior provider-reset stage was reached. Do not claim cross-system atomicity between Firebase/Identity Platform and Firestore.
10. Persist recovery state and the Platform Administration audit record in one Firestore transaction where both writes are local. Do not reuse identity-domain `outboxEntries` or invent an unapproved Platform Administration recovery outbox.
11. Extend the Platform Administration audit vocabulary with only `mfa_recovery_requested`, `mfa_recovery_approved`, `mfa_recovery_executed`, `mfa_recovery_denied`, and `mfa_recovery_expired`; do not add `mfa_recovery_failed`.
12. Preserve the requirement that reset is followed by fresh TOTP enrollment, enrollment-session end, fresh primary sign-in, a genuine TOTP challenge, and server verification of real second-factor evidence before privileged access returns.

## 7. Invariants / Constraints to Preserve

- Platform Administrator MFA is TOTP-only, unconditional, and server-verified; active status, recovery state, audit state, client state, or enrollment state is never MFA proof.
- R1–R10 are preserved exactly as approved; no new Founder decision, recovery model, role, lifecycle, or customer-facing MFA authority is invented.
- R5 ordering is non-negotiable: `approved → revoke → succeeds → verify exact binding → remove exact factor`.
- The post-revocation provider-state read and exact-factor check occur immediately before provider reset, preventing a stale-state replacement-factor race.
- All recovery records are server-governed; no Firestore-rule weakening, raw credential persistence, raw token persistence, or secret logging.
- Break-glass has no public endpoint, no standing service-account authority, no lifecycle elevation, and requires explicit Founder authorisation plus attributable backend/service-account execution.
- Recovery restores the ability to establish MFA; it never manufactures, substitutes, or bypasses genuine second-factor proof.
- Existing `AUTH-03` revocation-aware server authentication and the Platform Administration audit domain remain intact.

## 8. Prohibited Shortcuts

- No speculative product or architecture decisions, unrelated refactoring, or dependency upgrades.
- No client `unenroll()`, `accounts.mfaEnrollment:withdraw`, user-token withdrawal, unsupported Admin SDK MFA mutation, or blind provider-state overwrite.
- No pre-revocation exact-factor check used as the executable safety check.
- No `approved factor absent = success` without durable evidence of this recovery's prior provider-reset attempt.
- No replacement-factor deletion, natural-expiry substitute for revocation, identity-domain outbox reuse, or unapproved audit outbox.
- No `mfa_recovery_failed` audit action, self-approval, persistent exemption, SMS fallback, or customer-MFA expansion.

## 9. Acceptance Criteria

| ID | Acceptance criterion | Evidence required |
|---|---|---|
| AC-01 | A recovery request is created only by an eligible independent actor on behalf of an eligible target. | Unit/functions and emulator tests; service contract. |
| AC-02 | Target self-request authority is not introduced and target self-approval/execution authority is rejected. | Security-negative tests. |
| AC-03 | Normal approval requires one independent active Platform Administrator with server-verified MFA, not active status alone. | Functions tests tracing the existing verified-MFA chain. |
| AC-04 | Approval expires exactly one hour after approval if execution has not begun; it cannot be revived or extended. | Clock-controlled unit/integration tests. |
| AC-05 | A persistent server-governed recovery lifecycle is stored without TOTP secrets, codes, credentials, or raw tokens. | Firestore emulator tests and document inspection. |
| AC-06 | Duplicate request, approval, replay, and simultaneous execution attempts are idempotent or fail closed. | Transaction/concurrency tests. |
| AC-07 | Revocation is mandatory; revocation failure prevents every provider reset. | Security-negative provider-adapter tests. |
| AC-08 | The authoritative current provider factor state is retrieved after successful revocation and immediately before reset. | Ordering/adapter contract tests. |
| AC-09 | Only the immutable approved original factor can be removed. | Exact-binding tests. |
| AC-10 | Replacement-factor state blocks reset and requires a new decision; it is never removed by an old approval. | Security-negative provider-state tests. |
| AC-11 | An unexplained missing original factor on first execution is not marked successful. | Security-negative reconciliation tests. |
| AC-12 | Missing-factor reconciliation succeeds only with durable evidence of the same recovery's prior provider-reset stage. | Partial-failure/retry tests. |
| AC-13 | Provider-reset success plus persistence failure has durable reconciliation evidence and does not claim cross-system atomicity. | Emulator and retry tests. |
| AC-14 | Recovery state and Platform Administration audit writes are transactionally coordinated; identity `outboxEntries` is not reused. | Firestore emulator atomicity tests and changed-file review. |
| AC-15 | Exactly the five R10 audit actions are supported with correct timing; `mfa_recovery_failed` is absent. | Audit unit/emulator tests. |
| AC-16 | Administrator roles and lifecycle remain unchanged throughout recovery. | Regression tests. |
| AC-17 | Break-glass is backend/service-account only, attributable, and requires explicit Founder-authorisation evidence; no public endpoint exists. | Architecture review and negative endpoint tests. |
| AC-18 | The provider API is re-verified and used only if it can preserve exact-factor safety; otherwise implementation reports `BLOCKED — DECISION REQUIRED`. | Dated provider verification record and adapter tests. |
| AC-19 | Reset requires fresh TOTP enrollment, fresh primary sign-in, genuine challenge, and server-verified second-factor proof before privileged access. | Functions/web regression evidence; documented emulator limitation where applicable. |
| AC-20 | No recovery status or client state bypasses the existing `AUTH-03` and privileged-access MFA trust chain. | AUTH-03/MFA regression tests. |
| AC-21 | Any necessary UI is bounded to recovery management and preserves exact EN/FR key parity. | Web tests and locale-key parity check. |
| AC-22 | No customer MFA, SMS MFA, unrelated AUTH-03 redesign, architecture redesign, live action, or unapproved dependency change is introduced. | Changed-file inventory, diff review, and CI. |
| AC-23 | Completion evidence uses the FEF completion-report template and supports independent exact-head review. | Completed report and PR evidence. |

## 10. Required Tests and Validation

| Test / validation | Required command or method | Expected result |
|---|---|---|
| Unit tests | Targeted functions unit tests for lifecycle, authorisation, provider adapter, audit, retry, and errors | All pass. |
| Functions tests | `pnpm --filter functions test` | All pass. |
| Web tests, if UI changes | `pnpm --filter web test` or repository-equivalent targeted command | All pass; EN/FR parity covered. |
| Firestore emulator/integration | `pnpm emulators:validate` plus focused recovery integration suite | All applicable tests pass; atomicity and concurrency demonstrated. |
| Concurrency/idempotency | Deterministic parallel/replay/expiry race tests | No duplicate effect; unsafe state fails closed. |
| Security-negative tests | Attempt self-approval, no-MFA approval, revocation failure, absent-factor first execution, replacement factor, unsupported API, and bypass paths | Reset or privilege is denied as required. |
| Typecheck | `pnpm typecheck` | Exit 0. |
| Lint | `pnpm lint` | Exit 0. |
| Format | `pnpm format:check` | Exit 0. |
| Build | `pnpm build` | Exit 0. |
| Full CI | Repository PR workflow on exact head | Required checks successful. |
| Provider verification | Dated review of current official Firebase/Identity Platform administrative factor-removal API and IAM semantics | Exact-factor safety confirmed, or package blocked. |

Do not report unsupported live TOTP, live session revocation, live recovery/reset, or deployment behaviour as emulator-tested. Those remain separately controlled.

## 11. Evidence Required

At minimum, preserve:

- entry remote, base branch, SHA, worktree state, environment version, and authorisation evidence;
- governing authority and provider-verification record;
- changed-file inventory and no-unrelated-change review;
- targeted and full test, emulator, typecheck, lint, format, build, and CI results;
- concurrency, negative-security, audit-transaction, and retry/reconciliation evidence;
- exact resulting commit SHA, pushed branch, PR state, review-thread state, and independent-review handover;
- explicit evidence that R1–R10, `AUTH-03`, lifecycle, and audit-domain boundaries were preserved;
- documented deviations, blockers, and decisions deliberately not taken.

Use `FEF-EWPCS-001-COMPLETION-REPORT-TEMPLATE.md` for implementation completion. The report must distinguish verified repository facts from interpretation.

## 12. Agent Permissions

| Action | Permission | Conditions |
|---|---|---|
| Edit files | YES | Only after Founder authorisation and within this bounded scope. |
| Commit | YES | Documentation, implementation, tests, and required evidence only. |
| Push | YES | To the dedicated implementation branch only. |
| Open PR | YES | Against the verified base branch, after required validation. |
| Resolve review threads | YES | Only where explicitly authorised during correction/review. |
| Update programme/governance records | YES | Only required implementation evidence and established closure records; never to create authority. |
| Merge | NO | Never inferred from tooling; Founder/designated authority controls merge. |

## 13. High-Risk Review Gate

Is early review required before full implementation? **YES**

- **Entry Gate:** Complete and record every remaining future-execution Entry Gate check before implementation analysis.
- **Implementation approach:** Before production code, inspect the provider API, exact-factor safety strategy, recovery state machine, transaction boundary, and authority gates against this WP; obtain independent approach review.
- **Contract/tests:** Before a large implementation, independently inspect the proposed contracts and tests for ordering, absent-factor reconciliation, replacement-factor protection, audit atomicity, and no-bypass behaviour.
- **Substantive implementation:** Build only after the independent approach and contract/tests checkpoints are accepted.
- **Final review:** Independent reviewer assesses the exact validated head before Founder approval.

Founder authorization of this work package does not waive any checkpoint in this sequence.

## 14. Expected Completion State

Current state: **BLOCKED — DECISION REQUIRED — AUTHENTICATION ARCHITECTURE REASSESSMENT** (recorded 2026-09-08 under `AUTH-ARCH-001-CORR-002`; Founder authorization `FD-AUTH-MFA-003D-IMPL-001` recorded 2026-09-07 against pre-authorization WP head `b32eef5d576c4e9ad0bbea43d424f02ed6fba095` remains VALID). This is the normal result of an authorised FEF package encountering a hard Entry Gate blocker: it is not a revocation of Founder authority, not a cancellation of recovery, and not a policy amendment. This authorization does not waive the remaining Entry Gate or High-Risk Review Gate checkpoints, and authorization alone does not override the failed provider-capability gate. Substantive implementation did not begin.

The maximum self-declared state for the implementation agent remains:

**IMPLEMENTED — AWAITING INDEPENDENT REVIEW**

If an authority, safety, provider, validation, or scope blocker occurs, use:

**BLOCKED — DECISION REQUIRED**

The implementation agent may not self-declare `APPROVED`, `MERGED`, or `CLOSED`.

## 15. Stop / Escalation Conditions

Stop and report rather than assume if:

- the recorded Founder execution authorization, exact WP authority, or governing authority cannot be verified;
- the provider API has changed, is unavailable, or cannot guarantee exact-factor safety;
- a first execution finds the approved factor absent without durable provider-reset evidence;
- a replacement factor, concurrent execution, expiry race, audit transaction failure, or provider/persistence inconsistency cannot be reconciled safely;
- implementation needs a new recovery policy, audit delivery architecture, public break-glass endpoint, lifecycle/role change, client trust path, or product decision;
- required tests, emulators, CI, or exact-head review cannot be performed;
- an out-of-scope live, destructive, or irreversible action is proposed.

## 16. Completion Report Requirement

On authorised implementation completion, use:

`FEF-EWPCS-001-COMPLETION-REPORT-TEMPLATE.md`

The report must record the exact head, authority used, scope reconciliation, files, validation, CI/emulator state, deviations, unresolved issues, deliberate non-decisions, permission compliance, and independent-review handover.
