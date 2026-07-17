# 11thONUS Documentation Consolidation — Phase 3A Implementation Report

**Date:** 16 July 2026
**Phase:** 3A — Founder Decision Programme & Governance Freeze Preparation
**Agent:** Claude (AI documentation agent)
**Scope discipline:** decision facilitation only — **no decision approved, no product behavior invented, no requirement or traceability IDs modified, Phase 4 not begun, no Git initialization, no architecture change.**

---

## 1. Executive Summary

Phase 3A operationalized the governance framework created in Phase 3. All 28 OPEN_FOUNDER records passed a six-criteria governance review (five wording clarifications applied, no meaning changed); the founder agenda was rebuilt for a non-technical reader into Batches A–E with all four freeze-blocking decisions first and an answer sheet; the missing operational layer — a Decision Governance Workflow and a step-by-step Decision Update Procedure — now exists, closing every ambiguity identified in the pre-work analysis. Freeze readiness assessment: **nothing besides founder decisions and already-planned mechanical phases blocks progress.** Once Batch A (4 answers) is recorded, Phase 4 can start immediately.

## 2. Files Reviewed

Decision register (all 103 records; 28 OPEN_FOUNDER in detail), founder agenda, external-dependencies register, assumptions register, reconciliation, decisions README, docs index, root README, canonical reference, changes log, phase tracker, TRD22 §22.40, TRD23 §23.38–23.44, Constitution Part VI–VII, consolidation-plan Step 13 checklist, Requirements ID Audit §5.

## 3. Pre-Work Findings (decision flow, ambiguities, propagation)

Reported in-chat before changes. Ambiguities found and closed: no operational recording procedure (→ update procedure), no approval-evidence rule (→ workflow §3.2), no conditional/unlisted-option rule (→ §3.3–3.4), constitutional-amendment sequencing (→ workflow §7), register version rule (→ workflow §4), canonical-reference sync rule (→ workflow §8), four split recommendations readable as facts (→ reworded), agenda batches not matching optimal order (→ Batches A–E).

## 4. Task 1 — Decision Register Review (28 OPEN_FOUNDER records)

- **Criteria checked:** context sufficiency ✓ (28/28), objective options ✓, no hidden recommendation-as-fact — 5 records reworded, affected documents ✓ (28/28), implementation consequences ✓ (28/28), dependencies ✓ (28/28). Verified by scripted field scan.
- **Wording-only changes:** DEC-LOY-008 option (c) neutralized (was "customer-hostile"; now cites the conflicting principles factually); DEC-PROD-012 and DEC-DATA-003 split recommendations → explicit "no single recommendation is made"; DEC-LOY-011 "documents lean…" marked as observation, not approval; DEC-PILOT-002 recommendation phrasing clarified. §1 gained an operational-process note recording this review. Batch references in Notes realigned to A–E (4 records → "Batch A (freeze blocker)").
- **No approval field was touched; no option removed; no meaning changed.**

## 5. Task 2 — Founder Agenda Improvements

Rebuilt for a non-technical reader: Batches **A** (4 freeze blockers) · **B** (7 core loyalty, with the Maria story for the overflow question) · **C** (2 roles/lookup) · **D** (9 commercial + profile + legal commissioning) · **E** (6 pilot/public scope). Every item now has plain-language question, why-it-matters, options **with consequences**, recommendations explicitly labelled; added "how to answer" instructions, the rule that unlisted options are welcome, and a copy-paste **answer sheet**. Meanings unchanged (verified: every item still maps 1:1 to its DEC ID; 28/28 covered).

## 6. Task 3 — Governance Workflow (created)

`docs/00-governance/decision-governance-workflow.md`: full lifecycle diagram (identified → registered → founder review → approved → register updated → documents updated → changes log → implementation authority → agents implement), responsibilities table, seven approval rules (incl. evidence, unlisted options, conditional approvals, silence-is-never-approval), version control, amendment process (supersede-never-edit), superseded/rejected handling, Constitution interaction (amendment-only path, TAP-001 precedence), Canonical Reference interaction (mirrors-never-leads), coding-agent contract.

## 7. Task 4 — Decision Update Procedure (created)

`docs/00-governance/decision-update-procedure.md`: 8 ordered steps (capture → register update → confirm-back → affected documents → canonical reference → changes log → traceability (Phase 5+) → housekeeping), version-numbering rules, historical-integrity rules (never delete/rewrite/blank/reuse), and a per-decision checklist.

## 8. Task 5 — Documentation Freeze Readiness Assessment

| Gate | Blocked by founder decisions? | Blocked by anything else? |
|---|---|---|
| **Phase 4 (ID normalization)** | Yes — DEC-GOV-006 only | **No** — strategy, mapping plan and tooling approach are ready (ID Audit §5); PRD4 unnumbered FRs are in-plan |
| **Phase 5 (traceability register)** | Indirectly (needs Phase 4) | **No** — gap report input ready |
| **Documentation freeze** | Yes — 4 × D0 (DEC-GOV-001/006, DEC-LOY-010, DEC-DATA-003) + decision-driven corrections (Phase 7) | **Mostly no.** Remaining non-decision items, all planned: execute the DEC-GOV-001 amendment after approval; run Phases 4–5; flip the 34 "pre-freeze" metadata blocks at freeze (checklist item); founder sign-off per document. Engineering Standards block *implementation*, not freeze. Legal reviews block *pilot*, not freeze. |
| **Recommended (not blocking)** | — | Initialize version control before Phase 4 (renumbering is high-churn; currently no Git — flagged since Phase 2; requires founder go-ahead as it was explicitly out of scope for Phases 2–3A) |

**Conclusion:** governance structure is complete; the critical path to freeze is founder answers (Batch A first), then mechanical Phases 4–5–7.

## 9. Task 6 — Recommended Founder Decision Order (and why)

1. **Batch A — Governance freeze blockers** (DEC-GOV-001 hierarchy, DEC-GOV-006 requirement IDs, DEC-LOY-010 batch rejection, DEC-DATA-003 purchase money fields). *Why first:* A2 unlocks Phase 4 renumbering; A1 fixes the arbitration rule every later correction relies on; A3/A4 are the only decisions whose answers change PRD/TRD text that Phase 4–7 will re-touch — deciding them before renumbering means each affected passage is edited once, not twice.
2. **Batch B — Core loyalty** (overflow, reward quantity, correction flow, reminders/expiry ×2, suspension redemption, pause housekeeping + UI verb). *Why second:* these gate the earliest product phases (4–8) and the Engineering Standards state-transition tables; answering them lets Phase 6 (standards) start in parallel with Phases 4–5.
3. **Batch C — Identity** (permission inheritance, phone lookup). *Why third:* gates Phase 2 implementation and PRD1/PRD10 corrections, but nothing in documentation Phases 4–5.
4. **Batch D — Commercial + profile** (plans, limits, trial, pricing, multi-business, exports, gender, birthday, legal commissioning). *Why fourth:* gates Phase 10–11 only; **exception — commission DEC-LEGAL-006 (cross-border hosting) early**, since its evidence gates the Phase 1 region choice.
5. **Batch E — Pilot & public scope** (public pages, cohort, launch bar, free plans, self-suspension, admin subset). *Why last:* gates Phases 12–16; pilot evidence may also inform these, so late answers are cheaper to change.

This sequence minimizes rework because document-touching decisions (A, B) land before the renumbering and traceability passes that would otherwise have to be repeated, while phase-10+ decisions wait until their documents are stable.

## 10. Files Modified (6) / Created (3)

**Modified:** `decisions/decision-register.md` (5 wording fixes + §1 note + batch-reference realignment), `decisions/founder-decision-agenda.md` (rebuilt), `decisions/README.md` (+process links), `docs/README.md` (+workflow links), `documentation-changes-log.md` (Entry 005), `change-tracking/documentation-phases.md` (Phase 3A row).
**Created:** `00-governance/decision-governance-workflow.md`, `00-governance/decision-update-procedure.md`, this report. **No PRD or TRD file was touched in Phase 3A.**

## 11. Commands Executed / Configuration / Dependencies

Scripted field-completeness scan of the 28 OPEN_FOUNDER records; python wording/batch edits; link checker. **Configuration changes: none. Dependencies added: none. Git: not initialized (constraint).**

## 12. Remaining Governance Risks

1. Founder availability is now the sole critical-path item; the agenda mitigates by batching.
2. Register/agenda dual maintenance — procedure Step 8.1 keeps the agenda synchronized; the register governs on any divergence.
3. No version control underneath high-churn Phase 4 (recommendation stands).
4. Two CONFIRMED-with-veto records (DEC-SUB-004, DEC-ID-006) — surfaced again here so the founder sees them before freeze.

## 13. Rollback Instructions

Delete the two new governance documents and this report; revert the register via the six quoted replacements (all listed in §4 — originals preserved in the changes-log entry); restore the previous agenda from changes-log Entry 004 context or Phase 3 report; remove the README/docs-index link lines; remove changes-log Entry 005 and the Phase 3A tracker row. All edits were additive or quoted-string replacements; nothing was deleted.

## 14. Confirmations

**No OPEN decision was approved · no product behavior invented · no requirement or traceability IDs modified · Phase 4 not begun · no documentation migrated · Git not initialized · no architecture changed · no unrelated files modified.**
