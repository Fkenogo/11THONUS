> **Title:** `ENG-P2-001-09` — Identity Query and Lookup Interfaces — Implementation Report
> **Status:** Implemented — awaiting Founder-authorized review/merge
> **Date:** 2026-08-05
> **Author:** Claude (AI agent), per Founder task "ENG-P2-001-09: Identity Query and Lookup Interfaces"
> **Depends on:** `ENG-P2-001-01` (merged, PR #57), `-03` (merged, PR #58), `-04` (merged, PR #59), `-05` (merged, PR #60), `-06` (merged, PR #61), `-07` (merged, PR #62), `-08` (merged, PR #63 — merge commit `35d714724c9dfd38079e2aa586cf6e604d7ebd0f`)

---

## 1. Executive Summary

The Founder authorized implementation of `ENG-P2-001-09` — the bounded, exact-match-only Identity Query and Lookup layer for Customer Identity. Four lookup functions resolve an already-existing identity by one of its four permanent identifiers (Customer Identity ID, Loyalty Number, QR reference, Authentication Reference) to a bounded result — never full profile data, never a fuzzy/partial/wildcard/prefix match, never an identity creation or mutation. A caller-declared, closed `IdentityLookupPurpose` gates each lookup type against a small hardcoded allow-list (not a role/permission system), and audit-worthy attempts (support/recovery/authentication purposes, or any failed QR lookup) emit a privacy-safe `IdentityLookupAttempted` event. No new Firestore collection, index, or Rules change was required — every lookup reuses an already doc-ID-keyed collection through its owning domain's existing (or one newly added, narrowly-scoped) repository function.

## 2. Starting Repository State

`origin/main` at `ENG-P2-001-08`'s merge commit, `35d714724c9dfd38079e2aa586cf6e604d7ebd0f` — `ENG-P2-001-01`, `-03`, `-04`, `-05`, `-06`, `-07`, `-08` all merged and present, confirmed by direct file inspection (`customerIdentityRepository.ts`, `loyaltyNumberRepository.ts`, `qrIdentityRepository.ts`, `identityLifecycleRepository.ts`, `identityRecoveryRepository.ts`, `authenticationReferenceRepository.ts` all present with passing pre-edit tests).

## 3. Clean Worktree Confirmation

New isolated worktree created via `git worktree add -b feat/eng-p2-001-09-identity-query-lookup <path> origin/main`. Verified before any edit: `git status --short` empty; `git rev-list --left-right --count origin/main...HEAD` = `0 0`; no `.git/rebase-merge`, `.git/rebase-apply`, or `.git/MERGE_HEAD` present; `ENG-P2-001-01`/`-03`–`-08` confirmed present; pre-edit `functions` unit suite green (333/333). The dirty primary checkout (`/Users/theo/11THONUS`) was never touched, switched, stashed, reset, or cleaned at any point in this task.

## 4. Starting SHA

`35d714724c9dfd38079e2aa586cf6e604d7ebd0f` (the `ENG-P2-001-08` merge commit).

## 5. Stage B Analysis (18 required points)

Delivered in full in chat before any edit began. Summary of the load-bearing findings:

1. **Current identity repositories:** `customerIdentityRepository.ts`, `identityLifecycleRepository.ts`, `identityRecoveryRepository.ts`, `authenticationReferenceRepository.ts` — none exposed a general-purpose, bounded "resolve an identifier to an identity reference" function usable outside a specific write flow.
2. **Persistence ownership:** `users/{id}` (identity), `customerProfiles/{id}` (mutable profile pointers), `loyaltyNumbers/{value}`, `qrIdentityRecords/{qrReference}`, `authenticationReferences/{referenceType}:{referenceId}` — `-09` owns none of these; read-only.
3. **Existing lookup capabilities:** `getCustomerIdentityById` (too broad a result), `getActiveQrIdentityByReference` (exactly matches `-09`'s QR requirement, reused unmodified), no reverse Authentication-Reference-to-identity lookup existed.
4. **Uniqueness guarantees:** all four collections doc-ID-as-value or doc-ID-as-key — every lookup is a single deterministic `.get()`.
5. **Repository boundaries:** cross-domain reads always go through the owning domain's own exported repository function (never raw Firestore access from another domain) — followed unchanged.
6. **Authoritative identifiers:** Customer Identity ID (the identity itself); Loyalty Number/QR (authoritative permanent pointers); Authentication Reference (authoritative only for uniqueness, `-08`).
7. **Public-but-non-secret identifiers:** Loyalty Number and QR reference — customer-presentable by design (PRD2 §12, physical QR display); "possession of Loyalty Number is never authentication" (matching `-08`'s established boundary).
8. **Lookup privacy risks:** returning more than a bounded reference would leak profile/PII through a channel with no UI/API boundary of its own yet.
9. **Enumeration risks:** Loyalty Number (~6.2M combinations) and QR reference are guessable at scale without rate limiting; a resolved-vs-not-found response-shape difference is itself a probing vector.
10. **Merchant-assisted lookup:** no Purchase/Transaction domain exists to bind a transaction context to (confirmed by repo search); `merchant_transaction` purpose scoped to Loyalty Number/QR only, never Customer Identity ID or Authentication Reference — actual transaction-context binding deferred.
11. **Support lookup:** broadest resolution surface (all four types); audit-worthy.
12. **Recovery lookup:** `-07`'s own recovery orchestration is unmodified by this task (out of scope) — `-09`'s `recovery` purpose covers Customer-Identity-ID/Loyalty-Number/QR only, matching `-07`'s own already-disclosed Authentication-Reference-resolution deferral, not extended here.
13. **Authentication lookup:** the only concrete use case is resolving by Authentication Reference — `authentication` purpose scoped to that lookup type only.
14. **QR lookup:** `getActiveQrIdentityByReference` unchanged; `-09`'s own boundary further collapses its "unknown" vs "invalidated" distinction into one error (see point 9 resolution below).
15. **Loyalty Number lookup:** format validation before any Firestore read; cross-domain error (`LoyaltyNumberDomainError`) normalized into the Identity error framework at the boundary.
16. **Firestore index implications:** none — every lookup is a doc-ID `.get()`, never a `where()` query.
17. **Firestore Rules implications:** all four backing collections already deny-by-default (three explicit, `authenticationReferences` via the catch-all, confirmed by `-08`'s own Rules tests); no new client-facing path introduced; no Rules change, no new Rules tests (unlike `-05`/`-07`/`-08`, which each added a genuinely new collection).
18. **Files expected to change:** listed and matched exactly by the final diff — see §19/§20.

**Disclosed design resolution (not silently assumed):** "unknown identifier" and "identifier exists but is not currently active" (invalidated QR, unlinked Authentication Reference) are deliberately collapsed into the single `identityLookupNotFoundError` at the `-09` boundary — a caller of these functions cannot distinguish "never existed" from "existed but is no longer active." The underlying `-04`/`-08` repositories keep their own more specific errors unchanged; this is a stricter enumeration-resistance posture applied narrowly at the new lookup surface.

## 6. Lookup Model

> **Superseded 2026-08-05 — see [§38 Correction](#38-correction-2026-08-05--founder-review-lookup-purpose-and-result-minimisation-clarification).** The purpose allow-list table below and the `authenticationReferences` field shown as always-present were both revised following Founder review, before PR #64 merge. This section is retained as the as-built record of the original submission; §38 is authoritative.

Every lookup function shares one shape: (a) format-validate the raw input, failing closed before any Firestore read on malformed input; (b) check the caller-declared `IdentityLookupPurpose` against a hardcoded per-lookup-type allow-list, failing closed with `identityLookupPurposeNotPermittedError` on an unlisted purpose; (c) resolve via the owning domain's existing (or newly added) repository function; (d) convert any "not found"/"invalidated"/"unlinked" outcome into the single `identityLookupNotFoundError`; (e) return a bounded `IdentityLookupResult`, never a full aggregate. No fuzzy, partial, wildcard, or prefix matching exists anywhere — every path is an exact doc-ID `.get()`.

```ts
export type IdentityLookupPurpose =
  | "authentication" | "recovery" | "internal_service" | "merchant_transaction" | "support";

export type IdentityLookupResult = {
  customerIdentityId: string;
  status: IdentityStatus;
  authenticationReferences: AuthenticationReference[];
};
```

Purpose allow-lists (hardcoded, not a role/permission system):

| Lookup type | authentication | recovery | internal_service | merchant_transaction | support |
|---|---|---|---|---|---|
| Customer Identity ID | ✗ | ✓ | ✓ | ✗ | ✓ |
| Loyalty Number | ✗ | ✓ | ✓ | ✓ | ✓ |
| QR reference | ✗ | ✓ | ✓ | ✓ | ✓ |
| Authentication Reference | ✓ | ✗ | ✓ | ✗ | ✓ |

## 7. Customer Identity Lookup

`lookupCustomerIdentityById` — rejects an empty/blank ID before any read (`malformedIdentityLookupError`); reuses a direct `users/{id}` doc-ID `.get()` (the same path `getCustomerIdentityById` reads); returns `identityLookupNotFoundError` for an unknown ID. Permitted purposes: `recovery`, `internal_service`, `support`.

## 8. Loyalty Number Lookup

`lookupCustomerIdentityByLoyaltyNumber` — validates format via the existing `createLoyaltyNumber` (canonical `DEC-DATA-007` pattern), catching and normalizing its `LoyaltyNumberDomainError` into `malformedIdentityLookupError`; resolves via the newly exported `getLoyaltyNumberAssignmentByValue` (a one-line doc-ID `.get()` added to the existing `loyaltyNumberRepository.ts`, mirroring `-07`'s own inline pattern rather than duplicating it a third time); exact match only — a near-miss value never resolves. Permitted purposes: `recovery`, `internal_service`, `merchant_transaction`, `support`.

## 9. QR Lookup

`lookupCustomerIdentityByQrReference` — validates format via the existing `createQrReference`; resolves via the unmodified, already-merged `getActiveQrIdentityByReference` (`-04`), which already fails closed identically for invalidated and unknown references; both outcomes normalize to `identityLookupNotFoundError` at this boundary. Permitted purposes: `recovery`, `internal_service`, `merchant_transaction`, `support`. Every failed QR lookup is audited regardless of purpose (the brief's own named "likely candidate").

## 10. Authentication Reference Lookup

`lookupCustomerIdentityByAuthenticationReference` — rejects an empty reference ID before any read; resolves via a new `getActiveAuthenticationReferenceOwner` (added to the existing `authenticationReferenceRepository.ts`, since it already owns the `authenticationReferences` collection) — active-only, mirroring `-04`'s own active-only QR pattern: a never-linked and a previously-unlinked reference both resolve identically (`undefined`), never distinguished, since cross-identity ownership is structurally guaranteed unique by `-08`'s own invariant. Permitted purposes: `authentication`, `internal_service`, `support`.

## 11. Result Model

> **Superseded 2026-08-05 — see [§38 Correction](#38-correction-2026-08-05--founder-review-lookup-purpose-and-result-minimisation-clarification).** `authenticationReferences` is now optional and purpose-gated, not always present.

`IdentityLookupResult` carries only `customerIdentityId`, `status`, and `authenticationReferences` (the existing, already-governed `-01` reference-only value objects — no token, OTP detail, or credential). Never phone, email, trust score, verification evidence, purchase history, rewards, or `customerProfiles` fields — confirmed by a dedicated negative test asserting none of those keys are ever present.

## 12. Enumeration Controls

Every lookup is exact-match only — no prefix, partial, or wildcard path exists in the type signatures or implementation. "Unknown" and "exists but inactive" collapse to one error (§5 disclosure). No platform-wide rate limiting is implemented (explicitly deferred, per the brief); the boundary is designed for it — every lookup already funnels through one `runLookup` helper per call, the natural insertion point for a future rate limiter.

## 13. Repository Changes

**New:** `identityLookupRepository.ts` (the four lookup functions, purpose gating, audit emission). **Additive to existing repositories:** `getLoyaltyNumberAssignmentByValue` (new, `loyaltyNumberRepository.ts`), `getActiveAuthenticationReferenceOwner` (new, `authenticationReferenceRepository.ts`). **Reused unmodified:** `getActiveQrIdentityByReference` (`-04`), `fromUserDocument` (`-05`), `createLoyaltyNumber` (`-03`), `createQrReference` (`-04`). No identity state duplicated; no parallel index introduced.

## 14. Firestore Rules Assessment

No change. All four backing collections already deny-by-default (confirmed live in `firestore.rules`, unchanged by this task); no new collection or client-facing path was introduced. No new Rules tests added — the existing `-05`/`-07`/`-08` Rules tests already cover every collection this task reads from, and per this task's own instruction ("if current deny-by-default already protects the new behaviour: do not modify Rules"), adding tests for an unmodified posture on already-tested collections would be redundant, not required.

## 15. Audit Assessment

A new `IdentityLookupAttempted` event is emitted for: any `support`/`recovery`/`authentication`-purpose lookup (any outcome), any `purpose_not_permitted` rejection (any lookup type/purpose), and any failed QR lookup regardless of purpose (the brief's own named candidates). Ordinary `internal_service`/`merchant_transaction` successes are not audited, to avoid emitting on every routine scan. The event never carries the raw looked-up value, phone, email, or token — only the resolved identity reference (`null` on any non-resolved outcome), lookup type, purpose, and outcome — confirmed by a dedicated negative test.

## 16. Error Model

Three new factories added to the existing `identityErrors.ts` (reusing existing `ErrorCategory` values, no new category): `invalidIdentityLookupPurposeError` (`VALIDATION_FAILED`), `malformedIdentityLookupError` (`VALIDATION_FAILED`), `identityLookupNotFoundError` (`RESOURCE_NOT_FOUND`), `identityLookupPurposeNotPermittedError` (`AUTH_FORBIDDEN`). No raw Firestore error is ever surfaced — confirmed by a dedicated test asserting no `token`/`credential`/`oauth` substring ever appears in a thrown error's message.

## 17. Files Inspected (unchanged)

`customerIdentityRepository.ts`, `userDocument.ts`, `identityLifecycleRepository.ts`, `identityRecoveryRepository.ts`, `qrIdentityRepository.ts`, `qrReference.ts`, `qrIdentityErrors.ts`, `loyaltyNumber.ts`, `loyaltyNumberDocument.ts`, `loyaltyNumberErrors.ts`, `authenticationReference.ts`, `identityStatus.ts`, `transitionAuthority.ts`, `transitionReason.ts`, `firestore.rules`, `firestore.indexes.json`.

## 18. Files Created

`functions/src/domains/identity/models/identityLookupPurpose.ts` (+`.test.ts`); `functions/src/domains/identity/repositories/identityLookupRepository.ts` (+`.emulator.test.ts`); this report.

## 19. Files Modified

`identityErrors.ts`/`.test.ts` (4 new factories); `identityEvents.ts`/`.test.ts` (1 new event, `IdentityLookupAttempted`); `authenticationReferenceRepository.ts`/`.emulator.test.ts` (1 new exported function, `getActiveAuthenticationReferenceOwner`); `loyaltyNumberRepository.ts`/`.emulator.test.ts` (1 new exported function, `getLoyaltyNumberAssignmentByValue`). `docs/changes/IMPLEMENTATION_CHANGES.md`, `docs/00-governance/documentation-changes-log.md`, `docs/05-implementation/change-tracking/engineering-implementation-programme.md`, `docs/05-implementation/roadmap/ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md` (narrow `-09`-only status notes).

## 20. Diff Summary

12 files touched (4 new, 8 modified) in `functions/`; 4 documentation/tracking files. No `firestore.rules`, `firestore.indexes.json`, `package.json`, or `pnpm-lock.yaml` change. No unrelated application file modified.

## 21. Tests

- **`identityErrors.test.ts`:** 4 new tests (one per new factory).
- **`identityEvents.test.ts`:** 3 new tests for `buildIdentityLookupAttemptedEvent` (resolved outcome carries the identity; not-found outcome carries no identity, aggregate `"unresolved"`; never carries the raw value/phone/email/token).
- **`identityLookupPurpose.test.ts` (new, 7 tests):** each of the 5 known purposes accepted; unrecognised/empty rejected.
- **`loyaltyNumberRepository.emulator.test.ts`:** 2 new tests for `getLoyaltyNumberAssignmentByValue` (issued value resolves; unknown value returns `undefined`).
- **`authenticationReferenceRepository.emulator.test.ts`:** 3 new tests for `getActiveAuthenticationReferenceOwner` (active resolves; unlinked returns `undefined`; never-linked returns `undefined`).
- **`identityLookupRepository.emulator.test.ts` (new, 22 tests):** covers every minimum test the brief names — Customer Identity ID (existing/unknown/malformed/purpose-not-permitted/no-PII-leak); Loyalty Number (valid/malformed/unknown/near-miss-never-matches/purpose-not-permitted); QR (active/invalidated/unknown/purpose-not-permitted); Authentication Reference (active/inactive/cross-identity-never-crosses/purpose-not-permitted/no-credential-in-error); plus 3 dedicated audit-event tests (support-purpose emits; failed QR emits regardless of purpose; ordinary internal-service success does not emit).

All TDD steps followed RED→GREEN: every new test file/addition was run against the pre-existing implementation (confirmed failing — "Cannot find module" for brand-new files, `TypeError: ... is not a function` for new exports on existing files) before implementation, then GREEN after. `identityLookupRepository.ts` passed all 22 tests on the first implementation pass.

## 22. Validation

- `pnpm lint` — clean (one `no-useless-assignment` finding self-corrected before final commit).
- `pnpm format:check` — clean (after `prettier --write` on 5 files).
- `npx tsc --noEmit` — clean; confirmed again via `pnpm build` (both workspaces clean).
- `functions` unit tests: **347/347** (333 pre-existing + 14 new).
- `apps/web` unit tests: **259/259** (unchanged, no file touched; one pre-existing, unrelated timing-flake confirmed transient on isolated re-run).
- `pnpm emulators:validate` / full real Firebase Emulator Suite: **11 files / 143/143** on the qualifying clean runs (116 pre-existing + 27 new: 22 in the new `identityLookupRepository.emulator.test.ts`, 2 in `loyaltyNumberRepository.emulator.test.ts`, 3 in `authenticationReferenceRepository.emulator.test.ts`; two earlier full-suite runs hit the same pre-existing, already-disclosed `outboxProcessor.emulator.test.ts` concurrency-timeout flake class under elevated host load, confirmed transient by a `--testTimeout=20000` override run (11/11 passed) and by two subsequent full clean runs).
- `pnpm build` — both workspaces clean.

## 23. Dependencies

None added.

## 24. Configuration

None changed.

## 25. Risks

None new beyond the already-disclosed, pre-existing local emulator/frontend timing-flake classes (environmental, confirmed transient, not regressions — see §22). The purpose-to-lookup-type allow-list (§6) is this task's own disclosed design resolution of the brief's "assess support for X context" instruction — not dictated verbatim by any governing document — flagged here for Founder awareness rather than silently assumed permanent.

## 26. Deferred Items

Explicitly not implemented: customer search, merchant search UI, support UI, fuzzy search, phone search, email search, profile search, duplicate-review queue, public APIs, rate limiting, analytics, ITM, Authentication (the actual credential-verification flow — only a provider-neutral lookup context for a future Authentication package to consume).

## 27. Rollback

`git revert` of this task's commit(s), or discard the branch — not yet merged. Purely additive; no existing exported function's behavior changed (`getActiveQrIdentityByReference`, `createLoyaltyNumber`, `createQrReference`, `fromUserDocument` all reused unmodified — confirmed via `tsc --noEmit` project-wide and a targeted grep finding zero signature changes to any pre-existing exported function); no data, deployment, or live configuration affected.

## 28–31. Documentation Deliverables

This report (28); `IMPLEMENTATION_CHANGES.md` entry (29); `documentation-changes-log.md` Entry 066 (30); this report also serves as the persistent task-level Markdown record (31), per this domain's established convention.

## 32–37. PR and CI Evidence

Recorded in the final chat completion report after commit/push/PR creation (this report is written before that step, per the sequencing every prior task in this stream has used).

## 38. Correction (2026-08-05) — Founder Review: Lookup-Purpose and Result-Minimisation Clarification

PR #64 was positively reviewed but held from merge pending clarification that the original per-lookup-type purpose allow-list (§6) was an undisclosed engineering judgment rather than an approved policy, and that the shared `IdentityLookupResult` (§11) exposed `authenticationReferences` — linked-provider metadata — to purposes with no legitimate need for it, most critically `merchant_transaction`. This section records the Founder's resulting policy direction and the smallest correction applying it, per the Founder's own instruction to amend rather than rewrite the original submission.

**38.1 Governing-evidence review of the original allow-list.** Re-examined against source: `recovery` on all four lookup types was directly grounded in `-07`'s merged `RecoveryLookupReference` type. `internal_service` on Customer Identity ID and `merchant_transaction` on Loyalty Number/QR were directly grounded in `ENG-P2-001-PLAN-001` §2's own `-09` text. `support` on Customer Identity ID/Loyalty Number/Authentication Reference had governance basis in the task brief's own named "likely candidates" for audited support lookups. Two entries had no citation and were engineering judgment only: `support` on QR reference, and the categorical exclusion of `recovery` from Authentication Reference lookup (the latter was previously correct only because `-07` had explicitly deferred it as a capability, not because the lookup function itself could not support it safely).

**38.2 Final purpose policy (Founder-directed, implemented verbatim):**

| Lookup type | authentication | recovery | internal_service | merchant_transaction | support |
|---|---|---|---|---|---|
| Customer Identity ID | ✗ | ✓ | ✓ | ✗ | ✓ |
| Loyalty Number | ✗ | ✓ | ✓ | ✓ | ✓ |
| QR reference | ✗ | ✓ | ✓ | ✓ | ✗ *(removed — no governing citation)* |
| Authentication Reference | ✓ | ✓ *(added — new Founder-approved capability grant at the lookup level only)* | ✓ | ✗ | ✓ |

The `recovery` grant on Authentication Reference lookup is a capability of this lookup function only; it does not wire into, modify, or expand `-07`'s own recovery orchestration, which remains unmodified. This distinction is preserved in the repository doc comment and in the new test covering it (§38.5).

Caller-supplied `purpose` values remain, explicitly, never authority by themselves — the lookup boundary has no caller-identity verification and cannot distinguish `support_agent_alice` from any other caller declaring the same purpose string. Validating that a caller is actually entitled to declare a given purpose is out of scope for this package and belongs to a future trusted application boundary, which must fail closed if it cannot verify the caller.

**38.3 Policy-record location.** This section (§38) is the authoritative policy record for the lookup-purpose allow-list, referenced from a new resolved-ambiguity entry in `ENG-P2-001-PLAN-001` §14 (Ambiguity 6) and from the repository's own doc comment in `functions/src/domains/identity/repositories/identityLookupRepository.ts`.

**38.4 Result-model correction.** `IdentityLookupResult.authenticationReferences` changed from always-present to optional, populated only when `purpose === "authentication"` — applied uniformly across all four lookup types rather than as a per-type exception, which is the smallest correction that satisfies both "every lookup returns only the minimum fields required for its purpose" and "merchant transaction lookups must not return Authentication References." `authentication` is the one purpose structurally requiring this visibility (checking for an existing linked reference before completing a sign-in); every other purpose — including `merchant_transaction` and `internal_service` — now receives only `customerIdentityId` and `status`.

```ts
export type IdentityLookupResult = {
  customerIdentityId: string;
  status: IdentityStatus;
  authenticationReferences?: AuthenticationReference[];
};
```

**38.5 Tests added/strengthened** (all in `identityLookupRepository.emulator.test.ts`): merchant-purpose Loyalty Number lookup asserts `authenticationReferences` is `undefined` and the key is absent from the result object; merchant-purpose QR lookup asserts the same; authentication-purpose Authentication Reference lookup asserts `authenticationReferences` is present and populated; a new test on Customer Identity ID lookup asserts two calls with the same purpose but different `actor.actorId` values succeed identically, demonstrating purpose alone — not caller identity — determines the outcome; a new test asserts QR lookup now rejects the `support` purpose; a new test asserts Authentication Reference lookup now permits the `recovery` purpose while still returning `authenticationReferences: undefined` (since `recovery` ≠ `authentication`).

**38.6 Confirmations.** Failed exact-match lookups still collapse "unknown" and "exists but inactive" into one `identityLookupNotFoundError` — unchanged, still enumeration-resistant. Audit events (`IdentityLookupAttemptedPayload`) still carry no raw lookup values — unchanged. No broad/fuzzy/prefix lookup capability was introduced. Rate limiting remains explicitly deferred, unchanged from the original submission.

**38.7 Validation after correction.** `npx tsc --noEmit` (functions): clean. Targeted emulator suite (`identityLookupRepository.emulator.test.ts`): 25/25 passed. `pnpm lint`: clean. `pnpm format:check`: clean. Full functions unit suite (`vitest run`): 347/347, unchanged. Full real Firebase Emulator Suite (11 files): 146/146, all clean on first run, no flakes. `pnpm --filter web test`: 259/259, unchanged (this correction does not touch `apps/web`). `pnpm build`: both workspaces build cleanly.

**38.8 Documentation updated alongside this section.** `ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md` §14 (new Ambiguity 6 entry); `docs/changes/IMPLEMENTATION_CHANGES.md` (new dated correction entry); `docs/00-governance/documentation-changes-log.md` (Entry 067).

**38.9 Merge status.** PR #64 remains unmerged. This correction was committed to the existing `feat/eng-p2-001-09-identity-query-lookup` branch, not a new branch. Merge remains withheld pending fresh, separate Founder authorisation.
