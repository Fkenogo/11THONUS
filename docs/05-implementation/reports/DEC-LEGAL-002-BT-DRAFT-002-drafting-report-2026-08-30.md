> **Title:** Core Business Terms — Part II (Business Participation) Drafting Report
> **Version:** 1.0 · **Status:** Working (governance record — controlled drafting report) · **Classification:** Working
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LEGAL-002` (Status: `OPEN_LEGAL`, unchanged by this task)
> **Source-of-truth path:** `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-002-drafting-report-2026-08-30.md`
> **Date:** 2026-08-30 · **Task:** `DEC-LEGAL-002-BT-DRAFT-002`
> **Governs/companion documents:** [Core Business Terms — Draft (v2.0)](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md); [Drafting Traceability Matrix (v2.0)](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md); [Controlled Inputs Register (v2.0)](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md)

---

# ⚠️ DRAFT — NOT APPROVED — NOT EFFECTIVE — NOT CONFIGURED

Part II is a controlled drafting instrument, not a Terms version. `DEC-LEGAL-002` remains `OPEN_LEGAL`. Capability 3 remains blocked on governed Terms-content configuration. Part I remains the approved drafting baseline; this report documents only the Part II addition (§§8–10).

---

## 1. Entry repository state

Branch at task start: `docs/dec-legal-002-bt-draft-001` (the prior task's branch), clean working tree apart from pre-existing, task-unrelated untracked files (`WORKING_WITH_THE_FOUNDER/`, several `docs/00-governance`, `docs/01-product`, `docs/05-implementation/reports`, `docs/06-engineering-governance`, `docs/07-product-design.zip`, `docs/11thONUS-at-a-Glance.md`, `docs/30-go-to-market/` items) — left untouched throughout this task, per instruction to identify and leave unrelated files alone. No `.git/MERGE_HEAD` or `.git/REBASE_HEAD` present — no incomplete git operation. `origin/main` fetched and confirmed at merge commit `cff109126211d08d4ded0c04d3972945186c43d4` (PR #203, the Part I baseline merge), matching the governing task's exact required hash.

## 2. Branch/base/HEAD

New branch `docs/dec-legal-002-bt-draft-002` created from `origin/main` at `cff1091` (tracking `origin/main`). All Part II work committed on this branch. No other branch touched.

## 3. Authorities inspected

- Merged Core Business Terms Part I (`DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md`, v1.1)
- Terms Instrument Architecture & Drafting Readiness Note v2.0
- Terms Content Architecture (`DEC-LEGAL-002-PREP-001-terms-content-architecture-2026-08-29.md`)
- Business Terms Drafting Traceability Matrix v1.1 and Controlled Inputs Register v1.1 (Part I)
- Legal Counsel Handoff Pack §3 (FD-1–FD-7, `DEC-LOY-011`)
- Founder Legal Architecture Disposition Record v2.0 (LEG-FD-01–LEG-FD-15; LEG-FD-01 and LEG-FD-06 directly relevant to §§8–10)
- `ENG-P2-002-DESIGN-001` (Business Identity Architecture — Owner model, `businessCode` policy §24)
- `ENG-P2-003-DESIGN-001` (Staff Membership & Identity Architecture — role model, permissions, invitation lifecycle)
- `ENG-P2-004-DESIGN-001` (Role-Context & Permission-Resolution Architecture — Sensitive Permission Catalogue, override-resolution rule)
- `ENG-P3-002-DESIGN-001` (Business Onboarding Architecture — mandatory/optional/out-of-scope classification, ungoverned verification-mechanism finding)
- `ENG-P3-002-UI-IMP-A` and `ENG-P3-002-UI-IMP-F` implementation reports (actual built-vs-designed boundary for establishment UI and Team Management UI)
- `DEC-LOY-011` (Decision Register entry, CONFIRMED)
- Decision Register `DEC-LEGAL-002` entry (full history)

No conflict was found among these authorities as applied to §§8–10; drafting proceeded without escalation.

## 4. Drafting strategy

§8 separates registration/onboarding (accuracy, authority, completing onboarding requirements) from verification (a distinct, expressly discretionary step), because the underlying authority draws that same line sharply (`ENG-P3-002-DESIGN-001`'s own repeated finding that the `pending_verification → trial` mechanism is "explicitly ungoverned" and its Founder disposition `FD-P3-002` that onboarding completion is not verification/active status). §8 excludes Team, Subscription Plan, and multi-branch as establishment conditions because the onboarding architecture classifies them Optional/Out-of-scope/Deferred respectively, and states Business Type as optional (not mandatory) per the same source. §9 is built as a direct extension of Part I §1.3, §5, and §7.5 — cross-referenced, not restated — using only the governed Owner/Manager/Staff role model (no invented "Admin"/"Editor" role, which the Team Management UI report explicitly documents as a rejected design-mockup fabrication). §9.5's staff-access-management language is deliberately mechanism-agnostic ("the mechanisms the platform makes available … from time to time") so the clause remains durable regardless of which specific staff-management UI features (role-change, resend) are live at a given time — architecturally designed per `ENG-P2-003-DESIGN-001` but not fully UI-exposed per the Team Management UI report. §10 draws its prohibited-conduct catalogue from FD-4's suspension-grounds language and LEG-FD-06's non-exhaustive platform-integrity descriptive list — the same authority basis the Terms Drafting Readiness Note itself cites in rating "Prohibited conduct" **Ready** ("Existing platform-integrity principles; no new item raised") — and cross-references suspension consequences to the undrafted §15 without inventing periods, automatic termination, or automatic reward extinction.

## 5. Part I baseline integrity result

No Part I clause (§§1–7) was rewritten. The only touches to Part I text were: (a) header/version/authorities metadata updates; (b) two new definitional bullets appended under §2 in a clearly labelled "Additional definitions (Part II terms)" subsection, which do not alter any existing Part I definition; (c) the §0.2 readiness-mapping table rows for "Business eligibility," "Account authority," and "Prohibited conduct" changed from "No" to "Yes" (a factual update reflecting Part II now being drafted, not a substantive rewrite); and (d) the "End of Part I" / Status Reaffirmation boundary language updated to acknowledge Part II's addition. No substantive Part I policy change was identified as necessary, and none was made.

## 6. §8 clauses drafted

§8.1 (eligibility/capacity/registering-individual authority), §8.2 (accuracy of registration information, duty to correct), §8.3 (onboarding requirements as precondition to verification-gated capabilities; explicit exclusions), §8.4 (information requests for verification/security/compliance/integrity), §8.5 (acceptance precedes verification submission, cross-referencing §7), §8.6 (onboarding completion ≠ verification), §8.7 (verification outcome is discretionary; no SLA/automatic-approval/exhaustive-criteria/fee), §8.8 (no guarantee of verification).

## 7. Business eligibility treatment

Drafted as legal capacity plus registering-individual authority only (§8.1), cross-referencing Part I §1.3 rather than restating it. No eligibility criterion beyond legal existence/capacity was invented.

## 8. Registration/onboarding treatment

Drafted as accuracy/correction duties (§8.2) and a general "complete applicable onboarding requirements" obligation (§8.3) that expressly does not require subscription-plan selection, Staff invitation, Reward Program publication, or multi-branch establishment as conditions of completing onboarding — preserving the confirmed-optional/deferred/out-of-scope status of each per `ENG-P3-002-DESIGN-001` §6. Business Type is not mentioned as mandatory anywhere in the drafted text (confirmed optional in the underlying architecture; the clause simply does not name it, avoiding any implication either way beyond what §8.3's general formula already covers).

## 9. Verification treatment

§8.6–§8.8 sharply separate registration/onboarding from verification/approval. §8.7 grants 11thONUS discretion to approve, decline, restrict, or request further information, grounded in LEG-FD-01's general fallback interpretive standard (transparency, fairness, proportionality) because no more specific verification SLA, criterion set, or automatic-approval rule exists in any reviewed authority — and the clause says so explicitly, rather than inventing one. No SLA, automatic approval, exhaustive criteria, document list, background-check requirement, or verification fee was drafted.

## 10. §9 clauses drafted

§9.1 (Business Owner authority, including §7 acceptance authority), §9.2 (Business may authorize Staff; Staff access is post-onboarding management, not part of §8), §9.3 (Staff permissions do not confer bind/accept authority; Owner delegation of permissions ≠ delegation of §1.3 authority), §9.4 (permission model does not determine outside-platform employment/corporate authority), §9.5 (Business responsible for granting/adjusting/removing Staff access, mechanism-agnostic), §9.6 (Business responsible for Staff acts within granted permissions), §9.7 (proportionate credential/access-protection obligation), §9.8 (notify/cooperate on suspected unauthorized use, with a carve-out for events genuinely outside the Business's control).

## 11. Business Owner treatment

Defined and treated as identical to the Part I §1.3 authorized-registering-individual concept — not a new or parallel authority source. §9.1 states the Business Owner's authority "including the acceptance authority described in §7," making explicit (not inventing) the link already implicit in Part I.

## 12. Staff/permissions treatment

Limited strictly to the governed Owner/Manager/Staff role model (`ENG-P2-003-DESIGN-001`); no "Admin," "Editor," or other unsupported role or permission was introduced. §9.4 states the platform's permission model governs platform capabilities only, not outside-platform employment/corporate authority — directly reflecting `ENG-P2-004-DESIGN-001`'s permission-resolution architecture without overstating its legal effect.

## 13. Invitation/membership treatment

§9.2 states only that "the Business may authorize other individuals as Staff … according to the roles and permissions the platform makes available," without naming a specific invitation mechanism, delivery channel (email/phone), resend behavior, or role-change/removal procedure — consistent with governing-task instruction to keep legal text durable and avoid encoding implementation details unnecessarily, and with the finding that role-change/removal/resend are architecturally designed (`ENG-P2-003-DESIGN-001`) but not fully UI-exposed (`ENG-P3-002-UI-IMP-F`). §9.5 covers the Business's responsibility for these decisions generically ("using the mechanisms the platform makes available … from time to time") rather than asserting any specific feature is currently available.

## 14. Access/security responsibility treatment

§9.7–§9.8 draft a proportionate obligation: protect credentials/access, do not knowingly permit contrary access, notify and cooperate on suspected unauthorized use "without undue delay" — with an explicit carve-out (§9.8, final sentence) that the Business is not responsible for unauthorized use resulting solely from a failure or compromise of 11thONUS's own platform, systems, or security. No strict/impossible liability standard was drafted.

## 15. Terms-acceptance authority boundary

§9.3 restates, by direct cross-reference (not independent redrafting), Part I §7.5's already-Founder-approved principle: Staff platform permissions never confer authority to accept or reaccept the Terms, and an Owner's delegation of platform permissions is not delegation of the Owner's own §1.3 authority. No new acceptance-authority rule was invented; none was needed.

## 16. §10 clauses drafted

§10.1(a)–(j) (prohibited-conduct catalogue), §10.2 (does not limit Business's legitimate control of its own Reward Program/customer relationship), §10.3 (non-exhaustive-list disclosure), §10.4 (cross-reference to undrafted §15; no notice/cure/termination mechanism invented; no change to earned-reward treatment).

## 17. Prohibited-conduct categories

Fraud/attempted fraud; fabricated/knowingly false purchase or loyalty activity; Reward Program record manipulation inconsistent with the Business's own programme terms; unauthorized access/use; misuse of another Business's or customer's identity/account/information; interference with platform operation/security; knowingly false/misleading information to 11thONUS; unlawful use; conduct intended to defeat verification/trust controls; misuse of customer information obtained through platform participation. All ten items are grounded in FD-4's suspension-grounds language and LEG-FD-06's non-exhaustive platform-integrity descriptive list — no invented criminal/legal catalogue, no morality/reputation clause.

## 18. Suspension cross-reference treatment

§10.4 states only that prohibited conduct "may result in platform action … including suspension or restriction … subject to Part IV §15 (Suspension and Restriction, not drafted in this task)." No automatic permanent termination, mandatory notice period, fixed-hour/day period, universal cure period, or automatic reward extinction was drafted or implied. `DEC-LOY-011` and FD-2/FD-3/FD-4 are preserved by explicit cross-reference, not redrafted.

## 19. Customer/Reward Program boundary

No reward-earning rule, fulfilment rule, reward-value statement, retrospective-change rule, reward-survival rule, or programme-change notice period was drafted in Part II. §10.2 affirmatively preserves the Business's control over its own Reward Program (Part I §6, cross-referenced). Two cross-references to undrafted Parts appear (§10.4 to §15; the "Part III" reference in §10.4's final sentence) — both descriptive pointers, not substantive drafting of those Parts.

## 20. Business Code treatment

Not used in Part II's contractual text at all. Per governing-task instruction, Business Code was kept out of the drafted clauses because it was not genuinely necessary to §8's eligibility/onboarding treatment; its governed internal/support-use-only status (`ENG-P2-002-DESIGN-001` §24) is preserved by omission rather than by restating it in the Terms.

## 21. New definitions, if any

Two definitional bullets added to §2 under a new "Additional definitions (Part II terms)" subsection: **"Business Owner"** (cross-referencing §1.3 and §9.1) and **"Staff"** (cross-referencing §9.2, and stating Staff do not carry §1.3/§7.5 authority). Neither alters any existing Part I definition.

## 22. Existing Controlled Inputs status

CI-01 (operator legal identity) and CI-05 (reacceptance-on-change engineering decision) remain open, exactly as they stood after the Part I correction pass. Neither is touched, resolved, or restated by Part II.

## 23. New Controlled Inputs, if any

None. Part II was fully draftable on existing authority; see the Controlled Inputs Register's new "Part II review" section for the specific reasoning on the three points that came closest to requiring one (verification discretion standard, prohibited-conduct catalogue authority, staff-access-mechanism durability) — each resolved by drafting choice rather than by creating a new open item.

## 24. Traceability result

Every Part II clause (§8.1–§8.8, §9.1–§9.8, §10.1–§10.4, and the two new §2 definitions) is mapped to at least one governing authority in the Drafting Traceability Matrix v2.0, "Part II clauses" section. No clause lacks a traced authority.

## 25. Conflict/prohibited-concept search result

A direct `grep`-based search of the full updated Core Business Terms draft file for: mandatory Business Type; Team during establishment; Subscription Plan as onboarding requirement; Business Code as public/commercial identifier; multi-branch assumptions; KYC/KYB/background-check/document-list language; unsupported roles (Admin/Editor); staff Terms-acceptance authority; automatic verification/approval; fixed numeric periods (7/14/24/30/48/60-day/hour); `DEC-SUB-*`/`DEC-ID-005`/`DEC-LOY-009` resolution language; and reward earning/fulfilment/value rules — returned **zero matches** for every prohibited item, and confirmed the intended, permitted occurrences of "accept"/"automatic"/"subscription plan" (all in already-approved Part I text or in Part II's explicit exclusion clause, §8.3). Full command output preserved in this task's session log.

## 26. DEC-LEGAL-002 status

Unchanged: `OPEN_LEGAL`.

## 27. Capability 3 status

Unchanged: Open — engineering work packages complete; blocked on governed Terms-content configuration (`CDR-001` §5).

## 28. Terms configuration status

Unchanged: `platformConfig/businessTerms` `NOT CONFIGURED`. No governed effective Business Terms version exists.

## 29. Files modified

- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` (v1.1 → v2.0; Part II §§8–10 added; Part I clause text unchanged)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md` (v1.1 → v2.0; Part II traceability rows added)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md` (v1.1 → v2.0; Part II review section added; no register-row change)
- `docs/00-governance/decisions/decision-register.md` (`DEC-LEGAL-002` entry — new dated note appended; Status unchanged)
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-002-drafting-report-2026-08-30.md` (this report — new file)

## 30. Diff summary

Docs-only. Additive to the Core Business Terms draft (new §8–§10 clause text, two new §2 definitions, updated headers/tables); additive to the Traceability Matrix (new Part II section); additive to the Controlled Inputs Register (new Part II review section, no row change); additive note on the Decision Register `DEC-LEGAL-002` entry; one new report file. No deletion of any Part I clause text.

## 31. Commands executed

`git status`, `git log`, `git fetch origin`, `git rev-parse origin/main`, `git branch -a`, `git checkout -b docs/dec-legal-002-bt-draft-002 origin/main`, and the `grep`-based prohibited-concept verification commands listed in item 25.

## 32. Dependencies added

None.

## 33. Config changes

None.

## 34. Application/source changes

**None.** No `functions/`, `apps/web/`, Firestore Rules, or Firebase config file was read, touched, or modified.

## 35. Validation results

Clause-by-clause authority review performed (Traceability Matrix v2.0). Prohibited-concept `grep` search performed and returned clean (item 25). No Part I clause rewritten. No new Controlled Input required. No `DEC-SUB-*`, `DEC-ID-005`, or `DEC-LOY-009` resolution introduced.

## 36. Risks/open drafting matters

- CI-01 and CI-05 remain open and block Founder/legal approval and Terms configuration respectively, unchanged by this task.
- The Legal Counsel Handoff Pack still records a dedicated fraud/abuse product policy as "not yet Founder-positioned" as a freestanding policy question; §10 of this draft does not resolve that broader question — it drafts only a Terms-level prohibited-conduct clause from already-reconciled platform-integrity authority (FD-4/LEG-FD-06), which the Readiness Note independently rates sufficient for this purpose. If the Founder later adopts a more specific fraud/abuse product policy, §10 may need revision to align — flagged here as a forward risk, not a present gap.
- §9.5's staff-access-management clause is intentionally mechanism-agnostic; if the Founder wants Part II to describe a specific committed staff-management capability set (e.g., a firm commitment to ship role-change/resend), that would require a distinct Founder/product decision and a corresponding clause revision — not performed here, as it was not requested and would risk promising unbuilt functionality.

## 37. Rollback instructions

`git checkout main && git branch -D docs/dec-legal-002-bt-draft-002` (after confirming the PR, if opened, is closed without merging). No application state or configuration was touched, so no additional rollback step is required.

## 38. Drafting report path

`docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-002-drafting-report-2026-08-30.md` (this file).

## 39. Persistent `.md` changes-file path

Same as item 38; also see the updated Core Business Terms draft, Traceability Matrix, and Controlled Inputs Register at the paths listed in item 29.

## 40. Branch

`docs/dec-legal-002-bt-draft-002`

## 41. Commit SHA

Recorded after commit (see PR).

## 42. PR number/status

Recorded after PR is opened (see task completion follow-up). Not merged by this task.

## 43. Exact Founder next action

Review Part II (§§8–10) for approval or correction, in the same manner as the Part I correction pass (`DEC-LEGAL-002-BT-DRAFT-001-CORR-001`). No action is required to keep `DEC-LEGAL-002`, Capability 3, or Terms configuration in their current (unchanged) states — those require no Founder action from this task. Founder review of Part II does not require resolving CI-01 or CI-05, which remain independently gated.

---

## FINAL GATE

**CORE BUSINESS TERMS PART II DRAFTED — PART I BASELINE PRESERVED — AWAITING FOUNDER REVIEW**
