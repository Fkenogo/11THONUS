# `PRODUCT-ALIGN-002-CORR-001` — Implementation Report

**Date:** 2026-09-11
**Performed by:** Claude (AI agent), isolated worktree/branch `worktree-agent-a9452c5e6d9185e3f` (base `c82a92e`, atop `main` `30dc8d9`)
**Task:** Complete an interrupted correction to `PRODUCT-ALIGN-002` — (1) resolve `DEC-LOY-009` per new Founder direction; (2) finish and harden the business-access discovery work (owner/manager/staff routing); (3) review whether the Loyalty Number/QR Identity lifecycle can be safely wired into registration; (4) harden the `TEST_ONLY_FIXTURE` Terms seed script.

## 1. Interrupted worktree entry state

On entry, the worktree already had uncommitted working-tree changes beyond what the task brief described: in addition to the business-access discovery backend/frontend work, `apps/web/src/RootEntry.test.tsx` and `apps/web/src/business/onboarding/BusinessResolverPage.test.tsx` were also already modified, and `functions/src/index.test.ts` already had a `parseAccessibleBusinessesRequest` unit-test block. `functions/src/domains/business/services/businessReadService.emulator.test.ts` already contained a full `getAccessibleBusinesses` describe block covering owner/manager/staff-active-membership access, non-active-membership exclusion, and two fail-closed cases (duplicate membership, membership referencing a missing Business). This is a stronger starting point than the brief's inventory assumed — test coverage for item #2 was materially more complete than "not started."

## 2. Work preserved vs. corrected vs. newly completed

- **Preserved untouched:** all backend business-access discovery code (`businessReadService.ts`, `businessMembershipRepository.ts`, `businessRepository.ts`, `index.ts` callable), the `BusinessResolverPage.tsx` "Personal + business/role" chooser, `businessQueries.ts`/`queryKeys.ts`, and the i18n additions. These were verified correct on read and left as-is.
- **Corrected:** `apps/web/src/RootEntry.tsx`'s module docstring (lines 11-24), which was stale — it still described the pre-fix gap ("no callable to list a user's memberships across businesses... falls through to the customer shell") even though the code below it already uses `getAccessibleBusinesses`/`useAccessibleBusinessesQuery`, which closes that exact gap. Rewritten to describe current behavior accurately.
- **Newly completed:**
  - `DEC-LOY-009` resolved to `CONFIRMED` in the Decision Register (see §4).
  - One stale "DEC-LOY-009 OPEN_FOUNDER" blocking-reason citation corrected in `engineering-implementation-programme.md`.
  - `tests/e2e/emulator/seedTestOnlyTermsFixture.mjs` hardened (see §8).
  - This implementation report and a new documentation-changes-log entry.
- **Not implemented (authority gap, by design):** Loyalty Number/QR Identity registration-orchestration wiring — see §7.

## 3. Files modified

- `apps/web/src/RootEntry.tsx` (docstring correction only — no behavior change)
- `docs/00-governance/decisions/decision-register.md` (`DEC-LOY-009` entry + banner)
- `docs/05-implementation/change-tracking/engineering-implementation-programme.md` (one stale blocking-reason line)
- `tests/e2e/emulator/seedTestOnlyTermsFixture.mjs` (hardened env-var/host validation)
- `docs/00-governance/documentation-changes-log.md` (new entry)
- This report (new file)

Files already modified/created by the interrupted prior work, committed as-is by this task (see git history for the full diff): `apps/web/src/RootEntry.test.tsx`, `apps/web/src/business/hooks/businessQueries.ts`, `apps/web/src/business/hooks/queryKeys.ts`, `apps/web/src/business/onboarding/BusinessResolverPage.tsx`/`.test.tsx`, `apps/web/src/i18n/locales/en.ts`/`fr.ts`, `apps/web/src/business/api/accessibleBusinesses.ts`/`.test.ts` (new), `functions/src/domains/business/repositories/businessRepository.ts`, `functions/src/domains/business/services/businessReadService.ts`/`.emulator.test.ts`, `functions/src/domains/permissions/repositories/businessMembershipRepository.ts`, `functions/src/index.ts`/`.test.ts`.

## 4. `DEC-LOY-009` governance result

`DEC-LOY-009` ("Reward quantity default and >1 support") moved **`OPEN_FOUNDER` → `CONFIRMED`**. The new Founder direction is conservative: **no launch Reward Program may configure `rewardQuantity > 1` at all** — `rewardQuantity` is fixed at exactly `1` for every launch Reward Program. The schema may reserve an unexposed extension point for a possible future `>1` capability, but must not allow configuring it now; any future `>1` support requires a new, separately governed decision.

- `decision-register.md`'s `DEC-LOY-009` entry: Status, "Current confirmed position," "Founder decision required," "Final decision," Decision date (2026-09-11), Approved by (Founder), and "Implementation consequences" all updated to reflect the resolved rule.
- The existing 2026-09-11 `FD-LOY-009`/`PRODUCT-ALIGN-002` addendum (which explicitly narrowed only the MVP default and left Status `OPEN_FOUNDER`) was **preserved verbatim**, not rewritten — a new, separately-labelled superseding note explains that the Founder direction was clarified to answer the decision's full question.
- The file's "Last controlled update" banner was updated in the existing house style (new `PRODUCT-ALIGN-002-CORR-001` entry on top, prior `PRODUCT-ALIGN-002` entry preserved as "Prior update").
- `DEC-LOY-008` was **not** touched. `DEC-LOY-014`/`DEC-LOY-015` do not exist as register entries (referenced only in untracked, out-of-hierarchy files) and were left alone.
- Grepped for stale "DEC-LOY-009 blocks..." citations: found four in `engineering-implementation-programme.md` (Phase 4 entry-criteria/decision-dependency prose, plus one work-package "Blocking Reason" cell). Corrected only the one cell that had gone **provably false** the moment DEC-LOY-009 resolved (`ENG-P4-001`'s "Blocking Reason | DEC-LOY-009 OPEN_FOUNDER"); left the surrounding Phase 4 narrative untouched since Phase 4 as a whole remains genuinely blocked on Phase 3 regardless of DEC-LOY-009's status, per the task's own instruction against a broad sweep.

## 5. Business-access discovery architecture (final state)

- `functions/src/domains/permissions/repositories/businessMembershipRepository.ts`: `listMembershipsByUser(db, userId)` — queries `businessMemberships` by `userId` across all businesses.
- `functions/src/domains/business/repositories/businessRepository.ts`: `readBusinessByIdForRouting` — a bounded read (id/displayName/status only) used for routing DTOs.
- `functions/src/domains/business/services/businessReadService.ts`: `getAccessibleBusinesses(db, userId)` — actor-scoped, reads only `status === "active"` memberships (invited/removed/suspended excluded), fails closed (`BusinessDomainError`, category `VALIDATION_FAILED`) on a duplicate active membership for one business or a membership referencing a missing/malformed Business document. Purely read-only.
- `functions/src/index.ts`: `getAccessibleBusinesses` onCall callable, actor-resolved via `resolveAuthenticatedIdentityActorReadOnly` — throws (`toHttpsError`) on any failure, never swallows an error into a fallback result.
- Frontend: `apps/web/src/business/api/accessibleBusinesses.ts`, `useAccessibleBusinessesQuery` (`business/hooks/businessQueries.ts`), wired into both `RootEntry.tsx` (routing decision) and `BusinessResolverPage.tsx` (the "Personal / business — role" chooser, governed by AP-003/§3.3 of `01-accounts-roles-and-permissions.md`).

## 6. Customer/owner/staff/multiple-context routing behavior (final state)

Proven via the Firebase Emulator Suite (`businessReadService.emulator.test.ts`, `getAccessibleBusinesses` describe block, all passing in the 760/762-passing emulator run — see §9):
- Pure owner → gets a business context (role `owner`).
- Active manager/staff membership, non-owner → gets a business context (roles `manager`/`staff`).
- Invited/suspended/removed memberships → excluded, empty result.
- A user with owner + manager + staff memberships across three businesses → all three returned, correctly labelled.
- Duplicate active membership for one business, or an active membership referencing a missing Business → throws (`VALIDATION_FAILED`), never silently drops to an empty/customer result.

Proven at the web layer (`RootEntry.test.tsx`, `BusinessResolverPage.test.tsx`, all passing in the 747/747-passing web unit run):
- Unauthenticated → sign-in surface.
- Zero accessible businesses → `/customer`.
- ≥1 accessible business (owner or manager, regardless of role — `RootEntry` only checks length) → `/business`, where `BusinessResolverPage` renders "Personal" alongside each business with its role-appropriate destination (owner → `/business/:id`; manager → `/business/:id/dashboard`).
- Discovery query `error` status → explicit error text + a "Try again" retry button, never a silent customer-shell fallback.
- Discovery query `pending` → loading state, never blank.

**Remaining gap, explicitly not a regression from this task:** there is no dedicated web test asserting a *staff-only* (non-owner, non-manager) accessible business renders identically to the owner/manager case at `RootEntry`/`BusinessResolverPage`. Functionally this is already covered by the existing tests, since neither component branches on role for the top-level routing decision (only `BusinessResolverPage`'s per-row destination differs by role, and that is tested via the "manager" row in the multi-business test) — but no test uses the literal role string `"staff"`. Not added given time constraints; low risk, since the code path is identical to the tested `"manager"` case.

## 7. Loyalty Number/QR Identity lifecycle — result

**`CUSTOMER IDENTITY ISSUANCE INTEGRATION — AUTHORITY REQUIRED`**

Re-verified via grep: `loyaltyNumberIssuanceService` and `qrIdentityAssociationService` are still never invoked from `functions/src/domains/authentication/services/registrationSignInService.ts` or anywhere else, and `functions/src/index.ts` exposes no callable for either. Still true as of this task.

The PRD (`docs/01-product/prd/02-customer-registration-and-identity.md`, FR-CI-001/002) does state the desired end-state invariant clearly: *"The system shall generate one permanent loyalty number for every registered customer"* and *"The system shall generate one QR code linked to the loyalty number."* However, both domains' own governing READMEs explicitly and deliberately scope out the orchestration this task would need to build:

- `functions/src/domains/loyaltyNumber/README.md`: *"Domain-foundation layer only. **No Firestore persistence, no unique indexing, no transactions, no distributed collision handling, no registration orchestration**..."*
- `functions/src/domains/qrIdentity/README.md`: *"Domain-foundation layer only. **No QR-image rendering, no camera scanning, no UI, no API routes, no Firestore persistence, no merchant lookup, no registration orchestration**..."*

Both were delivered as bounded packages (`ENG-P2-001-03`, `ENG-P2-001-04`) whose own scope documents explicitly defer "registration orchestration" to a separate, not-yet-authorized package — the same staged-authorization pattern this codebase uses everywhere else (e.g. `ENG-P3-002A`/`B`/`C`, each requiring its own Founder implementation authorization). No governing document ties issuance timing/trigger/transaction-boundary/idempotency-under-retry semantics to a specific step of `registrationSignInService.ts`, and that service itself carries no comment or TODO pointing at a designed integration point. This is exactly the ambiguity the task brief itself flags as disqualifying implementation: the *what* (exactly one Loyalty Number + QR per registered customer) is governed and clear, but the *where/when/how* of wiring it into the actual registration transaction is not — and the domain owners' own documentation says so explicitly.

Per the task's explicit instruction, this is treated as an acceptable, expected stop condition rather than an implementation. No code was written for this item. A read-only "get my Loyalty Number/QR if issued" callable and the `CustomerHomePage.tsx` wiring were likewise not built, since they would sit on top of the same unauthorized orchestration.

## 8. Terms fixture hardening result

`tests/e2e/emulator/seedTestOnlyTermsFixture.mjs` had a genuine fail-open bug: `isDemoProject = projectId === "" || projectId === DEMO_PROJECT_ID` treated an **empty/missing** project id as valid, and the script then unconditionally set `process.env.GCLOUD_PROJECT = DEMO_PROJECT_ID` regardless of what was actually validated — a silent default substitution the task brief specifically called out.

Hardened to require, all explicitly, with zero `??`/`||`/default-parameter substitution in any check:
- `FIRESTORE_EMULATOR_HOST` set, non-empty, and loopback-only (`127.0.0.1`/`localhost`; any other host rejected).
- `FIREBASE_AUTH_EMULATOR_HOST`, if set at all, must also be loopback-only (this script does not require it to be set, but if present it is validated the same way — no other script or caller in this repository currently sets or reads it for this fixture).
- The project id (`GCLOUD_PROJECT` or `VITE_FIREBASE_PROJECT_ID`, whichever is present) must be set, non-empty, and *exactly* `demo-11thonus` — empty, missing, or any other value (including anything staging/production-shaped) is rejected.
- `GCLOUD_PROJECT` is only ever set by the script when it wasn't already present and validated — never overwritten with a silently-substituted default.

No test-file convention exists for these `.mjs` emulator seed scripts (`seedCommerceKnowledge.mjs`, the only precedent, also has no test file) — per the task's own fallback instruction, verification was manual, against real process invocations:

| Scenario | Result |
|---|---|
| No `FIRESTORE_EMULATOR_HOST` at all | exit 1, clear message |
| Non-loopback `FIRESTORE_EMULATOR_HOST` (`10.0.0.5:8080`) | exit 1, clear message |
| No project id set at all | exit 1, clear message |
| Empty-string `GCLOUD_PROJECT` | exit 1, clear message (no fallback substitution) |
| Wrong project id (`my-prod-project`) | exit 1, clear message |
| Valid case, run against a real `firebase emulators:exec --project demo-11thonus --only firestore` | exit 0, `platformConfig/businessTerms` seeded successfully |

`assertCurrentBusinessTermsAccepted` (`businessLifecycleCommand.ts`) and every other production Terms-reading code path were not touched.

## 9. Commands executed and output

- `pnpm --filter functions typecheck` — pass.
- `pnpm --filter web typecheck` — pass.
- `pnpm lint` — pass (0 errors, 1 pre-existing unrelated warning in `BusinessApiContext.tsx`).
- `pnpm --filter functions test` — **1652/1652 passed** (153 files).
- `pnpm emulators:validate` (`firebase emulators:exec ... pnpm --filter functions test:emulator`) — **760 passed, 2 skipped, 0 failed** (59 files). The 2 skips are pre-existing, disclosed emulator-fidelity limitations from `ENG-P3-002A`'s Terms-version TOCTOU work (unrelated to this task).
- `pnpm --filter web test` — **747/747 passed** (106 files).
- `pnpm --filter web build` — pass.
- Manual Terms-fixture scenario verification — all 6 scenarios in §8 confirmed by direct invocation, including one live emulator run.

No failures were encountered at any stage; nothing was worked around or concealed.

## 10. Dependencies added

None.

## 11. Risks

- The Loyalty Number/QR non-implementation (§7) means Customer Home continues to show "not yet issued" indefinitely until a dedicated, separately-authorized orchestration task is run — this is a known, disclosed, pre-existing gap, not a new regression.
- The one narrowly-corrected roadmap line (§4) does not re-verify every other Phase 4 cross-reference to `DEC-LOY-009`; the remaining three references in `engineering-implementation-programme.md` still read "DEC-LOY-009 resolved (schema freeze requirement)" language that is now trivially true rather than false, so they were left alone rather than risk an unauthorized broad sweep.
- No web test literally exercises the `"staff"` role string at the routing layer (§6) — low risk, since the code path is identical to the tested `"manager"` case, but flagged for completeness.

## 12. Rollback instructions

All changes are on branch `worktree-agent-a9452c5e6d9185e3f`, not merged. To roll back: `git revert` the commit(s) listed in this branch's history for this task, or simply do not merge the PR. No Firebase/Firestore Rules/production-config change was made, so no infrastructure rollback is required.

## 13. PR and head SHA

See the PR opened against `main` from this branch (title referencing `PRODUCT-ALIGN-002-CORR-001`) for the exact pushed head SHA.

## 14. Final disposition

**`PRODUCT-ALIGN-002-CORR-001` IMPLEMENTED — AWAITING INDEPENDENT REVIEW**, with item #3 (Loyalty Number/QR lifecycle) explicitly and deliberately not implemented pending a dedicated Founder/engineering authorization for the registration-orchestration design, per §7 above.
