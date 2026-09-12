# PLATFORM-BASELINE-004A — Workforce Integration Completion — Implementation Report

**Date:** 2026-09-12
**Authority:** canonical workforce domain authority (`ENG-P2-003B`/`003C`/`003D`, `ENG-P2-004A`/`004C`/`004D`, `ENG-P3-002A`, Founder disposition `FD-P3-002-G-001`) — no new Founder decision required or created (§23; this package integrates existing valid work).
**Note on record type:** this task's identifier (`PLATFORM-BASELINE-004A`) is not a numbered `ENG-Pn-nnn` work package under the Engineering Implementation Programme, so no programme/register row was added — following the `PLATFORM-BASELINE-001`/`002`/`003` precedent. This report serves as the required `.md` change-tracking record, plus Entry 214 in the Documentation Changes Log.

## 1. Exact entry origin/main SHA

`6d2446c918f293270bb173a18582bcd80c97d431` (`origin/main`, the `PLATFORM-BASELINE-003` merge — PR #248; verified current by `git fetch origin main` immediately before branching; `main` had not moved from the task's expected SHA).

## 2. Branch/worktree

Branch: `feat/platform-baseline-004a-workforce-integration`, created from the entry SHA above in a dedicated, isolated git worktree (`/tmp/11thonus-pb004a`). The primary worktree (holding unrelated in-progress `DEC-LEGAL-002` work) was never touched, stashed, reset, rebased, cleaned, or committed.

## 3. Pre-change codebase analysis

- **Workforce domain lives in `functions/src/domains/permissions/`** (no `*workforce*` files exist; staff is the permissions domain). All four target operations exist as complete, tested domain operations with zero transport exposure beyond create/revoke/list:
  - `acceptStaffInvitation` (`service/acceptStaffInvitationService.ts`) — self-service ACCEPT, invitation-is-authority, verified-contact entitlement; no callable.
  - `changeStaffMembershipRoleCommand` (`service/staffRoleChangeCommand.ts`) — `staff.assignRole` (Owner-only, non-delegable), TOCTOU `fromRole` re-check, override reconciliation; no callable.
  - `suspend/reactivate/removeStaffMembershipCommand` (`service/staffMembershipLifecycleCommand.ts`) — `staff.manage`, target policy, closed lifecycle table, cross-business isolation; no callable.
  - `administerStaffPermissionOverrideCommand` (`service/staffPermissionOverrideCommand.ts`) — `staff.assignPermissions`, sensitive-only, FD-003D-1/2; no callable.
- **Existing transport** (`functions/src/index.ts`, 23 `onCall`s): only `createStaffInvitation`, `revokeStaffInvitation`, `listStaffInvitations`, `listStaffMemberships`. No `acceptStaffInvitation`, lifecycle, role-change, or override export; no corresponding whitelist parser.
- **Actor resolution:** every callable resolves the actor server-side via `resolveAuthenticatedBusinessActor` (verified token → credential → eligible Customer Identity). Nothing uses `request.auth`; no client `userId` field exists anywhere in the new surface.
- **Permissions:** roles `owner/manager/staff`; invitation roles `manager/staff` (owner structurally excluded); evaluator `evaluatePermission` (pure) + `authorizeAndExecute` (transactional gate + idempotency + mandatory sensitive-decision audit + outbox).
- **State machines:** invitation `pending → accepted/revoked/expired` (pending sole non-terminal, lazy expiry); membership `active ↔ suspended`, `active/suspended → removed` (terminal; re-join only via fresh accept reactivating the same doc in place).
- **Sensitive catalogue:** 8 entries; `staff.manage`/`staff.assignPermissions` owner-only/grantable-to-manager; `staff.assignRole` owner-only **non-delegable** (`explicitGrantEligibleRole: null`).
- **Audit/outbox:** every command writes domain events atomically via `writeOutboxEntry`; sensitive decisions audited via `recordSensitiveDecision` (read-guarded, idempotent).
- **Idempotency:** `checkAndReserve`/`complete`/`fail` + `completeIdempotencyKeyInTransaction` (the `PLATFORM-BASELINE-003-CORR-001` transaction-scoped helper).
- **Team UI** (`TeamManagementPage.tsx`): invite + revoke only (header explicitly documented the missing callables); no per-member controls. `AccessibleBusinessSummary` already carries the viewer's live `role` per business — the UI role gate needs no backend change.
- **Invitation reference IS the document id** (`mintInvitationReference = doc().id`, ~120-bit); `listStaffInvitations` already returns it as `invitationId` to authorized members — the accept link is built from already-exposed data.
- **No STOP condition triggered:** the assessment was confirmed accurate by canonical code; no material architecture/authority contradiction found.

## 4. Fix/integration strategy

Pure integration package — zero domain-logic rebuild:

1. Correct `acceptStaffInvitation`'s post-commit idempotency gap narrowly (Class B → atomic completion, same helper as PB003-CORR-001) with emulator-backed regression proof.
2. Expose five callables reusing existing conventions exactly (whitelist parser → server-resolved actor → domain command → existing error taxonomy): `acceptStaffInvitation`, `suspend/reactivate/removeStaffMembership`, `changeStaffMembershipRole`.
3. Classify (do not silently refactor) the `authorizeAndExecute`-wrapped operations' shared post-commit pattern; correct nothing there (shared wrapper with already-live commands — out of scope by the task's own stop-rule); report precisely.
4. Intentionally NOT expose `staffPermissionOverrideCommand` (evidence-led §6 decision — see §9).
5. Web: adapters + hooks following existing TanStack Query/idempotency-holder conventions; Team controls gated on the viewer's live role from `useAccessibleBusinessesQuery`; standalone `/invitations/:invitationReference/accept` route; EN/FR keys with parity.
6. No fixture, no Terms/legal change, no branch change, no loyalty work, no Firestore Rules change, no new roles, no PostgreSQL change.

## 5. Existing workforce capabilities preserved

Every existing command/service is byte-for-byte authoritative except the single atomic-completion staging inside `acceptStaffInvitation` (see §15). No signature change, no authority change, no new role/state/transition, no catalogue change, no evaluator change. All pre-existing workforce unit/emulator suites pass unmodified (full runs §20–§22).

## 6. Invitation-acceptance integration

- New `acceptStaffInvitation` callable: whitelist parser accepts **only** `invitationReference`; actor id from `resolveAuthenticatedBusinessActor` only; `authenticatedCustomerIdentityId: userId` (never request input); role/business from the authoritative invitation; expiry/revocation/used-state/entitlement behavior untouched; wire result normalizes `acceptedAt` to ISO string.
- New `AcceptStaffInvitationPage` at `/invitations/:invitationReference/accept` (auth-gated): explicit accept action (no auto-fire), pending/success (with governed dashboard link to the server-bound business)/localized-error/missing-reference states.
- Team page gained a per-pending-invitation "Copy invitation link" affordance (the only channel for the bearer reference absent email/SMS infra; built from the already-exposed `invitationId`).

## 7. Role-change integration

- New `changeStaffMembershipRole` callable: whitelist `{businessId, targetMembershipId, fromRole, toRole}`; closed `manager/staff` vocabulary enforced at transport (`owner` structurally rejected); server command remains authority (TOCTOU `fromRole` re-check + override reconciliation intact); server-built deterministic `requestHash` (action+actor+business+target+transition).
- Team UI (Owner viewers only — `staff.assignRole` is non-delegable): per-row "New role" select (`staff`/`manager`) + apply on active non-owner rows. Never rendered for Manager/Staff viewers or on Owner rows.

## 8. Membership lifecycle integration

- New `suspend/reactivate/removeStaffMembership` callables: whitelist `{businessId, targetMembershipId}`; server-built deterministic `requestHash` per action; `authorizeAndExecute` envelope returned unchanged for the shared `unwrapMutationResult` path.
- Team UI: Owner viewers see Suspend/Remove (active rows), Reactivate/Remove (suspended rows), nothing on removed (terminal) or Owner rows. Manager viewers see Suspend/Remove/Reactivate on **Staff rows only** (Manager→manager targets never permitted, so no control renders). Suspend/Remove require inline confirmation (mirrors revoke); Reactivate is direct. All denials surface through the existing localized `errors.*` catalog.

## 9. Permission-override decision and evidence — PRESERVED, INTENTIONALLY UNEXPOSED

The backend capability (`administerStaffPermissionOverrideCommand`, Owner-default/`staff.assignPermissions`, sensitive-only, FD-003D-1 current-config semantics, FD-003D-2 target-status gates, full emulator coverage) is preserved byte-for-byte and remains reachable to future authorized work — but NO callable, adapter, hook, or UI was added, because:

1. No Founder disposition authorizes a user-facing override-management capability at MVP (searched: `FD-P3-002-G-001` covers displayName/email-display only; Team Stitch mockups per the Team page header authorize no override surface; nothing in the PB004 brief's cited authorities does either).
2. A safe override UI would require product authority this package must not invent: which of the 8 sensitive permissions to surface, grant-vs-revoke staging rules (esp. the suspended-target grant ban), and the non-delegable `staff.assignRole` exclusion.
3. The task (§6) explicitly permits this outcome when product authority does not clearly require the UI.

This is a determination under existing authority, not a new decision; no decision-register change was made.

## 10. Callable/API additions

`functions/src/index.ts`: `acceptStaffInvitation`, `suspendStaffMembership`, `reactivateStaffMembership`, `removeStaffMembership`, `changeStaffMembershipRole` (+ `parseAcceptStaffInvitationRequest`, `parseStaffMembershipLifecycleRequest`, `parseChangeStaffMembershipRoleRequest`, `staffMembershipRequestHash`). Error mapping unchanged (`PermissionDomainError → staff_command_failed`; `AuthorizeAndExecuteError → business_command_failed`). Web `business/api/staffMembershipMutations.ts`: `toCall/makeCall` adapters for all five (envelope unwrap for lifecycle/role; direct wire result for accept).

## 11. Web integration

- Hooks (`businessMutations.ts`): `useAcceptStaffInvitationMutation` (self-service; invalidates `accessible` + per-business staff lists), `useSuspend/Reactivate/Remove/ChangeRole` (per-business; invalidate memberships). Same `IdempotencyKeyHolder` + `settleKeyOnError` conventions.
- Team page renders controls from live role data; server authorization remains mandatory (every action re-authorized; UI states are convenience).
- Dev dashboard harness seeds the viewer as Owner (dev-only, zero-network) so Founder-QA sees the operational surface.
- No dashboard redesign, no new application, no route-status gating change.

## 12. Actor/authentication boundary

Unchanged provider-independent boundary: `rawToken + referenceType` → `firebaseAdminTokenVerifier` → `resolveAuthenticatedCredential` → eligible Customer Identity. All five callables use `resolveAuthenticatedBusinessActor` exactly like the four existing staff callables. No Firebase UID as domain identity, no provider change, no MFA change, no client claims as authority (parsers structurally exclude actor fields — proven by mass-assignment tests).

## 13. Authorization behavior (server-side, proven)

Owner authority unchanged; Manager cannot perform Owner-only operations (`staff.assignRole` deny → `auth_forbidden`; Manager→manager lifecycle targets denied by `isPermittedStaffManagementTarget`); staff cannot self-escalate (self-actions denied; Owner rows never actionable); cross-business actions denied (`membershipCrossBusinessMismatchError` — membership id alone is never authority); invitation acceptance binds to the invitation's business and role only (wrong-actor denied by entitlement; reference alone insufficient); removed/suspended memberships cannot operate (evaluator membership gate + `assertActiveMembership` — proven: suspended member loses list access); ordinary customers cannot invoke workforce admin (no membership → deny). Client-supplied role/business/actor fields fail closed (parsers drop them; domain re-derives all authority).

## 14. Idempotency assessment per newly exposed operation

- `acceptStaffInvitation`: **B** (affected by the known shared pattern) → corrected narrowly (see §15).
- `suspend/reactivate/removeStaffMembership`, `changeStaffMembershipRole` (via `authorizeAndExecute`): **B** — the wrapper reserves outside, runs the domain transaction, then completes outside; a post-commit completion failure would mark the key `failed` (retryable) while the domain mutation stands, and a same-key retry would then fail closed against the already-transitioned target (e.g. `INVALID_STATE_TRANSITION` on an already-suspended membership) instead of reporting duplicate. **Not corrected**: the completion lives in the shared `authorizeAndExecute` wrapper also serving the already-live `create/revoke` commands — changing it alters shipped behavior outside this package, which the task's stop-rule forbids. Documented as a known limitation (§34) with exact retry semantics; no broad redesign undertaken.
- Reads (`listStaffInvitations/listStaffMemberships`): **C** (not applicable — no idempotency keys).
- Pre-existing `create/revoke` via the same wrapper: unchanged (out of scope; same Class B note applies as background, not as a new finding).

## 15. Idempotency correction (accept only)

`acceptStaffInvitationService.ts`: the successful idempotency completion is now staged with `completeIdempotencyKeyInTransaction` inside the acceptance transaction alongside membership creation, invitation consumption, and outbox evidence (four commit/abort together); the post-commit `completeIdempotencyKey` call is removed (a committed success can no longer reach the `catch` → `failIdempotencyKey` path); fail-closed paths unchanged (still retryable). Added a transport-never-supplied `testOnlyBeforeCommitHook` (mirrors PB003-CORR-001's seam). Regression tests: atomic joint commit; same-key retry replays stored success (no second membership, no `INVITATION_ALREADY_ACCEPTED`); forced pre-commit abort leaves nothing durable with the key retryable, and a corrected retry succeeds.

## 16. Audit/event behavior

Preserved exactly: `StaffInvitationAccepted` + `StaffMembershipActivated` (accept), `StaffMembershipSuspended/Reactivated/Removed`, `StaffRoleChanged` (with `overridesRemoved`), lazy-expiry `StaffInvitationExpired` — all still written atomically in their command transactions; mandatory sensitive-decision audit via `recordSensitiveDecision` untouched. New emulator assertions confirm outbox presence through the corrected atomic path.

## 17. Files modified

- `functions/src/domains/permissions/service/acceptStaffInvitationService.ts` (+53/−13: atomic completion + hook + doc)
- `functions/src/index.ts` (+258: 5 callables, 3 parsers, 1 hash builder, 3 imports)
- `functions/src/index.test.ts` (+144: 3 parser suites + hash-scoping suite)
- `apps/web/src/App.tsx` (+9: accept route)
- `apps/web/src/business/dashboard/TeamManagementPage.tsx` (+339/−46: role/lifecycle controls, confirms, copy-link, suspended/removed roster)
- `apps/web/src/business/hooks/businessMutations.ts` (+108: 5 hooks)
- `apps/web/src/dev/dashboardHarness/DashboardHarnessPage.tsx` (+19: Owner accessible seed)
- `apps/web/src/i18n/locales/en.ts` (+26), `fr.ts` (+28): `teamManagement` lifecycle/role/copy keys + `invitationAccept` section, parity-checked by `i18n.test.tsx`
- `apps/web/src/business/dashboard/TeamManagementPage.test.tsx`, `BusinessDashboardRoutes.test.tsx` (+28 total: additive hook mocks, defaults render no controls)
- `tests/e2e/dashboard-team-harness.spec.ts` (+4/−1: exact-match Role scoping after the new per-row "New role" selects)
- `docs/00-governance/documentation-changes-log.md` (Entry 214)

New files: `acceptStaffInvitationIdempotency.emulator.test.ts`; `business/api/staffMembershipMutations.ts` (+ adapter tests); `business/dashboard/TeamManagementPage.workforce.test.tsx`; `business/invitations/AcceptStaffInvitationPage.tsx` (+ tests); `tests/e2e/dashboard-team-admin-harness.spec.ts`; this report.

## 18. Code diff summary

+970/−46 across 12 tracked files plus 8 new files. No domain-model, catalogue, evaluator, rules, migration, config, or dependency change. No DEC-LEGAL-002 file touched (verified by diff path list). No loyalty-domain file touched.

## 19. Tests added

- Functions: 7 parser/hash unit tests (`index.test.ts`); 3 atomic-idempotency emulator tests (new file).
- Web RTL: 9 Team workforce tests (role-gated controls, confirms, role vocabulary, leakage absence, denied mapping, copy-link, FR parity); 5 accept-flow tests (idle/pending/success+dashboard-link/error-mapping/FR).
- Web adapters: 7 mutation-adapter tests (passthrough, envelope unwrap, denied→`BusinessApiError`).
- Playwright harness: 5 new specs (owner controls, owner-row exclusion, suspend confirm gate, copy-link presence, overflow + 44px targets with controls rendered).

## 20. Functions/unit results

`pnpm --filter functions test`: **158 files, 1718 tests, all pass** (includes 33 `index.test.ts` incl. 7 new). Typecheck clean. (Full `pnpm test` root runner also covers web.)

## 21. Web/RTL results

`pnpm --filter web exec vitest run`: **109 files, 769 tests, all pass** (includes 14 new RTL + 7 adapter tests; `i18n.test.tsx` parity green). Typecheck clean.

## 22. Emulator results

Full Firebase Emulator validation (`firebase emulators:exec --project demo-11thonus "pnpm --filter functions test:emulator"`, Firestore+Auth): **65 files, 833 passed, 3 skipped (pre-existing disclosed skips), 0 failed**. Note: an earlier full run showed 1 failure that did not reproduce in isolation or in the clean re-run (cold-emulator/first-file flake; documented §26). Emulators were run on alternate ports (8085/9098) via a temp config because foreign sessions hold the standard ports (see §34) — same suite, same project, same rules.

## 23. PostgreSQL regression

`pnpm test:postgres` (Docker daemon via bundled CLI): **3 files, 23 tests, all pass**. Expected — the package touches no PostgreSQL surface (Firestore authority preserved; no dual writes).

## 24. Build/Playwright results

- `pnpm build`: exit 0 (functions + web; only the pre-existing chunk-size warning).
- Playwright harness project (`chromium-dashboard-harness`): **14/14 pass** (9 pre-existing incl. overflow/EN-FR + 5 new admin specs).
- Emulator-backed Playwright (`chromium-emulator-e2e`): not executed locally — the suite hardcodes standard emulator ports (8080/9099 in app config) currently held by foreign sessions (§34); no new emulator-e2e spec was added for the same reason (an unexecutable test would be unverifiable). Real-browser proof is carried by the harness specs + RTL; existing emulator-e2e specs run in CI (§25).
- `pnpm lint`: 0 errors (1 pre-existing `react-refresh` warning in untouched `BusinessApiContext.tsx`). `pnpm format:check`: clean.

## 25. Exact-head CI run/result

Canonical GitHub CI runs on the PR head (see §36–§37). Local exact-head results above; CI result to be recorded by the independent reviewer — this package is not self-approved and not merged.

## 26. Automated/manual review findings (self-review, corrected before PR)

1. Per-row Role selects initially shared the invite form's "Role" label and duplicated select ids → renamed to a distinct `teamManagement.newRoleLabel` ("New role"/"Nouveau rôle") with per-membership ids; existing harness spec scoped with `{ exact: true }`. RTL + Playwright updated.
2. jsdom `navigator.clipboard` stub is not observed through `userEvent.click` dispatch (empirically: handler sees a different `navigator` object; `fireEvent` works) — copy-link test uses `fireEvent` with an explanatory comment; component code (standard ambient clipboard + silent catch) unchanged.
3. One full-suite emulator run showed a single non-reproducing failure (cold-start flake); clean re-run 833/0. Both runs reported honestly; no code changed between them.
4. `staffMembershipIntegration` SCENARIO 5 was verified green alone and in groupings with these changes (initial grouped failure traced to stale-emulator cross-talk from a lingering process, not to the correction).

## 27. Dependencies

None added, none changed, none removed.

## 28. Config changes

None (no Firebase config, no env, no rules, no indexes; temp alternate-port emulator config lived in `/tmp` only and is not in the repo).

## 29. Persistence/schema/index changes

None. No new collections; no document-shape change; no index change (all invitation queries remain equality-only on automatic single-field indexes).

## 30. Governance/change-tracking changes

No decision-register change (no new decision required or created, §23). No programme/register-row change (not an `ENG-Pn-nnn` package). This report + Documentation Changes Log Entry 214 are the change record.

## 31. Localisation changes

`business.teamManagement`: `statusSuspended/statusRemoved`, `suspend/reactivate/remove`, confirm bodies/actions, `changeRoleAction`, `newRoleLabel`, `copyInviteLink/inviteLinkCopied`. New `business.invitationAccept` section (title/description/accept/accepting/success/openDashboard/missing-reference). Full EN/FR semantic parity; no hardcoded user-facing strings; parity enforced by `i18n.test.tsx` (green).

## 32. Local Founder-preview behavior

No `004B`, no fixture, no special activation architecture. Against `pnpm emulators` the real flow works in permitted states (workforce admin is eligible from `draft` per CORR-003): owner invites from Team → copies invitation link → second local account (verified contact matching the target) opens `/invitations/:ref/accept` → accepts → appears in Team; suspend/reactivate/remove/role-change operate from the same surface. The dev dashboard harness renders the Team surface as Owner (inert callables; visibility/layout only).

## 33. Risks

1. Class B post-commit pattern remains in `authorizeAndExecute` (shared with live create/revoke) — a same-key retry after an ambiguous completion failure reports a fail-closed domain error rather than duplicate (§14/§34). Deliberately uncorrected per the task's stop-rule.
2. Emulator-backed Playwright e2e for the two-user flow was not added or run locally (port conflict, §34) — CI covers existing emulator-e2e regression; the new flow's e2e remains a future addition once ports are free.
3. Manager viewers cannot visually identify their own row (DTOs deliberately carry no `userId`) — mitigated structurally: no controls render on any row a Manager must not touch (manager/owner rows), and server denies any residual self-action attempt.

## 34. Known limitations

1. Permission-override administration: backend preserved, intentionally unexposed (§9).
2. `authorizeAndExecute` idempotency: reported, not refactored (§14).
3. Manager-viewer Team UI covers lifecycle-on-staff only (role visibility cannot distinguish finer cases without new backend readout — none added by design).
4. Local validation used alternate emulator ports (foreign sessions hold 8080/9099: an unrelated tiizi_revamp Firestore emulator and an unknown `--only auth` instance; neither was touched).
5. `test:e2e:emulator` (chromium-emulator-e2e) not run locally for the reason above; `emulators:validate` (the canonical gate) fully run.

## 35. Rollback instructions

Revert the PR branch merge (single PR, no migration, no config, no data-shape change). Deployed functions return to four staff callables; web returns to invite/revoke-only Team UI plus an unreachable-then-removed accept route. In-flight idempotency records from the corrected accept path remain valid under the old code (same record shape; old code completes post-commit). No data repair needed.

## 36. PR number

To be filled on push (see §37).

## 37. Exact PR head

To be filled on push.

## 38. Markdown implementation report

This document.

## 39. .md tracking/change record

This document + Documentation Changes Log Entry 214.

---

**Disposition: PLATFORM-BASELINE-004A — IMPLEMENTED / AWAITING INDEPENDENT REVIEW. Not self-approved. Not merged. Reward Program not started.**
