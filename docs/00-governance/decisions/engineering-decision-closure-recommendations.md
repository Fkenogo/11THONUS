> **Title:** Engineering Decision Closure Recommendations
> **Version:** 1.0 · **Status:** Active governance record · **Classification:** Working (governance record)
> **Governing document:** [Decision Register](decision-register.md); [Decision Governance Workflow](../decision-governance-workflow.md)
> **Source-of-truth path:** `docs/00-governance/decisions/engineering-decision-closure-recommendations.md`
> **Last controlled update:** 2026-07-17 (Engineering Decision Sprint 2 — closures for DEC-TECH-004/006/007 applied to the live Decision Register; created Engineering Transition Phase 0B)

# Engineering Decision Closure Recommendations

> **Status update (Engineering Decision Sprint 2, 2026-07-17):** the three closures prepared below for DEC-TECH-004, DEC-TECH-006, and DEC-TECH-007 have since been **applied** to the live [Decision Register](decision-register.md) under explicit Founder-directed instruction (Engineering Decision Sprint 2 task brief), following the [Decision Update Procedure](../decision-update-procedure.md). DEC-TECH-003 has also since been confirmed (Engineering Decision Sprint 1's recommendation, applied in Sprint 2). This document's analysis below is preserved unchanged as the audit record of *why* each closure was recommended; it is no longer the live status of any of these four decisions — see the register or the [Phase 0 Authorization](../../05-implementation/phase-0-authorization.md) record for current status.
>
> **Further status update (`RES-002B`/`RES-003B`, 2026-07-30):** `DEC-PROV-004` and `DEC-SEC-001` — both listed below as "Stays open" at the time this document's analysis was originally performed — have since been `CONFIRMED` in the live [Decision Register](decision-register.md), via the `RES-002`/`RES-002A`/`RES-002B` and `RES-003`/`RES-003A`/`RES-003B` Resolution Sprint tasks respectively (PRs #31 and #33). This document's §3/§4 analysis below is preserved unchanged as the historical audit record of why each was originally assessed as genuinely open; it is no longer the live status of either decision — see the [Decision Register](decision-register.md) for current status.

## 1. Purpose

This record reviews the seven **Engineering-owned** decisions in the [Engineering Transition D1 Agenda](engineering-transition-d1-agenda.md) §4 (DEC-SEC-001, DEC-TECH-003, DEC-TECH-004, DEC-TECH-005, DEC-TECH-006, DEC-TECH-007, DEC-DATA-007) and asks one question of each: **does approved documentation already provide sufficient direction to close it, or does genuine unresolved work remain?** *(Findings below reflect the analysis as originally performed in Engineering Transition Phase 0B; see the status update above for what has since been applied.)*

**This document does not close any decision.** Per the [Decision Governance Workflow](../decision-governance-workflow.md) §2 and §9, only the named decision owner (Engineering Lead, with founder countersignature where marked) may approve an OPEN_ENGINEERING record, and the documentation maintainer/AI agent role "never approves, never resolves, never infers" and "never fill[s] approval fields on their own initiative." Nothing in the Engineering Transition Phase 0B task instructions contained an explicit founder or Engineering Lead approval instruction for any specific DEC-TECH-* record (unlike Phase 3B, where each Batch A decision was approved by explicit quoted instruction) — so this record stops short of the approval step and instead **prepares exactly what an approval would write**, so that a one-line sign-off is all that remains.

For three of the seven, the finding is that an approved source document already states the answer in enough detail that recording it is recognition, not invention — the same pattern already used for existing CONFIRMED "no founder decision required" records such as DEC-OPS-001. For the remaining four, a genuine gap remains (an unperformed evaluation, an unproven external capability, or a proposal nobody has reviewed yet) and forcing closure would mean inventing an architectural choice this task explicitly forbids.

## 2. Method

For each decision: quote the register's current "Options identified" / "Recommended direction" fields, re-verify those citations against the actual TRD/PRD source text (not the register's paraphrase), and classify:

- **Closable now** — an approved document already states a clear, sufficient direction; no further research or external proof is needed to act on it.
- **Stays open** — the documentation itself says "to be proposed," "not yet evaluated," or "pending proof," and no other approved document fills the gap.

## 3. Findings

### DEC-TECH-004 — Repository structure — **Recommend: Closable now**

- Register text: "Recommended direction: (a) monorepo · Recommendation basis: OTD-006 ['recommends a shared repository or monorepo for strong type and contract reuse']."
- Verified against source: TRD23 §23.22 OTD-002 states in full: *"Options include: one monorepo for frontend and Functions; separate repositories. The TRD recommends a shared repository or monorepo for strong type and contract reuse unless operational reasons justify separation."* No operational reason for separation is raised anywhere in the 76-document Version 1.0 baseline (confirmed by the Documentation Manifest v1 and the Phase 7 consistency audit, which found 0 unresolved contradictions on this point).
- TRD8 §8.4 already documents a single, unified project structure (`src/domains/...`) assuming one codebase — the physical architecture chapter already writes as if the monorepo were adopted, which is further evidence the direction is already effectively settled, not merely recommended in the abstract.
- **Prepared register update** (not yet applied):
  - Status: OPEN_ENGINEERING → **CONFIRMED**
  - Final decision: *"Monorepo. Frontend and Cloud Functions code, including shared types, live in a single repository, per OTD-002 and the project structure already specified in TRD8 §8.4. No operational reason for separate repositories has been identified."*
  - Decision date: *(date of Engineering Lead sign-off)*
  - Approved by: *(Engineering Lead name/signature — pending)*
  - Implementation consequences: repository layout for ENG-P0-001/002 follows this structure directly.
- **Effect if signed:** unblocks half of ENG-P0-001's two preconditions (see §5 of the [D1 Agenda](engineering-transition-d1-agenda.md); DEC-TECH-003 remains the other).

### DEC-TECH-006 — Event delivery mechanism (outbox) — **Recommend: Closable at the pattern level; schema detail stays deferred**

- Register text: "Recommended direction: (a) recommended outbox pattern · Recommendation basis: OTD-006; TRD11 §11.17."
- Verified against source: TRD11 §11.17 ("Event Outbox Pattern") specifies, in approved TRD text, not just a recommendation but a field-level design: a Firestore transaction writes the domain record and an outbox entry together; a background processor reads unpublished entries, publishes/processes them, marks them completed, and retries failures safely; the outbox entry shall support idempotent processing, retry count, next retry time, status, error details, and dead-letter transition. TRD23 §23.22 OTD-006 confirms this is "the MVP recommendation" and separately notes: *"The final outbox collection and processing approach require engineering validation."*
- Reading both together: the **pattern choice** (outbox vs. direct Pub/Sub) is already answered by an approved, detailed TRD chapter with no credible counter-option raised anywhere in the suite. The **schema/implementation detail** ("final outbox collection and processing approach") is explicitly marked as needing engineering validation — that is Pass 2 Engineering Standards and Phase 1 implementation work, not a blocking architectural ambiguity.
- **Prepared register update** (not yet applied):
  - Status: OPEN_ENGINEERING → **CONFIRMED**
  - Final decision: *"Adopt the Firestore-transaction + event-outbox + background-processor pattern per TRD11 §11.17, with a future Pub/Sub migration path per OTD-006. The exact outbox collection schema, retry/backoff parameters, and dead-letter handling are implementation detail, specified in Pass 2 Engineering Standards during Phase 1 (ENG-P1-002), not part of this decision."*
  - Decision date / Approved by: *(pending Engineering Lead sign-off)*
- **Effect if signed:** removes one of Phase 1's two open architectural questions; Pass 2 Engineering Standards can proceed against a settled pattern.

### DEC-TECH-007 — Idempotency storage approach — **Recommend: Closable at the policy level; per-operation schema stays deferred**

- Register text: "Recommended direction: combined approach permitted · Recommendation basis: OTD-007."
- Verified against source: TRD10 §10.30 ("Idempotency") states plainly: *"Idempotency records may be stored in a dedicated collection or incorporated into authoritative documents, depending on the operation."* TRD23 §23.22 OTD-007 confirms: *"The team must choose between: dedicated idempotency collection; deterministic authoritative document IDs; operation-specific combined approach. The architecture permits a combined approach."*
- Both approved chapters already grant engineering explicit discretion to choose per operation — the "decision" the register frames as open is, on inspection, already resolved: the architecture does not mandate one universal mechanism, it authorizes a combined, per-operation approach. There is nothing left to decide at the architecture level; only per-operation schema choices remain, which are ordinary implementation work carried out inside each work package, not a standing blocker.
- **Prepared register update** (not yet applied):
  - Status: OPEN_ENGINEERING → **CONFIRMED**
  - Final decision: *"Combined, per-operation approach — dedicated idempotency collection or deterministic document IDs, chosen per operation as TRD10 §10.30 and OTD-007 already permit. Each operation's specific choice is documented where that operation's Engineering Standard/work package is authored (Pass 2), not decided globally here."*
  - Decision date / Approved by: *(pending Engineering Lead sign-off)*
- **Effect if signed:** removes the second of Phase 1's two open architectural questions (paired with DEC-TECH-006 in the register's own Dependencies field).

### DEC-SEC-001 — Customer authentication approach and fallback — **Stays open**

- Register text: "Recommended direction: (a) pending proof." The register itself marks this conditional, not confirmed.
- Verified against source: TRD23 §23.22 OTD-004 requires validating "Firebase phone authentication support; Burundi number delivery; cost; abuse controls; fallback authentication; test-phone strategy" — none of which any approved document has performed. This is tracked as **EXT-TECH-001** in the External Dependencies Register and is a factual question about a third-party service's behavior in a specific country, not something resolvable by re-reading existing documentation.
- **No closure recommended.** Forcing this closed would mean asserting Burundi OTP delivery works before anyone has checked — exactly the kind of invented architectural choice this phase must not make.

### DEC-TECH-003 — Frontend tooling set — **Stays open**

- Register text: "Options identified: per OTD-001 (to be proposed by engineering)... Recommended direction: none recorded in suite."
- Verified against source: TRD23 §23.22 OTD-001 confirms React and TypeScript are approved (already CONFIRMED separately as DEC-TECH-002) but states outright: *"The team still needs to choose and document: build tool; router; query and server-state library; form library; component foundation; PWA tooling; testing libraries."* No approved document anywhere in the 76-document Version 1.0 baseline names a specific build tool, router, or any of the other five items.
- **No closure recommended.** This is the one genuine "propose an architectural choice" decision among the seven — naming a specific tool here would be inventing functionality/architecture the documentation does not contain, which Task 1's constraints explicitly forbid. It is also, per the D1 Agenda, the decision blocking Phase 0 itself; it should be the next decision the Engineering Lead resolves.

### DEC-TECH-005 — Firebase region — **Stays open**

- Register text: "Options identified: candidate regions to be evaluated... evaluation not yet performed."
- Verified against source: TRD23 §23.22 OTD-003 lists the evaluation criteria (latency, compatibility, availability, legal review, cost) but performs no evaluation. The decision also depends on **EXT-LEG-006** (cross-border hosting legal position) and the still-open **DEC-LEGAL-006**, a Founder + legal-adviser decision this Engineering Transition programme has no authority to resolve.
- **No closure recommended.** Two independent blockers remain: an unperformed technical evaluation and an unresolved legal question outside Engineering's ownership.

### DEC-DATA-007 — Loyalty number and QR reference generation — **Stays open**

- Register text: "Options identified: to be proposed... Recommended direction: none."
- Context: Engineering Transition Phase 0A produced the [Loyalty Code Decision Brief](loyalty-code-decision-brief.md) — a concrete, capacity-verified proposal (format `ABC-234`, ~7.08M-code space, collision analysis). This is new analysis prepared *by* this programme, not a pre-existing approved document's answer; it is a proposal awaiting review, exactly as the brief's own §9 ("Recommended Next Step") states.
- **No closure recommended.** Treating a not-yet-reviewed brief as if it were already-approved documentation would blur the line this programme has held throughout: preparing a decision is not the same as documentation already answering it. The brief remains ready for Founder/Engineering Lead review; closing DEC-DATA-007 is that reviewer's action, not this phase's.

## 4. Summary Table

| Decision | Finding | Recommended status | What's still needed to actually apply it |
|---|---|---|---|
| DEC-TECH-004 | Already answered (OTD-002 + TRD8 §8.4) | Closable now | Engineering Lead sign-off (one line) |
| DEC-TECH-006 | Pattern already answered (TRD11 §11.17); schema deferred to Pass 2 | Closable now (pattern level) | Engineering Lead sign-off (one line) |
| DEC-TECH-007 | Policy already answered (TRD10 §10.30 + OTD-007); per-operation schema deferred | Closable now (policy level) | Engineering Lead sign-off (one line) |
| DEC-SEC-001 | Genuinely pending external proof (EXT-TECH-001) | Stays open | Burundi OTP delivery/cost/abuse-control proof |
| DEC-TECH-003 | Genuinely no documented candidate tools | Stays open | Engineering Lead proposal (build tool, router, state/form libraries, component foundation, PWA tooling, test libraries) |
| DEC-TECH-005 | Genuinely unperformed regional evaluation + open legal question | Stays open | Technical region evaluation + DEC-LEGAL-006 resolution |
| DEC-DATA-007 | Proposal prepared (Phase 0A brief), not yet reviewed | Stays open | Founder/Engineering Lead review of the Loyalty Code Decision Brief |

**3 of 7 have a prepared, ready-to-sign closure. 4 of 7 remain genuinely open** — three needing a decision-owner action this programme cannot take on its own (a proposal, an evaluation, a proof), one needing a legal input this programme cannot provide.

## 5. How to Apply a Prepared Closure

Per the [Decision Update Procedure](../decision-update-procedure.md): the Engineering Lead (with founder countersignature where the record marks it) reviews §3 above, confirms or amends the prepared *Final decision* text, and the documentation maintainer then executes the Decision Register edit exactly as approved, in the same change set as any *Document corrections required* the record lists, followed by a Documentation Changes Log entry. **This is exactly what occurred for DEC-TECH-004, DEC-TECH-006, and DEC-TECH-007 in Engineering Decision Sprint 2 (2026-07-17)** — the sprint's task brief constituted the explicit founder-directed instruction required to apply these closures; see the live [Decision Register](decision-register.md) for the applied text.

## 6. Relationship to Other Governance Documents

- [Decision Register](decision-register.md) — the authoritative record; unchanged by this document.
- [Engineering Transition D1 Agenda](engineering-transition-d1-agenda.md) — the source grouping of these seven decisions as Engineering-owned.
- [Decision Governance Workflow](../decision-governance-workflow.md) / [Decision Update Procedure](../decision-update-procedure.md) — the sanctioned path to actually apply any closure recommended here.
- [Loyalty Code Decision Brief](loyalty-code-decision-brief.md) — the companion proposal for DEC-DATA-007, still awaiting review.
