# 11thONUS Decision Register

> **Title:** 11thONUS Decision Register
> **Version:** 1.0 · **Status:** Active governance record · **Classification:** Working (governance record)
> **Governing document:** 11thONUS Platform Constitution
> **Source-of-truth path:** `docs/00-governance/decisions/decision-register.md`
> **Last controlled update:** 2026-08-29 (`DEC-LEGAL-002-LEGAL-OPINION-RECON-001` — external Legal Opinion reconciliation: counsel's Comprehensive Legal Opinion & Core Terms Framework response filed verbatim as evidence and reconciled section-by-section against Founder FD-1–FD-7/`DEC-LOY-011`/existing architecture; thirteen Founder legal-architecture positions `LEG-FD-01`–`LEG-FD-13` recorded, confirming most counsel conclusions while declining several specific universal-rule recommendations (blanket "no monetary/cash value" reward phrasing, mandatory 60-day exit run-off, mandatory cash-conversion-on-exit duty, universal 30-day programme-change notice, universal 7/14/24/48 suspension periods, "data as consideration," Kirundi as a general application language, forced scrolling as universal) — each fully reconciled, none left contradictory; live-authority conflict search found zero tracked-document hits for any declined position. `EXT-LEG-002` updated `PENDING` → `EVIDENCE_RECEIVED` (External Dependencies Register). `DEC-LEGAL-002` Status unchanged (`OPEN_LEGAL`) — see its Notes field for the full update; one Founder decision (dispute-resolution forum/seat/rules) remains before Core Business Terms drafting can proceed to completion. §5 Register Summary counts unchanged (no CONFIRMED/OPEN status transition in this update). See the [Reconciliation Matrix](evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-reconciliation-matrix-2026-08-29.md). Docs-only; no `functions/`, `apps/web/`, Firestore Rules, or config change.) Previously: 2026-08-29 (`DEC-LOY-011` recorded CONFIRMED — Founder resolution per `DEC-LEGAL-002-FOUNDER-DISP-001`: Option (a), redeemable by default during business suspension, subject to governed exceptions (fraud/security/integrity/legal-regulatory/disputed-validity or another governed exception); commercial-relationship/subscription-status suspension alone does not block redemption; original `DEC-SUB-003` dependency removed (not replaced with `DEC-SUB-008`) as the approved position does not condition on any grace-period value; historical A–D options and question preserved for traceability, not superseded. `DEC-ID-005`'s dependency on `DEC-LOY-011` annotated as resolved; `DEC-ID-005` itself (a broader, separate question) remains `OPEN_FOUNDER`, unchanged. §5 Register Summary counts updated (CONFIRMED 45→46, OPEN_FOUNDER 23→22). See the [Legal Counsel Handoff Pack](evidence/DEC-LEGAL-002-FOUNDER-DISP-001-legal-counsel-handoff-pack-2026-08-29.md), reconciled to no longer ask counsel to choose the redemption model.) Previously: 2026-08-28 (`DEC-TECH-005` register-sync correction — MTAIP-001 11thONUS Alignment Closure: status corrected `OPEN_ENGINEERING` → `CONFIRMED`, with Final decision/Decision date (2026-07-19)/Approved by fields populated verbatim from the already-committed, Founder-signed [Version 1.0 Engineering Authorization Record](../version-1-engineering-authorization-record.md) §8 — the register entry itself had never been updated to match that record, despite the region being fixed in code and the `dev`/`staging` Firebase projects being provisioned accordingly since commit `ba43da1`. This is a traceability correction only; the region decision itself was not reopened or reinterpreted. `DEC-LEGAL-006` has the identical, unaddressed gap and was deliberately left untouched — outside this task's authorization; see the [MTAIP-001 Infrastructure Disposition](../11thonus-infrastructure-disposition-v1.md) and [Alignment Closure Report](../../05-implementation/reports/mtaip-001-alignment-closure-report-2026-08-28.md). §5 Register Summary counts updated (CONFIRMED 44→45, OPEN_ENGINEERING 13→12)). Previously: 2026-08-07 (`DEC-AUTH-001` recorded CONFIRMED — Founder Authentication Foundation Decisions D-A1–D-A5 per task `AUTH-P0-001`: D-A1 official `AUTH-*` work-package series (distinct from `ENG-P2-002/003/004`, no renumbering); D-A2 MVP providers = Phone OTP + Google (email/Apple/passkeys deferred, future additive); D-A3 duplicate-identity merge is a separate governed capability, Authentication never auto-merges; D-A4 SMS is a production-launch concern, build proceeds on the Firebase Auth Emulator; D-A5 customer/staff authentication separated. Records decisions only — authorises no engineering). Previously, same day: `DEC-GOV-009` & `DEC-GOV-010` recorded CONFIRMED — Founder G1/G2: Technical-Review scope (Architecture Review may satisfy DoD §2.6 for in-baseline packages; `-02` needs coverage) and Deployment/Preview/Manual-QA scope (not concern-completion criteria for a domain-layer concern) — clarification only, DoD not weakened). Previously, same day: `DEC-GOV-008` recorded CONFIRMED — Founder Option C: concern-level completion reporting within Capability 2; reporting granularity only, capability numbering/boundary unchanged. Previously, same day: `DEC-PROD-012` CLOSED — Founder Option D: gender not collected at MVP; entry updated to approved/implemented/closed with decision wording and implementation reference). Previously: 2026-07-30 (`RES-006A` — `DEC-DATA-007` CONFIRMED: loyalty-code format (`ABC-234`, checksum-enhanced `ABC-234-X` deferred), plain opaque QR reference, transactional-uniqueness collision handling, and the corrected idempotency invariant (at most one immutable assignment per platform user) recorded as an Engineering Lead decision, no Founder involvement required; see the [`RES-005` Dependency & Scope Analysis](evidence/DEC-DATA-007-dependency-scope-analysis-2026-07-30.md) and [`RES-006` Decision Package](evidence/DEC-DATA-007-decision-package-2026-07-30.md)). Previously: 2026-07-30 (`RES-004A` — `DEC-ID-003` CONFIRMED: Approved Permission Model (inheritance as default, explicit override permitted, sensitive permissions never implicit) and a separate Identity and Accountability Principle recorded per Founder decision following the `RES-004` decision package; three implementation prerequisites — Sensitive Permission Catalogue, Override-Resolution Rule, Permission Evaluation and Audit Design — recorded as unresolved, not designed by this recording; see the [Decision Package](evidence/DEC-ID-003-decision-package-2026-07-30.md)). Previously: 2026-07-30 (`RES-003B` — `DEC-SEC-001` CONFIRMED: authentication recovery order (SMS OTP → Retry/Resend → Google Sign-In → Email Verification → Assisted Support), progressive phone verification, merchant-assistance boundary, and 8 identity-recovery principles recorded per Founder decision following the `RES-003A` review session; see the [Decision Package](evidence/DEC-SEC-001-decision-package-2026-07-30.md) and [Founder Decision Review Package](evidence/DEC-SEC-001-founder-decision-review-package-2026-07-30.md)). Previously: 2026-07-30 (`RES-002B` — `DEC-PROV-004` CONFIRMED: Approved with Conditions, Firebase-native OTP + Google Sign-In within a broader Founder-approved Identity and Authentication Strategy; `DEC-SEC-001` remains open and unresolved by this recording; see the [Decision Package](evidence/DEC-PROV-004-decision-package-2026-07-30.md)). Previously: 2026-07-26 (`DEC-PROV-005-DEC` — `DEC-PROV-005` CONFIRMED: Option C, native backend observability with dedicated frontend diagnostics, initial implementation target Sentry, architecture-only approval; see the [Evidence Pack](evidence/DEC-PROV-005-error-monitoring-evidence-2026-07-26.md)). Previously: 2026-07-16 (Phase 3B — Batch A decisions recorded: DEC-GOV-001, DEC-GOV-006, DEC-LOY-010, DEC-DATA-003 CONFIRMED)

---

## 1. Governance and Use

**What this register governs.** Every product, commercial, technical, provider, legal and governance decision that shapes 11thONUS implementation is recorded here — confirmed, open, deferred, superseded or rejected. It is the single place to check whether a behavior is decided.

**Relationship to other documents.** The register sits below the Constitution, PRD, TRD and approved standards. It **records** decisions; it does **not** override a higher governing document. Where a register entry would change the Constitution, PRD or TRD, the entry is only implemented through a controlled amendment to that document (logged in the documentation changes log). CONFIRMED entries cite where the governing document already made the decision.

**Rule for coding agents.** An agent encountering behavior governed by an OPEN record (any `OPEN_*` status) must **stop and report** (TRD Ch. 22 §22.40). Agents may never select an option, assume a recommendation is approved, or infer a decision from an example.

**How decisions become approved.** The decision owner (normally the founder for product/commercial items) records the choice in *Final decision*, with *Decision date* and *Approved by*; status changes to CONFIRMED; the *Document corrections required* field drives the follow-up edits; the changes log records the update. Engineering, provider and legal items are approved by their named owner and, where they affect product behavior, countersigned by the founder.

**History.** SUPERSEDED and REJECTED records are never deleted; they preserve the rejected/replaced option and reference the replacing decision.

**Operational process.** The end-to-end lifecycle is defined in [decision-governance-workflow.md](../decision-governance-workflow.md); the step-by-step recording procedure is [decision-update-procedure.md](../decision-update-procedure.md). **Phase 3A governance review (16 July 2026):** all 28 OPEN_FOUNDER records were reviewed for context sufficiency, objective options, recommendation labelling, affected documents, consequences and dependencies; five wording clarifications were applied (no meaning changed, nothing approved). Founder batches referenced in record Notes follow the agenda's Batch A–E structure. **Phase 3B (16 July 2026):** Batch A recorded — DEC-GOV-001, DEC-GOV-006, DEC-LOY-010 and DEC-DATA-003 are now CONFIRMED (Founder-approved 16 July 2026); all four D0 freeze-blocking decisions are resolved. 24 OPEN_FOUNDER records remain (Batches B–E). See changes log Entry 006.

## 2. Status Definitions

| Status | Meaning |
|---|---|
| CONFIRMED | Clearly approved in current governing documents (source cited), or approved through this register |
| OPEN_FOUNDER | Requires the founder's product or commercial decision |
| OPEN_ENGINEERING | Requires technical investigation, tooling selection or proof of concept |
| OPEN_PROVIDER | Depends on selection of an external provider |
| OPEN_LEGAL | Requires legal or regulatory review (no legal conclusions are made here) |
| DEFERRED | Explicitly outside the MVP or not needed before its relevant phase; not a rejection |
| SUPERSEDED | Earlier option replaced by a later approved decision (reference preserved) |
| REJECTED | Explicitly considered and not accepted |

## 3. Priority Definitions

| Priority | Meaning |
|---|---|
| D0 | Freeze blocker — must be decided before documentation Version 1.0 freeze |
| D1 | Required before early implementation (Phases 0–2) |
| D2 | Required before the dependent implementation phase |
| D3 | Required before pilot or launch |
| D4 | Post-MVP or future decision |

Phases refer to TRD Chapter 22 (Phases 0–16).

## 4. Decision Records

Legend: fields with **—** are intentionally blank (OPEN records have no Final decision / Decision date / Approved by). "Pre-register approval" = decided in governing documents before this register existed; exact date not recorded.

---

### GOVERNANCE (DEC-GOV)

**DEC-GOV-001 — Final document hierarchy and Vision & Product Strategy disposition**
- Category: Governance · Status: **CONFIRMED** · Priority: **D0**
- Decision question: Which single document hierarchy governs — Constitution Part VII (9 documents incl. Vision & Product Strategy) or TRD23 §23.3 (10 documents incl. Decision Register and Implementation Change Log, without Vision & Product Strategy) — and will a Vision & Product Strategy document be authored or formally dropped?
- Context: The two governing documents list different hierarchies; arbitration of every other conflict depends on this. Registered per Phase 3 instruction; the Constitution is NOT amended by this record.
- Options identified: (a) amend Constitution Part VII to the TRD23 list plus explicit positions for Commerce Knowledge Standard and Canonical Reference; (b) amend TRD23 to match the Constitution; (c) author Vision & Product Strategy and keep Constitution list.
- Recommended direction: (a), as a deliberate versioned constitutional amendment (audit recommendation).
- Recommendation basis: Audit DOC-P1-008; Consolidation Plan Step 8.
- Current confirmed position: Constitution governs until amended; conflict is flagged OPEN in `docs/README.md` and the canonical reference.
- Founder decision required: Yes · Decision owner: Founder · Required by phase: pre-freeze · Blocks: documentation freeze
- Affected documents: Constitution Part VII; TRD23 §23.3; docs/README.md; canonical reference §9 · Affected domains: all (governance)
- Source references: audit DOC-P1-008; DR-ARCH-002
- Dependencies: constitutional amendment process (DEC-GOV-004)
- Risks if unresolved: conflicting arbitration rules during implementation disputes
- Final decision: **Approved, option (a).** Adopt the newer (TRD23 §23.3) governance hierarchy as the Constitution's official document hierarchy: Constitution → PRD → TRD → Commerce Knowledge Standard → Platform Design System → Engineering Standards → Operational Playbooks → API & Integration Guide → Decision Register → Implementation Change Log. Do **not** create a Vision & Product Strategy document; it is formally dropped from the hierarchy.
- Decision date: 2026-07-16 · Approved by: Founder (Kenogo)
- Implementation consequences: none directly (documentation only); unblocks documentation freeze
- Document corrections required: Constitution Part VII amendment (executed Phase 3B, versioned 1.0→1.1) + Amendment Record entry; canonical reference §9; docs index
- Notes: founder agenda Batch A (freeze blocker) — ✅ answered 2026-07-16 (Phase 3B)

**DEC-GOV-002 — Authority and role of the Decision Register**
- Category: Governance · Status: **CONFIRMED** · Priority: D1
- Decision question: What authority does this register hold?
- Context/Current confirmed position: The register records decisions and is listed in the governing hierarchy below Constitution/PRD/TRD (TRD23 §23.3); it does not override higher documents without amendment; open decisions must not be hidden in implementation assumptions (TC-004); coding agents implement only against approved documents (TC-011).
- Options identified: n/a (governance definition) · Recommended direction: n/a · Recommendation basis: n/a
- Founder decision required: No · Decision owner: Founder (custodian) · Required by phase: — · Blocks: —
- Affected documents: this register; decisions index · Affected domains: all
- Source references: TRD23 §23.3, TC-004, TC-011, §23.44; consolidation audit §22
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (via TRD23 approval)
- Implementation consequences: agents stop on OPEN records · Document corrections required: none · Notes: —

**DEC-GOV-003 — Canonical Reference is a controlled navigation document**
- Category: Governance · Status: **CONFIRMED** · Priority: D1
- Decision question: What is the status of `canonical-reference.md`?
- Current confirmed position: Controlled navigation and canonical-reference document; consolidates approved content; does not override Constitution, PRD or TRD; corrected accordingly in Phase 2.
- Options identified: n/a · Recommended direction: n/a · Recommendation basis: n/a
- Founder decision required: No · Decision owner: Founder · Required by phase: — · Blocks: —
- Affected documents: canonical reference · Affected domains: all
- Source references: Phase 2 instruction (founder); Phase 2 report §3; canonical reference header
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: 2026-07-16 (Phase 2 instruction) · Approved by: Founder
- Implementation consequences: agents cite Constitution/PRD/TRD for authority · Document corrections required: none · Notes: —

**DEC-GOV-004 — Constitutional amendment process**
- Category: Governance · Status: **CONFIRMED** · Priority: D1
- Decision question: How is the Constitution amended?
- Current confirmed position: Amendments are deliberate, documented, versioned and backward-conscious (Constitution Part VI); silent hierarchy changes prohibited.
- Options identified: n/a · Recommended direction: n/a · Recommendation basis: n/a
- Founder decision required: No (process exists) · Decision owner: Founder · Required by phase: — · Blocks: DEC-GOV-001 execution
- Affected documents: Constitution · Affected domains: governance
- Source references: Constitution Part VI
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (Constitution v1.0)
- Implementation consequences: — · Document corrections required: none · Notes: —

**DEC-GOV-005 — Architecture exception process**
- Category: Governance · Status: **CONFIRMED** · Priority: D1
- Decision question: How are deviations from approved architecture handled?
- Current confirmed position: Formal architecture-exception records (typed structure, approval, expiry/review) are required for any deviation listed in TRD23 §23.26; exceptions are rare and time-bound.
- Options identified: n/a · Recommended direction: n/a · Recommendation basis: n/a
- Founder decision required: No · Decision owner: Founder + Engineering Lead · Required by phase: Phase 0 onward · Blocks: —
- Affected documents: TRD23 · Affected domains: all
- Source references: TRD23 §23.26–23.27; TC-005
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (TRD approval)
- Implementation consequences: exception log maintained from Phase 0 · Document corrections required: none · Notes: —

**DEC-GOV-006 — Requirement-ID renumbering mapping approval**
- Category: Governance · Status: **CONFIRMED** · Priority: **D0**
- Decision question: Approve the preservation-first renumbering strategy (PRD1 §18 FR-RP→FR-AUTHZ; PRD10 §19 FR-RP→FR-RBAC; PRD6 keeps FR-RP; TRD20 OP→OR; TRD23 A→AS; PRD4 §19 gets FR-CVLE IDs) with a published mapping table?
- Context: FR-RP is used with three meanings and OP with two; the traceability register cannot be built on colliding IDs.
- Options identified: (a) strategy as proposed in the ID audit; (b) alternative prefixes; (c) full resequencing (not recommended).
- Recommended direction: (a) · Recommendation basis: Requirements ID Audit §5; TC-006; FR-TRC-009.
- Current confirmed position: duplicate IDs prohibited before freeze (TRD23 §23.28); collisions intentionally preserved until this approval.
- Founder decision required: Yes (mapping approval) · Decision owner: Founder · Required by phase: documentation Phase 4 / pre-freeze · Blocks: freeze; traceability register
- Affected documents: PRD1, PRD4, PRD6, PRD10, TRD20, TRD23 · Affected domains: all
- Source references: audit DOC-P1-001, DOC-P3-008; DR-ARCH-004
- Dependencies: — · Risks if unresolved: unusable traceability
- Final decision: **Approved, option (a).** Proceed with the requirement-ID renumbering strategy exactly as proposed in the Requirements ID Audit §5 (PRD1 §18 FR-RP→FR-AUTHZ; PRD10 §19 FR-RP→FR-RBAC; PRD6 keeps FR-RP; TRD20 OP→OR; TRD23 A→AS; PRD4 §19 gets FR-CVLE IDs). A complete Old ID → New ID mapping table must be produced and maintained; no requirement meaning may change during renumbering.
- Decision date: 2026-07-16 · Approved by: Founder (Kenogo)
- Implementation consequences: none yet (documentation Phase 4 executes the renumbering; this record authorizes it) · Document corrections required: renumbering pass + published mapping appendix — **execution scheduled for documentation Phase 4, not yet performed** · Notes: founder agenda Batch A (freeze blocker) — ✅ answered 2026-07-16 (Phase 3B); unlocks Phase 4

**DEC-GOV-007 — MVP administrator role subset**
- Category: Governance · Status: **OPEN_FOUNDER** · Priority: D2
- Decision question: Which of TRD18's eleven administrator roles are staffed/enabled at MVP launch (vs collapsed into fewer people with separated permissions)?
- Context: PRD10 defines one Super Administrator; TRD18 defines 11 sub-roles with separation of duties. Small-team reality needs an explicit launch subset.
- Options identified: (a) all 11 as permission sets held by few people; (b) launch subset (Super Admin + Support + Knowledge/Rules editor-approver pairs); (c) single super admin (conflicts with AAP-002).
- Recommended direction: (b) with separation-of-duties preserved for approvals · Recommendation basis: TRD18 AAP-002/§18.7.
- Current confirmed position: no universal administrator; separation of duties required (TRD18).
- Founder decision required: Yes · Decision owner: Founder · Required by phase: Phase 12 · Blocks: Phase 12 admin build
- Affected documents: TRD18; PRD10 · Affected domains: Administration
- Source references: audit traceability report §20; DR-ARCH-008
- Dependencies: — · Risks if unresolved: over-built admin or violated duty separation
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: admin role seeding · Document corrections required: TRD18 launch-subset note · Notes: founder agenda Batch E

**DEC-GOV-008 — Concern-level completion reporting within a capability**
- Category: Governance · Status: **CONFIRMED** · Priority: D2
- Decision question: How should the programme report completion status when a capability comprises several architectural concerns that mature at different rates (surfaced by `CAP-P2-002` / `CAP-P2-003` for Capability 2 — Customer Identity)?
- Context: `CAP-P2-002` concluded Capability 2 is NOT READY for closure; `CAP-P2-003` determined the underlying issue is not the capability boundary but the programme's inability to express completion at the level of an individual architectural concern. The Founder reviewed both and approved the in-boundary "Option C" refinement.
- Options identified: (A) maintain existing reporting; (B) split Customer Identity / Authentication / ITM into separate renumbered capabilities (evidence-ruled-out — ITM is internal-only, renumbering ripple, `DEC-IDENTITY-001` declined it); (C) in-boundary concern-level completion reporting.
- Recommended direction: (C) · Recommendation basis: `CAP-P2-003` §5–§8.
- Current confirmed position: **Approved — Option C.** Capability numbering and boundaries remain unchanged. Capability 2 continues to comprise the customer-facing Customer Identity capability as presently defined; Customer Identity, Authentication, and Identity Trust Management (ITM) remain **architectural concerns** within that capability per `DEC-IDENTITY-001`. The programme shall introduce **concern-level completion reporting** so an individual concern's status/completion position can be recorded independently while the overall capability remains open. **Concern Completion does not constitute Capability closure**; capability closure continues to require satisfaction of the existing capability-level completion criteria. This refinement changes **reporting granularity only** — it does not create new capabilities, renumber capabilities, alter engineering identifiers, or modify the product architecture. ITM remains an internal architectural concern, not a numbered customer-facing capability. Terminology: `Concern`, `Concern Status`, `Concern-Level Reporting`, `Concern Completion`.
- Founder decision required: Yes (recorded) · Decision owner: Founder · Required by phase: Phase 2 · Blocks: nothing (reporting refinement)
- Affected documents: `CDR-001` §2/§5; Master Delivery Workflow; Engineering Implementation Programme · Affected domains: all (programme governance)
- Source references: `CAP-P2-002`; `CAP-P2-003`; `DEC-IDENTITY-001`
- Dependencies: `DEC-IDENTITY-001` (concern definitions) · Risks if unresolved: capability-level reporting conflates a complete concern with unstarted concerns
- Final decision: **Approved — Option C (concern-level completion reporting within the unchanged Capability 2 boundary).** · Decision date: 2026-08-07 · Approved by: Founder
- Implementation consequences: `CDR-001` gains a Concern Status block for Capability 2; concern statuses recorded (Customer Identity `Implemented — Validation/Closure Pending`; Authentication/ITM `Not started — Unauthorised`; overall Capability 2 `Open — partially implemented; not closed`) · Document corrections required: applied 2026-08-07 (`CAP-P2-004`) · Notes: concern-level *completion criteria* are not yet defined in the repository — recorded position uses the strongest evidence-supported existing status; defining formal concern-completion criteria would be a separate future Founder decision, not assumed here. Implementation reference: [`CAP-P2-004` report](../../05-implementation/reports/CAP-P2-004-concern-level-completion-reporting-2026-08-07.md).

**DEC-GOV-009 — Technical Review scope for concern completion (Definition of Done §2.6)**
- Category: Governance · Status: **CONFIRMED** · Priority: D2
- Decision question: Does the capability-level Architecture Review satisfy the [Definition of Done](../../06-engineering-governance/definition-of-done.md) §2.6 Technical Review requirement for constituent engineering packages, or is a per-package Technical Review always required? (Gap G1 from `CAP-P2-005`.)
- Context: `CAP-P2-005` found no per-package Technical Review records for the `ENG-P2-001` children; they were validated by capability-level Architecture Reviews (`ENG-P2-ARCH-REVIEW-001`/`-002` + corrections).
- Options identified: (a) require a separate per-package Technical Review for every package; (b) allow the capability-level Architecture Review to satisfy DoD §2.6 for packages within its baseline.
- Recommended direction: — · Recommendation basis: `CAP-P2-005` G1.
- Current confirmed position: **Approved.** The capability-level Architecture Review and its associated Architecture Corrections may satisfy the Technical Review requirement for constituent engineering packages **where those packages were included within the review baseline and no new architectural decision was introduced after that review**. A separate per-package Technical Review is not automatically required for every `ENG-P2-001` package. Where a package was implemented **after** the applicable Architecture Review baseline, that package must receive appropriate architecture/technical review coverage **before its concern may be declared complete**. `ENG-P2-001-02` was implemented after `ENG-P2-ARCH-REVIEW-002` and therefore requires review coverage before Customer Identity concern completion. **This decision clarifies review scope only; it does not weaken the Definition of Done.**
- Founder decision required: Yes (recorded) · Decision owner: Founder · Required by phase: Phase 2 · Blocks: nothing (clarification)
- Affected documents: [Definition of Done](../../06-engineering-governance/definition-of-done.md); `CDR-001` §5 · Affected domains: all (engineering governance)
- Source references: `CAP-P2-005` (G1); Definition of Done §2.6; `ENG-P2-ARCH-REVIEW-001`/`-002`
- Dependencies: `DEC-GOV-008` · Risks if unresolved: concern completion blocked by an over-broad reading of DoD §2.6
- Final decision: **Approved as stated (G1).** · Decision date: 2026-08-07 · Approved by: Founder
- Implementation consequences: `ENG-P2-001-01`,`-03`–`-10` DoD §2.6 satisfied via Architecture Reviews; `ENG-P2-001-02` requires review coverage before concern completion · Document corrections required: applied 2026-08-07 (`CAP-P2-006`) · Notes: implementation reference [`CAP-P2-006` report](../../05-implementation/reports/CAP-P2-006-concern-completion-policy-and-customer-identity-reassessment-2026-08-07.md).

**DEC-GOV-010 — Deployment / Preview / Manual QA scope for concern completion (Definition of Done §2.8–§2.10)**
- Category: Governance · Status: **CONFIRMED** · Priority: D2
- Decision question: Do the deployment, Preview Review, and Manual QA items of the Definition of Done bind Concern Completion for a domain-layer concern with no deployable customer-facing surface? (Gap G2 from `CAP-P2-005`.)
- Context: the Customer Identity concern in its present state delivers domain/persistence layers, not a customer-facing surface; DoD §2.8–2.10 are surface-level validations.
- Options identified: (a) require deployment/Preview/Manual QA for concern completion regardless; (b) classify them at the appropriate lifecycle stage when no deployable surface exists at concern level.
- Recommended direction: — · Recommendation basis: `CAP-P2-005` G2.
- Current confirmed position: **Approved.** Definition of Done items relating to deployment, Preview Review, and Manual QA are **not automatically required for Concern Completion** where the concern does not itself deliver a deployable customer-facing surface. For a domain-layer concern such as Customer Identity in its present implementation state, these requirements belong to later **Capability Closure, Release Readiness, or Production Readiness** unless an authoritative package specifically defines them as concern-level exit criteria. Concern Completion requires evidence appropriate to the concern's actual delivery layer. **This decision does not waive deployment, Preview Review, or Manual QA from the programme; it classifies them at the appropriate lifecycle stage.**
- Founder decision required: Yes (recorded) · Decision owner: Founder · Required by phase: Phase 2 · Blocks: nothing (classification)
- Affected documents: [Definition of Done](../../06-engineering-governance/definition-of-done.md); `CDR-001` §5 · Affected domains: all (engineering governance)
- Source references: `CAP-P2-005` (G2); Definition of Done §2.8–2.10; TRD19 §19.52; TRD22 §22.45
- Dependencies: `DEC-GOV-008` · Risks if unresolved: concern completion blocked by surface-level criteria a domain-layer concern cannot yet satisfy
- Final decision: **Approved as stated (G2).** · Decision date: 2026-08-07 · Approved by: Founder
- Implementation consequences: DoD §2.8–2.10 classified as Capability Closure / Release-Production Readiness for the Customer Identity concern; not concern-completion blockers · Document corrections required: applied 2026-08-07 (`CAP-P2-006`) · Notes: implementation reference [`CAP-P2-006` report](../../05-implementation/reports/CAP-P2-006-concern-completion-policy-and-customer-identity-reassessment-2026-08-07.md).

---

### PRODUCT BEHAVIOR (DEC-PROD)

**DEC-PROD-001 — Product category**
- Category: Product · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: **11thONUS is a Customer-Verified Loyalty Platform.** "Cloud-based/cloud-hosted" describes delivery only; Verified Commerce™ is the long-term direction, never an MVP label.
- Decision question / Options / Recommendation: n/a — settled.
- Founder decision required: No · Decision owner: Founder · Required by phase: — · Blocks: —
- Affected documents: all · Affected domains: all
- Source references: Constitution Art. 1; consolidation audit §3.1–3.2; TRD23 §23.9
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (Constitution)
- Implementation consequences: copy and positioning · Document corrections required: none (applied Phase 1) · Notes: —

**DEC-PROD-002 — Universal customer verification**
- Category: Product · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: Every Purchase Record remains `waiting_for_customer` until the registered customer verifies it — regardless of recorder (owner, manager, staff, POS, API, offline sync). No actor exempt in the MVP. Only verified records create Verified Units.
- Decision question / Options / Recommendation: n/a — cardinal rule.
- Founder decision required: No · Decision owner: Founder · Required by phase: — · Blocks: —
- Affected documents: PRD0 §14, PRD1, PRD5; TRD10/11 · Affected domains: Purchase, Loyalty, Trust
- Source references: PD-013/PD-014; AP-005; BR-005/009/052/058; consolidation audit §3.5, §9.1
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (PRD0 §24)
- Implementation consequences: IM-004 (verification never deferred from core slice) · Document corrections required: none · Notes: supersedes DEC-PROD-007

**DEC-PROD-003 — Burundi-first launch; RW/UG/KE expansion**
- Category: Product · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: Initial market Burundi (Bujumbura-first pilot); planned expansion Rwanda, Uganda, Kenya; country behavior configurable, never hardcoded.
- Founder decision required: No · Decision owner: Founder · Options/Recommendation: n/a
- Required by phase: — · Blocks: —
- Affected documents: PRD0 §8; TRD22 · Affected domains: all
- Source references: PD-002/PD-003; CP-010; TAP-009
- Dependencies: country legal reviews (DEC-LEGAL-001..006) · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (PRD0 §24)
- Implementation consequences: BIF seed pricing, Burundi rules · Document corrections required: none · Notes: —

**DEC-PROD-004 — Businesses pay; customers never pay**
- Category: Product · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: Businesses are the paying subscribers; consumers do not pay for basic participation; plans never limit customers, purchase recording or verification.
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Founder · Required by phase: — · Blocks: —
- Affected documents: PRD0 §18; PRD3; TRD17 · Affected domains: Subscription
- Source references: PD-004/PD-005; BR-028/BR-030; TRD17 §17.4
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (PRD0 §24)
- Implementation consequences: entitlement design · Document corrections required: none · Notes: —

**DEC-PROD-005 — No customer purchase-payment processing in the MVP**
- Category: Product · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: The platform records qualifying activity but does not process customers' purchase payments; businesses reconcile externally. Subscription payments (business-side) are processed via an external provider.
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Founder · Required by phase: — · Blocks: —
- Affected documents: PRD0 §21.4; PRD8 §13; TRD22 · Affected domains: Purchase, Integration
- Source references: PRD0 §21.4; TRD23 A-004/A-005; TRD22 deferred list (wallet/payments)
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (PRD approval)
- Implementation consequences: no PCI-type scope in MVP · Document corrections required: none · Notes: wallet is DEC-FUT-002

**DEC-PROD-006 — Offline MVP boundary**
- Category: Product · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: Offline permits only: cached app shell, safe cached QR, cached reference data, queued Purchase Record creation with visible sync status. Verification, rejection, disputes, redemption, payment and administration require online confirmation. Unsynchronized records are non-authoritative.
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Founder · Required by phase: Phases 5, 13 · Blocks: —
- Affected documents: TRD8 §8.11; TRD16 §16.23–16.26; TRD22 §22.33; TRD23 §23.19 · Affected domains: Purchase, frontend
- Source references: consolidation audit §12; FR-IMP-008
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (TRD approval)
- Implementation consequences: offline queue design only · Document corrections required: none · Notes: —

**DEC-PROD-007 — Owner auto-approval of purchases (historical)**
- Category: Product · Status: **SUPERSEDED** · Priority: —
- Decision question: Should owner-recorded purchases be automatically approved?
- Context: Early Product Definition stated "Owner transactions are automatically approved" with configurable customer confirmation.
- Superseded by: **DEC-PROD-002** (universal customer verification). Historical option preserved in `docs/99-archive/superseded/product-definition-superseded-v1.md` (banner added Phase 1).
- Options identified: historical · Recommended direction: n/a · Recommendation basis: n/a · Current confirmed position: see DEC-PROD-002
- Founder decision required: No · Decision owner: — · Required by phase: — · Blocks: —
- Affected documents: archived Product Definition · Affected domains: Purchase, Trust
- Source references: audit DOC-P0-001 · Dependencies: — · Risks if unresolved: —
- Final decision: superseded · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (PRD0 PD-014)
- Implementation consequences: none · Document corrections required: none · Notes: —

**DEC-PROD-008 — Partial approval of multi-quantity Purchase Records**
- Category: Product · Status: **OPEN_FOUNDER** · Priority: D2
- Decision question: When 5 units are recorded but the customer agrees only 4 were purchased, may the customer partially verify (4 of 5), or must they reject/dispute the whole record for correction?
- Context: PRD2 §28 open question; PRD5 dispute flow implies dispute→corrected replacement.
- Options identified: (a) dispute→business issues corrected replacement (no partial verify); (b) customer partial-verify with automatic quantity adjustment; (c) reject whole record.
- Recommended direction: (a) — preserves immutability and business acknowledgment · Recommendation basis: PRD5 §16–17, BR-056 correction model.
- Current confirmed position: none (explicitly open).
- Founder decision required: Yes · Decision owner: Founder · Required by phase: Phase 6 · Blocks: verification UX and dispute flow
- Affected documents: PRD2 §28, PRD5; TRD11 §11.23–11.24 · Affected domains: Purchase
- Source references: DR-PROD-004
- Dependencies: DEC-LOY-010 (batch rejection) · Risks if unresolved: agents invent verification UX
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: verify command contract · Document corrections required: PRD2/PRD5 clarification · Notes: founder agenda Batch B

**DEC-PROD-009 — Pending-purchase reminder and expiry defaults**
- Category: Product · Status: **OPEN_FOUNDER** · Priority: D2
- Decision question: What are the seed values for verification reminder timing, reminder frequency, pending-purchase expiry and archival?
- Context: The referenced "Business Rules Catalogue" never existed; Phase 1 redirected references to Rules Studio typed rules (TRD22 §22.31); TRD23 §23.18 uses 24h reminder as an example only. No values approved anywhere.
- Options identified: value sets to be proposed (e.g., reminder at 24h/72h, expiry 30/60/90 days).
- Recommended direction: none imposable — values genuinely unset · Recommendation basis: —
- Current confirmed position: rules are typed and configurable via Rules Studio (confirmed); values open.
- Founder decision required: Yes · Decision owner: Founder · Required by phase: Phases 6 & 9 · Blocks: reminder jobs, expiry state
- Affected documents: PRD0 §14.5; PRD2 §18; Rules Studio seed · Affected domains: Purchase, Notification, Rules
- Source references: DR-PROD-008; audit DOC-P1-009
- Dependencies: DEC-PROD-010 · Risks if unresolved: unverifiable expiry behavior
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: Rules Studio seed data · Document corrections required: seed-rule documentation · Notes: founder agenda Batch B

**DEC-PROD-010 — Recoverability of expired pending purchases**
- Category: Product · Status: **OPEN_FOUNDER** · Priority: D2
- Decision question: Is `expired` terminal, or can a customer still verify an expired Purchase Record (or ask the business to re-issue it)?
- Context: PRD0 §14.5 wants "approval of older records"; the canonical state model has `expired`; interaction undefined.
- Options identified: (a) expiry terminal, business may re-record; (b) expired records recoverable within a window; (c) no expiry in MVP (records pend indefinitely with reminders).
- Recommended direction: none — genuine product choice · Recommendation basis: —
- Current confirmed position: none.
- Founder decision required: Yes · Decision owner: Founder · Required by phase: Phase 6 · Blocks: state-transition table
- Affected documents: PRD5 §7; TRD state models · Affected domains: Purchase
- Source references: DR-PROD-009; terminology audit C.6
- Dependencies: DEC-PROD-009 · Risks if unresolved: undefined transition implemented ad hoc
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: transition validation · Document corrections required: PRD5/Engineering Standards transition table · Notes: founder agenda Batch B

**DEC-PROD-011 — Dispute evidence attachments**
- Category: Product · Status: **DEFERRED** · Priority: D4
- Decision question: May customers attach photos/receipts when disputing?
- Context: PRD2 §28 open question; TRD22 Phase 6 deliverables include customer comments only.
- Options identified: comments-only MVP (current scope) vs attachments.
- Recommended direction: revisit after pilot evidence · Recommendation basis: TRD22 Phase 6 scope; scope-protection rule §22.7.
- Current confirmed position: MVP dispute = reason + comment (TRD22).
- Founder decision required: Only if pilot shows need · Decision owner: Founder · Required by phase: post-MVP · Blocks: nothing in MVP
- Affected documents: PRD2 §28; TRD22 · Affected domains: Purchase
- Source references: DR-PROD-014 · Dependencies: pilot evidence (AS-006 area) · Risks if unresolved: none for MVP
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: none now · Document corrections required: close PRD2 §28 item at Phase 7 · Notes: —

**DEC-PROD-012 — Optional gender values and wording**
- Category: Product · Status: ~~**OPEN_FOUNDER**~~ **CLOSED** — approved & implemented (Option D), 2026-08-07 · Priority: D2
- Decision question: Approve the optional-gender value set and localized wording (TRD10 example enum: female/male/non_binary/prefer_not_to_say/other)?
- Context: TRD10 enum is provisional (Phase 1 note); OPD-009 requires product + privacy confirmation; cultural/legal input for Burundi advisable.
- Options identified: (a) TRD10 enum as-is; (b) reduced set with prefer_not_to_say; (c) free-text; (d) omit gender at MVP.
- Recommended direction: none — no single recommendation was made; options (a) and (d) both remained viable and legal input (EXT-LEG-001) was advised before choosing · Recommendation basis: TRD21 data-minimization. **[RESOLVED 2026-08-07: Founder selected Option (d) — omit gender at MVP; see Final decision.]**
- Current confirmed position: ~~gender is optional and never blocks participation (confirmed); values open.~~ **[CLOSED 2026-08-07] Gender is not collected at MVP; the `gender` attribute is removed from the MVP Customer Profile schema. A future governed release may reintroduce an optional gender attribute additively (backwards-compatible) under a separate governed decision. Gender never blocks participation (unchanged).**
- Founder decision required: ~~Yes (with legal input)~~ **Resolved 2026-08-07 (no legal input required for the MVP omit decision).** · Decision owner: Founder + legal adviser · Required by phase: Phase 2 (progressive profile) · Blocks: ~~profile schema freeze~~ **[DISCHARGED 2026-08-07] Nothing — gender removed from MVP; the profile schema may be frozen without it; `ENG-P2-001-02` no longer gated by this decision.**
- Affected documents: TRD10 §10.6.2; TRD21 §21.11 · Affected domains: Identity
- Source references: OPD-009; DR-PROD-011 · Dependencies: EXT-LEG-001 (re-scoped 2026-08-07 — now applicable only to a future governed release that proposes collecting gender information; no longer blocks MVP) · Risks if unresolved: ~~schema churn~~ **n/a (resolved)**
- Final decision: **Option (d) — For the MVP, customer gender shall not be collected. The `gender` attribute is removed from the MVP Customer Profile schema. The platform shall preserve the ability to introduce an optional gender attribute in a future governed release without breaking compatibility. No legal dependency is required for MVP implementation. EXT-LEG-001 remains applicable only if a future governed release proposes collecting gender information. This decision closes DEC-PROD-012.** · Decision date: 2026-08-07 · Approved by: Founder
- Implementation consequences: profile schema (gender omitted from MVP) · Document corrections required: ~~TRD10 enum finalization~~ **applied 2026-08-07 — TRD10 §10.6.2 gender removed from MVP schema (future-additive note); TRD21 §21.11 annotated; PRD2 §5 optional-list gender removed; EXT-LEG-001 re-scoped; `ENG-P2-001-02` unblocked** · Implementation reference: [`DEC-PROD-012` Implementation & `ENG-P2-001-02` Unblock report](../../05-implementation/reports/DEC-PROD-012-implementation-and-eng-p2-001-02-unblock-2026-08-07.md) · Notes: founder agenda Batch D (D7 — resolved)

**DEC-PROD-013 — Birthday visibility and campaign use**
- Category: Product · Status: **OPEN_FOUNDER** · Priority: D4
- Decision question: Confirm that businesses receive birthday **campaign eligibility** signals only, never the customer's date of birth.
- Context: TRD21 §21.10 already prescribes eligibility-not-disclosure; birthday campaigns themselves are post-MVP.
- Options identified: (a) eligibility-only (documented direction); (b) month-level disclosure with consent.
- Recommended direction: (a) · Recommendation basis: TRD21 §21.10; consolidation audit §17.
- Current confirmed position: strong documented direction, awaiting formal confirmation before feature activation.
- Founder decision required: Yes (at feature activation) · Decision owner: Founder · Required by phase: post-MVP birthday feature gate · Blocks: birthday features only
- Affected documents: TRD21 · Affected domains: Identity, Notification
- Source references: OPD-010; DR-PROD-012 · Dependencies: marketing-consent legal review (EXT-LEG-001)
- Risks if unresolved: none for MVP · Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: none now · Document corrections required: none now · Notes: founder agenda Batch D

---

### LOYALTY AND REWARDS (DEC-LOY)

**DEC-LOY-001 — Ten-Verified-Unit threshold, fixed in MVP**
- Category: Loyalty · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: requiredVerifiedUnits = **10**, a fixed platform rule in the MVP, not business-configurable; position 11 is the On Us reward; stored in versioned configuration; future configurability only through formal product approval, never retroactive. Customer promise: "Every 11th, on us."
- Decision question / Options / Recommendation: n/a — settled.
- Founder decision required: No · Decision owner: Founder · Required by phase: — · Blocks: —
- Affected documents: PRD6 §4.4; TRD10 §10.9.2; Rules Studio · Affected domains: Reward Programs, Loyalty, Rules
- Source references: PD-006; consolidation audit §4; TRD23 §23.10; TRD22 §22.5
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (PRD0 §24)
- Implementation consequences: typed platform rule · Document corrections required: none (annotated Phase 1) · Notes: supersedes DEC-LOY-012

**DEC-LOY-002 — One active or reward-available cycle per customer per Reward Program**
- Category: Loyalty · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: MVP permits exactly one active or reward-available Loyalty Cycle per customer per Reward Program, enforced transactionally server-side; completed cycles immutable.
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Founder · Required by phase: Phase 7 · Blocks: —
- Affected documents: PRD6; TRD10 §10.11.2 · Affected domains: Loyalty
- Source references: BR-063; FR-RP-007 (PRD6); consolidation audit §3.7
- Dependencies: DEC-LOY-008 (overflow) · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (PRD approval)
- Implementation consequences: uniqueness enforcement · Document corrections required: none · Notes: —

**DEC-LOY-003 — Multi-quantity purchases allowed; high quantity reviewed, never auto-rejected**
- Category: Loyalty · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: One Purchase Record may carry multiple qualifying units; legitimate multi-item purchases are never automatically rejected; configurable review thresholds create visibility only; customer verification remains the primary control.
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Founder · Required by phase: Phases 5–7 · Blocks: —
- Affected documents: PRD0 OP-011/PD-022; PRD6 §11; TRD11 §11.20; TRD10 (bulkReviewThreshold) · Affected domains: Purchase, Loyalty, Trust
- Source references: consolidation audit §8; BR-080
- Dependencies: threshold seed values (Rules Studio) · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (PRD0 §24)
- Implementation consequences: review-queue rules · Document corrections required: none · Notes: —

**DEC-LOY-004 — Corrections via reversal/replacement only**
- Category: Loyalty · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: Commercial history is immutable; corrections occur through replacement records and reversal events, never edits or deletions; corrected records require customer re-verification.
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Founder · Required by phase: Phase 6 · Blocks: —
- Affected documents: PRD0 PD-016/017; PRD5 BR-048/056; TRD10 DAP-004 · Affected domains: Purchase, Loyalty, Trust
- Source references: TAP-007; DA-012
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (PRD0 §24)
- Implementation consequences: no update-in-place APIs · Document corrections required: none · Notes: —

**DEC-LOY-005 — No automatic reward expiry in MVP**
- Category: Loyalty · Status: **CONFIRMED** · Priority: D2
- Current confirmed position: Earned rewards do not auto-expire in the MVP; the `expired` reward state is architecturally supported but not enabled; future expiry policies possible per program.
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Founder · Required by phase: Phase 8 · Blocks: —
- Affected documents: PRD6 §20; PRD7 §10; consolidation audit §7.8 · Affected domains: Reward
- Source references: PRD6 §12/§20; TRD22 deferred list
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (PRD approval)
- Implementation consequences: state supported, job disabled · Document corrections required: none (Phase 1 aligned PRD7) · Notes: —

**DEC-LOY-006 — Batch verification limited to visible reviewed set**
- Category: Loyalty · Status: **CONFIRMED** · Priority: D2
- Current confirmed position: Customer may verify one record, selected visible records, or all records in an explicitly reviewed visible set; the system never verifies hidden/paginated/newly loaded records silently.
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Founder · Required by phase: Phase 6 · Blocks: —
- Affected documents: TRD23 §23.13; consolidation audit §9.2; TRD22 Phase 6 · Affected domains: Purchase
- Source references: as above
- Dependencies: DEC-LOY-010 (rejection is separate) · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (TRD approval)
- Implementation consequences: verify-visible-set command constraint · Document corrections required: none · Notes: —

**DEC-LOY-007 — Shared loyalty number (friends and family)**
- Category: Loyalty · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: Friends/family may quote the registered customer's loyalty number where the Reward Program permits (policy on program version); the Purchase Record attaches to the registered customer, who alone verifies; quoting never grants account access or authentication; no auto-account for the quoting person.
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Founder · Required by phase: Phases 4–6 · Blocks: —
- Affected documents: PRD1 §5.5/BR-006/016; PRD2 §12; PRD5 §11; TRD21 §21.41 · Affected domains: Reward Programs, Purchase, Identity
- Source references: PD-010; BR-021/022; consolidation audit §10
- Dependencies: DEC-LEGAL-005 (children/family data) · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (PRD0 §24)
- Implementation consequences: program-version policy flag · Document corrections required: none · Notes: —

**DEC-LOY-008 — Overflow Verified Unit allocation policy**
- Category: Loyalty · Status: **OPEN_FOUNDER** · Priority: **D1**
- Decision question: When verified quantity crosses the 10-unit threshold (e.g., 4 verified units at progress 8/10), do the 2 overflow units wait as *pending allocation* until the outstanding reward is redeemed, and then apply chronologically to the next cycle?
- Context: TRD recommends exactly that default (complete cycle → one available reward → hold remainder pending → apply after redemption → possibly complete next cycle); explicitly flagged as requiring formal confirmation.
- Options identified: (a) documented default (hold pending until redemption); (b) immediately open next cycle and apply overflow (permits multiple stacked rewards — conflicts with DEC-LOY-002); (c) forfeit overflow units (listed for completeness; conflicts with the documented trust principles OP-002/CP-001 and BR-046 transparency).
- Recommended direction: (a) · Recommendation basis: TRD11 §11.20–11.21; TRD23 §23.11; consolidation audit §8.3.
- Current confirmed position: none — explicitly open (OPD-006).
- Founder decision required: **Yes** · Decision owner: Founder · Required by phase: Phase 7 · Blocks: Loyalty Domain implementation
- Affected documents: TRD11, TRD23 §23.11; PRD6 · Affected domains: Loyalty
- Source references: OPD-006; DR-PROD-001; canonical reference §2 OPEN marker
- Dependencies: DEC-LOY-002 · Risks if unresolved: agents cannot implement threshold crossing
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: pending-unit representation, allocation job · Document corrections required: TRD11/PRD6 confirmation notes; canonical reference §2 update · Notes: founder agenda Batch B — highest-priority founder decision

**DEC-LOY-009 — Reward quantity default and >1 support**
- Category: Loyalty · Status: **OPEN_FOUNDER** · Priority: D2
- Decision question: Is the On Us reward always exactly one eligible item/service in the MVP, or may a launch Reward Program configure rewardQuantity > 1?
- Context: TRD10 stores rewardQuantity as a number; OPD-004 asks whether any launch program needs >1.
- Options identified: (a) fixed 1 in MVP (schema keeps field); (b) configurable 1–N per program version.
- Recommended direction: (a) unless a concrete launch program requires more · Recommendation basis: OPD-004 wording; simplicity pillar.
- Current confirmed position: none.
- Founder decision required: Yes · Decision owner: Founder · Required by phase: Phase 4 (schema freeze) · Blocks: Reward Program schema freeze
- Affected documents: TRD10 §10.9.2; PRD6 §4.3 · Affected domains: Reward Programs, Reward
- Source references: OPD-004; DR-PROD-007
- Dependencies: — · Risks if unresolved: schema ambiguity
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: validation rule · Document corrections required: PRD6/TRD10 note · Notes: founder agenda Batch B

**DEC-LOY-010 — Batch rejection of purchases**
- Category: Loyalty · Status: **CONFIRMED** · Priority: **D0**
- Decision question: May a customer reject several purchases in one action (PRD0 §14.3 "reject selected purchases"), or is rejection strictly individual with a record-specific reason (TRD23 §23.13)?
- Context: Direct PRD-vs-TRD contradiction, flagged with a visible OPEN note in PRD0 §14.3 (Phase 1). Because the PRD sits above the TRD, the conflict cannot be resolved editorially.
- Options identified: (a) individual-only rejection with reason (TRD position); (b) batch rejection with one shared reason; (c) batch rejection requiring per-record reasons (hybrid).
- Recommended direction: (a) · Recommendation basis: TRD23 §23.13 rationale — rejections need record-specific reasons; trust model favors deliberate rejection.
- Current confirmed position: contradictory sources; treated as OPEN.
- Founder decision required: **Yes** · Decision owner: Founder · Required by phase: pre-freeze / Phase 6 · Blocks: documentation freeze; verification UI
- Affected documents: PRD0 §14.3; TRD23 §23.13; PRD1 §5.2 · Affected domains: Purchase
- Source references: audit DOC-P1-006; DR-PROD-003
- Dependencies: DEC-PROD-008 · Risks if unresolved: contradictory implementation instructions
- Final decision: **Approved, option (a).** Customers reject purchases individually — never in batch. Every rejected purchase records its own reason. Rationale given: different purchases may have different rejection reasons.
- Decision date: 2026-07-16 · Approved by: Founder (Kenogo)
- Implementation consequences: reject command contract is single-record only, reason required per rejection (already TRD23 §23.13's position) · Document corrections required: PRD0 §14.3 corrected to remove batch rejection + OPEN note replaced with confirmed note; PRD1 §5.2 clarified · Notes: founder agenda Batch A (freeze blocker) — ✅ answered 2026-07-16 (Phase 3B)

**DEC-LOY-011 — Reward redemption during business suspension**
- Category: Loyalty · Status: **CONFIRMED** · Priority: D2
- Decision question (preserved for historical traceability): Are already-earned rewards redeemable while a business subscription is suspended — throughout suspension, during grace only, subject to manual review, or not until reactivation?
- Context: TRD17 §17.19–17.20 distinguishes platform access from the business's obligation to honour earned rewards, and notes customer trust favors preservation; explicit rule required.
- Options identified (historical, preserved — not superseded, resolved): (a) redeemable throughout suspension; (b) redeemable during grace period only; (c) manual review; (d) blocked until reactivation.
- Recommended direction (historical): none formally — as an observation, the governing documents lean toward preservation (options (a) or (b)); this is not an approval · Recommendation basis: TRD17 §17.20; OPD-005 ("customer trust strongly favors preservation").
- Current confirmed position: **Resolved 2026-08-29 (Founder, `DEC-LEGAL-002-FOUNDER-DISP-001`) — Option (a) as the default, subject to governed exceptions.** This record distinguishes two previously conflated questions: **(1) survival of the earned obligation** — already confirmed pre-2026-08-29 ("suspension never erases earned rewards") and independently reinforced by `DEC-LEGAL-002-FOUNDER-DISP-001`'s FD-2 (which adds a legal-impossibility/counsel-override exception, informing `DEC-LEGAL-002`, not this record) — and **(2) default operational redeemability during suspension**, resolved here: valid rewards earned before suspension remain redeemable during suspension by default; suspension may stop or restrict new loyalty activity (new earning, new Reward Programs, other applicable Business capabilities) without automatically preventing redemption of already-earned rewards; redemption may nevertheless be restricted, paused, or subject to additional review only where the specific suspension reason makes continued redemption inappropriate or unsafe (suspected fraud, security/integrity concerns, legal/regulatory requirements, disputed reward validity, or another governed exception); suspension arising solely from the Business's commercial relationship with 11thONUS (including subscription/payment status) must not by itself prevent redemption of otherwise valid earned rewards. The participating Business remains responsible for fulfilment; continued redemption does not make 11thONUS the guarantor or fulfiller of the reward.
- Founder decision required: No — resolved 2026-08-29 · Decision owner: Founder · Required by phase: Phase 10 · Blocks: suspension implementation (unblocked by this resolution)
- Affected documents: TRD17 §17.19–17.20 (correction required — see Implementation consequences) · Affected domains: Reward, Subscription
- Source references: OPD-005; DR-PROD-002
- Dependencies: — (`DEC-SUB-003` dependency removed 2026-08-29; see Notes) · Risks if unresolved: — (resolved)
- Final decision: Option (a), redeemable by default during suspension, subject to governed exceptions for fraud/security/integrity/legal-regulatory/disputed-validity reasons or another governed exception; operational governance to define the exception/manual-review process without making manual review the default; legal counsel to advise on legally required exceptions, notices, remedies, and enforceability · Decision date: 2026-08-29 · Approved by: Founder
- Implementation consequences: redemption-eligibility check (default-allow during suspension, exception-gated, not manual-review-by-default); exception/manual-review workflow — not yet designed, operational governance item · Document corrections required: TRD17 §17.19–17.20 to state the default-redeemable-with-governed-exceptions rule (not performed by this task) · Notes: founder agenda Batch B. Original `DEC-SUB-003` (Trial structure) dependency removed rather than replaced with `DEC-SUB-008` (grace-period mechanics): the approved position does not condition redemption eligibility on any grace-period value — Option (a), not the grace-only Option (b), was chosen as the default — so no dependency on either `DEC-SUB-*` item applies to this record. Legal counsel and later operational governance may still reference commercial/billing terms when designing the exception process, but this decision itself does not depend on them. See [DEC-LEGAL-002-FOUNDER-DISP-001 Legal Counsel Handoff Pack](evidence/DEC-LEGAL-002-FOUNDER-DISP-001-legal-counsel-handoff-pack-2026-08-29.md) for the reconciled counsel questions.

**DEC-LOY-012 — Configurable per-listing threshold defaulting to 11 (historical)**
- Category: Loyalty · Status: **SUPERSEDED** · Priority: —
- Decision question: Should the redemption threshold be configurable per listing with default 11?
- Context: Legacy data-model design. Superseded by: **DEC-LOY-001** (fixed 10). Historical option preserved in `docs/99-archive/superseded/legacy-data-model-superseded-v1.md`.
- Options/Recommendation: historical · Current confirmed position: see DEC-LOY-001
- Founder decision required: No · Decision owner: — · Required by phase: — · Blocks: —
- Affected documents: archived data model · Affected domains: Loyalty
- Source references: audit DOC-P0-002/003 · Dependencies: — · Risks if unresolved: —
- Final decision: superseded · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (PD-006)
- Implementation consequences: none · Document corrections required: none · Notes: —

**DEC-LOY-013 — Reward Program pause/migration/seasonal variants**
- Category: Loyalty · Status: **OPEN_FOUNDER** · Priority: D2
- Decision question: (a) Confirm pause preserves accumulated progress and outstanding rewards; (b) may businesses migrate customers between Reward Programs under controlled conditions in MVP; (c) are seasonal variants under one Loyalty Cycle supported in MVP?
- Context: PRD6 §28 open questions; PRD6 §5 already implies pause preserves progress and retirement preserves redeemability.
- Options identified: (a) yes (documented direction); (b) MVP: no migration / future controlled migration; (c) MVP: no seasonal variants.
- Recommended direction: (a) confirm; (b) and (c) defer beyond MVP · Recommendation basis: PRD6 §5; TRD22 scope-protection rule.
- Current confirmed position: pause/retire semantics documented; migration and variants unaddressed.
- Founder decision required: Yes · Decision owner: Founder · Required by phase: Phase 4 · Blocks: program lifecycle edge cases
- Affected documents: PRD6 §5/§28 · Affected domains: Reward Programs, Loyalty
- Source references: DR-PROD-013
- Dependencies: — · Risks if unresolved: minor (edge cases)
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: lifecycle guards · Document corrections required: PRD6 §28 closure · Notes: founder agenda Batch B

---

### IDENTITY, ROLES AND PERMISSIONS (DEC-ID / DEC-SEC / DEC-IDENTITY)

**DEC-IDENTITY-001 — Progressive Trust Identity Strategy**
- Category: Identity · Status: **CONFIRMED** · Priority: **D1**
- Decision question: Should Authentication, Identity, and Verification remain conflated (as `DEC-PROV-004`/`DEC-SEC-001` originally framed them, per the Capability 2 Resolution Sprint of 2026-07-30), or be separated into independent capabilities, with verification made progressive rather than a mandatory onboarding gate?
- Context: The Capability 2 Resolution Sprint (2026-07-30) confirmed `DEC-PROV-004`/`DEC-SEC-001` with the phone number framed as canonical identity and a coarse three-tier trust model. The Founder subsequently determined this conflates concepts that should remain independently governable, and unnecessarily front-loads verification into registration — contrary to the already-established `CP-007` (Progressive KYC) in the Platform Constitution.
- Options identified: not applicable — Founder-originated constitutional decision, not an engineering-evaluated option set.
- Current confirmed position: **Approved.** Authentication, Identity, and Verification are separated into independent capabilities. Verification is no longer required for initial participation in the standard loyalty programme.
- Founder decision required: No (received) · Decision owner: Founder · Required by phase: Phase 2 (precedes `ENG-P2-001`) · Blocks: — (resolved; unblocks a corrected `ENG-P2-001`/Authentication/Identity Trust Management capability design, per `IDENTITY-ALIGN-001`)
- Affected documents: `DEC-PROV-004` (amended, below); `DEC-SEC-001` (amended, below); `CDR-001` §5 (amended, `IDENTITY-ALIGN-001`); `ENG-P2-RES-000` §7 (amended, `IDENTITY-ALIGN-001`); External Dependencies Register `EXT-TECH-001` (reclassified, `IDENTITY-ALIGN-001`); PRD2 §4/§5/§7; TRD12 §12.3/§12.4.1; Canonical Reference §10 · Affected domains: Identity, Security, Integration
- Source references: Platform Constitution `CP-007` (Progressive KYC, pre-existing); `DEC-ID-001` (pre-existing permanent-identity model) · Dependencies: none (this decision is upstream of, not gated by, `EXT-TECH-001`/`DEC-PROD-012`) · Risks if unresolved: — (resolved)
- Final decision: *"11thONUS shall separate Authentication, Identity, and Verification into independent capabilities. Verification shall no longer be required for initial participation in the standard 11thONUS loyalty programme. Verification becomes part of the Progressive Trust model. Identity Principle: Customer Identity is permanent. Identity exists independently of verification. Identity consists of: Internal Customer ID; Loyalty Number; Customer QR Code. Phone number, email and future identity attributes belong to the identity but do not create it. Authentication Principle: Authentication provides access to identity. Authentication providers may include Google, Apple, Email, Phone OTP, Passkeys, and future approved providers. Authentication is independent of trust. Progressive Trust Principle: Verification strengthens identity. Verification never creates identity. Verification contributes progressively to confidence over time. Standard Participation Principle: Customers may register, receive a loyalty identity, participate, earn qualifying purchases, and redeem the standard 11th reward, without mandatory phone verification. Risk-Based Verification Principle: Verification requirements shall be proportional to risk. Higher-risk activities may require additional verification. Ordinary loyalty participation shall not. Merchant Principle: Merchants may assist onboarding. Merchants never become identity-verification authorities. Recovery Principle: Identity recovery restores the existing identity. Recovery never creates a replacement identity."* · Decision date: 2026-08-01 · Approved by: Founder
- Implementation consequences: amends `DEC-PROV-004`/`DEC-SEC-001` (below); requires the capability-architecture, gate, and tracking-document alignment performed under `IDENTITY-ALIGN-001` (not full engineering implementation — `ENG-P2-001` remains `Blocked` pending its own future authorization) · Document corrections required: see Affected documents above; applied under `IDENTITY-ALIGN-001` where listed as "amended" — PRD2/TRD12/Canonical Reference wording corrections tracked as follow-on, not yet performed · Notes: the internal engineering capability name for the Progressive Trust principle is **Identity Trust Management (ITM)** — never customer-facing. Full analysis: [Impact Assessment](evidence/FD-IDENTITY-001-impact-assessment-and-migration-plan-2026-08-01.md); [Founder Decision Package](evidence/FD-IDENTITY-001-founder-decision-package-2026-08-01.md); [`IDENTITY-ALIGN-001` Implementation Report](../../05-implementation/reports/IDENTITY-ALIGN-001-implementation-report-2026-08-01.md).

**DEC-ID-001 — One portable loyalty identity**
- Category: Identity · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: Each customer owns one permanent loyalty identity (immutable internal ID + permanent loyalty number + QR) portable across all participating businesses; survives phone/email changes; loyalty numbers never reused.
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Founder · Required by phase: Phase 2 · Blocks: —
- Affected documents: PRD1 §3; PRD2 §4/§8 · Affected domains: Identity
- Source references: OP-005; BR-017/018; FR-CI-001..004
- Dependencies: DEC-DATA-007 (generation algorithm) · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (PRD approval)
- Implementation consequences: identity service design · Document corrections required: none · Notes: —

**DEC-ID-002 — Individual accounts; shared staff accounts prohibited**
- Category: Identity · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: Every business user operates through an individual account; shared staff/manager accounts prohibited; every action attributable.
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Founder · Required by phase: Phase 2 · Blocks: —
- Affected documents: PRD1 AP-002/BR-002; PRD10 BR-095 · Affected domains: Identity, Trust
- Source references: PD-011/PD-012
- Dependencies: DEC-SEC-003 (shared-device UX) · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (PRD0 §24)
- Implementation consequences: membership model · Document corrections required: none · Notes: —

**DEC-ID-003 — Permission inheritance semantics**
- Category: Identity · Status: **CONFIRMED** · Priority: **D1**
- Decision question: How do PRD10's role inheritance ("Owner inherits all Manager permissions; Manager inherits all Staff") and PRD1's explicit configurable grants (AP-008; manager restrictions unless specifically granted) combine into one permission-resolution algorithm?
- Context: Two authoritative PRD sections give implementers different algorithms (audit DOC-P1-007).
- Options identified: (a) inheritance defines the *default template*; explicit per-membership grants/revocations override; sensitive permissions never implicit (audit-recommended reconciliation); (b) strict inheritance; (c) no inheritance, explicit grants only. Engineering recommendation, preserved unmodified by this recording: [`RES-004` Decision Package](evidence/DEC-ID-003-decision-package-2026-07-30.md).
- Recommended direction: (a) · Recommendation basis: reconciles both texts; aligns TRD12 §12.11 permission resolution — engineering recommendation, unchanged by this recording.
- Current confirmed position: **Approved.** Option (a) confirmed as the permission-resolution model; a separate identity-and-accountability principle governing how permissions attach to identities is approved alongside it, per the Founder decision recorded below.
- Founder decision required: Approve with Conditions (received 2026-07-30) · Decision owner: Founder (with Engineering) · Required by phase: Phase 2 · Blocks: — (resolved; unblocks `ENG-P2-004`)
- Affected documents: PRD1 §7/§12; PRD10 §13; TRD12 §12.11–12.12 · Affected domains: Identity
- Source references: audit DOC-P1-007; DR-ARCH-005; [`RES-004` Decision Package](evidence/DEC-ID-003-decision-package-2026-07-30.md)
- Dependencies: — · Risks if unresolved: — (resolved; residual undesigned items tracked as implementation prerequisites, not decision risks)
- Final decision: *"Approved Permission Model: permission inheritance is the default, explicit overrides are permitted, and sensitive permissions must never be granted implicitly. This means: ordinary permissions are inheritable through the approved role hierarchy; inherited permissions remain subject to explicit override at the membership level; sensitive permissions require explicit assignment regardless of role; role inheritance must never silently grant a high-risk capability; and permission resolution must be deterministic and auditable. Identity and Accountability Principle: platform permissions are exercised by verified identities acting within assigned roles. Roles organise permissions, but accountability always belongs to the underlying identity. This means: a role is not an independent actor; every exercise of a permission must be attributable to an identity; audit records must identify both the accountable identity and the role context in which the permission was exercised; trust level and role-based permissions remain separate dimensions and neither substitutes for the other; and this principle does not alter the Progressive Trust Model confirmed under `DEC-PROV-004`, nor the identity-recovery and verification principles confirmed under `DEC-SEC-001`."* · Decision date: 2026-07-30 · Approved by: Founder
- Implementation consequences: unblocks `ENG-P2-004` (role context and permission resolution), which must implement the approved inheritance-plus-override model and the identity-accountability principle above; three implementation prerequisites remain unresolved by this recording and are not designed here: (1) the Sensitive Permission Catalogue (the enumerated list of permissions that may never be granted by inheritance alone); (2) the Override-Resolution Rule (how conflicting explicit grants/revocations resolve); (3) Permission Evaluation and Audit Design (the evaluation service and audit-record shape implementing `permissionSource` and identity-attribution above) — a related but distinct undesigned item, cross-business role-context isolation, remains separately disclosed in the Decision Package §8 and is likewise not resolved here · Document corrections required: PRD1/PRD10 clarifying cross-reference (per the Register's own field) — not performed by this recording task, flagged as follow-on work · Notes: downstream tracking artefacts (Engineering Implementation Programme, Master Workflow, Requirements Traceability Matrix, `CDR-001`) still describe `DEC-ID-003` as open — syncing these is outside this task's narrow "record the Founder decision only" scope, consistent with the same precedent `DEC-PROV-004`/`DEC-SEC-001` established; disclosed here as follow-on, not performed.

**DEC-ID-004 — Customer phone-number lookup by business staff**
- Category: Identity · Status: **OPEN_FOUNDER** · Priority: D2
- Decision question: May staff search customers by full phone number, or are QR and loyalty number the only normal methods (phone lookup restricted/fallback with logging)?
- Context: PRD5 §10 lists phone lookup "subject to permissions"; TRD12 says restricted and logged; OPD-007 leaves the product policy open.
- Options identified: (a) QR/loyalty number only; (b) phone lookup as restricted, logged fallback (permission-gated); (c) unrestricted phone lookup (conflicts with TRD12).
- Recommended direction: (b) · Recommendation basis: TRD12 §customer lookup privacy; TRD21 minimization.
- Current confirmed position: lookup must be privacy-restricted (confirmed); exact policy open.
- Founder decision required: Yes · Decision owner: Founder · Required by phase: Phase 5 · Blocks: purchase-recording UI
- Affected documents: PRD5 §10; TRD12; TRD21 · Affected domains: Identity, Purchase
- Source references: OPD-007; DR-PROD-005
- Dependencies: — · Risks if unresolved: privacy overexposure or workflow friction
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: lookup API + rate limits · Document corrections required: PRD5/TRD12 note · Notes: founder agenda Batch C

**DEC-ID-005 — Owner-initiated business self-suspension**
- Category: Identity · Status: **OPEN_FOUNDER** · Priority: D2
- Decision question: Does the MVP support owner-initiated suspension/pause of their own business, and with what effects?
- Context: PRD1 role matrix says "Self-suspend only"; PRD3 lists "Business request" as suspension reason; no workflow defined anywhere (audit DOC-P2-008).
- Options identified: (a) MVP supports owner pause (blocks new records, preserves history/rewards per suspension rules); (b) defer to post-MVP, owner contacts support.
- Recommended direction: none — genuine scope choice · Recommendation basis: —
- Current confirmed position: none.
- Founder decision required: Yes · Decision owner: Founder · Required by phase: Phase 12 · Blocks: admin workflows
- Affected documents: PRD1 §11; PRD3 §24; TRD18 §18.12 · Affected domains: Identity, Administration
- Source references: audit DOC-P2-008
- Dependencies: DEC-LOY-011 (resolved 2026-08-29 — see Decision Register entry; the reward-redemption treatment referenced by this decision's option (a) is now settled, but `DEC-ID-005` itself — whether the MVP supports owner-initiated self-suspension as a feature at all — is a broader, separate question not answered by that resolution and remains open) · Risks if unresolved: matrix promise unimplemented
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: suspension command variants · Document corrections required: PRD1/PRD3/TRD18 alignment · Notes: founder agenda Batch E

**DEC-ID-006 — Preferred language required at registration**
- Category: Identity · Status: **CONFIRMED** · Priority: D2
- Current confirmed position: Preferred language is a required registration field (defaultable from device/country) — per CKS Part XII, TRD22 §22.35, consolidation audit §17; PRD2 §6 aligned in Phase 1 with visible note.
- Founder decision required: No (may veto Phase 1 alignment) · Options/Recommendation: n/a
- Decision owner: Founder · Required by phase: Phase 2 · Blocks: —
- Affected documents: PRD2 §6; CKS XII; TRD22 §22.35 · Affected domains: Identity
- Source references: audit DOC-P2-003; Phase 1 report §4
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded (Phase 1 alignment 2026-07-16) · Approved by: Founder (standards approval)
- Implementation consequences: registration form default · Document corrections required: none · Notes: veto would reopen as OPEN_FOUNDER

**DEC-SEC-001 — Customer authentication approach and fallback**
- Category: Security · Status: **CONFIRMED** · Priority: **D1**
- Decision question: Confirm Firebase phone OTP as primary customer authentication for Burundi and define the fallback (email link, password+recovery, or assisted registration) if OTP delivery proves unreliable/costly.
- Context: Phone-primary is approved (PRD10 §15); Burundi delivery feasibility, cost and abuse controls unproven (OTD-004); fallback undefined.
- Options identified: (a) Firebase phone OTP + email fallback; (b) OTP via external SMS provider + custom auth; (c) password-based with phone verification. Engineering recommendation, preserved unmodified by this recording: [`RES-003` Decision Package](evidence/DEC-SEC-001-decision-package-2026-07-30.md); Founder-facing framing and options: [`RES-003A` Founder Decision Review Package](evidence/DEC-SEC-001-founder-decision-review-package-2026-07-30.md).
- Recommended direction: (a) pending proof · Recommendation basis: PRD10 §15; TRD12 §12.4 — engineering recommendation, unchanged by this recording.
- Current confirmed position: **Approved.** ~~Firebase phone OTP confirmed as primary customer authentication.~~ **[AMENDED 2026-08-12 — `AUTH-CORR-003`]** Phone OTP is **no longer the primary/mandatory customer authentication method**: per the Founder multi-provider decision (`DEC-AUTH-001` D-A2 as amended), the MVP approved providers are **Google + Email/Password + Phone OTP (optional, non-default)**, all alternative methods, none defining identity. The recovery/fallback order, progressive phone verification, merchant-assistance boundaries, and identity-recovery principles below remain approved and unchanged (the recovery-order clause already sequences Email Verification and Google alongside SMS OTP). Original "phone OTP primary" wording struck through, preserved for audit.
- Founder decision required: Countersign only (received 2026-07-30) · Decision owner: Engineering Lead, approved by Founder · Required by phase: Phase 2 · Blocks: — (resolved; unblocks `ENG-P2-001`, alongside `DEC-PROV-004`)
- Affected documents: TRD12 §12.4; §12.5 (Account Linking); §12.6/AIR-001 (Account Identity Rules); §12.30–12.31 (Account Recovery, Lost Phone Number); TRD23 OTD-004 · Affected domains: Identity, Integration, Support
- Source references: OTD-004; DR-TECH-004; [`RES-003` Decision Package](evidence/DEC-SEC-001-decision-package-2026-07-30.md); [`RES-003A` Founder Decision Review Package](evidence/DEC-SEC-001-founder-decision-review-package-2026-07-30.md) · Dependencies: `DEC-PROV-004` (**CONFIRMED** — satisfied); `EXT-TECH-001` (Burundi OTP proof — remains **PENDING**, a launch-readiness/production-verification matter per the Founder's own newly-recorded Identity Recovery Principle 5 — "verification requirements increase progressively according to risk" — not a blocker to this decision, consistent with how `DEC-PROV-004` itself treated the same evidence gap)
- Risks if unresolved: — (resolved; residual risks — the still-undesigned identity-resolution flow `RES-003` §9 flagged, and the `EXT-TECH-001` evidence gap — tracked as implementation/launch-readiness items, not decision risks)
- Final decision: *"Authentication Recovery Order: SMS OTP → Retry/Resend → Google Sign-In → Email Verification → Assisted Support. Progressive Phone Verification: [AMENDED by `DEC-IDENTITY-001`, 2026-08-01 — see below] phone verification strengthens confidence in a customer's existing identity, per `DEC-IDENTITY-001`'s Progressive Trust Principle — it does not establish that identity. Phone verification is not a universal onboarding blocker and is never required for standard loyalty participation, including registration, earning qualifying purchases, or redeeming the standard 11th reward, per `DEC-IDENTITY-001`'s Standard Participation Principle. The platform may progressively request phone verification, and require it before higher-risk actions proportional to that risk — per `DEC-IDENTITY-001`'s Risk-Based Verification Principle, examples include account-ownership changes, account recovery, identity transfer, and future gift, wallet, or financial features — never ordinary loyalty participation. Merchant Assistance: merchants may assist customers with onboarding and recovery as part of customer support, but they do not verify customer identity — identity authority remains with the platform. Identity Recovery: identity recovery restores an existing customer identity; it never creates a replacement identity. Recovered customers retain loyalty participation, purchase history, rewards, recognition, trust level, and customer history — recovery restores continuity. Identity Recovery Principles: (1) customer identity belongs to the customer, never to the authentication provider; (2) recovery restores the same customer identity; (3) recovery must never create a duplicate account; (4) loyalty participation continues across recovery; (5) verification requirements increase progressively according to risk; (6) recovery should be simple enough for ordinary users to complete independently; (7) every recovery action must be auditable; (8) protected capabilities may require verified identity even if earlier platform use did not."* · Decision date: 2026-07-30 (Progressive Phone Verification clause amended 2026-08-01, per `DEC-IDENTITY-001`/`IDENTITY-ALIGN-001`) · Approved by: Founder
- Implementation consequences: unblocks `ENG-P2-001` (customer identity/authentication implementation), which must incorporate the recorded fallback order, progressive phone-verification gating, merchant-assistance boundary, and identity-recovery principles — none of these are designed by this recording; the identity-resolution flow `RES-003` §9 flagged as an undesigned prerequisite must be designed against these principles · Document corrections required: TRD12 §12.4.1 (fallback-order wording); TRD12 §12.30/§12.31 (align existing recovery language with the newly-recorded Identity Recovery Principles, where not already consistent) — not performed by this recording task, flagged as follow-on work · Notes: downstream tracking artefacts synced under `IDENTITY-ALIGN-001` where listed in `DEC-IDENTITY-001`'s Affected documents. `EXT-TECH-001` remains `PENDING` — reclassified under `IDENTITY-ALIGN-001` as an Authentication-provider/Identity-Trust-Management readiness item (see the External Dependencies Register), not a baseline-registration blocker. Original pre-amendment text preserved unmodified in the [`RES-003` Decision Package](evidence/DEC-SEC-001-decision-package-2026-07-30.md), the [`RES-003A` Founder Decision Review Package](evidence/DEC-SEC-001-founder-decision-review-package-2026-07-30.md), and this file's git history. Full amendment rationale: [Founder Decision Package §5](evidence/FD-IDENTITY-001-founder-decision-package-2026-08-01.md#5-proposed-amendment--dec-sec-001).

**DEC-SEC-002 — Administrator MFA**
- Category: Security · Status: **CONFIRMED** · Priority: D2
- Current confirmed position: Platform administrators require MFA and enhanced session controls; admin access is permission-scoped and audited.
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Engineering Lead · Required by phase: Phase 12 · Blocks: —
- Affected documents: TRD12 §12.4.4; TRD18 §18.8–18.9; TRD22 Phase 12 · Affected domains: Security, Administration
- Source references: TRD22 §22.22 deliverables; TRD23 §23.32
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (TRD approval)
- Implementation consequences: MFA enrolment flow · Document corrections required: none · Notes: —

**DEC-SEC-003 — Staff authentication on shared devices**
- Category: Security · Status: **OPEN_ENGINEERING** · Priority: D2
- Decision question: How do individual staff accounts work on one shared shop device (fast account switching, PIN re-auth, session timeout) without weakening attribution?
- Context: PRD1 §8.5 requires simple staff authentication without weakening accountability; no mechanism specified.
- Options identified: (a) per-staff PIN switch on shared session; (b) full re-login per staff; (c) device-bound staff selection + PIN.
- Recommended direction: none — needs UX/security prototyping · Recommendation basis: —
- Current confirmed position: individual accountability mandatory (DEC-ID-002).
- Founder decision required: Countersign UX · Decision owner: Engineering Lead · Required by phase: Phase 2 · Blocks: staff app UX
- Affected documents: PRD1 §8.5; TRD12; TRD16 · Affected domains: Security, Identity
- Source references: Phase 3 task (shared-device handling); PRD1 §8.5
- Dependencies: DEC-SEC-001 · Risks if unresolved: staff share logins informally
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: session design · Document corrections required: TRD12/16 addition · Notes: —

---

### AUTHENTICATION (DEC-AUTH)

**DEC-AUTH-001 — Authentication Foundation Decisions (D-A1–D-A5)**
- Category: Authentication · Status: **CONFIRMED** · Priority: **D1**
- Decision question: Resolve the five remaining programme decisions the [`CAP-P2-009` Authentication planning](../../05-implementation/reports/CAP-P2-009-authentication-architecture-and-delivery-planning-2026-08-07.md) flagged (D-A1–D-A5), so the customer Authentication implementation stream may proceed without repeated governance interruptions.
- Context: Customer Identity is `Complete` (`CAP-P2-008`); Authentication planning is merged and authoritative (`CAP-P2-009`, PR #84). This decision records the Founder-approved foundations; it authorises **no** engineering — each Authentication work package still requires its own fresh implementation authorization.
- Options identified: not applicable — Founder-approved foundation decisions recorded per task `AUTH-P0-001`.
- Current confirmed position: **Approved (all five).**
- Founder decision required: No (received; recorded per `AUTH-P0-001`) · Decision owner: Founder · Required by phase: Phase 2 (precedes the Authentication implementation stream) · Blocks: — (resolved; clears the governance foundations for the Authentication stream)
- Affected documents: [`CDR-001` §5](../../05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity); [Engineering Implementation Programme](../../05-implementation/change-tracking/engineering-implementation-programme.md); [Master Delivery Workflow](../../05-implementation/11thonus-master-workflow.md) §17 · Affected domains: Identity, Security, Integration
- Source references: [`CAP-P2-009`](../../05-implementation/reports/CAP-P2-009-authentication-architecture-and-delivery-planning-2026-08-07.md); `DEC-PROV-004`; `DEC-SEC-001`; `DEC-IDENTITY-001`; `ENG-P2-ARCH-001` §7; TRD12 §12.4.1–12.6; External Dependencies Register `EXT-TECH-001` · Dependencies: `DEC-PROV-004`, `DEC-SEC-001`, `DEC-IDENTITY-001` (all CONFIRMED)
- Risks if unresolved: — (resolved)
- Final decision:
  - **D-A1 — Authentication Package Series.** The customer Authentication concern of Capability 2 has an official work-package series, the **`AUTH-*`** series: `AUTH-P0-001` (this foundation-decisions task), `AUTH-BP` (engineering blueprint), and `AUTH-01`–`AUTH-09` (implementation packages, per [`CAP-P2-009` §4](../../05-implementation/reports/CAP-P2-009-authentication-architecture-and-delivery-planning-2026-08-07.md)). These are Capability 2 Authentication-concern packages, **distinct from** `ENG-P2-002`/`ENG-P2-003`/`ENG-P2-004` (Business Identity / Staff Identity / role context — unchanged, **not renumbered**). Capability numbering is unchanged.
  - **D-A2 — MVP Authentication Providers.** ~~MVP provider set: **Phone OTP — Included; Google Sign-In — Included; Email/Password — Deferred; Apple Sign-In — Deferred; Passkeys — Deferred.**~~ **[SUPERSEDED 2026-08-12 by `AUTH-CORR-003`, Founder multi-provider decision — see the D-A2 amendment note below.]** Future providers remain additive without changing the customer's canonical identity (consistent with `DEC-PROV-004` point 4 / `DEC-IDENTITY-001` Authentication Principle). This fixes the MVP scope of `DEC-PROV-004`'s "initial approved mechanisms" and TRD12 §12.4.1's supported-provider list for the MVP.
    - **[AMENDED 2026-08-12 — `AUTH-CORR-003`, Founder multi-provider decision]** The MVP approved customer authentication providers are now: **Google Sign-In — Included; Email/Password — Included (initial direct-email mechanism; email-link/passwordless stays Deferred); Phone OTP — Included but OPTIONAL, non-default, non-mandatory (SMS unavailability in a market must never block registration via Google or Email/Password); Apple / email-link-passwordless / passkeys — Deferred.** Providers are **alternative authentication methods**; **no provider defines the 11thONUS customer identity** (one identity → one Firebase principal → one or more approved methods, per `DEC-IDENTITY-001`). Phone number and email may also be profile/contact attributes; changing contact data never redefines identity. The earlier "Email/Password Deferred; Phone OTP included (non-optional framing)" position is superseded (original text struck through above, preserved for audit). Firebase `sign_in_provider` for Email/Password is `password` (authoritative). This aligns the MVP with the already-equal-providers `TRD12 §12.4.1`. Implementation: [`AUTH-CORR-003`](../../05-implementation/reports/AUTH-CORR-003-multi-provider-authentication-2026-08-12.md).
  - **D-A3 — Duplicate Identity Merge Authority.** Duplicate-identity merge remains a **separate governed capability**. Authentication shall **never** automatically merge Customer Identity aggregates. Authentication may **identify a possible duplicate and refer it** to the governed merge process (consistent with `ENG-P2-001-08`'s detection/fail-closed behaviour and `ENG-P2-001-PLAN-001` §14 Ambiguity 4, which remains unresolved as automatic-merge authority).
  - **D-A4 — SMS Production Dependency.** The SMS-provider dependency (`EXT-TECH-001`, Burundi phone-OTP delivery) is a **production-launch** concern, **not** a build blocker. Authentication engineering **may proceed using the Firebase Auth Emulator** (and test numbers). Production activation remains governed by the existing external dependency `EXT-TECH-001` (`PENDING`) and `DEC-PROV-004` point 9 (comparative recommendation before any provider change).
  - **D-A5 — Staff Authentication Boundary.** Customer Authentication is **independent** from Staff Authentication. Staff Authentication (TRD12 §12.4.3; `DEC-SEC-003`, `OPEN_ENGINEERING`) remains **governed separately**. **No** staff-authentication scope shall enter the Customer Authentication stream.
  · Decision date: 2026-08-07 · Approved by: Founder
- Implementation consequences: clears the Authentication stream's governance foundations — numbering (`AUTH-*`), MVP provider scope (Phone OTP + Google), duplicate-merge boundary, SMS production classification, and staff/customer separation are now authoritative. **Authorises no engineering** — `AUTH-BP`/`AUTH-01`… each require their own fresh Founder implementation authorization. · Document corrections required: `CDR-001` §5, Engineering Implementation Programme, Master Delivery Workflow §17 — applied under `AUTH-P0-001`. · Notes: recorded per task `AUTH-P0-001`; see the [implementation report](../../05-implementation/reports/AUTH-P0-001-authentication-foundation-decisions-2026-08-07.md). `DEC-PROV-004`/`DEC-SEC-001`/`DEC-IDENTITY-001` are unchanged (this decision refines MVP scope and records boundaries, it does not amend them).

---

### SUBSCRIPTION AND COMMERCIAL MODEL (DEC-SUB)

**DEC-SUB-001 — Final plan names**
- Category: Subscription · Status: **OPEN_FOUNDER** · Priority: D2
- Decision question: What are the commercial plan names? Working labels: Starter / Growth / Professional.
- Context: OPD-001; Bronze/Silver/Gold explicitly not approved (consolidation audit §11.2; marked illustrative in Phase 1); architecture uses plan IDs/entitlements, not names.
- Options identified: (a) Starter/Growth/Professional; (b) localized commercial names; (c) other.
- Recommended direction: (a) as working default · Recommendation basis: TRD17 §17.7 working labels.
- Current confirmed position: names open; entitlement-based enforcement confirmed.
- Founder decision required: Yes · Decision owner: Founder · Required by phase: Phase 10 · Blocks: pricing publication, subscription UI
- Affected documents: TRD17; PRD3 §9; Rules Studio · Affected domains: Subscription
- Source references: OPD-001; DR-COMM-001; audit DOC-P2-001
- Dependencies: DEC-SUB-008 · Risks if unresolved: blocked pricing page only
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: plan catalogue seed · Document corrections required: TRD17/PRD3 naming pass · Notes: founder agenda Batch D

**DEC-SUB-002 — Staff limits per plan**
- Category: Subscription · Status: **OPEN_FOUNDER** · Priority: D2
- Decision question: Exact staff-account limits per plan?
- Context: OPD-002; Rules Studio examples (5/20/unlimited) illustrative only.
- Options identified: numeric sets to be proposed with plan catalogue.
- Recommended direction: none · Recommendation basis: —
- Current confirmed position: staff limits exist as plan entitlements (confirmed); values open.
- Founder decision required: Yes · Decision owner: Founder · Required by phase: Phase 10 · Blocks: entitlement service values
- Affected documents: TRD17 §17.24; TRD10 §10.14.1 · Affected domains: Subscription
- Source references: OPD-002; DR-COMM-002
- Dependencies: DEC-SUB-001/008 · Risks if unresolved: seed data blocked
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: entitlement values · Document corrections required: plan catalogue · Notes: founder agenda Batch D

**DEC-SUB-003 — Trial structure**
- Category: Subscription · Status: **OPEN_FOUNDER** · Priority: D2
- Decision question: Trial rule — time only, verified-purchase volume only, or whichever-first (PRD3 example: 30 days or 100 verified purchases)?
- Context: OPD-003; PRD3 example explicitly unapproved.
- Options identified: (a) time only; (b) volume only; (c) whichever-first.
- Recommended direction: (c) with values to set · Recommendation basis: PRD3 §11 example direction.
- Current confirmed position: a trial exists in MVP (confirmed, TRD17 §17.11); structure open.
- Founder decision required: Yes · Decision owner: Founder · Required by phase: Phase 10 · Blocks: trial implementation
- Affected documents: PRD3 §11; TRD17 §17.11–17.14 · Affected domains: Subscription
- Source references: OPD-003; DR-COMM-003
- Dependencies: DEC-SUB-008 · Risks if unresolved: trial logic blocked
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: trial rules seed · Document corrections required: PRD3 §11 finalization · Notes: founder agenda Batch D

**DEC-SUB-004 — Plan capacity counted in active Reward Programs**
- Category: Subscription · Status: **CONFIRMED** · Priority: D2
- Current confirmed position: Plan capacity limits count **active Reward Programs**, not individual mapped products; applied to PRD0/PRD3 wording in Phase 1 (with visible note inviting founder veto).
- Founder decision required: No (veto possible) · Options/Recommendation: n/a
- Decision owner: Founder · Required by phase: Phase 10 · Blocks: —
- Affected documents: PRD0 §18/PD-019; PRD3 §9–10; TRD17 §17.7/§17.23 · Affected domains: Subscription, Reward Programs
- Source references: consolidation audit §11.1; audit DOC-P1-005; Phase 1 report §4
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded (Phase 1 application 2026-07-16) · Approved by: Founder (TRD/consolidation-audit approval)
- Implementation consequences: entitlement counter · Document corrections required: none · Notes: supersedes DEC-SUB-012

**DEC-SUB-005 — Single branch at MVP; branch-ready architecture**
- Category: Subscription · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: MVP supports one operational branch per business (auto-created or onboarding-created); every Purchase Record and redemption references the branch; multi-branch operation deferred.
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Founder · Required by phase: Phases 2–5 · Blocks: —
- Affected documents: PRD0 PD-023; TRD23 §23.14; TRD22 · Affected domains: Identity, Subscription
- Source references: PD-023; TRD23 §23.14; A-011
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (PRD0 §24)
- Implementation consequences: branch record seeding · Document corrections required: none · Notes: multi-branch is DEC-FUT-005

**DEC-SUB-006 — Upgrade immediate; downgrade requires within-limits**
- Category: Subscription · Status: **CONFIRMED** · Priority: D2
- Current confirmed position: Upgrades apply immediately; downgrades only when business configuration fits the lower plan (owner resolves excess first).
- Founder decision required: No · Options/Recommendation: n/a (proration detail sits in DEC-SUB-008)
- Decision owner: Founder · Required by phase: Phase 10 · Blocks: —
- Affected documents: PRD3 §22; TRD17 §17.26–17.27 · Affected domains: Subscription
- Source references: PRD3 §22
- Dependencies: DEC-SUB-008 (proration) · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (PRD approval)
- Implementation consequences: downgrade validation · Document corrections required: none · Notes: —

**DEC-SUB-007 — Essential trust controls never paywalled**
- Category: Subscription · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: Customer verification, individual staff identities, secure roles, purchase history, Verified Unit integrity, redemption controls, dispute handling, basic audit, privacy/security are present in every plan; plans differ by capacity and enhanced capability only.
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Founder · Required by phase: Phase 10 · Blocks: —
- Affected documents: TRD17 §17.4; consolidation audit §11.3 · Affected domains: Subscription
- Source references: as above
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (TRD approval)
- Implementation consequences: entitlement floor · Document corrections required: none · Notes: —

**DEC-SUB-008 — Plan catalogue: BIF prices, billing intervals, grace values, proration**
- Category: Subscription · Status: **OPEN_FOUNDER** · Priority: D2
- Decision question: Approve launch BIF price points, offered billing intervals (monthly/quarterly/annual — quarterly has no PRD basis), grace-period length, and upgrade proration treatment.
- Context: TRD10 lists three intervals; TRD17 defines grace/proration mechanics without values.
- Options identified: interval subsets; grace 7/14/30 days; proration vs next-cycle change.
- Recommended direction: monthly (+annual optional) at launch; values with commercial plan · Recommendation basis: simplicity pillar.
- Current confirmed position: mechanics confirmed (TRD17); values open.
- Founder decision required: Yes · Decision owner: Founder · Required by phase: Phase 10 · Blocks: plan catalogue seed, payment flows
- Affected documents: TRD17; TRD10 §10.14.1 · Affected domains: Subscription
- Source references: DR-COMM-005; audit traceability §20 (quarterly)
- Dependencies: DEC-PROV-001 (payment provider capabilities); EXT-LEG-003 (billing rules)
- Risks if unresolved: Phase 10 blocked · Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: pricing seed data · Document corrections required: plan catalogue doc · Notes: founder agenda Batch D

**DEC-SUB-009 — Multi-business subscription model**
- Category: Subscription · Status: **OPEN_FOUNDER** · Priority: D2
- Decision question: One owner with several businesses — one subscription per business (PRD3 §28 recommendation) or consolidated owner-level subscription?
- Context: PRD3 §28 recommends per-business subscriptions (marked unapproved in Phase 1); PRD10 §11 confirms independent businesses per owner.
- Options identified: (a) per-business subscription; (b) owner-level consolidated billing.
- Recommended direction: (a) · Recommendation basis: PRD3 §28 rationale (reporting, future franchising).
- Current confirmed position: businesses isolated per owner (confirmed BR-097); billing model open.
- Founder decision required: Yes · Decision owner: Founder · Required by phase: Phase 10 · Blocks: billing model
- Affected documents: PRD3 §28; TRD17 · Affected domains: Subscription
- Source references: DR-COMM-006
- Dependencies: — · Risks if unresolved: billing schema ambiguity
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: subscription-business relation · Document corrections required: PRD3 §28 closure · Notes: founder agenda Batch D

**DEC-SUB-010 — MVP export formats**
- Category: Subscription/Reporting · Status: **OPEN_FOUNDER** · Priority: D2
- Decision question: PRD9 promises PDF/CSV/Excel exports; TRD22 approves "CSV where approved". What ships at MVP?
- Options identified: (a) CSV only at launch; PDF for receipts/invoices only; Excel deferred (audit recommendation); (b) PRD9 full set.
- Recommended direction: (a) · Recommendation basis: TRD22 §22.21; OTD-010 dependency.
- Current confirmed position: contradictory sources; OPEN.
- Founder decision required: Yes · Decision owner: Founder · Required by phase: Phase 11 · Blocks: reporting exports
- Affected documents: PRD9 §16; TRD22 §22.21 · Affected domains: Reporting
- Source references: audit DOC-P2-002; DR-COMM-007
- Dependencies: DEC-TECH-009 (PDF tooling) · Risks if unresolved: export scope creep
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: export module scope · Document corrections required: PRD9 §16 alignment · Notes: founder agenda Batch D

**DEC-SUB-011 — Bronze/Silver/Gold plan naming (historical)**
- Category: Subscription · Status: **SUPERSEDED** · Priority: —
- Decision question: Adopt Bronze/Silver/Gold tiers with 5/20/unlimited staff?
- Context: Rules Studio example tiers. Superseded by: **DEC-SUB-001** (names open; Starter/Growth/Professional working labels). Consolidation audit §11.2: "shall not be treated as approved"; marked illustrative in Phase 1.
- Options/Recommendation: historical · Current confirmed position: see DEC-SUB-001
- Founder decision required: No · Decision owner: — · Required by phase: — · Blocks: —
- Affected documents: Rules Studio · Affected domains: Subscription
- Source references: consolidation audit §11.2; audit DOC-P2-001 · Dependencies: — · Risks if unresolved: —
- Final decision: superseded · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (consolidation-audit approval)
- Implementation consequences: none · Document corrections required: none · Notes: —

**DEC-SUB-012 — Plan capacity by product count (historical)**
- Category: Subscription · Status: **SUPERSEDED** · Priority: —
- Decision question: Count plan capacity in "active loyalty products"?
- Context: Early PRD/Product Definition basis. Superseded by: **DEC-SUB-004** (active Reward Program limit).
- Options/Recommendation: historical · Current confirmed position: see DEC-SUB-004
- Founder decision required: No · Decision owner: — · Required by phase: — · Blocks: —
- Affected documents: PRD0/PRD3 (corrected Phase 1); archived Product Definition · Affected domains: Subscription
- Source references: consolidation audit §11.1; audit DOC-P1-005 · Dependencies: — · Risks if unresolved: —
- Final decision: superseded · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder
- Implementation consequences: none · Document corrections required: none · Notes: —

**DEC-SUB-013 — Complimentary/free plans policy**
- Category: Subscription · Status: **OPEN_FOUNDER** · Priority: D4
- Decision question: Will the platform offer complimentary plans (pilot businesses, partners, promotions), and under what governance?
- Context: Raised during Phase 3 governance preparation; no documented position in the suite. Pilot businesses may need free access (pilot scope decision).
- Options identified: (a) pilot-only complimentary via feature flags; (b) permanent free tier; (c) none.
- Recommended direction: none — commercial choice; (a) likely needed for pilot · Recommendation basis: TRD22 §22.25 pilot scope.
- Current confirmed position: none.
- Founder decision required: Yes · Decision owner: Founder · Required by phase: Phase 15 (pilot) at latest · Blocks: pilot billing setup
- Affected documents: TRD17 · Affected domains: Subscription
- Source references: Phase 3 task list · Dependencies: DEC-PILOT-001 · Risks if unresolved: ad-hoc pilot billing
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: plan catalogue entry · Document corrections required: TRD17 note · Notes: founder agenda Batch E

---

### TECHNOLOGY, DATA AND OPERATIONS (DEC-TECH / DEC-DATA / DEC-OPS)

**DEC-TECH-001 — Firebase-first infrastructure**
- Category: Technology · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: Firebase ecosystem (Auth, Firestore, Functions, Storage, Hosting, App Check, FCM, Analytics, Performance Monitoring + supporting GCP) is the implementation infrastructure; Firebase implements — never defines — the business architecture.
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Founder · Required by phase: Phase 1 · Blocks: —
- Affected documents: PD-020; TRD8; consolidation audit §19 · Affected domains: all technical
- Source references: PD-020; TRD23 §23.20 (verification duties noted)
- Dependencies: EXT-TECH-002 (regional availability verification) · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (PRD0 §24)
- Implementation consequences: platform foundation · Document corrections required: none · Notes: —

**DEC-TECH-002 — React + TypeScript, mobile-first PWA**
- Category: Technology · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: Frontend is React + TypeScript delivered as a mobile-first PWA (three surfaces: customer, business, administration).
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Engineering Lead · Required by phase: Phase 0 · Blocks: —
- Affected documents: PD-021; TRD16 §16.3; TRD23 OTD-001 ("React and TypeScript are approved") · Affected domains: frontend
- Source references: as above
- Dependencies: DEC-TECH-003 (tooling) · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (PRD/TRD approval)
- Implementation consequences: — · Document corrections required: none · Notes: Tailwind/Crashlytics claims in archived Product Definition are historical

**DEC-TECH-003 — Frontend tooling set**
- Category: Technology · Status: **CONFIRMED** · Priority: **D1**
- Decision question: Select build tool, router, server-state library, form library, component foundation, PWA tooling and test libraries.
- Options identified: per OTD-001 (proposed by engineering, see Engineering Decision Sprint 1 evaluation).
- Recommended direction: Vite / React Router / TanStack Query / React Hook Form + Zod / shadcn/ui + Tailwind CSS / Vitest + React Testing Library + Playwright / ESLint + Prettier / pnpm · Recommendation basis: [DEC-TECH-003 Engineering Stack Evaluation & Recommendation](dec-tech-003-engineering-stack-recommendation.md) (Engineering Decision Sprint 1, 2026-07-17)
- Current confirmed position: React+TS approved (DEC-TECH-002); full Version 1 frontend stack now confirmed (see Final decision).
- Founder decision required: No (informed) · Decision owner: Engineering Lead · Required by phase: Phase 0 · Blocks: — (resolved)
- Affected documents: TRD16; Engineering Standards (Linting and Formatting Conventions §5); Version 1 Engineering Blueprint §1.3; ENG-P0-001 draft · Affected domains: frontend
- Source references: OTD-001; DR-TECH-001; audit DOC-P2-007; [DEC-TECH-003 Engineering Stack Evaluation & Recommendation](dec-tech-003-engineering-stack-recommendation.md); [Engineering Decision Sprint 1 Report](../../05-implementation/reports/eng-decision-sprint-1-dec-tech-003-report-2026-07-17.md)
- Dependencies: — · Risks if unresolved: — (resolved)
- Final decision: *"Version 1 frontend stack: Vite (build tool), React Router (routing), TanStack Query (server state), React Hook Form + Zod (forms/validation), shadcn/ui + Tailwind CSS (component foundation/styling), Lucide (icons), Recharts (charts), TanStack Table (tables), vite-plugin-pwa/Workbox (PWA), Vitest + React Testing Library + Playwright (testing), ESLint + Prettier (lint/format), pnpm (package manager). Full evaluation and rationale: [DEC-TECH-003 Engineering Stack Evaluation & Recommendation](dec-tech-003-engineering-stack-recommendation.md)."* · Decision date: 2026-07-17 · Approved by: Engineering Lead (confirmed under Founder-directed Engineering Decision Sprint 2, 2026-07-17)
- Implementation consequences: unblocks ENG-P0-001 (jointly with DEC-TECH-004, also confirmed this sprint); Linting and Formatting Conventions §5 tool names move from recommended to confirmed; Version 1 Engineering Blueprint §1.3 updated · Document corrections required: Engineering Standards §5 (applied, Sprint 2); Version 1 Engineering Blueprint §1.3 (applied, Sprint 2); ENG-P0-001 draft §4/§11 (applied, Sprint 2) · Notes: Closed under Engineering Decision Sprint 2 (2026-07-17), converting the Sprint 1 prepared recommendation into a confirmed decision per the Decision Update Procedure.

**DEC-TECH-004 — Repository structure (monorepo recommended)**
- Category: Technology · Status: **CONFIRMED** · Priority: **D1**
- Decision question: Monorepo (frontend + Functions, shared types) or separate repositories?
- Options identified: (a) monorepo (TRD-recommended); (b) separate repos.
- Recommended direction: (a) · Recommendation basis: OTD-002 ("recommends a shared repository or monorepo for strong type and contract reuse").
- Current confirmed position: Monorepo confirmed (see Final decision).
- Founder decision required: No · Decision owner: Engineering Lead · Required by phase: Phase 0 · Blocks: — (resolved)
- Affected documents: TRD22 Phase 0; Engineering Standards; Version 1 Engineering Blueprint §2 · Affected domains: all technical
- Source references: OTD-002; DR-TECH-002; [Engineering Decision Closure Recommendations](engineering-decision-closure-recommendations.md) §3
- Dependencies: — · Risks if unresolved: — (resolved)
- Final decision: *"Monorepo. Frontend and Cloud Functions code, including shared types, live in a single repository, per OTD-002 and the project structure already specified in TRD8 §8.4. No operational reason for separate repositories has been identified."* · Decision date: 2026-07-17 · Approved by: Engineering Lead (confirmed under Founder-directed Engineering Decision Sprint 2, 2026-07-17)
- Implementation consequences: repository layout for ENG-P0-001/ENG-P0-002 follows this structure directly · Document corrections required: Engineering Standards (already reflects monorepo, no change needed); Version 1 Engineering Blueprint §2 already states this as CONFIRMED · Notes: Closed under Engineering Decision Sprint 2 (2026-07-17), applying the closure prepared in Engineering Transition Phase 0B's Engineering Decision Closure Recommendations §3.

**DEC-TECH-005 — Firebase region**
- Category: Technology · Status: **CONFIRMED** · Priority: **D1**
- Decision question: Select the Firebase/GCP region balancing Burundi latency, service availability, cost and the cross-border legal position.
- Options identified: candidate regions evaluated in the [Cloud Region Evaluation Evidence Pack](DEC-TECH-005-Cloud-Region-Evaluation-Evidence-Pack.md) — Option A `europe-west1` (Engineering Recommendation), Option B `eur3` (Conservative), Option C `africa-south1` (Future-Scale).
- Recommended direction: Option A (`europe-west1`) · Recommendation basis: complete confirmed service match to the platform's Version 1 architecture, lowest operational complexity, most mature operating history among evaluated candidates.
- Current confirmed position: region selected (see Final decision).
- Founder decision required: Countersign · Decision owner: Engineering Lead + legal adviser · Required by phase: Phase 1 · Blocks: — (resolved)
- Affected documents: TRD8; TRD20 · Affected domains: all technical
- Source references: OTD-003; DR-TECH-003
- Dependencies: **EXT-LEG-006** (cross-border hosting), EXT-TECH-002 · Risks if unresolved: — (resolved)
- Final decision: *"The Version 1 Firebase/Google Cloud region is `europe-west1` (Belgium), per Option A (Engineering Recommendation) of the Cloud Region Evaluation Evidence Pack — selected for its complete confirmed service match to the platform's Version 1 architecture, lowest operational complexity, and most mature operating history among evaluated candidates, consistent with the evidence pack's own findings and not overriding them."* · Decision date: 2026-07-19 · Approved by: Founder (Kenogo), per the [Version 1.0 Engineering Authorization Record](../version-1-engineering-authorization-record.md) §8
- Implementation consequences: project provisioning; region fixed in code at `functions/src/config/region.ts` (`PLATFORM_REGION = "europe-west1"`) and `apps/web/src/infrastructure/firebase/functions.ts` (`FUNCTIONS_REGION`), committed `ba43da1`; `dev`/`staging` Firebase projects provisioned accordingly (`.firebaserc`) · Document corrections required: none outstanding for this record — deployment docs already reflect `europe-west1` · Notes: **Register-sync correction, MTAIP-001 11thONUS Alignment Closure, 2026-08-28.** This decision was substantively confirmed by the Founder on 2026-07-19 (Phase 0E, Engineering Authorization & Governance Closure) and recorded permanently in the Version 1.0 Engineering Authorization Record and the Version 1.0 Governance Completion Milestone (both committed, `main`) — but the corresponding edit to *this* register entry was never committed (confirmed via `git log -p` on this file: no commit ever set this record to `CONFIRMED`), leaving the register out of sync with the Authorization Record and with the implementation for over a month, across multiple subsequent tasks that independently discovered and disclosed the discrepancy without resolving it (e.g. the `DEC-PROV-005` decision-recording report, 2026-07-26, and Documentation Changes Log Entry ~017–027 area both flag it as a "governance-integrity risk" requiring "a dedicated, separately-authorized audit task"). This edit performs exactly that correction, applying the Founder's own already-approved wording verbatim — it does not reopen, reinterpret, or newly decide the region question. **`DEC-LEGAL-006` carries the identical register-sync gap** (also confirmed per the same Authorization Record §8, also never written back to its own register entry below) but is explicitly out of this task's authorization and is left untouched; it requires its own, separately-authorized correction.

**DEC-TECH-006 — Event delivery mechanism (outbox)**
- Category: Technology · Status: **CONFIRMED** · Priority: **D1**
- Decision question: Validate the recommended Firestore-transaction + event-outbox + background-processor pattern (future Pub/Sub migration path), incl. outbox collection design.
- Options identified: (a) recommended outbox pattern; (b) direct Pub/Sub from start.
- Recommended direction: (a) · Recommendation basis: OTD-006; TRD11 §11.17.
- Current confirmed position: event-driven processing mandatory (CP-009/TAP-006 confirmed); pattern now confirmed (see Final decision) — exact outbox collection schema remains Pass 2 implementation detail, tracked against ENG-P1-002.
- Founder decision required: No · Decision owner: Engineering Lead · Required by phase: Phase 1 · Blocks: — (pattern resolved; ENG-P1-002 remains sequentially gated on ENG-P1-001 completion, not on this decision)
- Affected documents: TRD11; Engineering Standards Pass 2 (schema detail, pending) · Affected domains: all server
- Source references: OTD-006; DR-TECH-006; [Engineering Decision Closure Recommendations](engineering-decision-closure-recommendations.md) §3
- Dependencies: — · Risks if unresolved: — (pattern resolved)
- Final decision: *"Adopt the Firestore-transaction + event-outbox + background-processor pattern per TRD11 §11.17, with a future Pub/Sub migration path per OTD-006. The exact outbox collection schema, retry/backoff parameters, and dead-letter handling are implementation detail, specified in Pass 2 Engineering Standards during Phase 1 (ENG-P1-002), not part of this decision."* · Decision date: 2026-07-17 · Approved by: Engineering Lead (confirmed under Founder-directed Engineering Decision Sprint 2, 2026-07-17)
- Implementation consequences: removes one of Phase 1's two open architectural questions; Pass 2 Engineering Standards can proceed against a settled pattern once ENG-P1-001 completes · Document corrections required: Engineering Standards README §Pass 2 (reword from "CONFIRMED-recommended" to "CONFIRMED"); Engineering Implementation Programme (ENG-P1-002 Decision Dependencies note) · Notes: Closed at the pattern level only, per the scope disclosed in the Engineering Decision Closure Recommendations §3; schema detail intentionally deferred, not silently invented. Closed under Engineering Decision Sprint 2 (2026-07-17).

**DEC-TECH-007 — Idempotency storage approach**
- Category: Technology · Status: **CONFIRMED** · Priority: **D1**
- Decision question: Dedicated idempotency collection, deterministic document IDs, or combined per-operation approach?
- Options identified: per OTD-007 (three options; combined permitted).
- Recommended direction: combined approach permitted · Recommendation basis: OTD-007.
- Current confirmed position: idempotency mandatory for all sensitive writes (confirmed, TRD10 §10.30); combined per-operation approach now confirmed at the policy level (see Final decision) — per-operation schema choice remains Pass 2 implementation detail, tracked against ENG-P1-002.
- Founder decision required: No · Decision owner: Engineering Lead · Required by phase: Phase 1 · Blocks: — (policy resolved; ENG-P1-002 remains sequentially gated on ENG-P1-001 completion, not on this decision)
- Affected documents: TRD10/TRD11; Engineering Standards Pass 2 (per-operation schema, pending) · Affected domains: all server
- Source references: OTD-007; DR-TECH-007; [Engineering Decision Closure Recommendations](engineering-decision-closure-recommendations.md) §3 · Dependencies: DEC-TECH-006 (also confirmed this sprint)
- Risks if unresolved: — (policy resolved) · Final decision: *"Combined, per-operation approach — dedicated idempotency collection or deterministic document IDs, chosen per operation as TRD10 §10.30 and OTD-007 already permit. Each operation's specific choice is documented where that operation's Engineering Standard/work package is authored (Pass 2), not decided globally here."* · Decision date: 2026-07-17 · Approved by: Engineering Lead (confirmed under Founder-directed Engineering Decision Sprint 2, 2026-07-17)
- Implementation consequences: removes the second of Phase 1's two open architectural questions (paired with DEC-TECH-006) · Document corrections required: Engineering Standards README §Pass 2 (reword from "CONFIRMED-recommended" to "CONFIRMED"); Engineering Implementation Programme (ENG-P1-002 Decision Dependencies note) · Notes: Closed at the policy level only; per-operation schema intentionally deferred, not silently invented. Closed under Engineering Decision Sprint 2 (2026-07-17).

**DEC-TECH-008 — Search implementation**
- Category: Technology · Status: **OPEN_ENGINEERING** · Priority: D2
- Decision question: Confirm Firestore-backed taxonomy search + internal filtering for MVP (dedicated search provider deferred), with the abstraction interface still created.
- Options identified: (a) Firestore-backed (recommended); (b) dedicated provider now.
- Recommended direction: (a) · Recommendation basis: OTD-005; TRD23 §23.15.
- Current confirmed position: search-domain abstraction confirmed; provider deferred unless proven necessary.
- Founder decision required: No · Decision owner: Engineering Lead · Required by phase: Phase 3 · Blocks: onboarding search
- Affected documents: TRD14 · Affected domains: Search
- Source references: OTD-005; DR-TECH-005 · Dependencies: —
- Risks if unresolved: onboarding UX blocked · Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: search module · Document corrections required: none · Notes: —

**DEC-TECH-009 — PDF and export generation tooling**
- Category: Technology · Status: **OPEN_ENGINEERING** · Priority: D2
- Decision question: Server-side method for receipts, invoices and report PDFs.
- Options identified: to be proposed (headless render, PDF lib, service).
- Recommended direction: none · Recommendation basis: OTD-010.
- Current confirmed position: receipts/invoices required (TRD17/TRD22); tooling open.
- Founder decision required: No · Decision owner: Engineering Lead · Required by phase: Phase 10/11 · Blocks: billing documents
- Affected documents: TRD17; TRD15 · Affected domains: Subscription, Reporting
- Source references: OTD-010; DR-TECH-008 · Dependencies: DEC-SUB-010
- Risks if unresolved: billing docs blocked · Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: doc-generation service · Document corrections required: Engineering Standards · Notes: —

**DEC-TECH-010 — Backup method and restore procedure**
- Category: Technology · Status: **OPEN_ENGINEERING** · Priority: D3
- Decision question: Confirm Firestore backup service, schedule, retention, restore procedure and Storage backup approach.
- Options identified: per OTD-011.
- Recommended direction: none · Recommendation basis: OTD-011; ORP-004 (backups must be restorable).
- Current confirmed position: backup + tested restore is a launch gate (confirmed); method open.
- Founder decision required: No · Decision owner: Engineering Lead · Required by phase: Phase 14 · Blocks: pilot-readiness gate
- Affected documents: TRD20 · Affected domains: Operations
- Source references: OTD-011; DR-TECH-009 · Dependencies: DEC-PROV-006 · Risks if unresolved: pilot gate fails
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: backup jobs · Document corrections required: runbooks · Notes: —

**DEC-TECH-011 — Administration shell deployment isolation**
- Category: Technology · Status: **OPEN_ENGINEERING** · Priority: D2
- Decision question: Separate deployment for the admin application (preferred) or protected shell within the main app?
- Options identified: (a) separate deployment (TRD-preferred); (b) protected shell.
- Recommended direction: (a) · Recommendation basis: OTD-012.
- Current confirmed position: preference recorded, not decided.
- Founder decision required: No · Decision owner: Engineering Lead · Required by phase: Phase 12 · Blocks: admin build
- Affected documents: TRD16 §16.4.3; TRD18 · Affected domains: Administration, frontend
- Source references: OTD-012; DR-TECH-010 · Dependencies: — · Risks if unresolved: admin isolation weaker
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: hosting targets · Document corrections required: deployment docs · Notes: —

**DEC-DATA-001 — Server-only authoritative writes**
- Category: Data · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: Clients never write Purchase Records, verification outcomes, Verified Units, Loyalty Cycles, rewards, redemptions, subscriptions, roles, rules, taxonomy or Trust Events; trusted server processes only; deny-by-default rules.
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Engineering Lead · Required by phase: Phase 1 · Blocks: —
- Affected documents: TRD10 DAP-003/DA-006; TRD12 §12.18; consolidation audit §19.2 · Affected domains: all
- Source references: as above; IM-008
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (TRD approval)
- Implementation consequences: rules + Functions design · Document corrections required: none · Notes: —

**DEC-DATA-002 — Money as integer minor units; UTC server timestamps**
- Category: Data · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: Monetary values use integer minor units (never floating point); authoritative timestamps are server-generated UTC; business/customer timezones stored separately; ISO country/currency/language codes.
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Engineering Lead · Required by phase: Phase 1 · Blocks: —
- Affected documents: TRD10 §10.5/§10.27; DA-010/015; FR-DATA-013 · Affected domains: all data
- Source references: as above
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (TRD approval)
- Implementation consequences: schema standards · Document corrections required: none · Notes: —

**DEC-DATA-003 — Purchase Record monetary fields**
- Category: Data · Status: **CONFIRMED** · Priority: **D0**
- Decision question: Do Purchase Records carry optional Unit Value + Currency (as PRD5 §5 mandates) or no monetary fields (as TRD10 schema implements)?
- Context: PRD-vs-TRD data-contract conflict (audit DOC-P1-010); money on records raises DA-015 integer rule and privacy/minimization questions; value is never used for loyalty math either way.
- Options identified: (a) optional integer-minor-unit value+currency, non-authoritative, reporting-only; (b) no monetary fields in MVP (PRD5 §5 corrected); (c) mandatory value.
- Recommended direction: none — no single recommendation is made; options (a) and (b) are both viable, and engineering input on schema/privacy cost is advised · Recommendation basis: audit DOC-P1-010 analysis.
- Current confirmed position: contradictory sources; OPEN.
- Founder decision required: Yes · Decision owner: Founder + Engineering Lead · Required by phase: pre-freeze / Phase 5 · Blocks: freeze; Purchase Record schema
- Affected documents: PRD5 §5; TRD10 §10.10.1 · Affected domains: Purchase, Data
- Source references: audit DOC-P1-010; DR-TECH-011
- Dependencies: — · Risks if unresolved: schema conflict at Phase 5
- Final decision: **Approved, option (a) with an explicit boundary condition.** Purchase Records include optional monetary fields (Unit Value + Currency). These fields are reporting metadata only: money shall never influence Verified Units, Reward Program progression, Loyalty Cycles or reward eligibility, unless a future founder decision explicitly introduces amount-based Reward Programs. This rule is to be reflected consistently across affected documentation.
- Decision date: 2026-07-16 · Approved by: Founder (Kenogo)
- Implementation consequences: record schema gains optional non-authoritative monetary fields; Loyalty Engine logic must not read them · Document corrections required: PRD5 §5 note added; TRD10 §10.10.1 schema gains optional fields + explicit non-influence rule · Notes: founder agenda Batch A (freeze blocker) — ✅ answered 2026-07-16 (Phase 3B)

**DEC-DATA-004 — reward_redeemed: durable state or transition**
- Category: Data · Status: **OPEN_ENGINEERING** · Priority: D2
- Decision question: Is Loyalty Cycle `reward_redeemed` a durable stored state or an immediate transition to `closed`?
- Context: Explicitly delegated to Engineering Standards by consolidation audit §7.7.
- Options identified: (a) durable state; (b) transition-only.
- Recommended direction: none · Recommendation basis: —
- Current confirmed position: canonical four-state list confirmed; durability open.
- Founder decision required: No · Decision owner: Engineering Lead · Required by phase: Phase 7 · Blocks: cycle transition table
- Affected documents: TRD10 §10.11.2; Engineering Standards · Affected domains: Loyalty
- Source references: consolidation audit §7.7; DR-TECH-013 · Dependencies: DEC-LOY-008
- Risks if unresolved: inconsistent cycle queries · Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: state machine · Document corrections required: Engineering Standards table · Notes: —

**DEC-DATA-005 — Knowledge/rule state vocabulary unification**
- Category: Data · Status: **RESOLVED — SEPARATE SEMANTIC LIFECYCLES WITH SHARED CANONICAL KNOWLEDGE VOCABULARY** (scope: Commerce Knowledge only — `knowledgeNodes`/`knowledgeTags`/`knowledgeTranslations`; the C.16 Rule Version variant this decision also originally named remains **OPEN_ENGINEERING**, unresolved by this disposition, and is not addressed below) · Priority: D2
- Decision question: Unify the three knowledge-object vocabularies (canonical draft/in_review/approved/published/retired/archived vs TRD10 pending_review/active vs Knowledge Studio pipeline) and rule-version variants (suspended/retired/archived differences).
- Options identified: (A) one fully unified lifecycle vocabulary across `KnowledgeNode`/`KnowledgeTranslation`/`KnowledgeTag`; (B) three fully separate vocabularies, one per entity; (C) a shared canonical-content lifecycle for `KnowledgeNode` and `KnowledgeTag` (which model the same underlying concept — is this canonical entry currently the live truth) plus a genuinely separate, narrower translation-readiness lifecycle for `KnowledgeTranslation` (a materially different concept — is this specific language's label trustworthy). Full per-entity semantic analysis and per-option evaluation (semantic clarity, schema/implementation complexity, invalid-state risk, Knowledge Studio implications, migration implications) recorded in `ENG-P3-001-DESIGN-001` §9.3.
- Recommended direction: **Option C, adopted** — re-derived independently from TRD10 §10.7.1–10.7.3 and the Knowledge Studio pipeline (`docs/03-standards/knowledge-studio.md`, "The Knowledge Pipeline": Suggested→Reviewed→Approved→Translated→Tagged→Indexed→Published→Available Platform-wide), not merely adopted from the terminology audit's C.15 recommendation without independent re-verification. · Recommendation basis: terminology audit C.15 (`11thONUS_TERMINOLOGY_AND_STATE_MODEL_AUDIT_2026-07-16.md`), re-derived and confirmed against the actual governing sources during `ENG-P3-001-DESIGN-001` disposition.
- Current confirmed position (RESOLVED, this entry): **Canonical Commerce Knowledge content lifecycle** (`KnowledgeNode.status`, `KnowledgeTag.status` — one shared enum): `"draft" | "in_review" | "active" | "retired" | "archived"` (five values). This **collapses the audit's six-value candidate's `approved`/`published` distinction into a single `active` state** for these two entities: independent re-verification against the Knowledge Studio pipeline found that, for the canonical node/tag itself, nothing in the governing sources operationally distinguishes "governance has confirmed this concept is correct" (`approved`) from "this concept is now the live, selectable truth" (`published`/`active`) as two separately-observable facts about the *node* — the pipeline's own later steps (Translated/Tagged/Indexed/Published) are process activities producing separate, already-modeled facts (a `KnowledgeTranslation` record existing and being `published`; `searchTerms` being populated), not a second independent state of the canonical node. Retaining both `approved` and `published` as node-level enum values would create an unobservable, redundant state with no consumer needing to distinguish them. `pending_review` (TRD10's current wording) is renamed `in_review` to match the audit's own recommended terminology. **`retired` and `archived` are both retained as genuinely distinct states**, not merged: TRD10 §10.24 ("Soft Deletion and Archival") requires the platform to distinguish `retired` from `archived` as a general six-way vocabulary (active/inactive/suspended/retired/closed/archived) applied consistently platform-wide, and §10.25 classifies "knowledge versions" under Permanent/Long-Term retention — `retired` (superseded by a newer node, forward-resolving via `replacementNodeId`, still surfaced to Knowledge Studio's own management views) and `archived` (fully at rest, out of active management/search surfaces, retained only for historical/audit resolution, never deleted per DAP-010) are a meaningful operational distinction under this platform-wide convention, not a manufactured one. **Translation-readiness lifecycle** (`KnowledgeTranslation.status` — separate, narrower enum, unchanged from TRD10 §10.7.2 as already declared): `"draft" | "reviewed" | "published"` (three values) — confirmed as a materially different concept from the canonical lifecycle (per-language QA readiness for one `(nodeId, languageCode)` pair, not the canonical concept's own validity), and confirmed compatible with a node being `active` while, e.g., its English translation is `published` and its French translation is still `draft`/`reviewed` — the canonical node's own `active` status is never invalidated by an incomplete translation; onboarding-selection eligibility for a given language is a combined read (node `active` AND that language's translation `published`, falling back to English per `ENG-P3-001-DESIGN-001` §11 when the requested language's translation is not yet `published`). Full transition matrices, new-reference eligibility rules, and existing-reference resolution rules for both vocabularies are recorded in `ENG-P3-001-DESIGN-001` §9.3.
- Founder decision required: No · Decision owner: Engineering Lead · Required by phase: Phase 3 (Knowledge Studio MVP) · Blocks: knowledge schema (Commerce Knowledge portion now unblocked by this resolution; the C.16 Rule Version portion remains open and continues to block its own, separate schema)
- Affected documents: TRD10 §10.7 (`knowledgeNodes.status`/`knowledgeTags.status` to be corrected from `pending_review`/no-status-declared to the resolved `in_review`-renamed five-value enum at `ENG-P3-001A` implementation time — not applied by this decision record itself); Knowledge Studio doc (pipeline steps after `Approved` remain descriptive process activities, not schema) · Affected domains: Commerce Knowledge (resolved by this entry); Rules/rule-version vocabulary (C.16, **not** resolved by this entry — remains `OPEN_ENGINEERING`, tracked separately)
- Source references: DR-ARCH-007; terminology audit C.15/C.16; `ENG-P3-001-DESIGN-001` §9.3 (full decision brief, per-entity semantic analysis, three-option comparison) · Dependencies: none blocking this disposition; `ENG-P3-001A` (Commerce Knowledge domain contracts) is the first implementation package authorized to consume it
- Risks if unresolved: mixed enums (this risk is now closed for Commerce Knowledge; remains open for C.16 Rule Version) · Final decision: **Adopt Option C as stated above** — shared five-value canonical lifecycle (`draft | in_review | active | retired | archived`) for `KnowledgeNode`/`KnowledgeTag`; unchanged three-value translation-readiness lifecycle (`draft | reviewed | published`) for `KnowledgeTranslation`; `KnowledgeTag.translations`' inline-map-vs-separate-collection storage-shape question is **not** part of this decision — tracked as its own `ENGINEERING SCHEMA CLARIFICATION` (see `ENG-P3-001-DESIGN-001` §9.3), since it concerns localization storage shape, not status vocabulary, and does not require Founder or further Engineering-Lead disposition beyond what `ENG-P3-001-DESIGN-001` already records. · Decision date: 2026-08-20 · Approved by: Engineering Lead (per this decision's own `Decision owner` field — not a Founder-owned decision)
- Implementation consequences: `ENG-P3-001A` (Commerce Knowledge domain contracts/schema) may now be written against these two enums; TRD10 §10.7.1/§10.7.3's `status` field declarations require the corresponding additive correction (`pending_review`→`in_review`, `KnowledgeTag.status` widened from its currently-declared three-value `draft|active|retired` to the resolved shared five-value enum) at `ENG-P3-001A` implementation time — a schema correction, not a breaking change, since no Commerce Knowledge data exists in production yet · Document corrections required: TRD10 §10.7.1/§10.7.3 (status enum correction, at implementation time); Knowledge Studio doc unaffected (its pipeline prose already reads as process activities, not schema, consistent with this resolution) · Notes: This resolution is scoped to Commerce Knowledge (`knowledgeNodes`/`knowledgeTags`/`knowledgeTranslations`) only. `C.16 Rule Version` (rule-version state vocabulary) was named in this decision's original scope but is **not** resolved here and remains `OPEN_ENGINEERING` — a future, separately-authorized engineering decision should address it on its own terms rather than assuming this entry's Commerce-Knowledge-specific resolution transfers to rule versions without its own review.

**DEC-DATA-006 — Support-case and bulk-job state models**
- Category: Data · Status: **OPEN_ENGINEERING** · Priority: D2
- Decision question: Define state models for support cases and bulk jobs (none published).
- Options identified: audit suggestions — support: open/in_progress/waiting_customer/resolved/closed; bulk job: draft/approved/running/paused/completed/failed/cancelled.
- Recommended direction: audit suggestions as starting point · Recommendation basis: terminology audit C.17/C.19.
- Current confirmed position: none.
- Founder decision required: No · Decision owner: Engineering Lead · Required by phase: Phase 12 · Blocks: admin build
- Affected documents: TRD18; Engineering Standards · Affected domains: Administration
- Source references: DR-TECH-014 · Dependencies: — · Risks if unresolved: ad-hoc states
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: admin schemas · Document corrections required: Engineering Standards tables · Notes: —

**DEC-DATA-007 — Loyalty number and QR reference generation**
- Category: Data · Status: **CONFIRMED** · Priority: **D1**
- Decision question: Define the loyalty-number format/generation algorithm (opaque, non-sequential, non-revealing) and the QR opaque/signed reference scheme.
- Context: PRD2 §8 delegates the algorithm to the TRD; no TRD section specifies it (audit traceability gap §1); only constraints exist (no registration date/country/sequence disclosure; QR contains no personal data).
- Options identified: random alphanumeric with checksum (baseline `ABC-234` adopted; `ABC-234-X` checksum-enhanced variant evaluated but deferred, not adopted now); signed QR token (evaluated, not adopted — see Final decision). Full evaluation, dependency analysis, and engineering recommendation, preserved unmodified by this recording: `RES-005` Dependency & Scope Analysis and `RES-006` Decision Package (both pending merge as of this recording — see front-matter note above for expected paths); [`loyalty-code-decision-brief.md`](loyalty-code-decision-brief.md).
- Recommended direction: adopt `loyalty-code-decision-brief.md`'s core proposal as drafted, plain opaque QR reference, character set excluding `I`/`O` only · Recommendation basis: `RES-006` Decision Package §8 — engineering recommendation, unchanged by this recording.
- Current confirmed position: **Approved.** Loyalty-code format, QR payload scheme, uniqueness/collision handling, and idempotency behavior all confirmed per the engineering decision recorded below.
- Founder decision required: No (confirmed unnecessary — `RES-006` found no constitutional or commercial issue) · Decision owner: Engineering Lead · Required by phase: Phase 2 · Blocks: — (resolved; per the Engineering Implementation Programme's own Decision Dependencies row, `DEC-DATA-007` gates `ENG-P2-001`, not `ENG-P2-004` — this recording unblocks `ENG-P2-001`'s `DEC-DATA-007` dependency specifically; `ENG-P2-001` also depends on `DEC-SEC-001`/`DEC-PROV-004`, both separately `CONFIRMED`; `ENG-P2-004` depends on `DEC-ID-003`, which remains `OPEN_FOUNDER` in this document as reviewed and is unaffected by this recording)
- Affected documents: PRD2 §8; TRD12 §12.42–12.43; Engineering Standards · Affected domains: Identity, Security
- Source references: DR-TECH-012; `RES-005` Dependency & Scope Analysis; `RES-006` Decision Package (both pending merge as of this recording — see front-matter note above for expected paths) · Dependencies: — · Risks if unresolved: — (resolved)
- Final decision: *"Identifier Generation Principles: the loyalty number is generated server-side only; randomly allocated within the chosen codespace (alphabet excluding `I`/`O`; confirmed baseline format `ABC-234`, no checksum — the checksum-enhanced `ABC-234-X` variant is explicitly deferred, not adopted by this decision, and requires its own future algorithm-selection decision if pursued), never sequential, timestamp-derived, or otherwise order-revealing; permanent for the life of the customer account, never regenerated, rotated, or reissued, including during authentication recovery; assigned only after canonical identity resolution; case-insensitive, normalized to one canonical stored form with display formatting applied only at render time; retired, never reassigned, if an account closes; every generation event audit-logged. QR Generation Principles: the QR encodes only a plain opaque reference to the loyalty code — not a signed token, and never the code's underlying data or any personal information; supports secure lookup with rate-limiting against enumeration; QR rotation/time-limiting remains explicitly out of scope, per TRD12 §12.42's own deferral. Uniqueness Guarantees: transactional uniqueness checking at assignment time, within the same transaction that assigns the code, preventing races between simultaneous registrations. Collision Handling: a collision triggers an automatic, customer-invisible retry with a new random candidate, bounded by a small maximum-retry count with fallback alerting if exceeded; an exceeded-retry event signals the codespace needs future expansion, not a design defect. Idempotency Behaviour: at most one immutable loyalty-number assignment per platform user; repeat calls return the existing result rather than creating a new assignment or rejecting the retry. Operational Prerequisites: checksum algorithm selection (if the `-X` variant is adopted) and generation-service ownership/invocation point remain implementation-design questions for the future generator service, not resolved by this decision."* · Decision date: 2026-07-30 · Approved by: Engineering Lead (confirmed under the Founder-directed Capability 2 Resolution Sprint, `RES-006A`, 2026-07-30)
- Implementation consequences: unblocks `ENG-P2-001`'s `DEC-DATA-007` dependency (see `Blocks` field above — `ENG-P2-004` remains blocked on the separate, unaffected `DEC-ID-003`); a future generator-service implementation task must implement the principles above exactly as recorded. The confirmed baseline format is `ABC-234` (no checksum) — the `ABC-234-X` checksum-enhanced variant is an explicitly deferred, not-yet-approved future enhancement, not an open fork within this decision; if a future task adopts it, checksum-algorithm selection is required at that time, not before. Generation-service invocation point remains a separate, open implementation-design question, not resolved here · Document corrections required: Engineering Standards spec (per the Register's own field) — not performed by this recording task, flagged as follow-on work; the Register's own `Options identified` field is now current, closing the staleness `RES-005`/`RES-006` disclosed · Notes: downstream tracking artefacts (Engineering Implementation Programme, Master Workflow, Requirements Traceability Matrix, `CDR-001`) still describe `DEC-DATA-007` as open, and still list `DEC-ID-003` (not `DEC-DATA-007`) as `ENG-P2-004`'s dependency, which is correct and unaffected by this recording — syncing the `DEC-DATA-007`-specific rows is outside this task's narrow "record the engineering decision only" scope. Verified against the Resolution Plan's Capability Authorisation Gate (§7 item 4): the gate's own text defines satisfaction as the Decision Register showing a Final Decision, with no tracker-sync precondition — the same basis on which `DEC-PROV-004`/`DEC-SEC-001`/`DEC-ID-003`'s equivalent recordings deferred this identical class of sync, disclosed here as follow-on, not performed. The evidence documents this entry cites (`RES-005`/`RES-006`) exist only on their own not-yet-merged PRs as of this recording — cited by their expected `main`-relative paths for when they land, not as a claim those files are present in this diff.

**DEC-OPS-001 — Environment strategy**
- Category: Operations · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: Local / development / staging / production with isolated Firebase projects, controlled CI/CD, deny-by-default deployment permissions, configuration classified (public/server/secrets/governed runtime).
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Engineering Lead · Required by phase: Phases 0–1 · Blocks: —
- Affected documents: TRD20 §20.4–20.8; TRD8 §8.3 · Affected domains: Operations
- Source references: as above
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (TRD approval)
- Implementation consequences: project provisioning · Document corrections required: none · Notes: —

---

### UX, LOCALIZATION (DEC-UX / DEC-L10N)

**DEC-UX-001 — No engineering vocabulary in customer copy**
- Category: UX · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: engine, ledger, lifecycle, state machine, event, token never appear in customer copy; stored states have defined UI labels ("Waiting for You" etc.); On Us Moment language is the customer reward experience.
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Founder · Required by phase: Phases 6–13 · Blocks: —
- Affected documents: TRD23 §23.9; TRD13 §13.11; canonical reference §4 · Affected domains: frontend, Notification
- Source references: as above
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (TRD approval)
- Implementation consequences: copy review gate (Phase 13) · Document corrections required: none · Notes: —

**DEC-UX-002 — Customer action verb: "Verify" vs "Approve"**
- Category: UX · Status: **OPEN_FOUNDER** · Priority: D2
- Decision question: Which verb does the customer UI use for confirming a purchase — Verify or Approve (both appear in the PRD)?
- Context: PRD2 §15 buttons say Approve; PRD5 §14 buttons say Verify; engineering term is "verify" (confirmed). One customer-facing choice + EN/FR translation keys needed.
- Options identified: (a) Verify; (b) Approve (UI-only, stored action remains verify).
- Recommended direction: none — brand voice choice · Recommendation basis: —
- Current confirmed position: engineering vocabulary fixed; UI verb open.
- Founder decision required: Yes · Decision owner: Founder · Required by phase: Phase 6 (copy freeze Phase 13) · Blocks: customer verification copy
- Affected documents: PRD2 §15; PRD5 §14; translation keys · Affected domains: frontend
- Source references: DR-PROD-010; terminology audit Part E
- Dependencies: — · Risks if unresolved: mixed UI copy
- Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: translation keys · Document corrections required: PRD2/PRD5 UI wording · Notes: founder agenda Batch B

**DEC-UX-003 — Public business profile scope at MVP**
- Category: UX · Status: **OPEN_FOUNDER** · Priority: D3
- Decision question: Can customers browse a basic public business profile, or is business information visible only through the customer's own activity? (No marketplace either way.)
- Context: OPD-008; TRD23 §23.15 permits minimal public pages "where required for Reward Program visibility" without expanding into a marketplace.
- Options identified: (a) minimal profile page (name, category, active Reward Programs); (b) activity-only visibility.
- Recommended direction: (a) minimal · Recommendation basis: TRD23 §23.15.
- Current confirmed position: no marketplace/discovery in MVP (confirmed); profile scope open.
- Founder decision required: Yes · Decision owner: Founder · Required by phase: Phase 13 (customer navigation freeze) · Blocks: customer navigation
- Affected documents: TRD23 §23.15; TRD14 · Affected domains: frontend, Search
- Source references: OPD-008; DR-PROD-006 · Dependencies: DEC-FUT-001 boundary
- Risks if unresolved: navigation churn · Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: public routes · Document corrections required: TRD14/16 note · Notes: founder agenda Batch E

**DEC-UX-004 — Minimum customer confirmation information shown to business**
- Category: UX · Status: **CONFIRMED** · Priority: D2
- Current confirmed position: During lookup businesses see only the minimum confirmation data (display name/loyalty reference) — never phone, email, full profile, or cross-business activity (TRD21 §21.17–21.18; PRD2 §20).
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Founder · Required by phase: Phase 5 · Blocks: —
- Affected documents: TRD21 §21.17–21.19; PRD2 §20 · Affected domains: Identity, Purchase
- Source references: as above; BR-013/014
- Dependencies: DEC-ID-004 · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (TRD approval)
- Implementation consequences: lookup response contract · Document corrections required: none · Notes: —

**DEC-L10N-001 — Launch languages EN + FR; three languages architecture-ready**
- Category: Localization · Status: **CONFIRMED** · Priority: D1
- Current confirmed position: English and French complete for all launch-critical journeys (customer, business, admin-critical, errors, notifications, legal docs, knowledge labels); Kirundi, Swahili, Kinyarwanda architecture-ready (codes, files, fallback, no hardcoded English); translation keys everywhere.
- Founder decision required: No · Options/Recommendation: n/a
- Decision owner: Founder · Required by phase: every phase + 13 · Blocks: —
- Affected documents: TRD13; TRD22 §22.23/FR-IMP-007; TRD23 §23.34; CKS XI · Affected domains: all
- Source references: consolidation audit §16; A-012
- Dependencies: — · Risks if unresolved: —
- Final decision: as stated · Decision date: Pre-register approval — exact date not recorded · Approved by: Founder (TRD approval)
- Implementation consequences: translation gates per phase · Document corrections required: none · Notes: —

**DEC-L10N-002 — Kirundi completion timing**
- Category: Localization · Status: **DEFERRED** · Priority: D4
- Decision question: When is complete Kirundi translation delivered?
- Context: Architecture-ready at launch; TRD22 §22.46 places broader language work in post-MVP priorities; a concrete commitment date is a future founder call.
- Options identified: post-pilot; Burundi growth phase; with Rwanda expansion (Kinyarwanda parallel).
- Recommended direction: revisit at post-launch Priority 2 (Burundi growth) · Recommendation basis: TRD22 §22.46.
- Current confirmed position: deferred beyond MVP (confirmed); timing unset.
- Founder decision required: Yes (later) · Decision owner: Founder · Required by phase: post-MVP · Blocks: nothing in MVP
- Affected documents: TRD13; TRD22 · Affected domains: Localization
- Source references: TRD22 §22.6/§22.46 · Dependencies: pilot French-comprehension evidence (AS-012)
- Risks if unresolved: none for MVP · Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: none now · Document corrections required: none · Notes: —

---

### EXTERNAL PROVIDERS (DEC-PROV)

**DEC-PROV-001 — Burundi subscription payment provider**
- Category: Providers · Status: **OPEN_PROVIDER** · Priority: D2
- Decision question: Select the initial BIF mobile-money collection provider (API, callbacks, settlement, fees, sandbox, agreement).
- Options identified: Burundi mobile-money providers to be evaluated (none named in suite).
- Recommended direction: none · Recommendation basis: OTD-009 criteria.
- Current confirmed position: Subscription Domain stays provider-independent via Integration adapters (confirmed).
- Founder decision required: Countersign commercial terms · Decision owner: Founder + Engineering Lead · Required by phase: Phase 10 · Blocks: subscription payments
- Affected documents: TRD9; TRD17 · Affected domains: Integration, Subscription
- Source references: OTD-009; TRD23 §23.23; DR-PROV-004 · Dependencies: EXT-PROV-001, EXT-LEG-004
- Risks if unresolved: Phase 10 blocked · Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: provider adapter · Document corrections required: integration decision record · Notes: —

**DEC-PROV-002 — SMS provider** — Status: **OPEN_PROVIDER** · Priority: D2 · Question: Burundi transactional SMS provider. Owner: Engineering Lead · Required by: Phase 9 · Blocks: SMS notifications · Sources: OTD-008; TRD23 §23.23 · Dependencies: EXT-PROV-002 · Other fields: as template; Final decision/date/approved: — · Notes: push uses FCM (confirmed).

**DEC-PROV-003 — Email provider** — Status: **OPEN_PROVIDER** · Priority: D2 · Question: transactional email delivery + status tracking. Owner: Engineering Lead · Required by: Phase 9 · Blocks: email notifications · Sources: OTD-008 · Dependencies: EXT-PROV-003; domain/DNS (DEC-PROV-007) · Final decision/date/approved: — · Notes: —

**DEC-PROV-004 — Phone OTP delivery route (Identity and Authentication Strategy)**
- Category: Providers · Status: **CONFIRMED** · Priority: **D1**
- Decision question: Firebase-native OTP vs external SMS route for Burundi numbers — resolved by the Founder within a broader Identity and Authentication Strategy decision.
- Options identified: (A) Firebase-native OTP (Firebase Authentication Phone Sign-In); (B) external SMS route via a third-party aggregator (Africa's Talking), requiring a custom OTP service. Full technical comparison, unmodified by this recording: [`RES-001` Evidence Pack](evidence/EXT-TECH-001-engineering-evidence-package-2026-07-29.md); [`DEC-PROV-004` Decision Package](evidence/DEC-PROV-004-decision-package-2026-07-30.md).
- Recommended direction: (A) — Engineering recommendation, preserved unmodified by this recording · Recommendation basis: Decision Package §7.
- Current confirmed position: **Option A approved**, alongside Google Sign-In as a second initial authentication mechanism — new scope introduced by the Founder's decision, not evaluated by `RES-001`/`RES-002`. See Final decision below for the full Founder-approved Identity and Authentication Strategy. **[AMENDED 2026-08-12 — `AUTH-CORR-003`]** the MVP approved mechanisms now also include **Email/Password** (point 3's "initial approved authentication mechanisms" extended to Google + Email/Password + optional Phone OTP), consistent with points 2/4 (authentication methods are independent; additive without changing canonical identity). Phone OTP's SMS route (this decision's Option A) is now **optional** — point 8/9's SMS-readiness condition therefore never blocks registration via Google or Email/Password.
- Founder decision required: Approve with Conditions (received 2026-07-30) · Decision owner: Engineering Lead, approved by Founder · Required by phase: Phase 2 · Blocks: — (resolved; unblocks `ENG-P2-001`)
- Affected documents: TRD12 §12.4.1; TRD23 §23.23; [Decision Package](evidence/DEC-PROV-004-decision-package-2026-07-30.md) · Affected domains: Identity, Integration
- Source references: OTD-004; TRD23 §23.23; [`RES-001` Evidence Pack](evidence/EXT-TECH-001-engineering-evidence-package-2026-07-29.md); [Decision Package](evidence/DEC-PROV-004-decision-package-2026-07-30.md) · Dependencies: EXT-TECH-001 (launch-readiness condition per Principle 8 below, not a decision blocker); DEC-SEC-001 (**not resolved by this recording** — see Notes)
- Risks if unresolved: — (the decision itself is resolved; residual risks tracked in Decision Package §11)
- Final decision: *"Approved with Conditions. (1) [AMENDED by `DEC-IDENTITY-001`, 2026-08-01 — see below] The customer's canonical identity is the permanent identity triad established under `DEC-IDENTITY-001` Principle 1 (Internal Customer ID, Loyalty Number, Customer QR Code) — independent of any authentication mechanism or verification method. The phone number is one possible authentication credential and one possible verification signal; it is not, itself, the customer's identity. (2) Authentication methods are independent mechanisms used to access the same customer identity. (3) The initial approved authentication mechanisms are: Firebase Authentication Phone Sign-In; Google Sign-In. (4) Future authentication providers may be added without changing the customer's canonical identity. (5) Browsing the platform shall not require authentication. (6) Authentication is required only for identity-protected actions. (7) [AMENDED by `DEC-IDENTITY-001`, 2026-08-01 — see below] Identity trust follows the Progressive Trust model confirmed under `DEC-IDENTITY-001`: trust grows continuously through customer behaviour (verified phone, verified email, account age, purchase history, device history, merchant history, and future signals) rather than a fixed three-state ladder. The Anonymous/Authenticated/Verified states named in this decision's original text remain meaningful reference points within that continuous model — Anonymous and Authenticated describe access states (governed by `DEC-IDENTITY-001`'s Authentication Principle); Verified describes a trust state reached through the signals above (governed by `DEC-IDENTITY-001`'s Progressive Trust Principle) — but are no longer the model's full definition. (8) SMS delivery validation across Burundi carriers remains a production-readiness condition rather than a governance blocker. (9) If SMS validation proves unacceptable, Engineering shall return with a comparative recommendation before changing authentication provider."* · Decision date: 2026-07-30 (points 1/7 amended 2026-08-01, per `DEC-IDENTITY-001`/`IDENTITY-ALIGN-001`) · Approved by: Founder
- Implementation consequences: unblocks `ENG-P2-001` (customer identity/authentication implementation), which must incorporate Google Sign-In, Identity Linking, and the Progressive Trust Model per Decision Package §8 — none of these are designed by this recording · Document corrections required: TRD12 §12.4.1 (authentication-strategy wording); Engineering Implementation Programme (Capability 2 dependency clearance) — not performed by this recording task, flagged as follow-on work · Notes: **`DEC-SEC-001` was separately confirmed 2026-07-30 and is itself amended by `DEC-IDENTITY-001`** (see its own entry). `EXT-TECH-001` remains **PENDING** in the External Dependencies Register; reclassified under `IDENTITY-ALIGN-001` as an Authentication-provider/Identity-Trust-Management readiness item, no longer framed as gating baseline registration (see the External Dependencies Register). Full original evidence, options analysis, and engineering recommendation — including the pre-amendment text of points (1) and (7) — preserved unmodified in the [Decision Package](evidence/DEC-PROV-004-decision-package-2026-07-30.md) and in this file's git history; this amendment does not delete or rewrite that historical record. Full amendment rationale: [Founder Decision Package §4](evidence/FD-IDENTITY-001-founder-decision-package-2026-08-01.md#4-proposed-amendment--dec-prov-004).

**DEC-PROV-005 — Error monitoring provider**
- Category: Providers · Status: **CONFIRMED** · Priority: **D1**
- Decision question: frontend + server error visibility tooling.
- Options identified: (a) Firebase/Google Cloud native (Cloud Error Reporting + Cloud Logging + Cloud Monitoring + Cloud Trace); (b) Sentry, full frontend + backend adoption; (c) bounded hybrid — Sentry for frontend only, native for backend/infrastructure/business/security/audit. Full comparison against 18 evaluation criteria: [DEC-PROV-005 Evidence Pack](evidence/DEC-PROV-005-error-monitoring-evidence-2026-07-26.md).
- Recommended direction: (c), Technical Lead recommendation, not restated here · Recommendation basis: Evidence Pack §11.
- Current confirmed position: **Option C approved** — native backend observability with dedicated frontend diagnostics. See Final decision below for the exact architecture. This decision approves the architecture only; it does **not** authorize Sentry account creation, API keys/DSNs, dependency installation, implementation, or production integration — those require their own separate authorization at the implementation/integration stage.
- Founder decision required: Countersign · Decision owner: Engineering Lead, approved by Founder · Required by phase: Phase 1 · Blocks: — (resolved; unblocks `ENG-P1-003`)
- Affected documents: TRD20 §20.22–20.36; TRD23 §23.23; Engineering Implementation Programme (`ENG-P1-003` Provider Dependency) · Affected domains: all server, frontend
- Source references: TRD23 §23.23; [Evidence Pack](evidence/DEC-PROV-005-error-monitoring-evidence-2026-07-26.md); [Founder Decision Brief](evidence/DEC-PROV-005-founder-brief-2026-07-26.md); [Source Register](evidence/DEC-PROV-005-source-register-2026-07-26.md) · Dependencies: — · Risks if unresolved: — (resolved)
- Final decision: *"Approve Option C — Native backend observability with dedicated frontend diagnostics. Firebase/Google Cloud remains the authoritative backend observability platform. Cloud Logging remains the authoritative operational log. Cloud Monitoring remains the authoritative backend monitoring platform. Frontend browser diagnostics will use a dedicated frontend diagnostics platform. Initial implementation target: Sentry. Backend error reporting will remain native unless a future governed decision changes the architecture. This decision approves the architecture only. It does not authorize creation of a Sentry account; API keys or DSNs; dependency installation; implementation; production integration. Those occur only when implementation reaches the integration stage."* · Decision date: 2026-07-26 · Approved by: Founder
- Implementation consequences: unblocks `ENG-P1-003` (Security/Storage Rules deny-by-default foundation + monitoring init); frontend Sentry integration and backend-native observability implementation both remain scoped to `ENG-P1-003`'s own, separately authorized implementation task — not begun by this decision · Document corrections required: Engineering Implementation Programme (`ENG-P1-003` Provider Dependency cleared, status `Blocked → Ready`); Coding-Agent Prompt Register (matching sync) · Notes: See the [Evidence Pack](evidence/DEC-PROV-005-error-monitoring-evidence-2026-07-26.md) and [Founder Decision Brief](evidence/DEC-PROV-005-founder-brief-2026-07-26.md) for full evidence and rationale — not restated here.

**DEC-PROV-006 — Backup service** — Status: **OPEN_PROVIDER** · Priority: D3 · Question: Firestore/Storage backup tooling (with DEC-TECH-010). Owner: Engineering Lead · Required by: Phase 14 · Blocks: pilot gate · Sources: OTD-011; TRD23 §23.23 · Dependencies: DEC-TECH-010 · Final decision/date/approved: — · Notes: —

**DEC-PROV-007 — Domain and DNS** — Status: **OPEN_PROVIDER** · Priority: D3 · Question: production domain, DNS and email authentication setup. Owner: Founder + Engineering Lead · Required by: Phase 16 · Blocks: production launch · Sources: TRD23 §23.23 · Dependencies: DEC-PROV-003 · Final decision/date/approved: — · Notes: —

---

### LEGAL AND COMPLIANCE (DEC-LEGAL) — all OPEN_LEGAL; no legal conclusions are made in this register

**DEC-LEGAL-001 — Burundi privacy framework, retention and marketing consent**
- Category: Legal · Status: **OPEN_LEGAL** · Priority: D3
- Decision question: Confirm the applicable Burundi privacy framework: customer rights, marketing/consent rules, retention periods, breach obligations.
- Context: TRD21 architecture (consent, rights service, retention classes) is built; legal values/validation outstanding.
- Options identified: n/a — external legal review required.
- Recommended direction: none (no legal conclusion) · Recommendation basis: —
- Current confirmed position: privacy-by-design architecture confirmed; legal parameters open.
- Founder decision required: Accept legal advice · Decision owner: Founder + legal adviser · Required by phase: Phase 14 / pilot gate · Blocks: pilot launch
- Affected documents: TRD21 · Affected domains: Identity, all
- Source references: LCD-001; DR-LEGAL-001 · Dependencies: EXT-LEG-001
- Risks if unresolved: launch blocker · Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: retention job values, consent text · Document corrections required: privacy docs · Notes: includes retention-period values and marketing-consent rules

**DEC-LEGAL-002 — Consumer/loyalty terms and business reward obligations** — Status: **OPEN_LEGAL** · Priority: D3 · Question: Reward Program terms, business obligation to honour rewards, dispute language, platform liability, subscription terms. Owner: Founder + legal adviser · Required by: Business Terms component — immediate (Capability 3 dependency, Founder-reprioritised 2026-08-29, `DEC-LEGAL-002-FOUNDER-DISP-001`); remaining legal/pilot-gate items — Phase 14/pilot (unchanged) · Blocks: pilot launch; business agreements; Capability 3 completion (Business Terms component only) · Sources: LCD-002; DR-LEGAL-002 · Dependencies: EXT-LEG-002 · Final decision/date/approved: — · Notes: FD-1 (`DEC-LEGAL-002-FOUNDER-DISP-001`, 2026-08-29) — Founder re-prioritised the Business Terms component as an immediate Capability 3 dependency; the runtime `assertCurrentBusinessTermsAccepted` fail-closed gate is confirmed correct and is not to be weakened. This does not change Status (remains OPEN_LEGAL), does not resolve the decision, and does not bring other Phase 14/15 legal activity forward. Founder product positions on FD-2–FD-7 recorded in the [Founder Decision Sheet](evidence/DEC-LEGAL-002-PREP-001-founder-decision-sheet-2026-08-29.md); legal-counsel handoff at [DEC-LEGAL-002-FOUNDER-DISP-001 Legal Counsel Handoff Pack](evidence/DEC-LEGAL-002-FOUNDER-DISP-001-legal-counsel-handoff-pack-2026-08-29.md). **`DEC-LEGAL-002-LEGAL-OPINION-RECON-001` (2026-08-29) — external Legal Opinion received and reconciled.** External legal counsel's Comprehensive Legal Opinion & Core Terms Framework response was received, filed verbatim as evidence, and reconciled against Founder FD-1–FD-7, `DEC-LOY-011`, and existing governed architecture across all 20 opinion sections (see [Reconciliation Matrix](evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-reconciliation-matrix-2026-08-29.md)). Thirteen Founder legal-architecture positions (`LEG-FD-01`–`LEG-FD-13`) were recorded (see [Founder Legal Architecture Disposition Record](evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md)), most of which confirm or narrowly qualify counsel's conclusions; several specific counsel recommendations were **not adopted** as universal rules (the blanket "rewards have no monetary/cash value" phrasing — corrected per FD-6; a mandatory 60-day exit run-off period; a mandatory cash-conversion duty on Business exit; a universal 30-day programme-change notice; universal 7/14/24/48-day/hour suspension periods; "customer data as contractual consideration"; Kirundi as a general application language; forced scrolling as a universal acceptance requirement) — each fully reconciled, not left contradictory, per the Reconciliation Matrix. A live-authority conflict search found no tracked document currently asserting any of the not-adopted positions. `EXT-LEG-002` updated `PENDING` → `EVIDENCE_RECEIVED` (External Dependencies Register) as a result. **This does not change `DEC-LEGAL-002`'s Status** (remains `OPEN_LEGAL`) and does not itself draft, approve, or configure any Terms content or version. One concrete Founder decision remains outstanding before Core Business Terms drafting can proceed to completion: selection of the dispute-resolution forum/seat/rules (Business↔Platform disputes clause) — see the [Post-Legal-Review Resolution Assessment](evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-resolution-assessment-2026-08-29.md) and the [Terms Drafting Readiness Note](evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-terms-drafting-readiness-2026-08-29.md) (14 of 16 Business Terms sections are drafting-ready on principle-based language; Disputes/corrections and Liability sections are not). Customer Terms are determined to be a separate future governed work package and are confirmed **not** a Capability 3 blocker (Capability 3's actual blocker remains the Business Terms component only, per direct inspection of `assertCurrentBusinessTermsAccepted`). No `DEC-SUB-*` status changed; no application/source/Firebase change made.

**DEC-LEGAL-003 — Burundi electronic billing requirements** — Status: **OPEN_LEGAL** · Priority: D2 · Question: invoice/receipt content, tax display, e-record retention, possible e-invoicing obligations. Owner: Founder + legal adviser · Required by: Phase 10 · Blocks: billing documents · Sources: LCD-003; DR-LEGAL-003 · Dependencies: EXT-LEG-003; DEC-SUB-008; DEC-TECH-009 · Final decision/date/approved: — · Notes: —

**DEC-LEGAL-004 — Mobile-money merchant agreement** — Status: **OPEN_LEGAL** · Priority: D2 · Question: merchant integration terms, settlement, refunds, callback evidence, support responsibilities. Owner: Founder · Required by: Phase 10 · Blocks: payment provider go-live · Sources: LCD-004; DR-LEGAL-004 · Dependencies: DEC-PROV-001; EXT-PROV-001 · Final decision/date/approved: — · Notes: commercial agreement + legal review

**DEC-LEGAL-005 — Minimum account age, children and family data** — Status: **OPEN_LEGAL** · Priority: D2 · Question: minimum independent account age, guardian requirements, treatment of children's purchases under family loyalty-number use. Owner: Founder + legal adviser · Required by: Phase 2 (registration policy) / Phase 14 gate · Blocks: registration policy text · Sources: LCD-005; DR-LEGAL-005; TRD21 §21.40–21.42 · Dependencies: EXT-LEG-004 · Final decision/date/approved: — · Notes: interacts with DEC-LOY-007

**DEC-LEGAL-006 — Cross-border Firebase hosting position** — Status: **OPEN_LEGAL** · Priority: **D1** · Question: approved hosting regions, notice/contractual safeguards, provider disclosures for Burundi data hosted abroad. Owner: Founder + legal adviser · Required by: Phase 1 (region selection) · Blocks: DEC-TECH-005 · Sources: LCD-006; DR-LEGAL-006 · Dependencies: EXT-LEG-005 · Final decision/date/approved: — · Notes: —

---

### PILOT (DEC-PILOT)

**DEC-PILOT-001 — Pilot cohort: categories, size, location**
- Category: Pilot · Status: **OPEN_FOUNDER** · Priority: D3
- Decision question: Which business categories (from TRD22's balanced list: salon/barbershop, coffee/café, restaurant, car wash, bakery, other recurring service), how many businesses, and confirm Bujumbura-first.
- Options identified: cohort sizes/mixes to be proposed; TRD22 §22.25 criteria: staff-trainable, reward-honouring businesses.
- Recommended direction: TRD22 balanced-cohort guidance · Recommendation basis: TRD22 §22.25.
- Current confirmed position: pilot structure and validation areas confirmed (TRD22); cohort specifics open.
- Founder decision required: Yes · Decision owner: Founder · Required by phase: Phase 15 · Blocks: pilot preparation
- Affected documents: TRD22 §22.25 · Affected domains: all
- Source references: TRD22; A-001/A-002 · Dependencies: DEC-SUB-013
- Risks if unresolved: pilot delay · Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: pilot onboarding plan · Document corrections required: pilot plan doc · Notes: founder agenda Batch E

**DEC-PILOT-002 — Public-launch go/no-go criteria confirmation**
- Category: Pilot · Status: **OPEN_FOUNDER** · Priority: D3
- Decision question: Confirm the pilot-exit and production-launch gates (TRD22 §22.25–22.26) as the go/no-go standard, plus any founder-added thresholds (e.g., minimum verification rate).
- Options identified: (a) TRD22 gates as-is; (b) gates + quantitative pilot thresholds.
- Recommended direction: (a) is the documented minimum; (b) is suggested as stronger practice — founder chooses · Recommendation basis: TRD22 §22.45.
- Current confirmed position: technical exit gates defined (TRD22); founder thresholds open.
- Founder decision required: Yes · Decision owner: Founder · Required by phase: Phase 15/16 · Blocks: launch decision
- Affected documents: TRD22 §22.25–22.26/§22.45 · Affected domains: all
- Source references: TRD22 · Dependencies: assumptions register validations
- Risks if unresolved: unclear launch bar · Final decision: — · Decision date: — · Approved by: —
- Implementation consequences: launch checklist · Document corrections required: launch plan · Notes: founder agenda Batch E

---

### FUTURE SCOPE (DEC-FUT) — all DEFERRED per TRD22 §22.6/§22.46; deferral is not rejection

**DEC-FUT-001 — Public marketplace, nearby search, map discovery, recommendations** — Status: **DEFERRED** · Priority: D4 · Deferred to: Verified Business/Commerce layers; revisit post-pilot (TRD22 §22.46 Priority 2+). Sources: TRD22 §22.6; TRD23 §23.15 · Boundary decision at MVP: DEC-UX-003. Final decision/date/approved: — · Other fields: per TRD22.

**DEC-FUT-002 — Customer wallet (funding, payments, transfers)** — Status: **DEFERRED** · Priority: D4 · Deferred to: Verified Commerce (Priority 5). Sources: TRD22 §22.6; PRD6 §22 (architecture-readiness only). Final decision/date/approved: —.

**DEC-FUT-003 — Verified Gift Cards and reward gifting/transfer** — Status: **DEFERRED** · Priority: D4 · Deferred to: Verified Commerce (Priority 5); architecture must not require redesign (FR-RP-011/012 PRD6). Sources: TRD22 §22.6; PRD6 §21–22; PRD7 §16. Final decision/date/approved: —.

**DEC-FUT-004 — POS integration, public API, CRM/accounting integrations** — Status: **DEFERRED** · Priority: D4 · Deferred to: Verified Business (Priority 4); Integration Domain adapters keep readiness. Sources: TRD22 §22.6/§22.37; TRD9 §9.4. Final decision/date/approved: —.

**DEC-FUT-005 — Multi-branch operation and franchises** — Status: **DEFERRED** · Priority: D4 · Deferred to: Verified Business (Priority 4); data stays branch-ready (DEC-SUB-005). Sources: TRD22 §22.6; TRD23 §23.14; PRD10 §12. Final decision/date/approved: —.

**DEC-FUT-006 — Advanced analytics, benchmarking, AI recommendations, Experience/Intelligence Studios** — Status: **DEFERRED** · Priority: D4 · Deferred to: Priorities 4–6; AI never auto-publishes or bypasses verification (BR-085, confirmed). Sources: TRD22 §22.6; PRD9 §18; Rules Studio (studios 3–4 marked future). Final decision/date/approved: —.

**DEC-FUT-007 — Promotions, referral, birthday and seasonal campaigns** — Status: **DEFERRED** · Priority: D4 · Deferred to: Verified Commerce; birthday activation additionally gated by DEC-PROD-013. Sources: TRD22 §22.6; PRD0 §19.2. Final decision/date/approved: —.

**DEC-FUT-008 — Points, tiers, stacked rewards, configurable thresholds, coalition loyalty** — Status: **DEFERRED** · Priority: D4 · Deferred: explicitly excluded from MVP; threshold configurability requires formal product approval (DEC-LOY-001). Sources: TRD22 §22.6; PRD0 §19.2. Final decision/date/approved: —.

---

## 5. Register Summary

| Status | Count |
|---|---|
| CONFIRMED | 46 |
| OPEN_FOUNDER | 22 |
| OPEN_ENGINEERING | 12 |
| OPEN_PROVIDER | 5 |
| OPEN_LEGAL | 6 |
| DEFERRED | 10 |
| SUPERSEDED | 4 |
| REJECTED | 0 (no option in the suite was explicitly considered and rejected outright; exclusions are DEFERRED per TRD22) |
| **Total records** | **105** (adds `DEC-AUTH-001`, recorded 2026-08-07 per `AUTH-P0-001`; previously added `DEC-IDENTITY-001`, 2026-08-01 per `IDENTITY-ALIGN-001`; `DEC-PROV-004` and `DEC-SEC-001` remain CONFIRMED and are not double-counted — they were amended in place, not superseded) |

Freeze blockers (D0 × 4): DEC-GOV-001 (document hierarchy), DEC-GOV-006 (ID renumbering approval), DEC-LOY-010 (batch rejection), DEC-DATA-003 (Purchase Record monetary fields).

Companion files: [Founder Decision Agenda](founder-decision-agenda.md) · [External Dependencies Register](external-dependencies-register.md) · [Assumptions Register](assumptions-register.md) · [Phase 3 Reconciliation](phase-3-reconciliation.md)
