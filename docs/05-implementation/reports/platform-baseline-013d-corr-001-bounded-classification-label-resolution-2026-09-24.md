# PLATFORM-BASELINE-013D-CORR-001 — Bounded Classification Label Resolution

**Disposition:** Corrected / awaiting narrow independent re-review. PR #271 remains open and unmerged.

**Entry PR head:** `599542da0300fe5cbf2f68b7f78563b267d7c7e0`

**Base:** `main` at `20dd06d283fb4151004cdee416b7bf80a14f9e22`

**Branch/worktree:** `codex/platform-baseline-013d` / `/private/tmp/11thonus-pb013d`

## Entry and review inventory

Fetched `origin` before changes. PR #271 was OPEN, based on `main` at the expected baseline, and exactly at the required entry head. Exact-head CI run `35889179425` passed on that head. The two active P2 threads were confirmed:

1. `RewardProgramManagementPage.tsx`: historical frozen-label request could exceed the resolver's 100-ID parser limit.
2. `QualifyingItemClassificationEditor.tsx`: each classified item mounted a distinct label resolver query.

No head drift was present. Work continued in the existing isolated worktree; no unrelated checkout changes were used.

## Pre-change flow and root causes

The page passed all unique frozen classification IDs from current and draft Reward Program versions to a single call to `useKnowledgeNodeLabelsQuery`. The resolver's existing callable parser rejects arrays above 100, so one oversized request returned no labels and every historical classification fell back to unavailable.

The active-item editor independently called `useKnowledgeNodeLabelsQuery([item.knowledgeNodeId])`. Each editor therefore created a one-ID resolver query, resulting in one callable per mounted classified item. Search and suggestion queries are separate discovery behavior and remain in the editor.

## Correction

The page now collects classification IDs from both active/current Business Qualifying Items and frozen Reward Program version snapshots, deduplicates them, and invokes one page-level label query. The existing label hook canonicalizes the set as sorted unique IDs for its stable language-scoped query key, then resolves sequential chunks of at most 100 through the existing Commerce Knowledge label resolver. Sequential requests avoid unbounded concurrency. Successful chunk results are merged; a failed chunk is omitted while successful chunks are retained. Missing labels use the existing neutral localized unavailable copy.

The page passes the corresponding resolved label to each `QualifyingItemClassificationEditor`. The child no longer issues a label query. Assignment, removal, candidate search, and suggestions are unchanged. The historical item name continues rendering independently of label resolution, so unavailable CK metadata cannot invalidate an item/program or replace its name.

## Authority and boundary confirmations

- `qualifyingItemId` remains the Reward Program qualification identity; `knowledgeNodeId` is optional enrichment only.
- Assignment-time classification validation and all item/reward permissions are unchanged.
- Reward Program selection/publication rules, purchase qualification, purchase request hash, purchase snapshots, Trust Events, verification, and 10+1 behavior are unchanged.
- PB-013B P3-3 publish snapshot TOCTOU remains OPEN and out of scope.
- PB-013E remains NOT STARTED. No schema or migration changes; migration `0019` is absent.
- No dependencies or configuration changed.

## Tests and validation

Added a real TanStack Query hook test that supplies 205 unique IDs plus a duplicate, proves the resolver receives `[100, 100, 5]` sequential batches, confirms successful labels from the first and last chunks are merged when the middle chunk fails, and confirms EN/FR requests use separate language-scoped results. Page behavioral tests render 105 frozen classifications, retain resolvable labels on both sides of the missing ID, preserve all Business names, and show neutral fallback without the UUID. A 20-item current catalogue test verifies one parent lookup contains only the 19 classified IDs, displays current labels, and retains the unclassified item. Existing assignment and removal tests still pass.

- Focused Reward Program page, label-hook, and query-key suites: **44/44 passed**.
- Full web unit/component suite: **900/900 passed** across 124 files.
- Typecheck: passed (functions and web; local Node 24 emitted the repository's Node 20 engine warning).
- Lint: passed with the existing `BusinessApiContext.tsx:26` React Refresh warning.
- Build: passed with the existing large-chunk advisory.
- Prettier check on changed TypeScript files: passed.
- `git diff --check`: passed before the correction commit.
- No functions tests were necessary: callable/parser/shared API contracts were not changed. Exact-head CI run `35966924054` passed on correction commit `b804153c1f484b58cfe4e53f4dba2ac1eaae2abb`; this report-only follow-up is checked on the new PR head before final disposition.

## Files changed

- `apps/web/src/business/dashboard/RewardProgramManagementPage.tsx`
- `apps/web/src/business/dashboard/QualifyingItemClassificationEditor.tsx`
- `apps/web/src/business/hooks/businessQueries.ts`
- `apps/web/src/business/hooks/queryKeys.ts`
- `apps/web/src/business/dashboard/RewardProgramManagementPage.test.tsx`
- `apps/web/src/business/hooks/knowledgeNodeLabelsQuery.test.tsx`
- `apps/web/src/business/hooks/queryKeys.test.ts`
- This report, `docs/00-governance/documentation-changes-log.md`, and `docs/changes/IMPLEMENTATION_CHANGES.md`.

## Rollback and remaining review

Revert the correction commit on PR #271 to restore the prior display-label lookup behavior; do not revert the existing PB-013D implementation unless a separate decision directs it. After exact-head CI passed, both P2 review threads received root-cause, correction, and test-evidence replies. Both remain unresolved for independent re-review. Do not merge and do not begin PB-013E.

**Final disposition:** `PLATFORM-BASELINE-013D — CORRECTED / AWAITING NARROW INDEPENDENT RE-REVIEW`.
