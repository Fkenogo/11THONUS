# PLATFORM-BASELINE-013C — Purchase → Business-Owned Qualifying Item Transition: Implementation Report

> **Date:** 2026-09-20
> **Entry origin/main SHA:** `2756eccc3f2541a0bcb16b6905159804b6b0feaa` (verified via `git fetch origin` + `git rev-parse origin/main` before any change; matches the task's expected SHA exactly — no drift, no intervening commits to inspect).
> **Branch:** `feat/platform-baseline-013c-purchase-business-qualifying-item`
> **Worktree:** `/Volumes/PRODUCTION/Projects/11THONUS-worktrees/pb013c-purchase-business-qualifying-item` (isolated; primary checkout untouched)
> **Governing authority (read directly from the repository before implementation):** `FD-REWARD-QUALIFYING-ITEM-001` / `DEC-LOY-016`; `FD-QUALIFYING-ITEM-ROLE-AUTHORITY-001` / `DEC-LOY-017`; `PLATFORM-BASELINE-012` implementation-readiness design incl. Correction 001 (§7 purchase binding, §10 trust/security, §13 migrations, §14 retain/adapt/replace matrix, §15 test plan incl. N2, §16 lettered packages, §16A atomic-merge-boundary rule, §17A CF-1…CF-4); merged `PB-013A.1` (`0016`/`0017`); merged `PB-013A.2` (QualifyingItem domain, `qualifyingItem.manage`); merged `PB-013B` (Reward Program binding, frozen snapshots). Nothing implemented from the task prompt alone.
> **Scope:** exactly `PB-013C` per §16 — the purchase contract transition, one atomic merge boundary. No migration beyond `0018`. `PB-013D`/`PB-013E` not started. `PB-013B` P3-3 left untouched.
> **Final disposition:** A — IMPLEMENTED / AWAITING INDEPENDENT REVIEW (pending CI + review; DO NOT MERGE per instruction).

## 1. Analysis performed before modification

- Read the PB-012 design end to end (both amendments, Correction 001) with focus on §4 (identity trace), §5/§6 (QualifyingItem + junction), §7 (purchase binding — the ten questions, the mandatory idempotency re-keying, the composite-FK design), §8 (frozen snapshots), §9 (10+1 zero-diff), §10 (trust/security table), §11 (Commerce Knowledge optional), §12 (UX), §13 (migrations), §14 (retain/adapt/replace), §15 (test plan incl. N2 and the zero-diff gate), §16/§16A (atomic boundary), §17A (CF-1…CF-4).
- Read the PB-013B implementation report and the PB-013B merge-close record (P3-1…P3-5 carry-forward, incl. P3-3).
- Traced the shipped purchase flow directly from source (below), the read models, the dispute vocabulary, the 10+1 engine, and every caller of the purchase request contract.
- **No repository contradiction with PB-012 was found; no settled decision needed reopening.** The actual implementation matched the design's stated pre-change behaviour.

## 2. Exact pre-change purchase flow discovered

```
PurchaseRecordsPage.tsx (form: rewardProgramId, artifactKind, artifactValue, quantity,
                          itemLabel free text, purchaseDate, notes)
  → hooks/purchaseMutations.ts (keyForRequest rotation over the JSON payload)
  → api/purchaseMutations.ts  wire { rewardProgramId, artifact, quantity, itemLabel, ... }
  → index.ts :: parseRecordPurchaseRequest — itemLabel REQUIRED; knowledgeNodeId optional;
                                               no version id, no item id
  → recordPurchaseCommand.ts
      ├ authorizePurchaseRecord (purchase.record; staff|manager|owner)
      ├ fingerprint INCLUDED itemLabel + knowledgeNodeId  (idempotency identity)
      ├ if knowledgeNodeId present → validateQualifyingNodes(db, …)  (standalone CK; never
      │   cross-checked against the version's own qualifying set)
      └ withPlatformTransaction:
          lock program (active, current_version_id) → lock current version (active)
          shared-LN gate · quantity gate · reserve idempotency ('purchase.create')
          insertPurchaseRecord(item_label NOT NULL, knowledge_node_id NULL)
          appendPurchaseRecordEvent(∅ → waiting_for_customer)
          insertTrustEvent('purchase.recorded', payload { rewardProgramId,
            rewardProgramVersionId, quantity, presentedArtifactType } — NO item identity)
          notification intent · outbox · complete idempotency · COMMIT
  → verify / reject / dispute: ZERO item-identity references (grep-confirmed)
  → 10+1 engine (verified_units → allocations → loyalty_cycles → rewards): no item column
```

`purchase_records` had **no** structural item identity: `item_label TEXT NOT NULL` (operator free text), `knowledge_node_id TEXT NULL` (UI-unreachable, never checked against the version), and no FK to any qualification set. `purchase.recorded` carried no item identity while `dispute_reason = 'wrong_item'` already existed.

## 3. Implementation strategy

1. **Transport:** `parseRecordPurchaseRequest` requires `qualifyingItemId` (non-empty string) and **removes** `itemLabel` + `knowledgeNodeId` from the whitelist entirely (a client can no longer supply an item name or a Commerce Knowledge id).
2. **Command:** `RecordPurchaseRequest` drops `itemLabel`/`knowledgeNodeId` and adds `qualifyingItemId`; the fingerprint adds `qualifyingItemId` and drops `itemLabel`/`knowledgeNodeId`; after the version lock the command proves membership in the **locked** version's frozen junction rows and derives `itemLabel` from `item_name_at_version`; the standalone Commerce Knowledge validation call is removed.
3. **Persistence:** migration `0018` adds `purchase_records.qualifying_item_id UUID NULL` plus two composite FKs (Business isolation; version membership), `NOT VALID` → `VALIDATE`.
4. **Trust Event:** `purchase.recorded` payload gains the opaque `qualifyingItemId`.
5. **Web:** the free-text item field is replaced by a `<select>` over the selected programme's `currentVersion.qualifyingItems` (value = id, label = Business-authored name); EN/FR key swap.
6. **Tests/migrations/docs** move in the same merge.

## 4. Files modified/created/deleted

**Modified (17):**
`functions/src/domains/purchase/models/purchase.ts`; `models/purchaseErrors.ts`; `repositories/purchaseRecordRepository.ts`; `repositories/purchaseProgramScopeRepository.ts`; `services/recordPurchaseCommand.ts`; `services/purchaseCommands.postgres.test.ts`; `functions/src/index.ts`; `functions/src/index.test.ts`; `functions/src/infrastructure/postgres/rewardProgramMigrations.postgres.test.ts`; `functions/src/infrastructure/postgres/platformFoundationReadiness.postgres.test.ts`; `functions/src/infrastructure/postgres/migrations/README.md`; `apps/web/src/business/api/purchaseMutations.ts`; `apps/web/src/business/api/purchaseMutations.test.ts`; `apps/web/src/business/dashboard/PurchaseRecordsPage.tsx`; `apps/web/src/business/dashboard/PurchaseRecordsPage.test.tsx`; `apps/web/src/i18n/locales/en.ts`; `apps/web/src/i18n/locales/fr.ts`.

**Created (2):**
`functions/src/infrastructure/postgres/migrations/0018_purchase_records_qualifying_item.sql`; `…0018_purchase_records_qualifying_item.down.sql`.

**Deleted:** none.

## 5. Purchase transport change

`parseRecordPurchaseRequest` whitelist after PB-013C: `businessId`, `rewardProgramId`, `loyaltyNumberValue` XOR `qrReference`, `quantity`, **`qualifyingItemId` (required)**, `unitValueMinor`, `currency`, `purchaseDate`, `notes`. `itemLabel` and `knowledgeNodeId` are structurally absent (dropped, never parsed, never forwarded). `index.test.ts` extends the mass-assignment regression to assert their absence and that a missing/blank `qualifyingItemId` is rejected.

## 6. `qualifyingItemId` authority implementation

`qualifyingItemId` refers to `qualifying_items.id`. It is selected by the operator from the programme's own frozen version bindings, and the server proves it against the **locked** version inside the creation transaction (`readLockedVersionQualifyingItem`). The client cannot qualify a purchase by `knowledgeNodeId`, canonical Commerce Knowledge identity, `itemLabel`, or any Reward Program/version id.

## 7. Business isolation / non-disclosure

`readLockedVersionQualifyingItem` looks the id up only within the locked version's junction rows (which belong to the authenticated Business's programme). A fabricated, malformed, foreign-Business, or non-qualifying id all return `null` → the **same** `PurchaseDomainError` (`VALIDATION_FAILED`, identical message). No existence disclosure across Businesses. Independently, the `purchase_records_item_in_business` composite FK (→ `qualifying_items (id, business_id)`) makes a cross-Business tuple structurally impossible.

## 8. Server-resolved Reward Program/version

Unchanged authoritative mechanism: `lockRewardProgramById` → `program.currentVersionId` → `lockRewardProgramVersionById` (active). The client still supplies only `rewardProgramId`; `parseRecordPurchaseRequest` cannot accept a version id. The item check runs against the same locked version, so a concurrent publish cannot race it (CF-2).

## 9. Qualification / binding validation

In-transaction membership check against `reward_program_version_qualifying_items` for `(version.id, qualifyingItemId)`, plus the relational `purchase_records_item_in_version` composite FK (→ the junction PK). Two independent layers (application + database), mirroring the `0007`/`0008` posture.

## 10. Retirement semantics and evidence

Deliberately **no** consultation of `qualifying_items.status` on the purchase path — derived from PB-012 §7 Q6 and the existing `isEligibleForNewReference` (draft-add) vs `isResolvableForExistingReference` (existing-reference) split: retirement blocks **adding to a new draft**, never recording against an already-published, immutable version. A purchase of a retired-but-bound item remains valid; a retired item is never in a *new* version's set (enforced by PB-013B's publish validation). No lifecycle rule was invented.

## 11. Persistence / schema changes

`purchase_records` gains `qualifying_item_id UUID NULL` (structural Business-owned identity), backed by two composite FKs and an index. `item_label` stays `TEXT NOT NULL` (source changes from client input to server-derived snapshot — an application change, no `ALTER`). `knowledge_node_id` is retained untouched on the table but removed from the write path (CF-1).

## 12. Migration number and behaviour

**`0018_purchase_records_qualifying_item`** — verified as the next free number against the live migrations directory (highest was `0017`). Forward: `ADD COLUMN … NULL`; add both FKs `NOT VALID`; `VALIDATE CONSTRAINT`; create the index. Down: drop both FKs, the index, then the column (always safe). `0016`/`0017` untouched. Migration test suite updated for 18 migrations and extended with four PB-013C schema tests (legacy NULL allowed + valid tuple accepted; cross-Business FK rejection; not-on-version FK rejection; ON DELETE RESTRICT pinning).

## 13. Existing-data / backfill treatment

No backfill. `ADD COLUMN … NULL` never rewrites existing rows; legacy rows keep `qualifying_item_id = NULL`, and a NULL FK column is exempt from both composite constraints (MATCH SIMPLE), so `VALIDATE CONSTRAINT` succeeds. Tightening to `NOT NULL` is the deferred, environment-gated PB-013E/`0019` job.

## 14. `itemLabel` snapshot treatment

Retained as the frozen, human-readable transaction-time snapshot, now **server-derived** from the locked version's `item_name_at_version`. It is display/evidence only, never qualification authority, and never client-supplied. The list/detail views and the customer activity surface keep rendering it unchanged.

## 15. Commerce Knowledge treatment

Commerce Knowledge is no longer consulted anywhere on the purchase path. An **unclassified** Qualifying Item (`knowledge_node_id = NULL`) records normally (test-covered). Classification remains optional enrichment on the live item, validated only on the Reward Program draft/publish path (PB-013B), never a purchase requirement.

## 16. Idempotency re-keying

The `recordPurchase` fingerprint now includes `qualifyingItemId` and no longer includes `itemLabel`/`knowledgeNodeId`. Two otherwise-identical requests for different Qualifying Items produce different request hashes: a reused key yields a governed conflict, never a silent duplicate. Gated by a dedicated test (design case N2). `purchaseRequestHash.ts` itself is unchanged (it is a generic hash; the fingerprint lives in the command).

## 17. Trust Event / evidence change

`purchase.recorded` payload adds `qualifyingItemId` (opaque structural reference) while preserving `event_type`, `subject_type`, `subject_id`, causal linkage, in-transaction emission, and the `0013` schema (no payload `CHECK`). The human-readable snapshot remains available on `purchase_records.item_label`.

## 18. `wrong_item` / dispute compatibility

`raisePurchaseDispute` (incl. `wrong_item`) is untouched and now disputes a specific, server-validated, Business-configured item. Test asserts the disputed record retains both `qualifyingItemId` and `itemLabel`.

## 19. UI / wire / hook caller transition (atomic, one merge)

`RecordPurchaseRequest` and `PurchaseRecordWire` (web) updated; `PurchaseRecordsPage.tsx` replaces the free-text item field with a named item `<select>` (no UUID in visible text; single item pre-selected; explicit choice when several); `hooks/purchaseMutations` unchanged structurally. Every shipped caller of the purchase request contract sends the new shape in this same merge. `PurchaseRecordWire` keeps `itemLabel`/`knowledgeNodeId` as read passthroughs (the columns are retained).

## 20. EN/FR changes / parity

`business.purchase.fieldItemLabel` → `business.purchase.fieldQualifyingItem` in both `en.ts` and `fr.ts` (`"Item"` / `"Article"`). Structural locale-parity test passes.

## 21. Purchase verification non-regression

Zero production diff to `verifyPurchaseCommand.ts`, `rejectPurchaseCommand.ts`, `raisePurchaseDisputeCommand.ts`, `verifiedUnitRepository.ts`, `loyaltyCycleRepository.ts`. Purchase integration suite 42/42 green (37 pre-existing + 5 new).

## 22. 10+1 non-regression

Zero diff to the engine, migrations `0009`–`0014`, and the invariants. Allocation/threshold/reward/concurrency tests remain green.

## 23. Test changes

- `purchaseCommands.postgres.test.ts`: fixtures re-based on the structural id; 5 new PB-013C tests (structural id + server-derived snapshot + unclassified validity; uniform rejection of fabricated/malformed/foreign/non-qualifying; client-injected `itemLabel`/`knowledgeNodeId` ignored; idempotency distinguishes different items; Trust Event `qualifyingItemId` + `wrong_item` coherence). 37 → 42.
- `index.test.ts`: purchase mass-assignment boundary updated for `qualifyingItemId` and the removal of `itemLabel`/`knowledgeNodeId`.
- `rewardProgramMigrations.postgres.test.ts`: 18-migration discovery/counts/rollback; scratch-dir filters switched to strict prefixes (`< "0017"`); 4 new PB-013C schema tests. 35 → 39.
- `platformFoundationReadiness.postgres.test.ts`: shipped-migration list + `0018`.
- Web: `purchaseMutations.test.ts` payload re-based; `PurchaseRecordsPage.test.tsx` rewritten for the select (named option, no UUID, no free-text field, single-item pre-select, explicit multi-item choice). 890 → 891.
- No snapshot-updates-to-pass; all assertions behavioral.

## 24. Commands executed

`git fetch origin`; `git worktree add … -b feat/platform-baseline-013c-purchase-business-qualifying-item 2756ecc…`; `pnpm install --frozen-lockfile`; `pnpm --filter functions run typecheck`; `pnpm --filter web run typecheck`; `pnpm --filter functions run test`; `pnpm --filter web run test`; `docker compose -f docker-compose.postgres.yml up -d --wait`; `PLATFORM_ENV=test PLATFORM_POSTGRES_URL=… FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 pnpm --filter functions exec vitest run --config vitest.postgres.config.ts`; `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 GCLOUD_PROJECT=demo-11thonus pnpm --filter functions test:emulator`; `pnpm lint`; `pnpm --filter functions run build`; `pnpm --filter web run build`; `npx prettier --check` on changed files; `git diff --check`.

## 25. Full test results

- Functions unit: **162 files / 1847 tests pass**.
- Functions PostgreSQL integration: **8 files / 235 tests pass** (purchase 42 incl. 5 new; migrations 39 incl. 4 new; rewardProgram 49; qualifyingItem 59 + 23; infra).
- Firebase Emulator Suite: **65 files / 864 pass, 3 skipped, 0 failed** (the Auth emulator was available, so the PB-013B environment-only gap did not reproduce).
- Web unit: **891 pass, 1 fail** — `src/dev/phoneAuthHarness/PhoneAuthHarnessPage.test.tsx` timing assertion (`expected 106 to be less than 80`), zero diff in that file, passes in isolation (39/39) — the pre-existing full-suite timing flake already recorded as `ENG-CI-001` / PB-013A.2-CORR. Environmental, not implementation.
- Typecheck (functions + web), ESLint (0 errors; 1 pre-existing warning in untouched `BusinessApiContext.tsx`), both builds, prettier check, `git diff --check`: clean.
- Playwright: no spec covers the purchase flow (`grep` over `tests/e2e` — none) — nothing applicable.

## 26. Dependencies added / config changes

None. `package.json`/`pnpm-lock.yaml` untouched; no config/rules/CI change.

## 27. P3-3 (PB-013B) status

**Open, untouched.** PB-013C does not modify `publishRewardProgramVersionCommand.ts` or `rewardProgramRepository.ts::publishVersion` (the publish snapshot TOCTOU boundary). The purchase eligibility read runs inside the **purchase** transaction against the locked version, a different boundary. No scope was expanded.

## 28. Risks / residual

- The composite FK guarantees are only total for new rows; legacy rows stay `qualifying_item_id = NULL` until PB-013E/`0019` (disclosed, per design).
- `validateQualifyingNodes` / `QualifyingNode` / `invalidQualifyingNodeError` (rewardProgram domain) are now unused by production code. They are **retained** rather than deleted, because their removal is legacy-cleanup shape (PB-013E / hygiene) and the PB-013C §16 file list does not include the Reward Program domain; disclosed here so a reviewer can decide.
- The emulator suite depended on an already-running Auth emulator in this environment; CI runs the full suite via `emulators:validate`.

## 29. Rollback instructions

Revert the PR merge as **one atomic unit** (backend + UI + idempotency + Trust Event together), then `0018.down` (drop both FKs, the index, then the column — always safe). Reverting only one side would recreate the incoherence PB-012 CORR-001 removed. `0016`/`0017` are not touched.

## 30. Unrelated-change verification / primary-worktree safety / scope

- `git diff --stat origin/main`: 17 modified + 2 new, all inside the PB-013C file list. Zero diff to the 10+1 engine, purchase verification/reject/dispute, permissions, `rewardProgram` production files, `firestore.rules`, configs, dependencies, or the legacy table.
- Primary worktree at `/Volumes/PRODUCTION/Projects/11THONUS` was never entered, read, or modified; its pre-existing dirty state was left alone. No stash/reset/clean/amend; no other worktree modified.
- **PB-013D and PB-013E were NOT started** (no classification picker, no `0019`, no legacy-table drop, no `SET NOT NULL`).

## 31. Markdown report path / changes-log

- This file: `docs/05-implementation/reports/platform-baseline-013c-purchase-business-qualifying-item-implementation-report-2026-09-20.md`.
- Changes log: `docs/changes/IMPLEMENTATION_CHANGES.md` (new entry).

## 32. Final disposition

**A — IMPLEMENTED / AWAITING INDEPENDENT REVIEW.** PB-013C is one atomic contract boundary; `main` is internally coherent after this merge alone (transport, server validation, eligibility, persistence, migration, idempotency, Trust Event, UI/wire/hooks, EN/FR, tests all move together). PR opened, **not merged**, per instruction.
