# AUTH-BP — Authentication Blueprint

> **Title:** AUTH-BP — Authentication Blueprint
> **Version:** 1.0 · **Status:** Authoritative implementation blueprint — planning only, no implementation authorised · **Classification:** Working (engineering blueprint)
> **Governing document:** 11thONUS Platform Constitution; Engineering Governance Charter; [`ENG-P2-ARCH-001`](ENG-P2-ARCH-001-customer-identity-architecture.md) (§7 Authentication boundary); [`DEC-AUTH-001`](../../00-governance/decisions/decision-register.md)
> **Source-of-truth path:** `docs/05-implementation/roadmap/AUTH-BP-authentication-blueprint-2026-08-08.md`
> **Last controlled update:** 2026-08-08 (`AUTH-BP` — created)

**This blueprint defines the engineering contract for `AUTH-01`–`AUTH-09`. It authorises no implementation** and creates/modifies no runtime code. It **references** the existing merged architecture (`ENG-P2-ARCH-001` §7, the merged Customer Identity concern, and the `ENG-P1-002` shared foundation) and does **not** redesign it. Each `AUTH-*` package remains a separately Founder-authorised task. Analogous in role to the [`ENG-P1-002` blueprint](../prompts/ENG-P1-002-engineering-blueprint-2026-07-25.md) and [`ENG-P2-ARCH-001`](ENG-P2-ARCH-001-customer-identity-architecture.md).

## 0. Governing constraints (authoritative, unchanged here)

- **`ENG-P2-ARCH-001` §7:** *Authentication provides access; it does not own identity.* Every authenticated action resolves through an Authentication reference to exactly one Identity Aggregate.
- **`DEC-AUTH-001`** (D-A2 as amended by **`AUTH-CORR-003`**, 2026-08-12): MVP providers = **Google + Email/Password + optional Phone OTP** (Apple/email-link/passkeys deferred; future additive; no provider defines identity); duplicate-identity merge is a **separate governed capability** (Authentication identifies + refers, never auto-merges); `EXT-TECH-001` (Burundi SMS) is a **production-launch** concern (build on the Firebase Auth Emulator) and Phone OTP is optional so its SMS readiness never blocks registration; **customer ≠ staff** authentication.
- **`DEC-IDENTITY-001`:** browsing never requires authentication; standard loyalty participation is identity-gated, never authentication/trust-gated; providers are equal.
- **TRD10 §10.6.1:** Firestore **never** stores passwords, OTP secrets, or provider tokens — these remain in Firebase Authentication. Firestore holds only *references*.
- **TRD11 §11.35:** the closed **14-category error taxonomy** — reused, **no new category**.

## 1. Overall Authentication architecture

Authentication is a thin **access layer** over Firebase Authentication that converts a *verified provider credential* into a *resolved Customer Identity* and a *session*, then hands off to the merged Customer Identity interfaces. Layers (all conform to the `ENG-P1-002` hexagonal pattern — pure domain, ports, Firebase adapters):

| Layer | Location (new, under the `AUTH-*` packages) | Responsibility |
|---|---|---|
| **Domain** | `functions/src/domains/authentication/models/*` | Provider-neutral `AuthenticatedCredential`, `AuthResult`, `SessionContext`, auth events, auth errors (reusing `IdentityDomainError`-style factories on the 14-category taxonomy). No Firebase import. |
| **Ports** | `functions/src/domains/authentication/ports/*` | `TokenVerifierPort` (verify a provider credential → `AuthenticatedCredential`); consumes the merged identity repositories as ports. |
| **Backend adapters/services** | `functions/src/domains/authentication/services/*`, `functions/src/index.ts` callables | Firebase Admin ID-token verification; registration/sign-in/link/recovery orchestration; session issuance; event emission via the shared outbox. |
| **Frontend** | `apps/web/src/authentication/*` | Provider sign-in flows (Phone OTP, Google) building on the merged `apps/web/src/infrastructure/firebase/{app,auth,appCheck}.ts` and the `dev/phoneAuthHarness` reference; disabled-by-default provider config. |

**Consumes (never modifies) the merged Customer Identity concern:** `customerIdentityRepository.createCustomerIdentity` (takes `initialAuthenticationReference`), `authenticationReferenceRepository` (link/unlink + `authenticationReferences/{type}:{id}` uniqueness), `identityLookupRepository` (lookup by Authentication reference, purpose-gated), `identityRecoveryRepository` (recovery accepting a proven reference), and the `authenticationReference` model (`phone_otp`/`google_sign_in`/`email`/`future_provider`). **Reuses the `ENG-P1-002` shared foundation** (`shared/{commands,correlation,errors,events,idempotency,logging,metadata,outbox,validation}`) and `infrastructure/firebase/admin.ts`.

## 2. Authentication lifecycle

```
Guest ──sign-in(new credential)──▶ Registered ──▶ Active session
  │                                     ▲
  └──sign-in(existing credential)───────┘
Active ──sign-out──▶ Guest      Active ──link provider──▶ Active (multi-provider)
Suspended/Locked (access states, DEC-IDENTITY-001 / ENG-P2-ARCH-001 §3) restrict access without changing identity existence.
```

Aligns exactly with `ENG-P2-ARCH-001` §3 (Guest → Registered → Active) — Authentication drives the *access* transitions; the Identity Aggregate owns the *identity* lifecycle. Suspension/lock are **access** decisions (Authentication-layer), not identity-existence decisions.

## 3. Provider architecture

Provider-neutral by construction (`DEC-IDENTITY-001` Authentication Principle; `DEC-PROV-004` point 2). One `TokenVerifierPort` with per-provider adapters; a closed provider registry keyed by `AuthenticationReferenceType`:

- **`google_sign_in`** — Firebase Google provider. MVP.
- **`email`** — Firebase Email/Password (`sign_in_provider` = `password`). **MVP** _(added by `AUTH-CORR-003`, Founder multi-provider decision; email-link/passwordless stays deferred)_.
- **`phone_otp`** — Firebase Phone Sign-In (reCAPTCHA/App-Check on the client; ID-token verified server-side). MVP, **optional/non-default** _(`AUTH-CORR-003`: SMS unavailability must not block Google/Email registration)_. Reference implementation exists in `apps/web/src/dev/phoneAuthHarness`.
- **Apple, email-link/passwordless, passkeys, `future_provider`** — **Deferred** (`DEC-AUTH-001` D-A2 as amended by `AUTH-CORR-003`); the registry and `AuthenticationReferenceType` already reserve `future_provider`, so addition is additive with no identity change.

> **[AMENDED 2026-08-12 — `AUTH-CORR-003`, Founder multi-provider decision.]** MVP approved providers are **Google + Email/Password + optional Phone OTP** — alternative authentication methods, **none defining the customer identity** (one identity → one Firebase principal → one or more methods). The earlier "Phone OTP + Google; email deferred" scope (originally listed above) is superseded. AUTH-02's verified-provider map adds `password → email`; the frontend registry (`AuthProviderId`) adds `email`, disabled-by-default. See the [`AUTH-CORR-003` report](../reports/AUTH-CORR-003-multi-provider-authentication-2026-08-12.md).

Each adapter yields the same `AuthenticatedCredential { referenceType, referenceId (Firebase authUid), verifiedAt, providerSignals }`. **No credential material (tokens/OTP secrets) ever leaves Firebase Auth or enters Firestore** (TRD10 §10.6.1).

> **[AMENDED 2026-08-09 — `AUTH-CORR-002`, Founder decision: provider-qualified authentication references.]** An authentication reference's **canonical identity is the provider-qualified tuple `(referenceType, referenceId)`** — *not* the bare Firebase authUid on its own. The Firebase user/session principal (the authUid) and an individual authentication reference are distinct concepts: under the current architecture `referenceId` remains the verified authUid (AUTH-02 continues to derive `referenceId = decoded.uid`), but it is the reference identity **only when qualified by `referenceType`**. Consequently the same verified authUid under two providers (e.g. `phone_otp` and `google_sign_in`) is **two distinct authentication references** on one customer identity. Global uniqueness, resolution, deduplication, unlinking, and the last-reference invariant all operate on the full tuple; the authoritative `authenticationReferences/{referenceType}:{referenceId}` document remains the uniqueness/resolution representation. This amendment introduces **no** external provider-subject, phone/email subject, hashing, secret, or migration mechanism, and no new error category. Full independence of the reference subject from the Firebase principal is *not* required by the current architecture. Original wording above is preserved; see the [`AUTH-CORR-002` report](../reports/AUTH-CORR-002-authentication-reference-keying-2026-08-09.md).

## 4. Identity resolution flow

Every authenticated request resolves a verified credential to exactly one Identity Aggregate:

1. Client obtains a Firebase ID token; backend callable verifies it (Admin SDK) → `AuthenticatedCredential`.
2. `identityLookupRepository` lookup by Authentication reference (`{referenceType}:{referenceId}`, purpose = `authentication`).
3. **Found →** returns the owning `customerIdentityId` (sign-in path, §6). **Not found →** registration path (§5).
4. Resolution is exact-match, non-enumerable (reuses `-09`'s enumeration-resistance). Failure → `AUTH_REQUIRED`/`RESOURCE_NOT_FOUND` per §11.

## 5. Registration flow (new credential)

Transactional + idempotent, reusing the merged registration path:

1. Verify credential (§3) → `AuthenticatedCredential`.
2. Duplicate-prevention pre-check via `authenticationReferences/{type}:{id}` (`-08`). If the pair already belongs to another identity → **fail closed**, emit conflict signal, **refer** to the governed merge process (never auto-merge; `DEC-AUTH-001` D-A3).
3. `createCustomerIdentity({ …, initialAuthenticationReference })` — creates `users/{id}` + links the reference atomically (existing `-01`/`-05` transaction + shared idempotency/outbox). Loyalty Number / QR issuance follow their existing `-03`/`-04` paths.
4. Establish session (§9); emit `CustomerAuthenticated` + `AuthenticationReferenceLinked` events (§10).

Standard participation requires **no** verification gate beyond holding an identity (`DEC-IDENTITY-001` Standard Participation Principle).

## 6. Returning-user sign-in flow

1. Verify credential (§3) → resolve identity (§4, found).
2. Check identity access state (`active`/`suspended`/`locked` via `-06`); `suspended`/`locked` → `AUTH_FORBIDDEN`/`ACCOUNT_SUSPENDED` (§11), no session.
3. Establish session (§9); emit `CustomerAuthenticated` (+ a trust-relevant "verified sign-in" signal to ITM, fire-and-forget, §10). No identity mutation on ordinary sign-in.

## 7. Account-linking flow

Per TRD12 §12.5 / `AIR-001..003`: multiple providers → one Firebase Auth user → one platform user.

1. Authenticated session required (link is an identity-protected action).
2. Verify the new provider credential (§3).
3. `authenticationReferenceRepository.linkAuthenticationReferenceForIdentity` (existing `-08`, transactional, idempotent) — cross-identity conflict **fails closed** + emits `AuthenticationReferenceConflictDetected` for the governed review; never auto-merges.
4. Unlink mirrors `-08` (history-preserving; the merged `lastAuthenticationReferenceCannotBeUnlinked` invariant protects the final reference). Emit `AuthenticationReferenceLinked`/`Unlinked` (§10).

## 8. Recovery flow

Authentication owns the **credential-proof** step only; identity recovery orchestration is the merged `-07`:

1. Out-of-band recovery entry resolves a candidate identity by Customer Identity ID / Loyalty Number / current QR reference (`-07`/`-09`, non-enumerable) — Authentication does **not** widen this surface.
2. Authentication performs the actual provider proof (OTP/Google) and constructs a **proven** `RecoveryProof`/Authentication reference.
3. Hand the proven reference to `identityRecoveryRepository` (`-07`), which validates no duplicate, transitions status (`-06`), preserves history/loyalty/QR/trust references, and emits `IdentityRecovered`.
4. Risk-based verification strength for recovery is proportional to risk (`DEC-SEC-001` Principle 5 / ITM), consumed as a reference — not computed by Authentication.

## 9. Session lifecycle

- Session = a resolved `{ customerIdentityId, authReference, issuedAt, trustSignals(ref) }` derived from a verified Firebase ID token; Firebase Auth remains the token authority (no bespoke token store; TRD10 §10.6.1).
- Identity-protected actions require a valid session; **browsing does not** (`DEC-PROV-004` point 5).
- **Privileged re-authentication** for sensitive/risk-gated actions (TRD12 §12.4.2; `DEC-SEC-001`) — a fresh proof, not a new identity.
- Sign-out clears the client session; server holds no long-lived session state to revoke beyond Firebase's own.

## 10. Event flow

All events use the shared `DomainEvent`/`EventActor` contract and are written through the shared **outbox** (`shared/outbox`), inside the same transaction as the state change where applicable (registration/link). Events (privacy-safe, no credential material; TRD21):

- `CustomerAuthenticated` (sign-in) · `AuthenticationReferenceLinked` / `AuthenticationReferenceUnlinked` · `AuthenticationReferenceConflictDetected` (reuses `-08`'s) · `AuthenticationRecoveryProofProvided`.
- **→ ITM:** verified sign-ins/links are fire-and-forget **trust signals** (`ENG-P2-ARCH-001` §8) — never gate identity or standard participation.
- **→ Audit:** consumed by the merged `-10` identity-audit projection.

## 11. Error handling

Reuses the closed **14-category taxonomy** (TRD11 §11.35) via an `AuthenticationDomainError` factory set (mirroring `identityErrors.ts`), **no new category**:

| Case | Category |
|---|---|
| Not authenticated / token missing-invalid | `AUTH_REQUIRED` |
| Access forbidden (locked / not permitted) | `AUTH_FORBIDDEN` |
| Suspended account | `ACCOUNT_SUSPENDED` |
| Credential resolves to no identity (sign-in) | `RESOURCE_NOT_FOUND` |
| Duplicate reference / cross-identity link conflict | `VALIDATION_FAILED` (fail-closed + refer) |
| Concurrent auth command in progress | `IDEMPOTENCY_CONFLICT` |
| Firebase Auth / SMS transient failure | `TEMPORARY_UNAVAILABLE` |
| Provider integration failure | `INTEGRATION_FAILED` |

Errors are enumeration-resistant at the resolution boundary (reuse `-09` semantics); messages never leak whether a credential "exists".

## 12. Package decomposition (`AUTH-01`–`AUTH-09`)

| Package | Scope | Primary location |
|---|---|---|
| **AUTH-01** | Authentication domain & contracts — `AuthenticatedCredential`, `AuthResult`, `SessionContext`, auth events, `AuthenticationDomainError` factories, `TokenVerifierPort` (pure domain, no Firebase). | `functions/src/domains/authentication/{models,ports}` |
| **AUTH-02** | Firebase ID-token verification + reference resolution — Admin-SDK adapter for `TokenVerifierPort`; resolve credential → identity via `-09`; link via `-08`. | `functions/src/domains/authentication/services`, `infrastructure/firebase/admin.ts` |
| **AUTH-03** | Registration / sign-in orchestration — new-vs-returning; `createCustomerIdentity` for new; duplicate-prevention via `-08`; idempotent (shared idempotency/outbox). | `functions/src/domains/authentication/services`, `functions/src/index.ts` callables |
| **AUTH-04** | Frontend sign-in flows — Phone OTP (reCAPTCHA/App-Check) + Google; disabled-by-default provider config; builds on merged `infrastructure/firebase/*` and the `phoneAuthHarness` reference. | `apps/web/src/authentication/*` |
| **AUTH-05** | Account linking — multi-provider → one identity (`AIR-001..003`, `-08`); conflict fail-closed + refer. | `functions/src/domains/authentication/services` |
| **AUTH-06** | Recovery credential proof — perform proof; hand proven reference to `-07`. | `functions/src/domains/authentication/services` |
| **AUTH-07** | Session / access gating — session establishment, identity-protected-action gate, privileged re-auth, sign-out. | `functions/src/domains/authentication/services`, `apps/web/src/authentication/*` |
| **AUTH-08** | Authentication events → ITM/audit — emit fire-and-forget trust/audit signals via outbox. | `functions/src/domains/authentication/services` |
| **AUTH-09** | Validation & closure review — concern-completion validation (`DEC-GOV-008`/`-009`/`-010`) + bounded hosted-preview check (no live SMS in CI). | reports + full-suite validation |

## 13. Testing strategy

TDD (RED→GREEN) for every package. **Firebase Auth Emulator** for token-verification/sign-in/registration/linking (no live SMS in CI; `DEC-AUTH-001` D-A4; matches `-05`'s real-emulator pattern and the `phoneAuthHarness`/EXT-TECH-001 test-number strategy). Backend: unit tests for pure domain (AUTH-01) + real-emulator tests for services (AUTH-02/03/05/06/07). Frontend: component/unit tests with a **network-safety harness** (no live transport — the Stage-3 Sentry pattern). Duplicate-prevention, enumeration-resistance, and "no credential persisted" (grep/secret scan, TRD10 §10.6.1) are explicit test obligations.

## 14. Validation strategy

Per package: `tsc`/`eslint`/`prettier`/`vitest` + emulator suites; full monorepo build. Deny-by-default Rules coverage (no new client write path opened). AUTH-09 closure: concern-completion criteria (`CDR-001` §5 / DoD §2, per `DEC-GOV-009`/`-010`) + a bounded hosted-preview check. ~~a bounded hosted-preview phone-OTP check (no live SMS in CI)~~ Production SMS activation stays governed by `EXT-TECH-001` — **not** a build/validation gate.

> **[AMENDED 2026-08-12 — `AUTH-CORR-003`: multi-provider hosted-preview closure criteria]** the stale Phone-OTP-only closure requirement is replaced. Authentication-concern hosted-preview closure (per the `ENG-P1-003`/`EXT-TECH-001` precedent; Founder-executed, no live SMS) is:
> 1. **Email/Password** hosted sign-up/sign-in must **PASS** (mandatory core).
> 2. **Google** hosted sign-up/sign-in must **PASS** (mandatory core).
> 3. **Phone OTP** must remain implemented/provider-capable, exercised with a Firebase **test phone number** where the authorized dev environment supports it without live SMS.
> 4. Phone OTP SMS/provider readiness **must not block** core Authentication-concern closure when Email/Password and Google pass and the remaining Phone OTP issue is **environment/provider readiness**, not a platform-authentication architecture defect.
> 5. Phone OTP requires its own **provider/readiness validation before live market enablement** (`EXT-TECH-001`).

## 15. Exit criteria per package

Each `AUTH-*` package is done only when: (a) its Acceptance Criteria are met verbatim; (b) all Required Tests pass (unit + emulator as scoped); (c) local validation actually run; (d) implementation report + changes-tracking produced; (e) **Technical Review Approved** (DoD §2.6 / G1 — a package post-dating this blueprint needs its own coverage); (f) committed/pushed; (g) no unrelated files modified; (h) no credential material persisted (verified). Deploy/Preview/Manual-QA (DoD §2.8–2.10) are Release/Production-Readiness (G2), not per-package concern criteria — except AUTH-09's bounded hosted-preview check. **`AUTH-01`** additionally: pure domain, no Firebase import (ESLint boundary). **`AUTH-04`**: providers disabled-by-default; no real DSN/keys committed.

## 16. Risks & implementation sequencing

**Sequencing (dependency order):** AUTH-01 → AUTH-02 → AUTH-03 → AUTH-04 → AUTH-05 → AUTH-06 → AUTH-07 → AUTH-08 → AUTH-09. AUTH-02 depends on merged `-08`/`-09`; AUTH-03 on `-01`; AUTH-06 on `-07`; AUTH-04 on the merged `infrastructure/firebase/*`.

**Risks:**
- **`EXT-TECH-001`** — unproven Burundi SMS delivery (production risk; mitigated by emulator/test-number development + `DEC-PROV-004` point 9 fallback).
- **Interface stability** — `-07`/`-08`/`-09` interfaces must stay stable as Authentication lands (`ENG-P2-001-PLAN-001` §14; `-07` deferred provider relink is now AUTH-06's job).
- **Duplicate-identity edge cases** — merge authority is a *separate* governed capability (D-A3); Authentication only detects + refers.
- **reCAPTCHA / App-Check in production** — root-caused in the `ENG-P1-003` preview; needs production hardening (AUTH-04/AUTH-09).
- **Provider-scope creep** — email/Apple/passkeys stay deferred/additive (D-A2); keep the registry closed and disabled-by-default.

---

**Status:** blueprint only. Authentication remains `Not started — Foundations approved`; Capability 2 remains `Open — partially implemented; not closed`. No capability numbering/boundary change; no Customer Identity/ITM change; no runtime code. **Authentication implementation may commence package-by-package (`AUTH-01`…) under this blueprint, each requiring its own fresh Founder authorization. Stop for Founder review.**
