# 11THONUS — Post-Phone UX Correction B2 Implementation Report

## Status

**Implementation in progress — Founder unified review and exact-head CI pending.** Entry PR #307 head: `c099c11b117355be2bef1dc8e72914b2602de5a5`. Physical-phone validation remains **PASSED / FOUNDER APPROVED**. B1A remains technically accepted, B1R remains validated/technically accepted, and Independent Technical Review remains paused.

## Scope

B2 improves Customer discoverability and navigation while retaining existing purchase verification, Circle, reward, and Firebase authentication authority. New-customer join and email registration remain accepted and unchanged. Telephone registration remains deferred.

## Implemented changes

- Customer Home waiting purchase events now show a direct **Review & confirm** link to `/customer/activity/:purchaseRecordId`.
- Customer Activity supports direct purchase detail routes. It retains the existing ownership-checked purchase detail read and existing Verify, Reject, and Dispute callables. “This is incorrect” reveals the existing separate Reject and Dispute choices; no backend state was added.
- The existing Customer experience activity projection now includes the Customer-owned purchase record reference on purchase events. The SQL remains filtered by the server-resolved Customer identity. Reward and redemption events have no purchase reference.
- Purchase activity rows with a purchase reference open the existing purchase detail. Reward-available rows open the associated Circle. Reward-redeemed events stay read-only because no distinct redemption-detail read exists.
- Customer Home and Circles list cards open `/customer/circles/:rewardProgramId`. The detail renders only the authenticated Customer’s matching Circle from the existing overview read. Verified units, awaiting-confirmation quantity, and reward availability stay separate and server-authored.
- Customer Profile now offers **Sign out** through the existing `signOutCurrentSession` Firebase client-session seam, then navigates to `/` after success. Existing authenticated route guards prevent the signed-out user from continuing to use Customer routes.
- New copy has English and French translations.

## Product and privacy boundaries

No purchase verification semantics, Verified Unit issuance, Cycle mechanics, Business Review, redemption authority, rejection/dispute states, commercial admission, identity model, auth provider, Cloudflare configuration, schema, migration, dependency, or Product Truth changed. Foreign purchase detail remains rejected by the existing authenticated-customer ownership check. Circle detail resolves only from the current Customer overview; non-participating programme IDs receive a neutral unavailable state. No new history attribution is fabricated.

## Activity event navigation support

| Event | Navigation | Reason |
|---|---|---|
| Purchase recorded / verified / rejected / disputed | Purchase detail when `purchaseRecordId` exists | Existing Customer-owned purchase detail read supports it |
| Reward available | Matching Circle detail | Existing activity row carries the programme reference and Customer overview supplies the authoritative Circle |
| Reward redeemed | Read-only | Existing overview has no distinct redemption detail or customer-safe attribution view |

## Validation (local)

- Focused Customer B2 plus B1A/B1R regression coverage: **120 passed**.
- Focused Customer Experience read-model tests: **6 passed**.
- Full Functions unit suite: **2,034 passed**.
- Web and Functions typecheck: **passed**. Web production build: **passed** (existing large-chunk advisory only).
- Changed-file ESLint and Prettier checks: **passed**.
- Full web suite on the local Node 26 runtime was not clean: 1,151 passed and 3 failed. Two failures were in the unrelated phone-auth harness storage assertions under Node's file-backed `localStorage`; the Customer Activity language assertion was fixed by explicitly resetting test language and passes in the focused rerun.
- PostgreSQL suite with Firebase Emulator: 575 passed, 232 skipped, 5 failed during shared migration setup because `commercial_admissions` already existed. A direct run without the Firestore Emulator failed 12 suites for the missing `FIRESTORE_EMULATOR_HOST`. No Product code change was made in response; exact-head CI remains the authoritative integration result.
- Founder Preview verify/counter checks could not run: preview was stopped and unseeded. No phone-preview infrastructure or PR #310 change was made to seed it.
- Exact-head CI, Playwright, final PR/review state, and final recommendation will be recorded in the completion report after push.

## Worktree and PR boundary

Work is isolated in the clean managed worktree on `feat/ea-bl-001-corr-002-b-staff-counter`, based on exact entry `c099c11b117355be2bef1dc8e72914b2602de5a5`. The `infra/slice-b-phone-preview` worktree and PR #310 are not part of this change. Neither PR is to be merged and ITR is not to start as part of B2.

## Rollback

Revert the B2 commit on PR #307. No database migration, configuration rollout, or external service change requires rollback.
