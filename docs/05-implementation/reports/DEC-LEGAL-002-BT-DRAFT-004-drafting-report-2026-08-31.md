> **Title:** DEC-LEGAL-002-BT-DRAFT-004 — Core Business Terms Part IV (Platform Action, Business Exit and Complaints) Drafting Report
> **Version:** 1.0 · **Status:** DRAFT — NOT APPROVED — NOT EFFECTIVE — NOT CONFIGURED · **Classification:** Working (governance record — controlled legal drafting)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LEGAL-002` (Status: `OPEN_LEGAL`, unchanged by this task)
> **Source-of-truth path:** `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-004-drafting-report-2026-08-31.md`
> **Date:** 2026-08-31 · **Task:** `DEC-LEGAL-002-BT-DRAFT-004`

# ⚠️ DRAFT — NOT APPROVED — NOT EFFECTIVE — NOT CONFIGURED

This report documents the drafting of Core Business Terms Part IV (§§15–17) only. It does not authorize Terms configuration, does not close `DEC-LEGAL-002`, and does not change Capability 3 status.

---

## 1. Entry repository state

`git status` at task start showed the working tree on `docs/dec-legal-002-bt-draft-003` with a set of pre-existing untracked files unrelated to this task (`WORKING_WITH_THE_FOUNDER/`, several `docs/00-governance`/`docs/01-product`/`docs/05-implementation/reports`/`docs/06-engineering-governance`/`docs/30-go-to-market` files and `docs/07-product-design.zip`), left untouched throughout this task. No incomplete git operation (`MERGE_HEAD`, `rebase-merge`, `rebase-apply`) was present.

## 2. Base SHA

`origin/main` at task start: `b2f798d20d2ffa0be195d3db33cd822c7396026a` (merge commit of PR #205).

## 3. PR #205 merge verification

`git log --oneline -1 origin/main` and `git show --stat b2f798d` confirmed the merge commit `b2f798d20d2ffa0be195d3db33cd822c7396026a` (merge of `docs/dec-legal-002-bt-draft-003`, subject "docs(DEC-LEGAL-002-BT-DRAFT-003): draft Core Business Terms Part III (Programme Operation)") is on `origin/main`, with the eight files it touched matching the expected Part III/CORR-001/CORR-002 change set.

## 4. Branch

`docs/dec-legal-002-bt-draft-004`, created fresh from `origin/main` at `b2f798d`.

## 5. Authorities inspected

- Merged Core Business Terms Parts I–III (`DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md`, v3.2) and its companion Traceability Matrix and Controlled Inputs Register (v3.2).
- Legal Counsel Handoff Pack (FD-1–FD-7), specifically FD-2 (earned rewards during suspension), FD-3 (exit and outstanding entitlements), FD-4 (platform suspension of a Business), and the cross-cutting principle governing FD-2–FD-5.
- `DEC-LOY-011` (Decision Register, CONFIRMED — reward redemption during business suspension, read in full, including the historical options preserved for traceability).
- Founder Legal Architecture Disposition Record v2.0 (LEG-FD-01–15), specifically LEG-FD-01 (fallback interpretive standard), LEG-FD-06 (suspension process — non-exhaustive grounds, no fixed periods), LEG-FD-07 (business exit/run-off — no universal 60-day period), LEG-FD-08 (cash settlement on exit — not adopted as a global rule), LEG-FD-11 (dispute architecture — three-tier allocation), LEG-FD-12 (complaint handling), and LEG-FD-14 (B2B dispute resolution — Kigali/KIAC, read to confirm §17.3's cross-reference does not restate or alter it).
- Decision Register: `DEC-LOY-011` (CONFIRMED); `DEC-LOY-005` (CONFIRMED — no automatic reward expiry in MVP); `DEC-ID-005` (confirmed `OPEN_FOUNDER`, exact scope re-read: "whether the MVP supports owner-initiated suspension/pause of their own business, and with what effects" — a broader question than `DEC-LOY-011`'s redemption-during-suspension question, and not answered by it); `DEC-LOY-009` (confirmed `OPEN_FOUNDER`, unaffected by Part IV); all `DEC-SUB-*` items (confirmed statuses: `001`/`002`/`003`/`008`/`009`/`010`/`013` `OPEN_FOUNDER`; `004`/`005`/`006`/`007` `CONFIRMED`; `011`/`012` `SUPERSEDED`).
- `docs/05-implementation/reports/DEC-LOY-011-TRD17-SYNC-001-live-authority-synchronization-report-2026-08-29.md` — confirms TRD17 §§17.18–17.20 already synchronized to `DEC-LOY-011`, and that the exception-handling workflow for suspension redemption remains an explicitly undesigned future engineering package (not invented by this task).
- `functions/src/domains/business/models/businessStatus.ts` (governed Business lifecycle-status state machine, `ENG-P2-002A`) — confirms the eight governed statuses (`draft`, `pending_verification`, `trial`, `active`, `suspended`, `expired`, `closed`, `archived`), the `active`↔`suspended`→`closed` transition table, and that the owner-self-suspend variant is explicitly excluded from that module's governed scope (`DEC-ID-005` boundary, confirmed live in code, not just in documentation).
- `docs/02-technical/trd/17-subscription-and-billing.md` §17.20 (Reward Liability During Suspension, synchronized to `DEC-LOY-011`).
- Part I §§1.4 (effective-date/exit cross-reference), 6 (Business/Customer Relationship Boundary) and Part III §§10.4 (prohibited-conduct/suspension cross-reference), 13 (Reward Obligations), 14 (Programme Changes) of this same instrument — cross-referenced, not redrafted.

## 6. Drafting strategy

Communicated to the user before drafting began: §15 from FD-4/LEG-FD-06 (non-exhaustive grounds; ordinary/immediate distinction; no fixed periods; commercial-suspension carve-out cross-referencing `DEC-LOY-011`/§13.2 rather than restating it); §16 from FD-3/LEG-FD-07/LEG-FD-08 (exit/termination does not extinguish earned rewards; no universal run-off period; no mandatory cash settlement; `DEC-LOY-005` expiry boundary preserved against exit-as-indirect-expiry); §17 from LEG-FD-11/LEG-FD-12 (three-tier dispute allocation; facilitation, not adjudication; B2B arbitration mechanics cross-referenced to undrafted §21, not restated). `DEC-ID-005` (owner-initiated self-suspension) identified during authority review as a live boundary — not resolved by §15/§16, addressed by dedicated non-resolution clauses (§15.7, §16.8) rather than silence, using the same technique Part III's §13.7/§14.4 established for `DEC-LOY-009` and the programme-publication question. Parts I–III amended only for stale forward-reference labels, not substantively rewritten.

## 7. Parts I–III integrity

Part I (§§1–7), Part II (§§8–10), and Part III (§§11–14) clause body text is unchanged from the merged PR #205 baseline. Six administrative scope-label corrections were made: Part 0 Instrument Map status row and §0.1 Part IV architecture-list label; §0.2 readiness-table rows 9 (now "Partial — §17 drafted") and 10 (now "Yes"); Part I §1.4's forward-reference to §16; Part II §10.4's forward-reference to §15; Part III §13.2's and §13.3's forward-references to §15/§16 respectively. Each replaces a stale "not drafted in this task"/"Part IV heading only" pointer with the correct cross-reference, following the identical precedent PR #204/#205 review findings established when Parts II/III were drafted. No clause's legal proposition in Parts I–III was altered by any of these six corrections; a direct diff confirms no other Part I/II/III text changed. §9.6's existing forward reference to "Part VI §19 (not drafted in this task)" was verified accurate and left untouched, since Part VI is not in this task's scope.

## 8. §15 clauses drafted

§§15.1–15.7 (Suspension and Restriction): non-exhaustive suspension/restriction-grounds catalogue (trust, security, integrity, compliance, participant protection, fraud, legal/regulatory requirement, material Terms breach, other governed platform-protection reason); the ordinary (reasonable notice/cure)-versus-immediate (urgent-reason) distinction with a "reasonably practicable" notice standard, subject to legal/security/investigatory restrictions; a mechanism-neutral statement of which platform functions a suspension may affect, reserving the operational/account-status mechanism to the platform's governed lifecycle architecture; the commercial/subscription-suspension carve-out; earned-reward survival during suspension by cross-reference to §13; a statement that this section is contractual authority only, not a fraud-detection/adjudication/enforcement methodology; and the explicit `DEC-ID-005` non-resolution boundary.

## 9. Suspension grounds treatment

Drafted verbatim from FD-4's grounds language (trust, security, integrity, compliance, participants) supplemented by LEG-FD-06's reconciled, non-exhaustive descriptive-list treatment of the Legal Opinion's own grounds table (fraud, security, integrity, regulatory non-compliance, Terms breach, harm to platform integrity/participants, legal requirement). §15.1 states expressly that the list "illustrates circumstances... [and] is not an exhaustive statement of every circumstance" — no exhaustive suspension-grounds catalogue is created, consistent with FD-4's own "not decided: an exhaustive list of suspension grounds" boundary.

## 10. Ordinary vs immediate suspension treatment

Drafted verbatim from LEG-FD-06's "portable rule": ordinary suspension receives reasonable notice and an opportunity to remedy where appropriate; immediate suspension may occur for fraud, security, integrity, participant protection, legal/regulatory requirements, or comparable urgency; the Business is informed of the reason and the applicable review/remediation process as soon as reasonably practicable, subject to legal/security restrictions. No fixed 7-day/24-hour/48-hour/14-day period from the Legal Opinion (§5, §18) was adopted, matching LEG-FD-06's explicit rejection of those specific figures.

## 11. Notice/cure treatment

§15.2 states the notice/cure standard using only "reasonable," "where appropriate," and "as soon as reasonably practicable" — no fixed notice period, fixed cure period, or mandatory warning sequence is created. §15.6 additionally confirms no mandatory appeals process or specific fraud-evidence threshold is established. §16.2 (termination) cross-references the identical §15.2 standard rather than restating or varying it.

## 12. Commercial suspension boundary

§15.4 states that suspension or restriction "arising solely from the Business's commercial or subscription relationship with 11thONUS — including its subscription, billing, or account-status matters — does not, by itself, prevent redemption of a reward validly earned by a customer before that suspension or restriction," and expressly disclaims resolving any open subscription plan/grace-period/pricing/billing decision. This tracks `DEC-LOY-011`'s "suspension arising solely from the Business's commercial relationship with 11thONUS... does not by itself prevent redemption" clause verbatim in substance.

## 13. DEC-LOY-011 treatment

`DEC-LOY-011` (CONFIRMED) is not restated in full inside §15 — it is cross-referenced to Part III §13.2, which already states the default-redeemable-with-governed-exceptions rule verbatim. §15.4 and §15.5 apply that already-drafted rule to the suspension-authority clause rather than re-drafting it, avoiding duplication while preserving the substance exactly. `DEC-LOY-011`'s Decision Register status is unaffected (remains CONFIRMED).

## 14. Earned-reward treatment during suspension

§15.5 states that suspension "does not, by itself, extinguish a reward validly earned by a customer before the suspension or restriction began," that the Business remains the obligor, that 11thONUS does not become guarantor/funder/fulfiller, and that redemption may nevertheless be restricted/paused/reviewed only where the specific suspension reason makes continued redemption inappropriate or unsafe (cross-referencing §13.2's governed-exception categories rather than restating or expanding them). No new exception ground was added beyond `DEC-LOY-011`'s own confirmed categories (fraud, security/integrity, legal/regulatory, disputed validity, another governed exception).

## 15. §16 clauses drafted

§§16.1–16.8 (Business Exit and Termination; Outstanding Rewards): voluntary exit; platform-initiated termination on the §15 grounds/notice architecture; the core outstanding-rewards rule (exit/termination does not extinguish earned rewards; Business remains responsible; 11thONUS not fulfiller/guarantor/refund-fund/cash-settlement-provider); a reasonable-transition/run-off principle with no fixed period; an alternative-remedy principle with no mandatory cash-funding obligation on 11thONUS; the reward-expiry boundary (exit must not be used as indirect expiry); the suspension-vs-exit distinction stated without inventing a new lifecycle status; and the explicit `DEC-ID-005` non-resolution boundary (self-initiated suspension/pause short of full exit).

## 16. Voluntary exit treatment

§16.1 states a Business "may end its participation on the platform, subject to these Terms and its other applicable obligations," with no fixed notice-to-exit period, minimum participation period, or early-termination fee invented, and reserves the platform mechanics of how exit is technically effected to separate governance. This is drafted from LEG-FD-01's fallback standard, since no more specific governed exit-notice rule exists in any reviewed authority, consistent with the same "sufficient, non-inventive drafting choice" technique the Controlled Inputs Register already documents for §8.7 (Part II) and §14.3 (Part III).

## 17. Platform termination treatment

§16.2 states 11thONUS may terminate a Business's participation "for the same kinds of reasons, and subject to the same ordinary/immediate distinction, described in §15," expressly declining to create an automatic-termination-for-every-breach rule, an exhaustive termination-grounds catalogue, or a fixed cure period. This is drafted by direct cross-reference to §15 rather than as a freestanding grounds catalogue, avoiding duplication while ensuring §15 and §16 cannot diverge on the same underlying FD-4/LEG-FD-06 authority.

## 18. Outstanding-reward treatment

§16.3 states the FD-3/LEG-FD-07/LEG-FD-08 core rule verbatim in substance: exit or termination "does not, by itself, extinguish a reward validly earned by a customer before the effective date," the Business "remains responsible... according to its Reward Program and these Terms," and 11thONUS "does not become the reward fulfiller, guarantor, refund fund, or cash-settlement provider as a result." This cross-references Part III §13.3, which already states the same substance for the suspension/exit context generally, applying it specifically to the §16 exit/termination clause.

## 19. Run-off treatment

§16.4 states a "reasonable transition or run-off arrangement may be appropriate" where "reasonably necessary to enable fulfilment," listing the same non-exhaustive factors LEG-FD-07's portable rule identifies (the applicable Reward Program, the nature of the reward, previously disclosed terms, Business circumstances, applicable law, practical fulfilment mechanisms), and expressly states "no fixed transition or run-off period — including any universal 60-day period." The Legal Opinion §7's specific "mandatory 60-day Redemption Run-Off Phase" is not adopted, matching LEG-FD-07's explicit disposition.

## 20. Cash/refund treatment

§16.5 states an alternative remedy "may be available... under applicable law or the terms of the applicable Reward Program" where original fulfilment becomes impossible, that "cash compensation may be one possible remedy in some circumstances, but is not a universal requirement," and that "11thONUS does not fund, underwrite, or otherwise become responsible for providing any such alternative remedy." This tracks LEG-FD-08's disposition exactly: the Legal Opinion §7's mandatory cash-conversion recommendation is not adopted, while its own "11thONUS disclaims liability for merchant default" conclusion is retained.

## 21. Reward-expiry treatment

§16.6 states exit or termination "must not be used, directly or indirectly, as a mechanism to expire or otherwise extinguish a reward already validly earned," and that Part III §13.6's `DEC-LOY-005`-sourced no-automatic-expiry position "applies without modification by this section." `DEC-LOY-005` (CONFIRMED) is not altered; §16.6 states its existing resolution applies to the exit context rather than inventing a new expiry-on-exit rule.

## 22. §17 clauses drafted

§§17.1–17.6 (Complaints and Dispute Facilitation): the Customer↔Business Reward Program dispute allocation (Business primary responsibility); 11thONUS's facilitation functions (receive, preserve evidence, route/escalate, facilitate communication, platform-governance action) with an explicit non-merchant/non-obligor/non-fulfiller/non-guarantor/non-adjudicator statement and no fixed response SLA; the Business↔11thONUS operational-complaint-mechanism acknowledgment, with the final B2B arbitration mechanism cross-referenced to undrafted §21 rather than drafted here; the Customer↔11thONUS boundary, reserved to the separate Customer Terms/Platform Terms instrument; platform records as relevant-but-not-conclusive evidence; and an explicit non-adjudicator statement.

## 23. Customer↔Business complaint treatment

§17.1–§17.2 state that primary responsibility for a Reward Program complaint belongs to the Business (consistent with §6/§13), and that 11thONUS's facilitation functions — receiving the complaint, preserving platform evidence, routing/escalating, facilitating communication, and taking platform-governance action under §15 where appropriate — do not make 11thONUS the merchant, reward obligor, fulfiller, guarantor, or universal adjudicator. This is drafted verbatim from LEG-FD-12's disposition text.

## 24. Business↔11thONUS complaint treatment

§17.3 states only that an "accessible mechanism" exists "in principle" for a Business to raise an operational/platform complaint with 11thONUS, and expressly declines to draft "the final Business ↔ 11thONUS dispute-resolution mechanism (including any arbitration forum, seat, rules, or procedure)," cross-referencing the undrafted Part VII §21 instead. LEG-FD-14's already-Founder-approved Kigali/KIAC/English-or-French architecture (for §21, when drafted) is neither repeated nor altered by this clause — a direct search confirmed "KIAC" and "arbitrat[ion]" appear in §17 text only inside the negation/cross-reference clause quoted above.

## 25. Customer↔11thONUS boundary

§17.4 states that a customer's direct complaint to 11thONUS about the customer's own relationship with 11thONUS (as distinct from a Reward Program complaint under §17.1) is addressed under the separate Customer Terms/Platform Terms of Use instrument described in §0.0/§6.3, that this is a "distinct future controlled work package," and that "this section does not draft any part of it." No Customer Terms content is drafted inside this Business Terms instrument.

## 26. 11thONUS facilitation/adjudication boundary

§17.6 states expressly, using the task's own prohibited-phrase list as a direct checklist, that this section does not establish that "11thONUS's decision on a complaint is final," that "11thONUS determines whether a Business owes a customer a remedy," that "11thONUS will itself refund or compensate a customer," or that "11thONUS guarantees resolution of any complaint within a stated time or at all." This mirrors the drafting technique §10.5 (Part II) and §15.6 (Part IV, this task) already use for the same purpose in adjacent contexts.

## 27. Evidence/platform-record treatment

§17.5 states a platform record "may be relevant evidence" but is not "conclusive, legally irrebuttable, the sole evidence permitted, or automatically determinative," and that "this section... does not establish an evidence hierarchy." No corrections/reversal operational mechanism is drafted; §17.5 only recognizes existing platform records (§12, Transaction Recording) as one form of relevant evidence.

## 28. B2B dispute-resolution cross-reference treatment

§17.3's cross-reference to Part VII §21 is the only point in Part IV where B2B dispute resolution is mentioned. It states the mechanism's existence in principle without drafting its content, consistent with the task's explicit instruction that "Formal B2B dispute resolution belongs later under §21 and LEG-FD-14." LEG-FD-14's specific Kigali/KIAC/English-or-French disposition (already Founder-approved) is left entirely for the future §21 drafting task.

## 29. Subscription boundary

No `DEC-SUB-*` plan, price, billing interval, trial period, grace period, pilot term, proration, or plan-limit value is stated anywhere in Part IV. §15.4 states generically that commercial/subscription status does not by itself extinguish redemption rights, and expressly disclaims deciding "any open subscription plan, grace-period, pricing, or billing decision." All `DEC-SUB-*` items remain in their pre-existing statuses, unchanged (see §6 above for the full status list re-verified during authority review).

## 30. DEC-ID-005 treatment

`DEC-ID-005` ("Owner-initiated business self-suspension") remains `OPEN_FOUNDER`, its exact scope re-read directly from the Decision Register (line 588–600): whether the MVP supports an owner pausing their own Business, and with what effects — a broader question than, and not resolved by, `DEC-LOY-011`'s redemption-during-suspension resolution. §15.7 and §16.8 draft around this question explicitly rather than assuming an answer either way: §15 addresses only 11thONUS-initiated suspension/restriction; §16 addresses only voluntary exit (ending participation) and platform-initiated termination — neither section states, implies, or forecloses whether a Business may itself request or trigger a suspension or pause short of full exit. This is consistent with the governed code-level architecture in `businessStatus.ts`, which documents the owner-self-suspend transition variant as "explicitly excluded" from its own governed scope.

## 31. New definitions

None. Part IV introduces no new §2 defined term. "Business," "Reward Program," "Customer," and "Terms" (Part I §2) and "Business Owner"/"Authorized Representative"/"Staff" (Part II §2 additions) are used as already defined; no redefinition or extension was needed.

## 32. Existing Controlled Inputs

CI-01 (operator legal identity, Preamble) and CI-05 (reacceptance-on-Terms-change engineering decision, §7.4/LEG-FD-13) remain the only two open controlled inputs, unchanged by this task. Neither is referenced or implicated by Part IV.

## 33. New Controlled Inputs, if any

None created. See the Controlled Inputs Register's new "Part IV review" section for the full analysis of why §15's grounds/notice standard, §16's exit/outstanding-reward rules, and §17's complaint-facilitation clauses are each fully draftable from existing FD-2/FD-3/FD-4/`DEC-LOY-011`/`DEC-LOY-005`/LEG-FD-01/06/07/08/11/12 authority without a new Founder or legal position. `DEC-ID-005`'s explicit non-resolution (§15.7/§16.8) is a drafting-discipline safeguard, not a new controlled input — it does not block Part IV's own approval; it only preserves the existing, already-open `DEC-ID-005` boundary.

## 34. Traceability result

Full clause-level traceability recorded in the Traceability Matrix's new "Part IV clauses (§§15–17)" table (17 rows, §§15.1–17.6), each citing its governing decision/document, portable-vs-jurisdiction-dependent status, whether external Legal Opinion evidence informed the clause, and any unresolved-input cross-reference. No clause was drafted, or later removed, without a governing-authority citation.

## 35. Prohibited-concept search result

A `grep`-based search of the drafted Part IV text (isolated via `awk` from `### Section 15` through `## End of Part IV`) for the task's own do-not-invent list found: zero matches for `configured` (no new lifecycle state), zero matches for `DEC-SUB` (no subscription value), zero matches for fixed 7/14/24/48-day/hour or 30/60-day periods as an asserted rule (the sole "60-day" hit is inside §16.4's own negation — "no fixed transition or run-off period — including any universal 60-day period"), and the sole "arbitrat[ion]"/"permanent[ly]" hits are both inside negation/cross-reference clauses (§17.3's cross-reference to undrafted §21; §15.6's "does not itself establish an automatic-permanent-termination rule"). A parallel search of `DEC-ID-005`/`DEC-LOY-009` occurrences confirmed all three hits (front-matter authority line, §15.7-adjacent Status Reaffirmation line, and the Controlled Inputs Register's own analysis) are explicit non-resolution statements, not assertions.

## 36. Automated/manual review result

No automated review tool was invoked as part of this drafting pass (the PR has not yet been opened; automated review runs on PR creation per this repository's established `@codex review`/Codex-bot precedent from Parts II/III). An exhaustive manual review was performed instead: (a) full authority-led read of the drafted §§15–17 text against FD-2/FD-3/FD-4/`DEC-LOY-011`/`DEC-LOY-005`/LEG-FD-01/06/07/08/11/12/14/`DEC-ID-005`; (b) the `grep`-based prohibited-concept search in §35 above; (c) direct diff verification that no Part I/II/III clause body text changed beyond the six administrative scope-label corrections listed in §7; (d) cross-check of every Decision Register status cited (`DEC-LEGAL-002`, Capability 3, Terms configuration, `DEC-ID-005`, `DEC-LOY-005`, `DEC-LOY-009`, `DEC-LOY-011`, all `DEC-SUB-*`) against the live register text immediately before finalizing this report.

## 37. PR review-thread state

Not applicable at this stage — no PR has been opened yet by this task (branch drafted, not yet pushed/PR'd as of this report). This report will be superseded by a correction report if a subsequent review round on the eventual PR identifies any finding, following the identical precedent Parts II/III established.

## 38. New review findings

None yet — no review has occurred (see §37).

## 39. DEC-LEGAL-002 status

Unchanged: **OPEN_LEGAL**.

## 40. Capability 3 status

Unchanged: **Open — engineering work packages complete; blocked on governed Terms-content configuration** (`CDR-001` §5).

## 41. Terms configuration status

Unchanged: **NOT CONFIGURED**. No Terms version, content, or effective date was written to `platformConfig/businessTerms` or any other configuration surface.

## 42. Files modified

- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` (v3.2 → v4.0 — Part IV §§15–17 full clause text added; six administrative scope-label corrections; header/version/authorities metadata updated)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md` (v3.2 → v4.0 — Part IV clause table added; Part IV self-review note added)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md` (v3.1 → v4.0 — Part IV review section added; boundary-list cross-reference note added; no register-table change)
- `docs/00-governance/decisions/decision-register.md` (`Last controlled update` field updated; new `DEC-LEGAL-002-BT-DRAFT-004` narrative prepended; DEC-LEGAL-002 entry Notes field appended with a summary paragraph — no `Status` field changed anywhere in the file)
- `docs/00-governance/documentation-changes-log.md` (new entry appended)
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-004-drafting-report-2026-08-31.md` (new — this report)

## 43. Diff summary

One controlled-drafting instrument gains three new sections (§§15–17, full clause text) plus administrative cross-reference corrections; one traceability matrix gains a 17-row Part IV clause table plus a self-review paragraph; one controlled-inputs register gains a Part IV review section and boundary-list confirmation, with zero rows added to its open-inputs table (CI-01/CI-05 unchanged); one decision-register entry gains a header narrative and a Notes-field summary paragraph, with zero `Status:` field changed; one changes-log gains one new dated entry; one new drafting-report file created. No Part I, Part II, or Part III clause body text changed. No file outside `docs/00-governance/decisions/` and `docs/05-implementation/reports/` was touched.

## 44. Commands executed

Read-only: `git fetch origin`, `git status`, `git log --oneline`, `git show --stat b2f798d`, `find`/`ls`/`grep`/`Read` across governance evidence, Decision Register, TRD, and source-code (`businessStatus.ts`) files to establish authority. Mutating: `git checkout -b docs/dec-legal-002-bt-draft-004 origin/main`; file edits via the Edit/Write tools listed in §42; targeted `grep`/`awk`-based verification passes after each edit (§35). No build, test, deploy, or database command was run. No destructive git command (`reset --hard`, `clean`, force-push) was run. No push/PR-creation command has been run as of this report.

## 45. Dependencies added

None.

## 46. Config changes

None.

## 47. Application/source changes

**NONE.** No file under `functions/`, `apps/`, Firestore Rules, or any application/configuration surface was read for editing purposes (only `functions/src/domains/business/models/businessStatus.ts` was **read**, as a factual authority source for the governed lifecycle-status architecture cited in §16.7/§17 — not modified).

## 48. CI/check results

Not applicable — no PR opened yet, no CI run triggered by this task as of this report.

## 49. Risks/open matters

- The final Business↔11thONUS arbitration mechanism (Part VII §21) remains undrafted; §17.3 only acknowledges its future existence. A future drafting task for §21 should apply LEG-FD-14's already-Founder-approved Kigali/KIAC/English-or-French architecture without needing to revisit §17.3.
- `DEC-ID-005` remains the single Decision Register item most directly adjacent to Part IV's subject matter that is not resolved. If the Founder resolves it before Part V (or before final Terms approval), a future task should verify whether §15.7/§16.8's non-resolution language needs updating to reflect the resolution (not before this task's own scope).
- As with Parts II/III, this Part IV text has not yet been reviewed by an automated PR-review bot; the manual review in §36 is a substitute for, not a guarantee equivalent to, that automated pass. A correction task following PR review should be expected as the normal next step, per the established Parts II/III precedent.

## 50. Rollback instructions

All changes are additive, in-place documentation edits on a fresh branch not yet merged. Rollback: `git checkout main -- <path>` for each file in §42 (or discard the branch entirely, since no other task has built on it). No non-doc system was touched; no rollback of application/config/infrastructure state is required.

## 51. Drafting report path

`docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-004-drafting-report-2026-08-31.md` (this report).

## 52. Documentation changes-log entry

Appended to `docs/00-governance/documentation-changes-log.md`, dated 2026-08-31, task `DEC-LEGAL-002-BT-DRAFT-004`.

## 53. Commit SHA

To be recorded once the commit is created (see the completion report in-chat for the exact SHA once committed).

## 54. PR number/state

Not yet opened as of this report. A PR will be opened against `main` from `docs/dec-legal-002-bt-draft-004` following the commit; it will not be self-merged.

## 55. Exact Founder next action

Review Part IV (§§15–17) in the [Core Business Terms Draft v4.0](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md) for Founder approval, disposition, or correction — in particular: (a) confirm the §15.1 non-exhaustive suspension-grounds catalogue and the §15.2 ordinary/immediate notice standard match the Founder's intended operational posture; (b) confirm the §16.4/§16.5 reasonable-transition/alternative-remedy language (no fixed run-off period, no mandatory cash settlement) is acceptable as portable Layer-1 language, recognizing a jurisdictional overlay may later require more; (c) confirm §17.3's decision to reserve all B2B arbitration mechanics to a future §21 drafting task, rather than drafting any part of it now, matches the Founder's sequencing intent; (d) note that `DEC-ID-005` remains open and is not resolved by this Part. No merge action is required or authorized by this report; PR #206 (or whatever number is assigned) should not be self-merged by an agent.

---

## FINAL GATE

**`CORE BUSINESS TERMS PART IV DRAFTED — PARTS I–III BASELINE PRESERVED — AWAITING FOUNDER REVIEW`**
