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
| Phone OTP | optional / non-blocking | absent from the core preview; no SMS; capability implemented; SMS-market readiness = `EXT-TECH-001` (non-blocking) |

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
