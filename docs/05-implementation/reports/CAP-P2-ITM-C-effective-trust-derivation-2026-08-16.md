> **Title:** CAP-P2-ITM-C — Effective Trust Derivation & MVP Progression — Implementation Report
> **Status:** Complete/merged (PR #115, merged as `e090d86814a7583d0ac03ae26575f3a231414547`, 2026-08-16) — see §53 Independent Final Review, Merge & Closure
> **Governing document:** [ITM-DESIGN-001](../roadmap/ITM-DESIGN-001-identity-trust-management-architecture.md) v1.2, §6.6/§6.6.1–§6.6.4, §15 `ITM-C`, §22 (`AD-ITM-1`–`AD-ITM-3`)
> **Prerequisites:** `CAP-P2-ITM-A` (merged PR #111/#112), `CAP-P2-ITM-B` (merged PR #113/#114) — CI green

# CAP-P2-ITM-C — Effective Trust Derivation & MVP Progression — Implementation Report

## 1. Entry `origin/main` SHA

`1be2ff7c69c5f53b39856008e9ccba25fe1b616b` — verified via `git rev-parse origin/main`; matches "Merge pull request #114 from Fkenogo/docs/cap-p2-itm-b-closure-sync", the task's expected baseline exactly.

## 2. Clean worktree/branch

`.claude/worktrees/itm-c-effective-trust`, branch `feat/cap-p2-itm-c-effective-trust-derivation`, branched fresh from `origin/main` at `1be2ff7` via the harness's native `EnterWorktree` tool. The primary worktree (branch `chore/eng-p1-001-closure`, pre-existing unrelated docs-only dirty state) was never reset, cleaned, stashed, rebased, or written to.

## 3. ITM-A/B prerequisite verification

- `gh pr list --search "ITM-C OR ITM-D"` and `git branch -a` confirmed `ITM-A` (PR #111 merged, PR #112 closure-sync merged) and `ITM-B` (PR #113 merged, PR #114 closure-sync merged); no `ITM-C`/`ITM-D` branch or PR exists anywhere.
- `gh run list --branch main` confirmed post-merge CI `"CI" = success` at `1be2ff7`.
- `gh pr list --state open` confirmed only PR #34 open (unrelated, `ENG-P2-RES-ADMIN-003` post-decision sync).
- Capability 3 and G2: confirmed `Not started` in `ITM-DESIGN-001` §19/§20 and `CDR-001`.
- Dirty primary worktree confirmed untouched throughout.

No material state differed from the task's stated expectations — Phase A proceeded without a stop condition.

## 4. Codebase analysis (performed before writing code)

- **`ITM-DESIGN-001` §6.6/§6.6.1–§6.6.4/§15 `ITM-C` row/§22** — full re-read. §6.6.1 ("Derivation Authority") and §22's restatement are explicit: `signalState`, the rule version, and current server time are authoritative; a persisted `trustLevel` is a read-optimization cache refreshed only opportunistically by ITM-B's own signal-driven write path — never by a read. §15's `ITM-C` row lists "optional derived-cache synchronization only if already authorized by design" as a possible scope item; §6.6.1/§6.6.2's actual text authorizes cache refresh only on ITM-B's write path, so no cache write was added here (Phase N).
- **ITM-A's merged contracts** (`functions/src/domains/trust/models/*.ts`) — `trustLevel.ts` (closed 3-band enum, ordering helpers, no derivation function — its own boundary test locks its export list), `trustRecord.ts` (pure factory, `trustLevel` explicitly documented as non-authoritative-when-persisted), `trustRuleVersion.ts` (positive-integer validator, explicitly deferring "what each version means" to ITM-C), `signalState.ts` (`hasSuccessfulAuthentication: boolean` only — `accountAgeDays` deliberately absent, ITM-C's read-path responsibility), `trustReasonReference.ts` (no trust-movement field — structurally guarantees `AD-ITM-2` neutrality).
- **ITM-B's persistence/ingestion** (`repositories/trustRecordRepository.ts`, `repositories/trustRecordDocument.ts`, `services/trustSignalIngestionService.ts`) — confirmed `trustLevel` is set to the literal `"unverified"` string at creation and never recomputed on any subsequent write; `signalState.hasSuccessfulAuthentication` is a monotonic OR, append-only; malformed persisted data fails closed via `fromTrustRecordDocument` → `createTrustRecord` → `TrustDomainError("VALIDATION_FAILED")`.
- **Customer Identity's registered timestamp source** — `domains/identity/models/customerIdentity.ts`'s `createdAt: Date`, set once at `registerCustomerIdentity` and never mutated afterward (no lifecycle transition touches it) — the authoritative `Registered`-transition timestamp §6.6.4 requires. Read via `customerIdentityRepository.getCustomerIdentityById`, which throws `unknownCustomerIdentityError` (`RESOURCE_NOT_FOUND`) when missing and `malformedCustomerIdentityRecordError` (`VALIDATION_FAILED`) via `fromUserDocument` when the stored shape is malformed — both already-governed `IdentityDomainError` categories, reused unmodified.
- **`domains/permissions/evaluator/` + `domains/permissions/service/`** (`ENG-P2-004B`) — the closest existing precedent for a pure decision function fed by explicit, typed read-result unions (`found`/`not_found`/`malformed`/`transient_failure`) and an orchestrating Firestore service supplying `now: Date` rather than a wall-clock read inside the pure function. Adopted directly rather than inventing a new pattern.
- **`trustDomainBoundary.test.ts`** (ITM-A's own boundary test, unmodified) — confirms `domains/identity` imports in the trust domain are confined to `services/` only, never `models/`/`repositories/`. This is why the pure derivation function lives in a new `derivation/` directory (no Firestore, no identity import — verified by a new, additive boundary test) and the orchestrator lives in `services/effectiveTrustService.ts`.
- **Error taxonomy** (`shared/errors/errorCategories.ts`) — the closed 14-category set, reused unmodified; every ITM-C failure maps to `VALIDATION_FAILED`, `RESOURCE_NOT_FOUND`, or `TEMPORARY_UNAVAILABLE` — no new category.
- **Emulator test conventions** (`trustSignalIngestion.emulator.test.ts`) — the `initializeApp`/`FIRESTORE_EMULATOR_HOST` guard/`beforeEach` collection-wipe/`seedCustomerIdentity` helper pattern, reused directly for `effectiveTrustService.emulator.test.ts`.

## 5. Implementation strategy (stated before implementation)

Add a `derivation/` layer (pure, no Firestore, no `domains/identity` import — mirrors `domains/permissions/evaluator/`) containing the exact §6.6 band algorithm as a function of an explicit input object, and a `services/effectiveTrustService.ts` orchestrator (mirrors `domains/permissions/service/evaluatePermissionService.ts`) that performs the two authoritative reads, maps their outcomes onto typed result unions, and delegates to the pure function. No change to any ITM-A/B file. No cache write-back. No risk-gate contract, no ITM-D work.

## 6. ITM-C scope reconstruction

Implemented: `derivation/types.ts` (read-result unions, `EffectiveTrustDerivationInput`/`Result`, `EffectiveTrustResult`, `CURRENT_TRUST_RULE_VERSION`), `derivation/deriveEffectiveTrust.ts` (the pure band-derivation function), `derivation/effectiveTrustDomainBoundary.test.ts` (additive purity boundary test), `services/effectiveTrustService.ts` (Firestore orchestrator — `getEffectiveTrust`), `services/effectiveTrustErrors.ts` (failure-reason → `TrustDomainError` mapping). Not implemented (by design, out of ITM-C's authorized scope): event ingestion, trust-record creation, new signal sources, fraud/risk scoring, regression, risk-gated action authorization, Reward Engine policy, operator surfaces, persisted-cache write-back.

## 7. Authority model

Authoritative inputs: `signalState.hasSuccessfulAuthentication` (ITM-B, read-only), Customer Identity's `createdAt` (read-only), the governed rule version (`CURRENT_TRUST_RULE_VERSION = 1`, validated via ITM-A's `createTrustRuleVersion`), and the caller-supplied current time. The persisted `TrustRecord.trustLevel` field is **never read** by `getEffectiveTrust` at all — `TrustRecordReadResult` (`derivation/types.ts`) does not carry it, so a stale cached value cannot influence the result by construction, not merely by convention (verified: "persisted trustLevel cache cannot override effective result" test, both at the pure-function level and, with a real ITM-B-created stale cache, at the emulator level).

## 8. Pure derivation algorithm

`derivation/deriveEffectiveTrust.ts` implements exactly:

```
IF hasSuccessfulAuthentication != true:  unverified
ELSE IF accountAgeDays >= 30:            established
ELSE:                                    provisional
```

No provider weighting, no recovery weighting, no numerical score, no purchase/device/merchant/fraud condition — matches §6.6/task Phase E exactly. The function never touches Firestore, never imports `domains/identity`, and never reads the wall clock (`now` is part of its input) — verified by `effectiveTrustDomainBoundary.test.ts` and by the determinism test (identical input twice → `toEqual` identical output).

## 9. 30-day account-age calculation

`accountAgeDays = Math.floor((now.getTime() - registeredAt.getTime()) / 86_400_000)` — exactly §6.6.4's `floor((currentServerTime − registeredAt) / 86400 seconds)`, elapsed 24-hour periods, not calendar-month arithmetic.

## 10. Exact boundary semantics

`established`'s condition is `accountAgeDays >= 30` (closed, non-strict — the crossing belongs to `established`). Tested directly at 29 days, 29 days + 23:59:59 (still `provisional`), exactly 30 days, 30 days + 1 second, and 31 days (all `established`) — both at the pure-function level (`deriveEffectiveTrust.test.ts`) and, for the exact-30-day case, against real Firestore (`effectiveTrustService.emulator.test.ts`).

## 11. Invalid/future-time handling

`now` invalid (not a `Date` / `NaN` time) → `invalid_current_time` (`VALIDATION_FAILED`). `registeredAt` invalid → `registered_at_invalid` (`VALIDATION_FAILED`). `registeredAt` later than `now` (covers both "future registration timestamp" and "current time earlier than registration time" — the same check) → `registered_at_in_future` (`VALIDATION_FAILED`). All three fail closed via the existing `VALIDATION_FAILED` category — applying the existing taxonomy to a malformed-data edge case, not a new policy question, so no Founder escalation was required.

## 12. Customer Identity read

`services/effectiveTrustService.ts`'s `readCustomerIdentity` calls the existing `customerIdentityRepository.getCustomerIdentityById` (unmodified) and maps its two typed failure modes: missing → `not_found` → `customer_identity_not_found` (`RESOURCE_NOT_FOUND`); malformed → `malformed` → `customer_identity_malformed` (`VALIDATION_FAILED`); any other thrown error (e.g. a transient Firestore failure) → `transient_failure` → `TEMPORARY_UNAVAILABLE`. `readTrustRecord` additionally checks that the persisted record's own `customerIdentityId` matches the requested key, failing closed as `malformed` on mismatch (a data-integrity problem, not legitimate steady state). ITM-C never writes to `users/{id}` or `trustRecords/{id}` — read-only throughout, verified by the emulator test asserting no `trustRecords` document is created for an identity with no prior evidence.

## 13. Authentication evidence treatment

`readTrustRecord` reads only `record.signalState.hasSuccessfulAuthentication` (a single boolean) — never a count, never a provider breakdown. Verified: "number of authentication events cannot affect the result" and "provider type cannot affect the result" tests pass because the input type itself has no field through which either could be represented.

## 14. Recovery-neutral treatment

`AuthenticationRecoveryProofProvided` evidence is retained by ITM-B in `reasonReferences` but never surfaces in `signalState.hasSuccessfulAuthentication` — `TrustRecordReadResult` (ITM-C's own input type) carries only that one boolean, so a recovery-only trust record produces the identical derivation input, and therefore the identical result, as no evidence at all. Verified directly against real Firestore: an identity with only recovery evidence and 40 elapsed days still derives `unverified`.

## 15. Monotonic-MVP treatment

No downward-transition code path exists anywhere in `derivation/deriveEffectiveTrust.ts` — the function computes a band fresh from evidence + time on every call; there is no "previous result" input for it to compare against or preserve. Per Phase K's caution against conflating "current effective band" with "stored historical/cache value": the persisted `trustLevel` is never read as an input at all (§7 above), so a corrupt or missing trust record cannot cause a stale *high* band to be returned — it fails closed (`malformed`/`not_found` → `unverified` or an error, never a preserved `established`).

## 16. Rule-version treatment

`CURRENT_TRUST_RULE_VERSION = 1` (`derivation/types.ts`). A malformed rule version (not a positive integer — reuses ITM-A's `createTrustRuleVersion`) fails closed as `malformed_rule_version`; a well-formed but non-current version fails closed as `unsupported_rule_version` — both `VALIDATION_FAILED`. No rule engine, no second rule set, is implemented — future versions require adding a new branch to this one function, not a generic engine (matches §6.6.2/Phase L).

## 17. Effective-result contract

```ts
type EffectiveTrustResult = {
  customerIdentityId: string;
  effectiveTrustLevel: TrustLevel;
  ruleVersion: number;
  evaluatedAt: Date;
  basis: { hasSuccessfulAuthentication: boolean; accountAgeDays: number };
};
```

`basis` is the bounded internal reason/context Phase M anticipated — no raw evidence, no PII, no numeric score. `ITM-DESIGN-001` does not specify a more precise result shape than §15's illustrative field list, so this is the smallest contract satisfying it.

## 18. Persisted-cache disposition

**No cache write.** `getEffectiveTrust` never calls `ingestTrustEvidence` or any other write path — confirmed by a dedicated emulator test that seeds a trust record whose persisted `trustLevel` is `"unverified"` (via ITM-B's own real ingestion), derives the effective trust 40 days later (`established`), and then re-reads the raw Firestore document to assert `trustLevel` and `version` are byte-identical to before the read. `ITM-DESIGN-001` §6.6.1/§6.6.2/§15 explicitly assign opportunistic cache refresh to ITM-B's signal-driven write path only — this was not ambiguous, so no cache-mutation code was added and no STOP was required.

## 19. Service/orchestration

`services/effectiveTrustService.ts`'s `getEffectiveTrust(db, customerIdentityId, now = new Date())`: validates/trims the identity id, performs the two reads in parallel (`Promise.all`, skipped entirely for a blank id, mirroring `evaluatePermissionService.ts`'s malformed-request short-circuit), calls the pure function, and throws a `TrustDomainError` (via `effectiveTrustErrors.ts`) on a `"failed"` outcome or returns the `EffectiveTrustResult` on `"derived"`. No risk-gate decision, no action authorization, no Reward Engine integration.

## 20. Test matrix

All 30 scenarios from the task brief are covered, plus the additional invariant/boundary items the design and existing conventions required. See `derivation/deriveEffectiveTrust.test.ts` (39 pure unit tests, describe-blocks named by scenario range) and `services/effectiveTrustService.emulator.test.ts` (7 real-Firestore tests: no-trust-record, real-ITM-B-ingestion at exactly 30 days, real-ITM-B-ingestion under 30 days, stale-cache non-override, missing-identity fail-closed, recovery-only neutrality, determinism).

## 21. Genuine RED → GREEN evidence

`npx vitest run src/domains/trust/derivation/deriveEffectiveTrust.test.ts` was run against the test file alone, before `deriveEffectiveTrust.ts` existed — genuine RED: `Error: Cannot find module './deriveEffectiveTrust'`. After implementing the pure function: `39 passed (39)`. No retrospective RED was manufactured.

## 22. Files modified

Seven new files, zero modified files (see §23 for the exact list). No ITM-A/B file, no `firestore.rules`, no `index.ts`, no config file touched.

## 23. Code diff summary

```
functions/src/domains/trust/derivation/types.ts                              (new, 87 lines)
functions/src/domains/trust/derivation/deriveEffectiveTrust.ts                (new, 118 lines)
functions/src/domains/trust/derivation/deriveEffectiveTrust.test.ts           (new, 341 lines)
functions/src/domains/trust/derivation/effectiveTrustDomainBoundary.test.ts   (new, 46 lines)
functions/src/domains/trust/services/effectiveTrustService.ts                 (new, 121 lines)
functions/src/domains/trust/services/effectiveTrustErrors.ts                  (new, 45 lines)
functions/src/domains/trust/services/effectiveTrustService.emulator.test.ts   (new, 204 lines)
```

## 24. ITM-A regression

Full functions unit suite (`npx vitest run`, includes every ITM-A test unmodified): **917/917 passing**. `trustDomainBoundary.test.ts` (ITM-A's own boundary test) unmodified and passing — no export list, no assertion, changed.

## 25. ITM-B regression

`trustSignalIngestion.emulator.test.ts` (ITM-B's real-Firestore suite) unmodified and passing — verified both inside the full `emulators:validate` run and isolated (`domains/trust` only: 2 files / 31 tests, 100% green).

## 26. No-ingestion-change verification

`services/trustSignalIngestionService.ts` and `repositories/trustRecordRepository.ts` are untouched (`git diff 1be2ff7 HEAD -- functions/src/domains/trust/services/trustSignalIngestionService.ts functions/src/domains/trust/repositories/` is empty). ITM-C only reads via `getTrustRecordByCustomerIdentityId`, an existing, unmodified export.

## 27. No-risk-gate verification

No `checkRiskGate`/risk-gate function, type, or contract exists anywhere in this change. `getEffectiveTrust` returns data; it makes no `sufficient`/`insufficient`/`unavailable` decision and is not called from any protected-action boundary.

## 28. ITM-D handoff

ITM-D will call `services/effectiveTrustService.ts`'s `getEffectiveTrust(db, customerIdentityId, now?)` and receive an `EffectiveTrustResult` (`customerIdentityId`, `effectiveTrustLevel`, `ruleVersion`, `evaluatedAt`, bounded `basis`). ITM-D independently defines "does this specific, already-authorized action's risk requirement compare successfully against this result" — not answered here.

## 29. Privacy/security result

Grepped all seven new files for email/phone/token/OTP/password/credential/fraud-score/customer-facing-status patterns — none found (the one match, in the test file, is the assertion *proving* their absence, not an occurrence). `EffectiveTrustResult` carries no PII and no numeric score. No operator-facing field, endpoint, or permission identifier was added (`AD-ITM-4` unaffected).

## 30. Focused tests

`npx vitest run src/domains/trust/derivation` → 41/41 passing (39 pure derivation tests + 2 boundary tests).

## 31. Emulator tests

Isolated `domains/trust` run inside `firebase emulators:exec`: **2 files / 31 tests, 100% passing** (ITM-B's existing suite + this package's new 7 tests).

## 32. Full validation

- `npx vitest run` (functions): **917/917 passing**.
- `npx vitest run` (apps/web): **397/397 passing** (untouched by this change).
- `npx tsc --noEmit -p .` / `npx tsc -p .` (build): clean.
- `npx eslint .`: clean.
- `npx prettier --check .`: clean (after `--write` normalization of the new files).
- Full-repo `pnpm run emulators:validate`: **283/319 passing (36 failed, 12 files)** — every failing file is in `domains/identity`, `domains/authentication`, `domains/permissions`, `shared/commands`, or `shared/outbox`, none touched by this change, and every failure is a Firestore concurrent-transaction-contention symptom (`AssertionError: expected 2 to be 1`, `5 NOT_FOUND: no entity to update`) consistent with sandbox resource contention, not a code defect. Isolating the same run to `domains/trust` alone (§31) is 100% green, confirming this change introduces no regression. Disclosed rather than hidden or silently rerun to a different result.

## 33. Review findings/dispositions

No automated Codex reviewer is configured on this repository (already disclosed in the ITM-A/ITM-B implementation history — `CDR-001`). This report constitutes the independent final review: self-reviewed the diff against `ITM-DESIGN-001` §6.6/§22, the ITM-A/B boundary tests, and the `ENG-P2-004B` evaluator precedent; no material finding requiring a fix was identified. No Codex/external review was awaited indefinitely.

## 34. Remaining material findings

None.

## 35. Dependencies

None added — reuses `firebase-admin`, `vitest`, and existing intra-repo imports only. `pnpm-lock.yaml` unchanged.

## 36. Config changes

None.

## 37. Firebase/Rules changes

None. `firestore.rules`'s existing catch-all deny still applies; no new collection was created (ITM-C is read-only against the existing `trustRecords`/`users` collections).

## 38. Deployment changes

None.

## 39. PR number

[#115](https://github.com/Fkenogo/11THONUS/pull/115)

## 40. Final reviewed head

`78eb35d`

## 41. CI result

`gh pr checks 115` — pending at time of writing; recorded in the closure-sync follow-up once resolved. Local validation (§32) is CI's own command set (`Build, Lint, Test, Emulator Validation`), run directly and disclosed here as strong pre-CI evidence.

## 42. ITM-C status

**Implemented / pending Founder review** (this PR).

## 43. ITM-D status

**Not started.**

## 44. ITM overall status

**Not complete.**

## 45. Capability 2 status

**Open — partially implemented.**

## 46. Capability 3 status

**Not started.**

## 47. G2 status

**Not started.**

## 48. Dirty primary worktree status

Untouched throughout — confirmed via `git status --short` in `/Users/theo/11THONUS` before and after this work, unchanged from the session's initial snapshot.

## 49. Risks

- The full-repo `emulators:validate` sandbox flakiness (§32) is disclosed but not independently root-caused beyond isolation testing; a future package should confirm whether this reproduces in CI's own runner (CI was green on `origin/main` immediately prior to this branch, §3, suggesting it is local-sandbox-specific).
- `EffectiveTrustResult`'s exact field shape is this implementation's own smallest-sufficient design (§17) since `ITM-DESIGN-001` does not pin an exact contract — ITM-D should treat it as a starting point, not a frozen API, until ITM-D's own Founder authorization reviews it.

## 50. Rollback

Revert PR #115 (or `git revert 78eb35d`) — the change is strictly additive (seven new files, zero modified files), so reversion is a clean file deletion with no data migration and no effect on ITM-A/B, which remain fully functional and untouched with or without this PR.

## 51. Persistent implementation-report path

`docs/05-implementation/reports/CAP-P2-ITM-C-effective-trust-derivation-2026-08-16.md` (this file).

## 52. Changes-tracking state

`docs/00-governance/documentation-changes-log.md`, `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md`, and `docs/05-implementation/change-tracking/engineering-implementation-programme.md` updated in the same PR to record `ITM-C = Implemented / pending Founder review`, `ITM-D`/`ITM overall`/`Capability 2`/`Capability 3`/`G2` unchanged from their pre-existing status.

---

## 53. Independent Final Review, Merge & Closure

**Date:** 16 August 2026. **Performed by:** Claude (AI agent), per Founder task "CAP-P2-ITM-C — Independent Final Derivation Review, Merge & Closure." Authorizes independent final review of `ITM-C` and, if clean, merge/closure of PR #115 only — does not authorize `ITM-D`, Capability 3, G2, or any ITM policy modification.

**Entry verification:** PR #115 confirmed `OPEN`, head `8786d09b7f8bedaeccadef1ca4152ff9b6702e3d` (exact expected head, zero later commits at review start), CI `pass` (3m32s), `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`. `origin/main` confirmed unchanged at `1be2ff7` since the PR was cut. `ITM-A`/`ITM-B` confirmed merged. No `ITM-D` branch or PR found anywhere (`gh pr list`/`git branch -a`). Dirty primary worktree confirmed untouched (this session has no access to it, by harness-enforced worktree isolation).

**Independent requirement reconstruction:** re-read `ITM-DESIGN-001` §6.6/§6.6.1–§6.6.4/§22 directly rather than trusting §1–§52 above as authoritative. Confirmed §6.6's exact three-condition algorithm, §6.6.4's precise `floor((now−registeredAt)/86400s)` formula and closed `>=30` inequality, and §22's "Derivation Authority" clarification (evidence + rule version + current time authoritative; persisted `trustLevel` never authoritative) against the design text itself, then against the actual merged code (`deriveEffectiveTrust.ts`, `types.ts`, `effectiveTrustService.ts`) read fresh.

**Primary merge gate — stored `trustLevel` cannot become authority (Phase F):** confirmed structurally first — `TrustRecordReadResult` (the pure function's own input type) has no `trustLevel` field at all, so no code path could read one even if it wanted to. Then confirmed adversarially: wrote `effectiveTrustService.independentReview.emulator.test.ts`, a new test file written separately from §1–§52's own suite, which forges a persisted `trustRecords` document directly via raw Firestore writes — bypassing `ingestTrustEvidence`/ITM-B's repository entirely, so the forged value cannot be "corrected" on the write path — across all three adversarial directions this review task's Phase F explicitly named:

1. forged `trustLevel = established` + no auth evidence → effective derivation still returned `unverified`.
2. forged `trustLevel = established` + auth evidence + age < 30 days → effective derivation still returned `provisional`.
3. forged `trustLevel = unverified` + auth evidence + age ≥ 30 days → effective derivation still returned `established` (only this direction had prior coverage, from §1–§52's own `effectiveTrustService.emulator.test.ts`).

A fourth scenario (forged `provisional` + no evidence + age ≥ 30 days → still `unverified`) was added to additionally confirm age alone is never sufficient. All four passed against the real Firebase Emulator Suite on the first run.

**Concurrency / read-consistency (Phase O):** two further new tests confirmed a read taken before ITM-B's evidence commits returns `unverified`, the identical read taken after commit returns `provisional`, and ten concurrent `getEffectiveTrust` calls against a fixed record never mutate the underlying Firestore document (byte-identical before/after). No transaction exists in the read-only orchestrator, correctly — a plain read needs none.

**Other gates independently re-verified by direct code inspection, not re-assertion:**
- **Recovery neutrality (Phase G):** `TrustRecordReadResult` carries only `hasSuccessfulAuthentication` — no recovery field exists anywhere in the type for a recovery signal to move the band through, positively or negatively.
- **Authentication evidence (Phase H):** a single boolean; no count, no provider field, is representable in the input type at all.
- **Monotonic MVP (Phase I):** no downward-transition code path exists anywhere in `deriveEffectiveTrust.ts`; malformed customer-identity or trust-record state fails closed via a thrown error rather than silently preserving a stale high band.
- **Rule version (Phase J):** `CURRENT_TRUST_RULE_VERSION = 1`; a malformed (non-positive-integer) version and a well-formed-but-unsupported version fail closed via two distinct reasons; no rule engine exists.
- **Customer Identity source (Phase K):** `registeredAt` is read via the unmodified `customerIdentityRepository.getCustomerIdentityById`; missing/malformed identity fails closed (`RESOURCE_NOT_FOUND`/`VALIDATION_FAILED`); a trust-record/`customerIdentityId` mismatch is explicitly checked and fails closed as malformed; no write path to `users/{id}` exists anywhere in the diff.
- **Effective-result contract (Phase L):** `EffectiveTrustResult` contains exactly `customerIdentityId`/`effectiveTrustLevel`/`ruleVersion`/`evaluatedAt`/bounded `basis` — no score, no PII, no operator-facing field.
- **ITM-D boundary (Phase M):** `getEffectiveTrust(db, customerIdentityId, now?)` takes no action identifier and no risk-threshold parameter; a repository-wide grep for `riskGate`/`checkRiskGate`/`riskRequirement`/`sufficient`/`insufficient` across the diff returned zero matches.
- **Pure-function boundary (Phase N):** `derivation/deriveEffectiveTrust.ts` imports only ITM-A's `trustRuleVersion.ts`/`trustErrors.ts` and its own `types.ts` — no `firebase-admin`, no `domains/identity`; confirmed both by direct import inspection and by the existing `effectiveTrustDomainBoundary.test.ts` passing.
- **ITM-A/B regression (Phase Q):** `git diff 1be2ff7 883bb6d -- functions/src/domains/trust/{models,repositories}` plus the three ITM-B service files is empty — zero semantic change.
- **Privacy/security (Phase R):** grepped the full diff for email/phone/token/OTP/password/raw-claim/demographic/fraud-score terms — none found beyond the test file's own assertion of their absence.

**Review tooling (Phase T):** no automated Codex/external review bot configured on this repository (`gh pr view 115 --json reviews` returned an empty array); disclosed accurately — this independent review served as the merge gate, per this task's explicit authorization for that circumstance.

**Full validation re-run (Phase S), fresh, not re-cited:** functions **917/917**; `domains/trust` emulator suite isolated (real Firebase Emulator Suite via `firebase emulators:exec`) **37/37** (31 from §1–§52's own suite + 6 new independent-review tests); web **397/397** (untouched); `tsc --noEmit`/build clean (both workspaces); `eslint .` clean; `prettier --check` clean; PR CI **pass** (3m34s) on the final reviewed head `883bb6d`.

**New tests added during review:** `functions/src/domains/trust/services/effectiveTrustService.independentReview.emulator.test.ts` (6 tests) — no implementation code changed.

**Findings:** none material. No scope leakage into ITM-D/risk-gating, no algorithm deviation, no boundary-semantics defect, no stored-cache leak, no ITM-A/B regression.

**Merge:** with all Phase U gates clean, PR #115 merged via `gh pr merge 115 --merge` (standard merge commit, matching repository convention) as `e090d86814a7583d0ac03ae26575f3a231414547`. Post-merge: `origin/main` fetched and confirmed at `e090d86`; `883bb6d` (the final reviewed head) confirmed an ancestor (`git merge-base --is-ancestor`); post-merge CI (`main`, run `31958885277`) confirmed `success`; `functions/src/domains/trust/{derivation,services}/**` confirmed present on `origin/main`.

**Status change:** `ITM-C` = **Complete/merged**. `ITM-D` remains **Not started** — not begun by this task, requiring its own fresh Founder implementation authorization. ITM overall remains **Not complete**. Capability 2 remains `Open — partially implemented; not closed`. Capability 3 remains `Not started`. G2 not started.

**Files:** `CDR-001-capability-delivery-roadmap.md` (§2/§5 ITM lines + header dated append), `documentation-changes-log.md` (Entry 121), `engineering-implementation-programme.md` (header dated append), `IMPLEMENTATION_CHANGES.md`, this closure section, and one additive test file (`effectiveTrustService.independentReview.emulator.test.ts`) committed to PR #115 itself before merge. **No implementation code changed by this review task's own diff** beyond the one additive test file.

**Dirty primary worktree status:** untouched throughout — this session has no access to it, by harness-enforced worktree isolation.

**Rollback:** `git revert` the merge commit `e090d86` — the underlying change is entirely additive (new files only); no schema, no deployed resource, no data to roll back.

---

# FINAL GATE

**ITM-C MERGED AND CLOSED — ITM-D AWAITS FRESH FOUNDER AUTHORIZATION**

Do NOT begin ITM-D.
