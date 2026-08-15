> **Title:** ENG-P2-004C — Permission Decision Audit Integration Test Matrix
> **Status:** Pre-implementation test plan (Phase L), written before the audit service exists
> **Governing design:** [ENG-P2-004-DESIGN-001](../roadmap/ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md) v1.1, §7 (Permission Audit Design), §14 004C
> **Governing contracts:** `functions/src/domains/permissions/{models,evaluator,service}/*` (004A/004B, merged `046f22d`); `functions/src/shared/outbox/*`, `functions/src/shared/events/*` (ENG-P1-002); `functions/src/domains/authentication/{events,services}/authenticationEvent*` (AUTH-08 precedent)

Derived independently from design §7, the AUTH-08 precedent (with one factual
correction — see below), and TRD21 §21.6. Written and reviewed before any 004C
code exists.

## Precedent correction (load-bearing for this design)

AUTH-08 (design's own cited precedent for "reuse the outbox") does **not**
actually write its audit entry in the *same* transaction as the protected
action's state change — `emitCustomerAuthenticated`/`emitAuthenticationRecoveryProofProvided`
open their **own** standalone `db.runTransaction`, called *after*
`handleAuthenticate`/`handleRecoverIdentity` already returned (`index.ts`).
AD-3 requires strictly more for permission-decision audit: "the outbox entry
is written in the same transaction as the protected command's own state
change." 004C therefore does **not** copy AUTH-08's own-transaction pattern
for its primary API — the core write function accepts a `Transaction`
parameter (mirroring `writeOutboxEntry` itself) so a future 004D protected
command can call it inside its own transaction. A thin own-transaction
wrapper exists only for 004C's standalone tests, clearly documented as not
representing the final 004D integration shape.

## A. Sensitive allow

| # | Scenario | Expected |
|---|---|---|
| 1 | Sensitive permission, `allowed: true`, resolved role | Audit event written; payload `result: "allow"`, `effectiveRole` present, `decisionSource` matches 004B's `permissionSource` |
| 2 | Payload contains no forbidden fields (token/password/OTP/session/raw config) | Assert payload key set is exactly the governed allow-list |

## B. Sensitive deny

| # | Scenario | Expected |
|---|---|---|
| 3 | Sensitive permission, `allowed: false`, resolved role (e.g. `SENSITIVE_PERMISSION_NOT_GRANTED`) | Audit event written; `result: "deny"`, correct `reasonCode`/`decisionSource` |
| 4 | Payload safety | Same as #2 for a deny record |

## C. Explicit revocation

| # | Scenario | Expected |
|---|---|---|
| 5 | Sensitive permission denied via `EXPLICIT_REVOCATION` | Audit event written, `decisionSource: "explicit-revocation"` |

## D. Role-ineligible explicit grant

| # | Scenario | Expected |
|---|---|---|
| 6 | Sensitive permission denied via `GRANT_NOT_HONORED` (004B pass-5 fix) | Audit event written, deny recorded with correct reasonCode |

## E. Server-integrity fail-closed

| # | Scenario | Expected |
|---|---|---|
| 7 | Sensitive permission denied via `BUSINESS_CONFIG_MALFORMED`/`MEMBERSHIP_CONFIG_MALFORMED`/`MALFORMED_OVERRIDE_DIRECTION` | Audit event written; internal `reasonCode` preserved for logs, but payload never contains raw malformed document contents (004C never receives them — 004B's `EvaluationInput` result unions already discard the raw document, so this is structurally impossible, verified by type-level review, not just a runtime check) |

## F. Non-sensitive decision

| # | Scenario | Expected |
|---|---|---|
| 8 | Non-sensitive/ungoverned permission, allow or deny | **No** outbox entry written — verified by an emulator test asserting zero net `outboxEntries` documents |

## G. Retry

| # | Scenario | Expected |
|---|---|---|
| 9 | Same decision context (same idempotency-key input) recorded twice | Second call is a no-op (idempotent enqueue skip) — exactly one outbox document exists |

## H. Duplicate delivery

| # | Scenario | Expected |
|---|---|---|
| 10 | Two concurrent/duplicate calls with the same idempotency-key input | Still exactly one outbox document (the read-then-set-if-absent transaction is the dedup mechanism, not a separate lock) |

## I. Different decision

| # | Scenario | Expected |
|---|---|---|
| 11 | Two calls with different idempotency-key inputs (different logical requests) | Two distinct outbox documents with distinct `eventId`s |

## J. Privacy

| # | Scenario | Expected |
|---|---|---|
| 12 | Inspect the full payload shape/keys statically and at runtime | No credential, token, password, OTP, session, raw email/phone field anywhere; `privacyClassification` is always `class_2_internal_operational` per design §7.3 (fixed value, not computed) |

## K. Evaluator purity

| # | Scenario | Expected |
|---|---|---|
| 13 | Call `evaluateAuthorizationDecision`/`evaluatePermission` (004B) directly, sensitive permission, allow and deny | Zero `outboxEntries` writes — 004B's own existing purity tests already prove this; 004C adds no import/call from 004B into 004C, verified by static review of 004B's diff (must remain empty) |

## L. 004D handoff

| # | Scenario | Expected |
|---|---|---|
| 14 | Core write function's signature accepts a `Transaction` as its first parameter | Verified by type signature + a test that supplies an existing transaction (opened by the test, standing in for a future 004D protected-command transaction) alongside another write, and asserts both commit atomically |

## M. Adversarial (Phase P)

| # | Scenario | Expected |
|---|---|---|
| 15 | Forged/malformed `AuthorizationDecision`-shaped object with impossible fields (e.g. `allowed: true` with `errorCategory` set) | Service does not crash; builds the record from whatever fields are present, does not infer/fabricate |
| 16 | Unknown permission (not in catalogue) | Non-sensitive path — no audit event, per F |
| 17 | No accountable identity (`request.userId` blank) | No audit event — there is no identity to attribute the record to per the Identity-Accountability Principle (§2.A.6); documented interpretation, not silently invented |
| 18 | Missing role/business/membership context on the decision (early denial, e.g. `MISSING_BUSINESS_CONTEXT`) | Still audited if a subject exists and the permission is sensitive; `effectiveRole`/`membershipId` simply absent |
| 19 | Event-id collision attempt (two different logical decisions engineered to share an idempotency-key input) | Documented as a caller-contract requirement (idempotency-key input must uniquely scope one logical decision), matching AUTH-08's own trust model — not a 004C defect to defend further |
| 20 | Duplicate retry (same as H) | No duplicate |
| 21 | Invalid payload field injection via a crafted `context` object (e.g. attempting to pass a `password` field through caller context) | The payload builder only reads the specific named fields it expects — no passthrough/spread of arbitrary caller-supplied objects into the persisted payload |
| 22 | Non-sensitive decision incorrectly submitted for audit (caller bug) | Service itself re-checks `isSensitivePermission(request.permission)` independently — never trusts a caller's "please audit this" flag |
| 23 | Malformed server-integrity metadata | Same as E — internal reasonCode only, no raw dump |
