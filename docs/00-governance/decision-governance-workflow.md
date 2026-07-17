# 11thONUS Decision Governance Workflow

> **Title:** Decision Governance Workflow
> **Version:** 1.0 · **Status:** Active governance process · **Classification:** Working (governance process)
> **Governing document:** 11thONUS Platform Constitution
> **Source-of-truth path:** `docs/00-governance/decision-governance-workflow.md`
> **Last controlled update:** 2026-07-16 (Phase 3A — created)

This is the operational governance process for every 11thONUS decision. The step-by-step editing procedure that implements it is [`decision-update-procedure.md`](decision-update-procedure.md).

---

## 1. The Lifecycle

```
Decision identified
        ↓
Decision added to register        (status OPEN_*, priority D0–D4, owner, blocking phase)
        ↓
Founder review                    (via the Founder Decision Agenda, in batches;
        ↓                          engineering/provider/legal items via their owners)
Decision approved                 (owner records the choice; founder countersigns
        ↓                          where the record requires it)
Decision Register updated         (Final decision, Decision date, Approved by;
        ↓                          status → CONFIRMED)
Affected documents updated        (per the record's "Document corrections required";
        ↓                          Constitution only via formal Part VI amendment)
Documentation Changes Log updated (one entry per change set)
        ↓
Decision becomes implementation authority
        ↓
Coding agents may implement       (agents cite the DEC ID in work packages)
```

**Until the full chain has run, a decision is not implementation authority.** An approved decision whose document corrections are still pending may be cited by ID, but agents must implement against the register record, not against the stale document text (the record's *Document corrections required* field lists exactly which passages are pending).

## 2. Responsibilities

| Role | Responsibility |
|---|---|
| **Founder** | Sole approver of OPEN_FOUNDER records; countersigns engineering/provider records where marked; accepts (never makes) legal advice for OPEN_LEGAL records; approves constitutional amendments; owns the register |
| **Engineering Lead** | Owner/approver of OPEN_ENGINEERING records; provides evidence for technical proofs; proposes options with trade-offs |
| **Legal adviser(s)** | Provide evidence and advice for OPEN_LEGAL items; never recorded as approver — the founder accepts the advice |
| **Providers** | Supply capability evidence (external-dependencies register); never approvers |
| **Documentation maintainer / AI agent** | Records decisions verbatim, executes document corrections, maintains logs — **never approves, never resolves, never infers**; stops and reports on ambiguity (TRD22 §22.40) |

## 3. Approval Rules

1. **Only the named decision owner can approve** a record; for OPEN_FOUNDER that is always the founder.
2. **Approval evidence** = the founder's explicit written instruction (chat message, email or signed note). The instruction is quoted or faithfully paraphrased in *Final decision*, and its date becomes *Decision date*.
3. **Options are not limited to the listed ones.** The founder may choose an unlisted option; the record then gains that option before approval so history shows what was chosen against what.
4. **Conditional or partial approvals** are permitted: the condition is written into *Final decision*, the record stays CONFIRMED, and a linked follow-up record (or dependency) is opened for the condition.
5. **Batch approvals** are allowed (e.g., an answer sheet covering many IDs), but each record is still updated individually.
6. **Recommendations never auto-convert:** an unanswered recommendation stays OPEN forever; silence is never approval.
7. **D0 records** (freeze blockers) must be CONFIRMED before the documentation Version 1.0 freeze; D1 before Phases 0–2 implementation; D2 before their dependent phase; D3 before pilot/launch.

## 4. Version Control

- The **register** carries a version (currently 1.0) and a *Last controlled update* date; recording decisions updates the date, not the version. The version increments (1.1, 1.2…) only when the register's *structure* changes (new statuses, new fields, category reorganization) — with the reason logged.
- **Affected documents** keep their own versions: routine decision-driven corrections are logged in the changes log without a version bump until the coordinated Version 1.0 freeze; **material behavior changes** post-freeze follow TRD23 §23.38–23.39 (clarification / minor / major classes).
- Every change set = **one changes-log entry** listing: decision ID(s), documents touched, and the change classification (Editorial / Normalization / Clarification / Decision-driven correction / Material).
- No version number is ever introduced without recording why (metadata rule, Phase 2).

## 5. Amendment Process (changing an approved decision)

1. A CONFIRMED decision is never edited in place to say something different.
2. To change it: open a **new** record (next free ID in the category) describing the new question/context; approve it normally; mark the old record **SUPERSEDED** with a "Superseded by DEC-XXX-NNN" reference; execute the new record's document corrections.
3. If the change would alter the Constitution, PRD-approved product behavior, domain ownership, data model, security posture or MVP scope, it is a **Major change** (TRD23 §23.38) — formal review before approval.

## 6. Superseded and Rejected Decisions

- **SUPERSEDED:** the historical option stays fully readable, keeps its ID forever, and points to its replacement. (Examples already registered: DEC-PROD-007, DEC-LOY-012, DEC-SUB-011, DEC-SUB-012.)
- **REJECTED:** used when an option/question is explicitly considered and refused (not merely deferred). The record keeps the reasoning and approver. Rejected ≠ deleted; a rejected idea may only return via a new record referencing the rejection.
- **DEFERRED** records are re-reviewed at their named phase; deferral is not rejection.

## 7. Interaction with the Constitution

- The Constitution outranks the register. A register decision **never** modifies the Constitution by itself.
- Where a decision requires constitutional change (today: DEC-GOV-001), the sequence is: decision CONFIRMED in register → **separate amendment step** executed per Constitution Part VI (deliberate, documented, versioned, backward-conscious) → changes-log entry marked "Constitutional amendment" → canonical reference and docs index updated.
- If a register record is ever found to conflict with the Constitution, the record is corrected — not the Constitution (TAP-001).

## 8. Interaction with the Canonical Reference

- The canonical reference **mirrors** approved content; it never leads. It is updated **in the same change set** as the documents it summarizes — never before the underlying document, never independently.
- Its OPEN markers cite register IDs; when a decision is CONFIRMED, the marker is replaced with the confirmed position + DEC ID in the same change set.
- If the canonical reference ever disagrees with the Constitution/PRD/TRD/register, the reference is corrected (its header says so).

## 9. Coding-Agent Contract

- Before implementing any behavior touched by a decision, an agent checks the register by DEC ID.
- `OPEN_*` → stop and report, citing the ID. `CONFIRMED` → implement, citing the ID in the work-package report. `DEFERRED` → do not implement. `SUPERSEDED/REJECTED` → implement only the replacing record.
- Agents never write to the register except when executing this workflow under an explicit founder instruction, and never fill approval fields on their own initiative.
