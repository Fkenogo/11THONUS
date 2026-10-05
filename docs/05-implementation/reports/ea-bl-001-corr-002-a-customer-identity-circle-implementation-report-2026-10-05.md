# 11THONUS — EA-BL-001-CORR-002-A
# Customer Identity & Circle Implementation Report

> **Status:** Implementation complete to the code/test stage; Founder Preview and visual acceptance remain blocked by an existing local preview service holding required emulator ports.
> **Authorized base:** `origin/main` `76214100400b0df43082b29f6ddd46e13c3dd5d2` (PR #299 merge).
> **Branch:** `feat/ea-bl-001-corr-002-a-customer-circle`.
> **Implementation commit:** `e5bd42dc0fa5d97f4533b311458c861e61dec1b1`.
> **Pull request:** [#300](https://github.com/Fkenogo/11THONUS/pull/300) (draft; preview acceptance pending).
> **Experience Reference:** `Fkenogo/11thonus-prototype@18e8d700f505beefe46d324f6ea33f20a670abe7`.

## 1. Entry state and authority

PR #299 was merged at `76214100400b0df43082b29f6ddd46e13c3dd5d2`. The current Master Workflow, Engineering Implementation Programme and Prompt Register at that base show Slice A as Ready / Founder-authorized Slice A only. Slices B–E and Business Review remain not authorized. EA-BL-002 remains unstarted. Work was isolated in a clean linked worktree on the branch named above; the pre-existing workspace on `wp-com-06a` was left untouched.

## 2. Implementation strategy

Reused authenticated identity resolution, existing canonical Loyalty Number and QR artifacts, purchase lifecycle records, current Cycle and Reward state, existing customer-available reward reads, Business display-name reads, React Query, customer localization and QR rendering. Added bounded server-side reads scoped to the authenticated Customer Identity, a projection joining verified Cycle units and `waiting_for_customer` purchase quantities, and a prototype-faithful customer presentation. No schema, migration, dependency or persistent model was added. Pending quantities are projected from Purchase records and are not a second loyalty-credit ledger.

## 3. Prototype sources reproduced

Inspected the exact frozen `ParticipantExperience.tsx`, `LoyaltyCircle`, identity/code presentation, customer navigation, reward-ready and post-redemption views, activity composition, shared colors/typography, responsive behavior and empty states. Production now uses the member header, prominent identity action, Circle visualization, reward-first state, activity/history, relationship list, profile view and four-item mobile bottom navigation. Production QR is the canonical opaque QR reference, not prototype mock data.

## 4. Customer identity and security

`getMyCustomerIdentityPresentation` resolves the caller from authenticated server context and reads the existing display name, Loyalty Number assignment and active QR identity. Request parsing accepts authentication proof only and discards client-supplied customer identifiers. No identity is created or regenerated in the read path. The customer UI exposes the QR in a dialog and the canonical Loyalty Number; the QR is presented as an identification aid, never as authentication.

## 5. Circle, Pending/Verified, rewards and activity

`getMyCustomerExperienceOverview` scopes all PostgreSQL reads to the server-resolved identity. Active and reward-available Cycles use persisted `allocated_units` as Verified Units. Pending Units are summed only from purchases in `waiting_for_customer`; pending-admission purchases do not count as Pending Units or Verified Units. The projection rejects inconsistent reward state and never calculates eligibility in the browser. The available Reward read remains the existing server-authoritative query. Redemption activity contains Business/reward/time information only; confirmer identity is not returned.

The customer home prioritizes an available Reward, then the closest active Circle, then an honest no-relationship empty state. Reward-ready retains the completed Circle visualization. Redemption acknowledgement and next-cycle continuity are composed from redemption/Cycle records. The activity screen adds persisted loyalty events while retaining the existing customer purchase-review flow.

## 6. Localization and theme

Added English and French keys for identity, Circle, Pending/Verified explanations, rewards, activity, loading, empty, error and navigation states. The Slice A shell uses scoped prototype light/slate/amber surfaces and mobile navigation. No broad global theme rewrite was made.

## 7. Validation

- Web tests: **937/937**, 130 files.
- Functions tests: **1,982/1,982**, 173 files.
- Web TypeScript: passed (`tsc -b --noEmit`).
- Functions TypeScript: passed (`tsc --noEmit -p functions/tsconfig.json`).
- ESLint: zero errors; one pre-existing `react-refresh/only-export-components` warning in `apps/web/src/business/BusinessApiContext.tsx`.
- Prettier check: changed implementation files pass.
- Web production build: passed; existing bundle-size advisory (>500 kB) remains.
- Preview tooling: **44/44** passed when run with local loopback access. In sandboxed mode, five loopback-listener checks initially failed with EPERM; the same suite passed when rerun with the required local socket access.
- Customer read SQL smoke check: the three new PostgreSQL read queries executed successfully against an isolated local database with the current 27 migrations and returned empty results for an unknown identity.
- Full seeded browser E2E and screenshot evidence were not run because the required preview emulator ports are occupied by a separate running preview. The preview safety check correctly refused to stop or reuse those processes.

## 8. Prototype comparison and Founder Preview

Source-level experience alignment was implemented, but the required side-by-side browser comparison is **not yet assessed**. The preview launcher found ports 28101–28103 and 28106–28108 already occupied and refused to touch them. The database port conflict was avoided with a new isolated local container; that container was removed after the emulator startup remained blocked. No other preview service was stopped or changed.

Required comparison states remain pending: desktop home; mobile home; active Circle; mixed Pending + Verified; Reward Available; post-redemption/next-Cycle; no-active-Circle. Each must be labeled MATCH, ACCEPTABLE PRODUCT-TRUTH ADAPTATION or MISMATCH after browser evidence is available. No claim of visual acceptance is made here.

The existing preview fixture includes customer identities suitable for review: Amina (mid-Circle), Kevin (Reward available), Moses (waiting for customer review), and Aline (post-redemption/next Cycle). Preview-only password is defined in `tests/preview/identities.json`; disclose it only in the live Founder Preview handoff. Preview URL would be `http://localhost:28109`; no server is currently running for this branch.

## 9. Files and boundaries

Implementation adds customer-scoped identity and Circle reads, client adapters/hooks, Circle/home/activity/profile UI, English/French copy and focused unit tests. It changes no domain schema, migration, package dependency, backend architecture, Business Review lifecycle, staff flow, WP-COM work, EA-BL-002 or deployment configuration.

## 10. Completion gate

**Not ready for Founder Preview yet.** Code and automated validation are complete, but Slice A is not complete until the exact branch is launched, desktop/mobile and required state comparisons are captured, unresolved mismatches are corrected or returned to Founder, and Founder accepts the preview. Technical Review and Founder final review/Manual QA remain subsequent gates under current governance.
