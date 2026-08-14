> **Title:** ENG-P2-004-DESIGN-001 — Role-Context & Permission-Resolution Architecture
> **Version:** 1.1 · **Status:** Design package — Founder dispositions recorded (§17); NOT an implementation authorization · **Classification:** Working (execution-layer architecture record)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-ID-003` (CONFIRMED, 2026-07-30); [`CDR-001` Capability 2](CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity) / Capability 3; [ENG-P2-ARCH-001](ENG-P2-ARCH-001-customer-identity-architecture.md); PRD1; TRD10 §10.6.4; TRD11 §11.17, §11.34–11.37; TRD12 §12.7–12.16; TRD21 §21.6
> **Source-of-truth path:** `docs/05-implementation/roadmap/ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md`
> **Last controlled update:** 2026-08-14 (`ENG-P2-004-DESIGN-001` v1.1 — Founder dispositions AD-1–AD-5 recorded on F-1–F-5, §17; F-5/004D decomposition corrected to remove a Capability-3 sequencing dependency; F-4 configuration-integrity error mapping corrected)

# ENG-P2-004-DESIGN-001 — Role-Context & Permission-Resolution Architecture

**This document defines architecture only. It authorizes no implementation.** No production code, Firestore Rules, migration, client UI, or deployment is created or modified by this document. It resolves the implementation-level prerequisites `DEC-ID-003` left open (Sensitive Permission Catalogue, Override-Resolution Rule, Permission Evaluation Design, Permission Audit Design, cross-business role-context isolation) to the precision needed for a later `ENG-P2-004` implementation prompt to be authorized without the coding agent inventing permission semantics. It does not reopen or replace `DEC-ID-003`'s policy. It is analogous in role to [ENG-P2-ARCH-001](ENG-P2-ARCH-001-customer-identity-architecture.md) for the Customer Identity concern.

---

## 0. Entry State (Phase A)

- **Entry `origin/main` SHA:** `46f081c9c1cad4742660828d883742949eeac1d1` (checked out in a clean detached worktree; the primary worktree at `/Users/theo/11THONUS` was left untouched per repository-safety instructions).
- **Authentication concern:** Complete (`DEC-GOV-008`; confirmed by `AUTH-HOSTED-PREVIEW-002` closure, 2026-08-14).
- **Capability 2 (Customer Identity):** Open — partially implemented; not closed. Customer Identity concern Complete (`ENG-P2-001-01..10` merged); Authentication concern Complete; ITM Not started — Unauthorised. Capability 2 closure additionally requires `ENG-P2-004` and deployment/Manual-QA (G2) (`CAP-P2-002`).
- **`ENG-P2-004`:** Not started — Unauthorised (design-only as of this package). No implementation code exists for it anywhere in the repository (confirmed by repository-wide search).
- **ITM:** Not started — Unauthorised. Out of scope for this package (§14).
- **AUTH-10:** No scope defined anywhere in the repository; treated as unstarted/undefined, out of scope.
- **Capability 3:** Not started — all listed work packages Blocked (`ENG-P2-002`, `ENG-P2-003`, `ENG-P2-004`, `ENG-P3-001..003`).

## 1. Status Reconciliation (Phase A2)

Two stale-wording issues were identified and are corrected by the minimum dated notes in §16, not by rewriting any historical report:

1. **"Blocked — partially" vs. "Blocked — partially implemented"**: four 2026-08-14 tracking documents (`AUTH-HOSTED-PREVIEW-002` closure report, Master Workflow §17, `IMPLEMENTATION_CHANGES.md`, `documentation-changes-log.md`) use the short form; `engineering-implementation-programme.md:216` and `CDR-001` §8 use the long form. Both describe the same fact — `ENG-P2-004` has not started and is gated on design authorization, which this package now supplies for Founder review. This package does not merge the wording; it records that the two phrasings are synonymous and that neither implies partial *implementation* of `ENG-P2-004` itself (zero code exists).
2. **Master Workflow §6 vs. §17**: §6's Master Programme Map still shows Phase 2 as plain `Blocked` and has not been updated to the nuanced "Open — partially implemented" language §17 and `CDR-001` carry. §6 is a high-level table that the document's own §1 header subordinates to the narrative (§17) as current-position authority; this package adds a superseding cross-reference note at §6 rather than rewriting the table (§16).

No other stale status language was found that this package is authorized to touch. Programme/RTM status elsewhere is left as-is.

## 2. `DEC-ID-003` Reconstructed: Decided vs. Unresolved (Phase B)

### 2.A Already decided (not reopened by this package)

Quoting `decision-register.md:560-572` (Status: CONFIRMED, 2026-07-30, Approved by Founder) and the underlying `DEC-ID-003-decision-package-2026-07-30.md`:

1. **Inheritance model.** Permission inheritance is the *default*, not the only mechanism: a role (Owner/Manager/Staff) grants a default permission template.
2. **Default inheritance behavior.** Ordinary (non-sensitive) permissions inherit through the approved role hierarchy (Owner ⊇ Manager ⊇ Staff, per PRD10 §13, reconciled as a *default*, not an absolute).
3. **Explicit per-membership grants.** Inherited permissions remain subject to explicit override at the membership level (PRD1 AP-008, §7 configurability).
4. **Explicit per-membership revocations.** The same override mechanism can narrow, not only widen, a role's default set.
5. **Sensitive permissions.** Must never be granted implicitly (by inheritance alone) — they require explicit assignment regardless of role.
6. **Identity-Accountability Principle.** Permissions are exercised by verified identities acting within assigned roles; a role is not an independent actor; every exercise of a permission must be attributable to an identity; audit records must identify both the accountable identity and the role context; trust level (Progressive Trust Model, `DEC-PROV-004`) and role-based permissions are separate axes and neither substitutes for the other; identity-recovery/verification principles under `DEC-SEC-001` are unaltered.
7. **Determinism and auditability.** Permission resolution "must be deterministic and auditable" (decision text, verbatim).
8. **Actor/subject/business-context concepts.** Pre-existing and unaffected by this decision: one platform user, one-Firebase-UID-to-one-platform-user (AIR-001), a user may hold multiple simultaneous role contexts across businesses (PRD1 §3.1, TRD12 §12.7).
9. **Deny-vs-grant precedence** and **override supersession**: the decision text establishes the *principle* (sensitive permissions never implicit; overrides are permitted) but does not itself state a resolution algorithm for conflicting simultaneous grant+revoke inputs — that is Implementation Prerequisite 2, resolved in §4 below.
10. **Three named implementation prerequisites** (decision-package §8, decision-register consequence field, verbatim): (1) Sensitive Permission Catalogue, (2) Override-Resolution Rule, (3) Permission Evaluation and Audit Design. A fourth, related but distinct item disclosed in the same decision package §8 item 3: cross-business role-context isolation.

### 2.B Genuinely unresolved (this package's actual subject)

The four items named in the task purpose, corresponding 1:1 to the decision package's disclosed gaps: Sensitive Permission Catalogue (§3), Override-Resolution Rule (§4), Permission Evaluation Design (§6), Permission Audit Design (§7), and Role-Context Isolation (§5). No contradiction in repository governance was found that would require reopening §2.A; this package treats §2.A as fixed input.

## 3. Sensitive Permission Catalogue (Phase C)

### 3.1 Definition of "sensitive"

A permission is **sensitive** if, exercised incorrectly or by the wrong actor, it can: (a) change who has authority over a business (ownership, staff composition), (b) expose or alter another identity's protected data, (c) move or misstate financial/reward value, or (d) weaken the platform's own security or audit posture. This is a closed test — a permission is sensitive only if it satisfies at least one of (a)–(d); "feels important" is not sufficient. This mirrors PRD1 AP-008's own illustrative framing ("manage staff") without treating that example as exhaustive, and is consistent with PRD1 AP-007 (all sensitive actions audited).

### 3.2 MVP sensitive permission categories

Derived only from capabilities already named in governed product/TRD documents (PRD1 §7–§12, TRD12 §12.10 Layer 4/5, TRD10 `businessMemberships`). No new product capability is invented.

| # | Permission ID | Meaning | Owning domain | Default state | Inherit? | Explicit grant required? | Explicit revoke supported? | Audit req. | Rationale (test §3.1) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `staff.manage` | Invite, suspend, remove staff/manager memberships | Business membership | Owner only | No | Yes (for Manager) | Yes | Mandatory | (a) authority change |
| 2 | `staff.assignPermissions` | Grant/revoke another membership's permission overrides | Business membership | Owner only | No | Yes (for Manager) | Yes | Mandatory | (a), (d) escalation risk |
| 3 | `business.transferOwnership` | Reassign the Owner role | Business membership | Owner only | No | N/A (owner-only, not grantable) | N/A | Mandatory | (a) — see §3.6 |
| 4 | `business.configureFraudRules` | Set/alter fraud-control parameters | Business admin | Owner only | No | Yes (Manager) | Yes | Mandatory | (d) |
| 5 | `transaction.reverse` | Reverse a completed transaction/redemption | Transaction domain | Owner only | No | Yes (Manager) | Yes | Mandatory | (c) financial value |
| 6 | `reward.override` | Grant a reward outside normal redemption rules | Reward domain | Owner only | No | Yes (Manager) | Yes | Mandatory | (c) |
| 7 | `customer.viewProtectedProfile` | View a customer's protected personal data beyond the transaction-necessary minimum (TRD21 Class 3/4) | Customer domain | Owner + Manager default | Yes, but overridable down | No (role-default), Yes for Staff | Yes | Mandatory | (b) PII exposure |
| 8 | `report.exportFinancial` | Export financial/aggregate business reports | Reporting | Owner + Manager default | Yes, overridable down | No (role-default), Yes for Staff | Yes | Mandatory | (c) |

Non-sensitive baseline permissions (e.g. `customer.lookupByLoyaltyNumber`, `purchase.record`, `redemption.process` for Staff) inherit normally per role default and are **not** in this catalogue; they remain governed by TRD12 §12.11's ordinary resolution path and PRD1 §7–§8's role-default lists, unchanged by this package.

### 3.3 Never-implicitly-inheritable set

Rows 1–6 above (`staff.manage`, `staff.assignPermissions`, `business.transferOwnership`, `business.configureFraudRules`, `transaction.reverse`, `reward.override`) may never be present in an effective permission set solely because of role inheritance — they must trace to an explicit grant, or to the immutable Owner default (§3.6).

### 3.4 Elevated approval / dual control

**Resolved (AD-1, §17): no dual control in MVP.** No existing decision (`DEC-ID-003` or otherwise) specifies a dual-control or multi-party-approval mechanism for any permission, and the Founder has confirmed (§17 AD-1) that MVP will not introduce one. Every sensitive permission in the catalogue (§3.2), including `business.transferOwnership`, resolves under the ordinary sensitive-permission rule: never implicitly inherited, explicit grant required, deny-by-default, mandatorily audited where the catalogue marks it so. No dual-control state machine (pending-approval state, second-approver identity, expiry/timeout handling) is designed anywhere in this package — that would be speculative design for a workflow no governed product capability currently requires. Dual control remains a possible future addition, most plausibly attached to a future ownership-transfer workflow once one is actually built, and would require its own decision record at that time (§17 AD-1).

### 3.5 Owner-level permissions

Owner-level permissions are special: an active Owner membership holds the full sensitive set by construction (§3.6), not by an inheritance rule that could be silently altered — this satisfies "a business must retain at least one active owner" (TRD10 §10.6.4 Membership Rules) without making ownership itself a revocable "permission."

### 3.6 Immutable owner floor

An Owner membership's effective permission set is never narrowed below the full sensitive-permission set by any override record. Overrides may only apply to Manager/Staff memberships. This is a resolver invariant (§6.10, INV-1), not a new product rule — it operationalizes the existing "a business must retain at least one active owner" rule (TRD10 §10.6.4) and AP-008's own carve-out that role names must not grant *unlimited* power for non-owner roles, which implies (by contrast) that Owner is the one role the catalogue treats as the accountable ceiling.

### 3.7 Authentication/account-recovery operations

Out of this catalogue's scope. Authentication and recovery are governed by the separate, already-Complete Authentication concern (`AUTH-01..09`) and `DEC-SEC-001`; they are not business-role permissions and are not affected by role-context resolution.

### 3.8 Business-level financial/reward actions

`transaction.reverse` and `reward.override` (rows 5–6) are included because they are already named, approved actions in the product surface (redemption/reward domain, PRD1 §8, §11 Permissions Matrix "Reverse transactions" row). No new financial capability is introduced.

### 3.9 Extension mechanism

New sensitive permissions are added by amending this catalogue's table (§3.2) under the same test (§3.1) via the normal documentation-governance change process (`docs/00-governance/decision-governance-workflow.md`); no code-level extension point beyond a versioned enum is required at this design stage (§8.3).

## 4. Override-Resolution Rule (Phase D)

### 4.1 Precedence order (highest to lowest)

1. **Business-state gate** — business inactive/suspended → deny everything regardless of role/override (fail-closed, §4.4 row 9).
2. **Membership-state gate** — membership not `active` (`invited`/`suspended`/`removed`, TRD10 §10.6.4) → deny everything (fail-closed, §4.4 row 8).
3. **Explicit revocation** at the evaluated membership → deny, for that specific permission, regardless of role default or explicit grant.
4. **Sensitive-permission gate** — if the permission is in the catalogue (§3.2/3.3) and no explicit grant exists at this membership (and the membership is not Owner, §3.6) → deny, even if the role would otherwise imply it.
5. **Explicit grant** at the evaluated membership → allow (subject to 1–2 above still passing).
6. **Role/template default** — non-sensitive permissions only → allow if the role's default template includes it.
7. **Unknown/undefined permission identifier** → deny (fail-closed, not "unrecognized = allow").

**Deny always overrides grant** at the same precedence tier; there is no "most-permissive-wins" behavior anywhere in this ordering, satisfying the task's explicit prohibition.

### 4.2 Decision table

| Role default | Explicit grant | Explicit revoke | Sensitive? | Membership active? | Business active? | Result | Rule applied |
|---|---|---|---|---|---|---|---|
| — | — | — | — | No | — | Deny | §4.1.2 |
| — | — | — | — | Yes | No | Deny | §4.1.1 |
| Yes | — | Yes | No | Yes | Yes | Deny | §4.1.3 |
| Yes | — | Yes | Yes | Yes | Yes | Deny | §4.1.3 (revoke checked before sensitivity) |
| No | Yes | No | No | Yes | Yes | Allow | §4.1.5 |
| No | Yes | No | Yes | Yes | Yes | Allow | §4.1.5 (explicit grant satisfies sensitivity) |
| No | No | No | Yes | Yes | Yes | Deny | §4.1.4 |
| Yes | No | No | Yes | Yes | Yes | **Deny** — role default alone never satisfies a sensitive permission | §4.1.4 |
| Yes | No | No | No | Yes | Yes | Allow | §4.1.6 |
| N/A (unknown ID) | — | — | — | Yes | Yes | Deny | §4.1.7 |
| Owner, any sensitive permission | No override on file | — | Yes | Yes | Yes | **Allow** — Owner floor (§3.6, INV-1) overrides row above | §3.6 takes precedence over §4.1.4 for Owner only |

### 4.3 Multiple-role memberships

Not applicable within one evaluation: a request always carries exactly one `businessContextId` (§5.4), so a user with memberships in Business A and Business B is evaluated against exactly one membership record per call. There is no cross-business union or "most permissive of all my roles" behavior — see §5's isolation invariant, which this rule composes with rather than overrides.

### 4.4 Additional governed cases

8. **Suspended/removed membership** → deny (row above; membership-state gate).
9. **Inactive/suspended business** → deny (row above; business-state gate) — regardless of membership or role.
10. **Missing/unknown permission identifier** → deny, mapped to a data-integrity/validation error (§11), not silently treated as "no restriction."

## 5. Role-Context Isolation (Phase E)

### 5.1 Global identity vs. business membership

The Internal Customer ID (owned by the Identity Aggregate, `ENG-P2-ARCH-001` §2) is global and permission-free. All role/permission state lives exclusively in `businessMemberships` (TRD10 §10.6.4), one record per (user, business) pair. There is no global role.

### 5.2 Business-specific role context

A role context is the tuple `(userId, businessId, membershipId)`. TRD12 §12.7 already requires the application to hold an explicit active context for business operations; this package operationalizes that requirement for the permission evaluator specifically.

### 5.3 Permissions are never global

No permission in the catalogue (§3.2) or outside it is evaluable without a `businessId`. Even Owner status is scoped to the specific business the membership record names.

### 5.4 `businessContextId` selection and verification

The client may *propose* a `businessContextId` on any business-scoped request (matching TRD12 §12.12's `AuthorizationRequest.businessId`), but it is never trusted. The server independently looks up the membership by `(authenticated userId, proposed businessId)`; if no `active` membership exists for that pair, the request is denied (§4.4 row 8) before any permission logic runs. This is the same pattern TRD12 §12.7 already states in prose ("The server shall independently validate that the user holds the corresponding active membership") — this package makes it the mandatory first step of the evaluator (§6.9 step 1).

### 5.5 Server-side ownership/membership verification

Verification reads the `businessMemberships` document directly by its own `id` (or a `(userId, businessId)` composite lookup) inside the same evaluation call — never from a cached client claim, and never from Firebase custom claims (TRD12 §12.8 already forbids putting membership lists in claims).

### 5.6 Cross-business isolation rule (core invariant)

**Permission state for Business A must never grant authority in Business B.** Enforced structurally: the evaluator's only membership input is the single record resolved in §5.4 for the requested `businessId`; no code path unions permissions across a user's multiple `businessMemberships` records. This is testable directly: a security test asserts that a user who is Owner of Business A and has no membership in Business B receives `deny` for every Business-B-scoped request, including ones the evaluator would allow if (incorrectly) given the Business-A membership record.

### 5.7 Multiple memberships

A user may hold many `businessMemberships` (TRD10 §10.6.4, "a user may have memberships in multiple businesses"). Each is evaluated completely independently; the evaluator has no notion of "the user's memberships" as a set, only "the membership for this request's business context" (§5.4).

### 5.8 Business suspension/deactivation

A suspended/inactive business denies every permission for every membership in that business (§4.1.1) — this is a business-level gate, applied before role/membership evaluation, and is independent of any individual membership's own status.

### 5.9 Context switching

Client-side "switching" (PRD1 §3.3) changes only which `businessContextId` the client subsequently sends; it has no server-side session state of its own — every request is evaluated fresh against the membership named in that request (stateless evaluation, §6.17).

### 5.10 Audit attribution

Every permission decision's audit record carries both the accountable identity (`userId`) and the specific role context (`businessId` + `membershipId` + resolved `role`) it was evaluated in (§7), directly implementing the Identity-Accountability Principle (§2.A.6).

## 6. Permission Evaluation Design (Phase F)

### 6.1 Inputs

`userId` (subject, from verified auth context — never client-asserted), `businessId` (proposed context, §5.4), `permission` (identifier from a governed enum, §8.3), optional `resourceType`/`resourceId` (for resource-scoped checks, e.g. "this specific redemption").

### 6.2 Outputs

`AuthorizationDecision`: `allowed: boolean`, `reasonCode` (from §11's closed set), `role` (resolved role, if a membership was found), `permissionSource` ("owner-floor" | "role-default" | "explicit-grant" | "n/a-denied"), `evaluatedAt`. This is the TRD12 §12.12 contract, extended only by the `permissionSource` values §4 requires — no field is removed or renamed.

### 6.3 Canonical subject identifier

`userId` = the platform user id resolved from the verified Firebase Authentication UID via the existing `AIR-001` one-UID-to-one-platform-user mapping. This package does not introduce a second identity system; it consumes the existing Internal Customer ID / platform user id.

### 6.4 Business context input

`businessId`, resolved per §5.4 — never trusted from a client-cached role claim.

### 6.5 Membership source

Direct Firestore read of the specific `businessMemberships` document for `(userId, businessId)` (TRD10 §10.6.4) — always live, never sourced from Firebase custom claims (TRD12 §12.8/§12.9).

### 6.6 Role/template source

A static, versioned role-default table (Owner/Manager/Staff → default permission set) — content matches PRD1 §7–§8's existing default/restriction lists; this package does not redefine those defaults, only names where they live as an evaluator input.

### 6.7 Override source

`businessMemberships.permissions` / `permissionSetId` fields (already in TRD10 §10.6.4's schema) hold the per-membership explicit grants and revocations for this membership.

### 6.8 Sensitive-permission rules

The catalogue (§3.2) as a static, versioned lookup table.

### 6.9 Evaluation algorithm (sequential, short-circuiting on first deny)

1. Resolve `userId` from verified auth context.
2. Resolve `businessId` from the request; look up the business record; if inactive/suspended → deny (§4.1.1).
3. Look up the `businessMemberships` document for `(userId, businessId)`; if none exists or `status != "active"` → deny (§4.1.2).
4. If `permission` is not a recognized identifier → deny (§4.1.7).
5. If membership `role == "owner"` and `permission` is in the sensitive catalogue → allow, `permissionSource = "owner-floor"` (§3.6).
6. If `permission` is explicitly revoked on this membership → deny (§4.1.3).
7. If `permission` is explicitly granted on this membership → allow, `permissionSource = "explicit-grant"` (§4.1.5).
8. If `permission` is in the sensitive catalogue (and steps 5–7 did not already resolve it) → deny (§4.1.4).
9. If `permission` is in the resolved role's default template → allow, `permissionSource = "role-default"` (§4.1.6).
10. Otherwise → deny.

### 6.10 Fail-closed conditions

Every branch in §6.9 that is not an explicit `allow` terminates in `deny`; there is no fallthrough "allow" default anywhere in the algorithm (invariant **INV-1**: owner floor, §3.6; invariant **INV-2**: unknown permission never allows; invariant **INV-3**: inactive membership/business never allows regardless of role/override).

### 6.11 Stale/missing-data behavior

A missing `businessMemberships` document, a missing business document, or a corrupt/unparseable `permissions` field are all treated as deny — never as "no restriction found, allow." The client-facing outcome is `AUTH_FORBIDDEN` (§11, AD-4); the internal `reasonCode` distinguishes the specific cause (e.g. `CONFIGURATION_INTEGRITY_FAILURE`) for logs and audit only, never exposed as a distinct client-visible taxonomy category.

### 6.12 Caching

**Resolved (AD-2, §17): no cross-request evaluator cache in MVP — governed, not merely recommended.** TRD12 §12.11 permits brief caching ("should be cacheable briefly but must remain revocable"), but the Founder has confirmed (§17 AD-2) that MVP will not exercise that permission: every evaluation call re-reads Firestore for authoritative current state. No shared decision cache, no cache-invalidation machinery, and no stale-permission window may be introduced by an `ENG-P2-004` implementation. This directly satisfies TRD12 §12.9's staleness warning (a suspended staff member's next request is denied immediately, not after a cache window expires). A future governed optimization may reconsider caching only if demonstrated load requires it — that would be a new, separately authorized design decision, not an extension performed under this package.

### 6.13 Transaction/consistency expectations

Read-only evaluation (§6.18) does not require a transaction by itself. Where an evaluation result gates a mutating command, the mutating command must re-read the membership/business state inside its own transaction rather than trusting a pre-fetched decision (§10, TOCTOU).

### 6.14 Error mapping

See §11.

### 6.15 Dependency direction

The evaluator depends on: Identity domain (subject existence, read-only), `businessMemberships` repository (read-only), Business domain (business active-state, read-only). Nothing depends on the evaluator except calling domain services that need an authorization decision — the evaluator has zero outbound dependency on any specific protected feature, satisfying "consume the existing Internal Customer ID" and "do not introduce a second identity system."

### 6.16 API/service boundary

A single shared server-side service, callable only from trusted Cloud Function contexts (never from client code directly), matching TRD12 §12.10 Layer 3. It exposes one operation shaped by §6.1/§6.2 — no UI-specific variants.

### 6.17 Synchronicity

Synchronous (in-process, awaited) — a permission decision is needed before the calling command proceeds; there is no use case for an asynchronous/queued evaluation.

### 6.18 Purity / read-only

The evaluator performs Firestore reads only. It never writes application state. Audit-record emission (§7) is a side effect of the *caller*, not of the evaluator itself — keeping the evaluator a pure decision function over its reads, consistent with "do not couple it to UI" and keeping it trivially unit-testable.

### 6.19 Observability

Every decision is a candidate for a structured log line (TRD11 §11.36 fields: correlation ID, actor id, business id, aggregate/resource id, result, duration) and, for sensitive permissions specifically, an audit record (§7) — matching TRD12 §12.12's "decisions affecting sensitive operations should be included in structured logs," now made concrete: sensitive-permission decisions (allow or deny) are always audited; non-sensitive decisions are logged only, not persisted as audit records (§7.1).

## 7. Permission Audit Design (Phase G)

### 7.1 Scope: which decisions are audited

Every decision on a **sensitive** permission (§3.2) is audited, allow or deny. Non-sensitive decisions are covered by ordinary structured logging (TRD11 §11.36) only, not by a persisted audit record — this keeps audit volume proportional to risk, consistent with PRD1 AP-007's "all sensitive actions are audited" (not "all actions").

### 7.2 Mechanism: reuse the existing outbox, do not build a second system

**Resolved (AD-3, §17): reuse the existing shared outbox/audit architecture — governed, not merely recommended.** No second permission-audit subsystem may be built. Comparison against a dedicated permission-audit repository (retained for the record):

| Criterion | Reuse outbox + projection (adopted) | Dedicated permission-audit store (rejected) |
|---|---|---|
| Matches TRD11 §11.17's idempotent/retry/status contract | Yes, already built | Would have to rebuild it |
| Precedent in this repo | Yes — `ENG-P2-001-10`, `AUTH-08` both do exactly this | None |
| Second event/audit system to maintain | No | Yes — new failure modes, new retry/dedup logic |
| Privacy-classification reuse (TRD21 §21.6) | Direct — `ENG-P2-001-10` already reuses it verbatim | Would need re-deriving |
| Query/read-side shape | Bounded, paginated query functions over `outboxEntries`, precedent exists | Undesigned |

**Consistency boundary (Founder-directed clarification, AD-3):** the later implementation must preserve a specific consistency relationship between three distinct things, and must not collapse it into a disconnected best-effort emission:

1. **The authorization decision** (§6, an in-process, read-only evaluation — never itself persisted).
2. **The protected command/action** (the mutating domain command the decision gates — e.g. suspending a staff member, reversing a transaction).
3. **The required sensitive-decision audit evidence** (§7.3's `PermissionAuditRecord`, mandatory for every sensitive-permission decision per §7.1).

Where governance requires durable attribution (every sensitive decision, §7.1), the audit-record write is **not** an un-awaited, fire-and-forget emission — it follows the same durable-awaited-outbox-write-with-deterministic-`eventId` discipline `AUTH-08` already established for its own domain events (§7.4): the outbox entry is written **in the same transaction** as the protected command's own state change, so a sensitive decision's audit evidence and the action it gates commit atomically together, or neither does. An evaluation that only *logs* (non-sensitive decisions, §7.1) has no such atomicity requirement — only sensitive-decision audit evidence carries this durability guarantee.

### 7.3 Audit record shape

`PermissionAuditRecord` (an outbox event payload, category `PermissionDecisionRecorded`):

| Field | Description |
|---|---|
| `decisionId` | Deterministic id derived from the request's idempotency/correlation key (mirrors AUTH-08's retry-stable `eventId` pattern) |
| `timestamp` | Server timestamp of evaluation |
| `actorUserId` | The accountable identity (§2.A.6) |
| `subjectUserId` | Present only if evaluating on behalf of a different subject than the actor (not used in v1 — actor and subject are always the same user for business-role permissions); reserved field |
| `businessId` | The evaluated business context |
| `membershipId` | The specific membership evaluated |
| `permission` | The permission identifier requested |
| `result` | `"allow"` \| `"deny"` |
| `decisionSource` | One of: `role-default`, `explicit-grant`, `explicit-revocation`, `sensitive-rule`, `business-state-gate`, `membership-state-gate`, `owner-floor`, `unknown-permission` |
| `effectiveRole` | Resolved role at time of decision, if a membership was found |
| `overrideId` | Reference to the specific override entry applied, if any (traceability, not the whole override list) |
| `reasonCode` | The `§11` closed error/decision code |
| `correlationId` | Request correlation id (TRD11 §11.36) |
| `schemaVersion` | Integer, starts at 1 |
| `privacyClassification` | TRD21 §21.6 Class 2 (Internal Operational Data) — the record contains no PII beyond identifiers already treated as operational elsewhere in the outbox |
| `retention` | Follows the existing outbox/audit retention policy already governing `ENG-P2-001-10`'s projection; not newly designed by this package |

**Explicitly excluded:** no tokens, passwords, session material, or PII beyond user/business/membership identifiers already present in existing operational records.

### 7.4 Emission point

Emitted by the calling domain command (not the evaluator itself, §6.18) in the same transaction that performs the protected mutation, using the same durable-awaited-outbox-write-with-deterministic-eventId pattern AUTH-08 established (idempotent, retry-stable, at-least-once with dedup-by-`eventId`).

## 8. Data Model / Contracts (Phase H)

Uses existing repository terminology (`businessMemberships`, TRD10 §10.6.4) rather than inventing new collection names.

| Concept | Identifier | Ownership | Lifecycle | Required fields | Invariants |
|---|---|---|---|---|---|
| `BusinessMembership` (existing, TRD10 §10.6.4) | `id` | Business membership domain | invited → active → suspended/removed | as TRD10 §10.6.4 (unchanged) | ≥1 active owner per business (existing rule) |
| `RoleTemplate` | role name (`owner`\|`manager`\|`staff`) | Permission-resolution config | Versioned, static per schema version | role, defaultPermissions[] | Never includes a sensitive permission for non-owner roles by default |
| `SensitivePermissionCatalogue` | permission id | Permission-resolution config | Versioned (§3.9) | id, meaning, inheritAllowed, explicitGrantRequired, auditRequired | Closed test (§3.1) applied at authoring time, not runtime |
| `PermissionOverride` | embedded in `businessMemberships.permissions[]` (existing field) | Business membership domain | Set/cleared by `staff.assignPermissions` | permissionId, direction (grant/revoke), grantedBy, grantedAt | Cannot target Owner membership (§3.6) |
| `PermissionDecision` | `decisionId` (ephemeral, not persisted itself) | Evaluator (§6) | Computed per request | see §6.2 | Pure function of its inputs; not stored — only audited when sensitive (§7) |
| `BusinessContext` | `(userId, businessId)` | Request-scoped | Per-request | userId, businessId | Server-verified every request (§5.4), never trusted from client |
| `PermissionAuditRecord` | `decisionId` | Outbox / audit projection | Append-only | see §7.3 | Immutable once written |

No Firestore collection-level schema changes are proposed beyond what TRD10 §10.6.4 already defines — `RoleTemplate` and `SensitivePermissionCatalogue` are configuration data (versioned static tables), not new mutable Firestore collections, at this design stage; whether they eventually live as a Firestore config collection or in-code constants is an implementation-level choice deferred to the later coding task, not decided here.

## 9. Security & Privacy (Phase I)

Verified against: deny-by-default (§4.1.7, §6.10), least privilege (§3.3 never-implicit set), explicit sensitive grants (§4.1.4), no implicit privilege escalation (§3.6 Owner floor is structural, not grantable), business isolation (§5.6), no cross-tenant leakage (§5), identity immutability (unaffected — this package adds no identity mutation), auditability (§7), enumeration resistance (permission-check failures return a uniform `AUTH_FORBIDDEN`/`VALIDATION_FAILED`, never revealing whether a business/membership exists to an unauthorized caller, and never distinguishing "denied" from "server could not soundly determine" — §11), closed error taxonomy (§11, no new category introduced), no raw credential/token persistence (§7.3 excludes it explicitly).

### Abuse cases and mitigations

| # | Abuse case | Mitigation |
|---|---|---|
| 1 | Forged `businessContextId` | Server independently resolves membership by verified `userId` + proposed `businessId`; client value is never trusted (§5.4) |
| 2 | Stale membership (client caches an old "active" state) | Every evaluation re-reads Firestore (§6.12 — no caching in v1); custom claims never hold membership data (TRD12 §12.8) |
| 3 | Revoked permission replay (client retries a call after a revocation) | Evaluation is stateless and re-derives from current membership record every time (§5.9) |
| 4 | Cross-business role leakage | Structural single-membership-per-evaluation design (§5.6); dedicated security test asserts non-leakage |
| 5 | Privilege escalation via explicit grant | Granting requires `staff.assignPermissions` itself, which is sensitive and Owner-floor/explicit-grant-only (§3.2 row 2); a Manager cannot grant themselves a sensitive permission unless already explicitly granted `staff.assignPermissions` |
| 6 | Sensitive permission inheritance | Structurally impossible — §4.1.4/§6.9 step 8 denies unless step 5 (owner) or step 7 (explicit grant) already resolved it |
| 7 | Owner-role impersonation | Owner status is read from the server-verified membership record only; never asserted by the client (§5.5) |
| 8 | Concurrent override changes (grant and revoke racing) | Evaluation always reads the current Firestore state at call time (no cached decision reused, §6.12); the mutating command that changes an override is itself an ordinary Firestore write with normal last-write-wins semantics — no evaluation-side race exists because there is no evaluation-side cache to go stale (§10) |
| 9 | Deleted/suspended membership | Denied by §4.1.2/step 3 before any permission logic runs |
| 10 | Audit tampering | Append-only outbox mechanism (§7.4) inherits the existing outbox's integrity properties; no update/delete path exists for audit records, consistent with `ENG-P2-001-10`'s existing projection design |

## 10. Concurrency / Consistency / Idempotency (Phase J)

1. **Evaluation itself needs no transaction** — it is a read-only, point-in-time decision (§6.13, §6.18).
2. **Consistency after grant/revocation**: the next evaluation call reads the updated `businessMemberships` document directly; there is no propagation delay because there is no cache (§6.12).
3. **Concurrent override changes**: ordinary Firestore write semantics on the `businessMemberships` document; no new locking is introduced.
4. **Permission mutations (grant/revoke) require idempotency**: yes — the mutating command (invoked via `staff.assignPermissions`) should use the same idempotency-key pattern as other domain commands (TRD11 §11.17/§11.34), not newly designed here.
5. **Evaluation itself does not need idempotency** — it is a pure read with no side effect to duplicate.
6. **Audit emission must be retry-safe**: yes, inherited directly from the outbox pattern's deterministic-`eventId` dedup (§7.4).
7. **Stale-cache risk**: none in v1 by design (§6.12); reintroduced only if a future cache is added (§15 F-2), and any such addition must re-satisfy TRD12 §12.9's staleness constraint before it can be authorized.
8. **TOCTOU risk between evaluation and protected action**: real or apparent risk if a command reads a decision, waits, then acts. Mitigation: protected mutating actions must re-verify membership/business active-state inside their own write transaction (§6.13) — the permission check is not a standalone gate that, once passed, is trusted indefinitely. This is stated explicitly here because it is exactly the kind of same-transaction/same-command authorization requirement the task calls out: **state it explicitly — protected actions must not treat a prior `allow` decision as valid beyond the single command invocation that requested it.**

## 11. Error / Decision Taxonomy Mapping (Phase K)

Mapped onto the existing closed 14-category taxonomy (TRD11 §11.35, governed by `F9B-DEC-001`) — **no new category is introduced**:

| Evaluator outcome | Taxonomy code |
|---|---|
| Unauthenticated (no verified `userId`) | `AUTH_REQUIRED` |
| Identity unavailable / resolution failure | `AUTH_REQUIRED` |
| Membership missing (no record for `(userId, businessId)`) | `AUTH_FORBIDDEN` |
| Membership inactive (`invited`/`suspended`/`removed`) | `AUTH_FORBIDDEN` (uniform for all non-active membership states — AD-4, §17) |
| Business inactive/suspended | `BUSINESS_INACTIVE` |
| Permission denied (role default insufficient, no override) | `AUTH_FORBIDDEN` |
| Sensitive permission not explicitly granted | `AUTH_FORBIDDEN` |
| Invalid/unrecognized `businessContextId` | `VALIDATION_FAILED` |
| Unknown/unrecognized permission identifier | `VALIDATION_FAILED` |
| Transient infrastructure read failure (e.g. Firestore timeout/unavailable) | `TEMPORARY_UNAVAILABLE` (retryable) |
| Structurally invalid / corrupt **server-owned stored** authorization state (§6.11 — a malformed `businessMemberships` document, an unrecognized `role` value, a corrupt `permissions` override entry, or a missing/corrupt catalogue or role-template config) | `AUTH_FORBIDDEN` (fail-closed deny) — **corrected mapping, AD-4, §17** |

**Resolved (AD-4, §17): `AUTH_FORBIDDEN` uniformly for all non-active membership states.** Both `invited`/`removed` and `suspended` membership map to `AUTH_FORBIDDEN`, reserving `ACCOUNT_SUSPENDED` for its established platform-user-level meaning (its existing, established usage elsewhere in the codebase) — avoiding taxonomy overload rather than requesting a new category.

**Correction to the server-owned configuration/data-integrity mapping (Founder-directed, AD-4, §17):** the original design text mapped "structurally invalid stored data" to `VALIDATION_FAILED`. The Founder correctly flagged this as a misclassification: `VALIDATION_FAILED` is established in this taxonomy for *client-supplied* input the caller can fix by sending something different; a corrupt or structurally invalid `businessMemberships` document, an unrecognized `role` value, or a malformed permission override is **server-owned data**, not client input, and retrying with the same request cannot fix it — it is neither a validation failure of the caller's input nor a transient condition. On review, the existing closed taxonomy *can* represent this condition correctly without inventing a category: it maps to `AUTH_FORBIDDEN` — the taxonomy's fail-closed "not permitted" code — because a permission decision that cannot be soundly computed must resolve to deny, exactly as every other unresolved-in-the-caller's-favor branch in §6.9/§6.10 does; the client-visible response therefore never distinguishes "you don't have this permission" from "the server could not soundly determine whether you have this permission," which is also correct enumeration-resistance behavior (§9) — it does not leak that a data-integrity defect exists. The actual defect detail (which document, which field, why) is captured only in the internal `reasonCode`/structured log (TRD11 §11.36), never in the client-facing taxonomy code. Genuinely transient infrastructure failures (a timed-out or momentarily unavailable Firestore read) remain distinct and correctly map to `TEMPORARY_UNAVAILABLE`, because those *are* retryable and are not a data-integrity defect. No new error category is required or authorized by this correction — the existing taxonomy fully represents both conditions once mapped correctly. If a future implementer finds this insufficiently granular for operational purposes, the closed-taxonomy governance (`F9B-DEC-001`) requires escalation before adding a category — this package does not pre-authorize one.

## 12. Capability-3 Dependency Boundary (Phase L)

**Dependency direction (corrected per AD-5, §14/§17):** `ENG-P2-004` depends only on the already-Complete Customer Identity concern and closes independently, entirely via governed test fixtures (§14, 004D) — it does not depend on any Capability-3 code. Capability 3 (`ENG-P2-002`/`ENG-P2-003`) consumes the completed `ENG-P2-004` authorization service only after `ENG-P2-004` closes. There is no circular dependency between the two.

1. **Contracts that must be stable before Capability 3 starts:** the `AuthorizationRequest`/`AuthorizationDecision` shapes (§6.1–6.2) and the role/permission identifiers in the catalogue (§3.2) plus role-default templates (§6.6) — Capability 3's staff-invitation and owner/manager UI flows will call the evaluator and need these contracts fixed.
2. **Role-assignment vs. evaluation split:** `ENG-P2-002`/`ENG-P2-003` (Capability 3) own *creating and mutating* `businessMemberships` records (invite, accept, suspend, remove — TRD10 §10.6.4 Membership Rules, PRD1 §13 lifecycle). `ENG-P2-004` owns *evaluating* those records against a requested permission (§6). Capability 3 does not implement its own parallel authorization logic.
3. **What `ENG-P2-004` owns vs. only evaluates:** `ENG-P2-004` owns the Sensitive Permission Catalogue (§3), the Override-Resolution Rule (§4), and the Evaluation/Audit services (§6–7). It does not own the `businessMemberships` document's lifecycle transitions (invite/accept/suspend/remove) — those remain Capability 3's (`ENG-P2-002`/`ENG-P2-003`) responsibility, consistent with `CDR-001` §5's existing cross-listing of `ENG-P2-004` under both capabilities.
4. **Explicitly deferred to Capability 3 (not designed here):** staff invitation UX/flow, business branch/profile management, and any UI for configuring per-membership overrides (the evaluator and override *data model* are designed here; the *UI/flow* that writes override records is Capability 3 scope).

## 13. Acceptance Criteria for Future Implementation (Phase M)

An `ENG-P2-004` implementation is acceptable only if it demonstrably satisfies all of the following, each traceable to a section above:

1. Deterministic resolution — identical inputs always produce identical `AuthorizationDecision` (§6.9).
2. Role-default inheritance implemented exactly per §6.6/PRD1 §7–§8 defaults, with no sensitive permission present in any non-owner default template (§3.3).
3. Explicit grant overrides a role default that would otherwise deny (§4.1.5).
4. Explicit revocation overrides both role default and any grant at the same membership (§4.1.3).
5. Sensitive permissions are never allowed by role default alone (§4.1.4), and the Owner floor (§3.6) is structural, not a grantable override.
6. Business-context isolation: a permission decision for Business A never reads or is influenced by any Business-B membership record (§5.6) — verified by a dedicated cross-tenant test.
7. Inactive/suspended membership always denies (§4.1.2/4.4.8).
8. Missing/unknown permission identifier always denies with `VALIDATION_FAILED` (§4.1.7/§11).
9. No cross-business leakage under concurrent multi-membership scenarios (§5.7, §9 abuse case 4).
10. Every sensitive-permission decision (allow or deny) produces exactly one audit record via the existing outbox mechanism, retry-safe and deduplicated by `eventId` (§7.4, §10.6).
11. Concurrency: protected mutating actions re-verify authorization state within their own transaction rather than trusting a prior decision beyond its single invocation (§10.8, TOCTOU).
12. Fail-closed behavior: every non-explicit-allow branch denies (§6.10 INV-1/2/3), verified by a test enumerating each row of §4.2's decision table.
13. No credential/token/session material appears in any audit record or log (§7.3, §9).
14. All evaluator/decision outcomes map only to the existing closed 14-category taxonomy — a test asserts no other code is ever returned (§11).
15. **Unit tests**: full coverage of the §4.2 decision table (every row), the §6.9 algorithm's branches, and §3.6's owner-floor invariant.
16. **Emulator/integration tests**: end-to-end evaluator calls against the Firestore emulator using real `businessMemberships` documents (created via 004D's governed test fixtures, §14 — not a dependency on any Capability-3 production command), including the authorization test matrix already named in the Programme's own `ENG-P2-004` row ("owner/manager/staff × action," `engineering-implementation-programme.md:213`).
17. **Security tests**: forged `businessContextId` rejection, cross-business leakage rejection, revoked-permission replay rejection, privilege-escalation-via-grant rejection — each abuse case in §9 has at least one corresponding test.

## 14. Implementation Decomposition Recommendation (Phase N)

**Resolved (AD-5, §17): four sub-packages, with the 004D boundary corrected to remove a Capability-3 sequencing dependency.** The original v1.0 text proposed 004D as "wiring the evaluator into at least one real protected command (candidate: an `ENG-P2-002`/`ENG-P2-003` staff-management action, once those exist)." The Founder correctly identified that this created a circular dependency: `ENG-P2-004` is positioned throughout this design and in `CDR-001` §5 as a prerequisite/unblocker Capability 3 consumes, but making `ENG-P2-004`'s own closure depend on a Capability-3 command existing first would mean neither capability could complete before the other — not approved. The corrected decomposition below makes `ENG-P2-004` a complete, closed, independently-consumable authorization capability entirely on its own, proven with governed test fixtures rather than a real Capability-3 command.

- **004A — Permission Contracts & Sensitive Permission Catalogue.** Owns: permission identifiers (a governed enum, §8.3), the Sensitive Permission Catalogue (§3), role/template contracts (§6.6), and override model/configuration contracts (§8's `PermissionOverride`/`RoleTemplate`/`SensitivePermissionCatalogue`). No authorization runtime yet — this package is pure contract/config, matching TRD10 §10.6.4's existing `businessMemberships` shape without altering it. **Depends on:** the already-Complete Customer Identity concern (consumes the Internal Customer ID as the subject identifier, §6.3) — nothing else. **Acceptance boundary:** the catalogue and contracts exist, are versioned, and are independently reviewable; no evaluator exists to call them yet.
- **004B — Permission Evaluation.** Owns: the deterministic evaluator (§6), the Override-Resolution Rule and decision table (§4), business-context isolation (§5.4–5.7), fail-closed decision semantics (§6.10, INV-1/2/3), authoritative-state reads (direct `businessMemberships`/business reads, never cached — §6.12, AD-2), and the security/unit/emulator proofs for the evaluator itself (decision-table coverage, owner-floor invariant, cross-business isolation test). **Depends on:** 004A (the catalogue and contracts it evaluates against). **Acceptance boundary:** given real or fixture `businessMemberships` documents, the evaluator produces the correct `AuthorizationDecision` for every §4.2 decision-table row and every §9 abuse case — provable entirely with fixture data, no dependency on any Capability-3 code.
- **004C — Permission Decision Audit.** Owns: sensitive-decision audit/event integration (§7), the shared-outbox reuse and same-transaction durability discipline (§7.2's consistency-boundary clarification), the privacy-safe audit payload (§7.3, TRD21 §21.6 Class 2), and retry/idempotency behavior (deterministic `eventId`, dedup-by-`eventId`, §7.4/§10.6). **Depends on:** the stable `AuthorizationDecision` contract from 004B (needs a real decision shape to audit) — testable against 004B's decision output directly, still with no Capability-3 dependency. **Acceptance boundary:** every sensitive-permission decision (allow or deny) produces exactly one retry-safe, deduplicated audit record; non-sensitive decisions do not.
- **004D — Authorization Boundary Integration, Security Validation & `ENG-P2-004` Closure.** **Must NOT depend on Capability 3 implementation.** Owns: the stable authorization/gate interface exposed for consuming domains (the API/service boundary, §6.16), repository/infrastructure integration (wiring 004A–004C together as one callable service), real Firestore-emulator persistence/emulator validation, the cross-business isolation proof (§5.6, §13 item 6) against real emulator data, concurrency/TOCTOU treatment (§10.8), and the full `ENG-P2-004` security/invariant validation and closure evidence (§13's acceptance criteria in their entirety). Where the acceptance criteria call for proving the evaluator against realistic protected-command scenarios (e.g. "owner/manager/staff × action," the authorization test matrix already named in the Programme's `ENG-P2-004` row), 004D uses **governed test fixtures, harnesses, and adapters internal to this package** — synthetic `businessMemberships`/business records and a minimal test-only command shim that calls the evaluator the same way a real domain command would — to prove the authorization boundary works correctly, without requiring an actual Capability-3 production command to exist. **Depends on:** 004A–004C only. **Acceptance boundary:** `ENG-P2-004` is closed — a stable, fully-tested, independently-usable authorization service exists and is ready for any consuming domain (Capability 3 or otherwise) to call.

**Corrected dependency direction (no circularity):**

```
Customer Identity (Complete)
  → ENG-P2-004A (contracts & catalogue)
  → ENG-P2-004B (evaluation)
  → ENG-P2-004C (audit)
  → ENG-P2-004D (integration, validation, closure) → ENG-P2-004 Complete
      → Capability 3 (ENG-P2-002/ENG-P2-003) consumption/integration
```

`ENG-P2-004` depends only on the already-Complete Customer Identity concern; nothing in `ENG-P2-004A`–`004D` depends on Capability 3. Capability 3's own work packages (`ENG-P2-002`/`ENG-P2-003`) may consume the completed `ENG-P2-004` authorization service once it closes, exactly matching `CDR-001` §5's framing of `ENG-P2-004` as shared infrastructure for Capability 2 and Capability 3, not the reverse.

**Rationale:** mirrors the Programme's own successful decomposition pattern for `ENG-P2-001` (ten packages, each independently reviewable and mergeable); keeps the highest-risk piece (the evaluator, 004B) isolated from catalogue-content churn (004A) and from audit-plumbing churn (004C); and — corrected per AD-5 — lets all four sub-packages, including closure, complete without waiting on Capability 3, so `ENG-P2-004` can be fully closed and handed off as a stable dependency *to* Capability 3 rather than the two capabilities blocking each other.

## 15. Founder Decision Points (Phase O) — RESOLVED, see §17

**All five decision points below are now resolved.** This section is preserved unmodified as the historical record of what was originally presented for Founder consideration (repository convention: preserve prior analysis, do not rewrite); §17 records the actual dispositions, rationale, dates, and authority, and supersedes the "Recommendation" column below wherever a disposition differs from what was originally recommended (only F-5's 004D boundary differs — see AD-5). The document body (§3.4, §6.12, §7.2, §11, §14) has been updated in place to reflect the governed outcome, not merely the recommendation.

Only genuine policy/architecture choices not safely derivable from existing governance are listed. Implementation-level judgment calls already resolved above (e.g., decision-table precedence, audit mechanism reuse) are not repeated here.

| # | Issue | Options | Recommendation | Consequences |
|---|---|---|---|---|
| F-1 | Should `business.transferOwnership` (and any other future high-blast-radius permission) require dual control / elevated approval, beyond "explicit grant, owner-only"? | (i) No dual control for MVP — single-Owner-action, as designed in §3.4/§3.6; (ii) require a second-owner or platform-admin co-sign for ownership transfer specifically | (i) — no governed requirement for dual control exists anywhere in the repo today; introducing one is a genuine new product decision, not an ENG-P2-004 design detail | If (ii) is chosen, it adds a new workflow/state machine not currently scoped to any work package and would need its own decision record before `ENG-P2-004` implementation is authorized |
| F-2 | Should the evaluator cache decisions (even briefly, per TRD12 §12.11's "should be cacheable")? | (i) No caching in v1, re-read Firestore every call (recommended, §6.12); (ii) short-TTL revocation-aware cache | (i) — simplest, matches TRD12 §12.9's staleness warning most directly, and nothing in the current traffic/latency profile of a not-yet-built feature justifies the added complexity | If (ii) is later wanted, it needs its own design pass (cache-invalidation-on-write guarantee) before implementation |
| F-3 | Confirm audit-mechanism reuse: dedicated permission-audit store vs. existing outbox/projection reuse (§7.2)? | (i) Reuse outbox + projection (recommended); (ii) build a dedicated store | (i) — strictly less new surface area, direct precedent (`ENG-P2-001-10`, `AUTH-08`), no governed reason found favoring (ii) | If (ii) is preferred for a reason not visible in documentation (e.g. a compliance requirement), that reason should be recorded before 004C is authorized |
| F-4 | Confirm error-code mapping for non-active membership states uniformly to `AUTH_FORBIDDEN` rather than `ACCOUNT_SUSPENDED` (§11)? | (i) `AUTH_FORBIDDEN` uniformly (recommended); (ii) `ACCOUNT_SUSPENDED` for membership-level suspension specifically | (i) — avoids overloading a code whose established usage is platform-user-level suspension | If (ii) is preferred, it should be recorded as a taxonomy-usage clarification, not treated as a new category (no `F9B-DEC-001` re-escalation needed either way since no new code is added) |
| F-5 | Confirm implementation decomposition (§14): one bounded package vs. four sub-packages (004A–004D)? | (i) Four sub-packages (recommended); (ii) one bounded package | (i) — matches the Programme's own successful `ENG-P2-001` decomposition precedent and isolates risk | (ii) would need Capability 3's packages to exist before 004D-equivalent integration work could complete inside the same package, likely stalling the whole package on an external dependency |

## 16. Status Reconciliation Corrections Applied

Minimum, dated superseding notes only — no historical report rewritten:

- Master Workflow `docs/05-implementation/11thonus-master-workflow.md` §6 (Master Programme Map) and §17 (Current Next Action): superseding note added, dated 2026-08-14, pointing to this design package and clarifying that "Blocked" (§6) and "Blocked — partially" / "Blocked — partially implemented" (§17, Programme, CDR-001) are synonymous descriptions of the same fact (zero `ENG-P2-004` implementation exists; design-level prerequisites are now delivered for Founder review by this package).
- `engineering-implementation-programme.md` `ENG-P2-004` row: Notes field appended with a pointer to this design package; Status cell left as `Blocked` (implementation remains unauthorized — this package does not change that).
- `CDR-001-capability-delivery-roadmap.md` §5/§8: pointer to this design package added; no status value changed.
- `docs/changes/IMPLEMENTATION_CHANGES.md` and `docs/00-governance/documentation-changes-log.md`: append-only entries recording this package's creation.
- `decision-register.md`: **not modified** — `DEC-ID-003` is not reopened; this package is referenced from it only via the pointer already present in `DEC-ID-003`'s consequence field, which remains unchanged.

## 17. Founder Dispositions (Recorded 2026-08-14)

**Authority:** Founder, via task "ENG-P2-004-DESIGN-001 — Record Founder Dispositions & Correct Final Decomposition," 2026-08-14. Recorded here per this design package's own governance convention (the same inline, dated, attributed disposition pattern already used elsewhere in this repository for implementation-level Founder decisions, e.g. the `AD-1`/`AD-2` dispositions recorded in the `AUTH-07` entry of Master Workflow §17) — **not** a new Decision Register (`DEC-*`) entry, and **not** a reopening of `DEC-ID-003`. This section is the authoritative disposition record for the five items originally raised in §15; §15 itself is preserved unmodified as history.

### AD-1 — Dual Control (resolves F-1)

- **Disposition:** **APPROVED — Option A.** MVP will not introduce dual control for any permission.
- **Rationale (Founder):** sensitive permissions remain never-implicitly-inherited where governed as sensitive, explicitly granted, deny-by-default, and mandatorily audited where required — that is sufficient for MVP. Dual control is deferred until a governed product capability actually requires it, particularly any future ownership-transfer workflow. No speculative dual-control state machine is to be designed within `ENG-P2-004`.
- **Design updated:** §3.4.
- **Superseded recommendation:** none — the Founder's disposition matches this package's original recommendation (§15 F-1, Option (i)) exactly; only the status changed from "recommended" to "governed."

### AD-2 — Permission Evaluator Caching (resolves F-2)

- **Disposition:** **APPROVED — Option A.** No cross-request evaluator cache in MVP.
- **Rationale (Founder):** permission evaluation must read authoritative current state. No shared decision caching, invalidation machinery, or stale-permission window may be introduced. A future governed optimization may add caching only if demonstrated load requires it.
- **Design updated:** §6.12, §10.7.
- **Superseded recommendation:** none — matches §15 F-2 Option (i) exactly; status changed from "recommended" to "governed."

### AD-3 — Audit Mechanism (resolves F-3)

- **Disposition:** **APPROVED — Option A.** Reuse the existing shared outbox/audit architecture; no second permission-audit subsystem.
- **Rationale (Founder):** the later implementation must preserve the correct consistency boundary between the authorization decision, the protected command/action, and the required sensitive-decision audit evidence — a disconnected best-effort audit emission is not sufficient where governance requires durable attribution. Existing transaction/idempotency/outbox patterns are to be reused wherever applicable.
- **Design updated:** §7.2 (adds the consistency-boundary clarification as a Founder-directed addition, not present in the original recommendation).
- **Superseded recommendation:** none in substance (§15 F-3 Option (i) was already "reuse outbox"); the consistency-boundary requirement is a **new, Founder-directed clarification** layered onto the original recommendation, not a reversal of it.

### AD-4 — Error Taxonomy (resolves F-4)

- **Disposition:** **APPROVED — Option A, with a correction to the configuration-integrity mapping.** `AUTH_FORBIDDEN` is used for membership-level authorization denial, including all non-active membership states; `ACCOUNT_SUSPENDED` is reserved for its established platform-account-suspension meaning. No new error category is authorized or required.
- **Rationale (Founder):** the original v1.0 mapping of "structurally invalid stored data" to `VALIDATION_FAILED` was reviewed and found to misclassify a server-side integrity/configuration defect as client input for convenience — not acceptable. The condition must be mapped using the existing taxonomy according to its established semantics and must fail closed. On review (§11), the existing taxonomy fully represents the condition without a new category: server-owned configuration/data-integrity failures now map to `AUTH_FORBIDDEN` (fail-closed deny, consistent with every other unresolved-in-the-caller's-favor branch of the evaluation algorithm), and genuinely transient infrastructure failures remain separately mapped to `TEMPORARY_UNAVAILABLE`. The taxonomy was **not** found to be genuinely unable to represent the condition, so no escalation/STOP was triggered.
- **Design updated:** §11 (mapping table and note rewritten), §6.11 (aligned to the corrected mapping), §9 (stray cross-reference corrected).
- **Superseded recommendation:** the membership-state portion of §15 F-4 (Option (i)) is unchanged; the configuration-integrity portion of the original §11 text (which was not raised as an open Founder decision in §15's table, but was reviewed at the Founder's direction) is corrected as described above and superseded in place.

### AD-5 — Implementation Decomposition (resolves F-5)

- **Disposition:** **APPROVED — four sub-packages (004A–004D), with a required correction to the 004D boundary.**
- **Rationale (Founder):** the original 004D proposal ("wiring the evaluator into at least one real protected command... once [`ENG-P2-002`/`ENG-P2-003`] exist") created a circular dependency — `ENG-P2-004` is described throughout this design and `CDR-001` §5 as a prerequisite/unblocker for Capability 3, but making 004D depend on a Capability-3-supplied command would mean neither could complete first. Not approved. `ENG-P2-004` must become a complete, stable, consumable authorization capability before a consuming Capability-3 command is required. 004D must not depend on Capability 3 implementation; governed test fixtures/harnesses/adapters are to be used to prove the authorization boundary without requiring an actual Capability-3 production command.
- **Design updated:** §14 (004A–004D boundaries rewritten in full per the Founder's specification, corrected dependency-direction diagram added), §12 (dependency-direction cross-reference added), §13 item 16 (fixture clarification).
- **Superseded recommendation:** §15 F-5's original 004D description ("wiring the evaluator into at least one real protected command... once [Capability 3 packages] exist") is **superseded** by §14's corrected 004D boundary (governed fixtures/harnesses, no Capability-3 dependency). 004A–004C are unchanged from the original recommendation.

### Consistency Verification (post-disposition review)

Performed against all five dispositions above:

1. **Sensitive Permission Catalogue remains bounded to governed capabilities** — unchanged from §3.2; no permission added or removed by these dispositions.
2. **No dual-control machinery remains required for MVP** — confirmed; §3.4 designs none (AD-1).
3. **Evaluator is authoritative-state/read-through** — confirmed; §6.12 now states this as governed, no cache (AD-2).
4. **Override resolution remains deterministic and fail-closed** — confirmed; §4's precedence order and decision table are unchanged by any disposition.
5. **Business-context isolation remains explicit** — confirmed; §5 unchanged by any disposition.
6. **Audit reuse is architecture-consistent** — confirmed; §7.2 now states the outbox-reuse requirement as governed and adds the consistency-boundary clarification (AD-3), consistent with the existing `ENG-P2-001-10`/`AUTH-08` precedent.
7. **No new error category** — confirmed; §11's corrected mapping (AD-4) uses only existing categories (`AUTH_FORBIDDEN`, `TEMPORARY_UNAVAILABLE`).
8. **Internal configuration/data-integrity errors are mapped consistently** — confirmed; §6.11 and §11 now agree (`AUTH_FORBIDDEN` client-facing, internal `reasonCode` for detail).
9. **004A–004D have no circular dependency** — confirmed; §14's corrected dependency-direction diagram shows a single forward chain (Customer Identity → 004A → 004B → 004C → 004D → Capability 3 consumption), with no edge from `ENG-P2-004` back into Capability 3.
10. **`ENG-P2-004` can complete before Capability 3 consumes it** — confirmed; 004D's acceptance boundary (§14) requires only 004A–004C and governed fixtures, not any Capability-3 code.
11. **Capability 3 scope has not leaked into `ENG-P2-004`** — confirmed; §12 unchanged in substance — `ENG-P2-004` still owns evaluation/catalogue/audit only, not membership lifecycle (invite/accept/suspend/remove), which remains Capability 3's.
12. **ITM remains independent and unstarted** — confirmed; no disposition above touches ITM; §0 status unchanged (Not started — Unauthorised).

**No unresolved Founder decision remains in this design package.**

---

## Report (per task §REPORT)

1. **Entry `origin/main` SHA:** `46f081c9c1cad4742660828d883742949eeac1d1`
2. **Current Capability-2 state:** Open — partially implemented; not closed (Customer Identity + Authentication concerns Complete; ITM Not started — Unauthorised; `ENG-P2-004` and G2 outstanding)
3. **`ENG-P2-004` current authoritative status:** Not started — Unauthorised (this package is design-only; implementation remains unauthorized)
4. **Status corrections applied:** §16 above — dated superseding cross-reference notes only, no historical rewrite
5. **`DEC-ID-003` policy reconstructed:** §2.A
6. **Already-decided vs. unresolved split:** §2.A vs. §2.B
7. **Sensitive Permission Catalogue:** §3
8. **Override-Resolution Rule:** §4
9. **Role-context isolation model:** §5
10. **Permission Evaluation design:** §6
11. **Permission Audit design:** §7
12. **Data/domain model:** §8
13. **Dependency direction:** §6.15
14. **Security/privacy analysis:** §9
15. **Abuse-case analysis:** §9 table
16. **Concurrency/consistency analysis:** §10
17. **Idempotency treatment:** §10.4–10.6
18. **Error-taxonomy mapping:** §11
19. **Capability-3 boundary:** §12
20. **Acceptance criteria:** §13
21. **Test strategy:** §13 items 15–17
22. **Implementation decomposition:** §14
23. **Founder decisions required:** §15 (F-1..F-5) — **all five now resolved, see §17 AD-1–AD-5; no unresolved decision remains**
24. **Recommended Founder dispositions:** §15 "Recommendation" column each row (historical); **actual recorded dispositions:** §17
25. **Files created/modified (v1.0):** this document (new); Master Workflow, Engineering Programme, CDR-001, `IMPLEMENTATION_CHANGES.md`, `documentation-changes-log.md` (dated pointer/notes only — see §16 and the actual diffs applied in this task). **v1.1 (this update):** this document only (§3.4, §6.11, §7.2, §9, §11, §12, §14, §15, §17 added/revised) — no tracking-document edits were required for the disposition-recording pass itself.
26. **Documentation diff summary (cumulative):** one new architecture/design document (v1.0) subsequently revised in place (v1.1) to record Founder dispositions and correct the §14/004D decomposition and §11 error mapping; five pointer/cross-reference-only edits to existing tracking documents (v1.0 only); zero historical reports rewritten; zero decision-register changes at either version.
27. **Runtime code changed:** NONE
28. **Dependencies added:** NONE
29. **Config changes:** NONE
30. **Deployment changes:** NONE
31. **Programme/traceability updates:** pointer notes only (§16); RTM not modified (no RTM entry for `ENG-P2-004`/F11 wording was found to require correction)
32. **Risks:** (a) *(resolved in v1.1 — F-1–F-5 are no longer open; see §17)*; (b) the catalogue (§3.2) is MVP-scoped and may need extension once Capability 3's actual staff-management UI surfaces further sensitive actions; (c) §6.12's no-caching choice (now governed, AD-2) trades latency for correctness — acceptable at current scale, revisit only via a future separately authorized design if evaluator call volume becomes a measured bottleneck
33. **Rollback instructions:** `git revert` of this task's commit(s) — this design package and its five pointer-note edits are additive/documentation-only; no code, schema, or deployment state to roll back
34. **Design PR number:** not opened by this task (design package delivered on a worktree branch for Founder review; PR creation was not requested and would be a separate explicit step)
35. **Final head SHA:** recorded at commit time (see task closure commit)
36. **CI/validation result:** N/A — documentation-only change; no CI pipeline gates markdown-only commits in this repository's current configuration
37. **ITM status:** unchanged, Not started — Unauthorised; out of scope (§14 excluded)
38. **Capability-3 status:** unchanged, Not started — all listed work packages Blocked
39. **AUTH-10 status:** unchanged, undefined/not started; out of scope
40. **Dirty primary worktree status:** untouched — all work performed in a clean detached worktree from `origin/main`; `/Users/theo/11THONUS`'s inherited dirty state was not read for content and was not reset, cleaned, rebased, stashed, or committed
41. **Persistent markdown design-report location:** `docs/05-implementation/roadmap/ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md`
42. **Changes-tracking update:** appended to `docs/changes/IMPLEMENTATION_CHANGES.md` and `docs/00-governance/documentation-changes-log.md`

---

## FINAL GATE

**ENG-P2-004 DESIGN DECISIONS RECORDED — READY FOR FOUNDER FINAL REVIEW/MERGE**

All five Founder decision points (§15, F-1 through F-5) are now resolved and recorded as dispositions AD-1–AD-5 (§17). No unresolved Founder decision remains in this design package. `DEC-ID-003` was not reopened. No new error-taxonomy category was invented — the one questionable mapping (server-owned configuration-integrity failures) was corrected to an existing category (`AUTH_FORBIDDEN`) rather than escalated. The 004D decomposition boundary was corrected to remove a circular dependency on Capability 3. No implementation was performed. No Capability 3 or ITM work was begun. This design package remains architecture only and does not itself authorize `ENG-P2-004` implementation — a separate implementation-authorization task is required before coding begins.
