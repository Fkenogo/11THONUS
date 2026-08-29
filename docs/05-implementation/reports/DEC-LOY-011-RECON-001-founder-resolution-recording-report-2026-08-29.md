> **Title:** DEC-LOY-011 Founder Resolution Recording & DEC-LEGAL-002 Handoff Reconciliation Report
> **Version:** 1.0 · **Status:** `DEC-LOY-011` recorded CONFIRMED; `DEC-LEGAL-002` handoff reconciled and ready; `DEC-LEGAL-002` itself remains OPEN_LEGAL · **Classification:** Working (implementation/governance report)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md)
> **Date:** 2026-08-29 · **Task:** `DEC-LEGAL-002-FOUNDER-DISP-001` (continuation, following `DEC-LOY-011-RECON-001` read-only assessment)
> **Handoff pack (v2.0):** [DEC-LEGAL-002-FOUNDER-DISP-001 Legal Counsel Handoff Pack](../../00-governance/decisions/evidence/DEC-LEGAL-002-FOUNDER-DISP-001-legal-counsel-handoff-pack-2026-08-29.md)

# DEC-LOY-011 Founder Resolution Recording & DEC-LEGAL-002 Handoff Reconciliation Report

## 1. Entry repository state

Branch `docs/eng-p3-002-closure-001`. Working tree carried the exact, previously-reported `DEC-LEGAL-002-FOUNDER-DISP-001` state (`decision-register.md` +2/-1 lines; `IMPLEMENTATION_CHANGES.md` +85 lines; the same 9 evidence/report files). Confirmed via `git status --porcelain=v1` and `git diff --stat` before any edit in this task.

## 2. Preservation of existing uncommitted DEC-LEGAL-002 work

Confirmed unchanged before editing (§1). All edits in this task are additive/in-place refinements to the same six `DEC-LEGAL-002-PREP-001` evidence documents and the one `DEC-LEGAL-002-FOUNDER-DISP-001` handoff pack already in the working tree — no prior content was discarded, and no git operation that could alter history (checkout/restore/reset/clean/stash/commit/merge) was run.

## 3. Exact DEC-LOY-011 disposition recorded

Recorded in the [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LOY-011` entry, in full: "APPROVED WITH QUALIFICATION — OPTION A AS DEFAULT, SUBJECT TO GOVERNED EXCEPTIONS." Valid rewards earned before Business suspension remain redeemable during suspension by default. Business suspension may stop or restrict new loyalty activity (new earning, new Reward Programs, other applicable Business capabilities) without automatically preventing redemption of already-earned rewards. Redemption may nevertheless be restricted, paused, or subject to additional review where the specific suspension reason makes continued redemption inappropriate or unsafe (suspected fraud, security/integrity concerns, legal/regulatory requirements, disputed reward validity, or another governed exception). Suspension arising solely from the Business's commercial relationship with 11thONUS (including subscription/payment status) does not by itself prevent redemption of otherwise valid earned rewards. The participating Business remains responsible for fulfilment; continued redemption does not make 11thONUS the guarantor or fulfiller. Legal counsel to advise on legally required exceptions, notices, remedies, and enforceability; operational governance to define how exceptional restriction/manual review is applied without making manual review the default.

## 4. DEC-LOY-011 final status

**CONFIRMED** (was `OPEN_FOUNDER`). Priority D2 unchanged. `Founder decision required` field updated to "No — resolved 2026-08-29." `Final decision`/`Decision date`/`Approved by` fields populated (Option (a) as default with governed exceptions; 2026-08-29; Founder).

## 5. Original options/history preserved

The original decision question and all four options (a)–(d) are preserved verbatim in the register entry, explicitly labeled "(preserved for historical traceability)" and "(historical, preserved — not superseded, resolved)" respectively, so the record shows what was asked and chosen, not just the outcome. The original "Recommended direction" note is likewise preserved, labeled "(historical)."

## 6. FD-2/DEC-LOY-011 reconciliation

The register entry, the Founder Decision Sheet (FD-2 section), the Product & Legal Decision Brief (§B.2), the Business Obligation Matrix ("Honouring valid rewards" row), the Terms Content Architecture ("Reward obligations" heading), and the Resolution Plan (step 2) were each updated to distinguish explicitly: **(1) survival of the earned obligation** — already confirmed pre-existing and reinforced by FD-2's legal-impossibility/counsel-override exception (informs `DEC-LEGAL-002`, recorded there, not re-recorded on `DEC-LOY-011`) — from **(2) default operational redeemability during suspension** — now resolved on `DEC-LOY-011` itself as Option (a) with governed exceptions. No document was left claiming the two are still separately open.

## 7. DEC-SUB-003 dependency finding and final treatment

**Finding (confirmed from the prior read-only assessment, re-verified):** `DEC-SUB-003` governs "Trial structure" (`decision-register.md:708-711`), not grace-period mechanics — the grace-period value actually lives in `DEC-SUB-008` ("Plan catalogue: BIF prices, billing intervals, **grace values**, proration"). `DEC-LOY-011`'s original `Dependencies: DEC-SUB-003 (grace)` field was a pre-existing register cross-reference error.

**Final treatment: dependency removed entirely, not replaced with `DEC-SUB-008`.** Because the approved position is Option (a) — redeemable by default regardless of any grace-period value — rather than the grace-only Option (b), the resolved decision does not condition on either `DEC-SUB-*` item. The `Dependencies` field now reads "— (`DEC-SUB-003` dependency removed 2026-08-29; see Notes)," with the Notes field explaining the removal rationale and noting that legal counsel/operational governance may still reference commercial/billing terms when designing the exception process, without the decision itself depending on them.

## 8. DEC-ID-005 impact

**Not resolved — remains OPEN_FOUNDER, correctly.** `DEC-ID-005`'s own question ("Does the MVP support owner-initiated suspension/pause of their own business, and with what effects?") is a broader feature-existence question, not answered by `DEC-LOY-011`'s narrower reward-redemption-mechanism resolution. Its `Dependencies` field was annotated (not its `Status`) to record that the `DEC-LOY-011` dependency is now resolved, while `DEC-ID-005` itself remains a separate, open Founder question. No other field of `DEC-ID-005` was touched.

## 9. Legal Counsel Question Set changes

Item 5 (v2.0 → v3.0) rewritten to fold in the `DEC-LOY-011` resolution alongside FD-2/FD-3: counsel is now asked about enforceability of the default-redeemable-with-governed-exceptions model, legally required exceptions/notices for the fraud/security/integrity/legal-regulatory/disputed-validity categories, and remedies — explicitly **not** asked to choose among the original throughout/grace-only/manual-review/blocked-until-reactivation options, since the Founder has already selected Option (a). Items 6–20 unchanged (none depended on the redemption-model choice). Header/version bumped to v3.0 with a note explaining the change.

## 10. Handoff Pack changes

Version bumped 1.0 → 2.0. §3 (FD positions) gained an explicit `DEC-LOY-011` paragraph under FD-2, stating the resolved default-redeemable-with-exceptions position in full. §4 (Business Obligation Matrix, counsel-relevant rows) and §5 (Platform/Business Responsibility Matrix) "Honouring valid rewards"/"Honouring rewards" rows updated so the "what counsel is asked to advise" column no longer includes "redemption mechanism" as an open choice — narrowed to enforceability/exceptions/notices/remedies. §7 (Counsel Question Set summary) and §8 (Decision/Evidence References) updated to reference the resolved `DEC-LOY-011` entry and the v3.0 Question Set. Footer statuses line updated to list `DEC-LOY-011` = CONFIRMED alongside the unchanged statuses.

## 11. Files modified

- `docs/00-governance/decisions/decision-register.md` — `DEC-LOY-011` entry (Status, Current confirmed position, Founder decision required, Dependencies, Final decision/date/approved, Notes); `DEC-ID-005` entry (Dependencies annotation only); §5 Register Summary counts (CONFIRMED 45→46, OPEN_FOUNDER 23→22); header "Last controlled update" note.
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-founder-decision-sheet-2026-08-29.md` — FD-2 heading and update block; FD-4 gap note; version 2.0 → 3.0.
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-business-obligation-matrix-2026-08-29.md` — "Honouring valid rewards" row; version 2.0 → 3.0.
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-product-legal-decision-brief-2026-08-29.md` — §B.2 honouring-rewards bullet; version note.
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-legal-counsel-question-set-2026-08-29.md` — item 5 rewritten; header note; version 2.0 → 3.0.
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-terms-content-architecture-2026-08-29.md` — "Reward obligations" heading; version note.
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-resolution-plan-2026-08-29.md` — step 2 marked complete; version note.
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-FOUNDER-DISP-001-legal-counsel-handoff-pack-2026-08-29.md` — §3, §4, §5, §7, §8, footer, header version 1.0 → 2.0.
- `docs/changes/IMPLEMENTATION_CHANGES.md` — one new entry appended.

## 12. Files created

- `docs/05-implementation/reports/DEC-LOY-011-RECON-001-founder-resolution-recording-report-2026-08-29.md` (this report).

## 13. Diff summary

One decision-register entry moved `OPEN_FOUNDER` → `CONFIRMED` with full historical traceability preserved; one adjacent decision-register entry (`DEC-ID-005`) had only its `Dependencies` field annotated; register-wide summary counts adjusted by 1; eight evidence/handoff documents received in-place, clearly-labeled additions or corrections (no deletion of substantive prior content — original open-question framing remains visible alongside each resolution note); one new report; one changes-log append. No new files besides this report (the Handoff Pack and other evidence documents already existed from the prior task and were edited, not recreated).

## 14. Commands

Read-only inspection: `git status --porcelain=v1`, `git diff --stat` (both before any edit); `grep`/`sed` reads of `decision-register.md`, `founder-decision-agenda.md`, and prior evidence files to locate exact text before editing. No build, test, deploy, or database command was run; no git mutation command was run.

## 15. Dependencies added

None.

## 16. Configuration changes

None.

## 17. Application changes

**NONE.**

## 18. DEC-LEGAL-002 status

**OPEN_LEGAL**, Priority D3 — unchanged. Not touched by this task beyond the pre-existing `DEC-LEGAL-002-FOUNDER-DISP-001` edit from the prior turn.

## 19. EXT-LEG-002 status

**PENDING** — unchanged.

## 20. Capability 3 status

**Open — engineering work packages complete; blocked on governed Terms-content configuration (DEC-LEGAL-002)** — unchanged. `DEC-LOY-011`'s resolution does not affect Capability 3's blocking condition, which is specifically the Terms-content decision, not the loyalty-suspension decision.

## 21. Terms configuration status

**NOT CONFIGURED.** No Terms version, content, or effective date was written anywhere, in any environment.

## 22. Risks

- `DEC-LOY-011`'s `Final decision` field now instructs "operational governance to define the exception/manual-review process" — this workflow does not yet exist and is not designed by this task; a future reader should not assume the exception-handling mechanism is built.
- TRD17 §17.19–17.20's own text ("redemption rules during suspension must be governed explicitly") is now satisfied by the Decision Register entry but TRD17 itself was **not edited** in this task (flagged in the register's own "Document corrections required" field as outstanding) — a reader consulting TRD17 directly would not yet see the resolved rule reflected there.
- The Legal Counsel Question Set's item 5 is now a compound question (obligation-survival + redemption-model enforceability); if the pack is split for counsel's convenience later, care should be taken not to lose the "not asked to choose the redemption model" framing.

## 23. Rollback instructions

All changes are additive/in-place documentation edits to files already in the uncommitted working tree, plus one new report and one changes-log append. Rollback: revert the `decision-register.md` `DEC-LOY-011`/`DEC-ID-005`/summary/header edits; revert the eight evidence/handoff-pack edits to their pre-this-task state (each edit is isolated and clearly marked); `git rm` this new report; revert the changes-log append. No non-doc system was touched.

## 24. Implementation/governance report path

`docs/05-implementation/reports/DEC-LOY-011-RECON-001-founder-resolution-recording-report-2026-08-29.md` (this report).

## 25. Changes-tracking path

`docs/changes/IMPLEMENTATION_CHANGES.md` (new entry appended, dated 2026-08-29).

## 26. Exact Founder next action

Review this recording for accuracy against the disposition as given, then send the updated [Legal Counsel Handoff Pack (v2.0)](../../00-governance/decisions/evidence/DEC-LEGAL-002-FOUNDER-DISP-001-legal-counsel-handoff-pack-2026-08-29.md) to the Burundi legal adviser. Separately, if desired, authorize the TRD17 §17.19–17.20 document correction the register's own `DEC-LOY-011` entry now calls for (not performed by this task).

---

## FINAL GATE

**`DEC-LOY-011 FOUNDER RESOLUTION RECORDED — DEC-LEGAL-002 LEGAL-COUNSEL HANDOFF RECONCILED AND READY FOR FOUNDER REVIEW — NO APPLICATION OR TERMS CONFIGURATION CHANGE`**
