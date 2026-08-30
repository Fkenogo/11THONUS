> **Title:** Core Business Terms — Part II PR #204 Review-Finding Correction Report
> **Version:** 1.0 · **Status:** Working (governance record — controlled correction report) · **Classification:** Working
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LEGAL-002` (Status: `OPEN_LEGAL`, unchanged by this task)
> **Source-of-truth path:** `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-002-CORR-001-correction-report-2026-08-30.md`
> **Date:** 2026-08-30 · **Task:** `DEC-LEGAL-002-BT-DRAFT-002-CORR-001`
> **Reviewed head (pre-correction):** PR #204, commit `ab10dd5a1735564e70a3a8bd96fdd6b4c45dd7eb`
> **Governs/companion documents:** [Core Business Terms — Draft (v2.1)](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md); [Drafting Traceability Matrix (v2.1)](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md); [Controlled Inputs Register (v2.1)](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md); [Part II Drafting Report](DEC-LEGAL-002-BT-DRAFT-002-drafting-report-2026-08-30.md)

---

# ⚠️ DRAFT — NOT APPROVED — NOT EFFECTIVE — NOT CONFIGURED

PR #204 is NOT approved for merge. This correction addresses four PR review findings; it does not itself constitute Founder approval. `DEC-LEGAL-002` remains `OPEN_LEGAL`. Part I remains the Founder-approved drafting baseline; Part II remains draft pending Founder re-review.

---

## 1. Entry repository state

Continuing on the existing branch `docs/dec-legal-002-bt-draft-002` (not a fresh branch — this is a correction pass on the same open PR, matching the convention used for `DEC-LEGAL-002-BT-DRAFT-001-CORR-001`). Working tree clean apart from the same pre-existing, task-unrelated untracked files noted in the prior report — left untouched throughout. No `.git/MERGE_HEAD`/`.git/REBASE_HEAD` — no incomplete git operation. `origin/main` re-fetched and re-confirmed unchanged at `cff109126211d08d4ded0c04d3972945186c43d4`.

## 2. PR #204 head before correction

`ab10dd5a1735564e70a3a8bd96fdd6b4c45dd7eb` — confirmed via `gh pr view 204 --json headRefOid`, matching the governing task's cited head exactly.

## 3. Four review threads inspected

Retrieved via `gh api repos/Fkenogo/11THONUS/pulls/204/comments` (all four from `chatgpt-codex-connector[bot]`, P2, on `ab10dd5a17`):

1. Comment id `3889172513`, line 232 — "Keep the ungoverned verification policy as a controlled input."
2. Comment id `3889172516`, line 238 — "Separate contractual signatories from the platform Owner."
3. Comment id `3889172522`, line 224 — "Preserve the governed onboarding exclusions."
4. Comment id `3889172525`, line 25 — "Reconcile the remaining Part-I-only status labels."

No other review (`gh api .../pulls/204/reviews`) exists beyond the Codex summary comment referencing these four findings.

## 4. Correction strategy

See the strategy stated in-conversation before editing: (A) remove the invented approve/decline/restrict verification-outcome architecture from §8.6–§8.8, replacing it with a durable statement that verification/participation requirements are separately governed and not created here, without creating a new Controlled Input (Part II can remain complete without resolving the ungoverned mechanism); (B) split "Business Owner" (platform account-role fact, exactly one per Business per `ENG-P2-002-DESIGN-001` §7) from a new "Authorized Representative" definition (the §1.3/§7.5 legal-authority-to-bind concept), correcting §9.1/§9.3/§2 without touching Part I's already-approved §7.5 text; (C) remove §8.3's self-defeating "onboarding requirements... expressly provide otherwise" exception, requiring separate governance/authorization to change the four onboarding exclusions; (D) correct exactly three stale scope labels (Instrument Map §0.0, Part I heading note, §1.3 cross-reference) that became false once Part II was drafted, leaving every other "not drafted in this task" reference (Parts III/IV/VII/VIII, all still accurate) untouched.

## 5. Verification-policy authority inspected

`ENG-P3-002-DESIGN-001`: line 25 (`businessStatus.ts`'s own doc comment — "the verification mechanism gating this transition is explicitly ungoverned... not implemented, and must not be read as authorizing, any of the mechanisms behind a transition"); line 179 ("**Business verification**... Explicitly ungoverned... not designed by this document, per direct instruction"); line 611 ("out of scope per direct instruction and the `businessStatus.ts` model's own doc comment"); §36 `FD-P3-002` Onboarding Completion disposition (line 630, APPROVED — "Onboarding completion does NOT mean Business verification complete... The `pending_verification → trial` mechanism remains separately ungoverned and must NOT be invented"). LEG-FD-01's fallback interpretive standard was inspected and confirmed to supply only a general fairness/transparency/proportionality standard — it does not itself supply an approve/decline/restrict outcome set, a timeline, or criteria.

## 6. Verification-policy correction

§8.6–§8.8 rewritten to remove all outcome architecture. The corrected text states only: (i) onboarding completion does not mean verification, and certain capabilities require separately governed verification/participation requirements; (ii) the mechanism and its effect on Business status/capability access are governed separately and not created, defined, or limited by this section — with no timeline, approval/decline outcome, criteria, or fee stated; (iii) onboarding completion does not guarantee that a Business will satisfy any separately governed requirement. §8.4 (information requests for verification/security/compliance/integrity purposes) and §8.5 (acceptance precedes submission) were reviewed and left unchanged — neither invents an outcome; both are grounded in already-governed authority (LEG-FD-01/FD-4 for §8.4; Part I §7.1 for §8.5).

## 7. Whether verification creates a new Controlled Input

**No.** Per the governing task's instruction to first determine whether Part II can remain complete without resolving the unresolved mechanism: it can. The corrected clauses state only what is already governed (that a separate, ungoverned mechanism exists and is not created here) — this requires no Founder or legal decision to draft correctly. No Controlled Input was added.

## 8. Business Owner authority inspected

`ENG-P2-002-DESIGN-001` §7 ("Owner Model"): "One `Business`, one `ownerUserId`... a single required field, not an array, not a role list"; "exactly one `active`, `role: 'owner'` membership must exist per business at all times"; "Delegation flows from the Owner, never around them" (`AP-004`/`BR-008`). §12.2 ("Owner Protection"): the Owner membership can never be a target of `staff.manage`/`staff.assignRole`/`staff.assignPermissions`. Part I §1.3 and §7.5 were also re-inspected (see item 17).

## 9. Corrected Business Owner definition

"Business Owner" now means only the platform account-role fact — the single individual associated with the Business through the platform's authoritative owner-level account relationship, determined by the platform's governed account and identity architecture. The definition explicitly states this does not by itself establish, and is not established by, legal authority to bind the Business.

## 10. Authorized Representative/Accepting Individual treatment

A new "Authorized Representative" definition was added, restating — not rewriting — Part I §1.3's existing legal-authority-to-bind concept and cross-referencing §7.5's acceptance authority. "Accepting Individual" (the existing Part I §2 term used within §7) is unchanged and is not merged with or renamed to "Authorized Representative"; both terms coexist, with Authorized Representative used in Part II's account-authority discussion and Accepting Individual retained exactly as Part I already defines and uses it within §7's acceptance mechanics. The Business Owner and the Authorized Representative are stated to be capable of being the same individual without either status automatically conferring the other. Part I §7.5's already-approved text (permitting "the registering Business Owner or another individual with authority to bind the Business" to accept) was read and confirmed already consistent with this correction — it already contemplates both as alternatives — and was not rewritten.

## 11. Staff/Manager authority boundary

Unchanged in substance; §9.3's wording was adjusted only to route its "delegation" sentence through "Authorized Representative" rather than "Business Owner" as the holder of §1.3 authority, since a Business Owner does not necessarily hold that authority under the corrected definitions. The underlying rule — platform permissions never confer authority to bind or accept Terms — is identical to the pre-correction text and to Part I §7.5.

## 12. Onboarding-exclusion correction

§8.3's closing clause — "except to the extent the onboarding requirements 11thONUS makes available at the relevant time expressly provide otherwise" — was removed and replaced with: "Unless and until changed through separate applicable governance or authorization — and not merely by 11thONUS publishing a different onboarding requirement, user interface, or configuration — completing onboarding under this section does not require a Business to: (a) select a subscription plan; (b) invite or maintain Staff; (c) publish a Reward Program; or (d) establish or operate more than one place of business." This closes the self-defeating loophole the review identified while preserving the same four exclusions from `ENG-P3-002-DESIGN-001` §6/§36 (`FD-P3-002`).

## 13. Stale-scope-label corrections

Three corrected, each verified false only because Part II now exists (all other similarly-worded statements were checked and confirmed still accurate — see item 22):

- §0.0 Instrument Map: "Drafting in progress — Part I only" → "Drafting in progress — Part I (Founder-approved baseline) and Part II (draft, pending Founder review) drafted; Parts III–VIII not drafted."
- Part I heading note: "The only Part drafted with full clause text in this task..." → corrected to state Part I is the Founder-approved baseline and Part II is now also drafted with full clause text, draft pending Founder review.
- §1.3: "(see Part II §9, not drafted in this task)" → "(see Part II §9)" (Part II §9 now exists).

## 14. Full §§8–10 re-review result

Re-read against all cited authorities after correction: eligibility (§8.1) states only legal capacity/registering-authority, no KYC/KYB. No current UI field (Business Type, Team, Subscription Plan, multi-branch) is converted into a permanent legal eligibility rule — §8.3 explicitly excludes all four, now non-overridable except by separate governance. Verification mechanics remain ungoverned, stated as such (§8.6–§8.8). Business Owner is now exactly one governed platform role, kept distinct from Authorized Representative (§9.1, §2). Manager/Staff roles acquire no legal authority from platform permissions alone (§9.3, unchanged in substance). Onboarding exclusions cannot be overridden without separate governance (§8.3, corrected). Access/security obligations (§9.7–§9.8) remain proportionate, unchanged. Prohibited conduct (§10.1) remains supported by FD-4/LEG-FD-06, unchanged. §10 creates no suspension mechanics — §10.4's cross-reference to the undrafted §15 is unchanged, and the new §10.5 further confirms no enforcement/adjudication mechanism is created. Part III reward obligations remain undrafted and untouched.

## 15. Fraud/abuse boundary assessment

The Legal Counsel Handoff Pack records a dedicated fraud/abuse *product policy* (detection, classification, adjudication, remediation) as "not yet Founder-positioned" — a separate, freestanding operational question. §10 of this draft does not, and after correction still does not, draft that policy: it states only a high-level contractual prohibition of ten categories of conduct (fraud, fabricated activity, record manipulation, unauthorized access, identity misuse, platform interference, false information, unlawful use, verification-control defeat, customer-information misuse), each traceable to FD-4's suspension-grounds language and LEG-FD-06's already-reconciled, non-exhaustive platform-integrity descriptive list — precisely the authority basis the Terms Drafting Readiness Note itself certifies as sufficient for this row ("Existing platform-integrity principles; no new item raised" — **Ready**). New §10.5 makes this distinction explicit in the instrument itself: the section is a contractual prohibition only, not a detection/classification/adjudication/enforcement policy.

## 16. Whether a fraud/abuse decision blocks Part II approval

**No — a dedicated fraud/abuse product-policy decision is not required before Part II can be approved.** It would be required before any later operational/enforcement design (a fraud-detection system, a classification taxonomy, an adjudication or remediation procedure) is built or governed, because that is a distinct, broader question the Handoff Pack leaves open. §10 as corrected does not reach that question and does not depend on its resolution — it states only the contractual prohibition, which is already supported by FD-4/LEG-FD-06 and independently rated Ready by the Readiness Note. This is flagged as a forward risk (item 30), not a present blocker.

## 17. Part I baseline integrity

Confirmed by direct diff against PR #204 head (`ab10dd5`): no Part I clause body text (§1.1, §1.2, §1.4, §3.1–§7.6) was altered. The only Part I touches were: (a) the single stale cross-reference fix in §1.3 (removing "not drafted in this task," since Part II §9 now exists — a factual correction, not a substantive rewrite); and (b) the §2 "Additional definitions (Part II terms)" subsection, which is additive and does not alter any existing Part I definition. Part I §7.5's substantive text is byte-for-byte unchanged.

## 18. Traceability update

Traceability Matrix v2.1 updated: rows for §8.3, §8.6, §8.7, §8.8, §2 "Business Owner," §9.1, §9.3 marked `(corrected -CORR-001)` with updated purpose/authority text; new rows added for §2 "Authorized Representative," §10.5, and the scope-label administrative correction — each citing the specific PR #204 review finding it resolves.

## 19. Controlled Inputs after correction

Unchanged: CI-01 (operator legal identity) and CI-05 (reacceptance-on-change engineering decision) remain the only two open controlled inputs. The Controlled Inputs Register's new "Part II PR-review correction pass" section documents why none of the four corrections created a new one (see item 7 for the verification-specific reasoning).

## 20. Each PR finding disposition

| # | Finding | Authority inspected | Accepted? | Correction made | Why this resolves it |
|---|---|---|---|---|---|
| 1 | Keep the ungoverned verification policy as a controlled input (or avoid inventing it) | `ENG-P3-002-DESIGN-001` §0/§7/§36 `FD-P3-002`; LEG-FD-01 | **Accepted** | §8.6–§8.8 rewritten to remove all approve/decline/restrict outcome architecture; states only that the mechanism is separately governed and not created here | The clause no longer invents any outcome, criterion, timeline, or fee the cited authority explicitly says must not be invented; Part II remains complete without a new Controlled Input, per the governing task's own preference to avoid creating one unless genuinely unavoidable |
| 2 | Separate contractual signatories from the platform Owner | `ENG-P2-002-DESIGN-001` §§7–8, §12.2; Part I §1.3/§7.5 | **Accepted** | Added "Authorized Representative" definition; corrected "Business Owner" definition to the platform account-role fact only; corrected §9.1/§9.3 to keep the two concepts distinct | Business Owner no longer means every corporate signatory; the governed one-Owner-per-Business architecture is preserved; Part I §7.5's already-approved acceptance principle is preserved unedited, consistent with the instruction not to silently rewrite it |
| 3 | Preserve the governed onboarding exclusions | `ENG-P3-002-DESIGN-001` §6/§36 `FD-P3-002` | **Accepted** | Removed the self-defeating "expressly provide otherwise" exception from §8.3; the four exclusions now change only through separate governance/authorization | Future published onboarding requirements/UI/configuration can no longer silently convert Subscription Plan, Staff invitation, Reward Program publication, or multi-location operation into establishment requirements |
| 4 | Reconcile the remaining Part-I-only status labels | Direct document inspection (`grep`) | **Accepted** | Corrected exactly the three statements that became false once Part II was drafted (§0.0, Part I heading note, §1.3); all other "not drafted in this task" references verified accurate and left untouched | The controlled source-of-truth no longer contradicts itself about whether §§8–10 are part of the draft, without altering any accurate reference to the genuinely undrafted Parts III/IV/VII/VIII |

## 21. Review-thread resolution state

Not yet marked resolved as of this report — per the governing task's instruction, threads are resolved only after the corresponding correction is committed and verified. This report documents the corrections; thread resolution and reply posting follow immediately after this commit is pushed, referencing the corrected line numbers and this report.

## 22. Prohibited/conflict search

Re-ran the full item-25 search from the Part II Drafting Report plus four new correction-specific checks: (a) verification-outcome architecture ("may approve the business," "decline to approve," "approve it subject to restrictions") — zero matches; (b) the self-defeating "expressly provide otherwise" pattern tied to onboarding requirements — zero matches (one unrelated, legitimate occurrence remains in §9.3's boilerplate "except to the extent these Terms expressly provide otherwise," a different and acceptable qualifier already used elsewhere in Part I, e.g. §5.3); (c) stale "Part I only"/"only Part drafted"/"Part II §9, not drafted" labels — zero matches (one remaining "not drafted in this task" hit at §6.2 is a legitimate, accurate reference to Part III, not a stale label); (d) mandatory Business Type, Business Code, multi-branch, KYC/KYB, Admin/Editor roles, fixed numeric periods, `DEC-SUB-*`/`DEC-ID-005`/`DEC-LOY-009` resolution — zero matches, consistent with the original Part II search. Full command output preserved in this task's session log.

## 23. Files modified

- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` (v2.0 → v2.1)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md` (v2.0 → v2.1)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md` (v2.0 → v2.1)
- `docs/00-governance/decisions/decision-register.md` (`DEC-LEGAL-002` entry — new dated note appended; Status unchanged)
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-002-CORR-001-correction-report-2026-08-30.md` (this report — new file)

## 24. Diff summary

Docs-only. In the Core Business Terms draft: 3 stale labels corrected; §8.3 rewritten (self-defeating exception removed); §8.6–§8.8 rewritten (outcome architecture removed); §2/§9.1/§9.3 corrected (Business Owner/Authorized Representative split); one new clause added (§10.5). No Part I clause body deleted or substantively rewritten. Traceability Matrix and Controlled Inputs Register updated correspondingly. One new report file.

## 25. Commands executed

`git fetch origin`, `git status`, `gh pr view 204 --json headRefOid,headRefName,baseRefName,state,mergeable`, `gh api repos/Fkenogo/11THONUS/pulls/204/comments`, `gh api repos/Fkenogo/11THONUS/pulls/204/reviews`, `grep`-based authority inspection of `ENG-P3-002-DESIGN-001` and `ENG-P2-002-DESIGN-001`, `git diff ab10dd5 -- <draft file>`, and the `grep`-based validation commands listed in item 22.

## 26. Dependencies added

None.

## 27. Config changes

None.

## 28. Application/source changes

**None.** No `functions/`, `apps/web/`, Firestore Rules, or Firebase config file was read, touched, or modified.

## 29. Validation

Diff-verified Part I integrity (item 17). Full re-search for all four finding patterns plus the original Part II prohibited-concept list, all clean. Traceability updated for every corrected/added clause. No new Controlled Input created without genuine necessity (verified against the "avoid creating one automatically" instruction).

## 30. Risks

- CI-01 and CI-05 remain open, unchanged, blocking Founder/legal approval and Terms configuration respectively.
- The broader fraud/abuse *operational* policy question (detection, classification, adjudication, remediation) remains genuinely open and will need its own Founder/product decision before any enforcement mechanism is built or governed — §10.5 now makes this boundary explicit in the instrument itself, reducing (but not eliminating) the risk that a future reader conflates the two.
- The Business Owner/Authorized Representative split is new drafting language, not itself previously reviewed by the Founder; it should receive explicit attention in the next Founder review pass alongside the other three corrections.

## 31. Rollback instructions

`git reset --hard ab10dd5a1735564e70a3a8bd96fdd6b4c45dd7eb` on this branch (discarding only this correction commit; the branch is not shared with any other work) followed by a force-push if already pushed, or simply do not push if not yet pushed. No application state or configuration was touched, so no additional rollback step is required. (Not performed by this task — provided for reference only.)

## 32. Drafting/correction report path

`docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-002-CORR-001-correction-report-2026-08-30.md` (this file).

## 33. Persistent `.md` changes tracking

Same as item 32; also see the updated Core Business Terms draft (v2.1), Traceability Matrix (v2.1), and Controlled Inputs Register (v2.1) at the paths listed in item 23.

## 34. Commit SHA

Recorded after commit (see PR).

## 35. PR #204 current head/status

Recorded after push (see PR). Not merged by this task.

## 36. CI result

No CI pipeline is configured to run on documentation-only PRs in this repository beyond the Codex automated review already addressed above; no build/test CI exists to report.

## 37. Exact Founder next action

Re-review Part II (§§8–10) and the corrected §2/§9 definitions for approval, in the same manner as the Part I correction pass (`DEC-LEGAL-002-BT-DRAFT-001-CORR-001`). In particular: (a) confirm the Business Owner/Authorized Representative split is acceptable; (b) confirm the corrected verification boundary (no outcome architecture) is acceptable as a durable Terms clause; (c) confirm the onboarding-exclusion non-override language is acceptable; (d) note that a separate, later fraud/abuse operational-policy decision will be needed before any enforcement mechanism is built, but is not required for Part II approval itself.

---

## FINAL GATE

**CORE BUSINESS TERMS PART II REVIEW FINDINGS CORRECTED — PR #204 AWAITS FOUNDER RE-REVIEW**
