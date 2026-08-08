# AUTH-03 — Registration / Sign-in Orchestration (Implementation Report)

> **Title:** AUTH-03 — Registration / Sign-in Orchestration
> **Version:** 1.0 · **Status:** Implemented (TDD) — pending Founder-authorized review/merge · **Classification:** Working (implementation report)
> **Governing documents:** [`AUTH-BP`](../roadmap/AUTH-BP-authentication-blueprint-2026-08-08.md) §5/§6/§9/§10/§11/§12; [`AUTH-02` report](AUTH-02-token-verification-and-identity-resolution-2026-08-08.md); [`AUTH-CORR-001` report](AUTH-CORR-001-initial-authentication-reference-linking-2026-08-08.md); [`ENG-P2-ARCH-001`](../roadmap/ENG-P2-ARCH-001-customer-identity-architecture.md) §7; [`DEC-AUTH-001`](../../00-governance/decisions/decision-register.md)
> **Source-of-truth path:** `docs/05-implementation/reports/AUTH-03-registration-signin-orchestration-2026-08-08.md`
> **Last controlled update:** 2026-08-08 (`AUTH-03` — created)

**Authorization.** Founder-authorized — the **third** Authentication implementation package under `AUTH-BP`, authorized by the Founder in this task (the fresh, explicit implementation authorization the governing documents require before an `AUTH-*` package may begin; recorded per the AUTH-01/AUTH-02 convention in the changes-log Entry 095, this report, and Master Workflow §17). AUTH-01, AUTH-02, and AUTH-CORR-001 are prerequisites and are on `main` (AUTH-CORR-001 merged as `08aa1bc`, post-merge CI green); they are treated as established architecture, not redesigned.

## 1. Scope (AUTH-BP §5/§6/§12)
Backend **registration / sign-in orchestration**: turn a *verified* `AuthenticatedCredential` into an authenticated outcome by composing already-merged responsibilities — determine **new-vs-returning** through the `-09` resolution path (AUTH-02), create a new customer through the `-01` `createCustomerIdentity` responsibility, establish the initial authentication reference through the existing `-08` path delivered by AUTH-CORR-001, gate a returning-user sign-in on access state, and **issue the session** through the existing AUTH-01 `createSessionContext` responsibility — all idempotent on the shared idempotency/outbox architecture, exposed through one `functions/src/index.ts` callable.

**Not** in scope (per §12, deliberately untouched): frontend provider flows (**AUTH-04**), account linking (**AUTH-05**), recovery proof (**AUTH-06**), session/access management — expiry, protected-action gating, privileged re-auth, sign-out (**AUTH-07**), and the `CustomerAuthenticated` ITM/audit trust-signal emission (**AUTH-08**, see §3). No `-01`/`-08`/`-09`/AUTH-01/AUTH-02 change; no new error category; no capability renumbering.

## 2. Files changed
| File | Change |
|---|---|
| `functions/src/domains/authentication/services/registrationSignInService.ts` | **New.** `registerOrSignIn(db, credential, envelope, command, deps)` — the orchestration: resolve → sign-in (access-state gated) or register (`-01` create + `-08` establish); issues the `SessionContext`. |
| `functions/src/domains/authentication/services/registrationSignInService.test.ts` | **New.** Unit tests (injected doubles, no Firestore) — 6 tests. |
| `functions/src/domains/authentication/services/registrationSignInService.emulator.test.ts` | **New.** Real-Firestore-emulator tests — 5 tests. |
| `functions/src/domains/authentication/services/authenticationEndpointService.ts` | **New.** `handleAuthenticate(db, request, deps)` — verify (AUTH-02 `TokenVerifierPort`) then orchestrate; transport-safe, credential-free result. The testable composition the callable wraps. |
| `functions/src/domains/authentication/services/authenticationEndpointService.test.ts` | **New.** Unit tests — 2 tests. |
| `functions/src/index.ts` | **Modified.** Added the `authenticate` `onCall` (the sole AUTH-03 integration) wiring the production verifier + Firestore, plus a closed-taxonomy → Callable-code error map and request validation. |

## 3. Event-emission boundary — examined and resolved (AUTH-BP §12 governs)
AUTH-BP §5 step 4 / §6 step 3 describe the registration/sign-in *flow* as "emit `CustomerAuthenticated`", but the **package decomposition (§12)** assigns *"Authentication events → ITM/audit — emit fire-and-forget trust/audit signals via outbox"* to **AUTH-08**, and the completed AUTH-01 `authenticationEvents.ts` contract states *"Emission (writing through the shared outbox) is AUTH-08, not this module."* This apparent wording tension was examined and **resolved by following the explicit §12 responsibility allocation and the established AUTH-01 boundary** (Founder-directed for this package): the §5/§6/§10 wording describes the flow/event *outcome*, not a transfer of outbox-emission ownership from AUTH-08 to AUTH-03.

Accordingly, **AUTH-03 does not write `CustomerAuthenticated`.** It lets the domain operations it calls emit their own already-owned state-change events — `CustomerIdentityRegistered` (via `-01`) and `AuthenticationReferenceLinked` (via `-08`) — and issues the session; the fire-and-forget `CustomerAuthenticated` trust signal remains AUTH-08's responsibility. There is deliberately **no outbox/emit seam** on `registrationSignInService`. This is proven by an emulator test asserting the outbox contains `customer_identity_registered` and `authentication_reference_linked` but **not** `customer_authenticated`. No governing document (`AUTH-BP`, AUTH-01, AUTH-08) was modified.

## 4. Behaviour
**Registration (unregistered credential, AUTH-BP §5).** Resolve returns `unregistered` → generate a new internal Customer ID (CSPRNG `randomUUID`, injectable) → `createCustomerIdentity` (embeds the initial reference, emits `CustomerIdentityRegistered`, idempotent/transactional) → `linkAuthenticationReferenceForIdentity` (the AUTH-CORR-001 `-08` path: materialises the authoritative `authenticationReferences/{type}:{id}` document, emits `AuthenticationReferenceLinked`; cross-identity conflict → fail-closed `VALIDATION_FAILED`, never auto-merges) → issue session. The credential is thereafter resolvable via `-09`/AUTH-02.

**Sign-in (resolved credential, AUTH-BP §6).** Resolve returns `resolved` → read the identity and gate on access state: `active` proceeds; `suspended` → `ACCOUNT_SUSPENDED`; any other non-active state (`locked`/`closed`/`archived`/`dormant`/`registered`) → `AUTH_FORBIDDEN` (fail closed, no session). No identity mutation.

**Session (AUTH-BP §9).** A `SessionContext` (`{ customerIdentityId, authReference, issuedAt }`) is built through the existing AUTH-01 `createSessionContext` — no bespoke token store; Firebase remains the token authority. Full session *management* (expiry/gating/sign-out) stays AUTH-07.

**Endpoint (`authenticate` callable, AUTH-BP §3/§12).** Validates the request, verifies the raw provider credential through the AUTH-02 Firebase-Admin `TokenVerifierPort` (`checkRevoked`; provider provenance bound to the *verified* token), runs the orchestration, and returns `{ mode, customerIdentityId, session }` — never any credential material. Domain errors map onto Callable transport codes without echoing messages (enumeration resistance). Client App Check enforcement and the frontend flows are AUTH-04; verification here already fails closed on an absent/invalid/unsupported credential.

## 5. Correctness fix surfaced by TDD — distinct event ids
The shared outbox is keyed by `eventId` (`outboxEntries/{eventId}`). The registration path emits two events (`-01` create, `-08` link); an early implementation threaded the single request `eventId` into both, so the link event **overwrote** `CustomerIdentityRegistered` (and the `-09` audit event). The emulator test caught this. Fixed by deriving **distinct, deterministic** event ids (`${eventId}:identity.create`, `${eventId}:identity.link`) — replay-safe (a retry reuses the same outbox document ids) while sharing one `correlationId`. Locked in by a unit assertion and the outbox emulator assertion.

## 6. Idempotency / uniqueness / concurrency
- **Idempotency preserved.** The one client `idempotencyKey` derives two distinct operation keys (`:identity.create`, `:identity.link`) so the two idempotent identity operations never collide on the shared `idempotencyRecords/{key}` document. A completed registration makes the credential resolvable, so a genuine retry resolves → sign-in (single identity, single authoritative record — emulator-verified). No new idempotency framework.
- **Global uniqueness preserved.** Reference establishment goes through `-08`, whose authoritative-doc guard fails closed on any cross-identity claim; AUTH-03 opens no new write path.
- **Concurrency.** Serialization is the merged `-08` transaction's; AUTH-03 adds none of its own.

## 7. Security / privacy (TRD10 §10.6.1)
No raw token/OTP/credential material is read, written, logged, or returned — only the provider-neutral reference flows through; the verifier consumes and discards the raw token. Emulator test asserts no `token`/`secret`/`password`/`rawtoken` material persists on `users`/`authenticationReferences`/`outboxEntries`. Closed 14-category taxonomy reused — **no new error category**. Enumeration resistance retained at the resolution boundary and the transport error map. Deny-by-default Rules unaffected (all writes are server-side Admin; no new client write path).

## 8. Tests added
- **Unit (8):** `registrationSignInService.test.ts` (6) — sign-in of an active identity + session; `ACCOUNT_SUSPENDED`/`AUTH_FORBIDDEN` gating (suspended/locked/closed); registration composes `-01`+`-08` with distinct idempotency keys **and** distinct event ids; cross-identity `-08` conflict propagates. `authenticationEndpointService.test.ts` (2) — verify-then-orchestrate with a credential-free ISO result; fail-closed on verification failure (orchestration never runs).
- **Emulator (5):** `registrationSignInService.emulator.test.ts` — register→resolvable (`-01→-08→-09`) + session; returning credential signs in with no second identity; idempotent repeat (single identity/authoritative record); **emits `customer_identity_registered` + `authentication_reference_linked` but not `customer_authenticated`**; no raw credential persisted.

## 9. Complete validation results
- `pnpm typecheck` clean (functions + apps/web); `pnpm lint` (`eslint .`) clean; `pnpm format:check` clean; `pnpm build` clean (functions + web).
- **Functions unit suite: 485/485** (was 477; +8 AUTH-03).
- **Emulator (`pnpm emulators:validate`): 187/187** across 16 files (includes the 5 new AUTH-03 emulator tests). The pre-existing `ENG-P1-002-CR1` outbox concurrent-worker timing flake did not trigger this run.
- **Web unit suite: 258/259.** The single failure — `apps/web/src/dev/phoneAuthHarness/PhoneAuthHarnessPage.test.tsx` *"records fresh request timing on retry"* (`expected 228 to be less than 80`) — is a **pre-existing, environment-sensitive delivery-latency timing flake** in the phone-auth harness (the `ENG-P1-002-CR1`/`EXT-TECH-001` area), **unrelated to AUTH-03**: AUTH-03 changed no `apps/` file (verified `git diff --name-only origin/main -- apps/` = empty), and the file passes **39/39 in isolation**. Per the task constraints it was left untouched (no opportunistic flake fix).

## 10. Commands executed
`git worktree add -b feat/auth-03-registration-signin-orchestration <path> origin/main`; `pnpm install --frozen-lockfile`; TDD loop (unit RED → implement → GREEN; emulator RED via the eventId-collision failure → fix → GREEN); `pnpm typecheck`/`pnpm lint`/`prettier --write`+`format:check`/`pnpm test`/`pnpm build`/`pnpm emulators:validate`; secret scan; `git add`/commit/push.

## 11. Dependencies added / configuration changes
**None.** (`firebase-admin`/`firebase-functions` already present.) No config, no migration, no new Firestore index, no Rules change.

## 12. Invariants preserved
Global authentication-reference uniqueness; existing idempotency and outbox contracts; the closed 14-category taxonomy; Authentication → Identity/shared dependency direction (reverse never occurs); no `-01`/`-08`/`-09`/AUTH-01/AUTH-02 modification; no raw credential persistence; Standard-Participation (registration → `active`, no verification gate beyond holding an identity — `DEC-IDENTITY-001`).

## 13. Programme / traceability updates
Changes-log Entry 095 ([`documentation-changes-log.md`](../../00-governance/documentation-changes-log.md)); [`IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md); [Master Workflow §17](../11thonus-master-workflow.md) (next = `AUTH-04`); [`CDR-001` §5](../roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity) (AUTH-03 implemented-pending-merge note). No historical implementation report rewritten; no competing source of truth introduced.

## 14. Risks
Low–moderate. Additive service composing already-tested, merged interfaces; no modification to completed responsibilities. The one behaviour of note — a new backend `authenticate` callable — opens a function endpoint, not a client Firestore write path (deny-by-default Rules unaffected); it fails closed on verification and enforces the closed provider set. End-to-end real-token mint against a live client is exercised by AUTH-04.

## 15. Rollback instructions
`git revert` the AUTH-03 commit, or discard the branch pre-merge. No data/migration impact (no production caller exists until AUTH-04 wires the frontend). Reverting restores `index.ts` to its `ping`-only state and removes the two services + tests.

## 16. Outstanding observations
- `CustomerAuthenticated` trust-signal emission and the ITM/audit fan-out remain **AUTH-08** (by decision, §3).
- Session **management** (expiry/gating/sign-out/privileged re-auth) remains **AUTH-07**; AUTH-03 issues the `SessionContext` value only.
- The pre-existing phone-auth-harness latency flake (§9) is unrelated and left untouched.

## Final Gate
- **New credential registers (`-01` create + `-08` establish) and becomes resolvable via `-09`/AUTH-02.** ✅
- **Returning credential signs in, access-state gated; no identity mutation.** ✅
- **Session issued through the existing AUTH-01 responsibility.** ✅
- **State-change events emitted by `-01`/`-08`; `CustomerAuthenticated` deferred to AUTH-08.** ✅
- **Idempotency, global uniqueness, and the 14-category taxonomy preserved; no credential material persisted.** ✅
- **No `-01`/`-08`/`-09`/AUTH-01/AUTH-02/blueprint change; AUTH-04+ not started.** ✅
- **AUTH-03 is implemented, validated, and pending Founder-authorized review/merge — not self-merged.** ✅
