# AUTH-07 — Session / Access Gating — Implementation Report

> **Title:** AUTH-07 — Session / Access Gating (session establishment, identity-protected-action gate, privileged re-authentication, sign-out)
> **Version:** 1.0 · **Status:** Implemented, test-first (TDD) — pending Founder-authorized review/merge · **Classification:** Working (engineering implementation report)
> **Governing contract:** [`AUTH-BP` §9 / §12](../roadmap/AUTH-BP-authentication-blueprint-2026-08-08.md); [`DEC-AUTH-001`](../../00-governance/decisions/decision-register.md); TRD12 §12.29 (Privileged Reauthentication); TRD10 §10.6.1
> **Source-of-truth path:** `docs/05-implementation/reports/AUTH-07-session-access-gating-2026-08-10.md`
> **Author:** Claude (AI agent), per Founder task "TASK — AUTH-07 Implementation"

## 1. Founder authorization

This report records the **fresh Founder implementation authorization** for AUTH-07 — the **seventh** Authentication implementation package under `AUTH-BP`, authorized in-session per the AUTH-01/-02/-03/-04/-05/-06 convention (recorded in the Master Workflow §17, CDR-001 §5, the implementation-changes log, and the documentation-changes log; no new/competing authorization mechanism). The authorization covers **AUTH-07 only**; AUTH-08+ is **not** authorized.

Two additional Founder decisions were obtained at the AUTH-07 entry gate (see §3, §6) and are recorded here:

- **AD-1 (additive AUTH-01/AUTH-02 dependency adjustment):** AUTH-07's privileged re-authentication requires the token's trusted authentication instant (`auth_time`), which the merged AUTH-02 verifier did not surface. The Founder authorized the **minimum additive** extension of the AUTH-01/AUTH-02 contracts and verifier to expose it as a server-derived `authenticatedAt`, distinct from `verifiedAt`, never accepted from client input. Not a redesign; no change to authentication-reference semantics or provider keying.
- **AD-2 (privileged re-authentication freshness window):** default **5 minutes**, kept configurable/injectable per TRD12 §12.29 (which fixes only that the age "shall be configurable", no value). Selected as the conservative current policy for high-sensitivity operations; a default, not a fixed architectural constant. No per-action windows introduced (none governed).

## 2. Entry repository state

- **origin/main SHA:** `04e11715a445f67cd472962721579e9f3a640dfe` (AUTH-06 merge commit, PR [#95](https://github.com/Fkenogo/11THONUS/pull/95), merged 2026-08-10T09:27:45Z; post-merge CI **success**, run 31374698932). AUTH-06 = **merged and closed**; the corrected AUTH-06 implementation is on `main`.
- **Clean worktree:** `…/scratchpad/auth-07`, detached from `04e1171`, then branch `feat/auth-07-session-access-gating`. Verified clean, zero divergence, no Git locks, no in-progress merge/rebase/cherry-pick.
- **Isolation:** the dirty **primary** worktree (`/Users/theo/11THONUS`) was **untouched**; the reported stale linked worktrees were **not** used or cleaned up.
- **Programme-currency sync (Phase A2):** on entry, Master Workflow §17 and CDR-001 §5 still described **AUTH-06 as "pending review/merge" / "AUTH-07 not started"**; AUTH-06 had in fact merged. Reconciled with **dated superseding notes** (history preserved) under the existing AUTH-03/AUTH-05 convention — programme-currency only, no code/capability/numbering change, no competing source of truth. This did not require separate authorization.

## 3. Authoritative requirement, acceptance criteria & boundaries

**AUTH-07 (AUTH-BP §9 / §12):** *Session / access gating — session establishment, identity-protected-action gate, privileged re-authentication, sign-out*, spanning `functions/src/domains/authentication/services` and `apps/web/src/authentication/*`.

**Acceptance criteria (met verbatim):**
1. **Session establishment** — a verified credential + resolved active identity produces a `SessionContext` (via the existing AUTH-01 `createSessionContext`; Firebase remains the token authority — no bespoke token store).
2. **Identity-protected-action gate** — identity-protected actions require a valid session (resolve → access-state gate); browsing does not.
3. **Privileged re-authentication** — sensitive actions additionally require *recent* authentication, **server-enforced** from the trusted `authenticatedAt` against a server clock (default 5 min, configurable).
4. **Sign-out** — clears the client session (Firebase `signOut`); the server holds no long-lived session to revoke.

**Boundaries preserved:**
- `CustomerAuthenticated` **remains AUTH-08-owned** — AUTH-07 emits **no** domain events (no outbox/emit seam).
- `AuthenticationRecoveryProofProvided` remains its authoritative owner (AUTH-08) — AUTH-BP does not assign it to AUTH-07.
- AUTH-03 registration/sign-in orchestration, AUTH-04 frontend flows, AUTH-05 linking, AUTH-06 recovery proof — **behaviour unchanged** except the additive `authenticatedAt` field consumed where type/test compatibility requires.
- Tuple-qualified `(referenceType, referenceId)` identity, same-Firebase-principal linking, `-08` global-ownership, `-09` resolution, AUTH-03 idempotency/atomicity, AUTH-05 access-state gates, AUTH-06 proof binding — all untouched.
- Closed 14-category error taxonomy (TRD11 §11.35) — **no new category**; fail-closed preserved; deny-by-default Rules unchanged (no new client write path).
- **Later packages deferred:** AUTH-08 (events → ITM/audit), AUTH-09 (validation & closure). Not started.

## 4. Pre-change codebase analysis

- **Session establishment already existed** at the value level: AUTH-03 issues a `SessionContext` via AUTH-01 `createSessionContext`. AUTH-01's `sessionContext.ts` explicitly reserved session *management* (validity/expiry, privileged re-auth, sign-out) for AUTH-07. AUTH-07 therefore adds the **gates** and the **sign-out** — it does not re-invent establishment.
- **No freshness/`auth_time`/reauth concept existed** anywhere (grep-verified). Correct privileged re-auth must anchor on `auth_time` (a token refresh advances verification time but not the authentication instant); the merged AUTH-02 verifier stamped only `verifiedAt = now()` and `signInProvider`. → AD-1.
- **Access-state gate policy** (`active`→proceed; `suspended`→`ACCOUNT_SUSPENDED`; else→`AUTH_FORBIDDEN`) is already applied at the boundary by AUTH-03 (`assertMaySignIn`) and AUTH-05 (`resolveActingIdentity`), each re-applying it locally rather than sharing a private helper. AUTH-07 follows that established pattern (re-applies the policy; consumes `-06`-owned access state as data — no duplication of state, no modification of AUTH-03/AUTH-05).
- **Resolution** is the AUTH-02 `resolveAuthenticatedCredential` consuming the merged `-09` lookup (`purpose: "authentication"`, enumeration-resistant). AUTH-07 consumes it as an injected seam.

## 5. Implementation strategy & files

**Additive AUTH-01/AUTH-02 extension (AD-1):**
- `models/authenticatedCredential.ts` — add **optional** `authenticatedAt?: Date` (non-breaking contract extension; validated when present). Optional was chosen over required after inspecting all producers (27 factory call-sites + bare literals across AUTH-01–06 tests): optional is the safest, minimum, non-breaking additive change consistent with the current architecture, while production credentials always carry it (the verifier always populates it) and AUTH-07 fails closed if it is ever absent.
- `services/firebaseTokenVerifier.ts` — derive `authenticatedAt` from the verified `auth_time` claim (seconds→ms), server-side only; **fail closed** (`AUTH_REQUIRED`) if the trusted signal is absent/non-finite. `verifiedAt` semantics unchanged; resolution, keying, provider mapping unchanged.

**AUTH-07 proper:**
- `models/privilegedReauthentication.ts` (pure domain, no Firebase) — `DEFAULT_PRIVILEGED_REAUTH_MAX_AGE_MS = 5*60*1000` and `assertFreshAuthentication(credential, now, maxAgeMs?)`: eligible iff `0 <= (now − authenticatedAt) <= maxAgeMs`; absent/future/stale → `AUTH_REQUIRED`; `now` always injected (server-controlled). `verifiedAt` is deliberately never consulted.
- `services/sessionAccessService.ts` (services) — `authorizeIdentityProtectedAction` (resolve → access-state gate → establish `SessionContext`; unresolved → `AUTH_REQUIRED`) and `authorizePrivilegedAction` (the protected-action gate **then** `assertFreshAuthentication`; access-state runs before freshness). Injected seams default to the merged implementations. Emits nothing.
- `apps/web/src/authentication/signOutFlow.ts` — `signOutCurrentSession(auth, deps?)` wrapping Firebase `signOut` (injected seam; network-safe).
- `apps/web/src/authentication/privilegedReauthenticationFlow.ts` — `reauthenticateForPrivilegedAction(auth, deps)` runs a provider re-auth (advances `auth_time`) then returns a **force-refreshed** ID token so the backend freshness gate sees the new instant. Client cannot vouch for its own freshness; it only obtains a token the server can trust.

**Files created:** `functions/.../models/privilegedReauthentication.ts` (+ `.test.ts`), `functions/.../services/sessionAccessService.ts` (+ `.test.ts`, + `.emulator.test.ts`), `apps/web/.../authentication/signOutFlow.ts` (+ `.test.ts`), `apps/web/.../authentication/privilegedReauthenticationFlow.ts` (+ `.test.ts`).
**Files modified (additive only):** `functions/.../models/authenticatedCredential.ts` (+ `.test.ts`), `functions/.../services/firebaseTokenVerifier.ts` (+ `.test.ts`).
**Not touched:** AUTH-03/04/05/06 service/orchestration logic; `-08`/`-09`; shared idempotency/outbox; `firestore.rules`; `index.ts`.

## 6. Governance check on the freshness window (AD-2)

TRD12 §12.29 governs *which* actions require recent authentication and states the accepted reauthentication age **"shall be configurable"** — it fixes **no numeric value**; no value exists in AUTH-BP, DEC-SEC-001, or elsewhere (grep-verified). Per the Founder's explicit gate, the value was **escalated** rather than invented; the Founder set the default to **5 minutes**, kept configurable/injectable. The implementation honours §12.29: `maxAgeMs` is an injected option defaulting to `DEFAULT_PRIVILEGED_REAUTH_MAX_AGE_MS`, and tests prove a non-default value works (5 min is a default, not a hard-coded constant).

## 7. Tests & RED→GREEN evidence

- **RED:** the extended `authenticatedCredential.test.ts`/`firebaseTokenVerifier.test.ts` cases and the two new modules failed (5 failing / missing modules) before implementation.
- **GREEN — new/changed unit tests:** model freshness (below/at/above the max; configurable non-default value; refresh-does-not-reset; absent/future fail-closed; invalid `now`); credential `authenticatedAt` (surfaced/distinct/optional/validated); verifier (`auth_time`→`authenticatedAt` distinct from `verifiedAt`; missing/malformed `auth_time` fail-closed); session gate (establish; unresolved→`AUTH_REQUIRED`; suspended→`ACCOUNT_SUSPENDED`; locked→`AUTH_FORBIDDEN`; privileged recent-pass/stale-reject/absent-reject; access-state-before-freshness; configurable window); frontend sign-out and privileged-reauth force-refresh.
- **GREEN — emulator (`sessionAccessService.emulator.test.ts`, +4):** against real `-09` resolution + persisted identity state — establish for active; unresolved→`AUTH_REQUIRED`; suspended→`ACCOUNT_SUSPENDED`; privileged recent-pass and stale-reject on a freshly-verified token.

## 8. Full validation results

- functions unit **547/547**; web unit **304/304**; `pnpm emulators:validate` **216/216** (+4 AUTH-07 emulator; no inherited flake recurred).
- `pnpm typecheck` clean; `pnpm lint` clean; `pnpm format:check` clean; `pnpm build` clean; `pnpm test:e2e` 1/1.
- **Commands executed:** `git fetch --all`; `gh pr view/checks 95`; `gh run list`; `git worktree add --detach`; `pnpm install --frozen-lockfile`; `pnpm --filter functions test` (focused + full); `pnpm --filter web test`; `pnpm emulators:validate`; `pnpm typecheck`; `pnpm lint`; `pnpm format`; `pnpm build`; `pnpm test:e2e`.
- **Dependencies added:** none. **Configuration changes:** none. **Migrations:** none.

## 9. Security / identity / session / freshness verification

- **No credential material** persisted, logged, or returned (TRD10 §10.6.1): `authenticatedAt` is a timestamp; the raw token is consumed by the verifier only (pre-existing); the frontend fresh token is returned once for the immediate call, never stored/logged. Grep over the AUTH-07 diff clean.
- **Fail-closed:** unresolved credential → `AUTH_REQUIRED`; non-active identity → `ACCOUNT_SUSPENDED`/`AUTH_FORBIDDEN`; absent/future/stale authentication → `AUTH_REQUIRED`; token lacking `auth_time` → `AUTH_REQUIRED`. Closed taxonomy; no new category.
- **Freshness integrity (replay/refresh):** anchored on `authenticatedAt` (server-derived from `auth_time`), compared to an **injected server clock**; a freshly-verified but old-authentication token is rejected (proven); client clocks/timestamps never determine freshness. Access-state gate precedes freshness.
- **No client write path** opened; Rules unchanged; dependency direction preserved (pure model → services; frontend consumes Firebase auth via injected seams).

## 10. Risks / observations / verified inherited items

- The privileged-action gate is a reusable server library ready for consumption by future protected-action endpoints; AUTH-07 deliberately introduces **no** new protected callable (that would be premature scope). The server gate is the enforcement boundary; the frontend helper only helps the user satisfy it.
- No inherited flake recurred in `emulators:validate`. The benign `functions/lib/index.js does not exist` notice during `emulators:exec` is the pre-existing harness condition (functions not pre-built for the exec wrapper) and does not affect the test run.

## 11. Rollback

Discard the branch (not merged), or `git revert` the AUTH-07 commit: removes `privilegedReauthentication.*`, `sessionAccessService.*`, `signOutFlow.*`, `privilegedReauthenticationFlow.*`, and the additive `authenticatedAt` from `authenticatedCredential.ts`/`firebaseTokenVerifier.ts`. No data/migration impact; existing consumers are unaffected (the field was optional/additive).

## 12. Version control & gates

- Branch `feat/auth-07-session-access-gating` off clean `04e1171`; AUTH-07 work only. **Not** self-merged. AUTH-08+ **not** started. Dirty primary worktree untouched; no unrelated worktree cleanup.
- PR opened per AUTH convention (base `main`). Final PR-review gate applied (see §13 once CI/review complete).

## 13. PR review gate

_To be completed after push/CI: all automated + human review comments inspected against the current PR head; every substantive finding recorded with severity/validity/applicability/disposition; no unresolved material P1/P2 finding may remain before READY._

## Final gate

**AUTH-07 READY FOR FOUNDER REVIEW/MERGE** — subject to §13 (post-push CI + PR-review inspection). Acceptance criteria met verbatim; TDD RED→GREEN; full validation green; boundaries preserved; not self-merged; AUTH-08 not started.
