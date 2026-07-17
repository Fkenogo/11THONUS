# 11thONUS Engineering Governance Charter

> **Title:** Engineering Governance Charter
> **Version:** 1.0 · **Status:** Active governance process · **Classification:** Working (governance process)
> **Governing document:** 11thONUS Platform Constitution
> **Source-of-truth path:** `docs/06-engineering-governance/engineering-governance-charter.md`
> **Last controlled update:** 2026-07-16 (Phase 6 — created)

## 1. Purpose

This charter establishes the **Engineering Governance** section of the 11thONUS documentation suite: a permanent operational handbook for how engineering work is proposed, implemented, reviewed, shipped and verified once the platform moves from documentation into build.

It exists because the documentation programme (Phases 1–5) answered *what* the platform must do and *why* — Constitution, PRD, TRD, Decision Register, Requirements Traceability Matrix. It did not yet answer *how the people and agents doing the building work together, in what order, and with what checkpoints*. Phase 6 answers that question.

## 2. What This Section Governs

`docs/06-engineering-governance/` documents the **collaboration process** between the Founder, the ChatGPT Technical Lead, coding agents, and future engineering contributors. It governs:

- the end-to-end workflow from Founder intent to deployed, verified change (`ai-collaboration-workflow.md`);
- what a coding agent is and is not permitted to do (`coding-agent-standard.md`);
- the required shape of an implementation prompt / work package (`implementation-prompt-standard.md`);
- how completed work is reviewed before it ships (`technical-review-standard.md`);
- the human Git workflow between agent and Founder (`git-workflow.md`);
- how a verified change reaches production (`deployment-workflow.md`);
- the reusable, feature-agnostic manual QA checklist run before sign-off (`manual-testing-standard.md`);
- the completion gate for a single unit of engineering work (`definition-of-done.md`);
- who is accountable for what across the whole loop (`roles-and-responsibilities.md`);
- the operating principles that should guide judgment when a rule doesn't cover the situation (`engineering-principles.md`).

## 3. What This Section Does Not Govern

This charter is deliberately narrow. It does **not**:

- define or change **product behaviour** — that remains the PRD's authority;
- define or change **technical architecture, data model, or NFRs** — that remains the TRD's authority (Chapters 1–23), including the deep technical detail already approved in TRD19 (Quality Engineering), TRD20 (Deployment and Operational Resilience) and TRD22 (MVP Implementation and Delivery);
- create, resolve, or approve **Decision Register** entries — the register remains the sole record of founder and engineering decisions, updated only through the Decision Governance Workflow;
- assign or change **requirement IDs** — those are fixed under the Phase 4 [Requirement ID Mapping](../00-governance/requirement-id-mapping.md);
- replace **`docs/03-standards/engineering-standards/`** — that placeholder is reserved for product-implementation technical standards (repository layout, TypeScript rules, Firestore/Functions conventions, command/event contracts, error codes, state-transition and idempotency implementation, transaction policy, testing structure, migrations, logging). It is a *technical build standard*; this section is a *collaboration process standard*. See §5 below for how the two relate.

## 4. Relationship to Existing Governance

| Existing document | Authority it keeps | How Engineering Governance relates to it |
|---|---|---|
| **Platform Constitution** | Constitutional Principles (CP-001..015), the Four Questions (Part V), the governance hierarchy (Part VII) | Engineering Governance sits *below* the Constitution in the hierarchy (§6) and operationalizes CP-011 (Deliberate Evolution) and the Four Questions into a repeatable engineering process. It never redefines a Constitutional Principle. |
| **Decision Register** | The single record of every founder/engineering/provider/legal decision | Engineering Governance documents **cite** decisions by ID where relevant (e.g. an OPEN_ENGINEERING record blocking a work package) but never create, edit, approve or resolve register entries. That constraint is absolute (see §7). |
| **Requirements Traceability & Implementation Matrix** | The single row-per-requirement map from documentation to planned implementation | Engineering Governance defines *how* an agent picks up a traceability row and turns it into a work package, implementation, and Implementation Status update — the matrix stays the record of *what*; this section is the record of *how*. |
| **Documentation Changes Log** | The append-only log of every documentation change | Every Phase 6 document is entered as one changes-log entry, exactly like every prior phase. |
| **TRD Chapter 19 (Quality Engineering)** | Automated/technical test architecture, product-feature Definition of Done (§19.49), defect severity, release gates (§19.52), quality ownership by role (§19.64) | Authoritative for the underlying *technical* quality bar. `manual-testing-standard.md` and `definition-of-done.md` build on top of it rather than restating it — see the cross-reference table in each document. |
| **TRD Chapter 20 (Deployment and Operational Resilience)** | Branching and change control, CI, CD, deployment permissions, deployment artifacts, rollback readiness | Authoritative for deployment *architecture*. `git-workflow.md` and `deployment-workflow.md` describe the *human sequence* a solo Founder and coding agents follow inside that architecture. |
| **TRD Chapter 22 (MVP Implementation and Delivery)** | MVP phase sequencing, Delivery Principles (DIP-001..007), Implementation Work-Package Standard (§22.38), Coding-Agent Change Tracking (§22.39), Coding-Agent Stop Conditions (§22.40), Phase Review Standard (§22.41) | These four sub-sections are the direct technical ancestors of `coding-agent-standard.md`, `implementation-prompt-standard.md` and `technical-review-standard.md`. Phase 6 does not redefine them — it operationalizes them into role-based, step-by-step documents an agent or Founder can follow without re-deriving the rule each time. TRD22 §22.40 in particular remains **the** stop-and-report rule; every Engineering Governance document cites it rather than restating it. |
| **`03-standards/engineering-standards/` (placeholder)** | Future product-implementation technical standards | Cross-referenced, not duplicated (§3). Its own bullet list has been annotated to point coding-agent process content at this section (see the Cross-Reference Integration record in the Phase 6 report). |

## 5. Consolidation Rule

Where a rule already exists in TRD19, TRD20 or TRD22, the Engineering Governance document **cites the TRD section by number** and either (a) adds the process detail the TRD states as a requirement but does not spell out step-by-step, or (b) narrows the TRD's broader statement to the specific collaboration pattern used on this project (a solo Founder working with a ChatGPT Technical Lead and coding agents, rather than a multi-engineer team). No Engineering Governance document restates a TRD rule in a way that could drift out of sync with it. If a future TRD revision changes one of these cited sections, the Engineering Governance document is corrected to match — the TRD leads, this section follows.

## 6. Position in the Documentation Hierarchy

Engineering Governance sits at the same working tier as the Decision Register and Traceability Matrix: it does not outrank the Constitution, PRD or TRD, and a conflict between this section and any of those three is always resolved in favour of the higher document (Constitution Part VII; TRD23 §23.3). See the updated [Documentation Index](../README.md) §1.

## 7. Absolute Constraints

Consistent with every prior phase of this programme, no document in this section may:

- modify product requirements or requirement IDs;
- modify the Decision Register;
- approve a Founder Decision;
- introduce implementation code;
- redesign existing (Constitution / PRD / TRD) governance;
- be used by a coding agent as authority to bypass a TRD22 §22.40 stop condition.

## 8. Maintenance

This section is maintained the same way as every other governance document: edits are logged in the [Documentation Changes Log](../00-governance/documentation-changes-log.md), classified per the standard taxonomy (Editorial / Normalization / Clarification / Decision Required / Material Change), and never resolve an open decision as a side effect of an edit.

## 9. Document Index

See [`README.md`](README.md) for the full index of this section's 11 documents.
