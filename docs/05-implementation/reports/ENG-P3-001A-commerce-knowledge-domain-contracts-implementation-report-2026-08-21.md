> **Title:** ENG-P3-001A — Commerce Knowledge Domain Contracts & Schema Foundation — Implementation Report
> **Status:** Implemented, test-first, independently reviewed and corrected — merged
> **Source-of-truth path:** `docs/05-implementation/reports/ENG-P3-001A-commerce-knowledge-domain-contracts-implementation-report-2026-08-21.md`
> **Governing document:** [`ENG-P3-001-DESIGN-001` v1.4](../roadmap/ENG-P3-001-DESIGN-001-commerce-knowledge-architecture-delivery-design.md) §7 (Entity Model), §9.4 (`DEC-DATA-005` resolved), §20 (Firestore Model), §28 (Implementation Decomposition)

## Independent final review addendum (2026-08-21, head `608fb172f92bfa3c1fcc2f42a263602d3d4aa2ea`)

Independent review re-derived every claim below directly from source (the design document, TRD10 §10.7.1–3, `errorCategories.ts`, and existing platform domain-contract precedent) rather than trusting this report, in a fresh clean worktree checked out at PR #144's exact head. **Five genuine defects found and fixed, each TDD-first (RED confirmed before the fix):**

1. **Hierarchy parent-consistency gap (Phase D):** `createKnowledgeNode` validated `nodeType`↔`parentNodeType` adjacency but never checked `parentId`↔`parentNodeType` structural consistency — a caller could construct e.g. an `industry` root with a non-null `parentId` alongside `parentNodeType: null`. Fixed with `isConsistentParentReference`/`assertConsistentParentReference` (`knowledgeNodeType.ts`), checked before the adjacency rule.
2. **Missing root/depth invariant (Phase E):** nothing enforced `depth === 0` for a root node or `depth > 0` for a non-root node. Fixed in both `createKnowledgeNode` and `fromKnowledgeNodeDocument` (the exact `childDepth === parentDepth + 1` comparison remains `ENG-P3-001B`'s, since it requires reading the actual parent's persisted depth).
3. **Numeric validation did not fail closed (Phase F):** every document reader's `depth`/`version`/`schemaVersion` check used `typeof x === "number" && x < bound`, which silently admits `NaN`/`Infinity`/fractional values (`NaN < bound` and `Infinity < 0` both evaluate `false`). Replaced with `Number.isInteger`-gated checks across all three document readers, matching the platform's own established precedent (`trustRecord.ts`/`trustRuleVersion.ts`).
4. **`KnowledgeTag` legacy `translations` field tolerated, not rejected (Phase H):** `fromKnowledgeTagDocument` silently ignored a stray legacy inline `translations` map. Design §4 confirms zero live Commerce Knowledge data exists anywhere, so no migration/compatibility need exists — changed to fail closed instead, preventing a silent second localization authority. (The pre-existing test's own title said "returns null" while its assertion checked `not.toBeNull()` — a genuine test/title mismatch, corrected to match the adopted disposition.)
5. **No Firestore path-separator rejection on identifier fields (Phase I):** added a `"/"` rejection to every Commerce Knowledge identifier field (`KnowledgeNode.id`/`parentId`/`replacementNodeId`, `KnowledgeTag.id`, `KnowledgeTranslation.entityId`), matching `evaluatePermission.ts`'s established platform precedent for `businessId`. Also added a dedicated test proving the deterministic composite translation id is collision-free even when `entityId` itself contains underscore substrings resembling `entityType`/`languageCode` tokens (proven, not merely assumed).

**No further defect found** in a full re-derivation of: timestamp duck-typing (matches existing repo-wide precedent exactly, no stricter semantics invented); translation `reviewedBy`/`reviewedAt` retention on `published→draft` (no governing source mandates clearing; kept as historical record, now proven by a dedicated test rather than left as an untested accident); canonical/translation lifecycle transition matrices; retirement's mandatory `replacementNodeId` (re-confirmed the design's own literal requirement, not over-tightening); reference-eligibility predicate's translation-independence; localization/EN-fallback; document-reader tolerance of a harmless additive unknown field (re-confirmed intentional, now tested explicitly, and distinguished from the specifically-forbidden `translations` case); error taxonomy (closed 14 categories only); framework independence (ESLint boundary mechanically re-proven by lint-testing a temporary forbidden-import probe file directly, then deleting it — not merely assumed present).

**Scope audit:** re-confirmed via `git diff --stat` against `f2d455e` — exactly 26 files under `functions/src/domains/commerceKnowledge/` + `eslint.config.js`, plus this report; zero touch to `business`/`permissions`/`apps/web`/Rules/deployment anywhere in the diff.

25 tests added by this review (130 → 155). Full regression re-run on the corrected head: 1402 functions unit tests, 397 web tests, 553 emulator tests, typecheck/lint/format/build all clean. Hosted CI green on the final head (`608fb17`).

# ENG-P3-001A — Commerce Knowledge Domain Contracts & Schema Foundation

## 1. Entry state (Phase A)

- **Entry `origin/main` SHA:** `f2d455eb6b50438de117fb3e8746793e91972296` — verified via `git fetch origin` before any work began.
- PR #142 (`ENG-P3-001-DESIGN-001`, merge `2d746b67b0e1fd7d9d2bd4ca92e0af208f67eef7`) and PR #143 (closure sync, merge `f2d455e`) both confirmed `MERGED` via `gh pr view`.
- Post-merge CI on `f2d455e` confirmed green: `Build`, `Lint`, `Test`, `Emulator Validation` all `success` (`gh api .../check-runs`).
- **No `ENG-P3-001A`/`B`/`C` work existed anywhere**: `gh pr list --state open` showed exactly one open PR (#34, docs-only, unrelated); `git branch -r` showed no `eng-p3-001a`/`001b`/`001c`/`commerce-knowledge`/`knowledge` branch beyond the already-merged design branches.
- `DEC-DATA-005` confirmed **RESOLVED** in `decision-register.md` (Engineering Lead, 2026-08-20) exactly as the design document claims — the five-value canonical enum and unchanged three-value translation enum are recorded verbatim. `DEC-TECH-008` confirmed **OPEN_ENGINEERING**, non-blocking.
- Clean worktree created directly from `origin/main` at `/Users/theo/worktrees/eng-p3-001a`, branch `feat/eng-p3-001a-commerce-knowledge-contracts`. Primary worktree (`/Users/theo/11THONUS`) never touched this session.

## 2. Scope authorization

This task authorizes **domain contracts and schema/lifecycle foundation only** (design §28's `ENG-P3-001A` row). Explicitly excludes: Firestore repositories, seed-loader/seed manifest, seed dataset, `Business.primaryCategoryId`/`businessTypeId` live validation wiring, Knowledge Studio, onboarding frontend, search infrastructure, callable/HTTPS endpoints, new permission identifiers, Firebase deployment, Firestore Rules changes, and `ENG-P3-001B`/`001C`/`002`/`003`.

## 3. Sources inspected (Phase B)

Read directly, in full or by targeted section, before writing code:
- `ENG-P3-001-DESIGN-001` v1.4, all 34 sections (entity model §7, ownership model §8, `DEC-DATA-005` disposition §9, seed-data boundary §10 [read only to confirm exclusion], localization §11, identifiers §12, authorization §13 [confirmed no catalogue touch needed], events §14 [confirmed none needed], Business integration §15, Firestore model §20, command/query architecture §21, validation/test architecture §22, security/tenant invariants §24, decomposition §28).
- `decision-register.md`'s `DEC-DATA-005` (RESOLVED) and `DEC-TECH-008` (OPEN_ENGINEERING) entries verbatim.
- TRD10 §10.7.1–§10.7.3 (`knowledgeNodes`/`knowledgeTranslations`/`knowledgeTags`, exact as-declared field shapes) — reconstructed field-for-field, correcting only the `status` enums per `DEC-DATA-005`'s resolution and removing `KnowledgeTag.translations` per the disposed schema clarification.
- Commerce Knowledge Standard Part III (hierarchy) and Part IX (tags) — confirmed against the design's own citations, not re-litigated.
- `functions/src/shared/errors/errorCategories.ts` (the closed 14-category taxonomy) and `platformError.ts` (`PlatformFieldError` shape).
- Existing domain-contract precedent, read in full: `functions/src/domains/business/models/{business,businessStatus,businessErrors,businessBranchDocument}.ts` (aggregate/lifecycle/error/document-reader conventions); `functions/src/domains/identity/` and `functions/src/domains/trust/` directory structure (framework-independence pattern, no `services`/`repositories` yet at this stage); `functions/src/domains/permissions/models/`.
- `eslint.config.js` in full — every existing per-domain `no-restricted-imports` framework-boundary block (Identity, Loyalty Number, QR Identity, Authentication, Permissions, Trust, Business), to add a consistent new block.
- `functions/vitest.config.ts`/`vitest.emulator.config.ts` — confirmed unit vs. emulator test separation convention.

## 4. Pre-implementation strategy (stated before coding, Phase B)

A new framework-independent domain, `functions/src/domains/commerceKnowledge/models/`, containing only pure value types, lifecycle state machines, validators, fail-closed document readers/writers, and domain errors — no `repositories/`, `services/`, or `commands/` subfolder exists in this package at all (there is no persistence or command layer to carve out an exemption for, unlike Identity/Business/Trust/Permissions at their own foundation stage). TDD throughout: every module's test file was written first, run to confirm genuine RED (`Cannot find module`), then implemented to GREEN.

1. **Contracts in 001A:** `KnowledgeNode`/`KnowledgeTag`/`KnowledgeTranslation` value types + validators; the shared canonical lifecycle (`draft|in_review|active|retired|archived`) for Node/Tag; the separate translation lifecycle (`draft|reviewed|published`); the parent-type adjacency table (§7.1.1); a pure cycle-protection predicate operating on a caller-supplied ancestor-id list; reference-eligibility predicates (new-reference gate vs. existing-reference resolution); retirement/replacement structural rules; the EN/FR localization contract with fallback; fail-closed document parsers; domain errors on the closed taxonomy; an ESLint framework-boundary block.
2. **Deferred to `ENG-P3-001B`:** Firestore repositories, the seed manifest/loader, the actual ancestor-chain graph traversal (a repository read) that supplies `wouldCreateHierarchyCycle`'s input, the concrete `DEC-TECH-008` query-abstraction implementation.
3. **Deferred to `ENG-P3-001C`:** wiring `isEligibleForNewReference` into `createBusiness`/`updateBusinessProfile`.
4. **Canonical knowledge platform-global:** no `businessId`/`branchId`/`ownerUserId`/`membershipId` field anywhere — proven by a dedicated negative test per entity plus a repository-wide grep.
5. **Localization separate from canonical identity:** `KnowledgeNode.canonicalName` is internal-only; `KnowledgeTranslation` is the sole customer-facing label source, generalized to `(entityType, entityId, languageCode)` per design §9.3's disposed schema clarification, so `KnowledgeTag` reuses it rather than retaining TRD10's original inline `translations: Record<string,string>` map.
6. **Lifecycle validation pure/framework-independent:** every module is plain TypeScript with no I/O; machine-enforced via a new `eslint.config.js` `no-restricted-imports` block banning `firebase-admin`/`firebase-functions` anywhere in `functions/src/domains/commerceKnowledge/**`.
7. **Hierarchy integrity without persistence:** `isValidParentNodeType` is a pure `(childType, parentType)` check; `wouldCreateHierarchyCycle` is a pure predicate over a caller-supplied ancestor-id array — real graph traversal (resolving that array from Firestore `parentId` pointers) is explicitly deferred to `ENG-P3-001B`, this module only defines the closed-form predicate that traversal must satisfy.

## 5. Files added

All under `functions/src/domains/commerceKnowledge/models/` (24 files: 12 implementation + 12 test):

| File | Purpose |
|---|---|
| `commerceKnowledgeErrors.ts` | Domain error class + 12 factory functions, all mapped onto the existing 14-category taxonomy |
| `knowledgeLifecycle.ts` | Canonical five-value lifecycle (`KnowledgeNode`/`KnowledgeTag`) + transition matrix |
| `translationLifecycle.ts` | Translation three-value lifecycle + transition matrix |
| `languageCode.ts` | EN/FR closed localization contract + EN fallback |
| `knowledgeNodeType.ts` | Six-value node-type union + parent-type adjacency table + pure cycle predicate |
| `referenceEligibility.ts` | New-reference vs. existing-reference pure predicates (the 001C/002 export surface) |
| `knowledgeNode.ts` | `KnowledgeNode` value type, `createKnowledgeNode`, `transitionKnowledgeNodeStatus` |
| `knowledgeNodeDocument.ts` | Fail-closed `knowledgeNodes` document reader/writer |
| `knowledgeTag.ts` | `KnowledgeTag` value type, `createKnowledgeTag`, `transitionKnowledgeTagStatus` |
| `knowledgeTagDocument.ts` | Fail-closed `knowledgeTags` document reader/writer (no `translations` field) |
| `knowledgeTranslation.ts` | Generalized `KnowledgeTranslation` value type, `createKnowledgeTranslation`, `transitionKnowledgeTranslationStatus` |
| `knowledgeTranslationDocument.ts` | Fail-closed `knowledgeTranslations` document reader/writer |
| `frameworkBoundary.test.ts` | Structural proof: no `repositories/services/commands` subfolder yet, no seed file, no `firebase-admin`/`firebase-functions` import anywhere in the domain |

Plus one modification: `eslint.config.js` — one new block (mirroring the Identity/Business/Trust precedent exactly), scoped to `functions/src/domains/commerceKnowledge/**/*.ts`, no `ignores` (no persistence subfolder exists yet to exempt).

No other file in the repository is modified.

## 6. Diff summary

`git status` confirms exactly two things changed relative to `origin/main`: the new `functions/src/domains/commerceKnowledge/` directory (24 new files, no modifications to any existing file inside it) and `eslint.config.js` (34 lines added, 0 removed, 0 modified elsewhere in the file).

## 7. `KnowledgeNode` contract (Phase D)

Reconstructed exactly from TRD10 §10.7.1 plus design §7.1: `id` (opaque, Firestore document key, never a params field), `nodeType` (closed six-value union, immutable), `parentId` (`string | null`), `canonicalName`, `slug` (non-authoritative), `path`, `depth`, `description?`, `iconKey?`, `status` (resolved five-value lifecycle), `version` (starts at 1), `replacementNodeId?`, `searchTerms: string[]` (defaults `[]`), `createdAt`/`updatedAt`/`schemaVersion` (standard metadata). `createKnowledgeNode`'s params type has no `status` key — a caller cannot supply an initial status other than `draft` even structurally, mirroring `business.ts`'s own precedent. `parentNodeType` is an explicit caller-supplied param (the already-resolved type of the referenced parent) so the §7.1.1 adjacency rule is validated purely at construction time, without this module performing a repository read.

## 8. `KnowledgeTag` contract (Phase E)

Reconstructed from TRD10 §10.7.3 with the design's own disposed correction applied: `id`, `tagGroup` (closed four-value union), `canonicalName`, `slug`, `status` (shared five-value lifecycle with `KnowledgeNode`), `searchTerms`, standard metadata. **Deliberately does not carry a `translations` field** — the design's §9.3 `ENGINEERING SCHEMA CLARIFICATION` explicitly disposes this (not an open question requiring a STOP-and-report): `KnowledgeTag` reuses `knowledgeTranslation.ts`'s generalized shape instead of retaining a second, inconsistent inline-map localization mechanism. This is the disposed option, not an invented one — the design document names exactly this restructuring as `001A`'s to perform (§7.3, §9.3, §20's inline comment). A dedicated negative test (`knowledgeTag.test.ts`) proves the returned shape has no `translations` property.

## 9. `KnowledgeTranslation` contract (Phase F)

Generalized to `(entityType, entityId, languageCode)` rather than TRD10 §10.7.2's original `(nodeId, languageCode)`-only shape — the design's §9.3 explicitly offers this generalization as the way to give `KnowledgeTag` a reusable localization mechanism without a dual-authority split; `entityType` is a closed two-value union (`"knowledge_node" | "knowledge_tag"`). Composite uniqueness `(entityType, entityId, languageCode)` is enforced by construction via a deterministic id (`{entityType}_{entityId}_{languageCode}`), the same pattern `ENG-P2-002B` established for `businessCodeReservations/{businessCode}`. Fields: `displayName`, `description?`, `synonyms: string[]` (defaults `[]`), `status` (three-value translation lifecycle), `reviewedBy?`, `reviewedAt?`, standard metadata. A dedicated test proves the same constructor produces a valid translation for both `entityType` values without modification — the "one authoritative representation, reused, not duplicated" claim is exercised, not just asserted.

## 10. Canonical lifecycle implementation (Phase M — `KnowledgeNode`/`KnowledgeTag`)

`knowledgeLifecycle.ts`: closed five-value `KNOWLEDGE_LIFECYCLE_STATUSES = ["draft","in_review","active","retired","archived"]`, exactly `DEC-DATA-005`'s resolved enum — no sixth state, no reintroduction of `pending_review`/`approved`/`published` (each asserted absent by a dedicated test). Transition matrix, reconstructed verbatim from design §9.4: `draft→in_review`; `in_review→active` and `in_review→draft` (governed rework); `active→retired`; `retired→archived`; `archived` terminal (empty edge set — no transition out, including back to `active`/`retired`/`draft`, each asserted). Every edge *not* in the matrix (`draft→active` directly, `active→archived` directly, `retired→active`, `archived→retired`) is asserted to return `false`/throw.

## 11. Translation lifecycle implementation (Phase F/M)

`translationLifecycle.ts`: closed three-value `TRANSLATION_LIFECYCLE_STATUSES = ["draft","reviewed","published"]`, unchanged from TRD10 §10.7.2 as the design confirms. Transition matrix per design §9.4/§M: `draft→reviewed`; `reviewed→published` and `reviewed→draft` (governed rework); `published→draft` (governed correction cycle, same document — confirmed no terminal state distinct from `published`, since `published` can still move back to `draft`). `draft→published` directly is asserted to throw; `published→reviewed` (not a recorded edge) is asserted to throw.

## 12. Hierarchy implementation (Phase I)

`knowledgeNodeType.ts`: closed six-value `KNOWLEDGE_NODE_TYPES` union, reconstructed verbatim from TRD10 §10.7.1. `ALLOWED_PARENT_TYPE` table reconstructed directly from Commerce Knowledge Standard Part III's fixed linear chain (design §7.1.1): `industry`→root only (`parentId` must be `null`); `business_category`→`industry` only; `business_type`→`business_category` only; `reward_program_category`→`business_type` only; `standard_product`/`standard_service`→`reward_program_category` only. Tests prove both the positive chain and that invalid relationships fail closed: a `standard_product` pointing directly at an `industry` throws; any node type paired with a structurally unrelated parent type throws.

## 13. Cycle-protection contract (Phase J)

`wouldCreateHierarchyCycle(nodeId, candidateParentAncestorIds)` — a pure predicate: a cycle exists exactly when `nodeId` appears in the candidate parent's already-resolved ancestor-id chain. This is deliberately the *pure half only* of cycle protection — resolving that ancestor chain requires reading `parentId` pointers from persisted documents, which is repository state explicitly deferred to `ENG-P3-001B` (per the task's Phase J instruction: "define the pure interface/validation requirement and defer implementation to 001B"). Tests cover: no cycle (chain doesn't include the node), direct self-parent (degenerate one-hop cycle), a cycle several hops deep, and the empty-chain (root) case.

## 14. Reference-eligibility semantics (Phase G)

`referenceEligibility.ts` exports exactly two pure functions, the precise surface design §18/§G names as what `ENG-P3-001C` and `ENG-P3-002` both consume: `isEligibleForNewReference(status)` — `true` only for `"active"`; `isResolvableForExistingReference(status)` — `true` for `"active"`, `"retired"`, and `"archived"` (never `"draft"`/`"in_review"`, since those were never eligible to have been referenced in the first place). **F3 correction applied and proven, not just asserted**: neither function takes a `KnowledgeTranslation` status parameter — `isEligibleForNewReference` has arity 1, checked directly by a dedicated test — because no governing source couples translation-review progress to canonical-reference validity (design §9.4's independent-review correction). The worked example from the design (`KnowledgeNode` active, English translation published, French translation still draft ⇒ still a fully valid reference) is representable directly: `isEligibleForNewReference("active")` returns `true` regardless of any translation state, because no translation state is ever passed to it.

## 15. Retirement/replacement semantics (Phase H)

`transitionKnowledgeNodeStatus`: the `active→retired` edge *requires* `replacementNodeId` to be supplied at that same transition (throws `replacementNodeIdRequiredForRetirementError` otherwise) — reconstructing design §9.4's "`replacementNodeId` must be set at this transition" rule as an enforced invariant, not prose. A `replacementNodeId` equal to the node's own `id` (self-reference) is rejected. `KnowledgeTag` has no `replacementNodeId`/retirement-reference requirement (design §7.3 — tags are simpler, lower-churn objects; CKS itself describes no forward-reference mechanism for tags), so `transitionKnowledgeTagStatus`'s `active→retired` edge carries no such precondition — confirmed by a passing test with no `replacementNodeId` argument. `archived` is proven terminal for both entities (no edge back to `active`/`retired`/`draft`).

## 16. Localization/fallback semantics (Phase L)

`languageCode.ts`: `SUPPORTED_LANGUAGE_CODES = ["en","fr"]` exactly matching `apps/web/src/i18n/config.ts`'s own `SUPPORTED_LANGUAGES`/`DEFAULT_LANGUAGE` — no third MVP language, Kirundi/Swahili/Kinyarwanda deliberately absent (documentation-currency discrepancy the design itself flags, not resolved here). `resolveFallbackLanguageCode` returns English for any requested language (a no-op for English itself), matching i18next's own fallback convention. Translation key uniqueness is the `(entityType, entityId, languageCode)` composite id (§9 above). "Unavailable translation" is represented structurally, not as a special sentinel: a caller finding no `published` translation in the requested language falls back to English — this module supplies the fallback *language*; resolving whether a specific record exists is a repository-layer (`001B`) concern, out of a pure contract's reach. French absence is never treated as invalid canonical knowledge — nothing in `knowledgeNode.ts`/`referenceEligibility.ts` requires a French translation to exist for a node to be `active`/referenceable.

## 17. Identifier contracts (Phase K)

`KnowledgeNode.id`/`KnowledgeTag.id` are opaque Firestore document keys — never derived from `slug`/`canonicalName`, matching TRD10 §10.5's platform-wide opacity rule and `businessCode.ts`'s "slug is never identity" precedent. `slug` is present but structurally inert (referenced nowhere as a lookup key in any exported function). Exact literal identifier-generation policy (the seed manifest's `slug → id` mapping) is delegated to `ENG-P3-001B` per design §10.3 — `001A` supplies only the type-level contract (`id: string`, required, immutable) that a stable seed identifier must satisfy; it does not implement generation.

## 18. Error-taxonomy mapping (Phase O)

All 12 error factories in `commerceKnowledgeErrors.ts` map onto the existing closed 14-category `ErrorCategory` union (compile-time guaranteed — `tsc --noEmit` clean, no new category possible without a type error): malformed node/tag/translation fields, malformed hierarchy relation, malformed replacement reference, malformed language code, malformed schemaVersion → `VALIDATION_FAILED`; invalid lifecycle/translation-lifecycle transitions → `INVALID_STATE_TRANSITION`. No new category introduced.

## 19. Framework-independence result (Phase P)

New `eslint.config.js` block, `functions/src/domains/commerceKnowledge/**/*.ts`, `no-restricted-imports` banning `firebase-admin`/`firebase-admin/*`/`firebase-functions`/`firebase-functions/*` — no `ignores` list, since no `repositories/`/`services/` subfolder exists yet in this package (unlike Identity/Business/Trust at their own first-package stage, which had none either, and added the exemption only once their own `-B` package landed). `npx eslint functions/src/domains/commerceKnowledge` and workspace-wide `npx eslint .` both clean. `frameworkBoundary.test.ts` additionally scans every source file's text for `firebase-admin`/`firebase-functions` import strings as a second, redundant proof independent of the linter.

## 20. Business-field absence proof (Phase C/N)

`git grep -n "businessId\|branchId\|ownerUserId\|membershipId" functions/src/domains/commerceKnowledge --include="*.ts"` returns exactly one match — a doc-comment in `knowledgeNode.ts` *naming* the excluded fields, not a field declaration. Each of `KnowledgeNode`/`KnowledgeTag`/`KnowledgeTranslation` additionally has a dedicated `not.toHaveProperty` test for all four field names.

## 21. `ENG-P3-001B` leakage audit

No `repositories/` directory, no Firestore read/write call, no seed-manifest file, no seed dataset, no concrete `DEC-TECH-008` query implementation exists anywhere in this diff (`frameworkBoundary.test.ts` asserts the first three structurally). The only artifact 001B will consume is the pure contract surface (types, validators, predicates) — no 001B-scoped behavior is implemented.

## 22. `ENG-P3-001C` leakage audit

No modification to `functions/src/domains/business/**` (confirmed by `git status`/`git diff --stat` against `origin/main` — zero files touched outside `functions/src/domains/commerceKnowledge/` and `eslint.config.js`). `createBusiness`/`updateBusinessProfile` are untouched; `isEligibleForNewReference` exists as an exported pure function but is wired into nothing.

## 23. `ENG-P3-002`/`003` leakage audit

No callable/HTTPS transport, no onboarding UI, no Knowledge Studio editorial workflow, no `knowledgeSuggestions` schema, no platform-editor authorization/permission catalogue change exists anywhere in this diff. `ordinaryPermissionCatalogue.ts`/`sensitivePermissionCatalogue.ts`/`evaluatePermission.ts`/`authorizeAndExecute.ts` are untouched (confirmed by `git status`).

## 24. RED→GREEN evidence (Phase U)

Every module's test file was authored before its implementation and run to confirm genuine RED (`Error: Cannot find module './<module>' imported from ...test.ts`) before the implementation file was written, then re-run to confirm GREEN. This was directly observed for all 12 module pairs in this session — not retrospectively manufactured. Two follow-up ESLint failures (`no-unused-vars` on a destructure-omit pattern in three document modules, and on `languageCode.ts`'s unused fallback parameter) were found by running `eslint` after the GREEN pass, fixed by switching to explicit field-listing (matching `businessBranchDocument.ts`'s own convention) rather than destructure-and-discard, and re-verified GREEN + lint-clean together.

## 25. Tests added

130 tests across 13 test files under `functions/src/domains/commerceKnowledge/models/`, covering all 20 Phase U areas: exact shape (3 entities), closed canonical/translation lifecycle enums, canonical/translation transition matrices (positive and negative edges), node hierarchy adjacency (positive and negative), the pure cycle-protection contract, active/retired/archived reference-eligibility semantics, replacement-reference validation (required-at-retirement, self-reference rejection), translation independence from canonical reference validity (arity-based proof), EN fallback, malformed persisted-document input (11 negative parser tests across the three document readers), `schemaVersion` validation, framework-independence (ESLint + textual scan), and business-owned-field absence (repository-wide grep + per-entity property tests).

## 26. Full validation (Phase W)

| Check | Result |
|---|---|
| Focused Commerce Knowledge unit tests | 13 files, 130 tests passed |
| All `functions` unit tests | 139 files, 1377 tests passed |
| Firebase Emulator Suite (`pnpm emulators:validate`) | 40 files, 553 tests passed, exit code 0 — no Commerce Knowledge emulator behavior added (none was in scope), zero regression in existing suites |
| `apps/web` unit tests | 51 files, 397 tests passed — untouched by this change, as expected |
| `pnpm typecheck` (both workspaces) | Clean |
| `npx eslint .` (workspace-wide) | Clean |
| `npx prettier --check` | Clean after one `--write` pass (whitespace-only reformatting of newly added files) |
| `pnpm build` (both workspaces) | Clean — `functions` `tsc` and `apps/web` `tsc -b && vite build` both succeed |
| Manual secret scan (`grep` for AWS key/private-key/api-key/password patterns) | No match in any new file |

No runtime Firebase resource or deployment configuration is created, modified, or referenced by this change.

## 27. Dependencies added

None. No `package.json` change in any workspace.

## 28. Config changes

One: `eslint.config.js`, a new framework-boundary block (see §19). No other config file touched.

## 29. Firebase/Rules changes

None. `firestore.rules`, `firestore.indexes.json`, `firebase.json` are untouched.

## 30. Deployment changes

None.

## 31. Review findings/fixes

Two lint-only findings (destructure-omit unused-variable pattern in three files; one unused fallback parameter), found and fixed during this same implementation pass (§24) — not defects surviving to a separate review stage, since no automated reviewer/CI run against this exact head has occurred yet (see §37, PR not yet opened as of this report's authorship — opened immediately after).

## 32. Remaining material findings

None identified.

## 33. Downstream handoff (Phase T)

- **`ENG-P3-001B`** receives: the three persisted-document contracts (`knowledgeNode.ts`/`knowledgeTag.ts`/`knowledgeTranslation.ts` + their `*Document.ts` readers/writers), both lifecycle transition tables, the hierarchy adjacency table, the pure cycle-protection predicate (to be composed with a real ancestor-chain repository read), and the localization contract (EN/FR closed set + fallback language resolver). `001B` additionally owns: the seed manifest/loader, the concrete `DEC-TECH-008` query-abstraction implementation, and resolving the still-open translation-versioning recommendation (design §7.2 — whether translations need an independent `version` field).
- **`ENG-P3-001C`** receives: `referenceEligibility.ts`'s two exported predicates, to be wired into `createBusiness`/`updateBusinessProfile`'s existing command surface as an additive cross-domain read-and-validate step (design §15).
- **`ENG-P3-002`** receives (once `001B`'s repository/transport exists): the same reference-eligibility predicate for onboarding-submission validation, plus the localized read-query contract `001B` will expose.
- **`ENG-P3-003`** receives: the stable entity model and the resolved lifecycle vocabulary to build editorial screens against; the editorial workflow engine itself is not designed or implemented here.

## 34. Unresolved/open decisions

- `DEC-TECH-008` (search implementation) — remains `OPEN_ENGINEERING`, confirmed non-blocking to `001A` per the design's own §17 analysis; unaffected by this implementation.
- The `KnowledgeTranslation` independent-`version`-field question (design §7.2) — still open, `001A`'s to confirm per the design's own framing; not resolved by this pass since it is a `001B`-relevant persistence-versioning detail, not a domain-contract shape question this task's scope required disposing.

## 35. No-implementation boundaries (explicit)

No repository, seed-loader, seed dataset, callable/HTTPS transport, permission catalogue entry, Business command modification, search implementation, or Knowledge Studio/onboarding artifact exists anywhere in this diff — verified by `git status`/`git diff --stat` against `origin/main` showing only the 24 new files under `functions/src/domains/commerceKnowledge/` plus the single `eslint.config.js` addition.

## 36. Dirty primary worktree

None — `/Users/theo/11THONUS` was never entered or modified this session; all work occurred in the isolated worktree `/Users/theo/worktrees/eng-p3-001a`.

## 37. Risks

- The pre-existing `Business.primaryCategoryId`/`businessTypeId` validation gap (design §15/§32, unaffected by and not closed by this package — still open, `001C`'s to close) remains live: `createBusiness` still accepts any non-blank string with no existence check. This package does not change that exposure in either direction.
- `KnowledgeTranslation`'s generalized `(entityType, entityId, languageCode)` shape is a `001A`-level design choice made from the design document's own offered "or" option (reuse vs. generalize) — flagged here for Founder/Engineering-Lead visibility, since it is the one point where this implementation exercised documented discretion within an explicitly bounded choice, rather than reconstructing a single unambiguous literal shape.

## 38. Rollback

Revert the single commit on `feat/eng-p3-001a-commerce-knowledge-contracts` (or delete the branch/close the PR without merging) — no other repository state is touched; nothing to migrate or undo elsewhere.

## 39. Persistent report path

`docs/05-implementation/reports/ENG-P3-001A-commerce-knowledge-domain-contracts-implementation-report-2026-08-21.md` (this file).

## 40. Changes-tracking state

Not yet updated — the Engineering Implementation Programme / `CDR-001` Phase-3 row and Capability 3 status update are recorded in the closure-sync commit/PR immediately following this one, matching the established `ENG-P2-002A`-style two-commit pattern (implementation, then tracking-sync).

## Programme state after this package

- `ENG-P3-001A` = Implemented, pending Founder review/merge.
- `ENG-P3-001B`/`ENG-P3-001C` = Not started (require `001A` merged first, design §28/§30).
- `ENG-P3-002`/`ENG-P3-003` = Not started, unaffected.
- Capability 3 = Open — partially implemented; not closed (unchanged by this package alone).

## Exact next Founder action

Review this report and the PR diff; if acceptable, merge `feat/eng-p3-001a-commerce-knowledge-contracts` into `main`, then authorize `ENG-P3-001B` (Repositories & seed-loader) as the next bounded package.
