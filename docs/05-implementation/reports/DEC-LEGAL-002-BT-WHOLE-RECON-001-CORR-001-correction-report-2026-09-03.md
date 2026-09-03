> **Title:** Whole-Instrument Reconciliation Report — `DEC-SUB-013`/§19.2 Classification Correction
> **Version:** 1.0 (2026-09-03) · **Status:** Working (governance record — correction report) · **Classification:** Working (governance record)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LEGAL-002` (Status: `OPEN_LEGAL`, unchanged)
> **Task:** `DEC-LEGAL-002-BT-WHOLE-RECON-001-CORR-001`
> **Governs:** [Whole-Instrument Reconciliation Report](DEC-LEGAL-002-BT-WHOLE-RECON-001-whole-instrument-reconciliation-report-2026-09-03.md) §7, §8, §13, §27, §28, §34, §36

# Correction strategy (stated before editing)

PR #220 (head `e20e45069a5353950dd7ec05c3a891d5a5336844`) classified all open `DEC-SUB-*` items, including `DEC-SUB-013`, as Class C in one blanket statement, while separately classifying §19.2's zero-fee liability-cap gap as conditional Class B. These two statements sit near each other without a stated relationship, creating an inconsistency: a reader could not tell whether `DEC-SUB-013`'s openness *is* the §19.2 condition, or something else. Strategy: inspect `DEC-SUB-013`'s exact governed scope on `origin/main`; determine precisely what it does and does not decide; separate it from the blanket `DEC-SUB-*` statement; classify it accurately (C, on its own terms, explicitly linked to — not merged with — the conditional-B §19.2 item); state an unambiguous operational rule; and split the finalization path into a Core-approval/configuration track (unconditional once CI-01 resolves) and a zero-fee-launch-readiness track (conditional, independent of `DEC-SUB-013`'s own resolution status).

# 1. PR #220 verification before editing

`gh pr view 220 --json headRefOid,state,mergeable` → `headRefOid: e20e45069a5353950dd7ec05c3a891d5a5336844`, `state: OPEN`, `mergeable: MERGEABLE` — matches the task's stated current head exactly.

# 2. Inspection of `DEC-SUB-013`'s governed scope

Read directly from `origin/main`'s `decision-register.md` (isolated worktree, `docs/dec-legal-002-bt-whole-recon-001`, still at head `e20e450` — no repository state changed since the original report was written):

- **Decision question:** "Will the platform offer complimentary plans (pilot businesses, partners, promotions), and under what governance?"
- **Status:** `OPEN_FOUNDER`, Priority D4.
- **Current confirmed position:** "**none**" — no complimentary/free/pilot program is currently authorized to exist.
- **Options identified:** (a) pilot-only complimentary via feature flags; (b) permanent free tier; (c) none.
- **Required by phase:** Phase 15 (pilot), at latest.

**Finding:** `DEC-SUB-013` decides *whether* zero-fee Business participation will exist at all, and under what governance — it does **not** decide, address, or resolve §19.2's separate legal question (what 11thONUS's liability cap produces for a Business that has paid no fees). These are independent questions. Resolving `DEC-SUB-013` toward a complimentary programme would not itself answer §19.2; §19.2 remaining unresolved does not itself require resolving `DEC-SUB-013`. The instruction "do not assume `DEC-SUB-013` itself settles the liability-cap rule if it does not" is confirmed correct on inspection — it does not.

# 3. Correction made

- **§8 (classification table):** split the combined `DEC-SUB-001/002/003/008/009/010/013` row into two rows — the six orthogonal items (unchanged, Class C) and `DEC-SUB-013` on its own row, Class C with an explicit note that it is linked to, not the same question as, the §19.2 conditional-B item.
- **§13 (Open `DEC-SUB-*` classification):** rewritten to state the precise relationship: `DEC-SUB-013` = Class C on its own terms (the Terms are complete without a complimentary-plans policy, like the other six items); explicitly linked to — not merged with — §19.2's conditional-B item; the actual trigger for that Class-B condition is *intent to onboard a zero-fee Business*, not `DEC-SUB-013`'s own resolution status; and, since `DEC-SUB-013`'s current position is "none," the conditional-B gate has no live trigger today. Added the unambiguous operational rule: *"No zero-fee Business — including any complimentary, free, or pilot Business — should be onboarded under the first configured Terms version while §19.2's zero-fee liability treatment remains unresolved,"* explicitly not triggered by `DEC-SUB-013` alone, and imposing no blocker at all if the initial launch cohort is fee-paying only.
- **§7 (NON-BLOCKING-3):** reworded to match — "conditional, not unconditional, launch dependency," trigger restated as intent to onboard, not `DEC-SUB-013`'s status.
- **§27/§28:** reworded to state the same precise trigger and cross-reference §13.
- **§34 (finalization path):** added an explicit split — the Core Terms approval/configuration track (steps 1–7) is complete and unconditional once CI-01 resolves, independent of §19.2/`DEC-SUB-013`; a new, separate "zero-fee Business launch readiness" track (7a–7b) states the conditional dependency and confirms it can be deferred indefinitely for a fee-paying-only launch.
- **§36 (Capability 3 closure condition):** clarified that the step-8 onboarding-acceptance verification uses a fee-paying test Business and does not require the zero-fee track resolved.
- Header version bumped 1.0 → 1.1; gate line updated to the task's specified success gate.

**Preserved unchanged, verified:** CI-01 remains the sole unconditional Class A blocker to final Core Terms approval; §19.2 does not block final Core Terms approval; §19.2 becomes Class B only if 11thONUS intends to onboard a zero-fee Business (including any complimentary/free/pilot Business); a fee-paying-only launch is not blocked by this issue. All nine §27.8 items, both §27.9 items, `DEC-ID-005`, `DEC-LOY-009`, and §20.3's six omitted mechanics remain classified exactly as before (untouched by this correction). `DEC-SUB-013` itself is not resolved; no liability cap is invented; §19.2 is not touched; no new legal research was performed.

# 4. Files modified

- `docs/05-implementation/reports/DEC-LEGAL-002-BT-WHOLE-RECON-001-whole-instrument-reconciliation-report-2026-09-03.md` (§7, §8, §13, §27, §28, §34, §36 corrected; header version → 1.1)
- `docs/00-governance/documentation-changes-log.md` (new entry)
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-WHOLE-RECON-001-CORR-001-correction-report-2026-09-03.md` (this file, created)

No Core Business Terms clause text touched. No Terms configuration. No Decision Register change. No Controlled Inputs Register or Drafting Traceability Matrix change (neither referenced the corrected relationship).

# 5. Diff summary

`git diff --stat` on the whole-instrument reconciliation report: 1 file changed, 24 insertions(+), 11 deletions(-) — confined to the seven sections listed in §3 above plus the header. No other file in the repository touched beyond the changes-log entry and this new correction report.

# 6. Commands executed

`gh pr view 220 --json headRefOid,state,mergeable`; direct `grep`/`sed` inspection of `decision-register.md`'s `DEC-SUB-013` entry on `origin/main` (isolated worktree, no state change); file edits via the editing toolchain; `git add`/`git commit`/`git push`.

# 7. Dependencies added / configuration changes / application-source changes

None. Docs-only correction to a read-only report.

# 8. Risks

Very low. This is a wording/classification-relationship correction within a single already-published assessment report; no governed document, clause text, or status field was touched.

# 9. Rollback instructions

Revert this task's commit on its branch (or, once merged, on `main`) to restore the prior (less precise) blanket wording; no application state, database, or configuration was touched by either version.

---

**Gate:** `WHOLE-INSTRUMENT RECONCILIATION CORRECTED — CI-01 REMAINS SOLE CORE-APPROVAL BLOCKER — ZERO-FEE BUSINESS LAUNCH CONDITION EXPLICITLY GOVERNED AS CONDITIONAL BLOCKER`
