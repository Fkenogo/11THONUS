# 11THONUS — Post-Phone UX Correction B1R Implementation Report

## Status

- Physical-phone validation: **PASSED / FOUNDER APPROVED**. This approval is carried forward unchanged.
- B1R: implementation complete; validation follow-up preserves legacy idempotency and updates the Founder Preview seed to satisfy B1R binding. No redemption Product Truth changed.
- PR #307 entry head: `ad63568ee0b36612433b1d90be6167897cc5f371`.
- B1R implementation commit: `e4cf7dbd33ab49c5d608a2fc3c74470fde3fbec2`.
- At the first post-implementation inspection, PR #307 was open/unmerged at `e4cf7dbd33ab49c5d608a2fc3c74470fde3fbec2`; no workflow run was visible then. A docs-only follow-up records validation state; the final pushed head is reported in the task response.
- Existing inline review threads: all four are resolved (three outdated, one current); no new B1R thread exists yet.
- PR #307 is three commits behind current `main` (merge base `4bc9c49261c1db8bfdacb3d91b68d51ad59e47f9`). A local read-only merge-tree analysis reports no content conflicts; GitHub's `mergeable_state=dirty` is inconsistent and must be rechecked after the next push. No branch reconciliation was performed.
- PR #310 was not modified. Neither PR is to be merged. ITR remains paused.

## Architecture and binding design

B1A's `getCounterCustomerContext` first authorizes the live `purchase.record` actor, validates and resolves one presented QR or Loyalty Number artifact, then reads `users/{userId}.displayName` and the parameterized Business/customer programme projection. The projection derives progress from the current Cycle and pending confirmation count from `waiting_for_customer` Purchase rows; its existing Business/customer predicates remain intact.

The Counter context now joins the one available Reward to the matching current `reward_available` Cycle using the same Business, resolved customer, programme and Cycle. It carries the server-owned Reward ID and persisted reward description internally. The service evaluates `redemption.confirm` through `evaluatePermission`; it emits the Reward ID only when that live result allows confirmation. Non-eligible Staff receive reward availability and description, but no Reward ID. The eligibility boolean is UX guidance only.

The callable requires the current presented QR/Loyalty Number artifact and expected programme reference alongside the Reward reference. After live authorization, the existing command resolves the artifact through the identity resolver and checks resolved customer and programme against the Business-scoped Reward before entering the existing transaction. A mismatch returns the same not-found category as an unrelated/unavailable Reward. The mutation still rechecks live permission at the mutation boundary. No client customer identity, role, grant, ownership, or Reward state is accepted.

This was necessary because the existing engine's Business-only Reward lookup can accept any available Reward ID within that Business. A UI-only filter could not prove that the Reward belonged to the customer currently served. The added server binding prevents a same-Business cross-customer substitution without changing the redemption transition, Cycle handling, evidence, notifications, or permission rules.

### Idempotency compatibility correction


## Experience and authority

- Eligible Owner/Manager/explicitly granted Staff see **Use 11th** and a confirmation dialog with the resolved customer display name, programme, persisted reward description, explicit confirmation copy, Cancel and Confirm.
- Ineligible Staff see reward awareness and the bounded Manager/Owner handoff. No redemption control is rendered and no client role-name decision is used.
- Permission revoked after the context read is denied by the existing mutation authorization. The client displays a safe failure and invalidates/refetches the transaction context.
- Double taps are guarded synchronously in the UI. An uncertain response retains the same dialog-scoped idempotency key for retry.
- The web Firebase callable adapter sends only Business, Reward, Programme, the current presented artifact and idempotency key plus the authenticated actor proof; it projects the returned engine response to a small success result and drops internal identity, confirmer, Reward, and redemption identifiers from web mutation state.
- Redemption is not `recordPurchase`: the dialog states that no new purchase is recorded. The engine remains responsible for the existing available-to-redeemed transition, Cycle close/open, forward allocation and evidence. The UI refetches context; it does not fabricate history or confirmer attribution.

## Privacy boundary

Staff transaction context contains only display name, relevant current-Business programme/progress, awaiting-confirmation count, reward state and reward description. A Reward ID is added only for an actor currently eligible to confirm. It excludes email, phone, full profile, authentication references, cross-Business history, unrelated purchases, directory/search, CRM notes, reviewer identity and Business Review threshold. The callable binds Business + resolved artifact customer + expected programme + persisted available Reward and fails closed on foreign, mismatched, malformed or unavailable inputs.

## Files changed

Implementation and tests:

- `apps/web/src/business/api/purchaseMutations.ts`
- `apps/web/src/business/api/purchaseMutations.test.ts`
- `apps/web/src/business/counter/CounterCustomerContextCards.tsx`
- `apps/web/src/business/counter/CounterPage.tsx`
- `apps/web/src/business/counter/CounterPage.test.tsx`
- `apps/web/src/business/counter/counterHooks.ts`
- `apps/web/src/dev/counterHarness/CounterHarnessPage.tsx`
- `apps/web/src/i18n/locales/en.ts`
- `apps/web/src/i18n/locales/fr.ts`
- `functions/src/domains/purchase/repositories/counterCustomerContextRepository.ts`
- `functions/src/domains/purchase/services/counterCustomerContext.ts`
- `functions/src/domains/purchase/services/confirmRedemptionCommand.ts`
- `functions/src/domains/purchase/services/confirmRedemptionCommand.postgres.test.ts`
- `functions/src/domains/purchase/services/staffCounter.postgres.test.ts`
- `functions/src/index.ts`
- `functions/src/index.test.ts`

Documentation:

- `docs/changes/IMPLEMENTATION_CHANGES.md`
- `docs/05-implementation/reports/11THONUS-post-phone-ux-correction-b1a-implementation-report-2026-10-12.md`
- this report

No dependency, configuration, migration, schema, Firebase project, Cloudflare or PR #310 change is included.

## Validation record

Validation:

- Web Counter/API tests: **87 passed** (`purchaseMutations.test.ts`, `CounterPage.test.tsx`).
- Web application TypeScript check: passed.
- Focused Functions/index/permission tests: 110 passed earlier in this implementation turn.
- Functions TypeScript check: passed after server binding changes; Functions compilation also succeeded during the preview setup attempt.
- Full Functions unit suite: **2,033 passed** (176 files).
- Full web unit suite: **1,148 passed** (138 files) with `NODE_OPTIONS=--no-experimental-webstorage`; the initial host-default run had localStorage harness failures which this supported runtime flag resolved.
- Changed-file ESLint: passed after correcting a test-helper lint finding.
- Changed-file Prettier check and `git diff --check`: passed.
- Web production build: passed (Vite generated the PWA bundle in `/tmp`; Vite emitted the existing large-chunk advisory).
- PostgreSQL integration, Firebase emulator, preview verification/counter checks, and Playwright: blocked by the host preview environment. The owned Postgres container became healthy, but preview startup refused because its required Firebase emulator ports 28101, 28102, 28103, 28106, 28107 and 28108 were already occupied. No foreign processes were stopped. Preview checks consequently reported missing seed state.
- Compatibility follow-up exact-head CI run `38257093090` passed on `8cec3bdd2f61c897238049c571a74abb059e7bd5` after a workflow-dispatch trigger. All workflow steps passed: build, lint, format, typecheck, unit/component, PostgreSQL integration (including Firestore Emulator), Playwright, Founder Preview tooling, cross-project port-isolation acceptance, and Firebase Emulator validation. This exact-head run includes the legacy/B1R idempotency regressions and the updated Founder Preview redemption seed.
- GitHub still reports PR #307 `mergeable=false` / `mergeable_state=dirty`. Current `main` is three commits ahead of merge base `4bc9c49261c1db8bfdacb3d91b68d51ad59e47f9` (`behind_by=3`), and read-only `git merge-tree` against current `origin/main` reports no conflicts. The reported dirty state is inconsistent with the local merge result; no rebase or merge was performed. Recheck GitHub's mergeability calculation before any merge action.
- Existing inline review threads: four total, all resolved (three outdated, one current); no new B1R inline thread.

## Risks and rollback

The main remaining risks are a same-request authorization revocation race (handled by the existing mutation-time evaluator), temporary context read failure after a successful mutation, and keeping this transaction-scoped projection narrow in future edits. Existing redemption idempotency, lock ordering, conditional transition and unique Reward redemption backstop remain unchanged.

Rollback: revert the B1R implementation commit(s) on `feat/ea-bl-001-corr-002-b-staff-counter`. There is no migration or schema rollback.

## Validation and compatibility follow-up — 2026-10-12

The legacy idempotency compatibility correction is recorded in `docs/changes/IMPLEMENTATION_CHANGES.md`. The Founder Preview redemption seed now supplies Aline's issued QR reference and the seeded programme reference required by the closed B1R callable. Exact-head CI run `38257093090` passed at code head `8cec3bdd2f61c897238049c571a74abb059e7bd5`. GitHub's `dirty` mergeability report remains unreconciled despite a clean read-only merge-tree result; this package does not rewrite the branch.

## Recommendation

Keep PR #307 unmerged, PR #310 untouched, B2 unauthorized, and ITR paused. PostgreSQL/emulator/preview validation remains an environment limitation; Founder review and exact-head CI remain pending.
