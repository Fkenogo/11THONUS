> **Title:** 11thONUS Version 1.0 Engineering Authorization Record
> **Version:** 1.0 · **Status:** Permanent authorization record · **Classification:** Governing (governance record — formal engineering authorization)
> **Governing document:** 11thONUS Platform Constitution; issued under the [Decision Register](decisions/decision-register.md) and the [Version 1.0 Engineering Baseline Declaration](version-1-engineering-baseline-declaration.md), which it does not amend or supersede
> **Source-of-truth path:** `docs/00-governance/version-1-engineering-authorization-record.md`
> **Last controlled update:** 2026-07-19 (Phase 0E, Engineering Authorization & Governance Closure — created)

# 11thONUS Version 1.0 Engineering Authorization Record

## 1. Purpose

This is the formal, permanent record that Version 1.0 engineering implementation is authorized. It exists because the [Engineering Readiness Review (Phase 0D)](../05-implementation/reports/engineering-readiness-review-phase-0d-2026-07-19.md) found the documentation baseline internally consistent and recommended Option B — authorization contingent on two named Founder decisions. Those decisions have now been made (§6 below). This record closes that contingency and states, in one place, exactly what is authorized, on what baseline, and under what conditions.

## 2. Authorization Date

**2026-07-19**

## 3. Founder

**Kenogo** — sole authorizing Founder, per the authority the Platform Constitution vests in the Founder role throughout this governance programme.

## 4. Version

**1.0** — the same Version 1.0 documentation baseline declared by the [Version 1.0 Documentation Declaration](version-1-documentation-declaration.md) (17 July 2026) and restated as the engineering entry point by the [Version 1.0 Engineering Baseline Declaration](version-1-engineering-baseline-declaration.md) (19 July 2026). This record does not create a new version — it authorizes engineering to proceed from the version that already exists.

## 5. Approved Baseline

The complete Version 1.0 documentation baseline, as it stands at this authorization's effective date (§10), specifically including:

- Platform Constitution (Version 1.1, per DEC-GOV-001)
- Product Requirements Document (all 11 sections) and Technical Requirements Document (all 17 chapters)
- Product Experience Principles; Product Design (7 documents)
- Engineering Blueprint; Engineering Standards (Pass 1, 9 documents)
- Decision Register (105 records; 46 `CONFIRMED` as of this authorization — see §6)
- Requirements Traceability Matrix (942 requirement/rule/principle identifiers, 0 duplicates, 0 orphans, independently re-verified twice on 2026-07-19 — Engineering Readiness Review §9 and this record's own §9 validation)
- Engineering Implementation Programme (47 work packages across 17 TRD22 phases)
- Verified Loyalty Principles and the Verified Loyalty Governance Freeze v1.0 (domain-scoped freeze, Reward Lifecycle Engine only)
- Cloud Environment & Deployment Strategy; DEC-TECH-005 Cloud Region Evaluation Evidence Pack; DEC-LEGAL-006 Cross-Border Hosting and Data Residency Evidence Pack
- The [Engineering Readiness Review (Phase 0D)](../05-implementation/reports/engineering-readiness-review-phase-0d-2026-07-19.md), whose findings this authorization acts on

This baseline is a controlled starting point, not a permanent freeze (per the Version 1.0 Documentation Declaration §4) — future material changes follow the process in §11 below.

## 6. Authorized Repository

`Fkenogo/11THONUS`

## 7. Authorized Branch

`main`

## 8. Approved Decisions

Both decisions the Engineering Readiness Review identified as the sole blockers on `ENG-P1-001` are now `CONFIRMED`:

| Decision | Final Decision (verbatim from the Decision Register) | Date |
|---|---|---|
| **`DEC-LEGAL-006`** — Cross-border Firebase hosting position | *"11thONUS will proceed using a cross-border cloud hosting model. Engineering implementation is authorized. Prior to production deployment, all required legal validation, contractual documentation, regulatory notifications, approvals (where applicable), and compliance obligations shall be completed in accordance with the applicable laws of the operating jurisdiction(s). Engineering implementation is therefore not blocked by future legal execution activities."* | 2026-07-19 |
| **`DEC-TECH-005`** — Cloud Environment & Deployment Strategy (region component) | *"The Version 1 Firebase/Google Cloud region is `europe-west1` (Belgium), per Option A (Engineering Recommendation) of the Cloud Region Evaluation Evidence Pack — selected for its complete confirmed service match to the platform's Version 1 architecture, lowest operational complexity, and most mature operating history among evaluated candidates, consistent with the evidence pack's own findings and not overriding them."* | 2026-07-19 |

Full record: [Decision Register](decisions/decision-register.md), `DEC-LEGAL-006` and `DEC-TECH-005` entries.

## 9. Remaining Operational Activities

**Authorization is not conditioned on these — they are tracked here because `DEC-LEGAL-006`'s own confirmed text makes them mandatory before production, not because they block engineering:**

- Rwanda: confirm the realistic NCSA authorization-or-alternative-ground pathway and timeline (evidence pack §7, Rwanda counsel questions).
- Burundi: confirm the Art. 15 ¶3 Ministerial adequacy list's contents (or absence) and the Agence de protection des données à caractère personnel's operational status (evidence pack §7, Burundi counsel questions).
- Confirm whether Google Cloud's standard SCC/DPA framework satisfies Rwanda's Article 49 or Burundi's Article 15 ¶4 requirements, or whether a bespoke contractual instrument is needed (evidence pack §4, §7).
- Meet Burundi's private-sector compliance deadline, approximately **10 September 2026** (Loi n° 1/03 du 10 mars 2026, Art. 53) — a running clock independent of this authorization.
- Confirm Firebase Authentication's precise data-residency position directly with Google (Cloud Region Evaluation Evidence Pack §13, condition 5; Cross-Border Hosting evidence pack §6).
- Obtain an actual Kigali/Bujumbura latency measurement to replace the Nairobi-proxy estimate the region evaluation used (Cloud Region Evaluation Evidence Pack §13, condition 2).
- Confirm Firestore/Storage per-region pricing directly via Google's pricing calculator (Cloud Region Evaluation Evidence Pack §13, condition 3).
- Resolve `DEC-PROV-005` (error monitoring provider, `OPEN_PROVIDER`) — blocks `ENG-P1-003` specifically, not `ENG-P1-001`; independently resolvable now, no dependency chain.

None of the above is a precondition to `ENG-P1-001` starting. Each is either a precondition to **production deployment** specifically (per `DEC-LEGAL-006`'s own confirmed text) or a precondition to a **different, later work package** (`ENG-P1-003`, not `ENG-P1-001`).

## 10. First Authorized Work Package

**`ENG-P1-001` — Firebase & Shared Platform Foundation** (Firebase project initialization, App Check, client/admin SDK), per the [Engineering Implementation Programme](../05-implementation/change-tracking/engineering-implementation-programme.md), moved `Blocked → Ready` by this authorization (§13 below explains the transition). This is the first work package any coding-agent implementation prompt may target following this record.

## 11. Engineering Authority

Engineering work against this baseline is governed, unchanged by this record, by the existing [Engineering Governance](../06-engineering-governance/README.md) suite — the [AI Collaboration Workflow](../06-engineering-governance/ai-collaboration-workflow.md), [Coding Agent Standard](../06-engineering-governance/coding-agent-standard.md), [Implementation Prompt Standard](../06-engineering-governance/implementation-prompt-standard.md), [Technical Review Standard](../06-engineering-governance/technical-review-standard.md), [Git Workflow](../06-engineering-governance/git-workflow.md), [Deployment Workflow](../06-engineering-governance/deployment-workflow.md), and [Definition of Done](../06-engineering-governance/definition-of-done.md) — and by §6 of the [Version 1.0 Engineering Baseline Declaration](version-1-engineering-baseline-declaration.md) (what engineering may and may not derive behaviour from). This record does not create new engineering authority; it activates the authority those documents already define, against the now-unblocked Phase 1 entry point.

## 12. Effective Date

**2026-07-19**, immediately upon this record's creation. No separate ratification step is required — this record itself is the ratification, per the Founder decisions recorded in §8.

## 13. Formal Authorization Statement

> **Version 1.0 engineering implementation is hereby authorized to proceed from the approved baseline recorded in this document.** `ENG-P1-001` (Firebase & Shared Platform Foundation) is the first authorized work package. This authorization is granted on the basis of the Engineering Readiness Review's findings and the two Founder decisions recorded in §8 — it does not itself modify any requirement, architecture, or governance document beyond what those two decisions and the Engineering Readiness Review's three identified documentation corrections already required. **Future material changes to the approved baseline — a new or amended requirement, a changed architecture decision, or a further Decision Register confirmation with implementation consequences — must follow the documented governance process**: the Decision Governance Workflow for decisions, the Traceability Maintenance Guide for requirement changes, and Constitution Part VI for any constitutional amendment. No engineering work may silently diverge from this baseline; where a genuine conflict is found between what is documented and what implementation requires, it is resolved through that same governance process, not by building something different from what is authorized here.

## 14. Relationship to Other Governance Documents

This record does not amend the Platform Constitution, the Decision Register (beyond the two confirmations it reports, which were made in the register itself, not here), the Engineering Blueprint, or the Engineering Implementation Programme. It sits alongside the [Version 1.0 Engineering Baseline Declaration](version-1-engineering-baseline-declaration.md) as a companion record — the Baseline Declaration states what is authoritative and what engineering may derive behaviour from; this record states that engineering may now begin, on what specific first work package, and under what two now-resolved conditions. See also the [Version 1.0 Governance Completion Milestone](version-1-governance-completion-milestone.md), the permanent historical marker for the transition this record enacts.
