# 11thONUS PRD-to-TRD Traceability Gap Report

**Audit date:** 16 July 2026
**Purpose:** Audit input for the future Requirements Traceability Register (this is NOT the register itself).
**Status key:** COVERED = full technical coverage · COVERED* = covered with noted condition · GAP = missing/conflicting coverage · OPEN = blocked by open decision

For each major PRD capability: PRD source → TRD coverage → owning domain (per final TRD23 §23.7 model) → MVP phase (TRD22) → test expectation (TRD19) → status → gap → required action.

---

## 1. Customer Registration and Loyalty Identity
- **PRD source:** PRD0 §19.1; PRD2 (FR-CI-001..004); PRD1 §3
- **TRD coverage:** TRD10 §10.6 (users, customerProfiles), TRD12 §12.3–12.6 (auth, account linking), TRD16 §16.14, TRD22 Phase 2
- **Domain:** Identity · **Phase:** 2 · **Tests:** unit, emulator, security-rule (TRD19 §19.11 customer cases)
- **Status:** COVERED* — loyalty-number generation algorithm explicitly deferred to TRD by PRD2 §8 but no TRD section specifies the algorithm/format (only opacity requirements TRD10 §10.5, TRD12 QR/enumeration controls). Preferred-language optionality conflict (DOC-P2-003).
- **Required action:** Add loyalty-number/QR-reference generation spec to Engineering Standards; resolve DOC-P2-003.

## 2. Roles, Permissions and Account Ownership
- **PRD source:** PRD1 (AP-001..010, FR-RP-001..010-authz, BR-001..016); PRD10
- **TRD coverage:** TRD12 §12.7–12.16 (role contexts, claims, permission resolution), TRD10 §10.6.4 (businessMemberships), TRD18 (admin roles), TRD22 Phase 2
- **Domain:** Identity (+ Administration for admin roles) · **Phase:** 2, 12 · **Tests:** security-rule, authorization, state-transition
- **Status:** COVERED* — inheritance semantics conflict PRD1 vs PRD10 (DOC-P1-007); FR-RP ID collision breaks traceability keys (DOC-P1-001).
- **Required action:** Resolve inheritance semantics; renumber IDs.

## 3. Business Registration, Onboarding and Lifecycle
- **PRD source:** PRD3 (FR-BO-001..015, BR-027..036)
- **TRD coverage:** TRD10 §10.6.3, TRD14 §14.5–14.10 (classification), TRD22 Phase 3; business states aligned (draft…archived)
- **Domain:** Identity (record) + Administration (approval workflow) · **Phase:** 3 · **Tests:** integration, emulator
- **Status:** COVERED
- **Gap:** Owner self-suspension asserted in PRD1 matrix without workflow (DOC-P2-008).

## 4. Reward Program Configuration and Versioning
- **PRD source:** PRD4 §5, §15–16; PRD6 (FR-RP-001..012, BR-059..068)
- **TRD coverage:** TRD10 §10.9 (rewardPrograms, rewardProgramVersions), TRD22 Phase 4, TRD17 §17.23 (plan limit enforcement)
- **Domain:** Reward Programs (final model) — **currently listed under Loyalty in TRD10 §10.4** · **Phase:** 4 · **Tests:** unit, state-transition, entitlement
- **Status:** COVERED* — domain ownership correction pending (DOC-P0-004); threshold field constraint note pending (DOC-P0-003).
- **Required action:** Apply TRD23 ownership; annotate requiredVerifiedUnits MVP constraint.

## 5. Purchase Recording
- **PRD source:** PRD5 §8–§12 (FR-PVL-001..006); PRD0 §19.1
- **TRD coverage:** TRD10 §10.10.1, TRD11 §11.18 (flow), TRD12 §11.12 authorization, idempotency (TRD10 §10.30, TRD11 §11.14), offline queue (TRD16 §16.24, TRD22 §22.33), TRD22 Phase 5
- **Domain:** Purchase · **Phase:** 5 · **Tests:** idempotency, concurrency (duplicate submission), security-rule, offline sync
- **Status:** COVERED* — Purchase Record monetary fields mismatch (DOC-P1-010); phone-number lookup open (OPD-007).
- **Required action:** Resolve DOC-P1-010 and OPD-007 before Phase 5 UI freeze.

## 6. Customer Verification, Rejection and Dispute
- **PRD source:** PRD0 §14 (Cardinal Rule); PRD2 §13–§17; PRD5 §13–§17 (FR-PVL-007..012, BR-052..058)
- **TRD coverage:** TRD11 §11.19 (verification flow), §11.22–11.24 (rejection/dispute/correction), TRD10 §10.10.2 (disputes), batch policy TRD23 §23.13, TRD22 Phase 6
- **Domain:** Purchase (records/disputes) + Loyalty (consequences) · **Phase:** 6 · **Tests:** idempotency (duplicate verification), state-transition, security-rule (only registered customer), E2E
- **Status:** COVERED* — batch rejection contradiction (DOC-P1-006).
- **Required action:** Founder decision on batch rejection; otherwise fully covered.

## 7. Verified Units and Loyalty Cycles
- **PRD source:** PRD4 (CVLE-001..008, BR-037..046); PRD6 §9–§15 (BR-060..067)
- **TRD coverage:** TRD10 §10.11 (verifiedUnits credit/reversal, loyaltyCycles, projection rule, active-cycle uniqueness), TRD11 §11.20–11.21 (cycle-crossing quantity, pending allocation), TRD15 reconciliation, TRD22 Phase 7
- **Domain:** Loyalty · **Phase:** 7 · **Tests:** concurrency (cycle creation), reconciliation, idempotency
- **Status:** COVERED* — overflow/pending-unit allocation policy is an OPEN product decision (OPD-006) with a documented default; state-name normalization pending (DOC-P1-002).
- **Required action:** Confirm OPD-006 before Phase 7.

## 8. Reward Availability, Redemption and On Us Moments
- **PRD source:** PRD6 §16–§20 (BR-063..065, BR-069..077); PRD7 (FR-RL-001..009)
- **TRD coverage:** TRD10 §10.12 (rewards, redemptions, onUsMoments), TRD11 §11.25–11.26 (atomic redemption), TRD23 §23.12 (redemption actor), TRD22 Phase 8
- **Domain:** Reward · **Phase:** 8 · **Tests:** concurrency (simultaneous redemption), duplicate-redemption, E2E
- **Status:** COVERED* — reward state "Historical" (PRD7) vs canonical states (DOC-P1-002); reward quantity default open (OPD-004).
- **Required action:** Normalize states; confirm OPD-004 before schema freeze.

## 9. Shared Loyalty Number (Friends and Family)
- **PRD source:** PRD0 PD-010, §15.1/16.4; PRD1 §5.5, BR-006/016; PRD2 §12; PRD5 §11
- **TRD coverage:** TRD10 (sharedLoyaltyNumberAllowed on program/version), TRD23 §23.6 + Consolidation Audit §10, TRD21 §21.41 (privacy of family use), TRD12 (loyalty number does not authenticate)
- **Domain:** Reward Programs (policy) + Purchase (records) · **Phase:** 4–6 · **Tests:** security-rule, E2E
- **Status:** COVERED — one of the most consistent concepts in the suite.

## 10. High-Quantity Purchases and Operational Review
- **PRD source:** PRD0 OP-011, PD-022; PRD5 §23 edge cases; PRD8 §12
- **TRD coverage:** TRD10 (bulkReviewThreshold), TRD11 §11.20, TRD18 (review queue), Consolidation Audit §8 (no auto-rejection), TRD22 Phase 11 anomaly rules
- **Domain:** Purchase + Trust · **Phase:** 5–7, 11 · **Tests:** unit (threshold), integration (review creation)
- **Status:** COVERED* — contradicted only by the superseded data-model's auto-reject rate limit (DOC-P0-002); no conflict within the current generation.

## 11. Trust Events, Audit and Operational Integrity
- **PRD source:** PRD4 §21 (Trust Ledger); PRD8 (OI-001..007, FR-TM-001..008)
- **TRD coverage:** TRD10 §10.13 (trustEvents, operationalReviews, auditRecords), TRD12 §12.38–12.39 (vs security logs), Consolidation Audit §5.5, TRD19 §19.18 (Trust Ledger testing)
- **Domain:** Trust · **Phase:** cross-cutting from Phase 1 · **Tests:** event contract, append-only enforcement
- **Status:** COVERED — naming mapping note needed (DOC-P3-005).

## 12. Notifications
- **PRD source:** PRD2 §19; PRD5 §19; PRD7 §18
- **TRD coverage:** TRD13 (full architecture: intent, templates, channels, quiet hours, dedup), TRD10 §10.15, TRD9 (provider adapters), TRD22 Phase 9 with launch-critical template list
- **Domain:** Notification (+ Integration for delivery) · **Phase:** 9 · **Tests:** dedup/idempotency, localization
- **Status:** COVERED — providers open (OTD-008, EXT).

## 13. Reporting and Analytics
- **PRD source:** PRD9 (FR-BI-001..008, BR-086..090)
- **TRD coverage:** TRD15 (Metric Catalogue, projections, freshness, isolation), TRD10 §10.16, TRD22 Phase 11
- **Domain:** Reporting · **Phase:** 11 · **Tests:** projection rebuild, isolation
- **Status:** COVERED* — export format conflict (DOC-P2-002); benchmarking correctly future-only in both.

## 14. Subscription and Billing
- **PRD source:** PRD0 §18 (PD-004/005/019); PRD3 §8–§11, §22 (FR-BO-003/008/015)
- **TRD coverage:** TRD17 (full lifecycle, entitlements, grace, suspension, customer protection), TRD9 §9.14 (payment flow), TRD10 §10.14, TRD22 Phase 10
- **Domain:** Subscription (+ Integration for providers) — **currently Administration in TRD10 §10.4** · **Phase:** 10 · **Tests:** webhook idempotency, entitlement enforcement, concurrency (upgrade)
- **Status:** OPEN — plan names (OPD-001), staff limits (OPD-002), trial rule (OPD-003), suspension reward policy (OPD-005), provider (OTD-009), plan basis wording (DOC-P1-005), domain ownership correction (DOC-P0-004).
- **Required action:** Largest cluster of open commercial decisions in the suite; resolve before Phase 10.

## 15. Platform Administration and Studios
- **PRD source:** PRD0 §15.5/§19.1; PRD10 §4; Knowledge Studio / Rules Studio root docs
- **TRD coverage:** TRD18 (11 admin roles, separation of duties, studio architecture, bulk jobs), TRD22 Phase 12, Consolidation Audit §14–15 (MVP boundaries)
- **Domain:** Administration (+ Commerce Knowledge, Rules) · **Phase:** 12 (studio basics in 3) · **Tests:** admin security cases, audit generation
- **Status:** COVERED

## 16. Offline Behavior
- **PRD source:** PRD0 §21.9 (flagged as needing technical requirements); PRD2 §9 (QR offline "where practical")
- **TRD coverage:** TRD8 §8.11, TRD16 §16.23–16.26, TRD22 §22.33, TRD23 §23.19 — consistent
- **Domain:** cross-cutting (Purchase queue + frontend) · **Phase:** 5, 13 · **Tests:** offline queue validation, idempotent sync
- **Status:** COVERED — best-aligned area in the suite.

## 17. Localization
- **PRD source:** PRD0 §8.1 (multilingual environments); CKS Part XI
- **TRD coverage:** TRD13 (keys, fallback, completeness), TRD10 §10.26, TRD22 Phase 13 + FR-IMP-007, TRD23 §23.34
- **Domain:** cross-cutting (Notification, Commerce Knowledge, frontend) · **Phase:** every phase + 13 · **Tests:** localization tests, no-untranslated-keys gate
- **Status:** COVERED

## 18. Privacy, Consent and Customer Rights
- **PRD source:** PRD2 §20, §25; CKS Part XII (progressive KYC)
- **TRD coverage:** TRD21 (full architecture), TRD10 (consentVersions), TRD22 Phase 14 gate
- **Domain:** Identity + cross-cutting · **Phase:** 2, 14 · **Tests:** rights-request workflow, retention jobs
- **Status:** COVERED* — legal validation external (LCD-001..006); minors policy open (LCD-005).

## 19. Fraud / Operational Controls Summary (control-type classification)
- Customer-controlled (preventive): mandatory verification, rejection, dispute — COVERED.
- Preventive (system): idempotency, duplicate-redemption prevention, server-only writes, rate limiting — COVERED.
- Detective: review thresholds, operational reviews, anomaly rules, staff attribution, Trust Events — COVERED.
- Administrative: suspension workflows, controlled corrections, audit — COVERED.
- Deferred: AI fraud scoring, Purchase Confidence score (PRD5 §21 future) — correctly deferred.
- **No current-generation control undermines legitimate multi-item purchases or bypasses customer verification.** (Superseded data-model rate-limit auto-rejection is the only violation — DOC-P0-002.)

## 20. TRD Capabilities Not Explicitly Authorized by the PRD (reverse check)
- Public business pages "where required for Reward Program visibility" (TRD23 §23.15) — PRD does not define public profiles; open as OPD-008. **OPEN.**
- onUsMoments as separate collection (TRD10 §10.12.3) — implementation projection of PRD7's "Your On Us Moments"; acceptable derived design. COVERED.
- Administrator role granularity (TRD18's 11 roles) — exceeds PRD10's single Super Administrator; PRD10 §18 permits future roles. COVERED* (confirm MVP admin role subset).
- Quarterly billing interval (TRD10 §10.14.1) — no PRD basis; confirm intervals in plan catalogue decision. OPEN (minor).

## Summary

| Status | Count of 18 capability areas |
| --- | --- |
| COVERED | 8 |
| COVERED* (condition noted) | 8 |
| OPEN (decision-blocked) | 2 (Subscription/Billing cluster; public profiles/reverse items) |
| GAP (no coverage) | 0 |

**Conclusion:** No launch-critical PRD capability lacks a technical implementation path. The gaps are decision gaps and normalization gaps, not architecture gaps. The traceability register can be initialized once requirement IDs are deduplicated (DOC-P1-001).
