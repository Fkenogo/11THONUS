> **Title:** AUTH-MFA-003D-IMPL-001 — Controlled Implementation Work Package — Platform Administrator MFA Recovery & Reset
> **Status:** **RECORDED — PENDING FOUNDER REVIEW OF THE CONTROLLED WORK PACKAGE — NOT YET AUTHORISED FOR IMPLEMENTATION** (implementation becomes `AUTHORISED / READY FOR IMPLEMENTATION` only after this controlled WP is reviewed, merged, and the Founder gives explicit authorization to execute it — see §2)
> **Classification:** Controlled Implementation Work Package (governance contract, task `AUTH-MFA-003D-WP-001`)
> **Framework:** FEF-EWPCS-001 v1.0 referenced; **template unavailable in any authorized repository/working environment — not fabricated** — FEF-EWPCS principles preserved and mapped onto current 11thONUS controlled-document conventions (see §3)
> **Governing authority:** `DEC-SEC-005` / `FD-MFA-R` (R1–R10); `AUTH-MFA-003D-DESIGN-001` (incl. `-CORR-001`); `DEC-SEC-004` / `FD-MFA-2`
> **Baseline:** `origin/main` at `ebdb7cc80ba4930c4075321899b58df0620efc6a` (merge commit of PR #232, 2026-09-07) — verified at authoring entry gate (2026-09-07)
> **Authorized by:** this work package records the contract only; it does **not** authorize production implementation
> **Source-of-truth path:** `docs/05-implementation/reports/AUTH-MFA-003D-IMPL-001-work-package-2026-09-07.md`

# AUTH-MFA-003D-IMPL-001 — Controlled Implementation Work Package

## §1. Objective

This controlled work package (`AUTH-MFA-003D-IMPL-001`) translates the Founder-approved Platform Administrator MFA recovery policy (R1–R10, recorded as `DEC-SEC-005`) and the corrected design (`AUTH-MFA-003D-DESIGN-001`, incl. `-CORR-001`) into an **executable engineering contract**. It answers, for the future implementation agent:

- what engineering may implement;
- what engineering must preserve;
- what security invariants must be enforced;
- what is explicitly out of scope;
- what constitutes successful implementation;
- what evidence must be returned for independent review.

The work package makes **no new Founder decisions**. R1–R10 are fixed governing authority (see §6); engineering has zero discretion to select alternative recovery-policy options.

## §2. Authority Condition

The completed WP explicitly states: **AUTH-MFA-003D-IMPL-001 implementation is authorized only by the combination of:**

1. **`DEC-SEC-005` / `FD-MFA-R`** — the merged Founder recovery-policy decision (R1–R10);
2. **this merged controlled `AUTH-MFA-003D-IMPL-001` work package** — reviewed and merged as the controlled engineering contract;
3. **explicit Founder authorization to execute that work package** — a fresh, unambiguous execution authorization for the implementation task itself.

A plausible task name or programme sequence does **not** create implementation authority. The future implementation agent **must stop** (returning `BLOCKED — DECISION REQUIRED` where applicable) if these authorities cannot be verified against the authoritative remote (i.e. merged `origin/main` contents and the live Decision Register / Founder communication).

### Work package classification

- **ID:** `AUTH-MFA-003D-IMPL-001`
- **Title:** Platform Administrator MFA Recovery & Reset Implementation
- **Type:** Controlled Security Implementation Work Package
- **Authority:** `DEC-SEC-005` / `FD-MFA-R`
- **Entry state:** `AUTHORISED / READY FOR IMPLEMENTATION` **only after** this controlled WP is reviewed and merged (and §2(3) is given). As-recorded state at authoring: `RECORDED — PENDING FOUNDER REVIEW OF THE CONTROLLED WORK PACKAGE`.
- **Expected execution outcome (the only two the implementation may self-declare):**
  - `IMPLEMENTED — AWAITING INDEPENDENT REVIEW`; or
  - `BLOCKED — DECISION REQUIRED`
- **Prohibited self-declarations:** implementation itself must **never** self-declare `APPROVED`, `MERGED`, or `CLOSED` — those states belong to materially later, separate governance actions (independent review; Founder-authorized merge; lifecycle closure).

### Entry-baseline verification (performed during this authoring task, 2026-09-07)

`origin/main` verified at `ebdb7cc80ba4930c4075321899b58df0620efc6a` (merge commit of PR #232 — the correct/design package). It is **not assumed** to remain current: the future implementation agent must fetch and verify authoritative remote state at its own entry gate and may only begin if the authorities above remain merged and the design/WP documents are unchanged in substance at the remote head.

## §3. Framework Alignment — FEF-EWPCS-001

**Verified availability:** `FEF-EWPCS-001 v1.0` — an authorized FEF-EWPCS template could **not** be located in any authorized repository or working environment available to this authoring task (no `EWPCS`/`FEF-EWPCS` artifact found in the 11thONUS repository or the local agent skill/config environment). Consistent with the governing task, **no unofficial FEF-EWPCS template was invented or fabricated**, and the preserved FEF-EWPCS **principles** were mapped onto current 11thONUS controlled-document conventions:

- **Authority-condition principle** → §2 (implementation authorized only by decision + controlled WP + explicit Founder execution authorization).
- **Fixed-founder-policy principle** (no new decisions, no discretion on governed policy) → §6 (R1–R10 fixed).
- **Security-invariant principle** → §7 (primary invariant) and §13 (mandatory execution ordering).
- **Scope principle** (implementable scope, explicit exclusions, build-to-acceptance) → §22, §26–§30.
- **Evidence/independent-review principle** (implementation self-reports only implemented/blocked; review is separate) → §2, §27, §32.
- **Live-environment boundary** → §29.

Substantive work-package contract below is mandatory and complete regardless of external template formatting.

## §4. Repository Placement (path choice, task requirement §33)

No dedicated work-package directory exists in the repository (verified: no `work-package`/`workpackage` files or directories under `docs/`). The smallest logical controlled path under the existing implementation structure is therefore:

**`docs/05-implementation/reports/AUTH-MFA-003D-IMPL-001-work-package-2026-09-07.md`**

Rationale (explained per the governing task): (1) the package this WP governs — `AUTH-MFA-003D-DESIGN-001` (assessment + `-CORR-001`) — already lives in `docs/05-implementation/reports/`; (2) `docs/05-implementation/roadmap/` hosts **design** documents (e.g. `ENG-P2-003-DESIGN-001`), while the AUTH-MFA-003D design assessment is deliberately in `reports/`; (3) keeping the WP adjacent to its governing design creates a single logical package location. **No competing copies are created.** The WP is registered in the documentation-changes log and `IMPLEMENTATION_CHANGES.md` as the controlled recording.

## §5. Fixed Founder Recovery Policy (R1–R10) — governing authority

Engineering must **record and preserve** R1–R10 as fixed authority, with zero discretion to select alternative recovery-policy options:

- **R1 — Recovery Request Authority:** Normal recovery is initiated on the target's behalf by an independent authorized Platform Administrator presenting server-verified MFA. **No target-initiated pre-MFA recovery mechanism at MVP.**
- **R2 — Self-Approval Prohibited:** Target self-approval is absolutely prohibited (target ≠ approver; target ≠ normal-path executor exercising approval authority).
- **R3 — Approval Cardinality:** One independent active server-MFA-verified administrator is sufficient for normal recovery. Two independent approvers are **not** required. **Do not invent a two-person requirement.**
- **R4 — Break-Glass Authority:** Sole-admin break-glass requires explicit Founder authorization **plus** backend/service-account execution. Service-account capability is **execution authority only, not approval authority**. **No public break-glass endpoint.**
- **R5 — Session Revocation:** All existing target sessions are revoked before factor reset. Revocation is mandatory and fail-closed. If revocation cannot be confirmed, factor reset must **not** proceed. **No natural-expiry downgrade.**
- **R6 — Lifecycle Unchanged:** Recovery does not modify the Platform Administrator lifecycle (`invited → active → suspended → removed`); recovery state is separate; no activation/reactivation/role/status change.
- **R7 — Persistent Record + Exact Binding:** Recovery uses a persistent governed recovery request and binds execution to the **exact original MFA factor enrollment**. **No TOTP secrets or codes may be persisted.**
- **R8 — Approval Expiry:** Approval expires **one hour** after approval if execution has not begun. Expired approval cannot be revived or extended.
- **R9 — Re-establishment Chain:** Privileged recovery is not complete after factor removal or enrollment. Fresh TOTP enrollment, termination of the enrollment session, fresh primary sign-in, and a genuine Firebase TOTP challenge are mandatory before privileged access returns.
- **R10 — Audit Vocabulary (exactly):** `mfa_recovery_requested`, `mfa_recovery_approved`, `mfa_recovery_executed`, `mfa_recovery_denied`, `mfa_recovery_expired`. **Do not add `mfa_recovery_failed` without new authority.**

### Decision-package coherence (recorded, fixed)

Initiating and approving administrator may be the same independent administrator unless existing repository architecture or prior authority explicitly requires separation (two-person requirement is **not** invented). Target self-approval remains prohibited. Sole-administrator flows use the break-glass chain: no eligible independent administrator → explicit Founder authorization → service-account execution → audited → revoke sessions → fail-closed stop on revocation failure → remove exact approved factor → no role/lifecycle elevation → mandatory re-enrollment → fresh primary sign-in → genuine TOTP challenge → privileged access restored only through verified MFA.

## §6. Primary Security Invariant

The work package **states**:

> **Recovery restores the ability to establish MFA again. Recovery itself never manufactures, substitutes, or bypasses MFA proof.**

Privileged authorization must continue to rely **exclusively** on the existing server-verified Firebase second-factor evidence chain (`verified Firebase token → firebase.sign_in_second_factor → AuthenticatedCredential.verifiedSecondFactor → deriveVerifiedMfaSatisfied() → verifiedMfaSatisfied === true`). Recovery status, factor-reset status, audit state, client state, or Administrator lifecycle state may **never** substitute for `firebase.sign_in_second_factor` and the existing downstream verified-MFA derivation.

## §7. Required Persistent Recovery Model

A persistent recovery record using existing domain/repository conventions (server-governed Firestore, repository layer, controlled audit events) **preserving these semantic invariants**:

1. immutable request identity;
2. target administrator/customer identity;
3. immutable original factor enrollment binding (exact provider factor-enrollment identifier — equivalent of the design's `targetFactorEnrollmentId`);
4. requestor (normal path) or break-glass Founder-authorization reference (break-glass path);
5. approver (normal path) or backend/service-account executor attribution (break-glass path);
6. normal vs break-glass mode;
7. request/approval/execution timestamps;
8. one-hour approval expiry (deterministic server-enforced);
9. execution status;
10. correlation/idempotency identity;
11. completion/denial/expiry/failure state;
12. **no credentials or TOTP material** (no TOTP secrets, TOTP codes, or recovery credentials persisted).

Field names are architecture-compatible; **semantics are mandatory over draft syntax** — the implementation may not rename away any semantic above.

## §8. Required Recovery Lifecycle

An explicit governed lifecycle preserving these semantics (implementation may use architecture-compatible naming):

- `requested` → `approved` → `executing` → `completed`
- `requested` → `denied` (terminal)
- `approved` → `expired` (terminal, no revival/extension)
- any active state → `failed` (terminal or governed-retryable per explicit retry semantics)

**Terminal and retry semantics must be explicit:** which states are terminal, which transitions are permitted, which failures are retryable, and under what conditions a retry is authorized (see §13–§14).

## §9. Request Security

Normal request creation must require, validated server-side (never client-declared):

- authenticated actor (server-verified Firebase token via the existing `verifyIdToken(rawToken, true)` revocation-aware path);
- active Platform Administrator;
- server-verified MFA satisfaction (verified second-factor chain);
- `actor != target`;
- eligible target administrator (active lifecycle state; target is not exempted by design from being a recovery target where eligible);
- authoritative server lookup of the target's **current** factor state (MFA factor listing via the approved authoritative provider path);
- immutable binding to the **exact original TOTP enrollment**.

**The client must not be authority for:** target factor ID; administrator status; roles; MFA satisfaction. **Ambiguous MFA-factor state must fail closed** (mirroring the AUTH-MFA-003C exactly-one-TOTP guidance; zero or ambiguous eligible factor state ⇒ fail closed, no guess).

## §10. Approval Security

Approval must require, server-validated:

- authenticated active Platform Administrator with server-verified MFA;
- `approver != target`;
- a valid `requested`/not-expired recovery request;
- valid target state.

The independent requestor **may also approve** if they are not the target (§5 R3/R1 coherence). Do not invent a two-person requirement. Approval **establishes a deterministic one-hour execution window** (§12).

## §11. Denial and Expiry

The implementation must provide:

- governed denial action (eligible approver, valid request, target not self);
- **terminal `denied` state**;
- exact approved denial audit event (`mfa_recovery_denied`), emitted after denial-state persistence;
- **deterministic server-enforced one-hour expiry** (from approval, if execution has not begun);
- **terminal `expired` state**;
- `mfa_recovery_expired` audit emitted **exactly once**;
- **no revival or in-place extension** of expired approvals.

Lazy expiry at trusted server interaction is allowed if architecturally appropriate; a scheduler is not mandatory unless architecture requires it. Expiry is authoritative at any trusted server interaction point and must be checked before any execution proceeds.

## §12. Mandatory Execution Ordering (security invariant)

The work package **encodes** the following as a security invariant:

```
authorized request
→ claim execution/idempotency
→ verify target eligibility
→ verify exact original factor (still present and matching)
→ revoke sessions (all existing target sessions)
→ confirm revocation success
→ factor reset (remove exact original factor only)
→ persist completion
→ final audit (mfa_recovery_executed)
```

**If session revocation fails: STOP. Factor reset must not occur.** No natural-expiry downgrade (this is the design's fail-closed invariant under §6D/§14 of the assessment). No step may be skipped, reordered, or silently substituted.

## §13. Exact-Factor Idempotency (load-bearing acceptance criterion)

This is a **load-bearing acceptance criterion** with exactly three cases:

| Case | Required behavior |
|---|---|
| Original approved factor still exists | The reset may proceed (remove the exact approved factor). |
| Original approved factor already absent | Treat the external factor-reset operation as already satisfied / idempotent — record completion, do not delete another factor, do not error spuriously. |
| Different / replacement factor exists | **Fail closed.** Require a new recovery decision. **An old approval must never authorize deletion of a replacement factor.** |

## §14. Partial Failure Model

The work package **rejects** the assumption that Firebase Auth / Identity Platform and Firestore are one atomic transaction. Required handling must distinguish at least:

1. revocation failure before factor removal — **STOP, no reset** (§12);
2. revocation success + factor reset failure — request remains failed/retryable for the exact approved factor; retry re-runs from the exact-factor check;
3. factor reset success + persistence failure — idempotent completion recovery on retry (original factor absent ⇒ treated as satisfied);
4. retry with original factor absent — idempotent complete (§13 row 2);
5. retry with replacement factor present — fail closed, new recovery decision (§13 row 3);
6. audit/outbox failure following provider success — durable completion + audit eventual delivery per the existing outbox/audit architecture (completion is persisted first; `mfa_recovery_executed` timing per §18).

Implementation must be **idempotent/recoverable and fail closed** across all enumerated cases.

## §15. Firebase/Identity Platform Provider Boundary

Implementation must **re-verify the current official provider capability immediately before implementation** (entry inspection against the authoritative provider documentation current at that time). The approved design currently identifies **Identity Platform v1 Admin `projects.accounts.update`** (`POST /v1/projects/{targetProjectId}/accounts:update`, service-account/OAuth2, IAM `firebaseauth.users.update`, `localId` selection, `mfa` `MfaInfo` overwrite) as the backend factor-management path.

**Prohibited silent substitution with:**
- client `unenroll()` / SDK unenrollment as the backend path;
- `accounts.mfaEnrollment:withdraw` (client-facing v2, requires the user's `idToken`);
- an unsupported Firebase Admin SDK MFA update path (Admin SDK `updateUser` MFA removal remains blocked by upstream issue #2995 per the assessment).

**If the current API contract materially differs from the approved design: `BLOCKED — DECISION REQUIRED`** — do not redesign the security mechanism in place.

## §16. Session Revocation

Implement through the existing server/Firebase Admin architecture, conceptually using `revokeRefreshTokens` (or the current equivalent verified during entry inspection). The existing revocation-aware backend token verification (`verifyIdToken(rawToken, true)` — `firebaseTokenVerifier.ts:174`) must remain intact and unchanged in contract. **Do not introduce a parallel session-trust mechanism.**

## §17. Provider Adapter Architecture

Require raw Identity Platform/Firebase administrative operations to be encapsulated behind the existing provider/adaptor/repository architecture (as used elsewhere in `functions/src`). **Do not place raw HTTP, service-account handling, or provider policy inside presentation components or domain models.** No credentials may enter source control (no secrets, no keys, no service-account material, no TOTP secrets, no raw credentials in code/config/audit/tests).

## §18. Break-Glass Contract

Break-glass implementation must:

- have **no public callable/client endpoint**;
- require **explicit Founder authorization evidence/reference** (an auditable evidence artifact/reference appropriate to existing operational conventions — e.g. a Founder-issued authorization reference/record — **not** a client-supplied boolean);
- execute through **trusted backend/service-account infrastructure** (service account is execution mechanism only — not approval authority);
- use the persistent recovery record (§7);
- bind the exact factor (§13);
- revoke first (§12);
- fail closed;
- attribute audit (attribution to the Founder-authorization reference and the executing service account);
- make **no lifecycle/role changes**;
- provide **no MFA exemption**;
- restore only the ability to establish MFA again (§6).

The Founder-authorization representation must **not** be a client-supplied boolean. The work package requires auditable evidence/reference appropriate to existing operational conventions, **without pretending the application can cryptographically infer Founder intent**.

## §19. Audit Requirements

Implement **exactly** the five approved recovery audit actions: `mfa_recovery_requested`, `mfa_recovery_approved`, `mfa_recovery_executed`, `mfa_recovery_denied`, `mfa_recovery_expired`. Correct event timing:

- `mfa_recovery_requested` — after request persistence;
- `mfa_recovery_approved` — after approval persistence;
- `mfa_recovery_denied` — after denial persistence;
- `mfa_recovery_expired` — exactly once, at terminal expiry;
- `mfa_recovery_executed` — **only once the reset has actually succeeded and durable completion is established** per the existing outbox/audit architecture.

No raw credentials, tokens, or TOTP material in audit records (privacy-minimal per existing audit conventions).

## §20. Platform Administrator Boundaries

Recovery must **not**: grant roles; remove roles; change lifecycle state; activate suspended administrators; reactivate removed administrators; alter Knowledge permissions. Recovery is **separate** from administrative lifecycle and authorization (the existing `evaluateKnowledgePlatformPermission` / authorization surfaces are unchanged).

## §21. User-Facing Recovery Management

The work package requires the **smallest usable normal-recovery management surface** compatible with current Platform Administrator UI architecture. Where UI is necessary, it must allow eligible administrators to: identify the target; create a request; inspect relevant request state; approve or deny; execute where the architecture requires manual execution. **Do not authorize creation of a broad unrelated administration console.** If the current architecture makes an additional UI inappropriate, implementation may expose the smallest architecture-compatible operational surface and must **explain the decision** in its completion report.

## §22. Language

Any new user-facing UI must use the existing localization architecture with English primary, French optional, with **exact key parity** (mirroring AUTH-MFA-003B/003C i18n conventions).

## §23. Firestore Boundary

Recovery records remain **server-governed**. Do not weaken deny-by-default rules for convenience. If UI needs recovery data, expose only **bounded trusted server results** (e.g. a read-only callable/resolver following the AUTH-MFA-003A1 read-only resolver pattern) unless existing architecture proves direct reads safe and governed.

## §24. Concurrency

Implementation must protect against at least: duplicate requests; duplicate approval; approve-vs-deny race; expiry-vs-execution race; simultaneous execution; replay; retries after partial provider success; factor replacement race. Concurrency control reuses the repository's transactional/command patterns (e.g. `authorizeAndExecute`, transactional reads) — no new parallel-safety mechanism invented. Correlation/idempotency identity enforces exactly-once-effect semantics per §7/§14.

## §25. No Recovery-to-MFA Shortcut

Prohibit any implementation equivalent to: `mfaSatisfied = true`; `verifiedSecondFactor = true`; `recoveryComplete = true` being used as MFA evidence; `trustedRecovery = true`; custom-claim bypass. After reset, the existing AUTH-MFA-003B (enrollment) and AUTH-MFA-003C (challenge) remain the path back to genuine MFA authorization (§6, §26).

## §26. Testing Acceptance Matrix (security-focused, at least)

**Authority**
- non-admin request rejected;
- administrator without verified MFA rejected;
- target self-request through normal recovery prohibited;
- target self-approval prohibited;
- one eligible independent approver succeeds;
- no second approver required.

**Persistent model**
- valid transitions;
- invalid transitions;
- one-hour expiry;
- terminal denial/expiry;
- exact immutable factor binding;
- no credential fields.

**Execution**
- unapproved cannot execute;
- expired cannot execute;
- revocation before reset;
- revocation failure prevents reset;
- original factor reset;
- original factor absent retry;
- replacement factor fail closed;
- retry cannot delete replacement factor;
- lifecycle/roles unchanged.

**Audit**
- five approved actions;
- correct timing;
- no duplicate expiry/executed records;
- no credentials.

**Break-glass**
- no public route;
- explicit Founder authorization reference;
- service account not autonomous approval authority;
- persistent record;
- exact-factor binding;
- revocation-first;
- audit attribution;
- no lifecycle elevation.

**Regression**
- AUTH-MFA-001 trust path unchanged;
- AUTH-MFA-003B enrollment unchanged;
- AUTH-MFA-003C challenge unchanged;
- AUTH-03 unchanged;
- ordinary customer/Business auth unchanged.

## §27. Validation Requirements

Require: targeted unit tests; functions tests; web tests **if UI touched**; emulator/integration validation **where supported**; typecheck; lint; format; build; full CI. **TOTP Auth Emulator limitations must be reported accurately** — the Auth Emulator cannot execute TOTP second-factor challenges (per the recorded AUTH-MFA-003A/003C finding: it hard-codes PHONE_SMS MFA enrollment; upstream `firebase/firebase-tools#6224`). **No unsupported live behavior may be marked tested** — evidence claims must match the validation actually run.

## §28. Live-Environment Boundary

Explicitly **prohibited** unless separately authorized: live factor reset; live session revocation; live break-glass; live privileged recovery request; deployment; real TOTP recovery execution. Implementation should be **code/test complete without changing live Firebase state** on any environment (`eleventh-on-us-dev`/`-staging`/production all untouched). `AUTH-MFA-003E` (end-to-end validation) remains **separate** and is not authorized by this WP.

## §29. Out of Scope (prohibited)

Changing R1–R10; target-initiated pre-MFA recovery; SMS MFA; customer MFA; new Platform Administrator roles; Platform Administrator lifecycle redesign; MFA exemptions; AUTH-03 redesign; broad auth refactors; infrastructure migration; unrelated commercial/legal work; `AUTH-MFA-003E`; `ENG-P3-003B`; unrelated Knowledge Studio implementation; implementation PR merge. **Material need for any excluded item ⇒ `BLOCKED — DECISION REQUIRED`.**

## §30. Agent Permissions

The future implementation agent **may**: inspect the repository; create an isolated worktree/branch; implement exactly this WP; add tests; update implementation evidence; commit; push; open a PR.

The agent **may not**: make Founder decisions; redesign recovery; manufacture missing authority; self-approve; merge; mark the package approved/closed. (**Per §5 R10, adding `mfa_recovery_failed` also requires new authority** even though it is an audit vocabulary extension.)

## §31. Required Implementation Evidence (completion report)

The future implementation completion report must include at least:

1. entry SHA (authoritative remote verified);
2. authority used (§2);
3. strategy;
4. files modified;
5. schema/model (§7);
6. request/approval/denial/expiry (§9–§11);
7. session revocation (§16);
8. factor reset (§15);
9. exact provider API (§15 — incl. re-verification result);
10. factor idempotency (§13);
11. partial failures (§14);
12. break-glass (§18);
13. Founder-authorization evidence handling (§18);
14. audit (§19);
15. UI/i18n (§21–§22);
16. tests (§26);
17. validation (§27);
18. CI (§27);
19. dependencies/config;
20. live changes (§28);
21. risks;
22. rollback;
23. PR/head;
24. review findings;
25. FD-COM-001 confirmation (primary worktree untouched).

Final execution status must be exactly one of: `IMPLEMENTED — AWAITING INDEPENDENT REVIEW` or `BLOCKED — DECISION REQUIRED`.

## §32. Work Package Status and Governance

- **This authoring task (`AUTH-MFA-003D-WP-001`) is documentation/governance only**: no production code, dependencies, configuration, live change, or implementation artifact.
- **Records updated for a newly recorded controlled work package** per established convention: this WP document, `docs/00-governance/documentation-changes-log.md` (Entry 179), and `docs/changes/IMPLEMENTATION_CHANGES.md` (WP recording entry). **`DEC-SEC-005` is not modified.** No new recovery-policy decisions are made.
- **PR handling:** this authoring task opens a PR against `main` and does **not** merge it — it is returned for Founder review. Implementation of `AUTH-MFA-003D-IMPL-001` does not begin until §2's authority condition is met.
- **Recorded entry state at authoring:** `RECORDED — PENDING FOUNDER REVIEW OF THE CONTROLLED WORK PACKAGE — NOT YET AUTHORISED FOR IMPLEMENTATION`.

## §33. Validation of This Work Package

Docs-only; repository Prettier/format checks on the touched documents; PR CI (existing `Build, Lint, Test, Emulator Validation` workflow) runs on the pushed PR head. No production validation required because no production change exists.