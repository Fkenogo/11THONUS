# ENG-P3-002B-CORR-SUPPORTEDLANGUAGES-001 — Business Creation `supportedLanguages` Contract Reconciliation

**Date:** 2026-08-24
**Task:** Resolve the hosted-preview defect where `createBusiness` rejects Business creation
because the backend requires `supportedLanguages` while the frontend never sends it. Re-derive the
intended contract from authoritative sources before touching code — do not assume the backend
should be weakened, and do not silently invent a default value.

## 1. Entry SHA

`origin/main` confirmed at `d0a1fdd8148b1aa54fe56bb7d5fd6d7d640e9ce8` (PR #167 merged, preview
recovery evidence current). No overlapping correction branch/PR found.

## 2. Worktree/branch

Fresh detached-HEAD `git worktree`, now removed; committed on
`fix/eng-p3-002b-corr-supportedlanguages-001`.

## 3. Exact hosted failure reproduced

Captured in the immediately preceding session (`ENG-P3-002C-PREVIEW-001-RECOVERY-001`) against this
exact hosted preview via an injected `fetch` interceptor on the real callable response:

```json
{"error":{"details":{"field":"supportedLanguages"},"message":"business_creation_failed","status":"INVALID_ARGUMENT"}}
```

Preview reachability at `/business/new` reconfirmed (`200`) at the start of this task.

## 4. Backend `supportedLanguages` contract

`functions/src/index.ts`'s `parseSupportedLanguages` requires the value to be a real array
(`Array.isArray(value)`) of non-blank strings — `undefined` (never sent) fails this check
unconditionally, which is exactly the observed rejection. Critically, the check does **not**
require `value.length > 0` — an empty array `[]` already satisfies it. The domain model
(`functions/src/domains/business/models/business.ts`'s `requireSupportedLanguages`) independently
confirms the same: only element-level well-formedness (each entry non-blank) is validated, no
minimum cardinality.

## 5. Semantic meaning of `supportedLanguages`

**No governing source defines it precisely.** Searched PRD3 (Business Registration — zero mentions
of "language" anywhere), TRD10 §10.6.3 (types it `string[]`, no description), `ENG-P3-002-DESIGN-001`
(discusses "language" only for platform UI/EN-FR mechanics and Terms `languageCode`, never this
Business field), and the onboarding wizard's own step list (`classification`, `branch`, `terms`,
`team`, `review` — no language-selection step exists or was ever referenced). The field's own
comment in `business.ts` gives no semantic gloss either — only a validation-shape note. This
question could not be conclusively answered from repository sources.

## 6. Required/optional determination

**Required and present** at Business creation — TRD10 §10.6.3 types it `string[]` with no `?`,
and both the backend parser and domain model reject a missing/non-array value unconditionally.
**Mutable later**: `functions/src/domains/business/models/business.ts`'s `BusinessProfilePatch`
type includes `supportedLanguages?: string[]` (optional at patch time, i.e. update-if-provided),
confirmed consumed by `updateBusinessProfile`; the frontend's own `apps/web/src/business/api/businessProfile.ts`
already includes `supportedLanguages: string[]` in `BusinessProfilePatch` — the creation-side
contract was the only place omitting it.

## 7. Empty-array policy

**Explicitly governed, not silently invented.** `ENG-P2-002A`'s independent review
(`docs/05-implementation/reports/ENG-P2-002A-business-branch-domain-contracts-implementation-report-2026-08-17.md`,
§Findings) found and TDD-fixed exactly this question for this exact field: "TRD10 §10.6.3 types
the field `string[]` (required, present) with no stated minimum length… the platform's own
precedent for required array fields (`customerProfile.ts`'s `interests`/`preferredCategories`:
'governed reference lists, default empty') confirms zero-length is legitimate." Both `business.ts`
and `businessDocument.ts` were updated at that time to accept `[]`, with direct unit-test coverage
(`business.test.ts`: "accepts an empty supportedLanguages array…") already present and unmodified
by this task.

## 8. Default-policy finding

Given items 6–7, `[]` is the correct, already-governed value to send at creation — not a value this
task chose freely. No document states "supportedLanguages defaults to `[]` at creation" in those
exact words, but the domain-model-level governance (item 7) combined with the complete absence of
any onboarding-UI plan for this field (item 5) makes `[]` the only defensible reading: nothing in
the repository asks the user to select this at creation, and the platform's own established
precedent for exactly this class of field is to default it empty. **Classified as Phase D Option A
(governed default exists) — not Option D (STOP)**, because a specific, on-point governance
precedent exists and was cited, not inferred generically from "the platform supports EN/FR" (which
this task's own instruction correctly warns against).

## 9. Existing frontend contract mismatch

`apps/web/src/business/api/createBusiness.ts`'s `CreateBusinessRequest` type never declared
`supportedLanguages` at all — a plain, independently-maintained type, not imported from or checked
against the backend's own `CreateBusinessRequest` (`functions/src/domains/business/models/businessBootstrap.ts`).
`NewBusinessPage.tsx`'s `handleSubmit` constructed its mutation payload from exactly the seven form
fields it collects, with no eighth field for something the UI never asks about.

## 10. Root cause

Two independently-maintained `CreateBusinessRequest` types (frontend, backend) drifted: the backend
type has always included `supportedLanguages` (TRD10-derived), the frontend type simply never
gained it — most plausibly an oversight from whenever the frontend type was authored, predating or
independent of the backend's TRD10-driven shape. Firebase Callable Functions have no compile-time
contract enforcement across the client/server boundary (the wire payload is untyped `unknown` on
the server, and the client's `httpsCallable` call is typed only by whatever local interface the
frontend author declares) — so nothing in either package's own `tsc` run could ever have caught
this drift. It surfaces only at runtime, when the server's own parser rejects the missing field —
exactly what the hosted preview demonstrated.

## 11. Chosen correction

**Option A** — implemented the governed default: `NewBusinessPage.tsx` now sends
`supportedLanguages: []` unconditionally at creation, and `CreateBusinessRequest` (frontend) now
declares the field as required, matching the backend's actual contract.

## 12. Why backend was or was not changed

**Not changed.** The backend already correctly accepts `[]` (item 4/7) — it was never the source of
the defect. The task's own instruction explicitly warns against relaxing the backend "merely to
make preview creation succeed"; no relaxation was needed or performed.

## 13. Why frontend was or was not changed

**Changed, minimally.** `CreateBusinessRequest` gained the one missing required field (matching
backend truth exactly, no invented shape), and `NewBusinessPage.tsx` now supplies its governed
default value. No other field, component, or route touched.

## 14. Contract-duplication finding

Frontend and backend each independently declare their own `CreateBusinessRequest` type — no shared
package/types boundary exists in this repository (frontend and Cloud Functions are genuinely
separate deployable units with no common `@11thonus/shared-types`-style dependency). **This is the
existing, intentional architecture** (every other Business mutation request/response type in
`apps/web/src/business/api/*.ts` is similarly hand-declared, mirroring but not importing its backend
counterpart) — not something this correction introduced or should refactor. Per this task's own
constraint ("do not perform broad contract refactoring unless necessary for the correction"), no
shared-contract package was introduced. **Risk disclosed, not fixed:** this same class of drift
(a required backend field silently absent from a hand-maintained frontend type) can recur for any
future backend field addition, since nothing enforces cross-package shape equality at compile time
or in CI. A future, separately-authorized task could consider a shared-types package or a
build-time contract-equality test; out of scope here.

## 15. RED → GREEN evidence

- **`NewBusinessPage.test.tsx`** — new test: "sends the governed default empty supportedLanguages
  array createBusiness requires…". **RED:** failed against the pre-fix code
  (`expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({ supportedLanguages: [] }), …)`
  — the mutation payload had no such key). **GREEN:** passes after `NewBusinessPage.tsx`'s fix.
- **Typecheck as a second RED→GREEN signal:** after widening `CreateBusinessRequest`, `tsc -b`
  immediately failed on the pre-existing `createBusiness.test.ts` fixture
  (`Property 'supportedLanguages' is missing…but required in type 'CreateBusinessRequest'`) —
  direct proof the widened type now structurally enforces the contract this task set out to close.
  Fixed by adding `supportedLanguages: []` to that fixture; typecheck clean afterward.
- **`businessRepository.emulator.test.ts`** — new integration test (Phase G, below) proving
  persistence; run against the real Firebase Emulator Suite, passed.

## 16. Tests added/changed

- `apps/web/src/business/onboarding/NewBusinessPage.test.tsx` — 1 new test.
- `apps/web/src/business/api/createBusiness.test.ts` — existing test's fixture updated (2 lines) to
  include the now-required field.
- `functions/src/domains/business/repositories/businessRepository.emulator.test.ts` — 1 new
  emulator-backed integration test.

## 17. Persistence result (Phase G)

New emulator test: authenticated flow through `bootstrapBusiness` with `supportedLanguages: []` —
`business.data()["supportedLanguages"]` persisted as `[]` exactly; `displayName`/`countryCode`/
`currencyCode`/`status` (`draft`) all unaffected; default Branch persisted (`businessBranches` doc
exists, correctly linked by `businessId`). No unrelated Business field changed. Test passed against
the real Firebase Emulator Suite (170s run, 684/686 passed, 2 pre-existing skips, 0 failed).

## 18. Full validation

- Web unit suite: **505/505** (78 files) — one new test added, all passing, no regression.
- Functions unit suite: **1563/1563** (143 files) — untouched, confirmed no regression.
- Emulator validation: **684/686 passed, 2 skipped, 0 failed** (one more pass than the prior
  session's 683 — the new integration test).
- Playwright: **1/1** (`app-shell.spec.ts`).
- Typecheck: clean (both packages) — see item 15 for the interim RED this task deliberately
  produced and then fixed.
- Lint: clean (0 errors, 1 pre-existing unrelated warning).
- Format: clean.
- Ordinary `pnpm build`: clean.
- `pnpm run build:founder-qa-preview`: clean — preview-auth chunk, no `TEST_ONLY`, no secrets.
- Secret scan (diff + built `dist/`): zero matches beyond benign `idempotencyKey` field-name hits.

## 19. Files modified

`apps/web/src/business/api/createBusiness.ts`, `apps/web/src/business/api/createBusiness.test.ts`,
`apps/web/src/business/onboarding/NewBusinessPage.tsx`,
`apps/web/src/business/onboarding/NewBusinessPage.test.tsx`,
`functions/src/domains/business/repositories/businessRepository.emulator.test.ts`. Plus this report
and a matching `IMPLEMENTATION_CHANGES.md` entry (committed separately, docs-only).

## 20. Code diff summary

+66/−1 across 5 files. One new required field on one frontend type; one new default-value line in
one submit handler; three test-fixture/test-case additions. No backend production logic changed.

## 21. Commands executed

`git fetch origin`; `git worktree add … d0a1fdd`; `pnpm install --frozen-lockfile`;
`pnpm vitest run` (per-file, RED then GREEN, repeated); `pnpm run typecheck` (RED→GREEN on the
fixture); `pnpm --filter functions run test`; `pnpm run emulators:validate`; `pnpm run test:e2e`;
`pnpm run lint`; `pnpm run format:check`; `pnpm run build`; `pnpm run build:founder-qa-preview`;
`git diff`/`git status` (scope + secret scan).

## 22. Dependencies/config changes

None.

## 23. Firebase/Rules/deployment changes

**None.** No `firebase deploy` command run. No Rules, Functions, Hosting, App Check, reCAPTCHA, CSP,
Commerce Knowledge, Staff permissions, or Terms configuration touched.

## 24. Findings

- Confirmed backend correctness (already accepted `[]`) — no backend defect.
- Confirmed the exact frontend omission and its root cause (independent, hand-maintained contract
  types with no cross-package enforcement).
- Confirmed a governed precedent for the `[]` default exists (`ENG-P2-002A`'s independent review),
  avoiding a silent/invented default.
- Disclosed, not fixed: the semantic meaning of `supportedLanguages` remains undocumented anywhere
  in the repository; a future task should decide whether an onboarding language-selection step is
  ever warranted (Option B was considered and rejected for now — no design or wizard-step evidence
  supports building UI that isn't governed to exist).
- Disclosed, not fixed: the same duplicated-contract-type pattern can silently drift again for any
  future backend field addition — no compile-time or CI guard exists against it.

## 25. Remaining material findings

None blocking. Both disclosures above are informational/future-scope, not defects in this
correction.

## 26. PR number

(recorded after opening — see report update)

## 27. Final head

(recorded after opening — see report update)

## 28. CI result

(recorded after opening — see report update)

## 29. `ENG-P3-002B` correction status

`ENG-P3-002B-CORR-SUPPORTEDLANGUAGES-001` — code ready for review, not yet deployed. Resolves the
Business-creation blocker discovered during `ENG-P3-002C-PREVIEW-001-RECOVERY-001`.

## 30. `ENG-P3-002C` status

Unchanged — integration validation merged; DEV preview operational; Founder QA ready/pending. This
correction, once reviewed/merged and redeployed, is expected to unblock the remainder of the
Founder QA checklist (Business creation onward) — but that redeployment is a separate, not-yet-
authorized task.

## 31. `ENG-P3-002` status

Unchanged — Open, blocked on Founder QA and `DEC-LEGAL-002`.

## 32. Capability 3 status

Unchanged — Open, partially implemented, not closed.

## 33. Risks

- The undocumented semantic meaning of `supportedLanguages` (item 5) means a future onboarding
  redesign could reasonably want to add a language-selection step — this correction does not
  foreclose that, since the field remains editable later via `updateBusinessProfile`.
- The duplicated-contract-type architecture (item 14) can silently drift again for any other future
  backend field addition — disclosed, not mitigated by this task.

## 34. Rollback

`git revert` the merge commit once merged — entirely additive/corrective, no schema, data, or
deployed-resource impact; reverting restores the pre-correction (broken) state, not a regression
risk to anything else.

## 35. Persistent report path

This document.

## 36. Exact next Founder action

Review and merge the resulting PR, then authorize a fresh, bounded deployment task (rebuild
`founder-qa-preview` from the merged fix, redeploy the existing Hosting preview channel only) to
verify Business creation now succeeds end-to-end on the hosted preview, before resuming the
remainder of the Founder QA checklist.

## Final gate

**ENG-P3-002B-CORR-SUPPORTEDLANGUAGES-001 READY FOR FOUNDER REVIEW — NO DEPLOYMENT PERFORMED**
