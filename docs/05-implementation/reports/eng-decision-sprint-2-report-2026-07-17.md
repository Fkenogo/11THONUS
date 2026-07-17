> **Title:** Engineering Decision Sprint 2 Report — Engineering Decision Confirmation & Phase 0 Authorization
> **Version:** 1.0 · **Status:** Complete · **Classification:** Audit evidence / Implementation report
> **Governing document:** Engineering Decision Sprint 2 task brief (2026-07-17)
> **Source-of-truth path:** `docs/05-implementation/reports/eng-decision-sprint-2-report-2026-07-17.md`
> **Last controlled update:** 2026-07-17

# Engineering Decision Sprint 2 Report — Engineering Decision Confirmation & Phase 0 Authorization

## 1. Executive Summary

This was the final governance checkpoint before engineering implementation begins. Reviewed all seven Engineering-owned D1 decisions and, under the explicit Founder-directed instruction in this sprint's own task brief ("Update Decision Register: For every confirmed decision: Update Status; Final Decision; Decision Date; Approved By; Supporting References"), formally applied the Decision Update Procedure to the four decisions with sufficient evidence: **DEC-TECH-003** (frontend tooling set), **DEC-TECH-004** (repository structure), **DEC-TECH-006** (event-outbox pattern), and **DEC-TECH-007** (idempotency policy) — each moved from `OPEN_ENGINEERING` to **`CONFIRMED`** in the live Decision Register. **DEC-SEC-001**, **DEC-TECH-005**, and **DEC-DATA-007** remain genuinely open, each for a documented, unresolved reason; no Founder-owned or Provider-owned decision was touched. Every governance document referencing these four decisions was synchronized so none still calls them "recommended" or "pending sign-off." The Engineering Implementation Programme and Coding-Agent Prompt Register were updated: **ENG-P0-001 moved from `Blocked` to `Ready`**. A new [Phase 0 Authorization](../phase-0-authorization.md) record was created — the official authorization to begin engineering. This remains a **governance-only** sprint: no repository, Git, packages, Firebase project, code, or CI/CD configuration was created.

## 2. Files Modified

`docs/00-governance/decisions/decision-register.md` (4 records); `docs/02-technical/version-1-engineering-blueprint.md`; `docs/03-standards/engineering-standards/README.md`; `docs/03-standards/engineering-standards/linting-and-formatting-conventions.md`; `docs/03-standards/engineering-standards/repository-and-folder-standards.md`; `docs/00-governance/decisions/engineering-transition-d1-agenda.md`; `docs/00-governance/decisions/engineering-decision-closure-recommendations.md`; `docs/00-governance/decisions/dec-tech-003-engineering-stack-recommendation.md`; `docs/00-governance/decisions/README.md`; `docs/00-governance/documentation-manifest-v1.md`; `docs/05-implementation/change-tracking/engineering-implementation-programme.md`; `docs/05-implementation/change-tracking/coding-agent-prompt-register.md`; `docs/05-implementation/prompts/ENG-P0-001-draft.md`; `docs/README.md`; `docs/05-implementation/change-tracking/documentation-phases.md`; `docs/05-implementation/reports/README.md`; `docs/00-governance/documentation-changes-log.md`. Full per-file description in the [Documentation Changes Log](../../00-governance/documentation-changes-log.md) Entry 016.

## 3. Files Created

- `docs/05-implementation/phase-0-authorization.md` — the official authorization to begin engineering.
- `docs/05-implementation/reports/eng-decision-sprint-2-report-2026-07-17.md` — this report.

## 4. Decision Register Changes

| Decision | Old Status | New Status | Final Decision (summary) | Decision Date | Approved By |
|---|---|---|---|---|---|
| **DEC-TECH-003** — Frontend tooling set | OPEN_ENGINEERING | **CONFIRMED** | Vite, React Router, TanStack Query, React Hook Form + Zod, shadcn/ui + Tailwind CSS, Lucide, Recharts, TanStack Table, vite-plugin-pwa/Workbox, Vitest + React Testing Library + Playwright, ESLint + Prettier, pnpm | 2026-07-17 | Engineering Lead (confirmed under Founder-directed Engineering Decision Sprint 2) |
| **DEC-TECH-004** — Repository structure | OPEN_ENGINEERING | **CONFIRMED** | Monorepo (frontend + Cloud Functions, shared types), per OTD-002 and TRD8 §8.4 | 2026-07-17 | Engineering Lead (confirmed under Founder-directed Engineering Decision Sprint 2) |
| **DEC-TECH-006** — Event delivery mechanism (outbox) | OPEN_ENGINEERING | **CONFIRMED** (pattern level) | Firestore-transaction + event-outbox + background-processor pattern per TRD11 §11.17; exact collection schema deferred to Pass 2/ENG-P1-002 | 2026-07-17 | Engineering Lead (confirmed under Founder-directed Engineering Decision Sprint 2) |
| **DEC-TECH-007** — Idempotency storage approach | OPEN_ENGINEERING | **CONFIRMED** (policy level) | Combined, per-operation approach (dedicated collection or deterministic IDs) per TRD10 §10.30/OTD-007; per-operation schema deferred to Pass 2/ENG-P1-002 | 2026-07-17 | Engineering Lead (confirmed under Founder-directed Engineering Decision Sprint 2) |

**Left open, with reasons re-verified and unchanged:**

| Decision | Status | Why it stays open |
|---|---|---|
| DEC-SEC-001 — Customer authentication approach | OPEN_ENGINEERING | Depends on EXT-TECH-001 (Burundi phone-OTP delivery/cost/abuse-control proof) — a factual proof this sprint cannot manufacture. |
| DEC-TECH-005 — Firebase region | OPEN_ENGINEERING | No regional evaluation has been performed; also depends on the unresolved DEC-LEGAL-006 (cross-border hosting legal position), outside Engineering's authority. |
| DEC-DATA-007 — Loyalty number / QR reference generation | OPEN_ENGINEERING | A concrete proposal exists (the Phase 0A Loyalty Code Decision Brief) but has not yet been reviewed by the Founder/Engineering Lead — closing it now would treat an unreviewed proposal as if it were already-approved documentation. |

Not touched: DEC-LOY-008, DEC-ID-003 (Founder-owned); DEC-PROV-004, DEC-PROV-005 (Provider-owned).

Live register status counts: **before** — 15 OPEN_ENGINEERING; **after** — 11 OPEN_ENGINEERING, +4 CONFIRMED (verified via `grep -oE "Status: \*\*[A-Z_]+\*\*" decision-register.md | sort | uniq -c`).

## 5. Engineering Programme Changes

- **Engineering Implementation Programme** (`engineering-implementation-programme.md`): Phase 0 profile — Entry Criteria and Decision Dependencies updated to "satisfied/CONFIRMED"; Current Status changed to "Ready — both in-phase D1 decisions... CONFIRMED." ENG-P0-001 row: Status `Blocked` → **`Ready`**; Blocking Reason cleared. ENG-P0-002 row: Decision Dependencies annotated CONFIRMED; Status remains `Blocked` (sequential precondition — ENG-P0-001 not yet complete); Blocking Reason reworded to reflect that only sequencing, not the decision, now blocks it. Phase 1 profile — Entry Criteria/Decision Dependencies/Current Status updated to show DEC-TECH-006/007 CONFIRMED, DEC-TECH-005/DEC-PROV-005 still open. ENG-P1-002 row: Decision Dependencies annotated CONFIRMED; Status remains `Blocked` (sequential precondition — ENG-P1-001 not yet complete, itself blocked on the still-open DEC-TECH-005). §B.1 overview table Phase 0/Phase 1 rows updated to match.
- **Coding-Agent Prompt Register** (`coding-agent-prompt-register.md`): ENG-P0-001 row Status `Blocked` → **`Ready`**, Decision Dependencies annotated "(both CONFIRMED)". ENG-P1-002 row Decision Dependencies annotated "(both CONFIRMED; ENG-P1-001 completion still required)". §5 Current Distribution updated: Ready 1, Blocked 46 (was Ready 0, Blocked 47), with an explanatory note distinguishing `Ready` (eligible to receive a prompt) from "a prompt has been issued" (has not happened).
- **ENG-P0-001 draft** (`ENG-P0-001-draft.md`): banner rewritten from "DRAFT — NOT YET AUTHORIZED FOR EXECUTION" to "DRAFT — DECISIONS CONFIRMED, STATUS `READY` — NOT YET ISSUED," naming the confirmed stack and pointing to the Phase 0 Authorization record. §4's precondition checklist items 1–2 marked satisfied with dates; item 3 (citing decisions by ID in the non-draft version) correctly left as still-required future work, since finalizing and issuing the prompt is a distinct workflow action this sprint does not take. Closing Status section updated to `Ready` with a Sprint 2 validation note.

**No other work package's Status field was changed** — every one of the remaining 45 work packages stays `Blocked`, per the task's explicit instruction to leave unaffected packages unchanged.

## 6. Validation Performed

- **Decision Register status count check:** `grep -oE "Status: \*\*[A-Z_]+\*\*" decision-register.md | sort | uniq -c` before and after — confirmed exactly 4 records moved OPEN_ENGINEERING → CONFIRMED (15→11 / +4), no other status count changed (CONFIRMED 37→41, all others unchanged).
- **Full-suite markdown link check:** Python walk-and-regex script across all `.md` files under `docs/`. Result: 139 total markdown files (up from 135 — the new `phase-0-authorization.md` and `eng-decision-sprint-2-report-2026-07-17.md`, both newly created); 5 link occurrences (across `docs/README.md` ×3 and `phase-0-authorization.md` ×2) pointed at this report before it existed — expected and resolved once this file was written; 0 broken links after.
- **Stale-status grep:** searched the full suite for `DEC-TECH-003/004/006/007` co-occurring with `OPEN_ENGINEERING` or "pending sign-off"/"recommended, pending" in live governance documents. Found and corrected 2 live documents that had not yet been touched by the earlier synchronization pass: `docs/03-standards/engineering-standards/repository-and-folder-standards.md` (§3 workspace-split note, §6 "not covered" bullets) and `docs/00-governance/documentation-manifest-v1.md` (Engineering Decision Closure Recommendations row). Remaining matches confirmed to be inside dated historical implementation reports (`engineering-transition-phase-0b-report-2026-07-17.md`, `eng-decision-sprint-1-dec-tech-003-report-2026-07-17.md`) and the Documentation Changes Log itself — append-only audit records that correctly preserve the state as of their own date and are not edited.
- **Founder/Provider decision isolation check:** confirmed by direct re-read of the 4 edited Decision Register blocks and the D1 Agenda summary table that DEC-LOY-008, DEC-ID-003, DEC-PROV-004, and DEC-PROV-005 were not modified.
- **Cross-document consistency:** confirmed the Version 1 Engineering Blueprint, Engineering Standards (README + 2 individual standards), D1 Agenda, Documentation Manifest, Engineering Implementation Programme, Coding-Agent Prompt Register, ENG-P0-001 draft, and `docs/README.md` all now describe DEC-TECH-003/004/006/007 consistently as CONFIRMED, with no document asserting a conflicting status.

## 7. Risks Remaining

- **DEC-SEC-001** (customer authentication/fallback) — blocks ENG-P2-001; requires the EXT-TECH-001 Burundi OTP proof, outside this sprint's authority to produce.
- **DEC-TECH-005** (Firebase region) — blocks ENG-P1-001 and everything downstream of it; requires both a technical regional evaluation and the Founder/legal-adviser-owned DEC-LEGAL-006.
- **DEC-PROV-005** (error monitoring provider) — blocks ENG-P1-003 (monitoring initialization specifically; the Security/Storage Rules portion of ENG-P1-003 does not strictly depend on it).
- **DEC-DATA-007** (loyalty number/QR generation) — blocks ENG-P2-001; a concrete proposal exists (Loyalty Code Decision Brief) but awaits Founder/Engineering Lead review.
- **DEC-TECH-006/007 schema-level detail** — confirmed at the pattern/policy level only; the exact outbox collection schema and per-operation idempotency choice remain to be authored as Pass 2 Engineering Standards alongside ENG-P1-002, not before.
- **Attribution basis for "Approved by":** recorded as "Engineering Lead, confirmed under Founder-directed Engineering Decision Sprint 2" — this documents the process basis for the confirmation (the sprint's task brief constituting the explicit instruction required by the Decision Governance Workflow) rather than asserting a named individual's out-of-band sign-off. Flagged transparently rather than either fabricating a signature or leaving the field blank.
- **ENG-P0-001 is `Ready`, not issued** — repository initialization has not begun; issuing the prompt through the AI Collaboration Workflow remains a distinct next step for the Founder/ChatGPT Technical Lead.

## 8. Rollback Instructions

All changes are Decision Register field edits (additive — no prior content deleted, only status/final-decision/date/approver/consequences fields filled) plus additive documentation notes/pointers on existing files, plus 2 new files. To roll back:

1. In `decision-register.md`, revert the 4 edited blocks (DEC-TECH-003, -004, -006, -007) to `Status: OPEN_ENGINEERING`, restoring their pre-sprint `Final decision: — · Decision date: — · Approved by: —` fields (exact prior text preserved in this sprint's diff / the Engineering Decision Closure Recommendations and DEC-TECH-003 documents' "prepared" sections, which were never deleted).
2. Delete `docs/05-implementation/phase-0-authorization.md` and this report.
3. Revert the 15 modified files listed in §2 to their pre-sprint text (each change is a clearly-scoped section/note addition, not a rewrite).
4. Revert the Coding-Agent Prompt Register's ENG-P0-001 row to `Blocked` and the Engineering Implementation Programme's ENG-P0-001 row/Phase 0 status to their pre-sprint wording.
5. Revert `docs/README.md`, the phase tracker, reports README, and the Documentation Changes Log (remove Entry 016) to their pre-sprint state.

No code, package, CI/CD, or Firebase artifact exists to roll back — none was created.

## 9. Markdown Implementation Report

This document, together with the [Phase 0 Authorization](../phase-0-authorization.md) record it accompanies.

## 10. Persistent Change Tracking

- `docs/00-governance/documentation-changes-log.md` — Entry 016 appended (this sprint's full file-by-file change record, decision table, method, and validation).
- `docs/05-implementation/change-tracking/documentation-phases.md` — new "Engineering Decision Sprint 2" row appended; closing summary paragraph rewritten to state the programme has moved from planning to execution: DEC-TECH-003/004/006/007 CONFIRMED, ENG-P0-001 `Ready`, Phase 0 authorized, repository initialization may begin (not yet performed).

---

## Expected Outcome — Confirmed

- **Documentation governance baseline:** complete (unchanged from Phase 7, Version 1.0).
- **Engineering decisions formally confirmed where supported:** DEC-TECH-003, DEC-TECH-004, DEC-TECH-006, DEC-TECH-007 — CONFIRMED.
- **Phase 0 officially authorized:** yes — see [`phase-0-authorization.md`](../phase-0-authorization.md).
- **ENG-P0-001 marked Ready for execution:** yes.
- **Next step:** the next coding-agent task can now be the first true implementation prompt (finalizing and issuing ENG-P0-001) rather than another governance exercise — though issuing it remains a distinct, not-yet-taken Founder/ChatGPT-Technical-Lead action outside this sprint's governance-only scope.
