# PLATFORM-BASELINE-013D-PRE-001 — Reward Program Classification Authority Correction

**Status:** Implemented; awaiting independent review. No merge performed.  
**Entry `origin/main`:** `640caaf74f9203cad3ec6debcf575e8605989e23`  
**Branch:** `codex/platform-baseline-013d-pre-001`  
**Worktree:** `/private/tmp/11thonus-pb013d-pre-001`  
**PR:** To be recorded after opening.  
**Scope:** Reward Program Qualifying Item snapshot authority only.

## 1. Analysis before modification

The canonical entry SHA matched the PB-013D readiness baseline exactly. `git fetch origin` found no advancement. Work was performed in a new detached-derived feature worktree; the original dirty checkout was neither inspected as product evidence nor changed. No remote PB-013D branch was found. PB-013A.1, PB-013A.2, PB-013B, and PB-013C are closed; PB-013D and PB-013E remain not started. Migration 0018 exists, 0019 does not, and the legacy `reward_program_version_qualifying_nodes` table remains.

Before editing, source tracing confirmed that `resolveQualifyingItemSnapshots` loaded each Business-owned item, checked lifecycle, then called `assertNodeEligible` whenever `knowledgeNodeId` was non-null. Its callers were create, draft update, next-version creation, and publish commands. That helper queried Commerce Knowledge and rejected missing, wrong-typed, or non-active nodes. This made optional classification an unintended Reward Program participation gate. Qualifying Item create/update commands independently validate a newly supplied classification; that assignment-time behavior is retained.

## 2. Root cause and correction

The snapshot resolver conflated **classification validity at assignment** with **qualification authority during use**. The resolver now resolves the item through the existing Business-scoped repository, preserves malformed/foreign/missing item and retired-item rules, and snapshots the Business item ID, authored name, and nullable `knowledgeNodeId` without any Commerce Knowledge read. Four command callers no longer pass Firestore to the resolver. A helper comment was corrected to describe its remaining scope: category/standard-reward CK references and retained legacy `QualifyingNode` validation.

No permission, purchase, identity, schema, migration, or UI change was made. Published-version immutability and the separate PB-013B P3-3 publish TOCTOU boundary remain unchanged.

## 3. Runtime behavior removed and retained

**Removed:** Reward Program create, draft update, next-version creation, and publish no longer query Commerce Knowledge or reject an otherwise valid Business-owned Qualifying Item because its optional node is missing, inactive, wrong-typed, or otherwise ineligible.

**Retained:** Business-scoped item resolution and non-disclosure for absent/foreign/fabricated IDs; the existing active-item rule for new bindings; `qualifyingItemId` as membership authority; frozen item-name and nullable classification snapshots; assignment-time CK eligibility/type validation in Qualifying Item commands; all Reward Program and purchase permissions and behavior.

## 4. Snapshot semantics

New/future version snapshots continue to record `qualifyingItemId`, `itemNameAtVersion`, and nullable `knowledgeNodeIdAtVersion` from the Business-owned item at snapshot time. No historical snapshot is rewritten. This task does not change when the existing architecture captures snapshots and does not resolve PB-013B P3-3.

## 5. Tests changed and results

Reward Program tests that had institutionalized the CK gate were revised. They now cover an inactive classification through draft update, publish, and next-version creation; wrong-typed and inactive nodes during initial binding; a missing node; and a classification node retired after draft creation before publication. Assertions verify preserved snapshot metadata. Existing unclassified, identity, lifecycle, isolation, and other Reward Program coverage remains. Qualifying Item assignment-time validation tests were not weakened.

Validation on the final implementation content before report-only files:

- `rewardProgramCommands.postgres.test.ts`: 50/50 passed.
- `qualifyingItemCommands.postgres.test.ts`: 59/59 passed.
- `purchaseCommands.postgres.test.ts`: 42/42 passed.
- Functions unit suite: 162 files, 1,847 tests passed.
- Full Functions emulator suite with isolated Firestore and Auth: 65 files passed; 864 passed, 3 skipped.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed with 0 errors and 1 existing `react-refresh/only-export-components` warning at `apps/web/src/business/BusinessApiContext.tsx:26:17`.
- `pnpm build`: passed; Vite emitted its existing large-chunk advisory.
- `git diff --check`: passed.

The initial broad emulator attempt used a temporary config with Firestore but no Auth and failed in unrelated Auth-dependent invite/staff tests; a separate concurrency timeout also occurred. It was rerun with isolated Auth and Firestore emulators and completed successfully as recorded above. A focused RED run before the code change failed on the old CK eligibility gate as expected. No repository dependency manifests or lockfiles changed; install artifacts were confined to the temporary worktree.

## 6. Required independent-review readiness answers

1. Can a CK node becoming inactive after classification assignment block Reward Program publication? **No.**
2. Can a CK node disappearing invalidate the Business-owned item as qualification authority? **No.**
3. Can an unclassified Qualifying Item bind and publish? **Yes.**
4. Is classification still validated when Owner/Manager assigns or changes it? **Yes; existing Qualifying Item validation remains.**
5. Does snapshotting still freeze nullable `knowledgeNodeIdAtVersion`? **Yes.**
6. Did this change purchase qualification? **No.**
7. Did this implement PB-013D UI? **No.**
8. Did this resolve PB-013B P3-3? **No; it remains open and separate.**

## 7. Boundaries, risks, rollback

No dependencies, config, schema, migrations, seeds, permissions, purchase/10+1 behavior, `purchaseRequestHash`, PB-013D UI, or PB-013E cleanup changed. PB-013D and PB-013E remain **NOT STARTED**. The only material risk is that consumers displaying a frozen CK label may have to resolve historical/missing classifications through existing read behavior; qualification itself is unaffected. Rollback is a normal revert of this PR before any later dependent change; no data or schema rollback is required.

## 8. Repository and PR state

Files changed are limited to the Reward Program resolver and its four callers, Reward Program behavioral tests, this report, and the documentation change log. Exact PR number/state and final pushed head will be added after opening. Exact-head CI status will be recorded after GitHub reports it. No unrelated production files are included.

The original dirty checkout remains untouched. No merge has been performed. The temporary detached assessment worktree from the prior read-only assessment is not present in this work session; only this task's isolated worktree is in use.
