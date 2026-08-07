# CAP-P2-009 — Authentication Architecture & Delivery Planning

> **Title:** CAP-P2-009 — Authentication Architecture & Delivery Planning
> **Version:** 1.0 · **Status:** Architecture & planning record — planning only, no implementation authorised · **Classification:** Working (planning record)
> **Governing document:** 11thONUS Platform Constitution; Engineering Governance Charter; [`ENG-P2-ARCH-001`](../roadmap/ENG-P2-ARCH-001-customer-identity-architecture.md) (§7 Authentication boundary)
> **Source-of-truth path:** `docs/05-implementation/reports/CAP-P2-009-authentication-architecture-and-delivery-planning-2026-08-07.md`
> **Last controlled update:** 2026-08-07 (`CAP-P2-009` — created)

**This document plans; it authorises no implementation.** No production code, schema, API, UI, authentication mechanism, or trust logic is created or modified. It conforms to the existing merged architecture (`ENG-P2-ARCH-001` §7) — it does **not** redesign it. It prepares the **customer Authentication** concern of Capability 2 for a future, separately Founder-authorised implementation stream. Customer Identity is `Complete` (`CAP-P2-008`); Authentication remains `Not started — Unauthorised`.

## 1. Authentication Scope

The customer **Authentication** concern is the credential-verification and session/access layer that **proves a returning credential and resolves it to exactly one Customer Identity Aggregate**, minting/resolving the Authentication *reference* that the already-merged Customer Identity link/unlink interface consumes. Per `DEC-IDENTITY-001` (Authentication Principle) and TRD12 §12.4.1, supported customer providers are **equal** — none is the identity, none is designated primary:

- mobile phone number with OTP (Firebase Phone Sign-In) — `DEC-PROV-004` initial-approved;
- Google Sign-In — `DEC-PROV-004` initial-approved;
- email (password or passwordless) — TRD12 §12.4.1 (MVP inclusion **requires Founder confirmation**, §7 D-A2);
- Apple / Passkeys / future providers — additive, deferred (`DEC-IDENTITY-001`, `DEC-PROV-004` point 4).

Per `DEC-PROV-004` (points 5–6) / `DEC-IDENTITY-001`: **browsing never requires authentication**; authentication is required **only for identity-protected actions**; standard loyalty participation (register, earn, redeem the standard reward) is identity-gated, never authentication/trust-gated.

**Explicitly out of this stream** (adjacent concerns, separately governed): business-owner/manager authentication (TRD12 §12.4.2), staff authentication (§12.4.3; `DEC-SEC-003` `OPEN_ENGINEERING`), and platform-administrator authentication (§12.4.4; `DEC-SEC-002`) — these belong to Business/Staff Identity (`ENG-P2-002`/`-003`, Capability 3) and later phases. Authentication does **not** own identity, trust (ITM), or role/permission context (`ENG-P2-004`).

## 2. Functional Responsibilities

1. **Sign-in flows (frontend, `apps/web`):** Phone OTP (with the reCAPTCHA lifecycle already root-caused in the `ENG-P1-003` hosting stage), Google Sign-In, email; provider config disabled-by-default with placeholders.
2. **Credential verification (backend):** verify Firebase ID tokens via the Admin SDK; resolve the verified credential to an Authentication reference (`{referenceType}:{referenceId}` where `referenceId` is the Firebase `authUid`).
3. **Registration vs sign-in orchestration:** a new credential → create a Customer Identity (via merged `ENG-P2-001-01` registration) and link the reference; an existing credential → resolve to the owning identity. Guest → Registered → Active per `ENG-P2-ARCH-001` §3.
4. **Account linking:** multiple providers resolve to one Firebase Auth user and one platform user (TRD12 §12.5; `AIR-001`/`-002`/`-003`); prevents duplicate identities by consuming the merged `ENG-P2-001-08` uniqueness collection (`authenticationReferences/{type}:{id}`).
5. **Session / access:** establish the authenticated session; gate identity-protected actions; sign-out; privileged re-authentication for sensitive actions (input to risk-based gating).
6. **Recovery credential-proof step:** perform the actual OTP/email/provider proof, then hand a **proven** Authentication reference to the merged `ENG-P2-001-07` recovery orchestration (which explicitly accepts proof performed upstream).
7. **Authentication events:** emit sign-in / link / unlink / verification events as **fire-and-forget signals** to ITM (trust progression) and audit (`ENG-P2-001-10`) — never gating identity or standard participation.
8. **Credential secrecy:** never persist passwords, OTP secrets, or provider tokens in Firestore (TRD10 §10.6.1) — these remain in Firebase Authentication.

## 3. Architectural Boundaries

Per `ENG-P2-ARCH-001` §7 (authoritative, merged): **"Authentication provides access. Authentication does not own identity."** Every authenticated action resolves through an Authentication reference back to exactly one Identity Aggregate. This stream **consumes, never modifies**, the merged Customer Identity interfaces:

| Merged interface (Customer Identity, `Complete`) | Authentication's use |
|---|---|
| `ENG-P2-001-01` registration + `authenticationReference` model (`phone_otp`/`google_sign_in`/`email`/`future_provider`) | Create identity for a new credential; construct the reference to link |
| `ENG-P2-001-08` link/unlink + `authenticationReferences/{type}:{id}` uniqueness | Link a verified credential; prevent duplicate identities (fail-closed) |
| `ENG-P2-001-09` identity lookup by Authentication reference | Resolve an authenticated credential to its identity |
| `ENG-P2-001-07` recovery orchestration (accepts already-proven reference) | Hand a proven reference into recovery |
| `ENG-P2-001-10` audit + shared `ENG-P1-002` outbox/events | Emit authentication events |

Shared-foundation reuse (`ENG-P1-002`): command/event/idempotency/outbox contracts and the **closed 14-category error taxonomy** (TRD11 §11.35) — no new error category. Firebase Auth is the credential authority; Firestore holds only references (TRD10 §10.6.1). Authentication → ITM is one-directional signal emission — **no dependency on ITM being built**.

## 4. Package Decomposition (recommended)

**Numbering gap (requires a Founder/programme decision — §7 D-A1):** `ENG-P2-002`/`-003`/`-004` are already reserved for **Business Identity / Staff Identity / role context** (CDR-001 §2, Capability 3), so the Authentication stream has **no reserved work-package number**. A new series must be registered (e.g., `ENG-P2-005`/`ENG-AUTH-*`). The decomposition below is a recommendation, not a registration:

| # | Package (working name) | Scope | Depends on |
|---|---|---|---|
| AUTH-BP | Engineering blueprint | The Authentication engineering blueprint (analogous to `ENG-P2-ARCH-001` / `ENG-P1-002-PREP`) | this plan |
| AUTH-01 | Auth domain & contracts | Provider-neutral auth-result contract, token-verification **port**, session contract (pure domain, no Firebase import) | shared foundation |
| AUTH-02 | Token verification + reference resolution | Firebase ID-token verification (Admin SDK adapter); resolve → Authentication reference; link via `-08` | AUTH-01, `-08`/`-09` |
| AUTH-03 | Registration / sign-in orchestration | New vs returning credential; guest→registered; duplicate prevention (`-08`) | AUTH-02, `-01` |
| AUTH-04 | Frontend sign-in flows | Phone OTP (reCAPTCHA), Google Sign-In, email; disabled-by-default provider config | AUTH-02 |
| AUTH-05 | Account linking | Multi-provider → one identity (`AIR-001..003`, TRD12 §12.5) | AUTH-03, `-08` |
| AUTH-06 | Recovery credential proof | Perform proof, hand proven reference to `-07` | AUTH-02, `-07` |
| AUTH-07 | Session / access gating | Session establishment, identity-protected-action gating, privileged re-auth, sign-out | AUTH-03 |
| AUTH-08 | Authentication events → ITM/audit | Emit fire-and-forget trust/audit signals | AUTH-02, `-10` |
| AUTH-09 | Validation & closure review | Concern-completion validation (per `DEC-GOV-008`/`-009`/`-010`) | all above |

## 5. Dependencies

**Satisfied (merged):** Customer Identity concern (`Complete` — interfaces `-01`/`-07`/`-08`/`-09`/`-10`); shared foundation `ENG-P1-002`; Firebase platform `ENG-P1-001`; deny-by-default Rules + observability `ENG-P1-003`; the reCAPTCHA/App-Check lifecycle fix and Hosting/preview configuration from the `ENG-P1-003` hosting stage. **Decisions CONFIRMED:** `DEC-PROV-004`, `DEC-SEC-001`, `DEC-IDENTITY-001`, `DEC-ID-001`, `DEC-ID-002`.

**Conditions / open (not build blockers):** `EXT-TECH-001` (Burundi real-SMS carrier delivery test — still not performed) is a **production-activation** condition for the phone-OTP provider, not a design/build blocker (development and tests run against the Firebase Auth Emulator + test numbers); ITM is **not** required (signal emission is fire-and-forget).

## 6. Required Engineering Order

Blueprint → AUTH-01 domain contracts → AUTH-02 token verification + reference resolution → AUTH-03 registration/sign-in orchestration → AUTH-04 frontend flows → AUTH-05 account linking → AUTH-06 recovery proof → AUTH-07 session gating → AUTH-08 events → AUTH-09 validation/closure. **TDD throughout** (failing test first); each package delivered as its own PR, **not merged without fresh Founder authorization**; interfaces to `-07`/`-08`/`-09` treated as frozen (rework risk if not — `ENG-P2-001-PLAN-001` §14).

## 7. Required Founder Decisions

- **D-A1 — Work-package numbering/registration** for the Authentication stream (`ENG-P2-002/003/004` are taken by Business/Staff/role — a new series is needed). *Programme decision; blocks registration, not analysis.*
- **D-A2 — MVP provider set:** confirm whether **email** (password / passwordless) is in MVP Authentication scope or deferred, and confirm **Apple/Passkeys are deferred**. `DEC-PROV-004` named only **Phone + Google** as *initial* mechanisms; TRD12 §12.4.1 lists email and Apple as supported. *Scope-clarity decision.*
- **D-A3 — Duplicate-identity merge authority:** `ENG-P2-001-08` does detection/fail-closed refusal only; `ENG-P2-001-PLAN-001` §14 Ambiguity 4 (automatic merge authority) remains **unresolved**. Confirm the merge / support-review workflow (PRD2 §23 Support Review → Verification → Merge).
- **D-A4 — `EXT-TECH-001` gate:** confirm it remains a **launch-readiness** condition (not a build blocker) and confirm the fallback path if Burundi SMS proves unacceptable (`DEC-PROV-004` point 9 — Engineering returns with a comparative recommendation before changing provider).
- **D-A5 (adjacent — flag only):** confirm `DEC-SEC-003` (staff shared-device authentication, `OPEN_ENGINEERING`) is **out of this customer-Authentication stream** (it belongs to Business/Staff Identity).

Session model / token lifetime / re-auth policy are assessed as **engineering-level** (no Founder decision required) unless the Founder wishes to set them.

## 8. Validation Strategy

TDD (RED→GREEN) for every package; **Firebase Auth Emulator** for token-verification and sign-in flows (**no live SMS in CI** — matching `ENG-P2-001-05`'s real-emulator pattern and `EXT-TECH-001`'s test-number strategy); a network-safety harness ensuring **no live transport in tests** (matching the Stage-3 Sentry pattern); deny-by-default Rules coverage; a **secret/credential scan** proving no password/OTP/token is persisted (TRD10 §10.6.1); duplicate-prevention emulator tests; full monorepo `typecheck`/`lint`/`format`/`test`/`build`. At closure: a **bounded hosted preview** validation of phone-OTP (no real SMS in CI), per the `ENG-P1-003` hosting/preview precedent.

## 9. Risks

- **EXT-TECH-001** — unproven Burundi SMS delivery (production risk, not build risk; mitigated by emulator/test-number development and the `DEC-PROV-004` point-9 fallback).
- **Interface stability** — `-07`/`-08`/`-09` interfaces must stay stable as Authentication's real implementation lands (`ENG-P2-001-PLAN-001` §14; `-07` explicitly deferred provider relink).
- **Duplicate-identity edge cases** — merge authority unresolved (D-A3).
- **reCAPTCHA / App-Check in production** — root-caused in preview; needs production hardening.
- **Provider-scope creep** (Apple/passkeys/email) — keep additive, disabled-by-default; resolve D-A2 first.
- **Numbering ambiguity** (D-A1) — could cause programme-tracking drift if not decided before the stream registers.

---

**Status:** planning only. Authentication remains `Not started — Unauthorised`; Capability 2 remains `Open — partially implemented; not closed`. No capability numbering, boundary, or Customer Identity/ITM change. **Stop for Founder review — Authentication implementation must not begin without fresh Founder authorization.**
