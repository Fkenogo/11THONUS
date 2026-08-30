> **Title:** DEC-LEGAL-002-BT-DRAFT-001-CORR-001 — Core Business Terms Part I Founder Correction Report
> **Version:** 1.0 · **Status:** Report — correction pass complete, PR #203 updated, awaiting Founder re-review · **Classification:** Working (governance record — correction/implementation report)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LEGAL-002` (Status: `OPEN_LEGAL`, unchanged)
> **Task:** `DEC-LEGAL-002-BT-DRAFT-001-CORR-001`
> **Date:** 2026-08-30
> **Corrects:** [Core Business Terms — Draft](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md) (v1.0 → v1.1); [Drafting Traceability Matrix](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md) (v1.0 → v1.1); [Controlled Inputs Register](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md) (v1.0 → v1.1); [Drafting Report](DEC-LEGAL-002-BT-DRAFT-001-drafting-report-2026-08-30.md) (v1.0 → v1.1, pointer only, historical narrative intact)

# 1. Entry repository/PR state

- Branch at task start: `docs/dec-legal-002-founder-disp-001` (unrelated in-progress branch in the working tree). Checked out `docs/dec-legal-002-bt-draft-001` directly (fetched from `origin`), which was already up to date with `origin/docs/dec-legal-002-bt-draft-001` at commit `33f6449463d9116ccc118b005bc758d86e9fb28c`.
- `gh pr view 203` confirmed: PR #203, `docs/dec-legal-002-bt-draft-001` → `main`, `OPEN`, `MERGEABLE`, head `33f6449`.
- Working tree apart from the branch's own tracked files: clean except the pre-existing untracked files enumerated in the task brief (`WORKING_WITH_THE_FOUNDER/`, `docs/00-governance/verified-loyalty-*.md`, the Product Manifesto, several `docs/05-implementation/reports/*` files, `docs/06-engineering-governance/*`, `docs/07-product-design.zip`, `docs/11thONUS-at-a-Glance.md`, `docs/30-go-to-market/`). None of these were touched, staged, committed, or moved.
- No inline PR review comments were found; the Founder's APPROVE WITH CORRECTIONS disposition and the itemized corrections exist only in the governing task text, which the task brief states is authoritative for this purpose.

# 2. Correction strategy

Checked out the existing branch (no new branch created) and edited the four BT-DRAFT-001 deliverables in place, applying each of the eleven itemized corrections directly to the affected clause(s), then propagating each change into the companion Traceability Matrix and Controlled Inputs Register so no document falls out of sync with the corrected draft. The already-published Terms Drafting Readiness Note (2026-08-29, a prior task's historical evidence file) was read for independent row-count verification but not edited — per the task's explicit instruction not to rewrite historical evidence merely to make old reports numerically match. The original Drafting Report (v1.0) narrative was likewise left intact as the historical record of what was actually done and found during the original drafting session (it already correctly reported 17 rows and flagged, rather than silently adopted, the discrepancy); only a version-header pointer and one risk-bullet resolution note were added there, with the substantive correction record kept in this separate report to avoid rewriting history. Every correction below traces to either existing governing authority already cited in the v1.0 draft (LEG-FD-01, LEG-FD-09, LEG-FD-10, LEG-FD-13) or to the Founder's own correction disposition text (which is itself a governing authority for this task, per the task brief).

# 3. Exact clauses changed

Core Business Terms draft (`docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md`):
- §1.2 (rewritten — entity-scope resolution)
- §1.3 (rewritten — authority-representation correction)
- §2 definition of `"11thONUS"`/`"the platform"` (rewritten — platform-category correction)
- §3.2(c) (rewritten — Customer Terms certainty correction)
- §3.3 (rewritten — jurisdiction-architecture resolution)
- §4.4 (deleted in full — service-tier placeholder removed)
- §6.3 (rewritten — Customer Terms certainty correction)
- §7.1 (rewritten — continued-participation correction)
- §7.5 (rewritten — delegated-acceptance resolution)
- §7.6 (rewritten — retention correction)
- §0.2 (rewritten — readiness-count correction, 16/16 → 17/17)
- Header block (version/task provenance updated to v1.1)

Traceability Matrix and Controlled Inputs Register: rows for the above clauses updated to match; the discrepancy note and the CI register's open/resolved split updated (detailed in §15/§17 below).

# 4. §1.3 authority correction

Removed: "11thONUS relies on this representation **and is not required to independently verify corporate authority** beyond the Business's own account-authority structure." Replaced with: 11thONUS relies on the representation, **may request reasonable evidence of authority** where necessary for verification, security, compliance, dispute resolution, or platform integrity, and this section **does not establish a routine or universal** corporate-authority verification requirement. This preserves the representation (no new burden on ordinary onboarding) while removing the categorical no-verification-ever statement the Founder flagged, and does not create a routine verification obligation the Founder did not authorize.

# 5. Customer Terms correction

§3.2(c) previously read "...which — **if and when established** — is governed by a separate Customer Terms / Platform Terms of Use instrument..." — hypothetical-instrument framing. Corrected to state the instrument **is** governed by the separate Customer Terms / Platform Terms of Use instrument, described as "an approved separate legal-instrument architecture and a distinct future controlled work package under the differentiated-instrument model (LEG-FD-10)." §6.3 previously read "**Where** 11thONUS establishes a direct relationship with customers..." and "Nothing in this section should be read as already establishing, **or as declining to establish**, that separate instrument" — both phrasings treated the architecture itself as undecided. Corrected to state the relationship **is** governed by the separate instrument (approved architecture), while still not drafting any of its content and not making Customer Terms a Capability 3 blocker (no change to Capability 3's status anywhere in this pass — see §22 below).

# 6. §7.1 correction

Removed "Acceptance is a precondition to the Business submitting for platform verification **and to the Business's continued participation on the platform**" (a universal predetermination of an unresolved matter). Replaced with a statement that acceptance is a precondition to submission for verification only, and that whether continued participation requires ongoing/repeat acceptance (including on a Terms version change) is **not resolved by this section**, reserved to §22 (Changes to These Terms; Reacceptance, Part VII, not drafted) and the separately governed reacceptance-implementation decision. §7.4 (which already deferred the reacceptance-on-change mechanism to a future Changes-to-Terms clause) was reviewed for consistency and required no further change — it was already correctly non-resolving.

# 7. §7.6 retention correction

Removed "for so long as **necessary to demonstrate** the Business's agreement" (an implied retention standard tied to evidentiary necessity). Replaced with: 11thONUS maintains an **auditable** record, and **retention is subject to applicable law and 11thONUS's governed data-retention policy**; the section explicitly states it does not itself establish a retention period or standard. No open retention/privacy decision was resolved by this correction — it defers to whatever governed policy exists or is later adopted.

# 8. Platform-definition correction

Replaced the §2 definition of `"11thONUS"`/`"the platform"` — previously "the identity, purchase-verification, and reward-cycle infrastructure described in §4" (a narrow technical/functional definition doubling as the product-category definition) — with "the **customer-verified loyalty platform** operated by the entity identified in the Preamble, including the infrastructure and functions described in §4." The detailed infrastructure/function description (identity, purchase verification, reward-cycle mechanics) remains in §4 exactly as before; only the Part-I definitional label changed, matching the governed product-category language already used in §3.1 ("customer-verified loyalty (\"Reward\") programmes"). No product capability was expanded or narrowed.

# 9. Business-entity scope disposition

§1.2 resolved (was CI-02): "These Terms bind only the legal entity or sole proprietor registered as the Business. An affiliate, related company, franchisee or other separate legal person is not automatically a party merely because of its relationship with that Business, unless expressly agreed by 11thONUS under an applicable governed arrangement." No multi-entity/franchise-group participation feature is created or implied; the default is single-entity binding, with a narrow express-agreement escape hatch that itself requires a future governed arrangement (not self-executing).

# 10. Jurisdiction-overlay disposition

§3.3 resolved (was CI-03): restates the already-governed three-layer architecture from the Terms Drafting Readiness Note §1 (Layer 1 portable Core Terms + Layer 2 jurisdictional overlays), removing the "has not been tested against a drafted overlay" hedge framing it as unresolved. Adds that 11thONUS may present a consolidated/localized rendering of the applicable text for accessibility without changing the underlying two-layer architecture (a presentation clarification, not a new legal layer). This tracks LEG-FD-01/LEG-FD-10 and the Readiness Note §1 verbatim architecture, so it resolves a drafting-uncertainty placeholder without inventing new legal structure.

# 11. Service-tier placeholder disposition

§4.4 deleted in full (was CI-04). No replacement clause was substituted in Part I — the Core Terms simply do not address service tiers at all in this Part, consistent with the instruction that any future commercial/service differentiation belongs to §18 (Subscription and Fees, Part V, not drafted) and relevant `DEC-SUB-*` governance. No tier was invented; none is implied by silence, since §4.1–§4.3 already describe the platform role as undifferentiated across Businesses.

# 12. Delegated-acceptance disposition

§7.5 resolved (was CI-06) conservatively: "Initial acceptance of these Terms may be given by the registering Business Owner or another individual with authority to bind the Business (see §1.3). Ordinary staff or platform permissions do not, by themselves, confer authority to accept or reaccept these Terms on the Business's behalf. Any future capability allowing a delegated staff member to accept or reaccept these Terms on the Business's behalf requires explicit governance/authorization." Reconciled against §1.3 (authority-to-bind representation, itself corrected in this pass) and the existing business-owner-scoped acceptance mechanism (Terms Content Architecture Phase G) — no contradiction found; the two sections now use consistent "authority to bind"/"registering Business Owner" language.

# 13. Reacceptance remaining boundary

§7.4 was reviewed and left unchanged in substance: it already states that a prior acceptance does not carry over to a new version and that the reacceptance mechanism is reserved to a future Changes-to-Terms clause (§22, Part VII, not drafted). This remains the controlled boundary — CI-05 (the reacceptance-on-Terms-change engineering/design decision) remains open in the Controlled Inputs Register, unresolved by this correction pass, per the task's explicit instruction to keep this matter controlled and reserved to §22.

# 14. 17/17 verification and corrections (verification work shown)

Independently re-read the Terms Drafting Readiness Note (`docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-terms-drafting-readiness-2026-08-29.md`) §3 table in full. Counted the table's data rows by direct line inspection (source lines 30–46 of that file, one row per governed Business Terms section):

1. Parties/relationship — **Ready**
2. Platform service — **Ready**
3. Business eligibility — **Ready**
4. Account authority — **Ready**
5. Reward Program responsibility — **Ready**
6. Transaction recording — **Ready**
7. Reward obligations — **Ready**
8. Prohibited conduct — **Ready**
9. Disputes/corrections — **Ready**
10. Suspension/termination — **Ready**
11. Programme changes — **Ready**
12. Data/privacy references — **Ready**
13. Fees/commercial provisions — **Ready**
14. Liability — **Ready**
15. Governing law/disputes — **Ready**
16. Changes to Terms — **Ready**
17. Electronic acceptance — **Ready**

Count: **17 rows, all marked Ready.** The note's own §6 narrative conclusion ("16 of 16 sections ready to draft... 16 of 16") and its Entry-126/documentation-changes-log and decision-register cross-references from the prior task all quote this "16 of 16" figure. This is a deterministic, mechanically countable discrepancy (a table row count vs. a narrative sentence in the same document), not a judgment call, so no blocker condition applies. Per the task's instructions, corrected the *live* readiness-count references — in the Core Business Terms draft §0.2, the Drafting Traceability Matrix's discrepancy note, and the Controlled Inputs Register's version header — from "16/16" (or the unresolved "sixteen/seventeen" framing used in the v1.0 draft) to **17/17**, explicitly recorded as a non-substantive enumeration correction: no substantive section was added, no readiness decision changed, and the prior 16/16 figure was a counting/labelling error in the Readiness Note's own narrative text. The Readiness Note itself (2026-08-29, historical evidence predating this correction task) was **not** edited, per the instruction not to rewrite historical reports/evidence to force a numeric match; a pointer to this correction was added to the original v1.0 Drafting Report's risk section instead.

# 15. Remaining Controlled Inputs (full list)

Exactly two controlled inputs remain open in Part I after this correction pass:

- **CI-01 — Operator's registered legal identity** (Preamble). Still missing: the operator's registered legal name, registration/company number, and registered address. Required before Founder approval and before legal approval. This is the most material remaining gap — no real Terms version can ever be configured without it.
- **CI-05 — Reacceptance-on-Terms-change engineering/design decision** (cross-referenced at §7.4, per LEG-FD-13). Still missing: what technically happens when an already-accepted Business faces a new Terms version. Required before Terms configuration; requires a new, narrowly-scoped Engineering + Founder decision, not created by this task.

Four former controlled inputs were resolved this pass and moved to the Controlled Inputs Register's "Resolved this correction pass" section: CI-02 (business-entity scope), CI-03 (jurisdiction architecture), CI-04 (service-tier differentiation — removed, not resolved-in-place), CI-06 (delegated-acceptance authority). This matches the task brief's expectation that the remaining material controlled inputs be limited to the contracting operator's legal identity and the reacceptance implementation/design boundary; no other authority was found requiring any of the four resolved items to remain open.

# 16. Traceability result

Every clause changed in this pass (§1.2, §1.3, §2 platform definition, §3.2(c), §3.3, §6.3, §7.1, §7.5, §7.6, §0.2) has a corresponding updated row in the [Drafting Traceability Matrix](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md), citing either the pre-existing governing authority (LEG-FD-01, LEG-FD-09, LEG-FD-10, LEG-FD-13, the Terms Drafting Readiness Note §1, Terms Content Architecture Phase G) or this task's own Founder correction disposition as the governing decision. The §4.4 removal is recorded in the matrix's "Clauses removed" section, and its former traceability row was deleted (the clause no longer exists to trace). No clause was left without a citation or an open-controlled-input marker.

# 17. Prohibited/conflict search result (actual grep output)

Ran case-insensitive greps against the corrected draft file for every category the validation instructions named:

```
$ grep -ni "DEC-SUB" docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md
(2 matches — §0.1 heading text "no `DEC-SUB-*` values" and the Status Reaffirmation banner "all unresolved `DEC-SUB-*` decisions = unresolved, unchanged" — both non-resolving statements, unchanged from v1.0)

$ grep -ni "DEC-ID-005\|DEC-LOY-009" docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md
(2 matches — Status Reaffirmation banner only, "OPEN_FOUNDER" unchanged-status statements)

$ grep -ni "retention period\|retain.*years\|for [0-9]+ years\|data.retention" docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md
(1 match — §7.6, "subject to applicable law and 11thONUS's governed data-retention policy" — a deferral, not a resolution)

$ grep -ni "staff.*accept\|delegat" docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md
(matches confined to §7.5's conservative statement that ordinary staff/platform permissions do NOT confer acceptance authority, and that any future delegated capability requires explicit governance — no overreach found)

$ grep -ni "if and when established\|if and when\|hypothetical" docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md
(no match — the hypothetical-instrument phrasing was fully removed from §3.2(c) and §6.3)

$ grep -ni "continued participation" docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md
(1 match — §7.1, now phrased as "whether... continued participation on the platform requires an ongoing or repeated acceptance... is not resolved by this section" — a non-resolving deferral, not a universal condition)

$ grep -ni "identity, purchase-verification, and reward-cycle infrastructure" docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md
(no match — the narrow technical definition was replaced; the phrase survives only descriptively inside §4, not as the Part-I definition of "11thONUS"/"the platform")

$ grep -ni "30-day\|60-day\|kirundi\|forced.scroll\|cash settlement\|gift card\|stored value\|\\$25\|nominal cap" docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md
(same results as the original v1.0 search, §19 of the Drafting Report — no adoption of any rejected legal-opinion recommendation; "scrolling" still appears once at §7.3 as a declination, unchanged by this pass)
```

No accidental resolution of any `DEC-SUB-*` item, no privacy/retention decision resolved, no staff-acceptance-authority overreach, no hypothetical Customer Terms wording remaining, no universal continued-participation reacceptance language remaining, no narrow technical redefinition of 11thONUS remaining, and no rejected legal-opinion recommendation adopted. Documentation only — confirmed zero app/source/Firebase/config changes (§22 below).

# 18. Files modified

Modified (existing files, corrected in place):
- `/Users/theo/11THONUS/docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md`
- `/Users/theo/11THONUS/docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md`
- `/Users/theo/11THONUS/docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md`
- `/Users/theo/11THONUS/docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-001-drafting-report-2026-08-30.md` (header pointer + one risk-bullet update only; substantive narrative left intact)
- `/Users/theo/11THONUS/docs/00-governance/documentation-changes-log.md` (new Entry 127 appended)
- `/Users/theo/11THONUS/docs/00-governance/decisions/decision-register.md` (`DEC-LEGAL-002` Notes-field addendum only; Status untouched)

Created:
- `/Users/theo/11THONUS/docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-001-CORR-001-correction-report-2026-08-30.md` (this file)

Not modified: any file under `apps/`, `functions/`, Firebase configuration, Firestore/Storage Rules, any dependency manifest, or any pre-existing untracked working-tree file.

# 19. Diff summary

Six existing files edited (four BT-DRAFT-001 deliverables corrected in place; documentation changes log and decision register given append-only additions), one new correction-report file created. No file deleted; no file renamed; no clause content removed without a documented reason (the one deletion, §4.4, is recorded in §11 above and in the Traceability Matrix's "Clauses removed" section).

# 20. Commands executed

`git status --porcelain=v1 -b`; `git fetch origin`; `gh pr view 203 --json ...`; `git fetch origin docs/dec-legal-002-bt-draft-001`; `git checkout docs/dec-legal-002-bt-draft-001`; `git diff origin/docs/dec-legal-002-bt-draft-001 --stat` (confirmed in sync before edits); `grep`-based authority/discrepancy verification and the prohibited-concept re-search in §17 above (no application build/test commands run — documentation-only task).

# 21. Dependencies/config changes

None.

# 22. Application/source changes

**NONE.** No file under `apps/`, `functions/`, `firestore.rules`, `storage.rules`, `firebase.json`, or any Terms-version configuration path was read, written, or otherwise touched by this correction task.

# 23. Validation performed

- Re-verified repository/branch/PR state before editing (§1 above).
- Independently re-counted the Terms Drafting Readiness Note's §3 table rows by direct line inspection (§14 above) rather than trusting the v1.0 report's prior count.
- Clause-by-clause application of each of the task's eleven itemized corrections, cross-checked against the corresponding Traceability Matrix row and Controlled Inputs Register entry for consistency.
- Actual `grep`-based prohibited/conflict search across the corrected draft (§17 above), not a mental check only.
- Confirmed the four resolved controlled inputs (CI-02, CI-03, CI-04, CI-06) do not duplicate any item on the task's own prohibited-concept boundary list, and do not invent a `DEC-SUB-*` value, multi-entity feature, service tier, or delegated-acceptance capability.
- Confirmed §7.4's existing reacceptance-deferral language required no further change and remains consistent with the corrected §7.1.

# 24. Risks

- CI-01 (operator legal identity) remains the single most material open gap — unchanged by this pass, and it blocks eventual Terms configuration regardless of drafting completeness.
- CI-05 (reacceptance-on-change) remains open by design, per the task's explicit instruction; Part VII §22 still needs its own future drafting/authorization pass.
- Parts II–VIII remain entirely undrafted, unchanged by this correction pass (which touched only Part I clause wording, not scope).
- The Terms Drafting Readiness Note's own "16 of 16" narrative text remains uncorrected in that historical file; a future reader consulting only that file (not the corrected BT-DRAFT-001 documents) could still see the stale figure. Mitigated by the pointer added to the original Drafting Report's risk section (§30) and by this report's §14.

# 25. Rollback instructions

All changes are confined to the existing, unmerged branch `docs/dec-legal-002-bt-draft-001` (PR #203). To roll back this correction pass specifically: `git revert` the commit created by this task (see §27 below) on that branch, or `git checkout <prior-commit> -- <file>` for each of the six modified files individually and delete the new correction-report file. `origin/main` is untouched throughout. No partial-revert risk: each corrected clause is a self-contained rewrite or deletion, not an interleaved multi-file transaction.

# 26. Persistent changes-file update

`/Users/theo/11THONUS/docs/00-governance/documentation-changes-log.md` — new Entry 127 appended, describing this correction task (see the log for full text). `/Users/theo/11THONUS/docs/00-governance/decisions/decision-register.md` — a further Notes-field addendum appended to the existing `DEC-LEGAL-002` entry (append-only; no Status or field-value change).

# 27. Commit SHA

Recorded after commit — see the final message to the Founder for the exact SHA once pushed (this report is written immediately before the commit is created, to avoid hardcoding a stale value).

# 28. PR #203 status/head after push

Recorded after `git push` — see the final message to the Founder for PR #203's exact head SHA and CI/mergeable status after this correction commit is pushed. PR #203 was not merged by this task.

# 29. Exact Founder next action

1. Re-review PR #203 against the corrected Core Business Terms draft (Part 0 architecture unchanged; Part I text corrected per the eleven itemized items) for consistency with the APPROVE WITH CORRECTIONS disposition.
2. Confirm the four resolutions (business-entity scope, jurisdiction architecture, service-tier removal, delegated-acceptance authority) match the intended disposition; none can be un-resolved without a further correction pass once approved.
3. Supply, or direct the resolution of, the two remaining controlled inputs — CI-01 (operator legal identity) most urgently, since it blocks every subsequent drafting/configuration step.
4. Decide whether the corrected Part I is now ready for a further review pass, formal Founder approval, or authorization to proceed to Parts II–VIII.
5. Do not merge PR #203 as if it were an approved Terms version — merging only advances the drafting record; it does not approve, configure, or make effective any Terms content, and does not change `DEC-LEGAL-002`, Capability 3, or Terms-configuration status.

---

**CORE BUSINESS TERMS PART I FOUNDER CORRECTIONS COMPLETE — PR #203 AWAITS RE-REVIEW**
