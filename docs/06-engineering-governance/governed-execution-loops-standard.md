# Governed Execution Loops Standard

> **Title:** Governed Execution Loops Standard
> **Version:** 1.0 · **Status:** Active governance process · **Classification:** Working (governance process)
> **Governing document:** [Engineering Governance Charter](engineering-governance-charter.md)
> **Source-of-truth path:** `docs/06-engineering-governance/governed-execution-loops-standard.md`
> **Last controlled update:** 2026-07-24 (`GOV-GEL-001` — created)

## 1. Purpose and Scope

This standard defines the **Governed Execution Loop (GEL)** framework: the rules under which a coding agent (or any future AI contributor) may carry out a Founder-authorized objective across multiple internal steps — verification, drafting, validation, correction, commit, review resolution, and reporting — **without requiring a fresh Founder check-in after every individual step**, while remaining fully bounded by, and accountable to, the existing governance hierarchy.

**This is a governance enhancement only.** Creating this standard:

- does **not** authorize any engineering work or begin any execution loop;
- does **not** modify application code, technical decisions, or the authority hierarchy;
- does **not** create a loop template, a tracking file, or any example loop instance;
- does **not** relax, replace, or create an exception to any existing stop condition, review requirement, or approval gate.

**Scope.** This standard governs *how* an already-authorized objective may be executed continuously by an agent. It does not itself authorize anything — every Governed Execution Loop still requires its own, separately issued Founder authorization (an implementation prompt, a governance task brief, or an equivalent named instruction) exactly as every unit of work in this programme already does. GEL changes the *cadence of check-ins during execution*; it changes nothing about *who* authorizes work, *what* evidence is required, or *when* the agent must stop.

## 2. Governance Principles

Six principles govern every Governed Execution Loop. They are binding on this standard's own future revisions and on every loop executed under it.

### 2.1 Governance Before Autonomy

No loop begins by inferring its own scope. A loop's objective, boundaries, entry criteria, and exit criteria must already be fixed in a Founder-authorized task before execution starts (§8). Autonomy is granted *within* a governance boundary that is set first — never the reverse.

### 2.2 Objectives Over Tasks

A loop is authorized against an **objective** (a defined end-state — e.g. "PR #5 merged with all review findings resolved and governance trackers reconciled") rather than a fixed, pre-enumerated checklist of tasks. This is what allows the agent to adapt its concrete steps — investigate, correct, re-validate — as it discovers what the objective actually requires, without needing a new prompt for each discovery, provided every step stays inside the loop's boundaries (§8, §15).

### 2.3 Milestones Over Interruptions

Progress within a loop is marked by **checkpoints** (§11) — visible, non-blocking progress records — not by pausing execution to ask the Founder to confirm routine progress. A loop that stops to ask permission for something already inside its authorized boundary has failed to use the autonomy it was granted; a loop that proceeds past something outside its boundary has violated it. Getting this distinction right is the entire discipline this standard exists to codify.

### 2.4 Execution Should Only Stop for Decisions, Not Discussions

A loop stops only when continuing would require **someone else's authority** — a Founder decision, a Decision Register resolution, or a TRD22 §22.40 stop condition (§10). It never stops merely to narrate progress, ask for reassurance, or present a choice the agent is itself authorized and equipped to make. Where §2.3's milestone/interruption distinction is about *pacing*, this principle is about *what actually requires stopping* — a stop consumes Founder time and must be reserved for genuine decisions.

### 2.5 Bounded Autonomy

Every loop has a defined boundary: a fixed objective, a fixed set of files or repository areas it may touch, and a fixed exit condition. Autonomy exists only inside that boundary. A loop may never expand its own scope, redefine its own exit criteria, or continue past its exit condition on the theory that "more work would also be useful" — that is itself a new objective requiring new authorization (§8, §15).

### 2.6 Founder Authority Preservation

A Governed Execution Loop changes *how often* the Founder is asked to check in — it never changes *what* requires Founder (or Decision Register, or Technical Review) authority. Merge decisions, Decision Register resolutions, deployment, and Definition-of-Done sign-off remain exactly as governed today (§3, §14). A loop is a delegation of pacing, never a delegation of authority.

## 3. Authority Model

This standard sits at the same working tier as every other document in `docs/06-engineering-governance/`, governed by the [Engineering Governance Charter](engineering-governance-charter.md) and subject to its Absolute Constraints (Charter §7). It does not modify product requirements, the Decision Register, or existing TRD/PRD/Constitution content, and it is not a channel for bypassing a TRD22 §22.40 stop condition (Charter §7's final constraint, restated here because it is the single most important guardrail this standard depends on — see §10.1).

**A Governed Execution Loop carries no independent authority.** It never itself:

- authorizes engineering work — the underlying task/prompt does that, exactly as today;
- approves a Decision Register entry, a Technical Review, or a merge — those remain the Founder's and Technical Lead's exclusive authorities (§4);
- grants permission to skip a stop condition — §10.1 is absolute;
- changes the Constitution → PRD → TRD → Commerce Knowledge Standard → (Decision Register / Changes Log / Traceability Matrix / Engineering Governance) hierarchy (Constitution Part VII; [Documentation Index](../README.md) §1).

**Authority to *begin* a loop** rests with whoever already has authority to issue the underlying task: the Founder, or the ChatGPT Technical Lead acting on Founder-delegated scoping authority (per [Roles & Responsibilities](roles-and-responsibilities.md) §2). **Authority to *stop* a loop** rests with the Founder or the ChatGPT Technical Lead at any time, unconditionally, by simply instructing the agent to stop (§12) — no loop may refuse or defer a stop instruction.

## 4. Roles and Responsibilities

This section extends, and never contradicts, [Roles & Responsibilities](roles-and-responsibilities.md).

### Founder

- authorizes the objective, boundaries, entry criteria, and exit criteria a loop executes against (directly, or by approving a Technical-Lead-drafted task brief);
- may terminate any loop at any time (§12);
- remains the sole approver of merges, Decision Register entries, and deployment — a loop never substitutes for this (§3);
- reviews the loop's final report and evidence once it exits (§13).

### ChatGPT Technical Lead

- may draft a loop's task brief (objective, boundaries, entry/exit criteria) for Founder approval, exactly as it drafts any implementation prompt today ([Implementation Prompt Standard](implementation-prompt-standard.md));
- performs Technical Review of the loop's output exactly as for any other work package ([Technical Review Standard](technical-review-standard.md)) — a loop does not change what Technical Review checks;
- may instruct a running loop to stop (§12).

### Coding Agent (executing a loop)

- verifies the loop's entry criteria against live repository/GitHub state before executing anything (§8, mirroring the entry-gate discipline already established for `EIR-02` and the PR #3/PR #5 reconciliation task);
- executes toward the authorized objective, checkpointing at defined milestones (§11) without pausing for Founder input at each one;
- stops immediately and reports, without proceeding on an assumption, whenever a stop condition is met (§10) — this is unconditional and identical to the existing TRD22 §22.40 discipline every coding agent already operates under ([Coding Agent Standard](coding-agent-standard.md) §5);
- never expands the loop's boundary, never redefines its exit criteria, and never begins a second, unauthorized objective "while already in the loop";
- produces the same evidence (Implementation Report, changes-log entries, commit/PR/CI evidence) a non-looped work package would produce (§13) — a loop changes pacing, not evidentiary discipline.

### GitHub / CI (unchanged)

- as [Roles & Responsibilities](roles-and-responsibilities.md) already states: a system of record, not a decision-maker. A loop's commits, pushes, and CI runs are exactly as visible and exactly as gated as any other work — nothing about GEL operates outside normal Git Workflow visibility.

## 5. Execution Objectives

A loop is always defined by an **objective** — a Founder-authorized, verifiable end-state — never by an open-ended verbal intent (consistent with the [Coding Agent Standard](coding-agent-standard.md) §2's existing rule that an agent always operates against a specific, written work package). An objective must be stateable as: *"this loop is complete when [specific, checkable condition] is true."*

Good objectives are checkable without judgment calls: "PR #5 is merged, CI is green on the resulting `main`, and all review threads are resolved" is a valid objective. "Improve the documentation suite" is not — it has no checkable end-state and is exactly the kind of open-ended intent §2.1 and §2.5 exist to prevent.

A loop may be authorized with more than one objective (§6, Multi-Milestone Loop) provided each is independently checkable and all are stated up front — a loop never accumulates new objectives mid-execution.

## 6. Loop Types

Exactly three loop types are recognized. No other type may be introduced without a revision to this standard.

### 6.1 Single-Objective Loop

One Founder-authorized objective; the loop exits the moment that objective's exit criteria (§9) are met, or a stop condition (§10) is hit. Example shape: a single work package's implementation, validation, and reporting, or a single PR's review-finding resolution and merge.

### 6.2 Multi-Milestone Loop

Several sequential, pre-authorized objectives within one larger, already-bounded scope, where each objective's completion is itself a checkpoint (§11) for the next. Every milestone must already be enumerated in the loop's authorization — a loop may not discover and add a new milestone mid-execution (that would be a new objective, requiring new authorization, per §2.5). Example shape: "verify, then merge PR #3; then update, verify, and merge PR #5; then reconcile governance trackers" — a fixed, ordered sequence, each step's boundary and exit condition already fixed before execution began.

### 6.3 Maintenance / Reconciliation Loop

A bounded pass that restores consistency across already-existing, already-authorized governed content — correcting drift, resolving conflicts, or synchronizing trackers — without introducing new capability or new authorized scope. Its exit criterion is always "the identified inconsistency is resolved and validated," never open-ended improvement. Example shape: resolving a merge conflict between two already-authorized branches and re-synchronizing the trackers that reference them.

**No loop type authorizes indefinite, unbounded, or continuously-running execution.** Every loop, of every type, has a defined exit condition (§9) that is reachable in finite, foreseeable steps at the time of authorization — never "run until told to stop" alone, since Bounded Autonomy (§2.5) requires the boundary to be knowable in advance, not merely enforced after the fact.

## 7. Loop Lifecycle

Every Governed Execution Loop moves through the following states, in order:

```
Authorized
    ↓
Entry-Verified
    ↓
Executing  ⇄  Checkpointed (0 or more, non-blocking)
    ↓
Exited — Complete / Stopped / Terminated
```

### 7.1 Authorized

The objective(s), boundaries, entry criteria, and exit criteria are fixed in a Founder-approved task brief or equivalent instruction. No loop exists, and no repository action is taken, before this state.

### 7.2 Entry-Verified

The agent verifies the loop's entry criteria (§8) against the actual, live state of the repository and any relevant external system (GitHub, CI) — never assumed from a prior report or from memory. If any entry criterion fails, the loop does not begin; the agent stops and reports the blocker (§10), exactly as required for `EIR-02`'s and the PR #3/PR #5 reconciliation task's own entry gates.

### 7.3 Executing

The agent works toward the authorized objective(s). It checkpoints at defined milestones (§11) without pausing, and continuously evaluates whether a stop condition (§10) has been met. Execution and checkpointing are not separate phases — checkpoints happen *during* execution, non-blockingly.

### 7.4 Exited

A loop always exits in exactly one of three ways:

- **Complete** — every exit criterion (§9) is satisfied; the loop's final report (§13) is produced.
- **Stopped** — a stop condition (§10) was met; the agent reports the blocking issue and the decision required, and does not resume until the blocker is resolved through the appropriate governance channel.
- **Terminated** — the Founder or ChatGPT Technical Lead explicitly instructed the loop to stop before it reached Complete or Stopped on its own (§3, §12); the agent reports the loop's state at the point of termination.

A loop that reaches `Exited` never resumes as the same loop — resuming the same objective is a new `Authorized` state, even if nothing else about the objective changed. This mirrors the [Engineering Implementation Records Standard](engineering-implementation-records-standard.md)'s own discipline of a fixed, non-reopened lifecycle (§14).

## 8. Entry Criteria

A loop's `Entry-Verified` state (§7.2) requires, at minimum, verifying:

1. the objective(s), boundaries, entry criteria, and exit criteria are actually present in the authorizing task — not inferred;
2. the repository is in the state the authorization assumes (correct branch, correct baseline commit, no unexpected conflicting work) — mirroring the [Coding Agent Standard](coding-agent-standard.md) §5 stop condition 7 ("the repository is not in the expected state");
3. no other agent or process is currently modifying the same files or branches (Coding Agent Standard §5 stop condition 8);
4. any precondition the objective depends on (a merged PR, a resolved decision, a completed prior work package) is independently confirmed true against its live source, not assumed from a prior task's summary.

A loop-specific entry criterion may add to this minimum (e.g. "PR #4 must already be merged into `main`" was a real entry criterion for `EIR-02`) — but may never remove or weaken any of the four above.

## 9. Exit Criteria

Every loop's authorization must state exit criteria that are:

- **specific** — a fact that is either true or false, never a subjective judgment ("looks complete" is not an exit criterion; "CI run succeeds on the exact merge commit SHA" is);
- **verifiable against live state** — checked directly (a CI run's actual conclusion, a PR's actual merged state, a tracker's actual current text), never assumed;
- **complete before the loop's final report is written** — a loop's `Complete` state and its final report (§13) are reached together, never separately (a report is never written "assuming" a not-yet-verified exit criterion will hold).

A Single-Objective Loop (§6.1) has one exit-criteria set. A Multi-Milestone Loop (§6.2) has one exit-criteria set per milestone, plus one for the loop as a whole (all milestones complete). A Maintenance/Reconciliation Loop (§6.3) exits when the identified inconsistency is resolved and re-validated — never merely "changes made."

## 10. Stop Conditions

### 10.1 Absolute Stop Conditions (never overridden by this standard)

Every existing stop condition remains in full force, unmodified, inside a Governed Execution Loop. This standard **adds no exception to any of them**:

- the ten [Coding Agent Standard](coding-agent-standard.md) §5 conditions (cited from TRD22 §22.40) — ambiguous business behaviour, architecture contradiction, cross-domain impact, unclear security behaviour, unspecified production data migration, unavailable provider contract, unexpected repository state, concurrent modification, a wider architectural defect surfaced by tests, or a required bypass of an approved rule;
- the [Coding Agent Standard](coding-agent-standard.md) §6 governance-specific constraints — never create/edit/approve/resolve a Decision Register entry outside the Decision Governance Workflow, never change a requirement ID outside a formal ID-normalization phase, never edit archived/audit-evidence historical content, never introduce a new document classification tier or reorder the governance hierarchy without a Founder-approved decision;
- unresolved CI failure, unresolved review comments, or merge conflicts blocking the loop's own governing task (as required explicitly in, e.g., the `EIR-01` correction task and the PR #3/PR #5 reconciliation task);
- the Engineering Principles' (§4.6) rule that "silence is never approval" — an unanswered question is treated as unresolved, never as implicit permission to proceed.

### 10.2 Loop-Specific Stop Conditions

In addition to §10.1, a Governed Execution Loop stops when:

1. an entry criterion (§8) fails verification;
2. the objective, as actually encountered in the live repository, turns out to require something outside the loop's authorized boundary (a file, a decision, or an action not covered by the authorization) — the loop does not silently expand to cover it (§2.5);
3. an exit criterion cannot be met without an action requiring authority the loop does not have (e.g. a merge, when the loop was authorized only to prepare a PR for review);
4. the Founder or ChatGPT Technical Lead issues an explicit stop instruction (§3, §12) — honored immediately and unconditionally;
5. the live repository or GitHub state contradicts what the loop's authorization assumed (a branch already merged, a PR already closed, a file already changed by someone else) in a way the loop cannot safely reconcile on its own authority.

When any stop condition is met, the agent explains the blocking issue and identifies the decision required (Coding Agent Standard §5's existing rule) — it never proceeds on an assumption and never resolves the blocker itself if the blocker is a Founder or Decision Register matter.

## 11. Checkpoints

A **checkpoint** is a non-blocking, visible record that a loop has reached a defined point of progress. Checkpoints exist to make a loop's progress legible without interrupting it (§2.3).

A checkpoint:

- corresponds to something concrete and pre-anticipated in the loop's authorization — a milestone in a Multi-Milestone Loop (§6.2), or a natural sub-stage of a Single-Objective Loop (verification complete; drafting complete; validation complete; committed and pushed);
- is reported (e.g. a brief status update, a task-tracking update) but does **not** pause execution or wait for acknowledgment;
- never substitutes for a stop (§10) — if what the agent finds at a checkpoint actually requires Founder input, that is a stop, reported as such, not a checkpoint with a question attached.

A loop with no natural checkpoints (a small Single-Objective Loop) may report only at entry and exit — checkpoints are a tool for legibility on longer loops, not a mandatory minimum count.

## 12. Governance Supervision

A Governed Execution Loop remains supervised throughout, not merely at its start and end:

- **Unconditional external stop.** The Founder or ChatGPT Technical Lead may instruct a running loop to stop at any point, for any reason, and the loop must comply immediately — this is not itself a stop condition the agent evaluates; it is an instruction that overrides the loop's own continuation (§3).
- **No silent scope growth.** A loop's boundary is fixed at authorization (§7.1) and never expands during execution (§2.5) — any apparent need to expand it is itself a stop condition (§10.2 item 2).
- **Full visibility.** Every action a loop takes — commits, pushes, PRs, CI runs, review replies — happens through the same GitHub-visible channels as any other work (§4, GitHub/CI role). Nothing a loop does is invisible to the Founder between checkpoints; it is simply not narrated step-by-step.
- **No self-approval.** A loop never approves its own Technical Review, never merges its own PR without the same authorization any other merge requires, and never marks a Decision Register entry resolved — every existing approval gate applies to a loop's output exactly as to any other work (§3, §4).

## 13. Audit and Evidence Requirements

A Governed Execution Loop produces **exactly the same evidence** a non-looped work package or task produces — GEL changes pacing, never evidentiary discipline:

- an Implementation Report (or, for a governance task outside the `ENG-*` pattern, a Founder Completion Record, per the temporary format established during the PR #3/PR #5 reconciliation task) documenting entry verification, what was done, validation performed, and the final state;
- an append-only changes-log entry, per [Documentation Index](../README.md) §6 Rule 1 and Engineering Governance Charter §8;
- full commit, PR, and CI evidence, cited by exact SHA and run ID, exactly as every other task in this programme already requires;
- for an `ENG-*` work package specifically: once the underlying work reaches `Engineering Complete`, it becomes eligible for an Engineering Implementation Record exactly as any other work package (§14.7) — a loop does not get a separate record type of its own.

A loop's checkpoints (§11) are not a substitute for this final evidence — they are progress markers during execution; the audit trail is completed at exit, in full, regardless of loop type.

## 14. Relationship with Existing Governance

| Document | Relationship |
|---|---|
| **Platform Constitution** | GEL sits below the Constitution in the governance hierarchy (Part VII) and does not modify or reinterpret it. The Constitutional Four Questions and Engineering Principles §2 continue to apply to every decision made inside a loop exactly as outside one. |
| **Decision Register** | A loop never creates, edits, approves, or resolves a Decision Register entry (§3, §10.1) — an open decision encountered inside a loop is always a stop condition, never something the loop resolves on its own authority, exactly as for any coding agent today. |
| **Master Workflow** | The Master Workflow remains the sole authority for current phase, current work package, and the next authorized action ([Master Workflow](../05-implementation/11thonus-master-workflow.md) §4). A loop's objective must already be consistent with the Master Workflow's current position at authorization time (§7.1) — GEL does not grant authority to act outside the Master Workflow's current sequencing. |
| **Engineering Implementation Programme** | The Programme remains the authoritative work-package inventory and status tracker. A loop does not change a work package's status as a side effect of its own execution — status changes follow the same Definition of Done and tracking-update discipline as any other work (§13). |
| **Coding Agent Standard / Implementation Prompt Standard** | These remain the operative, unmodified contract for what an agent may do and how a work package must be structured. A Governed Execution Loop is not a different kind of agent or a different kind of prompt — it is the same agent, operating against the same kind of authorized work package, with the pacing rules this standard adds layered on top. Where this document says "Coding-Agent Prompt Standard," that refers to the same governed pair: the [Coding Agent Standard](coding-agent-standard.md) (what the agent may do) and the [Implementation Prompt Standard](implementation-prompt-standard.md) (how the work package authorizing it must be structured). |
| **Technical Reviews** | [Technical Review Standard](technical-review-standard.md) applies to a loop's output exactly as to any other work package's output — a loop does not skip, weaken, or self-perform Technical Review (§4, §12). |
| **Engineering Implementation Records** | The [Engineering Implementation Records Standard](engineering-implementation-records-standard.md) remains the sole framework for historical work-package records. A loop's work, once `Engineering Complete`, feeds an Engineering Implementation Record exactly as non-looped work does (§13) — GEL introduces no competing or parallel record type, and this task does not create, populate, or begin any Engineering Implementation Record. |

## 15. Constraints

Consistent with every prior Engineering Governance document, no Governed Execution Loop may:

- begin without a Founder-authorized objective, boundaries, entry criteria, and exit criteria already fixed (§7.1, §8);
- expand its own scope, redefine its own exit criteria, or continue past its exit condition (§2.5, §10.2);
- skip, weaken, or create an exception to any TRD22 §22.40 stop condition or any [Coding Agent Standard](coding-agent-standard.md) §6 governance-specific constraint (§10.1);
- approve its own Technical Review, merge its own pull request without the authorization any other merge requires, or resolve a Decision Register entry on its own authority (§12);
- run without producing the same audit evidence any other work package produces (§13);
- be authorized as open-ended or indefinite — every loop's exit condition must be knowable, in principle, at the time of authorization (§6, final paragraph).

This standard itself does not authorize any engineering work, does not modify application code, does not change any technical or product decision, and does not alter the governance authority hierarchy (§1, §3).

## 16. Examples

**These are illustrative only.** No example below was executed as a formally authorized Governed Execution Loop (this standard did not yet exist when they occurred) — they are cited because their actual execution pattern already matches, and directly informed, the framework defined above. No new loop is created, and no historical record is retroactively reclassified, by citing them.

**Single-Objective Loop shape:** `EIR-02`'s repository-integration task — one Founder-authorized objective ("integrate the approved `EIR-01` standard into the repository"), a fixed set of deliverables enumerated in advance, entry-gate verification before any file was touched, and a single exit condition (PR opened, CI green, not merged) reached in one continuous pass.

**Multi-Milestone Loop shape:** the PR #3 / PR #5 merge-order reconciliation task — five pre-enumerated parts (live verification; merge-order decision; merge PR #3; update and merge PR #5; produce the Founder Completion Pack), each a checkpoint for the next, executed continuously once the Founder authorized the corrections found in Part 1, without a new prompt between parts.

**Maintenance/Reconciliation Loop shape:** resolving the mechanical append-order conflict between `EIR-01`'s and PR #3's `IMPLEMENTATION_CHANGES.md` entries during that same reconciliation task — a bounded, single-purpose correction with a clear "resolved and validated" exit condition, touching only what the conflict itself required.

## 17. Glossary

- **Governed Execution Loop (GEL).** A Founder-authorized objective executed continuously by an agent across multiple internal steps, under the boundaries, checkpoints, and stop conditions this standard defines.
- **Objective.** A checkable, specific end-state a loop is authorized against (§5) — never an open-ended intent.
- **Boundary.** The fixed set of files, repository areas, and actions a loop is authorized to touch; fixed at authorization and never expanded during execution (§2.5).
- **Checkpoint.** A non-blocking, visible progress record reached during execution; never a substitute for a stop (§11).
- **Stop.** An unconditional halt, triggered by an absolute or loop-specific stop condition (§10) or an external instruction (§12), after which the agent reports the blocking issue and does not proceed without the appropriate authority resolving it.
- **Exit.** The end of a loop's `Executing` state, in exactly one of three forms: Complete, Stopped, or Terminated (§7.4).
- **Milestone.** A pre-enumerated, authorized sub-objective within a Multi-Milestone Loop (§6.2); each milestone's completion is a checkpoint for the next.
