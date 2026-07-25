# Engineering History Index

> **Title:** Engineering History Index
> **Version:** 1.0 · **Status:** Active governance process · **Classification:** Working (governance process) — **non-authoritative, historical navigation only**
> **Governing document:** [Engineering Implementation Records Standard](../docs/06-engineering-governance/engineering-implementation-records-standard.md) §13
> **Source-of-truth path:** `records/history-index.md`
> **Created:** `EIR-02` (repository integration), 2026-07-24
> **Last controlled update:** 2026-07-25 (EIR administrative closure — `ENG-P1-001` row's Record lifecycle state updated to `Administratively Closed`, per Founder approval). Previously: 2026-07-24 (`EIR-03`/`GEL-001` — `ENG-P1-001` row synchronized: record created, status corrected to the live `Complete` value)
> **Update trigger:** whenever a record's lifecycle state changes (standard §13) — not on a fixed schedule.

## Purpose

A single, permanent table of contents for every Engineering Implementation Record (EIR), Phase Engineering Record (PER), and Version Engineering Record (VER) that exists, organized by version and phase, so a reader can find any work package's history in one place without searching.

## Authority disclaimer

**This index is not an authoritative status source.** Its entries are a reading aid summarizing what the [Master Workflow](../docs/05-implementation/11thonus-master-workflow.md), the [Engineering Implementation Programme](../docs/05-implementation/change-tracking/engineering-implementation-programme.md), the [Coding-Agent Prompt Register](../docs/05-implementation/change-tracking/coding-agent-prompt-register.md), and the [Decision Register](../docs/00-governance/decisions/decision-register.md) already state. **If this index ever conflicts with any of those documents, those documents prevail and this index is corrected to match them — never the reverse** (Engineering Implementation Records Standard §3.2, §13).

The "Engineering status" column below is copied, as of the date noted, from the Engineering Implementation Programme and Coding-Agent Prompt Register on the `main` branch at the time this index was last updated. It is not re-derived or independently asserted. Consult those two documents directly for the current, live value.

## How to read this index

- **Record** — a direct link to the record, once one exists.
- Where no record exists yet, the entry reads **`Not yet created`** in plain text — deliberately not a link, so no broken link is ever introduced by this index (standard §13).
- **Record lifecycle state** — this record's own state (`Engineering Complete` / `Recorded` / `Administratively Closed`), distinct from and always later than the work package's own engineering status.

## Version 1

### Phase 0 — Repository and Delivery Foundation

Engineering status (per Programme, as of 2026-07-24): **Complete.**

| Work package | Engineering status | Record          | Record lifecycle state |
| ------------ | ------------------ | --------------- | ---------------------- |
| `ENG-P0-001` | Complete           | Not yet created | —                      |
| `ENG-P0-002` | Complete           | Not yet created | —                      |

**Phase 1 Engineering Record:** Not yet created.

### Phase 1 — Firebase and Shared Platform Foundation

Engineering status (per Programme/Register, as of 2026-07-24): **Partially Ready** — `ENG-P1-001` Complete, `ENG-P1-002` Ready (the [Master Workflow](../docs/05-implementation/11thonus-master-workflow.md) §8 EIR governance stream sequencing condition is satisfied — that stream reached `EIR-03` on 2026-07-24; `ENG-P1-002-PREP` itself remains its own, separately Founder-authorized task), `ENG-P1-003` Blocked.

| Work package | Engineering status | Record                                              | Record lifecycle state    |
| ------------ | ------------------ | --------------------------------------------------- | ------------------------- |
| `ENG-P1-001` | Complete           | [`EIR-ENG-P1-001`](version-1/phase-1/ENG-P1-001.md) | `Administratively Closed` |
| `ENG-P1-002` | Ready              | Not yet created                                     | —                         |
| `ENG-P1-003` | Blocked            | Not yet created                                     | —                         |

**Phase 1 Engineering Record:** Not yet created.

### Phases 2–16

All remaining TRD22 phases (Identity, Roles and Business Context through Production Launch) are **Blocked**, per the Engineering Implementation Programme, and no work package within them has started. No per-work-package rows are listed here to avoid duplicating the Programme's full 47-work-package inventory before any of that work exists to have a history — see the [Engineering Implementation Programme](../docs/05-implementation/change-tracking/engineering-implementation-programme.md) for the complete, current inventory and status of every phase and work package.

**Phase Engineering Records for Phases 2–16:** Not yet created.

### Version 1 Engineering Record

Not yet created.

## Future versions

No Version 2 (or later) scope has been authorized. No entry is created for a version that does not yet exist in the Engineering Implementation Programme.
