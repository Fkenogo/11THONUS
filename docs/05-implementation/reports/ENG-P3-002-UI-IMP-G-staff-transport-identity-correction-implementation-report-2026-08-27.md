# ENG-P3-002-UI-IMP-G — Staff Transport Identity Correction Implementation Report

**Date:** 2026-08-27
**Task type:** Bounded backend/read-transport correction, TDD, per the Founder authorization in
this task and the identity-projection policy `FD-P3-002-G-001` records. Package F (Team UI) is
**not** implemented or started by this task.

**Outcome: PARTIAL.** The pending-invitation identity correction `FD-P3-002-G-001` §2 authorizes is
implemented, tested, and included in this PR. The active-member display-name correction §1
authorizes is **not implemented** — Phase D's own stop condition was hit: no existing authoritative,
non-protected display-name source exists anywhere in this codebase today (see §8/§29 below). No
exposure was widened to work around this; the gap is reported instead.

---

## 1. Entry repository state

`git fetch origin` run. Working directory (`docs/eng-p3-002-ui-governance-chain-sync`) confirmed at
`99f840f`, 35 commits behind `origin/main` (irrelevant — a fresh worktree was created, not reused).
`origin/main` confirmed at `b2e9116a53a25961bb955f48188ce7873eaecc51` (merge of PR #186,
`FD-P3-002-G-001`). No git locks or incomplete operations (`index.lock`, `MERGE_HEAD`,
`rebase-merge`, `rebase-apply` all absent). Untracked pre-existing files in the primary worktree
(`WORKING_WITH_THE_FOUNDER/`, several unrelated `docs/` items) left untouched — irrelevant to this
task, not created by it.

A fresh clean linked worktree was created at `/Users/theo/11THONUS-eng-p3-002-ui-imp-g` on new
branch `feat/eng-p3-002-ui-imp-g`, directly from `origin/main` at `b2e9116`.

## 2. `FD-P3-002-G-001` authority verification

- `git merge-base --is-ancestor b2e9116a53a25961bb955f48188ce7873eaecc51 origin/main` → **YES**,
  confirmed ancestor.
- `ENG-P2-003-CORR-TIMEFIX-001` (Staff Membership time-determinism correction) confirmed merged
  (`origin/main` history: PR #184 code, PR #185 review/closure-sync), both ancestors of the
  worktree's base commit.
- `origin/main`'s CI (`Build, Lint, Test, Emulator Validation`) confirmed green for the commit
  immediately preceding `b2e9116` (`42d7c2a`, PASS); `b2e9116` itself is `FD-P3-002-G-001`'s own
  docs-only merge, already independently reviewed and merged in the prior task.
- No Package F/G/H branch or PR existed before this task (`git branch -a`, `git log --all`,
  `git ls-remote --heads origin` all empty for `imp-g`/`imp-f`/`imp-h`/`package-g` patterns) —
  re-confirmed at entry.

## 3. Exact Package G scope reconstructed

A bounded Staff read-transport correction, exactly to the ceiling `FD-P3-002-G-001` sets: improve
the *information content* two existing read-only callables (`listStaffInvitations`,
`listStaffMemberships`) return to an *already-authorized* Business caller, so the approved Team
Management UI can eventually distinguish (a) who is on the team and (b) who has been invited.
Explicitly excludes: Package F (Team UI), any Staff mutation, any authorization/permission change,
any lifecycle change, any general identity/directory capability, and — per Phase D's stop condition
— the active-member display-name half of the disposition, since no safe source for it exists.

## 4. Governing/privacy sources reviewed

- `FD-P3-002-G-001` (this task's binding privacy ceiling) — re-read in full.
- `ENG-P3-002-UI-RECON-001` Part XI §12, Part XV (Package G definition).
- `ENG-P3-002-UI-HANDOFF-001` (Team screen design intent).
- `ENG-P3-002C-FOUNDER-QA-001` §7/§12 (the original pending-invitation-identity Founder QA
  finding — confirmed the *only* Founder-QA-flagged identity gap was invitation identity, not
  member display name; the member-display-name gap is `ENG-P3-002-UI-RECON-001`'s own additional
  finding, not separately Founder-QA-evidenced).
- `ENG-P2-003` Staff domain/contract sources directly re-inspected (not from summary):
  `functions/src/domains/permissions/models/businessMembershipInvitation.ts`,
  `invitationDeliveryTarget.ts`, `invitationStatus.ts`,
  `functions/src/domains/permissions/evaluator/types.ts` (`EvaluationBusinessMembership`),
  `functions/src/domains/permissions/service/staffTransportReadService.ts` (full),
  `functions/src/domains/permissions/service/createStaffInvitationService.ts`,
  `acceptStaffInvitationService.ts` (checked for any name-capture path — none found).
- Identity/customer-profile sources checked for a safe display-name candidate:
  `functions/src/domains/identity/repositories/userDocument.ts`,
  `functions/src/domains/identity/models/customerIdentity.ts`,
  `functions/src/domains/identity/models/customerProfile.ts`,
  `functions/src/domains/permissions/repositories/verifiedContactLookup.ts` (Firebase Auth
  `getUser` usage pattern).
- `apps/web/src/business/api/staffLists.ts` / `staffLists.test.ts` (frontend contract).

## 5. Current membership DTO (before this task)

```ts
export type StaffMembershipSummary = {
  membershipId: string;
  role: string;
  status: string;
};
```

**Unchanged by this task** — see §8/§29.

## 6. Current invitation DTO (before this task)

```ts
export type StaffInvitationSummary = {
  invitationId: string;
  role: string;
  status: string;
  deliveryType: string;
  invitedAt: string;
  expiresAt: string;
};
```

## 7. Identity-gap matrix

**Active memberships:**

| Field | Domain source | Current DTO? | Governed for exposure? | Authoritative source | Package G action |
|---|---|---|---|---|---|
| `membershipId` | `businessMembership.id` | Yes | Yes | membership doc | Unchanged |
| `role` | `businessMembership.role` | Yes | Yes | membership doc | Unchanged |
| `status` | `businessMembership.status` | Yes | Yes | membership doc | Unchanged |
| `userId` | `businessMembership.userId` | No | **No** — internal identity ID, prohibited as customer-facing identity (`FD-P3-002-G-001` §4) | membership doc | Not exposed (unchanged) |
| display name | none persisted (`users.displayName` schema-reserved, never written — `userDocument.ts` comment confirms); `customerProfile.firstName/lastName` (protected profile data, prohibited §4); Firebase Auth `displayName`/email (auth-provider metadata, prohibited §4) | No | Authorized **in principle** (`FD-P3-002-G-001` §1) | **None safe exists** | **STOPPED — not implemented; see §29** |

**Pending invitations:**

| Field | Domain source | Current DTO? | Governed for exposure? | Authoritative source | Package G action |
|---|---|---|---|---|---|
| `invitationId` | `invitation.id` | Yes | Yes | invitation doc | Unchanged |
| `role` | `invitation.role` | Yes | Yes | invitation doc | Unchanged |
| `status` | `invitation.status` | Yes | Yes | invitation doc | Unchanged |
| `deliveryType` | `invitation.deliveryTarget.type` | Yes | Yes | invitation doc | Unchanged |
| `deliveryTarget.value` (email) | `invitation.deliveryTarget.value` | No (withheld) | **Yes, when `type === "email"`** (`FD-P3-002-G-001` §2) | invitation doc (the Business's own input at invite time — not customer profile, not auth metadata) | **ADDED**: `email` field, populated only for `email`-type deliveries |
| `deliveryTarget.value` (phone) | `invitation.deliveryTarget.value` | No | **Not covered** — `FD-P3-002-G-001` §2 authorizes only the email case explicitly; §4 separately and generally prohibits phone numbers | invitation doc | Remains withheld (no field added for `phone` deliveries) |
| `invitedBy` | `invitation.invitedBy` | No | Not requested by the approved Team design; out of scope | invitation doc | Not exposed (unchanged) |
| `invitedAt`/`expiresAt` | invitation timestamps | Yes | Yes | invitation doc | Unchanged |

## 8. Active-member authoritative identity source — result: NONE FOUND

Three candidate sources were checked, in order of plausibility, and each was ruled out:

1. **`users` document `displayName` field.** TRD10 §10.6.1 reserves this field structurally, but
   `functions/src/domains/identity/repositories/userDocument.ts`'s own header comment states the
   converter **"deliberately does not populate"** `displayName` (along with `authUid`,
   `primaryPhone`, `primaryEmail`, etc.) — "those belong to Authentication-integration/Profile
   scope this task does not implement." Confirmed by direct repo-wide search: no write path to
   `users.displayName` exists anywhere in `functions/src`. The field is schema-reserved, not data
   that exists.
2. **`customerProfile.firstName`/`lastName`.** Exists and is populated, but is explicitly the
   **protected customer-profile data** `FD-P3-002-G-001` §4 prohibits exposing.
3. **Firebase Auth user record `displayName`/email** (via `getAuth().getUser(uid)`, the pattern
   `verifiedContactLookup.ts` already uses for an unrelated purpose). This is **authentication-
   provider information**, also explicitly prohibited by §4.

No fourth candidate exists. Per Phase D's own instruction — *"If no safe authoritative
non-protected display-name source exists: STOP and report. Do not widen exposure"* — this
sub-scope was not implemented. See §29 for the exact next decision this requires.

## 9. Pending-invitation authoritative identity source

`invitation.deliveryTarget.value` when `invitation.deliveryTarget.type === "email"` — the exact
value the Business itself supplied when creating the invitation (`createStaffInvitationService.ts`
→ `createBusinessMembershipInvitation`). This is not customer-profile data and not
authentication-provider data; it is data the requesting Business already possesses (they typed it
in), scoped to their own Business's own invitation record, matching `FD-P3-002-G-001` §2 exactly.

## 10. Privacy/data-minimization analysis

- Only the one field `FD-P3-002-G-001` §2 explicitly names (`email`, email-delivery only) was
  added. No other field on the invitation or membership record was surfaced "because it was there."
- Phone-delivery invitations receive **no** added identity field — `FD-P3-002-G-001` §2's own text
  covers only the email case, and §4 separately and unconditionally prohibits phone numbers; the
  two clauses are read conservatively (narrowest authorization wins) rather than assuming phone was
  meant to be covered by the general "delivery identity actually used" language.
- `StaffMembershipSummary` is byte-for-byte unchanged — no active-member field was added, since
  none is safely available (§8).
- No new callable, no new query, no new index, no new repository method was introduced — the
  correction is a pure DTO-shaping change inside the existing `toInvitationSummary` mapper.

## 11. Final DTO changes

```ts
// functions/src/domains/permissions/service/staffTransportReadService.ts
export type StaffInvitationSummary = {
  invitationId: string;
  role: string;
  status: string;
  deliveryType: string;
  email?: string;   // NEW — present only when deliveryType === "email"
  invitedAt: string;
  expiresAt: string;
};
```

`StaffMembershipSummary` is **unchanged**. `apps/web/src/business/api/staffLists.ts`'s
`StaffInvitationSummary` mirrors the same additive `email?: string` field.

## 12. Fields explicitly excluded

Active-member display name (§8, blocked — no safe source); `userId` on either DTO; phone-delivery
invitation values; `invitedBy`; any `customerProfile` field; any Firebase Auth/provider field; any
cross-Business data (proven absent by tests, §19); any general lookup/search/directory capability
(none added — the two existing callables' shapes and query scope are otherwise untouched).

## 13. Authorization result

Unchanged and re-verified: `assertActiveMembership` (the same pre-existing re-derivation of the
caller's own live membership, never a client-supplied claim) still gates both callables identically
to before this task. No permission identifier, grant mechanic, or role was touched. Existing tests
"a Manager (not just the Owner) may also list invitations," "a suspended caller membership no
longer grants read authority," and the two "cross-Business enumeration resistance" tests all pass
unmodified against the new code (**PASS** — see §17/§20).

## 14. Tenant-isolation result

**PASS.** New test 40 (`cross-Business invitation identity never leaks`) proves a Business's
invitation-email listing contains only that Business's own invitations — a second Business's
invitation email is asserted absent from both the returned array and its serialized form. The
pre-existing cross-Business enumeration-resistance tests (both DTOs) continue to pass unmodified.

## 15. Malformed-data result

Inspected `listInvitationsByBusiness`/`listMembershipsByBusiness` and their document readers
(`fromBusinessMembershipInvitationDocument`, the membership equivalent): both remain fail-closed
readers (return `null`/are filtered out on any structurally malformed document, never silently
substitute a default) — unchanged by this task. No new malformed-data path was introduced by the
one added field, since `deliveryTarget.value` is already a required, validated field on every
persisted invitation (`createInvitationDeliveryTarget` rejects a blank value at write time) — there
is no code path where an invitation exists with `type === "email"` and a missing/blank `value`.

## 16. Staff mutation non-regression

`createStaffInvitationService.ts`, `acceptStaffInvitationService.ts`, `revokeStaffInvitationService.ts`,
`staffMembershipLifecycleCommand.ts` were not modified. Their full existing test suites pass
unmodified as part of the full functions suite (§20) — invite/accept/revoke/role/lifecycle
semantics are byte-for-byte unchanged.

## 17. Frontend contract impact

`apps/web/src/business/api/staffLists.ts`'s `StaffInvitationSummary` type gained the same additive
`email?: string` field, matching the backend DTO exactly. No component, hook, or Team UI file was
touched (`TeamStep.tsx` does not import this type directly and was not modified). One new
contract-level test was added to `staffLists.test.ts` confirming the optional field passes through
`toCallListStaffInvitations` unchanged; the existing passthrough test continues to pass without the
field present, confirming backward compatibility.

## 18. RED→GREEN evidence

The pre-existing invitation-privacy test (`"38. bounded DTO privacy — never exposes the raw
delivery-target value (email/phone)"`) asserted the invitee email was **absent** — the exact
assertion Package G's authorized correction must invert for the email case. That test was rewritten
(not deleted) to assert the new, narrower, authorized behavior: email delivery exposes the email;
phone delivery still exposes nothing. Before the `toInvitationSummary` code change, this rewritten
test (and the three new tests 39/40 plus the frontend contract test) fail, because `email` is
never populated; after the code change, all pass — confirmed by running the suite both before
committing (implementation done first here, but the test bodies and assertions themselves encode
the exact RED state: removing the `...({email: ...})` spread from `toInvitationSummary` and
re-running reproduces the RED failure, verified locally before finalizing this diff).

## 19. Tests added/changed

`functions/src/domains/permissions/service/staffTransportReadService.emulator.test.ts`:
- Rewrote test 38 (email exposed, phone withheld — two invitations in one Business).
- Added test 39 (two email invitations distinguishable by email).
- Added test 40 (cross-Business invitation identity never leaks).
- `seedInvitation` helper extended with an optional `deliveryTarget` param (additive, existing
  call sites unaffected).

`apps/web/src/business/api/staffLists.test.ts`:
- Added one test confirming the additive `email` field passes through
  `toCallListStaffInvitations` unchanged.

No test for `StaffMembershipSummary` was changed — its existing tests (including "38. bounded DTO
privacy — never exposes the raw Customer Identity (`userId`)") were re-run unmodified and continue
to pass, proving non-regression on the sub-scope that was **not** implemented.

## 20. Emulator evidence

```
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
  npx vitest run --config vitest.emulator.config.ts
  Test Files  52 passed (52)
       Tests  690 passed | 2 skipped (692)   ← the 2 skips are pre-existing, unrelated to Package G
```

Focused file: `staffTransportReadService.emulator.test.ts` — 11/11 passed in isolation.

## 21. Full validation

- **Focused Package G tests:** PASS (11/11, emulator).
- **Staff transport tests:** PASS (included in focused run above).
- **Staff membership/invitation emulator tests:** PASS (included in full emulator run).
- **Full functions suite (`vitest.config.ts`):** PASS — 143 files, 1563 tests.
- **Full Firebase Emulator Suite (`vitest.emulator.config.ts`):** PASS — 52 files, 690 passed, 2
  pre-existing skips.
- **Full web suite:** PASS — 93 files, 596 tests (shared types were touched, so the full suite was
  run, not just the touched file).
- **Typecheck:** `functions`: `tsc --noEmit` clean. `apps/web`: `tsc --noEmit` clean.
- **Lint:** `eslint` clean on all four touched files.
- **Format:** `prettier --check` found one formatting issue in the new emulator test (long test
  name/object literal); fixed with `prettier --write`, re-verified clean.
- **Build:** `functions`: `pnpm run build` (`tsc`) succeeded. `apps/web`: `pnpm run build`
  (`tsc -b && vite build`) succeeded (pre-existing >500kB chunk-size warning, unrelated to this
  change, not introduced by it).
- **Secret scan:** `git diff` grepped for key/secret/token/password/`AIza`/PEM-header patterns —
  no matches.

No flakes observed across any run.

## 22. Security review

- **Data minimization:** confirmed — exactly one field added, scoped exactly to what
  `FD-P3-002-G-001` §2 names, nothing added "because it existed nearby."
- **PII exposure:** the added field (invitation email) is data the requesting Business already
  possesses; no new PII source was introduced. Active-member display name (the higher-sensitivity
  half) was explicitly **not** implemented rather than risk exposing protected or auth-provider
  data.
- **Business tenant isolation:** proven by test 40 and the pre-existing enumeration-resistance
  tests — unchanged authorization path.
- **Invitation privacy:** phone-delivery invitations remain fully unidentifiable by this DTO,
  matching the conservative reading of §2/§4.
- **Customer-vs-Staff identity boundary:** untouched — no customer-profile or identity-domain code
  was modified.
- **Protected-profile boundary:** untouched — `customerProfile.ts` was read for research only, not
  imported or modified.
- **Logs/errors:** `staffReadNotAuthorizedError` and the repository error paths were not modified;
  no new error path logs the new field.
- **No auth/provider leakage:** `verifiedContactLookup.ts`/`firebaseTokenVerifier.ts` were read for
  research only, not imported into the transport service — no new dependency on Firebase Auth user
  records was introduced.
- **No general directory capability:** confirmed — no new query, no new callable, no
  search/lookup-by-email or by-name capability was added anywhere.

No field's safety was uncertain at the point of implementation; the one field genuinely uncertain
(active-member display name) was not implemented, per Phase K's "if uncertain about any exposed
field, STOP" instruction.

## 23. Files modified

- `functions/src/domains/permissions/service/staffTransportReadService.ts`
- `functions/src/domains/permissions/service/staffTransportReadService.emulator.test.ts`
- `apps/web/src/business/api/staffLists.ts`
- `apps/web/src/business/api/staffLists.test.ts`
- `docs/05-implementation/reports/ENG-P3-002-UI-IMP-G-staff-transport-identity-correction-implementation-report-2026-08-27.md`
  (new — this document)
- `docs/changes/IMPLEMENTATION_CHANGES.md` (appended entry)

No other file touched. No `functions/src/domains/**` file outside the `permissions` transport
service was modified. No Firebase Rules, config, or dependency file was touched (the stray
`functions/package-lock.json` an earlier `npm install` step created was deleted before committing —
this repository is a `pnpm` workspace).

## 24. Code diff summary

`toInvitationSummary` now conditionally spreads `{ email: invitation.deliveryTarget.value }` into
the returned DTO only when `invitation.deliveryTarget.type === "email"`; the `StaffInvitationSummary`
type (both backend and frontend) gained the matching optional `email?: string` field. Four test
files gained/modified test cases as described in §19. No other runtime logic changed — no
authorization branch, no repository query, no persistence write path.

## 25. Commands executed

```
git fetch origin
git rev-parse origin/main / HEAD
git rev-list --left-right --count HEAD...origin/main
git status --porcelain=v1 -b
git merge-base --is-ancestor b2e9116... origin/main
git worktree add -b feat/eng-p3-002-ui-imp-g <path> origin/main
pnpm install --frozen-lockfile
firebase emulators:start --only firestore,auth --project demo-11thonus
npx vitest run --config vitest.emulator.config.ts src/domains/permissions/service/staffTransportReadService.emulator.test.ts
npx vitest run --config vitest.config.ts        (functions, full)
npx vitest run --config vitest.emulator.config.ts (functions, full, emulator)
npx vitest run                                   (apps/web, focused then full)
npx tsc --noEmit                                 (functions, apps/web)
npx eslint <touched files>
npx prettier --check / --write <touched files>
pnpm run build                                   (functions, apps/web)
git diff | grep -inE "api[_-]?key|secret|password|token\s*=|AIza|BEGIN (RSA|PRIVATE)"
```

## 26. Dependencies added

None.

## 27. Config changes

None.

## 28. Firebase/Rules/deployment changes

None. No deployment performed.

## 29. Findings

**Material finding:** the active-member display-name half of `FD-P3-002-G-001` §1 cannot currently
be implemented without either (a) widening exposure beyond what the disposition authorizes
(protected profile data or auth-provider data), or (b) a separate implementation effort to actually
populate `users.displayName` from a governed, non-protected source (e.g. capturing a name at
registration through a new, explicitly-authorized write path) before Package G could safely read
it. Neither is authorized by this task or by `FD-P3-002-G-001` as written.

## 30. Remaining material findings

Same as §29 — no additional findings beyond the one above. The phone-delivery invitation gap
(invitations delivered by phone remain visually indistinguishable in the Team UI, same as before
this task) is a known, deliberately-not-addressed consequence of §2's conservative reading, not a
newly discovered defect.

## 31. Risks

- **Frontend expectation risk:** whoever eventually builds Package F (Team UI) may expect *both*
  DTOs to carry a name; only invitations do. Documented explicitly in this report and in the code
  comment on `StaffMembershipSummary`'s call site so this isn't rediscovered from scratch.
  Not authorized here.
- **Partial-fix optics risk:** a reviewer skimming only the DTO diff might assume the full
  `FD-P3-002-G-001` scope shipped. Mitigated by this report's explicit "Outcome: PARTIAL" framing
  and by §29's standalone finding.

## 32. Rollback

Revert the single commit on `feat/eng-p3-002-ui-imp-g`; the change is additive-only (one optional
field, conditionally populated) with no persistence or migration step, so rollback is a clean,
isolated revert with no downstream dependency.

## 33. Persistent report path

`docs/05-implementation/reports/ENG-P3-002-UI-IMP-G-staff-transport-identity-correction-implementation-report-2026-08-27.md`
(this document).

## 34. Changes-tracking state

`docs/changes/IMPLEMENTATION_CHANGES.md` updated with a new dated entry immediately following the
`FD-P3-002-G-001` entry.

## 35. PR number

Recorded once opened — see the companion PR for branch `feat/eng-p3-002-ui-imp-g`.

## 36. Final head SHA

Recorded once committed — see the companion commit for this branch.

## 37. CI result

Recorded once the PR's CI run completes.

## 38. Package G status

**Partially implemented.** Pending-invitation identity correction complete, tested, submitted for
review (draft PR). Active-member display-name correction **not implemented** — blocked per §8/§29,
requires a fresh Founder/architecture decision before any further Package G work on that half can
proceed.

## 39. Package F status

Not started. Not authorized by this task; no Team UI file was touched.

## 40. Package H status

Not started. Unaffected by this task.

## 41. ENG-P3-002 status

Open. Not closed by this task.

## 42. Capability 3 status

Open. Not closed by this task.

## 43. Exact next Founder action

1. Review and merge this draft PR for the pending-invitation identity correction (the safe,
   fully-authorized, fully-tested half of Package G).
2. Separately decide how — or whether — to resolve the active-member display-name gap: either (a)
   authorize a new, explicitly-scoped effort to populate `users.displayName` from a governed
   non-protected source (its own implementation task, with its own privacy review, since it
   touches identity/profile write paths this task's authorization does not cover), or (b) amend
   `FD-P3-002-G-001` to explicitly permit a specific narrower profile field (e.g. first name only)
   for this purpose, or (c) accept that active Team members remain distinguishable only by role for
   now. None of these three is selected by this report — this is exactly the decision Phase D
   requires stopping for.

---

## Final gate

**ENG-P3-002-UI PACKAGE G BLOCKED (PARTIAL) — ACTIVE-MEMBER DISPLAY NAME HAS NO EXISTING
AUTHORITATIVE NON-PROTECTED SOURCE (FD-P3-002-G-001 §1 CANNOT BE SAFELY IMPLEMENTED AS WRITTEN);
PENDING-INVITATION IDENTITY CORRECTION (FD-P3-002-G-001 §2) IS FULLY IMPLEMENTED, TESTED, AND
SUBMITTED FOR FOUNDER REVIEW. PACKAGE F TEAM UI NOT STARTED.**
