> **Title:** DEC-LEGAL-002-BT-DRAFT-003-CORR-001 — Correction Report (PR #205 Codex Review Findings)
> **Version:** 1.0 · **Status:** DRAFT — NOT APPROVED — NOT EFFECTIVE — NOT CONFIGURED · **Classification:** Working (governance record — controlled legal drafting)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LEGAL-002` (Status: `OPEN_LEGAL`, unchanged by this task)
> **Source-of-truth path:** `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-003-CORR-001-correction-report-2026-08-30.md`
> **Date:** 2026-08-30 · **Task:** `DEC-LEGAL-002-BT-DRAFT-003-CORR-001`

# Purpose

Addresses two Codex review findings (both P2) on [PR #205](https://github.com/Fkenogo/11THONUS/pull/205), reviewed head `ef874961a7`.

## Finding 1 — Preserve the unresolved customer-reacceptance question (§14.4)

**Codex finding:** the original §14.4 wording affirmatively stated that a customer's reacceptance of a Business's Reward Program is not required as a condition of a prospective change taking effect. This selects a policy on a question the Legal Counsel Handoff Pack §4 records as genuinely open and not yet Founder-positioned ("programme publication (does publication create a binding offer to customers?)"), and Part I §7.4 — which concerns a Business reaccepting these platform Terms — does not support extending that principle to how a Business's customers accept the Business's own programme changes.

**Correction:** §14.4 was rewritten to state explicitly that whether a Business's customers must separately accept or reaccept a Reward Program change is *not established* by this section — the clause now neither requires nor forecloses a customer-facing reacceptance mechanism, using the same explicit-non-resolution technique §13.7 uses for `DEC-LOY-009`. The sentence preserving the "without prejudice to" cross-reference to a future Terms-level reacceptance clause (Part VII §22) is retained unchanged, since that cross-reference concerns a different, already-open item (CI-05) and was not the subject of this finding.

**Traceability/Controlled Inputs impact:** the Traceability Matrix row for §14.4 was corrected to cite the Legal Counsel Handoff Pack §4 open row and record the finding; the Controlled Inputs Register's Part III review section gained an explanatory bullet. No new controlled input was created — §14 remains fully draftable, and was drafted, on the prospective-only/no-retrospective-reduction/reasonable-notice principles that are its actual subject, without resolving the customer-reacceptance question.

## Finding 2 — Correct the remaining stale Part III scope label

**Codex finding:** the Part I heading note (originally at line 126) still read "Parts III–VIII remain headings/placeholders only" after this task added full Part III clause text — leaving the instrument internally contradictory, and the correction inventory (in the "End of Part I / how to read" area) inaccurate because it omitted this instance.

**Correction:** the Part I heading note was corrected to state that Part III (§§11–14) is now also drafted with full clause text, task `DEC-LEGAL-002-BT-DRAFT-003`, and that Parts IV–VIII (not III–VIII) remain headings/placeholders only. The Traceability Matrix's administrative scope-label-correction row was updated from "five" to "six" corrected statements and now names the Part I heading note explicitly.

## Second re-review — four further Codex findings (all P2)

After pushing the two corrections above, `@codex review` was requested on the PR to confirm no further finding remained. A second review (commit `e7a39d2b40`) raised four additional P2 findings, all addressed in this same correction pass:

**Finding 3 — Add the required documentation-change-log entry.** `README.md` Rule 4 requires an entry in `docs/00-governance/documentation-changes-log.md` for any change to a governed document under `docs/`. This task's own drafting report labelled its file inventory (§38) as the persistent change-tracking record, but never actually added a log entry, leaving the controlled running log unaware of the new Part III draft and its corrections. **Correction:** two entries added (Entry 128 for the Part III draft, Entry 129 for this correction pass), following the exact format of Entries 126/127 (the Part I precedent), and the log's header "Last controlled update" line updated to point to Entry 129.

**Finding 4 — Remove the unsupported Reward Program ownership grant.** The Traceability Matrix's §11.1 row cited FD-5 as authority for the clause's "owns" language, but FD-5 establishes only that Businesses are "responsible for and in control of" their own Reward Programs — a product/commercial position, not a legal ownership conclusion — per the Legal Counsel Handoff Pack's own framing. Citing FD-5 for "owns" risked silently settling an ungoverned legal (IP/ownership) question. **Correction:** the clause text was not changed, because "owns" already appears in the Founder-approved Part I §6.1 ("Each Business owns and controls its own Reward Program"), sourced there to the Legal Counsel Handoff Pack §2 governing principle, not FD-5 — §11.1 restates existing approved terminology, it does not introduce a new ownership proposition. The Traceability Matrix's §11.1 row was corrected to attribute "owns" to the Legal Counsel Handoff Pack §2 principle (consistent with §6.1's own citation) and to attribute FD-5 only to the "responsible for and in control of" proposition it actually establishes.

**Finding 5 — Update the stated number of document parts.** The "How to read this document" narrative still said "This document has three parts," which became false once this task's Part III bullet was added to the list (now four: Part 0, I, II, III). **Correction:** the sentence was updated to "This document has four parts."

**Finding 6 — Reconcile the correction inventory to six labels.** The Drafting Report's §7 (Parts I–II integrity), §39 (diff summary), and §44 (validation results) still stated "five" administrative scope-label corrections, inconsistent with the corrected Traceability Matrix and the Part I heading note fix recorded in this same report's own §33/§34. **Correction:** §7, §39, and §44 of the Drafting Report were updated to state "six," with the sixth (Part I heading note) explicitly attributed to the PR-review correction pass rather than the original five-item drafting-pass inventory.

## Third re-review — three genuinely new findings out of six reported (all P2)

`@codex review` was requested a second time to confirm the Finding 3–6 corrections. The third review (head `9ae48745`) reported six findings; direct inspection of current file content confirmed three were **stale re-flags of already-fixed Round 1/Round 2 items** (the documentation-changes-log entry, the §11.1 "owns" citation, and "three parts" — all already corrected by the commits above) and three were **genuinely new**:

**Finding 7 — Preserve the confirmed MVP no-expiry policy.** §13.6 as originally drafted affirmatively authorized a Business's Reward Program to provide for reward expiry now ("Where a Business's Reward Program provides for the expiry of an unredeemed reward, that expiry is a matter of the Business's own Reward Program..."). This is a genuine authority-review gap: `decision-register.md`'s `DEC-LOY-005` ("No automatic reward expiry in MVP") is **CONFIRMED** and states earned rewards do not auto-expire in the MVP, with the `expired` reward state architecturally supported but not enabled. A schema state existing does not, by itself, authorize a Business to contractually rely on it. **Correction:** §13.6 was rewritten to state that an earned reward does not currently auto-expire, that this clause does not itself authorize a Business's Reward Program to provide for expiry, and that any future per-program expiry policy requires separate governed platform authorization — preserving `DEC-LOY-005` exactly, without inventing a permanent no-expiry rule (the schema-supported `expired` state and `DEC-LOY-005`'s own "future expiry policies possible per program" language mean this is a current-governance statement, not a permanent prohibition). This is the one substantive drafting fix in this correction pass; every other correction is administrative or citation-only.

**Finding 8 — Correct the still-stale Part II architecture label.** The Part 0 §0.1 proposed architecture list still labelled Part II "heading only — not drafted," even though §§8–10 were fully drafted in task `DEC-LEGAL-002-BT-DRAFT-002` — a stale label that predates this task entirely (it was never corrected during Part II's own drafting or its two correction passes). **Correction:** the label was corrected to "drafted in task `DEC-LEGAL-002-BT-DRAFT-002` — see Part II below," matching the treatment already given to the Part III label in the same list.

**Finding 9 — Include the correction report in the file inventory.** The Drafting Report's §38 file inventory and its "No other file was modified" closing statement did not list the newly created `DEC-LEGAL-002-BT-DRAFT-003-CORR-001-correction-report-2026-08-30.md` itself. **Correction:** the Drafting Report's §38 was updated to include this correction report, and §5, §20, §34 were updated to record the `DEC-LOY-005` finding and its correction.

## Fourth re-review — three findings, all consistency follow-ons from round 3 (no new substantive issue)

A third `@codex review` request (head `43f6d993`) returned six comments; four were confirmed stale re-flags of already-fixed round 1–3 items, and two were genuine consistency follow-ons from the round-3 `DEC-LOY-005` and Part-II-label corrections that had not yet propagated to every summary location:

**Finding 10 — Align the §13 summary with the corrected no-expiry policy.** The Drafting Report's §15 ("§13 clauses drafted" summary) still said "reward expiry left to each Business's Reward Program, no platform-wide rule," reintroducing the exact policy round 3 had removed from §13.6 and the report's own §20/§34. **Correction:** §15 updated to state that reward expiry preserves the `DEC-LOY-005` CONFIRMED position, with a cross-reference to §20/§34.

**Finding 11 — Update the correction inventory to seven labels.** The Traceability Matrix's "Clauses removed" narrative and the Drafting Report's §7/§39/§44 still said "five" or "six" administrative corrections after round 3 added the Part 0 §0.1 Part II architecture label as a seventh. **Correction:** all four locations updated to state "seven," with the count broken out (five original + two PR-review).

**Finding 12 — Reconcile the decision-register arithmetic.** The decision-register "Last controlled update" summary said "nine findings... leaving six distinct corrections," an internally inconsistent count against the report's own 2+4+3=9 breakdown. **Correction:** restated as twelve total review comments across three rounds (2+4+6), three of which (round 3) were confirmed stale, yielding nine substantively distinct corrections — matching the correction report's own finding numbering (1 through 9, plus this fourth round's three non-substantive consistency follow-ons, which do not add new findings to that count since they only propagate already-made corrections to remaining summary text).

## Fifth re-review — two further substantive drafting findings (both genuine)

A fourth `@codex review` request (head `8f765b2`) returned six comments; four were confirmed stale re-flags of already-fixed items, and two were genuine substantive drafting findings against §11.1, both missed by this task's original authority review:

**Finding 13 — Preserve the platform-fixed MVP earning threshold.** §11.1 originally stated the Business "determines... the threshold(s) for earning a reward," but `TRD10-firestore-data-architecture.md` §10.9.2's Threshold Rule (MVP) fixes `requiredVerifiedUnits` at 10 by platform rule, explicitly "not business-configurable," with any alternative requiring "formal product approval and never retroactively." The clause granted the Business a configuration authority the governed architecture does not give it. **Correction:** §11.1 rewritten to state the Business's authority operates "within the platform's governed shared catalogue and reward-cycle mechanics — including any platform-fixed earning threshold, which this section does not authorize a Business to alter."

**Finding 14 — Keep the qualifying-purchase decision unresolved.** §11.1 originally stated the Business "determines what qualifies as a rewardable purchase," but the Legal Counsel Handoff Pack §4 lists "qualifying-purchase definition" among the rows "not yet Founder-positioned, still genuinely open," expressly not asked of counsel as if decided. The clause silently resolved a question no product position exists for. **Correction:** §11.1 rewritten so the Business "selects the purchasable categories from that catalogue that qualify under its own Reward Program" (the narrower, already-governed catalogue-selection authority `TRD10`'s `qualifyingKnowledgeNodeIds` architecture actually supports) and added an explicit sentence that "this section does not resolve the separate, still-open question of how a qualifying purchase is generally defined" — the same explicit-non-resolution technique §13.7 and §14.4 use.

Both corrections are substantive (they change what §11.1 actually authorizes a Business to do), unlike every other finding in this correction pass, which was administrative/citation-only. The Traceability Matrix's §11.1 row and the Controlled Inputs Register's stale §13.6 rationale bullet (still describing the pre-correction schema-only rationale) were also corrected in this pass, and a new explanatory bullet was added for §11.1 alongside the existing §14.4 bullet.

## Verification

- Direct search confirmed no other instance of "Parts III–VIII" or "Part III, not drafted" remains anywhere in the instrument after both corrections.
- The corrected §14.4 text was re-checked against the prohibited-concept list: it does not assert universal reacceptance, does not assert no-reacceptance, and does not resolve `DEC-ID-005`, `DEC-LOY-009`, or any `DEC-SUB-*` item.
- Parts I, II, and the rest of Part III were verified unchanged by direct diff — only §14.4 and the Part I heading note were touched by this correction pass.
- No new Controlled Input was created. CI-01/CI-05 remain the only open controlled inputs. `DEC-LEGAL-002` = `OPEN_LEGAL`; Capability 3 = Open; Terms = `NOT CONFIGURED`; `DEC-ID-005`/`DEC-LOY-009`/all unresolved `DEC-SUB-*` unchanged.
- Docs-only; no application, source, Firebase, or configuration change.

## Files modified

- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` (§14.4 rewritten; Part I heading note corrected; "three parts" → "four parts"; header/version metadata updated to v3.1)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md` (§14.4 row corrected; §11.1 row's "owns" citation corrected; scope-label-correction row updated to six; header/version metadata updated to v3.1)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md` (explanatory bullet added to Part III review section; header/version metadata updated to v3.1)
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-003-drafting-report-2026-08-30.md` (§§7/33/34/39/44 corrected to six administrative corrections and to record both review rounds)
- `docs/00-governance/documentation-changes-log.md` (Entry 128 and Entry 129 added; header "Last controlled update" line updated)
- `docs/00-governance/decisions/decision-register.md` (new history entry for this correction pass)
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-003-CORR-001-correction-report-2026-08-30.md` (this report, new file)
