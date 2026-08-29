> **Title:** DEC-LEGAL-002 Legal Counsel Handoff Pack
> **Version:** 2.0 · **Status:** Ready to send to legal counsel — `DEC-LEGAL-002` remains `OPEN_LEGAL`; nothing in this pack is a legal conclusion · **Classification:** Working (governance record — counsel handoff)
> **Governing document:** [Decision Register](../decision-register.md) — this pack supports `DEC-LEGAL-002` / `EXT-LEG-002` evidence-gathering; it does not resolve either
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/DEC-LEGAL-002-FOUNDER-DISP-001-legal-counsel-handoff-pack-2026-08-29.md`
> **Date:** 2026-08-29 (v1.0) · **Updated:** 2026-08-29 (v2.0, same task — folds in the Founder's `DEC-LOY-011` resolution: the redemption-during-suspension model is now default-redeemable-with-governed-exceptions, so counsel is no longer asked to choose among the original throughout/grace-only/manual-review/blocked options) · **Task:** `DEC-LEGAL-002-FOUNDER-DISP-001`

# DEC-LEGAL-002 Legal Counsel Handoff Pack

This is the self-contained document intended to be sent to external legal counsel (the Burundi legal adviser named as `EXT-LEG-002`'s owner-adviser). It contains the factual product model, the Founder's approved product positions, the obligation/responsibility matrices, the proposed Terms architecture, and the precise legal questions — nothing more. Internal engineering detail (source file paths, function names, database schemas) is deliberately omitted from this pack; it lives in the underlying evidence documents, referenced but not required for counsel's review.

---

## 1. Executive Brief

11thONUS is a shared platform on which independently-operated businesses each run their own customer reward ("loyalty") programme. The platform provides identity, purchase verification, and reward-cycle infrastructure; it does not own or design any individual business's programme or customer relationship. Businesses pay a subscription to use the platform; customers do not pay.

The Founder has reviewed seven open product/commercial questions (FD-1 through FD-7) that stood between the existing product design and a legally reviewable set of Terms, and has approved a position on each — recorded in full in §3 below. A closely related, previously separate product question — the specific redemption model during a Business's suspension (`DEC-LOY-011`) — has also since been resolved by the Founder and is folded into §3 under FD-2. These are **product and commercial decisions, not legal conclusions**. Legal counsel's task is to advise on the legal form, enforceability, required wording, permitted exceptions, required notices, remedies, consumer-protection compliance, governing law, jurisdiction, and other genuinely legal matters needed to express these positions in enforceable Terms — not to select the underlying product policy, which the Founder has already set.

**What is not asked of counsel:** to decide whether a Business's reward obligation should survive suspension or exit, whether programme changes should be prospective-only, whether rewards should carry cash value, or any other product policy choice — those are recorded as decided in §3. **What is asked:** how to express those decisions in Terms that are legally sound in the applicable jurisdiction(s).

`DEC-LEGAL-002` remains `OPEN_LEGAL` in the Decision Register. `EXT-LEG-002` remains `PENDING` in the External Dependencies Register. No Terms version is configured. No application code has changed as a result of this pack.

---

## 2. Factual 11thONUS Product/Relationship Model

- **What the platform provides:** identity and business/staff account structure; a shared catalogue of purchasable categories ("Commerce Knowledge"); purchase recording and verification ("Verified Units"); reward-cycle mechanics; and, subject to open commercial decisions, a paid subscription relationship with businesses.
- **What the platform does not control:** an individual business's Reward Program design (what is rewarded, thresholds, reward value), the underlying goods/services a business sells, or the business's operational relationship with its own customers.
- **The governing product principle, confirmed against authoritative product documents:** *"The platform standardises trust, not how businesses build customer relationships."* Each business owns its own programme and customer relationship; the platform supports that relationship without taking ownership of it. 11thONUS is not, and is not becoming, one shared loyalty programme across businesses.
- **How a business participates:** registers, establishes its owner/staff structure, configures its Reward Program from the shared catalogue, and completes an onboarding flow that ends with a verification submission — which requires accepting the current governed Business Terms (see §6).
- **How a customer participates:** transacts with a specific business; the purchase is recorded against that business's catalogue; progress accumulates as Verified Units toward that business's Reward Program; a completed cycle produces a Reward, fixed in quantity at creation; redemption is a shared responsibility between customer and business.
- **Commercial model, settled facts:** businesses are the paying subscribers; customers never pay for basic participation. Specific pricing, plan names, billing intervals, and other commercial values remain open product decisions, separate from this pack (see §3, FD-7).

---

## 3. Founder-Approved FD-1–FD-7 Positions (recorded 2026-08-29, `DEC-LEGAL-002-FOUNDER-DISP-001`)

**These are Founder product/commercial positions informing `DEC-LEGAL-002`. They are not legal conclusions and do not resolve `DEC-LEGAL-002`.**

**FD-1 — Timing.** The Business Terms component of `DEC-LEGAL-002` is an immediate dependency and is being resolved now, ahead of the decision's originally-scoped later-stage legal/pilot gate. Other Phase 14/15 legal items (privacy, e-billing, minimum age, cross-border hosting) are not brought forward by this.

**FD-2 — Earned rewards during Business suspension.** Suspension of a participating Business does not, by itself, extinguish rewards validly earned by customers before suspension. 11thONUS may stop or restrict new loyalty activity, new earning, and/or new programme participation during suspension. Existing earned customer rewards remain obligations of the participating Business, subject to the applicable Reward Program terms and any circumstances where fulfilment is legally impossible or legal counsel advises that different treatment is required.

**`DEC-LOY-011` — Reward redemption during business suspension (resolved 2026-08-29, same task, folding into this pack's FD-2 scope).** Valid rewards earned before Business suspension remain redeemable during suspension **by default**. Business suspension may stop or restrict new loyalty activity, including new earning, new Reward Programs, and other applicable Business capabilities, without automatically preventing redemption of rewards already validly earned. Redemption may nevertheless be restricted, paused, or subject to additional review where the specific reason for suspension makes continued redemption inappropriate or unsafe — including circumstances involving suspected fraud, security or integrity concerns, legal or regulatory requirements, disputed reward validity, or another governed exception. Suspension arising solely from the Business's commercial relationship with 11thONUS, including subscription/payment status, does not by itself prevent customers from redeeming otherwise valid rewards already earned. The participating Business remains responsible for fulfilment; continued redemption does not make 11thONUS the guarantor or fulfiller of the reward. **Not decided:** that manual review is the default treatment, or an exhaustive list of exception grounds.

**FD-3 — Business exit and outstanding customer entitlements.** A Business exiting 11thONUS does not automatically extinguish customer rewards validly earned before the effective date of exit. The Business remains responsible for outstanding earned customer reward obligations according to the applicable Reward Program and governing Business Terms. Exit may prevent new earning and new programme participation from the effective exit date. This does not make 11thONUS the guarantor or fulfiller of the Business's reward obligations.

**FD-4 — Platform suspension of a Business.** 11thONUS may suspend or restrict a Business's participation where necessary to protect platform trust, security, integrity, compliance, or participants. Suspension may prevent new loyalty activity and access to relevant platform capabilities. Suspension does not transfer responsibility for the Business's customer relationships or Reward Program to 11thONUS and does not automatically extinguish previously earned customer rewards. **Not decided:** an exhaustive list of suspension grounds.

**FD-5 — Mid-cycle Reward Program changes.** Businesses remain responsible for and in control of their own Reward Programs. Businesses may change their Reward Programs prospectively, subject to the applicable programme terms, platform trust requirements, and applicable law. A programme change must not retrospectively remove or materially reduce a reward already earned by a customer under the rules applicable when it was earned. This does not authorize 11thONUS to standardize how Businesses design their customer relationships or Reward Programs.

**FD-6 — Monetary/cash character of rewards.** A reward recorded through 11thONUS is a benefit offered under the applicable participating Business's Reward Program. It is not money held by 11thONUS, a stored cash balance maintained by 11thONUS, or a general entitlement to cash withdrawal from 11thONUS. Unless the applicable governed Reward Program expressly permits otherwise, rewards are not redeemable for cash and are fulfilled by the participating Business according to its programme. 11thONUS does not assign an independent cash balance to earned rewards. **Not decided:** that rewards have "no monetary value" — a reward may plainly have economic value even though it is not cash. This does not prejudge separately governed future products such as gift cards or stored value.

**FD-7 — Subscription Terms sequencing.** `DEC-LEGAL-002` may establish the general contractual framework governing applicable subscriptions, fees, billing, cancellation, and changes where relevant to participating Businesses. It must not invent or prematurely settle plan names, prices, billing intervals, staff limits, trial structure, complimentary/pilot plans, proration, grace periods, billing ownership, tiering, or other commercial values governed by open pricing decisions. Specific commercial terms become binding only when separately governed. This does not authorize a Subscription Plan UI, billing implementation, pricing implementation, or resolution of any open pricing decision.

**Cross-cutting principle governing FD-2 through FD-5:** Businesses control their own Reward Programs and customer relationships, but that control does not include retrospectively erasing customer rewards already validly earned. 11thONUS standardizes trust around the loyalty relationship; it does not become one shared loyalty programme and does not take ownership of the Business/customer relationship. 11thONUS may govern participation in the platform and protect platform trust, but Business reward obligations remain Business obligations unless separately governed otherwise.

---

## 4. Business Obligation Matrix (counsel-relevant rows)

| Topic | Founder-approved product position | What counsel is asked to advise |
|---|---|---|
| Honouring valid rewards | Survives Business suspension (FD-2) and exit (FD-3), subject to the Reward Program terms and a legally-impossible-fulfilment exception. **Redemption during suspension is default-allowed** (`DEC-LOY-011`, resolved), subject to governed exceptions (fraud, security/integrity, legal/regulatory, disputed validity, or another governed exception). | Enforceability of the default-redeemable-with-exceptions model; legally required exceptions/notices for the exception categories; fulfilment requirements; remedies |
| Programme changes (mid-cycle) | Prospective-only; no retrospective removal/reduction of an earned reward (FD-5). | Required notice; effective timing; consumer-protection requirements; transitional treatment; permissible exceptions |
| Business exit / outstanding entitlements | Earned rewards survive exit; Business remains responsible; 11thONUS is not the guarantor (FD-3). | Operational treatment; reasonable fulfilment period; customer-notice requirements; exceptional circumstances; remedies |
| Platform suspension of a Business | Permitted for governed trust/security/integrity/compliance reasons; no transfer of reward-obligation responsibility to 11thONUS (FD-4). | Appropriate grounds; notice/process; consequences; reinstatement/termination treatment; required safeguards |
| Reward monetary character | Not cash/stored value/withdrawal entitlement; fulfilled by the Business per its programme (FD-6). | Regulatory characterisation (financial instrument / e-money / gift-card-equivalent exposure); required disclosures |
| Subscription Terms structure | General/structural framework may be drafted now; no specific pricing/plan value (FD-7). | What structural language is safely draftable now without requiring rework once pricing values are set |

**Rows not yet Founder-positioned, still genuinely open (not asked of counsel as if decided):** programme publication (does publication create a binding offer to customers?); qualifying-purchase definition; reward-redemption procedural detail; errors/corrections; fraud/abuse; customer disputes; business-vs-platform disputes. Counsel's advice is still welcome on the legal dimensions of these where useful, but no product position exists yet to build enforceable Terms language around them.

---

## 5. Platform/Business Responsibility Matrix (counsel-relevant rows)

| Topic | Platform responsibility (as governed) | Business responsibility (as governed) | What counsel is asked to advise |
|---|---|---|---|
| Honouring rewards | None — not the guarantor/fulfiller (FD-2, FD-3); redemption during suspension is default-allowed, exception-gated, not manual-review-by-default (`DEC-LOY-011`, resolved) | Bears the obligation, subject to Founder-approved exceptions | Enforceability of the default-allow/exception-gated model, exceptions, remedies |
| Accuracy of business-created programme terms | None — no platform review/approval of programme content | Full responsibility | Whether any minimum disclosure standard is legally required |
| Delivery of underlying goods/services | None — outside platform scope | Full responsibility | — (liability allocation only) |
| Account suspension | May suspend for governed trust/security/integrity/compliance reasons (FD-4); no transfer of Business's reward-obligation responsibility | N/A | Grounds, notice/process, consequences, reinstatement/termination, required safeguards |
| Platform record integrity | Platform-owned (purchase recording, reward mechanics, Terms-acceptance records) | Business supplies underlying transaction data | Evidentiary weight of platform records in a dispute |

**No liability exclusion, allocation, or limitation is proposed anywhere in this pack.** Counsel's advice on liability allocation (platform vs. business) remains fully open — see §7, items 9–11.

---

## 6. Terms Instrument/Content Architecture

**Recommended instrument model (for counsel's review, not decided):**
1. **Business Terms** (platform-wide) — governs the 11thONUS–business relationship, including general subscription-terms structure per FD-7.
2. **Customer/Participant Terms** (platform-wide, conditional on counsel's answer to whether a direct relationship is legally required) — governs the 11thONUS–customer relationship at the platform level only.
3. **Reward Program terms** — authored and controlled by each individual business, not the platform.
4. Privacy matters are governed separately (a distinct, still-open legal item) and are not duplicated into this pack.

**Business Terms headings** (content architecture only — no clause drafted): parties/relationship; platform service; business eligibility; account authority; Reward Program responsibility; transaction recording; **reward obligations** (FD-2/FD-3-positioned); prohibited conduct; disputes/corrections; **suspension/termination** (FD-3/FD-4-positioned); **programme changes** (FD-5-positioned); data/privacy references (cross-referenced, not duplicated); **fees/commercial provisions** (FD-7-positioned, structure only); liability; governing law/disputes; changes to Terms; electronic acceptance.

**Customer Terms headings** (prepared only where the product model establishes the need): parties/relationship; platform service description; data recorded (cross-referenced to privacy Terms); **reward mechanics at the platform level** (FD-6-positioned monetary characterisation); redemption; **programme-change disclosure** (FD-5-positioned); disputes; changes to Terms; electronic acceptance (if determined necessary).

**Existing Terms acceptance mechanism (factual, for counsel's awareness — not a legal conclusion):** the platform already has a working mechanism requiring a business owner to affirmatively accept a named, versioned Terms document — recording who accepted, which version, when, and in what language — before a business can submit for verification. No governed Terms version and no Terms content currently exists in that mechanism; it is deliberately empty pending this legal review. No placeholder or default has been created.

---

## 7. Counsel Question Set

The full 20-question set is at [DEC-LEGAL-002-PREP-001 Legal Counsel Question Set (v3.0)](DEC-LEGAL-002-PREP-001-legal-counsel-question-set-2026-08-29.md). Summarised by category:

- **Legal nature of relationships:** platform–business (Q1), platform–customer (Q2).
- **Enforceability/form:** electronic acceptance sufficiency (Q3), required disclosures (Q4).
- **Legal expression of Founder-approved positions** (legality, wording, exceptions, notices, remedies — not product-policy or redemption-model choice): honouring earned rewards including the resolved default-redeemable-with-exceptions suspension model (Q5, folds in `DEC-LOY-011`), programme-change treatment (Q6), exit/suspension outstanding-rewards treatment (Q7), platform suspension grounds/process (Q18), reward monetary characterisation and disclosures (Q19), general subscription-terms framework (Q20).
- **Still genuinely open, not Founder-positioned:** dispute allocation (Q8).
- **Liability:** platform liability (Q9), business liability (Q10), permissible limitation/exclusion language (Q11).
- **Governing law/forum:** governing law (Q12), jurisdiction/dispute-resolution mechanism (Q13).
- **Language/versioning:** required Terms language(s) (Q14), version-change/reacceptance sufficiency (Q15).
- **Consumer protection:** mandatory provisions (Q16), differentiated business-vs-customer treatment (Q17).

---

## 8. Decision/Evidence References

- Decision Register — [`DEC-LEGAL-002`](../decision-register.md) (OPEN_LEGAL, Priority D3; `Required by`/`Notes` updated 2026-08-29 to reflect FD-1) and [`DEC-LOY-011`](../decision-register.md) (now CONFIRMED, 2026-08-29 — Option (a) default-redeemable-with-governed-exceptions).
- External Dependencies Register — [`EXT-LEG-002`](../external-dependencies-register.md) (PENDING).
- CDR-001 Capability Delivery Roadmap §5 — Capability 3 status: Open — engineering work packages complete; blocked on governed Terms-content configuration.
- Full preparation package: [Product & Legal Decision Brief](DEC-LEGAL-002-PREP-001-product-legal-decision-brief-2026-08-29.md), [Business Obligation Matrix](DEC-LEGAL-002-PREP-001-business-obligation-matrix-2026-08-29.md), [Founder Decision Sheet](DEC-LEGAL-002-PREP-001-founder-decision-sheet-2026-08-29.md), [Terms Content Architecture](DEC-LEGAL-002-PREP-001-terms-content-architecture-2026-08-29.md), [Resolution Plan](DEC-LEGAL-002-PREP-001-resolution-plan-2026-08-29.md).

---

## 9. Expected Counsel Outputs

For each question in §7: a written answer addressing legality, enforceability, required wording direction (not final clause text unless counsel chooses to draft), permitted exceptions, required notices, remedies, consumer-protection compliance, and governing-law/jurisdiction implications, as applicable to that question. Counsel is not asked to draft complete final Terms in this pass — only to answer the questions so the Founder can authorize drafting next. If counsel finds any Founder-approved position (§3) legally unworkable as stated, that finding should be returned to the Founder for reconsideration, not silently altered.

---

## 10. Post-Counsel Resolution Sequence

1. Counsel answers the question set (§7).
2. Answers are filed as the `EXT-LEG-002` evidence record (External Dependencies Register), moving it from `PENDING` toward `EVIDENCE_RECEIVED`.
3. Founder reviews and accepts (or requests revision of) counsel's advice.
4. `DEC-LEGAL-002` Decision Register status is updated (from `OPEN_LEGAL`) only at this point — not before.
5. Actual Terms content is drafted and approved, populating the architecture in §6.
6. A real Terms version identifier is assigned and configured (a single, explicit, Founder-authorized engineering action — not yet performed).
7. End-to-end verification that a business can accept the Terms and complete verification submission.
8. Capability 3 closure assessment.

Full detail: [Resolution Plan (v2.0)](DEC-LEGAL-002-PREP-001-resolution-plan-2026-08-29.md).

---

**Current statuses:** `DEC-LEGAL-002` = OPEN_LEGAL, awaiting legal review (unchanged). `EXT-LEG-002` = PENDING (unchanged). `DEC-LOY-011` = CONFIRMED (Founder-resolved 2026-08-29, within this same task, prior to this pack's v2.0). Capability 3 = IN PROGRESS (blocked on governed Terms-content configuration; unchanged). Terms version = NOT CONFIGURED. Application code = UNCHANGED.
