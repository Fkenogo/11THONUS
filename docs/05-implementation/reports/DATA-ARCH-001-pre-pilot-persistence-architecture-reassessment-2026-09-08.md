# DATA-ARCH-001 — Pre-Pilot Persistence Architecture Reassessment

> **Status:** **FOUNDER-DISPOSED / APPROVED ARCHITECTURE DIRECTION — NOT IMPLEMENTED** (`FD-DATA-ARCH-001` / `DEC-DATA-008`; see §18)
> **Date:** 2026-09-08
> **Authoritative entry baseline:** `origin/main` `ee899032b4734260697c47635aaaa136aadf7cda`
> **Scope:** durable operational persistence. This report does not select an identity provider, alter `DEC-AUTH-002`, approve a schema, provision an instance, or authorize a migration.

## 1. Executive decision

**Answer to the correction question: yes.** PostgreSQL remains the recommended authoritative durable datastore when every provisional FD-COM-001 ledger, grace, top-up and related commercial input is excluded. The strongest pre-pilot fit is **Cloud SQL for PostgreSQL as the authoritative durable datastore, accessed only through 11thONUS server/API and repository ports**. This is not a conclusion from Firebase provider dependency alone. It follows from governed relationship ownership, lifecycle/state models, immutable historical records, idempotent command processing, cross-entity atomicity, authorization/audit obligations, and approved reporting/reconciliation requirements—reinforced by the implemented Firestore transaction and uniqueness protocols.

Firestore remains a competent document store and the implemented server-mediated posture is healthy in important respects. It would, however, require 11thONUS to keep encoding a growing set of relational constraints, uniqueness reservations, concurrency protocols, denormalized read models, and reconciliation processes in application code. PostgreSQL makes the structural part of those obligations native while retaining the domain service as the authority for business policy. Pre-pilot timing means the migration is predominantly code and test migration rather than customer-data migration.

Recommended conceptual boundary:

```text
External managed IdP
  -> external-JWT verification / controlled authentication adapter
  -> Functions or HTTP API command/query boundary
  -> 11thONUS domain services and repository ports
  -> Cloud SQL for PostgreSQL (authoritative durable state)
```

Firebase Hosting, Functions/runtime, Storage, App Check (subject to the separate authentication assessment), and observability are not persistence decisions and may remain separately justified. No direct client database access is recommended.

## 2. Entry gate and evidence method

1. Fetched `origin/main` and recorded `ee899032b4734260697c47635aaaa136aadf7cda` before assessment.
2. Inspected the Constitution hierarchy via the Canonical Reference; PRDs; TRD 8, 10, 11, 12, 15, 17, 19, 20, 21, 22 and 23; Decision Register; traceability; current Functions and web implementation; Rules; indexes; tests; emulator configuration; and CI.
3. Inspected `DEC-AUTH-002` / `FD-AUTH-ARCH-001` directly in the Decision Register. It confirms an external managed IdP boundary and expressly does **not** decide persistence.
4. Verified that `FD-COM-001`, `CB-004` and `CB-008` are absent from `origin/main` at the entry baseline. The protected primary worktree contains uncommitted FD-COM-001 work; it was neither opened nor used. It is **PROVISIONAL / UNGOVERNED INPUT** only and is excluded from this decision basis.
5. Created isolated worktree `/private/tmp/11thonus-data-arch-001` from the recorded SHA, on branch `codex/data-arch-001`. The shared checkout had unrelated, pre-existing changes; none were touched.
6. Researched current official Firebase and Google Cloud documentation on 2026-09-08. Product references now call the service previously known as Firebase Data Connect **Firebase SQL Connect**; this report uses “SQL Connect (formerly Data Connect)” where precision matters.

### Authorities inspected

| Material source | Authority classification | Relevance to this decision |
| --- | --- | --- |
| [Platform Constitution / Canonical Reference](../../00-governance/canonical-reference.md) §§5–10 | **GOVERNED REPOSITORY AUTHORITY** | Domain ownership, state models, MVP scope, hierarchy, and cross-domain terminology. |
| [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-AUTH-002` | **GOVERNED REPOSITORY AUTHORITY** | External IdP is the approved direction; Firebase Auth is not target architecture; durable identity and authorization stay 11thONUS-owned. |
| [TRD 10](../../02-technical/trd/10-firestore-data-architecture.md) §§10.2–10.35 | **GOVERNED REPOSITORY AUTHORITY** | Current proposed data model, denormalization, transaction, migration, backup, cost and quality obligations. Its prior Firestore selection is the architecture under reassessment, not a circular mandate. |
| [TRD 11](../../02-technical/trd/11-cloud-functions-and-domain-services.md) §§11.14–11.30 | **GOVERNED REPOSITORY AUTHORITY** | Idempotency, transaction boundaries, consistency, outbox, purchase/verification/cycle/redemption, concurrency and retries. |
| [TRD 15](../../02-technical/trd/15-reporting-and-analytics.md) §§15.4–15.48 | **GOVERNED REPOSITORY AUTHORITY** | Reporting, projections, reconciliation, exports and future warehouse readiness. |
| [TRD 17](../../02-technical/trd/17-subscription-and-billing.md) | **GOVERNED REPOSITORY AUTHORITY** | Subscription/billing lifecycle, immutable history, payment confirmation, grace/suspension direction and provider-adapter separation. It does not establish FD-COM-001 requirements. |
| [TRD 19](../../02-technical/trd/19-quality-engineering.md), [TRD 20](../../02-technical/trd/20-deployment-and-operational-resilience.md), [TRD 12](../../02-technical/trd/12-security-and-access-control.md) and [TRD 21](../../02-technical/trd/21-privacy-and-data-protection.md) | **GOVERNED REPOSITORY AUTHORITY** | Emulator/CI, concurrency, migration, restore, monitoring, server authority, tenant isolation, audit, privacy, retention and recovery. |
| Current Functions/repository/test/configuration source at the entry SHA | **IMPLEMENTATION EVIDENCE** | Proves the present Firestore transaction, key-reservation, emulator and access-pattern footprint; it does not itself approve future commercial scope. |
| Protected, uncommitted FD-COM-001 commercial/ledger work | **PROVISIONAL / UNGOVERNED INPUT** | May inform a future reassessment only after it is governed on `main`; excluded here. |
| Comparative statement that relational constraints reduce application protocol burden | **INFERENCE** | Drawn from the governed requirements and verified implementation, not an independent approved requirement. |

**Authority interpretation.** TRD10 names Firestore because it records the prior target architecture. It is technical authority for the requirements it expresses, not a circular reason to retain Firestore when this reassessment asks whether that target still fits. FD-COM-001 is not approved repository authority at this baseline and is not amended, copied, consumed or relied upon by this report.

## 3. Canonical persistence-requirements catalogue

The table derives the needs before comparing providers. Every material input is classified by authority. “Native” means a datastore can structurally enforce or efficiently express the concern; it never removes the domain-service responsibility for authorization or business policy.

| Requirement | Authority classification | Evidence / consequence |
| --- | --- | --- |
| Durable Customer Identity separate from provider subject; opaque AuthenticationReference; no provider UID as business identity | **GOVERNED REPOSITORY AUTHORITY** | `DEC-AUTH-002`; Canonical Reference §10; TRD10 §10.6. A customer can have references, recovery and lifecycle history. |
| Business, Branch and Membership relationships; tenant boundary; one structural Owner at creation | **GOVERNED REPOSITORY AUTHORITY** | TRD10 §§10.6.3–10.6.4; verified business bootstrap implementation. Branch and membership must not become orphaned or cross-business. |
| Platform Administrator lifecycle and roles independent of credential provider | **GOVERNED REPOSITORY AUTHORITY** | `DEC-AUTH-002`; TRD12; verified `platformAdministrators` implementation. |
| Globally unique loyalty number, QR reference, AuthenticationReference, Business code and idempotency key | **GOVERNED REPOSITORY AUTHORITY** for the requirement; **IMPLEMENTATION EVIDENCE** for the current reservation protocol | TRD10; TRD11 §11.14; current reservation/key documents and emulator tests. |
| Purchase, dispute, correction and verified-unit history must be durable and reconstructable | **GOVERNED REPOSITORY AUTHORITY** | TRD10 §§10.10–10.11; TRD11 §§11.18–11.24; TRD15 reconciliation. |
| One active loyalty cycle per applicable customer/program, ordered allocation, exactly-once reward availability and redemption/reversal semantics | **GOVERNED REPOSITORY AUTHORITY** | Canonical Reference §7; TRD10 §§10.11–10.12; TRD11 §§11.20–11.27; TRD19 concurrency/reward-uniqueness tests. |
| Atomic command boundary: domain mutation + idempotency state + audit/outbox where required | **GOVERNED REPOSITORY AUTHORITY** for the requirement; **IMPLEMENTATION EVIDENCE** for 31 present transaction calls | TRD11 §§11.14–11.17; current outbox/idempotency implementation. |
| Valid lifecycle transitions and non-destructive history for identity, Business, membership, subscription/payment, cycle, reward and redemption | **GOVERNED REPOSITORY AUTHORITY** | Canonical Reference §7; TRD10; TRD17 §§17.35–17.45. |
| Server-side authorization and Business/customer data isolation; no client-selected actor or tenant | **GOVERNED REPOSITORY AUTHORITY** | `DEC-AUTH-002`; TRD11 §§11.2, 11.11–11.13; TRD12. |
| Auditable administrative, trust, recovery, payment and correction records, with correlation IDs | **GOVERNED REPOSITORY AUTHORITY** | TRD11 §11.37; TRD12; TRD20 §§20.22–20.28; current audit/outbox records are **IMPLEMENTATION EVIDENCE**. |
| Cross-entity transactions with predictable concurrency and isolation | **GOVERNED REPOSITORY AUTHORITY** | TRD10 §10.29; TRD11 §§11.15, 11.27; verified business bootstrap implementation. |
| Queryable customer history, current cycle, Business context and staff state with deterministic pagination | **GOVERNED REPOSITORY AUTHORITY** | TRD10 §10.19; TRD15 §§15.5–15.17; current customer/Business server reads are **IMPLEMENTATION EVIDENCE**. |
| Business operational/management reports, audit export and controlled projections | **GOVERNED REPOSITORY AUTHORITY** | TRD15 §§15.7–15.21, 15.36–15.48; TRD17 reporting/receipt requirements. These do not authorize new analytics features. |
| Schema evolution with controlled, testable expand/contract migrations | **GOVERNED REPOSITORY AUTHORITY** | TRD10 §§10.31–10.32; TRD19 migration tests; TRD20 §§20.19–20.21. |
| Backup, restore proof, tiered retention, export and reconstruction of reporting/search projections | **GOVERNED REPOSITORY AUTHORITY** | TRD10 §10.33; TRD19 restore exercise; TRD20 §§20.47–20.58. |
| Provider-portable business IDs, model, relationships and exports | **INFERENCE** from `DEC-AUTH-002` controlled-provider principle, applied consistently to durable data | The approved principle does not make the target provider-independent; it requires deliberate ownership and exit controls. |
| Low-latency direct realtime client synchronization | **IMPLEMENTATION EVIDENCE** plus **INFERENCE** | Firebase is capable here, but current Rules explicitly deny all direct Firestore access and no governed requirement makes it a hard need. |
| Dedicated warehouse, full-text/vector search, advanced analytics/benchmarking, multi-branch, POS/CRM integration | **GOVERNED REPOSITORY AUTHORITY** (deferred) | TRD14, TRD15 §§15.41–15.43, Canonical Reference §10 / TRD22. Architecture must not preclude them; they are not a reason to add stores today. |
| FD-COM-001 completed-cycle debit, grace-debt and top-up settlement rules | **PROVISIONAL / UNGOVERNED INPUT** | Absent from entry `origin/main`; excluded from the recommendation, comparison, sizing and blast-radius basis. If governed later, reassess rather than backfill authority into this report. |

## 4. Actual Firestore dependency map and coupling assessment

### 4.1 Scope found at the entry SHA

The repository is not a thin Firestore proof of concept. It contains 221 non-test Functions TypeScript files, of which **80** import `firebase-admin/firestore`; **30** non-test files issue direct collection calls; there are **59** Firestore-emulator test files and **212** Functions test files in total. `firebase.json` configures Auth, Functions, Firestore, Storage and Hosting emulators; CI runs `pnpm emulators:validate` after build, lint, format, typecheck, unit tests and browser tests. The active `firestore.indexes.json` has four composite indexes, all for `outboxEntries`. The web app imports Firebase packages in 69 source files, principally auth, functions and infrastructure; it has no approved direct durable-domain Firestore read/write path.

| Area / concrete dependencies | Classification | Assessment |
| --- | --- | --- |
| Document serialization/parsing functions in domain repositories | **Controlled persistence seam** | Most model converters consciously keep Firestore `Timestamp`/undefined handling in repository/infrastructure code. This is a good start. |
| `users`, `customerProfiles`, `authenticationReferences`, `loyaltyNumbers`, `qrIdentityRecords`, recovery proofs | **Persistence architecture leakage** | Collection IDs, document paths and Admin SDK transaction types appear through Identity/Authentication services. The auth transition will touch the same components. |
| `businesses`, `businessBranches`, `businessMemberships`, invitations, terms acceptance, code reservations | **Persistence architecture leakage** | Bootstrap and lifecycle services know collection paths, mint Firestore document IDs and shape Firestore transactions. The resulting cross-document protocol is correct but provider-specific. |
| Knowledge nodes/tags/translations and Rules-ready configuration | **Mixed: controlled seam plus healthy Firestore coupling** | Parser/repository separation is good; Firestore query/transaction APIs remain in repositories. Knowledge tree reads are a reasonable document-store fit, but it is still durable relational reference data. |
| Platform administrators, permission overrides, permission/trust/audit records | **Persistence architecture leakage** | Authorization orchestration takes Firestore and `Transaction` types; write-only `TransactionWriter` is a useful seam but still Firestore-shaped. |
| `idempotencyRecords` and `outboxEntries` | **Persistence architecture leakage** | Semantics are excellent, but document-ID keys, transaction retries, claim timestamp ownership and collection queries encode Firestore mechanics. |
| Firestore Rules and Storage Rules | **Healthy Firestore coupling** | Both are deny-by-default. Firestore Rules explicitly deny client access to implemented durable collections; Storage is also deny-all. Rules are currently a containment control, not domain authorization logic. |
| Web client | **Controlled persistence seam** | Current durable actions are mediated by callable Functions. The client does not own Firestore query construction for the operational domain. Firebase Authentication itself is a separate, intentional legacy coupling being reassessed under `DEC-AUTH-002`. |
| Emulator fixtures / integration suites / CI | **Healthy test coupling, migration blast radius** | Real emulator tests prove Firestore transaction behavior and Rules. They must be replaced by PostgreSQL integration tests if the store changes; this is expected, not an argument against change. |
| Functions triggers / Storage interactions | **Controlled and limited** | No durable Firestore trigger architecture was found in `functions/src/index.ts`; outbox is polling/processor based. Storage has no implemented data relationship beyond deny-all rules. |

### 4.2 Paths, IDs, denormalization and query patterns

- Top-level durable collections already include `users`, `customerProfiles`, `loyaltyNumbers`, `qrIdentityRecords`, `authenticationReferences`, `recoveryProofReferences`, `businesses`, `businessBranches`, `businessMemberships`, `businessMembershipInvitations`, `businessCodeReservations`, `businessTermsAcceptances`, `platformAdministrators`, `platformAdministrationAuditRecords`, `trustRecords`, `knowledgeNodes`, `knowledgeTags`, `knowledgeTranslations`, `platformConfig`, `idempotencyRecords`, and `outboxEntries`. TRD10 specifies the larger approved future purchase, loyalty, reward, notification, rules, reporting and commercial data set.
- Document ID is deliberately a uniqueness mechanism for loyalty numbers, QR references, auth-reference keys, Business-code reservations, platform administrators, idempotency keys and outbox event IDs. This is a Firestore-native substitute for unique keys/indexes.
- Current denormalization includes Business `ownerUserId` alongside Owner membership, branch `businessId`, membership `businessId`/`userId`, and permission override arrays. TRD10 §10.17 anticipates additional denormalized references/projections. Such duplication needs transactional maintenance and reconciliation.
- Current application queries are primarily equality lookup/list queries: membership by `(userId, businessId)`, Business by owner, invitation by Business/status/delivery target, tag/name, knowledge parent/path and outbox status. Only four checked-in composite indexes serve outbox query shapes; future reporting is planned as projections because Firestore is not being asked to do relational reporting directly.
- There is no implemented generic pagination contract in the operational domain yet. TRD10 and TRD15 require intentional query design and reporting/export behavior, so cursor/keyset semantics must be preserved as an API concern regardless of store.

**Leakage conclusion:** the model/domain functions are more isolated than a client-first Firebase app, but substitution is not presently bounded to a few adapters. Firestore is injected into many repositories *and* services, `Transaction` is passed through authorization and command code, and IDs/uniqueness/claims model Firestore behavior. This is meaningful but manageable pre-pilot technical debt—not a reason to preserve a mismatched primary store.

## 5. Manually enforced invariants and datastore fit

No defect is inferred merely because application code enforces an invariant. The inventory below is established from current repository code and emulator tests, then extended only where approved future requirements state an equivalent need.

| Current/manual invariant | Evidence | PostgreSQL native assistance | Still owned by domain policy? |
| --- | --- | --- | --- |
| One idempotency key represents one request hash; only one concurrent reservation wins | `shared/idempotency/idempotencyService.ts`; emulator contention tests | `UNIQUE(idempotency_key)` plus insert/upsert and transactional row handling | Yes—response replay, failed retry policy and client error contract. |
| One global loyalty number / QR / platform administrator / Business code / outbox event for its key | Document ID-as-value plus `transaction.get()` in identity, QR, business, admin and outbox repositories | Primary keys / `UNIQUE` indexes | Yes—generation policy and lifecycle. |
| Business bootstrap creates Business + initial Branch + Owner membership + code reservation + outbox or creates none | `businessRepository.ts` explicitly documents the five-document boundary | Foreign keys, unique code and one SQL transaction | Yes—what makes a valid bootstrap, user authorization and state. |
| Auth reference is globally unique and cannot silently link across identities; last reference is protected | `authenticationReferenceRepository.ts` and account-linking emulator tests | Unique `(reference_type, reference_id)` plus foreign key to customer identity | Yes—reference linking/unlinking/recovery policy. |
| Membership list must not contain duplicate effective user/Business association; removed records retain history | `businessMembershipRepository.ts` detects duplicate query results; write/lifecycle services preserve document | Partial unique index for active/invited association, foreign keys and history table/temporal pattern | Yes—role/state transition and historical meaning. |
| At most one override per permission and role change reconciles overrides atomically | `businessMembershipWriteRepository.ts` / role-change services; overrides stored in an array | Normalize overrides and use `UNIQUE(membership_id, permission_id)` | Yes—allowed permissions and reconciliation choice. |
| A branch belongs to the authorized Business, and classification references exist/are usable | `readBusinessBranchForBusiness` and bootstrap classification validation in a transaction | Foreign keys; checks; row locks where state must be inspected | Yes—tenant authorization and status eligibility. |
| Outbox worker claim is exclusive, reclaimable after timeout, and stale owners cannot transition it | `shared/outbox/outboxProcessor.ts`; `claimedAt` comparison and emulator races | `SELECT … FOR UPDATE SKIP LOCKED`, conditional update/version or lease column, unique event id | Yes—retry classification, dead-letter policy and publisher side effects. |
| Platform-administrator bootstrap/lifecycle is fail-closed and auditable | `platformAdministratorRepository.ts`, audit repository, emulator suites | PK/FK/enum/check constraints and atomic audit insert | Yes—role set and privileged transition policy. |
| Governed future cycle/reward/subscription/payment exact-once and history-preserving rules | **GOVERNED REPOSITORY AUTHORITY:** TRD10/11/17; not yet fully implemented | FKs, unique constraints, check constraints, row locks and SQL transaction | Yes—eligibility, threshold crossing and reversal business semantics. FD-COM-001 debit/grace/top-up rules are excluded as **PROVISIONAL / UNGOVERNED INPUT**. |

PostgreSQL would not make invalid workflow transitions magically safe: a check constraint can restrict values, but “may transition from state X to Y under authority Z” remains a command/service responsibility unless deliberately encoded in stored procedures/triggers. The recommendation is *not* to move policy into the database indiscriminately. It is to use database constraints for structural facts and keep business decisions testable in 11thONUS services.

## 6. Current Firestore transaction analysis

The production source has **31 executable** `runTransaction` call sites across **22 non-test files** (read-only authority reads and executable transactional wrappers included). This replaces the original, understated 27-call statement. The count is direct Firestore `db.runTransaction(...)` execution at the entry SHA; it is not a count of every `Transaction` parameter or helper that composes within another transaction.

**Method.** The inventory starts with all TypeScript files under `functions/src`, excludes `*.test.ts` / `*.spec.ts` test source, and searches separately for ordinary, generic and non-`async` forms: `runTransaction(`, `runTransaction<T>(`, and callbacks returning expressions. Every hit was manually inspected to separate executable calls from comments and to identify wrappers. A supplementary search for `Transaction` imports/types, destructured/aliased transaction access and callers of transaction-capable helpers found no additional executable alias form. `authorizeAndExecute` is included because it executes its own `db.runTransaction`; `permissionAuditService` is excluded because its sole direct call is explicitly a test-only convenience wrapper. Eleven direct occurrences in test files are excluded as test fixtures, not production call sites.

| Category | Calls | Files | Included executable forms |
| --- | ---: | ---: | --- |
| Identity, authentication references, QR and loyalty identifiers | 11 | 8 | Customer/profile/lifecycle/display-name, authentication-reference, lookup, QR, loyalty-number and authentication-event mutations. |
| Idempotency and transactional outbox | 3 | 2 | Reservation plus outbox claim and owned-transition calls. |
| Business and terms/authority reads | 3 | 3 | Bootstrap, terms acceptance and the non-`async`, read-only `businessCallerAuthority` call. |
| Permission/staff lifecycle wrappers | 2 | 2 | `authorizeAndExecute` and staff-invitation acceptance. |
| Commerce Knowledge | 7 | 3 | Node (3), tag (2) and translation (2) mutations. |
| Platform Administration | 4 | 3 | Repository create/authorization, bootstrap and read-only authorization. |
| Trust | 1 | 1 | Trust-record ingestion. |
| **Total** | **31** | **22** | **All executable non-test direct Firestore transaction calls.** |

**Exclusions.** Eleven test-source calls are fixtures and not production execution. One executable-looking call in `permissionAuditService.ts` is excluded after source inspection: the module labels it a test-only convenience for its emulator tests and production code composes `recordSensitiveDecision` through its caller transaction instead. Comments and report prose are not counted. No unclassified executable candidate remains.

| Transaction family | Scope / sensitivity | Datastore-specific complexity |
| --- | --- | --- |
| Idempotency reservation | Single idempotency document; contention- and idempotency-sensitive | Transaction retry is used as the lock; completion/failure occurs in separate calls after the domain transaction. |
| Outbox claim and owned transition | Single entry each; contention-, retry- and audit-sensitive | `claimedAt` is an application lease token; candidates are queried then revalidated in individual transactions. |
| Customer identity registration, profile/lifecycle/display name and recovery proof | Multi-document with outbox/recovery proof; idempotency/audit-sensitive | Read-before-write ordering, explicit document-existence checks and top-level/subcollection reference protocols. |
| Authentication-reference link/unlink and identity lookup assignment | Cross-identity and cross-domain; conflict-sensitive | Global auth-reference key, last-reference protection and collision protocol are application transactions. |
| Loyalty number and QR association/replacement | Cross-document identity linkage; uniqueness-sensitive | Document ID reservation and atomic replacement needed to avoid stale QR association. |
| Business bootstrap | Five documents plus preceding idempotency reservation; cross-domain, contention and audit-sensitive | Collision loop, Firestore read-before-write ordering and manual reservation collection. This is the clearest present relational transaction. |
| Business profile/lifecycle/terms acceptance | Business, branch/membership/terms/outbox; authorization- and audit-sensitive | Firestore transaction type is pushed through `authorizeAndExecute`; lifecycle checks depend on application reads. |
| Permission authorization, audit and staff lifecycle/role changes | Multi-document authorization snapshot plus write/outbox; contention/audit-sensitive | The custom write-only `TransactionWriter` prevents accidental reads after authorization, a safety protocol created around Firestore transaction semantics. |
| Commerce Knowledge node/tag/translation changes | Parent/tree/reference mutation; uniqueness and integrity-sensitive | Application transaction protects parent/path and name/key semantics; future relational references will add more. |
| Trust record ingestion | Cross-domain write plus outbox; audit-sensitive | Transaction joins durable trust record and emitted event without native referential constraints. |
| Platform administrator creation/authorization | Single document/read mostly; lifecycle/audit-sensitive | Read-before-write existence and status checks are manual. |

Firestore transactions themselves provide atomic multi-document operations and are not inadequate for the current code. The problem is the *accumulated protocol burden*: transactional retries, read-before-write discipline, document key reservations, denormalized duplicate maintenance, lease ownership and collection-level reconciliation. Governed purchase-to-cycle-to-reward and subscription/payment work will require more of the same across integrity-sensitive records. Any additional FD-COM-001 commercial mechanics are deliberately outside this conclusion.

## 7. Query and reporting assessment

### Current and approved needs

| Need | Status | Firestore fit | SQL fit |
| --- | --- | --- | --- |
| Customer identity/profile and Business context lookup | Implemented | Good by document ID/equality filters | Good by indexed key/join. |
| Staff/membership and invitation lists | Implemented | Good at current scale, but duplicate detection/manual tenant joins remain code | Strong: indexed joins, uniqueness and filters in one query. |
| Customer purchase/cycle/reward history | Approved MVP | Requires purpose-built collection/query/projection shapes and indexed denormalization | Natural joins, keyset pagination and filtered history queries. |
| Current loyalty-cycle state and threshold crossing | Approved MVP | Achievable, but serialized transaction/counter/document design must avoid races/hot documents | Strong with locked rows, constraints and atomic ledger append. |
| Business operational reports and reward liability | Approved MVP | TRD15 correctly requires projections and reconciliation; aggregation does not replace relational joins | Strong for operational SQL; projections still useful for dashboard latency. |
| Subscription/payment history, receipts, refund/reversal reconciliation | **GOVERNED REPOSITORY AUTHORITY:** TRD17 | High implementation/reconciliation burden; immutable history must be assembled across documents | Strong: payment/receipt relations, atomic posting and report queries. FD-COM-001 top-up/grace/debit mechanics are excluded. |
| Cross-Business/customer/admin audit queries and controlled exports | Approved administrative need | Collection groups and projections possible; index and cost planning required | Strong with explicit authorization-scoped queries, joins and export views. |
| Warehouse, advanced analytics, search/vector/benchmarking | Deferred | Do not add a store now; Firestore export/projections are possible | PostgreSQL does not replace a future warehouse or dedicated search service. |

TRD15 already forbids treating a dashboard projection as a substitute for truth: it requires event-driven updates, reconciliation, rebuild and freshness semantics. PostgreSQL improves the authoritative operational query layer and reconciliation baseline; it does not authorize analytics expansion or eliminate reporting projections.

## 8. Candidate architecture assessment

### A — Retain Firestore as primary with bounded corrections

**Strengths:** minimal immediate code change; managed elasticity; no connection management; existing emulator, Rules and Functions investment; good point lookup/offline/realtime capability. Current client access is already server-mediated, reducing Rules complexity.

**Limits:** the governed transactional/relational domain already requires reservation documents, transaction protocols, denormalized fields, indexes/projections and reconciliation paths. Each additional governed invariant can add more of those mechanisms. Reporting and operational reconciliation remain deliberately indirect. It also leaves a continuing Firebase data-access model next to an external-IdP transition, even though direct client access is not used.

**Finding:** viable, but not strongest overall fit before pilot.

### B — Cloud SQL PostgreSQL authoritative through Functions/API

**Strengths:** native primary/foreign keys, unique/partial indexes, check constraints, SQL transactions, row locks, isolation levels, relational query/reporting, conventional schema migrations and database-portable data. It directly supports the governed identity, relationship, lifecycle, audit, purchase/cycle/reward and subscription/payment model and cleanly fits external-JWT→server API access.

**Requirements/costs:** create a repository port boundary; write schema/migrations; select a Node PostgreSQL driver/query approach; apply a connection-pooling and max-instances plan; use Cloud SQL Connector and automatic IAM database authentication where validated; use IAM/least privilege, Secret Manager only where needed, backups/PITR, HA policy, monitoring, Docker PostgreSQL local development and ephemeral/managed CI databases. These are operational responsibilities, not free benefits.

**Finding:** strongest fit, provided implementation is separately authorized and staged.

### C — Firebase SQL Connect (formerly Data Connect) / PostgreSQL

SQL Connect is backed by Cloud SQL PostgreSQL, maps GraphQL schema types to PostgreSQL tables, deploys server-side operations and generates typed client SDKs. Its data is more portable than Firestore documents because PostgreSQL remains underneath; its **application access layer is not equivalently portable** because schemas, GraphQL directives, generated SDKs, CLI deployment and Firebase-specific authorization form a new dependency.

The current official security model states that client query/mutation authorization is fully integrated with Firebase Authentication: `USER` levels and `auth.uid`/Firebase token claims drive `@auth`; `NO_ACCESS` is for Admin SDK environments. An external IdP could be bridged through Firebase Auth custom tokens/OIDC, but that would reintroduce Firebase Authentication as a user-facing token boundary—the dual-token bridge already assessed as not recommended by `DEC-AUTH-002`. Server/Admin SDK use with `NO_ACCESS` would avoid direct client use but adds a GraphQL/generated-SDK layer between the domain and its SQL database without solving the repository rewrite.

**Finding:** do not select SQL Connect as the authoritative access architecture for this decision. It is not an external-IdP-native fit and adds a provider-specific access layer. Revisit only if a future approved requirement genuinely needs its client-side realtime GraphQL capability and authentication compatibility is independently validated.

### D — Deliberate PostgreSQL + Firestore hybrid

No approved workload currently justifies two authoritative operational stores. “Keep Firestore because work already exists” is not a workload case. A hybrid would add dual-write/retry/order/replay/backup/restore/debugging obligations exactly where the system already needs strong consistency.

| Data class | Recommended owner in the selected target | Firestore role |
| --- | --- | --- |
| Identity, AuthenticationReferences, Businesses, Branches, memberships, administrators/roles | PostgreSQL authoritative | None. |
| Purchase, verified units, cycles, rewards, redemptions, subscription/payment and reversal records | PostgreSQL authoritative | None. |
| Idempotency, transactional outbox, audit/recovery/trust records, rules/knowledge configuration | PostgreSQL authoritative | None. |
| Dashboard/read projection or cache (only if later proven useful) | PostgreSQL-derived, rebuildable projection | Optional derived cache only; never source of truth or dual-write peer. |
| Storage objects | Cloud Storage/object store authoritative for blobs; metadata relation in PostgreSQL | Firestore not required. |

**Finding:** hybrid is not selected for this decision. A future projection/cache must have one-way outbox/CDC-style derivation, idempotent consumer, replay/rebuild procedure, freshness monitoring, and no authority over workflows. It is not part of the recommended initial transition. This is a scope and integrity conclusion, not an assertion that Firestore must disappear from every future architecture.

### E — Other architecture

No repository requirement supports a separate document database, event store, or warehouse as the primary transactional authority. Managed PostgreSQL covers the identified need with lower conceptual count of systems.

## 9. External IdP compatibility

`DEC-AUTH-002` requires: external provider token/subject → controlled authentication adapter/reference → durable Customer Identity → 11thONUS authorization. The provider subject cannot become the Customer ID, Business ID, Platform Administrator ID or role authority.

| Access model | External-IdP compatibility | Finding |
| --- | --- | --- |
| Direct client Firestore | Poor for the approved direction unless Firebase Auth is retained/bridged; current Rules deny all direct data access anyway | Do not use. |
| SQL Connect direct client SDK | Poor without a Firebase Authentication bridge; official client authorization semantics depend on Firebase Auth tokens/claims | Do not use as target path. |
| Functions/API with external JWT verification then PostgreSQL repository | Strong | Recommended. Authentication adapter verifies issuer/audience/signature/claims, resolves opaque AuthenticationReference and then invokes 11thONUS authorization. |
| Functions/API with Firestore | Architecturally compatible, since current Rules are deny-all | Compatible but not strongest persistence fit. |

This separation also avoids treating database credentials or Cloud IAM identities as end-user authorization. Database connection credentials authorize only the server workload; 11thONUS authorization remains in the application/domain boundary.

## 10. Direct PostgreSQL operational evaluation

| Dimension | Assessment / required control |
| --- | --- |
| Schema and integrity | Use a private application schema with UUID/11thONUS-owned IDs, foreign keys, unique/partial indexes, `NOT NULL`, checked enumerations where stable, and append-only history/ledger tables where required. Avoid turning all business transitions into triggers. |
| Transactions and locking | Standard transactions for command + idempotency + outbox; lock the affected current cycle/balance rows in a documented order; use unique constraints as duplicate backstops; choose isolation per workflow and retry serialization/deadlock failures. |
| Reporting | SQL views/query services may support operational reporting and reconciliation. Do not grant direct client SQL or broaden reporting scope. |
| Migrations | Versioned, reviewed expand/contract migrations; migration ledger; dry run/verification; schema compatibility in CI. This replaces Firestore's per-document schemaVersion/migration protocols, not the requirement for safe rollout. |
| Functions connections | Connection pools must be module-scoped/reused, sized against Cloud SQL limits and Functions `maxInstances`/concurrency, and closed only on process termination. Never create a fresh pool per request. The Cloud SQL Connector supports encrypted/IAM-authorized connectivity; explicit capacity testing is required before production sizing. |
| Security | Prefer private connectivity where selected by deployment design, least-privilege service accounts, Cloud SQL Connector, automatic IAM DB auth where compatible, database roles for migration versus runtime, audit logging, CMEK evaluation and Secret Manager only for unavoidable secrets. |
| Resilience | Enable automated backups/PITR according to confirmed RPO/RTO; perform restore exercises; decide HA only from service objectives rather than by default; monitor backup success, replication/HA, connections, locks, query latency and storage. |
| Local/CI | Docker Compose/local PostgreSQL plus migration and integration-test fixture tooling; CI ephemeral PostgreSQL or isolated test DB, alongside pure domain tests. No Cloud SQL project should be provisioned by this assessment. |
| Cost | The fixed instance baseline, storage/backups and optional HA are real. They buy relational enforcement, familiar tools and operational observability; they must be budgeted and measured rather than assumed cheaper than Firestore. |

## 11. Transition and double-migration analysis

### 11.1 Risk distinction

**User/data migration risk: low, but unverified.** The repository's cloud-environment strategy records the current Firebase project as a development-stage environment with no production data/users/workloads. Before any migration, a separate read-only inventory/export verification must establish the actual record count and legal/retention status. This report does not make that verification or migrate any data.

**Engineering transition cost: moderate-to-significant.** At minimum it includes:

- 80 production Functions files importing Firestore Admin APIs, 30 production files with collection calls, and Firestore types that cross repository/service boundaries;
- 31 executable production `runTransaction` calls across 22 files. This is a material rewrite/test-design surface, but not 31 independent migrations: common unit-of-work, repository and test-harness changes can cover multiple sites;
- 59 emulator suites, Firestore fixtures, 4 checked-in outbox indexes, `firebase.json` emulator configuration and the CI emulator-validation job;
- Firestore document converters, document-ID generation/keying, collection paths, transaction retry semantics, query/pagination implementations and Rules tests;
- callable/Functions request authentication and hosting/client-auth dependencies that must stay compatible with the separately controlled IdP direction, without choosing a provider here;
- configuration/deployment/IAM, local development, monitoring, backup/restore and incident/runbook material.

**Architecture transition risk: material and controllable.** The change replaces a managed document/emulator/Rules development model with schema migrations, SQL integration/concurrency testing, connection management, database backup/restore controls and a stronger repository/unit-of-work seam. It must preserve server-only authorization, durable 11thONUS identifiers, idempotency/outbox semantics and API contracts while `DEC-AUTH-002` is separately validated. No production configuration, Firebase Rules, data or infrastructure is changed by this assessment.

### 11.2 Avoiding double migration

Doing authentication first and persistence second would rewrite these surfaces twice:

| Shared surface | First auth-only rewrite | Second persistence-only rewrite | Better sequence |
| --- | --- | --- | --- |
| Callable/HTTP ingress and token verification | Replace Firebase token verifier, callable auth assumptions and CSP | Replace data/repository dependency behind same endpoints | Define target external-JWT API ingress once; transition storage beneath it in the same controlled programme. |
| AuthenticationReference and Customer Identity | Re-key/provider-adapter changes around Firestore users/references | Re-map their persistence and uniqueness constraints to SQL | Model durable identities/references in PostgreSQL while implementing the external adapter. |
| Platform Administrator/authorization | Replace Firebase UID/token assumptions | Rebuild Firestore membership/admin reads/writes | Preserve domain IDs and authorization policy; implement one server API/repository boundary. |
| Audit/recovery/idempotency/outbox | Update actor/auth provenance | Recreate document transaction/claim protocol | Design one command transaction contract in PostgreSQL. |
| Web client | Replace Firebase Auth SDK/session/callable assumptions | Later replace data transport/query changes | Move to the target API contract once; keep the client database-blind. |

**Recommended sequencing, subject to separate authorization:**

1. Record this architecture decision (Founder decision) and create one implementation programme, not a migration.
2. Complete `AUTH-ARCH-002` provider hard-invariant validation; do not select an IdP here.
3. Produce a combined external-IdP-compatible + PostgreSQL target design, threat model, schema/invariant catalogue, capacity/cost sizing and migration/test plan before coding. This task does not select the IdP or authorize that programme.
4. Establish PostgreSQL repository ports, migrations and test harness in an isolated non-production environment; migrate Identity/AuthenticationReference/authorization and server ingress only when separately authorized, behind compatibility-tested APIs.
5. Move the remaining implemented durable state, then implement future governed loyalty/subscription workflows on the selected authoritative store. Do not create a dual-authoritative period.
6. Verify counts, invariants, audit/outbox replay, backup/restore and cutover. Retire Firestore authority only after verification. No dual-authoritative period.

## 12. Cost analysis (official current sources, not a quote)

Prices vary by region, edition, machine size, storage, networking, discount model and future change. Exact pilot numbers therefore require a region/workload estimate before provisioning. The relevant current official charging model is below.

| Dimension | Firestore primary | Direct Cloud SQL PostgreSQL | SQL Connect / Data Connect |
| --- | --- | --- | --- |
| Pilot baseline | Usage-based; Firebase lists one free database with 50k reads/day, 20k writes/day, 20k deletes/day, 1 GiB data and 10 GiB/month egress | Always-on provisioned CPU/memory plus storage/backups; current Cloud SQL pricing lists location-dependent CPU/memory rates and HA charges a failover replica at equivalent rate | Firebase lists a first-default-instance 3-month trial and then Cloud SQL starting from $9.37/month (region/configuration dependent) |
| Operation charging | Documents read, written, deleted; index-entry reads; data/index storage; network | Instance time, CPU/memory, storage, backups, networking and optional HA/replicas | 250k operations/month no-cost then $0.90/million, plus underlying Cloud SQL and network pricing |
| Hidden growth driver | Fan-out documents, denormalized projections, transaction rereads, index reads and listener reconnects | Oversized idle instance, insufficient connection control, HA/replicas, backups and slow queries | GraphQL/generated-access layer and Firebase Auth dependency; operation counts in addition to database |
| Engineering/operational cost | Lowest initially; higher bespoke invariant/reconciliation burden as domain grows | Higher initial DBA/SRE discipline; lower custom relational/invariant/query burden | Adds product-specific schema/connector/SDK/auth tooling on top of PostgreSQL operations |

Firestore can absolutely be least expensive for a very light pilot. That alone does not win where the core product needs exact integrity-sensitive relationship, lifecycle and history state. Conversely, PostgreSQL is not automatically cheaper: its fixed baseline must be accepted as an intentional integrity/operability investment. Forecasting must use actual proposed requests—documents/index reads and writes per purchase/cycle/report for Firestore; connection, compute, IOPS/storage/backup, HA and query profile for PostgreSQL.

## 13. Operational burden comparison

| Concern | Firestore | PostgreSQL |
| --- | --- | --- |
| Initial developer experience | Very low infrastructure overhead; existing emulator and SDK use | Adds local database, migrations, driver/pool and test DB management. |
| Constraints | Application code, Rules (not applicable to Admin SDK), document IDs, transactions and reconciliation | Native PK/FK/unique/check/transaction/lock tools plus application policy. |
| Schema evolution | Flexible documents but distributed version/migration discipline | Explicit migration discipline and stronger compatibility/rollback practices. |
| Backups/restore | Managed export/backups/PITR options; still needs cost and restore proof | Automated/enhanced backups and PITR; still needs cost, HA/DR and restore proof. |
| Incident diagnosis | Document/index/rule/transaction contention and projection state | Query plans, locks, connections, migrations, capacity and backup state. |
| Reporting | Projection-first and purpose-built index/query design | Relational operational reports easier; warehouse still future. |
| Provider portability | Export/import possible but document model/application APIs are provider-shaped | PostgreSQL data/tools are broadly portable; Cloud SQL operational APIs remain provider-specific. |

Firestore simplicity receives real weight. The decision nevertheless favors PostgreSQL because 11thONUS needs to carry its operational burden once, centrally, rather than repeatedly recreate relational guarantees inside governed integrity-sensitive workflows.

## 14. Controlled provider-dependency analysis

11thONUS must own domain IDs, semantic relationships, state-transition rules, idempotency meaning, outbox event contracts, audit meaning and exportability. Infrastructure may own durable storage mechanics, backups, SQL execution and managed scale.

| Dependency dimension | Controlled-provider-dependency assessment |
| --- | --- |
| **PostgreSQL portability** | PostgreSQL's standard relational model, SQL, schemas, migrations, constraints and conventional drivers are materially portable across self-managed PostgreSQL and compatible managed offerings. That lowers the cost of moving the *data and application model*; it does not make every extension, deployment configuration or operational procedure portable without work. |
| **Cloud SQL dependency** | Cloud SQL retains Google Cloud dependencies for instance lifecycle, IAM/service accounts, networking/connectors, backups/PITR, monitoring, regional availability, quotas, billing and managed-operation runbooks. A Cloud SQL target is deliberately provider-managed, not provider-independent. |
| **Firebase SQL Connect/Data Connect dependency** | In addition to Cloud SQL, SQL Connect introduces Firebase GraphQL schemas and directives, generated client SDKs, CLI/deployment flow, Firebase runtime integration and a client authorization model tied to Firebase Authentication. Server-only use avoids direct client auth coupling but still adds a Firebase-specific application access layer without reducing the repository rewrite. |
| **Firestore dependency** | Retaining Firestore as authority retains document/collection-path modeling, document-ID uniqueness patterns, Admin SDK transactions and retry/read-before-write semantics, query/index and denormalization design, emulator fixtures, Rules tests, Functions repository/services and Firebase deployment/observability coupling. Existing Rules' deny-all posture limits direct-client coupling but does not remove those data-model and operational dependencies. |

Current interfaces are partially substitution-friendly: many models are framework-free; serializers isolate some Timestamp/undefined concerns; repositories exist; server-only access is established; `TransactionWriter` shows deliberate capability narrowing. They are not yet sufficiently bounded for a painless datastore swap because Firestore types, `runTransaction`, collection names and document-ID behavior enter services and command orchestration. A separately authorized PostgreSQL programme should improve—not bypass—this boundary:

- domain services depend on repository/unit-of-work ports, not `Firestore`/`Transaction`;
- an application transaction port has semantic operations, not a Firestore-shaped writer;
- persistent IDs are 11thONUS IDs minted independently of database/provider;
- constraints are duplicated deliberately: database structural backstop plus domain validation/authorization;
- exports and backup validation are part of the data owner’s exit strategy.

**Conclusion:** controlled dependency means deliberate boundaries, recoverable data and a known exit path. It does not claim that Cloud SQL, Firebase SQL Connect or Firestore is provider-independent.

## 15. Risks and decision controls

| Risk | Control before implementation |
| --- | --- |
| Recommending SQL without hard sizing evidence | Separate validated design must model pilot load, Functions concurrency/pooling, connection limit, region, HA/RPO/RTO and budget. |
| Losing Firestore’s convenient realtime/offline behavior | Keep clients API-oriented; prove required customer flows (including permitted offline queue) against server authority. Do not infer direct SQL access. |
| IdP/persistence scope explosion | One combined transition programme with explicit work packages, but no provider selection in this task. |
| Encoding business logic only in database | Keep workflow policy in versioned, tested domain services; use DB constraints as structural backstops. |
| Dual writes / inconsistent hybrid state | No dual-authoritative hybrid. One cutover authority, verification and replayable derived projection only. |
| Underestimating Firestore test rewrite | Treat 59 emulator suites, fixtures, CI, indexes and Rules as planned work; preserve behavior-level tests and add DB integration/concurrency tests. |
| Premature analytics expansion | Limit target to operational authoritative data and approved reports. Warehouse/search/advanced analytics remain deferred. |

## 16. Official service references consulted

- [Cloud Firestore billing](https://firebase.google.com/docs/firestore/pricing) — document/index operation, storage, egress and backup/PITR charging model.
- [Firebase pricing](https://firebase.google.com/pricing) — current no-cost quotas and Firebase SQL Connect operation/trial presentation.
- [Cloud SQL pricing](https://cloud.google.com/sql/pricing) — CPU/memory, storage/network and HA charging model.
- [Cloud SQL connection from Cloud Run functions](https://cloud.google.com/sql/docs/postgres/connect-functions) and [Cloud SQL connectors](https://cloud.google.com/sql/docs/postgres/connect-connectors) — Functions connection, pool and connector considerations.
- [Cloud SQL IAM database authentication](https://cloud.google.com/sql/docs/postgres/iam-authentication) and [backups](https://cloud.google.com/sql/docs/postgres/backup-recovery/backups) — IAM auth, backup and restoration capabilities.
- [Firebase SQL Connect overview](https://firebase.google.com/docs/sql-connect), [quickstart](https://firebase.google.com/docs/sql-connect/quickstart), and [authorization/security](https://firebase.google.com/docs/sql-connect/authorization-and-security) — PostgreSQL backing, generated SDK/GraphQL layer and Firebase Authentication client authorization dependency.

## 17. Required report closure

- **Entry main SHA:** `ee899032b4734260697c47635aaaa136aadf7cda`.
- **Authorities inspected:** §2 classifies every material input. `DEC-AUTH-002` and the governed repository records were applied; FD-COM-001 was explicitly excluded as provisional/ungoverned.
- **Persistence requirements, dependency map, leakage, manual invariants, transactions, reporting, candidate evaluation, external IdP, transition, cost, operations, controlled dependency and risks:** §§3–15.
- **Final recommendation:** direct/server-governed Cloud SQL PostgreSQL; no SQL Connect/Data Connect client architecture; no hybrid.
- **Files modified:** this corrected assessment report; `docs/00-governance/documentation-changes-log.md`; `docs/changes/IMPLEMENTATION_CHANGES.md`.
- **Production/config/data changes:** **NONE** expected or made. No dependency, schema, Cloud SQL, Data Connect, Rules, auth, Firestore, data, configuration or infrastructure change was made.
- **Commit / PR / exact head:** completed only after the documentation-only report has been reviewed, committed and pushed; recorded in the delivery update for this assessment.
- **Recommended next step:** Founder records or rejects this architecture direction. If accepted, authorize a bounded target-design package compatible with (but not dependent on selection under) `AUTH-ARCH-002`, covering PostgreSQL schema/invariants, API ingress, sizing/cost, security, migration and test strategy—still without migration until separately authorized.

CHANGE — POSTGRESQL SHOULD BECOME AUTHORITATIVE DATASTORE

## 18. Founder disposition — `FD-DATA-ARCH-001` / `DEC-DATA-008` (2026-09-08; recorded per `DATA-ARCH-001-FD-001`)

Historical reasoning (§§1–17) and `DATA-ARCH-001-CORR-001` evidence are preserved above and are not rewritten. The Founder disposition is:

- **Persistence architecture direction = APPROVED / CHANGE.** 11thONUS shall use PostgreSQL as the authoritative durable transactional datastore. Preferred target: server-governed Cloud SQL for PostgreSQL behind the 11thONUS Functions/API boundary.
- **Firestore disposition:** not automatically removed, but no longer presumed the authoritative primary durable store. Bounded future workloads only if separately justified; no dual authority, sync, projection or cache strategy authorized.
- **SQL Connect disposition:** assessed, not preferred as the target access architecture (Firebase Auth-coupled access layer; portability preferred).
- **Controlled provider dependency preserved:** PostgreSQL = technology choice, Cloud SQL = preferred managed host; provider-managed, not provider-independent; no provisioning authorized.
- **IdP compatibility:** direction remains compatible with `DEC-AUTH-002` (External managed IdP → Functions/API → domain → PostgreSQL). Auth0 not selected; `AUTH-MFA-003D` not resumed.
- **FD-COM-001 exclusion preserved:** this direction does not depend on provisional commercial assumptions.
- **Next step is a future combined target-design/transition package** (not instantiated; no migration started).

**DATA-ARCH-001 = FOUNDER-DISPOSED / APPROVED ARCHITECTURE DIRECTION — NOT IMPLEMENTED** (merge closure recorded on PR #236).
