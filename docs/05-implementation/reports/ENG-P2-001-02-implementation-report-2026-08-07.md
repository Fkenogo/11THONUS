> **Title:** ENG-P2-001-02 — Customer Profile Implementation Report
> **Version:** 1.0 · **Status:** Implementation record — pending Founder-authorized review/merge · **Classification:** Working (execution-layer implementation record)
> **Governing document:** [`ENG-P2-001-PLAN-001` §`-02`](../roadmap/ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md); TRD10 §10.6.2; TRD21 §21.8/§21.11; `DEC-PROD-012` (CLOSED, Option D)
> **Source-of-truth path:** `docs/05-implementation/reports/ENG-P2-001-02-implementation-report-2026-08-07.md`
> **Last controlled update:** 2026-08-07 (created)

# ENG-P2-001-02 — Customer Profile Implementation

**The final Customer Identity child package: the Customer Profile domain layer — the mutable, non-identity profile data on the `customerProfiles` document (TRD10 §10.6.2). Implemented test-first. Gender is not collected at MVP (`DEC-PROD-012`, Option D); the contract has no `gender` field and rejects it on write. No Authentication, ITM, persistence-redesign, Rules, API, or UI work. Capability 2 is NOT marked complete by this package.**

## 1. Authoritative Scope

Per `ENG-P2-001-PLAN-001` §`-02` (exit criterion: *"profile CRUD logic testable against the domain layer"*) and TRD10 §10.6.2 (the named governing schema). The `customerProfiles` mutable field set (post-`DEC-PROD-012`): `firstName`, `lastName` (mandatory); `dateOfBirth?`, `city?` (optional); `interests[]`, `preferredCategories[]` (default empty); `communicationPreferences{push,sms,email,whatsapp,marketingConsent}`; `consentVersions{termsVersion,privacyVersion,acceptedAt}` (required at write time, TRD21); `profileCompletionPercent` (derived). **No `gender`.**

**Resolved scope conflict:** `ENG-P2-001-PLAN-001`'s prose lists `displayName/photo/country/preferredLanguage` under `-02`, but TRD10 §10.6.2 (the governing *schema*, and `-02`'s own named "Governing requirements") places those on the **`users`** document (TRD10 §10.6.1). This implementation follows the authoritative schema — `-02` owns only the `customerProfiles` fields — and records this reading rather than inventing profile fields the schema does not assign here.

## 2. Architecture Used

Matches the merged `-01`/`-03`–`-10` pattern exactly: a pure domain module (`Date` timestamps, no Firebase import), readonly aggregate type, `create*`/`update*` factories that validate and throw the shared `IdentityDomainError` mapped to the closed **14-category** taxonomy (TRD11 §11.35) — `VALIDATION_FAILED` / `RESOURCE_NOT_FOUND`, **no new category**. Reuses `IdentityDomainError` (one bounded error type per domain). No parallel Customer Profile architecture; no redesign of `-05`'s persistence shell.

## 3. Files Created / Modified

- **Created:** `functions/src/domains/identity/models/customerProfile.ts` — the domain model + operations.
- **Created:** `functions/src/domains/identity/models/customerProfile.test.ts` — 20 unit tests.
- **Modified:** `functions/src/domains/identity/models/identityErrors.ts` — six additive Customer Profile error factories (all reusing the existing 14-category taxonomy; no new category).

No other code, Firestore Rules, index, configuration, or dependency changed.

## 4. Implemented Contract

`CustomerProfile` = `{ customerIdentityId (readonly binding), firstName, lastName, dateOfBirth?, city?, interests[], preferredCategories[], communicationPreferences, consentVersions, profileCompletionPercent, createdAt/createdBy (readonly), updatedAt/updatedBy }`.

Operations:
- `createCustomerProfile(params)` — validates the identity binding + mandatory `firstName`/`lastName`; enforces `consentVersions` at write time (TRD21); applies Progressive KYC (optional info absent, never placeholder); normalises `communicationPreferences` (default all-false) and the reference lists; computes `profileCompletionPercent`; **rejects any `gender` / unsupported field**.
- `updateCustomerProfile(existing, changes, meta)` — applies permitted mutable-field updates; **rejects changing the immutable `customerIdentityId` binding**; re-validates changed fields; recomputes completion; re-stamps `updatedAt`/`updatedBy`; **rejects `gender`**.
- `toPublicCustomerProfile(profile)` — privacy projection (PR-005): exposes only `firstName`; never `dateOfBirth`, `city`, `consentVersions`, `communicationPreferences`, or `lastName`.
- `serializeCustomerProfileFields` / `deserializeCustomerProfileFields` — domain ↔ the plain `customerProfiles` field object the persistence surface consumes; omits absent optionals and never emits `gender`; does not re-own the `-05` identity-binding shell (`id`/`userId`/`loyaltyNumber`/`qrReference`/`BaseMetadata`).

**Gender is absent from the entire contract** — not in the type, not accepted by create/update, not serialized; a test asserts each.

## 5. Testing and Validation

- **New tests:** `customerProfile.test.ts` — **20** unit tests: valid creation; Progressive-KYC optional absence; provided optionals; completion-percent computation; required-field validation (first/last name, binding, consent); `VALIDATION_FAILED` mapping; unsupported/`gender` rejection on create and update; gender-absent contract; permitted updates + re-stamp; completion recompute; immutable-binding rejection; mandatory-clear rejection; public-projection privacy boundary; serialize field-set + round-trip; malformed-record error.
- **Full `functions` unit suite:** **420 / 420 passed** (55 files) — was 400 before; +20 new; existing Customer Identity tests unmodified and green (regression clean).
- `tsc --noEmit` (typecheck) — clean. `functions` `build` (`tsc`) — clean.
- Root `eslint .` — clean. Root `prettier --check .` — clean.
- **No gender implementation.** **14-category taxonomy unchanged** (`errorCategories.ts` untouched). **Authentication / ITM untouched.** No Rules/index/config/dependency change. `git status` — only the three files above.

## 6. Boundary / Disclosed Deferral

Live Firestore repository **write/read wiring** for profile mutation is the persistence surface `ENG-P2-001-PLAN-001` assigns to `-05` (which deliberately persisted only the identity shell and left the full profile shape for a future read path — see `customerProfileDocument.ts`'s own note). `-02` delivers the domain model, validation, operations, and the document field-mapping that surface consumes. Wiring a repository is **not** invented here (would redesign `-05` / add a parallel repository, both prohibited). Emulator/repository tests therefore do not apply to this domain-layer package; the authoritative `-02` exit criterion (domain-layer CRUD) is met.

## 7. Security / Privacy

Collects only MVP-authorised `customerProfiles` fields; **no gender**; consent-version enforcement at write time (TRD21); `toPublicCustomerProfile` reveals nothing sensitive (PR-005). No Firestore Rules changed — the existing deny-by-default posture for `customerProfiles` (`-05`) is unmodified. No analytics collection introduced.

## 8. Programme Impact

`ENG-P2-001-02` is now **implemented (domain layer, TDD), pending Founder-authorized review/merge**. With `-02` implemented, **all ten `ENG-P2-001` child packages (`-01`–`-10`) are implemented**. **Capability 2 is not complete** — capability-level closure follows its own governed validation/closure process (not performed here). Authentication and ITM remain separately governed and **unauthorised**. RTM Finding F11 remains **deferred** (no RTM rows added — that is the out-of-scope F11 catch-up, consistent with sibling packages `-01`/`-03`–`-10`).

## 9. Risks

Low. Domain-layer, additive, fully unit-tested; no persistence/Rules/config change. Residual: the profile fields are not yet persisted to Firestore (disclosed §6) — a future persistence-wiring task consumes this model's serializer. `gender` re-introduction, if ever governed, is additive (the contract already rejects it cleanly).

## 10. Rollback

`git revert` of this package's commit, or discard the branch — not yet merged. Deletes `customerProfile.ts`/`.test.ts` and the additive error factories; no data, deployment, or configuration affected.

## 11. Dependencies / Configuration

Dependencies added: none. Configuration changes: none.

## 12. PR

See the completion report for PR number, branch, head SHA, mergeability, and CI status. No merge without fresh Founder authorization.
