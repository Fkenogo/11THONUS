> **Title:** Firebase/GCP Region Selection — Founder Decision Brief (DEC-TECH-005)
> **Version:** 1.0 · **Status:** Decision preparation — not approved · **Classification:** Working (governance record)
> **Governing document:** [Decision Register](decision-register.md) — this brief prepares, and does not modify, DEC-TECH-005
> **Source-of-truth path:** `docs/00-governance/decisions/dec-tech-005-firebase-region-decision-brief.md`
> **Last controlled update:** 2026-07-18 (ENG-P0-002 Closure and Phase 0 Completion — created)

# Firebase/GCP Region Selection — Founder Decision Brief

> **This is decision preparation only. Nothing in this brief is approved. The Decision Register has not been modified. This brief does not propose, recommend, or narrow a specific region — no regional evaluation has been performed by anyone yet, and performing one is out of scope for the governance/closure task that produced this brief.**

## 1. Why This Brief Exists Now

Phase 0 (Repository and Delivery Foundation) is `Complete` as of 2026-07-18 — see the [Engineering Implementation Programme](../../05-implementation/change-tracking/engineering-implementation-programme.md)'s Phase 0 profile. Phase 1 (Firebase and Shared Platform Foundation) is the next phase in TRD22's sequence, and its first work package, **ENG-P1-001** (Firebase project init, App Check, client/admin SDK), cannot start: its Decision Dependency, **DEC-TECH-005**, is still `OPEN_ENGINEERING` in the live Decision Register. ENG-P1-002 and ENG-P1-003 are sequentially blocked behind ENG-P1-001. This brief exists to surface exactly what is needed to unblock Phase 1 entry — not to resolve it.

## 2. Which Decision This Governs

**DEC-TECH-005 — Firebase region.** Its current text (verbatim from the [Decision Register](decision-register.md)):

> Category: Technology · Status: **OPEN_ENGINEERING** · Priority: **D1**
> Decision question: Select the Firebase/GCP region balancing Burundi latency, service availability, cost and the cross-border legal position.
> Options identified: candidate regions to be evaluated (e.g., europe-west vs africa-south) — evaluation not yet performed.
> Recommended direction: none · Recommendation basis: —
> Current confirmed position: region must be selected before project creation (OTD-003).

No regional evaluation exists anywhere in the documentation suite. This brief does not create one.

## 3. What Blocks What

```
DEC-LEGAL-006 (OPEN_LEGAL — cross-border hosting position)
        │  Owner: Founder + legal adviser · feeds →
        ▼
DEC-TECH-005 (OPEN_ENGINEERING — region selection)
        │  Owner: Engineering Lead, informed by DEC-LEGAL-006 · blocks →
        ▼
ENG-P1-001 (Firebase project init) — Blocked
        │  sequential precondition →
        ▼
ENG-P1-002 (Shared command contract) — Blocked
        │  sequential precondition →
        ▼
ENG-P1-003 (Security/Storage Rules + monitoring) — Blocked
        │  additionally blocked on →
        ▼
DEC-PROV-005 (OPEN_PROVIDER — error monitoring provider)
```

**DEC-TECH-005 is the binding constraint for Phase 1 entry as a whole** — resolving it unblocks ENG-P1-001 and, sequentially, ENG-P1-002. **DEC-PROV-005 is a separate, independent blocker** that only affects ENG-P1-003 specifically; it does not need to be resolved for ENG-P1-001/002 to begin, and is not the subject of this brief (it concerns provider selection, not region).

## 4. What DEC-TECH-005 Itself Depends On

DEC-TECH-005's own register entry names its dependency: **DEC-LEGAL-006 — Cross-border Firebase hosting position**, currently `OPEN_LEGAL`:

> Question: approved hosting regions, notice/contractual safeguards, provider disclosures for Burundi data hosted abroad. Owner: Founder + legal adviser · Required by: Phase 1 (region selection) · Blocks: DEC-TECH-005.

This means DEC-TECH-005 cannot be responsibly resolved by Engineering alone until the legal position on cross-border hosting (which regions/jurisdictions are acceptable for Burundi customer data, and what contractual/notice safeguards apply) is at least provisionally settled — not because Engineering lacks the authority, but because the "cost, latency, availability" evaluation this brief could otherwise prepare would be incomplete without knowing which candidate regions are even legally admissible.

## 5. What Is Needed to Resolve This

Two distinct pieces of work, neither performed by this brief:

1. **Legal input (DEC-LEGAL-006):** the Founder and legal adviser determine which regions/jurisdictions are acceptable for hosting Burundi customer data, and what disclosure or contractual safeguards (if any) apply to cross-border storage. This is explicitly a Founder+legal decision, not an Engineering one.
2. **Regional technical evaluation (DEC-TECH-005 itself):** once the legally-admissible candidate set is known (or provisionally known), an Engineering Lead evaluation compares the admissible candidates on latency to Burundi, GCP/Firebase service availability, and cost — the three factors DEC-TECH-005's own decision question already names. **No such evaluation exists yet**, and performing one is a substantive technical/cost-research task, not something to originate inside a governance closure report.

## 6. What This Brief Does Not Do

- It does not propose, shortlist, or lean toward any specific region.
- It does not perform the regional technical evaluation DEC-TECH-005 requires.
- It does not resolve or modify DEC-LEGAL-006 or DEC-TECH-005 in the Decision Register.
- It does not unblock ENG-P1-001, ENG-P1-002, or ENG-P1-003 — those remain `Blocked`.
- It does not address DEC-PROV-005 (a separate, unrelated decision for ENG-P1-003 only).

## 7. Recommended Next Step

Two parallel tracks, sequenced as DEC-LEGAL-006 → DEC-TECH-005:

1. **Founder + legal adviser** resolve DEC-LEGAL-006 (or provisionally narrow the legally-admissible region set), through the normal [Decision Governance Workflow](../decision-governance-workflow.md) and [Decision Update Procedure](../decision-update-procedure.md) — not through this brief.
2. Once DEC-LEGAL-006 provides an admissible candidate set (even a provisional one), the **Engineering Lead** commissions the DEC-TECH-005 regional evaluation (latency/availability/cost comparison across the admissible candidates) as its own scoped piece of work — likely the natural first deliverable of a future "ENG-P1-000"-style decision-preparation task, analogous to how DEC-TECH-003's stack evaluation preceded ENG-P0-001.

Only after DEC-TECH-005 is CONFIRMED does ENG-P1-001 become eligible for a finalized implementation prompt.

## 8. Relationship to Other Governance Documents

- [Decision Register](decision-register.md) — DEC-TECH-005 and DEC-LEGAL-006 are the two live records this brief describes without modifying.
- [Engineering Transition D1 Agenda](engineering-transition-d1-agenda.md) — where DEC-TECH-005 sits alongside the other D1 decisions.
- [Version 1 Engineering Blueprint](../../02-technical/version-1-engineering-blueprint.md) §1.3, §6.4 — "This Blueprint deliberately does not name a region," consistent with this brief.
- [Engineering Implementation Programme](../../05-implementation/change-tracking/engineering-implementation-programme.md) Phase 1, ENG-P1-001 — the work package this decision blocks.
- [ENG-P0-002 Closure and Phase 0 Completion Report](../../05-implementation/reports/ENG-P0-002-closure-and-phase-0-completion-report-2026-07-18.md) — the task that produced this brief, having found no Phase 1 work package legitimately Ready.
