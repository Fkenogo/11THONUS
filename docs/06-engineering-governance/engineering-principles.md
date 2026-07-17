# Engineering Principles

> **Title:** Engineering Principles
> **Version:** 1.0 · **Status:** Active governance process · **Classification:** Working (governance process)
> **Governing document:** [Engineering Governance Charter](engineering-governance-charter.md)
> **Source-of-truth path:** `docs/06-engineering-governance/engineering-principles.md`
> **Last controlled update:** 2026-07-16 (Phase 6 — created)

## 1. Purpose

Rules cannot anticipate every situation a coding agent or reviewer will encounter. This document states the operating principles that should guide judgment when a specific rule elsewhere in this section does not clearly cover the situation — and it is itself grounded in, not a replacement for, the Constitution's Four Questions (Part V) and TRD22's Delivery Principles (DIP-001..007).

These principles do not grant permission to skip a TRD22 §22.40 stop condition. When a stop condition is met, the agent stops regardless of how well-intentioned a workaround might seem under these principles.

## 2. The Constitutional Four Questions, Applied to Engineering Work

Constitution Part V requires every new feature to answer four questions before approval. Engineering work inherits the same test at implementation time:

1. **Does it strengthen loyalty?** — does this change make the Verified Unit → Reward loop more trustworthy or more rewarding to use?
2. **Does it increase trust?** — does this change make the platform's behaviour more verifiable, more transparent, or more predictable?
3. **Does it preserve simplicity?** — does this change add complexity the platform, the Founder, or the customer will have to carry indefinitely?
4. **Does it align with the long-term Verified Commerce™ architecture?** — does this change fit the domain model, or does it quietly work around it?

An implementation choice that answers "no" to all four should be flagged in the Implementation Report's risk section, even if it technically satisfies its work package's acceptance criteria.

## 3. Delivery Principles (cited from TRD22 DIP-001..007)

These remain the authoritative delivery principles for sequencing and architecture decisions during implementation:

1. **DIP-001 — Vertical Journeys Before Broad Screens.** Prioritize complete working journeys over many disconnected screens.
2. **DIP-002 — Foundations Before Features.** Authentication, authorization, events, error handling and domain boundaries are established before high-level UI expansion.
3. **DIP-003 — One Controlled Phase at a Time.** Each phase is reviewed and approved before the next phase materially depends on it.
4. **DIP-004 — Tests Travel with Features.** A feature is not delivered separately from its tests.
5. **DIP-005 — No Temporary Architecture.** Temporary MVP code never bypasses approved domain boundaries.
6. **DIP-006 — Production Readiness Is Incremental.** Security, observability, localization and support are added throughout delivery, not at the end.
7. **DIP-007 — Pilot Feedback Does Not Override Integrity.** Pilot feedback may simplify workflows but never removes customer verification, traceability, or server authority.

## 4. Engineering-Governance-Specific Principles

Building on §2–3, and specific to how this collaboration model operates:

1. **Cite, don't guess.** Every implementation choice traces to a requirement ID (Traceability Matrix), a decision ID (Decision Register), or an explicit Founder instruction. If none exists, that is itself a TRD22 §22.40 stop condition, not a judgment call.
2. **Reversibility over speed.** Where two implementation approaches satisfy the same acceptance criteria, prefer the one that is easier to roll back (TRD20 §20.21), consistent with DIP-005.
3. **One authoritative source, not several.** Where a rule, standard, or piece of context already exists elsewhere in the documentation suite, reference it — never copy it into a new document where it can drift out of sync (the same rule this Engineering Governance section applies to itself, per the [Engineering Governance Charter](engineering-governance-charter.md) §5).
4. **Small, reviewable work packages.** A work package sized so that Technical Review can genuinely check every item in its checklist is preferred over a large one that forces superficial review, consistent with DIP-003.
5. **Documentation is part of the work, not an afterthought.** A work package that changes behaviour without updating the relevant PRD/TRD/Traceability Matrix entry is incomplete, regardless of whether the code itself is correct (TRD19 §19.49).
6. **Silence is never approval.** Consistent with the Decision Governance Workflow's Approval Rules (§3.6), an unanswered question in a work package or review is treated as unresolved, never as implicit consent to proceed.

## 5. Relationship to Existing Governance

This document does not create new constitutional or delivery principles — it restates the ones already approved (Constitution Part V, TRD22 DIP-001..007) in an engineering-process context, and adds only the small set of principles (§4) specific to the coding-agent collaboration model that neither the Constitution nor TRD22 covers directly.

## 6. Relationship to Other Engineering Governance Documents

These principles inform judgment throughout the [AI Collaboration Workflow](ai-collaboration-workflow.md), and are the tie-breaker referenced by [Coding Agent Standard](coding-agent-standard.md) and [Technical Review Standard](technical-review-standard.md) when a situation is not explicitly covered by a specific rule.
