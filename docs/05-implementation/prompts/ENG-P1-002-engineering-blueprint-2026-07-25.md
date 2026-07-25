> **Title:** ENG-P1-002 — Engineering Implementation Blueprint
> **Version:** 1.0 · **Status:** Planning artefact — precedes, and informs, the formal Implementation Prompt · **Classification:** Working (governance record)
> **Governing task:** "TASK — ENG-P1-002-PREP: Engineering Preparation & Implementation Blueprint"
> **Source-of-truth path:** `docs/05-implementation/prompts/ENG-P1-002-engineering-blueprint-2026-07-25.md`
> **Last controlled update:** 2026-07-25 (created)

# ENG-P1-002 — Engineering Implementation Blueprint

> **No application code is written by this document.** It realizes — does not redesign — the engineering contracts already approved in TRD11 (§11.6–§11.9, §11.14, §11.17, §11.29–§11.30, §11.34–§11.36), TRD10 (§10.30), TRD20 (§20.23, §20.26), TRD22 (§22.11), and Decision Register `DEC-TECH-006`/`DEC-TECH-007`. No conflict was found between any of these sources during this analysis; none is reported.

---

## Before Doing Anything — Analysis

**What `ENG-P1-002` is expected to accomplish.** Per the Engineering Implementation Programme, its title is "Shared command contract (error, correlation-ID, logging, idempotency, event outbox)" and its objective is: *"Every domain service can reuse one authenticate→validate→log→respond command shape."* Per TRD22 §22.11 (Phase 1 — Firebase and Shared Platform Foundation), its slice of the phase's deliverable list is: shared error contract, correlation-ID service, structured logging, idempotency service, event envelope, event outbox, shared validation, server timestamp standards, and base Firestore metadata. Phase 1's own exit criteria state plainly what "done" looks like: *"shared server command can authenticate, validate, log and return a standard response; outbox event can be written and processed idempotently."*

**How it fits into the approved architecture.** TRD8 §8.4 and the Repository and Folder Standards §3 already reserve `src/shared/` for exactly this kind of cross-domain contract — code that every future domain (Identity, Commerce Knowledge, Reward Programs, Purchase, ...) imports rather than reimplements. `ENG-P1-002` is the first work package to populate that folder. No domain folder exists yet (Phase 2 onward), and none is created by this work package — it builds the shape every domain will later plug into, not a domain itself.

**Which approved decisions govern the work.** `DEC-TECH-006` (event outbox pattern, `CONFIRMED` at the pattern level, 2026-07-17) and `DEC-TECH-007` (idempotency storage approach, `CONFIRMED` at the policy level, 2026-07-17). Both decisions' own Final Decision text explicitly assigns the remaining schema-level detail to be authored *as part of* `ENG-P1-002` — this is not a precondition this work package is waiting on; it is this work package's own scope.

**Why the proposed implementation approach aligns with those decisions.** Every type shape proposed in §4 below (Contract Realization) is copied, field-for-field, from an already-approved TRD source — `CommandEnvelope<T>` from TRD11 §11.7, `DomainEvent<T>` from TRD11 §11.8, `IdempotencyRecord` from TRD11 §11.14, `OperationalLog` from TRD20 §20.23 (operationalized in `logging-conventions.md` §2), `PlatformErrorResponse` from TRD11 §11.34, and the outbox entry's required field list from TRD11 §11.17/§11.29/§11.30. Nothing below introduces a field, a collection, or a behavior TRD11/TRD10/TRD20 does not already specify. Where a source leaves a genuine open choice (e.g. TRD10 §10.30: "Idempotency records may be stored in a dedicated collection or incorporated into authoritative documents, depending on the operation"), this blueprint states the concrete choice made for the *shared* idempotency service specifically (a dedicated collection — the only option that makes sense for a domain-agnostic shared service, since it has no "authoritative document" of its own to piggyback on) and defers the *per-operation* choice to each future domain's own work package, exactly as `DEC-TECH-007` anticipates.

**No conflict was found.** All cross-referenced sources (TRD10, TRD11, TRD20, TRD22, the Decision Register, the Repository and Folder Standards, and the Logging Conventions standard) agree with each other on every field checked. Nothing in this blueprint required stopping to report a conflict.

---

## 1. Scope

### Objectives

1. Every domain service can construct, validate, and dispatch a command through one shared `authenticate → validate → log → respond` shape, without re-implementing any of those four steps.
2. A domain event, once created, is reliably published via the outbox pattern even if the triggering transaction's own process crashes immediately after commit.
3. A sensitive operation, retried with the same idempotency key, never executes twice.
4. Every server operation produces one structured, correlation-ID-carrying log entry, in the exact shape TRD20 §20.23 already defines.
5. Every callable/HTTP API failure returns the exact `PlatformErrorResponse` shape TRD11 §11.34 already defines.

### Deliverables

Per TRD22 §22.11's Phase 1 deliverable list, this work package's slice is:

- Shared error contract (`PlatformErrorResponse`, standard error categories).
- Correlation-ID service.
- Structured logging (shared logger implementing `OperationalLog`).
- Idempotency service (`IdempotencyRecord` + check/reserve/complete behavior).
- Event envelope (`DomainEvent<T>` + naming standard).
- Event outbox (schema + background processor).
- Shared validation (the "validate" step of the command shape — request-shape and actor-trust validation, not domain business-rule validation).
- Server timestamp standard (a single `serverTimestamp()`-based helper, per TRD10's base-metadata shape).
- Base Firestore metadata shape (`id`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `status`, `version`, per the Version 1 Engineering Blueprint §3.3).
- The Command Contract itself (`CommandEnvelope<T>`) and the shared dispatcher that ties the above together into the one reusable "authenticate→validate→log→respond" shape.

### Explicit Exclusions

- **Firebase project/client/Admin SDK/App Check initialization** — already delivered by `ENG-P1-001` (`Complete`).
- **Security/Storage Rules deny-by-default foundation and monitoring initialization** — `ENG-P1-003`'s scope (Requirement IDs `FR-SEC-006`, `FR-OPS-009`, `FR-OPS-010`), currently `Blocked` on `DEC-PROV-005`; not touched by this work package.
- **Any specific domain command, event, or business rule** (e.g. Record Purchase, Verify Purchase, Redeem Reward) — those are Phase 2+ domain work packages; this work package builds the shape they will later use, not any instance of it.
- **Feature-flag abstraction, Rules Service interface, Knowledge Service interface** — all three appear in TRD22 §22.11's Phase 1 deliverable list, but none appears in `ENG-P1-002`'s own Requirement IDs (`DA-005, DA-006, DA-014, FR-SEC-012`) or `ENG-P1-003`'s (`FR-SEC-006, FR-OPS-009, FR-OPS-010`) per the Engineering Implementation Programme. **This is disclosed as an open scope-mapping question, not resolved here** — see Risks §10.
- **Event consumers for any specific domain workflow** (e.g. a notification-sending outbox consumer) — the outbox *processor* (the generic reader/retry/dead-letter machinery) is in scope; any domain-specific *handler* it eventually invokes is not.
- **Firestore Security Rules for the new shared collections** — Rules authorship is `ENG-P1-003`'s scope; this work package's emulator tests run against permissive/admin-context rules only, consistent with `ENG-P1-001`'s own precedent.

---

## 2. Repository Impact

| Location | Change type | Reason |
|---|---|---|
| `functions/src/shared/` (new folder) | New | Repository and Folder Standards §3 designates `src/shared/` for exactly this kind of cross-domain contract; does not exist yet |
| `functions/src/shared/commands/` | New | Command contract + dispatcher |
| `functions/src/shared/events/` | New | Event contract + naming |
| `functions/src/shared/outbox/` | New | Outbox schema, writer, processor |
| `functions/src/shared/idempotency/` | New | Idempotency record + service |
| `functions/src/shared/correlation/` | New | Correlation-ID service |
| `functions/src/shared/logging/` | New | Shared logger |
| `functions/src/shared/errors/` | New | Error contract + categories |
| `functions/src/shared/validation/` | New | Shared request/actor validation |
| `functions/src/shared/metadata/` | New | Base Firestore metadata + server-timestamp helper |
| `functions/src/index.ts` | Modified | Export the new shared module surface (no new deployed function is required by this work package — see §6) |
| `docs/03-standards/engineering-standards/README.md` | Modified (future, at execution time) | Pass 2 index updated once the deferred schema items are actually authored |
| `docs/03-standards/engineering-standards/naming-conventions.md` | Modified (future, at execution time) | Currently reserves collection naming for Pass 2; the new collection names become concrete here |
| `docs/05-implementation/change-tracking/engineering-implementation-programme.md`, `coding-agent-prompt-register.md` | Modified (future, at execution time) | Status update on completion, per every prior work package's own precedent |
| `docs/changes/IMPLEMENTATION_CHANGES.md`, `docs/00-governance/documentation-changes-log.md` | Modified (future, at execution time) | Standing Change-Control logging |
| No `apps/web/` change | — | This work package is server-only; nothing in its scope touches the frontend |
| No `records/` (EIR) change | — | Out of this work package's own scope; a future `EIR-04`/backfill task, not this one |

No modification was made to any of the above by this blueprint — this table describes expected future impact only.

---

## 3. Planned File Inventory

| File | Purpose | Dependencies | Responsibility |
|---|---|---|---|
| `functions/src/shared/metadata/baseMetadata.ts` | Defines the shared Firestore metadata shape (`id, createdAt, createdBy, updatedAt, updatedBy, status, version`, plus optional `businessId/customerId/countryCode/languageCode/deletedAt/deletedBy`) per Version 1 Engineering Blueprint §3.3 | None | Type + a `stampCreate()`/`stampUpdate()` helper pair |
| `functions/src/shared/metadata/serverTimestamp.ts` | Single `serverTimestamp()`-based helper every write uses | Firebase Admin SDK (`admin.firestore.FieldValue.serverTimestamp`) | Prevents each domain from calling the raw SDK function inconsistently |
| `functions/src/shared/errors/platformError.ts` | `PlatformErrorResponse` type, per TRD11 §11.34 | `correlation/correlationId.ts` (type only) | The one shape every callable/HTTP error returns |
| `functions/src/shared/errors/errorCategories.ts` | The 14 standard error categories from TRD11 §11.35 (`AUTH_REQUIRED`, `AUTH_FORBIDDEN`, `ACCOUNT_SUSPENDED`, `BUSINESS_INACTIVE`, `SUBSCRIPTION_LIMIT_REACHED`, `INVALID_STATE_TRANSITION`, `PURCHASE_ALREADY_RESPONDED`, `REWARD_NOT_AVAILABLE`, `REWARD_ALREADY_REDEEMED`, `IDEMPOTENCY_CONFLICT`, `VALIDATION_FAILED`, `RESOURCE_NOT_FOUND`, `TEMPORARY_UNAVAILABLE`, `INTEGRATION_FAILED`) as a closed union type | None | No domain invents a 15th category without a TRD change |
| `functions/src/shared/correlation/correlationId.ts` | Generates a correlation ID at a workflow's entry point; a pass-through helper for propagating an existing one | None | Per TRD20 §20.26: generated once, passed explicitly, never regenerated mid-workflow |
| `functions/src/shared/logging/operationalLog.ts` | `OperationalLog` type, exactly as TRD20 §20.23 / Logging Conventions §2 define it | `correlation/correlationId.ts` (type only) | The one log-entry shape |
| `functions/src/shared/logging/logger.ts` | The single shared logging function every server operation calls; no domain uses `console.log`/`console.error` directly | `operationalLog.ts` | Guarantees the approved shape is actually produced, per Logging Conventions §3 |
| `functions/src/shared/commands/commandEnvelope.ts` | `CommandEnvelope<T>` type, exactly as TRD11 §11.7 defines it | `correlation/correlationId.ts` (type only) | The one command-request shape |
| `functions/src/shared/commands/commandDispatcher.ts` | The shared `authenticate → validate → log → respond` orchestrator every domain command handler wraps itself in | `commandEnvelope.ts`, `validation/actorValidation.ts`, `logging/logger.ts`, `errors/platformError.ts`, `idempotency/idempotencyService.ts` | This *is* the work package's central deliverable — the reusable command shape |
| `functions/src/shared/events/domainEvent.ts` | `DomainEvent<T>` type, exactly as TRD11 §11.8 defines it | `correlation/correlationId.ts` (type only) | The one domain-event shape |
| `functions/src/shared/events/eventNaming.ts` | Builds/validates event names as `<domain>.<event_name>.v<version>`, per TRD11 §11.9 | `domainEvent.ts` (type only) | Prevents ad-hoc event-name strings |
| `functions/src/shared/idempotency/idempotencyRecord.ts` | `IdempotencyRecord` type, exactly as TRD11 §11.14 defines it | None | The one idempotency-record shape |
| `functions/src/shared/idempotency/idempotencyService.ts` | Implements the Idempotency Behaviour rule (TRD11 §11.14/§11.15, TRD10 §10.30): same key + same request → return prior result; same key + different request → reject as conflict (`IDEMPOTENCY_CONFLICT`) | `idempotencyRecord.ts`, `errors/errorCategories.ts` | The shared idempotency check every sensitive command calls before executing |
| `functions/src/shared/outbox/outboxEntry.ts` | Outbox entry type — event payload plus the required processing metadata TRD11 §11.17/§11.29/§11.30 specify: status, retry count, next-retry time, error details, dead-letter transition, failure classification | `events/domainEvent.ts` | The one outbox-collection document shape |
| `functions/src/shared/outbox/outboxWriter.ts` | Writes an outbox entry inside the same Firestore transaction as the domain write it accompanies, per TRD11 §11.15 | `outboxEntry.ts` | Guarantees "domain write and outbox write succeed or fail together" |
| `functions/src/shared/outbox/outboxProcessor.ts` | Background processor: reads unpublished entries, attempts processing, marks completed or increments retry with bounded exponential backoff (TRD11 §11.29), transitions to dead-letter per TRD11 §11.30's four conditions | `outboxEntry.ts`, `logging/logger.ts` | The reliability guarantee behind the outbox pattern |
| `functions/src/shared/validation/actorValidation.ts` | Verifies/populates `CommandEnvelope.actor` from trusted Firebase Auth context; rejects client-supplied actor claims, per TRD11 §11.7's own text ("Client-supplied actor authority shall never be trusted on its own") | `commands/commandEnvelope.ts` (type only) | The "authenticate" step of the shared command shape |
| `functions/src/shared/validation/requestValidation.ts` | Generic request-shape validation (Layer 1 "Transport Validation" per TRD11 §11.13) — domain-specific Layers 2–5 remain each domain's own responsibility | None | The generic slice of the "validate" step; not a replacement for domain business-rule validation |
| One `*.test.ts` per file above, colocated | Unit tests, per the existing repository convention (every current `functions/src` file has a colocated test) | Matching source file | See §7 Testing Blueprint |

No file above was created by this blueprint. This is a plan, not a change.

---

## 4. Contract Realization

Every shape below is copied field-for-field from its cited source. None is a new invention.

### Command Contract (TRD11 §11.7 — realized, not redesigned)

```ts
type CommandEnvelope<T> = {
  commandId: string;
  commandType: string;
  commandVersion: number;
  idempotencyKey: string;
  actor: {
    userId: string;
    authUid: string;
    roleContext?: string;
    businessId?: string;
    membershipId?: string;
  };
  issuedAtClient?: string;
  correlationId: string;
  payload: T;
};
```
Server populates/verifies `actor` from trusted auth context; client-supplied actor authority is never trusted alone (TRD11 §11.7).

### Event Contract (TRD11 §11.8–§11.9 — realized, not redesigned)

```ts
type DomainEvent<T> = {
  eventId: string;
  eventType: string;      // "<domain>.<event_name>.v<version>", per §11.9
  eventVersion: number;
  sourceDomain: string;
  aggregateType: string;
  aggregateId: string;
  correlationId: string;
  causationId?: string;
  actor: {
    actorType: "user" | "service" | "system";
    actorId: string;
    role?: string;
  };
  occurredAt: string;
  payload: T;
};
```

### Correlation Model (TRD20 §20.26, Logging Conventions §5 — realized, not redesigned)

One `correlationId` generated at a workflow's entry point (the point a `CommandEnvelope` is first constructed), passed explicitly through every function call and into every event/log/error/idempotency-record it produces. Never regenerated mid-workflow. The correlation-ID service is this work package's own deliverable (TRD22 §22.11); every future domain consumes it, none reimplements it.

### Logging Contract (TRD20 §20.23, Logging Conventions §2 — realized, not redesigned)

```ts
type OperationalLog = {
  timestamp: string;
  environment: string;
  severity: "debug" | "info" | "warning" | "error" | "critical";
  domain: string;
  service: string;
  operation: string;
  correlationId: string;
  commandId?: string;
  eventId?: string;
  actorId?: string;
  businessId?: string;
  customerId?: string;
  aggregateType?: string;
  aggregateId?: string;
  result?: string;
  durationMs?: number;
  errorCode?: string;
};
```
One shared logger in `src/shared/` is the only supported way to write this shape (Logging Conventions §3) — no domain hand-builds this object or calls `console.*` directly. Never logs passwords, OTP values, access tokens, full payment credentials, or unnecessary private profile data (Logging Conventions §6).

### Event Outbox Schema (TRD11 §11.17, §11.29, §11.30 — realized, not redesigned)

TRD11 §11.17 requires the outbox to support: idempotent processing, retry count, next retry time, status, error details, dead-letter transition. Combined with §11.29 (bounded exponential backoff; retryable vs. non-retryable failure classification) and §11.30 (dead-letter record fields: event, failure classification, processing attempts, last error, affected aggregate, recommended action), the concrete shape is:

```ts
type OutboxEntry<T = unknown> = {
  id: string;
  event: DomainEvent<T>;
  status: "pending" | "processing" | "completed" | "dead_letter";
  retryCount: number;
  nextRetryAt?: Timestamp;
  lastError?: {
    message: string;
    classification: "retryable" | "non_retryable";
    occurredAt: Timestamp;
  };
  deadLetter?: {
    reason: "max_retries_exceeded" | "invalid_payload_for_version" | "missing_source_record" | "repeated_corruption";
    processingAttempts: number;
    recommendedAction: string;
  };
  createdAt: Timestamp;
  completedAt?: Timestamp;
};
```
Written inside the same Firestore transaction as the domain write it accompanies (TRD11 §11.15). This exact field-for-field derivation is the "Pass 2" detail `DEC-TECH-006` deferred to this work package — no field here was invented outside that citation chain.

### Idempotency Schema (TRD11 §11.14, TRD10 §10.30 — realized, not redesigned)

```ts
type IdempotencyRecord = {
  id: string;
  idempotencyKey: string;
  operationType: string;
  actorId: string;
  businessId?: string;
  requestHash: string;
  status: "processing" | "completed" | "failed";
  resultReference?: string;
  responseSnapshot?: unknown;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  expiresAt?: Timestamp;
};
```
Behavior (TRD11 §11.14's own "Idempotency Behaviour" subsection): same key + same request → return the original successful response or the existing processing state; same key + different request content → reject as a conflict (`IDEMPOTENCY_CONFLICT`, TRD11 §11.35).

**Storage choice for this shared service specifically:** TRD10 §10.30 permits either a dedicated collection or incorporation into authoritative documents, "depending on the operation." For the *shared* idempotency service (used before any domain-specific authoritative document necessarily exists), a dedicated `idempotencyRecords` collection is the only choice that makes sense — there is no authoritative document to incorporate into at this generic layer. Each future domain work package remains free to choose the combined approach for its *own* specific operations, per `DEC-TECH-007`'s own text; this blueprint does not foreclose that.

---

## 5. Repository Structure

No folders are created by this blueprint. The intended structure, once `ENG-P1-002` executes:

```
functions/
└── src/
    ├── config/                      (exists — region.ts)
    ├── infrastructure/
    │   └── firebase/                (exists — admin.ts)
    ├── shared/                      (new — this work package)
    │   ├── metadata/
    │   │   ├── baseMetadata.ts
    │   │   └── serverTimestamp.ts
    │   ├── errors/
    │   │   ├── platformError.ts
    │   │   └── errorCategories.ts
    │   ├── correlation/
    │   │   └── correlationId.ts
    │   ├── logging/
    │   │   ├── operationalLog.ts
    │   │   └── logger.ts
    │   ├── commands/
    │   │   ├── commandEnvelope.ts
    │   │   └── commandDispatcher.ts
    │   ├── events/
    │   │   ├── domainEvent.ts
    │   │   └── eventNaming.ts
    │   ├── idempotency/
    │   │   ├── idempotencyRecord.ts
    │   │   └── idempotencyService.ts
    │   ├── outbox/
    │   │   ├── outboxEntry.ts
    │   │   ├── outboxWriter.ts
    │   │   └── outboxProcessor.ts
    │   └── validation/
    │       ├── actorValidation.ts
    │       └── requestValidation.ts
    └── index.ts                     (exists — modified to export the shared surface)
```
`domains/` is not created — no domain work package has begun (Repository and Folder Standards §5: no speculative/placeholder folders).

---

## 6. Engineering Sequence

Each step's own emulator/unit validation must pass before the next step begins — no step is deferred to "test at the end."

1. **Metadata + server-timestamp helper.** No dependencies. Validation: unit tests only (pure functions).
2. **Error contract + categories.** Depends on (1) only for the metadata `Timestamp` type if reused. Validation: unit tests (type-level; a category outside the closed union fails to compile).
3. **Correlation-ID service.** No dependencies. Validation: unit test confirms a generated ID is propagated unchanged, never regenerated, across a simulated call chain.
4. **Logging contract + shared logger.** Depends on (3). Validation: unit test confirms every required field is present and that a "never log" field (e.g. a password string) passed into an arbitrary payload is rejected/stripped, not silently logged.
5. **Command + Event contracts (types only).** Depends on (3). Validation: type-level tests only — no behavior yet.
6. **Idempotency schema + service.** Depends on (2), (4). Validation: emulator integration test — same key/same request returns prior result; same key/different request returns `IDEMPOTENCY_CONFLICT`.
7. **Outbox schema + writer.** Depends on (5). Validation: emulator test — a Firestore transaction that writes a domain document and an outbox entry either both commit or both roll back (no partial write).
8. **Outbox processor (retry + dead-letter).** Depends on (7). Validation: emulator test — a simulated transient failure retries with backoff; a simulated permanent failure (e.g. unsupported event version) transitions to `dead_letter` with a populated `deadLetter` object; no event silently disappears in either case.
9. **Shared validation (actor + request-shape).** Depends on (5). Validation: unit test — a request with client-supplied `actor.userId` mismatched against the authenticated token is rejected, per TRD11 §11.7.
10. **Command dispatcher (ties 1–9 together).** Depends on all of the above. Validation: the Programme's own required "emulator integration test (command round-trip)" — a synthetic example command flows authenticate → validate → log → idempotency-check → (optional outbox write) → respond, end to end, against the Firebase Emulator Suite.
11. **Full local validation suite** (`pnpm install --frozen-lockfile`, `typecheck`, `lint`, `format:check`, `build`, `test`, `pnpm emulators:validate`) before any commit, per every prior work package's own precedent.

---

## 7. Testing Blueprint

- **Unit tests** (colocated `*.test.ts`, per repository convention): every pure function/type guard in §3's file inventory — metadata stamping, error-category union exhaustiveness, correlation-ID propagation, log-shape assembly, event-name parsing/building, outbox retry/backoff calculation, actor-trust rejection logic.
- **Emulator tests** (`pnpm emulators:validate` extended with new scenarios, per Firebase Emulator Suite already configured by `ENG-P0-002`): idempotency round-trip (steps 6, above); transactional outbox write (step 7); command-dispatcher round-trip with a synthetic example command (step 10).
- **Integration tests**: the outbox processor against the emulator's Firestore, simulating multiple pending entries, confirming processing order and that `nextRetryAt` is honored (an entry not yet due is not reprocessed early).
- **Idempotency tests**, explicitly required by the Programme's own "Required Validation" cell:
  - same key + identical payload → original response returned, no duplicate side effect;
  - same key + different payload → `IDEMPOTENCY_CONFLICT`, no side effect at all;
  - expired record (`expiresAt` passed) → treated as a fresh request, not a conflict (TRD11 does not specify this explicitly; flagged for confirmation during execution rather than assumed — see Risks §10).
- **Event replay tests**, explicitly required by the Programme's own "Required Validation" cell:
  - a completed outbox entry is never reprocessed;
  - a `dead_letter` entry is never silently retried without an explicit, separate recovery action;
  - reprocessing an entry already marked `completed` (simulating a crash between mark-completed and the next read cycle) does not double-publish the event to a downstream consumer — this requires the *consumer* side to also be idempotent in principle, but no consumer exists yet in this work package's scope; the test therefore verifies only that the *outbox processor itself* does not re-select a `completed` entry, not full end-to-end consumer idempotency.
- **Edge cases**: outbox entry stuck in `processing` status (crash mid-processing, no completion or failure recorded) — TRD11 does not explicitly define a timeout/reclaim rule for this state; flagged as an open question for execution-time resolution, not invented here (see Risks §10).

---

## 8. Validation Gates

Per the existing [Definition of Done](../../06-engineering-governance/definition-of-done.md) (§2, 12 criteria) — not restated or redefined here. All 12 criteria apply unchanged: implementation complete against this blueprint's scope; required tests (§7 above) written and passing; `pnpm typecheck`/`lint`/`format:check`/`build` clean; Technical Review Approved; committed and pushed per the [Git Workflow](../../06-engineering-governance/git-workflow.md); Founder pull and Preview Review, where the Definition of Done requires them for a server-only, no-deployment-target work package (consistent with `ENG-P0-001`/`ENG-P0-002`'s own precedent of `N/A` for deployment-requiring criteria not applicable to this stage). This work package's own Programme row states `Deployment Required: No` and `Manual QA Required: No` — those two criteria are `N/A` for the same documented reason as every prior Phase 0/1 non-deployed work package.

---

## 9. Rollback Strategy

All work is additive — a new `functions/src/shared/` folder with no existing file modified except `index.ts`'s export surface. Standard rollback: revert the work package's commit(s) on its own feature branch (or, once merged, `git revert` the merge commit on `main`). No Firestore collection exists in any live environment yet (no domain writes to `idempotencyRecords` or an outbox collection occur until a domain work package uses this shared layer), so no data-migration rollback is needed — reverting the code removes the collections' only writers, and any emulator-only test data disappears with the emulator session. If a defect is found *after* a downstream domain work package has begun consuming this shared layer, rollback becomes materially harder (a breaking change to `CommandEnvelope<T>` or `DomainEvent<T>` would ripple) — this is why §4's shapes are copied exactly from already-approved, reviewed TRD sources rather than improvised, minimizing the chance of a post-adoption breaking change.

---

## 10. Risks

| Risk | Category | Severity | Mitigation |
|---|---|---|---|
| Outbox processor's retry/backoff exact parameters (initial delay, multiplier, max attempts) are not numerically specified anywhere in TRD11 §11.29 ("bounded exponential backoff" only) | Technical | Medium | Choose conservative, documented defaults during execution (e.g. 1s initial, ×2 multiplier, capped at 5 attempts before dead-letter) and record the choice explicitly in the eventual Pass 2 Engineering Standards entry — not silently invented, disclosed as this work package's own implementation decision within the approved pattern |
| Idempotency record `expiresAt` behavior at expiry is not explicitly defined by TRD11 §11.14 | Technical | Low | Treat as a fresh request past expiry (the only interpretation consistent with `expiresAt` existing as a field at all); confirm during execution rather than assume silently |
| Outbox entry stuck in `processing` (crash mid-processing, no timeout/reclaim rule defined) | Technical | Medium | Add a processor-side reclaim rule (e.g. `processing` entries older than N minutes become eligible for retry) as an implementation detail within the approved pattern, disclosed at execution time, not treated as inventing new architecture |
| "Feature-flag abstraction," "Rules Service interface," "Knowledge Service interface" (TRD22 §22.11 Phase 1 deliverables) map to no current Programme work package's Requirement IDs | Governance/Implementation | Low | Does not block `ENG-P1-002`; flagged here for the Founder/Technical Lead to assign a work package before Phase 1 is declared fully exited, not resolved by this blueprint |
| First real transactional Firestore write pattern in the whole programme (outbox + domain write in one transaction) | Architectural | Medium | Already the Programme's own flagged risk ("highest architectural-discovery risk in the whole programme"); mitigated by deriving every shape from approved TRD text rather than improvising, and by the step-by-step validation gates in §6 |
| No domain yet exists to prove the command dispatcher against real business logic — only a synthetic example command | Implementation | Low | Accepted and expected — TRD22 §22.11's own exit criteria only require "shared server command can authenticate, validate, log and return a standard response," not a real domain command; the first real domain command (Phase 2+) is the true end-to-end proof |

---

## 11. FEF Harmonization Review

| Artefact | Specific to 11thONUS | Future FEF harmonization candidate |
|---|---|---|
| `CommandEnvelope<T>`, `DomainEvent<T>`, `PlatformErrorResponse`, `IdempotencyRecord`, `OperationalLog` type shapes | No — these are generic command/event/error/idempotency/logging patterns, not loyalty-domain content | **Yes** — strong candidate; the pattern itself is reusable across any Firebase/Firestore project |
| Event naming standard (`<domain>.<event_name>.v<version>`) | No — generic versioned-event-naming convention | **Yes** | 
| Outbox entry schema and processor retry/dead-letter logic | No — a generic reliability pattern for any transactional-write-plus-event system | **Yes** |
| Correlation-ID propagation rule | No — generic distributed-tracing convention | **Yes** |
| Base Firestore metadata shape (`id, createdAt, ..., businessId, customerId, countryCode, languageCode`) | Mixed — the cross-cutting audit fields are generic; `businessId`/`customerId` are 11thONUS's own domain vocabulary | Partial — the generic subset is a candidate, the domain-specific fields are not |
| The 14 standard error categories (`REWARD_NOT_AVAILABLE`, `PURCHASE_ALREADY_RESPONDED`, etc.) | **Yes** — named directly after 11thONUS's own commerce/loyalty domain | No — product-specific, would not belong in a generic framework |
| The actual `functions/src/shared/` file layout and naming chosen in this blueprint | No — an implementation detail of how the pattern is realized in this codebase | Partial — the *pattern* of a `shared/` cross-domain folder is generic (already a Repository and Folder Standards convention); the specific file names here are not load-bearing beyond this repo |

No migration is performed. This table is descriptive only, per the task's own constraint.
