> **Title:** DEC-LEGAL-002 Legal Opinion Reconciliation — Implementation/Governance Report
> **Version:** 1.0 · **Status:** Complete — docs-only, not merged · **Classification:** Working (governance record)
> **Task:** `DEC-LEGAL-002-LEGAL-OPINION-RECON-001`
> **Date:** 2026-08-29

# DEC-LEGAL-002 Legal Opinion Reconciliation Report

## 1. Entry repository state

Branch `docs/dec-legal-002-founder-disp-001`, HEAD `ac34d84` at task start, up to date with its own remote (`origin/docs/dec-legal-002-founder-disp-001`), 1 commit ahead of `origin/main`. No open PR for this branch (`gh pr list --head docs/dec-legal-002-founder-disp-001` returned empty). No incomplete git operations (no `MERGE_HEAD`/`REBASE_HEAD`/lock files). Working tree had 16 untracked paths at entry, including the supplied external Legal Opinion (`docs/Comprehensive Legal Opinion & Core Terms Framework (DEC-LEGAL-002 Handoff).md`) and 15 unrelated untracked files/directories (`WORKING_WITH_THE_FOUNDER/`, several `docs/00-governance`/`docs/01-product`/`docs/05-implementation/reports`/`docs/06-engineering-governance` files, `docs/07-product-design.zip`, `docs/11thONUS-at-a-Glance.md`, `docs/30-go-to-market/`) — all left untouched by this task; none staged, committed, or read beyond what was necessary to confirm they were out of scope.

## 2. Entry HEAD/origin-main state

`HEAD` = `ac34d84df2c83a671998b11c0e157616922869ac` ("docs(PR-201-REVIEW-CORR-001): correct TRD23/DEC-LOY-011 contradiction..."). `origin/main` is 1 commit behind `HEAD` (this branch carries one unmerged commit ahead of `main`; `origin/main` has no commits `HEAD` lacks). No fetch/merge conflicts.

## 3. Reconciliation strategy

Reviewed the current merged `DEC-LEGAL-002` governance package (Legal Counsel Handoff Pack, Founder Decision Sheet, Business Obligation Matrix, Resolution Plan), the confirmed `DEC-LOY-011` entry, and `CDR-001`'s live Capability 3 status before touching any file. Read the supplied external Legal Opinion in full (521 lines, 20 sections). Cross-referenced each of the task's 13 Founder legal-architecture dispositions (LEG-FD-01–13) against the opinion's corresponding section(s), existing Founder positions (FD-1–FD-7, `DEC-LOY-011`), and live tracked authority (TRD13, TRD18, `businessLifecycleCommand.ts`) before recording any classification. Performed a targeted `grep`-based live-authority conflict search for each of the ten specific conflict patterns named in the task (§20) before drafting any correction — none were found, so no live-authority file required editing beyond the two register updates below. Built the reconciliation matrix, disposition record, resolution assessment, and drafting-readiness note as four separate, cross-linked evidence documents (matching this repository's existing per-topic evidence-document convention, e.g. the `DEC-LEGAL-002-PREP-001`/`DEC-LEGAL-002-FOUNDER-DISP-001` document sets) rather than one monolithic file, so each remains independently citable.

## 4. External legal opinion evidence treatment

Filed verbatim at [`DEC-LEGAL-002-LEGAL-OPINION-RECON-001-external-legal-opinion-body-2026-08-29.md`](../../00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-external-legal-opinion-body-2026-08-29.md), with a provenance/integrity header prepended (source, date, task, "filed verbatim — header is the only addition") and no wording, structure, or table content altered. The original loose working file at `docs/Comprehensive Legal Opinion & Core Terms Framework (DEC-LEGAL-002 Handoff).md` (untracked, never committed) was removed after its content was copied into the governed evidence location — no history was lost since it was never tracked.

## 5–17. LEG-FD-01 through LEG-FD-13 dispositions

Recorded in full in the [Founder Legal Architecture Disposition Record](../../00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md). Summary:

- **LEG-FD-01** (Global-standard fallback interpretive principle) — APPROVED, adopted as cross-cutting principle.
- **LEG-FD-02** (Language architecture) — APPROVED; EN/FR remain core; Kirundi may be used for accessibility/communication, not general app localization.
- **LEG-FD-03** (Electronic acceptance) — APPROVED WITH QUALIFICATION; existing versioned-acceptance architecture confirmed sound; forced scrolling not made universal.
- **LEG-FD-04** (Reward value characterisation) — APPROVED WITH CORRECTION; FD-6 preserved; "no monetary/economic value" phrasing rejected.
- **LEG-FD-05** (Programme-change notice) — APPROVED, reasonable-notice standard, no universal 30-day rule.
- **LEG-FD-06** (Suspension process) — APPROVED, principle-based, no universal 7/14/24/48 periods.
- **LEG-FD-07** (Exit/run-off) — APPROVED WITH QUALIFICATION, no universal 60-day period.
- **LEG-FD-08** (Cash settlement on exit) — recommendation NOT adopted as a global rule; 11thONUS not the funder.
- **LEG-FD-09** (Customer data characterisation) — QUALIFIED; "data as consideration" rejected; lawful-basis processing confirmed.
- **LEG-FD-10** (Customer Terms architecture) — APPROVED IN PRINCIPLE; determined a separate future work package, not a Capability 3 blocker.
- **LEG-FD-11** (Dispute architecture) — APPROVED AT PRINCIPLE LEVEL; forum/seat/rules explicitly not decided.
- **LEG-FD-12** (Complaint handling) — APPROVED; no SLA adopted.
- **LEG-FD-13** (Terms changes/reacceptance) — APPROVED AT PRINCIPLE LEVEL; a new future engineering decision identified (not created) for reacceptance-on-change.

## 18. Full reconciliation classification summary (A–F)

20 opinion sections classified in the [Reconciliation Matrix](../../00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-reconciliation-matrix-2026-08-29.md): A (confirms) 8 rows in whole/part, B (qualified/accepted) 6 rows, C (jurisdiction-specific) 3 rows, D (new recommendation requiring governance) 5 rows, E (conflicts, reconciled) 4 rows, F (deferred to another family) 2 rows (rows 8 and 13, both pointing to the same outstanding dispute-forum decision). Engineering authorization = NO on every row.

## 19. Jurisdiction architecture result

Confirmed consistent with existing authority: Layer 1 (Global/Core), Layer 2 (Jurisdictional overlay, Burundi first, not a permanent perimeter), Layer 3 (Business Reward Program Rules). No unsupported jurisdictional requirement invented. Full detail in the [Terms Drafting Readiness Note](../../00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-terms-drafting-readiness-2026-08-29.md) §1.

## 20. Burundi-language treatment

Kirundi remains an "architecture-ready" language (TRD13, unaltered) usable for customer communication/legal-accessibility materials; it is not made a general application language. No product localization introduced.

## 21. Reward-value characterization result

FD-6 preserved exactly; the opinion's "no monetary/cash value" and "no economic value" phrasing is corrected to "not redeemable for cash unless the Reward Program expressly states otherwise; may have economic value." The opinion's regulatory-avoidance conclusion (no BRB/BNR e-money/payments licensing triggered) is retained as useful input.

## 22. Exit/run-off treatment

Obligation-survival confirmed (matches FD-3); the opinion's mandatory 60-day run-off period is not adopted as a universal rule — a reasonable transition/run-off arrangement is required where necessary, with specifics left to the applicable Reward Program/law/future minimum standard.

## 23. Cash-settlement treatment

The opinion's mandatory cash-conversion-on-exit duty is not adopted as a universal 11thONUS or Business rule; cash compensation is recorded as a possible remedy in some circumstances, not a blanket requirement; 11thONUS is confirmed not responsible for funding any such remedy.

## 24. Customer-data characterisation

The opinion's "data as consideration"/"data licensing" framing is not adopted. Controlled position: 11thONUS processes personal data under the applicable lawful basis and privacy framework; Terms of Use and privacy instruments perform different legal functions. The full privacy architecture remains out of `DEC-LEGAL-002`'s scope (`DEC-LEGAL-001`/`EXT-LEG-001` unaffected).

## 25. Subscription-boundary result

FD-7 confirmed unchanged; the opinion's own "what should NOT be drafted now" list (§20) matches FD-7's prohibited list. No `DEC-SUB-*` status touched.

## 26. Customer Terms architecture result

Four-instrument model confirmed (Core Business Terms; Customer Terms/Platform Terms of Use; Business Reward Program Rules; Jurisdictional Overlays applied to the relevant instrument, not a fifth document).

## 27. Customer Terms / Capability 3 blocking assessment

Determined **not** a blocker. Verified directly against `functions/src/domains/business/services/businessLifecycleCommand.ts`'s `assertCurrentBusinessTermsAccepted`, which gates `submitBusinessForVerification` on a Business Terms acceptance only — no Customer Terms acceptance gate exists in the current onboarding flow. `CDR-001` §5's Capability 3 blocker language already refers to the Business Terms component specifically.

## 28. Live-authority conflict search result

Ten targeted `grep` searches run across `docs/` for: "no monetary/economic value" phrasing, "60-day" run-off, "cash conversion"/"cash settlement," "30-day...notice," "7/14/24/48" suspension periods, "data as consideration," "Kirundi" as general app language, "forced scrolling," `DEC-LEGAL-002` mentions, and "Customer Terms" as a Capability 3 blocker. Findings: every "no monetary value" hit is in already-Founder-approved FD-6 text that *already* correctly rejects the blanket phrasing (harmless reference, not a conflict); the "60-day" hit is in `DEC-LEGAL-006` (cross-border hosting, an unrelated topic — harmless reference); "24 hours"/"48 hours" hits in TRD18 concern feature-flag/rollout-version defaults, not Business suspension (harmless reference, no conflict); "Kirundi" hits are consistently scoped as "architecture-ready," not a general application language (current live authority, no conflict); zero hits for "cash conversion," "30-day...notice," "data as consideration," "forced scroll," or "Customer Terms" as a Capability 3 blocker. **No material conflict found; no live-authority file required correction.**

## 29. EXT-LEG-002 status recommendation/change

Changed `PENDING` → `EVIDENCE_RECEIVED` in [External Dependencies Register](../../00-governance/decisions/external-dependencies-register.md), per that register's and the Legal Counsel Handoff Pack's own already-specified resolution-sequence step 2. Not changed to `CLOSED` — one Founder decision and several qualified/declined recommendations remain, per the Reconciliation Matrix.

## 30. DEC-LEGAL-002 status recommendation

`Status` field left unchanged (`OPEN_LEGAL`) — a `Notes`-field addendum was recorded instead, following the existing FD-1 precedent of updating Notes without flipping Status. See the [Resolution Assessment](../../00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-resolution-assessment-2026-08-29.md) §2/§6 for the reasoning and the recommendation left to Founder judgment.

## 31. Core Business Terms drafting-readiness assessment

14 of 16 Business Terms sections are ready to draft on principle-based language now. The Disputes/corrections section requires the Founder's forum/seat/rules selection first; the Liability section requires a Founder/legal cap-figure decision (already flagged "fully open" in the pre-existing Legal Counsel Handoff Pack §5, not narrowed by this reconciliation). Full section-by-section table in the [Terms Drafting Readiness Note](../../00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-terms-drafting-readiness-2026-08-29.md) §3.

## 32. Remaining Founder decisions

1. Dispute-resolution forum/seat/rules (Business↔Platform disputes clause) — the single concrete blocking decision.
2. Liability cap figures (Business and customer liability limits) — already-flagged open item, unresolved.
3. Whether to set a future 11thONUS minimum-standard numeric value for programme-change notice/suspension periods/exit run-off length — non-blocking, optional future decision.
4. Whether/how to authorize a dedicated reacceptance-on-Terms-change engineering decision — non-blocking for drafting, needed before that specific future implementation.

## 33. Remaining legal dependencies

Final Terms content drafting, Founder approval, and version-identifier assignment/configuration remain future, separately-authorized steps (Legal Counsel Handoff Pack §10, steps 5–8) — none performed or authorized by this task.

## 34. Files modified

**Created:**
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-external-legal-opinion-body-2026-08-29.md`
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md`
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-reconciliation-matrix-2026-08-29.md`
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-resolution-assessment-2026-08-29.md`
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-terms-drafting-readiness-2026-08-29.md`
- `docs/05-implementation/reports/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-reconciliation-report-2026-08-29.md` (this report)

**Modified:**
- `docs/00-governance/decisions/decision-register.md` (header "Last controlled update" chain entry; `DEC-LEGAL-002` `Notes` field addendum — `Status` unchanged)
- `docs/00-governance/decisions/external-dependencies-register.md` (`EXT-LEG-002` row: Status `PENDING` → `EVIDENCE_RECEIVED`, Evidence location populated)
- `docs/changes/IMPLEMENTATION_CHANGES.md` (append-only entry added)

**Removed:**
- `docs/Comprehensive Legal Opinion & Core Terms Framework (DEC-LEGAL-002 Handoff).md` (untracked working file; content preserved verbatim at its new governed evidence location above)

**Left untouched (unrelated, pre-existing untracked):** `WORKING_WITH_THE_FOUNDER/`, `docs/00-governance/verified-loyalty-governance-freeze-v1.md`, `docs/00-governance/verified-loyalty-principles.md`, `docs/01-product/11thONUS Product Manifesto.md`, five files under `docs/05-implementation/reports/`, `docs/06-engineering-governance/decision-resolution-plan-v1.md`, `docs/06-engineering-governance/decision-sprint-01-loyalty-foundations-preparation.md`, `docs/07-product-design.zip`, `docs/11thONUS-at-a-Glance.md`, `docs/30-go-to-market/`.

## 35. Code/diff summary

Docs-only. No `functions/`, `apps/web/`, `firestore.rules`, `firebase.json`, dependency, lockfile, or CI-configuration change of any kind.

## 36. Commands executed

`git branch --show-current`; `git log -1`; `git fetch origin`; `git rev-list --left-right --count origin/main...HEAD`; `git status`; `ls -la .git` (incomplete-op check); `gh pr list --head docs/dec-legal-002-founder-disp-001`; multiple `grep`/`find` read-only searches across `docs/`; `mkdir -p` for the evidence directory (already existed); `cp`/`cat`/`mv` to file the opinion with its provenance header; `rm` of the now-superseded loose root copy.

## 37. Dependencies added

None.

## 38. Config changes

None.

## 39. Application/source changes

**NONE.** No `functions/`, `apps/web/`, Firestore Rules, or Firebase configuration file was read for modification purposes (only `businessLifecycleCommand.ts` was read, read-only, to verify the Capability 3 blocking assessment in item 27).

## 40. Validation performed/results

Documentation-only task; no test suite applicable. Validation consisted of: (a) the 10-pattern live-authority conflict grep sweep (item 28), all clear; (b) direct source inspection confirming the Capability 3 blocker is Business-Terms-only (item 27); (c) cross-reading every new evidence document against the task's own §1–§23 instructions to confirm no application/Terms/Firebase change was made and no unrelated decision was touched.

## 41. Risks

- The Reconciliation Matrix and Disposition Record are lengthy governance artifacts; a future reader relying on a section in isolation (rather than the full document) could miss a qualification recorded elsewhere in the same document — mitigated by consistent cross-linking between all four evidence documents and the Decision Register `Notes` addendum.
- `EXT-LEG-002`'s `EVIDENCE_RECEIVED` status could be misread as "legal question fully closed" — mitigated by the Evidence-location cell's own inline caveat and the Resolution Assessment §1's explicit distinction from `CLOSED`.

## 42. Rollback instructions

Revert the single commit this task produces (or, file-by-file: restore `decision-register.md` and `external-dependencies-register.md` to their pre-task content via `git checkout <pre-task-SHA> -- <path>`; delete the five new evidence files and this report; remove the `IMPLEMENTATION_CHANGES.md` entry appended by this task; the removed loose opinion file is not recoverable via git since it was never tracked, but its content is fully preserved verbatim in the new evidence file, which is itself the intended replacement location).

## 43. Governance implementation report path

`docs/05-implementation/reports/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-reconciliation-report-2026-08-29.md` (this file).

## 44. Persistent `.md` changes-file path

`docs/changes/IMPLEMENTATION_CHANGES.md` (append-only entry for `DEC-LEGAL-002-LEGAL-OPINION-RECON-001`).

## 45. Branch

`docs/dec-legal-002-founder-disp-001` (continued — already dedicated to `DEC-LEGAL-002` governance work, matches existing repository practice of sequential commits on one feature branch pending Founder merge; no new branch created).

## 46. Commit SHA

Recorded in the PR/commit created immediately following this report (see repository history after this task).

## 47. PR number/status if created

To be opened per this repository's established workflow; not self-merged.

## 48. Exact Founder next action

Review this reconciliation package and, if satisfied: (a) decide the dispute-resolution forum/seat/rules (the one concrete blocking decision); (b) decide or defer the liability-cap figures; (c) authorize Core Business Terms drafting to proceed section-by-section per the Drafting Readiness Note; (d) merge this branch/PR. No Terms text, Terms version, or application/Firebase configuration should be created until (a)–(c) are complete.

---

**Final gate:** **`DEC-LEGAL-002 RECONCILIATION` — `DEC-LEGAL-002 LEGAL OPINION RECONCILED — FOUNDER DECISIONS REMAIN BEFORE TERMS DRAFTING`** (Gate B). Core Business Terms are substantially drafting-ready (14 of 16 sections), but the Disputes/corrections section and the Liability section each require a specific outstanding Founder decision the task's own governing instructions withhold authority to invent. `DEC-LEGAL-002` Status remains `OPEN_LEGAL`; `EXT-LEG-002` is now `EVIDENCE_RECEIVED`; Capability 3 remains blocked on the Business Terms component only (unaffected by Customer Terms, which are a separate future work package); no Terms version configured; no application/source/Firebase change made.
