> **Title:** ENG-P3-003-DESIGN-001 — Knowledge Studio MVP Architecture and Delivery Design
> **Version:** 1.0 · **Status:** Design package — architecture and delivery decomposition only; no implementation authorized by this document
> **Classification:** Working (execution-layer architecture record)
> **Governing document:** [Commerce Knowledge Standard](../../03-standards/commerce-knowledge-standard.md); [Knowledge Studio](../../03-standards/knowledge-studio.md); [TRD18 — Platform Administration, Knowledge Studio and Rules Studio](../../02-technical/trd/18-platform-governance-and-administration.md) §18.5.5–18.6, §18.10, §18.18–18.28, §18.49, §18.56–18.62; [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-DATA-005`, `DEC-CKS-001`, `DEC-CKS-002`; [`CDR-001` Capability 3](CDR-001-capability-delivery-roadmap.md#8-engineering-work-package-mapping); [ENG-P3-001-DESIGN-001](ENG-P3-001-DESIGN-001-commerce-knowledge-architecture-delivery-design.md) §7/§9/§12/§13.2/§19/§26; TRD10 §10.7 (Commerce Knowledge Domain Collections)
> **Source-of-truth path:** `docs/05-implementation/roadmap/ENG-P3-003-DESIGN-001-knowledge-studio-architecture-delivery-design.md`

# ENG-P3-003-DESIGN-001 — Knowledge Studio MVP Architecture and Delivery Design

**This document defines architecture only. It authorizes no implementation.** No production code, Firestore Rules, migration, client UI, callable/HTTPS endpoint, or deployment is created or modified by this document. It is analogous in role to [ENG-P3-001-DESIGN-001](ENG-P3-001-DESIGN-001-commerce-knowledge-architecture-delivery-design.md) — it resolves the architecture-level questions a future implementation prompt needs answered before a coding agent could otherwise invent editorial-workflow semantics, a platform-administrator authorization model, or Firestore schema unsupported by any governed source.

---

## 1. Entry repository state and base SHA

- **Entry `origin/main` SHA:** `cd7c7589347e2de5a552dea52908265e8a91dcd0` (merge of PR #222, `11ONUS-PROG-002`), verified by `git fetch origin && git rev-parse origin/main` before this task began, then a fresh detached-HEAD worktree created from that exact SHA (`git worktree add ... origin/main --detach`). The primary working directory's unrelated, uncommitted `FD-COM-001` commercial-model work was never opened, read, or touched.
- **Capability 3 (Business Identity):** `Open — engineering work packages complete; blocked on governed Terms-content configuration (DEC-LEGAL-002, OPEN_LEGAL)` (`CDR-001` §2, unchanged by this task). `ENG-P3-003` remains `Not started` before this document; this document does not start it — it produces the design prerequisite only.
- **`DEC-CKS-002`** (Founder-approved, 2026-08-20): Knowledge Studio is **not** a prerequisite for first launch; may follow the initial onboarding capability; does not reduce central Commerce Knowledge governance.

## 2. Authority inspected

Read in full or by targeted section, all on `origin/main` at the SHA above:

- `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` — Capability 3, `ENG-P3-003` row
- `docs/00-governance/decisions/decision-register.md` — `DEC-DATA-005` (resolved), `DEC-TECH-008` (open, non-blocking)
- `docs/05-implementation/roadmap/ENG-P3-001-DESIGN-001-commerce-knowledge-architecture-delivery-design.md` §7, §9.1–9.4, §10, §11, §12, §13.1–13.2, §14, §15, §17, §18, §19, §22, §25, §26, §29, §36
- `docs/02-technical/trd/10-firestore-data-architecture.md` §10.7.1–10.7.3 (Commerce Knowledge collections), §10.9.1–10.9.2 (Reward Program collections)
- `docs/02-technical/trd/18-platform-governance-and-administration.md` — full read: §18.1–18.10 (purpose, principles, surfaces, roles, permission domains, separation of duties, administrative authentication/session, administrator membership model), §18.18–18.28 (Knowledge Studio purpose, object lifecycle, draft model, suggestion workflow, duplicate detection, translation workflow, translation review controls, replacement, bulk import, publication events, analytics), §18.49–18.50 (audit record, audit search), §18.56–18.60 (AI boundaries, API boundaries, error handling, observability, testing), §18.61–18.63 (functional requirements FR-ADM-001–020, administration rules AR-001–015, acceptance criteria)
- `docs/03-standards/knowledge-studio.md` — full read (Knowledge Pipeline narrative, architectural principles, AI-readiness/human-governance principle)
- `docs/03-standards/commerce-knowledge-standard.md` — full read (CKS-001–006, fixed hierarchy, tag classes, multilingual standards, onboarding standards, governance)
- The full existing `functions/src/domains/commerceKnowledge` implementation (models, repositories, seed layer, read service) — see §3
- `functions/src/domains/permissions` (evaluator, catalogues, `authorizeAndExecute`), `functions/src/domains/business/services/authenticatedBusinessActor.ts`, `functions/src/shared/idempotency`, `functions/src/domains/identityAudit`
- `apps/web/src` — routing (`App.tsx`), the Business Dashboard shell/route pattern, `components/ui/formPrimitives.tsx`, `apps/web/src/i18n/config.ts`, `apps/web/package.json`

**Note on tracker currency (per `11ONUS-PROG-002`, PR #222):** the Master Workflow, Engineering Implementation Programme, and Coding-Agent Prompt Register are known-stale relative to `CDR-001` and the Decision Register. This document treats `CDR-001` and the Decision Register as authoritative wherever they conflict with those trackers, and does not correct the trackers (that remains a separate, not-yet-authorized housekeeping task).

**Note on TRD18's status:** TRD18 is marked `Status: Draft for approval` in its own header. It is nonetheless the only governed source that defines Knowledge Studio's roles, permission identifiers, draft/lifecycle model, audit schema, and API-boundary naming — no other document or code addresses these questions at all (`ENG-P3-001-DESIGN-001` §13.2 explicitly deferred them to this task). This design treats TRD18 as the controlling architecture reference for those questions, consistent with the task's own instruction to use "current authentication/authorization/permissions architecture" and flags anywhere this document must choose between TRD18's narrative and the already-implemented, DEC-DATA-005-frozen Commerce Knowledge schema (§8 resolves the one material tension found).

## 3. Existing Commerce Knowledge implementation discovered

`functions/src/domains/commerceKnowledge/` is fully implemented for **read and seed**, and is **not** read-only at the repository layer — but exposes no editorial write surface to any caller:

- **Models** (`models/`): `KnowledgeNode` (`id, nodeType, parentId, canonicalName, slug, path, depth, description?, iconKey?, status, version, replacementNodeId?, searchTerms[], createdAt, updatedAt, schemaVersion`); `KnowledgeTag` (flat, no hierarchy, no translations field); `KnowledgeTranslation` (generalized `(entityType: "knowledge_node"|"knowledge_tag", entityId, languageCode)` shape, deterministic id `${entityType}_${entityId}_${languageCode}`, `displayName, description?, synonyms[], status, reviewedBy?, reviewedAt?`). `KNOWLEDGE_NODE_TYPES` is a fixed 6-value union (`industry, business_category, business_type, reward_program_category, standard_product, standard_service`) with a fixed linear parent-adjacency chain. **No `createdBy`/`updatedBy` field exists on `KnowledgeNode` or `KnowledgeTag`**, despite TRD10 §10.7.1 declaring both — a real, pre-existing schema gap this design must close for editorial provenance (§7).
- **Lifecycle** (`knowledgeLifecycle.ts`, `DEC-DATA-005`-resolved, frozen): `KnowledgeNode.status`/`KnowledgeTag.status` share one 5-value enum `draft → in_review → active → retired → archived`, with `archived` the sole terminal state and no reversal (a correction is always a new node forward-chained via `replacementNodeId`). `KnowledgeTranslation.status` is a separate 3-value enum `draft → reviewed → published` (with a `reviewed → draft` correction cycle, no distinct terminal state). Referential eligibility is two pure predicates: `isEligibleForNewReference` (`status === "active"` only) and `isResolvableForExistingReference` (`active | retired | archived` — existing references never break).
- **Repositories** (`repositories/`): transactional, race-safe `create*Persisted` (existence-check + write in one transaction), `transitionKnowledgeNodeStatusPersisted`/`transitionKnowledgeTranslationStatusPersisted`/`transitionKnowledgeTagStatusPersisted`, `retireKnowledgeNodePersisted` (requires + validates `replacementNodeId`, same `nodeType`), `listActiveSelectableNodes` (the one place `status === "active"` is a hard filter). **No field-edit (rename/description/searchTerms update), no re-parenting, and no bulk operation exists today** — only create, lifecycle-transition, and retire-with-replacement.
- **Seed layer** (`seed/`): `runCommerceKnowledgeSeed` — a plain function, never wired to any transport, idempotent by stable checked-in id, fails closed (`seedContentConflictError`) on any identity-field mismatch on rerun, and **actively re-transitions any node/translation it finds sitting in a non-terminal seed-endstate status forward to `active`/`published`** on rerun — a genuine, previously-flagged, unresolved collision risk with an editorial layer mid-edit (§13). `burundiPilotSeedManifest.ts` seeds 27 nodes (6 industries, 14 business categories, 7 Salon-only business types), **zero** reward-program categories/standard products/services, and **zero** French translations (100% EN-only today, a real, immediate Studio backlog item, not a hypothetical).
- **Read service** (`services/commerceKnowledgeReadService.ts`): two `onCall`-wired functions (`listBusinessCategories`, `listBusinessTypesForCategory`), gated only on any authenticated Customer Identity (no permission check — reading published reference data is ungated), returning a bounded DTO that never exposes `schemaVersion` or editorial/audit metadata.
- **No Commerce Knowledge domain event exists** (`KnowledgeNodePublished` etc. are named only as a future possibility in `ENG-P3-001-DESIGN-001` §14, never implemented).
- **No precedent anywhere in this codebase** for a multi-actor suggest → review → approve → publish editorial workflow. The closest analogues (`ruleVersions` in TRD10 §10.8.2, `businessMembershipInvitation`) are either unimplemented or lack HTTPS transport. Knowledge Studio is the first implementation of this pattern.
- **No platform-staff/internal-operator role or permission concept exists anywhere** — `Role = "owner" | "manager" | "staff"` (business-membership-scoped only) is the entire role vocabulary the existing evaluator understands; grep across `functions/src`, `apps/web/src`, `docs` for any platform-administrator identifier returns zero matches outside TRD18 itself.

## 4. Architecture/design strategy

Stated before making any design choice, per the task's own instruction:

1. **Preserve, never fork, the existing Commerce Knowledge schema.** `KnowledgeNode`, `KnowledgeTag`, `KnowledgeTranslation`, their lifecycle enums, and their repositories are frozen by `DEC-DATA-005` and load-bearing for `ENG-P3-002` (already shipped, in production onboarding flow). This design adds a **new, separate `KnowledgeDraft` model** (per TRD18 §18.20) as the editorial working surface, and adds only the minimum new repository operations needed to apply an approved draft to the existing node/tag/translation documents — it does not add a sixth lifecycle value, does not add "approved"/"published" states to `KnowledgeNode.status`, and does not touch `ENG-P3-001`/`ENG-P3-002`'s existing contracts.
2. **Reuse the existing authorization pattern, not the existing catalogue.** The Business-role permission evaluator (`Role = owner|manager|staff`, businessId-scoped) is structurally the wrong tool for a platform-staff actor with no `businessId` in scope at all — `ENG-P3-001-DESIGN-001` §13.2 says so explicitly, and TRD18 §18.10 independently specifies a wholly separate `PlatformAdministratorDocument` collection. This design therefore specifies a **new, minimal, Knowledge-scoped platform-permission evaluator**, built in the exact same shape as `evaluatePermission.ts`/`authorizeAndExecute.ts` (pure evaluation function, dot-namespaced `PermissionId`, fail-closed default-deny, `checkAndReserveIdempotencyKey`-wrapped transactional composition) — not a new mechanism, but not a reuse of Business-role code either, since that code cannot express "no business is in scope."
3. **Scope to Knowledge Studio only, not the whole of TRD18 Chapter 18.** TRD18 describes a full Platform Administration application (Business Operations, Customer Support, Trust Reviews, Subscriptions, Rules Studio, Feature Flags, Emergency Controls, etc.). This design builds only the minimum platform-administrator authorization primitive Knowledge Studio itself needs (the `PlatformAdministratorDocument` collection, the Knowledge-scoped roles/permissions, one shared evaluator shape) — it does not design or scaffold any other administrative surface. A future, separately-authorized `ENG-P?-ADMIN-DESIGN-001` would extend the same primitive for other workspaces without re-deriving it.
4. **Resolve, don't defer, the one real tension found**: TRD18 §18.19 narrates a 6-stage object lifecycle (Draft → In Review → Approved → Published → Retired → Archived) while the implemented `KnowledgeLifecycleStatus` is 5-valued with no "approved" state. §8 below resolves this by locating "approved" on the **draft** object (which already carries its own 5-value `draft|in_review|approved|rejected|published` status per TRD18 §18.20), not on the canonical node — consistent with `DEC-DATA-005`'s own finding that "approved" and "published" carry no operationally distinct meaning for the canonical node/tag itself.
5. **Minimum lifecycle, minimum new mechanism.** No new concurrency/versioning/audit mechanism is invented where an existing one (transactional create-with-existence-check, `checkAndReserveIdempotencyKey`, the outbox/`DomainEvent` system) already fits.

## 5. Knowledge Studio scope and exclusions

**Knowledge Studio is:** the governed, platform-staff-only editorial interface for the Commerce Knowledge Layer — drafting, reviewing, approving, publishing, retiring, and translating `KnowledgeNode`/`KnowledgeTag` content, and triaging business-submitted suggestions, all through typed server commands over the existing frozen schema.

**Knowledge Studio is not:**
- A general-purpose Firestore CMS. The frontend never receives direct Firestore write access to `knowledgeNodes`/`knowledgeTags`/`knowledgeTranslations`/`knowledgeDrafts` — every mutation goes through a typed callable (§10), per TRD18 AAP-001/AR-001.
- A Business-facing feature. No Business `owner`/`manager`/`staff` role gains any Knowledge Studio access (§6). Businesses may only **suggest** (already-named `source: "business_suggestion"` on a draft) through the existing, separately-authorized onboarding/dashboard surface — designing that suggestion-capture UI is explicitly out of this task's scope (§9's "Explicit boundaries": "introduce merchant-controlled taxonomy authoring unless existing authority explicitly permits it" — it does not).
- A general platform-administration application. Business Operations, Customer Support, Trust Reviews, Subscriptions/Billing, Rules Studio, Feature Flags, and Emergency Controls (TRD18 §18.11–18.17, §18.29–18.48) are out of scope; only the minimal shared platform-administrator primitive they would eventually also use is designed here (§4.3).
- A subscription/billing feature. Not touched.
- A production data migration. No production data is migrated, moved, or modified by this document (§13 designs the approach only).

## 6. Roles and permissions

**New collection, per TRD18 §18.10 (reproduced, not altered):**
```ts
type PlatformAdministratorDocument = {
  id: string;                    // opaque, platform-wide id convention (TRD10 §10.5)
  userId: string;                // Customer Identity id — the same identity space auth already resolves
  roles: string[];                // e.g. ["knowledge_editor"] — closed vocabulary, §6.1
  permissions: string[];          // explicit grants beyond role defaults; closed PermissionId vocabulary, §6.2
  status: "invited" | "active" | "suspended" | "removed";
  mfaRequired: boolean;
  invitedBy: string;
  approvedBy?: string;
  activatedAt?: Timestamp;
  suspendedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  schemaVersion: number;
};
```
Collection: `platformAdministrators`, doc id = `userId` (one administrator record per Customer Identity — mirrors `businessCodeReservations`'s doc-id-as-key pattern; avoids a duplicate-detection query). **Business-owner status grants nothing here** (TRD18 §18.10) — a `PlatformAdministratorDocument` is created only by an existing Platform Super Administrator inviting a new one; this design does not invent a self-service enrollment path.

### 6.1 Roles (scoped to Knowledge Studio only; TRD18 §18.5.5–18.5.6, §18.5.1)

| Role | May | May not |
|---|---|---|
| **`knowledge_editor`** | Create/edit drafts (new or against an existing node/tag); propose translations; manage synonyms/search terms on a draft; view business suggestions and link them to an existing node or promote to a new draft; view published content. | Approve, publish, or retire without a separate approval (TRD18 §18.5.5, AAP-003). |
| **`knowledge_approver`** | Review submitted drafts; approve or reject; publish approved drafts; retire/replace existing published nodes. | Create drafts under this role alone is not restricted (TRD18 does not prohibit an approver also drafting), but **may not approve or publish their own draft** — separation of duties (§18.7, AR-007) is enforced at evaluation time, not merely by convention. |
| **`platform_super_administrator`** | Holds every `knowledge.*` permission by explicit role-default grant (not a code-level bypass — TRD18 AAP-002 "No Universal Administrator" is respected structurally: the evaluator still checks an explicit permission list for this role, it is simply pre-populated with all of them). May also invite/suspend other `PlatformAdministratorDocument` records. | Everything else in TRD18 Chapter 18 outside Knowledge Studio is out of this design's scope — this role's *other* administrative powers (Business Ops, Billing, etc.) are not designed here and must not be assumed implemented. |

For MVP staffing (§18.7: "one person may hold multiple roles, but the system shall still record which responsibility was exercised"), a single `PlatformAdministratorDocument.roles` array may legitimately contain both `["knowledge_editor","knowledge_approver"]` — the separation-of-duties rule (§6.3) is enforced per-action (self-approval blocked), not by preventing one person from holding both roles.

### 6.2 Permission identifiers (TRD18 §18.6 "Knowledge Studio" list, reproduced verbatim, dot-namespaced per the existing `PermissionId` regex `^[a-z][a-zA-Z0-9]*\.[a-z][a-zA-Z0-9]*$`)

`knowledge.view`, `knowledge.create_draft`, `knowledge.edit_draft`, `knowledge.approve`, `knowledge.publish`, `knowledge.retire`, `knowledge.bulk_import`.

Role-default grants (new catalogue, `platformKnowledgePermissionCatalogue.ts`, structurally parallel to but disjoint from the existing `ordinaryPermissionCatalogue.ts`):

| Permission | `knowledge_editor` | `knowledge_approver` | `platform_super_administrator` |
|---|---|---|---|
| `knowledge.view` | ✓ | ✓ | ✓ |
| `knowledge.create_draft` | ✓ | — | ✓ |
| `knowledge.edit_draft` | ✓ (own or any, MVP: any — see §18 open question) | — | ✓ |
| `knowledge.approve` | — | ✓ | ✓ |
| `knowledge.publish` | — | ✓ | ✓ |
| `knowledge.retire` | — | ✓ | ✓ |
| `knowledge.bulk_import` | — | — | ✓ (bulk import scoped to Super Administrator only at MVP — highest blast radius action in this domain) |

### 6.3 Separation of duties (TRD18 §18.7, AR-007)

Enforced as a **structural check inside the evaluator**, not merely by role assignment: `knowledge.approve`/`knowledge.publish` on a given `KnowledgeDraft` fails closed if `draft.createdBy === callerUserId`, regardless of whether the caller also holds `knowledge_approver`. This mirrors the existing evaluator's own layered-check style (Owner floor, membership-state gate, override resolution — each an independent, ordered check) rather than inventing a new authorization paradigm.

### 6.4 Business users have no access

No Business `owner`/`manager`/`staff` role, and no permission in `ordinaryPermissionCatalogue.ts`/`sensitivePermissionCatalogue.ts`, grants any Knowledge Studio capability. The two authorization worlds (Business-role evaluator, businessId-scoped; platform-role evaluator, no businessId in scope) remain structurally disjoint — a caller is authorized against exactly one of them per request, never both, matching `ENG-P3-001-DESIGN-001` §13.2's finding.

## 7. Data/model implications

**Existing schema preserved unchanged**: `KnowledgeNode`, `KnowledgeTag`, `KnowledgeTranslation`, `KnowledgeLifecycleStatus`, `TranslationLifecycleStatus`, all repository functions, all error factories. No field is removed or retyped.

**One additive gap closed** (§3's finding): `KnowledgeNode`/`KnowledgeTag` gain two new optional-at-the-type-level-but-always-populated-by-Studio fields, `createdBy: string` and `updatedBy: string`, matching TRD10 §10.7.1's original declaration. Seed-created nodes (which have no human actor) populate both with a fixed sentinel value `"system:seed"` (a plain string, not a Customer Identity id — the seed loader is not an authenticated actor and must not be misrepresented as one). This is additive to the Firestore document shape (existing documents without the field remain valid — the converter treats a missing value as `"system:seed"` on read, for the population of nodes seeded before this field existed) and does not change any existing transition rule, error type, or repository signature beyond passing the new field through `create*Persisted`/edit operations.

**New model**, per TRD18 §18.20 (fields reproduced, typed against this codebase's conventions):
```ts
type KnowledgeDraft = {
  id: string;                                  // opaque id (TRD10 §10.5 convention)
  knowledgeNodeId?: string;                    // present = edit of an existing node/tag; absent = new-node proposal
  targetKind: "node" | "tag";
  proposedNodeType?: KnowledgeNodeType;         // required when targetKind === "node" and knowledgeNodeId is absent
  proposedParentId?: string | null;
  proposedTagGroup?: KnowledgeTagGroup;         // required when targetKind === "tag"
  proposedCanonicalName: string;
  proposedDescription?: string;
  proposedIconKey?: string;
  proposedSearchTerms: string[];
  proposedTranslations: Array<{ languageCode: SupportedLanguageCode; displayName: string; description?: string; synonyms: string[] }>;
  proposedRetirement?: { replacementNodeId: string };  // present only for a retirement-shaped draft
  source: "admin" | "business_suggestion" | "search_analysis" | "import" | "ai_assisted";
  sourceReference?: string;                     // e.g. the originating knowledgeSuggestion-shaped record id, or import batch id
  status: KnowledgeDraftStatus;                  // "draft" | "in_review" | "approved" | "rejected" | "published"
  createdBy: string;
  reviewedBy?: string;
  publishedBy?: string;
  rejectionReason?: string;
  createdAt: Date;
  reviewedAt?: Date;
  publishedAt?: Date;
  schemaVersion: number;
};
```
Collection: `knowledgeDrafts`. **This is the collection TRD10 §10.3/§10.4 named `knowledgeSuggestions`** ("Commerce Knowledge / Proposed additions awaiting review") — that one-line placeholder is superseded by TRD18's fuller, more specific `KnowledgeDraftDocument` shape (a business suggestion becomes one `source: "business_suggestion"` row among several draft origins, not a separate collection). This is a documentation reconciliation, not a new architectural decision: TRD18 Chapter 18 is the dedicated, later, more specific governing chapter for this exact object; TRD10 §10.3/10.4's entry was a placeholder index row, never itself schema-bearing. No Founder decision conflict exists — flagged here for transparency, not as an open question.

**No change to `Business.primaryCategoryId`/`businessTypeId`, `RewardProgramVersion`, or any other domain's schema.**

## 8. Editorial lifecycle

**Resolves the one real tension identified in §4.4.** TRD18 §18.19's narrated 6-stage "canonical knowledge object" lifecycle (Draft → In Review → Approved → Published → Retired → Archived) is implemented as **two separate, already-consistent lifecycles working together**, not as a sixth value bolted onto `KnowledgeLifecycleStatus`:

- **`KnowledgeDraft.status`** (new, 5-value, exactly TRD18 §18.20's own declared set): `draft → in_review → {approved, draft}`; `approved → published`; any of `draft|in_review|approved` → `rejected` (by an approver, with `rejectionReason` required); `rejected` and `published` are both terminal for the draft row (TRD18: "Rejected drafts remain historically traceable" — a rejected draft is never resurrected; a fresh draft is created instead, exactly mirroring how a retired `KnowledgeNode` is never resurrected, only forward-chained).
- **`KnowledgeNode.status`/`KnowledgeTag.status`** (existing, unchanged, `DEC-DATA-005`-frozen 5-value set) changes **only at the moment a draft reaches `published`**, and only in the two ways the existing model already supports:
  - **New-node draft published** → within one transaction: `createKnowledgeNodePersisted` (existing, forces `status:"draft"`) then `transitionKnowledgeNodeStatusPersisted` `draft→in_review→active` (existing, two calls of an existing, unmodified function) — the node is created and activated atomically as one editorial event; no node is ever visible to onboarding mid-transaction.
  - **Existing-node edit draft published** → the live node stays `active` throughout drafting/review (Studio never touches the published node until publish — TRD18: "A draft shall be separate from the current published version," satisfying AAP-003); publish applies the draft's proposed non-status fields (`canonicalName`, `description`, `iconKey`, `searchTerms`) to the existing document via a new `applyApprovedKnowledgeNodeEditPersisted` repository function (transactional, bumps `version`, sets `updatedBy`) and independently creates/updates the associated `KnowledgeTranslation` rows.
  - **Retirement draft published** → publish invokes the existing, unmodified `retireKnowledgeNodePersisted` (already requires + validates `replacementNodeId`, which the draft's `proposedRetirement.replacementNodeId` supplies).
- **`KnowledgeTranslation.status`** is **not** given a parallel draft object. TRD18 §18.23's per-language states (Missing/Draft/Reviewed/Approved/Published) map onto the existing 3-value `draft|reviewed|published` enum exactly as `DEC-DATA-005` already resolved for nodes: "Missing" is simply the absence of a `KnowledgeTranslation` row for that `(entityType, entityId, languageCode)` tuple (no new state needed); "Approved" is not given a distinct persisted value (same rationale as nodes — no operationally distinct meaning found between an approver approving a translation and that translation being marked `reviewed`, since only a `knowledge_approver` may transition a translation to `reviewed` under this design, §10). A translation attached to a node-edit draft is held as a **proposed value inside the draft's own `proposedTranslations` array** (§7) until the draft is published, at which point it is written/updated as a normal `KnowledgeTranslation` document via the existing translation repository, starting at `status:"draft"` and immediately transitioned to `reviewed` (never silently to `published` — a translation becomes visible to onboarding only once independently marked `published`, preserving the existing fallback rule in `commerceKnowledgeReadService.ts` exactly as `ENG-P3-002` already depends on it).

No lifecycle state is invented beyond what TRD18 §18.20 and the existing `DEC-DATA-005` enums already declare. "Duplicate detection" (TRD18 §18.22) and "search-terms/synonym management" are editorial **assistance** during drafting (a query the editor UI runs against `listActiveSelectableNodes`/existing translations before submission), not a persisted lifecycle stage.

## 9. Publishing, versioning, and audit model

- **Publishing is atomic.** Every publish path (§8) executes inside one Firestore transaction: draft-status transition to `published` + the corresponding node/tag/translation write(s) + the audit record (below) all commit together or none do — reusing the exact `db.runTransaction` pattern every existing `*Persisted` repository function already uses.
- **Previously published data remains usable while a new revision is under review** by construction (§8: the live node is untouched until publish), satisfying TRD18's requirement directly with zero new mechanism.
- **Rollback/reversion**: there is no "undo publish." A correction is a **new draft** against the now-published node (edit-draft flow) or, for a wrong classification, retirement with a replacement (existing mechanism). This matches the existing platform-wide pattern (`replacementNodeId`, never a reversed transition) and TRD18's own "Historical Reward Programs shall not be silently rewritten" principle (§18.25) — retroactively mutating a published node's history is never permitted, only forward correction.
- **Retirement differs from deletion**: no delete operation exists or is added. `retireKnowledgeNodePersisted` is the only terminal-facing write; the document is never removed, per `ENG-P3-001-DESIGN-001` §12's hard constraint ("must never delete a `KnowledgeNode` document that any `RewardProgramVersion` or `Business` has ever referenced" — this design cannot know a node was *never* referenced, so it never deletes any published node, full stop).
- **Reference protection**: unaffected by this design — `isResolvableForExistingReference` (existing, unmodified) already guarantees a `Business.primaryCategoryId`/`businessTypeId` or a `RewardProgramVersion.qualifyingKnowledgeNodeIds` reference keeps resolving through `retired`/`archived`.
- **Audit**: every privileged action (`knowledge.create_draft` submission, `knowledge.approve`, `knowledge.reject`, `knowledge.publish`, `knowledge.retire`) writes one `AdministrativeAuditRecord` (TRD18 §18.49, reproduced unmodified) inside the same transaction as the action itself — mirroring `authorizeAndExecute.ts`'s existing `recordSensitiveDecision` step, generalized to a Knowledge-scoped audit writer rather than a new bespoke mechanism. Records are append-only (`knowledgeAuditRecords` collection; **not** reused from `identityAudit`, which §3/research confirms is a Customer-Identity-specific projection over a different event set, not a generic audit domain — a parallel, equally narrow, Knowledge-scoped audit writer is the correct-shaped reuse, not a cross-domain import).
- **Publication events** (TRD18 §18.27): `knowledge.node_published.v1`, `knowledge.translation_published.v1`, `knowledge.node_retired.v1` are emitted via the existing, unmodified outbox/`DomainEvent` mechanism (the same one `identityAudit` projects over) at the moment of publish/retire, inside the same transaction. This design does not build any **consumer** of these events (search-index refresh, onboarding cache invalidation) — none currently exists to update, and `DEC-TECH-008` (search technology) remains open and non-blocking; a consumer is future work, out of MVP scope.
- **Full historical snapshots are not required.** `AdministrativeAuditRecord.beforeSnapshot`/`afterSnapshot` (both already part of the TRD18 schema, reused unmodified) provide bounded before/after field diffs per action — sufficient for "who changed what and when" without a second full-document revision-history collection. This is the "avoid over-engineering" call: a full versioned-snapshot store was considered and rejected as unnecessary duplication of what the audit record plus the node's own `version` counter (existing, unmodified) already provide together.

## 10. API/transport design

Minimum commands, named per TRD18 §18.57's own examples, each a Firebase `onCall` function wired in `functions/src/index.ts` exactly like every existing Commerce Knowledge/Business callable:

| Command | Permission required | Notes |
|---|---|---|
| `knowledgeListDrafts` | `knowledge.view` | Query, filterable by status/source/target |
| `knowledgeGetDraft` | `knowledge.view` | |
| `knowledgeCreateDraft` | `knowledge.create_draft` | New-node or edit-of-existing-node draft |
| `knowledgeUpdateDraft` | `knowledge.edit_draft` | Edits a draft still in `draft`/rejected-then-recreated status; never edits an `in_review`/`approved`/`published` draft in place |
| `knowledgeSubmitDraftForReview` | `knowledge.edit_draft` | `draft → in_review` |
| `knowledgeApproveDraft` | `knowledge.approve` | `in_review → approved`; fails closed on self-approval (§6.3) |
| `knowledgeRejectDraft` | `knowledge.approve` | any non-terminal → `rejected`, requires `rejectionReason` |
| `knowledgePublishDraft` | `knowledge.publish` | `approved → published` + node/tag/translation write, per §8; fails closed on self-approval-chain (same actor drafted **and** published without an independent approver — evaluated the same way as §6.3) |
| `knowledgeRetireNode` | `knowledge.retire` | Direct retirement of an already-published node with an immediate replacement — the one action TRD18 §18.25 treats as not needing a full draft/review cycle when the replacement is already published (still audited, still permission-gated) |
| `knowledgeListSuggestions` / `knowledgeLinkSuggestionToDraft` | `knowledge.view` / `knowledge.create_draft` | Triage of `source:"business_suggestion"` drafts — the actual business-facing *submission* UI is out of scope (§5); only the editor-side triage view is designed here |

**Frontend never gains direct Firestore write authority** to any Commerce Knowledge or `knowledgeDrafts`/`platformAdministrators`/audit collection (TRD18 AAP-001, AR-001; matches every existing domain's transport pattern — `apps/web` has no direct-Firestore-write precedent anywhere today). Reads needed for the editor UI (draft lists, node/tag/translation browsing, duplicate-candidate search) are also served through typed callables, not direct Firestore listeners, so the same permission evaluator gates both read and write — consistent with `commerceKnowledgeReadService.ts`'s existing pattern of a typed read service in front of Firestore, generalized here to also be permission-gated (unlike the public onboarding read service, which is intentionally ungated).

Every mutating command follows the existing `authorizeAndExecute`-shaped composition: `checkAndReserveIdempotencyKey` → one transaction (evaluate platform permission → prepare mutation → write node/draft/audit/event → ) → `completeIdempotencyKey`/`failIdempotencyKey`, reusing the existing idempotency service unmodified.

## 11. Frontend architecture and workflows

**Where it lives**: a new top-level route tree, sibling to `/business/:businessId/dashboard/*`, e.g. `/studio/knowledge/*` — following the one existing precedent in this codebase (`BusinessDashboardBoundaryPage` → `BusinessDashboardRoutes` → shared `BusinessDashboardShell` wrapping `<Outlet/>`) rather than inventing a new shell pattern. A new `PlatformAdministratorBoundaryPage` resolves the caller's `PlatformAdministratorDocument` (analogous to `BusinessContext` resolution) and mounts `KnowledgeStudioRoutes` inside a new `KnowledgeStudioShell` (structurally identical to `BusinessDashboardShell` — mobile hamburger + desktop sidebar around `<Outlet/>`, reusing the existing `LanguageSwitcher`/`useTranslation` and `formPrimitives.tsx` components unmodified). `RequireAuthenticatedUser` remains the outer gate (only auth gate that exists today); a new `RequirePlatformPermission(permission)` wrapper component (new, since none exists — §3's finding) performs the actual authorization check against the platform evaluator before rendering any Studio screen, failing closed to an "access denied" state, never rendering partial content while a check is pending.

**Major screens** (to the level needed for delivery decomposition, not full UX spec):
1. **Draft list** — filterable by status (`draft`/`in_review`/`approved`/`rejected`/`published`), source, target kind; the editor's and approver's shared home.
2. **Draft editor** — create/edit a node or tag proposal: canonical name, node type/parent (tree picker constrained to the fixed 6-type adjacency chain, client-side mirroring the existing pure `ALLOWED_PARENT_TYPE` rule but always re-validated server-side), description, icon key, search terms, per-language (EN required, FR required-for-launch per §12) translation fields, duplicate-candidate panel (queries existing active nodes/synonyms as the editor types — TRD18 §18.22 — advisory only, never blocking submission).
3. **Review queue** — approver's view of `in_review` drafts: proposed-vs-current diff (for edits), approve/reject with reason, publish.
4. **Suggestion triage** — `source:"business_suggestion"` drafts awaiting an editor's link-to-existing-node or promote-to-draft decision.
5. **Published taxonomy browser** — read view over `listActiveSelectableNodes` plus translation coverage per node (feeds TRD18 §18.28's "missing translations" analytics at a basic level; full analytics dashboard is explicitly deferred, §17).

**Design system**: reuses the existing Tailwind v4 CSS-variable theme (`index.css`), `formPrimitives.tsx`, `class-variance-authority`/`cn()`, `lucide-react` — no new UI dependency introduced (§22). Responsive/mobile-first is preserved structurally (same shell pattern as the Business dashboard), though Knowledge Studio is a staff-internal tool and desktop-first usage is expected in practice; no mobile-specific screen is designed differently from the existing shell's own responsive behavior.

## 12. EN/FR treatment

English is canonical/required (existing `languageCode.ts`, `resolveFallbackLanguageCode` always falls back to `"en"`); French is required-for-launch per both `commerceKnowledge-standard.md` Part XI and `ENG-P3-001-DESIGN-001` §11 — **not optional**, contrary to how it might otherwise read informally. Kirundi/Swahili/Kinyarwanda are listed as "planned" in the standards docs but are out of implementation scope entirely (no `SupportedLanguageCode` value exists for them) — this design does not add them, consistent with "preserve existing schema unless demonstrably required."

**Concrete consequence for Studio**: a node/tag draft **may** be submitted, reviewed, and even approved with only an EN translation present (TRD18 §18.23's per-language coverage states apply *per language*, independently) — but `knowledgePublishDraft` enforces one additional, new validation not required for existing seed data: **a brand-new node's publish is rejected unless at minimum the EN translation is present and reaches `published` status in the same transaction** (existing onboarding already assumes EN never falls through to raw `canonicalName` for any active node it can select — `resolveDisplayLabel`'s "last-resort" `canonicalName` fallback exists for defensive robustness, not as an accepted steady state for Studio-authored content). FR is **not** a publish-blocking requirement (matching the seed data's own current, accepted EN-only state) but the published-taxonomy browser (§11.5) surfaces missing-FR nodes prominently, operationalizing "required for launch" as a tracked backlog rather than a hard gate that would make the tool unusable during the (already-existing, already-shipped) EN-only seed period.

## 13. Migration/backward-compatibility approach

**No production data is migrated or modified by this design task** (§9 boundaries). The approach for a future implementation package:

1. **Existing seed-created nodes become Studio-manageable without any data rewrite.** Because `createdBy`/`updatedBy` are read with a `"system:seed"` fallback when absent (§7), no backfill write is required before Studio can display or edit a pre-existing node — the first Studio-originated edit simply populates real values going forward.
2. **Seed/Studio collision is closed by a new guard, not by removing the seed script.** `ENG-P3-001-DESIGN-001` §10.5 already flagged, unresolved, that a rerun of `runCommerceKnowledgeSeed` could silently force a Studio-authored `draft`/`in_review` node forward to `active`. This design resolves it: `runCommerceKnowledgeSeed` gains one additive check — before transitioning any existing document's status, verify `updatedBy === "system:seed"`; if a document's `updatedBy` shows any other actor (i.e., Studio has touched it), the seed loader skips that entry with a warning rather than transitioning it. This is a small, additive change to `seedLoader.ts`'s existing reconciliation branch, not a redesign, and does not change the seed script's behavior for any node Studio has never touched.
3. **No canonical ID ever changes.** Studio edits a node in place (same `id`) or creates a genuinely new node; it never reassigns, reuses, or renumbers an existing `id`/`slug` — `slug` remains explicitly non-authoritative (§12 of `ENG-P3-001-DESIGN-001`), so a Studio-driven display-name change never breaks a Business reference, which is always by opaque `id`.
4. **Business references are never touched.** No Studio operation writes to `Business`, `RewardProgramVersion`, or any collection outside `knowledgeNodes`/`knowledgeTags`/`knowledgeTranslations`/`knowledgeDrafts`/`platformAdministrators`/the new audit collection.

## 14. Security/fail-closed behavior

- Every mutating command re-validates the caller's platform permission **server-side inside the transaction**, never trusting a client-supplied role/permission claim (mirrors `evaluatePermission.ts`'s re-validation-even-though-construction-already-enforced-it discipline, §5 of the prior research).
- Default is deny: absence of a `PlatformAdministratorDocument`, a `status` other than `"active"`, or absence of the specific permission all fail closed identically — no partial-success path.
- Self-approval/self-publish is blocked structurally (§6.3), not by UI omission alone.
- `mfaRequired`/"recent reauthentication for sensitive actions" (TRD18 §18.8–18.9: publish/retire/bulk-import are the sensitive actions here) — this design specifies the requirement and the field (`PlatformAdministratorDocument.mfaRequired`) but defers the actual MFA-enforcement mechanism to the platform's existing authentication architecture (out of this task's scope to redesign authentication) — flagged as a dependency, §18.
- Audit-write failure aborts the whole transaction (the audit write is inside the same transaction as the mutation, §9) — satisfying AR-013 ("Audit failure shall block ... high-risk administrative actions") by construction, not by a separate monitoring rule.
- No AI-authored change publishes without a human `knowledge_approver` action (TRD18 AR-012, §18.56) — this design does not build any AI-assist feature, but the command surface (§10) structurally cannot be bypassed by one: an `ai_assisted`-sourced draft is just another `source` value on `KnowledgeDraft`, subject to the identical review/approve/publish gate as every other source.

## 15. Concurrency/idempotency considerations

- **Draft mutation** (`knowledgeUpdateDraft`, status transitions): reuses the existing transactional `transaction.get`-existence/state-check-then-`transaction.set` pattern verbatim — a concurrent double-submit or double-approve is rejected by the draft's own current-status check inside the transaction (e.g., approving an already-`published` draft fails with the existing-shaped `invalidKnowledgeDraftTransitionError`, a new error factory following `invalidKnowledgeLifecycleTransitionError`'s exact existing shape).
- **Publish** additionally uses `checkAndReserveIdempotencyKey` (existing service, unmodified) keyed on `knowledge.publishDraft:${draftId}`, so a retried network call after a timeout cannot double-publish — identical reasoning to why `authorizeAndExecute` already does this for sensitive Business actions.
- **No new concurrency primitive is introduced.** Optimistic-concurrency version checks are unnecessary beyond what the transactional existence/state checks already provide, since every write path re-reads current state inside its own transaction before deciding — the same reasoning `ENG-P3-001B`'s repository layer already established for node creation.

## 16. Test strategy

Following this codebase's existing layered convention (pure-unit / boundary / real-Firestore-emulator), matching TRD18 §18.60's required coverage list:

- **Unit (pure models)**: `KnowledgeDraft` construction/validation, draft-status transition matrix (valid/invalid transitions), self-approval rejection logic, EN-required-at-publish validation, new `applyApprovedKnowledgeNodeEditPersisted`-shaped input validation.
- **Unit (permission evaluator)**: role-default resolution for `knowledge_editor`/`knowledge_approver`/`platform_super_administrator`, suspended-administrator denial, missing-`PlatformAdministratorDocument` denial, self-approval denial — mirroring `evaluatePermission.test.ts`'s existing structure.
- **Boundary tests**: domain-independence (no import of `domains/business`/`domains/permissions`'s Business-role evaluator from the new platform-permission module, and vice versa — the two authorization worlds stay structurally disjoint per §6.4), no direct Firestore write path from `apps/web` (a static/lint-level check consistent with existing boundary tests elsewhere).
- **Firebase Emulator integration tests**: full draft lifecycle end-to-end (create → submit → approve → publish, for both new-node and edit-of-existing-node shapes), retirement-with-replacement via Studio, translation attach/publish, seed/Studio collision guard (§13.2) exercised directly (seed a node, edit it via Studio to `in_review`, rerun seed, assert the node is left untouched), idempotent-publish-retry (duplicate `knowledgePublishDraft` call with the same idempotency key resolves as `"duplicate"`, never double-writes), audit-record creation on every privileged action, publication-event emission.
- **UI/E2E** (Playwright, following whatever pattern the Business dashboard's own tests use, if any exist — not independently confirmed in this research and to be re-verified by the implementing package): editor happy path (draft → submit), approver happy path (review → approve → publish), denied-access rendering for a caller with no `PlatformAdministratorDocument` or insufficient permission, self-approval UI block.
- **Role tests** (TRD18 §18.60): each role's allowed/denied action matrix (§6.1–6.2 table), suspended administrator denial, permission-change taking effect on next request (no client-side permission caching that could serve stale authorization).

## 17. Proposed implementation packages

Decomposed by actual complexity/collision boundary, following `ENG-P3-001-DESIGN-001` §28's own precedent (a design proposal, not itself an authorization to build):

| Package | Scope |
|---|---|
| **`ENG-P3-003A`** | Platform-administrator authorization primitive: `PlatformAdministratorDocument` model/repository, `platformKnowledgePermissionCatalogue.ts`, the platform-permission evaluator (§6, §14), no Knowledge-specific logic yet. |
| **`ENG-P3-003B`** | `KnowledgeDraft` model, repository, lifecycle (§7–§8), the `createdBy`/`updatedBy` additive field close-out (§7), the seed/Studio collision guard (§13.2). |
| **`ENG-P3-003C`** | Publish-path composition: `applyApprovedKnowledgeNodeEditPersisted`, the atomic new-node/edit/retirement publish transactions (§8–§9), audit record writer, publication events. |
| **`ENG-P3-003D`** | Transport layer: all `onCall` commands (§10), wired in `functions/src/index.ts`, idempotency-wrapped. |
| **`ENG-P3-003E`** | Frontend shell/routing: `PlatformAdministratorBoundaryPage`, `KnowledgeStudioShell`, `RequirePlatformPermission`, draft list + draft editor screens. |
| **`ENG-P3-003F`** | Frontend review workflow: review queue, suggestion triage, publish/retire actions, published-taxonomy browser with basic missing-translation surfacing. |
| **`ENG-P3-003G`** *(deferred, not MVP)* | Bulk import UI (`knowledge.bulk_import`, TRD18 §18.26) and the fuller analytics dashboard (§18.28) — the seed script already covers bulk-loading needs today; building a UI for it is lower priority than closing the core editorial loop, and is explicitly flagged here as post-MVP rather than silently dropped. |

Each package would, per this codebase's established convention, begin with its own fresh, narrow Founder/engineering-lead implementation authorization — this design authorizes none of them.

## 18. Decisions still requiring Founder input

None of the following block this design document itself, but a future implementation package should have them settled first:

1. **`knowledge.edit_draft` scope for `knowledge_editor`** (§6.2 table): may an editor edit *any* editor's draft, or only their own until submission? TRD18 does not specify. This design defaults to "any," matching the low-staffing MVP assumption (§18.7) and the fact that a draft is a shared work-in-progress artifact, not personal state — but this is a product-judgment call, not a governed fact, and is flagged rather than silently assumed as final.
2. **MFA enforcement mechanism** (§14): this design specifies the requirement and the field, not the mechanism — a Founder/engineering-lead call on how administrative MFA is actually implemented (reuse of an existing Firebase Auth capability vs. a new mechanism) is needed before `ENG-P3-003A` can be fully specified at the implementation level.
3. **Whether `platform_super_administrator` enrollment is bootstrapped manually (e.g., a one-time script/console action) or via a UI** — TRD18 does not specify a first-administrator bootstrap path, and none is designed here; a future package needs a concrete answer before any administrator can exist at all.

## 19. Files modified

- `docs/05-implementation/roadmap/ENG-P3-003-DESIGN-001-knowledge-studio-architecture-delivery-design.md` (this document — created)
- `docs/00-governance/documentation-changes-log.md` (Entry 157 added)

No other file modified. No `functions/`, `apps/web/`, Firestore Rules, CDR-001, Decision Register, Engineering Implementation Programme, or Coding-Agent Prompt Register edit made.

## 20. Diff summary

Two new/modified Markdown files, additive only. No application code, schema, configuration, or roadmap/programme/decision-register content changed.

## 21. Commands executed

`git fetch origin`; `git rev-parse origin/main`; `git worktree add <scratch-path> origin/main --detach`; read-only `find`/`grep`/file reads across `functions/src`, `apps/web/src`, and `docs/`; `git add`/`git commit`/`git push` for this document and the changes-log entry; `gh pr create` (no merge).

## 22. Dependencies added

None. No new npm package in `functions/` or `apps/web/` — the frontend design reuses the existing `formPrimitives.tsx`/Tailwind/`class-variance-authority`/`lucide-react`/`react-router-dom` stack; the backend design reuses the existing idempotency, permission-evaluator-shape, transaction, and outbox mechanisms.

## 23. Config/application changes

None. No Firebase project configuration, Firestore Rules, environment variable, or deployment target changed.

## 24. Risks

- **Seed/Studio collision** (§13.2) is a genuine, previously-flagged, real risk if `ENG-P3-003B`'s collision guard is not implemented before any Studio write path ships — the seed script as it exists today would silently overwrite a Studio-authored, still-`in_review` node on any rerun. This design specifies the fix; it does not implement it.
- **Two-evaluator surface area**: introducing a second, structurally disjoint permission evaluator (§6.4) is deliberate, but doubles the code surface a future auditor must reason about compared to a single unified evaluator — accepted here because unifying them would require forcing a `businessId` concept onto an actor who has none, which is a worse fit, per `ENG-P3-001-DESIGN-001` §13.2's own recommendation.
- **`PlatformAdministratorDocument` bootstrap gap** (§18.3): until a first-administrator bootstrap mechanism is decided, no implementation package can be meaningfully tested end-to-end against a real deployed environment (emulator tests can seed the collection directly, so this does not block `ENG-P3-003A`–`F`'s own test suites).
- **TRD18's "Draft for approval" status**: this design treats TRD18 as controlling architecture per §2's stated reasoning, but if the Founder has reservations about TRD18 specifically (as opposed to the Commerce Knowledge Standard or Knowledge Studio standard, both fully approved), those should surface before `ENG-P3-003A` begins, since this design's role/permission/audit shapes are all sourced from it.

## 25. Rollback instructions

`git revert` of this task's commit on its own branch — cleanly separable; reverting removes this design document and the changes-log entry with no effect on any other file, since nothing else was touched and no code exists yet to roll back.

## 26. Markdown implementation/design report

This document.

## 27. Persistent `.md` changes-log entry

`docs/00-governance/documentation-changes-log.md` Entry 157 (added in the same commit as this document).

## 28. Commit/PR/head SHA and CI/review state

Recorded after commit/push — see the accompanying PR opened following this document; not self-merged.

## 29. Confirmation FD-COM-001 remained untouched

Confirmed. This task worked exclusively in a fresh, isolated, detached-HEAD worktree branched from `origin/main` at `cd7c7589347e2de5a552dea52908265e8a91dcd0`. The primary working directory, which holds unrelated uncommitted `FD-COM-001` commercial-model changes, was never opened, read, staged, committed, stashed, reset, or otherwise altered by this task.

## 30. Confirmation no implementation began

Confirmed. No file under `functions/src`, `apps/web/src`, `firestore.rules`, or any Firebase/deployment configuration was created or modified. No new npm dependency was installed. No `onCall`/`onRequest` export was added to `functions/src/index.ts`. `ENG-P3-003` remains `Not started` in `CDR-001`'s own terms — this document is the design prerequisite `§17` names as the first package (`ENG-P3-003A`) has not itself been started either; it is proposed, not begun.

---

**Success gate:** `ENG-P3-003 KNOWLEDGE STUDIO ARCHITECTURE / DELIVERY DESIGN COMPLETE — IMPLEMENTATION BOUNDARIES AND PACKAGE SEQUENCE READY FOR FOUNDER REVIEW`
