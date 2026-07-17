# 11thONUS Document Consolidation and Alignment Plan

**Audit date:** 16 July 2026
**Purpose:** Step-by-step correction plan enabling a separate agent (or editor) to correct the documentation safely using the Findings Register. **No correction has been performed by this audit.**
**Prime directives for the correcting agent:** never change approved product behavior silently; classify every edit (Editorial / Normalization / Clarification / Decision Required / Material Change per Consolidation Audit §25); anything classified Decision Required or Material Change stops and goes to the founder.

---

## Step 0 — Preconditions (founder actions, ~1 sitting)

1. Approve this audit's classification of `11thONUS Product Definition.md` and `11THONUS-data-model.md` as Superseded/Historical (DR-ARCH-001).
2. Approve the requirement-ID renumbering mapping strategy (ID Audit §5; DR-ARCH-004).
3. Approve adoption of the TRD23 §23.7 domain model and Consolidation Audit §7 state tables as suite-wide canonical (DR-ARCH-003/006).
4. Decide the governance hierarchy text (DR-ARCH-002).

Without these four approvals, only Step 1 may proceed.

## Step 1 — Safe editorial corrections (no decisions needed; can start immediately)

| Action | Documents | Finding |
|---|---|---|
| Add SUPERSEDED status headers (do not edit body text) | Product Definition, data-model | DOC-P0-001/002 — *header addition is safe even before Step 0 sign-off if worded as "under review as superseded"* |
| Remove/convert conversational commentary | CKS, Rules Studio, TRD1-7, PRD3 §28, PRD9 closing | DOC-P3-001 |
| Fix PRD9 header line, PRD2 formatting/`<br/>` artifacts | PRD9, PRD2, PRD5 | DOC-P3-004/009 |
| Normalize product-category wording | Product Definition (n/a once superseded), PRD0 §3 | DOC-P3-002 |
| Normalize 11thONUS capitalization, British/American spelling, "Reward Program" spelling | all | DOC-P3-007/010 |
| Add glossary mapping Trust Ledger→trustEvents | PRD4 or glossary | DOC-P3-005 |

Dependencies: none. These edits change no meaning.

## Step 2 — Canonical glossary freeze

Produce a one-file glossary (terms from Terminology Audit Part A + UI/state mapping Part D). Sources: Consolidation Audit §3, TRD23 §23.9, this audit.
**Dependency:** Step 0.3. **Output:** `GLOSSARY.md` — becomes the reference for all later steps.

## Step 3 — Requirement-ID renumbering

1. Apply mapping: PRD1 §18 FR-RP→FR-AUTHZ; PRD10 §19 FR-RP→FR-RBAC; TRD20 OP→OR; TRD23 A→AS; add FR-CVLE IDs to PRD4 §19.
2. Update every cross-reference (search for each old ID suite-wide before rename).
3. Publish the old→new mapping appendix.
**Documents affected:** PRD1, PRD4, PRD6 (unchanged but verify), PRD10, TRD20, TRD23. **Finding:** DOC-P1-001, DOC-P3-008. **Dependency:** Step 0.2.

## Step 4 — Domain-ownership normalization

1. Rewrite TRD1-7 Chapter 4 and Chapter 6 matrix to the 15-domain model (add Reward Programs, Subscription, Integration; remove Subscriptions from Administration; rename Purchases→Purchase).
2. Correct TRD10 §10.4 rows: rewardPrograms/rewardProgramVersions → Reward Programs domain; businesses → Identity; subscriptions/subscriptionPayments → Subscription (+ Integration for payment adapters); clarify notificationDeliveries (Notification intent vs Integration delivery).
**Finding:** DOC-P0-004. **Dependency:** Step 0.3. **Classification:** Normalization (decision pre-exists in TRD23).

## Step 5 — State-model normalization

1. Insert canonical state tables (Terminology Audit Part C) into the consolidated TRD data chapter.
2. Correct: TRD10 subscription enum (DOC-P1-003), TRD10 users enum (+archived), TRD10 notification enum (+suppressed/cancelled), knowledge/rule-version vocabularies (C.15/C.16).
3. Annotate PRD5 Draft/Recorded, PRD6 Current/Historical, PRD7 "Redemption States" heading per founder decisions (DR-ARCH-006, DR-TECH-013).
**Finding:** DOC-P1-002/003. **Dependency:** Steps 0.3, 2.

## Step 6 — Threshold and scope corrections

1. Add MVP-fixed-threshold annotation at TRD10 §10.9.2 and Rules Studio "Required Verified Units" (DOC-P0-003).
2. Mark Rules Studio Bronze/Silver/Gold examples illustrative (DOC-P2-001).
3. Update PRD0 §18 / PRD3 §9–10 plan basis to Active Reward Programs — **requires DR-COMM-004 confirmation**.
4. Correct PRD0 §14.3 batch-rejection line — **requires DR-PROD-003 decision**.
5. Reconcile PRD1/PRD10 permission model — **requires DR-ARCH-005**.
6. Resolve PRD5 §5 monetary fields vs TRD10 — **requires DR-TECH-011**.
7. Fix Business Rules Catalogue references (PRD0 §14.5, PRD2 §18) to point to Rules Studio typed rules — **requires DR-PROD-008**.
**Dependencies:** the named Decision Register entries. Items awaiting decisions get a visible `OPEN DECISION: DR-xxx` marker instead of silent text.

## Step 7 — Terminology normalization pass

Apply the glossary suite-wide: loyalty product→Reward Program (PRD0–PRD3), approve→verify (engineering text), transaction→Purchase Record where meant, actor names, code→loyalty number. Verify with a scripted search that no prohibited backend terms remain in customer-copy examples.
**Finding:** DOC-P1-004, Terminology table Part B. **Dependency:** Step 2.

## Step 8 — Governance hierarchy amendment

Amend Constitution Part VII (deliberate, versioned — Constitution Part VI amendment rules apply) or TRD23 §23.3 so one hierarchy exists; state Vision & Product Strategy disposition; add Commerce Knowledge Standard position.
**Finding:** DOC-P1-008. **Dependency:** DR-ARCH-002.

## Step 9 — Decision Register creation

Convert the Open Decisions extraction (71 items) into `11thONUS Decision Register v1.0` with the TRD-specified fields (ID, context, options, recommendation, owner, deadline, dependency, status, resolution). Transfer TRD23 §23.21–23.25 content and add cross-references from TRD23 back to the register.
**Dependency:** Steps 0–8 mostly independent; can run in parallel after Step 0.

## Step 10 — Proposed consolidated document structure

```
/00_GOVERNANCE/
   Constitution v1.1 (amended hierarchy)
   Decision Register v1.0
   Glossary v1.0
/01_PRODUCT/
   PRD v1.0 (consolidated Stage 1 + Sections 1–10, renumbered, normalized)
/02_TECHNICAL/
   TRD v1.0 (Parts I–XVI per Consolidation Audit §2, corrections applied)
/03_STANDARDS/
   Commerce Knowledge Standard v1.1
   Knowledge Studio v1.1 / Rules Studio v1.1
   Engineering Standards v1.0  (NEW — required before implementation)
/04_TRACEABILITY/
   Requirements Traceability Register v0.1 (initialized)
   Requirement ID Mapping Appendix
/09_ARCHIVE/
   Product Definition (superseded)
   11THONUS-data-model (superseded)
   TRD Consolidation Audit (instrument, retired after application)
/AUDIT_REPORTS_2026-07-16/ (this audit — retained)
```
Folder moves happen only at consolidation time with founder approval; the current architecture is preserved until then.

## Step 11 — Traceability register preparation

1. Initialize from the PRD-TRD Traceability Gap Report (18 capability rows → expand to requirement level).
2. Use post-renumbering IDs only.
3. Fields per TRD23 §23.5 record type; join each FR to: domain, phase (TRD22), test class (TRD19), status.
4. Mark primary vs restated rules (ID Audit §4).

## Step 12 — Validation

1. Scripted checks: no duplicate IDs; no "Bronze/Silver/Gold" outside illustrative context; no "loyalty product" in normative text; no orphan cross-references; state names match canonical enums; no `TODO`/`OPEN DECISION` without register ID.
2. Manual review: the four P0 findings closed; each P1 either closed or converted to a register entry with phase deadline.
3. Re-run this audit's method (inventory → ID extraction → conflict greps) and diff against this report.

## Step 13 — Final freeze checklist (gate to Version 1.0)

- [ ] P0 findings DOC-P0-001..004 closed
- [ ] P1 findings closed or register-tracked with pre-phase deadlines
- [ ] Superseded documents labelled and archived
- [ ] Glossary approved; terminology scripted check passes
- [ ] Requirement-ID audit passes (zero duplicates); mapping appendix published
- [ ] Canonical state tables published; schemas aligned
- [ ] Domain model consistent across TRD1-7, TRD10, TRD23
- [ ] Governance hierarchy single-sourced
- [ ] Decision Register v1.0 exists; all Material items visible, none silently resolved
- [ ] Traceability register initialized
- [ ] Engineering Standards drafted (TRD §22/§23 prerequisite for implementation, not for freeze)
- [ ] Founder sign-off recorded per document
- [ ] Publish: "11thONUS Documentation Suite Version 1.0 — Freeze Candidate"

## Cross-document dependency map (summary)

- Steps 1–2 unblock everything else.
- Step 3 (IDs) must precede Step 11 (register) — the register must never contain a colliding ID.
- Step 4 (domains) must precede TRD-based work packages (Phases 1+).
- Step 6 items 3–7 are decision-gated; schedule founder decision session early.
- Step 8 (hierarchy) independent but must precede freeze sign-off.
- Steps 9–11 can run in parallel once Step 3 completes.

**Estimated effort:** Steps 0–2 one working session; Steps 3–8 one focused consolidation pass (agent-assisted, founder reviewing classifications); Steps 9–13 one session plus decision meetings.
