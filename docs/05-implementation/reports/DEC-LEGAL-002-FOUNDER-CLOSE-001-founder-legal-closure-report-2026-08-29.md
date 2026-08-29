> **Title:** DEC-LEGAL-002-FOUNDER-CLOSE-001 — LEG-FD-14/15 Recording, PR #202 Safety Verification & Business-Terms Drafting Gate — Implementation/Governance Report
> **Version:** 1.0 · **Status:** Complete — docs-only, not merged · **Classification:** Working (governance record)
> **Task:** `DEC-LEGAL-002-FOUNDER-CLOSE-001` (continues `DEC-LEGAL-002-LEGAL-OPINION-RECON-001` — not a restart)
> **Date:** 2026-08-29

# DEC-LEGAL-002-FOUNDER-CLOSE-001 Report

## 1. Entry repository state

Branch `docs/dec-legal-002-founder-disp-001` (continued, not recreated). Local HEAD at task entry: `f87da96e606d2635b948956fa9b33934f747bb72` (the `DEC-LEGAL-002-LEGAL-OPINION-RECON-001` reconciliation commit). Working tree clean of the prior task's changes; the same 15 unrelated pre-existing untracked paths remained present and were left untouched throughout (`WORKING_WITH_THE_FOUNDER/`, several `docs/00-governance`/`docs/01-product`/`docs/05-implementation/reports`/`docs/06-engineering-governance` files, `docs/07-product-design.zip`, `docs/11thONUS-at-a-Glance.md`, `docs/30-go-to-market/`).

## 2. Current `origin/main`

`origin/main` HEAD = `ab5e9053e2a8ca5c2deabef3902550dc27d38819` — the merge commit for PR #201 ("Merge pull request #201 from Fkenogo/docs/dec-legal-002-founder-disp-001"), merged 2026-08-29T13:49:48Z. Confirmed via `git merge-base --is-ancestor ab5e9053... origin/main` (returned true — trivially, since it *is* `origin/main`'s tip) and via `gh pr view 201` (`mergedAt`/`mergeCommit.oid` match).

## 3. PR #202 history/base safety assessment

**Structurally safe — no unsafe history, no restart needed.** Verified directly, not assumed from the content diff:

- `git merge-base HEAD origin/main` = `ac34d84df2c83a671998b11c0e157616922869ac` — the same commit the prior report recorded as this branch's entry HEAD. This is exactly the commit PR #201 merged (as the second parent of merge commit `ab5e9053`), confirming PR #201's content is now on `main` and this branch's history up to that point is not stale relative to `main` — it *is* what `main` already contains.
- `git rev-list --left-right --count origin/main...HEAD` = `1  1`: exactly one commit each side — `origin/main`'s one extra commit is the merge commit `ab5e9053` itself (expected; feature branches never carry their own merge commit), and this branch's one extra commit is `f87da96` (the entire `DEC-LEGAL-002-LEGAL-OPINION-RECON-001` reconciliation package, and nothing else).
- `gh pr view 202` confirms: `baseRefOid` = `ab5e9053...` (GitHub had already re-based PR #202's comparison onto the new `origin/main` tip once PR #201 merged, because both PRs share the same head branch); `headRefOid` = `f87da96...`; `mergeable` = `MERGEABLE`.
- `gh pr view 202 --json commits` returns **exactly one commit**: `f87da96...`. No PR #201 commits appear in PR #202's commit list.
- `git diff --stat origin/main...HEAD` shows exactly the same 9 files, same insert/delete counts, as the `f87da96` commit alone — confirming PR #202's diff is precisely the new reconciliation package with nothing re-submitted from PR #201.

**Conclusion:** PR #202 does not carry or resubmit PR #201's history. It is a clean, single-commit PR based on the current `main`. No fresh branch, no history rewrite, and no force-push are required or performed.

## 4. Safe recording strategy

Because PR #202 was verified structurally safe (§3), the established safe-recording approach — continuing directly on the existing branch/PR — was used, rather than the fallback of creating a fresh branch from `origin/main`. This preserves the existing PR's review thread and avoids manufacturing an unnecessary second PR for what is, in substance, a continuation of the same reconciliation work. A fresh branch was evaluated and explicitly not needed: it would only have been warranted had PR #202 carried stale or resubmitted PR #201 history, which the verification in §3 ruled out. No destructive git operation (`reset --hard`, force-push, history rewrite) was performed or considered necessary.

## 5. LEG-FD-14 recorded position

**APPROVED.** Business ↔ 11thONUS disputes: good-faith resolution → mediation where appropriate → binding arbitration if unresolved. Core Business Terms arbitration architecture: seat Kigali, Rwanda; institution/rules Kigali International Arbitration Centre (KIAC); language English or French. Jurisdictional overlays may modify where mandatory applicable law requires. No additional procedural period, cost-allocation mechanic, or arbitrator count is invented — left to the controlled Terms-drafting stage. Recorded in full in the [Founder Legal Architecture Disposition Record v2.0](../../00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md).

## 6. LEG-FD-15 recorded position

**APPROVED WITH JURISDICTIONAL/LEGAL QUALIFICATION.** Business claims: aggregate direct 11thONUS liability to a Business capped at total fees actually paid in the 12 months preceding the claim-triggering event; no invented nominal cap for a zero-fee Business. Customer claims: counsel's nominal $25 USD/BIF cap not adopted; portable principle is liability limited to the maximum extent permitted by applicable law, subject to mandatory consumer rights. Liability attributable to 11thONUS stays separated from Business Reward Program/fulfilment liability. No limitation purports to override a non-excludable liability; "to the maximum extent permitted by applicable law" preserved as the intended drafting pattern. Recorded in full in the same disposition record.

## 7. B2B arbitration result

Adopted: Kigali/KIAC/English-or-French, good-faith → mediation → binding arbitration, for Business↔Platform contractual disputes only. Reconciliation Matrix rows 8 and 13 reclassified from F (deferred) to A (confirms the opinion's own recommendation, now Founder-adopted).

## 8. Customer-dispute boundary

Preserved, unaffected by LEG-FD-14. Customer↔Platform and Customer↔Business disputes retain LEG-FD-11/LEG-FD-12's existing architecture: platform complaint mechanism → applicable external/legal remedies; mandatory customer rights to local courts/regulators unaffected; no mandatory consumer arbitration introduced.

## 9. Business liability-cap result

Adopted: 12-month trailing fees-paid formula, direct contractual liability only, subject to applicable law and non-excludable liability.

## 10. Zero-fee Business treatment

No arbitrary/nominal monetary cap invented for a Business that has paid no fees. Left to future legal drafting and/or future commercial governance (potentially `DEC-SUB-013`, itself untouched and still `OPEN_FOUNDER`) — recorded as an explicit open drafting question, not resolved here, per the [Resolution Assessment v2.0](../../00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-resolution-assessment-2026-08-29.md) §9.

## 11. Customer liability treatment

Counsel's nominal $25 USD/BIF-equivalent global cap **not adopted**. Portable principle substituted: liability to customers limited to the maximum extent permitted by applicable law, subject to mandatory consumer rights and jurisdiction-specific requirements — no invented fixed-currency figure.

## 12. Mandatory-law limitation boundary

Preserved and reaffirmed: no limitation/exclusion adopted under LEG-FD-15 purports to override a liability applicable law does not permit the parties to exclude or limit (fraud, wilful misconduct, gross negligence, death/personal injury, non-excludable statutory consumer warranties — Legal Opinion §11's "Prohibited Exclusions" table, Reconciliation Matrix row 11, classification C, unaffected). The qualifying phrase "to the maximum extent permitted by applicable law" is the intended drafting pattern for every limitation/exclusion clause. Counsel's recommendations are not converted into broader exclusions than applicable law permits.

## 13. Reconciliation matrix update

Reconciliation Matrix updated to v2.0: rows 8, 9, and 13 revised (F→A for 8/13; D→B/E for 9), summary counts updated (A: 8→10, B: 6→7, D: 5→4, E: 4→5, F: 2→0), and the "Net effect" section rewritten to state that zero rows now carry an F classification. See [Reconciliation Matrix v2.0](../../00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-reconciliation-matrix-2026-08-29.md).

## 14. LEG-FD-01–15 consistency result

Verified internally consistent by direct re-read of the full disposition record after the LEG-FD-14/15 insertions: no LEG-FD item reopens, contradicts, or is contradicted by another; LEG-FD-14 does not conflict with LEG-FD-11 (it resolves the one item LEG-FD-11 explicitly deferred); LEG-FD-15 does not conflict with LEG-FD-04/07/08 (all four preserve the "11thONUS is not guarantor/fulfiller/funder" separation); the Cross-Cutting Notes section was updated to name LEG-FD-14/15 and to explicitly restate that no LEG-FD item invents an arbitrary customer liability cap, a universal 60-day run-off, a universal cash-settlement rule, or a Kirundi application-language requirement.

## 15. Business Terms readiness result

16 of 16 Core Business Terms sections are ready for controlled drafting at the architecture/decision level. This is an architecture/decision-level conclusion only — no Terms text is drafted, approved, configured, or effective as a result.

## 16. Number of drafting sections ready

**16/16** (up from 14/16 recorded by the prior task). See [Terms Drafting Readiness Note v2.0](../../00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-terms-drafting-readiness-2026-08-29.md) §3.

## 17. EXT-LEG-002 status

Unchanged: `EVIDENCE_RECEIVED`. Not touched by this task — the prior task's update already accurately reflects "external legal evidence received and reviewed," which this task does not need to (and did not) alter.

## 18. DEC-LEGAL-002 status

Unchanged: `OPEN_LEGAL`. A `Notes`-field addendum was appended (not a Status change), consistent with the FD-1 precedent and this task's explicit instruction not to close `DEC-LEGAL-002` merely because drafting can now begin.

## 19. Capability 3 status

Unchanged: `Open — engineering work packages complete; blocked on governed Terms-content configuration (DEC-LEGAL-002)` (`CDR-001` §5, not modified by this task). Remains, in the sense the task's own language uses, **in progress** — Founder architecture readiness does not itself configure a Terms version.

## 20. Terms configuration status

Unchanged: **NOT CONFIGURED.** No `functions/`, `apps/web/`, Firestore Rules, or Firebase configuration file was read for modification purposes or modified in any way by this task.

## 21. Customer Terms work-package assessment

Unchanged from `DEC-LEGAL-002-LEGAL-OPINION-RECON-001` (LEG-FD-10): a separate future governed work package, confirmed not a Capability 3 blocker. LEG-FD-14's arbitration architecture does not extend to Customer Terms disputes (§8 above).

## 22. DEC-LOY-011 status

Verified unchanged: `CONFIRMED` (Option (a), default-redeemable-with-governed-exceptions). Direct re-read of the Decision Register entry confirms no alteration.

## 23. DEC-ID-005 status

Verified unchanged: `OPEN_FOUNDER`. Direct re-read confirms no alteration.

## 24. DEC-LOY-009 status

Verified unchanged: `OPEN_FOUNDER`. Direct re-read confirms no alteration.

## 25. DEC-SUB boundary result

Verified unchanged: `DEC-SUB-001/002/003/008/009/010/013` remain `OPEN_FOUNDER`; `DEC-SUB-004/005/006/007` remain `CONFIRMED`; `DEC-SUB-011/012` remain `SUPERSEDED` (historical). None touched by LEG-FD-15's zero-fee-Business note, which only *references* `DEC-SUB-013` as a possible future venue for that question without resolving it.

## 26. Files modified

**Modified (in place, continuing the same evidence documents from the prior task — no new evidence files created, per the task's own instruction to update the existing matrix/disposition record):**
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md` (v1.0 → v2.0: LEG-FD-14/15 sections added, Cross-Cutting Notes updated)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-reconciliation-matrix-2026-08-29.md` (v1.0 → v2.0: rows 8/9/13, summary counts, net effect)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-resolution-assessment-2026-08-29.md` (v1.0 → v2.0: §2/§3/§6/§7 revised, §8/§9/§10 added)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-LEGAL-OPINION-RECON-001-terms-drafting-readiness-2026-08-29.md` (v1.0 → v2.0: §3 table, §5, §6)
- `docs/00-governance/decisions/decision-register.md` (header chain entry; `DEC-LEGAL-002` `Notes` addendum — `Status` unchanged)
- `docs/changes/IMPLEMENTATION_CHANGES.md` (append-only entry)

**Created:**
- `docs/05-implementation/reports/DEC-LEGAL-002-FOUNDER-CLOSE-001-founder-legal-closure-report-2026-08-29.md` (this report)

**Not modified:** `docs/00-governance/decisions/external-dependencies-register.md` (`EXT-LEG-002` already correctly `EVIDENCE_RECEIVED`, no change needed); `CDR-001-capability-delivery-roadmap.md` (Capability 3 status correctly unchanged, no update needed or authorized); the external Legal Opinion evidence body (verbatim, unaffected).

## 27. Diff summary

Docs-only. Four evidence documents extended (in-place edits, not rewrites — prior v1.0 content preserved with additions/corrections layered on top, consistent with the append/correct-in-place convention this repository already uses elsewhere, e.g. `DEC-LOY-011`'s own entry). One register entry extended. One new report. One changes-file entry appended.

## 28. Commands executed

`git branch --show-current`; `git log -1`; `git fetch origin`; `git log -1 origin/main`; `git merge-base --is-ancestor ...`; `git merge-base HEAD origin/main`; `git rev-list --left-right --count origin/main...HEAD`; `git status -sb`; `gh pr view 202 --json ...`; `gh pr view 202 --json commits`; `gh pr view 201 --json ...`; `git diff --stat origin/main...HEAD`; `git log origin/main..HEAD --oneline`; `git show ab5e9053... --stat`; multiple read-only `grep` checks of `decision-register.md` for `DEC-LOY-011`/`DEC-ID-005`/`DEC-LOY-009`/`DEC-SUB-*` status verification.

## 29. Dependencies added

None.

## 30. Config changes

None.

## 31. Application/source changes

**NONE.** No `functions/`, `apps/web/`, Firestore Rules, or Firebase configuration file touched.

## 32. Validation/CI

Documentation-only task; no application test suite applicable. Validation performed: (a) full git/PR safety verification (§3), each claim checked against actual `git`/`gh` output, not assumed; (b) direct re-read of `decision-register.md` entries for `DEC-LOY-011`, `DEC-ID-005`, `DEC-LOY-009`, and all `DEC-SUB-*` items, confirming no status drift; (c) full re-read of the updated disposition record for internal consistency (§14); (d) cross-check that the reconciliation matrix's row reclassifications match the disposition record's LEG-FD-14/15 text. CI: this PR carries a docs-only diff; the repository's CI (typecheck/lint/build/tests) is expected to pass trivially since no application file changed, consistent with the prior task's own PR #202. No CI run was manually triggered beyond the automatic PR update below.

## 33. Branch

`docs/dec-legal-002-founder-disp-001` (continued — verified safe in §3, not recreated).

## 34. Commit SHA

Recorded immediately following this report (see repository history after this task).

## 35. PR number/status

PR #202 (updated in place with a new commit) — open, not self-merged, awaiting Founder review.

## 36. Risks

- The reconciliation documents now carry two dated layers (v1.0 unchanged text plus v2.0 additions/corrections) rather than being rewritten as a single clean document; a reader skimming only the top-level version banner rather than the body could miss a v1.0 caveat that v2.0 narrows — mitigated by explicit "(2026-08-29)"/"resolves" annotations inline at every point v2.0 changes v1.0's conclusion.
- LEG-FD-15's zero-fee-Business gap is an intentionally incomplete architecture point (by design, per the task's own instruction not to invent a substitute figure) — a future Terms drafter could overlook it if working only from the Terms Drafting Readiness Note's "Ready" label for the Liability section without reading the qualifying note — mitigated by carrying the caveat into the Liability row's readiness text itself, not only into the disposition record.

## 37. Rollback instructions

Revert the single commit this task produces. File-by-file: `git checkout <pre-task-SHA> -- <path>` for each of the six modified/created files in §26 (the pre-task SHA is `f87da96e606d2635b948956fa9b33934f747bb72`, or its parent for files not touched by that commit).

## 38. Report path

`docs/05-implementation/reports/DEC-LEGAL-002-FOUNDER-CLOSE-001-founder-legal-closure-report-2026-08-29.md` (this file).

## 39. Persistent changes-file path

`docs/changes/IMPLEMENTATION_CHANGES.md` (append-only entry for `DEC-LEGAL-002-FOUNDER-CLOSE-001`).

## 40. Exact Founder next action

Review this update (LEG-FD-14/15, updated matrix/assessment/readiness note) on PR #202. If satisfied: authorize Core Business Terms drafting to begin, section-by-section, per the Drafting Readiness Note — noting that drafting itself, Founder approval of drafted text, and Terms-version configuration remain separate, not-yet-authorized future steps. Merge PR #202 when ready (not self-merged by this task).

---

**Final gate:** **`DEC-LEGAL-002 FOUNDER LEGAL ARCHITECTURE COMPLETE — CORE BUSINESS TERMS 16/16 READY FOR CONTROLLED DRAFTING — PR AWAITS FOUNDER REVIEW`**. `DEC-LEGAL-002` Status remains `OPEN_LEGAL`; `EXT-LEG-002` remains `EVIDENCE_RECEIVED`; Capability 3 remains in progress (blocked on governed Terms-content configuration); Terms configuration remains NOT CONFIGURED; Customer Terms remain a separate, non-blocking future work package. PR #202 verified structurally safe and updated in place; not self-merged.
