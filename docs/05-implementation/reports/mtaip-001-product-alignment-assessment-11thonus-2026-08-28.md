# MTAIP-001 Product Alignment Report — 11thONUS

> **Status:** **Founder-accepted evidence record**, per the MTAIP-001 11thONUS Alignment Closure (2026-08-28) — see the [correction note](#founder-acceptance-and-classification-correction-2026-08-28) immediately below. Superseded as the controlled classification source by the [11thONUS Infrastructure Disposition v1.0](../../00-governance/11thonus-infrastructure-disposition-v1.md); this assessment remains the evidentiary basis for that disposition and is otherwise preserved unchanged.
> **Task type:** Governance/alignment assessment under Miledge Technology Architecture & Infrastructure Policy (MTAIP-001 v1.0, effective 2026-08-28).
> **Scope boundary:** No application source code, dependencies, configuration, or infrastructure was modified in the production of this report. Only this assessment document was created.
> **Prepared:** 2026-08-28

### Founder acceptance and classification correction (2026-08-28)

The Founder has reviewed this assessment and accepted its principal finding: the existing Firebase-native architecture remains appropriate for 11thONUS; no migration or infrastructure restructuring is required. **One correction to this document's own framing was directed and is recorded here rather than by silently rewriting §18/§19 below:** the controlled 11thONUS infrastructure classification is **F — Firebase-native**, full stop. The domains not yet implemented (loyalty, commerce, rewards, etc.) are **not** a secondary "E — Infrastructure undecided / experimental" classification for the product — they are **unresolved future infrastructure characteristics within an F-classified product** (see the [Infrastructure Disposition](../../00-governance/11thonus-infrastructure-disposition-v1.md) §12). Wherever §18–§19 below present "E" as if it were an alternative controlled classification for part of the product, read it as superseded by this correction; the original text is left in place below as the unmodified evidence record the Founder reviewed, per the closure task's instruction to make the smallest correction necessary rather than rewrite the assessment. The controlled disposition itself — including backup/recovery, outbox live-trigger status, and the `DEC-TECH-005` traceability correction — is recorded in the [Infrastructure Disposition](../../00-governance/11thonus-infrastructure-disposition-v1.md), not here.

---

## 1. Entry Repository State

- Current branch: `docs/eng-p3-002-ui-governance-chain-sync`, HEAD `99f840f` ("Merge origin/main into docs/eng-p3-002-ui-governance-chain-sync").
- `origin/main` HEAD: `cf6867b` ("Merge pull request #194 from Fkenogo/docs/eng-p3-002-ui-imp-f-review-closure-sync"). The local branch's merge of `origin/main` predates this — HEAD is one merge behind `origin/main`.
- Upstream tracking: the branch reports `Your branch is based on 'origin/docs/eng-p3-002-ui-governance-chain-sync', but the upstream is gone.`
- Worktree: no staged/modified tracked files. Untracked files present (pre-existing, not created by this task): `WORKING_WITH_THE_FOUNDER/`, several `docs/00-governance/`, `docs/01-product/`, `docs/05-implementation/reports/`, `docs/06-engineering-governance/`, `docs/30-go-to-market/` files, and `docs/07-product-design.zip`. These were not touched and are not part of this assessment's evidence base beyond what was read.
- No `.lock` files, no `MERGE_HEAD`/`REBASE_HEAD` found — no interrupted git operation.
- **Note for Founder attention:** the branch is one merge behind `origin/main` and has lost its upstream. This is a repository-hygiene observation, not an infrastructure finding, and is out of scope for remediation under this task's boundary.

## 2. Authorities Inspected

**Portfolio/architecture authority:**
- `MILEDGE-PLATFORM-ARCHITECTURE.md` (repo root, v0.2, "Founder Approved") — declares 11thONUS's architecture authority subordinate to an external canonical repository (`miledge-ventures.git`), classifies 11thONUS as a "Core Infrastructure Venture," and states it is the first active Customer Recognition Industry Implementation and the primary development venue for the reusable Customer Recognition Shared Platform core.
- No file in the repository contains the literal string "MTAIP" — MTAIP-001 is an external portfolio policy this assessment is applying to the repository, not a document already resident here.

**Decision governance:**
- `docs/00-governance/decisions/decision-register.md` — master decision log (statuses OPEN_FOUNDER / OPEN_ENGINEERING / OPEN_PROVIDER / OPEN_LEGAL / CONFIRMED / SUPERSEDED). Functions as this repository's ADR-equivalent index.
- `docs/00-governance/decisions/dec-tech-005-firebase-region-decision-brief.md`, `DEC-TECH-005-Cloud-Region-Evaluation-Evidence-Pack.md`, `DEC-LEGAL-006-Cross-Border-Hosting-and-Data-Residency-Evidence-Pack.md`, `dec-tech-003-engineering-stack-recommendation.md` — infrastructure-relevant decision briefs/evidence packs.
- `docs/06-engineering-governance/cloud-environment-and-deployment-strategy.md`, `engineering-governance-charter.md`, `engineering-principles.md`, `roles-and-responsibilities.md`, `engineering-implementation-records-standard.md`.
- `records/history-index.md` — Engineering History Index (non-authoritative navigation aid over Engineering Implementation Records).
- `docs/05-implementation/reports/` — chain of phase/sprint closure and governance-audit reports, including the 2026-07-18/19 Verified Loyalty v1.0 governance-freeze chain (`verified-loyalty-v1-governance-audit`, `-correction-pass-report`, `-independent-freeze-audit`, `-governance-freeze-finalization-report`) and `engineering-dependency-reassessment-2026-07-18.md`.
- `WORKING_WITH_THE_FOUNDER/` (7 files) — process/operating doctrine (working profile, documentation method, AI/technical-lead standard, repository standard, decisions/approvals/handovers, project lifecycle). Distinct from and complementary to `MILEDGE-PLATFORM-ARCHITECTURE.md`; not itself an architecture authority.

**Historical product intent:**
- `docs/01-product/11thONUS Product Manifesto.md` — reviewed for infrastructure commitments; contains no explicit vendor/infrastructure commitment, only abstract product-experience language (e.g., "without complex infrastructure"). The historical Firebase-based intent referenced in the task instructions traces, in this repository, to `dec-tech-003-engineering-stack-recommendation.md` and the DEC-TECH-005/DEC-LEGAL-006 evidence packs, not to the Manifesto itself.

**AUTH programme (session memory, cross-checked against code in §5):** AUTH-04 through AUTH-09, AUTH-CORR-003 — multi-provider authentication (Google, Email/Password, optional Phone), merged to `main`, confirmed present in `functions/src/domains/authentication` and `apps/web/src/authentication`.

## 3. Infrastructure Classification

**Classification: F — Firebase-native.**

Evidence:
- `firebase.json` declares Firestore, Cloud Functions, Hosting, Storage, and the full Emulator Suite.
- `.firebaserc`: `dev` → `eleventh-on-us-dev`, `staging` → `eleventh-on-us-staging` (live provisioned projects; no prod alias yet).
- `functions/package.json`: `firebase-admin ^13.6.0`, `firebase-functions ^7.0.0`. `apps/web/package.json`: `firebase ^12.16.0`. Root: `firebase-tools ^15.24.0`.
- No non-Firebase datastore SDK (AWS, non-Firebase GCP, Supabase, direct Postgres) exists in application code. `pg`/`pglite`-family packages appear only as transitive dependencies inside `firebase-tools`' own emulator tooling in `pnpm-lock.yaml` — not application-level infrastructure.
- A `VITE_BACKEND_PROVIDER` env var exists with value `"firebase"`, but no code branches on it — this is a reserved name, not an implemented portability abstraction (inference, flagged as such).

This is a clean, single-provider classification with no hybrid signal.

## 4. Authoritative Data Responsibilities

Domain terminology and collections, from `functions/src/domains/*/repositories/*.ts`:

| Category | Collection(s) | Evidence |
|---|---|---|
| Customer/account identity | `users` | `identity/repositories/customerIdentityRepository.ts:36` |
| Provider↔business identity linkage | `authenticationReferences` | `identity/repositories/authenticationReferenceRepository.ts:76` |
| Recovery | `recoveryProofReferences` | `identity/repositories/identityLifecycleRepository.ts:152` |
| Loyalty numbering/profile | `loyaltyNumbers`, `customerProfiles` | `loyaltyNumber/repositories/loyaltyNumberRepository.ts:40-41` |
| QR identity | `qrIdentityRecords` | `qrIdentity/repositories/qrIdentityRepository.ts:53` |
| Businesses/branches/staff | `businesses`, `businessBranches`, `businessMemberships`, `businessCodeReservations`, `businessMembershipInvitations` | `business/repositories/businessRepository.ts:68-71`; `permissions/repositories/businessMembershipInvitationRepository.ts:38` |
| Terms/admin config | `businessTermsAcceptances`, `platformConfig` | `business/repositories/businessTermsAcceptanceRepository.ts:25`, `businessTermsConfigRepository.ts:57` |
| Commerce taxonomy | `knowledgeNodes`, `knowledgeTags`, `knowledgeTranslations` | `commerceKnowledge/repositories/*.ts` |
| Fraud/trust | `trustRecords` | `trust/repositories/trustRecordRepository.ts:48` |
| Audit history | none dedicated — derived from `outboxEntries` | `identityAudit/repositories/identityAuditQueryRepository.ts:38` |
| Reliability plumbing | `outboxEntries`, `idempotencyRecords` | `shared/outbox/outboxWriter.ts:30`; `shared/idempotency/idempotencyService.ts:42` |

**Confirmed absent (no collection, no type, no code):** purchases/verified commerce records, rewards, redemptions, subscriptions, notifications, files/assets metadata, reporting/derived data. `functions/src/index.ts` states directly: *"No product-domain Cloud Functions exist yet — domain functions are introduced starting Phase 2."*

**No competing/uncontrolled authorities found.** Each category above has exactly one collection of record; no duplicate representations were found. The `outboxEntries` collection intentionally serves a dual role (event bus + audit-history source) — this is a deliberate derived/read-model pattern, not a competing authority, and should be named as such if formalized in an ADR (see §17).

**Assessment against §4 requirement:** the current repository is a pre-product-domain foundation (identity, business onboarding, trust scaffolding). Most of the categories MTAIP-001 asks this assessment to inspect (loyalty cycles, purchases, rewards, redemptions, approvals, subscriptions, notifications, reporting) do not yet exist to have an infrastructure position — this is a **confirmed fact**, not a gap in this assessment.

## 5. Authentication and Identity

- **Provider:** Firebase Authentication. Frontend: `apps/web/src/authentication/` (`authenticateClient.ts`, `authenticateCallable.ts`, `RequireAuthenticatedUser.tsx`, `googleSignInFlow.ts`, `emailPasswordSignInFlow.ts`, `phoneSignInFlow.ts`, `signOutFlow.ts`). Backend verification: `functions/src/domains/authentication/services/firebaseTokenVerifier.ts`.
- **Provider identity:** Firebase Auth UID (`decoded.uid`).
- **Internal business identity:** a separate, internally generated `CustomerIdentityId` (`identity/models/customerIdentityId.ts`), documented as "permanent, immutable, never-publicly-exposed."
- **Identity-resolution / mapping strategy:** a dedicated mapping collection, `authenticationReferences/{referenceType}:{referenceId}`, links `firebaseUid → CustomerIdentityId`, implementing requirement TRD12 AIR-001 ("one Firebase Authentication UID shall map to one active platform user").
- **Historical dependency on Firebase UID directly:** **not found.** Business records key on `CustomerIdentityId`, not on the raw Firebase UID — there is a deliberate indirection layer.
- **Theoretical provider replaceability:** because the mapping is isolated in `authenticationReferences` rather than embedded as a foreign key throughout business data, provider identity is architecturally replaceable without rewriting historical business facts — the mapping collection would be re-populated/re-pointed, not the underlying business records. This is a **confirmed structural property**, not yet a proven migration (no migration has been performed to test it).
- **Coupling classification:** intentional. The separation exists specifically because of TRD12 AIR-001, not as an accident of Firebase SDK usage.
- Multi-provider support (Google + Email/Password + optional Phone OTP) is implemented per `functions/src/index.ts` and matches the AUTH-CORR-003 programme referenced in prior session memory.
- No custom-claims logic or Firebase Auth triggers (`beforeUserCreated`, auth `onCreate`) were found.

**This task did not redesign authentication,** per the task's explicit instruction; the above is descriptive only.

## 6. Frontend Hosting

- Framework: React 19 + Vite 8 + TypeScript, Tailwind 4 (`apps/web/package.json`).
- Hosting: `firebase.json` `hosting` section serves `apps/web/dist` with SPA rewrite to `index.html`; CSP is scoped specifically to `identitytoolkit.googleapis.com`, `securetoken.googleapis.com`, and the `europe-west1` Cloud Functions endpoint for the dev project.
- PWA: configured via `vite-plugin-pwa` in `apps/web/vite.config.ts` (app name "11thONUS", standalone display).
- Deployment mechanism: **not automated.** `.github/workflows/ci.yml` runs build/lint/test/emulator-validate only ("requires zero secrets" by design); no `firebase deploy` step exists anywhere in the repository. Three specialized preview build modes exist (`test-harness`, `sign-in-preview`, `founder-qa-preview`) for manual/local preview use.
- **Determination:** hosting on Firebase Hosting is intentional (explicit `firebase.json` configuration with production-relevant CSP), but the deploy pipeline itself is unresolved/not yet built — this is a gap in delivery tooling, not in the hosting-platform decision.

## 7. API / Application Compute

- All Cloud Functions are defined in `functions/src/index.ts`, region `europe-west1` (fixed in code — `functions/src/config/region.ts:10`, referencing DEC-TECH-005; see the register-status discrepancy noted in §17).
- **HTTP (`onRequest`):** `ping` only — a health check with no business logic.
- **Callable (`onCall`), 18 total, all business logic:** `authenticate`, `linkAuthenticationProvider`, `unlinkAuthenticationProvider`, `recoverAuthenticatedIdentity`, `createBusiness`, `updateBusinessProfile`, `updateBusinessBranchProfile`, `submitBusinessForVerification`, `closeBusiness`, `getOwnedBusinesses`, `getBusinessContext`, `listBusinessCategories`, `listBusinessTypesForCategory`, `createStaffInvitation`, `revokeStaffInvitation`, `listStaffInvitations`, `listStaffMemberships`, `acceptBusinessTerms`.
- **Firestore triggers, auth triggers, or scheduled functions:** **none exist.** Confirmed by an explicit code comment in `functions/src/domains/trust/services/trustEventHandler.ts:19-27` stating no `onSchedule`/pub-sub wiring exists anywhere yet.
- **Determination:** business behaviour is executed exclusively through callable functions — a deliberate, uniform compute model, not scattered or Firebase-compute-coupled beyond the callable/`onCall` contract itself (which is intrinsic to choosing Firebase Functions at all, not an incidental extra coupling).

## 8. Background Processing

- No deployed scheduled or triggered background processing exists.
- `functions/src/shared/outbox/outboxProcessor.ts` implements a complete consumer (`processOutboxEntries()`: transactional claim, exponential backoff — `MAX_RETRIES=5`, `INITIAL_BACKOFF_MS=1000`, ×2 multiplier — dead-lettering) but **it is not wired to any deployed trigger.** It is exercised only in emulator tests today.
- No reward-lifecycle, notification-delivery, or approval-workflow processing exists in code, consistent with §4's finding that those domains have no data model yet.
- The only implemented workflow/state-machine logic is business lifecycle (`business/services/businessLifecycleCommand.ts`) and staff-invitation accept/revoke, both executed synchronously inside callables.
- **This is a confirmed operational gap worth Founder attention** (§21/§22), but it is a completeness gap in an unfinished build, not an MTAIP-001 architecture non-conformity — the outbox pattern itself is domain-event-shaped and provider-agnostic in design (see §10).

## 9. File / Object Storage

- `storage.rules` is a deny-by-default placeholder (`allow read, write: if false;`) with a comment marking domain-specific rules as future (Phase 1+) work.
- The client SDK is wired (`apps/web/src/infrastructure/firebase/storage.ts` calls `getStorage(app)`), but **no actual upload/download usage exists anywhere** in `apps/web/src` or `functions/src`.
- A `logoUrl` string field exists on the Business profile type (`apps/web/src/business/api/businessProfile.ts:19`), but nothing implements the upload path.
- **Determination:** Firebase Storage is scaffolded (SDK wired, rules placeholder present) but unimplemented — not "planned only in an old document," but also not yet in active use for logos, PDFs, exports, receipts, or media. No competing storage provider exists.

## 10. Realtime and Event Architecture

- **No `onSnapshot` (Firestore realtime listener) calls exist anywhere in `apps/web/src`.** Combined with the finding below, the frontend performs zero direct Firestore access.
- **No `.collection()` calls exist in `apps/web/src`** — Firestore SDK is imported only in `apps/web/src/infrastructure/firebase/firestore.ts` and its `index.ts`; every read/write from the client goes through a Cloud Functions callable (`apps/web/src/infrastructure/firebase/functions.ts`).
- **No Firestore triggers or auth triggers exist** in `functions/src` (§7/§8).
- **Domain-event pattern confirmed:** an outbox is written to synchronously inside callables — e.g. `emitCustomerAuthenticated` from the `authenticate` callable, `emitAuthenticationRecoveryProofProvided` from `recoverAuthenticatedIdentity` (`functions/src/shared/outbox/outboxWriter.ts`). This is a **domain/application event pattern**, deliberately decoupled from any Firebase-specific event-delivery mechanism (it does not rely on Firestore triggers, Pub/Sub, or Cloud Tasks) — a genuinely provider-neutral design choice already present in the codebase.
- **Material gap:** the outbox is written-to but has no live consumer wired to a deployed trigger (§8) — the event architecture is designed provider-neutral but not yet operationally complete.
- **Distinction requested by the task is already substantially achieved in the codebase:** domain events (outbox entries) are modeled as data, independent of the delivery mechanism that will eventually drain them — whatever that mechanism turns out to be (Cloud Scheduler-invoked callable, Cloud Tasks, or otherwise) does not require rewriting the event-producing code.

## 11. External Integrations

**Implemented:**
- Firebase/GCP (Auth, Firestore, Functions, Hosting, Storage-scaffolded) — see above.
- **Sentry** (`@sentry/react`) — implemented with a genuine provider-abstraction layer: `apps/web/src/observability/sentryProvider.ts`, `config.ts`, `providerSelection.ts`, `noopProvider.ts`, plus PII `sanitize.ts`/`sanitizeException.ts` (with tests). This is a deliberately provider-agnostic observability boundary, not a raw SDK call scattered through the app.

**Not implemented (checked directly in code — no imports/usage found):** email (SendGrid/Mailgun/Resend/Nodemailer), SMS/WhatsApp (Twilio-style), payment or mobile-money providers, product analytics (Segment/Mixpanel/Amplitude/GA), crash reporting beyond Sentry (no Crashlytics), monitoring beyond what Sentry provides.

**Authorised/planned but not yet integrated (per decision register):** DEC-PROV-001/002/005/006 name candidate providers (monitoring, notifications, billing, backup) but none are selected or integrated.

**Speculative roadmap items:** none elevated into this section — none were found presented as current architecture anywhere in code.

## 12. Backup and Recovery

| Item | Status |
|---|---|
| Firestore/business data backup | **Unresolved.** `DEC-TECH-010` ("backup method and restore procedure") and `DEC-PROV-006` ("backup service," Status: OPEN_PROVIDER) are open in the decision register; `docs/02-technical/trd/10-firestore-data-architecture.md` §10.33 specifies requirements but no method is selected. |
| Authentication mappings | Not separately addressed; would inherit whatever Firestore backup solution is eventually selected, since `authenticationReferences` lives in Firestore. Unresolved. |
| Firebase Storage / object data | Unresolved — no storage backup config exists, consistent with Storage itself being unimplemented (§9). |
| Configuration | No backup/versioning mechanism found beyond the repository's own git history for code-level config (e.g., `firebase.json`, `firestore.rules`). Unresolved as a distinct concern. |
| Secrets/configuration recovery | Not addressed in the repository; no secret-management/rotation documentation found. Unresolved. |
| Application deployments | No deployment history/rollback mechanism exists (no CD pipeline at all — §6). Unresolved. |

**No backup implementation exists anywhere** (no scheduled export config, no backup scripts, `firebase.json`/`firestore.indexes.json` have no backup provisions). This is **documented as a required launch gate, explicitly not yet implemented, and formally open** — not a silent gap. **This is a genuine, confirmed recovery gap** appropriate for Founder attention, though implementing it is out of scope here.

## 13. Cost Behaviour

- No production traffic exists yet (pre-launch, identity/onboarding-only build) — cost exposure today is minimal by construction.
- **One unpaginated full-collection scan pattern found:** `functions/src/domains/commerceKnowledge/seed/seedLoader.emulator.test.ts` calls `.get()` on `knowledgeNodes`/related collections with no `.limit()`. This is a seed-loader **test file** for a reference/knowledge taxonomy dataset, not a live user-facing query path — low risk today, but worth revisiting if that taxonomy collection grows and any equivalent unpaginated read pattern is later copied into production code.
- **No `collectionGroup` queries found** anywhere.
- **No realtime listeners exist in production code** (§10) — meaning there is currently no listener-fan-out cost-growth vector at all, which is a structurally favorable position as customer/business counts grow (a common Firestore cost driver that this architecture has avoided by design, deliberately or not — see §14).
- **No dashboard/reporting workloads exist yet** (§4) — cost behaviour for reporting cannot be assessed because reporting doesn't exist.
- No premature optimisation is recommended. The main actionable cost-behaviour observation is structural, not a bug: because every client read/write is a callable-function round trip (§10), read/write volume is bounded by function invocation, not by client-side listener fan-out — a favorable pattern to preserve deliberately as the domains in §4 get built out (see §21 safeguards).

## 14. Provider Dependencies and Portability Risk

| Dependency | Classification | Migration consequence if replaced |
|---|---|---|
| Firestore (business data) | **Intentional** — chosen as primary datastore with a real domain-repository abstraction layer already in place (§15) | Moderate: repository interfaces exist per domain, but query/transaction semantics (e.g. Firestore transactions in lifecycle commands) are Firestore-idiomatic and would need re-implementation, not just a driver swap |
| Firebase Authentication | **Intentional** — deliberate identity-mapping layer isolates provider UID from business identity (§5) | Low for business data (identity indirection already isolates it); moderate for the auth-flow/UI code itself, which is Firebase-Auth-SDK-specific |
| Cloud Functions (callable compute) | **Intentional** — uniform compute model, no stray triggers | Moderate: callable-function contract (`onCall`, context/auth injection) is Firebase-specific; domain logic itself is reasonably separated into services (§15) |
| Firebase Hosting | **Inherited but reasonable** — no CD pipeline built yet, so this is not yet a deep operational lock-in; still easy to change today | Low — hosting choice has no deployed pipeline dependency yet |
| Firebase Storage | **Unresolved** — scaffolded, unused; too early to classify as intentional vs. accidental since no usage exists to evaluate | N/A — nothing to migrate |
| Sentry | **Intentional** — explicit provider-abstraction layer with a no-op fallback already built (`noopProvider.ts`, `providerSelection.ts`) | Very low — the codebase already anticipates provider replacement here |
| `pg`/`pglite` transitive packages | **Not a dependency of the application** — internal to `firebase-tools`' own emulator tooling | None |

**No accidental dependencies were found.** The clearest positive finding of this assessment is that the two places most prone to accidental provider coupling — client-side Firestore access and observability — both already have deliberate abstraction boundaries (§10, §15, §11). The compute and auth layers carry ordinary, expected first-party SDK coupling, not incidental leakage.

## 15. Domain / Infrastructure Coupling

- **Backend (`functions/src`):** clean domain-repository layering — dedicated `repositories/` directories per domain (`identity`, `business`, `permissions`, `trust`, `qrIdentity`, `loyaltyNumber`, `commerceKnowledge`, `identityAudit`). Firestore access is not scattered ad hoc through service/command code.
- **Frontend (`apps/web/src`):** Firestore SDK is imported in exactly two files (`infrastructure/firebase/firestore.ts` and its `index.ts`); **no `.tsx` component imports `firebase/firestore` directly** (confirmed by import-path scan). Components consume data through the callable-function layer, not inline Firestore calls.
- **Security rules:** `storage.rules` is a deny-all placeholder; Firestore rules were not separately audited in this pass (out of the two research agents' scope) — flagged as **not verified** in this assessment rather than asserted either way.
- **Determination:** the boundaries that would create the most practical value if missing (testability, correctness, future provider replacement) are already present for both Firestore access and observability. No coupling issue was found that would justify introducing new abstraction as part of this task — and this task does not authorise doing so regardless.

## 16. Unresolved Architecture Decisions

These decisions should deliberately remain open at this stage — not because of oversight, but because the product hasn't reached the point where committing would be informed:

1. **Backup/recovery method (`DEC-TECH-010`, `DEC-PROV-006`).**
   - *Why premature now:* Firestore holds no material customer/business volume yet (§4) — there is nothing costly to lose today, and backup-tooling choice (Firestore scheduled export vs. third-party) benefits from being made once real data-growth shape is known.
   - *Missing evidence:* production data volume/velocity once loyalty/commerce domains exist.
   - *Trigger to revisit:* first production business or customer record created, or Phase 14 (per the decision register's own "required by Phase 14" note) — whichever comes first.

2. **Monitoring/notification/billing providers (`DEC-PROV-001/002/005/006`).**
   - *Why premature now:* no notification-triggering domain events exist yet (rewards, redemptions, approvals — §4/§8) — selecting a provider before knowing message volume/type would be speculative.
   - *Missing evidence:* which domain events actually need external delivery, and expected volume.
   - *Trigger to revisit:* when the first domain (e.g. reward/redemption) reaches implementation and needs to emit an external notification.

3. **Outbox consumer wiring mechanism (Cloud Scheduler-invoked callable vs. Cloud Tasks vs. other).**
   - *Why premature now:* only two event types are emitted today (auth-related); the right consumer cadence/latency requirement isn't yet known.
   - *Missing evidence:* SLA requirements for event processing once reward/notification domains exist.
   - *Trigger to revisit:* first domain event that requires a downstream side-effect beyond audit-trail reading.

4. **Firebase Storage usage pattern (whether/how it's used for logos, exports, receipts).**
   - *Why premature now:* no business-facing feature currently needs file upload; the `logoUrl` field is unused.
   - *Missing evidence:* which specific asset types the product will need first.
   - *Trigger to revisit:* first UI feature requiring file/image upload.

This assessment does not recommend forcing any of these to a decision now.

## 17. ADR Assessment

- Existing decision-register entries (`DEC-TECH-003`, `DEC-TECH-005`, `DEC-LEGAL-006`) already adequately govern the infrastructure decisions made to date (stack selection, region, cross-border hosting) — **no new ADR is needed for those.**
- **Governance-traceability gap found, not an architecture non-conformity:** `decision-register.md` line 894 still records `DEC-TECH-005` (Firebase region) as **Status: OPEN_ENGINEERING**, while `functions/src/config/region.ts` already fixes `europe-west1` in code, and `.firebaserc` shows the `dev`/`staging` Firebase projects already provisioned — matching what `docs/05-implementation/reports/ENG-P1-001-closure-report-2026-07-22.md` (referenced by the research pass) describes as complete. **Recommendation: the decision register's status field for DEC-TECH-005 should be reconciled to match the implemented state** (amend the existing register entry — no new ADR required). This is a housekeeping/traceability correction, not a new architecture decision, and this task does not make that edit itself since it falls outside the assessment's own scope of "governance/alignment documentation necessary to produce the assessment."
- No other material infrastructure decision found in the codebase lacks governance coverage.

## 18. MTAIP-001 Conformity Assessment

**A. Current confirmed architecture:** Firebase-native (Auth, Firestore, Cloud Functions callables, Hosting; Storage scaffolded/unused). Identity-mapping layer isolates provider UID from business identity. Domain events modeled provider-neutrally via an outbox pattern. No direct client-side Firestore access; all client reads/writes go through callables.

**B. Existing intentional provider dependencies:** Firestore as datastore, Firebase Auth with isolation layer, Cloud Functions callable compute model, Sentry observability (with its own abstraction).

**C. Inherited but acceptable dependencies:** Firebase Hosting (no deployment pipeline built against it yet, so switching cost is currently low, but the CSP/config already assume it).

**D. Accidental dependencies:** none found.

**E. Unresolved infrastructure decisions:** backup/recovery method, monitoring/notification/billing providers, outbox-consumer wiring mechanism, Storage usage pattern (§16).

**F. Actual MTAIP-001 non-conformities:**

No material MTAIP-001 infrastructure non-conformity identified.

The product-requirements → domain architecture → data requirements → workload characteristics → security/reliability → infrastructure-selection sequence that MTAIP-001 mandates is, on the evidence in this repository, what actually happened for the parts of the product that exist: the decision register's own Phase-1/DEC-TECH-005/DEC-LEGAL-006 chain shows region selection was gated on legal/data-residency analysis before infrastructure was provisioned, not the reverse. Infrastructure has not been shown to be dictating product shape here — the opposite pattern (domains left unimplemented until their infrastructure needs are known, §16) is what the evidence shows.

**G. Recommendations:** see §21.

## 19. Infrastructure Disposition

**Insufficient maturity for a controlled Infrastructure Disposition under MTAIP-001 §12 at this time.**

**Classification: E — Infrastructure undecided / experimental**, specifically for the domains that don't exist yet (loyalty cycles, commerce, rewards, redemptions, subscriptions, notifications, reporting) — **not** for the identity/business-onboarding foundation already built, which is a settled, evidenced **F — Firebase-native** position (§3).

**Evidence required before a full-product infrastructure commitment:**
- At least one product domain beyond identity/business-onboarding implemented (loyalty cycle or verified-commerce, per the Verified Loyalty v1.0 freeze) to evidence real Firestore access-pattern and cost behaviour (§13).
- A resolved backup/recovery method (§12, §16).
- A resolved notification/monitoring provider position, once a domain actually needs to emit notifications (§16).
- A deployed, wired outbox consumer, evidencing the actual latency/throughput profile of the event architecture (§8, §10).

**No existing equivalent controlled document was found that already covers this ground** — `MILEDGE-PLATFORM-ARCHITECTURE.md` addresses portfolio classification, not an infrastructure disposition for 11thONUS specifically; the decision register covers individual decisions, not a consolidated disposition. If Founder review concludes a disposition should exist now regardless, it should be drafted as a new document rather than shoehorned into either.

This assessment does not approve any disposition; Founder review is the next gate, per the task's stop condition.

## 20. Answer to the Firebase-Retention Question

**Does the evidence show any material reason for 11thONUS to move away from its existing Firebase architecture at this stage?**

**No.** No architectural, product, data, cost, scale, reliability, security, regulatory, capability, commercial, or provider-risk reason for change was found in this assessment. The evidence instead shows:
- A deliberate identity-isolation layer already protecting business data from raw provider-identity coupling (§5).
- A deliberately provider-neutral domain-event pattern already in place (§10).
- No direct client-side Firestore coupling anywhere in the frontend (§10, §15).
- No accidental provider dependencies (§14).
- No cost-risk pattern in current code beyond one low-risk test-file query (§13).
- The product itself has not yet reached the domains (loyalty, commerce, rewards) where infrastructure characteristics would even be tested at scale (§4) — there is no evidence base from which a migration case could be built today.

**Recommended safeguards while retaining Firebase** (descriptive only — implementing any of these requires separate Founder authorisation, per §21 of the task instructions):
- **Cost behaviour:** before implementing the loyalty/commerce domains, define pagination and read-budget conventions for the query patterns those domains will introduce, given they will be the first to generate real read/write volume.
- **Data authority:** as loyalty/commerce/reward collections are introduced, keep the one-collection-per-authority pattern already used elsewhere (§4) rather than letting the outbox's dual role (event bus + audit source) quietly expand into a third undocumented use.
- **Provider-identity isolation:** preserve the `authenticationReferences` indirection pattern (§5) as the model for any future provider-identity touchpoint (e.g. if a payment or mobile-money provider introduces its own identity concept).
- **Backup/recovery:** resolve `DEC-TECH-010`/`DEC-PROV-006` before the first production business or customer record is created, not after (§12, §16).
- **Business-logic boundaries:** preserve the existing repository-layer pattern in `functions/src/domains/*/repositories` as new domains are added, rather than allowing Firestore calls to leak into command/service code.
- **Observability:** extend the existing Sentry provider-abstraction pattern to any new monitoring/notification provider selected under DEC-PROV-001/002/005, rather than wiring a new SDK directly into business logic.
- **Future scale thresholds:** the trigger points in §16 (first production record, first domain event needing external delivery, first file-upload feature) are the natural checkpoints at which today's "undecided" classification (§19) should be revisited — not calendar time.

## 21. Recommended Safeguards

See §20 (integrated there per the task's own section ordering — MTAIP-001 §20 and §21 content is the same body of safeguards, restated here for the report's required section list): the six safeguards above (cost behaviour, data authority, provider-identity isolation, backup/recovery, business-logic boundaries, observability) plus the future-scale trigger points. None of these are authorised for implementation by this assessment.

## 22. Matters Requiring Founder Decision

1. Whether to approve reconciling `DEC-TECH-005`'s status field in the decision register from OPEN_ENGINEERING to match the already-implemented region/project state (§17) — a housekeeping correction, not a new decision.
2. Whether to formally resolve `DEC-TECH-010`/`DEC-PROV-006` (backup/recovery) now or defer to the trigger point identified in §16/§20.
3. Whether to accept classification **E (infrastructure undecided/experimental)** for the not-yet-built product domains while retaining **F (Firebase-native)** as the confirmed classification for the identity/business-onboarding foundation already built (§19), or direct a different framing.
4. Whether any of the six recommended safeguards (§20/§21) should be authorised as implementation work in a future, separately-scoped task.
5. Whether a standalone Infrastructure Disposition document should be drafted now despite the insufficient-maturity finding in §19, or deferred to the evidence triggers listed there.

## 23. Proposed Next Step

Return this report for Founder review. If the Founder concurs with §18(F) (no material non-conformity) and §20 (no reason to move off Firebase), the proposed next step is: **no infrastructure action** — continue building the loyalty/commerce domains on the existing Firebase-native foundation, and revisit the unresolved items in §16 at their stated triggers. If the Founder wants any of the §22 matters resolved now, each should be scoped as its own follow-up task; this assessment does not resolve them.

---

# Completion Report

1. **Files modified:** None. This report file is newly created; no other file was modified.
2. **Code diff summary:** None — no application source code, configuration, or dependency file was changed.
3. **Commands executed:** `git fetch origin`; `git branch --show-current`; `git log` (status/HEAD/origin checks); `git status`; `find .git` (lock/merge-state check); read-only `grep`/`find`/file-read operations performed by two research subagents across `apps/web/src`, `functions/src`, `docs/`, `records/`, and root-level governance files. No mutating commands were run.
4. **Dependencies added:** None.
5. **Config changes:** None.
6. **Risks:** None introduced by this task. Pre-existing risks identified during the assessment (not introduced here): unresolved backup/recovery (§12), unwired outbox consumer (§8), stale `DEC-TECH-005` register status (§17), branch one merge behind `origin/main` with a gone upstream (§1).
7. **Rollback instructions:** Delete this report file (`docs/05-implementation/reports/mtaip-001-product-alignment-assessment-11thonus-2026-08-28.md`) if the Founder wants it removed; no other rollback is needed since no other file changed.
8. **Markdown implementation/alignment report:** This document is that report.
9. **Changes/history tracking file:** `records/history-index.md` exists but is scoped specifically to Engineering Implementation Records (EIR/PER/VER) for numbered `ENG-Pxx` work packages under the Engineering Implementation Records Standard (§13 of that standard). This assessment is a portfolio-governance alignment task, not an `ENG-Pxx` engineering work package, and does not fit that record type. **No update was made to `records/history-index.md`** — forcing an entry would invent a tracking convention not authorised by that standard. If the Founder wants this assessment indexed somewhere, that indexing convention should be specified by the Founder rather than assumed here.
