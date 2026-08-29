> **Title:** DEC-LEGAL-002-FOUNDER-DISP-001 — Founder Disposition Recording & Legal-Counsel Handoff Report
> **Version:** 1.0 · **Status:** Founder product positions recorded; legal-counsel handoff ready; `DEC-LEGAL-002` remains OPEN_LEGAL · **Classification:** Working (implementation/preparation report)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md)
> **Date:** 2026-08-29 · **Task:** `DEC-LEGAL-002-FOUNDER-DISP-001`
> **Handoff pack:** [DEC-LEGAL-002-FOUNDER-DISP-001 Legal Counsel Handoff Pack](../../00-governance/decisions/evidence/DEC-LEGAL-002-FOUNDER-DISP-001-legal-counsel-handoff-pack-2026-08-29.md)

# DEC-LEGAL-002-FOUNDER-DISP-001 — Founder Disposition Recording & Legal-Counsel Handoff Report

## 1. Entry state

Branch `docs/eng-p3-002-closure-001`, continuing directly from the completed `DEC-LEGAL-002-PREP-001` package (six evidence documents plus the preparation report, all previously committed to the working tree as untracked additions). The prior turn of this task was blocked because the Founder-disposition text needed to record FD-1–FD-7 was an unfilled placeholder in the originating instruction; no repository changes were made at that point. This report covers the continuation, in which the Founder supplied the actual disposition text directly in chat, authorizing this recording.

## 2. Founder dispositions recorded

FD-1 through FD-7, recorded in full (not reduced to option letters where a stated qualification would be lost) in the [Founder Decision Sheet](../../00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-founder-decision-sheet-2026-08-29.md) v2.0:
- **FD-1:** re-prioritise the Business Terms component of `DEC-LEGAL-002` now, as an immediate Capability 3 dependency; broader legal/pilot-gate items retain Phase 14/15 timing; fail-closed implementation confirmed correct, not to be weakened.
- **FD-2:** suspension does not automatically extinguish validly earned rewards; the Business's obligation survives, subject to the Reward Program terms and a legally-impossible-fulfilment exception; not an unconditional continued-redemption requirement.
- **FD-3:** exit does not automatically extinguish validly earned rewards; the Business remains responsible; 11thONUS is not the guarantor/fulfiller.
- **FD-4:** 11thONUS may suspend/restrict a Business for governed trust/security/integrity/compliance reasons; no exhaustive grounds list fabricated; no transfer of reward-obligation responsibility to 11thONUS.
- **FD-5:** Businesses control prospective programme changes; may not retrospectively remove/materially reduce an already-earned reward.
- **FD-6:** rewards are not platform-held cash and create no general cash-withdrawal entitlement; not recorded as "no monetary value"; does not prejudge future gift-card/stored-value products.
- **FD-7:** Option A — general/structural subscription-terms framework may be prepared now; no `DEC-SUB-*` value invented or settled; no Subscription Plan UI or billing implementation authorized.

Plus the cross-cutting Founder principle governing FD-2–FD-5 (Business reward obligations survive Business-level events but remain Business obligations; 11thONUS standardizes trust, does not become one shared programme).

**These are Founder product/commercial positions informing `DEC-LEGAL-002`. They are not legal conclusions.**

## 3. Governance timing reconciliation

**Records identified as describing `DEC-LEGAL-002` only as Phase 14/15:** the Decision Register entry itself (`Required by: Phase 14/pilot`); Decision Resolution Plan v1 §6; the 11thONUS Master Workflow's Phase 15 row; the Coding-Agent Prompt Register's `ENG-P15-003` row.

**Correction applied — minimum scope, one file:** [`decision-register.md:1221`](../../00-governance/decisions/decision-register.md) — the `DEC-LEGAL-002` entry's `Required by` field now reads "Business Terms component — immediate (Capability 3 dependency, Founder-reprioritised 2026-08-29, `DEC-LEGAL-002-FOUNDER-DISP-001`); remaining legal/pilot-gate items — Phase 14/pilot (unchanged)," and its `Notes` field records the FD-1 disposition and cross-references the Founder Decision Sheet and Handoff Pack. `Status` (`OPEN_LEGAL`) and `Priority` (`D3`) are **unchanged** — this is not a resolution.

**Records deliberately left unchanged:** the Decision Resolution Plan v1, Master Workflow, and Coding-Agent Prompt Register retain their original Phase 14/15 framing. These are historical planning snapshots (already confirmed stale/non-live for current status purposes by the prior `ENG-P3-002-CLOSURE-001` report); editing them would constitute rewriting programme history, which this task's constraints prohibit. The Decision Register is the sole authoritative status record and is where the correction was made.

## 4. Files modified

- `docs/00-governance/decisions/decision-register.md` — `DEC-LEGAL-002` entry's `Required by`/`Notes` fields only; `Status`/`Priority` unchanged.
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-founder-decision-sheet-2026-08-29.md` — FD-1–FD-7 dispositions added (v1.0 → v2.0).
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-business-obligation-matrix-2026-08-29.md` — rows for honouring rewards, programme changes, suspension/termination, business exit, outstanding entitlements, platform suspension, and the Platform Responsibility Matrix's "Honouring rewards"/"Account suspension" rows updated to reflect Founder positions (v1.0 → v2.0).
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-product-legal-decision-brief-2026-08-29.md` — §A.3 (FD-1 resolution note) and §B.2/§B.3 (obligations, monetary value, programme changes) updated (v1.0 → v2.0).
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-legal-counsel-question-set-2026-08-29.md` — items 5–7 reframed from product-policy questions to legal-form questions; items 18–20 added (platform suspension grounds, reward monetary characterisation, general subscription-terms framework) (v1.0 → v2.0).
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-terms-content-architecture-2026-08-29.md` — Business Terms and Customer Terms headings annotated with Founder positions where applicable (v1.0 → v2.0).
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-resolution-plan-2026-08-29.md` — step 1 marked complete; step 2 narrowed to the remaining `DEC-LOY-011` linkage and genuinely open items (v1.0 → v2.0).
- `docs/changes/IMPLEMENTATION_CHANGES.md` — one new entry appended.

## 5. Files created

- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-FOUNDER-DISP-001-legal-counsel-handoff-pack-2026-08-29.md`
- `docs/05-implementation/reports/DEC-LEGAL-002-FOUNDER-DISP-001-founder-disposition-recording-report-2026-08-29.md` (this report)

## 6. Diff summary

One register-entry field edit (additive, no status/priority change); six evidence documents updated in place with clearly labeled "FOUNDER DISPOSITION" blocks and version bumps (no prior content deleted — original open-question framing is retained above each disposition block for traceability); one new counsel-facing handoff document; one new report; one changes-log append. No deletions of substantive prior content.

## 7. Counsel questions retained

Items 1–4 (relationship nature, acceptance sufficiency, disclosures), 8 (dispute allocation — genuinely unresolved), 9–17 (liability, governing law, jurisdiction, language, versioning, consumer protection, differentiated treatment) retained unchanged — none of these were answered by a Founder disposition.

## 8. Product questions removed/resolved

Not removed from the question set (retained for traceability, but reframed): items 5, 6, 7 now ask for legal form/wording/exceptions/remedies given a decided Founder position, not for counsel to choose the position. New items 18 (suspension grounds/process), 19 (reward monetary characterisation/disclosures), 20 (subscription-terms structural framework) added to cover FD-4, FD-6, FD-7 with the same legal-form framing.

## 9. Subscription boundary

FD-7 preserved precisely, in full substantive text, in the Founder Decision Sheet, the Terms Content Architecture, the Legal Counsel Question Set (item 20), and the Handoff Pack §3/§6. No `DEC-SUB-*` value (plan name, price, billing interval, staff limit, trial structure, complimentary/pilot plan, proration, grace period, billing ownership, tiering) was invented or settled anywhere in this task. No Subscription Plan UI or billing implementation was authorized or implied.

## 10. Legal drafting boundary

No final contractual clause was drafted anywhere in this task. All Terms Content Architecture content remains headings-only, annotated with Founder positions and open counsel questions, not clause text.

## 11. DEC-LEGAL-002 status

**OPEN_LEGAL**, Priority D3 — unchanged. Only the `Required by`/`Notes` fields were edited, per §3 above.

## 12. EXT-LEG-002 status

**PENDING** — unchanged.

## 13. Capability 3 status

**Open — engineering work packages complete; blocked on governed Terms-content configuration (DEC-LEGAL-002)** — unchanged. Not closed by this task.

## 14. Terms configuration status

**NOT CONFIGURED.** No Terms version, content, or effective date was written anywhere, in any environment.

## 15. Commands

Read-only inspection only: `grep`/`Read` of the existing decision-register entry to locate the exact text before editing. No build, test, deploy, or database command was run.

## 16. Dependencies

None added.

## 17. Config/application changes

**NONE.**

## 18. Risks

- The Decision Register's `Required by` field is now a compound statement (immediate for the Business Terms component; Phase 14/15 for the rest) rather than a single value — this is a deliberate, minimal correction, but a future reader relying on automated parsing of that field (if any exists) should be aware of the format change.
- `DEC-LOY-011` remains formally unresolved in the Decision Register even though FD-2 informs it — a future reader must not assume `DEC-LOY-011` itself has been recorded as CONFIRMED; it has not.
- The Legal Counsel Question Set now mixes "legal form of a decided position" questions with "genuinely open product question" questions (item 8) in the same numbered list — the v2.0 header note and each item's framing are intended to prevent counsel from mistaking one for the other, but this should be verified when the pack is actually sent.

## 19. Rollback

All changes are additive/in-place documentation edits plus two new files and one changes-log append. Rollback: revert the `decision-register.md` field edit; revert the six evidence-document edits to their `DEC-LEGAL-002-PREP-001` v1.0 state (each edit is isolated and clearly marked, so a partial revert is possible); `git rm` the two new files; revert the changes-log append. No non-doc system was touched.

## 20. Counsel handoff document path

`docs/00-governance/decisions/evidence/DEC-LEGAL-002-FOUNDER-DISP-001-legal-counsel-handoff-pack-2026-08-29.md`

## 21. Changes-tracking path

`docs/changes/IMPLEMENTATION_CHANGES.md` (new entry appended, dated 2026-08-29).

## 22. PR number/head/CI

None opened by this task. All changes remain in the working tree on branch `docs/eng-p3-002-closure-001`, uncommitted, pending Founder review before any commit/PR/merge.

## 23. Exact Founder next action

Review this recording for accuracy against the dispositions as given, then send the [Legal Counsel Handoff Pack](../../00-governance/decisions/evidence/DEC-LEGAL-002-FOUNDER-DISP-001-legal-counsel-handoff-pack-2026-08-29.md) to the Burundi legal adviser named as `EXT-LEG-002`'s owner-adviser. Separately, decide whether to make a formal `DEC-LOY-011` Decision Register recording now that FD-2 has informed it, or leave that as a distinct future governance action.

---

## FINAL GATE

**`DEC-LEGAL-002 FOUNDER PRODUCT POSITIONS RECORDED — LEGAL-COUNSEL HANDOFF READY; DEC-LEGAL-002 REMAINS OPEN PENDING LEGAL REVIEW`**
