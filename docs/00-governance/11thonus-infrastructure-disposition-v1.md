> **Title:** 11thONUS Infrastructure Disposition — Version 1.0
> **Version:** 1.0 · **Status:** Founder-accepted controlled disposition · **Classification:** Governing (governance record — infrastructure disposition, MTAIP-001 §12)
> **Governing document:** Miledge Technology Architecture & Infrastructure Policy (MTAIP-001 v1.0, effective 2026-08-28); operates within the existing hierarchy established by [Platform Constitution Part VII](platform-constitution.md) (DEC-GOV-001) — this document does not amend that hierarchy
> **Source-of-truth path:** `docs/00-governance/11thonus-infrastructure-disposition-v1.md`
> **Last controlled update:** 2026-08-28 (created — MTAIP-001 11thONUS Alignment Closure)
> **Preceding governance chain:** [MTAIP-001 Product Alignment Assessment](../05-implementation/reports/mtaip-001-product-alignment-assessment-11thonus-2026-08-28.md) → Founder review and disposition → this document

# 11thONUS Infrastructure Disposition — Version 1.0

## 1. Purpose and Status

This document is the controlled 11thONUS Infrastructure Disposition required by MTAIP-001 §12. It records the Founder's accepted disposition on the basis of the [MTAIP-001 Product Alignment Assessment](../05-implementation/reports/mtaip-001-product-alignment-assessment-11thonus-2026-08-28.md) (the evidentiary basis for every finding below). It is deliberately concise and decision-oriented; it does not repeat the full assessment, which remains the supporting evidence record.

No infrastructure, application, dependency, or configuration change accompanies this document. This is a governance-closure record only.

## 2. Classification

**F — Firebase-native.**

This is a **descriptive infrastructure classification, not a maturity ranking.** It states what infrastructure the product currently uses and why, not how advanced or complete the product is.

No secondary classification is recorded for domains not yet implemented (loyalty, commerce, rewards, etc.) — see §12 (Unresolved Future Infrastructure Characteristics). Those domains do not create a second, competing product classification.

## 3. Authoritative Data Responsibilities

For material business data actually implemented today:

| Data | Authoritative location |
|---|---|
| Customer/account identity | `users` collection (Firestore) |
| Provider↔business identity mapping | `authenticationReferences` collection — the repository's exact term for provider-to-business identity linkage |
| Recovery proofs | `recoveryProofReferences` collection |
| Loyalty numbering/customer profile | `loyaltyNumbers`, `customerProfiles` collections |
| QR identity | `qrIdentityRecords` collection |
| Businesses, branches, staff, invitations | `businesses`, `businessBranches`, `businessMemberships`, `businessCodeReservations`, `businessMembershipInvitations` collections |
| Terms acceptance / platform config | `businessTermsAcceptances`, `platformConfig` collections |
| Commerce taxonomy | `knowledgeNodes`, `knowledgeTags`, `knowledgeTranslations` collections |
| Fraud/trust | `trustRecords` collection |

**Derived/event representation (not a competing authority):** `outboxEntries` — the domain-event log, also read back as the source for identity audit history. This is a deliberate derived/read-model pattern, not a second authority for any of the data above.

**Future domains not yet implemented — no authority exists to record:** purchases/verified commerce, rewards, redemptions, approvals, subscriptions, notifications, reporting/derived analytics. No collection, type, or authority is invented here for these; they are addressed in §12.

No material business data category currently has more than one uncontrolled authoritative representation.

## 4. Authentication and Internal Identity

- **Authentication provider:** Firebase Authentication (Google, Email/Password, optional Phone OTP).
- **Provider identity:** the Firebase Auth UID.
- **Internal business identity:** a separate, internally generated `CustomerIdentityId` — permanent, immutable, never publicly exposed.
- **Provider-to-business mapping:** the `authenticationReferences` collection, keyed `{referenceType}:{referenceId}`, implementing the requirement that one Firebase Authentication UID maps to one active platform user.
- **Historical business records are not keyed directly to the Firebase UID.** Business data keys on `CustomerIdentityId`; the mapping to the provider UID is isolated in `authenticationReferences`.

**Architectural significance:** authentication-provider identity and durable business identity are deliberately separated. This is the single most consequential portability-relevant design choice already present in the codebase — it means a future provider change would mean re-pointing the mapping collection, not rewriting business records.

## 5. Frontend Hosting

React 19 + Vite 8 + TypeScript on Firebase Hosting, serving the built SPA with an SPA rewrite and a CSP scoped to the Firebase Auth and Cloud Functions endpoints in use. No automated deployment pipeline exists (`firebase deploy` is not part of CI; deployment is manual/local today). This reflects the evidence directly — it is not extrapolated beyond it.

## 6. API / Application Compute

All application compute is Cloud Functions, region `europe-west1` (per `DEC-TECH-005`, §9 below), organized as one health-check HTTP endpoint and 18 callable (`onCall`) functions covering authentication, business onboarding/lifecycle, and staff-invitation management. **All client data access is mediated through this callable boundary** — the frontend performs no direct Firestore reads or writes; every interaction is a Cloud Functions callable round trip.

## 7. Background Processing

No deployed scheduled or triggered background processing exists today. The current status of the outbox mechanism is:

- **Architecturally valid** — a domain-event pattern (write-side outbox, transactional claim, exponential backoff, dead-lettering) independent of any Firebase-specific delivery mechanism.
- **Implemented and tested to the extent established by the accepted assessment** — the writer and processor both exist and are covered by emulator tests.
- **Not yet connected to a live production processing trigger.** No `onSchedule`, Pub/Sub, or equivalent wiring exists.

This is not an MTAIP-001 non-conformity. Live-trigger wiring is retained as a future engineering capability, to be picked up by whichever future work package first requires production event processing — not implemented by this disposition.

## 8. File / Object Storage

Firebase Storage is **scaffolded but unimplemented**: the client SDK is wired and `storage.rules` exists as a deny-by-default placeholder, but no upload/download code path exists anywhere in the product today, and no asset (logo, PDF, export, receipt, media) is currently stored through it. This is distinct from an unused capability merely mentioned in an old document — it is present in the live codebase, simply not yet exercised.

## 9. Realtime / Event Architecture

- **Domain/event concept:** the outbox entry — a provider-neutral representation of "something happened" (e.g. `CustomerAuthenticated`, `AuthenticationRecoveryProofProvided`), independent of how it is eventually delivered.
- **Firebase-specific delivery mechanism:** none is currently in production use for this purpose — no Firestore triggers, no Pub/Sub, no Cloud Tasks are wired. (Firestore itself is the persistence substrate for the outbox collection, which is a data-storage fact, not a delivery-mechanism coupling.)
- **Live-trigger status:** not connected (§7). No implementation is authorized by this document.
- The frontend has zero direct Firestore access (no `onSnapshot`, no `.collection()` calls) — all realtime/event exposure to the client, if any is ever needed, would go through the callable boundary, not a client-side listener.

## 10. External Integrations

- **Implemented:** Firebase (Auth, Firestore, Functions, Hosting); Sentry (`@sentry/react`), behind a dedicated provider-abstraction layer with a no-op fallback.
- **Authorised/planned, not yet integrated:** monitoring, notification, billing, and backup providers are named as candidates in open decision records (`DEC-PROV-001`, `DEC-PROV-002`, `DEC-PROV-005`, `DEC-PROV-006`) but none beyond Sentry is selected or wired.
- **Unresolved/future:** email, SMS/WhatsApp, payment/mobile-money, product analytics — no code, no selected provider, no roadmap commitment elevated to current architecture by this document.

## 11. Backup and Recovery

**Status: unresolved operational requirement / controlled follow-on item.**

- `DEC-TECH-010` (backup method and restore procedure) and `DEC-PROV-006` (backup service) remain **open** in the Decision Register, in their current controlled state. This disposition does not close either.
- No backup implementation exists today for Firestore, Storage, configuration, or secrets.
- **Backup and recovery must be resolved before meaningful production business data accumulates.** This is not a blocker to MTAIP-001 alignment closure — it is a bounded follow-on architecture/engineering item, explicitly tracked here so it is not lost.
- No implementation solution is specified by this document, because none is currently governed by an existing controlled decision.

## 12. Unresolved Future Infrastructure Characteristics

Loyalty, commerce, rewards, and other future capabilities not yet implemented may introduce workload characteristics (read/write volume shape, notification fan-out, reporting query patterns, event-processing latency requirements) that current implementation does not yet represent. These are recorded as **unresolved future infrastructure characteristics within an F-classified product** — they do not create a secondary `E` classification, and no infrastructure is preselected for them here. See §14 for the triggers that would prompt revisiting any specific component.

## 13. Expected Cost Behaviour

Meaningful cost drivers, as established by the accepted assessment:

- **Firestore operations** — currently low-risk: no direct client-side reads/writes and no realtime listeners exist, so read/write volume is bounded by callable-function invocation rather than client-side listener fan-out. One unpaginated full-collection-scan pattern was found, but only in a seed-loader **test file** for a reference dataset, not a production query path.
- **Function execution** — 18 callables plus one health check; no scheduled/background compute currently runs.
- **Bandwidth, storage, logging/monitoring** — no material driver identified; Storage is unused, logging/monitoring is limited to Sentry today.
- **Backups** — not yet a cost driver, since no backup mechanism is implemented (§11).
- **External managed services** — Sentry only; no other paid managed service is integrated.

No premature or speculative cost modelling is performed here; this is a summary of the drivers the assessment actually found.

## 14. Material Provider Dependencies

| Dependency | Classification | Note |
|---|---|---|
| Firestore | Intentional | Domain-repository abstraction already in place backend-side |
| Firebase Authentication | Intentional | Identity-mapping layer isolates provider UID (§4) |
| Cloud Functions (callable compute) | Intentional | Uniform compute model, no stray triggers |
| Firebase Hosting | Inherited but reasonable | No deployment pipeline built against it yet |
| Firebase Storage | Unresolved | Scaffolded, unused — too early to classify by usage |
| Sentry | Intentional | Explicit provider-abstraction layer already built |

**No accidental dependency was found.** Provider specificity itself is not treated as a defect; the classifications above distinguish intentional architecture choices from unresolved or inherited positions, per MTAIP-001's own framing.

## 15. Portability Risk

11thONUS is **not provider-neutral**, and this document makes no claim that it is. Practical consequences of the current Firebase-native implementation:

- Replacing Firestore would require re-implementing Firestore-idiomatic transaction/query logic in the repository layer, not merely swapping a driver.
- Replacing Cloud Functions would require re-implementing the callable-function contract (context/auth injection) that the backend currently relies on.
- Replacing Firebase Authentication carries comparatively low risk to business data specifically, because of the identity-isolation boundary in §4 — but the auth-flow/UI code itself is Firebase-Auth-SDK-specific and would need rework.

**Existing architectural protections** that already limit unnecessary leakage, without this document creating any new abstraction:

- The identity-isolation boundary (§4) — provider identity is not embedded throughout business data.
- The backend/data-access boundary — no client-side Firestore access anywhere in the frontend; all access is mediated through callables (§6, §9).
- The domain-repository layering backend-side, keeping Firestore calls out of command/service logic.
- The Sentry provider-abstraction layer, already anticipating provider replacement.

No portability abstraction is created or recommended by this document.

## 16. Rationale for Retaining Firebase

Firebase remains appropriate based on the accepted assessment, and is retained on that basis:

- The architecture is already **intentionally** Firebase-native — not accidentally coupled to it.
- The existing boundaries described in §15 already prevent unnecessary leakage of provider identity and data access into inappropriate layers (frontend components, for instance, have no direct Firestore coupling to unwind).
- **No demonstrated product, architectural, commercial, cost, scale, security, regulatory, reliability, or provider-risk requirement currently justifies migration.**
- Migrating for theoretical portability alone would add cost and engineering complexity without demonstrated product value, and is not authorized by this document or by any decision it records.

Firebase is retained because it remains appropriate to the established 11thONUS architecture and requirements — **not because Firebase is mandated by Miledge.** MTAIP-001 does not mandate any particular technology stack; infrastructure selection here is justified by the product architecture, consistent with MTAIP-001's own governing sequence (§17).

## 17. MTAIP-001 Conformity

**No material MTAIP-001 infrastructure non-conformity identified.**

11thONUS's Firebase-native architecture is compatible with MTAIP-001 because infrastructure selection remains justified by the product architecture rather than by a portfolio mandate. The decision-governance evidence (region selection gated on legal/data-residency analysis before infrastructure was provisioned — see §9 below) shows the required sequence (product requirements → domain architecture → data requirements → workload characteristics → security/reliability → infrastructure selection) was actually followed for the parts of the product that exist.

## 18. Reconsideration Triggers

The following are **review triggers, not automatic migration triggers.** Reaching a trigger requires architecture reassessment before any infrastructure change — none of these triggers authorizes implementation on its own:

1. Sustained Firebase cost becoming commercially disproportionate.
2. Firestore access patterns becoming unsuitable for required workloads.
3. Reliability requirements exceeding the chosen Firebase design.
4. Backup/recovery requirements exceeding the chosen Firebase design.
5. Regulatory or data-residency requirements becoming incompatible.
6. A future product capability demonstrating a material technical need for another infrastructure component.

Practical near-term checkpoints consistent with these triggers: the first production business or customer record created (backup/recovery, trigger 4); the first domain event requiring external delivery (outbox live-trigger wiring); the first feature requiring file upload (Storage); the first loyalty/commerce domain reaching implementation (workload-characteristics evidence, trigger 2).

## 19. DEC-TECH-005 Traceability Note

`DEC-TECH-005` (Firebase region) is recorded `CONFIRMED` in the [Decision Register](decisions/decision-register.md) as of this disposition's date — a traceability correction reconciling the register with the already-committed, Founder-signed [Version 1.0 Engineering Authorization Record](version-1-engineering-authorization-record.md) (2026-07-19), not a new or reopened decision. See the [Alignment Closure Report](../05-implementation/reports/mtaip-001-alignment-closure-report-2026-08-28.md) §3 for the full verification trail. `DEC-LEGAL-006` carries an identical, unaddressed register-sync gap and remains outside this disposition's authorization.

## 20. Relationship to Other Governance Documents

This disposition does not amend the Platform Constitution, the Decision Register (beyond the single `DEC-TECH-005` traceability correction recorded in it and cross-referenced in §19), `MILEDGE-PLATFORM-ARCHITECTURE.md`, or any Verified Loyalty governance record. It sits alongside the [MTAIP-001 Product Alignment Assessment](../05-implementation/reports/mtaip-001-product-alignment-assessment-11thonus-2026-08-28.md) as the closing decision record for the assessment that document performed — the assessment remains the evidence; this document is the disposition.

## 21. Amendment

Any future change to the classification in §2, or to a disposition recorded in §3–§18, must go through a governed reassessment triggered by §18 — not through an undocumented edit to this document or to any product/engineering document that assumes a particular infrastructure position.
