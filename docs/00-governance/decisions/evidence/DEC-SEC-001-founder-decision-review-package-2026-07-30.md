> **Title:** DEC-SEC-001 Founder Decision Review Package — Authentication Fallback and Identity Recovery Philosophy
> **Version:** 1.0 · **Status:** Prepared for a Founder decision session — NOT recorded, NOT approved
> **Task:** `RES-003A` (Capability 2 Resolution Sprint, `ENG-P2-RES-000`)
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/DEC-SEC-001-founder-decision-review-package-2026-07-30.md`
> **Prepared:** 2026-07-30

---

## 1. Executive Summary

This package prepares a Founder decision *session* for `DEC-SEC-001` — it does **not** record, approve, or countersign the decision, and it introduces **no new engineering recommendation** beyond what `RES-003` already prepared. `DEC-PROV-004`'s confirmation reframed `DEC-SEC-001` from a delivery-mechanism question into a product-philosophy question: how a customer moves through the Progressive Trust Model when their primary authentication door (phone OTP) doesn't open on the first try. `RES-003`'s engineering recommendation (Option A — email link fallback) stands unchanged; what remains is a set of product decisions — fallback ordering, whether phone verification is still required later, when assisted registration appears, whether merchants participate in it, and what experience principles govern identity recovery — that engineering cannot make on the Founder's behalf. This package presents those as neutral, structured questions (§4), not recommendations, and assesses their impact (§5) so the Founder can decide with full information. **Decision readiness for `DEC-SEC-001` itself: not yet ready** — see §6.

## 2. Impact of the Confirmed Identity Strategy on the Fallback Philosophy

*(Required pre-edit analysis, reproduced here for the permanent record.)*

`DEC-PROV-004`'s nine constitutional principles do more than select Firebase-native OTP as a delivery mechanism. Three of them directly reshape how `DEC-SEC-001`'s fallback question should be understood:

1. **Canonical identity is the verified phone number, not any particular authentication event (Principle 1).** This means a fallback mechanism's job is never "authenticate the customer" in isolation — it is always "resolve to the one identity the phone number represents." `RES-003` already found this is where the naive email-link answer breaks down: resolving to an identity that doesn't yet exist (because the phone was never verified) is not the same operation as linking a second credential to one that does.
2. **Authentication mechanisms are independent, interchangeable doors, not a strict primary/fallback hierarchy (Principles 2–4).** This licenses the Founder to think of "fallback" less as "what happens when Plan A fails" and more as "which door does this customer use right now, and does it matter which one they used later." That framing is exactly what Founder Decision Question 1 (§4) asks about.
3. **Trust is progressive — Anonymous, Authenticated, Verified (Principle 7) — and authentication is required only for identity-protected actions (Principle 6).** This means the fallback philosophy doesn't have to resolve everything at the moment of registration. A customer could reasonably be "Authenticated" via email or Google immediately, with "Verified" (phone-confirmed) status arriving later, at whatever point the platform decides it actually matters — which is exactly Founder Decision Question 2 (§4).

**Why this is now a product question, not an engineering one.** `RES-003`'s own corrected analysis (its §9, Implementation Prerequisite 1) established that a secure identity-resolution flow for "first OTP attempt fails" is genuinely undesigned — not because engineering hasn't gotten to it, but because *designing* it requires answers engineering cannot supply: what order should the customer be offered alternatives in, must they eventually prove phone ownership, when does a human enter the picture, and what should the whole experience feel like. TRD12 §12.30 ("Account Recovery") and §12.31 ("Lost Phone Number") already answer these questions thoroughly for an *existing* customer who loses phone access later — but that scenario has an existing identity to recover. Nothing in the repository answers the equivalent questions for a *prospective* customer whose first verification attempt fails, which is `DEC-SEC-001`'s actual subject. That gap is a philosophy gap, and only the Founder can close it.

**No change to DEC-PROV-004 or the engineering recommendation.** This package does not alter any of `DEC-PROV-004`'s nine principles, does not reopen `RES-003`'s recommendation of Option A, and does not design the identity-resolution flow `RES-003` flagged as a prerequisite — it frames the Founder decisions that flow's eventual design will depend on.

## 3. Founder Decision Brief

**The engineering recommendation (unchanged from `RES-003`):** confirm Firebase phone OTP as primary customer authentication (already effectively settled by `DEC-PROV-004`), with email link sign-in as the fallback direction for a failed OTP attempt — preferred over Google Sign-In not because its identity-resolution problem is smaller (it isn't; both share the same gap, per `RES-003`'s corrected §5–§7) but because it requires no new Founder-scope authorization and stays within TRD12 §12.4.1's existing text. This recommendation is conditioned on a still-undesigned identity-resolution flow, which is a real engineering prerequisite (`RES-003` §9), not a solved detail.

**The remaining Founder decisions (§4 below):** (1) the order in which fallback options are offered; (2) whether a customer who enters via Google or Email must still verify their phone before gaining identity-protected capabilities; (3) when assisted (human-involving) registration becomes available; (4) whether merchants may participate in assisted identity verification, and on what principles; (5) what customer-experience principles should govern identity recovery generally.

**Why these are product decisions, not engineering ones:** each depends on a value judgment about the customer's experience and 11thONUS's relationship to trust and friction — not on a technical fact engineering can resolve by itself.
- Question 1 (fallback order) determines what a new customer's very first impression of the platform looks like when something goes wrong — directly implicating PRD2's design objective that registration be "simple," "fast," and "recoverable," and *Moments That Matter* §1's stated goal of "ease, not scrutiny."
- Question 2 (must-verify-phone-later) is a trust-model policy choice about how much the platform is willing to let "Authenticated" stand in for "Verified" (`DEC-PROV-004` Principle 7) before requiring the stronger guarantee — a constitutional-adjacent judgment call, not a technical constraint.
- Question 3 (when assisted registration appears) trades customer effort against support-operations cost and cannot be answered from technical evidence alone — RES-001 found no repository evidence bearing on this at all, since it's not a technical question.
- Question 4 (merchant participation) is a trust and brand-risk decision — inviting a third party (a merchant) into identity verification changes who the customer is trusting, which is squarely a product/brand decision, not an engineering one.
- Question 5 (experience principles) is definitionally a product-philosophy question — engineering can implement whatever principles are chosen, but cannot originate them.

## 4. Authentication Fallback Journey

*(A decision model, not implementation logic — no engineering design is introduced here. This is a customer-journey map showing where Founder decisions branch the experience, using the existing PRD2 Registration Journey and Account Status vocabulary rather than inventing new states.)*

PRD2's own Registration Journey already defines: Step 1 Welcome → Step 2 Enter mobile number → Step 3 Verify number → Step 4 Create account → Step 5 Complete profile → Step 6 Generate loyalty number/QR → Step 7 Dashboard. PRD2's Account Status vocabulary already defines a **Pending Verification** state ("Registration started. Identity not yet verified.") that a customer sits in between Steps 2 and 4. The fallback journey below is a branch inserted at Step 3, not a redesign of the journey itself.

```
Step 2: Enter mobile number
        │
        ▼
Step 3: Verify number (phone OTP sent)
        │
        ├── OTP arrives, customer verifies ──────────────► Step 4: Create account (Verified)
        │                                                   [primary path — unchanged]
        │
        └── OTP does not arrive / customer reports failure
                │
                ▼
        Customer remains in "Pending Verification"
        (PRD2 §7 — Registration started, identity not yet verified)
                │
                ▼
        ╔═══════════════════════════════════╗
        ║   FOUNDER DECISION POINT (§4 Q1)   ║
        ║   Which alternative is offered      ║
        ║   first, second, third?             ║
        ╚═══════════════════════════════════╝
                │
        ┌───────┼────────┬─────────────────┐
        ▼       ▼        ▼                 ▼
    [Email    [Google  [Assisted        [Retry
     link]     Sign-In]  registration]    phone OTP]
        │       │        │                 │
        └───────┴────────┴─────────────────┘
                │
                ▼
        Customer reaches Step 4: Create account
        via an alternate door (Authenticated, per
        DEC-PROV-004 Principle 7 — not yet "Verified")
                │
                ▼
        ╔═══════════════════════════════════╗
        ║   FOUNDER DECISION POINT (§4 Q2)   ║
        ║   Is phone verification required   ║
        ║   later, before identity-protected  ║
        ║   capabilities unlock?              ║
        ╚═══════════════════════════════════╝
                │
        ┌───────┴───────┐
        ▼               ▼
   Yes — a later    No — Authenticated
   "Verify your     status is sufficient
   phone" step is   for the capabilities
   required before  in question (per
   certain actions  DEC-PROV-004
                     Principle 6 — only
                     identity-protected
                     actions require it)
```

**Where "assisted registration" fits (§4 Q3, Q4):** the diagram above shows it as one branch offered alongside email/Google, but the Founder may instead prefer it only after self-service options are exhausted, or only for a specific customer segment (e.g., no smartphone, no email). This package illustrates it as a parallel option precisely so the Founder can choose its actual position rather than have engineering assume one.

**Alternative flow — "recovery" framing instead of "fallback" framing:** TRD12 §12.30/§12.31 already define a mature *recovery* journey for an existing customer who later loses phone access (attempt recovery via linked email/provider → verify identity through support → update phone number → retain the same platform user and loyalty number → revoke prior sessions → record a security event). One alternative the Founder may consider: treat the "first OTP fails" scenario using the *same* language and posture as §12.30/§12.31's recovery journey (continuity, no new identity, support-assisted verification available), rather than introducing a separate "fallback" concept and vocabulary. This is presented as an option, not a recommendation — it is a framing choice, not an engineering one.

## 5. Founder Decision Questions

Each question is presented neutrally, with the available options and their trade-offs — no option is recommended, per this task's constraint.

### Question 1 — Preferred authentication fallback order

What order should alternatives be offered in in when phone OTP fails? Repository-supported sequences (all consistent with `DEC-PROV-004` and TRD12 §12.4.1, none requiring new authorization):

- **SMS → Google → Email → Assisted**
- **SMS → Email → Google → Assisted**
- **SMS → Assisted → (Email/Google as a secondary offer)** — leads with a human option before other self-service digital options
- **SMS → (Email and Google offered together, customer's choice) → Assisted**
- Any other Founder-defined ordering; no sequence beyond these four requires new engineering authorization, since Email and Google are both already-approved mechanisms (`DEC-PROV-004`) and Assisted registration is the Register's own pre-existing option (c).

No sequence is recommended here.

### Question 2 — Must customers who authenticate via Google or Email later verify their phone number before receiving identity-protected capabilities?

This is a direct trust-model policy question under `DEC-PROV-004`'s Progressive Trust Model (Principle 7: Anonymous → Authenticated → Verified) and Progressive Authentication (Principle 6: authentication required only for identity-protected actions). Two positions, neither recommended:

- **Yes** — a customer who entered via Google/Email remains at "Authenticated" only, and must complete phone verification before certain identity-protected capabilities (e.g., redeeming rewards, viewing loyalty balance) become available. This preserves phone number as the single, always-verified canonical identity in practice, not just in principle.
- **No** — "Authenticated" via any approved mechanism is treated as sufficient for the capabilities in question; phone verification remains encouraged but not gating. This reduces friction but means some customers may never complete the "Verified" state the platform's canonical-identity model assumes is normal.

### Question 3 — At what point should assisted registration become available?

- **Immediately after SMS failure** — offered as one of the first alternatives, alongside or before Email/Google.
- **After all self-service methods fail** — offered only once Email and Google have also been tried or declined.
- **Founder-defined alternative** — e.g., only for customers who indicate they have no email/Google account at all, or only during specific pilot phases/regions.

No option is recommended here.

### Question 4 — Should merchants participate in assisted customer identity verification, and under what principles?

This question is presented for Founder judgment only; no implementation is designed here, per this task's constraint. Considerations to weigh (not a recommendation):

- Merchants already have a real-world relationship with many customers (they may recognize a regular customer in person), which could make merchant-assisted verification faster than a centralized support process.
- Involving a merchant in identity verification introduces a third party into what is otherwise a customer-and-platform-only trust relationship (PRD2 §3: "the customer registers with 11thONUS," not with a business) — a potential tension with the platform's own stated identity philosophy.
- Any merchant role would need its own audit trail, per TRD12 §12.32's existing principle that "every support action shall be fully audited" for business-ownership recovery — the same posture would need to extend to any merchant-assisted step, if the Founder chooses to authorize one.

### Question 5 — What customer experience principles should govern identity recovery?

Grounded in language already established elsewhere in the repository (not invented by this package):

- PRD2 §2's existing Design Objectives for registration: simple, mobile-first, secure, fast, **recoverable**, unique, scalable, privacy-conscious.
- *Moments That Matter* §1's existing framing for Registration: "ease, not scrutiny — registering should feel like being welcomed, not interrogated"; Progressive KYC (collect only what's required now, ask for more later, framed by its value).
- TRD12 §12.30's existing recovery principle: "prioritize continuity without enabling account takeover," and "recovery shall not create a new customer identity when the existing identity can be restored."

The open question for the Founder is whether these *existing* principles (written for registration generally and for existing-customer recovery specifically) should simply extend to the "first OTP fails" scenario as-is, or whether the Founder wants to state a distinct principle for this specific moment — for example, how much a first-time customer should be made aware that something went wrong (transparency) versus how much friction is acceptable in service of security (caution). No position is recommended here.

## 6. Impact Assessment

For each Founder decision, the considerations below are drawn from repository evidence (`RES-001`, `RES-003`, TRD12, PRD2) — no new technical claims are introduced.

**Question 1 (fallback order):**
- *Customer experience:* ordering with the customer's most-likely-available option first (e.g., Email before Assisted, if most customers have email) minimizes friction; ordering Assisted first maximizes success likelihood at the cost of speed and scale.
- *Engineering complexity:* unaffected by order — each option's own complexity (per `RES-003` §6) doesn't change based on sequence position; only the UI flow presenting the choices needs updating per chosen order.
- *Security:* no material difference between orderings, since each option's own abuse posture (`RES-003` §5–§6) is independent of when it's offered.
- *Support operations:* an order that surfaces Assisted registration earlier increases support/staff workload sooner and at greater volume; an order that surfaces it last minimizes staff load but may leave customers who need it waiting through other failed attempts first.
- *Future extensibility:* any order can accommodate a future authentication provider (`DEC-PROV-004` Principle 4) by insertion at the chosen position — no ordering choice forecloses this.

**Question 2 (must phone-verify later):**
- *Customer experience:* "Yes" adds a later friction point but sets a clear expectation; "No" is frictionless but may create confusion later if some capabilities are unexpectedly gated behind an unfinished verification step.
- *Engineering complexity:* "Yes" requires a defined trigger and UI for the later verification step (not yet designed, an `ENG-P2-001` item either way); "No" avoids that additional flow but still requires the identity-resolution design `RES-003` §9 already flagged.
- *Security:* "Yes" more strongly preserves the canonical-phone-identity model in practice; "No" accepts a wider window where the platform's actual identity guarantee is weaker than its principle states.
- *Support operations:* "Yes" likely generates support contact volume from customers confused about why a capability is locked; "No" avoids that but may shift confusion to a different point (e.g., "why can't I get my QR code honored at this business").
- *Future extensibility:* "Yes" keeps the canonical-identity guarantee strong for any future capability that assumes phone verification; "No" would require every future identity-protected capability to independently decide whether it tolerates unverified customers.

**Question 3 (when assisted registration appears):**
- *Customer experience:* earlier availability reduces the chance a frustrated customer abandons registration; later availability keeps the self-service experience uncluttered for the majority who don't need it.
- *Engineering complexity:* unaffected — Option C's own definition (`RES-003` §5) remains equally undefined regardless of when it's surfaced; this is a UI/policy sequencing question, not a build-complexity one.
- *Security:* earlier availability at scale increases the volume of human-verification requests, which raises the bar for the verification standard needed to prevent it becoming the easiest attack path (`RES-003` §6 flagged this exact risk generically).
- *Support operations:* directly proportional — earlier availability at any meaningful adoption rate materially increases staffing needs; later availability limits volume to customers who have genuinely exhausted other options.
- *Future extensibility:* a clearly-scoped trigger condition (e.g., "after N self-service failures") is easier to tune later than an ambiguous one; this favors defining *some* explicit trigger regardless of which position is chosen.

**Question 4 (merchant participation):**
- *Customer experience:* could feel more personal and trustworthy for customers who already know a merchant, or could feel invasive/uncomfortable for customers who don't want a business knowing they needed identity help.
- *Engineering complexity:* not assessed here (constraint: no implementation design) — but any merchant-facing verification role would be new engineering scope beyond anything `RES-001`/`RES-003` evaluated.
- *Security:* introduces a new trust boundary (a merchant, not just platform staff, handling identity-sensitive information) that TRD12 has no existing rule set for — a genuine open gap, not merely an implementation detail.
- *Support operations:* could reduce centralized support load by distributing some verification work to merchants, but requires a new merchant-facing process, training, and audit expectation (per TRD12 §12.32's existing "every support action shall be fully audited" principle, which would need to extend here).
- *Future extensibility:* sets a precedent for merchant involvement in other identity-sensitive processes (e.g., business ownership recovery, TRD12 §12.32) — a structural choice with effects beyond this one decision.

**Question 5 (experience principles):**
- *Customer experience:* directly determines how the entire fallback/recovery experience feels — this question is the one most directly about customer experience, by definition.
- *Engineering complexity:* principles chosen here would need to be reflected in UI copy, error messaging, and flow pacing during `ENG-P2-001` implementation — a design input, not new complexity itself.
- *Security:* a principle favoring "caution" over "transparency" could justify more conservative fallback gating (fewer, slower options); a principle favoring "confidence" could justify faster, more generous fallback access — each has different security implications for abuse surface.
- *Support operations:* principles that emphasize self-service confidence reduce anticipated support load; principles that emphasize continuity/trust-building even at initial friction may increase it.
- *Future extensibility:* whichever principles are chosen here would reasonably extend to other future identity-sensitive moments (e.g., account recovery for existing customers, TRD12 §12.30) — this decision has scope beyond `DEC-SEC-001` alone.

## 7. Decision Readiness

**Not yet ready to record `DEC-SEC-001`.** Sufficient evidence and framing now exist for the Founder to *hold* the decision session this package prepares — the engineering recommendation is stable (`RES-003`, unchanged), the product questions are structured and neutral (§4), and their impacts are assessed (§6). What is missing is the Founder's actual answers to Questions 1–5, which this package cannot supply on the Founder's behalf, per its own constraints. Once those answers are given, a subsequent task (a future `RES-003B`-style action, not authorized by this brief) would be needed to: (a) incorporate the Founder's product-philosophy decisions into the `DEC-SEC-001` decision package `RES-003` produced, (b) update the identity-resolution flow's design scope per §9's prerequisite in light of the Founder's Question 2 answer, and (c) route the combined package to the Founder for the actual countersign the Register's own `Founder decision required: Countersign only` field requires. None of that is performed by this task.

**Recording status update (`RES-003B`, 2026-07-30):** the Founder's answers to Questions 1–5 have since been given and recorded in `DEC-SEC-001`'s live Decision Register entry — `Status: CONFIRMED` (authentication recovery order: SMS OTP → Retry/Resend → Google Sign-In → Email Verification → Assisted Support; progressive phone verification; merchant-assistance boundary; identity-recovery philosophy and 8 principles). `RES-003`'s own engineering recommendation was preserved unmodified by that recording. The identity-resolution flow's design scope (item (b) above) remains a future, not-yet-performed task — `RES-003B`'s own brief was scoped to recording the Founder's decisions only, not to design work.

## 8. Files Created or Modified

**Created:** `docs/00-governance/decisions/evidence/DEC-SEC-001-founder-decision-review-package-2026-07-30.md` (this document). **Modified:** `docs/changes/IMPLEMENTATION_CHANGES.md` (append). **Not modified:** `RES-003`'s decision package; `DEC-PROV-004`'s decision package or Register entry; the Decision Register; any application code; any other document.

## 9. Commands Executed

Live re-read of `DEC-PROV-004`'s Decision Register entry (unchanged, `CONFIRMED`); full re-read of the corrected `RES-003` decision package (`DEC-SEC-001-decision-package-2026-07-30.md`); re-read of TRD12 §12.4.1–12.4.4 (authentication by role), §12.5 (Account Linking), §12.6/AIR-001–006 (Account Identity Rules), §12.30 (Account Recovery), §12.31 (Lost Phone Number), §12.32 (Business Ownership Recovery); re-read of PRD2 §1–§7 (Customer Identity Philosophy, Identity Components, Registration Journey, Minimum Registration Information, Account Status); re-read of *Moments That Matter* §1 (Registration). No repository-code search was needed for this task (no engineering implementation is authorized or assessed beyond what `RES-003` already established).

## 10. Dependencies Added

None.

## 11. Configuration Changes

None.

## 12. Risks

- **Scope-creep risk (mitigated by this package):** the risk that a Founder-facing philosophy package drifts into re-deciding `RES-003`'s engineering recommendation is addressed by explicitly restating that recommendation as unchanged in §1/§3 and by presenting all five Founder questions without recommending an answer, per this task's constraints.
- **Premature-closure risk:** if a future task treats this package's neutral question framing as if it already contained Founder answers, `DEC-SEC-001` could be recorded without genuine Founder input — this package's §7 explicitly states readiness is contingent on those answers being obtained first.
- **Governance risk (carried forward, not created):** `DEC-SEC-001`'s own `EXT-TECH-001` evidence gap (still `PENDING`) remains unresolved, as disclosed in `RES-003` §4/§11 — unaffected by this package.

## 13. Rollback Instructions

`git revert` of this task's own commit — a single new Founder review-package document plus one changes-log append; no other file affected.

## 14. Markdown Founder Review Package

This document: [`docs/00-governance/decisions/evidence/DEC-SEC-001-founder-decision-review-package-2026-07-30.md`](DEC-SEC-001-founder-decision-review-package-2026-07-30.md).

## 15. Changes Log

Updated: [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../../changes/IMPLEMENTATION_CHANGES.md).
