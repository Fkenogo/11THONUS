> **Title:** DEC-LEGAL-002 Post-Legal-Review Resolution Assessment
> **Version:** 1.0 · **Status:** Assessment record, 2026-08-29 — recommends status treatment; does not itself change `DEC-LEGAL-002`'s Status field beyond the minimal `EXT-LEG-002` update this assessment justifies
> **Governing document:** [Decision Register](../decision-register.md) `DEC-LEGAL-002`; [External Dependencies Register](../external-dependencies-register.md) `EXT-LEG-002`
> **Task:** `DEC-LEGAL-002-LEGAL-OPINION-RECON-001`
> **Companion documents:** [Reconciliation Matrix](DEC-LEGAL-002-LEGAL-OPINION-RECON-001-reconciliation-matrix-2026-08-29.md); [Founder Legal Architecture Disposition Record](DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md)

## 1. Can `EXT-LEG-002` be marked completed/satisfied?

**Yes, partially — recommended update: `PENDING` → `EVIDENCE_RECEIVED`.**

The External Dependencies Register's own governing text for `EXT-LEG-002` and the Legal Counsel Handoff Pack's own Post-Counsel Resolution Sequence (§10, step 2) both already specify this exact transition: "Answers are filed as the `EXT-LEG-002` evidence record..., moving it from `PENDING` toward `EVIDENCE_RECEIVED`." Counsel has now answered the full 20-question set; the answer is filed verbatim as evidence (see the External Legal Opinion evidence record). This is the minimal, already-authorized status update contemplated by existing governance — not a new criterion invented by this task.

`EVIDENCE_RECEIVED` is not `CLOSED`. The register's status vocabulary reserves `CLOSED` for evidence that has fully resolved the underlying question with no further action pending; here, the Founder has qualified or declined several of counsel's specific recommendations (Reconciliation Matrix rows classified E/F), and at least one item (dispute forum/seat/rules) remains a genuinely open question counsel's opinion did not resolve to Founder satisfaction (the opinion offered a recommendation, but the Founder has not selected among it or alternatives — see §3 below). `EVIDENCE_RECEIVED` accurately reflects "evidence obtained, reviewed, partially accepted with qualification" without overstating closure.

**Action taken:** [External Dependencies Register](../external-dependencies-register.md) `EXT-LEG-002` row updated: Status `PENDING` → `EVIDENCE_RECEIVED`; Evidence location column populated with links to the three evidence documents from this task.

## 2. Is `DEC-LEGAL-002` itself ready for Founder resolution, or do specific controlled questions remain?

**Specific controlled questions remain. `DEC-LEGAL-002` Decision Register `Status` field is left unchanged (`OPEN_LEGAL`)** — consistent with the task's own instruction not to flip it to resolved merely because counsel responded, and consistent with the existing precedent in this register (FD-1 was recorded via a `Notes` update without changing `Status`).

What **is** now settled, via LEG-FD-01–13 plus the already-CONFIRMED FD-1–FD-7/`DEC-LOY-011`, is the full set of Founder product/legal-architecture positions needed to describe *what* the Core Business Terms must say on: platform–business relationship characterisation; reward-obligation survival through suspension/exit; reward monetary characterisation; programme-change treatment; suspension process (principle-level); complaint handling; Terms-change/reacceptance principle; and the differentiated-instrument architecture (Business Terms / Customer Terms / Reward Program Rules / jurisdictional overlays).

What remains genuinely open, not resolved by existing authority plus the LEG-FD dispositions:

1. **Dispute-resolution forum, seat, and rules** (Reconciliation Matrix rows 8/13). The task's own instruction (§13/LEG-FD-11) explicitly withholds authority to invent this — "treat exact forum mechanics as legal drafting/jurisdictional implementation detail requiring appropriate authority." Counsel recommended Kigali/KIAC arbitration for B2B and Bujumbura courts/CNCP for B2C, but the Founder has not selected among that recommendation or an alternative. This is the single clearest remaining Founder decision.
2. **Whether a future 11thONUS minimum-standard numeric value should exist** for programme-change notice, suspension notice/cure periods, or exit run-off length (Reconciliation Matrix rows 6, 7, 18) — LEG-FD-05/06/07 deliberately leave these as "reasonable notice"/case-dependent rather than fixed, per LEG-FD-01's fallback principle; no further decision is *required* to begin drafting (principle-based language is draftable now), but the Founder may wish to set a future minimum standard, which is a separate, non-blocking future decision.
3. **Liability cap figures** (Reconciliation Matrix row 9) — genuinely open per the Legal Counsel Handoff Pack's own §5 ("No liability exclusion, allocation, or limitation is proposed anywhere in this pack... fully open"); this reconciliation does not narrow that.
4. **The reacceptance-on-Terms-change engineering decision** (Reconciliation Matrix row 15) — a documentation/decision gap, not a Terms-drafting blocker: Terms language describing the reacceptance *principle* is draftable now; the corresponding implementation decision (what happens to an already-accepted Business when a new Terms version is published) needs its own future governed item before that specific engineering work is authorized.

None of items 2–4 blocks Core Business Terms drafting from starting, because each can be expressed in principle-based Terms language now (per LEG-FD-01's fallback standard) without a numeric value. Item 1 is different in kind: a disputes clause cannot be meaningfully drafted without knowing whether it is an arbitration clause or a court-jurisdiction clause, and the task's own governing instruction prohibits inventing that answer here.

## 3. Are the Core Business Terms ready to enter drafting?

**Ready for controlled drafting of every section except the disputes/dispute-resolution section**, which requires the Founder decision identified in §2 item 1 first. See the [Terms Instrument Architecture / Drafting Readiness Note](DEC-LEGAL-002-LEGAL-OPINION-RECON-001-terms-drafting-readiness-2026-08-29.md) for the section-by-section readiness table.

Because the disputes section is a required section of any complete Business Terms document (not a severable optional clause), and because a document cannot be responsibly represented as "ready for controlled drafting" while one of its mandatory sections has no governed direction at all, this assessment's overall conclusion is that **Founder decisions remain before Terms drafting can begin in full** — see §7 (Gate) below. This is a narrower and more precise finding than "nothing is ready": the vast majority of Business Terms content is fully positioned; one specific, previously-flagged decision remains outstanding.

## 4. Should Customer Terms be a separate work package?

**Yes** — determined in LEG-FD-10. Customer Terms are architecturally and legally distinct from Business Terms (different relationship basis, per LEG-FD-09's correction of the opinion's "data as consideration" framing; different governing-law/forum profile per the opinion's own §12/§13/§17 tables; no current engineering acceptance mechanism exists for them, unlike Business Terms). Recording this now avoids Customer Terms being silently folded into the Business Terms drafting effort or silently dropped.

## 5. Do Customer Terms block Capability 3?

**No** — determined in LEG-FD-10, verified by direct code inspection. `functions/src/domains/business/services/businessLifecycleCommand.ts`'s `assertCurrentBusinessTermsAccepted` gates `submitBusinessForVerification` on a **Business** Terms acceptance only; no Customer Terms acceptance gate exists anywhere in the current onboarding flow. `CDR-001` §5's own Capability 3 status text ("blocked on governed Terms-content configuration (`DEC-LEGAL-002`)") already refers to the Business Terms component specifically (per FD-1's re-prioritisation). This reconciliation does not expand that blocker to include Customer Terms.

## 6. What exact legal/governance dependency still prevents configuration of a governed Business Terms version?

Two dependencies, in sequence:

1. **The disputes-clause forum/seat/rules Founder decision** (§2 item 1) — needed before the Business Terms document can be completed in full (though most sections can be drafted in parallel).
2. **Actual Terms content drafting and Founder approval** — this reconciliation authorizes the *architecture and positions* the Terms must express; it does not draft, approve, or configure any Terms text or version identifier itself. Per the existing Resolution Plan (Legal Counsel Handoff Pack §10, steps 5–8), drafting, Founder approval, version-identifier assignment/configuration, and end-to-end verification remain future, separately-authorized steps.

`DEC-LEGAL-002`'s Decision Register `Status` should, in the Founder's own judgment, most likely remain `OPEN_LEGAL` until the disputes-clause decision is made and actual Terms content is approved — this assessment recommends that treatment but leaves the final call to the Founder, consistent with the task's instruction not to guess on ambiguous status treatment.

## 7. Recommended Notes-field update to `DEC-LEGAL-002` (Decision Register)

A `Notes`-field addendum (not a `Status` change) is recorded on the `DEC-LEGAL-002` entry, following the same pattern already used for the FD-1 update: summarising that the external Legal Opinion has been received, reconciled (LEG-FD-01–13), and partially adopted/partially qualified per the Reconciliation Matrix, that `EXT-LEG-002` has moved to `EVIDENCE_RECEIVED`, and that one concrete Founder decision (dispute-resolution forum/seat/rules) remains before Core Business Terms drafting can proceed to completion. See the applied diff in [`decision-register.md`](../decision-register.md).
