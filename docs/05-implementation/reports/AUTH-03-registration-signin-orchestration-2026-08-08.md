# AUTH-03 — Registration / Sign-in Orchestration (Implementation Report)

> **Title:** AUTH-03 — Registration / Sign-in Orchestration
> **Version:** 1.1 · **Status:** Implemented (TDD), **corrected after post-implementation review** — pending fresh Founder-authorized review/merge · **Classification:** Working (implementation report)
> **Governing documents:** [`AUTH-BP`](../roadmap/AUTH-BP-authentication-blueprint-2026-08-08.md) §5/§6/§9/§10/§11/§12; [`AUTH-02` report](AUTH-02-token-verification-and-identity-resolution-2026-08-08.md); [`AUTH-CORR-001` report](AUTH-CORR-001-initial-authentication-reference-linking-2026-08-08.md); [`ENG-P2-ARCH-001`](../roadmap/ENG-P2-ARCH-001-customer-identity-architecture.md) §7; [`DEC-AUTH-001`](../../00-governance/decisions/decision-register.md)
> **Source-of-truth path:** `docs/05-implementation/reports/AUTH-03-registration-signin-orchestration-2026-08-08.md`
> **Last controlled update:** 2026-08-09 (`AUTH-03` v1.1 — four post-implementation review findings corrected; see §20). Previously: 2026-08-08 (`AUTH-03` v1.0 — created).

> **Post-implementation correction notice (v1.1, 2026-08-09).** After v1.0 was reported complete, an automated PR review (Codex, on the reviewed head `9c18cea`) surfaced **four valid defects** in the registration idempotency/atomicity path (2 P1, 2 P2). The Founder held the merge and authorized an in-place AUTH-03 correction. They are now fixed and proven RED→GREEN (see **§20**). This report is preserved as a record of both the initial implementation and the correction — v1.0's §6 idempotency claim was **not** in fact satisfied by the initial code; it is corrected here, not retroactively rewritten.

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

> **Corrected in v1.1 (2026-08-09).** v1.0 (below) claimed these properties held; post-implementation review proved they did **not** for concurrent, partial-failure, and same-key-replay cases (§20). The corrected design is in **§20**; this section is retained, marked, for the audit trail.

- **[v1.0 — insufficient; superseded by §20]** The one client `idempotencyKey` derived two distinct operation keys (`:identity.create`, `:identity.link`). This left registration non-durable across concurrency and partial failure, and a same-key retry of a completed registration returned a *different* (`signed_in`) result — the four review findings.
- **[v1.1 — corrected]** A request-level idempotency gate keyed by the **client key** (credential-bound `requestHash`) makes a same-key retry replay the original outcome; the `-01`/`-08` operations are keyed by the **credential** so concurrent registrations serialise (loser fails closed, no orphan) and a partial-failure retry recovers the same identity id from the durable create record. Uses only the shared idempotency facility. See **§20**.
- **Global uniqueness preserved.** Reference establishment goes through `-08`, whose authoritative-doc guard fails closed on any cross-identity claim; AUTH-03 opens no new write path (unchanged, v1.0→v1.1).
- **Concurrency.** In v1.1, concurrent same-credential registrations serialise on the credential-keyed `-01`/`-08` reservations (emulator-proven), in addition to the merged `-08` transaction guard.

## 7. Security / privacy (TRD10 §10.6.1)
No raw token/OTP/credential material is read, written, logged, or returned — only the provider-neutral reference flows through; the verifier consumes and discards the raw token. Emulator test asserts no `token`/`secret`/`password`/`rawtoken` material persists on `users`/`authenticationReferences`/`outboxEntries`. Closed 14-category taxonomy reused — **no new error category**. Enumeration resistance retained at the resolution boundary and the transport error map. Deny-by-default Rules unaffected (all writes are server-side Admin; no new client write path).

## 8. Tests added (v1.1)
- **Unit (14):** `registrationSignInService.test.ts` (12) — sign-in of an active identity + session; `ACCOUNT_SUSPENDED`/`AUTH_FORBIDDEN` gating (suspended/locked/closed); credential-keyed registration composing `-01`+`-08` (distinct create/link keys and event ids); **id recovery** from the durable create record on resume; cross-identity `-08` conflict propagates; request-gate **duplicate replay** returns the original `registered`; `in_progress`/`conflict` → `IDEMPOTENCY_CONFLICT`; `assertSafeIdempotencyKey` accepts a UUID and rejects path/empty/dot/over-long/space keys. `authenticationEndpointService.test.ts` (2) — verify-then-orchestrate credential-free result; fail-closed on verification failure.
- **Emulator (8):** `registrationSignInService.emulator.test.ts` — register→resolvable (`-01→-08→-09`); returning sign-in (no second identity); **P2-3** same-key completed-registration replay returns `registered`; **P1-2** create-then-link-failed same-key retry resumes on one identity; **P1-1** two concurrent same-credential/different-key registrations leave one identity, no orphan; **P2-4** path-bearing key fails closed with no writes; emits `customer_identity_registered` + `authentication_reference_linked` but **not** `customer_authenticated`; no raw credential persisted.

## 9. Complete validation results (v1.1, 2026-08-09)
- `pnpm typecheck` clean (functions + apps/web); `pnpm lint` (`eslint .`) clean; `pnpm format:check` clean; `pnpm build` clean (functions + web).
- **Functions unit suite: 491/491** (was 485 at v1.0; +6 net for the correction's added unit cases).
- **Emulator (`pnpm emulators:validate`): 190/190** across 16 files (includes the 8 AUTH-03 emulator tests — the 5 original plus 3 finding tests; the `ENG-P1-002-CR1` timing flake did not trigger this run).
- **Web unit suite: 259/259** this run (the pre-existing `ENG-P1-002-CR1`/`EXT-TECH-001` phone-auth-harness delivery-latency timing flake — `PhoneAuthHarnessPage.test.tsx` "records fresh request timing on retry" — did not trigger; it remains **unrelated to AUTH-03**: no `apps/` file changed, passes 39/39 in isolation, and was left untouched per task constraints).
- **RED→GREEN evidence:** the four new emulator finding-tests (P1-1, P1-2, P2-3, P2-4) were run against the pre-fix service (`9c18cea`) and **all four failed** (the other four passed), then passed after the fix — see §20.

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

---

## 20. Post-implementation correction (v1.1, 2026-08-09)

After v1.0 was reported complete, the repository's automated PR reviewer (Codex) posted **four inline findings** on the reviewed head `9c18cea`. All four were verified valid against the code; the Founder held the PR-#90 merge and authorized an **in-place AUTH-03 correction** (kept on this branch/PR; head moves off `9c18cea`). No `-01`/`-08`/`-09`, shared-idempotency, AUTH-01, or AUTH-02 code was changed; only the shared idempotency facility was used (no new subsystem).

### 20.1 The four findings (root cause)
All four flow from one root cause: v1.0 registration was a non-durable multi-step composition — a fresh random id per call, sub-operation idempotency keyed off the *client* key, and no request-level replay.

| # | Sev | Finding | Root cause |
|---|-----|---------|-----------|
| P1-1 | P1 | Concurrent same-credential (different keys) registration leaves an orphan `active` identity | `-01` create ran before the reference was claimed; client-keyed sub-keys did not dedup across different client keys, so two identities were created and only one `-08` link won. |
| P1-2 | P1 | Registration not resumable after create succeeds / link fails | The id was regenerated on retry; the completed `:create` key then reloaded a never-persisted id → `RESOURCE_NOT_FOUND`. |
| P2-3 | P2 | Same-key retry of a completed registration returns `signed_in`, not the original `registered` | No request-level replay; `-09` now resolves, so the retry fell through to sign-in. |
| P2-4 | P2 | A path-bearing idempotency key (`a/b`) reaches Firestore `.doc(...)` → internal error | The client key was used directly as a document-id component with no boundary validation. |

### 20.2 The correction (exact, per finding)
- **P1-1 + P1-2 — per-credential registration.** The `-01`/`-08` operations are now keyed by the **credential** (`authentication.register:{type}:{refId}:identity.{create|link}`). Two concurrent registrations for the same reference serialise on the same reservation — the loser observes `in_progress` and `createCustomerIdentity` throws `IDEMPOTENCY_CONFLICT` **before** any `users` write (no orphan). On a resume, the identity id is **recovered** from the durable create record (peek `checkIdempotency` → `resultReference`) instead of regenerated, so the retry completes on the same identity.
- **P2-3 — request-level replay.** The whole command is wrapped in a `checkAndReserveIdempotencyKey` gate keyed by the **client key** (`authentication.authenticate:{clientKey}`), with `requestHash` bound to the credential. A `duplicate` replays the stored `responseSnapshot` (`{mode, issuedAt}`) + `resultReference` — the original `registered` outcome — never a fresh `signed_in`; a same-key/different-credential reuse is a fail-closed `conflict`; a concurrent same-key attempt is `in_progress`. This is the shared facility's existing replay contract, not a new definition.
- **P2-4 — safe-key validation.** `assertSafeIdempotencyKey` rejects any key that is not a single safe Firestore path segment (non-empty, ≤200 chars, no `/`, no `.`/`..`, `^[A-Za-z0-9._:-]+$`) with the existing `VALIDATION_FAILED` taxonomy (→ Callable `invalid-argument`) **before** any Firestore access.

### 20.3 RED → GREEN evidence
The four new emulator finding-tests were run against the **pre-fix** service (`9c18cea`) and the **fixed** service:

| Test | Pre-fix (`9c18cea`) | Fixed |
|---|---|---|
| P1-1 concurrent — one identity, no orphan | ❌ FAIL (2 identities) | ✅ PASS |
| P1-2 create/link-fail/retry resume | ❌ FAIL (`RESOURCE_NOT_FOUND`) | ✅ PASS |
| P2-3 same-key completed replay = `registered` | ❌ FAIL (returned `signed_in`) | ✅ PASS |
| P2-4 path-bearing key fails closed | ❌ FAIL (Firestore error, not taxonomy) | ✅ PASS |
| (other 4 emulator tests) | ✅ PASS | ✅ PASS |

Full v1.1 validation in §9. Files changed by the correction: `registrationSignInService.ts` (+ its `.test.ts` and `.emulator.test.ts`); `authenticationEndpointService.ts` and `index.ts` unchanged by the correction (the endpoint already binds `requestHash` to the credential and the callable already maps `VALIDATION_FAILED` → `invalid-argument`).

### 20.4 Correction final gate
- **P1-1 no orphan on concurrency** ✅ · **P1-2 resumable on one identity** ✅ · **P2-3 same-key replay reproduces `registered`** ✅ · **P2-4 path-bearing key fails closed with no writes** ✅
- Global authentication-reference uniqueness, fail-closed behaviour, and the 14-category taxonomy preserved; no raw credential persisted; `CustomerAuthenticated` still not emitted (AUTH-08); no completed-capability boundary changed. ✅
- AUTH-03 (corrected) is pending **fresh** Founder review/merge — **not self-merged**; AUTH-04+ not started. ✅
