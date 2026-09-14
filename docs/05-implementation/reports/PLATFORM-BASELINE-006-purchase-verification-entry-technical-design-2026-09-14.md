# PLATFORM-BASELINE-006 — Purchase & Verification Entry / Technical Design

**Date:** 2026-09-14
**Type:** Read-only architecture / technical-design assessment. No product code implemented.
**Authority chain:** `PLATFORM-BASELINE-005` design + `FOUNDER-DISPOSITION-001` + `REVIEW-FINDINGS-001` (all merged, PR #250) → `PLATFORM-BASELINE-005A` implementation + `CORR-001` (merged, PR #251).
**Entry repository state:** `origin/main` `b68a385f204c7086ac8576ae707a66700f2cd5a0` (PLATFORM-BASELINE-005A merge-close). Isolated worktree, detached HEAD, no implementation files touched.

---

## 1. Executive conclusion

The governed Purchase Verification Lifecycle (PRD5, pre-freeze draft) can enter the PostgreSQL-authoritative transactional spine as a bounded first package — **create + verify + reject, with atomic Verified Unit issuance and no Loyalty Cycle mutation** — without inventing product or architecture decisions and without waiting on any open Founder decision. The design below resolves every quality-bar item (§28 of the task) from current authority:

- **No Purchase/Verification product code exists today.** Zero callables, zero collections, zero schedulers, zero notification infrastructure. There is nothing to migrate and no legacy to reconcile — only reusable seams (Customer Identity resolution, Commerce Knowledge validation, idempotency/outbox patterns, permission-catalogue pattern).
- **PostgreSQL authority for the new transactional data** follows directly from `DEC-DATA-008` (CONFIRMED: PostgreSQL is the authoritative durable transactional datastore; Firestore no longer presumed primary). Firestore remains authoritative for Business, Customer Identity, workforce/membership, Branch, and Commerce Knowledge; the purchase domain references them as opaque stable identifiers validated server-side at write time — the same cross-store shape `PLATFORM-BASELINE-005A` shipped.
- **Purchase Records bind to `reward_program_id` AND the exact published `reward_program_version_id` snapshotted at creation.** Program-only binding is what the PRD text states; version snapshotting is required by the governed history rule (`06 §6`, `BR-067`: historical interpretation must never change when a later version publishes) and by the governed Verified Unit schema itself (TRD10 §10.11.1 carries `rewardProgramVersionId` on every unit row). The one genuinely ungoverned edge — a version bump landing while a purchase is still pending — is specified fail-safe (snapshot governs; §9) and flagged as an open product question, not a blocker.
- **Verification and Verified Unit creation are atomic in ONE PostgreSQL transaction** (lock → state-check → transition → issue units → complete idempotency → outbox). Loyalty Cycle allocation is explicitly **excluded** from that transaction: `DEC-LOY-008` (overflow allocation) is `OPEN_FOUNDER` with an agent stop-rule at threshold crossing, and TRD11 §11.15 expressly permits unit issuance "within the same transaction or through a reliable event consumer." Units carry a nullable cycle link (`NULL` = pending allocation, exactly the §11.21 shape); the Cycle package consumes the outbox event later. This is authority-derived scoping, not convenience scoping.
- **No Founder decision blocks the recommended `006A` slice.** The open decisions that exist (overflow allocation values, expiry duration, partial-quantity verification, dispute/correction UX) affect only explicitly deferred scope. Two open product questions touch the slice edges (version-bump-during-pending; shared-number-off enforcement) and are specified with fail-safe behavior plus explicit flags.

**Recommended `006A` scope:** PostgreSQL Purchase Record foundation; purchase creation (Staff/Manager/Owner); customer + Business pending reads; customer verification and rejection; atomic Verified Unit issuance; transactional idempotency + audit/outbox; minimum Business + Customer UI for Founder localhost verification. Defer: dispute review, correction workflow, expiry scheduler, archive, notification delivery, Loyalty Cycle allocation, Reward issuance, Redemption, analytics, billing.

**Disposition: DESIGN COMPLETE / IMPLEMENTATION READY / AWAITING INDEPENDENT REVIEW** (see §31).

---

## 2. Entry repository state

- `origin/main` at entry: `b68a385f204c7086ac8576ae707a66700f2cd5a0` (merge-close of PR #251). Verified via `git fetch origin` + `git rev-parse origin/main`.
- Primary worktree holds unrelated dirty legal/commercial work (`docs/dec-legal-002-bt-draft-007`); never touched. All work performed in isolated worktree `/tmp/11thonus-pb006` at detached HEAD `b68a385`, verified clean before and after research.
- No implementation files created or modified during assessment (this report + the changes-log entry only, committed on a docs-only branch with an open, unmerged PR).

---

## 3. Authority reviewed

**Product (all `Version 1.0 · Status: Draft for review (pre-freeze) · Classification: Authoritative Product`):**

- `docs/01-product/prd/04-customer-verified-loyalty.md` — read in full (quantity rules §8, unit lifecycle §7, shared number §9, fraud rules §5, Trust Ledger §21, BR/CVLE/FR tables).
- `docs/01-product/prd/05-purchase-verification.md` — read in full (fundamental rule §3, PVL rules §4, identity/commercial/operational/audit info §5, state model §§6–7, recording §8, required info §9, presenter/owner §§10–11, verification screen §14, rejection §15, dispute §16, business review §17, units §18, notifications §19, timeline §20, BR/FR tables §25).
- `docs/01-product/prd/06-reward-programs-and-loyalty-cycles.md` — read in full (program fields §4, versioning §§4.1/4.4/6/13, quantity handling §11, unit gating §10, cycle structure §13, FR/BR tables §§25–26).
- `docs/00-governance/canonical-reference.md` — loyalty-relevant sections (controlled reference only; loses to PRD/TRD on conflict by its own rule).

**Governance:**

- `docs/00-governance/decisions/decision-register.md` — all 109 records scanned; `DEC-DATA-*` (§DATA), `DEC-LOY-*`, `DEC-PROD-*`, `DEC-SUB-*`, `DEC-CUST-ID-ART-001`, `DEC-BUS-ACT-001`, `DEC-AUTH-002`, `DEC-LEGAL-002` + Founder dispositions (`FD-LOY-009`, `FD-PREVIEW-TERMS-001`, `LEG-FD-*`) extracted with exact statuses (see §26).
- `docs/00-governance/decisions/assumptions-register.md` — AS-001..015 (all UNVALIDATED); AS-006/007/008/009 touch verification timing, rejection behavior, shared-number use, and the 10-unit threshold.

**Technical (all `Version 1.0 · Status: Draft for approval (pre-freeze) · Classification: Authoritative Technical`):**

- `docs/02-technical/trd/10-firestore-data-architecture.md` — §§10.2–10.5, 10.6.1–10.6.2, 10.9–10.16 (§10.10 purchaseRecords, §10.11 verifiedUnits/cycles, §10.13 trustEvents, §10.15 notifications, §10.18 subcollections), 10.23, 10.28–10.30 (transactions/idempotency), 10.35–10.37 (FR/DA rules).
- `docs/02-technical/trd/11-cloud-functions-and-domain-services.md` — §§11.1–11.4, 11.7 (CommandEnvelope), 11.10–11.12 (callables/auth), 11.14 (idempotency), 11.15 (atomic verification set), 11.17 (outbox), 11.18–11.26 (PVL flows), 11.31 (scheduled jobs), 11.34–11.35 (errors), 11.37 (audit), 11.39/11.42/11.45 (perf/tests/standards).
- `docs/02-technical/trd/12-security-and-access-control.md` — §§12.2–12.13 (UID→Customer chain, AIR rules), 12.18–12.19 (direct-write ban), 12.36, 12.39 (Trust vs security logs), 12.54–12.56 (SR rules).
- `docs/02-technical/trd/13-communications-and-localization.md` — §§13.13–13.28 (intent/delivery split, channels, consent, quiet hours, retry/dedup).
- `docs/02-technical/trd/19-quality-engineering.md` — §§19.14–19.19 (idempotency/concurrency/transition/ledger tests), 19.35 (notification tests).
- `docs/02-technical/trd/01-07-platform-architecture.md` (Domains 4–7, ownership matrix), `08-firebase-platform-architecture.md` (§§8.8–8.10 event chain/Trust Ledger), `09-physical-and-integration-architecture.md` (§§9.16–9.19 notification/integration split), `22-mvp-implementation-and-delivery.md` (MVP scope; reward auto-expiry non-MVP), `23-traceability-and-completion-review.md` (OTD-006/007 open points).
- `docs/03-standards/engineering-standards/` — error-handling, testing, logging conventions (no new categories; idempotency + state-transition tests mandatory for sensitive writes).

**Recent Platform Baseline authority:** 001 (+CORR-001/002), 002, 003 (+CORR-001), 004A (+CORR-001), 005-design (+CORR-001, REVIEW-FINDINGS-001), 005A (+CORR-001) implementation reports — durable contracts extracted in §5. (Note: no `004` non-A report exists; 004A is the only workforce package.)

Archive copies were not relied on where canonical current documents exist. Where the task brief's "established rules" summary differs from current text, the current text wins and the difference is called out in §4.

---

## 4. Current implementation inventory

Searched `functions/src`, `apps/web/src`, `tests/`, `firestore.rules`, `firestore.indexes.json`, `firebase.json`, PG `migrations/`, seed scripts (patterns: `purchase`, `PurchaseRecord`, `verified_unit(s)`, `VerifiedUnit`, `verification`, `TrustEvent`, `trustLedger`, `dispute`, `qrIdentity`, `loyaltyNumber`, `rewardProgramId`, `qualifying`, `Branch`, notification/scheduler/expiry terms).

### 4.1 Headline results

- **Zero purchase/verification callables.** `functions/src/index.ts` exports 30 `onCall` callables (auth 6, business 11, staff 8, terms 1, reward program 6). The only `*Verification*` callables are **business** verification (`submitBusinessForVerification`, `activateBusinessAfterVerification`) — a different domain; naming must keep the two verifications distinct.
- **Zero purchase/trust Firestore collections.** `firestore.rules` allow-lists only `users`, `customerProfiles`, `loyaltyNumbers`, `qrIdentityRecords`, `platformAdministrators`, `platformAdministrationAuditRecords` (all deny-write), plus catch-all deny. `migrations/README.md` explicitly names `purchase_records`, `verification_decisions`, `verified_units`, `loyalty_cycles`, `rewards`, `redemptions` as **not yet created**.
- **Zero notification infrastructure** (no FCM/SendGrid/Twilio, no notifications collection, Customer Activity page is an explicit stub). **Zero schedulers** (`onSchedule`/pubsub nowhere; the one trust outbox adapter header states "Not wired to a live scheduled trigger").

### 4.2 Classification

**A. Operational and valid — preserve/integrate:**

- `functions/src/domains/identity/repositories/identityLookupRepository.ts` — `lookupCustomerIdentityByLoyaltyNumber`, `lookupCustomerIdentityByQrReference`, `lookupCustomerIdentityById`, `lookupCustomerIdentityByAuthenticationReference`. Read-only, anti-enumeration (unknown/inactive collapse to not-found), purpose allow-listed, never creates/repairs. **This is the purchase recorder's customer-resolution seam.**
- `functions/src/domains/loyaltyNumber/repositories/loyaltyNumberRepository.ts` + `services/loyaltyNumberIssuanceService.ts`; `functions/src/domains/qrIdentity/repositories/qrIdentityRepository.ts` + `services/qrIdentityAssociationService.ts` — issuance/association/lookup primitives (value→identity and reference→identity reverse lookups).
- `functions/src/domains/identity/services/customerIdentityArtifactEstablishment.ts` — `ensureCustomerIdentityArtifacts` (explicit repair only; reads never repair — emulator-proven).
- `functions/src/domains/rewardProgram/services/rewardProgramKnowledgeValidation.ts` — `validateQualifyingNodes` / `validateCategoryReference` (live Firestore Commerce Knowledge read, pre-PG-transaction with disclosed race — the RF-3 pattern purchase creation reuses).
- Full `rewardProgram` domain + PG migrations `0001–0006` + six callables — the only `rewardProgramId`/qualifying-node spine purchases can reference.
- `functions/src/domains/business/` Branch model (`models/businessBranch*.ts`, `services/businessBranchProfileCommand.ts`, `services/businessReadService.ts` `readDefaultBranchForBusiness`) — single-default-branch model; purchase carries the default branch as informational metadata.
- `functions/src/shared/{idempotency,outbox,commands,correlation,validation}/` + PG `idempotencyRepository.ts` + `rewardProgramOutboxRepository.ts` — reserve/mutate/complete and transactional-outbox patterns to copy.
- `activateBusinessAfterVerificationCommand` + business-verification callables — keep; do not confuse with purchase verification.

**B. Partial/scaffold — potentially reusable:**

- `functions/src/domains/trust/*` (`trustRecord.ts`, `trustRecordRepository.ts`, `trustSignalIngestionService.ts` — consumes only auth events, `trustEventHandler.ts` unwired, `deriveEffectiveTrust.ts`, `riskGate/*`) — identity/auth trust only; explicitly excludes purchase TrustEvents/disputes/correction history. Reusable as pattern, **not** as the purchase trust ledger.
- `functions/src/shared/outbox/outboxProcessor.ts` + `outboxEntries` indexes — claim/retry/dead-letter machinery with no deployed driver; the purchase flow would be a natural first producer/consumer (still downstream of 006A).
- `apps/web/src/customer/*` stubs — explicit "no Purchase/Verification implemented" markers showing where verify UI attaches.
- `apps/web/src/i18n/locales/en.ts` `fieldMultipleUnitsAllowed` label — string only, no logic.

**C. Firestore-native legacy conflicting with the new spine:** none for purchase/trust (nothing exists to conflict). Watch item only: TRD10 §§10.10–10.13 specify `purchaseRecords/verifiedUnits/trustEvents` as Firestore canon; `DEC-DATA-008` directionally supersedes that premise (TRD10 contains zero PostgreSQL mentions, verified by grep). 006A must implement the PG spine, not "integrate" the Firestore doc schemas as code.

**D. Dead/unused:** invitation-expiry demo data in `DashboardHarnessPage.tsx`; security-rule fixture docs; trust test-boundary fixtures. No purchase logic.

**E. Documentation only:** PRD4 §21 / PRD5 / PRD8 trust material, TRD10 §§10.10–10.13 + `TrustEventDocument`, TRD11 §§11.18–11.26 flows, audit findings, RTM rows, `platformFoundationReadiness.ts` out-of-scope comment. No purchase implementation report exists.

**F. Test fixture only:** `"purchase.purchaseRecorded.v1"` as a generic example event-type string in shared event/outbox tests; `"purchase.record failed..."` as an arbitrary log string; reward-program parser tests touching `qualifyingNodes`/`rewardProgramId`.

### 4.3 Corrections to the task brief's assumptions

- Purchase/Verification is **fully absent** as implementation (the brief's caution was correct to raise, but the search confirms absence — nothing to preserve except seams).
- `DEC-LOY-014/015` **do not exist** as register entries (header banner: "not activated"; cited only in non-canonical freeze/principles files absent from this tree). They cannot ground design.
- There is no `004` baseline package (004A is the workforce package).
- `purchase.record` exists in code **only as an ungoverned-example string** in permission-catalogue comments/tests/placeholder; the evaluator resolves it `NO_APPLICABLE_GRANT`. No purchase permission exists.

---

## 5. Existing valid capabilities to preserve

1. **Migration runner + checksum discipline** (`migrationRunner.ts`, `postgresTransaction.ts` `withPlatformTransaction`, fail-closed `postgresConfig.ts`): `NNNN_name.sql` ordering, `sha256` checksums, exact-prefix validation before any SQL, read-only readiness, `migrateDown` rollback. 006A adds forward-only migrations under these rules; never hand-edits 0001–0006.
2. **PG idempotency foundation** (`idempotencyRepository.ts`): generic `idempotency_keys` table reused via domain-prefixed `operation_type`s; atomic `INSERT … ON CONFLICT DO NOTHING` reservation; reserve/mutate/complete inside ONE transaction; `peekIdempotencyKey` replay short-circuit; governed conflict/in-progress error mapping. Three P3 hardening notes (fallback hardening, raw race-loser violations, unreachable plain `Error`) carry over as known items.
3. **PG domain outbox** (`rewardProgramOutboxRepository.ts` pattern): same-transaction event writes, id-only payloads, no secrets. 006A needs its own domain-scoped outbox table (or a shared purchase-domain one — §20).
4. **Permission catalogue + evaluator pattern**: disjoint catalogue module, load-time cross-catalogue collision invariant, structural-copy evaluator branch, declarative `eligibleBusinessStatuses`, Owner-floor/override mechanics, whitelist-parser → server-resolved-actor → domain-command → closed-taxonomy callable convention (`index.ts` reward-program section as template).
5. **Customer Identity resolution + issuance primitives** (§4.2-A): LN/QR→identity lookups, single-number/single-QR invariants, read-purity, explicit-repair-only establishment.
6. **Commerce Knowledge validation pattern**: `getKnowledgeNodeById` + `isEligibleForNewReference` reused unmodified, authoritative read before the PG transaction, disclosed bounded race (RF-3 discipline applies to every cross-store precondition in §18).
7. **Fixed platform invariants** (`loyaltyInvariants.ts`, DB `CHECK`s): `requiredVerifiedUnits=10`, `rewardQuantity=1` — 006A reads them, never re-derives them.
8. **Business eligibility pattern**: declarative lifecycle gate in the evaluator (`trial`/`active`), membership-gated reads precedent, admin-gated activation precedent. `DEC-LEGAL-002` stays `OPEN_LEGAL`; localhost testing uses the emulator-only `FD-PREVIEW-TERMS-001` fixture path, never weakened gates.

---

## 6. Current gaps

1. No Purchase Record model, store, commands, or reads anywhere.
2. No verification/rejection/dispute/correction behavior anywhere.
3. No Verified Unit store or issuance logic anywhere.
4. No purchase-side permission (no catalogue entry, no evaluator branch, no role mapping).
5. No customer-facing verify/reject surface (web or callable).
6. No notification intent/delivery infrastructure of any kind.
7. No scheduler/cron infrastructure; no expiry machinery of any kind.
8. No Trust Ledger implementation (concept + specified `trustEvents` shape only; existing trust domain is auth-scoped).
9. No branch selection (single default branch only — sufficient for 006A).
10. No phone-number→customer resolver (only LN/QR/ID/auth-reference lookups).
11. Open product questions (§§9, 15, 26): version-bump-during-pending semantics; shared-number-off enforcement; expiry values; partial-quantity verification; dispute/correction UX.

---

## 7. Domain ownership map

| # | Entity / concern | Authoritative owner | Form of reference from purchase domain |
|---|---|---|---|
| A | Purchase Record (commercial snapshot + lifecycle) | **PostgreSQL (new, 006A)** | native tables |
| B | Purchase lifecycle/state transitions | **PostgreSQL (new, 006A)** — `status` transitions via controlled server commands + append-only `purchase_record_events` | native |
| C | Verification decision | **PostgreSQL (new, 006A)** — the `waiting_for_customer → verified` transition row + event | native |
| D | Verification actor attribution | **PostgreSQL (new)** storing **Firestore-resolved** identity: server-resolved Customer Identity id (from Firebase Auth UID → `users` → `customerProfiles`, current mechanism per TRD12; `DEC-AUTH-002` notes the direction is under review but names no replacement — 006A uses the current mechanism and records the caveat) | opaque `TEXT`, never PG FK |
| E | Dispute/rejection state | Rejection state: **PostgreSQL (006A)**. Dispute review workflow: **deferred** (no owner yet) | native (reject only) |
| F | Correction relationship | Schema carries forward-compatible linkage columns (006A); correction **behavior deferred** (no owner yet; governed rules DEC-LOY-004/TRD11 §11.24 constrain the future package) | native columns, unused by 006A commands |
| G | Verified Units | **PostgreSQL (new, 006A)** — immutable issuance rows | native tables |
| H | Trust/audit events | **Trust Domain owns the concept**; no implementation exists. 006A writes **domain PG outbox events only**; a future Trust package consumes them into `trustEvents`. 006A builds **no** trust ledger, no second ledger of any kind (§20) | outbox seam |
| I | Notifications/outbox | Outbox events: **PG (006A)**. Notification intents/delivery: **deferred** to Notification/Integration domains (§21) | outbox seam |
| J | Reporting metadata (unit value/currency, item descriptors) | Stored on the PG purchase row as **write-only-for-reporting** nullable columns; `DEC-DATA-003` forbids the loyalty engine from reading them (lint/guard in 006A) | native columns, engine-blind |

**Derivation (not assertion):** `DEC-DATA-008` CONFIRMED makes PostgreSQL the authoritative durable transactional datastore and states Firestore is "no longer presumed" primary; `DEC-DATA-001` requires server-only authoritative writes for exactly this class of records (Purchase Records, verification outcomes, Verified Units named); every PG Baseline package since 001 has moved new transactional state to PostgreSQL while leaving existing Firestore authorities untouched; the purchase domain has no Firestore presence to preserve, so there is no dual-authority question — only stable references outward (Business, Customer Identity, Branch, Commerce Knowledge, actor ids as opaque indexed `TEXT`, validated server-side at write time, exactly the 005A cross-store shape).

---

## 8. Purchase Record identity model

- **Primary id:** PostgreSQL-generated `UUID` (`gen_random_uuid()`, PK). Rationale: the record is platform-created inside the creation transaction; no offline deterministic-id requirement is governed (TRD10 §10.28 offline keys concern client retries, which idempotency keys already cover). Application-generated ids would add collision handling for no governed benefit.
- **Business:** `business_id TEXT NOT NULL` — opaque Firestore Business id (indexed, never PG FK).
- **Customer:** `customer_identity_id TEXT NOT NULL` — opaque Firestore Customer Identity id (`users/{id}` identity, resolved server-side via `identityLookupRepository`, §10). The as-presented artifact value is snapshotted separately (`loyalty_number_value TEXT NOT NULL`, `qr_reference TEXT NULL`) so later artifact regeneration never rewrites history.
- **Reward Program + version:** `reward_program_id UUID NOT NULL REFERENCES reward_programs(id)` + `reward_program_version_id UUID NOT NULL REFERENCES reward_program_versions(id)` — the creation-time **active** version snapshotted at creation (§9 for why both).
- **Recorder:** `recorded_by_user_id TEXT NOT NULL` (server-resolved actor) + `recorded_by_role TEXT NOT NULL` (`staff|manager|owner` as resolved, for audit display).
- **Branch:** `branch_id TEXT NOT NULL` — the Business's default branch (single-branch model; informational, visible on the verification screen per PRD5 §14).
- **Commercial snapshot (immutable):** `quantity INTEGER NOT NULL CHECK (quantity >= 1)`; `item_label TEXT NOT NULL` (customer-visible descriptor, e.g. "Coffee"); `knowledge_node_id TEXT NULL` (optional qualifying Commerce Knowledge ref, validated at creation iff present); `unit_value_minor INTEGER NULL` + `currency TEXT NULL` (reporting-only per DEC-DATA-003; engine must not read); `purchase_date TIMESTAMPTZ NOT NULL` (business-asserted commercial date, sanity-bounded, not future); `notes TEXT NULL` (customer-visible free text).
- **Lifecycle:** `status TEXT NOT NULL` (8-state CHECK) + `purchase_record_events` append-only history (§15).
- **Correction linkage (forward-compatible, unused by 006A commands):** `replaces_purchase_record_id UUID NULL REFERENCES purchase_records(id)`, `replaced_by_purchase_record_id UUID NULL REFERENCES purchase_records(id)`.
- **Integrity/ops:** `correlation_id TEXT NOT NULL`, `recorded_at TIMESTAMPTZ` (server commit time), `created_at/updated_at`, `schema_version INTEGER DEFAULT 1`. Optimistic concurrency via state-conditional `UPDATE … WHERE status = …` (005A `publishVersion` precedent); no separate `row_version` needed because transitions are single-writer state-machine steps, not multi-field edits.

---

## 9. Reward Program/version binding

**Conclusion: bind to `reward_program_id` AND the exact published `reward_program_version_id` active at creation.**

- Program-only binding is all the PRD text states (`BR-049`, `FR-PVL-003`, PRD5 §5 Identity lists "Reward Program ID"). Standing alone it under-specifies history: `06 §6` + `BR-067` + `FR-RP-010` require that historical interpretation never change when a later version publishes, and the governed unit schema (TRD10 §10.11.1) puts `rewardProgramVersionId` on **every** unit row — a version must therefore be resolved no later than issuance. The only consistent resolution point available at both creation and issuance is the creation-time active version.
- **Creation rule:** the referenced program must be `active` with a non-null `current_version_id`; the purchase snapshots that version id. Creation against a program with no published version fails closed (`no-active-version` domain error).
- **Verification rule:** units and events carry the purchase's snapshotted version; no re-resolution occurs at verification.
- **Version-bump-during-pending (OPEN product question, non-blocking):** if a new version publishes between creation and verification, verification still proceeds under the creation snapshot (history rule dominates; threshold/quantity are platform-fixed so only qualifying-config deltas are at stake). 006A implements snapshot-governs, logs the version delta in the verification event payload, and the question — whether future policy should instead re-validate or hold such purchases — is flagged for Founder confirmation (§26). 006A tests use single-version programs, so no test bakes in the flagged behavior beyond the snapshot rule itself.
- A pending purchase never blocks version activation (no lock is taken on the program row).

---

## 10. Customer resolution model

- **What the client submits:** exactly one of `loyaltyNumberValue` or `qrReference` (canonical per PRD5 §9: "Customer Loyalty Number or QR"), plus commercial fields. The client **never** submits a Customer domain id (anti-enumeration + flow requirement).
- **What the server resolves:** `lookupCustomerIdentityByLoyaltyNumber` or `lookupCustomerIdentityByQrReference` (`identityLookupRepository.ts`) → Customer Identity id → stored as `customer_identity_id`. Unknown/inactive artifacts fail closed with a non-enumerating error. No phone lookup exists (confirmed absent — §6.10); phone-based recording remains future and is not in 006A.
- **What is stored:** the resolved identity id plus the as-presented artifact snapshot (`loyalty_number_value`, `qr_reference`). Shared-number behavior falls out correctly with no extra machinery: the number resolves to its registered owner, the record attaches to the owner, and only the owner can verify (DEC-LOY-007; PRD5 §11; PRD4 §9). The presenter is not identified and no presenter field is stored.
- **Preserved invariants:** one Loyalty Number + one current QR per identity; server-authoritative resolution; reads (including the new pending-list reads) never create/repair artifacts — they use the read-only lookup path only.
- **Shared-number-off (OPEN product question, non-blocking):** when the version's `sharedLoyaltyNumberAllowed` is false, no enforceable creation-time rule exists without presenter identity (the platform cannot observe who presented). 006A snapshots the flag on the purchase row for future enforcement and applies no extra gate; the off-behavior (block vs review vs recorder-attestation) is flagged (§26).

---

## 11. Business actor/permission model

- **Recording purchases:** no permission exists today (`purchase.record` is an ungoverned-example string; evaluator returns `NO_APPLICABLE_GRANT`). 006A requires exactly one new disjoint catalogue module (pattern-mirror of `rewardProgramPermissionCatalogue.ts`): e.g. `purchasePermissionCatalogue.ts` with a single entry `purchase.record`, load-time cross-catalogue collision invariant, declarative `eligibleBusinessStatuses: ["trial", "active"]`, and a structural-copy evaluator branch. **Role mapping is product-governed, not invented:** PRD5 §8 authorizes Staff, Manager, and Business Owner (`roleDefaults: owner/manager/staff true`), unlike the Owner-only `rewardProgram.manage`. Specified here, implemented in 006A (permission plumbing is inseparable from the creation command).
- **Customer verify/reject:** no catalogue entry — ownership check (`purchase.customer_identity_id == server-resolved customer identity`), mirroring the membership-gated-reads precedent and TRD12 SR-004/FR-SEC-004. Rejection is strictly individual (DEC-LOY-010); batch verify limited to the visible reviewed set (DEC-LOY-006) — enforced server-side, never by UI alone.
- **Deferred authorities (separate from 006A, no widening):** dispute review, correction/replacement approval, cancellation, archival, and any Manager-delegation changes each need their own authority decision in later packages. `reward.override`, `transaction.reverse`, and `business.configureFraudRules` already exist as Owner-only sensitive permissions and are **not** purchase-correction authorities — 006A must not borrow them.

---

## 12. Purchase creation contract

`recordPurchaseRecord` (name follows the `<domain><Action><Object>` suggestion; exact callable naming is non-normative):

- **Authorized actors:** active Staff/Manager/Owner membership via new `purchase.record` permission (§11). Recorder identity + role server-resolved and stored.
- **Business eligibility:** `trial`/`active` via the catalogue lifecycle gate (005A pattern). Suspended/expired/closed fail closed.
- **Customer resolution:** §10 (LN-or-QR in, identity id out, fail-closed).
- **Reward Program eligibility:** program `active`, `current_version_id` non-null; snapshot version id. Program-level `sharedLoyaltyNumberAllowed` snapshotted; `multipleUnitsAllowed=false` ⇒ `quantity` must be `1`; optional `Maximum Units per Purchase Record` (if configured on the version) enforced as a hard cap; bulk/quantity review thresholds recorded as review-visibility only (DEC-LOY-003: never auto-reject).
- **Commerce Knowledge validation:** optional `knowledge_node_id` validated via `validateQualifyingNodes`-equivalent (active-type eligibility) in the authoritative Firestore read **before** the PG transaction (RF-3 discipline); category/standard-node checks are not purchase concerns.
- **Quantity:** integer `>= 1`. Noнитary math anywhere near it.
- **Monetary metadata:** optional `unit_value_minor` (integer minor units per DEC-DATA-002) + `currency`; stored, never read by loyalty logic (DEC-DATA-003 guard).
- **Notes:** optional free text, customer-visible.
- **Idempotency:** client-supplied key, operation type `purchase.create`, request hash binds actor + business + customer artifact + program/version + commercial snapshot; same-key/same-request replays the created record; same-key/different-request conflicts; rollback rolls back the reservation with the transaction (005A pattern).
- **Correlation/audit/outbox:** server-generated `correlationId`; `purchase_recorded` outbox event + `purchase_record_events` creation row, same transaction.
- **Initial state:** exactly `waiting_for_customer`. `Draft`/`Recorded` are transient workflow moments (PRD5 §7 note), never stored values — the creation transaction writes the row directly in `waiting_for_customer`.
- **Validation ordering (fail-closed):** authentication → permission/business-eligibility → program/version resolution → customer resolution → commercial validation (quantity/caps/dates) → Firestore cross-store reads → idempotency reservation → single PG transaction (insert record + creation event + outbox + complete key). Any failure before the transaction leaves zero PG state; any failure inside rolls back everything including the reservation.

---

## 13. Purchase lifecycle/state model

Stored `status` CHECK over the 8 canonical states (`waiting_for_customer, verified, rejected, under_review, corrected, cancelled, expired, archived`). 006A implements exactly three transitions; all others are unreachable by any 006A command (command allow-list, not DB — the CHECK admits the full enum for forward compatibility):

| Transition | Actor | Effect |
|---|---|---|
| `∅ → waiting_for_customer` | Staff/Manager/Owner | creation (§12) |
| `waiting_for_customer → verified` | registered Customer only | §14 + atomic unit issuance (§16) |
| `waiting_for_customer → rejected` | registered Customer only | no units; reason code required (PRD5 §15 reason set); terminal in 006A |

Governed-invalid examples 006A must enforce (TRD19 §19.17): `verified → waiting_for_customer`, `rejected → verified` without approved resolution, `cancelled → verified` — all rejected with standardized errors and zero partial writes. `under_review/corrected/cancelled/expired/archived` have no 006A writer; dispute→review, correction→replacement, expiry, and archival belong to later packages (§24). The `rejected → under_review` question (PRD5 §6 vs §7 tension) is deferred with the dispute package — 006A treats `rejected` as terminal.

---

## 14. Verification contract

`verifyPurchaseRecord` (customer-authenticated callable):

- **Identity:** Firebase Auth token → server-resolved Customer Identity (current TRD12 chain; `DEC-AUTH-002` caveat recorded — no replacement IdP is approved, so 006A uses the current mechanism). Client-supplied customer id/role never trusted; ownership proved as `purchase.customer_identity_id == resolved identity`, inside the transaction after row lock.
- **Allowed source state:** `waiting_for_customer` only (re-locked row; concurrent first-writer wins, losers get a standardized stale-state error, never partial effects).
- **Idempotency:** operation type `purchase.verify`, hash binds purchase + actor; same-key replay returns the verification result; double-clicks and retries are safe. Simultaneous verify-vs-reject on one record serializes on the row lock — exactly one transition commits.
- **Timestamp/attribution:** server commit time as `verified_at`; actor = resolved identity id; optional customer response/note stored on the verification event row.
- **Audit/outbox:** `purchase_record_events` transition row + `purchase_verified` + `verified_units_issued` outbox events, same transaction (§16).
- **Result:** `verified` status + durably created units (§16), returned with resulting unit totals.
- `rejectPurchaseRecord` mirrors this with `purchase_rejected`, a mandatory reason code, and **no** unit writes.
- `raisePurchaseDispute` is **deferred** (no dispute-review owner exists yet); 006A offers verify or reject only, which is coherent: every pending record has exactly one customer-resolvable exit, and rejection reasons cover the dispute-initiating cases ("Wrong quantity/item", "Duplicate", "Wrong program") as terminal customer statements pending the future review workflow.

---

## 15. Verified Unit model

Governed representation (TRD10 §10.11.1): each row records an authoritative issuance **or reversal**; fields `customerId, businessId, rewardProgramId, rewardProgramVersionId, loyaltyCycleId, purchaseRecordId, quantity, entryType ("credit"|"reversal"), reasonCode, createdAt, createdBy, schemaVersion`, with the Unit Rule (no mutable-counter counting; the supporting record must exist), DA-002/DA-003, FR-DATA-004/006.

**006A mapping (PostgreSQL `verified_units`):**

- One row per issuance event per verified purchase (`quantity` = purchase quantity — the per-issuance shape the schema's `quantity` field specifies; no per-unit ordinal rows required by any authority). Partial unique index `UNIQUE (purchase_record_id) WHERE entry_type = 'credit'` makes double-issuance structurally impossible.
- Reversals are separate rows (`entry_type='reversal'`, negative-effect semantics via reason codes, never negative quantities — PRD4 §18 forbids negative units); no reversal writer exists in 006A (correction package owns it under DEC-LOY-004 + TRD11 §11.24).
- `loyalty_cycle_id UUID NULL` — **NULL means pending allocation** (the exact TRD11 §11.21 shape: tracked, not discarded, not merged, no second active cycle). 006A never writes a non-null cycle id and never creates/updates cycle rows (§16 rationale).
- Rows are insert-only: no 006A command updates or deletes a unit row (command-layer convention, 005A-style, documented on the table).
- `quantity` 1:1 mapping note: the literal sentence "quantity 4 → 4 units" is not in the PRDs, but the per-issuance `quantity` field plus the ×5→5 / ×3→3 / ×2→2 examples plus DEC-LOY-003 (multi-quantity records) jointly determine the mapping `units issued = purchase quantity` for whole-record verification. Partial-quantity verification (verify 4 of 5) is **not** implemented — DEC-PROD-008 is OPEN; 006A verifies whole records only.

---

## 16. Atomic transaction boundaries

**Verification boundary (the package's load-bearing guarantee): one PostgreSQL transaction performs: lock purchase row (`SELECT … FOR UPDATE`) → confirm `waiting_for_customer` + ownership → `UPDATE status='verified'` → insert `purchase_record_events` row → insert `verified_units` credit row → `completeIdempotencyKeyInTransaction` → write outbox (`purchase_verified`, `verified_units_issued`).** Either the purchase is verified *with* its units durably created, or nothing happens — the "never verified-without-units, never units-for-unverified" principle holds by construction, with DB constraints (partial unique credit index, status CHECK, FKs) as backstop rather than application prechecks alone.

**Creation boundary:** one transaction performs: idempotency reservation → insert `purchase_records` (`waiting_for_customer`) → insert creation event → outbox (`purchase_recorded`) → complete key. Cross-store reads (Business/membership/program/customer-artifact/knowledge-node) all precede the transaction (RF-3).

**Rejection boundary:** same shape as verification minus unit writes.

**Why no Loyalty Cycle mutation in the same transaction (Option A, decided):** (1) `DEC-LOY-008` is `OPEN_FOUNDER` with an explicit agent stop-rule at threshold crossing — writing cycle rows now would bake unconfirmed overflow semantics; (2) TRD11 §11.15 expressly leaves unit creation as "same transaction **or** reliable event consumer," and the outbox event is that reliable handoff; (3) the 006A atomicity principle concerns units (the governed issuance gate), while cycle projection is already defined as derived/reconcilable (`projectedVerifiedUnits` Projection Rule), never the source of truth. The Cycle package consumes `verified_units_issued` later. This is the TRD-sanctioned split, not invented eventual consistency: nothing is lost, reordered silently, or double-applied (idempotent consumer keyed on the outbox event id).

---

## 17. Idempotency/concurrency model

Reuse the generic PG `idempotency_keys` table with new operation types `purchase.create`, `purchase.verify`, `purchase.reject` (domain-prefix namespacing avoids 0004 collisions):

- **Request hashes** bind actor + business + target (purchase id for verify/reject; artifact + program/version + commercial snapshot for create) + content fingerprint, mirroring `rewardProgramRequestHash`.
- **Replay:** same-key/same-request returns the stored result (created record / verification outcome). **Conflict:** same-key/different-request → governed `IDEMPOTENCY_CONFLICT`. **In-progress:** concurrent same-key → retryable `TEMPORARY_UNAVAILABLE`. **Rollback:** reservation lives inside the domain transaction — a throw rolls it back; the next attempt sees "no record" (retryable).
- **Races decided by the database, not the UI:** double-submit create (unique key + reservation), double-verify (row lock + conditional transition + partial-unique credit index — triple backstop), simultaneous verify-vs-reject (row lock serializes; loser fails closed on state), replay-after-success (peek short-circuit before preconditions, the 005A publish-replay fix pattern).
- Web hooks reuse `keyForRequest` rotation + `settleKeyOnError` (005A precedent) so a retained key never leaks across purchases.

---

## 18. Cross-store validation model

Ordering for every 006A write (RF-3 discipline): authenticate → authorize (evaluator/membership) → resolve program/version (PG read) → resolve customer artifact (Firestore read) → validate knowledge-node refs (Firestore read, iff present) → validate business/branch state (Firestore read) → **then** open the PG transaction. The PG transaction contains PG writes only.

Accepted bounded races (disclosed, never presented as distributed atomicity): program deactivation, membership suspension, artifact invalidation, or node retirement landing between the validation read and the PG commit. Consequences are fail-safe by construction: the PG row permanently snapshots every validated reference (program id + version id, customer id + artifact value, node id, recorder + role, business + branch), so later source changes never rewrite history; a purchase created milliseconds after a deactivation is a normal pending record governed by the same lifecycle, not a corruption. No validation result is cached across commands — every command re-reads.

---

## 19. Immutable-history/correction model

Governed reconciliation (TRD10 §10.10.1 Immutability Rule + DAP-004): **commercial/identity snapshot columns are never updated** (command-layer convention, documented on the table — the 005A approach); **lifecycle columns (`status`, `verified_at`, linkage ids) transition only through the three governed commands**; every transition appends a `purchase_record_events` row (creation included), giving the PRD5 §20 timeline and the Trust Event source material.

Corrections (deferred behavior, prepared schema): under DEC-LOY-004 + TRD11 §11.24 the future package will retain the original, create a correction record + replacement purchase (new id, `replaces_purchase_record_id` set, original `replaced_by_purchase_record_id` set, original → `corrected`), require fresh customer verification of the replacement, and — where the original already issued units — write `reversal` unit rows rather than deleting. 006A lays the linkage columns and the reversal-capable unit shape but writes neither. If the original never verified (no units), correction is a plain replacement chain with no reversal rows.

---

## 20. PostgreSQL schema proposal

```sql
-- purchase_records: platform representation of a real-world purchase (006A).
-- Commercial/identity snapshot columns are insert-only by command-layer
-- convention (TRD10 §10.10.1 Immutability Rule). Only status/verdict/linkage
-- columns transition, and only through governed commands.
CREATE TABLE purchase_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,                        -- opaque Firestore ref
  customer_identity_id TEXT NOT NULL,               -- opaque, server-resolved
  loyalty_number_value TEXT NOT NULL,               -- as-presented snapshot
  qr_reference TEXT NULL,                           -- as-presented snapshot
  reward_program_id UUID NOT NULL REFERENCES reward_programs (id) ON DELETE RESTRICT,
  reward_program_version_id UUID NOT NULL REFERENCES reward_program_versions (id) ON DELETE RESTRICT,
  shared_loyalty_number_allowed BOOLEAN NOT NULL,   -- version-flag snapshot
  multiple_units_allowed BOOLEAN NOT NULL,          -- version-flag snapshot
  branch_id TEXT NOT NULL,                          -- default branch, informational
  recorded_by_user_id TEXT NOT NULL,
  recorded_by_role TEXT NOT NULL CHECK (recorded_by_role IN ('staff','manager','owner')),
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  item_label TEXT NOT NULL,
  knowledge_node_id TEXT NULL,                      -- optional qualifying ref
  unit_value_minor INTEGER NULL CHECK (unit_value_minor IS NULL OR unit_value_minor >= 0),
  currency TEXT NULL,                               -- reporting-only (DEC-DATA-003)
  purchase_date TIMESTAMPTZ NOT NULL,
  notes TEXT NULL,
  status TEXT NOT NULL DEFAULT 'waiting_for_customer'
    CHECK (status IN ('waiting_for_customer','verified','rejected','under_review',
                      'corrected','cancelled','expired','archived')),
  verified_at TIMESTAMPTZ NULL,
  rejection_reason TEXT NULL,
  replaces_purchase_record_id UUID NULL REFERENCES purchase_records (id) ON DELETE RESTRICT,
  replaced_by_purchase_record_id UUID NULL REFERENCES purchase_records (id) ON DELETE RESTRICT,
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  schema_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT purchase_records_verified_fields CHECK (
    (status = 'verified' AND verified_at IS NOT NULL AND rejection_reason IS NULL) OR
    (status = 'rejected' AND rejection_reason IS NOT NULL) OR
    (status NOT IN ('verified','rejected'))),
  CONSTRAINT purchase_records_reporting_pair CHECK (
    (unit_value_minor IS NULL) = (currency IS NULL))  -- value+currency together or neither
);
CREATE INDEX purchase_records_business_status_idx ON purchase_records (business_id, status, created_at DESC);
CREATE INDEX purchase_records_customer_status_idx ON purchase_records (customer_identity_id, status, created_at DESC);
CREATE INDEX purchase_records_program_idx ON purchase_records (reward_program_id, reward_program_version_id);

-- purchase_record_events: append-only transition history (timeline + Trust source).
CREATE TABLE purchase_record_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_record_id UUID NOT NULL REFERENCES purchase_records (id) ON DELETE RESTRICT,
  from_status TEXT NULL,
  to_status TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('staff','manager','owner','customer','system')),
  actor_id TEXT NOT NULL,
  reason TEXT NULL,
  event_payload JSONB NULL,                         -- version-delta notes, etc.
  correlation_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  schema_version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX purchase_record_events_record_idx ON purchase_record_events (purchase_record_id, occurred_at);

-- verified_units: immutable issuance/reversal rows (TRD10 §10.11.1).
-- loyalty_cycle_id NULL = pending allocation (§11.21); 006A never writes non-null.
CREATE TABLE verified_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_record_id UUID NOT NULL REFERENCES purchase_records (id) ON DELETE RESTRICT,
  business_id TEXT NOT NULL,
  customer_identity_id TEXT NOT NULL,
  reward_program_id UUID NOT NULL REFERENCES reward_programs (id) ON DELETE RESTRICT,
  reward_program_version_id UUID NOT NULL REFERENCES reward_program_versions (id) ON DELETE RESTRICT,
  loyalty_cycle_id UUID NULL,                       -- pending allocation while NULL
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('credit','reversal')),
  reason_code TEXT NOT NULL,                        -- e.g. 'purchase_verified'
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT verified_units_reversal_needs_cycle CHECK (
    entry_type = 'credit' OR loyalty_cycle_id IS NOT NULL)
);
CREATE UNIQUE INDEX verified_units_one_credit_per_purchase
  ON verified_units (purchase_record_id) WHERE entry_type = 'credit';
CREATE INDEX verified_units_customer_program_idx
  ON verified_units (customer_identity_id, reward_program_id, entry_type);

-- purchase_outbox: domain-scoped transactional outbox (005A pattern).
-- Events: purchase_recorded / purchase_verified / purchase_rejected /
-- verified_units_issued. Payloads carry ids only, never secrets.
CREATE TABLE purchase_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL
    CHECK (event_type IN ('purchase_recorded','purchase_verified','purchase_rejected','verified_units_issued')),
  aggregate_type TEXT NOT NULL DEFAULT 'purchase_record',
  aggregate_id UUID NOT NULL REFERENCES purchase_records (id) ON DELETE RESTRICT,
  payload JSONB NOT NULL,
  actor_id TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX purchase_outbox_aggregate_idx ON purchase_outbox (aggregate_id, occurred_at);
```

Reuse as-is: generic `idempotency_keys` (new operation types only). Each table ships with a matching `.down.sql`. No migration files are created by this design task.

---

## 21. Reads/read-model proposal

Minimum 006A reads (all server-authorized; reads never create/repair):

- Business: `listPurchasesForBusiness` (filter by `status`, default `waiting_for_customer` first, paginated, newest-first) + `getPurchaseRecord` (single, membership-gated, same-Business enforced). Membership-gated like 005A reads (no catalogue entry needed).
- Customer: `listPurchasesWaitingForCustomer` ("Waiting for You", ownership-scoped) + `getPurchaseRecord` (ownership-enforced). Batch-verify operates strictly on the visible reviewed set (DEC-LOY-006); rejection stays individual-only end-to-end (DEC-LOY-010).
- No reporting dashboards, no cross-business views, no staff-activity feeds in 006A.
- State visibility: customers see their own records in any status; Businesses see their records in any status; rejected records remain visible to both (history rule).

---

## 22. Audit/outbox/Trust Event model

Three distinct concepts, one 006A seam:

- **Transactional audit:** `purchase_record_events` rows (same transaction as the transition) — the queryable per-record history and PRD5 §20 timeline source.
- **Domain outbox:** `purchase_outbox` rows (same transaction) — the reliable handoff to downstream consumers (Cycle package, future notifications, future Trust package). Event payloads: ids + version snapshot + quantity + actor + correlation; never PII beyond the ids the consumer needs.
- **Trust Events / Trust Ledger:** concept owned by the Trust Domain; specified implementation is append-only `trustEvents`. **006A writes zero trustEvents rows and builds no ledger.** The outbox is the exact seam: a future Trust package consumes `purchase_*` / `verified_units_issued` events and writes Trust Events (per-transition, actor-attributed, correlation-chained, TRD10 §10.13.1 schema). This avoids the second-hidden-ledger failure mode by construction.
- Security-relevant denials (e.g. cross-customer access attempts) are security logs per TRD12 §12.39, not Trust Events — 006A follows the existing observability convention, not a new one.

---

## 23. Notification boundary

PRD5 §19 requires a notification per transition, but **no notification infrastructure exists** (no intent store, no templates, no provider adapters, no scheduler). 006A implements **transition + transactional outbox only**; the durable outbox event *is* the notification trigger record. Intent creation, templates, EN/FR copy, preferences/consent, quiet hours, channel selection, bounded retries, and delivery tracking (TRD13 §§13.13–13.28) belong to a future Notification package that consumes the outbox. 006A must not invent a mini-notification system (a second queue would be unowned infrastructure). Reminder/expiry notifications are doubly out of scope (no governed durations exist).

---

## 24. Founder localhost preview flow

Smallest real journey on canonical Git + local PostgreSQL/Docker + Firebase emulators (emulator-only Terms fixture per `FD-PREVIEW-TERMS-001`; no hosted preview; no preview-only product logic):

1. Owner signs in (Business in `trial`), opens Reward Programs, publishes a version (existing 005A UI).
2. Staff/Manager records a qualifying purchase against a test Customer's Loyalty Number (new minimal Business form: artifact + quantity + item label + date).
3. Customer signs in (resolved identity), opens "Waiting for You," sees the purchase with recorder/branch/notes, and verifies.
4. Both sides observe `verified` + issued units (Business pending list clears; customer history shows verified record).
5. Negative paths demonstrable: wrong-customer access denied; double-verify safe; reject path creates no units.

EN/FR parity required for every new string (no Kinyarwanda/Kirundi/Swahili).

---

## 25. EN/FR UI implications

All 006A UI strings (record form, waiting lists, verify/reject screens, reasons, errors) ship in English + French with exact parity, following the 005A i18n pattern (`apps/web/src/i18n/locales/{en,fr}.ts`). Rejection reasons use the PRD5 §15 closed set. No new language, no locale-specific logic.

---

## 26. Open-decision/blocker matrix

| Decision | Status | Affected operation | Blocks 006A? | Why |
|---|---|---|---|---|
| DEC-LOY-008 overflow allocation | OPEN_FOUNDER (D1) | threshold-crossing allocation, pending-unit application, reward creation | **CONDITIONAL** — blocks only crossing behavior | Slice issues units + holds pending (§11.21 shape); agents must stop at crossing per TRD Ch.22 §22.40; `ENG-P7-001`-class issuance may proceed |
| DEC-LOY-013 pause/migration/seasonal | OPEN_FOUNDER (D2) | lifecycle edge cases | No | Only affects pause/migration/seasonal semantics, excluded from slice |
| DEC-SUB-008 catalogue values | OPEN_FOUNDER (D2) | plan catalogue/seed | No | Mechanics confirmed; 006A uses trial/active gate only |
| DEC-PROD-009 reminder/expiry values | OPEN (values) | reminders, expiry transitions | No | Expiry/reminders deferred; no values invented |
| DEC-PROD-010 expired-terminality | OPEN | transition table | No | `expired` unreachable in 006A |
| DEC-PROD-008 partial-quantity verify | OPEN_FOUNDER (D2) | partial verify of multi-qty | No | 006A verifies whole records only |
| DEC-DATA-004 reward_redeemed durability | OPEN_ENGINEERING | cycle transition table | No | Does not touch unit issuance |
| DEC-LOY-014/015 | DO NOT EXIST | — | No | Non-canonical references; ignored by design |
| Version-bump-during-pending (this report §9) | OPEN product question | verification under superseded snapshot | No | Specified fail-safe (snapshot governs + logged delta); flagged for confirmation |
| Shared-number-off enforcement (§10) | OPEN product question | creation gating | No | Snapshotted, unenforced; flagged |
| Verified-unit granularity | Answered by TRD10 §10.11.1 | issuance shape | No | Per-issuance rows with `quantity`; no FD needed |
| DEC-LEGAL-002 trial Terms | OPEN_LEGAL | localhost testing | No | Emulator-only fixture path authorized (FD-PREVIEW-TERMS-001); gates unweakened |

**No open decision blocks the recommended 006A slice.** If the Founder prefers whole-record verification to also wait on DEC-PROD-008, or snapshot-governs to wait on the version-bump question, those would be scope choices, not discovered blockers.

---

## 27. Risks

1. **PRD/TRD pre-freeze status:** the entire product/technical basis is draft-for-approval. A freeze-time change to lifecycle states, unit semantics, or the §11.19 chain could invalidate slice boundaries. Mitigation: every rule cites its source; the authority matrix (§3-equivalent findings inline above) marks draft status explicitly.
2. **DEC-AUTH-002 direction:** Firebase Auth is no longer the target authentication architecture, but no replacement is approved. 006A builds on the current TRD12 chain; an IdP migration would touch verification identity mapping.
3. **Quantity-mapping thinness:** the 1:1 quantity→units mapping rests on examples + DEC-LOY-003 + the schema's `quantity` field, not a normative sentence. A freeze clarification changing this would reshape issuance.
4. **Cycle-package coupling:** the pending-allocation contract (`loyalty_cycle_id NULL` + `verified_units_issued` events) must be honored by the later Cycle package; documented here as a hard interface requirement (§29).
5. **Test-infrastructure load:** the slice adds a third PG test surface (purchase + cross-store + concurrency); shared-machine contention flakes observed in prior packages must be diagnosed, never normalized.
6. **No-notification gap:** users get no transition messages until the Notification package exists; acceptable for localhost verification, not for pilot.

---

## 28. Explicit exclusions

Dispute review (`under_review` workflow), correction/replacement workflow, cancellation, expiry scheduler + `expired` transitions, archival, notification intent creation/delivery/preferences/templates, Loyalty Cycle creation/allocation, pending-unit application, Reward creation/issuance, Redemption, reporting/analytics, billing/plan-capacity enforcement, multi-branch support, phone-number lookup, POS/Mobile-Money/API creation paths, hosted preview, Cloud SQL provisioning, any Firestore purchase/trust/notification collection, any new permission beyond the single specified `purchase.record` catalogue entry.

---

## 29. Recommended PLATFORM-BASELINE-006A scope

1. PG migrations: `purchase_records`, `purchase_record_events`, `verified_units`, `purchase_outbox` (+ down migrations), under existing runner/checksum rules.
2. New disjoint `purchasePermissionCatalogue.ts` (`purchase.record`, Staff/Manager/Owner, trial/active) + structural-copy evaluator branch + `authorizePurchaseRecord` boundary.
3. Commands: `recordPurchaseRecord`, `verifyPurchaseRecord`, `rejectPurchaseRecord` (+ ownership/permission gating, RF-3 ordering, atomic boundaries per §16, idempotency per §17, outbox per §22).
4. Reads: Business pending list + get; customer waiting list + get (§21).
5. Web: minimal Business record form + pending list; minimal Customer waiting list + verify/reject screens; EN/FR parity.
6. Tests: PG unit + cross-store (Firestore emulator) + concurrency (double-verify, verify-vs-reject, double-create) + state-transition tests (valid + TRD19 §19.17 invalid examples) + callable transport tests; Playwright localhost journey (§24).
7. Reports: 006A implementation report; changes-log + implementation-changes entries.
8. Hard interface guarantees to the future Cycle package: `verified_units_issued` event shape; `loyalty_cycle_id NULL = pending`; units immutable; no cycle writes from 006A commands.

Justification: this is the smallest slice in which every persisted state is valid and reachable states have exits (create → verify | reject), no invalid gaps (no command writes a state it cannot justify), and nothing deferred can corrupt what is built (deferred transitions are simply unreachable; deferred packages consume only the outbox seam).

---

## 30. Acceptance criteria

1. Every §28 quality-bar item is answered in this report (authoritative datastore; version binding; immutable fields; initial state; authorized creators; server-side resolution; verification ownership; verification transaction; unit representation; duplicate/concurrent behavior; idempotency; rejection behavior; DB constraints; cross-store races; audit/outbox; inclusions/exclusions) — self-checked during authoring.
2. No product behavior invented: each rule traces to a cited source or is explicitly flagged OPEN with fail-safe specified behavior.
3. No Founder decision required before 006A starts (§26 matrix).
4. 006A implementable without architectural invention (all patterns exist in 001–005A).
5. Independent review approves or reclassifies to BLOCKED with specific gaps.

---

## 31. Final disposition

**PLATFORM-BASELINE-006 — DESIGN COMPLETE / IMPLEMENTATION READY / AWAITING INDEPENDENT REVIEW.**

`PLATFORM-BASELINE-006A` may implement the §29 scope without inventing product or architecture decisions, subject to independent review of this design. Do not begin 006A in this task. Do not merge the design PR.

---

*Report path: `docs/05-implementation/reports/PLATFORM-BASELINE-006-purchase-verification-entry-technical-design-2026-09-14.md`*
*No implementation performed: no code, migrations, callables, UI, permissions, or infrastructure changes. Documentation-only branch with open PR; primary worktree untouched.*
