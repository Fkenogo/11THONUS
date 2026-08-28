# ENG-P3-002-UI-IMP-G-COMPLETION — Complete Staff Transport Identity Projection

**Date:** 2026-08-28
**Task:** Complete Package G now that the authoritative platform Display Name capability
(`FD-IDENTITY-DISPLAY-001`, `IDENTITY-PROFILE-A`, `IDENTITY-PROFILE-B`) exists. Package F (Team UI)
is explicitly **not** in scope and was **not** started.

---

## 1. Entry state

`git fetch origin` run. `origin/main` at `7112afe62e81cd7f2924ca08a1ea1c9d79141e87` (merge of PR
#191, `IDENTITY-PROFILE-B`). A fresh linked worktree was created from that exact commit on a new
branch, `feat/eng-p3-002-ui-imp-g-completion`, with a clean status (no tracked-file diffs at
creation, confirmed via `git status --porcelain=v1 -b`). No git locks or incomplete operations.

## 2. PR #187 disposition

- **State:** `OPEN`, **DRAFT**, `mergeStateStatus: DIRTY`, `mergeable: CONFLICTING` with current
  `main`. `reviewDecision` empty — **no review has occurred**.
- **Head:** `dfe696ac93dc25f9a79c6c82c9330a2dd60de4df` on `feat/eng-p3-002-ui-imp-g`.
- **Content:** implements exactly the pending-invitation half of `FD-P3-002-G-001` §2 (additive
  `email` field on `StaffInvitationSummary`, populated only for `deliveryType === "email"`), plus
  matching tests. Its own implementation report states explicitly it **stopped** on the
  active-member Display Name half of §1/§5 because, at the time it was written, no authoritative
  non-protected Display Name source existed yet — this is exactly the gap `FD-IDENTITY-DISPLAY-001`
  + `IDENTITY-PROFILE-A`/`IDENTITY-PROFILE-B` have since closed, and exactly why this task exists.
- **Reconciliation strategy:** PR #187 is small (2 production files, ~40 lines), unreviewed, and
  now conflicts with `main`. Rather than merge an unreviewed, conflicting draft and then layer a
  second PR on top, this task **incorporates PR #187's exact, already-written invitation-email
  logic and tests verbatim** (re-applied cleanly against current `main`) into this single
  completion PR, alongside the new active-member Display Name work. PR #187 will be **closed as
  superseded**, cross-referencing this PR's number, once this PR opens — no competing
  implementation is left standing. No file from PR #187 was blindly re-merged without independent
  re-verification: the invitation-side diff was re-derived by diffing PR #187's branch against
  `main` directly (§6 below), not copy-pasted from its report.

## 3. Governing authority verified

- `FD-P3-002-G-001` (`docs/05-implementation/reports/FD-P3-002-G-001-founder-disposition-staff-team-identity-projection-2026-08-27.md`)
  — merged, ancestor of `origin/main` (confirmed via `git grep`/file presence at the fetched head).
- `FD-IDENTITY-DISPLAY-001` (`docs/05-implementation/reports/FD-IDENTITY-DISPLAY-001-founder-disposition-platform-display-name-2026-08-27.md`)
  — merged, ancestor of `origin/main`.
- `IDENTITY-PROFILE-A` (PR #189, merge commit `4137315`) — confirmed ancestor of `origin/main` via
  `git merge-base --is-ancestor`.
- `IDENTITY-PROFILE-B` (PR #191, merge commit `7112afe`) — confirmed ancestor of `origin/main`
  (the exact commit the worktree was created from).
- Package F: no `feat/`/`docs/` branch or PR matching "IMP-F"/"Package-F" exists anywhere in
  `git branch -a` or `gh pr list`. **Not started.**
- Package H: no matching branch or PR exists. **Not started.**

## 4. Current active-membership DTO (pre-task, on `main`)

```ts
export type StaffMembershipSummary = { membershipId: string; role: string; status: string };
```

No `displayName`, no `userId`, no identity reference of any kind.

## 5. Current invitation DTO (pre-task, on `main`)

```ts
export type StaffInvitationSummary = {
  invitationId: string; role: string; status: string;
  deliveryType: string; invitedAt: string; expiresAt: string;
};
```

No delivery-target value of any kind (email or phone withheld identically).

## 6. Final identity-source matrix

| Transport | Current fields | Authorized identity source | Required change |
|---|---|---|---|
| Active membership | `membershipId`, `role`, `status` | `users/{membership.userId}.displayName` (`FD-P3-002-G-001` §5, via `IDENTITY-PROFILE-A`'s `displayNameRepository.ts`) | Add `displayName?: string`, resolved server-side via new batched `readDisplayNamesByUserIds` |
| Pending invitation (email delivery) | `invitationId`, `role`, `status`, `deliveryType`, `invitedAt`, `expiresAt` | `invitation.deliveryTarget.value` where `type === "email"` (`FD-P3-002-G-001` §2/§6) | Add `email?: string`, present only for `deliveryType === "email"` |
| Pending invitation (phone delivery) | (same as above) | **None** — §4 prohibits phone numbers unconditionally | No field added; `email` absent |

## 7. Owner display-name result

**PASS.** Owner memberships resolve uniformly through `membership.userId -> users.displayName`,
identical code path to Manager/Staff — no invitation-linkage of any kind is consulted. This
directly removes the limitation PR #187's report flagged (Owners are bootstrap-created, never
originate from an invitation, so any invitation-based resolution would have permanently excluded
them). Proven by emulator test 1 ("Owner membership resolves Display Name uniformly...").

## 8. Staff display-name result

**PASS.** Emulator test 2 (Staff membership resolves Display Name) and test 3 (two Staff with the
same role remain distinguishable by their own Display Name, via distinct `userId`s).

## 9. Missing-display-name result

**PASS, represented safely.** A membership whose `users` document has no `displayName` field set —
or has no `users` document at all — resolves to `displayName: undefined`, which the DTO omits
entirely (`Object.keys(dto)` does not contain `"displayName"`; never a fabricated empty string or
placeholder). The listing succeeds; it does not fail. Proven by emulator test 5.

## 10. Duplicate-display-name result

**PASS.** No uniqueness check exists or was introduced; two Staff may share an identical Display
Name (emulator test 4).

## 11. Pending-invitation identity result

**PASS**, exactly `FD-P3-002-G-001` §2/§6: `email` present only when `deliveryType === "email"`,
absent (never fabricated) for `phone` deliveries. Two email invitations remain distinguishable by
their own email (emulator test 39); cross-Business leakage checked directly (emulator test 40).

## 12. Authorization result

**PASS, unchanged.** `assertActiveMembership` — the same read-authority re-derivation `main` already
used — is untouched. No permission, role, or authorization code was modified. A caller with no
active membership in the requested Business is denied identically to "Business not found"
(unchanged; existing test 37 for both invitations and memberships still passes).

## 13. Tenant-isolation result

**PASS.** Emulator test 10 (membership Display Names) and test 40 (invitation emails): a caller
scoped to Business A never receives, and the raw JSON response never contains, any identity value
belonging to Business B, even when both businesses' owners/invitations exist simultaneously in the
same Firestore instance.

## 14. Protected-field exclusion

**PASS.** Emulator test 7/8/9 asserts the membership DTO's exact key set —
`{ displayName, membershipId, role, status }` — with no `userId`, `email`, phone, or other field
present. The invitation DTO's `email` field is the only addition and is delivery-type-gated; phone
numbers are never returned in either transport.

## 15. Firebase Auth boundary

**PASS, untouched.** `readDisplayNamesByUserIds` reads only `users/{userId}.displayName` via
Firestore `db.getAll`. No Firebase Auth Admin SDK call (`getAuth`, `listUsers`, custom claims, or
provider metadata) was added anywhere in this diff.

## 16. CustomerProfile boundary

**PASS, untouched.** No file in `functions/src/domains/identity/repositories/customerProfileDocument.ts`
or any `CustomerProfile` model was imported or read. The only identity-domain read added is the
narrow `users/{userId}.displayName` field, via a repository function scoped exactly to that
concern (does not round-trip through the full `CustomerIdentity`/`fromUserDocument` schema, which
is unrelated to Display Name and would couple this projection to fields it has no business
reading).

## 17. Read-query/performance result

- **Expected User reads:** exactly one Firestore round trip per `listStaffMembershipsForBusiness`
  call, regardless of roster size — `readDisplayNamesByUserIds` uses `Firestore#getAll(...refs)`
  (a single batched multi-document read), not N sequential `.get()` calls. Deduplicated userIds
  (a userId appearing twice, though not possible under the current one-membership-per-user
  invariant, would still cost one read).
- **Boundedness:** bounded by the existing `listMembershipsByBusiness` query — the same roster size
  the endpoint already returns in full; no new unbounded fan-out.
- **Batch-read precedent:** `Firestore#getAll` is the Firebase Admin SDK's own built-in batched
  multi-get; no third-party or hand-rolled batching layer was introduced. No existing
  `db.getAll(...)` precedent existed elsewhere in this codebase before this change (confirmed via
  `git grep`) — this is the first use, but it is a standard SDK primitive, not new infrastructure.
- **No general directory/cache layer** was added — `readDisplayNamesByUserIds` takes exactly the
  userIds the caller already authorized itself to see (the roster it just queried) and returns
  nothing else; it cannot be called with an arbitrary/unbounded userId list from outside this one
  call site.

## 18. Staff mutation non-regression

**N/A — no mutation file touched.** This task modified only
`functions/src/domains/permissions/service/staffTransportReadService.ts` (a read-only file),
`functions/src/domains/permissions/models/permissionErrors.ts` (additive error constructor only),
and the identity-domain `displayNameRepository.ts`/`identityErrors.ts` (additive functions only).
No file under Staff invitation/membership mutation
(`staffInvitation.ts`/`acceptStaffInvitationService.ts`/`businessMembershipWriteRepository.ts`/
role-management/override-admin) was modified. Full emulator suite (including
`staffInvitation.emulator.test.ts` and `staffMembershipIntegration.emulator.test.ts`, which cover
every Staff mutation path) passes unchanged (§21).

## 19. RED→GREEN evidence

Every new behavior was proven failing before the corresponding source change, in this session:

- `readDisplayNamesByUserIds` did not exist — its emulator tests (batch resolve, missing-doc,
  missing-field, malformed-type, malformed-empty, dedup, empty-input) failed with
  "readDisplayNamesByUserIds is not a function" until `displayNameRepository.ts` was extended.
- `StaffMembershipSummary.displayName` did not exist — emulator tests 1-10/12 failed
  (`displayName` always `undefined`, including for seeded values) until
  `staffTransportReadService.ts`'s `toMembershipSummary`/`listStaffMembershipsForBusiness` were
  extended.
- The malformed-record test failed to throw (returned a stale/garbage value) until the
  `try { normalizeDisplayName(raw) } catch { throw malformedDisplayNameRecordError(userId) }`
  guard was added, and until `listStaffMembershipsForBusiness`'s `catch (error) { if (error
  instanceof IdentityDomainError) throw staffIdentityIntegrityFailureError(); }` wrapper was added
  (without it, the raw `IdentityDomainError` — a different domain's error type — propagated
  instead of the expected `PermissionDomainError` with `category: "VALIDATION_FAILED"`).
- The pre-existing invitation test "38." (`never exposes the raw delivery-target value`) failed
  once `email` was added to the DTO, exactly as expected — its assertion predated
  `FD-P3-002-G-001` §2's authorization and was superseded (§6), not left broken.

All then passed after the corresponding implementation change, with no other test regressing.

## 20. Emulator evidence

Full Firebase Emulator Suite (`firebase emulators:exec "cd functions && pnpm run test:emulator"`,
all emulators: firestore, auth, functions, hosting, storage): **53 test files, 719 passed, 2
skipped, 0 failed.** This includes both touched files
(`staffTransportReadService.emulator.test.ts`: 19→27 tests, all passing;
`displayNameRepository.emulator.test.ts`: 20→27 tests, all passing) and every untouched Staff
mutation/lifecycle emulator suite (`staffInvitation.emulator.test.ts`,
`staffMembershipIntegration.emulator.test.ts`), confirming no regression.

## 21. Full validation

- **Functions unit suite:** `pnpm --filter functions test` — 145 test files, 1583 tests, all
  passing.
- **Functions emulator suite:** see §20 — 53 files, 719 passed, 2 skipped, 0 failed.
- **Web unit suite** (shared `StaffMembershipSummary`/`StaffInvitationSummary` types changed):
  `pnpm --filter web test` — 96 test files, 630 tests, all passing (+2 new: additive
  `displayName`/`email` pass-through tests in `staffLists.test.ts`).
- **Typecheck:** `pnpm --filter functions typecheck` (`tsc --noEmit`) and
  `pnpm --filter web typecheck` (`tsc -b --noEmit`) — both clean.
- **Lint:** `pnpm run lint` (repo-root `eslint .`) — 0 errors (1 pre-existing, unrelated warning in
  `BusinessApiContext.tsx`, not touched by this task).
- **Format:** `pnpm run format:check` — clean after one `prettier --write` pass on the 3 files this
  task's own edits reformatted (`staffTransportReadService.ts`,
  `staffTransportReadService.emulator.test.ts`, `displayNameRepository.emulator.test.ts`).
- **Build:** not run as a separate step in this pass — `tsc --noEmit`/`tsc -b --noEmit` (the
  project's own `typecheck` scripts, which compile the full program) passed clean, and `build` is
  the same `tsc`/`tsc -b` invocation without `--noEmit`; no deployment was performed per Phase L's
  "No deployment" instruction.
- **Secret scan:** `git diff` scanned for credential/token/key patterns — clean.

## 22. Security/privacy review

- **Data minimization:** only the two fields `FD-P3-002-G-001` §5/§6 name were added; no other
  field on `users`/`businessMembershipInvitation` was surfaced.
- **Protected-profile separation:** no `CustomerProfile` field read or referenced.
- **Firebase Auth separation:** no Firebase Auth Admin SDK call added.
- **Tenant isolation:** verified directly (§13); the existing per-Business Firestore query is the
  only source of which userIds/invitations are ever passed to the new identity read — a caller can
  never smuggle a foreign-Business userId into `readDisplayNamesByUserIds`, since it only ever
  receives the ids from the already-tenant-scoped `listMembershipsByBusiness` result.
- **Missing-name handling:** verified absent, not fabricated (§9).
- **No people directory:** `readDisplayNamesByUserIds` takes a bounded userId list from an
  already-authorized caller's own roster query; it exposes no search, lookup-by-name, or
  lookup-by-email capability, and cannot be invoked with an arbitrary userId from outside this one
  call site.
- **Logs/errors:** `staffIdentityIntegrityFailureError` deliberately does not include the raw
  `IdentityDomainError` message/category in its own message, so a malformed-record failure surfaced
  to a Staff-list caller never leaks identity-domain-internal detail.
- **No cross-business cache leakage:** no cache of any kind was introduced; every call re-reads
  Firestore fresh, scoped to that call's own already-authorized roster.

No privacy boundary was left uncertain; this task did not stop for that reason.

## 23. Files modified

- `functions/src/domains/permissions/service/staffTransportReadService.ts`
- `functions/src/domains/permissions/service/staffTransportReadService.emulator.test.ts`
- `functions/src/domains/permissions/models/permissionErrors.ts`
- `functions/src/domains/identity/repositories/displayNameRepository.ts`
- `functions/src/domains/identity/repositories/displayNameRepository.emulator.test.ts`
- `functions/src/domains/identity/models/identityErrors.ts`
- `apps/web/src/business/api/staffLists.ts`
- `apps/web/src/business/api/staffLists.test.ts`
- This report and the `docs/changes/IMPLEMENTATION_CHANGES.md` entry.

No `functions/src/domains/permissions/service/staffInvitation*.ts`,
`acceptStaffInvitationService.ts`, Rules, Firebase configuration, or `apps/web` Team/Package-F file
was touched.

## 24. Diff summary

8 source/test files changed, +547/-19 lines. Two new error constructors (additive, one per
domain); one new identity-domain repository function
(`readDisplayNamesByUserIds`, batched, fail-closed on malformed records only); the two existing
Staff-transport DTOs each additively extended by exactly one optional field; PR #187's
already-written invitation-email logic and tests re-applied verbatim against current `main`; the
web-side DTO mirror and its adapter tests updated to match.

## 25. Commands executed

```
git fetch origin
git worktree add -b feat/eng-p3-002-ui-imp-g-completion <path> origin/main
git merge-base --is-ancestor <IDENTITY-PROFILE-A sha> origin/main
git merge-base --is-ancestor <IDENTITY-PROFILE-B sha> origin/main
gh pr view 187 --json ...
git diff origin/main...origin/feat/eng-p3-002-ui-imp-g -- ...
pnpm install --frozen-lockfile   (functions/, apps/web/)
pnpm run typecheck               (functions/, apps/web/)
pnpm run test                    (functions/, apps/web/)
firebase emulators:exec "cd functions && pnpm run test:emulator"
pnpm run lint
pnpm run format:check / prettier --write <3 files> / pnpm run format:check
git diff | grep -inE "api[_-]?key|secret|password|..."
```

## 26. Dependencies/config/Firebase/Rules changes

None. No `package.json` dependency added or changed (beyond the workspace's own existing
`pnpm install`), no `firebase.json`/`firestore.rules`/`firestore.indexes.json` touched, no
environment variable added.

## 27. Findings

- The pre-existing invitation emulator test "38." asserted behavior `FD-P3-002-G-001` §2 now
  deliberately reverses (email must be exposed for email-delivery invitations). This was expected
  and superseded, not a defect — flagged here for the record per Phase M's spirit of full
  disclosure.
- `Firestore#getAll` had no existing precedent in this codebase; this is the first use. It is a
  standard Firebase Admin SDK primitive (not new infrastructure), chosen specifically to avoid
  N sequential per-membership reads (Phase H).

## 28. Remaining material findings

None identified. Every §5/§6 field is implemented; no identity-source gap remains for either
transport (contrast with PR #187's own report, which had one: the active-member half of §5, now
closed by `IDENTITY-PROFILE-A`/`B`).

## 29. Risks

- **Fail-closed blast radius:** a single malformed `displayName` record (data corruption or a
  direct-write bypass of `setDisplayName`) fails the *entire* Staff-membership listing for that
  Business, not just the one affected member — consistent with this codebase's dominant fail-closed
  convention (mirrors `getCustomerIdentityById`'s own all-or-nothing posture), but worth the
  Founder's awareness: an Owner could be unable to see any of their Staff roster until the
  offending record is repaired. No auto-repair or partial-degrade path was built, per Phase H's "do
  not overengineer" instruction and the absence of any existing partial-degrade precedent in this
  domain.
- **PR #187 closure:** closing #187 as superseded is a documentation/administrative action, not a
  code risk — its exact reviewed content is preserved verbatim in this PR's diff.

## 30. Rollback

Revert this PR's merge commit (or the equivalent single squash commit) — every change is additive
(new optional DTO fields, new functions, new error constructors); no existing field, function
signature, or error was removed or renamed, so a revert cannot break any other caller.

## 31. Report path

`docs/05-implementation/reports/ENG-P3-002-UI-IMP-G-COMPLETION-staff-transport-identity-projection-implementation-report-2026-08-28.md`
(this document).

## 32. Changes-tracking

`docs/changes/IMPLEMENTATION_CHANGES.md` updated with a new dated entry
(`ENG-P3-002-UI-IMP-G-COMPLETION`, 2026-08-28) cross-linking this report.

## 33. PR number

To be assigned on `gh pr create` (draft) — see closing note below; this report is written before
PR creation per the task's own phase ordering (validation before PR).

## 34. Final head SHA

Recorded at the time of PR creation (post-report commit).

## 35. CI

Not yet run (PR not yet opened at time of writing). Local validation (§21) is the evidence base for
this report; CI will re-run the same suites on push.

## 36. Package G status

**Complete.** Both halves of `FD-P3-002-G-001` (§1/§5 active-member Display Name, §2/§6 pending
invitation identity) are now implemented, tested, and validated. PR #187 (partial) is superseded
and will be closed.

## 37. Package F/H status

Both **not started**. No Team UI file, no Package-H file, was created or modified.

## 38. ENG-P3-002 status

**Open.** Not closed by this task.

## 39. Capability 3 status

**Open.** Not closed by this task.

## 40. Exact next Founder action

Review this draft PR (to be opened against `main`), specifically:

1. Confirm the fail-closed-on-malformed-record posture (§29 risk) is acceptable, or direct a
   partial-degrade design instead.
2. Approve closing PR #187 as superseded by this PR.
3. Merge (or request changes) — this PR is **not self-merged**, per instruction.
4. Decide whether/when to authorize Package F (Team UI) — explicitly **not** requested or
   implied by this task's completion.

---

## FINAL GATE

**PACKAGE G READY FOR FOUNDER REVIEW — ACTIVE STAFF DISPLAY NAME AND PENDING INVITATION IDENTITY
PROJECTIONS COMPLETE; PACKAGE F NOT STARTED**
