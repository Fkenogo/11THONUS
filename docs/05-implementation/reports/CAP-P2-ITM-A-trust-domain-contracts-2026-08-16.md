> **Title:** CAP-P2-ITM-A — Trust Domain Contracts & Trust Record Model — Implementation Report
> **Status:** Implemented, pending Founder-authorized review/merge (do not merge)
> **Governing document:** [ITM-DESIGN-001](../roadmap/ITM-DESIGN-001-identity-trust-management-architecture.md) v1.2, §5–§7, §15 `ITM-A`, §22 (`AD-ITM-1`–`AD-ITM-4`)
> **Prerequisites:** `CAP-P2-ITM-DESIGN-001` (merged PR #110, `b14239d`) — CI green

# CAP-P2-ITM-A — Trust Domain Contracts & Trust Record Model — Implementation Report

## 1. Entry `origin/main` SHA

`b14239d15afac1081ca1ca84e0f02b302a46399d` — verified via `git rev-parse origin/main`; confirmed to be "Merge pull request #110 from Fkenogo/docs/cap-p2-itm-design-001," matching the task's expected baseline exactly.

## 2. Clean worktree/branch

`/Users/theo/11THONUS/.claude/worktrees/itm-a`, branch `feat/cap-p2-itm-a-trust-domain-contracts`, branched fresh from `origin/main` at `b14239d`. The primary worktree at `/Users/theo/11THONUS` (branch `chore/eng-p1-001-closure`, pre-existing unrelated dirty state) was never reset, cleaned, stashed, rebased, or written to — confirmed via `git status --short` before and after this task, unchanged.

## 3. ITM design prerequisite verification

- `git merge-base --is-ancestor b14239d origin/main` confirmed true (trivially — it *is* `origin/main`).
- `gh run list --branch main` confirmed the merge-commit CI run (`31944523950`) result `success`.
- `docs/05-implementation/roadmap/ITM-DESIGN-001-identity-trust-management-architecture.md` confirmed present on `origin/main`, v1.2, "all four Founder decisions (FDR-1–FDR-4) fully resolved," full document read end-to-end (§1–§23).
- `git branch -a` / `git ls-remote --heads origin` / `gh pr list --search itm` confirmed no other `ITM-A`/`-B`/`-C`/`-D` branch or PR exists anywhere (only the already-merged `docs/cap-p2-itm-design-001`, PR #110).
- `gh pr list --state open` confirmed only PR #34 (unrelated, `ENG-P2-RES-ADMIN-003`) open.
- Capability 3 and G2: no `docs/` references found beyond the design package's own "not started" statements; `CDR-001` §5/§2 confirm both `Not started`.
- Dirty primary worktree confirmed untouched (see §2).

No material state differed from the task's stated expectations — Phase A proceeded without a stop condition.

## 4. Codebase analysis

Reviewed before writing any code:

- **`functions/src/domains/identity/models/trustReference.ts`** — the existing Customer-Identity-side opaque pointer (`{trustRecordId, createdAt, createdBy}`), confirming `ITM-A`'s `TrustRecordId` is the value this reference already points at, and that Customer Identity never reads trust content.
- **`identityErrors.ts` / `permissionErrors.ts`** — the domain-local `*DomainError` class convention: structurally `DomainCommandError`-compatible (`category`/`message`/`fieldErrors`) but defined independently so the domain layer never imports `commandDispatcher.ts`; every error category drawn from the closed 14-category `ErrorCategory` taxonomy (`shared/errors/errorCategories.ts`).
- **`customerIdentityId.ts`** — the minimal string-value-object-with-validation pattern (validate shape only, never generate).
- **`role.ts`** — the closed-enum-with-`as const`-array pattern (`ROLES`, `createRole`, `isRole`) — the direct template for `TrustLevel`/`TrustRecordStatus`/`TrustEvidenceCategory`.
- **`permissionOverride.ts`** — the pure-value-object-factory pattern: one `createX` function, full construction-time validation, **no mutation/transition function** — the direct template for `TrustRecord` itself, since `ITM-DESIGN-001` §15 scopes `ITM-A` to contracts only (no progression/derivation).
- **`permissionAuditEvent.ts`** — confirms this repository's convention of defining a domain-local copy of a closed enum (e.g. its own `privacyClassification` copy) rather than importing another domain's enum — informs why `TrustEvidenceCategory` is defined locally rather than importing anything from `authentication`'s event contracts.
- **`identityAudit/models/auditEnvelope.ts`** — confirms the established convention that a cross-domain identity reference is carried as a **plain `string`** (`customerIdentityId: string`), never the owning domain's own value-object type — directly informs `TrustRecord.customerIdentityId: string` (no import of `identity`'s `CustomerIdentityId` module).
- **`shared/metadata/baseMetadata.ts`** — the Firestore-specific persistence-metadata shape (`Timestamp`/`FieldValue`), confirming it is a *persistence-layer* concern (future `ITM-B`), not something `ITM-A`'s pure-`Date`-based domain model should import.
- **`eslint.config.js`** — the five existing per-domain Firebase-import-ban blocks (Identity, Loyalty Number, QR Identity, Authentication, Permissions), each excluding only its own `repositories/`/`service/` subfolder — the exact template for the new `trust` block.
- **`functions/package.json` / root `package.json`** — confirmed `vitest run` (unit), `tsc --noEmit` (typecheck), `eslint .` (lint, flat config), `prettier --check` (format), `tsc` (build) as the governed validation commands; pnpm workspace across `apps/web`/`functions`.

## 5. Implementation strategy (stated before implementation)

`ITM-A` is a pure value-object/contract layer with **no mutation, no persistence, no event consumer, no derivation logic** — the closest existing precedent is `permissionOverride.ts`'s style (one validated factory per type, immutable output), not `customerIdentity.ts`'s full aggregate-with-behavior style, because the design (`ITM-DESIGN-001` §15) explicitly reserves progression/derivation for `ITM-C` and ingestion/persistence for `ITM-B`. No new architectural style was invented. Field-for-field, `TrustRecord` reconstructs exactly `ITM-DESIGN-001` §5's table (`trustRecordId`, `customerIdentityId`, `verificationState`, `signalState`, `trustLevel`, `version`, `status`, `reasonReferences`, `createdAt`/`createdBy`/`updatedAt`/`updatedBy`) — no field beyond that table was added to the aggregate itself. A standalone `TrustRuleVersion` module satisfies Phase J's separate instruction (a minimal rule-versioning contract) without embedding a field the design's own §5 table does not list.

## 6. ITM-A scope reconstruction

Implemented: `TrustLevel` (closed enum + ordering), `TrustRecordId`, `VerificationState`, `SignalState`, `TrustRecordStatus`, `TrustEvidenceCategory`, `TrustReasonReference`, `TrustRuleVersion`, `TrustRecord` (aggregate factory), `TrustDomainError` + per-invariant factories. Not implemented (by design): Firestore repository, event consumer, `AUTH-08` subscription, trust-level computation, account-age calculation, current-time evaluation, progression engine, risk-gate decision, command integration, UI, operator visibility.

## 7. TrustLevel contract

`trustLevel.ts`: `TRUST_LEVELS = ["unverified", "provisional", "established"] as const` — the Founder-countersigned §6.6 set, in order. `createTrustLevel`/`isTrustLevel` enforce closed membership (case-sensitive, rejects any numeric-looking or unrecognised string). `trustLevelRank`/`compareTrustLevels`/`isAtLeastTrustLevel` provide the ordering semantics the design requires (§6.6's "highest satisfied condition wins" needs an orderable type) **without** implementing any threshold/derivation logic — these are pure comparisons over the closed set, not a band-membership function.

## 8. Trust-record contract

`trustRecord.ts`: `createTrustRecord(params) → TrustRecord`, the sole export. Matches `ITM-DESIGN-001` §5's field table exactly (verified by an explicit closed-shape test: `Object.keys(record).sort()` equals the 12-field list). Excluded fields verified absent by test: no numeric score (`trustScore`/`score`/`riskScore`), no PII/credential (`email`/`phoneNumber`/`password`/`token`/`otp`), no operator-visibility field (`operatorNote`/`visibleToOperator`), no `disputeStatus`.

## 9. Derived-state treatment

`TrustRecord.trustLevel`'s field-level JSDoc states explicitly: "a read-optimization cache, never authoritative when persisted... a future ITM-C read path must recompute `trustLevel` rather than trust this field as-is between reads" (§6.6.1, §22 "Derivation Authority"). No code anywhere in `ITM-A` treats a constructed `TrustRecord`'s `trustLevel` as authoritative, and no function recomputes or validates it against `signalState` — that recomputation is explicitly `ITM-C`'s responsibility, not implemented here.

## 10. Signal/evidence contract

`signalState.ts` — `{hasSuccessfulAuthentication: boolean}` only; a module-header comment explicitly documents why `accountAgeDays` is **not** a field (§6.6.4: derived at read time from Customer Identity's `Registered` timestamp, referenced never duplicated — resolving an apparent tension between §5's own loosely-worded illustrative note and §6.6.1/§6.6.4/§7's explicit, repeated "referenced, never duplicated" instruction, in favor of the latter, more specific and more repeated language). `trustEvidenceCategory.ts` — closed to the two currently-available `AUTH-08` signals (`customer_authenticated`, `authentication_recovery_proof_provided`); rejects `purchase_history`/`device_history`/any ungoverned future category by test. `trustReasonReference.ts` — one evidence entry per governed event, deduplicated by `eventId` at `TrustRecord` construction time (mirrors `AUTH-08`'s idempotent-by-`eventId` discipline as a construction-time invariant, not a re-implementation of ingestion).

## 11. Recovery-evidence treatment (`AD-ITM-2`)

`TrustReasonReference`'s type has exactly four fields (`category`, `eventId`, `correlationId`, `occurredAt`) — no `direction`/`delta`/`weight`/`trustImpact` field exists anywhere in the type. This makes `AD-ITM-2`'s "recovery-proof evidence is strictly neutral" a **structural, type-level guarantee**: there is no field a future caller could populate to encode a positive or negative trust movement, verified by a dedicated test asserting those keys are `undefined` and that the object's own key set is exactly the four expected fields.

## 12. MVP monotonic-boundary treatment (`AD-ITM-3`)

`trustRecord.ts` exports exactly one function (`createTrustRecord`) — no mutation/transition/update function exists in this package. `trustDomainBoundary.test.ts` asserts this via `Object.keys(trustRecordModule)` equalling `["createTrustRecord"]`, and asserts `trustLevel.ts`'s export surface contains no derivation/progression function. Consequently no code path in `ITM-A` could decrease a `trustLevel` or `status`, satisfying the "no regression/downward-transition contract exists" requirement by construction, not merely by omission. `trustRecordStatus.ts`'s `frozen`/`suspended` values are representable (per §5.1/§8.3, which require the *state* to exist) but no trigger/transition function is implemented, consistent with §8.3's explicit "triggers... are not authorized inside ITM-A–D at MVP."

## 13. Rule-version contract

`trustRuleVersion.ts` — `TrustRuleVersion = number`, `createTrustRuleVersion` validates a positive integer only. No rule engine, no hard-coded threshold table, no embedding into `TrustRecord` (since §5's own field table does not list a rule-version field on the record itself — only `version`, the separate optimistic-concurrency token). Satisfies Phase J's "smallest rule-version contract necessary" instruction as a standalone type future `ITM-C` code can reference.

## 14. Identity boundary verification

`TrustRecord.customerIdentityId: string` — a plain string reference, never `identity`'s own `CustomerIdentityId` value-object type (no import of `domains/identity` anywhere in the `trust` domain, verified by `trustDomainBoundary.test.ts`). No second customer-identity identifier is introduced; no Customer Identity ownership semantics are touched. `trustDomainBoundary.test.ts` additionally asserts the **reverse** direction: the `identity` domain does not import `domains/trust` anywhere — confirmed at both the source-grep level (this test) and by inspection (`trustReference.ts` only holds an opaque `trustRecordId` string, unchanged by this task).

## 15. Domain validation rules

Construction-time validation implemented for: blank/whitespace-only `trustRecordId`; blank `customerIdentityId`; unrecognised `trustLevel`/`status`/evidence `category`; non-boolean `verificationState`/`signalState` fields; non-positive/non-integer `version`/`TrustRuleVersion`; blank `eventId`/`correlationId`; invalid (`NaN`) `Date` for `occurredAt`/`createdAt`/`updatedAt`; `updatedAt` earlier than `createdAt`; duplicate evidence (same `eventId`) within one record's `reasonReferences`. Every failure maps to the existing `VALIDATION_FAILED` category (no new error category introduced) via `TrustDomainError`, mirroring `IdentityDomainError`/`PermissionDomainError`.

## 16. Test matrix (realized)

All seventeen items from the task's Phase M matrix are covered:

| # | Item | Test location |
|---|---|---|
| 1 | All three trust levels accepted | `trustLevel.test.ts` |
| 2 | Unknown trust level rejected | `trustLevel.test.ts`, `trustRecord.test.ts` |
| 3 | Valid minimal trust record accepted | `trustRecord.test.ts` |
| 4 | Blank/malformed trust-record ID rejected | `trustRecordId.test.ts`, `trustRecord.test.ts` |
| 5 | Invalid customer-identity reference rejected | `trustRecord.test.ts` |
| 6 | Valid authentication signal evidence accepted | `trustReasonReference.test.ts`, `trustRecord.test.ts` |
| 7 | Recovery-proof evidence accepted, no progression semantics | `trustReasonReference.test.ts`, `trustRecord.test.ts` |
| 8 | Duplicate evidence handling | `trustRecord.test.ts` |
| 9 | Malformed evidence rejected | `trustEvidenceCategory.test.ts`, `trustReasonReference.test.ts`, `trustRecord.test.ts` |
| 10 | Valid rule version accepted | `trustRuleVersion.test.ts` |
| 11 | Malformed rule version rejected | `trustRuleVersion.test.ts` |
| 12 | No numeric-score field | `trustRecord.test.ts` |
| 13 | No PII/credential field | `trustRecord.test.ts` |
| 14 | No operator-visibility contract | `trustRecord.test.ts` |
| 15 | No regression/downward-transition contract | `trustDomainBoundary.test.ts` |
| 16 | Firebase-independent | `trustDomainBoundary.test.ts` |
| 17 | Customer Identity boundary one-directional | `trustDomainBoundary.test.ts` |

Additional coverage beyond the minimum matrix: `verificationState.test.ts`, `signalState.test.ts`, `trustRecordStatus.test.ts` (closed-set/type-invariant tests for the remaining value objects) and a closed-shape assertion on `TrustRecord`'s own key set.

## 17. Genuine RED→GREEN evidence

All 9 initially-written test files (63 of the eventual 69 non-boundary tests) were written and run **before** any implementation module existed. `npx vitest run src/domains/trust` at that point failed all 9 files with `Error: Cannot find module './<contract>'` — a genuine RED caused by the missing contract, not an assertion failure against a stub. Implementation modules were then written one by one; the full suite reached GREEN (`9 passed (9)`, `69 passed (69)`) on the first run after all ten modules existed. `trustDomainBoundary.test.ts` (5 tests) was written **after** the implementation, disclosed here accurately — it verifies structural properties (export surface, absence of forbidden imports, cross-domain boundary) rather than new behavior a pre-implementation RED would meaningfully capture.

## 18. Files modified/created

**New (21 files, all under `functions/src/domains/trust/models/`):** `trustLevel.ts`/`.test.ts`, `trustRecordId.ts`/`.test.ts`, `verificationState.ts`/`.test.ts`, `signalState.ts`/`.test.ts`, `trustRecordStatus.ts`/`.test.ts`, `trustEvidenceCategory.ts`/`.test.ts`, `trustReasonReference.ts`/`.test.ts`, `trustRuleVersion.ts`/`.test.ts`, `trustRecord.ts`/`.test.ts`, `trustErrors.ts`, `trustDomainBoundary.test.ts`.

**Modified (1 file):** `eslint.config.js` — one additive block (`functions/src/domains/trust/**/*.ts`), no existing block changed.

**Documentation (governance/tracking only, per Phase U):** this report; `documentation-changes-log.md` (new Entry 118); `IMPLEMENTATION_CHANGES.md` (new entry); `CDR-001-capability-delivery-roadmap.md` (§2 snapshot row, §5 ITM concern-status line, header dated append — all additive/corrective, prior text preserved with strikethrough per existing convention).

## 19. Code diff summary

+~740 lines across 10 implementation modules (~330 lines) and 11 test files (~410 lines); +1 additive ESLint block (~25 lines). No file outside `functions/src/domains/trust/**` and `eslint.config.js` was touched at the code level.

## 20. Domain architecture/boundary result

`trust` domain follows the established per-domain-foundation pattern (Identity/Loyalty Number/QR Identity/Authentication/Permissions): `models/` only, no `repositories/`/`services/` yet (none needed until `ITM-B`), one `*DomainError` class + factories, one ESLint block. No architectural deviation.

## 21. Firebase-independence verification

`trustDomainBoundary.test.ts` greps every non-test `.ts` file under `domains/trust` for `firebase-admin`/`firebase-functions` import/require patterns — zero matches. The new ESLint block additionally makes this a build-time/lint-time guarantee, not just a test-time one. `tsc --noEmit` and the functions `tsc` build both succeed with zero Firebase Admin SDK type dependency pulled into this domain.

## 22. PII/credential exclusion verification

Verified by `trustRecord.test.ts`'s explicit assertions (§8/§16 above) and by inspection of every field in `TrustRecord`, `VerificationState`, `SignalState`, and `TrustReasonReference` — none stores a raw phone number, email address, password, token, OTP, or device identifier. `VerificationState` stores only categorical booleans; `SignalState` stores only a categorical boolean; `TrustReasonReference` stores only a category, opaque `eventId`/`correlationId`, and a timestamp.

## 23. ITM-B handoff

`ITM-B` will consume: `createTrustRecord` (to construct/reconstruct records from Firestore documents), `TrustReasonReference`/`TrustEvidenceCategory` (to represent ingested `AUTH-08` events as evidence, with `ITM-A`'s duplicate-`eventId` rejection already available as a domain-level guard it can rely on or wrap), `TrustRuleVersion` (if it chooses to stamp evidence-ingestion writes with a rule-version marker). `ITM-B` must add its own Firestore repository under `trust/repositories/` and its own ESLint carve-out (mirroring `identity`'s `repositories/**` exclusion) when it needs Firebase Admin imports — not provided by this package.

## 24. ITM-C handoff

`ITM-C` will consume: `TrustLevel` + its ordering helpers (`compareTrustLevels`/`isAtLeastTrustLevel`), `SignalState` (the evidence to derive from), `TrustRuleVersion` (to version its own derivation function), and the Customer Identity `Registered` timestamp via the proper existing boundary (not through this package — `ITM-A` does not expose or reference it). `ITM-C` must implement the actual `signalState + ruleVersion + currentServerTime → TrustLevel` derivation function (§6.6.1, §6.6.4's exact `floor((currentServerTime − registeredAt) / 86400s)` / `≥ 30` boundary), which does not exist anywhere in this package.

## 25. ITM-D handoff

`ITM-D` will consume whatever effective-trust read contract `ITM-C` produces (not built here) plus this package's `TrustLevel` ordering helpers, to implement the read-only `checkRiskGate(customerIdentityId, riskRequirement)` contract (§9.1). Nothing in `ITM-A` implements or anticipates a specific `riskRequirement` vocabulary.

## 26. Focused tests

`npx vitest run src/domains/trust` (from `functions/`): **10 files, 74 tests, all passing.**

## 27. Full validation

- Functions unit suite: `npx vitest run` → **96 files, 872 tests, all passing** (+74 over the `origin/main` baseline of 798).
- Functions typecheck: `npx tsc --noEmit` → clean.
- Functions build: `npx tsc` (via `functions/package.json`'s `build` script) → clean.
- Root lint: `npx eslint .` → clean (including the new `trust` boundary block).
- Root format: `npx prettier --check functions/src/domains/trust eslint.config.js` → clean after one `--write` pass (4 files auto-formatted; no logic change, verified by re-running the full test suite after formatting — still 872/872).
- Web suite (unaffected, run for completeness per Phase R): `pnpm --filter ./apps/web run test` → **51 files, 397 tests, all passing**, unchanged from baseline.
- `emulators:validate` — not run. This package has no Firestore/Firebase surface (`ITM-A` is Firebase-independent domain contracts only); there is nothing for the emulator suite to exercise. Investigated and confirmed applicable-not-required, not skipped for convenience.

## 28. Review findings/dispositions

No automated PR review has been requested yet — this report accompanies the PR opened for Founder/Codex review (Phase S). No findings to disposition at report-authoring time; this section will be updated in place if review findings require correction before merge, per repository convention (history preserved).

## 29. Remaining material findings

None identified by self-review at the time of this report. The two disclosed process notes (§17: one boundary test written post-implementation; §10: `accountAgeDays` resolved via the more specific of two internally-adjacent design statements) are documented, not concealed, and neither represents an unresolved defect.

## 30. Dependencies

None added, removed, or upgraded. `functions/package.json`/root `package.json` unchanged.

## 31. Config changes

One additive `eslint.config.js` block only (§18, §20). No other configuration file touched.

## 32. Firebase/Rules changes

None. No `firestore.rules`, `firebase.json`, Firestore index, or Firebase project configuration touched. `firebase-admin`/`firebase-functions` are not imported anywhere in this task's diff (verified §21).

## 33. Deployment changes

None. No Cloud Function endpoint added, modified, or removed. `functions/src/index.ts` untouched.

## 34. Boundary audit

Final diff (`git status --short` on `feat/cap-p2-itm-a-trust-domain-contracts` against `origin/main`) contains exactly: 21 new files under `functions/src/domains/trust/models/` (contracts + tests); 1 modified file (`eslint.config.js`, additive block); this report; `documentation-changes-log.md`; `IMPLEMENTATION_CHANGES.md`; `CDR-001-capability-delivery-roadmap.md` (dated-append status corrections only, no structural rewrite). **Confirmed absent:** Firestore persistence, event ingestion, band derivation, account-age logic, risk gating, operator UI/API, Capability 3 work, deployment/config change, Firebase Rules/project change.

## 35. Traceability

Per Phase U, recorded (not competing with any existing source of truth — `CDR-001` §5 remains authoritative for capability/concern status):

- `CAP-P2-ITM-DESIGN-001` = **Complete/merged** (unchanged by this task).
- `ITM-A` = **Implemented / pending Founder review**.
- `ITM-B` = **Not started**.
- `ITM-C` = **Not started**.
- `ITM-D` = **Not started**.
- ITM overall = **Not complete**.
- Capability 2 = **Open — partially implemented** (unchanged).
- Capability 3 = **Not started** (unchanged).
- G2 = **Not started** (unchanged).

## 36. Version control

Clean linked worktree/branch (§2). Commit(s) scoped exclusively to `ITM-A` (§34). Not yet pushed/PR'd at report-authoring time — both follow immediately after this report per Phase V/S. **Not self-merged.** `ITM-B` not begun.

---

## Completion Report Cross-Reference

Items 1–36 above map directly to the task's Completion Report checklist items 1–36 (Entry origin/main SHA through Version control). The remaining checklist items are recorded as follows:

- **37. Config changes** — §31.
- **38. Firebase/Rules changes** — §32.
- **39. Deployment changes** — §33.
- **40. Boundary audit** — §34.
- **41. PR number** — recorded once opened (immediately following this report, per Phase S/V).
- **42. Final reviewed head** — recorded once review completes.
- **43. CI result** — recorded once the PR's CI run completes.
- **44–48. ITM-A/B/C/D and ITM-overall status** — §35.
- **49. Capability 2/3/G2 status** — §35.
- **50. Dirty primary worktree status** — untouched throughout (§2).
- **Risks:** none identified beyond the two disclosed process notes (§29). The `signalState`/`accountAgeDays` design-text tension (§10) is a documentation-interpretation risk for a future reader of `ITM-DESIGN-001` §5 in isolation — flagged here and resolvable by a future `ITM-DESIGN-001` clarifying edit if the Founder agrees, not by this report unilaterally amending the design document.
- **Rollback:** revert the commit(s) on `feat/cap-p2-itm-a-trust-domain-contracts` — entirely additive (one new domain directory, one additive ESLint block, dated-append documentation); no schema, no deployed resource, no data to roll back.
- **Persistent implementation-report path:** `docs/05-implementation/reports/CAP-P2-ITM-A-trust-domain-contracts-2026-08-16.md` (this file).
- **Changes-tracking state:** `documentation-changes-log.md` Entry 118 and `IMPLEMENTATION_CHANGES.md`'s `CAP-P2-ITM-A` entry both added, both cross-referencing this report.

## Final Gate

**ITM-A READY FOR FOUNDER REVIEW/MERGE.**
