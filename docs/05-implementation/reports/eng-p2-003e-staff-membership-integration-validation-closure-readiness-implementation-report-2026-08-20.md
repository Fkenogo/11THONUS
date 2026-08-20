# ENG-P2-003E — Staff Membership Integration, End-to-End Validation & Closure Readiness

Implementation report — 2026-08-20

## 1. Entry origin/main SHA

`origin/main` @ `4654cf2` (PR #137, ENG-P2-003D closure-sync merge; parent `6ed0802`, PR #136, ENG-P2-003D runtime merge). Confirmed by direct `git fetch origin` + `git rev-parse origin/main` — matches the Founder-reported state exactly.

## 2. Worktree / branch

`/Users/theo/11THONUS-eng-p2-003e`, branch `feat/eng-p2-003e-staff-integration-validation`, created fresh from `origin/main`. `/Users/theo/11THONUS` (primary worktree) left untouched throughout.

## 3. Prerequisite verification

- ENG-P2-003A (PR #132), 003B (`b0277bf`), 003C (PR #135), 003D (PR #136 + #137) all present in `origin/main` history, each with a corresponding closure-sync docs commit.
- ENG-P2-004 / CORR-001 / CORR-002 present and unchanged since their own merges.
- No ENG-P2-003E work existed anywhere before this task: no branch, no PR, no worktree (`git branch -r`, `gh pr list --state open` both checked). Only unrelated open PR is #34 (DEC-SEC-001, different concern).
- Capability 3 confirmed still `Open — partially implemented; not closed` (no closure doc found asserting otherwise).

## 4. Reconstructed ENG-P2-003 acceptance scope

Independently reconstructed from `docs/05-implementation/roadmap/ENG-P2-003-DESIGN-001-staff-membership-identity-architecture.md` v1.1 (§§3–29), the four packages' own implementation reports, and current source — not from trusting prior closure-report summaries as authority.

**What the concern delivers:** Staff is not a second identity type — it's an existing Customer Identity plus a `businessMemberships/{id}` binding (role, status, permission overrides) per `DEC-ID-002`/`DEC-ID-003`. Full lifecycle: invite → accept → active → suspend/reactivate → remove (terminal, no hard deletes, Owner-floor protected); a structurally separate invitation record with its own `pending → accepted/revoked/expired` lifecycle; `staff.manage`-governed lifecycle administration with FD-5-STAFF's target-restriction matrix; `staff.assignRole`-governed Staff↔Manager role change (Owner-only, non-delegable); `staff.assignPermissions`-governed override grant/revoke administration consuming ENG-P2-004A's evaluator unmodified; cross-business scoping on every command.

**Proven per-package (not re-derived here — see each package's own report):** 003A (26 tests, pure contracts), 003B (32 tests, invitation persistence + accept transaction, 3 defects found/fixed in its own review), 003C (51 tests, lifecycle + role-change, TOCTOU-safe), 003D (40 tests, override grant/revoke, full status-matrix + replacement-semantics proofs).

**The 003E gap (per design §22/§23):** no existing test ran the full chain end-to-end — each package seeds its own starting state directly rather than reaching it through the prior package's command. §23's own readiness matrix explicitly gates 003E on all four reaching Complete, and defines its job as "cross-package validation, events wiring via the shared outbox, full-suite regression, concern-completion reporting."

**Explicitly deferred (with citations):** frontend/UI (§3.2, §19), shared-device (`DEC-SEC-003`, FD-7-STAFF, §28), subscription staff-count limits (`DEC-SUB-002`, §28/§16.1, non-blocking placeholder disclosed), customer phone lookup (`DEC-ID-004`, §28/§16.2, out of scope), ownership transfer (§11.4, FD-6-STAFF), callable/HTTPS endpoint exposure (disclosed non-blocking by 003B §38, reconfirmed current in this task — see §23 below).

## 5. Pre-change strategy

Presented to the Founder before any code was written (per Phase B/H's explicit instruction): build a real Firestore-emulator integration suite exercising the full command chain, empirically resolve the Phase H demote→repromote override-reactivation question without assuming an answer, and treat any discovered architecture gap as a STOP-and-report item rather than something to silently fix. The Founder directed: proceed with the empirical Phase H test, record any adverse finding as unresolved (do not classify ENG-P2-003 as closure-ready while it's open), and record the callable/HTTPS absence in the acceptance matrix without building endpoints.

## 6–9. Staff / Manager / role-change / permission-override journeys

All four full command-chain journeys were built as real Firestore-emulator integration tests (not pre-seeded fixtures) in `functions/src/domains/permissions/service/staffMembershipIntegration.emulator.test.ts` and independently re-run by me after a review pass corrected six defects the reviewer found (see §41–42). Final state: **18/18 passing**, verified directly, not taken on the sub-agent's word.

- **Staff journey:** invite → accept → suspend → reactivate → remove → re-invite reactivates the same document in place. Exactly one `(userId, businessId)` membership document throughout.
- **Manager journey:** Manager without `staff.manage` denied invite/suspend/reactivate/remove. Manager with an explicit `staff.manage` grant may invite/suspend/reactivate/remove Staff, but is rejected targeting a Manager or the Owner, and gains zero role-change authority merely from holding `staff.manage`.
- **Role-change journey:** Owner changes Staff↔Manager. Manager and Staff both denied `staff.assignRole`. Self-target and Owner-target both rejected. `role: "owner"` is not a constructible value (verified via a genuine async-rejection assertion, corrected during review — see §41 finding 1).
- **Permission-override journey:** grant → evaluator allows → revoke → evaluator denies; same-direction replay stays a single record; suspended membership can revoke but not grant (`INVALID_STATE_TRANSITION`); removed membership cannot administer (thrown); a pending invitation is structurally inadministrable (no membership document exists yet to target).

## 10. Role-change/override reactivation analysis — Phase H (the priority finding)

**Empirically proven, not assumed:** grant a Manager-eligible override to a Manager → evaluator allows (`permissionSource: "explicit-grant"`) → Owner demotes Manager→Staff → override record persists untouched in storage (confirmed via raw document read, `permissions[].length === 1`) → evaluator denies (live-role check no longer matches) → Owner promotes Staff→Manager → **the still-stored grant becomes effective again automatically** — evaluator allows, `permissionSource: "explicit-grant"`, no cleanup ever occurred to `permissions[]`.

This matches `staffRoleChangeCommand.ts`'s own doc comment ("a stale override is automatically no longer honored the moment the role changes — no cleanup required here") and `evaluatePermission.ts` Step 7, which re-checks live-role eligibility on every call in both directions, not just the demotion direction the doc comment describes.

**Disposition: unresolved security/policy finding, per the Founder's explicit instruction.** The mechanism's behavior is now proven rather than inferred, but no document anywhere states whether "a stale grant silently reactivating on a role round-trip, with no new authorization event" is acceptable. **ENG-P2-003 is NOT classified as closure-ready while this remains open** — a fresh Founder disposition (analogous to FD-003D-1/2) is needed to either (a) accept this as intended and record it, or (b) direct role-change to clear/require re-confirmation of overrides whose eligible role changes.

## 11. Invitation terminality

Proven: `pending→accepted`, `pending→revoked`, `pending→expired` are each single-use; accepted cannot accept again; revoked cannot accept or be revoked again (`INVALID_STATE_TRANSITION`); expired cannot accept (`RESOURCE_NOT_FOUND`, pinned during review — see §41 finding 5); reissue mints a new invitation id for the same delivery target.

## 12. Invitation/membership atomicity

Proven: role derives from the invitation's own authoritative `role` field, never a client-controllable field; a failed acceptance (unknown/wrong identity) leaves the invitation `pending` with zero membership documents created; accepting business A's invitation reference creates no membership document under business B (test corrected during review to actually check this — see §41 finding 2).

## 13. Identity-authority result

Proven adversarially: wrong authenticated person accepting → `AUTH_FORBIDDEN`; unknown/malformed reference → `RESOURCE_NOT_FOUND`; no distinguishing behavior between "wrong person" and "unknown reference" that would let an attacker enumerate valid invitation references or accounts.

## 14. Owner protection

Proven: Owner is never a valid target for suspend/role-change/override-admin across all three packages (throws in every path, though the error *category* differs — see §20 taxonomy finding); `business.ownerUserId` untouched throughout every scenario tested.

## 15. Self-action protection

Proven: Manager cannot self-suspend, even after being granted `staff.manage`; self-role-change rejected for both Manager and Staff actors.

## 16. Cross-business isolation

Proven: the same human Customer Identity legitimately holds separate memberships in two different Businesses (test-only Firestore setup for the second reference — no production function exposes "add a reference to an existing identity," so this is not itself a production path exercised). Business A's owner cannot suspend/remove/role-change/grant against Business B's membership.

## 17. Concurrency

Proven with real `Promise.allSettled` races against the Firestore emulator: accept-vs-revoke (exactly one operation fulfills, corrected during review — original test discarded both results, see §41 finding 3), double-accept (exactly one membership created), suspend-vs-role-change (no lost update — whichever command fulfilled is reflected in final stored state, corrected during review — original assertions were tautological, see §41 finding 4).

## 18. Idempotency

Proven: same idempotency key + same payload → safe replay (`duplicate` outcome, exactly one outbox event); same key + different payload → `IDEMPOTENCY_CONFLICT`, reusing the existing shared `checkAndReserveIdempotencyKey` mechanism — no second/invented idempotency system.

## 19. Outbox/audit coherence

All four command families (invitation create/accept/revoke, lifecycle, role-change, permission-override) write through the same shared `writeOutboxEntry` (`shared/outbox/outboxWriter.ts`) into the same `outboxEntries` collection with the same envelope shape. `authorizeAndExecute`'s mandatory sensitive-decision audit (`permissionAuditService.ts`) uses the identical writer. No second audit infrastructure found.

## 20. Error-taxonomy coherence

Mostly consistent, but two real inconsistencies surfaced empirically:

1. **Owner-target rejection**: `AUTH_FORBIDDEN` in lifecycle/role-change (enforced at the command-layer `staffMembershipTargetPolicy.ts`) vs `VALIDATION_FAILED` in override administration (enforced at the model-layer `permissionOverrideCannotTargetOwnerError`). Same rule, different category, because enforced at a different layer — assessed as an unintentional layering artifact, not a deliberate distinction. Not fixed (would be a taxonomy change, out of 003E's scope).
2. **Terminal invitation conditions**: already-accepted → `IDEMPOTENCY_CONFLICT`; revoked/expired → `RESOURCE_NOT_FOUND`. Two categories for the same conceptual failure family. Also assessed as likely unintentional. Not fixed.

Both recorded as findings for a future taxonomy-alignment decision, not corrected under this authorization.

## 21. Firestore data-integrity result

Every mutated document was re-read through its authoritative reader (`getBusinessMembershipById`, `getInvitationByReference`) after each operation, including failed/aborted attempts, across all 18 tests. No partially valid or malformed document observed, including under concurrency.

## 22. Rules/server-only assessment

Confirmed safe, no closure blocker. `firestore.rules` denies all direct client read/write by default (`match /{document=**} { allow read, write: if false; }`). `businessMemberships`, `businessMembershipInvitations`, and permission-override state (embedded in the membership document) are server-only. Rules were not modified.

## 23. Callable/endpoint inventory

Confirmed directly against `functions/src/index.ts` (current `main`): no import, export, or reference anywhere to any staff/invitation/membership/permission-override command. Every ENG-P2-003 command remains a plain dependency-injected TypeScript function, callable only from server-side/test code, zero client-reachable transport. This reconfirms 003B's own disclosed finding still holds. Per Founder direction, recorded here as **DEFERRED-BY-DESIGN** (no callable/HTTPS transport is owned by ENG-P2-003 per the governing design doc — likely ENG-P3-002's responsibility) rather than a closure blocker; no endpoints were built under this authorization.

## 24. Frontend/localization boundary

No frontend/UI work performed or required for concern closure per §3.2/§19. Handoff to the future customer/business-facing package remains as previously recorded.

## 25. Subscription-limit boundary

`DEC-SUB-002` remains `OPEN_FOUNDER`/non-blocking per §28. Reconfirmed: no numeric staff-count enforcement exists anywhere in the codebase; the invite path ships with its previously-disclosed non-blocking placeholder. Not implemented under this authorization.

## 26. Shared-device boundary

`DEC-SEC-003` confirmed still separate; no shared-device/PIN/session-switching logic found anywhere in the Staff Membership commands.

## 27. Acceptance matrix

| # | Requirement | Source | Package | Evidence | Status | Blocker? |
|---|---|---|---|---|---|---|
| 1 | Membership schema & lifecycle (invite/accept/suspend/reactivate/remove) | §4–5 | 003A/B/C | Own package tests + 003E full-chain journey | PASS | No |
| 2 | Invitation model & terminality | §6–9 | 003A/B | 003B tests + 003E terminality scenario | PASS | No |
| 3 | `staff.manage` target-restriction matrix (FD-5-STAFF) | §11, §28 | 003C | 003C tests + 003E Manager journey | PASS | No |
| 4 | `staff.assignRole` role-change (Owner-only, non-delegable) | §11 | 003C/004-CORR-002 | 003C tests + 003E role-change journey | PASS | No |
| 5 | Permission-override grant/revoke administration | §14 | 003D | 003D tests + 003E override journey | PASS | No |
| 6 | Owner protection across all actions | §12 | 003A/B/C/D | 003E Owner-protection scenario | PASS | No |
| 7 | Self-action protection | §12 | 003C | 003E self-action scenario | PASS | No |
| 8 | Cross-business isolation | §13 | 003A/B/C/D | 003E isolation scenario | PASS | No |
| 9 | Identity authority / no forged userId / no enumeration | §11/App §3 | 003B | 003E adversarial scenario | PASS | No |
| 10 | Concurrency safety across commands | Programme convention | 003A-D | 003E concurrency scenario | PASS | No |
| 11 | Idempotency via shared mechanism | Programme convention | 003A-D | 003E idempotency scenario | PASS | No |
| 12 | Outbox/audit coherence | §17 | 003A-D/004 | 003E secondary review | PASS | No |
| 13 | Firestore Rules server-only boundary | Programme convention | n/a | 003E secondary review | PASS | No |
| 14 | Role-change/override interaction (Phase H) | Task authorization, no prior doc | 003C/D interaction | 003E empirical test | **UNRESOLVED FINDING** | **Yes — Founder disposition required** |
| 15 | Error-taxonomy consistency | Programme convention | 003C/D | 003E secondary review | 2 minor inconsistencies found, not fixed | No (informational) |
| 16 | Callable/HTTPS exposure | §22/§23 (silent), 003B §38 (disclosed) | n/a | 003E secondary review | DEFERRED-BY-DESIGN | No |
| 17 | Frontend/UI | §3.2, §19 | n/a | n/a | DEFERRED-BY-DESIGN | No |
| 18 | Subscription staff-count limits | `DEC-SUB-002` | n/a | n/a | DEFERRED-BY-DESIGN | No |
| 19 | Shared-device auth | `DEC-SEC-003` | n/a | n/a | DEFERRED-BY-DESIGN | No |
| 20 | Ownership transfer | FD-6-STAFF | n/a | n/a | OUT OF SCOPE (excluded by design) | No |

## 28. Closure-readiness classification

**C. NOT COMPLETE** — one ENG-P2-003-owned requirement (row 14, Phase H's role-change/override-reactivation interaction) remains unresolved pending Founder disposition. Every other in-scope acceptance criterion is proven PASS; every deferred item is correctly deferred-by-design with citations, not a gap. This is *not* classified BLOCKED, because the finding does not prevent further engineering work or understanding — it is a single, well-isolated policy question with an empirically-established factual basis, awaiting a decision rather than more investigation.

## 29. Any new architecture gap

The Phase H finding (row 14) is the only one. No other test surfaced a missing business rule, new permission, new state, or new authority model.

## 30. Production changes required

None. All work is test-only (`staffMembershipIntegration.emulator.test.ts`).

## 31. Genuine RED→GREEN evidence if changes made

N/A — no production code changed. The Phase H test was written to observe actual behavior (not drive a fix); it passed on first correct execution once its own test-code defects (see §41) were fixed, because it asserts the empirically-observed outcome (`afterPromote.allowed === true`) rather than a desired one.

## 32. Tests added

One file: `functions/src/domains/permissions/service/staffMembershipIntegration.emulator.test.ts`, 18 test cases, ~1670 lines (final, post-review-fix line count).

## 33. Full validation

- New integration file alone: **18/18 passed** (verified directly, twice — once by the implementing agent, once independently by me after fixing 6 review-found defects).
- Full functions unit suite: **1240/1240 passed** (125 files).
- Full functions emulator suite: **537/537 passed** (39 files, includes the new 18).
- Typecheck (`tsc --noEmit`): clean.
- Lint (`eslint`): clean (repo pre-commit hook additionally ran prettier on commit).

## 34. Existing regression

None. All pre-existing 003A-D and 004 tests unaffected; full suite green.

## 35. Files modified

`functions/src/domains/permissions/service/staffMembershipIntegration.emulator.test.ts` (new file, test-only) plus this report. No production source files touched.

## 36. Code diff summary

+1670/-0 across one test file (net of the review-fix commit). No production code diff.

## 37. Dependencies added

None.

## 38. Config changes

None.

## 39. Firebase/Rules changes

None. Rules were inspected, not modified.

## 40. Deployment changes

None. No Firebase deployment performed under this authorization.

## 41. Review findings/dispositions

Independent code-review pass (`pr-review-toolkit:code-reviewer`) against the initial test file found 6 issues, all fixed and re-verified against the real emulator:

1. **Line ~761 (original)** — `expect(() => changeStaffMembershipRoleCommand(...)).not.toBe(undefined)` checked the function reference, not its invocation; the `toRole: "owner"` rejection path never actually ran. **Fixed**: converted to `await expect(...).rejects.toMatchObject({ category: "VALIDATION_FAILED" })` (the command is `async`, so its internal synchronous validation throw surfaces as a Promise rejection, not a synchronous throw — caught and corrected on the first re-run).
2. **Line ~1148 (original)** — cross-business test asserted on `businessId` fields but never checked that no membership document existed under the wrong business. **Fixed**: now queries `businessMemberships` scoped to business B and asserts zero results.
3. **Line ~1394–1405 (original)** — accept-vs-revoke concurrency test discarded both `Promise.allSettled` results (`void acceptResult; void revokeResult;`), so it could not detect a race where both operations succeeded. **Fixed**: asserts exactly one of the two fulfills, and correlates the winner with final invitation status.
4. **Line ~1489–1492 (original)** — suspend-vs-role-change concurrency test used tautological assertions (`expect(["active","suspended"]).toContain(status)`) that cannot fail regardless of outcome. **Fixed**: asserts the fulfilled command's effect is actually reflected in final stored state (no lost update), and that at least one command succeeded.
5. **Line ~1061 (original)** — expired-invitation rejection asserted only `category: expect.any(String)`, accepting any error. **Fixed**: pinned to the actual production category (`RESOURCE_NOT_FOUND`, confirmed by reading `invitationExpiredError()` in `permissionErrors.ts`).
6. **Line ~934–945 (original)** — "invited cannot administer overrides" case asserted only that invitation creation succeeded, not the claimed structural-inadministrability. **Fixed**: asserts the pending invite adds no new membership document (count unchanged from baseline, corrected twice — first attempt miscounted the Owner's own bootstrap membership).

All 6 fixes re-verified against the real Firestore/Auth emulator by me directly (not solely on the sub-agent's report) — final run: 18/18 passed, then full regression re-run clean.

## 42. Remaining material findings

- **Phase H unresolved policy question** (§10/§27 row 14) — the single item blocking closure classification.
- **Two error-taxonomy inconsistencies** (§20) — informational, not blocking.
- **Callable/HTTPS absence** (§23) — recorded as deferred-by-design per Founder direction, not blocking.

## 43. PR number

Not yet opened — see §53/§55 for next action. Will be opened as a draft against `main` from `feat/eng-p2-003e-staff-integration-validation`.

## 44. Final reviewed head

`3af6fcb` on `feat/eng-p2-003e-staff-integration-validation` (fix commit, following `5c8e784` initial integration-suite commit).

## 45. CI result

Not yet run through hosted CI (no PR opened yet at report-authoring time). Local full-suite results reported in §33 are authoritative for now; hosted CI evidence to be added once the PR is opened, per repository convention.

## 46. ENG-P2-003E status

**Implemented / pending Founder review.**

## 47. ENG-P2-003 concern status

**NOT COMPLETE — pending Founder disposition on the Phase H role-change/override-reactivation finding.** All other acceptance criteria independently reconstructed and proven; this is the sole blocking item.

## 48. ENG-P3-001/002/003 status

Not started. Not authorized by this task. No work performed.

## 49. Capability 3 status

**Open — partially implemented; not closed.** Unchanged by this task, per explicit instruction not to mark it complete.

## 50. Dirty primary worktree

None. `/Users/theo/11THONUS` was never touched; all work occurred in the dedicated worktree at `/Users/theo/11THONUS-eng-p2-003e`.

## 51. Risks

The Phase H finding is a real, live security-relevant behavior in production code today (not introduced by this task) — a Manager's revoked-by-demotion override right now silently reactivates if that Manager is later re-promoted, with no new authorization event or audit trail distinguishing it from a fresh grant. This is disclosed, not hidden, but until dispositioned it represents a latent authority-restoration risk for any business that demotes and later re-promotes a Manager.

## 52. Rollback

Trivial — this is a test-only addition on an unmerged branch; no rollback mechanism beyond not merging is needed.

## 53. Persistent report path

`docs/05-implementation/reports/eng-p2-003e-staff-membership-integration-validation-closure-readiness-implementation-report-2026-08-20.md` (this file).

## 54. Changes-tracking state

Programme tracking to be updated with dated supersession recording:
`ENG-P2-003E = Implemented / pending Founder review`; `ENG-P2-003 concern = NOT COMPLETE, pending Founder disposition on Phase H finding`; `Capability 3 = Open — partially implemented; not closed` (unchanged).

## 55. Exact next Founder action

Review and disposition the Phase H finding (§10/§27 row 14): decide whether a stale permission-override grant automatically reactivating after a demote→repromote role round-trip is acceptable intended behavior, or requires a new disposition directing role-change to clear/require re-confirmation of overrides whose eligible role no longer (or again) matches. Once dispositioned, ENG-P2-003 concern closure can be finalized (classification B — Complete with explicit deferred downstream items) or a corrective package scoped, as appropriate.

---

## FINAL GATE

**ENG-P2-003E READY FOR FOUNDER REVIEW — ENG-P2-003 CONCERN NOT YET COMPLETE**
