# PLATFORM-BASELINE-003 — Business Verification & Activation — Implementation Report

**Date:** 2026-09-12
**Authority:** `FD-BUS-ACT-001` (Founder, supplied in the task brief), recorded as `DEC-BUS-ACT-001` (CONFIRMED) in the Decision Register by this package.
**Note on record type:** this task's identifier (`PLATFORM-BASELINE-003`) is not a numbered `ENG-Pn-nnn` work package under the Engineering Implementation Programme, so no EIR was drafted against that template and no `engineering-implementation-programme.md` / `coding-agent-prompt-register.md` row was added — following the `PLATFORM-BASELINE-001`/`002` precedent. This report serves as the required `.md` change-tracking record.

## 1. Exact entry origin/main SHA

`902b254a66e42d7698af3d9f5e941419ac09f81d` (`origin/main` — the `PLATFORM-BASELINE-002` merge commit, verified current by `git fetch` immediately before branching; `main` had not moved).

## 2. Branch/worktree

Branch: `feat/platform-baseline-003-business-activation`, created from the entry SHA above in a dedicated, isolated git worktree outside the primary worktree (which holds unrelated in-progress legal/commercial work that was never touched, stashed, reset, rebased, cleaned, or committed).

## 3. Pre-change architecture analysis

- **Business aggregate** (`business/models/business.ts`): full TRD10 §10.6.3 shape; born `draft`; `ownerUserId` server-derived. Structural machine (`businessStatus.ts`): 8 statuses; `pending_verification → trial` exists structurally but no production path executed it (the lifecycle file documents the verification trigger as ungoverned-yet — now governed by `FD-BUS-ACT-001`).
- **Lifecycle writers (production, verified by grep):** `bootstrapBusiness` (draft), `submitBusinessForVerificationCommand` (draft→pending, Owner + in-tx Terms revalidation), `closeBusinessCommand` (→closed, Owner); profile/branch updates carry no status key. Nothing could reach `trial`.
- **Terms:** server-authoritative `platformConfig/businessTerms` doc + deterministic acceptance docs; in-transaction TOCTOU pattern with test hook (`getCurrentlyRequiredBusinessTermsVersionInTransaction`, `readBusinessTermsAcceptanceInTransaction`) — reused unchanged.
- **Platform administration:** `platformAdministrators/{userId}` records (`invited`/`active`/`suspended`/`removed`); only Knowledge Studio MVP roles activated (`FD-KS-1`); MFA requirement recorded and genuinely derivable (`deriveVerifiedMfaSatisfied` over the verified credential, populated by the token verifier from `sign_in_second_factor`). The Knowledge evaluator mandates MFA but is knowledge-permission-scoped — correctly not reused for Business.
- **Transports:** callable → whitelist parse → server-resolved actor → domain service; `toHttpsError` already maps `BusinessDomainError`/`AuthorizeAndExecuteError` to `business_command_failed` (no mapping change needed).
- **Idempotency:** reserve/complete/fail + duplicate/in_progress/conflict; lifecycle siblings return bare duplicate/in_progress outcomes.
- **`businessDocument` has no status-conditioned fields** — entering `trial` is a status flip only, so no trial metadata semantics are invented and `DEC-SUB-003` (OPEN_FOUNDER) is untouched.
- **DEC namespace:** no `DEC-BUS-*` record exists → `DEC-BUS-ACT-001` (mirrors `FD-BUS-ACT-001`; precedent: `DEC-CUST-ID-ART-001`), placed at the end of PRODUCT BEHAVIOR.
- **No STOP condition triggered** (see §4).

## 4. Fix strategy

No material contradiction or gap was found, so implementation proceeded (no STOP):

1. **Admin proof exists** — active `platformAdministrators` record + genuinely-verified MFA; no parallel administrator model invented.
2. **Separate platform model is used, Business RBAC untouched** — the command reads zero memberships/permissions and adds nothing to the ordinary catalogue; no role or permission invented (only Knowledge roles are activated; further role-scoping awaits its own Founder disposition — disclosed, not inferred).
3. **No trial metadata required** — status flip only; `DEC-SUB-003` unchanged.
4. New `activateBusinessAfterVerificationCommand` (fixed `trial` target; admin gate first in-tx; exact-status check; in-tx Terms revalidation via the exported shared helper; transition + lifecycle event with admin actor; executed/denied/duplicate/in_progress outcomes mirroring the sibling lifecycle contract).
5. New `handleActivateBusinessAfterVerification` endpoint composition (verify-once → server-resolved actor via pass-through verifier → derived MFA → command) and one callable (`activateBusinessAfterVerification`) with whitelist parsing; `index.ts` error mapping unchanged.

## 5. Exact Platform Administrator authorization mechanism reused

`platformAdministrators/{callerUserId}` record read via `transaction.get` inside the activation transaction (no evaluate-then-actuate gap), parsed by the existing `fromPlatformAdministratorDocument` converter, gated on the existing status vocabulary (`active`, mirroring `evaluateKnowledgePlatformPermission`'s and `discoverPlatformAdministrator`'s identical record+status test so the three cannot disagree) plus `verifiedMfaSatisfied === true` (the MFA boundary the privileged-action evaluator mandates). Collection constant and converter are existing repository exports; no new platformAdministration file, no vocabulary change, no role/permission invention.

## 6. MFA requirement and preservation

Privileged platform actions require server-verified MFA evidence today (`evaluateKnowledgePlatformPermission` denies on `MFA_NOT_ESTABLISHED`; `mfaRequired: true` records the requirement). The activation command requires `verifiedMfaSatisfied === true` for execution — an MFA-less administrator receives the same `denied` outcome as a non-administrator. The transport derives the value exclusively via `deriveVerifiedMfaSatisfied(verifiedCredential)` (never a persisted flag, never a client claim). Proven by denied-outcome tests for MFA-false credentials at both command and endpoint level.

## 7. Business lifecycle integration point

`transitionBusinessStatus(business, "trial", …)` (`ENG-P2-002A`, unchanged) inside the new command's own transaction — the first and only production caller of the `pending_verification → trial` structural edge. No state-machine change; no new status; no generic transition endpoint.

## 8. Exact activation preconditions

In-transaction, in order: (1) platform-administrator gate (denies before any Business/Terms read — no existence/status leakage); (2) Business exists (`businessNotFoundError`); (3) status exactly `pending_verification` (`invalidBusinessStatusTransitionError` otherwise — covers all 7 other states); (4) currently-required Terms version configured (`businessTermsConfigurationUnavailableError`); (5) current owner's acceptance of that exact version (`currentBusinessTermsNotAcceptedError` — covers never-accepted, older-version, and wrong-tuple uniformly). Acceptance is re-read at activation time, never inherited from submission.

## 9. Terms revalidation/TOCTOU implementation

Version read + acceptance read + status write share one transaction via the reused `assertCurrentBusinessTermsAccepted` (exported from `businessLifecycleCommand.ts`, behavior unchanged), so a concurrent Terms-version change forces Firestore optimistic-concurrency retry against the new version instead of committing on a stale read — the identical mechanism `submitBusinessForVerification` relies on. The `testOnlyAfterTermsVersionReadHook` seam is threaded through for determinism.

## 10. Verification-attestation implementation

MVP attestation = the authorized administrator's explicit activation action (per `FD-BUS-ACT-001`; no KYC/upload/registry/scoring/workflow built). It is recorded in the committed `business_lifecycle_changed` event (actor = admin userId, from `pending_verification`, to `trial`, timestamps, correlation/event ids). No new evidence schema (none required by existing authority); no second audit system; no Postgres outbox.

## 11. Idempotency strategy

Shared facility with operation type `business.activateAfterVerification`; request hash binds business + resolved administrator (same key + different request → `AuthorizeAndExecuteError` conflict, mirroring siblings). Same-key replay after success returns bare `{outcome: "duplicate"}` (sibling lifecycle convention — not result replay); concurrent same-key callers observe `in_progress`; concurrent different-key attempts commit at most one transition (loser fails on the re-read status). Denied outcomes complete their key (replay → duplicate), matching `authorizeAndExecute`.

## 12. Event/audit behavior

Single `business_lifecycle_changed` event per executed activation (actor/ids/statuses/timestamps/correlation), written in the same transaction via the existing outbox writer. Exactly-once per activation proven by count assertions across replay/race tests. Denials write nothing.

## 13. Transport boundary

`activateBusinessAfterVerification` callable: whitelist parser (`rawToken`/`referenceType`/`businessId`/`idempotencyKey` only — `adminUserId`/`role`/`targetStatus` structurally undeliverable), verified credential → server-resolved actor → derived MFA → command; returns the command outcome unchanged. Existing App Check/transport protections retained; no public ordinary-Business activation endpoint; no `toHttpsError` change.

## 14. Files modified

Added (5): `business/services/businessActivationCommand.ts` (+ emulator test), `business/services/businessActivationEndpointService.ts` (+ unit test, + emulator test).

Modified (6): `business/services/businessLifecycleCommand.ts` (export one helper), `functions/src/index.ts` (callable), `eslint.config.js` (precedented exemptions), `decision-register.md`, `documentation-changes-log.md`, this report.

No file outside these was touched.

## 15. Code diff summary

See §4. Net: one fixed-target command, one endpoint composition, one callable, three test files, two error-path reuses, one helper export, governance records. No catalogue/role/permission/schema/index/dependency/config change.

## 16. Tests added

- `businessActivationCommand.emulator.test.ts` (27 tests + 1 disclosed skip): happy path; 11-case authorization matrix (owner/manager/staff/customer/unknown/ghost-business/suspended/invited/MFA-less/malformed, incl. no-leakage denial); 7-state lifecycle matrix; missing business; missing/unaccepted/stale Terms; fresh acceptance; same-key replay/conflict; concurrent activation; fresh-key-on-trial.
- `businessActivationEndpointService.test.ts` (4 unit tests, mocked seams).
- `businessActivationEndpointService.emulator.test.ts` (4 tests: MFA happy path, MFA-false denial, unverifiable token, spoofed-field resistance).

## 17. Authorization test results

All pass: authorized admin+MFA executes; owner/manager/staff/customer/unknown callers denied with zero state change; suspended/invited/malformed admins denied; MFA-less admin denied; unauthenticated caller throws before the command; spoofed `adminUserId`/`role`/`targetStatus` fields confer nothing.

## 18. Lifecycle/precondition test results

All pass: `pending_verification → trial` executes; all 7 other states throw `INVALID_STATE_TRANSITION` with no mutation; missing business/config/acceptance fail closed with the governed categories; stale acceptance fails until current Terms are accepted. Terms-version race: the mid-transaction interleaving proof is **not producible** against the local Firestore Emulator (same disclosed standing as the `submit`/`accept` TOCTOU disclosures — recorded as an explicit `it.skip` with rationale, not a passing claim); enforce-current-value behavior IS proven by the stale/fresh acceptance tests, and the in-transaction `transaction.get()` read shape is code-evident.

## 19. Emulator results

Full suite: **64 files passed, 822 tests passed, 3 skipped, 0 failed** (run with firestore 8180/auth 9299 alternate-port config — port 8080 was held by another session's unrelated emulator; same suites and assertions as canonical `emulators:validate`).

## 20. Unit/full regression results

- `pnpm --filter functions run test`: **158 files / 1709 tests passed**.
- `pnpm run lint`: 0 errors (1 pre-existing unrelated `apps/web` warning); `format:check`: clean; `typecheck` (all workspaces): clean; `pnpm run build`: clean.

## 21. PostgreSQL regression result

`PLATFORM_ENV=test pnpm --filter functions test:postgres` (disposable Postgres 16, `--wait`, torn down `-v`): **3 files / 23 tests passed** — no cross-foundation regression (no Postgres code touched).

## 22. Playwright/build results

`pnpm run build`: clean (functions + web). Playwright E2E (`pnpm test:e2e`): **32 passed** — the new callable adds no UI surface and no existing flow changes; canonical CI re-runs the full E2E suite on the PR head (see §23).

## 23. Exact-head CI run/result

_To be recorded after the PR is opened and exact-head CI completes._

## 24. Automated/manual review findings and disposition

_To be recorded after review._

## 25. Dependencies added

None. No lockfile change.

## 26. Config changes

None (no CI, deployment, secret, Firebase, or Rules change; `eslint.config.js` exemption entries only).

## 27. Persistence/schema/index changes

None: no new collection/field/index; no PostgreSQL table; no dual-write. Reuses `businesses`, `platformAdministrators`, `platformConfig/businessTerms`, `businessTermsAcceptances`, `idempotencyRecords`, `outboxEntries`.

## 28. Governance changes

`decision-register.md`: added `DEC-BUS-ACT-001` (CONFIRMED, Founder, 2026-09-12, `FD-BUS-ACT-001` quoted verbatim) at the end of PRODUCT BEHAVIOR; summary CONFIRMED 48→49, Total 108→109. `documentation-changes-log.md`: Entry 213. No other governance touched; no historical decision renumbered or rewritten; `DEC-SUB-003`/`DEC-LEGAL-002`/all `DEC-SUB-*` unchanged.

## 29. Risks

- Authority breadth (disclosed): until a Founder disposition activates a business-operations administrator role, any active platform administrator with verified MFA can activate. No Business-RBAC confusion is possible (memberships never consulted), but role-narrowing remains future governance.
- Denied attempts complete their idempotency key (sibling convention): a denied key replays as `duplicate`, never as a second evaluation.
- Sign-in/session and read paths are untouched: no implicit activation exists anywhere.

## 30. Known limitations

- No admin UI in this package (backend authority only; a minimal surface awaits a bounded follow-up if needed for end-to-end operation proof).
- No direct callable for `transitionCustomerIdentityStatus`-style generic business transitions (unchanged).
- Mid-transaction Terms-race interleaving not reproducible on the local emulator (disclosed skip; same standing as the submit/accept disclosures).

## 31. Rollback instructions

`git revert` the PR merge (or drop the branch / do not merge). No dependency, schema, index, secret, or config change to unwind; disposable Postgres/Emulator instances already torn down.

## 32. PR number

_To be recorded after opening._

## 33. Exact PR head SHA

_To be recorded after opening._

## 34. Markdown implementation report

This document.

## 35. `.md` tracking/change record

This document (same `PLATFORM-BASELINE-001`/`002` precedent: the report is the tracking record; no `ENG-Pn` retrofit).
