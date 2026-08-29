> **Title:** DEC-LEGAL-002-PREP-001 — Decision Preparation Report
> **Version:** 1.0 · **Status:** Preparation complete — no legal decision, no Terms configuration, no status change applied · **Classification:** Working (implementation/preparation report)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md)
> **Date:** 2026-08-29 · **Task:** `DEC-LEGAL-002-PREP-001`
> **Deliverables:** [Product & Legal Decision Brief](../../00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-product-legal-decision-brief-2026-08-29.md) · [Business Obligation Matrix](../../00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-business-obligation-matrix-2026-08-29.md) · [Legal Counsel Question Set](../../00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-legal-counsel-question-set-2026-08-29.md) · [Founder Decision Sheet](../../00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-founder-decision-sheet-2026-08-29.md) · [Terms Content Architecture](../../00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-terms-content-architecture-2026-08-29.md) · [Resolution Plan](../../00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-resolution-plan-2026-08-29.md)

# DEC-LEGAL-002-PREP-001 — Decision Preparation Report

## 1. Entry repository state

Branch `docs/eng-p3-002-closure-001` at `bc45d1a` (HEAD at task start, unchanged by this task except for the additions below). Working tree carried pre-existing untracked files from prior sessions (`WORKING_WITH_THE_FOUNDER/`, several `docs/00-governance/` and `docs/01-product/` files, several `docs/05-implementation/reports/` files, `docs/06-engineering-governance/` files, `docs/07-product-design.zip`, `docs/11thONUS-at-a-Glance.md`, `docs/30-go-to-market/`) — none of these were created, modified, or committed by this task; they are listed in the report only because `git status` shows them.

## 2. Authoritative sources reviewed

Decision Register (`DEC-LEGAL-002`, `DEC-LEGAL-001/003–006`, `DEC-SUB-001–013`, `DEC-LOY-011`, `DEC-PROD-004/005`); External Dependencies Register (all `EXT-LEG-*`); Phase 3 Reconciliation; Founder Decision Agenda (Batch D); Decision Resolution Plan v1; Decision Governance Workflow; Platform Constitution; CDR-001 Capability Delivery Roadmap §5; `eng-p3-002-closure-001` Capability 3 readiness report; Verified Loyalty Governance Freeze v1.0; Verified Loyalty Principles; 11thONUS Product Manifesto; 11thONUS-at-a-Glance; Requirements Traceability Matrix (`LCD-001–006`); `ENG-P3-002-DESIGN-001`; `ENG-P3-002-ONBOARDING-JOURNEY-RECON-001`; `ENG-P3-002A` and `ENG-P3-002-UI-IMP-D` implementation and independent-review reports; `IMPLEMENTATION_CHANGES.md`; `docs/02-technical/trd/23-traceability-and-completion-review.md`; PBOP-000/001; source code under `functions/src/domains/business/` and `apps/web/src/business/` (Terms schema, config repository, lifecycle command, callable exposure — read, not modified). Full citation detail is embedded in each deliverable above.

## 3. Current DEC-LEGAL-002 state

**OPEN_LEGAL**, Priority D3. Unchanged by this task. See [Product & Legal Decision Brief](../../00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-product-legal-decision-brief-2026-08-29.md) §A.1.

## 4. Current EXT-LEG-002 state

**PENDING**, no evidence filed. Unchanged by this task.

## 5. Current product model

See [Product & Legal Decision Brief](../../00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-product-legal-decision-brief-2026-08-29.md) Phase B (platform, business, customer, boundary principle — confirmed against `11thONUS-at-a-Glance.md` and the Product Manifesto).

## 6. Business obligation findings

See [Business Obligation Matrix](../../00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-business-obligation-matrix-2026-08-29.md). Nineteen topics examined; the large majority marked `PRODUCT DECISION REQUIRED` because product governance is genuinely silent on them (no rule invented).

## 7. Platform/business responsibility boundary

See [Business Obligation Matrix](../../00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-business-obligation-matrix-2026-08-29.md#platform-responsibility-matrix-phase-d). Fourteen topics examined; every liability-allocation row marked `LEGAL COUNSEL TO ADVISE` — no exclusion invented.

## 8. Proposed Terms instrument model

See [Terms Content Architecture](../../00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-terms-content-architecture-2026-08-29.md) Phase E — recommends Business Terms (platform-wide), Customer/Participant Terms (platform-wide, conditional on counsel's answer to whether a direct relationship is needed), business-owned Reward Program terms (not platform-authored), with privacy matters remaining under `DEC-LEGAL-001`.

## 9. Subscription-term reconciliation

**Classification: `CURRENT DEC-LEGAL-002 SCOPE`.** Subscription terms remain explicitly in scope per the Decision Register's own text and `EXT-LEG-002`'s identical evidence-required wording; no supersession or deferral found. `DEC-PROD-004` (businesses pay, CONFIRMED) is settled; the pricing/plan-catalogue details (`DEC-SUB-001/002/003/008/009/010/013`) remain `OPEN_FOUNDER` and separate from the Terms-content question. See [Founder Decision Sheet](../../00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-founder-decision-sheet-2026-08-29.md) Phase F, FD-7.

## 10. Existing Terms technical contract

See [Terms Content Architecture](../../00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-terms-content-architecture-2026-08-29.md) Phase G. Fully built and independently re-verified: `platformConfig/businessTerms.currentVersion` config document (no client write path), write-once acceptance record schema, transactional fail-closed gate (`assertCurrentBusinessTermsAccepted`), reacceptance-on-version-change behavior. **No governed Terms version is configured in production** — this is the exact, deliberate fail-closed condition, not a defect.

## 11. Legal questions requiring counsel

Seventeen questions, each grounded in a specific unresolved repository issue, none pre-answered. See [Legal Counsel Question Set](../../00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-legal-counsel-question-set-2026-08-29.md).

## 12. Product questions requiring Founder decision

Seven items (FD-1 through FD-7), each a genuine gap in existing authority — none reopens an already-confirmed decision. See [Founder Decision Sheet](../../00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-founder-decision-sheet-2026-08-29.md).

## 13. Proposed content architecture

Headings only, no legal language, no placeholder legal values, for Business Terms and (conditionally) Customer Terms. See [Terms Content Architecture](../../00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-terms-content-architecture-2026-08-29.md) Phase J.

## 14. Resolution sequence

Ten-step sequence, Founder-authorized at each step, unchanged from the instruction's expected structure. See [Resolution Plan](../../00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-resolution-plan-2026-08-29.md).

## 15. Files created

- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-product-legal-decision-brief-2026-08-29.md`
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-business-obligation-matrix-2026-08-29.md`
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-legal-counsel-question-set-2026-08-29.md`
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-founder-decision-sheet-2026-08-29.md`
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-terms-content-architecture-2026-08-29.md`
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-resolution-plan-2026-08-29.md`
- `docs/05-implementation/reports/DEC-LEGAL-002-PREP-001-decision-preparation-report-2026-08-29.md` (this report)
- One new entry appended to `docs/changes/IMPLEMENTATION_CHANGES.md`

## 16. Files modified

None besides the append-only addition to `docs/changes/IMPLEMENTATION_CHANGES.md` noted above. No existing document's content was altered.

## 17. Diff summary

Pure additions: 7 new markdown files (docs-only), plus one appended section in the changes log. No deletions, no edits to existing file bodies, no renames.

## 18. Commands executed

Read-only repository inspection only: `git status`, `git branch --show-current`, `git rev-parse HEAD`, `grep`/`ls` across `docs/` (excluding `.claude/worktrees`), and `Read` of source files under `functions/src/domains/business/` and `apps/web/src/business/` for the Terms implementation contract (Phase G). No build, test, deploy, or database command was run. No file outside `docs/` was written.

## 19. Dependencies added

None.

## 20. Config changes

None. `platformConfig/businessTerms` was inspected via source-code read only — no write was made to it, in any environment.

## 21. Application-code changes

**NONE.**

## 22. Decision/status changes

**NONE.** `DEC-LEGAL-002` remains `OPEN_LEGAL`. `EXT-LEG-002` remains `PENDING`. Capability 3 remains `Open — engineering work packages complete; blocked on governed Terms-content configuration (DEC-LEGAL-002)`. No other decision encountered during research (e.g., `DEC-LOY-011`, any `DEC-SUB-*`) was modified.

## 23. Risks

- The Phase-3-vs-Phase-14/15 governance-phase tension (Founder Decision Sheet FD-1) remains unreconciled; if left unresolved, roadmap documents and the actual runtime-enforced blocking effect will continue to disagree until the Founder addresses it.
- `DEC-LOY-011` and `DEC-LEGAL-002`'s "honouring rewards" scope are linked but tracked as separate Decision Register entries; resolving one without the other risks an inconsistent product/legal position (flagged in Founder Decision Sheet FD-2).
- `EXT-LEG-002`'s "Current assumption: Standard terms adaptable" (external-dependencies-register.md) has not been tested against Burundi-specific law in this preparation pass — this brief supplies product facts and questions for counsel, not a jurisdictional legal assessment.

## 24. Rollback

All changes are new, additive markdown files plus one append-only changes-log entry. Rollback is `git rm` of the seven new files and reverting the changes-log append — no other repository state is affected, and no non-doc system was touched.

## 25. Preparation report path

`docs/05-implementation/reports/DEC-LEGAL-002-PREP-001-decision-preparation-report-2026-08-29.md` (this file).

## 26. Changes-tracking path

`docs/changes/IMPLEMENTATION_CHANGES.md` (new entry appended, dated 2026-08-29).

## 27. Exact Founder next action

Resolve the Founder Decision Sheet items (FD-1 through FD-7) — most urgently FD-1 (the Phase-3-blocking tension) and FD-2 (the `DEC-LOY-011` linkage) — then route the Legal Counsel Question Set to the Burundi legal adviser named as `EXT-LEG-002`'s owner-adviser, per the ten-step [Resolution Plan](../../00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-resolution-plan-2026-08-29.md). No engineering action is required or recommended until legal advice is accepted and real Terms content/version exists.

---

## FINAL GATE

**`DEC-LEGAL-002 DECISION PACKAGE READY FOR FOUNDER AND LEGAL-COUNSEL REVIEW — NO LEGAL DECISION OR TERMS CONFIGURATION APPLIED`**
