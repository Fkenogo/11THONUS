> **Title:** Core Business Terms Part VIII (§§26–27) PR #217 Automated-Review Correction Report
> **Version:** 1.0 (2026-09-03) · **Status:** Working (governance record — controlled drafting correction report) · **Classification:** Working (governance record)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LEGAL-002` (Status: `OPEN_LEGAL`, unchanged)
> **Task:** `DEC-LEGAL-002-BT-DRAFT-008-CORR-001`
> **Governs:** [Core Business Terms — Draft](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md) §27.4, §27.8

# 1. Pre-edit analysis

- **PR #217** (branch `docs/dec-legal-002-bt-draft-008` → `main`): state `OPEN`, exact head at task start `64ca7f37db814466c588f27449fce98be7fa341f`.
- **CI at that head:** `gh pr checks 217` → `Build, Lint, Test, Emulator Validation` **pass** (6m53s).
- **Codex automated review** (`chatgpt-codex-connector`, review `PRR_kwDOTaQe388AAAABMAA6Yw`, submitted against commit `64ca7f37db`) — two open review-comment threads, both P-labelled, both genuine and within this task's scope:
  1. **P1** (`discussion_r3923174889`, on §27.4 as originally drafted): the sentence "A jurisdiction not yet indexed here requires its own assessment under §26 before it is added to this section" ties assessment only to the administrative act of indexing, so a launch in a jurisdiction not yet indexed would not, by that sentence's own terms, require assessment first — contrary to `DEC-LEGAL-002-BT-PART-VIII-DRAFT-BOUNDARY-001` §23's pre-launch assessment gate.
  2. **P2** (`discussion_r3923174904`, on §27.8 as originally drafted): the consolidated §27.8 paragraph ended with one generic "assessed... in a future governed jurisdiction-verification task" statement for all nine reserved items, dropping the nine item-specific reassessment triggers `DEC-LEGAL-002-BT-PART-VIII-DRAFT-BOUNDARY-001` §24 records — risking the index remaining stale even once a specific item's trigger condition is actually met.

Both findings are drafting-fidelity corrections against already-governed authority (the merged `DEC-LEGAL-002-BT-PART-VIII-DRAFT-BOUNDARY-001` report itself), not new legal research, not a Founder/counsel policy question, and not a reclassification of any of the nine reserved or two future-triggered items.

# 2. Correction strategy

1. **§27.4:** rewrite the closing sentence so a not-yet-indexed jurisdiction's §26 assessment is required before 11thONUS operates the platform for Businesses in that jurisdiction, and separately before that jurisdiction is added to the §27 index — preserving the portable Core → jurisdiction assessment → overlay/index sequence and inventing no jurisdiction-determination test (incorporation, residency, IP address, branch location, etc.).
2. **§27.8:** restructure the nine reserved items from one consolidated paragraph into nine separate lettered subsections (a)–(i), each restating its jurisdiction, topic, and its own item-specific reassessment trigger, retrieved verbatim in substance from `DEC-LEGAL-002-BT-PART-VIII-DRAFT-BOUNDARY-001` §§10/12/24, translated into plain contractual language (dropping the internal report's "repository-verified" phrasing in favour of "identification of a primary [jurisdiction] legal authority establishing...").
3. Update the Core Business Terms header/version (8.0 → 8.1), the Drafting Traceability Matrix (§27.4/§27.8 rows + a new correction-pass narrative), and `documentation-changes-log.md`. No Controlled Inputs Register change is required — its Part VIII narrative does not quote §27.4/§27.8's specific text.
4. No change to §26, §27.1–§27.3, §27.5–§27.7, or §27.9 beyond what §27.4's own sentence required.

# 3. Files modified

- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` (§27.4, §27.8 corrected; header/version → 8.1)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md` (§27.4/§27.8 rows updated; correction-pass narrative added; header/version → 8.1)
- `docs/00-governance/documentation-changes-log.md` (new entry)
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-008-CORR-001-correction-report-2026-09-03.md` (this file, created)

No Controlled Inputs Register change. No Part I–VII, application, Firebase, test, or dependency file touched.

# 4. Exact diff summary

- §27.4: one sentence rewritten to add "to be completed before 11thONUS operates the platform for Businesses in that jurisdiction and before that jurisdiction is added to this section — assessment is a precondition to operating in a new jurisdiction, not merely to updating this index."
- §27.8: opening paragraph shortened to a lead-in; nine lettered subsections (a)–(i) added, each carrying its own jurisdiction/topic/trigger, replacing the single consolidated sentence.
- No other clause text changed.

# 5. Nine reservation → trigger mapping (auditable)

| Item | Jurisdiction / topic | Reassessment trigger (§27.8) |
|---|---|---|
| (a) | Burundi — governing law/dispute forum (§21) | Primary Burundi legal authority establishing a mandatory different forum for an instrument of this kind |
| (b) | Burundi — controlling-language point (§25.6) | Primary Burundi legal authority establishing a controlling-text rule specific to a Business Terms addendum |
| (c) | Rwanda — notices (§24) | Primary Rwandan procedural-law authority establishing a specific deemed-receipt, service, or registered-address requirement |
| (d) | Burundi — notices (§24) | Primary Burundian procedural-law authority on notice or service mechanics |
| (e) | Burundi — liability-cap enforceability (§19) | Primary Burundi statutory or judicial authority addressing liability-limitation enforceability between businesses specifically |
| (f) | Burundi — indemnity enforceability (§20) | Primary Burundi authority on indemnity-clause enforceability |
| (g) | Rwanda — operator/Business disclosure beyond §27.5 (§8) | Primary Rwandan statutory authority imposing a disclosure category beyond those the Preamble already anticipates |
| (h) | Rwanda — general provisions (§25) | Primary Rwandan authority establishing a mandatory variation to assignment, severability, entire agreement, or survival |
| (i) | Burundi — general provisions (§25) | Primary Burundi authority establishing a mandatory variation to assignment, severability, entire agreement, or survival |

Each trigger is carried forward exactly in substance from `DEC-LEGAL-002-BT-PART-VIII-DRAFT-BOUNDARY-001` §§10/12/24; none is invented, narrowed, or altered.

# 6. Preserved unchanged (verified)

`DEC-LEGAL-002` = `OPEN_LEGAL`; Terms configuration = `NOT CONFIGURED`; Capability 3 unchanged; CI-01/CI-05 = `OPEN`; the five Verified — No Additional Overlay Required findings (§27.6/§27.7) unchanged; the Burundi Established Mandatory Overlay finding (§27.5) unchanged; all nine Category R classifications unchanged (only their presentation restructured); both Category F classifications (§27.9) unchanged; LEG-FD-01–16 unchanged; §26 unchanged except no edit was in fact required (§27.4's correction did not require reopening §26); Parts I–VII unchanged.

# 7. Commands executed

`gh pr view 217 --json ...`; `gh pr checks 217`; `gh api repos/Fkenogo/11THONUS/pulls/217/comments`; file edits via the editing toolchain, in the existing isolated worktree/branch `docs/dec-legal-002-bt-draft-008`; `git add`/`git commit`/`git push`; `gh pr checks 217` (post-push); `gh api .../pulls/comments/<id>/replies` and the review-thread resolve mutation (below).

# 8. Dependencies added / config changes / application changes

None. Docs-only.

# 9. CI

Re-run automatically on push to the same PR branch; verified green at the new head (see PR checks after this commit).

# 10. Review-thread state

Both threads (`discussion_r3923174889` P1, `discussion_r3923174904` P2) replied to, confirming the exact correction made, and marked resolved — both were fully addressed by this correction pass. No other thread exists on this PR.

# 11. Risks

Low — a narrow, drafting-fidelity correction against already-governed authority; no new Controlled Input, no Parts I–VII change, no reclassification.

# 12. Rollback instructions

Revert this commit on the PR branch, or revert the PR's merge commit if already merged; no application state, database, or configuration was touched.

---

**Gate:** `PR #217 PART VIII CORR-001 COMPLETE — PRE-LAUNCH JURISDICTION GATE RESTORED — NINE RESERVATION TRIGGERS PRESERVED — READY FOR FOUNDER REVIEW`
