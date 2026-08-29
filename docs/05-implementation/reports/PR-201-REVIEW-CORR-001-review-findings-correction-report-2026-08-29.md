> **Title:** PR #201 Review-Findings Correction Report
> **Version:** 1.0 · **Status:** Three automated-review findings corrected; PR #201 ready for Founder re-review, not merged · **Classification:** Working (implementation/governance report)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md)
> **Date:** 2026-08-29 · **Task:** `PR-201-REVIEW-CORR-001`

# PR #201 Review-Findings Correction Report

## 1. Entry repository/PR state

Branch `docs/dec-legal-002-founder-disp-001`, HEAD `8eb78c2` (PR #201's reviewed head, unchanged at task entry). Working tree carried only the same pre-existing unrelated untracked files noted in every prior report in this thread; no other modification pending.

## 2. Correction strategy

Verify each of the three automated-review findings against actual repository content before touching anything (none accepted on the reviewer's word alone); fix what is confirmed accurate with the minimum necessary edit; where the audit (Correction 2) surfaces a proposition with no tracked support, withdraw or reframe it rather than inventing a citation; make all edits directly on PR #201's existing branch; commit only the correction files; push; do not merge.

## 3. P1 TRD23 exact correction

`docs/02-technical/trd/23-traceability-and-completion-review.md`, **OPD-005 — Reward Use During Business Suspension**: previously instructed engineers that "The product must define whether already-earned rewards remain redeemable" among four listed options, "Required before: Subscription suspension implementation." Corrected to: a "✅ resolved 2026-08-29 (`DEC-LOY-011`, CONFIRMED)" heading; the confirmed rule stated in full (default-redeemable, commercial-suspension carve-out, governed exceptions, new-activity distinction, Business-responsibility/non-guarantor statement — cross-referencing TRD17 §17.20 rather than duplicating its full text); the original four options preserved beneath, labeled "preserved for traceability, not superseded"; the "Required before" line annotated "(Resolved — no longer blocking; implementation may proceed against the confirmed rule above)." No exception-handling implementation was designed.

**Also corrected, same finding:** `docs/00-governance/requirements-traceability-matrix.md`, the `OPD-005` row's `Dependencies`/`Notes` cells previously read "DEC-LOY-011" / "Affected by open decision(s) DEC-LOY-011 — do not implement…" — the exact sibling contradiction the reviewer named as part of finding P1. Corrected to note the 2026-08-29 resolution and that it is "No longer a blocking open decision," while leaving `Implementation Status` as "Not Started" (an accurate engineering-status fact, not a decision-blocking marker). This is treated as part of the same P1 correction, not scope expansion, because the reviewer explicitly named this file as part of the identical contradiction.

## 4. TRD17/TRD23 consistency result

**Consistent.** Both now state the identical confirmed rule (default-redeemable, commercial-suspension carve-out, governed exceptions, non-guarantor responsibility, undesigned exception workflow) and cross-reference each other. Verified by direct side-by-side read after editing (§3 excerpts in the underlying task transcript).

## 5. Complete audit of citations to each of the three untracked files

Searched every file in PR #201 for citations to `docs/11thONUS-at-a-Glance.md`, `docs/01-product/11thONUS Product Manifesto.md`, and `docs/00-governance/verified-loyalty-principles.md`. Found in two live evidence documents (the Product & Legal Decision Brief and the Business Obligation Matrix); also mentioned in two historical reports and the changes log, left untouched as accurate point-in-time narrative (§8 below). Every citation in the two live documents was individually classified:

| Proposition | Prior citation | Classification | Disposition |
|---|---|---|---|
| General platform description (multi-tenant, subscription, purchase verification) | At-a-Glance; Manifesto | A | Replaced with Platform Constitution Art. 1 + PRD0 §3 |
| "Platform standardises trust, not how businesses build customer relationships" (verbatim quote) | At-a-Glance | Unsupported verbatim; substance supported | Verbatim quote withdrawn; substance now attributed to Founder Decision Sheet cross-cutting principle (B) + PRD0 §10.4/OP-006 (A), explicitly labeled as paraphrase not verbatim |
| "11thONUS supports the relationship, does not take ownership of it" / "Every Business Owns Its Customer Relationship" | Manifesto | Unsupported verbatim; substance supported | Same treatment as above |
| Verified Units are sole unit of account; one active cycle | Verified Loyalty Principles | A | Replaced with PRD6 §9–10, §19; `DEC-LOY-002` (CONFIRMED) |
| Redemption as "shared responsibility" between customer/merchant | Verified Loyalty Principles | **C — no tracked authority found** | Withdrawn; replaced with PRD6 §18's actual mechanics only |
| Reward quantity "fixed at creation" | Verified Loyalty Principles | **C — tracked authority contradicts this** (`DEC-LOY-009` is `OPEN_FOUNDER`, "Current confirmed position: none") | Withdrawn; row reframed to state the gap and correctly mark reward-quantity policy as a distinct open Founder decision, not addressed by this package |
| Multiple completed, unredeemed Rewards may coexist | Verified Loyalty Principles | **C — no tracked authority found** | Withdrawn; row reframed to state `DEC-LOY-002`'s actual (narrower, per-programme) scope and flag cross-programme coexistence as unaddressed by any current authority |
| Expiry "opt-in per-Reward-Program only, never automatic" | Verified Loyalty Principles | A (narrower form) | Replaced with `DEC-LOY-005` (CONFIRMED) + PRD6 §20, which support "no automatic expiry" but not the more specific "opt-in per-programme" framing — the narrower, tracked-supported statement is used |
| Programme publication — "business owns programme design" | Manifesto | A | Replaced with PRD0 §10.4, OP-006 |
| "Business owns the customer relationship" (Platform Responsibility Matrix, "Customer service" row) | Manifesto | A | Replaced with PRD0 §10.4/OP-006 + Founder Decision Sheet cross-cutting principle |

## 6. Replacement tracked authorities used

- [Platform Constitution](../../00-governance/platform-constitution.md), Article 1 and the Trust core value.
- [PRD0 — Product Foundation](../../01-product/prd/00-product-foundation.md) §3 (Executive Summary), §10.4 ("Flexibility, Not Business Dictation"), OP-003 ("Trust Comes Before Loyalty"), OP-006 ("Businesses Own Their Loyalty Offer") — confirmed tracked (`git ls-files` match) and status "Authoritative Product."
- [PRD6 — Reward Programs, Verified Units and Loyalty Cycle Management](../../01-product/prd/06-reward-programs-and-loyalty-cycles.md) §9, §10, §16, §18, §19, §20 — confirmed tracked.
- Decision Register entries `DEC-LOY-001`, `DEC-LOY-002`, `DEC-LOY-005` (all CONFIRMED) and `DEC-LOY-009` (OPEN_FOUNDER, cited to document the gap, not as support for a settled claim).
- The Founder Decision Sheet's own cross-cutting principle (`DEC-LEGAL-002-FOUNDER-DISP-001`, Founder-authorized text already contained in this governed package) — used as Classification-B authority for the "standardizes trust" / "does not take ownership" proposition specifically.

## 7. Any unsupported proposition discovered

Two, both reported rather than silently patched over:
1. **Reward quantity "fixed at creation"** — contradicted by tracked authority (`DEC-LOY-009`, `OPEN_FOUNDER`, "no confirmed position"). This is a genuine open Founder product decision, separate from and not addressed by the `DEC-LEGAL-002` preparation package. Not resolved by this correction task — reported in the Business Obligation Matrix's "Reward earning" row as an explicit gap.
2. **Multiple completed, unredeemed Rewards coexisting for one customer** — no tracked source affirmatively states this; `DEC-LOY-002`'s per-Reward-Program scoping neither confirms nor rules it out across different Reward Programs. Reported in the Business Obligation Matrix's "Reward availability" row as an explicit gap, not resolved.

Neither gap is material to any Founder-approved FD-1–FD-7 position or to the `DEC-LOY-011` resolution — both concern loyalty-mechanics detail outside this package's scope, and neither required stopping the correction task, since both were safely reframed as explicit open items rather than removed silently or left misrepresented as confirmed.

## 8. Confirmation untracked files remained excluded

`git ls-files | grep -i "at-a-glance\|Product Manifesto\|verified-loyalty-principles.md"` returns empty — confirmed still untracked. None of the three files was read for content beyond what was already known from prior tasks, none was modified, none was staged, none was committed. The two historical implementation reports and the changes log that mention these filenames by name (as an accurate record of what sources were consulted at the time of the original research) were left untouched, per the instruction not to mechanically edit historical records.

## 9. Founder Decision Agenda header correction

`docs/00-governance/decisions/founder-decision-agenda.md` line 4: replaced *"Nothing here is decided yet, except Batch A (below)"* with *"An entry below is still open unless it is explicitly marked decided/confirmed/resolved (struck through, with an '✅ answered `<date>`' line and a Final decision citing the Decision Register)."* This is durable (does not need updating every time a new item is confirmed) rather than a brittle enumeration, consistent with the instruction. B6's own question/options/history remain exactly as retained in the prior task. No other agenda item was touched.

## 10. Cross-document contradiction search result

Searched tracked repository for: (a) "DEC-LOY-011 remains open" / "must define whether... redeemable" — found and corrected in TRD23 and the requirements traceability matrix (§3); no further hits after correction. (b) "already-earned rewards are blocked during commercial suspension" — no hits. (c) "DEC-LEGAL-002 has been resolved" / "DEC-LEGAL-002 ... CONFIRMED" — no genuine hits; all matches were false positives from broad grep patterns matching unrelated text on the same line, individually verified. (d) "governed Business Terms have been configured" — no hits. No further contradictory live authoritative document was found; no scope expansion beyond the two files in §3 was necessary or performed.

## 11–16. Preserved states

`DEC-LOY-011` = **CONFIRMED** (unchanged). `DEC-ID-005` = **OPEN_FOUNDER** (unchanged, not touched). `DEC-LEGAL-002` = **OPEN_LEGAL** (unchanged, not touched). `EXT-LEG-002` = **PENDING** (unchanged). Capability 3 = **IN PROGRESS** / blocked on governed Terms-content configuration (unchanged). Terms version = **NOT CONFIGURED** (unchanged). No `DEC-SUB-*` decision was resolved — `DEC-LOY-009`, discovered still open during this audit, was left exactly as `OPEN_FOUNDER`, reported not resolved.

## 17. Files modified

- `docs/02-technical/trd/23-traceability-and-completion-review.md`
- `docs/00-governance/requirements-traceability-matrix.md`
- `docs/00-governance/decisions/founder-decision-agenda.md`
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-product-legal-decision-brief-2026-08-29.md`
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-business-obligation-matrix-2026-08-29.md`
- `docs/changes/IMPLEMENTATION_CHANGES.md` (append)

## 18. Diff summary

Five documentation files corrected in place (no deletions of substantive prior content — each correction is additive/replacing, with the prior untracked-sourced claim either replaced by a tracked citation or explicitly withdrawn and explained), plus one new report and one changes-log append. Zero application/source/config files.

## 19. Commands executed

`git branch --show-current`, `git rev-parse HEAD`, `gh pr view 201` (state/mergeable/files/reviews/comments), `gh api repos/.../pulls/201/reviews`, `gh api repos/.../pulls/201/comments`, `sed`/`grep`/`git grep`/`git ls-files` for verification and the tracked-authority search (Constitution, PRD0, PRD6, Decision Register), `git status`, `git diff` for staging verification. Commit/push follow this report per §Phase F below.

## 20. Dependencies added

None.

## 21. Config changes

None.

## 22. Application/source changes

**NONE.**

## 23. Validation results

1. TRD23 and TRD17 agree on `DEC-LOY-011` — ✅ verified side-by-side.
2. Decision Register, TRD17, TRD23 consistently show the confirmed policy — ✅.
3. No PR #201 document cites the three untracked files as authoritative sources — ✅ (only explanatory prose mentioning the filenames to describe the correction; no live markdown links remain, verified by grep).
4. The three files remain untracked and excluded — ✅ (`git ls-files` empty match).
5. Every replacement citation resolves to a tracked file — ✅ (Platform Constitution, PRD0, PRD6, Decision Register — all confirmed via `git ls-files`).
6. Founder Decision Agenda no longer has the contradictory blanket statement — ✅.
7. `DEC-ID-005` remains open — ✅, untouched.
8. `DEC-LEGAL-002` remains `OPEN_LEGAL` — ✅, untouched.
9. Terms remain unconfigured — ✅.
10. No application/configuration changes occurred — ✅ (all six changed/created files are under `docs/`).

## 24. Commit SHA

See completion report (post-commit).

## 25. PR #201 updated head SHA

See completion report (post-push).

## 26. CI result

See completion report (post-push).

## 27. Automated review status/findings

See completion report (post-push) — pending the automated reviewer's re-run against the new head.

## 28. Risks

- The two withdrawn propositions (reward-quantity-fixed; cross-programme reward coexistence) are now explicitly flagged as open gaps in the Business Obligation Matrix — a future task resolving `DEC-LOY-009` or addressing reward coexistence should treat these flags as the starting point, not re-derive them from scratch.
- The Founder Decision Sheet's cross-cutting principle is now cited as authority (Classification B) for the "standardizes trust" proposition in two other documents — if that Founder Decision Sheet text is ever revised, both downstream citations should be checked for continued accuracy.
- TRD23's OPD-004 (Reward Quantity Default) — immediately adjacent to the corrected OPD-005 — still frames reward quantity as an open question, consistent with the newly-confirmed finding that `DEC-LOY-009` remains genuinely open; no change was made there, correctly, since it wasn't part of this task's scope and isn't itself contradictory (it accurately reflects the still-open state).

## 29. Rollback instructions

All five corrections are isolated, individually revertible edits (no cross-file dependency beyond the intentional cross-references). Revert any subset via `git revert`/manual restoration without affecting the others. No non-doc system was touched.

## 30. Updated report path

`docs/05-implementation/reports/PR-201-REVIEW-CORR-001-review-findings-correction-report-2026-08-29.md` (this report). The PR #201 implementation/governance report (`DEC-LEGAL-002-COUNSEL-HANDOFF-CLOSE-001-final-hygiene-and-recording-report-2026-08-29.md`) is referenced, not rewritten, per the instruction not to mechanically edit historical records — this new report supersedes it for correction-status purposes going forward.

## 31. Persistent changes-file path

`docs/changes/IMPLEMENTATION_CHANGES.md`.

## 32. Exact Founder next action

Review this correction, then re-check PR #201 once CI and the automated reviewer complete against the new head. If both are clean, PR #201 is ready for your merge decision (still not self-merged by this task).
