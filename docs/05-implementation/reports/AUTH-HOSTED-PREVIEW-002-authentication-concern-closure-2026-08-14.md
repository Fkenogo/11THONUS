# AUTH-HOSTED-PREVIEW-002 — Authentication Concern Closure Report

> **Package:** `AUTH-HOSTED-PREVIEW-002` (Stages 1–8) — the Founder-executed bounded hosted-preview validation that closes the customer **Authentication concern** within Capability 2, per the amended `AUTH-BP` §14 multi-provider criteria.
> **Closure date:** 2026-08-14. **Authoritative main:** `5302940c09c3e0f32d5ba1d919d7a4dc536945cf`.

## 1. Outcome
The Authentication concern is **Complete** — every mandatory `AUTH-BP` §14 hosted-validation criterion passed with **backend evidence** (not UI-only). **Concern completion ≠ Capability closure:** Capability 2 remains `Open — partially implemented; not closed`.

## 2. What was validated (hosted preview `auth-preview-002`, project `eleventh-on-us-dev`)
The isolated multi-provider sign-in preview built from `main` `5302940c` (via `build:sign-in-preview`), deployed to the temporary Hosting channel `auth-preview-002`; the `authenticate` callable deployed to `europe-west1` (gen-2). Founder-executed manual tests; agent verified via read-only Admin/Identity-Toolkit/Firestore evidence.

## 3. Final AUTH-BP §14 matrix — all mandatory PASS

| Criterion | Result | Evidence |
|---|---|---|
| Google hosted sign-up/sign-in | **PASS** | identity `e0d60aa0…` active, authoritative `google_sign_in` reference; register-then-signin lifecycle; 7 returning sign-ins, no duplicates (Stage 5) |
| Email/Password fresh registration | **PASS** | identity `912ca4fd…` active; `customer_identity_registered` ×1 + `authentication_reference_linked [email]` ×1 + `customer_authenticated [email]` ×1 at 2026-08-14T08:15:30–31; mode `registered` |
| Email/Password returning sign-in | **PASS** | 2nd `authentication.authenticate` (email) + `customer_authenticated [email]` at 2026-08-14T08:56:40, **no** register/link events → `signed_in`; no new identity/reference |
| Confirm-Password closure condition (F-UX-1) | **PASS** | AUTH-UX-CORR-001 merged (`5302940c`); mismatch blocks registration + localized error (Founder + source); confirm never reaches Firebase/action (2-arg `registerWithEmail`) |
| Multi-provider hosted surface | **PASS** | live-verified two-mode Email + Google, Phone absent (Stage 6) |
| English / French | **PASS** | live-verified en default + fr switch incl. Confirm-Password/error copy (Stage 6) |
| Backend identity/reference integrity | **PASS** | 2 principals (password + google.com, distinct, unlinked), 2 identities, 2 authoritative references, correct `-09` resolution, no duplicates |
| AUTH-08 event evidence | **PASS** | registration + all sign-in `customer_authenticated` events emitted via the shared outbox |
| No credential persistence | **PASS** | `users`/`authenticationReferences` carry no credential/token/password fields; `idempotencyRecords` store only an irreversible `requestHash` |
| No duplicate identities/references | **PASS** | `users`=2, `authenticationReferences`=2, Auth principals=2 after all activity |
| Phone OTP | optional / **non-blocking (governed by `AUTH-BP` §14.4)** | absent from the mandatory-core preview (`VITE_AUTH_ENABLE_PHONE_OTP` off by design); no SMS; capability fully implemented + emulator-validated (`emulators:validate` 221/221) + previously hosted-preview-validated (`EXT-TECH-001` CR3); live-SMS/provider readiness = `EXT-TECH-001` |

### Phone criterion — §14.3 / §14.4 reconciliation (review-driven, closure-scope traceability)
A closure review (Codex P1) asked whether `AUTH-BP` §14.3 ("Phone OTP … exercised with a Firebase test phone number **where the authorized dev environment supports it without live SMS**") mandates a Phone exercise before closure, citing the environment-readiness report. Verified against the governing text:
- **§14.4 is dispositive and explicit:** *"Phone OTP SMS/provider readiness **must not block** core Authentication-concern closure when Email/Password and Google pass and the remaining Phone OTP issue is **environment/provider readiness**, not a platform-authentication architecture defect."* Email/Password **and** Google passed; Phone OTP is a **fully-implemented, emulator-and-CR3-validated capability** (not an architecture defect); the outstanding Phone item is provider/SMS-market readiness. All §14.4 conditions are met → Phone does **not** block closure.
- **§14.3's condition is not triggered:** it applies only *"where the authorized dev environment supports it **without live SMS**."* The `EXT-TECH-001-ENV-READY` matrix establishes only **real-SMS** infrastructure (Phone provider enabled + Blaze billing + Burundi (`BI`) SMS-region allowlist = "capable of attempting **real SMS delivery**"). It does **not** establish a configured Firebase **test-phone-number** (fictional-number/fixed-code) path that would allow exercising Phone **without live SMS**; the prior `EXT-TECH-001` precedent used real-carrier SMS, not test numbers. A no-live-SMS test-number exercise is therefore not a supported/available exception here, and §14.5 keeps live-SMS/test-number validation under `EXT-TECH-001` before market enablement.
- **Conclusion:** the Phone row is correctly **optional/non-blocking** under §14.4; the concern is `Complete` on the mandatory Email/Password + Google criteria. The reviewer's "keep the concern open" conclusion is not supported by §14.4; the report is strengthened to make the §14.3/§14.4 basis explicit (documentation correction only — no change to the closure outcome).

## 4. Lifecycle semantics
First platform registration returned `registered` (Email 08:15; Google 10:09 on 08-13); every subsequent sign-in returned `signed_in` (Google ×7; Email 08:56). No AUTH-03 mode-classification defect.

## 5. Privacy
No test email, password, token, OTP, or UID is reproduced here; evidence is reported as provider categories, reference types, counts, and timestamps only.

## 6. Chronology preserved (governance)
Initial Phone-only closure model (`AUTH-BP` §14) → Founder multi-provider policy (`AUTH-CORR-003`) with §14 amended to Email/Password + Google mandatory, Phone optional/non-blocking → `I18N-001` → `AUTH-PREVIEW-READINESS-001` (isolated preview build + Hosting CSP) → discovery that `authenticate` was undeployed → authorized `authenticate` deployment (Stage 4) → Google PASS (Stage 5) → `AUTH-UX-CORR-001` Confirm-Password correction (Founder-elected closure condition) → preview refresh (Stage 6) → Email registration PASS + returning-sign-in evidence initially absent (Stage 7) → Founder re-ran returning Email sign-in → backend evidence captured → **concern Complete** (Stage 8).

## 7. Status
- **Authentication concern → `Complete`** (concern-level, per `DEC-GOV-008`).
- **Capability 2 → `Open — partially implemented; not closed`** (unchanged). Authentication concern closure does **not** close Capability 2.
- Remaining Capability 2 work: **ITM (Identity Trust Model) — `Not started — Unauthorised`**; **ENG-P2-004 (Registration/role context) — `Blocked — partially`**; role-context/permission-resolution — not authorized; Release-readiness / Manual-QA / deployment (G2) — pending. **AUTH-10 not started.**

## 8. Preview / evidence disposition
`auth-preview-002` retained until this closure PR merges (option B), then delete (`firebase hosting:channel:delete auth-preview-002 --project eleventh-on-us-dev`) or allow expiry 2026-08-21; on delete, re-confirm the channel domain leaves Firebase Auth `authorizedDomains`. `apps/web/.env.sign-in-preview.local` (gitignored) removed at cleanup. Firebase Auth test users retained (not deleted; deletion not authorized). No Firebase/runtime/deploy change was made in this closure stage.
