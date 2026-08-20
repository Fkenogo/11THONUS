> **Title:** ENG-P3-001-DESIGN-001 — Commerce Knowledge Architecture & Delivery Design
> **Version:** 1.4 · **Status:** Design package — all Founder-owned decisions (`DEC-CKS-001`, `DEC-CKS-002`, Capability-3 wording) DISPOSITIONED/APPROVED; `DEC-DATA-005` (Engineering-Lead-owned) RESOLVED; `DEC-TECH-008` remains open, non-blocking; one independent-review F3 correction applied (§9.4/§15/§18, reference-validity vs. translation-display-availability separation); NO architecture/governance blocker remains — NOT an implementation authorization (Founder review of this revision + a fresh implementation authorization still required) · **Classification:** Working (execution-layer architecture record)
> **Governing document:** [Commerce Knowledge Standard](../../03-standards/commerce-knowledge-standard.md); [Knowledge Studio](../../03-standards/knowledge-studio.md); [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-DATA-005`, `DEC-TECH-008`, `DEC-SUB-002`; [`CDR-001` Capability 3](CDR-001-capability-delivery-roadmap.md#8-engineering-work-package-mapping); [ENG-P2-002-DESIGN-001](ENG-P2-002-DESIGN-001-business-identity-architecture-delivery-design.md); [ENG-P2-003-DESIGN-001](ENG-P2-003-DESIGN-001-staff-membership-identity-architecture.md); [ENG-P2-004-DESIGN-001](ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md); PRD3 (`03-business-registration.md`); TRD10 §10.7 (Commerce Knowledge Domain Collections), §10.9 (Reward Program Collections); TRD14 (Search, Discovery and Commerce Knowledge Query)
> **Source-of-truth path:** `docs/05-implementation/roadmap/ENG-P3-001-DESIGN-001-commerce-knowledge-architecture-delivery-design.md`
> **Last controlled update:** 2026-08-20 v1.4 (Independent Final Review, ENG-P3-001-DESIGN-001 merge-gate task: verified §9.1–§9.4's analysis and §7/§20's Firestore model directly against TRD10 §10.7.1–§10.7.3 and the Commerce Knowledge Standard Part II/III; confirmed the entry-state/diff-scope/CI facts and the `decision-register.md`/`CDR-001`/programme tracking diffs match this document's own claims exactly. **One F3 finding corrected**: §9.4's "New-reference eligibility" rule, §15's Business-reference-validation description, and §18's `ENG-P3-002` consumer contract used wording (`active`/`published`-status/-equivalent applied to the *node*) that read as folding `KnowledgeTranslation.status` into the gate for whether a `Business.primaryCategoryId`/`businessTypeId` write may reference a `KnowledgeNode` at all. No governing source (CKS, Knowledge Studio, TRD10 §10.7.1–§10.7.2, which declare `KnowledgeNode.status` and `KnowledgeTranslation.status` as independent fields on independent documents) couples translation-review progress to canonical-reference validity. Corrected all three sections to state plainly: referential validity is governed solely by `KnowledgeNode.status == "active"` and matching `nodeType`; `KnowledgeTranslation.status == "published"` (with EN fallback, §11) governs only what label a UI may display, never whether an `active` node is a valid reference. This is a wording correction to this document only — no schema, `functions/`, `apps/web/`, Rules, or permission-catalogue change, and no `decision-register.md` change, since `DEC-DATA-005`'s own resolution text already correctly scoped the "combined read" language to *onboarding-selection* (display) eligibility, not backend referential validity. Previously v1.3 (`DEC-DATA-005` Engineering Disposition pass, same-day: re-verified §9.1/§9.3's analysis directly against TRD10 §10.7.1–10.7.3 and the Knowledge Studio pipeline; **resolved `DEC-DATA-005`** — adopted a shared five-value canonical content-lifecycle enum `draft|in_review|active|retired|archived` for `KnowledgeNode`/`KnowledgeTag` [collapsing the six-value candidate's `approved`/`published` distinction, found operationally redundant for the canonical node/tag specifically] and kept `KnowledgeTranslation`'s existing three-value `draft|reviewed|published` enum unchanged, §9.4; added full transition matrices, new-reference/existing-reference eligibility rules, and terminal-state-reversibility findings, §9.4; disposed the `KnowledgeTag.translations` storage-shape question as an `ENGINEERING SCHEMA CLARIFICATION` [unify on `KnowledgeTranslation`'s shape], §9.3; recorded the resolution in `decision-register.md`'s `DEC-DATA-005` entry, Engineering Lead, 2026-08-20; replaced all `<PENDING DEC-DATA-005>` schema placeholders in §20 with the resolved enums; ran a full stale-statement sweep correcting every "DEC-DATA-005 open/blocking" reference across §7/§9/§10/§18/§19/§20/§25/§27/§30/§31/§32/§34; kept `DEC-TECH-008` explicitly OPEN/DEFERRED, no search technology selected; no schema, `functions/`, `apps/web/`, Rules, or permission-catalogue change made — `ENG-P3-001A` is architecturally ready but not authorized))

# ENG-P3-001-DESIGN-001 — Commerce Knowledge Architecture & Delivery Design

**This document defines architecture only. It authorizes no implementation.** No production code, Firestore Rules, migration, client UI, callable/HTTPS endpoint, or deployment is created or modified by this document. No new permission identifier is added to `ordinaryPermissionCatalogue.ts` or `sensitivePermissionCatalogue.ts`. It is analogous in role to [ENG-P2-002-DESIGN-001](ENG-P2-002-DESIGN-001-business-identity-architecture-delivery-design.md) (Business Identity) and [ENG-P2-003-DESIGN-001](ENG-P2-003-DESIGN-001-staff-membership-identity-architecture.md) (Staff Membership) for the Commerce Knowledge concern of Capability 3. It resolves the architecture-level prerequisites the Engineering Implementation Programme's `ENG-P3-001` row ("Commerce Knowledge seed data") needs before a future implementation prompt can be authorized without a coding agent inventing taxonomy semantics, governance-lifecycle vocabulary, or a search technology choice.

---

## 0. Entry State

- **Entry `origin/main` SHA:** `bee297c39e46b68b0edcd20404b6f06baf26b6a8` (this document authored in the isolated worktree `docs/eng-p3-001-design-001`, branched cleanly from this SHA; the primary worktree at `/Users/theo/11THONUS` was left untouched, per instruction — it is stale/behind).
- **Capability 3 (Business Identity):** `Open — partially implemented; not closed` (`CDR-001` §5, Capability 3, last entry 2026-08-20). `ENG-P2-002` (Business Identity) and `ENG-P2-003` (Staff Membership) concerns are both `Complete`; `ENG-P2-004` (role/permission resolution) is `Complete`. `ENG-P3-001`/`002`/`003` all remain `Not started`, not authorized by any prior closure.
- **Open PRs:** `gh pr list --state open` shows exactly one open PR — #34 (`docs(tracking): ENG-P2-RES-ADMIN-003 — Post-Decision Synchronisation`), docs-only, unrelated to Commerce Knowledge.
- **No prior ENG-P3-001 design or implementation artifact exists.** Repository-wide search confirms zero matches for `ENG-P3-001` outside the roadmap/programme/register tracking documents already cited above — no `knowledgeNodes`/`KnowledgeNode`/`commerceKnowledge` code anywhere in `functions/src` (confirmed by directory listing: no `functions/src/domains/commerceKnowledge` or equivalent exists).
- **This package's authorization:** design/architecture only, matching the same constraint pattern `ENG-P2-002-DESIGN-001` and `ENG-P2-003-DESIGN-001` operated under.

## 1. Purpose

This document resolves the architecture-level prerequisites for `ENG-P3-001` (Commerce Knowledge seed data), the first of three Commerce Knowledge work packages the Engineering Implementation Programme's Phase 3 defines (`engineering-implementation-programme.md:242-260`):

| Work Package | Title | Scope |
|---|---|---|
| `ENG-P3-001` | Commerce Knowledge seed data | Launch taxonomy (industries, categories, types, tags, EN/FR labels) exists and is queryable |
| `ENG-P3-002` | Business onboarding flow | A business can complete setup using only governed taxonomy |
| `ENG-P3-003` | Knowledge Studio MVP | Taxonomy can be authored/approved/published without code changes |

`ENG-P3-001` is the **foundation** package: it must exist, with a stable schema and a stable minimum seed dataset, before `ENG-P3-002` (onboarding UI) or `ENG-P3-003` (editorial tooling) can be authorized (Programme: "Preconditions: `ENG-P3-001` complete" for both). This document is **not** an implementation authorization for `ENG-P3-001` itself — it produces the architecture a future `ENG-P3-001A`/`...` implementation prompt would consume.

## 2. Scope

### 2.1 What this document covers

- The Commerce Knowledge domain boundary and entity model (§6–§7).
- Platform/business ownership proof (§8).
- Taxonomy governance/lifecycle state-vocabulary analysis, including the `DEC-DATA-005` routing (§9).
- The minimum-viable seed-data model (§10).
- The localization model, EN/FR only (§11).
- The identifier/reference model (§12).
- The authorization-model mapping onto the existing permission catalogues, with any gap flagged, not filled (§13).
- The event-model evaluation (§14).
- Integration boundaries with the completed `ENG-P2-002` (Business), `ENG-P2-003` (Staff), and the `DEC-TECH-008` search-boundary disposition (§15–§17).
- Conceptual consumer contracts for `ENG-P3-002` and `ENG-P3-003` (§18–§19).
- The proposed (not applied) Firestore model, command/query architecture, and validation/test architecture (§20–§22).
- Founder decisions and engineering decisions requiring disposition, implementation decomposition, sequencing, Definition of Ready, and acceptance matrix (§23–§29).

### 2.2 What this document explicitly does NOT do

| Concern | Owned by | Why excluded here |
|---|---|---|
| Business onboarding UI/flow | `ENG-P3-002` (not started) | Backend/data contract only (§18) |
| Knowledge Studio editorial UI, draft→approve→publish workflow implementation | `ENG-P3-003` (not started) | Conceptual consumer contract only (§19); this document does not design Studio's screens, roles, or review queue mechanics |
| A search technology decision | `DEC-TECH-008` (Engineering-Lead-owned, `OPEN_ENGINEERING`) | This document evaluates the boundary and states whether MVP can proceed without a dedicated provider (§17); it does not itself dispose the decision |
| ~~A knowledge-state vocabulary decision~~ | `DEC-DATA-005` (Engineering-Lead-owned) | **RESOLVED** — this document's disposition, §9.4, recorded in `decision-register.md` (Engineering Lead, 2026-08-20); no longer an excluded/deferred item |
| Any new permission identifier | `ENG-P2-004`'s catalogues (`Complete`, frozen) | This document proposes permission *needs* in prose only (§13); no catalogue file is touched |
| Reward Program CRUD/versioning | `ENG-P4-001`/`002` (Phase 4, `Blocked`) | `rewardProgramVersions.qualifyingKnowledgeNodeIds` (TRD10 §10.9.2) is a **consumer** of Commerce Knowledge nodes; this document does not design Reward Program lifecycle |
| Business Identity aggregate design | `ENG-P2-002` (`Complete`) | Already-closed; `Business.primaryCategoryId`/`businessTypeId` are references *into* Commerce Knowledge, not redefinitions of it (`ENG-P2-002-DESIGN-001` §2.2) |
| Staff/permission evaluation mechanics | `ENG-P2-004` (`Complete`) | Consumed, not modified (§13) |
| Kirundi/Swahili/Kinyarwanda localization | Out of current implementation scope | §11 documents the doc-currency discrepancy but does not architect for these languages |

## 3. Governing Sources Actually Reviewed

Read in full from the actual files inside the clean `origin/main` worktree, not from secondhand summaries:

- [Commerce Knowledge Standard](../../03-standards/commerce-knowledge-standard.md) (Parts I–XV, CKS-001–006).
- [Knowledge Studio](../../03-standards/knowledge-studio.md) (Knowledge Pipeline, Domains 1–5, Translation/Search/Tag Studio, Versioning, Governance, Architectural Principles).
- [PRD3 — Business Registration](../../01-product/prd/03-business-registration.md) (§6–7, §14–16, business categories/products philosophy).
- [PRD6 — Reward Programs and Loyalty Cycles](../../01-product/prd/06-reward-programs-and-loyalty-cycles.md) (§4, Reward Program Structure — the qualifying-products linkage).
- [TRD10 — Firestore Data Architecture](../../02-technical/trd/10-firestore-data-architecture.md) §10.3–10.5 (top-level structure, ownership matrix, standard metadata), §10.6.3–10.6.4 (`businesses`/`businessMemberships`, for the reference boundary), §10.7 (Commerce Knowledge Domain Collections — `knowledgeNodes`, `knowledgeTranslations`, `knowledgeTags`, already schema-declared), §10.9 (`rewardPrograms`/`rewardProgramVersions` — the `qualifyingKnowledgeNodeIds` consumer contract).
- [TRD14 — Search, Discovery and Commerce Knowledge Query](../../02-technical/trd/14-search-and-discovery.md) (Purpose, Objectives, Architecture Principles SAP-001–005).
- [CDR-001 §5 Capability 3](CDR-001-capability-delivery-roadmap.md#capability-3--business-identity) and [§8 mapping table](CDR-001-capability-delivery-roadmap.md#8-engineering-work-package-mapping).
- [Engineering Implementation Programme](../change-tracking/engineering-implementation-programme.md) Phase 3 (`ENG-P3-001`/`002`/`003` work-package table).
- [Decision Register](../../00-governance/decisions/decision-register.md): `DEC-DATA-005` (Knowledge/rule state vocabulary unification — originally `OPEN_ENGINEERING` at first reading, since **RESOLVED** by this design's own disposition, §9.4), `DEC-TECH-008` (Search implementation, still `OPEN_ENGINEERING`), `DEC-SUB-002` (Staff limits per plan, `OPEN_FOUNDER`), plus `DEC-DATA-001` (server-only authoritative writes), `DEC-DATA-004` (adjacent state-vocabulary precedent).
- [ENG-P2-002-DESIGN-001](ENG-P2-002-DESIGN-001-business-identity-architecture-delivery-design.md) (full document) — Business aggregate, bootstrap authority pattern, event/transaction conventions.
- [ENG-P2-003-DESIGN-001](ENG-P2-003-DESIGN-001-staff-membership-identity-architecture.md) — Staff Membership architecture (referenced for the callable-transport gap, §16).
- [ENG-P2-004-DESIGN-001](ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md) — Sensitive Permission Catalogue design, evaluator contract.
- Code: full tree of `functions/src/domains/business/` and `functions/src/domains/permissions/` (models, repositories, services, events) — read directly, not summarized, including `ordinaryPermissionCatalogue.ts`, `sensitivePermissionCatalogue.ts`, `permissionId.ts`, `businessCode.ts`, `business.ts`, `businessRepository.ts`, `outboxWriter.ts`, `errorCategories.ts`.
- `functions/src/index.ts` — confirmed which callables actually exist (`createBusiness`, `updateBusinessProfile`, `updateBusinessBranchProfile`, `submitBusinessForVerification`, `closeBusiness`, plus Authentication callables) and which do not (no `ENG-P2-003` staff-membership callable exists at all — see §16).
- `apps/web/src/i18n/config.ts` and `apps/web/src/i18n/locales/` — confirmed EN/FR-only, namespace-based, centralized i18next resources (`I18N-001`).

## 4. Current Repository State

- **No Commerce Knowledge code exists.** Zero files under any `functions/src/domains/commerceKnowledge*` (or similarly named) path; zero repository-wide references to `KnowledgeNode`/`knowledgeNodes` outside `docs/`.
- **The Firestore schema for Commerce Knowledge is already declared** in TRD10 §10.7 — `knowledgeNodes`, `knowledgeTranslations`, `knowledgeTags` — but this declaration **predates** and is **inconsistent with** the Knowledge Studio pipeline vocabulary (§9) and has never been implemented.
- **A live consumer contract already exists** at TRD10 §10.9.2: `rewardProgramVersions.qualifyingKnowledgeNodeIds: string[]` and `standardRewardNodeId?: string` — meaning Commerce Knowledge nodes are already load-bearing in the (not-yet-built) Reward Program schema, even though nothing populates `knowledgeNodes` yet.
- **`Business.primaryCategoryId`/`businessTypeId`** (TRD10 §10.6.3, implemented in `functions/src/domains/business/models/business.ts`) are already-required/optional string reference fields with **no validation against any Commerce Knowledge collection** — `createBusiness`'s only validation of `primaryCategoryId` is `requireNonBlank` (business.ts:112). This is a **structural gap**, not a defect: `ENG-P2-002A` correctly deferred Commerce Knowledge validation to Commerce Knowledge's own domain (`ENG-P2-002-DESIGN-001` §2.2's exclusion table: "`Business.primaryCategoryId`/`businessTypeId` reference Commerce Knowledge nodes; ENG-P2-002 never defines the taxonomy"), but it means `ENG-P3-001`/`002` inherits the responsibility of validating these references once Commerce Knowledge exists.
- **No permission identifier for Commerce Knowledge exists** in `ordinaryPermissionCatalogue.ts` or `sensitivePermissionCatalogue.ts` (both closed, Founder-approved sets — four and eight entries respectively, verified by direct read).

## 5. Existing Architecture Dependencies

- **Business Identity (`ENG-P2-002`, `Complete`)**: `Business.primaryCategoryId` (required), `Business.businessTypeId` (optional) are the only current references into Commerce Knowledge. No branch-level or membership-level Commerce Knowledge reference exists.
- **Staff Membership (`ENG-P2-003`, `Complete` at the concern level)**: no direct dependency on Commerce Knowledge. Relevant only as a precedent for command/event/repository conventions (§20) and for the callable-transport gap this document must not attempt to close (§16).
- **Role/Permission Resolution (`ENG-P2-004`, `Complete`)**: the evaluator (`evaluatePermission.ts`), the two closed catalogues, and the 14-category error taxonomy (`errorCategories.ts`) are the platform's only authorization/error mechanisms. Commerce Knowledge must map onto these, not invent parallel ones (§13).
- **Outbox/event infrastructure (`ENG-P1-002`, `Complete`)**: `functions/src/shared/outbox/outboxWriter.ts` is the single shared, transactional, at-least-once event-emission mechanism every domain reuses. Any Commerce Knowledge event must reuse it (§14).
- **i18n (`I18N-001`, `Complete` on `main`)**: `apps/web/src/i18n/` establishes the centralized EN/FR pattern (namespaces, resource bundling, `preferredLanguage` server sync) that a future frontend consumer of Commerce Knowledge labels would use; this document's localization model (§11) is architected to be consumable by that pattern without redesigning it.
- **Reward Program schema (not yet implemented, `ENG-P4-001`/`002`, `Blocked`)**: already-declared consumer of `knowledgeNodes` via `qualifyingKnowledgeNodeIds` (§4). `ENG-P3-001` must produce a schema Phase 4 can consume without redesign.

## 6. Commerce Knowledge Domain Boundary

The Commerce Knowledge Standard's hierarchy (CKS Part III) is **GOVERNED REQUIREMENT** and is not relitigated here. This section classifies each level for engineering purposes:

| Level | Classification | Rationale |
|---|---|---|
| Industry | **Platform-governed** | CKS-001/002/CKS Part XIV: fixed catalogue, centrally managed, businesses only select |
| Business Category | **Platform-governed** | CKS Part V; PRD3 §7 ("configurable business categories," "shall not restrict Reward Programs") — configurable by the *platform*, not by individual businesses |
| Business Type | **Platform-governed** | CKS Part VI; refines search/analytics only, never a business-invented value |
| Reward Program Category | **Platform-governed** | CKS Part VII: "curated by the platform and grows over time" |
| Standard Product/Service | **Platform-governed**, with a **business-specific** display overlay | CKS-003/CKS Part VIII: the canonical node is platform-governed; PRD3 §15's "Product Categories... businesses define their own" describes the **display/branding layer** (`businessDisplayProductNames` in TRD10 §10.9.2), not a second taxonomy — reconciled explicitly: PRD3 §15–16 governs the business's own free-text product label and its self-declared equivalence rule (BR-032), while the *Standard Product* it maps to (`qualifyingKnowledgeNodeIds`) remains platform-governed. These are two different fields serving two different purposes, not a contradiction. |
| Business Display Name | **Business-specific** | CKS-003, worked example ("Joe's Signature Coffee" vs. "Regular Coffee") — free text, explicitly outside governance |
| Tags | **Platform-governed** (Business/Product/Customer-Interest tags) and **platform-computed** (Behaviour tags) | CKS Part IX/Knowledge Studio Tag Management: "governed tag library"; Behaviour tags are "never manually assigned... inferred by the platform" — **out-of-scope for `ENG-P3-001`'s seed data** (behavioural inference is a future analytics/AI capability, not a taxonomy-seeding concern) |
| Search Metadata | **Platform-governed**, structurally **deferred implementation detail** | CKS Part X/Knowledge Studio "Search Intelligence": every entry *supports* search metadata (synonyms, alternative names); `ENG-P3-001`'s obligation is to include the *fields*, not to build a search engine (§17) |
| AI Metadata | **Deferred / out-of-scope for `ENG-P3-001`** | CKS-006/Knowledge Studio "AI Readiness": explicitly "future," no current requirement traces to it; the schema should reserve room for it (a `schemaVersion`-safe additive field later) without `ENG-P3-001` populating or designing it now |

**Doc-currency discrepancy (flagged, not resolved):** CKS Part XI and Knowledge Studio's Translation Studio both still list Kirundi/Swahili/Kinyarwanda as "planned" languages. The current implementation scope (§11, `TRD13`, `I18N-001` as merged) is EN required/FR optional only. This is a documentation-currency gap in the Commerce Knowledge Standard and Knowledge Studio documents themselves, not a decision this package makes — flagged for a future documentation-currency pass, out of this task's scope.

## 7. Entity Model

Each entity below states: canonical name, responsibility, identifier, lifecycle/status, required/optional fields, relationships, timestamps/versioning, localization, search metadata, and ownership/read/write authority. All entities build on TRD10 §10.7's already-declared shapes, corrected only where this document identifies a genuine gap (flagged inline as **ENGINEERING DESIGN PROPOSAL**).

### 7.1 `KnowledgeNode`

- **Responsibility:** the canonical, hierarchical taxonomy node — represents Industry, Business Category, Business Type, Reward Program Category, Standard Product, or Standard Service (CKS Part III's six business-selectable levels; Business Display Name/Tags/Search Metadata/AI Metadata are not `KnowledgeNode` instances — see §7.2–§7.4).
- **Identifier:** opaque, non-sequential Firestore document id (TRD10 §10.5 "IDs shall be opaque and non-sequential" — GOVERNED REQUIREMENT, platform-wide). `slug` (already in TRD10 §10.7.1) is a separate, human-readable, non-authoritative field — never the document id, consistent with `ENG-P2-002-DESIGN-001`'s treatment of `businessCode` as non-identity (§12).
- **Lifecycle/status:** `"draft" | "in_review" | "active" | "retired" | "archived"` — **RESOLVED**, `DEC-DATA-005`, see §9.4.
- **Required fields:** `parentId` (nullable — root Industries have `parentId: null`), `nodeType` (already-declared six-value union, TRD10 §10.7.1), `canonicalName`, `slug`, `path`, `depth`.
- **Optional fields:** `description`, `iconKey`, `replacementNodeId` (retired-node forward-reference, already declared).
- **Relationships:** self-referencing hierarchy (`parentId`); referenced *from* `Business.primaryCategoryId`/`businessTypeId` (business_category/business_type node types), `RewardProgramVersion.qualifyingKnowledgeNodeIds`/`standardRewardNodeId` (standard_product/standard_service node types), and `KnowledgeTranslation.nodeId`.
- **Timestamps/versioning:** `createdAt`/`createdBy`/`updatedAt`/`updatedBy` (standard metadata, TRD10 §10.5) plus `version: number` (already declared) — versioning is node-level (a new version supersedes, never mutates, historically-referenced content; see §24).
- **Localization:** the node itself carries no display text beyond `canonicalName` (an internal/English working name, not a customer-facing label) — customer-facing localized labels live entirely in `KnowledgeTranslation` (§7.2), matching TRD10 §10.7's existing separation.
- **Search metadata:** `searchTerms: string[]` (already declared) — canonical-language search terms; per-language search terms live on the corresponding `KnowledgeTranslation.synonyms`.
- **Ownership/read/write authority:** write = platform Knowledge Studio editorial process only (`ENG-P3-003`, future) or the seed-loader (`ENG-P3-001`, §10); read = every authenticated business/customer context and any server-side domain that validates a reference (Business onboarding, Reward Program creation). No business ever writes a `KnowledgeNode`.

#### 7.1.1 Parent-Type Adjacency Rule (`ENGINEERING DESIGN PROPOSAL` — genuine gap found, closed here)

**Investigated: is one polymorphic `KnowledgeNode` type (a single `nodeType` union with a self-referencing `parentId`) sufficient, or does each hierarchy level need its own entity type?** Finding: polymorphic is sufficient — TRD10 §10.7.1's own "Hierarchy Rule" already requires variable depth ("the platform shall not hardcode exactly three taxonomy levels"), which a fixed six-entity-type design could not satisfy without a redesign every time a level is added. But **neither TRD10 §10.7.1 nor this document, as originally drafted, stated which `nodeType` may be the `parentId` of which** — meaning nothing prevented, at the validation layer, a `standard_product` pointing directly at an `industry`, or a cycle. This is a genuine, bounded gap, not scope creep, and the Commerce Knowledge Standard's own Part III already governs the answer — it states the hierarchy "shall remain fixed" as a strict linear chain. This document adds the missing validation rule directly from that already-governed source, rather than inventing one:

| Child `nodeType` | Only allowed parent `nodeType` | Source |
|---|---|---|
| `industry` | none — `parentId` must be `null` (root) | CKS Part III (top of the fixed chain) |
| `business_category` | `industry` | CKS Part III |
| `business_type` | `business_category` | CKS Part III |
| `reward_program_category` | `business_type` | CKS Part III |
| `standard_product` / `standard_service` | `reward_program_category` | CKS Part III / Part VIII |

This is a **required validation rule at the domain-model layer** (§7's own `KnowledgeNode` validator, §22's unit-test layer): a write (seed-time or future Knowledge Studio) that would set a `parentId` to a node of any other `nodeType`, or that would create a cycle (a node whose ancestor chain, followed via `parentId`, revisits itself), must be rejected before persistence. This does not change the Firestore schema (§20) — `parentId`/`nodeType` are already-declared fields; it only adds the validation semantics those fields were always implicitly expected to carry. No `nodeType` union member is added or removed by this addition.

### 7.2 `KnowledgeTranslation`

- **Responsibility:** the localized (language-specific) display label, description, and synonym list for one `KnowledgeNode`.
- **Identifier:** opaque document id; **composite uniqueness** `(nodeId, languageCode)` must be enforced at the write layer (not currently stated in TRD10 §10.7.2 — **ENGINEERING DESIGN PROPOSAL**: enforce via a deterministic document id `{nodeId}_{languageCode}` — the same "document id doubles as the uniqueness key" pattern `ENG-P2-002B` already established for `businessCodeReservations/{businessCode}`, reused here as a proven precedent, not invented fresh).
- **Lifecycle/status:** `"draft" | "reviewed" | "published"` (TRD10 §10.7.2, unchanged) — **RESOLVED, `DEC-DATA-005`, §9.4**: confirmed as a genuinely different, narrower vocabulary than `KnowledgeNode`/`KnowledgeTag`'s shared canonical-content status, correctly kept separate rather than unified.
- **Required fields:** `nodeId`, `languageCode` (BCP-47-compatible per TRD10 §10.5), `displayName`.
- **Optional fields:** `description`, `synonyms: string[]` (default empty), `reviewedBy`/`reviewedAt`.
- **Relationships:** many-to-one with `KnowledgeNode` (one node has EN + optionally FR translations at MVP).
- **Timestamps/versioning:** standard metadata; no independent `version` field declared in TRD10 §10.7.2 — **flagged, not resolved by `DEC-DATA-005`** (that decision resolved the *status vocabulary*, §9.4; this is a separate, narrower versioning-axis question it did not need to reach): if a node's canonical meaning changes materially, do its translations need independent versioning, or do they always track the node's own `version`? Recommendation (ENGINEERING DESIGN PROPOSAL, still open): translations track the node's version implicitly (a translation is valid only under its node's current version; a new node version requires re-review of existing translations) — this avoids inventing a second independent version axis. This is a recommendation for `ENG-P3-001A` to confirm, not a blocking decision.
- **Localization:** this entity *is* the localization mechanism.
- **Search metadata:** `synonyms` (already declared) serve the same purpose as TRD14's "Alternative Names/Common Misspellings/Regional Terms."
- **Ownership/read/write authority:** write = Knowledge Studio editorial/translation workflow (`ENG-P3-003`) or seed-loader (EN + FR at seed time, §10); read = same as `KnowledgeNode`.

### 7.3 `KnowledgeTag`

- **Responsibility:** a governed, reusable tag (Business/Product/Customer-Interest/Behaviour groups per CKS Part IX).
- **Identifier:** opaque document id; `slug` non-authoritative.
- **Lifecycle/status:** `"draft" | "in_review" | "active" | "retired" | "archived"` — **RESOLVED, `DEC-DATA-005`, §9.4**: `KnowledgeTag` now shares the canonical Commerce Knowledge content-lifecycle enum with `KnowledgeNode` (widened from TRD10's originally-declared three-value `draft|active|retired`, at `ENG-P3-001A` implementation time), since both model the same underlying "is this the live canonical truth" question.
- **Required fields:** `tagGroup` (already-declared four-value union), `canonicalName`, `slug`.
- **Optional fields:** none beyond the already-declared `translations: Record<string, string>` (a denormalized inline map, unlike `KnowledgeNode`'s separate `KnowledgeTranslation` collection — flagged inconsistency, §9) and `searchTerms`.
- **Relationships:** referenced by future Business-tag/Product-tag associations (not yet designed — out of `ENG-P3-001` scope; see §10.2).
- **Timestamps/versioning:** standard metadata; no independent `version` field (TRD10 §10.7.3) — tags are simpler, lower-churn entities than nodes; this is consistent with CKS's own treatment (tags are described, not versioned, in the Standard).
- **Localization:** inline `translations: Record<string, string>` map — **structurally inconsistent** with `KnowledgeNode`'s separate-collection approach; disposed as an `ENGINEERING SCHEMA CLARIFICATION` (§9.3, tracked in `DEC-DATA-005`'s Decision Register entry but not itself a status-vocabulary question): `KnowledgeTag` shall be restructured to reuse `KnowledgeTranslation`'s shape at `ENG-P3-001A` implementation time, not retain this inline map.
- **Search metadata:** `searchTerms` (already declared).
- **Ownership/read/write authority:** same as `KnowledgeNode` — Knowledge Studio/seed-loader write, universal read. **Behaviour tags are never manually written by any actor** (CKS Part IX) — they are out of `ENG-P3-001`'s seed-data scope entirely (§6) and would be produced only by a future analytics/AI capability, not this domain's write path.

### 7.4 What is explicitly NOT a new entity

- **Business Display Name** is not a Commerce Knowledge entity — it is the existing `Business.displayName`/`businessDisplayProductNames` (TRD10 §10.6.3/§10.9.2), already owned by `ENG-P2-002`/future `ENG-P4-001`.
- **Search Metadata** and **AI Metadata** (CKS Part III's last two hierarchy levels) are **fields on the entities above** (`searchTerms`, future AI-metadata field), not separate collections — the Standard's "hierarchy" diagram names them as conceptual layers of every entry, not as independent objects with their own identity.
- **A business-owned "what products/services do I sell" catalogue, independent of any specific Reward Program, is also explicitly NOT a new entity — investigated directly, not assumed.** See §15's added subsection below for the full sourced finding: PRD3 never names a business-level product/service selection step distinct from Reward Program creation, and no `businessOffering`/`businessCatalogue`-shaped collection is declared anywhere in TRD10. The only place a specific Business ever records which Standard Product/Service it offers is `RewardProgramVersion.qualifyingKnowledgeNodeIds` (TRD10 §10.9.2), created at Reward-Program-creation time (`ENG-P4-001`, Phase 4), not at onboarding/Commerce-Knowledge time.

## 8. Platform/Business Ownership Model

**GOVERNED REQUIREMENT** (CKS Part XIV, Knowledge Studio "Knowledge Governance"): businesses cannot create new industries/categories/types/Reward-Program-categories/standard-products directly; they may only *suggest*, and suggestions require review before becoming canonical.

**Structural proof a business cannot mutate canonical taxonomy merely by using it:**

1. **No business-scoped write path exists or is proposed.** `Business.primaryCategoryId`/`businessTypeId` and `RewardProgramVersion.qualifyingKnowledgeNodeIds` are **read-only references** from the business's perspective — the business selects an id from an already-published `KnowledgeNode`; nothing in this design gives any Business or `businessMembership`-scoped command a write path to `knowledgeNodes`/`knowledgeTranslations`/`knowledgeTags`.
2. **Authorization asymmetry is structural, not merely policy.** Every existing mutating command in `functions/src/domains/business/` and `functions/src/domains/permissions/` is gated through `ENG-P2-004`'s evaluator, which is entirely `businessId`-scoped (`ENG-P2-004-DESIGN-001` §5.6/§6.9: the evaluator's only membership input is the single `(userId, businessId)` record). A Knowledge Studio editorial write is **not** business-scoped at all — it has no `businessId` in its authorization context — so it cannot be modeled as "a permission a business role holds" without breaking the evaluator's own contract. This is a structural proof, not a policy promise: even a compromised or malicious Owner/Manager/Staff credential has no code path into `knowledgeNodes` writes, because no such path is ever wired to the business-role evaluator.
3. **Suggestion (if built) is a distinct, lower-authority act than publication.** A "suggest a new tag/product" action (Knowledge Studio's own governed pipeline: Suggested → Reviewed → Approved → ...) would, if implemented, write to a *separate* proposal-shaped collection (e.g. `knowledgeSuggestions`, already named in TRD10 §10.3/§10.4's top-level list) — never directly to `knowledgeNodes`/`knowledgeTags`. This document does not design the suggestion-write path itself (Programme scope: that is `ENG-P3-003`'s "authored/approved/published" workflow) but confirms the structural separation is already anticipated in TRD10's own collection list.
4. **Tenant isolation for business-specific associations**: any future business-specific *association* to a governed node (e.g., "this Business selected Standard Product X") lives on the **Business's own document/subcollection** (`Business.primaryCategoryId`, `RewardProgramVersion.qualifyingKnowledgeNodeIds`), never as a mutation of the shared node. This mirrors `ENG-P2-002-DESIGN-001` §12's tenant-isolation pattern exactly: the referencing document is business-scoped and isolated; the referenced node is platform-scoped and shared; reference direction never implies write authority in the reverse direction.

**Conclusion: GOVERNED REQUIREMENT (CKS-002/Part XIV) is structurally provable, not merely asserted, given the existing `ENG-P2-004` evaluator boundary and TRD10's existing collection separation.**

## 9. Taxonomy Governance/Lifecycle Model — `DEC-DATA-005` RESOLVED

**`DEC-DATA-005` (Commerce Knowledge scope) is now RESOLVED, recorded in `decision-register.md` by the Engineering Lead, 2026-08-20.** This section is retained largely as originally authored (§9.1–§9.3, the as-declared vocabularies and the bounded decision brief that led to the resolution) for full audit traceability, with the resolution itself and its consequences added at §9.4. §9.1's characterization of the problem and §9.3's per-entity semantic analysis and option comparison were **independently re-verified**, not merely carried forward, as part of the disposition — re-reading TRD10 §10.7.1–10.7.3 and the Knowledge Studio pipeline (`docs/03-standards/knowledge-studio.md`) directly confirmed the analysis below still holds.

### 9.1 The three vocabularies, as originally declared (superseded by §9.4's resolution for `KnowledgeNode`/`KnowledgeTag`)

| Source | Vocabulary | Scope |
|---|---|---|
| Knowledge Studio "Knowledge Pipeline" (prose) | Suggested → Reviewed → Approved → Translated → Tagged → Indexed → Published → Available Platform-wide | An eight-step **process/workflow** narrative, not a persisted enum |
| TRD10 §10.7.1 `KnowledgeNode.status` (already declared) | `"draft" \| "pending_review" \| "active" \| "retired" \| "archived"` | A five-value **persisted enum** |
| TRD10 §10.7.2 `KnowledgeTranslation.status` (already declared) | `"draft" \| "reviewed" \| "published"` | A **different**, three-value persisted enum |
| TRD10 §10.7.3 `KnowledgeTag.status` (already declared) | `"draft" \| "active" \| "retired"` | A **third**, different three-value persisted enum |

These three enums do not line up with each other or with the Knowledge Studio pipeline's own eight named steps. `DEC-DATA-005` (decision-register.md:1030-1040) names exactly this: *"Unify the three knowledge-object vocabularies (canonical draft/in_review/approved/published/retired/archived vs TRD10 pending_review/active vs Knowledge Studio pipeline) and rule-version variants."* Status: `OPEN_ENGINEERING`, owner: Engineering Lead, required by Phase 3 (i.e., **this phase**), blocks: knowledge schema. The register's own entry additionally records: *"Current confirmed position: canonical lists approved as target; schema alignment pending"* — meaning the **direction** (a `draft | in_review | approved | published | retired | archived`-shaped canonical enum) is already agreed at the terminology-audit level; what remains genuinely open is applying it to `TRD10`'s actual per-entity `status` field declarations (§9.1's three enums), which is exactly the disposition this document routes below, not something already decided that this document could safely treat as resolved.

### 9.2 The three axes the Standard's process prose maps onto

**Historical framing (how this document originally approached the question, retained for traceability — the disposition itself is at §9.4):**

1. **Persisted state** — the actual `status` field(s) stored on `KnowledgeNode`/`KnowledgeTranslation`/`KnowledgeTag` documents. Originally three different enums (§9.1) for what is conceptually the same underlying "is this thing usable yet" question, differentiated only by which entity it's attached to.
2. **Workflow/process milestone** — the Knowledge Studio pipeline's eight named steps (Suggested/Reviewed/Approved/Translated/Tagged/Indexed/Published/Available). Some of these (Translated, Tagged, Indexed) are **not lifecycle states of the node itself** — they are process activities that *produce* related-but-separate persisted facts (a `KnowledgeTranslation` document existing = "translated" happened; a `searchTerms` array being populated = "indexed" happened). Conflating "did this workflow step happen" with "what is this node's own status" is the terminology audit's own point (`DEC-DATA-005`'s cited "terminology audit C.15/C.16" and its recommended direction: "adopt canonical + map studio pipeline steps as process activities") — confirmed correct by §9.4's resolution.
3. **Deferred-to-`ENG-P3-003`** — the actual editorial *workflow engine* (who can transition what, review-queue mechanics, duplicate detection, translation-completeness gating) is Knowledge Studio's own implementation concern (Programme: `ENG-P3-003`'s "draft→approve→publish workflow test"), not `ENG-P3-001`'s. `ENG-P3-001` needs only a stable **persisted-state field name and value set** to seed data into, now provided by §9.4 — it does not need the workflow engine.

### 9.3 `DEC-DATA-005` Engineering Lead Decision Brief (the analysis that led to the §9.4 resolution)

**Per-vocabulary analysis** — what each existing enum belongs to, what it represents, and what it actually needs to do:

| Entity | Current vocabulary (TRD10, as declared) | What it represents | Required transitions | Content lifecycle? | Editorial/workflow lifecycle? | Translation lifecycle? | Overlaps another vocabulary? |
|---|---|---|---|---|---|---|---|
| `KnowledgeNode` | `draft \| pending_review \| active \| retired \| archived` | Whether the *canonical taxonomy entry itself* (an Industry/Category/Type/Reward-Program-Category/Standard-Product/Service) is currently the platform's authoritative, selectable answer for that concept | `draft → pending_review → active`; `active → retired` (superseded, `replacementNodeId` set); `retired → archived` (no longer even shown as a historical reference target, still resolvable) | **Yes — primary content lifecycle.** This is "is this node the live canonical truth," not a workflow-step tracker | Indirectly — `pending_review` names a workflow step, but the *node* being `pending_review` and a *human editorial task* being in review are two different facts (§9.2 point 2) | No — a node's own status says nothing about whether any of its translations exist or are complete | Yes — with `KnowledgeTranslation.status`'s `reviewed`, both use "review" as a concept, but for two different objects (the node's canonical meaning vs. one language's label) |
| `KnowledgeTranslation` | `draft \| reviewed \| published` | Whether *one specific language's label/description/synonyms* for a node is trustworthy enough to show a customer/business in that language | `draft → reviewed → published`; no retirement state (a translation is superseded by editing a new draft of the same `(nodeId, languageCode)` document, not by a separate retired state — §7.2's already-flagged versioning question) | No — this is not about the underlying concept's validity, only about one language's rendering of it | **Yes — this is fundamentally a translation-QA workflow status**, narrower in scope than `KnowledgeNode.status` and correctly so, since a node can be `active` in English while its French translation is still `draft` | **Yes — this is the one vocabulary that is genuinely, correctly a translation-specific concept** | Overlaps `KnowledgeNode.status`'s naming (`draft`, and conceptually `reviewed`≈`pending_review`) but governs a narrower, genuinely distinct object |
| `KnowledgeTag` | `draft \| active \| retired` | Whether a governed tag (Business/Product/Customer-Interest attribute — never Behaviour, §7.3) is currently usable | `draft → active`; `active → retired` | **Yes — the same underlying "is this the live canonical truth" question as `KnowledgeNode`**, just without an intermediate review step and without an `archived` terminal state | Weakly — tags are simpler, lower-churn objects (§7.3), so CKS's own treatment doesn't describe a review workflow for them the way it does for nodes | No | **Yes — near-total overlap with a three-value subset of `KnowledgeNode.status`** (`draft`/`active`/`retired` is literally a subset of `draft`/`pending_review`/`active`/`retired`/`archived` minus `pending_review` and `archived`) |

**Finding:** `KnowledgeNode.status` and `KnowledgeTag.status` model the **same underlying concept** (content lifecycle — is this canonical entry currently the live truth) at two different levels of granularity, and are therefore genuinely mergeable. `KnowledgeTranslation.status` models a **materially different concept** (per-language translation QA, scoped to one `(nodeId, languageCode)` pair, not to the canonical concept itself) and is not obviously the same axis as the other two, even though its value names overlap.

**Option analysis:**

| Option | Semantic clarity | Schema complexity | Implementation complexity | Invalid-state risk | Knowledge Studio implications | Migration/evolution implications |
|---|---|---|---|---|---|---|
| **A — One unified lifecycle vocabulary across all three entities** (single enum, e.g. `draft \| in_review \| approved \| published \| retired \| archived`, reused verbatim on `KnowledgeNode`, `KnowledgeTranslation`, and `KnowledgeTag`) | Lower than it looks — forces `KnowledgeTranslation` (a genuinely per-language QA concept) into the same six-value shape as content-canonicality, even though "is this node canonical" and "is this language's label reviewed" are different questions that can be true/false independently (§9.1's own example: EN `active`, FR still `draft`) | Lowest — one enum type, one migration | Lowest short-term — one validator function; but risks silently conflating two axes at the type level, which the analysis above shows are not actually the same axis | **Higher** — a single field cannot represent "node is `published` overall AND its FR translation is independently only `draft`" without an awkward reading (does the node's `published` status imply all translations are also published? It doesn't, and can't, per §10.2's own EN+FR-required-at-seed rule) | Studio would need to track two axes anyway (which node is being edited vs. which language is being translated) even if the schema only exposes one enum — pushes the real complexity into Studio's own workflow logic instead of the schema, which is where `DEC-DATA-005`'s own "terminology audit" reasoning (§9.1) suggests it does *not* belong | Any future entity needing a third distinct axis (e.g. a hypothetical tagging-QA status) would have nowhere to go without inventing a second field anyway — undermines the "one vocabulary" premise long-term |
| **B — Separate vocabularies per entity, because the entities model distinct lifecycle concepts** (keep three independently-named enums, only tidy their value sets) | Highest, if the three are actually distinct concepts — but the analysis above shows `KnowledgeNode`/`KnowledgeTag` are *not* distinct from each other, only `KnowledgeTranslation` genuinely is; keeping all three separate over-preserves a distinction that only partially exists | Highest — three enum types to define, validate, and keep from drifting further apart over time (the actual problem `DEC-DATA-005` was raised to solve) | Highest — three validators, three sets of allowed-transition logic, no shared test/validation code between `KnowledgeNode` and `KnowledgeTag` despite them modeling the same concept | Status quo risk — this is closest to today's already-flagged-as-a-problem state; does not resolve `DEC-DATA-005`, it re-confirms the problem | No consolidation benefit for Studio — it must already learn three separate vocabularies today; this option changes nothing | Guarantees the same re-divergence risk that created the `DEC-DATA-005` finding in the first place — three independently-evolving enums drift apart again over time |
| **C — A bounded shared base state (content-canonicality: `draft \| in_review \| approved \| published \| retired \| archived`) applied to `KnowledgeNode` AND `KnowledgeTag` (since the analysis above shows these two are the same concept), plus a genuinely separate, narrower `KnowledgeTranslation`-specific vocabulary (`draft \| reviewed \| published`, already correctly scoped and not needing to change) for the one entity that models a materially different concept** | **Highest** — matches the actual semantic finding above exactly: unify where the concepts are actually the same (Node/Tag), keep separate where they are actually different (Translation) | Moderate — two enum types instead of one or three, each matched to a real distinct concept, not arbitrarily split or arbitrarily merged | Moderate — one shared base-state validator (Node/Tag) plus one translation-QA validator; less duplication than Option B, no forced conflation like Option A | **Lowest** — no axis is forced to carry two independent facts; a node can be `published` while its FR translation is still `draft`, expressed cleanly as two fields on two different documents, exactly matching real-world need (§9.1/§10.2) | Studio's workflow already naturally operates on two axes (editing the canonical node vs. translating it) — this option's schema matches Studio's actual workflow shape rather than fighting it | Clean evolution path: if a fourth entity is ever added that's conceptually "canonical content" (e.g. a future `KnowledgeSuggestion` once approved becomes a `KnowledgeNode`), it reuses the shared base-state enum directly; if a fifth entity is ever added that's genuinely translation-like, it reuses the translation-QA enum; no forced third axis needed unless a genuinely third concept appears |

**Engineering analysis (this is the brief that led to §9.4's adopted resolution, not a standalone recommendation left open):** the per-vocabulary analysis above empirically found `KnowledgeNode` and `KnowledgeTag` model the same concept and should share one vocabulary; `KnowledgeTranslation` is a different concept and should keep its own — i.e., **Option C**. Option A would force a real semantic distinction to disappear at the schema level (paid for later in Studio's workflow logic, not eliminated); Option B preserves the exact three-way drift `DEC-DATA-005` was raised to solve. §9.4 records the adopted enum shapes, which **depart from the six-value candidate shown in the option table above in one respect**: independent re-verification against the Knowledge Studio pipeline (§9.4) found no operationally distinct meaning between `approved` and `published` for the canonical node/tag specifically, so the adopted canonical enum is five-valued, not six — see §9.4 for the full reasoning.

**`KnowledgeTag.translations` storage-shape question — classified and disposed as its own item, not left buried:**

This is **(B) a separate implementation/schema decision, not part of `DEC-DATA-005`'s status-vocabulary question** — the two questions are adjacent (both touch `KnowledgeTag`'s schema) but are not the same decision: `DEC-DATA-005` is about which *status enum* `KnowledgeTag` uses; this question is about whether `KnowledgeTag`'s *localization* uses an inline `Record<string, string>` map (as TRD10 §10.7.3 currently declares) or the same separate-collection `KnowledgeTranslation` shape `KnowledgeNode` already uses (§7.2). Comparing directly against the approved architecture: `KnowledgeNode`'s localization model (§11, §7.2) is the authoritative, only-designed-once localization mechanism in this document — a separate `KnowledgeTranslation` document per `(nodeId, languageCode)`, with its own review/publish workflow, `synonyms`, and fallback behavior. `KnowledgeTag.translations: Record<string, string>` is a **second, structurally different, undocumented-review, no-fallback-defined, no-synonym-supporting localization mechanism for the same platform** — it duplicates the canonical translation model's *purpose* (per-language labels) without reusing its *design* (review workflow, fallback, synonyms), which is a genuine inconsistency, not a stylistic preference. **Disposition (recorded as an `ENGINEERING SCHEMA CLARIFICATION`, per the Decision Register entry's own notes field — not a second `DEC-DATA-005`-style Founder/Engineering-Lead register decision, since it is a schema-shape detail this design package is authorized to resolve directly): `KnowledgeTag` shall be restructured, at `ENG-P3-001A` implementation time, to reuse `KnowledgeTranslation` (or an entity-agnostic generalization of it, e.g. keyed by `(entityType, entityId, languageCode)` rather than only `(nodeId, languageCode)`) rather than retain its own inline map** — one authoritative localization representation for the entire Commerce Knowledge domain, not two. **No schema is altered by this document itself** — this is the design-level disposition `ENG-P3-001A` implements; it does not require a further Decision Register entry beyond the note already recorded in `DEC-DATA-005`'s own entry.

### 9.4 `DEC-DATA-005` — RESOLVED: Final Enums, Transition Matrices, and Reference-Resolution Rules

**Status: RESOLVED (Engineering Lead, 2026-08-20, `decision-register.md` `DEC-DATA-005`).** This subsection is the adopted, binding disposition — not a further recommendation. Semantics were re-derived directly from TRD10 §10.7.1–§10.7.3 and `docs/03-standards/knowledge-studio.md`'s "Knowledge Pipeline" during this disposition, confirming (not merely assuming) the §9.3 analysis.

**Re-derivation confirmed, no contradicting source found:** `KnowledgeNode` and `KnowledgeTag` both represent "is this canonical taxonomy entry currently the platform's authoritative, selectable truth for this concept" — nothing in CKS, Knowledge Studio, or TRD10 gives `KnowledgeTag` a materially different lifecycle question than `KnowledgeNode`; both are simply different *kinds* of governed reference data (a hierarchical node vs. a flat reusable tag) sharing the identical canonicality question. `KnowledgeTranslation` represents a materially different question — "is this specific language's rendering of a node trustworthy enough to show" — scoped to one `(nodeId, languageCode)` pair, independent of the node's own canonicality. No source found contradicts this two-lifecycle model.

**Final canonical Commerce Knowledge content lifecycle** (`KnowledgeNode.status`, `KnowledgeTag.status` — one shared enum):

```
"draft" | "in_review" | "active" | "retired" | "archived"
```

**Why `approved`/`published` are not separately retained (re-derived, not assumed):** the Knowledge Studio pipeline places `Approved` before `Translated`/`Tagged`/`Indexed`/`Published` — i.e., "governance has confirmed this concept is correct" precedes "translation/tagging/indexing are complete." Re-verified directly against this ordering: nothing in the governing sources gives the *node itself* an operationally distinct, separately-consumed fact between "approved" and "published" — a node's own canonical fields (hierarchy position, `canonicalName`, `nodeType`) do not change between those two pipeline steps; what changes is the *completeness of derived artifacts* (translations existing and being published, `searchTerms` populated) that are already modeled as separate facts on `KnowledgeTranslation` and `KnowledgeNode.searchTerms` respectively (§9.2 point 2). Whether a node is actually selectable by a business is therefore a **combined read** — `KnowledgeNode.status == "active"` AND the requested (or fallback) language's `KnowledgeTranslation.status == "published"` — not a second node-level status value. Retaining both `approved` and `published` as node-level enum values would create a state no consumer ever needs to distinguish, which is exactly the kind of unobservable redundancy Option A's analysis (§9.3) warned against for the opposite (over-unification) direction. `pending_review` (TRD10's current wording) is renamed `in_review` to match the terminology audit's own recommended wording (C.15).

**Why `retired` and `archived` remain distinct (re-derived, not manufactured):** TRD10 §10.24 ("Soft Deletion and Archival") requires the platform to maintain a six-way distinction (active/inactive/suspended/retired/closed/archived) consistently, and §10.25 classifies "knowledge versions" under Permanent/Long-Term retention. Applied to Commerce Knowledge: `retired` = superseded by a newer node (`replacementNodeId` set), still surfaced in Knowledge Studio's own management/audit views and still forward-resolving for existing references; `archived` = fully at rest, removed from default management/search surfaces, retained only for historical/audit resolution per DAP-010 ("Archive, Do Not Erase" — never deleted). This is a genuine, sourced, platform-wide-consistent distinction, not one invented solely for Commerce Knowledge.

**Final translation-readiness lifecycle** (`KnowledgeTranslation.status` — separate, narrower enum, unchanged from TRD10 §10.7.2):

```
"draft" | "reviewed" | "published"
```

Confirmed distinct operational meanings: `draft` = a translator has entered text, not yet checked; `reviewed` = a second party has confirmed linguistic/terminological accuracy, not yet live; `published` = live and shown to customers/businesses requesting that language. **Confirmed compatible with the required mixed-state example:** `KnowledgeNode.status == "active"` while its English `KnowledgeTranslation.status == "published"` and its French `KnowledgeTranslation.status == "draft"` or `"reviewed"` is a valid, expected state — the node's own canonicality is never invalidated by an incomplete translation in a non-required language. **Fallback for English-primary/French-supported MVP:** per §11 (unchanged, no additional languages introduced), a read for a language whose `KnowledgeTranslation` is not `published` falls back to the English `published` translation — this is the existing i18next-consistent fallback rule, now explicitly tied to the resolved `published` status value rather than to a placeholder.

**Canonical Commerce Knowledge transition matrix** (`KnowledgeNode`/`KnowledgeTag`):

| From | Allowed next state(s) | Notes |
|---|---|---|
| `draft` | `in_review` | Content is being prepared, unavailable for normal platform selection |
| `in_review` | `active`, `draft` | `active`: passed governance review, now selectable. `draft`: rejected back for revision — this backward transition is Knowledge Studio's (`ENG-P3-003`) own editorial workflow-engine concern to enforce (who may trigger it, review-queue mechanics); the state model only confirms it is a valid state, not who may invoke it |
| `active` | `retired` | Superseded by a newer/replacement node; `replacementNodeId` must be set at this transition (§12) |
| `retired` | `archived` | Moved fully to historical/audit-only status; no longer surfaced in default management/search views |
| `archived` | *(none — terminal)* | No transition out. **Terminal states never return to `active`.** A correction to retired/archived content is made by creating a new node (a new version/replacement, `replacementNodeId` chaining forward) — never by reversing the lifecycle state of the old one. This preserves `RewardProgramVersion`'s and `Business`'s ability to keep resolving old references (§12) without the old node's meaning silently changing underneath them. |

**Translation-readiness transition matrix** (`KnowledgeTranslation`):

| From | Allowed next state(s) | Notes |
|---|---|---|
| `draft` | `reviewed` | A reviewer confirms accuracy |
| `reviewed` | `published`, `draft` | `published`: now live. `draft`: sent back for correction (again, Studio's own workflow-engine concern to enforce, not this document's) |
| `published` | `draft` | A **new** draft of the **same** `(nodeId, languageCode)` document supersedes the published text (§7.2's already-noted versioning treatment — a translation is corrected by re-entering `draft`/`reviewed`/`published` on the same document, not by a separate retired state; TRD10 §10.7.2 declares no retirement state for translations, confirmed still correct, no gap found) |

**New-reference eligibility (which states may be selected by a new `Business.primaryCategoryId`/`businessTypeId` write, or a new `RewardProgramVersion.qualifyingKnowledgeNodeIds` entry once Phase 4 exists) — corrected to separate two independent questions, not conflate them (F3 correction, independent review, 2026-08-20):**

- **A. Referential validity** (can the write structurally target this node at all): governed **solely** by `KnowledgeNode.status == "active"` and a matching `nodeType`. `draft`, `in_review`, `retired`, and `archived` nodes are never eligible for a **new** reference. `KnowledgeTranslation.status` plays **no role** in this gate — TRD10 §10.7.1/§10.7.2 declare `KnowledgeNode.status` and `KnowledgeTranslation.status` as independent fields on independent documents, and no governing source (CKS, Knowledge Studio, TRD10) states that a language's translation-review progress determines whether the underlying canonical classification reference is valid.
- **B. Display/selection availability** (what label a UI may render for that node in a given language): governed separately by `KnowledgeTranslation.status == "published"` in the requested language, falling back to the English `published` translation per §11. This determines what a business *sees* when choosing a category — never whether an already-chosen `active` node is a valid reference.

An `active` `KnowledgeNode` whose French translation is still `draft`/`reviewed` (English `published`) remains a fully valid reference for a new `Business.primaryCategoryId`/`businessTypeId` write; only the node's own `status` gates the write. This corrects the prior wording's parenthetical, which read as folding (B) into (A) as a single combined eligibility test — an artifact of loose phrasing, not a requirement traceable to any governing source.

**Existing-reference resolution (which states remain resolvable for references already made):** `active` and `retired` nodes both resolve normally for an existing reference (retirement never breaks an existing `Business.primaryCategoryId` or future `RewardProgramVersion` reference — §12, §15's "existing references tolerate retirement" rule, restated here as now-resolved rather than pending). `archived` nodes still resolve (never deleted, DAP-010) but are understood to be reached only through the increasingly rare path of a very old reference or explicit historical/audit lookup, not through normal browse/search. A retired or archived node's `replacementNodeId`, if set, should be followed by any read that wants the *current* canonical answer for that concept, while the original reference itself is never silently rewritten.

**Terminal-state reversibility:** confirmed **no** terminal state (`archived` for the canonical lifecycle; there is no terminal state distinct from `published` for translations, since a published translation can still move back to `draft` on the *same* document — this is not a terminal state, it is a correction cycle) ever reverses into an earlier lifecycle position for the *same document*. Any correction to retired/archived canonical content requires a **new** `KnowledgeNode`/`KnowledgeTag` document (a new version, chained via `replacementNodeId`) — never an `archived → active` or `retired → active` transition on the existing document. This was confirmed, not assumed: no source (CKS, Knowledge Studio, TRD10) describes un-retiring or un-archiving a canonical entry; every source describing correction/supersession (§12, PRD6 §6's Reward Program precedent) describes forward-chaining to a new version, never reactivating an old one.

## 10. Seed-Data Model

### 10.1 Purpose and boundary

**FOUNDER DECISION RECORDED — `DEC-CKS-001`, APPROVED (this document, dated disposition below).** `ENG-P3-001`'s initial Commerce Knowledge seed dataset **shall be bounded to** the sectors, Business Categories, Business Types, and minimum Standard Product/Service knowledge required for the Burundi pilot and the approved initial MVP use cases. `ENG-P3-001` is **not required** to build an exhaustive Burundi, East African, or African taxonomy before launch. This confirms, as the final disposition, the option this document had previously only recommended (§26, prior revision): seed exactly enough taxonomy to support the launch-market business categories PRD3 §7 itself already names as examples (Salon, Barber, Coffee Shop, Restaurant, Pizza, Burger, Bakery, Car Wash, Laundry, Spa, Gym, Vehicle Service, Juice Bar, Retail, Other) plus their obvious parent Industries and a small starter Reward Program Category set (Haircuts, Coffee, Pizza, Burger, Car Wash, Laundry, Gym Visit — CKS Part VII's own examples) — the Commerce Knowledge Standard's own broader example lists (CKS Parts IV–IX) remain illustrative, not a closed target list this package must fully populate.

**Expansion requirement (Founder-mandated, binding on the architecture, not merely a recommendation):** expansion after MVP — including future Rwanda or additional-sector expansion — **shall be additive, centrally governed, versioned, and compatible with the same schema**; the architecture must not make later expansion require a schema redesign. This is already structurally satisfied by this document's existing design, not a new obligation requiring new mechanism: `KnowledgeNode`'s variable-depth hierarchy (TRD10 §10.7.1's "shall not hardcode exactly three taxonomy levels," §7.1.1's adjacency rule) accepts new nodes at any existing level without a schema change; new `Industry`-level roots (e.g., a future Rwanda-specific Industry, if the taxonomy is ever partitioned by market — itself a future, not-yet-open, question) or new `business_category`/`business_type`/`standard_product`/`standard_service` nodes under existing Industries are both additive `knowledgeNodes` writes, never a migration; the seed manifest (§10.3) is itself designed to be extended, not replaced, by a later expansion pass (a second, later-dated manifest entry set, appended to the same versioned mapping); and `ENG-P3-003` (Knowledge Studio, once built) is precisely the mechanism Founder Decision `DEC-CKS-002` (below) anticipates for this exact ongoing, centrally-governed expansion — not a one-time seed job's responsibility. **No schema element in §7/§20 needs to change to support this Founder decision** — the decision confirms scope, it does not require new architecture.

### 10.2 Inclusion rules

1. Only nodes reachable from PRD3 §7's own named launch business categories (plus their necessary Industry parents) are included at seed time.
2. A seeded node's `status` must be `active` (the resolved §9.4 value meaning "usable now") — never `draft`/`in_review` — a business must be able to select it at onboarding immediately.
3. Every seeded node has both required EN and (per §11) FR `KnowledgeTranslation` records — the seed loader must not leave a node without its required-language translations, since PRD3 §7 requires onboarding to work "immediately."
4. Tags are seeded minimally (a small Business-Tag/Product-Tag starter set from CKS Part IX's own examples) — Behaviour tags are never seeded (§6, §7.3 — they are platform-computed, never manually populated, so a seed script populating them would violate CKS Part IX directly).

### 10.3 Stable IDs

**ENGINEERING DESIGN PROPOSAL**, consistent with TRD10 §10.5's opaque-id requirement: seed-time document ids must still be **stable across repeated seed-script runs** (idempotent re-seeding must update, not duplicate, the same node) without being *sequential* or *semantically meaningful* (§12 elaborates the identifier model). Recommendation: the seed script generates its ids exactly once (e.g., via the same opaque-id generation the rest of the platform uses) and persists a **seed manifest** (a versioned, checked-in mapping of `slug → id`, checked into the seed script's own source, not the runtime schema) so re-running the seed script resolves to the same ids deterministically — the *manifest* is what's stable and re-runnable, not the id-generation algorithm itself. This avoids two anti-patterns: (a) using `slug` as the document id (would violate TRD10 §10.5's opacity requirement if `slug` is also a customer-facing, potentially-renamed label), and (b) regenerating random ids on every seed run (would break idempotency and orphan any already-issued references).

### 10.4 Idempotent loading

The seed script must be safely re-runnable: re-running it against an environment that already has the seed data must be a no-op (or a controlled update, §10.5) — never a duplicate-creation. This reuses the same idempotent-write discipline already established platform-wide (`checkAndReserveIdempotencyKey`, `ENG-P2-002B`'s transactional reservation-doc pattern) — no second idempotency mechanism is proposed.

### 10.5 Update strategy

**ENGINEERING DESIGN PROPOSAL, deferred detail:** independent of `DEC-DATA-005`'s now-resolved status vocabulary (§9.4), the separate translation-versioning question (§7.2, still open, `ENG-P3-001A`'s to confirm) affects this only in degree — a re-run of the seed script against an environment where the seed data has since been edited by Knowledge Studio (`ENG-P3-003`, once it exists) must not silently clobber editorial changes. Recommendation: the seed script is a **first-run/bootstrap-only** tool for environments with no existing Commerce Knowledge data (checked via a manifest-version marker document), not a continuously-reconciling sync tool — once Knowledge Studio exists and has made any edit, the seed script should refuse to re-apply without an explicit override flag. This is a recommendation for a future implementation package to confirm, not a resolved decision.

### 10.6 Duplicate prevention

The seed script itself must not create duplicate nodes for the same canonical concept (e.g., two "Coffee Shop" business-category nodes) — enforced structurally by the manifest (§10.3): each canonical concept has exactly one manifest entry, one id, ever.

### 10.7 Environment/test-fixture separation

**ENGINEERING DESIGN PROPOSAL**, following the platform's existing test-convention precedent (emulator tests throughout `functions/src` never depend on production seed data — every emulator test in the codebase creates its own fixtures inline): the launch seed dataset (§10.2) is an **operational deployment artifact** for staging/production environments, never a test fixture. Emulator/unit tests for Commerce Knowledge domain logic must construct their own minimal in-test `KnowledgeNode` fixtures (matching every other domain's existing test convention — e.g., `businessRepository.emulator.test.ts` never depends on any seeded business), not depend on the launch seed script having run. This keeps test suites independent of seed-data content changes.

## 11. Localization Model

**GOVERNED REQUIREMENT** (CKS Part XI current-scope reading, TRD13, `I18N-001` as merged): English is the primary/required language; French is the required-at-launch second language (`apps/web/src/i18n/config.ts`: `SUPPORTED_LANGUAGES = ["en", "fr"]`, `DEFAULT_LANGUAGE = "en"`). Kirundi/Swahili/Kinyarwanda are **not** in current implementation scope — CKS Part XI's and Knowledge Studio's "planned" language lists are a documentation-currency discrepancy relative to the actual implemented `I18N-001` scope, flagged (§6) but not resolved by this document.

- **Canonical + translated labels:** `KnowledgeNode.canonicalName` is an internal/working name (not customer-facing); every customer-facing label comes from a `KnowledgeTranslation` record for the requested language (§7.2).
- **Fallback behavior:** **ENGINEERING DESIGN PROPOSAL**, consistent with `apps/web/src/i18n/config.ts`'s own `baseLanguage()` fallback pattern (any unsupported/unrecognized language code resolves to `DEFAULT_LANGUAGE`, English): a Commerce Knowledge read for a language with no published `KnowledgeTranslation` (e.g., FR requested but not yet translated for a newly-suggested node) must fall back to the EN translation, never render a blank label or a raw `canonicalName`/internal key to a customer or business user. This mirrors i18next's own resource-fallback convention already configured in `apps/web`.
- **No French-only nodes**: per §10.2 rule 3, every seeded node has both EN and FR translations — French-only or English-only seed nodes would violate the "required at launch" reading of both languages for the seed dataset specifically (Knowledge Studio-authored *future* suggestions, post-seed, may exist briefly in an EN-only "not yet translated" workflow state — that is a `ENG-P3-003` workflow concern, not a seed-data rule).

## 12. Identifier/Reference Model

**GOVERNED REQUIREMENT** (TRD10 §10.5, platform-wide, already governs this): IDs are opaque and non-sequential. Applied to Commerce Knowledge specifically:

- **Stable semantic identity is never the mutable label.** `KnowledgeNode.canonicalName`/`KnowledgeTranslation.displayName` may be edited (a translation improvement, a rename) without changing the node's identity — every reference (`Business.primaryCategoryId`, `RewardProgramVersion.qualifyingKnowledgeNodeIds`) is by opaque `id`, never by name or `slug`. This is the same principle `ENG-P2-002-DESIGN-001` §5.3 applied to `businessCode` (never encode meaning that could change into the identifier).
- **`slug` is a non-authoritative convenience field** — useful for URLs/debugging, never used as a foreign key, exactly analogous to how `businessCode` is explicitly "not... a URL slug... or lookup key" (`ENG-P2-002-DESIGN-001` §24 FD-3) even though it superficially looks like an identifier.
- **Retirement uses forward-reference, not deletion.** TRD10 §10.7.1's already-declared `replacementNodeId?: string` on a `retired`/`archived` node lets old references (e.g., a `RewardProgramVersion` created two years ago, referencing a since-retired Standard Product) resolve forward to the current canonical node without rewriting the historical reference — this is the Commerce Knowledge analogue of Knowledge Studio's own "Version Without Breaking History" principle and of PRD6 §6's "Historical Loyalty Cycles must continue referencing the version that governed them" rule for Reward Programs. **`ENG-P3-001` must never delete a `KnowledgeNode` document that any `RewardProgramVersion` or `Business` has ever referenced** — retirement (status transition, §9) is the only removal mechanism, matching TRD10 §10.2 DAP-010 "Archive, Do Not Erase" (platform-wide principle).

## 13. Authorization Model

### 13.1 Mapping onto the existing catalogues

**Finding: no new permission is structurally required for `ENG-P3-001`'s own scope (seed-loading and read paths).**

- **Seed-loading** is an **operational/deployment-time script**, not a runtime-authorized command — it runs with elevated (service-account/Admin SDK) trust outside any `businessId`-scoped or customer-scoped authorization context, exactly as `ENG-P2-002-DESIGN-001` §10.3's bootstrap-authority reasoning already establishes for business creation's own pre-permission operations (structurally analogous: an operation with no meaningful "business context" to check permission against). It requires **no** `ordinaryPermissionCatalogue.ts`/`sensitivePermissionCatalogue.ts` entry.
- **Reads** (a business selecting a category during onboarding, a future Reward Program screen listing Standard Products) are **published reference data** — every authenticated business/customer context may read published `KnowledgeNode`/`KnowledgeTranslation`/`KnowledgeTag` documents. This requires no permission check at all (analogous to how the platform's own governed reference lists — e.g., `errorCategories.ts`'s closed set — are readable by construction, not gated); it does, however, require the Firestore Rules layer (not touched by this document, §1) to allow read of `active`/`published`-status Commerce Knowledge documents to any authenticated principal while denying writes to everyone except the trusted server process (`DEC-DATA-001`'s "server-only authoritative writes," already-`CONFIRMED`, platform-wide).

### 13.2 Where a new permission **would** be needed — flagged, not added

**FOUNDER-ADJACENT ENGINEERING PROPOSAL (not implemented, not catalogued):** if/when `ENG-P3-003` (Knowledge Studio) builds an actual editorial workflow (suggest/review/approve/publish/translate), that workflow's actors are **platform editors/administrators**, not business Owner/Manager/Staff roles. This is a structurally different authority class than either existing catalogue models:

- `ordinaryPermissionCatalogue.ts` and `sensitivePermissionCatalogue.ts` are **both** scoped to the `(userId, businessId)` business-role evaluator (`ENG-P2-004`) — every entry's `roleDefaults`/`defaultState` is expressed in terms of Owner/Manager/Staff.
- A Knowledge Studio editor is not a member of any business at all — there is no `businessId` in scope for "approve this taxonomy suggestion."
- **Recommendation:** Commerce Knowledge editorial authorization, if built, should follow the same precedent `ENG-P2-002-DESIGN-001` §10.2 already established for platform-administrator actions on the Business aggregate — "out of `ENG-P2-004`'s Business-role evaluator scope entirely," using the Administration domain's own authority path (TRD18 §18.8–18.9, referenced there for admin actions) rather than inventing a business-role permission for a non-business-scoped action. This is **not** a gap in `ENG-P2-004`'s frozen catalogue that needs correcting — it is a different authorization domain that `ENG-P2-004` was never meant to cover.
- **Business selection/association authority (§15.1's finding applied):** since §15.1 concludes no new Business-owned association entity is required — `RewardProgramVersion.qualifyingKnowledgeNodeIds`/`businessDisplayProductNames` already carries this, owned by `ENG-P4-001` — no new authority question is introduced by this document either. For the record, had a new entity been required, the correct precedent would have been the same shape `Business.updateProfile`-equivalent commands already use today: ordinary, non-catalogued authenticated-business-context authorization (a Business writing its own selection is analogous to a Business updating its own profile, not a sensitive/elevated action) — not a new permission identifier. This reasoning is recorded for `ENG-P4-001`'s own future design to confirm or correct, since that package, not this one, will actually define `RewardProgramVersion`'s write authorization.
- **This document does not propose a specific permission identifier, string, or catalogue entry.** It flags that `ENG-P3-003`'s eventual editorial-authorization design is a **future, separately-authorized correction** — most plausibly an Administration-domain (Capability 8, `ENG-P12-001`/`002`) concern, or a new, disjoint "platform editor" catalogue analogous in *shape* (not content) to the existing two, not an extension of either existing business-role catalogue. Whichever shape is chosen belongs to `ENG-P3-003`'s own design package, following the same "amend via the normal documentation-governance change process, don't reopen the frozen catalogue" discipline `ENG-P2-004-DESIGN-001` §3.9 already established.

## 14. Event Model

**Finding: no Commerce Knowledge event is required by `ENG-P3-001`'s own scope.** Evaluated against the existing outbox convention (`AUTH-08`, `ENG-P2-002B`'s `BusinessCreated`, `ENG-P2-004C`'s permission-audit events — every one of these is emitted because a **runtime, request-driven** command mutated authoritative state on behalf of an identifiable actor):

- **Seed-loading is a one-time/idempotent deployment operation**, not a customer/business-facing command — there is no "actor" whose action needs to be audited or whose downstream systems need to react to it in real time, the same way there is no `CustomerRegistered`-style event for, say, running a database migration. **No `KnowledgeNodeSeeded` event is proposed.**
- **A future `ENG-P3-003` editorial workflow** (a human editor approving/publishing a taxonomy change) **would** plausibly warrant events (e.g., `KnowledgeNodePublished`) for the same reason `ENG-P2-004C` audits every sensitive-permission decision — but designing that event is `ENG-P3-003`'s scope, not `ENG-P3-001`'s, since `ENG-P3-001` has no runtime write path for a human actor to trigger.
- **No unjustified event is invented here.** This finding follows the same "reuse, don't duplicate; don't invent an event with no consumer" discipline `ENG-P2-002-DESIGN-001` §14 already applied ("only events actually required by already-governed architecture — no invented catalogue").

## 15. Business Domain Integration (mapping onto completed `ENG-P2-002`)

- **`Business.primaryCategoryId` (required) and `Business.businessTypeId` (optional)** (TRD10 §10.6.3, implemented `functions/src/domains/business/models/business.ts`) are the only integration points. **No redesign of `ENG-P2-002` is proposed.**
- **This is Business-level, not Branch-level.** `BusinessBranchDocument` (TRD10 §10.6.5-equivalent, `ENG-P2-002-DESIGN-001` §5.3's Founder-approved MVP shape: `id`, `businessId`, `displayName`, `countryCode`, `city`, `address`) has **no** category/type/product field at all — confirmed by direct read of `functions/src/domains/business/models/businessBranchDocument.ts`. Since MVP is single-branch-per-business (`DEC-SUB-005`, `CONFIRMED`) and the branch inherits no independent commercial-classification concept, Commerce Knowledge references belong on the `Business` aggregate, consistent with where they are already declared in TRD10.
- **What `ENG-P3-001`/a future `ENG-P3-001A` must add, additively:** validation that a `Business.primaryCategoryId`/`businessTypeId` value, once supplied, actually resolves to an existing, `active`-status `KnowledgeNode` of the correct `nodeType` (`business_category`/`business_type` respectively) — referential validity only, per §9.4's corrected reference-validity/display-availability separation; the referenced node's `KnowledgeTranslation` status is irrelevant to this validation. Today (§4), `createBusiness`/`updateBusinessProfile` perform **no such check** — this is a **currently-open validation gap**, not a defect introduced by `ENG-P2-002` (which correctly deferred it, per its own design document's exclusion table, §2.2 of this document). Closing this gap is additive: it does not change `Business`'s own schema or `ENG-P2-002`'s command surface, only adds a cross-domain read-and-validate step, most plausibly inside `functions/src/domains/business/services/businessProfileCommand.ts` and the bootstrap flow, consuming a new Commerce Knowledge read-only repository function (§20) — a small, bounded, forward-compatible addition, not a redesign. This validation belongs inside `ENG-P3-001C` (§28), invoked from the existing Business command — it is an additive read-only cross-domain check, not a redesign of Business Identity, consistent with `ENG-P2-002`'s own already-closed scope.
- **What happens if a referenced category is later deprecated/retired:** an existing `Business.primaryCategoryId` that references a since-`retired` `KnowledgeNode` **still resolves** — retirement never deletes the node (§12's `replacementNodeId` forward-reference/"Archive, Do Not Erase" mechanism, TRD10 §10.2 DAP-010). A read validating an *existing* Business's reference should resolve it (following `replacementNodeId` if present) rather than treating a retired-but-extant node as a broken reference; only a **new** `Business.primaryCategoryId`/`businessTypeId` write should be required to target a currently-`active`/`published` node. This asymmetry (existing references tolerate retirement; new writes do not) is the same rule `RewardProgramVersion` already relies on for its own historical references (§12, PRD6 §6) and is stated here as a **required integration contract** for `ENG-P3-001C` to implement — not implemented by this document.

### 15.1 Business ↔ Standard Product/Service Selection — Investigated, No New Entity Required

**Question investigated:** beyond `primaryCategoryId`/`businessTypeId` (Business Category/Type), does a Business need its own persisted record of which Standard Products/Services it offers, independent of any specific Reward Program, and if so, where does a business-specific display/custom name for that offering live?

**Finding, with direct source citations: no new entity is required. PRD3 and TRD10 already resolve this — product/service selection happens exclusively at Reward-Program-creation time, not as a separate Business-level onboarding step.**

1. **TRD10 declares no `businessOffering`/`businessProduct`/`businessCatalogue`-shaped collection anywhere.** A repository-wide grep of `docs/02-technical/trd/10-firestore-data-architecture.md` for `businessOffering`/`businessProduct`/`businessCatalogue` returns zero collection declarations (the one incidental match, `businessProductLabel?: string` at TRD10 §10.10.1, is a field on `PurchaseRecordDocument` — a free-text label recorded per purchase, not a business-level catalogue entity). The only place a Business's product/service selection is persisted, platform-wide, is `RewardProgramVersion.qualifyingKnowledgeNodeIds`/`standardRewardNodeId` and `businessDisplayProductNames` (TRD10 §10.9.2, already cited in §4/§20).
2. **PRD3 itself confirms product selection is a Reward-Program-creation-time act, not a separate onboarding step.** PRD3 §14 ("Reward Program Creation") states: "Every business must create at least one active Reward Program before recording purchases. A Reward Program contains Product Name, Description, Category, Normal Price, Reward Rule, Reward Value, Status..." — this is the one and only place PRD3 names a business declaring what it sells. PRD3 §15 ("Product Categories") states: "The platform shall not prescribe products. Instead businesses define their own," with examples ("Premium Haircut," "Large Cappuccino," "Medium Pizza") that read directly as Reward-Program product names, not a separate catalogue. PRD3's own Onboarding Checklist (§12) lists "First Reward Program" as the relevant checklist item — there is **no separate "select your products/services" checklist item**. This directly confirms the task's second, simpler hypothesis: product/service selection is deferred to Reward-Program-creation time via the already-declared `qualifyingKnowledgeNodeIds`, not a new Capability-3/`ENG-P3-001`/`002` concern.
3. **`CDR-001`'s own Phase 3 exit criteria (`engineering-implementation-programme.md:230`) confirm the same boundary**: "a business can complete onboarding without creating uncontrolled categories; Knowledge Studio can manage launch taxonomy; English and French labels display correctly; missing-option suggestion works" — this names category/taxonomy governance only. It does **not** name "a business's product/service selection persists," because that persistence is `RewardProgramVersion`'s schema (`ENG-P4-001`, Phase 4/Capability 4), a different work package entirely, already excluded from this document's scope (§2.2).
4. **Business-specific display name**: `businessDisplayProductNames` (TRD10 §10.9.2) is declared **only** as a field on `RewardProgramVersion`, alongside `qualifyingKnowledgeNodeIds` — there is no evidence anywhere in TRD10/PRD3 of an independent, Reward-Program-agnostic place a Business names its own products. Given finding 2 above (PRD3 never separates "declare what you sell" from "create a Reward Program"), this is not an oversight to correct — it is the intentional shape: a business's display name for a Standard Product exists precisely because, and precisely when, it creates a Reward Program using that product.
5. **Not on `BusinessDocument`, no new association entity**: consistent with 1–4, no field is added to `BusinessDocument` and no new `businessOfferings`-style collection/subcollection is proposed. `RewardProgramVersion` already is the Business-owned association entity for "what does this Business sell" — it is simply owned by `ENG-P4-001`, not `ENG-P3-001`.
6. **Business-level, not Branch-level**: `RewardProgramVersion` carries `businessId`, not a branch id (TRD10 §10.9.2) — consistent with §15's own finding that Commerce Knowledge references are Business-level given MVP's single-branch-per-business shape (`DEC-SUB-005`, `CONFIRMED`).
7. **No exclusivity/locking mechanic exists or is implied**: nothing in TRD10 §10.7/§10.9 gates a `KnowledgeNode` to one referencing Business — `qualifyingKnowledgeNodeIds` is a plain `string[]` on each Business's own `RewardProgramVersion`, with no reservation/uniqueness constraint against the node itself. Different Businesses independently selecting the same global Standard Product (e.g., two unrelated coffee shops both referencing the "Coffee" `standard_product` node) is structurally unremarkable and already implied by "one taxonomy platform-wide, businesses select not create."

**Consequence for the Capability-3 outcome trace (§18 below) and the sub-package decomposition (§28):** because no new entity is required, neither §18's `ENG-P3-002` consumer contract, §20's Firestore model, nor §28's three-sub-package decomposition needs to change to accommodate one. §28's `ENG-P3-001C` scope (Business-reference validation) is unaffected — it validates `primaryCategoryId`/`businessTypeId` only; the separate, already-declared `RewardProgramVersion` validation belongs to `ENG-P4-001`, not `ENG-P3-001C`, since `RewardProgramVersion` doesn't exist yet and is out of Phase 3 entirely.

## 16. Staff/Permission Integration — Noting the Missing Callable-Transport Deferral

**Confirmed by direct inspection of `functions/src/index.ts`:** the file wires `onCall` callables for Authentication (`authenticate`, `linkAuthenticationProvider`, `unlinkAuthenticationProvider`, `recoverAuthenticatedIdentity`) and Business (`createBusiness`, `updateBusinessProfile`, `updateBusinessBranchProfile`, `submitBusinessForVerification`, `closeBusiness`) — but **zero** `onCall`/`onRequest` exports exist for any `ENG-P2-003` (Staff Membership) command. The INVITE/REVOKE/ACCEPT/SUSPEND/REACTIVATE/REMOVE/role-change/permission-override commands (`functions/src/domains/permissions/service/*.ts`) exist fully at the domain-command layer, tested against the real Firebase Emulator Suite, but have **no HTTPS/callable transport wired** — a frontend cannot invoke any of them today.

**This document does not attempt to close that gap.** It is explicitly out of `ENG-P3-001`'s scope (Commerce Knowledge has no dependency on staff invitation working end-to-end) and is not this package's to solve. It is noted here only because `ENG-P3-002` (business onboarding flow, which plausibly wants to invite staff during onboarding per PRD3 §5 Step 7) will discover the same gap and should not re-investigate it from scratch — the transport layer for `ENG-P2-003` remains a **separately-authorized, already-known gap**, most plausibly closed by a bounded `ENG-P2-003`-family correction package before or alongside `ENG-P3-002`.

## 17. Search Boundary — `DEC-TECH-008`

`DEC-TECH-008` (decision-register.md:932-942): *"Confirm Firestore-backed taxonomy search + internal filtering for MVP (dedicated search provider deferred), with the abstraction interface still created."* Status: `OPEN_ENGINEERING`, owner: Engineering Lead, required by Phase 3 (this phase), blocks: onboarding search. Recommended direction already on record: **(a) Firestore-backed (recommended)** over (b) a dedicated provider now.

**Finding: MVP can proceed without a dedicated search provider.** Reasoning:

1. TRD14 §14.2/§14.3 (SAP-001 "Structured Knowledge Before Free Text") already establishes that search is *structured-taxonomy-first* — a business onboarding screen needs a dropdown/searchable list over a few hundred seeded nodes (§10.1's bounded seed scope), not full-text relevance ranking over a large corpus. A Firestore query filtered by `nodeType`/`parentId`/`status` plus simple client-side or `array-contains` matching against `searchTerms`/`synonyms` is sufficient at this scale.
2. `DEC-TECH-008`'s own recommendation already anticipates this — "search-domain abstraction confirmed; provider deferred unless proven necessary" — meaning the engineering-level position is already leaning toward exactly the finding above; this document's own analysis is consistent with, not contradictory to, the existing recommended direction.
3. **This document does not itself dispose `DEC-TECH-008`** (Engineering-Lead-owned, not this package's to resolve) — it confirms the *architectural implication* for `ENG-P3-001` specifically: `ENG-P3-001`'s own read-repository layer (§20) should expose a narrow query interface (e.g., "list active nodes by type and parent," "search nodes by term within a type") behind a small abstraction seam, so that if `DEC-TECH-008` is later disposed toward a dedicated provider, only the repository's internal implementation changes, not its callers. This is the "abstraction interface still created" half of `DEC-TECH-008`'s own question — already-recommended, and this document's read-repository design (§20) satisfies it structurally without pre-committing to a provider choice.

**ENGINEERING DECISION REQUIRED (routed, not resolved): `DEC-TECH-008` should be formally disposed (Engineering Lead, per its own `decision-register.md` ownership) before or during `ENG-P3-001A`, confirming option (a) — this document's analysis supports doing so, but the actual Decision Register update is the Engineering Lead's to make, not this design document's.**

## 18. `ENG-P3-002` Consumer Contract (conceptual, no frontend/callables)

`ENG-P3-002` (business onboarding flow) needs, from `ENG-P3-001`:

- A read-only query surface returning, per language: Industries (root nodes), Business Categories filtered by Industry, Business Types filtered by Business Category, Reward Program Categories, and Standard Products/Services searchable by name/synonym within a category — all localized per §11's fallback rule.
- A validated reference contract: given a `KnowledgeNode` id and an expected `nodeType`, confirm it exists, has `status == "active"` (referential validity only, §9.4), and is of the expected type — this is the validation `ENG-P3-002`'s onboarding submission step (and `ENG-P3-001A`'s own `Business.primaryCategoryId` validation addition, §15) both need. Translation-publication status is a separate, display-only concern (§9.4/§11) and must not be folded into this reference-validity check.
- **No frontend component, form, or screen is designed here** — this is a data/query contract only, consistent with the task's explicit "conceptual, no frontend/callables" instruction.

### 18.1 Capability-3 Outcome Trace

`CDR-001`'s Capability 3 names its customer outcome as: "a business owner has a working account, a branch profile, invited staff, and a seed catalogue of products/services" (`CDR-001` §"Capability 3 — Business Identity"). Traced against named, persisted records (not inference), per this document's own model plus §15.1's finding:

| Question | Answered by | Owning package | Available within Phase 3? |
|---|---|---|---|
| Business's Category | `Business.primaryCategoryId` | `ENG-P2-002` (Complete) + `ENG-P3-001C`'s validation addition | Yes |
| Business's Type | `Business.businessTypeId` | `ENG-P2-002` (Complete) + `ENG-P3-001C`'s validation addition | Yes |
| Products/services it offers | `RewardProgramVersion.qualifyingKnowledgeNodeIds` | `ENG-P4-001` (Phase 4, Capability 4 — `Blocked`) | **No** — not until a Reward Program is created |
| Business-facing display name for those offerings | `RewardProgramVersion.businessDisplayProductNames` | `ENG-P4-001` (Phase 4, Capability 4 — `Blocked`) | **No** — same as above |

**All four are answerable via named persisted records — none require inference — but the third and fourth only become answerable once the business's first Reward Program is created (PRD3 §12/§14's own mandatory onboarding step), which is `ENG-P4-001`'s schema, not `ENG-P3-001`'s/`ENG-P3-002`'s.** This is not a gap in this design: Phase 3's own exit criteria (`engineering-implementation-programme.md:230`) name only taxonomy-governance and label-completeness outcomes, not product/service persistence — CDR-001's Capability-3 "seed catalogue of products/services" phrase refers to `ENG-P3-001`'s platform seed data being available for a business to select *from* (via a Reward Program), not to a Business-level selection record that Capability 3's own work packages must themselves produce. `ENG-P3-002`'s onboarding flow can rely on `ENG-P3-001`'s taxonomy for categories/types immediately, but a business's own "what do I sell" answer is only complete once Phase 4 exists — this document flags the sequencing implication (already partly captured in §16/§32's risk list) rather than treating it as an `ENG-P3-001`-scope defect.

## 19. `ENG-P3-003` Consumer Contract (conceptual) — and What Should NOT Be Pulled Into `ENG-P3-001`

`ENG-P3-003` (Knowledge Studio MVP) needs, from `ENG-P3-001`:

- The stable entity model (§7) and the resolved unified status vocabulary (§9.4, `DEC-DATA-005`) to build its editorial screens against.
- The `knowledgeSuggestions` collection's existence acknowledged (already named in TRD10 §10.3/§10.4) as the landing place for business-suggested additions — but **not its schema, workflow, or authorization model**, which are `ENG-P3-003`'s own design responsibility.

**Explicitly NOT pulled into `ENG-P3-001` merely because Studio eventually consumes it:**

- The editorial workflow engine itself (draft→approve→publish state machine, review-queue UI, duplicate-detection tooling) — Programme scope names this as `ENG-P3-003`'s own "draft→approve→publish workflow test," not `ENG-P3-001`'s.
- Translation-management tooling (a UI for a human translator to add/edit `KnowledgeTranslation` records) — `ENG-P3-001` only needs the *schema* those records already have (§7.2); building an editor for them is `ENG-P3-003`.
- The platform-editor authorization model (§13.2) — flagged as a future need, not designed or catalogued here.
- AI metadata/AI-assisted categorization (CKS-006, Knowledge Studio "AI Readiness") — explicitly future, no current requirement traces to it.

## 20. Firestore Model (proposed, NOT applied)

**ENGINEERING DESIGN PROPOSAL — implementation-ready shape, no Firestore Rules or live schema change made by this document.** Builds directly on TRD10 §10.7's already-declared collections, with the `status` fields now populated per §9.4's resolved `DEC-DATA-005` disposition.

```
/knowledgeNodes/{nodeId}
  parentId: string | null
  nodeType: "industry" | "business_category" | "business_type"
          | "reward_program_category" | "standard_product" | "standard_service"
  canonicalName: string
  slug: string                 // non-authoritative, display/debug convenience only
  path: string                 // materialized ancestor path, e.g. "/industry-id/category-id"
  depth: number
  description?: string
  iconKey?: string
  status: "draft" | "in_review" | "active" | "retired" | "archived"   // RESOLVED, DEC-DATA-005, §9.4
  version: number
  replacementNodeId?: string
  searchTerms: string[]
  createdAt, createdBy, updatedAt, updatedBy, schemaVersion   // standard metadata, TRD10 §10.5

/knowledgeTranslations/{nodeId}_{languageCode}   // deterministic id = uniqueness key (§7.2)
  nodeId: string
  languageCode: string          // "en" | "fr" at current scope (§11)
  displayName: string
  description?: string
  synonyms: string[]
  status: "draft" | "reviewed" | "published"   // RESOLVED, DEC-DATA-005, §9.4 (unchanged from TRD10 §10.7.2)
  reviewedBy?: string
  reviewedAt?: Timestamp
  createdAt, updatedAt, schemaVersion

/knowledgeTags/{tagId}
  tagGroup: "business_attribute" | "product_attribute" | "customer_interest" | "system_behaviour"
  canonicalName: string
  slug: string
  status: "draft" | "in_review" | "active" | "retired" | "archived"   // RESOLVED, DEC-DATA-005, §9.4 — shared with knowledgeNodes
  translations: Record<string, string>   // ENGINEERING SCHEMA CLARIFICATION (§9.3): to be restructured to reuse KnowledgeTranslation's shape at ENG-P3-001A implementation time
  searchTerms: string[]
  createdAt, updatedAt, schemaVersion

/knowledgeSuggestions/{suggestionId}   // named in TRD10 §10.3/§10.4 already; schema NOT designed here — ENG-P3-003 scope
```

- **ID strategy:** opaque, non-sequential ids for `knowledgeNodes`/`knowledgeTags` (TRD10 §10.5); deterministic composite id for `knowledgeTranslations` (§7.2, uniqueness-by-construction, same pattern as `businessCodeReservations/{businessCode}`).
- **References:** `Business.primaryCategoryId`/`businessTypeId` (existing), `RewardProgramVersion.qualifyingKnowledgeNodeIds`/`standardRewardNodeId` (existing, TRD10 §10.9.2, not yet implemented — Phase 4).
- **Lifecycle:** governed by §9.4's resolved `DEC-DATA-005` vocabulary; retirement via `replacementNodeId` forward-reference (§12), never deletion.
- **Localization fields:** `canonicalName` (internal) vs. `KnowledgeTranslation.displayName` (customer-facing, per-language) — §11.
- **Tenant boundary:** none — every Commerce Knowledge collection is platform-global, not `businessId`-scoped (§8). This is itself a tenant-isolation-relevant fact: unlike every other collection in TRD10 §10.6/§10.9-§10.13, Commerce Knowledge collections have **no** `businessId` field at all, and must never gain one — a `businessId` field on `knowledgeNodes` would silently reintroduce a "per-business taxonomy" the Commerce Knowledge Standard has already ruled out (§8).
- **Indexes:** a composite index on `(nodeType, parentId, status)` for the hierarchical browse query (§18); a composite index on `(nodeId, languageCode)` for `knowledgeTranslations` lookups (largely redundant with the deterministic id, but useful for a "list all translations for a node" query); an index on `tagGroup` for `knowledgeTags`. Exact index definitions belong in `firestore.indexes.json` at implementation time — not authored or applied by this document.
- **Writer:** platform seed-loader (`ENG-P3-001A`) and future Knowledge Studio editorial commands (`ENG-P3-003`) only — never a business-scoped command, never a client write (Firestore Rules, not touched here, must deny all client writes to these collections per `DEC-DATA-001`).
- **Readers:** any authenticated business/customer context (published-status documents only) plus every server-side domain validating a reference (Business, future Reward Program).

## 21. Command/Query Architecture

Following the established domain/repository/service/command layering (`functions/src/domains/business/`, `functions/src/domains/permissions/` as precedent):

- **`ENG-P3-001`'s own responsibility (data/schema/seed layer):**
  - `functions/src/domains/commerceKnowledge/models/knowledgeNode.ts` (and `knowledgeTranslation.ts`, `knowledgeTag.ts`) — pure domain models/validators, no Firestore dependency, mirroring `business.ts`'s own style.
  - `functions/src/domains/commerceKnowledge/repositories/knowledgeNodeRepository.ts` (and translation/tag equivalents) — read (and seed-time write) persistence, mirroring `businessRepository.ts`'s converter/repository split.
  - A seed-loader script (not a runtime command — an operational tool, §10) consuming the repositories' write paths directly, with the manifest-based idempotency discipline (§10.3–§10.4).
  - A narrow read-query interface (list-by-type-and-parent, search-by-term) satisfying `DEC-TECH-008`'s abstraction-seam expectation (§17) — this is the one piece of "query architecture" `ENG-P3-001` itself must design, since `ENG-P3-002` and `ENG-P3-003` both consume it.
- **Deferred to `ENG-P3-002`:** any onCall/HTTPS transport for reading Commerce Knowledge from the frontend, and the onboarding-flow orchestration (validate `primaryCategoryId` against a live read, §15) that calls into `ENG-P3-001`'s repository layer.
- **Deferred to `ENG-P3-003`:** any write command beyond seed-loading (suggest/review/approve/publish/translate), and any transport for it.
- **No command/event/transaction layer is needed inside `ENG-P3-001` itself** beyond the seed-loader's own idempotent writes (§10.4) — there is no runtime, request-driven mutation in `ENG-P3-001`'s own scope (§14 already established this for events; the same reasoning applies to commands).

## 22. Validation/Test Architecture (described, not implemented)

| Layer | What it validates | Convention reused |
|---|---|---|
| Unit (domain models) | `KnowledgeNode`/`KnowledgeTranslation`/`KnowledgeTag` field validation (non-blank canonical names, valid `nodeType`, valid `languageCode` against §11's supported set, well-formed `parentId`/hierarchy depth consistency) | Mirrors `business.test.ts`'s validator-unit-test style |
| Unit (seed manifest) | Manifest referential integrity — every manifest entry's `parentId` resolves to another manifest entry (no dangling parent reference), no duplicate `slug` within a `nodeType` | New, seed-specific — analogous in spirit to `businessCode.test.ts`'s format-validation tests |
| Emulator (repository) | Real-Firestore round-trip for node/translation/tag CRUD (seed-time write path only), composite-index-backed queries (list-by-type-and-parent) return expected results | Mirrors `businessRepository.emulator.test.ts` |
| Emulator (seed-loader idempotency) | Re-running the seed loader against an already-seeded environment produces zero net writes (or the confirmed update-strategy behavior, §10.5) | Mirrors the idempotency-replay tests already established for `ENG-P2-002B`'s bootstrap transaction |
| Integration (cross-domain reference validation) | A `Business.primaryCategoryId` referencing a seeded node validates successfully; referencing a non-existent or wrong-`nodeType` id fails with the correct error category (§15's proposed addition) | New — the one genuinely cross-domain (`business` ↔ `commerceKnowledge`) test surface this design introduces |
| Localization completeness | Every seeded node has both EN and FR `KnowledgeTranslation` records (§10.2 rule 3) — an automated completeness check, not a manual one, following the Programme's own "EN/FR completeness check" line item for Phase 3 | Named directly in `engineering-implementation-programme.md:235` |
| Governance/taxonomy-boundary test | No test or code path allows a business-scoped command to write to any Commerce Knowledge collection — an explicit negative/boundary test proving §8's structural claim, not just asserting it in prose | New — directly proves this document's own §8 argument, following the same "prove it, don't just assert it" discipline `ENG-P2-003C`'s Owner-protection tests already established |

## 23. Evolution/Versioning

Additive only, no over-engineering:

- New `nodeType` values (were the hierarchy ever to gain a level) would be additive to the existing union — TRD10 §10.7.1's own "Hierarchy Rule" already states "the platform shall not hardcode exactly three taxonomy levels," so the hierarchy is already designed to be variable-depth; no change needed to accommodate this.
- New languages beyond EN/FR (§6's flagged discrepancy) would be additive `KnowledgeTranslation` records under a new `languageCode` value — no schema change required, only an addition to `apps/web/src/i18n/config.ts`'s `SUPPORTED_LANGUAGES` (out of this document's scope) and the equivalent backend-side supported-language list.
- `KnowledgeNode.version`/retirement-via-`replacementNodeId` (§12) is already the additive-evolution mechanism for a node's own meaning changing — no redesign proposed.
- AI metadata (§6) is deferred as a **future additive field**, not designed now — schemaVersion-gated additions are the existing platform-wide pattern for this (TRD10 §10.5's `schemaVersion` field, already present on every entity in §7).

## 24. Security/Tenant-Isolation Invariants

1. **No client write path exists or is proposed** to any Commerce Knowledge collection (`DEC-DATA-001`, platform-wide, already `CONFIRMED`) — Firestore Rules must deny all client writes; only the trusted server (seed-loader, future Knowledge Studio commands) writes.
2. **No `businessId` field exists on any Commerce Knowledge collection**, and none should ever be added (§20) — this is the structural expression of "one taxonomy for the entire platform" (CKS-001).
3. **Enumeration resistance**: Commerce Knowledge documents are largely intended to be *publicly readable* (governed reference data, not secret), so enumeration-resistance concerns (relevant to `businesses`/`businessMemberships`, `ENG-P2-004-DESIGN-001` §9) do not apply the same way here — but reads must still be restricted to `active`-status `KnowledgeNode`/`KnowledgeTag` documents with a `published`-status `KnowledgeTranslation` only (a `draft`/`in_review` node, or an unpublished translation, must not leak to any non-editorial reader, since it may not yet be reviewed/accurate — §9.4).
4. **Reference-direction integrity**: a `Business`/`RewardProgramVersion` may reference a `KnowledgeNode`; a `KnowledgeNode` never references back to a specific `Business` — this one-directional reference shape is itself a tenant-isolation property (no cross-business data ever flows through a shared taxonomy node).

## 25. Explicit Deferrals

- ~~`DEC-DATA-005` disposition~~ — **RESOLVED** (Engineering Lead, §9.4).
- `DEC-TECH-008` disposition (Engineering Lead) — §17. Still open, non-blocking.
- Commerce Knowledge editorial/platform-editor authorization model — §13.2, deferred to `ENG-P3-003`.
- `ENG-P2-003` staff-callable-transport gap — §16, noted, not solved.
- `knowledgeSuggestions` schema and suggestion-review workflow — §19, `ENG-P3-003`.
- AI metadata — §6, §23, future.
- Kirundi/Swahili/Kinyarwanda — out of current scope (§6, §11).
- `Business.primaryCategoryId`/`businessTypeId` live-reference validation — §15, additive future work, not blocking `ENG-P3-001` itself but required before `ENG-P3-002` can rely on it.

## 26. Founder Decisions — `DEC-CKS-001`/`DEC-CKS-002` DISPOSITIONED (APPROVED); Capability-3 Wording DISPOSITIONED (APPROVED)

Only genuinely open items were ever raised here — the settled product principles (CKS-001–006, one platform-wide taxonomy, business-select-not-create) were never reopened. **Both proposed Founder decisions below have since been dispositioned by the Founder and are recorded here as final**, per the Founder Disposition Recording task of 2026-08-20. Neither disposition is silently assumed — both are the Founder's own recorded words, reproduced below, with the engineering implication each one carries made explicit.

| ID | Question | Founder disposition | Recorded implication for this design |
|---|---|---|---|
| **`DEC-CKS-001`** | What is the exact minimum seed-data scope for first-onboarding MVP (§10.1)? | **APPROVED.** `ENG-P3-001`'s initial Commerce Knowledge seed dataset shall be bounded to the sectors, Business Categories, Business Types, and minimum Standard Product/Service knowledge required for the Burundi pilot and the approved initial MVP use cases. `ENG-P3-001` is **not required** to build an exhaustive Burundi, East African, or African taxonomy before launch. Expansion after MVP shall be additive, centrally governed, versioned, and compatible with the same schema; the architecture must not make later Rwanda or additional-sector expansion require a schema redesign. | §10.1 updated to record this as the final disposition (no longer a recommendation). The concrete PRD3 §7 launch-category list remains the seed target, now Founder-confirmed rather than merely engineering-recommended. The additive-expansion requirement is confirmed already satisfied by the existing variable-depth `KnowledgeNode` hierarchy and the extensible seed manifest (§10.1) — **no schema change was needed to satisfy this disposition.** |
| **`DEC-CKS-002`** | Must the Knowledge Studio editorial UI (`ENG-P3-003`) exist at launch, or can it follow initial onboarding? | **APPROVED.** The Commerce Knowledge dataset itself is required for launch/onboarding. The Knowledge Studio editorial UI is **not** a prerequisite for first launch. Initial seed knowledge may be repository-controlled, reviewed through governed Product/Engineering processes, versioned, loaded through governed seed tooling, and audited through normal repository/change-control procedures. `ENG-P3-003` may follow the initial onboarding capability. This disposition does **not** reduce central Commerce Knowledge governance — businesses still cannot create uncontrolled taxonomy. | §19 and §29 updated to state plainly that `ENG-P3-003` is not launch-blocking (previously only an engineering-supported lean, now a Founder-confirmed disposition) — this does not change the design's architecture (the seed-loader was already engineering-controlled per §10.3), only removes the open question. Central governance (§8's structural ownership proof) is unaffected — the disposition explicitly preserves it. |

**Capability-3 wording — DISPOSITIONED (APPROVED), see §35 for the full reconciliation as amended by this disposition.** The Founder confirmed: "seed catalogue of products/services" in `CDR-001` §5 means the **platform** Commerce Knowledge seed catalogue required by `ENG-P3-001` exists and is queryable — it does **not** mean every Business must persist its own product/service catalogue during Capability 3. Business classification for Capability 3 is persisted through the governed Business classification references (`primaryCategoryId`/`businessTypeId`, where applicable); specific products/services used to qualify Reward Programs remain governed by the later Reward Program model (`RewardProgramVersion.qualifyingKnowledgeNodeIds`). **No `businessOffering`/`businessCatalogue`-equivalent persistence is created to satisfy the old wording** — this design already did not create one (§15.1), and the Founder disposition confirms that was correct, not merely permitted.

## 27. Engineering Decisions — `DEC-DATA-005` RESOLVED; `DEC-TECH-008` Remains Open

`DEC-DATA-005` was `OPEN_ENGINEERING`, Engineering-Lead-owned, and has now been **resolved** by the Engineering Lead and recorded in `decision-register.md` (2026-08-20). `DEC-TECH-008` remains `OPEN_ENGINEERING`, not yet disposed, and is not a blocker to `ENG-P3-001A`.

1. ~~**`DEC-DATA-005`** (Knowledge/rule state vocabulary unification)~~ — **RESOLVED.** The full decision brief (three competing vocabularies, per-entity analysis, three-option comparison) is at §9.3; the adopted, binding disposition — final enums, transition matrices, new-reference/existing-reference resolution rules — is at §9.4, and is recorded in `decision-register.md`'s `DEC-DATA-005` entry (Category: Data, Status: `RESOLVED — SEPARATE SEMANTIC LIFECYCLES WITH SHARED CANONICAL KNOWLEDGE VOCABULARY`, Decision date: 2026-08-20, Approved by: Engineering Lead). The `KnowledgeTag.translations` storage-shape question was disposed alongside it as an `ENGINEERING SCHEMA CLARIFICATION` (§9.3), not itself part of the status-vocabulary decision. **This is no longer an outstanding blocker to `ENG-P3-001A` schema/model code.**
2. **`DEC-TECH-008`** (Search implementation) — the exact bounded question routed in §17: formally confirm option (a), Firestore-backed taxonomy search with an abstraction seam, for MVP; defer a dedicated search provider (no Algolia/Typesense/Firestore-search-extension selection is made or proposed here — this task's constraints continue to be honored). This document's own analysis (§17) supports (a) but does not itself constitute the disposition — the Engineering Lead must record it in `decision-register.md`. Kept **OPEN/DEFERRED** — `ENG-P3-001`/`ENG-P3-002` do not require a dedicated search-engine decision to proceed (§17), so this is not a blocker to `ENG-P3-001A` either, only an item still owed a formal Decision Register entry.

## 28. Implementation Decomposition

**ENGINEERING DESIGN PROPOSAL**, based on actual complexity found (not symmetry with `ENG-P2-002A/B/C`'s three-way split):

| Sub-package | Scope | Rationale |
|---|---|---|
| `ENG-P3-001A` — Commerce Knowledge domain contracts & schema | `KnowledgeNode`/`KnowledgeTranslation`/`KnowledgeTag` pure domain models/validators (§7), the resolved `DEC-DATA-005` status enum applied, TRD10 §10.7 schema corrections reflecting the disposition | Mirrors `ENG-P2-002A`'s "domain contracts and lifecycle foundation" precedent exactly — this is genuinely the same kind of bounded, no-persistence, TDD-first package |
| `ENG-P3-001B` — Repositories & seed-loader | Read/write repositories (§20–21), the seed manifest and idempotent seed-loader (§10), the narrow query-abstraction seam satisfying `DEC-TECH-008` (§17) | This is where the real implementation complexity lives — a repository layer plus an idempotent operational script is a distinct, testable unit from the pure-model package above |
| `ENG-P3-001C` — Business-reference validation integration | The additive `Business.primaryCategoryId`/`businessTypeId` live-validation addition to `ENG-P2-002`'s existing command surface (§15) | This one genuinely touches a *different* domain's existing code (`functions/src/domains/business/`) and should be reviewed/tested as its own bounded cross-domain change, not bundled into `-001A`/`-001B`'s single-domain work |

**§15.1 reassessment applied:** this review investigated whether a new Business-owned "products/services offered" association entity would require its own sub-package (potentially inside `-001C` or as a genuinely new package). Finding (§15.1): no such entity is required — `RewardProgramVersion` already carries this, owned entirely by `ENG-P4-001`, not `ENG-P3-001`. The three-package decomposition below is therefore **unchanged** by this review.

**No fourth `-D` package is proposed** (unlike `ENG-P2-002`'s A/B/C or the task prompt's illustrative "A/B/C/D" mention) — this document found no fourth genuinely distinct concern: there is no separate "integration validation" phase analogous to `ENG-P2-003E`, because Commerce Knowledge has no staff-lifecycle-style multi-command integration surface to validate end-to-end — its only cross-domain integration point is the single, bounded `-001C` addition above. Recommendation: three sub-packages, not four, justified by the actual complexity found (a genuinely distinct pure-model layer, a genuinely distinct persistence/operational layer, and a genuinely distinct cross-domain integration point) — not chosen merely to mirror `ENG-P2-002`'s own three-way split.

## 29. Recommended Sequencing for `ENG-P3-002`/`ENG-P3-003`

**Finding: sequential, not parallel — reassessed from the Programme's own stated preconditions, and confirmed by an actual shared-touchpoint check.**

The Programme itself already states both `ENG-P3-002` and `ENG-P3-003` have "Preconditions: `ENG-P3-001` complete" (`engineering-implementation-programme.md:250-251`) — this document checked whether, *after* `ENG-P3-001` completes, `ENG-P3-002` and `ENG-P3-003` could then run **in parallel** with each other (as Capabilities 2/3 were confirmed able to, once their own shared dependency existed, `CDR-001` §6), by checking for shared touchpoints:

| Touchpoint | Shared? | Finding |
|---|---|---|
| Schema | Yes — both read `ENG-P3-001`'s entity model | Read-only for both; not a sequencing conflict once `ENG-P3-001` is stable |
| Permission catalogue | No shared new entries (§13) | Neither package is shown to need a catalogue change by this design; not a conflict |
| Backend command/transport | **Yes, contended** | `ENG-P3-002`'s onboarding flow needs the Business-reference validation addition (§15, proposed as `ENG-P3-001C`) AND a read-transport for Commerce Knowledge queries (§18) before it can be tested end-to-end; `ENG-P3-003` needs its own write-command layer built fresh. These do not collide in file terms, but `ENG-P3-002`'s onboarding-submission flow is **not fully testable** until `ENG-P3-001C`'s validation exists — a dependency internal to `ENG-P3-001`'s own decomposition (§28), not between `-002`/`-003` themselves |
| Frontend context | No direct sharing found — onboarding UI (`ENG-P3-002`) and Studio editorial UI (`ENG-P3-003`) are different applications/surfaces (business-facing vs. platform-admin-facing) | Not a conflict |
| Localization | Shared — both consume the same `KnowledgeTranslation` records, both need EN/FR complete | Read-only shared dependency, not a sequencing conflict |
| Rules | Both need the same read-permission Firestore Rules (Commerce Knowledge is public/authenticated-readable); `ENG-P3-003` additionally needs write-Rules for its editorial actor | `ENG-P3-003`'s Rules addition does not block `ENG-P3-002`'s read-only needs |

**Conclusion:** once `ENG-P3-001` (all three sub-packages, §28) is genuinely complete, `ENG-P3-002` and `ENG-P3-003` have **no direct schema/permission/transport/frontend collision with each other** — they could, in principle, proceed in parallel exactly as Capabilities 2/3 did once `ENG-P2-004` existed. **Recommendation, now Founder-confirmed via `DEC-CKS-002` (§26): `ENG-P3-002` first (or in true parallel, since no collision was found); `ENG-P3-003` is not launch-blocking and may follow independently whenever separately authorized.** What was previously only an engineering-supported lean (no direct technical collision found, plus a product-sequencing argument that onboarding is the capability-critical path — the Programme's Phase 3 exit criteria, `engineering-implementation-programme.md:230`, center on "a business can complete onboarding without creating uncontrolled categories," which needs only `ENG-P3-001`'s seed data, not `ENG-P3-003`'s editorial tooling) is now the Founder's own recorded disposition: Knowledge Studio is not a prerequisite for first launch, initial seed knowledge may be repository-controlled/reviewed/versioned/audited through governed engineering process without Studio existing, and central Commerce Knowledge governance is unaffected by this sequencing choice.

## 30. Definition of Ready for `ENG-P3-001` Implementation

`ENG-P3-001A` (the first sub-package, §28) may begin only when:

1. ~~`DEC-DATA-005` is disposed~~ — **Resolved.** Recorded in `decision-register.md` (Engineering Lead, 2026-08-20) — final enums and transition rules at §9.4, §27.
2. `DEC-TECH-008` is disposed (Engineering Lead) — confirming the Firestore-backed-search direction (§17, §27). **Outstanding, but non-blocking** — not required for `ENG-P3-001`/`ENG-P3-002` to proceed (§17).
3. ~~A Founder disposition exists for `DEC-CKS-001`~~ — **Resolved.** `DEC-CKS-001` is APPROVED (§26): Burundi-pilot-bounded seed scope, additive/versioned/schema-compatible expansion required.
4. This design document itself has been reviewed (Founder review, per this task's convention) — no implementation authorization is granted by this document alone.
5. A fresh, separate Founder implementation authorization is issued for `ENG-P3-001A` specifically — matching the exact convention every `ENG-P2-002*`/`ENG-P2-003*` sub-package required.

**No architecture/governance blocker remains.** All Founder-owned product decisions (`DEC-CKS-001`, `DEC-CKS-002`, the Capability-3 wording reconciliation, §26/§35) and the sole blocking Engineering-Lead decision (`DEC-DATA-005`, §9.4/§27) are now dispositioned. `DEC-TECH-008` (item 2) remains open but is confirmed non-blocking (§17) — its disposition is still owed for its own sake, not because `ENG-P3-001A` needs it. **Items 4 and 5 (Founder review of this revision, and a fresh implementation authorization) are the only remaining gate** — both are process/authorization steps, not architecture/governance blockers. `ENG-P3-001A` is therefore **architecturally ready but not authorized**.

`ENG-P3-001B`/`ENG-P3-001C` additionally require `ENG-P3-001A` merged first (sequential within the package, §28).

## 31. Acceptance Matrix

| # | Criterion | Owner | Status at this document's delivery |
|---|---|---|---|
| 1 | Commerce Knowledge domain boundary classified (platform-governed/business-specific/deferred/out-of-scope) | This document | PASS (§6) |
| 2 | Entity model defined for every governed hierarchy level | This document | PASS (§7) |
| 3 | Platform/business ownership boundary structurally proven | This document | PASS (§8) |
| 4 | `DEC-DATA-005` resolved by the Engineering Lead, recorded in `decision-register.md`, not silently decided by this document | This document + `decision-register.md` | PASS (§9.4, §27) — RESOLVED, 2026-08-20 |
| 5 | Seed-data model (minimum, not exhaustive) designed | This document | PASS (§10) — exact scope needs `DEC-CKS-001` (§26) |
| 6 | Localization model, EN/FR only, no Kirundi/Swahili/Kinyarwanda invented | This document | PASS (§11) |
| 7 | Identifier/reference model, opaque ids, no mutable-label identity | This document | PASS (§12) |
| 8 | Authorization mapped onto existing catalogues; no new permission invented/added | This document | PASS (§13) — future need flagged only |
| 9 | Event model evaluated; no unjustified event invented | This document | PASS (§14) |
| 10 | Business Identity integration mapped without redesigning `ENG-P2-002` | This document | PASS (§15) |
| 11 | Staff/permission callable-transport gap noted, not solved | This document | PASS (§16) |
| 12 | `DEC-TECH-008` search boundary evaluated; MVP-without-provider finding stated | This document | PASS (§17) — disposition itself remains open |
| 13 | `ENG-P3-002`/`ENG-P3-003` conceptual consumer contracts stated, with explicit non-inclusion boundary | This document | PASS (§18–§19) |
| 14 | Firestore model proposed, not applied; no Rules/live schema touched | This document | PASS (§20); validated in §33 |
| 15 | Command/query architecture layered per platform convention | This document | PASS (§21) |
| 16 | Validation/test architecture described, not implemented | This document | PASS (§22) |
| 17 | Founder decisions listed, only genuinely open ones, settled principles not reopened | This document | PASS (§26) |
| 18 | Engineering decisions correctly disposed/routed | This document | PASS (§27) — `DEC-DATA-005` **RESOLVED** (recorded in `decision-register.md`); `DEC-TECH-008` still routed, not silently decided, correctly OPEN/DEFERRED |
| 19 | Implementation decomposition justified by actual complexity, not symmetry | This document | PASS (§28) |
| 20 | Downstream sequencing reassessed via real touchpoint check | This document | PASS (§29) |
| 21 | Business↔Standard-Product/Service selection investigated with direct source citations; no new entity invented without evidence | This document (v1.1 review) | PASS (§15.1) — found existing `RewardProgramVersion` coverage sufficient, no entity added |
| 22 | `KnowledgeNode` parent-type adjacency validated as a genuine gap and closed with a sourced rule, not invented from nothing | This document (v1.1 review) | PASS (§7.1.1) |
| 23 | Capability-3 four-question outcome trace performed against named persisted records | This document (v1.1 review) | PASS (§18.1) — two of four answerable only once `ENG-P4-001` exists, flagged not hidden |
| `ENG-P3-001` implementation itself | Not evaluated — not started | Future `ENG-P3-001A/B/C` | Not started |

## 32. Risks

- ~~`DEC-DATA-005` remaining undisposed~~ — **Closed.** Resolved and recorded in `decision-register.md` (§9.4, §27). No longer a risk to `ENG-P3-001A`'s critical path.
- ~~Seed-scope ambiguity~~ — **Closed.** `DEC-CKS-001` is APPROVED (§26), Burundi-pilot-bounded, PRD3 §7's concrete list.
- **The `Business.primaryCategoryId`/`businessTypeId` validation gap (§15)** is a currently-live, un-flagged-elsewhere risk: today, `createBusiness` accepts *any* non-blank string as a category id with no existence check — if `ENG-P2-002`-based business creation is exercised (e.g., in a hosted preview or pilot) before `ENG-P3-001C` closes this gap, businesses could be created referencing categories that will never resolve once Commerce Knowledge exists. This is not a defect in `ENG-P2-002` (correctly out of its scope, per its own design document), but it is a real data-integrity risk if the packages are sequenced with a live gap in between. **Still open** — unaffected by this revision's disposition-recording, since it's an implementation-time gap, not a decision gate.
- **The `ENG-P2-003` callable-transport gap (§16)**, if not separately closed, risks `ENG-P3-002`'s staff-invitation-during-onboarding step (PRD3 §5 Step 7) having no working backend to call, independent of anything Commerce Knowledge does. **Still open.**
- **Documentation-currency risk**: the Commerce Knowledge Standard's and Knowledge Studio's still-listed Kirundi/Swahili/Kinyarwanda "planned" language mentions (§6) could mislead a future implementer into scoping for them if this design document's flag is not carried forward into whatever documentation-currency pass eventually addresses it. **Still open.**
- **`DEC-TECH-008` remains formally undisposed** (§17, §27) — confirmed non-blocking to `ENG-P3-001A`/`ENG-P3-002`, but its Decision Register entry is still owed; low priority, not on this package's critical path.

## 33. Validation Performed (this task)

- `git fetch origin` confirmed `origin/main` at exactly `bee297c39e46b68b0edcd20404b6f06baf26b6a8`, the expected SHA — no drift.
- `gh pr list --state open` returned exactly one PR (#34), docs-only, unrelated.
- Repository-wide search confirmed zero pre-existing `ENG-P3-001` design/implementation artifacts and zero Commerce Knowledge domain code.
- Every governing source cited in §3 was read directly from the file in this clean worktree, not from a secondhand summary.
- `functions/src/index.ts` was read directly to confirm the exact set of existing callables (confirming §16's finding empirically, not by assumption).
- `ordinaryPermissionCatalogue.ts`/`sensitivePermissionCatalogue.ts` were read directly to confirm no Commerce Knowledge-related entry exists and that both are closed, four/eight-entry sets (§13).
- This document itself makes no change to `functions/`, `apps/web/`, `firestore.rules`, `storage.rules`, or either permission catalogue file — verified by the git diff performed after writing this document (§ "Validation before finishing" in the task instructions; confirmed in the accompanying commit's diff stat).

## 34. Open Questions

- ~~Exact seed-data scope~~ — **Resolved.** `DEC-CKS-001` APPROVED (§26) — Founder.
- ~~Whether `ENG-P3-003` is a pre-launch or post-launch priority~~ — **Resolved.** `DEC-CKS-002` APPROVED (§26) — Founder.
- ~~Unified status vocabulary~~ — **Resolved.** `DEC-DATA-005` RESOLVED (§9.4, §27) — Engineering Lead.
- ~~Whether `KnowledgeTag.translations`'s inline-map shape should be unified with `KnowledgeNode`'s separate-collection shape~~ — **Resolved**, as an `ENGINEERING SCHEMA CLARIFICATION` (§9.3) — unify on `KnowledgeTranslation`'s shape at `ENG-P3-001A` implementation time.
- Search-implementation confirmation (`DEC-TECH-008`, §17, §27) — **still open** — Engineering Lead. Confirmed non-blocking to `ENG-P3-001A`/`ENG-P3-002` (§17).
- The eventual platform-editor authorization model for Knowledge Studio (§13.2) — deferred to `ENG-P3-003`'s own design package, not an open question for this document to answer.
- The translation-versioning question (§7.2 — do translations need an independent `version` field, or do they always track the node's own `version`) — a narrower, non-blocking design detail `ENG-P3-001A` is free to confirm; not part of `DEC-DATA-005`'s resolved scope.

## 35. Capability-3 Wording Reconciliation — "Seed Catalogue of Products/Services" — FOUNDER-DISPOSITIONED (APPROVED)

`CDR-001` §5's Capability-3 customer outcome reads: *"a business owner has a working account, a branch profile, invited staff, and a seed catalogue of products/services"* (`CDR-001-capability-delivery-roadmap.md:157`), and its objective reads *"...describe what it sells, so it is ready to record purchases against"* (`:156`). Read against §15.1's sourced finding — that no per-Business product/service persistence exists or is required by PRD3 before Reward-Program-creation time (`ENG-P4-001`, Phase 4) — these two phrases could have been misread as requiring `ENG-P3-001`/`ENG-P3-002` to persist a per-Business offering list, which this design deliberately does not do. This document originally raised the ambiguity for Founder review (prior revision); **the Founder has since dispositioned it, recorded below as final.**

**Finding, from the governing sources directly, not invented:** the Commerce Knowledge Standard itself uses "catalogue" exclusively at the platform level — CKS Part IV is titled **"Industry Catalogue"**, and CKS's own hierarchy diagram (§539) describes "Standard Product/Service → searchable catalogue," i.e., the *platform's* Commerce Knowledge seed dataset being a browsable/queryable catalogue that a business searches **within**, not a catalogue each business separately builds. No use of "catalogue" anywhere in the Commerce Knowledge Standard, Knowledge Studio, or PRD3 refers to a per-Business persisted product list — the only per-Business persisted product/service reference found anywhere in the governing sources is `RewardProgramVersion.qualifyingKnowledgeNodeIds` (§15.1), created at Reward-Program-creation time, not at onboarding.

**Founder disposition — APPROVED:** "seed catalogue of products/services" means the **platform** Commerce Knowledge seed catalogue required by `ENG-P3-001` exists and is queryable — the same sense as CKS Part IV's "Industry Catalogue." It does **not** mean every Business must persist its own product/service catalogue during Capability 3. For Capability 3, Business classification is persisted through the governed Business classification references (`primaryCategoryId`/`businessTypeId`, where applicable); specific products/services used to qualify Reward Programs remain governed by the later Reward Program model, including `RewardProgramVersion.qualifyingKnowledgeNodeIds`. **No `businessOffering`, `businessCatalogue`, or equivalent persistence is created merely to satisfy an ambiguous reading of the old wording** — this design already did not create one (§15.1), and the disposition confirms that was the correct reading, not merely a permitted one.

**Documentation-currency action taken (minimal, dated, not rewriting history):** per the Founder's explicit instruction to "add a minimal dated clarification to `CDR-001` so future agents do not reinterpret the Capability-3 exit requirement incorrectly" without rewriting historical entries, a single new dated clarification line has been appended to `CDR-001` §5 (not altering any existing entry's text) — see the `CDR-001-capability-delivery-roadmap.md` diff accompanying this revision. This closes the wording-reconciliation question for future readers of both documents; §18.1's outcome trace and §15.1's underlying finding are unchanged by this disposition, since the disposition confirms rather than alters them.
