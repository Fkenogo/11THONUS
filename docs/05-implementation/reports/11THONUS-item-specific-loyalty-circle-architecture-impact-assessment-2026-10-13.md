# 11THONUS — ITEM-SPECIFIC LOYALTY CIRCLE ARCHITECTURE IMPACT ASSESSMENT

**Date:** 2026-10-13  
**Assessment baseline:** Product PR #307 head `42211cfb9bfcc4483a4251c43c46f34f69860ae`  
**Phone Preview PR #310 reference:** `190b3a6ece9af04a4210f34569260425b681f5f0` (not modified)  
**Scope:** Documentation and read-only architecture assessment. No implementation is authorized by this report.

## Executive finding

Founder decision `FD-LOY-ITEM-CIRCLE-001` establishes one independent Loyalty Circle for each qualifying item within a Reward Programme. The product-level rule is clear; no additional Founder decision is needed to define item identity or preserve multi-item Programmes. Current PostgreSQL loyalty keys and engine operations are programme-scoped, so the implementation cannot isolate two qualifying items. Purchase Records already have immutable-at-command-boundary structural `qualifying_item_id` and version/item-label snapshots. Verified Units, streams, cycles, allocations, and reward entitlements do not carry item identity. Correcting the engine requires schema, transaction, reward, redemption, read-model and experience changes.

Historical feasibility cannot be proven from repository contents alone. The schema explicitly permits legacy Purchase Records with null `qualifying_item_id` (migration 0018); no target database inventory, production-vs-preview environment attestation, or verified backup/reconstruction evidence was available in this task. Existing pooled cycle allocations cannot safely be split merely by inspecting current totals. Therefore the final verdict is **BLOCKED — HISTORICAL DATA MIGRATION AMBIGUITY** until environment and row-level reconciliation establish whether any persisted ambiguous history exists and obtain an explicit disposition for it.

## Assessment strategy and boundaries

The working checkout was an isolated clean managed worktree detached at PR #307's supplied head. Governing documents were audited before implementation files. The current code/schema were then inspected read-only. The dirty phone-preview checkout, PR #307 worktree, PR #310 worktree, preview runtime, and historical worktrees were not edited. The only changes in this assessment worktree are this report, the Founder decision evidence, the Decision Register entry and count, the change-log entry, and a narrow canonical-reference correction to state item-specific 10+1 and current-Circle scope.

## 1. Governing-document conflict matrix

| Document / decision | Current statement | Compatible? | Change required? | Why |
|---|---|---:|---|---|
| `canonical-reference.md` §2, §4, §8 | Previously stated one active/reward-available Cycle per Customer per Programme; glossary omitted item scope | Compatible after this task | Yes — narrow update made | It stated the pooling key as a product invariant; now defines the boundary as Programme + item and points to FD-LOY-ITEM-CIRCLE-001. |
| PRD 00 Product Foundation | Ten verified qualifying units produce the reward; multi-unit Purchase can create multiple Verified Units | Compatible but underspecified | Clarify in later alignment | It does not mandate pooling. |
| PRD 04 Customer-Verified Loyalty | Verified units and Customer-controlled verification/trust | Compatible | No trust change; add item detail in alignment | No conflicting item-pooling decision found in inspected passages. |
| PRD 05 Purchase Verification | Whole Purchase Record verification and immutable verification provenance | Compatible | Clarify item identity in alignment | One Purchase's item and quantity are already captured; verification remains all-or-nothing. |
| PRD 06 Reward Programs and Loyalty Cycles | Programme defines qualifying/reward terms; ten units per Cycle; overflow waits for redemption | Ambiguous at item granularity | Yes | Its existing Cycle language does not separate items; current implementation interpreted it programme-wide. |
| `DEC-LOY-016` / `FD-REWARD-QUALIFYING-ITEM-001` | Businesses define one or more qualifying items; a Programme Version can bind multiple items; classification is optional | Compatible | No; preserve | Multiple items are explicitly retained. No pooling instruction is present. |
| `DEC-LOY-017` / qualifying-item role authority | Owner/Manager manage; Staff may select; Platform Administrator has no routine item authority | Compatible | No | Role semantics are independent of Circle key. |
| `DEC-LOY-018` / redemption authority | Permission-based, current-authority redemption, exactly once; existing authority path | Compatible | No permission redesign; structural changes required | Redemption must target the item-bound reward/cycle. |
| DEC-LOY-008 / FD-PVL-002 and redemption continuation clarifications | Programme-scoped stream, one current Cycle, pending overflow forward allocation | Conflicts structurally, not as explicit item Product Truth | Yes | Existing policy assumes a single stream/current slot and pending queue per Programme. Item scope splits each such stream. |
| Platform-baseline-011 qualifying-item correction/design report | Establishes business-owned qualifying-item entity; older gap report says Circle engine did not retain item identity | Compatible | Superseded by implementation state for Purchase; downstream findings remain | Earlier report predates PB-013B/C Purchase binding. It correctly anticipated missing engine binding. |
| Rules Studio | Governed typed business behavior; no rule-language ownership of reward identity | Compatible | No | Does not authorize pooling. |
| TRD10 §10.9.2 and schema annotations | Multi-item Version OR qualification; purchase stores qualifying item and frozen item label; published bindings immutable | Compatible | Extend downstream schema and Cycle scope | “OR” qualifies a Purchase as belonging to one of the allowed items; it does not mean combine their progress. |
| TRD11 verification, pending allocation and redemption sections | Threshold allocation; pending units; cycle close/open and forward allocation | Conflicts by omitted item scope | Yes | Each path and lock key must add the qualifying-item dimension. |
| TRD22/23 scope and traceability | 10-unit threshold and migration/test completion obligations | Compatible but underspecified | Yes, trace future work | No explicit authorization to pool was found. |

**Findings:** A) `DEC-LOY-016`, version bindings, Purchase identity, frozen snapshots, and historical immutability support item-specific identity. B) Later architecture/code applied item identity to Programme Version and Purchase Record but retained Programme-only stream/cycle logic, creating the pooling consequence. C) No inspected Founder decision positively authorized pooling. D) Pooling is an implementation consequence, not an approved product rule. `DEC-LOY-019` records the new boundary.

## 2. Authoritative terminology

- **Reward Programme:** Business-defined grouping/container with versioned qualification and reward terms; may contain one or more qualifying items.
- **Qualifying Item:** Stable Business-owned identity eligible under a particular Programme Version. The Programme Version junction stores the immutable binding and frozen name snapshot.
- **Verified Unit:** A verified quantity credit from one Purchase Record, for one Customer, Business, Programme, Programme Version and one qualifying item. Existing representation is one credit row with `quantity`, not one row per unit.
- **Loyalty Circle:** One Customer's earn-and-redeem progression for one qualifying item within one Programme. It owns the item-specific sequence, 0–10 progress, reward-available/redeemed transitions, and pending item units.
- **Reward:** Immutable entitlement for the qualifying item and Circle that reached threshold, with reward description/quantity snapshotted from the Circle's governing Programme Version.
- **Purchase Record:** Immutable transaction record with Programme, creation-time Programme Version, qualifying item ID, frozen item label, and quantity. The current `qualifying_item_id` column remains nullable for legacy records.
- **Reward Programme Version:** Published immutable terms/binding snapshot. New qualification changes produce a new Version; existing Purchases and Cycles retain their governing snapshots.

Validated conceptual ownership is Business → Programme → Version → qualifying-item binding. Qualifying Items are Business-owned identities referenced by that binding, not children recreated on each Version. Customer progression is separately scoped by Business + Customer + Programme + Qualifying Item. No new domain entity is needed; the existing Loyalty Cycle can represent the Circle.

## 3. Purchase and Verified Unit model

`purchase_records.qualifying_item_id` was added by migration 0018 and is populated by current write commands. The repository maps it structurally; `item_label` is server-derived display evidence. The composite FKs constrain the item to the Purchase's Business and exact Programme Version. `reward_program_version_id` is immutable and remains the authoritative version snapshot. Names can change on the current Qualifying Item entity; the Purchase's `item_label` and Version's `item_name_at_version` are display snapshots, never identity.

`quantity` is a positive integer. Verification issues one Verified Unit credit row per Purchase, with `quantity` copied to the row. For `qualifyingItemId=blow_dry, quantity=3`, preserve existing semantics: one credit row with quantity 3, attributed to that one item. Allocation positions may split quantity across Cycle capacity while preserving conservation. Do not make three Verified Unit rows absent a separate decision.

Gap: `verified_units` has no qualifying-item column. Its composite FK ties it to Purchase by Business/Customer/Programme/Version but omits item. Repository input likewise omits `qualifyingItemId`. Safest design is to add `qualifying_item_id` to Verified Units and an integrity constraint tying it to the originating Purchase's exact item and Programme Version binding. Continue retaining `purchase_record_id` as immutable provenance; do not infer item identity only at query time. This gives audit, query, reversal, and allocation paths an explicit, indexed and relationally verified key. Reversal rows inherit the original credit's item identity and must be constrained to it.

## 4. Cycle stream, sequence and allocation

Current `loyalty_cycle_streams` primary key is `(business_id, customer_identity_id, reward_program_id)`. `loyalty_cycles` references that key, has a unique sequence per Customer+Programme, and a partial unique index allowing one `active`/`reward_available` Cycle per Customer+Programme. `ensureAndLockCycleStream` inserts/locks that one parent before mutations. This serializes all items in the Programme and prevents separate current Circles.

Target key is `(business_id, customer_identity_id, reward_program_id, qualifying_item_id)`. The stream sequence counter and uniqueness boundary become item-local. Cycles need a qualifying-item column, composite FK to their stream, unique sequence within item stream, and the current-Cycle partial unique index scoped by item. Existing `opened_under_version_id` remains, with a constraint proving that Version includes the Cycle's item.

Different-item verification can then lock distinct stream rows concurrently. Same-item verification still serializes on its stream lock; insertion conflict handling and row locking remain the concurrency guarantee. Deterministic lock ordering must be updated consistently: idempotency → Purchase → item stream → Cycle → reward → appends. Any operation locking multiple item streams (likely redemption only one; bulk reporting read only) orders by the complete composite key to prevent deadlocks. Sequence numbers should be per item Circle stream, not shared across Programme items.

Allocation positions currently copy programme/version and link to a Cycle or pending state. Add qualifying-item identity or prove it unambiguously via Verified Unit; explicit copied identity plus composite FKs is recommended for durable enforcement. Pending index/list and forward-allocation queries must scope by item. With item-scoped pending positions, redeeming Blow-dry closes only its reward-available Cycle, opens its next Cycle, and allocates only Blow-dry overflow. Hair Wash's 7/10 allocations remain unchanged. Under current shared stream/current Cycle and pending queue, this separation cannot be guaranteed: one item's units consume the same 0–10 capacity, reward slot and pending allocation order as the other.

## 5. Rewards, redemption and reversals

Rewards currently store Programme, Version, Cycle, Customer and description, with unique one Reward per Cycle and FKs to Cycle and its governing Version. Binding to an item-specific Cycle is structurally sufficient only after Cycle includes `qualifying_item_id` and the Version/item binding is constrained. For defense in depth and direct reporting, add explicit `qualifying_item_id` to Reward with composite FK to Cycle; snapshot the item name from the Cycle's governing Version. Description remains the frozen reward term; it does not replace item identity.

`confirmRedemption` already resolves scope server-side, verifies live permission at the mutation boundary, locks stream → Cycle → Reward, uses idempotency plus conditional transition and one-redemption uniqueness, closes the completed Cycle, opens the next and forwards pending positions in one transaction, then writes trust and notification outbox records. Preserve Owner floor, Manager default/revocable, Staff explicit grant, Customer no authority, online mutation-time permission, exactly-once behavior, and no Purchase generated by redemption. Add item to scope resolution/locks/FKs and use the redeemed Reward's item-bound Cycle throughout. Trust events and notifications already identify Reward/Cycle or Purchase/Verified Unit; item identity should be included in event payload/projection where present, while immutable subject links remain authoritative. Customer notification wording should name the item based on frozen snapshot.

Reversal UI/writer is absent. Existing immutable reversal shape references an original Verified Unit and correction Purchase. Future reversal must inherit and constrain item identity from original credit, reverse only allocations of that item, recalculate only its Circle/reward under the item stream lock, preserve append-only audit, and define behavior for already redeemed rewards separately before enabling correction. No current implementation change here.

## 6. Versioning and lifecycle

- **Add item:** publish a new Programme Version binding the new stable qualifying-item ID; existing Circles/history stay on their original item/version. New item starts a distinct stream on first credit.
- **Remove/retire item:** future Version omits it; retired identity and historical bindings/Circles remain. New Purchases cannot use it under a Version that omits it; existing pending records remain valid under their creation Version per `DEC-PROD-014`.
- **Rename item:** keep stable ID; publish/snapshot new version name as governed. Historical Purchase labels, version snapshots, Circle opening/governing Version and reward snapshots remain stable. Never use mutable current item name as a key.
- **Reward description change:** new Programme Version; an existing Cycle/Reward remains governed by its own version snapshot, subject to existing empty-Cycle first-allocation adoption semantics.
- **Retire Programme:** preserve all historical item Circles and rewards; existing redemption/trust policy applies. No destructive cascade.

The existing design already freezes qualifying-item bindings and names at published Version. Cycle's item ID must be stable independently of its opening Version; its governing Version must be a Version containing that item. A continuation Cycle opened empty may provisionally retain the prior version and adopts the first allocated unit's version only when that Version includes the same item.

## 7. Read models and role boundaries

Customer overview/Circle list/detail should group under Programme then item, returning separate progress values (e.g. Blow-dry 9/10 and Hair Wash 4/10), item label snapshot, item-specific reward and activity. Programme-level pooled `13/10` is invalid. Activity, Purchase detail and rewards must carry/display frozen item identity. Add item to cursor/sort keys for deterministic pagination.

`getCounterCustomerContext` currently returns per-Programme data and a programme-level progress/reward projection plus awaiting Purchase totals. Minimum contract: nested item/Circle rows under each Programme, each with `qualifyingItemId`, item display snapshot, progress/reward state, pending or waiting status as appropriate, and an Add Purchase action context bound to `(rewardProgramId, qualifyingItemId)`. The Purchase command must validate the pair against the locked active Version. Do not widen Staff customer lookup or disclose unrelated Businesses/Customers.

Business progress, available Reward, Owner/Manager dashboard and reports must group and paginate by item/Circle; join rewards to the correct item Cycle; preserve existing role/permission gates. Item IDs do not change permissions. Existing tenant scope and customer identity predicates remain mandatory in every query.

## 8. Commercial model impact

Loyalty identity and commercial consumption are separate. Current WP-COM model counts commercial consumption, admission and Circle 10+1 commercial units through dedicated commercial tables/projections. Item-specific Loyalty Circles increase the number of loyalty streams; this does not itself define new billable commercial units or pricing. Before implementation, verify admission gate's “new Cycle start” semantics when a Programme contains several item Circles: capacity must apply to the commercial unit established by WP-COM, and a first item Circle may count as a start according to existing rules. Pending admission remains associated with verified Purchase and its item but cannot create or pool Circle units before admitted. Do not modify WP-COM or infer that every new item Circle is separately billable without tracing the commercial ledger contract. No commercial conflict was found in the examined schemas; integration impact requires focused review in implementation design.

## 9. Persisted-data feasibility

Current repository schema is not proof of deployed environment state. Migration 0018 intentionally leaves `purchase_records.qualifying_item_id` nullable for legacy rows. On PR #307 code, newly recorded Purchases carry IDs, but no database inventory or production/preview attestation was available. Even where every Purchase has an item ID, a historical shared Cycle can be deterministically split only by replaying verified credits, reversals, and allocations in authoritative order and reconciling earned/redeemed Rewards and pending positions. Existing Cycle totals alone are insufficient.

Recommended preflight: inventory every environment, freeze a consistent backup, count NULL item IDs and missing/invalid Version bindings, join every credit/reversal to Purchase, reconcile unit conservation and allocation events, map each Cycle/Reward/redemption to per-item ordered credits, identify cross-item pooled thresholds, and classify idempotency/retry records. Null-item or inconsistent legacy records are ambiguous and must not be guessed from `item_label` or mutable current names. If no deployed business/customer data exists, prove that through environment attestation and retain only explicitly test-only fixture reset/reseed. Otherwise require a Founder-approved row-level disposition before migration. Rebuild item streams/cycles only from proven evidence; preserve Reward/redemption IDs and audit links where a one-to-one mapping exists, and record any split as migration provenance. Existing idempotency hashes must not be silently reused for a different item-bound request; preserve old keys/replay responses and version new request hashes or perform an explicit compatibility mapping.

Test fixtures should be rebuilt only after separate authorization; no preview seed was changed here.

## 10. Backward compatibility, security and performance

| Surface | Classification | Required change |
|---|---|---|
| DB schema and indexes | BREAKING internal | Add item columns/FKs and widen keys/unique indexes; staged migration and data reconciliation required. |
| Repository/domain types and command internal params | BREAKING internal | Carry item identity through credit, stream, Cycle, allocation and reward paths. |
| Existing record-purchase request | ADDITIVE or breaking by adapter | Item already required in current write path; preserve validation, expose stable identity in all consumers. |
| Read DTOs/web adapters | BREAKING | Replace Programme pooled progress shape with nested item Circles; update pagination and callers atomically. |
| Preview seed and fixtures | BREAKING | Multiple items need distinct independent progress and item-bound Purchases; defer until authorized. |
| Tests/reporting | BREAKING | Re-key aggregations and reports; retain historical migration assertions. |
| E2E selectors/localization | ADDITIVE plus behavior change | Scope selectors to item rows; add EN/FR strings and assertions. |

Security: no new actor authority is required. Stable item IDs are not secrets; responses remain tenant-scoped and customer-owned, Staff context stays bounded to the resolved customer and authorized Business, and no directory/search or reward probing is added. Composite FKs and server-side Programme-Version membership checks prevent fabricated/cross-Business item IDs. Avoid leaking other items' rewards or counts through failure messages.

Performance/index impact: add item to stream PK and lookup, current Cycle partial unique index, sequence unique constraint, allocation pending index/list, Verified Unit customer/program/item history index, Customer overview, Business progress/reward list indexes, and Staff Counter projection. Keep indexes aligned with tenant and cursor predicates. Item circles increase row counts roughly with active qualifying items per Customer/Programme, but query shape remains indexed point lookups plus bounded lists; avoid premature denormalized aggregates. Review EXPLAIN on representative queries after implementation, not as a blocker to this architecture.

## 11. Target domain model and uniqueness boundaries

```text
Business
└── Reward Programme
    ├── Reward Programme Version
    │   └── VersionQualifyingItem(binding, frozen item-name snapshot)
    └── Qualifying Item (stable Business-owned identity)
        └── Customer Loyalty Cycle Stream
            key: Business + Customer + Programme + Qualifying Item
            └── Loyalty Cycle (Circle; item + governing Version)
                ├── Verified Unit Allocation Positions (allocated/pending)
                └── Reward (item-bound, Cycle-bound, version-term snapshot)

Purchase Record (Business + Customer + Programme + Version + Qualifying Item + quantity)
└── Verified Unit credit (one row per Purchase, quantity preserved)
    └── Allocation positions → the same item's Circle only
```

Identity constraints: stream PK `(business_id, customer_identity_id, reward_program_id, qualifying_item_id)`; Cycle sequence unique within that tuple; at most one `active`/`reward_available` Cycle for that tuple; one Reward per Cycle; allocation FK proves unit item equals Cycle item; Purchase unique credit remains one per Purchase. Version binding unique `(reward_program_version_id, qualifying_item_id)` and existing Business ownership integrity remains. Exact migration constraint names and FK arrangement belong to implementation design.

## 12. Required future test matrix

| Case | Proof |
|---|---|
| A/B | Blow-dry + Blow-dry increments Blow-dry only; Blow-dry + Hair Wash never mix. |
| C/D | Quantity >1 remains one quantity-bearing credit; same Programme gives two independent Circles. |
| E/F/G | Threshold creates right-item reward; redeem A leaves B unchanged; pending overflow stays item-scoped. |
| H/I | Concurrent different items proceed independently; same-item concurrent verification serializes and allocates exactly once. |
| J | Reversal/correction changes only the original item's Circle, where supported. |
| K/L | New Version binding changes and retired item preserve historical identity and reward terms. |
| M/N/O | Customer, Staff Counter, Owner/Manager reads group by item and retain tenant/permission boundaries. |
| P | EN/FR item-specific progress, reward, empty, pending and redemption states. |
| Q | Migration reconstruction, null/ambiguous history fail-closed handling, idempotency compatibility, and reconciliation conservation. |

## 13. Packaging and repository coherence plan

1. **Authority and docs alignment:** complete governing PRD/TRD/canonical-reference corrections against this decision; retain no pooling language.
2. **Schema/provenance:** migration adds Verified Unit item binding and widens streams/Cycles/allocations/rewards with composite integrity constraints and indexes; include preflight/rollback plan.
3. **Credit issuance:** propagate Purchase item to credit and allocation; preserve one row with quantity and conservation; no legacy request bypass.
4. **Item-scoped stream/allocation:** lock, sequence, current-Cycle invariant, pending overflow and forward allocation all use item key.
5. **Reward and redemption:** bind Reward to same item/Cycle; update atomic redemption and notification/trust context under item locks.
6. **Read model contracts:** customer, staff counter, business progress/reward, purchase/activity DTOs and web adapters change together.
7. **Experience and localization:** item-specific UI/read states and EN/FR only after contract is stable.
8. **Preview/test fixture migration:** separately authorized; new multi-item examples and regression coverage.
9. **Historical reconciliation/migration:** environment-specific, backup-gated, fail-closed and auditable; do not mix with feature rollout unless same atomic release boundary can be proven.
10. **ITR:** only after implementation packages, migration validation, required tests and review; currently paused.

Repository coherence rule: do not merge an intermediate package in which writes create item-aware credits but reads/cycles remain programme-pooled, or vice versa. Land schema plus all dependent transaction writers/readers as one feature boundary or use a strictly compatible expand/backfill/contract rollout with old behavior fenced off. PR #307/#310 remain open and unchanged pending a separately authorized implementation plan; no branch changes are proposed here.

## 14. Risk classification

| Priority | Risk |
|---|---|
| P0 | Cross-item progress/reward remains possible if Circle, allocation or pending keys omit item. |
| P0 | Historical mixed Circle cannot be split safely without row-level provenance and explicit disposition; incorrect reconstruction loses units or misassigns earned/redeemed reward. |
| P1 | Duplicate/missing rewards from races if item-specific stream locking and partial unique indexes are not aligned. |
| P1 | Reward/Cycle/item mismatch or Version drift if reward binding uses mutable current item data. |
| P1 | Old idempotency hashes/replays can return a Programme-level response after contract changes unless compatibility is handled. |
| P1 | Read DTO leakage or wrong item grouping across tenant, Customer, Staff or Business boundaries. |
| P1 | Commercial admission/consumption side effects if every item stream start is accidentally treated as a separately billable unit. |
| P2 | Increased row/index volume and pagination instability; manageable with composite indexes and stable cursors. |
| P2 | Localization or preview assertions remain misleading if fixtures are updated before the new model is consistent. |
| P3 | Display-label drift if consumers ignore frozen Version/Purchase snapshot and show mutable current names for history. |

## 15. B3, gate status and decision readiness

**B3 UX CORRECTIONS — PAUSED.** Reason: **ITEM-SPECIFIC CIRCLE PRODUCT TRUTH RECONCILIATION REQUIRED.** Programme fixture/card corrections tied to Circle semantics and Founder unified regression must wait for architecture review and separate implementation authorization. Other identified issues (Invalid Date, header simplification, Needs Attention, Add Purchase scroll/focus, translation/browser diagnosis) remain identified but paused so testing does not target a changing loyalty model.

No unresolved Founder Product Truth decision remains for item-specific Circle identity. Environment and row-level historical data classification remains unresolved and is not a Founder semantics question; implementation authorization should follow only after that evidence/disposition is complete. Do not start ITR, Slices C/D/E, runtime/schema/fixture implementation, or merge work under this assessment.

## 16. Required report register

1. **Files modified:** this report; Founder decision evidence; Decision Register (`DEC-LOY-019` and counts); `canonical-reference.md` §§2/4/8; `documentation-changes-log.md` Entry 304.
2. **Code diff summary:** no runtime or schema changes; documentation only.
3. **Commands executed:** `pwd`, `git status --short --branch`, `git worktree list --porcelain`, `rg --files`, `rg -n`, `sed`, `cat`, `git rev-parse HEAD`, and managed worktree status checks. No test/build command.
4. **Dependencies added:** none.
5. **Config changes:** none.
6. **Risks:** §14.
7. **Rollback:** revert the five documentation files in this isolated worktree (or revert this documentation commit if separately committed); no data/runtime rollback required. Preserve pre-existing primary-checkout changes.
8–10. **Report / change tracking / Founder decision:** this report; change log Entry 304; decision evidence plus `DEC-LOY-019`.
11–12. **Conflict matrix:** §1.
13–17. **Definitions and current/target relation:** §§2–4 and §11.
18–24. **Purchase, Verified Unit, stream, allocation, reward, redemption, reversal:** §§3–5.
25–29. **Versioning and customer/staff/business reads:** §§6–7.
30. **Commercial model:** §8.
31–32. **Migration feasibility and ambiguity:** §9.
33. **Compatibility:** §10.
34. **Security/privacy:** §10.
35. **Performance/indexes:** §10.
36. **Tests:** §12.
37–38. **Target diagram/keys:** §11.
39–40. **Package sequence/coherence:** §13.
41. **Risks:** §14.
42. **B3:** §15.
43–45. **PR #307 unchanged; PR #310 unchanged; ITR paused:** baseline references above; no PR worktrees touched; ITR not started.
46. **Unresolved Founder decisions:** none for this product truth; historical-data disposition is unresolved pending environment evidence.
47. **Recommendation:** do not authorize implementation until historical environment inventory and reconstruction feasibility are proven; then authorize a separately scoped implementation package sequence.

**Final verdict: BLOCKED — HISTORICAL DATA MIGRATION AMBIGUITY**
