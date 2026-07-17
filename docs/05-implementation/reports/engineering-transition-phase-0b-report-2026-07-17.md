> **Title:** Engineering Transition Phase 0B Report — Architecture Finalization & Engineering Standards
> **Version:** 1.0 · **Status:** Complete · **Classification:** Audit evidence / Implementation report
> **Governing document:** Engineering Transition Phase 0B task brief (2026-07-17)
> **Source-of-truth path:** `docs/05-implementation/reports/engineering-transition-phase-0b-report-2026-07-17.md`
> **Last controlled update:** 2026-07-17

# Engineering Transition Phase 0B Report — Architecture Finalization & Engineering Standards

## Before Making Changes — Analysis Summary

Reviewed: Platform Constitution, Canonical Reference, Documentation Manifest v1, Decision Register (all 103 records), Engineering Transition D1 Agenda, Engineering Implementation Programme, Coding-Agent Prompt Register, Engineering Governance suite (all 12 documents), TRD22 (full, re-verified §22.9–22.29), TRD19 (Quality Engineering, section index), TRD20 (Deployment and Operational Resilience, §20.1–20.44 read in relevant part), plus targeted full reads of TRD8 (Firebase Platform Architecture), TRD9 (Physical and Integration Architecture, section index), TRD10 §10.29–10.32 (Atomicity, Idempotency, Schema Versioning), TRD11 §11.17–11.37 (Event Outbox, Purchase/Verification flows, Error Contract, Logging), TRD12 (Security and Access Control, section index), TRD16 (Frontend and PWA Architecture, section index), TRD23 §23.22 (Open Technical Decisions, OTD-001–008), and the Version 1 Engineering Readiness Report.

**Findings, before any document was written:**

- **Genuine blockers (external proof/evaluation not yet performed, cannot be closed by re-reading documentation):** DEC-SEC-001 (Burundi OTP delivery proof, EXT-TECH-001), DEC-TECH-005 (Firebase region evaluation, plus the separate open DEC-LEGAL-006 legal question), DEC-TECH-003 (no candidate frontend tooling named anywhere in the suite).
- **Already effectively decided (an approved TRD chapter states the direction clearly, closing them is recognition, not invention):** DEC-TECH-004 (repository structure — OTD-002 + TRD8 §8.4 already assume a monorepo), DEC-TECH-006 (event delivery pattern — TRD11 §11.17 already specifies the outbox pattern in field-level detail), DEC-TECH-007 (idempotency storage — TRD10 §10.30 + OTD-007 already permit a combined per-operation approach explicitly).
- **Prepared but not yet reviewed (not the same as "already decided"):** DEC-DATA-007 — the Phase 0A Loyalty Code Decision Brief is a proposal this programme generated, not a pre-existing approved answer; it stays open pending Founder/Engineering Lead review.
- **Not this programme's decision to make:** DEC-ID-003 and DEC-LOY-008 are Founder-owned; DEC-LEGAL-006 is a Founder + legal-adviser decision. None are touched here.

This grounded the closure/non-closure calls in §1 below rather than guessing, per TRD22 §22.40.

## Task 1 — Resolve Engineering-Owned D1 Decisions

Full analysis, source citations, and prepared (not applied) register-update text: [Engineering Decision Closure Recommendations](../../00-governance/decisions/engineering-decision-closure-recommendations.md) (new document).

**Outcome:** 3 of 7 Engineering-owned D1 decisions have a prepared, ready-to-sign closure recommendation (DEC-TECH-004, DEC-TECH-006 at the pattern level, DEC-TECH-007 at the policy level); 4 remain genuinely open (DEC-SEC-001, DEC-TECH-003, DEC-TECH-005, DEC-DATA-007). **No Decision Register status was changed** — per the [Decision Governance Workflow](../../00-governance/decision-governance-workflow.md) §2/§9, only the Engineering Lead may approve an OPEN_ENGINEERING record, and no explicit approval instruction for any specific record was present in this task's brief (unlike Phase 3B, where each decision carried an explicit quoted approval). The live register is unchanged: still 15 OPEN_ENGINEERING, 24 OPEN_FOUNDER, 7 OPEN_PROVIDER, 6 OPEN_LEGAL, 37 CONFIRMED, 10 DEFERRED, 4 SUPERSEDED (verified by direct count against `decision-register.md`).

## Task 2 — Engineering Standards (Pass 1)

Nine documents created under `docs/03-standards/engineering-standards/`, covering all 11 named topics (some topics share a document where they are inseparable in practice — linting+formatting, repository+folder):

1. [Repository and Folder Standards](../../03-standards/engineering-standards/repository-and-folder-standards.md)
2. [Naming Conventions](../../03-standards/engineering-standards/naming-conventions.md)
3. [TypeScript Conventions](../../03-standards/engineering-standards/typescript-conventions.md)
4. [Linting and Formatting Conventions](../../03-standards/engineering-standards/linting-and-formatting-conventions.md)
5. [Testing Conventions](../../03-standards/engineering-standards/testing-conventions.md)
6. [Logging Conventions](../../03-standards/engineering-standards/logging-conventions.md)
7. [Error Handling Conventions](../../03-standards/engineering-standards/error-handling-conventions.md)
8. [Documentation Conventions](../../03-standards/engineering-standards/documentation-conventions.md)
9. [Commit Conventions](../../03-standards/engineering-standards/commit-conventions.md) — a short pointer document; the format itself was already fully specified in [Git Workflow](../../06-engineering-governance/git-workflow.md) §4 (Phase 6), so this avoids duplicating it while still making "commit conventions" discoverable in the standards suite.

Firebase regional conventions, event/outbox schema detail, idempotency per-operation schema, and state-transition implementation were **explicitly excluded**, as instructed, and are named in the rewritten [`README.md`](../../03-standards/engineering-standards/README.md) §"Pass 2 — Reserved" with the specific decision each depends on.

## Task 3 — Version 1 Engineering Blueprint

Created: [Version 1 Engineering Blueprint](../../02-technical/version-1-engineering-blueprint.md) at `docs/02-technical/version-1-engineering-blueprint.md`, consolidating TRD8/9/10/11/12/16/20 into one architecture reference organized as: Overall Architecture, Repository Architecture, Domain Architecture (the confirmed 15-domain model, with the task brief's 9-domain example list explicitly mapped onto it), Cross-Cutting Services (Authentication, Authorization, Security Layering, Logging, Notifications, Configuration, Audit/Trust Ledger, Integration, Monitoring), Data Flow (client command flow, direct-read flow, event-driven flow, offline flow — all high-level, no implementation), and Deployment Architecture (the approved Local/Development/Staging/Production model, with the task brief's slightly different example wording explicitly reconciled to the approved TRD20 model rather than followed).

One source discrepancy was found and disclosed rather than silently resolved: TRD8 §8.6's illustrative Firestore-collection example places `subscriptions` under Administration, which conflicts with the Phase 1-corrected Canonical Reference ownership model (Subscription, not Administration, owns billing records). The Blueprint follows the corrected Canonical Reference and states the discrepancy in its §0.

## Task 4 — Prompt Register Status-Model Review (Recommendation Only)

**Current model:** one `Blocked` status covers every reason a work package cannot start — a decision, a provider dependency, or an unfinished prior phase are all indistinguishable at the register's flat-table level; the actual reason lives only in the Engineering Implementation Programme's per-row `Blocking Reason` field, a second document the reader must cross-reference.

**Recommendation: yes, evolve `Blocked` into sub-states**, specifically:

- `Waiting for Decision` — a specific DEC-ID is OPEN and named in the row.
- `Waiting for Previous Phase` — the blocking condition is purely sequential (an earlier work package isn't `Complete` yet), no decision involved.
- `Waiting for Provider` — a DEC-PROV-* record or external provider evaluation is outstanding.
- `Waiting for Legal` — a DEC-LEGAL-* record blocks it (e.g. DEC-TECH-005 transitively, via DEC-LEGAL-006).
- `Ready` — unchanged, already exists.

**Basis for the recommendation:** of the 47 work packages, every one is currently `Blocked`, but for reasons of genuinely different character — ENG-P0-001 waits on a decision (DEC-TECH-003), ENG-P1-003 waits on a provider (DEC-PROV-005), and the majority of Phase 2+ work packages wait purely on phase sequencing with no open decision at all. A single `Blocked` bucket makes the register's "what's actually stuck vs. what's just next in line" distinction invisible without opening the Programme document. Splitting the status makes the register self-explanatory and lets a reader immediately see, for example, that resolving DEC-TECH-003 alone would flip several rows to `Ready`/`Waiting for Previous Phase` simultaneously.

**This is a recommendation only — the register's status vocabulary (§3 of the Coding-Agent Prompt Register) was not changed.** Implementing it is a small, mechanical follow-up (reclassify each of the 47 `Blocked` rows into the new sub-states using the Programme's existing `Blocking Reason` field, which already contains the information needed) — suitable for a short future documentation task, not undertaken here since Task 4 explicitly scopes this phase to recommendation, not redesign.

## Task 5 — ENG-P0-001 Draft Validation

Re-reviewed [ENG-P0-001-draft.md](../prompts/ENG-P0-001-draft.md) against the new Blueprint and Engineering Standards. **Finding: nothing important is missing, nothing premature is present, no implementation assumption has crept in.** The draft's two-decision precondition (§4) is confirmed still correct and necessary. A light, non-substantive update was made: a note added stating DEC-TECH-004 now has a prepared closure recommendation (still OPEN_ENGINEERING in the live register, pending sign-off) and that DEC-TECH-003 has no prepared answer and is the harder of the two remaining blockers. **Execution is not authorized.**

## Task 6 — Readiness Assessment

- **Architecture readiness:** high. The Version 1 Engineering Blueprint now consolidates seven TRD chapters into one reference with zero invented content; every cross-cutting service, the domain model, the repository structure, and the request-flow shapes are documented and sourced. The two genuinely open architecture items (frontend tooling, Firebase region) are narrow and specific, not broad ambiguity.
- **Governance readiness:** high and unchanged from Phase 7 — the Decision Governance Workflow, Update Procedure, and Engineering Governance suite (12 documents) remain complete and were not touched.
- **Engineering readiness:** improved. Pass 1 Engineering Standards now exist (9 documents, 11 topics covered); Pass 2's scope is explicitly bounded to exactly the items gated on DEC-TECH-003/005 detail, not an open-ended "TBD."
- **Outstanding founder decisions:** 24 OPEN_FOUNDER (unchanged; none D0/freeze-blocking; DEC-LOY-008 and DEC-ID-003 are the two D1-priority ones blocking Phase 7 and Phase 2 respectively).
- **Outstanding engineering decisions:** 15 OPEN_ENGINEERING in the live register (unchanged pending sign-off); of these, 3 have a prepared closure (§Task 1) and 4 are D1-priority genuine blockers (DEC-SEC-001, DEC-TECH-003, DEC-TECH-005, DEC-DATA-007) — DEC-TECH-003 is the single item now standing between the suite and a `Ready` ENG-P0-001.
- **Outstanding provider decisions:** 7 OPEN_PROVIDER (unchanged); DEC-PROV-004 (OTP route) and DEC-PROV-005 (error monitoring) are D1-priority.
- **Remaining legal decisions:** 6 OPEN_LEGAL (unchanged); DEC-LEGAL-006 (cross-border hosting) is D1-priority and transitively blocks DEC-TECH-005.

**Is the project now genuinely ready to begin TRD22 Phase 0?**

**Not yet — but the remaining gap is now small, specific, and named, not broad ambiguity.** Documentation-side, the architecture is as settled as it can be without inventing a choice nobody has made: the Blueprint, Pass 1 Standards, and 3 newly-closable decisions remove every piece of *avoidable* ambiguity this phase could resolve by reading existing documentation more carefully. What remains before ENG-P0-001 can actually be issued is exactly two things, both requiring a human decision-owner action this programme cannot take on its own: (1) the Engineering Lead signs off on the three prepared closures (a formality, since the direction is already documented) and (2) the Engineering Lead proposes DEC-TECH-003's frontend tooling set (a genuine, non-mechanical decision). Phase 1 additionally needs DEC-TECH-005 (region) resolved, which itself needs DEC-LEGAL-006. **TRD22 Phase 0 has still not begun; nothing in this phase authorized or performed any implementation.**

## Required Completion Report

**1. Files created**

- `docs/00-governance/decisions/engineering-decision-closure-recommendations.md`
- `docs/03-standards/engineering-standards/repository-and-folder-standards.md`
- `docs/03-standards/engineering-standards/naming-conventions.md`
- `docs/03-standards/engineering-standards/typescript-conventions.md`
- `docs/03-standards/engineering-standards/linting-and-formatting-conventions.md`
- `docs/03-standards/engineering-standards/testing-conventions.md`
- `docs/03-standards/engineering-standards/logging-conventions.md`
- `docs/03-standards/engineering-standards/error-handling-conventions.md`
- `docs/03-standards/engineering-standards/documentation-conventions.md`
- `docs/03-standards/engineering-standards/commit-conventions.md`
- `docs/02-technical/version-1-engineering-blueprint.md`
- `docs/05-implementation/reports/engineering-transition-phase-0b-report-2026-07-17.md` (this report)

**2. Files modified**

- `docs/03-standards/engineering-standards/README.md` — rewritten from placeholder to a real Pass 1/Pass 2 index.
- `docs/05-implementation/prompts/ENG-P0-001-draft.md` — added Phase 0B status note and validation note (§ above); no scope/precondition change.
- `docs/README.md` — status banners, document groups, outstanding-work list updated (§ integration, below).
- `docs/05-implementation/change-tracking/documentation-phases.md` — new row added.
- `docs/05-implementation/reports/README.md` — new report indexed.
- `docs/00-governance/decisions/README.md` — new decision-adjacent document indexed.
- `docs/00-governance/documentation-changes-log.md` — Entry 012 appended.

**3. Decision Register updates**

**None applied.** Per the Decision Governance Workflow, the AI/documentation-maintainer role never fills approval fields on its own initiative and this task's brief contained no explicit founder/Engineering Lead approval instruction for any specific DEC-TECH record. Three ready-to-sign closure recommendations were **prepared** (exact Final-decision text, sourced) in the new Engineering Decision Closure Recommendations document — applying them requires one Engineering Lead sign-off each via the normal Decision Update Procedure.

**4. Engineering decisions resolved**

None formally resolved (see §3). Three have a prepared closure: DEC-TECH-004 (monorepo), DEC-TECH-006 (outbox pattern, schema deferred), DEC-TECH-007 (combined idempotency approach, per-operation schema deferred).

**5. Engineering decisions remaining open**

All 15 OPEN_ENGINEERING records remain open in the live register, including the 4 genuinely-blocked D1 items: DEC-SEC-001 (Burundi OTP proof), DEC-TECH-003 (frontend tooling — no candidate documented anywhere), DEC-TECH-005 (region evaluation + DEC-LEGAL-006 dependency), DEC-DATA-007 (Phase 0A brief awaiting review).

**6. Engineering standards created**

9 documents, 11 topics (repository, folder, naming, TypeScript, linting, formatting, testing, logging, error handling, documentation, commit) — see Task 2 above. Pass 2 scope explicitly named and deferred, not left open-ended.

**7. Engineering blueprint summary**

One document, `docs/02-technical/version-1-engineering-blueprint.md`, 8 sections (Purpose/Status, Overall Architecture, Repository Architecture, Domain Architecture, Cross-Cutting Services, Data Flow, Deployment Architecture, What This Blueprint Does Not Do, Relationship to Other Governance Documents) — see Task 3 above for detail. Zero new architectural content invented; one source discrepancy (TRD8 §8.6 vs. the corrected Canonical Reference ownership model) found and disclosed rather than silently resolved.

**8. Prompt Register recommendations**

Recommend evolving `Blocked` into `Waiting for Decision` / `Waiting for Previous Phase` / `Waiting for Provider` / `Waiting for Legal`, keeping `Ready` unchanged — see Task 4 above. Not implemented; recommendation only, per the task's explicit instruction.

**9. Commands executed**

Read-only inspection and verification commands only: `grep`/`find` over the documentation tree to locate TRD sections, verify decision-register status counts (`grep -oE "Status: \*\*[A-Z_]+\*\*" decision-register.md | sort | uniq -c` → 37 CONFIRMED / 10 DEFERRED / 15 OPEN_ENGINEERING / 24 OPEN_FOUNDER / 6 OPEN_LEGAL / 7 OPEN_PROVIDER / 4 SUPERSEDED, unchanged from before this phase), and directory listings to confirm the existing Engineering Standards/prompts/reports folder contents before writing. No build, install, git, or Firebase command was run — none was in scope.

**10. Dependencies added**

None. No repository, package manifest, or code exists yet; none was created (explicitly out of scope).

**11. Configuration changes**

None.

**12. Risks**

- The three "closable now" decision recommendations reflect this programme's judgment that existing TRD text is sufficient; the Engineering Lead may, on review, disagree or want additional detail before signing — the recommendations are explicitly framed as prepared text awaiting that judgment, not a fait accompli.
- DEC-TECH-003 remains the hard blocker on Phase 0; no amount of further documentation review can close it — only an actual engineering tooling proposal can, and that proposal was intentionally not fabricated here.
- The Prompt Register status-model recommendation (Task 4), if adopted later, requires touching all 47 rows at once — a mechanical but non-trivial edit; deferring it was correct for this phase's scope but it should not be deferred indefinitely once decisions start closing, or the register's "Blocked" bucket will misrepresent an increasingly `Ready`-heavy reality.

**13. Rollback instructions**

All changes are additive documentation (new files) or narrow, cited edits to two existing files (Engineering Standards README rewrite, ENG-P0-001 draft note). To roll back: delete the 11 new files listed in §1 (created files only, none delete anything); revert the Engineering Standards README to its Phase 6 placeholder text; revert the two added notes in ENG-P0-001-draft.md; revert the docs/README.md, phase-tracker, reports/README.md, decisions/README.md, and changes-log entries listed in §2 to their pre-Phase-0B state. No Decision Register content was changed, so no register rollback is needed.

**14. Markdown implementation report**

This document.

**15. Persistent project changes log**

Documentation Changes Log Entry 012 appended — see below.

## Cross-Reference Integration

`docs/README.md`, `docs/05-implementation/change-tracking/documentation-phases.md`, `docs/05-implementation/reports/README.md`, and `docs/00-governance/decisions/README.md` updated in the same change set as this report (see the Documentation Changes Log entry for the itemized list).

## Expected Outcome — Self-Assessment

"No avoidable architectural ambiguity remaining": met — every architecture question answerable from existing documentation now has an explicit answer (Blueprint) or an explicit, sourced reason it cannot yet be closed (Closure Recommendations). "A controlled engineering blueprint exists": met. "A first-pass engineering standards suite exists": met, with Pass 2's boundary explicitly named. "Only genuinely unresolved external/founder/provider/legal decisions remain before engineering implementation begins": largely met — DEC-TECH-003 is the one remaining item that is engineering-owned rather than external, and it is a genuine proposal-writing task, not a documentation gap.
