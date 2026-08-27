# `IDENTITY-PROFILE-B` — Platform Display Name Profile-Completion UI Implementation Report

**Date:** 2026-08-27
**Task type:** Frontend, TDD, per the Founder authorization in this task and the governed backend
contract `IDENTITY-PROFILE-A` (merged, per `FD-IDENTITY-DISPLAY-001`).

---

## 1. Entry repository state

`git fetch origin` run. The primary checkout (`docs/eng-p3-002-ui-governance-chain-sync`) was 40
commits behind `origin/main` and carried 42 untracked, task-unrelated files (`WORKING_WITH_THE_FOUNDER/`,
governance/go-to-market docs, a zip archive) — confirmed with the Founder to be known, unrelated
material, left untouched. A fresh clean linked worktree was created at
`/Users/theo/11THONUS-identity-profile-b` on new branch `feat/identity-profile-b`, directly from
`origin/main` at `63c11f65cc372561960f66b75276bed31ce17357`. No git locks or incomplete operations.

## 2. Governing authority verified

- `FD-IDENTITY-DISPLAY-001` (`82bd5c6`) — confirmed ancestor of `origin/main` via the commit log
  (`63c11f6`'s own history includes it).
- `IDENTITY-PROFILE-A` implementation (`3a2e21f`, PR #189) and its independent review/closure-sync
  (`63c11f6`, PR #190) — both confirmed merged, present in `origin/main`'s own log.
- No `IDENTITY-PROFILE-B`/Package-G-completion/Package-F/Package-H branch or PR existed before this
  task (`git branch -a` — only `feat/identity-profile-a` and its review-closure-sync branch exist,
  both already merged).

## 3. `IDENTITY-PROFILE-A` dependency result

Read both the implementation report and the independent review report in full. Confirmed:
`getMyDisplayName`/`setDisplayName` callables exist, are fully tested (29 focused + 4 mass-assignment
regression tests), server-derive the caller's identity exclusively (no client-supplied target id
anywhere in the contract), return `{ displayName?: string }`/`{ displayName: string }` respectively,
and `IDENTITY-PROFILE-A`'s own report explicitly records "no `apps/web/` file was touched... adding
speculative shared types with no consumer would not be the smallest change" — this package is that
consumer, using the request/response shapes exactly as documented (§19 there).

## 4. Existing frontend architecture analysis

- No account/profile surface existed anywhere in `apps/web/src` (independently re-confirmed by
  directory listing, not merely trusted from the backend report).
- `authentication/` is sign-in only; `business/` is entirely Business-scoped (every hook/query/route
  takes a `businessId`) — Display Name is user-scoped, so it does not belong there.
- `RequireAuthenticatedUser` (route guard) and `BusinessApiProvider`/`useAuthenticatedActor`
  (actor-resolution pattern) are the two reusable platform primitives every existing authenticated
  route/mutation already builds on.
- `business/api/businessProfile.ts` + `business/dashboard/BusinessProfilePage.tsx` is the closest
  existing precedent for a governed-field read/edit screen (view → edit form → save → `MutationError`
  display), reused as the structural template for this package's own component.
- i18n (`I18N-001`): a single centralized `i18next` instance with `common`/`auth`/`business`
  namespaces, EN/FR resources bundled synchronously, and an existing structural EN/FR parity test
  (`i18n.test.tsx`) that automatically covers any new namespace added.

## 5. Implementation strategy

A new, small, self-contained `apps/web/src/identity/` module (mirroring `business/`'s internal
shape — `api/`, `hooks/`, a page component) plus one new authenticated route, `/profile`, wrapped
in the existing `RequireAuthenticatedUser` exactly like `/business`. `business/hooks/useAuthenticatedActor.ts`
and `business/api/authReference.ts` are generically useful but homed under `business/`; rather than
import identity code backwards through the Business domain, both were duplicated under `identity/`
(disclosed here, not silent), mirroring the exact "disclosed duplication" convention the backend
itself already established for `authenticatedIdentityActor.ts` vs. `authenticatedBusinessActor.ts`.

## 6. Route/access architecture

`/profile`, authenticated via the existing, unchanged `RequireAuthenticatedUser` — no second
authentication mechanism, no route parameter of any kind (confirmed: the route accepts no
`userId`/`:id` segment). `DisplayNameProfile` resolves its own identity via `useAuthenticatedActor`
exactly like every Business mutation; it never receives or accepts a target-user prop.

## 7. Profile-completion model

One reusable component, `DisplayNameProfile`, covers all three states from a single `getMyDisplayName`
read: **Incomplete** (no Display Name — the same form *is* the completion prompt, with a
"you haven't added a display name yet" hint), **Complete** (read view + "Edit display name" action),
**Edit** (the same form, prefilled from the current value). No separate implementation exists for
completion vs. later editing (Phase E). Nothing in `App.tsx`'s other routes, `RequireAuthenticatedUser`,
or any sign-in flow was touched — visiting `/business` or completing registration is unaffected,
preserving `DEC-IDENTITY-001`'s Standard Participation Principle exactly.

## 8. Existing-value/edit model

Clicking "Edit display name" prefills the form from the currently loaded value and does not call
any mutation. "Cancel" discards the draft and returns to the read view without saving (proven by a
dedicated test: `setDisplayName` is never called). A successful save invalidates the
`identity.myDisplayName` query and exits edit mode — the subsequent render reflects the refetched,
backend-authoritative value, never the local draft (Phase H).

## 9. Invitation/security separation

No Staff/invitation file was read or modified. `App.tsx`'s other routes are unchanged. No
`userId`/`customerIdentityId`/`targetUserId` field exists anywhere in this package's request shapes
— structurally proven by a dedicated adapter test (`toCallGetMyDisplayName(vi.fn()).length` is 1,
i.e. the function takes only an actor).

## 10. Existing-user handling

No fabrication: `readDisplayName`'s `{ displayName: undefined }` response renders the Incomplete
state's hint text and an empty field — never a value derived from email/phone/CustomerProfile/
Firebase Auth/invitation target (none of those are read anywhere in this package).

## 11. Read flow

`DisplayNameProfile` → `useMyDisplayNameQuery` → `makeCallGetMyDisplayName` (httpsCallable
`getMyDisplayName`) → `toCallWithActor` (attaches `rawToken`/`referenceType`) → backend. No direct
Firestore read anywhere (proven by `identity/noDirectFirestore.test.ts`).

## 12. Write flow

Form submit → `useSetDisplayNameMutation` → `makeCallSetDisplayName` (httpsCallable `setDisplayName`,
with a per-form `IdempotencyKeyHolder`) → backend validates/persists → `onSuccess` invalidates the
read query → UI re-renders from the refetch. Local draft state is discarded on success, never
displayed as if it were the saved value.

## 13. Backend-authoritative rehydration result

**PASS**, proven by a dedicated test: the mock `setDisplayName` and `getMyDisplayName` are wired so
the read reflects only what the mutation "persisted," and the UI's post-save text comes from that
refetch, not from the mutation's own return value or the local draft.

## 14. Validation result

**PASS**, mirroring `FD-IDENTITY-DISPLAY-001` §5 client-side for usability only (backend remains
authoritative): trim before enabling Save; empty/whitespace-only rejected (Save stays disabled);
51+ characters rejected with a visible, field-associated error (`aria-describedby`); no username
syntax restriction; no uniqueness check (a dedicated test proves a value is never blocked
client-side for "already existing" reasons — there is no such check to trigger).

## 15. EN result

All customer-facing copy is key-driven (`identity` i18n namespace) — proven by tests asserting exact
catalog string matches, not hard-coded literals.

## 16. FR result

French copy renders with no English leakage (dedicated test asserts the English "missing" string is
absent from the French-rendered container). The existing structural EN/FR parity test
(`i18n.test.tsx`) automatically covers the new `identity` namespace's key completeness — re-run and
green.

## 17. Mobile result

Not independently re-verified against a real signed-in browser session in this environment — no
authenticated Founder-QA credentials or emulator user were available here, and building a new
mocked dev-only harness (the established `DashboardHarnessPage` pattern) to work around that would
have expanded this package beyond its authorized "small profile route/component" scope for
uncertain benefit. What **was** verified: every element uses `min-h-11` (44px) explicitly for
touch targets, the same shared `TextField`/`Button`/`FieldError` Tailwind primitives already used
(and already reviewed) by `BusinessProfilePage`, and no fixed-width layout — structurally consistent
with this repository's existing verified responsive patterns, but not independently re-confirmed
pixel-for-pixel at 375×812 in a real browser. **Flagged honestly as a remaining verification gap**,
not silently claimed as done.

## 18. Tablet result

Same limitation and same structural basis as §17 — not independently re-verified in a real browser
in this environment.

## 19. Desktop result

Same limitation and same structural basis as §17 — not independently re-verified in a real browser
in this environment.

## 20. Accessibility result

Verified at the DOM/RTL level (jsdom does not render real layout, so this covers semantics/ARIA, not
visual layout): field has an associated `<label htmlFor>`; validation error is `role="alert"` +
`aria-describedby`-linked to the field; `aria-invalid` set only when invalid; every interactive
element is native (`<button>`/`<input>`) so keyboard operation and focus-visible styling come from
the existing shared primitives/global focus-ring CSS, unmodified; Save is `disabled` while a save is
in-flight (proven by the double-submit test) and while the value is invalid.

## 21. Error-state result

**PASS**, all covered by dedicated tests: loading (`profile.loading` text while the read query is
pending); missing Display Name (Incomplete-state hint); validation error (inline, field-associated,
client-side); backend rejection (mapped via `DisplayNameMutationError` to `identity.errors.*`, never
a raw message — proven by a dedicated "never leaks a raw error message" test); temporary failure
(`unavailable`/`timeout` mapped identically); successful save (never shown when the mutation threw —
proven by a dedicated test); retry (a failed save's idempotency key is retried by re-clicking Save,
proven to succeed on a subsequent attempt).

## 22. Security review

- **Self-owned operation only:** confirmed — `useAuthenticatedActor` resolves the actor from the
  live Firebase session; no prop/param anywhere accepts a different user's id.
- **No arbitrary target ID:** confirmed structurally (adapter function arity test) and by route
  design (`/profile` has no path parameter).
- **No `CustomerProfile` reads:** confirmed — no import of any `customerProfile`-related module
  anywhere in `identity/`.
- **No Firebase Auth profile fallback:** confirmed — `identity/` never reads `user.displayName`/
  email/phone as a data source; `useAuthenticatedActor` uses the Firebase user only to resolve
  `referenceType`/`getIdToken`, exactly like the existing Business pattern.
- **No directory/search:** confirmed — no list/search/lookup-by-name capability exists anywhere in
  this package.
- **No hidden profile expansion:** confirmed — the only field surfaced anywhere in `identity/` is
  `displayName`; no other field name appears in any type, form, or i18n key.
- **Backend validation remains authoritative:** confirmed — client-side checks mirror, but never
  replace, the server's own `normalizeDisplayName`; the backend's own validation is untouched by
  this task.
- **No raw identity/internal error leakage:** confirmed by dedicated test (`errors.*` catalog keys
  only, never a Firebase/internal message).

## 23. Direct-Firestore result

**PASS** — a dedicated structural test (`identity/noDirectFirestore.test.ts`) greps every non-test
file under `identity/` for `firebase/firestore` imports and `users` collection references; both
checks pass with zero offenders.

## 24. RED→GREEN evidence

- `identity/api/displayName.test.ts` — failed to resolve `./displayName` (module did not exist) →
  passed once `displayName.ts` was implemented (6/6).
- `identity/DisplayNameProfile.test.tsx` — failed to resolve `./DisplayNameProfile` → 14/15 passed
  once implemented; the one remaining failure was a genuine test-fixture bug (the mock for
  `getMyDisplayName` didn't reflect the saved value), fixed on the test, not the implementation →
  15/15 green.
- `i18n.test.tsx`'s existing structural EN/FR parity assertion re-run green after the new `identity`
  namespace was added to both catalogs.

## 25. Tests added/changed

- `apps/web/src/identity/api/displayName.test.ts` (new, 6 tests)
- `apps/web/src/identity/DisplayNameProfile.test.tsx` (new, 15 tests)
- `apps/web/src/identity/noDirectFirestore.test.ts` (new, 2 tests)
- `apps/web/src/App.test.tsx` (modified — 1 new test: `/profile` route auth-guard)

No existing test file's assertions were changed beyond that one addition.

## 26. Full validation

- **Focused Identity tests:** PASS (6 + 15 + 2 = 23/23), plus 1 new `App.test.tsx` test.
- **Full web unit suite:** PASS — 96 files, 619 tests total, on the corrected head (this package
  adds 3 new test files/24 new tests: 6 + 15 + 2 new, plus 1 new test in the existing `App.test.tsx`).
- **Full functions unit suite:** PASS — 145 files, 1583 tests, unchanged (no `functions/` file
  touched by this task).
- **Firebase Emulator Suite:** not run — no `functions/`/Firestore/Rules file was touched.
- **Typecheck:** `apps/web`: `tsc --noEmit` clean; `apps/web`: `tsc -b` (build-mode, stricter) also
  clean after one test-file fix (see Findings).
- **Lint:** `eslint` clean on all new/modified files.
- **Format:** `prettier --check` found 2 formatting issues in the new component/test files; fixed
  with `--write`, re-verified clean.
- **Build:** `pnpm run build` (`tsc -b && vite build`) succeeded.
- **Secret scan:** `git diff origin/main -- apps/web` grepped for key/secret/token/password/`AIza`/
  PEM-header patterns (excluding the pre-existing `idempotencyKey`/`rawToken`/`getIdToken`/
  `referenceType` identifiers) — no matches.
- **Playwright:** not run — no existing Playwright suite exercises `apps/web` component-level UI in
  this repository at the time of this task (only the RTL/Vitest suite covers component behavior);
  not introduced here as it would exceed this package's small, bounded scope.

No flake observed.

## 27. Files modified

- `apps/web/src/identity/api/authReference.ts` (new)
- `apps/web/src/identity/api/identityCallableClient.ts` (new)
- `apps/web/src/identity/api/idempotencyKeyHolder.ts` (new)
- `apps/web/src/identity/api/displayName.ts` (new)
- `apps/web/src/identity/api/displayName.test.ts` (new)
- `apps/web/src/identity/hooks/useAuthenticatedActor.ts` (new)
- `apps/web/src/identity/hooks/queryKeys.ts` (new)
- `apps/web/src/identity/hooks/displayNameQueries.ts` (new)
- `apps/web/src/identity/hooks/displayNameMutations.ts` (new)
- `apps/web/src/identity/DisplayNameMutationError.tsx` (new)
- `apps/web/src/identity/DisplayNameProfile.tsx` (new)
- `apps/web/src/identity/DisplayNameProfile.test.tsx` (new)
- `apps/web/src/identity/noDirectFirestore.test.ts` (new)
- `apps/web/src/App.tsx` (modified — one new import, one new `/profile` route; nothing else changed)
- `apps/web/src/App.test.tsx` (modified — one new test)
- `apps/web/src/i18n/config.ts` (modified — `identity` added to `resources`/`ns`)
- `apps/web/src/i18n/locales/en.ts` (modified — new `identity` block appended)
- `apps/web/src/i18n/locales/fr.ts` (modified — new `identity` block appended)
- This report (new)
- `docs/changes/IMPLEMENTATION_CHANGES.md` (appended entry)

No `functions/`, Rules, Firebase configuration, or dependency file was touched.

## 28. Code diff summary

13 new files under `apps/web/src/identity/` implementing the API adapter layer, React Query
hooks, error display, and the single reusable `DisplayNameProfile` component with its tests; one
new authenticated route wired into the existing `App.tsx`; one new i18n namespace (EN/FR) appended
without altering any existing key.

## 29. Commands executed

```
git fetch origin
git rev-parse HEAD / origin/main
git rev-list --left-right --count HEAD...origin/main
git status --short -uall
git log origin/main --oneline -i --grep "IDENTITY-DISPLAY-001" / "IDENTITY-PROFILE-A" / "IDENTITY-PROFILE-B" / "Package G"
git branch -a
git worktree add -b feat/identity-profile-b <path> origin/main
pnpm install --frozen-lockfile
npx vitest run src/identity/api/displayName.test.ts   (RED, then GREEN)
npx vitest run src/identity/DisplayNameProfile.test.tsx   (RED, then GREEN)
npx vitest run   (apps/web, full)
npx vitest run --config vitest.config.ts   (functions, full)
npx tsc --noEmit
npx eslint src/identity src/App.tsx src/App.test.tsx src/i18n
npx prettier --check / --write
pnpm run build
git diff origin/main -- apps/web | grep -inE "api[_-]?key|secret|password|token=|AIza|BEGIN (RSA|PRIVATE)"
```

## 30. Dependencies

None added or changed.

## 31. Config changes

None beyond the i18n namespace registration in `apps/web/src/i18n/config.ts` (adding `identity` to
the existing `resources`/`ns` arrays — no new dependency, no build config change).

## 32. Firebase/Rules/deployment changes

None. No deployment performed.

## 33. Findings

- **Build-mode (`tsc -b`) caught a test-file type error `tsc --noEmit` did not surface**
  (`DisplayNameProfile.test.tsx`'s spread of an untyped `vi.fn()`'s inferred zero-arg signature).
  Fixed on the test file only (removed the unnecessary argument spread) — no production code
  change. Reported as a finding because relying on `tsc --noEmit` alone during development would
  have missed this until `pnpm run build`.
- **Real-browser responsive/accessibility verification gap (§17-19):** genuine, not fixed —
  building a new mocked dev-only harness to reach a "signed-in" state without live Firebase
  credentials was judged out of this package's small, bounded scope; flagged for Founder-QA hosted
  preview verification instead, exactly like the AUTH packages' own precedent for hosted-preview
  steps.

## 34. Remaining material findings

None beyond §33.

## 35. Risks

- **Unverified real-browser responsive/a11y layout** (§17-19/§33) — DOM-level accessibility is
  proven; pixel-level mobile/tablet reflow is not independently confirmed in this environment.
- **No Playwright coverage** — consistent with the rest of this frontend's current test posture
  (no existing Playwright suite for `apps/web` component UI), not a regression introduced here.

## 36. Rollback

Revert the single commit on `feat/identity-profile-b`; the change is purely additive (new
`identity/` module + two small, clearly-bounded route/i18n registrations) with no persistence
migration, so rollback is a clean, isolated revert with no downstream dependency.

## 37. Persistent report path

`docs/05-implementation/reports/IDENTITY-PROFILE-B-display-name-profile-completion-ui-implementation-report-2026-08-27.md`
(this document).

## 38. Changes-tracking state

`docs/changes/IMPLEMENTATION_CHANGES.md` updated with a new dated entry immediately following the
`IDENTITY-PROFILE-A-REVIEW` entry.

## 39. PR number

Recorded once opened — see the companion draft PR for branch `feat/identity-profile-b`.

## 40. Final head SHA

Recorded once committed — see the companion commit for this branch.

## 41. CI result

Recorded once the PR's CI run completes.

## 42. `IDENTITY-PROFILE-B` status

Implemented, tested, submitted as a **draft PR** for Founder review. Not merged. Not self-merged.

## 43. Package G status

Unchanged — active-member completion not started, not touched by this task.

## 44. Package F/H status

Both unchanged — not started, not touched by this task.

## 45. `ENG-P3-002` status

Open. Not closed by this task.

## 46. Capability 3 status

Open. Not closed by this task.

## 47. Exact next Founder action

1. Review this draft PR (`feat/identity-profile-b`).
2. Perform a hosted-preview, authenticated real-browser pass at 375×812/390×844/tablet/desktop
   before merge, since this task could not reach a live authenticated session in its own
   environment (§17-19/§33) — matching the same "Founder-executed hosted-preview step" precedent
   already established for the AUTH packages.
3. Merge if satisfied; do not treat this PR as closing `ENG-P3-002` or Capability 3.

---

## Final gate

**IDENTITY-PROFILE-B READY FOR FOUNDER REVIEW — DISPLAY NAME PROFILE-COMPLETION UI IMPLEMENTED;
TEAM INTEGRATION NOT STARTED.**
