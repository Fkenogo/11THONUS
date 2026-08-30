> **Title:** Core Business Terms — Part II Final Founder Wording Corrections Report
> **Version:** 1.0 · **Status:** Working (governance record — controlled correction report) · **Classification:** Working
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LEGAL-002` (Status: `OPEN_LEGAL`, unchanged by this task)
> **Source-of-truth path:** `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-002-CORR-002-correction-report-2026-08-30.md`
> **Date:** 2026-08-30 · **Task:** `DEC-LEGAL-002-BT-DRAFT-002-CORR-002`
> **Reviewed head (pre-correction):** PR #204, commit `45031bfd26c1c3074de42d37f8d02886e4d84adc`
> **Governs/companion documents:** [Core Business Terms — Draft (v2.2)](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md); [Drafting Traceability Matrix (v2.2)](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md); [Controlled Inputs Register (v2.2)](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md); [CORR-001 Correction Report](DEC-LEGAL-002-BT-DRAFT-002-CORR-001-correction-report-2026-08-30.md)

---

# ⚠️ DRAFT — NOT APPROVED — NOT EFFECTIVE — NOT CONFIGURED

PR #204 is NOT approved for merge. This is the second, narrower correction pass on Part II, addressing two Founder wording findings raised after CORR-001. `DEC-LEGAL-002` remains `OPEN_LEGAL`. Part I remains the Founder-approved drafting baseline; Part II remains draft pending Founder approval.

---

## 1. Entry repository/PR state

Continuing on the existing branch `docs/dec-legal-002-bt-draft-002` (same open PR). Working tree clean apart from the same pre-existing, task-unrelated untracked files noted in both prior reports — left untouched. No `.git/MERGE_HEAD`/`.git/REBASE_HEAD`. `origin/main` re-fetched and re-confirmed unchanged at `cff109126211d08d4ded0c04d3972945186c43d4` (the Part I baseline).

## 2. Reviewed starting head

PR #204 head confirmed at `45031bfd26c1c3074de42d37f8d02886e4d84adc` via `gh pr view 204 --json headRefOid`, matching the governing task's cited reviewed state exactly.

## 3. Existing review-thread state

All four CORR-001 review threads (`PRRT_kwDOTaQe386dgijN/Q/T/X`) re-verified `isResolved: true` via GraphQL. `gh api repos/Fkenogo/11THONUS/pulls/204/comments` confirmed exactly 4 top-level review comments (all four already replied to and resolved) and no new top-level or issue comment beyond the CORR-001 summary comment posted by this task's own prior turn. No new automated or human finding had appeared before this correction began.

## 4. Correction strategy

Two narrow wording corrections, both stated in-conversation before editing: (1) the Staff definition's categorical "Staff are not... Authorized Representatives" was corrected to distinguish the platform-permission concept (which confers no such authority by itself) from the possibility that the same individual independently holds real-world corporate/legal authority to bind the Business — that independent authority is preserved as possible but never inferred from Staff status; (2) §9.6's "to the same extent as if the Business had undertaken those acts itself" was replaced with proportionate, itemized account responsibility (deciding whom to authorize; permissions granted; in-scope activity) with explicit carve-outs for unauthorized access, credential compromise, out-of-scope/malicious conduct, and 11thONUS-attributable failures — preserved by the Business's own breach of §9.5/§9.7/§9.8; (3) §9.3's open-ended "except to the extent these Terms expressly provide otherwise" was removed and replaced with language aligned to Part I §7.5's own governance-required-for-delegation boundary, without editing §7.5 itself.

## 5. Staff-definition correction

Before: "Staff are not Business Owners or Authorized Representatives, and do not, by virtue of being Staff alone, have the authority described in §1.3, §7.5, or this Authorized Representative definition." After: Staff status alone does not make an individual a Business Owner or Authorized Representative and does not itself confer that authority — but the same individual may independently hold legal authority to bind the Business under the Business's own corporate/legal arrangements, entirely apart from platform Staff status; that independent authority is neither created nor negated by this definition and must not be inferred from Staff status alone. No new role was created; the single governed Business Owner architecture is untouched.

## 6. Business Owner/Authorized Representative consistency

§9.1 and the "Business Owner"/"Authorized Representative" definitions (both added in CORR-001) are unchanged by this pass and remain internally consistent with the corrected Staff definition: Business Owner is a platform account-role fact (exactly one per Business, `ENG-P2-002-DESIGN-001` §7); Authorized Representative is the §1.3 legal-authority concept; Staff is a third, distinct category that confers neither status but does not preclude a Staff member from independently holding Authorized Representative status through means outside the platform.

## 7. §9.6 responsibility correction

Before: blanket "to the same extent as if the Business had undertaken those acts itself." After: itemized responsibility for (a) deciding whom to authorize as Staff, (b) the permissions/access granted, and (c) platform activity undertaken within that granted access — with explicit non-responsibility for unauthorized access, credential compromise, out-of-scope activity, malicious conduct genuinely outside granted authority, and 11thONUS-attributable failures, each carve-out itself conditioned on the Business not having contributed to the event through its own breach of §9.5/§9.7/§9.8. A closing sentence confirms this is account/access responsibility only and does not draft a general liability regime (Part VI §19 remains undrafted).

## 8. Unauthorized/misuse boundary

The five carve-outs in §9.6 (unauthorized access; credential compromise; out-of-scope activity; malicious conduct outside granted authority; 11thONUS-attributable failure) directly track the governing task's list. Each is qualified by the same "except... to the extent the Business contributed... through its own breach of §9.5, §9.7, or §9.8" standard, so a Business that failed its own access-management or notify-and-cooperate obligations does not automatically escape responsibility merely by invoking a carve-out — while a Business that met those obligations is not exposed to strict liability for events genuinely outside its control.

## 9. §9.3 delegation correction

The open-ended "except to the extent these Terms expressly provide otherwise" was removed. The corrected text states that no provision of these Terms confers Terms-acceptance or Business-binding authority on Staff merely by virtue of platform permissions, and that any future delegated-acceptance capability requires explicit separate governance/authorization — directly mirroring Part I §7.5's own language ("requires explicit governance/authorization and is not established by this section"). Part I §7.5 itself was read and left byte-for-byte unedited; only §9.3 (Part II) was corrected.

## 10. Part I integrity

Confirmed by direct diff (`git diff 45031bf -- <draft file>`): the only changed lines are the §2 "Staff" definition and §9.3/§9.6 in Part II. No Part I clause (§§1–7, including §7.5) was touched in this pass.

## 11. CORR-001 regression check

All six CORR-001 fixes re-verified present and unregressed by direct `grep`: (a) verification mechanism still stated as "governed separately from these Terms" (§8.7, unchanged); (b) single Business Owner model unchanged ("platform account-role fact," §2/§9.1, unchanged apart from the unrelated Staff-definition edit); (c) Authorized Representative distinction unchanged (§2/§9.1, unchanged); (d) governed onboarding exclusions unchanged ("Unless and until changed through separate applicable governance," §8.3, unchanged); (e) stale status-label fixes unchanged (no "Part I only"/"only Part drafted"/stale "not drafted" labels reintroduced); (f) fraud/abuse contractual-vs-operational distinction unchanged (§10.5, unchanged). None of the CORR-001 corrected clauses were touched by this pass except where this task's own scope (§9.3) required a further, additive correction on top of the CORR-001 fix — the CORR-001 portion of §9.3 (removing "Business Owner" as the sole authority-holder) remains intact; only the trailing open-ended exception clause was further tightened.

## 12. Full §9 re-review result

Re-read complete §9 (9.1–9.8) after correction: platform roles (Owner/Staff, a permission-model concept) are kept distinct from corporate/legal authority (Authorized Representative, a §1.3 concept) throughout; Staff status alone never equals Authorized Representative status, but independent external corporate authority remains expressly possible and is not foreclosed; no strict-liability formulation remains anywhere in §9; no liability regime belonging to §19 is drafted (§9.6's closing sentence disclaims this expressly); no unsupported staff-management functionality (role-change, resend, removal as a promised current feature) is asserted — §9.5's mechanism-agnostic "using the mechanisms the platform makes available... from time to time" language from the original Part II draft is unchanged and remains consistent with this standard.

## 13. Controlled Inputs status

Unchanged: CI-01 (operator legal identity) and CI-05 (reacceptance-on-change engineering decision) remain the only two open controlled inputs.

## 14. New Controlled Inputs — expected NONE

**None created.** Both corrections used only already-governed authority (Part I §1.3/§7.5, `ENG-P2-002-DESIGN-001`/`ENG-P2-003-DESIGN-001`) to fix an overstatement (Staff definition) and an open-ended drafting risk (§9.3) or an unbounded liability formulation (§9.6). No governing conflict was discovered during this pass.

## 15. Review threads after push

Re-checked via GraphQL after pushing this commit: all four existing threads remain `isResolved: true`. `gh api repos/Fkenogo/11THONUS/pulls/204/comments` re-run after push returned no new top-level comment.

## 16. New review findings, if any

**None found.** No automated (Codex) or human review comment appeared on the corrected commit as of this report. This will be re-confirmed once more immediately before closing the task (see item 15 timing note below — the check was performed after the push in item 19).

## 17. Files modified

- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` (v2.1 → v2.2)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md` (v2.1 → v2.2)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md` (v2.1 → v2.2)
- `docs/00-governance/decisions/decision-register.md` (`DEC-LEGAL-002` entry — new dated note appended; Status unchanged)
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-002-CORR-002-correction-report-2026-08-30.md` (this report — new file)

## 18. Diff summary

Docs-only. In the Core Business Terms draft: exactly 3 lines changed (§2 "Staff" definition, §9.3, §9.6); no other line touched. Traceability Matrix and Controlled Inputs Register updated correspondingly. One new report file.

## 19. Commands executed

`git fetch origin`, `git status`, `gh pr view 204 --json headRefOid,state,mergeable,baseRefName`, `gh api graphql` (review-thread state query, both before and after push), `gh api repos/Fkenogo/11THONUS/pulls/204/comments`, `gh api repos/Fkenogo/11THONUS/issues/204/comments`, `git diff 45031bf -- <draft file>`, and the `grep`-based validation commands listed in item 22.

## 20. Dependencies/config changes

None.

## 21. Application/source changes

**None.** No `functions/`, `apps/web/`, Firestore Rules, or Firebase config file was read, touched, or modified.

## 22. Validation

`grep`-based re-search confirmed: zero remaining occurrences of "to the same extent as if" (strict-liability phrase removed); zero remaining occurrences of the open-ended "expressly provide otherwise" in §9.3 (one legitimate, unrelated occurrence remains elsewhere in Part I boilerplate, unaffected); the Staff definition now states independent-authority language; no new role (Admin/Editor) introduced; no liability-regime language (caps, indemnities) introduced; all six CORR-001 fixes re-confirmed present (item 11); no stale scope label reintroduced.

## 23. Risks

- CI-01 and CI-05 remain open, unchanged.
- This is the second correction pass on Part II; a third pass would suggest the drafting approach itself (not just wording) may need Founder-level discussion before further iteration — noted for awareness, not a present blocker.
- The Staff-independent-authority language is new; while it directly reflects the Founder's own stated position in this task, it has not itself been through automated review yet (see item 16).

## 24. Rollback instructions

`git reset --hard 45031bfd26c1c3074de42d37f8d02886e4d84adc` on this branch (discarding only this correction commit) followed by a force-push if already pushed. No application state or configuration was touched, so no additional rollback step is required. (Not performed by this task — provided for reference only.)

## 25. Correction report path

`docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-002-CORR-002-correction-report-2026-08-30.md` (this file).

## 26. Persistent `.md` changes tracking

Same as item 25; also see the updated Core Business Terms draft (v2.2), Traceability Matrix (v2.2), and Controlled Inputs Register (v2.2) at the paths listed in item 17.

## 27. Commit SHA

Recorded after commit (see PR).

## 28. PR #204 current head/status

Recorded after push (see PR). Not merged by this task.

## 29. Exact Founder next action

Final review of the two corrected items (Staff definition; §9.3/§9.6) alongside the already-accepted CORR-001 corrections. If accepted, Part II (§§8–10) is ready for Founder approval as drafted; approval itself, and any subsequent Terms-configuration step, remain outside this task's authority. If a new finding surfaces on this corrected commit, it will be reported separately rather than resolved silently.

---

## FINAL GATE

**CORE BUSINESS TERMS PART II FINAL WORDING CORRECTIONS COMPLETE — PR #204 AWAITS FOUNDER APPROVAL**
