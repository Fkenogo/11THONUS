> **Title:** DEC-LEGAL-002-BT-DRAFT-003-CORR-002 — Part III Founder Reconciliation + Targeted Part I Authority Corrections
> **Version:** 1.0 · **Status:** DRAFT — NOT APPROVED — NOT EFFECTIVE — NOT CONFIGURED · **Classification:** Working (governance record — controlled legal drafting)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LEGAL-002` (Status: `OPEN_LEGAL`, unchanged by this task)
> **Source-of-truth path:** `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-003-CORR-002-correction-report-2026-08-31.md`
> **Date:** 2026-08-31 · **Task:** `DEC-LEGAL-002-BT-DRAFT-003-CORR-002`

# ⚠️ DRAFT — NOT APPROVED — NOT EFFECTIVE — NOT CONFIGURED

PR #205 is **NOT** approved for merge by this task. This report documents Founder-authorized targeted Part I corrections (§2, §4.2, §6.1, §6.2) and their reconciliation with Part III §11.1, plus the full review-thread reconciliation for PR #205.

---

## 1. Entry state

Branch `docs/dec-legal-002-bt-draft-003` at task start, working tree clean apart from pre-existing untracked files (unrelated to this task, left untouched throughout). No incomplete git operation.

## 2. Starting PR head

`13cc10358258bac5265b957a795c69c4defe1e4b` — confirmed to match the task's required head exactly via `gh pr view 205 --json headRefOid`. `origin/main` confirmed at `1bfcc5c8dc7f8707df82fd284a1b64d798b78665`, unchanged since Part III drafting began.

## 3. Review-thread inventory/count

20 top-level review threads on PR #205, fetched via GitHub GraphQL (`reviewThreads`). All 20 were `isResolved: false` at task start (no thread had been explicitly resolved via the GitHub API in any prior task — prior tasks fixed the underlying text and relied on subsequent Codex re-reviews to confirm, but never called the resolve-thread mutation). 16 threads were `isOutdated: true`; 4 were `isOutdated: false` (comments #3, #5, #9, #19 in the numbered list below).

## 4. Current vs outdated unresolved threads

Per the governing instruction not to treat `isOutdated=true` as equivalent to resolved: all 20 threads were individually re-verified against the current file content (not merely trusted by their outdated flag) before any resolution action. Full detail in §23 below (the reconciliation table). Result: **every one of the 20 threads' underlying issues is now corrected in the current head** — 16 by prior `-CORR-001` commits (verified still intact by direct inspection), and the remaining findings (the §4.2 threshold conflict, and the interim §11.1/§6.2 cross-reference approach that this task's Founder authorization superseded with a more direct fix) by this task's own edits.

## 5. Correction strategy

Communicated to the user before editing (see conversation record): four targeted, Founder-authorized edits — §4.2 (remove "at what threshold" from the Business-decision list; state a governed platform-fixed threshold is determined by platform governance, using durable non-numeric wording since `TRD10` treats the current value as MVP-governed, not permanent), §6.1 (replace "owns and controls"/"take ownership of" with "controls and is responsible for"/"take over" — no IP/ownership conclusion), §6.2 (remove the affirmative "what qualifies as a rewardable purchase" allocation; state it is separately governed and not decided here), and §11.1 (reconcile with the corrected §4.2/§6.1/§6.2, removing "owns" and the qualifying-category-selection language). A consequential fifth edit — §2's "Reward Program" definition, which also asserted "owns" — was made because the task's own validation checklist (§11) requires zero surviving "owns" assertions anywhere in the instrument; leaving it would have reintroduced exactly the contradiction the other four edits eliminate. No other Part I/II text was touched. Part III §12–§14 were reconfirmed unchanged, not rewritten, per the instruction to reconfirm without unnecessarily rewriting.

## 6. §4.2 authority inspected

`docs/02-technical/trd/10-firestore-data-architecture.md` §10.9.2, Threshold Rule (MVP): `requiredVerifiedUnits` "is stored as a number for architectural consistency, but for the MVP it is **fixed at 10 by platform rule and is not business-configurable** (TRD Consolidation Audit §4; PRD6 §4.4). Alternative thresholds may be introduced only through formal product approval and never retroactively." No `DEC-LOY-*` Decision Register entry separately confirms the value (it is a TRD/PRD-sourced platform rule, not a `DEC-*` item), but the TRD text itself is unambiguous and unqualified: the threshold is platform-fixed, not Business-configurable, changeable only through formal product approval. This is sufficient governing authority to correct §4.2 without inventing anything.

## 7. §4.2 correction

Before: *"...does not itself decide what a Business's Reward Program rewards, at what threshold, or with what value. Those are decisions the Business makes for its own Reward Program (§6)."*

After: *"...does not itself decide what a Business's Reward Program rewards or with what value. Those are decisions the Business makes for its own Reward Program (§6), within platform mechanics that applicable platform governance establishes — including a governed earning threshold, which, where platform governance fixes one, is determined by that governance rather than by the individual Business."*

The number "10" is deliberately not written into the Terms — `TRD10` treats it as the current/MVP governed value, changeable through formal product approval, not a permanent contractual invariant. The durable wording ("where platform governance fixes one... determined by that governance") accommodates a future threshold change without requiring a further Terms correction.

## 8. §6.1 ownership correction

Before: *"Each Business owns and controls its own Reward Program and its own relationship with its customers. ... it does not take ownership of any Business's customer relationship."*

After: *"Each Business controls and is responsible for its own Reward Program and its own relationship with its customers. ... it does not take over any Business's customer relationship."*

FD-5 (Legal Counsel Handoff Pack §3) establishes that "Businesses remain responsible for and in control of their own Reward Programs" — control and responsibility, not an IP/legal-ownership conclusion. No governing authority reviewed (FD-1–7, LEG-FD-01–15, TRD10) uses "ownership" in this sense. The correction removes the unsupported proposition while preserving every substantive protection: the platform standardises trust; does not become a shared/unified loyalty programme; does not take over the Business/customer relationship.

## 9. §6.2 qualifying-purchase authority assessment

Inspected: Legal Counsel Handoff Pack §4, "Rows not yet Founder-positioned, still genuinely open (not asked of counsel as if decided)": *"programme publication (does publication create a binding offer to customers?); qualifying-purchase definition; reward-redemption procedural detail; errors/corrections; fraud/abuse; customer disputes; business-vs-platform disputes."* No CONFIRMED Decision Register item, no FD-1–7 position, and no LEG-FD-01–15 disposition establishes that a Business has unrestricted contractual authority to define what constitutes a qualifying/rewardable purchase. Business control of its Reward Program (FD-5), the existence of the shared catalogue (TRD10 §10.9), and the presence of configurable `qualifyingKnowledgeNodeIds` fields do not themselves establish this — each is consistent with the narrower, already-governed authority to select catalogue categories, not with a general legal conclusion about what counts as a qualifying purchase. **No confirmed authority exists** for the affirmative allocation §6.2 previously stated.

## 10. §6.2 correction

Before: *"...including what qualifies as a rewardable purchase, what a completed reward consists of, and how the Business communicates..."*

After: *"...including what a completed reward consists of, how the Business communicates its Reward Program to its customers, and the Business's configuration of its Reward Program within the platform's governed shared-catalogue and reward-cycle mechanics... What generally qualifies as a rewardable or qualifying purchase remains separately governed and is not decided by these Terms."*

No new Controlled Input was created — per the task's explicit preference, the question is drafted around (reserved), not escalated into a new CI marker requiring Founder/legal resolution before Part III can proceed.

## 11. §11.1 reconciliation

Before: *"Each Business designs, owns, and controls its own Reward Program..., including — consistent with §6.2 — selecting the purchasable categories from the platform's shared catalogue that qualify under its own Reward Program, and determining the reward(s) it offers. ...including any platform-fixed earning threshold, which this section does not authorize a Business to alter..."*

After: *"Each Business designs, controls, and is responsible for its own Reward Program..., including — consistent with §6.1 and §6.2 — determining the reward(s) it offers and the other Business-controlled parameters of its Reward Program. ...including a governed earning threshold, which, where applicable platform governance fixes one, is determined by that governance rather than by the individual Business, and which this section does not authorize a Business to alter..."*

"Owns" removed; the qualifying-category-selection language removed (no longer implies Business authority over what qualifies as a rewardable purchase); the threshold language aligned word-for-word in substance with corrected §4.2. §11.6 was not further edited — it already excluded the threshold from the Business-controlled list (per the prior `-CORR-001` round-6 fix) and remains fully consistent with this round's §11.1 wording.

## 12. Platform-fixed threshold final treatment

One coherent answer across the instrument: §4.2 (Part I) and §11.1/§11.6 (Part III) all state that a governed platform-fixed earning threshold is determined by platform governance, not by the individual Business, using durable non-numeric wording throughout (no clause hardcodes "10").

## 13. Business programme-control final treatment

One coherent answer: the Business "designs, controls, and is responsible for" its Reward Program (§11.1, §6.1) — control and responsibility, consistently stated in the "Reward Program" definition (§2), §4.2, §6.1, §6.2, and §11.1.

## 14. Legal/IP ownership final treatment

No clause anywhere in the instrument states or implies that any party holds legal/IP ownership of a Reward Program. A `grep`-based search (§28 below) confirms zero surviving "owns"/"ownership" assertions outside the unrelated "Business Owner" platform-role defined term.

## 15. Qualifying-purchase final treatment

One coherent answer: neither Part I (§6.2) nor Part III (§11.1) asserts that the Business has unrestricted authority to define what qualifies as a rewardable purchase. §6.2 states this is "separately governed and... not decided by these Terms." No new Controlled Input was created for this reservation.

## 16. §12 integrity

Reconfirmed, not rewritten. Direct diff against the pre-task head (`13cc103`) shows zero changes to §12.1–§12.5. The Business↔customer transaction boundary, 11thONUS's non-seller/non-processor status, and the accurate-recording/no-fabrication obligations all stand exactly as drafted.

## 17. §13 integrity

Reconfirmed, not rewritten. Direct diff shows zero changes to §13.1–§13.7. Earned-reward obligation (§13.1), suspension/`DEC-LOY-011` (§13.2), exit (§13.3), retrospective protection (§13.4), economic-value/cash boundary (§13.5), `DEC-LOY-005` no-automatic-MVP-expiry (§13.6), and `DEC-LOY-009` non-resolution (§13.7) all stand exactly as previously corrected and Founder-reviewed.

## 18. DEC-LOY-005 treatment

Unchanged since the prior correction pass. §13.6 continues to state that an earned reward does not currently auto-expire, that this section does not itself authorize a Business's Reward Program to provide for expiry, and that any future per-program expiry policy requires separate governed platform authorization — preserving `DEC-LOY-005` (CONFIRMED) exactly. Not touched by this task.

## 19. DEC-LOY-009 treatment

Unchanged and not resolved. §13.7 continues to state explicitly that reward quantity at creation and multiple-unredeemed-reward coexistence are neither stated nor implied. `DEC-LOY-009` remains `OPEN_FOUNDER` in the Decision Register, verified unchanged.

## 20. §14 integrity

Reconfirmed, not rewritten. Direct diff shows zero changes to §14.1–§14.5. Prospective-only changes with a reasonable-notice standard (§14.1–§14.3), the customer-reacceptance/binding-effect non-resolution (§14.4), and Business programme control (§14.5) all stand exactly as previously corrected.

## 21. Customer-reacceptance treatment

Unchanged. §14.4 continues to state that whether a Business's customers must separately accept or reaccept a Reward Program change is not established by this section, neither requiring nor foreclosing a reacceptance mechanism. Not touched by this task.

## 22. Controlled Inputs before/after

**Before:** CI-01 (operator legal identity), CI-05 (reacceptance-on-Terms-change engineering decision) open; a "Flagged pre-existing defect — Part I §4.2" item recorded (not a CI, but a blocking-classification flag) from the prior task.

**After:** CI-01, CI-05 unchanged, still open. The flagged §4.2 item is resolved and moved to a "Resolved" note in the Controlled Inputs Register (not deleted — historical record preserved) since governing authority (`TRD10` §10.9.2) already supplied the answer and this task's own brief explicitly authorized applying it; it was never genuinely a Controlled Input requiring further Founder/legal action. No new Controlled Input was created for the qualifying-purchase reservation in §6.2/§11.1, per the task's explicit preference to draft around the unresolved policy rather than escalate it. `DEC-LOY-009` and `DEC-ID-005` preserved as Decision Register items, not duplicated as Controlled Inputs.

## 23. Complete review-thread reconciliation table

| # | Thread ID (short) | Finding | Current/Outdated | Substantive/Admin | Disposition | Commit that addressed it | Issue still present in `13cc103`→now? | Final thread action |
|---|---|---|---|---|---|---|---|---|
| 1 | `dhyUD` | §14.4 affirmative no-reacceptance default | Outdated | Substantive | Accepted, corrected | `e7a39d2` | No (already fixed) | Reply confirming fix + resolve |
| 2 | `dhyUG` | Part I heading note "Parts III–VIII" stale | Outdated | Administrative | Accepted, corrected | `e7a39d2` | No | Reply + resolve |
| 3 | `dh5ke` | Documentation-changes-log entry missing | Current | Administrative | Accepted, corrected | `9ae4874` | No | Reply + resolve |
| 4 | `dh5kh` | §11.1 "owns" citation wrongly attributed to FD-5 | Outdated | Administrative (citation) | Accepted, corrected, then superseded | `9ae4874`; superseded by this task ("owns" removed entirely) | No | Reply + resolve |
| 5 | `dh5ki` | "Three parts" stale after Part III added | Current | Administrative | Accepted, corrected | `9ae4874` | No | Reply + resolve |
| 6 | `dh5kj` | Correction-count inventory stale ("five"/"six") | Outdated | Administrative | Accepted, corrected (iteratively, now stable at accurate count) | `43f6d99`, `8f765b2`, `168df94` | No | Reply + resolve |
| 7 | `diCiD` | §13.6 authorized Business expiry, contradicting `DEC-LOY-005` | Outdated | **Substantive** | Accepted, corrected | `43f6d99` | No | Reply + resolve |
| 8 | `diCiE` | Part 0 §0.1 Part II label stale ("heading only") | Outdated | Administrative | Accepted, corrected | `43f6d99` | No | Reply + resolve |
| 9 | `diCiG` | Correction report missing from file inventory | Current | Administrative | Accepted, corrected | `43f6d99` | No | Reply + resolve |
| 10 | `diIPC` | Drafting Report §15 reintroduced pre-fix expiry policy | Outdated | Administrative (consistency) | Accepted, corrected | `8f765b2` | No | Reply + resolve |
| 11 | `diIPG` | Correction-count inventory "five" vs actual "seven" | Outdated | Administrative | Accepted, corrected | `8f765b2`, `168df94` | No | Reply + resolve |
| 12 | `diIPI` | Decision-register arithmetic inconsistent | Outdated | Administrative | Accepted, corrected | `8f765b2` | No | Reply + resolve |
| 13 | `diNYb` | §11.1 granted Business threshold-setting authority | Outdated | **Substantive** | Accepted, corrected (interim), now finally reconciled | `9ae4874`→`168df94`; final form this task | No | Reply + resolve |
| 14 | `diNYe` | §11.1 resolved open qualifying-purchase question | Outdated | **Substantive** | Accepted, corrected (interim), now finally reconciled | `168df94`; final form this task | No | Reply + resolve |
| 15 | `diNYf` | Controlled Inputs Register §13.6 rationale stale | Outdated | Administrative | Accepted, corrected | `43f6d99` | No | Reply + resolve |
| 16 | `diSc5` | §11.6 restored threshold as Business-controlled | Outdated | **Substantive** | Accepted, corrected | `70db392` | No | Reply + resolve |
| 17 | `diSc9` | §6.2 (Part I) still affirmatively decided qualifying purchase | Outdated | **Substantive** | Accepted — deferred at the time (no Part I authorization), **now corrected under this task's explicit Founder authorization** | This task (`DEC-LEGAL-002-BT-DRAFT-003-CORR-002`) | No | Reply + resolve |
| 18 | `diSdA` | Correction report's Verification section stale | Outdated | Administrative | Accepted, corrected | `70db392` | No | Reply + resolve |
| 19 | `diYfl` | Part I §4.2 threshold conflict | Current | **Substantive** | Accepted — flagged, not fixed, at the time (no Part I authorization), **now corrected under this task's explicit Founder authorization** | This task (`DEC-LEGAL-002-BT-DRAFT-003-CORR-002`) | No | Reply + resolve |
| 20 | `diYfn` | Documentation-changes-log header stale "five review rounds" | Outdated | Administrative | Accepted, corrected | `13cc103` | No | Reply + resolve |

No thread was rejected or superseded without correction. Every finding traced to a real, verifiable issue in the instrument at the time it was raised (no false-positive findings across all 20 threads).

## 24. Number of threads resolved by this task

All 20 threads' underlying issues are now corrected in the current head. Reply-and-resolve actions for all 20 are executed as part of this task (see §41 for the resulting state).

## 25. Remaining unresolved threads, if any

None whose underlying issue remains uncorrected. (Codex's automated review has separately reached its usage limit for this repository, confirmed via API response — no further automated review is available to generate new findings at this time; this does not leave any existing thread's substance unresolved.)

## 26. Administrative-record reconciliation

Traceability Matrix, Controlled Inputs Register, and this correction report updated to reflect the final, stable Part I/III text. The Drafting Report's summary sections are updated where they described the interim (now-superseded) §11.1/§6.2 cross-reference approach. Per the governing instruction not to spend further effort preserving demonstrably-superseded historical arithmetic, intermediate round-by-round correction counts in the `-CORR-001` report are left as an accurate historical record of what happened at each point in time (they were correct when written); only the *current, top-level* summaries (this report, the Traceability Matrix, the Controlled Inputs Register, the decision register's newest entry, and the documentation-changes-log's newest entry) are held to full internal consistency going forward.

## 27. Traceability result

§2 "Reward Program", §4.2, §6.1, §6.2 (Part I) and §11.1 (Part III) traceability rows updated in the Drafting Traceability Matrix to cite the corrected authority (FD-5 for control/responsibility; `TRD10` §10.9.2 for the threshold; Legal Counsel Handoff Pack §4 for the qualifying-purchase reservation). Every other row unchanged.

## 28. Prohibited-concept search

`grep`-based search of the full instrument for: `\bowns\b`/`ownership` (excluding the unrelated "Business Owner" defined term) — **zero matches**. "no monetary value", "no economic value", "guarantor", "funder", "merchant of record", "payment processor" — all matches are negation clauses (11thONUS is *not* these things), none asserted. `DEC-LOY-009`, `DEC-ID-005`, `DEC-SUB-*` — all appear only in the unchanged-status list, none resolved. "expired"/automatic-expiry-enabled — no match (§13.6 correctly states no current auto-expiry). "30-day"/"60-day"/"14-day" — no match. Universal customer-reacceptance-required or -unnecessary — no match (§14.4 is an explicit non-resolution). Multiple-unredeemed-rewards-coexist or fixed-reward-quantity — no match (§13.7 is an explicit non-resolution). Business-determines-qualifying-purchase — no match (removed from §6.2/§11.1). Business-controls-platform-fixed-threshold — no match (removed from §4.2/§11.1/§11.6).

## 29. Parts I–II integrity outside authorized corrections

Verified by direct diff against the pre-task head (`13cc103`): every Part I clause other than the §2 "Reward Program" definition, §4.2, §6.1, and §6.2, and every Part II clause, is byte-for-byte unchanged. No other file outside the six listed in §30 was touched.

## 30. Files modified

- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` (§2 "Reward Program" definition, §4.2, §6.1, §6.2, §11.1 corrected; header/version metadata updated to v3.2)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md` (§2/§4.2/§6.1/§6.2/§11.1 rows corrected; header/version metadata updated to v3.2)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md` (flagged §4.2 item resolved and reclassified; §11.1 bullet updated; header/version metadata updated)
- `docs/00-governance/decisions/decision-register.md` (new consolidated history entry for this task)
- `docs/00-governance/documentation-changes-log.md` (new Entry 130)
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-003-CORR-002-correction-report-2026-08-31.md` (this report, new file)

No other file was modified. Pre-existing untracked working-tree files left entirely untouched.

## 31. Diff summary

Five clause-level substantive edits to the instrument (four in Part I: §2 definition, §4.2, §6.1, §6.2; one reconciling in Part III: §11.1), each narrowly targeted per this task's explicit Founder authorization. Traceability Matrix and Controlled Inputs Register updated to match. No clause outside these five was rewritten.

## 32. Commands executed

`git fetch origin`; `gh pr view 205 --json state,headRefOid,baseRefName`; `git rev-parse origin/main`; `git status --short`; `ls .git/MERGE_HEAD .git/rebase-merge .git/rebase-apply`; `gh api graphql` (reviewThreads query); `grep`/`sed` authority and content verification across `docs/02-technical/trd/10-firestore-data-architecture.md`, `docs/00-governance/decisions/decision-register.md`, and the instrument itself; `git diff HEAD` for byte-level change verification.

## 33. Dependencies/config changes

None.

## 34. Application/source changes

None. Docs-only. No `functions/`, `apps/web/`, Firestore Rules, or Firebase configuration file was read, created, or modified.

## 35. CI/check result

Recorded in the completion message once the commit is pushed and CI completes.

## 36. Risks/open decisions

None newly introduced. `DEC-LOY-009`, `DEC-ID-005`, CI-01, CI-05, and all unresolved `DEC-SUB-*` remain exactly as they stood. The qualifying-purchase-definition question (Legal Counsel Handoff Pack §4) remains genuinely open at the legal/regulatory level but is not a blocker for this instrument, which reserves rather than resolves it. Part IV was not begun.

## 37. Rollback instructions

Revert the commit(s) on branch `docs/dec-legal-002-bt-draft-003`, or close PR #205 without merging. No application, source, dependency, or configuration state exists to roll back.

## 38. Correction report path

`docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-003-CORR-002-correction-report-2026-08-31.md` (this document).

## 39. Documentation changes-log entry

Entry 130 added to `docs/00-governance/documentation-changes-log.md`.

## 40. Commit SHA

Recorded in the completion message once committed.

## 41. PR #205 final head/state

Recorded in the completion message once pushed. State: **OPEN**, not merged.

## 42. Exact Founder next action

Re-review Part I §4.2/§6.1/§6.2 and Part III §11.1 as corrected, alongside the already-Founder-confirmed remainder of Part III, on PR #205. No engineering, legal-counsel, or Terms-configuration action is required. Part IV is not begun and requires a separate, later task.
