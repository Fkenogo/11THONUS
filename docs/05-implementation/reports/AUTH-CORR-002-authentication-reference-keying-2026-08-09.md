# AUTH-CORR-002 — Authentication-Reference Keying Alignment (Implementation Report)

> **Title:** AUTH-CORR-002 — Provider-Qualified Authentication References (Model T)
> **Version:** 1.0 · **Status:** Implemented (application code, TDD) — pending Founder-authorized review/merge · **Classification:** Working (implementation report)
> **Governing document:** [`AUTH-BP` §3](../roadmap/AUTH-BP-authentication-blueprint-2026-08-08.md) (amended here); [`ENG-P2-ARCH-001` §7](../roadmap/ENG-P2-ARCH-001-customer-identity-architecture.md); [`DEC-AUTH-001`](../../00-governance/decisions/decision-register.md)
> **Source-of-truth path:** `docs/05-implementation/reports/AUTH-CORR-002-authentication-reference-keying-2026-08-09.md`
> **Last controlled update:** 2026-08-09 (`AUTH-CORR-002` — created)

**Founder decision recorded.** Authentication references are **provider-qualified**: the canonical identity of an authentication reference is the tuple `(referenceType, referenceId)`, where — under the current Firebase architecture — `referenceId` remains the verified Firebase authUid. A bare Firebase UID must not by itself be the reference identity. The Firebase principal and an authentication reference are distinct concepts, but the reference may legitimately use the verified UID as its subject component **when qualified by reference type**. Full independence of the reference subject from the Firebase principal is **not** required and **not** authorized by this correction. **Reason:** a bare Firebase UID cannot coherently represent multiple linked authentication methods (surfaced by the AUTH-05 final PR-review gate). **AUTH-05 remains BLOCKED until AUTH-CORR-002 is merged and verified. AUTH-06+ not authorized.**

This decision resolves the earlier "principal ≠ reference" statement in favour of **Model T** (qualify by `(referenceType, uid)`), explicitly declining external provider subjects, phone-number subjects, keyed HMACs, peppers, secret-management, or migration machinery.

## 1. Entry state

- `origin/main` = `3d69e125ed76ecf623dec753c0adb21307534ddb` (advanced from `30df95c` only by PR #93 — docs-only MPA-004; AUTH code unchanged).
- **AUTH-04** MERGED (PR #91). **AUTH-05 PR #92 OPEN and unmerged** (head `e04d2ff`), still BLOCKED. No AUTH-06 work.
- Clean linked worktree from `3d69e12`, branch `feat/auth-corr-002-reference-keying`, 0/0 divergence, clean, no in-progress git op. Dirty primary worktree untouched (read-only git only).

## 2. Exact root cause

Global uniqueness and `-09` resolution were **already** provider-type-qualified — the authoritative document is `authenticationReferences/{referenceType}:{referenceId}` (`authenticationReferenceRepository.ts` `authenticationReferenceDocId`), and `-09` resolves via that key. The defect lived **only** in the **embedded per-identity projection** (`customerIdentity.ts` `link/unlinkAuthenticationReference`), which deduped, matched-for-unlink, and enforced the last-reference invariant by **`referenceId` alone**. Two providers sharing a `referenceId` (the shared Firebase uid) therefore collapsed to one projection entry, and unlinking a same-UID provider tripped the last-reference invariant — the exact incoherence that blocked AUTH-05.

## 3. Provider-subject evidence (why Model T, not an external subject)

From the *verified* token path: `firebase.identities` (`DecodedIdToken`, typed `{ [key: string]: any }`) exposes a safe, opaque, non-PII subject for **Google** (`google.com` account id) but for **Phone** only the **phone number** — PII, and *directly enumerable* as a document-ID key (regressing `-09`'s enumeration resistance). A safe uniform external-subject model for phone would require a keyed HMAC/pepper (a new secret + key-management mechanism) plus AUTH-02/AUTH-03 changes and a migration — all **out of scope** for a minimum bounded correction and explicitly **not authorized**. The Founder therefore selected **Model T**: keep `referenceId = decoded.uid`, and make the *reference identity* the provider-qualified tuple `(referenceType, referenceId)`. This is non-PII, non-enumerable, migration-free, and localizes the change to the embedded-projection keying.

## 4. Chosen representation

- **Reference identity:** `(referenceType, referenceId)`; `referenceId` remains the verified Firebase authUid.
- **Authoritative uniqueness/resolution:** unchanged — `authenticationReferences/{referenceType}:{referenceId}` (already tuple-keyed).
- **Embedded projection:** now dedupes, matches-for-unlink, and counts the last-reference invariant on the **full tuple**.

## 5. Files modified

| File | Change |
|---|---|
| `functions/src/domains/identity/models/customerIdentity.ts` | `linkAuthenticationReference` dedupe → `(type, id)` tuple; `unlinkAuthenticationReference` signature `referenceId: string` → `reference: { referenceType, referenceId }`, find/filter on the tuple; new exported `AuthenticationReferenceKey` type; imports `AuthenticationReferenceType`. |
| `functions/src/domains/identity/events/identityEvents.ts` | `AuthenticationReferenceUnlinkedPayload` gains an **additive** `referenceType` (audit fidelity: records *which* provider was unlinked; the linked event already carried it). |
| `functions/src/domains/identity/repositories/authenticationReferenceRepository.ts` (`-08`) | `alreadyEmbedded` (AUTH-CORR-001 branch) → tuple; unlink call passes the `{ referenceType, referenceId }` tuple. |
| `functions/src/domains/identity/models/customerIdentity.test.ts` | Updated 3 existing unlink call sites to the tuple signature; **added 5** provider-qualified tests. |
| `functions/src/domains/identity/repositories/authenticationReferenceKeying.emulator.test.ts` | **New** — end-to-end emulator proof (A–F). |
| `docs/05-implementation/roadmap/AUTH-BP-authentication-blueprint-2026-08-08.md` (§3) | Governing amendment stating the provider-qualified tuple identity (original wording preserved). |

## 6. Impact on completed responsibilities

- **AUTH-02** — **no change** (still `referenceId = decoded.uid`; provenance from verified `sign_in_provider`).
- **`-09`** — **no change** (already resolves via `{type}:{id}`).
- **`-08`** — aligned only where it keyed the embedded projection by `referenceId` alone (`alreadyEmbedded` + the unlink call); authoritative uniqueness/transaction/idempotency/conflict semantics unchanged.
- **AUTH-03** — **no change** (registration/sign-in orchestration and idempotency keys are unchanged; `referenceId` stays the uid). Its full emulator regression suite (new-registration, same-key replay, partial-failure resume, concurrent-no-orphan) passes unchanged.
- **AUTH-04** — **no change** (frontend contract unaffected).
- **AUTH-05** — **unblocked by this correction**: same-UID `phone_otp:uid` and `google_sign_in:uid` are now distinct references, so AUTH-05's same-UID link creates a distinct reference and unlink preserves the other. AUTH-05 itself is **not** implemented here and remains BLOCKED pending this merge.

## 7. Data/schema compatibility

**No migration.** Existing authoritative documents already use `{referenceType}:{referenceId}`; existing embedded projections (one reference per identity today) remain valid under tuple keying (a single entry is trivially tuple-unique). The only event-contract change is the **additive** `referenceType` field on the unlinked event — backward-compatible for the `-10` audit projection.

## 8. Target invariants — proof

All 14 target invariants hold (unit + emulator):
(1) multiple references per identity — **A**; (2) distinguishable by provider-qualified identity — **A**; (3) same-identity linking doesn't create a second identity — **A/D**; (4) never merge two distinct identities — **C** (`{type}:{id}` uniqueness, cross-identity fail-closed); (5) one reference ↦ one identity — **C**; (6) unlink one, preserve other — **D**; (7) last-reference protected — **E**; (8) `-09` resolves — **B**; (9)/(10) AUTH-03 retry/concurrency/idempotency preserved — full AUTH-03 emulator suite green; (11) no raw material persisted — **F**; (12) `CustomerAuthenticated` still AUTH-08 (untouched); (13) no new error taxonomy; (14) fail-closed intact.

## 9. Tests (TDD, RED→GREEN)

- **RED:** the 3 tuple model tests failed against the pre-fix `referenceId`-only dedupe (`duplicateAuthenticationReferenceError`).
- **GREEN — unit:** 5 new provider-qualified model tests (functions **491→496**), 3 existing unlink call sites migrated to the tuple signature; whole model file 29/29.
- **GREEN — emulator:** new `authenticationReferenceKeying.emulator.test.ts` (A–F) proves same-UID two-provider distinctness, dual resolution, cross-identity fail-closed, unlink-one-preserve-other, last-reference protection, and no-secret-persistence, through the real `-08`/`-09` transaction.

## 10. Full validation (2026-08-09, clean worktree, CI order)

`pnpm build` clean · `pnpm lint` clean · `pnpm format:check` clean · `pnpm typecheck` clean · `pnpm test` = **functions 496/496 + web 300/300** · `pnpm test:e2e` **1/1** · `pnpm emulators:validate` **17 files / 194 tests, all green** (the `ENG-P1-002-CR1` dispatcher flake did not trigger this run). Secret/credential grep over changed files: clean (no raw token/OTP/phone/email introduced; `referenceId` stays the opaque uid).

## 11. Commands executed (representative)

```
git worktree add -b feat/auth-corr-002-reference-keying <wt> 3d69e12 ; pnpm install --frozen-lockfile
pnpm --filter functions exec vitest run src/domains/identity/models/customerIdentity.test.ts -t AUTH-CORR-002   # RED then GREEN
pnpm build && pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm test:e2e
pnpm emulators:validate
```

## 12. Dependencies / configuration

**None.** No dependency, Firestore index, Rules, or environment change.

## 13. Security / privacy

No raw token/OTP/phone/email introduced anywhere; `referenceId` remains the opaque Firebase uid. Enumeration resistance preserved (uid opaque; `-09` unchanged). Deny-by-default Rules unaffected. Fail-closed behavior preserved (cross-identity conflict still `VALIDATION_FAILED`; last-reference still `INVALID_STATE_TRANSITION`).

## 14. Risks & observations

Low — a localized keying alignment fully covered by unit + real-emulator tests, with no AUTH-02/`-09`/AUTH-03/AUTH-04 behavior change and no migration. The additive unlinked-event `referenceType` improves multi-provider audit fidelity.

## 15. Rollback

`git revert` the AUTH-CORR-002 commit, or discard the branch (not merged). Reverts the embedded-projection keying and the additive event field; no data/schema impact.

## 16. PR & review-findings disposition

- **PR:** [#94 — AUTH-CORR-002](https://github.com/Fkenogo/11THONUS/pull/94), base `main`. **Final reviewed head:** `a53ffb8069bb6087898bdca92a893b4e557c11d2`. Not self-merged.
- **Reviewer:** the repository's automated reviewer (Codex) posted a `COMMENTED` review on the initial head `e02f8fb` with **one P1**. No human review; no unresolved threads on later commits.

| # | Finding | Severity | Valid? | Disposition |
|---|---|---|---|---|
| F1 | **Update the existing unlinked-event test for the required type** — `identityEvents.test.ts`'s `buildAuthenticationReferenceUnlinkedEvent` test called the builder without `referenceType` and `toEqual`-asserted a payload lacking it, so the additive-required field left it silently building `referenceType: undefined` (passing only because Vitest `toEqual` elides `undefined`, and `tsconfig` excludes `*.test.ts` from `tsc`). | P1 | **Valid & CONFIRMED** — test correctness / coverage of the additive field. | **Fixed** on `a53ffb8`: the test now passes and asserts `referenceType: "phone_otp"`, guarding the field. In AUTH-CORR-002 scope (the field is introduced by this correction); no completed-responsibility behavior changed. Re-validated: functions **496/496**, events test 17/17, typecheck/lint/format clean. |

- **Re-inspection after the fix push (`a53ffb8`):** no new or unresolved automated/human findings. No unresolved material P1/P2 finding concerning correctness, security, privacy, identity integrity, concurrency, atomicity, retry, idempotency, architecture, responsibility boundaries, or data integrity remains. Green CI is not treated as sufficient on its own — every finding above was evaluated against the current head.

## Final Gate

**AUTH-CORR-002 implemented, test-first (TDD), pending Founder-authorized review/merge.** Not self-merged; AUTH-05 remains BLOCKED pending this merge; AUTH-06+ not started; dirty primary worktree untouched.
