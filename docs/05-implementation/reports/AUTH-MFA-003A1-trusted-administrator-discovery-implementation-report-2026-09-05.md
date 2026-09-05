> **Title:** AUTH-MFA-003A1 — Trusted Platform-Administrator Discovery Callable — Implementation Report
> **Status:** Implemented — pending Founder Technical Review/merge
> **Classification:** Working (implementation record)

# AUTH-MFA-003A1 — Trusted Platform-Administrator Discovery Callable — Implementation Report

## 1. Entry state and base SHA

`origin/main` at `fbf769ec4ae0849c7e25b775f5c91e72507d4735` (merge of PR #228, `AUTH-MFA-003A`), verified by `git fetch origin && git rev-parse origin/main` before this task began. A fresh isolated worktree was created from that exact SHA at `/Volumes/PRODUCTION/Projects/_worktrees/11THONUS/temporary/auth-mfa-003a1` (branch `feat/auth-mfa-003a1-trusted-administrator-discovery`). The primary working directory's unrelated, uncommitted `FD-COM-001` commercial-model work was never opened, read, stashed, committed, or altered. The worktree is a git worktree sharing this repository's object store; `pnpm install` was executed inside the worktree to materialize `node_modules` there.

## 2. Authorization and task authority

- **Base decision authority:** `DEC-SEC-004` (Founder disposition `FD-MFA-2`, Status **CONFIRMED**, Decision Register) — TOTP-only platform-administrator MFA, controlled auditable recovery, no customer/Business MFA. `DEC-SEC-004` names `AUTH-MFA-003A1` as a separately-authorizable server-side package; `AUTH-MFA-003A` and `AUTH-MFA-003A-CORR-001` explicitly hold the trusted discovery callable out of their own scope ("NO TRUSTED DISCOVERY IMPLEMENTATION ... READY FOR AUTH-MFA-003A1").
- **Package charter:** `AUTH-MFA-002` §8A.5/§8A.6 — a small, bounded, server-side prerequisite that "reads a Firestore document" and gates the future AUTH-MFA-003B (enrollment UI) and AUTH-MFA-003C (challenge UI) packages by answering "should this user be offered enrollment/challenge UI?" It is consumed only by client routing, never by any backend authorization path.
- This package is **server-side, code-only**. It performs **no live Firebase configuration change, no Identity Platform mutation, no TOTP enrollment, no deployment, no `firebase deploy`**. The Firestore emulator + Cloud Functions emulator were used only for local test execution; the live DEV project was not touched.

## 3. The one architectural correction this package makes against the AUTH-MFA-002 conceptual sketch

`AUTH-MFA-002` §8A.3's conceptual design sketch used `request.auth?.uid` (the Firebase **UID**) as the `platformAdministrators` document key, and returned `false` when that UID is absent. That sketch is explicitly labelled *"Conceptual — not implementing, just documenting the architecture"* — and it does **not** match the implemented, already-merged platform-administration architecture it must feed. This implementation follows the authoritative implemented trust chain instead, and documents the correction in this report and in the code header:

| Concern | §8A.3 conceptual sketch | **Implemented (authoritative codebase) |
|---|---|---|
| Identity source | `request.auth?.uid` (Firebase UID, populated by the v2 callable runtime) | **Server-verified ID token** → `firebaseAdminTokenVerifier` → `resolveAuthenticatedIdentityActor` → `userId` (`=== customerIdentityId`) |
| Document key | `platformAdministrators/{firebaseUid}` | **`platformAdministrators/{customerIdentityId}`** — the doc-id-as-key contract established by `ENG-P3-003-DESIGN-001` §6 ("one administrator record per Customer Identity") and implemented by `platformAdministratorRepository.ts`, `resolvePlatformAdministratorAuthorization.ts` (`callerUserId`), and `bootstrapPlatformAdministrator.ts` (`targetUserId`) |
| Missing identity handling | Return `{ isPlatformAdministrator: false }` | **Fail closed** — no authenticated eligible identity → `unauthenticated` error (`identityActorNotEligibleError`), never a fabricated `false`/`true` (see §7) |
| Record read | `collection("platformAdministrators").doc(uid).get()` | **`getPlatformAdministratorById(db, userId)`** — the same repository reader `resolvePlatformAdministratorAuthorization` would use, including its malformed-record fail-closed throw |
| Transport | conceptual `onCall` | **`onCall` bound in `functions/src/index.ts` following the repository's authenticated-caller → whitelist-parse → domain-service pattern** (`rawToken` + `referenceType`; never reads `request.data.userId`/`request.auth` directly — this codebase's callables do not consume `request.auth` at all) |

Why the correction is structural rather than stylistic: a Firebase UID is a per-caller authentication identity that can differ from the Customer Identity ID; using it as an administrator-record key would simply never match the identity the platform-administration domain actually keys its records on, breaking discovery for every real provisioned administrator. The resolved `userId === customerIdentityId` is precisely what every other authenticated callable (`setDisplayName`, `getMyDisplayName`, `createBusiness`, …) already derives.

## 4. Architecture verification findings (abridged)

Verified against the code on this branch before any code was written:

- `firebaseAdminTokenVerifier` + `resolveAuthenticatedIdentityActor(db, { rawToken, referenceType }, { verifier })` is the repository's universal authenticated-caller gate; it returns `userId === customerIdentityId`.
- `platformAdministrators/{userId}` is governed by deny-all Firestore rules (`firestore.rules` — `allow read, write: if false`); only Admin SDK reads reach it.
- `getPlatformAdministratorById` reads one document by `userId` and throws `platformAdministratorConfigMalformedError` (`AUTH_FORBIDDEN`) when the stored document fails structural validation (`fromPlatformAdministratorDocument` returns `null`, e.g. an unrecognised TRD18 role).
- `evaluateKnowledgePlatformPermission` defines eligibility as: record exists **and** `status === "active"` (a single `ADMINISTRATOR_NOT_ACTIVE` reason covers invited/suspended/removed, enumeration-resistant).
- `PLATFORM_ADMINISTRATION_AUDIT_ACTION_TYPES` is a closed two-entry vocabulary (`platform_administrator_bootstrapped`, `knowledge_permission_evaluated`); no discovery action type exists.
- `toHttpsError` in `index.ts` maps each domain error class to a stable snake_case message; it had **no** `PlatformAdministrationDomainError` branch (added here, §5).
- Callable/transport conventions: whitelist parsers read only named keys (mass-assignment boundary, regression-tested), domain services live in `domains/<domain>/services/`, `onCall` handlers resolve identity then delegate, plain-object returns, no envelope.
- `eslint.config.js`: `platformAdministration/{services,repositories}/**` are exempt from the `no-restricted-imports` firebase-admin restriction; platformAdministration may not import `domains/business`/`domains/permissions`.

## 5. Files created and modified

**Created**

1. `functions/src/domains/platformAdministration/services/discoverPlatformAdministrator.ts` — the domain service: `discoverPlatformAdministrator(db, userId, deps?)` → `Promise<DiscoverPlatformAdministratorResult> = { isPlatformAdministrator: boolean }`. Reads exactly one document (`getPlatformAdministratorById`, injectable via `deps.getAdministrator` for unit tests), returns `administrator?.status === "active"`. Header documents the trust model (identity = resolved Customer Identity ID, never a client field), the lifecycle rule, the fail-closed paths, and the no-audit rationale.
2. `functions/src/domains/platformAdministration/services/discoverPlatformAdministrator.test.ts` — 7 unit tests (full lifecycle matrix + fail-closed + minimal-payload).
3. `functions/src/domains/platformAdministration/services/discoverPlatformAdministrator.emulator.test.ts` — 6 emulator tests against the real Firestore emulator (active → true; unknown → false; suspended → false; removed → false; malformed → rejects; repeated discovery writes no audit record).

**Modified**

4. `functions/src/index.ts` —
   - `toHttpsError`: added the `PlatformAdministrationDomainError` branch → `HttpsError(CATEGORY_TO_HTTPS[error.category] ?? "internal", "platform_administration_failed")`. This is what makes the malformed-record fail-closed path surface as a proper `permission-denied` (never the misleading fallback `internal`/`authentication_failed`, and never `false`).
   - `parseDiscoverPlatformAdministratorRequest` (exported for the regression test): whitelist parser reading only `rawToken`/`referenceType` (reuses `parseRawToken`/`parseReferenceType`).
   - `discoverPlatformAdministrator` `onCall`: `parseDiscoverPlatformAdministratorRequest` → `resolveAuthenticatedIdentityActor` → domain service → return `{ isPlatformAdministrator }`. No `userId`/`customerIdentityId`/`roles`/`status` is ever read from `request.data`.
5. `functions/src/index.test.ts` — mass-assignment regression describe block: drops every identity/result-steering field; parses to exactly `{ rawToken, referenceType }`; rejects missing `rawToken` (unauthenticated) and missing/unsupported `referenceType`.

## 6. Design decisions (trust model, lifecycle, response)

- **Identity derivation:** the callable derives `userId` exclusively from the server-verified credential (`resolveAuthenticatedIdentityActor`). The request carries no identity-selecting field at all — there is literally nothing a caller can mass-assign.
- **Lifecycle:** only `status === "active"` is discoverable. No record, `invited` (recognised-but-not-yet-activated — unreachable by any path this package builds), `suspended`, and `removed` (terminal) all resolve to `false` — the exact same eligibility test `evaluateKnowledgePlatformPermission` applies (`NO_ADMINISTRATOR_RECORD` / `ADMINISTRATOR_NOT_ACTIVE`). Discovery and authorization cannot disagree about who is a functioning administrator because both derive that fact from the same record and the same status predicate.
- **Response contract (`AUTH-MFA-002` §8A.2):** minimal disclosure — exactly one key, `isPlatformAdministrator: boolean`. No roles, no status, no record contents, no audit meta.
- **Fail closed:** (a) malformed stored record → `platformAdministratorConfigMalformedError` propagates (`permission-denied`), never `false`; (b) repository/infrastructure failure propagates → `toHttpsError` fallback `internal`; (c) verified credential that does not resolve to an eligible Customer Identity → `identityActorNotEligibleError` (`unauthenticated`) — a genuinely suspended/locked identity is never answered with a fabricated `true` or `false`.
- **No audit mutation — by design:** discovery is a read-only routing decision consumed only by the client access layer (AUTH-MFA-002 §8A.5); it is not an authorization decision. The closed audit vocabulary has no discovery action type, and no new one is invented. Whether a discovery was issued is architecturally answerable from the consuming enrollment/challenge command's own governed audit channel; a discovery miss/hit is not itself a privileged action. The emulator test asserts repeated discovery writes zero audit records.

## 7. Error mapping truth table

| Situation | Transport result |
|---|---|
| No/invalid credential | `unauthenticated` (`authentication_failed`) — parser `parseRawToken` |
| Unsupported/missing `referenceType` | `invalid-argument` (`authentication_failed`) — parser `parseReferenceType` |
| Verified credential, identity not eligible | `unauthenticated` (`authentication_failed`) — `identityActorNotEligibleError` |
| No `platformAdministrators/{userId}` doc | `{ isPlatformAdministrator: false }` |
| Record `invited`/`suspended`/`removed` | `{ isPlatformAdministrator: false }` |
| Record `active` | `{ isPlatformAdministrator: true }` |
| Record structurally malformed | `permission-denied` (`platform_administration_failed`) — new mapping, fail-closed |
| Firestore infrastructure failure | `internal` (`authentication_failed`) — existing fallback, never `false` |

## 8. Security analysis

| Threat (from AUTH-MFA-002 §8A.4) | Mitigation in the implementation |
|---|---|
| Client self-asserts administrator status | Identity derived from the server-verified token; parser whitelist is literally incapable of expressing `userId` |
| Client reads `platformAdministrators` directly | Deny-all rules unchanged; only the Admin-SDK repository read is used |
| Information disclosure (roles/status/…) | Single-key response; nothing else is read off the record or returned |
| Discovery grants Knowledge Studio access | It cannot — `resolvePlatformAdministratorAuthorization` remains the only authorization gate and still requires genuinely verified MFA |
| Enumeration of administrators | Exactly one document read keyed by the derived caller identity; no query, no listing |
| Non-admin learns they are not admin | `false`; no further leakage |
| Malformed/poisoned stored record | `permission-denied` (fail-closed), not `false` — an unverifiable record is treated as unknown access |
| Suspended/locked identity | `unauthenticated` (fail-closed), never a fabricated answer |

## 9. Boundaries honored (what this package did NOT do)

No live Firebase configuration change, no Identity Platform/TOTP mutation, no `firebase deploy`, no administrator enrollment, no MFA selector/coordinator console, no MFA UI of any kind, no recovery (AUTH-MFA-003D), no AUTH-MFA-003B/003C/003D/003E implementation, no `ENG-P3-003B` start, no Business/customer auth change, no Firestore Rules/`firestore.rules` change, no dependency added, no `DEC-SEC-004`/`DEC-GOV-011`/`FD-KS-1` reopening, no changes to any merged record's existing entries (the AUTH-MFA-002 report is reproduced in §3's comparison as-is; only new records were added). The primary worktree's `FD-COM-001` work was untouched.

## 10. Tests and results (executed in the isolated worktree)

- `pnpm --filter functions test` (unit): **153 files / 1645 tests passed** (7 new discovery unit tests + 4 new parser regression tests included).
- `functions typecheck` (`tsc --noEmit`): clean.
- `packages`: `pnpm lint` (repo): clean — the single pre-existing `react-refresh/only-export-components` warning in `apps/web/src/business/BusinessApiContext.tsx` (untouched file) is not introduced by this change.
- `pnpm format:check`: clean.
- `pnpm --filter functions build` (`tsc` emiss): clean.
- `pnpm emulators:validate` (full emulator suite via `firebase emulators:exec`): **58 files / 752 passed / 2 skipped** — final full run green (exit 0), including the 6 new discovery emulator tests.
  - **Pre-existing flake note (not caused by this change, disclosed for CI transparency):** the very first full emulator run observed 2 failures in `src/domains/permissions/service/authorizeAndExecute.emulator.test.ts` test 19b (`touchedCount` = 3 vs 2) — a Firestore transaction-contention race test in the permissions domain this package does not touch. Re-run in isolation it passes 22/22, and the subsequent full-suite re-run was green (752/752). The observable behavior matches the test's own documented sensitivity to cross-file emulator contention under `firebase emulators:exec`; it is reproducible-flaky under the full 58-file sweep and was green on the CI-equivalent pass after emulator processes were cleared. No test was modified.
- No CI run was triggered (no push yet as of this report); the CI-equivalent commands above are the local verification baseline.

## 11. Deploy/rollback

- **Deploy:** this package introduces a new Cloud Function export; deployment is the normal `firebase deploy --only functions` at some future go-live (not executed here — no live change).
- **Rollback:** repository-level — do not merge / revert the PR. No live Firebase configuration, no Identity Platform state, no emulator/test dependency, and no compiled artifact shipped, so there is no runtime configuration to roll back. Reverting the PR's files restores the pre-package `index.ts`/domain state exactly.

## 12. Risks

- **No real caller yet:** like `resolvePlatformAdministratorAuthorization`, discovery has no wired consumer until AUTH-MFA-003B/003C client work exists. Status is "implemented and tested, awaiting those packages" — a routing read, not a live authorization path.
- **Enrollment reachability remains a live-only question:** the AUTH-MFA-003A-CORR-001 finding (Auth emulator cannot execute TOTP enrollment; live-DEV reachability test held for Founder disposition) is unaffected by, and does not block, this server-side read.
- **Flake disclosure for CI:** see §10. The permission-domain contention test flake predates this package; if CI hits it, re-running the emulator suite (or that file) is the documented remedy.

## 13. Governance / delivery record

**AUTHORIZED:** `DEC-SEC-004` (`FD-MFA-2`) + AUTH-MFA-002 §8A.6 package boundary (`AUTH-MFA-003A1`).
**EXECUTED:** code-only server-side discovery package (service + transport + tests + records), no live environment touched.
**NOT AUTHORIZED / NOT EXECUTED:** any live change, enrollment, MFA UI, recovery, later packages.

## 14. Gate

`AUTH-MFA-003A1 TRUSTED PLATFORM-ADMINISTRATOR DISCOVERY IMPLEMENTED — SERVER-VERIFIED IDENTITY (CUSTOMER IDENTITY ID, NOT FIREBASE UID — AUTHORITATIVE TRUST CHAIN CORRECTING §8A.3'S CONCEPTUAL SKETCH) — MINIMAL { isPlatformAdministrator: boolean } CONTRACT — ACTIVE-ONLY LIFECYCLE — FAIL-CLOSED (MALFORMED RECORD → PERMISSION-DENIED; INELIGIBLE IDENTITY → UNAUTHENTICATED) — NO AUDIT MUTATION BY DESIGN — NO LIVE CONFIG CHANGE — MASS-ASSIGNMENT REGRESSION-TESTED — 1645 UNIT + 6 EMULATOR TESTS GREEN (752/754 FULL SUITE) — READY FOR FOUNDER TECHNICAL REVIEW`

**Next task (Founder/Technical Review):** review this PR (`feat/auth-mfa-003a1-trusted-administrator-discovery`); on approval, the subsequent client MFA packages (`AUTH-MFA-003B` enrollment UI, `AUTH-MFA-003C` challenge UI) consume this callable for routing. Each remains separately authorizable per `DEC-SEC-004`.