# PLATFORM-BASELINE-012-QUALIFYING-ITEM-DELIVERY-DESIGN-001 — Business-Owned Qualifying Item: Implementation Readiness & Delivery Design

> **Classification:** Design/readiness only. **No implementation code, schema, migration, seed content, redemption work, Circle-engine work, or Business Participation Terms work was created by this task.** No PR opened, nothing pushed.
> **Date:** 2026-09-18 · **Performed by:** Claude (AI agent)
> **Governing decisions:** [`DEC-LOY-016`](../../00-governance/decisions/decision-register.md) / [`FD-REWARD-QUALIFYING-ITEM-001`](../../00-governance/decisions/evidence/FD-REWARD-QUALIFYING-ITEM-001-founder-decision-2026-09-18.md) — recorded by `PLATFORM-BASELINE-011`, not re-litigated here.
> **Predecessor:** [`PLATFORM-BASELINE-011` architecture-correction design](platform-baseline-011-reward-qualifying-item-001-architecture-correction-design-2026-09-18.md) — read in full, then **independently re-verified against source**. Where this report's findings differ from or extend PB-011's, the difference is stated explicitly and attributed to direct code inspection (§4, §7, §10, §13).

---

## Purpose

Convert the Founder-approved Phase 1 Qualifying Item model into an implementation-ready delivery package: a verified end-to-end identity trace of the *current* code, a minimum Phase 1 entity model grounded in this repository's own conventions, the Reward-Program and Purchase binding designs, the trust/validation design, the migration strategy, the retain/adapt/remove matrix, a concrete test plan, and a bounded implementation slicing that leaves `main` coherent after every merge. **No implementation.**

---

## 1. Entry origin/main SHA

- `git fetch origin` executed. **`origin/main` = `b2f1fda053c600e1fe29dcddea6ecda2329da6e9`** — exactly the canonical entry point named by the task (merge of PR #258, `docs/platform-baseline-011-reward-qualifying-item-001`).
- **No drift.** `origin/main` has not moved since PB-011 merged, so there is no Reward Program, purchase, Commerce Knowledge, migration, or UI surface change to report. The drift-disclosure clause of the task spec is satisfied trivially.
- Presence confirmed on this exact SHA:
  - `docs/00-governance/decisions/evidence/FD-REWARD-QUALIFYING-ITEM-001-founder-decision-2026-09-18.md` — present, read in full.
  - `DEC-LOY-016` — present as a real row in `docs/00-governance/decisions/decision-register.md` (line 575), with the Register Summary updated to Total 117 (line 1440).
  - PB-011's own report — present, read in full.

## 2. Branch/worktree

- **Worktree:** `/Volumes/PRODUCTION/Projects/11THONUS/.claude/worktrees/agent-a97fc6832fcf31232` — an isolated git worktree, separate directory, checked out at `b2f1fda`.
- **Branch:** `docs/platform-baseline-012-qualifying-item-delivery-design-001` (created from `b2f1fda`).
- The primary/legal worktree at `/Volumes/PRODUCTION/Projects/11THONUS` (branch `docs/dec-legal-002-bt-draft-007`) was **never entered, read, or modified** — see §29.

## 3. Files inspected

Read directly (not inferred from any report):

**Schema / migrations**
`functions/src/infrastructure/postgres/migrations/` — `0001_create_reward_programs.sql`, `0002_create_reward_program_versions.sql`, `0003_create_reward_program_version_qualifying_nodes.sql`, `0008_purchase_records.sql`, `0009_verified_units.sql`, `0010_loyalty_cycles.sql`, `0012_rewards.sql`, `0013_trust_events.sql`, `0015_reward_programs_category_optional.sql`, `README.md`; full directory listing (highest applied version = `0015`).

**Reward Program domain**
`functions/src/domains/rewardProgram/models/rewardProgram.ts`; `models/rewardProgramErrors.ts`; `repositories/rewardProgramRepository.ts`; `services/rewardProgramKnowledgeValidation.ts`; `services/createRewardProgramCommand.ts`; `services/updateRewardProgramDraftCommand.ts`; `services/createNextRewardProgramVersionCommand.ts`; `services/publishRewardProgramVersionCommand.ts`; `services/rewardProgramAuthorization.ts`; `services/rewardProgramQueries.ts`; `services/rewardProgramCommands.postgres.test.ts` (inventory).

**Purchase domain**
`functions/src/domains/purchase/services/recordPurchaseCommand.ts` (full); `services/verifyPurchaseCommand.ts`; `services/purchaseAuthorization.ts`; `services/purchaseRequestHash.ts`; `models/purchase.ts`; `repositories/purchaseRecordRepository.ts`; `repositories/verifiedUnitRepository.ts`; `repositories/loyaltyCycleRepository.ts`; `repositories/trustEventRepository.ts`; `services/purchaseCommands.postgres.test.ts` (inventory).

**Commerce Knowledge**
`functions/src/domains/commerceKnowledge/services/commerceKnowledgeReadService.ts` (export surface); `seed/burundiPilotSeedManifest.ts` (node-type census).

**Permissions**
`functions/src/domains/permissions/models/rewardProgramPermissionCatalogue.ts`; `models/purchasePermissionCatalogue.ts`.

**Transport**
`functions/src/index.ts` — `parseQualifyingNodes`, `parseRewardProgramDraftFields`, `parseRecordPurchaseRequest`, `recordPurchase`, `listRewardPrograms` registrations.

**Frontend**
`apps/web/src/business/dashboard/PurchaseRecordsPage.tsx` (full); `dashboard/QualifyingNodeSelector.tsx` (full); `dashboard/RewardProgramManagementPage.tsx`; `api/purchaseMutations.ts` (full); `api/rewardProgramMutations.ts`; `hooks/rewardProgramQueries.ts`; `hooks/queryKeys.ts`; `hooks/businessQueries.ts`; `i18n/locales/{en,fr}.ts` (reference surface).

**Governance**
`decision-register.md` (`DEC-LOY-014/015/016`), the `FD-REWARD-QUALIFYING-ITEM-001` evidence file, `documentation-changes-log.md` (header + Entries 236/237/238, ordering convention).

## 4. Current end-to-end identity trace

Traced from source, Business → Reward availability. **PB-011's trace is confirmed correct.** Four material additions this task established by direct inspection are marked **[NEW]**.

```
Business Owner
 └─ RewardProgramManagementPage.tsx
     └─ QualifyingNodeSelector.tsx  (businessTypeId-scoped default list + debounced search escape hatch)
         emits QualifyingNodeWire[] = { knowledgeNodeId: string, businessDisplayName: string | null }[]
 └─ createRewardProgram / updateRewardProgramDraft / createNextRewardProgramVersion / publishRewardProgramVersion
     └─ index.ts :: parseQualifyingNodes  — knowledgeNodeId REQUIRED non-empty string; businessDisplayName optional
     └─ *Command.ts :: validateAllReferences(db, {...})
         ├─ validateOptionalCategoryReference   (skips when null — PB-010B)
         ├─ validateStandardRewardNodeReference (skips when null — reward side, untouched by DEC-LOY-016)
         └─ validateQualifyingNodes  → per node: getKnowledgeNodeById(Firestore)
              must exist · must be standard_product|standard_service · must be isEligibleForNewReference (active)
              else invalidQualifyingNodeError            ◀── THE BLOCKER
     └─ publishRewardProgramVersionCommand.ts also: assertHasQualifyingNodeForPublish(nodes)  (nodes.length > 0)
     └─ rewardProgramRepository.ts :: insertQualifyingNodes / fetchQualifyingNodes
         reward_program_version_qualifying_nodes(reward_program_version_id UUID FK, knowledge_node_id TEXT NOT NULL,
                                                 business_display_name TEXT NULL)
         PRIMARY KEY (reward_program_version_id, knowledge_node_id)
 └─ Reward Program published: reward_programs.status='active', current_version_id set

Frontline operator (staff|manager|owner)
 └─ PurchaseRecordsPage.tsx — form: {rewardProgramId (select), artifactKind, artifactValue, quantity,
                                     itemLabel (free TextField), purchaseDate, notes}
     [NEW] the page NEVER sends knowledgeNodeId. purchase_records.knowledge_node_id is
           unreachable from any shipped UI; it is only settable by a direct callable invocation.
 └─ index.ts :: parseRecordPurchaseRequest — itemLabel required non-empty; knowledgeNodeId optional
 └─ recordPurchaseCommand.ts
     ├─ authorizePurchaseRecord (purchase.record; staff|manager|owner) → resolved role
     ├─ request fingerprint → purchaseRequestHash("create", userId, businessId, rewardProgramId, fingerprint)
     │    [NEW] fingerprint INCLUDES itemLabel and knowledgeNodeId — it is the idempotency identity of the request.
     ├─ if knowledgeNodeId present → validateQualifyingNodes(db, [{knowledgeNodeId, businessDisplayName:null}])
     │    i.e. re-validated against Commerce Knowledge standalone, NEVER against the version's own qualifyingNodes
     └─ withPlatformTransaction:
         ├─ lockRewardProgramById → program∈Business, program.status='active', currentVersionId non-null
         ├─ [NEW] lockRewardProgramVersionById(program.currentVersionId)
         │    THE APPLICABLE VERSION IS SERVER-RESOLVED UNDER LOCK. The client supplies rewardProgramId only;
         │    it never supplies, and cannot influence, rewardProgramVersionId.
         ├─ shared-LN gate (FD-PVL-005) · quantity gate (multipleUnitsAllowed)
         ├─ checkAndReserveIdempotencyKey("purchase.create")
         ├─ insertPurchaseRecord — item_label TEXT NOT NULL, knowledge_node_id TEXT NULL
         │    NO FK, NO CHECK, NO cross-reference to reward_program_version_qualifying_nodes
         ├─ appendPurchaseRecordEvent (∅ → waiting_for_customer)
         ├─ insertTrustEvent('purchase.recorded', payload: {rewardProgramId, rewardProgramVersionId,
         │                    quantity, presentedArtifactType})   [NEW] no item identity in the payload
         ├─ insertNotificationIntent · writePurchaseOutboxEntry · completeIdempotencyKey
         └─ COMMIT

Customer
 └─ verifyPurchaseCommand.ts / rejectPurchaseCommand.ts / raisePurchaseDisputeCommand.ts
     [CONFIRMED by grep] ZERO references to itemLabel / knowledgeNodeId / qualifyingNodes in
     verifyPurchaseCommand.ts, verifiedUnitRepository.ts, loyaltyCycleRepository.ts.
 └─ verified_units (credit) → verified_unit_allocations → loyalty_cycles.allocated_units (CHECK <= 10)
 └─ threshold → rewards (UNIQUE rewards_one_per_cycle), terms from the CYCLE's opened_under_version_id
```

**What each existing identifier actually represents (task spec §3 requirement — do not assume equivalence):**

| Identifier | What it actually is today | Is it the new QualifyingItem? |
|---|---|---|
| `knowledgeNodeId` (on `QualifyingNode`) | An opaque **Firestore-owned** Commerce Knowledge node id, platform-curated, globally unique, of type `standard_product`/`standard_service`, required to exist and be `active`. It is the *current qualification authority*. | **No.** It is platform-owned, not Business-owned; under `DEC-LOY-016` it becomes optional classification. |
| `businessDisplayName` (on `QualifyingNode`) | Nullable presentation alias, per version, currently populated by the UI from the resolved Commerce Knowledge label — not from operator input. It carries **no identity** and cannot exist without a `knowledgeNodeId` (schema `NOT NULL` + PK). | **No.** It is the closest existing thing to a Business-authored name but has no id and no independent existence. |
| `purchase_records.item_label` | Required free text typed by the operator per purchase. No relationship to the version's `qualifyingNodes`. Displayed as the purchase's title in the list/detail UI. | **No.** It is unvalidated presentation text. |
| `purchase_records.knowledge_node_id` | Optional, standalone, Commerce-Knowledge-validated-if-present, never checked against the version's qualifying set, and **unreachable from any shipped UI**. | **No.** Effectively dead weight today. |
| `rewardProgramId` | Stable `reward_programs.id` (UUID). Business-scoped. | No — a programme, not an item. |
| `rewardProgramVersionId` | Stable `reward_program_versions.id` (UUID); the immutable historical commercial authority. Purchases bind permanently to their creation-time version (`DEC-PROD-014`). | No. |

**Where product/item identity exists today:** nowhere, structurally. The only *structured* item identity anywhere in the spine is a Firestore-owned canonical node id on the Reward Program Version. The Purchase Record — the object that actually asserts "this transaction happened for this thing" — has **no structured item identity at all**. This is a pre-existing gap independent of Commerce Knowledge (PB-011 §I disclosed it; this task re-confirms it from source and adds that the dispute vocabulary already contains `dispute_reason = 'wrong_item'`, a customer verdict with **no structured field to dispute against**).

## 5. QualifyingItem model recommendation

PB-011 recommended a new Business-owned `QualifyingItem` entity (its Option 2). **This task validates that recommendation and adopts it**, with one correction to the reasoning and a tightened minimum shape.

**Correction to PB-011's Option-1 rejection.** PB-011 argued Option 1 (adapt `reward_program_version_qualifying_nodes` by making `knowledge_node_id` nullable) is "fragile" because "Postgres does not enforce uniqueness across multiple `NULL`s in a unique/PK constraint." That is true of `UNIQUE` but understates the case here: `knowledge_node_id` is half of a **`PRIMARY KEY`**, and PostgreSQL forbids `NULL` in a primary-key column outright. `ALTER COLUMN knowledge_node_id DROP NOT NULL` would be **rejected while the PK exists**. Option 1 is therefore not merely fragile — it is impossible without dropping and replacing the primary key, at which point a new stable identity column must be introduced anyway. PB-011's conclusion is right; the reason is stronger than stated.

**Minimum Phase 1 model, derived from this repository's own conventions:**

```
QualifyingItem {
  id            UUID   PRIMARY KEY DEFAULT gen_random_uuid()   -- house convention: every PG-owned
                                                               -- entity (reward_programs,
                                                               -- reward_program_versions,
                                                               -- purchase_records, verified_units,
                                                               -- loyalty_cycles, rewards) uses exactly this
  businessId    TEXT   NOT NULL        -- opaque Firestore ref, NEVER a PG FK (0001 header comment)
  name          TEXT   NOT NULL
  knowledgeNodeId TEXT NULL            -- optional classification; opaque Firestore ref
  status        TEXT   NOT NULL DEFAULT 'active' CHECK (status IN ('active','retired'))
  createdAt     TIMESTAMPTZ NOT NULL DEFAULT now()
  createdBy     TEXT   NOT NULL
  updatedAt     TIMESTAMPTZ NOT NULL DEFAULT now()
  updatedBy     TEXT   NOT NULL
  schemaVersion INTEGER NOT NULL DEFAULT 1
}
```

Every convention question the task spec §4 lists, answered **from the repository**, not invented:

| Question | Answer | Evidence |
|---|---|---|
| Exact identifier type | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` | Used by all six PG-owned entity tables (`0001`, `0002`, `0008`, `0009`, `0010`, `0012`). |
| Table ownership | PostgreSQL-authoritative, Business referenced as opaque `TEXT` | `0001` header: "opaque Firestore-owned references … never PostgreSQL foreign keys." `FD-PVL-001` authorizes PG for this spine. |
| Timestamps | `created_at`/`updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` plus `created_by`/`updated_by TEXT NOT NULL` | `reward_programs` carries exactly this quartet. |
| `schema_version` | `INTEGER NOT NULL DEFAULT 1` | Present on every product table in this schema. |
| Lifecycle representation | A `status TEXT` string enum with a DB `CHECK`, mirrored by a `as const` tuple + derived TS union in the model file | `REWARD_PROGRAM_STATUSES` / `REWARD_PROGRAM_VERSION_STATUSES` in `rewardProgram.ts`; `CHECK (status IN (...))` in `0001`/`0002`. |
| Is rename supported? | **Yes.** `RewardProgramRow.displayName` is a mutable (non-`readonly`) field on a live entity while published *versions* are frozen. The same split applies: live `QualifyingItem.name` mutable; the version's snapshot frozen. | `rewardProgram.ts` field modifiers; RF-2 versioning discipline in `0002`'s header. |
| Is archive/retire required? | **Yes, minimally.** Without it a Business can never stop offering an item without deleting history, and the codebase has no delete path for referenced rows (`ON DELETE RESTRICT` everywhere). `active`/`retired` is the minimum. | `0009`/`0010`/`0012` all use `ON DELETE RESTRICT`; Commerce Knowledge already models the identical split (`isEligibleForNewReference` vs `isResolvableForExistingReference`). |
| Uniqueness rules | Per-version-per-item uniqueness only, expressed by the junction table's PK. **No global and no per-Business name uniqueness constraint.** | Nothing in `FD-REWARD-QUALIFYING-ITEM-001` requires it; the only global-uniqueness concern in this platform is Commerce Knowledge's curated catalogue, explicitly untouched (FD §9). |
| Duplicate names permitted? | Engineering default: **yes at the database layer**, with a client-side duplicate warning. Flagged as a light product question (§17 FQ-2) — not a blocker. | No authority either way. |
| Case-sensitive for uniqueness? | Moot under "no uniqueness constraint." If FQ-2 resolves to "reject duplicates," the repository has no `CITEXT`/`lower()` index precedent, so a `UNIQUE (business_id, lower(name)) WHERE status='active'` expression index would be new — a reason to prefer the no-constraint default for Phase 1. | Direct inspection: no case-folding index exists anywhere in `migrations/`. |
| Historical display-name snapshot on versions? | **Required.** See §8. | RF-2; the existing `business_display_name` column already plays exactly this (weaker) role. |
| Optional Commerce Knowledge mapping representation | A single nullable `knowledge_node_id TEXT NULL` column on `qualifying_items` (zero-or-one), plus a frozen per-version copy. Validated **only when non-null**, by the unchanged `assertNodeEligible`. | Mirrors `validateOptionalCategoryReference`'s established shape exactly (`rewardProgramKnowledgeValidation.ts`). |

**Not added in Phase 1** (deliberately, to keep the slice minimal): no per-item price, no SKU, no category, no per-item unit rules, no multi-node mapping, no soft-delete, no per-branch scoping.

## 6. Reward Program binding design

**Decision: option (B) — replace `reward_program_version_qualifying_nodes` with a QualifyingItem-keyed junction table.** Not (A) adapt-in-place (impossible without a PK replacement, §5), not (C) coexist (two tables both claiming to answer "what qualifies for this version" is exactly the dual-authority pattern `FD-PVL-001` forbids for the Purchase spine, and doubles the publish-validation surface).

**Replacement junction table** (name proposed, not reserved — `0003`'s header establishes that this repository proposes its own table names):

```
reward_program_version_qualifying_items (
  reward_program_version_id   UUID NOT NULL REFERENCES reward_program_versions (id) ON DELETE CASCADE,
  qualifying_item_id          UUID NOT NULL REFERENCES qualifying_items (id) ON DELETE RESTRICT,
  item_name_at_version        TEXT NOT NULL,     -- frozen snapshot  (replaces nullable business_display_name)
  knowledge_node_id_at_version TEXT NULL,        -- frozen snapshot of the optional classification
  PRIMARY KEY (reward_program_version_id, qualifying_item_id)
)
```

- **Multi-valued cardinality preserved.** The array shape survives end to end unchanged: `RewardProgramVersionRow.qualifyingItems: readonly QualifyingItem[]`, `parseQualifyingItems` over an array, `insertQualifyingItems` looping inserts, `fetchQualifyingItems` returning many. One programme, one or more items — the existing `QualifyingNode[]` cardinality is not a new capability and is not reduced.
- **The PK is now safe** because `qualifying_item_id` is never null — it is the stable identity `knowledge_node_id` was standing in for.
- **`ON DELETE RESTRICT` on `qualifying_item_id`** (not `CASCADE`): a published version's qualification definition must never be erasable by deleting an item row. This matches `0009`/`0010`/`0012`'s uniform `RESTRICT` posture. Retirement, not deletion, is the lifecycle operation.
- **Commerce Knowledge authority is not preserved just because the current schema uses `knowledgeNodeId`.** The column survives only as a frozen, nullable *classification* snapshot with no validation power at read time.
- **Additive composite UNIQUE for relational enforcement** (see §7): the junction table's own PK `(reward_program_version_id, qualifying_item_id)` is directly usable as a composite FK target, exactly as `0007` added composite UNIQUEs on the Reward Program tables so that `purchase_records` and `loyalty_cycles` could prove scope relationally rather than by application precheck.
- **`assertHasQualifyingNodeForPublish` is retained verbatim** (renamed at most). It counts; it never inspects shape. `FD-REWARD-QUALIFYING-ITEM-001` §2.3 explicitly requires the ≥1 invariant.
- **Draft-with-zero-items stays legal.** `rewardProgramKnowledgeValidation.ts`'s own comment records why the ≥1 rule is publish-only and not in `validateAllReferences`. That reasoning is identity-model-agnostic and must not be changed.

## 7. Purchase-binding design

**PB-011's gap is confirmed from source:** `recordPurchaseCommand.ts` performs no check of any kind that the recorded item corresponds to the applicable version's configured qualifying set. `purchase_records` has no FK, no CHECK, and no application read touching `reward_program_version_qualifying_nodes`.

**Design: `RecordPurchaseRequest` gains a required `qualifyingItemId: string`; `itemLabel` becomes a server-derived snapshot.**

The ten questions the task spec §6 demands be answered explicitly:

**1. Who chooses the qualifying item at transaction time?** The frontline operator (staff, manager, or owner — whoever holds `purchase.record`), on `PurchaseRecordsPage.tsx`, at the moment of recording. Not the customer, not the server.

**2. From what list?** From the **already-loaded** `currentVersion.qualifyingItems` of the Reward Program the operator selected in the existing programme `<select>`. **This requires no new callable and no new authorization surface** — a finding this task establishes and PB-011 did not: `PurchaseRecordsPage.tsx` already calls `useRewardProgramsQuery(businessId)`; `listRewardPrograms` is gated by `authorizeRewardProgramRead`, which is **membership-only** (staff included, explicitly not permission-gated, per `rewardProgramAuthorization.ts`'s own header); `listRewardProgramsForBusiness` calls `getVersionById` per program, which calls `fetchQualifyingNodes`. The qualifying set is therefore **already on the client, already authorized, already cached under `businessQueryKeys.rewardPrograms`**. The item picker is a second `<select>` populated from data the page has in hand. PB-011 §L's proposed `listQualifyingItemsForBusiness` callable is **not required for the purchase path** (it is still warranted for the *management* path, §12).

**3. How is the applicable Reward Program/version known?** **Server-side, under lock, and not client-supplied.** `recordPurchaseCommand.ts` reads `program.currentVersionId` after `lockRewardProgramById`, then `lockRewardProgramVersionById`, and asserts `version.status === 'active'`. `parseRecordPurchaseRequest` does not parse any version id and the whitelist parser structurally cannot accept one. The client supplies `rewardProgramId` only. **Eligibility must therefore be validated against the locked version, inside the transaction — never against the client's view.**

**4. Exactly one qualifying item on the programme?** The UI pre-selects it and may render it as read-only confirmation text rather than a picker. The wire still carries `qualifyingItemId` explicitly — the server never infers it, because inferring "the only one" from a client-side read would silently bind a purchase to whichever item the *client's possibly-stale cache* believed was the only one. Server behaviour is identical in both cases.

**5. Several qualifying items?** The operator picks one from the second `<select>`. **One purchase record binds to exactly one qualifying item** (with `quantity`), matching the existing one-`item_label`-per-record shape. A transaction spanning two different qualifying items is two Purchase Records — which is also what the existing `verified_units_one_credit_per_purchase` unique index and the per-record verification vocabulary already assume. Multi-item single-record is out of scope and not required by `FD-REWARD-QUALIFYING-ITEM-001`.

**6. Can a purchase reference an archived item?** **Yes, if and only if that item is on the locked active version's frozen junction rows.** This is derived, not invented: it is the exact existing `isEligibleForNewReference` (write/draft-add time) vs `isResolvableForExistingReference` (read/existing-reference time) split the Commerce Knowledge domain already implements and that `QualifyingNodeSelector.tsx` already honours in its "no longer available" section. A published version is immutable; if its qualification definition said "Black Coffee" when it was published, retiring the live item must not retroactively make purchases against that published version unrecordable. Retirement blocks **adding to a new draft**, never operating an already-published version. The correct check is therefore *membership in the locked version's set*, and it deliberately does **not** consult `qualifying_items.status`.

**7. Historical purchases after a rename?** Unaffected. The purchase stores `qualifying_item_id` (stable) plus `item_label` frozen at record time (readable receipt). The version stores `item_name_at_version` frozen at publish time. Renaming the live item changes neither. All three layers — live item, published version snapshot, purchase snapshot — are independently correct.

**8. Does `itemLabel` remain stored?** **Yes.** Recommended retained, not dropped.

**9. What is its purpose after `qualifyingItemId` exists?** It becomes the **frozen display-name-at-purchase-time snapshot**, server-derived from the locked version's `item_name_at_version` — no longer operator free text. Reasons: (a) `purchase_records.item_label` is `NOT NULL` and every existing row has a value, so keeping the column is a pure no-op for existing data; (b) `PurchaseRecordsPage.tsx` renders `purchase.itemLabel` as the record's title in both the list and the detail view, and `CustomerActivityPage.tsx` also reads it — dropping it breaks two shipped surfaces for no benefit; (c) a permanently readable receipt must survive rename and retirement. **It must stop being authority-bearing input**: see §10 for why the transport must reject a client-supplied `itemLabel` rather than merely ignore it.

**10. Where must ownership/programme eligibility be enforced server-side?** In **three** places, defence in depth, matching this codebase's own layered posture:

1. **Transport** (`index.ts::parseRecordPurchaseRequest`) — parse `qualifyingItemId` as a required non-empty string; **remove `itemLabel` from the whitelist parser entirely** so a client cannot supply it at all (the parser is already a deliberate mass-assignment whitelist with its own regression test in `index.test.ts`).
2. **Application, inside the transaction, after the version lock** (`recordPurchaseCommand.ts`) — read the locked version's qualifying-item set and assert `qualifyingItemId ∈ set`; derive `itemLabel` from that row's `item_name_at_version`. This is the *authoritative* check: it runs against the locked version, so it cannot be raced by a concurrent publish.
3. **Database, relationally** — composite foreign keys, the pattern this schema already uses everywhere instead of trusting application prechecks (`purchase_records_version_in_program`, `purchase_records_program_in_business`, `verified_units_matches_purchase`, `rewards_governing_version`, and the `0007` composite UNIQUEs added expressly to back them). **This task adds this layer; PB-011 proposed only a plain FK to `qualifying_items` plus an application check.**

```
-- programme-eligibility, relationally: the item must be on THIS purchase's version
CONSTRAINT purchase_records_item_in_version FOREIGN KEY
  (reward_program_version_id, qualifying_item_id)
  REFERENCES reward_program_version_qualifying_items
  (reward_program_version_id, qualifying_item_id) ON DELETE RESTRICT,

-- cross-Business protection, relationally (needs an additive composite UNIQUE on qualifying_items)
CONSTRAINT qualifying_items_identity_tuple_unique UNIQUE (id, business_id),   -- on qualifying_items
CONSTRAINT purchase_records_item_in_business FOREIGN KEY
  (qualifying_item_id, business_id)
  REFERENCES qualifying_items (id, business_id) ON DELETE RESTRICT
```

With these, a cross-Business or fabricated `qualifyingItemId` is rejected by the database even if every application check were somehow bypassed — exactly the guarantee `0008`'s own comment demands ("backs onto the 0007 additive UNIQUEs — never application prechecks alone").

**Idempotency fingerprint — a correctness requirement PB-011 did not identify.** `recordPurchaseCommand.ts` builds its request fingerprint from a field list that currently includes `itemLabel` and `knowledgeNodeId`. `qualifyingItemId` **must be added to that fingerprint** and `itemLabel` removed from it in the same change. If it is not: two genuinely different purchases for the same customer/programme/quantity/date differing only in qualifying item would produce an identical `requestHash`, and a client reusing an idempotency key would receive the first purchase's snapshot back as a "duplicate" — silently recording the wrong item, or, with a fresh key, passing a `conflict` verdict incorrectly. This is a trust-relevant detail, not an ergonomic one.

## 8. Historical/versioning design

The rule: **a published Reward Program Version must remain reproducible verbatim, regardless of anything the Business later does to its live items.**

| Thing | Referenced (live, may change) | Snapshotted (frozen, must not change) |
|---|---|---|
| Item identity | `reward_program_version_qualifying_items.qualifying_item_id` → `qualifying_items.id` | — (the id itself is immutable) |
| Item name | `qualifying_items.name` (mutable, renameable) | `reward_program_version_qualifying_items.item_name_at_version` (**`NOT NULL`**) |
| Optional CK classification | `qualifying_items.knowledge_node_id` (mutable: map / unmap / remap freely) | `reward_program_version_qualifying_items.knowledge_node_id_at_version` (nullable) |
| Item lifecycle | `qualifying_items.status` (`active` → `retired`) | — deliberately **not** snapshotted: a version's membership list is itself the historical fact; status is a live-only, draft-add-time concern (§7 Q6) |
| Purchase-time item name | — | `purchase_records.item_label` (server-derived from `item_name_at_version` at record time) |

Three consequences, stated explicitly:

- **Rename.** Same `qualifying_items.id`, new `name`. Already-published versions keep their `item_name_at_version`. A version created *after* the rename snapshots the new name. This is precisely the `RewardProgramRow.displayName`-mutable / `reward_program_versions`-frozen split the codebase already implements (RF-2, `0002` header).
- **Retire.** `status='retired'` blocks adding the item to a **new draft**; it invalidates nothing already published and blocks no purchase against an already-active version (§7 Q6).
- **Remap/unmap classification.** Purely live. No published version's frozen `knowledge_node_id_at_version` moves. A version whose snapshot classification points at a node later retired in Firestore is still readable — `resolveKnowledgeNodeLabels`'s `isResolvableForExistingReference` gate already resolves labels for any status, and must be retained unchanged (§14).

**`item_name_at_version` is `NOT NULL`, unlike today's `business_display_name TEXT NULL`.** This is a strengthening, and it is the reason the new junction table is a replacement rather than an in-place adaptation: under the new model the snapshot name is the only human-readable record of what qualified, so it can never be absent.

## 9. 10+1 non-regression conclusion

**Proven, not assumed. The downstream engine does not need QualifyingItem identity, and introducing `qualifyingItemId` requires zero downstream change.**

Evidence, by direct grep and read on `b2f1fda`:

- `verifyPurchaseCommand.ts` (442 lines), `verifiedUnitRepository.ts`, `loyaltyCycleRepository.ts` (472 lines): **zero occurrences** of `itemLabel`, `item_label`, `knowledgeNodeId`, `knowledge_node_id`, `qualifyingNode`, or `qualifying_node`.
- `verified_units` (`0009`) is keyed by `(purchase_record_id, business_id, customer_identity_id, reward_program_id, reward_program_version_id)` + `quantity` + `entry_type`. No item column exists or is proposed.
- `loyalty_cycles` (`0010`) carries `allocated_units INTEGER CHECK (>= 0 AND <= 10)` and `opened_under_version_id`. No item column.
- `rewards` (`0012`) derives its terms from the cycle's `opened_under_version_id` via the `rewards_governing_version` FK. No item column.
- The threshold is a DB `CHECK (required_verified_units = 10)` plus the `REQUIRED_VERIFIED_UNITS_MVP` constant. Neither is touched.

**Recommendation: keep the 10+1 engine byte-for-byte unchanged.** No item/product taxonomy is introduced into Circle progression. `verified_units`, `verified_unit_allocations`, `loyalty_cycles`, `loyalty_cycle_streams`, and `rewards` receive **no new column and no new read**. Item identity is inherited transitively through `verified_units.purchase_record_id` for any future reporting need, exactly as `purchase_records.branch_id` and `unit_value_minor` already are. `DEC-LOY-001`'s guard against configurable thresholds is untouched; `FD-PVL-002`'s allocation semantics are untouched.

## 10. Trust/security validation design

Every item the task spec §8 enumerates, with the control that covers it.

| Threat / property | Control after this change | Status |
|---|---|---|
| **Business ownership** | `authorizePurchaseRecord` resolves the actor's Business membership server-side; plus the new relational `purchase_records_item_in_business` composite FK against `qualifying_items (id, business_id)`. | Strengthened (new relational layer) |
| **Reward Program / version membership** | In-transaction read of the **locked** version's junction rows; plus the relational `purchase_records_item_in_version` composite FK. | **New — closes the pre-existing gap** |
| **Active/archived status** | `qualifying_items.status` checked at **draft-add time only** (`validateQualifyingItems`), deliberately not at purchase time (§7 Q6). | New, scoped |
| **Transaction-time eligibility** | Derived from the locked `program.currentVersionId` → `version.status='active'`, unchanged; item membership checked against that same locked version. | Strengthened |
| **Fabricated IDs** | Rejected at the application layer (not in the locked version's set) and, independently, by the composite FK. | **New** |
| **Cross-Business IDs** | Same two layers; the `(qualifying_item_id, business_id)` FK makes it structurally impossible. | **New** |
| **Stale programme versions** | Unchanged: the client never supplies a version id (`parseRecordPurchaseRequest` whitelist); the server resolves and locks `currentVersionId`. A client holding a stale cached item list fails the in-transaction membership check rather than binding to a stale version. | Unchanged, now enforced |
| **Replay / idempotency** | `peekIdempotencyKey` → `checkAndReserveIdempotencyKey('purchase.create')` → `completeIdempotencyKeyInTransaction`, all unchanged. **`purchaseRequestHash`'s fingerprint must add `qualifyingItemId` and drop `itemLabel`** (§7) — otherwise idempotency becomes item-blind. | Unchanged mechanism, **fingerprint change mandatory** |
| **Free-text bypass** | `itemLabel` is **removed from the transport whitelist** and derived server-side. A client cannot assert an item name at all. | **New** |
| **Trust Event behaviour** | `purchase.recorded` remains emitted in-transaction with the same `event_type`/`subject_type`/`subject_id`/causal linkage. **Recommended additive change only:** include `qualifyingItemId` in the JSONB `payload` (which already carries `rewardProgramId`, `rewardProgramVersionId`, `quantity`, `presentedArtifactType`). No `0013` `CHECK` constraint touches payload contents, so this is schema-free. | Unchanged + additive payload |
| **Dispute evidence** | `purchase_records.dispute_reason` already includes `'wrong_item'` — today a customer can raise it against nothing but free text. After this change the disputed claim is a specific, server-validated, Business-configured item. **This is a direct trust improvement**, and a reason not to defer the purchase binding to a later phase. | **Materially strengthened** |

**Nothing is weakened.** No existing Trust Event type is removed or re-typed, no idempotency operation type changes, no verification/reject/dispute command is touched, no authorization boundary is loosened, and `assertNodeEligible` keeps full authority whenever a Commerce Knowledge mapping is actually present.

## 11. Commerce Knowledge optional-mapping design

**Commerce Knowledge becomes enrichment only. A Business must be able to create and operate "Black Coffee" without touching any taxonomy.** No seed content is authored, proposed, or required by this design (`burundiPilotSeedManifest.ts` census confirmed on `b2f1fda`: 6 `industry`, 14 `business_category`, 7 `business_type`, **0** `standard_product`, **0** `standard_service`).

**Reuse of PB-010B discovery for optional mapping — recommended, and it works unchanged.** `QualifyingNodeSelector.tsx` is re-scoped from "choose the thing that qualifies" to "optionally classify this item you already created." Its two data sources (`useQualifyingNodesForBusinessTypeQuery`, `useSearchQualifyingNodesQuery`) and its label fallback (`useKnowledgeNodeLabelsQuery`) are all id-agnostic — they emit and consume canonical node ids and display labels, and nothing about them presumes the node is *authoritative*. The only behavioural change is **multi-select → single-select** (zero-or-one mapping per item, §5).

Retained **unchanged**, all five explicitly named by the task spec:
- **Unpublished-node disclosure protection** — `resolveKnowledgeNodeLabels`'s `isResolvableForExistingReference` gate (the PB-008 CORR-001 C1 P2 fix). Orthogonal to qualification authority; must not be reverted.
- **Language-scoped query caching** — `businessQueryKeys` include `i18n.language` (the PB-008 CORR-001 C2 fix). A mapping picker still renders localized labels, so the bug it fixed still applies.
- **Search bounds** — `MAX_SEARCH_CANDIDATE_NODES_PER_TYPE` / `MAX_SEARCH_RESULTS` (the PB-010B CORR-001 P2 fix).
- **Debounce** — `SEARCH_DEBOUNCE_MS = 300` via `useDebouncedValue`.
- **Canonical Commerce Knowledge ids when mapping is chosen** — the stored value is the real Firestore node id, re-validated server-side by the unchanged `assertNodeEligible` (must exist, must be `standard_product`/`standard_service`, must be `isEligibleForNewReference`). A fabricated or retired mapping is still rejected. Absence of a mapping runs **no** check, because there is nothing to check.

**Phase 1 exposure recommendation.** PB-011 recommended hiding the mapping affordance from Business users entirely in Phase 1. This task recommends a slightly different and cheaper split: **build the QualifyingItem create/edit flow with no taxonomy interaction on the primary path (slices 1–4), and treat the optional "classify this item" control as its own deferrable slice (slice 6)**, so the classification UI is neither deleted nor blocking. The server-side optional column and its conditional validation ship regardless (they are three lines mirroring `validateOptionalCategoryReference`), which keeps a future platform-side enrichment workflow possible with no further schema change. Either choice satisfies the Founder decision; this one avoids deleting working, reviewed PB-008/PB-010B UI code.

## 12. Business/frontline UX flow

Mobile-first, English primary with French supported, **no internal id ever shown to or required from a normal user**.

**A. Business Owner — define items** (`RewardProgramManagementPage.tsx`)
1. "Qualifying items" section. One text field + "Add" button. Type `Black Coffee` → Add. Type `Cappuccino` → Add. Done. No taxonomy, no search, no picker, no id.
2. Each added item shows as a row with its name, a rename affordance, and a "retire" affordance. Optionally (slice 6) a collapsed "Classify (optional)" disclosure per item wrapping the re-scoped `QualifyingNodeSelector`.
3. This is the one place a `listQualifyingItemsForBusiness` read is genuinely warranted (the purchase path does not need it, §7 Q2) — a Business's item library is not otherwise reachable, since the existing `listRewardPrograms` read returns only items already attached to a version.

**B. Business Owner — configure the programme**
4. In the Reward Program draft form, the qualifying-items control becomes a checkbox multi-select over the Business's own items (same visual shape as today's `QualifyingNodeSelector` list, different source). Zero selected is a legal draft; ≥1 is required to publish (unchanged invariant).
5. Publish. `assertHasQualifyingNodeForPublish` unchanged.

**C. Frontline operator — record a purchase** (`PurchaseRecordsPage.tsx`)
6. Existing programme `<select>` (unchanged) — human-readable `program.displayName`.
7. **New: qualifying item `<select>`**, populated from `activePrograms.find(...).currentVersion.qualifyingItems` — data the page already holds (§7 Q2). Options render `item_name_at_version`; the option `value` is the canonical `qualifyingItemId`, which the operator never sees. With exactly one item, it is pre-selected.
8. **The free-text "Item label" `TextField` is removed** from the form. Operators stop typing what was sold; they pick it. Anything genuinely per-transaction ("extra shot", "no sugar") belongs in the existing optional `notes` field, which already exists and is already unvalidated by design.
9. Artifact / quantity / date / notes: unchanged. Submit: unchanged.
10. Net effect on the form: **one control replaced by one control.** No new screen, no new step, no extra tap in the single-item case (it is pre-selected), one tap in the multi-item case — strictly fewer interactions than typing a label on a phone keyboard. Mobile-first is improved, not merely preserved.

**EN/FR surface.** Small and symmetric. New keys under the existing `business` namespace in both `en.ts` and `fr.ts`: `rewardProgram.qualifyingItems.*` (section title, add label/placeholder, add button, empty state, rename, retire, retire confirmation, duplicate-name warning) and `purchase.fieldQualifyingItem` (+ its empty/required validation message). Removed or repurposed: `purchase.fieldItemLabel`. Presentation stays language-isolated because the item name is **Business-authored free text, stored once, never translated** — which is simpler than the Commerce Knowledge path it replaces (per-language `KnowledgeTranslation` documents). The language-scoped query keys remain necessary only for the optional classification picker.

## 13. Migration strategy

**Not executed. Next available version is `0016`** (highest present = `0015`); the README's `NNNN_short_description.sql` + `.down.sql` convention applies.

**Deployed-data assumption — stated, not assumed away.** Repository evidence shows no `INSERT` into `reward_program_version_qualifying_nodes` or `purchase_records` anywhere in `migrations/`, seed, or fixtures. That proves the *repository* ships no rows; it does not prove a deployed database is empty. Every step below is therefore designed to be correct against a table with existing rows, and step 2's backfill is the explicit accommodation.

**Four migrations, additive-then-cutover, mirroring `0015`'s discipline and `0007`'s "add the UNIQUE first, then the FK that needs it" ordering:**

| # | Migration | Content | Safe against existing rows? |
|---|---|---|---|
| `0016` | `create_qualifying_items` | `CREATE TABLE qualifying_items` (§5 shape) + `CONSTRAINT qualifying_items_identity_tuple_unique UNIQUE (id, business_id)` + `CREATE INDEX qualifying_items_business_id_idx` + `qualifying_items_business_id_status_idx`. | Trivially — creates only. |
| `0017` | `create_reward_program_version_qualifying_items` | `CREATE TABLE reward_program_version_qualifying_items` (§6 shape). **Backfill:** for each distinct `knowledge_node_id` in `reward_program_version_qualifying_nodes`, insert one `qualifying_items` row per owning Business (`business_id` obtained by joining version → program), `name` = `COALESCE(business_display_name, knowledge_node_id)`, `knowledge_node_id` copied; then insert the corresponding junction rows with `item_name_at_version = COALESCE(business_display_name, <synth name>)`, `knowledge_node_id_at_version = knowledge_node_id`. Old table **retained, untouched, unread**. | Yes — pure `INSERT ... SELECT`; a no-op on an empty source table. Note `name` may be a raw node id when `business_display_name` was NULL; the Business can rename it afterwards, and no published version's `item_name_at_version` is affected by that rename (§8). |
| `0018` | `purchase_records_qualifying_item` | `ADD COLUMN qualifying_item_id UUID NULL`; **backfill NULL-tolerant** (existing rows keep NULL — see below); add `purchase_records_item_in_business` and `purchase_records_item_in_version` composite FKs as **`NOT VALID`**, then `VALIDATE CONSTRAINT` (PostgreSQL's standard two-step so an existing-row scan does not hold a long `ACCESS EXCLUSIVE` lock). Column stays `NULL` in this migration. | Yes — `ADD COLUMN ... NULL` never rewrites rows in modern PostgreSQL; `NOT VALID` FKs do not block on existing rows, and a NULL FK column is exempt from the constraint. |
| `0019` | `drop_legacy_qualifying_nodes` (**deferred, separate, later**) | `DROP TABLE reward_program_version_qualifying_nodes`; optionally `ALTER COLUMN qualifying_item_id SET NOT NULL` once no NULL rows remain. | Only after `0017`'s backfill is verified in the target environment. **Not part of the initial delivery.** |

**Specified answers to the task spec §11 checklist:**
- **New tables:** `qualifying_items`, `reward_program_version_qualifying_items`.
- **New columns:** `purchase_records.qualifying_item_id UUID NULL`.
- **Altered columns:** none required for delivery. (`purchase_records.item_label` keeps `TEXT NOT NULL`; its *source* changes from client input to server derivation — an application-layer change, not a schema change. This is a deliberate choice: no `ALTER` means no risk to existing rows.)
- **Transitional compatibility:** `0016`–`0018` are purely additive; the old junction table and all old code paths keep working until the commands are cut over. `main` is coherent after each.
- **Backfill:** one genuine backfill (`0017`). Idempotent if written `INSERT ... ON CONFLICT DO NOTHING` against the junction PK.
- **Rollback preconditions:** `0018.down` drops the two FKs then the column — always safe. `0017.down` drops the new junction table and deletes only the `qualifying_items` rows it synthesized (identifiable by `knowledge_node_id IS NOT NULL AND created_by = '<migration marker>'`); **once real Businesses have created their own items, `0017.down` must refuse rather than delete them** — the down migration should document this precondition the way `0015.down` documents its own ("re-adding `NOT NULL` requires no existing NULL rows first"). `0016.down` drops an empty table.
- **Existing qualifying-node records:** preserved byte-for-byte through the delivery; migrated by copy, never by mutation; dropped only in the deferred `0019`.
- **`reward_program_category_id`:** **untouched.** `0015` stands. It is a different field under a different decision (`DEC-LOY-014`), already optional, and is not a qualification gate. Classified RETAIN in §14.
- **Historical programme versions:** fully preserved — every published version gains an exactly-equivalent row set in the new junction table with its name and classification frozen (§8). Nothing is re-derived at read time.

**Deployed-data verification step (required before `0019`, recommended before `0017` runs in any real environment):** `SELECT count(*) FROM reward_program_version_qualifying_nodes;` and `SELECT count(*) FROM purchase_records WHERE qualifying_item_id IS NULL;`. This cannot be answered from the repository and must be answered from the environment.

## 14. PB-008/PB-010B retain/adapt/remove matrix

Every element the task spec §12 names, plus the ones the trace surfaced.

| # | Element | Disposition | Justification |
|---|---|---|---|
| 1 | Reward Category optionality (`0015`, `validateOptionalCategoryReference`, nullable `RewardProgramRow.rewardProgramCategoryId`) | **RETAIN** unchanged | Different field, different decision (`DEC-LOY-014`), already correct; `FD-REWARD-QUALIFYING-ITEM-001` §4 explicitly does not re-litigate it. |
| 2 | `QualifyingNodeSelector.tsx` (component) | **ADAPT** (re-scope) | Same UI mechanics (list + search + debounce + unavailable-section fallback); new role = optional per-item classification picker, single-select. Not deleted. |
| 3 | Commerce Knowledge reads (`getKnowledgeNodeById`, `listActiveSelectableNodes`, `isEligibleForNewReference`, `isResolvableForExistingReference`) | **RETAIN** unchanged | Still the sole authority whenever a mapping is present; the eligibility/resolvability split is reused conceptually for item lifecycle (§8). |
| 4 | `searchQualifyingNodes` (service + callable) | **RETAIN** unchanged | Becomes an optional classification aid. The escape-hatch guarantee it provides is unaffected. |
| 5 | `listQualifyingNodesForBusinessType` (service + callable) | **RETAIN** unchanged | Same — the default-scope classification suggestion list. |
| 6 | `resolveKnowledgeNodeLabels` + its `isResolvableForExistingReference` disclosure gate | **RETAIN** unchanged | A real P2 information-disclosure fix (PB-008 CORR-001 C1). Orthogonal to qualification authority. Must not regress. |
| 7 | Language-scoped query keys (`businessQueryKeys` + `i18n.language`) | **RETAIN** unchanged | A real cache-correctness fix (PB-008 CORR-001 C2); still needed for the classification picker's localized labels. |
| 8 | Search bounds (`MAX_SEARCH_CANDIDATE_NODES_PER_TYPE`, `MAX_SEARCH_RESULTS`) | **RETAIN** unchanged | A real P2 fix (PB-010B CORR-001). Unrelated to this correction. |
| 9 | Debounce (`useDebouncedValue`, `SEARCH_DEBOUNCE_MS = 300`) | **RETAIN** unchanged | Same. |
| 10 | `validateQualifyingNodes` (the mandatory canonical check) | **REPLACE** | Becomes `validateQualifyingItems`: assert each id exists in `qualifying_items`, belongs to this Business, and is `active` (draft-add time); **then**, only where that item carries a non-null `knowledge_node_id`, call the unchanged `assertNodeEligible`. Mirrors `validateOptionalCategoryReference`'s established shape. |
| 11 | `assertHasQualifyingNodeForPublish` | **RETAIN** (rename only) | Identity-model-agnostic; it counts, never inspects. Required by `FD-REWARD-QUALIFYING-ITEM-001` §2.3. Its "publish-only, drafts may be empty" rationale is preserved verbatim. |
| 12 | `reward_program_version_qualifying_nodes` (table) | **REPLACE** (deferred drop) | Superseded by `reward_program_version_qualifying_items`; retained through delivery, dropped only in the separate `0019` (§13). |
| 13 | `QualifyingNode` type / `QualifyingNodeWire` / `parseQualifyingNodes` | **REPLACE** | Become `QualifyingItemRef` / `QualifyingItemWire` / `parseQualifyingItems`. Array cardinality preserved exactly. |
| 14 | `businessDisplayName` (nullable, per-version, CK-derived) | **ADAPT** → `item_name_at_version` (**`NOT NULL`**, Business-authored) | Its snapshot *role* is retained and strengthened; its *source* changes from a resolved CK label to the Business's own name. |
| 15 | `rewardProgramCategoryId` (field itself) | **RETAIN** unchanged | Still optional, still stored, still validated when present. Never becomes a gate again. |
| 16 | RF-3 publish validation (authoritative pre-transaction Firestore read + disclosed bounded race window) | **RETAIN** (scope narrows) | The publish-time authoritative-validation *discipline* is unchanged and still runs. It simply has less to validate: a Firestore read now happens only for items that actually carry a mapping. The disclosed cross-store race window shrinks and never widens. |
| 17 | `purchase_records.knowledge_node_id` + its standalone `validateQualifyingNodes` call in `recordPurchaseCommand.ts` | **REMOVE** from the write path (column retained) | UI-unreachable (§4 **[NEW]**), never cross-checked against the programme, and superseded by `qualifying_item_id` + the item's own optional mapping. The **column stays** (no `ALTER`, no risk to existing rows); the transport parse, the Firestore validation call, and the insert parameter are removed. |
| 18 | `purchase_records.item_label` (column) | **ADAPT** | Column retained `NOT NULL`; source changes from client free text to server-derived snapshot; removed from the transport whitelist (§7, §10). |
| 19 | `purchaseRequestHash` fingerprint field list | **ADAPT (mandatory)** | Add `qualifyingItemId`, drop `itemLabel`/`knowledgeNodeId`. Correctness-critical (§7, §10). |
| 20 | `purchase.recorded` Trust Event payload | **ADAPT (additive)** | Add `qualifyingItemId`. No `0013` constraint touches payload contents. |
| 21 | Existing tests (`rewardProgramCommands.postgres.test.ts`, `purchaseCommands.postgres.test.ts`, `index.test.ts`, `QualifyingNodeSelector.test.tsx`, `RewardProgramManagementPage.test.tsx`, `PurchaseRecordsPage.test.tsx`, `commerceKnowledgeReadService.emulator.test.ts`, `rewardProgramMigrations.postgres.test.ts`) | **ADAPT** | See §15. Every CK-mapping-present assertion must keep passing unchanged. |
| 22 | 10+1 engine (`verifyPurchaseCommand.ts`, `verifiedUnitRepository.ts`, `loyaltyCycleRepository.ts`, `0009`–`0012`, `REQUIRED_VERIFIED_UNITS_MVP`) | **RETAIN — zero diff required** | §9. |
| 23 | Commerce Knowledge seed manifest | **RETAIN — zero diff** | No seeding authorized or required (`FD-REWARD-QUALIFYING-ITEM-001` §10). |
| 24 | Business Participation Terms, redemption, Circle-visibility surfaces | **RETAIN — zero diff** | Explicitly out of scope. |

## 15. Test plan

Every lettered case from the task spec §13, mapped to the suite that must host it. Suite split follows this repository's existing discipline: `*.postgres.test.ts` for PG integration, `*.emulator.test.ts` for Firestore/Commerce Knowledge, `index.test.ts` for transport whitelisting, `*.test.tsx` for UI.

| Case | Assertion | Suite |
|---|---|---|
| A | Create `qualifying_items` row "Black Coffee" with `knowledge_node_id = NULL`; succeeds; no Firestore read is attempted (assert the CK repository mock records zero calls). | `rewardProgramCommands.postgres.test.ts` |
| B | Same for "Medium Pizza". | same |
| C | Two items for one Business coexist with distinct ids; both listable; neither affects the other. | same |
| D | Create + publish a Reward Program version with exactly one Business-owned item, no mapping. | same |
| E | Same with two items; both junction rows persist; `fetchQualifyingItems` returns both in a stable order. | same |
| F | Item id owned by Business B rejected when Business A records/configures — assert **both** the application error **and** (separately, via raw SQL insert) that the `purchase_records_item_in_business` FK rejects it. | `purchaseCommands.postgres.test.ts` + `rewardProgramMigrations.postgres.test.ts` |
| G | Fabricated UUID rejected at draft-add, at publish, and at purchase; plus raw-SQL FK rejection. | same two |
| H | `assertHasQualifyingItemForPublish`: publishing with zero items still throws `rewardProgramPublishRequiresQualifyingNodeError`; a draft with zero items still saves successfully (**both halves**, guarding the publish-only rationale). | `rewardProgramCommands.postgres.test.ts` |
| I | Rename a live item after publishing v1; assert v1's `item_name_at_version` is unchanged, a new v2 snapshots the new name, and a purchase recorded under v1 keeps its original `item_label`. | same + `purchaseCommands.postgres.test.ts` |
| J | Retire an item: adding it to a **new draft** is rejected; the already-published active version still accepts a purchase for it; reading the historical version still returns it. | both |
| K | The `0017` backfill: seed a legacy `reward_program_version_qualifying_nodes` row, run migrations, assert exactly one synthesized `qualifying_items` row and one equivalent junction row with the name/classification carried across; assert idempotent re-run adds nothing. | `rewardProgramMigrations.postgres.test.ts` |
| L | A recorded purchase persists a non-null `qualifying_item_id` matching the selected item. | `purchaseCommands.postgres.test.ts` |
| M | Recording with an item id that exists and belongs to the Business but is **not on the locked current version** is rejected — and the same insert attempted via raw SQL is rejected by `purchase_records_item_in_version`. | same + migrations suite |
| N | A client-supplied `itemLabel` in the callable payload is **not** honoured: `parseRecordPurchaseRequest` does not surface it, and the persisted `item_label` equals the version's `item_name_at_version`. Extends the existing mass-assignment regression test. | `index.test.ts` |
| N2 | (added) Two purchases differing **only** in `qualifyingItemId` produce different `requestHash` values; reusing one idempotency key across them yields a conflict, not a silent duplicate. | `purchaseCommands.postgres.test.ts` |
| O | Existing verify / reject / dispute flows pass unmodified. | same |
| P | Verified Unit issuance: exactly one `credit` row per verified purchase; `verified_units_one_credit_per_purchase` still holds. | same |
| Q | Circle progression: allocation, the `allocated_units <= 10` CHECK, overflow-as-pending, and `loyalty_cycles_one_current_per_customer_program` all unchanged. | same |
| R | Exactly one Reward at threshold (`rewards_one_per_cycle`), terms drawn from `opened_under_version_id`. | same |
| S | Trust Events: `purchase.recorded` still emitted in-transaction with unchanged type/subject/causal linkage; payload additionally contains `qualifyingItemId`. | same |
| T | Idempotency: replay returns the identical snapshot; `in_progress` and `conflict` verdicts unchanged. | same |
| U | An item **with** a mapping still triggers `assertNodeEligible`; a retired / wrong-typed / nonexistent mapping is still rejected. | `commerceKnowledgeReadService.emulator.test.ts` + `rewardProgramCommands.postgres.test.ts` |
| V | An item **without** a mapping performs zero Commerce Knowledge reads across create, edit, publish, and purchase. | same |
| W | EN/FR: both locale files export every new key (the repository's existing locale-parity test pattern); the classification picker's query keys remain language-scoped so an EN result set never serves an FR render. | `apps/web` locale + query-key suites |
| X | `PurchaseRecordsPage.test.tsx`: the form renders a **named** item option, exposes no UUID in any visible text node, contains no free-text item field, and pre-selects when exactly one item exists. `RewardProgramManagementPage.test.tsx`: an item can be added and attached with zero taxonomy interaction. | UI suites |

**Regression boundary assertion (explicit gate):** `git diff --stat` on the implementation PR must show **zero** lines changed in `verifyPurchaseCommand.ts`, `verifiedUnitRepository.ts`, `loyaltyCycleRepository.ts`, `loyaltyInvariants.ts`, `burundiPilotSeedManifest.ts`, migrations `0009`–`0014`, and anything under Business Participation Terms. Make this a review checklist item, not an aspiration.

## 16. Proposed implementation slices

**Recommendation: five slices (plus one deferred), not one package.** `main` is coherent and shippable after each. Rationale for not doing one package: the migration + backfill (slice 1) is the only step with real deployed-data risk and deserves to be merged, run, and verified in isolation before any command depends on it; and the frontline purchase change (slice 4) is the only user-visible behavioural change and deserves its own Founder preview.

| Slice | Objective | Files / domains | Migration impact | Test gate | Depends on | Founder preview |
|---|---|---|---|---|---|---|
| **1** | Schema foundation, additively | `migrations/0016_*`, `0017_*` (+ `.down.sql`); `rewardProgramMigrations.postgres.test.ts` | `0016`, `0017` (incl. backfill) | K; full migration up/down/idempotent-rerun suite | — | No (invisible) |
| **2** | `QualifyingItem` domain: model, repository, validation, authorization, callables | `rewardProgram/models/rewardProgram.ts`; new `repositories/qualifyingItemRepository.ts`; `services/rewardProgramKnowledgeValidation.ts`; new `services/qualifyingItemCommands.ts`; `index.ts` (create/list/rename/retire callables + parsers) | none | A, B, C, F(app), G(app), U, V | 1 | No |
| **3** | Reward Program binding cutover | `rewardProgram/repositories/rewardProgramRepository.ts`; the four `*Command.ts`; `index.ts` parsers; `rewardProgramCommands.postgres.test.ts` | none (reads/writes the `0017` table) | D, E, H, I, J, U, V + full `rewardProgram` suite | 2 | **Yes** — a Business can now define "Black Coffee" and publish, end to end, server-side |
| **4** | Purchase binding + trust hardening | `migrations/0018_*`; `purchase/models/purchase.ts`; `repositories/purchaseRecordRepository.ts`; `services/recordPurchaseCommand.ts`; `services/purchaseRequestHash.ts`; `index.ts::parseRecordPurchaseRequest`; `purchaseCommands.postgres.test.ts`; `index.test.ts` | `0018` (additive column + `NOT VALID`→`VALIDATE` FKs) | L, M, N, N2, O, P, Q, R, S, T + the §15 zero-diff gate | 3 | **Yes** — highest-risk slice |
| **5** | Business + frontline UI, EN/FR | `apps/web/.../RewardProgramManagementPage.tsx`; new qualifying-items section; `PurchaseRecordsPage.tsx`; `api/rewardProgramMutations.ts`; `api/purchaseMutations.ts`; `hooks/*`; `queryKeys.ts`; `i18n/locales/{en,fr}.ts`; the three UI test files | none | W, X + full `apps/web` suite | 4 | **Yes** — the operator-visible change |
| **6** | *(Optional / deferrable)* Re-scoped optional classification picker | `QualifyingNodeSelector.tsx` (multi→single select, attached per item) | none | U, V, W re-run; PB-008/PB-010B retain-row regressions (matrix rows 4–9) | 5 | Optional |
| **7** | *(Deferred, environment-gated)* Legacy cleanup | `migrations/0019_*` | `DROP TABLE` + optional `SET NOT NULL` | verified row counts in the target environment (§13) | 6, **plus environment verification** | No |

**No new governance package is proposed.** `DEC-LOY-016` is sufficient authority for slices 1–5; slice 7 needs an operational verification, not a decision. The only thing that may need a Founder answer before slice 2 lands is FQ-1 (§17), and a safe default exists.

## 17. Founder/product questions discovered

Raised per the task spec's STOP instruction. **None blocks slices 1 or 3–5 outright; FQ-1 shapes slice 2 and is the one worth answering first.**

**FQ-1 (most important) — Who may create, rename, and retire a Business's qualifying items?**
`rewardProgramPermissionCatalogue.ts` grants `rewardProgram.manage` as `{owner: true, manager: false, staff: false}` — **Owner-only**, with an explicit test asserting that no grant override can widen it. `purchase.record`, by contrast, is Staff/Manager/Owner (and its own catalogue comment calls out the deliberate contrast). Reusing `authorizeRewardProgramManage` — the safe, non-inventive default, and what PB-011 §L recommended — therefore makes **only the Owner** able to add "Cappuccino" to the menu. For a coffee shop or a restaurant whose offer changes weekly, that may be the wrong operational shape, and a Manager-capable item catalogue is a plausible product intent. This is **not derivable** from any recorded decision: `FD-REWARD-QUALIFYING-ITEM-001` §2.6 says only "the Business remains responsible for defining its commercial offer," which does not resolve which role inside the Business. *Engineering default if unanswered:* reuse `rewardProgram.manage` (Owner-only), which is non-regressive and can be widened later by a catalogue change with no schema impact. *Founder decision required to widen it*, because the permission catalogue is a governed artifact.

**FQ-2 — Are duplicate qualifying-item names within one Business permitted?**
No authority either way. Engineering default: permitted at the database layer (no uniqueness constraint), with a client-side duplicate-name warning. Rejecting duplicates would need a case-folding expression index for which this repository has **no precedent** (§5) — a reason to prefer the default. Non-blocking; changeable later additively.

**FQ-3 — Should the frontline operator retain any free-text item field?**
This design removes the `itemLabel` `TextField` and routes per-transaction detail to the existing optional `notes` field (§12 step 8). That is a genuine (if small) change to what an operator can record. It is safely derivable — `notes` already exists, is already optional, and is already unvalidated — but it is a visible workflow change worth confirming at the slice-5 Founder preview rather than discovering after merge.

**FQ-4 — Pre-existing `waiting_for_customer` purchases at migration time.**
`0018` leaves `qualifying_item_id` NULL for existing rows, and no decision is needed for *recording* (all new purchases get one). But whether historical purchases should ever be retro-attributed to an item — and whether `SET NOT NULL` in the deferred `0019` is acceptable, which would require every historical row to be attributed first — depends on data this repository cannot see. Environment question first, product question only if rows exist. Explicitly not answered here.

**No governance gap was invented to fill any of these.**

## 18. Governance discrepancies carried forward

Carried forward, **not** resolved, per instruction:

- **`DEC-LOY-014` / `DEC-LOY-015` have no rows in `decision-register.md`** despite being cited as settled authority in committed code (`0015_reward_programs_category_optional.sql`'s SQL comment and `rewardProgramKnowledgeValidation.ts`'s comments cite `DEC-LOY-014`; `coding-agent-prompt-register.md` has cited `DEC-LOY-015` since 2026-07-18). Independently re-confirmed by this task on `b2f1fda`: the register's own header history states "`DEC-LOY-014`/`DEC-LOY-015` remain not-activated references," and `DEC-LOY-016` is the next real Loyalty row after `DEC-LOY-013`. **Not backfilled, not fabricated, not resolved here.** This design cites `DEC-LOY-014` only descriptively (as the authority PB-010B's committed code names for Category optionality) and depends on it for nothing.
- **`DEC-CKS-001` / `DEC-CKS-002`** remain cited elsewhere with no matching register entry (first flagged `PLATFORM-BASELINE-009` §14). This design does not invoke, rely on, reconstruct, or resolve either.

**No further missing or contradictory governance authority was discovered by this task.** Specifically checked and found sufficient: `DEC-LOY-001` (fixed threshold — untouched), `DEC-LOY-009` (`rewardQuantity = 1` — untouched), `DEC-PROD-014` (purchase binds permanently to its creation-time version — directly relied upon by §7 Q7 and §8, and present as a real register row), `FD-PVL-001` (PostgreSQL authority for this spine), `FD-PVL-002` (allocation/overflow), `FD-PVL-005` (shared-LN gate), `DEC-LOY-004` (replacement-record correction), `DEC-DATA-003` (currency reporting-only), and `FD-REWARD-QUALIFYING-ITEM-001` itself.

## 19. Files modified

Exactly two, both documentation:

1. `docs/05-implementation/reports/platform-baseline-012-business-owned-qualifying-item-implementation-readiness-design-2026-09-18.md` — **created** (this file).
2. `docs/00-governance/documentation-changes-log.md` — **modified**: new `## Entry 239` inserted ahead of Entry 238 (newest-first convention), and the header's "Last controlled update" / "Prior update" lines extended.

No other file created, modified, deleted, moved, or renamed.

## 20. Code diff summary

**None.** Zero lines of application code, schema, migration, seed, configuration, dependency manifest, test, or locale content were added, changed, or removed. `functions/`, `apps/`, `scripts/`, `tests/`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`, `firebase.json`, `package.json`, `pnpm-lock.yaml`, and every file under `functions/src/infrastructure/postgres/migrations/` are byte-for-byte identical to `b2f1fda`.

## 21. Commands executed

Read-only inspection plus the two documentation writes and one commit, all inside the isolated worktree:
`git fetch origin`; `git rev-parse HEAD` / `origin/main`; `git status`; `git log --oneline`; `git checkout -b docs/platform-baseline-012-qualifying-item-delivery-design-001`; `ls` / `find` / `wc -l` over `functions/src`, `apps/web/src`, `docs/05-implementation/reports`, `docs/05-implementation/change-tracking`, and `functions/src/infrastructure/postgres/migrations`; `cat` / `sed -n` / `grep -rn` over every file listed in §3; `git add` + `git commit` for the two documentation files; `git diff --check`. **No `git push`, no PR, no merge, no migration execution, no test run against a live database, no state-changing command against `origin/main` or any other worktree.**

## 22. Dependencies added

**None.** `package.json` and `pnpm-lock.yaml` untouched. The design as specified requires no new runtime or dev dependency at implementation time either — `gen_random_uuid()` is already in use across `0001`–`0012` and needs no extension beyond what the existing schema already assumes.

## 23. Config changes

**None.** No change to `firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`, `eslint.config.js`, `playwright.config.ts`, `docker-compose.postgres.yml`, `.env.example`, `pnpm-workspace.yaml`, or any CI workflow.

## 24. Schema changes

**None made.** Four migrations are *specified* (`0016`–`0019`, §13) and none is created. No `.sql` file was added, edited, or deleted; the migrations directory still ends at `0015`.

## 25. Risks

1. **Backfill is the only non-additive step.** `0017` synthesizes rows. Repository evidence shows no shipped rows, but a deployed environment cannot be proven empty by inspection (the same caveat `PLATFORM-BASELINE-010A` §F correctly recorded). Mitigation: idempotent `INSERT ... ON CONFLICT DO NOTHING`, test K, and the explicit row-count verification step before `0019`.
2. **Synthesized item names may be raw node ids** where a legacy `business_display_name` was NULL. Cosmetic, Business-correctable by rename, and harmless to published versions (which keep their own frozen snapshot). Disclosed rather than silently prettified.
3. **The idempotency fingerprint change (§7) is easy to miss and silently wrong if missed** — it produces no compile error and no failing existing test. Mitigated by making test N2 a required gate in slice 4.
4. **FQ-1's default silently makes item management Owner-only.** Non-regressive and widenable, but it is a product shape being chosen by engineering default if the Founder does not answer.
5. **Removing the free-text `itemLabel` field is a visible operator workflow change** (FQ-3). Low risk, but it is the kind of change best seen at a preview rather than in production.
6. **`purchase_records.qualifying_item_id` stays nullable through the delivery**, so the relational guarantee is not yet total for legacy rows. Deliberate — tightening it is `0019`'s job, gated on environment verification.
7. **None of these risks touch qualification authority, the 10+1 engine, the fixed threshold, Trust Events, idempotency mechanics, Business Participation Terms, or redemption** — all confirmed zero-diff (§9, §14 rows 22–24).

## 26. Rollback instructions

**For this task:** nothing to roll back operationally — the change is two documentation files on an unpushed branch in an isolated worktree. To discard: `git checkout main` (or delete the branch) in that worktree; `origin/main` is untouched at `b2f1fda`, and no other worktree, branch, or remote was written to.

**For the specified implementation (guidance, not executed):** roll back in strict reverse slice order — 5 (UI revert), 4 (`0018.down`: drop the two FKs, then the column), 3 (revert command/repository cutover; the `0017` table becomes unread but harmless), 2 (revert the domain/callable additions), 1 (`0017.down` **only if no real Business-created items exist** — otherwise it must refuse; then `0016.down`). The deferred `0019` is intentionally last-in/never-early precisely so that no rollback path ever needs to recreate a dropped table from nothing.

## 27. Markdown report path

`docs/05-implementation/reports/platform-baseline-012-business-owned-qualifying-item-implementation-readiness-design-2026-09-18.md`

## 28. Changes-log entry

`docs/00-governance/documentation-changes-log.md` — **Entry 239**, `PLATFORM-BASELINE-012-QUALIFYING-ITEM-DELIVERY-DESIGN-001`, inserted ahead of Entry 238 per the file's newest-first ordering, with the header's "Last controlled update" / "Prior update" lines extended in the established format.

## 29. Primary-worktree safety confirmation

**Confirmed.** The primary/legal worktree at `/Volumes/PRODUCTION/Projects/11THONUS` (branch `docs/dec-legal-002-bt-draft-007`, carrying unrelated uncommitted legal-drafting work) was **never entered, never read, and never modified** by this task. Unlike PB-011, this task did not need to read anything from that path: every file it required was present on `origin/main` at `b2f1fda` and was read from the isolated worktree. No `cd` into that directory, no read of any file beneath it, no `git` command targeting it, and no use of the shared stash stack. All work occurred in `/Volumes/PRODUCTION/Projects/11THONUS/.claude/worktrees/agent-a97fc6832fcf31232` on branch `docs/platform-baseline-012-qualifying-item-delivery-design-001`.

## 30. Confirmation no implementation was started

**Confirmed.** No implementation of any kind was begun. No file under `functions/`, `apps/`, `scripts/`, `tests/`, or `records/` was created, edited, or deleted. No migration file was written. No Commerce Knowledge content was seeded. No redemption logic was written or designed beyond confirming that this model does not foreclose it. The 10+1 Circle engine was not redesigned or touched. Business Participation Terms were not modified. `unitValueMinor` — noticed, deliberately not addressed, per instruction. The work product is this design report and one changes-log entry.

---

## FINAL DISPOSITION

**B — DESIGN READY WITH NON-BLOCKING LIMITATIONS.**

**Justification.** The delivery design is complete and grounded in direct source inspection rather than inherited prose: the end-to-end identity trace is verified (§4, including four findings PB-011 did not record — the UI-unreachable `purchase_records.knowledge_node_id`, the server-resolved-under-lock applicable version, the item-blind idempotency fingerprint, and the item-identity-free Trust Event payload); the QualifyingItem model is derived from this repository's own conventions with every §4 convention question answered from evidence (§5); the Reward Program binding, purchase binding, and historical/versioning designs are specified with relational enforcement in the codebase's own composite-FK idiom rather than application checks alone (§6–§8); 10+1 non-regression is **proven** by grep and schema reading, not assumed (§9); no trust control is weakened and two are materially strengthened (§10); Commerce Knowledge is optional enrichment with all five PB-010B/PB-008 protections retained verbatim (§11, §14); the migration path is safe against existing rows with an explicit, disclosed deployed-data caveat (§13); and the test plan covers every lettered case plus one the spec did not anticipate (§15).

It is **B and not A** because three limitations are real and disclosed rather than solved: **FQ-1** (item-management permission scope) is a genuine product-shape question that a safe engineering default answers Owner-only, which may not be what the Founder wants; **FQ-3** (removing the operator's free-text item field) is a visible workflow change best confirmed at a preview; and **FQ-4** (pre-existing purchase rows and the deferred `SET NOT NULL`) depends on deployed data no repository inspection can see. None of these blocks slice 1, 3, 4, or 5, and each has a stated non-regressive default — so this is not **C**.

It is **not C** because no missing authority prevents implementation from starting: `DEC-LOY-016` is sufficient for every slice, and the one question that touches a governed artifact (FQ-1, the permission catalogue) has a default that preserves the status quo. It is **not D** because the current architecture does not require reassessment — it turns out to be unusually well-suited to this correction: the versioned-snapshot discipline, the composite-FK scope-proof idiom, the `isEligibleForNewReference` / `isResolvableForExistingReference` lifecycle split, the whitelist transport parsers, and the membership-gated Reward Program read all compose to give this correction a home without inventing a single new architectural pattern.

The disclosed `DEC-LOY-014` / `DEC-LOY-015` register gap (§18) is carried forward untouched and is not a blocker to this design's soundness — no part of this design depends on either identifier.

**Stop after design. Implementation is not authorized by this task and was not started.**
