> **Title:** DEC-LEGAL-002 Post-Legal-Review Resolution Assessment
> **Version:** 2.0 (2026-08-29 — updated per LEG-FD-14/15, task `DEC-LEGAL-002-FOUNDER-CLOSE-001`) · **Status:** Assessment record — recommends status treatment; does not itself change `DEC-LEGAL-002`'s Status field beyond the minimal `EXT-LEG-002` update this assessment justifies
> **Governing document:** [Decision Register](../decision-register.md) `DEC-LEGAL-002`; [External Dependencies Register](../external-dependencies-register.md) `EXT-LEG-002`
> **Task:** `DEC-LEGAL-002-LEGAL-OPINION-RECON-001` (v1.0); `DEC-LEGAL-002-FOUNDER-CLOSE-001` (v2.0 — continuation, not a restart)
> **Companion documents:** [Reconciliation Matrix](DEC-LEGAL-002-LEGAL-OPINION-RECON-001-reconciliation-matrix-2026-08-29.md); [Founder Legal Architecture Disposition Record](DEC-LEGAL-002-LEGAL-OPINION-RECON-001-founder-legal-architecture-dispositions-2026-08-29.md)
> **v2.0 summary:** LEG-FD-14 (B2B dispute resolution — Kigali/KIAC arbitration) and LEG-FD-15 (liability architecture — 12-month-fees Business cap; "maximum extent permitted by applicable law" customer standard) resolve the two items §2/§3 of this assessment's v1.0 had identified as outstanding. Core Business Terms drafting readiness is now 16/16 sections at the architecture/decision level. This does **not** change `DEC-LEGAL-002`'s Status, `EXT-LEG-002`'s status, or Capability 3's status — see §§2, 6, 8 below (all preserved/updated, none closed).

## 1. Can `EXT-LEG-002` be marked completed/satisfied?

**Yes, partially — recommended update: `PENDING` → `EVIDENCE_RECEIVED`.**

The External Dependencies Register's own governing text for `EXT-LEG-002` and the Legal Counsel Handoff Pack's own Post-Counsel Resolution Sequence (§10, step 2) both already specify this exact transition: "Answers are filed as the `EXT-LEG-002` evidence record..., moving it from `PENDING` toward `EVIDENCE_RECEIVED`." Counsel has now answered the full 20-question set; the answer is filed verbatim as evidence (see the External Legal Opinion evidence record). This is the minimal, already-authorized status update contemplated by existing governance — not a new criterion invented by this task.

`EVIDENCE_RECEIVED` is not `CLOSED`. The register's status vocabulary reserves `CLOSED` for evidence that has fully resolved the underlying question with no further action pending; here, the Founder has qualified or declined several of counsel's specific recommendations (Reconciliation Matrix rows classified E/F), and at least one item (dispute forum/seat/rules) remains a genuinely open question counsel's opinion did not resolve to Founder satisfaction (the opinion offered a recommendation, but the Founder has not selected among it or alternatives — see §3 below). `EVIDENCE_RECEIVED` accurately reflects "evidence obtained, reviewed, partially accepted with qualification" without overstating closure.

**Action taken:** [External Dependencies Register](../external-dependencies-register.md) `EXT-LEG-002` row updated: Status `PENDING` → `EVIDENCE_RECEIVED`; Evidence location column populated with links to the three evidence documents from this task.

## 2. Is `DEC-LEGAL-002` itself ready for Founder resolution, or do specific controlled questions remain?

**`DEC-LEGAL-002` Decision Register `Status` field remains unchanged (`OPEN_LEGAL`)** — consistent with the task's own instruction not to flip it to resolved merely because Founder legal-architecture positions now exist, and consistent with the existing precedent in this register (FD-1 was recorded via a `Notes` update without changing `Status`). **This is unchanged by `DEC-LEGAL-002-FOUNDER-CLOSE-001`** — resolving the remaining architecture decisions (item 1 below, now closed by LEG-FD-14/15) makes drafting possible; it does not itself constitute the "governance criteria" this repository's convention would require to actually resolve/close `DEC-LEGAL-002` (that requires drafted, Founder-approved, configured Terms — see §6).

What **is** now settled, via LEG-FD-01–15 plus the already-CONFIRMED FD-1–FD-7/`DEC-LOY-011`, is the full set of Founder product/legal-architecture positions needed to describe *what* the Core Business Terms must say on every one of its 16 sections (§3) — including, as of this update, dispute resolution and liability.

**(v1.0) What was previously identified as genuinely open, and its current status:**

1. ~~**Dispute-resolution forum, seat, and rules**~~ — **RESOLVED by `LEG-FD-14` (2026-08-29):** good-faith resolution → mediation where appropriate → binding KIAC arbitration, seat Kigali Rwanda, English or French, for Business↔Platform disputes; jurisdictional overlays may modify where mandatory law requires; customer-side arbitration not imposed. This was the single clearest remaining Founder decision identified in v1.0 of this assessment; it is now closed.
2. **Whether a future 11thONUS minimum-standard numeric value should exist** for programme-change notice, suspension notice/cure periods, or exit run-off length (Reconciliation Matrix rows 6, 7, 18) — still open, still non-blocking. LEG-FD-05/06/07 deliberately leave these as "reasonable notice"/case-dependent rather than fixed, per LEG-FD-01's fallback principle; no further decision is *required* to begin drafting.
3. ~~**Liability cap figures**~~ — **RESOLVED by `LEG-FD-15` (2026-08-29):** Business cap = 12-month fees paid (no invented zero-fee figure); customer standard = "maximum extent permitted by applicable law," no nominal fixed amount. This was the second item identified in v1.0; it is now closed at the architecture level (the exact zero-fee-Business treatment remains a future drafting/commercial-governance question, non-blocking — see §9/§10 below).
4. **The reacceptance-on-Terms-change engineering decision** (Reconciliation Matrix row 15) — still open, still non-blocking for drafting. A documentation/decision gap, not a Terms-drafting blocker: Terms language describing the reacceptance *principle* is draftable now; the corresponding implementation decision needs its own future governed item before that specific engineering work is authorized.

None of items 2 and 4 blocks Core Business Terms drafting from starting, because each can be expressed in principle-based Terms language now (per LEG-FD-01's fallback standard) without a numeric value. Items 1 and 3 were the two items that, in v1.0, this assessment found could not be so expressed without inventing an answer the task's own governing instructions withheld authority to invent — both are now resolved by Founder disposition (LEG-FD-14/LEG-FD-15), not by this assessment inventing anything.

## 3. Are the Core Business Terms ready to enter drafting?

**Yes — ready for controlled drafting at the architecture/decision level, 16 of 16 sections**, following LEG-FD-14 (Disputes/corrections) and LEG-FD-15 (Liability). See the [Terms Instrument Architecture / Drafting Readiness Note](DEC-LEGAL-002-LEGAL-OPINION-RECON-001-terms-drafting-readiness-2026-08-29.md) (v2.0) for the section-by-section readiness table.

This is an architecture/decision-level readiness conclusion, precisely bounded: it means every section of the Core Business Terms now has a governed Founder position sufficient to draft from. It does **not** mean any Terms clause has been written, that any Terms text is legally approved, that a Terms version has been configured, or that `DEC-LEGAL-002` itself is resolved — see §6 and §8 below for why those remain distinct, unchanged questions.

## 4. Should Customer Terms be a separate work package?

**Yes** — determined in LEG-FD-10. Customer Terms are architecturally and legally distinct from Business Terms (different relationship basis, per LEG-FD-09's correction of the opinion's "data as consideration" framing; different governing-law/forum profile per the opinion's own §12/§13/§17 tables; no current engineering acceptance mechanism exists for them, unlike Business Terms). Recording this now avoids Customer Terms being silently folded into the Business Terms drafting effort or silently dropped.

## 5. Do Customer Terms block Capability 3?

**No** — determined in LEG-FD-10, verified by direct code inspection. `functions/src/domains/business/services/businessLifecycleCommand.ts`'s `assertCurrentBusinessTermsAccepted` gates `submitBusinessForVerification` on a **Business** Terms acceptance only; no Customer Terms acceptance gate exists anywhere in the current onboarding flow. `CDR-001` §5's own Capability 3 status text ("blocked on governed Terms-content configuration (`DEC-LEGAL-002`)") already refers to the Business Terms component specifically (per FD-1's re-prioritisation). This reconciliation does not expand that blocker to include Customer Terms.

## 6. What exact legal/governance dependency still prevents configuration of a governed Business Terms version?

**As of `DEC-LEGAL-002-FOUNDER-CLOSE-001`, only one dependency remains, and it is a drafting/execution step, not an open architecture question:**

Actual Terms content drafting and Founder approval. This reconciliation (v1.0 and v2.0 together) authorizes the *architecture and positions* the Terms must express across all 16 Business Terms sections — it does not draft, approve, or configure any Terms text or version identifier itself. Per the existing Resolution Plan (Legal Counsel Handoff Pack §10, steps 5–8), drafting, Founder approval, version-identifier assignment/configuration, and end-to-end verification remain future, separately-authorized steps. The two architecture-level dependencies v1.0 of this assessment identified (dispute forum/seat/rules; liability caps) are now resolved by LEG-FD-14/15 and no longer block this step.

**`DEC-LEGAL-002`'s Decision Register `Status` remains `OPEN_LEGAL`.** This repository's own governance convention (confirmed by the FD-1 precedent, and by this task's explicit instruction) requires actual governance criteria — not merely "drafting can now begin" — before a decision's Status field is changed. The governing criteria for closing/resolving `DEC-LEGAL-002` are, per the existing Resolution Plan, actual Terms content being drafted and Founder-approved (Resolution Plan step 5) and a governed Terms version being configured and end-to-end-verified (steps 6–7) — none of which this task performs. This assessment does not guess a different status treatment; it recommends `OPEN_LEGAL` remain in place through drafting and final approval, consistent with the task's own expected conceptual distinction.

## 7. Recommended Notes-field update to `DEC-LEGAL-002` (Decision Register)

A `Notes`-field addendum (not a `Status` change) is recorded on the `DEC-LEGAL-002` entry, following the same pattern already used for the FD-1 update: summarising that LEG-FD-14/15 now resolve the two items the prior addendum had flagged as outstanding, that Core Business Terms drafting readiness is now 16/16 at the architecture/decision level, and that `DEC-LEGAL-002`'s `Status` remains `OPEN_LEGAL` pending actual Terms drafting, Founder approval, and version configuration. See the applied diff in [`decision-register.md`](../decision-register.md).

## 8. Status reassessment (`DEC-LEGAL-002-FOUNDER-CLOSE-001`)

Four items reassessed, each preserving the conceptual distinction the task requires:

- **`EXT-LEG-002`:** unchanged — `EVIDENCE_RECEIVED` (external legal evidence received and reviewed; not `CLOSED`, since Founder qualification/non-adoption of specific recommendations is recorded in the Reconciliation Matrix, and receiving evidence is a distinct fact from resolving the underlying decision).
- **`DEC-LEGAL-002`:** unchanged — `OPEN_LEGAL`. Readiness to draft is not, by itself, a governance criterion for closing a Decision Register entry; this repository's convention (and this task's explicit instruction) requires the decision to remain open through drafting and final Founder approval. Not guessed differently.
- **Capability 3:** unchanged — `Open — engineering work packages complete; blocked on governed Terms-content configuration (DEC-LEGAL-002)` (per `CDR-001` §5, itself unmodified by this task). Resolving the Founder architecture that Terms drafting needs does not itself unblock Capability 3; only an actual configured, effective Business Terms version does that. Capability 3 remains, in the sense the task's own language uses, **in progress**.
- **Terms configuration:** unchanged — **NOT CONFIGURED.** No Terms version identifier exists in `platformConfig/businessTerms` or anywhere else; `assertCurrentBusinessTermsAccepted` continues to fail closed. This task neither reads nor writes any Firebase/application configuration.

## 9. Zero-fee Business liability treatment

LEG-FD-15 deliberately does not invent a substitute monetary cap for a Business that has paid 11thONUS no fees in the preceding 12 months (a strict fees-paid formula would otherwise yield a cap of zero). This is recorded as an open drafting/commercial-governance question — potentially engaging the still-unresolved `DEC-SUB-013` (Complimentary/free plans policy) — not resolved, narrowed, or estimated by this assessment. It does not block drafting the Liability section's general architecture (the 12-month-fees formula itself, and the customer-side "maximum extent permitted by applicable law" standard, are both draftable now); it blocks only the specific zero-fee edge case, which the actual Terms drafting stage may handle with an explicit carve-out, a deferral to future commercial governance, or another mechanism — the Founder's or Terms-drafter's choice at that later stage, not decided here.

## 10. Customer Terms boundary (reaffirmed)

Unchanged from `DEC-LEGAL-002-LEGAL-OPINION-RECON-001` (LEG-FD-10): Customer Terms remain a separate future governed legal-instrument work package, distinct from Core Business Terms, and remain confirmed **not** a Capability 3 blocker. Nothing in LEG-FD-14/15 or this update touches that determination — LEG-FD-14's arbitration architecture applies only to Business↔Platform disputes, not Customer↔Platform or Customer↔Business disputes, which retain LEG-FD-11/LEG-FD-12's existing local-court/complaint-mechanism principle. Customer Terms are not drafted by this task.
