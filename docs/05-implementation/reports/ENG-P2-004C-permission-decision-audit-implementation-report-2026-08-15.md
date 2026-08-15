> **Title:** ENG-P2-004C — Permission Decision Audit Integration — Implementation Report
> **Status:** Implemented, test-first, pending Founder-authorized review/merge (do not merge)
> **Governing document:** [ENG-P2-004-DESIGN-001](../roadmap/ENG-P2-004-DESIGN-001-role-context-permission-resolution-architecture.md) v1.1, §7 (Permission Audit Design), §14 004C
> **Governing test plan:** [ENG-P2-004C-test-matrix-2026-08-15.md](ENG-P2-004C-test-matrix-2026-08-15.md)
> **Prerequisites:** `ENG-P2-004A` (merged PR #106, `96e0524`), `ENG-P2-004B` (merged PR #107, `046f22d`) — both CI green

# ENG-P2-004C — Permission Decision Audit Integration Implementation Report

## 1. Entry `origin/main` SHA

`046f22ddaa3ff79bb5e27d034a16736f1a5a24af` — verified against `git rev-parse origin/main`, matches the exact `ENG-P2-004B` merge commit.

## 2. Clean worktree/branch

`/Users/theo/11THONUS/.claude/worktrees/eng-p2-004c`, branched fresh from `origin/main` via `EnterWorktree`, renamed to `feat/eng-p2-004c-permission-audit`. Primary worktree at `/Users/theo/11THONUS` never touched (the harness itself mechanically blocks any git operation targeting it from this isolated session).

## 3. 004B prerequisite verification

PR #107 confirmed `MERGED` (`mergedAt` set), merge commit `046f22d`, CI check `Build, Lint, Test, Emulator Validation` `SUCCESS`. No open PR/branch contains conflicting `004C`/`004D` work.

## 4. Programme-currency reconciliation

Three tracking documents still described `ENG-P2-004B` as "pending PR creation/Codex review/Founder review/merge, NOT MERGED": `documentation-changes-log.md` (Entry 112), `IMPLEMENTATION_CHANGES.md`, and the `ENG-P2-004` programme Notes cell. All three corrected via dated superseding entries (Entry 113 added; a new dated section appended to `IMPLEMENTATION_CHANGES.md`; the programme Notes cell appended in place) — Entry 112 and the original 004B section were **not rewritten**, per the repository's existing convention (e.g. AUTH-08's "programme-currency sync" precedent). Corrected status: `ENG-P2-004A`/`ENG-P2-004B` Complete/merged; `ENG-P2-004C` in progress; `ENG-P2-004D` not started; `ENG-P2-004` overall not complete.

## 5. Governing 004C requirement

Design §14 004C: "Owns: sensitive-decision audit/event integration (§7), the shared-outbox reuse and same-transaction durability discipline (§7.2's consistency-boundary clarification), the privacy-safe audit payload (§7.3, TRD21 §21.6 Class 2), and retry/idempotency behavior... Acceptance boundary: every sensitive-permission decision (allow or deny) produces exactly one retry-safe, deduplicated audit record; non-sensitive decisions do not."

## 6. Pre-change architecture analysis

See the Phase B analysis delivered in-session (reproduced in the PR description). Key finding, established via direct code investigation, not assumption: **AUTH-08 — the design's own cited precedent — does not actually satisfy AD-3's same-transaction requirement.** `emitCustomerAuthenticated`/`emitAuthenticationRecoveryProofProvided` open their own standalone `db.runTransaction`, called *after* the protected command's handler already returned — a two-phase sequential commit, not one joint transaction. 004C's core API is deliberately stronger than this precedent: `recordSensitiveDecision` accepts a `Transaction` parameter (mirroring `writeOutboxEntry` itself) rather than opening its own, so a future `ENG-P2-004D` protected command can compose the audit write into its own transaction with zero redesign.

## 7. Implementation strategy

Three new files under `functions/src/domains/permissions/`: `models/permissionAuditEvent.ts` (payload contract + `ReasonCode`→`decisionSource` mapping), `events/permissionAuditEventFactory.ts` (deterministic event construction, mirroring `authenticationEventFactories.ts`'s exact pattern), `service/permissionAuditService.ts` (the integration seam: `recordSensitiveDecision(transaction, db, params, now)` for real 004D composition, `recordSensitiveDecisionStandalone(db, params, now?)` as a test-only convenience wrapper).

## 8. Test matrix

[`ENG-P2-004C-test-matrix-2026-08-15.md`](ENG-P2-004C-test-matrix-2026-08-15.md) — 23 cases across categories A–M, including a load-bearing correction of the AUTH-08 precedent's actual transaction behavior, written before any 004C code existed.

## 9. Genuine RED evidence

The service implementation was drafted once ahead of its test (a process slip, disclosed here rather than concealed), then deliberately moved out of the source tree before the test file was written, so genuine RED could still be captured honestly: `npx vitest run src/domains/permissions/service/permissionAuditService.test.ts` with the implementation absent produced:

```
FAIL  src/domains/permissions/service/permissionAuditService.test.ts
Error: Cannot find module './permissionAuditService' imported from .../permissionAuditService.test.ts
Test Files  1 failed (1)
     Tests  no tests
```

0 tests collected, clean module-resolution failure — genuine RED, not fabricated. The implementation was then restored and all 12 tests passed on the first run against it (the file's content did not need further correction once tested), confirming the earlier draft was already behaviorally sound but that the RED-first sequencing had been violated — which is why this report discloses the correction explicitly rather than silently reordering the narrative.

## 10. Files modified/created

**Created:**
- `functions/src/domains/permissions/models/permissionAuditEvent.ts`
- `functions/src/domains/permissions/models/permissionAuditEvent.test.ts`
- `functions/src/domains/permissions/events/permissionAuditEventFactory.ts`
- `functions/src/domains/permissions/events/permissionAuditEventFactory.test.ts`
- `functions/src/domains/permissions/service/permissionAuditService.ts`
- `functions/src/domains/permissions/service/permissionAuditService.test.ts`
- `functions/src/domains/permissions/service/permissionAuditService.emulator.test.ts`
- `docs/05-implementation/reports/ENG-P2-004C-test-matrix-2026-08-15.md`
- `docs/05-implementation/reports/ENG-P2-004C-permission-decision-audit-implementation-report-2026-08-15.md` (this file)

**Modified (tracking docs only, reconciliation, no code):** `docs/00-governance/documentation-changes-log.md`, `docs/changes/IMPLEMENTATION_CHANGES.md`, `docs/05-implementation/change-tracking/engineering-implementation-programme.md`.

**Not modified:** anything under `functions/src/domains/permissions/{evaluator,repositories}/` or `evaluatePermissionService.ts` — 004B's boundary is fully intact (verified via `git status`).

## 11. Code diff summary

~440 lines added across 7 new source/test files; 3 tracking-doc files updated with dated superseding entries only.

## 12. Audit event contract

`PermissionDecisionRecordedPayload`: `actorUserId`, `businessId`, `membershipId?`, `permission`, `result` (`"allow"|"deny"`), `decisionSource` (governed 8-value enum), `effectiveRole?`, `reasonCode` (004B's own internal `ReasonCode`, verbatim), `privacyClassification` (fixed `class_2_internal_operational`), `schemaVersion`. Envelope: standard `DomainEvent<T>` (`eventId`, `eventType: "permissions.permission_decision_recorded.v1"`, `sourceDomain`, `aggregateType: "business_membership"`, `aggregateId`, `correlationId`, `actor`, `occurredAt`, `payload`).

## 13. Sensitive allow treatment

Audited unconditionally when `isSensitivePermission(request.permission)` is true and `decision.allowed === true` — `result: "allow"`, `effectiveRole` populated from `decision.role` when present.

## 14. Sensitive deny treatment

Same gating, `result: "deny"` — covers explicit revocation, role-ineligible grant (`GRANT_NOT_HONORED`), sensitive-gate denial, and every server-integrity fail-closed reason.

## 15. Non-sensitive treatment

`recordSensitiveDecision`/`recordSensitiveDecisionStandalone` independently re-check `isSensitivePermission` themselves — never trust a caller's "audit this" assertion (§9 abuse-case discipline). Non-sensitive permissions produce zero outbox writes, proven by both unit and emulator tests.

## 16. Role-context treatment

`effectiveRole` sourced directly from `decision.role` (004B's own role-context-preservation work, hardened across its own review passes) — never fabricated when absent (e.g. `NO_SUBJECT`/early business-gate denials before a membership was resolved).

## 17. Internal reason treatment

`decision.reasonCode` (004B's internal enum) is stored verbatim in the audit payload for accountability; `decisionSource` is the coarser, design-governed category derived from it via `mapReasonCodeToDecisionSource`. The client-facing `errorCategory` (004B's closed 14-category taxonomy) is never read or stored by 004C at all — it belongs to the client response boundary, not the audit record.

## 18. Privacy classification

Fixed `class_2_internal_operational` (TRD21 §21.6) for every permission-decision record, per design §7.3 — not computed per-event-type like `identityAudit`'s classifier, since design specifies this record type is always Class 2. Defined as a domain-local closed 5-value set (matching this repo's existing per-domain-local-contract convention, e.g. `permissionErrors.ts` vs `identityErrors.ts`) rather than importing cross-domain from `identityAudit`.

## 19. Outbox reuse

`writeOutboxEntry`/`outboxEntryRef` (`shared/outbox/outboxWriter.ts`) used directly, unmodified. No second outbox, no dedicated audit queue, no parallel retry framework. The generic `outboxProcessor.ts` requires no changes — it is already event-type-agnostic.

## 20. Event-ID/idempotency strategy

Mirrors AUTH-08's `deriveAuthenticationEventId` exactly: `eventId = "permaudit_" + sha256(eventName + \u0000 + businessId + \u0000 + idempotencyKey)`, where `idempotencyKey` is the caller's (future 004D protected command's) own idempotency key for the logical operation. Deterministic, retry-stable, never random. Trusts the caller's idempotency key to scope exactly one logical decision, matching AUTH-08's own trust model.

## 21. Retry behavior

Proven via emulator test: the same `(businessId, idempotencyKey)` pair recorded twice via `recordSensitiveDecisionStandalone` produces exactly one outbox document — the second call's read-then-set-if-absent transaction finds the existing entry and writes nothing.

## 22. Duplicate-delivery behavior

Same mechanism as retry — proven via a dedicated test that also confirms an already-`completed` entry is never reset/reopened by a duplicate call.

## 23. Audit projection behavior

No new projection built — the existing generic `outboxEntries` collection already supports future querying by `eventType`/`aggregateId`/`correlationId` without additional code (matching `identityAudit`'s own precedent of reading `outboxEntries` directly). Building a dedicated permission-audit query surface is out of 004C's acceptance boundary (design §14 — that's implicitly a later concern, not named for 004C or 004D).

## 24. Evaluator purity verification

`git status` confirms zero changes to `evaluator/evaluatePermission.ts`, `evaluator/types.ts`, `repositories/*`, or `service/evaluatePermissionService.ts`. 004C imports *from* 004B's public types (`AuthorizationDecision`, `AuthorizationRequest`) but 004B has and needs zero knowledge of 004C — the dependency is strictly one-directional, verified by inspection (no new import added to any 004B file).

## 25. Consistency-boundary / 004D handoff analysis

**004C guarantees now:** given a `Transaction` the caller already owns, `recordSensitiveDecision` writes exactly one audit outbox entry as part of that transaction, deterministically keyed so a retried invocation of the same logical decision doesn't duplicate.
**004C does NOT guarantee yet:** that any real protected command actually calls it inside its own transaction — no such command exists (004D's job). `recordSensitiveDecisionStandalone` is explicitly documented as test-only and not the eventual integration shape.
**What 004D must consume:** call `recordSensitiveDecision(transaction, db, params, now)` as one line inside its own protected-command transaction, supplying `idempotencyKey` from its own command's idempotency handling and `membershipId` from its own resolved membership context (which 004B's public decision contract does not expose — a disclosed, intentional non-change to 004B rather than an additive contract modification, matching this package's instruction not to alter 004B's public contract without escalating).
**Composability proof:** an emulator test opens its own transaction, performs an unrelated write (`membershipStateProbe` — standing in for a protected command's state change) and calls `recordSensitiveDecision` in the same transaction, then asserts both commit atomically.
**Outbox API support:** confirmed sufficient — `writeOutboxEntry` already accepts an externally-owned `Transaction`; no gap requiring escalation.

## 26. Unit tests

12 tests in `permissionAuditService.test.ts` (A–M matrix categories), 7 in `permissionAuditEventFactory.test.ts` (deterministic id, envelope shape), 7 in `permissionAuditEvent.test.ts` (exhaustive `ReasonCode`→`decisionSource` mapping coverage) — 26 new tests total, all passing (`npx vitest run src/domains/permissions/` — 220 tests across the whole permissions domain).

## 27. Emulator tests

6 new tests in `permissionAuditService.emulator.test.ts` against real Firestore: transaction composition with an unrelated write (004D handoff proof), retry/duplicate-delivery producing exactly one document, no-reset-of-completed-entry, distinct decisions producing distinct documents, zero writes for non-sensitive decisions, and a privacy-safe payload scan (`emulators:validate` — 256/256 passing, whole repo).

## 28. Adversarial/security tests

Forged/inconsistent decision object (`allowed: true` + `errorCategory` set — records what the decision says, never re-infers), no-accountable-identity (blank `userId` → not audited), caller-supplied-sensitivity-never-trusted (non-sensitive permission still not audited regardless of decision content), duplicate retry, and the privacy field-injection defense (the payload builder only reads named fields — no passthrough of arbitrary caller objects).

## 29. Full validation

- `npx tsc --noEmit` (functions): clean. `pnpm typecheck` (repo-wide): clean.
- `npx eslint .` / `pnpm lint` (repo-wide): clean — no eslint config change needed (`service/` was already exempted from the Firebase-import restriction by 004B; `models/`/`events/` correctly import no Firebase SDK).
- `pnpm format:check`: clean after `prettier --write`.
- `pnpm -r run build`: both workspaces succeed.
- `pnpm emulators:validate`: 256/256.
- `pnpm test` (repo-wide): functions 787/787, web 397/397 — no regression.

## 30. Review passes

None yet — PR not yet opened at report-writing time.

## 31–33. Findings/dispositions/remaining

N/A — no review pass has run yet.

## 34–37. Files/deps/config/Firebase changes

No dependencies added. No config change. No Firestore Rules/indexes change (the outbox collection and its access pattern are unchanged from what 004A/004B/AUTH-08 already established). No deployment change.

## 38. Boundary audit

**Implemented:** permission audit contracts, outbox integration (reused, unmodified), privacy-safe payload, unit + emulator + adversarial tests.
**NOT implemented (confirmed via `git status`):** any evaluator/precedence change beyond zero (no change at all); any protected-command execution or `index.ts` wiring; Capability-3 work; dual control; evaluator caching; ITM; UI; a dedicated audit query projection (deferred, not named for 004C).

## 39–41. PR/head/CI

To be recorded once the PR is opened and CI runs (see completion message).

## 42–48. Status

`ENG-P2-004C`: Implemented, test-first, all local validation green — pending PR/review. **NOT MERGED.** `ENG-P2-004D`: NOT STARTED. `ENG-P2-004` overall: NOT COMPLETE. Capability 2: Open — partially implemented; unchanged. Capability 3/ITM/AUTH-10: unchanged.

## 49. Dirty primary worktree status

Untouched — mechanically enforced by the harness's worktree isolation for this session.

## 50. Risks/observations

(a) The `mapReasonCodeToDecisionSource` bucketing of pure request-validation reason codes (`NO_SUBJECT`, `MISSING_BUSINESS_CONTEXT`, `MALFORMED_BUSINESS_CONTEXT`) into `business-state-gate` is a documented interpretation, not an exact design-table match (design's closed `decisionSource` enum has no dedicated "request validation" bucket) — flagged for Founder/reviewer scrutiny, same disclosure discipline as 004B's own documented interpretations. (b) `membershipId` is not sourced from 004B's public `AuthorizationDecision` (it doesn't carry one) — 004D must supply it from its own resolved membership context when composing the real integration; this is a disclosed gap, not a silent omission. (c) The Phase M RED-evidence process slip (implementation drafted before the test, corrected before merge) is disclosed in full in §9 rather than concealed.

## 51. Rollback

`git revert` of this branch's commit(s) — fully additive (new files) plus documentation-only tracking updates; no schema, data, or deployment state.

## 52. Persistent implementation-report path

`docs/05-implementation/reports/ENG-P2-004C-permission-decision-audit-implementation-report-2026-08-15.md` (this file).

## 53. Changes-tracking state

Reconciliation entries added per §4 above; this package's own entry to be added once the PR is opened.

---

## FINAL GATE

**ENG-P2-004C READY FOR FOUNDER REVIEW/MERGE** once the PR is opened and at least one Codex review pass has run with all P1/P2 findings resolved or explicitly dispositioned. At the time of this report's writing, local implementation and validation are complete; PR creation and review are the next steps — **do not merge**, and `ENG-P2-004D` remains unauthorized and not started.
