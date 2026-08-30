> **Title:** DEC-LEGAL-002-BT-DRAFT-001 — Core Business Terms Instrument Architecture & Part I Drafting Report
> **Version:** 1.1 (2026-08-30 — superseded in part by the [Correction Report](DEC-LEGAL-002-BT-DRAFT-001-CORR-001-correction-report-2026-08-30.md); this report's original narrative below is left intact as the historical record of the v1.0 drafting session, per the instruction not to rewrite historical reports — see the Correction Report for what changed and why) · **Status:** Report — controlled drafting complete for Part I only (as of v1.0); corrected per Founder disposition (v1.1, see Correction Report) · **Classification:** Working (governance record — implementation/drafting report)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LEGAL-002` (Status: `OPEN_LEGAL`, unchanged)
> **Task:** `DEC-LEGAL-002-BT-DRAFT-001` (v1.0); `DEC-LEGAL-002-BT-DRAFT-001-CORR-001` (v1.1 correction, separate report)
> **Date:** 2026-08-30
> **Deliverables produced:** [Core Business Terms — Draft](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md); [Drafting Traceability Matrix](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md); [Controlled Inputs Register](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md); this report; [Documentation Changes Log](../../00-governance/documentation-changes-log.md) Entry 126; [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LEGAL-002` Notes addendum.

# 1. Entry repository state

- Prior branch: `docs/dec-legal-002-founder-disp-001`, fully merged into `origin/main` via PR #202 (merge commit `5c2d1df`). `git merge-base --is-ancestor` confirmed.
- `origin/main` HEAD at task start: `5c2d1df` (merge of PR #202), with `9bd6a2b` and `f87da96` as the two commits immediately before it.
- Working tree contained the pre-existing untracked files listed in the task brief (`WORKING_WITH_THE_FOUNDER/`, `docs/00-governance/verified-loyalty-*.md`, the Product Manifesto, several `docs/05-implementation/reports/*` files, `docs/06-engineering-governance/*`, `docs/07-product-design.zip`, `docs/11thONUS-at-a-Glance.md`, `docs/30-go-to-market/`). None of these were touched, staged, committed, or moved.
- No lockfiles, no in-progress git operations (`.git/*.lock` absent; `git status` clean apart from the untracked files above).

# 2. Drafting branch/base

- New branch `docs/dec-legal-002-bt-draft-001` created directly from `origin/main` (`git branch docs/dec-legal-002-bt-draft-001 origin/main`, after `git fetch origin main`), then checked out. `git status --short --branch` confirmed "up to date with origin/main" and the same untracked-file set, undisturbed.

# 3. Authorities inspected (file paths)

- `docs/00-governance/decisions/decision-register.md` — `DEC-LEGAL-002` entry (Status `OPEN_LEGAL`) and `DEC-LOY-011` entry (Status `CONFIRMED`).
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-terms-drafting-readiness-2026-08-29.md` (v2.0) — the 16/17-row section-by-section readiness table (see §6 discrepancy note below), jurisdiction architecture, Terms Drafting Gate.
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-terms-content-architecture-2026-08-29.md` (v3.0) — proposed heading structure, Phase G existing-implementation contract (acceptance mechanism factual description).
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md` (v2.0) — LEG-FD-01 through LEG-FD-15, full text read.
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-FOUNDER-DISP-001-legal-counsel-handoff-pack-2026-08-29.md` (v2.0) — FD-1 through FD-7, factual product model, obligation/responsibility matrices, instrument architecture, counsel question set summary.
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-resolution-assessment-2026-08-29.md` (v2.0) — confirmation that `DEC-LEGAL-002`/Capability 3/Terms-configuration/`EXT-LEG-002` statuses are unchanged by readiness, and that only drafting/approval/configuration remain.
- `docs/00-governance/documentation-changes-log.md` — read for naming/entry conventions (most recent entries, Entry 125 in full).
- `docs/00-governance/decisions/decision-register.md` — read for `DEC-LEGAL-002` Notes-field precedent (how prior tasks append without changing Status).

Not re-read in full text (referenced only, per the readiness note's own citations, consistent with the task's instruction to inspect "at minimum" the listed items and use judgment on completeness): the External Legal Opinion body, the Reconciliation Matrix, the Legal Counsel Question Set, and the Business Obligation Matrix/Product & Legal Decision Brief/Founder Decision Sheet/Resolution Plan — their conclusions are fully summarized and cross-referenced inside the four documents read in full above, and no unresolved cross-reference required opening them directly to draft Part I.

# 4. Drafting strategy

No conflict was found among the authorities. LEG-FD-01–15 explicitly states it does not reopen or contradict FD-1–FD-7 or `DEC-LOY-011` (Founder Legal Architecture Disposition Record, "Relationship to FD-1–FD-7" note and "Cross-Cutting Notes"), and the Resolution Assessment (v2.0) confirms LEG-FD-14/15 close the only two items that had been open, without altering any earlier disposition. Given no conflict, drafting proceeded per the task's own instruction. Strategy: (a) establish the complete proposed instrument architecture first (Part 0), mapping every readiness-table row to a proposed section, so later drafting tasks have a fixed target structure; (b) draft only Part I (§§1–7) with full clause text, tracing every clause to a specific governing authority; (c) use `[CONTROLLED INPUT REQUIRED: ...]` markers for any genuinely unresolved input rather than inventing a value; (d) keep the contractual text itself free of internal decision-ID citations (confirmed as repository convention — no comparable drafted instrument text embeds `LEG-FD-xx`/`FD-x`/`DEC-xxx` strings), moving all traceability into a separate matrix; (e) perform an actual grep-based prohibited-concept search over the finished draft before recording it, not a mental check only.

# 5. Proposed complete Terms architecture

See Core Business Terms draft §0.1 for the full 27-heading, 8-Part structure (Parts I–VIII). Summary: Part I Foundation/Relationship/Acceptance (drafted); Part II Business Participation (headings only); Part III Programme Operation (headings only); Part IV Platform Governance of the Relationship (headings only); Part V Commercial Terms (headings only); Part VI Risk Allocation (headings only); Part VII Legal Mechanics (headings only); Part VIII Jurisdictional Overlays (architecture only, no overlay drafted).

# 6. 16/16 mapping result

The Terms Drafting Readiness Note's narrative concludes "16 of 16 sections ready to draft," but its own §3 table (verified by direct `grep` of the table rows, reproduced in Core Business Terms draft §0.2) lists **seventeen** distinct rows. This is recorded as an observed discrepancy in a read-only historical evidence document — not corrected in that document (per the instruction not to overwrite historical evidence) and not treated as a substantive conflict, since every one of the seventeen rows is independently marked **Ready** with no contradiction between rows. All seventeen rows were mapped to a proposed section in draft §0.2; none omitted.

# 7. Part I sections drafted

§1 Parties and Agreement; §2 Definitions (Part I terms only); §3 Purpose and Scope; §4 Platform Role; §5 Independent Business Relationship (No Agency); §6 Business/Customer Relationship Boundary; §7 Acceptance and Formation. Parts II–VIII are headings/placeholders only, per task scope.

# 8. Platform-role treatment

§4 describes 11thONUS as providing identity/account-authority infrastructure, a shared purchasable-category catalogue, purchase recording/verification, and reward-cycle mechanics (traced to the Legal Counsel Handoff Pack §2 factual model) — and explicitly states the platform verifies but does not design Reward Program content, and is not a party to the Business-customer transaction. No overstatement of platform responsibility was introduced.

# 9. Business/customer relationship treatment

§6 states the governing principle verbatim in substance ("platform standardises trust... does not become one shared loyalty programme... does not take ownership of the Business/customer relationship" — Legal Counsel Handoff Pack §2), confirms the Business owns its Reward Program and customer relationship, and confirms a customer is not a party to this instrument (§6.3), consistent with LEG-FD-09/LEG-FD-10.

# 10. Independent/no-agency treatment

§5 states no partnership/joint venture/franchise/agency/employment relationship, no authority to bind absent express grant, and that the Business is independently responsible for its own operations — traced to LEG-FD-01's governing interpretation principle applied to relationship characterisation.

# 11. Acceptance treatment

§7 implements LEG-FD-03's exact five-element portable acceptance standard (affirmative act; identifiable accepting party; exact Terms version; authoritative timestamp; retrievable accepted Terms) and explicitly declines to impose forced scrolling or a re-type-to-confirm mechanism platform-wide (§7.3), consistent with LEG-FD-03's classification of that recommendation as jurisdiction-conditional, not global. §7.4 flags (without resolving) that reacceptance-on-Terms-change mechanics are a separate, not-yet-authorized engineering decision per LEG-FD-13.

# 12. Definitions introduced

Six Part-I-scoped definitions only: "11thONUS"/"the platform," "Business," "Reward Program," "Customer," "Terms," "Accepting Individual." No unresolved product concept (e.g., "Verified Unit," "Loyalty Cycle," gift-card/stored-value terms) was defined into existence; those remain for later Parts if and when drafted.

# 13. Controlled placeholders introduced

Six markers (CI-01 through CI-06): operator's registered legal identity (Preamble); multi-entity/affiliate scope (§1.2); single-global-text-vs-jurisdiction-variant assumption (§3.3); service-tier differentiation (§4.4); reacceptance-on-change engineering decision (cross-referenced at §7.4, tracked as CI-05); delegated-staff acceptance authority (§7.5). Full detail in the Controlled Inputs Register.

# 14. Controlled Inputs Register summary

Classifications applied: 2 "required before Founder approval" (CI-01, CI-02), 2 "required before legal approval" (CI-03, CI-06), 1 "required before Terms configuration" (CI-05), 1 "future commercial input" (CI-04), 0 "jurisdiction-overlay input" rows in Part I specifically (jurisdiction variation is addressed structurally in §26/§0.0 rather than as a Part-I placeholder). CI-01 also carries a legal-approval requirement (dual-classified). See the full register for detail.

# 15. Jurisdiction-overlay treatment

§0.0 records the three-layer architecture (Terms Drafting Readiness Note §1) and the four-instrument map (A–D). §7.3 explicitly reserves forced-scrolling-type additional confirmation mechanisms to a jurisdictional overlay rather than adopting them globally. §26/§27 (Part VIII) are recorded as headings only — the Burundi overlay is explicitly **not** drafted, per task instruction.

# 16. Customer Terms boundary

§0.0, §3.2, and §6.3 all state that Customer Terms / Platform Terms of Use is a separate, not-yet-drafted future instrument, and that this document does not resolve whether or how it will be established. No Customer Terms content was drafted.

# 17. Business Reward Program boundary

§6.1/§6.2/§6.4 confirm Business Reward Program Rules remain Business-authored and Business-controlled, distinct from this Core Business Terms instrument; the platform's role is limited to the governed minimums referenced (forward, not drafted) in later Parts.

# 18. Traceability result

Every clause in Part I (§§1–7, including sub-clauses) is mapped in the [Drafting Traceability Matrix](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md) to a specific governing authority, or explicitly marked as having no governing authority (and therefore carrying a controlled-input marker rather than invented text). No clause was found untraceable and left in the draft without either an authority citation or a controlled-input marker.

# 19. Prohibited-concept search result (actual grep output)

Ran a case-insensitive `grep` for each prohibited/rejected concept in the task's §6 boundary list directly against the finished draft file. Results:

```
=== 30 day ===        (no match)
=== 30-day ===         (no match)
=== 60 day ===         (no match)
=== 60-day ===         (no match)
=== $25 ===            (no match)
=== Kirundi ===        (no match)
=== forced scroll ===  (no match)
=== scrolling ===      1 match — §7.3, "...do not require a forced-scrolling mechanism..." (a negation/declination, not an adoption)
=== no monetary value ===  (no match)
=== no economic value ===  (no match)
=== 7 day / 7-day ===  (no match)
=== 14 day / 14-day === (no match)
=== 24 hour / 24-hour === (no match)
=== 48 hour / 48-hour === (no match)
=== grace period ===   (no match)
=== trial ===          (no match)
=== proration ===      (no match)
=== tier ===           1 match — §4.4, a CONTROLLED INPUT REQUIRED marker flagging (not resolving) service-tier differentiation as unresolved
=== plan name ===      (no match)
=== gift card ===      (no match)
=== stored value ===   (no match)
=== DEC-SUB ===        2 matches — draft §0.1 heading text ("no `DEC-SUB-*` values") and the Status Reaffirmation banner ("unresolved, unchanged") — both correctly non-resolving
=== DEC-ID-005 ===     1 match — Status Reaffirmation banner, "OPEN_FOUNDER" (unchanged status statement only)
=== DEC-LOY-009 ===    1 match — Status Reaffirmation banner, "OPEN_FOUNDER" (unchanged status statement only)
=== cash settlement === (no match)
=== must convert ===   (no match)
=== consideration ===  (no match)
```

No prohibited concept was found adopted, resolved, or invented anywhere in the draft. Every hit above is either a correctly-worded declination, a flagged-but-unresolved controlled input, or an unchanged-status confirmation.

# 20. `DEC-LEGAL-002` status

Unchanged — remains `OPEN_LEGAL`. A Notes-field addendum was appended to the Decision Register entry (following the same pattern used for the FD-1, `DEC-LEGAL-002-LEGAL-OPINION-RECON-001`, and `DEC-LEGAL-002-FOUNDER-CLOSE-001` updates), recording that Part I of the Core Business Terms has been drafted and self-reviewed, without changing Status.

# 21. Capability 3 status

Unchanged — remains `Open — engineering work packages complete; blocked on governed Terms-content configuration` per `CDR-001` §5 (not modified by this task).

# 22. Terms configuration status

Unchanged — remains **NOT CONFIGURED**. `platformConfig/businessTerms` was not read or written; no Firebase action was taken.

# 23. Files modified/created (full list, absolute paths)

Created:
- `/Users/theo/11THONUS/docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md`
- `/Users/theo/11THONUS/docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md`
- `/Users/theo/11THONUS/docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md`
- `/Users/theo/11THONUS/docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-001-drafting-report-2026-08-30.md` (this file)

Modified:
- `/Users/theo/11THONUS/docs/00-governance/documentation-changes-log.md` (new entry appended)
- `/Users/theo/11THONUS/docs/00-governance/decisions/decision-register.md` (`DEC-LEGAL-002` Notes-field addendum only; Status untouched)

Not modified: any file under `apps/`, `functions/`, Firebase configuration, Firestore/Storage Rules, or any pre-existing untracked file in the working tree.

# 24. Diff summary

Four new files (drafting deliverables), two existing governance files edited by append-only addition (documentation changes log new entry; decision register Notes-field text appended to the existing `DEC-LEGAL-002` entry, no deletion of existing text, no Status/field-value change).

# 25. Commands executed

`git fetch origin main`; `git branch docs/dec-legal-002-bt-draft-001 origin/main`; `git checkout docs/dec-legal-002-bt-draft-001`; `git status --short --branch` (multiple); `git log --oneline -5 origin/main`; `git rev-parse HEAD`/`origin/main`; `grep`-based authority location and prohibited-concept searches (no application build/test commands run — documentation-only task, no application code touched).

# 26. Dependencies added

None.

# 27. Config changes

None.

# 28. Application/source changes

**NONE.** No file under `apps/`, `functions/`, `firestore.rules`, `storage.rules`, `firebase.json`, or any Terms-version configuration path was read, written, or otherwise touched by this task.

# 29. Validation performed

- Repository-state verification (branch/HEAD/ahead-behind/untracked files/lock files) before and after branch creation.
- Full-text reading of the five primary governing evidence documents plus the Decision Register entries for `DEC-LEGAL-002` and `DEC-LOY-011`.
- Cross-check of the Terms Drafting Readiness Note's §3 table row count against its own narrative "16/16" conclusion (discrepancy found and disclosed, not silently reconciled).
- Clause-by-clause self-review of Part I against FD-1–FD-7, LEG-FD-01–15, and `DEC-LOY-011` (recorded in the Traceability Matrix — every clause traced or flagged).
- Actual `grep`-based prohibited-concept search across the finished draft (§19 above), not a mental check only.
- Confirmed (by inspection of comparable already-drafted materials in the repository) that contractual text in this governance suite does not embed internal decision-ID citations, informing the decision to keep the Traceability Matrix separate from the contractual text itself.

# 30. Risks/open drafting inputs

- Six controlled inputs remain open (CI-01–CI-06, Controlled Inputs Register) — most materially, the operator's registered legal identity (CI-01), without which no real Terms version can ever be configured regardless of drafting completeness.
- The Terms Drafting Readiness Note's internal 16-vs-17 row-count discrepancy (§6/§19 above) was flagged to the Founder for correction. **Resolved 2026-08-30 by `DEC-LEGAL-002-BT-DRAFT-001-CORR-001`:** the Founder confirmed the enumeration error (17 rows, all Ready) and directed the live draft/traceability/register/report documents to state 17/17; the Terms Drafting Readiness Note itself remains unedited as historical evidence. See the [Correction Report](DEC-LEGAL-002-BT-DRAFT-001-CORR-001-correction-report-2026-08-30.md).
- Parts II–VIII remain entirely undrafted; a large majority of substantive Business Terms content (reward obligations, suspension, exit, liability, dispute mechanics, subscription structure) does not yet exist in drafted form, despite all sixteen/seventeen readiness-table sections being architecture-ready.
- The reacceptance-on-Terms-change engineering decision (CI-05, per LEG-FD-13) must be separately authorized before any drafted Changes-to-Terms clause (Part VII §22, not yet drafted) can be implemented, independent of this task.

# 31. Rollback instructions

All changes are isolated to the new branch `docs/dec-legal-002-bt-draft-001`, which has not been merged. To roll back: delete the local branch (`git branch -D docs/dec-legal-002-bt-draft-001` after checking out a different branch) and close the PR referenced in §36 below without merging; `origin/main` is untouched. The two edited files (documentation changes log, decision register) received append-only edits — reverting the branch fully removes both edits with no partial-revert risk.

# 32. Drafting report path

`/Users/theo/11THONUS/docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-001-drafting-report-2026-08-30.md` (this file).

# 33. Persistent changes-file path

`/Users/theo/11THONUS/docs/00-governance/documentation-changes-log.md` (new entry appended — see Entry immediately following Entry 125).

# 34. Branch name

`docs/dec-legal-002-bt-draft-001`

# 35. Commit SHA(s)

Recorded after commit — see the accompanying PR description for the exact SHA once pushed (this report is written before the commit is created in the drafting workflow, so the SHA is confirmed in the final message to the Founder, not hardcoded here to avoid a stale/incorrect value).

# 36. PR number/status

Recorded after `gh pr create` — see the final message to the Founder for the exact PR number and URL. Not self-merged; left open for Founder/review per task instruction.

# 37. Exact Founder next action

1. Review the Core Business Terms draft (Part 0 architecture + Part I text) for consistency with Founder intent.
2. Resolve, or direct resolution of, the six controlled inputs (CI-01 most urgently — the operator's registered legal identity — since it blocks every subsequent Part).
3. Decide whether to authorize drafting of Parts II–VIII next, and in what order.
4. Do not merge this PR as if it were an approved Terms version — merging only advances the drafting record; it does not approve, configure, or make effective any Terms content, and does not change `DEC-LEGAL-002`, Capability 3, or Terms-configuration status.

---

**CORE BUSINESS TERMS STRUCTURE ESTABLISHED — PART I DRAFTED — AWAITING FOUNDER REVIEW; NOT APPROVED / NOT EFFECTIVE / NOT CONFIGURED**
