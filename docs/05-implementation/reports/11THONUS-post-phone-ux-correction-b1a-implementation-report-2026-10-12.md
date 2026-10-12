# 11THONUS — POST-PHONE UX CORRECTION B1A IMPLEMENTATION REPORT

**Status:** Implementation complete; Founder review pending. Not merged. ITR remains paused.

## Authority and boundaries

- Physical-phone validation remains **PASSED / FOUNDER APPROVED**. This is retained evidence, not reopened by this correction.
- Implemented FD-UX-1 (bounded Staff context), FD-UX-2 (programme-to-purchase shortcut), and FD-UX-3A (reward awareness only).
- The read is available only after live `purchase.record` authorization and successful resolution of exactly one QR reference or Loyalty Number. The projection is scoped to that resolved customer and the acting Business.
- Staff receives only display name and participating programme context: programme name/id, verified units, required verified units, awaiting-customer-confirmation units, and reward availability (`none|available`). It excludes contacts, auth identity, profile, customer ids, unrelated history, cross-Business context, reviewer, threshold, and reward/redemption identifiers.
- Current Circle progress comes from the Business/customer/programme current cycle projection. Only `waiting_for_customer` quantities are counted as awaiting; they do not inflate verified units. Business-review-held purchases remain excluded.
- Reward availability is read server-side from the current cycle plus an available reward record. The wire result carries a boolean status only. B1A exposes no redemption mutation/control and makes no client permission decision. **B1R remains required** for a bound reward, live confirmer eligibility, web adapter, and governed confirmation sheet.
- Programme cards show eligible service labels. Add Purchase fixes the selected programme, retains the resolved artifact, resets quantity to 1, safely preselects a sole item, and requires an explicit choice among multiple items. Record Purchase remains explicit. Existing intent/idempotency and double-submit protections are retained.
- No schema, migration, dependency, auth provider, Cloudflare, Product Truth, or redemption authority change.

## Architecture and files

New server seam: `getCounterCustomerContext` authorizes Staff at request time, applies the existing artifact resolver, reads `users/{userId}.displayName` through the narrow identity repository, then runs a parameterized Business + resolved-customer projection. Loyalty Number reads preserve the active shared-number policy. Existing Owner/Manager-wide loyalty reads are not exposed to Staff. The old four-value `getCounterLoyaltyContext` remains unchanged.

Files changed:

- `functions/src/domains/purchase/repositories/counterCustomerContextRepository.ts`
- `functions/src/domains/purchase/services/counterCustomerContext.ts`
- `functions/src/domains/purchase/services/staffCounter.postgres.test.ts`
- `functions/src/index.ts`, `functions/src/index.test.ts`
- `apps/web/src/business/api/purchaseMutations.ts`, `purchaseMutations.test.ts`
- `apps/web/src/business/hooks/queryKeys.ts`
- `apps/web/src/business/counter/counterHooks.ts`, `CounterPage.tsx`, `CounterPage.test.tsx`, `StaffMobileShell.test.tsx`
- `apps/web/src/business/counter/CounterCustomerContextCards.tsx`
- `apps/web/src/i18n/locales/en.ts`, `fr.ts`
- `tests/preview/counter-checks.mjs`
- This report and `docs/changes/IMPLEMENTATION_CHANGES.md`

No changes to PR #310, migrations, Firebase/Cloudflare configuration, customer schema, or redemption code.

## Validation

| Validation | Result |
|---|---|
| Focused web Counter/API tests | 83/83 passed |
| Focused callable contract tests | 85/85 passed |
| B1A PostgreSQL + Firestore-emulator integration cases | 6/6 passed, including the QR-only/Loyalty Number neutral-policy boundary |
| Full Functions unit suite | 176 files, 2,031 tests passed |
| PostgreSQL `staffCounter` suite | 53/53 passed. Its existing index-applicability fixture disables bitmap/seq scans and lowers random page cost so the tiny fixture proves the composite ordered index path rather than asserting a cost estimate. |
| TypeScript Functions/web | Passed |
| ESLint changed files | Passed |
| Prettier changed files | Passed |
| Web production build | Passed (existing large-chunk advisory only) |
| Preview syntax check | Passed |
| Full web unit suite | 138 files, 1,144/1,144 passed using `NODE_OPTIONS=--no-experimental-webstorage` (needed for Node 26 + jsdom localStorage). |
| `preview:verify`, `preview:counter-checks` | Not run successfully: no seed state in isolated worktree; guarded `preview:start` refused because another emulator process owns the required 28101–28108 ports. The process was not stopped or modified. |
| Playwright dashboard harness | Could not execute in this host: Playwright's configured Chromium headless shell is not installed. No browser was downloaded. |
| Live preview E2E | Pending; guarded preview startup is blocked by occupied ports. |

## Version control and review

- Entry PR #307 SHA: `a2774cc6ec7799ce92700d81b15d7769be8da240`.
- Product implementation commit: `fe9d109dda86288126295d462e76497cd3f03900`, pushed to `feat/ea-bl-001-corr-002-b-staff-counter`. This report is a follow-up documentation commit; the final exact branch head is recorded in the task completion report.
- PR #310 remains untouched at the supplied head.
- CI runs `38233301268` and `38234447180` passed build, lint, format, typecheck and unit/component tests (Functions 2,031; web 1,144), then failed one existing recorder-index plan assertion because the cost-based planner chose another index for a tiny fixture. The test now states the planner assumptions needed to prove index applicability; the complete `staffCounter` file passes 53/53 locally. Exact-head CI is being rerun.
- PR #307 inline review threads: 4 returned; all resolved (2 current, 2 outdated). No unresolved thread returned.
- Neither PR is merged; no ITR started.

## Risks and rollback

The principal risk is accidental widening of the transaction context in future edits; keep this projection's explicit field whitelist and scope tests. The name is nullable where no display name is present. Staff reward awareness is informative only until B1R exists. Existing Postgres planner sensitivity and occupied preview ports limit local broad validation.

Rollback: revert the B1A commit on `feat/ea-bl-001-corr-002-b-staff-counter`. This restores the former anonymous context UI and removes only the new read endpoint/projection and shortcut. No migration rollback is needed.

## Recommendation

Founder review of the bounded context and reward-awareness language is recommended. Keep ITR paused until B1A is accepted and the exact PR head's required CI is green. Deliver B1R separately before any Staff redemption interaction. Keep Slices C/D/E unauthorized.
