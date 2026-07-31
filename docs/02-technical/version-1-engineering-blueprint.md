> **Title:** Version 1 Engineering Blueprint
> **Version:** 1.0 · **Status:** Active — definitive technical architecture reference · **Classification:** Authoritative Technical (consolidation, not a new source of truth)
> **Governing document:** Platform Constitution; TRD Chapters 8, 9, 10, 11, 12, 16, 20, 22
> **Source-of-truth path:** `docs/02-technical/version-1-engineering-blueprint.md`
> **Last controlled update:** 2026-07-31 (`RES-005.2a` — §3.3 Standard Document Metadata corrected to TRD10 §10.5's shape, resolving the Blueprint's own disagreement with the TRD chapter per its §0 rule) · Previously: 2026-07-17 (Engineering Decision Sprint 2 — §1.3 updated: DEC-TECH-003 now CONFIRMED; created Engineering Transition Phase 0B)

# Version 1 Engineering Blueprint

## 0. Purpose and Status

This is the single, definitive technical architecture reference for engineering implementation. It **consolidates** already-approved architecture from TRD Chapters 8 (Firebase Platform Architecture), 9 (Physical and Integration Architecture), 10 (Firestore Data Architecture), 11 (Cloud Functions and Domain Services), 12 (Security and Access Control), 16 (Frontend and PWA Architecture), and 20 (Deployment and Operational Resilience) into one place, organized the way an engineer starting Phase 0 needs it, rather than scattered across seven chapters read in isolation.

**This document does not create new architecture.** Every statement below cites its TRD source. Where an architectural question has no TRD answer — because it depends on a still-open decision — this document says so explicitly rather than inventing one; those points are the same ones tracked in the [Engineering Decision Closure Recommendations](../00-governance/decisions/engineering-decision-closure-recommendations.md) and the [Engineering Transition D1 Agenda](../00-governance/decisions/engineering-transition-d1-agenda.md). If this Blueprint and a TRD chapter ever appear to disagree, **the TRD chapter governs** and this document is corrected — exactly the same rule the Canonical Reference already follows for product content ([Decision Governance Workflow](../00-governance/decision-governance-workflow.md) §8).

**Known source discrepancy, disclosed rather than silently resolved:** TRD8 §8.6's illustrative Firestore-collection example lists `subscriptions` under the Administration Domain. This predates the Phase 1 correction recorded in the [Canonical Reference](../00-governance/canonical-reference.md) §6, which states explicitly: *"Subscription — not Administration — owns billing records."* This Blueprint follows the Canonical Reference's corrected Ownership Model (§3 below) as authoritative; TRD8 §8.6's example is cited only for the *principle* it establishes (domain-owned collections, one owner per collection), not for that specific stale example.

## 1. Overall Architecture

### 1.1 Platform Shape

11thONUS is a Firebase-first, serverless, event-driven platform (Constitution CP-002/CP-003; TRD8 §8.1) with three frontend surfaces — customer, business, administration — sharing one backend (TRD16 §16.4).

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React + TypeScript, mobile-first PWA)     │
│  Customer surface · Business surface · Admin surface  │
└───────────────────┬───────────────────────────────────┘
                     │ Firebase Client SDK (callable functions, direct reads)
┌────────────────────▼──────────────────────────────────┐
│  Firebase Authentication  │  App Check  │  Remote Config │
├────────────────────────────────────────────────────────┤
│  Cloud Functions (business logic and workflows)         │
│  — Callable · Event · Scheduled · Administrative —       │
├────────────────────────────────────────────────────────┤
│  Cloud Firestore (operational data, domain-owned)        │
│  Cloud Storage (images/documents/media)                  │
├────────────────────────────────────────────────────────┤
│  Firebase Hosting (PWA)  │  Cloud Messaging  │  Analytics │
└────────────────────────────────────────────────────────┘
```

### 1.2 Firebase Service Responsibilities (TRD8 §8.2 — already approved, reproduced for reference)

| Service | Responsibility |
|---|---|
| Firebase Authentication | Identity management |
| Cloud Firestore | Operational data storage |
| Cloud Functions | Business logic and workflows |
| Cloud Storage | Images, documents, media |
| Firebase Hosting | PWA hosting |
| App Check | Client integrity |
| Remote Config | Runtime configuration and feature flags |
| Firebase Analytics | Product analytics |
| Crashlytics | Error reporting |
| Performance Monitoring | Performance metrics |
| Cloud Messaging | Push notifications |
| Cloud Scheduler | Scheduled jobs (future) |
| Cloud Tasks | Background task queues (future) |
| Pub/Sub | Event distribution (future evolution) |

No service assumes another's responsibility (TRD8 §8.2). The frontend never talks to Firestore/Functions in a way that bypasses this table — see §3.3 below.

### 1.3 What Is Deliberately Not Fixed Yet

One architecture-level question remains genuinely unresolved in this Blueprint: the Firebase/GCP region (**DEC-TECH-005**), still OPEN_ENGINEERING pending a regional evaluation and the dependent DEC-LEGAL-006 legal position.

**Update (Engineering Decision Sprint 2, 2026-07-17):** the frontend build tool/router/state/form/component/PWA/test tooling question (**DEC-TECH-003**) is now **CONFIRMED** in the live Decision Register — Version 1 frontend stack: Vite (build tool), React Router (routing), TanStack Query (server state), React Hook Form + Zod (forms/validation), shadcn/ui + Tailwind CSS (component foundation/styling), Lucide (icons), Recharts (charts), TanStack Table (tables), vite-plugin-pwa/Workbox (PWA), Vitest + React Testing Library + Playwright (testing), ESLint + Prettier (lint/format), pnpm (package manager). Full evaluation and rationale: [DEC-TECH-003 Engineering Stack Evaluation & Recommendation](../00-governance/decisions/dec-tech-003-engineering-stack-recommendation.md). This resolves the second (and last) of ENG-P0-001's two blocking preconditions (DEC-TECH-004 was confirmed in the same sprint). DEC-TECH-006 (event-outbox pattern) and DEC-TECH-007 (idempotency policy) are also now CONFIRMED at the pattern/policy level — see §4 below and the [Phase 0 Authorization](../05-implementation/phase-0-authorization.md) record. DEC-TECH-005 (Firebase region) remains the sole open D1 technical question in this Blueprint.

## 2. Repository Architecture

Repository structure is **CONFIRMED**: a single monorepo containing frontend and Cloud Functions code with shared types (DEC-TECH-004; basis OTD-002 and the unified project structure TRD8 §8.4 already assumes — see the [Engineering Decision Closure Recommendations](../00-governance/decisions/engineering-decision-closure-recommendations.md) §3).

The top-level layout, domain-folder ownership rules, and file/identifier naming are specified at implementation-standard level in [Repository and Folder Standards](../03-standards/engineering-standards/repository-and-folder-standards.md) and [Naming Conventions](../03-standards/engineering-standards/naming-conventions.md) — this Blueprint does not repeat that detail, only its architectural basis: engineering mirrors platform domains (TRD8 §8.4), not screens or teams, and the monorepo exists specifically to let frontend and Functions share one set of TypeScript types for every command, event, and domain model (OTD-002's "strong type and contract reuse" rationale).

## 3. Domain Architecture

### 3.1 The 15-Domain Model

Per the [Canonical Reference](../00-governance/canonical-reference.md) §5–§6 (TRD23 §23.7–23.8), the platform has 15 domains, each with exclusive ownership of its data:

| Domain | Owns (Canonical Reference §6) |
|---|---|
| Identity | Users, customers, businesses, branches, memberships, consent identity |
| Commerce Knowledge | Industries, categories, business types, standard products/services, tags, translations |
| Rules | Rule definitions, versions, assignments, effective-rule resolution |
| Reward Programs | Reward Program identity, versions, commercial configuration, shared-number policy, state |
| Purchase | Purchase Records, disputes, corrections, purchase timeline |
| Loyalty | Verified Units, Loyalty Cycles, progress, reward eligibility |
| Reward | Reward entitlement, redemption, On Us Moments |
| Trust | Trust Events, audit records, operational reviews |
| Notification | Notification intent, templates, message state |
| Reporting | Metric definitions, projections, exports, freshness |
| Search | Search projections, indexing, discovery, search analytics |
| Subscription | Plans, entitlements, subscriptions, invoices, billing obligations |
| Integration | Provider adapters, webhooks, external requests, delivery responses |
| Administration | Platform governance, support cases, feature flags, administrator access — workflows/interfaces only, **never** authoritative identity, subscription, or commercial records |
| Intelligence (future) | Future models, recommendations, analytical intelligence — not built for MVP |

**Mapping to this task's example domain list** ("Identity, Business, Commerce Knowledge, Reward Program, Purchase, Loyalty, Rewards, Reporting, Administration"): "Business" is not a separate domain — business/branch/membership records are owned by **Identity** (table above); the other eight names map one-to-one onto the confirmed 15-domain model. This Blueprint documents the actual, approved 15-domain model rather than narrowing it to the example list, per the instruction to use documentation where it already provides a clear answer.

### 3.2 Domain Boundary Rule (TRD8 §8.6)

Firestore is organized around domains, not screens. Every domain owns its collections; no collection has multiple owners; cross-domain access happens through services or events, never direct cross-domain reads/writes. This is the architectural rule [Repository and Folder Standards](../03-standards/engineering-standards/repository-and-folder-standards.md) §4 and [TypeScript Conventions](../03-standards/engineering-standards/typescript-conventions.md) §5 enforce at the code level.

### 3.3 Standard Document Metadata (TRD10 §10.5)

Every authoritative Firestore document carries the following base metadata (TRD10 §10.5's `BaseDocument` shape):

- `id: string`
- `schemaVersion: number` — the document's schema/structural version (TRD10 §10.2, DAP-009 "Version Every Evolving Contract"), not a generic revision counter.
- `status: string`
- `createdAt: Timestamp` — server-generated only; client-supplied timestamps are prohibited (TRD10 §10.2, DAP-008 "Server Time Is Authoritative").
- `createdBy: string | null` — the identity or trusted system process responsible for creation. Always present as a field; `null` is permitted for system-initiated writes with no human actor.
- `updatedAt: Timestamp` — server-generated only; same prohibition on client-supplied timestamps (DAP-008).
- `updatedBy: string | null` — same actor-attribution rule as `createdBy`.

Where applicable, scoped documents (TRD10 §10.5's `ScopedDocument` shape) additionally carry:

- `businessId?: string`
- `customerId?: string`
- `countryCode?: string`
- `currencyCode?: string`
- `timezone?: string`
- `archivedAt?: Timestamp | null` — archival, not deletion (TRD10 §10.2, DAP-010 "Archive, Do Not Erase": data required for trust, audit, dispute resolution or reporting is retained through archival states rather than silently deleted). This naming matches PRD2 §7's own "Archived" customer-account-status value. Present but `null` while active; set once the document is archived. Never used to represent hard/permanent deletion.
- `archivedBy?: string | null`

`languageCode` is **not** part of this shared base/scoped metadata shape — TRD10 §10.5 does not include it there. It remains a genuine, mandatory field (PRD2 §6, "Preferred language") on the specific collections that require it (e.g. `users`, `customerProfiles` — TRD10 §10.6.1–§10.6.2), not a universal document-metadata field.

No permitted exceptions to this shape are established by any current governing document; a future exception would require its own governance record.

**Correction note (`RES-005.2a`, 2026-07-31):** this section previously transcribed TRD8 §8.7's shape (`version`, non-nullable `createdBy`/`updatedBy`, `deletedAt`/`deletedBy`, `languageCode`, no `currencyCode`/`timezone`) rather than TRD10 §10.5's — a genuine conflict this Blueprint's own §0 rule resolves in TRD10's favor. `ENG-P2-000A` (2026-07-29) §5 first identified this four-part discrepancy; this correction applies it. See the [BaseMetadata Contract Analysis](../05-implementation/reports/RES-005.2a-basemetadata-contract-analysis-2026-07-31.md) for the full analysis. **Disclosed, not corrected here:** TRD8 §8.7 itself still states the old shape and has not been updated to match TRD10 §10.5 — a distinct TRD-chapter-consistency question outside this task's authorization, which is limited to correcting this Blueprint. **This documentation correction alone does not achieve BaseMetadata conformance** — `functions/src/shared/metadata/baseMetadata.ts` still implements the old (Blueprint/TRD8) shape; a separate, not-yet-performed code-conformance task (`RES-005.2b`) is required before any Phase 2 work package may rely on this contract being implemented.

Exact collection names and schemas beyond this shared metadata shape are Pass 2 Engineering Standards detail, gated on DEC-TECH-005 (region) and the outbox/idempotency schema decisions' deferred implementation layer.

### 3.4 Cloud Functions per Domain (TRD8 §8.5)

Each domain's Cloud Functions fall into four categories: **Callable** (authenticated client actions — e.g. Create Reward Program, Record Purchase, Verify Purchase, Redeem Reward), **Event** (react to Firestore/domain events — e.g. Purchase Verified → Create Verified Units → Check Reward Eligibility → Generate Reward → Notify Customer), **Scheduled** (e.g. reminder processing, subscription renewals, outstanding-verification reminders, birthday campaigns, knowledge maintenance), and **Administrative** (platform maintenance, migration, reporting, bulk processing, knowledge imports). Functions validate requests, enforce business rules, publish events, update only their own domain's data, write Trust Events, and return deterministic results; they never contain UI logic, never duplicate validation unnecessarily, never update another domain directly, and never bypass Rules Studio (TRD8 §8.5).

## 4. Cross-Cutting Services

These are used by every domain rather than owned by any one domain — the Phase 1 (ENG-P1) "shared platform foundation" (TRD22 §22.11).

### 4.1 Authentication (TRD8 §8.9; TRD12 §12.3–12.6)

Firebase Authentication is the sole identity provider. Primary methods: mobile number (OTP), email (optional); future methods (Google, Apple, Microsoft, enterprise identity providers) are explicitly out of MVP scope. Authentication proves *identity only* — it never determines what an authenticated user may do (that is Authorization, §4.2). The customer-specific OTP fallback question is **DEC-SEC-001**, still open (see the [Engineering Decision Closure Recommendations](../00-governance/decisions/engineering-decision-closure-recommendations.md)).

### 4.2 Authorization (TRD12 §12.7–12.16)

Governed by the Identity Domain and Role-Based Access Control (TRD8 §8.9). Custom claims stay coarse-grained by design (TRD12 §12.9); fine-grained permission resolution happens server-side (TRD12 §12.11 Permission Resolution, §12.12 Permission Evaluation Contract) — never trust a client-side role check alone. Customer, business-user, owner-only, and platform-administrator authorization each have their own rule set (TRD12 §12.13–12.16). The inheritance-vs-explicit-grant reconciliation question is **DEC-ID-003**, a Founder-owned decision this Engineering Transition programme does not resolve.

### 4.3 Security Layering (TRD8 §8.10; TRD12 §12.17–12.26)

Six independent layers, none relied on alone: Firebase Authentication → App Check → Firestore Security Rules → Cloud Function validation → Role-Based Access Control → Trust Ledger auditing. Firestore Security Rules follow a deny-by-default philosophy (TRD12 §12.17–12.18; TRD22 §22.11 lists "Security Rules deny-by-default foundation" as a Phase 1 deliverable). Direct authoritative client writes are not permitted except where TRD12 §12.18 explicitly allows a narrow, defined exception.

### 4.4 Logging (TRD20 §20.23–20.26; TRD11 §11.36)

One structured log shape (`OperationalLog`), one shared logger, one correlation ID per workflow, threaded through every log entry and event a workflow produces — see [Logging Conventions](../03-standards/engineering-standards/logging-conventions.md) for the code-level standard. Sensitive values (passwords, OTPs, tokens, payment credentials) are never logged.

### 4.5 Notifications (TRD8 §8.5 Scheduled Functions; Notification Domain ownership §3.1)

Owned by the Notification Domain: notification intent, templates, message state. Notification *dispatch* (email/SMS/push providers) is an Integration Domain responsibility (§4.8) invoked by the Notification Domain, not performed by it directly — this is the domain-boundary rule (§3.2) applied to notifications specifically. Provider selection is **DEC-PROV-005** (error monitoring — separate) and the notification-provider OTD-008, both outside this Engineering Transition programme's D1 scope.

### 4.6 Configuration (TRD20 §20.7–20.8; TRD8 §8.2 Remote Config)

Configuration is classified (TRD20 §20.8) and validated at build/deploy time; missing required production configuration blocks deployment (TRD20 §20.7). Firebase Remote Config is the runtime configuration and feature-flag mechanism (TRD8 §8.2); TRD22 §22.11 lists a "feature-flag abstraction" as a Phase 1 deliverable so domain code never calls Remote Config directly.

### 4.7 Audit (Trust Ledger) (TRD8 §8.8; TRD12 §12.38–12.39)

Every important event carries an Event ID, timestamp, originating domain, and initiating actor, and is written to the Trust Ledger (TRD8 §8.8) — this is distinct from, and never conflated with, operational security logs (TRD12 §12.39 "Trust Events Versus Security Logs"). Privileged and commercial operations generate audit or Trust records (TRD11 §11.37).

### 4.8 Integration / Provider Adapters (TRD9, whole chapter; esp. §9.3–9.6, §9.10–9.13)

All external provider calls (payment, SMS, email, future gift/wallet) go through the Integration Domain's adapter architecture (TRD9 §9.5) behind standard integration interfaces (§9.6), never called directly from another domain. Integration owns idempotency (§9.10), retry policy (§9.11), dead-letter handling (§9.12), and a documented integration status model (§9.13) for every external dependency.

### 4.9 Monitoring (TRD20 §20.22, §20.27–20.36)

Observability architecture, technical metrics, business workflow metrics, service-level indicators/objectives, health checks, dashboards, and alerting are TRD20's domain in full; this Blueprint does not restate that content, only notes that "monitoring initialization" is an explicit Phase 1 deliverable (TRD22 §22.11) and the specific provider is **DEC-PROV-005** (open).

## 5. Data Flow (High-Level Request Flow Only)

### 5.1 Client-Initiated Command (the common case)

```
Client (authenticated)
  → Firebase Client SDK: call Cloud Function
    → App Check verification
    → Firebase Authentication verification
    → Cloud Function: validate request (shared validation)
    → Cloud Function: resolve role/permission (Authorization, §4.2)
    → Cloud Function: enforce business rules (domain service)
    → Firestore transaction: update owned domain data + write outbox event (TRD11 §11.17)
    → Write Trust Event (§4.7)
    → Return standard PlatformErrorResponse or success result (shared error contract)
  ← Client receives deterministic result
(async) Background processor reads outbox → publishes/processes event → downstream domains react (Event Functions, §3.4) → notifications, reporting projections, search projections updated
```

This is the shape TRD22 §22.11's Phase 1 exit criterion describes directly: *"a shared server command can authenticate, validate, log and return a standard response... an outbox event can be written and processed idempotently."*

### 5.2 Direct Firestore Read (the other common case)

Per TRD16 §16.10 (Direct Firestore Reads) and TRD8 §8.10's Security Rules layer: read-only, non-sensitive data may be read directly by the client, gated entirely by Firestore Security Rules (deny-by-default, TRD12 §12.17) — no Cloud Function round-trip is required for a read that doesn't need business-rule evaluation. Writes are never performed this way (§4.3).

### 5.3 Event-Driven Downstream Processing (the Purchase → Reward example, TRD8 §8.8)

```
Purchase Recorded → Purchase Verified → Verified Units Created → Reward Available → Reward Redeemed → On Us Moment Completed
```

Each arrow is an event, not a direct function call between domains — this is what makes the domain-boundary rule (§3.2) hold even for a workflow that spans six domains (Purchase, Loyalty, Reward, Notification, Reporting, Trust).

### 5.4 Offline Flow (TRD8 §8.11; TRD16 §16.23–16.32)

Businesses may record Purchase Records locally while offline; these remain marked "Pending Sync" until synchronized. Customers may browse previously synchronized data offline, but purchase verification and reward redemption always require successful synchronization — trust-critical actions are never resolved purely offline. Synchronization preserves event order, prevents duplicate submissions, and maintains idempotency (TRD8 §8.11) — the same idempotency mechanism used for online commands (§4.4/DEC-TECH-007), not a separate offline-only mechanism.

## 6. Deployment Architecture

### 6.1 Environments (TRD20 §20.4–20.5 — already approved, reproduced for reference)

```
Local → Development → Staging → Production
```

- **Local** — individual development, Firebase Emulator Suite (TRD22 §22.10 Phase 0 deliverable).
- **Development** — shared engineering integration and early testing.
- **Staging** — release candidates, user acceptance testing, provider sandboxes, production-like validation.
- **Production** — live businesses and customers; never used for general testing.

Each environment is a **fully separate Firebase/Google Cloud project** (TRD20 §20.5) — separate Authentication users, Firestore database, Storage bucket, Functions, Hosting, App Check config, Remote Config, Analytics, Cloud Messaging config, secrets, service accounts, logs, and billing monitoring. Environment separation never depends on naming alone inside a shared project.

### 6.2 Mapping to This Task's Example Wording

The task brief's example environment list ("Development, Testing, Staging, Production") does not exactly match TRD20's approved four ("Local, Development, Staging, Production"); this Blueprint uses TRD20's actual, approved list rather than the example, per the instruction to use documentation where it already provides a clear answer. "Testing" is not a separate environment in the approved architecture — automated testing runs locally against the Firebase Emulator Suite (§6.1 Local) and in CI (§6.3), not against a dedicated shared "Testing" project.

### 6.3 CI/CD (TRD20 §20.9–20.21; TRD22 §22.10)

Source control, branching and change control, continuous integration, continuous delivery, deployment permissions, service accounts, infrastructure-as-code, deployment artifacts, staged deployment, backward compatibility, database migration deployment, and rollback readiness are all already specified in TRD20 §20.9–20.21. The Phase 0 deliverable list (TRD22 §22.10) — CI pipeline, pull-request template, change report template — is the first concrete instantiation of this architecture; the [Git Workflow](../06-engineering-governance/git-workflow.md) and [Deployment Workflow](../06-engineering-governance/deployment-workflow.md) documents (Phase 6) are the operational scripts that run inside it.

### 6.4 Region — Open

Which Firebase/GCP region hosts every environment is **DEC-TECH-005**, still open (evaluation not yet performed; also depends on the still-open DEC-LEGAL-006 cross-border hosting position). This Blueprint deliberately does not name a region.

## 7. What This Blueprint Does Not Do

- It does not select a frontend tooling set (DEC-TECH-003) or a Firebase region (DEC-TECH-005) — both remain open.
- It does not define Firestore collection/field schemas beyond the shared metadata shape (§3.3) — that is Pass 2 Engineering Standards.
- It does not change any product requirement, business rule, or Constitution principle — it is a consolidation of already-approved technical architecture, not a new architectural proposal.
- It does not authorize any implementation work package to begin.

## 8. Relationship to Other Governance Documents

- TRD Chapters 8, 9, 10, 11, 12, 16, 20 — the authoritative sources this Blueprint consolidates; govern in any conflict.
- [Canonical Reference](../00-governance/canonical-reference.md) — the domain-ownership model this Blueprint's §3.1 is drawn from verbatim.
- [Engineering Standards](../03-standards/engineering-standards/README.md) — the file/code-level standards that implement this Blueprint's architecture.
- [Engineering Decision Closure Recommendations](../00-governance/decisions/engineering-decision-closure-recommendations.md) — the basis for every "CONFIRMED"/"open" statement about DEC-TECH-* above.
- [Engineering Implementation Programme](../05-implementation/change-tracking/engineering-implementation-programme.md) — where each work package cites the specific Blueprint section it implements.
