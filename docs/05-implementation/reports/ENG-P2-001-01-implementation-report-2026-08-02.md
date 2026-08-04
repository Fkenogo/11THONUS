> **Title:** ENG-P2-001-01 — Identity Domain Foundation — Implementation Report
> **Status:** Implemented, test-first (TDD) — pending Founder-authorized review and merge.
> **Date:** 2026-08-02
> **Task:** `ENG-P2-001-01`, per `ENG-P2-001-PLAN-001`'s decomposition and `ENG-P2-GATE-001`'s confirmation this package is not `DEC-PROD-012`-blocked.
> **Source-of-truth path:** `docs/05-implementation/reports/ENG-P2-001-01-implementation-report-2026-08-02.md`
> **Companion documents:** [`ENG-P2-ARCH-001`](../roadmap/ENG-P2-ARCH-001-customer-identity-architecture.md); [`ENG-P2-001-PLAN-001`](../roadmap/ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md); [`ENG-P2-GATE-001`](../roadmap/ENG-P2-GATE-001-dec-prod-012-scope-determination.md)

---

## Executive Summary

Implemented the Customer Identity domain-foundation layer at `functions/src/domains/identity/` — the `CustomerIdentity` aggregate root, its Internal Customer ID/status/authentication-reference/trust-reference value objects, 9 domain events, and domain-local errors. Built strictly test-first: every module's test file was written and confirmed failing (module-not-found or assertion failure) before its implementation was written, in small RED→GREEN loops, per the session's binding TDD discipline. No persistence, API, UI, authentication-provider, or ITM logic was implemented — this is domain modeling only, matching `ENG-P2-001-PLAN-001`'s own scope boundary for this specific child package.

## 1. Files Inspected (per "Before Making Changes")

`ENG-P2-ARCH-001`, `ENG-P2-001-PLAN-001`, `ENG-P2-GATE-001`, `DEC-IDENTITY-001`, amended `DEC-PROV-004`/`DEC-SEC-001`, `DEC-ID-003`, `DEC-DATA-007` (Decision Register), PRD2, TRD10 §10.6.1–2, TRD12 §12.3–12.7/§12.30–32, `AIR-001`–006, Repository and Folder Standards §3–4, Version 1 Engineering Blueprint §3, and every existing `functions/src/shared/*` module and its tests, plus `functions/vitest.config.ts`, `functions/tsconfig.json`, and the repo-root `eslint.config.js`.

## 2. Files Created

- `functions/src/domains/identity/models/customerIdentityId.ts` + `.test.ts`
- `functions/src/domains/identity/models/identityStatus.ts` + `.test.ts`
- `functions/src/domains/identity/models/authenticationReference.ts` + `.test.ts`
- `functions/src/domains/identity/models/trustReference.ts` + `.test.ts`
- `functions/src/domains/identity/models/identityErrors.ts` + `.test.ts`
- `functions/src/domains/identity/models/customerIdentity.ts` + `.test.ts`
- `functions/src/domains/identity/events/identityEvents.ts` + `.test.ts`
- `functions/src/domains/identity/README.md`
- This report, and the tracking-log updates in §16/§17 below.

## 3. Files Modified

- `eslint.config.js` — one new scoped block (`functions/src/domains/identity/**/*.ts`) adding a `no-restricted-imports` rule forbidding `firebase-admin`/`firebase-functions` imports, mirroring the existing `apps/web` Sentry-isolation precedent, machine-enforcing "no Firebase dependency in the domain layer."
- `docs/05-implementation/roadmap/ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md` — `ENG-P2-001-01`'s matrix row/entry status updated to reflect implementation (§16 below); `-02` through `-10` and Capability 2 overall left unchanged.
- `docs/05-implementation/change-tracking/engineering-implementation-programme.md`, `docs/05-implementation/change-tracking/coding-agent-prompt-register.md` — narrow status notes only (§16).
- `docs/changes/IMPLEMENTATION_CHANGES.md`, `docs/00-governance/documentation-changes-log.md` — new entries (§16/§17).

No other file was created or modified.

## 4. Code Diff Summary

+7 new TypeScript source modules (~420 lines), +7 new test files (68 tests, ~430 lines), +1 domain README, +1 scoped eslint rule (15 lines). Zero lines changed in any pre-existing source file.

## 5. Aggregate Design

`CustomerIdentity` (`models/customerIdentity.ts`): `id` (readonly `CustomerIdentityId`), `status` (`IdentityStatus`), `createdAt`/`createdBy` (readonly), `updatedAt`/`updatedBy`, `authenticationReferences: AuthenticationReference[]`, optional `trustReference?: TrustReference`. Five operations: `registerCustomerIdentity`, `transitionIdentityStatus`, `linkAuthenticationReference`, `unlinkAuthenticationReference`, `setTrustReference` — each pure (no side effects), each returning the updated identity plus the domain event(s) it produced.

## 6. Status Model

`registered | active | dormant | suspended | locked | closed | archived` (`models/identityStatus.ts`). Registration transitions directly to `active` (`DEC-IDENTITY-001` Standard Participation Principle — no gate). `suspended`/`locked` resolve only to `active` or `closed` (no lateral movement between them — this module's own minimal design choice, since some transition table was required; the real-world authority to trigger that resolution is explicitly deferred to a future service-level policy). `archived` is the sole terminal state. `Recovered` is not a status — per `ENG-P2-GATE-001` §8's confirmed classification, it is irrelevant to this package and owned by `-06`/`-07`/`-10`.

## 7. Invariants Enforced

Immutable, non-empty Internal Customer ID; one aggregate per registration; authentication/trust references are pointers only (never own the identity); the last linked authentication reference cannot be unlinked (identity must remain reachable); every status transition validated against the explicit table, with dedicated errors for "already closed" and "archived" (terminal); immutable creation metadata (`createdAt`/`createdBy` are `readonly` at the type level); duplicate authentication-reference and duplicate trust-reference (identical id re-assigned) rejected.

## 8. Domain Events (9, exactly the task's own list)

`CustomerIdentityRegistered`, `CustomerIdentityActivated` (reactivation only — not redundant with registration), `CustomerIdentitySuspended`, `CustomerIdentityLocked`, `CustomerIdentityClosed`, `CustomerIdentityArchived`, `AuthenticationReferenceLinked` (additional providers only — the initial reference is part of registration, no separate event), `AuthenticationReferenceUnlinked`, `TrustReferenceUpdated`. All built on the existing shared `DomainEvent<T>`/`buildEventType` contract (`identity.<event_name>.v1`). No event for the `active`/`suspended`/`locked` → `dormant` transition — not in this task's own named event list, so none was invented.

## 9. Domain Errors

`IdentityDomainError` (domain-local, structurally compatible with but independent of the shared `DomainCommandError` — see §11) with 8 named factory functions: `invalidCustomerIdentityIdError`, `invalidAuthenticationReferenceIdError`, `invalidTrustRecordIdError`, `invalidIdentityStatusTransitionError`, `identityAlreadyClosedError`, `identityArchivedError`, `duplicateAuthenticationReferenceError`, `authenticationReferenceNotFoundError`, `duplicateTrustReferenceError`, `lastAuthenticationReferenceCannotBeUnlinkedError`. Every one maps onto the existing closed 14-category `ErrorCategory` enum (`errorCategories.ts`, TRD11 §11.35) — no 15th category invented.

## 10. Authentication and ITM Boundaries

`AuthenticationReference`: `referenceId`, `referenceType` (`phone_otp | google_sign_in | email | future_provider`), `linkStatus`, creation attribution — no token, OTP detail, email-link implementation, passkey, or OAuth credential. `TrustReference`: opaque `trustRecordId` plus creation attribution only — no verification state or trust level copied in.

## 11. Deferred Items

Persistence (Firestore documents, Rules, indexes) — `ENG-P2-001-05`. Customer Profile — `-02`. Loyalty Number/QR generation — `-03`/`-04`. Lifecycle *orchestration* at the service/API level, Recovery workflow, Linking workflow, Lookup interfaces, Audit sink — `-06` through `-10`. The `DomainCommandError` reconciliation itself (how a future command-handler layer adapts `IdentityDomainError` into `PlatformErrorResponse`) is also deferred — a future API-layer task's own concern, not domain-foundation's.

## 12. Tests Added

68 tests across 7 files, all written before their implementation and confirmed failing first:

- `customerIdentityId.test.ts` (3): valid creation, empty rejection, whitespace rejection.
- `identityStatus.test.ts` (17): full status set, `recovered` exclusion, every permitted/prohibited transition pair, terminal-state check.
- `authenticationReference.test.ts` (3): valid creation (exact-shape assertion — no extra/credential fields), empty-id rejection.
- `trustReference.test.ts` (3): valid creation (exact-shape assertion — no verification-state fields), empty-id rejection.
- `identityErrors.test.ts` (11): every factory returns the correct `ErrorCategory` and is an `IdentityDomainError`/`Error` instance.
- `identityEvents.test.ts` (9): every one of the 9 events builds the correct `eventType`/`sourceDomain`/`aggregateType`/payload.
- `customerIdentity.test.ts` (22): registration (id, default `active` status, immutable metadata, id rejection, single event, no trust reference by default); transitions (valid, no-event-for-dormant, `Activated` on reactivation, `Closed`/`Archived` events, invalid transition, closed-terminal, archived-terminal); linking (add + event, duplicate rejection); unlinking (remove + event, last-reference rejection, not-found rejection); trust reference (assign + event, update to a different id, duplicate-identical rejection).

## 13. Validation Commands and Results

```
pnpm -r run build        → both workspaces built clean
pnpm -r run typecheck     → tsc -b --noEmit clean, both workspaces
npx eslint .              → zero findings, repo-wide
npx prettier --check .    → all files match style (after one --write pass)
pnpm -r run test          → functions: 27 files / 162 tests passed (94 pre-existing + 68 new)
                             apps/web: 30 files / 259 tests passed (unaffected)
```

No emulator-dependent test was added or required — this package has zero Firebase/Firestore dependency by design.

## 14. Dependencies Added

None.

## 15. Configuration Changes

One scoped `eslint.config.js` rule (§3) — no `package.json`, `tsconfig.json`, or `vitest.config.ts` change.

## 16. Security and Privacy Considerations

No PII is logged or embedded in any error message beyond identifiers already treated as non-sensitive elsewhere in the repo (e.g., loyalty-number-style opaque ids). Authentication and trust references structurally cannot carry credentials or verification state (§10) — enforced by their own type shapes and by the exact-key-set assertions in their tests. The eslint boundary rule (§3) prevents this domain layer from ever gaining a code path that could read/write Firestore directly, keeping the future persistence-authorization boundary (`ENG-P2-001-05`) the sole write path.

## 17. Risks

`ENG-P2-001-01`'s API shape (the five aggregate operations) is a design choice this package made independently — a future `ENG-P2-001-05`/`-06` task integrating persistence or orchestration could find the shape needs adjustment once real command-handler/Firestore constraints are known; this is normal domain-first design risk, not a defect. The `IdentityDomainError`/`DomainCommandError` reconciliation (§11) is unimplemented — a future API-layer task must design that adapter explicitly, not assume structural compatibility is sufficient without a test proving it.

## 18. Rollback Instructions

`git revert` this task's commit(s), or discard the branch — not yet merged. Purely additive (new files, one new eslint block); no existing file's behavior changed; no data, deployment, or live configuration affected.
