# PLATFORM-BASELINE-013D — Qualifying Item Classification Experience

**Status:** Implemented; awaiting independent review. No merge performed.

**Entry `origin/main`:** `20dd06d283fb4151004cdee416b7bf80a14f9e22`

**Branch:** `codex/platform-baseline-013d`

**Worktree:** `/private/tmp/11thonus-pb013d`

**PR:** [#271](https://github.com/Fkenogo/11THONUS/pull/271), OPEN against `main`, mergeable. Implementation commit/head `35cde61838e44e78e1d7ec69de5a32727b8c0543`.

**Exact-head CI:** run `35887934375` passed on implementation head `35cde61838e44e78e1d7ec69de5a32727b8c0543` (Build, Lint, Test, Emulator Validation). The report/change-log follow-up will update the PR head and trigger another exact-head CI run before stopping.

**Scope:** the PB-013D optional classification experience and historical classification display only.

## 1. Entry gate and worktree safety

`git fetch origin` completed before implementation; a final origin recheck also confirmed `origin/main` remained at the expected SHA `20dd06d283fb4151004cdee416b7bf80a14f9e22`. Migration `0019` was absent; migrations through `0018` were present. The current programme records show PB-013A.1/A.2/B/C and PB-013D-PRE-001 closed, PB-013D not started, and PB-013E not started. No local or remote PB-013D implementation branch existed; the only matching implementation-predecessor branch was PB-013D-PRE-001, already merged into this base. GitHub PR metadata was initially unavailable, then checked successfully: PRs #269/#270 are merged and there is no open overlapping PB-013D PR.

Implementation used an isolated worktree based directly on `origin/main`. The primary checkout, carrying extensive unrelated dirty work on `docs/11thonus-cf-001-cloudflare-assessment-001`, was not used for edits, cleaned, reset, or otherwise modified.

## 2. Authority and documentation reviewed

- PB-012 in full, including Amendment 001 (`DEC-LOY-017`) and Correction 001; especially §7 (existing Commerce Knowledge read path), §14 (retained classification aids), §15 regression cases, §16 package scope and atomic boundaries, §17A carried-forward requirements, and §26 rollback.
- PB-013A.1 and PB-013A.2 implementation reports.
- PB-013B implementation report, including its role boundary, retained classification query surfaces, snapshots, and P3 carry-forwards.
- PB-013C implementation report, including purchase/10+1 non-regression boundaries.
- PB-013D-PRE-001 implementation and closure records, including the frozen historical `knowledgeNodeIdAtVersion` unavailable-display carry-forward.
- `DEC-LOY-016` / `FD-REWARD-QUALIFYING-ITEM-001` and `DEC-LOY-017` / `FD-QUALIFYING-ITEM-ROLE-AUTHORITY-001`.
- Current Qualifying Item and Reward Program models, repositories, commands, transport, permission catalogues/evaluator, and UI.
- Retained Commerce Knowledge search and label-resolution callables, adapters, hooks, debounce utility, and language-scoped query keys.
- EN/FR locale architecture and existing locale parity coverage.

The older PB-011 recommendation to hide classification from normal Business users is superseded for this scoped experience by PB-012 §16's optional picker package and the later explicit Founder authority in DEC-LOY-017: Owners and Managers may optionally classify Qualifying Items. No unresolved authority conflict was found.

## 3. Pre-change flow and strategy

Before this change, Owners and Managers could create, rename, and retire Business-owned Qualifying Items in `RewardProgramManagementPage`; the Business-authored name was the item's identity. Reward Program drafts and versions selected items by `qualifyingItemId`, carrying frozen `itemNameAtVersion` and nullable `knowledgeNodeIdAtVersion`. PB-013D-PRE-001 had already removed post-assignment CK lifecycle checks from Reward Program qualification snapshot resolution, while the Qualifying Item create/update commands still validate any newly assigned classification. PB-013B had removed the old `QualifyingNodeSelector` but retained Commerce Knowledge search and display-label reads for this package.

The implementation adds an optional CK editor to each active Business item. It offers Business-Type-scoped suggestions and the retained broader, bounded search (300ms debounce), and uses the existing `updateQualifyingItem` mutation to assign or clear its `knowledgeNodeId`; mutation validation errors remain visible in the page. It adds resolved label display beside the Business-authored item name on Reward Program version summaries. Historical snapshot lookup remains a display-only query: an absent, errored, retired, deleted, or otherwise unresolved CK node produces neutral localized “classification unavailable” copy. The frozen Business item name is rendered independently in every case. No backend or schema change is needed.

## 4. Implementation and authority confirmations

- **Qualifying Item authority:** unchanged. The Business-owned item and `qualifyingItemId` remain the qualification identity. CK ids are used only as optional enrichment metadata.
- **Optionality:** creation still submits only the Business name by default. The interface labels classification optional and explains it does not affect qualification. Existing unclassified items render and remain selectable.
- **Assignment-time validation:** unchanged server-side validation remains authoritative on the existing Qualifying Item create/update command. The picker only offers results from the existing qualifying-node search surface; stale/invalid selections still fail server validation. Clearing uses `knowledgeNodeId: null`, supported by the existing update contract.
- **Classification UX:** Owners and Managers see the editor in the item-management section, consistent with `qualifyingItem.manage`. Staff do not receive item management controls. No permission catalogue, evaluator, or permission value changed; `rewardProgram.manage` remains Owner-only and no Platform Administrator path was added.
- **Identity display:** the Business name remains separately and prominently rendered. CK labels are secondary metadata. Internal UUIDs are never rendered.
- **Historical snapshots:** frozen `knowledgeNodeIdAtVersion` is resolved through the existing CK label surface using locale-scoped keys. When unavailable, a neutral EN/FR fallback is used. This query cannot change version validity or the Business-authored frozen name; there is no replacement-node selection or silent substitution.
- **Reward Program behavior:** UI selection and mutation payloads continue to use `qualifyingItemId`; classification is not submitted as qualification identity and cannot select or qualify a different Business item.
- **Business isolation:** the UI calls existing Business-scoped Qualifying Item and membership-gated Commerce Knowledge callables. No read/write surface, callable authorization, or Business scoping changed.
- **Purchase / PB-013C:** no purchase production or test file changed. `qualifyingItemId` purchase identity, request hash, item snapshot, Trust Event, verification/dispute, unit issuance, and Cycle behavior are untouched.
- **10+1:** no loyalty-cycle, reward, redemption, threshold, or 10+1 code changed.
- **PB-013B P3-3:** remains OPEN and OUT OF SCOPE. This work does not change or claim to resolve the publish snapshot TOCTOU.
- **PB-013E:** not started. No migration `0019`, legacy-table drop, compatibility cleanup, or unrelated schema cleanup.

## 5. Files changed

- `apps/web/src/business/dashboard/QualifyingItemClassificationEditor.tsx` — optional, debounced CK search editor and clear action.
- `apps/web/src/business/dashboard/RewardProgramManagementPage.tsx` — integrates classification editing and frozen classification metadata display alongside Business-owned item names.
- `apps/web/src/business/dashboard/RewardProgramManagementPage.test.tsx` — behavioral coverage for optional mapping, clearing, name independence, unresolved historical metadata, and no raw UUID display.
- `apps/web/src/i18n/locales/en.ts` and `apps/web/src/i18n/locales/fr.ts` — aligned classification experience and fallback copy.
- This report and the repository’s implementation/documentation change-tracking files.

No dependency, config, permission, schema, migration, purchase, or 10+1 file changed. PB-013E remains unauthorized and untouched.

## 6. Tests and validation

- Focused Reward Program management UI suite on the final test tree: **36/36 passed**.
- Full web suite on the final test tree: **895 passed, 1 failed** across 123 files. The sole failure was an existing selection-flow UI test timing out at 5s under the full-suite load; the same Reward Program test file passed in isolation (36/36). A previous full run also hit an unrelated `PhoneAuthHarnessPage` retry-latency ceiling; its focused rerun passed (39/39). No test was weakened or deleted. GitHub's exact-head CI subsequently passed all unit/component tests, Playwright E2E, PostgreSQL integration, and Firebase emulator validation.
- Functions unit suite: **162 files, 1,847 tests passed**.
- PostgreSQL suite with isolated PostgreSQL plus Auth/Firestore emulators: **8 files, 236 tests passed**.
- Firebase emulator suite: **65 files, 864 passed, 3 skipped**.
- Typecheck: passed.
- Lint: passed with one existing `react-refresh/only-export-components` warning in `apps/web/src/business/BusinessApiContext.tsx:26:17`.
- Build: passed; Vite reported the existing large-chunk advisory.
- Prettier check on changed source/locales: passed.
- Playwright: repository E2E specs contain no Reward Program or Qualifying Item flow, so no applicable Playwright spec exists.
- `git diff --check`: passed on the implementation commit; will be repeated after this report/change-log follow-up.

The standard PostgreSQL port `54329` was occupied by a pre-existing container. Tests ran against a newly isolated disposable PostgreSQL container on port `54330` and temporary Auth/Firestore emulator ports. A preliminary PostgreSQL-only invocation without emulators failed in suites requiring Firestore and was superseded by the passing combined run. No repository config was changed. The initial parallel test/build attempt was SIGTERM-terminated due to resource contention; serial build rerun passed. Runtime was Node 24 although repository package engine requests Node 20; pnpm surfaced the existing engine warning.

## 7. Change boundaries, risks, and rollback

No dependency was added. No configuration, database schema, migration, seed, permission, purchase, verification, or 10+1 behavior changed. The only material risk is presentational: if the CK label resolver cannot return historical metadata, the UI displays a neutral unavailable label; the frozen Business item name remains available and no qualification result changes. Rollback is a single revert of the PB-013D PR merge; no schema or data rollback is required.

## 8. PR and final disposition

The implementation commit and its exact-head CI are recorded above. This documentation-only report/change-log follow-up updates the PR head; its exact-head CI is being checked before final disposition. No merge will be performed. PB-013E will not begin.

**Final expected disposition:** `PLATFORM-BASELINE-013D — IMPLEMENTED / AWAITING INDEPENDENT REVIEW`.
