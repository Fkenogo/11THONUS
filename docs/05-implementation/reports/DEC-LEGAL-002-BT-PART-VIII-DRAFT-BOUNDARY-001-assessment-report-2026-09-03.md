# DEC-LEGAL-002-BT-PART-VIII-DRAFT-BOUNDARY-001 — Drafting-Boundary Classification of the 11 Remaining D-Classified Jurisdiction Sub-Rows

> **Task:** `DEC-LEGAL-002-BT-PART-VIII-DRAFT-BOUNDARY-001` · **Date:** 3 September 2026 · **Performed by:** Claude (AI agent), per Founder task instruction
> **Scope:** Docs-only drafting-boundary assessment. Classifies each of the 11 remaining D-classified Rwanda/Burundi jurisdiction sub-rows (per the merged, CORR-001-corrected `DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001` report) as a Launch Blocker (L), Drafting Reservation (R), or Future/Triggered Verification (F). **No Part VIII clause text drafted. No jurisdiction overlay clause text drafted. No Terms configuration. No application/source/Firebase/config change. No self-merge. No new broad legal research performed.**

---

## 1. Entry repository state

Base worktree state confirmed clean at task start: `git status` → nothing to commit, working tree clean, on `origin/main` at the merge commit of PR #215. This isolated worktree never touched the primary worktree's unrelated `FD-COM-001` work (not stashed, reset, cleaned, reconciled, committed, amended, or branch-switched).

## 2. Base SHA

`92ff86b5d69c2fc9aeff445a64029ef205bd7084` (`origin/main` HEAD, PR #215's merge commit). Confirmed via `git rev-parse HEAD` and `git log -1 --format=%H origin/main` — identical, no drift.

## 3. PR #215 closure verification

Per the dispatching session's entry gate: PR #215 is **MERGED**. Reviewed head `149c6478f672bf8e70bf66a0814e0639884cfea9`; merge commit `92ff86b5d69c2fc9aeff445a64029ef205bd7084`. Independently corroborated by reading `docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-CORR-001-correction-report-2026-09-03.md` and the corrected jurisdiction-verification report, both of which state the same corrected 5-C/11-D matrix that this task's base assumes, and neither of which shows any unresolved standing review finding.

## 4. Post-merge CI verification

Per the entry gate: post-merge CI on `main` (run `33728220808`, workflow "Build, Lint, Test, Emulator Validation") completed successfully in 6m36s. Not independently re-run by this task (no code change was made that would invalidate it); accepted per the entry gate's own verification.

## 5. Isolation strategy

This task ran entirely inside the pre-provisioned isolated worktree at `/Volumes/PRODUCTION/Projects/11THONUS/.claude/worktrees/agent-a1760d986e876156d`, based off `origin/main` at the confirmed base SHA. A new branch, `docs/dec-legal-002-bt-part-viii-draft-boundary-001`, was created from that base. The primary worktree (which may still hold unrelated `FD-COM-001` uncommitted work) was never entered, read, or altered.

## 6. Governing-source inventory

Read directly for this task:
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-legal-source-evidence-pack-2026-09-02.md`
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-CORR-001-correction-report-2026-09-03.md`
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-jurisdiction-verification-report-2026-09-02.md` (the corrected 16-sub-row matrix at §15, and the 13-topic overlay matrix at §12A of the readiness assessment below)
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VIII-READINESS-001-CLOSE-001-closure-report-2026-09-02.md`
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VIII-READINESS-001-assessment-report-2026-09-02.md` (per-topic clause-dependency mapping at §§12A–23, used to identify each D row's exact Core Terms section)
- `docs/00-governance/decisions/decision-register.md` (confirmed `DEC-LEGAL-002 = OPEN_LEGAL`; CI-01/CI-05 the only open Controlled Inputs; LEG-FD-01–16 and FD-1–7 present and unchanged)
- `docs/00-governance/canonical-reference.md`
- `docs/00-governance/documentation-changes-log.md` (Entries 143–147, confirming the drafting history culminating in the corrected 16-sub-row matrix)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md` (the living Core Business Terms instrument, amended in place through DRAFT-002…007; §3.3's two-layer architecture; the "End of Part VII" Part VIII placeholder statement)

No file in this list was modified by this task. No Core Business Terms clause text, Controlled Inputs Register, Drafting Traceability Matrix, or Decision Register entry was touched.

## 7. Confirmed current governance state (no discrepancy found)

- `DEC-LEGAL-002` = `OPEN_LEGAL` (unchanged).
- Terms configuration = `NOT CONFIGURED` (unchanged).
- Capability 3 = Open/In Progress (unchanged).
- CI-01 = `OPEN` (unchanged) — global Preamble gap (operator legal name/company number/registered address); does not block drafting per Parts I–VII precedent.
- CI-05 = `OPEN` (unchanged) — §22.4 reacceptance-failure consequence; unrelated to this task's 11 rows.
- Parts I–VII = drafted, Founder-approved controlled-drafting baseline (unchanged by this task).
- Part VIII (§§26–27) = **UNDRAFTED** (unchanged by this task) — confirmed still only headings/placeholder text in the living Core Business Terms instrument.
- Jurisdiction-verification gate string (current, from the merged CORR-001 report): `PART VIII JURISDICTION VERIFICATION COMPLETE — BOUNDED DRAFTING READY WITH 11 EXPLICIT NON-RESOLUTIONS`.

All match the entry gate's stated expectations. No discrepancy found; proceeding as instructed.

## 8. The exact 11 remaining D sub-rows

Extracted verbatim from the corrected matrix at §15 (and cross-referenced against the 13-topic overlay matrix at §12A of the readiness assessment) of `DEC-LEGAL-002-BT-PART-VIII-JUR-VERIFY-001-jurisdiction-verification-report-2026-09-02.md`:

| # | Row | Topic | Jurisdiction | Current D rationale (verbatim basis) | Existing evidence position |
|---|---|---|---|---|---|
| 1 | Row 1 | Governing law / B2B dispute forum | Burundi | No Burundi domestic-forum-mandate source located; the External Legal Opinion only discretionarily *recommends allowing* a Burundi-courts option, not a named mandatory statute requiring one | `D — UNRESOLVED / no additional overlay requirement currently established`; OHADA non-membership removes one theoretical risk without resolving the row |
| 2 | Row 2 (residual) | Language (Business-Terms-specific controlling-text point, beyond the narrow B sub-element already satisfied) | Burundi | Not researched under CORR-001's narrow two-statute scope | `D — UNRESOLVED`; existing §25.6 English/French text already satisfies the Opinion's own Business Terms recommendation (narrow B sub-element); only a *further* mandatory-law point (e.g., French-as-controlling-text rule) remains open |
| 3 | Row 4 | Notices | Rwanda | Outside CORR-001's two named statutes; no dedicated LEG-FD item addresses notices for either jurisdiction | `D — UNRESOLVED / no additional overlay requirement currently established`; no fixed period/channel may be invented |
| 4 | Row 4 | Notices | Burundi | Burundi Code Civil was read only for Art. 45–47 (force majeure/damages); not searched for notice/service provisions | Same as above |
| 5 | Row 8 | Liability — B2B liability-cap enforceability | Burundi | Outside CORR-001's two named statutes; the Burundi Code Civil was read only for Art. 45–47 | `D — UNRESOLVED / no additional overlay requirement currently established`; does not resolve `DEC-SUB-013` (zero-fee cap), a separate Founder/commercial matter |
| 6 | Row 9 | Indemnity | Burundi | Outside CORR-001's two named statutes' portions actually read | `D — UNRESOLVED / no additional overlay requirement currently established` |
| 7 | Row 11 | Operator/business disclosures (beyond CI-01 itself) | Rwanda | No Rwanda-specific statutory disclosure regime evidenced; outside CORR-001's two named statutes | `D — UNRESOLVED / no additional overlay requirement currently established`; CI-01 remains a separate, unrelated, still-open global Preamble gap |
| 8 | Row 12 | Commercial / subscription | Rwanda | Outside CORR-001's two named statutes; independent of open `DEC-SUB-*` items | `D — UNRESOLVED / no additional overlay requirement currently established`; no commercial value invented |
| 9 | Row 12 | Commercial / subscription | Burundi | Same | Same |
| 10 | Row 13 | General provisions (assignment, severability, entire agreement, survival) | Rwanda | Codex P2 finding (readiness assessment CORR-001): original text classified C while its own authority column stated "no jurisdiction-specific authority found" — silence, not affirmative embodiment | `D — UNRESOLVED / no additional overlay requirement currently established`; may not be stated "no overlay required" in §27 |
| 11 | Row 13 | General provisions (assignment, severability, entire agreement, survival) | Burundi | Same | Same |

**Confirmation:** 11 rows exactly, matching §19 of the jurisdiction-verification report ("11 of 16 tested sub-rows... row 1 Burundi; row 2-residual Burundi; row 4 Rwanda; row 4 Burundi; row 8 Burundi; row 9 Burundi; row 11 Rwanda; row 12 Rwanda; row 12 Burundi; row 13 Rwanda; row 13 Burundi") and §37 of the CORR-001 correction report's risk section. No row was reconstructed from memory — all 11 were read directly from the merged report tables.

## 9. Assessment-test findings per row (summary; full ten-question test applied to each; results feed the matrix at §10)

For every row: (1) clause dependency identified below; (2)–(3) Burundi/Rwanda launch relevance assessed against whether the instrument's current drafted text (or its absence) creates a *material* risk as defined by the Category L test in §11 of the task instruction; (4) future-trigger relevance assessed against the nine defined Category F triggers; (5) no mandatory legal requirement was found established for any of the 11 rows (see §12 below); (6) the Core Terms can remain portable without resolving any of the 11 now — none of the 11 rows' underlying questions, if left unresolved, forces a change to the already-drafted, Founder-approved Parts I–VII text; (7) §27 can reserve each row without a false "no overlay required" statement, because none of the 11 is currently classified C or A; (8) triggers identified per row; (9)–(10) no Founder or legal/counsel action is required *now* for any row (legal/counsel verification is appropriately deferred, as itemized at §16–17 below).

## 10. Drafting-boundary matrix

| Row | Jurisdiction | Topic | Current status | Clause / Part VIII dependency | Launch relevance | Category | Reason | Re-verification trigger | Founder action now? |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Burundi | Governing law / B2B dispute forum | D | §21 (Governing Law and Dispute Resolution) | Burundi: theoretically relevant (Businesses onboard in Burundi), but no evidence any mandatory Burundi statute *compels* deviation from §21's already-valid Kigali/KIAC + Rwanda-substantive-law architecture — only a discretionary recommendation to *allow* a Burundi option exists. Rwanda: not relevant (Rwanda is §21's own default/home jurisdiction). | **R** | §21 is a Founder-approved, currently valid dispute-resolution mechanism; no mandatory requirement forces a different Burundi forum; §27 can index this as an explicit non-resolution without falsely certifying "no overlay required" | A repository-verified primary Burundi statute (not a discretionary Opinion recommendation) establishing a mandatory different forum for this instrument type | No |
| 2 (residual) | Burundi | Language (controlling-text point beyond the narrow B sub-element) | D | §25.6, §21.6, §24.3 | Relevant to Burundi launch in principle, but the narrow point already needed (English/French operative languages) is already satisfied (B); only a further, not-yet-evidenced mandatory point (e.g., a French-as-controlling-text rule specific to a Business Terms addendum) remains open | **R** | No mandatory further-language requirement established; existing §25.6 text already matches the Opinion's own Business Terms recommendation; reservable without false "no overlay required" claim | A repository-verified primary Burundi statute establishing a controlling-text rule specific to a Business Terms addendum (distinct from the Customer Terms L14 point, which is out of this instrument's scope) | No |
| 3 | Rwanda | Notices | D | §24 (Notices) | Generic procedural-notice uncertainty; §24 is already drafted under LEG-FD-01's cross-cutting fallback standard and LEG-FD-02's language architecture; no evidence any Rwandan procedural-law mandate is currently unmet | **R** | Per task §12 (generic notice/general-provisions guidance): §24 can be drafted conservatively now; no mandatory local requirement has been established; jurisdiction-specific treatment can remain explicitly reserved | A repository-verified primary Rwandan procedural-law source establishing a specific deemed-receipt/service/registered-address requirement | No |
| 4 | Burundi | Notices | D | §24 (Notices) | Same reasoning as row 3; Burundi Code Civil was read only for Art. 45–47, not for notice/service provisions | **R** | Same as row 3 | A repository-verified primary Burundian procedural-law source on notice/service mechanics | No |
| 5 | Burundi | Liability — B2B liability-cap enforceability | D | §19 (Liability) | The general non-excludable-liability *principle* is already C for both jurisdictions (LEG-FD-15, portable); only the narrower "does Burundi's unfair/unconscionable-terms doctrine affect B2B-cap enforceability" point is open, and no source suggests it currently does | **R** | §19's governed carve-out already tracks the substance of the only Burundi authority reviewed (Loi n° 1/11, consumer-scoped); no mandatory B2B-specific finding exists; does not touch the separate, Founder-owned `DEC-SUB-013` zero-fee-cap question | A repository-verified primary Burundi statute or court authority addressing B2B (not consumer) liability-cap enforceability specifically | No |
| 6 | Burundi | Indemnity | D | §20 (Indemnity) | §20's four-subject indemnity architecture is Founder-approved and portable; no Burundi authority (primary or secondary) was located suggesting it conflicts with any mandatory Burundi rule | **R** | No standalone Burundi "indemnity" doctrine was found even for Rwanda (where Art. 58–61 was read); nothing suggests Burundi differs; reservable without overclaiming | A repository-verified primary Burundi authority on indemnity-clause enforceability | No |
| 7 | Rwanda | Operator/business disclosures (beyond CI-01) | D | Preamble (adjacent to, but distinct from, CI-01) | Rwanda-specific: no statutory disclosure regime beyond generic LEG-FD-09/10 privacy-track content was evidenced; CI-01 itself (the global legal-name/company-number/address gap) is a separate, already-tracked, already-open item that did not block Parts I–VII drafting and does not block this assessment either | **R** | No mandatory Rwanda-specific disclosure-category finding exists to reserve as an overlay item (unlike Burundi row 11, which is already A); §27 can simply record "unresolved, no Rwanda-specific overlay established" | A repository-verified primary Rwandan statute imposing disclosure categories beyond what CI-01/the Preamble already anticipates | No |
| 8 | Rwanda | Commercial / subscription | D | §18 (as the Core Terms' current commercial-mechanics home; also touches then-undrafted subscription/billing mechanics generally) | Not currently relevant — 11thONUS has not activated paid subscriptions, billing cycles, late fees, refunds, or auto-renewal; FD-7 remains controlling and no commercial mechanism currently exists to which a jurisdiction question could attach | **F** | Per task §11: a D that only becomes relevant once a specific commercial mechanism (paid subscription, billing cycle, late-payment charge, refund, auto-renewal) is introduced is the expected home for Category F, not a current launch blocker | Activation of paid subscriptions / a new Business pricing architecture / introduction of billing cycles, late fees, refunds, or auto-renewal for Rwanda Businesses | No |
| 9 | Burundi | Commercial / subscription | D | §18 | Same reasoning as row 8, for Burundi | **F** | Same as row 8 | Same trigger, for Burundi Businesses | No |
| 10 | Rwanda | General provisions (assignment, severability, entire agreement, survival) | D | §25.1–25.3, §25.5 | §25's existing text is deliberately conservative, portable boilerplate (Founder-approved); the D classification exists because the record shows *silence* (no jurisdiction-specific authority found), not because any mandatory Rwandan requirement was identified | **R** | Per task §12 exactly: generic assignment/severability/entire-agreement/survival uncertainty should not automatically become a launch blocker; §25 can be drafted conservatively now (already is); no mandatory requirement established; explicit reservation avoids the "silence-as-C" error the readiness-assessment correction already flagged | A repository-verified primary Rwandan authority establishing a mandatory variation to any of these four sub-topics | No |
| 11 | Burundi | General provisions (assignment, severability, entire agreement, survival) | D | §25.1–25.3, §25.5 | Same reasoning as row 10, for Burundi | **R** | Same as row 10 | Same, for Burundi | No |

## 11. Category L (Launch Blocker) assignments

**None.** No row among the 11 satisfies the Category L test (§11 of the task instruction): none creates a material risk that the instrument lacks a mandatory clause, that the chosen clause architecture may be legally invalid, that the Business cannot validly accept the Terms, that the dispute/governing-law architecture may be unusable, that a mandatory disclosure is missing, that the Terms could materially misstate legal rights, or that launch would knowingly proceed without a required legal input. Every row's own evidence position, as recorded in the merged CORR-001 report, states only that *no additional mandatory requirement has been established* — none states that a mandatory requirement exists and remains unmet.

## 12. Category R (Drafting Reservation) assignments

**9 rows:** Row 1 (Burundi dispute forum); Row 2-residual (Burundi language); Row 4 Rwanda (notices); Row 4 Burundi (notices); Row 8 Burundi (liability cap); Row 9 Burundi (indemnity); Row 11 Rwanda (operator disclosure); Row 13 Rwanda (general provisions); Row 13 Burundi (general provisions). Each is currently relevant to at least one launch jurisdiction (or, for the Rwanda/Burundi split rows, both), can be drafted around conservatively using the already-governed Parts I–VII portable text, and can be indexed at §27 as an explicit unresolved reservation without any false "no overlay required" statement.

## 13. Category F (Future / Triggered Verification) assignments

**2 rows:** Row 12 Rwanda and Row 12 Burundi (commercial/subscription). Both are relevant only once a defined future commercial mechanism (paid subscription activation, new Business pricing architecture, billing cycles, late-payment charges, refunds, or auto-renewal) is introduced; FD-7 remains controlling and no such mechanism currently exists for either jurisdiction to attach to.

## 14–16. Category counts

- **Category L count: 0**
- **Category R count: 9**
- **Category F count: 2**

(0 + 9 + 2 = 11, matching the confirmed total at §8.)

## 17. Mandatory requirement already established among the 11 Ds

**None.** Every one of the 11 rows' own evidence position (§8, sourced verbatim from the merged report) states either "no additional overlay requirement currently established" or, for the two general-provisions rows, that the prior C classification rested on silence rather than affirmative mandatory-law embodiment. No row's current record shows an actually-established mandatory requirement that remains unmet.

## 18. Any accidental D→A/B/C issue found

**None.** Per task instruction §8, this assessment did not attempt to convert any D to A/B/C; on inspection, no rare case of direct verified authority being administratively misclassified as D was found among the 11. Every D row's evidence position is genuinely "not yet researched under the narrow CORR-001 scope" or "researched, no authority located" — not a case of overlooked existing evidence.

## 19. Founder decision required

**None.** Per task instruction §18: none of the 11 rows requires a new Founder policy decision. Rows 1, 4 (×2), 8 Burundi, 9 Burundi, 11 Rwanda, 13 (×2) are purely legal-verification questions (does a specific mandatory local-law point exist), not product-policy questions — existing LEG-FD items and `DEC-LOY-011` already settle the relevant Founder-owned policy content (governing law/arbitration architecture, non-excludable-liability carve-out, indemnity architecture, notice fallback standard, portable general-provisions boilerplate). Row 12 (×2) is safely reservable and its trigger is a future commercial activation, not a present Founder call.

`NO NEW FOUNDER POLICY DECISION REQUIRED FOR PART VIII DRAFTING BOUNDARY`

## 20. Legal/counsel verification required before drafting

**None required before §26/§27 index-level drafting can begin**, per the Part VIII drafting decision at §22 below. (Clause-level overlay content for any of the 9 Category R rows would require legal/counsel primary-source verification before *that specific overlay's substantive content* is drafted — but that is a future task, not a precondition for beginning bounded §26/§27 drafting itself.)

## 21. Legal/counsel verification deferred to launch (Category R, itemized)

The 9 Category R rows listed at §12, each with its specific re-verification trigger recorded in the matrix at §10 (a repository-verified primary-source finding for the specific jurisdiction/topic pair). None blocks initial Burundi/Rwanda launch under the current architecture; each is carried as an explicit §27 reservation.

## 22. Verification deferred to commercial trigger (Category F, itemized)

Row 12 Rwanda and Row 12 Burundi (commercial/subscription), deferred to: activation of paid subscriptions, a new Business pricing architecture, or introduction of billing cycles, late-payment charges, refunds, or auto-renewal — per task §11's Category F trigger list and §11 of the assessment instruction.

## 23. §26 drafting boundary

When controlled drafting of §26 (Jurisdictional Overlay Mechanism) is authorized, §26 may state only the architecture the already-drafted, Founder-approved Core Business Terms instrument itself establishes at §3.3: a **two-layer model** — Layer 1, the portable Core Business Terms, applicable to every jurisdiction by default; Layer 2, jurisdiction-specific overlays or addenda that supplement, not redefine, Layer 1, applied per-jurisdiction, triggered where mandatory **or appropriate** local law requires additional or different provisions (the exact §3.3 threshold — not a narrower mandatory-only threshold, and not an invented third layer). §26 may state that mandatory local law prevails over the portable core where genuinely non-waivable; that an overlay applies only to the jurisdiction it was verified for; that the *absence* of an overlay entry for a given topic/jurisdiction does not certify that no local requirement exists — only that none has yet been established; and that a new jurisdiction requires its own assessment before operational launch there. §26 may cross-reference LEG-FD-10's differentiated-instrument architecture (Core Business Terms / Customer Terms / Business Reward Program Rules / jurisdiction overlays, applied per-instrument) as a separate, non-layered governance concept. **This report does not draft §26's clause text** — it records only the permitted boundary within which a future drafting task may operate.

## 24. §27 index architecture

When controlled drafting of §27 (Overlay Index) is authorized, the index must be capable of distinguishing at least five status categories, applied per jurisdiction/topic pair:
1. **Established mandatory overlay** — a specific mandatory local-law requirement has been verified and stated (currently: none exists for either jurisdiction beyond row 11 Burundi, itemized separately).
2. **Established optional/appropriate overlay** — a non-mandatory but appropriate local provision has been verified and adopted (currently: row 2's narrow Burundi language sub-element, B-classified).
3. **Verified — no additional overlay required for the tested question** — the specific, narrow question was directly primary-text-verified and no additional or different provision beyond the portable core is needed (currently: rows 3, 6 (×2), 8 Rwanda, 9 Rwanda, all C-classified per the merged CORR-001 report; also rows 5, 7, 10 per the broader 13-topic matrix — suspension/exit, general liability principle, and privacy/data, all C).
4. **Unresolved/reserved jurisdiction issue** — the 9 Category R rows identified at §12, each carrying its specific re-verification trigger.
5. **Future-triggered verification** — the 2 Category F rows identified at §13, each carrying its specific commercial-activation trigger.
**This report does not draft §27's clause text or table** — it records only the permitted status-label architecture within which a future drafting task may operate.

## 25. Permitted jurisdiction status labels

Exactly the five labels enumerated at §24: *Established mandatory overlay*; *Established optional/appropriate overlay*; *Verified — no overlay required*; *Unresolved/reserved*; *Future-triggered*. No other label (e.g., a bare "N/A," a silent omission, or an unqualified "no overlay required" applied to any of the 11 D rows) is permitted, per the merged report's own express instruction that silence must never be presented as an affirmative C-equivalent finding.

## 26. §26/§27 drafting boundary — one further note

Neither §26 nor §27, when drafted, may state or imply that Burundi/Rwanda define the geographic scope of the Core Business Terms, and neither may generalize any Rwanda finding to Burundi or vice versa, or either finding to any third jurisdiction, without that third jurisdiction's own independent assessment (per §13B of the merged jurisdiction-verification report, itself preserved unchanged by this task).

## 27. Future African market entry process (reusable, recorded for extensibility — not itself executed)

Per task §17 and per §13B/§27 of the merged jurisdiction-verification report: **market-entry trigger** (a defined decision to launch in a new East African or wider African market) → **jurisdiction verification** (the same primary-source-first methodology already established and corrected through CORR-001) → **classify** each relevant topic as mandatory / optional-appropriate / core-sufficient (no overlay needed) / unresolved → **add an overlay/index entry** only where the classification requires it → **preserve the portable Core Terms** unchanged unless a genuine cross-jurisdiction pattern is separately, affirmatively found to warrant a portable-core amendment (not merely inferred from alignment across two jurisdictions, per the explicit prohibition already recorded in the merged report and reaffirmed at §26 above). This task did not perform any country-specific work for a market not currently being launched, and does not attempt geographic exhaustiveness — only extensibility of the mechanism.

## 28. Portability assessment

No finding in this task promotes any Rwanda or Burundi conclusion into the portable Core Business Terms. All 11 D rows remain jurisdiction-specific, unresolved questions; none is proposed for resolution by generalizing from the other jurisdiction, from a settled LEG-FD item, or from any secondary source. The Core Business Terms' own drafted text (Parts I–VII) is unchanged and unreferenced for edits by this task.

## 29. Confirmation — Rwanda/Burundi not treated as a product geographic limit

Confirmed. This task's own governing-source inventory (§6) and drafting-boundary matrix (§10) treat Rwanda and Burundi strictly as the two currently-launching jurisdictions being assessed under an architecture (§3.3's two-layer model) explicitly designed for indefinite future jurisdiction addition. No statement in this report defines 11thONUS's product scope by reference to these two jurisdictions.

## 30. Confirmation — no finding generalized as pan-African law

Confirmed. This task performed no new external legal research (per its own §9 instruction) and relied exclusively on the already-merged, already-corrected CORR-001 findings, which themselves explicitly record (§13B, §23, §26 of the jurisdiction-verification report) that the Rwanda/Burundi force-majeure alignment is two independently-sourced jurisdiction-specific conclusions, not evidence of a universal African rule. This task's own matrix (§10) and boundary notes (§26–27 above) preserve that same discipline for every one of the 11 rows.

## 31. Overall Part VIII drafting gate

`PART VIII CONTROLLED DRAFTING READY — 9 NON-RESOLUTIONS RESERVED / 2 FUTURE-TRIGGERED`

No Category L item exists (§11); the 9 Category R rows and 2 Category F rows can each be carried as an explicit, non-overclaiming reservation within the §26/§27 boundary defined at §23–26. Bounded index-level (not clause-level) drafting of §§26–27 may proceed once separately authorized — **this task does not itself draft that content.**

## 32. Exact blockers if any

**None.** No row is classified Category L. No Founder decision is required (§19). No legal/counsel verification is required *before* §26/§27 index-level drafting begins (§20) — the 9 Category R and 2 Category F items are each explicitly reservable, not blocking.

## 33. Files modified

- `docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VIII-DRAFT-BOUNDARY-001-assessment-report-2026-09-03.md` (this file, created)
- `docs/00-governance/documentation-changes-log.md` (Entry 148 appended)

No other file modified. No Core Business Terms clause text, Part VIII placeholder, Decision Register entry, Controlled Inputs Register entry, or Drafting Traceability Matrix entry touched.

## 34. Diff summary

One new report file added (this file); one new changes-log entry appended. No existing file rewritten in place.

## 35. Commands executed

`git log --oneline -20`; `git status`; `git branch -a`; `git rev-parse HEAD`; `git fetch origin main --quiet`; `git log -1 --format=%H origin/main`; `git checkout -b docs/dec-legal-002-bt-part-viii-draft-boundary-001`; `find docs -iname "*PART-VIII*" -o -iname "*core-business-terms*"`; `find docs -iname "*bt-draft*"`; `grep -rl "Core Business Terms" ...`; `grep -rl "§26\|§27\|Part VIII" ...`; `ls docs/00-governance/decisions/evidence/`; `git show --stat f94daa7`; `grep`/`awk` inspection of `decision-register.md` and `canonical-reference.md`; `grep -n "^## Entry" documentation-changes-log.md`; `Read` of all governing-source files listed at §6.

## 36. External research performed

**None.** Per task §9, no new external (web) legal research was performed. All findings are drawn exclusively from already-repository-resident, already-merged sources.

## 37. Dependencies added

**NONE.**

## 38. Config changes

**NONE.**

## 39. App/source changes

**NONE.**

## 40. CI/check result

To be recorded after this commit is pushed and the PR opened — see the task completion message for the exact head SHA and CI outcome.

## 41. Automated review state/findings

To be recorded after the PR is opened and the established automated (Codex) review runs — see the task completion message. If Codex review is unavailable due to quota, this will be recorded as "unavailable," not as a clean review, consistent with the precedent set in the CORR-001 correction report (§3).

## 42. Risks

- The 9 Category R rows remain genuinely unresolved; if a future task treats any of them as resolved to C/A without a primary-source verification matching the CORR-001 evidence threshold, it would repeat the exact evidence-threshold defect Founder review already caught and corrected once (row 3/8/9 in the original JUR-VERIFY-001 report).
- If a future §27 drafting task collapses the five permitted status labels (§25) into a simpler binary (e.g., "overlay" / "no overlay"), it would lose the distinction this task's boundary depends on between "verified no overlay required" and "unresolved" — silently reintroducing the silence-as-C error.
- If a future task treats the Category F classification for row 12 (×2) as permission to invent commercial mechanics (pricing, billing cycles, fees) in order to "resolve" the jurisdiction question, it would violate FD-7 and this task's own §11 boundary.
- This task's classifications rest entirely on the CORR-001 report's own evidence positions; if a future correction to that report changes any of the 11 rows' status, this task's matrix would need a corresponding correction pass.

## 43. Rollback instructions

Additive-only change: one new report file, one new changes-log entry, both on an isolated feature branch not yet merged to `main`. Rollback: close the PR without merging, or revert the branch's commit(s).

## 44. Markdown report path

`docs/05-implementation/reports/DEC-LEGAL-002-BT-PART-VIII-DRAFT-BOUNDARY-001-assessment-report-2026-09-03.md` (this file).

## 45. Documentation changes-log entry

Entry 148, `docs/00-governance/documentation-changes-log.md`.

## 46. Commit SHA

Recorded in the task completion message after `git commit`.

## 47. PR number/state

To be opened following this commit, against base `main`. Not self-merged — left open for Founder review.

## 48. Exact Founder next action

Review the drafting-boundary matrix (§10) and the overall gate (§31). No Founder policy decision is required by this task's findings (§19). The realistic next step is a Founder call on whether to authorize bounded §26/§27 **index-level** (not clause-level) drafting now, carrying the 9 Category R rows as explicit reservations and the 2 Category F rows as explicit future-triggered items, per the boundaries recorded at §23–25 — this task does not itself begin that drafting.

---

**STATUS PRESERVATION CONFIRMED:** `DEC-LEGAL-002 = OPEN_LEGAL` (unchanged). Terms configuration `NOT CONFIGURED` (unchanged). Capability 3 `Open`/`In Progress` (unchanged). CI-01 `OPEN` (unchanged). CI-05 `OPEN` (unchanged). Parts I–VII unchanged. LEG-FD-01–16 unchanged. Part VIII clause state `UNDRAFTED` (unchanged). Burundi/Rwanda confirmed as initial launch/test jurisdictions only, not the geographic definition of the product; future jurisdiction expansion remains overlay-driven (§27 above).

**FINAL BOUNDARY CONFIRMED:** No Part VIII clause text drafted. No jurisdiction overlay clause text drafted. No Terms configuration performed. No application/source/Firebase/config change. No self-merge. No new broad legal research performed.

`PART VIII CONTROLLED DRAFTING READY — 9 NON-RESOLUTIONS RESERVED / 2 FUTURE-TRIGGERED`
