> **Title:** DEC-LEGAL-002 Founder Decision Sheet
> **Version:** 3.0 · **Status:** FD-1–FD-7 dispositions recorded by the Founder (`DEC-LEGAL-002-FOUNDER-DISP-001`, 2026-08-29), plus the Founder's separate `DEC-LOY-011` resolution (same task, same date) — these are Founder product/commercial positions informing `DEC-LEGAL-002`, not legal conclusions. `DEC-LEGAL-002` itself remains OPEN_LEGAL. · **Classification:** Working (governance record — decision preparation)
> **Governing document:** [Decision Register](../decision-register.md)
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-founder-decision-sheet-2026-08-29.md`
> **Date:** 2026-08-29 (v1.0) · **Dispositions recorded:** 2026-08-29 (v2.0, `DEC-LEGAL-002-FOUNDER-DISP-001`) · **Updated:** 2026-08-29 (v3.0, same task — `DEC-LOY-011` resolution folded into FD-2/FD-4) · **Task:** `DEC-LEGAL-002-PREP-001` / `DEC-LEGAL-002-FOUNDER-DISP-001`

# DEC-LEGAL-002 Founder Decision Sheet

Originally: questions genuinely unresolved by existing authority that legal counsel cannot decide for the product — these are commercial/product choices, not legal ones. No already-confirmed decision was reopened.

**Update (v2.0):** the Founder has reviewed and dispositioned FD-1 through FD-7. Each disposition below is recorded exactly as authorized, in full — no disposition is reduced to a bare option letter where doing so would lose a stated qualification. **These dispositions are Founder product/commercial positions informing `DEC-LEGAL-002`; they are not legal conclusions, do not resolve `DEC-LEGAL-002`, do not close `EXT-LEG-002`, do not configure any Terms version, and do not authorize any application-code or UI change.**

## FD-1 — Reconcile DEC-LEGAL-002's governance phase with its actual blocking effect

**The tension:** the Decision Register, Decision Resolution Plan, Master Workflow, and Coding-Agent Prompt Register all place `DEC-LEGAL-002` at Phase 14/15 (pilot gate, Priority D3). The 2026-08-29 Capability 3 readiness report found, by direct code inspection, that it already hard-blocks Phase 3 today — no business can reach `pending_verification` without a governed Terms version. See [Product & Legal Decision Brief](DEC-LEGAL-002-PREP-001-product-legal-decision-brief-2026-08-29.md) §A.3.

**Not decided here.** Options for the Founder (with the Engineering Lead) to consider, not recommended: (a) treat this as evidence that `DEC-LEGAL-002` should be re-prioritised and pursued now, ahead of its originally-scoped phase; (b) accept that Capability 3 stays formally "Open — blocked" until Phase 14/15 by design, and no business goes live before then regardless; (c) some other reconciliation of the register's "Required by" field. This sheet does not recommend an option — see the [Resolution Plan](DEC-LEGAL-002-PREP-001-resolution-plan-2026-08-29.md) for the sequence once a direction is chosen.

> ### FOUNDER DISPOSITION (recorded 2026-08-29, `DEC-LEGAL-002-FOUNDER-DISP-001`) — APPROVED — RE-PRIORITISE THE REQUIRED BUSINESS TERMS COMPONENT NOW
>
> The Business Terms component of `DEC-LEGAL-002` is an immediate Capability 3 dependency and shall be resolved now. The broader legal/pilot gate represented by `DEC-LEGAL-002` may retain later-stage legal obligations where applicable, but no Business may submit for verification without accepting the current governed Business Terms. The existing fail-closed implementation remains correct and must not be weakened to accommodate the earlier governance sequencing. Governance is reconciled (see the [Decision Register](../decision-register.md) `DEC-LEGAL-002` entry, `Required by`/`Notes` fields, updated 2026-08-29) so that the Business Terms dependency is no longer represented solely as a Phase 14/15 matter. **This does not automatically bring every other Phase 14/15 legal activity forward into Capability 3** — e.g., `DEC-LEGAL-001` (privacy), `DEC-LEGAL-003` (e-billing), `DEC-LEGAL-005` (minimum age), `DEC-LEGAL-006` (cross-border hosting, separately progressed via `MTAIP-001`) retain their own, unchanged timing.
>
> Product/commercial position only — not a legal conclusion. `DEC-LEGAL-002` remains OPEN_LEGAL pending legal counsel review.

## FD-2 — Business obligation to honour earned rewards during suspension (relates to `DEC-LOY-011`, now CONFIRMED — see update below)

**The gap:** `DEC-LOY-011` already asks this exact product question and is separately open. TRD17 §17.19–17.20 draws a distinction between platform access and "the business's obligation to honour earned rewards," and notes customer trust favors preservation — but this is a design leaning, not a Founder decision. See [Business Obligation Matrix](DEC-LEGAL-002-PREP-001-business-obligation-matrix-2026-08-29.md) "Honouring valid rewards."

**Why it matters to DEC-LEGAL-002:** the legal Terms cannot state a business's duty to honour rewards until the Founder has taken a product position on when that duty applies (throughout suspension, grace-period only, subject to review, or not until reactivation — the four options `DEC-LOY-011`'s own text lists).

**Recommendation:** resolve `DEC-LOY-011` and `DEC-LEGAL-002`'s "honouring rewards" scope together, not independently — a Terms clause drafted before `DEC-LOY-011` is settled would either contradict it or force a second Terms revision.

> ### FOUNDER DISPOSITION (recorded 2026-08-29, `DEC-LEGAL-002-FOUNDER-DISP-001`) — APPROVED — SUSPENSION DOES NOT AUTOMATICALLY EXTINGUISH VALIDLY EARNED REWARDS
>
> Suspension of a participating Business does not, by itself, extinguish rewards validly earned by customers before suspension. 11thONUS may stop or restrict new loyalty activity, new earning and/or new programme participation during suspension. Existing earned customer rewards remain obligations of the participating Business, subject to the applicable Reward Program terms and any circumstances where fulfilment is legally impossible or legal counsel advises that different treatment is required.
>
> **Not recorded:** an unconditional Founder decision that redemption must always continue normally through the platform throughout suspension. The product principle being approved is preservation of the earned obligation. **Left to legal counsel:** the appropriate redemption mechanism during suspension, legally permissible exceptions, fulfilment requirements, and remedies.
>
> This informs, but did not at the time itself resolve, the separate `DEC-LOY-011` (then OPEN_FOUNDER) Decision Register entry.
>
> **Update (2026-08-29, same task, `DEC-LEGAL-002-FOUNDER-DISP-001` continued):** the Founder has since separately resolved the remaining `DEC-LOY-011` question — the default operational-redemption model during suspension. See the [Decision Register](../decision-register.md) `DEC-LOY-011` entry, now **CONFIRMED**: Option (a), redeemable by default during suspension, subject to governed exceptions (fraud/security/integrity concerns, legal/regulatory requirements, disputed reward validity, or another governed exception); suspension arising solely from the Business's commercial relationship with 11thONUS (including subscription/payment status) does not by itself block redemption. Together, this FD-2 entry (survival of the earned obligation) and the `DEC-LOY-011` resolution (default operational redeemability) now cover both halves of the original open question. Product/commercial positions only — not legal conclusions.

## FD-3 — Business exit and outstanding customer entitlements

**The gap:** no governed process exists for a business voluntarily exiting the platform, nor for what happens to that business's customers' outstanding (unredeemed) Rewards on exit. See Business Obligation Matrix "Business exit from 11thONUS" and "Outstanding customer entitlements on exit."

**Not decided here.** This is a genuine open product question, not previously addressed by any confirmed decision found in this research.

> ### FOUNDER DISPOSITION (recorded 2026-08-29, `DEC-LEGAL-002-FOUNDER-DISP-001`) — APPROVED — EXIT DOES NOT AUTOMATICALLY EXTINGUISH VALIDLY EARNED REWARDS
>
> A Business exiting 11thONUS does not automatically extinguish customer rewards validly earned before the effective date of exit. The Business remains responsible for outstanding earned customer reward obligations according to the applicable Reward Program and governing Business Terms. Exit may prevent new earning and new programme participation from the effective exit date.
>
> **Left to legal counsel, together with product/operational work:** the operational treatment, reasonable fulfilment period, customer-notice requirements, exceptional circumstances, and legal remedies. **This decision does not make 11thONUS the guarantor or fulfiller of the Business's reward obligations.** Product/commercial position only — not a legal conclusion.

## FD-4 — Platform intervention/suspension policy toward a business

**The gap:** the platform's authority to suspend a business (grounds, notice, process) is implied by `DEC-LOY-011`'s premise; `DEC-LOY-011` itself is now resolved (see FD-2 update above), but the platform's own suspension authority, grounds, and process remain a separate, still-open question addressed only by this item. See Business Obligation Matrix "Platform suspension of a business."

**Not decided here.**

> ### FOUNDER DISPOSITION (recorded 2026-08-29, `DEC-LEGAL-002-FOUNDER-DISP-001`) — APPROVED — 11thONUS MAY SUSPEND OR RESTRICT PLATFORM PARTICIPATION FOR GOVERNED TRUST, SECURITY, INTEGRITY OR COMPLIANCE REASONS
>
> 11thONUS may suspend or restrict a Business's participation where necessary to protect platform trust, security, integrity, compliance or participants. Suspension may prevent new loyalty activity and access to relevant platform capabilities. Suspension does not transfer responsibility for the Business's customer relationships or Reward Program to 11thONUS and does not automatically extinguish previously earned customer rewards (consistent with FD-2).
>
> **Not recorded:** an exhaustive list of suspension grounds. **Left to legal counsel and later operational governance:** appropriate grounds, notice/process, consequences, reinstatement/termination treatment, and legally required safeguards. Product/commercial position only — not a legal conclusion.

## FD-5 — Programme-change policy (mid-cycle changes to a Reward Program)

**The gap:** no governed rule for a business changing its Reward Program's threshold or reward value while customers are actively accumulating. Expiry is the only governed change-type, and only when a business opts in per-programme. See Business Obligation Matrix "Programme changes (mid-cycle)."

**Not decided here.**

> ### FOUNDER DISPOSITION (recorded 2026-08-29, `DEC-LEGAL-002-FOUNDER-DISP-001`) — APPROVED — BUSINESSES CONTROL PROSPECTIVE PROGRAMME CHANGES, BUT MAY NOT RETROSPECTIVELY REMOVE OR MATERIALLY REDUCE REWARDS ALREADY EARNED
>
> Businesses remain responsible for and in control of their own Reward Programs. Businesses may change their Reward Programs prospectively, subject to the applicable programme terms, platform trust requirements and applicable law. A programme change must not retrospectively remove or materially reduce a reward already earned by a customer under the rules applicable when it was earned. Changes affecting future earning may operate prospectively from the applicable effective point.
>
> **Left to legal counsel:** required notice, effective timing, consumer-protection requirements, transitional treatment, and legally permissible exceptions. **This decision does not authorize 11thONUS to standardize how Businesses design their customer relationships or Reward Programs.** Product/commercial position only — not a legal conclusion.

## FD-6 — Whether rewards carry monetary/cash value

**The gap:** not established anywhere in current product/governance authority (see [Product & Legal Decision Brief](DEC-LEGAL-002-PREP-001-product-legal-decision-brief-2026-08-29.md) §B.3). This has legal consequences (potential financial-instrument or gift-card-equivalent characterisation) that counsel should weigh in on, but the underlying product design choice (does 11thONUS ever want rewards to function as cash-equivalent) is the Founder's to make first.

> ### FOUNDER DISPOSITION (recorded 2026-08-29, `DEC-LEGAL-002-FOUNDER-DISP-001`) — APPROVED — 11thONUS REWARDS ARE NOT PLATFORM-HELD CASH AND DO NOT CREATE A GENERAL CASH-WITHDRAWAL ENTITLEMENT
>
> A reward recorded through 11thONUS is a benefit offered under the applicable participating Business's Reward Program. It is not money held by 11thONUS, a stored cash balance maintained by 11thONUS, or a general entitlement to cash withdrawal from 11thONUS. Unless the applicable governed Reward Program expressly permits otherwise, rewards are not redeemable for cash and are fulfilled by the participating Business according to its programme. 11thONUS does not assign an independent cash balance to earned rewards.
>
> **Not recorded:** the broader statement that rewards have "no monetary value" — a reward may plainly have economic value even though it is not cash. **Left to legal counsel:** the appropriate legal characterization and required disclosures. **This disposition must not prejudge separately governed future products such as gift cards, stored value or other instruments.** Product/commercial position only — not a legal conclusion.

---

## Phase F — Subscription-Terms Reconciliation

**Question:** does "subscription terms" remain relevant to `DEC-LEGAL-002`'s current scope, or has it been superseded/deferred elsewhere?

**Finding:** subscription terms are **explicitly and currently in scope** of `DEC-LEGAL-002` — the Decision Register entry's own text lists "subscription terms" alongside Reward Program terms, business obligation to honour rewards, dispute language, and platform liability, and `EXT-LEG-002`'s evidence-required field repeats the identical wording. No document splits subscription terms into a separate decision or marks them superseded/deferred.

**Corroborating product facts:**
- `DEC-PROD-004` (**CONFIRMED**): businesses are paying subscribers; customers never pay. This is a settled commercial-model fact, not open.
- `DEC-SUB-001/002/003/008/009/010/013` (all **OPEN_FOUNDER**): every pricing/plan-catalogue *detail* (names, staff limits, trial structure, BIF prices/billing intervals, per-business vs. owner-level billing, export formats, complimentary/pilot plans) remains open. `DEC-SUB-008` additionally depends on `EXT-LEG-003` (a separate, also-`OPEN_LEGAL`, e-billing dependency).
- `DEC-SUB-007` (**CONFIRMED**): essential trust controls are never paywalled — plans differ only by capacity/enhanced capability.

**Classification: `CURRENT DEC-LEGAL-002 SCOPE`.**

Subscription terms are neither future/deferred nor superseded — they are a live part of `DEC-LEGAL-002` today, per the decision's own text. No governance correction is needed to the register; the historical reference is accurate as written. What is **not yet settled** is the commercial detail those Terms would eventually need to express (the `DEC-SUB-*` items above) — but the *legal Terms content* question (what the subscription terms say about the relationship, cancellation, etc., as distinct from *what the prices are*) is squarely `DEC-LEGAL-002`'s to resolve, and can, in principle, proceed on general/structural subscription-terms language (parties, billing-cycle mechanics, cancellation rights, changes-to-terms) independently of the final price/plan values, subject to Founder and counsel judgment on sequencing (see [Resolution Plan](DEC-LEGAL-002-PREP-001-resolution-plan-2026-08-29.md)).

**FD-7 — Sequencing question for the Founder:** should `DEC-LEGAL-002`'s subscription-terms content be drafted now on general/structural terms (independent of final `DEC-SUB-*` pricing values), or held until the full plan catalogue (`DEC-SUB-001/002/003/008/009/010/013`) is confirmed? This is a genuine open sequencing choice, not answered by any source reviewed.

> ### FOUNDER DISPOSITION (recorded 2026-08-29, `DEC-LEGAL-002-FOUNDER-DISP-001`) — APPROVED — OPTION A, GENERAL/STRUCTURAL CONTRACTUAL FRAMEWORK MAY BE PREPARED NOW
>
> `DEC-LEGAL-002` may establish the general contractual framework governing applicable subscriptions, fees, billing, cancellation and changes where relevant to participating Businesses. It must not invent or prematurely settle: plan names; prices; billing intervals; staff limits; trial structure; complimentary/pilot plans; proration; grace periods; billing ownership; tiering; or other commercial values governed by open `DEC-SUB-*` decisions. Specific commercial terms become binding only when separately governed and applicable to the Business.
>
> **This disposition does not authorize:** Subscription Plan UI; billing implementation; pricing implementation; resolution of any open `DEC-SUB-*` decision. Product/commercial position only — not a legal conclusion.

---

## Cross-cutting Founder principle governing FD-2 through FD-5 (recorded 2026-08-29, `DEC-LEGAL-002-FOUNDER-DISP-001`)

**Businesses control their own Reward Programs and customer relationships, but that control does not include retrospectively erasing customer rewards already validly earned.** 11thONUS standardizes trust around the loyalty relationship. It does not become one shared loyalty programme and does not take ownership of the Business/customer relationship. 11thONUS may govern participation in the platform and protect platform trust, but Business reward obligations remain Business obligations unless separately governed otherwise. FD-2 through FD-5 above are each an application of this single governing distinction, not four independent policies.
