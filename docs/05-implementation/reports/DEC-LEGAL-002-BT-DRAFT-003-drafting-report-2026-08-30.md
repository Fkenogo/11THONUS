> **Title:** DEC-LEGAL-002-BT-DRAFT-003 — Core Business Terms Part III (Programme Operation) Drafting Report
> **Version:** 1.0 · **Status:** DRAFT — NOT APPROVED — NOT EFFECTIVE — NOT CONFIGURED · **Classification:** Working (governance record — controlled legal drafting)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LEGAL-002` (Status: `OPEN_LEGAL`, unchanged by this task)
> **Source-of-truth path:** `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-003-drafting-report-2026-08-30.md`
> **Date:** 2026-08-30 · **Task:** `DEC-LEGAL-002-BT-DRAFT-003`

# ⚠️ DRAFT — NOT APPROVED — NOT EFFECTIVE — NOT CONFIGURED

This report documents the drafting of Core Business Terms Part III (§§11–14) only. It does not authorize Terms configuration, does not close `DEC-LEGAL-002`, and does not change Capability 3 status.

---

## 1. Entry repository state

`git status` at task start showed the working tree on `docs/dec-legal-002-bt-draft-002` with a set of pre-existing untracked files unrelated to this task (`WORKING_WITH_THE_FOUNDER/`, several `docs/00-governance`/`docs/01-product`/`docs/05-implementation/reports`/`docs/06-engineering-governance`/`docs/30-go-to-market` files and `docs/07-product-design.zip`), left untouched throughout this task. No incomplete git operation (`MERGE_HEAD`, `rebase-merge`, `rebase-apply`) was present.

## 2. Base SHA

`origin/main` at task start: `1bfcc5c8dc7f8707df82fd284a1b64d798b78665` (merge commit of PR #204).

## 3. PR #204 / post-merge CI final result

`gh pr view 204` confirmed `state: MERGED`, `mergeCommit.oid: 1bfcc5c8dc7f8707df82fd284a1b64d798b78665` (matches the required SHA exactly). `statusCheckRollup` showed one check, `Build, Lint, Test, Emulator Validation` (workflow `CI`), `conclusion: SUCCESS`.

## 4. Branch

`docs/dec-legal-002-bt-draft-003`, created fresh from `origin/main` at `1bfcc5c`.

## 5. Authorities inspected

- Merged Core Business Terms Parts I–II (`DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md`, v2.2) and its companion Traceability Matrix and Controlled Inputs Register (v2.2).
- Legal Counsel Handoff Pack (FD-1–FD-7), especially FD-2 (earned rewards during suspension), FD-3 (exit), FD-5 (mid-cycle programme changes), FD-6 (reward monetary character).
- Founder Legal Architecture Disposition Record (LEG-FD-01–15), especially LEG-FD-01 (fallback interpretive standard), LEG-FD-04 (reward value characterisation, corrects Legal Opinion's "no monetary value" framing), LEG-FD-05 (programme-change notice, reasonable-notice not fixed period), LEG-FD-07 (exit/run-off, no universal 60-day rule), LEG-FD-08 (cash settlement on exit, not adopted as global rule).
- Decision Register: `DEC-LOY-011` (CONFIRMED — default-redeemable-during-suspension-with-governed-exceptions, read in full); `DEC-LOY-009` (confirmed `OPEN_FOUNDER`, exact question: "Is the On Us reward always exactly one eligible item/service in the MVP, or may a launch Reward Program configure rewardQuantity > 1?"); `DEC-ID-005` (confirmed `OPEN_FOUNDER`, owner-initiated self-suspension — not touched by Part III).
- `docs/02-technical/trd/17-subscription-and-billing.md` §§17.19–17.20 (Recommended Suspension Policy; Reward Liability During Suspension, synchronized to `DEC-LOY-011`).
- `docs/02-technical/trd/10-firestore-data-architecture.md` §§10.9–10.12 (Reward Program, Purchase Record, Verified Unit, Loyalty Cycle, Reward, Redemption schemas — factual data architecture, including the `rewards.status` enum's `"expired"` value and the Active Cycle Uniqueness rule).
- `docs/05-implementation/roadmap/ENG-P2-002-DESIGN-001-business-identity-architecture-delivery-design.md` §24 (Business Code — FD-3 of that document: internal/support-use-only, not a commerce/public/customer-facing identifier).
- `docs/05-implementation/roadmap/ENG-P3-001-DESIGN-001-commerce-knowledge-architecture-delivery-design.md` (Commerce Knowledge architecture — confirms no per-Business product/service persistence is required before Reward-Program-creation time; not directly load-bearing for §§11–14 text, reviewed for completeness).
- Part I §§4 (Platform Role), 6 (Business/Customer Relationship Boundary) and Part II §10 (Prohibited Conduct) of this same instrument — cross-referenced, not redrafted.

## 6. Drafting strategy

Communicated to the user before drafting began (see conversation record): §11 from FD-5/LEG-FD-01/Part I §§4/6; §12 from TRD10 §§10.9–10.12 and Part I §4, omitting Business Code entirely; §13 (most sensitive) from FD-2/FD-3/FD-6, `DEC-LOY-011`, LEG-FD-04/07/08, and TRD17 §§17.19–17.20, drafted to explicitly preserve the `DEC-LOY-009` hard boundary via a dedicated non-resolution clause (§13.7) rather than silence; §14 from FD-5/LEG-FD-05. Parts I–II amended only for stale forward-reference labels, not substantively rewritten.

## 7. Parts I–II integrity

Part I (§§1–7) and Part II (§§8–10) clause body text is unchanged from the merged PR #204 baseline. Six administrative scope-label corrections were made in total (five in the original drafting pass, one added in the `DEC-LEGAL-002-BT-DRAFT-003-CORR-001` PR-review correction pass): Instrument Map §0.0's readiness-table narrative; Part 0 §0.2 readiness-table rows 5/6/7/11; the "Independence/no-agency" narrative note; §6.2's forward-reference parenthetical; §10.4's forward-reference parenthetical; and the Part I heading note (originally missed, corrected on PR #205 review — see §33/§34 below). Each replaces a stale "not drafted in this task"/"remains Part III, not drafted"/"Parts III–VIII remain headings/placeholders only" pointer with the correct Part III cross-reference now that Part III exists, following the identical precedent PR #204 review finding 4 established when Part II was drafted (correcting stale "Part I only" labels). No clause's legal proposition was altered by any of these six corrections; a direct diff confirms no other Part I/II text changed.

## 8. §11 clauses drafted

§§11.1–11.6 (Reward Program Responsibility): Business design/control/communication responsibility; platform infrastructure role does not make 11thONUS the Reward Program operator/guarantor/fulfiller; Business retains customer-relationship responsibility, no shared/unified loyalty programme; Reward Program rules must not conflict with these Terms; no mandatory reward type/amount/threshold/cadence/tiers/min-max value.

## 9. Business Reward Program control treatment

Preserved throughout: the Business designs, owns, and controls its own Reward Program (§11.1); determines what is rewarded and at what threshold (§11.1); is responsible for accurate communication (§11.2); and 11thONUS does not standardize Reward Program design (§11.4, §14.5). No reward type, amount, threshold, cadence, tier, or min/max value was invented (§11.6).

## 10. Business/customer relationship treatment

§11.4 restates and reinforces Part I §6: the Business's relationship with its customers is its own; the platform does not become a shared or unified loyalty programme; 11thONUS's infrastructure role does not transfer that relationship to 11thONUS (§11.3).

## 11. §12 clauses drafted

§§12.1–12.5 (Transaction Recording): underlying sale is Business↔customer, 11thONUS not seller/processor/merchant of record; Business responsible for accurate recording/submission; no fabricated or knowingly false/misleading records; customer verification per governed mechanisms, no invented timeline/presumption/correction procedure; platform records support identity/trust/reward-cycle functions only, no settlement/receipt/POS/tax/chargeback/refund/correction mechanics invented.

## 12. Transaction/commerce boundary

§12.1 states the distinction the task required: the underlying commercial transaction is Business↔customer; 11thONUS's record/verification of eligible loyalty activity (§12.2–§12.5) is a separate, narrower platform function that does not convert 11thONUS into a transaction party, seller, payment processor, or merchant of record.

## 13. Customer-verification treatment

§12.4 states that customer verification of recorded purchase/loyalty activity operates per the platform's already-governed verification mechanisms (TRD10 §10.10.1's `customerResponse`/`status` lifecycle), without inventing a timeline, evidentiary presumption, or correction/reversal procedure beyond what those mechanisms already provide.

## 14. Business Code treatment

Business Code was omitted from §12 (and from Part III generally) entirely. No governing authority reviewed requires its inclusion in a Transaction Recording clause, and its governed status (`ENG-P2-002-DESIGN-001` §24: internal/support-use only, not a commerce key, transaction identifier, customer-facing identifier, sharing key, or integration identifier) affirmatively counsels against introducing it as any kind of transaction-recording concept. This mirrors the identical treatment Part II gave Business Code in §8.

## 15. §13 clauses drafted

§§13.1–13.7 (Reward Obligations): earned-obligation belongs to the Business, 11thONUS not guarantor/funder/fulfiller; suspension does not extinguish earned rewards, default-redeemable-with-governed-exceptions per `DEC-LOY-011`; exit does not extinguish earned rewards, no invented run-off/cash-settlement period; no retrospective reduction via programme change/suspension/exit; reward-value characterisation preserving FD-6/LEG-FD-04 exactly; reward expiry left to each Business's Reward Program, no platform-wide rule; explicit non-resolution of reward quantity/multiple-reward-coexistence, preserving the `DEC-LOY-009` hard boundary.

## 16. Earned-reward obligation treatment

§13.1 states the obligation to honour a validly earned reward is the Business's, not 11thONUS's, regardless of the infrastructure 11thONUS provided to record or verify it — tracking FD-2/FD-3/LEG-FD-04 exactly, with no guarantor/funder/fulfiller language introduced for 11thONUS.

## 17. Reward-value treatment

§13.5 preserves FD-6/LEG-FD-04 verbatim in substance: not money/bank deposit/e-money/stored cash/cash-withdrawal entitlement held by 11thONUS; may have economic value (no "no monetary value" or "no economic value" phrasing used anywhere); not cash-redeemable unless the Reward Program expressly provides otherwise; gift card/stored value expressly out of scope. This directly implements LEG-FD-04's correction of the external Legal Opinion's §4/§19 "no monetary/cash value" disclosure recommendation, which is not adopted.

## 18. Suspension treatment

§13.2 states the `DEC-LOY-011` (CONFIRMED) default-redeemable-with-governed-exceptions rule in full: suspension does not by itself extinguish an earned reward; valid rewards earned before suspension remain redeemable by default during suspension; commercial/subscription-only suspension does not by itself block redemption; redemption may be restricted only where the specific suspension reason (fraud, security/integrity, legal/regulatory, disputed validity, or another governed exception) makes continued redemption inappropriate or unsafe. The suspension grounds/process/exception-workflow mechanics themselves are cross-referenced to undrafted Part IV §15, not drafted here — consistent with the task's instruction not to draft §15 suspension mechanics in Part III.

## 19. Exit treatment

§13.3 states that exit does not extinguish an earned reward, the Business remains responsible, and 11thONUS does not become guarantor/fulfiller as a result of exit — per FD-3. No universal 60-day run-off (LEG-FD-07) and no mandatory cash-settlement/refund requirement (LEG-FD-08) was invented. The exit mechanism itself is cross-referenced to undrafted Part IV §16, not drafted here.

## 20. Reward-expiry treatment

§13.6 states only that where a Business's Reward Program provides for expiry of an unredeemed reward, that expiry is a Reward-Program-level matter, subject to §13.4 (no retrospective removal/reduction of an already-earned reward) and applicable law. This is supported by the `rewards.status` schema already including an `"expired"` value (TRD10 §10.12.1) — no platform-wide no-expiry rule, mandatory-expiry rule, minimum/maximum period, or post-exit/post-suspension expiry-extension rule was invented, and no duration or trigger value was stated because none exists in any reviewed authority.

## 21. DEC-LOY-009 treatment

`DEC-LOY-009` ("Reward quantity default and >1 support") remains `OPEN_FOUNDER`, exact status and question confirmed directly from the Decision Register before drafting began. §13 was drafted entirely without depending on its resolution: no clause states or implies a reward-quantity-at-creation rule, and no clause states or implies whether multiple unredeemed rewards may coexist under a Reward Program. §13.7 makes this an explicit, affirmative statement of non-resolution in the contractual text itself, so a reader cannot infer either proposition from §13's otherwise-complete treatment of survival, suspension, exit, and value. §13 was fully draftable without resolving `DEC-LOY-009` — the STOP-and-report condition in the task's §8 was not triggered, and is recorded here as not triggered, with the specific reasoning above.

## 22. §14 clauses drafted

§§14.1–14.5 (Programme Changes): prospective-only changes permitted, subject to law/programme terms/platform governance; no retrospective removal/reduction (cross-refs §13.4); reasonable-advance-communication standard for material adverse changes, no fixed notice period, no invented platform-approval requirement; no invented customer-reacceptance mechanism; no authorization to standardize Business Reward Program design.

## 23. Prospective programme-change treatment

§14.1–§14.2 state that a Business may change its Reward Program only prospectively, and that a change applies only from its effective date — per FD-5/LEG-FD-05.

## 24. Earned-reward protection against retrospective change

§14.2 (cross-referencing §13.4) prohibits a Business from using a programme change to retrospectively remove or materially reduce a reward already validly earned under the rules applicable when it was earned — FD-5's core protection, reaffirmed identically in both §13 and §14 for internal consistency.

## 25. Notice treatment

§14.3 states a reasonable-advance-communication standard for material adverse prospective changes, without a fixed period — per LEG-FD-05's express rejection of the external Legal Opinion's 30-day recommendation as a universal rule. No 30-day, 14-day, or any other fixed period was invented anywhere in Part III.

## 26. Customer-communication/language treatment

No language-specific communication obligation was drafted in Part III (none was required by the governing authorities inspected for §§11–14). Core product languages remain English/French per LEG-FD-02, unaffected. Kirundi was not introduced as a core product language or otherwise referenced. The Burundi overlay was not drafted.

## 27. Subscription boundary

No `DEC-SUB-*` decision was touched, referenced as resolved, or depended upon by any Part III clause. §13.2's reference to "commercial or subscription relationship with 11thONUS" describes the existing, already-governed suspension-scope boundary (`DEC-LOY-011`) without stating or implying any subscription plan, price, billing interval, trial, or grace-period value.

## 28. New definitions

None. Part III uses only terms already defined in Part I §2 and Part II §2 ("Business," "Reward Program," "Customer," "reward" as ordinary language consistent with FD-2/FD-3/FD-6/`DEC-LOY-011` usage). No new defined term was required.

## 29. Existing Controlled Inputs

CI-01 (operator legal identity, Preamble) and CI-05 (reacceptance-on-Terms-change engineering decision, §7.4 cross-reference) remain open, unchanged, and do not block Part III drafting — consistent with the task's §14 instruction.

## 30. New Controlled Inputs, if any

None created. `DEC-LOY-009` is explicitly not treated as a new Controlled Input for this register — see §21 above and the Controlled Inputs Register's Part III review section for the full reasoning (it is a Reward Program schema/product decision the Business-Terms drafting task does not need resolved, not a Business-Terms drafting input).

## 31. Traceability result

Every clause in §§11–14 is mapped to at least one governing authority in the Drafting Traceability Matrix's new "Part III clauses" table (23 rows covering §§11.1–14.5, plus one administrative scope-label-correction row). No clause lacks a traced authority.

## 32. Prohibited-concept search result

A `grep`-based search of the extracted Part III text (`## Part III` through `## End of Part III`) for: "no monetary value," "no economic value," "60-day," "30-day," "14-day," "cash settlement," "shared loyalty programme," "unified loyalty programme," "guarantor," "funder," "merchant of record," "payment processor," `DEC-LOY-009`, `DEC-ID-005`, `DEC-SUB`, "Business Code," "businessCode," "rewardQuantity," "fixed at creation," "multiple unredeemed rewards coexist" returned matches only for "guarantor," "funder," "merchant of record," and "payment processor" — every one of these matches is a negation clause expressly denying that 11thONUS holds that role (§11.3, §12.1, §13.1, §13.3). No prohibited concept was asserted anywhere in Part III.

## 33. PR review-thread state

PR #205 opened; CI (`Build, Lint, Test, Emulator Validation`) passed. Codex automated review posted two P2 findings, both addressed in place — see the [Part III Correction Report](DEC-LEGAL-002-BT-DRAFT-003-CORR-001-correction-report-2026-08-30.md) for the full disposition of each.

## 34. Automated/human review findings

Two Codex findings (both P2), reviewed head `ef874961a7`: (1) §14.4 originally asserted a no-customer-reacceptance default for Reward Program changes, prematurely deciding a question the Legal Counsel Handoff Pack §4 records as genuinely open — corrected to an explicit non-resolution; (2) the Part I heading note still read "Parts III–VIII remain headings/placeholders only" after Part III was drafted, an internally contradictory stale scope label missed by the original five-correction inventory — corrected, and the inventory count updated to six. Both corrections applied in task `DEC-LEGAL-002-BT-DRAFT-003-CORR-001`; no new controlled input was created by either correction.

## 35. DEC-LEGAL-002 status

Unchanged: `OPEN_LEGAL`.

## 36. Capability 3 status

Unchanged: Open — engineering work packages complete; blocked on governed Terms-content configuration (`CDR-001` §5).

## 37. Terms configuration status

Unchanged: `NOT CONFIGURED` (`platformConfig/businessTerms`).

## 38. Files modified

- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` (Part III added; six administrative scope-label corrections to Parts I/II across the original pass and the `-CORR-001` PR-review pass; §14.4 corrected on PR-review to an explicit non-resolution; header/version metadata updated to v3.1)
- `docs/00-governance/documentation-changes-log.md` (Entry 128 — Part III drafting; Entry 129 — `-CORR-001` PR-review corrections)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md` (Part III clause rows added; header/version metadata updated to v3.0)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md` (Part III review section added; cross-reference note extended; header/version metadata updated to v3.0)
- `docs/00-governance/decisions/decision-register.md` (new "Last controlled update" entry prepended for `DEC-LEGAL-002-BT-DRAFT-003`; full prior history preserved)
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-003-drafting-report-2026-08-30.md` (this report, new file)

No other file was modified. The pre-existing untracked files present at task start were not added, modified, or committed.

## 39. Diff summary

Additive: full clause text for §§11–14 (23 numbered sub-clauses across four sections); one new Traceability Matrix table (23 rows) plus a "Part III clauses removed" note; one new Controlled Inputs Register section (Part III review) plus an extended cross-reference note; one new decision-register.md history entry; one new drafting report; two new documentation-changes-log entries (128, 129). Corrective (non-substantive, scope-label only): six Part I/II forward-reference pointers updated from "not drafted in this task"/"remains Part III, not drafted"/"Parts III–VIII remain headings/placeholders only" to the correct Part III cross-reference, across the original drafting pass (five) and the `-CORR-001` PR-review pass (one). §14.4 was also corrected on PR review from an affirmative no-reacceptance default to an explicit non-resolution. No Part I or Part II clause body text was rewritten.

## 40. Commands executed

`git fetch origin`; `git status`; `git log --oneline` (origin/main, and filtered for PR #204/DRAFT-002 commits); `gh pr view 204 --json state,mergeCommit,statusCheckRollup`; `find`/`grep` authority-discovery commands across `docs/00-governance`, `docs/02-technical/trd`, `docs/05-implementation/roadmap`; `git checkout -b docs/dec-legal-002-bt-draft-003 origin/main`; `grep`-based prohibited-concept search against the extracted Part III text.

## 41. Dependencies added

None.

## 42. Config changes

None.

## 43. Application/source changes

None. Docs-only. No `functions/`, `apps/web/`, Firestore Rules, or Firebase configuration file was read, created, or modified.

## 44. Validation results

Full Part III clause-by-clause authority-traceability review completed (§31 above, matrix populated). Prohibited-concept search completed with no asserted-concept matches (§32 above). Parts I–II integrity verified by direct comparison — only the six documented administrative scope-label corrections found (five in the original pass, one added on PR-review). `DEC-LOY-009` boundary verified preserved by direct inspection of §13's full text (§21 above). §14.4 verified corrected to an explicit non-resolution per PR #205 review (§33/§34).

## 45. Risks/open drafting matters

None newly introduced. Existing open matters (CI-01, CI-05, `DEC-LOY-009`, `DEC-ID-005`, all unresolved `DEC-SUB-*`) remain exactly as they stood before this task and are not resolved, narrowed, or otherwise affected by Part III's drafting. Part IV (§§15–17, Suspension/Restriction, Business Exit and Termination, Complaints and Dispute Facilitation) is the next drafting-readiness item and was not begun.

## 46. Rollback instructions

Revert the commit on branch `docs/dec-legal-002-bt-draft-003`, or close the associated pull request without merging. No application, source, dependency, or configuration state exists to roll back — this task is docs-only.

## 47. Drafting report path

`docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-003-drafting-report-2026-08-30.md` (this document).

## 48. Persistent `.md` changes tracking

See §38 (Files modified) above for the complete list of `.md` files created or modified by this task.

## 49. Commit SHA

Recorded in the completion message once the commit is created.

## 50. PR number/status

Recorded in the completion message once the PR is opened.

## 51. Exact Founder next action

Review Part III (§§11–14) on the opened PR for Founder approval, in the same manner Parts I and II were reviewed. No engineering, legal-counsel, or Terms-configuration action is required to review Part III. Part IV (Suspension/Restriction; Business Exit and Termination; Complaints and Dispute Facilitation) is not begun and requires a separate, later task.
