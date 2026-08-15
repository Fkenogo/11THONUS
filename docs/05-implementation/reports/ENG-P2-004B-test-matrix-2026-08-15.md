> **Title:** ENG-P2-004B — Permission Evaluator Test Matrix
> **Status:** Pre-implementation test plan (Phase C), written before the evaluator exists
> **Governing design:** [ENG-P2-004-DESIGN-001](../roadmap/ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md) v1.1, §4 (Override-Resolution Rule), §6 (Permission Evaluation Design), §9 (abuse cases), §11 (error taxonomy)
> **Governing contracts:** `functions/src/domains/permissions/models/*` (ENG-P2-004A, merged 96e0524)

This matrix is derived directly from the design's own decision table (§4.2), evaluation
algorithm (§6.9), abuse-case table (§9), and error-taxonomy mapping (§11). It is written
and reviewed before any evaluator code exists (Phase D genuine RED evidence follows this
document). Every row maps to a design section — no row invents new semantics.

Legend: **Unit** = pure-function test against `evaluateAuthorizationDecision` (no Firestore).
**Emu** = `*.emulator.test.ts` against real Firestore documents. **Adv** = adversarial/abuse-case test.

## A. Authentication / subject state

| # | Scenario | Design ref | Expected | Test type |
|---|---|---|---|---|
| 1 | No authenticated/known `userId` (empty/undefined subject) | §6.1, §11 `AUTH_REQUIRED` | Deny, `AUTH_REQUIRED` | Unit |
| 2 | Unresolved subject (`userId` present but no membership resolves for any business — covered structurally by case 10) | §6.9 step 3 | Deny, `AUTH_FORBIDDEN` | Unit |
| 3 | Valid subject with active membership | §6.9 | Proceeds past subject gate | Unit |

## B. Business context

| # | Scenario | Design ref | Expected | Test type |
|---|---|---|---|---|
| 4 | Missing `businessId` in request | §5.4, §6.1 | Deny, `VALIDATION_FAILED` | Unit |
| 5 | Malformed `businessId` (empty string / non-string) | §5.4 | Deny, `VALIDATION_FAILED` | Unit |
| 6 | Business not found (`businesses/{id}` doc absent) | §6.9 step 2, §6.11 | Deny, `BUSINESS_INACTIVE` | Unit + Emu |
| 7 | Inactive/suspended business (`status != "active"`, each of the 7 non-active values) | §4.1.1, §4.4.9 | Deny, `BUSINESS_INACTIVE` | Unit (param.) + Emu |
| 8 | Correct, active business context | §4.1.1 pass | Proceeds past business gate | Unit |
| 9 | Forged cross-business context (client proposes B, server independently resolves membership for B only) | §5.4, §9 abuse #1 | Server never trusts client-cached role; resolves fresh | Adv + Emu |

## C. Membership

| # | Scenario | Design ref | Expected | Test type |
|---|---|---|---|---|
| 10 | Membership missing (`(userId, businessId)` has no record) | §4.1.2, §6.9 step 3 | Deny, `AUTH_FORBIDDEN` | Unit + Emu |
| 11 | Invited (non-active) membership | §4.1.2, §4.4.8 | Deny, `AUTH_FORBIDDEN` | Unit (param.) |
| 12 | Suspended membership | §4.1.2, §4.4.8, AD-4 | Deny, `AUTH_FORBIDDEN` | Unit (param.) |
| 13 | Removed membership | §4.1.2, §4.4.8 | Deny, `AUTH_FORBIDDEN` | Unit (param.) |
| 14 | Active membership | §4.1.2 pass | Proceeds past membership gate | Unit |
| 15 | Membership belongs to another business (resolved membership's `businessId` doesn't match request — defence-in-depth even though repository query is scoped) | §5.6 | Deny, `AUTH_FORBIDDEN` | Unit + Adv |

## D. Permission identity

| # | Scenario | Design ref | Expected | Test type |
|---|---|---|---|---|
| 16 | Valid, well-formed permission id | §6.9 step 4 pass | Proceeds past id-shape gate | Unit |
| 17 | Malformed permission identifier (fails `isWellFormedPermissionId`) | §4.1.7, §11 | Deny, `VALIDATION_FAILED` | Unit |
| 18 | Unknown identifier at the sensitive-catalogue boundary — well-formed but not in catalogue and not in role template (non-sensitive, ungoverned baseline id) | §6.9 steps 8–10 | Deny (falls through to step 10 — no governed default exists) | Unit |

## E. Role/default inheritance

| # | Scenario | Design ref | Expected | Test type |
|---|---|---|---|---|
| 19 | Role default allows an ordinary governed permission (Manager, `customer.viewProtectedProfile`, no override) | §4.1.6, §6.9 step 9 | Allow, `permissionSource="role-default"` | Unit |
| 20 | Role default denies (Staff, `customer.viewProtectedProfile`, no override, not sensitive-exempt) | §6.9 step 10 | Deny, `AUTH_FORBIDDEN` | Unit |
| 21 | Role/template cannot implicitly grant a never-inheritable sensitive permission (Manager, `staff.manage`, no override) | §3.3, §4.1.4, §6.9 step 8 | Deny, `AUTH_FORBIDDEN` (role default alone never satisfies sensitive) | Unit |
| 22 | Owner receives no *ungoverned* bypass for a non-sensitive permission outside the catalogue (Owner floor only covers catalogue entries, §3.6) | §3.6 scope limit | Deny for non-catalogue permission absent explicit grant/role-default | Unit |

## F. Overrides

| # | Scenario | Design ref | Expected | Test type |
|---|---|---|---|---|
| 23 | Explicit grant (Manager, `transaction.reverse`, granted) | §4.1.5, §6.9 step 7 | Allow, `permissionSource="explicit-grant"` | Unit |
| 24 | Explicit revocation (Staff, `customer.viewProtectedProfile` role-default-eligible via grant, then revoked) | §4.1.3, §6.9 step 6 | Deny, `AUTH_FORBIDDEN` | Unit |
| 25 | Both grant + role-default present (Manager, `customer.viewProtectedProfile`, both default and explicit grant) | §4.2 row 6 | Allow, `permissionSource="explicit-grant"` (grant checked before role-default, same outcome either way) | Unit |
| 26 | Default + revocation interaction (Manager, `customer.viewProtectedProfile` default-allowed, explicitly revoked) | §4.2 row "Yes/—/Yes" | Deny — revocation beats role default | Unit |
| 27 | Unsupported grant direction (attempt to construct grant for `business.transferOwnership`, `explicitGrantRequired=false`) | §3.2 row 3, `permissionOverrideDirectionNotSupportedError` | Rejected at 004A contract layer (already covered by `permissionOverride.test.ts`); evaluator never sees such an override — confirm evaluator does not special-case it | Unit |
| 28 | Unsupported revocation direction (`explicitRevocationSupported=false`, `business.transferOwnership`) | §3.2 row 3 | Same as #27 — rejected upstream at override-construction time | Unit |
| 29 | Override belongs to another business (membership resolved for Business A carries an override object stamped `businessId=B`) | §5.6, defence-in-depth | Deny / override ignored — evaluator only trusts overrides embedded in the resolved membership for the request's own business | Unit + Adv |
| 30 | Override belongs to another membership (`membershipId` on the override doesn't match the resolved membership's own id) | §5.6 defence-in-depth | Override ignored, evaluated as if absent | Unit + Adv |

## G. Sensitive permissions

| # | Scenario | Design ref | Expected | Test type |
|---|---|---|---|---|
| 31 | Sensitive permission, no explicit grant, non-owner role | §4.1.4 | Deny, `AUTH_FORBIDDEN` | Unit |
| 32 | Sensitive permission, valid explicit grant, all other gates pass (Manager, `staff.manage`, granted, active membership, active business) | §4.1.5 | Allow, `permissionSource="explicit-grant"` | Unit |
| 33 | Sensitive permission with revocation (Manager granted `transaction.reverse` then revoked) | §4.1.3 (checked before sensitivity) | Deny, `AUTH_FORBIDDEN` | Unit |
| 34 | Role eligibility restriction enforced at evaluation time (a grant object present but its `targetRole` mismatch — defence-in-depth even though 004A construction already rejects this) | §3.2, `permissionOverride.ts` invariant | Evaluator trusts only what's structurally valid; malformed override → fail closed | Unit |

## H. Precedence

| # | Scenario | Design ref | Expected | Test type |
|---|---|---|---|---|
| 35 | Explicit revocation precedence over role default AND over a simultaneously-present (invalid/duplicate) grant record | §4.1 ordering, §4.2 | Deny | Unit |
| 36 | Sensitive explicit-grant requirement even when business+membership+role would otherwise pass | §4.1.4 | Deny absent grant | Unit |
| 37 | Role/template default only evaluated after business/membership/sensitivity gates (ordering test — role default present but business inactive) | §6.9 ordering | Deny, `BUSINESS_INACTIVE` (business gate short-circuits before role default is even consulted) | Unit |
| 38 | No "most-permissive-wins": construct a case where role-default=deny, grant=absent, revoke=absent, sensitive=no → confirm deny, not allow-by-default | §4.1 note | Deny | Unit |

## I. Integrity / failure

| # | Scenario | Design ref | Expected | Test type |
|---|---|---|---|---|
| 39 | Malformed server-owned configuration (corrupt/unrecognized `role` value on stored membership doc) | §6.11, §11 AD-4 | Deny, `AUTH_FORBIDDEN` (internal reasonCode distinguishes cause) | Unit + Emu |
| 40 | Contradictory stored authorization data (membership `permissions[]` contains an unparseable/malformed entry) | §6.11 | Deny, `AUTH_FORBIDDEN` | Unit |
| 41 | Transient repository read failure (Firestore read throws/times out) | §11 `TEMPORARY_UNAVAILABLE` | Deny outcome surfaced as retryable `TEMPORARY_UNAVAILABLE`, never allow | Unit (mocked throw) |
| 42 | Missing required catalogue/config state (permission claims sensitive but catalogue lookup fails) | §6.11, `unrecognisedSensitivePermissionError` | Deny, `AUTH_FORBIDDEN` fail-closed | Unit |

## J. Cross-business isolation

| # | Scenario | Design ref | Expected | Test type |
|---|---|---|---|---|
| 43 | Business A membership (Owner) cannot authorize a Business B request | §5.6, §9 abuse #4 | Deny for Business B | Adv + Emu |
| 44 | Business A override cannot affect Business B evaluation of the same user/permission | §5.6 | Business B evaluated independently, no leakage | Adv + Emu |
| 45 | Same person, two memberships (Business A Owner, Business B Staff) — each resolves independently in the same test run | §5.7 | Two independent decisions, no union | Adv + Emu |

## K. Determinism

| # | Scenario | Design ref | Expected | Test type |
|---|---|---|---|---|
| 46 | Same authoritative state evaluated twice → identical decision | §13 item 1 | Byte-identical `allowed`/`reasonCode`/`permissionSource` (excluding `evaluatedAt`) | Unit |
| 47 | Evaluator does not mutate state (no Firestore writes issued) | §6.18 | Assert zero write calls / emulator collection unchanged after evaluation | Unit + Emu |
| 48 | Evaluator does not emit audit events (no outbox writes) | §6.18, §7.4 (caller's job, not evaluator's) | Assert `outboxEntries` collection empty after evaluation | Emu |
| 49 | Evaluator does not cache cross-request state (two sequential calls both hit Firestore; a mutation between them is observed) | §6.12, AD-2 | Second call reflects the mutation — no stale read | Emu |

## Coverage note

This matrix additionally requires, per acceptance criteria §13 item 15, a test asserting
**every row of design §4.2's decision table** is covered by name (not just by scenario
grouping above) — implemented as a single parametrized test table in
`evaluatePermission.test.ts` mirroring §4.2's rows 1:1.
