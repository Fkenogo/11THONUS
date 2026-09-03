> **Title:** Core Business Terms §§1–27 — Whole-Instrument Reconciliation and Finalization Readiness Assessment
> **Version:** 1.0 (2026-09-03) · **Status:** Working (governance record — read-only assessment) · **Classification:** Working (governance record)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LEGAL-002` (Status: `OPEN_LEGAL`, unchanged by this report)
> **Task:** `DEC-LEGAL-002-BT-WHOLE-RECON-001`
> **Governs:** assessment only — no edit to [Core Business Terms — Draft](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-core-business-terms-draft-2026-08-30.md)

# Assessment strategy (stated before any inspection concluded)

This is a read-only reconciliation, not a drafting task. The goal is to read §§1–27 as one contract and classify every remaining open item into exactly one of three practical classes — **A** (blocks final Core Terms approval), **B** (blocks configuration/launch for a specific jurisdiction/flow, not Core approval), or **C** (legitimate future/triggered reservation, blocks neither) — then chart a finite path from the current state to Capability 3 closure. Method: (1) verify the entry gate directly from `origin/main`; (2) diff-verify that no later commit materially changed §§1–27 beyond the status-label reconciliations already recorded; (3) re-read the full instrument and its governing reports for internal consistency; (4) cross-check every open Decision Register item against the instrument's own treatment of it; (5) classify; (6) chart the finalization path. No clause text is edited.

# 1. Entry repository state

Primary worktree (`/Volumes/PRODUCTION/Projects/11THONUS`, branch `docs/dec-legal-002-bt-draft-007`) inspected read-only only (`git status --short`) to confirm its unrelated uncommitted `FD-COM-001` work remains untouched — confirmed present, unaltered, never stashed/reset/committed. All assessment work performed in a fresh isolated worktree.

# 2. Isolated worktree / base SHA

`git worktree add /Volumes/PRODUCTION/Projects/11THONUS-worktrees/dec-legal-002-bt-whole-recon-001 -b docs/dec-legal-002-bt-whole-recon-001 origin/main`. Base SHA: `962bc1e1efa4bd2e5dcd8307b96dd2c4a43d2dd2` (= `origin/main` HEAD = the PR #219 merge commit).

# Entry gate verification

- PR #219 merge commit `962bc1e1efa4bd2e5dcd8307b96dd2c4a43d2dd2` confirmed at `origin/main` HEAD.
- Instrument Map row A confirmed: *"Parts I–VIII are each a Founder-approved controlled drafting baseline. This does not mean the complete Business Terms are finally approved, effective, or configured."*
- Document-level `Status:` banner confirmed unchanged: `DRAFT — NOT APPROVED — NOT EFFECTIVE — NOT CONFIGURED`.
- `DEC-LEGAL-002` confirmed `OPEN_LEGAL` (Decision Register, and restated in the instrument's own Status Reaffirmation and DRAFT banner).
- CI-01 confirmed `OPEN` (Controlled Inputs Register — "Required before Founder approval" / "Required before legal approval").
- CI-05 confirmed `OPEN` (Controlled Inputs Register — "Required before Terms configuration").
- Terms configuration confirmed `NOT CONFIGURED` (instrument DRAFT banner and Status Reaffirmation).
- Capability 3 confirmed `Open — engineering work packages complete; blocked on governed Terms-content configuration (DEC-LEGAL-002, OPEN_LEGAL)` (`CDR-001-capability-delivery-roadmap.md` §2 row 3, `[UPDATED 2026-08-29]`).
- No later commit has materially changed §§1–27: confirmed by targeted grep across the whole instrument for stale "not drafted in this task" / "remains headings" markers (only one match — an accurate End-of-Part-VIII narrative statement, not a stale artifact) and by earlier direct diffs (in the DRAFT-008/CLOSE-001 tasks) confirming Parts I–VII clause bodies are byte-for-byte unchanged since their respective merges except two cosmetic §21 cross-reference updates.

**All entry-gate conditions hold. Proceeding.**

# 3. Sources inspected (this session, cumulative across the whole task chain)

Full living Core Business Terms instrument (§§1–27, all headers, Part 0, Status Reaffirmation); Drafting Traceability Matrix (all Part I–VIII rows and narrative self-reviews); Controlled Inputs Register (all rows, all per-Part review narratives, classification key); all Part I–VIII drafting/correction/closure reports (`DEC-LEGAL-002-BT-DRAFT-001` through `-008`, all `-CORR-*`/`-CLOSE-*`); the Part V, VI, VII, VIII readiness/authority/boundary reports (`PART-V-READINESS-001`, `PART-VI-AUTH-001`, `PART-VII-READINESS-001` + corrections, `PART-VIII-READINESS-001` + corrections/closure, `PART-VIII-JUR-VERIFY-001` + correction, `PART-VIII-DRAFT-BOUNDARY-001`); `decision-register.md` (`DEC-LEGAL-002` entry, all `DEC-SUB-*`, `DEC-ID-005`, `DEC-LOY-009`, `DEC-PROD-004` entries — read from the correct isolated worktree, see note below); the Founder Legal Architecture Disposition Record (LEG-FD-01–16); the Legal Counsel Handoff Pack (FD-1–FD-7); `DEC-LOY-011`; `CDR-001-capability-delivery-roadmap.md` (Capability 3 status and history); `eng-p3-002-closure-001-capability-3-readiness-report-2026-08-29.md` (the exact engineering-side closure condition). External Legal Opinion **not** read directly — only its already-reconciled positions (LEG-FD-*) were used, per instruction.

**Note on a data-integrity check performed:** an initial Decision Register lookup was accidentally run against the *primary* worktree's relative path, which surfaced `DEC-SUB-014`/`FD-COM-001` (an uncommitted, unrelated Founder commercial-model decision sitting only in the primary worktree's working tree). This was immediately caught, discarded, and re-verified against the correct isolated worktree (`origin/main`), which confirmed `DEC-SUB-014` **does not exist on `origin/main`** — it is exclusively unmerged `FD-COM-001` work-in-progress, out of scope for this task and not part of "the actual merged repository sources." It is not referenced further in this report and did not inform any classification below.

# 4. Reconciliation methodology

Read §§1–27 sequentially as a single contract (not eight independent Parts); cross-checked every forward/backward `§N` reference for resolution; grepped for internal-governance vocabulary (`CI-01`, `CI-05`, `D-classified`, `Category R/F`, task IDs) inside operative clause text (§1.1–§27.9) versus the governance apparatus (Part 0, Status Reaffirmation) where such vocabulary is expected and appropriate; cross-checked every open Decision Register item cited anywhere in the instrument against that item's current Decision Register status; applied the task's A/B/C framework, deferring to already-governed classifications (e.g., the Part VIII drafting-boundary report's own Launch-Blocker/Reservation/Future-Triggered triage) rather than re-deriving legal conclusions from scratch, consistent with the instruction not to perform new legal research or resolve any reservation.

# 5. Whole-instrument integrity findings

**BLOCKING:** one — see §6.
**NON-BLOCKING:** three — see §7.
**NO FINDING** (checked, clean): defined-term consistency; internal cross-references (all resolve); duplicated/conflicting obligations (none found — the drafting discipline of cross-referencing rather than restating was applied consistently across all eight Parts, confirmed in the Traceability Matrix's per-Part self-review notes); governing-law/arbitration coherence; acceptance/reacceptance coherence; suspension/exit/reward-survival consistency; Business/customer/platform role separation; liability/indemnity structural alignment; privacy/data boundary; notices; force majeure; survival; commercial/subscription boundary; jurisdiction-overlay architecture; portability beyond Rwanda/Burundi (§27.4 explicitly forecloses treating Rwanda/Burundi as the platform's geographic definition, and requires a fresh §26 assessment — completed before operating there — for any future jurisdiction); undefined capitalized terms (spot-checked "Reward Program," "Business Owner," "Authorized Representative," "Accepting Individual" — all defined at first use, used consistently); circular references (none).

# 6. Exact BLOCKING findings

**BLOCKING-1 — Preamble operator-identity placeholder.** The Preamble contains a literal `[CONTROLLED INPUT REQUIRED: operator's registered legal name, registration/company number, and registered address — ...]` bracket in place of naming 11thONUS as a contracting party. This is not itself a drafting defect — it is a known, deliberately marked gap (CI-01) — but it means the document **as currently written cannot be approved as a complete governed Terms version**, because a contract preamble that does not name one of its two parties is not complete contractual text, independent of any policy question. This is the one respect in which the instrument is not yet finalization-ready. Resolving it requires no clause redrafting — only inserting the three named values once supplied (Founder + legal counsel, per the Controlled Inputs Register). See §9 (CI-01 classification) for the full analysis.

# 7. Exact NON-BLOCKING findings

**NON-BLOCKING-1 — §25.6/§27.8(b) relationship could be made explicit.** §25.6 (Language of the Agreement) leaves open, as a general Core-level reservation, which language version controls in an English/French conflict. §27.8(b) separately reserves whether Burundi mandatory law imposes a controlling-text rule for a Burundi-specific addendum. These are two distinct, correctly layered questions (general Core reservation vs. jurisdiction-specific mandatory-law question) under the two-layer architecture — not a duplication or contradiction — but a reader could momentarily wonder whether they are the same open point. A future correction task could add a one-clause cross-reference at §25.6 pointing to §27.8(b) for clarity. Not required before final approval.

**NON-BLOCKING-2 — Jurisdiction-overlay status labels not added to §2 Definitions.** §27.2's five status labels ("Established Mandatory Overlay," etc.) are self-contained, bolded, and used consistently only within §27 — they function correctly without a formal §2 definition, but a maximally polished final instrument might add them to the definitions list for internal-drafting-convention consistency with the rest of the document. Cosmetic only.

**NON-BLOCKING-3 — §19.2 zero-fee-Business liability cap gap has a live, not merely theoretical, dependency.** §19.2 leaves open what the 12-months-fees liability cap produces for a Business that has paid no fees — an explicit, LEG-FD-15-authorized non-resolution. Because `DEC-SUB-013` (complimentary/free plans policy) and the general possibility of pilot/free-tier Businesses remain genuinely open (`OPEN_FOUNDER`), this gap is not purely theoretical: if 11thONUS onboards a zero-fee Business under a *configured* Terms version before this is resolved, that Business's liability-cap outcome is genuinely undefined. This does not block *Core Terms approval* (the clause is coherent, bounded, and Founder-authorized as written) but is a live operational question the Founder should have in view before *launch* if any free/pilot Business participation is planned at that time — see §13 classification below (classified B, conditionally).

# 8. A/B/C classification table — every remaining open issue

| Item | Class | Basis |
|---|---|---|
| CI-01 (operator legal identity) | **A** | Blocks final Terms approval/issuance — see §9 |
| CI-05 (reacceptance-on-change mechanism) | **B** | Blocks Terms *configuration for a second version*, not first-issuance or Core approval — see §10 |
| §27.8(a) Burundi dispute forum | **C** | Governed drafting-boundary report found 0 Launch Blockers; reservable with its own trigger |
| §27.8(b) Burundi controlling-language point | **C** | Same basis |
| §27.8(c) Rwanda notices | **C** | Same basis |
| §27.8(d) Burundi notices | **C** | Same basis |
| §27.8(e) Burundi liability-cap enforceability | **C** | Same basis |
| §27.8(f) Burundi indemnity enforceability | **C** | Same basis |
| §27.8(g) Rwanda operator/Business disclosure beyond §27.5 | **C** | Same basis |
| §27.8(h) Rwanda general provisions | **C** | Same basis |
| §27.8(i) Burundi general provisions | **C** | Same basis |
| §27.9 Rwanda commercial/subscription | **C** | Explicitly future-triggered on FD-7 commercial activation |
| §27.9 Burundi commercial/subscription | **C** | Same basis |
| `DEC-SUB-001`/`002`/`003`/`008`/`009`/`010`/`013` (open) | **C** | §18.6 states a valid bounded non-resolution; Terms complete without them |
| `DEC-ID-005` (owner-initiated self-suspension) | **C** | §15.7/§16.8 explicit non-resolution; platform-initiated suspension fully drafted |
| `DEC-LOY-009` (reward quantity/coexistence) | **C** | §13.7 explicit non-resolution; earned-reward-survival principle stated without it |
| §19.2 zero-fee liability-cap gap | **B** (conditional) | Not a Core-approval blocker; becomes a live launch concern only if a zero-fee/pilot Business is onboarded before resolution — see §7, NON-BLOCKING-3 |
| §20.3 six omitted indemnity procedural mechanics | **C** | Independently omittable (Classification D per Part VI authority report); ordinary bounded drafting judgment |

No item required a fourth category.

# 9. CI-01 classification and rationale

**Class A — final Terms approval blocker**, per the Controlled Inputs Register's own pre-existing classification ("Required before Founder approval" **and** "Required before legal approval" — not merely "before Terms configuration"). Distinguishing the two framings the task asks for:

- **Can the Core contract be finalized (approved as complete governed text) without inserting the values?** No. Unlike every other reservation in the instrument (each of which is a deliberate, self-contained non-resolution stated in complete sentences — e.g., §19.2, §22.4, §27.8), the Preamble's gap is a literal missing party name, not a reserved architectural point. A Terms document that does not name one of its two contracting parties is not complete contractual text capable of Founder/legal sign-off as a finished instrument, regardless of policy questions.
- **Can a final/effective version be issued or shown to a Business without the values?** Also no — and for this item the two questions collapse into one: resolving CI-01 is a precondition for *both* approval and issuance, not a two-stage gate. There is no intermediate state where the Terms are "approved" with the placeholder still present.

# 10. CI-05 classification and rationale

**Class B — configuration/launch blocker, not a Core drafting blocker.** Distinguishing the two framings:

- **Can the contract be finalized with the current §22 language?** Yes. §22.4 already states a complete, legally coherent, deliberately bounded non-resolution — it asserts nothing it does not need to assert for a *first* Terms version to be issued and accepted. This is the same technique the instrument uses throughout (§13.7, §15.7/§16.8, §18.6, §19.2/§20.3, §21.5, §27.8) and it is finalization-ready as written.
- **Does product configuration/engineering need a governed decision before Terms can be configured/used?** Only for a *future Terms change* — not for the first version. CI-05's own scope, as defined in the Controlled Inputs Register, is "what technically happens when an *already-accepted* Business faces a *new* Terms version." By definition this has no live referent until a second version exists. **This is a material finding for the finalization path (§33 below): CI-05 does not block issuing/configuring the very first Terms version at all — it only needs to be resolved before 11thONUS ever issues a *second* Terms version that requires reacceptance.**

# 11. Nine §27.8 item classifications

All nine = **Class C**. See the table at §8. Basis, stated once (identical for all nine): the governing `DEC-LEGAL-002-BT-PART-VIII-DRAFT-BOUNDARY-001` report already ran the exact triage this task's A/B/C framework calls for — applying a governed ten-question test to all eleven then-D-classified sub-rows, it found **0 Category L (Launch Blocker)** and 9 Category R (Drafting Reservation), each explicitly found to rest on no established mandatory requirement and each reservable "without overclaiming." Layered on top of that finding, every relevant Core clause already carries a general mandatory-law carve-out (§19.4, §21.1(b), §25.2, §26.7) that would give effect to any actually-applicable Rwandan/Burundian mandatory rule regardless of whether a bespoke overlay has been drafted for it — so absence of a drafted overlay does not create unenforceability risk in the interim. This task did not re-derive that conclusion; it applied the already-governed one to the new A/B/C vocabulary.

# 12. Two §27.9 item classifications

Both = **Class C**. Textbook future-triggered reservations: explicitly gated on activation of a paid subscription mechanism, new pricing architecture, billing cycles, late fees, refunds, or auto-renewal for Rwanda/Burundi Businesses (FD-7). No commercial mechanism is currently active for any jurisdiction, so neither trigger condition exists today.

# 13. Open `DEC-SUB-*` classification

`DEC-SUB-001`, `-002`, `-003`, `-008`, `-009`, `-010`, `-013` (all `OPEN_FOUNDER` on `origin/main`, confirmed) = **Class C**, per §18.6's own explicit, already-governed non-resolution: "becomes binding on a Business only where separately governed, applicable to that Business, and communicated to it." §18 is fully draftable and complete without any of them; none is required to state the fee-conditionality, payer-boundary, plan-capacity, or suspension-cross-reference principles that make up §18's actual content. The one item warranting a qualifier is `DEC-SUB-013` specifically (see §7, NON-BLOCKING-3, and the §19.2 row of the table at §8) — not because §18 itself is incomplete, but because its interaction with §19.2's liability-cap gap becomes operationally live the moment a real zero-fee Business exists.

# 14. `DEC-ID-005` classification

**Class C.** `OPEN_FOUNDER`, confirmed unchanged on `origin/main`. §15.7/§16.8 state an explicit, deliberate non-resolution (owner-initiated self-suspension is not addressed; 11thONUS-initiated suspension/restriction is fully drafted and complete). The Terms do not need this resolved to state a coherent suspension/exit regime; it is a dormant optional-future-feature question, not a blocker.

# 15. `DEC-LOY-009` classification

**Class C.** `OPEN_FOUNDER`, confirmed unchanged on `origin/main`. §13.7 states an explicit non-resolution (reward quantity at creation; multiple-unredeemed-reward coexistence). The earned-reward-survival principle (§13.1–§13.4) does not depend on either answer.

# 16. Any other open decision materially affecting Terms finalization

None found beyond those already listed. `DEC-PROD-004`, `DEC-SUB-004`, `DEC-SUB-006`, `DEC-SUB-007` are all `CONFIRMED` and already correctly stated (without numeric values) in §18.3. `DEC-LOY-011` is `CONFIRMED` and correctly stated throughout Parts III/IV/V. LEG-FD-01–16 are all `APPROVED`/recorded and correctly reflected. `EXT-LEG-002` is `EVIDENCE_RECEIVED` (external-dependency tracking only, not a Terms blocker).

# 17. Defined-term / cross-reference findings

No finding. Every `§N`/`§N.M` cross-reference in the instrument resolves to an existing clause (verified by section-number-range grep, highest reference §27.9, no orphan or forward reference to an undrafted section). Every capitalized defined term ("Business," "Customer," "Terms," "Reward Program," "Accepting Individual," "Business Owner," "Authorized Representative," "Staff") is defined at or before first substantive use and used consistently across all eight Parts, including Part VIII (verified: §26/§27 use "Business," "jurisdiction," and "overlay" consistently with their §2/§3.3 meanings; no new undefined capitalized term introduced).

# 18. Business/customer/platform role-boundary findings

No finding. §3–§6 (Part I) establish the boundary; §11 (Part III) restates it as the Reward Program responsibility clause without contradiction; §27.5 (the one established Burundi overlay) explicitly cross-references §6/§11 for its role-separation disclosure component rather than restating the boundary. No clause anywhere makes 11thONUS a guarantor, funder, fulfiller, merchant, or adjudicator of a Business's Reward Program — confirmed consistent from §4.2/§11.3 through §13.1/§17.2/§19.5.

# 19. Reward-obligation consistency findings

No finding. The earned-reward-survival chain (§13.1–§13.4 → restated/cross-referenced at §14.2, §15.4–§15.5, §16.3, §18.5, §25.4) is internally consistent throughout, including through Part VIII: neither §26 nor §27 touches reward obligations at all (confirmed by direct text search — no reward-related overlay item was drafted or reserved).

# 20. Suspension/exit findings

No finding. §15 (suspension) / §16 (exit) consistently distinguish platform-initiated action (fully drafted) from the explicitly reserved `DEC-ID-005` owner-initiated question, and consistently preserve default-redeemable-during-suspension (`DEC-LOY-011`) without exception drift into Part VIII.

# 21. Liability/indemnity findings

No finding, with the one live-dependency note already flagged at §7/§13 (the §19.2 zero-fee gap). §19/§20's structure is otherwise internally coherent and consistently cross-referenced at §27.6/§27.7 (Rwanda liability/indemnity enforceability verified, no additional overlay) and §27.8(e)/(f) (the same two questions reserved for Burundi specifically, not duplicated).

# 22. Governing law/arbitration findings

No finding. §21.1 (Rwanda law, LEG-FD-16) and §21.3–§21.6 (Kigali/KIAC arbitration, LEG-FD-14) are stated as two distinct authorities, exactly as those two Founder dispositions require, and both cross-reference §26/§27 for jurisdiction-specific variation without asserting or foreclosing any content for it. §27.8(a) reserves the one live jurisdiction-specific dispute-forum question (Burundi) without contradicting §21.

# 23. Privacy/data findings

No finding. §23 remains a pure cross-reference with no substantive privacy content, exactly as LEG-FD-09/LEG-FD-10 require; §27.5's Burundi disclosure item identifies a data-processing disclosure *requirement* without stating substantive privacy obligations, preserving the same boundary.

# 24. Notices / language / force-majeure / survival findings

No finding beyond NON-BLOCKING-1 (§25.6/§27.8(b) relationship, cosmetic). §24 (notices), §25.4 (force majeure), and §25.5 (survival) are each internally coherent and each has its jurisdiction-specific residual question correctly reserved at §27.8 rather than answered or contradicted at the Core level.

# 25. Jurisdiction-portability findings

No finding. §27.4 (as corrected in `DEC-LEGAL-002-BT-DRAFT-008-CORR-001`) explicitly requires a fresh §26 assessment, completed before 11thONUS operates in any new jurisdiction, and explicitly forecloses reading Rwanda/Burundi as the platform's geographic definition or generalizing either jurisdiction's finding to the other or to any third jurisdiction. The architecture is genuinely extensible to a future Kenya/Uganda/Tanzania assessment without amending §26 itself — confirmed structurally sound; no jurisdiction beyond Rwanda/Burundi was researched or should be, per this task's own scope.

# 26. Matters that must be resolved before final Terms approval

Exactly one: **CI-01** (operator legal identity — Preamble). Nothing else.

# 27. Matters that only block Rwanda/Burundi launch/configuration

**CI-05**, conditionally, for any *second* Terms version only (not the first). **The §19.2 zero-fee liability-cap gap**, conditionally, only if a zero-fee/pilot Business is expected to be onboarded under a configured Terms version. No §27.8/§27.9 item independently blocks Rwanda/Burundi launch (all Class C, per §11–12).

# 28. Matters legitimately future-triggered (Class C, block neither)

All nine §27.8 items; both §27.9 items; `DEC-SUB-001`/`-002`/`-003`/`-008`/`-009`/`-010`/`-013`; `DEC-ID-005`; `DEC-LOY-009`; §20.3's six omitted indemnity procedural mechanics.

# 29. Is the complete §§1–27 instrument currently suitable for final legal/Founder approval?

**Not yet — for exactly one reason: CI-01.** Structurally, the instrument is sound: internally consistent, no broken cross-reference, no contradictory clause, no duplicated obligation, no jurisdiction-portability defect, no undefined term. The sole blocker to approving it as a *complete* governed Terms version is the unresolved operator-identity Preamble gap.

# 30. If not, exact correction task(s) required

One narrowly-scoped future task, **not performed here**: once the Founder confirms the operating legal entity (name, registration/company number, registered address) and legal counsel confirms it is correctly named/registered for Rwanda (and, in due course, Burundi), a bounded drafting task inserts those three values into the Preamble in place of the `[CONTROLLED INPUT REQUIRED: ...]` bracket, removes the bracket, and records CI-01 as resolved in the Controlled Inputs Register. No other clause requires correction as a precondition for approval. The two NON-BLOCKING cosmetic items (§7) may optionally be folded into the same task at the Founder's discretion, but neither is required.

# 31. Whether further external counsel review is required, and why

**Not required as a precondition to approving the Core Terms text itself.** Every substantive provision already traces to reconciled LEG-FD authority or an explicit, bounded non-resolution; no clause proposes new legal content requiring fresh counsel sign-off. External counsel input **will** be relevant again at two later points, both already anticipated by the existing architecture and not blocking Core approval: (a) resolving individual §27.8 reservations as their specific triggers occur (each reservation's trigger, by its own terms, is "identification of a primary [jurisdiction] legal authority" — inherently a legal-research step); (b) confirming CI-01's operator-entity registration is correct for the jurisdiction(s) of operation (the Controlled Inputs Register already assigns this to legal counsel jointly with the Founder).

# 32. Whether `DEC-LEGAL-002` can close after corrections/inputs, or requires another policy decision

**No further policy decision is required.** `DEC-LEGAL-002`'s own Decision Register scope ("Reward Program terms, business obligation to honour rewards, dispute language, platform liability, subscription terms") is already fully addressed at the architecture/drafting level by Parts I–VIII. Per this repository's own stated closure convention (recorded directly in the Decision Register's `DEC-LEGAL-002` narrative): *"closure requires actual Terms content drafted and Founder-approved, and a governed Terms version configured and verified... none of which [readiness/architecture work] performs."* That drafting is now done (Parts I–VIII, Founder-approved baselines); what remains is exactly: CI-01 resolution → final approval → version/effective-date assignment → configuration → verification (steps 33–36 below) — not a new substantive policy question.

# 33. Proposed finite path to an approved Terms version

1. Founder supplies the operator's registered legal name, registration/company number, and registered address (resolves CI-01).
2. Legal counsel confirms the entity is correctly named/registered for Rwanda (CI-01's second, independent condition).
3. A bounded drafting task (§30) inserts the three values into the Preamble, removes the bracket, updates the Controlled Inputs Register.
4. Founder gives final approval of the complete §§1–27 instrument as an approved Terms version (a single sign-off event — Parts I–VIII are already individually Founder-approved baselines; this step approves the assembled whole).
5. `DEC-LEGAL-002` is recorded `CLOSED`/equivalent terminal status in the Decision Register, citing the approved Terms version.

# 34. Proposed finite path from approved Terms version to Terms configuration

6. The approved instrument is assigned a version identifier and an effective date (a governance/administrative action, not further drafting).
7. An engineering/configuration task writes the approved, versioned Terms content into `platformConfig/businessTerms`, per the existing `assertCurrentBusinessTermsAccepted`/`acceptBusinessTerms`/`submitBusinessForVerification` gate contract (`ENG-P3-002A`) — no new engineering build is required; this gate already exists and is already the sole remaining dependency per the `ENG-P3-002-CLOSURE-001` readiness report.

**Note on CI-05:** step 7 does not require CI-05 resolved — CI-05 only becomes a precondition the first time a *second* Terms version requiring reacceptance is issued. It should be resolved before that event, not before this one.

**Note on §19.2/DEC-SUB-013:** if any zero-fee/pilot Business participation is planned as part of the launch configured in step 7, the Founder should resolve or explicitly risk-accept the §19.2 gap before that configuration goes live for such Businesses.

# 35. Proposed final onboarding acceptance verification

8. A live (or emulator-realistic) verification that a real Business account can: reach `pending_verification` by successfully calling `acceptBusinessTerms` against the now-configured Terms version, then `submitBusinessForVerification` without the fail-closed Terms-gate rejection currently observed (per the `ENG-P3-002-CLOSURE-001` report's own disclosed evidence, `07-business-terms-unavailable-*.png`). This single end-to-end test is the concrete technical closure evidence Capability 3 has been waiting on since that report.

# 36. Proposed Capability 3 closure condition

9. Capability 3 closes when: (a) `platformConfig/businessTerms` holds the approved, versioned Terms content; (b) the step-8 end-to-end onboarding-acceptance verification passes; and (c) `DEC-LEGAL-002` is recorded closed. No further engineering work package is required — `CDR-001` already records every named Capability-3 work package (`ENG-P2-002`, `ENG-P2-003`, `ENG-P2-004`, `ENG-P3-001`, `ENG-P3-002`) as `Complete`/`Closed`, with `ENG-P3-003` (Knowledge Studio) separately non-blocking per `DEC-CKS-002`.

# 37. Files modified

- `docs/05-implementation/reports/DEC-LEGAL-002-BT-WHOLE-RECON-001-whole-instrument-reconciliation-report-2026-09-03.md` (this file, created)
- `docs/00-governance/documentation-changes-log.md` (new entry, per repository convention)

No edit to the living Core Business Terms instrument, the Drafting Traceability Matrix, or the Controlled Inputs Register — none required a change; this is a pure assessment.

# 38. Diff summary

One new report file (~13KB) plus one documentation-changes-log entry. No other file touched.

# 39. Commands executed

`git fetch origin`; `git log origin/main`; `gh pr view 219 --json state,mergeCommit`; `git status --short` (primary worktree, read-only); `git worktree add ... origin/main`; targeted `grep`/`awk` sweeps across the living instrument for stale markers, internal-vocabulary leakage, and section-reference ranges; `grep`/`sed` lookups against `decision-register.md` and `CDR-001-capability-delivery-roadmap.md` (isolated worktree only, after discarding one accidental primary-worktree lookup); file write via the editing toolchain.

# 40–42. Dependencies added / configuration changes / application-source changes

None. Pure read-only assessment, docs-only report.

# 43. External research performed

None. Only already-reconciled, already-merged repository authority (LEG-FD-*, Decision Register, prior drafting-boundary/readiness/verification reports) was consulted. The external Legal Opinion itself was not read or cited directly.

# 44. Risks

Low. This is a read-only classification exercise. The one residual interpretive judgment call — classifying the nine §27.8 items and §19.2's dependency — is grounded in already-governed authority (the drafting-boundary report's own 0-Launch-Blocker finding; the Controlled Inputs Register's own CI-01/CI-05 classification key) rather than new legal analysis, minimizing the risk of a mischaracterization the Founder would need to correct.

# 45. Rollback instructions

None needed — no substantive change was made to any governed document. If the report itself needs revision, edit or supersede this file; no other rollback step applies.

# 46. Markdown report path

`docs/05-implementation/reports/DEC-LEGAL-002-BT-WHOLE-RECON-001-whole-instrument-reconciliation-report-2026-09-03.md`

# 47. Persistent `.md` changes-log entry

`docs/00-governance/documentation-changes-log.md`, new entry (see PR).

# 48. Commit SHA / PR / CI / review state

To be recorded once this branch's PR is opened and CI/review complete (see accompanying task actions). Not self-merged.

# 49. Founder next action

Decide whether to proceed with the finite path at §§33–36: supply the operator legal identity (CI-01), authorize the bounded Preamble-insertion drafting task, and give final approval of the assembled §§1–27 instrument as an approved Terms version — at which point `DEC-LEGAL-002` can close and the existing, already-complete engineering configuration/verification steps (§34–36) can proceed without further Terms drafting.

---

**Gate:** `CORE BUSINESS TERMS WHOLE-INSTRUMENT RECONCILIATION COMPLETE — FINALIZATION BLOCKERS CLASSIFIED — FINITE PATH TO APPROVED / CONFIGURED TERMS ESTABLISHED`
