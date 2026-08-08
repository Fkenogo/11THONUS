# AUTH-CORR-001 — Initial Authentication-Reference Linking Reconciliation (Implementation Report)

> **Title:** AUTH-CORR-001 — Initial Authentication-Reference Linking Reconciliation
> **Version:** 1.0 · **Status:** Implemented (TDD) — pending Founder-authorized review/merge · **Classification:** Working (implementation report)
> **Governing documents:** [`AUTH-02` report §12](AUTH-02-token-verification-and-identity-resolution-2026-08-08.md); [`AUTH-BP`](../roadmap/AUTH-BP-authentication-blueprint-2026-08-08.md) §5; [`ENG-P2-ARCH-001`](../roadmap/ENG-P2-ARCH-001-customer-identity-architecture.md) §7; [`DEC-AUTH-001`](../../00-governance/decisions/decision-register.md)
> **Source-of-truth path:** `docs/05-implementation/reports/AUTH-CORR-001-initial-authentication-reference-linking-2026-08-08.md`
> **Last controlled update:** 2026-08-08 (`AUTH-CORR-001` — created)

**Scope.** A bounded interface/integration correction discovered through AUTH-02 (§12). It reconciles the `-01 → -08 → -09` initial authentication-reference lifecycle so that AUTH-03 can create an identity through `-01`, establish its verified initial authentication reference through `-08`, and subsequently resolve it through `-09`. **Not** AUTH-03; **not** registration/sign-in orchestration; no `-01` responsibility change; no AUTH-02 change; no new error category; no capability renumbering.

## 1. Entry / final repository state
- **Entry:** fresh worktree off `origin/main` @ `184566e` (AUTH-02 merged; post-merge CI green), clean, `0/0`.
- **Final:** `feat/auth-corr-001-initial-reference-linking`; working tree = `authenticationReferenceRepository.ts` + two emulator test files + docs only; no unrelated files.

## 2. Exact root cause of the §12 finding
`registerCustomerIdentity` (`customerIdentity.ts:87`) builds the aggregate with the initial reference **embedded** (`authenticationReferences: [initialReference]`) and `createCustomerIdentity` persists only `users/{id}` — it never writes the authoritative `authenticationReferences/{type}:{id}` document. The `-08` link path calls the domain `linkAuthenticationReference` (`customerIdentity.ts:206`), whose duplicate guard (`:218`) throws `duplicateAuthenticationReferenceError` (`VALIDATION_FAILED`) for **any** referenceId already present in the embedded projection. So completing the initial reference was rejected as a within-identity duplicate even though the authoritative uniqueness document (the real guard, read by `-09`'s `getActiveAuthenticationReferenceOwner`) did not exist. **Implementation mismatch, not an intended invariant:** the embedded-presence check conflated "already fully linked (embedded + authoritative)" with "embedded-only (initial, authoritative missing)."

## 3. Pre-change fix strategy
Inside the existing `linkAuthenticationReferenceForIdentity` transaction (the existing `-08` responsibility — no new function, no `-01` change), add one branch keyed on the **authoritative-doc state**: authoritative document **absent** *and* reference **already embedded in this identity** → materialise the authoritative document, emit `AuthenticationReferenceLinked`, and leave the embedded projection untouched. All other cases are unchanged: cross-identity (authoritative doc owned by another identity) → conflict/fail-closed; authoritative absent & not embedded → the existing new-provider path; authoritative present & same identity → the existing domain duplicate rejection.

## 4. Files modified
| File | Change |
|---|---|
| `functions/src/domains/identity/repositories/authenticationReferenceRepository.ts` | Import `buildAuthenticationReferenceLinkedEvent`; add the initial-reference materialisation branch to `linkAuthenticationReferenceForIdentity` (hoisted the shared `authRefRecord`). |
| `functions/src/domains/identity/repositories/initialAuthenticationReferenceLinking.emulator.test.ts` | **New.** The `-01 → -08 → -09 → AUTH-02` lifecycle emulator tests (required tests 1–5, 8, 9). |
| `functions/src/domains/identity/repositories/authenticationReferenceRepository.emulator.test.ts` | Re-targeted the test that encoded the §12 defect ("rejects linking a reference already active on the same identity") to prove the *genuine* duplicate (re-linking an **already authoritatively linked** reference still fails closed). |

## 5. Code diff summary
One new conditional path in `-08`: when the authoritative `authenticationReferences/{type}:{id}` document is absent and the referenceId is already embedded in the owning identity, the transaction writes the authoritative record (same `authRefRecord`/`stampCreate`/`schemaVersion` shape as the normal link) + emits `AuthenticationReferenceLinked`, and returns the identity unchanged. The pre-existing new-provider path (domain `linkAuthenticationReference` → embedded update + authoritative set) is preserved verbatim. No domain-model, taxonomy, `-01`, `-09`, or AUTH-02 change.

## 6. Behaviour before correction
`-01` creates an identity with its initial reference embedded-only. `-08` `linkAuthenticationReferenceForIdentity` on that same reference throws `duplicateAuthenticationReferenceError`. `-09` cannot resolve the reference (authoritative doc absent). AUTH-02 returns `unregistered` for a genuinely-registered user. (§12 limbo.)

## 7. Behaviour after correction
`-08` materialises the authoritative document for the embedded initial reference; `-09` resolves it to the owning identity; AUTH-02 `resolveAuthenticatedCredential` returns `resolved`. The `-01 → -08 → -09 → AUTH-02` round-trip holds.

## 8. Uniqueness / idempotency treatment
- **Global uniqueness preserved:** materialisation `set`s the authoritative doc only when absent; a doc owned by another identity still triggers the cross-identity conflict (fail closed). Genuine same-identity re-link of an already-authoritative reference still throws `duplicateAuthenticationReferenceError`.
- **Idempotency preserved:** the existing `checkAndReserveIdempotencyKey` gate is unchanged; a same-key retry of the establishment returns the identity without a second write (proven by an emulator test).

## 9. Transaction / concurrency treatment
The materialisation runs inside the existing `runTransaction`, reading both `users/{id}` and `authenticationReferences/{type}:{id}`. The authoritative-doc read is the serialization point: two identities racing to materialise the same referenceId serialise on that document — the first commit wins; the loser's transaction retries, now sees the doc owned by the winner, and hits the cross-identity conflict. Emulator-verified.

## 10. Tests added / updated
New emulator tests (all green): (1) establish initial reference via `-08`; (2) resolvable via `-09`; (3) same-key idempotency; (4) cross-identity establishment rejected; (5) global uniqueness on the same id; (8) AUTH-02 resolution consumes it (`-01→-08→-09→AUTH-02`); (9) no raw credential/token persisted. Existing new-provider/uniqueness scenario (6) and the re-targeted genuine-duplicate test remain green; full existing Customer-Identity suites remain green (7).

## 11. Complete validation results
`tsc --noEmit` clean; `eslint .` clean; `prettier --check .` clean; full **functions unit suite 477/477**; **web 259/259**; `pnpm build` clean. Emulator: the AUTH-CORR-001 lifecycle test **7/7**; the `-08` link/unlink suite green (incl. re-targeted duplicate test); full `pnpm emulators:validate` — **181 passed, 1 failed**, the single failure being the pre-existing ENG-P1-002-CR1 outbox concurrent-worker timing test (`outboxProcessor.emulator.test.ts`), unrelated to this change and outside the authentication/identity-linking tree. No new error category (`errorCategories` unchanged).

## 12. Commands executed
`git worktree add -b feat/auth-corr-001-… origin/main`; `pnpm install --frozen-lockfile`; wrote the lifecycle emulator test (RED, 6 fail via duplicate) → implemented the `-08` branch + re-targeted the defect test → GREEN (7/7 + `-08` suite); `pnpm typecheck`/`pnpm lint`/`prettier --write`+`format:check`/`pnpm test` (477/477)/`pnpm build`; `pnpm emulators:validate`; `git add`/secret scan/commit/push.

## 13. Dependencies added
**None.**

## 14. Configuration changes
**None.**

## 15. Programme / traceability updates
Recorded as a bounded correction discovered through AUTH-02: changes-log Entry 094; [`IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md); [`CDR-001` §5](../roadmap/CDR-001-capability-delivery-roadmap.md) note (AUTH-02 §12 reconciled; AUTH-03 unblocked); Master Workflow §17 (next = AUTH-03, unauthorised). No historical implementation report rewritten.

## 16. Risks
Low. Additive branch inside an already-transactional path; no `-01`/taxonomy/AUTH-02 change; all uniqueness/idempotency/concurrency invariants emulator-verified. The one behaviour change (initial embedded reference is now establishable) is the Founder-directed correction itself; the single existing test asserting the old behaviour was re-targeted to the genuine duplicate case.

## 17. Rollback instructions
`git revert` the AUTH-CORR-001 commit (or discard the branch pre-merge). Restores the prior `-08` behaviour and the original duplicate test. No data/migration impact (no production caller exists — AUTH-03 not implemented).

## 18. Persistent markdown implementation report
This document.

## 19. Implementation-changes tracking updated
Yes — [`IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md) appended (2026-08-08 — AUTH-CORR-001).

## Final Gate
- **Initial authentication reference can now be linked through `-08` after `-01` creation.** ✅
- **The authoritative reference is subsequently resolvable through `-09`.** ✅ (and consumable by AUTH-02)
- **Global uniqueness remains intact.** ✅
- **Genuine cross-identity conflicts remain rejected.** ✅
- **No `-01` responsibility expansion.** ✅
- **No duplicate linking implementation created** (one function, refined). ✅
- **AUTH-02 remains valid** (unchanged; consumes the materialised reference). ✅
- **AUTH-03 is now unblocked** (still requires fresh Founder authorization to begin). ✅
