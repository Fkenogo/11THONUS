# PLATFORM-BASELINE-007 — Operational Spine Integration Assessment

**Date:** 2026-09-16
**Type:** Read-only technical/operational assessment. No implementation performed. No migrations created. No governance decisions modified. Nothing merged.
**Entry `origin/main` SHA (verified before any work):** `ad7c3a6a30be0a05ab3fee81c0498b575f0246f7` (`Merge pull request #253 from Fkenogo/feat/platform-baseline-006a-purchase-verification-spine`).
**Assessment branch:** `docs/platform-baseline-007-operational-spine-assessment`, created from `origin/main` at the exact entry SHA in a dedicated, isolated git worktree. The primary worktree (`/Volumes/PRODUCTION/Projects/11THONUS`, branch `docs/dec-legal-002-bt-draft-007`, unrelated in-progress legal/commercial drafting work) was never touched, staged, committed, reset, or rebased by this task.

**Method note:** per task instruction, this assessment inspected executable implementation (migrations, domain services, repositories, callables, permission evaluation, Firestore/PostgreSQL integration, UI, tests) before consulting governance documents, and ran the actual test suites where an environment could be stood up locally (Node/pnpm unit suites, a disposable Docker PostgreSQL container, and the Firebase Firestore Emulator). Governing documents (PRD/TRD/decision register/prior implementation reports) were then used only to classify what was found — never as a substitute for reading code.

---

## 0. Codebase areas inspected

Domain services and repositories under `functions/src/domains/{business,permissions,purchase,rewardProgram,commerceKnowledge,identity,loyaltyNumber,qrIdentity,authentication,trust,platformAdministration}`; the permission evaluator (`functions/src/domains/permissions/evaluator/evaluatePermission.ts` and its four catalogues); all Cloud Function callable exports in `functions/src/index.ts` (~2000 lines); PostgreSQL migrations `0001`–`0014` (`functions/src/infrastructure/postgres/migrations/`); Firestore Security Rules (`firestore.rules`); the web application (`apps/web/src/{business,customer,identity,dev}/**`); test fixtures and integration/emulator/Postgres test suites across `functions/src/**/*.{test,emulator.test,postgres.test}.ts`; Playwright specs under `tests/e2e/`; local execution mechanisms (`docker-compose.postgres.yml`, `firebase emulators:*`, `tests/e2e/emulator/seedTestOnlyTermsFixture.mjs`, `tests/e2e/emulator/seedCommerceKnowledge.mjs`); and prior implementation/readiness reports under `docs/05-implementation/reports/` (notably `PLATFORM-BASELINE-001` through `006A` and their correction addenda, and `PLATFORM-BASELINE-004A`). Governance documents consulted afterward: `docs/00-governance/decisions/decision-register.md` (`DEC-LEGAL-002`, `DEC-LOY-008`, `DEC-DATA-008`), `docs/00-governance/documentation-changes-log.md`, and `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md`.

---

## Test execution (actually run during this assessment)

All suites below were executed fresh in the isolated worktree at the exact entry SHA (`ad7c3a6a30be0a05ab3fee81c0498b575f0246f7`), not merely cited from prior reports:

- `pnpm --filter functions test` (unit): **158 files, 1756 tests, all pass.**
- `pnpm --filter web exec vitest run` (unit): **121 files, 852 tests, all pass.**
- `docker compose -f docker-compose.postgres.yml up -d --wait` (disposable local PostgreSQL 16, port 54329) + `firebase emulators:exec --only firestore "PLATFORM_ENV=test pnpm --filter functions test:postgres"`: **6 files, 94 tests, all pass** — this is the suite containing the full `recordPurchase → verifyPurchase → Verified Unit → Cycle → threshold(10) → Reward → Trust Events → Notification Intents → outbox` chain proof.
- `pnpm --filter functions run build` + `firebase emulators:exec --project demo-11thonus "pnpm --filter functions test:emulator"` (full Firestore+Auth+Functions Emulator Suite validation): **65 files, 833 passed, 3 pre-existing skipped, 0 failed** — matches every prior implementation report's own claimed figures exactly, independently reproduced.
- Docker Postgres container torn down (`docker compose down -v`) after use — no persistent local state left behind.

**Not executed:** Playwright/browser e2e (`pnpm test:e2e`) — not run in this pass because no spec exists covering the purchase/reward-program flow (see §11/§14/§16) and the existing dashboard-harness specs were already proven in the cited prior reports; re-running them would not have added evidence toward this assessment's open questions. No environment could not be stood up — Docker and the Firebase Emulator Suite were both available and used.

---

## 1. Primary question — does the assembled spine cohere?

**Yes, as a technical engine, with two confirmed seams that break end-to-end operability in a real (non-emulator) environment, and one UX-level gap that forces manual opaque-ID entry.** The chain Business → activation → configuration → staff access → Reward Program → Customer Identity → Purchase → verification → Verified Unit → Loyalty Cycle → threshold(10) → Reward → Trust Event → Notification Intent is implemented as real, transactionally-safe, tested code for every arrow **except**:

- **Business → Business activation** genuinely requires a configured Business Terms version (`assertCurrentBusinessTermsAccepted`, enforced fail-closed inside the same Firestore transaction as both `draft → pending_verification` and `pending_verification → trial`). `DEC-LEGAL-002` (the governing legal decision for Terms content) remains `OPEN_LEGAL`, and Terms configuration is recorded in the decision register as **NOT CONFIGURED in every real/production/staging environment**. This is a genuine, code-enforced, still-open governance blocker for reaching `trial`/`active` status anywhere except the Firestore Emulator via an explicitly test-only fixture.
- **Reward Program → qualifying nodes/category** requires an operator to type or paste an opaque Firestore `knowledgeNodeId` (and free-text category id) by hand into a plain `TextField` — there is no search/browse picker reusing the Commerce Knowledge endpoints already wired for business classification. This does not block the engine (the value, once known, works correctly) but blocks ordinary Founder/operator usability.
- **Loyalty Cycle reward_available → Redemption** does not exist as a feature (by design, explicitly deferred, not a defect) — a Reward reaching `available` is a durable, correctly-computed terminal state that the platform can reach and prove, but nothing consumes it further.

Every other arrow (workforce invite→accept→purchase.record eligibility; Reward Program create→draft→publish→purchase binding; Customer Identity creation→Loyalty Number/QR issuance→lookup; Purchase record→customer decision surface→verify/reject/dispute; verify→Verified Unit→Cycle→threshold→Reward; Trust Event and Notification Intent creation) is proven by real-service tests (PostgreSQL + Firestore Emulator, not mocks) executed during this assessment, not merely asserted by documentation.

---

## 2. Assembled engine inventory (summary; full matrix in §17)

See §17 for the required Operational Spine Matrix. In narrative: every domain from Business bootstrap through Reward creation has a real Firestore-or-PostgreSQL-authoritative store, a real domain/service implementation, a real `onCall` transport entry point with server-side actor resolution (never a client-supplied user id), and a real authorization path (either the four-catalogue permission evaluator, or an explicit ownership check inside the command transaction for customer-facing purchase decisions). Redemption, notification delivery, and Business-side dispute resolution have no implementation at all (not partial — absent), consistent with their explicit "deferred by design" status in the `PLATFORM-BASELINE-006A` report.

---

## 3. Business entry and activation

**State machine** (`functions/src/domains/business/models/businessStatus.ts`): `draft → pending_verification → trial → active → suspended/expired → closed → archived`.

**Creation.** Callable `createBusiness` (`functions/src/index.ts:686`) → `handleCreateBusiness` (`functions/src/domains/business/services/businessBootstrapEndpointService.ts`). Atomically creates the Business + default Branch + initial Owner membership in one Firestore transaction. `ownerUserId` is server-derived from the verified caller's Customer Identity, never client input. New businesses start at `draft`.

**Terms acceptance is a real, enforced, transaction-safe gate — not documentation.** `assertCurrentBusinessTermsAccepted` (`functions/src/domains/business/services/businessLifecycleCommand.ts:101-125`) reads the platform's current-required-Terms-version doc and the Business owner's acceptance record inside the *same* Firestore transaction as the lifecycle write (TOCTOU-safe), and is invoked from both:
- `submitBusinessForVerificationCommand` (`draft → pending_verification`, Owner-initiated, `businessLifecycleCommand.ts:208-219`), and
- `activateBusinessAfterVerificationCommand` (`pending_verification → trial`, Platform-Administrator-only + genuine MFA evidence, `businessActivationCommand.ts:145-259`, re-validated at line 197).

It fails closed with `businessTermsConfigurationUnavailableError` if no current Terms version is configured at all, and `currentBusinessTermsNotAcceptedError` if the owner has not accepted the current version.

**The platform-wide Terms-version configuration document has no client/callable write path at all.** `businessTermsConfigRepository.ts`'s own doc comment states it is populated "exclusively by direct, server-side/ops action ... or, in tests, by direct emulator seeding." This is a one-time platform-level ops action, not a per-business workaround, and it is exactly the mechanism that is blocked in real environments: **the decision register records `DEC-LEGAL-002` as `OPEN_LEGAL` and Business Terms configuration as `NOT CONFIGURED` in every real/production/staging environment** (`docs/00-governance/decisions/decision-register.md`, `DEC-LEGAL-002` entry, most recent addendum `FD-PREVIEW-TERMS-001`, 2026-09-11). Core Business Terms drafting is in progress in parallel governance work (currently through Part VII on branch `docs/dec-legal-002-bt-draft-007`, as of this assessment's entry point) but is docs-only, not Founder-approved as final content, and not configured into any environment.

**Local/emulator path exists and is genuinely usable.** `tests/e2e/emulator/seedTestOnlyTermsFixture.mjs` is a Founder-authorized (`FD-PREVIEW-TERMS-001`), fail-loud, emulator-only seed script that writes `platformConfig/businessTerms.currentVersion = "TEST_ONLY_FIXTURE_BUSINESS_TERMS_v0"` — refusing to run unless it detects `FIRESTORE_EMULATOR_HOST` is loopback and the project id is exactly `demo-11thonus`. With this one manual, explicitly-disclosed, non-production seed step run once, the entire remaining chain (bootstrap → accept Terms → submit → Platform-Administrator activates → workforce → Reward Program → purchase) is reachable purely through callables/UI with no further manual database mutation. This is proven by `businessOnboardingJourney.emulator.test.ts`.

**Can a Business reach `trial`/`active` through the assembled application?** Locally/emulator: **yes**, after the one-time Terms seed. In any real (non-emulator) environment today: **no** — `submitBusinessForVerification` fails closed for every Business, because the required platform-wide Terms document does not exist there.

**Administrator activation is deliberately outside Business RBAC.** `activateBusinessAfterVerification` requires a genuine `platformAdministrators` record plus verified MFA evidence — no Business Owner/Manager/Staff role can grant it. `trial → active` and `active → suspended/reactivated` have no implemented system-initiated or administrator transition in the code inspected (billing/subscription-driven transitions are explicitly out of scope per code comments).

---

## 4. Business configuration

Branch is created automatically with the Business (exactly one Branch exists in the current implementation; there is no "add location" UI or multi-branch support). Branch profile editing (`LocationsPage.tsx` → `updateBusinessBranchProfile` callable) reads `businessId`/`branchId` from already-loaded context — never a value a user must type.

Commerce Knowledge (business category/type) is genuinely reachable through a real dropdown: `listBusinessCategories`/`listBusinessTypesForCategory` callables, consumed by `ClassificationStep.tsx` during onboarding — no manual ID entry.

**Confirmed opaque-ID gap:** Reward Program **qualifying nodes** and **category** are the one place in the assembled product where a Business Owner must type/paste a raw Firestore document id by hand. `RewardProgramManagementPage.tsx` renders `qualifyingNodeIds` and `rewardProgramCategoryId` as plain comma-separated `TextField`s (create form lines ~211-223, edit form ~367-372), parsed into `{ knowledgeNodeId, businessDisplayName: null }[]` — despite the same Commerce Knowledge browse endpoints already existing and being used elsewhere (business classification). This is a **UX/operability gap, not an engine defect**: publish-time server-side validation against Firestore still catches an invalid/retired node id; the gap is that a human has no in-product way to discover a valid id.

---

## 5. Workforce

Full staff lifecycle is real and wired: invite (`createStaffInvitation`, gated `staff.manage`, Manager may invite Staff only) → self-service accept (`acceptStaffInvitation`, invitation-as-authority, no `staff.manage` gate needed since the invitee has no membership yet; entitlement proven via a verified `AuthenticationReference` matching the invite's delivery target) → active `businessMemberships` doc (written atomically with invitation consumption, `PLATFORM-BASELINE-004A`) → immediately visible to `purchase.record` authorization with **no manual database step**.

Confirmed via direct code inspection that the exact repository (`getBusinessMembershipByUserAndBusiness`) used by the invite/accept/lifecycle path is the same one the permission evaluator (`evaluatePermissionService.ts`) reads for `purchase.record` authorization — this is not a dangling or superseded implementation; it is on `main` at the entry SHA (`git log` confirms `PLATFORM-BASELINE-004A` and its `CORR-001` are both in history).

Role-change/suspend/reactivate/remove are all `staff.manage`/`staff.assignRole`-gated callables with server-derived actors, cross-business and self-escalation denial proven by tests (`staffMembershipIntegration.emulator.test.ts`, `staffRoleChangeCommand.emulator.test.ts`).

**Eligibility gap between domains:** `staff.manage` is eligible from `draft` onward (workforce admin does not require an active Business), but **`purchase.record` itself is restricted to Business statuses `trial`/`active` only** (`purchasePermissionCatalogue.ts`). So a newly-invited Staff member can be invited and can accept while the Business is still in `draft`, but cannot actually record a purchase until the Business reaches `trial` — which routes straight back to the §3 Terms blocker in a real environment.

Staff-count/subscription-entitlement limits (`DEC-SUB-002`) are explicitly not implemented — invitations are currently unbounded by any plan/seat limit.

---

## 6. Reward Program

Real PostgreSQL-authoritative domain (migrations `0001`–`0006`, extended by `0007`+ for purchase binding). Program identity is stable; Version is immutable per-publish, with `row_version` optimistic concurrency and a DB-enforced partial unique index guaranteeing at most one `active` version per program.

Full lifecycle — create → edit draft → publish → create-next-version — is reachable through real callables (`createRewardProgram`, `updateRewardProgramDraft`, `publishRewardProgramVersion`, `createNextRewardProgramVersion`) exposed in the Business dashboard (`RewardProgramManagementPage.tsx`), with no manual PostgreSQL access required for any of it.

**Purchase binding is genuinely transactional, not a decoupled read.** `recordPurchaseCommand.ts:239-254` locks the Reward Program and its current published Version inside the same PostgreSQL transaction as the Purchase insert (`SELECT … FOR UPDATE` style via `lockRewardProgramById`/`lockRewardProgramVersionById`), rejecting non-active programs/versions. The recorded Purchase carries `rewardProgramVersionId` pinned to the locked version, and this is what later governs shared-loyalty-number policy, multiple-units policy, and — at reward time — which Reward Program Version's terms the eventual Reward inherits (see §9). The Business purchase-recording UI itself already filters the program `<select>` to `status === "active" && currentVersionId !== null`, so only publishable programs are ever offered.

The single opaque-ID gap is the qualifying-node/category text entry noted in §4 — the rest of Reward Program management requires no PostgreSQL access and no ID pasting.

---

## 7. Customer Identity

A real Customer Identity is created through the actual `authenticate` callable (not a fixture-only path) → `registerOrSignIn` → `createCustomerIdentity`, immediately followed by `ensureCustomerIdentityArtifacts`, which guarantees exactly one Loyalty Number and one active QR Identity per active Customer Identity (fail-closed on any contradiction/duplicate).

Loyalty Number format: `^[A-HJ-NP-Z]{3}[2-9]{3}$` (ambiguous characters I/O/0/1 excluded), resolved via `lookupCustomerIdentityByLoyaltyNumber`; QR resolved via `lookupCustomerIdentityByQrReference`, both purpose-gated (`merchant_transaction` is an allowed purpose for both). Not-found and inactive are deliberately collapsed into one error to resist enumeration.

**Stale QR is genuinely rejected**, not merely modeled: a regenerated/rotated QR is marked `invalidated` (never deleted/reused), and `getActiveQrIdentityByReference` throws on any non-`active` association — proven by a dedicated real-Postgres/Firestore test.

**Shared-number policy is per-Reward-Program-Version, not global.** `sharedLoyaltyNumberAllowed` is locked from the Purchase's bound Version and enforced at record time; QR presentation is never subject to this gate (only Loyalty Number presentation is).

**Customer scoping is global, not per-Business** — one Customer Identity (`users/{id}`) sees Purchases across every Business it has interacted with; each read model enforces Business-side membership scoping and Customer-side ownership scoping independently, with a dedicated cross-tenant-leakage test proving no Business ever sees another Business's Purchase and a Customer only ever sees their own.

**Purchase decision surface is real:** `apps/web/src/customer/CustomerActivityPage.tsx` (route `/customer/activity`), backed by real callables, not mocks, for verify/reject(reason)/dispute(reason).

**Can a real Customer be created locally through the actual product?** Yes, via `authenticate`. The purchase-domain integration test suite, however, bypasses the callable and seeds identity/Loyalty Number/QR via direct repository calls for test-fixture convenience — this is a test-authoring choice, not evidence that the real callable path doesn't work (it does; it is simply not what that particular 1889-line integration suite chose to exercise for its own setup).

---

## 8. Purchase → customer decision

`recordPurchase` (`functions/src/index.ts:1892`) implements a documented, strict 19-step ordered contract (`recordPurchaseCommand.ts`): server-resolved actor → `purchase.record` authorization (`purchaseAuthorization.ts`, via the same evaluator as every other catalogue) → exactly-one-of-LoyaltyNumber-or-QR artifact parsing → idempotency (peek + in-transaction reserve, keyed by a full commercial-fingerprint hash) → program/version lock and eligibility → shared-number/multiple-units policy → insert `waiting_for_customer` Purchase + lifecycle event + Trust Event + Notification Intent + outbox entry, all in one PostgreSQL transaction.

**Purchase-date behavior:** rejects only future dates (`purchaseDate > Date.now()`); backdating is allowed by design (a "business-asserted commercial calendar date"). The original UTC-anchoring implementation had a genuine timezone defect for positive-UTC-offset businesses (the platform's stated target market, Burundi, UTC+2) that has since been corrected (`PLATFORM-BASELINE-006A-CORR-003`) with dedicated timezone-boundary regression tests.

**Quantity behavior:** integer ≥1 always required; exactly 1 unit forced when the locked Version has `multipleUnitsAllowed=false`; no governed maximum-cap field exists, so "quantity above max" is explicitly not-applicable (disclosed, not invented). A client-side quantity-truncation defect (`parseInt("1.5")→1`) was found and corrected (`CORR-002`).

**Customer decision (`verifyPurchase`/`rejectPurchase`/`raisePurchaseDispute`, `index.ts:1911,1931,1954`):** server-resolved identity actor, row-locked Purchase, ownership check (`customerIdentityId` match) and current-state check (`waiting_for_customer` only) inside the transaction; reject requires one of five closed reasons, dispute one of three; all three transition + append lifecycle event + Trust Event + Notification Intent(s) + outbox entry atomically. `under_review` (post-dispute) has no Business-side exit implemented in this package — a deliberate `006B` boundary, not an oversight.

**Idempotency:** proven not just sequentially but under genuine PostgreSQL-level concurrency — `PLATFORM-BASELINE-006A-CORR-001` added real simultaneous same-key racing tests (`Promise.allSettled` over independently-created promises, real `BEGIN`/`COMMIT`) proving exactly one applied effect regardless of which racer wins.

**A cross-customer React Query cache-isolation defect was found and corrected** (`CORR-002`, P1): Customer B could transiently observe Customer A's cached purchase data after an in-session sign-out/sign-in without reload. Corrected by scoping every customer query key with the signed-in Firebase `uid` (never sent to the server, used only as a client-local cache partition key).

**EN/FR:** both locales carry full `purchase.*` namespaces for both the Business recording form and Customer decision actions/reasons; i18n parity is enforced by an automated test.

---

## 9. Verified Unit → Cycle → Reward

**One atomic transaction, not disconnected steps.** `verifyPurchaseCommand.ts` runs the entire chain — Purchase state transition, Verified Unit credit, Cycle-stream lock, Cycle allocation, threshold check, and (if crossed) Reward creation — inside a single PostgreSQL transaction with a documented lock order (idempotency → purchase → stream → cycle → reward → appends).

- Exactly one Verified Unit credit per verified Purchase, DB-enforced by a partial unique index (`verified_units_one_credit_per_purchase`).
- A per-(business, customer, program) `loyalty_cycle_streams` row, locked `FOR UPDATE`, owns the Cycle sequence counter — no `MAX()+1` race.
- Threshold is a hard-coded constant, `LOYALTY_CYCLE_THRESHOLD = 10` (`loyaltyCycleRepository.ts`), matching the governed `DEC-LOY-001` fixed rule. Allocation fills the current Cycle up to capacity; overflow becomes a separate `pending` allocation row (never a second concurrently-active Cycle) — the governed `DEC-LOY-008` resolution ("immediate allocation, sequential fill, durable ordered pending overflow") this implements.
- At exactly progress = 10, exactly one Reward is created in the same transaction and the Cycle flips to `reward_available` — DB-enforced by a `rewards_one_per_cycle` unique index, not merely application logic.
- **Version binding is FK-enforced, not conventional.** A Reward's `reward_program_version_id` is relationally forced (via composite foreign keys) to equal the Cycle's own `opened_under_version_id` — the version the Cycle was opened under, never the program's current version — proven by a version-bump test asserting a pending-under-V1 Cycle still rewards under V1 terms after V2 publishes.
- Overflow/pending correctness (4 units at progress 8 → 2 allocated + 2 pending, threshold crossed exactly once) and concurrent-verification races (two simultaneous first verifications → exactly one Cycle; two simultaneous verifications at 9/10 → no overfill, exactly one Reward) are proven against real PostgreSQL, not asserted.

**After `reward_available`: nothing consumes it.** `RewardState`/`LoyaltyCycleState` schema-anticipate `redeemed`/`reward_redeemed`/`cancelled`/`expired`, but a full-repository search for any redemption command/callable found none. The migration's own header comment states this outright: rewards are "created exactly once by the threshold transaction; no redemption behavior here." **This is a durable, correct, provably-reachable terminal state — the platform can correctly arrive at and hold a Reward without Redemption existing; it is a deliberately deferred downstream feature, not a spine defect.**

---

## 10. Trust Events / Notification Intents / outbox

**Two separate systems share the name "trust" — do not conflate them.** The Firestore `domains/trust/*` subsystem (authentication/identity risk-gating) is unrelated to purchases; its own test explicitly proves `"purchase_history"` is an "ungoverned future category" it deliberately does not yet support. The **authoritative commercial Trust Event ledger for this assessment's spine is PostgreSQL `trust_events`** (migration `0013`), written insert-only, in the same transaction as every purchase-lifecycle transition, CHECK-constrained to exactly eight governed event types, with two partial unique indexes correctly splitting one-time-lifetime cardinality (issuance/reward events) from repeatable per-source-transition cardinality (`loyalty_cycle.allocated`, so two different Purchases allocating into the same Cycle each correctly emit their own event).

**Notification Intents** (`notification_intents`, migration `0014`) are durable, source-linked, transactionally co-written rows — genuinely created, not merely modeled — for `purchase_recorded_customer`, `purchase_verified_business`, `purchase_rejected_business`, `purchase_disputed_business`, `reward_available_customer`. The status column is CHECK-constrained to a single value, `pending` — there is no other value it could ever hold in this package.

**Delivery is explicitly and completely absent, disclosed as such, not merely unfinished.** No email/push/SMS sending code exists anywhere that consumes `notification_intents`. A generic outbox *processor* exists elsewhere in the codebase (for auth trust signals) but its own comment states it is "not wired to a live scheduled trigger... no `onSchedule`/pub-sub wiring exists anywhere yet" — confirming no live delivery mechanism exists platform-wide, not only for purchases.

**Intent creation vs. delivery — separated correctly.** Because intent rows are created transactionally with the domain effect they describe, the *absence* of delivery does not block the operational spine at all: every downstream state (Verified Unit, Cycle progress, Reward) is computed and durable independent of whether a human is ever notified. Delivery only prevents *external notification*, not correct platform operation.

A true transactional outbox (`purchase_outbox`) is also written in the same transaction as every domain effect — proven, not merely asserted, by the end-to-end test at `purchaseCommands.postgres.test.ts:1548`, which asserts the full 6-Trust-Event / 3-Notification-Intent / 6-outbox-row set fires together at threshold-crossing verification.

---

## 11. End-to-end executable proof

**No single Playwright/browser end-to-end spec exercises the full lifecycle** (confirmed: `tests/e2e/` and `tests/e2e/emulator/` contain specs for app-shell, dashboard/team/terms/profile/locations harnesses, Commerce-Knowledge establishment, and accessibility — none named or grepped for "purchase" or "verify"). This is a genuine, disclosed gap (recorded as a known limitation in the `PLATFORM-BASELINE-006A` report itself, §36: "no seed script added; e2e suite untouched").

**A real, non-mocked, single-flow proof does exist and was independently re-run during this assessment**, not merely cited: `functions/src/domains/purchase/services/purchaseCommands.postgres.test.ts` — a 1889-line integration suite requiring a live PostgreSQL instance *and* the Firebase Firestore Emulator simultaneously, calling the actual domain command functions (not `httpsCallable`, but the same functions the callables invoke) — chains `createRewardProgram → publishRewardProgramVersion → createNextRewardProgramVersion → recordPurchase → verifyPurchase/rejectPurchase/raisePurchaseDispute`, plus loyalty-cycle allocation, trust-event cardinality, and reward issuance, in one file, with the specific `describe` block at line 1548 ("verify writes the full Trust trio + intents + outbox at threshold") proving `recordPurchase(qty=10) → verifyPurchase → Verified Unit → Cycle → threshold(10) → Reward → all 6 Trust Events → all 3 Notification Intents → all 6 outbox rows` as a single, real, database-verified flow.

**This assessment re-ran that suite (and the full PostgreSQL integration suite, the full functions unit suite, and the full web unit suite) against a fresh isolated worktree at the exact entry SHA — see §Test execution below — and confirms it passes.**

**LONGEST PROVEN OPERATIONAL JOURNEY (this assessment's own synthesis, combining the emulator-proven Business/workforce chain with the Postgres-proven purchase chain — no single existing test spans literally every step, but every step is independently proven and the join points are code-verified, not assumed):**

Business bootstrap (draft) → Owner accepts Business Terms (emulator-fixture version) → Owner submits for verification (`pending_verification`) → Platform Administrator activates (`trial`) → Owner invites Staff → Staff accepts invitation (active membership) → Owner creates a Reward Program, drafts qualifying nodes, publishes a Version → Staff records a Purchase against that Version (Customer presents Loyalty Number or QR) → Purchase enters `waiting_for_customer` → Customer sees it on the Activity page → Customer verifies → Verified Unit credited → Loyalty Cycle allocated → (repeated to 10 units) → Cycle crosses threshold → exactly one Reward created at `available` → Trust Events, Notification Intents, and outbox entries recorded for every step along the way.

**Where it stops:** at Reward `available`. No further command exists to redeem it, and no Business-side resolution exists for a disputed (`under_review`) Purchase. Both are documented, deliberate `006B`/future-package deferrals — not silent failures.

---

## 12. Local Founder operability

**Reachable through the UI, with one manual step:** Business creation/profile/branch, Terms acceptance, submission for verification, workforce invite/accept/lifecycle, Reward Program create/draft/publish (except qualifying-node/category ID entry), purchase recording, and the full Customer verify/reject/dispute/rewards-list surface are all real UI flows against the Firebase Emulator Suite, confirmed by the `PLATFORM-BASELINE-004A` and `006A` reports' own local-Founder-preview sections and by direct code inspection during this assessment.

**Requires one manual, disclosed, non-production step:** running `tests/e2e/emulator/seedTestOnlyTermsFixture.mjs` once against a running Firestore Emulator before any Business can leave `draft`. This is an intentional, narrowly-scoped, Founder-authorized fixture (`FD-PREVIEW-TERMS-001`) — not a workaround invented by this assessment, and not something that exists (or could exist, by design) in a real environment.

**Requires a manual/out-of-band step with no in-product remedy:** obtaining the opaque Commerce Knowledge `knowledgeNodeId` for Reward Program qualifying nodes (e.g., from a seed manifest or a direct Firestore lookup) before typing it into the Reward Program form — no Postgres access is ever required, but no in-product picker exists either.

**Requires Platform Administrator + MFA (not Owner-reachable):** the `pending_verification → trial` transition. A Founder testing the flow end-to-end locally needs a seeded/bootstrapped platform-administrator record to complete activation themselves.

**Cannot currently be done through the product at all:** Reward redemption, Business-side dispute resolution, and any real notification delivery — because no such feature exists, not because of a reachability gap.

**Net assessment:** the engine is Founder-operable end-to-end locally, through the real UI/API, with exactly one disclosed manual emulator-only seed step and one Platform-Administrator-role step — not a fixture-only or backend-only capability.

---

## 13. Fixture dependency audit

| Entity | Exists only in test fixtures? | Real product/API path exists? | Engine exists vs. can actually be entered |
|---|---|---|---|
| Business | No | Yes (`createBusiness`) | Both |
| Branch | No | Yes (auto-created with Business; edit via UI) | Both |
| Staff membership | No | Yes (invite → accept) | Both |
| Customer Identity | No | Yes (`authenticate`) — though the purchase-domain Postgres test suite seeds it via direct repository calls for its own convenience | Both (test-authoring choice ≠ product gap) |
| Loyalty Number / QR artifact | No | Yes (auto-issued with identity) | Both |
| Commerce Knowledge node | No | Yes for browsing/selecting business category/type; **no** in-product picker for Reward Program qualifying nodes (must be known out-of-band) | Engine exists; entry for this one use is not practical without direct data access |
| Reward Program | No | Yes (create/draft/publish via UI) | Both |
| Purchase | No | Yes (`recordPurchase`) | Both |
| Verified Unit / Cycle / Reward | No | Yes — fully automatic from `verifyPurchase`, no separate command | Both |
| Business Terms acceptance | No (mechanism is real) | Yes for acceptance itself; the platform-wide Terms **version document** has no write path outside a manual ops/emulator seed | Engine exists; entry blocked in real environments (governance, not engineering) |

No entity in this spine was found to be reachable **only** through test seeding with no corresponding product/API path — the one governance-level exception (platform-wide Terms version) is a deliberate, disclosed, one-time ops action by design, not a hidden fixture dependency.

---

## 14. Open governance / deferred capability review

Classification key: **A** implementation defect · **B** integration gap · **C** operability gap · **D** governance blocker · **E** intentional deferral · **F** UX improvement.

1. Business Terms version not configured in real environments, blocking `submitBusinessForVerification`/activation outside the emulator fixture — **D** (governance blocker; `DEC-LEGAL-002` remains `OPEN_LEGAL`).
2. Reward Program qualifying-node/category entry requires a manually-typed opaque Firestore id — **F** (UX improvement; no picker UI exists, though the underlying data/endpoints do).
3. Reward redemption absent — **E** (intentional deferral, explicitly documented in the `006A` design and report).
4. Business-side resolution of a disputed (`under_review`) Purchase absent — **E** (intentional deferral, explicit `006B` boundary).
5. Notification delivery (email/push/SMS) absent — **E** (intentional deferral; intent/delivery split is a stated architectural decision, not an oversight).
6. No Playwright/browser end-to-end spec spans the full purchase lifecycle — **C** (operability/test-coverage gap; the real transactional proof exists at the integration-test level, just not at the browser level).
7. `unitValueMinor: 0` rejected at the transport layer while the domain layer explicitly permits it — **A** (implementation defect; see §15 — confirmed non-blocking because no shipped caller currently sends the value).
8. Staff-count/subscription seat limits (`DEC-SUB-002`) unimplemented — **E** (intentional deferral; explicitly out of scope, no plan/entitlement architecture exists yet to enforce against).
9. `active → suspended`/administrator-driven post-activation transitions have no implemented mechanism found — **B** (integration gap; code comments in `businessLifecycleCommand.ts` disclose this as out of scope at time of writing, not independently re-verified against the newer `platformAdministration` domain in this pass).

No new Founder decision is invented anywhere in this assessment; every classification above rests on existing, already-recorded authority (the decision register's own `DEC-LEGAL-002`/`DEC-LOY-008` entries, and the `006A` report's own explicit deferred-item list).

---

## 15. `unitValueMinor` deferred item — reconfirmed

**Still present, still non-blocking, classification unchanged.** Domain layer (`recordPurchaseCommand.ts:152-156`) explicitly permits `unitValueMinor >= 0`. Transport layer (`index.ts`'s `parseRecordPurchaseRequest`) reuses the quantity parser (`parsePurchaseQuantity`), which rejects any value `< 1` — so a genuine `unitValueMinor: 0` (a free/complimentary item) is rejected at the API boundary with `invalid-argument` even though the domain was written to allow it. This was flagged during `006A`'s own review (`PLATFORM-BASELINE-006A-CORR-003`, §E8) and explicitly left open as "VALID / NON-BLOCKING / DEFERRED FOLLOW-UP" because **no shipped caller (Business UI or any other) currently sends `unitValueMinor` at all** — it is an optional field with no current producer. This assessment independently re-confirmed, by direct code inspection, that this remains true at the entry SHA: nothing discovered in this assessment's tracing of the purchase/reward-program/workforce/identity chain introduces or requires a new caller of that field. **Disposition unchanged: retained as deferred, non-blocking.**

---

## 16. What should come next — evidence-ranked candidates

This assessment does **not** assume `PLATFORM-BASELINE-007A` or any other specific package name. Ranked by executable evidence, not by document momentum:

1. **Business Terms content finalization and real-environment configuration** (governance work, not engineering). Problem: §3/§14-item-1. Classification: **D** (governance blocker). Operational consequence: no real (non-emulator) Business can ever leave `draft` today — this is the single blocker that turns a fully-proven engine into a non-operational product outside a developer's own machine. Dependency: `DEC-LEGAL-002` resolution (legal content, Founder approval) — no engineering work is required once Terms text exists; the technical write path is a disclosed one-time ops action, already specified. Blocks the operational spine: **yes, entirely, in any real environment.** Recommended timing: **immediate** — this is squarely a legal/governance dependency already in active progress (Business Terms drafting through Part VII as of this assessment), not an engineering task; the engineering side (the fail-closed gate itself) is already correct and should not be weakened.
2. **Reward Program qualifying-node/category picker UI** (small, bounded engineering package). Problem: §4/§6/§14-item-2. Classification: **F** (UX improvement). Consequence: blocks ordinary Founder/operator usability of Reward Program configuration, not the engine itself (a technically correct program is still creatable by someone who knows the id). Dependency: none — the Commerce Knowledge browse endpoints already exist and are already used for business classification; this is reuse, not new architecture. Blocks the operational spine: **no** (it blocks comfortable *use* of an already-working spine). Recommended timing: next, after the Terms blocker, since it is small, self-contained, and directly improves the "Founder can actually run the product" story without touching any transactional/financial logic.
3. **Purchase-lifecycle end-to-end browser test** (test-infrastructure package). Problem: §11/§14-item-6. Classification: **C** (operability/coverage gap). Consequence: the transactional correctness of the spine is proven at the integration-test level (real Postgres + Firestore Emulator) but not at the "a real browser clicking through the real UI" level, which is the assurance most directly relevant to Founder confidence in a demo/pilot. Dependency: a seed script analogous to `seedCommerceKnowledge.mjs`/`seedTestOnlyTermsFixture.mjs`. Blocks the operational spine: **no**. Recommended timing: after item 2, before any pilot-facing demo.
4. **`unitValueMinor: 0` transport-layer fix.** Problem: §15. Classification: **A** (implementation defect, trivially small). Blocks the operational spine: **no** (no current caller triggers it). Recommended timing: opportunistic — bundle into whichever package next touches `parseRecordPurchaseRequest`, rather than a standalone package.
5. **Redemption / Business-side dispute resolution / notification delivery.** Explicitly **E** (intentional deferrals) — not recommended as the *next* package; they are legitimate future work once the above operability items are closed, but nothing in this assessment's evidence elevates them ahead of items 1–3.

---

## 17. Operational spine matrix (required output)

| Capability | Implementation | Authority (store) | API | Authorization | UI | Automated proof | Founder reachable | Status | Blocking issue |
|---|---|---|---|---|---|---|---|---|---|
| Business creation | `businessBootstrapEndpointService.ts` | Firestore | `createBusiness` | Verified credential → Customer Identity | `NewBusinessPage.tsx` | Unit + emulator | Yes | OPERATIONAL | — |
| Business Terms acceptance | `acceptBusinessTermsCommand.ts` | Firestore | `acceptBusinessTerms` | Owner, `authorizeAndExecute` | `TermsStep(Container).tsx` | Emulator | Yes | OPERATIONAL (mechanism) | Content not configured in real environments |
| Business submit-for-verification | `businessLifecycleCommand.ts` | Firestore | `submitBusinessForVerification` | `business.submitForVerification` + Terms gate | Dashboard | Emulator | Emulator only | **BLOCKED_BY_GOVERNANCE** (real env) | `DEC-LEGAL-002` OPEN_LEGAL; Terms NOT CONFIGURED |
| Business activation | `businessActivationCommand.ts` | Firestore | `activateBusinessAfterVerification` | Platform Administrator + MFA, not Business RBAC | none (ops action) | Emulator | Requires admin record | **BLOCKED_BY_GOVERNANCE** (real env) | same as above |
| Branch/profile config | `businessBranchDocument.ts` | Firestore | `updateBusinessBranchProfile` | membership | `LocationsPage.tsx` | Unit + emulator | Yes | OPERATIONAL | — |
| Commerce Knowledge browse | `commerceKnowledgeReadService.ts` | Firestore | `listBusinessCategories`/`listBusinessTypesForCategory` | membership/onboarding | `ClassificationStep.tsx` | Emulator | Yes | OPERATIONAL | — |
| Staff invite/accept/lifecycle | `permissions/service/*.ts` | Firestore | 5+ callables | `staff.manage`/`staff.assignRole` | `TeamManagementPage.tsx` | Unit + emulator | Yes | OPERATIONAL | — |
| Permission evaluation | `evaluatePermission.ts` (4 catalogues) | Firestore (reads) | consumed by all gated callables | pure evaluator + membership read | n/a | Unit + emulator | n/a | OPERATIONAL | — |
| Reward Program create/draft/publish | `rewardProgram/services/*.ts` | PostgreSQL | 6 callables | `rewardProgram.manage` (Owner-only) | `RewardProgramManagementPage.tsx` | Real-Postgres integration | Yes, except node/category picker | OPERATIONAL (engine); **PARTIALLY_INTEGRATED** (UX for qualifying nodes) | Opaque-ID entry for qualifying nodes/category |
| Customer Identity creation + LN/QR issuance | `registrationSignInService.ts`, `customerIdentityArtifactEstablishment.ts` | Firestore | `authenticate` | verified provider credential | sign-in flow | Emulator | Yes | OPERATIONAL | — |
| LN/QR resolution (merchant lookup) | `identityLookupRepository.ts` | Firestore | consumed by `recordPurchase` | purpose allow-list | n/a | Real-Postgres integration | Yes | OPERATIONAL | — |
| Purchase recording | `recordPurchaseCommand.ts` | PostgreSQL (+ Firestore reads) | `recordPurchase` | `purchase.record` (trial/active only) | `PurchaseRecordsPage.tsx` | Real-Postgres integration | Yes | OPERATIONAL | Business must be trial/active (→ Terms blocker) |
| Customer decision (verify/reject/dispute) | `verify/reject/raisePurchaseDisputeCommand.ts` | PostgreSQL | 3 callables | server-resolved identity + ownership | `CustomerActivityPage.tsx` | Real-Postgres integration | Yes | OPERATIONAL | — |
| Verified Unit issuance | `verifiedUnitRepository.ts` | PostgreSQL | inside `verifyPurchase` (no separate command) | n/a (transactional) | n/a | Real-Postgres integration | Yes (automatic) | OPERATIONAL | — |
| Loyalty Cycle allocation/threshold | `loyaltyCycleRepository.ts` | PostgreSQL | inside `verifyPurchase` | n/a (transactional) | n/a | Real-Postgres integration | Yes (automatic) | OPERATIONAL | — |
| Reward issuance | inside `verifyPurchaseCommand.ts` | PostgreSQL | inside `verifyPurchase` | n/a (transactional) | `CustomerRewardsPage.tsx` (list only) | Real-Postgres integration | Yes (automatic) | OPERATIONAL | — |
| Reward redemption | none | none | none | none | none | none | No | **MISSING** (by design) | Not implemented (E: intentional deferral) |
| Trust Events (purchase ledger) | `trustEventRepository.ts` | PostgreSQL | inside every purchase command | n/a (transactional) | none | Real-Postgres integration | Yes (automatic) | OPERATIONAL | — |
| Notification Intents | `purchaseOutboxRepository.ts` | PostgreSQL | inside every purchase command | n/a (transactional) | none | Real-Postgres integration | Yes (automatic, creation only) | **PARTIALLY_INTEGRATED** | No delivery worker exists (E) |
| Outbox | `purchaseOutboxRepository.ts` | PostgreSQL | inside every purchase command | n/a (transactional) | none | Real-Postgres integration | Yes (automatic) | OPERATIONAL | No consumer processes it yet (E) |

---

## 18. Journey trace (required output)

| Step | Starting state | Action | Implementation invoked | Data written/read | Result | Proof | Can continue? | Reason if stopped |
|---|---|---|---|---|---|---|---|---|
| 1 | none | Owner registers/creates Business | `authenticate` → `createBusiness` | Firestore `users`, `businesses`, `businessBranches`, `businessMemberships` (Owner) | Business at `draft` | `businessOnboardingJourney.emulator.test.ts` | Yes | — |
| 2 | `draft` | Owner accepts current Business Terms | `acceptBusinessTerms` | Firestore `businessTermsAcceptances` | Acceptance recorded for current version | Emulator test | Yes, **only if** a current Terms version is configured | In a real environment: no version exists → stop here |
| 3 | `draft`, Terms accepted | Owner submits for verification | `submitBusinessForVerification` | Firestore `businesses.status` | `pending_verification` | Emulator test | Yes | — |
| 4 | `pending_verification` | Platform Administrator activates | `activateBusinessAfterVerification` | Firestore `businesses.status` | `trial` | Emulator test | Yes | Requires a genuine platform-administrator record + MFA |
| 5 | `trial` | Owner invites Staff | `createStaffInvitation` | Firestore `businessMembershipInvitations` | Pending invitation | Emulator test | Yes | — |
| 6 | pending invitation | Staff accepts | `acceptStaffInvitation` | Firestore `businessMemberships` | Active Staff membership | Emulator test | Yes | — |
| 7 | `trial`, Owner authenticated | Owner creates + publishes Reward Program | `createRewardProgram`/`publishRewardProgramVersion` | PostgreSQL `reward_programs`, `reward_program_versions` | Active program with published version | `rewardProgramCommands.postgres.test.ts` | Yes | Qualifying-node id must be known out-of-band |
| 8 | active membership, published program | Staff records Purchase (Customer presents LN/QR) | `recordPurchase` | PostgreSQL `purchase_records` + Firestore lookup | Purchase `waiting_for_customer` | `purchaseCommands.postgres.test.ts` | Yes | — |
| 9 | `waiting_for_customer` | Customer sees pending Purchase | `listPurchasesWaitingForCustomer` | PostgreSQL read | Purchase visible to owning Customer only | `purchaseCommands.postgres.test.ts` | Yes | — |
| 10 | `waiting_for_customer` | Customer verifies | `verifyPurchase` | PostgreSQL `purchase_records`, `verified_units`, `loyalty_cycles`, (`rewards` if threshold crossed), `trust_events`, `notification_intents`, `purchase_outbox` | `verified`; Verified Unit credited; Cycle allocated | `purchaseCommands.postgres.test.ts:1548` | Yes | — |
| 11 | Cycle progress reaches 10 | (automatic within step 10) | same transaction | `rewards` row `available` | Exactly one Reward, version-bound to the Cycle's governing version | Same test, threshold/version-bump tests | Yes | — |
| 12 | Reward `available` | Customer views reward | `listAvailableRewardsForCustomer` | PostgreSQL read | Reward listed with governing terms | Web test (mocked hooks) + Postgres read test | **No further command exists** | Redemption not implemented (E: intentional deferral) |

---

## 19. Blocker map (required output)

**BLOCKS ENGINE:** none found — every transactional/domain guarantee inspected (idempotency, conservation, threshold cardinality, version binding, ownership isolation) held under real-service tests re-executed by this assessment.

**BLOCKS ENTRY INTO ENGINE:**
- Business Terms version not configured in any real/production/staging environment (`DEC-LEGAL-002` `OPEN_LEGAL`) — blocks every Business from reaching `trial`/`active` outside the emulator, which in turn blocks `purchase.record` eligibility platform-wide in a real environment.

**BLOCKS FOUNDER OPERABILITY:**
- Reward Program qualifying-node/category opaque-ID entry (no in-product picker).
- Platform-Administrator-only activation step (no self-service path for a Founder testing solo, though this is intentional security architecture, not a defect).

**DOES NOT BLOCK CURRENT SPINE:**
- `unitValueMinor: 0` transport rejection (no current caller sends it).
- No browser-level end-to-end test (integration-level proof exists and was re-verified).
- Staff seat-limit enforcement absence.

**DEFERRED FUTURE CAPABILITY (by design, not a blocker of anything currently operational):**
- Reward redemption.
- Business-side dispute (`under_review`) resolution.
- Notification delivery (email/push/SMS).
- `active → suspended` / other post-activation administrator lifecycle transitions.

---

## 20. Recommendation (required output)

**Disposition: B — 11thONUS OPERATIONAL SPINE — ENGINE ASSEMBLED / ENTRY OR OPERABILITY GAPS REMAIN.**

The engine itself — every transactional guarantee from Business creation through Reward issuance — is real, coherent, and proven by re-executed tests, not documentation. It is not disposition A ("assembled and operational") because a real Business cannot leave `draft` in any non-emulator environment today (a governance blocker, not an engineering one), and Reward Program configuration requires an operator to already possess an opaque database id with no in-product way to find it. It is not disposition C or D because neither of those gaps is an *engine* integration gap — every seam that engineering controls is proven working, including the hardest one (the transactional verify → unit → cycle → threshold → reward chain under real concurrency).

**Recommended single next bounded engineering package: the Reward Program qualifying-node/category picker (§16, item 2).**

**Why this has priority over the alternatives:** the Business Terms blocker (§16, item 1) is not an engineering package at all — it is a legal/governance dependency already in active progress outside this task's authority, and the correct engineering answer (the fail-closed gate) is already built and must not be touched. Of the remaining genuinely engineering-scoped candidates, the qualifying-node picker is the smallest, most self-contained, directly reuses already-existing, already-tested Commerce Knowledge browse endpoints (no new backend architecture), touches no transactional/financial code path, and is the single concrete item standing between "the engine is provably correct" and "a Founder can configure a Reward Program without reading source code or a seed manifest." The end-to-end browser test (item 3) is valuable but strictly lower priority: the transactional correctness it would additionally prove is already proven at the integration-test level; it improves assurance, not capability.

---

*This report and its accompanying `documentation-changes-log.md` entry are the only files this task modifies. No production code, migration, dependency, configuration, or governance decision was changed. No merge was performed.*
