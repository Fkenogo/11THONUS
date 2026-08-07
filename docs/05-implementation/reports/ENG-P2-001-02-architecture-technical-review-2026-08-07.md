# ENG-P2-001-02 — Architecture / Technical Review (Customer Profile)

> **Title:** ENG-P2-001-02 — Architecture / Technical Review (Customer Profile)
> **Version:** 1.0 · **Status:** Review record — findings only · **Classification:** Working (review record)
> **Governing document:** 11thONUS Platform Constitution; Engineering Governance Charter; [Technical Review Standard](../../06-engineering-governance/technical-review-standard.md); [Definition of Done](../../06-engineering-governance/definition-of-done.md)
> **Source-of-truth path:** `docs/05-implementation/reports/ENG-P2-001-02-architecture-technical-review-2026-08-07.md`
> **Produced under:** `CAP-P2-007` (Customer Identity Concern Completion)
> **Last controlled update:** 2026-08-07 (`CAP-P2-007` — created)

**Purpose.** Provide the **Definition of Done §2.6 (Technical Review) coverage** that `DEC-GOV-009` (G1) requires for `ENG-P2-001-02` (Customer Profile), which was implemented *after* the `ENG-P2-ARCH-REVIEW-001`/`-002` baseline and therefore is not covered by the capability-level Architecture Review. This review also covers the `CAP-P2-007` persistence wiring of `-02`'s fields into `ENG-P2-001-05`'s `customerProfiles` converter. Findings-only; final Technical-Review **Approved** status is realized at Founder merge authorization of the `CAP-P2-007` PR.

## 1. Baseline and Authoritative State

- Baseline: `origin/main` at `b3b66766437729f8ff2431dae607d85a73540ee3` (`CAP-P2-006` merge, PR #81). Confirmed authoritative.
- Review target: `ENG-P2-001-02` Customer Profile domain model (`functions/src/domains/identity/models/customerProfile.ts`, merged `be958b7…` PR #76) **plus** the `CAP-P2-007` persistence wiring in `functions/src/domains/identity/repositories/customerProfileDocument.ts`.
- Governing sources treated as authoritative: TRD10 §10.6.2 (`customerProfiles` schema, post-`DEC-PROD-012` Option D); `DEC-PROD-012` (CLOSED, Option D — gender not collected at MVP); TRD11 §11.35 (closed 14-category error taxonomy); `ENG-P2-001-PLAN-001` (`-02`/`-05` scope); Definition of Done §2 + `DEC-GOV-008`/`-009`/`-010`.

## 2. Repository Entry Gate

Isolated worktree `cap-p2-007` created off `origin/main` @ `b3b6676`; branch `feat/eng-p2-001-05-customer-profile-persistence`; `git rev-list --left-right --count origin/main...HEAD` → `0 0` at entry; no staged/deleted/conflicted files; no merge/rebase/lock state. Dirty primary checkout left untouched (read-only).

## 3. Review Coverage

| # | Area | Primary sources reviewed |
|---|---|---|
| 1 | Customer Profile domain model | `customerProfile.ts`, `customerProfile.test.ts` |
| 2 | Persistence integration | `customerProfileDocument.ts` (+`.test.ts`); `userDocument.ts`, `customerIdentityRepository.ts` (convention baseline) |
| 3 | Authoritative schema | TRD10 §10.6.2 (`customerProfiles`) |
| 4 | Founder decision | `DEC-PROD-012` (Decision Register); gender-omission implementation |
| 5 | Error contract | `errorCategories.ts` (14 categories), `identityErrors.ts` (profile factories) |
| 6 | Privacy | PR-005 (`toPublicCustomerProfile`); security-rules posture (`ENG-P2-001-05` report §5) |
| 7 | Concern-completion policy | Definition of Done §2; `DEC-GOV-008`/`-009`/`-010`; `CDR-001` §5 |

## 4. Required Determinations

### 4.1 Implementation matches architecture — **PASS**
`customerProfile.ts` implements exactly TRD10 §10.6.2's `customerProfiles`-owned mutable fields (`firstName`, `lastName`, `dateOfBirth?`, `city?`, `interests`, `preferredCategories`, `communicationPreferences`, `consentVersions`, `profileCompletionPercent`). It owns no identity-binding logic (`-01`/`-03`/`-04`/`-05`), no authentication references, and no ITM trust state — consistent with the `IDENTITY-ALIGN-001` concern boundary. Identity-only fields (`displayName`/`countryCode`/`preferredLanguage`/phone/email) are correctly excluded (they live on the `users` document, TRD10 §10.6.1). Pure domain module: `Date` timestamps, no Firebase import (machine-enforced by the scoped ESLint boundary rule).

### 4.2 Persistence integration matches architecture — **PASS**
The `CAP-P2-007` wiring extends `-05`'s `customerProfiles` converter (`customerProfileDocument.ts`) with `toCustomerProfileFields`/`fromCustomerProfileFields`. It:
- persists the flat field set exactly as TRD10 §10.6.2 defines (flat, not nested);
- performs the *only* Firestore-specific concern — `consentVersions.acceptedAt` `Date↔Timestamp` mapping — using the same `toTimestampLike`/`fromTimestampLike` cast convention already established in `userDocument.ts` (no new serialization approach introduced);
- **delegates all field validation** back to `-02`'s `serializeCustomerProfileFields`/`deserializeCustomerProfileFields` (validation boundary stays in the domain model — the converter adds none of its own);
- keeps the profile fields **optional** on the persisted type, preserving the pre-existing shell-document behaviour (a loyalty/QR projection may exist before a `-02` profile is issued);
- introduces **no** new repository, does not alter the two existing repositories' transactions, and opens **no** client read path (no security-rules change; `git status` scope = 2 files). Persistence ownership is `-05`'s, exactly as recorded in `CDR-001` §5 / `CAP-P2-006`.

### 4.3 Privacy obligations remain satisfied — **PASS**
`toPublicCustomerProfile` (PR-005) still exposes only `{ firstName }`; DOB, city, consent versions, communication preferences, interests, and last name are never revealed by the public projection (unit-tested). The persistence wiring is server-side only and adds no read surface: `customerProfiles` security rules remain `allow read, write: if false` (`ENG-P2-001-05` report §5) — no customer-facing read was opened by this change. Consent versions are required at write time (TRD21) and persisted, not exposed.

### 4.4 Customer Profile remains consistent with TRD10 — **PASS**
Field names, types, optionality, and the flat document shape match TRD10 §10.6.2 as amended by `DEC-PROD-012` Option D. `consentVersions.acceptedAt` persists as a Firestore `Timestamp` (per schema). Progressive-KYC rule honoured: absent optionals are omitted, not placeholder-populated (unit-tested on both the model and the converter).

### 4.5 DEC-PROD-012 remains correctly implemented — **PASS**
No `gender` field exists on the `-02` contract; `createCustomerProfile`/`updateCustomerProfile` reject any `gender` (or other unsupported) input via `unsupportedProfileFieldError`; `serializeCustomerProfileFields` never emits `gender`; and the `CAP-P2-007` persistence converter — because it delegates to `serializeCustomerProfileFields` — likewise can never persist a `gender` field (unit-tested: `"gender" in fields` is `false`). Consistent with TRD10 §10.6.2's struck-through `gender` and the future-additive governance note.

### 4.6 Error taxonomy remains unchanged — **PASS**
`errorCategories.ts` is the closed 14-category set (TRD11 §11.35), unchanged. Profile errors reuse `IdentityDomainError` mapped to `VALIDATION_FAILED` (`invalidProfileFieldError`, `missingProfileConsentError`, `unsupportedProfileFieldError`, `immutableProfileBindingError`, `malformedCustomerProfileRecordError`) and `RESOURCE_NOT_FOUND` (`customerProfileNotFoundError`). No new category, no competing error hierarchy. The persistence converter raises no errors of its own — it surfaces `-02`'s.

## 5. Findings

No architecture defect, code defect, or runtime defect was identified. No previously-closed finding (F1–F11, F9b, error-category governance, FEF adoption, R2-01/R2-02) is contradicted by new evidence.

| Ref | Type | Severity | Disposition |
|---|---|---|---|
| — | (none) | — | No corrections required |

**Observation (non-defect):** the pre-existing `userId` field name on `customerProfiles` (TRD10-inherited; `ENG-P2-ARCH-CORR-004` Finding F5) remains the only place naming the aggregate reference something other than `customerIdentityId`. It is cosmetic (no code reads the wrong field) and its rename is already deferred to `ENG-P2-001-NAMING-001`. Out of `CAP-P2-007` boundary; not reopened here.

## 6. Definition of Done §2.6 Coverage Statement (G1)

Per `DEC-GOV-009` (G1), this review constitutes the **§2.6 Technical Review coverage** for `ENG-P2-001-02` (the package implemented after the `ENG-P2-ARCH-REVIEW-001/002` baseline) and for the `CAP-P2-007` persistence wiring. Result: **PASS — no open corrections.** Consistent with the Technical Review Standard, final **Approved** status is realized upon Founder merge authorization of the `CAP-P2-007` PR (this record is findings-only and does not self-merge).

## 7. Final Status

**PASS — no open corrections.** `ENG-P2-001-02` (with its `CAP-P2-007` persistence wiring) matches the current authoritative architecture on all six required determinations; DoD §2.6 coverage is provided (G1).
