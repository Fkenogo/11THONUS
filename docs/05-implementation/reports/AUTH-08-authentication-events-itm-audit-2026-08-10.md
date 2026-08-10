# AUTH-08 — Authentication Events → ITM/Audit — Implementation Report

> **Title:** AUTH-08 — Authentication events → ITM/audit (fire-and-forget `CustomerAuthenticated` / `AuthenticationRecoveryProofProvided` emission via the shared outbox)
> **Version:** 1.0 · **Status:** Implemented, test-first (TDD) — pending Founder-authorized review/merge · **Classification:** Working (engineering implementation report)
> **Governing contract:** [`AUTH-BP` §10 / §12](../roadmap/AUTH-BP-authentication-blueprint-2026-08-08.md); [`DEC-AUTH-001`](../../00-governance/decisions/decision-register.md); TRD11 §11.8–11.9/§11.15/§11.17 (events/outbox); TRD10 §10.6.1; TRD21 (privacy)
> **Source-of-truth path:** `docs/05-implementation/reports/AUTH-08-authentication-events-itm-audit-2026-08-10.md`
> **Author:** Claude (AI agent), per Founder task "TASK — AUTH-08 Implementation"

## 1. Founder authorization

This report records the **fresh Founder implementation authorization** for AUTH-08 — the **eighth** Authentication implementation package under `AUTH-BP`, authorized in-session per the AUTH-01…-07 convention (recorded in the Master Workflow §17, CDR-001 §5, the implementation-changes log, and the documentation-changes log; no new/competing authorization mechanism). The authorization covers **AUTH-08 only**; AUTH-09 is **not** authorized.

At the entry gate the Founder confirmed two dispositions (see §2, §5, §7):

- **Scope disposition** — AUTH-08 = **authentication event emission per AUTH-BP §12** (`CustomerAuthenticated`, `AuthenticationRecoveryProofProvided` through the shared outbox). AUTH-08 does **not** implement authentication-reference linking; that responsibility belongs to the already-merged Customer Identity `-08` capability and must not be duplicated.
- **Wiring disposition** — use the composition/integration boundary (`index.ts`), not the completed AUTH-03/06/07 service internals; a durable awaited outbox write (never an un-awaited/void best-effort fire); deterministic, retry-stable event identity keyed on the request idempotency identity; durable at-least-once + idempotent consumption (not a claim of exactly-once); privacy-minimised payloads; and an additive `-10` audit allow-list extension for the two governed event types.

## 2. The "-08" numbering distinction (Founder-directed, preserved explicitly)

The programme contains **two independent packages that both carry the number 8**, and the entry handover conflated them. This report preserves the distinction as a first-class artefact:

| | **AUTH programme AUTH-08** (this package) | **Customer Identity `-08`** (already merged) |
|---|---|---|
| Full name | AUTH-08 — Authentication events → ITM/audit | `ENG-P2-001-08` — identity/authentication-reference linking |
| Authoritative source | `AUTH-BP` §12 | `ENG-P2-ARCH-001` / merged Customer Identity concern |
| Responsibility | **Emit** the two fire-and-forget authentication trust/audit signals via the shared outbox | **Own** authentication-reference linking / global-uniqueness / last-reference invariants |
| Events | `CustomerAuthenticated`, `AuthenticationRecoveryProofProvided` | `AuthenticationReferenceLinked` / `Unlinked` / `ConflictDetected` |
| Status | Implemented here | Merged on `main`; **not touched** by this package |

Throughout `AUTH-BP` prose, "`-08`" (e.g. §5, §7) means the **merged Customer Identity `-08`** that AUTH-03/AUTH-05 *consume*; only the §12 package-decomposition row named **AUTH-08** is this package. AUTH-08 re-implements none of the linking capability and re-emits none of its events.

## 3. Entry repository state & prerequisite verification

- `origin/main` = `28f762583dbb098e24c229b51ae730a42c1d7e89`; post-merge CI green (workflow "CI", push run 31385400543, `success`).
- **AUTH-07 = merged/closed:** PR #96 merged 2026-08-10T11:52:07Z, merge commit `28f7625` = current `origin/main` tip.
- **Programme-currency sync (Phase A2):** at entry, Master Workflow §17 and CDR-001 §5 still described AUTH-07 as *"pending review/merge; AUTH-08 not started."* Reconciled to **merged** with dated superseding notes (history preserved), and AUTH-08 recorded as the fresh authorized package — per existing convention, no new control document.
- Clean linked worktree created off `28f7625` (`feat/auth-08-authentication-reference-linking`); zero divergence; no in-progress git operation. The dirty primary worktree (`chore/eng-p1-001-closure`) was untouched; no unrelated worktree cleanup was performed.

## 4. Authoritative requirement (AUTH-BP §10 / §12) & deferred-responsibility matrix

**AUTH-08 (§12):** *"Authentication events → ITM/audit — emit fire-and-forget trust/audit signals via outbox."* Location: `functions/src/domains/authentication/services`.

Responsibilities deliberately deferred to AUTH-08 by the completed packages (reconstructed from AUTH-01…-07 reports, `authenticationEvents.ts`, and the service sources):

| Responsibility | Governing source | Deferred by | AUTH-08 action | Non-duplication constraint |
|---|---|---|---|---|
| **`CustomerAuthenticated`** (sign-in + registration trust signal) | AUTH-BP §5.4/§6.3/§10/§12; AUTH-01 `authenticationEvents.ts` | AUTH-03 (explicit "no emit seam"; emulator test asserts absence); reaffirmed AUTH-04/05/07 | Emit fire-and-forget via the shared outbox on a successful `authenticate` | Must **not** re-emit `CustomerIdentityRegistered` (`-01`) or `AuthenticationReferenceLinked` (Customer Identity `-08`) |
| **`AuthenticationRecoveryProofProvided`** | AUTH-BP §8/§10/§12; AUTH-01 `authenticationEvents.ts` | AUTH-06 | Emit fire-and-forget via the shared outbox on a successful recovery proof | Must **not** re-emit `IdentityRecovered` (`-06`/`-07`) |

Both event **contracts already existed** (AUTH-01 `authenticationEvents.ts`); AUTH-08 adds emission only. No new event types, no new error category. The `→ ITM` obligation is discharged by placing the fire-and-forget signal in the shared outbox (no live ITM consumer is wired anywhere yet; wiring one would be premature/out of scope). The `→ Audit` obligation flows through the merged `-10` `identityAudit` query projection over `outboxEntries`.

**Investigated and excluded:** authentication-reference linking/global-ownership (merged Customer Identity `-08`); any state-change event already owned by `-01`/`-08`/`-06`/`-07`; a live ITM consumer/dispatcher; any AUTH-09 concern (validation/closure).

## 5. Acceptance criteria (met verbatim)

1. `CustomerAuthenticated` emitted on successful registration **and** returning sign-in; nothing emitted on failed authentication.
2. `AuthenticationRecoveryProofProvided` emitted on successful recovery proof.
3. The same logical operation retried under the same idempotency key does **not** create a second/distinct event and does not disturb an already-processed outbox entry.
4. Existing `-01`/`-08`/`-06`/`-07` state-change events are **not** re-emitted.
5. Emission is a durable, awaited outbox write (no un-awaited/void best-effort path); enqueue failure propagates as retryable while the domain result replays idempotently.
6. No credential/token/OTP/proof material enters any outbox or audit payload; payloads carry only the AUTH-01 contract fields.
7. Completed AUTH-03/06/07 service internals and the merged Customer Identity `-08` are unchanged.

## 6. Customer-facing language / localization assessment (Phase D)

AUTH-08 is **backend-only event emission** — it introduces **no** customer-visible copy (event type names, payloads, and audit records are internal/developer-facing). Per the task's Phase D, no localization infrastructure is warranted. The standing English-primary / French-optional customer-facing requirement already has an authoritative home in **TRD13 — Communications and Localization**; no product/technical source-of-truth change was made (none was needed, and none would be in scope here).

## 7. Implementation

### 7.1 Pre-change event/outbox/audit analysis
- **Outbox** (`shared/outbox`): `writeOutboxEntry(txn, db, event)` writes one entry per event at `outboxEntries/{event.eventId}` inside a **caller-owned transaction** — transactional-outbox semantics, no best-effort void path. The processor (`outboxProcessor.ts`) is a generic reliability engine; the audit read-model is a **query-time projection** over `outboxEntries`.
- **Audit** (`-10` `identityAudit`): `toIdentityAuditRecord` + `projectAuditPayload` (per-event-type **allow-list**, fails closed to `{ payloadOmitted: true }`) + `classifyIdentityEventPrivacy` (defaults to `class_2_internal_operational`).
- **Composition root** (`index.ts`): the `authenticate` (AUTH-03) and `recoverAuthenticatedIdentity` (AUTH-06) callables orchestrate then return; they are where each prior package integrated.

### 7.2 Design decisions
- **(a) Emission at the composition boundary.** A new AUTH-08 emitter is invoked by the `index.ts` callables *after* the completed handlers return success, so AUTH-03/06/07 keep their "no emit seam" boundary (their tests still assert `customer_authenticated` is absent from *their* transactions).
- **(b) Durable, awaited write; failure propagates.** Emission runs in its own awaited Firestore transaction. Per the existing transactional-outbox contract, a write failure propagates to the caller as retryable; AUTH-03/06 are idempotent on the client key, so a retry replays the same outcome and re-attempts the *same* (deterministic) event.
- **(c) Deterministic, retry-stable identity.** `eventId = f(eventName, customerIdentityId, idempotencyKey)` (SHA-256, Firestore-safe). Same logical retry → same identity; distinct legitimate operations → distinct identities; `occurredAt` is not part of the identity.
- **(d) Idempotent enqueue.** The emit transaction reads the target entry first and no-ops if present — so a duplicate/retried emit neither creates a second entry nor resets an entry the processor already advanced. Durable **at-least-once** delivery + dedup-by-`eventId` consumption (explicitly **not** exactly-once).
- **(e) Additive `-10` allow-list extension.** The two governed event names project only categorical fields (`referenceType`; recovery adds `proofMethodCategory`); unknown types still fail closed; classification is the conservative `class_2` (verified by test). No existing projection/classification behavior changed.

### 7.3 Files
**Created**
- `functions/src/domains/authentication/events/authenticationEventFactories.ts` (+ `.test.ts`) — pure builders + deterministic id derivation (no Firebase).
- `functions/src/domains/authentication/services/authenticationEventEmitter.ts` (+ `.emulator.test.ts`) — durable idempotent outbox emission.

**Modified (additive)**
- `functions/src/shared/outbox/outboxWriter.ts` — additive `outboxEntryRef(db, eventId)` export (single source of truth for the entry ref); `writeOutboxEntry` refactored to use it (behavior-identical; its test still passes).
- `functions/src/index.ts` — the `authenticate` / `recoverAuthenticatedIdentity` callables emit the trust signal after a successful orchestration.
- `functions/src/domains/identityAudit/models/auditPayloadProjection.ts` (+ `.test.ts`) — two additive allow-list cases.
- `functions/src/domains/identityAudit/models/auditPrivacyClassification.test.ts` — asserts the two event types are `class_2` (no production change needed — the default already returns `class_2`).

**Not changed:** AUTH-03/06/07 service internals; merged Customer Identity `-08` (linking repositories/events); shared idempotency; `firestore.rules`; `apps/web`.

## 8. Tests, RED→GREEN evidence, validation

- **RED→GREEN:** factory unit tests written first and observed RED (module absent) → GREEN after implementation; emitter emulator tests GREEN against the real outbox + real AUTH-03/06 paths; audit-projection/classification tests added and GREEN.
- **Founder-required proofs (all covered):** registration emits `CustomerAuthenticated` with `-01`/`-08` events present-but-not-duplicated; returning sign-in emits it (no registration/link re-emitted); failed authentication emits nothing (emission only runs after a successful orchestration at the callable); same-key retry → single stable event, already-completed entry not reset; recovery proof emits `AuthenticationRecoveryProofProvided` with `IdentityRecovered` present-but-not-duplicated; recovery retry preserves identity; no `rawToken`/secret material in payloads (payload key-set asserted).
- **Full validation (clean worktree, `28f7625`):** functions unit **563/563**; web **304/304** (unchanged — no web change); `emulators:validate` **221/221** (+5 AUTH-08 emulator tests, no inherited flake recurred); typecheck clean; lint clean; prettier clean; monorepo build clean; Playwright e2e 1/1. CI (build/lint/format/typecheck/test/e2e/emulator) is the authoritative gate.
- **Commands:** `pnpm --filter functions test`, `pnpm --filter web test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm emulators:validate`, `pnpm test:e2e`.

## 9. Security / privacy / boundaries

- No `rawToken`/OTP/recovery-proof/secret material persisted, logged, or placed in any outbox or audit payload; payloads carry only `customerIdentityId` + categorical `referenceType` (+ `proofMethodCategory` for recovery), the exact AUTH-01 contract fields. Audit projection remains fail-closed for unknown types; classification `class_2`.
- Admin-SDK path only — no client Firestore write path opened; `firestore.rules` unchanged (deny-by-default preserved). Closed 14-category error taxonomy unchanged (no new category). Event-ownership boundaries intact; no state-change event re-emitted. Tuple-qualified references, same-principal linking, and AUTH-03/04/05/06/07 semantics preserved.

## 10. Risks / observations, rollback

- **Observation:** no live ITM consumer exists yet; AUTH-08 discharges `→ ITM` by durable outbox emission, leaving consumption to a future governed integration (out of scope here) — consistent with the merged `-10` note that the ITM `trust_reference_updated` write path is also not yet wired.
- **Verified inherited state:** no inherited flake recurred across three full emulator runs; no unrelated failures introduced.
- **Rollback:** `git revert` of this package's commit, or discard the branch — not merged. Removes the two new AUTH-08 modules, the additive `outboxEntryRef` export, the two audit allow-list cases, and the `index.ts` emission calls; restores prior behavior with no data/migration impact (emitted events are additive audit evidence).

## 11. Programme impact

`AUTH-08` implemented (pending merge); **next governed action = `AUTH-09`** (Validation & closure review), which requires its own fresh Founder authorization. Capability 2 remains `Open — partially implemented; not closed`; Customer Identity `Complete`; ITM/`ENG-P2-004` unchanged.

## 12. Final gate

**AUTH-08 READY FOR FOUNDER REVIEW/MERGE.** Acceptance criteria met verbatim; TDD RED→GREEN; full validation green; boundaries preserved; not self-merged; AUTH-09 not started; dirty primary worktree untouched; no unrelated worktree cleanup.

## 13. Independent review disposition (PR #97)

An independent reviewer re-reviewed the exact PR head (`8378c72`) since no automated Codex review ran (reviewer usage limit). One finding was raised and corrected in place (history preserved):

- **F-R1 (P2 — code integrity / reviewability):** `authenticationEventFactories.ts` contained a **raw NUL byte** as the value of `FIELD_SEPARATOR` (the hash-preimage delimiter). Functionally harmless — the delimiter is still a stable, deterministic, non-occurring separator and the derived id is hex (no Firestore-path risk), so all tests passed — but the raw NUL made **git store the file as binary**, so the file had no reviewable textual diff/blame, and it is fragile for text tooling. **Fix:** the delimiter is now written as the explicit escape `\u0000` (byte-identical runtime value → every derived id unchanged; the file is now UTF-8 text), with a clarifying comment; a **golden-value regression test** was added pinning the exact canonical preimage (`eventName + \u0000 + customerIdentityId + \u0000 + idempotencyKey`) so the event-identity contract cannot silently change across deploys. functions unit **564/564** (+1); emulators **221/221**; web **304/304**; typecheck/lint/format/build/e2e clean. No other changed file contained a raw NUL. No behavioral change; no scope/boundary change.
