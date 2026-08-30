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

## Verification

- Direct search confirmed no other instance of "Parts III–VIII" or "Part III, not drafted" remains anywhere in the instrument after both corrections.
- The corrected §14.4 text was re-checked against the prohibited-concept list: it does not assert universal reacceptance, does not assert no-reacceptance, and does not resolve `DEC-ID-005`, `DEC-LOY-009`, or any `DEC-SUB-*` item.
- Parts I, II, and the rest of Part III were verified unchanged by direct diff — only §14.4 and the Part I heading note were touched by this correction pass.
- No new Controlled Input was created. CI-01/CI-05 remain the only open controlled inputs. `DEC-LEGAL-002` = `OPEN_LEGAL`; Capability 3 = Open; Terms = `NOT CONFIGURED`; `DEC-ID-005`/`DEC-LOY-009`/all unresolved `DEC-SUB-*` unchanged.
- Docs-only; no application, source, Firebase, or configuration change.

## Files modified

- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` (§14.4 rewritten; Part I heading note corrected; header/version metadata updated to v3.1)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md` (§14.4 row corrected; scope-label-correction row updated; header/version metadata updated to v3.1)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md` (explanatory bullet added to Part III review section; header/version metadata updated to v3.1)
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-003-CORR-001-correction-report-2026-08-30.md` (this report, new file)
