> **Title:** DEC-LOY-011/TRD17 Live Authority Synchronization Report
> **Version:** 1.0 · **Status:** TRD17 §17.18–17.20 synchronized to the CONFIRMED `DEC-LOY-011` decision; `DEC-LEGAL-002` counsel handoff untouched and intact · **Classification:** Working (implementation/governance report)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md)
> **Date:** 2026-08-29 · **Task:** `DEC-LOY-011-TRD17-SYNC-001`

# DEC-LOY-011/TRD17 Live Authority Synchronization Report

## 1. Entry repository state

Branch `docs/eng-p3-002-closure-001`. Working tree carried the exact, previously-reported `DEC-LOY-011-RECON-001` state (`decision-register.md` net +15 lines; `IMPLEMENTATION_CHANGES.md` +128 lines; the same set of evidence/handoff/report files). Confirmed via `git status --porcelain=v1` and `git diff --stat` before any edit in this task.

## 2. Existing work preservation

Confirmed unchanged before editing (§1). No git mutation command (checkout/restore/reset/clean/stash/commit/merge) was run at any point. This task's edits touch only `docs/02-technical/trd/17-subscription-and-billing.md` (new) and `docs/changes/IMPLEMENTATION_CHANGES.md` (append) — no file from the `DEC-LEGAL-002-FOUNDER-DISP-001`/`DEC-LOY-011-RECON-001` work was modified or re-touched.

## 3. TRD17 stale wording identified

`docs/02-technical/trd/17-subscription-and-billing.md`:
- **Line 435 (§17.18):** "Rules for redemption during business suspension shall be clearly defined." — stated as a future obligation to define the rule, which was true when `DEC-LOY-011` was `OPEN_FOUNDER` but is no longer accurate now that it is `CONFIRMED`.
- **Line 449 (§17.19):** "Earned rewards should remain visible, but redemption rules during suspension must be governed explicitly." — the "must be governed explicitly" clause asserted the rule was still outstanding.
- **§17.20 (lines 451–460, prior to this task):** stated the general platform-access-vs-business-obligation distinction and that suspension does not automatically erase valid rewards, but did **not** state the specific confirmed rule: default redeemability, the commercial/subscription-suspension carve-out, or the governed-exception categories — so it was incomplete relative to the now-confirmed decision, not merely stale wording.

## 4. Exact synchronization applied

- §17.18: reworded to state the rule is defined in §17.20, citing `DEC-LOY-011` (CONFIRMED).
- §17.19: reworded to remove the "must be governed explicitly" (still-outstanding) framing, pointing to §17.20.
- §17.20: added an explicit **Traceability** note citing `DEC-LOY-011` (CONFIRMED, `DEC-LEGAL-002-FOUNDER-DISP-001`, 2026-08-29) and stating the Decision Register is the authoritative record of the decision and its historical options; added four new subsections stating the confirmed technical requirement without inventing implementation: **"Redemption during suspension — default rule"** (default redeemability; commercial/subscription-suspension carve-out), **"New activity vs. redemption"** (cross-references the existing §17.19 restriction list rather than inventing new restrictions), **"Governed exceptions"** (states the fraud/security/integrity/legal-regulatory/disputed-validity exception categories and explicitly flags the exception-handling workflow as **not designed by this requirement** — a documented future implementation gap, not implemented here), and **"Responsibility"** (Business remains responsible for fulfilment; 11thONUS is not the guarantor/fulfiller).

No other section of TRD17 was touched. No subscription/billing mechanics, plan-catalogue content, or unrelated requirement was rewritten.

## 5. DEC-LOY-011 traceability

TRD17 §17.20 now explicitly names `DEC-LOY-011`, its `CONFIRMED` status, the recording task (`DEC-LEGAL-002-FOUNDER-DISP-001`), the date, and links to the Decision Register as the authoritative source of the decision and its preserved historical options — satisfying Phase C without duplicating the Decision Register's content into TRD17.

## 6. Other live-authority conflicts discovered

**None found in `docs/02-technical/` or `docs/01-product/`** (searched for "redeemable while a business," "redemption during... suspension," "redemption rules during," "suspension... redemption," and "earned rewards... suspend"). TRD17 was the only technical document the Decision Register itself names as "Affected documents" for `DEC-LOY-011`, and it was the only technical document found referencing the topic at all.

**Found but out of scope to edit (reported, not touched):** `docs/00-governance/decisions/founder-decision-agenda.md` item B6 ("Do earned rewards survive if the business stops paying us? — DEC-LOY-011") still frames the question as an open agenda item with its four original options. This is a Founder task-list/agenda document, not a live *technical* requirements document — the task scoped live-authority conflict-checking to technical documents, and editing a Founder agenda item is a distinct governance action (marking a Batch B item as addressed) not authorized by this task. Flagged for the Founder's awareness rather than corrected.

## 7. DEC-ID-005 status

**Unchanged — OPEN_FOUNDER.** Not touched by this task. `docs/00-governance/decisions/decision-register.md` was not edited at all in this task (confirmed via `git diff --stat`, showing only the pre-existing diff from the prior `DEC-LOY-011-RECON-001` task, unchanged in this turn).

## 8. DEC-LEGAL-002 status

**OPEN_LEGAL**, Priority D3 — unchanged, not touched by this task.

## 9. EXT-LEG-002 status

**PENDING** — unchanged.

## 10. Capability 3 status

**Open — engineering work packages complete; blocked on governed Terms-content configuration (DEC-LEGAL-002)** — unchanged; unaffected by a TRD-documentation synchronization.

## 11. Terms configuration status

**NOT CONFIGURED.** No Terms version, content, or effective date was written anywhere, in any environment.

## 12. Future implementation gaps discovered

Documented in TRD17 §17.20 rather than implemented: **the exception-handling workflow** — how a fraud/security/integrity/legal-regulatory/disputed-validity exception is detected, triggered, evaluated (e.g., by whom, what review process), and resolved (how/when redemption resumes) — does not yet exist and is not designed by this requirement. This is explicitly named as a future, separately-governed engineering work package. No manual-review workflow, suspension-engine change, new lifecycle state, or callable/API behavior was designed or implied.

## 13. Files modified

- `docs/02-technical/trd/17-subscription-and-billing.md` — §17.18, §17.19, §17.20 (documentation only).
- `docs/changes/IMPLEMENTATION_CHANGES.md` — one new entry appended.

## 14. Diff summary

One TRD chapter received a traceability citation plus an expanded, previously-implicit requirement statement across three sub-sections (net +14/-3 lines); no other TRD chapter, PRD, or code file touched. One changes-log append. No deletion of any confirmed requirement — the pre-existing platform-access-vs-business-obligation distinction and "does not automatically erase" statement are preserved verbatim, with the new material added around them.

## 15. Commands executed

Read-only: `git status --porcelain=v1`, `git diff --stat` (both before and after edits); `grep`/`Read` of `17-subscription-and-billing.md` before editing; `grep -rn` across `docs/02-technical/` and `docs/01-product/` for other live-authority conflicts; `grep`/`Read` of the Decision Register to re-verify `DEC-LOY-011`/`DEC-ID-005`/`DEC-LEGAL-002` statuses post-edit. Checked `package.json` for repository validation tooling — no documentation/governance-specific validator exists (only `eslint` for code and a Firebase emulator test command, neither applicable to markdown); validation was performed via the targeted greps/reads listed above and in §19. No build, test, deploy, or database command was run. No git mutation command was run.

## 16. Dependencies added

None.

## 17. Config changes

None.

## 18. Application/source-code changes

**NONE.**

## 19. Validation results

1. `DEC-LOY-011` remains `CONFIRMED` — verified (`decision-register.md:484`).
2. TRD17 no longer represents its central redemption question as unresolved — verified: the "must be governed explicitly" / "shall be clearly defined" phrasing was removed; §17.20 now states the confirmed rule.
3. TRD17 does not overstate the confirmed decision — verified: no manual-review workflow, suspension-engine behavior, lifecycle state, or API/UI behavior was asserted as existing; the exception-handling workflow is explicitly labeled undesigned.
4. `DEC-ID-005` remains open — verified (`decision-register.md:589`, `OPEN_FOUNDER`, untouched).
5. `DEC-LEGAL-002` remains `OPEN_LEGAL` — verified (`decision-register.md:1221`, untouched by this task).
6. No application/source/config code changed — verified via `git diff --stat` (only the two doc files listed in §13).
7. Existing `DEC-LEGAL-002` counsel-handoff material remains intact — verified via `git status --porcelain=v1`: all `DEC-LEGAL-002-PREP-001`/`DEC-LEGAL-002-FOUNDER-DISP-001` evidence/handoff/report files remain listed exactly as before, none re-touched.

## 20. Risks

- TRD17's new "Governed exceptions" text names five exception categories (fraud, security, integrity, legal/regulatory, disputed validity) taken verbatim from the Founder's `DEC-LOY-011` disposition text — a future engineering task designing the exception workflow should treat this list as the Founder-approved category set, not add categories unilaterally.
- The Founder Decision Agenda's B6 item (§6 above) still reads as an open agenda item; if left unaddressed, a reader consulting only that document (rather than the Decision Register) could believe `DEC-LOY-011` remains undecided. Not corrected here — flagged as a minor, non-technical inconsistency for the Founder's discretion.

## 21. Rollback instructions

Both changes are additive, in-place documentation edits. Rollback: revert the three-section edit to `docs/02-technical/trd/17-subscription-and-billing.md`; revert the changes-log append. No non-doc system was touched.

## 22. Markdown implementation/governance report path

`docs/05-implementation/reports/DEC-LOY-011-TRD17-SYNC-001-live-authority-synchronization-report-2026-08-29.md` (this report).

## 23. Persistent changes-file path

`docs/changes/IMPLEMENTATION_CHANGES.md` (new entry appended, dated 2026-08-29).

## 24. Exact Founder next action

Review this synchronization for accuracy. No further action is required to keep TRD17 consistent with the `DEC-LOY-011` resolution. Optionally, mark the Founder Decision Agenda's B6 item as addressed (a separate, non-technical governance action not performed by this task).

---

## FINAL GATE

**`DEC-LOY-011/TRD17 LIVE AUTHORITY SYNCHRONIZED — DEC-LEGAL-002 COUNSEL HANDOFF REMAINS READY — NO APPLICATION OR TERMS CONFIGURATION CHANGE`**
