# PLATFORM-BASELINE-013D-CORR-002 — Classification Label Retry/Cache Correction

**Status:** corrected; awaiting narrow independent re-review. PR #271 remains open and unmerged.  
**Entry base:** `20dd06d283fb4151004cdee416b7bf80a14f9e22`  
**Entry head:** `11862515ede7033c15fa97435579a3cc0c8fe279`  
**Final head / exact-head CI:** pending final commit and CI.

## Root cause and design

CORR-001 caught a failed label batch and returned labels from successful batches through one aggregate TanStack query. That query reported success and used `staleTime: Infinity`. Consequently, the partial result was considered fresh indefinitely and the missing IDs had no failed query state that normal query retry behavior could act on.

The correction uses one cache entry per deterministic batch of at most 100 IDs, all created by the existing page-level label hook. Batches remain sequential: a batch is enabled only after the previous batch query settles. Each cache key is based on the normalized batch IDs and requested language. Successful entries remain fresh indefinitely. A failed entry has no data and remains an error query; TanStack Query's normal focus, reconnect, and remount behavior can retry that entry alone. There is no polling or automatic repeated retry. The hook combines all available batch data so successful labels remain visible while failed IDs use the existing neutral fallback.

This is the smallest design that preserves successful cache entries independently while giving failed work its own retry state. It keeps the one parent lookup architecture and avoids re-fetching successful batches when a failed one is retried.

## Changed files

- `apps/web/src/business/hooks/businessQueries.ts` — split normalized IDs into bounded batch queries, gate them sequentially, preserve language-scoped cache identity, and merge available labels.
- `apps/web/src/business/hooks/knowledgeNodeLabelsQuery.test.tsx` — batching, sequencing, transient/persistent failure, retry, cache and language regression coverage.
- `apps/web/src/business/dashboard/RewardProgramManagementPage.test.tsx` — verify unresolved label query errors leave frozen Business names visible with neutral localized fallback.
- `docs/00-governance/documentation-changes-log.md` — Entry 253.
- `docs/changes/IMPLEMENTATION_CHANGES.md` — CORR-002 record.
- This report.

## Behavioral coverage

- 205 unique IDs plus a duplicate are resolved as `[100, 100, 5]`; no request exceeds 100 and maximum observed concurrency is one.
- When batch 2 fails once, batch 1 and batch 3 labels remain available and batch 2 IDs remain absent for neutral fallback. A normal focus event retries only batch 2; its labels are merged without discarding batch 1 or 3.
- A persistently failing batch settles as an error after one request, later batches still resolve, and no polling or automatic retry loop occurs.
- EN and FR batches use distinct cache entries; an EN retry does not contaminate the FR label result.
- Existing Reward Program page/editor tests cover one page-level lookup for 20 current items, unclassified items, resolved/unavailable labels, Business names, no UUID display, assignment/removal, suggestions and search.

## Validation

- Focused classification-label hook, query-key, and Reward Program management tests: **48 passed**.
- Full web suite: **899 passed, 5 failed** across 124 files. The failures were timing/latency failures in untouched `PhoneAuthHarnessPage.test.tsx` (1), `BusinessProfilePage.test.tsx` (3), and `EstablishmentIdentityStep.test.tsx` (1). Correction-specific tests passed.
- Typecheck: passed.
- Lint: passed with one existing `BusinessApiContext.tsx:26` React Refresh warning.
- Changed-file Prettier check: passed.
- Web production build: passed with the existing Vite large-chunk advisory.
- `git diff --check`: passed.
- Exact-head CI: pending final commit and CI run.

## Authority and scope

Only web query/cache behavior, tests, and Markdown tracking changed. `qualifyingItemId` remains Reward Program qualification authority; `knowledgeNodeId` remains optional classification metadata. Assignment-time CK validation, Reward Program and purchase qualification, `purchaseRequestHash`, Trust Events, 10+1, permissions, and Platform Administrator boundaries are unchanged. No backend/shared contract, dependency, configuration, schema, or migration changed. PB-013B P3-3 remains OPEN and untouched. PB-013E remains NOT STARTED; migration `0019` and legacy-table cleanup remain absent.

## Review and rollback

The retry/cache P2 was identified in the preceding independent-review response, but no corresponding GitHub review thread existed at entry. After validation, a PR comment will document the root cause, design, regression evidence, and exact-head CI result; it will remain unresolved. The two original P2 threads are not to be modified or resolved.

Rollback: revert the CORR-002 commit on PR #271. This restores CORR-001's aggregate partial-result query behavior. Do not merge and do not start PB-013E.
