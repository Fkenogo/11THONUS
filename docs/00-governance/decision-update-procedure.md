# 11thONUS Decision Update Procedure

> **Title:** Decision Update Procedure
> **Version:** 1.0 · **Status:** Active controlled procedure · **Classification:** Working (governance process)
> **Governing document:** Decision Governance Workflow (`decision-governance-workflow.md`)
> **Source-of-truth path:** `docs/00-governance/decision-update-procedure.md`
> **Last controlled update:** 2026-07-16 (Phase 3A — created)

The exact, repeatable steps for processing a founder (or owner) decision. One pass of this procedure = one change set = one changes-log entry. Steps must run **in this order**; stopping midway leaves a note in the register record's *Notes* field.

---

## Step 1 — Capture the approval

1.1 Receive the owner's explicit written choice (chat, email, signed note). If it references an agenda item (e.g. "B1: a"), resolve it to the DEC ID.
1.2 If the choice is an **unlisted option**, add it to *Options identified* first (marked "added at approval").
1.3 If anything about the instruction is ambiguous (which option, which scope, conditions), **stop and ask** — never interpret.

## Step 2 — Update the Decision Register (`docs/00-governance/decisions/decision-register.md`)

2.1 In the record: fill **Final decision** (quote or faithful paraphrase of the instruction, including any conditions), **Decision date** (date of the instruction), **Approved by** (owner's name).
2.2 Change **Status** to `CONFIRMED` (or `REJECTED` if the owner refused the question outright — record the reasoning).
2.3 If the decision supersedes an earlier record, set that record to `SUPERSEDED` with a "Superseded by …" reference (never edit the old record's substance).
2.4 Update the **§5 Register Summary** counts.
2.5 Update the register's *Last controlled update* date (version unchanged unless structure changed — workflow §4).

## Step 3 — Confirm back before propagation

3.1 Show the owner the recorded *Final decision* text and the list of document corrections about to be made (from *Document corrections required*).
3.2 Proceed only on confirmation. (For trivial single-file corrections this may be combined with Step 1 in the same conversation.)

## Step 4 — Update the affected documents

4.1 Execute exactly the corrections in *Document corrections required* — nothing more. Classify each edit (Editorial / Normalization / Clarification / Decision-driven correction / Material).
4.2 Remove or update any `OPEN DECISION` / editorial-note markers that pointed at this DEC ID (e.g., PRD0 §14.3 note for DEC-LOY-010).
4.3 **Constitution:** if (and only if) the record requires it, execute the amendment as its own sub-step per Constitution Part VI — versioned, documented — and mark it clearly in the changes-log entry.
4.4 Update the affected documents' metadata blocks (*Last controlled update* line) where a document's text changed.

## Step 5 — Update the Canonical Reference (`docs/00-governance/canonical-reference.md`)

5.1 Replace the matching OPEN marker (if any) with the confirmed position + DEC ID.
5.2 Verify the reference still mirrors — never exceeds — the underlying documents.

## Step 6 — Update the Documentation Changes Log (`docs/00-governance/documentation-changes-log.md`)

6.1 Append one entry: date, decision ID(s) processed, quoted final decisions (short form), documents modified with classifications, any constitutional amendment flagged, who approved.
6.2 One entry may cover a whole answered batch (e.g. "Batch A decisions recorded") provided every touched file is listed.

## Step 7 — Update the Traceability Register *(from Phase 5 onward)*

7.1 Once the Requirements Traceability Register exists, link the DEC ID to every affected requirement row and update those rows' status.
7.2 Until Phase 5, skip this step — the register's *Affected documents* field carries the linkage.

## Step 8 — Downstream housekeeping

8.1 Update the founder agenda: mark the item answered (strike-through or ✅ with date) — do not delete it.
8.2 Update the phase tracker if the decision unblocks a phase (e.g., all Batch A answered → Phase 4 unblocked).
8.3 If the decision falsifies or validates an assumption, update the assumptions register; if it closes an external dependency, update that register's status and evidence location.

## Version numbering

- Register version: structural changes only (workflow §4).
- Document versions: unchanged for decision-driven corrections pre-freeze; the coordinated freeze publishes Version 1.0 of the suite; post-freeze changes follow TRD23 §23.39 (1.x compatible / 2.0 material).
- This procedure itself: version bumps require a changes-log entry stating why.

## Historical integrity rules

- Never delete or rewrite a superseded/rejected record; never blank an approval field once filled; never re-use a DEC ID.
- Corrections to a wrongly recorded decision (e.g., typo in *Final decision*) are made with a dated note in the record's *Notes* field — the original instruction remains quoted.

## Quick checklist (per decision)

☐ instruction captured verbatim → ☐ register fields filled + status flipped → ☐ summary counts updated → ☐ confirmed back → ☐ affected docs corrected (Constitution via Part VI only) → ☐ canonical reference synced → ☐ changes-log entry → ☐ (Phase 5+) traceability updated → ☐ agenda/tracker/assumption/dependency housekeeping
