# PLATFORM-BASELINE-006 — Purchase & Verification Entry / Technical Design

> **Correction `PLATFORM-BASELINE-006-CORR-002` (2026-09-14):** second in-place correction on PR #252 addressing ITR-002 (P1×6/P2×6/P3×2). No Founder decision changed or added (reward-terms version answered from current authority — PRD6 + BR-066/067 — per the task's §12 inspection rule). Conservation model fixed (positions = current; in-place pending→allocated + append-only history); artifact snapshot made truthful; stream-serialization + threshold concurrency defined; minimum `rewards` entitlement at threshold; Trust cardinality + Intent uniqueness; fact-preserving states; single replacement FK. Details + proofs in §33. Disposition is now **DESIGN CORRECTED / ITR-002 FINDINGS ADDRESSED / AWAITING FINAL INDEPENDENT APPROVAL** (§31).

**Date:** 2026-09-14
**Type:** Read-only architecture / technical-design assessment. No product code implemented.
**Authority chain:** `PLATFORM-BASELINE-005` design + `FOUNDER-DISPOSITION-001` + `REVIEW-FINDINGS-001` (all merged, PR #250) → `PLATFORM-BASELINE-005A` implementation + `CORR-001` (merged, PR #251).
**Entry repository state:** `origin/main` `b68a385f204c7086ac8576ae707a66700f2cd5a0` (PLATFORM-BASELINE-005A merge-close). Isolated worktree, detached HEAD, no implementation files touched.

---

## 1. Executive conclusion

> **Correction `PLATFORM-BASELINE-006-FD-CORR-001` (2026-09-14):** this report was corrected in place on PR #252 to record five Founder decisions (`FD-PVL-001`…`FD-PVL-005`) and to close every P1/P2 finding from independent review. The original assessment text is preserved as history in §32; the sections below read as the single current design. Disposition is now **DESIGN CORRECTED / FOUNDER DECISIONS RECORDED / AWAITING INDEPENDENT RE-REVIEW** (§31).

The governed Purchase Verification Lifecycle (PRD5, pre-freeze draft) enters the PostgreSQL-authoritative transactional spine as a bounded first package — **create + verify + reject + raise-dispute, with atomic Verified Unit issuance and immediate Loyalty Cycle allocation (including durable pending-overflow handling)** — on five recorded Founder decisions and without waiting on any remaining open decision. The design below resolves every quality-bar item (§28 of the task) from current authority:

- **No Purchase/Verification product code exists today.** Zero callables, zero collections, zero schedulers, zero notification infrastructure. There is nothing to migrate and no legacy to reconcile — only reusable seams (Customer Identity resolution, Commerce Knowledge validation, idempotency/outbox patterns, permission-catalogue pattern).
- **PostgreSQL authority for the new transactional data is Founder-explicit** (`FD-PVL-001`, recorded on `DEC-DATA-008`): PostgreSQL is the authoritative durable transactional datastore for the new Purchase Record domain, Purchase Verification lifecycle state, Verified Unit domain, and minimum Loyalty Cycle allocation state. No dual authority; no Firestore copy of authoritative Purchase/Verification/Verified Unit state; no direct client PostgreSQL access; Functions/API remain the trusted server boundary. Firestore remains authoritative for Business, Customer Identity, workforce/membership, Branch, and Commerce Knowledge; the purchase domain references them as opaque stable identifiers validated server-side at write time — the same cross-store shape `PLATFORM-BASELINE-005A` shipped.
- **Purchase Records bind to `reward_program_id` AND the exact published `reward_program_version_id` snapshotted at creation, normatively** (`FD-PVL-003`, recorded as `DEC-PROD-014`). Program-only binding is what the PRD text states; version snapshotting is required by the governed history rule (`06 §6`, `BR-067`: historical interpretation must never change when a later version publishes) and by the governed Verified Unit schema itself (TRD10 §10.11.1 carries `rewardProgramVersionId` on every unit row). A version bump landing while a purchase is still pending no longer an open question: the creation snapshot governs — the pending Purchase continues under V1, verification does not rebind it to V2, and later publication never blocks verification of a valid pending Purchase solely because it is no longer current (§9).
- **Verification and Verified Unit creation and Loyalty Cycle allocation are atomic in ONE PostgreSQL transaction** (lock → state-check → transition → issue units → allocate into cycle / hold overflow pending → Trust Event → Notification Intent → complete idempotency → outbox). `DEC-LOY-008` is resolved by `FD-PVL-002`: units allocate sequentially into the current active cycle up to exactly 10 (`reward_available` at 10); overflow beyond a full current cycle becomes durable, ordered, traceable pending allocation — never discarded, never a second concurrent active cycle — and applies forward in order after redemption. The prior universal-pending-unit design is superseded (§32 preserves the reasoning change).
- **Five Founder decisions close the slice edges.** Version-bump semantics (`FD-PVL-003`), shared-number-off enforcement (`FD-PVL-005`: `sharedLoyaltyNumberAllowed = false` ⇒ current QR Identity required), whole-record verify/reject/dispute with no partial verification (`FD-PVL-004`, resolving `DEC-PROD-008` for MVP), immediate allocation + overflow (`FD-PVL-002`), and explicit PostgreSQL authority (`FD-PVL-001`) are all decided. The remaining open decisions (expiry values, pause/migration, catalogue values, Business-side dispute review) affect only explicitly deferred scope.

**Recommended `006A` scope (20 items, §29):** Purchase Record foundation; lifecycle events; Trust Event foundation (Purchase/Unit/Cycle/Reward); Verified Unit foundation; Cycle stream + aggregate foundation; allocation-position + allocation-history foundation; minimum Reward entitlement at threshold; Notification Intent foundation; `purchase.record` permission; `recordPurchase`; `verifyPurchase`; `rejectPurchase`; `raisePurchaseDispute`; Business/customer reads; EN/FR minimum UI; atomic verify→unit→cycle→reward transaction; idempotency; outbox; conservation/concurrency tests; localhost Founder flow.

**Disposition: DESIGN CORRECTED / ITR-002 FINDINGS ADDRESSED / AWAITING FINAL INDEPENDENT APPROVAL** (see §§31, 33).

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
11. Remaining open product questions (§26): expiry values; pause/migration/seasonal variants; catalogue values; Business-side dispute review/correction UX. `FD-CORR-001` resolved version-bump-during-pending (`FD-PVL-003`/`DEC-PROD-014`), shared-number-off enforcement (`FD-PVL-005`), partial-quantity verification for MVP (`FD-PVL-004`/`DEC-PROD-008`), overflow allocation (`FD-PVL-002`/`DEC-LOY-008`), and explicit PostgreSQL authority (`FD-PVL-001`).

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
| H | Trust/audit events | **Authoritative Trust Events: PostgreSQL (006A)** — every Purchase lifecycle transition writes its authoritative Trust Event row (`trust_events`) **inside the same PG transaction** as the state change (translating the governed TRD10 §10.13.1 `TrustEventDocument` semantics into the PG spine: event type/version, actor, subject/reference, Purchase/Business/Customer, correlation id, timestamp, immutable payload, schema version; §22). `purchase_record_events` remains the per-record lifecycle timeline; `purchase_outbox` remains the delivery/integration mechanism. Exactly one trust ledger (§20) | native tables |
| I | Notifications/outbox | Notification **intents: PG (006A)** — every Purchase transition creates a durable Notification Intent in-transaction (§23); notification **delivery** (channels/provider, retry, quiet hours, consent): **deferred** to Notification/Integration domains. Outbox events: **PG (006A)** | native + outbox seam |
| J | Reporting metadata (unit value/currency, item descriptors) | Stored on the PG purchase row as **write-only-for-reporting** nullable columns; `DEC-DATA-003` forbids the loyalty engine from reading them (lint/guard in 006A) | native columns, engine-blind |

**Derivation (not assertion):** `DEC-DATA-008` CONFIRMED makes PostgreSQL the authoritative durable transactional datastore and states Firestore is "no longer presumed" primary; `DEC-DATA-001` requires server-only authoritative writes for exactly this class of records (Purchase Records, verification outcomes, Verified Units named); every PG Baseline package since 001 has moved new transactional state to PostgreSQL while leaving existing Firestore authorities untouched; the purchase domain has no Firestore presence to preserve, so there is no dual-authority question — only stable references outward (Business, Customer Identity, Branch, Commerce Knowledge, actor ids as opaque indexed `TEXT`, validated server-side at write time, exactly the 005A cross-store shape).

---

## 8. Purchase Record identity model

- **Primary id:** PostgreSQL-generated `UUID` (`gen_random_uuid()`, PK). Rationale: the record is platform-created inside the creation transaction; no offline deterministic-id requirement is governed (TRD10 §10.28 offline keys concern client retries, which idempotency keys already cover). Application-generated ids would add collision handling for no governed benefit.
- **Business:** `business_id TEXT NOT NULL` — opaque Firestore Business id (indexed, never PG FK).
- **Presented artifact (A — exactly what the Business submitted):** `presented_artifact_type TEXT NOT NULL CHECK (presented_artifact_type IN ('loyalty_number','qr_identity'))` + `presented_artifact_reference TEXT NOT NULL` (the raw submitted value: the loyalty-number string or the QR reference). Exactly one presentation form per Purchase — the client submits one artifact, never a Customer domain id (anti-enumeration + flow requirement). The column names say what they are: presented input, never authority.
- **Resolved Customer Identity (B — server-authoritative):** `customer_identity_id TEXT NOT NULL` — opaque Firestore Customer Identity id (`users/{id}` identity, resolved server-side via `identityLookupRepository`, §10). Resolution happens before the PG transaction (external authority); the final accept/reject decision uses the locked Program Version policy inside the transaction (§§12, 18).
- **Canonical Loyalty Number snapshot (C — server-derived, display-only):** `canonical_loyalty_number_value TEXT NOT NULL` — derived server-side at creation from the resolved identity (exactly one Loyalty Number per identity is governed by `DEC-CUST-ID-ART-001`, so the value always exists regardless of presentation path). It is a historical display/reporting snapshot: never read as presented input, never read as identity authority. `NOT NULL` is justified because the derivation source is total over resolved identities; a NULL would falsely suggest "no number exists".
- Later artifact regeneration/rotation never rewrites any of these three columns (insert-only snapshot convention).
- **Reward Program + version:** `reward_program_id UUID NOT NULL REFERENCES reward_programs(id)` + `reward_program_version_id UUID NOT NULL REFERENCES reward_program_versions(id)` — the creation-time **active** version snapshotted at creation (§9 for why both).
- **Recorder:** `recorded_by_user_id TEXT NOT NULL` (server-resolved actor) + `recorded_by_role TEXT NOT NULL` (`staff|manager|owner` as resolved, for audit display).
- **Branch:** `branch_id TEXT NOT NULL` — the Business's default branch (single-branch model; informational, visible on the verification screen per PRD5 §14).
- **Commercial snapshot (immutable):** `quantity INTEGER NOT NULL CHECK (quantity >= 1)`; `item_label TEXT NOT NULL` (customer-visible descriptor, e.g. "Coffee"); `knowledge_node_id TEXT NULL` (optional qualifying Commerce Knowledge ref, validated at creation iff present); `unit_value_minor INTEGER NULL` + `currency TEXT NULL` (reporting-only per DEC-DATA-003; engine must not read); `purchase_date TIMESTAMPTZ NOT NULL` (business-asserted commercial date, sanity-bounded, not future); `notes TEXT NULL` (customer-visible free text).
- **Lifecycle:** `status TEXT NOT NULL` (8-state CHECK) + `purchase_record_events` append-only history (§15).
- **Correction linkage (forward-compatible, unused by 006A commands):** `replaces_purchase_record_id UUID NULL REFERENCES purchase_records(id)` — one directional FK on the replacement; the reverse is a query, never a second column (§19).
- **Integrity/ops:** `correlation_id TEXT NOT NULL`, `recorded_at TIMESTAMPTZ` (server commit time), `created_at/updated_at`, `schema_version INTEGER DEFAULT 1`. Optimistic concurrency via state-conditional `UPDATE … WHERE status = …` (005A `publishVersion` precedent); no separate `row_version` needed because transitions are single-writer state-machine steps, not multi-field edits.

---

## 9. Reward Program/version binding

**Conclusion (`FD-PVL-003`, recorded as `DEC-PROD-014` — normative, no longer an open question): bind to `reward_program_id` AND the exact published `reward_program_version_id` active at creation.**

- Program-only binding is all the PRD text states (`BR-049`, `FR-PVL-003`, PRD5 §5 Identity lists "Reward Program ID"). Standing alone it under-specifies history: `06 §6` + `BR-067` + `FR-RP-010` require that historical interpretation never change when a later version publishes, and the governed unit schema (TRD10 §10.11.1) puts `rewardProgramVersionId` on **every** unit row — a version must therefore be resolved no later than issuance. The only consistent resolution point available at both creation and issuance is the creation-time active version.
- **Creation rule:** the referenced program must be `active` with a non-null `current_version_id`; the purchase snapshots that version id. Creation against a program with no published version fails closed (`no-active-version` domain error). Program/version eligibility is proven inside the creation transaction against the locked program + version rows (§18), and program/version same-program integrity is enforced relationally (composite FK; §20) — not by application prechecks alone.
- **Verification rule:** units, allocation rows, Trust Events, and Notification Intents carry the purchase's snapshotted version; no re-resolution occurs at verification.
- **Version-bump-during-pending (DECIDED — `FD-PVL-003`):** if a new version publishes between creation and verification, the pending Purchase continues under its V1 snapshot — verification does not rebind it to V2, V1 remains its historical interpretation authority, and produced Verified Units and Cycle allocation carry the original V1 reference. Later version publication never blocks verification of a valid pending Purchase solely because it is no longer current. The verification event payload logs the version delta (snapshot vs program-current) for traceability.
- A pending purchase never blocks version activation (no lock is taken on the program row at creation beyond the transaction's own snapshot; §18).

---

## 10. Customer resolution model

- **What the client submits:** exactly one of `loyaltyNumberValue` or `qrReference` (canonical per PRD5 §9: "Customer Loyalty Number or QR"), plus commercial fields. The client **never** submits a Customer domain id (anti-enumeration + flow requirement).
- **What the server resolves:** `lookupCustomerIdentityByLoyaltyNumber` or `lookupCustomerIdentityByQrReference` (`identityLookupRepository.ts`) → Customer Identity id → stored as `customer_identity_id`. Unknown/inactive artifacts fail closed with a non-enumerating error. No phone lookup exists (confirmed absent — §6.10); phone-based recording remains future and is not in 006A.
- **What is stored (§8 A/B/C):** the presented pair (`presented_artifact_type` + `presented_artifact_reference`), the resolved identity id, and the server-derived canonical Loyalty Number snapshot. Shared-number behavior: the artifact resolves to its registered owner, the record attaches to the owner, and only the owner can verify (DEC-LOY-007; PRD5 §11; PRD4 §9). The presenter is not identified and no presenter field is stored. Successful artifact resolution does **not** imply acceptance — the locked Version policy decides inside the transaction (§18): an LN may resolve perfectly and still be rejected when the locked version says `shared=false`.
- **Preserved invariants:** one Loyalty Number + one current QR per identity; server-authoritative resolution; reads (including the new pending-list reads) never create/repair artifacts — they use the read-only lookup path only.
- **Shared-number-off (DECIDED — `FD-PVL-005`, recorded on `DEC-LOY-007`):** the version's `sharedLoyaltyNumberAllowed` flag is operational at creation, not merely snapshotted. When `true`, creation accepts the Loyalty Number **or** the current QR Identity. When `false`, a Loyalty Number alone is insufficient — the Business must present the Customer's **CURRENT QR Identity**: the server resolves the QR authoritatively through the existing lookup path (which fails closed on unknown/inactive references), confirms it is the current active QR Identity, stores the resolved Customer Identity, and stores the artifact snapshot for historical traceability. QR here is the stronger current customer-controlled platform artifact — not biometric or legal proof of physical identity. No presenter identity model, no recorder attestation model, and no phone-number fallback are introduced. Design matrix (all five enforced server-side):
  - `shared=true + LN → allowed` · `shared=true + QR → allowed` · `shared=false + LN → reject` · `shared=false + current QR → allowed` · `shared=false + stale QR → reject`.
- The `shared_loyalty_number_allowed` value is additionally snapshotted on the purchase row so history never depends on re-reading the (possibly superseded) version.

---

## 11. Business actor/permission model

- **Recording purchases:** no permission exists today (`purchase.record` is an ungoverned-example string; evaluator returns `NO_APPLICABLE_GRANT`). 006A requires exactly one new disjoint catalogue module (pattern-mirror of `rewardProgramPermissionCatalogue.ts`): e.g. `purchasePermissionCatalogue.ts` with a single entry `purchase.record`, load-time cross-catalogue collision invariant, declarative `eligibleBusinessStatuses: ["trial", "active"]`, and a structural-copy evaluator branch. **Role mapping is product-governed, not invented:** PRD5 §8 authorizes Staff, Manager, and Business Owner (`roleDefaults: owner/manager/staff true`), unlike the Owner-only `rewardProgram.manage`. **Business-state scope is retained as architecture-aligned Founder-approved scope for 006A:** `trial` eligibility is product-consistent — the localhost Founder flow (§24) records purchases for a `trial` Business, and no authority contradicts trial recording (the catalogue lifecycle gate pattern from 005A applies unchanged). Specified here, implemented in 006A (permission plumbing is inseparable from the creation command).
- **Customer verify/reject:** no catalogue entry — ownership check (`purchase.customer_identity_id == server-resolved customer identity`), mirroring the membership-gated-reads precedent and TRD12 SR-004/FR-SEC-004. Rejection is strictly individual (DEC-LOY-010); batch verify limited to the visible reviewed set (DEC-LOY-006) — enforced server-side, never by UI alone.
- **Deferred authorities (separate from 006A, no widening):** dispute review, correction/replacement approval, cancellation, archival, and any Manager-delegation changes each need their own authority decision in later packages. `reward.override`, `transaction.reverse`, and `business.configureFraudRules` already exist as Owner-only sensitive permissions and are **not** purchase-correction authorities — 006A must not borrow them.

---

## 12. Purchase creation contract

`recordPurchaseRecord` (name follows the `<domain><Action><Object>` suggestion; exact callable naming is non-normative):

- **Authorized actors:** active Staff/Manager/Owner membership via new `purchase.record` permission (§11). Recorder identity + role server-resolved and stored.
- **Business eligibility:** `trial`/`active` via the catalogue lifecycle gate (005A pattern). Suspended/expired/closed fail closed.
- **Customer resolution:** §10 — exactly one artifact parsed (`loyaltyNumberValue` XOR `qrReference`); resolved via the matching lookup to a Customer Identity id, fail-closed (unknown/inactive → non-enumerating error; stale QR → reject). Resolution success is provisional: acceptance is decided in-transaction (step 10).
- **Reward Program eligibility (authoritative, PG-local — §18):** proven inside the creation transaction against the locked program + version rows: same Business (composite-FK backstop, §20); program `active`; the exact active/current version selected; version status `active`. Snapshot program id + version id + `shared_loyalty_number_allowed` + `multiple_units_allowed` on the row.
- **Quantity/caps/shared (locked-version rules ONLY):** no quantity, cap, or shared-policy validation is final before the locked version is available. Inside the transaction, against the locked version: `multipleUnitsAllowed=false` ⇒ `quantity` must be `1`; optional `Maximum Units per Purchase Record` enforced as a hard cap; `quantity >= 1`; if `presented_artifact_type='loyalty_number'` and locked `sharedLoyaltyNumberAllowed=false` ⇒ reject before insert. Bulk/quantity review thresholds recorded as review-visibility only (DEC-LOY-003: never auto-reject). Creation against a program with no published version fails closed (`no-active-version`).
- **Commerce Knowledge validation:** optional `knowledge_node_id` validated via `validateQualifyingNodes`-equivalent (active-type eligibility) in the authoritative Firestore read **before** the PG transaction (RF-3 discipline applies only to genuinely external authorities — §18); category/standard-node checks are not purchase concerns.
- **Quantity:** integer `>= 1`. No monetary math anywhere near it.
- **Monetary metadata:** optional `unit_value_minor` (integer minor units per DEC-DATA-002) + `currency`; stored, never read by loyalty logic (DEC-DATA-003 guard).
- **Notes:** optional free text, customer-visible.
- **Idempotency:** client-supplied key, operation type `purchase.create`, request hash binds actor + business + customer artifact + program/version + commercial snapshot; same-key/same-request replays the created record; same-key/different-request conflicts; rollback rolls back the reservation with the transaction (005A pattern).
- **Correlation/audit/outbox:** server-generated `correlationId`; `purchase_recorded` outbox event + `purchase_record_events` creation row, same transaction.
- **Initial state:** exactly `waiting_for_customer`. `Draft`/`Recorded` are transient workflow moments (PRD5 §7 note), never stored values — the creation transaction writes the row directly in `waiting_for_customer`.
- **Creation sequence (fail-closed; version-derived validation only on the locked version):**
  1. authenticate; 2. resolve Business actor/membership from Firestore; 3. parse exactly one presented Customer artifact; 4. resolve the artifact in Firestore (provisional); 5. validate external Firestore authorities (Business, membership, current-QR-if-QR-path, Branch, Commerce Knowledge); 6. BEGIN PostgreSQL transaction; 7. lock Reward Program; 8. lock current Reward Program Version; 9. prove program∈Business, program active, version is current/active, and read the locked `sharedLoyaltyNumberAllowed`, `multipleUnitsAllowed`, version maximum; 10. if artifact is loyalty_number and locked `shared=false` ⇒ reject before insert; 11. validate quantity against locked Version rules; 12. reserve idempotency key; 13. insert Purchase snapshot (presented pair + resolved identity + canonical LN + locked program/version); 14. lifecycle event; 15. Trust Event; 16. Notification Intent; 17. outbox; 18. complete idempotency; 19. COMMIT.
  Any failure before the transaction leaves zero PG state; any failure inside rolls back everything including the reservation. PostgreSQL-owned checks are never a read→commit race across the boundary — they execute under the transaction's locked snapshot (§18).

---

## 13. Purchase lifecycle/state model

Stored `status` CHECK over the 8 canonical states (`waiting_for_customer, verified, rejected, under_review, corrected, cancelled, expired, archived`). 006A implements exactly four transitions (`FD-PVL-004`); all others are unreachable by any 006A command (command allow-list, not DB — the CHECK admits the full enum for forward compatibility):

| Transition | Actor | Effect |
|---|---|---|
| `∅ → waiting_for_customer` | Staff/Manager/Owner | creation (§12) |
| `waiting_for_customer → verified` | registered Customer only | §14 + atomic unit issuance + Cycle allocation (§16) |
| `waiting_for_customer → rejected` | registered Customer only | no units; reason code required (bounded vocabulary, §15); terminal in 006A |
| `waiting_for_customer → under_review` | registered Customer only | no units; mandatory dispute reason (§14); safe durable holding state in 006A |

Governed-invalid examples 006A must enforce (TRD19 §19.17): `verified → waiting_for_customer`, `rejected → verified` without approved resolution, `cancelled → verified`, `under_review → verified` without a governed replacement — all rejected with standardized errors and zero partial writes. `corrected/cancelled/expired/archived` have no 006A writer; Business-side dispute review, correction→replacement, expiry, and archival belong to later packages (`PLATFORM-BASELINE-006B` or equivalent, §14). The `rejected → under_review` question (PRD5 §6 vs §7 tension) stays deferred with the dispute package — 006A treats `rejected` as terminal. Disputes are never silently redirected into rejection: `raisePurchaseDispute` is its own command with its own event, Trust Event, and Notification Intent. State integrity preserves historical facts rather than nulling them: a fact required when its transition occurred (e.g. `verified_at`, `rejection_reason`, `dispute_reason`) is never erased by a later status change, while incompatible simultaneous verdict facts are prevented — full rules in §§19–20.

---

## 14. Verification contract

`verifyPurchaseRecord` (customer-authenticated callable):

- **Identity:** Firebase Auth token → server-resolved Customer Identity (current TRD12 chain; `DEC-AUTH-002` caveat recorded — no replacement IdP is approved, so 006A uses the current mechanism). Client-supplied customer id/role never trusted; ownership proved as `purchase.customer_identity_id == resolved identity`, inside the transaction after row lock.
- **Allowed source state:** `waiting_for_customer` only (re-locked row; concurrent first-writer wins, losers get a standardized stale-state error, never partial effects).
- **Creation-time version binding re-checked:** the locked row's `reward_program_version_id` governs issuance/allocation — never re-resolved to program-current (`FD-PVL-003`).
- **Idempotency:** operation type `purchase.verify`, hash binds purchase + actor; same-key replay returns the verification result; double-clicks and retries are safe. Simultaneous verify-vs-reject-vs-dispute on one record serializes on the row lock — exactly one transition commits.
- **Timestamp/attribution:** server commit time as `verified_at`; actor = resolved identity id; optional customer response/note stored on the verification event row.
- **Atomic effects (§16):** `verified` status + durably created units (§15) + serialized Cycle-stream allocation / pending-overflow positions (§§15–16) + minimum Reward entitlement exactly when the threshold is reached (§15) + `purchase_record_events` transition row + causal + subject Trust Events (§22) + source-linked Notification Intent(s) (§23) + `purchase_outbox` events + idempotency completion — **all in one PG transaction**; any failure rolls back everything. Returned with resulting unit + cycle (+ reward where created) totals.
- `rejectPurchaseRecord` mirrors this with `purchase_rejected`, a mandatory reason code from the bounded vocabulary (§15), and **no** unit writes.
- `raisePurchaseDispute` (customer-authenticated callable, in 006A scope per `FD-PVL-004`):
  - authenticated Customer; server-resolved identity; Purchase ownership check; source state `waiting_for_customer` only; **mandatory dispute reason** (wrong quantity / wrong item-service / partially inaccurate record — never a silent redirect into rejection);
  - `waiting_for_customer → under_review`; **no Verified Units**;
  - appends `purchase_record_events` row + authoritative Trust Event + Notification Intent (to Business) + outbox — **all in one PG transaction** with idempotency (`purchase.dispute`).
  - Business review/correction is deferred to `PLATFORM-BASELINE-006B` or equivalent: `under_review` is a safe durable holding state — no unit issuance occurs until a replacement Purchase is separately verified. 006A offers no Business-side resolution/correction command, and the design boundary is coherent because the holding state is terminal-for-006A on the customer side (no customer command exits `under_review` in 006A).

---

## 15. Verified Unit model

Governed representation (TRD10 §10.11.1): each row records an authoritative issuance **or reversal**; fields `customerId, businessId, rewardProgramId, rewardProgramVersionId, loyaltyCycleId, purchaseRecordId, quantity, entryType ("credit"|"reversal"), reasonCode, createdAt, createdBy, schemaVersion`, with the Unit Rule (no mutable-counter counting; the supporting record must exist), DA-002/DA-003, FR-DATA-004/006.

**006A mapping (PostgreSQL `verified_units`) — `FD-PVL-002`/`FD-PVL-004`:**

- One credit row per verified purchase (`quantity` = purchase quantity — the per-issuance shape the schema's `quantity` field specifies; no per-unit ordinal rows required by any authority). Partial unique index `UNIQUE (purchase_record_id) WHERE entry_type = 'credit'` makes double-issuance structurally impossible. Whole-record verification only (`FD-PVL-004`): `units issued = purchase quantity`, no partial issuance.
- Copied identifiers (business, customer, program, version) must equal the originating Purchase row's — enforced by a composite FK against a composite UNIQUE on `purchase_records`, not by application prechecks (§20). `verified_units` additionally carries its own composite identity-tuple UNIQUE so allocation rows prove their copied scope against the exact credit; the version column on allocation rows pins that exact tuple (each copied field serves a named FK — §20 documents the one justified duplication rather than silently repeating truth).
- Rows are insert-only: no 006A command updates or deletes a unit row (command-layer convention, 005A-style, documented on the table).

**Allocation-position model (`verified_unit_allocations` = CURRENT positions — CORR-002 conservation fix):**

- The prior "forward movement writes NEW rows" design double-counts (2 allocated + 2 pending + a new 2 allocated = 6 rows of quantity from a credit of 4). It is superseded: allocation rows represent **current** positions only, and a pending position transitions to allocated **on the same row** when the next cycle opens. No new quantity position is ever created by movement.
- Hard invariant: `credit.quantity = SUM(current allocation-position quantities)` at all times, where current positions include both `allocated` and `pending` rows. Example — credit of 4: position A (2, allocated, Cycle 1) + position B (2, pending). After the next cycle opens: position B becomes (2, allocated, Cycle 2) **on the same row**; no third row exists; the sum is still 4.
- Splits across the threshold write one row per position (e.g. 2 allocated + 2 pending), each with `allocation_order`; the rows for one credit always sum to the credit quantity by construction of the verify transaction.
- Deterministic ordering: positions apply in `(occurred_at, verified_unit_id, allocation_order)` order; pending positions convert in that order when cycles open. Replay-safe via idempotency completion (§16) — a replayed verify returns the stored result (backstopped by the one-credit-per-purchase index and the one-reward-per-cycle index).

**Allocation history (`verified_unit_allocation_events` — append-only, never positions):**

- Every movement (initial placement, pending→allocated conversion, future correction adjustments) appends one event row capturing: allocation position id, verified unit id, `from_state`/`to_state`, `from_cycle_id` NULL / `to_cycle_id` NULL, quantity, correlation id, reason/event type, `occurred_at`, schema version (§20).
- Historical rows are never read as current quantity. Current-position queries touch only `verified_unit_allocations`; audits/reconciliation read the events table. The two are never mixed.

**Minimum Loyalty Cycle row (006A foundation, not the full future Cycle feature set):** `id` + `business_id` + `customer_identity_id` + `reward_program_id` + `opened_under_version_id` + `sequence_number` (per customer+program, drawn from the stream row counter, §16) + `state ('active'|'reward_available'|'reward_redeemed'|'closed')` + `allocated_units` + `created_at/updated_at` + `correlation_id` + `schema_version`. Threshold is exactly 10 (`DEC-LOY-001`): the cycle flips to `reward_available` at 10, with `CHECK (0 <= allocated_units <= 10)`. Exactly one current `active`/`reward_available` cycle per customer+program (`DEC-LOY-002`), enforced by a partial unique index (§20). Relational scope is proven by composite FKs: version∈program, program∈Business, and the cycle identity tuple anchoring allocation scope (§20). Each cycle belongs to its stream parent row (`loyalty_cycle_streams`), which serializes the allocation stream and owns the sequence counter (§16).

**Minimum Reward entitlement (`rewards` — REQUIRED in 006A):**

- Current authority requires Reward creation at threshold (BR-064: reaching the required units makes the reward available immediately; BR-069; TRD10 §10.12.1 `rewards`/`RewardDocument`), so the conditional language is removed: the threshold transaction creates the minimum Reward entitlement exactly once. No redemption behavior is invented (redemption stays deferred, §28).
- Minimum row (consistent with governed `RewardDocument` vocabulary): `id` + `loyalty_cycle_id` + `business_id` + `customer_identity_id` + `reward_program_id` + `reward_program_version_id` + `reward_description` (terms snapshot) + `reward_quantity CHECK = 1` (`DEC-LOY-009`: fixed at exactly 1) + `state` (canonical enum `available|redeemed|cancelled|expired`; 006A writes only `available`) + `available_at` + `created_at` + `correlation_id` + `schema_version`. DB: exactly one Reward per qualifying cycle (`UNIQUE(loyalty_cycle_id)`); same-scope composite FKs; quantity CHECK.
- **Reward version semantics (authority-inspected, no new Founder decision):** the entitlement carries the **cycle's governing version** (`opened_under_version_id`), with `reward_description` snapshotted from that version row. Basis: PRD6 requires historical cycles to keep referencing "the version that governed them" with rules never rewritten (BR-066/067, FR-RP-009/010); `reward_description` lives on the version row; the threshold event fires under the cycle's immutable rules, not under whatever program-current version happens to exist at crossing time. Mixed unit versions inside the cycle do not change this — units carry their own creation-time refs (`FD-PVL-003`); the Reward carries the cycle's governing terms. If a future package discovers a genuine conflict with this reading, that — and only that — would be a new Founder-decision point.

**Reversal future-safety (no 006A writer; schema must not foreclose correction):** a future correction command must (a) lock the original credit row; (b) prove the correction Purchase validly replaces the original (`replaces_purchase_record_id` chain); (c) prove reversal identifiers/scope match the original credit tuple; (d) compute remaining reversible quantity **transactionally** (`sum(existing reversals) + new reversal <= credit quantity`); (e) transition current allocation positions consistently (never leaving orphan quantity); (f) adjust Cycle/Reward state under future governed correction semantics (e.g. a threshold un-crossing rule the correction package will govern — not invented here). The `UNIQUE(reverses, correction)` index is a duplicate guard only — it does not solve over-reversal; the transactional sum check does. The schema carries `reverses_verified_unit_id` + `correction_purchase_record_id` so all of the above is expressible without migration.

**Reason vocabularies (bounded, closed):**
- *Reject* ("should not count at all"): `did_not_happen` · `duplicate` · `wrong_customer` · `wrong_program` · `wholly_invalid`. Never used for quantity/item inaccuracies.
- *Dispute* ("occurred, but details wrong"): `wrong_quantity` · `wrong_item` · `partially_inaccurate`. Mandatory on `raisePurchaseDispute`; stored on the event row and carried into the Trust Event + Notification Intent.

---

## 16. Atomic transaction boundaries

**Verification boundary (the package's load-bearing guarantee) — one PostgreSQL transaction (`FD-PVL-002`):**

```text
BEGIN PG TRANSACTION
 1. Reserve/check idempotency key (`purchase.verify`).
 2. Lock Purchase Record (`SELECT … FOR UPDATE`).
 3. Re-check: status == waiting_for_customer; Customer ownership;
    creation-time Reward Program version binding (snapshot governs).
 4. Transition Purchase → verified (`verified_at` = server commit time).
 5. Append purchase_record_event.
 6. Ensure + lock the allocation stream (loyalty_cycle_streams row for
    Business+Customer+Program: INSERT … ON CONFLICT DO NOTHING, then
    SELECT … FOR UPDATE — §9 mechanism below).
 7. Resolve/lock current Loyalty Cycle (create it under the stream lock
    if none exists, drawing sequence from the stream counter).
 8. Re-read cycle progress under the lock; allocate unit quantity:
    fill up to 10 → flip to reward_available at exactly 10 (+ minimum
    Reward entitlement, steps T1–T12 below) → overflow becomes pending
    positions per FD-PVL-002 (never a second concurrent active cycle).
 9. Write allocation position rows (exact traceability) + allocation
    event rows (movement history).
10. Append causal + subject Trust Events (§22).
11. Create source-linked Notification Intent(s) (§23).
12. Write downstream outbox event(s) (purchase_verified, verified_units_issued,
    loyalty_cycle_allocated / loyalty_cycle_reward_available / reward_available
    as applicable).
13. Complete idempotency key.
COMMIT — any failure ROLLBACKs everything.
```

**Threshold sub-transaction (inside the same verify transaction — required, not conditional):** when the cycle reaches exactly 10: 1. cycle is locked (step 7); 2. unit quantity allocated up to 10; 3. progress becomes exactly 10; 4. minimum Reward entitlement created (version = cycle governing version, §15); 5. `UNIQUE(loyalty_cycle_id)` enforced — exactly one Reward per cycle, created exactly once; 6. cycle → `reward_available`; 7. Purchase/Unit/Cycle/Reward Trust Events appended; 8. customer `reward_available` Notification Intent created; 9. outbox events written; 10. overflow remains pending positions; 11. idempotency completed; 12. COMMIT with the outer transaction. Redemption remains out of scope — but pending→allocated conversion mechanics (§15) are defined now so the future redemption package moves positions without inventing semantics (006A itself writes pending rows and never moves them: no redemption writer exists yet).

**Cycle-stream concurrency (mechanism B — dedicated parent row, chosen over advisory locks):** a `SELECT … FOR UPDATE` cannot lock a missing first cycle, so the stream is serialized on an explicit `loyalty_cycle_streams` row keyed `(business_id, customer_identity_id, reward_program_id)`, created idempotently (`INSERT … ON CONFLICT DO NOTHING` — the conflict path is the designed concurrent-arrival path, never a leaked raw violation) and then locked. Chosen over transaction-scoped advisory locks because the stream row is inspectable in SQL, participates in FK graphs (cycles reference their stream), uses ordinary row-lock failure behavior (no session-lock lifecycle pitfalls, no key-hash collision surface), and owns the cycle sequence counter (no `MAX()+1` race). The partial-unique current-cycle index remains as DB backstop. Global lock ordering inside every transaction (deadlock prevention): idempotency key → purchase → stream → cycle → reward → outbox/intent/event appends. Proven scenarios (§29 tests must cover all four): (a) two concurrent first verifications create exactly one current cycle and both allocations land with correct progress; (b) two concurrent verifications at 9/10 serialize — exactly one crosses the threshold (progress re-checked under lock), creates the single Reward, and the other becomes overflow pending with no overfill above 10; (c) replay of a threshold-crossing verify returns the stored idempotent result (no second credit, no second reward — backstopped by both UNIQUEs); (d) pending positions convert in order when later cycles open, with sums preserved (§15 invariant).

No Purchase may be verified without durable unit issuance **and** the correct Cycle/allocation result **and** the Reward where threshold requires **and** the Trust Events **and** idempotency completion.

**Creation boundary:** the 19-step sequence in §12 — pre-transaction external reads, then one transaction: lock program → lock version → prove eligibility → shared-gate → locked-rule quantity validation → idempotency reservation → insert `purchase_records` (`waiting_for_customer`) → creation event → Trust Event → Notification Intent (Purchase recorded → Customer) → outbox (`purchase_recorded`) → complete key.

**Rejection boundary:** lock → re-check → `waiting → rejected` (mandatory bounded reason) → no unit writes → Purchase Event → Trust Event → Notification Intent (→ Business) → outbox → idempotency completion. One transaction.

**Dispute boundary:** lock → re-check → `waiting → under_review` (mandatory dispute reason) → no unit writes → Purchase Event → Trust Event → Notification Intent (→ Business) → outbox → idempotency completion. One transaction.

**Why Cycle allocation moved inside the transaction (supersedes the original Option A):** the original design excluded cycle mutation because `DEC-LOY-008` was `OPEN_FOUNDER`. `FD-PVL-002` resolves it: immediate allocation is now governed, and universal pending units are explicitly NOT approved — so the atomicity principle covers units **and** allocation. The TRD11 §11.15 "same transaction or reliable event consumer" option is now exercised as same-transaction. §32 preserves the original reasoning as history.

---

## 17. Idempotency/concurrency model

Reuse the generic PG `idempotency_keys` table with new operation types `purchase.create`, `purchase.verify`, `purchase.reject`, `purchase.dispute` (domain-prefix namespacing avoids 0004 collisions):

- **Request hashes** bind actor + business + target (purchase id for verify/reject; artifact + program/version + commercial snapshot for create) + content fingerprint, mirroring `rewardProgramRequestHash`.
- **Replay:** same-key/same-request returns the stored result (created record / verification outcome). **Conflict:** same-key/different-request → governed `IDEMPOTENCY_CONFLICT`. **In-progress:** concurrent same-key → retryable `TEMPORARY_UNAVAILABLE`. **Rollback:** reservation lives inside the domain transaction — a throw rolls it back; the next attempt sees "no record" (retryable).
- **Races decided by the database, not the UI:** double-submit create (unique key + reservation), double-verify (purchase row lock + stream lock + conditional transition + partial-unique credit index + one-reward-per-cycle index — quadruple backstop), simultaneous verify-vs-reject-vs-dispute (purchase row lock serializes; losers fail closed on state), concurrent first-cycle creation (stream-row `INSERT … ON CONFLICT DO NOTHING` + lock; the conflict path is designed, never a leaked violation), replay-after-success (peek short-circuit before preconditions, the 005A publish-replay fix pattern).
- Web hooks reuse `keyForRequest` rotation + `settleKeyOnError` (005A precedent) so a retained key never leaks across purchases.

---

## 18. Cross-store validation model

Pre-transaction ordering for every 006A write (RF-3 discipline, corrected P2-9): 1. authenticate → 2. authorize: resolve Business actor/membership (Firestore read) → 3. parse exactly one presented artifact → 4. resolve the artifact in Firestore (provisional — acceptance still pending) → 5. validate external Firestore authorities: Business, membership, current-QR-if-QR-path, Branch, Commerce Knowledge refs (iff present) → **then** open the PG transaction. Reward Program is PostgreSQL-owned, so program/version eligibility checks that can be authoritative inside PostgreSQL **execute inside the transaction** — a PostgreSQL read→PostgreSQL commit race is never accepted as if it were a cross-store race:

```text
BEGIN → SELECT program … FOR UPDATE → SELECT current version … FOR UPDATE
→ prove: same Business (composite-FK backstop) · program status active
· locked version id == program.current_version_id (exact active/current
selected) · version status active (eligible for new Purchase creation)
→ INSERT purchase (snapshotted ids + flags) → events/trust/intent/outbox → COMMIT
```

For verification, the program/version proof reduces to the locked Purchase row's own snapshot (no re-resolution; `FD-PVL-003`), plus the cycle lock for the allocation step (§16).

Keep pre-PG authoritative checks only for genuinely external (Firestore-owned) authorities. A mutation landing after the Firestore validation read but before the PG commit — staff/member suspension, Business suspension, QR rotation, Commerce Knowledge retirement — is an **accepted bounded cross-store race**, stated exactly as such:

| External snapshot | Change after read, before commit | Effect |
|---|---|---|
| Business lifecycle / membership state | suspension/expiry lands | authoritative state was checked at validation time; the PG row stores a snapshot; later source changes do not rewrite committed history; each future command revalidates live external authority. The recorded Purchase is **not** retroactively invalidated; only future actions are affected (later commands re-read and fail closed) |
| Customer Identity / current QR | artifact invalidated/rotated | same snapshot rule as above: no retroactive invalidation of the committed row; future creations resolve afresh. For QR specifically: Firestore confirms currency at validation time; a rotation in the race window is disclosed and bounded; no distributed transaction is claimed |
| Branch (default) | default branch changes | informational metadata only; no invalidation |
| Commerce Knowledge node | node retired | same snapshot rule; future creations re-validate |

Nothing is described as "already historical" before commit — history is made at COMMIT. No validation result is cached across commands — every command re-reads external authorities and re-locks PG authorities. Consequences remain fail-safe by construction: the PG row permanently snapshots every validated reference (presented pair + identity + canonical LN, program id + version id, node id, recorder + role, business + branch), so later source changes never rewrite committed history.

---

## 19. Immutable-history/correction model

Governed reconciliation (TRD10 §10.10.1 Immutability Rule + DAP-004) — the approved technical interpretation (P2-10): **Purchase commercial/identity snapshot fields are immutable after creation; controlled lifecycle status/current-state fields transition only through the four governed server-side state-machine commands** (record/verify/reject/dispute); **every transition has append-only event/history records**; corrections never edit the original commercial snapshot — correction creates a replacement Purchase Record. No full event-sourced redesign. Snapshot immutability is command-layer convention (documented on the table — the 005A approach); lifecycle integrity is additionally DB-enforced (state CHECKs: `verified_at` only for `verified`, rejection reason only for `rejected`, dispute reason/event only for `under_review`, terminal-state timestamp consistency; §20).

Corrections (deferred behavior, prepared schema): under DEC-LOY-004 + TRD11 §11.24 the future package will retain the original, create a correction record + replacement purchase (new id, `replaces_purchase_record_id` set on the replacement pointing at the original, original → `corrected`), require fresh customer verification of the replacement, and — where the original already issued units — write `reversal` unit rows rather than deleting. The relationship is **one authoritative directional FK** (`replaces_purchase_record_id` on the replacement, with `UNIQUE` so one original gains at most one replacement); the reverse is a query (`SELECT * FROM purchase_records WHERE replaces_purchase_record_id = original.id`), never a second materialized column — there are not two independently mutable relationship truths. 006A lays the linkage column and the reversal-capable unit shape but writes neither. If the original never verified (no units), correction is a plain replacement chain with no reversal rows.

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
  customer_identity_id TEXT NOT NULL,               -- B: resolved, server-authoritative
  -- A: presented artifact — exactly what the Business submitted (P1-1).
  -- One presentation form only; never a Customer id; never authority.
  presented_artifact_type TEXT NOT NULL
    CHECK (presented_artifact_type IN ('loyalty_number','qr_identity')),
  presented_artifact_reference TEXT NOT NULL,       -- raw submitted value
  -- C: canonical Loyalty Number, server-derived display snapshot.
  -- Exactly one LN per identity is governed (DEC-CUST-ID-ART-001), so the
  -- derivation source is total: NOT NULL is justified. Display/reporting
  -- only — never read as presented input, never read as authority.
  canonical_loyalty_number_value TEXT NOT NULL,
  reward_program_id UUID NOT NULL,
  reward_program_version_id UUID NOT NULL,
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
  rejection_reason TEXT NULL
    CHECK (rejection_reason IS NULL OR rejection_reason IN
      ('did_not_happen','duplicate','wrong_customer','wrong_program','wholly_invalid')),
  dispute_reason TEXT NULL
    CHECK (dispute_reason IS NULL OR dispute_reason IN
      ('wrong_quantity','wrong_item','partially_inaccurate')),
  replaces_purchase_record_id UUID NULL REFERENCES purchase_records (id) ON DELETE RESTRICT,
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  schema_version INTEGER NOT NULL DEFAULT 1,
  -- State integrity preserves historical facts (P2-10): facts required when
  -- their transition occurred are never erased by later transitions; only
  -- incompatible simultaneous verdicts are prevented. waiting_for_customer
  -- carries no verdict facts; corrected/cancelled/expired/archived (no 006A
  -- writer) impose no erasure — append-only events hold full history.
  CONSTRAINT purchase_records_verified_fields CHECK (
    (status = 'waiting_for_customer'
      AND verified_at IS NULL AND rejection_reason IS NULL
      AND dispute_reason IS NULL) OR
    (status = 'verified' AND verified_at IS NOT NULL
      AND rejection_reason IS NULL AND dispute_reason IS NULL) OR
    (status = 'rejected' AND rejection_reason IS NOT NULL
      AND dispute_reason IS NULL) OR
    (status = 'under_review' AND dispute_reason IS NOT NULL
      AND rejection_reason IS NULL) OR
    (status IN ('corrected','cancelled','expired','archived'))),
  -- Incompatible simultaneous verdicts are prevented in every state.
  CONSTRAINT purchase_records_single_verdict CHECK (
    NOT (rejection_reason IS NOT NULL AND dispute_reason IS NOT NULL)),
  CONSTRAINT purchase_records_reporting_pair CHECK (
    (unit_value_minor IS NULL) = (currency IS NULL)), -- value+currency together or neither
  -- A-B. version∈program and program∈Business, relationally (P1-7):
  -- requires additive UNIQUE (reward_program_id, id) on
  -- reward_program_versions and UNIQUE (id, business_id) on
  -- reward_programs via new forward-only 006A migrations (0001–0006
  -- never hand-edited). Never application prechecks alone.
  CONSTRAINT purchase_records_version_in_program FOREIGN KEY
    (reward_program_id, reward_program_version_id)
    REFERENCES reward_program_versions (reward_program_id, id) ON DELETE RESTRICT,
  CONSTRAINT purchase_records_program_in_business FOREIGN KEY
    (reward_program_id, business_id)
    REFERENCES reward_programs (id, business_id) ON DELETE RESTRICT,
  -- F. correction linkage: ONE authoritative directional FK (P2-11).
  -- The replacement points at the original; the reverse is a query, never
  -- a second materialized column. Longer circular chains are rejected
  -- transactionally by the future correction command (no 006A writer exists).
  CONSTRAINT purchase_records_no_self_replace CHECK (
    replaces_purchase_record_id IS DISTINCT FROM id),
  -- C/D anchor: copied-identifier tuple other tables pin to.
  CONSTRAINT purchase_records_identity_tuple_unique UNIQUE
    (id, business_id, customer_identity_id, reward_program_id,
     reward_program_version_id)
);
CREATE INDEX purchase_records_business_status_idx ON purchase_records (business_id, status, created_at DESC);
CREATE INDEX purchase_records_customer_status_idx ON purchase_records (customer_identity_id, status, created_at DESC);
CREATE INDEX purchase_records_program_idx ON purchase_records (reward_program_id, reward_program_version_id);
-- F (continued): one replacement claims at most one original.
CREATE UNIQUE INDEX purchase_records_one_original_per_replacement
  ON purchase_records (replaces_purchase_record_id) WHERE replaces_purchase_record_id IS NOT NULL;

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
-- Cycle linkage lives ONLY in verified_unit_allocations (explicit
-- allocated|pending rows) — no nullable-cycle semantics here (P2-8).
CREATE TABLE verified_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_record_id UUID NOT NULL,
  business_id TEXT NOT NULL,
  customer_identity_id TEXT NOT NULL,
  reward_program_id UUID NOT NULL,
  reward_program_version_id UUID NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),  -- always positive; reversals too
  entry_type TEXT NOT NULL CHECK (entry_type IN ('credit','reversal')),
  -- C. copied identifiers must match the originating Purchase (P1-7):
  CONSTRAINT verified_units_matches_purchase FOREIGN KEY
    (purchase_record_id, business_id, customer_identity_id,
     reward_program_id, reward_program_version_id)
    REFERENCES purchase_records (id, business_id, customer_identity_id,
     reward_program_id, reward_program_version_id) ON DELETE RESTRICT,
  -- Reversal provenance (P2-8): separate immutable row referencing the
  -- exact original credit; never mutates/deletes the original.
  reverses_verified_unit_id UUID NULL REFERENCES verified_units (id) ON DELETE RESTRICT,
  correction_purchase_record_id UUID NULL REFERENCES purchase_records (id) ON DELETE RESTRICT,
  reason_code TEXT NOT NULL,                        -- e.g. 'purchase_verified'
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT verified_units_reversal_shape CHECK (
    (entry_type = 'credit' AND reverses_verified_unit_id IS NULL
      AND correction_purchase_record_id IS NULL) OR
    (entry_type = 'reversal' AND reverses_verified_unit_id IS NOT NULL
      AND correction_purchase_record_id IS NOT NULL)),
  CONSTRAINT verified_units_no_self_reverse CHECK (
    reverses_verified_unit_id IS DISTINCT FROM id),
  -- Identity tuple proving the exact credit (business/customer/program/
  -- version scope) for allocation-scope FKs (P1-3/§6).
  CONSTRAINT verified_units_identity_tuple_unique UNIQUE
    (id, business_id, customer_identity_id, reward_program_id,
     reward_program_version_id)
);
CREATE UNIQUE INDEX verified_units_one_credit_per_purchase
  ON verified_units (purchase_record_id) WHERE entry_type = 'credit';
-- No duplicate/over-reversal for the same correction; remaining-reversible
-- quantity (sum(reversals) <= credit quantity) checked in-transaction by
-- the future correction command (no 006A reversal writer).
CREATE UNIQUE INDEX verified_units_one_reversal_per_credit_per_correction
  ON verified_units (reverses_verified_unit_id, correction_purchase_record_id)
  WHERE entry_type = 'reversal';
CREATE INDEX verified_units_customer_program_idx
  ON verified_units (customer_identity_id, reward_program_id, entry_type);

-- trust_events: authoritative commercial trust history (P1-5, FD-PVL-001).
-- One row per governed occurrence, written in the SAME PG transaction as
-- the state change. Translates the governed TRD10 §10.13.1
-- TrustEventDocument semantics into the PG spine without copying
-- provider-specific structure. Insert-only (no 006A updater/deleter).
-- Cardinality (P2-7): A. one CAUSAL purchase-transition event per
-- transition (purchase.recorded / .verified / .rejected / .disputed);
-- B. SUBJECT events where governed (verified_units.issued,
-- loyalty_cycle.allocated, loyalty_cycle.reward_available,
-- reward.available), each naming its explicit subject. Subjects are NOT
-- forced into a purchase aggregate FK: the causal purchase root is always
-- present, and the subject is carried as (subject_type + subject_id) with
-- explicit nullable FK columns per subject type — never an unsafe
-- polymorphic FK.
CREATE TABLE trust_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL
    CHECK (event_type IN ('purchase.recorded','purchase.verified',
      'purchase.rejected','purchase.disputed','verified_units.issued',
      'loyalty_cycle.allocated','loyalty_cycle.reward_available',
      'reward.available')),
  event_version INTEGER NOT NULL DEFAULT 1,
  source_domain TEXT NOT NULL DEFAULT 'purchase',
  -- Causal root: every event in this spine is caused by a Purchase
  -- lifecycle transition.
  causal_purchase_record_id UUID NOT NULL REFERENCES purchase_records (id) ON DELETE RESTRICT,
  -- Explicit subject semantics.
  subject_type TEXT NOT NULL
    CHECK (subject_type IN ('purchase_record','verified_unit','loyalty_cycle','reward')),
  subject_id UUID NOT NULL,
  subject_verified_unit_id UUID NULL REFERENCES verified_units (id) ON DELETE RESTRICT,
  subject_loyalty_cycle_id UUID NULL REFERENCES loyalty_cycles (id) ON DELETE RESTRICT,
  subject_reward_id UUID NULL REFERENCES rewards (id) ON DELETE RESTRICT,
  business_id TEXT NOT NULL,
  customer_identity_id TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('staff','manager','owner','customer','system')),
  actor_id TEXT NOT NULL,
  actor_role TEXT NULL,
  correlation_id TEXT NOT NULL,
  causation_id UUID NULL REFERENCES trust_events (id) ON DELETE RESTRICT,
  payload JSONB NOT NULL,                           -- immutable reference; ids only, PII minimized
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  schema_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT trust_events_subject_shape CHECK (
    (subject_type = 'purchase_record'
      AND subject_id = causal_purchase_record_id
      AND subject_verified_unit_id IS NULL
      AND subject_loyalty_cycle_id IS NULL
      AND subject_reward_id IS NULL) OR
    (subject_type = 'verified_unit'
      AND subject_verified_unit_id IS NOT NULL AND subject_id = subject_verified_unit_id
      AND subject_loyalty_cycle_id IS NULL AND subject_reward_id IS NULL) OR
    (subject_type = 'loyalty_cycle'
      AND subject_loyalty_cycle_id IS NOT NULL AND subject_id = subject_loyalty_cycle_id
      AND subject_verified_unit_id IS NULL AND subject_reward_id IS NULL) OR
    (subject_type = 'reward'
      AND subject_reward_id IS NOT NULL AND subject_id = subject_reward_id
      AND subject_verified_unit_id IS NULL AND subject_loyalty_cycle_id IS NULL))
);
-- Deduplication independent of command idempotency: one causal event per
-- (purchase, type); one subject event per (subject, type). Transitions fire
-- once by state machine; the verify transaction writes each event once.
CREATE UNIQUE INDEX trust_events_one_causal_per_purchase
  ON trust_events (causal_purchase_record_id, event_type)
  WHERE subject_type = 'purchase_record';
CREATE UNIQUE INDEX trust_events_one_per_subject
  ON trust_events (subject_type, subject_id, event_type)
  WHERE subject_type <> 'purchase_record';
CREATE INDEX trust_events_causal_idx ON trust_events (causal_purchase_record_id, occurred_at);
CREATE INDEX trust_events_customer_idx ON trust_events (customer_identity_id, occurred_at DESC);
CREATE INDEX trust_events_business_idx ON trust_events (business_id, occurred_at DESC);

-- loyalty_cycle_streams: serialization parent per allocation stream (P1-5/B).
-- One row per (Business, Customer, Reward Program), created idempotently
-- (INSERT … ON CONFLICT DO NOTHING) and locked FOR UPDATE before any
-- cycle resolution/creation or allocation step. Owns the cycle sequence
-- counter. The conflict path is the designed concurrent-arrival path.
CREATE TABLE loyalty_cycle_streams (
  business_id TEXT NOT NULL,                        -- opaque Firestore ref
  customer_identity_id TEXT NOT NULL,               -- opaque, server-resolved
  reward_program_id UUID NOT NULL REFERENCES reward_programs (id) ON DELETE RESTRICT,
  next_cycle_sequence INTEGER NOT NULL DEFAULT 1 CHECK (next_cycle_sequence >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT loyalty_cycle_streams_pkey PRIMARY KEY
    (business_id, customer_identity_id, reward_program_id)
);

-- loyalty_cycles: minimum operational Cycle aggregate (FD-PVL-002).
-- Full future Cycle feature set NOT designed here — only what 006A needs
-- to allocate, cross thresholds, and hold pending overflow.
CREATE TABLE loyalty_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,                        -- opaque Firestore ref
  customer_identity_id TEXT NOT NULL,               -- opaque, server-resolved
  reward_program_id UUID NOT NULL,
  opened_under_version_id UUID NOT NULL,
  sequence_number INTEGER NOT NULL CHECK (sequence_number >= 1),
  state TEXT NOT NULL DEFAULT 'active'
    CHECK (state IN ('active','reward_available','reward_redeemed','closed')),
  allocated_units INTEGER NOT NULL DEFAULT 0
    CHECK (allocated_units >= 0 AND allocated_units <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  correlation_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  -- A. opening version belongs to the program (same additive UNIQUE as §20
  -- purchase constraints; new forward-only 006A migration).
  CONSTRAINT loyalty_cycles_version_in_program FOREIGN KEY
    (reward_program_id, opened_under_version_id)
    REFERENCES reward_program_versions (reward_program_id, id) ON DELETE RESTRICT,
  -- B. program belongs to the business.
  CONSTRAINT loyalty_cycles_program_in_business FOREIGN KEY
    (reward_program_id, business_id)
    REFERENCES reward_programs (id, business_id) ON DELETE RESTRICT,
  -- Stream membership: every cycle hangs off its serialization parent.
  CONSTRAINT loyalty_cycles_in_stream FOREIGN KEY
    (business_id, customer_identity_id, reward_program_id)
    REFERENCES loyalty_cycle_streams
    (business_id, customer_identity_id, reward_program_id) ON DELETE RESTRICT,
  -- C. identity tuple anchoring allocation-scope FKs.
  CONSTRAINT loyalty_cycles_identity_tuple_unique UNIQUE
    (id, business_id, customer_identity_id, reward_program_id),
  -- Anchor for the reward-version proof below.
  CONSTRAINT loyalty_cycles_governing_version_unique UNIQUE
    (id, opened_under_version_id),
  -- E. sequence uniqueness scoped per customer+program stream (the stream
  -- counter is the writer; this index is the backstop).
  CONSTRAINT loyalty_cycles_sequence_unique UNIQUE
    (customer_identity_id, reward_program_id, sequence_number)
);
-- DEC-LOY-002/FD-PVL-002 invariant (D): never more than one current
-- active/reward-available cycle per customer+program.
CREATE UNIQUE INDEX loyalty_cycles_one_current_per_customer_program
  ON loyalty_cycles (customer_identity_id, reward_program_id)
  WHERE state IN ('active','reward_available');

-- rewards: minimum Reward entitlement foundation (P1-6, REQUIRED).
-- Created exactly once by the threshold transaction (§16); no redemption
-- behavior here. Shape follows the governed TRD10 §10.12.1
-- RewardDocument vocabulary (table `rewards`, canonical states).
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loyalty_cycle_id UUID NOT NULL,
  business_id TEXT NOT NULL,
  customer_identity_id TEXT NOT NULL,
  reward_program_id UUID NOT NULL,
  -- Reward terms governed by the CYCLE's governing version (§15):
  -- opened_under_version_id of the qualifying cycle, never program-current.
  reward_program_version_id UUID NOT NULL,
  reward_description TEXT NOT NULL,                 -- terms snapshot from the governing version
  reward_quantity INTEGER NOT NULL CHECK (reward_quantity = 1),
  state TEXT NOT NULL DEFAULT 'available'
    CHECK (state IN ('available','redeemed','cancelled','expired')),
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  correlation_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  -- Same-scope relational integrity: reward pins the exact cycle tuple
  -- (which itself proves version∈program and program∈business)…
  CONSTRAINT rewards_match_cycle FOREIGN KEY
    (loyalty_cycle_id, business_id, customer_identity_id, reward_program_id)
    REFERENCES loyalty_cycles (id, business_id, customer_identity_id,
     reward_program_id) ON DELETE RESTRICT,
  -- …and proves its terms version IS the cycle's governing version
  -- (opened_under_version_id, §15) — relational, not a comment.
  CONSTRAINT rewards_governing_version FOREIGN KEY
    (loyalty_cycle_id, reward_program_version_id)
    REFERENCES loyalty_cycles (id, opened_under_version_id) ON DELETE RESTRICT)
);
-- Exactly one Reward entitlement per qualifying Loyalty Cycle, created
-- exactly once by the threshold transaction (UNIQUE backstop + progress
-- re-checked under the cycle lock, §16).
CREATE UNIQUE INDEX rewards_one_per_cycle
  ON rewards (loyalty_cycle_id);

-- verified_unit_allocations: CURRENT allocation positions (CORR-002).
-- Conservation invariant: credit.quantity = SUM(position quantities) at
-- all times, positions = allocated + pending rows. Pending→allocated
-- converts ON THE SAME ROW when the next cycle opens — movement never
-- creates quantity. History lives in allocation events, never here.
CREATE TABLE verified_unit_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verified_unit_id UUID NOT NULL,
  loyalty_cycle_id UUID NULL REFERENCES loyalty_cycles (id) ON DELETE RESTRICT,
  business_id TEXT NOT NULL,
  customer_identity_id TEXT NOT NULL,
  reward_program_id UUID NOT NULL,
  reward_program_version_id UUID NOT NULL,
  allocated_quantity INTEGER NOT NULL CHECK (allocated_quantity >= 1),
  allocation_order INTEGER NOT NULL CHECK (allocation_order >= 0),
  state TEXT NOT NULL CHECK (state IN ('allocated','pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT verified_unit_allocations_pending_shape CHECK (
    (state = 'pending') = (loyalty_cycle_id IS NULL)),
  -- Allocation rows prove their copied scope against the EXACT credit
  -- tuple (version pins the credit's own snapshot; each copied field
  -- serves this named FK — see §15).
  CONSTRAINT verified_unit_allocations_match_unit FOREIGN KEY
    (verified_unit_id, business_id, customer_identity_id,
     reward_program_id, reward_program_version_id)
    REFERENCES verified_units (id, business_id, customer_identity_id,
     reward_program_id, reward_program_version_id) ON DELETE RESTRICT,
  -- D. allocated rows prove the cycle's Business/Customer/Program scope.
  -- (MATCH SIMPLE: pending rows with NULL cycle id skip this FK and prove
  -- scope through the unit FK instead — exactly the intended split.)
  CONSTRAINT verified_unit_allocations_cycle_scope FOREIGN KEY
    (loyalty_cycle_id, business_id, customer_identity_id, reward_program_id)
    REFERENCES loyalty_cycles (id, business_id, customer_identity_id,
     reward_program_id) ON DELETE RESTRICT
);
CREATE INDEX verified_unit_allocations_unit_idx
  ON verified_unit_allocations (verified_unit_id, allocation_order);
CREATE INDEX verified_unit_allocations_cycle_idx
  ON verified_unit_allocations (loyalty_cycle_id, allocation_order)
  WHERE loyalty_cycle_id IS NOT NULL;
CREATE INDEX verified_unit_allocations_pending_idx
  ON verified_unit_allocations (customer_identity_id, reward_program_id, created_at)
  WHERE state = 'pending';

-- verified_unit_allocation_events: append-only movement history (§15).
-- NEVER read as current quantity. Current-position queries touch only the
-- positions table; audits and reconciliation read here.
CREATE TABLE verified_unit_allocation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_position_id UUID NOT NULL REFERENCES verified_unit_allocations (id) ON DELETE RESTRICT,
  verified_unit_id UUID NOT NULL REFERENCES verified_units (id) ON DELETE RESTRICT,
  from_state TEXT NOT NULL CHECK (from_state IN ('none','pending','allocated')),
  to_state TEXT NOT NULL CHECK (to_state IN ('pending','allocated','reversed')),
  from_cycle_id UUID NULL REFERENCES loyalty_cycles (id) ON DELETE RESTRICT,
  to_cycle_id UUID NULL REFERENCES loyalty_cycles (id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  reason TEXT NOT NULL
    CHECK (reason IN ('initial_placement','pending_to_allocated','correction_adjustment')),
  correlation_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  schema_version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT verified_unit_allocation_events_shape CHECK (
    (reason = 'initial_placement' AND from_state = 'none'
      AND from_cycle_id IS NULL
      AND (to_state = 'pending') = (to_cycle_id IS NULL)) OR
    (reason = 'pending_to_allocated' AND from_state = 'pending'
      AND to_state = 'allocated'
      AND from_cycle_id IS NULL AND to_cycle_id IS NOT NULL) OR
    (reason = 'correction_adjustment'))
);
CREATE INDEX verified_unit_allocation_events_position_idx
  ON verified_unit_allocation_events (allocation_position_id, occurred_at);
CREATE INDEX verified_unit_allocation_events_unit_idx
  ON verified_unit_allocation_events (verified_unit_id, occurred_at);

-- notification_intents: durable business intent per transition (P2-11).
-- Intent (authoritative, durable, transactional) vs delivery (deferred
-- provider infrastructure) — §23. No delivery worker reads this in 006A.
CREATE TABLE notification_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_type TEXT NOT NULL
    CHECK (intent_type IN ('purchase_recorded_customer','purchase_verified_business',
      'purchase_rejected_business','purchase_disputed_business',
      'reward_available_customer')),
  purchase_record_id UUID NOT NULL REFERENCES purchase_records (id) ON DELETE RESTRICT,
  -- Authoritative source transition: the purchase_record_events row this
  -- intent was generated from (P2-8). Structural dedup key below.
  source_purchase_record_event_id UUID NOT NULL REFERENCES purchase_record_events (id) ON DELETE RESTRICT,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('customer','business')),
  recipient_id TEXT NOT NULL,
  payload JSONB NOT NULL,                           -- template keys + ids; copy resolved at delivery time
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status = 'pending'),
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  schema_version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX notification_intents_purchase_idx
  ON notification_intents (purchase_record_id, created_at);
-- Structural deduplication independent of command idempotency: one intent
-- per (source transition, type, recipient). A retried command replays from
-- its idempotency record instead of inserting; this index backstops it.
CREATE UNIQUE INDEX notification_intents_one_per_source_recipient
  ON notification_intents (source_purchase_record_event_id, intent_type,
    recipient_type, recipient_id);

-- purchase_outbox: domain-scoped transactional outbox (005A pattern).
-- Payloads carry ids only, never secrets.
CREATE TABLE purchase_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL
    CHECK (event_type IN ('purchase_recorded','purchase_verified','purchase_rejected',
      'purchase_disputed','verified_units_issued','loyalty_cycle_allocated',
      'loyalty_cycle_reward_available','reward_available')),
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

Reuse as-is: generic `idempotency_keys` (new operation types `purchase.create`/`purchase.verify`/`purchase.reject`/`purchase.dispute` only). Each table ships with a matching `.down.sql`. The additive UNIQUEs on pre-existing tables (`reward_program_versions (reward_program_id, id)`, `reward_programs (id, business_id)`) arrive via new forward-only 006A migrations — `0001–0006` are never hand-edited. Table order above is documentary: 006A migrations create all tables before adding cross-table FKs (no forward-reference FK at apply time). Quantity conservation is constructional + test-enforced: `credit.quantity = SUM(current position quantities)` holds because the verify transaction writes positions summing to the credit and movement transitions preserve the sum on the same rows (§15); `cycle.allocated_units = SUM(allocated positions for that cycle)` holds because the counter is maintained only inside the serialized stream transaction (§16) — the materialized counter is chosen over derivation (simplest safe model: a single lock target, reconciliation tests after every threshold/concurrency scenario in §29). No migration files are created by this design task.

---

## 21. Reads/read-model proposal

Minimum 006A reads (all server-authorized; reads never create/repair):

- Business: `listPurchasesForBusiness` (filter by `status`, default `waiting_for_customer` first, paginated, newest-first) + `getPurchaseRecord` (single, membership-gated, same-Business enforced). Membership-gated like 005A reads (no catalogue entry needed).
- Customer: `listPurchasesWaitingForCustomer` ("Waiting for You", ownership-scoped) + `getPurchaseRecord` (ownership-enforced) + `listAvailableRewardsForCustomer` (ownership-scoped minimum reward read — `available` rewards with governing terms snapshot, no redemption surface). Batch-verify operates strictly on the visible reviewed set (DEC-LOY-006); rejection stays individual-only end-to-end (DEC-LOY-010).
- No reporting dashboards, no cross-business views, no staff-activity feeds in 006A.
- State visibility: customers see their own records in any status; Businesses see their records in any status; rejected records remain visible to both (history rule).

---

## 22. Audit/outbox/Trust Event model

Three distinct concepts — all three written by 006A, no overlapping ledgers (P1-5, `FD-PVL-001`):

- **Transactional audit (`purchase_record_events`):** the Purchase lifecycle timeline / domain transition history — queryable per-record history and PRD5 §20 timeline source. Same transaction as the transition.
- **Authoritative Trust Events (`trust_events`):** the authoritative commercial trust history required by product authority — written in the **same PostgreSQL transaction** as the state change (creation, verification, rejection, dispute; unit issuance, cycle allocation/reward-available, and reward availability included as subject events). Translates the governed TRD10 §10.13.1 `TrustEventDocument` semantics into the PG spine without copying provider-specific structure:
  - `event_type` + `event_version` (closed vocabulary, §20) · `actor` (`actor_type` staff|manager|owner|customer|system + `actor_id` + optional `actor_role`) · causal root (`causal_purchase_record_id` — every event in this spine is caused by a Purchase transition) · explicit subject (`subject_type` purchase_record|verified_unit|loyalty_cycle|reward + `subject_id` + the matching nullable subject FK; purchase-record subjects use the causal id) · Purchase/Business/Customer ids · `correlation_id` (+ optional `causation_id` chaining to the prior Trust Event) · `occurred_at`/`recorded_at` timestamps · immutable JSONB `payload`/reference (ids + version snapshot + quantity + reason codes; PII minimized) · `schema_version`. Append-only: insert-only by convention, no 006A updater/deleter. Cardinality/dedup: one causal event per (purchase, type); one subject event per (subject, type) — partial UNIQUEs backstop the state machine (each transition fires once) independently of command idempotency.
- **Domain outbox (`purchase_outbox`):** the delivery/integration mechanism for downstream processing (future notification delivery workers, analytics, integrations). Same transaction; payloads carry ids only, never secrets.
- There is exactly one trust ledger (`trust_events`). `purchase_record_events` is not a second ledger — it is the per-record timeline the Trust Event is derived alongside, in the same transaction, from the same transition.
- Security-relevant denials (e.g. cross-customer access attempts) are security logs per TRD12 §12.39, not Trust Events — 006A follows the existing observability convention, not a new one.

---

## 23. Notification boundary

PRD5 §19 requires a notification per transition, and product authority requires a durable record of that intent — but **no notification delivery infrastructure exists** (no templates, no provider adapters, no scheduler). 006A therefore implements the **intent/delivery split** from TRD13 §§13.13–13.28 (P2-11):

- **A. Notification intent (006A, authoritative + durable):** every Purchase transition creates its `notification_intents` row(s) **in the same PG transaction** as the transition — the authoritative business intent generated from the transition, transactionally created and reliably linked to it. Each intent row names its authoritative source transition (`source_purchase_record_event_id`) and is covered by `UNIQUE(source, intent_type, recipient_type, recipient_id)` — structural dedup independent of command idempotency. Minimum intents: Purchase recorded → Customer; Purchase verified → Business; Purchase rejected → Business; Purchase disputed → Business; **Reward available → Customer** (sourced from the threshold-crossing verify transition's event row, created in the same transaction as the Reward). The intent row carries template keys + ids; user-visible copy is resolved at delivery time (EN/FR parity required then, not stored twice now).
- **B. Notification delivery (deferred):** channels/provider, retry, quiet hours, consent/channel resolution, and external delivery infrastructure remain deferred to the Notification/Integration domains. No delivery worker reads `notification_intents` in 006A; the `status` stays `pending` by design (CHECK-enforced until a governed delivery package widens it).
- 006A builds no mini-notification system and no second queue: one intent table, one outbox, each with a single owner and a coherent boundary. Reminder/expiry notifications are doubly out of scope (no governed durations exist).

---

## 24. Founder localhost preview flow

Smallest real journey on canonical Git + local PostgreSQL/Docker + Firebase emulators (emulator-only Terms fixture per `FD-PREVIEW-TERMS-001`; no hosted preview; no preview-only product logic):

1. Owner signs in (Business in `trial`), opens Reward Programs, publishes a version (existing 005A UI).
2. Staff/Manager records a qualifying purchase against a test Customer's Loyalty Number (new minimal Business form: artifact + quantity + item label + date).
3. Customer signs in (resolved identity), opens "Waiting for You," sees the purchase with recorder/branch/notes, and verifies — or rejects with a reason, or raises a dispute with a reason (all three customer actions exercisable).
4. Both sides observe `verified` + issued units + Cycle allocation (Business pending list clears; customer history shows verified record and current cycle progress toward 10). A threshold journey (enough verified quantity to reach 10) shows the cycle flipping to `reward_available` with exactly one `available` Reward carrying the cycle's governing terms, plus the customer `reward_available` intent recorded.
5. Negative paths demonstrable: wrong-customer access denied; double-verify safe; reject path creates no units; dispute path creates no units and lands `under_review`; `shared=false` program rejects LN-only creation and accepts current-QR creation; replay of a threshold verify creates nothing twice.

EN/FR parity required for every new string (no Kinyarwanda/Kirundi/Swahili).

---

## 25. EN/FR UI implications

All 006A UI strings (record form, waiting lists, verify/reject screens, reasons, errors) ship in English + French with exact parity, following the 005A i18n pattern (`apps/web/src/i18n/locales/{en,fr}.ts`). Rejection reasons use the PRD5 §15 closed set. No new language, no locale-specific logic.

---

## 26. Open-decision/blocker matrix

| Decision | Status | Affected operation | Blocks 006A? | Why |
|---|---|---|---|---|
| DEC-LOY-008 overflow allocation | **CONFIRMED** 2026-09-14 (`FD-PVL-002`) | threshold-crossing allocation, pending-unit application | No | Immediate allocation + pending-overflow rule decided; 006A implements it |
| DEC-PROD-008 partial-quantity verify | **CONFIRMED** 2026-09-14 (`FD-PVL-004`, MVP) | partial verify of multi-qty | No | Whole-record verify/reject/dispute decided; partial needs a new decision |
| DEC-PROD-014 version binding (new) | **CONFIRMED** 2026-09-14 (`FD-PVL-003`) | pending-Purchase verification across version publication | No | Creation-time snapshot normative; publication never blocks valid verification |
| DEC-LOY-007 shared-number policy | CONFIRMED + `FD-PVL-005` addendum | creation gating when sharing disabled | No | `false` ⇒ current QR required; five-case matrix enforced |
| DEC-DATA-008 PG authority | CONFIRMED + `FD-PVL-001` addendum | Purchase/Verification/Unit/Cycle spine | No | Bounded spine explicitly authorized |
| Minimum Reward entitlement | REQUIRED by BR-064/BR-069 + TRD10 §10.12.1 (CORR-002) | threshold transaction | No | Created exactly once per qualifying cycle in 006A; redemption deferred |
| Reward terms version | Answered by authority (CORR-002 §15) | threshold transaction | No | Cycle governing version (`opened_under_version_id`); PRD6 + BR-066/067; no new FD needed |
| DEC-LOY-013 pause/migration/seasonal | OPEN_FOUNDER (D2) | lifecycle edge cases | No | Only affects pause/migration/seasonal semantics, excluded from slice |
| DEC-SUB-008 catalogue values | OPEN_FOUNDER (D2) | plan catalogue/seed | No | Mechanics confirmed; 006A uses trial/active gate only |
| DEC-PROD-009 reminder/expiry values | OPEN (values) | reminders, expiry transitions | No | Expiry/reminders deferred; no values invented |
| DEC-PROD-010 expired-terminality | OPEN | transition table | No | `expired` unreachable in 006A |
| DEC-PROD-011 dispute evidence | DEFERRED | attachments on dispute | No | MVP dispute = reason (+ comment); 006B boundary |
| DEC-DATA-004 reward_redeemed durability | OPEN_ENGINEERING | cycle transition table | No | Does not touch unit issuance |
| DEC-LOY-014/015 | DO NOT EXIST | — | No | Non-canonical references; ignored by design |
| Verified-unit granularity | Answered by TRD10 §10.11.1 | issuance shape | No | Per-issuance rows with `quantity`; no FD needed |
| DEC-LEGAL-002 trial Terms | OPEN_LEGAL | localhost testing | No | Emulator-only fixture path authorized (FD-PREVIEW-TERMS-001); gates unweakened |

**No open decision blocks the recommended 006A slice.** Business-side dispute review/correction, if the Founder prefers it sooner, would be a scope choice (`PLATFORM-BASELINE-006B`), not a discovered blocker.

---

## 27. Risks

1. **PRD/TRD pre-freeze status:** the entire product/technical basis is draft-for-approval. A freeze-time change to lifecycle states, unit semantics, or the §11.19 chain could invalidate slice boundaries. Mitigation: every rule cites its source; the authority matrix (§3-equivalent findings inline above) marks draft status explicitly.
2. **DEC-AUTH-002 direction:** Firebase Auth is no longer the target authentication architecture, but no replacement is approved. 006A builds on the current TRD12 chain; an IdP migration would touch verification identity mapping.
3. **Quantity-mapping thinness:** the 1:1 quantity→units mapping rests on examples + DEC-LOY-003 + the schema's `quantity` field, not a normative sentence. A freeze clarification changing this would reshape issuance.
4. **Downstream-package coupling:** the allocation/pending-overflow contract, Trust Event vocabulary, and Notification Intent vocabulary (§29.8) must be honored by later packages (006B dispute review, Reward issuance, notification delivery); documented here as hard interface requirements.
5. **Test-infrastructure load:** the slice adds a third PG test surface (purchase + cross-store + concurrency); shared-machine contention flakes observed in prior packages must be diagnosed, never normalized.
6. **No-notification gap:** users get no transition messages until the Notification package exists; acceptable for localhost verification, not for pilot. (Intent rows accumulate `pending` by design until then.)
7. **Conservation/concurrency new-surface risk:** the position/event split, stream serialization, and threshold Reward creation are new design surface with no prior implementation precedent in this codebase. Mitigation: hard invariants stated in §§15–16/20, six conservation walkthroughs proven in §33, and §29.19 tests mandatory before 006A closes.

---

## 28. Explicit exclusions

Business dispute review (`under_review` workflow beyond the safe holding state), correction/replacement workflow, cancellation, expiry scheduler + `expired` transitions, archival, notification delivery/provider workers (intent creation itself is **in** scope, §23), Reward redemption (minimum Reward **creation** at threshold is **in** scope, §15), billing/plan-capacity enforcement, multi-branch support, phone-number lookup, POS/Mobile-Money/API creation paths, hosted preview, Cloud SQL provisioning, any Firestore purchase/trust/notification collection, any new permission beyond the single specified `purchase.record` catalogue entry.

---

## 29. Recommended PLATFORM-BASELINE-006A scope

1. Purchase Record PostgreSQL foundation (presented-artifact + resolved-identity + canonical-LN snapshot; fact-preserving state CHECKs; single directional replacement FK).
2. Purchase lifecycle events (`purchase_record_events`).
3. Trust Event foundation for Purchase/Unit/Cycle/Reward events (`trust_events`: causal root + explicit subject semantics + cardinality/dedup rules).
4. Verified Unit foundation (immutable credits + reversal-capable shape + identity-tuple UNIQUE).
5. Loyalty Cycle stream + aggregate foundation (`loyalty_cycle_streams` serialization parent + minimum `loyalty_cycles` with composite scope proofs and 0–10 progress CHECK).
6. Current allocation-position + allocation-history foundation (`verified_unit_allocations` + `verified_unit_allocation_events`; conservation invariant).
7. Minimum Reward entitlement creation at threshold (`rewards`: one `available` Reward per qualifying cycle, governing-version terms, quantity 1).
8. Notification Intent foundation (source-linked intents + structural dedup UNIQUE + `reward_available` intent).
9. `purchase.record` permission (Staff/Manager/Owner, trial/active — retained Founder-approved scope).
10. `recordPurchase` (19-step sequence: external reads → locked-version proofs → shared-gate → locked-rule quantity → writes).
11. `verifyPurchase` (verify→unit→cycle→reward atomic transaction with stream serialization).
12. `rejectPurchase` (bounded vocabulary, no units).
13. `raisePurchaseDispute` (mandatory reason; `under_review` holding state; 006B boundary).
14. Business/customer reads (pending lists + get + minimum available-rewards read).
15. EN/FR minimum UI (record form, waiting lists, verify/reject/dispute screens, reward-available display).
16. Atomic verify→unit→cycle→reward transaction (threshold sub-transaction; global lock ordering).
17. Idempotency (`purchase.create/verify/reject/dispute` + replay/conflict/in-progress semantics).
18. Outbox (extended event vocabulary incl. `reward_available`).
19. Concurrency/quantity-conservation tests (§33 walkthroughs a–d as executable cases + reconciliation queries + five-case shared matrix + version-snapshot cases).
20. Localhost Founder flow (§24, incl. threshold journey and replay-safety demo).

Still excluded: Reward redemption; Business-side dispute resolution/correction commands; reversal command; expiry; cancellation; archival; notification delivery/provider workers; billing; analytics; external POS/Mobile-Money/API integrations; hosted preview; Cloud SQL provisioning.

Justification: this is the smallest slice in which every persisted state is valid and reachable states have exits (create → verify | reject), no invalid gaps (no command writes a state it cannot justify), and nothing deferred can corrupt what is built (deferred transitions are simply unreachable; deferred packages consume only the outbox seam).

---

## 30. Acceptance criteria

1. Every §28 quality-bar item is answered in this report (authoritative datastore; version binding; immutable fields; initial state; authorized creators; server-side resolution + shared-policy enforcement; verification ownership; verification transaction incl. cycle allocation; unit representation + allocation/overflow; reversal provenance; duplicate/concurrent behavior; idempotency; rejection + dispute behavior; DB/relational constraints; PG-local program/version checks; cross-store races; audit/Trust Events/outbox; Notification Intent; inclusions/exclusions) — self-checked during authoring, re-checked in the `FD-CORR-001` pass (§32), and re-checked again in the `CORR-002` pass (§33: artifact snapshot truthfulness; position/event conservation; cycle/allocation/unit/reward relational scope; 19-step creation order; stream serialization + threshold concurrency; minimum Reward entitlement + governing-version terms; Trust cardinality/dedup; Intent source-linkage + uniqueness; fact-preserving states; single replacement FK; transactional reversal rules; constructional conservation; bounded-race wording).
2. No product behavior invented: each rule traces to a cited source or is explicitly flagged OPEN with fail-safe specified behavior.
3. No Founder decision required before 006A starts (§26 matrix).
4. 006A implementable without architectural invention (all patterns exist in 001–005A).
5. Independent review approves or reclassifies to BLOCKED with specific gaps.

---

## 31. Final disposition

**PLATFORM-BASELINE-006 — DESIGN CORRECTED / ITR-002 FINDINGS ADDRESSED / AWAITING FINAL INDEPENDENT APPROVAL.**

`PLATFORM-BASELINE-006A` may implement the §29 20-item scope without inventing product or architecture decisions, subject to final independent approval of this corrected design. Do not begin 006A in this task. Do not merge the design PR (PR #252 stays open, unmerged).

---

## 32. PLATFORM-BASELINE-006-FD-CORR-001 — Founder Decisions & Independent Review Corrections (2026-09-14)

### 32.1 What changed and why

The original assessment (committed as `dc1aaef`, PR #252) was written while `DEC-LOY-008` and `DEC-PROD-008` were `OPEN_FOUNDER` and while version-bump, shared-number-off, Trust Event, and authority questions had no Founder answer. It therefore scoped 006A defensively: universal pending units with no cycle mutation (Option A), verify-or-reject only, snapshot-governs flagged open, shared-off snapshotted-but-unenforced, outbox-only trust seam, no notification intent store. Five Founder decisions (`FD-PVL-001`…`FD-PVL-005`, recorded in `decision-register.md` — see the register's 2026-09-14 controlled-update banner) removed every one of those hedges, and independent review supplied the relational-integrity, reversal, PG-local, and intent findings. This correction pass revised the affected sections in place so the document reads as one current design; the original reasoning above is preserved here as history, not rewritten elsewhere.

Superseded original positions (history — do not implement): (a) Option A no-cycle-mutation with universal `loyalty_cycle_id NULL = pending` (§§15–16 original); (b) verify-or-reject-only with disputes redirected into rejection reasons (§§13–14 original); (c) version-bump-during-pending as an open product question (§9 original); (d) shared-number-off snapshotted but unenforced (§10 original); (e) outbox-as-trust-seam with zero trust rows (§22 original); (f) outbox-as-notification-trigger with no intent store (§23 original); (g) program/version resolution as a pre-transaction PG read (§§12/18 original).

### 32.2 Founder decisions recorded

- `FD-PVL-001` (DEC-DATA-008 Notes): PostgreSQL explicitly authorized for the Purchase/Verification/Unit/minimum-Cycle spine; no dual authority; no Firestore copy; no direct client access; Functions/API boundary; no auth redesign; bounded spine only.
- `FD-PVL-002` (DEC-LOY-008 → CONFIRMED, option a): immediate Cycle allocation in the verify transaction; sequential fill to exactly 10 → `reward_available`; overflow becomes durable/ordered/traceable pending allocation; never a second concurrent active cycle; forward allocation after redemption; sequential across subsequent cycles.
- `FD-PVL-003` (new row DEC-PROD-014 → CONFIRMED): creation-time version snapshot normative; V1 pending stays V1 across V2 publication; no rebinding; no verification block; program/version same-program integrity relational.
- `FD-PVL-004` (DEC-PROD-008 → CONFIRMED for MVP, option a): whole-record VERIFY / REJECT / RAISE DISPUTE; no partial verification; replacement-record correction; customer-side dispute in 006A; Business-side review deferred to 006B with `under_review` as safe holding state.
- `FD-PVL-005` (DEC-LOY-007 Notes): `sharedLoyaltyNumberAllowed=false` ⇒ current QR Identity required; five-case matrix; QR as customer-controlled artifact (not biometric/legal proof); no presenter/recorder/phone models; authoritative server resolution + artifact snapshot.

### 32.3 Finding-resolution matrix (all P1/P2 CLOSED)

| Finding | Root cause | Founder decision / design fix | Section(s) | Status |
|---|---|---|---|---|
| P1-1 Cycle allocation boundary | `DEC-LOY-008` open at assessment time; defensive Option A excluded allocation | `FD-PVL-002`: allocation inside the verify transaction; overflow model | §§13–16, 20, 24, 26, 28, 29 | CLOSED |
| P1-2 DEC-PROD-008 / partial/dispute | Partial-verify question open; dispute deferred | `FD-PVL-004`: whole-record verify/reject/dispute; dispute in 006A, Business review in 006B | §§13–15, 20, 24, 26, 28, 29 | CLOSED |
| P1-3 Shared-number-disabled enforcement | Flag stored but unenforced | `FD-PVL-005`: `false` ⇒ current QR required; five-case matrix | §§10, 12, 20 | CLOSED |
| P1-4 Pending-version semantics | Snapshot-governs flagged open | `FD-PVL-003`/`DEC-PROD-014`: snapshot normative; publication never blocks | §§9, 12, 16, 20, 26 | CLOSED |
| P1-5 Trust Event requirement | Outbox-only seam; no authoritative trust rows | `trust_events` in PG, per transition, same transaction; TRD10 §10.13.1 semantics translated | §§7, 14, 16, 20, 22 | CLOSED |
| P1-6 Explicit PostgreSQL authority | Authority derived from `DEC-DATA-008` direction only | `FD-PVL-001`: explicit bounded-spine authorization | §§1, 7, 20, 22 | CLOSED |
| P1-7 Relational constraints | FKs + prechecks only | Composite UNIQUE/FK pattern (A–D); state CHECKs (E); replacement guards (F); §20 | §§12, 18, 20 | CLOSED |
| P2-8 Verified Unit reversal linkage | Reversal shape without provenance link | `reverses_verified_unit_id` + correction link; positive qty; over-reversal guards; no 006A writer | §§15, 20 | CLOSED |
| P2-9 PG-local program/version checks | Program/version resolved pre-transaction | Lock + prove inside the creation transaction; Firestore checks only for external authorities | §§12, 18 | CLOSED |
| P2-10 State/correction integrity | Lifecycle integrity by convention/command allow-list | State CHECKs (verified_at/rejection/dispute/terminal consistency) + replacement guards; §19 conclusion restated | §§13, 19, 20 | CLOSED |
| P2-11 Durable Notification Intent | Outbox event treated as the trigger; no intent store | `notification_intents` in PG, per transition, same transaction; intent vs delivery split; 4 minimum intents | §§16, 20, 23 | CLOSED |

All P1/P2 findings are closed by this correction. The corrected design returns for one final independent design review; 006A implementation does not begin in this task.

---

## 33. PLATFORM-BASELINE-006-CORR-002 — ITR-002 Integrity Corrections (2026-09-14)

### 33.1 What changed and what did not

ITR-002 (P1×6/P2×6/P3×2) found engineering defects under the five already-recorded Founder decisions — no decision is reopened or altered here. The one place the task allowed discovering a new Founder decision (reward-terms version, §12 of the correction task) was inspected against current authority and **answered without one**: PRD6 ("Historical Loyalty Cycles must continue referencing the version that governed them… never rewrite historical cycle rules") + BR-066/067 + FR-RP-009/010 + `reward_description` living on the version row jointly determine that the Reward entitlement carries the cycle's `opened_under_version_id` — recorded in §15 with the full trail, relationally enforced in §20 (`rewards_governing_version` FK). Superseded CORR-001 positions (history — do not implement): forward-movement-new-rows (§§15–16 CORR-001); `loyalty_number_value`/`qr_reference` columns (§§8/20 CORR-001); outbox-shape trust rows without subject semantics (§22 CORR-001); sourceless intents (§23 CORR-001); null-erasing state CHECKs (§20 CORR-001); bidirectional replacement columns (§§19–20 CORR-001); conditional Reward language (§§15/28 CORR-001).

### 33.2 Conservation walkthroughs (manually proven against §§15–16/20)

- (a) **4 units into empty Cycle:** stream ensured + locked → cycle seq 1 created (allocated 0) → credit 4 → one position (4, allocated, Cycle 1, order 0) + `initial_placement` event → cycle.allocated = 4. SUM positions = 4 = credit ✓. Cycle sum = 4 ✓. No reward (4 < 10) ✓.
- (b) **4 units at progress 8:** stream + cycle locked, progress re-read (8) → room 2 → positions (2, allocated, Cycle 1) + (2, pending) + two events → cycle.allocated = 10 → threshold sub-transaction: Reward created once (UNIQUE backstop), cycle → `reward_available`, subject Trust Events, customer `reward_available` intent, outbox → commit. SUM = 2+2 = 4 = credit ✓. Cycle sum = 8+2 = 10, never 11 ✓. Exactly one Reward ✓.
- (c) **2 concurrent first verifications (credits 3 and 2), no cycle:** both `INSERT` stream (one wins, other hits designed `ON CONFLICT DO NOTHING` — no leaked violation) → serialize on stream lock → T1 creates cycle seq 1 (counter → 2), allocates 3 → commit → T2 locks stream, finds the current cycle (allocated 3), allocates 2 → cycle.allocated = 5, one current cycle (partial-unique backstop never fires). Both succeed correctly ✓. Quantity neither created nor lost: 3+2 = 5 across two credits, positions sum per credit ✓.
- (d) **2 concurrent verifications at 9/10 (credits 2 and 2):** serialize → T1 re-reads 9, room 1 → (1, allocated → 10, Reward, `reward_available`) + (1, pending) → commit → T2 re-reads `reward_available` (not active) → (2, pending) → commit. Exactly one threshold crossing, one Reward, no overfill ✓. SUMs hold per credit ✓.
- (e) **Pending moved after redemption (future package, mechanics defined now):** redemption txn locks stream → creates cycle seq N (counter) → converts pending positions in `(occurred_at, unit, order)` order via same-row `pending→allocated` + `pending_to_allocated` events → cycle counters updated → commit. Row count unchanged; SUM preserved by same-row transition ✓. 006A accumulates pending rows and never moves them (no redemption writer) — accumulation conservation is 006A-tested; movement conservation is future-package-tested against this contract.
- (f) **Replay of threshold-crossing verify:** idempotency peek returns the stored result before any write (same-key/same-request); same-key/different-request → `IDEMPOTENCY_CONFLICT`. No second credit (partial-unique backstop), no second Reward (`UNIQUE(loyalty_cycle_id)` backstop), no second positions ✓.
- **Shared-policy five cases** (§10 matrix) re-verified against the A/B/C columns + 19-step order: LN resolves yet still rejects when the locked version says `shared=false` (step 10); stale QR fails at Firestore resolution (step 4); client Customer ID has no input path ✓.

### 33.3 ITR-002 finding-resolution matrix (all CLOSED)

| Finding | Root cause | Correction | Section(s) | Status |
|---|---|---|---|---|
| P1-1 artifact snapshot schema | `loyalty_number_value NOT NULL` mislabeled QR-only truth | A/B/C columns: presented pair + resolved identity + server-derived canonical LN; exactly-one-form; client never sends Customer ID | §§8, 10, 12, 20, 24 | CLOSED |
| P1-2 overflow conservation | Split + new-row movement double-counts (2+2→new 2 = 6 from 4) | Positions = CURRENT; in-place pending→allocated; credit.qty = SUM(positions) invariant | §§15, 16, 20 | CLOSED |
| P1-3 cycle/allocation integrity | Missing composite proofs; unbounded counter | Composite FKs (version∈program, program∈Business, unit-tuple, cycle-scope, reward-version); 0–10 CHECK; scoped sequence + stream counter; single-current index kept | §§15, 20 | CLOSED |
| P1-4 creation/shared ordering | Qty/cap/shared final before locked version | 19-step order; shared-gate (step 10) + qty (step 11) inside txn on locked rules | §§12, 16, 18 | CLOSED |
| P1-5 first-cycle/threshold concurrency | No lockable first-cycle target; threshold races | Mechanism B: `loyalty_cycle_streams` parent (inspectable, FK-able, owns counter; conflict path designed) + global lock ordering; scenarios proven §33.2 | §§16, 17, 20, 29 | CLOSED |
| P1-6 reward entitlement | Conditional language; no table | `rewards` (TRD10 §10.12.1 shape); created exactly once in threshold txn; UNIQUE per cycle; redemption still excluded | §§15, 16, 20, 26, 28, 29 | CLOSED |
| P2-7 trust cardinality | All events forced into purchase aggregate FK | Causal root + subject_type/id + nullable per-type FKs; no polymorphic FK; cardinality + dedup UNIQUEs | §§20, 22 | CLOSED |
| P2-8 intent uniqueness | Idempotency-only dedup; no source link | `source_purchase_record_event_id` + UNIQUE(source,type,recipient); +`reward_available`→Customer intent | §§20, 23 | CLOSED |
| P2-9 reversal/correction | UNIQUE presented as over-reversal fix | Lock credit; prove replacement; txn remaining-qty sum check; allocation/cycle/reward adjustment rules; UNIQUE kept as duplicate guard only | §§15, 19, 20 | CLOSED |
| P2-10 state history | CHECKs nulled historical facts | Facts-required-at-transition, never erased, single-verdict guard; events hold full history | §§13, 19, 20 | CLOSED |
| P2-11 replacement pointers | Two mutable truths | Single `replaces_*` FK + UNIQUE; reverse via query; `replaced_by_*` removed | §§15, 19, 20 | CLOSED |
| P2-12 race wording | "Already historical" pre-commit | Accepted bounded-race language; checked-at-validation + snapshot + no-distributed-txn + revalidate-live; boundary tests | §§18, 30 | CLOSED |
| P3-13 summary arithmetic | Stale counts; 108 ≠ 109; 116 rows | Deterministic recount from actual rows (evidence in changes-log Entry 225): CONFIRMED 64, OPEN_FOUNDER 18, OPEN_ENGINEERING 7, OPEN_PROVIDER 5, OPEN_LEGAL 6, DEFERRED 10, SUPERSEDED 4, CLOSED 1, RESOLVED 1 = 116 | Register Summary | CLOSED |
| P3-14 stale PR body | Body describes pre-correction design | Metadata rewritten post-push (no commit) | PR #252 body | CLOSED |

No new Founder decision. 006A implementation does not begin in this task.

---

*Report path: `docs/05-implementation/reports/PLATFORM-BASELINE-006-purchase-verification-entry-technical-design-2026-09-14.md`*
*No implementation performed: no code, migrations, callables, UI, permissions, or infrastructure changes. Documentation-only branch with open PR; primary worktree untouched.*
