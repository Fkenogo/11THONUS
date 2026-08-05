> **Title:** ENG-P2-001-10 — Identity Audit and Observability Foundation — Implementation Report
> **Date:** 2026-08-05
> **Status:** Implemented, TDD, pending Founder-authorized review/merge
> **Branch:** `feat/eng-p2-001-10-identity-audit-observability`

## 1. Executive Summary

Implemented the bounded Identity Audit and Observability Foundation on top of the already-governed outbox architecture (ENG-P1-002) and the already-complete Customer Identity event catalogue (`-01`, `-03`–`-09`). Every material identity event named in this task's brief already exists — this package adds zero new domain events. It adds: a canonical read-side audit-record projection over the existing `OutboxEntry`/`DomainEvent` shapes; a governed privacy classification (reusing TRD21 §21.6 verbatim); a closed, fail-closed audit-query authority context; four bounded, paginated, privacy-safe query functions over the existing `outboxEntries` collection; a small closed-vocabulary operational-signal helper reusing the existing structured logger; and one new outbox-integrity test confirming event content is never mutated by processing-state transitions. No second event system, no second outbox, no new UI, no public API, no Rules change (deny-by-default already covers the read surface), no deletion/retention job.

## 2. Starting Repository State

Primary checkout (`/Users/theo/11THONUS`) inspected read-only only: branch `chore/eng-p1-001-closure`, 33 pre-existing dirty entries, HEAD `ef1de346d6883242dc9137a5aced044cfd53f5f5`. Not modified.

## 3. Clean Worktree Confirmation

New worktree created from `origin/main` at the required merge commit, on branch `feat/eng-p2-001-10-identity-audit-observability`. `git status --short` empty at start; `git rev-list --left-right --count origin/main...HEAD` = `0 0`; no `MERGE_HEAD`/rebase state present.

## 4. Starting SHA

`924fb3beaf33df04baf3bf28d1e0e8319caf462e` (`feat(identity): ENG-P2-001-09 Identity Query and Lookup Interfaces (#64)`) — confirmed to match `origin/main` exactly at worktree creation time.

## 5. Pre-Edit Analysis

Delivered in full in chat before any file was created — 16 numbered points covering existing domain-event types, the outbox envelope/persistence model, existing audit-event patterns, correlation/command identifiers (including the disclosed gap: `causationId` exists on `DomainEvent` but is never populated anywhere, and `commandId` exists only at the `CommandEnvelope`/`OperationalLog` layer, never on `DomainEvent`/`OutboxEntry`), actor/authority/purpose/reason fields, redaction/privacy rules, replay/idempotency behaviour, the frontend-only scope of the existing observability adapter, payload inconsistencies, the material-vs-operational event split, the complete material-event catalogue (confirming every required event already exists, including "identity reactivated" as the same `customer_identity_activated` event distinguished by `previousStatus`), audit-query requirements, retention/archival boundaries (TRD21 §21.36–21.38, TRD10 §10.25 — no numeric period governed anywhere), and the full file-change plan. Also reviewed: `firestore.rules` (deny-by-default wildcard already covers `outboxEntries` and any new collection), `firestore.indexes.json` (empty — no prior indexes), TRD11 §11.37 (assigns "audit persistence standards" to a not-yet-built Trust Domain — this package defines no new persistence, only a read projection over the already-governed outbox, so it does not conflict), and DEC-IDENTITY-001 (Recovery Principle 7: "every recovery action must be auditable" — directly grounds `identity_recovered` as material audit evidence).

## 6. Canonical Audit-Envelope Design

`functions/src/domains/identityAudit/models/auditEnvelope.ts` — `IdentityAuditRecord` and `toIdentityAuditRecord(entry: OutboxEntry): IdentityAuditRecord`, a pure projection (zero Firebase dependency) over the existing `OutboxEntry<T>`/`DomainEvent<T>` types. Every field already exists on one of those two types except `customerIdentityId` (a friendlier alias for `event.aggregateId`) and `privacyClassification` (derived). Deliberately excludes the outbox's own internal processing-state fields (`retryCount`, `nextRetryAt`, `lastError`, `deadLetter`, `claimedAt`) — audit evidence is "what happened," not "how reliably it was delivered," which remains the outbox processor's own separately-tested concern.

```ts
export type IdentityAuditRecord = {
  eventId: string;
  eventType: string;
  eventVersion: number;
  sourceDomain: string;
  aggregateType: string;
  customerIdentityId: string;
  correlationId: string;
  causationId?: string;
  actor: EventActor;
  occurredAt: string;
  persistedAt: OutboxEntry["createdAt"];
  status: OutboxStatus;
  privacyClassification: AuditPrivacyClassification;
  payload: unknown;
};
```

## 7. Material-Event Catalogue

Every event named in the brief's own minimum list already exists in `-01`/`-03`–`-09`'s merged code — confirmed by direct inspection of `identityEvents.ts`, `loyaltyNumberEvents.ts`, `qrIdentityEvents.ts`. "Identity reactivated" requires no separate event: the existing `customer_identity_activated` event (with its `previousStatus` field) already covers any-status-to-active transitions, including reactivation from suspended/locked/dormant. **Zero new domain events were created.** Material (audit evidence): `customer_identity_registered/activated/suspended/locked/closed/archived`, `identity_became_dormant`, `identity_recovered`, `authentication_reference_linked/unlinked/conflict_detected`, `identity_lookup_attempted`, `loyalty_number_issued`, `qr_identity_issued/invalidated/regenerated`. Operational-only (not customer-identity state-change evidence, but still outbox-persisted and queryable): `loyalty_number_issuance_collision_detected`, `loyalty_number_issuance_failed`.

## 8. Payload Standardisation

No payload field was added, renamed, or removed on any existing event — normalization happens entirely at the read-side projection (§6), not by touching the write-side event builders. This avoids the "broad refactoring" this task explicitly forbids (every event builder in three domains would need to change to add a uniform field).

## 9. Identifier Redaction and Privacy Model

`functions/src/domains/identityAudit/models/auditPrivacyClassification.ts` reuses TRD21 §21.6's governed 5-class Personal Data Classification verbatim (no new taxonomy invented). Loyalty Number/QR reference issuance-family events classify as `class_3_personal_data` (TRD21 names "loyalty number" directly under Class 3, and these events carry the settled identifier by existing, disclosed design — `DEC-DATA-007`); every other identity event classifies as `class_2_internal_operational` (opaque references, categorical status/authority/reason only), which is also the function's conservative default for any unrecognised event type. Investigated whether `AuthenticationReference.referenceId` could carry a raw phone number for `phone_otp`-type references — confirmed via existing test fixtures (`"authuid_cust_15"`-style values, doc-ID pattern `"phone_otp:authuid_cust_15"`) that the design intent is an opaque provider UID for every reference type, not a raw identifier — no redaction gap found there. **Disclosed defect (not fixed, out of scope):** `shared/events/eventNaming.ts`'s `parseEventType`/`isValidEventType` regex only matches camelCase event names (its own test fixture: `"purchaseRecorded"`), but every real identity/loyaltyNumber/qrIdentity event name is snake_case, so that shared helper silently fails to parse any event type this domain actually emits. `classifyIdentityEventPrivacy` does not depend on it (uses a plain `.split(".")` instead) — fixing the shared helper would be a naming-convention change across every domain, forbidden by this task's "no broad refactoring" constraint.

## 10. Audit-Query Interfaces

`functions/src/domains/identityAudit/repositories/identityAuditQueryRepository.ts` — four bounded, paginated, read-only functions over the existing `outboxEntries` collection: `queryAuditRecordsByCustomerIdentityId`, `queryAuditRecordsByCorrelationId`, `queryAuditRecordsByEventType`, `queryAuditRecordsByEventId`. `queryAuditRecordsByEventId` is this package's practical stand-in for "command/idempotency ID" lookup (§5's disclosed gap: no true `commandId` exists on `DomainEvent` today; `eventId` is the closest existing correlating handle, since a multi-event command's sub-events already share one `eventId` value in their payload even though their outbox *document* IDs differ by a `-{index}` suffix — confirmed and tested). Each function validates its query value (non-empty) and the caller-declared `authority` (closed set, fail closed on unrecognised value), supports an optional inclusive `occurredFrom`/`occurredTo` time range (validated end ≥ start), defaults to a 25-record page bounded to a 100-record maximum, orders newest-first by the outbox's own `createdAt`, and reports `hasMore`. A malformed outbox document (missing `event`/`status`/`createdAt`) is skipped rather than failing the whole query. No public API, UI, or arbitrary full-text search exists.

## 11. Audit-Authority Model

`functions/src/domains/identityAudit/models/auditQueryAuthority.ts` — closed 5-value `AuditQueryAuthority` (`internal_service`, `support`, `administrator`, `security_review`, `compliance_review`), validated but never trusted as proof, mirroring the `-09` `IdentityLookupPurpose` pattern exactly. No role/permission system implemented. There is no per-authority allow-list restricting which query type an authority may run (unlike `-09`'s purpose-to-lookup-type allow-list) — the brief asks only that the category be defined and validated; real authorization is explicitly deferred to "a future trusted application boundary," which this package's own interface is shaped to support and fail closed against.

## 12. Retention and Archival Assessment

TRD21 §21.36–21.37 and TRD10 §10.25 define retention *classes* — identity audit events best map to Retention Class C ("Security and Access Records"; recovery/linking are closer to Class A "Trust Events") — but **no numeric retention period is governed anywhere** in the reviewed documentation; both TRD21 and TRD10 explicitly defer exact periods to a future "Privacy, Compliance and Operations standards" artefact that does not yet exist. Per the brief's own instruction, **no retention period was invented, no deletion logic was implemented, and no scheduled retention job was added** (TRD21 §21.38's retention-job architecture is explicitly out of this package's scope). This gap is disclosed here, not silently resolved.

## 13. Operational Observability Signals

`functions/src/domains/identityAudit/observability/identityOperationalSignals.ts` — `emitIdentityOperationalSignal`, a thin, closed-vocabulary (11 named signals matching the brief's own list) wrapper over the *existing* `shared/logging/logger.ts` + `OperationalLog` — not a new framework, not a metrics client, not a Sentry integration (that stack, `apps/web/src/observability/*`, is frontend-only and untouched). `result` is a small closed categorical value (`success`/`failure`/`exhausted`/`conflict`/`rejected`), not free text, so no caller can accidentally place a phone number, email, or token in it — no field exists for one. A log-based counter/metric over these structured entries is a downstream Cloud Logging concern, not reimplemented here.

## 14. Error and Diagnostic Mapping

`functions/src/domains/identityAudit/models/identityAuditErrors.ts` — new `IdentityAuditDomainError` class (mirrors `IdentityDomainError`/`LoyaltyNumberDomainError`/`QrIdentityDomainError`, reusing the same closed 14 `ErrorCategory` values, no new category introduced): `invalidAuditQueryAuthorityError`/`invalidAuditQueryParamsError` (`VALIDATION_FAILED`), `auditRepositoryUnavailableError` (`INTEGRATION_FAILED`). No raw Firestore error is ever surfaced by the query repository. No new general error framework was created.

## 15. Outbox-Integrity Implementation

Reused the existing outbox entirely — no second queue, no new collection. Verified (existing behaviour, no production code change needed): event IDs unique via doc-ID-as-`eventId` `.set()` semantics (`outboxWriter.ts`); idempotent command replay cannot reach `writeOutboxEntry` a second time (dedup happens upstream at `IdempotencyRecord`); multi-event commands already produce distinct outbox document IDs via the established `${eventId}-${index}` pattern (`loyaltyNumberRepository.ts`/`qrIdentityRepository.ts`), confirmed via a new emulator test exercising `queryAuditRecordsByEventId` against two such sub-events. Added one new test to the existing `outboxProcessor.emulator.test.ts` (not a new test file/framework) proving `event` content is byte-identical before and after success, retry, and dead-letter transitions — "processing status does not overwrite audit content" and "immutable audit content" are both already-true invariants of the existing `applyOwnedTransition` implementation, now directly asserted. Malformed-record handling is exercised at the audit-query layer (§10) rather than the outbox-processor layer, since that is where a malformed record is actually read back for audit purposes.

## 16. Firestore Rules and Index Assessment

**Rules: no change.** `firestore.rules`'s trailing `match /{document=**} { allow read, write: if false; }` already denies all direct client access to `outboxEntries` (and any future collection); every new query function uses the Admin SDK server-side, which is not subject to Rules at all. **Indexes: 4 new composite indexes added** to `firestore.indexes.json` (`event.aggregateId`+`createdAt`, `event.correlationId`+`createdAt`, `event.eventType`+`createdAt`, `event.eventId`+`createdAt`, all `createdAt DESCENDING`) — genuinely required: this package's four query functions are the first equality-filter-plus-range/orderBy Firestore queries in this codebase (every prior repository query is a plain doc-ID `.get()`), and production Firestore rejects such a combination without a matching composite index even though the local Emulator Suite does not enforce this (confirmed: all 12 emulator query tests passed without the indexes present, which is expected emulator behaviour, not evidence the indexes are unnecessary).

## 17. Files Inspected (unchanged)

All identity/loyaltyNumber/qrIdentity domain files (events, models, repositories); `shared/outbox/*`; `shared/events/*`; `shared/logging/*`; `shared/errors/*`; `shared/commands/*`; `shared/idempotency/*`; `shared/correlation/*`; `apps/web/src/observability/*` (frontend, confirmed out of scope); `firestore.rules`; TRD10, TRD11, TRD12, TRD21, PRD2, DEC-IDENTITY-001.

## 18. Files Created

`functions/src/domains/identityAudit/models/{auditEnvelope,auditPrivacyClassification,auditQueryAuthority,identityAuditErrors}.ts` (+ 4 matching `.test.ts`); `functions/src/domains/identityAudit/observability/identityOperationalSignals.ts` (+ `.test.ts`); `functions/src/domains/identityAudit/repositories/identityAuditQueryRepository.ts` (+ `.emulator.test.ts`); this report.

## 19. Files Modified

`firestore.indexes.json` (4 composite indexes added, from an empty baseline); `functions/src/shared/outbox/outboxProcessor.emulator.test.ts` (+1 audit-integrity test, no production code change); `docs/changes/IMPLEMENTATION_CHANGES.md`; `docs/00-governance/documentation-changes-log.md`; `docs/05-implementation/roadmap/ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md`; `docs/05-implementation/change-tracking/engineering-implementation-programme.md`. No identity/loyaltyNumber/qrIdentity domain source file was modified — this package is additive/read-only over that layer.

## 20. Diff Summary

12 new files (6 implementation + 6 test) in a new `functions/src/domains/identityAudit/` domain; 1 test added to an existing file; 1 config file populated from empty; 4 documentation files updated narrowly. No existing exported function's signature or behaviour changed.

## 21. Tests Added or Modified

**37 new unit tests:** `identityAuditErrors.test.ts` (4), `auditQueryAuthority.test.ts` (7), `auditPrivacyClassification.test.ts` (6), `auditEnvelope.test.ts` (4), `identityOperationalSignals.test.ts` (16). **13 new real Firebase Emulator Suite tests:** `identityAuditQueryRepository.emulator.test.ts` (12, new file), `outboxProcessor.emulator.test.ts` (+1, added to the existing file). All written test-first (RED confirmed for every new file/behaviour before implementation; the two emulator-suite additions confirmed RED via `firebase emulators:exec` before their implementations existed).

## 22. Validation Commands and Results

`npx tsc --noEmit` (functions): clean. `pnpm lint`: clean. `pnpm format:check`: clean (after one `prettier --write` pass on newly-created files). `pnpm --filter functions exec vitest run` (unit): 52 files / 384 tests passed (347 pre-existing + 37 new). `pnpm emulators:validate` (real Firebase Emulator Suite): 12 files / 159 tests passed (146 pre-existing + 13 new) — one transient failure on a first attempt, consistent with this repository's already-disclosed, pre-existing concurrency-test flakiness pattern under elevated host load; a clean immediate retry passed 159/159 with zero code changes between runs. `pnpm --filter web test`: 30 files / 259 tests passed, unchanged (`apps/web` untouched). `pnpm build`: clean for both workspaces.

## 23. Dependencies Added

None.

## 24. Configuration Changes

`firestore.indexes.json` populated with 4 composite indexes (not yet deployed — no `firebase deploy` was run, per this task's explicit "no production deployment" constraint).

## 25. Security and Privacy Assessment

No customer PII (phone, email, OTP, token, provider credential, purchase/reward detail) is exposed by any new type, query result, or log signal — confirmed by dedicated negative tests at the envelope-projection, query-repository, and operational-signal layers. Audit-query results never include outbox-internal processing-state fields. Caller-declared authority is validated for shape only, never trusted as proof of entitlement (explicit, tested, and documented as a deferred future-boundary responsibility). Deny-by-default Firestore Rules protect the read surface unchanged; no direct client path to `outboxEntries` was created.

## 26. Risks

None new. The `causationId`-never-populated and `eventNaming.ts` snake_case/camelCase mismatch are both pre-existing gaps this package discovered but correctly did not attempt to fix (each would require a cross-domain refactor forbidden by this task's own scope). The absence of a governed retention period means audit history currently grows unboundedly — flagged in §12, not addressed here, consistent with explicit instruction not to invent a period.

## 27. Deferred Items

Support dashboard; administrative audit UI; customer audit export; compliance reporting; production retention/deletion jobs; SIEM integration; analytics; alerting rules; provider-specific Authentication telemetry; ITM risk analytics; production migration; retrofitting `causationId`/a true `commandId` onto `DomainEvent`; fixing `eventNaming.ts`'s regex.

## 28. Markdown Implementation Report

This document — also serves as the persistent task-level Markdown record (point 31).

## 29–31. Documentation Deliverables

`docs/changes/IMPLEMENTATION_CHANGES.md` entry (29); `docs/00-governance/documentation-changes-log.md` Entry 068 (30); this report also serves as the persistent task-level Markdown record (31), per this domain's established convention.

## 32–37. PR and CI Evidence

Recorded in the final chat completion report after commit/push/PR creation (this report is written before that step, per the sequencing every prior task in this stream has used).
