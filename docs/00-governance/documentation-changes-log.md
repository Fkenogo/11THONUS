> **Title:** 11thONUS Documentation Changes Log  
> **Version:** running · **Status:** Controlled running log · **Classification:** Working (governance record)  
> **Governing document:** 11thONUS Platform Constitution  
> **Source-of-truth path:** `docs/00-governance/documentation-changes-log.md`  
> **Last controlled update:** 2026-08-16 (Entry 120 added: `CAP-P2-ITM-C` — Effective Trust Derivation & MVP Progression: fresh Founder implementation authorization scoped to `ITM-C` only (does not authorize `ITM-D`/risk-gate integration, Reward Engine policy, trust regression, evidence expiry, operator visibility, new trust signals, Capability 3, G2, or `AUTH-10`). Implemented a pure band-derivation function (`unverified`/`provisional`/`established` per `ITM-DESIGN-001` §6.6, `accountAgeDays = floor((now−registeredAt)/86400s)` per §6.6.4) and a read-only Firestore orchestrator that recomputes from `signalState.hasSuccessfulAuthentication` + Customer Identity's `createdAt` + current server time, never trusting or writing the persisted `trustLevel` cache (§6.6.1/§15 assign cache refresh to `ITM-B`'s own write path only). Recovery evidence structurally neutral (`AD-ITM-2`); no downward-transition path exists (`AD-ITM-3`). No `ITM-A`/`B` contract modified. 39 unit + 2 boundary + 7 real-Firestore-emulator tests, genuine RED→GREEN, full 30-scenario matrix covered. functions **917/917**, `domains/trust` emulator suite isolated **31/31**, web **397/397**, typecheck/lint/format/build clean, PR #115 CI **pass**. Pending Founder review/merge; not self-merged; `ITM-D` not begun; Capability 2 `Open — partially implemented; not closed`; see Entry 120 below). Previously: 2026-08-16 (Entry 119 added: `CAP-P2-ITM-A` — Independent Final Contract Review, Merge & Closure: PR #111 confirmed `OPEN` at expected head `fabfed6` with no later commits, CI green, mergeable; independent review re-read `ITM-DESIGN-001` directly and verified (not merely re-asserted) that `ITM-A` owns contracts only — via direct module-export inspection (`trustRecord.ts` exports exactly `createTrustRecord`, no mutation/transition function; `trustLevel.ts` exports only the closed set plus ordering helpers, no derivation function) and repository-wide greps for prohibited terms (numeric score, account-age/30-day logic, purchase/merchant/device/fraud signals, weighting, regression/expiry/operator-visibility) — all clean. Full diff confirmed scoped to `functions/src/domains/trust/models/**`, the additive `eslint.config.js` boundary block, and documentation only. Full validation re-run on the exact PR head: functions **872/872**, `emulators:validate` **288/288**, web **397/397**, typecheck/lint/format/build clean, no secret/credential material found. Codex automated review unavailable (disclosed); this independent review served as the final review gate per this task's authorization. No material finding — PR #111 merged as `eea87269f9312eb9dfddba199de7e31fab75579d`; post-merge CI on `main` confirmed green; `ITM-A` confirmed authoritative on `main`. `ITM-A` = Complete/merged. `ITM-B`/`ITM-C`/`ITM-D` remain Not started — not begun by this task. Capability 2 remains `Open — partially implemented; not closed`; see Entry 119 below). Previously: 2026-08-16 (Entry 118 added: `CAP-P2-ITM-A` — Trust Domain Contracts & Trust Record Model implemented, TDD, pending Founder review/merge: the first ITM implementation package under `ITM-DESIGN-001` §15's decomposition, scoped to pure domain contracts only (`functions/src/domains/trust/models/`) — the closed `TrustLevel` band enum with ordering, the `TrustRecord`/`VerificationState`/`SignalState`/`TrustRecordStatus` value objects, the closed evidence contract (`TrustEvidenceCategory`/`TrustReasonReference`, recovery-proof evidence structurally carrying no trust-movement field per `AD-ITM-2`), and a minimal `TrustRuleVersion` contract; no persistence, no event consumer, no progression/derivation logic, no risk-gate contract (`ITM-B`/`-C`/`-D`'s separate, still-unauthorized responsibility). 74 new focused unit tests, genuine RED-before-GREEN for 9 of 10 test files; one boundary-verification file written post-implementation (disclosed). Firebase-independence machine-enforced via a new `eslint.config.js` block. functions **872/872**, web **397/397** unchanged, typecheck/lint/format/build clean; see Entry 118 below). Previously: 2026-08-16 (Entry 117 added: `CAP-P2-ITM-DESIGN-001` — final independent review, merge & closure: full re-read of `ITM-DESIGN-001` against all governing sources; one new self-referential stale cross-reference found in §17 and fixed, plus a stale `CDR-001` §2 snapshot line corrected to match the authoritative §5; no material contradiction found; PR #110 proceeds to merge; see Entry 117 below). Previously: 2026-08-16 (Entry 116 added: `CAP-P2-ITM-DESIGN-001` — FDR-1 Founder countersignature: the Founder countersigns the `ITM-DESIGN-001` §6.6 trust-band model with an MVP policy clarification (30-day threshold is a policy boundary, not statistically validated; `established` means only "established under the current MVP evidence model"); `FDR-2`/`FDR-3`/`FDR-4` (already resolved) plus `FDR-1` (now resolved) leave **zero open Founder decisions** in the ITM design; independent final consistency review performed, one stale cross-reference found and fixed; see Entry 116 below). Previously: 2026-08-16 (Entry 115 added: `CAP-P2-ITM-DESIGN-001` — `ENG-P2-004D`/PR #109 merge-sync recorded (merged `2d7573b`, post-merge CI green; `ENG-P2-004` now `Complete`); the bounded [`ITM-DESIGN-001`](../05-implementation/roadmap/ITM-DESIGN-001-identity-trust-management-architecture.md) design package delivered per Founder Decision FD-2, no ITM code implemented; G2 sequencing wording corrected (G2 is a closure gate, not gated by prior capability closure); see Entry 115 below). Previously: 2026-08-16 (Entry 114 added: `ENG-P2-004C`/PR #108 merge recorded — merged `ae77348`, post-merge CI green, corrects a gap where no merge-sync entry was ever created for `004C`; `ENG-P2-004D` — Authorization Boundary Integration, Security Validation & `ENG-P2-004` Closure — implemented, pending PR/review/merge, see Entry 114 below). Previously: 2026-08-15 (Entry 113 added: `ENG-P2-004B`/PR #107 merge + programme-currency sync recorded — merged `046f22d`, post-merge CI green, seven Codex review passes completed with fixes; `ENG-P2-004C` freshly authorized and begun, see Entry 113 below). Previously: 2026-08-15 (Entry 112 added: `ENG-P2-004B` — Permission Evaluation, application code TDD, see Entry 112 below). Previously: 2026-08-14 (Entry 111 added: `ENG-P2-004A` — Permission Contracts & Sensitive Permission Catalogue, application code TDD, see Entry 111 below). Previously: 2026-08-14 (Entry 110 added: `ENG-P2-004-DESIGN-001` v1.1 — Founder Dispositions Recorded, AD-1–AD-5, see Entry 110 below). Previously: 2026-08-14 (Entry 109 added: `ENG-P2-004-DESIGN-001` — Role-Context & Permission-Resolution Architecture, design/architecture package only, no implementation — see Entry 109 below). Previously: 2026-08-10 (Entry 102 added: `AUTH-08` — Authentication Events → ITM/Audit (application code, TDD) + `AUTH-07` merge/closure programme-currency sync: the **eighth** Authentication package under `AUTH-BP` §10/§12 (Founder-authorized) — *emit* the two fire-and-forget authentication trust/audit signals (`CustomerAuthenticated` on successful registration/sign-in; `AuthenticationRecoveryProofProvided` on successful recovery proof) via the shared outbox. **Scope clarification (Founder-directed):** the shared "-08" numbering had caused ambiguity — authentication-**reference linking**/global-ownership is the **already-merged Customer Identity `-08`** (`ENG-P2-001-08`), NOT re-implemented or modified here; `AUTH-BP` prose "`-08`" means that merged package. Event contracts pre-existed (AUTH-01); emission only, no new event type/error category. Wired at the `index.ts` composition boundary after the completed AUTH-03/06 handlers (their "no emit seam" internals untouched); durable **awaited** outbox write with **deterministic retry-stable** `eventId` from the request idempotency key (durable at-least-once + dedup-by-`eventId`, not exactly-once); idempotent read-guarded enqueue (no duplicate/reset); payloads carry only `customerIdentityId` + categorical `referenceType` (+ `proofMethodCategory`), no credential material; additive `-10` audit allow-list extension (categorical-only, `class_2`, unknown types still fail closed); `→ ITM` discharged by durable outbox emission (no live ITM consumer wired yet). No AUTH-03/06/07 service-internal change, no Customer Identity `-08` change, no shared idempotency/`firestore.rules`/`apps/web` change. functions **563/563**, web **304/304**, `emulators:validate` **221/221** (+5). Also **programme-currency sync**: AUTH-07/PR #96 recorded **merged** (`28f7625…`, post-merge CI green run 31385400543) in Master Workflow §17 and CDR-001 §5, superseding stale "pending review/merge; AUTH-08 not started" wording (history preserved). Pending Founder review/merge; not self-merged; AUTH-09 not started; dirty primary worktree untouched; Capability 2 `Open — partially implemented; not closed`. See the [`AUTH-08` report](../05-implementation/reports/AUTH-08-authentication-events-itm-audit-2026-08-10.md)). Previously: 2026-08-10 (Entry 101 added: `AUTH-07` — Session / Access Gating (application code, TDD) + additive AUTH-01/AUTH-02 `authenticatedAt` extension + `AUTH-06` merge/closure programme-currency sync: the **seventh** Authentication package under `AUTH-BP` (Founder-authorized) — the authentication session/access-gating layer: session establishment (via AUTH-01 `createSessionContext`; Firebase stays the token authority), the identity-protected-action gate (resolve via AUTH-02/`-09` → access-state gate; browsing never gated), **server-enforced privileged re-authentication** freshness on the trusted `authenticatedAt` (default **5 minutes**, configurable per TRD12 §12.29; `verifiedAt` never substituted), and sign-out (client-session clear). Backend `models/privilegedReauthentication.ts` + `services/sessionAccessService.ts`; frontend `signOutFlow.ts` + `privilegedReauthenticationFlow.ts`. **Additive AUTH-01/AUTH-02 extension** (Founder AD-1): optional `authenticatedAt?: Date` on `AuthenticatedCredential`, derived server-side from the verified `auth_time` claim, fail-closed when absent/malformed — non-breaking; `verifiedAt`/resolution/keying unchanged. Emits no domain events (`CustomerAuthenticated`/`AuthenticationRecoveryProofProvided` stay AUTH-08); closed 14-category taxonomy; no `-08`/`-09`/shared/`firestore.rules`/`index.ts` change; no client write path. functions **547/547**, web **304/304**, `emulators:validate` **216/216** (+4). Also **programme-currency sync**: AUTH-06/PR #95 recorded **merged** (`04e1171…`, post-merge CI green) in Master Workflow §17 and CDR-001 §5, superseding stale "pending review/merge" wording (history preserved). Pending Founder review/merge; not self-merged; AUTH-08+ not started; dirty primary worktree untouched; Capability 2 `Open — partially implemented; not closed`. See the [`AUTH-07` report](../05-implementation/reports/AUTH-07-session-access-gating-2026-08-10.md)). Previously: 2026-08-10 (Entry 100 added: `AUTH-06` — Recovery Credential Proof (application code, TDD) + `AUTH-05` merge/closure programme-currency sync: the **sixth** Authentication package under `AUTH-BP` (Founder-authorized) — the authentication-layer recovery credential proof. Verifies a recovery provider credential (AUTH-02 `TokenVerifierPort`), **resolves it to its OWNING identity** via the AUTH-02 `-09` resolver (recovery target **derived from the proof**, never client-supplied; a foreign/unlinked credential fails closed `RESOURCE_NOT_FOUND`), constructs an `accepted` `RecoveryProof` (`phone_otp`→`phone_otp`, `google_sign_in`→`linked_provider`; opaque CSPRNG `proofReference`; `customer_initiated`), and hands it to the merged `-07` `recoverCustomerIdentityByReference` (transitions status via `-06`, rejects proof reuse, emits `IdentityRecovered`). Backend-only under `functions/src/domains/authentication/services/*` + one additive `recoverAuthenticatedIdentity` `onCall`. **No active-state gate** (recovery is *for* non-active identities; `-06` owns eligibility); **emits no domain events** (`AuthenticationRecoveryProofProvided` and `CustomerAuthenticated` stay AUTH-08); idempotency consumed from `-07`; no credential persisted; closed 14-category taxonomy; no `-06`/`-07`/`-08`/`-09`/AUTH-01–AUTH-05 change; out-of-band lookup surface and post-recovery relink out of scope. TDD: functions **522/522** (+9), web **300/300**, `emulators:validate` **211/211** (+6). Also **programme-currency sync**: AUTH-05/PR #92 recorded **merged** (`6c18ca6…`, post-merge CI green) in Master Workflow §17 and CDR-001 §5, superseding stale "pending review/merge" wording (history preserved). Pending Founder review/merge; not self-merged; AUTH-07+ not started; dirty primary worktree untouched; Capability 2 `Open — partially implemented; not closed`. See the [`AUTH-06` report](../05-implementation/reports/AUTH-06-recovery-credential-proof-2026-08-10.md)). Previously: 2026-08-09 (Entry 099 added: `AUTH-05` — Account Linking **resumed after AUTH-CORR-002** (application code, TDD): with the Founder Model-T tuple correction merged (Entry 098), AUTH-05 is reconstructed on current `main` (`386fd8a`). **F2** (cross-account merge) — its **keying** half is resolved by AUTH-CORR-002 (AUTH-05 was already tuple-aware); on the resumption review-gate the Founder additionally **directed a defensive same-Firebase-principal gate** — before `-08`, AUTH-05 verifies the new provider's verified uid equals the acting uid, failing closed (`AUTH_FORBIDDEN`, existing category) — defense-in-depth alongside (never replacing) `-08`'s cross-identity control. **F1** (acting-identity access-state enforcement) is **corrected** via TDD, reusing AUTH-03's `assertMaySignIn` gate and the existing closed taxonomy (`active`→proceed; `suspended`→`ACCOUNT_SUSPENDED`; else `AUTH_FORBIDDEN`) before any link/unlink; a `getIdentityById` seam added to `AccountLinkingDeps`. Same-UID phone+Google now link as two **distinct** references both resolving via `-09` to one identity, and the same-UID second provider unlinks **without** tripping last-reference (the exact §16 scenario, now coherent). No new error category; no credential persisted; `CustomerAuthenticated` stays AUTH-08; no AUTH-02/`-08`/`-09`/AUTH-03/AUTH-04 change. functions **511/511**, web **300/300**, AUTH-05 emulator file **10/10**, `emulators:validate` full suite 201 pass / 2 inherited timeout flakes (`ENG-P1-002-CR1` + a cross-package race — both pass in isolation); typecheck/lint/format/build clean. PR #92 reconstructed on `main`; **not** self-merged; AUTH-06+ **not** started; dirty primary worktree untouched; Capability 2 `Open — partially implemented; not closed`. See the [`AUTH-05` report §17](../05-implementation/reports/AUTH-05-account-linking-2026-08-09.md)). Previously: 2026-08-09 (Entry 098 added: `AUTH-CORR-002` — Provider-Qualified Authentication-Reference Keying (Model T): Founder decision that an authentication reference's canonical identity is the provider-qualified tuple `(referenceType, referenceId)` — bare Firebase UID is not by itself the reference identity; `referenceId` remains the verified authUid. Aligns the embedded projection in `customerIdentity.ts` (dedupe/unlink/last-reference now key the full tuple) and the `-08` `alreadyEmbedded` check; adds an additive `referenceType` to the unlinked event; amends `AUTH-BP` §3 (original wording preserved). No AUTH-02/`-09`/AUTH-03/AUTH-04 change; no migration; no external provider subject/HMAC/pepper/secret. Same verified UID under phone + Google is now two distinct references; unlink of one preserves the other; last-reference protection and global uniqueness intact. functions 496/496 (+5), emulator 17 files/194 green, web 300/300, e2e 1/1; typecheck/lint/format/build clean. AUTH-05 remains BLOCKED until this correction is merged; AUTH-06+ not authorized. See the [`AUTH-CORR-002` report](../05-implementation/reports/AUTH-CORR-002-authentication-reference-keying-2026-08-09.md). Previously: 2026-08-09 (Entry 097 added: `AUTH-04` — Frontend Sign-in Flows (Phone OTP + Google) implemented (application code, TDD): the **fourth** Authentication implementation package under `AUTH-BP` (Founder-authorized) — frontend-only provider sign-in flows under `apps/web/src/authentication/*` plus one additive composition-root callable accessor `apps/web/src/infrastructure/firebase/functions.ts`; a closed, **disabled-by-default** provider registry; Phone OTP (reCAPTCHA/App-Check) + Google popup flows building on the merged `infrastructure/firebase/*` and the `phoneAuthHarness` reference; a backend-safe idempotency key **reused across transient retries** (consumes, never weakens, the corrected AUTH-03 request-level replay guarantee); a `SignInPanel` tested with a network-safety harness (no live transport). Consumes the AUTH-03 `authenticate` callable; emits no domain events (`CustomerAuthenticated` stays AUTH-08); no session-management (AUTH-07)/linking (AUTH-05)/recovery (AUTH-06); **no `functions/` change** (that tree is byte-identical to `origin/main`); no real DSN/keys committed. **Corrected after automated PR review (PR #91)**: two valid findings fixed in place (TDD) — P1 (editing the phone number now invalidates a pending confirmation, wrong-identity guard) and P2 (`deadline-exceeded` is now retryable with the same key, consuming the AUTH-03 replay guarantee). web **300/300** (+41), functions **491/491** unchanged, `emulators:validate` 189/190 (the inherited `ENG-P1-002-CR1` concurrency flake, not AUTH-04; CI green on re-run); typecheck/lint/format/build clean. Also **programme-currency sync (Phase A2)**: `AUTH-03`/PR #90 recorded **merged** (`98896492…`, corrected head `f805edb`, post-merge CI green) in Master Workflow §17 and CDR-001 §5, superseding stale "not yet merged" wording (history preserved). Pending Founder review/merge; not self-merged; next = `AUTH-05`; Capability 2 `Open — partially implemented; not closed`). Previously: 2026-08-09 (Entry 096 added: `AUTH-03` (v1.1) — Registration/Sign-in Idempotency & Atomicity Correction (post-review, TDD): four valid defects (2 P1, 2 P2) raised by the automated PR reviewer on head `9c18cea` — concurrent-registration orphan, non-resumable registration, same-key retry returning `signed_in` not `registered`, and a path-bearing idempotency key — corrected in place on PR #90 using only the shared idempotency facility (credential-keyed `-01`/`-08` registration with durable id recovery; a client-key request-replay gate; safe-key validation); no `-01`/`-08`/`-09`/idempotency/AUTH-01/AUTH-02 change. RED→GREEN on the emulator; functions 491/491, `emulators:validate` 190/190, web 259/259. PR #90 head moves off `9c18cea` → pending fresh Founder review/merge; not self-merged; AUTH-04 not started; Capability 2 `Open — partially implemented; not closed`). Previously: 2026-08-08 (Entry 095 added: `AUTH-03` — Registration / Sign-in Orchestration (application code, TDD): the third Authentication implementation package under `AUTH-BP` (Founder-authorized) — backend registration/sign-in orchestration composing merged responsibilities: new-vs-returning via `-09` resolution (AUTH-02), new customer via `-01` `createCustomerIdentity`, initial reference via the AUTH-CORR-001 `-08` path, returning-user access-state gating, session via AUTH-01 `createSessionContext`; one `authenticate` `onCall` in `index.ts` (verify via AUTH-02 then orchestrate). `CustomerAuthenticated` emission examined and **deferred to AUTH-08** per §12/AUTH-01 (AUTH-03 emits nothing new; `-01`/`-08` emit their own state-change events). Distinct derived event/idempotency ids; no credential persisted; no new error category; no `-01`/`-08`/`-09`/AUTH-01/AUTH-02/blueprint change. functions 485/485, `emulators:validate` 187/187; web 258/259 (one pre-existing unrelated phone-auth-harness latency flake). Pending Founder-authorized review/merge; next = `AUTH-04`; Capability 2 `Open — partially implemented; not closed`). Previously: 2026-08-08 (Entry 094 added: `AUTH-CORR-001` — Initial Authentication-Reference Linking Reconciliation (application code, TDD): a bounded interface/integration correction discovered through AUTH-02 §12 — reconciles the `-01 → -08 → -09` initial authentication-reference lifecycle so AUTH-03 can create an identity through `-01`, establish the authoritative reference through `-08`, and resolve it through `-09`. One branch added to `-08`'s `linkAuthenticationReferenceForIdentity` (materialise the authoritative `authenticationReferences/{type}:{id}` doc for an embedded-only initial reference; leave the projection untouched); no `-01` change, no AUTH-02 change, no new error category, no capability renumbering; uniqueness/idempotency/concurrency preserved. functions 477/477, lifecycle emulator 7/7, `emulators:validate` 181 pass/1 pre-existing-flaky. AUTH-02 §12 resolved on merge; AUTH-03 unblocked but unauthorised; Capability 2 `Open — partially implemented; not closed`). Previously: 2026-08-08 (Entry 093 added: `AUTH-02` — Token Verification & Identity Resolution implemented (application code, TDD): the Firebase-Admin ID-token verification adapter (`TokenVerifierPort` → `AuthenticatedCredential`, `referenceId` = Firebase authUid, closed 14-category error mapping) + credential→identity resolution service (consumes the merged `-09` lookup with `purpose: "authentication"`; found → `resolved`, `RESOURCE_NOT_FOUND` → `unregistered`) at `functions/src/domains/authentication/services/`; 20 new unit tests + a real-Firestore-emulator test (functions 447→**467**); ESLint boundary extended to permit Firebase only in `authentication/services/**`; no raw-token persistence/logging; Customer Identity consumed not modified; **cross-package finding reported for AUTH-03** — an identity's initial reference is written only to the embedded projection by `-01`, not the authoritative collection `-09` resolves against, so AUTH-03 registration must link it via `-08`. Pending Founder-authorized review/merge; Capability 2 `Open — partially implemented; not closed`). Previously: 2026-08-08 (Entry 092 added: `AUTH-01` — Authentication Domain Contracts implemented (application code, TDD): the pure-domain Authentication layer (`AuthenticatedCredential`, `AuthResult`, `SessionContext`, auth event contracts, `AuthenticationDomainError` factories, `TokenVerifierPort`) at `functions/src/domains/authentication/{models,ports}`; 20 new unit tests (functions 427→447); machine-enforced no-Firebase ESLint boundary added; 14-category taxonomy reused (no new category); provider-neutral (reuses `AuthenticationReferenceType`); no orchestration/provider/Firebase/UI/session/linking/recovery. Pending Founder-authorized review/merge. Authentication concern remains `Not started — Foundations approved` at merged level; Capability 2 `Open — partially implemented; not closed`). Previously: 2026-08-08 (Entry 091 added: `AUTH-BP` — Authentication Blueprint (planning only, no implementation): the authoritative engineering contract for `AUTH-01`–`AUTH-09` — 16 sections (architecture, lifecycle, provider architecture, identity-resolution/registration/sign-in/linking/recovery flows, session lifecycle, events, error handling, package decomposition, testing/validation strategy, per-package exit criteria, risks/sequencing). References the merged `ENG-P2-ARCH-001` §7 architecture and does not redesign it. **No status change** — Authentication remains `Not started — Foundations approved`; Capability 2 remains `Open — partially implemented; not closed`; each `AUTH-*` package needs its own implementation authorization. Stop for Founder review). Previously: 2026-08-07 (Entry 090 added: `AUTH-P0-001` — Authentication Foundation Decisions recorded as `DEC-AUTH-001` (CONFIRMED): D-A1 official `AUTH-*` work-package series (distinct from `ENG-P2-002/003/004`, no renumbering); D-A2 MVP providers Phone OTP + Google (email/Apple/passkeys deferred, future additive); D-A3 duplicate-identity merge a separate governed capability; D-A4 SMS a production-launch concern (build on Firebase Auth Emulator); D-A5 customer/staff authentication separated. Authentication concern → `Not started — Foundations approved`; each `AUTH-*` package still needs its own implementation authorization. Records decisions only — no engineering; Capability 2 remains `Open — partially implemented; not closed`). Previously: 2026-08-07 (Entry 089 added: `CAP-P2-009` — Authentication Architecture & Delivery Planning (planning only, no implementation): a planning record prepares the customer Authentication concern (scope, functional responsibilities, boundaries per `ENG-P2-ARCH-001` §7, recommended package decomposition, dependencies, engineering order, required Founder decisions, validation strategy, risks); conforms to existing merged architecture, does not redesign it. **No status change** — Authentication remains `Not started — Unauthorised`; Capability 2 remains `Open — partially implemented; not closed`. Stop for Founder review). Previously: 2026-08-07 (Entry 088 added: `CAP-P2-008` — Customer Identity **concern recorded `Complete`** in `CDR-001` §5 (single source of truth); `CAP-P2-007` (PR #82) merged `436794f` with post-merge CI success, all concern-completion criteria satisfied; administrative programme-closure only — no code/capability-boundary/numbering change; **Capability 2 remains `Open — partially implemented; not closed`**; Authentication/ITM/`ENG-P2-004`/RTM F11 unchanged)

# 11thONUS Documentation Changes Log

Running log of all controlled changes to the documentation suite. Every consolidation phase appends an entry. This log does not replace version history; it provides a founder-readable trail.

---

## Entry 120 — `CAP-P2-ITM-C`: Effective Trust Derivation & MVP Progression

- **Date:** 16 August 2026
- **Performed by:** Claude (AI agent), per fresh Founder implementation authorization scoped explicitly and only to `CAP-P2-ITM-C`. Does not authorize `ITM-D` risk-gate/read integration, Reward Engine policy, trust regression, fraud-triggered trust changes, evidence expiry, operator visibility, new trust signals, Capability 3, G2/Release Readiness, or `AUTH-10`.
- **Entry verification:** `origin/main` confirmed at `1be2ff7c69c5f53b39856008e9ccba25fe1b616b` (the `CAP-P2-ITM-B` closure-sync merge). `ITM-A` (PR #111/#112) and `ITM-B` (PR #113/#114) confirmed merged with post-merge CI green. No `ITM-C`/`-D` work found on any other branch/PR (`gh pr list`/`git branch -a` clean). Capability 3/G2 confirmed not started. Dirty primary worktree (`chore/eng-p1-001-closure`) confirmed untouched; work performed in a clean linked worktree (`.claude/worktrees/itm-c-effective-trust`) on branch `feat/cap-p2-itm-c-effective-trust-derivation`, fresh from `origin/main`.
- **Codebase analysis before implementation:** re-read `ITM-DESIGN-001` §6.6/§6.6.1–§6.6.4/§15's `ITM-C` row/§22 in full. Reviewed `ITM-A`'s merged contracts (`trustLevel.ts`, `trustRecord.ts`, `trustRuleVersion.ts`, `signalState.ts`, `trustReasonReference.ts`) and `ITM-B`'s persistence/ingestion (`trustRecordRepository.ts`, `trustRecordDocument.ts`, `trustSignalIngestionService.ts`), confirming `trustLevel` is set once to `"unverified"` at creation and never recomputed by `ITM-B`. Located the authoritative registration timestamp — `domains/identity/models/customerIdentity.ts`'s `createdAt`, read via the existing `customerIdentityRepository.getCustomerIdentityById` (unmodified). Adopted `domains/permissions/evaluator/` + `domains/permissions/service/`'s existing pure-function-plus-typed-read-result-union pattern directly, rather than inventing a new one, per `trustDomainBoundary.test.ts`'s existing rule confining `domains/identity` imports in the trust domain to `services/` only.
- **Action:** new `functions/src/domains/trust/derivation/` (`types.ts` — read-result unions, `EffectiveTrustResult`, `CURRENT_TRUST_RULE_VERSION`; `deriveEffectiveTrust.ts` — the pure band-derivation function, no Firestore, no `domains/identity` import, no wall-clock read; `deriveEffectiveTrust.test.ts` — 39 unit tests; `effectiveTrustDomainBoundary.test.ts` — 2 additive purity-boundary tests) and `functions/src/domains/trust/services/` (`effectiveTrustService.ts` — the Firestore orchestrator, `getEffectiveTrust`; `effectiveTrustErrors.ts` — failure-reason → `TrustDomainError` mapping, reusing the existing closed 14-category taxonomy; `effectiveTrustService.emulator.test.ts` — 7 real-Firestore tests, incl. a dedicated stale-persisted-cache-never-overrides test against a record genuinely created via `ITM-B`'s own repository).
- **TDD:** `deriveEffectiveTrust.test.ts` written and run first against the not-yet-existing module — genuine RED captured (`Cannot find module './deriveEffectiveTrust'`) — then the pure function implemented to GREEN (39/39). No retrospective RED manufactured.
- **Verified exclusions:** no numeric-score field on `EffectiveTrustResult`; no operator-facing field; no risk-gate function/type/contract anywhere in the diff; `ITM-A`/`ITM-B` files byte-identical to `origin/main` (`git diff` over `models/`/`repositories/`/`trustSignalIngestionService.ts` empty); no cache write-back (`getEffectiveTrust` never calls `ingestTrustEvidence` or any write path — confirmed by re-reading the raw Firestore document after derivation and asserting `trustLevel`/`version` unchanged).
- **Status change:** `ITM-C` implemented, TDD, pending Founder-authorized review/merge — not self-merged. `ITM-D` remains not started; ITM overall remains Not complete. Capability 2 remains `Open — partially implemented; not closed`. Capability 3 `Not started`. G2 not started. Dirty primary worktree untouched.
- **Files:** 7 new files under `functions/src/domains/trust/{derivation,services}/`; the implementation report; `CDR-001-capability-delivery-roadmap.md` (§2 row/§5 ITM lines + header); this entry. **No dependencies added. No config/Firebase/Rules/index change. No deployment.**
- **Validation:** focused suite **41/41** (39 pure + 2 boundary); full functions suite **917/917**; `domains/trust` emulator suite isolated **31/31** (real Firebase Emulator Suite, `firebase emulators:exec`); web **397/397** unchanged; `tsc --noEmit`/`tsc` build/`eslint .`/`prettier --check` all clean. A full-repo `emulators:validate` sandbox run showed 36 failures across 12 files entirely outside `domains/trust` (identity/authentication/permissions/shared — Firestore concurrent-transaction-contention symptoms); disclosed as pre-existing sandbox flakiness, confirmed unrelated by the isolated 100%-green `domains/trust` run and by PR #115's own CI run passing cleanly.
- **PR/CI:** [#115](https://github.com/Fkenogo/11THONUS/pull/115), head `78eb35d`, CI `Build, Lint, Test, Emulator Validation` = **pass**.
- **Rollback:** revert PR #115 (or `git revert 78eb35d`) — entirely additive (7 new files, 0 modified files); no schema, no deployed resource, no data to roll back.
- **Report:** [`CAP-P2-ITM-C` report](../05-implementation/reports/CAP-P2-ITM-C-effective-trust-derivation-2026-08-16.md).

**Final gate: ITM-C READY FOR FOUNDER REVIEW/MERGE.**

---

## Entry 119 — `CAP-P2-ITM-A`: Independent Final Contract Review, Merge & Closure

- **Date:** 16 August 2026
- **Performed by:** Claude (AI agent), per Founder task "CAP-P2-ITM-A — Independent Final Contract Review, Merge & Closure." Authorizes an independent final review of `ITM-A` and, if clean, merge/closure of PR #111 only — explicitly does not authorize `ITM-B`/`ITM-C`/`ITM-D`, Capability 3, or G2.
- **Entry verification:** PR #111 confirmed `OPEN`, head `fabfed67a71c5236d146fe254291419608caf5d3` exactly matching the expected head with zero later commits (single-commit PR), CI `pass` (3m28s), `mergeable: MERGEABLE`. `ITM-DESIGN-001` confirmed merged/authoritative on `origin/main`. No `ITM-B`/`-C`/`-D` branch or PR found anywhere. Dirty primary worktree confirmed untouched (33 items, unchanged).
- **Independent review performed (not trusting the prior implementation report as source of truth):** re-read `ITM-DESIGN-001` directly and cross-checked the actual merged code against it. Scope verification: `functions/src/domains/trust/models/**` confirmed to contain contracts only — direct module-export inspection via `tsx` confirmed `trustRecord.ts` exports exactly `["createTrustRecord"]` (no mutation/transition function — structurally impossible to implement regression) and `trustLevel.ts` exports only the closed set plus pure ordering helpers (no derivation function). Repository-wide `grep` across the domain for prohibited terms — numeric score, `accountAgeDays`/30-day/`Date.now()`/highest-satisfied-band logic, purchase/merchant/device/fraud signals, weighting/delta/trustPoints, regression/expiry/operator/Reward-Engine terms — returned zero executable-code matches (only documentation/comments/test-assertion-of-absence). Trust-record authority model verified: `trustLevel`'s JSDoc explicitly documents it as a read-optimization cache, never authoritative-when-persisted, consistent with `ITM-DESIGN-001` §6.6.1. Identity boundary verified one-directional both ways (trust domain does not import `identity`'s value objects; `identity` domain does not import `domains/trust`). Privacy/data-minimization re-verified: no email/phone/password/OTP/token/credential/demographic field found anywhere in the public contract. Full diff (`git diff --name-status origin/main..fabfed6`) confirmed to contain only `functions/src/domains/trust/models/**` (21 files), one additive `eslint.config.js` block, and documentation/traceability files — no executable file outside `ITM-A` scope.
- **Codex automated review:** unavailable in this session (disclosed accurately, not concealed). The independent manual review above served as the final review gate, per this task's explicit authorization for that circumstance.
- **Full validation re-run on the exact PR head (`fabfed6`), not merely re-cited from the prior task:** focused suite **74/74**; full functions suite **872/872**; `tsc --noEmit` clean; functions `tsc` build clean; root `eslint .` clean; `prettier --check` clean; web suite **397/397**; `firebase emulators:exec ... test:emulator` (`pnpm emulators:validate`) **288/288** — no ITM-A-specific emulator coverage exists because this package has no Firestore/Firebase surface to exercise, consistent with its designed scope; a targeted secret/credential grep across the diff found nothing.
- **Findings:** none material. No scope leakage, no derivation logic, no invented signal/policy, no framework dependency, no validation gap.
- **Merge:** with the review clean, PR #111 merged via `gh pr merge 111 --merge` (standard merge commit, matching repository convention) as `eea87269f9312eb9dfddba199de7e31fab75579d`. Post-merge: `origin/main` fetched and confirmed at `eea8726`; `fabfed6` confirmed an ancestor; post-merge CI (`main`, run `31950968714`) confirmed `success`; `functions/src/domains/trust/**` confirmed present on `origin/main`.
- **Status change:** `ITM-A` = **Complete/merged**. `ITM-B`/`ITM-C`/`ITM-D` remain **Not started** — each requires its own fresh Founder implementation authorization; **not begun by this task**. ITM overall remains **Not complete**. Capability 2 remains `Open — partially implemented; not closed`. Capability 3 remains `Not started`. G2 not started.
- **Files:** `CDR-001-capability-delivery-roadmap.md` (§2/§5 ITM lines + header dated append), this entry, `IMPLEMENTATION_CHANGES.md`, and the `CAP-P2-ITM-A` implementation report (closure section appended). **No application/runtime code changed by this task's own diff** (PR #111's code was already merged unmodified — this task performed review and merge only, no merge-time implementation change).
- **Rollback:** `git revert` the merge commit `eea8726` — the underlying `ITM-A` change is entirely additive (one new domain directory, one additive ESLint block); no schema, no deployed resource, no data to roll back.
- **Report:** [`CAP-P2-ITM-A` report](../05-implementation/reports/CAP-P2-ITM-A-trust-domain-contracts-2026-08-16.md) (closure section appended in place).

**Final gate: ITM-A MERGED AND CLOSED — ITM-B AWAITS FRESH FOUNDER AUTHORIZATION.**

---

## Entry 118 — `CAP-P2-ITM-A`: Trust Domain Contracts & Trust Record Model

- **Date:** 16 August 2026
- **Performed by:** Claude (AI agent), per fresh Founder implementation authorization scoped explicitly and only to `CAP-P2-ITM-A`. Does not authorize `ITM-B` persistence/event ingestion, `ITM-C` trust-band derivation/runtime progression, `ITM-D` risk-gating/integration, Capability 3, G2/Release Readiness, `AUTH-10`, Firebase deployment, new trust signals, regression policy, or operator visibility.
- **Entry verification:** `origin/main` confirmed at `b14239d15afac1081ca1ca84e0f02b302a46399d` (the `CAP-P2-ITM-DESIGN-001`/PR #110 merge commit); post-merge CI confirmed green. `ITM-DESIGN-001` v1.2 confirmed present and authoritative. No `ITM-A`–`D` work found on any other branch/PR. Capability 3/G2 confirmed not started. Dirty primary worktree (`chore/eng-p1-001-closure`) confirmed untouched; work performed in a clean linked worktree on branch `feat/cap-p2-itm-a-trust-domain-contracts`, fresh from `origin/main`.
- **Codebase analysis before implementation:** reviewed `trustReference.ts` (the existing Customer-Identity-side pointer this package's `TrustRecordId` slots into), `identityErrors.ts`/`permissionErrors.ts` (the domain-local `*DomainError` convention over the closed 14-category taxonomy), `customerIdentityId.ts`/`role.ts`/`permissionOverride.ts` (value-object/closed-enum/pure-factory patterns), `permissionAuditEvent.ts` (domain-local closed-enum-copy convention), `auditEnvelope.ts` (confirms cross-domain identity references stay plain `string`, never the owning domain's value-object type), and the existing per-domain `eslint.config.js` Firebase-import-ban blocks. No new architectural style invented — `ITM-A` follows the closest existing precedent (`permissionOverride.ts`'s pure-factory, no-mutation style), consistent with `ITM-DESIGN-001` §15 scoping `ITM-A` to contracts/value-objects only.
- **Action:** new `functions/src/domains/trust/models/` — `trustLevel.ts` (closed `unverified`/`provisional`/`established` set with ordering, `AD-ITM-1`), `trustRecordId.ts`, `verificationState.ts`, `signalState.ts` (excludes `accountAgeDays` — derived at read time per §6.6.4, never stored), `trustRecordStatus.ts` (closed `active`/`frozen`/`suspended` set, no transition function per §8.3), `trustEvidenceCategory.ts` (closed to the two currently-available `AUTH-08` signals), `trustReasonReference.ts` (evidence entry structurally carrying no trust-movement field, making `AD-ITM-2` neutrality type-level), `trustRuleVersion.ts` (minimal positive-integer version contract, §6.6.2), `trustRecord.ts` (the aggregate — `createTrustRecord` is its only export; `trustLevel` documented as derived/cached per §6.6.1; no mutation/transition function exists, so no regression path can exist, `AD-ITM-3`), `trustErrors.ts`. Plus `trustDomainBoundary.test.ts` verifying export surface, Firebase-independence, and the one-directional Customer Identity boundary.
- **ESLint boundary added:** a new `functions/src/domains/trust/**/*.ts` block banning `firebase-admin`/`firebase-functions` imports, mirroring the five existing per-domain blocks.
- **TDD:** 9 of 10 test files (69 tests) written and run first, confirmed genuine RED (`Cannot find module`) before any implementation existed, then GREEN. `trustDomainBoundary.test.ts` (5 tests) was written after implementation — disclosed, not claimed as test-first, since it verifies structural properties rather than new behavior.
- **Verified exclusions:** no numeric-score field, no PII/credential field, no operator-visibility field (all asserted `undefined`); `TrustRecord`'s public shape asserted closed (exact 12-key set); no event consumer, no persistence, no risk-gate contract, no progression/derivation logic.
- **Status change:** `ITM-A` implemented, TDD, pending Founder-authorized review/merge — not self-merged. `ITM-B`/`ITM-C`/`ITM-D` remain not started; ITM overall remains Not complete. Capability 2 remains `Open — partially implemented; not closed`. Capability 3 `Not started`. G2 not started. Dirty primary worktree untouched.
- **Files:** 10 new implementation modules + 11 test files under `functions/src/domains/trust/models/`; one additive `eslint.config.js` block; the implementation report; `CDR-001-capability-delivery-roadmap.md` (§2/§5 ITM lines + header); `IMPLEMENTATION_CHANGES.md`; this entry. **No dependencies added. No config/Firebase/Rules/index change. No deployment.**
- **Validation:** focused suite **74/74**; full functions suite **872/872** (+74); `tsc --noEmit`/`eslint`/`prettier --check`/functions `tsc` build all clean; web **397/397** unchanged. `emulators:validate` not applicable (no Firebase/persistence surface).
- **Rollback:** revert the commit(s) on `feat/cap-p2-itm-a-trust-domain-contracts` — entirely additive; no schema, no deployed resource, no data to roll back.
- **Report:** [`CAP-P2-ITM-A` report](../05-implementation/reports/CAP-P2-ITM-A-trust-domain-contracts-2026-08-16.md).

**Final gate: ITM-A READY FOR FOUNDER REVIEW/MERGE.**

---

## Entry 117 — `CAP-P2-ITM-DESIGN-001`: Final Independent Review, Merge & Closure

- **Date:** 16 August 2026
- **Performed by:** Claude (AI agent), per Founder task "CAP-P2-ITM-DESIGN-001 — Final Independent Review, Merge & Closure." Design closure only — does not authorize ITM implementation, Capability 3, `AUTH-10`, Firebase/deployment changes, or new permission identifiers.
- **Entry verification:** PR #110 confirmed `OPEN`, unmerged, head `b2026dc` (matching the expected reviewed head); CI green; dirty primary worktree confirmed untouched (33 items, unchanged since session start).
- **Independent review performed:** re-read the full final `ITM-DESIGN-001` document (not just the prior completion report) and checked it against `ENG-P2-ARCH-001`, `DEC-IDENTITY-001`, `DEC-PROV-004`, the Customer Identity trust-reference boundary, `AUTH-08`'s event contracts, `ENG-P2-004`'s permission boundary, Capability-2 closure requirements, the closed 14-category error taxonomy, `CDR-001`, and the Engineering Implementation Programme.
- **New finding (independent, not previously caught):** §17 (Acceptance Criteria) item 3 contained a self-referential stale cross-reference — "surfaced to the Founder (§17 below)" while already inside §17; the Founder Decisions section is §18. Corrected to cite §18 (and §22 for the now-resolved outcome). Classified **P3/cosmetic** — a documentation cross-reference error, no boundary or governance-substance impact.
- **Secondary finding:** `CDR-001` §2's Capability Status Summary snapshot row for Capability 2 still read "ITM `Not started — design authorized`" without reflecting the four now-resolved dispositions recorded in the authoritative §5. Corrected to "design fully resolved (FDR-1–FDR-4), pending fresh implementation authorization," matching §5. Classified **P3/cosmetic** — §5 was already authoritative and accurate; §2 is an explicitly-non-authoritative snapshot table.
- **All other checkpoints (band-model determinism, derived-state authority, identity/authentication/permissions boundaries, standard-participation protection, signal scope, recovery-neutral treatment, idempotency/replay design, privacy/fairness, future-versioning, ITM-A–D decomposition, Capability-2 closure sequence) independently re-verified — no contradiction, boundary violation, or unresolved Founder decision found.** No automated Codex review tooling was available in this session; the independent manual review required by the task was completed in full, per the task's own allowance for that circumstance.
- **Merge disposition:** with the review clean and the two cosmetic findings above corrected in this same commit, this task proceeds to merge PR #110 (this commit's own branch) — the merge itself, its commit SHA, and post-merge CI are recorded in the task's final report rather than in this entry, since this entry is written as part of the pre-merge commit and cannot self-referentially record its own eventual merge SHA.
- **Status change:** `CAP-P2-ITM-DESIGN-001` review/closure complete pending the merge action described above. ITM implementation = **Not started** (ITM-A awaits a fresh, separate Founder implementation authorization — not granted by this task). Capability 2 remains `Open — partially implemented`. Capability 3 remains `Not started`. G2 not started.
- **Files:** two one-line cross-reference corrections (`ITM-DESIGN-001-…md` §17; `CDR-001-…md` §2), this entry, `IMPLEMENTATION_CHANGES.md`. **No runtime code. No Firebase/deployment/config change. No dependency change.**
- **Validation:** documentation-only change; full-suite CI (build/lint/test/emulator, no path filtering) green on this commit's head prior to merge.
- **Rollback:** `git revert` the merge commit once merged — purely additive/corrective documentation across this task family; no schema, no deployed resource, no data to roll back.
- **Design package:** [`ITM-DESIGN-001`](../05-implementation/roadmap/ITM-DESIGN-001-identity-trust-management-architecture.md) (v1.2).

---

## Entry 116 — `CAP-P2-ITM-DESIGN-001`: FDR-1 Founder Countersignature, ITM Design Finalization & Final Consistency Review

- **Date:** 16 August 2026
- **Performed by:** Claude (AI agent), per Founder task "CAP-P2-ITM-DESIGN-001 — FDR-1 Founder Countersignature, Design Finalization, Final Review & Merge Gate" — a design/governance task; still does not authorize ITM runtime implementation, Capability 3, `AUTH-10`, Firebase/deployment changes, or new permission identifiers.
- **Entry verification:** PR #110 confirmed `OPEN`, unmerged, head `b3819b0` (the prior task's finalization commit) before this task's changes. Work performed in the same clean worktree/branch (`docs/cap-p2-itm-design-001`) used throughout this task family; dirty primary worktree untouched.
- **Action — FDR-1 countersignature recorded:** the Founder reviewed and countersigns the `AD-ITM-1` trust-band model proposed in `ITM-DESIGN-001` §6.6, **with an MVP policy clarification**: the band model (`unverified`/`provisional`/`established`, determined by the highest satisfied condition) is approved exactly as proposed; the 30-day threshold is confirmed as a **Founder-approved MVP policy boundary** — explicitly not statistically validated, fraud-calibrated, externally benchmarked, or stronger proof of identity ownership than Authentication itself provides; the term `established` is confirmed **internal-only**, meaning precisely "established under the current MVP trust-evidence model," never legal-identity verification, fraud clearance, financial credibility, customer quality, loyalty value, a risk-free account, participation eligibility, or a customer-facing status. New `ITM-DESIGN-001` §6.6.3 (Semantic Boundary) and §6.6.4 (Precise Time Semantics — `accountAgeDays = floor((currentServerTime − registeredAt) / 86400s)`, closed `≥ 30` inequality, explicit 29/30/31-day boundary test requirements) record this clarification. `AD-ITM-1` (§22) updated in place — its original process-approval text preserved as history, a dated countersignature block appended. `FDR-1` is now **fully resolved**, no longer provisional.
- **Combined disposition status:** with `FDR-2`/`FDR-3`/`FDR-4` already resolved (Entry 115) and `FDR-1` now resolved, **zero Founder decisions remain open** in the ITM design package. Design countersignature does **not** itself authorize implementation — ITM-A/B/C/D remain separately unauthorized pending the fresh implementation-authorization convention already established for `AUTH-*`/`ENG-P2-004*` packages.
- **§15 (Implementation Decomposition) re-confirmed:** ITM-A/B/C/D responsibilities, dependencies, and acceptance criteria refined in place to cite the now-resolved dispositions and the §6.6.4 precise time semantics (explicit 29/30/31-day boundary tests; duplicate-delivery and out-of-order-delivery tests for ITM-B; a regression-impossibility test for ITM-C). No structural boundary change — the original decomposition already implied this split.
- **Independent final consistency review performed (new §23):** checked the finalized design against `ENG-P2-ARCH-001`, `DEC-IDENTITY-001`, `DEC-PROV-004`, the Customer Identity trust-reference boundary, `AUTH-08`'s event contracts, `ENG-P2-004`'s permission boundary, Capability-2 closure requirements, the closed 14-category error taxonomy, and privacy/security requirements — thirteen checkpoints (A–M per the task's own checklist): identity boundary, authentication boundary, permissions-vs-trust separation, standard-participation protection, band-model determinism (including the exact scenario table the task requested), time/account-age semantics, derived-state discipline, event idempotency, privacy/fairness, future rule-versioning, the ITM-A–D decomposition, the Capability-2 closure sequence, and a stale-reference sweep. **No contradiction, circularity, or governed-principle violation found.**
- **One genuinely stale cross-reference found and fixed** (pre-existing since the design's first draft, not introduced by any prior disposition): `ITM-DESIGN-001` §6.3 read "See Founder Decision **FDR-1** in §17" — a leftover from before this document's sections were renumbered in its first drafting pass; §17 is "Acceptance Criteria," not the Founder Decisions section (§18). Corrected to point to §18 (original framing) and to §6.6/§6.6.3–§6.6.4/§22 (the resolved outcome). All other historical "not decided by this document" phrasing was found intentional (preserved-as-history per the repository's disposition convention) and left unmodified.
- **Version bump:** `ITM-DESIGN-001` v1.1 → v1.2. `CDR-001` §5's ITM concern-status line updated in place (dated append) to reflect all four Founder decisions resolved.
- **Status change:** ITM Founder decisions `FDR-1`/`FDR-2`/`FDR-3`/`FDR-4` all **Fully Resolved**. ITM design package status: implementation-ready from a decisions standpoint; ITM-A–D implementation itself **not authorized** by this entry. Capability 2 remains `Open — partially implemented; not closed`. Capability 3 remains `Not started`. G2 not started. `AUTH-10` not started.
- **Files:** `ITM-DESIGN-001-identity-trust-management-architecture.md` (§6.6 finalized, new §6.6.3/§6.6.4, §7/§8/§11/§15/§18/§19/§20/§22 updated in place, new §23), `CDR-001-capability-delivery-roadmap.md` (§5 ITM line + header dated append), this log (Entry 116), and `IMPLEMENTATION_CHANGES.md`. **No runtime code. No Firebase/deployment/config change. No dependency change.**
- **Validation:** documentation-only change; no application code touched. Repository CI (no path filtering) is the authoritative gate for the PR — full build/lint/test/emulator suite run regardless.
- **Rollback:** revert this task's commit(s) on branch `docs/cap-p2-itm-design-001` — purely additive/corrective documentation; no schema, no deployed resource, no data to roll back.
- **Design package:** [`ITM-DESIGN-001`](../05-implementation/roadmap/ITM-DESIGN-001-identity-trust-management-architecture.md) (v1.2).

**Final gate: ITM DESIGN DECISIONS RESOLVED — READY FOR FOUNDER FINAL REVIEW/MERGE.**

---

## Entry 115 — `CAP-P2-ITM-DESIGN-001`: `ENG-P2-004D` Merge-Sync + ITM Design Package + Governance Reconciliation

- **Date:** 16 August 2026
- **Performed by:** Claude (AI agent), per Founder task `CAP-P2-ITM-DESIGN-001` — a design/governance task, explicitly not authorizing ITM implementation, Capability 3, `AUTH-10`, Firebase/deployment changes, or new permission identifiers.
- **Entry verification:** `origin/main` confirmed at `2d7573b23d4e4dc9aaaed94d066a9cef7d02a600`; PR #109 (`ENG-P2-004D`) confirmed `MERGED` at that exact commit; post-merge CI (`Build, Lint, Test, Emulator Validation`) confirmed `SUCCESS`. ITM confirmed not started (no `docs/` reference anywhere prior to this entry). Capability 3 and G2 confirmed not started. Primary dirty worktree (`chore/eng-p1-001-closure`, 33 uncommitted paths) confirmed untouched — this task's work performed entirely in a separate clean worktree on branch `docs/cap-p2-itm-design-001`.
- **Merge-sync correction:** `ENG-P2-004D`/PR #109 was implemented-pending-merge as of Entry 114; it is now confirmed merged. `ENG-P2-004` (role context and permission resolution) is therefore **Complete**. `CDR-001` §5, the Engineering Implementation Programme's `ENG-P2-004` row/Notes, and this log's header are corrected accordingly (history preserved, not rewritten).
- **ITM design package delivered:** [`ITM-DESIGN-001` — Identity Trust Management Design Package](../05-implementation/roadmap/ITM-DESIGN-001-identity-trust-management-architecture.md), per Founder Decision FD-2. Defines the ITM boundary (extending `ENG-P2-ARCH-001` §8), the trust-record model, a recommended discrete-band trust-level model (numeric scoring explicitly rejected for MVP), the signal model and ingestion contract (built on the already-merged `AUTH-08` events), the risk-gated action contract (distinguished from `ENG-P2-004`'s role/permission contract), privacy/data-architecture recommendations, a failure model mapped to the existing closed 14-category taxonomy, MVP scope bounded to the trust-record foundation and ingestion contract, a four-package implementation decomposition (ITM-A–D, none implemented), and four Founder decisions (`FDR-1`–`FDR-4`) required before implementation may begin. **No ITM code, event consumer, risk-gate caller, or TRD10 schema change was implemented.**
- **Governance-currency reconciliation:** `CDR-001` §2/§5/§8 and the Engineering Implementation Programme's header and `ENG-P2-004` table cells corrected to reflect the confirmed current state (Customer Identity Complete; Authentication Complete; `ENG-P2-004` Complete; ITM `Not started — design authorized`; Capability 2 `Open — partially implemented; not closed`). G2 sequencing wording corrected: G2 (Deployment/Preview Review/Manual QA) is the capability-level **closure gate** that begins once the required domain concerns are complete — it is not itself gated by Capability 2 already being closed (Founder Decision FD-4; consistent with the existing `DEC-GOV-010` text, which was already correct but read ambiguously in surrounding prose).
- **Founder dispositions recorded (not re-litigated, applied as given):** FD-1 (Capability 2 is the full capability); FD-2 (ITM design authorized, not implementation); FD-3 (Capability 3 remains governance-sequenced after Capability 2 closure, notwithstanding `ENG-P2-004`'s technical unblock); FD-4 (G2 sequencing correction, above); FD-5 (the disclosed non-sensitive-permission-ALLOW gap does not block Capability 2 closure and does not reopen `ENG-P2-004`; no permission identifier invented).
- **Status change:** ITM concern moves `Not started — Unauthorised` → `Not started — design delivered, pending Founder disposition and fresh implementation authorization`. `ENG-P2-004` moves `Blocked` → `Complete`. Capability 2 remains `Open — partially implemented; not closed`. Capability 3 remains `Not started`. G2 remains not started (not executed by this task). `AUTH-10` remains not started.
- **Files:** 1 new design document (`ITM-DESIGN-001-identity-trust-management-architecture.md`); dated-append corrections to `CDR-001`, the Engineering Implementation Programme, this log, and `IMPLEMENTATION_CHANGES.md`. **No runtime code. No Firebase/deployment change. No dependency/config change. No Capability 3 or `AUTH-10` work.**
- **Validation:** documentation-only change; no application code touched, so no functions/web/emulator test run is applicable to this task's own diff. Repository CI (docs-scope) is the authoritative gate for the PR.
- **Rollback:** revert this task's commit(s) on branch `docs/cap-p2-itm-design-001` — purely additive/corrective documentation; no schema, no deployed resource, no data to roll back.
- **Design package:** [`ITM-DESIGN-001`](../05-implementation/roadmap/ITM-DESIGN-001-identity-trust-management-architecture.md).

**Final gate: ITM DESIGN READY FOR FOUNDER DISPOSITION.**

---

## Entry 114 — `ENG-P2-004C`/PR #108 Merge-Sync Correction; `ENG-P2-004D` Implemented

- **Date:** 16 August 2026
- **Performed by:** Claude (AI agent), per fresh Founder implementation authorization scoped explicitly to `ENG-P2-004D`.
- **Merge-sync correction (gap found, not a prior error):** Entry 113 recorded `ENG-P2-004C` as "in progress" but no subsequent entry ever recorded its completion or merge, in either this log or `IMPLEMENTATION_CHANGES.md`. `ENG-P2-004C` is confirmed **Complete/merged** — PR #108, merge commit `ae77348`, post-merge CI `SUCCESS` (run `31893354521`) — verified directly via `git log origin/main` and `gh run list` at this task's entry housekeeping, before any 004D code was written. History not rewritten; this entry supplies the missing sync.
- **`ENG-P2-004D` action:** implements the authorization-boundary integration at `functions/src/domains/permissions/service/authorizeAndExecute.ts` — a trusted-decision, TOCTOU-safe transaction boundary composing a transaction-bound `004B` evaluation, a `004C` sensitive-decision audit write, and a caller-supplied protected mutation inside one Firestore transaction, with a strict reads-before-writes phase sequence (auth reads/evaluation → protected-resource prepare, read-only, allow-only → audit idempotency read+write → mutation apply, write-only via a `TransactionWriter` type with no `.get`). The public API has no parameter of type `AuthorizationDecision`/`role`/`reasonCode`/`membershipId` anywhere — proven both structurally (the type) and adversarially (a test injecting fabricated decision fields past the type system, zero effect).
- **Founder-approved bounded prerequisite correction:** `businessMemberships.permissions` — declared `string[]` with no encoding since authoring (004A/004B both disclosed, deferred to 004D) — resolved as a typed array of `{permissionId, direction, grantedBy, grantedAt}` maps; `businessId`/`membershipId` stay structural, never persisted per-element. TRD10 §10.6.4 amended; `ENG-P2-004-DESIGN-001` §18 appended (history preserved). Extends 004B's `businessMembershipDocument.ts` reader only — no writer, no 004A/004C change, no evaluator-precedence change, no live data existed to migrate.
- **Internal test fixture (no Capability-3 dependency):** `permissionBoundaryTestFixtures` collection + `touchPermissionBoundaryFixture` command shim, using only already-governed catalogue permissions plus one synthetic non-catalogued id for the fail-closed non-sensitive path — mints no new permission, is not a Cloud Function endpoint.
- **Disclosed process/coverage limitations (not concealed):** (1) the boundary implementation and its emulator tests were developed together rather than test-first for this portion of the work (unlike the persistence correction, where genuine RED was captured) — no RED-before-GREEN evidence exists for `authorizeAndExecute` itself, and none is claimed; (2) a direct single-call Firestore transaction-retry test was attempted and deadlocked (nested blocking write inside an open transaction) — removed rather than patched with a timing workaround; retry-safety is evidenced indirectly via two-concurrent-distinct-command contention tests instead.
- **`ENG-P2-004` acceptance assessment:** design §13's 17 criteria plus four Founder-specified disposition rows graded in the implementation report §33. One row explicitly **not** marked PASS: a governed non-sensitive-permission ALLOW outcome is currently unprovable — no governed non-sensitive permission baseline table exists anywhere in the repository (a pre-existing `004A`/`004B`-disclosed gap, confirmed by direct code trace, independent of `004D`). Assessed as **not blocking** `ENG-P2-004` closure under the design's own acceptance criteria (none of the 17 explicitly requires that specific proof; inventing the missing baseline would itself violate this task's explicit scope limits) — recorded as a named, carried-forward gap for a future governance/product decision, not silently absorbed into a closure claim.
- **Status change:** `ENG-P2-004A`/`004B`/`004C` Complete/merged (unchanged, this entry only corrects `004C`'s missing merge-sync record). `ENG-P2-004D` implemented, pending PR/Codex review/Founder merge. **`ENG-P2-004` overall remains `Blocked`/not complete** pending that review. Capability 2 remains `Open — partially implemented; not closed`; Capability 3 not started; ITM `Not started — Unauthorised`; AUTH-10 unchanged.
- **Files:** 13 files under `functions/src/domains/permissions/` (2 optional-parameter seams, 1 extended reader, 1 new sibling function, 3 new files, corresponding test files), 2 governed-doc corrections (TRD10 §10.6.4, `ENG-P2-004-DESIGN-001` §18), this implementation report, this entry, `IMPLEMENTATION_CHANGES.md`, and the Engineering Implementation Programme `ENG-P2-004` Notes cell. **No dependencies added. No config/Firebase/Rules/index change. No deployment — no Cloud Function endpoint added.**
- **Validation:** functions `vitest run` **798/798** (unchanged unit-test count from `origin/main`'s own regression baseline — 0 new unit tests, all new coverage is emulator-level), `tsc --noEmit` clean, `eslint` clean, `prettier` clean (via pre-commit hook). `firebase emulators:exec ... test:emulator` **288/288** (+40 from the `origin/main` baseline of 248 — +18 persistence-correction override coverage, +22 boundary-matrix coverage net of hardening-pass consolidation). Web workspace/e2e not re-run (no file outside `functions/src/domains/permissions/**` plus two docs was touched); full-repo CI is the authoritative cross-workspace check, pending.
- **Rollback:** revert this task's three commits (`6167c65`, `20b7b0a`, `d5f05ed`) — all additive (new files, optional parameters, one extended reader); no schema migration, no deployed function, no data to roll back.
- **Report:** [`ENG-P2-004D-authorization-boundary-implementation-report-2026-08-16.md`](../05-implementation/reports/ENG-P2-004D-authorization-boundary-implementation-report-2026-08-16.md).

---

## Entry 113 — `ENG-P2-004B`/PR #107 Merge & Programme-Currency Sync; `ENG-P2-004C` Begun

- **Date:** 15 August 2026
- **Performed by:** Claude (AI agent).
- **Result (programme-currency sync, no rewrite of Entry 112):** `ENG-P2-004B`/PR #107 recorded **merged** (`046f22d`, post-merge CI green), superseding Entry 112's "pending PR creation, Codex review pass(es), and Founder review/merge. NOT MERGED" wording (history preserved, not rewritten). Seven Codex review passes were completed on PR #107 (pass 1: 3 P1 + 1 P2; pass 2: 1 P1 + 2 P2; pass 3: 2 P2; pass 4: 2 P1 + 1 P2; pass 5: 1 P1 + 2 P2; pass 6: 2 fixed + 1 rejected with documented rationale; pass 7: 1 P2) plus an independent Founder-authorized final security review, all fixed TDD-first except the one explicitly dispositioned scope-boundary rejection (honoring non-sensitive-permission grants would require inventing a non-governed permission registry — matches 004A's own precedent for declining to invent ungoverned content). Final reviewed head `5829cad`; merge commit `046f22d`; post-merge CI green.
- **Also begun this entry:** `ENG-P2-004C` — Permission Decision Audit Integration — fresh Founder implementation authorization received, scoped explicitly to `ENG-P2-004C` only (not `004D`/Capability 3/ITM/Release Readiness/AUTH-10).
- **Status:** `ENG-P2-004A` Complete/merged. `ENG-P2-004B` **Complete/merged**. `ENG-P2-004C` in progress. `ENG-P2-004D` not started. `ENG-P2-004` overall **NOT COMPLETE**. Capability 2 `Open — partially implemented; not closed`; Capability 3 not started; ITM `Not started — Unauthorised`; AUTH-10 unchanged.
- **Report:** [`ENG-P2-004B-permission-evaluation-implementation-report-2026-08-15.md`](../05-implementation/reports/ENG-P2-004B-permission-evaluation-implementation-report-2026-08-15.md) (§31–32 review-pass history); `ENG-P2-004C` report to follow at closure of that package.

---

## Entry 112 — `ENG-P2-004B` — Permission Evaluation (application code, TDD)

- **Date:** 15 August 2026
- **Performed by:** Claude (AI agent), per fresh Founder implementation authorization scoped explicitly to `ENG-P2-004B` only (not `004C`/`004D`/Capability 3/ITM/Release Readiness/AUTH-10).
- **Result:** implements the deterministic permission evaluator at `functions/src/domains/permissions/{evaluator,models,repositories,service}/` — a pure decision function (`evaluateAuthorizationDecision`) implementing design §6.9's algorithm exactly (subject → business-state gate → membership-state gate/isolation check → permission-shape check → Owner floor → explicit revocation → explicit grant → sensitive-permission gate → role default → fail-closed deny), machine-enforced framework-independent; a thin Firestore orchestrator (`evaluatePermission`) and two new read-only repositories (`businessRepository`, `businessMembershipRepository`) reading TRD10 §10.6.3/§10.6.4 documents that had zero prior code. Test-first: RED evidence captured before implementation (module-not-found failure), 49-case test matrix authored before code. 34 pure-function unit tests + 2 repository throw-handling tests + 18 real-Firestore-emulator tests (cross-business isolation, no-cache, zero-write/zero-outbox purity, malformed/contradictory stored data, transient-failure handling). One narrowly-scoped `eslint.config.js` change (rescopes the 004A Firebase-import restriction to `models/` only, matching the Identity domain's own precedent). **Flagged for Founder review (not blocking, both are interpretations of already-approved 004A artifacts, documented in the implementation report §14/§21):** (1) the catalogue's §3.2 rows 7-8 role-default carve-out is reconciled using 004A's already-merged `SENSITIVE_PERMISSION_ROLE_TEMPLATES` as authoritative where design §4.1 item 6's general phrasing is ambiguous; (2) override *persistence* (grant/revoke serialization into TRD10's flat `permissions: string[]` field) remains undesigned, as 004A's own `permissionOverride.ts` already documented, and is left to `ENG-P2-004D` — the membership repository reads structural fields only. No `004C` audit/outbox emission, no `004D` protected-command/Cloud-Function wiring, no Capability-3 membership-mutation code, no caching, no dual control, no Firestore Rules/indexes change. functions **715/715** (whole repo, +50 new), apps/web **397/397** (unchanged), `emulators:validate` **247/247**; typecheck/lint/format/build clean.
- **Status:** `ENG-P2-004B` implemented, test-first, pending PR creation, Codex review pass(es), and Founder review/merge. **NOT MERGED.** `ENG-P2-004C`/`004D` not started. `ENG-P2-004` overall **NOT COMPLETE**. Capability 2 `Open — partially implemented; not closed`; Capability 3 not started; ITM `Not started — Unauthorised`; AUTH-10 unchanged.
- **Report:** [`ENG-P2-004B-permission-evaluation-implementation-report-2026-08-15.md`](../05-implementation/reports/ENG-P2-004B-permission-evaluation-implementation-report-2026-08-15.md); test matrix: [`ENG-P2-004B-test-matrix-2026-08-15.md`](../05-implementation/reports/ENG-P2-004B-test-matrix-2026-08-15.md).

---

## Entry 111 — `ENG-P2-004A` — Permission Contracts & Sensitive Permission Catalogue (application code, TDD)

- **Date:** 14 August 2026
- **Performed by:** Claude (AI agent), per Founder implementation authorization citing `ENG-P2-004-DESIGN-001` (Approved v1.1) as governing design.
- **Result:** implements the `ENG-P2-004A` contract/configuration foundation at `functions/src/domains/permissions/models/` — `Role`, `PermissionId`, the eight-entry Sensitive Permission Catalogue (design §3.2, transcribed exactly), `RoleTemplate` (sensitive-inheritance invariant, `SENSITIVE_PERMISSION_ROLE_TEMPLATES` derived from catalogue metadata only), `PermissionOverride` (Owner-target refused), domain errors (closed 14-category taxonomy, no new category). No runtime evaluator, audit/outbox, persistence, or protected-command integration. functions **665/665** (+98), apps/web **397/397**, typecheck/lint/format/build clean.
- **Status:** `ENG-P2-004A` implemented, pending Founder review/merge. `ENG-P2-004B`/`004C`/`004D` not started. `ENG-P2-004` overall **NOT COMPLETE**. Capability 2 `Open — partially implemented; not closed`; Capability 3 not started; ITM `Not started — Unauthorised`.
- **Report:** [`ENG-P2-004A-permission-contracts-and-catalogue-implementation-report-2026-08-14.md`](../05-implementation/reports/ENG-P2-004A-permission-contracts-and-catalogue-implementation-report-2026-08-14.md).

---

## Entry 110 — `ENG-P2-004-DESIGN-001` v1.1 — Founder Dispositions Recorded (AD-1–AD-5)

- **Date:** 14 August 2026
- **Performed by:** Claude (AI agent), per Founder task recording dispositions on the five decision points raised in the design package's §15. Design-document revision only.
- **Result:** AD-1 (no dual control, MVP), AD-2 (no evaluator cache, MVP), AD-3 (reuse existing outbox/audit, with a durable-consistency-boundary clarification), AD-4 (`AUTH_FORBIDDEN` uniformly for non-active membership states; **corrected** the server-owned configuration/data-integrity mapping from `VALIDATION_FAILED` to `AUTH_FORBIDDEN` — no new error category), AD-5 (four sub-packages 004A–004D approved; **corrected** the 004D boundary to remove a circular dependency on Capability 3 — 004D now closes via governed test fixtures only). No unresolved Founder decision remains in the design package.
- **Status:** `ENG-P2-004` remains **Not started — Unauthorised**. `DEC-ID-003` not reopened. ITM, Capability 3, AUTH-10 not begun. No runtime/Firebase/deployment/decision-register change.
- **Report:** [`ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md`](../05-implementation/roadmap/ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md) §17.

---

## Entry 109 — `ENG-P2-004-DESIGN-001` Role-Context & Permission-Resolution Architecture (design/architecture only)

- **Date:** 14 August 2026
- **Performed by:** Claude (AI agent), per Founder-issued bounded design task. Design/architecture only; no implementation, no runtime/Firebase/deployment change.
- **Result:** resolves `DEC-ID-003`'s three named implementation prerequisites (Sensitive Permission Catalogue, Override-Resolution Rule, Permission Evaluation and Audit Design) plus the related cross-business role-context isolation gap, all disclosed but undesigned in the `DEC-ID-003` decision package (2026-07-30). `DEC-ID-003`'s own policy is not reopened. Adds pointer-only superseding notes (dated 2026-08-14) to Master Workflow §6/§17, Engineering Implementation Programme, and CDR-001 §5 reconciling the "Blocked" vs. "Blocked — partially (implemented)" wording without rewriting any historical report.
- **Status:** `ENG-P2-004` remains **Not started — Unauthorised**; Capability 2 remains `Open — partially implemented; not closed`; Authentication `Complete`; ITM `Not started — Unauthorised`; Capability 3, AUTH-10, ITM not begun. Five Founder decision points open (see the design package §15). No decision-register change.
- **Report:** [`ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md`](../05-implementation/roadmap/ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md).

---

## Entry 108 — `AUTH-HOSTED-PREVIEW-002` Closure — Authentication Concern `Complete`

- **Date:** 14 August 2026
- **Performed by:** Claude (AI agent), per Founder task "AUTH-HOSTED-PREVIEW-002 Stage 8" — final returning-Email evidence verification and Authentication-concern closure. Evidence/governance only; no runtime/Firebase/deployment change.
- **Result:** the Founder-executed bounded hosted-preview validation (Stages 1–8) is complete; every mandatory amended-`AUTH-BP` §14 criterion **PASSED with backend evidence** — Google hosted auth; Email/Password fresh registration (`registered`); Email/Password returning sign-in (`signed_in`, backend `authenticate` + `customer_authenticated [email]` at 2026-08-14T08:56, no new identity/reference); multi-provider surface + English/French; Confirm-Password (`AUTH-UX-CORR-001`) closure condition; backend identity/reference integrity (2 distinct principals, 2 identities, 2 authoritative references, no duplicates, correct `-09`); AUTH-08 events; no credential persisted; Phone OTP optional/non-blocking.
- **Status:** **Authentication concern → `Complete`** (concern-level, `DEC-GOV-008`). **Concern completion ≠ Capability closure — Capability 2 remains `Open — partially implemented; not closed`** (ITM `Not started — Unauthorised`; `ENG-P2-004` `Blocked — partially`; release-readiness/manual-QA/deployment G2 pending). AUTH-10 not started; not self-merged; dirty primary worktree untouched; preview channel/env/test users retained until the closure PR merges. See the [`AUTH-HOSTED-PREVIEW-002` closure report](../05-implementation/reports/AUTH-HOSTED-PREVIEW-002-authentication-concern-closure-2026-08-14.md).

---

## Entry 107 — `AUTH-UX-CORR-001` Email Mode Clarity & Confirm-Password Correction (frontend UX, TDD)

- **Date:** 13 August 2026
- **Performed by:** Claude (AI agent), per Founder task "AUTH-UX-CORR-001" — a bounded frontend UX correction discovered during `AUTH-HOSTED-PREVIEW-002` Stage 5 Founder validation. No authentication architecture/semantics change; no backend/Firebase/deploy change.
- **Change:** `SignInPanel` now presents two explicit Email states — **Sign-in mode** (Email + Password + "Sign in with email" + "New here? Create account") and **Register mode** (Email + Password + **Confirm password** + "Create account" + "Already have an account? Sign in"). Confirm-password is frontend validation only (mismatch fails closed with a localized accessible `role="alert"` bound to the field; never sent to Firebase/`authenticate`, never persisted/logged/returned); the `registerWithEmail(email, password)` contract is unchanged. Mode switching never calls Firebase and clears credentials + stale errors while preserving the email.
- **Localization:** new keys `confirmPasswordLabel`, `passwordMismatch`, `switchToRegister`, `switchToSignIn` added to en + fr (I18N-001; parity preserved; no hard-coded copy).
- **Validation (TDD):** web 397/397 (+11, incl. two review-driven regressions — mismatch clears on either password field, stale server error dropped before a client mismatch); functions 567/567; `emulators:validate` 221/221; e2e 1/1; typecheck/lint/format clean; preview build carries the corrected panel, production excludes it (isolation intact).
- **Governance:** `F-UX-1` recorded **resolved**; the Founder **elected** to treat this hosted-preview-discovered UX issue as an Authentication-concern closure condition (not an original `AUTH-BP` §14 criterion; historical §14 evidence not rewritten). The remaining mandatory §14 item is the Founder Email/Password hosted retest.
- **Status:** implemented, pending Founder-authorized review/merge (not self-merged); no deploy/console/preview-channel change; AUTH-10 not started; dirty primary worktree untouched; preview channel `auth-preview-002` retained. See the [`AUTH-UX-CORR-001` report](../05-implementation/reports/AUTH-UX-CORR-001-email-mode-clarity-and-confirm-password-2026-08-13.md).

---

## Entry 106 — `AUTH-PREVIEW-READINESS-001` Multi-Provider Authentication Hosted-Preview Readiness (frontend build + Hosting CSP, TDD)

- **Date:** 12 August 2026
- **Performed by:** Claude (AI agent), per Founder task "AUTH-PREVIEW-READINESS-001" — resolves the `AUTH-PROVIDER-CONFIG-001` hosted-preview prerequisites (P-1/P-2/P-3). Readiness only: no Firebase Console change, no deploy, no preview-channel creation, no hosted-preview execution, no AUTH-10.
- **Founder decision recorded:** preview-surface boundary = **isolated hosted build (CR3-style)** — structurally excluded from the normal production build, not a runtime-flagged production route.
- **P-1 (preview surface):** new isolated `sign-in-preview` build (`apps/web/sign-in-preview.html` + `src/dev/signInPreview/*`, `viteBuildModes.ts`, `build:sign-in-preview`) mounting the **existing** `SignInPanel` via the **existing** `createSignInActions` over the shared Firebase modules (no auth logic duplicated); reuses `LanguageSwitcher` (I18N-001). Disabled-by-default provider flags; Email/Password + Google core, Phone OTP optional/non-default; fail-closed gate (flag+mode+project). Secondary DEV-only `/dev/sign-in-preview` route. Empirically grep-verified present in the preview bundle and absent from the production bundle (with PWA SW omitted from the preview).
- **P-2 (Hosting CSP):** in both `firebase.json` blocks, `connect-src` gains the `authenticate` callable origin; and (after two Codex P1 findings for Google `signInWithPopup`) `frame-src` gains `https://eleventh-on-us-dev.firebaseapp.com` (resolver iframe) and `script-src`+`frame-src` gain `https://apis.google.com` (GAPI bootstrap + iframe). No wildcard; reCAPTCHA/Google + Identity Toolkit origins and restrictive directives preserved; regression test added/extended (7/7).
- **P-3 (docs):** `VITE_AUTH_ENABLE_{EMAIL_PASSWORD,GOOGLE_SIGN_IN,PHONE_OTP}` + `VITE_ENABLE_SIGN_IN_PREVIEW` documented in `apps/web/.env.example` (blank, fail-closed; no secrets).
- **Validation (TDD):** web 378/378 (+43); functions 567/567 (no backend change); `emulators:validate` 221/221; e2e 1/1; typecheck/lint/format/build clean.
- **Security/identity:** identity model unchanged (provider ≠ identity); Firebase credential authority; no raw password/token/OTP persisted/logged/rendered; deny-by-default Rules unchanged; no client write path; preview `noindex` + no PWA SW; project-ID allowlist on the preview platform.
- **Status:** implemented, pending Founder-authorized review/merge (not self-merged); no deploy/console/preview-channel; AUTH-10 not started; dirty primary worktree untouched. Authentication concern → `Validation Complete — hosted-preview ready`; final closure still depends on `AUTH-HOSTED-PREVIEW-002` PASS; Capability 2 `Open — partially implemented; not closed`. See the [`AUTH-PREVIEW-READINESS-001` report](../05-implementation/reports/AUTH-PREVIEW-READINESS-001-multi-provider-hosted-preview-readiness-2026-08-12.md).

---

## Entry 105 — `AUTH-CORR-003` Multi-Provider Authentication Policy Alignment (Google + Email/Password + optional Phone OTP)

- **Date:** 12 August 2026
- **Performed by:** Claude (AI agent), per Founder task "AUTH-CORR-003 Resume After I18N-001" — implements the Founder multi-provider authentication decision; resumed only after `I18N-001` verified merged/authoritative on `main` (`0bc8975`). AUTH-10+ not authorized; hosted-preview not executed.
- **Founder decision recorded:** MVP approved providers = **Google + Email/Password + optional Phone OTP** (Apple/email-link/passkeys deferred); providers are alternative methods, none defines identity (one identity → one Firebase principal → one or more methods).
- **Governance amended (supersession, history preserved):** `DEC-AUTH-001` D-A2 (email/password now Included, phone optional — original struck through); `DEC-SEC-001` (phone no longer primary/mandatory); `DEC-PROV-004` (Email/Password added; SMS route optional); `TRD12 §12.4.1` (MVP-scope note); `AUTH-BP` §1/§3/§14 (provider list + multi-provider hosted-preview closure criteria).
- **Code (TDD):** AUTH-02 `VERIFIED_PROVIDER_TO_REFERENCE_TYPE` += `password → email` (Firebase `sign_in_provider` = `password`, authoritative); AUTH-04 email provider (`providerConfig`, new `emailPasswordSignInFlow.ts`, `createSignInActions`, `SignInPanel` Email/Password section — Google retained, Phone optional); AUTH-06 recovery map += `email → email_verification` (existing governed category). All new customer copy via I18N-001 (en+fr), none hard-coded.
- **Validation:** functions 566/566; web 335/335; typecheck/lint/format/build clean; e2e 1/1.
- **Security:** Firebase-only credential authority; no custom password store; password never persisted/logged/returned; fail-closed verification, closed taxonomy, deny-by-default Rules preserved.
- **Status:** implemented, pending Founder-authorized review/merge (not self-merged); hosted-preview not executed; AUTH-10 not started; dirty primary worktree untouched. See the [`AUTH-CORR-003` report](../05-implementation/reports/AUTH-CORR-003-multi-provider-authentication-2026-08-12.md).

---

## Entry 104 — `I18N-001` Centralized Localization Foundation (frontend, TDD) + AUTH-04 copy retrofit

- **Date:** 11 August 2026
- **Performed by:** Claude (AI agent), per Founder task "I18N-001 Centralized Localization Foundation" — a bounded implementation of the existing TRD13 / TRD16 §16.40 requirement (English primary/default, French supported) so `AUTH-CORR-003` can add customer-facing auth UI compliantly. AUTH-10+ not authorized.
- **Nature:** Frontend-only foundation + retrofit of AUTH-04's hard-coded customer copy. **No new product requirement, no backend/`functions/`/Firestore/Firebase/provider change.** `AUTH-CORR-003` remains blocked until this merges.
- **Governed requirement implemented:** TRD13 (translation keys; en/fr) + TRD16 §16.40 (one centralized i18n framework: key lookup, namespaces, language switching, English fallback, persistence, pluralization/format-ready).
- **Mechanism:** `i18next` + `react-i18next` + `i18next-browser-languagedetector` — one centralized instance, bundled en/fr resources, `fallbackLng: "en"`, localStorage persistence, `preferredLanguage` seam. Documents affected: none rewritten; this is an implementation of the existing spec (no governance supersession).
- **AUTH-04 retrofit:** SignInPanel customer copy → `auth` translation keys (byte-identical English + French); no hard-coded customer copy remains; behaviour unchanged.
- **Validation:** typecheck/lint/format/build clean; web 319/319 (+15 tests); e2e 1/1; functions 564/564 (untouched).
- **Status:** implemented, pending Founder-authorized review/merge (not self-merged); AUTH-CORR-003 not resumed; AUTH-10 not started; dirty primary worktree untouched. See the [`I18N-001` report](../05-implementation/reports/I18N-001-centralized-localization-foundation-2026-08-11.md).

---

## Entry 103 — `AUTH-09` Validation & Closure Review (reports + full-suite validation, no runtime code) + `AUTH-08` merge/closure programme-currency sync

- **Date:** 10 August 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — AUTH-09 Implementation" (the fresh implementation authorization for the **ninth and final** Authentication package under `AUTH-BP` §12; AUTH-10+ not authorized).
- **Nature:** **Validation & closure review — reports + full-suite validation only. No runtime code, no domain events, no client write path, no new error category, no completed-capability change.** No competing source of truth created; the Engineering Implementation Programme is intentionally left untouched (it defers Authentication concern status to `CDR-001` §5).
- **Programme-currency sync (Phase A2):** on entry, Master Workflow §17 and CDR-001 §5 still described **AUTH-08 as "pending review/merge" / "AUTH-09 not started"**; PR #97 had in fact **merged** (`cd8269c97c89833e674a689147f795ffe2a76d98`, head `05877a0`, 2026-08-10T13:53:19Z, post-merge CI green). Corrected with **dated superseding notes** (Master Workflow §17 "AUTH-08 merge/closure sync" bullet; CDR-001 §5 `[UPDATED 2026-08-10 — AUTH-08 merged]`), historical text preserved; no code/capability/numbering change.
- **Authoritative requirement (AUTH-BP §12/§14):** verify the Authentication concern-completion criteria (`DEC-GOV-009`/`-010`; DoD §2.1–2.7/2.11/2.12 + §2.6/G1 per-package Technical-Review coverage — every AUTH package post-dates the `AUTH-BP` baseline and was independently PR-reviewed with recorded dispositions) and run the repository-prescribed full-suite validation, on merged `main` `cd8269c`.
- **Prerequisites verified:** all eight implementation packages `AUTH-01`–`AUTH-08` (+ `AUTH-CORR-001`/`-002`) merged to `main`, each merge commit CI-green (PRs #87,#88,#89,#90,#91,#92,#94,#95,#96,#97).
- **Full-suite validation (green, on `cd8269c`):** typecheck PASS (apps/web + functions); lint PASS; `format:check` PASS; build PASS; functions unit **564/564**; web unit **304/304**; `pnpm emulators:validate` **221/221**; e2e **1/1**; no inherited `ENG-P1-002-CR1` flake recurred.
- **Security / invariant certification:** no raw credential/token/OTP/proof material persisted-logged-rendered (only an irreversible SHA-256 idempotency-key hash in `identityRecoveryEndpointService.ts`); deny-by-default Rules preserved (no AUTH-range `firestore.rules`/`functions/src/security` change; no client write path opened); closed **14-category** error taxonomy unchanged; tuple-qualified `(referenceType, referenceId)` reference identity, same-Firebase-principal link gate, Customer Identity `-08` global-ownership / `-09` resolution, AUTH-03 idempotency/atomicity, and AUTH-04/05/06/07/08 guarantees all preserved (consumed, not modified).
- **Bounded hosted-preview phone-OTP check (AUTH-BP §14) — Founder-executed step, staged:** requires a live `firebase hosting:channel:deploy` to `eleventh-on-us-dev` (an outward infrastructure action needing explicit Founder authorization, not granted by this task and not performed by the agent); no live SMS (Firebase test numbers). Per the `ENG-P1-003`/`EXT-TECH-001-HARNESS-CR3` precedent AUTH-BP §14 cites, engineering prepares (harness build + hosted-preview record + manual runbook + evidence template already checked in) and the **Founder executes**. Therefore the Authentication concern is recorded `Validation Complete — concern closure pending the Founder-executed bounded hosted-preview check`, **not** `Complete`. Production SMS remains `EXT-TECH-001` (Release-Readiness/G2), not a build gate.
- **Localization (Phase C):** AUTH-09 introduces no customer-facing UI/strings → no localization implementation required; English-primary/French-supported (TRD13) preserved.
- **Documents updated:** `CDR-001` §5 (AUTH-08-merged reconciliation + AUTH-09 note + concern label → `Validation Complete — closure pending`); Master Workflow §17 (AUTH-08 merge/closure-sync bullet + AUTH-09 bullet); `docs/changes/IMPLEMENTATION_CHANGES.md` (AUTH-09 section); this log (Entry 103); the [`AUTH-09` report](../05-implementation/reports/AUTH-09-validation-and-closure-review-2026-08-10.md).
- **Dependencies / configuration / migrations:** none.
- **Status:** `AUTH-09` implemented, **pending Founder-authorized review/merge** (not self-merged); **Concern Completion ≠ Capability closure** — Capability 2 remains `Open — partially implemented; not closed`; ITM/`ENG-P2-004` unchanged; AUTH-10+ not started; dirty primary worktree untouched; no unrelated worktree cleanup.

---

## Entry 102 — `AUTH-08` Authentication Events → ITM/Audit (application code, TDD) + `AUTH-07` merge/closure programme-currency sync

- **Date:** 10 August 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — AUTH-08 Implementation" (the fresh implementation authorization for the **eighth** Authentication package under `AUTH-BP` §10/§12; AUTH-09 not authorized). Founder dispositions at the entry gate: **scope = event emission per §12** (not reference-linking); **wiring = composition boundary**, durable awaited outbox write (no best-effort void fire), deterministic retry-stable identity, durable at-least-once + idempotent consumption, privacy-minimised payloads, additive `-10` allow-list extension.
- **"-08" numbering distinction (Founder-directed):** AUTH programme **AUTH-08** = *emit* the authentication trust/audit signals via the shared outbox. The **Customer Identity `-08`** (`ENG-P2-001-08`, already merged) owns authentication-**reference linking**/global-uniqueness/last-reference invariants — **not** re-implemented and **not** modified here. `AUTH-BP` prose "`-08`" means that merged linking package; only the §12 package-decomposition row named AUTH-08 is this package.
- **Programme-currency sync (Phase A2):** on entry, Master Workflow §17 and CDR-001 §5 still described **AUTH-07 as "pending review/merge" / "AUTH-08 not started"**; PR #96 had in fact **merged** (`28f762583dbb098e24c229b51ae730a42c1d7e89`, 2026-08-10T11:52:07Z, post-merge CI green run 31385400543). Corrected with **dated superseding notes** (Master Workflow §17 "AUTH-07 merge/closure sync" bullet; CDR-001 §5 `[UPDATED 2026-08-10 — AUTH-07 merged]`), historical text preserved; no code/capability/numbering change; no competing source of truth.
- **Summary (AUTH-08, AUTH-BP §10/§12):** emit `CustomerAuthenticated` (successful registration/sign-in) and `AuthenticationRecoveryProofProvided` (successful recovery proof) as fire-and-forget trust/audit signals via the shared outbox. Contracts pre-declared by AUTH-01 `authenticationEvents.ts`; emission only — no new event type, no new error category. Created `functions/src/domains/authentication/events/authenticationEventFactories.ts` (pure builders + deterministic id) and `services/authenticationEventEmitter.ts` (durable idempotent emitter); wired at the `index.ts` composition boundary; additive `outboxEntryRef` export in `shared/outbox/outboxWriter.ts`; additive `-10` `auditPayloadProjection.ts` allow-list cases.
- **Reliability/idempotency:** durable **awaited** outbox write (never an un-awaited/void best-effort fire) — enqueue failure propagates as retryable while AUTH-03/06 replay idempotently; **deterministic** `eventId = SHA-256(eventName, customerIdentityId, idempotencyKey)`; **idempotent read-guarded enqueue** neither duplicates nor resets an already-processed entry → durable at-least-once + dedup-by-`eventId` consumption (not exactly-once).
- **Boundaries:** payloads carry only `customerIdentityId` + categorical `referenceType` (+ `proofMethodCategory`) — no credential/token/OTP/proof material; audit projection fails closed for unknown types (`class_2` classification); no AUTH-03/06/07 service-internal change; no merged Customer Identity `-08` change; no shared idempotency/`firestore.rules`/`apps/web` change; no state-change event (`CustomerIdentityRegistered`/`AuthenticationReferenceLinked`/`IdentityRecovered`) re-emitted; closed 14-category taxonomy preserved. `→ ITM` discharged by durable outbox emission (no live ITM consumer wired yet).
- **Evidence (RED→GREEN):** factory unit 10/10; emitter emulator 5/5 (registration emits + `-01`/`-08` not duplicated; returning sign-in emits; same-key retry → single stable event, completed entry not reset; recovery emits + `IdentityRecovered` not duplicated + retry-stable; no token material in payload); audit projection +2, classification +1. functions **563/563**, web **304/304** (unchanged), `pnpm emulators:validate` **221/221** (+5, no inherited flake recurred); typecheck/lint/format/build/e2e clean. CI is the authoritative emulator gate.
- **Dependencies / configuration / migrations:** none.
- **Status:** `AUTH-08` implemented, **pending Founder-authorized review/merge** (not self-merged); **AUTH-09 not started**; dirty primary worktree untouched; no unrelated worktree cleanup. Capability 2 remains `Open — partially implemented; not closed`. See the [`AUTH-08` report](../05-implementation/reports/AUTH-08-authentication-events-itm-audit-2026-08-10.md).

---

## Entry 101 — `AUTH-07` Session / Access Gating (application code, TDD) + additive AUTH-01/AUTH-02 `authenticatedAt` extension + `AUTH-06` merge/closure programme-currency sync

- **Date:** 10 August 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — AUTH-07 Implementation" (the fresh implementation authorization for the **seventh** Authentication package under `AUTH-BP`; AUTH-08+ not authorized). Two Founder decisions obtained at the entry gate are recorded: **AD-1** — authorize the minimum additive AUTH-01/AUTH-02 extension surfacing the token's trusted `auth_time` as a server-derived `authenticatedAt` (privileged re-auth needs it; the merged verifier did not expose it); **AD-2** — privileged re-authentication default max age = **5 minutes**, kept configurable/injectable per TRD12 §12.29 (which fixes no value).
- **Programme-currency sync (Phase A2):** on entry, Master Workflow §17 and CDR-001 §5 still described **AUTH-06 as "pending review/merge" / "AUTH-07 not started"**; PR #95 had in fact **merged** (`04e1171…`, 2026-08-10T09:27:45Z, post-merge CI green run 31374698932). Corrected with **dated superseding notes** (Master Workflow §17 "AUTH-06 merge/closure sync" bullet; CDR-001 §5 `[UPDATED 2026-08-10 — AUTH-06 merged]`), historical text preserved; no code/capability/numbering change; no competing source of truth.
- **Summary (AUTH-07, AUTH-BP §9/§12):** the authentication **session / access-gating** layer — (1) session establishment (via AUTH-01 `createSessionContext`; Firebase remains the token authority, no bespoke store), (2) the identity-protected-action gate (resolve via AUTH-02/`-09` → access-state gate; browsing never gated), (3) **server-enforced** privileged re-authentication freshness on the trusted `authenticatedAt` (default 5 min, configurable; `verifiedAt` never substituted), (4) sign-out (client-session clear). Backend `functions/src/domains/authentication/{models/privilegedReauthentication.ts, services/sessionAccessService.ts}`; frontend `apps/web/src/authentication/{signOutFlow.ts, privilegedReauthenticationFlow.ts}`.
- **Additive AUTH-01/AUTH-02 extension (AD-1):** `authenticatedCredential.ts` gains an **optional** `authenticatedAt?: Date` (non-breaking; chosen over required after inspecting all producers); `firebaseTokenVerifier.ts` derives it server-side from the verified `auth_time` claim and **fails closed** (`AUTH_REQUIRED`) when absent/malformed. `verifiedAt` semantics, resolution, provider keying, and reference semantics unchanged.
- **Boundaries:** AUTH-07 **emits no domain events** (`CustomerAuthenticated` and `AuthenticationRecoveryProofProvided` stay AUTH-08); no change to AUTH-03/04/05/06 behaviour except consuming the additive field; closed 14-category taxonomy (no new category); no `-08`/`-09`/shared/`firestore.rules`/`index.ts` change; no client write path opened; tuple identity / same-principal linking / `-08` ownership / `-09` resolution / AUTH-03 idempotency / AUTH-05 gates / AUTH-06 proof binding all preserved. AUTH-08/AUTH-09 remain deferred.
- **Evidence (RED→GREEN):** new unit tests (model freshness boundary below/at/above + configurable non-default + refresh-does-not-reset + absent/future fail-closed; credential + verifier `authenticatedAt`; session/privileged gates; frontend sign-out + force-refresh) and a real-emulator `sessionAccessService.emulator.test.ts` (+4, real `-09` + persisted state). functions **547/547**, web **304/304**, `pnpm emulators:validate` **216/216** (+4, no inherited flake recurred); typecheck/lint/format/build/e2e clean; secret scan clean. CI is the authoritative emulator gate.
- **Dependencies / configuration / migrations:** none.
- **Status:** `AUTH-07` implemented, **pending Founder-authorized review/merge** (not self-merged); **AUTH-08+ not started**; dirty primary worktree untouched; no unrelated worktree cleanup. Capability 2 remains `Open — partially implemented; not closed`. See the [`AUTH-07` report](../05-implementation/reports/AUTH-07-session-access-gating-2026-08-10.md).

---

## Entry 100 — `AUTH-06` Recovery Credential Proof (application code, TDD) + `AUTH-05` merge/closure programme-currency sync

- **Date:** 10 August 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — AUTH-06 Implementation" (the fresh implementation authorization for the **sixth** Authentication package under `AUTH-BP`; AUTH-07+ not authorized).
- **Programme-currency sync (Phase A2):** on entry, Master Workflow §17 and CDR-001 §5 still described **AUTH-05 as "pending review/merge" / "AUTH-06+ not started"**; PR #92 had in fact **merged** (`6c18ca6…`, 2026-08-10T07:40:27Z, post-merge CI green run 31366820398). Corrected with **dated superseding notes** (Master Workflow §17 "AUTH-05 merge/closure sync" bullet; CDR-001 §5 `[UPDATED 2026-08-10 — AUTH-05 merged]`), historical text preserved; no code/capability/numbering change; no competing source of truth.
- **Summary (AUTH-06, AUTH-BP §8/§12):** the authentication-layer **recovery credential proof** — verify a recovery provider credential (AUTH-02 `TokenVerifierPort`), **resolve it to its OWNING identity** via the AUTH-02 `-09` resolver (recovery target **derived from the proof**, never client-supplied — a foreign/unlinked credential fails closed `RESOURCE_NOT_FOUND`), construct an `accepted` `RecoveryProof` (`phone_otp`→`phone_otp`, `google_sign_in`→`linked_provider`; opaque CSPRNG `proofReference`; `authority: "customer_initiated"`), and hand it to the merged `-07` `recoverCustomerIdentityByReference` — which transitions status via `-06`, rejects proof reuse, and emits `IdentityRecovered`. Backend-only under `functions/src/domains/authentication/services/*` (`identityRecoveryService.ts`, `identityRecoveryEndpointService.ts`) plus one additive `recoverAuthenticatedIdentity` `onCall` in `index.ts`.
- **Boundaries:** **no active-state gate** (recovery is *for* non-active identities; `-06` owns eligibility, `suspended`/`locked` only); **emits no domain events** (`IdentityRecovered` is `-06`/`-07`'s; `AuthenticationRecoveryProofProvided` and `CustomerAuthenticated` stay AUTH-08); idempotency **consumed** from `-07` (namespaced key + credential-bound request hash; same-key retry recovers exactly once); no credential material persisted/logged/returned (opaque proof reference; secret scan clean); closed 14-category taxonomy (no new category); no `-06`/`-07`/`-08`/`-09`/AUTH-01–AUTH-05 change; the out-of-band recovery lookup surface (§8 step 1) and post-recovery provider relink (per the `-07` report) are explicitly out of scope.
- **Evidence (RED→GREEN):** unit `identityRecoveryService.test.ts` 7/7 + `identityRecoveryEndpointService.test.ts` 2/2; real-emulator `identityRecoveryService.emulator.test.ts` 6/6 (recover a suspended identity by proving its phone provider; `google_sign_in`→`linked_provider`; **target derived from proof** — proving B recovers B, co-suspended A untouched; resolves-to-no-identity → `RESOURCE_NOT_FOUND`, no state change; same-key retry → single `IdentityRecovered`; **active** identity refused by `-06`). functions **522/522** (+9), web **300/300**, `pnpm emulators:validate` **211/211** (+6, no inherited flake recurred); typecheck/lint/format/build clean; secret scan clean. CI is the authoritative emulator gate.
- **Dependencies / configuration / migrations:** none.
- **Status:** `AUTH-06` implemented, **pending Founder-authorized review/merge** (not self-merged); **AUTH-07+ not started**; dirty primary worktree untouched; no unrelated worktree cleanup. Capability 2 remains `Open — partially implemented; not closed`. See the [`AUTH-06` report](../05-implementation/reports/AUTH-06-recovery-credential-proof-2026-08-10.md).

---

## Entry 099 — `AUTH-05` Account Linking — resumed after AUTH-CORR-002 (application code, TDD)

- **Date:** 9 August 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — AUTH-05 Resume After AUTH-CORR-002" (resumption authorization for AUTH-05 only; AUTH-06+ not authorized).
- **Summary:** With the Founder Model-T tuple correction merged (Entry 098 / PR #94 / `386fd8a`), the previously-blocked AUTH-05 (PR #92) is resumed and reconstructed on current `main`.
  - **F2 disposition — two parts.** (a) **Keying** resolved by AUTH-CORR-002 (embedded projection/dedupe/unlink/last-reference/events are provider-qualified `(referenceType, referenceId)`); AUTH-05's orchestration already threaded `referenceType`, so no keying change was needed. (b) **Cross-account-attach hardening** — on the resumption review-gate the automated reviewer re-raised "reject links between different Firebase UIDs"; escalated to the Founder, who **directed adding a defensive same-Firebase-principal gate**: before `-08`, `linkAuthenticationProvider` verifies `newCredential.referenceId === actingCredential.referenceId` (both server-verified authUids), failing closed via a new `AUTH_FORBIDDEN` constructor (existing category — no new category). Defense-in-depth, additional to `-08`'s untouched cross-identity ownership control.
  - **F1 correction — access-state gate.** Before any link/unlink, the acting identity is loaded via the merged `getCustomerIdentityById` and gated on `identity.status`, reusing AUTH-03's returning-user gate verbatim and its existing closed-taxonomy errors (`active`→proceed; `suspended`→`ACCOUNT_SUSPENDED`; else→`AUTH_FORBIDDEN`, fail closed). No new state taxonomy, no new error category; a `getIdentityById` seam added to `AccountLinkingDeps`.
- **Evidence:** unit `accountLinkingService.test.ts` 17/17 (+5 F1, +2 F2 same-principal gate; RED→GREEN); real-emulator `accountLinkingService.emulator.test.ts` 11/11 (+5: same-UID multi-provider + dual `-09` resolution; same-UID unlink without last-reference trip; F2 gate refuses a different-uid provider before `-08`; `-08` independently still rejects a reference owned by another identity; F1 suspended link/unlink rejection). functions **513/513**, web **300/300**; typecheck/lint/format/build clean. AUTH-05 emulator 11/11 in isolation; CI is the authoritative emulator gate (local full-suite emulator failures are environmental/inherited flakes that pass in isolation and on CI).
- **Boundaries preserved:** no AUTH-02 `referenceId` derivation change; `-09` unchanged; `-08` global uniqueness unweakened; AUTH-03 idempotency/atomicity and AUTH-04 fixes intact; `CustomerAuthenticated` remains AUTH-08-owned; no credential material persisted; closed 14-category taxonomy; fail-closed behavior. `git diff origin/main` touches only the six AUTH-05 paths + reconciled programme/report docs.
- **Programme impact:** AUTH-05 reconstructed on `main` and pending Founder-authorized review/merge (PR #92); **not** self-merged; AUTH-06+ **not** started; the dirty primary worktree untouched. Capability 2 remains `Open — partially implemented; not closed`. See the [`AUTH-05` report §17](../05-implementation/reports/AUTH-05-account-linking-2026-08-09.md).

---

## Entry 098 — `AUTH-CORR-002` Provider-Qualified Authentication-Reference Keying (Model T) (application code, TDD) + `AUTH-BP` §3 amendment

- **Date:** 9 August 2026
- **Performed by:** Claude (AI agent), per Founder decision "TASK — AUTH-CORR-002 Authentication Reference Keying Alignment" and the Founder's Model-T disposition.
- **Founder decision recorded:** authentication references are **provider-qualified** — the canonical identity is the tuple `(referenceType, referenceId)`; the bare Firebase UID is not by itself the reference identity; `referenceId` remains the verified authUid; the Firebase principal and a reference are distinct concepts but the reference may use the verified UID as its subject when qualified by type. **Reason:** a bare Firebase UID cannot coherently represent multiple linked authentication methods (surfaced by the AUTH-05 final PR-review gate). External provider subjects / phone-number subjects / keyed HMACs / peppers / migration machinery are explicitly **not** authorized.
- **Nature:** a bounded foundational correction. Governing amendment: **`AUTH-BP` §3** (adds the provider-qualified tuple statement; original wording preserved).
- **Code changed:** `functions/src/domains/identity/models/customerIdentity.ts` (tuple dedupe; `unlinkAuthenticationReference` takes `{ referenceType, referenceId }`; new `AuthenticationReferenceKey`); `functions/src/domains/identity/events/identityEvents.ts` (**additive** `referenceType` on the unlinked event); `functions/src/domains/identity/repositories/authenticationReferenceRepository.ts` (`-08` `alreadyEmbedded`/unlink tuple); tests (`customerIdentity.test.ts` +5; new `authenticationReferenceKeying.emulator.test.ts`).
- **Impact:** AUTH-02 **none** (referenceId stays uid); `-09` **none** (already `{type}:{id}`); `-08` embedded-projection keying aligned; AUTH-03 **none** (idempotency unchanged; regression green); AUTH-04 **none**; **AUTH-05 unblocked** (not implemented here). **No migration.**
- **Validation:** RED→GREEN; functions **496/496**, `emulators:validate` **17 files / 194 green**, web **300/300**, e2e **1/1**; typecheck/lint/format/build clean; secret scan clean.
- **Records updated:** `AUTH-BP` §3; this log (Entry 098); [`IMPLEMENTATION_CHANGES.md`](../changes/IMPLEMENTATION_CHANGES.md); report [`AUTH-CORR-002`](../05-implementation/reports/AUTH-CORR-002-authentication-reference-keying-2026-08-09.md).
- **Status:** `AUTH-CORR-002` implemented, **pending Founder-authorized review/merge** (not self-merged). **AUTH-05 remains BLOCKED** until this correction is merged and verified; AUTH-06+ not started. Capability 2 remains `Open — partially implemented; not closed`.

---

## Entry 097 — `AUTH-04` Frontend Sign-in Flows (Phone OTP + Google) (application code, TDD) + programme-currency sync

- **Date:** 9 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — AUTH-04 Implementation" (the fresh Founder implementation authorization for AUTH-04, given in this task and recorded here per the AUTH-01/AUTH-02/AUTH-03 convention).
- **Nature:** The **fourth** Authentication implementation package under `AUTH-BP` (§12/§15) — **frontend sign-in flows** (Phone OTP + Google), disabled-by-default. Frontend-only; consumes the merged AUTH-03 `authenticate` callable and the merged `infrastructure/firebase/*` composition root; does not redesign them.
- **Programme-currency sync first (Phase A2):** verified from the repository that `AUTH-03`/PR #90 is now **merged** — `origin/main` = `98896492075846b7df87b2d0e12fd5139aa1ced5` (merge parents `08aa1bc` + the corrected head `f805edb`, so the corrected idempotency/atomicity implementation supersedes the original `9c18cea` on `main`), merged 2026-08-09T09:53:47Z, post-merge CI green (run 31307008689). The stale "AUTH-03 not yet merged" wording in [Master Workflow §17](../05-implementation/11thonus-master-workflow.md) and [`CDR-001` §5](../05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity) was reconciled with dated superseding notes (history preserved; no code/capability/numbering change; no competing source of truth).
- **Files created (all under `apps/web/src/`):** `authentication/{idempotencyKey,providerConfig,authenticateClient,authenticateCallable,phoneSignInFlow,googleSignInFlow,createSignInActions}.ts`, `authentication/SignInPanel.tsx` (+ a colocated `*.test.ts(x)` for each), and `infrastructure/firebase/functions.ts` (+`.test.ts`). **Files modified:** `infrastructure/firebase/index.ts` (+`.test.ts`) — additive wiring of the Functions client into `FirebasePlatform`. **No `functions/` change** (that tree is byte-identical to `origin/main`).
- **Scope (per AUTH-BP §3/§5/§6/§12/§15):** a closed, **disabled-by-default** provider registry (only an exact-"true" flag enables a provider; fail-closed otherwise); the Phone OTP flow (reCAPTCHA/App-Check verifier supplied by the page, `signInWithPhoneNumber` → confirm) and the Google popup flow, both bridging the *verified* Firebase user to the AUTH-03 orchestration; a **backend-safe idempotency key** (`^[A-Za-z0-9._:-]+$`, ≤200, not `.`/`..`) generated once per attempt and **reused across a bounded transient retry** so the corrected AUTH-03 request-level replay gate returns the original outcome; enumeration-resistant callable-error mapping (no server message echoed); a `SignInPanel` component that renders only enabled providers and never re-renders credential material (OTP is a cleared password field). **Out of scope:** session management (AUTH-07), account linking (AUTH-05), recovery (AUTH-06), and `CustomerAuthenticated` ITM/audit emission (**AUTH-08** — AUTH-04 emits no domain events).
- **Security/privacy (TRD10 §10.6.1):** no raw token/OTP stored, logged, or returned; the component imports no `firebase/*` transport (network-safety harness in tests); no real DSN/keys committed (secret scan clean); deny-by-default Rules unaffected (no new client write path — the frontend calls the existing server callable).
- **Tests:** 41 new web tests (web suite 259→**300**; 39 at v1.0 + 2 v1.1 review-correction regression tests). `tsc`/`eslint .`/`prettier --check .`/`pnpm build` clean. Functions unit **491/491** unchanged; `pnpm emulators:validate` 189/190 — the one failure is the inherited `ENG-P1-002-CR1` command-dispatcher / identity-lifecycle concurrency flake in the byte-identical `functions/` tree (verified unrelated: `git diff origin/main -- functions/` is empty). CI (PR #91) green on re-run (the first run's sole failure was the inherited `ENG-P1-002-CR1` outbox concurrency timeout flake).
- **Post-review correction (v1.1):** the automated PR reviewer (Codex) raised **two valid findings** on head `91548ef`, both in AUTH-04 code — **P1** `SignInPanel` did not invalidate a pending phone confirmation when the number was edited (wrong-identity risk); **P2** `authenticateClient` mapped `deadline-exceeded` to non-retryable `failed`, so an ambiguous timeout would not replay with the same key. Both fixed in place (TDD): the number-edit now clears the confirmation; `deadline-exceeded`→`timeout` and `{unavailable,timeout}` are retryable. No scope expansion; no `functions/` or completed-responsibility change. See [`AUTH-04` report §16](../05-implementation/reports/AUTH-04-frontend-sign-in-flows-2026-08-09.md).
- **Migrations / dependencies / configuration:** none (`firebase`/`react`/`react-router-dom` already present; new provider flags `VITE_AUTH_ENABLE_PHONE_OTP` / `VITE_AUTH_ENABLE_GOOGLE_SIGN_IN` are read-only, disabled-by-default, no value committed).
- **Records updated:** [`CDR-001` §5](../05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity) (AUTH-03 merged + AUTH-04 implemented-pending-merge; next = `AUTH-05`); [Master Delivery Workflow §17](../05-implementation/11thonus-master-workflow.md) (AUTH-03 merge sync + AUTH-04 bullet); this log (Entry 097); [`IMPLEMENTATION_CHANGES.md`](../changes/IMPLEMENTATION_CHANGES.md); report [`AUTH-04`](../05-implementation/reports/AUTH-04-frontend-sign-in-flows-2026-08-09.md).
- **Status:** `AUTH-04` implemented, **pending Founder-authorized review/merge** (not self-merged; AUTH-05+ not started). Capability 2 remains `Open — partially implemented; not closed`; Customer Identity `Complete`; ITM/`ENG-P2-004` unchanged.

---

## Entry 096 — `AUTH-03` (v1.1) Registration/Sign-in Idempotency & Atomicity Correction (post-review, TDD)

- **Date:** 9 August 2026
- **Performed by:** Claude (AI agent), per Founder decision: "HOLD AUTH-03 MERGE AND CORRECT BEFORE MERGE" (in-place correction of the still-open PR #90; not AUTH-04).
- **Nature:** Correction of **four valid defects** raised by the repository's automated PR reviewer (Codex) on the reviewed head `9c18cea`, in the AUTH-03 registration idempotency/atomicity path — **2 P1, 2 P2**. These materially contradicted the v1.0 AUTH-03 report's idempotency claim (recorded, not erased). Kept on the AUTH-03 branch/PR #90; head moves off `9c18cea`, requiring fresh Founder review.
- **Findings:** (P1-1) concurrent same-credential/different-key registration left an orphan active identity; (P1-2) registration not resumable after create-succeeds/link-fails (regenerated id → `RESOURCE_NOT_FOUND`); (P2-3) same-key retry of a completed registration returned `signed_in` not `registered`; (P2-4) a path-bearing idempotency key reached Firestore as an internal error.
- **Correction (shared idempotency facility only; no new subsystem; no `-01`/`-08`/`-09`/idempotency/AUTH-01/AUTH-02 change):** credential-keyed `-01`/`-08` registration (concurrency serialises, loser fails closed before any write — no orphan; id recovered from the durable create record on resume); client-key request gate replaying the stored `responseSnapshot` (original `registered` outcome; credential-bound `requestHash`); `assertSafeIdempotencyKey` rejecting non-single-segment keys with `VALIDATION_FAILED` before Firestore.
- **Validation:** `tsc`/`eslint .`/`prettier --check .`/`pnpm build` clean; functions unit **491/491**; `pnpm emulators:validate` **190/190** (incl. 8 AUTH-03 emulator tests, RED→GREEN for all four findings against pre-fix `9c18cea`); web **259/259** (pre-existing `ENG-P1-002-CR1` phone-auth-harness latency flake did not trigger; untouched).
- **Records updated:** [`AUTH-03` report](../05-implementation/reports/AUTH-03-registration-signin-orchestration-2026-08-08.md) (v1.1 §6/§8/§9/§20); [`IMPLEMENTATION_CHANGES.md`](../changes/IMPLEMENTATION_CHANGES.md) (2026-08-09 correction entry); [Master Delivery Workflow](../05-implementation/11thonus-master-workflow.md) §17; [`CDR-001` §5](../05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity); this log (Entry 096).
- **Status:** `AUTH-03` **corrected, pending fresh Founder-authorized review/merge** (PR #90; not self-merged; AUTH-04+ not started). Capability 2 remains `Open — partially implemented; not closed`.

---

## Entry 095 — `AUTH-03` Registration / Sign-in Orchestration (application code, TDD)

- **Date:** 8 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — Merge AUTH-CORR-001 and Proceed to AUTH-03" (the fresh Founder implementation authorization for AUTH-03, confirmed in-session and recorded here per the AUTH-01/AUTH-02 convention).
- **Nature:** The **third** Authentication implementation package under `AUTH-BP` — backend **registration / sign-in orchestration**. Composes already-merged responsibilities only: new-vs-returning via `-09` resolution (AUTH-02); new customer via `-01` `createCustomerIdentity`; initial reference established via the AUTH-CORR-001 `-08` path; returning-user sign-in gated on access state; session issued via the existing AUTH-01 `createSessionContext`. Exposed through one `functions/src/index.ts` `authenticate` callable (verify via AUTH-02, then orchestrate). **No** `-01`/`-08`/`-09`/AUTH-01/AUTH-02 change; **no new error category**; no capability renumbering; frontend (AUTH-04)/linking (AUTH-05)/recovery (AUTH-06)/session-management (AUTH-07)/`CustomerAuthenticated` emission (AUTH-08) out of scope.
- **Event boundary (examined, resolved):** AUTH-BP §5/§6 wording ("emit `CustomerAuthenticated`") was reconciled against §12, which assigns that fire-and-forget trust/audit emission to **AUTH-08**, and the AUTH-01 `authenticationEvents.ts` boundary. Resolved by following §12/AUTH-01: AUTH-03 does **not** emit `CustomerAuthenticated`; it lets `-01`/`-08` emit their own `CustomerIdentityRegistered`/`AuthenticationReferenceLinked` state-change events and issues the session. No governing document modified.
- **Correctness fix (TDD-surfaced):** the outbox is keyed by `eventId`; the registration path's two events derive **distinct** ids (`:identity.create`/`:identity.link`) so the link event no longer overwrites `CustomerIdentityRegistered` (replay-safe).
- **Validation:** `tsc`/`eslint .`/`prettier --check .` clean; functions unit **485/485** (+8); `pnpm build` clean; full `pnpm emulators:validate` **187/187** (incl. 5 new AUTH-03 emulator tests). Web **258/259** — the one failure is the pre-existing `ENG-P1-002-CR1`/`EXT-TECH-001` phone-auth-harness delivery-latency timing flake (unrelated; no `apps/` file changed; passes 39/39 in isolation), left untouched per task constraints.
- **Records updated:** [`CDR-001` §5](../05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity) (AUTH-03 implemented-pending-merge note; AUTH-04 next); [Master Delivery Workflow](../05-implementation/11thonus-master-workflow.md) §17 (next = `AUTH-04`); this log (Entry 095); [`IMPLEMENTATION_CHANGES.md`](../changes/IMPLEMENTATION_CHANGES.md); report [`AUTH-03`](../05-implementation/reports/AUTH-03-registration-signin-orchestration-2026-08-08.md).
- **Status:** `AUTH-03` implemented, **pending Founder-authorized review/merge** (not self-merged; AUTH-04+ not started). Capability 2 remains `Open — partially implemented; not closed`; Customer Identity `Complete`; ITM/`ENG-P2-004` unchanged.

---

## Entry 094 — `AUTH-CORR-001` Initial Authentication-Reference Linking Reconciliation (application code, TDD)

- **Date:** 8 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — AUTH-CORR-001 — Initial Authentication Reference Linking Reconciliation."
- **Nature:** A **bounded interface/integration correction discovered through AUTH-02** (its §12 finding). Reconciles the `-01 → -08 → -09` initial authentication-reference lifecycle so AUTH-03 can create an identity through `-01`, establish the authoritative reference through `-08`, then resolve it through `-09`. **Not** AUTH-03; no registration/sign-in orchestration; **no `-01` responsibility change**; no AUTH-02 change; **no new error category**; no capability renumbering.
- **Root cause:** `-01` `registerCustomerIdentity` embeds the initial reference but never writes the authoritative `authenticationReferences/{type}:{id}` document; the `-08` link path's domain duplicate guard (`customerIdentity.ts:218`) then rejected completing that embedded-only reference as a within-identity duplicate — even though the authoritative uniqueness document (`-09`'s guard) was absent. Implementation mismatch, not an intended invariant.
- **Correction:** one branch added inside the existing `linkAuthenticationReferenceForIdentity` transaction (`authenticationReferenceRepository.ts`) — when the authoritative document is **absent** *and* the reference is already **embedded in this identity**, materialise the authoritative document + emit `AuthenticationReferenceLinked`, leaving the embedded projection untouched. All other cases unchanged (cross-identity → conflict/fail-closed; not-embedded → existing new-provider path; authoritative present & same identity → existing duplicate rejection). The one existing test that encoded the §12 defect was re-targeted to prove the *genuine* duplicate (re-linking an already-authoritative reference).
- **Uniqueness/idempotency/concurrency:** global uniqueness preserved (authoritative `set` only when absent; cross-identity conflict retained; transaction serialises concurrent materialisations — first wins); existing idempotency-key gate unchanged; all emulator-verified.
- **Validation:** `tsc`/`eslint .`/`prettier --check .` clean; functions unit **477/477**; web **259/259**; `pnpm build` clean; AUTH-CORR-001 lifecycle emulator test **7/7**; `-08` link/unlink suite green; full `pnpm emulators:validate` **181 passed, 1 failed** (the failure is the pre-existing ENG-P1-002-CR1 outbox concurrent-worker timing test, unrelated).
- **Records updated:** [`CDR-001` §5](../05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity) (AUTH-02 §12 reconciled; AUTH-03 unblocked); [Master Delivery Workflow](../05-implementation/11thonus-master-workflow.md) §17 (next = `AUTH-03`); this log (Entry 094); [`IMPLEMENTATION_CHANGES.md`](../changes/IMPLEMENTATION_CHANGES.md); report [`AUTH-CORR-001`](../05-implementation/reports/AUTH-CORR-001-initial-authentication-reference-linking-2026-08-08.md).
- **Status:** `AUTH-CORR-001` implemented, **pending Founder-authorized review/merge**. AUTH-02 §12 resolved on merge; **AUTH-03 unblocked but unauthorised**. Capability 2 remains `Open — partially implemented; not closed`; Customer Identity `Complete`; ITM/`ENG-P2-004` unchanged.

---

## Entry 093 — `AUTH-02` Token Verification & Identity Resolution (application code, TDD)

- **Date:** 8 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — AUTH-02 — Token Verification & Identity Resolution."
- **Nature:** Second Authentication implementation package (AUTH-BP §3/§4/§12) — **the Firebase-Admin ID-token verification adapter + credential→identity resolution service only; no registration/sign-in orchestration (AUTH-03), UI, account linking, recovery, session gating, ITM, staff auth, duplicate merging, or new providers.**
- **Implemented (test-first):** `functions/src/domains/authentication/services/firebaseTokenVerifier.ts` (`TokenVerifierPort` adapter — `getAuth(getAdminApp()).verifyIdToken(token, true)` → provider-neutral `AuthenticatedCredential` with `referenceId` = Firebase authUid per AUTH-BP §3; closed 14-category error mapping) and `credentialResolutionService.ts` (`resolveAuthenticatedCredential` — consumes the merged `-09` `lookupCustomerIdentityByAuthenticationReference` with `purpose: "authentication"`; found → `resolvedAuthResult`, `RESOURCE_NOT_FOUND` → `unregisteredAuthResult`, else propagate). 20 new unit tests (functions suite 447→**467**) + a real-Firestore-emulator test (3 tests). ESLint boundary extended: `ignores: ["functions/src/domains/authentication/services/**"]` (the one Firebase-permitted sub-layer; pure `models/`+`ports/` stay machine-enforced Firebase-free).
- **Architecture/Security:** Authentication → Customer Identity/shared/infrastructure (reverse never occurs — verified); no raw token persisted/logged/returned; the credential carries only a non-sensitive `signInProvider` signal (TRD10 §10.6.1); reCAPTCHA/App Check unchanged; **no new error category**; Customer Identity **consumed, not modified**.
- **Cross-package finding (reported, not fixed here):** the merged `-01` `createCustomerIdentity` writes an identity's **initial** authentication reference only into the `users/{id}` embedded projection, **not** into the authoritative `authenticationReferences/{type}:{id}` collection that `-09` resolves against — and `-08` refuses to retro-link it (duplicate). So an initial reference is not resolvable on return; **AUTH-03 registration must write it via `-08` (or a separately-authorized `-01` change) — a Founder decision for AUTH-03.** AUTH-02's resolver is correct for the resolution contract (see the [`AUTH-02` report §12](../05-implementation/reports/AUTH-02-token-verification-and-identity-resolution-2026-08-08.md)).
- **Pre-merge correction (v1.1, Founder-directed — both automated-review findings accepted):** **P1 (security)** — the verifier no longer trusts `RawProviderCredential.referenceType`; the reference type is derived/validated against the **verified** `sign_in_provider` (closed MVP mapping `phone`→`phone_otp`, `google.com`→`google_sign_in`); unsupported/mismatched provenance fails closed via the existing `AUTH_FORBIDDEN` factory (no new category). **P2** — Firebase Admin `app/network-error`/`app/network-timeout` → `TEMPORARY_UNAVAILABLE`; unknown errors keep fail-closed `INTEGRATION_FAILED`. Confined to `firebaseTokenVerifier.ts` (+test); **§12 not addressed** (stays the separately-governed pre-AUTH-03 reconciliation).
- **Validation:** `tsc`, `eslint .` (incl. extended boundary), `prettier --check .`, `vitest` (functions **477/477**; 30 AUTH-02 unit tests incl. 10 v1.1 provenance/transport regression tests), `pnpm build` — all clean; the AUTH-02 emulator test passes 3/3 (the 4 failures in the full `emulators:validate` run are pre-existing identity concurrency/timing flakiness, none in `authentication/`); `grep firebase` in `authentication/{models,ports}` → none.
- **Records updated:** [`CDR-001` §5](../05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity) (AUTH-02 implemented-pending-merge note); [Master Delivery Workflow](../05-implementation/11thonus-master-workflow.md) §17 (next = `AUTH-03`); this log (Entry 093); [`IMPLEMENTATION_CHANGES.md`](../changes/IMPLEMENTATION_CHANGES.md); report [`AUTH-02`](../05-implementation/reports/AUTH-02-token-verification-and-identity-resolution-2026-08-08.md).
- **Status:** `AUTH-02` implemented, **pending Founder-authorized review/merge**; `AUTH-03`–`AUTH-09` unimplemented (each needs its own authorization). Capability 2 remains `Open — partially implemented; not closed`; Customer Identity `Complete`; ITM/`ENG-P2-004` unchanged.

---

## Entry 092 — `AUTH-01` Authentication Domain Contracts (application code, TDD)

- **Date:** 8 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — AUTH-01 — Authentication Domain Contracts."
- **Nature:** First Authentication implementation package (AUTH-BP §12) — **domain interfaces and behaviour only; no orchestration, provider logic, Firebase Auth, UI, session management, account linking, or recovery.**
- **Implemented (test-first):** `functions/src/domains/authentication/models/` (`authenticatedCredential.ts`, `authResult.ts`, `sessionContext.ts`, `authenticationEvents.ts`, `authenticationErrors.ts`) + `ports/tokenVerifierPort.ts`, each with a colocated `*.test.ts` (20 new unit tests; functions suite 427→**447**). Added a machine-enforced no-Firebase ESLint boundary for `functions/src/domains/authentication/**` (`eslint.config.js`), mirroring the identity/loyaltyNumber/qrIdentity precedents (AUTH-BP §15).
- **Architecture:** Authentication provides access, never owns/duplicates identity; **reuses** the merged `AuthenticationReferenceType` (provider neutrality); dependency direction Authentication → Identity/shared (identity/shared import no authentication — verified); **14-category error taxonomy reused, no new category**; no credential material representable (reference-only, TRD10 §10.6.1).
- **Validation:** `tsc`, `eslint .` (incl. new boundary), `prettier --check .`, `vitest` (447/447), `pnpm build` — all clean; `grep firebase` in the authentication domain → none.
- **Records updated:** [`CDR-001` §5](../05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity) (AUTH-01 implemented-pending-merge note); [Master Delivery Workflow](../05-implementation/11thonus-master-workflow.md) §17 (next = `AUTH-02`); this log (Entry 092); [`IMPLEMENTATION_CHANGES.md`](../changes/IMPLEMENTATION_CHANGES.md); report [`AUTH-01`](../05-implementation/reports/AUTH-01-authentication-domain-contracts-2026-08-08.md).
- **Status:** `AUTH-01` implemented, **pending Founder-authorized review/merge**; `AUTH-02`–`AUTH-09` unimplemented (each needs its own authorization). Capability 2 remains `Open — partially implemented; not closed`; Customer Identity `Complete`; ITM/`ENG-P2-004` unchanged.

---

## Entry 091 — `AUTH-BP` Authentication Blueprint (planning only)

- **Date:** 8 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — AUTH-BP — Authentication Blueprint."
- **Nature:** Architecture & implementation-planning only — **no implementation, no runtime-code change, no capability numbering change.** References the merged `ENG-P2-ARCH-001` §7 architecture; does not redesign it.
- **Deliverable:** [`AUTH-BP` Authentication Blueprint](../05-implementation/roadmap/AUTH-BP-authentication-blueprint-2026-08-08.md) — the authoritative engineering contract for `AUTH-01`–`AUTH-09`. 16 sections: overall architecture; lifecycle; provider architecture; identity-resolution, registration, sign-in, account-linking, recovery flows; session lifecycle; event flow; error handling (14-category taxonomy reused, no new category); package decomposition (AUTH-01–09); testing strategy; validation strategy; per-package exit criteria; risks & sequencing.
- **Grounding (merged, referenced not redesigned):** `ENG-P2-ARCH-001` §7 (Authentication provides access, does not own identity); merged Customer Identity interfaces (`-01` `createCustomerIdentity`, `-08` link/unlink + uniqueness, `-09` lookup, `-07` recovery, `authenticationReference` model); `ENG-P1-002` shared foundation (`shared/*`), `infrastructure/firebase/admin.ts`; frontend `apps/web/src/infrastructure/firebase/*` + `dev/phoneAuthHarness` reference; `DEC-AUTH-001` (MVP Phone OTP + Google; duplicate-merge separate; SMS production-launch/emulator build; staff separate); TRD10 §10.6.1 (no credential material in Firestore); TRD12 §12.4–12.6.
- **Records updated:** blueprint created; [`CDR-001` §5](../05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity) (AUTH-BP contract pointer); [Master Delivery Workflow](../05-implementation/11thonus-master-workflow.md) §17 (next = `AUTH-01`); this log (Entry 091); [`IMPLEMENTATION_CHANGES.md`](../changes/IMPLEMENTATION_CHANGES.md).
- **Status (unchanged):** Authentication `Not started — Foundations approved`; Capability 2 `Open — partially implemented; not closed`; Customer Identity `Complete`; ITM/`ENG-P2-004`/RTM F11 unchanged.
- **Next governed action:** `AUTH-01` (Authentication domain & contracts) under the blueprint — not begun; awaits fresh Founder authorization.

---

## Entry 090 — `AUTH-P0-001` Authentication Foundation Decisions (`DEC-AUTH-001`)

- **Date:** 7 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — AUTH-P0-001 — Authentication Foundation Decisions."
- **Nature:** Records Founder-approved decisions only — **no engineering, no runtime-code change, no capability numbering change.**
- **Decision recorded:** [`DEC-AUTH-001`](decisions/decision-register.md) (CONFIRMED) — new `AUTHENTICATION (DEC-AUTH)` category. Five decisions:
  - **D-A1 — Authentication Package Series:** official **`AUTH-*`** series (`AUTH-P0-001` foundation; `AUTH-BP` blueprint; `AUTH-01`–`AUTH-09` implementation, per `CAP-P2-009`), **distinct from `ENG-P2-002/003/004`** (Business/Staff/role — unchanged, not renumbered).
  - **D-A2 — MVP Providers:** Phone OTP + Google Sign-In **Included**; Email/Password, Apple, Passkeys **Deferred**; future additive.
  - **D-A3 — Duplicate Identity Merge Authority:** separate governed capability; Authentication **never** auto-merges Customer Identity aggregates — may identify and refer only.
  - **D-A4 — SMS Production Dependency:** `EXT-TECH-001` is a production-launch concern; build proceeds on the Firebase Auth Emulator; production activation stays governed by the existing dependency.
  - **D-A5 — Staff Authentication Boundary:** customer Authentication independent from staff (`DEC-SEC-003`, separately governed); no staff scope in this stream.
- **Records updated:** [Decision Register](decisions/decision-register.md) (`DEC-AUTH-001` + §5 summary CONFIRMED 43→44, Total 104→105 + header); [`CDR-001` §5/§2](../05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity) (Authentication concern → `Not started — Foundations approved`); [Engineering Implementation Programme](../05-implementation/change-tracking/engineering-implementation-programme.md); [Master Delivery Workflow](../05-implementation/11thonus-master-workflow.md) §17; this log (Entry 090); [`IMPLEMENTATION_CHANGES.md`](../changes/IMPLEMENTATION_CHANGES.md); report [`AUTH-P0-001`](../05-implementation/reports/AUTH-P0-001-authentication-foundation-decisions-2026-08-07.md).
- **Status:** Authentication concern **`Not started — Foundations approved`**; **each `AUTH-*` package requires its own fresh Founder implementation authorization**. Capability 2 remains `Open — partially implemented; not closed`; Customer Identity `Complete`; ITM/`ENG-P2-004`/RTM F11 unchanged.
- **Next governed action:** the first Authentication implementation package (`AUTH-BP` blueprint, then `AUTH-01`) under the approved architecture — not begun; awaits fresh Founder authorization.

---

## Entry 089 — `CAP-P2-009` Authentication Architecture & Delivery Planning (planning only)

- **Date:** 7 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — CAP-P2-009 — Authentication Architecture & Delivery Planning."
- **Nature:** Architecture & planning only — **no implementation, no runtime-code change, no new governance artefact, no status change.** Conforms to the existing merged architecture (`ENG-P2-ARCH-001` §7); does not redesign it.
- **Deliverable:** planning record [`CAP-P2-009`](../05-implementation/reports/CAP-P2-009-authentication-architecture-and-delivery-planning-2026-08-07.md) determining: (1) Authentication scope; (2) functional responsibilities; (3) architectural boundaries; (4) recommended package decomposition; (5) dependencies; (6) required engineering order; (7) required Founder decisions; (8) validation strategy; (9) risks.
- **Key findings:** the customer Authentication concern builds the credential-verification/session layer that resolves a proven credential to exactly one Customer Identity Aggregate via the already-merged `-08`/`-09`/`-07`/`-01` interfaces (Authentication provides access, does not own identity — `ENG-P2-ARCH-001` §7). Providers are equal (`DEC-IDENTITY-001`): Phone OTP + Google Sign-In are `DEC-PROV-004` initial-approved; email/Apple/passkeys additive. Firebase Auth holds credentials; Firestore holds only references (TRD10 §10.6.1). **Numbering gap flagged:** `ENG-P2-002/003/004` are reserved for Business/Staff/role — the Authentication stream has no reserved work-package number (Founder/programme decision D-A1). `EXT-TECH-001` (Burundi SMS) is a production-activation condition, not a build blocker; ITM not required.
- **Status (unchanged):** Authentication `Not started — Unauthorised`; Capability 2 `Open — partially implemented; not closed`; Customer Identity `Complete`; ITM/`ENG-P2-004`/RTM F11 unchanged.
- **Boundary:** no Authentication/ITM/`ENG-P2-004` implementation; no Customer Identity change; no capability numbering/boundary change; no runtime code modified. Stop for Founder review.

---

## Entry 088 — `CAP-P2-008` Customer Identity Concern Closure (administrative)

- **Date:** 7 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — CAP-P2-008 — Customer Identity Concern Closure."
- **Nature:** Administrative programme-closure only — **no code change, no engineering, no capability-boundary or numbering change.** Records the status transition the merged repository already substantiates.
- **Evidence (merged authoritative records):** `CAP-P2-007` (PR #82) merged `436794faf2b96b768eeb318367d85765161da9aa`; post-merge CI success (run 31198769553); Customer Profile persistence present (`toCustomerProfileFields`/`fromCustomerProfileFields`); `ENG-P2-001-02` Architecture/Technical Review present and **PASS**; all concern-completion criteria (DoD §2.1–2.7, 2.11, 2.12 + §2.6/G1 + persistence delivery; §2.8–2.10 N/A at concern level per G2) satisfied.
- **Status change (single source of truth = [`CDR-001` §5](../05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity)):** **Customer Identity concern → `Complete`.** Prior label (`Implemented — Validation/Closure Pending`) and the historical "Not Complete / criteria not yet defined" clause struck-through with supersession notes (audit trail preserved).
- **Unchanged (explicitly):** **Capability 2 remains `Open — partially implemented; not closed`** (Concern Completion ≠ Capability closure); **Authentication `Not started — Unauthorised`**; **ITM `Not started — Unauthorised`**; **`ENG-P2-004`** unchanged; **RTM Finding F11** remains accepted deferred.
- **Records updated:** `CDR-001` §5 concern-status + header; [Engineering Implementation Programme](../05-implementation/change-tracking/engineering-implementation-programme.md) `ENG-P2-001` Current Status note + header; [Master Delivery Workflow](../05-implementation/11thonus-master-workflow.md) §17 next-action; this log (Entry 088); [`IMPLEMENTATION_CHANGES.md`](../changes/IMPLEMENTATION_CHANGES.md); closure report [`CAP-P2-008`](../05-implementation/reports/CAP-P2-008-customer-identity-concern-closure-2026-08-07.md). No new governance artefact; no duplicate source of truth introduced.
- **Next governed action:** outside Customer Identity — a Founder-authorised choice among the remaining Capability 2 streams (Authentication, ITM, or `ENG-P2-004`). No engineering task begins without fresh Founder authorization.

---

## Entry 087 — `CAP-P2-007` Customer Identity Concern Completion (persistence wiring + `-02` review)

- **Date:** 7 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — CAP-P2-007 — Customer Identity Concern Completion."
- **Engineering (application code, TDD):** wired `ENG-P2-001-02`'s Customer Profile fields into `ENG-P2-001-05`'s `customerProfiles` persistence converter — added `toCustomerProfileFields`/`fromCustomerProfileFields` (+ `CustomerProfileFieldsDocument` type) to `functions/src/domains/identity/repositories/customerProfileDocument.ts`. The converter does only the Firestore `Date↔Timestamp` mapping for `consentVersions.acceptedAt` (same `toTimestampLike`/`fromTimestampLike` cast convention as `userDocument.ts`) and delegates **all** field validation to `-02`'s `serializeCustomerProfileFields`/`deserializeCustomerProfileFields`. No new repository, no transaction change, no schema redesign; profile fields optional (shell-document behaviour preserved); no `gender` ever emitted (`DEC-PROD-012` Option D). 7 new converter tests (RED→GREEN); functions suite 420 → **427/427**.
- **Review:** [`ENG-P2-001-02` Architecture/Technical Review](../05-implementation/reports/ENG-P2-001-02-architecture-technical-review-2026-08-07.md) recorded — **PASS, no open corrections**; provides DoD §2.6 coverage (`DEC-GOV-009`/G1). All six required determinations pass (architecture, persistence integration, privacy PR-005, TRD10 §10.6.2, `DEC-PROD-012`, error taxonomy = 14 unchanged).
- **Validation:** `tsc --noEmit`, `eslint .`, `prettier --check .`, `vitest run` (427/427), `pnpm build` (web+functions) — all clean. Working-tree scope limited to intended files.
- **Traceability:** [`CDR-001` §5](../05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity) concern-status/remaining-items notes updated (both items delivered in the `CAP-P2-007` PR, pending merge); [Engineering Implementation Programme](../05-implementation/change-tracking/engineering-implementation-programme.md) and [Master Delivery Workflow](../05-implementation/11thonus-master-workflow.md) §17 synced; [`IMPLEMENTATION_CHANGES.md`](../changes/IMPLEMENTATION_CHANGES.md) appended; implementation report [`CAP-P2-007`](../05-implementation/reports/CAP-P2-007-customer-identity-concern-completion-2026-08-07.md).
- **Status:** **Customer Identity `Implemented — Validation/Closure Pending`** (unchanged) — every concern-completion criterion is satisfied by the delivered work; §2.6/§2.7 finalize, and the concern may be declared `Complete`, only upon Founder merge of the `CAP-P2-007` PR + post-merge CI. **Capability 2 remains `Open — not closed`.** No Authentication/ITM/`ENG-P2-004`/deployment/Manual QA/RTM F11/Capability 2 closure work occurred. PR not merged (awaits fresh Founder authorization).

---

## Entry 086 — `CAP-P2-006` Concern Completion Policy Decision & Customer Identity Reassessment

- **Date:** 7 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — CAP-P2-006 — Concern Completion Policy Decision & Customer Identity Reassessment."
- **Founder decisions recorded (existing Decision Register mechanism):** **`DEC-GOV-009` (G1)** — the capability-level Architecture Review may satisfy DoD §2.6 (Technical Review) for constituent packages within its baseline; a package implemented after that baseline needs its own review coverage (`ENG-P2-001-02` therefore requires coverage). **`DEC-GOV-010` (G2)** — DoD §2.8–2.10 (deployment/Preview/Manual QA) are not concern-completion criteria for a domain-layer concern with no deployable customer-facing surface; they are Capability-Closure / Release-Production Readiness. Both clarify only — the Definition of Done is not weakened/redesigned.
- **Concern-completion lifecycle classification** added to [`CDR-001` §5](../05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity) and a bounded application note to the [Definition of Done](../06-engineering-governance/definition-of-done.md) §2 (no §2 criterion changed): Concern Completion / Capability Closure / Release-Production Readiness distinguished.
- **Customer Identity reassessment:** DoD 1–5, 7, 11, 12 satisfied; 6 satisfied for `-01`,`-03`–`-10` (Architecture Reviews per G1), **`-02` needs review coverage**; 8–10 Not Applicable at Concern Level (G2). **Persistence determination: required before concern completion, owner `ENG-P2-001-05`** (Identity Persistence owns `customerProfiles`; profile fields deferred at `-05` only because `-02` did not yet exist) — a bounded engineering task, not a Founder ownership decision. RTM F11 accepted deferred.
- **Customer Identity status:** **`Implemented — Validation/Closure Pending`** (unchanged). Two bounded remaining concern-completion items (`-02` review coverage; `-02`→`-05` profile-field persistence) — **no further Founder policy decision needed.**
- **Next governed action (now uniquely determined):** a bounded Customer-Identity concern-completion task covering the two items above, awaiting fresh Founder authorization.
- **Files modified:** `decision-register.md` (DEC-GOV-009/010 + header); `CDR-001-capability-delivery-roadmap.md` (§5 + header); `06-engineering-governance/definition-of-done.md` (§2 note + header); `11thonus-master-workflow.md` (§17); this entry. **Files created:** `CAP-P2-006-concern-completion-policy-and-customer-identity-reassessment-2026-08-07.md`. No code/persistence/review-execution/closure; no capability renumbered; no new register created.
- **Full detail:** [CAP-P2-006 Report](../05-implementation/reports/CAP-P2-006-concern-completion-policy-and-customer-identity-reassessment-2026-08-07.md).

---

## Entry 085 — `CAP-P2-005` Concern Completion Criteria Consolidation & Customer Identity Assessment

- **Date:** 7 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — CAP-P2-005 — Concern Completion Criteria Consolidation & Customer Identity Assessment."
- **Context:** a read-only consolidation of completion criteria already defined across authoritative records, and an evidence-based assessment of the Customer Identity concern against them. No new criteria invented; no policy created; no code; no closure.
- **Consolidated criteria:** the authoritative rule is the work-package [Definition of Done](../06-engineering-governance/definition-of-done.md) §2 (twelve criteria); a concern is complete when every constituent work package satisfies it plus the concern-level architecture review. Criteria classified across Concern Completion / Capability Closure / Release-Production Readiness (TRD19 §19.49/§19.52; TRD22 §22.45) / Accepted Deferred Work.
- **Customer Identity assessment:** DoD items 1–5, 7, 11, 12 **satisfied**; item 6 (Technical Review) **not satisfied** (no per-package Technical Review records; `-02` unreviewed); items 8–10 (deployment, Preview Review, Manual QA) **not satisfied** (not performed; depend on the unbuilt customer-facing surface). RTM F11 accepted deferred.
- **Gaps (genuine):** G1 — whether the capability-level Architecture Reviews satisfy DoD §2.6 for the `ENG-P2-001` packages (or per-package Technical Reviews are required; `-02` unreviewed); G2 — whether DoD §2.8–2.10 (deploy/Preview/Manual QA) bind Concern Completion for a domain-layer concern or are deferred to Capability Closure / Release Readiness.
- **Overall assessment:** **FOUNDER DECISION REQUIRED BEFORE CONCERN COMPLETION.** Customer Identity remains **`Implemented — Validation/Closure Pending`** (cannot be `Complete` on current evidence). Precise Founder decisions stated (§6 of the report).
- **Files modified:** this entry. **Files created:** `CAP-P2-005-concern-completion-criteria-and-customer-identity-assessment-2026-08-07.md`. No programme, decision, criteria, or code file changed; no concern/capability closed.
- **Full detail:** [CAP-P2-005 Report](../05-implementation/reports/CAP-P2-005-concern-completion-criteria-and-customer-identity-assessment-2026-08-07.md).

---

## Entry 084 — `CAP-P2-004` Concern-Level Completion Reporting (Founder Option C) + PR #77/#78 merges

- **Date:** 7 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — CAP-P2-004 — Adopt Concern-Level Completion Reporting."
- **Stages 1–2 (merges):** PR #77 (CAP-P2-002) merged (`9d9f6a5`, post-merge CI green) and PR #78 (CAP-P2-003) merged (`fd28c62`, post-merge CI green). PR #78 required a changes-log sync — resolved by keeping the header at Entry 083 and preserving both entries in newest-first order (083 → 082 → 081); both review reports preserved; no substantive conclusion rewritten.
- **Stage 3 — Founder Option C implemented (`DEC-GOV-008`, CONFIRMED):** concern-level completion reporting within the **unchanged** Capability 2 boundary. Capability numbering, boundaries, engineering identifiers, and product/technical architecture are unchanged. **Concern Completion ≠ Capability closure** — reporting granularity only. ITM remains an internal architectural concern.
- **Concern statuses recorded (authoritative in [`CDR-001` §5](../05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity)):** Customer Identity `Implemented — Validation/Closure Pending` (all ten `ENG-P2-001` packages merged; concern-completion criteria undefined, so not `Complete`); Authentication `Not started — Unauthorised`; ITM `Not started — Unauthorised` (internal); overall Capability 2 `Open — partially implemented; not closed`.
- **Files modified:** `decision-register.md` (DEC-GOV-008 + header); `CDR-001-capability-delivery-roadmap.md` (§5 Concern Status block + §2 row + header); `11thonus-master-workflow.md` (§17); `engineering-implementation-programme.md` (cross-reference); `CAP-P2-002`/`CAP-P2-003` reports (bounded disposition markers only); this entry. **Files created:** `CAP-P2-004-concern-level-completion-reporting-2026-08-07.md`. No code, capability identifier, roadmap structure, product/technical architecture, or FEF record changed; no review findings rewritten; no capability closed.
- **Full detail:** [CAP-P2-004 Report](../05-implementation/reports/CAP-P2-004-concern-level-completion-reporting-2026-08-07.md).

---

## Entry 083 — `CAP-P2-003` Capability 2 Boundary Review

- **Date:** 7 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — CAP-P2-003 — Capability Boundary Review."
- **Context:** a read-only programme-architecture review of whether the current Capability 2 boundary (Customer Identity + Authentication + ITM + `ENG-P2-004`, as one customer-facing capability) remains appropriate now that the Customer Identity concern has matured into a complete ten-package stream while Authentication/ITM remain unbuilt. Evidence + recommendations only — no product-architecture redesign, no restructuring, no renumbering, no code, no closure. (Sequence note: `CAP-P2-002`'s changes-log Entry 082 is on the still-open PR #77; the two entries reconcile when both merge.)
- **Conclusion:** **FOUNDER DECISION REQUIRED.** A full renumbering split (Option B: separate Customer Identity / Authentication / ITM capabilities) is **not evidence-supported** — ITM is internal-only (cannot be a customer capability), capabilities are defined by customer-observable sequencing, and `DEC-IDENTITY-001` already declined the split. The boundary as a customer-facing definition remains sound (Option A). The genuine open choice is whether to adopt an in-boundary concern-level closure/reporting refinement (Option C) to resolve the Customer-Identity-maturity asymmetry — a Founder programme-structure judgment. No Founder preference inferred.
- **Files modified:** this entry. **Files created:** `CAP-P2-003-capability-boundary-review-2026-08-07.md`. No programme document, capability identifier, roadmap, or code changed; no finding reopened; capability boundary unchanged.
- **Full detail:** [CAP-P2-003 Report](../05-implementation/reports/CAP-P2-003-capability-boundary-review-2026-08-07.md).

---

## Entry 082 — `CAP-P2-002` Capability 2 Validation & Closure Review

- **Date:** 7 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — CAP-P2-002 — Capability 2 Validation & Closure Review."
- **Context:** a read-only closure-readiness review of Capability 2 (Customer Identity) against its governed completion criteria, treating merged `main` as authoritative. Findings-only — no corrections, no code, no runtime change, **no closure performed**.
- **Overall assessment:** **NOT READY.** The Customer Identity concern (`ENG-P2-001`, all ten child packages `-01`–`-10`) is implementation-complete, tested, and CI-green — but Capability 2 as defined in `CDR-001` §5 is not closable.
- **Closure Blockers:** CB-1 Authentication concern (`CDR-001` §5.2) unauthorised/unimplemented; CB-2 ITM concern (§5.3) unauthorised/unimplemented; CB-3 `ENG-P2-004` (role context) not started; CB-4 deployment + Manual QA (ENG-P2-001 programme profile) not performed.
- **Closure Conditions:** CC-1 `-02` not covered by any architecture/Technical Review (`ENG-P2-ARCH-REVIEW-002` baseline `@ 3f9f0e6` predates it); CC-2 `-02` persistence wiring deferred (domain-only); CC-3 Master Workflow §17 / `CDR-001` §5 documentation currency (still describe `-02` as "pending authorization").
- **RTM Finding F11:** correctly deferred (Founder-approved); requires separate authorised work to fully discharge traceability; not the binding blocker.
- **Observation:** OBS-1 R2-03 dev-harness timing test (low, non-blocking).
- **Final gate:** Capability 2 does **not** satisfy its governed completion criteria; a separate Capability 2 Closure task should **not** yet be authorised; corrective/authorisation work (plus a Founder scope determination on whether closure means the Customer Identity concern only or the full three-concern capability) is required first.
- **Files modified:** this entry. **Files created:** `CAP-P2-002-capability-2-validation-and-closure-review-2026-08-07.md`. No code, architecture, or programme record changed; no finding reopened; `DEC-PROD-012`/`F9b` untouched.
- **Full detail:** [CAP-P2-002 Report](../05-implementation/reports/CAP-P2-002-capability-2-validation-and-closure-review-2026-08-07.md).

---

## Entry 081 — `ENG-P2-001-02` Customer Profile Implementation

- **Date:** 7 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — ENG-P2-001-02 — Customer Profile Implementation."
- **Context:** the final Customer Identity child package, implemented test-first. Application (functions) code only — three files under `functions/src/domains/identity/models/`. Documentation-governance updates recorded here.
- **Implementation:** `customerProfile.ts` — the mutable `customerProfiles` profile domain model (TRD10 §10.6.2): `firstName`/`lastName` mandatory; `dateOfBirth?`/`city?` optional; `interests`/`preferredCategories`/`communicationPreferences`/`consentVersions`; derived `profileCompletionPercent`. `createCustomerProfile`/`updateCustomerProfile` (required-field + write-time consent validation, Progressive-KYC optional-absence, immutable identity binding), `toPublicCustomerProfile` (PR-005 privacy projection), and domain↔document field mapping. Six additive Customer Profile error factories in `identityErrors.ts` (all reuse the closed 14-category taxonomy, TRD11 §11.35 — **no new category**). 20 new unit tests in `customerProfile.test.ts`.
- **Gender:** **not collected at MVP** per `DEC-PROD-012` (Option D). The contract has no `gender` field; create/update reject `gender`; serialization never emits it. Tests assert each.
- **Boundary (disclosed):** live Firestore write/read wiring for profile mutation is `-05`/future persistence surface (`ENG-P2-001-PLAN-001`'s own split); `-02` delivers the domain model + validation + operations + document mapping that surface consumes. No `-05` redesign, no parallel repository. RTM Finding F11 remains deferred (no RTM rows added — the out-of-scope F11 catch-up; consistent with sibling packages).
- **Validation:** 20/20 new tests; full `functions` unit suite **420/420** (was 400; regression clean); `tsc`/`build`/root `eslint`/root `prettier --check` clean; `git status` shows only the three code files. No gender; 14-category taxonomy unchanged; Authentication/ITM untouched; no Rules/index/config/dependency change.
- **Programme impact:** `ENG-P2-001-02` implemented, pending Founder-authorized review/merge. **All ten `ENG-P2-001` child packages (`-01`–`-10`) now implemented.** Capability 2 **not** marked complete — capability-level closure follows its own governed validation/closure process.
- **Files modified:** `engineering-implementation-programme.md`; `coding-agent-prompt-register.md`; `ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md`; `docs/changes/IMPLEMENTATION_CHANGES.md`; this entry. **Code created:** `functions/src/domains/identity/models/customerProfile.ts`, `customerProfile.test.ts`. **Code modified:** `functions/src/domains/identity/models/identityErrors.ts`. **Report created:** `ENG-P2-001-02-implementation-report-2026-08-07.md`.
- **Full detail:** [ENG-P2-001-02 Implementation Report](../05-implementation/reports/ENG-P2-001-02-implementation-report-2026-08-07.md).

---

## Entry 080 — `DEC-PROD-012` Implementation & `ENG-P2-001-02` Unblock (Founder Option D)

- **Date:** 7 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — DEC-PROD-012 Implementation & ENG-P2-001-02 Unblock."
- **Founder decision (authoritative, Option D):** For the MVP, customer gender shall not be collected. The `gender` attribute is removed from the MVP Customer Profile schema. The platform preserves the ability to introduce an optional gender attribute in a future governed release without breaking compatibility. No legal dependency is required for MVP implementation. `EXT-LEG-001` remains applicable only if a future governed release proposes collecting gender information. This decision **closes `DEC-PROD-012`**.
- **Context:** documentation-governance implementation only — no application code, schema code, API, or runtime change. Historical `/reports/` and `/evidence/` records were not edited (point-in-time; preserved). Living governing documents amended in place via the strikethrough + dated-marker convention.
- **Item 1 — DEC-PROD-012 closed:** Decision Register `DEC-PROD-012` — Status `OPEN_FOUNDER → CLOSED (approved & implemented, Option D)`; Final decision wording, Decision date 2026-08-07, Approved by Founder, implementation reference recorded; `Blocks: profile schema freeze` marked discharged. Founder Decision Agenda **D7** marked resolved.
- **Item 2 — MVP gender removed / future-additive:** [TRD10 §10.6.2](../02-technical/trd/10-firestore-data-architecture.md) — `gender?` struck from the MVP `customerProfiles` schema + future-additive governance note (header updated); [TRD21 §21.8 + §21.11](../02-technical/trd/21-privacy-and-data-protection.md) — progressive-profile list and Gender Information section annotated: gender not collected at MVP; §21.11 governs only a future gender-collecting governed release (header updated); [PRD2 §5](../01-product/prd/02-customer-registration-and-identity.md) — "Gender" removed from the optional registration list with marker (header updated). **Consistency annotations (same decision):** [TRD12](../02-technical/trd/12-security-and-access-control.md) sensitivity-example list, [TRD22](../02-technical/trd/22-mvp-implementation-and-delivery.md) optional-early-profile-fields list, and [Commerce Knowledge Standard](../03-standards/commerce-knowledge-standard.md) Early Profile Completion list — gender marked deferred-from-MVP (each header updated).
- **Item 4 — EXT-LEG-001 re-scoped (not removed):** External Dependencies Register `EXT-LEG-001` — the gender-advice portion now applies only to a future gender-collecting governed release; `DEC-PROD-012` removed from its `Blocks`; `DEC-LEGAL-001`/`DEC-PROD-013` portions unchanged; dependency retained (`PENDING`).
- **Item 5 — ENG-P2-001-02 unblocked:** Engineering Implementation Programme (status note + `ENG-P2-001` Status/Blocking-Reason cells + header), Coding-Agent Prompt Register (`ENG-P2-001` row + header), Master Workflow §17 + v1.2 history, `CDR-001` §2/§5 + gate note + header, `ENG-P2-GATE-001` closure banner, `ENG-P2-001-PLAN-001` §10/§12 — all record that `-02` is no longer decision-blocked and is **technically authorised to begin, pending a fresh Founder implementation authorization**. Authentication/ITM remain unauthorised; RTM F11 remains deferred.
- **Boundaries preserved:** no change to Authentication scope, ITM scope, Identity architecture, Progressive KYC, Privacy architecture, or Customer Profile beyond the gender decision. `ENG-P2-001-02` implementation not begun. No new customer fields, schema redesign, API, or runtime change.
- **Deliberately left (flagged):** the illustrative code comment in merged `-05` `functions/src/domains/identity/repositories/customerProfileDocument.ts` lists `gender` among example future `-02` fields — illustrative, not authoritative; to be tidied by a future `ENG-P2-001-02` implementation task. Not modified here (documentation-only task).
- **Validation:** `docs/` is `.prettierignore`d (governed baseline), so `pnpm format:check` does not apply to these files and remains clean on the untouched baseline; markdown links in edited docs resolve (770 links, automated); no code file changed (documentation-only, confirmed via `git status`); grep confirms no MVP-scope documentation still presents gender as a collected profile field; cross-document consistency (Decision Register ↔ Agenda ↔ EXT register ↔ TRD10/TRD12/TRD21/TRD22/CKS ↔ PRD2 ↔ Programme ↔ Prompt Register ↔ Master Workflow ↔ CDR-001 ↔ GATE-001 ↔ PLAN-001) confirmed.
- **Files modified:** `decision-register.md`; `founder-decision-agenda.md`; `external-dependencies-register.md`; `02-technical/trd/10-firestore-data-architecture.md`; `02-technical/trd/12-security-and-access-control.md`; `02-technical/trd/21-privacy-and-data-protection.md`; `02-technical/trd/22-mvp-implementation-and-delivery.md`; `03-standards/commerce-knowledge-standard.md`; `01-product/prd/02-customer-registration-and-identity.md`; `engineering-implementation-programme.md`; `coding-agent-prompt-register.md`; `11thonus-master-workflow.md`; `CDR-001-capability-delivery-roadmap.md`; `ENG-P2-GATE-001-dec-prod-012-scope-determination.md`; `ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md`; `docs/changes/IMPLEMENTATION_CHANGES.md`; this entry. **Files created:** `DEC-PROD-012-implementation-and-eng-p2-001-02-unblock-2026-08-07.md`.
- **Full detail:** [`DEC-PROD-012` Implementation & `ENG-P2-001-02` Unblock report](../05-implementation/reports/DEC-PROD-012-implementation-and-eng-p2-001-02-unblock-2026-08-07.md).

---

## Entry 079 — `ENG-P2-ARCH-CORR-005`: Programme-State Synchronisation (Review-002 R2-01 & R2-02)

- **Date:** 7 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — ENG-P2-ARCH-CORR-005 — Programme-State Synchronisation."
- **Context:** `ENG-P2-ARCH-REVIEW-002` (PASS WITH CONDITIONS) raised two bounded documentation-currency conditions. Documentation-only synchronisation; no architecture redesign, no runtime/API/taxonomy/decision change. R2-03 explicitly out of scope and untouched.
- **R2-01 (Master Delivery Workflow) — corrected:** §7 Phase 1 `In Progress → Complete`; §8/§10 marked superseded historical snapshots; §17 rewritten to the true current position with the stale "next action = `ENG-P1-002-PREP`" removed and the next governed action recorded as not-uniquely-established (requires a Founder decision); §19 v1.1 entry. History preserved.
- **R2-02 (`CDR-001`) — corrected:** §2 (both status tables) and §5 "Validation outcome" corrected from "not started"/"Planned" to "partially implemented; capability remains `Blocked`" — nine of ten `ENG-P2-001` packages merged, `-02` gated by open `DEC-PROD-012`, Auth/ITM unauthorised, RTM F11 deferred; not marked complete/production-ready. Header updated; history preserved.
- **R2-03:** unchanged — the dev-harness timing test was not modified, suppressed, or loosened.
- **Review closure:** `ENG-P2-ARCH-REVIEW-002` report R2-01 & R2-02 marked CLOSED/CORRECTED; R2-03 remains an observation.
- **Validation:** `pnpm format:check` clean; markdown links resolve; documentation-only (no code changed); cross-document consistency (Master Workflow ↔ Programme ↔ CDR-001 ↔ Decision Register ↔ Review-002) confirmed; `DEC-PROD-012` remains `OPEN_FOUNDER`; F11 remains deferred.
- **Files modified:** `11thonus-master-workflow.md`; `CDR-001-capability-delivery-roadmap.md`; `ENG-P2-ARCH-REVIEW-002-...md`; this entry. **Files created:** `ENG-P2-ARCH-CORR-005-programme-state-synchronisation-2026-08-07.md`.
- **Current authoritative next action:** not uniquely established — requires a Founder decision (resolve `DEC-PROD-012` to unblock `ENG-P2-001-02`, or authorise a parallel governed track). Not chosen by this task.
- **Full detail:** [`ENG-P2-ARCH-CORR-005` implementation report](../05-implementation/reports/ENG-P2-ARCH-CORR-005-programme-state-synchronisation-2026-08-07.md).

---

## Entry 078 — `ENG-P2-ARCH-REVIEW-002`: Corrected-Baseline Architecture Review

- **Date:** 7 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — ENG-P2-ARCH-REVIEW-002 — Architecture Review."
- **Context:** a new governed, findings-only architecture review against the corrected baseline (`origin/main` @ `3f9f0e6`, the F9b merge), not a continuation of Review 001. Read-only; no corrections implemented, no closed findings reopened.
- **Outcome — PASS WITH CONDITIONS.** Three items: **R2-01** (Medium, documentation inconsistency) — the Master Delivery Workflow's §7/§8/§10/§17 current-position/next-action records are stale (still point to `ENG-P1-002-PREP`), contradicting the actual merged state and the document's own 2026-08-06 Phase 2 note; **R2-02** (Medium, documentation inconsistency) — `CDR-001` represents Customer Identity as "not started / Blocked" despite nine of ten `ENG-P2-001` packages merged; **R2-03** (Low, observation) — an environment-sensitive timing assertion in a non-production dev-harness frontend test fails locally under load but is green in CI on the same commit. Deferred/carried (not new findings): RTM F11, `ENG-P2-001-02` gated by `DEC-PROD-012`, the pending Identity/Auth/ITM engineering-design decomposition. Accepted design choices (not findings): the Identity/Auth/ITM split, the F9b error-taxonomy mapping, the FEF-accepted governance footprint, the forward-defined ITM boundary.
- **Validation:** `tsc`/`lint`/`build` clean; `functions` unit 400/400; `apps/web` 258/259 (the one R2-03 dev-harness test, green in CI); baseline CI on `main` green.
- **Files created:** `ENG-P2-ARCH-REVIEW-002-corrected-baseline-architecture-review-2026-08-07.md`. **Files modified:** this entry. No architecture document, code, tracker, or configuration changed (findings only).
- **Full detail:** [ENG-P2-ARCH-REVIEW-002 Report](../05-implementation/reports/ENG-P2-ARCH-REVIEW-002-corrected-baseline-architecture-review-2026-08-07.md).

---

## Entry 077 — F9b Error-Category Mapping: Founder Decision Recorded and Closed (`F9B-DEC-001`)

- **Date:** 7 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — F9b Founder Decision Implementation — Error Category Mapping."
- **Context:** Architecture Review Finding **F9b** (`ENG-P2-ARCH-CORR-004`) was left as an open Founder decision — whether the governed error taxonomy should gain a dedicated conflict category. The Founder has now decided the existing governed MVP error taxonomy shall **remain unchanged**. This is a governance/documentation task only; no error-contract redesign, no taxonomy expansion, no runtime/API change.
- **Founder decision (authoritative):** for the current MVP error contract, identity conflicts that are not idempotency-key conflicts continue to map to the governed `VALIDATION_FAILED` category while retaining a specific bounded-domain error internally; `IDEMPOTENCY_CONFLICT` remains reserved exclusively for genuine idempotency conflicts; no new general `CONFLICT` category is introduced; a broader conflict category may be reconsidered only through a future versioned review of the governed error contract if multiple capabilities demonstrate a recurring cross-domain requirement. The existing **14-category** governed taxonomy is preserved unchanged.
- **Records updated:** [TRD11 §11.35](../02-technical/trd/11-cloud-functions-and-domain-services.md#1135-error-categories) — governance note recording the decision and confirming the closed 14-category set (controlled amendment, header updated); `functions/src/domains/identity/models/identityErrors.ts` — header comment changed from "reviewed and deferred to a Founder decision" to the recorded decision (comment only, no code/behaviour change); [Architecture Review Report](../05-implementation/reports/ENG-P2-ARCH-REVIEW-001-capability-2-customer-identity-architecture-review-2026-08-06.md) Finding F9 row — F9b marked **closed** (bracket-marker convention, prior text struck through and preserved); this entry.
- **Confirmed unchanged:** `functions/src/shared/errors/errorCategories.ts` (the governed 14-category set) — no change; `IDEMPOTENCY_CONFLICT` / `VALIDATION_FAILED` semantics — unchanged; no new category; no runtime, API, or test behaviour changed (no test described the previously-unresolved position, so none required synchronisation).
- **Full detail:** the F9b implementation report is delivered in the task completion report.

---

## Entry 076 — FEF Alignment Record Adopted and Registered (`FEF-ALIGN-IMPL-001`)

- **Date:** 7 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — Implement Approved FEF Alignment Actions."
- **Context:** following the completed read-only FEF Alignment Assessment (which created [`docs/00-governance/FEF-ALIGNMENT.md`](FEF-ALIGNMENT.md), PR #71), the Founder approved the alignment actions. This entry records their implementation — an alignment-record and registration task only; no engineering work, no project behaviour/architecture/programme-authority change.
- **Actions implemented (Founder-approved):** (1) adopted `FEF-ALIGNMENT.md` as the project's single official FEF alignment record (status `Prepared → Adopted`, version `0.1 → 1.0`); (2) registered it via this Documentation Changes Log (this entry) — the existing registration process, no new mechanism, frozen v1.0 Documentation Manifest intentionally untouched (consistent with all post-baseline documents); (3) recorded the coordinated Master Delivery Workflow + Engineering Implementation Programme as an accepted project-specific SSoT implementation, no additional programme authority created; (4) recorded the governance footprint as an accepted intentional deviation above the FEF minimum, no reduction authorised; (5) recorded RTM Finding F11 as approved-but-deferred engineering work owned by the Engineering Implementation Programme (RTM synchronisation **not** performed); (6) recorded `F9b` as an existing external Founder decision, neither resolved nor modified; (7) recorded the identified Framework lessons as project-local observations only (FEF unchanged, no Framework Evolution proposal).
- **Deferred / unchanged (confirmed not implemented):** RTM Finding F11 synchronisation; the `F9b` error-category decision; any governance-footprint reduction.
- **Files modified:** [`FEF-ALIGNMENT.md`](FEF-ALIGNMENT.md); this entry.
- **Validation:** all internal links resolve; `prettier --check` clean; worktree contains only the two expected files; the Master Delivery Workflow and Engineering Implementation Programme remain the only authoritative source of current project state (this record introduces no competing programme authority); no duplicate source of truth created; no engineering work performed.
- **Full detail:** [FEF Alignment Profile](FEF-ALIGNMENT.md).

---

## Entry 075 — CI Infrastructure Exception Record — PR #70 (`ENG-P2-ARCH-CORR-004`)

- **Date:** 7 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "Founder Authorisation — PR #70 CI Infrastructure Exception."
- **Context:** GitHub-hosted CI repeatedly failed to acquire a runner for PR #70 (run `31124545388`, annotation "The job was not acquired by Runner of type hosted even after multiple attempts") — a pre-execution infrastructure failure with no repository step executed, providing no evidence of a code or test failure.
- **Action:** created a persistent, PR-#70-only CI Infrastructure Exception Record documenting the failed run ID, infrastructure message, retry history, and a complete local CI-equivalent validation against the exact reviewed head `e75cfcd056cdf8cdbd8225d5b998a05444c52b36` — install, build, lint, format:check, typecheck, functions unit (400/400), web unit (259/259), Playwright e2e (1/1), Firebase Emulator Suite (172/172), all green.
- **Scope:** applies to PR #70 only; does not change the repository's normal CI policy or any workflow/branch-protection configuration.
- **Files created:** `ci-infrastructure-exception-record-pr-70-2026-08-07.md`. **Files modified:** this entry.
- **Full detail:** [CI Infrastructure Exception Record — PR #70](../05-implementation/reports/ci-infrastructure-exception-record-pr-70-2026-08-07.md).

---

## Entry 074 — `ENG-P2-ARCH-CORR-004`: Remaining Architecture Review Findings Reconciliation

- **Date:** 6 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "Proceed with: ENG-P2-ARCH-CORR-004 — Remaining Architecture Review Findings Reconciliation... Resolve or formally disposition Architecture Review Findings F5–F11... the final correction task before architecture revalidation."
- **Classification:** Documentation-only reconciliation. Zero production-code behaviour changes. No Customer Profile, Authentication, ITM, UI, API, Rewards, or unrelated identity behaviour modified.
- **F5 (naming drift):** confirmed real (`linkStatus` vs. `status`; `customerIdentityId` vs. `userId`). Both are live, persisted field names — documented in place, rename deferred to a future `ENG-P2-001-NAMING-001` task.
- **F6 (outbox loop guard):** confirmed genuinely unreachable — `registerCustomerIdentity`'s return type is a compile-time-enforced 1-tuple. No genuine failing test possible without forbidden artificial orchestration. Formally dispositioned "accepted as-is, harmless and unreachable," per this task's own explicit fallback — not code-corrected.
- **F7 (`fromCustomerProfileDocument` unused converter):** confirmed both current read paths need only a narrow single field each; wiring the converter in would add a new, currently-absent throw path — an uninvestigated behaviour change out of this task's boundary. Documented why it remains unused.
- **F8 (`authority`/`reason` asymmetry):** confirmed real and intentional. Doc-comment note added to both affected event files.
- **F9 (error asymmetries):** split — "unknown factory" asymmetry is an accepted architectural variance (documented, no code added); the `VALIDATION_FAILED`-for-conflict pattern surfaced a genuine governance gap in the closed TRD11 §11.35 category set, **deferred to a Founder decision**, documented and framed, not resolved unilaterally.
- **F10 (Rules defense-in-depth):** confirmed no genuine defect — all four collections already fully denied. `firestore.rules` not touched, per the governed Rules boundary. Accepted as non-urgent deferred risk.
- **F11 (RTM sync):** reverified still zero `ENG-P2-001` rows. Disposition unchanged from the original review — a full sync remains genuinely separate, larger governance work.
- **Master Workflow tracker-currency correction** (required by this task's reconciliation section, not itself a numbered finding): Phase 2 section updated in place to reflect nine of ten `ENG-P2-001` packages complete and F1–F4 corrected, matching the Programme/Prompt Register (already accurate).
- **Validation:** full monorepo `install`/`typecheck`/`lint`/`format:check` clean. No test added or modified — no production behaviour changed to regress-test.
- **Files modified:** `authenticationReference.ts`; `authenticationReferenceRepository.ts`; `customerProfileDocument.ts`; `loyaltyNumberEvents.ts`; `qrIdentityEvents.ts`; `loyaltyNumberErrors.ts`; `identityErrors.ts`; `11thonus-master-workflow.md`; `ENG-P2-ARCH-REVIEW-001-...md` (Findings F5–F11 status only, plus a Correction Plan status addendum); this entry; `docs/changes/IMPLEMENTATION_CHANGES.md` (correction entry). **Files created:** `ENG-P2-ARCH-CORR-004-remaining-architecture-review-findings-reconciliation-2026-08-06.md`.
- **Full detail:** [`ENG-P2-ARCH-CORR-004` Correction Report](../05-implementation/reports/ENG-P2-ARCH-CORR-004-remaining-architecture-review-findings-reconciliation-2026-08-06.md).

---

## Entry 073 — `ENG-P2-ARCH-CORR-003`: Audit Projection and Lookup Atomicity Documentation Corrections

- **Date:** 6 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — ENG-P2-ARCH-CORR-003 — Audit Projection and Lookup Atomicity Documentation Corrections... Resolve Architecture Review Findings F3 and F4."
- **Classification:** Bounded application-code and documentation correction, TDD for F3. No Customer Profile, Authentication, ITM, UI, API, Rewards, or unrelated identity behaviour modified. Outbox/lookup architecture not redesigned.
- **F3 evidence and determination:** `trust_reference_updated` (`identityEvents.ts:199`) had no case in `auditPayloadProjection.ts`, falling to the generic unrecognised-event fallback. Root-cause investigation confirmed the event is a real, unit-tested `-01`-defined domain function (`setTrustReference`, `customerIdentity.ts:273-290`) that no repository currently calls — a forward-defined aggregate capability for a future ITM integration, not dead code. Determination: explicit privacy-safe projection required. Applied: `case "trust_reference_updated": return {};` — its only field, `trustRecordId`, is an opaque enumerable ITM-record reference, treated identically to `recoveryProofReference`/`referenceId` elsewhere in the catalogue.
- **F4 evidence and determination:** `identityLookupRepository.ts`'s header comment claimed single-transaction atomicity between the identity read and the audit write. Direct code trace confirmed the read is a plain, non-transactional `.get()`, fully completed before the audit write's own separate transaction begins — no data-integrity defect (a `.get()` cannot produce torn writes), only the comment's specific atomicity claim was inaccurate. Determination: comment-only correction, zero behaviour change — confirmed via `git diff` (every changed line is a JSDoc comment line).
- **Tests:** one new unit test in `auditPayloadProjection.test.ts` (RED confirmed before the fix, GREEN after). `identityLookupRepository.emulator.test.ts` deliberately not modified — its unmodified, continued pass is the required regression proof for F4.
- **Validation:** full monorepo `typecheck`/`lint`/`format:check`/`build` clean; `functions` unit tests 400/400 (399 pre-existing + 1 new); real Firebase Emulator Suite 172/172 across 13 files, confirmed on two full-suite runs; `apps/web` 259/259.
- **Files modified:** `auditPayloadProjection.ts`; `auditPayloadProjection.test.ts`; `identityLookupRepository.ts` (comment only); `ENG-P2-001-10-implementation-report-2026-08-05.md` §38.3 (audit payload catalogue, new row); `ENG-P2-ARCH-REVIEW-001-...md` (Findings F3/F4 status only); this entry; `docs/changes/IMPLEMENTATION_CHANGES.md` (correction entry). **Files created:** `ENG-P2-ARCH-CORR-003-audit-projection-and-lookup-atomicity-corrections-2026-08-06.md`.
- **Full detail:** [`ENG-P2-ARCH-CORR-003` Correction Report](../05-implementation/reports/ENG-P2-ARCH-CORR-003-audit-projection-and-lookup-atomicity-corrections-2026-08-06.md).

---

## Entry 072 — `ENG-P2-ARCH-CORR-002`: Cross-Package Identity Integration Validation

- **Date:** 6 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "Proceed with: ENG-P2-ARCH-CORR-002 — Cross-Package Identity Integration Validation... Resolve Architecture Review Finding F2 by adding bounded cross-package integration tests..."
- **Classification:** Test-only correction, TDD. No production code, Customer Profile, Authentication provider, ITM, UI, public API, or Reward logic added.
- **Defect/gap corrected:** `ENG-P2-ARCH-REVIEW-001` Finding F2 (P2) — three cross-package integration-test gaps (QR regeneration old/new-reference join, cross-package idempotent replay, audit write/read path join).
- **Integration strategy:** one new dedicated emulator test file sequences real, already-merged public repository functions across all 7 architecture-review-mandated cross-package scenarios — no test-only business logic introduced; no production orchestration/composite service exists anywhere in the domain layer (confirmed by repo-wide search), so the longest real chain of governed package commands is exercised where no single composite command exists, per the task's own guidance.
- **Result:** all 7 scenarios (8 tests) pass; zero production defects found. Two test-authoring bugs (not production issues) were caught and fixed during development: Loyalty Number fixture values violating the canonical format's letter/digit exclusions, and outbox event-type assertions using the bare name instead of the real namespaced format.
- **Coverage matrix:** full per-scenario matrix (packages crossed, existing vs. new coverage, result, remaining limitation) recorded in the correction report — all new coverage is emulator-integration at the repository-contract level; UI/API coverage remains explicitly deferred (none exists yet).
- **Validation:** full monorepo `typecheck`/`lint`/`format:check`/`build` clean; `functions` unit tests 399/399 (unchanged); real Firebase Emulator Suite 172/172 across 13 files (164 pre-existing + 8 new), confirmed on the targeted run and twice on the full suite; `apps/web` 259/259.
- **Files modified:** `ENG-P2-ARCH-REVIEW-001-...md` (Finding F2 status only); this entry; `docs/changes/IMPLEMENTATION_CHANGES.md` (correction entry). **Files created:** `crossPackageIdentityIntegration.emulator.test.ts`; `ENG-P2-ARCH-CORR-002-cross-package-identity-integration-validation-2026-08-06.md`.
- **Full detail:** [`ENG-P2-ARCH-CORR-002` Correction Report](../05-implementation/reports/ENG-P2-ARCH-CORR-002-cross-package-identity-integration-validation-2026-08-06.md).

---

## Entry 071 — `ENG-P2-ARCH-CORR-001`: Recovery Proof Reference Metadata Contract Correction

- **Date:** 6 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "TASK — ENG-P2-ARCH-CORR-001 — Recovery Proof Reference Metadata Contract Correction... Resolve architecture-review finding F1..."
- **Classification:** Application code correction plus test-coverage strengthening, TDD. No Customer Profile, Authentication, ITM, UI, or unrelated correction.
- **Defect corrected:** `ENG-P2-ARCH-REVIEW-001` Finding F1 (P1) — `recoveryProofReferences`' first-ever write (`identityLifecycleRepository.ts:243-247`) used `stampUpdate()` instead of `stampCreate()`, omitting `createdAt`/`createdBy`/`id`/`schemaVersion`. Root cause: the write was authored by analogy to the adjacent genuine-update line above it, missing that this `.set()` is always a first write (already guarded by an existence check rejecting any second attempt).
- **Metadata authority analysis:** `recoveryProofReferences` classified as an idempotency/reservation record (a consumed-proof marker), architecturally the same role as `idempotencyRecords`/`loyaltyNumbers`/`qrIdentityRecords`. No prior document type or converter existed; confirmed nothing in the codebase reads this document's fields back beyond `.exists()`.
- **Correction applied:** new `recoveryProofReferenceDocument.ts` — `toRecoveryProofReferenceDocument()`, a `stampCreate`-based typed write-side builder mirroring the established `loyaltyNumberDocument.ts` pattern. Deliberately no read-side converter added, since one would be unused code (avoiding the same defect already flagged elsewhere as Finding F7).
- **Data/migration assessment:** no migration required — no live Firebase deploy evidence exists for this capability, no repository fixtures, and the emulator test suite clears this collection before every run.
- **Tests:** 4 new unit tests (`recoveryProofReferenceDocument.test.ts`); 3 existing emulator tests strengthened in `identityLifecycleRepository.emulator.test.ts` proving complete creation metadata, exactly-once reservation with immutable `createdAt` across idempotent replay, and zero reservation records left by a failed transaction — 399/399 unit and 164/164 real Firebase Emulator Suite tests passing (including this collection's pre-existing Rules tests, unaffected).
- **Validation:** full monorepo `typecheck`/`lint`/`format:check`/`build` clean; `functions` unit tests 399/399; real Firebase Emulator Suite re-run in full, 164/164, clean; `apps/web` 259/259 (one pre-existing, already-disclosed timing flake confirmed transient, `apps/web` untouched).
- **Files modified:** `identityLifecycleRepository.ts`; `identityLifecycleRepository.emulator.test.ts`; `ENG-P2-ARCH-REVIEW-001-...md` (Finding F1 status only); this entry; `docs/changes/IMPLEMENTATION_CHANGES.md` (correction entry). **Files created:** `recoveryProofReferenceDocument.ts` (+ `.test.ts`); `ENG-P2-ARCH-CORR-001-recovery-proof-reference-metadata-correction-2026-08-06.md`.
- **Full detail:** [`ENG-P2-ARCH-CORR-001` Correction Report](../05-implementation/reports/ENG-P2-ARCH-CORR-001-recovery-proof-reference-metadata-correction-2026-08-06.md).

---

## Entry 070 — `ENG-P2-ARCH-REVIEW-001`: Capability 2 Customer Identity Architecture Review

- **Date:** 6 August 2026
- **Performed by:** Claude (AI agent), per Founder instruction: "Proceed with: ENG-P2-ARCH-REVIEW-001 — Capability 2 Customer Identity Architecture Review... The review should determine whether the nine merged packages operate as one coherent capability and whether targeted corrections are required before -02 or Authentication work begins."
- **Classification:** Review and determination only. No application code, test code, Firestore Rule, index, or configuration changed. `ENG-P2-001-02`, Authentication, ITM, UI, and API not begun.
- **Scope:** bounded architecture review of the nine merged `ENG-P2-001` child packages (`-01`, `-03`–`-10`) across 12 review areas (capability boundary, aggregate/ownership, persistence, transactions, idempotency/concurrency, events/audit, error model, security/privacy, Rules/indexes, integration test coverage, operational readiness, governance/documentation consistency). Evidence gathered via direct reading of governing documents/decisions and direct code review (own reading plus three parallel read-only research passes, all findings independently spot-verified against live code before inclusion).
- **Determination:** Ready with targeted corrections. No P0 (critical integrity/security) defect found. 12 findings classified: 1 P1 (`recoveryProofReferences`'s first write uses `stampUpdate` instead of `stampCreate`, omitting `createdAt`/`createdBy`/`id`/`schemaVersion`), 5 P2 (an audit-catalogue gap for `trust_reference_updated`, a doc-comment/code atomicity mismatch in `identityLookupRepository.ts`, two error-model asymmetries, and the governance-tracker staleness corrected below), 3 P3 (a dead-code converter, a latent structural inconsistency, a naming-drift item), 1 informational (Rules defense-in-depth), and 1 informational (RTM never synchronized with this capability, flagged for a future task). Full findings register, cross-package consistency matrix, integration coverage matrix, outstanding governance register, and proposed (not executed) correction plan in the [Architecture Review Report](../05-implementation/reports/ENG-P2-ARCH-REVIEW-001-capability-2-customer-identity-architecture-review-2026-08-06.md).
- **Confirmed:** nine of ten `ENG-P2-001` child packages complete; `ENG-P2-001-02` (Customer Profile) remains outstanding, correctly gated by `DEC-PROD-012` (still `OPEN_FOUNDER`) per `ENG-P2-GATE-001`'s own narrow scoping (only `-02`'s `gender` field and `-05`'s document-level schema "freeze"). No package's own scope or completion status was found to be misrepresented as "all ten complete" in any live tracker — a targeted grep for that literal phrase returned zero matches in the Master Workflow or the Coding-Agent Prompt Register.
- **Minimal live-tracker correction applied:** the Coding-Agent Prompt Register's `ENG-P2-001` row stated (as of its 2026-08-04 synchronization) that "`-02`, `-07`–`-10` remain unimplemented" — stale since `-07` through `-10` were subsequently implemented and merged (2026-08-05/06). Corrected in place, original wording preserved via bracket marker per this repository's established amendment convention; no other tracker required correction (the Engineering Implementation Programme was found already accurate).
- **Files modified:** `docs/05-implementation/change-tracking/coding-agent-prompt-register.md` (narrow `ENG-P2-001` row correction only). **Files created:** [`ENG-P2-ARCH-REVIEW-001-capability-2-customer-identity-architecture-review-2026-08-06.md`](../05-implementation/reports/ENG-P2-ARCH-REVIEW-001-capability-2-customer-identity-architecture-review-2026-08-06.md); this entry; `docs/changes/IMPLEMENTATION_CHANGES.md` (corresponding entry). No historical report, EIR record, or Decision Register entry modified.
- **Full detail:** [`ENG-P2-ARCH-REVIEW-001` Architecture Review Report](../05-implementation/reports/ENG-P2-ARCH-REVIEW-001-capability-2-customer-identity-architecture-review-2026-08-06.md).

---

## Entry 069 — `ENG-P2-001-10` Correction: Audit Read-Model Minimisation (Founder Review, PR #65 held)

- **Date:** 5 August 2026
- **Performed by:** Claude (AI agent), per Founder Review of `PR #65` — positively reviewed, merge withheld on one confirmed defect: audit-query results passed the raw event payload through, exposing raw Loyalty Numbers, QR references, Authentication subject references, and recovery proof references.
- **Classification:** Application code correction plus test-coverage strengthening and policy recording.
- **Policy recorded:** the **Audit Read-Model Minimisation Principle** (Founder-directed): the underlying domain events and outbox records retain governed operational identifiers required for processing and immutable audit evidence, unchanged; audit-QUERY results must not expose raw Loyalty Numbers, QR references, Authentication subject references, phone numbers, emails, credentials, tokens, OTPs, or other sensitive/customer-linked identifiers unless a future explicitly governed audit purpose requires them — no masking, truncation, or unsalted hashing substitutes for omission. Recorded in the [`ENG-P2-001-10` Implementation Report](../05-implementation/reports/ENG-P2-001-10-implementation-report-2026-08-05.md) §38, which supersedes §9's original conclusion and includes the full event-by-event audit payload catalogue.
- **Code changed:** new `auditPayloadProjection.ts` — `projectAuditPayload(eventType, rawPayload)`, an explicit per-event-name allow-list replacing the raw `payload: event.payload` pass-through in `auditEnvelope.ts`; unrecognised event types fail closed to `{ payloadOmitted: true }`.
- **Tests:** 10 new unit tests (`auditPayloadProjection.test.ts`) plus 1 updated/1 new in `auditEnvelope.test.ts`; 5 new real Firebase Emulator Suite tests proving no raw Loyalty Number/QR reference/Authentication subject reference/recovery proof reference reaches a query result while the underlying stored outbox document still carries it, plus a fail-closed unknown-event-type test — 395/395 unit and 164/164 emulator tests passing.
- **Validation:** full monorepo `typecheck`/`lint`/`format:check`/`build` clean; `functions` unit tests 395/395 (385 pre-existing + 10 new); real Firebase Emulator Suite re-run in full, 164/164, clean first run; `apps/web` unchanged (259/259).
- **Files modified:** `auditEnvelope.ts`; `auditEnvelope.test.ts`; `auditPrivacyClassification.ts` (`extractEventName` exported for reuse); `identityAuditQueryRepository.emulator.test.ts`; `ENG-P2-001-10-implementation-report-2026-08-05.md` (§38 added, §9 marked superseded); this entry; `docs/changes/IMPLEMENTATION_CHANGES.md` (correction entry). **Files created:** `auditPayloadProjection.ts` (+ `.test.ts`).
- **Full detail:** [`ENG-P2-001-10` Implementation Report §38](../05-implementation/reports/ENG-P2-001-10-implementation-report-2026-08-05.md).

---

## Entry 068 — `ENG-P2-001-10`: Identity Audit and Observability Foundation Implemented (application code, TDD)

- **Date:** 5 August 2026
- **Performed by:** Claude (AI agent), per Founder task "ENG-P2-001-10: Identity Audit and Observability Foundation," following the Founder-authorized merge of `ENG-P2-001-09` (PR #64).
- **Classification:** Application code, tenth and final planned child package in the Identity work stream — a bounded read-side audit-record projection, privacy classification, query, and observability layer over the already-governed outbox. **Test-driven throughout**, including real Firebase Emulator Suite integration tests.
- **Zero new domain events:** every material event named in this task's own brief already exists in `-01`/`-03`–`-09`'s merged code — confirmed by direct inspection, not new-event creation. This package is additive/read-only over the identity/loyaltyNumber/qrIdentity domain layer.
- **Implemented:** `functions/src/domains/identityAudit/` (new domain) — canonical `IdentityAuditRecord` projection; privacy classification reusing TRD21 §21.6's governed 5-class taxonomy verbatim; a closed, fail-closed `AuditQueryAuthority` context (5 categories, mirrors `-09`'s `IdentityLookupPurpose` pattern); four bounded, paginated query functions over the existing `outboxEntries` collection (by Customer Identity ID, correlation ID, event type, event ID); an 11-signal operational-observability helper reusing the existing backend structured logger (`shared/logging/logger.ts`, not the frontend-only Sentry adapter, not a new framework); one new outbox-integrity test (added to the existing `outboxProcessor.emulator.test.ts`) confirming event content is never mutated by processing-state transitions. 4 new Firestore composite indexes added (genuinely required for the new query paths); no Rules change (deny-by-default already covers `outboxEntries`).
- **Disclosed, not fixed (each out of this bounded task's scope):** `causationId` on the shared `DomainEvent` type is never populated anywhere; `shared/events/eventNaming.ts`'s event-type parser only matches camelCase names but every real identity event name is snake_case; no numeric retention period is governed anywhere for identity audit events (no deletion job implemented).
- **Validation:** 37 new `functions` unit tests (384 total, up from 347); 13 new real Firebase Emulator Suite tests (159 total across 12 files, up from 146) — all passing; full monorepo `typecheck`/`lint`/`format`/`build` clean. One pre-existing, unrelated concurrency-timeout flake observed under elevated host load on a first emulator run, confirmed transient on immediate clean retry.
- **Files created:** `functions/src/domains/identityAudit/{models,repositories,observability}/*` (6 implementation + 6 test files); `docs/05-implementation/reports/ENG-P2-001-10-implementation-report-2026-08-05.md`; this entry; `docs/changes/IMPLEMENTATION_CHANGES.md` (this cycle's entry).
- **Files modified (narrow):** `firestore.indexes.json` (populated from empty); `functions/src/shared/outbox/outboxProcessor.emulator.test.ts` (+1 test only). `ENG-P2-001-01`, `-03`–`-09` remain merged/implemented-pending-merge as previously recorded; `-02`, `ENG-P2-001` as a whole, Authentication, ITM, and Capability 2 overall are unaffected.
- **Dependencies added:** none.
- **Full detail:** [`ENG-P2-001-10` Implementation Report](../05-implementation/reports/ENG-P2-001-10-implementation-report-2026-08-05.md).

---

## Entry 067 — `ENG-P2-001-09` Correction: Lookup-Purpose and Result-Minimisation Clarification (Founder Review, PR #64 held)

- **Date:** 5 August 2026
- **Performed by:** Claude (AI agent), per Founder Review of `PR #64` — positively reviewed, merge withheld pending clarification that the purpose allow-list was an undisclosed engineering judgment and that the shared result exposed unnecessary linked-provider metadata.
- **Classification:** Application code correction plus test-coverage strengthening and policy recording.
- **Policy recorded:** the **Lookup-Purpose and Result-Minimisation Policy** (Founder-directed): a final per-lookup-type purpose allow-list (Customer Identity ID — internal/support/recovery; Loyalty Number — internal/support/recovery/merchant-transaction; QR reference — internal/recovery/merchant-transaction, `support` removed; Authentication Reference — authentication/internal/support/recovery newly granted) and a rule that `IdentityLookupResult.authenticationReferences` is populated only for the `authentication` purpose. Recorded at `ENG-P2-001-PLAN-001` §14 Decision and Ambiguity Register (new, resolved Ambiguity 6) and in a new §38 of the [`ENG-P2-001-09` Implementation Report](../05-implementation/reports/ENG-P2-001-09-implementation-report-2026-08-05.md), which supersedes §6/§11's original tables/type in place.
- **Code changed:** `identityLookupRepository.ts` — `authenticationReferences` made optional and purpose-gated; `LOOKUP_PURPOSE_ALLOW_LISTS` updated per the final policy; `toLookupResult` now branches on `purpose`.
- **Tests:** 4 existing tests strengthened, 3 new tests added in `identityLookupRepository.emulator.test.ts` (caller-identity irrelevance to purpose authority; QR `support`-purpose rejection; Authentication Reference `recovery`-purpose permission) — 25/25 passing.
- **Validation:** full monorepo `typecheck`/`lint`/`format:check`/`build` clean; `functions` unit tests unchanged (347/347); real Firebase Emulator Suite re-run in full, 146/146, clean first run, no flakes; `apps/web` unchanged (259/259).
- **Files modified:** `identityLookupRepository.ts`; `identityLookupRepository.emulator.test.ts`; `ENG-P2-001-09-implementation-report-2026-08-05.md` (§38 added, §6/§11 marked superseded); `ENG-P2-001-PLAN-001` (§14 Ambiguity 6 added, `-09` blockquote updated); this entry; `docs/changes/IMPLEMENTATION_CHANGES.md` (correction entry).
- **Full detail:** [`ENG-P2-001-09` Implementation Report §38](../05-implementation/reports/ENG-P2-001-09-implementation-report-2026-08-05.md).

---

## Entry 066 — `ENG-P2-001-09`: Identity Query and Lookup Interfaces Implemented (application code, TDD)

- **Date:** 5 August 2026
- **Performed by:** Claude (AI agent), per Founder task "ENG-P2-001-09: Identity Query and Lookup Interfaces," following the Founder-authorized merge of `ENG-P2-001-08` (PR #63).
- **Classification:** Application code, eighth package in the Identity work stream — the bounded, exact-match-only Identity Query and Lookup layer, built on `-01`/`-03`–`-08`'s merged foundation. **Test-driven throughout**, including real Firebase Emulator Suite integration tests.
- **Fundamental principle:** "Customer Identity is permanent. Lookup is temporary." A lookup never creates, updates, merges, or recovers an identity — it only resolves an already-existing identity through Customer Identity ID, Loyalty Number, QR reference, or Authentication Reference to a bounded result, or fails closed.
- **Implemented:** four exact-match-only lookup functions (new `identityLookupRepository.ts`), each gated by a caller-declared `IdentityLookupPurpose` against a hardcoded per-lookup-type allow-list (not a role/permission system); a bounded `IdentityLookupResult` never exposing phone/email/trust/purchase/reward data; "unknown" and "exists but inactive" collapsed into one error for stronger enumeration resistance; a new privacy-safe `IdentityLookupAttempted` audit event for support/recovery/authentication-purpose lookups and any failed QR lookup. Reused `-04`'s `getActiveQrIdentityByReference` unmodified; added two small new exported functions to existing repositories rather than new files. No Firestore index or Rules change required — every lookup is a doc-ID `.get()` against an already deny-by-default collection.
- **Validation:** 14 new `functions` unit tests (347 total, up from 333); 27 new real Firebase Emulator Suite tests (143 total across 11 files, up from 116) — all passing; full monorepo `typecheck`/`lint`/`format`/`build` clean. Pre-existing, unrelated concurrency-timeout and frontend timing flakes observed under elevated host load, both confirmed transient on isolated re-run.
- **Files modified (narrow, `ENG-P2-001-09`-only status notes):** `identityErrors.ts`/`.test.ts`, `identityEvents.ts`/`.test.ts`, `authenticationReferenceRepository.ts`/`.emulator.test.ts`, `loyaltyNumberRepository.ts`/`.emulator.test.ts` (no `firestore.rules` change). `ENG-P2-001-01`, `-03`–`-08` remain merged as previously recorded; `-02`, `-10`, `ENG-P2-001` as a whole, Authentication, ITM, and Capability 2 overall are unaffected.
- **Files created:** `functions/src/domains/identity/models/identityLookupPurpose.ts` (+tests); `functions/src/domains/identity/repositories/identityLookupRepository.ts` (+emulator tests); `docs/05-implementation/reports/ENG-P2-001-09-implementation-report-2026-08-05.md`; this entry; `docs/changes/IMPLEMENTATION_CHANGES.md` (this cycle's entry).
- **Dependencies added:** none.
- **Full detail:** [`ENG-P2-001-09` Implementation Report](../05-implementation/reports/ENG-P2-001-09-implementation-report-2026-08-05.md).

---

## Entry 065 — `ENG-P2-001-08` Correction: Authentication Reference Permanence Principle Recorded (Founder Review)

- **Date:** 5 August 2026
- **Performed by:** Claude (AI agent), per Founder Review of `PR #63` — positively reviewed, merge withheld only until the disclosed relink-after-unlink policy was formally recorded.
- **Classification:** Documentation/governance correction plus test-coverage strengthening — **no application/production code changed.**
- **Policy recorded:** the **Authentication Reference Permanence Principle** (Founder-approved verbatim): "Once an authentication reference has been linked to a Customer Identity, its historical ownership remains permanently associated with that identity. If unlinked, it may be restored only to the same Customer Identity. Linking it to a different identity is prohibited unless a future governed manual-review and transfer process explicitly authorises the change." Recorded at `ENG-P2-001-PLAN-001` §14 Decision and Ambiguity Register (new, resolved Ambiguity 5) and in a new §4A of the [`ENG-P2-001-08` Implementation Report](../05-implementation/reports/ENG-P2-001-08-implementation-report-2026-08-05.md), which distinguishes the current approved MVP policy from the deferred future manual-transfer capability.
- **Enforcement confirmed, not changed:** the existing `authenticationReferenceRepository.ts` (Entry 064) already enforced same-identity relink permitted / cross-identity relink rejected / historical ownership retained / no automatic transfer — 2 new emulator tests plus 1 strengthened assertion (17/17 passing) confirm this with zero production-code change.
- **Validation:** full monorepo `lint`/`format:check`/`typecheck`/`build` clean; `functions` unit tests unchanged (333/333, no unit-test file touched); `apps/web` unchanged (259/259); real Firebase Emulator Suite re-run in full.
- **Files modified:** `authenticationReferenceRepository.emulator.test.ts` (+2 tests, 1 strengthened assertion); `ENG-P2-001-08-implementation-report-2026-08-05.md` (§4A added, §3/§6/§15 updated); `ENG-P2-001-PLAN-001` (§14 Ambiguity 5 added, §2 `-08` blockquote updated); this entry; `docs/changes/IMPLEMENTATION_CHANGES.md` (correction entry).
- **Full detail:** [`ENG-P2-001-08` Implementation Report §4A](../05-implementation/reports/ENG-P2-001-08-implementation-report-2026-08-05.md).

---

## Entry 064 — `ENG-P2-001-08`: Identity Linking and Duplicate Prevention Implemented (application code, TDD)

- **Date:** 5 August 2026
- **Performed by:** Claude (AI agent), per Founder task "ENG-P2-001-08: Identity Linking and Duplicate Prevention," following the Founder-authorized merge of `ENG-P2-001-07` (PR #62).
- **Classification:** Application code, seventh package in the Identity work stream — the identity-owned Identity Linking and Duplicate Prevention layer, built on `-01`/`-05`/`-06`/`-07`'s merged foundation. **Test-driven throughout**, including real Firebase Emulator Suite integration tests.
- **Architectural gap closed:** the existing `users/{id}.authenticationReferences` field is only a per-identity projection with no cross-identity uniqueness enforcement. A new doc-ID-keyed `authenticationReferences/{referenceType}:{referenceId}` collection is added as the authoritative uniqueness source, updated atomically alongside the projection in one Firestore transaction.
- **Scope narrowing disclosed:** this task's current brief defines duplicate prevention structurally (same provider-subject reference already owned by a different identity) rather than the PLAN's original heuristic contact-attribute-matching framing; heuristic detection and a review-queue UI remain unimplemented, deferred, and disclosed — followed as the authoritative, current instruction. `ENG-P2-001-PLAN-001` §14 Ambiguity 4 (automatic merge authority) remains untouched.
- **Implemented:** `linkAuthenticationReferenceForIdentity`/`unlinkAuthenticationReferenceForIdentity` (new `authenticationReferenceRepository.ts`) — transactional, idempotent, fail-closed on cross-identity conflict (which still commits a privacy-safe `AuthenticationReferenceConflictDetected` audit event before the command itself fails); unlink preserves history on the authoritative record rather than deleting it; `-01`'s link/unlink domain functions additively extended with `authority`/`reason`. Firestore Rules required no change — the existing deny-by-default catch-all already covers the one new collection, confirmed by 3 new targeted Rules tests.
- **Validation:** 6 new `functions` unit tests (333 total, up from 327); 18 new real Firebase Emulator Suite tests (15 repository + 3 Rules; 114 total across 10 files) — all passing; full monorepo `typecheck`/`lint`/`format`/`build` clean. One pre-existing, unrelated concurrency-timeout flake observed once under elevated host load, confirmed transient on isolated re-run.
- **Files modified (narrow, `ENG-P2-001-08`-only status notes):** `identityErrors.ts`/`.test.ts`, `identityEvents.ts`/`.test.ts`, `customerIdentity.ts`/`.test.ts`, `firestoreRules.emulator.test.ts` (no `firestore.rules` change). `ENG-P2-001-01`, `-03`, `-04`, `-05`, `-06`, `-07` remain merged as previously recorded; `-02`, `-09`, `-10`, `ENG-P2-001` as a whole, and Capability 2 overall are unaffected.
- **Files created:** `functions/src/domains/identity/repositories/authenticationReferenceRepository.ts` (+emulator tests); `docs/05-implementation/reports/ENG-P2-001-08-implementation-report-2026-08-05.md`; this entry; `docs/changes/IMPLEMENTATION_CHANGES.md` (this cycle's entry).
- **Dependencies added:** none.
- **Full detail:** [`ENG-P2-001-08` Implementation Report](../05-implementation/reports/ENG-P2-001-08-implementation-report-2026-08-05.md).

---

## Entry 063 — `ENG-P2-001-07`: Identity Recovery Foundation Implemented (application code, TDD)

- **Date:** 5 August 2026
- **Performed by:** Claude (AI agent), per Founder task "ENG-P2-001-07: Identity Recovery Foundation," following the Founder-authorized merge of `ENG-P2-001-06` (PR #61).
- **Classification:** Application code, sixth package in the Identity work stream — the identity-owned portion of Identity Recovery, built on `-01`/`-05`/`-06`'s merged foundation plus `-03`/`-04`'s merged Loyalty Number/QR domains. **Test-driven throughout**, including real Firebase Emulator Suite integration tests.
- **Scope narrowing disclosed:** this task's own current brief excludes authentication-provider relinking (narrower than `ENG-P2-001-PLAN-001` §2's original `-07` scope text) — followed as the authoritative, current instruction.
- **Implemented:** a provider-neutral `RecoveryProof` contract with pure validation (missing/malformed/rejected/mismatched-target/expired); a bounded, exact-match identity-lookup boundary (Customer Identity ID / Loyalty Number / current QR reference, all doc-ID-keyed, non-enumerable); `-06`'s recovery repository extended (additive) with proof validation and a new doc-ID-keyed `recoveryProofReferences` collection (proof-reuse prevention, mirroring the existing idempotency-key pattern); the existing `IdentityRecovered` event additively extended with `resultingStatus`/`recoveryProofReference`/`proofMethodCategory`. Firestore Rules required no change — the existing deny-by-default catch-all already covers the one new collection, confirmed by 2 new targeted Rules tests.
- **Duplicate-prevention assessment:** true "ambiguous identity match" is structurally unreachable in this Foundation's exact-match-only lookup design (heuristic detection is `-08`'s scope) — assessed and disclosed rather than given a fabricated trigger; the one real, reachable condition (proof-target vs. resolved-identity mismatch) is implemented and tested.
- **Validation:** 17 new `functions` unit tests (327 total, up from 310); 20 new/modified real Firebase Emulator Suite tests across the recovery repositories plus 2 new Rules tests (25 total) — all passing in isolation; full monorepo `typecheck`/`lint`/`format`/`build` clean.
- **Files modified (narrow, `ENG-P2-001-07`-only status notes):** `identityEvents.ts`/`.test.ts`, `identityLifecycleService.ts`/`.test.ts`, `identityLifecycleRepository.ts`/`.emulator.test.ts`, `identityErrors.ts`/`.test.ts`, `firestoreRules.emulator.test.ts` (no `firestore.rules` change). `ENG-P2-001-01`, `-03`, `-04`, `-05`, `-06` remain merged as previously recorded; `-02`, `-08` through `-10`, `ENG-P2-001` as a whole, and Capability 2 overall are unaffected.
- **Files created:** `functions/src/domains/identity/models/recoveryProof.ts` (+tests); `functions/src/domains/identity/repositories/identityRecoveryRepository.ts` (+emulator tests); `docs/05-implementation/reports/ENG-P2-001-07-implementation-report-2026-08-05.md`; this entry; `docs/changes/IMPLEMENTATION_CHANGES.md` (this cycle's entry).
- **Dependencies added:** none.
- **Full detail:** [`ENG-P2-001-07` Implementation Report](../05-implementation/reports/ENG-P2-001-07-implementation-report-2026-08-05.md).

---

## Entry 062 — `ENG-P2-001-06`: Identity Lifecycle and Status Management Implemented (application code, TDD)

- **Date:** 4 August 2026
- **Performed by:** Claude (AI agent), per Founder task "ENG-P2-001-06: Identity Lifecycle and Status Management," following the Founder-authorized merge of `ENG-P2-001-05` (PR #60).
- **Classification:** Application code, fifth package in the Identity work stream — the controlled lifecycle/status-management layer, built directly on `-01`'s merged domain model and `-05`'s merged persistence foundation. **Test-driven throughout**, including real Firebase Emulator Suite integration tests.
- **`ENG-P2-001-PLAN-001` §14 Ambiguity 1 resolved:** the ambiguity's own table states "Founder input required? No" and recommends `Recovered` be a transient transition marker, not a persistent status — implemented exactly as recommended (`IdentityRecovered` domain event only), matching `-01`'s already-adopted `IdentityStatus` enum (no `recovered` member). Marked resolved in the roadmap doc; original wording preserved in git history.
- **Implemented:** bounded `TransitionAuthority`/`TransitionReason` value objects; the recovery boundary (`recoverCustomerIdentity`, restricted to `suspended`/`locked` sources, preserving Customer Identity ID/authentication references/Loyalty Number/QR reference by construction, never creating a second identity); the `IdentityBecameDormant` event `-01` explicitly deferred to this task, plus a new `IdentityRecovered` event — both added narrowly to the existing, already-merged `identityEvents.ts`/`customerIdentity.ts`; a transactional, idempotent `identityLifecycleRepository.ts` reusing `-05`'s established idempotency/transaction pattern, including genuine stale-expected-status rejection (a real gap found and fixed by TDD, not merely declared). Firestore Rules required no change — `-05`'s existing deny-all `users/{id}` block already covers every client-mutation path this package names.
- **Validation:** 44 new tests — 34 new `functions` unit tests (309 total, up from 275) and 10 new real Firebase Emulator Suite tests (84 total, up from 74) — full monorepo `build`/`typecheck`/`lint`/`format`/`test` clean.
- **Files modified (narrow, `ENG-P2-001-06`-only status notes):** `ENG-P2-001-PLAN-001` (including §14 Ambiguity 1 resolution), Engineering Implementation Programme, Coding-Agent Prompt Register; `docs/02-technical/trd/10-firestore-data-architecture.md` §10.6.1 (`users.status` enum corrected — `pending`→`registered`, `dormant` added). `ENG-P2-001-01`, `-03`, `-04`, `-05` remain merged as previously recorded; `-02`, `-07` through `-10`, `ENG-P2-001` as a whole, and Capability 2 overall are unaffected.
- **Full detail:** [`ENG-P2-001-06` Implementation Report](../05-implementation/reports/ENG-P2-001-06-implementation-report-2026-08-04.md).

---

## Entry 061 — `ENG-P2-001-05`: Identity Persistence Foundation Implemented (application code, TDD)

- **Date:** 4 August 2026
- **Performed by:** Claude (AI agent), per Founder task "ENG-P2-001-05: Customer Identity Persistence Foundation," following the Founder-authorized merge of `ENG-P2-001-04` (PR #59).
- **Classification:** Application code, fourth package in the Identity work stream — the integration point persisting `-01`/`-03`/`-04`'s three already-merged domain foundations. **Test-driven throughout**, including real Firebase Emulator Suite integration tests (not mocked).
- **Implemented:** Firestore converters and transactional repositories for `users`, `customerProfiles`, `loyaltyNumbers`, `qrIdentityRecords` — doc-ID-as-value global uniqueness for Loyalty Numbers and QR references, the full atomic QR regeneration transaction (old record invalidated with `replacedByReference`, new record active, identity/loyalty-number unchanged, no partial state on failure), idempotent issuance reusing the existing shared idempotency/outbox infrastructure (no competing framework), and deny-by-default Firestore Rules for all four collections with no direct-client access opened yet (no UI consumer exists). First Rules tests in this repository (23 tests, mutation-tested to confirm they detect a real regression). A cross-cutting outbox-key collision affecting both the Loyalty Number and QR domains' existing (already-merged) event-batch behaviour was found and fixed at the repository layer only — see the Implementation Report §5.
- **Validation:** 86 new tests — 35 new `functions` unit tests (275 total, up from 240) and 51 new real Firebase Emulator Suite tests (74 total, up from 23) — full monorepo `build`/`typecheck`/`lint`/`format`/`test` clean.
- **Files modified (narrow, `ENG-P2-001-05`-only status notes):** `ENG-P2-001-PLAN-001`, Engineering Implementation Programme, Coding-Agent Prompt Register, `eslint.config.js` (3 `repositories/`-scope corrections), `functions/vitest.emulator.config.ts` (`fileParallelism: false`, required for correct multi-file emulator test isolation), `firestore.rules`. `ENG-P2-001-01`, `-03`, `-04` remain implemented-pending-merge as previously recorded; `-02`, `-06` through `-10`, `ENG-P2-001` as a whole, and Capability 2 overall are unaffected.
- **Files created:** `functions/src/domains/{identity,loyaltyNumber,qrIdentity}/repositories/` (converters + repositories + tests); two new concrete generator implementations; `functions/src/security/firestoreRules.emulator.test.ts`; `docs/05-implementation/reports/ENG-P2-001-05-implementation-report-2026-08-04.md`; this entry; `docs/changes/IMPLEMENTATION_CHANGES.md` (this cycle's entry).
- **Dependencies added:** `@firebase/rules-unit-testing` and its `firebase` peer dependency (devDependencies only, version-matched to `apps/web`'s existing `firebase` pin).
- **Full detail:** [`ENG-P2-001-05` Implementation Report](../05-implementation/reports/ENG-P2-001-05-implementation-report-2026-08-04.md).

---

## Entry 060 — `ENG-P2-001-04` Correction: QR Regeneration Wording Clarification (Founder Review)

- **Date:** 4 August 2026
- **Performed by:** Claude (AI agent), per Founder review of PR #59 withholding merge authorisation pending clarification of a documented tension between `ENG-P2-ARCH-001` §5 and `ENG-P2-001-PLAN-001`'s `-04` section.
- **Classification:** Documentation correction, no application code change. PR #59 remains unmerged.
- **Finding:** the tension is internal to `ENG-P2-ARCH-001` §5 itself (its Regeneration row's "relationship unchanged" vs. its own Invalidation row's "old codes must fail closed"), faithfully inherited by `ENG-P2-001-PLAN-001`'s `-04` section, which explicitly lists `ENG-P2-ARCH-001` §5 as its own governing requirement — not an independent, competing claim. The Invalidation requirement is unimplementable if the reference literally never changes, making "relationship unchanged" = the customer↔identity↔loyalty-number association persisting (not the literal reference value) the only internally-consistent reading.
- **Determination:** documentation correction only. The already-implemented behaviour (`regenerateQrIdentity` issues a new reference, invalidates the prior one; `restoreQrIdentityForRecovery` returns the current association unchanged) matched the only consistent reading — no code or test change required.
- **Files corrected (amendment-in-place, original wording preserved in git history):** `ENG-P2-ARCH-001-customer-identity-architecture.md` §5 Regeneration row; `ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md` `-04` Scope bullet + "Updated" callout; `ENG-P2-001-04-implementation-report-2026-08-04.md` §6 (expanded with the full analysis); `IMPLEMENTATION_CHANGES.md` (new dated entry); this entry.
- **Full detail:** [`ENG-P2-001-04` Implementation Report](../05-implementation/reports/ENG-P2-001-04-implementation-report-2026-08-04.md) §6.

---

## Entry 059 — `ENG-P2-001-04`: QR Identity Service Foundation Implemented (application code, TDD)

- **Date:** 4 August 2026
- **Performed by:** Claude (AI agent), per Founder task "ENG-P2-001-04: QR Identity Service Foundation," following the Founder-authorized merge of `ENG-P2-001-03` (PR #58).
- **Classification:** Application code, third package in the Identity work stream. **Test-driven throughout** — every module's test file written and confirmed failing before its implementation.
- **Implemented:** the `QrReference`/`QrPayload` value objects (approved plain-opaque-reference contract per `DEC-DATA-007`), `QrIdentityDomainError` (6 factories, all mapped onto the existing closed error-category enum), a provider-neutral generator port, three lifecycle functions (`issueQrIdentity`, `regenerateQrIdentity`, `restoreQrIdentityForRecovery`), and 3 domain events — at a new sibling domain module `functions/src/domains/qrIdentity/`. No image rendering, scanning, UI/API, Firestore persistence, merchant lookup, Authentication, ITM, or reward logic. Zero Firebase dependency, machine-enforced by a new scoped `eslint.config.js` rule.
- **Governance note:** a textual tension between `ENG-P2-ARCH-001` §5 and `ENG-P2-001-PLAN-001`'s own `-04` section (whether regeneration changes the QR reference value) was identified and reconciled — not silently resolved — with the full analysis recorded in the implementation report §6.
- **Validation:** 39 new tests (240 total in `functions`, up from 201), full monorepo `build`/`typecheck`/`lint`/`format`/`test` clean.
- **Files modified (narrow, `ENG-P2-001-04`-only status notes):** `ENG-P2-001-PLAN-001`, Engineering Implementation Programme, Coding-Agent Prompt Register, `eslint.config.js`. `ENG-P2-001-01`–`-03`, `-05` through `-10`, `ENG-P2-001` as a whole, and Capability 2 overall are unaffected.
- **Files created:** `functions/src/domains/qrIdentity/` (7 source + 4 test files + `README.md`); `docs/05-implementation/reports/ENG-P2-001-04-implementation-report-2026-08-04.md`; this entry; `docs/changes/IMPLEMENTATION_CHANGES.md` (this cycle's entry).
- **Full detail:** [`ENG-P2-001-04` Implementation Report](../05-implementation/reports/ENG-P2-001-04-implementation-report-2026-08-04.md).

---

## Entry 058 — `ENG-P2-001-03`: Loyalty Number Service Foundation Implemented (application code, TDD)

- **Date:** 4 August 2026
- **Performed by:** Claude (AI agent), per Founder task "ENG-P2-001-03: Loyalty Number Service Foundation," following the Founder-authorized merge of `ENG-P2-001-01` (PR #57).
- **Classification:** Application code, second package in the Identity work stream. **Test-driven throughout** — every module's test file written and confirmed failing before its implementation.
- **Implemented:** the `LoyaltyNumber` value object (confirmed baseline format `ABC-234` only), `LoyaltyNumberDomainError` (6 factories, all mapped onto the existing closed error-category enum), provider-neutral generator/uniqueness ports, the bounded `issueLoyaltyNumber` issuance service, and 3 domain events — at a new sibling domain module `functions/src/domains/loyaltyNumber/`. No Firestore persistence, QR, Customer Profile, Authentication, ITM, UI/API, or reward logic. Zero Firebase dependency, machine-enforced by a new scoped `eslint.config.js` rule.
- **Validation:** 39 new tests (201 total in `functions`, up from 162), full monorepo `build`/`typecheck`/`lint`/`format`/`test` clean.
- **Files modified (narrow, `ENG-P2-001-03`-only status notes):** `ENG-P2-001-PLAN-001`, Engineering Implementation Programme, Coding-Agent Prompt Register, `eslint.config.js`. `ENG-P2-001-01`, `-02`, `-04` through `-10`, `ENG-P2-001` as a whole, and Capability 2 overall are unaffected.
- **Files created:** `functions/src/domains/loyaltyNumber/` (7 source + 4 test files + `README.md`); `docs/05-implementation/reports/ENG-P2-001-03-implementation-report-2026-08-04.md`; this entry; `docs/changes/IMPLEMENTATION_CHANGES.md` (this cycle's entry).
- **Full detail:** [`ENG-P2-001-03` Implementation Report](../05-implementation/reports/ENG-P2-001-03-implementation-report-2026-08-04.md).

---

## Entry 057 — `ENG-P2-001-01`: Identity Domain Foundation Implemented (application code, TDD)

- **Date:** 2 August 2026
- **Performed by:** Claude (AI agent), per Founder task "ENG-P2-001-01: Identity Domain Foundation," following the Founder-authorized merge of `ENG-P2-GATE-001` (PR #56).
- **Classification:** Application code, first in the Identity work stream. **Test-driven throughout** — every module's test file written and confirmed failing before its implementation.
- **Implemented:** the `CustomerIdentity` aggregate root, `CustomerIdentityId`/`IdentityStatus`/`AuthenticationReference`/`TrustReference` value objects, `IdentityDomainError` (10 factories, all mapped onto the existing closed error-category enum), and 9 domain events — at `functions/src/domains/identity/`. No persistence, API, UI, authentication-provider, or ITM logic. Zero Firebase dependency, machine-enforced by a new scoped `eslint.config.js` rule.
- **Validation:** 68 new tests (162 total in `functions`, up from 94), full monorepo `build`/`typecheck`/`lint`/`format`/`test` clean.
- **Files modified (narrow, `ENG-P2-001-01`-only status notes):** `ENG-P2-001-PLAN-001`, Engineering Implementation Programme, Coding-Agent Prompt Register, `eslint.config.js`. `ENG-P2-001-02` through `-10`, `ENG-P2-001` as a whole, and Capability 2 overall are unaffected.
- **Files created:** `functions/src/domains/identity/` (7 source + 7 test files + `README.md`); `docs/05-implementation/reports/ENG-P2-001-01-implementation-report-2026-08-02.md`; this entry; `docs/changes/IMPLEMENTATION_CHANGES.md` (this cycle's entry).
- **Full detail:** [`ENG-P2-001-01` Implementation Report](../05-implementation/reports/ENG-P2-001-01-implementation-report-2026-08-02.md).

---

## Entry 056 — `ENG-P2-GATE-001`: `DEC-PROD-012` Capability Authorisation Gate Scope Determination

- **Date:** 2 August 2026
- **Performed by:** Claude (AI agent), per Founder task "ENG-P2-GATE-001: DEC-PROD-012 Capability Authorisation Gate Scope Determination," following the Founder-authorized merge of `ENG-P2-001-PLAN-001` (PR #55).
- **Classification:** Governance interpretation and repository-synchronisation task. **No application code, database schema, API, UI, authentication, or ITM implementation performed. `DEC-PROD-012` not closed or recorded. No gender policy invented. `ENG-P2-001-01` not begun.**
- **Determination:** Scoped gate correction required. `ENG-P2-RES-000` §7 Gate item 6 blocked all of `ENG-P2-001` by its blanket chapeau, despite its own rationale text already naming a narrow scope ("profile schema freeze specifically") — classified as stale wording (the Gate predates `ENG-P2-001-PLAN-001`'s decomposition by 3 days), not intentional Founder governance. Corrected in place to block only `ENG-P2-001-02` (Customer Profile)'s `gender` field and `ENG-P2-001-05`'s corresponding schema-freeze.
- **`Recovered` lifecycle-state:** confirmed irrelevant to `ENG-P2-001-01`'s mobilisation (fully contained within `-06`/`-07`/`-10` under the plan's own recommended resolution).
- **Deliverable:** [`ENG-P2-GATE-001-dec-prod-012-scope-determination.md`](../05-implementation/roadmap/ENG-P2-GATE-001-dec-prod-012-scope-determination.md) — full gate-authority analysis, `DEC-PROD-012` scope analysis, ten-package impact matrix, and determination rationale.
- **Files modified:** `ENG-P2-RES-000` (Gate item 6, amended in place, prior text preserved in git history); `ENG-P2-001-PLAN-001` (Ambiguity 2 marked resolved); Engineering Implementation Programme; Coding-Agent Prompt Register; `CDR-001`; Master Workflow (own established history pattern). No historical report or Decision Register entry modified.
- **Files created:** `docs/05-implementation/roadmap/ENG-P2-GATE-001-dec-prod-012-scope-determination.md`; this entry; `docs/changes/IMPLEMENTATION_CHANGES.md` (this cycle's entry).

---

## Entry 055 — `ENG-P2-001-PLAN-001`: Customer Identity Engineering Decomposition

- **Date:** 2 August 2026
- **Performed by:** Claude (AI agent), per Founder task "ENG-P2-001-PLAN-001: Customer Identity Engineering Decomposition," following the Founder-authorized merge of `ENG-P2-ARCH-001` (PR #54).
- **Classification:** Engineering planning task. **No production code, database schema, Firebase Rule, API, UI, authentication-provider, ITM, or reward implementation performed.**
- **Deliverable:** [`ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md`](../05-implementation/roadmap/ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md) — 10 proposed child work packages under `ENG-P2-001`, a dependency graph, recommended sequence, Authentication/ITM interface boundaries, and a Decision and Ambiguity Register.
- **Key finding not resolved by this task:** a literal-text tension between `DEC-PROD-012`'s own narrow "profile schema freeze" scope and the Capability Authorisation Gate's blanket item-6 wording for `ENG-P2-001` overall — flagged for Founder input, `DEC-PROD-012` itself not closed or recorded, Capability 2 not marked implementation-ready.
- **Files modified:** Engineering Implementation Programme, Coding-Agent Prompt Register, `CDR-001`, and Master Workflow each received a decomposition cross-reference/status note — no roadmap work-package count or capability numbering changed (child packages, not new roadmap rows).
- **Files created:** `docs/05-implementation/roadmap/ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md`; this entry; `docs/changes/IMPLEMENTATION_CHANGES.md` (this cycle's entry).

---

## Entry 054 — `ENG-P2-ARCH-001`: Customer Identity Architecture Definition

- **Date:** 2 August 2026
- **Performed by:** Claude (AI agent), per Founder task "ENG-P2-ARCH-001: Customer Identity Architecture Definition," following the Founder-authorized merge of `IDENTITY-ALIGN-001` (PR #53).
- **Classification:** Engineering architecture definition. **No production code, database implementation, API, UI, authentication, or trust implementation performed.**
- **Deliverable:** [`ENG-P2-ARCH-001-customer-identity-architecture.md`](../05-implementation/roadmap/ENG-P2-ARCH-001-customer-identity-architecture.md) — the Identity Aggregate, Identity/Loyalty-Number/QR lifecycles, Identity Recovery model, and the Authentication/ITM boundary contracts for the Customer Identity concern separated under `DEC-IDENTITY-001`.
- **Key architectural decisions:** Identity Aggregate holds *references* to Authentication and Trust (ITM), never owns either; Identity Lifecycle (Guest→Registered→Active→Dormant→Recovered→Closed→Archived) reconciled against, not replacing, the existing PRD2/TRD10 operational status model; `Dormant`/`Recovered` identified as new states requiring future schema work, not designed here.
- **Files modified:** `CDR-001` §5 Capability 2 and the Engineering Implementation Programme's `ENG-P2-001` Current Status each received a single-line cross-reference to the new architecture document — no other content changed, matching the precedent already established for cross-referencing Engineering Blueprints.
- **Files created:** `docs/05-implementation/roadmap/ENG-P2-ARCH-001-customer-identity-architecture.md`; this entry; `docs/changes/IMPLEMENTATION_CHANGES.md` (this cycle's entry).

---

## Entry 053 — `IDENTITY-ALIGN-001`: Repository Constitutional Alignment Following FD-IDENTITY-001

- **Date:** 1 August 2026
- **Performed by:** Claude (AI agent), applying the Founder-authorized constitutional realignment following `FD-IDENTITY-001`, using the analysis prepared under `IDENTITY-STRATEGY-001` (Entry 052).
- **Classification:** Governance and repository alignment task. **No application code was modified; engineering implementation not begun.**
- **`DEC-IDENTITY-001` recorded** in the Decision Register (`CONFIRMED`, Founder decision, 2026-08-01) — the Identity, Authentication, Progressive Trust, Standard Participation, Risk-Based Verification, Merchant, and Recovery Principles, verbatim per the Founder's task brief.
- **`DEC-PROV-004` and `DEC-SEC-001` amended in place** (not superseded) — the "verified mobile phone number is the customer's canonical identity" clause and the "reward redemption" verification-gate clause identified in Entry 052 were replaced using a bracket-marker amendment pattern; all other clauses in both decisions preserved verbatim; pre-amendment text remains intact in each decision's own evidence package and in git history. Decision Register §5 Register Summary updated: `CONFIRMED` 42 → 43, Total records 103 → 104.
- **Capability architecture restructured:** `CDR-001` §5 Capability 2 now names three architectural concerns — Customer Identity, Authentication, and **Identity Trust Management (ITM)**, an internal-only engineering name never exposed customer-facing. Capability numbering and sequence are unchanged; no capability was renumbered (see the implementation report §4 for the full reasoning).
- **`EXT-TECH-001` reclassified:** no longer an unconditional Capability Authorisation Gate blocker for `ENG-P2-001`'s baseline Customer Identity work; now scoped to the phone-OTP authentication provider's production activation and ITM's phone-verification trust signal. External Dependencies Register, `ENG-P2-RES-000` §7 Gate item 1, Engineering Implementation Programme, and Coding-Agent Prompt Register all updated to match; `DEC-PROD-012` is now the sole remaining Gate item. `ENG-P2-001` remains `Blocked`.
- **Governing-document wording corrected:** PRD2 §5 Steps 2–4 and §7 Account Status (the passage Entry 052 identified as the single most directly contradicted in the repository); TRD12 §12.4.1 (provider hierarchy → equal providers); Canonical Reference §10 MVP Boundaries. RTM reviewed — no row required correction.
- **`IDENTITY-STRATEGY-001`/PR #53 naming superseded:** "Trust Lifecycle Management (TLM)," used throughout the not-yet-merged PR #53, renamed to "Identity Trust Management (ITM)" across all 5 affected files, per this task's own authoritative naming; both evidence documents' status headers updated from "prepared for review" to "Recorded"/"applied."
- **Files created:** `docs/05-implementation/reports/IDENTITY-ALIGN-001-implementation-report-2026-08-01.md`. **Files modified:** Decision Register, External Dependencies Register, `CDR-001`, `ENG-P2-RES-000`, Engineering Implementation Programme, Master Workflow, Coding-Agent Prompt Register, Canonical Reference, PRD2, TRD12, the two `FD-IDENTITY-001` evidence documents, the `IDENTITY-STRATEGY-001` implementation report, this log, and `IMPLEMENTATION_CHANGES.md`. No application code, no other PRD/TRD, and no historical report under `/reports/`, `/records/`, or a frozen `/evidence/` package was modified.
- **Full detail:** [`IDENTITY-ALIGN-001` Implementation Report](../05-implementation/reports/IDENTITY-ALIGN-001-implementation-report-2026-08-01.md).

---

## Entry 052 — `IDENTITY-STRATEGY-001`: Progressive Trust Constitutional Realignment (governance analysis only)

- **Date:** 1 August 2026
- **Performed by:** Claude (AI agent), per Founder decision `FD-IDENTITY-001` ("Progressive Trust Identity Strategy") and task "TASK — IDENTITY-STRATEGY-001: Progressive Trust Constitutional Realignment."
- **Classification:** Repository-wide impact assessment and Founder-approval-document preparation. **No application code was modified — the task brief explicitly prohibited it.** No PRD, TRD, Decision Register entry, Canonical Reference, Platform Constitution, `CDR-001`, Engineering Implementation Programme, or RTM was edited; all were analyzed and quoted verbatim for Founder review.
- **Founder decision analyzed:** `FD-IDENTITY-001` separates Authentication, Identity, and Verification into independent capabilities and removes mandatory phone verification from initial loyalty-programme participation, replacing it with progressive, risk-based verification. The Founder additionally recommended **Identity Trust Management (ITM)** as the internal engineering name for the capability implementing this — adopted throughout this task's output; "Progressive Trust" remains the correct name for the Founder's own constitutional principle.
- **Critical finding:** zero engineering implementation exists against the pre-`FD-IDENTITY-001` model (`ENG-P2-001` remains `Blocked`, no code) — this decision costs nothing in rework, only in documentation/decision-register correction.
- **Two `CONFIRMED` decisions require amendment, not supersession:** `DEC-PROV-004` (its "verified mobile phone number is the customer's canonical identity" clause is the exact conflation `FD-IDENTITY-001` corrects) and `DEC-SEC-001` (its Progressive Phone Verification clause names "reward redemption" as gateable by verification, contradicted by `FD-IDENTITY-001`'s explicit exemption of standard-reward redemption). Exact current text, exact proposed replacement text, and reasoning drafted and ready for Founder review — not applied to the live Decision Register by this task.
- **Recommended new capability boundary:** the current, conflated "Capability 2 — Customer Identity" splits into a narrowed Identity capability, a new Authentication capability, and the new ITM capability — full detail, an 8-step migration sequence, a capability impact matrix (confirming Capabilities 5/6/Reward Engine unaffected, per the Founder's own statement), and a rollback strategy are recorded in the linked evidence documents.
- **`EXT-TECH-001` status: unchanged, Still Pending. Capability 2: unchanged, `Blocked`.** `FD-IDENTITY-001`/proposed `DEC-IDENTITY-001`: awaiting Founder countersign — not recorded in the Decision Register by this task.
- **Files created:** `docs/00-governance/decisions/evidence/FD-IDENTITY-001-impact-assessment-and-migration-plan-2026-08-01.md`; `docs/00-governance/decisions/evidence/FD-IDENTITY-001-founder-decision-package-2026-08-01.md`; `docs/05-implementation/reports/IDENTITY-STRATEGY-001-implementation-report-2026-08-01.md`; `docs/changes/IMPLEMENTATION_CHANGES.md` (this cycle's entry); `docs/00-governance/documentation-changes-log.md` (this entry). No other file was created, modified, or deleted.

---

## Entry 051 — `EXT-TECH-001-HARNESS-CR3`: Firebase Hosting Preview and Hosted-Domain Phone Authentication Correction

- **Date:** 1 August 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — EXT-TECH-001-HARNESS-CR3: Firebase Hosting Preview and Hosted-Domain Phone Authentication Correction."
- **Classification:** Bounded infrastructure-preparation and defect-correction cycle. The Founder enabled Firebase Hosting on `eleventh-on-us-dev` and authorised completing repository-side Hosting setup, building a harness-only artifact, deploying it to a temporary preview channel, authorising only that hostname for Firebase Auth, fixing a second, deeper `RecaptchaVerifier` lifecycle defect the Founder found still present after CR2, and preparing the HTTPS preview for a Founder-operated real-SMS test. No real SMS was sent.
- **Harness isolation:** a dedicated `harness.html`/`harnessMain.tsx` build entry structurally excludes the shared composition root (Firebase App Check, observability pipeline, `react-query`, `react-router`) rather than merely gating a route — empirically confirmed against real build output (32 modules transformed vs. 2,223 for the full app).
- **Second reCAPTCHA defect, root-caused and fixed:** `RecaptchaVerifier.clear()` does not remove the DOM nodes it rendered into its container, so CR2's fix (clear + reconstruct against one reused container) was insufficient — a new verifier against the same container still throws "already rendered." Fixed by constructing a genuinely fresh, never-reused DOM node per attempt, on every send/retry/reset/unmount, plus a concurrency guard.
- **Deployed** to Firebase Hosting preview channel `phone-auth-test` (`eleventh-on-us-dev`), a temporary, `noindex`ed, narrowly-CSP'd HTTPS URL, ready for the Founder's real carrier test.
- **`EXT-TECH-001` status: unchanged, Still Pending.** **Capability 2 remains `Blocked`.**
- **Files modified:** `firebase.json`; `apps/web/vite.config.ts`; `apps/web/harness.html` (new); `apps/web/src/dev/phoneAuthHarness/{harnessMain.tsx,testHarnessGate.ts,testHarnessGate.test.ts}` (new); `apps/web/src/dev/phoneAuthHarness/{PhoneAuthHarnessPage.tsx,PhoneAuthHarnessPage.test.tsx}`; `apps/web/.env.example`; `docs/05-implementation/reports/EXT-TECH-001-TEST-HARNESS-implementation-report-2026-07-31.md` (§32 addendum); `docs/05-implementation/reports/EXT-TECH-001-HARNESS-CR3-hosted-preview-record.md` (new); `docs/05-implementation/reports/EXT-TECH-001-TEST-HARNESS-manual-runbook-2026-07-31.md`; `docs/05-implementation/reports/EXT-TECH-001-delivery-test-evidence-template-2026-07-31.md`; `docs/changes/IMPLEMENTATION_CHANGES.md`; `docs/00-governance/documentation-changes-log.md` (this entry).

---

## Entry 050 — `EXT-TECH-001-TEST-HARNESS-CR1`: Corrective Review Cycle for PR #50

- **Date:** 1 August 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — EXT-TECH-001-TEST-HARNESS-CR1: Corrective Review Cycle for PR #50."
- **Classification:** Bounded, test-driven correction cycle. The Founder reviewed PR #50, accepted 3 automated-review findings on the harness's own source as genuine defects, and declined to merge — requiring all three fixed before the PR could return for merge authorisation. No merge occurred.
- **Three defects corrected, each independently test-verified:** (1) `phoneAuthHarnessAuth.ts` now enforces a positive allowlist (`APPROVED_DEV_PROJECT_ID = "eleventh-on-us-dev"`) rather than only rejecting the Emulator Suite's demo project — a misconfigured `.env.local` pointing at staging or another real project can no longer silently send a real SMS through the wrong environment. (2) The harness's "Delivery latency" figure now measures the complete Send-click-to-receipt interval (including reCAPTCHA and Firebase network time), not merely the post-acceptance portion; the original figure is preserved as a second, explicitly-labelled internal-diagnostic line. (3) A bounded (max 3) Retry/Resend control now exists so a tester can genuinely resend to the same masked identity/carrier without a full reset — the previous "Retry count" could never exceed 0.
- **Runbook and evidence template updated** to reflect the allowlist enforcement, the corrected latency definition, and the new bounded retry procedure.
- **Local worktree anomaly disclosed and resolved** (see `IMPLEMENTATION_CHANGES.md`'s 2026-08-01 entry and the implementation report's §30.5) — a local `.git` link file went missing before this cycle began; the branch, commits, and PR #50's CI evidence on GitHub were confirmed unaffected throughout, and no source content was reconstructed from memory.
- **`EXT-TECH-001` status: unchanged, Still Pending.** **Capability 2 remains `Blocked`** on `EXT-TECH-001`/`DEC-PROD-012`.
- **Scope note:** this entry logs `EXT-TECH-001-TEST-HARNESS-CR1`'s own correction cycle only.
- **Files modified:** `apps/web/src/dev/phoneAuthHarness/{phoneAuthHarnessAuth.ts,phoneAuthHarnessAuth.test.ts,PhoneAuthHarnessPage.tsx,PhoneAuthHarnessPage.test.tsx}`; `docs/05-implementation/reports/EXT-TECH-001-TEST-HARNESS-manual-runbook-2026-07-31.md`; `docs/05-implementation/reports/EXT-TECH-001-delivery-test-evidence-template-2026-07-31.md`; `docs/05-implementation/reports/EXT-TECH-001-TEST-HARNESS-implementation-report-2026-07-31.md` (§30 addendum); `docs/00-governance/documentation-changes-log.md` (this entry); `docs/changes/IMPLEMENTATION_CHANGES.md`.

---

## Entry 049 — `EXT-TECH-001-TEST-HARNESS`: Controlled Real-SMS Test Harness

- **Date:** 31 July 2026
- **Performed by:** Claude (AI agent), per Founder task "FOUNDER AUTHORISATION AND TASK — EXT-TECH-001-TEST-HARNESS: Controlled Real-SMS Test Harness."
- **Classification:** Bounded, test-driven harness-preparation task. `PR #49` merged (content unaltered by this task); no real SMS sent; no real phone number stored or committed; no additional authentication provider enabled; no Customer Identity implementation begun.
- **Harness built:** a minimal, development-only tool (`apps/web/src/dev/phoneAuthHarness/`, route `/dev/phone-auth-harness`) capable of invoking the genuine Firebase Authentication Phone Sign-In SMS route via a dedicated, never-emulator-connected Auth instance — built for the Founder or an authorised tester holding a physical Burundi SIM to operate, not for this coding agent to execute. Every privacy invariant (no pre-populated/persisted number or OTP, masking, no storage/URL/console leakage, manual-only "SMS received" confirmation, `.code`-only error display, no diagnostics-pipeline integration) is enforced by 30 automated tests across 4 new unit-level modules plus additions to the existing route test.
- **Genuine defect found and corrected before completion:** an initial route guard correctly prevented the harness from rendering at runtime, but a real `pnpm build` followed by inspecting `dist/` found the harness code was still present in the production bundle. Corrected via a `React.lazy()` dynamic import gated directly on the literal `import.meta.env.DEV`, re-verified absent from a fresh production build.
- **`EXT-TECH-001` status: unchanged, Still Pending** — this task does not resolve it; the harness is preparation only. **Capability 2 remains `Blocked`** on `EXT-TECH-001`/`DEC-PROD-012`.
- **Scope note:** this entry logs `EXT-TECH-001-TEST-HARNESS`'s own harness implementation and its two accompanying operator documents. It does not backfill entries for the several earlier Resolution Sprint decisions not logged here at the time, per Entry 039's own disclosed scope boundary.
- **Files modified:** `apps/web/src/App.tsx`; `apps/web/src/App.test.tsx`; `docs/00-governance/documentation-changes-log.md` (this entry); `docs/changes/IMPLEMENTATION_CHANGES.md`.
- **Files created:** `apps/web/src/dev/phoneAuthHarness/{mask,harnessGate,phoneAuthHarnessAuth,PhoneAuthHarnessPage}.{ts,tsx}` and their test files; `docs/05-implementation/reports/EXT-TECH-001-TEST-HARNESS-manual-runbook-2026-07-31.md`; `docs/05-implementation/reports/EXT-TECH-001-delivery-test-evidence-template-2026-07-31.md`; `docs/05-implementation/reports/EXT-TECH-001-TEST-HARNESS-implementation-report-2026-07-31.md`.

---

## Entry 048 — `EXT-TECH-001-DELIVERY-TEST`: Real Burundi Carrier OTP Delivery Validation — Stopped Before Testing

- **Date:** 31 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — EXT-TECH-001-DELIVERY-TEST: Real Burundi Carrier OTP Delivery Validation."
- **Classification:** Stage A (merge/verify) completed; Stages B–G **not performed**, stopped per this task's own explicit Stop Conditions before any test execution. No test SMS sent; no test number handled; no application code modified.
- **Stop recorded, two independent reasons:** (1) no authorised real Burundi test numbers were supplied anywhere in this conversation, and the task's own instructions were explicitly conditional on possessing them; (2) this coding environment has no physical telephone or means to observe a real device's inbox — confirming actual SMS receipt (not merely that Firebase accepted the send request) is a human-observation step no coding agent can perform, independent of number availability.
- **`EXT-TECH-001` gate determination: Still Pending — unchanged.** Consistent with every prior task in this chain. Capability 2 remains `Blocked` on `EXT-TECH-001`/`DEC-PROD-012` only.
- **Next required action, identified not performed:** a human with physical possession of active SIM cards on Lumitel, Econet Leo, and Onatel must run the test directly (Firebase Console's Authentication testing UI is recommended, requiring no application code) and report the observed outcome back for future recording.
- **Scope note:** this entry logs `EXT-TECH-001-DELIVERY-TEST`'s own stopped attempt. It does not backfill entries for the several earlier Resolution Sprint decisions not logged here at the time, per Entry 039's own disclosed scope boundary.
- **Files modified:** `docs/00-governance/documentation-changes-log.md` (this entry, append-only); `docs/changes/IMPLEMENTATION_CHANGES.md`.
- **Files created:** `docs/05-implementation/reports/EXT-TECH-001-DELIVERY-TEST-stop-report-2026-07-31.md`.

---

## Entry 047 — `EXT-TECH-001-ENV-READY`: Firebase Environment Readiness for Phone Authentication

- **Date:** 31 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — EXT-TECH-001-ENV-READY: Firebase Environment Readiness for Phone Authentication," implementing the Founder's confirmed decision that Phone Authentication is the only enabled authentication provider at this stage.
- **Classification:** Environment-readiness assessment and bounded infrastructure configuration task. `PR #47` merged (content unaltered by this task); no delivery test performed; no `EXT-TECH-001` resolution; no additional authentication provider enabled; no application code modified.
- **Live infrastructure change recorded (not a documentation change, logged here for completeness):** `eleventh-on-us-dev`'s Identity Toolkit `smsRegionConfig` was updated to allowlist Burundi (`BI`) — the sole missing prerequisite found in a full environment audit (Phone Authentication was already `enabled: true`; Blaze billing already active; no other provider present). Verified immediately after that only `smsRegionConfig` changed. No repository file, application code, or production configuration was touched.
- **Delivery-test readiness: Ready with Conditions.** The Firebase-side technical environment is now fully capable of attempting real SMS delivery to Burundi numbers. Remaining conditions (real carrier phone numbers; Founder/Engineering-Lead authorization to execute the test) are non-technical and outside this task's scope.
- **Scope note:** this entry logs `EXT-TECH-001-ENV-READY`'s own environment audit and one live infrastructure change. It does not backfill entries for the several earlier Resolution Sprint decisions not logged here at the time, per Entry 039's own disclosed scope boundary.
- **Files modified:** `docs/00-governance/documentation-changes-log.md` (this entry, append-only); `docs/changes/IMPLEMENTATION_CHANGES.md`.
- **Files created:** `docs/05-implementation/reports/EXT-TECH-001-ENV-READY-firebase-environment-readiness-report-2026-07-31.md`.

---

## Entry 046 — `EXT-TECH-001-GOV-ALIGN`: Governance Alignment for EXT-TECH-001

- **Date:** 31 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — EXT-TECH-001-GOV-ALIGN: Governance Alignment for EXT-TECH-001."
- **Classification:** Read-only governance-consistency review. `PR #46` merged (content unaltered by this task); no delivery test performed; no technical evidence requirement changed; no `EXT-TECH-001` resolution; no `DEC-SEC-001`/`DEC-PROV-004` reinterpretation; no `DEC-PROD-012` resolution; no Capability 2 entry authorised.
- **Conclusion recorded: the governance documentation is already internally consistent.** Reviewed the Resolution Plan (`ENG-P2-RES-000` §7), the External Dependencies Register, the Decision Register's `DEC-SEC-001`/`DEC-PROV-004` entries, `ENG-P1-EXIT-001`, the Engineering Implementation Programme, the Master Workflow, `CDR-001`, and the Coding-Agent Prompt Register. Both Founder decisions scope their "not a blocker" language narrowly to themselves (`DEC-SEC-001`: "not a blocker to this decision"; `DEC-PROV-004`: "a production-readiness condition rather than a governance blocker"); neither amends the separate Resolution Plan Capability Authorisation Gate (§7 item 1), which remains textually unmodified and still governs `ENG-P2-001` implementation start. No document was found stating anything contradicted by the other. **No corrective edit was applied to any governance artefact.**
- **Final classification:** `EXT-TECH-001` is no longer a decision blocker (`DEC-SEC-001`/`DEC-PROV-004` both `CONFIRMED` without it); it remains a Capability 2 entry blocker (Resolution Plan §7 item 1) and a launch-readiness/production-readiness dependency (`DEC-PROV-004` Principle 8/9) — three distinct, non-conflicting classifications for three distinct milestones.
- **Scope note:** this entry logs `EXT-TECH-001-GOV-ALIGN`'s own governance-consistency review, which resulted in zero corrective edits beyond this log entry itself. It does not backfill entries for the several earlier Resolution Sprint decisions not logged here at the time, per Entry 039's own disclosed scope boundary.
- **Files modified:** `docs/00-governance/documentation-changes-log.md` (this entry, append-only); `docs/changes/IMPLEMENTATION_CHANGES.md`.
- **Files created:** `docs/05-implementation/reports/EXT-TECH-001-GOV-ALIGN-governance-alignment-report-2026-07-31.md`.

---

## Entry 045 — `EXT-TECH-001-EVIDENCE`: EXT-TECH-001 Evidence Resolution and Gate Determination

- **Date:** 31 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — EXT-TECH-001-EVIDENCE: EXT-TECH-001 Evidence Resolution and Gate Determination."
- **Classification:** Evidence-resolution and gate-assurance task. `PR #45` merged (content unaltered by this task); no `DEC-PROD-012` resolution; no Phase 2 implementation; no vendor selected; no external evidence fabricated.
- **Determination recorded:** `EXT-TECH-001` (Firebase phone-OTP delivery to Burundi numbers) gate condition — **Still Pending**. The prior `RES-001` evidence package (2026-07-29) already discloses that the one decisive remaining item, a real SMS delivery test against Burundi's three carriers, has not been performed; this task independently re-confirmed that gap is still open via a direct, read-only live-infrastructure query (Firebase Identity Platform Admin config on `eleventh-on-us-dev` returned `404 CONFIGURATION_NOT_FOUND`) and two independent documentation re-fetches (both unchanged since 2026-07-29).
- **Register correction:** the External Dependencies Register's `EXT-TECH-001` row `Blocks` field, which still named `DEC-SEC-001`/`DEC-PROV-004` as blocked by this item, was corrected — both decisions' own 2026-07-30 Decision Register entries explicitly state `EXT-TECH-001` is not a blocker to either (both `CONFIRMED` independently, treating Burundi SMS delivery as a launch-readiness matter). `Status` left `PENDING`.
- **Capability 2 status:** confirmed `Blocked` on exactly `EXT-TECH-001` (**Still Pending**, this task) and `DEC-PROD-012` (`OPEN_FOUNDER`, unchanged). No other item required action.
- **Scope note:** this entry logs `EXT-TECH-001-EVIDENCE`'s own gate-determination task and one narrow register correction. It does not backfill entries for the several earlier Resolution Sprint decisions not logged here at the time, per Entry 039's own disclosed scope boundary.
- **Files modified:** `docs/00-governance/decisions/external-dependencies-register.md`; `docs/00-governance/documentation-changes-log.md` (this entry); `docs/changes/IMPLEMENTATION_CHANGES.md`.
- **Files created:** `docs/05-implementation/reports/EXT-TECH-001-EVIDENCE-resolution-report-2026-07-31.md`.

---

## Entry 044 — `RES-005.2b`: BaseMetadata Code Conformance Correction

- **Date:** 31 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — RES-005.2b: BaseMetadata Code Conformance Correction."
- **Classification:** Bounded code-conformance correction. `PR #44` merged (content unaltered by this task); the first code-level change in this task chain — `functions/src/shared/metadata/baseMetadata.ts` only; no other application code, Firebase Rule, or schema modified; `EXT-TECH-001`/`DEC-PROD-012` not resolved; Phase 2 implementation not begun; the approved BaseMetadata contract itself not altered.
- **Correction recorded:** `functions/src/shared/metadata/baseMetadata.ts` brought into full conformance with the now-aligned documentation baseline (TRD10 §10.5, corrected Blueprint §3.3, reconciled TRD8 §8.7, approved `RES-005.2a` Contract Analysis) — `version`→`schemaVersion`; non-nullable→nullable `createdBy`/`updatedBy`; `deletedAt`/`deletedBy`→`archivedAt`/`archivedBy`; `languageCode` removed; `currencyCode`/`timezone` added; `readonly` applied to the contract's immutable fields (`id`, `createdAt`, `createdBy`). A repository-wide impact analysis found zero consumers of the type anywhere in the codebase and zero persisted data in any environment, so **no migration was required**. Full local validation passed (94/94 `functions` unit tests, 191/191 `apps/web`, 23/23 real Firebase Emulator Suite), with a testing-methodology finding disclosed regarding this repository's `.test.ts` type-checking exclusion.
- **All four documentation-vs-code discrepancies originally found by `ENG-P2-000A` (2026-07-29) are now resolved end-to-end** — documentation (`RES-005.2a`/`RES-005.2a-R1`) and code (`RES-005.2b`, this entry). **BaseMetadata Capability 2 blocker status: Resolved.** Capability 2 itself **remains `Blocked`** — `EXT-TECH-001` and `DEC-PROD-012` are unchanged, independent Capability Authorisation Gate items.
- **Scope note:** this entry logs `RES-005.2b`'s own code correction and narrow tracker synchronization. It does not backfill entries for the several earlier Resolution Sprint decisions not logged here at the time, per Entry 039's own disclosed scope boundary.
- **Files modified:** `functions/src/shared/metadata/baseMetadata.ts`; `functions/src/shared/metadata/baseMetadata.test.ts`; `docs/05-implementation/change-tracking/engineering-implementation-programme.md`; `docs/05-implementation/11thonus-master-workflow.md`; `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md`; `docs/05-implementation/change-tracking/coding-agent-prompt-register.md`; `docs/00-governance/documentation-changes-log.md` (this entry); `docs/changes/IMPLEMENTATION_CHANGES.md`.
- **Files created:** `docs/05-implementation/reports/RES-005.2b-basemetadata-code-conformance-report-2026-07-31.md`.

---

## Entry 043 — `RES-005.2a-R1`: TRD8 BaseMetadata Documentation Reconciliation

- **Date:** 31 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — RES-005.2a-R1: TRD8 BaseMetadata Documentation Reconciliation."
- **Classification:** Bounded documentation-reconciliation task. `PR #43` merged (content unaltered by this task); no application code modified; no new BaseMetadata semantics introduced; `EXT-TECH-001`/`DEC-PROD-012` not resolved; Phase 2 implementation not begun.
- **Reconciliation recorded:** TRD8 §8.7 ("Firestore Document Standards") — previously an independent, stale restatement of the pre-`RES-005.2a` BaseMetadata shape (identical to what the Blueprint had transcribed from it: `version`, non-nullable `createdBy`/`updatedBy`, `deletedAt`/`deletedBy`, `languageCode`, no `currencyCode`/`timezone`) — rewritten as an explicit normative cross-reference to TRD10 §10.5 and the corrected Blueprint §3.3, removing the duplication that structurally caused this three-task correction chain. No genuinely independent TRD8 requirement was found; no stop-and-report was triggered.
- **All three live normative documents now agree:** TRD10 §10.5 (authoritative), Blueprint §3.3 (corrected `RES-005.2a`), TRD8 §8.7 (reconciled, this entry). `functions/src/shared/metadata/baseMetadata.ts` remains unmodified and non-conformant — `RES-005.2b` assessed as **Ready**.
- **Scope note:** this entry logs `RES-005.2a-R1`'s own TRD8 correction and narrow tracker synchronization. It does not backfill entries for the several earlier Resolution Sprint decisions not logged here at the time, per Entry 039's own disclosed scope boundary.
- **Files modified:** `docs/02-technical/trd/08-firebase-platform-architecture.md`; `docs/05-implementation/change-tracking/engineering-implementation-programme.md`; `docs/00-governance/documentation-changes-log.md` (this entry); `docs/changes/IMPLEMENTATION_CHANGES.md`.
- **Files created:** `docs/05-implementation/reports/RES-005.2a-R1-trd8-reconciliation-report-2026-07-31.md`.

---

## Entry 042 — `RES-005.2a`: BaseMetadata Governing Blueprint Correction

- **Date:** 31 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — RES-005.2a: BaseMetadata Governing Blueprint Correction."
- **Classification:** Documentation/requirements-conformance correction only. `PR #42` merged (content unaltered by this task); no application code, test, Firebase Rule, or API modified; `EXT-TECH-001`/`DEC-PROD-012` not resolved; Phase 2 implementation not begun.
- **Correction recorded:** Version 1 Engineering Blueprint §3.3 ("Standard Document Metadata") rewritten from TRD8 §8.7's shape to TRD10 §10.5's shape — the Blueprint's own §0 rule ("the TRD chapter governs") applied to a conflict `ENG-P2-000A` first identified (2026-07-29) and this task independently re-verified and corrected. Four distinct differences resolved in documentation: field naming (`schemaVersion` not `version`), nullability (`createdBy`/`updatedBy: string | null`), field naming/semantics (`archivedAt`/`archivedBy`, not `deletedAt`/`deletedBy`, per DAP-010 and matching PRD2 §7's "Archived" status), and field presence (`currencyCode`/`timezone` added, `languageCode` removed from the shared shape — confirmed as a genuine but domain-specific PRD2 §6 field, not universal metadata).
- **New finding, disclosed not corrected:** TRD8 §8.7 independently states the same stale shape the Blueprint transcribed from it — a TRD-chapter-to-TRD-chapter inconsistency outside this task's authorization to correct.
- **Code conformance explicitly not achieved by this entry:** `functions/src/shared/metadata/baseMetadata.ts` still implements the pre-correction shape; a separate task (`RES-005.2b`) is required, assessed here as **Ready**.
- **Scope note:** this entry logs `RES-005.2a`'s own Blueprint correction and tracker synchronization. It does not backfill entries for the several earlier Resolution Sprint decisions not logged here at the time, per Entry 039's own disclosed scope boundary.
- **Files modified:** `docs/02-technical/version-1-engineering-blueprint.md`; `docs/05-implementation/change-tracking/engineering-implementation-programme.md`; `docs/05-implementation/11thonus-master-workflow.md`; `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md`; `docs/05-implementation/change-tracking/coding-agent-prompt-register.md`; `docs/00-governance/documentation-changes-log.md` (this entry); `docs/changes/IMPLEMENTATION_CHANGES.md`.
- **Files created:** `docs/05-implementation/reports/RES-005.2a-basemetadata-contract-analysis-2026-07-31.md`.

---

## Entry 041 — `ENG-P1-EXIT-001`: Phase 1 Exit-Criteria Determination and Capability 2 Entry Mobilisation

- **Date:** 31 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — ENG-P1-EXIT-001: Phase 1 Exit-Criteria Determination and Capability 2 Entry Mobilisation."
- **Classification:** Assurance and mobilisation determination. `PR #41` merged (content unaltered by this task); no application code modified; `EXT-TECH-001`/`DEC-PROD-012`/`BaseMetadata` not resolved; Phase 2 implementation not begun.
- **Determination recorded:** Phase 1 (TRD22 §22.11) **Exit Approved** — all four governing Exit Criteria verified satisfied by direct, live evidence (shared-command authenticate/validate/log/respond; idempotent outbox processing; deny-by-default Rules; green emulator CI). Disclosed, non-blocking Deliverables-list gaps (no production Firebase project provisioned, no feature-flag abstraction, no Rules/Knowledge Service interface code) registered, not converted into exit blockers.
- **Blockers classified, none resolved:** `EXT-TECH-001` (`PENDING`, Engineering Lead, independently actionable, blocks Phase 2 not Phase 1), `DEC-PROD-012` (`OPEN_FOUNDER`, no package yet, blocks Phase 2 not Phase 1), `BaseMetadata`/TRD10 §10.5 conformance (Blueprint §3.3 vs. TRD10 vs. code compared directly — correction sequence confirmed as documentation-then-code, `RES-005.2a` → `RES-005.2b`, neither performed here).
- **Mobilisation plan produced:** an 8-task controlled sequence with dependencies, parallelisability, and Founder-review points identified; single next-task recommendation `RES-005.2a`, not authorized or begun by this task.
- **Scope note:** this entry logs `ENG-P1-EXIT-001`'s own tracker corrections and new report. It does not backfill equivalent entries for the several earlier Resolution Sprint decisions not logged here at the time, per Entry 039's own disclosed scope boundary.
- **Files modified:** `docs/05-implementation/change-tracking/engineering-implementation-programme.md`; `docs/05-implementation/11thonus-master-workflow.md`; `docs/00-governance/documentation-changes-log.md` (this entry); `docs/changes/IMPLEMENTATION_CHANGES.md`.
- **Files created:** `docs/05-implementation/reports/ENG-P1-EXIT-001-phase-1-exit-determination-and-mobilisation-report-2026-07-31.md`.

---

## Entry 040 — `RES-007B`: Capability 2 Merge Consolidation and Closure Finalisation

- **Date:** 31 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — RES-007B: Capability 2 Merge Consolidation and Closure Finalisation."
- **Classification:** Merge consolidation (Stage A) plus downstream tracker synchronization and closure record (Stage B). No decision reopened, no application code modified, no identity/permission/recovery/loyalty-number/QR functionality implemented.
- **Merges performed:** PRs #36 (`RES-004A`), #37 (`RES-005`), #38 (`RES-006`), #39 (`RES-006A`), #40 (`RES-007`) merged to `main` in Founder-authorized dependency order; PR #32 closed without merging, superseded by PR #34. All four Sprint decisions (`DEC-PROV-004`, `DEC-SEC-001`, `DEC-ID-003`, `DEC-DATA-007`) are now `CONFIRMED` live on `main`.
- **Trackers synchronized:** [Master Workflow](../05-implementation/11thonus-master-workflow.md), [Coding-Agent Prompt Register](../05-implementation/change-tracking/coding-agent-prompt-register.md), [`CDR-001`](../05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md), [Engineering Implementation Programme](../05-implementation/change-tracking/engineering-implementation-programme.md), and the [Requirements Traceability Matrix](requirements-traceability-matrix.md) — each corrected only on the now-stale "the four decisions are open" claim; Phase 2's `Blocked` status and every outstanding engineering prerequisite preserved unchanged.
- **Closure record created:** [Capability 2 Resolution Sprint — Closure Record](../05-implementation/reports/capability-2-resolution-sprint-closure-record-2026-07-31.md), a successor status update to `RES-007`'s own closure report (left unmodified). Final status determined: **Ready with Conditions** — not upgraded to Ready for Implementation, since the Resolution Plan's own eight-item Capability Authorisation Gate has three items still open independent of this Sprint (`EXT-TECH-001`, `DEC-PROD-012`, `BaseMetadata` conformance), and Phase 1's own exit-criteria determination has never been formally made.
- **Scope note:** this entry logs `RES-007B`'s own tracker-sync and closure-record work. It does not backfill entries for the several earlier Resolution Sprint decisions not logged here at the time — those recordings are already fully documented in `docs/changes/IMPLEMENTATION_CHANGES.md`, per Entry 039's own disclosed scope boundary.
- **Files modified:** `docs/05-implementation/11thonus-master-workflow.md`; `docs/05-implementation/change-tracking/coding-agent-prompt-register.md`; `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md`; `docs/05-implementation/change-tracking/engineering-implementation-programme.md`; `docs/00-governance/requirements-traceability-matrix.md`; `docs/00-governance/documentation-changes-log.md` (this entry); `docs/changes/IMPLEMENTATION_CHANGES.md`.
- **Files created:** `docs/05-implementation/reports/capability-2-resolution-sprint-closure-record-2026-07-31.md`.

---

## Entry 039 — `DEC-DATA-007`: Engineering Decision Recording

- **Date:** 30 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — RES-006A: DEC-DATA-007 Engineering Decision Recording."
- **Classification:** Governance decision recording only. No application code, no identifier or QR generation implemented.
- **Decision recorded:** `DEC-DATA-007` ("Loyalty number and QR reference generation") moved `OPEN_ENGINEERING → CONFIRMED` in the [Decision Register](decisions/decision-register.md). Approved: server-side, randomly-allocated loyalty-code generation (baseline format `ABC-234`, no checksum — the `ABC-234-X` checksum-enhanced variant explicitly deferred, not adopted); a plain opaque QR reference (not a signed token); transactional-uniqueness collision handling with automatic retry; and the corrected idempotency invariant (at most one immutable assignment per platform user, repeat calls return the existing result). Recorded as an Engineering Lead decision — `Founder decision required: No`, per the Register's own field and the `RES-006` decision package's finding that no constitutional or commercial issue exists.
- **Scope note:** this entry logs `DEC-DATA-007`'s own recording only. It does not backfill equivalent entries for the several other decisions confirmed earlier in this Resolution Sprint (`DEC-PROV-005`, `DEC-PROV-004`, `DEC-SEC-001`, `DEC-ID-003`) or for `CDR-001`, none of which were logged here at the time — those recordings are already fully documented in `docs/changes/IMPLEMENTATION_CHANGES.md`, which has functioned as this Sprint's operative running log. Backfilling this document for the earlier decisions is disclosed as a follow-on item, not performed by this entry.
- **Files modified:** `docs/00-governance/decisions/decision-register.md`; `docs/00-governance/documentation-changes-log.md` (this entry); `docs/changes/IMPLEMENTATION_CHANGES.md`.

---

## Entry 038 — `ENG-P1-003`: Administrative Closure

- **Date:** 29 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — ENG-P1-003 Administrative Closure", following Founder Decisions 1–3 on the `ENG-P1-003-IMP-05` closure audit.
- **Classification:** Administrative closure only. No new implementation, no architecture change. Merges a previously-reviewed PR, changes one tracker status field, and registers three unimplemented successor work packages.
- **Pre-merge correction (PR #23):** a P1 automated-review finding (Codex) identified that the closure audit's own `FR-SEC-006` traceability claim ("zero evidence, no Rules file was ever created") was factually wrong — `firestore.rules`/`storage.rules` exist at the repository root, deny-by-default, established in Phase 0 (`ENG-P0-001`, commit `3a50710`). The original `git log --all -- "**/firestore.rules" "**/storage.rules"` search used a glob pathspec that fails to match root-level files with no directory nesting, returning an empty result — a search-tooling bug, not a fact about the repository. Corrected across both closure reports and all four governance tracker/log documents (commit `cd844a7`); the PR #23 review thread was replied to and marked resolved; CI re-verified green on the corrected head before merge.
- **Action:** Verified all merge conditions (PR #23 open, mergeable, CI green on `cd844a7`, review thread resolved, no unreviewed commits), merged PR #23 (merge commit `f8ff1dec9df42cc7c00023ab018044c0362cfe8d`), verified post-merge CI green on that exact commit (one rerun of the same pre-existing, unrelated `functions/` emulator flake — `functions/` confirmed byte-identical to the prior clean merge), confirmed local `main`/`origin/main` synchronized at zero divergence with a clean working tree.
- **Tracker status change:** `ENG-P1-003` row moved `In Progress → Complete` in both the [Engineering Implementation Programme](../05-implementation/change-tracking/engineering-implementation-programme.md) and the [Coding-Agent Prompt Register](../05-implementation/change-tracking/coding-agent-prompt-register.md), per Founder Decision 2, referencing the [Engineering Closure Report](../05-implementation/reports/ENG-P1-003-IMP-05-engineering-closure-report-2026-07-27.md) and the [Operational Readiness Report](../05-implementation/reports/ENG-P1-003-IMP-04-operational-readiness-report-2026-07-27.md) as the authoritative completion evidence.
- **Successor work packages registered (none implemented), per Founder Decision 3:** `OBS-OPS-001` — Frontend Diagnostics Operational Enablement (Sentry organisation/project/DSN, staging/production onboarding, operational ownership, privacy approvals, rollout; **Planned / Awaiting Founder Authorization**); `ENG-SEC-001` — Firestore & Storage Security Rules Foundation (domain-specific deny-by-default rules, emulator testing, security readiness, building on the existing Phase 0 blanket-deny placeholder; **Planned**); `ENG-CI-001` — Firebase Emulator CI Stabilisation (investigate and resolve the recurring `functions/` emulator-timing flake without changing application behaviour; **Engineering Improvement Backlog**). Registered in the Programme §C.1 and the Prompt Register §4 note; outside the Phase 0–16 TRD22 roadmap and not counted in the Programme's "Total work packages defined: 47."
- **Governance boundaries preserved:** no successor work package was implemented, scoped in detail, or given a Decision Dependency; no external provider account, credential, or diagnostics activation; Phase 1's own completion (as distinct from its three individual work packages) was deliberately left undetermined — that is a separate governance question this administrative-closure task was not authorized to decide.

### Files modified (4)

- `docs/05-implementation/change-tracking/engineering-implementation-programme.md` (banner; Phase 1 summary/profile; Work-Packages table Status/Blocking Reason; new §C.1 successor-package registry)
- `docs/05-implementation/change-tracking/coding-agent-prompt-register.md` (banner; `ENG-P1-003` row; §4 register — 3 new successor rows + note; §5 distribution, including a pre-existing stale `Ready: 1` count corrected to 0; closing narrative)
- `docs/00-governance/documentation-changes-log.md` (this entry)
- `docs/changes/IMPLEMENTATION_CHANGES.md` (closing entry appended)

---

## Entry 037 — `ENG-P1-003-IMP-05`: Engineering Closure and Handover

- **Date:** 27 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — ENG-P1-003-IMP-05: Engineering Closure and Handover", the administrative closure audit for `ENG-P1-003`.
- **Classification:** Audit and documentation-sync only. No new product capability, no architecture change, no feature work. `ENG-P1-003` remains `In Progress` — this task recommends, but does not itself apply, a closure decision.
- **Action:** Merged PR #22 (Founder-authorized, one review-comment correction applied first — see below), verified `origin/main`/local `main` synchronized with zero divergence, post-merge CI green on the final commit (one rerun of a pre-existing, unrelated `functions/` emulator flake, its fifth documented occurrence). Audited all five merged PRs (`#18`/`#19` incl. `CR1`/`#20`/`#21`/`#22`) against the live repository, re-ran full regression (191/191 `apps/web`, 92/92 `functions`, clean typecheck/lint/build), produced a requirements-traceability table, and confirmed zero architecture drift from the approved Blueprint.
- **Pre-merge correction (PR #22):** an automated review (Codex, P2) found the Stage 4 free-text phone-number pattern measured total match length (digits + separators) against its stated 7-digit minimum, not actual digit count, so a widely-spaced two-digit run could be falsely redacted. Fixed via TDD (reproduced RED, restructured the pattern to enforce the minimum per digit, confirmed GREEN, 191/191 full suite) and pushed to PR #22's branch before merging.
- **Finding, corrected before merge:** the original audit draft claimed `FR-SEC-006` (Firestore/Storage Rules deny-by-default) had zero implementation evidence — a P1 automated-review finding on this PR caught the error: `firestore.rules`/`storage.rules` exist at the repository root, deny-by-default, established in Phase 0 (`ENG-P0-001`, commit `3a50710`), well before `ENG-P1-003` began. The original `git log` search used a glob pattern that failed to match the root-level files — a search-tooling bug, not a fact about the repository. `ENG-P1-003` itself never touched these files (confirmed), but the deny-by-default posture they establish predates and was never `ENG-P1-003`'s own work. What remains genuinely unbuilt — formal, automated Rules testing and domain-specific authorization rules — is narrower than originally reported and does not block this closure.
- **Administrative recommendation, corrected:** **`ENG-P1-003 COMPLETE`** — the observability scope (Stages 1–4) is complete, tested, documented, and ready for Operational Enablement handover. `ENG-SEC-001` is registered as necessary, independent follow-on work (Rules testing, domain-specific rules), not as an unmet condition of this closure. The closure decision itself remains with the Founder.
- **Governance boundaries preserved:** no external provider account, no credential, no diagnostics activation, no production deployment, no self-merge of the closure PR, no administrative closure applied by this task.

### Files created (2)

- `docs/05-implementation/reports/ENG-P1-003-IMP-05-engineering-closure-report-2026-07-27.md`
- `docs/05-implementation/reports/ENG-P1-003-IMP-05-completion-report-2026-07-27.md`

### Files modified (2)

- `docs/05-implementation/change-tracking/engineering-implementation-programme.md` (staleness correction — `ENG-P1-003` narrative and Work-Packages table updated to reflect Stages 2–4 and this audit; no historical entry rewritten)
- `docs/05-implementation/change-tracking/coding-agent-prompt-register.md` (same correction — table row and narrative log updated with Stage 2–4/closure report links)

---

## Entry 036 — `ENG-P1-003-IMP-04`: Operational Validation and Readiness

- **Date:** 27 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — ENG-P1-003-IMP-04: Operational Validation and Readiness", Stage 4 of `ENG-P1-003-EXECUTION-LOOP`.
- **Classification:** Validation and readiness classification, not new implementation. Two minimal, disclosed, TDD-verified corrections to already-merged code. `ENG-P1-003` remains `In Progress` — this task does not itself close it; closure is separately Founder-authorized. No external account, credential, or production activation.
- **Action:** Merged PR #21 (Founder-authorized, "Stage 3 passes its gate. PR #21 merge approved"), verified post-merge CI green (commit `310313ea08779bb9c1502cbea31fa1182a5c821c`, run `30277223179`), then performed the required 13-point pre-validation analysis against the merged repository and validated across six required areas (functional, privacy, correlation, resilience, security, regression), cross-referencing every checklist item against actual test titles rather than assuming coverage.
- **Two genuine defects found and fixed (TDD throughout):** (1) `sanitizeText()` had no pattern for a plain email address or general phone number embedded in free text — only a structured, key-named field was previously protected. Verified with a standalone script before treating as real, then reproduced with two failing tests, then fixed by extending `TEXT_SCAN_PATTERNS` (an already-existing, already-designed extensible mechanism — the same class as Stage 3's own loyalty/QR/customer-name closed-list extension). (2) `RouteTracker`'s `React.StrictMode` double-invocation safety was previously only reasoned about in a doc comment, never proven with a real `<StrictMode>` render test — added one; it passed immediately, confirming the existing guard was already correct.
- **Readiness classification (four independent states, none manufactured):** Architecture Ready — **PASS**. Integration Ready — **PASS**. Staging Ready — **PASS WITH CONDITIONS** (every unmet condition is an external, Founder-owned action — Sentry account/project/DSN/terms/privacy-review/access/retention/alerts — not a code defect). Production Ready — **NOT YET ASSESSABLE** (no staging evidence exists yet to ground a production assessment; not marked FAIL, since nothing has actually failed).
- **Tests:** 4 new tests (2 fixing a real gap, 2 proof-only for already-correct behavior). Full `apps/web` suite: 190/190 passing (was 186/186 at Stage 3 baseline), zero regression. `functions`: 92/92 passing, unaffected.
- **Governance boundaries preserved:** no dependency added; no Sentry account/organisation/project created; no real DSN or credential; no production activation; no source-map upload; no session replay/tracing/profiling enabled; no backend file touched; Firestore Rules untouched; `ENG-P1-003` remains `In Progress`; no self-merge.
- **Files created:** `docs/05-implementation/reports/ENG-P1-003-IMP-04-operational-readiness-report-2026-07-27.md` (the authoritative readiness report with Appendices A–G — staging/production checklists, provider onboarding action list, rollback procedure, privacy verification checklist, manual validation plan, known limitations); `docs/05-implementation/reports/ENG-P1-003-IMP-04-implementation-report-2026-07-27.md`.
- **Files modified:** `apps/web/src/observability/sanitize.ts` (+ test — the free-text email/phone fix); `apps/web/src/observability/correlationContext.test.ts` (+1 proof test); `apps/web/src/observability/RouteTracker.test.tsx` (+1 `StrictMode` proof test).
- **CI flakiness disclosure:** a fourth occurrence was recorded when this stage's own PR #22 was opened — `idempotencyService.emulator.test.ts`'s "reports 'duplicate' with the stored response after completeIdempotencyKey" failed once (identical test/signature to one seen during Stage 3's PR #21 review), then passed on rerun; `functions/` remained untouched throughout. Combined with the three prior documented occurrences (Stage 2's PR #20 once, Stage 3's PR #21 twice), all four are referenced, not re-investigated, per this task's explicit instruction not to modify unrelated backend tests. Recommended, not implemented: `ENG-CI-001 — Firebase Emulator CI Flakiness Investigation and Stabilisation`.
- **Rollback:** `git revert` of this stage's own commit(s) — both corrections are safe to keep independently even under a partial revert.
- **Report link:** [`docs/05-implementation/reports/ENG-P1-003-IMP-04-implementation-report-2026-07-27.md`](../05-implementation/reports/ENG-P1-003-IMP-04-implementation-report-2026-07-27.md) and [the readiness report](../05-implementation/reports/ENG-P1-003-IMP-04-operational-readiness-report-2026-07-27.md).

---

## Entry 035 — `ENG-P1-003-IMP-03`: Frontend Diagnostics Provider Adapter

- **Date:** 27 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — ENG-P1-003-IMP-03: Frontend Diagnostics Provider Adapter", Stage 3 of `ENG-P1-003-EXECUTION-LOOP`.
- **Classification:** Implementation (Stage 3 of `ENG-P1-003`). One minimum official SDK dependency added, disabled by default. No Sentry account/organisation/project created, no real DSN, no credential. `ENG-P1-003` remains `In Progress`, not `Complete`. Stage 4 not begun.
- **Action:** Merged PR #20 (Founder-authorized, "Founder decision — Approve PR #20"), verified post-merge CI green (commit `56b828bdffdf5de5d98c46c1a2c4bb5f3ea757d0`, run `30259380736`), then performed the task's required 10-point pre-edit analysis directly against the merged repository before writing anything. Implemented `sentryProvider.ts` — a `DiagnosticsProvider` adapter backed by `@sentry/react@10.68.0` — mapping all 8 provider-neutral methods, with every one of Sentry's own default automatic integrations explicitly disabled (`integrations: []`: no auto breadcrumbs, no auto error/rejection capture that would duplicate Stage 2's own handlers, no session tracking, no tracing, no replay, no profiling, no feedback). Implemented `providerSelection.ts`, a pure, unit-testable activation gate requiring diagnostics enabled, provider explicitly `"sentry"`, and a non-empty DSN, all three simultaneously — missing any one falls back to the no-op provider, never an error. Added a machine-enforced ESLint rule confining `@sentry/react` imports to the adapter file alone (previously convention-only).
- **Disclosed finding and fix:** end-to-end correlation-ID testing (using a real `crypto.randomUUID()`-shaped value, as production actually generates) surfaced a genuine, previously-undetected defect in already-merged Stage 1/CR1 code — `observabilityService.ts` merged the correlation id into context *before* sanitizing, so the generic long-token redaction pattern silently matched and redacted any UUID-shaped correlation id, contradicting that file's own documented "never redact correlationId" guarantee. Undetected through Stage 1/CR1/Stage 2 because every prior test used a short placeholder id. Fixed with a minimal, TDD-verified reorder (sanitize the caller's context first, merge the trusted id in after) — full detail in the implementation report §27.
- **Tests:** 42 new tests across 8 files (`sentryProvider.test.ts` 18, `providerSelection.test.ts` 6, `sentryPrivacy.test.ts` 8, `sentryNetworkSafety.test.ts` 2, `sentryIntegrationBoundaries.test.ts` 3, plus additions to `config.test.ts`/`sanitize.test.ts`/`observabilityService.test.ts`). Full `apps/web` suite: 186/186 passing (was 144/144 at Stage 2 baseline), zero regression. `functions`: 92/92 passing, unaffected.
- **Governance boundaries preserved:** no dependency added beyond the one minimum SDK package (its own transitive deps confirmed browser-only); no Sentry account/organisation/project created; no real DSN or credential anywhere; no Sentry configuration in `functions/`; no application feature component imports `@sentry/react` (confirmed by scan and by the new ESLint rule, verified to actually fire on a deliberate violation); no source-map-upload tooling; Firestore Rules untouched; `ENG-P1-003` remains `In Progress`, not marked `Complete`; Stage 4 and Phase 2 not begun.
- **Files created:** `apps/web/src/observability/sentryProvider.ts` (+ test), `providerSelection.ts` (+ test), `sentryPrivacy.test.ts`, `sentryNetworkSafety.test.ts`, `sentryIntegrationBoundaries.test.ts`; `docs/05-implementation/reports/ENG-P1-003-IMP-03-implementation-report-2026-07-27.md`.
- **Files modified:** `apps/web/package.json` (+ `pnpm-lock.yaml`), `apps/web/src/observability/config.ts` (+ test), `apps/web/src/observability/observabilityService.ts` (+ test — the disclosed fix), `apps/web/src/observability/sanitize.ts` (+ test — closed-list extension for loyalty/QR/customer-name keys), `apps/web/src/observability/index.ts`, `apps/web/.env.example`, `eslint.config.js`.
- **Deferred, not begun this stage:** every external Founder action (Sentry account/organisation/project creation, real DSN issuance, auth token, source-map upload, production activation); frontend-to-backend correlation propagation (still blocked, unchanged from Stage 2); Stage 4 (Operational Validation and Readiness).
- **Rollback:** `git revert` of this stage's own commit(s) on its dedicated branch — every change is additive or narrowly scoped; the one behavioral fix (§27) is independently correct.
- **Report link:** [`docs/05-implementation/reports/ENG-P1-003-IMP-03-implementation-report-2026-07-27.md`](../05-implementation/reports/ENG-P1-003-IMP-03-implementation-report-2026-07-27.md).

---

## Entry 034 — `ENG-P1-003-IMP-02`: Application Integration

- **Date:** 27 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — ENG-P1-003-EXECUTION-LOOP: Stages 2–4", Stage 2 only.
- **Classification:** Implementation (Stage 2 of `ENG-P1-003`). No Sentry account, SDK, DSN, dependency, or external network call. `ENG-P1-003` remains `In Progress`, not `Complete`. Stage 3/4 not begun.
- **Action:** Merged PR #19 (Stage 1 + CR1, Founder-authorized), verified post-merge CI green (commit `c0e39545c861a9bc8336f5778508a191c24eb0dd`), then performed the task's required pre-edit analysis directly against the live application before writing anything. That analysis found the application materially thinner than the task brief assumed — one placeholder route, no logout UI, no API/network layer — triggering two of the task's own stop-and-ask conditions; both were resolved via explicit Founder decision (`AskUserQuestion`) rather than guessed, recorded in full in the implementation report §3. Implemented, test-first (TDD): a React error boundary at the application root rendering a Founder-approved minimal temporary fallback; global `window` `error`/`unhandledrejection` capture; a workflow-scoped correlation-ID lifecycle (`beginWorkflow`/`endWorkflow`, compare-and-clear against concurrent-workflow clobbering); a Firebase-Auth-driven correlation/identity clear-on-sign-out hook; connectivity (`online`/`offline`) breadcrumbs; route-change breadcrumbs. All wired into `main.tsx`, the observability foundation's first real consumer. 29 new tests, full `apps/web` suite grew from 115 to 144 passing, zero regression.
- **Governance boundaries preserved:** no dependency added (`package.json`/lockfile diff empty); no Sentry import anywhere; no DSN or secret anywhere; Firestore Rules untouched; frontend-to-backend correlation propagation explicitly recorded as **Blocked**, not implemented and not claimed as ready — see the report's §11 status table; `ENG-P1-003`'s Security/Storage Rules scope not begun; no production deploy; no third-party account or credential of any kind.
- **Files created:** `apps/web/src/observability/ErrorBoundary.tsx` (+ test), `globalErrorHandlers.ts` (+ test), `authLifecycle.ts` (+ test), `connectivityBreadcrumbs.ts` (+ test), `RouteTracker.tsx` (+ test); `docs/05-implementation/reports/ENG-P1-003-IMP-02-implementation-report-2026-07-27.md`.
- **Files modified:** `apps/web/src/main.tsx` (composition-root wiring); `apps/web/src/observability/correlationContext.ts` (+ test, `beginWorkflow`/`endWorkflow`); `apps/web/src/observability/index.ts` (barrel exports).
- **Deferred, not begun this stage:** frontend-to-backend correlation propagation and backend-issued-ID adoption (blocked on the not-yet-built API/network layer); route-level/feature-level error boundaries beyond the single root boundary; a Sentry adapter; Sentry account creation, DSN issuance, dependency installation, production integration (Stage 3 scope, separately Founder-authorized before it may begin).
- **Rollback:** `git revert` of this stage's own commit(s) on its dedicated branch — every change is additive (5 new files) or narrowly scoped; no existing Stage 1 file's prior behaviour was altered.
- **Report link:** [`docs/05-implementation/reports/ENG-P1-003-IMP-02-implementation-report-2026-07-27.md`](../05-implementation/reports/ENG-P1-003-IMP-02-implementation-report-2026-07-27.md).

---

## Entry 033 — `ENG-P1-003-IMP-01-CR1`: Provider-Boundary Privacy Correction

- **Date:** 26 July 2026
- **Performed by:** Claude (AI agent), per Founder review decision "Review decision — PR #19 — Changes required before merge" and task "TASK — ENG-P1-003-IMP-01-CR1: Provider-Boundary Privacy Correction".
- **Classification:** Correction applied directly to PR #19's existing branch (no new branch). No Sentry, no application wiring, no work-package expansion, no new stage begun. `ENG-P1-003` remains `In Progress`, not `Complete`. PR #19 remains unmerged.
- **Finding:** the Stage 1 `observabilityService` sanitized the caller-supplied structured `context` argument but passed several other diagnostic channels to the provider unsanitized — the raw exception/thrown value, the raw `captureMessage` string, the raw breadcrumb `message`/`category`, and the caller's user-context object with no runtime allow-list enforcement. A separate configuration-semantics inconsistency was also found (the internal gate checked only `config.enabled`, not `provider.isEnabled()`, while `isEnabled()` checked both).
- **Correction:** established and applied the invariant "no uncontrolled application diagnostic value crosses into a provider without sanitization or an explicit approved allow-list rule" across every channel. Added `sanitizeText()` (substring-scanning free-text redaction) and `sanitizeException()` (a plain, provider-neutral exception representation — `name`/`message`/`stack` sanitized as text, custom own properties sanitized structurally, `cause` walked to a bounded depth of 3). `setUserContext` now strictly allow-lists `actorId`/`businessId`/`customerId` as validated strings, never forwarding the caller's object. `addBreadcrumb` sanitizes `message`/`category` in addition to `data`. Unified the configuration gate (`isActive()`) so `guarded()`/`flush()`/`isEnabled()` can never disagree. Documented (without new runtime logic) the correlation-context lifecycle's dormant-risk status.
- **Tests:** 31 new/changed tests (9 in `sanitize.test.ts`, 11 in the new `sanitizeException.test.ts`, 11 in `observabilityService.test.ts`), all TDD (RED confirmed before each GREEN). Full observability suite: 84/84 passing (was 53). Full `apps/web` suite: 115/115 passing, zero regression. `functions`: 92/92 passing, unaffected (`functions/` confirmed byte-identical to `origin/main`). All 15 required CR1 test behaviors covered explicitly — see the correction report §27.13 for the full mapping.
- **Governance boundaries preserved:** no dependency added; no `@sentry` import; no DSN or secret; no external network call; `main.tsx`/`App.tsx` untouched; Firestore Rules untouched; no dashboard/alert created; `ENG-P1-003` not marked complete; PR #19 not merged.

### Files created (1)

- `apps/web/src/observability/sanitizeException.ts` (+ test)

### Files modified (7)

- `apps/web/src/observability/sanitize.ts` (+ test)
- `apps/web/src/observability/observabilityService.ts` (+ test)
- `apps/web/src/observability/types.ts`
- `apps/web/src/observability/correlationContext.ts`
- `apps/web/src/observability/index.ts`
- `docs/05-implementation/reports/ENG-P1-003-IMP-01-implementation-report-2026-07-26.md` (§27 correction section appended; §1–26 unchanged)

---

## Entry 032 — `ENG-P1-003-IMP-01`: Observability Foundation

- **Date:** 26 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — ENG-P1-003-IMP-01: Observability Foundation".
- **Classification:** Implementation (Stage 1 of `ENG-P1-003`). No Sentry account, SDK, DSN, dependency, or external network call. `ENG-P1-003` moved `Ready → In Progress`, not `Complete`.
- **Action:** Merged PR #18 (commit `eea58dd013340e666dbe7f41c43b65806fbefbe4`), verified post-merge CI green on that exact commit (run `30202500418`, first attempt). Verified all 12 required entry conditions before writing. Implemented, test-first (TDD), a provider-independent observability foundation under `apps/web/src/observability/`: a provider-neutral `DiagnosticsProvider` contract with no Sentry-specific concept; a no-op provider (the only active provider this stage — no network call, no account, no SDK); a recursive, bounded sanitization/redaction boundary (passwords, tokens, authorization headers, cookies, session secrets, API keys, payment-card data, and personal-data key names, plus JWT/token-shaped value detection); environment-aware configuration (`enabled`/`provider`/`environment`/`release`, no DSN field, fails safely on an unsupported provider identifier); a minimal frontend correlation-context carrier (browser-native `crypto.randomUUID()`, mirroring the backend's "resolve, never regenerate" semantics — the backend's own generator is unreachable from the browser); and a React-error-boundary integration point (a callback + types, no UI component). 53 new tests, all 18 required test behaviors covered; 84/84 total `apps/web` tests pass (zero regression); 92/92 `functions` unit tests unaffected (`functions/` untouched — confirmed via empty `git diff`).
- **Governance boundaries preserved:** no dependency added (`package.json`/lockfile diff empty); no Sentry import anywhere; no DSN or secret anywhere; `main.tsx`/`App.tsx` deliberately not wired (nothing consumes the service yet — that is future-stage work); `ENG-P1-003`'s Security/Storage Rules scope not begun.

### Files created (9)

- `apps/web/src/observability/types.ts`
- `apps/web/src/observability/noopProvider.ts` (+ test)
- `apps/web/src/observability/sanitize.ts` (+ test)
- `apps/web/src/observability/config.ts` (+ test)
- `apps/web/src/observability/correlationContext.ts` (+ test)
- `apps/web/src/observability/observabilityService.ts` (+ test)
- `apps/web/src/observability/errorBoundaryIntegration.ts` (+ test)
- `apps/web/src/observability/index.ts`
- `docs/05-implementation/reports/ENG-P1-003-IMP-01-implementation-report-2026-07-26.md`

### Files modified (3)

- `apps/web/.env.example` (3 new optional, non-secret placeholder lines)
- `docs/05-implementation/change-tracking/engineering-implementation-programme.md`
- `docs/05-implementation/change-tracking/coding-agent-prompt-register.md`

---

## Entry 031 — `ENG-P1-003-BP`: Operational Observability Blueprint

- **Date:** 26 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — ENG-P1-003-BP: Operational Observability Blueprint".
- **Classification:** Design-only addition. No implementation, no dependency, no configuration, no provider account, no application-code change. `ENG-P1-003` tracker status unchanged (`Ready`).
- **Action:** Merged PR #17 (Founder-approved, commit `494dca103b5970e332f64b9f9c9065ac893dc46a`), verified post-merge CI green on that exact commit (run `30200279870`, first attempt). Verified all 6 required entry conditions before writing — `DEC-PROV-005` `CONFIRMED`, `ENG-P1-003` `Ready`, no existing blueprint, governing documents (Platform Constitution CP-013, TRD20, TRD22 §22.11, Decision Register, `ENG-P1-002` blueprint and implementation code, Master Workflow, Engineering Implementation Programme) reviewed. Produced the [ENG-P1-003 Operational Observability Blueprint](../05-implementation/prompts/ENG-P1-003-engineering-blueprint-2026-07-26.md) — 14 design sections (philosophy, architecture with 3 diagrams, 13-row event taxonomy, logging model, frontend diagnostics behavior, backend observability, correlation strategy, incident workflow, closed privacy list, environment strategy, 6 failure modes, 9-row metrics catalogue, future extensibility for 6 named capabilities, non-binding implementation sequencing). Every contract referenced (`OperationalLog`, `ErrorCategory`, `correlationId`, `OutboxStatus`, `IdempotencyStatus`) was read directly from the live `ENG-P1-002` code and cited, not redefined. Terminology mapping applied: the task brief's "tenant" language mapped onto the platform's actual `businessId` field (confirmed via repository search that "tenant" is not this platform's vocabulary).
- **No monitoring implemented, no Sentry account, no dependency, no application code, no Firebase/Cloud Monitoring configuration, no dashboard, no alert.** `ENG-P1-003` implementation itself was not begun.

### Files created (2)

- `docs/05-implementation/prompts/ENG-P1-003-engineering-blueprint-2026-07-26.md`
- `docs/05-implementation/reports/ENG-P1-003-BP-implementation-report-2026-07-26.md`

### Files modified (0)

None besides this log and `docs/changes/IMPLEMENTATION_CHANGES.md`.

---

## Entry 030 — `DEC-PROV-005-DEC`: Founder Decision Recording and Programme Synchronization (Decision History)

- **Date:** 26 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — DEC-PROV-005-DEC: Founder Decision Recording and Programme Synchronization".
- **Classification:** Decision-history record — this entry is the append-only decision-history mechanism the Decision Register's own §1 designates ("the changes log records the update"); no separate `decision-history.md` file exists in this repository.

**Decision ID:** `DEC-PROV-005` (Error monitoring provider)

**Previous state:** `OPEN_PROVIDER`

**New state:** `CONFIRMED` (2026-07-26)

**Founder disposition (verbatim):**

> "Approve Option C — Native backend observability with dedicated frontend diagnostics. Firebase / Google Cloud remains the authoritative backend observability platform. Cloud Logging remains the authoritative operational log. Cloud Monitoring remains the authoritative backend monitoring platform. Frontend browser diagnostics will use a dedicated frontend diagnostics platform. Initial implementation target: Sentry. Backend error reporting will remain native unless a future governed decision changes the architecture. This decision approves the architecture only. It does not authorize: creation of a Sentry account; API keys or DSNs; dependency installation; implementation; production integration. Those occur only when implementation reaches the integration stage."

**Rationale summary:** the Founder reviewed the `DEC-PROV-005` Evidence Pack and Founder Decision Brief (both prepared under `DEC-PROV-005-PREP`, PR #16), which found that Cloud Error Reporting has no browser JavaScript SDK and directs client apps to the mobile-only Firebase Crashlytics — a confirmed gap against the decision's own explicit "frontend + server" question — while everything else Cloud Logging/Monitoring already does well (backend error capture, structured logging, correlation IDs, business/security/audit logs) requires zero new integration, since `ENG-P1-002` already targets Cloud Logging directly. Option C (the Technical Lead's own recommendation) closes the confirmed frontend gap with a scoped, frontend-only third-party tool rather than either accepting the gap (Option A) or duplicating the already-built backend foundation (Option B).

**Evidence references:** [DEC-PROV-005 Evidence Pack](decisions/evidence/DEC-PROV-005-error-monitoring-evidence-2026-07-26.md); [Founder Decision Brief](decisions/evidence/DEC-PROV-005-founder-brief-2026-07-26.md); [Source Register](decisions/evidence/DEC-PROV-005-source-register-2026-07-26.md); [Decision Register entry](decisions/decision-register.md).

**Implementation boundary:** this decision approves the architecture only. It does **not** authorize creation of a Sentry account, API keys/DSNs, dependency installation, implementation, or production integration — those occur only when implementation reaches the integration stage, under `ENG-P1-003`'s own, separately Founder-authorized implementation task.

**Action taken by this task:** merged PR #16 (Founder-authorized after an entry-condition check found it still open); verified post-merge CI green (one disclosed rerun — the same emulator-timing residual risk recurring on a docs-only commit); updated the Decision Register (`DEC-PROV-005` entry expanded to `CONFIRMED`, §5 summary counts recomputed, section header's now-inaccurate "all `OPEN_PROVIDER`" qualifier removed); cleared `ENG-P1-003`'s provider blocker in the Engineering Implementation Programme, Coding-Agent Prompt Register, and Master Workflow (`Blocked → Ready` — not `Started`/`In Progress`/`Complete`).

**Deliberately not touched, and why:** `DEC-TECH-005` (still `OPEN_ENGINEERING` in the register) and `DEC-LOY-008` (still `OPEN_FOUNDER`) were discovered stale during this task but are unrelated decisions — per this task's explicit "do not resolve any other decision" constraint, neither was touched; flagged in the accompanying report as a governance-integrity risk for separate follow-up. Application code, dependencies, Firebase configuration, EIR files, `BaseMetadata`/TRD10 §10.5, and Phase 1/Phase 2 status are all unchanged. `ENG-P1-003` was not started.

### Files created (1)

- `docs/05-implementation/reports/DEC-PROV-005-DEC-decision-recording-report-2026-07-26.md`

### Files modified (4)

- `docs/00-governance/decisions/decision-register.md`
- `docs/05-implementation/change-tracking/engineering-implementation-programme.md`
- `docs/05-implementation/change-tracking/coding-agent-prompt-register.md`
- `docs/05-implementation/11thonus-master-workflow.md`

---

## Entry 029 — `DEC-PROV-005-PREP`: Error Monitoring Provider Decision Evidence and Founder Brief

- **Date:** 26 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — DEC-PROV-005-PREP: Error Monitoring Provider Decision Evidence and Founder Brief".
- **Classification:** Evidence-only addition — decision preparation, not decision-making. `DEC-PROV-005` status unchanged (`OPEN_PROVIDER`); no provider selected, configured, or authorized; no dependency installed; no code modified; `ENG-P1-003` not begun.
- **Action:** Merged PR #15 (merge commit `1b07b55be9fc92526e2067486ad6014972f4b980`); post-merge CI on that commit required two reruns before passing (2 emulator-suite assertion failures, zero code difference across all 3 runs since PR #15 was documentation-only — a disclosed recurrence of the emulator-timing residual risk already accepted in the `ENG-P1-002` Technical Review, not a new defect). Verified all 8 required entry conditions before research began. Evaluated three qualified options (Firebase/Google Cloud native, Sentry, and a bounded hybrid) against 18 required criteria using current official Sentry/Google Cloud documentation and pricing pages accessed 2026-07-26, distinguishing verified fact from reasoned inference and provisional assumption throughout. Key finding: Cloud Error Reporting has no browser JavaScript SDK and its own documentation directs client apps to the mobile-only Firebase Crashlytics — a confirmed gap against `DEC-PROV-005`'s explicit "frontend + server" decision question. Produced an Evidence Pack, Founder Decision Brief, Source Register, and a proposed-but-unapplied Decision Register update (clearly labeled as such). Technical Lead recommendation (Option C — Sentry for frontend only, Google Cloud native for everything else) offered for discussion, not adopted.
- **No product, engineering-status, or decision-register change made.** `ENG-P1-002`, `ENG-P1-003`, and Phase 2 statuses are all unchanged; the `BaseMetadata`/TRD10 §10.5 conflict remains unresolved and untouched.

### Files created (5)

- `docs/00-governance/decisions/evidence/DEC-PROV-005-error-monitoring-evidence-2026-07-26.md`
- `docs/00-governance/decisions/evidence/DEC-PROV-005-founder-brief-2026-07-26.md`
- `docs/00-governance/decisions/evidence/DEC-PROV-005-source-register-2026-07-26.md`
- `docs/00-governance/decisions/evidence/DEC-PROV-005-proposed-updates-2026-07-26.md`
- `docs/05-implementation/reports/DEC-PROV-005-PREP-decision-preparation-report-2026-07-26.md`

### Files modified (0)

None besides this log and `docs/changes/IMPLEMENTATION_CHANGES.md`.

---

## Entry 028 — `EIR-ENG-P1-002-02`: Founder Approval and Administrative Closure

- **Date:** 26 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — EIR-ENG-P1-002-02: Founder Approval and Administrative Closure", executing the Founder's explicit, quoted authorization: "I approve `EIR-ENG-P1-002` as an accurate record of `ENG-P1-002` and authorize its transition from `Recorded` to `Administratively Closed` and locked."
- **Classification:** Material Change (locks a governance record; records Founder approval; does not change `ENG-P1-002`'s engineering status, does not authorize any further work).
- **Action:** Merged PR #14 (merge commit `4928245b4bae1e41694e74ac18182ece0fc3100f`), verified post-merge CI green on that exact commit ([run 30196043621](https://github.com/Fkenogo/11THONUS/actions/runs/30196043621)). Verified all 12 required entry conditions before editing — record existence, exact identifier `EIR-ENG-P1-002`, exact prior lifecycle state `Recorded`, not already approved/closed, `ENG-P1-002` remaining `Complete`, and the approval/locking rules (standard §9.2, §9.3, §3.4, §11) re-verified fresh from the live standard. Updated `records/version-1/phase-1/ENG-P1-002.md`: §1 Document Control, §2 Record Dashboard, §18 Completion Assessment, §19 Administrative Closure (Founder disposition quoted verbatim, approval authority/date, lock confirmation, future correction mechanisms), §21 References — no engineering history, evidence, findings, risks, or chronology rewritten. Record lifecycle state: **`Recorded` → `Administratively Closed`** (locked).
- **Deliberately not touched, and why:** `docs/05-implementation/11thonus-master-workflow.md` — contains no existing reference to `EIR-ENG-P1-002`, so nothing there is rendered stale by this closure (unlike `EIR-ENG-P1-001`'s own closure, which corrected an existing claim). `docs/README.md` — not named in this task's own explicit synchronization list. No Phase 1 Engineering Record exists yet.
- **No new governance introduced; no history reinterpreted; no engineering work begun.** `ENG-P1-002`'s `Complete` engineering status, Phase 1's status, `ENG-P1-003`'s `Blocked` status, and Phase 2's `Blocked` status are all unchanged. The `BaseMetadata`/TRD10 §10.5 conflict remains unresolved. No further work package is authorized by this closure.

### Files created (1)

- `docs/05-implementation/reports/EIR-ENG-P1-002-administrative-closure-record-2026-07-26.md`

### Files modified (2)

- `records/version-1/phase-1/ENG-P1-002.md` (locked at `Administratively Closed`)
- `records/history-index.md`

---

## Entry 027 — `EIR-ENG-P1-002-01`: Engineering Implementation Record Creation

- **Date:** 26 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — EIR-ENG-P1-002-01: Engineering Implementation Record Creation", following the Founder's explicit authorization ("PR #13 / Approved for merge... proceed directly to the Engineering Implementation Record for `ENG-P1-002`").
- **Classification:** Material Change (creates a new governance-record class instance — the first EIR drafted directly within this task, rather than backfilled retroactively; does not approve, lock, or administratively close the record; does not change `ENG-P1-002`'s `Complete` status or any phase status).
- **Action:** Merged PR #13 (merge commit `650349f97243ea2017a5b37145345762adb71e56`), verified post-merge CI green on that exact commit ([run 30194471724](https://github.com/Fkenogo/11THONUS/actions/runs/30194471724)). Verified all 8 required entry conditions before drafting. Created `EIR-ENG-P1-002` (`records/version-1/phase-1/ENG-P1-002.md`) per the [Engineering Implementation Records Standard](../06-engineering-governance/engineering-implementation-records-standard.md) and its template — all 22 mandatory sections populated, every fact (commit SHAs, PR merge commits/dates, CI run IDs, Decision Register/RTM citations) re-verified fresh against the live repository and GitHub rather than copied from prior summary reports. Record lifecycle state: `Recorded` (drafted, not approved — per standard §9.2, a coding agent never self-approves a record).
- **`EIR-ENG-P1-001` reviewed as precedent, without copying inapplicable facts:** `ENG-P1-002` has no live-infrastructure or Founder-pull/Preview-Review component (Definition of Done §2.8–2.10 all `N/A`, matching `ENG-P0-002`'s own precedent) — §12/§14 of the new record reflect that accurately rather than adapting `ENG-P1-001`'s own infrastructure-heavy text.
- **Tracker update — the only one this task performs, per standard §13's own rule tying an index update to a record's lifecycle-state change:** `records/history-index.md`'s `ENG-P1-002` row updated (`Ready` → `Complete` engineering status, corrected to match the live Programme/Register value; Record column linked; Record lifecycle state `Recorded`); Phase 1 narrative line updated to reflect both work packages now `Complete`.
- **No new governance introduced; no history reinterpreted; no engineering work begun.** `ENG-P1-002`'s `Complete` status, Phase 1's status, and Phase 2's `Blocked` status are all unchanged by this task. `ENG-P1-003` and `ENG-P2-001` were not started. The `BaseMetadata`/TRD10 §10.5 conflict was not resolved.

### Files created (2)

- `records/version-1/phase-1/ENG-P1-002.md` (`EIR-ENG-P1-002`)
- `docs/05-implementation/reports/EIR-ENG-P1-002-01-implementation-report-2026-07-26.md`

### Files modified (2)

- `records/history-index.md`
- `docs/00-governance/documentation-changes-log.md` (this entry) — `docs/changes/IMPLEMENTATION_CHANGES.md` logged separately per its own convention

---

## Entry 026 — `ENG-P1-002-MC`: Merge Verification and Lifecycle Closure Preparation

- **Date:** 25 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — ENG-P1-002-MC: Merge Verification and Lifecycle Closure Preparation", following the Founder's explicit merge authorization ("Approval to merge PR #12 now").
- **Classification:** Material Change (merges application code to `main`; moves `ENG-P1-002` to `Complete`; prepares, but does not create, EIR input material; adds a Phase 2 entry-criterion; does not begin Phase 2).
- **Action:** Merged PR #12 (merge commit `6230a72079cea69b074b21404ebc33cac5c93d0f`, containing final pre-merge head `87da193f52a2bc129488207b8e274fffe038819f`). Verified all 7 required entry conditions before any change. Re-ran full validation against a fresh checkout of `origin/main` at the exact merge commit — 92/92 `functions` unit tests, 31/31 `apps/web` unit tests, 23/23 real Firebase Emulator Suite integration tests (concurrency tests unmodified, per this task's own explicit instruction not to weaken them over historical CI timing variance), 1/1 Playwright e2e, 0 broken documentation links, 0 secret-pattern matches — and confirmed post-merge CI green on the exact merge commit. Completed a full Definition-of-Done accounting (12 criteria): all satisfied or correctly `N/A` (criteria 8–10 — Founder pull/deploy, Preview Review, Manual Testing — `N/A` for the same documented reason `ENG-P0-002` used: no deployment target, no Manual QA required for this server-only shared foundation). `ENG-P1-002` moved `Approved → Complete`.
- **Carry-forward observation, not a reopened `ENG-P1-002` defect:** the `BaseMetadata`/TRD10 §10.5 authority conflict (found during Technical Review) is recorded as an explicit additional entry-criterion on the Engineering Implementation Programme's Phase 2 profile — it must be resolved before any Phase 2 work package persists a document using `stampCreate`/`stampUpdate`/`BaseMetadata`. Not resolved by this task.
- **No new governance introduced; no history reinterpreted; no domain work begun.** No EIR was created (an input package was prepared for a future, separately-authorized task, mirroring the one-day gap between `ENG-P1-001`'s own `Complete` and its `EIR-03` creation). Phase 2 was not begun.

### Files created (2)

- `docs/05-implementation/reports/ENG-P1-002-merge-verification-report-2026-07-25.md`
- `docs/00-governance/documentation-changes-log.md` (this entry) — `docs/changes/IMPLEMENTATION_CHANGES.md` logged separately per its own convention

### Files modified (2)

- `docs/05-implementation/change-tracking/engineering-implementation-programme.md` (`ENG-P1-002` row → `Complete`; Phase 2 entry-criterion added)
- `docs/05-implementation/change-tracking/coding-agent-prompt-register.md` (`ENG-P1-002` row → `Complete`; §5 distribution updated)

---

## Entry 025 — `ENG-P1-002-TR`: Technical Review Finalization and Merge Preparation

- **Date:** 25 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — ENG-P1-002-TR: Technical Review Finalization and Merge Preparation", following the Founder's explicit sequencing decision (Merge PR #11 → synchronize PR #12 evidence → Technical Review → merge PR #12 → post-merge CI → EIR lifecycle).
- **Classification:** Material Change (merges the Engineering Blueprint PR; records a formal Technical Review verdict; moves `ENG-P1-002`'s lifecycle status; does not merge PR #12, does not mark `ENG-P1-002` `Complete`, does not begin `ENG-P1-003`/Phase 2).
- **Action:** Verified all 6 entry conditions (PR #11 state, PR #12 exact head `587c9c33de6a93a36191f66ba7ad6f2b052abb68`, PR #12 mergeability, CI green on that head, clean working tree, `ENG-P1-002` `Under Review`), then merged PR #11 (merge commit `82a9af748cc53cfa5afbedfc933ec207e307fcdd`, post-merge CI green). Reviewed PR #11's 4 automated Codex review comments against primary sources: two (non-atomic reservation; unsafe outbox crash window) confirmed already resolved by `ENG-P1-002-CR1`'s implementation, even though the now-merged blueprint text itself was not retroactively edited (historical-document convention); one (actor/identity resolution) confirmed as the already-disclosed `userId`/`authUid` Phase-2 dependency; one (metadata field naming) confirmed as a **genuine, previously-uncaught conflict** between the Version 1 Engineering Blueprint §3.3 and TRD10 §10.5 over the shared `BaseMetadata` shape (`version` vs `schemaVersion`, audit-field nullability, `currencyCode`/`timezone`/`archivedAt`/`archivedBy` vs the implemented shape) — zero current runtime impact (no domain consumer exists yet), recorded as a new non-blocking Technical Review observation rather than corrected in code (no factual validation failure existed to correct).
- **Technical Review recorded:** verdict **Approved with non-blocking operational observations** — zero Critical or blocking-High findings; six observations (five Founder-specified, one additional from this review's own independent verification, above). `ENG-P1-002` status moved `Under Review` → `Approved` on the Engineering Implementation Programme and Coding-Agent Prompt Register; **not** marked `Complete`.
- **Evidence synchronized:** PR #12's description updated so it no longer presents the original 87/87 unit / 14/14 emulator counts as final — now shows 92/92 / 23/23, both `CR1` correction commits, the final head, and the Technical Review verdict, with the original summary preserved (not rewritten) and the update appended as its own section.
- **No new governance introduced; no history reinterpreted; no domain work begun.** PR #12 was **not** merged, per this task's explicit constraint.

### Files created (2)

- `docs/05-implementation/reports/ENG-P1-002-technical-review-2026-07-25.md`
- `docs/00-governance/documentation-changes-log.md` (this entry) — `docs/changes/IMPLEMENTATION_CHANGES.md` logged separately per its own convention

### Files modified (2)

- `docs/05-implementation/change-tracking/engineering-implementation-programme.md`
- `docs/05-implementation/change-tracking/coding-agent-prompt-register.md`

---

## Entry 024 — `ENG-P1-002-CR1`: Concurrency Safety Correction

- **Date:** 25 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — ENG-P1-002-CR1: Concurrency Safety Correction", against defects identified in `FAR-001` (Foundation Architecture Review Package).
- **Classification:** Material Change (bounded correction to already-committed application code on the still-open `chore/eng-p1-002-shared-foundation` branch; resolves one mid-task decision gap the Founder was asked to and did adjudicate; does not alter the existing authority hierarchy; does not begin domain work).
- **Action:** Corrected two concurrency-safety defects in `ENG-P1-002`'s shared foundation: (A) idempotency reservation is now a single atomic Firestore transaction (previously two independent calls with no exclusion), and duplicate-handling is now status-aware (previously could fabricate a success from an in-flight or failed record); (B) the outbox processor now atomically claims exclusive ownership of an entry before invoking a handler, with expired-claim recovery and stale-worker rejection (previously no claim step existed at all). Mid-implementation, the originally-planned no-new-schema mechanism for (B) was empirically disproven by its own failing real-emulator tests (Firestore does not advance a document's `updateTime` on a same-value write); execution stopped and reported the gap rather than forcing a broken guarantee or inventing schema silently. The Founder authorized a minimal new field, `OutboxEntry.claimedAt`, which was then implemented and verified — see the Correction Report §"Mid-Implementation Stop."
- **Test evidence:** unit tests 92/92 (up from 87/87); real Firebase Emulator Suite integration tests 23/23 (up from 14/14), including all 7 concurrency scenarios the task required, each proven against the live emulator rather than assumed.
- **No new governance introduced; no history reinterpreted; no domain work begun.** `ENG-P1-002` remains `Under Review`, not `Complete`. PR #12 was not merged, per this task's explicit constraint.

### Files modified (9)

- `functions/src/shared/idempotency/idempotencyService.ts`, `.test.ts`, `.emulator.test.ts`
- `functions/src/shared/commands/commandDispatcher.ts`, `.test.ts`, `.emulator.test.ts`
- `functions/src/shared/outbox/outboxEntry.ts`, `outboxProcessor.ts`, `outboxProcessor.emulator.test.ts`

### Files created (2)

- `docs/05-implementation/reports/ENG-P1-002-CR1-concurrency-safety-correction-report-2026-07-25.md`
- `docs/00-governance/documentation-changes-log.md` (this entry) — `docs/changes/IMPLEMENTATION_CHANGES.md` logged separately per its own convention

---

## Entry 023 — `ENG-P1-002`: Shared Engineering Foundation Implementation

- **Date:** 25 July 2026
- **Performed by:** Claude (AI agent), per Founder task "TASK — ENG-P1-002: Shared Engineering Foundation Implementation", against the approved [Engineering Blueprint](../05-implementation/prompts/ENG-P1-002-engineering-blueprint-2026-07-25.md).
- **Classification:** Material Change (first application code committed to `functions/src/shared/`; resolves no open decision, does not alter the existing authority hierarchy, does not begin any domain work package).
- **Action:** Implemented the shared `authenticate → validate → log → respond` command foundation (command/event contracts, correlation-ID service, structured logging, idempotency service, event outbox with retry/dead-letter handling, shared error contract, shared actor/request validation, and the command dispatcher tying them together), test-first (TDD) throughout, every type derived field-for-field from already-approved TRD11/TRD10/TRD20 text per the Engineering Blueprint's own Contract Realization section. Two real defects (a logger false-positive on this project's own `SCREAMING_SNAKE_CASE`/`lower_snake_case` status labels) were found and fixed via the same TDD/real-emulator-testing process before this entry — see the Implementation Report §7. `ENG-P1-002` status moved `Ready` → `Under Review` on the Engineering Implementation Programme and Coding-Agent Prompt Register, pending Technical Review.
- **No new governance introduced; no history reinterpreted; no domain work begun.** No Firestore Security Rules authored; no new deployed Cloud Function added; no application code outside `functions/src/shared/` touched.

### Files created (39)

- 18 source modules and 20 test files (17 unit, 3 real-Firebase-Emulator-Suite integration) under `functions/src/shared/`
- `functions/vitest.emulator.config.ts`
- `docs/05-implementation/reports/ENG-P1-002-implementation-report-2026-07-25.md`

### Files modified (5)

- `functions/vitest.config.ts`, `functions/package.json`, `docs/00-governance/documentation-changes-log.md` (this entry) — `package.json` (root) and `docs/changes/IMPLEMENTATION_CHANGES.md` logged separately per their own conventions
- `docs/05-implementation/change-tracking/engineering-implementation-programme.md`
- `docs/05-implementation/change-tracking/coding-agent-prompt-register.md`

---

## Entry 022 — EIR Administrative Closure: `EIR-ENG-P1-001`

- **Date:** 25 July 2026
- **Performed by:** Claude (AI agent), recording explicit Founder approval given in chat authorization ("Founder Governance Review — GEL-002 disposition" / "FOUNDER AUTHORIZATION — PR #9 MERGE AND EIR ADMINISTRATIVE CLOSURE").
- **Classification:** Non-material synchronization / EIR lifecycle metadata (moves `EIR-ENG-P1-001` from `Recorded` to `Administratively Closed` per the Founder's explicit approval; introduces no new governance, resolves no open decision, begins no engineering work, and does not alter the existing authority hierarchy).
- **Action:** Per Engineering Implementation Records Standard §9.2, only the Founder may perform this transition — the Founder did so explicitly in the governing chat authorization, reviewing and approving `EIR-ENG-P1-001` as an accurate historical implementation record. Recorded the approval in the EIR itself (`records/version-1/phase-1/ENG-P1-001.md` §1, §2, §18, §19 — approval authority, date, lifecycle transition, lock confirmation, and future-amendment mechanism per §6.4), and synchronized every other live tracker that explicitly stated the record's prior `Recorded` status: [Records History Index](../../records/history-index.md), [Master Workflow](../05-implementation/11thonus-master-workflow.md) §8 (EIR-03 status cell and Terminology note), and the [Documentation Index](../README.md) banner (new leading entry; the prior `GEL-002` entry's own point-in-time text left untouched, per the Historical Record Principle).
- **No history reinterpreted; no engineering work-package status changed.** §22 (Amendment History) of the EIR was not touched — administrative closure is not itself an amendment; the Amendment mechanism (standard §6.4) applies only if `ENG-P1-001` is later formally reopened. `ENG-P1-002-PREP`/`ENG-P1-002` were not authorized or begun by this action — the EIR standard note is explicit that record closure does not itself authorize further engineering work (standard §11.5).
- **Note on `IMPLEMENTATION_CHANGES.md`:** no entry was added there for this action. Standard §11.3 requires this Documentation Changes Log entry unconditionally, but only says an `IMPLEMENTATION_CHANGES.md` entry "may additionally" be made where the edit is also part of an active engineering task's own tracked history. This action is a governance-record lifecycle event, not an engineering implementation task, so this log entry alone satisfies the standard's requirement — disclosed here rather than silently decided.

### Files modified (4)

- `records/version-1/phase-1/ENG-P1-001.md`
- `records/history-index.md`
- `docs/05-implementation/11thonus-master-workflow.md`
- `docs/README.md`

---

## Entry 021 — `GEL-002`: Governance Baseline Final Synchronization

- **Date:** 24 July 2026
- **Performed by:** Claude (AI agent), under Governed Execution Loop `GEL-002` ("Governance Baseline Final Synchronization"), per Founder authorization
- **Classification:** Non-material synchronization (corrects status fields and cross-references in existing governance trackers to reflect `GOV-GEL-001` (PR #7) and `EIR-ENG-P1-001` (PR #8) landing on `main`; introduces no new governance, resolves no open decision, begins no engineering work, and does not alter the existing authority hierarchy).
- **Precondition executed by this loop:** merged PR #7 (`edb4db8f`); diagnosed PR #8's resulting merge conflict against the new `main` read-only via `git merge-tree`, found it to be two purely mechanical append-order collisions (this log and `docs/changes/IMPLEMENTATION_CHANGES.md`), and — under explicit, freshly-obtained Founder authorization for this specific instance — resolved both by chronological reordering (see Entry 020's own "Note on numbering" above) and merged PR #8 (`f4b77ef2`).
- **Action:** With `EIR-01`–`EIR-03` all `Complete` on `main`, synchronized every live governance tracker whose `EIR-03`/`ENG-P1-002-PREP` gating status field or cross-reference was factually made stale by that baseline: [Master Workflow](../05-implementation/11thonus-master-workflow.md) §8/§17/§1, [Engineering Implementation Programme](../05-implementation/change-tracking/engineering-implementation-programme.md), [Coding-Agent Prompt Register](../05-implementation/change-tracking/coding-agent-prompt-register.md), [Records History Index](../../records/history-index.md), the `EIR-ENG-P1-001` record's own forward-looking cross-references (record still `Recorded`, not locked — in-place correction per Engineering Implementation Records Standard §9.3), and the [Documentation Index](../README.md) banner. Each occurrence now states that the EIR governance stream's sequencing condition is satisfied without declaring `ENG-P1-002-PREP` itself authorized, which remains a separate, not-yet-taken Founder decision.
- **No new governance introduced; no history reinterpreted; no engineering work-package status changed.** Historical, point-in-time reports and changelog entries (this log's own Entry 020, the `GEL-001` report files, `IMPLEMENTATION_CHANGES.md`'s prior entries) were deliberately left untouched, per the Historical Record Principle. `ENG-P1-002` was not begun; no Phase 2 work was begun; no application code, infrastructure, architecture, Engineering Governance content, Constitution, or Decision Register entry was touched.

### Files modified (6)

- `docs/05-implementation/11thonus-master-workflow.md`
- `docs/05-implementation/change-tracking/engineering-implementation-programme.md`
- `docs/05-implementation/change-tracking/coding-agent-prompt-register.md`
- `records/history-index.md`
- `records/version-1/phase-1/ENG-P1-001.md`
- `docs/README.md`

---

## Entry 019 — `GOV-GEL-001`: Governed Execution Loops Standard

- **Date:** 24 July 2026
- **Performed by:** Claude (AI agent), per founder task "GOV-GEL-001: Governed Execution Loops Standard"
- **Classification:** Material Change (introduces a new governance document and a new document class — Governed Execution Loops; resolves no open decision, authorizes no engineering work, and does not alter the existing authority hierarchy).
- **Action:** Created the Governed Execution Loops Standard — a new `docs/06-engineering-governance/` document defining how a Founder-authorized objective may be executed continuously by an agent across multiple internal steps (boundaries, checkpoints, stop conditions, loop lifecycle, loop types), grounded in and cross-referenced against the existing Coding Agent Standard, Implementation Prompt Standard, Technical Review Standard, Roles & Responsibilities, Engineering Principles, Master Workflow, and Engineering Implementation Records Standard, rather than restating or duplicating any of them. Establishes six binding governance principles (Governance Before Autonomy, Objectives Over Tasks, Milestones Over Interruptions, Execution Should Only Stop for Decisions Not Discussions, Bounded Autonomy, Founder Authority Preservation). Added the standard to the Engineering Governance section's own document index (README.md row 14) — the same minimum-discoverability step taken for `EIR-01`.
- **No execution loop created, populated, or authorized by this task.** No loop template, tracking file, or example loop instance was created — the standard's own Examples section (§16) cites already-completed, non-loop-authorized prior tasks purely as illustrative precedent, explicitly disclosed as such. No engineering work package was begun or authorized. No application code, technical decision, or the authority hierarchy was touched.

### Files created (1)

- `docs/06-engineering-governance/governed-execution-loops-standard.md`

### Files modified (1)

- `docs/06-engineering-governance/README.md` — added row 14 to the section's Documents index.

---

## Entry 020 — `EIR-03` / `GEL-001`: ENG-P1-001 Historical Closure Record

- **Date:** 24 July 2026
- **Performed by:** Claude (AI agent), under Governed Execution Loop `GEL-001` ("EIR-03 — ENG-P1-001 Historical Closure"), per Founder authorization
- **Classification:** Material Change (creates the first populated Engineering Implementation Record and the `records/version-1/phase-1/` structure it lives in; resolves no open decision, begins no engineering work, and does not alter the existing authority hierarchy).
- **Action:** Created `EIR-ENG-P1-001` — the historical closure record for `ENG-P1-001`, citing its full evidence chain (Implementation Report, Technical Review, infrastructure reports, Closure Report, PR #2/#3, CI runs) per the Engineering Implementation Records Standard's mandatory content model. Synchronized `records/history-index.md` (linked the new record; corrected `ENG-P1-001`'s row from a stale `Pushed` status to the live `Complete` value, per the index's own authority-disclaimer rule that it must match the authoritative trackers). Updated `records/README.md`'s "What exists today" section, which was the one piece of navigation directly made stale by the new record's existence.
- **No new governance introduced; no history reinterpreted.** Every fact in the new record is cited to an existing, already-merged primary source — nothing was reconstructed or newly asserted. No engineering work-package status was changed as a side effect (the `Complete` status already existed on `main`; the record only cites it). `ENG-P1-002` was not begun; no Phase 2 work was begun; no application code, infrastructure, architecture, Engineering Governance content, Constitution, or Decision Register entry was touched.
- **Note on numbering:** this entry was originally drafted as "Entry 019" against this branch's own base (`origin/main` at `67cec797...`), before the also-pending `GOV-GEL-001` PR (which independently claimed the same number against its own base) merged first. Renumbered to Entry 020 on reconciliation, per true chronological commit order (`GOV-GEL-001`'s original Entry 019 committed 2026-07-24T15:25:15+02:00; this entry's original commit 2026-07-24T16:10:23+02:00) — content and meaning unchanged, only the entry number and its position in the log.

### Files created (1)

- `records/version-1/phase-1/ENG-P1-001.md`

### Files modified (2)

- `records/history-index.md`
- `records/README.md`

---

## Entry 018 — `EIR-02`: Engineering Implementation Records Repository Integration

- **Date:** 24 July 2026
- **Performed by:** Claude (AI agent), per founder task "EIR-02: Engineering Implementation Records Repository Integration"
- **Classification:** Material Change (introduces a new top-level repository area and adds narrow navigation cross-references; resolves no open decision, changes no work-package status, and does not alter the existing authority hierarchy).
- **Precondition executed first:** per Founder authorization, merged [PR #4](https://github.com/Fkenogo/11THONUS/pull/4) (`EIR-01`, head `712d8b98`) into `main` via a standard merge commit (`0e02d05`), verified `mergeStateStatus: CLEAN`, `mergeable: MERGEABLE`, all 3 review threads resolved, and post-merge CI green on `main` before proceeding — this satisfied EIR-02's own entry gate (the standard must already be merged before its repository integration begins).
- **Action:** Created the `records/` repository structure specified by the Engineering Implementation Records Standard §12 — `records/README.md` (section orientation), `records/history-index.md` (the Engineering History Index, standard §13), and the three governed templates (`records/templates/engineering-implementation-record-template.md`, `phase-engineering-record-template.md`, `version-engineering-record-template.md`), each implementing the mandatory content model in standard §10.1–10.3. Added narrow navigation cross-references only where a genuine discoverability requirement existed: [Documentation Index](../README.md) §3 (new "Engineering Implementation Records" document group) and the [Master Workflow](../05-implementation/11thonus-master-workflow.md) §8/§17 (additive recognition of the `EIR-01`/`EIR-02`/`EIR-03` governance stream and its Founder-directed gating of `ENG-P1-002-PREP`). **No populated Engineering Implementation Record, Phase Engineering Record, or Version Engineering Record was created** — `version-1/` and its phase folders are deliberately not created yet (nothing legitimate to place in them before `EIR-03`/`EIR-04`, and empty directories are not tracked by Git). No engineering work-package status, Decision Register entry, Master Workflow sequencing decision (beyond the additive EIR-stream recognition explicitly authorized for this task), or Programme/Register status was changed.
- **Deliberately not touched, with rationale:** the Documentation Manifest (`docs/00-governance/documentation-manifest-v1.md`) was evaluated and left untouched — it has been substantially stale since Engineering Decision Sprints 1–2 for reasons unrelated to `EIR-02` (missing the Master Workflow, `ENG-P1-001`'s own reports, the Cloud Environment & Deployment Strategy, and `EIR-01` itself, among others); adding one isolated row for the records framework while leaving that larger, pre-existing gap untouched would misleadingly suggest the manifest is "caught up" through `EIR-02` when it is not. A full manifest regeneration is out of this task's narrow scope. The Engineering Governance section README (`docs/06-engineering-governance/README.md`) was also left untouched — its row 13 (added under `EIR-01`'s correction pass) already links the standard, and `records/` itself lives outside that section, discoverable instead via the Documentation Index update above.

### Files created (5)

- `records/README.md`
- `records/history-index.md`
- `records/templates/engineering-implementation-record-template.md`
- `records/templates/phase-engineering-record-template.md`
- `records/templates/version-engineering-record-template.md`

### Files modified (2)

- `docs/README.md` — new "Engineering Implementation Records" document group in §3; banner updated.
- `docs/05-implementation/11thonus-master-workflow.md` — additive EIR-governance-stream table and note appended to §8 and §17; Document Control "Last controlled update" field updated. No existing sequencing, status, or approved content rewritten.

### Explicitly NOT done (per constraints)

No populated `EIR-ENG-P1-001` created (that is `EIR-03`). No populated Phase 1 or Version 1 Engineering Record created (that is `EIR-04`/later). No engineering work-package status changed. `ENG-P1-002` was not begun and remains unauthorized. No product, technical, legal, security, or architecture decision was altered. No application code or live infrastructure was touched.

---

## Entry 017 — `EIR-01`: Engineering Implementation Records Standard

- **Date:** 23 July 2026
- **Performed by:** Claude (AI agent), per founder task "EIR-01: Engineering Implementation Records Standard"
- **Classification:** Material Change (introduces a new governance document and a new document class; resolves no open decision, changes no requirement, and does not alter the existing authority hierarchy — see the standard's own §14 guarantees).
- **Action:** Created the Engineering Implementation Records Standard — a new `docs/06-engineering-governance/` document defining a governed, non-authoritative historical-record framework (Engineering Implementation Record → Phase Engineering Record → Version Engineering Record) for engineering work packages. Corrected during pre-merge review (PR #4, `chatgpt-codex-connector[bot]`) to: (a) resolve a self-contradiction between the Immutability Principle and the One-Record Principle regarding reopened work packages, by defining an explicit, append-only Amendment procedure (§3.5, §6.4) that never creates a second record for the same work package; (b) record this governance change here, per this log's own requirement ([Documentation Index](../README.md) §6 Rule 1; Engineering Governance Charter §8) — the change was initially logged only in `docs/changes/IMPLEMENTATION_CHANGES.md`, which remains a valid additional record of engineering-track activity but does not substitute for this log; (c) add the new standard to the Engineering Governance section's own document index. **No repository folder, template, or actual Engineering Implementation Record was created** (deferred to `EIR-02`/`EIR-03`/`EIR-04`, none authorized by this task). No engineering status, Decision Register entry, Master Workflow position, or Programme/Register status was changed.

### Files created (1)

- `docs/06-engineering-governance/engineering-implementation-records-standard.md`

### Files modified (2)

- `docs/06-engineering-governance/README.md` — added row 13 to the section's Documents index.
- `docs/changes/IMPLEMENTATION_CHANGES.md` — original creation entry (2026-07-23), unchanged; this Documentation Changes Log entry is additional, not a replacement.

### Explicitly NOT done (per constraints)

`EIR-02` repository integration (`records/` folder, README, templates, history index; Documentation Index / Manifest / Master Workflow updates beyond this section's own index); `EIR-03` backfill of `EIR-ENG-P1-001`; `EIR-04` Phase 1 Engineering Record; any change to an engineering work-package's status, a Decision Register entry, or the Master Workflow's current position.

---

## Entry 016 — Engineering Decision Sprint 2: Engineering Decision Confirmation & Phase 0 Authorization

- **Date:** 17 July 2026
- **Performed by:** Claude (AI agent), per founder instruction "TASK — Engineering Decision Sprint 2 / Engineering Decision Confirmation & Phase 0 Authorization" — the final governance checkpoint before engineering starts.
- **Scope:** Decision Register status changes (explicitly instructed this sprint, unlike every prior "prepare, don't apply" phase), governance-document synchronization, Engineering Implementation Programme/Prompt Register updates, and a new Phase 0 Authorization record. **No repository created; no git initialized; no code written; no package manifest generated; no dependency installed; no CI/CD created; no Firebase project created; no Founder-owned or Provider-owned decision touched; no product requirement, business rule, or Constitution content changed; no PRD or TRD content changed; no unrelated files modified.**

### Decision Register Changes (4 records — `docs/00-governance/decisions/decision-register.md`)

| Decision | Old Status | New Status | Basis |
|---|---|---|---|
| **DEC-TECH-003** — Frontend tooling set | OPEN_ENGINEERING | **CONFIRMED** | [DEC-TECH-003 Engineering Stack Evaluation & Recommendation](decisions/dec-tech-003-engineering-stack-recommendation.md) (Engineering Decision Sprint 1) |
| **DEC-TECH-004** — Repository structure | OPEN_ENGINEERING | **CONFIRMED** | [Engineering Decision Closure Recommendations](decisions/engineering-decision-closure-recommendations.md) §3 (Engineering Transition Phase 0B) |
| **DEC-TECH-006** — Event delivery mechanism (outbox) | OPEN_ENGINEERING | **CONFIRMED** (pattern level; schema detail deferred to Pass 2/ENG-P1-002) | Engineering Decision Closure Recommendations §3 |
| **DEC-TECH-007** — Idempotency storage approach | OPEN_ENGINEERING | **CONFIRMED** (policy level; per-operation schema deferred to Pass 2/ENG-P1-002) | Engineering Decision Closure Recommendations §3 |

Each record's Final decision, Decision date (2026-07-17), Approved by ("Engineering Lead, confirmed under Founder-directed Engineering Decision Sprint 2"), Implementation consequences, Document corrections required, and Notes fields were filled per the [Decision Update Procedure](decision-update-procedure.md). **DEC-SEC-001, DEC-TECH-005, and DEC-DATA-007 were reviewed and left OPEN_ENGINEERING** — each still genuinely blocked (unproven external Burundi-OTP capability; unperformed regional evaluation plus an unresolved DEC-LEGAL-006 legal input; and an unreviewed Phase 0A proposal, respectively). No Founder-owned (DEC-LOY-008, DEC-ID-003) or Provider-owned (DEC-PROV-004, DEC-PROV-005) decision was touched. Live register status counts before: 15 OPEN_ENGINEERING; after: 11 OPEN_ENGINEERING, 4 newly CONFIRMED (verified via `grep -oE "Status: \*\*[A-Z_]+\*\*" decision-register.md | sort | uniq -c`).

### Created (2)

- `docs/05-implementation/phase-0-authorization.md` — the official authorization to begin engineering: purpose, authorization date, engineering baseline, the 4 approved decisions (table above), prerequisites satisfied, repository-initialization authorization, Phase 0 scope (ENG-P0-001 Ready, ENG-P0-002 still sequentially blocked), explicit exclusions, and Phase 1 entry conditions (DEC-TECH-005 and DEC-PROV-005 still required).
- `docs/05-implementation/reports/eng-decision-sprint-2-report-2026-07-17.md` — full implementation report (this sprint's required 10-item report).

### Modified (13)

- `docs/00-governance/decisions/decision-register.md` — 4 records confirmed (table above).
- `docs/02-technical/version-1-engineering-blueprint.md` — §1.3 updated: DEC-TECH-003 now stated as CONFIRMED with the full stack named; DEC-TECH-005 remains the sole unresolved architecture-level item.
- `docs/03-standards/engineering-standards/README.md` — Pass 2 index reworded: DEC-TECH-003/006/007-gated items no longer described as decision-blocked, only sequencing-blocked (pending their work package); DEC-TECH-005-gated item remains decision-blocked.
- `docs/03-standards/engineering-standards/linting-and-formatting-conventions.md` — §5 renamed "Tool Selection — Confirmed"; §1 and §6 wording updated to remove "pending DEC-TECH-003."
- `docs/03-standards/engineering-standards/repository-and-folder-standards.md` — §3 workspace-split note and §6 "not covered" bullets updated from "OPEN_ENGINEERING"/"deferred until resolves" to "CONFIRMED... Pass 2 mechanical detail."
- `docs/00-governance/decisions/engineering-transition-d1-agenda.md` — DEC-TECH-003/004/006/007 entries, §6 summary table, and §7 updated to CONFIRMED; historical framing ("this agenda does not approve...") preserved with a pointer to Sprint 2 as the point where approval actually occurred.
- `docs/00-governance/decisions/engineering-decision-closure-recommendations.md` — status banner added noting the 3 prepared closures (DEC-TECH-004/006/007) were applied in Sprint 2; original analysis preserved unchanged as audit record.
- `docs/00-governance/decisions/dec-tech-003-engineering-stack-recommendation.md` — §11 status banner added noting the prepared register update was applied in Sprint 2; prepared text preserved unchanged as audit record.
- `docs/00-governance/decisions/README.md` — closure-recommendations and DEC-TECH-003-doc row descriptions updated to reflect application; new row for `phase-0-authorization.md`.
- `docs/00-governance/documentation-manifest-v1.md` — ENG-P0-001-draft and Linting/Formatting rows updated to Ready/CONFIRMED; new §13A/§13B catalog the 4 documents from Sprints 1–2 not previously captured (catch-up, same pattern as Phase 8's §12); totals corrected 106→110 authoritative/working, 135→139 grand total.
- `docs/05-implementation/change-tracking/engineering-implementation-programme.md` — Phase 0 profile and ENG-P0-001/ENG-P0-002 rows updated (ENG-P0-001 now Ready); Phase 1 profile and ENG-P1-002 row updated (decision dependencies resolved, sequencing remains); §B.1 overview table Phase 0/Phase 1 rows updated.
- `docs/05-implementation/change-tracking/coding-agent-prompt-register.md` — ENG-P0-001 row Blocked→Ready; ENG-P1-002 row's Decision Dependencies annotated CONFIRMED; §5 Current Distribution updated (Ready 1, Blocked 46) with an explanatory note.
- `docs/05-implementation/prompts/ENG-P0-001-draft.md` — banner rewritten from "NOT YET AUTHORIZED" to "DECISIONS CONFIRMED, STATUS READY — NOT YET ISSUED"; §4 checklist items 1–2 marked satisfied; closing Status section updated to Ready with a Sprint 2 validation note.
- `docs/README.md` — banner; engineering-transition-status paragraph; document groups (Engineering Transition D1 Decisions); status log (new Sprint 2 entry, Phase 0B/Sprint 1 entries lightly re-worded to past tense where since superseded); outstanding-work §5 items 9, 11, 18, 19 marked complete; 2 new items (20, 21) added for the genuinely remaining work.
- `docs/05-implementation/change-tracking/documentation-phases.md` — new row; closing summary rewritten.
- `docs/05-implementation/reports/README.md` — new report linked.
- (This log — Entry 016.)

### Method (disclosed for auditability)

This is the first sprint in the entire programme where the AI agent's own analysis concluded that the standing "prepare, don't apply" discipline (established in Phase 0B, reused in Sprint 1) should be set aside for these four specific records — not because the discipline was wrong, but because this sprint's task brief itself supplied the explicit instruction the Decision Governance Workflow requires before any record may be closed: "Update Decision Register: For every confirmed decision: Update Status; Final Decision; Decision Date; Approved By; Supporting References." The four records closed (DEC-TECH-003/004/006/007) are exactly the task's own "expected candidates" list — no decision was closed that the task brief did not name, and no decision was closed where genuine unresolved work remained (DEC-SEC-001, DEC-TECH-005, DEC-DATA-007 were re-verified against the same reasoning already on record in the Engineering Decision Closure Recommendations and left open). "Approved by" was recorded as "Engineering Lead, confirmed under Founder-directed Engineering Decision Sprint 2" — disclosed explicitly as the basis for that attribution, rather than asserting a named individual's sign-off occurred outside this process record.

### Validation

Full-suite link check re-run after all new files and cross-references (2 broken links found and expected — `docs/README.md` and `docs/05-implementation/phase-0-authorization.md` both reference this entry's own not-yet-created report before it existed; resolved once the report was written). Confirmed the Decision Register's live status counts moved exactly as intended (15→11 OPEN_ENGINEERING, +4 CONFIRMED; `grep -oE "Status: \*\*[A-Z_]+\*\*" decision-register.md | sort | uniq -c`). Grepped the full suite for stale "OPEN_ENGINEERING"/"pending sign-off"/"recommended, pending" references tied to DEC-TECH-003/004/006/007 in live governance documents (found and corrected 3: `repository-and-folder-standards.md` §3/§6, `documentation-manifest-v1.md` row 149); confirmed remaining matches are in dated historical reports and the changes log itself, which are append-only audit records not subject to correction. Confirmed no file under a code, package-manifest, or CI-configuration path was created anywhere in the repository/workspace. Confirmed no Founder-owned or Provider-owned Decision Register record was modified.

---

## Entry 015 — Engineering Decision Sprint 1: DEC-TECH-003 Engineering Stack Evaluation & Recommendation

- **Date:** 17 July 2026
- **Performed by:** Claude (AI agent), per founder instruction "TASK — Engineering Decision Sprint 1 / DEC-TECH-003 — Version 1 Engineering Stack Evaluation & Recommendation".
- **Scope:** New engineering-evaluation document creation and cross-reference updates only. **No repository created; no git initialized; no code written; no `package.json` generated; no dependency installed; no CI/CD created; no Firebase project created; no UI implemented; no Decision Register status changed (a closure was prepared, not applied); no product requirement, business rule, or Constitution content changed; no PRD or TRD content changed; no unrelated files modified.**

### Created (2)

- `docs/00-governance/decisions/dec-tech-003-engineering-stack-recommendation.md` — full 10-part evaluation: engineering characteristics of 11thONUS derived from TRD16/TRD8/PRD0 (Part 1); derived frontend engineering requirements (Part 2); candidate evaluation across build tool, routing, state management (evaluated separately by category per TRD16 §16.11: UI/app, server, form, auth, offline), validation, component foundation, styling, charts, icons, tables, PWA, QR scanning, notifications, testing, and package management (Part 3); evaluation criteria applied (Part 4); direct trade-off answers for every major choice (Part 5); long-term scaling analysis (Part 6); engineering philosophy (Part 7); a single final Version 1 stack recommendation — Vite, React Router, TanStack Query, React Hook Form + Zod, shadcn/ui + Tailwind CSS, Lucide, Recharts, TanStack Table, vite-plugin-pwa, Vitest + React Testing Library + Playwright, ESLint + Prettier, pnpm (Part 8); decision-impact analysis on ENG-P0-001, the Engineering Blueprint, Engineering Standards, and future work packages (Part 9); explicit confirmation of out-of-scope items honored (Part 10); and a prepared, ready-to-sign Decision Register update (§11) that is **not applied**.
- `docs/05-implementation/reports/eng-decision-sprint-1-dec-tech-003-report-2026-07-17.md` — full 17-item implementation report.

### Modified (7)

- `docs/02-technical/version-1-engineering-blueprint.md` — §1.3 updated: the frontend-tooling item is no longer described as having zero direction; a note now points to the DEC-TECH-003 recommendation while stating clearly it remains OPEN_ENGINEERING pending sign-off. Region (DEC-TECH-005) remains the sole genuinely unfixed item in that section.
- `docs/03-standards/engineering-standards/linting-and-formatting-conventions.md` — §5 updated from "pending DEC-TECH-003" to naming the recommended tools (ESLint, Prettier), explicitly marked as recommended-not-confirmed.
- `docs/05-implementation/prompts/ENG-P0-001-draft.md` — added a note that DEC-TECH-003 now has a full recommendation, still OPEN_ENGINEERING pending sign-off; §4's precondition and non-authorization status unchanged.
- `docs/00-governance/decisions/engineering-transition-d1-agenda.md` — DEC-TECH-003's "Existing recommendation" field and §7 updated to point to the new recommendation while preserving the "not selected" status.
- `docs/00-governance/decisions/README.md` — new file indexed.
- `docs/README.md` — banner; document group; status §4 entry; outstanding-work §5 items 9, 18, 19.
- `docs/05-implementation/change-tracking/documentation-phases.md` — new row; closing summary updated.
- `docs/05-implementation/reports/README.md` — new report linked.
- (This log — Entry 015.)

### Method (disclosed for auditability)

Every engineering characteristic claimed in Part 1 was traced to a specific TRD16/TRD8/PRD0 section, re-read in full during this task rather than recalled from memory summary — including previously unread sections (TRD16 §16.2–16.35, §16.51–16.57, §16.71–16.74) specifically to ground the state-management-category requirement (§16.11, which explicitly separates server/application/form state and forbids one global container — this became the central architectural argument against RTK Query and unscoped Redux use) and the functional-requirement/architecture-rule catalogues (FR-FE-001..025, FA-001..018) cited throughout the evaluation. A targeted search confirmed no SSR/SEO requirement exists anywhere in the approved documentation (basis for recommending Vite over Next.js/Remix), while also surfacing and disclosing one counter-signal (TRD23 §23.32's note that public business pages "may exist" later, explicitly deferred past MVP) rather than ignoring it — this became Part 6's disclosed future review trigger rather than an unexamined risk. Every rejected alternative (Next.js, TanStack Router, RTK Query, TanStack Form, Formik, Valibot, Yup, MUI, Mantine, Headless UI, AG Grid-class tables, yarn) was rejected with a specific, traceable reason, not general preference.

### Validation

Full-suite link check re-run after all new files and cross-references — see the report for the exact count. Confirmed the Decision Register's live status counts are unchanged (`grep -oE "Status: \*\*[A-Z_]+\*\*" decision-register.md | sort | uniq -c` — still 15 OPEN_ENGINEERING, confirming no register write occurred). Confirmed no file under a code, package-manifest, or CI-configuration path was created anywhere in the repository/workspace.

---

## Entry 014 — Phase 8: Product Design Documentation & UX Governance

- **Date:** 17 July 2026
- **Performed by:** Claude (AI agent), per founder instruction "TASK — Phase 8: Product Design Documentation & UX Governance".
- **Scope:** New Product Design section creation, approved Stitch asset relocation, and cross-reference updates only. **No UX redesign; no engineering implementation; no frontend code written; the Stitch HTML/PNG assets were moved as-is and never modified; no product requirement, business rule, Constitution principle, or Product Experience Principles content changed; no PRD or TRD content changed; no unrelated files modified.**

### Created (10)

- `docs/07-product-design/README.md` — section index.
- `docs/07-product-design/ux-direction.md` — overall philosophy, information hierarchy, navigation/screen/interaction philosophy, future evolution; grounded in the approved Stitch exploration and the Product Experience Principles.
- `docs/07-product-design/navigation-model.md` — primary/secondary/customer/business navigation, drawn from actual approved screens; admin navigation explicitly disclosed as unexplored rather than invented.
- `docs/07-product-design/interaction-patterns.md` — 12 recurring interaction patterns, each marked Stitch-validated or governing-document-only; Errors and Empty States flagged as priority gaps for future exploration.
- `docs/07-product-design/moments-that-matter.md` — 8 major emotional moments (Registration, First Purchase, First Verification, Progress, Reward Earned, Reward Redeemed, Recognition, Customer Appreciation), each with purpose/desired emotion/UX objective/success criteria.
- `docs/07-product-design/trust-indicators.md` — 9 trust-language indicators, each marked Stitch-validated (with the exact approved copy) or governing-document-only.
- `docs/07-product-design/design-anti-patterns.md` — 9 forbidden patterns, each traced to a specific Constitution value or Experience Pillar it would violate.
- `docs/07-product-design/design-decisions.md` — Design Decisions Register: 6 entries (DEC-UX-001..006) covering the Version 1→2 matching method, the navigation-model choice, the visual-language adoption, the Recognition-moment language watch point, the progress-representation choice, and the interim business-navigation choice — each with description, reason, alternatives considered, chosen direction, dependencies, affected screens, and future review triggers.
- `docs/stitch/README.md` — redirect from the original Stitch location to its new home, following the Phase 2/Phase 5 redirect-folder convention.
- `docs/05-implementation/reports/phase-8-product-design-documentation-report-2026-07-17.md` — full implementation report.

### Moved (14 asset folders + files, 0 modified)

- `docs/stitch/stitch_11thonus_product_experience_discovery/concept_1_customer_home` (+ 7 more numbered concepts) → `docs/07-product-design/stitch/exploration-v1/` — the initial systematic exploration pass, unmodified.
- `refined_home_trust_first`, `signature_verification_experience`, `loyalty_journey_verified_units`, `the_on_us_moment_reward_redemption`, `premium_verification_system` → `docs/07-product-design/stitch/exploration-v2/` — the reviewed and approved refinement pass, unmodified. Matched to their Version 1 counterparts by identical `<title>` tags and explicit "refined" naming (method and evidence disclosed in full in [Design Decisions Register](../07-product-design/design-decisions.md) §DEC-UX-001).
- `image.png/` (an unlabeled, orphan asset folder) → `docs/07-product-design/stitch/archive/` — preserved rather than guessed into either version.
- No file inside any moved folder (`code.html`, `screen.png`, `DESIGN.md`) was edited. Verified: file sizes and content unchanged after move (diff against pre-move state, all identical).

### Modified (5)

- `docs/00-governance/documentation-manifest-v1.md` — added §10 (Product Experience Principles, 1 doc), §11 (Engineering Transition Programme Phases 0A–0B, 18 docs), §12 (catch-up note explaining why §10–11 were added retroactively), §13 (Product Design Phase 8, 11 markdown files + 3 non-markdown asset-folder rows); renumbered the former §10–13 to §14–17; corrected the Manifest Totals table (verified by direct count: 106 authoritative/working markdown documents, 29 audit/archive, 135 grand total markdown files — an arithmetic error in an intermediate draft of this total, caused by counting non-markdown asset-folder rows as documents, was caught and corrected before finalizing).
- `docs/README.md` — banner updated; Governance Hierarchy §1 item 5 updated (Engineering Standards now "Pass 1 complete," Product Design section noted as an input to the future Platform Design System); Product Design document group added; status §4 gained a Phase 8 entry; outstanding-work §5 gained items 13–17 (Phase 8 complete; Errors/Empty States priority gap; admin navigation gap; Recognition-language watch point; Platform Design System still unauthored).
- `docs/05-implementation/change-tracking/documentation-phases.md` — new rows added for "Product Experience Principles" and "Phase 8" (in correct chronological order relative to Engineering Transition Phase 0B); closing summary updated.
- `docs/05-implementation/reports/README.md` — Phase 8 report and companions linked.
- (This log — Entry 014.)

### Method (disclosed for auditability)

The Version 1 / Version 2 split was not asserted from memory or convention — it was derived from direct evidence in the source files: `grep`-extracted `<title>` tags showed `refined_home_trust_first`, `signature_verification_experience`, and `loyalty_journey_verified_units` share an identical title with their numbered Version 1 counterpart (`concept_1_customer_home`, `concept_2_purchase_verification`, `concept_3_loyalty_journey` respectively); `the_on_us_moment_reward_redemption` was matched thematically to `concept_4_reward_ready` as the only redemption-stage concept in the refined set; `premium_verification_system/DESIGN.md` was identified as a design-system specification (colors/typography/spacing/component rules), not a screen concept, and filed accordingly. All file modification timestamps were checked first and found identical across every file (a single extraction timestamp), confirming they carried no useful version signal and that the title/naming-based method was necessary rather than a shortcut. Every trust-indicator, interaction-pattern, and moment claimed as "Stitch-validated" in the new documents was verified against actual `grep`-extracted UI copy from the approved `code.html` files, not paraphrased from memory — patterns with no matching approved copy (Business Verified, Reward Guaranteed, Verification Complete, Search, Customer Lookup as an independent screen, Loading, Errors, Empty States, Registration, First Purchase) are explicitly marked "governing-document only" rather than presented as tested.

### Validation

Full-suite link check re-run after all new files, moved assets, and cross-references. Confirmed zero content edits to any `code.html`, `screen.png`, or `DESIGN.md` file (move-only). Confirmed no Product Experience Principles, PRD, TRD, or Decision Register content was changed. Confirmed the Documentation Manifest's corrected totals reconcile exactly against `find docs -name "*.md" | wc -l`.

---

## Entry 013 — Product Experience Principles v1.0 Created

- **Date:** 17 July 2026
- **Performed by:** Claude (AI agent), per founder instruction "TASK — Create the Product Experience Principles for 11thONUS".
- **Scope:** New product-philosophy document creation and cross-reference updates only. **No mockups, UI components, screen layouts, CSS, or implementation code created; no product requirement, business rule, or Constitution principle changed; no Decision Register content touched; no unrelated files modified.**

### Created (1)

- `docs/01-product/product-experience-principles.md` — Version 1.0 Product Experience Principles: Product Philosophy (what 11thONUS is; why customer verification changes the loyalty experience, grounded in Constitution Pillar Two and Design Decision Knowledge Base §3.2); 8 Experience Pillars; Design Principles; Information Hierarchy; Interaction Principles (confirmations, errors, loading, empty states, notifications); Language Principles (grounded in TRD16 §16.40–16.43's approved customer/business-facing vocabulary); Emotional Design (Trust → Confidence → Progress → Achievement → Celebration); Accessibility Principles including the Grandmother Test (TRD16 §16.49–16.50); Motion Principles (grounded in TRD16 §16.65 Celebration Design); Future Design System Alignment. Explicitly not a UI specification — contains no mockups, components, layouts, CSS, or code.

### Modified (3)

- `docs/README.md` — banner updated; Governance Hierarchy §1 gained a companion-document note under PRD; Product document group gained the new file; status §4 gained an entry.
- `docs/01-product/prd/README.md` — added a one-line pointer to the new companion document.
- (This log — Entry 013.)

### Method (disclosed for auditability)

Every principle in the new document was grounded in already-approved source text rather than invented: the Product Philosophy section quotes the Constitution's Articles 1–5 and Pillar Two directly and cites Design Decision Knowledge Base §3.2 (Universal Verification) for the "why verification changes the experience" reasoning; the Language Principles section reproduces TRD16 §16.42–16.43's exact approved customer/business-facing vocabulary rather than inventing new terms; the Interaction and Accessibility Principles sections cite TRD16 §16.44–16.50 and §16.65 (loading, empty states, error handling, optimistic UI policy, accessibility standard, Grandmother Test, celebration design) throughout. No new product behavior, requirement, or terminology was introduced — the document organizes and explains principles that were already scattered across the Constitution and TRD16 into one design/frontend-facing reference.

### Validation

Full-suite link check re-run after the new file and all cross-references — see the count below. Confirmed the new document contains no mockup, wireframe, component, layout, CSS, or code content (visual/manual review against the task's explicit constraints). Confirmed no terminology used contradicts the Canonical Reference or TRD16's approved customer/business-facing copy rules.

---

## Entry 012 — Engineering Transition Phase 0B: Architecture Finalization & Engineering Standards

- **Date:** 17 July 2026
- **Performed by:** Claude (AI agent), per founder instruction "TASK — Engineering Transition Phase 0B: Architecture Finalization & Engineering Standards".
- **Scope:** New engineering-architecture document creation, decision-closure preparation, and cross-reference updates only. **No repository created; no git initialized; no code scaffolded; no packages installed; no Firebase project generated; no source code generated; no product requirement or approved business behavior changed; no Constitution principle changed; no functionality invented; no Decision Register status changed (three closures were prepared, none applied); no unrelated files modified; TRD22 Phase 0 was not marked started.**

### Created (11)

- `docs/00-governance/decisions/engineering-decision-closure-recommendations.md` — reviewed all 7 Engineering-owned D1 decisions against their actual TRD source text (not the register's paraphrase); found 3 already answered by approved documentation (DEC-TECH-004 repository structure, DEC-TECH-006 event-delivery pattern, DEC-TECH-007 idempotency storage policy) and prepared ready-to-sign Decision Register update text for each; confirmed 4 remain genuinely open (DEC-SEC-001, DEC-TECH-003, DEC-TECH-005, DEC-DATA-007) with the specific external proof/evaluation/proposal each still needs. No register status changed.
- `docs/03-standards/engineering-standards/repository-and-folder-standards.md`, `naming-conventions.md`, `typescript-conventions.md`, `linting-and-formatting-conventions.md`, `testing-conventions.md`, `logging-conventions.md`, `error-handling-conventions.md`, `documentation-conventions.md`, `commit-conventions.md` (9 files) — the first Engineering Standards Pass, covering all 11 requested topics, scoped strictly to what is fully knowable without an unresolved architecture decision; each cites its TRD source rather than inventing new rules, with the exception of the small number of genuinely new code-level conventions (naming, file structure mechanics) that TRD chapters do not themselves specify.
- `docs/02-technical/version-1-engineering-blueprint.md` — the definitive technical architecture reference, consolidating TRD8 (Firebase Platform Architecture), TRD9 (Physical and Integration Architecture), TRD10 (Firestore Data Architecture), TRD11 (Cloud Functions and Domain Services), TRD12 (Security and Access Control), TRD16 (Frontend and PWA Architecture), and TRD20 (Deployment and Operational Resilience) into one document organized as Overall Architecture, Repository Architecture, Domain Architecture, Cross-Cutting Services, Data Flow, and Deployment Architecture. One source discrepancy found and disclosed (TRD8 §8.6's stale Administration/Subscription collection example vs. the Phase-1-corrected Canonical Reference ownership model) rather than silently resolved.
- `docs/05-implementation/reports/engineering-transition-phase-0b-report-2026-07-17.md` — full implementation report.

### Modified (7)

- `docs/03-standards/engineering-standards/README.md` — rewritten from a Phase 6 placeholder into a real Pass 1 (complete) / Pass 2 (reserved, with each reserved item's blocking decision named) index.
- `docs/05-implementation/prompts/ENG-P0-001-draft.md` — added a Phase 0B status note (DEC-TECH-004 has a prepared closure pending sign-off; DEC-TECH-003 has no prepared answer) and a validation note confirming nothing important is missing/premature; §4's precondition and execution-authorization status unchanged.
- `docs/README.md` — status banners updated; Technical and Engineering Transition D1 Decisions document groups gained the Blueprint and Closure Recommendations links; Standards group updated from "placeholder" to "Pass 1 complete"; status §4 gained an Engineering Transition Phase 0B entry; outstanding-work §5 updated (item 7 struck through, items 9/11/12 added or revised).
- `docs/05-implementation/reports/README.md` — Engineering Transition Phase 0B report and companions linked.
- `docs/05-implementation/change-tracking/documentation-phases.md` — new row added for Engineering Transition Phase 0B; closing summary updated.
- `docs/00-governance/decisions/README.md` — new file indexed.
- (This log — Entry 012.)

### Method (disclosed for auditability)

Every "already answered" finding was verified against the actual TRD chapter/section text, not the Decision Register's paraphrase — e.g. TRD11 §11.17's full field-level outbox specification and TRD10 §10.30's explicit "may be stored in a dedicated collection or incorporated into authoritative documents, depending on the operation" were read in full before recommending DEC-TECH-006/007's closure, and TRD23 §23.22's OTD-001 was re-read to confirm DEC-TECH-003 genuinely has no candidate tools recorded anywhere before leaving it open. The Blueprint's domain-ownership table was drawn verbatim from the Canonical Reference §5–6, not re-derived. No Decision Register field was edited; three closure recommendations were prepared as inert text in a new governance record, consistent with the Decision Governance Workflow's rule that the AI/documentation-maintainer role never fills approval fields on its own initiative absent an explicit founder/decision-owner instruction naming the specific record.

### Validation

Live Decision Register status counts re-verified unchanged after this phase (`grep -oE "Status: \*\*[A-Z_]+\*\*" decision-register.md | sort | uniq -c` → 37 CONFIRMED / 10 DEFERRED / 15 OPEN_ENGINEERING / 24 OPEN_FOUNDER / 6 OPEN_LEGAL / 7 OPEN_PROVIDER / 4 SUPERSEDED — identical to the pre-Phase-0B count, confirming no register write occurred). All 9 Engineering Standards documents cross-reference the Blueprint and each other correctly. The Blueprint's every TRD citation traced back to the actual chapter/section read during this phase. 0 application code files created; 0 repository/git/Firebase actions performed; 0 product requirements changed.

---

## Entry 011 — Engineering Transition Phase 0A: Implementation Programme, D1 Decision Preparation & Prompt Register

- **Date:** 17 July 2026
- **Performed by:** Claude (AI agent), per founder instruction "TASK — Engineering Transition Phase 0A: Implementation Programme, D1 Decision Preparation & Prompt Register".
- **Scope:** New engineering-planning document creation and cross-reference updates only. **No application code written; no repository initialized; no Firebase resources created; no deployment performed; no production data created; no Decision Register entry approved or modified; no requirement wording or requirement ID changed; no repository structure, frontend tooling, Firebase region, event-delivery architecture, idempotency storage, or provider invented or selected; no unrelated files modified; TRD22 Phase 0 was not marked started.**

### Created (6)

- `docs/05-implementation/change-tracking/engineering-implementation-programme.md` — the permanent high-level implementation tracker: all 17 TRD22 phases (Phase 0–16), each extracted verbatim from TRD22 §22.10–22.26 (objective, deliverables, exit criteria), broken into 47 small, reviewable work packages (`ENG-P<phase>-<sequence>`), each citing verified-existing Requirement IDs (from the Traceability Matrix) and Decision IDs (from the live Decision Register).
- `docs/05-implementation/change-tracking/coding-agent-prompt-register.md` — the founder-readable, prompt-by-prompt summary of all 47 work packages, a 12-state status vocabulary with defined update authority, and the prompt execution rule (one detailed prompt issued at a time).
- `docs/00-governance/decisions/engineering-transition-d1-agenda.md` — a transition-focused companion to the Founder Decision Agenda, consolidating all 11 D1-priority decisions (2 Founder, 7 Engineering, 2 Provider) that affect TRD22 Phases 0–2, in engineering-phase order, with plain-language questions, documented options/consequences, and explicit "what may proceed / what must not proceed" guidance per decision.
- `docs/00-governance/decisions/loyalty-code-decision-brief.md` — founder-facing decision preparation for DEC-DATA-007 (public loyalty code and QR reference generation): proposed format, character-set analysis (ambiguity-reduced alphabets), exact capacity/collision-probability calculations, security/privacy boundaries, and planning-level generation requirements. Confirms DEC-DATA-007 is the correct and only live record governing this question. No register change made.
- `docs/05-implementation/prompts/ENG-P0-001-draft.md` — the first detailed implementation-prompt draft, built to the [Implementation Prompt Standard](../06-engineering-governance/implementation-prompt-standard.md)'s exact 12-section structure, explicitly marked **DRAFT — NOT YET AUTHORIZED FOR EXECUTION**, conditioned on DEC-TECH-003/DEC-TECH-004 resolution.
- `docs/05-implementation/reports/engineering-transition-phase-0a-report-2026-07-17.md` — full implementation report.

### Modified (5)

- `docs/README.md` — engineering-transition status banner added; document groups §3 gained Implementation Programme/Prompt Register/D1 agenda links; status §4 gained an Engineering Transition Phase 0A entry; outstanding-work §5 updated.
- `docs/05-implementation/reports/README.md` — Engineering Transition Phase 0A report and companions linked.
- `docs/05-implementation/change-tracking/documentation-phases.md` — new row added for Engineering Transition Phase 0A; closing summary updated to state all 47 work packages are `Blocked` and TRD22 Phase 0 has not begun.
- `docs/00-governance/decisions/README.md` — two new files indexed.
- (This log — Entry 011.)

### Method (disclosed for auditability)

TRD22 §22.9–22.29 (phase list, all 17 per-phase objective/deliverables/exit-criteria sections, dependency map, critical path, recommended vertical slice) was re-read in full and extracted verbatim — no phase name or criterion was reconstructed from memory. All 11 D1 decisions were read from the live Decision Register (not from summary counts) to capture their exact current wording, options, and "required by phase" field. Requirement IDs cited in the programme and register were selected via a programmatic, keyword-and-domain-scoped query against the Requirements Traceability Matrix's 934 rows, guaranteeing every cited ID exists — representative subsets are cited per work package, not an exhaustive enumeration, with each work package pointing to the matrix's Domain column for the complete set. Capacity and collision-probability figures in the Loyalty Code Decision Brief were computed exactly (birthday-paradox approximation), not estimated.

### Validation

All 17 TRD22 phases represented in the programme; all 47 work packages belong to exactly one phase; all 47 Prompt IDs unique (`ENG-P0-001`..`ENG-P16-002`); every cited Requirement ID verified to exist in the Traceability Matrix; every cited Decision ID verified to exist in the live Decision Register; all 11 D1 decisions appear in the transition agenda; every `Blocked` work package states its exact blocking decision or precondition; the Prompt Register matches the Programme (one row per work package, both directions); the ENG-P0-001 draft follows all 12 Implementation Prompt Standard sections; 0 application code files created; 0 Decision Register entries modified; 0 requirements changed; full-suite link check re-run after all new files and cross-references — 0 broken links (see the companion report §17 for the exact count).

---

## Entry 010 — Phase 7 Documentation Finalization & Version 1.0 Engineering Readiness

- **Date:** 17 July 2026
- **Performed by:** Claude (AI agent), per founder instruction "TASK — Phase 7: Documentation Finalization & Version 1.0 Engineering Readiness".
- **Scope:** New governance-record document creation and cross-reference updates only. **No product requirements changed; no requirement IDs changed; no Decision Register content changed; no Founder Decisions approved; the Constitution was not rewritten; no existing governance redesigned; no implementation code introduced; no unrelated files modified.**

### Created (4)

- `docs/00-governance/design-decision-knowledge-base.md` — the rationale ("why") behind 11 major long-term platform decisions (Verified Units, Universal Verification, Verified Commerce™ positioning, Shared Loyalty Number, Individual Purchase Rejection, Purchase Amount as reporting metadata, Firebase-first, Burundi-first, English/French MVP, Documentation-first development, AI-assisted engineering governance), sourced only from already-approved Constitution/PRD/TRD/Decision Register content; 2 documented gaps disclosed (Burundi market-selection rationale, English+French language-pair rationale) rather than invented.
- `docs/00-governance/documentation-manifest-v1.md` — master inventory of every authoritative/working document (76, excluding 29 audit-evidence/archive files), each with purpose, authority level, owner, version, status, and relationship to other documents.
- `docs/05-implementation/reports/version-1-engineering-readiness.md` — assessment of documentation completeness, governance maturity, traceability, engineering readiness, remaining founder/commercial/legal dependencies, implementation risks, and recommendations.
- `docs/00-governance/version-1-documentation-declaration.md` — declares the documentation suite Version 1.0, authorizes engineering to begin, and states explicitly that Version 1.0 is a controlled baseline, not a permanent freeze.
- `docs/05-implementation/reports/phase-7-documentation-finalization-report-2026-07-17.md` — full implementation report.

### Modified (4)

- `docs/README.md` — Version 1.0 status banner added; governance hierarchy §1 and document groups §3 gained Version 1.0 companion-record links; status §4 gained a Phase 7 completion entry; outstanding-work §5 updated (Phase 7 marked complete; D1 decision scheduling and Engineering Standards dependency called out).
- `docs/05-implementation/reports/README.md` — Phase 7 report and companion Readiness Report linked.
- `docs/05-implementation/change-tracking/documentation-phases.md` — Phase 7 row updated to Complete; closing summary updated to reflect Version 1.0 status.
- (This log — Entry 010.)

### Consistency Audit Method (disclosed for auditability)

A full-suite link check (104 markdown files before this phase's new files, 105 after) found 0 broken relative links, both before Task 1–5 file creation and after final cross-reference integration. A requirement-ID duplicate scan (bold/heading-declaration regex, suite-wide, excluding archive/audit) found 0 unexpected duplicates — the only multi-file matches were confirmed as intentional citations (TRD22 DIP-001..007 quoted, with attribution, in the new Engineering Governance Principles document; TRD23's AS-001 referenced historically in the Phase 3 reconciliation record), not new declarations. The Requirements Traceability Matrix was re-verified at 934/934 rows, 0 duplicates; because no PRD/TRD/Constitution source file has been modified since Phase 5's validated 934/934/0-duplicate/0-orphan result, that result is confirmed to still hold rather than re-derived from scratch. Hierarchy and hierarchy-authority statements were checked across `docs/README.md`, the Constitution, the Canonical Reference, the Decision Register, and the Engineering Governance Charter — the Constitution is the only document claiming "highest" authority; the Canonical Reference correctly attributes "highest" to the Constitution rather than itself. No conflicting terminology, duplicate authority claim, or stale placeholder reference was found (the tier-5 hierarchy placeholders — Platform Design System, Engineering Standards, Operational Playbooks, API & Integration Guide — remain genuinely unauthored and are correctly still marked as such).

### Validation

104→105 total markdown files; 0 broken links (full-suite check, both before and after this phase's edits); 0 duplicate Requirement IDs; 0 orphan traceability records (934/934 confirmed unchanged since Phase 5); Decision Register unchanged at 103 records (37 CONFIRMED, 24 OPEN_FOUNDER, 15 OPEN_ENGINEERING, 7 OPEN_PROVIDER, 6 OPEN_LEGAL, 10 DEFERRED, 4 SUPERSEDED, 0 REJECTED); documentation hierarchy consistent across all cross-references checked; authority hierarchy consistent (single "highest" claim, correctly attributed).

---

## Entry 009 — Phase 6 Engineering Governance & Delivery Standards

- **Date:** 16 July 2026
- **Performed by:** Claude (AI agent), per founder instruction "Phase 6 — Engineering Governance & Delivery Standards".
- **Scope:** New governance-process document creation (`docs/06-engineering-governance/`) and cross-reference updates only. **No product requirements changed; no requirement IDs changed; no Decision Register content changed; no Founder Decisions approved; no implementation code introduced; no existing governance redesigned; no unrelated files modified.**

### Created (12)

- `docs/06-engineering-governance/README.md` — section index.
- `docs/06-engineering-governance/engineering-governance-charter.md` — purpose, scope, boundaries, relationship to Constitution / Decision Register / Traceability Matrix / Changes Log, and the consolidation rule against TRD19/20/22.
- `docs/06-engineering-governance/ai-collaboration-workflow.md` — the 16-stage Founder → ChatGPT Technical Lead → Implementation Prompt → Coding Agent → ... → Phase Complete workflow, as supplied by the founder.
- `docs/06-engineering-governance/coding-agent-standard.md` — coding-agent operating boundaries; cites TRD22 §22.38–22.41 rather than restating them; states the ten TRD22 §22.40 stop conditions.
- `docs/06-engineering-governance/implementation-prompt-standard.md` — required work-package/prompt structure, built on TRD22 §22.38 plus the prompt pattern already used across Phases 1–6 of this programme.
- `docs/06-engineering-governance/technical-review-standard.md` — review checklist (grounded in TRD22 §22.41) and the two possible review outcomes.
- `docs/06-engineering-governance/git-workflow.md` — the Coding Agent → Commit → Push → Founder `git pull origin main` → Verify → Deploy sequence, as supplied by the founder, plus commit-message convention and release tagging.
- `docs/06-engineering-governance/deployment-workflow.md` — deployment sequence, Preview Review checklist, rollback trigger point; cites TRD20 §20.11–20.21.
- `docs/06-engineering-governance/manual-testing-standard.md` — reusable, feature-agnostic manual QA checklist, distinct from TRD19's exhaustive technical test architecture.
- `docs/06-engineering-governance/definition-of-done.md` — work-package-level completion gate, distinct from TRD19 §19.49 (feature-level) and TRD22's MVP Exit Gate (phase-level).
- `docs/06-engineering-governance/roles-and-responsibilities.md` — Founder / ChatGPT Technical Lead / Coding Agent / GitHub / Firebase / Manual QA / future engineering team, mapped against every workflow stage.
- `docs/06-engineering-governance/engineering-principles.md` — judgment principles grounded in Constitution Part V (Four Questions) and TRD22 DIP-001..007.

### Modified (4)

- `docs/README.md` — governance hierarchy §1 (item 6 extended), document groups §3 (new Engineering Governance group), status §4 and outstanding-work §5 updated to reflect Phase 6 completion.
- `docs/03-standards/engineering-standards/README.md` — the coding-agent task/report/change-log/stop-condition bullet removed from this placeholder's scope list and replaced with a note pointing to `docs/06-engineering-governance/`, to prevent future duplication between this (product-implementation technical standards) placeholder and the new (collaboration-process) section.
- `docs/05-implementation/change-tracking/documentation-phases.md` — Phase 6 row updated to Complete.
- (This log — Entry 009.)

### Consolidation Strategy (disclosed for auditability)

Before creating any document, TRD Chapter 19 (Quality Engineering) and TRD Chapter 22 (MVP Implementation and Delivery) were read in full, and TRD Chapter 20 (Deployment and Operational Resilience) was reviewed, to identify existing engineering-governance-adjacent content. Significant overlaps were found: TRD19 §19.49 (feature-level Definition of Done), §19.52 (Release Gates), §19.64 (Quality Ownership); TRD20 §20.10–20.21 (branching, CI, CD, deployment permissions, artifacts, rollback); TRD22 §22.38–22.41 (Implementation Work-Package Standard, Coding-Agent Change Tracking, Coding-Agent Stop Conditions, Phase Review Standard) and DIP-001..007 (Delivery Principles). Rather than duplicate this already-approved technical content, every new document that touches an overlapping area cites the specific TRD section by number and either adds process detail the TRD states as a requirement without spelling out step-by-step, or narrows the TRD's general statement to the specific Founder/ChatGPT-Technical-Lead/coding-agent collaboration model. TRD19/20/22 remain authoritative for the underlying technical standards; `docs/06-engineering-governance/` is authoritative for the human/AI collaboration process built on top of them. The existing `docs/03-standards/engineering-standards/` placeholder (reserved for product-implementation technical standards) was annotated, not rewritten, to remove one overlapping bullet and point it at the new section.

### Validation

All 12 new documents cross-link correctly to each other and to the Engineering Governance Charter; every relative link checked resolves; no engineering-governance content is duplicated between the new section and TRD19/20/22 (each overlap point cites the TRD section number instead of restating its content); role names and the 16-stage workflow sequence are stated identically across `ai-collaboration-workflow.md`, `roles-and-responsibilities.md`, `git-workflow.md` and `deployment-workflow.md`; no product requirement, requirement ID, or Decision Register entry was touched; no file outside `docs/06-engineering-governance/`, `docs/README.md`, `docs/03-standards/engineering-standards/README.md`, `docs/05-implementation/change-tracking/documentation-phases.md` and this log was modified.

---

## Entry 008 — Phase 5 Requirements Traceability & Implementation Matrix

- **Date:** 16 July 2026
- **Performed by:** Claude (AI agent), per founder instruction "Phase 5 — Requirements Traceability & Implementation Matrix", building the bridge required by TRD Chapter 23 §23.4 now that Phase 4 delivered globally unique requirement IDs.
- **Scope:** New governance document creation and index/cross-reference updates only. **No requirement wording changed; no requirement IDs changed; no Founder Decisions approved; no Constitution or Decision Register content changed; no architecture changed; no implementation code created; no unrelated files modified.**

### Created (3)

- `docs/00-governance/requirements-traceability-matrix.md` — the permanent Requirements Traceability & Implementation Matrix. 934 requirement/rule/principle IDs (extracted programmatically from the Platform Constitution, all 11 PRD files, all 17 TRD files, and the Commerce Knowledge Standard), one row each, 18 columns per row (Requirement ID, Type, Title, Source Document, Section, Related Decision IDs, Related Constitutional Principle, Domain, Planned Technical Module, Planned Firestore Collections, Planned Cloud Functions, Planned Frontend Screens, Planned API, Acceptance Criteria, Future Test Reference, Implementation Status, Dependencies, Notes). Grouped by source document in suite order; includes a Requirement Coverage Summary table by family and a documented strategy/rationale section.
- `docs/00-governance/traceability-maintenance-guide.md` — the companion procedure: how new requirements are added, how deprecated requirements are marked (never deleted), how Implementation Status advances, how Future Test References are maintained, and the coding-agent contract for checking this matrix before implementing.
- `docs/05-implementation/reports/phase-5-traceability-matrix-report-2026-07-16.md` — full implementation report.

### Modified (5)

- `docs/04-traceability/README.md` — placeholder replaced with a redirect to the three files above (folder retained so existing links resolve, per the Phase 2 convention).
- `docs/README.md` — governance hierarchy §1, document groups §3, status §4, and outstanding-work §5 updated to reflect Phase 5 completion.
- `docs/05-implementation/reports/README.md` — Phase 5 report linked.
- `docs/05-implementation/change-tracking/documentation-phases.md` — Phase 5 row added; Phase 6 readiness note added.
- (This log — Entry 008.)

### Method (disclosed for auditability)

Every requirement ID was extracted **programmatically**, not hand-transcribed, using a whitelist of the 64 known ID prefixes (from the Requirements ID Audit's enumeration plus the 3 prefixes Phase 4 introduced) and pattern-matching every declaration format actually used in the suite (table row, heading, bold-standalone-with-title, bold-standalone-plain, and bare line) — the suite uses all five formats in different chapters. Domain, Planned Technical Module and Planned Firestore Collections values are drawn directly from already-approved sources (PRD/TRD index "Primary domain(s)" columns; TRD10 §10.4 Collection Ownership Matrix) — never invented. `Related Decision IDs` was populated by searching the current Decision Register for exact-token citations. `Related Constitutional Principle` was left `—` suite-wide after confirming (by full-text search) that no PRD or TRD document currently cites a specific `CP-XXX` next to an individual requirement — this is disclosed as a known gap, not silently omitted.

### Validation

934/934 extracted identifiers appear as exactly one row (100% coverage); 0 duplicate Requirement IDs; 0 orphan requirements; every `Related Decision IDs` citation verified against the live Decision Register; every requirement traces to exactly one declaring source document and section; `Implementation Status = Not Started` on all 934 rows; 132 relative links checked suite-wide, 0 broken; no requirement wording changed (titles are extracted, not rewritten).

### Governance effect

The Requirements Traceability & Implementation Matrix is now a **permanent governance document** (not a phase artifact) and the authoritative bridge between documentation and future engineering. Engineering Standards (Phase 6) may now be authored against a complete, stable traceability base. Full report: `docs/05-implementation/reports/phase-5-traceability-matrix-report-2026-07-16.md`.

---

## Entry 007 — Phase 4 Requirement ID Normalization

- **Date:** 16 July 2026
- **Performed by:** Claude (AI agent), per founder instruction "Documentation Phase 4 — Requirement ID Normalization", executing DEC-GOV-006 exactly as approved.
- **Scope:** Purely mechanical identifier renaming/addition. **No requirement wording changed; no product or technical behavior changed; no requirements added, removed or redesigned beyond the 13 ID-only additions in PRD4 §19; no Decision Register content changed; Git not initialized.**

### Renamed (51 identifiers, 1:1 substitution, zero meaning change)

- `docs/01-product/prd/01-accounts-roles-and-permissions.md` §18 — `FR-RP-001..010` → `FR-AUTHZ-001..010` (10).
- `docs/01-product/prd/10-platform-administration.md` §19 — `FR-RP-001..008` → `FR-RBAC-001..008` (8).
- `docs/02-technical/trd/20-deployment-and-operational-resilience.md` §20.75 — `OP-001..018` → `OR-001..018` (18; the audit's sampling estimate of "~12" was superseded by the full-chapter count of 18 during this phase).
- `docs/02-technical/trd/23-traceability-and-completion-review.md` §23.25 — `A-001..015` → `AS-001..015` (15).

### Deliberately unchanged (reviewed, confirmed correct as-is)

- `docs/01-product/prd/06-reward-programs-and-loyalty-cycles.md` §25 — `FR-RP-001..012` kept (Reward Programs is the natural owner of the mnemonic).
- `docs/01-product/prd/00-product-foundation.md` §11 — `OP-001..013` (ONUS Principles) kept.

### Added (13 new identifiers — gap closure, no prior ID existed)

- `docs/01-product/prd/04-customer-verified-loyalty.md` §19 — 13 previously unnumbered functional requirements gained `FR-CVLE-001..013`, in original document order, wording unchanged (audit finding DOC-P3-008).

### Files modified (14)

The 6 files above, plus: `canonical-reference.md` (§9 already-adopted hierarchy unaffected; new "Also resolved" note + link), `documentation-phases.md` (Phase 4 row), `05-implementation/reports/README.md` (report linked), `01-product/prd/README.md` (rows updated, footnote replaced with resolution note), `00-governance/decisions/README.md` (OPD/OTD/LCD/AS catalogue reference corrected), `00-governance/decisions/founder-decision-agenda.md` (A2 marked executed), `00-governance/decisions/assumptions-register.md` (15 source citations `TRD23 A-0XX`→`TRD23 AS-0XX`), `00-governance/decisions/external-dependencies-register.md` (1 citation `A-015`→`AS-015`), `docs/README.md` (status, outstanding-work, governance link list).

### Files created (2)

- `docs/00-governance/requirement-id-mapping.md` — the permanent Old ID → New ID mapping record (all 51 renames + 13 additions + the 2 deliberately-unchanged sets, individually listed).
- `docs/05-implementation/reports/phase-4-requirement-id-normalization-report-2026-07-16.md` — full implementation report.

### Explicitly not modified (per strict constraint and established governance rules)

- **`docs/00-governance/decisions/decision-register.md`** — untouched, per the explicit instruction "Do NOT change Decision Register contents." Four *Source references* fields cite the pre-normalization `TRD23 A-0XX` form; harmless (same information, findable via the new mapping document) and disclosed in the Phase 4 report.
- **`docs/90-audits/2026-07-16-documentation-audit/*`** — untouched, per the established rule that audit evidence is a historical snapshot and is never edited.
- **`docs/99-archive/**`** — untouched (superseded documents and Phase 1 backups).

### Validation

108→120 relative links checked (12 new links added by the new mapping document and its cross-references), 0 broken. Zero genuine duplicate requirement/rule IDs across all authoritative documents (890 unique declared IDs; the only multi-file "duplicates" detected are the intentional restatement of TRD23's assumptions in the Assumptions Register, and the mapping document's own old/new listing — both expected). Requirement counts verified unchanged: BR 98/98, PD 24/24, CP 15/15, FR-AUTHZ 10/10, FR-RBAC 8/8, FR-RP (PRD6) 12/12, OR 18/18, OP (PRD0) 13/13, AS 15/15, FR-CVLE 13 new. No requirement wording changed anywhere (spot-verified by direct comparison of the moved text against Phase 1–3B baselines).

### Governance effect

All requirement/rule ID collisions identified in the Requirements ID Audit are now resolved. The Requirements Traceability Register (Phase 5) has no remaining ID-stability blocker. Full report: `docs/05-implementation/reports/phase-4-requirement-id-normalization-report-2026-07-16.md`.

---

## Entry 006 — Phase 3B Batch A Decisions Recorded

- **Date:** 16 July 2026
- **Performed by:** Claude (AI agent), per founder instruction "Phase 3B — Record the approved Batch A decisions"
- **Scope:** Recording and propagation of exactly four founder-approved decisions. **No other OPEN decision was approved; no requirement IDs changed; Phase 4 not begun; no documentation migrated; Git not initialized; no unrelated files modified.**

### Decisions processed (4 — all Batch A, all D0 freeze blockers, all now CONFIRMED)

- **DEC-GOV-001** — *"Update the Constitution to adopt the newer governance hierarchy. Do NOT create a Vision & Product Strategy document."* Approved by Founder (Kenogo), 2026-07-16.
- **DEC-GOV-006** — *"Proceed with Requirement ID Normalisation. Maintain a complete Old ID → New ID mapping. No requirement meaning changes."* Approved by Founder (Kenogo), 2026-07-16. (Approval only — execution is Phase 4, not started.)
- **DEC-LOY-010** — *"Customers reject purchases individually. Every rejected purchase records its own reason."* Approved by Founder (Kenogo), 2026-07-16.
- **DEC-DATA-003** — *"Purchase Records include optional monetary fields. Money is reporting metadata only. Money shall NEVER influence Verified Units, Reward Program progression, Loyalty Cycles or Reward eligibility unless a future founder decision explicitly introduces amount-based Reward Programs."* Approved by Founder (Kenogo), 2026-07-16.

### Constitutional amendment (DEC-GOV-001)

`docs/00-governance/platform-constitution.md` — **Version 1.0 → 1.1.** Part VII hierarchy replaced with the TRD23 §23.3 list (Vision & Product Strategy removed — will not be authored; Decision Register and Implementation Change Log added); preamble reference to Vision & Product Strategy removed; new permanent **Amendment Record** table added to Part VII recording this change (Part VI deliberate/documented/versioned/backward-conscious requirement satisfied).

### Files modified (9, decision-driven corrections)

- `decisions/decision-register.md` — 4 records: Status → CONFIRMED, Final decision/Decision date/Approved by populated; §5 summary recalculated (CONFIRMED 33→37, OPEN_FOUNDER 28→24); §1 operational note added.
- `platform-constitution.md` — amendment as above (Classification: **Constitutional amendment**).
- `trd/23-traceability-and-completion-review.md` — register note above §23.3 confirming DEC-GOV-001 (Classification: Clarification).
- `prd/00-product-foundation.md` — §14.3 batch-rejection bullet removed; OPEN note replaced with CONFIRMED note (Classification: Decision-driven correction).
- `prd/01-accounts-roles-and-permissions.md` — §5.2 reject-purchases line clarified to individual + reason (Classification: Clarification).
- `prd/05-purchase-verification.md` — §5 confirmed note added on monetary fields (Classification: Decision-driven correction).
- `trd/10-firestore-data-architecture.md` — §10.10.1 schema gains optional `unitValueMinorUnits`/`currencyCode` fields + new Monetary Metadata Rule subsection (Classification: Decision-driven correction).
- `canonical-reference.md` — §9 hierarchy list resolved (OPEN → CONFIRMED); §3 gained two new confirmed Trust Principles (rejection, monetary fields); §11 open-items list updated (Classification: Decision-driven correction, synchronized in this change set).
- `decisions/founder-decision-agenda.md` — Batch A items A1–A4 marked ✅ answered with final choices (struck through, not deleted).

### Also updated (indexes/trackers, no substantive content change)

- `decisions/README.md`, `docs/README.md`, root `README.md` — decision counts and hierarchy-conflict wording updated to reflect resolution.
- `change-tracking/documentation-phases.md` — Phase 3B row added; founder-decision track updated (Batch A ✅ complete).
- `05-implementation/reports/README.md` — Phase 3B report linked.
- (This log — Entry 006.)

### Validation

108 relative links checked, 0 broken. 103 unique DEC-IDs, 0 duplicates. Register summary arithmetic verified (37+24+15+7+6+10+4+0=103). Requirement IDs unchanged (BR 98/98; FR-RP/OP collisions intentionally still present — Phase 4 not begun). The 24 remaining OPEN_FOUNDER records' approval fields confirmed still blank.

### Governance effect

**All four D0 freeze-blocking decisions are now resolved. Zero D0 decision blockers remain.** Phase 4 (Requirement ID Normalization) is unblocked and may begin on explicit founder instruction; it was **not** started in this phase. Full report: `docs/05-implementation/reports/phase-3b-batch-a-decisions-report-2026-07-16.md`.

---

## Entry 005 — Phase 3A Founder Decision Programme & Governance Freeze Preparation

- **Date:** 16 July 2026
- **Performed by:** Claude (AI agent), per founder instruction "Phase 3A — Founder Decision Programme & Governance Freeze"
- **Scope:** Decision facilitation and governance process only. **No decision approved; no requirement IDs changed; no PRD/TRD content altered; Phase 4 not begun; Git not initialized.**

### Created (3)
- `docs/00-governance/decision-governance-workflow.md` — full decision lifecycle: responsibilities, approval rules (evidence, unlisted options, conditional approvals, silence ≠ approval), version control, amendment/supersession/rejection handling, Constitution interaction (Part VI amendment-only path), Canonical Reference mirroring rule, coding-agent contract.
- `docs/00-governance/decision-update-procedure.md` — 8-step controlled procedure for recording approved decisions (capture → register → confirm-back → documents → canonical reference → changes log → traceability (Phase 5+) → housekeeping) with historical-integrity rules.
- `docs/05-implementation/reports/phase-3a-governance-report-2026-07-16.md`.

### Modified (6)
- `decision-register.md` — governance review of all 28 OPEN_FOUNDER records: 5 wording-only clarifications (DEC-LOY-008 option (c) neutralized; DEC-PROD-012, DEC-DATA-003, DEC-LOY-011, DEC-PILOT-002 split recommendations reworded as explicit non-recommendations/observations); §1 operational-process note; Notes batch references realigned to agenda Batches A–E (4 D0 records marked "Batch A (freeze blocker)"). No approval fields touched; no meaning changed.
- `founder-decision-agenda.md` — rebuilt for a non-technical reader: Batches A–E (freeze blockers first), consequences per option, answer sheet, how-to-answer instructions. All 28 OPEN_FOUNDER IDs still covered 1:1.
- `decisions/README.md`, `docs/README.md` — links to the two new process documents.
- `documentation-phases.md` — Phase 3A row added.
- (This log — Entry 005.)

### Freeze readiness (assessed)
Besides founder decisions, nothing structural blocks Phase 4, Phase 5 or the freeze; recommended (non-blocking): initialize version control before Phase 4. Decision order recommended: Batch A → B → C → D (commission DEC-LEGAL-006 early) → E.

---

## Entry 004 — Phase 3 Decision Register Creation

- **Date:** 16 July 2026
- **Performed by:** Claude (AI agent), per founder instruction "Phase 3 — Formal Decision Register and Decision-Governance Preparation"
- **Scope:** Governance records only. **No open founder decision was approved; no requirement IDs changed; no product or technical behavior changed; no providers chosen; no legal conclusions made.**

### Created (5 files in `docs/00-governance/decisions/`)
- `decision-register.md` — 103 records (33 CONFIRMED validated against governing sources · 28 OPEN_FOUNDER · 15 OPEN_ENGINEERING · 7 OPEN_PROVIDER · 6 OPEN_LEGAL · 10 DEFERRED · 4 SUPERSEDED · 0 REJECTED). Four D0 freeze blockers: DEC-GOV-001 (hierarchy), DEC-GOV-006 (ID renumbering approval), DEC-LOY-010 (batch rejection), DEC-DATA-003 (Purchase Record monetary fields).
- `founder-decision-agenda.md` — 28 founder decisions in plain language, Batches 0–5.
- `external-dependencies-register.md` — 16 dependencies (technical proofs, providers, commercial agreement, legal reviews, country validation, pilot evidence) with owners and blocking phases.
- `assumptions-register.md` — AS-001..015 (from TRD23 §23.25) with validation methods.
- `phase-3-reconciliation.md` — maps all ~154 raw decision-like mentions (71 unique audit-extraction items + upstream duplicates) to final records; 0 unmapped.

### Modified (8 files, permitted edits only)
- `decisions/README.md` — placeholder replaced by index (file retained).
- `docs/README.md`, root `README.md` — Decision Register now exists; status and outstanding-work updates.
- `canonical-reference.md` — three OPEN markers now cite their DEC IDs; register linked.
- `prd/00-product-foundation.md` — §14.3 OPEN note now cites DEC-LOY-010 (ID added only; meaning unchanged).
- `trd/23-traceability-and-completion-review.md` — §23.21 register pointer note added (catalogues remain historical source).
- `change-tracking/documentation-phases.md` — Phase 3 complete; founder-decision track added.
- (This log — Entry 004.)

### Governance effect
The hierarchy conflict (Constitution Part VII vs TRD23 §23.3) is now formally registered as **DEC-GOV-001**; the Constitution was **not** amended. Full report: `docs/05-implementation/reports/phase-3-decision-register-report-2026-07-16.md`.

---

## Entry 003 — Phase 2 Repository Restructuring

- **Date:** 16 July 2026
- **Performed by:** Claude (AI agent), per founder instruction "Phase 2 — Repository Structure and Source-of-Truth Preparation"
- **Scope:** Structural/navigational only. All documentation moved into the governed `docs/` tree with kebab-case names; indexes, placeholders and metadata blocks added; canonical-reference status wording corrected. **No requirement IDs changed, no open decisions resolved, no application code created, no backups or evidence deleted.**

### Actions
- **54 files moved** (38 renamed) into `docs/00-governance/`, `docs/01-product/prd/`, `docs/02-technical/trd/`, `docs/03-standards/`, `docs/90-audits/2026-07-16-documentation-audit/`, `docs/99-archive/`. Full old→new mapping: [`file-location-mapping.md`](../90-audits/2026-07-16-documentation-audit/file-location-mapping.md).
- **34 documents** received standard metadata blocks (title/version/status/classification/governing document/path/last update). No body changes.
- **Canonical reference** reclassified as *controlled navigation and canonical-reference document* (does not override Constitution/PRD/TRD); state-model wording corrected to "approved as suite-wide target, Phase 1 applied confirmed corrections"; paths updated.
- **12 files created:** root README, docs index, PRD index, TRD index, decisions/traceability/engineering-standards placeholders, implementation-reports README, phase-tracking file, file-location mapping, Phase 2 implementation report.
- **TRD consolidation audit** relocated to the audit folder (working instrument, not an authoritative TRD chapter).
- Superseded documents renamed to `product-definition-superseded-v1.md` / `legacy-data-model-superseded-v1.md` in `docs/99-archive/superseded/` — banners preserved, historical bodies untouched.
- Empty legacy folders `PRD/`, `TRD/`, `AUDIT_REPORTS_2026-07-16/` removed.

### Verification
67 relative links checked, 0 broken; requirement-ID counts unchanged (BR 98, PD 24, CP 15; FR-RP collision intentionally preserved); all 12 audit documents and 16 backup files retained. Full report: [`phase-2-implementation-report-2026-07-16.md`](../05-implementation/reports/phase-2-implementation-report-2026-07-16.md).

### Note on historical entries
Entries 001–002 below quote original (pre-restructuring) file paths as historical evidence; they are intentionally unmodified. Use the file-location mapping for current paths.

---

## Entry 002 — Phase 1 Documentation Consolidation

- **Date:** 16 July 2026
- **Performed by:** Claude (AI agent), per founder instruction "Phase 1 of the 11thONUS documentation consolidation"
- **Basis:** Audit reports in `AUDIT_REPORTS_2026-07-16/` (Executive Report, Findings Register, Consolidation Plan Steps 1–2 plus already-approved normalizations)
- **Scope:** Safe corrections only — superseded-document labelling, approved terminology/domain/state normalization, editorial cleanup, canonical reference creation. **No product decisions made; no requirement IDs renumbered; no Decision or Traceability Register created.**

### Files modified (16)
1. `11thONUS Product Definition.md` — SUPERSEDED banner prepended (body untouched)
2. `11THONUS-data-model.md` — SUPERSEDED banner prepended (body untouched)
3. `2_Commerce Knowledge Standard.md` — conversational commentary converted to normative wording
4. `11thONUS Rules Studio.md` — Bronze/Silver/Gold marked illustrative; Required Verified Units annotated MVP-fixed; commentary neutralized
5. `PRD/PRD0_product foundation.md` — loyalty product→Reward Program; product category wording; plan-basis wording per Consolidation Audit §11.1 (incl. PD-019); batch-rejection conflict note (DOC-P1-006, unresolved); Business Rules Catalogue reference redirected to Rules Studio
6. `PRD/PRD1_accounts Roles, Permissions.md` — loyalty product→Reward Program (4 instances)
7. `PRD/PRD2_ Customer Registration andIdentity.md` — Preferred language moved to Mandatory (aligns CKS Part XII/TRD22 §22.35, noted); QR sentence reflow; §14 lifecycle diagram cleaned (`<br/>` artifacts removed, duplicate Approved/Verified step collapsed); Business Rules Catalogue reference redirected
8. `PRD/PRD3_ Business Registration.md` — loyalty product→Reward Program (16 instances incl. §14 heading, FR-BO/BR texts); "My recommendation" → marked unapproved recommendation
9. `PRD/PRD4_ Customer-Verified Loyalty Engine.md` — programme→program; Trust Ledger→trustEvents mapping note
10. `PRD/PRD5_ Purchase Verification Lifecycle.md` — §6 lifecycle diagram cleaned; §7 state-model note (canonical stored states; Draft/Recorded = transient)
11. `PRD/PRD6_ Reward Programs and LC management.md` — programme→program; §14 Loyalty Cycle states aligned to canonical with display-label note
12. `PRD/PRD7_ Reward Redemption.md` — programme→program; §10 heading corrected to "Reward States"; Expired state added per canonical model; "Historical" reclassified as display view
13. `PRD/PRD9_ Reporting and Analytics.md` — stray header line removed; programme→program; closing first-person recommendation converted to "Platform Evolution Layers" framing
14. `TRD/TRD1-7_Plartform Architecture.md` — 15-domain model applied (note + Domains 13–15 Reward Programs/Subscription/Integration added; Administration no longer owns Subscriptions; Chapter 6 matrix extended; codebase layout updated; commentary neutralized)
15. `TRD/TRD10_Firestore Data Architecture.md` — ownership matrix corrected (rewardPrograms→Reward Programs; businesses→Identity; subscriptions/subscriptionPayments→Subscription; notificationDeliveries→Notification with Integration notes); users/subscription/notification status enums aligned to canonical; MVP Threshold Rule note added at §10.9.2
16. `TRD/TRD23_Traceability and Completion Review.md` — spelling only: two "programme"→"program" instances (§23.8, OPD-004). No backup copy was taken before this edit; a rollback note with the exact reversals is at `phase1_source_backups/TRD/TRD23_ROLLBACK_NOTE.txt`

### Files created (3)
- `11thONUS_CANONICAL_REFERENCE.md` — authoritative quick reference (identity, terminology, domains, ownership, states, glossary, hierarchy, MVP boundaries, trust principles, reward model)
- `DOCUMENTATION_CHANGES_LOG.md` — this log
- `AUDIT_REPORTS_2026-07-16/PHASE1_IMPLEMENTATION_REPORT_2026-07-16.md` — full implementation report

### Backups
Pre-edit copies of all 15 modified files: `AUDIT_REPORTS_2026-07-16/phase1_source_backups/` (restore by copying back).

### Explicitly NOT done (per constraints)
Requirement-ID renumbering (FR-RP/OP collisions remain); Decision Register; Traceability Register; open product decisions (plan names, staff limits, trial, overflow policy, suspension-reward policy, batch rejection, permission inheritance, monetary fields, providers, legal items); file renames; governance-hierarchy amendment.

---

## Entry 001 — Documentation Freeze-Readiness Audit

- **Date:** 16 July 2026
- **Performed by:** Claude (AI agent)
- **Action:** Full-suite audit (35 documents); 9 reports created in `AUDIT_REPORTS_2026-07-16/`; verdict "Not ready for freeze"; 4 P0, 10 P1, 8 P2, 10 P3 findings, ~45 external dependencies catalogued. **No source documents modified.**
