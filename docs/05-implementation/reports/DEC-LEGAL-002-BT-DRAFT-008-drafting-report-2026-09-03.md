> **Title:** Core Business Terms Part VIII (§§26–27) Drafting Report
> **Version:** 1.0 (2026-09-03) · **Status:** Working (governance record — controlled drafting report) · **Classification:** Working (governance record)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LEGAL-002` (Status: `OPEN_LEGAL`, unchanged)
> **Task:** `DEC-LEGAL-002-BT-DRAFT-008`
> **Governs:** [Core Business Terms — Draft](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md) Part VIII (§§26–27)

# 1–5. Entry state, worktree, base SHA, PR #216 verification, post-merge CI

- **Entry repository state:** primary worktree on branch `docs/dec-legal-002-bt-draft-007`, holding unrelated uncommitted `FD-COM-001` commercial-model work (not touched, read, stashed, or committed by this task).
- **Isolated worktree:** created via `git worktree add /Volumes/PRODUCTION/Projects/11THONUS-worktrees/dec-legal-002-bt-draft-008 -b docs/dec-legal-002-bt-draft-008 origin/main`.
- **Base SHA:** `9930900d8ccc0106ca4819409ea5adc990cfd275` (= `origin/main` HEAD at task start = PR #216 merge commit).
- **PR #216 verification:** `gh pr view 216` confirmed `state: MERGED`, `headRefOid: 3738ed30fcb5579ec88e68c116904c84a94c623d`, `mergeCommit.oid: 9930900d8ccc0106ca4819409ea5adc990cfd275`, `mergedAt: 2026-09-03T08:57:24Z` — both hashes match the task's stated values exactly.
- **Post-merge CI:** `statusCheckRollup` shows one check, `Build, Lint, Test, Emulator Validation` (workflow `CI`), `conclusion: SUCCESS`.

# 6. Governing source inventory

Read via `git show origin/main:<path>` (a dedicated research pass, cross-checked directly by this task before drafting):

- `DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` (v7.2, the living instrument)
- `DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md` (v7.2)
- `DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md` (v7.2)
- `DEC-LEGAL-002-BT-PART-VIII-READINESS-001-assessment-report-2026-09-02.md` (merged, corrected through `-CORR-001`, closed `-CLOSE-001`/`-CLOSE-001-CORR-001`)
- `DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-jurisdiction-verification-report-2026-09-02.md` and `-CORR-001-correction-report-2026-09-03.md`
- `DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-legal-source-evidence-pack-2026-09-02.md`
- `DEC-LEGAL-002-BT-PART-VIII-DRAFT-BOUNDARY-001-assessment-report-2026-09-03.md` (current merged version, PR #216 Codex-review correction already applied in place)
- `decision-register.md` (DEC-LEGAL-002 status) and `DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md` (LEG-FD-14, LEG-FD-16)
- `canonical-reference.md` (confirmed it carries no legal-drafting-track status; not authoritative for this task)
- DRAFT-007 (Part VII) precedent: `git show --stat` on commits `f94daa7`/`a404a53`/`0a56456`, confirming the exact file-modification pattern replicated here.

# 7. Drafting strategy (stated to the Founder before editing)

§26 states only the already-governed §3.3 two-layer model (portable Core / jurisdiction overlay, "mandatory or appropriate" trigger preserved verbatim) as a contractual mechanism, in seven subclauses matching the task's own 26.1–26.7 outline. §27 uses only the five sanctioned Business-facing status labels — never the internal D/R/F/A/B/C/D taxonomy or CI-01/CI-05 by code — to index: the one Established Mandatory Overlay (Burundi disclosure, identified not drafted), the five Verified — No Additional Overlay Required findings, the nine Unresolved — Reserved items, and the two Future-Triggered items, exactly as recorded by the merged reports. No new applicability tests, no Burundi substantive clause text, no Parts I–VII edits beyond cross-reference updates.

# 8–9. Files expected vs. files actually modified

**Expected** (per DRAFT-007 precedent, replicated exactly): the living Core Business Terms document; the Drafting Traceability Matrix; the Controlled Inputs Register (narrative only, no register-table change); `documentation-changes-log.md`; a new drafting report.

**Actually modified:**
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` — Part VIII §§26–27 drafted; header/version bumped to 8.0; all prior "not drafted in this task" cross-references to §26/Part VIII resolved to point at drafted text; Status Reaffirmation updated.
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md` — Part VIII clause table (16 rows) and narrative self-review added; header bumped to 8.0.
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md` — Part VIII review narrative and prohibited-concept discipline note added; header bumped to 8.0; **register table unchanged** (CI-01/CI-05 only).
- `docs/00-governance/documentation-changes-log.md` — Entry 149 added.
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-008-drafting-report-2026-09-03.md` — this file, created.

No other file touched. No Decision Register, application source, Firebase configuration, test, package/dependency, or unrelated governance file modified.

# 10. Core Business Terms version change

7.2 → **8.0**. Status label unchanged: `DRAFT — NOT APPROVED — NOT EFFECTIVE — NOT CONFIGURED`.

# 11–18. §26 final structure and per-subsection treatment

§26 has seven subsections, 26.1–26.7:

- **§26.1 (Portable Core):** states the Core Terms provide the common contractual framework for participation, without claiming universal sufficiency under every country's law.
- **§26.2 (Jurisdiction-Specific Terms):** preserves the governed phrase "mandatory or appropriate" verbatim from §3.3; states supplement, not redefinition; not narrowed to mandatory law only.
- **§26.3 (Priority):** jurisdiction-specific provision controls only to the extent necessary for that jurisdiction, subject to mandatory law — no broad replacement of the Core Terms.
- **§26.4 (Jurisdiction Scope):** an overlay applies only where its own jurisdiction/applicability conditions are satisfied; expressly declines to invent a jurisdiction-determination test (incorporation, registration, residency, principal place of business, branch location, IP address, or customer location).
- **§26.5 (No False Certification):** absence of an overlay entry is not a representation that no local requirement exists, that the Core Terms are universally enforceable, or that verification is complete for every jurisdiction.
- **§26.6 (Future Jurisdictions):** preserves the ability to add jurisdiction-specific treatment as 11thONUS enters new markets; explicitly routes any materially rights/obligations-affecting change through §22 rather than creating a separate or expedited mechanism — no unrestricted unilateral Terms-change power, no automatic acceptance, no deemed acceptance, no continued-use acceptance.
- **§26.7 (Mandatory Law):** cross-references §§19.4/21.1/21.8/22.5/25.2 rather than duplicating them; states it operates alongside, not in place of, those existing mandatory-law qualifications.

# 19. Confirmation — no unsupported jurisdiction-applicability rule invented

Confirmed by direct text search of the drafted §26/§27 clause text (Section 24 below): no automatic jurisdiction-determination rule, residency test, IP/geolocation test, Business-incorporation test, branch-location hierarchy, choice-of-law override beyond LEG-FD-16, customer-jurisdiction rule, tax-nexus rule, or regulatory-licensing conclusion appears as an asserted proposition anywhere in §26 or §27. The only occurrence of "incorporation," "residency," "branch location," or "IP address" is inside §26.4's own negation clause.

# 20–21. §27 final structure; contractual index vs. internal governance metadata treatment

§27 has nine subsections, 27.1–27.9: 27.1 (maintenance mechanism), 27.2 (the five status-label definitions, lettered (a)–(e)), 27.3 (narrows the "Verified" and "Unresolved" labels against overclaiming), 27.4 (portability statement), 27.5 (the one Established Mandatory Overlay item), 27.6–27.7 (the five Verified — No Additional Overlay Required findings, split Rwanda/Burundi), 27.8 (the nine Unresolved — Reserved items, one consolidated subsection), 27.9 (the two Future-Triggered items).

Only the five sanctioned status labels appear in the drafted text. A direct search confirms none of "D-classified," "Category R," "Category F," "CI-01," "CI-05," "Founder decision," "drafting readiness," "evidence threshold," or any internal task ID appears inside §26 or §27's clause text — those terms exist only in this report, the Traceability Matrix, and the Controlled Inputs Register (the internal governance apparatus), never in the contractual instrument itself.

# 22–23. Burundi mandatory-overlay treatment; CI-01 treatment

§27.5 identifies the established Burundi requirement (operator identity; platform/Business role-separation warning; data-processing disclosure), citing no substantive text beyond the requirement's existence, and states expressly that the specific disclosure content "depends on operator-identity information not yet available for inclusion in these Terms (see the Preamble)." CI-01 is not resolved, narrowed, or given an invented value; it is referenced by cross-reference to the Preamble only, consistent with the Controlled Inputs Register's existing CI-01 row.

# 24. Exact five verified-no-additional-overlay findings carried forward

Rwanda (§27.6): force majeure (§25.4); liability-limitation enforceability (§19); indemnity enforceability (§20). Burundi (§27.7): electronic contracting/acceptance validity (§7); force majeure (§25.4). All five carried forward exactly as classified by `DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-CORR-001` (rows 3 Burundi, 6 Rwanda, 6 Burundi, 8 Rwanda, 9 Rwanda).

# 25. Exact nine unresolved/reserved items carried forward

§27.8: (1) Burundi governing law/dispute forum (§21); (2) Burundi controlling-language point (§25.6, residual); (3) Rwanda notices (§24); (4) Burundi notices (§24); (5) Burundi liability-cap enforceability (§19); (6) Burundi indemnity enforceability (§20); (7) Rwanda operator/Business disclosure beyond §27.5 (§8); (8) Rwanda general provisions (§25); (9) Burundi general provisions (§25). All nine carried forward exactly as classified by `DEC-LEGAL-002-BT-PART-VIII-DRAFT-BOUNDARY-001`, none resolved, narrowed, or reclassified.

# 26. Exact two future-triggered items carried forward

§27.9: Rwanda commercial/subscription terms; Burundi commercial/subscription terms — both gated on activation of a paid subscription mechanism, new pricing architecture, billing cycles, late-payment charges, refunds, or auto-renewal (FD-7). Neither activated; §18.6's existing non-resolutions unaffected.

# 27–28. Rwanda / Burundi index treatment

Rwanda: three Verified findings (§27.6), three Unresolved items (notices, disclosure-beyond-§27.5, general provisions), one Future-Triggered item. Burundi: one Established Mandatory Overlay (§27.5), two Verified findings (§27.7), five Unresolved items (dispute forum, language, notices, liability-cap, indemnity, general provisions — six, see §27.8 exact list), one Future-Triggered item.

# 29–30. Portability treatment; future-market extensibility

§27.4 states expressly that Rwanda and Burundi are "the jurisdictions currently assessed," not the platform's geographic scope, and that a finding for one does not extend to the other or to any third jurisdiction. §27.1 ties the index's maintenance to §26.6, so a future jurisdiction (e.g., Kenya, Uganda, Tanzania) can be added under the existing §26 mechanism and §27.2 status-label architecture without amending either section — no new jurisdiction was added by this task.

# 31–32. LEG-FD-14 / LEG-FD-16 consistency

§21.1 (Rwanda governing law) and §21.3–§21.6 (Kigali/KIAC arbitration architecture) are unedited beyond the §26/Part VIII cross-reference format. §26 does not restate, modify, or override either; §27.8 item 1 (Burundi dispute forum) is stated as reserved, not as a variance from LEG-FD-14/16.

# 33. §22/reacceptance consistency

§26.6 expressly routes any materially rights/obligations-affecting jurisdiction-specific provision through §22, using §22's existing material/non-material distinction and existing versioned-acceptance architecture — no separate or expedited reacceptance mechanism created, no deemed/continued-use acceptance invented.

# 34. Mandatory-law treatment

§26.7 confirms mandatory/non-waivable law is not contracted out of anywhere in §26, cross-referencing rather than duplicating §§19.4/21.1/21.8/22.5/25.2.

# 35. Reward-obligation consistency

§26/§27 does not touch Part III (§§11–14) or the earned-reward-survival architecture (FD-2, `DEC-LOY-011`) at all; no reward-related overlay item was drafted or reserved.

# 36. Subscription/FD-7 consistency

§27.9 gates both commercial/subscription items on FD-7's structural-framework-only disposition, consistent with §18.6's existing non-resolutions; no `DEC-SUB-*` value invented.

# 37. Parts I–VII substantive changes

**None.** Confirmed by direct diff: every edit to Parts I–VII is a scope-label/cross-reference update (document header, DRAFT banner, "How to read this document," Part 0 §§0.0/0.1, six Part heading notes, §3.3, §7.3, §19.4, §21.1, §21.8, Status Reaffirmation) — no substantive clause body in Parts I–VII was altered.

# 38–40. Whole-instrument integrity findings

A read-only cross-check of defined terms, cross-references, governing-law consistency, dispute-resolution consistency, acceptance/reacceptance consistency, jurisdiction-overlay consistency, mandatory-law carve-outs, reward obligations, suspension/exit treatment, liability, indemnity, privacy/data, notices, force majeure, survival, language, subscription boundaries, and Business/customer role separation was performed by grepping every "§26"/"§27"/"Part VIII" reference across the full instrument (18 occurrences outside Part VIII itself) and confirming each now resolves cleanly to drafted §26/§27 text rather than a stale "not drafted in this task" placeholder.

- **BLOCKING INTEGRITY FINDING:** none.
- **NON-BLOCKING INTEGRITY NOTE:** none identified — no cross-part contradiction was found requiring a change to Parts I–VII.
- **NO FINDING:** all eighteen categories listed in the task's whole-instrument integrity checklist.

# 41–43. New Founder / legal / Controlled Input decisions required

None. No new Founder policy decision required. No new legal/counsel decision required. No new Controlled Input created.

# 44–49. Status confirmations

- **CI-01:** `OPEN` (unchanged) — referenced, not resolved, at §27.5.
- **CI-05:** `OPEN` (unchanged) — unaffected; §26.6 confirms §22's existing architecture governs.
- **`DEC-LEGAL-002`:** `OPEN_LEGAL` (unchanged).
- **Terms configuration:** `NOT CONFIGURED` (unchanged).
- **Capability 3:** Open — blocked on governed Terms-content configuration (unchanged).
- **Part VIII drafting status:** DRAFTED (§§26–27), draft pending Founder review — same status as Part VII.

# 50. Traceability updates

Drafting Traceability Matrix: 16-row Part VIII clause table added, plus a narrative self-review paragraph confirming no Parts I–VII substantive change. Controlled Inputs Register: narrative "Part VIII review" section added confirming no new Controlled Input, plus a prohibited-concept discipline paragraph; register table itself unchanged.

# 51. Documentation changes-log entry

Entry 149 added (see `documentation-changes-log.md`), following the exact format and level of detail of Entries 130–148.

# 52. Code diff summary

Docs-only. No application/source/Firebase/dependency/config file touched. Five files changed: Core Business Terms draft, Drafting Traceability Matrix, Controlled Inputs Register, documentation-changes-log, and this new drafting report.

# 53. Commands executed

`git fetch origin`; `git log`/`git show --stat` (research); `gh pr view 216 --json ...`; `git worktree add ... origin/main`; file reads/edits via the editing toolchain; `git add`/`git commit`/`git push`/`gh pr create` (below).

# 54–57. External research; dependencies; config; application/source changes

All **NONE**, as required. No external legal research performed beyond re-reading already-merged repository sources. No dependency added. No config changed. No application/source file touched.

# 58. Tests/CI executed

No test suite applicable to a docs-only change; the PR's standard repository CI (`Build, Lint, Test, Emulator Validation`) will run on push, per repository convention.

# 59. Automated review result

Pending — PR opened, not self-merged; automated (Codex) review requested per repository convention. This report will be superseded by a `-CORR-00N` correction report if genuine findings require in-place correction.

# 60. Risks

Low — docs-only controlled drafting, bounded by an already Founder-authorized gate, carrying zero new Controlled Inputs and zero Parts I–VII substantive changes.

# 61. Rollback instructions

Revert the merge commit on `main`, or `git worktree remove` this worktree and delete branch `docs/dec-legal-002-bt-draft-008` before merge; no application state, database, or configuration was touched, so no additional rollback step is required.

# 62–67. PR / commit metadata

See the accompanying PR description and commit history for the exact commit SHA(s), PR number, PR head SHA, and PR state — populated after this report is committed and the PR is opened.

# 68. Exact Founder next action

Review PR #217 (or the next available PR number) for `docs/dec-legal-002-bt-draft-008`, confirm §26/§27's wording and the nine-reservation/two-future-trigger index are acceptable as a controlled drafting baseline, and either approve (establishing Part VIII as a Founder-approved baseline alongside Parts I–VI, consistent with Part VII's current pending-review status) or direct specific corrections.

---

**Gate:** `CORE BUSINESS TERMS PART VIII §§26–27 DRAFTED — PORTABLE CORE / JURISDICTION-OVERLAY ARCHITECTURE PRESERVED — READY FOR FOUNDER REVIEW`
