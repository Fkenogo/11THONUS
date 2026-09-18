# PLATFORM-BASELINE-011-REWARD-QUALIFYING-ITEM-001 — Architecture Correction Design

> **Classification:** Design/assessment only. **No implementation code, schema, migration, seed content, redemption work, or Reward/Cycle-visibility work was created by this task.** No PR opened.
> **Date:** 2026-09-18 · **Performed by:** Claude (AI agent) · **origin/main SHA reviewed:** `308c80d7edeec6e3faf574756a561f689faa592c` (merge of PR #257, `PLATFORM-BASELINE-010B`/`-CORR-001`)
> **Governing decision:** [`DEC-LOY-016`](../../00-governance/decisions/decision-register.md) / [`FD-REWARD-QUALIFYING-ITEM-001`](../../00-governance/decisions/evidence/FD-REWARD-QUALIFYING-ITEM-001-founder-decision-2026-09-18.md) — recorded by this same task, not re-litigated here.

## Purpose

Produce the implementation-ready architecture-correction design for `FD-REWARD-QUALIFYING-ITEM-001`: allow a Business to define its own Reward-Program qualifying item(s) with no mandatory Commerce Knowledge canonical mapping, while preserving every trust/anti-fabrication control and every valid piece of PB-008/PB-010B work — without implementing anything.

---

## B. Current implementation trace (precise)

```
Business (apps/web RewardProgramManagementPage.tsx)
  → QualifyingNodeSelector (businessTypeId-scoped default list + search escape hatch)
      → emits QualifyingNodeWire[] = { knowledgeNodeId: string, businessDisplayName: string | null }[]
  → createRewardProgram / updateRewardProgramDraft / publishRewardProgramVersion callable
      → functions/src/index.ts (transport parsing — array of {knowledgeNodeId, businessDisplayName}, knowledgeNodeId required non-empty string)
      → createRewardProgramCommand.ts / createNextRewardProgramVersionCommand.ts / publishRewardProgramVersionCommand.ts
          → rewardProgramKnowledgeValidation.ts::validateAllReferences
              → validateQualifyingNodes(db, nodes)   ← for EVERY node: getKnowledgeNodeById(db, node.knowledgeNodeId)
                    - must exist in Firestore
                    - must be nodeType "standard_product" | "standard_service"
                    - must be status "active" (isEligibleForNewReference)
                    - THROWS invalidQualifyingNodeError if any check fails — THIS IS THE BLOCKER
          → publishRewardProgramVersionCommand.ts also calls assertHasQualifyingNodeForPublish(nodes) — throws if nodes.length === 0
      → PostgreSQL insert: reward_program_version_qualifying_nodes(reward_program_version_id, knowledge_node_id TEXT NOT NULL, business_display_name TEXT NULL), PK (version_id, knowledge_node_id)
          ← knowledge_node_id is schema-NOT-NULL: there is no row shape today that omits a "knowledgeNodeId"
  → Reward Program published (status "active", currentVersionId set)
  → Business records a Purchase (recordPurchaseCommand.ts)
      → RecordPurchaseRequest.itemLabel: string (REQUIRED, free text, no relationship to the program's qualifyingNodes at all)
      → RecordPurchaseRequest.knowledgeNodeId?: string | null (OPTIONAL, standalone; if present, independently re-validated via validateQualifyingNodes with the SAME canonical-node-must-exist rule — but never checked against the Reward Program version's own qualifyingNodes list)
      → PostgreSQL insert: purchase_records.item_label TEXT NOT NULL, purchase_records.knowledge_node_id TEXT NULL (no FK, no check against reward_program_version_qualifying_nodes)
  → verifyPurchaseCommand.ts
      → reads/writes Purchase status, Verified Unit issuance, Loyalty Cycle allocation
      → NEVER reads itemLabel, knowledgeNodeId, or qualifyingNodes at all (confirmed by direct grep — zero references)
  → Verified Unit / Loyalty Cycle / Reward creation (verifiedUnitRepository.ts, loyaltyCycleRepository.ts)
      → keyed only by (rewardProgramId, rewardProgramVersionId, customerIdentityId) and count — never by item identity
```

**Precisely what identity the runtime actually needs today:**
1. **At Reward Program version write-time (create/edit/publish):** a canonical, Firestore-resolvable, `active`, `standard_product`/`standard_service` node id per qualifying node — this is the actual current blocker, since none exist in the seed manifest.
2. **At publish-time only, additionally:** at least one qualifying node must exist at all (`assertHasQualifyingNodeForPublish`).
3. **At Purchase-record-time:** nothing beyond a non-empty free-text `itemLabel` — `knowledgeNodeId` is optional, standalone, and (this task's own finding, not previously documented in this form) **never cross-checked against the Reward Program version's own `qualifyingNodes` list at all**. A Purchase Record today has no structural binding whatsoever to which of a program's qualifying items it is for — it is bound only to the Reward Program *version* as a whole, plus a free-text label a staff member types by hand.
4. **At verification/Circle/Reward-time:** nothing — confirmed by direct code inspection (zero references to `itemLabel`/`knowledgeNodeId`/`qualifyingNodes` in `verifyPurchaseCommand.ts`, `verifiedUnitRepository.ts`, `loyaltyCycleRepository.ts`, or the Reward-creation path).

This confirms and extends the background report's finding (1): the 10+1 engine never reads canonical product/service identity, and (this task's addition) it does not even read the *Business-defined* item identity in any structured way — `itemLabel` is currently pure free text with no schema-level relationship to the program's configured qualifying items at all. This is itself a latent, pre-existing gap independent of Commerce Knowledge (see §I).

---

## C. Business-owned qualifying item model — option comparison

**Option 1 — Adapt existing `QualifyingNode`.** `businessDisplayName` becomes the authoritative name (currently optional, becomes required-when-`knowledgeNodeId` absent); `knowledgeNodeId` becomes fully optional; no new entity, same junction table (`reward_program_version_qualifying_nodes`), widen `knowledge_node_id` to nullable, add a uniqueness/identity concern for the Business-defined name since the PK is currently `(version_id, knowledge_node_id)` and a null `knowledge_node_id` cannot participate in a composite PK safely (Postgres allows multiple NULLs in a unique constraint, defeating the PK's uniqueness guarantee for Business-defined rows — a real, must-fix schema problem under this option, see §H).

**Option 2 — New Business-owned `QualifyingItem` entity.** A first-class row: `id` (server-generated, stable), `businessId`, Business-defined `name`, optional `knowledgeNodeId` classification, `status` (active/retired), `createdAt`/`updatedAt`. Reward Program Versions reference `QualifyingItem` ids (many-to-many via a junction table, same shape as today's but pointing at `qualifying_items.id` instead of a Firestore-owned `knowledgeNodeId`). The item has an identity independent of any one Reward Program Version.

**Option 3 — Version-owned qualifying items.** Each Reward Program Version directly owns immutable qualifying-item rows (no separate top-level entity, no reuse across versions/programs) — closest to a pure "snapshot" model; a rename creates a new item row on the next version, by construction.

**Option 4:** no materially better-fitting option found in repository evidence. The existing architecture (versioned Reward Programs, Firestore-owned-reference pattern for cross-domain ids, opaque `TEXT` ids never PostgreSQL FKs) does not suggest a fourth shape; Options 1–3 already span "adapt in place" / "new reusable entity" / "new non-reusable per-version entity."

**Comparison:**

| Criterion | Option 1 (adapt) | Option 2 (new reusable entity) | Option 3 (version-owned) |
|---|---|---|---|
| Business ownership | Implicit (via program) | Explicit (`businessId` on the row) | Implicit (via version→program→business) |
| Stable identity across versions | No — `knowledgeNodeId` was never designed to be a stable *Business*-defined id; a name-only row has no id to be stable | **Yes** — `QualifyingItem.id` persists across versions/renames | No — a new version's edit always mints a new row (by design) |
| Reward Program versioning compatibility | Awkward — the PK collision problem (see above) | Clean — versions reference `QualifyingItem.id`, same junction shape as today | Clean but loses cross-version continuity signal |
| Historical reproducibility (a past version shows exactly what qualified then) | Yes, if `businessDisplayName` is frozen per version (already the existing rule) | Yes — junction row snapshot; item row itself may later be retired without affecting history | Yes, trivially — the row IS the historical record |
| Renaming | Ambiguous — is a new `businessDisplayName` a rename or a new node? No id to answer the question | **Answerable** — same `QualifyingItem.id`, new `name` = a rename; a version created after the rename snapshots the new name (§D.1) | Cannot express "rename" as a first-class operation — always looks like a new item on the next version, which is a real information loss for reporting ("was this the same coffee, renamed, or a genuinely new item?") |
| Item retirement independent of Reward Program status | Not modeled | **Yes** — `QualifyingItem.status` | Not modeled — retirement only exists at the version level |
| Reuse across multiple Reward Programs (same Business) | Only by chance (same `knowledgeNodeId`, meaningless once optional) | **Yes** — same `QualifyingItem.id` referenced by multiple programs' junction rows | No — every version, even in a different program, would duplicate the item |
| Multiple qualifying items per program | Already supported (array) | Already supported (array of ids) | Already supported (array) |
| Purchase-record binding target | The `(knowledgeNodeId, businessDisplayName)` pair — no stable id when `knowledgeNodeId` is absent | **`QualifyingItem.id`** — a genuine, stable, server-issued identity a Purchase Record can bind to | The version-scoped row's own id — usable, but tied to a specific version, complicating a purchase recorded against an older still-active version |
| Reporting/analytics ("how many units of item X across time") | Hard — no stable key once canonical mapping is optional | **Easy** — group by `QualifyingItem.id` | Hard — requires joining across version-owned rows by name, fragile |
| Future redemption compatibility | Weak — no durable identity to redeem "the next eligible item" against | **Strong** — `QualifyingItem.id` is exactly the kind of durable reference a future redemption record would need | Weak, same reason as reporting |
| Optional Commerce Knowledge mapping | Awkward overload of existing `knowledgeNodeId` field (now optional, but doing double duty as "canonical ref" and "the only identity") | **Clean** — a separate, genuinely optional `knowledgeNodeId` column on `QualifyingItem`, independent of the item's own primary identity | Clean, same as Option 2, but non-reusable |
| Migration complexity | Low line-count, but the PK/nullability problem (§H) makes it deceptively fragile | Moderate — one new table, one changed junction-table foreign key target, a backfill mapping strategy for any existing canonical-only rows | Moderate — restructure the existing junction table's own columns; no new table |
| Current schema compatibility | Nominally highest (same table), actually lowest once the PK problem is accounted for | Requires a genuinely new table but composes cleanly with the existing versioned-Reward-Program pattern already used everywhere else in this domain (`reward_programs` → `reward_program_versions` → junction) | Requires restructuring, not just adding | 
| Implementation complexity | Looks smallest, is not smallest once the PK fix, purchase-binding-identity gap, and rename/retirement modeling are all accounted for | Moderate, but each piece (new table, new repository, new validation function) mirrors an existing, already-proven pattern in this exact codebase (`rewardProgram`'s own repository/service split) | Moderate, but produces weaker reporting/redemption properties for comparable effort |

### Recommendation: **Option 2 — a new Business-owned `QualifyingItem` entity.**

**Reasoning.** Option 1's apparent simplicity is misleading: making `knowledge_node_id` nullable while it remains half of a composite primary key breaks uniqueness for every Business-defined (no-canonical-mapping) row — Postgres does not enforce uniqueness across multiple `NULL`s in a unique/PK constraint, so two Business-defined qualifying items with no canonical mapping could not be safely modeled as distinct primary-key rows in the current table shape without introducing a *new* stable identity column anyway — at which point Option 1 has quietly become Option 2 with extra steps. Option 3 permanently forecloses two things the task's own required list (§D) needs answered cleanly: unambiguous rename-vs-new-item semantics and cross-version/cross-program reuse. Option 2 is the smallest model that gives every one of the task's required properties (§D) a direct, non-contorted answer, reuses this codebase's own established pattern (a Firestore-independent, PostgreSQL-owned, versioned domain entity with its own repository and validation module — exactly how `rewardProgram` itself is built), and gives a future redemption feature (§D.8) a genuine stable identity to redeem against instead of a name string.

---

## D. Resolved design questions (design only, not implemented)

**D.1 — Rename vs. new item vs. new version snapshot.** A `QualifyingItem`'s `name` field is mutable (like `RewardProgramRow.displayName` today). Changing "Black Coffee" → "Premium Black Coffee" on the *same* `QualifyingItem.id` is a **rename of the same item**, not a new item — this is exactly what a stable id buys. However, per the existing versioning discipline already governing this domain (RF-2/RF-3: a published Reward Program Version is an immutable historical snapshot), **a published version's own snapshot of the item's name at that time must not retroactively change** — the version's junction row should carry its own frozen `businessDisplayNameAtVersion` (mirroring the existing `businessDisplayName` field's existing snapshot role), while the *live* `QualifyingItem.name` may continue to be edited going forward for future versions. This preserves RF-2's "historical integrity" rule exactly as it already applies to every other version-frozen field.

**D.2 — Historical programme versions when a Business stops offering an item.** `QualifyingItem.status` moves to `retired` (or similar) going forward. Every already-published historical version's frozen junction-row snapshot (name, and optional `knowledgeNodeId` if any) is completely unaffected — exactly the existing `isResolvableForExistingReference`-vs-`isEligibleForNewReference` split already governing canonical-node retirement (§F/§G), extended to Business-defined items: retirement blocks the item from being *added* to a new draft, never invalidates its presence in an already-published version.

**D.3 — One item, multiple Reward Programs.** Yes — under Option 2, `QualifyingItem` is Business-scoped, not program-scoped, so the same `QualifyingItem.id` may be referenced by junction rows belonging to different Reward Programs owned by the same Business (e.g., "Black Coffee" qualifying both a coffee-loyalty program and a breakfast-combo program). No new relationship type is required; this is structurally identical to how `standard_product`/`standard_service` ids can already appear in multiple programs' qualifying-node arrays today.

**D.4 — Different Businesses reusing the same name.** Yes, trivially and without any cross-Business collision concern — `QualifyingItem.id` is server-generated (e.g. UUID) and `businessId`-scoped; two Businesses each having a "Black Coffee" `QualifyingItem` are two entirely independent rows with independent ids. No global name uniqueness is needed or desired (a Business's qualifying item names are not analogous to canonical Commerce Knowledge names, which *are* platform-curated and therefore have a legitimate reason to avoid duplication).

**D.5 — Does the platform ever need global uniqueness?** No — not for the Business-defined item's *name*. Global uniqueness only ever mattered for the canonical Commerce Knowledge side (one "Haircut" `standard_service` node platform-wide), and that requirement is entirely untouched by this decision (Commerce Knowledge itself is not modified). A Business-defined item's uniqueness scope is at most per-Business (and arguably not even that — nothing in the Founder decision requires rejecting two identically-named items within one Business, though a UX nudge against accidental duplicates is a reasonable, non-governance-blocking implementation-time choice).

**D.6 — What identity should a Purchase Record bind to?** `QualifyingItem.id` (Option 2's stable identity) — replacing (or supplementing, see §I) today's free-text `itemLabel`. This directly closes the previously-undocumented gap found in §B: today's Purchase Record has no structural relationship to a program's configured qualifying items at all. Binding to `QualifyingItem.id` gives every Purchase Record an unambiguous, reportable, non-typo-able reference to exactly which of the Business's defined items the purchase was for — while the item's *name-at-purchase-time* can still be denormalized onto the Purchase Record (mirroring the existing `businessDisplayName`-snapshot pattern) for a permanently readable receipt even if the item is later renamed or retired.

**D.7 — What identity should a Verified Unit preserve?** No change from today's already-correct design: a Verified Unit is keyed by `(rewardProgramId, rewardProgramVersionId, customerIdentityId, purchaseRecordId)` and does not need its own copy of item identity — it already inherits the Purchase Record's binding transitively, and the 10+1 engine has never needed (and per the Founder decision, must never need) item identity to issue a Verified Unit or progress a Circle. This is unchanged and un-widened by this design.

**D.8 — What identity would eventual redemption need?** `QualifyingItem.id` (or, if the future Reward-side model also adopts a similar Business-owned "reward item" entity — out of scope here, `standardRewardNodeId` is untouched by this decision) — the same stable identity Purchase Records would already be binding to under D.6. This is precisely why Option 2 was chosen over Options 1/3: neither of those gives a future redemption feature a durable, renamable-without-breaking-history identity to redeem "the next eligible item" against. This design does not define redemption mechanics themselves (out of scope, `FD-REWARD-QUALIFYING-ITEM-001` §9 explicitly excludes them) — it only confirms the recommended qualifying-item identity model does not foreclose them.

---

## E. Commerce Knowledge mapping as optional classification

**Recommendation: zero-or-one, versioned (frozen per Reward-Program-Version-junction-row snapshot, like `businessDisplayName` today), simplest Phase 1 model.** A `QualifyingItem` carries an optional `knowledgeNodeId: string | null` column. Zero-or-many (letting one Business item map to several canonical nodes) is not recommended for Phase 1 — no product requirement or Founder-decision text asks for it, and it would complicate the "classification, not qualification" boundary (F) for no disclosed benefit; zero-or-one is the simplest model that still lets a future reporting/analytics feature roll a Business item up to a canonical category when the Business has chosen to map it.

**Mutable vs. immutable-historical:** the *live* `QualifyingItem.knowledgeNodeId` may be changed going forward (a Business decides to map, unmap, or remap its own item at any time — this is optional classification, not a qualification fact, so it carries none of the frozen-at-publish rigor a qualification fact would need). A **published Reward Program Version's own junction-row snapshot**, however, should still freeze whatever `knowledgeNodeId` (if any) was true at that version's publish time — exactly mirroring the existing `businessDisplayName`-per-junction-row pattern — so that historical reporting of "what did this version's classification look like then" remains stable even if the live item's mapping later changes.

**Server-side authority preserved when a mapping is present.** If and only if `knowledgeNodeId` is non-null, the existing `assertNodeEligible`/`isEligibleForNewReference` check (unchanged function, `rewardProgramKnowledgeValidation.ts`) must still run — a fabricated, retired, wrong-typed, or nonexistent `knowledgeNodeId` must still be rejected exactly as today. Absence of a mapping (`knowledgeNodeId: null`) is a fully valid, unvalidated-against-Commerce-Knowledge state — no check runs at all, by design, since there is nothing to validate.

---

## F. Trust-boundary demonstration (Business-defined items do not weaken trust)

| Stage | What is asserted | Existing control(s) that protect it | Affected by this decision? |
|---|---|---|---|
| "Business says this item qualifies" | The Business's own definition of its qualifying item(s) | Business authorization (`authorizeRewardProgramManage`); publish-time `assertHasQualifyingNodeForPublish` (≥1 item); optional canonical-mapping validation when present (§E) | **This is exactly the layer this decision changes** — but it changes *what the Business is allowed to assert as a qualifying item* (a name it authors vs. a canonical node it selects), not *whether the Business's assertion is authenticated/authorized*. The authorization and "at least one item" invariant are untouched. |
| "Business says this transaction occurred" | A staff/manager/owner recorded a Purchase for a specific customer, quantity, item | `authorizePurchaseRecord` (role-scoped); idempotency key (`checkAndReserveIdempotencyKey`); the locked-program/locked-version read inside the PostgreSQL transaction; `itemLabel` non-empty validation | **Untouched.** None of these controls read or depend on Commerce Knowledge canonical identity today (confirmed §B) — they gate on Business/actor/program/version state, which this decision does not change. |
| "Customer verifies transaction" | The customer confirms/rejects/disputes the recorded Purchase | `verifyPurchaseCommand.ts`/`rejectPurchaseCommand.ts`/`raisePurchaseDisputeCommand.ts` — customer-identity-scoped, bounded reject/dispute-reason vocabularies, replacement-record-only correction (`DEC-LOY-004`) | **Untouched** — confirmed by direct code inspection: zero references to `itemLabel`/`knowledgeNodeId`/qualifying-item identity anywhere in this command. |
| "Platform issues Verified Unit" | A verified Purchase produces exactly one Verified Unit (or the correct multi-unit count) | Transactional Postgres locks (`lockRewardProgramVersionById`), the version's `multipleUnitsAllowed`/quantity rule, idempotency | **Untouched** — Verified Unit issuance has never read item/Commerce-Knowledge identity (§D.7). |
| "Platform progresses the Circle" | Verified Units accumulate toward the fixed 10-unit threshold | `loyaltyCycleRepository.ts`, the fixed `REQUIRED_VERIFIED_UNITS_MVP` constant, `DEC-LOY-001`'s guard against configurability | **Untouched** — no code path here reads item identity of any kind, canonical or Business-defined. |

**No unnecessary taxonomy validation is introduced as a trust substitute.** The only validation this decision removes is the *mandatory* canonical-resolution check on the qualifying-item identity itself; every actor-authorization, idempotency, transactional-locking, and bounded-vocabulary control in the Purchase/Verification/Circle spine is independent of Commerce Knowledge and remains fully intact, confirmed by direct source inspection rather than assumed.

---

## G. PB-010B element classification (A-REMOVE / B-OPTIONAL / C-RETAIN / D-ADAPT / E-REPLACE)

| Element | Classification | Note |
|---|---|---|
| `qualifyingNodes: QualifyingNode[]` model shape (array-of-qualifying-things) | **C — retain the array shape** | The "one or more qualifying things per version" cardinality is correct and unaffected; only what each element *is* changes (§C) |
| `knowledgeNodeId` (required field on each qualifying node) | **E — replace as the primary identity** | Becomes an optional classification column on the new `QualifyingItem` entity (§E), no longer the qualifying node's own required id |
| `businessDisplayName` | **D — adapt** | Becomes (or is absorbed into) the new `QualifyingItem.name` — no longer secondary presentation metadata layered on a required canonical id; it is now capable of being the *sole* authoritative name |
| Reward Program create/update/publication request shapes | **D — adapt** | `qualifyingNodes: QualifyingNode[]` becomes a reference to `QualifyingItem` id(s) (existing ids for reuse, or a create-inline shape for a brand-new Business item — implementation-time API-shape choice) |
| `assertHasQualifyingNodeForPublish` | **C — retain unchanged** | The "≥1 qualifying item before publish" invariant is explicitly required by `FD-REWARD-QUALIFYING-ITEM-001` §2.3 and is completely identity-model-agnostic — it only counts, never inspects, node shape |
| `validateQualifyingNodes` | **D — adapt** | Becomes conditional per-item: run the existing canonical-eligibility check only when that item's `knowledgeNodeId` is non-null (mirrors `validateOptionalCategoryReference`'s already-established pattern exactly, §E) |
| Commerce Knowledge default discovery (`listQualifyingNodesForBusinessType`) | **C — retain unchanged, repurposed as an optional-mapping-picker** | Still valid as the read a Business uses if/when it chooses to classify an item against Commerce Knowledge; no longer the primary "select your qualifying thing" flow |
| Cross-business-type search (`searchQualifyingNodes`) | **C — retain unchanged, same repurposing** | Same reasoning — an optional classification aid, not removed |
| Search bounds (`MAX_SEARCH_CANDIDATE_NODES_PER_TYPE`, `MAX_SEARCH_RESULTS`) | **C — retain unchanged** | Independent of this decision; a real, unrelated correction (`PLATFORM-BASELINE-010B-CORR-001` P2) that must not be reverted |
| Debounce (`useDebouncedValue`) | **C — retain unchanged** | Same reasoning |
| Language-scoped query keys | **C — retain unchanged** | Same reasoning; a real bug fix (PB-008 CORR-001 C2) |
| Label-resolution security (`resolveKnowledgeNodeLabels`'s `isResolvableForExistingReference` gate) | **C — retain unchanged** | A real P2 disclosure-protection fix (PB-008 CORR-001 C1), entirely orthogonal to whether canonical mapping is mandatory or optional |
| Retired-reference handling (write-time `isEligibleForNewReference` vs. read-time `isResolvableForExistingReference` split) | **C — retain unchanged for the canonical-mapping side; D — adapt/extend for the Business-item side** | The existing split is preserved exactly for `knowledgeNodeId` when present; an equivalent (simpler — no Firestore involved) status split is newly needed for `QualifyingItem.status` (active/retired), see §D.2 |
| Migration 0015 (`reward_program_category_id` nullable) | **C — retain unchanged** | Entirely orthogonal — a different field, a different decision (`DEC-LOY-014`), already merged; not touched by this design |
| Existing tests (`rewardProgramCommands.postgres.test.ts`, `commerceKnowledgeReadService.emulator.test.ts`, `QualifyingNodeSelector.test.tsx`, etc.) | **D — adapt** | See §K (test plan) — every existing canonical-mapping-present assertion must keep passing; new assertions cover the no-mapping path |

---

## H. Schema impact (conceptual only — no migration created)

Direct inspection of `functions/src/infrastructure/postgres/migrations/0003_create_reward_program_version_qualifying_nodes.sql` confirms the exact current shape:

```sql
CREATE TABLE reward_program_version_qualifying_nodes (
  reward_program_version_id UUID NOT NULL REFERENCES reward_program_versions (id) ON DELETE CASCADE,
  knowledge_node_id TEXT NOT NULL,
  business_display_name TEXT NULL,
  PRIMARY KEY (reward_program_version_id, knowledge_node_id)
);
```

Under the recommended Option 2 model, a forward migration (not created by this task) would need, conceptually:

1. **New table `qualifying_items`** — `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `business_id TEXT NOT NULL` (opaque Firestore ref, same convention as every other Business reference in this schema), `name TEXT NOT NULL`, `knowledge_node_id TEXT NULL` (optional classification), `status TEXT NOT NULL DEFAULT 'active'` (`active`/`retired`, mirroring `REWARD_PROGRAM_STATUSES`' own string-enum convention), `created_at`/`updated_at`/`created_by`/`updated_by`, `schema_version INTEGER NOT NULL DEFAULT 1`. Index on `business_id`.
2. **Restructure the junction table** — rename or replace `reward_program_version_qualifying_nodes` with a table whose foreign key targets `qualifying_items.id` instead of an opaque `knowledge_node_id TEXT`: `reward_program_version_id UUID NOT NULL REFERENCES reward_program_versions (id) ON DELETE CASCADE`, `qualifying_item_id UUID NOT NULL REFERENCES qualifying_items (id)`, plus the frozen-at-publish snapshot columns (`item_name_at_version TEXT NOT NULL`, `knowledge_node_id_at_version TEXT NULL` — the D.1/E frozen-snapshot columns), `PRIMARY KEY (reward_program_version_id, qualifying_item_id)` — this PK is now safe because `qualifying_item_id` is never null (it is the new stable identity `knowledge_node_id` used to be, minus the nullability problem identified in §C).
3. **Purchase Record binding (§D.6, §I)** — `purchase_records` would gain a nullable-during-transition, eventually-required `qualifying_item_id UUID NULL REFERENCES qualifying_items (id)`, alongside (not necessarily replacing immediately) the existing `item_label TEXT NOT NULL` free-text column, which could be repurposed as a frozen display-name-at-purchase-time snapshot rather than removed.
4. **Foreign keys/indexes:** `qualifying_items.business_id` index (lookup by Business); the restructured junction table needs the same `knowledge_node_id`-style lookup index it has today, now on `knowledge_node_id_at_version` if any reporting still needs "find every version that mapped to canonical node X."
5. **Uniqueness:** no new global-uniqueness constraint is needed (§D.5) — only the existing per-version-per-item uniqueness (already expressed by the junction table's PK) carries over.
6. **Historical-snapshot requirement:** already addressed by the frozen `*_at_version` columns in (2) — this is the schema-level enforcement of D.1/D.2's historical-integrity rule.

**Existing canonical references must be preserved.** Any already-existing junction row with a non-null `knowledge_node_id` (there are none today per repository-evidence inspection — confirmed no `INSERT` exists anywhere in this repository's own migrations/seed/fixtures for this table, though a live deployed environment's actual data cannot be proven empty by repository inspection alone, the same "cannot be proven, not the same as disproven" caveat `PLATFORM-BASELINE-010A` §F already correctly recorded for the category migration) would need a `qualifying_items` row backfilled for it (one row per distinct historical `knowledge_node_id` that appears, `knowledge_node_id` copied onto the new row, `name` populated from that node's resolved canonical display label as a reasonable default) before the junction table's foreign key could be safely repointed — a genuine backfill migration, not a pure constraint relaxation like migration 0015 was.

---

## I. Purchase-record binding — minimum correction (traced, not implemented)

Direct trace of `recordPurchaseCommand.ts` (confirmed, §B) shows a purchase today persists: a required free-text `itemLabel`, an optional standalone `knowledgeNodeId` (independently re-validated against Commerce Knowledge if present, but never checked against the Reward Program version's own qualifying-node list), `quantity`, `unitValueMinor`/`currency` (reporting-only), and the program/version binding. **There is currently no code path anywhere that confirms a recorded purchase's item corresponds to one of the Reward Program version's actual configured qualifying items** — this is true today, independently of Commerce Knowledge, and is not introduced or worsened by this decision; it is a pre-existing gap this task discloses (per instruction, does not fix).

**Minimum correction for unambiguous association (design only):** `RecordPurchaseRequest` gains a required `qualifyingItemId: string` (the `QualifyingItem.id` selected from the Reward Program version's own configured list, §H item 3), validated server-side (inside the same pre-transaction Firestore/Postgres read sequence already used for the program/version lock) to actually belong to that Reward Program version's qualifying-item set — closing the gap. `itemLabel` may be retained as a denormalized, frozen display-name-at-purchase-time convenience (mirroring the existing `businessDisplayName`-snapshot pattern) rather than removed outright, preserving any existing reporting that reads it as free text today.

**Verified Unit / Loyalty Cycle / Reward — no change required.** Per §D.7, none of these need to read item identity to do their job correctly, and the Founder decision does not ask them to; this design explicitly recommends **no change** to the 10+1 engine itself, only to the Purchase Record's own input shape and its validation against the (now Business-owned) qualifying-item set.

---

## J. Configuration/onboarding UX (defined, not built)

A Business adds items directly — e.g., typing "Black Coffee" and "Cappuccino" into a simple add-item control on the Reward Program creation/edit screen — rather than being required to search a platform catalogue first. The existing `QualifyingNodeSelector.tsx` component's UI shape (checkbox multi-select list + search escape hatch) is repurposed: the *primary* action becomes "add a new Business-defined item" (a text field + add button, producing a new or existing `QualifyingItem`), and the *existing* Business-Type-scoped/search-based Commerce Knowledge pickers are demoted to an **optional** "classify this item" affordance attached to each added item, not a precondition for adding it.

**Should optional mapping even be exposed to normal Business users in Phase 1?** **Recommendation: defer it, hide it from the normal Business operator flow entirely in Phase 1**, consistent with `FD-REWARD-QUALIFYING-ITEM-001` §4/§10 treating classification as a platform-side concern (normalisation, reporting, analytics, discovery, future interoperability) rather than something a Business operator needs to act on to run their loyalty program. This is the simplest operator experience possible: a Business owner or staff member never sees a taxonomy picker at all when creating a Reward Program — they type the name of what they sell. A future, separately-authorized Knowledge Studio or platform-side enrichment workflow (§K) can retroactively classify Business-defined items against Commerce Knowledge without requiring any Business-facing UI change at all.

**Mobile-operability / EN primary, FR supported:** a single text-entry control (add-item name) is trivially mobile-operable (no multi-step picker, no scrolling a long taxonomy list) and requires only two new EN/FR string keys (an "Add qualifying item" label/placeholder and a validation message for empty/duplicate names) — smaller localization surface than the taxonomy-picker strings this design would let the implementer remove or de-prioritize from the normal-user-facing flow.

---

## K. Commerce Knowledge seed-content consequence

**Confirmed: Commerce Knowledge seed content is NOT required to unblock Reward Program creation after this correction.** Once qualifying items are Business-defined and canonical mapping is optional, `burundiPilotSeedManifest.ts` seeding zero `standard_product`/`standard_service` nodes no longer blocks anything in the Reward Program creation/publication path — a Business can create, configure, and publish a Reward Program with only Business-authored item names, with or without Commerce Knowledge content ever existing. Seeding `standard_product`/`standard_service` (and, separately, `reward_program_category`) content becomes its own, separately-scoped **enrichment/classification programme** — valuable for future reporting/analytics/discovery, never a Phase 1 Reward Program creation prerequisite. This task does not seed anything, per instruction.

---

## L. Recommended implementation package (defined, not performed)

**Scope:** correct qualifying-item identity from mandatory-canonical to Business-owned-with-optional-classification, per `DEC-LOY-016`, using Option 2 (§C).

**Files/domains expected to change (not touched by this task):**
- `functions/src/domains/rewardProgram/models/rewardProgram.ts` — new `QualifyingItem` type; `QualifyingNode` shape retired/replaced in the version-draft-input/version-row types.
- `functions/src/domains/rewardProgram/repositories/` — new `qualifyingItemRepository.ts` (create/get/list-by-business/retire); `rewardProgramRepository.ts` — junction-table read/write repointed to `qualifying_item_id`.
- `functions/src/domains/rewardProgram/services/rewardProgramKnowledgeValidation.ts` — `validateQualifyingNodes` replaced/adapted to validate `QualifyingItem` existence/ownership (Postgres read) plus, conditionally, the existing canonical check only when a mapping is present (§E); `assertHasQualifyingNodeForPublish` retained verbatim.
- `functions/src/domains/rewardProgram/services/{createRewardProgramCommand,createNextRewardProgramVersionCommand,publishRewardProgramVersionCommand,updateRewardProgramDraftCommand}.ts` — request/param shapes updated to accept `QualifyingItem` id(s) (existing or create-inline).
- `functions/src/domains/purchase/services/recordPurchaseCommand.ts`, `functions/src/domains/purchase/models/purchase.ts`, `functions/src/domains/purchase/repositories/purchaseRecordRepository.ts` — new required `qualifyingItemId`, validated against the locked version's own qualifying-item set (§I).
- `functions/src/index.ts` — transport parsing for all of the above; no new callable strictly required beyond a `createQualifyingItem`/`listQualifyingItemsForBusiness` pair if items are managed as reusable, addressable entities rather than always created inline.
- A new Postgres migration (not created by this task) — `qualifying_items` table, restructured junction table, `purchase_records.qualifying_item_id`, plus the backfill strategy of §H for any pre-existing non-null `knowledge_node_id` rows (repository evidence found none, but a live environment cannot be proven empty by inspection alone).
- `apps/web/src/business/dashboard/{QualifyingNodeSelector,RewardProgramManagementPage}.tsx` — repurposed to "add a Business-defined item" as the primary control, with the existing Commerce-Knowledge-backed picker demoted to an optional, possibly implementation-deferred, "classify" affordance (§J).
- `apps/web/src/business/api/rewardProgramMutations.ts`, `businessQueries.ts`, `queryKeys.ts` — wire-type/query-key updates mirroring the pattern PB-010B already established for its own additive changes.
- EN/FR locale files — new "Add qualifying item" strings; removal (or Phase-1 hiding) of the now-unnecessary "choose a category first"/taxonomy-mandatory strings.
- Tests — every file listed in §M below.

**Migration strategy:** two-step, non-breaking: (1) add `qualifying_items` and the new junction-table shape additively, backfill any pre-existing canonical-only junction rows into synthesized `qualifying_items` rows (§H); (2) once backfilled, make the new junction table's `qualifying_item_id` the sole foreign key (drop the old `knowledge_node_id`-keyed table or repoint it) — mirrors the same "additive, then cutover" discipline already used for migration 0015 (additive `DROP NOT NULL`, no data rewrite).

**Server invariants to preserve exactly:** `assertHasQualifyingNodeForPublish` (≥1 item, unchanged); the canonical-eligibility check when (and only when) `knowledgeNodeId` is present (§E); the frozen-at-publish snapshot rule (D.1/D.2); Business-scoped ownership/authorization of `QualifyingItem` create/retire (reuse `authorizeRewardProgramManage`'s existing Business-membership check, do not invent a new authorization surface).

**Transport changes:** `CreateRewardProgramRequest`/`RewardProgramVersionDraftInput` qualifying-item shape changes from `{knowledgeNodeId, businessDisplayName}[]` to a Business-owned-id-based shape (existing `QualifyingItem.id`s, plus an inline-create-and-attach convenience for a brand-new item in the same request — an implementation-time API-ergonomics choice, not fixed by this design).

**Frontend changes:** per §J/§L above.

**EN/FR changes:** minimal, per §J.

**Backwards compatibility:** no already-published Reward Program Version's historical junction-row snapshot changes meaning or value (§D.1/§H item 2's frozen `*_at_version` columns exist precisely to guarantee this).

**Test plan (minimum-proof list, mirroring this repository's own established per-finding test-numbering convention):**
1. Creating a Reward Program with a Business-defined qualifying item and no canonical mapping succeeds.
2. Creating with multiple Business-defined items succeeds.
3. Creating with a canonically-mapped item still succeeds and the existing canonical-eligibility check still runs and can still reject a fabricated/wrong-typed/ineligible-status `knowledgeNodeId` when one is supplied.
4. Publishing with zero qualifying items is still rejected (`assertHasQualifyingNodeForPublish`, unchanged, re-confirmed).
5. Publishing with ≥1 Business-defined item (no mapping) succeeds.
6. Renaming a live `QualifyingItem` does not alter any already-published version's frozen snapshot name; a new version created after the rename does reflect the new name.
7. Retiring a `QualifyingItem` blocks it from being added to a new draft but does not invalidate any already-published version referencing it.
8. Two different Businesses may each have a `QualifyingItem` named identically with no collision or cross-Business visibility.
9. A Purchase Record must bind to one of its Reward Program version's actual configured `QualifyingItem`s — recording a purchase against an item id not on that version is rejected (closes the §I gap).
10. Verified Unit issuance, Circle threshold, and Reward creation behave identically for a Business-defined-only qualifying item as for a canonically-mapped one — direct proof of engine non-regression, not just code-path absence (mirrors PB-010B's own §I test 15).
11. Every PB-008/PB-010B regression protection (§G "C — retain unchanged" rows) re-run and still passes unmodified: `resolveKnowledgeNodeLabels` disclosure gate, language-scoped cache keys, search bounds, debounce, canonical-id server-side re-validation.
12. A snapshot/DOM test of the Reward Program creation UI confirms adding a Business-defined item requires no taxonomy interaction at all.

**Emulator/Postgres tests:** the same dual-suite discipline PB-010B already used (Firestore Emulator for anything touching Commerce Knowledge reads; PostgreSQL cross-store integration tests for the `qualifying_items`/junction-table/`purchase_records` changes) — no new test infrastructure required.

**Regression boundaries:** no file in `purchase/**`'s verification/Circle/Reward-issuance logic should need to change beyond the new `qualifyingItemId` binding check at record-time (§I); the 10+1 threshold constant, Trust Events, Notification Intents, idempotency, and Business Participation Terms must show zero diff.

**Implementation sequence:** (1) migration + backfill (§H); (2) model/repository (`QualifyingItem`); (3) validation adaptation (`rewardProgramKnowledgeValidation.ts`); (4) command threading (create/edit/publish); (5) Purchase Record binding correction (§I); (6) frontend "add item" control + demoted classification affordance; (7) tests (§ above); (8) full regression run of `rewardProgram`, `commerceKnowledge`, and `purchase` domain suites, mirroring PB-010B's own validation discipline exactly.

---

## Risks

- The backfill step in §H is the one piece of this design that is not a pure additive/constraint-relaxation change — it requires synthesizing `qualifying_items` rows from historical canonical-only junction rows, a genuine (if likely empty-table, per repository evidence) data-migration step, not a schema-only one.
- Hiding the Commerce Knowledge classification affordance entirely from Phase 1 normal-user UI (§J) is a UX/product recommendation, not a governance mandate — an implementer or the Founder could reasonably choose to expose it as a lightweight optional field instead; this design does not treat that choice as fixed.
- None of the identified risks touch qualification authority, the 10+1 engine, or any trust control (§F).

## Open questions (implementation-time, not architecture blockers)

- Exact API shape for "create a new Business-defined item inline while creating/editing a Reward Program version" vs. "select from a Business's existing items list" — both are compatible with Option 2; the ergonomic choice is not fixed by this design.
- Whether `purchase_records.item_label` is fully removed once `qualifying_item_id` exists, or retained as a frozen display-name convenience (§I) — a data-retention/reporting preference, not an architecture question.

---

## Commands executed

Read-only, this session: `git fetch origin`; `git rev-parse origin/main`/`HEAD`; direct `Read`/`grep` of `functions/src/domains/rewardProgram/**` (models, repositories, services, especially `rewardProgramKnowledgeValidation.ts`, `createRewardProgramCommand.ts`, `publishRewardProgramVersionCommand.ts`), `functions/src/domains/purchase/**` (`recordPurchaseCommand.ts`, `verifyPurchaseCommand.ts`, `purchase.ts`), `functions/src/domains/commerceKnowledge/seed/burundiPilotSeedManifest.ts`, `functions/src/infrastructure/postgres/migrations/*.sql` (especially `0003_create_reward_program_version_qualifying_nodes.sql`, `0008_purchase_records.sql`, `0015_reward_programs_category_optional.sql`), `apps/web/src/business/dashboard/{QualifyingNodeSelector,RewardProgramManagementPage}.tsx`; direct reads of `docs/00-governance/decisions/decision-register.md`, `assumptions-register.md`, `canonical-reference.md`, `requirements-traceability-matrix.md`, `documentation-changes-log.md`, PRD6, the Commerce Knowledge Standard, and TRD10 on `origin/main`; reads of the (uncommitted, local-working-directory-only) `FD-REWARD-QUALIFICATION-001` evidence file and the `PLATFORM-BASELINE-010`/`-010A` reports for precedent/convention, via the original working directory path as instructed, treated as reference only. No state-changing git command was run against `origin/main` or the primary legal worktree.

## Confirmation nothing implemented

Confirmed — this task created exactly the governance files listed in the companion `documentation-changes-log.md` Entry 238 and this report. No file under `functions/src`, `apps/web/src`, any migration directory, any dependency manifest, or any config file was created, edited, or deleted. No Commerce Knowledge content was seeded. No redemption or Reward/Cycle-visibility work was started. The 10+1 threshold constant was not touched.

## Confirmation primary worktree untouched

Confirmed — the pre-existing uncommitted changes on branch `docs/dec-legal-002-bt-draft-007` at `/Volumes/PRODUCTION/Projects/11THONUS` were read only where explicitly instructed (the three named reference files, via that path, treated as reference/precedent only) and were never modified. All file writes/commits for this task were made in a separate worktree on a fresh branch off `origin/main`.

---

## FINAL DISPOSITION

**A — FOUNDER DECISION RECORDED / IMPLEMENTATION DESIGN READY.** The correction is fully specified — qualifying-item identity model (Option 2, with reasoning), rename/retirement/multi-programme/multi-Business semantics, optional Commerce Knowledge mapping model, trust-boundary non-regression analysis, PB-008/PB-010B retain/adapt classification, conceptual schema impact and migration strategy, Purchase-Record-binding correction, UI/EN-FR/mobile considerations, and a full test plan and implementation sequence — without altering the 10+1 mechanic, the fixed threshold, redemption, Business Participation Terms, or any trust/anti-fabrication control. The two open questions above are implementation-time ergonomic/retention choices, not architecture blockers, and do not require further Founder input before implementation is separately authorized. The disclosed `DEC-LOY-014`/`DEC-LOY-015` register-gap (§ of the evidence file) is a genuine, separate authority-tracking issue that remains open and is not a blocker to this design's own soundness.
