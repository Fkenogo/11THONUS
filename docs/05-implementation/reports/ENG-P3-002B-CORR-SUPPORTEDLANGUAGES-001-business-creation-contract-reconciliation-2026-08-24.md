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

## 7. Empty-array policy — precise disposition (revised by independent review, `ENG-P3-002B-CORR-SUPPORTEDLANGUAGES-001-REVIEW`)

**The original wording here overstated the evidence and has been corrected — no implementation
change resulted, only the characterization.** Three distinct claims must not be conflated:

1. **`[]` is valid/allowed** — directly, strongly evidenced. `ENG-P2-002A`'s independent review
   (`docs/05-implementation/reports/ENG-P2-002A-business-branch-domain-contracts-implementation-report-2026-08-17.md`,
   §Findings) found and TDD-fixed exactly this question for this exact field: TRD10 §10.6.3 types
   `supportedLanguages: string[]` with no stated minimum length, and both `business.ts`/
   `businessDocument.ts` were updated at that time to accept `[]`, validating only element-level
   well-formedness. Direct unit-test coverage (`business.test.ts`: "accepts an empty
   supportedLanguages array…") already exists, unmodified by this task. **This claim is fully
   supported.**
2. **`[]` is a governed *initial value* under the established required-reference-list precedent**
   — also evidenced, but by analogy, not by a rule written for this field. `ENG-P2-002A`'s own text
   quotes `customerProfile.ts`'s comment describing *that other field* as "governed reference
   lists, default empty" — cited there only to argue zero-length is *legitimate* for
   `supportedLanguages`, not to assert that `supportedLanguages` itself carries an identical
   "default empty" designation anywhere in its own governing text (TRD10 §10.6.3 never uses the
   word "default"). Treating the two fields as carrying the *same* governed-default status is an
   extrapolation this review narrows to: **`[]` is the best-supported value consistent with
   precedent, not an independently governed default for this specific field.**
3. **An explicit product policy stating "the default `supportedLanguages` for every Business is
   `[]`"** — **does not exist anywhere in the repository.** No design document, TRD, PRD, or prior
   implementation report makes this statement for `supportedLanguages` specifically.

## 8. Default-value disposition (reasoned choice, not a discovered policy)

Given item 7, this correction sends `[]` at creation because: (a) it is unconditionally valid per
item 7.1; (b) no onboarding step, wizard stage, or design section collects this field from the user
today (item 5's absence-of-alternative finding, independently reconfirmed by this review against
`OnboardingWizard.tsx`'s step list); and (c) it remains freely editable later via
`updateBusinessProfile` (item 4), so nothing is foreclosed by this choice. **This is this
correction's own reasoned disposition, presented as such — not a claim that repository governance
already mandated `[]` specifically.** Classified as Phase D Option A ("governed default exists")
in the sense that a real, on-point *legitimacy* precedent was cited and no value was invented
without support — but the Founder should read this as "the only value consistent with existing
governance and current product surface," not as "governance already decided this."

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

---

## Independent review addendum (2026-08-24, `ENG-P3-002B-CORR-SUPPORTEDLANGUAGES-001-REVIEW`)

Independent review re-derived every schema/governance claim directly from source rather than
trusting this report.

**Backend contract, re-derived independently:** confirmed exactly as originally reported — TRD10
`supportedLanguages: string[]` (no `?`); `parseSupportedLanguages` (`index.ts`) requires
`Array.isArray` + non-blank entries, never `length > 0`; domain model's `requireSupportedLanguages`
loops entries only (vacuously satisfied by `[]`). No discrepancy found.

**One genuine wording defect found and fixed (no implementation change):** the original §7/§8
blurred "`[]` is valid" (strongly evidenced), "`[]` is a governed initial value under precedent"
(evidenced by analogy, not a rule written for this field), and "an explicit policy states the
default is `[]`" (does not exist) into a single "governed default" characterization. Corrected —
see revised §7/§8 above and the two source-comment corrections in `createBusiness.ts` and
`NewBusinessPage.tsx`. No test, type, or runtime behavior changed by this correction.

**Onboarding-selection finding:** independently reconfirmed — `OnboardingWizard.tsx`'s
`STEP_ORDER` is `["classification", "branch", "terms", "team", "review"]`; no language-selection
step exists anywhere in the wizard, `NewBusinessPage`, or any design document. No source requires
Business owners to select supported languages during onboarding.

**Update/editability finding:** independently reconfirmed — `functions/src/domains/business/models/business.ts`'s
`BusinessProfilePatch.supportedLanguages?: string[]` and `apps/web/src/business/api/businessProfile.ts`'s
`BusinessProfilePatch.supportedLanguages: string[]` both already model this as a later-editable
field via `updateBusinessProfile`. Sending `[]` at creation does not foreclose future
configuration.

**Backend-not-relaxed verification:** confirmed — the diff touches zero backend production files;
`parseSupportedLanguages`/`requireSupportedLanguages` are byte-identical to before this correction
and before `ENG-P2-002A`. The backend was never weakened to accommodate the frontend fix.

**Frontend/backend field-by-field comparison (Priority items 6–7), performed fresh:**

| Field | Backend | Frontend (post-fix) | Match |
|---|---|---|---|
| `displayName` | required | required | ✓ |
| `primaryCategoryId` | required | required | ✓ |
| `countryCode` | required | required | ✓ |
| `currencyCode` | required | required | ✓ |
| `timezone` | required | required | ✓ |
| `city` | required | required | ✓ |
| `contactPhone` | required | required | ✓ |
| `supportedLanguages` | required | required (this fix) | ✓ |
| `idempotencyKey` | required (separately parsed) | required | ✓ |
| `legalName` | optional | optional | ✓ |
| `businessTypeId` | optional | optional | ✓ |
| `address` | optional | optional | ✓ |
| `contactEmail` | optional | optional | ✓ |
| `logoUrl` | optional | **absent from frontend type** | drift (harmless) |
| `subscriptionId` | optional | **absent from frontend type** | drift (harmless) |

**Result: every backend-required, client-supplied field now matches exactly — no other required
field is drifting.** `rawToken`/`referenceType` are intentionally supplied out-of-band via the
`AuthenticatedActor`/`toCallWithActor` mechanism, not part of `CreateBusinessRequest` — correct,
existing architecture, not a gap.

**New, minor, non-blocking finding:** `logoUrl` and `subscriptionId` are both backend-*optional*
fields absent from the frontend's `CreateBusinessRequest` type. Because they are optional on the
backend, this causes no rejection today — functionally harmless. It is, however, the same
underlying pattern (hand-maintained frontend type silently omitting a backend field) that caused
the `supportedLanguages` defect, just currently non-load-bearing. **Not fixed under this review**
(would exceed the bounded field-by-field comparison this task authorized, and the task explicitly
prohibits expanding into a shared-contract refactor) — recorded as a disclosed, low-priority
recurrence-risk observation alongside the existing contract-duplication finding (§14 above).

**Contract-duplication architecture:** independently reconfirmed intentional (every other Business
mutation request type in `apps/web/src/business/api/*.ts` is similarly hand-declared) — not
refactored, no shared-types package introduced, per this review's own explicit constraint.

**Test-quality verification, performed by deliberate reversion:** removed the `supportedLanguages: []`
line from `NewBusinessPage.tsx`'s submit payload and re-ran `NewBusinessPage.test.tsx` — the new
test failed with the exact same shape as the original RED evidence, confirming the test is genuine
and not vacuous. Restored the fix; reconfirmed 3/3 green. The emulator persistence test
(`businessRepository.emulator.test.ts`) was independently re-read: it asserts
`toEqual([])` (not a truthy/vacuous check), plus `displayName`/`countryCode`/`currencyCode`/`status`
unaffected and the default Branch document exists — a real, specific, non-trivial assertion set.

**No unrelated change found:** Firestore Rules, App Check, CSP, Commerce Knowledge, Staff
permissions, Terms configuration, Cloud Functions deployment config, and production/staging are all
confirmed untouched by this correction (diff scope limited to the 5 originally-listed files plus
this review's 2 wording-only edits).

**Full validation, re-run fresh by this review:** web suite — pass; functions suite — pass;
emulator validation — pass (new integration test reconfirmed); Playwright — pass; typecheck — pass;
lint — pass (0 errors, 1 pre-existing unrelated warning); format — pass; ordinary build — pass;
`founder-qa-preview` build — pass; secret scan — clean. (Full counts recorded in the completion
report's item 13.)

**Findings classification:** one F2 (wording precision, fixed, no implementation impact). One new
F1/F2 observation (`logoUrl`/`subscriptionId` drift, disclosed, not fixed — non-blocking). Zero
F3/F4. **No unresolved material finding.**
