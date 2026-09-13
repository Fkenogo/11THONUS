# PLATFORM-BASELINE-005 — Reward Program Entry & Technical Design

**Type:** Read-only architecture/design package. No implementation performed.
**Date:** 2026-09-13
**Assessed by:** Claude Sonnet 5, on behalf of Fkenogo, using three parallel read-only research agents plus direct source verification.

---

## 1. Executive Summary

**The question this design answers:** what is the smallest technically complete, governance-safe Reward Program foundation 11thONUS can implement now, on the PostgreSQL loyalty spine, without prematurely deciding unresolved loyalty mechanics?

**Answer, in short:** a two-table PostgreSQL model — `reward_programs` (stable identity/current status) and `reward_program_versions` (immutable, versioned commercial terms) — plus one new server permission entry family, is fully supported by existing governed authority and can be implemented today. The two genuinely open Founder decisions in this domain (`DEC-LOY-008` overflow allocation, `DEC-LOY-013` pause/migration/seasonal variants) govern **downstream Loyalty-domain mechanics and lifecycle edge cases**, not Reward Program CRUD/versioning itself — a careful reading of both decisions' own text confirms neither blocks create/read/update-draft/publish-first-version. `DEC-LEGAL-002` (Business Terms, `OPEN_LEGAL`) blocks a **real** Business from ever reaching `trial` in a live environment, but per this task's own framing and confirmed by direct inspection of the existing test-only Terms fixture and emulator-fixture conventions, it does not block schema/design/implementation work validated against emulator/fixture Business state.

**Verdict: YES — IMPLEMENTATION READY**, for a narrowly-bounded `PLATFORM-BASELINE-005A` package (schema, permissions, CRUD, first-version creation and publish; explicitly excluding Loyalty Cycle, Purchase, Verified Units, Reward issuance, and Redemption).

**[Updated by `FOUNDER-DISPOSITION-001` — see the Founder Disposition section near the end of this document.]** No further Founder decision blocks `PLATFORM-BASELINE-005A`: the Founder has since explicitly confirmed the two points this design's own analysis had flagged as needing confirmation (PostgreSQL persistence authority for Reward Program; exclusion of pause/retire/archive from the first package), rather than the design resting on its own self-assessment that none was needed. Two flagged discussion items (permission catalogue extension convention; whether "publish" is a distinct action from "activate") remain procedural clarifications, not blocking gates.

---

## 2. Exact Assessed SHA

```
origin/main (fetched fresh): 5ee3bcd8c157ae62416e5822f4270e96584a04d0
```

This is exactly the SHA named in the task as "PLATFORM-BASELINE-004A merge commit" — `main` has not advanced. Confirmed via `git fetch --all --prune && git rev-parse origin/main`.

## 3. Repository / Worktree State

- **Primary worktree** (`/Volumes/PRODUCTION/Projects/11THONUS`) remains on `docs/dec-legal-002-bt-draft-007` with in-progress legal-drafting changes. **Not touched, stashed, reset, cleaned, or committed** by this task.
- **Isolated design worktree** created at the exact `origin/main` SHA: `git worktree add /private/tmp/11thonus-pb005-design origin/main -b docs/platform-baseline-005-reward-program-entry-design`. All research and this report were produced read-only inside it.
- No infrastructure, Firebase project, or PostgreSQL instance was provisioned or modified. No migration was created or run. No dependency was installed.
- A related, uncommitted-to-`main` prior assessment (`docs/platform-baseline-004-business-config-readiness-assessment` branch, commit `e0ac67e`, in a separate scratch worktree) was found and read for context — it independently reaches compatible conclusions about Reward Program entry readiness (its own §13/§23/§27). It is cited below as corroborating, non-authoritative background, not treated as canonical.

## 4. Documents Reviewed

- `docs/00-governance/canonical-reference.md` (domain ownership §6, state models §7, glossary §8)
- `docs/00-governance/decisions/decision-register.md` (`DEC-LOY-001/005/008/009/011/013`, `DEC-SUB-003/004/005/007`, `DEC-LEGAL-002`, `DEC-DATA-008`, `DEC-ID-003`)
- `docs/00-governance/decisions/assumptions-register.md` (`AS-009/010/011`)
- `docs/01-product/prd/06-reward-programs-and-loyalty-cycles.md` (full document)
- `docs/02-technical/trd/10-firestore-data-architecture.md` §§10.7 (Commerce Knowledge), 10.9 (Reward Program), 10.10 (Purchase), 10.11 (Loyalty), 10.12 (Reward)
- `docs/03-standards/commerce-knowledge-standard.md` (full document)
- `docs/05-implementation/reports/DATA-ARCH-001-pre-pilot-persistence-architecture-reassessment-2026-09-08.md` (PostgreSQL authority recommendation table)
- `docs/05-implementation/reports/platform-baseline-001-postgres-foundation-implementation-report-2026-09-11.md` and its `-CORR-001` (PostgreSQL infrastructure actually built; re-read closely under `CORR-001` below — it ships an empty migrations directory and creates no loyalty-spine table, and its mention of `reward_programs`/`reward_program_versions` is a disclaimer of what it explicitly did *not* build, not a reservation of those names as authoritative)
- `docs/05-implementation/reports/platform-baseline-004a-workforce-integration-implementation-report-2026-09-12.md` and `-CORR-001` (idempotency-correction precedent to avoid repeating)
- `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md`, `docs/05-implementation/change-tracking/engineering-implementation-programme.md` (Phase 4 / `ENG-P4-001`/`002` status)
- Code: `functions/src/config/loyaltyInvariants.ts`; `functions/src/domains/business/models/businessStatus.ts`; `functions/src/domains/permissions/models/{sensitivePermissionCatalogue,ordinaryPermissionCatalogue}.ts`; `functions/src/domains/permissions/evaluator/evaluatePermission.ts`; `functions/src/domains/permissions/service/authorizeAndExecute.ts`; `functions/src/domains/commerceKnowledge/models/{knowledgeNodeType,referenceEligibility}.ts`; `functions/src/infrastructure/postgres/{postgresTransaction,migrationRunner,postgresConfig}.ts` and `migrations/README.md`
- Non-canonical files noted but **not** treated as authoritative, per the existing repository convention: `docs/00-governance/verified-loyalty-governance-freeze-v1.md`, `verified-loyalty-principles.md` (reference `DEC-LOY-014`/`015`, which do not appear in the canonical `decision-register.md` at this SHA)
- Uncommitted-to-main prior assessment: `PLATFORM-BASELINE-004-business-configuration-readiness-assessment-2026-09-12.md` (separate scratch worktree, branch `docs/platform-baseline-004-business-config-readiness-assessment`) — corroborating background only

## 5. Authority Matrix

| Concept | Governing authority | Status | Exact confirmed rule | Unresolved point | Implementation consequence |
|---|---|---|---|---|---|
| Business ownership of Reward Program | canonical-reference.md §6 (domain ownership table) | Confirmed | "Reward Programs" is domain-owned by the platform's Reward Programs domain; a program belongs to exactly one `businessId` (TRD10 §10.9.1) | — | `reward_programs.business_id` is a required, immutable foreign reference |
| Business lifecycle eligibility | `businessStatus.ts`; `ordinaryPermissionCatalogue.ts` pattern | Confirmed (structural); Reward-Program-specific eligibility set is new | 8-state Business lifecycle exists; no register entry restricts Reward Program creation to `active` only | Exact eligible-status list for `rewardProgram.manage` is a new catalogue entry, not a Founder decision | Must define `eligibleBusinessStatuses` for the new permission, following the existing `PROFILE_EDIT_ELIGIBLE_STATUSES` pattern |
| Threshold | `DEC-LOY-001` (CONFIRMED); `loyaltyInvariants.ts` | Confirmed, fixed | `requiredVerifiedUnits = 10`, fixed platform rule, not business-configurable, "stored in versioned configuration" | Future configurability requires "formal product approval" | Store as a per-version snapshot value constrained to `10` by CHECK constraint, sourced from the same code constant `functions/src/config/loyaltyInvariants.ts` already defines — never business-editable |
| Reward quantity | `DEC-LOY-009` (CONFIRMED 2026-09-11); `loyaltyInvariants.ts` | Confirmed, fixed | `rewardQuantity` fixed at exactly `1` for every launch program; "schema may reserve a future extension point but must not expose it as configurable now" | Any `>1` support requires a new governed decision | Store as a per-version snapshot value constrained to `1` by CHECK constraint; do not build a "reserved extension point" column now (nothing to reserve without a governed shape) |
| Reward description | PRD6 §4.3; TRD10 §10.9.2 | Confirmed field, ungoverned content | `rewardDescription: string`, business-authored free text | No content mandate | Free-text column, required, length-bounded only for storage sanity |
| Reward Program category | Commerce Knowledge Standard Part VII; TRD10 §10.9.1 | Confirmed | `rewardProgramCategoryId` references a `reward_program_category`-type `KnowledgeNode` | Category taxonomy content (Part VII examples) is deliberately unseeded beyond Salon (`ENG-P3-001B` finding) — an operational/content gap, not an authority gap | Reference validated the same way `Business.primaryCategoryId` is (active-status, correct node type), reusing the existing `isEligibleForNewReference` predicate |
| Qualifying Knowledge Nodes | TRD10 §10.9.2; `knowledgeNodeType.ts`; `referenceEligibility.ts` | Confirmed | `qualifyingKnowledgeNodeIds: string[]` must reference `standard_product`/`standard_service`-type nodes (the only leaf types under `reward_program_category`) | Same seeding gap as above | Validate node type + `active` status at draft-save and again at publish time (§13c); do not invalidate historical versions when a node is later retired (`isResolvableForExistingReference`) |
| Display names / Business wording | Commerce Knowledge Standard Part XIII | Confirmed | "Reward Program display name" is one of the four free-text fields a Business may type (vs. select) | — | `displayName` (on `reward_programs`) is business-authored free text |
| Effective dates | TRD10 §10.9.2 | Confirmed field, ungoverned policy | `effectiveFrom`/`effectiveUntil?` fields exist | No confirmed lead-time/scheduling policy | Store both; do not build a scheduling/notification mechanism not requested |
| Versioning | TRD10 §10.9.2 "Version Integrity Rule"; PRD6 §6 | Confirmed | Every Purchase Record and Loyalty Cycle "shall reference the applicable Reward Program version"; "the system shall never rewrite historical cycle rules" | — | Published versions are immutable; program identity is stable across versions (§10–§11) |
| Active/inactive/paused/retired/archive semantics | canonical-reference.md §7; PRD6 §5 | Confirmed states, **partially unresolved transition semantics** | Exactly 5 states: `draft · active · paused · retired · archived` (no `scheduled`, no `superseded` at the *program* level — `superseded` is a *version*-level state per TRD10 §10.9.2) | `DEC-LOY-013` leaves pause-preserves-progress a confirmed *product intent* (PRD6 §5 already documents it) but Founder-level confirmation is open | Implement `draft/active/paused/retired/archived` as the closed `reward_programs.status` enum now; do not invent a `scheduled` state |
| Program replacement | `DEC-LOY-013` (OPEN_FOUNDER) | **Open** | Question (b): "may businesses migrate customers between Reward Programs" — unresolved | Blocks: any cross-program customer migration mechanism | Do not build migration; a retired program's historical cycles simply remain valid in place (already-governed PRD6 §5 "Retired" semantics) |
| Seasonal variants | `DEC-LOY-013` (OPEN_FOUNDER) | **Open** | Question (c): "seasonal variants under one Loyalty Cycle" — unresolved | Blocks: any seasonal-variant data model | Do not build; out of scope for this package regardless |
| Cycle behavior dependency | `DEC-LOY-008` (OPEN_FOUNDER, highest-priority per engineering-implementation-programme.md) | **Open** | Overflow Verified Unit allocation policy — governs what happens *inside a Loyalty Cycle*, a different domain (Loyalty, not Reward Programs, per canonical-reference.md §6) | Blocks: Loyalty Cycle/overflow implementation (Phase 7) | Does **not** block Reward Program schema, CRUD, or publication — `threshold`/`rewardQuantity` are program-version facts the Loyalty domain will *read*, not compute |
| Overflow allocation dependency | `DEC-LOY-008` | Open | as above | as above | Reward Program exposes `requiredVerifiedUnits`/`rewardQuantity` as read-only facts; how a future Loyalty Cycle consumes them is explicitly out of this package's scope |
| Trial eligibility | `DEC-SUB-003` (OPEN_FOUNDER) | Open | Trial *exists* (TRD17 §17.11, confirmed); its duration/volume structure is unresolved | Blocks: trial-expiry/conversion mechanics (Phase 10 billing) | Does not block: a `trial`-status Business creating/publishing a Reward Program (nothing in the register conditions program creation on trial-structure resolution) |
| Subscription/plan capacity | `DEC-SUB-004` (CONFIRMED) | Confirmed | "Plan capacity limits count **active Reward Programs**" | Exact plan capacity numbers (`DEC-SUB-008`) remain open | Server-side capacity check before a program may transition to `active` is a **design requirement**, but the actual numeric limits are not needed to build the mechanism — treat the limit as an injected, currently-unconfigured value (fail-open/no-limit is wrong; the correct interim stance is documented in §17) |
| Programme terms | `DEC-LEGAL-002` (OPEN_LEGAL) | Open, unrelated to program *content* | Business Terms (the platform-Business contract) is a separate instrument from a Reward Program's own `rewardDescription`/qualifying-scope | Real Business cannot reach `trial` until Terms are configured | Does not block Reward Program *schema/design*; blocks only *live* Reward Program creation by a real Business (§21) |
| Auditability | AP-007 (canonical-reference.md); existing outbox pattern | Confirmed pattern, not yet applied to this domain | Every domain command in this codebase writes an atomic audit/outbox event in the same transaction as its mutation | — | New PostgreSQL-transactional outbox entries for create/publish/retire (§26) |
| Permissions | `DEC-ID-003` (CONFIRMED); `ordinaryPermissionCatalogue.ts`/`sensitivePermissionCatalogue.ts` | Confirmed pattern; no `rewardProgram.*` entry exists yet | Permission inheritance model confirmed; sensitive permissions never implicit | Which catalogue (ordinary vs. sensitive) a new `rewardProgram.*` entry belongs to is a design choice this document makes (§12), not yet Founder-recorded | A new catalogue entry (either table) requires the same kind of Founder/engineering-lead sign-off `ORDINARY_PERMISSION_CATALOGUE`'s header comment describes for its own four entries — procedural, not a blocking gate |

No contradiction was silently resolved. Every "Open" row above is carried into §34 as background, and none of them appears in §34's list of genuine *new* Founder decision gates — because none of them blocks the CRUD/versioning scope this design recommends (§36).

## 6. MVP Fixed / Business-Configurable Matrix

| Field | Classification | Basis |
|---|---|---|
| `requiredVerifiedUnits` | **FIXED PLATFORM RULE** (= 10) | `DEC-LOY-001`; `loyaltyInvariants.ts::REQUIRED_VERIFIED_UNITS_MVP` |
| `rewardQuantity` | **FIXED PLATFORM RULE** (= 1) | `DEC-LOY-009`; `loyaltyInvariants.ts::REWARD_QUANTITY_FIXED` |
| `displayName` (program) | **BUSINESS CONFIGURABLE** | Commerce Knowledge Standard Part XIII (free-text) |
| `rewardProgramCategoryId` | **BUSINESS CONFIGURABLE** (select, not type) | Commerce Knowledge Standard Part XIII; PRD6 §4.1 |
| `qualifyingKnowledgeNodeIds[]` | **BUSINESS CONFIGURABLE** (select from catalogue) | PRD6 §4.2; TRD10 §10.9.2 |
| `businessDisplayProductNames[]` | **BUSINESS CONFIGURABLE** | TRD10 §10.9.2; CKS-003 (business display aliasing) |
| `standardRewardNodeId` | **BUSINESS CONFIGURABLE** (optional) | TRD10 §10.9.2 |
| `rewardDescription` | **BUSINESS CONFIGURABLE** | PRD6 §4.3 |
| `multipleUnitsAllowed` | **BUSINESS CONFIGURABLE** | PRD6 §4.2 ("Multiple Units Allowed") |
| `sharedLoyaltyNumberAllowed` | **BUSINESS CONFIGURABLE** | PRD6 §4.2/§4.6; canonical-reference.md §domain table ("shared-number policy") |
| `bulkReviewThreshold` | **BUSINESS CONFIGURABLE** (optional) | PRD6 §4.6 |
| `effectiveFrom`/`effectiveUntil` | **BUSINESS CONFIGURABLE** | TRD10 §10.9.2 |
| `status` (program) | **SYSTEM GENERATED** (transitions via governed commands only) | PRD6 §5 |
| `status` (version) | **SYSTEM GENERATED** | TRD10 §10.9.2 (`draft/active/superseded`, server-computed on publish) |
| `version` (number) | **SYSTEM GENERATED** (monotonic per program) | TRD10 §10.9.2 |
| `id` (program, version) | **SYSTEM GENERATED** | standard pattern |
| `currentVersionId` | **DERIVED** (system-maintained pointer) | TRD10 §10.9.1 |
| `createdAt/createdBy/updatedAt/updatedBy` | **SYSTEM GENERATED** | standard pattern |
| Internal Cost Estimate | **DEFERRED / NOT YET GOVERNED** | PRD6 §4.3 lists it as "(optional)" with no further TRD schema field — not present in TRD10's actual `RewardProgramVersionDocument`; do not add a column for a field the TRD itself never froze |
| Reminder Policy, Pending Expiry Policy, Dispute Handling Policy (§4.5) | **DEFERRED / NOT YET GOVERNED** | PRD-level only; no TRD10 field exists; these are Purchase/Verification-domain concerns, not Reward Program fields |
| Quantity Review Threshold, "Future AI review settings" (§4.6) | **DEFERRED / NOT YET GOVERNED** | Same — PRD-level only, no TRD10 field |
| Future `rewardQuantity > 1` support | **DEFERRED / NOT YET GOVERNED**, explicitly blocked | `DEC-LOY-009` text itself |
| Configurable thresholds beyond 10 | **DEFERRED / NOT YET GOVERNED**, explicitly blocked | `DEC-LOY-001` text; PRD6 §28 open question |

This matrix directly drives §22's schema: only the confirmed TRD10 fields get columns; PRD-only aspirational fields with no TRD schema counterpart are not implemented.

## 7. Reward Program Bounded Context

**Owns** (per canonical-reference.md §6 domain table, "Reward Programs: Reward Program identity, versions, commercial configuration, shared-number policy, state"):
- Business association (`businessId`)
- Versioned programme definition (`reward_program_versions`)
- Reward description and qualifying scope (fields on the version)
- Activation/effective state (`status` on both program and version)
- Version history (immutable prior versions)

**Explicitly does NOT own** (per canonical-reference.md §6's disjoint domain rows and TRD10's collection separation):
- **Purchase** — Purchase Records, disputes, corrections (`Purchase` domain, TRD10 §10.10)
- **Verification** — customer verification decisions (part of the Purchase Record lifecycle, not a Reward Program concern)
- **Verified Units** — the sole calculation unit (`Loyalty` domain, TRD10 §10.11.1)
- **Loyalty Cycle** — per-customer progress containers (`Loyalty` domain, TRD10 §10.11.2)
- **Reward issuance** — `rewards` documents (`Reward` domain, TRD10 §10.12.1)
- **Redemption** — On Us Moment creation (`Reward` domain)
- **Subscription accounting** — plan capacity *counting* happens elsewhere (`Subscription` domain reads Reward Program's `status`, Reward Program does not read Subscription's ledger)
- **CRM/customer identity/Business identity** — all owned by `Identity`

This mirrors AP-RP-001 (PRD6 §27): "Reward Programs are commercial configurations. They are not inventory items."

## 8. PostgreSQL Authority Decision

**[Corrected by `CORR-001`, 2026-09-13 — see the CORR-001 section near the end of this document for the full re-verification. The paragraph below is the corrected version; the original claim in item 3 below has been fixed in place rather than left standing, per `CORR-001`'s instruction to correct this everywhere it appears.]**

**Verdict: Reward Program configuration/version data should be PostgreSQL-authoritative — as an architectural direction, confirmed by evidence below. The specific table names and schema in §22 are a new proposal of this design, not an inherited or previously-reserved schema.** Evidence, not invention:

1. `DEC-DATA-008` (CONFIRMED) establishes PostgreSQL as the platform's target authoritative durable transactional datastore, with the caveat that the decision itself "authorises no provisioning, schema, dependencies, data migration... or combined-programme start." This is general architectural direction, not a domain-by-domain assignment.
2. `DATA-ARCH-001`'s recommendation table (the evidentiary basis for `DEC-DATA-008`) assigns "Purchase, verified units, cycles, rewards, redemptions" and "rules/knowledge configuration" to PostgreSQL. **It does not name "Reward Program(s)" by that literal string anywhere in the document** (confirmed by direct grep — zero matches). The analogy to "Rules" (both domains being "definitions, versions, assignments/effective-resolution" per canonical-reference.md's ownership table) is a reasonable structural inference this design draws, not a direct statement of the source document.
3. **Corrected (was inaccurate in the original version of this report):** `PLATFORM-BASELINE-001`'s implementation report and its `migrations/README.md` do **not** reserve or create `reward_programs`/`reward_program_versions`. Re-read directly: "**None**, beyond the migration mechanism's own `schema_migrations` bookkeeping table... The package's real `migrations/` directory ships empty... No `reward_programs`, `reward_program_versions`, ... was created" (`PLATFORM-BASELINE-001` report §9) — this is an explicit, complete disclaimer of non-creation, listing those names only as examples of what this package's scope excluded, not as a schema it defined or reserved. The report does attribute its own build-the-transaction-seam authority to a "Founder-approved design," `PLATFORM-BASELINE-DESIGN-001-CORR-001`, and uses those same table names when describing what it did not build — but that design document is **not itself a tracked, readable file in this repository** (confirmed absent by repo-wide search), so its exact content, and whether it truly assigned those specific names, cannot be independently verified here. This is **second-hand, unverifiable naming provenance**, correctly distinguished from primary canonical text (TRD10, the decision register, the PRD) throughout the rest of this report. The architectural *direction* (PostgreSQL-authoritative for this cluster of domains, which `PLATFORM-BASELINE-001` itself consistently calls the "loyalty spine") is corroborated by this same evidence and is retained; the specific *table names* are not inherited from it.
4. **Conclusion: PostgreSQL architectural authority for Reward Program is retained** (item 1 direction + item 2's structural analogy + item 3's corroborating, if unverifiable-in-full, "loyalty spine" framing, together are sufficient — none of them alone would be, but they are consistent and no contrary authority was found anywhere in the reviewed source chain). Per this task's own instruction to distinguish architectural authority from schema naming: **the table names `reward_programs`, `reward_program_versions`, `reward_program_version_qualifying_nodes` in §22 are PROPOSED BY PLATFORM-BASELINE-005** — new naming from this design task, informed by TRD10 §10.9's already-canonical Firestore field names converted to `snake_case` convention, not inherited, reserved, or previously assigned by any other package.
5. **No dual authority is proposed.** Firestore remains authoritative for Business, Branch, Identity, Membership, and Commerce Knowledge exactly as it is today — nothing in this design touches those collections or their repositories. Reward Program data does not exist in Firestore today (confirmed: zero hits for any Reward Program model/schema anywhere in `functions/src/` or `apps/web/src/`), so there is no migration-from-Firestore concern, no dual-write period, and no copy to reconcile.

**Cross-store reference boundary** (§9 elaborates): PostgreSQL `reward_programs`/`reward_program_versions` reference Firestore-owned ids (`businessId`, `createdBy` = a Customer Identity id, `qualifyingKnowledgeNodeIds`) as opaque, indexed, non-FK-constrained string columns, validated server-side at write time against the live Firestore state — the same pattern `businessClassificationValidation.ts` already uses for Business→Commerce-Knowledge references, just crossing a store boundary instead of a collection boundary.

## 9. Stable Reference Model

| Reference | Source authority | Stable ID form | PG FK possible? | Storage | Server-side validation required | Deletion/archive effect on historical validity |
|---|---|---|---|---|---|---|
| `businessId` | Firestore `businesses/{id}` (Identity domain) | Firestore auto-ID (opaque string) | **No** — cross-store, no PG table holds Business rows | `TEXT NOT NULL`, indexed | At program creation: Business exists, is in an eligible lifecycle status (§18); re-checked at every subsequent version-publish (mirrors the existing Commerce-Knowledge-reference-revalidation pattern in `businessProfileCommand.ts`) | A later Business status change (e.g. `suspended`) does not retroactively invalidate an already-published version — publication was valid when it happened; new publishes are re-gated |
| `qualifyingKnowledgeNodeIds[]` | Firestore `knowledgeNodes/{id}` (Commerce Knowledge domain), type `standard_product`/`standard_service` | Firestore auto-ID | **No** | `TEXT[]` (or a junction table, §22), indexed via GIN if array | `active` status + correct `nodeType` required at *new*-version creation (`isEligibleForNewReference`); an *existing* published version's reference remains valid even if the node is later `retired`/`archived` (`isResolvableForExistingReference`) — reuse both predicates unmodified | Node retirement/archival never invalidates a historical version (governed: TRD10 §10.9.2 Version Integrity Rule; `referenceEligibility.ts`'s own doc comment) |
| `standardRewardNodeId` | Firestore `knowledgeNodes/{id}` | Firestore auto-ID | **No** | `TEXT NULL`, indexed | Same as above, optional field | Same as above |
| `rewardProgramCategoryId` | Firestore `knowledgeNodes/{id}`, type `reward_program_category` | Firestore auto-ID | **No** | `TEXT NOT NULL`, indexed | `active` status + correct `nodeType` at creation/edit | Same historical-validity rule |
| `createdBy`/`updatedBy` (actor) | Firestore Customer Identity id, resolved server-side via the existing `resolveAuthenticatedBusinessActor` chain | Firestore auto-ID | **No** | `TEXT NOT NULL` | Never client-supplied — server-resolved exactly like every other domain in this codebase | N/A (immutable audit fact) |
| `reward_program_id` (version → program) | PostgreSQL `reward_programs.id` | PG-generated identity | **Yes** — same database | `UUID` or `BIGINT` FK, `ON DELETE RESTRICT` | Standard FK enforcement | N/A |

No cross-store referential constraint is invented that PostgreSQL cannot actually enforce — every Firestore-owned reference is validated by an explicit server-side read inside the same PostgreSQL transaction's surrounding command logic (a "read Firestore, then write Postgres inside one logical operation" pattern — not a two-phase-commit, since Firestore is read-only in this flow and PostgreSQL is the sole write target for this domain's own data).

## 10. Program Identity Model

- `rewardProgramId` is a **stable identity** that survives every version change, pause, retire, and archive. It never changes once created.
- `rewardProgramVersionId` is a **separate, immutable identity** per version — confirmed necessary by the Version Integrity Rule (every Purchase/Cycle references "the applicable version," which must be independently addressable even after a newer version supersedes it).
- **Version number** is a simple per-program monotonically increasing integer (`1, 2, 3, ...`), not a semantic/date-based scheme — matches TRD10 §10.9.2's `version: number` field exactly and the existing precedent (`BusinessMembershipInvitation`/`Business` schemas use plain incrementing/timestamp patterns, never semver-like strings).
- Program identity remains stable through `active → paused → active` and `active → retired → archived` — none of these transitions touches `reward_programs.id`.
- Historical versions are retained immutably and forever (no historical version is ever deleted, per the Version Integrity Rule and PRD6 §6 "never rewrite historical cycle rules").
- The **current version is referenced explicitly** via `reward_programs.current_version_id`, a system-maintained pointer updated only by the publish operation (§19).

This directly follows TRD10 §10.9's existing two-document design (`rewardPrograms` + `rewardProgramVersions`) — the design being proposed here is a PostgreSQL-table restatement of an already-governed model, not an invented one.

## 11. Versioning Model

Answering the task's exact questions:

- **What constitutes a version?** One complete, immutable snapshot of a program's full commercial terms: qualifying scope, reward definition, threshold/quantity (fixed), fraud-control settings, effective dates.
- **Which fields are versioned?** Every field in §22's `reward_program_versions` table. Fields that live on `reward_programs` instead (`displayName`, `rewardProgramCategoryId`, `sharedLoyaltyNumberAllowed`, `status`) are **program-identity-level**, not versioned — this exactly matches TRD10's own split between the two documents (note `sharedLoyaltyNumberAllowed` appears on *both* documents in TRD10 §10.9.1/§10.9.2; this design keeps it program-level only, since the version-level duplicate serves no distinct purpose the Version Integrity Rule requires — flagged as a minor simplification from the literal TRD10 field list, not a contradiction of any rule).
- **Can a published version be mutated after becoming effective?** **No.** This is the single most important invariant in this design (§20).
- **Can draft version data be edited before publication?** **Yes** — a `draft`-status version may be freely edited by its Owner until published; publishing is the one-way transition to immutable.
- **How is "current" determined?** `reward_programs.current_version_id` is a system-maintained pointer, updated transactionally at the moment a version transitions `draft → active` (publish).
- **How does a future Purchase identify the applicable version?** It stores `rewardProgramVersionId` directly at Purchase-creation time (TRD10 §10.10.1 already has this field) — never re-derives "current" later. This design does not implement Purchase, but the contract it must rely on is exactly this: a stable, dereferenceable version id that never changes meaning.
- **What happens when a new version becomes effective?** The previously-`active` version transitions to `status = "superseded"` (TRD10 §10.9.2's own enum) in the same transaction that sets the new version to `active` and updates `current_version_id`. No gap where two versions are simultaneously current.
- **Are historical versions queryable?** Yes — a simple `SELECT * FROM reward_program_versions WHERE reward_program_id = $1 ORDER BY version` list read.
- **Can versions overlap?** **No** — at most one version is `active` per program at any instant (§20 invariant). `effectiveFrom`/`effectiveUntil` are informational fields on the version, not concurrency-control fields; the `status` enum is the actual concurrency mechanism.
- **Can effective periods be open-ended?** Yes — `effectiveUntil` is nullable (TRD10 §10.9.2 already types it `Timestamp?`).
- **Does archive affect historical references?** No — archiving the *program* (§14) does not delete or alter any version row; historical Purchase/Cycle references remain valid forever, consistent with PRD6 §5 "Archived: Historical reporting only."

## 12. Lifecycle State Model

**[REFINED by `CORR-001`'s §"Version/Active-State Invariant" — the state enums below (both levels) are retained unchanged, but `CORR-001` narrows the *operations* 005A implements: the `pause`/`retire`/`archive` transitions are excluded from 005A's command set, since `DEC-LOY-013` leaves the pause-preserves-progress guarantee formally unconfirmed at the decision-register level even though PRD6 §5 states it. The states remain structurally defined in the schema `CHECK` constraint for forward-compatibility; only the commands that would invoke `paused`/`retired`/`archived` are deferred.]**

**Program-level states** (canonical, from canonical-reference.md §7 and PRD6 §5 — exactly 5, verbatim, no invention):

| State | Required now? | Meaning |
|---|---|---|
| `draft` | **REQUIRED NOW** | Being configured, not visible to customers |
| `active` | **REQUIRED NOW** | Customers may accumulate Verified Units (structural meaning only — this package does not implement accumulation) |
| `paused` | **REQUIRED NOW (structural)** | Temporarily unavailable; "customers retain accumulated progress; no new Purchase Records accepted" — the *state* is required now so the enum is closed and correct, but the *pause operation's* edge-case guarantees (does pausing correctly freeze in-flight state) are a Loyalty-domain concern this package does not implement |
| `retired` | **REQUIRED NOW (structural)** | "No further participation. Historical Loyalty Cycles remain valid. Outstanding rewards remain redeemable." Same structural/behavioral split as `paused`. |
| `archived` | **REQUIRED NOW (structural)** | Historical reporting only |

**Version-level states** (TRD10 §10.9.2, exactly 3):

| State | Required now? |
|---|---|
| `draft` | REQUIRED NOW |
| `active` | REQUIRED NOW |
| `superseded` | REQUIRED NOW |

**No `scheduled` state exists at either level.** Neither the PRD nor TRD10 defines one; do not invent it even though `effectiveFrom` could theoretically support future-dated activation — that would require a scheduling *mechanism* (a job, a check-on-read pattern) that is genuinely undesigned. **STATE RESERVED / STRUCTURAL, not BLOCKED**: the `paused`/`retired` states themselves are safe to implement in the enum and the basic transition (an Owner may set a program to `paused`) even though the *downstream effects* on an in-flight Loyalty Cycle (which does not exist yet) are necessarily inert — there is nothing yet for pausing to affect. **STATE BLOCKED BY FOUNDER DECISION**: none — `DEC-LOY-013`'s two open questions (customer migration between programs; seasonal variants) are not states, they are *operations/behaviors* this package does not implement, and their absence does not require withholding the state enum itself.

**Program status transition table proposed for this package** (mirrors `businessStatus.ts`'s explicit-table convention):

```
draft    → active, archived (an unpublished draft with no version history can be discarded directly)
active   → paused, retired
paused   → active, retired
retired  → archived
archived → (terminal)
```

`draft → retired` and `active → archived` (skipping `retired`) are intentionally excluded — PRD6 §5 describes retirement as the step before archival, and there is no governed statement authorizing a shortcut.

## 13. Business Eligibility Model

Per §5's authority-matrix row and the existing `ordinaryPermissionCatalogue.ts` per-permission eligibility pattern (not a single global gate — `ENG-P2-004-CORR-001`'s corrected model):

| Business status | May draft/configure? | May publish/activate? | May run transactions against it? |
|---|---|---|---|
| `draft` | **No** — a Business still being onboarded has no confirmed classification/Terms context yet; no governed statement authorizes pre-onboarding Reward Program creation, and doing so risks a program referencing a Business that never completes onboarding | No | No |
| `pending_verification` | **No** — same reasoning; Business is mid-verification | No | No |
| `trial` | **Yes** | **Yes**, subject to plan-capacity check (§5, `DEC-SUB-004`) | Not this package's concern (Purchase domain) |
| `active` | **Yes** | **Yes**, subject to plan-capacity check | Not this package's concern |
| `suspended` | **No new drafts**; existing `draft`s remain editable (consistent with `DEC-LOY-011`'s "suspension may restrict new activity but not automatically prevent" pattern applied by analogy) | **No** — do not allow a suspended Business to newly activate a program | Not this package's concern |
| `expired` | **No** | **No** | Not this package's concern |
| `closed` | **No** (terminal-adjacent) | **No** | Not this package's concern |
| `archived` | **No** (terminal) | **No** | Not this package's concern |

**Rationale for excluding `draft`/`pending_verification`:** unlike `business.updateProfile` (which legitimately needs to work pre-verification, since profile completion is *part of* onboarding), Reward Program creation is a *post*-onboarding commercial activity with no PRD/TRD statement placing it inside the onboarding flow itself — PRD6 nowhere references onboarding, and the `PLATFORM-BASELINE-004` prior assessment's own §13 independently reached "not restricted to active only; trial structurally eligible" without extending eligibility to `draft`. This is a **design choice this document makes**, not a pre-existing governed rule — flagged explicitly as such, and narrower than "any non-terminal status," which is the safer default for a new commercial-configuration capability.

DEC-LEGAL-002 does not change this table — it determines whether a **real** Business can ever legitimately be in `trial` at all, not which statuses are eligible once a Business is there (§21 elaborates).

## 14. Permission Design

**[SUPERSEDED by `CORR-001`'s §"Manager Authority" and §"Permission Model Refinement" — the two-permission, Manager-override-eligible design below is replaced by a single Owner-only `rewardProgram.manage` permission with reads gated by membership, not a catalogue entry. Retained below for record-keeping; do not implement against this section.]**

**No existing `rewardProgram.*` permission entry exists in either catalogue** (confirmed by direct code read — the sensitive catalogue's 9 entries and the ordinary catalogue's 4 entries were both enumerated and neither contains one).

**Proposed: two entries, minimal, mirroring the existing `ordinaryPermissionCatalogue.ts` shape exactly** (this domain's actions are ordinary Business-administration actions, not one of the existing 9 sensitive-catalogue concerns like staff/permission/ownership/fraud/reversal/override/protected-data — nothing about creating a loyalty program configuration matches that catalogue's risk profile):

| Permission id | Owner | Manager | Staff | Platform Administrator | Eligible statuses |
|---|---|---|---|---|---|
| `rewardProgram.view` | allow | allow (role-default, like the existing `customer.viewProtectedProfile`/`report.exportFinancial` inheritable pattern) | allow | governed only (not modeled here) | `trial, active` (read is fine even mid-pause/retire for historical visibility — extend to `paused, retired, archived` too, since read access to a retired program's terms must remain available) |
| `rewardProgram.manage` | allow | **deny by default, override-eligible** (mirrors `staff.manage`'s `explicitGrantEligibleRole: manager` shape) | deny | governed only | `trial, active` for create/edit-draft/publish/create-next-version; `trial, active, paused` for retire (an Owner must be able to retire a paused program) |

**Mapped against the six actions the task asks about:**

| Action | Owner | Manager (default) | Manager (with override) | Staff |
|---|---|---|---|---|
| Create draft | allow | deny | allow | deny |
| Edit draft | allow | deny | allow | deny |
| Publish/activate | allow | deny | allow | deny |
| Create next version | allow | deny | allow | deny |
| Retire/archive | allow | deny | allow | deny |
| Read | allow | allow | allow | allow |

**Why one `manage` permission rather than five granular ones:** the task explicitly warns against unnecessary granularity, and every governed lifecycle action here (create/edit-draft/publish/version/retire) is a single Owner-level commercial-configuration authority with no governed statement distinguishing, e.g., "may publish but not create a next version." This mirrors `business.updateProfile`'s single-permission-covers-multiple-related-writes precedent rather than `sensitivePermissionCatalogue.ts`'s more granular staff-domain split (which exists because staff actions have genuinely different risk profiles — role change vs. suspension vs. permission override).

**Where current governance does not answer a role question, flagged rather than guessed:** whether Manager should ever get `rewardProgram.manage` by explicit override (vs. Owner-only, non-delegable like `staff.assignRole`) is **not answered by any existing decision**. This design recommends the override-eligible shape (consistent with the *majority* of the existing sensitive catalogue: 5 of 9 entries are Manager-override-eligible, only `staff.assignRole`/`business.transferOwnership` are hard Owner-only) but this is a recommendation, not a governed fact — call out for Founder/technical-review confirmation, not a blocking gate (§34 does not list it as one, since a conservative Owner-only-for-now default is always available without redesign if the recommendation is rejected).

**Catalogue placement:** both entries belong in a **new, dedicated Reward-Program permission catalogue module** (`rewardProgramPermissionCatalogue.ts`), structurally separate from both existing catalogues — mirrors the existing `ordinaryPermissionCatalogue.ts`'s own explicit "structurally separate" convention (FD-CORR-2) rather than appending to either existing closed table. Extending either existing catalogue's array requires the same kind of Founder/engineering-lead sign-off its own header comment describes; a brand-new module sidesteps re-litigating either catalogue's closed-set governance and is the lower-friction path.

## 15. Commerce Knowledge Integration

- `qualifyingKnowledgeNodeIds[]` must reference **only `standard_product`/`standard_service`-type nodes** — confirmed by `knowledgeNodeType.ts`'s adjacency table (these are the only two leaf types under `reward_program_category`).
- `rewardProgramCategoryId` must reference a `reward_program_category`-type node (its own direct field, separate from the qualifying-products array).
- `standardRewardNodeId` (optional) — same type constraint as `qualifyingKnowledgeNodeIds`, singular.
- **Active-status validation required at:** (a) draft creation/edit (new-reference eligibility, `isEligibleForNewReference` → `active` only), (b) publish time (re-validate — a node could have been retired between draft-save and publish, closing the exact TOCTOU gap `businessProfileCommand.ts` already closes for Business-level references).
- **Parent/child validation:** enforce via the existing `isValidParentNodeType`/`ALLOWED_PARENT_TYPE` predicates, reused unmodified.
- **Business display aliases:** yes, governed (`businessDisplayProductNames[]`, CKS-003) — a Business may show "Joe's Signature Coffee" over the standard "Regular Coffee" node; store as a parallel string array, index-aligned with `qualifyingKnowledgeNodeIds` or as `{knowledgeNodeId, displayName}` pairs (§22 schema decision: the latter, for referential clarity).
- **Nodes may later become inactive without invalidating historical versions:** confirmed governed — reuse `isResolvableForExistingReference` (`active`/`retired`/`archived` all resolve for an *existing* reference) so a published version's qualifying-scope reference never breaks.
- **What must be persisted for historical integrity:** the node **ids** (not denormalized names) — TRD10 §10.9.2 does not denormalize node display text into the version, and this design follows that; a historical version's qualifying scope is reconstructed by dereferencing the stored ids, which remain resolvable forever (Commerce Knowledge nodes are never deleted, only retired/archived, per DAP-010).
- **Not built:** a Business catalogue, a separate participating-offerings subsystem, or any mechanism for a Business to define its own products/services below the standard-node layer — all explicitly out of scope per PRD3 §15 ("businesses define their own" refers to *equivalence mapping* onto existing standard nodes, not creating new taxonomy) and the prior PB004 assessment's independently-reached same conclusion.

## 16. Reward-Definition Model

Minimum governed MVP fields (TRD10 §10.9.2, cross-checked against §6's matrix):

- `rewardDescription: string` — required, business-authored free text (PRD6 §4.3).
- `standardRewardNodeId?: string` — optional Commerce Knowledge reference for what the reward *is* structurally.
- `rewardQuantity: number` — **fixed at 1**, not a free business input (§6).
- **No money/value is stored on the reward definition itself** — `DEC-DATA-003`'s Monetary Metadata Rule (canonical-reference.md §1, item 10) applies transitively: money never influences Reward Program progression or eligibility. PRD6 §4.3's "Internal Cost Estimate (optional)" has no TRD10 schema counterpart and is not implemented (§6).
- **Reward is a product/service reference (via `standardRewardNodeId`) plus free-text description, not arbitrary unstructured text alone** — the optional node reference is the governed structured link; the description is always required regardless.
- **No multiple reward alternatives** — TRD10 §10.9.2 has exactly one `rewardDescription`/`standardRewardNodeId` pair per version; a business wanting a different reward creates a new version (which is exactly the intended mechanism, per PRD6 §6 "Description updates... Product mapping changes" as an example of what a version change is *for*).

## 17. Threshold / Cycle Boundary

- **Threshold is confirmed fixed at 10** (`DEC-LOY-001`, `loyaltyInvariants.ts::REQUIRED_VERIFIED_UNITS_MVP`).
- Reward Program exposes it as a **read-only fact on the version row**, sourced from the platform constant at version-creation time (never accepted as client input — the create/publish command sets it server-side, ignoring any client-supplied value, exactly like `rewardQuantity`).
- **Not implemented in this package:** Verified Unit allocation, cycle creation, overflow handling, progress calculation, earning, reward issuance — all confirmed Loyalty/Reward-domain concerns (§7).
- **`DEC-LOY-008` explicitly does NOT block:** Reward Program schema, Reward Program CRUD, or Reward Program publication. It **does** block: later Loyalty Cycle overflow-allocation logic (Phase 7, per engineering-implementation-programme.md's own framing — "highest-priority... but blocks Phase 7 not Phase 4"). This design does not overblock upstream work: a program can be fully created, versioned, and published today with a correctly-fixed threshold, and the *separate, not-yet-built* Loyalty domain will consume that fact whenever `DEC-LOY-008` resolves and Phase 7 begins.

## 18. DEC-LOY-013 Boundary

`DEC-LOY-013` (OPEN_FOUNDER) concerns exactly three questions, none of which is "can a Reward Program be created, edited, versioned, or published":
1. Does pause preserve accumulated progress/outstanding rewards? — **Recommended direction already confirmed at the product level** (PRD6 §5 states this outcome as governed text, not as an open question); the Founder-level register entry treats the *confirmation* of this recommendation as open, but the *state itself* (`paused`) and its documented meaning are not in dispute.
2. May businesses migrate customers between programs? — **Blocks:** any migration operation/UI. Not built (§10, §12).
3. Seasonal variants under one cycle? — **Blocks:** any seasonal-variant data model. Not built.

**The smallest lifecycle subset safely implementable now:** the full 5-state `draft/active/paused/retired/archived` enum and the transition table in §12, **excluding** any migration or seasonal-variant mechanism. This is safe because implementing a *closed enum with a governed transition table* commits to nothing `DEC-LOY-013` might later resolve differently — migration and seasonal variants are additive future capabilities, not corrections to the existing 5-state model (PRD6 §5 itself, not just this design, already treats the 5 states as settled; only the two *additional* questions are open).

## 19. Trial / Commercial Boundary

| Concept | In scope for this package? |
|---|---|
| CONFIGURE PROGRAM (create/edit draft) | **Yes** |
| ACTIVATE PROGRAM (publish first version) | **Yes**, subject to the plan-capacity check placeholder (§5) |
| RUN TRANSACTIONS (Purchase recording against it) | **No** — Purchase domain, not built |
| CONSUME BILLABLE UNITS | **No** — Subscription domain |
| EXPIRE TRIAL | **No** — Subscription domain, blocked on `DEC-SUB-003` |
| CONVERT TO ACTIVE/PAID | **No** — Subscription domain |

**Confirmed: Reward Program configuration is not coupled to unresolved billing mechanics.** `DEC-SUB-007` (CONFIRMED) guarantees "purchase history, Verified Unit integrity, redemption controls" are present on every plan including trial — nothing conditions Reward Program *creation* on `DEC-SUB-003`'s resolution. The plan-capacity check (`DEC-SUB-004`, counting *active* programs) is the one governed coupling point, and it is a **count-against-a-limit** mechanism, not a billing-mechanics dependency — the limit value itself can be `NULL`/unconfigured for now (§34 flags this as worth a light Founder confirmation, not a blocker: the safe interim default is "no enforced limit until `DEC-SUB-008` sets one," which is a strictly *more* permissive, never *less* permissive, starting position — it cannot cause an incorrect denial).

## 20. Legal / Terms Boundary

`DEC-LEGAL-002` remains `OPEN_LEGAL`. For Reward Program engineering, this means:

**What real-world validation remains blocked:** no *real* Business can reach `trial` status in a live/staging/production environment, because `submitBusinessForVerification` fails closed without a governed Terms version (confirmed: this is the exact mechanism the prior PB004 assessment traced end-to-end). Transitively, no real Business can create a real, live Reward Program either — but this is a consequence of the Business-activation gate, not a Reward-Program-specific restriction.

**What may proceed safely:** schema design (this document), and future implementation validated against **emulator-fixture Business state** — exactly the pattern already established by `seedTestOnlyTermsFixture.mjs` (an emulator-only, `demo-11thonus`-project-gated, non-production-reachable fixture) and by every existing Business-domain emulator test that parametrizes over `trial`/`active` status directly rather than driving a real Business through the full onboarding+Terms+admin-activation chain. This design does **not** modify Terms, configure real legal Terms, bypass Terms, or weaken any Business-activation precondition — it simply notes that a future `PLATFORM-BASELINE-005A` implementation package can and should validate its Reward Program CRUD/versioning logic against a fixture `trial`-status Business, exactly as `PLATFORM-BASELINE-003`/`004A`'s own emulator tests already do for their respective domains.

## 21. Existing-Code Reuse Assessment

| Item | Classification | Reasoning |
|---|---|---|
| `functions/src/config/loyaltyInvariants.ts` (`REQUIRED_VERIFIED_UNITS_MVP`, `REWARD_QUANTITY_FIXED`) | **PRESERVE + REUSE UNMODIFIED** | Exactly the fixed-value source of truth this design needs; do not duplicate the constants elsewhere |
| `functions/src/domains/commerceKnowledge/models/{knowledgeNodeType,referenceEligibility}.ts` | **PRESERVE + REUSE UNMODIFIED** | Pure predicates already implement exactly the reference-eligibility/type-adjacency rules this domain needs |
| `functions/src/domains/permissions/models/{sensitivePermissionCatalogue,ordinaryPermissionCatalogue}.ts` | **PRESERVE, DO NOT MODIFY; ADD a new, separate module instead** | Both are explicitly closed sets per their own governance comments; a new catalogue module is the established pattern for adding a new domain's permissions without reopening either |
| `functions/src/domains/permissions/evaluator/evaluatePermission.ts`, `service/{evaluatePermissionService,authorizeAndExecute}.ts` | **PRESERVE + REUSE UNMODIFIED** | The evaluator already accepts any registered permission id from either catalogue; a third catalogue slots in without evaluator changes, provided the new module is wired into the same lookup the evaluator already performs (a small, additive registration point, not a rewrite) |
| `functions/src/infrastructure/postgres/{postgresConfig,postgresPool,postgresTransaction,migrationRunner}.ts` | **PRESERVE + REUSE UNMODIFIED** | Exactly the transaction/migration seam a future implementation package should build on; `withPlatformTransaction(pool, fn)` is the single entry point every Postgres-authoritative domain transaction must use, per its own doc comment |
| `functions/src/domains/business/models/businessStatus.ts` | **PRESERVE + REUSE UNMODIFIED** | Reward Program's Business-eligibility check reads this module's exported status list/predicates; does not duplicate or fork them |
| `functions/src/domains/business/services/businessClassificationValidation.ts` | **PRESERVE + ADAPT (pattern reuse, not code reuse)** | Not directly importable (it's Business-specific), but its same-transaction, active-status, correct-parent-type validation *pattern* is the template for Reward Program's own Commerce-Knowledge-reference validation |
| Anything named `RewardProgram`/`LoyaltyProgram` in `functions/`/`apps/web/` | **DOES NOT EXIST** | Confirmed by exhaustive search — nothing to preserve, adapt, or retire |
| `reward_program_category` `KnowledgeNodeType` enum value | **PRESERVE UNMODIFIED** | Already-correct taxonomy concept; not the Reward Program domain object itself, but the correct category-node type this domain's `rewardProgramCategoryId` field will reference |

**Nothing is recommended for retirement** — no abandoned or superseded Reward Program implementation exists to retire.

## 22. Proposed PostgreSQL Schema (design only — no migration created)

**Naming provenance (corrected by `CORR-001`): every table/column name below is PROPOSED BY PLATFORM-BASELINE-005.** None of these names was reserved, created, or authoritatively assigned by `PLATFORM-BASELINE-001` or any other prior package (§8 item 3) — they are new naming choices of this design, informed by TRD10 §10.9's canonical Firestore field names.

### `reward_programs`

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` | Stable program identity |
| `business_id` | `TEXT NOT NULL` | Firestore Business id; indexed, not FK (cross-store) |
| `display_name` | `TEXT NOT NULL` | Business-authored free text |
| `reward_program_category_id` | `TEXT NOT NULL` | Firestore `KnowledgeNode` id, type `reward_program_category`; indexed |
| `shared_loyalty_number_allowed` | `BOOLEAN NOT NULL DEFAULT false` | **[Corrected by `REVIEW-FINDINGS-001`]** Current-value convenience projection only — **not the historical authority**. Mirrors whatever value is in force in the program's `current_version_id` row at the time of the last projection update. Never read by any command that needs the value that governed a specific historical Purchase/Cycle — see `reward_program_versions.shared_loyalty_number_allowed` below for that. |
| `status` | `TEXT NOT NULL CHECK (status IN ('draft','active','paused','retired','archived'))` | §12 enum |
| `current_version_id` | `UUID NULL REFERENCES reward_program_versions(id)` | Nullable until first publish; FK deferred/nullable to avoid a circular-creation ordering problem (create program row without a version first, then the version references the program, then update this pointer) |
| `created_at` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | |
| `created_by` | `TEXT NOT NULL` | Server-resolved Customer Identity id |
| `updated_at` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | |
| `updated_by` | `TEXT NOT NULL` | |
| `schema_version` | `INTEGER NOT NULL DEFAULT 1` | Matches this codebase's existing per-document schema-version convention |

**Unique constraint:** none needed beyond the primary key — a Business may have multiple Reward Programs (PRD6 does not limit this; `DEC-SUB-004` counts *active* ones against a plan limit, implying multiplicity is allowed).
**Index:** `(business_id)`, `(business_id, status)` (for "list a Business's active programs" reads, and for the plan-capacity count query).

### `reward_program_versions`

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID PRIMARY KEY DEFAULT gen_random_uuid()` | Stable, immutable version identity |
| `reward_program_id` | `UUID NOT NULL REFERENCES reward_programs(id) ON DELETE RESTRICT` | Real PG FK — same database |
| `version` | `INTEGER NOT NULL` | Monotonic per program |
| `required_verified_units` | `INTEGER NOT NULL CHECK (required_verified_units = 10)` | Fixed platform rule, enforced at the database layer, not merely application-layer (§6) |
| `reward_quantity` | `INTEGER NOT NULL CHECK (reward_quantity = 1)` | Fixed platform rule, enforced at the database layer |
| `shared_loyalty_number_allowed` | `BOOLEAN NOT NULL` | **[Added by `REVIEW-FINDINGS-001`]** Authoritative, immutable per-version snapshot — matches TRD10 §10.9.2's `RewardProgramVersionDocument.sharedLoyaltyNumberAllowed`. A historical Purchase/Loyalty Cycle referencing this version reads the policy from here, never from `reward_programs`'s current-value projection. |
| `reward_description` | `TEXT NOT NULL` | |
| `standard_reward_node_id` | `TEXT NULL` | Optional Commerce Knowledge reference |
| `multiple_units_allowed` | `BOOLEAN NOT NULL DEFAULT true` | |
| `bulk_review_threshold` | `INTEGER NULL` | Optional fraud-control field |
| `effective_from` | `TIMESTAMPTZ NOT NULL` | |
| `effective_until` | `TIMESTAMPTZ NULL` | Open-ended allowed |
| `status` | `TEXT NOT NULL CHECK (status IN ('draft','active','superseded'))` | |
| `created_at` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | |
| `created_by` | `TEXT NOT NULL` | |
| `approved_at` | `TIMESTAMPTZ NULL` | Set at publish time |
| `schema_version` | `INTEGER NOT NULL DEFAULT 1` | |

**Immutable fields (post-publish, i.e. once `status != 'draft'`):** every column except `status` itself (the `active → superseded` transition) and `approved_at` (set exactly once, at publish). Enforced at the application/transaction layer (a `BEFORE UPDATE` trigger is an option but not required — the command layer is the existing enforcement point for every other domain in this codebase, e.g. Purchase Record's "Immutability Rule" is enforced the same way, not by a DB trigger).

**Unique constraint:** `UNIQUE (reward_program_id, version)` — prevents two versions of the same program from ever sharing a version number, the direct database-level expression of "unique version number per program."

**Partial unique index for the single-active-version invariant:**
```
CREATE UNIQUE INDEX reward_program_versions_one_active_per_program
  ON reward_program_versions (reward_program_id)
  WHERE status = 'active';
```
This is the database-enforced expression of "at most one current/effective version at a given instant" (§20) — a genuine PostgreSQL constraint, not merely an application-layer promise.

### Supporting table: `reward_program_version_qualifying_nodes`

A **junction table**, not a plain array column, for `qualifyingKnowledgeNodeIds`/`businessDisplayProductNames` — chosen over a `TEXT[]` column because the task requires each node reference to optionally carry its own display alias (§15's "index-aligned array vs. pairs" decision, resolved in favor of pairs for referential clarity and to allow a future per-node index without a GIN array index):

| Column | Type | Notes |
|---|---|---|
| `reward_program_version_id` | `UUID NOT NULL REFERENCES reward_program_versions(id) ON DELETE CASCADE` | |
| `knowledge_node_id` | `TEXT NOT NULL` | Firestore `KnowledgeNode` id, type `standard_product`/`standard_service` |
| `business_display_name` | `TEXT NULL` | Optional alias (CKS-003) |

**Primary key:** `(reward_program_version_id, knowledge_node_id)` — a node cannot appear twice in the same version's qualifying scope.
**Index:** `(knowledge_node_id)` for a future "which programs qualify this product" reverse-lookup, if ever needed.

**No generic metadata blob (`JSONB`) is added anywhere.** Every field above has a specific, governed shape; nothing in the reviewed authority calls for open-ended extensibility that a JSON column would serve, and this codebase's existing convention (every Firestore document type is a closed, typed shape, never a metadata bag) is followed.

## 23. Constraints/Indexes (summary)

- `reward_programs.status` — `CHECK` closed enum
- `reward_program_versions.status` — `CHECK` closed enum
- `reward_program_versions.required_verified_units = 10` — `CHECK`
- `reward_program_versions.reward_quantity = 1` — `CHECK`
- `reward_program_versions (reward_program_id, version)` — `UNIQUE`
- `reward_program_versions (reward_program_id) WHERE status = 'active'` — partial `UNIQUE` index (at most one active version)
- `reward_program_version_qualifying_nodes (reward_program_version_id, knowledge_node_id)` — composite `PRIMARY KEY`
- Foreign keys: `reward_program_versions.reward_program_id → reward_programs.id` (`ON DELETE RESTRICT` — a program is never hard-deleted while versions exist; archival is a status, not a deletion); `reward_program_version_qualifying_nodes.reward_program_version_id → reward_program_versions.id` (`ON DELETE CASCADE` — junction rows are meaningless without their parent version, but a version itself is never deleted in practice since `RESTRICT` on the program side and the immutability rule together mean rows are append-only)
- Indexes: `reward_programs(business_id)`, `reward_programs(business_id, status)`, `reward_program_version_qualifying_nodes(knowledge_node_id)`

## 24. Concurrency / Integrity Model

| Invariant | Enforcement mechanism |
|---|---|
| One stable Reward Program identity | `reward_programs.id`, immutable, never regenerated |
| Immutable published versions | Application-layer command-level enforcement (no `UPDATE` path exists for a non-`draft` version in the command surface); the closed `status` enum makes an accidental content edit require deliberately bypassing the command layer entirely |
| Unique version number per program | `UNIQUE (reward_program_id, version)` — database-enforced |
| At most one active version per program | Partial `UNIQUE` index — database-enforced |
| No overlapping effective periods | **Not separately enforced** — `effectiveFrom`/`effectiveUntil` are informational (§11); the `status` enum, not date ranges, is the actual single-source-of-truth for "which version is current," so a database constraint on date-range overlap would constrain a field that isn't the real concurrency mechanism and is not required |
| Business ownership cannot change through Reward Program mutation | `reward_programs.business_id` has no `UPDATE` path in any proposed command (§27) — it is a write-once field set at creation |
| `rewardQuantity` fixed at 1 | `CHECK` constraint — database-enforced, cannot be bypassed even by a bug in application code |
| `threshold` fixed at 10 | `CHECK` constraint — database-enforced |
| Qualifying node references validated before publication | Application-layer, inside the same PostgreSQL transaction as the publish write, via a synchronous Firestore read of each node's current status (cross-store — cannot be a PG constraint, since Commerce Knowledge lives in Firestore) |
| Archived/ineligible Business cannot create new versions | Application-layer permission-eligibility check (§13/§14) — cross-store, same reasoning |

**Where a PostgreSQL constraint is possible, it is used** (status enums, uniqueness, fixed-value checks). **Where the invariant crosses the Firestore/PostgreSQL boundary, a server transaction check is used instead** — exactly the split the task asks for, with no invented cross-store constraint PostgreSQL cannot actually hold.

## 25. Idempotency Design

**Recommendation: a dedicated PostgreSQL `idempotency_keys` table, with reservation, domain mutation, and completion staged in the same `withPlatformTransaction` call** — deliberately avoiding the exact mistake `PLATFORM-BASELINE-003-CORR-001`/`004A-CORR-001` found and fixed in the Firestore idempotency pattern (a post-commit, second-transaction completion write that can fail independently of the domain mutation, producing an ambiguous "failed" record after a real success).

Proposed shape (design only, no migration):

```
idempotency_keys (
  idempotency_key TEXT PRIMARY KEY,
  operation_type   TEXT NOT NULL,
  actor_id         TEXT NOT NULL,
  request_hash     TEXT NOT NULL,
  status           TEXT NOT NULL CHECK (status IN ('processing','completed','failed')),
  result_reference TEXT NULL,
  response_snapshot JSONB NULL,
  correlation_id   TEXT NOT NULL,
  reserved_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ NULL
)
```

**Operations requiring idempotency:** create Reward Program (first draft + implicit initial version — or is creation two separate idempotent steps? — recommend one combined "create program with initial draft version" operation, since a program with zero versions is a useless intermediate state no UI needs to expose), create next draft version, publish version, retire/archive.

**Where idempotency records live:** in PostgreSQL, colocated with the domain tables — not in Firestore's `idempotencyRecords` collection, which would recreate exactly the split-authority problem `DEC-DATA-008` forbids ("no dual authoritative storage... no synchronization architecture"). A PostgreSQL-authoritative domain must have PostgreSQL-authoritative idempotency, in the same transaction.

**Pattern:** reserve (insert `processing` row, `ON CONFLICT` detects duplicate/in-progress/conflicting-hash exactly like the existing Firestore `checkAndReserveIdempotencyKey` contract) → run the domain mutation → write `status = 'completed'` in the **same** `withPlatformTransaction` call, immediately before commit. A `Timestamp`-vs-`Date` serialization bug (the exact `PLATFORM-BASELINE-004A-CORR-001` P1 finding) cannot recur here in the same shape, since PostgreSQL's `TIMESTAMPTZ` round-trips through the `pg` driver as a native JS `Date` consistently on both fresh-write and replay reads — there is no Firestore-`Timestamp`-shaped intermediate object to normalize. This is not implemented here — design only.

## 26. Audit/Outbox Design

**Recommendation: a PostgreSQL-transactional outbox table, colocated with the domain tables, not the existing Firestore `outboxEntries` collection** — same reasoning as §25 (no split authority).

Proposed shape (design only):

```
reward_program_outbox (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type     TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id   TEXT NOT NULL,
  payload        JSONB NOT NULL,
  actor_id       TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT NULL,
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT now()
)
```

(A `JSONB` payload here is justified, unlike §22's rejection of a metadata blob on the domain tables themselves — an event log's payload is inherently event-type-specific and heterogeneous across event types, exactly the pattern the existing Firestore `outboxEntries` collection already uses for the same reason.)

**Event types required (minimum):** `RewardProgramCreated`, `RewardProgramVersionPublished`, `RewardProgramPaused`, `RewardProgramRetired`, `RewardProgramArchived`. (`RewardProgramVersionDraftEdited` is deliberately **not** an event — draft edits are mutable working state, not durable business facts; only the publish transition and lifecycle-status transitions are event-worthy, mirroring which Firestore events the equivalent Business/Staff domains actually emit vs. which mutations they leave un-eventer.)

**Transaction boundary:** every event row is written inside the same `withPlatformTransaction` call as its triggering domain mutation — never a follow-up write.

**Actor reference:** `actor_id` = server-resolved Customer Identity id, never client-supplied (same boundary as every other domain, §27).

**Correlation/idempotency references:** `correlation_id` generated server-side per request; `idempotency_key` carried through when the triggering command was itself idempotency-keyed (create/publish/retire), null for the (hypothetical, likely unnecessary) plain-read-triggered case.

Not implemented here — design only.

## 27. API/Command Design

**[SUPERSEDED by `CORR-001`'s §"Final 005A Entry Verdict and Scope" — `retireRewardProgram`/`archiveRewardProgram` are removed from the 005A command set (their governed semantics remain open under `DEC-LOY-013`); `getRewardProgram`/`listRewardPrograms` no longer carry a `rewardProgram.view` permission check (reads are membership-gated only, per `CORR-001`'s permission-model correction). The four remaining commands' shapes are otherwise unchanged. Retained below for record-keeping; the corrected six-item list (four commands + two membership-gated reads) is in `CORR-001`.]**

Six commands, each bounded, mirroring the existing `whitelist parser → server-resolved actor → domain command → existing error taxonomy` convention this codebase already uses consistently (most recently for `PLATFORM-BASELINE-004A`'s five callables):

| Command | Actor | Authorization | Business gate | Inputs | Fixed server values | Cross-store validation | PG transaction | Idempotency | Audit/outbox | Response |
|---|---|---|---|---|---|---|---|---|---|---|
| `createRewardProgram` | resolved via existing `resolveAuthenticatedBusinessActor` | `rewardProgram.manage` | `trial`/`active` only (§13) | `businessId, displayName, rewardProgramCategoryId, qualifyingNodes[{knowledgeNodeId, displayName?}], rewardDescription, standardRewardNodeId?, multipleUnitsAllowed, sharedLoyaltyNumberAllowed, bulkReviewThreshold?, effectiveFrom, effectiveUntil?` | `requiredVerifiedUnits=10`, `rewardQuantity=1`, `status(program)='draft'`, `status(version)='draft'`, `version=1` | Business exists + eligible status (Firestore read); category node + every qualifying node `active` + correct type (Firestore reads) | Yes — one `reward_programs` insert + one `reward_program_versions` insert + junction rows, one transaction | Yes | `RewardProgramCreated` | `{rewardProgramId, versionId, status}` |
| `updateRewardProgramDraft` | as above | `rewardProgram.manage` | `trial`/`active` | `rewardProgramId, versionId` + any subset of the version's editable fields | n/a (no fixed-value fields are ever client-editable in the first place) | Re-validate any changed node references | Yes — `UPDATE` on the one `draft`-status version row only (rejected if `status != 'draft'`) | Yes | none (draft edits are not events, §26) | updated version snapshot |
| `publishRewardProgramVersion` | as above | `rewardProgram.manage` | `trial`/`active` | `rewardProgramId, versionId` | `approvedAt=now()`, `status(version)='active'`, prior active version → `'superseded'`, `current_version_id` updated | Re-validate every qualifying node's current status (TOCTOU close, §15) | Yes — three writes (new version active, old version superseded, program pointer updated) in one transaction | Yes | `RewardProgramVersionPublished` | `{rewardProgramId, versionId, publishedAt}` |
| `createNextRewardProgramVersion` | as above | `rewardProgram.manage` | `trial`/`active` | `rewardProgramId` + full field set for the new draft (may start as a copy of the current active version, business edits from there) | same fixed values as create | same as create | Yes — one insert | Yes | none (a new draft is not an event; its later publish is) | `{versionId, version}` |
| `retireRewardProgram`/`archiveRewardProgram` (two thin commands, or one with an `action` discriminator — recommend **two**, matching the `suspend/reactivate/removeStaffMembership` precedent of explicit-not-generic commands) | as above | `rewardProgram.manage` | `trial`/`active`/`paused` (for retire); any pre-terminal status (for archive, mirrors `businessStatus.ts`'s "any → closed" pattern) | `rewardProgramId` | `status(program)` transition only | none | Yes — one `UPDATE` | Yes | `RewardProgramRetired`/`RewardProgramArchived` | `{rewardProgramId, status}` |
| `getRewardProgram` | as above | `rewardProgram.view` | any status (read never gated on lifecycle) | `rewardProgramId` | n/a | n/a | Read-only, no transaction needed | n/a (reads are not idempotency-keyed) | n/a | full program + current version |
| `listRewardPrograms` | as above | `rewardProgram.view` | any | `businessId` | n/a | n/a | Read-only | n/a | n/a | array of program summaries |

**No generic `manageRewardProgram(action)` endpoint** — matches the task's own explicit instruction and this codebase's established `suspend/reactivate/remove` precedent of one command per distinct, independently-authorized action.

Not implemented here — design only.

## 28. UI Entry Contract

Minimum surface (mirrors the task's own expected shape):

**Business Dashboard → Reward Program** (new nav entry, new route — no existing route/component is repurposed):
- **List view:** every program for the Business, with status badge, linking to a detail/edit view. Empty state: "No Reward Programs yet" + create action.
- **Create/edit-draft view:** fields shown — `displayName`, `rewardProgramCategoryId` (dropdown, per Commerce Knowledge Standard Part XIII), `qualifyingKnowledgeNodeIds` (searchable catalogue, per the same standard) with optional per-node display-name override, `rewardDescription` (free text), `standardRewardNodeId` (optional catalogue picker), `multipleUnitsAllowed`/`sharedLoyaltyNumberAllowed` (toggles), `bulkReviewThreshold` (optional number), `effectiveFrom`/`effectiveUntil` (date pickers).
- **Fields shown but never editable (display-only, with a short "fixed by platform rule" explanatory note, exactly per the task's own instruction):** "Verified Units Required: 10" and "Reward Quantity: 1" — **never rendered as an input field**, consistent with `threshold`/`rewardQuantity` being FIXED PLATFORM RULEs (§6) that a Business-facing editable field would misrepresent as configurable.
- **Publish action:** visible only when `rewardProgram.manage` is granted and the draft passes client-side completeness validation (mirrors the existing onboarding-wizard "completeness predicate" pattern); server re-validates everything regardless (UI states are convenience, per the established `PLATFORM-BASELINE-004A` precedent's own explicit framing).
- **State display:** program status badge (`draft`/`active`/`paused`/`retired`/`archived`) using the existing customer-safe-vocabulary convention (canonical-reference.md §4: no "engine/ledger/lifecycle/state machine" wording) — Business-dashboard-facing copy may use plainer operational language than customer-facing copy, but should still avoid raw backend enum leakage (e.g. "Active" not `active`, "Paused" not `paused`).
- **Validation:** required-field checks client-side for UX only; every actual enforcement (fixed values, node status, eligibility) is server-side, matching this codebase's universal pattern.
- **EN/FR:** every new string added to both locale files with parity, following the exact existing convention (`i18n.test.tsx` parity enforcement).

**Not built:** any participant/customer-facing Reward Program screen (explicitly excluded, §33) — this is the Business configuration surface only.

Not implemented here — design only.

## 29. Local Founder-Preview Model

Uses exactly the existing three-part local stack, no new architecture:
- **Canonical Git:** the existing `/private/tmp/11thonus-pb005-design`-style isolated worktree pattern for implementation work, same as every prior `PLATFORM-BASELINE-*` package.
- **Firebase emulators for Business/Identity:** `pnpm emulators:clean` / `pnpm emulators:validate`, exactly as today — Reward Program itself never touches Firestore, so no new emulator configuration is needed; the emulator is used only to provide the Business/Commerce-Knowledge context Reward Program references.
- **Local PostgreSQL/Docker:** the existing `docker-compose.postgres.yml` / `pnpm postgres:up` mechanism from `PLATFORM-BASELINE-001`, unmodified.
- **Synthetic Business fixture state:** a future implementation package should seed a `trial`-status Business directly via the existing emulator/fixture pattern (the same `seedTestOnlyTermsFixture.mjs`-style, emulator-only, non-production-reachable convention), **not** by driving a real Business through the full onboarding+Terms+admin-activation chain (which, per §20, cannot succeed today because of `DEC-LEGAL-002`). The smallest safe fixture would be: one `trial`-status Business document + its Branch, seeded directly by a dev-only script guarded on `FIRESTORE_EMULATOR_HOST`/the `demo-11thonus` project id, exactly mirroring the existing Terms-fixture script's own safety guards. **Not implemented here** — description only, per the task's explicit instruction.

No separate preview architecture is proposed. No hosted infrastructure is required.

## 30. Data Migration Assessment

**None required.** Verified directly: zero Reward Program data exists anywhere in Firestore (no collection, no document, confirmed by the complete absence of any Reward Program model/schema/repository in the current codebase) and zero rows exist in PostgreSQL (the only table that exists today is the migration runner's own `schema_migrations` bookkeeping table). There is no historical Firestore Reward Program data to migrate, and no prior PostgreSQL Reward Program schema to alter.

## 31. Existing-Code Reuse Assessment

See §21 above (the task's numbering places this after §30 in its own outline, but the content is identical — cross-referenced here to avoid duplication per the task's own §27 instruction, already satisfied).

## 32. Security Assessment

- **Cross-Business isolation:** every proposed command (§27) takes `businessId`/`rewardProgramId` and re-derives authority server-side via the existing permission-evaluator chain — no client-supplied role/authority field exists in any input list. A `rewardProgramId` alone is never sufficient authority; the owning `businessId` is always re-checked against the actor's live membership, exactly like every existing Business-domain command.
- **Owner/Manager/Staff separation:** `rewardProgram.manage` is Owner-default, Manager-override-eligible, Staff-deny — consistent with the existing pattern, no new risk introduced.
- **Server-authoritative fixed values:** `requiredVerifiedUnits`/`rewardQuantity` are set server-side and additionally enforced by a database `CHECK` constraint — a defense-in-depth pair (application logic + database constraint) stronger than either alone, closing off even a hypothetical future application-layer bug.
- **Client mass-assignment:** every proposed command uses an explicit whitelist-parser input shape (§27's "Inputs" column) — no `status`, `version`, `id`, `businessId`-on-update, or fixed-value field is ever accepted from client input for a value the server should control.
- **Stale Business status:** re-checked at both draft-creation and publish time (§13, §20) — a Business suspended between draft-creation and publish cannot complete the publish.
- **Stale Commerce Knowledge status:** re-checked at both draft-save and publish time (§15) — closes the identical TOCTOU gap `businessProfileCommand.ts` already closes for Business-level Commerce Knowledge references.
- **Cross-store TOCTOU:** the Firestore existence/status reads happen synchronously, immediately before the PostgreSQL transaction commits — not a true two-phase-commit (impossible across heterogeneous stores without a saga/outbox pattern this design does not need, since PostgreSQL is the sole write target here), but the read-then-write-in-one-request-lifecycle pattern is exactly what every existing Business-domain cross-reference validation in this codebase already relies on, and it has an existing regression-test precedent (`businessClassificationValidation.emulator.test.ts`'s concurrent-retirement test).
- **Unauthorized version publication:** gated by `rewardProgram.manage`, same evaluator chain as everything else — no new authorization mechanism, no new attack surface.
- **Immutable historical versions:** enforced by the command surface having no `UPDATE` path for a non-`draft` version (§24) — a client cannot construct a request that mutates a published version, since no such command exists to call.
- **Provider-independent identity:** every actor reference is the server-resolved Customer Identity id via the existing `resolveAuthenticatedBusinessActor` chain — no raw Firebase UID, no client-supplied identity claim, consistent with every other domain audited in this codebase to date.
- **Direct database/client access:** PostgreSQL is never client-reachable (accessed only server-side through the Functions/API boundary, per `DEC-DATA-008`'s own approved architecture) — no Firestore-Rules-equivalent concern exists for this store, since there is no client SDK path to it at all.

**No material security gap identified in this design.**

## 33. Test Strategy

**Domain/schema:**
- `required_verified_units` CHECK rejects any value other than 10 (both at the database and application-parser layer).
- `reward_quantity` CHECK rejects any value other than 1.
- `UNIQUE (reward_program_id, version)` rejects a duplicate version number.
- Partial unique index rejects a second simultaneously-`active` version for the same program.
- A non-`draft` version cannot be updated through `updateRewardProgramDraft` (command-level rejection).
- An invalid program-status transition (e.g. `draft → paused`) is rejected (mirrors `isValidBusinessStatusTransition`'s own test-matrix convention).
- Cross-Business isolation: a program's `businessId` cannot be changed, and one Business's commands cannot target another Business's program.

**Authorization:**
- Owner allowed for create/edit/publish/version/retire where governed.
- Manager denied by default, allowed with an explicit override grant.
- Staff denied unconditionally.
- Cross-Business denied (a Manager of Business A cannot manage Business B's program).
- Unauthenticated denied.

**Cross-store:**
- Missing Business (id doesn't resolve) → denied.
- Business in an ineligible status (`draft`, `closed`, etc.) → denied.
- Inactive/missing/wrong-type Commerce Knowledge node at draft-save → rejected.
- Commerce Knowledge node retired between draft-save and publish → publish re-validates and rejects (or, if the product decision is "retirement mid-draft should not block publish of an otherwise-complete draft," that is a genuine open product question this design flags rather than silently resolves — see §34's discussion item).

**Idempotency:**
- Same-key replay of `createRewardProgram` returns the original result, creates no second program.
- Same-key, different-request-hash → conflict, fails closed.
- Concurrent create/publish under the same key → exactly one succeeds, the other observes duplicate/in-progress correctly.
- Atomic domain+idempotency commit — a forced mid-transaction abort leaves neither the domain row nor the idempotency completion durable (mirrors the `PLATFORM-BASELINE-003-CORR-001`/`004A-CORR-001` regression-test pattern exactly).

**Versioning:**
- First version creation succeeds and is immediately queryable.
- `createNextRewardProgramVersion` succeeds against an existing program with a published current version.
- A prior version remains queryable (and its content unchanged) after a new version publishes.
- `getRewardProgram`/a hypothetical future Purchase-domain read correctly resolves to the version that was current at the referenced time, never silently re-resolving to whatever is current *now*.

**UI:**
- `requiredVerifiedUnits`/`rewardQuantity` fields render as read-only display text, never as an editable input, under every role.
- EN/FR parity for every new locale key.
- Loading/error/success states for create, edit, publish, retire.

Not implemented here — this is the required test inventory for the future implementation package, per the task's explicit instruction not to write tests in this design task.

## 34. Genuine Founder Decision Gates

**[REFINED by `CORR-001` — item 1 (Manager authority) is resolved outright, not left as a discussion item: 005A excludes Manager access entirely rather than picking a default. Items 2 and 3 are resolved by narrowing scope (defer the operation) rather than by picking a default behavior. See `CORR-001`'s corresponding sections for the firmer disposition of each.]**

Applying the task's own instruction to avoid governance inflation and not reopen `threshold=10`, `rewardQuantity=1`, PostgreSQL target, provider-independent identity, or single-branch MVP:

**None of the following block starting `PLATFORM-BASELINE-005A` implementation.** They are recorded here as light, non-blocking discussion items the Founder/technical reviewer may want to weigh in on, each with a safe default this design already adopts so implementation is not stalled waiting for an answer:

1. **Question:** Should `rewardProgram.manage` be Manager-override-eligible (like most of the sensitive catalogue) or Owner-only non-delegable (like `staff.assignRole`)?
   **Why current authority doesn't answer it:** no decision-register entry or PRD/TRD statement addresses Manager authority over Reward Program configuration specifically.
   **What it blocks:** nothing — this design's default (override-eligible) can ship now and be tightened to Owner-only later with a one-line catalogue change if the Founder prefers the stricter default; the reverse (loosening from Owner-only later) is equally cheap. Not a blocking gate.
   **Options:** (a) override-eligible [this design's recommendation, consistent with the catalogue's own majority pattern]; (b) Owner-only non-delegable.

2. **Question:** Does a Commerce Knowledge node retiring *between* draft-save and publish-attempt block that specific publish, or is a already-in-draft reference grandfathered through to publication?
   **Why current authority doesn't answer it:** `isEligibleForNewReference`/`isResolvableForExistingReference` govern *new* vs. *existing* references, but a draft's reference is arguably "new" until the version itself becomes the "existing" historical record at publish time — the predicates don't disambiguate a draft-in-progress from a not-yet-existing reference.
   **What it blocks:** nothing structural — this design's default (re-validate at publish, reject if retired) is the conservative, safe choice and can ship now; loosening it later is a small, backward-compatible change.
   **Options:** (a) re-validate and reject [this design's recommendation]; (b) grandfather a draft's already-selected nodes through to publish regardless of a later retirement.

3. **Question:** What is the actual numeric plan-capacity limit for "active Reward Programs" (`DEC-SUB-004` counts them; `DEC-SUB-008` would set the number)?
   **Why current authority doesn't answer it:** `DEC-SUB-008` (plan catalogue/prices/limits) is not in this task's reviewed decision set and is, per the prior PB004 assessment, itself `OPEN_FOUNDER`.
   **What it blocks:** nothing — the safe interim default (no enforced limit, i.e. `NULL`/unconfigured) is strictly more permissive than any future confirmed limit could retroactively require, so it cannot cause an incorrect denial; wiring in a real limit later is additive.
   **Options:** (a) no enforced limit until `DEC-SUB-008` resolves [this design's recommendation]; (b) implement a hardcoded placeholder limit now (not recommended — invents an unauthorized number).

**No decision register modification and no new Founder decision are recorded by this document**, per the task's explicit instruction.

## 35. Implementation-Entry Verdict

**[SUPERSEDED by `CORR-001` — see the CORR-001 section near the end of this document for the corrected, final verdict and the narrowed exact scope. The verdict direction below (YES) is retained, but the scope is narrower after re-verification — do not treat the paragraph below alone as current.]**

**YES — IMPLEMENTATION READY** (original disposition; narrowed by `CORR-001`).

Every field, state, and rule this design specifies traces to already-governed authority (PRD6, TRD10 §10.9, the Commerce Knowledge Standard, `DEC-LOY-001`/`009`, `DEC-DATA-008` plus the corroborating-but-second-hand `PLATFORM-BASELINE-001` "loyalty spine" framing corrected in §8, `DEC-ID-003`). The two genuinely open decisions in this domain (`DEC-LOY-008`, `DEC-LOY-013`) govern strictly downstream/adjacent concerns (Loyalty Cycle overflow mechanics; cross-program migration and seasonal variants) that this design's recommended scope does not touch. `DEC-LEGAL-002` blocks live/real-Business operation, not schema/implementation validated against fixture state — exactly the distinction this task's own framing draws. The discussion items originally in §34 are resolved more precisely in `CORR-001` (Manager authority, permission count, Knowledge Node retirement rule, and plan-capacity boundary all received a firmer disposition than "safe non-blocking default").

## 36. Recommended `PLATFORM-BASELINE-005A` Scope

**[SUPERSEDED by `CORR-001`'s §"Final 005A Entry Verdict and Scope" — the scope below includes `retireRewardProgram`/`archiveRewardProgram` and a two-permission catalogue, both narrowed by `CORR-001`. Retained below for record-keeping; the corrected scope is in `CORR-001`.]**

**PLATFORM-BASELINE-005A — Reward Program Foundation** (original scope; narrowed by `CORR-001`)

- PostgreSQL migrations for `reward_programs`, `reward_program_versions`, `reward_program_version_qualifying_nodes`, `idempotency_keys`, `reward_program_outbox` (§22, §25, §26) — the first real schema this codebase's migration mechanism will apply.
- Domain model/repository layer over those tables, using `withPlatformTransaction` throughout.
- New `rewardProgramPermissionCatalogue.ts` (§14) wired into the existing evaluator.
- Six commands (§27): `createRewardProgram`, `updateRewardProgramDraft`, `publishRewardProgramVersion`, `createNextRewardProgramVersion`, `retireRewardProgram`, `archiveRewardProgram`, plus the two reads `getRewardProgram`/`listRewardPrograms`.
- Minimal Business Dashboard UI (§28): list + create/edit-draft + publish action, with the two fixed fields rendered read-only.
- Full test suite per §33.
- A synthetic `trial`-status Business emulator fixture (§29) enabling local validation without depending on `DEC-LEGAL-002`.

**Not fragmented into multiple packages** — the task's own preference for one bounded package is achievable here, since none of the six commands has an independent authority gate the others lack; splitting further (e.g. "create" as its own package, "publish" as another) would only add coordination overhead without isolating any distinct risk or decision boundary.

## 37. Explicit Exclusions

- Purchase (recording, disputes, corrections)
- Verification (customer verify/reject/dispute workflow)
- Verified Units (issuance, ledger)
- Loyalty Cycle (progress, active-cycle enforcement, overflow allocation — blocked on `DEC-LOY-008` regardless)
- Reward issuance and Redemption (On Us Moment creation)
- Commercial/billing accounting (Subscription domain, `DEC-SUB-003`/`008`)
- Participant/customer-facing experience (no customer ever sees a Reward Program screen from this package)
- Any cross-program customer-migration or seasonal-variant mechanism (`DEC-LOY-013`, both open questions)

## 38. Risks

1. **Permission-catalogue governance friction:** adding a new `rewardProgramPermissionCatalogue.ts` module is a new pattern (three catalogues instead of two) — low risk technically, but the exact sign-off process for a *new* catalogue module (vs. extending an existing closed one) has no direct precedent in this codebase; recommend the implementation package explicitly flag this for Founder/engineering-lead awareness, not treat it as silently pre-approved by this design document.
2. **Cross-store TOCTOU residual risk:** the Firestore-read-then-PostgreSQL-write pattern (§9, §32) is not a true atomic cross-store transaction — a node could theoretically change status in the microseconds between the validation read and the PostgreSQL commit. This exact residual risk already exists and is accepted throughout the current Business-domain codebase (same pattern, same acceptance) — not a new risk this design introduces, but worth naming rather than implying false atomicity.
3. **`schema_migrations` becomes non-empty for the first time:** this package would be the first to actually populate the `migrations/` directory the `PLATFORM-BASELINE-001` runner was built for — a genuine "first real use" milestone with correspondingly higher scrutiny value (recommend the implementation package's own review pay particular attention to migration-runner behavior against real, non-fixture SQL, even though the runner itself is already tested against synthetic fixtures).
4. **Local-preview fixture risk:** the recommended `trial`-status Business emulator fixture (§29) must be built carefully to the same safety standard as `seedTestOnlyTermsFixture.mjs` (emulator-only, project-id-gated) — a careless implementation could create a foot-gun that appears to work in a non-`demo-11thonus` environment.

## 39. Commands Executed

```
git fetch --all --prune
git rev-parse origin/main
git worktree list
git worktree add /private/tmp/11thonus-pb005-design origin/main -b docs/platform-baseline-005-reward-program-entry-design
grep -n -i "reward.program|threshold|loyalty.cycle" docs/00-governance/canonical-reference.md
grep -n -i "PLATFORM-BASELINE-DESIGN-001|postgres.*authorit|loyalty engine" docs/05-implementation/reports/platform-baseline-001-postgres-foundation-implementation-report-2026-09-11.md
find docs -iname "*platform-baseline-design*"
grep -rln "PLATFORM-BASELINE-DESIGN-001" docs/
grep -n -i "shared.number|reward.quantity|PLATFORM-BASELINE-DESIGN" docs/00-governance/canonical-reference.md
find docs/01-product -iname "*reward*" -o -iname "*loyalty*"
cat functions/src/config/loyaltyInvariants.ts
find docs -iname "*commerce-knowledge*"
cat functions/src/domains/commerceKnowledge/models/knowledgeNodeType.ts
cat functions/src/domains/commerceKnowledge/models/referenceEligibility.ts
grep -n "rewardProgram|RewardProgram" docs/02-technical/trd/10-firestore-data-architecture.md
grep -n -i "reward.program" docs/05-implementation/reports/DATA-ARCH-001-pre-pilot-persistence-architecture-reassessment-2026-09-08.md
grep -n "authoritative|Loyalty|Domain" docs/05-implementation/reports/DATA-ARCH-001-pre-pilot-persistence-architecture-reassessment-2026-09-08.md
grep -n "Phase 3" docs/05-implementation/change-tracking/engineering-implementation-programme.md
cat functions/src/domains/permissions/models/ordinaryPermissionCatalogue.ts
cat functions/src/infrastructure/postgres/migrations/README.md
```
Plus three parallel read-only Explore-agent research passes across `docs/00-governance/decisions/`, `docs/01-product/prd/`, `docs/02-technical/trd/`, `docs/03-standards/`, `docs/05-implementation/roadmap/`, `functions/src/domains/`, and `functions/src/infrastructure/postgres/`, and one direct read of a related, uncommitted-to-main prior assessment found in an existing scratch worktree.

## 40. Files Modified

- **Created:** this report, in the isolated design worktree only (`/private/tmp/11thonus-pb005-design`, branch `docs/platform-baseline-005-reward-program-entry-design`).
- **No file in the primary worktree was modified.** No production code, tests, schemas, Firestore Rules, PostgreSQL migrations, or other governance documents were changed anywhere. The decision register was not modified. No new Founder decision was recorded.

## 41. Dependencies/Config/Schema Changes

**None.** No migration was created or run. No PostgreSQL table was created. No dependency was added. No Firebase configuration was touched. No Firestore Rules were touched.

## 42. Rollback Instructions

This design task made no changes to the primary worktree or to `main`. To remove the isolated design worktree and its throwaway branch entirely:
```
git worktree remove /private/tmp/11thonus-pb005-design
git branch -D docs/platform-baseline-005-reward-program-entry-design
```
If this report is pushed for review, standard PR revert/close applies — no other rollback is needed since no production, schema, or governance state was touched.

---

# CORR-001 — Design Authority Correction (2026-09-13)

**Type:** Documentation/design correction only. No implementation performed. This section corrects and tightens the design above wherever it overstated authority or picked an unnecessary "safe default" instead of either finding the true governed answer or narrowing scope to avoid the question.

## CORR-001.1 — Recovered entry state

Isolated worktree `/private/tmp/11thonus-pb005-design` inspected before any change: branch `docs/platform-baseline-005-reward-program-entry-design`, `HEAD` = `452236e` exactly, working tree clean, zero divergence from `origin/main` (re-fetched, still `5ee3bcd8c157ae62416e5822f4270e96584a04d0` — `main` has not moved since the original design was written). The existing report was not recreated; every correction below is an edit against the existing document plus this appended section.

## CORR-001.2 — PB001 provenance correction (item 2)

**Corrected everywhere it appeared** (§8 item 3, §22's schema-section header, §35's verdict paragraph — all edited in place above, not merely footnoted). The original report's §8 item 3 claimed `PLATFORM-BASELINE-001` "explicitly reserve[d] `reward_programs` and `reward_program_versions` as named future PostgreSQL tables." Re-reading `PLATFORM-BASELINE-001`'s own report §9 directly: it states its shipped `migrations/` directory is empty and explicitly lists `reward_programs`/`reward_program_versions` (among others) as tables that were **not** created — a disclaimer of non-creation, not a reservation or schema definition. This has been corrected in place. **`reward_programs`, `reward_program_versions`, and `reward_program_version_qualifying_nodes` are PROPOSED BY PLATFORM-BASELINE-005** — new naming choices of this design task, not inherited, reserved, or previously assigned by `PLATFORM-BASELINE-001` or any other prior package.

## CORR-001.3 — PostgreSQL authority re-verification (item 3)

**Distinguished, per the task's instruction: ARCHITECTURAL AUTHORITY vs. SCHEMA NAMING PROPOSAL.**

- **Architectural authority — retained, confirmed by:** (a) `DEC-DATA-008` (CONFIRMED): general direction that PostgreSQL is the platform's target authoritative durable transactional datastore; (b) `DATA-ARCH-001`'s recommendation table (the evidentiary basis for `DEC-DATA-008`), which assigns "Purchase, verified units, cycles, rewards, redemptions" and "rules/knowledge configuration" to PostgreSQL — confirmed by direct re-read that it does **not** name "Reward Program(s)" by that literal string anywhere (zero grep matches), so the read-across to Reward Programs is this design's own structural analogy (both domains share the same "definitions/versions/assignments" shape per canonical-reference.md's ownership table), not a direct statement; (c) `PLATFORM-BASELINE-001`'s own report consistently uses the term "loyalty spine" to describe the cluster of domains its infrastructure work exists to eventually serve, and explicitly treats `reward_programs`/`reward_program_versions` as belonging to "a separately authorized future implementation package" rather than as fictional or out-of-scope-forever — this is corroborating context, not primary proof, since the design document it cites (`PLATFORM-BASELINE-DESIGN-001-CORR-001`) is not itself a tracked, independently-readable file in this repository.
- **Schema naming — new proposal, not inherited (corrected, CORR-001.2 above).**
- **No contrary authority was found anywhere in the reviewed source chain** (canonical-reference.md, PRD6, TRD10, DATA-ARCH-001, the decision register) suggesting Reward Program should remain Firestore-authoritative or split-authoritative. Per the task's instruction ("if not explicitly supported, STOP rather than infer") — this is a case of *reasonable, disclosed inference from consistent corroborating evidence*, not fabrication from silence; it is retained, but its evidentiary weakness (item (c)'s unverifiable second-hand citation) is now stated plainly rather than presented as "direct, concrete evidence" as the original report overstated.

## CORR-001.4 — Version/active-state invariant re-check (item 4)

**Re-inspected TRD10 §10.9.2 directly: `status: "draft" | "active" | "superseded"` is the literal, already-canonical enum for `RewardProgramVersionDocument`.** This answers the task's question (A) directly: **`active` is already a governed Reward Program Version state** (TRD10, not an inferred implementation state). This part of the original design was correct and is retained unchanged.

**The partial-unique-index invariant ("at most one active version") is a structural derivation from two independently governed facts, made explicit here rather than left implicit as in the original report:**
1. `rewardPrograms.currentVersionId: string` (TRD10 §10.9.1) is **singular**, not an array or set — the schema itself only ever points at one version as current.
2. The version-status enum's third value, `superseded`, is semantically only meaningful as "the version that *was* active before a newer one became active" — a version cannot coherently be both `active` and `superseded` at once, and TRD10's own state model has no "co-active" concept anywhere else in the document.

Together, these two already-canonical facts entail "at most one active version per program at any instant" as a matter of internal consistency with TRD10's own schema — not an invented business rule, and not something `DEC-LOY-013` bears on at all (that decision concerns cross-*program* migration and seasonal *variants*, never within-program version concurrency). **The partial unique index is retained, database-enforced, and its justification is now explicit rather than asserted.**

**State separation, per the task's explicit request:**
- **Draft/editable state:** version `status = 'draft'` — freely mutable by its owning command until published.
- **Published/effective version:** version `status = 'active'` — the one `current_version_id` on the program points to; immutable from the instant it is set.
- **Historical immutable version:** version `status = 'superseded'` — permanently retained, never deleted, resolvable forever.
- **Future scheduled version:** **not governed, not implemented.** No `scheduled` state exists in TRD10 or the PRD; `effectiveFrom`/`effectiveUntil` remain informational fields only (§11), not a scheduling mechanism.
- **Pause/seasonal/migration behavior:** governed by `DEC-LOY-013`, left explicitly unresolved and unimplemented — see CORR-001.9 below for the exact operational consequence this now has for 005A's command scope (narrower than the original report's, which defined the states but incorrectly implied their triggering commands were also safe to build now).

## CORR-001.5 — Manager authority disposition (item 5)

**Re-inspected PRD6 (the Reward Program PRD section) end-to-end and TRD10 §10.9 end-to-end: neither mentions Owner, Manager, Staff, or any role/actor-authority concept anywhere.** `DEC-ID-003` governs the general permission-inheritance *model* (confirmed), not any Reward-Program-specific role assignment. No decision-register entry, PRD statement, or TRD field addresses whether a Manager may view, create, edit, publish, or version a Reward Program.

**Per the task's explicit instruction ("avoid creating governance if Manager capability can simply be excluded... while Owner-only behavior is already governed"): this design now excludes Manager (and Staff) access entirely from 005A, rather than picking an "override-eligible by default" recommendation as the original report did.** Owner authority as an implicit floor over every permission in this codebase is a confirmed, structural pattern (`evaluatePermission.ts`) requiring no new governance to rely on. **Corrected disposition: `rewardProgram.manage` is Owner-only in 005A — no Manager-override path is built, modeled, or recommended.** This is not "materially unresolved and required for 005A" (the task's third option) — it is *not required at all*, because a working, fully-governed Owner-only Reward Program capability is achievable without answering the Manager question, and Manager access can be added later as a pure additive extension (a new override-eligibility flag) without any redesign. **No Founder decision is flagged for this item.**

## CORR-001.6 — Permission model refinement (item 6)

**Re-examined whether `rewardProgram.view` should exist as a catalogue permission at all, against actual existing architecture rather than by analogy to the sensitive catalogue's inheritable-read entries.** Direct precedent check: this codebase's existing Business-domain reads (`getOwnedBusinesses`, `getAccessibleBusinesses`, `getBusinessContext`, `listStaffInvitations`, `listStaffMemberships`) are **never** gated through `authorizeAndExecute`/the permission evaluator — they are gated purely on "is the caller an active member of this Business," resolved directly from membership state, with no permission-catalogue entry involved at all. **This is the actual, consistent architectural pattern for reads in this codebase — the original report's `rewardProgram.view` catalogue entry was not a representation of existing product authority; it was new, unnecessary policy invention, modeled on the sensitive catalogue's inheritable-read shape (which exists for a different reason: gating a *sensitive* data field, `customer.viewProtectedProfile`, not a general domain read).**

**Corrected: exactly one permission is required — `rewardProgram.manage` (Owner-only, per CORR-001.5).** `getRewardProgram`/`listRewardPrograms` are gated by active-membership resolution only, matching `getBusinessContext`'s own pattern exactly — no `rewardProgram.view` entry exists.

**Catalogue/module boundary — why architectural, not governance-driven:** a new, dedicated `rewardProgramPermissionCatalogue.ts` module (rather than appending to `ordinaryPermissionCatalogue.ts`) is retained, for a reason distinct from any governance concern: `ordinaryPermissionCatalogue.ts`'s own header comment states it is a **closed set of exactly the four entries a specific past Founder disposition (`FD-CORR-3`) approved**, and appending to it would require re-opening that already-closed instrument for an unrelated purpose. A new module for a new domain is the same *structural* pattern the codebase already uses to keep the sensitive and ordinary catalogues "structurally separate, disjoint tables" (the ordinary catalogue's own explicit design principle) — extending that separation one further time for a third, unrelated domain is an architectural consistency choice, not an attempt to invent or bypass governance. The new module still requires the same kind of routine engineering sign-off any new permission needs; it does not manufacture new authority, it just avoids re-litigating an unrelated closed set.

## CORR-001.7 — Knowledge Node retirement rule (item 7)

**Corrected from a "safe non-blocking default" to an exact rule, per the task's explicit demand, using the stated principle ("cross-store mutable authority is revalidated at the authoritative operation boundary where it matters"):**

- **Draft creation:** every qualifying node reference and the category/reward-node reference must be `active` and of the correct type at the moment they are added (`isEligibleForNewReference`, reused unmodified). A reference to a non-`active` or wrong-type node is rejected at creation.
- **Draft editing:** the same `active`-type check applies **only to node references being newly added or changed in that specific edit** — an edit to an unrelated field (e.g. `rewardDescription`) does **not** force re-validation of node references that were already present and untouched. The draft is not yet a durable historical fact, so a node quietly going stale in an untouched, already-selected slot is inert until the draft reaches the one operation that actually matters:
- **Publish (the authoritative operation boundary):** every qualifying node, the category node, and the optional reward node in the version being published are **re-validated as `active`** via an authoritative Firestore read immediately before publication. **[Corrected by `REVIEW-FINDINGS-001` — see that section below for the exact, honestly-scoped semantic contract. The Firestore read is NOT part of the PostgreSQL transaction's conflict set — do not read this bullet as claiming atomic, distributed fail-closed consistency; it is server-authoritative validation with a disclosed, bounded cross-store race window.]** If any referenced node is not `active` at the moment of that validation read, the publish is rejected — the Business must update the draft (remove or replace the stale reference) before publishing successfully.
- **Historical read:** once published, a version's node references remain valid and resolvable forever via `isResolvableForExistingReference` (`active`/`retired`/`archived` all resolve) — **a historical published version is never invalidated merely because a referenced node later becomes inactive**, exactly as the task requires and exactly as TRD10's Version Integrity Rule already implies.

**No cross-store PostgreSQL foreign key is required or proposed** — every check above is a synchronous Firestore read performed by the command layer at the two moments that matter (add-time, publish-time), never a database-level constraint spanning two heterogeneous stores.

## CORR-001.8 — Plan-capacity boundary (item 8)

**Re-verified `DEC-SUB-004` (CONFIRMED): "Plan capacity limits count active Reward Programs, not individual mapped products."** This confirms a *counting mechanism* exists at the product-decision level, but the actual numeric limits depend on `DEC-SUB-008` (plan catalogue/prices/limits), which is outside this task's reviewed decision set and was independently flagged `OPEN_FOUNDER` by the prior `PLATFORM-BASELINE-004` assessment.

**Corrected disposition, per the task's explicit instruction not to invent a numeric limit and not to "pretend one exists":** `PLATFORM-BASELINE-005A` **does not implement any plan-capacity check at all** — neither a fail-open "unlimited" policy nor a fail-closed "deny all publish attempts" policy, since either would be inventing a behavior current authority does not specify. This is a **clean scope exclusion**, exactly like Purchase or Verified Units — capacity *enforcement* is a distinct, separately-dependent operation to be added once `DEC-SUB-008` resolves, not a policy this package should simulate. Reward Program **schema/CRUD**, **draft creation/editing**, and **publication/activation** all proceed with no capacity gate in 005A. **Counting** "active Reward Programs" (the mechanism `DEC-SUB-004` refers to) and **billing enforcement** against a real limit are both out of scope, to be added by whichever future package first has a real number to enforce.

## CORR-001.9 — `DEC-LOY-008` impact matrix (item 9, corrected from a blanket statement)

| Operation | Blocked by `DEC-LOY-008`? | Reasoning |
|---|---|---|
| Schema (tables, columns, constraints) | **No** | Threshold/quantity are stored as fixed facts on the version row; the schema does not implement overflow logic |
| Create draft | **No** | No overflow-allocation logic is invoked |
| Edit draft | **No** | Same |
| Publish first version | **No** | Publishing sets fixed, governed facts; does not compute or allocate anything |
| Create next version | **No** | Same reasoning as create |
| Transaction applicability (a future Purchase referencing this program) | **N/A to 005A** (Purchase not built); when built, `DEC-LOY-008` will govern how *that* domain allocates overflow units, not whether a Purchase may reference a program version |
| Loyalty Cycle | **Yes — directly blocks** | Loyalty Cycle progress/overflow computation cannot be finalized until this decision resolves (a separate, not-yet-built domain) |
| Overflow behavior | **Yes — this is exactly what the decision is about** | The decision question itself |
| Pause/migration/seasonal operations | **No** | Governed by `DEC-LOY-013`, a different decision (see below) |

## CORR-001.10 — `DEC-LOY-013` impact matrix (item 9, corrected from a blanket statement)

| Operation | Blocked by `DEC-LOY-013`? | Reasoning |
|---|---|---|
| Schema (the 5-state program / 3-state version enums) | **No** | The states themselves are canonical (canonical-reference.md §7, TRD10 §10.9.2) independent of `DEC-LOY-013`'s resolution — the enum's existence commits to nothing the decision might resolve differently |
| Create draft | **No** | Not implicated |
| Edit draft | **No** | Not implicated |
| Publish first version | **No** | Not implicated |
| Create next version | **No** | PRD6 §6's ordinary "description/mapping/display" version-update use case is explicitly distinct from `DEC-LOY-013`(b)'s "migrate customers between different programs" question — creating a new version of the *same* program is not customer migration |
| Transaction applicability | **N/A to 005A** | Not built |
| Loyalty Cycle | **Partially blocks** | Whether pause preserves accumulated in-cycle progress is `DEC-LOY-013`(a), formally `OPEN_FOUNDER` at the decision-register level (even though PRD6 §5 states the intended outcome) — a future Loyalty Cycle implementation cannot rely on this being settled yet |
| Overflow behavior | **No** | Governed by `DEC-LOY-008`, a different decision |
| **Pause/migration/seasonal operations (the actual commands)** | **Yes — directly blocks, corrected disposition** | All three of `DEC-LOY-013`'s open questions concern exactly these operations. **Corrected from the original report:** the original design treated the `paused`/`retired`/`archived` *states* and their *triggering commands* as equally safe to implement now ("STATE RESERVED / STRUCTURAL, not BLOCKED... the basic transition... is safe to implement"). Re-examined more carefully: `DEC-LOY-013`(a) explicitly asks the Founder to "confirm" that pause preserves accumulated progress — meaning this specific guarantee is **not yet Founder-confirmed** at the decision-register level, only stated as product intent in the PRD. Per canonical-reference.md's own document-hierarchy rule ("where the register overrides a PRD/TRD statement, the register entry is the governed correction mechanism"), an unconfirmed register-level question about a state's core behavioral guarantee means **the *command* that transitions a program into that state carries open semantics, even though the *state value* itself is safely definable in a closed enum.** `PLATFORM-BASELINE-005A` therefore **excludes `pauseRewardProgram`, `retireRewardProgram`, and `archiveRewardProgram` from its command set** — the states remain in the schema `CHECK` constraint (forward-compatible, harmless to declare), but no command reachable in 005A ever sets them. |

## CORR-001.11 — Final 005A entry verdict and scope (item 10)

**YES — IMPLEMENTATION READY**, for a scope narrower than the original report's:

**`PLATFORM-BASELINE-005A` corrected exact scope:**
- PostgreSQL schema: `reward_programs`, `reward_program_versions`, `reward_program_version_qualifying_nodes` (table/column names PROPOSED BY PLATFORM-BASELINE-005, per CORR-001.2), plus `idempotency_keys` and `reward_program_outbox` — schema unchanged from §22 except naming-provenance labeling; the `status` enums retain all 5/3 states structurally (CORR-001.4), even though not every state is reachable by a 005A command.
- Domain model/repository layer using `withPlatformTransaction` throughout — unchanged.
- **One** permission, `rewardProgram.manage`, Owner-only, no Manager/Staff path (CORR-001.5, CORR-001.6) — in its own new catalogue module (architectural reasoning per CORR-001.6).
- **Four** commands only: `createRewardProgram`, `updateRewardProgramDraft`, `publishRewardProgramVersion` (draft → active, first version only reachable initially since no prior active version exists to supersede), `createNextRewardProgramVersion`. **`retireRewardProgram`/`archiveRewardProgram`/`pauseRewardProgram` are excluded** (CORR-001.10).
- **Two** reads, `getRewardProgram`/`listRewardPrograms`, gated by active Business membership only — **no `rewardProgram.view` permission** (CORR-001.6).
- Knowledge Node validation per the exact rule in CORR-001.7 (active-type check at add-time for new/changed references; full re-validation at publish; no re-check of untouched draft fields; historical versions never invalidated).
- **No plan-capacity check of any kind** (CORR-001.8) — clean scope exclusion, not a fail-open/fail-closed simulation.
- Minimal Business Dashboard UI: list + create/edit-draft + publish action only — no pause/retire/archive controls (since no such commands exist to call).
- Test suite per §33, narrowed to the four commands and two reads actually in scope.
- The synthetic `trial`-status Business emulator fixture (§29), unchanged.

**Explicitly deferred to a later, separate package** (not 005A): pause/retire/archive operations (pending `DEC-LOY-013`'s formal confirmation, or a decision that the PRD's stated intent is itself sufficient authority — a Founder/product call this design does not make); Manager/Staff access to Reward Program (pending a future, purely additive decision); plan-capacity enforcement (pending `DEC-SUB-008`).

## CORR-001.12 — Genuine Founder decisions, corrected

**[Updated by `FOUNDER-DISPOSITION-001`]** `CORR-001`'s own analysis concluded none was strictly required to start `PLATFORM-BASELINE-005A`, reached by *narrowing scope to avoid open questions* (Manager access excluded entirely; pause/retire/archive deferred; plan-capacity check omitted) rather than by *picking unstated "safe defaults" for open questions and calling them non-blocking*. The Founder has since reviewed this analysis and explicitly confirmed the two load-bearing points it rested on (persistence authority; lifecycle scope) directly, rather than leaving them resting on this design's own self-assessment — see the Founder Disposition section below for the recorded text.

---

# FOUNDER DISPOSITION — `PLATFORM-BASELINE-005-FOUNDER-DISPOSITION-001` (2026-09-13)

The Founder reviewed `CORR-001` (above) and issued two package-scope/architectural clarifications, confirming rather than altering `CORR-001`'s own conclusions. These are recorded verbatim in substance below; no decision-register entry was created or modified, and this is not a new governance exercise — it is confirmation of the corrected design's own two most load-bearing judgment calls (§CORR-001.3 and §CORR-001.10/.11), which `CORR-001` itself had flagged as reasonable-but-not-Founder-verified inferences.

## FD-1 — Reward Program persistence

**Reward Program is authorized as a PostgreSQL-authoritative domain for the new 11thONUS loyalty-engine spine.** PostgreSQL owns: Reward Program stable identity; configuration; immutable versions; transactional idempotency; transactionally co-located audit/outbox records. Existing authorities remain unchanged: Business, Customer Identity, workforce/permissions, and Commerce Knowledge continue exactly as they are today; Reward Program references those domains by stable identifiers only (§9 of this report, unchanged). **This does not authorize:** dual authority, Firestore Reward Program copies, migration of existing Firestore domains, or any broad database migration.

This directly confirms `CORR-001.3`'s retained-but-flagged-as-second-hand conclusion — the architectural direction §8/`CORR-001.3` already recommended is now Founder-confirmed outright, not merely corroborated by inference. **No change to §8, §9, or §22's schema design was required** — the schema-naming-provenance correction in `CORR-001.2` stands unchanged (the table names remain PROPOSED BY PLATFORM-BASELINE-005, not inherited from any prior package).

## FD-2 — `PLATFORM-BASELINE-005A` lifecycle scope

**`PLATFORM-BASELINE-005A` shall exclude pause, retire, and archive.** The first implementation is limited to: the PostgreSQL Reward Program foundation; draft configuration; immutable versioning; first publication; subsequent version creation; governed reads; and the minimum Business-facing configuration UI. Pause/retire/archive semantics remain deferred, tied to `DEC-LOY-013`'s eventual resolution.

This directly confirms `CORR-001.10`/`CORR-001.11`'s corrected scope exactly as already narrowed — no wording change to the command list, schema enums, or UI contract was required.

## Net effect on this design

Both dispositions **confirm, rather than alter,** the exact `PLATFORM-BASELINE-005A` shape `CORR-001` had already arrived at independently. No section of this report needed technical revision as a result — only the framing of "is a Founder decision required" (§1, §CORR-001.12) is corrected, from "none required" to "the required clarification has been sought and received, and no further Founder decision blocks implementation."

---

# Final PR Review Findings Resolution — `PLATFORM-BASELINE-005-REVIEW-FINDINGS-001` (2026-09-13)

PR #250's automated review (`chatgpt-codex-connector[bot]`, against head `a6a6dac`) raised three findings, all confirmed valid against actual repository code/authority before correcting. This section is the disposition record; the specific inaccurate claims in §14/§22/CORR-001.6/CORR-001.7 above have also been corrected in place (see the inline `[Corrected by REVIEW-FINDINGS-001]` markers).

## RF-1 — Permission evaluator integration (P1, CONFIRMED VALID)

**Verified directly against `functions/src/domains/permissions/evaluator/evaluatePermission.ts`:** `classifyPermission` returns exactly `"sensitive" | "ordinary" | "unknown"` via `isSensitivePermission`/`isOrdinaryPermission`; the Owner floor (line ~279) is gated on `isSensitivePermission` specifically, not on any third class; the ordinary branch (line ~304) only recognizes `isOrdinaryPermission`; every other permission falls through to the final `NO_APPLICABLE_GRANT` deny. **A `rewardProgram.manage` permission declared in a brand-new, separate catalogue module, exactly as originally designed, would therefore be denied for every actor, including the Owner** — the finding is correct as stated.

**Resolution — actual code determines the answer, not convenience:** `rewardProgram.manage`'s finalized shape (Owner: allow, Manager: deny, Staff: deny, no explicit-grant/override path, per-permission `eligibleBusinessStatuses`) is **structurally identical** to `ordinaryPermissionCatalogue.ts`'s existing four entries. However, that specific table is a closed set the Founder previously approved to hold exactly those four ids (`FD-CORR-3`) — appending to it would re-open that specific closed instrument for an unrelated purpose, which is exactly the friction the original design's separate-catalogue choice was trying to avoid (CORR-001.6). **The corrected design keeps the separate `rewardProgramPermissionCatalogue.ts` module, and adds the smallest possible third classification path to the evaluator, mirroring the existing ordinary-permission branch's own logic exactly (no new algorithm, no new evaluation order, no broad redesign):**

1. **Declaration:** `functions/src/domains/permissions/models/rewardProgramPermissionCatalogue.ts` (new file) — same entry shape as `OrdinaryPermissionCatalogueEntry` (`id`, `roleDefaults: Record<Role, boolean>`, `eligibleBusinessStatuses: readonly BusinessLifecycleStatus[]`), containing exactly one entry: `rewardProgram.manage` (`roleDefaults: {owner: true, manager: false, staff: false}`, `eligibleBusinessStatuses: ["trial", "active"]`). **Correction to this design's own earlier assumption:** `permissionId.ts` defines `PermissionId` as `string`, validated only by shape (`PERMISSION_ID_PATTERN`, a dot-namespaced lowercase-leading identifier) — it is deliberately *not* a closed enum (its own header comment: "not a closed universal enum ... would invent identifiers no governed document defines"). `rewardProgram.manage` already satisfies that shape; **no change to `permissionId.ts` is needed at all**, only to the evaluator and the new catalogue module.
2. **Classification:** `evaluatePermission.ts`'s `classifyPermission` gains a third branch returning `"rewardProgram"` when `isRewardProgramPermission(permission)` is true (a new exported predicate on the new catalogue module, mirroring `isOrdinaryPermission`'s exact shape).
3. **Recognition/authorization:** a new branch is inserted immediately after the existing ordinary-permission branch (both have no override/inheritance mechanism, so both resolve and return before the override-resolution steps below them): `if (isRewardProgramPermission(permission)) { look up the entry; if roleDefaults[role] is true, allow with reasonCode "ROLE_DEFAULT_ALLOW"; otherwise deny with "NO_APPLICABLE_GRANT" }` — this is a verbatim structural copy of the existing ordinary-permission branch (lines ~304–315), not a new authorization algorithm.
4. **Owner-only enforcement:** since `roleDefaults.owner = true` and `roleDefaults.manager = roleDefaults.staff = false`, only the Owner is ever allowed — matching `CORR-001.5`'s disposition exactly, enforced the same mechanical way `business.updateProfile`'s Owner-only shape already is.
5. **Unknown permissions still fail closed:** the final fallthrough `deny(now, "NO_APPLICABLE_GRANT", ...)` at the end of `evaluatePermission.ts` is completely untouched — a permission that is none of sensitive, ordinary, or reward-program still denies exactly as it does today. The structural-separation invariant (`ordinaryPermissionCatalogue.ts`'s own module-load-time check that no id is claimed by two catalogues) is mirrored for the new module against both existing catalogues.

**This is a small, mechanical, three-branch addition to an existing pure function — not a permission-framework redesign.** `PLATFORM-BASELINE-005A`'s scope now explicitly includes this evaluator change as a required deliverable (§CORR-001.11 is updated by reference — see the final scope below).

## RF-2 — Version-level snapshot of `sharedLoyaltyNumberAllowed` (P1, CONFIRMED VALID)

**Verified directly against TRD10 §10.9.2:** `RewardProgramVersionDocument` includes `sharedLoyaltyNumberAllowed: boolean` as one of its fields — the original design's §11 "minor simplification" (keeping it program-level only) was a genuine, undisclosed departure from the cited authority, not a neutral simplification. The finding is correct: without a version-level snapshot, a historical Purchase/Loyalty Cycle referencing an old version could not recover the policy that actually governed it once a Business changes the policy for a later version — the current-program-row value would incorrectly retroactively apply.

**Resolution:** `shared_loyalty_number_allowed` is now **authoritatively owned by `reward_program_versions`** (added to the schema table above, matching TRD10 exactly), snapshotted immutably at each version's creation. The `reward_programs` table retains its own `shared_loyalty_number_allowed` column, but it is now explicitly labeled a **current-value convenience projection only** (updated whenever a new version publishes, for cheap "does this program currently allow shared numbers" reads) — **no command in this design reads it as historical authority; every command needing the value that governed a specific version reads `reward_program_versions.shared_loyalty_number_allowed` for that version's row.**

**Re-audit of every other field for the same class of error, per the task's explicit instruction:** every other version-level field already listed in §22's `reward_program_versions` table (`required_verified_units`, `reward_quantity`, `reward_description`, `standard_reward_node_id`, `multiple_units_allowed`, `bulk_review_threshold`, `effective_from`, `effective_until`, plus the qualifying-nodes junction table) was already correctly version-scoped in the original design — cross-checked against TRD10 §10.9.2's full field list, `sharedLoyaltyNumberAllowed` was the **only** field TRD10 places on `RewardProgramVersionDocument` that this design had incorrectly left off it. `display_name` and `reward_program_category_id` remain correctly program-level-only, matching TRD10 §10.9.1 exactly (TRD10 itself does not version either field — they are identity/display metadata, not commercial terms a historical Purchase/Cycle needs to reinterpret). **No other field required correction; this re-audit does not broaden into a schema redesign.**

## RF-3 — Cross-store publication race — accurate semantic contract (P2, CONFIRMED VALID)

**Verified directly:** a Firestore read performed by application code before or during a PostgreSQL transaction is not part of that PostgreSQL transaction's conflict-detection/isolation mechanism — the two systems have no shared transaction coordinator. The original design's §15/CORR-001.7 language ("closes the exact TOCTOU gap `businessProfileCommand.ts` already closes") was inaccurate: `businessClassificationValidation.ts`'s pattern reads and writes **inside one Firestore transaction**, so Firestore's own optimistic-concurrency retry genuinely closes that gap — the cross-store case has no equivalent mechanism, so the finding is correct that the original claim overstated what publish-time re-validation actually guarantees.

**Resolution — the minimum truthful contract, no new coordination mechanism, no distributed transaction or lock, per the task's explicit instruction:**

- **(A)** Before publishing a Reward Program version, the server performs an authoritative Firestore read of every Commerce Knowledge reference required for publication (every qualifying node, the category node, the optional reward node).
- **(B)** The server validates the governed conditions against that read — correct `nodeType` and `active` status (`isEligibleForNewReference`, reused unmodified) — for every reference.
- **(C)** Where the Firestore repository layer makes it available, the validation captures the read's evidence (e.g. the document's `updatedAt`/version field, and the server's own authoritative-read timestamp) as part of the command's audit/outbox payload — for diagnostic/reconciliation traceability only, not as a distributed-consistency mechanism.
- **(D)** Only after every reference passes validation does the server begin the PostgreSQL publication transaction.
- **(E)** That PostgreSQL transaction atomically owns exactly: the version's `draft → active` transition, the prior version's `active → superseded` transition, the `current_version_id` pointer update, idempotency completion, and the audit/outbox write — all in one `withPlatformTransaction` call, unchanged from §26/§27's design.
- **(F)** The Firestore validation read is explicitly **not** part of that PostgreSQL transaction's conflict set — this design makes no claim otherwise.
- **(G)** **The bounded cross-store race is explicitly documented:** a Commerce Knowledge node may be retired between the authoritative validation read (A) and the PostgreSQL commit (E). This window is real, is not eliminated by this design, and is disclosed rather than hidden.
- **(H)** **Semantic boundary, consistent with the design's own already-adopted historical-immutability rule (CORR-001.7's last bullet):** a version that passed authoritative validation at its publication-validation point is **not retroactively invalidated** merely because the referenced node was retired microseconds later, during the race window, or at any point after publication. This is not a special case invented for the race window — it is the exact same rule this design already applies to every published version's entire remaining lifetime (a node retiring the day after publication has never been treated as invalidating that version, per §15/CORR-001.7); the race window is simply the earliest possible instant that same already-accepted rule could apply.
- **(I)** This is accurately described as **"server-authoritative publish-time validation with a disclosed bounded cross-store race window"** — not strict distributed fail-closed consistency, and this design makes no claim to the contrary anywhere after this correction.
- **(J)** **No conflict with existing authority was found** requiring a STOP — this semantic contract is fully consistent with TRD10's own Version Integrity Rule and this design's own historical-immutability principle; it does not weaken either, it simply describes accurately what a cross-store validation-then-write pattern can and cannot guarantee. No distributed transaction, distributed lock, or new coordination service is introduced.

## Review-thread disposition

All three findings were verified against actual repository code/authority before the report was corrected (not accepted or dismissed on their text alone), the specific inaccurate claims were fixed in place (§14/§22/CORR-001.6/CORR-001.7, plus this section), replies were posted on each thread citing the exact correction, and each thread was marked resolved only after the report change was pushed — never before.

## Updated `PLATFORM-BASELINE-005A` scope (supersedes `CORR-001.11`'s list, same shape, three additions)

- PostgreSQL Reward Program schema (`reward_programs`) — unchanged.
- PostgreSQL Reward Program **version** schema (`reward_program_versions`), **now including `shared_loyalty_number_allowed` as an authoritative version-level snapshot** (RF-2).
- Qualifying-node junction table — unchanged.
- **`rewardProgramPermissionCatalogue.ts` + the corresponding three-branch `evaluatePermission.ts` classification/authorization addition (RF-1)** — now an explicit, required part of 005A's scope, not assumed.
- Owner-only first-cut management (`rewardProgram.manage`, enforced via the RF-1 evaluator path).
- Membership-gated reads (`getRewardProgram`/`listRewardPrograms`) — unchanged, no permission entry.
- `createRewardProgram`, `updateRewardProgramDraft`, `publishRewardProgramVersion`, `createNextRewardProgramVersion` — unchanged command set (still excludes pause/retire/archive per `FOUNDER-DISPOSITION-001`/FD-2).
- Publish-time Commerce Knowledge validation, **now documented with the accurate RF-3 semantic contract** (server-authoritative, disclosed bounded race window — not distributed-atomic).
- PostgreSQL-atomic idempotency and audit/outbox — unchanged.
- Minimal Business configuration UI — unchanged.
- Tests per §33, extended to cover the RF-1 evaluator branch and RF-2's version-vs-projection distinction.
- Local Founder preview using Firebase emulators + local PostgreSQL — unchanged.

**Still excluded, unchanged:** pause, retire, archive, Purchase, Verification, Verified Units, Loyalty Cycle, Reward issuance, Redemption, overflow handling, plan-capacity enforcement, billing/commercial accounting.

---

## FINAL DISPOSITION

**PLATFORM-BASELINE-005 — DESIGN APPROVED / REVIEW FINDINGS CLOSED / MERGED / CLOSED**

No implementation was performed by this design package. No decision-register modification. No CORR-002 was created — this section resolves standing PR review findings against the existing report in place. `PLATFORM-BASELINE-005A` may now proceed exactly within the scope recorded above, in a separate, future implementation task.
