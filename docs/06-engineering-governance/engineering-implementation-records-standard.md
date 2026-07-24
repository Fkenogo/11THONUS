# Engineering Implementation Records Standard

> **Title:** Engineering Implementation Records Standard
> **Version:** 1.0 · **Status:** Active governance process · **Classification:** Working (governance process)
> **Governing document:** [Engineering Governance Charter](engineering-governance-charter.md)
> **Source-of-truth path:** `docs/06-engineering-governance/engineering-implementation-records-standard.md`
> **Last controlled update:** 2026-07-23 (pre-merge review correction — resolved the reopened-work-package/One-Record ambiguity via an explicit amendment procedure (§3.5, §6.4, §10.1 item 10); corrected the governance-logging requirement (§11 rule 3); added to the Engineering Governance section index. Previously, same day: `EIR-01` — created)

## 1. Purpose

This standard defines the **Engineering Implementation Record (EIR)** framework: a governed, permanent, human-readable historical record of how each engineering work package was actually built, reviewed, closed, merged, and administratively signed off.

It exists because the documents that already govern engineering work — the Engineering Implementation Programme, the Coding-Agent Prompt Register, the Master Workflow, individual Implementation Reports and Technical Reviews, and the append-only `IMPLEMENTATION_CHANGES.md` log — each answer a narrow question well, but none of them is designed to answer, in one place, per work package: *what actually happened, in what order, with what evidence, start to finish?* That is the gap this standard closes.

This is a **governance enhancement only**. It introduces a new class of document. It does not begin engineering implementation work, modify any work package, change any engineering status, or rewrite any existing repository or governance history. See §14 (Validation and Guarantees).

## 2. Scope

This standard governs:

- the **existence, format, lifecycle, and authority** of Engineering Implementation Records, Phase Engineering Records, and Version Engineering Records (§7);
- **when** a record is created, updated, approved, and locked (§8, §11);
- **who** may create, update, approve, and lock a record (§9);
- the **mandatory content** every record level must contain (§10);
- the **future repository structure** these records will live in (§12) and the **future Engineering History Index** that will list them (§13) — specified here, not created here (§1, §16).

This standard does **not** govern the content of any existing document (Constitution, PRD, TRD, Decision Register, Master Workflow, Engineering Implementation Programme, Coding-Agent Prompt Register, Technical Review Standard, Definition of Done, Git Workflow, or any Implementation Report). It only governs the new record layer that summarizes and points to them.

## 3. Constitutional Principles

These principles are binding on every Engineering Implementation Record, Phase Engineering Record, and Version Engineering Record, and on every future revision of this standard.

### 3.1 Historical Record Principle

Engineering Implementation Records preserve implementation history. They summarize implementation. They **never** replace an authoritative document. If a record and an authoritative document ever appear to disagree, the authoritative document is correct and the record is defective — the record is corrected (per §11.4) or superseded (per §8.3), never the other way around.

### 3.2 Authority Principle

Authority for *what is true* remains, in full, with the existing hierarchy:

- Platform Constitution
- Product Requirements Document (PRD)
- Technical Requirements Document (TRD)
- Decision Register
- Master Workflow (for current phase, position, and sequencing)
- Engineering Implementation Programme (for the full work-package inventory and per-phase technical detail)
- Technical Review Standard / individual Technical Reviews (for review verdicts)
- Definition of Done (for completion criteria)
- Git history (for what was actually committed, pushed, merged, and when)

An Engineering Implementation Record always defers to these documents. It never overrides, restates as authoritative, or is cited *instead of* one of them. Every factual claim in a record that duplicates something these documents already establish must cite the document, not merely repeat the claim.

### 3.3 Story Principle

Governance answers **"what is true?"** Engineering Implementation Records answer **"how did implementation happen?"** These are different questions with different documents. A reader who needs to know the current authoritative status of a decision, a requirement, or a work package's position in the sequence goes to governance. A reader who wants to understand the sequence of events, corrections, and evidence that got a work package from `Ready` to closed goes to its Engineering Implementation Record.

### 3.4 Immutability Principle

Once a record reaches `Administratively Closed` (§6.3), it is **locked**: every section written up to that point is never rewritten, and no locked content is ever edited to reflect later events. "Locked" governs the record's *existing* content, not whether the record can ever receive anything further — see §3.5 and §6.4 for the one narrow, explicitly-defined exception (a reopened work package's amendment), which is an **append**, never a rewrite. Outside that one exception, if circumstances change after a record is locked — a new, distinct work package begins as follow-up, or a phase/version-level event occurs — that new information is captured in a **new** record (a new EIR for a genuinely new work package, or a dated entry in the relevant, still-unlocked Phase or Version Engineering Record per §11.1) — never by rewriting a locked EIR's existing content. This mirrors standard accounting practice: you do not edit a closed ledger entry, you post a new one — except that a locked EIR's *own* work package, specifically, uses the amendment mechanism (§3.5, §6.4) rather than a second ledger, because §3.5 requires exactly one EIR to exist for that work package's entire life, including any reopening.

### 3.5 One Record Principle

Exactly one Engineering Implementation Record exists per engineering work package, **for the entire life of that work package, including if it is later reopened.** There is no "Part A" / "Part B" splitting, no second or sub-record, and no new EIR created for the same work package ID under any circumstance. If a work package's closure spans multiple tasks, sessions, corrections, or pull requests (as is common — see §10.1), all of that activity is recorded **within the single EIR for that work package**, as a chronological sequence of dated entries, not as separate records.

**Reopening a work package after its EIR is locked** (§6.4) does not create an exception to this principle and does not create a new EIR. It is recorded as an **Amendment** — a new, clearly dated entry appended to the *end* of the existing, already-locked EIR, under its own "Amendment History" section (§10.1 item 10). An amendment never edits, removes, or renumbers any section the EIR already contained before the amendment was added (§3.4) — it only adds new content, precisely the same append-only discipline §11.1 already permits for Phase and Version Engineering Records. If the reopened work genuinely constitutes a **new**, distinct work package with its own new ID (a Programme-level decision, outside this standard's authority — see §3.2), that new work package gets its own new EIR under this same principle; the original EIR is not touched. The distinction is always the work-package ID: same ID, same EIR (amended); new ID, new EIR.

### 3.6 Hierarchy Principle

Exactly three governed record levels exist, and no others:

1. **Engineering Implementation Record (EIR)** — one per work package (e.g. `ENG-P1-001`).
2. **Phase Engineering Record (PER)** — one per programme phase (e.g. Phase 1), summarizing and linking every EIR within that phase.
3. **Version Engineering Record (VER)** — one per platform version (e.g. Version 1), summarizing and linking every Phase Engineering Record within that version.

No sub-levels, no parallel hierarchies, and no per-task or per-correction records are introduced beneath the EIR level — corrections and follow-up tasks are entries *within* the relevant EIR (§3.5), not new documents.

## 4. Audience

- **The Founder** — the primary reader seeking "how did we get here" context on a specific work package, phase, or version, and the sole approval authority for locking a record (§9).
- **The ChatGPT Technical Lead** — uses records as historical context when scoping new work packages, without needing to re-derive history from raw git log and prior report files.
- **Coding agents** — read records for context on how prior, related work packages were actually closed (patterns, corrections, known risks); never treat a record as authority for current status (§3.2) and never write to a locked record (§3.4).
- **Future engineering contributors** — the intended long-term audience: anyone joining the project later who needs the real story of how the platform was built, not just its current state.

## 5. Relationship to Existing Governance

This section distinguishes Engineering Implementation Records from every document they might be confused with. It is deliberately explicit, because the boundary is the entire point of this standard.

| Document | Answers | Engineering Implementation Records relationship |
|---|---|---|
| **Implementation Report, Technical Review, and other per-task reports** (`docs/05-implementation/reports/`) | What did *this specific task* do, and did it pass review? | Reports are **primary source evidence**, written once, at the time of the work, never edited afterward. An EIR is written *after* a work package closes and **references** the reports that make it up — it summarizes and links them, it does not replace, duplicate, or supersede any report's content. Reports keep existing exactly as they do today; this standard adds nothing to how they are written. |
| **Master Workflow** | What is the *current* phase, work package, blocker, and next authorized action, right now? | The Master Workflow is forward-looking and always-current; it is overwritten in place as the programme advances (its own change-control procedure). An EIR is backward-looking and, once locked, permanent. The Master Workflow may cite an EIR as supporting evidence for a status transition; an EIR never dictates a Master Workflow status. |
| **Engineering Implementation Programme** | What is the full inventory of every planned work package, its requirements, its technical profile, and its current status field? | The Programme is the authoritative, living tracker — its status column is truth. An EIR narrates the *history* behind one row of that tracker once the work is done. The Programme is never derived from an EIR; an EIR is written from the Programme (and the reports, PRs, and CI evidence the Programme's row already links to). |
| **Coding-Agent Prompt Register** | What is the flat, scannable, current status of every prompt? | Same relationship as the Programme: current-status authority stays with the Register; the EIR is the narrative history once a row's status reaches closure. |
| **Decision Register** | What was formally decided, and what is its current status (`CONFIRMED`, `OPEN_*`, `SUPERSEDED`)? | An EIR may narrate *that* a decision was confirmed and *when it mattered* to the work package's story, but the Decision Register alone is authoritative for a decision's text, status, and history. An EIR never restates a decision's substantive content as though the EIR were the source. |
| **`IMPLEMENTATION_CHANGES.md`** | An append-only, chronological log of every documentation and implementation change, in the order it happened, across the whole programme. | The changes log is the *raw, unfiltered* event stream — every task, every correction, across every work package and every governance-programme thread, interleaved. An EIR is the *curated, work-package-scoped* narrative distilled from that stream for one specific work package. The changes log remains append-only and continues exactly as today; an EIR draws from it, never replaces it. |
| **Git history** | What was actually committed, when, by whom, and what does the code look like at any point in time? | Git is the ground truth for code and commit facts. An EIR cites commit SHAs, PR numbers, and CI run IDs; it never restates a diff or claims an outcome git itself does not support. |
| **Definition of Done** | What criteria must be satisfied for a work package to be done? | The DoD defines the finish line. An EIR records *how and when* each criterion was actually satisfied for a specific work package, citing the same evidence the DoD reconciliation used — it does not redefine or loosen any criterion. |
| **Technical Review Standard** | What does a Technical Review verdict require, and how is it produced? | Unchanged. An EIR references the verdict and the review document; it does not perform review and cannot substitute for one. |

**In one sentence:** every other document in this list is either always-current (Master Workflow, Programme, Register, Decision Register) or a point-in-time primary source written once and never touched again (reports, changes-log entries, git commits). An Engineering Implementation Record is neither — it is a **secondary, curated synthesis**, written after the fact, from those primary sources, for one work package, and then itself locked once approved.

## 6. Lifecycle

Every Engineering Implementation Record moves through exactly three states, in order, never skipping or reversing:

```
Engineering Complete
        ↓
    Recorded
        ↓
Administratively Closed
```

### 6.1 Engineering Complete

The underlying engineering work itself has reached `Complete` per the Definition of Done: code finished, required tests passed, Technical Review approved, all applicable Definition-of-Done criteria satisfied (including, where required, the Founder's own pull and Preview Review — see the Git Workflow and Definition of Done). This state is reached and recorded entirely within the *existing* governance framework (Programme, Register, Master Workflow) — no Engineering Implementation Record exists yet at this point, and none is required for the underlying work package to legitimately be `Complete`.

### 6.2 Recorded

An Engineering Implementation Record has been written for the work package: its mandatory content (§10.1) is filled in, every primary-source reference (reports, commits, PR numbers, CI run IDs) is cited and verifiable, and the record accurately narrates the work package's actual history end to end. The record exists as a draft at this point — it has been written, not yet approved.

### 6.3 Administratively Closed

The Founder has reviewed and approved the record (§9.2), and it is **locked** (§3.4, §11.4). Once a record reaches this state, the underlying work package's engineering lifecycle and its historical documentation are both considered fully and finally closed. Only after a record is `Administratively Closed` does the programme sequencing document (Master Workflow, Programme) treat that work package's *record* as complete — this is distinct from, and always later than, the work package's own `Complete` engineering status.

A record that has not reached `Administratively Closed` is not authoritative for anything and carries no weight beyond being a work-in-progress draft.

### 6.4 Reopening (Amendment Procedure)

This is not a fourth lifecycle state — the three-state model in §6 is exhaustive and unchanged. Reopening is a **bounded, explicitly-defined exception** that applies only when the *same* work package (§3.5) is formally reopened after its EIR already reached `Administratively Closed`:

1. The reopening is authorized the same way any engineering work is authorized (a new task/prompt against the existing work-package ID, per the Master Workflow and Implementation Prompt Standard) — this standard does not create new authority to reopen work; it only defines how the *record* reflects a reopening that governance has already authorized elsewhere.
2. A new, dated **Amendment** entry is appended to the work package's existing EIR — under its "Amendment History" section (§10.1 item 10) — describing what changed, why, and citing the same class of primary-source evidence (reports, commits, CI runs) every other EIR entry cites (§10.1 item 3).
3. The amendment follows the same approval workflow as the original record (§9): drafted, then approved and re-locked by the Founder (§9.2) before the EIR is considered closed again.
4. The EIR's pre-existing content — everything written before the amendment — is never edited, reordered, or removed (§3.4). The record's lifecycle state remains `Administratively Closed` before, during (as a draft amendment), and after the amendment is itself approved; there is no separate "Reopened" status shown anywhere the work package's status is tracked (Programme, Prompt Register, Master Workflow) unless the reopened *engineering* work itself changes that work package's status through the existing, unrelated governance channels — this standard does not do that.

## 7. Record Hierarchy

### 7.1 Engineering Implementation Record (EIR)

One per engineering work package (e.g. `EIR-ENG-P1-001`). The unit of record closest to the actual work — implementation, review, corrections, infrastructure evidence, commit/push/merge history, and Founder sign-off, all for exactly one work package (§3.5).

### 7.2 Phase Engineering Record (PER)

One per programme phase (e.g. the Phase 1 Engineering Record). Summarizes and links every EIR within that phase, in work-package order, showing at a glance which work packages in the phase are Engineering Complete, Recorded, or Administratively Closed, and which remain not yet started. Grows incrementally as each work package in the phase closes. Locked only when the *entire phase* closes (its own exit criteria satisfied — see the Master Workflow and Engineering Implementation Programme's phase-exit gates).

### 7.3 Version Engineering Record (VER)

One per platform version (e.g. the Version 1 Engineering Record). Summarizes and links every Phase Engineering Record within that version. Locked only when the version itself is complete.

No level below EIR (no per-task or per-correction record) and no level above VER exists (§3.6).

## 8. Authority and Ownership

- **Content authority:** the coding agent (or Founder, for hand-authored entries) that performs the work drafts the corresponding EIR entries; the Founder holds final approval authority (§9.2).
- **No independent authority:** an Engineering Implementation Record, Phase Engineering Record, or Version Engineering Record never itself grants permission for any action (deployment, decision resolution, status change, or further implementation). Authority for those actions comes only from the documents listed in §3.2/§5.
- **Ownership after locking:** a locked record is owned by the historical record itself — no person or agent "owns" it for future editing, because §3.4 forbids future editing. Ownership of the *EIR framework* (this standard, templates, index maintenance) rests with Engineering Governance, exactly as every other document in `docs/06-engineering-governance/` (§8 of the Engineering Governance Charter).

## 9. Approval Workflow

### 9.1 Drafting

A record enters the `Recorded` state (§6.2) when its author (typically the coding agent that closed the work package, or drafted the Phase/Version summary) has completed its mandatory content (§10) and verified every citation against the actual, current state of the referenced documents, commits, and CI runs — not from memory or an earlier report's claim.

### 9.2 Approval

Only the Founder may move a record from `Recorded` to `Administratively Closed`. This mirrors the Founder's existing, exclusive authority to merge (Git Workflow) and to approve Definition-of-Done completion (Definition of Done). A coding agent may draft, propose, and request approval of a record; it may never self-approve one.

### 9.3 Rejection or Correction Before Locking

If the Founder finds an error in a `Recorded`-state (not yet locked) record, it is corrected in place — this is the only point in a record's life where in-place editing is permitted, because it has not yet been locked. Once approved and locked, correction follows §3.4/§11.4 instead (a new record, never an edit).

## 10. Mandatory Content

This section defines *what every record of each level must contain*. It does not define a template's exact formatting (that is a future, separate artifact — see §16); it defines the substance every record must have regardless of how it is formatted.

### 10.1 Engineering Implementation Record — mandatory sections

1. **Identity** — work-package ID, title, phase, version, current lifecycle state (§6).
2. **Summary** — a short, plain-language account of what the work package delivered.
3. **Timeline** — every dated task/session that touched this work package, in order (implementation, review, corrections, infrastructure work, merge, closure), each citing its primary source (report file, commit SHA, PR number, CI run ID) rather than restating its content.
4. **Evidence Index** — a consolidated list of links to every Implementation Report, Technical Review, closure report, PR, and CI run referenced in the Timeline, so a reader does not have to extract them one by one.
5. **Decisions Referenced** — every Decision Register ID this work package depended on, with a citation to the Decision Register (never a restatement of the decision's substantive text).
6. **Definition of Done Outcome** — the final per-criterion result (citing the actual DoD reconciliation that produced it), and the date `Complete` was reached.
7. **Deviations and Corrections** — any defect found and fixed, any scope correction, any finding from Technical Review or later review, each dated and cited to its source.
8. **Final Status and Closure** — the work package's final engineering status, the record's own lifecycle state, who approved closure and when.
9. **Risks and Follow-Up** — any disclosed, still-open risk or deferred item the work package's own reports identified, carried forward for visibility (not re-litigated).
10. **Amendment History** — present in every EIR from creation (typically empty). Holds zero or more dated Amendment entries, appended only per the Reopening procedure (§6.4, §3.5), each citing what changed, why, and its primary-source evidence. Never contains anything before the EIR's first approval; never edits any other section.

### 10.2 Phase Engineering Record — mandatory sections

1. **Identity** — phase number and name, version, current lifecycle state.
2. **Work-Package Index** — every work package in the phase, its current status (per the Programme/Register — cited, not restated), and a direct link to its EIR where one exists yet.
3. **Phase Narrative** — a short account of how the phase progressed as a whole (major sequencing events, blockers resolved, order work packages actually closed in, as distinct from the order originally planned).
4. **Phase Exit Criteria Outcome** — once the phase closes: citation to where exit criteria were verified satisfied (Master Workflow / Programme phase-exit gate), and the date.
5. **Risks and Follow-Up carried from constituent EIRs** — a rolled-up view, not a re-derivation.

### 10.3 Version Engineering Record — mandatory sections

1. **Identity** — version number, current lifecycle state.
2. **Phase Index** — every phase in the version, its current status, and a direct link to its Phase Engineering Record.
3. **Version Narrative** — a short account of the version's overall implementation story.
4. **Version Exit Criteria Outcome** — once the version closes: citation to where completion was verified, and the date.

## 11. Maintenance Rules

1. A record may be updated only while in the `Recorded` state (draft) or, for Phase/Version Engineering Records specifically, by **appending** a new dated entry as constituent EIRs close — this is additive growth, not rewriting prior content, and is explicitly permitted by §6.2/§7.2/§7.3 without contradicting §3.4 (immutability applies to *locking*, not to a Phase/Version record's natural, append-only growth while it remains unlocked).
2. An EIR itself, once its own work package reaches final closure and the EIR is approved, is locked in full (§6.3): every section written up to that point is fixed and never rewritten. The one narrow, defined exception is the Reopening/Amendment procedure (§6.4, §3.5, §10.1 item 10) — an append-only addition triggered only when the *same* work package is formally reopened, never a rewrite of prior content and never a new EIR for that work package.
3. Every edit to any not-yet-locked record, and every amendment appended to a locked EIR under §6.4, is itself logged as an entry in `docs/00-governance/documentation-changes-log.md`, per the [Documentation Index](../README.md) §6 Rule 1 and the Engineering Governance Charter §8 — classified per the standard taxonomy (Editorial / Normalization / Clarification / Decision Required / Material Change). Where the same edit is also part of an active engineering task's own tracked history, it may additionally be noted in `IMPLEMENTATION_CHANGES.md`, but that append-only implementation log is never a substitute for the Documentation Changes Log entry this rule requires.
4. Locked records are never edited outside the §6.4 amendment procedure. If a locked record is found to contain a genuine defect in its own writing (not a reopened work package — see the distinction in §6.4) — a factual error, a broken citation — the correction is documented in a dated addendum entry in the relevant *unlocked* parent (Phase/Version) record, or, if no such parent exists or is appropriate, in the Documentation Changes Log entry that discovers it, with an explicit note identifying which locked record it corrects and why. The locked record's own text is never touched by this kind of correction either — this rule governs errors in the record's writing, not reopened engineering work, which uses §6.4 instead.
5. No record may resolve a Decision Register entry, change a Master Workflow position, or change a work package's Programme/Register status as a side effect of being written, amended, or approved. Records report status; they do not set it (§3.2).

## 12. Repository Structure (specification only)

This section specifies the structure Engineering Implementation Records will occupy once created. **No folder, file, or template described here is created by this task** (§1, §16).

```
records/
├── README.md                          — index and orientation for the records/ directory
├── templates/
│   ├── engineering-implementation-record-template.md
│   ├── phase-engineering-record-template.md
│   └── version-engineering-record-template.md
├── history-index.md                   — the Engineering History Index (§13)
├── version-1/
│   ├── version-1-engineering-record.md
│   ├── phase-0/
│   │   ├── phase-0-engineering-record.md
│   │   ├── ENG-P0-001.md
│   │   └── ENG-P0-002.md
│   ├── phase-1/
│   │   ├── phase-1-engineering-record.md
│   │   ├── ENG-P1-001.md
│   │   ├── ENG-P1-002.md
│   │   └── ENG-P1-003.md
│   └── ... (one folder per phase, created as each phase begins producing records)
```

Placement rationale: `records/` sits at the repository root, alongside `docs/`, because it is a distinct artifact class (historical record) from `docs/` (current governance and product truth) — consistent with the Story Principle (§3.3). The exact top-level placement and folder-per-phase structure is confirmed, not re-derived, at implementation time (a future task — §16).

## 13. Engineering History Index (specification only)

**Purpose:** a single, permanent table of contents for every Engineering Implementation Record, Phase Engineering Record, and Version Engineering Record that exists, organized by version and phase, so a reader can find any work package's history in one place without searching. Illustrative shape:

```
Engineering History

Version 1
  Phase 0
    ✓ ENG-P0-001
    ✓ ENG-P0-002
  Phase 1
    ✓ ENG-P1-001
    ○ ENG-P1-002 (Ready)
    □ ENG-P1-003 (Blocked)
```

Each entry links directly to its Engineering Implementation Record. A phase or version heading links to its own Phase/Version Engineering Record once one exists. This index itself is **not** an authoritative status source (§3.2) — its checkmarks are a reading aid summarizing what the Programme/Register/Master Workflow already state; if the index and those documents ever disagree, the index is corrected to match them, never the reverse.

**No implementation of this index is performed by this task** — its content model, location (`records/history-index.md`, §12), and update trigger (whenever a record's lifecycle state changes) are specified here for a future task to build.

## 14. Validation and Guarantees

This standard, by itself, changes nothing about the current state of the engineering programme. Specifically, creating this standard:

- does **not** change any existing governance document's authority or content (§3.2, §5);
- does **not** begin any engineering implementation work;
- does **not** change any work package's engineering status in the Programme, Prompt Register, or Master Workflow;
- does **not** change programme sequencing or the next authorized action recorded in the Master Workflow;
- does **not** create any repository folder, template, or actual record (§1, §12, §13, §16);
- does **not** resolve, modify, or touch any Decision Register entry.

## 15. Relationship to This Task's Governing Task Brief

This document satisfies `EIR-01`. The three follow-on tasks it anticipates and does not perform are, in order: `EIR-02` (create the `records/` repository structure, README, templates, and history index; update the Documentation Index, Manifest, Master Workflow, and Engineering Governance index to reference this new section), `EIR-03` (backfill `EIR-ENG-P1-001` from the now-closed work package), and `EIR-04` (create the Phase 1 Engineering Record). None of those three is performed here.

## 16. Relationship to Existing Engineering Governance

This document is filed in `docs/06-engineering-governance/` and is governed by the [Engineering Governance Charter](engineering-governance-charter.md), exactly like every sibling document in that section (§9 of the Charter). It is subject to the Charter's Absolute Constraints (§7 of the Charter): it does not modify product requirements, the Decision Register, or existing TRD/PRD/Constitution content, and it is not a channel for a coding agent to bypass a TRD22 §22.40 stop condition. See [`README.md`](README.md) for this section's full document index — updating that index to include this document is part of `EIR-02`, not this task.
