# AUTH-05 — Account Linking (Implementation Report)

> **Title:** AUTH-05 — Account Linking
> **Version:** 2.0 · **Status:** Resumed after AUTH-CORR-002 — F1 corrected, F2 resolved by AUTH-CORR-002; pending Founder-authorized review/merge · **Classification:** Working (implementation report)
> **Governing document:** [`AUTH-BP` Authentication Blueprint](../roadmap/AUTH-BP-authentication-blueprint-2026-08-08.md) §7/§12/§15; [`ENG-P2-ARCH-001`](../roadmap/ENG-P2-ARCH-001-customer-identity-architecture.md) §7; [`DEC-AUTH-001`](../../00-governance/decisions/decision-register.md); [AUTH-CORR-002 — Provider-Qualified Authentication References (Model T)]
> **Source-of-truth path:** `docs/05-implementation/reports/AUTH-05-account-linking-2026-08-09.md`
> **Last controlled update:** 2026-08-09 (`AUTH-05` — created; §1–16 historical) · 2026-08-09 (`AUTH-05` — **resumed after AUTH-CORR-002**, §17 added — see below)

> **Reading note.** Sections §1–16 and the first "Final Gate" are the **historical record** of the initial AUTH-05 implementation and the F2 architectural block (kept verbatim, not rewritten). Section **§17 onward** is the authoritative **resumption** record after the Founder's Model-T decision (AUTH-CORR-002) merged to `main`. Where §9/§15/§16 and §17 differ, **§17 governs.**

**Authorization.** Founder-authorized — the **fifth** Authentication implementation package under `AUTH-BP`, authorized by the Founder in this task ("TASK — AUTH-05 Implementation"; the fresh, explicit implementation authorization the governing documents require before an `AUTH-*` package may begin; recorded per the AUTH-01/AUTH-02/AUTH-03/AUTH-04 convention in the changes-log Entry 098, this report, `IMPLEMENTATION_CHANGES.md`, Master Workflow §17, and CDR-001 §5). AUTH-01, AUTH-02, AUTH-CORR-001, AUTH-03, and AUTH-04 are prerequisites and are on `main` (AUTH-04 merged as `30df95c…`; post-merge CI green); they are treated as established architecture, not redesigned.

## 1. Entry state and prerequisite verification

- `origin/main` = `30df95c1b3173127cd2a6b8e1d211d215bd67c41` after `git fetch --prune`.
- **AUTH-04 = merged/closed:** PR [#91](https://github.com/Fkenogo/11THONUS/pull/91) `MERGED` (merge commit `30df95c`, merge parents `9889649` + corrected head `a5fa31b`), merged 2026-08-09T11:39:09Z; **post-merge CI green** (run 31311320024, workflow "CI", conclusion `success`).
- **Full prerequisite chain on `main`:** AUTH-01 (#87), AUTH-02 (#88), AUTH-CORR-001 (#89), AUTH-03 (#90), AUTH-04 (#91); the merged `-08` `authenticationReferenceRepository` (`link/unlinkAuthenticationReferenceForIdentity`, `getActiveAuthenticationReferenceOwner`), `-09` `identityLookupRepository`, and the shared idempotency/outbox foundation.
- **Clean linked worktree** created directly from `origin/main`: branch `feat/auth-05-account-linking`, HEAD `30df95c`, `git rev-list --left-right --count origin/main...HEAD` = `0 0`, clean status, no merge/rebase/cherry-pick in progress, no Git locks. The dirty primary worktree (`chore/eng-p1-001-closure`) was **not** touched (only read-only git commands ran against it).

## 2. Programme-currency synchronization (Phase A2)

On entry the Master Workflow §17 and CDR-001 §5 still described **AUTH-04 as "pending Founder-authorized review/merge"** (AUTH-04's own bullet), never reconciled after PR #91 merged. Per repository convention this was corrected with **dated superseding notes** — a new "AUTH-04 merge/closure sync" bullet in Master Workflow §17 and a `[UPDATED 2026-08-09 — AUTH-04 merged]` note in CDR-001 §5 — preserving the historical text (no old report rewritten), and AUTH-05 recorded as the current freshly authorized task. No code, capability boundary, or numbering changed; no competing source of truth was created.

## 3. Scope (AUTH-BP §7/§12/§15)

**Account linking** — link or unlink an *additional* authentication provider on **one** already-authenticated Customer Identity. The authentication-layer orchestration resolves the *acting* verified credential to its identity (AUTH-02) and delegates the link/unlink to the merged `-08`, with `customerIdentityId` fixed to the resolved acting identity. Location: `functions/src/domains/authentication/services/`.

**Not** in scope (deliberately untouched): frontend linking UI; session/access management — expiry, protected-action gating, privileged re-auth, sign-out (**AUTH-07**); recovery proof (**AUTH-06**); the `CustomerAuthenticated` ITM/audit trust-signal emission (**AUTH-08** — AUTH-05 emits **no** domain events); duplicate-identity **merge** authority (a separate governed capability — Authentication only detects + refers, `DEC-AUTH-001` D-A3); any new error category; any capability renumbering; any change to `-01`/`-08`/`-09`/AUTH-01/AUTH-02/AUTH-03/AUTH-04 or the shared idempotency facility.

## 4. Authoritative requirement, acceptance criteria & boundaries

**Requirement (AUTH-BP §7).** (1) an authenticated session is required (link/unlink is identity-protected); (2) verify the new provider credential; (3) link via `-08` `linkAuthenticationReferenceForIdentity` — cross-identity conflict **fails closed** + emits `AuthenticationReferenceConflictDetected` for the governed review, never auto-merges; (4) unlink mirrors `-08` (history-preserving; the `lastAuthenticationReferenceCannotBeUnlinked` invariant protects the final reference); emit `AuthenticationReferenceLinked`/`Unlinked` (both emitted by `-08`).

**Acceptance criteria (AUTH-BP §15 exit criteria):** acceptance met verbatim; unit + real-emulator tests pass; local validation actually run; report + changes-tracking produced; committed/pushed; no unrelated files modified; no credential material persisted (verified).

**Events owned:** none — AUTH-05 emits nothing itself. **Events consumed (emitted by `-08`):** `AuthenticationReferenceLinked`, `AuthenticationReferenceUnlinked`, `AuthenticationReferenceConflictDetected`. **Explicitly not owned:** `CustomerAuthenticated` (AUTH-08).

**Responsibility boundaries preserved:** AUTH-03 owns registration/sign-in orchestration; AUTH-04 owns the frontend Phone OTP/Google flows; global `authenticationReferences/{type}:{id}` uniqueness is owned by `-08`; the shared idempotency facility remains authoritative.

## 5. Files created / modified

**Created** (all under `functions/src/domains/authentication/services/`):
- `accountLinkingService.ts` — the orchestration: `linkAuthenticationProvider` / `unlinkAuthenticationProvider`; resolves the acting credential (AUTH-02) → identity, delegates to `-08`.
- `accountLinkingService.test.ts` — 7 unit tests (injected doubles, no Firestore).
- `accountLinkingService.emulator.test.ts` — 6 real-Firebase-emulator tests against the actual `-08`/`-09`.
- `accountLinkingEndpointService.ts` — verifies the acting (+ new, for link) raw tokens through the AUTH-02 `TokenVerifierPort`, builds the governed envelope/command, shapes a credential-free result.
- `accountLinkingEndpointService.test.ts` — 3 unit tests (fake verifier + injected orchestration).

**Modified:**
- `functions/src/index.ts` — two additive `onCall`s (`linkAuthenticationProvider`, `unlinkAuthenticationProvider`) + request parsers, following the AUTH-03 `authenticate` precedent; error mapping reuses the existing `toHttpsError`/`CATEGORY_TO_HTTPS`.

`git diff origin/main --stat` touches only these six paths. **No `apps/` change.**

## 6. Pre-change architecture analysis & implementation strategy

The merged `-08` already provides transactional, idempotent, globally-unique `link`/`unlink` with cross-identity conflict fail-closed (+ conflict-event emission) and the last-reference invariant; AUTH-03 already consumes it for the *initial* reference at registration. AUTH-05 therefore adds only the **authentication-layer orchestration on top of `-08`** — it does not re-implement any of `-08`'s guarantees. The AUTH-03 `registrationSignInService`/`authenticationEndpointService`/`index.ts` seam was mirrored exactly: a plain dependency-injected service, a plain endpoint composition, and thin `onCall` wrappers.

The two authentication-layer contributions AUTH-05 owns:
1. **Same-identity safety (AUTH-BP §7 step 1).** The `customerIdentityId` handed to `-08` is *always* the identity the acting credential resolves to (AUTH-02 `resolveAuthenticatedCredential`), never a client-supplied id — so a caller can only mutate the providers on *their own* identity. An acting credential that resolves to no identity fails closed (`AUTH_REQUIRED`) before any `-08` mutation.
2. **Never merges (AUTH-BP §7 step 3 / `DEC-AUTH-001` D-A3).** A new reference already owned by a different identity surfaces `-08`'s fail-closed conflict (which also commits the durable conflict audit signal); AUTH-05 does nothing to work around it.

Idempotency is consumed directly from `-08` via a deterministic, credential-bound derived key (`authentication.link:{clientKey}` / `authentication.unlink:{clientKey}`, `requestHash` bound to the acting identity + target reference) — no second idempotency subsystem; AUTH-03's exported `assertSafeIdempotencyKey` is reused for key-safety validation.

## 7. Security / privacy (TRD10 §10.6.1, AUTH-BP §11/§15)

- **No credential material persisted, logged, or returned.** The orchestration (`accountLinkingService.ts`) never references `rawToken` at all — it works purely with verified `AuthenticatedCredential`s and provider-neutral references; the endpoint passes `rawToken` only into `verifier.verify(...)` (consumed) and forwards only the reference. Secret/credential grep over all AUTH-05 files: clean.
- **Enumeration resistance.** A reference not owned by the acting identity is an indistinguishable `RESOURCE_NOT_FOUND` (`-08` ownership check); a never-linked and a previously-unlinked reference are not distinguished.
- **Closed error taxonomy.** No new category: cross-identity conflict → `VALIDATION_FAILED`; not-owned/unknown → `RESOURCE_NOT_FOUND`; last-reference → `INVALID_STATE_TRANSITION`; unregistered actor → `AUTH_REQUIRED`; concurrent command → `IDEMPOTENCY_CONFLICT` (from `-08`).
- **Fail-closed / never auto-merge.** Conflicts surface and refer to the governed merge process; nothing merges or transfers a reference across identities.
- **Deny-by-default Rules unaffected.** The two callables are Admin-SDK Cloud Functions — no new client Firestore write path is opened. `firestore.rules` unchanged.
- **Dependency direction.** Authentication → Identity/shared; the reverse never occurs.

## 8. Tests added (TDD, RED→GREEN)

**RED evidence.** `accountLinkingService.test.ts` was authored first and run against the absent module → `Failed to resolve import "./accountLinkingService"` (module-not-found; "no tests"). The service was then implemented → GREEN.

**Unit (10 total, no Firestore):**
- `accountLinkingService.test.ts` (7): link targets the RESOLVED acting identity (same-identity safety; asserts `-08` `customerIdentityId`/`linkedBy`/authority/reason and the derived key/hash, and that no provider-signal material is forwarded); unregistered actor → `AUTH_REQUIRED` with no `-08` call; cross-identity conflict propagates unchanged; unsafe idempotency key rejected before resolve/`-08`; unlink targets the resolved acting identity; last-reference invariant surfaced; ownership (not-found) surfaced.
- `accountLinkingEndpointService.test.ts` (3): link verifies both tokens and delegates a credential-free result; a failed new-credential verification aborts before any link; unlink verifies only the acting token and delegates the named target.

**Real Firebase Emulator (6):** `accountLinkingService.emulator.test.ts` exercises the actual `-08`/`-09`/Firestore transaction: link makes a second provider authoritative (`AuthenticationReferenceLinked` in the outbox); unlink of a non-final reference (status `unlinked`, the other reference untouched, `AuthenticationReferenceUnlinked` emitted); cross-identity conflict fails closed (`VALIDATION_FAILED`), ownership unchanged, `AuthenticationReferenceConflictDetected` committed (no merge); last remaining reference cannot be unlinked (`INVALID_STATE_TRANSITION`); same-identity safety (acting as F cannot unlink G's reference — `RESOURCE_NOT_FOUND`, G untouched); unregistered actor fails closed (`AUTH_REQUIRED`) with no write.

## 9. Complete validation results (2026-08-09)

Run from the clean worktree, mirroring CI order (`build → lint → format:check → typecheck → test → test:e2e → emulators:validate`):

- `pnpm build` — clean (functions `tsc`; web vite/PWA build).
- `pnpm lint` (`eslint .`) — clean.
- `pnpm format:check` (`prettier --check .`) — clean (all matched files).
- `pnpm typecheck` — clean (web + functions).
- `pnpm test` — **functions 501/501** (67 files; +10 AUTH-05), **web 300/300** (39 files; unchanged).
- `pnpm test:e2e` (Playwright) — **1/1**.
- `pnpm emulators:validate` — AUTH-05 emulator file **6/6**; the single suite failure is the inherited `ENG-P1-002-CR1` flake (see §11).

## 10. Commands executed (representative)

```
git fetch origin --prune; git rev-parse origin/main
gh pr view 91 --json state,mergedAt,mergeCommit
git worktree add -b feat/auth-05-account-linking <worktree> 30df95c
pnpm install --frozen-lockfile
pnpm --filter functions exec vitest run src/domains/authentication/services/accountLinking*      # RED then GREEN
pnpm build && pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm test:e2e
pnpm emulators:validate
firebase emulators:exec ... vitest ... commandDispatcher.emulator.test.ts   # inherited-flake isolation proof (5/5)
firebase emulators:exec ... vitest ... accountLinkingService.emulator.test.ts # AUTH-05 6/6
```

## 11. Pre-existing failures / flakes encountered (with evidence)

`pnpm emulators:validate` intermittently reports **one** failure in `src/shared/commands/commandDispatcher.emulator.test.ts` (the `ENG-P1-002-CR1` command-dispatcher / identity-lifecycle concurrency-timing flake). **Verified inherited, not AUTH-05:** (a) it is a shared file AUTH-05 did not touch (`git diff origin/main` touches only the six AUTH-05 paths, none under `shared/`); (b) it passes **5/5 in isolation** under the same emulator; (c) it is the same flake documented in the AUTH-03 and AUTH-04 reports. Left untouched per task constraints (no opportunistic flake fix; explicitly out of AUTH-05 scope).

## 12. Invariants preserved

Authentication-reference global uniqueness (`-08`), AUTH-03 idempotency/atomicity, AUTH-04 identity-safety/timeout-replay fixes, shared idempotency semantics, the closed 14-category error taxonomy, fail-closed behavior, dependency direction, deny-by-default Rules, and `CustomerAuthenticated` remaining AUTH-08-owned — all preserved. No completed AUTH work was modified.

## 13. Risks & observations

Low — additive orchestration over already-tested merged interfaces. The two new callables open function endpoints (not client Firestore write paths), fail closed on verification/resolution, and enforce the closed MVP provider set (`phone_otp`/`google_sign_in`). All uniqueness/concurrency/conflict/last-reference guarantees are `-08`'s, proven on the emulator. Frontend linking UI, session gating (AUTH-07), and recovery (AUTH-06) remain deferred to their own packages.

## 14. Rollback instructions

`git revert` of this package's commit, or discard the `feat/auth-05-account-linking` branch (not yet merged). Removes the five `accountLinking*` files and the two `index.ts` callables (restoring `index.ts` to `authenticate`-only). No data, migration, or schema impact; `-08`/`-09` and all completed AUTH work are untouched.

## 15. Pull request & review-findings disposition

- **PR:** [#92 — AUTH-05 — Account Linking](https://github.com/Fkenogo/11THONUS/pull/92), base `main`, head `feat/auth-05-account-linking` @ `9a1f5d329c230f7dd520881742aa76f2545d7f31`.
- **CI on this head:** `success` (run 31313645646, workflow "CI": Build/Lint/Test/Emulator Validation).
- **Reviewer:** the repository's automated reviewer (Codex / `chatgpt-codex-connector`) posted a `COMMENTED` review on `9a1f5d3` with **two P1 inline findings**. No human review yet; no unresolved threads on earlier commits (this is the first commit).

| # | Finding | Severity | Valid? | Disposition |
|---|---|---|---|---|
| F1 | **Enforce the acting identity's access state** — resolution confirms the credential maps to *an* identity but never loads/validates its access state, so a caller holding a valid token for a suspended/locked/closed/archived identity could still mutate references, bypassing the `active`-only gate `registerOrSignIn` already applies. | P1 | **Valid** — correctness/security; AUTH-BP §7 step 1/§9 make link/unlink identity-protected. | **In AUTH-05 scope, fixable without touching completed work** (load the identity via the merged `getCustomerIdentityById` and gate on `active`, mirroring AUTH-03's returning-user gate). **Deferred into the F2 rework** (below) rather than committed piecemeal, because F2 blocks the package. |
| F2 | **Reject links between different Firebase UIDs** — both credentials' `referenceId` come from the verified `decoded.uid`; this path links them without requiring equality, so tokens for two *separately created* Firebase users would attach a second Firebase account's UID to the first user's platform identity — a silent cross-account **merge**, violating the account-linking invariant (AIR-001; `DEC-AUTH-001` D-A3, "Authentication never merges"). | P1 | **Valid** — identity integrity / architecture. | **BLOCKING — escalated (see §16). Cannot be resolved within AUTH-05 scope without a governing decision.** |

## 16. Architectural conflict surfaced by F2 — Founder escalation

F2 is valid, and following it through exposes an **irreconcilable conflict between the merged AUTH-02 verifier, the merged `-08` model, and AUTH-BP §7** that AUTH-05 cannot resolve without a governing decision:

- The merged **AUTH-02 verifier** sets `referenceId = decoded.uid` (the bare Firebase authUid) for **every** provider (AUTH-BP §3), so all providers of one Firebase user share **one** `referenceId`.
- The merged **`-08`** keys the embedded-projection dedupe **and** the `lastAuthenticationReferenceCannotBeUnlinked` invariant by **`referenceId` alone** (`customerIdentity.ts` `link/unlinkAuthenticationReference`). Its own emulator tests exercise multi-provider linking with **distinct** provider-subject `referenceId`s (`google_sub_N`) — identifiers the real verifier never actually produces for a single Firebase user.

The two facts cannot both hold for a complete link **and** unlink capability:

- **If F2 is honoured (require same UID)** — the correct anti-merge behaviour — a "second provider" shares the acting UID, so `-08` only materialises a second `{type}:{uid}` authoritative doc while the uid-keyed projection stays one entry; **unlinking it then trips the last-reference invariant** (reproduced: an emulator unlink of a same-UID second provider fails with `INVALID_STATE_TRANSITION`). AUTH-BP §7 step 4's unlink becomes incoherent over `-08`.
- **If different `referenceId`s are allowed** (as the current PR head and `-08`'s tests do) — link and unlink both work, but that is exactly attaching a **different Firebase account** to the identity, i.e. the cross-account **merge** the blueprint forbids. **The current PR head (`9a1f5d3`) therefore carries the valid F2 defect** — its "working" link/unlink tests operate on the merge scenario.

**No interpretation satisfies both "Authentication never merges distinct Firebase users" and "coherent link + unlink of additional providers" over the merged `-08` + real AUTH-02 verifier.** Resolving it requires a governing decision, e.g. one of:

1. **Redefine the authentication reference as provider-qualified** (`{provider}:{subject}`, distinct from the bare Firebase uid) — updates AUTH-BP §3, the AUTH-02 verifier's `referenceId`, and possibly `-08`'s keying. (Modifies completed responsibilities — out of AUTH-05 scope by the task's own constraints.)
2. **Scope AUTH-05 to link-only, same-UID** (materialise `{type}:{uid}` so both provider tokens resolve to the one identity), and **defer unlink** to a later package once the keying question is settled.
3. **Another Founder-directed model.**

Per the AUTH-05 task's Entry-Gate and Final-PR-Review-Gate rules ("If an apparent AUTH-05 requirement conflicts with any completed responsibility: STOP and escalate"; "If a finding requires scope expansion or modification of a completed responsibility: STOP and escalate"; "Do not choose an interpretation yourself"), this is **escalated to the Founder** rather than resolved unilaterally. F1's fix (access-state gate) is straightforward and will be folded into whichever model the Founder selects.

## Final Gate (historical — 2026-08-09, pre-AUTH-CORR-002)

**AUTH-05 BLOCKED — escalated to the Founder.** The account-linking capability as specified (link **and** unlink additional providers on one identity) cannot be coherently and safely implemented over the merged AUTH-02 verifier (`referenceId = uid`) and `-08` (uid-keyed dedupe/last-reference) without a governing decision on how an authentication reference is keyed (bare Firebase uid vs. provider-qualified subject) — see §16. A valid P1 identity-integrity finding (F2) remains unresolved on that basis; PR #92's current head carries the corresponding cross-account-merge defect and **must not be merged** as-is. Not self-merged; AUTH-06+ not started; the dirty primary worktree untouched. Capability 2 remains `Open — partially implemented; not closed`.

---

## 17. Resumption after AUTH-CORR-002 (2026-08-09)

Following the historical block above, the Founder issued the **Model-T decision** and it was implemented and merged as **AUTH-CORR-002 — Provider-Qualified Authentication References** (§16 option 1: the canonical authentication-reference identity is the tuple **`(referenceType, referenceId)`**, where `referenceId` remains the verified Firebase `authUid`). AUTH-05 is now **resumed** against that corrected `main`. This section is authoritative over §9/§15/§16.

### 17.1 Entry state & AUTH-CORR-002 verification
- `origin/main` = `386fd8ad45bc38f669ea5ef24f2ac556869a60d4` after `git fetch --prune`.
- **AUTH-CORR-002 = merged/closed:** PR [#94](https://github.com/Fkenogo/11THONUS/pull/94) `MERGED` (merge commit `386fd8a`, head `e0be6f9`), merged 2026-08-09T14:23:54Z; **post-merge CI green** (run 31318336623, workflow "CI", `success`).
- **Tuple correction present on `main` (verified in code):** `authenticationReferenceRepository.ts` dedupe now matches on `ref.referenceType === … && ref.referenceId === …` (was `referenceId` alone); `customerIdentity.unlinkAuthenticationReference` takes `{ referenceType, referenceId }`; the authoritative doc id is `{referenceType}:{referenceId}`; `authenticationReferenceKeying.emulator.test.ts` added. `identityEvents`/`customerIdentity` payloads are tuple-qualified.
- **PR #92 pre-resume state:** OPEN, unmerged, head `e04d2ff…`, `mergeable = CONFLICTING` (the conflict is confined to programme/report docs — AUTH-CORR-002 touched **no** file PR #92 touches in `functions/`). AUTH-06+ **not started** (no branches, no PRs).
- **Clean linked worktree** created from `origin/main` (`386fd8a`); the dirty primary worktree (`chore/eng-p1-001-closure`) was **not** touched (read-only git only).

### 17.2 Reassessment of the existing PR #92 implementation
Classified against corrected `main`:
- `accountLinkingService.ts` — **valid; F1 adaptation only.** It already threads `referenceType` through every `-08` link/unlink call (tuple-aware); it did **not** enforce the acting identity's access state (F1).
- `accountLinkingEndpointService.ts` — **still valid** (tuple-qualified request shape; token→verifier boundary intact). No change.
- `index.ts` wiring — **still valid.** No overlap with AUTH-CORR-002; `CATEGORY_TO_HTTPS` already maps `ACCOUNT_SUSPENDED`/`AUTH_FORBIDDEN`.
- Tests — **already encode the tuple model** (`{type}:{id}` expectations), not the superseded `referenceId`-only assumption; extended for F1 (below). No PR #92 code attempts to compensate for the old broken projection.
- Link/unlink semantics — **consume tuple-qualified references correctly** on corrected `main`.

**F2 disposition (two parts):**
1. **Keying incoherence — resolved by AUTH-CORR-002** at the model/`-08` layer; AUTH-05's orchestration required no keying change (it was already tuple-aware). The §16 incoherence (a same-uid second provider being unremovable because the projection was uid-keyed) no longer holds — proven by a dedicated emulator test (§17.5).
2. **Cross-account-attach hardening — Founder-directed same-Firebase-principal gate (see §17.9).** On the resumption PR-review gate, the automated reviewer re-raised the original F2 wording ("reject links between different Firebase UIDs"). Escalated to the Founder, who **directed adding a defensive same-UID gate**: account linking is a same-Firebase-principal operation (AUTH-BP §7 / AIR-001 — "multiple providers → one Firebase Auth user → one platform user"), so before any `-08` mutation AUTH-05 verifies the new provider's verified uid equals the acting credential's verified uid, failing closed otherwise. This is **defense-in-depth, additional to and not a replacement for** `-08`'s cross-identity ownership control (both preserved). Implemented as a second correction (§17.3).

### 17.3 Corrections — F1 access-state gate and F2 same-principal gate

**F1 — acting-identity access-state gate (the first required change).**
Before any link/unlink, the acting identity is loaded via the merged `getCustomerIdentityById` and gated on its access state, **reusing AUTH-03's exact returning-user gate** (`registrationSignInService.assertMaySignIn`) and its **existing** closed-taxonomy errors: `active` → proceed; `suspended` → `ACCOUNT_SUSPENDED`; any other non-active state → `AUTH_FORBIDDEN` (fail closed, before any `-08` mutation). No new state taxonomy; no new error category; access-state ownership unchanged (only `identity.status` is read). A `getIdentityById` seam was added to `AccountLinkingDeps`.

**F2 — same-Firebase-principal gate (Founder-directed, §17.9).**
In `linkAuthenticationProvider`, after the acting identity is resolved and access-gated and before the `-08` link, AUTH-05 verifies `newCredential.referenceId === actingCredential.referenceId` — both are the server-verified authUid from the AUTH-02 verifier (never client-supplied). A mismatch fails closed via a new **`AUTH_FORBIDDEN`** constructor (`newProviderPrincipalMismatchError` — reuses the existing category; **no new category**), so no reference is written and no cross-account attach can occur. Unlink is unaffected (it carries no new-provider credential). `-08`'s cross-identity ownership control is untouched and still independently rejects a reference already owned by another customer identity.

_(Superseded note: this section replaces the earlier "F1 is the one required change" framing — the Founder's resumption disposition added the F2 gate as a second correction.)_
Before any link/unlink, the acting identity is now loaded via the merged `getCustomerIdentityById` and gated on its access state, **reusing AUTH-03's exact returning-user gate** (`registrationSignInService.assertMaySignIn`) and its **existing** closed-taxonomy errors: `active` → proceed; `suspended` → `ACCOUNT_SUSPENDED`; any other non-active state → `AUTH_FORBIDDEN` (fail closed, before any `-08` mutation). No new state taxonomy; no new error category; access-state ownership unchanged (only `identity.status` is read). A `getIdentityById` seam was added to `AccountLinkingDeps`.

### 17.4 Integration strategy (Phase E)
The AUTH-05 branch was **reconstructed on current `main`** rather than rebasing the pre-correction branch: a fresh branch off `386fd8a`, onto which only the **six valid AUTH-05 files** (5 `accountLinking*` + additive `index.ts`) were placed, the F1 correction applied via TDD, and traceability reconciled against current-main docs. This yields the Phase-E preferred outcome — branch = current-main foundation + valid AUTH-05 impl + F1 correction + tests + traceability — with a clean, linear diff and **no** obsolete pre-correction commits and **no** rewrite of AUTH-CORR-002 history. PR #92 is preserved as the single AUTH-05 work package (its branch head is updated to the reconstructed tree).

### 17.5 Tests (TDD, RED→GREEN) — resumption delta
**F1 and F2 gates were both authored test-first** against the un-gated service → **RED** (the mutation proceeded / TypeError on the missing gate), then implemented → **GREEN**.

- **Unit — `accountLinkingService.test.ts` (17 total; +7):**
  - **F1 (5):** suspended acting identity → link `ACCOUNT_SUSPENDED` (no `-08` call); non-active (e.g. `locked`) → link `AUTH_FORBIDDEN`; suspended → unlink `ACCOUNT_SUSPENDED`; non-active → unlink `AUTH_FORBIDDEN`; active identity → link proceeds (loads identity, then mutates).
  - **F2 (2):** new provider verified for a **different** Firebase uid → link `AUTH_FORBIDDEN` before any `-08` call; new provider on the **same** verified uid → link proceeds. The success/conflict tests were realigned so the acting and new credentials share one verified uid (a second provider on the same Firebase principal); the seven original tests inject the `getIdentityById` active-identity seam.
- **Real Firebase Emulator — `accountLinkingService.emulator.test.ts` (11 total; +5):**
  - **same-uid multi-provider + dual `-09` resolution (invariants 2, 3):** `phone_otp:UID` and `google_sign_in:UID` (identical `UID`) become **two distinct** authoritative docs, both owned by the one identity; both resolve through `-09` to that same identity.
  - **same-uid unlink (F2-keying-resolution proof):** the same-uid second provider is unlinked **without** tripping the last-reference invariant, the original reference remaining `linked` — the exact §16 scenario, now coherent.
  - **F2 same-principal gate:** a provider verified for a **different** Firebase uid is refused (`AUTH_FORBIDDEN`) before `-08`, with nothing written and **no** conflict event.
  - **defense-in-depth composition:** `-08` **independently** still rejects a reference already owned by another customer identity (exercised directly, `VALIDATION_FAILED` + conflict event, ownership unchanged) — proving the same-principal gate and `-08`'s cross-identity control coexist, neither replacing the other.
  - **F1 suspended-state link/unlink rejection:** a suspended acting identity is refused (`ACCOUNT_SUSPENDED`) with nothing written / nothing removed.

  The original "link a second provider" and "unlink a non-final provider" emulator tests were updated to the same-uid shape (a different-uid link is now correctly refused by the F2 gate). `-08`'s own cross-identity emulator tests (`authenticationReferenceRepository`/`authenticationReferenceKeying`) are unchanged and remain valid as tests of `-08` itself.

### 17.6 Required-invariant evidence
1. Active identity links an additional provider — emulator "links a second provider (same uid)". 2. Same-uid two providers = distinct references — emulator same-uid multi-provider test. 3. Both resolve via `-09` to one identity — emulator dual-resolution assertions. 4. Link never merges two customer identities — two composed controls: the **F2 same-principal gate** refuses a foreign-uid provider before `-08`, and **`-08`** independently rejects a reference already owned by another identity (`VALIDATION_FAILED`, ownership unchanged, `…ConflictDetected`). 5. Reference owned by another identity rejected — `-08` direct-exercise test. 6/7. Access state enforced before link/unlink — unit + emulator F1 tests. 8. One of multiple references unlinked — emulator non-final + same-uid unlink. 9. Remaining reference still resolves — emulator assertions on the surviving `linked` ref. 10. Final-reference unlink rejected — emulator `INVALID_STATE_TRANSITION`. 11. Retry idempotency — derived credential-bound key consumed from `-08` (unchanged). 12. No credential material persisted — orchestration references no `rawToken`; secret grep clean; result asserted token-free. 13. No new error category — reused constructors only (F2 adds a constructor in the existing `AUTH_FORBIDDEN` category). 14. `CustomerAuthenticated` not emitted by AUTH-05 — AUTH-05 emits nothing. 15. No unrelated behavior changed — `git diff origin/main` touches only the AUTH-05 paths (six code + `authenticationErrors.ts`) + reconciled docs.

Founder-directed F2-gate regression coverage (all proven): acting uid = provider uid → link proceeds; acting uid ≠ provider uid → refused before `-08`; no reference written on mismatch; no customer identities merged; normal same-uid multi-provider link still works; `-08` independently still rejects a reference owned by another identity; unlink and last-reference protection unchanged.

### 17.7 Validation (resumption, from the clean worktree)
- `pnpm -r typecheck` — clean (functions + web). `pnpm lint` (`eslint .`) — clean. `pnpm format:check` — clean. `pnpm build` — clean.
- `pnpm test` — **functions 513/513** (+2 F2-gate unit tests), **web 300/300**.
- `pnpm emulators:validate` — the **AUTH-05 emulator file passes 11/11** in isolation. The only full-suite failures are the inherited timeout flakes (`commandDispatcher.emulator.test.ts` = `ENG-P1-002-CR1`; `crossPackageIdentityIntegration.emulator.test.ts` Scenario-7 race) plus, on a heavily-contended local machine, transient `beforeAll`/transaction timeouts in the unmodified `-08` `authenticationReferenceRepository.emulator.test.ts` — all environmental (they pass in isolation and on CI's isolated runner). CI is the authoritative emulator gate (see §17.9).
- e2e (Playwright) — run by CI (canonical gate); AUTH-05 is backend-only (functions), no `apps/web` change.

### 17.8 Security / privacy
Unchanged from §7 and re-verified: no `rawToken`/OTP/secret persisted, logged, or returned; orchestration layer references no credential material; `firestore.rules` unchanged; Admin-SDK callables open no client write path. Secret grep over the AUTH-05 diff: clean.

### 17.9 PR-review gate — two rounds, incl. Founder F2 disposition

**Round 1 (F1 only).** The reconstructed branch was pushed to PR #92 (head `c84d0a0`); **CI green** (run 31321548248 — build/lint/format/typecheck/unit/**Playwright e2e**/**emulator validation** all ✓; the local emulator flakes did **not** recur on CI's isolated runner). The PR-review gate then re-inspected the automated (Codex) findings from the original head:
- **F1** ("enforce the acting identity's access state") — **CONFIRMED fixed** by §17.3's F1 gate.
- **F2** ("reject links between different Firebase UIDs") — the automated reviewer re-anchored this to the new head. Rather than dispose of a P1 identity-integrity finding unilaterally, it was **escalated to the Founder** (it turns on whether AUTH-05 must enforce same-Firebase-uid linking at the backend, or rely on `-08` cross-identity + AUTH-04 upstream Firebase-native linking — an interpretation of AUTH-BP §7's "one Firebase Auth user" premise that AUTH-CORR-002 did not explicitly settle).

**Founder disposition (recorded):** **add the defensive same-UID gate.** "AUTH-05 account linking is explicitly a same-Firebase-user operation under the approved Model-T architecture … before invoking `-08`, AUTH-05 must verify `verifiedNewProviderUid === actingAuthenticatedUid`; if they differ, fail closed using the existing taxonomy. Defense-in-depth — do not remove, relax, or repurpose `-08`'s cross-identity protection." Implemented as §17.3's F2 gate, with the regression coverage the Founder specified (§17.6).

**Round 2 (F1 + F2).** Re-validated (functions 513/513, web 300/300, AUTH-05 emulator 11/11, typecheck/lint/format/build clean) and pushed to PR #92 (code head **`b08b568`**).

- **CI on code head `b08b568`:** **success** (run 31365239878 — build/lint/format/typecheck/unit/**Playwright e2e**/**full emulator validation** all ✓ on CI's isolated runner; no flakes recurred).
- **PR mergeability:** `MERGEABLE`, `mergeStateStatus = CLEAN`.
- **Review-findings disposition against the current head (`b08b568`):**
  | # | Finding | Severity | Validity | Disposition |
  |---|---|---|---|---|
  | F1 | Enforce the acting identity's access state | P1 | Valid | **Fixed** — `resolveActingIdentity` loads the identity and `assertActingIdentityMayMutate` gates it (`active`/`suspended`/other), before any `-08` mutation. Unit + emulator coverage. |
  | F2 | Reject links between different Firebase UIDs | P1 | Valid (per Founder disposition) | **Fixed** — Founder-directed same-Firebase-principal gate in `linkAuthenticationProvider` (verified-uid equality before `-08`), plus `-08`'s untouched cross-identity control. Unit + emulator coverage. |
  - No **new** automated (Codex) review was posted against `b08b568`; the two inline P1 threads are the original review's, both now resolved in code (GitHub re-anchors the F2 thread to the line immediately below the new gate). No human review comments; no other unresolved threads.
- **No unresolved material P1/P2 findings remain.**
- **Final PR #92 head SHA / final CI:** the last commit is documentation-only (this §17.9 evidence); its CI is recorded with the completion report. The substantive, code-validating CI is `b08b568` above.

## Final Gate (resumption — 2026-08-09)

**AUTH-05 READY FOR FOUNDER REVIEW/MERGE.** F2's keying block is resolved by the Founder-approved AUTH-CORR-002 tuple model (merged), and the Founder-directed same-Firebase-principal gate now enforces AUTH-BP §7's "one Firebase Auth user" premise as defense-in-depth alongside `-08`'s untouched cross-identity control. F1 (acting-identity access-state enforcement) is corrected via TDD, reusing AUTH-03's gate and the closed taxonomy. All required invariants are proven by unit + real-emulator tests; local validation is green (the only emulator failures are environmental/inherited flakes, proven to pass in isolation and on CI). PR #92 is **not** self-merged; AUTH-06+ is **not** started; the dirty primary worktree is untouched. Final head SHA / CI / review disposition recorded in §17.9 after the round-2 push.
