# FD-REWARD-QUALIFYING-ITEM-001 — Phase 1 Business-Defined Qualifying Items

> **Title:** FD-REWARD-QUALIFYING-ITEM-001 — Founder Decision: Phase 1 Business-Defined Qualifying Items
> **Version:** 1.0 · **Status:** Founder-approved evidence record · **Classification:** Working (governance record)
> **Governing document:** 11thONUS Platform Constitution
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/FD-REWARD-QUALIFYING-ITEM-001-founder-decision-2026-09-18.md`
> **Decision date:** 2026-09-18 · **Approved by:** Founder (Kenogo)
> **Decision Register representation:** [`DEC-LOY-016`](../decision-register.md) (see §5 below for why this decision is NOT recorded as `DEC-LOY-014`/`DEC-LOY-015`)
> **Preceding authority:** `FD-REWARD-QUALIFICATION-001` (2026-09-17, Reward Program Category made non-mandatory) and its implementation, `PLATFORM-BASELINE-010B` (merged, PR #257)
> **Preceding analysis (this task):** `PLATFORM-BASELINE-011-REWARD-QUALIFYING-ITEM-001` (design report, companion to this file)

## 1. Context

`PLATFORM-BASELINE-010B` implemented `FD-REWARD-QUALIFICATION-001`/`DEC-LOY-014`: a Reward Program no longer requires a Reward Program Category, and Business Type/category relationships are discovery assistance only. That correction left one requirement fully in place: every qualifying node persisted on a Reward Program Version (`reward_program_version_qualifying_nodes.knowledge_node_id`) must resolve, at both draft-add-time and publish-time (`validateQualifyingNodes` in `rewardProgramKnowledgeValidation.ts`), to an existing, `active`-status, canonical Commerce Knowledge `standard_product` or `standard_service` node. A further correction (`PLATFORM-BASELINE-010B-CORR-001`) added `assertHasQualifyingNodeForPublish`, which rejects publication of any version with zero qualifying nodes.

The Commerce Knowledge seed manifest (`burundiPilotSeedManifest.ts`) seeds zero `standard_product`/`standard_service` nodes anywhere in the repository (confirmed by direct inspection: every seeded node is `industry`, `business_category`, or `business_type`). The combined effect is that no Reward Program can be published in any environment using only the shipped seed content — not because of the Category gate (already corrected), but because the qualifying-node identity itself has no canonical content to point at. This blocks every realistic Phase 1 example (Black Coffee, Medium Pizza, Premium Haircut, Sedan Wash), since none of these have a seeded canonical node, and Commerce Knowledge is deliberately platform-curated (Commerce Knowledge Standard Part III: businesses select from the six fixed levels, they do not create entries in them).

`businessDisplayName` on a `QualifyingNode` (`{knowledgeNodeId, businessDisplayName}`) is presentation-only metadata layered on top of a required canonical `knowledgeNodeId` — it cannot by itself represent a Business-defined item, because the schema (`reward_program_version_qualifying_nodes.knowledge_node_id TEXT NOT NULL`) and the domain validation (`validateQualifyingNodes`) both require a real, resolvable canonical id regardless of whether `businessDisplayName` is populated.

This left a second authority conflict, distinct from the one `FD-REWARD-QUALIFICATION-001` resolved: standing documentation (PRD6 §4.2/§4.3, Commerce Knowledge Standard Part VIII, TRD10 §10.9.2) treats canonical `standard_product`/`standard_service` mapping as the qualification authority itself, not merely an optional classification of a Business-authored qualification. The Founder's actual Phase 1 intent is that a Business defines its own qualifying item directly. This record resolves that conflict.

## 2. Founder Decision

For Phase 1 of 11thONUS:

1. Each participating Business defines the specific product or service item(s) that qualify for its Reward Program.
2. A Business-defined qualifying item is sufficient to participate in the 11thONUS 10+1 mechanism and does not require a corresponding Commerce Knowledge `standard_product` or `standard_service` node.
3. A Reward Program must contain at least one qualifying item before publication and may contain multiple qualifying items.
4. Commerce Knowledge mapping may optionally classify a Business-defined qualifying item for platform purposes including normalisation, reporting, analytics, discovery, and future interoperability.
5. Such classification does NOT determine whether the Business may use the item as a qualifying item.
6. The Business remains responsible for defining its commercial offer.
7. 11thONUS remains authoritative over transaction verification, Verified Unit issuance, Circle progression, Reward issuance, and platform trust controls.
8. Existing canonical Commerce Knowledge references remain valid and may be retained.
9. This decision does NOT remove Commerce Knowledge; alter the 10+1 Circle mechanic; authorize configurable Circle thresholds; define redemption mechanics; authorize Commerce Knowledge seed content; alter Business Participation Terms; or alter customer verification/trust controls.
10. Commerce Knowledge seed content is NOT a prerequisite for Phase 1 Reward Program creation or operation.

## 3. Supersession boundaries (exact)

| Document | Provision superseded/clarified for Phase 1 | Provision NOT superseded |
|---|---|---|
| PRD6 §4.2 | "Qualifying Products or Services" as necessarily meaning a canonical Commerce Knowledge reference | §4.4 10+1 mechanic; "Product Category" bullet (already annotated non-mandatory by `FD-REWARD-QUALIFICATION-001`); all other §4/§5 provisions |
| PRD6 §4.3 | "Reward Product or Service" is unaffected — this decision concerns *qualification* only, not the Reward side of the program | Reward-side fields, `standardRewardNodeId` validation (`validateStandardRewardNodeReference`, unchanged) |
| Commerce Knowledge Standard Part VIII | "Each Reward Program maps to one or more standard products or services" as a mandatory mapping | The hierarchy itself; the worked example remains valid *when a Business chooses to map*; canonical `standard_product`/`standard_service` content itself is unaffected and remains platform-curated |
| Commerce Knowledge Standard Part III/VII/XIII | Any residual reading of the fixed hierarchy as the sole qualification path | The hierarchy as a classification resource; Industry/Business Category/Business Type levels; the curated Reward Program Category list; Standard Product/Service searchable catalogue as an optional aid |
| TRD10 §10.9.2 | `qualifyingKnowledgeNodeIds: string[]` as necessarily populated with canonical ids for qualification to exist | The rest of the `RewardProgramVersionDocument` schema; the Version Integrity Rule; the Threshold Rule |
| RTM `FR-RP-002` | "shall define qualifying products or services" as necessarily meaning canonical Commerce Knowledge products/services | The requirement's core intent (a Reward Program must define what qualifies) — satisfied by a Business-defined item, canonically mapped or not |
| RTM `FR-SRCH-002`/`FR-SRCH-003` | "mapping to canonical knowledge entries" / "reference standardized... qualifying products or services" as mandatory | The requirements' validity as *optional* classification/discovery capability, once built (still Phase 6/7, "Not yet defined") |

No other provision of PRD6, the Commerce Knowledge Standard, TRD10, or the RTM is superseded by this decision.

## 4. Relationship to `FD-REWARD-QUALIFICATION-001` / `DEC-LOY-014`

This decision does not re-litigate `FD-REWARD-QUALIFICATION-001`. That decision resolved the *Reward Program Category* gate; this decision resolves the *qualifying-node canonical-identity* gate. Both decisions agree that Commerce Knowledge remains part of the architecture and is never removed; both agree Business Type/category/canonical relationships are discovery/classification aids, never a qualification restriction. This decision extends the same principle one level deeper: the canonical `standard_product`/`standard_service` node itself is now also optional, not merely the Reward Program Category that sits above it in the hierarchy.

## 5. Decision Register numbering — disclosed discrepancy (not fabricated, not resolved)

Direct inspection of `origin/main`'s `docs/00-governance/decisions/decision-register.md` (this task's entry SHA, see the companion design report) found **no `DEC-LOY-014` row** — despite `DEC-LOY-014` being cited as already-recorded, settled Founder authority in the committed migration `functions/src/infrastructure/postgres/migrations/0015_reward_programs_category_optional.sql`'s own SQL comment, in `rewardProgramKnowledgeValidation.ts`'s code comments, and in the `PLATFORM-BASELINE-010B` implementation report. The Decision Register's own header history independently confirms this: the `PLATFORM-BASELINE-006-FD-CORR-001` and `PRODUCT-ALIGN-002-CORR-001` update notes both explicitly state "`DEC-LOY-014`/`DEC-LOY-015` remain not-activated references" / "do not exist as register entries." The highest row actually present in the table is `DEC-LOY-013`.

Separately, `DEC-LOY-015` is already cited (since 2026-07-18, in `docs/05-implementation/change-tracking/coding-agent-prompt-register.md`, itself a tracked, committed file) as "`CONFIRMED`" authority for an unrelated, older decision (`ENG-P7-003` — Reward creation/availability/staff-notification support) that also has no matching register row.

This means both `DEC-LOY-014` and `DEC-LOY-015` are already informally "spoken for" — one by `FD-REWARD-QUALIFICATION-001` (in committed code), one by an older, separate, unrecorded decision — even though **neither has an actual Decision Register row**. This is a genuine, disclosed traceability gap, structurally identical in kind to the long-standing `DEC-CKS-001`/`DEC-CKS-002` gap (first flagged `PLATFORM-BASELINE-009` §14) but is a **separate, newly-observed instance** of the same failure mode (code/reports citing register identifiers that were never actually committed to the register). This record does **not** fabricate, backfill, or silently resolve either the `DEC-LOY-014` or `DEC-LOY-015` gap — doing so is out of this task's authorized scope (this task is chartered only to record `FD-REWARD-QUALIFYING-ITEM-001`). To avoid worsening the collision, this decision is recorded as **`DEC-LOY-016`** — the next number after the highest number cited anywhere in the repository under this prefix (015), not merely after the highest number with an actual row present (013), mirroring the exact numbering-safety convention already established in this repository's own `PLATFORM-BASELINE-010B` implementation report §12 for an analogous gap in `documentation-changes-log.md`'s entry numbering.

**This gap remains open and unresolved by this record.** A future task should decide whether to backfill `DEC-LOY-014`/`DEC-LOY-015` as real rows (crediting `FD-REWARD-QUALIFICATION-001` and whatever `ENG-P7-003`'s actual authority was) or to formally retire those two numbers. Neither action is taken here.

## 6. DEC-CKS-001 / DEC-CKS-002 — status (reported again, not corrected)

Unchanged from every prior report. `DEC-CKS-001`/`DEC-CKS-002` remain cited elsewhere as settled Founder-approved authority with no matching entry in `decision-register.md`, `assumptions-register.md`, or `canonical-reference.md`. This decision does not rely on, invoke, reconstruct, or resolve either identifier. It is reported here for continuity, not corrected.

## 7. What this decision does not do

It does not implement any code, schema, or migration change. It does not seed Commerce Knowledge content. It does not build redemption or Reward/Cycle visibility. It does not alter the 10+1 mechanic, the fixed 10-unit threshold, Business Participation Terms, or transaction trust/anti-fabrication controls (idempotency, Trust Events, dispute workflows) — all of which are confirmed independent of Commerce Knowledge taxonomy (see the companion design report §F). The architecture correction required to give effect to this decision is assessed, not implemented, in `PLATFORM-BASELINE-011-REWARD-QUALIFYING-ITEM-001-ARCHITECTURE-CORRECTION-DESIGN-001`.
