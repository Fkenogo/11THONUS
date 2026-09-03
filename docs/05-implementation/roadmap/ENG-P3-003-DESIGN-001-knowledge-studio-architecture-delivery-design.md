> **Title:** ENG-P3-003-DESIGN-001 — Knowledge Studio MVP Architecture and Delivery Design
> **Version:** 1.1 · **Status:** Design package — architecture and delivery decomposition only; no implementation authorized by this document
> **Classification:** Working (execution-layer architecture record)
> **v1.1 (`ENG-P3-003-DESIGN-001-CORR-001`):** corrected the authority relationship between this design and TRD18. v1.0 treated TRD18 §18.5.5–18.6/§18.10/§18.18–18.28/§18.49/§18.56–18.62 as "the controlling architecture reference." No Founder approval of TRD18 as a whole, and no Decision Register entry adopting those specific sections, was found on merged `origin/main` — and one on-point, unresolved, explicitly blocking Decision Register entry (`DEC-GOV-007`, `OPEN_FOUNDER`, "Blocks: Phase 12 admin build") covers exactly the platform-administrator role vocabulary §6 relied on. §2A (new) reclassifies every material TRD18-derived element as A (already governed elsewhere), B (design recommendation requiring Founder approval), or C (engineering implementation detail); §6/§7/§8/§9/§13/§17/§18/§24 are corrected accordingly to stop presenting B-classified content as settled. `DEC-DATA-005`, `DEC-CKS-001`, `DEC-CKS-002`, the existing Commerce Knowledge read/seed architecture, and the existing Business permission architecture are **not reopened** — see §2A for what remains frozen. §13's `updatedBy`-only seed-collision guard is downgraded from "the fix" to "insufficient as proposed" — see §8 (renumbered) for the corrected assessment. No implementation code, collection, or Firestore Rule was added by this correction.
> **Governing document:** [Commerce Knowledge Standard](../../03-standards/commerce-knowledge-standard.md); [Knowledge Studio](../../03-standards/knowledge-studio.md); [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-DATA-005`, `DEC-CKS-001`, `DEC-CKS-002`, `DEC-SEC-002`, `DEC-GOV-007`; [`CDR-001` Capability 3](CDR-001-capability-delivery-roadmap.md#8-engineering-work-package-mapping); [ENG-P3-001-DESIGN-001](ENG-P3-001-DESIGN-001-commerce-knowledge-architecture-delivery-design.md) §7/§9/§12/§13.2/§19/§26; TRD10 §10.7 (Commerce Knowledge Domain Collections). [TRD18 — Platform Administration, Knowledge Studio and Rules Studio](../../02-technical/trd/18-platform-governance-and-administration.md) §18.5.5–18.6, §18.10, §18.18–18.28, §18.49, §18.56–18.62 remains the **design-recommendation source**, not a governing document, for this task — see §2A.
> **Source-of-truth path:** `docs/05-implementation/roadmap/ENG-P3-003-DESIGN-001-knowledge-studio-architecture-delivery-design.md`

# ENG-P3-003-DESIGN-001 — Knowledge Studio MVP Architecture and Delivery Design

**This document defines architecture only. It authorizes no implementation.** No production code, Firestore Rules, migration, client UI, callable/HTTPS endpoint, or deployment is created or modified by this document. It is analogous in role to [ENG-P3-001-DESIGN-001](ENG-P3-001-DESIGN-001-commerce-knowledge-architecture-delivery-design.md) — it resolves the architecture-level questions a future implementation prompt needs answered before a coding agent could otherwise invent editorial-workflow semantics, a platform-administrator authorization model, or Firestore schema unsupported by any governed source. **As of v1.1, "resolves" means "proposes a recommended resolution for Founder approval," not "settles," wherever an element is classified B in §2A.**

---

## 1. Entry repository state and base SHA

- **Entry `origin/main` SHA:** `cd7c7589347e2de5a552dea52908265e8a91dcd0` (merge of PR #222, `11ONUS-PROG-002`), verified by `git fetch origin && git rev-parse origin/main` before this task began, then a fresh detached-HEAD worktree created from that exact SHA (`git worktree add ... origin/main --detach`). The primary working directory's unrelated, uncommitted `FD-COM-001` commercial-model work was never opened, read, or touched.
- **`ENG-P3-003-DESIGN-001-CORR-001`** (this correction) re-verified `origin/main` unchanged at the same SHA before editing — PR #223 had not moved and no new commit landed on `main` between the two tasks. The existing PR #223 branch (`docs/eng-p3-003-design-001-knowledge-studio-architecture`) is amended in place, per the task's own instruction to reuse it where safe.
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

**Note on TRD18's status (superseded by §2A — retained for the correction record):** v1.0 of this document stated TRD18 was "the controlling architecture reference" for Knowledge Studio's roles, permissions, draft model, audit schema, and API-boundary naming. §2A below corrects this: TRD18 has not been separately approved for those sections, and one specific, on-point Decision Register entry (`DEC-GOV-007`) is open and blocking exactly this content. TRD18 is now treated as a design-recommendation source, not a governing one, for every element not independently confirmed elsewhere.

## 2A. TRD18 governance status verification and authority reclassification (`CORR-001`)

### 2A.1 TRD18 exact governance status

TRD18's own header (`docs/02-technical/trd/18-platform-governance-and-administration.md:1-5`): `**Version:** 1.0 · **Status:** Draft for approval (pre-freeze) · **Classification:** Authoritative Technical`.

**This is not unique to TRD18.** Every one of the 23 TRD chapters (`docs/02-technical/trd/01-07-platform-architecture.md` through `23-traceability-and-completion-review.md`, plus the TRD `README.md`) carries the identical header status: `Draft for approval (pre-freeze)`. TRD10 (Firestore Data Architecture) — the chapter the already-implemented, in-production `commerceKnowledge` domain is built against — carries the same status. So TRD18's draft status alone does not distinguish it from TRD10, which this codebase already implements against.

**What does distinguish TRD18 from TRD10 here**: TRD10's Commerce-Knowledge-relevant content has a corresponding **resolved** Decision Register entry (`DEC-DATA-005`, `Status: RESOLVED`, decision-register.md:1030-1040) that independently confirms/corrects its schema for implementation. TRD18's Knowledge-Studio-relevant content has no resolved entry — and, more materially, has one **open, explicitly blocking** entry covering exactly the role vocabulary this design used (§2A.2).

**Document Hierarchy context** (`canonical-reference.md` §9, citing Platform Constitution Part VII): TRD chapters (rank 3) sit above the Commerce Knowledge Standard (rank 4) and the Decision Register (rank 9) in the general precedence order — "Lower-level documents may not contradict higher-level documents." This means a TRD chapter's draft status is this project's *normal* operating condition for baseline architecture, not per se disqualifying. The correction below does not claim TRD18 has zero standing; it claims that for the *specific* elements listed in §2A.3, either (a) no Decision Register entry addresses them at all (so nothing has tested or confirmed them against the rest of governed authority), or (b) a specific, open, blocking Decision Register entry exists and has not been resolved — and per the task's explicit instruction for this correction, unconfirmed/blocked TRD content is not to be presented as controlling.

### 2A.2 Evidence of approval/adoption found — and not found

**Found, and directly on point:**
- **`DEC-GOV-007` — "MVP administrator role subset"** (`decision-register.md:140-152`), **Status: `OPEN_FOUNDER`**, Priority D2. Decision question, quoted exactly: *"Which of TRD18's eleven administrator roles are staffed/enabled at MVP launch (vs collapsed into fewer people with separated permissions)?"* Context: *"PRD10 defines one Super Administrator; TRD18 defines 11 sub-roles with separation of duties. Small-team reality needs an explicit launch subset."* **`Final decision: — · Decision date: — · Approved by: —`. `Blocks: Phase 12 admin build`.** `knowledge_editor` and `knowledge_approver` (TRD18 §18.5.5–18.5.6) are two of the eleven roles this open decision is explicitly about — they are not carved out or pre-approved. This is the single most material finding of this correction: the exact role pair §6 of this design built on is inside an open, unresolved, blocking Founder decision.
- **`DEC-SEC-002` — "Administrator MFA"** (`decision-register.md:631-638`), **Status: `CONFIRMED`**, Founder-approved ("TRD approval"). Current confirmed position, quoted exactly: *"Platform administrators require MFA and enhanced session controls; admin access is permission-scoped and audited."* Affected documents listed include `TRD18 §18.8–18.9`. This is a real, independent Founder confirmation — narrower than "TRD18 is approved," but it does confirm, on its own authority, three things: platform administrators exist as a concept requiring MFA; their access is permission-scoped; their actions are audited. Decision owner for the enforcement *mechanism* is recorded as "Engineering Lead," not Founder.
- **A related, unnamed Engineering-Lead-owned entry** (`decision-register.md:970-978`, "Separate deployment for the admin application... vs protected shell") — `Founder decision required: No`, `Current confirmed position: preference recorded, not decided` — confirms this specific deployment-topology question is an engineering call, not a Founder one, and remains undecided either way (does not bear on §6's role content).
- **A further Engineering-Lead-owned entry** (`decision-register.md:1044-1052`, "state models for support cases and bulk jobs") — `Founder decision required: No`, unresolved, `Affected documents: TRD18` — relevant only to `ENG-P3-003G` (bulk import), already deferred by this design.

**Not found, after a full-text search of `decision-register.md`, `canonical-reference.md`, `documentation-changes-log.md`, and `requirements-traceability-matrix.md` for `TRD18`/`Chapter 18`/`Knowledge Studio`/`KnowledgeDraft`/`PlatformAdministrator`/`DEC-ADM`/`knowledge.`:**
- No Founder approval of TRD18 as a whole, or of Chapter 18 specifically, exists anywhere on merged `origin/main`.
- No Decision Register entry adopts `KnowledgeDraft`'s specific model shape (§18.20), the `knowledge.*` permission identifier list (§18.6), the `AdministrativeAuditRecord` field shape (§18.49), the publication-event names (§18.27), the bulk-import workflow (§18.26), or the `PlatformAdministratorDocument` schema (§18.10). These exist solely as TRD18 prose.
- `docs/00-governance/requirements-traceability-matrix.md` rows sourced from TRD Chapter 18 (`BR-091`–`BR-098`, `FR-RBAC-001`–`008`, `AAP-001`–`008`) are uniformly marked implementation status `Not Started`, and `AAP-002` ("No Universal Administrator") is explicitly annotated *"Affected by open decision(s) `DEC-GOV-007` — do not implement..."* — the RTM itself, independently, flags this exact area as gated on the same open decision.

**Supporting-standard content that *is* independently approved** (not TRD18-sourced, and unaffected by TRD18's status): `docs/03-standards/knowledge-studio.md` (`Status: Core Platform Service`, `Classification: Supporting Standard` — not "Draft") and `docs/03-standards/commerce-knowledge-standard.md` (`Status: Platform Standard`, same classification tier, explicitly named at Document Hierarchy rank 4). Their **principle-level** content — one taxonomy platform-wide; businesses select, never create, the first six levels; businesses may suggest but never publish directly, and suggestions enter "a review workflow"; AI assists but never independently publishes — is approved, standing authority, independent of TRD18. Their prose does not specify *how* review/approval is implemented (no schema, no role names) — that mechanical detail is still TRD18-only.

### 2A.3 A/B/C authority classification of every material design element

| Element | Class | Basis |
|---|---|---|
| **General principle: privileged/editorial actions go through a governed review workflow before publication; businesses may suggest but never publish directly; AI never independently publishes** | **A** | `commerce-knowledge-standard.md` Part XIV, `knowledge-studio.md` "Knowledge Governance"/"AI Readiness" — both approved Supporting Standards, independent of TRD18. |
| **General principle: privileged actions are attributable/auditable; platform administrators require MFA; admin access is permission-scoped** | **A** | `DEC-SEC-002` (CONFIRMED); PRD Section 10 Business Rules `BR-092`/`BR-098` (RTM rows, PRD-sourced — PRD ranks above TRD in the hierarchy). |
| **Canonical `KnowledgeNode`/`KnowledgeTag` lifecycle (5-value, frozen) and `KnowledgeTranslation` lifecycle (3-value)** | **A** — **not reopened by this design** | `DEC-DATA-005` (RESOLVED). Unchanged by §7/§8 of this design. |
| **Existence of a separate `PlatformAdministratorDocument`/platform-administrator identity model, distinct from Business membership** | **B** | TRD18 §18.10 only. No Decision Register entry. Architecturally reasonable (a Business-role evaluator cannot express an actor with no `businessId`), but the Founder has not approved that this new identity model should exist. |
| **Platform administrator role vocabulary (`knowledge_editor`, `knowledge_approver`, and treating `platform_super_administrator` as holding both by default)** | **B — explicitly inside the open, blocking `DEC-GOV-007`** | TRD18 §18.5.1/§18.5.5–18.5.6 only. `DEC-GOV-007` is precisely the "which of TRD18's eleven roles" question, unresolved. Must not be presented as settled. |
| **Knowledge permission identifiers (`knowledge.view`, `knowledge.create_draft`, etc.)** | **C**, contingent on the B-item above | Pure naming; cheap to rename; does not change product/governance semantics once *which roles/capabilities exist* is Founder-approved. |
| **`KnowledgeDraft` collection/model (separate from the published node)** | **B** | TRD18 §18.20 only. No Decision Register entry. This design's own recommended reconciliation (§4) for keeping `DEC-DATA-005` frozen while still supporting an edit-in-progress state — architecturally the cleanest option found, but a genuinely new persisted concept, not yet Founder-approved. |
| **Draft lifecycle (`draft → in_review → approved → rejected/published`)** | **B** | TRD18 §18.19–§18.20 only. Does not touch `DEC-DATA-005` (which governs the *node's* status, unchanged) but is itself an unconfirmed new vocabulary. |
| **Reviewer/approver separation (self-approval structurally blocked)** | **B** | TRD18 §18.7/AR-007. General "separation of duties by responsibility" is named at PRD level (`BR-091`), but the specific self-approval mechanic is TRD18-only. |
| **Audit-record shape (`AdministrativeAuditRecord`'s exact fields)** | **C** | The *duty* to audit is A (above); TRD18 §18.49's specific field list is one reasonable engineering shape satisfying that duty, not the only one — renaming/reshaping it does not change governed semantics. |
| **Publication events (`knowledge.node_published.v1` naming)** | **C** | Pure eventing/naming detail; the underlying outbox/`DomainEvent` mechanism is an existing, TRD18-independent codebase convention. |
| **Bulk import (`knowledge.bulk_import`, TRD18 §18.26)** | **B, deferred** | TRD18-only; no Decision Register entry; already excluded from the near-term package sequence (`ENG-P3-003G`), so not an immediate Founder blocker, but must not be assumed pre-approved either. |
| **Business-suggestion handling — principle** | **A** | `commerce-knowledge-standard.md` Part XIV / `knowledge-studio.md` (above). |
| **Business-suggestion handling — specific mechanism (folded into `KnowledgeDraft.source:"business_suggestion"`, superseding TRD10 §10.3/§10.4's placeholder `knowledgeSuggestions` collection name)** | **B** | This design's own reconciliation proposal; reasonable, but a genuinely new schema decision, not independently confirmed. |
| **MFA requirement** | **A** (requirement) / **C** (enforcement mechanism) | `DEC-SEC-002` confirms the requirement on Founder authority; the *mechanism* is Engineering-Lead-owned per that same entry, not a Founder decision at all — downgraded from this document's original "Founder decision" framing. |
| **API/callable boundary (command names, typed-callable transport pattern, no direct Firestore write from the frontend)** | **C** | Follows the codebase's own existing, TRD18-independent transport convention (every current domain already works this way); naming is freely revisable. |

Every **A**-classified item stands regardless of TRD18's status and is not reopened by this correction. Every **B**-classified item is this document's recommendation, not a governed fact, and is consolidated into the smallest coherent Founder-decision set at §18 (renumbered below, expanded). Every **C**-classified item is left to the implementing engineering package's judgment once the relevant B-item (if any) is approved.

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
2. **Reuse the existing authorization *pattern*, not the existing catalogue — and treat the platform-administrator concept itself as a Founder-approval item, not a settled fact.** The Business-role permission evaluator (`Role = owner|manager|staff`, businessId-scoped) is structurally the wrong tool for a platform-staff actor with no `businessId` in scope at all — `ENG-P3-001-DESIGN-001` §13.2 says so, and TRD18 §18.10 proposes a wholly separate `PlatformAdministratorDocument` collection. **Per §2A, this whole idea — a new, disjoint platform-administrator identity/permission model — is Class B**: architecturally the right shape if built, but not yet Founder-approved to exist, and its specific role vocabulary (`knowledge_editor`/`knowledge_approver`) sits inside the open, blocking `DEC-GOV-007`. This design still specifies it, in the exact shape of `evaluatePermission.ts`/`authorizeAndExecute.ts` (pure evaluation function, dot-namespaced `PermissionId`, fail-closed default-deny, `checkAndReserveIdempotencyKey`-wrapped transactional composition), as the recommended answer — but §18 packages this as a Founder decision to make before `ENG-P3-003A`, not as pre-approved architecture.
3. **Scope to Knowledge Studio only, not the whole of TRD18 Chapter 18.** TRD18 describes a full Platform Administration application (Business Operations, Customer Support, Trust Reviews, Subscriptions, Rules Studio, Feature Flags, Emergency Controls, etc.). This design builds only the minimum platform-administrator authorization primitive Knowledge Studio itself needs (the `PlatformAdministratorDocument` collection, the Knowledge-scoped roles/permissions, one shared evaluator shape) — it does not design or scaffold any other administrative surface. A future, separately-authorized `ENG-P?-ADMIN-DESIGN-001` would extend the same primitive for other workspaces without re-deriving it.
4. **Resolve, don't defer, the one real tension found**: TRD18 §18.19 narrates a 6-stage object lifecycle (Draft → In Review → Approved → Published → Retired → Archived) while the implemented `KnowledgeLifecycleStatus` is 5-valued with no "approved" state. §8 below resolves this by locating "approved" on the **draft** object (which already carries its own 5-value `draft|in_review|approved|rejected|published` status per TRD18 §18.20), not on the canonical node — consistent with `DEC-DATA-005`'s own finding that "approved" and "published" carry no operationally distinct meaning for the canonical node/tag itself.
5. **Minimum lifecycle, minimum new mechanism.** No new concurrency/versioning/audit mechanism is invented where an existing one (transactional create-with-existence-check, `checkAndReserveIdempotencyKey`, the outbox/`DomainEvent` system) already fits.

## 5. Knowledge Studio scope and exclusions

**Knowledge Studio is:** the governed, platform-staff-only editorial interface for the Commerce Knowledge Layer — drafting, reviewing, approving, publishing, retiring, and translating `KnowledgeNode`/`KnowledgeTag` content, and triaging business-submitted suggestions, all through typed server commands over the existing frozen schema.

**Knowledge Studio is not:**
- A general-purpose Firestore CMS. The frontend never receives direct Firestore write access to `knowledgeNodes`/`knowledgeTags`/`knowledgeTranslations`/`knowledgeDrafts` — every mutation goes through a typed callable (§10). This is Class A on independent grounds: every domain in this codebase already follows this convention (§3/research — zero direct-Firestore-write precedent anywhere in `apps/web`), not merely a TRD18 recommendation (TRD18 AAP-001/AR-001 restates the same principle).
- A Business-facing feature. No Business `owner`/`manager`/`staff` role gains any Knowledge Studio access (§6). Businesses may only **suggest** (already-named `source: "business_suggestion"` on a draft) through the existing, separately-authorized onboarding/dashboard surface — designing that suggestion-capture UI is explicitly out of this task's scope (§9's "Explicit boundaries": "introduce merchant-controlled taxonomy authoring unless existing authority explicitly permits it" — it does not).
- A general platform-administration application. Business Operations, Customer Support, Trust Reviews, Subscriptions/Billing, Rules Studio, Feature Flags, and Emergency Controls (TRD18 §18.11–18.17, §18.29–18.48) are out of scope; only the minimal shared platform-administrator primitive they would eventually also use is designed here (§4.3).
- A subscription/billing feature. Not touched.
- A production data migration. No production data is migrated, moved, or modified by this document (§13 designs the approach only).

## 6. Roles and permissions

**Class B — design recommendation, not governed architecture (§2A).** Everything in this section is sourced from TRD18 §18.5/§18.6/§18.10, which has not been separately Founder-approved, and the specific role pair below sits inside the open, blocking `DEC-GOV-007` ("Which of TRD18's eleven administrator roles are staffed/enabled at MVP launch?", `Final decision: —`). This section states the recommended shape for Founder review, not a settled fact — see §18 for the exact decision this section is waiting on.

**Recommended new collection, per TRD18 §18.10 (reproduced, not altered):**
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

### 6.1 Roles (recommended, scoped to Knowledge Studio only; TRD18 §18.5.5–18.5.6, §18.5.1 — Class B, inside `DEC-GOV-007`'s open scope, §2A)

| Role | May | May not |
|---|---|---|
| **`knowledge_editor`** | Create/edit drafts (new or against an existing node/tag); propose translations; manage synonyms/search terms on a draft; view business suggestions and link them to an existing node or promote to a new draft; view published content. | Approve, publish, or retire without a separate approval (TRD18 §18.5.5, AAP-003). |
| **`knowledge_approver`** | Review submitted drafts; approve or reject; publish approved drafts; retire/replace existing published nodes. | Create drafts under this role alone is not restricted (TRD18 does not prohibit an approver also drafting), but **may not approve or publish their own draft** — separation of duties (§18.7, AR-007) is enforced at evaluation time, not merely by convention. |
| **`platform_super_administrator`** | Holds every `knowledge.*` permission by explicit role-default grant (not a code-level bypass — TRD18 AAP-002 "No Universal Administrator" is respected structurally: the evaluator still checks an explicit permission list for this role, it is simply pre-populated with all of them). May also invite/suspend other `PlatformAdministratorDocument` records. | Everything else in TRD18 Chapter 18 outside Knowledge Studio is out of this design's scope — this role's *other* administrative powers (Business Ops, Billing, etc.) are not designed here and must not be assumed implemented. |

For MVP staffing (§18.7: "one person may hold multiple roles, but the system shall still record which responsibility was exercised"), a single `PlatformAdministratorDocument.roles` array may legitimately contain both `["knowledge_editor","knowledge_approver"]` — the separation-of-duties rule (§6.3) is enforced per-action (self-approval blocked), not by preventing one person from holding both roles.

### 6.2 Permission identifiers (Class C, contingent on §6.1's Class-B role set being approved — §2A)

Recommended set, sourced from TRD18 §18.6 "Knowledge Studio" list (reproduced verbatim), dot-namespaced per the existing `PermissionId` regex `^[a-z][a-zA-Z0-9]*\.[a-z][a-zA-Z0-9]*$`: `knowledge.view`, `knowledge.create_draft`, `knowledge.edit_draft`, `knowledge.approve`, `knowledge.publish`, `knowledge.retire`, `knowledge.bulk_import`. These are freely renamable at implementation time — the naming carries no product/governance semantics — once §6.1's underlying role/capability set is Founder-approved.

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

**`KnowledgeNode`/`KnowledgeTag`/`KnowledgeTranslation` schema and lifecycle: Class A, not reopened.** Existing schema preserved unchanged: `KnowledgeNode`, `KnowledgeTag`, `KnowledgeTranslation`, `KnowledgeLifecycleStatus`, `TranslationLifecycleStatus`, all repository functions, all error factories. No field is removed or retyped. This rests on `DEC-DATA-005` (RESOLVED), independent of TRD18's status, and this correction does not touch it.

**`createdBy`/`updatedBy` additive fields: Class C.** An additive gap closed (§3's finding): `KnowledgeNode`/`KnowledgeTag` gain two new optional-at-the-type-level-but-always-populated-by-Studio fields, `createdBy: string` and `updatedBy: string`, matching TRD10 §10.7.1's original declaration (TRD10, not TRD18 — this specific field pair is independent of the TRD18 authority question). Seed-created nodes (which have no human actor) populate both with a fixed sentinel value `"system:seed"` (a plain string, not a Customer Identity id — the seed loader is not an authenticated actor and must not be misrepresented as one). This is additive to the Firestore document shape (existing documents without the field remain valid — the converter treats a missing value as `"system:seed"` on read, for the population of nodes seeded before this field existed) and does not change any existing transition rule, error type, or repository signature beyond passing the new field through `create*Persisted`/edit operations. **Note (§8 revises this further):** `updatedBy` alone is not treated as a reliable seed/Studio ownership marker — see §8's corrected seed-collision assessment.

**`KnowledgeDraft` model: Class B — design recommendation, not governed (§2A).** No Decision Register entry addresses this collection; it exists solely as TRD18 §18.20 prose. It is this design's own recommended reconciliation for keeping `DEC-DATA-005` frozen while still supporting an edit-in-progress state (§4), and is architecturally the cleanest option found — but it is a genuinely new persisted concept requiring Founder approval before `ENG-P3-003B` builds it (§18), not an implementation detail. Fields reproduced below per TRD18 §18.20, typed against this codebase's conventions, as the recommended shape if approved:
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
Collection (recommended): `knowledgeDrafts`. **Reconciliation proposed, Class B (§2A):** TRD10 §10.3/§10.4 names a collection `knowledgeSuggestions` ("Commerce Knowledge / Proposed additions awaiting review") with no schema of its own — a placeholder index row only. This design proposes folding that placeholder into the fuller `KnowledgeDraft` shape above (a business suggestion becomes one `source: "business_suggestion"` row among several draft origins, not a separate collection). This does not contradict any Decision Register entry — nothing has resolved either name — but it is this design's own proposed resolution, not an independently confirmed fact, and is bundled into §18's Founder-decision set alongside the rest of the `KnowledgeDraft` model.

**No change to `Business.primaryCategoryId`/`businessTypeId`, `RewardProgramVersion`, or any other domain's schema.**

## 8. Editorial lifecycle

**Class B overall — a design recommendation reconciling TRD18's narrative with `DEC-DATA-005`'s frozen enum, not a governed fact (§2A).** The reconciliation logic below is this document's central architectural contribution and, in this correction's judgment, remains the cleanest option found; it is presented here as the recommended answer to the Founder-decision item at §18, not as settled. **What *is* unchanged and Class A**: `DEC-DATA-005`'s 5-value `KnowledgeNode.status`/`KnowledgeTag.status` enum and its transition matrix are not reopened — this section proposes a new object (`KnowledgeDraft`) alongside them, never a change to them.

TRD18 §18.19's narrated 6-stage "canonical knowledge object" lifecycle (Draft → In Review → Approved → Published → Retired → Archived) is proposed to be implemented as **two separate, already-consistent lifecycles working together**, not as a sixth value bolted onto `KnowledgeLifecycleStatus`:

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
- **Audit — Class A duty, Class C shape (§2A).** *That* every privileged action (`knowledge.create_draft` submission, `knowledge.approve`, `knowledge.reject`, `knowledge.publish`, `knowledge.retire`) must be audited is already governed independently of TRD18 (`DEC-SEC-002` CONFIRMED: "admin access is permission-scoped and audited"; PRD Business Rules `BR-092`/`BR-098`). *What the audit record looks like* is an engineering choice — this design recommends `AdministrativeAuditRecord` (TRD18 §18.49's field list, reproduced as one reasonable shape, not the only one) written inside the same transaction as the action itself, mirroring `authorizeAndExecute.ts`'s existing `recordSensitiveDecision` step. Records are append-only (`knowledgeAuditRecords` collection; **not** reused from `identityAudit`, which §3/research confirms is a Customer-Identity-specific projection over a different event set, not a generic audit domain — a parallel, equally narrow, Knowledge-scoped audit writer is the correct-shaped reuse, not a cross-domain import).
- **Publication events (Class C)**: `knowledge.node_published.v1`, `knowledge.translation_published.v1`, `knowledge.node_retired.v1` are a recommended naming, emitted via the existing, unmodified outbox/`DomainEvent` mechanism (the same one `identityAudit` projects over, and a mechanism independent of TRD18's status) at the moment of publish/retire, inside the same transaction. This design does not build any **consumer** of these events (search-index refresh, onboarding cache invalidation) — none currently exists to update, and `DEC-TECH-008` (search technology) remains open and non-blocking; a consumer is future work, out of MVP scope.
- **Full historical snapshots are not required (Class C judgment).** `AdministrativeAuditRecord.beforeSnapshot`/`afterSnapshot` provide bounded before/after field diffs per action — sufficient for "who changed what and when" without a second full-document revision-history collection. This is the "avoid over-engineering" call: a full versioned-snapshot store was considered and rejected as unnecessary duplication of what the audit record plus the node's own `version` counter (existing, unmodified) already provide together.

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

**Frontend never gains direct Firestore write authority** to any Commerce Knowledge or `knowledgeDrafts`/`platformAdministrators`/audit collection — Class A, matching every existing domain's transport pattern (`apps/web` has no direct-Firestore-write precedent anywhere today), restated but not created by TRD18 AAP-001/AR-001. Reads needed for the editor UI (draft lists, node/tag/translation browsing, duplicate-candidate search) are also served through typed callables, not direct Firestore listeners, so the same permission evaluator gates both read and write — consistent with `commerceKnowledgeReadService.ts`'s existing pattern of a typed read service in front of Firestore, generalized here to also be permission-gated (unlike the public onboarding read service, which is intentionally ungated).

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
2. **Seed/Studio collision is a genuine, real risk (unchanged finding) — but the `updatedBy`-only guard originally proposed here is corrected as insufficient, per this task's explicit instruction to assess it carefully.** `ENG-P3-001-DESIGN-001` §10.5 already flagged, unresolved, that a rerun of `runCommerceKnowledgeSeed` could silently force a Studio-authored `draft`/`in_review` node forward to `active`. v1.0 of this document proposed guarding on `updatedBy === "system:seed"`. On reassessment, this is **not sufficient**, for three concrete reasons:
   - **It conflates two different concerns onto one field.** `updatedBy` is meant to answer "who last edited this, for display/audit" (§7); the seed guard needs to answer a structurally different question, "is this document still seed-owned, or has any editorial process ever claimed it." Overloading one mutable string field to answer both is fragile — a future engineer changing `updatedBy`'s population logic for a legitimate audit/display reason could silently break the seed guard's safety property without realizing it.
   - **It depends on every Studio write path reliably setting the field, with no independent verification.** If any future write path (an edit-in-place operation, or specifically a translation-only edit that does not necessarily touch the parent node's own `updatedBy`) fails to set it, the seed loader would still read `"system:seed"` (via §7's read-time fallback for an absent value, or a stale prior value) and could still silently clobber a live Studio edit. The failure mode is silent, not fail-closed — the opposite of this codebase's established convention (`commerceKnowledgeErrors.ts`'s fail-closed factories, the repository layer's existence-check-before-write pattern).
   - **It is not compatible with a node being merely *viewed* by Studio without being claimed.** This is not itself a defect of `updatedBy` (a read never changes it), but it illustrates that `updatedBy` was designed for a "who touched this most recently" audit purpose, not an ownership/ready-for-reseed decision, and conflating the two invites exactly this kind of edge-case reasoning that a dedicated field would avoid.

   **Corrected recommendation (Class B — a recommendation for a future implementation package to adopt, not implemented by this task):** a dedicated provenance/ownership marker, decoupled from `updatedBy`, e.g. `managedBy: "seed" | "studio"` on `KnowledgeNode`/`KnowledgeTag`/`KnowledgeTranslation`. Set once, at creation (`"seed"` for `runCommerceKnowledgeSeed`, `"studio"` for any Studio-originated create), and flipped to `"studio"` exactly once, unconditionally, the very first time *any* Studio write path (including a translation-only edit) touches a `"seed"`-provenance document — never flipped back. The seed loader's reconciliation guard then reads `managedBy` alone, never `updatedBy`, to decide whether it may transition a document forward on rerun. This keeps `updatedBy`'s existing audit/display meaning intact and gives the seed guard its own, single-purpose, harder-to-silently-break signal. **This is a genuine addition beyond `updatedBy` (one new field, one new write-time rule) — not implemented by this task,** consistent with the instruction not to implement the fix; `ENG-P3-003B` (§17) is corrected to build `managedBy`, not the `updatedBy`-only guard.
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
- **Firebase Emulator integration tests**: full draft lifecycle end-to-end (create → submit → approve → publish, for both new-node and edit-of-existing-node shapes), retirement-with-replacement via Studio, translation attach/publish, the `managedBy`-based seed/Studio collision guard (§13, point 2) exercised directly (seed a node, edit it via Studio to `in_review`, rerun seed, assert the node is left untouched), idempotent-publish-retry (duplicate `knowledgePublishDraft` call with the same idempotency key resolves as `"duplicate"`, never double-writes), audit-record creation on every privileged action, publication-event emission.
- **UI/E2E** (Playwright, following whatever pattern the Business dashboard's own tests use, if any exist — not independently confirmed in this research and to be re-verified by the implementing package): editor happy path (draft → submit), approver happy path (review → approve → publish), denied-access rendering for a caller with no `PlatformAdministratorDocument` or insufficient permission, self-approval UI block.
- **Role tests** (TRD18 §18.60): each role's allowed/denied action matrix (§6.1–6.2 table), suspended administrator denial, permission-change taking effect on next request (no client-side permission caching that could serve stale authorization).

## 17. Proposed implementation packages

**Gate corrected (`CORR-001`):** the seven-package decomposition below remains architecturally valid — the collision boundaries between packages are unaffected by the authority correction — but **`ENG-P3-003A` may not begin until the §18 Founder-decision bundle (`FD-KS-1`) is resolved**, since `A` is precisely "build the Class-B platform-administrator/role/draft-model baseline." v1.0 understated this as "its own fresh, narrow ... authorization"; it is a baseline-architecture approval, not a routine implementation kickoff.

Decomposed by actual complexity/collision boundary, following `ENG-P3-001-DESIGN-001` §28's own precedent (a design proposal, not itself an authorization to build):

| Package | Scope |
|---|---|
| **`ENG-P3-003A`** *(blocked on `FD-KS-1`, §18)* | Platform-administrator authorization primitive: `PlatformAdministratorDocument` model/repository, `platformKnowledgePermissionCatalogue.ts`, the platform-permission evaluator (§6, §14), no Knowledge-specific logic yet. |
| **`ENG-P3-003B`** *(blocked on `FD-KS-1`)* | `KnowledgeDraft` model, repository, lifecycle (§7–§8), the `createdBy`/`updatedBy` additive field close-out (§7), the corrected **`managedBy` provenance-based** seed/Studio collision guard (§13, point 2 — not the `updatedBy`-only guard v1.0 proposed). |
| **`ENG-P3-003C`** | Publish-path composition: `applyApprovedKnowledgeNodeEditPersisted`, the atomic new-node/edit/retirement publish transactions (§8–§9), audit record writer, publication events. |
| **`ENG-P3-003D`** | Transport layer: all `onCall` commands (§10), wired in `functions/src/index.ts`, idempotency-wrapped. |
| **`ENG-P3-003E`** | Frontend shell/routing: `PlatformAdministratorBoundaryPage`, `KnowledgeStudioShell`, `RequirePlatformPermission`, draft list + draft editor screens. |
| **`ENG-P3-003F`** | Frontend review workflow: review queue, suggestion triage, publish/retire actions, published-taxonomy browser with basic missing-translation surfacing. |
| **`ENG-P3-003G`** *(deferred, not MVP; also Class B, §2A)* | Bulk import UI (`knowledge.bulk_import`, TRD18 §18.26) and the fuller analytics dashboard (§18.28) — the seed script already covers bulk-loading needs today; building a UI for it is lower priority than closing the core editorial loop, and is explicitly flagged here as post-MVP rather than silently dropped. |

Each package would, per this codebase's established convention, begin with its own fresh, narrow Founder/engineering-lead implementation authorization, on top of (not instead of) `FD-KS-1` for `A`/`B` — this design authorizes none of them.

## 18. Decisions still requiring Founder input

**Corrected and expanded (`CORR-001`).** v1.0 listed three narrow items and, by omission, let the platform-administrator/role/draft-model baseline read as already-governed architecture. Per §2A, that baseline is Class B. This section now states the smallest coherent Founder-decision set actually needed before `ENG-P3-003A` can start, followed by the narrower items that remain (now correctly scoped).

### `FD-KS-1` — Knowledge Studio architecture baseline (blocks `ENG-P3-003A`/`B`; the one bundled decision, not five scattered ones)

Approve, decline, or amend, as a single coherent baseline:

1. **(a)** A separate `platformAdministrators` identity/membership model may be built, distinct from Business membership (§6, TRD18 §18.10) — narrowly scoping `DEC-GOV-007`'s still-open, broader "which of TRD18's eleven roles" question to just this: *does a platform-administrator concept get built for Knowledge Studio's own purposes.* This does not resolve `DEC-GOV-007` for the other nine TRD18 roles or any other administrative surface — those remain separately open.
2. **(b)** If (a) is approved, the MVP role set for Knowledge Studio is exactly `knowledge_editor` and `knowledge_approver` (plus a `platform_super_administrator` role that implicitly holds both) — §6.1's recommended table — rather than some other subset, collapsing, or a single combined role.
3. **(c)** Editorial content changes go through a separate `KnowledgeDraft` working object (§7–§8) — published `KnowledgeNode`/`KnowledgeTag` documents are never edited in place — with a `draft → in_review → approved → rejected/published` lifecycle kept fully distinct from, and never altering, `DEC-DATA-005`'s frozen node/tag status enum.
4. **(d)** An editor may never approve or publish their own draft — self-approval is blocked structurally, not merely by role assignment (§6.3).

**Why bundled rather than five separate questions:** (b)–(d) are not independently meaningful without (a) — there is no role subset, draft model, or separation-of-duties rule to approve if no separate platform-administrator concept exists at all. Presenting them as one coherent baseline (accept/reject/amend) is the smallest decision surface that actually unblocks `ENG-P3-003A`.

### Narrower items (Engineering-track or product-judgment; do not block `FD-KS-1` and are correctly scoped, not newly discovered)

1. **`knowledge.edit_draft` scope for `knowledge_editor`** (§6.2): may an editor edit *any* editor's draft, or only their own until submission? TRD18 does not specify. This design defaults to "any," matching the low-staffing MVP assumption (§18.7's source text) and the fact that a draft is a shared work-in-progress artifact, not personal state — a product-judgment call, not a governed fact, to be confirmed once `FD-KS-1` is approved.
2. **MFA enforcement mechanism**: corrected — the *requirement* is already Class A (`DEC-SEC-002`, CONFIRMED), so this is **not** a Founder decision. `DEC-SEC-002` itself records the mechanism as `Decision owner: Engineering Lead` — an engineering-track item to settle before `ENG-P3-003A` is fully specified, not a Founder blocker.
3. **`platform_super_administrator` bootstrap path** (first-administrator enrollment): TRD18 does not specify one, and none is designed here. Genuinely open, but only relevant once `FD-KS-1` is approved and `ENG-P3-003A` is scoped — an implementation-package-level question, not a prerequisite to approving the baseline itself.

## 19. Files modified

- `docs/05-implementation/roadmap/ENG-P3-003-DESIGN-001-knowledge-studio-architecture-delivery-design.md` (amended in place, v1.0 → v1.1, `CORR-001`, on the existing PR #223 branch — not rewritten from scratch)
- `docs/00-governance/documentation-changes-log.md` (Entry 158 added)

No other file modified. No `functions/`, `apps/web/`, Firestore Rules, CDR-001, Decision Register, Engineering Implementation Programme, or Coding-Agent Prompt Register edit made. Nothing in `docs/02-technical/trd/18-platform-governance-and-administration.md` itself was edited — TRD18's own content and status are unchanged; only this design's *treatment* of that content was corrected.

## 20. Diff summary

One design document amended (header version-history block; §2 note superseded; new §2A classification section inserted; §4 point 2, §6/§6.1/§6.2 intros, §7's `KnowledgeDraft` intro and collection-reconciliation paragraph, §8's opening framing, §9's audit/events/snapshot bullets, §13 point 2 (seed-collision guard corrected from `updatedBy`-only to `managedBy` provenance field), §17 (package gating, `ENG-P3-003B` scope correction), §18 (rewritten as the `FD-KS-1` bundle plus corrected narrower items), §24 (risks) all revised); one changes-log entry added. No application code, schema, configuration, or roadmap/programme/decision-register content changed. No TRD18 file edit.

## 21. Commands executed

`git fetch origin`; `git rev-parse origin/main` (re-verified unchanged at `cd7c758`); `git worktree add <scratch-path> docs/eng-p3-003-design-001-knowledge-studio-architecture` (reused the existing PR #223 branch, not a fresh branch); `grep`/`sed`/file reads across `docs/00-governance/decisions/decision-register.md`, `docs/00-governance/canonical-reference.md`, `docs/00-governance/requirements-traceability-matrix.md`, `docs/00-governance/documentation-changes-log.md`, `docs/02-technical/trd/*.md` (all 23 chapter headers), `docs/03-standards/*.md` headers; `git add`/`git commit`/`git push` (amending the existing branch); no new PR created — the correction lands as a new commit on PR #223 (no merge).

## 22. Dependencies added

None.

## 23. Config/application changes

None.

## 24. Risks

- **Authority-boundary risk — corrected by this task, not eliminated as a class.** v1.0 presented TRD18-sourced content as controlling architecture without checking for a blocking Decision Register conflict; `DEC-GOV-007` turned out to be exactly that. This correction fixes the specific instance found; a general residual risk remains that other design tasks drawing on draft-status TRD content should independently check the Decision Register for on-point open decisions before treating that content as settled, rather than assuming TRD rank-3 status alone suffices.
- **Seed/Studio collision** is a genuine, previously-flagged, real risk if a collision guard is not implemented before any Studio write path ships — the seed script as it exists today would silently overwrite a Studio-authored, still-`in_review` node on any rerun. §13's `managedBy` provenance-field recommendation (corrected from the insufficient `updatedBy`-only guard) specifies the fix; it does not implement it, and remains B-classified (a recommendation) rather than a governed fact.
- **Two-evaluator surface area**: introducing a second, structurally disjoint permission evaluator (§6.4) is deliberate, but doubles the code surface a future auditor must reason about compared to a single unified evaluator — accepted here as the recommended shape *if* `FD-KS-1(a)` is approved; unifying them would require forcing a `businessId` concept onto an actor who has none, per `ENG-P3-001-DESIGN-001` §13.2's own recommendation.
- **`PlatformAdministratorDocument` bootstrap gap**: until a first-administrator bootstrap mechanism is decided, no implementation package can be meaningfully tested end-to-end against a real deployed environment (emulator tests can seed the collection directly, so this does not block `ENG-P3-003A`–`F`'s own test suites once `FD-KS-1` is approved).
- **If `FD-KS-1` is declined or materially amended**, §6–§9's specific shapes (role names, `KnowledgeDraft` fields, permission identifiers) would need rework, though §3–§5's factual findings (existing implementation, scope boundary) and the general architecture strategy (§4: preserve existing schema, separate evaluator, minimal scope) would still hold regardless of exactly which roles/model shape the Founder ultimately approves.

## 25. Rollback instructions

`git revert` of this task's commit on the PR #223 branch — cleanly separable from the original v1.0 commit; reverting restores v1.0's text (which would restore the authority-boundary problem this task corrects, so a revert should not be used to "simplify" without also re-applying an equivalent fix) with no effect on any other file, since nothing else was touched.

## 26. Markdown implementation/design report

This document (v1.1, amended in place).

## 27. Persistent `.md` changes-log entry

`docs/00-governance/documentation-changes-log.md` Entry 158 (added in the same commit as this amendment).

## 28. PR/head SHA and exact-head CI status

Recorded after commit/push on the existing PR #223 branch — see the accompanying summary for the exact new head SHA and CI status; not self-merged.

## 29. Confirmation FD-COM-001 remained untouched

Confirmed. This task worked exclusively in an isolated worktree checked out from the existing `docs/eng-p3-003-design-001-knowledge-studio-architecture` branch (itself branched from `origin/main` at `cd7c7589347e2de5a552dea52908265e8a91dcd0`, re-verified unchanged before this task began). The primary working directory, which holds unrelated uncommitted `FD-COM-001` commercial-model changes, was never opened, read, staged, committed, stashed, reset, or otherwise altered by this task.

## 30. Confirmation no implementation began

Confirmed. No file under `functions/src`, `apps/web/src`, `firestore.rules`, or any Firebase/deployment configuration was created or modified. No new npm dependency was installed. No `onCall`/`onRequest` export was added to `functions/src/index.ts`. No collection, model, or code was added. `ENG-P3-003` remains `Not started` in `CDR-001`'s own terms; `ENG-P3-003A` remains not started and is now explicitly gated on `FD-KS-1` (§18), not merely "its own fresh authorization" as v1.0 understated.

---

**Success gate:** `ENG-P3-003 DESIGN AUTHORITY BOUNDARY CORRECTED — GOVERNED BASELINE SEPARATED FROM FOUNDER-APPROVAL ITEMS — IMPLEMENTATION REMAINS NOT AUTHORIZED`
