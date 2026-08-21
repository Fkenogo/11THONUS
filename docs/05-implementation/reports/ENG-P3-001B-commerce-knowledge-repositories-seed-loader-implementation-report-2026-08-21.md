# ENG-P3-001B — Commerce Knowledge Repositories, Persistence & Governed Seed Loading

## 1. Entry state (Phase A)

- `git fetch origin` confirmed `origin/main` at `e8d3e814e35fe531b38086564fb018463b51446c`.
- Branch `eng-p3-001b` created from `origin/main` at that exact SHA (`git checkout -B eng-p3-001b origin/main`).
- `ENG-P3-001A` (PR #144, merge `43eb962d9681904b1e22b84d4a329ee2739f771c`) and its closure sync (PR #145, `e8d3e81`) confirmed present in `origin/main`'s history.
- `gh pr checks 144` / `gh pr checks 145`: both **`success`** ("Build, Lint, Test, Emulator Validation").
- Branch/PR sweep (`git branch -a`, `gh pr list --search "commerce knowledge p3-001"`): no open PR and no in-progress local/remote branch for `ENG-P3-001B`/`ENG-P3-001C` other than the ones this task itself creates. **No overlapping work found.**
- `functions/src/domains/commerceKnowledge/models/` contents re-read directly (not assumed): `knowledgeNode.ts`, `knowledgeTag.ts`, `knowledgeTranslation.ts`, `knowledgeNodeType.ts`, `languageCode.ts`, `knowledgeLifecycle.ts`, `translationLifecycle.ts`, `referenceEligibility.ts`, `commerceKnowledgeErrors.ts`, and the three `*Document.ts` converters — all present, each with a `.test.ts`, matching the pre-verified state.
- `DEC-DATA-005`: confirmed `RESOLVED` in `decision-register.md` / design §9.4 (five-value canonical lifecycle `draft|in_review|active|retired|archived`, separate three-value translation lifecycle).
- `DEC-TECH-008`: confirmed `OPEN_ENGINEERING`, non-blocking to `ENG-P3-001A`/`B` (design §17/§25/§27).
- `DEC-CKS-001`/`DEC-CKS-002`: confirmed Founder-`APPROVED` (design §26).

## 2. Scope authorization

Founder-authorized `ENG-P3-001B` only: Commerce Knowledge repositories, persistence adapters, hierarchy-persistence validation, governed seed-manifest loading, repository-level integration tests. Explicitly **not** authorized and **not touched**: `Business.primaryCategoryId`/`businessTypeId` validation, `createBusiness`, `ENG-P3-001C`, onboarding, Knowledge Studio, permission-catalogue additions, search technology, callable/HTTPS endpoints, frontend, Firestore Rules, deployment, `ENG-P3-002`/`003`.

## 3. Sources inspected (Phase B)

- `docs/05-implementation/roadmap/ENG-P3-001-DESIGN-001-commerce-knowledge-architecture-delivery-design.md` v1.4 — §7 (entity model), §9.4 (resolved lifecycle), §10 (seed-data model), §20 (Firestore model), §21 (command/query architecture), §22 (validation/test architecture), §26 (Founder dispositions), §28 (decomposition) read in full.
- `docs/05-implementation/reports/ENG-P3-001A-commerce-knowledge-domain-contracts-implementation-report-2026-08-21.md` — full report read for the exact 001A contract surface and review findings already applied.
- `functions/src/domains/commerceKnowledge/models/*` — every model, document converter, and error-factory file read directly.
- `docs/02-technical/trd/10-firestore-data-architecture.md` §10.7 — cross-checked against the design's own citations (no material divergence found).
- `docs/03-standards/commerce-knowledge-standard.md` — Parts III–IX read in full (this is where the seed-content authority finding in §7 below originates).
- `docs/01-product/prd/03-business-registration.md` §7 ("Business Categories", the exact 15-item PRD3 list) and §15 ("Product Categories" — "the platform shall not prescribe products... businesses define their own") read directly.
- `functions/src/domains/business/repositories/businessRepository.ts` and its `.emulator.test.ts` — the converter/transaction/repository pattern this package's repositories mirror.
- `apps/web/src/i18n/locales/fr.ts` — checked directly for any existing authoritative French translation of the launch category names (none found — see §11).
- `functions/vitest.emulator.config.ts`, root `package.json` (`emulators:validate`) — the existing emulator-test invocation convention, reused unchanged.
- `eslint.config.js` — the `business/**` domain-boundary carve-out precedent (`repositories/**` exempted from the no-`firebase-admin` restriction), mirrored for this domain.

## 4. Pre-implementation strategy (stated before coding, Phase B)

- **Repository files**: `knowledgeNodeRepository.ts`, `knowledgeTranslationRepository.ts`, `knowledgeTagRepository.ts` under `functions/src/domains/commerceKnowledge/repositories/`, mirroring `businessRepository.ts`'s converter/repository split (§21).
- **Collection paths**: `knowledgeNodes`, `knowledgeTranslations`, `knowledgeTags` — exactly the names design §20/TRD10 §10.7 already declare, no renaming.
- **Firestore converter boundary**: 001A's `fromKnowledgeNodeDocument`/`toKnowledgeNodeDocumentFields` (and translation/tag equivalents) are the converter boundary already; 001B does not redefine them, only calls them.
- **Hierarchy-validation strategy**: repository-derived `path`/`depth`/`parentNodeType`, resolved inside a Firestore transaction from persisted parent state — never trusted from a caller. Reuses 001A's pure `assertValidParentNodeType`/`wouldCreateHierarchyCycle`-shaped predicates as the actual check logic; 001B supplies the transactional traversal around them.
- **Cycle-detection strategy**: bounded ancestor-chain walk (defensive technical guard, `MAX_ANCESTOR_TRAVERSAL = 64`, explicitly not a product depth limit) inside the same transaction as hierarchy resolution.
- **Seed-manifest strategy**: a pure, framework-independent manifest contract (`seedManifest.ts`) with referential-integrity validation and a computed topological sort, separate from the actual governed content (`burundiPilotSeedManifest.ts`) and the Firestore-touching loader (`seedLoader.ts`).
- **Idempotency strategy**: per-entry existence check; identical immutable content is a no-op; any mismatch fails closed (`IDEMPOTENCY_CONFLICT`) rather than overwriting.
- **What belongs to 001C and is NOT built here**: any change to `Business.primaryCategoryId`/`businessTypeId`/`createBusiness`, any live-reference validation wiring, any Business-facing read API. 001B exposes `getKnowledgeNodeById`/reference-eligibility (already in 001A) as the read surface 001C will later consume — nothing more.

No conflict was found between the merged design and the actual 001A contracts — no STOP condition was triggered in Phase B.

## 5. Files added

```
functions/src/domains/commerceKnowledge/repositories/knowledgeNodeRepository.ts
functions/src/domains/commerceKnowledge/repositories/knowledgeNodeRepository.emulator.test.ts
functions/src/domains/commerceKnowledge/repositories/knowledgeTranslationRepository.ts
functions/src/domains/commerceKnowledge/repositories/knowledgeTranslationRepository.emulator.test.ts
functions/src/domains/commerceKnowledge/repositories/knowledgeTagRepository.ts
functions/src/domains/commerceKnowledge/repositories/knowledgeTagRepository.emulator.test.ts
functions/src/domains/commerceKnowledge/seed/seedManifest.ts
functions/src/domains/commerceKnowledge/seed/seedManifest.test.ts
functions/src/domains/commerceKnowledge/seed/burundiPilotSeedManifest.ts
functions/src/domains/commerceKnowledge/seed/burundiPilotSeedManifest.test.ts
functions/src/domains/commerceKnowledge/seed/seedLoader.ts
functions/src/domains/commerceKnowledge/seed/seedLoader.emulator.test.ts
```

Modified: `functions/src/domains/commerceKnowledge/models/commerceKnowledgeErrors.ts` (additive — 10 new error factories for the repository/seed layer, no existing export changed), `functions/src/domains/commerceKnowledge/models/frameworkBoundary.test.ts` (updated to assert the new, correct 001B boundary — see §19), `eslint.config.js` (the `business/**` precedent's `repositories/**`/named-file carve-out, mirrored for this domain).

## 6. Repository architecture

Three repository modules, each a thin, framework-boundary wrapper: pure model construction/validation (001A) + Firestore read/write (001B), matching `businessRepository.ts`'s own split. No generic CRUD surface — only the operations the seed loader and (future) 001C read consumers actually need: `createKnowledgeNodePersisted`, `getKnowledgeNodeById`, `listKnowledgeNodeChildren`, `transitionKnowledgeNodeStatusPersisted`, `retireKnowledgeNodePersisted`, `validateReplacementNode`, `resolveHierarchyPlacement`; `createKnowledgeTranslationPersisted`, `getKnowledgeTranslationById`/`ByTuple`, `listKnowledgeTranslationsForEntity`, `transitionKnowledgeTranslationStatusPersisted`; `createKnowledgeTagPersisted`, `getKnowledgeTagById`, `listKnowledgeTagsByGroup`, `transitionKnowledgeTagStatusPersisted`.

## 7. Firestore collection paths

`knowledgeNodes/{nodeId}`, `knowledgeTranslations/{entityType}_{entityId}_{languageCode}`, `knowledgeTags/{tagId}` — exactly design §20's declared paths, no deviation.

## 8. Converter strategy

Unchanged from 001A: `fromKnowledgeNode*Document` returns `null` (never throws) for a structurally invalid document; `toKnowledgeNode*DocumentFields` produces a plain object with native `Date`. 001B's repositories call these directly and additionally `stripUndefined` before every Firestore write (matching `businessRepository.ts`'s own precedent — the Admin SDK rejects `undefined` values outright).

## 9. Hierarchy derivation

`resolveHierarchyPlacement` (in `knowledgeNodeRepository.ts`) is the single authority for `path`/`depth`/`parentNodeType`. It is always computed from a transactional read of the actual persisted parent — the public repository API has no parameter through which a caller could supply `path`/`depth` directly at all (structurally impossible to override, not merely validated-away).

## 10. Cycle validation

Same function walks the candidate parent's own ancestor chain (bounded at 64 steps — a defensive technical guard against malformed/cyclic existing data, explicitly not a product taxonomy-depth limit, per the task's own Phase I instruction). A self-reference (`parentId === nodeId`) is rejected before any read; an indirect cycle is detected mid-traversal; a missing/malformed ancestor fails closed (`malformedHierarchyAncestorError`) rather than being silently skipped.

## 11. Seed-manifest structure

`seedManifest.ts` (pure): `SeedNodeManifestEntry` (`id`, `nodeType`, `parentId`, `canonicalName`, `slug`, `translations: {en, fr?}`, `searchTerms?`, `sourceRef` — a **required** citation of the exact governing-source section for every entry), `validateSeedManifest` (referential integrity: no dangling `parentId`, no duplicate id, no duplicate slug within a `nodeType`, no manifest-internal cycle, correct parent/child type adjacency, non-blank required fields including `sourceRef`), `topologicallySortSeedManifest` (computed dependency order, not authored-array-order trust).

## 12. Exact governed seed content included, and exact source per group

**Seed v1 is classification-only** (see the full authority discussion in `burundiPilotSeedManifest.ts`'s own header comment, reproduced in summary here):

| Group | Count | Exact source |
|---|---|---|
| Industries | 6 (Food & Beverage, Beauty & Personal Care, Automotive, Home Services, Health & Wellness, Retail) | CKS Part IV (Industry Catalogue) — the subset that is the "obvious parent" (design §10.1's own wording) of a PRD3 §7 launch category |
| Business Categories | 14 of PRD3 §7's 15 named examples | PRD3 §7 directly; 6 of the 14 (Coffee Shop, Restaurant, Bakery, Pizza, Burger, Juice Bar) are additionally directly named under Food & Beverage in CKS Part V |
| Business Types | 7 (Luxury Salon, Family Salon, Barbershop, Children's Salon, Mobile Salon, Express Salon, Premium Salon) — all under `cat_salon` | CKS Part VI's own worked "Example" — the **only** Business Category with any governed Business Type content anywhere in the repository |
| Reward Program Categories | 0 | Not seeded — see §14 |
| Standard Products/Services | 0 | Not seeded — see §14 |

## 13. Idempotency semantics

Per-entry: no existing document → create (node lifecycle transitioned `draft → in_review → active`, EN translation created and transitioned `draft → reviewed → published`). Existing document with identical `nodeType`/`parentId`/`slug`/`canonicalName` (and, for the translation, identical `displayName`) → no-op (`unchanged`). Any mismatch on those immutable-identity fields → `seedContentConflictError` (`IDEMPOTENCY_CONFLICT`), never a silent overwrite. The whole manifest is validated (`validateSeedManifest`) before any write is attempted at all (design §N) — a manifest-level structural defect leaves the store completely untouched, not partially written.

## 14. Missing seed-content decision (Phase L/M STOP — reported, not invented)

Reward Program Categories (CKS Part VII) are a **flat, uncategorized list of 16 examples with no stated parent Business Type for any of them**. Since the governed hierarchy requires `business_type → reward_program_category`, and only `cat_salon` has any governed Business Type at all, there is no source stating which of Salon's 7 types "Haircuts"/"Hair Colour"/"Braiding" (the only 3 of the 16 that are even topically Salon-adjacent) would nest under. **None are seeded.**

Standard Products/Services (CKS Part VIII) gives exactly **one** fully worked example (Haircut) — and PRD3 §15 states directly: *"The platform shall not prescribe products... businesses define their own."* Even the one worked example has no governed parent `reward_program_category` node to attach to. **None are seeded.**

**This is a STOP condition per the task's own Phase L/M instruction** ("if governing sources define enough structure to create only part of the hierarchy, create only the supported portion and report the missing seed-content decision"). The missing decision needed before Reward Program Category/Standard Product/Service seed content can be added: either (a) a Founder/Knowledge-Studio-owned mapping of which Reward Program Category nests under which Business Type, or (b) a design amendment permitting `reward_program_category` to parent directly under `business_category` in the absence of a governed Business Type. Repository/loader infrastructure is independently complete and does not depend on this decision (Phase L: "repository/loader infrastructure may still proceed if independently complete").

Additionally, 13 of the 14 seeded Business Categories (all except Salon) have **no governed Business Type content anywhere in the repository** — reported as the single largest content gap, not filled in.

"Other" (PRD3 §7's 15th named example) is intentionally **not seeded** — no governed parent Industry exists for it.

A terminology overlap between CKS Part VI's "Barbershop" (a Business Type *under* Salon) and PRD3 §7's separate "Barber" (a sibling Business Category) is reproduced faithfully from the sources rather than silently resolved, and is flagged here for product/Founder awareness.

## 15. Transaction/batch strategy

Each manifest entry's node creation, lifecycle transitions, and translation creation/publication are their own small, independently-committed Firestore transactions (via the repositories, unchanged) — not one giant transaction across the whole manifest. This is a deliberate, bounded MVP choice (design §P: "do not assume one giant transaction is appropriate for arbitrary future taxonomy sizes"), reusing the repository layer's own existing transactional guarantees rather than inventing a second consistency mechanism. Processing in `topologicallySortSeedManifest` order guarantees a parent is always already committed before any child is attempted. Whole-manifest static validation (§13) is the primary defense against a malformed manifest reaching the write phase at all; per-entry idempotency is the defense against a genuine mid-run interruption (e.g., a transient Firestore error) — a re-run safely resumes without re-processing already-committed, unchanged entries.

## 16. Localization treatment

No authoritative French translation exists anywhere in the repository for any seeded category/industry name (`apps/web/src/i18n/locales/fr.ts` checked directly — no match). Per the task's own Phase R instruction ("do not fabricate French translations if authoritative translations don't exist in the repo"), **no `fr` translation is seeded in v1** — every node is `active` with a `published` EN translation and no FR record at all, which is explicitly compatible with 001A's own §9.4/§11 fallback contract ("active node, French translation absent/draft" is a valid, expected state). This is reported as a gap requiring either a Founder/product-provided French glossary or an explicit decision to authorize engineering-authored translations, not silently resolved by writing French copy without a governing source.

## 17. Explicit 001C handoff

001B exposes `getKnowledgeNodeById` and 001A's existing `isEligibleForNewReference`/`isResolvableForExistingReference` predicates as the read surface `ENG-P3-001C` (the `Business.primaryCategoryId`/`businessTypeId` live-validation addition) will consume. **Nothing in `functions/src/domains/business/` was touched.** No live-reference validation is wired up anywhere in this package.

## 18. TDD/emulator proofs (Phase U)

All 20 required scenarios plus a concurrency test are covered, each written test-first against the emulator and observed failing for the intended structural reason before the corresponding repository/loader code made it pass:

| # | Scenario | Test |
|---|---|---|
| 1/5 | create/read KnowledgeNode, valid root creation | `knowledgeNodeRepository.emulator.test.ts` |
| 2 | create/read KnowledgeTag | `knowledgeTagRepository.emulator.test.ts` |
| 3 | create/read KnowledgeTranslation | `knowledgeTranslationRepository.emulator.test.ts` |
| 4 | malformed persisted document fails closed | all three repository emulator suites |
| 6 | valid child creation | `knowledgeNodeRepository.emulator.test.ts` |
| 7 | missing parent rejected | same |
| 8 | wrong parent type rejected | same |
| 9 | incorrect child depth cannot persist | same (structural — no caller-supplied depth parameter exists) |
| 10 | self-cycle rejected | same |
| 11 | indirect cycle rejected | same |
| 12 | valid ancestry passes | same |
| 13 | translation tuple uniqueness | `knowledgeTranslationRepository.emulator.test.ts` |
| 14 | obsolete `KnowledgeTag.translations` shape rejected | `knowledgeTagRepository.emulator.test.ts` |
| 15 | retirement replacement validation | `knowledgeNodeRepository.emulator.test.ts` |
| 16 | seed first load | `seedLoader.emulator.test.ts` |
| 17 | identical seed rerun | same |
| 18 | conflicting seed rerun | same |
| 19 | partial/invalid manifest failure behavior | same |
| 20 | no businessId/tenant leakage | node repository + seed loader suites |
| — | concurrency (two racing creations under one id) | `knowledgeNodeRepository.emulator.test.ts` |

## 19. Framework-boundary update

001A's `frameworkBoundary.test.ts` originally asserted `repositories/`/`seed/` did **not** exist yet — an explicit, intentional 001A-scope marker ("belongs to ENG-P3-001B"). It has been updated (not weakened) to assert the correct 001B-era boundary: `repositories/`/`seed/` now exist; `services/`/`commands/` still do not (still deferred to `001C`/`003`); every file in `models/` and in `seed/seedManifest.ts`/`seed/burundiPilotSeedManifest.ts` still imports neither `firebase-admin` nor `firebase-functions`; every repository file does import `firebase-admin/firestore` (it is the framework boundary, by design). The corresponding `eslint.config.js` carve-out (`repositories/**`, `seed/seedLoader.ts`, `seed/seedLoader.emulator.test.ts` exempted from the no-Firebase-SDK restriction) mirrors the existing `business/repositories/**` precedent exactly.

## 20. Security/integrity review (Phase V)

- Client input is never authoritative for derived hierarchy metadata — confirmed structurally, not just by test: the public repository API has no `path`/`depth`/`parentNodeType` input parameter at all.
- No tenant write authority leaks into global taxonomy — no `businessId`/`branchId`/`ownerUserId`/`membershipId` field anywhere (explicit test, all three repositories + seed loader); no `authorizeAndExecute` usage anywhere in this package (confirmed by grep) — the seed loader is a plain, directly-invoked function, matching Phase Q's "repository/admin-tool controlled only" instruction. No new permission identifier introduced.
- No Business permission catalogue modification — `functions/src/domains/permissions/` untouched (confirmed by diff).
- No direct frontend/client seed pathway — `runCommerceKnowledgeSeed` is not imported by `functions/src/index.ts` or any callable/HTTPS handler (confirmed by grep); its only caller in this repository is its own emulator test.
- No uncontrolled destructive seed update — conflicting content fails closed (`IDEMPOTENCY_CONFLICT`), verified by test that original content is untouched after a rejected conflicting rerun.
- No hidden automatic production seeding — same grep as above; the loader requires an explicit manifest + `db` + `now` argument from an explicit caller, wired nowhere.
- No credential/PII persistence — the domain persists only taxonomy classification data.
- No duplicate localization authority — `KnowledgeTag` never gains its own `translations` field; the tag document converter and repository both structurally cannot write one, and a raw document carrying one still fails closed on read (re-verified by test, unchanged from 001A).
- No search technology introduced — `DEC-TECH-008` remains untouched/open; the only queries added (`listKnowledgeNodeChildren`, `listKnowledgeTagsByGroup`, `listKnowledgeTranslationsForEntity`) are plain Firestore `.where()` reads required for hierarchy/seed validation, not a search architecture.
- No Firestore Rules file modified.

## 21. Full validation (Phase W)

- Functions unit tests: **1418/1418** passed (`pnpm --filter functions test`).
- Web unit tests: **397/397** passed (unaffected — no frontend file touched).
- Firebase Emulator Suite validation (`pnpm emulators:validate`, real Firestore emulator, `firebase emulators:exec`): **581/581** passed across 44 emulator test files (was 568/41 before this package; +13 tests, +3 files net after the `frameworkBoundary.test.ts` update added one test).
- `pnpm typecheck`: clean (functions + web).
- `pnpm lint` (ESLint, including the domain-boundary restriction): clean.
- `pnpm format:check` (Prettier): clean.
- `pnpm build` (functions `tsc` + web `vite build`): clean (pre-existing web bundle-size advisory warning, unrelated to this change).
- Secret scan: no dedicated tool is configured in this repository (CI's own header states "this pipeline requires zero secrets"); manual review of every added/modified file found no credential, key, or token content.
- Playwright e2e (`pnpm test:e2e`) was **not** re-run — no frontend file was touched by this package, and the task's own constraint set explicitly excludes frontend work; running the full browser e2e suite for a backend-only, non-UI-affecting change was judged unnecessary token/time cost. Flagged here explicitly rather than silently omitted.
- No Firebase deployment was performed. No Firestore Rules file was modified.

## 22. Dependencies added

None — no new `package.json` dependency in `functions/` or the workspace root.

## 23. Config changes

`eslint.config.js` — the Commerce Knowledge domain-boundary block's `ignores` list, adding `repositories/**`, `seed/seedLoader.ts`, `seed/seedLoader.emulator.test.ts` (mirrors the pre-existing `business/repositories/**` precedent).

## 24. Firebase/Rules changes

None. No `firestore.rules` change was made or found necessary — Commerce Knowledge collections are read by every authenticated context in the existing rules posture and written only server-side (Admin SDK, which bypasses Rules entirely), consistent with design §24 point 1 ("no client write path exists or is proposed"). No genuine architectural blocker was found that would have required a Rules change (the one STOP-eligible condition under Phase C/CONSTRAINTS never triggered).

## 25. Deployment changes

None. No `firebase deploy` was run or is proposed by this package.

## 26. Review findings/fixes

One self-caught issue during implementation: the first draft of a hierarchy-invalid-manifest emulator test assumed per-entry transactions alone would prevent an already-valid ancestor from being written before a later invalid entry failed. Running the test against the real emulator (not merely reasoning about it) showed whole-manifest static validation actually rejects the malformed manifest **before any write at all**, which is the stronger, correct guarantee (design §N: "validate the full manifest before writes where practical") — the test was corrected to assert the actual (better) behavior rather than the test's own incorrect assumption. No production code defect was found; this was a test-authoring correction only, caught by the emulator run itself (Phase U discipline).

## 27. Remaining material findings

- Reward Program Category / Standard Product/Service seed content gap (§14) — requires a Founder/Knowledge-Studio-owned decision, not an engineering one.
- Business Type content gap for 13 of 14 seeded Business Categories (§14).
- French translation authority gap (§16) — requires a Founder/product-provided glossary before FR-complete seeding is possible.
- CKS "Barbershop"/PRD3 "Barber" terminology overlap (§14) — an unresolved inconsistency in the governing sources themselves, reproduced faithfully rather than silently resolved.

None of these block `ENG-P3-001B`'s own deliverable (repository/persistence/hierarchy/cycle/seed-infrastructure) — they block only a *fuller* seed dataset, which was never this package's authorization.

## 28. Downstream handoff (Phase T)

`ENG-P3-001C` may now build the `Business.primaryCategoryId`/`businessTypeId` live-validation addition directly against `getKnowledgeNodeById` + 001A's `isEligibleForNewReference`/`isResolvableForExistingReference` predicates. No further repository surface is anticipated to be required for that addition based on this package's read of design §15/§21, but `ENG-P3-001C`'s own implementation should confirm this rather than assume it.

## 29. Unresolved/open decisions

- `DEC-TECH-008` (search implementation) remains `OPEN_ENGINEERING`, non-blocking, untouched by this package.
- The four items in §27 are new, reported findings requiring a Founder/product (not engineering) decision before further seed-content expansion.

## 30. No-implementation boundaries (explicit)

Not built, not modified, not proposed: `Business.primaryCategoryId`/`businessTypeId` validation; `createBusiness`; `ENG-P3-001C`; Business onboarding; Knowledge Studio; permission catalogue; search technology (Algolia/Typesense/Elasticsearch/Firestore search extension); callable/HTTPS endpoints; frontend; Firestore Rules; Firebase deployment; `ENG-P3-002`; `ENG-P3-003`.

## 31. Risks

- The seed v1 classification-only scope may be narrower than some stakeholders expect from `DEC-CKS-001`'s "minimum Standard Product/Service knowledge" wording — mitigated by the explicit, sourced gap report in §14 rather than a silent shortfall.
- The bounded ancestor-traversal guard (64 steps) is a defensive technical limit, not a governed product depth limit — if the taxonomy ever genuinely needs more than 64 levels (extremely unlikely given the fixed 5/6-level CKS hierarchy), this constant would need revisiting; flagged, not expected to matter in practice.

## 32. Rollback

Revert the PR — no destructive migration, no data written to any non-emulator environment, no Rules/deployment change to undo.

## 33. Persistent report path

`docs/05-implementation/reports/ENG-P3-001B-commerce-knowledge-repositories-seed-loader-implementation-report-2026-08-21.md` (this file).

## 34. Changes-tracking state

`docs/05-implementation/change-tracking/engineering-implementation-programme.md`'s `ENG-P3-001` row updated with a dated note recording this package's delivery, PR, and CI state (see the diff in this same change) — history not rewritten, only appended.

## Programme state after this package

`ENG-P3-001A` = Complete/merged. `ENG-P3-001B` = implemented, draft PR opened, CI pending on final head at the time of this report (see the report's closing status line for the exact outcome). `ENG-P3-001C` = Not started. `ENG-P3-002`/`ENG-P3-003` = Not started. Capability 3 remains `Open — partially implemented; not closed`.

## Exact next Founder action

Review PR #<opened below>, confirm CI is green on its exact final head, and either (a) merge if satisfied, or (b) route the §14/§16 reported seed-content/translation-authority gaps to a Founder/product decision before authorizing any further Commerce Knowledge seed-content expansion, and separately authorize `ENG-P3-001C` when ready.
