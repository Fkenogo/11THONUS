# Engineering Implementation Records — Section Index

> **Title:** Engineering Implementation Records — Section Index
> **Version:** 1.0 · **Status:** Active governance process · **Classification:** Working (governance process) — **non-authoritative, historical**
> **Governing document:** [Engineering Implementation Records Standard](../docs/06-engineering-governance/engineering-implementation-records-standard.md)
> **Source-of-truth path:** `records/README.md`
> **Created:** `EIR-02` (repository integration), 2026-07-24

## Purpose

This directory preserves the **history** of how the 11thONUS platform was actually built: what happened, in what order, with what evidence, for each engineering work package, programme phase, and platform version. It exists so that a future reader — the Founder, the ChatGPT Technical Lead, a coding agent, or a future engineering contributor — can find the real story of a piece of work without re-deriving it from raw commits, scattered reports, and interleaved change logs.

Everything in this directory is governed in full by the **[Engineering Implementation Records Standard](../docs/06-engineering-governance/engineering-implementation-records-standard.md)**. This README orients a reader to the directory; it does not restate the standard. Where anything here and the standard appear to disagree, the standard governs and this README is corrected.

## Records are non-authoritative

**No record in this directory ever overrides, restates as authoritative, or may be cited instead of** the Platform Constitution, the PRD, the TRD, the Decision Register, the Master Workflow, the Engineering Implementation Programme, the Coding-Agent Prompt Register, a Technical Review, the Definition of Done, or Git history itself. A record summarizes and links to that evidence — it never becomes the evidence. If a record and one of those documents ever disagree, the document is correct and the record is defective (Historical Record Principle and Authority Principle — standard §3.1–3.2).

## The three record levels

Exactly three levels exist, and no others (standard §3.6, §7):

1. **Engineering Implementation Record (EIR)** — one per engineering work package (e.g. `EIR-ENG-P1-001`), filed under `version-<N>/phase-<N>/<work-package-id>.md`.
2. **Phase Engineering Record (PER)** — one per programme phase, summarizing and linking every EIR in that phase, filed under `version-<N>/phase-<N>/phase-<N>-engineering-record.md`.
3. **Version Engineering Record (VER)** — one per platform version, summarizing and linking every Phase Engineering Record in that version, filed under `version-<N>/version-<N>-engineering-record.md`.

No sub-levels and no per-task or per-correction records exist beneath the EIR level — corrections and follow-up tasks are dated entries **within** the relevant EIR's Timeline (standard §3.5, §10.1).

## One record per work package

Exactly one EIR exists for a work package **for its entire life, including if it is later reopened.** There is never a "Part A"/"Part B" split, a second record, or a sub-record for the same work-package ID. If a work package's closure spans many tasks, sessions, corrections, or pull requests, all of that is one EIR's chronological Timeline, not separate records (standard §3.5).

If a work package is reopened after its EIR has already been locked (`Administratively Closed`), the reopening is recorded as a dated **Amendment** appended to that same, already-existing EIR's Amendment History section — never as a new EIR, a Part A/Part B split, or a sub-record (standard §3.5, §6.4).

## Lifecycle

Every EIR moves through exactly three states, in order, never skipping or reversing (standard §6):

```
Engineering Complete
        ↓
    Recorded
        ↓
Administratively Closed
```

- **Engineering Complete** — the underlying work package itself reached `Complete` per the Definition of Done. No EIR exists yet at this point, and none is required for the work package to legitimately be `Complete`.
- **Recorded** — an EIR has been drafted: its mandatory content is filled in and every citation verified against the current state of the documents, commits, and CI runs it references. It is a work-in-progress draft, not yet approved.
- **Administratively Closed** — the Founder has reviewed and approved the record, and it is **locked**: everything written up to that point is fixed and never rewritten (the one narrow, defined exception being the Reopening/Amendment procedure above).

A record that has not reached `Administratively Closed` is not authoritative for anything and carries no weight beyond being a draft.

## Reports are not records

An **Implementation Report** or **Technical Review** (`docs/05-implementation/reports/`) is a primary-source document, written once, at the time a specific task happened, and never edited afterward. An **Engineering Implementation Record** is written _after_ a work package closes and **references** the reports that make it up — it summarizes and links them, it never replaces, duplicates, or supersedes a report's own content (standard §5).

## Relationship to the Engineering History Index

**[`history-index.md`](history-index.md)** is the single table of contents for every record that exists in this directory, organized by version and phase. It is itself governed by the same non-authority rule as every record: it is a reading aid, never a status source. See that file for the current index.

## Naming conventions

Filenames follow the Engineering Implementation Records Standard §12 exactly:

| Level | Record identifier (example)  | Filename                          | Location                                          |
| ----- | ---------------------------- | --------------------------------- | ------------------------------------------------- |
| EIR   | `EIR-ENG-P1-001`             | `ENG-P1-001.md`                   | `version-1/phase-1/ENG-P1-001.md`                 |
| PER   | Phase 1 Engineering Record   | `phase-1-engineering-record.md`   | `version-1/phase-1/phase-1-engineering-record.md` |
| VER   | Version 1 Engineering Record | `version-1-engineering-record.md` | `version-1/version-1-engineering-record.md`       |

## Templates

Every record is drafted from its governed template — never freehand — so that the mandatory content (standard §10) is never accidentally omitted:

- [Engineering Implementation Record template](templates/engineering-implementation-record-template.md)
- [Phase Engineering Record template](templates/phase-engineering-record-template.md)
- [Version Engineering Record template](templates/version-engineering-record-template.md)

## What exists today

As of `EIR-02` (2026-07-24), this directory contains only its own scaffolding — this README, the templates, and the Engineering History Index. **No populated Engineering Implementation Record, Phase Engineering Record, or Version Engineering Record exists yet.** `version-1/` and its phase folders are not created until the first record that belongs in them is actually drafted, per the standard's own repository-structure specification (standard §12) and to avoid empty, unpopulated folders. The first populated record — backfilling `EIR-ENG-P1-001` from the now-closed `ENG-P1-001` work package — is `EIR-03`, a separately authorized future task. This task does not perform it.

## Approval authority

Only the Founder may move a record from `Recorded` to `Administratively Closed` (standard §9.2). A coding agent may draft, propose, and request approval of a record; it may never self-approve one, and it never writes to a record that is already locked outside the Reopening/Amendment procedure (standard §3.4, §6.4).
