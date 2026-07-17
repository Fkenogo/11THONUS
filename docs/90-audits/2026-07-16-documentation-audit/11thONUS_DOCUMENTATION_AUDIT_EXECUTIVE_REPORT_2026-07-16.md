# 11thONUS Documentation Suite — Executive Audit Report

**Audit type:** Comprehensive consistency, traceability and freeze-readiness audit
**Audit date:** 16 July 2026
**Scope:** Complete documentation folder (35 project documents + 1 uploaded audit brief)
**Auditor:** Claude (AI documentation auditor), acting as senior product/technical architect and requirements-governance specialist
**Source documents modified:** None

---

## 1. Overall Assessment

The 11thONUS documentation suite is substantially more mature than most pre-implementation suites. The Constitution, the eleven PRD sections and the twenty-three-chapter TRD describe **one recognizable, coherent product**: a Customer-Verified Loyalty Platform in which business-recorded Purchase Records remain pending until the registered customer verifies them, ten Verified Units complete a Loyalty Cycle, and the next eligible item is delivered as an On Us Moment. The core trust model (mandatory customer verification, no actor exemption, immutable event history, server-only authoritative writes) is stated consistently across the Constitution, PRD4/PRD5 and TRD10/TRD11/TRD12, and the MVP/deferred boundary in TRD22 is unusually disciplined.

However, the suite is **not yet safe to freeze**, for four structural reasons:

1. **Two early-generation documents contradict the approved product model and are not labelled as superseded.** `11thONUS Product Definition.md` states that *"Owner transactions are automatically approved"* — a direct contradiction of the platform's cardinal rule (PD-014, BR-009, AP-005, OP-013). `11THONUS-data-model.md` describes a different product entirely (vendor/shopper/punch terminology, SQL schema, a **configurable redemption threshold defaulting to 11**, automatic rate-limit rejection of purchases) and explicitly says it is *"written for a development team to implement directly."* An engineer or AI agent given the folder as-is can implement the wrong product.
2. **The reward threshold is represented three incompatible ways across the suite** (fixed 10 Verified Units; configurable per listing defaulting to 11; per-product "Reward Rule / Reward Quantity" configuration).
3. **Domain ownership corrections are documented but not applied.** TRD1-7 defines 12 domains with Administration owning Subscriptions; TRD10's collection matrix assigns `rewardPrograms` to Loyalty, `businesses` jointly to Identity/Administration and `subscriptions` to Administration; TRD23 and the TRD Consolidation Audit define the final 15-domain model with dedicated Reward Programs, Subscription and Integration domains. Freezing today would freeze multiple authoritative owners.
4. **Requirement IDs collide.** The prefix `FR-RP` is used for three unrelated requirement sets (PRD1 authorization, PRD6 Reward Programs, PRD10 RBAC), so `FR-RP-001` has three different meanings. `OP-` is used both for the ONUS Principles (PRD0) and TRD20 operational rules. A traceability register cannot be built on these IDs.

The good news: the TRD's own internal Consolidation and Consistency Audit (`TRD#_Consolidation and Consistency Audit.md`) already prescribes most of the required corrections. The remaining work is to **apply** those corrections across the whole suite (not only the TRD), label the legacy documents, resolve the ID scheme, and extract the open decisions into the Decision Register.

## 2. Verdicts

| Question | Verdict |
| --- | --- |
| Freeze readiness | **Not ready for freeze** |
| Implementation readiness | **Not ready for implementation** (per the TRD's own §23.36 checklist: no Decision Register, no Engineering Standards, no traceability register, unresolved provider/legal dependencies) |
| Coherence of product concept | One coherent product, contaminated by two unlabelled superseded documents |
| Realistic path to freeze | Achievable through a bounded consolidation pass; most corrections are already specified in the TRD Consolidation Audit |

## 3. Audit Scale

| Item | Count |
| --- | --- |
| Documents inspected | 35 markdown files (6 root, 11 PRD, 18 TRD incl. TRD consolidation audit) + 1 uploaded audit brief |
| Unreadable files | 0 (one non-document file: `.DS_Store`, skipped) |
| P0 — Freeze blockers | **4** |
| P1 — Must fix before implementation | **10** |
| P2 — Must resolve before relevant phase | **8** |
| P3 — Editorial / maintainability | **10** |
| External dependencies (grouped findings) | **6 groups** covering ~45 individual open decisions/dependencies (10 product, 12 technical, 7 provider, 6 legal, 15 assumptions, plus suite-level gaps) |

Full detail: `11thONUS_DOCUMENTATION_AUDIT_FINDINGS_REGISTER_2026-07-16.md`.

## 4. Authoritative Candidate Set

The Version 1.0 authoritative suite should be built from:

1. `1_11thONUS Platform Constitution.md` — authoritative candidate (highest governance)
2. `PRD/PRD0` – `PRD/PRD10` — authoritative candidates (product behavior), subject to ID renumbering and terminology normalization
3. `TRD/TRD1-7` – `TRD/TRD23` — authoritative candidates (technical implementation), subject to the corrections already listed in the TRD Consolidation Audit
4. `2_Commerce Knowledge Standard.md` — supporting standard (needs editorial cleanup)
5. `11thONUS Knowledge Studio.md`, `11thONUS Rules Studio.md` — supporting standards (Rules Studio plan-name examples must be marked non-authoritative)
6. `TRD/TRD#_Consolidation and Consistency Audit.md` — working consolidation instrument (input to the freeze, not part of it)

**To be classified Historical/Superseded:** `11thONUS Product Definition.md`, `11THONUS-data-model.md`.

**Missing expected documents:** Vision & Product Strategy, Platform Standards Manual, Platform Design System, Engineering Standards, Operational Playbooks, API & Integration Guide, Decision Register, Requirements Traceability Register, Business Rules Catalogue (referenced by PRD0 §14.5 and PRD2 §18 but absent).

## 5. Strongest Areas

- **Customer verification model** — defined identically in Constitution (Pillar Two), PRD0 §14, PRD4, PRD5, TRD10, TRD11, TRD22; no actor exemption anywhere in the current-generation documents.
- **Offline policy** — remarkably consistent across TRD8 §8.11, TRD16 §16.23–16.26, TRD22 §22.33, TRD23 §23.19 and the TRD Consolidation Audit §12: only Purchase Record queueing offline; verification, redemption, payment and administration require online confirmation.
- **MVP scope discipline** — TRD22 gives an explicit deferred-feature list, scope-protection rule, phase plan (0–16) and exit gates; PRD0 §19.2 exclusions align with it.
- **Data architecture** — TRD10 cleanly separates authoritative records from projections, prohibits client writes to authoritative records, mandates integer minor-unit money, UTC timestamps, schema versions and idempotency.
- **Security architecture** — layered authorization (TRD12), deny-by-default rules, App Check, administrator MFA, no-direct-write policy consistent with DAP-003 and TRD22 launch NFRs.
- **Localization** — EN+FR launch requirement and Kirundi/Swahili/Kinyarwanda architecture-readiness stated consistently in CKS, TRD13, TRD22, TRD23.

## 6. Weakest Areas

- **Document status governance** — no document carries a Superseded/Historical label; the two legacy root documents read as authoritative.
- **Requirement identification** — colliding prefixes (FR-RP ×3, OP ×2, AP ×2 meanings), no suite-wide registry, PRD4/PRD9 functional requirements partly unnumbered.
- **State models** — PRD state names (Current/Historical, Draft/Recorded, Reward "Historical") diverge from the canonical TRD state models; TRD10's subscription enum omits four canonical states.
- **Commercial definitions** — plan names (Entry/Mid/Advanced vs Starter/Growth/Professional vs Bronze/Silver/Gold), plan basis (loyalty products vs Reward Programs), staff limits, trial rule all unresolved.
- **Governance hierarchy** — Constitution Part VII and TRD23 §23.3 list different document hierarchies.
- **Missing companion documents** — Decision Register, Engineering Standards and traceability register are prerequisites the TRD itself imposes before implementation.

## 7. Top Ten Required Actions

1. **Label `11thONUS Product Definition.md` and `11THONUS-data-model.md` as Superseded/Historical** with a header note pointing to PRD0/PRD4/PRD5 and TRD10 (DOC-P0-001, DOC-P0-002). Safe, immediate, no product decision needed.
2. **Record the reward threshold canonically once** — requiredVerifiedUnits = 10, fixed in MVP, "Every 11th, on us" as the customer promise — and remove/annotate every conflicting representation (DOC-P0-003).
3. **Apply the final 15-domain ownership model** (TRD23 §23.7) to TRD1-7 Chapter 4/6 and the TRD10 collection matrix (DOC-P0-004).
4. **Renumber colliding requirement IDs** using unique prefixes (e.g., PRD1 authorization → FR-AUTH-xxx; PRD10 RBAC → FR-RBAC-xxx; TRD20 OP → FR-OPS-aligned or OR-xxx), preserving old IDs in a mapping table (DOC-P1-001).
5. **Normalize state models suite-wide** to the canonical tables in the TRD Consolidation Audit §7, and correct TRD10's subscription status enum (DOC-P1-002/003).
6. **Create the Decision Register** from TRD23 (OPD-001..010, OTD-001..012, provider table, LCD-001..006) plus the PRD open questions and suite-level decisions identified in this audit (see Open Decisions extraction file).
7. **Resolve the plan-capacity definition** — limits counted in active Reward Programs, not "loyalty products" — and propagate to PRD0 §18/PRD3 §9 (DOC-P1-005).
8. **Resolve the batch-rejection contradiction** — PRD0 §14.3 permits rejecting selected purchases in bulk; TRD23 §23.13 requires individual rejection with reasons (DOC-P1-006).
9. **Reconcile the governance hierarchy** between Constitution Part VII and TRD23 §23.3, and decide whether a Vision & Product Strategy document will exist (DOC-P1-008).
10. **Create the missing Business Rules Catalogue content** (pending-purchase expiry, reminder defaults) or formally relocate those defaults into Rules Studio typed rules (DOC-P1-009).

## 8. Recommended Next Step

Run a **single consolidation pass** in this order: (1) safe editorial labelling of superseded documents; (2) canonical glossary freeze; (3) requirement-ID renumbering with mapping table; (4) state-model and domain-ownership normalization; (5) Decision Register creation; (6) traceability register initialization; then re-audit and freeze. The full sequence, with dependencies, is in `11thONUS_DOCUMENT_CONSOLIDATION_AND_ALIGNMENT_PLAN_2026-07-16.md`.

Do **not** begin implementation planning or coding-agent work packages until actions 1–5 are complete — under the TRD's own rules (TC-004, TC-006, §23.36, §23.37) the current baseline would force agents to guess.
