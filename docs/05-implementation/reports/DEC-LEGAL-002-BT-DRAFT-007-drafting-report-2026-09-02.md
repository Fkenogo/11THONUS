# DEC-LEGAL-002-BT-DRAFT-007 — Core Business Terms Part VII (§§21–25) Drafting Report

> **Task:** `DEC-LEGAL-002-BT-DRAFT-007` · **Date:** 2 September 2026 · **Performed by:** Claude (AI agent), per Founder task instruction
> **Scope:** Docs-only, bounded drafting of Part VII (§§21–25) of the Core Business Terms, on the bounded basis of `DEC-LEGAL-002-BT-PART-VII-READINESS-001` (merged, PR #211, as corrected through `-CORR-001`/`-CORR-002`). **No Part VIII drafting. No Terms configuration. No application/source/Firebase/configuration change.**

---

## 1. Entry repository state

Branch `docs/dec-legal-002-bt-draft-007`, created fresh from `origin/main`. Working tree otherwise clean of tracked changes at task start; a set of pre-existing untracked files (`WORKING_WITH_THE_FOUNDER/`, several `docs/00-governance` and `docs/05-implementation/reports` files, `docs/30-go-to-market/`, `docs/07-product-design.zip`, `docs/11thONUS-at-a-Glance.md`, etc.) predate this task, are unrelated to it, and are left untouched.

## 2. Base SHA

`9c7b62dd70b23d98079b05e05df16afd55772a20`

## 3. PR #211 merge verification

Confirmed by direct inspection: `git log origin/main` shows `9c7b62d` as `Merge pull request #211 from Fkenogo/docs/dec-legal-002-bt-part-vii-readiness-001`, and `gh pr view 211 --json mergeCommit,mergedAt` returns `mergeCommit.oid = 9c7b62dd70b23d98079b05e05df16afd55772a20`, `mergedAt = 2026-09-02T08:29:20Z`. PR #211 merged.

## 4. Entry-gate verification

- Parts I–VI are each Founder-approved controlled drafting baselines — confirmed by `DEC-LEGAL-002-BT-PART-VII-READINESS-001-assessment-report-2026-09-02.md` item 5 (as corrected by `-CORR-001`).
- Part VII readiness approved — confirmed by that same report's `FINAL GATE`: `PART VII DRAFTING READY WITH EXPLICIT NON-RESOLUTIONS — RWANDA GOVERNING LAW FOUNDER-GOVERNED — REVIEW FINDINGS RESOLVED`.
- LEG-FD-16 present and Founder-approved — confirmed by direct inspection of `DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md` (version 3.0), LEG-FD-16 section, `Disposition: APPROVED`.
- Part VII undrafted at task start — confirmed: the controlled instrument's own §0.1 read `**Part VII — Legal Mechanics** *(heading only — not drafted)*` and the "End of Part VI" boundary statement confirmed no Part VII clause text existed.
- Part VIII undrafted — confirmed, and left undrafted by this task; §0.1's Part VIII heading is unchanged except for the section-count cross-reference correction described at §29 below.
- CI-01/CI-05 the only open Controlled Inputs — confirmed by direct inspection of the Controlled Inputs Register (v6.0 at task start).
- `DEC-LEGAL-002` = `OPEN_LEGAL` — confirmed by direct inspection of the Decision Register.
- Terms configuration = `NOT CONFIGURED` — confirmed by the instrument's own Status Reaffirmation section (v6.0).
- Capability 3 = IN PROGRESS (`Open — engineering work packages complete; blocked on governed Terms-content configuration`) — confirmed the same way.

No divergence from the governing task brief was found. Drafting proceeded.

## 5. Current instrument version/state (before this task)

Core Business Terms draft v6.0 (2026-09-02, Part VI). Parts I–VI (§§1–20) drafted with full clause text; Parts VII–VIII headings/placeholders only.

## 6. Drafting strategy and authority mapping

Drafted §§21–25 strictly within the exact drafting-ready scope stated at `DEC-LEGAL-002-BT-PART-VII-READINESS-001-assessment-report-2026-09-02.md` item 49, and preserved every explicit non-resolution at item 50, verbatim in substance. §21 states LEG-FD-14's arbitration sequence/seat/institution/language exactly and LEG-FD-16's Rwanda governing-law rule exactly, as two distinct statements (§21.1–§21.2 substantive law; §21.3–§21.7 arbitration architecture), with the full arbitration-mechanics non-resolution stated in §21.5 rather than left to silence. §22 states LEG-FD-13's material/non-material principle and cross-references §7's existing acceptance architecture rather than duplicating it, and states CI-05's non-resolution explicitly at §22.4, covering both the reacceptance mechanism and the refusal/non-acceptance consequence per the readiness report's `-CORR-002` correction. §23 is a pure cross-reference, adding no substantive privacy content. §24 uses only electronic/in-platform notice channels and LEG-FD-02's language architecture, with an explicit non-resolution of deemed-receipt timing and channel exclusivity at §24.2. §25 drafts assignment, severability, entire agreement (respecting LEG-FD-10), force majeure (bounded by the earned-reward architecture), survival, and language-of-the-agreement (with the version-conflict point left an open reservation), per the readiness report's item 26 authority basis — governed-architecture consistency, LEG-FD-01/02, mandatory law, and omission of any new substantive Founder/commercial position, not contract convention as an independent source.

## 7. Exact Part VII headings drafted

Matches the readiness report's item 6 quotation and the instrument's own §0.1 exactly: §21 Governing Law and Dispute Resolution (Business ↔ 11thONUS); §22 Changes to These Terms; Reacceptance; §23 Data and Privacy (cross-reference only); §24 Notices; §25 General Provisions (assignment, severability, entire agreement, force majeure, survival, language of the agreement).

## 8. §21 drafted text summary

§21.1: Rwanda governing law, subject to mandatory law/non-waivable requirements/jurisdictional overlays; scope limited to the Business↔11thONUS relationship. §21.2: confirms the governing-law rule is not inferred from the seat/institution. §21.3: good-faith → mediation-where-appropriate → binding-arbitration sequence. §21.4: seat Kigali, Rwanda. §21.5: institution KIAC, with an explicit non-resolution of arbitrator number/appointment, cost allocation, time limits, confidentiality, court enforcement, and procedural law beyond seat/institution. §21.6: language English or French. §21.7: scope boundary — Business↔11thONUS only, not customer disputes. §21.8: forward reference to the undrafted Part VIII overlay mechanism.

## 9. LEG-FD-16 treatment

Stated exactly as LEG-FD-16 provides: Rwanda law, subject to mandatory applicable law, non-waivable statutory/regulatory requirements, and jurisdiction-specific overlays (§21.1). Not extended to the Customer Terms, Business Reward Program Rules, mandatory consumer claims, or jurisdiction-specific overlay matters (§21.1, negative clause). Stated as a separate substantive-law decision, not inferred from the Kigali seat or KIAC institution (§21.2), consistent with LEG-FD-16's own scope-boundary paragraph.

## 10. LEG-FD-14 treatment

Stated exactly: good-faith → mediation-where-appropriate → binding-arbitration sequence (§21.3); seat Kigali, Rwanda (§21.4); institution KIAC (§21.5); language English or French (§21.6); scope limited to Business↔11thONUS contractual disputes, not extended to customer disputes (§21.7); jurisdictional-overlay proviso preserved (§21.8).

## 11. Arbitration mechanics omitted/reserved

Per readiness report item 33 (as corrected by `-CORR-002`), §21.5 states — without inventing a value — that the section does not itself state a number of arbitrators, an arbitrator-appointment mechanism, a cost-allocation formula, a claim time limit, a confidentiality obligation, a court-enforcement forum, or a rule of arbitral procedural law beyond naming the seat and institution, and that KIAC's own applicable rules or applicable law apply to any such matter without further statement.

## 12. §22 drafted text summary

§22.1: material/non-material reacceptance principle, consistent with §7's acceptance standard. §22.2: no fixed/universal advance-notice period; timing addressed via §24 and this section. §22.3: cross-references §7.2's versioned-acceptance architecture; no forced-scrolling/re-type-to-confirm mechanism introduced. §22.4: explicit non-resolution of both the reacceptance-on-change mechanism and the refusal/non-acceptance consequence (CI-05), with the full prohibited-inventions list stated negatively. §22.5: does not require/foreclose urgent/legally-compelled change treatment; consolidated/localized presentation under §3.3 is not itself a "change."

## 13. LEG-FD-13 treatment

Stated exactly: material changes affecting rights/obligations require affirmative reacceptance where appropriate under applicable law/governance (§22.1); non-material/administrative changes may be communicated without reacceptance, subject to applicable law (§22.1); no universal 14-day (or any other fixed) notice period (§22.2); the existing versioned-acceptance/retrievable-evidence architecture is preserved, cross-referenced not duplicated (§22.3).

## 14. CI-05 treatment

CI-05 is restated, not resolved, at §22.4 — the marker location in the Controlled Inputs Register is updated to add §22.4 alongside §7.4, and the register's description of CI-05 is updated to confirm (not create) that it covers both the reacceptance-on-change mechanism and the refusal/non-acceptance consequence, per the readiness report's `-CORR-002` correction. No new Controlled Input was created.

## 15. Reacceptance consequence treatment

§22.4 expressly states that no lifecycle/access consequence is established by this section for a Business that refuses, fails, or has not yet completed a required reacceptance — automatic suspension, automatic termination, automatic account blocking, continued full access, grandfathering, restriction to existing activity only, a new-business-only effect, a grace period, and a fixed deadline are all listed as inventions this section does not make. The matter remains CI-05.

## 16. §23 drafted text summary

§23.1: cross-reference only — personal-data processing governed by the separate privacy/data-processing framework, not these Terms. §23.2: differentiated-instrument principle — these Terms and the privacy/data-processing framework perform different legal functions; no data-as-consideration framing. §23.3: no privacy-policy document name/version invented.

## 17. Privacy/data boundary

No substantive privacy or data-processing obligation is stated anywhere in §23, consistent with LEG-FD-09/LEG-FD-10 and the instrument's own §0.1 "cross-reference only" heading. `DEC-LEGAL-001`/`EXT-LEG-001` (the separate privacy governance track) are not brought into `DEC-LEGAL-002` scope by this section.

## 18. §24 drafted text summary

§24.1: electronic-first notice mechanism (in-platform notification, registered email, or another available electronic channel). §24.2: no postal-delivery requirement, no fixed deemed-receipt period, no single mandatory channel; formal/legal-matter notices addressed by the applicable section or applicable law. §24.3: language English or French, with local-language communication permitted for accessibility/legal-notice purposes without becoming a general application-language requirement. §24.4: scope boundary — 11thONUS↔Business notices only, not Business↔customer communication.

## 19. Notice channels/timing boundary

No fixed deemed-receipt period, mandatory single channel, or fixed notice address is stated anywhere in §24 (§24.2 states this negatively). This is consistent with LEG-FD-06's declination to invent comparable fixed periods elsewhere in the instrument and with the readiness report's items 22–24/38–39.

## 20. Language treatment

§24.3 and §25.6 state English/French as the core languages consistent with LEG-FD-02, without inventing a Kirundi general-application-language requirement. §24.3 permits local-language communication (including Kirundi, per LEG-FD-02) for accessibility/legal-notice purposes only, without making it a general application language. §25.6 leaves which language version controls in case of conflict an open reservation, since no authority resolves it.

## 21. §25 drafted text summary

§25.1: assignment (Business may not assign without 11thONUS consent, subject to an asset-transfer/transferee-assumption exception; 11thONUS may assign on merger/acquisition/reorganization/sale). §25.2: severability (standard functional form, subject to mandatory law). §25.3: entire agreement (does not displace Customer Terms, Business Reward Program Rules, or jurisdictional overlays). §25.4: force majeure (narrow genuine-impossibility standard, expressly bounded against the earned-reward architecture). §25.5: survival (only provisions whose nature requires it). §25.6: language of the agreement (English/French; version-conflict point reserved).

## 22. Assignment treatment

Drafted as ordinary bounded legal-drafting judgment under LEG-FD-01's fallback standard, per readiness report items 26–27 (no jurisdiction-specific value or new Founder/commercial position required). No broad transfer right or absolute anti-assignment restriction is created; the clause states a conventional, narrow position (consent required, subject to an asset-transfer exception) without silently granting or restricting a commercial right no existing authority addresses.

## 23. Severability treatment

Standard functional form, subject to applicable law, without changing any substantive right or obligation stated elsewhere in the instrument (§25.2).

## 24. Entire-agreement treatment

Drafted to respect LEG-FD-10's differentiated-instrument architecture exactly: §25.3 states expressly that the entire-agreement clause does not displace, override, or narrow the Customer Terms / Platform Terms of Use instrument, a Business's own Reward Program Rules, or an applicable jurisdictional overlay — each remains a separate, related instrument.

## 25. Force-majeure treatment

§25.4 is a narrow, genuine-impossibility standard ("makes performance of the affected obligation impossible, and that the party could not have avoided or overcome by reasonable measures"), not a broad hardship or convenience exception. It expressly excludes financial distress, commercial inconvenience, an ordinary cost increase, ordinary operational difficulty, voluntary cessation of business, an ordinary supply problem, and other broadly defined hardship as grounds to excuse an already-earned reward obligation. It does not adopt the Legal Opinion's "legally impossible" definition as a settled Founder position — Reconciliation Matrix row 5's Classification-B "legally impossible" concept is used only as narrow drafting guidance for the impossibility standard's shape, consistent with the readiness report's items 26–27.

## 26. Earned-reward protection

§25.4 states expressly that the clause does not excuse, reduce, or delay a Business's obligation to honour a reward already validly earned by a customer, cross-referencing §13.1–§13.4, §14.2, §15.4–§15.5, §16.3, and §18.5 (all of which restate FD-2/`DEC-LOY-011`'s earned-reward-survival principle), and that 11thONUS does not become the guarantor, funder, or fulfiller of an earned reward obligation as a result of this section. This is also restated in the Status Reaffirmation section's `DEC-LOY-011` line.

## 27. Survival treatment

§25.5 preserves only provisions whose nature requires post-termination effect — the earned-reward obligations (§13, §16), liability (§19), indemnity (§20), and §25 itself — and does not create a new or broader indefinite obligation.

## 28. Language-version conflict treatment

§25.6 states English and French as the operative languages and expressly leaves the question of which version controls in case of a conflict between them an open reservation for future governance or applicable law, since no authority (LEG-FD-02 or otherwise) resolves it. This is not a Controlled Input — it is independently reservable per readiness report item 27.

## 29. Administrative §0.1/baseline-label corrections

Per this task's own express authorization ("Administrative updates required solely because Part VII is now drafted — such as version/scope labels, cross-reference status or the previously flagged §0.1 baseline labels — may be corrected narrowly"), the following administrative corrections were made, none of which alters the substantive meaning of Parts I–VI:

- Document header/version metadata updated to v7.0.
- The DRAFT/NOT APPROVED banner's Part-list sentence updated to include Part VII; "Parts VII–VIII" corrected to "Part VIII" where only Part VIII remains undrafted.
- "How to read this document" list: added a Part VII bullet.
- §0.0 Instrument Map row A: updated to state Parts I–VII drafted, Part VIII not drafted.
- §0.1: Part VII heading annotation changed from "*(heading only — not drafted)*" to "*(drafted in task `DEC-LEGAL-002-BT-DRAFT-007`...)*".
- §0.2 readiness-mapping table: rows 9 (Disputes/corrections), 12 (Data/privacy references), 15 (Governing law/disputes), and 16 (Changes to Terms) updated from "No — Part VII heading only" / "Partial" to "Yes," each with a citation to the governing task and authority.
- Part I/III/IV/V/VI heading notes (the italic notes opening each Part): updated to state Part VII is now also drafted, following the exact precedent established at each prior Part's own drafting task.
- Four Part I/III/IV forward cross-references to Part VII (the §2 "Terms" definition; §7.1; §7.4; §14.4; §17.3) corrected from "(Part VII §21/§22, not drafted in this task)" to a direct section cross-reference, since Part VII is now drafted — no substantive change to any of these clauses' operative content.
- The previously flagged §0.1/Part-I-preamble Parts-I–VI baseline-status labels (flagged, not corrected, by `DEC-LEGAL-002-BT-PART-VII-READINESS-001`'s own risk item 57 and Founder-next-action item 63) are corrected in this task, per this task's own express authorization, from "all remain draft pending Founder review" to state that Parts I–VI are each Founder-approved controlled drafting baselines and Part VII remains draft pending Founder review — matching the readiness report's own `-CORR-001` correction.
- "End of Part VI" boundary text replaced with a new "End of Part VII" boundary text (Part VIII now the only undrafted Part).
- Status Reaffirmation section: added a Part VII line to the intro sentence; added a Part VII open-items bullet; updated the CI-01/CI-05 bullet to reference §21–§25 and §22.4; updated the `DEC-LOY-011` bullet to note §25.4's force-majeure constraint.

None of these corrections alters the substantive meaning of any Part I–VI clause — verified by direct diff (see §30 below).

## 30. Parts I–VI substantive diff verification

`git diff` of this task's changes to the core instrument file confirms: no Part I §§1–7, Part II §§8–10, Part III §§11–14, Part IV §§15–17, Part V §18, or Part VI §§19–20 clause body text was altered. Every edit within those Parts is one of the administrative corrections listed at §29 (a forward cross-reference to Part VII, a heading-note Part-list update, or a baseline-status-label correction) — no clause's operative rights, obligations, or classifications were changed.

## 31. Part VIII undrafted verification

Confirmed: no clause text was added under §26/§27 (Part VIII). The instrument's §0.1 Part VIII heading is unchanged in substance (only the surrounding Part VII heading note above it was corrected). The new "End of Part VII" boundary text states expressly that Part VIII remains headings and placeholders only and that no clause text should be inferred for it from Part VII's treatment of adjacent topics.

## 32. CI-01/CI-05 state

Unchanged. CI-01 (operator legal identity) and CI-05 (reacceptance-on-Terms-change engineering implementation decision, now confirmed to cover both the mechanism and the refusal/non-acceptance consequence) remain the only two open Controlled Inputs. No new Controlled Input was created by this task.

## 33. New CI assessment

None warranted. Every genuinely open Part VII item is either independently omittable (arbitration procedural mechanics; notice deemed-receipt/channel specifics; language-version conflict), ordinary bounded legal-drafting judgment (assignment, severability, entire agreement, survival, force-majeure scope), or already covered by CI-05 (reacceptance mechanism and refusal/non-acceptance consequence) — consistent with the readiness report's own item 43 conclusion, which this task's drafting did not depart from.

## 34. DEC-LEGAL-002 state

`OPEN_LEGAL`, unchanged.

## 35. Terms configuration state

`NOT CONFIGURED` (`platformConfig/businessTerms`), unchanged.

## 36. Capability 3 state

Open — engineering work packages complete; blocked on governed Terms-content configuration (`CDR-001` §5), unchanged.

## 37. Files modified

1. `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` — Part VII (§§21–25) clause text added; administrative corrections per §29 above.
2. `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-drafting-traceability-matrix-2026-08-30.md` — Part VII clause-level traceability rows added; Part VII narrative note added.
3. `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md` — Part VII review section added (no new Controlled Input); CI-05 marker-location/description updated to add §22.4; Part VII boundary-discipline paragraph added.
4. `docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-007-drafting-report-2026-09-02.md` — this file (new).
5. `docs/00-governance/documentation-changes-log.md` — Entry 140 added.

No other file touched. No `DEC-LEGAL-002-BT-PART-VII-READINESS-001-assessment-report-2026-09-02.md` change (historical evidence, left unedited). No Decision Register change. No Founder Legal Architecture Disposition Record change.

## 38. Diff summary

Core instrument file: +5 new Section 21–25 subsections with full clause text (§21.1–§21.8, §22.1–§22.5, §23.1–§23.3, §24.1–§24.4, §25.1–§25.6); document-header/version-metadata update; ~14 administrative label/cross-reference corrections within Parts I–VI (no clause-body substantive change). Traceability Matrix: +30 new clause rows (§21.1–§25.6) plus a Part VII narrative note. Controlled Inputs Register: +1 new "Part VII review" section (no new CI); CI-05 row updated; Part VII boundary-discipline paragraph added. Two new files created (this report; changes-log entry).

## 39. Commands executed

`git fetch origin`; `git log origin/main --oneline`; `git checkout -b docs/dec-legal-002-bt-draft-007 origin/main`; `git status`; `gh pr view 211 --json mergeCommit,mergedAt`; direct file reads (`Read`) of the core instrument, readiness assessment report, Controlled Inputs Register, Traceability Matrix, Founder Legal Architecture Disposition Record, Decision Register (via `grep`); direct file edits (`Edit`) to the three companion documents; `grep`-based prohibited-concept searches over the drafted Part VII text.

## 40. Dependencies/config changes

None.

## 41. Application/source changes

NONE.

## 42. Checks/CI result

Not yet run — PR not yet opened at the time of this report's drafting. To be run and reported once the PR is opened (Markdown-link/CI checks per repository convention).

## 43. Automated review status/findings

Not yet run — pending PR creation and the established automated (Codex) review.

## 44. Risks

If a future Part VIII drafting task treats §21.8's or §23.1's forward references as having already drafted jurisdictional-overlay or privacy-framework content, it would exceed this task's own scope boundary — neither reference drafts any part of a future §26/§27. If a future correction pass resolves CI-05 inside §22 without a proper governed engineering/Founder decision, it would silently invent the exact lifecycle/access consequence this task's §22.4 expressly declines to state. If a future task treats §25.4's narrow force-majeure standard as extending to commercial hardship, it would contradict this task's own express drafting constraint and the underlying `DEC-LOY-011`/FD-2 authority.

## 45. Rollback instructions

Revert this task's commit(s) / close the resulting PR without merging; the five files listed at §37 are the only ones touched, so rollback is a straightforward multi-file revert of a single feature branch.

## 46. Changes-log entry

Entry 140, `docs/00-governance/documentation-changes-log.md`.

## 47. Drafting report path

`docs/05-implementation/reports/DEC-LEGAL-002-BT-DRAFT-007-drafting-report-2026-09-02.md` (this file).

## 48. Commit SHA

Recorded in the completion message after commit.

## 49. PR number/state

To be opened following this commit. Not self-merged.

## 50. Exact Founder next action

Review Part VII (§§21–25) clause text against `DEC-LEGAL-002-BT-PART-VII-READINESS-001-assessment-report-2026-09-02.md`'s items 49–50 (exact drafting-ready scope / exact prohibited content) and this report; if satisfied, approve Part VII as a controlled drafting baseline (consistent with the Parts I–VI precedent) and, separately, consider authorizing a future Part VIII (Jurisdictional Overlays) drafting-readiness assessment. Allow the established automated Codex review on the resulting PR. Do not merge without Founder review.

---

## FINAL GATE

`PART VII §§21–25 DRAFTED WITHIN APPROVED AUTHORITY — READY FOR FOUNDER REVIEW`
