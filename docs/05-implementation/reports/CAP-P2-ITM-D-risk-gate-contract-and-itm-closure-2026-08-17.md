> **Title:** CAP-P2-ITM-D — Risk-Gate Contract, Integration Validation & ITM Closure — Implementation Report
> **Status:** Complete/merged (PR #117, merged as `54c93e9fbe13772a0689a24048699b83c5dbcd37`, 2026-08-17) — see §54 Independent Final Review, Merge & Closure
> **Governing document:** [ITM-DESIGN-001](../roadmap/ITM-DESIGN-001-identity-trust-management-architecture.md) v1.2, §9 (Risk-Gated Action Contract), §10 (Standard Participation Protection), §13 (Failure Model), §15 `ITM-D` row, §22
> **Prerequisites:** `CAP-P2-ITM-A` (merged PR #111/#112), `CAP-P2-ITM-B` (merged PR #113/#114), `CAP-P2-ITM-C` (merged PR #115/#116) — CI green

# CAP-P2-ITM-D — Risk-Gate Contract, Integration Validation & ITM Closure — Implementation Report

## 1. Entry `origin/main` SHA

`31a176a8ccbaacb9a0c154a9025ef0ecce1758fc` — verified via `git rev-parse origin/main`; matches "Merge pull request #116 from Fkenogo/docs/cap-p2-itm-c-closure-sync", the task's expected baseline exactly.

## 2. Clean worktree/branch

`.claude/worktrees/itm-d`, branch `feat/cap-p2-itm-d-risk-gate`, branched fresh from `origin/main` at `31a176a` via `git worktree add`. The primary worktree (branch `chore/eng-p1-001-closure`, pre-existing unrelated docs-only dirty state) was never reset, cleaned, stashed, rebased, or written to.

## 3. ITM-A/B/C prerequisite verification

- `git branch -a` / `gh pr list --state merged` confirmed `ITM-A` (PR #111 merged `eea8726`, PR #112 closure-sync merged), `ITM-B` (PR #113 merged `7fc7a77`, PR #114 closure-sync merged), `ITM-C` (PR #115 merged `e090d86`, PR #116 closure-sync merged). No `ITM-D` branch, worktree, or PR exists anywhere.
- `gh run list --branch main` confirmed post-merge CI `success` at `31a176a` (and at each prior ITM merge commit).
- `gh pr list --state open` confirmed only PR #34 open (unrelated, `ENG-P2-RES-ADMIN-003` post-decision sync).
- Capability 3 and G2: confirmed `Not started` (`ITM-DESIGN-001` §19/§20, `CDR-001`).
- Dirty primary worktree confirmed untouched throughout (no command was ever run against it).

No material state differed from the task's stated expectations — Phase A proceeded without a stop condition.

## 4. Codebase/design analysis (performed before writing code)

- **`ITM-DESIGN-001` §3/§9/§10/§13/§14/§15/§20/§22** — full re-read. §9.1 is explicit that the `riskRequirement` caller supplies is "an identifier declared by the calling action... not a raw trust-level comparison the caller invents ad hoc — the requirement vocabulary is ITM-owned and closed." §10 states the disallowed pattern verbatim (`if trustLevel < X → reject everything`) and that gating is opt-in at the action-definition level only. §13's failure table states the risk-gate contract is "a decision function, not an error-throwing gate."
- **ITM-C's merged contract** (`functions/src/domains/trust/services/effectiveTrustService.ts`, `derivation/types.ts`) — `getEffectiveTrust(db, customerIdentityId, now)` throws a `TrustDomainError` on failure (missing/malformed identity, malformed trust record, unsupported rule version, invalid time) and otherwise returns a bounded `EffectiveTrustResult` (`effectiveTrustLevel`, `ruleVersion`, `evaluatedAt`, bounded `basis`). A missing trust record is not a failure — ITM-C already returns `unverified` for it.
- **ITM-A's `trustLevel.ts`** — the closed 3-band enum plus `isAtLeastTrustLevel(level, minimum)`, already implementing the exact non-strict-inequality comparison ITM-D needs; reused directly rather than reimplemented.
- **`domains/permissions/evaluator/` + `domains/permissions/service/`** (`ENG-P2-004B`) — the closest existing precedent for a pure decision function fed by explicit, typed read-result unions, with the Firestore orchestrator supplying `now: Date` at call time. Adopted directly.
- **`domains/permissions/repositories/permissionBoundaryFixtureRepository.ts` + `service/touchPermissionBoundaryFixtureCommand.ts`** (`ENG-P2-004D`) — the existing, Founder-accepted precedent for proving a read-only decision contract end-to-end via a bounded internal synthetic fixture when no real production consumer exists yet. Mirrored directly for ITM-D's own fixture.
- **`functions/src/index.ts`** — inspected in full; confirmed zero `domains/trust` import exists anywhere, i.e. no Cloud Function currently calls any trust-domain code. This is the structural baseline the "no global wiring" boundary test asserts against.
- **Error taxonomy** (`shared/errors/errorCategories.ts`) — the closed 14-category set, reused unmodified; every ITM-D failure maps to `VALIDATION_FAILED` or propagates whatever category ITM-C itself already produced (`RESOURCE_NOT_FOUND`, `VALIDATION_FAILED`, `TEMPORARY_UNAVAILABLE`) — no new category.
- **Emulator test conventions** (`effectiveTrustService.emulator.test.ts`) — the `initializeApp`/`FIRESTORE_EMULATOR_HOST` guard/`beforeEach` collection-wipe/`seedCustomerIdentity` helper pattern, reused directly.

## 5. Implementation strategy (stated before implementation)

Add a `riskGate/` layer (pure, no Firestore, no `domains/identity`/`domains/permissions`/`domains/authentication` import — mirrors `domains/permissions/evaluator/`) containing the requirement-satisfaction comparison as a function of an explicit input object (a closed `riskRequirement` id plus an `EffectiveTrustReadResult` union modeling ITM-C's outcome), and a `services/checkRiskGateService.ts` orchestrator (mirrors `services/evaluatePermissionService.ts`/`effectiveTrustService.ts`) that calls ITM-C's unmodified `getEffectiveTrust`, catches its thrown error, and delegates to the pure function. Since no production risk-gated action exists yet, add a bounded internal fixture (mirroring `ENG-P2-004D`'s own precedent) proving explicit opt-in end-to-end, plus a structurally independent non-gated fixture proving standard participation stays unaffected. No change to any ITM-A/B/C file. No risk-gated action identifier, threshold, or Reward Engine logic invented.

## 6. ITM-D scope reconstruction

Implemented: `riskGate/riskRequirement.ts` (closed vocabulary), `riskGate/types.ts` (contracts), `riskGate/evaluateRiskGate.ts` (the pure decision function), `riskGate/riskGateDomainBoundary.test.ts` + `riskGate/evaluateRiskGate.test.ts` (tests), `services/checkRiskGateService.ts` (Firestore orchestrator) + its emulator test, `repositories/riskGateBoundaryFixtureRepository.ts`, `services/touchRiskGateBoundaryFixtureCommand.ts` (gated fixture), `services/touchStandardParticipationFixtureCommand.ts` (non-gated fixture), `services/riskGateBoundaryFixture.emulator.test.ts`, `services/riskGateStandardParticipationBoundary.test.ts` (static boundary proofs). Not implemented (by design, out of ITM-D's authorized scope): any production risk-gated action/caller, role/permission authorization, authentication, Reward Engine logic, new trust bands/signals, operator surfaces, trust regression.

## 7. Trust-gate architecture

`evaluateRiskGate(input: RiskGateEvaluationInput): RiskGateDecision` is pure — never touches Firestore, never imports `domains/identity`/`domains/permissions`/`domains/authentication`, never reads the wall clock (`now` is part of its input). `checkRiskGate(db, customerIdentityId, riskRequirement, now?)` is the read-only Firestore orchestrator: it calls ITM-C's `getEffectiveTrust`, catches any thrown `TrustDomainError` and converts it into the `EffectiveTrustReadResult` union, then calls the pure function — so `checkRiskGate` itself never throws, matching §13's "decision function, not an error-throwing gate."

## 8. Requirement contract

Three closed identifiers (`RISK_REQUIREMENTS` in `riskRequirement.ts`): `TRUST_UNVERIFIED_OR_ABOVE`, `TRUST_PROVISIONAL_OR_ABOVE`, `TRUST_ESTABLISHED_OR_ABOVE`, each mapped internally (never caller-supplied) to a minimum `TrustLevel`. No production risk-gated action identifier, redemption threshold, or value band was invented (`ITM-DESIGN-001` §14/§20; task Phase G) — the vocabulary is expressed directly against ITM-C's own closed band set, the smallest structure that satisfies §9.1's "closed, ITM-owned vocabulary" requirement without inventing product policy. Versioned via `RISK_REQUIREMENT_RULE_VERSION = 1`.

## 9. Effective-trust consumption

`checkRiskGateService.ts` calls ITM-C's unmodified `getEffectiveTrust` as the sole derivation authority — it never reads a persisted `trustLevel`, never re-derives trust from raw `signalState`, never re-implements the 30-day algorithm, and never overrides ITM-C's rule version. Verified structurally (no `firebase-admin`/`domains/identity` import in `riskGate/`, confirmed by `riskGateDomainBoundary.test.ts`) and by the emulator tests, which prove ITM-D's decisions track ITM-C's real derivation exactly (`cust-established`/`cust-provisional`/`cust-new` scenarios).

## 10. Requirement-comparison semantics

Non-strict `>=` via ITM-A's existing `isAtLeastTrustLevel` — equality satisfies (a `provisional` requirement is satisfied by `provisional` or `established`). Verified across all nine trust-level × requirement combinations (`evaluateRiskGate.test.ts`).

## 11. Rule-version consistency

`SUPPORTED_TRUST_RULE_VERSION` (currently ITM-C's own `CURRENT_TRUST_RULE_VERSION = 1`) is checked against the effective-trust result's `ruleVersion` before any comparison; a mismatch fails closed as `unavailable`/`UNSUPPORTED_TRUST_RULE_VERSION`/`VALIDATION_FAILED` rather than silently comparing across versions (task Phase O). At MVP, since ITM-C supports only one rule version, this path is exercised only by a synthetic test input (`evaluateRiskGate.test.ts`'s "unsupported effective-trust rule version" case) — it is nonetheless a real, load-bearing guard for the day a second ITM-C rule version exists.

## 12. Error/failure mapping

| ITM-D condition | Decision | Reason code | Error category |
|---|---|---|---|
| Sufficient trust | `sufficient` | `TRUST_SUFFICIENT` | — |
| Insufficient trust | `insufficient` | `TRUST_INSUFFICIENT` | — |
| Unknown/blank `riskRequirement` | `unavailable` | `UNKNOWN_RISK_REQUIREMENT` | `VALIDATION_FAILED` |
| Unsupported effective-trust rule version | `unavailable` | `UNSUPPORTED_TRUST_RULE_VERSION` | `VALIDATION_FAILED` |
| ITM-C read failure (missing/malformed identity, malformed trust record, transient failure, invalid time) | `unavailable` | `EFFECTIVE_TRUST_UNAVAILABLE` | propagated from ITM-C's own `TrustDomainError.category` |
| Missing trust record for a known identity | *(not an error — ITM-C already returns `unverified`)* | — | — |

No fifteenth error category was introduced. "Insufficient trust" (`TRUST_INSUFFICIENT`) is kept structurally distinct from `ENG-P2-004`'s own `AUTH_FORBIDDEN`/role-denial reason codes — ITM-D never returns `AUTH_FORBIDDEN` for anything, since that category belongs to role/permission denial, not trust insufficiency (task Phase J).

## 13. Standard-participation protection

Mechanically proven, not merely asserted:

- `riskGateStandardParticipationBoundary.test.ts` confirms `checkRiskGateService`/`riskGate/` are never imported by `functions/src/index.ts` (no global middleware, no automatic wrapping of commands).
- The same test confirms `checkRiskGateService` is referenced only from within `domains/trust` itself (its own gated fixture command and tests) — no production consumer is wired in.
- `touchStandardParticipationFixtureCommand.ts` has zero source-level dependency on the risk gate (grep-verified against its own file contents) — not merely a code path that happens not to call it.
- A repo-wide grep confirms no file outside `domains/trust` references `effectiveTrustLevel` at all, so the disallowed `if trustLevel < X → reject everything` pattern cannot exist anywhere else in the codebase.
- No default minimum trust level exists anywhere in `riskGate/` — every call must supply an explicit `riskRequirement`.

## 14. Test-fixture/harness strategy

Mirrors `ENG-P2-004D`'s `permissionBoundaryTestFixtures` precedent exactly. `repositories/riskGateBoundaryFixtureRepository.ts` defines two separate synthetic Firestore collections: `riskGateBoundaryTestFixtures` (mutated only via `touchRiskGateBoundaryFixtureCommand.ts`, which calls `checkRiskGate` first and only proceeds on a `"sufficient"` decision) and `standardParticipationTestFixtures` (mutated via `touchStandardParticipationFixtureCommand.ts`, which has no risk-gate dependency at all). Neither is a Cloud Function endpoint; neither is referenced outside this domain's own tests. No production risk-gated action identifier is minted.

## 15. ENG-P2-004 separation

`riskGate/` contains zero import of `domains/permissions` (verified by `riskGateDomainBoundary.test.ts`). `checkRiskGateService.ts`/the fixture commands never load `businessMemberships`, evaluate role templates, evaluate permission overrides, determine business authorization, or emit permission audit events — confirmed by direct code inspection (no such import or call exists anywhere in the ITM-D diff).

## 16. Authentication separation

`riskGate/` contains zero import of `domains/authentication` (same boundary test). `checkRiskGateService.ts` never verifies Firebase tokens, establishes sessions, authenticates users, links authentication references, or performs recovery proof — it consumes only an already-resolved `customerIdentityId` string, exactly like ITM-C's own `getEffectiveTrust`.

## 17. Audit/explainability contract

`RiskGateDecision` carries: `decision` (`sufficient`/`insufficient`/`unavailable`), `reasonCode` (closed set), `requiredTrustLevel`, `effectiveTrustLevel` (present only when trust was derivable), `ruleVersion`, `evaluatedAt`, and `errorCategory` (present only when `unavailable`). No raw evidence payload, no PII, no fraud probability, no operator-only diagnostic data — `EffectiveTrustResult.basis` (ITM-C's underlying evidence) is never forwarded. No new persisted audit system was created; `ITM-DESIGN-001` §22/`AD-ITM-4` does not require one for ITM-D.

## 18. Privacy result

Repo-wide grep of the ITM-D diff for email/phone/token/OTP/password/protected-attribute/fraud-score terms — none found. `evaluateRiskGate.test.ts` includes a direct assertion that the decision's serialized shape contains only the six documented fields and no email-shaped string.

## 19. Test matrix

17 pure unit tests (`evaluateRiskGate.test.ts`) covering all nine trust-level × requirement combinations, malformed/blank requirement (fails closed, no fallback to a lower requirement), effective-trust unavailable (propagates category), unsupported rule version, deterministic-output, purity (`evaluatedAt` from input, not wall clock), no-PII shape. 5 boundary tests (`riskGateDomainBoundary.test.ts`) confirming no Firestore/identity/permissions/authentication import and a locked export surface. 7 real-Firestore-emulator tests (`checkRiskGateService.emulator.test.ts`) proving the full stack against real ITM-A/B/C state: established/provisional/brand-new identities, missing identity, malformed requirement, recovery-only evidence never elevating trust, determinism. 4 real-Firestore-emulator fixture tests (`riskGateBoundaryFixture.emulator.test.ts`): sufficient → allowed + mutated; insufficient → denied + untouched; unknown identity → denied as unavailable + untouched; standard-participation fixture succeeds unconditionally with zero trust-domain state touched.

## 20. RED → GREEN evidence

`evaluateRiskGate.test.ts` was written and run against the not-yet-existing `./evaluateRiskGate` module first: `Error: Cannot find module './evaluateRiskGate' imported from .../evaluateRiskGate.test.ts` (genuine module-resolution RED, captured verbatim in this session). `evaluateRiskGate.ts` was then implemented and the same test file run again: 17/17 passed on the first full run. No retrospective RED was manufactured.

## 21. Files modified

**New files only — zero existing file modified:**
- `functions/src/domains/trust/riskGate/riskRequirement.ts`
- `functions/src/domains/trust/riskGate/types.ts`
- `functions/src/domains/trust/riskGate/evaluateRiskGate.ts`
- `functions/src/domains/trust/riskGate/evaluateRiskGate.test.ts`
- `functions/src/domains/trust/riskGate/riskGateDomainBoundary.test.ts`
- `functions/src/domains/trust/services/checkRiskGateService.ts`
- `functions/src/domains/trust/services/checkRiskGateService.emulator.test.ts`
- `functions/src/domains/trust/repositories/riskGateBoundaryFixtureRepository.ts`
- `functions/src/domains/trust/services/touchRiskGateBoundaryFixtureCommand.ts`
- `functions/src/domains/trust/services/touchStandardParticipationFixtureCommand.ts`
- `functions/src/domains/trust/services/riskGateBoundaryFixture.emulator.test.ts`
- `functions/src/domains/trust/services/riskGateStandardParticipationBoundary.test.ts`
- Plus this report and the traceability documents listed in §52.

## 22. Code diff summary

12 new source/test files under `functions/src/domains/trust/{riskGate,services,repositories}/`. No `ITM-A`/`ITM-B`/`ITM-C` file touched. No `functions/src/index.ts` change. No `firestore.rules`/`storage.rules`/config change.

## 23. Pure evaluation function

`riskGate/evaluateRiskGate.ts` — see §7/§10/§11.

## 24. Orchestration service

`services/checkRiskGateService.ts` — see §7/§9.

## 25. Integration fixture

`repositories/riskGateBoundaryFixtureRepository.ts` + `services/touchRiskGateBoundaryFixtureCommand.ts` + `services/touchStandardParticipationFixtureCommand.ts` — see §14.

## 26. ITM-A regression

`git diff origin/main..HEAD -- functions/src/domains/trust/models` — empty. Full `models/` test suite re-run green as part of the full functions suite (§28).

## 27. ITM-B regression

`git diff origin/main..HEAD -- functions/src/domains/trust/repositories/trustRecordRepository.ts functions/src/domains/trust/repositories/trustRecordDocument.ts functions/src/domains/trust/services/trustSignalIngestionService.ts functions/src/domains/trust/services/trustEventHandler.ts functions/src/domains/trust/services/trustSignalErrors.ts` — empty. `trustSignalIngestion.emulator.test.ts` re-run green.

## 28. ITM-C regression

`git diff origin/main..HEAD -- functions/src/domains/trust/derivation functions/src/domains/trust/services/effectiveTrustService.ts functions/src/domains/trust/services/effectiveTrustErrors.ts` — empty. `effectiveTrustService.emulator.test.ts` and `effectiveTrustService.independentReview.emulator.test.ts` re-run green.

## 29. ITM acceptance matrix

Reconstructed from `ITM-DESIGN-001` §15/§17's acceptance criteria, across ITM-A/B/C/D:

| Criterion (§) | ITM-A | ITM-B | ITM-C | ITM-D |
|---|---|---|---|---|
| Boundary consistency with `ENG-P2-ARCH-001` §8 (§3–§4) | PASS | PASS | PASS | PASS |
| No speculative field / no unjustified PII (§5) | PASS | PASS | N/A | PASS (no evidence payload forwarded) |
| Numeric-score model explicitly rejected (§6) | PASS | N/A | PASS | PASS (no score anywhere in `RiskGateDecision`) |
| Every threshold/weighting decision Founder-surfaced (§6, §18/§22) | PASS | N/A | PASS | N/A (no new threshold decision — reuses ITM-A's closed bands) |
| Signal model classifies every signal, no invented source (§7) | N/A | PASS | N/A | N/A |
| Risk-gate contract distinguished from `ENG-P2-004`, no circularity (§4, §9) | N/A | N/A | N/A | PASS |
| Standard participation provably protected (§10) | N/A | N/A | N/A | PASS |
| MVP scope bounded, Reward Engine policy deferred (§14) | PASS | PASS | PASS | PASS (no production caller wired) |
| Idempotent/commutative/replay-deterministic ingestion (§7.1) | N/A | PASS | N/A | N/A |
| Deterministic derivation, exact 30-day boundary semantics (§6.6.4) | N/A | N/A | PASS | N/A (consumed, not re-derived) |
| Recovery evidence strictly neutral (`AD-ITM-2`) | N/A | PASS | PASS | PASS (inherited, re-verified at integration level) |
| Monotonic non-decreasing, no regression (`AD-ITM-3`) | PASS (no mutation export) | PASS (append-only) | PASS (no downward path) | N/A (ITM-D never mutates trust) |
| No operator visibility surface (`AD-ITM-4`) | N/A | N/A | N/A | PASS |
| Deterministic, versioned, read-only decision (§9.1) | N/A | N/A | N/A | PASS |
| Fail-closed on malformed/unknown input (§13) | PASS | PASS | PASS | PASS |
| ITM concern completion evidence produced | N/A | N/A | N/A | PASS (this report + §30) |

No item was marked PASS without direct verification in this session; no unknown was converted to PASS.

## 30. ITM closure assessment

All sixteen matrix rows above are PASS or N/A (not applicable to that package's own scope) — no FAIL, no DEFERRED-BY-DESIGN item outstanding, no NOT-CURRENTLY-GOVERNED gap remains for ITM-A/B/C/D's own defined scope. **The ITM concern's design-and-implementation acceptance criteria are satisfied once ITM-D is Founder-reviewed and merged.** ITM concern-level status cannot be marked `Complete` by this report alone — merge is a Founder-owned action (§30's own governing rule, `CDR-001` `Concern Completion` convention) — but no further implementation work is identified as required for ITM `Complete` beyond ITM-D's own review/merge and the routine closure-sync recording task that follows every prior ITM package's own precedent (`ITM-A`/`ITM-B`/`ITM-C` each required one).

## 31. Capability-2 post-ITM position

Per `ITM-DESIGN-001` §19, once ITM (all four packages) is merged and closed: Customer Identity Complete, Authentication Complete, `ENG-P2-004` Complete, ITM Complete → the sequence proceeds to G2 (Deployment/Preview Review/Manual QA) as the next stage toward Capability 2 closure. **G2 is explicitly not executed by this task or this report.** Capability 2 itself remains `Open — partially implemented; not closed` regardless of ITM-D's outcome here.

## 32. Focused tests

`functions/src/domains/trust/riskGate/` suite: 22/22 (17 pure + 5 boundary).

## 33. Emulator tests

`checkRiskGateService.emulator.test.ts`: 7/7. `riskGateBoundaryFixture.emulator.test.ts`: 4/4. Full `emulators:validate`: 336/336 (see §34 for the one disclosed unrelated flake on the first run).

## 34. Full validation

- `npx vitest run` (functions, fast unit suite): **943/943** passed, 102 files.
- `pnpm --filter apps/web test`: **397/397** passed (untouched — no `apps/web` file changed).
- `pnpm typecheck` (repo-wide, both workspaces): clean.
- `pnpm lint` (repo-wide `eslint .`): clean.
- `pnpm format:check`: clean (after one `prettier --write` pass on 5 newly-authored files).
- `pnpm build` (repo-wide): clean, both workspaces built successfully.
- `pnpm emulators:validate` (`firebase emulators:exec` wrapping `pnpm --filter functions test:emulator`): first run **335/336** — one failure, `authorizeAndExecute.emulator.test.ts`'s pre-existing `ENG-P2-004D` concurrency test ("19b: two concurrent DIFFERENT-idempotency-key attempts... land"), a 5000ms-timeout Firestore-contention-retry test unrelated to this change (confirmed: file untouched by this diff, last modified by an unrelated `d5f05ed` commit). Re-run immediately after: **336/336**, confirming the failure was a pre-existing timing flake, not a regression introduced here.
- Secret/PII scan: `git diff` grepped for password/secret/api-key/token-literal/SSN/credit-card patterns — none found.

## 35. Review findings/dispositions

Self-reviewed against the full task specification (Phases A–Z) before requesting Founder review; no material finding requiring a fix. Codex/automated review status: not attempted in this session (task requires opening a PR and, per its own instruction, disclosing rather than waiting indefinitely if unavailable) — see §40/§42.

## 36. Remaining material findings

None identified.

## 37. Dependencies

None added — no `package.json` change in either workspace.

## 38. Config changes

None.

## 39. Firebase/Rules changes

None — `firestore.rules`/`storage.rules`/`firebase.json` untouched.

## 40. Deployment changes

None — no Cloud Function created, modified, or wired; `functions/src/index.ts` untouched.

## 41. PR number

[PR #117](https://github.com/Fkenogo/11THONUS/pull/117), branch `feat/cap-p2-itm-d-risk-gate`.

## 42. Final reviewed head

`9dc353609acdfc53c8cd932f4293cc38c17167f5`.

## 43. CI result

`SUCCESS` (run [32004436522](https://github.com/Fkenogo/11THONUS/actions/runs/32004436522), 3m42s) — Build, Lint, Test, Emulator Validation all green. `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`. No automated Codex/external review bot configured on this repository (`reviews: []`) — disclosed per this task's own instruction; this report's self-review (§35) and the full validation suite (§34) serve as the review gate pending Founder disposition.

## 44. ITM-D status

**Implemented, pending Founder review — not merged.**

## 45. ITM overall status

**Not complete** — ITM-A/B/C are `Complete/merged`; ITM-D awaits Founder review and merge, plus the routine closure-sync recording every prior ITM package required.

## 46. Capability 2 status

`Open — partially implemented; not closed` (unchanged by this task).

## 47. Capability 3 status

`Not started` (unchanged; not begun by this task).

## 48. G2 status

`Not started` (unchanged; not begun or executed by this task).

## 49. Dirty primary worktree

Confirmed untouched throughout — all work performed exclusively in the isolated `.claude/worktrees/itm-d` linked worktree.

## 50. Risks

- **No production risk-gated action exists yet**, so ITM-D's contract is validated only against its own governed internal fixture, not a real consumer — this is the explicitly authorized MVP scope (`ITM-DESIGN-001` §14/§15), not a gap; a future capability that defines the first real risk-gated action will be ITM-D's first real caller.
- **Rule-version-mismatch path is currently untestable against real ITM-C output** (ITM-C supports only one rule version today) — covered only by a synthetic unit-test input; low risk, since the guard is structurally simple and will become naturally testable the day ITM-C gains a second rule version.

## 51. Rollback

Entirely additive — 12 new files, zero modified application files. Reverting the PR's merge commit (once merged) fully removes ITM-D with no schema, no deployed resource, and no data to roll back.

## 52. Persistent implementation-report path / changes-tracking state

This report: `docs/05-implementation/reports/CAP-P2-ITM-D-risk-gate-contract-and-itm-closure-2026-08-17.md`. Traceability updated in: `docs/00-governance/documentation-changes-log.md` (Entry 122), `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` (§2 table row + header dated append), `docs/05-implementation/change-tracking/engineering-implementation-programme.md` (header dated append), `docs/changes/IMPLEMENTATION_CHANGES.md` (new `CAP-P2-ITM-D` entry).

---

## FINAL GATE (original submission)

**ITM-D READY FOR FOUNDER REVIEW/MERGE.**

Not self-merged. G2 not begun.

---

## §54. Independent Final Risk-Gate Review, Merge & ITM Closure (2026-08-17)

Per Founder task "CAP-P2-ITM-D — Independent Final Risk-Gate Review, Merge & ITM Closure."

### Entry verification

PR #117 confirmed `OPEN` at expected head `7fb9bf2766d6bf6f88d78090ad020ba320213651` exactly, zero later commits at review start, CI `SUCCESS` (3m42s/3m48s reruns), `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`, 2 commits. `origin/main` confirmed unchanged at `31a176a8ccbaacb9a0c154a9025ef0ecce1758fc` since the PR was cut. `ITM-A` (PR #111/#112), `ITM-B` (PR #113/#114), `ITM-C` (PR #115/#116) confirmed merged and, via `git diff origin/main...7fb9bf2 --stat` scoped to their own files, byte-identical — zero diff. Capability 3/G2 confirmed `Not started`. Only PR #34 (unrelated) open besides #117. Dirty primary worktree confirmed untouched throughout — all review work performed in a fresh linked worktree (`.claude/worktrees/itm-d-closure`).

### Requirement-vocabulary authority (Phase C)

Independently re-read `ITM-DESIGN-001` §9.1/§9.2 directly (not the prior implementation report). Answered the four required questions: (1) §9.1 explicitly authorizes ITM to own a closed requirement vocabulary — "the requirement vocabulary is ITM-owned and closed, analogous to the closed 14-category error taxonomy"; (2) the three identifiers (`TRUST_UNVERIFIED_OR_ABOVE`/`TRUST_PROVISIONAL_OR_ABOVE`/`TRUST_ESTABLISHED_OR_ABOVE`) map 1:1 onto the already Founder-countersigned `unverified`/`provisional`/`established` bands (`AD-ITM-1`) — no new band, threshold, or evidence category is introduced; (3) `RiskRequirementId` is a closed literal union validated by `isRiskRequirementId`, and `evaluateRiskGate`'s input type takes `riskRequirement: string` (never a numeric threshold or `TrustLevel` directly) — a caller cannot construct an ad hoc threshold; (4) the vocabulary is phrased purely as "what degree of trust is required" (`TRUST_X_OR_ABOVE`) with zero action/product semantics anywhere in its three identifiers. **No Founder decision required — the vocabulary does not exceed the approved design.**

### Product-policy separation (Phase D)

Repository-wide grep of the full ITM-D diff for `redemption`/`reward`/`ownership`/`fraud`/hardcoded value thresholds — the only matches are doc-comment references to `ITM-DESIGN-001`'s own illustrative examples (§14/§20), never encoded policy. No action identifier, redemption threshold, or value band exists anywhere in the implementation. **Confirmed: ITM-D decides only "does trust satisfy this ITM-owned requirement," never "which action needs which requirement."**

### Requirement truth table (Phase E)

Directly verified against `evaluateRiskGate.ts`: uses ITM-A's existing `isAtLeastTrustLevel` (non-strict `>=`, rank-based over the closed 3-band ordering) — exactly the nine-row truth table the task specifies, with no fourth semantic state and no hidden alternative ordering. Confirmed by direct code reading and by all nine dedicated unit-test cases passing.

### Unavailable fail-closed result (Phase F — primary security gate)

Traced every call seam: `evaluateRiskGate` returns `decision: "sufficient" | "insufficient" | "unavailable"` as a plain string union (no boolean coercion anywhere). The one production call site, `touchRiskGateBoundaryFixtureCommand.ts`, gates via `if (decision.decision !== "sufficient") { return denied }` — an **allow-list check** (only the affirmative case proceeds), not a deny-list check for `"insufficient"` alone — so `"unavailable"`, `"insufficient"`, and any hypothetical future value are all denied by construction, not by enumeration. `checkRiskGateService.ts`'s catch-all for a genuinely unexpected thrown-error shape also fails closed to `"unavailable"` rather than defaulting to `"sufficient"` or rethrowing past the contract boundary. No destructuring fallback, default value, or boolean conversion exists anywhere in the diff that could conflate `"unavailable"` with `"sufficient"`. Representing `unavailable` as a decision-state value (not a thrown failure) matches `ITM-DESIGN-001` §13's own explicit design choice ("a decision function, not an error-throwing gate") — **no redesign is warranted; this is the approved contract shape, correctly implemented.**

### Malformed/unknown requirements (Phase G)

`isRiskRequirementId` is checked **before** `minimumTrustLevelForRequirement` is ever called and before any Firestore read — an unknown or blank `riskRequirement` returns `unavailable`/`UNKNOWN_RISK_REQUIREMENT` immediately, with `requiredTrustLevel` left `undefined` (never resolved to a default). No code path exists that falls back to `TRUST_UNVERIFIED_OR_ABOVE` or any other requirement. Verified directly (both the "malformed" and dedicated "blank" unit tests) and via the emulator suite's "malformed risk requirement fails closed" test.

### ITM-C sole trust authority (Phase H)

`checkRiskGateService.ts` imports only `getEffectiveTrust` from `./effectiveTrustService` — no `trustRecordRepository`, no `customerIdentityRepository`, no raw Firestore read of `signalState` or `trustLevel` anywhere in the ITM-D diff. `riskGate/`'s own boundary test (`riskGateDomainBoundary.test.ts`) mechanically confirms zero `domains/identity` import. **ITM-C remains the sole effective-trust derivation authority — structurally, not by convention.**

### Recovery/provider neutrality (Phase I)

`evaluateRiskGate` reads only `effectiveTrust.result.effectiveTrustLevel` and `.ruleVersion` — never `.basis` (the field that would carry `hasSuccessfulAuthentication`/`accountAgeDays`), so recovery-event count, provider type, and authentication-event count cannot mathematically reach the decision. This session added three integration tests through `checkRiskGate` itself (not merely inherited from ITM-C's own suite) directly proving this: **provider type** (Google vs. Phone OTP identities with identical age/evidence → identical decisions), **event count** (one vs. three authentication events → identical decisions), and **stale persisted `trustLevel` cache** (forged `unverified` cache via ITM-B's own `ingestTrustEvidence`, still resolves to `established` at day 40). All three passed against the real Firebase Emulator Suite (committed `c31318f`, CI green). **No material finding — this closes a genuine, narrow test-coverage gap in the original submission (structural guarantee existed; direct integration-level proof did not) without any implementation change.**

### Standard-participation protection (Phase J)

Re-ran `riskGateStandardParticipationBoundary.test.ts` fresh: `checkRiskGateService`/`riskGate/` confirmed never imported by `functions/src/index.ts`; `checkRiskGateService` confirmed referenced only within `domains/trust` itself; `touchStandardParticipationFixtureCommand.ts` confirmed to have zero source-level dependency on the risk gate; a repository-wide grep confirms no file outside `domains/trust` references `effectiveTrustLevel` at all. Independently re-verified `functions/src/index.ts` in full — zero trust-domain import of any kind exists in any Cloud Function. **No global trust middleware, registration hook, sign-in hook, session hook, or default platform trust requirement exists anywhere.**

### Test-fixture production isolation (Phase K)

`riskGateBoundaryTestFixtures`/`standardParticipationTestFixtures` are synthetic Firestore collections never referenced by any Cloud Function trigger, `index.ts` export, or production domain repository. `touchRiskGateBoundaryFixtureCommand`/`touchStandardParticipationFixtureCommand` are plain exported functions with no `onCall`/`onRequest`/HTTP wiring — confirmed by the same `index.ts` inspection above (zero `domains/trust` import). No production action identifier was minted for either fixture. **No fixture-to-production leakage found.**

### `ENG-P2-004` separation (Phase L)

Repository-wide grep of the full ITM-D diff for `domains/permissions` found only doc-comment references to the pattern being mirrored — zero actual import. `checkRiskGateService.ts`/the fixture commands never reference `businessMemberships`, role templates, permission overrides, business-authorization decisions, or permission-audit events anywhere. **Confirmed: ITM-D does not replace or duplicate `ENG-P2-004`'s authority.**

### Authentication separation (Phase M)

Same grep for `domains/authentication` — zero actual import anywhere in the ITM-D diff (only doc-comment references). `checkRiskGateService.ts` consumes only an already-resolved `customerIdentityId` string; it never verifies a Firebase token, establishes a session, links a provider, or performs recovery. **Confirmed: Authentication remains an independent authority.**

### Result/explainability contract (Phase N)

`RiskGateDecision`'s six fields (`decision`, `reasonCode`, `requiredTrustLevel`, `effectiveTrustLevel`, `ruleVersion`, `evaluatedAt`, `errorCategory`) were independently re-inspected — no raw evidence, PII, token claim, fraud probability, customer-facing score, or operator diagnostic field exists in the type or is ever populated at runtime. `EffectiveTrustResult.basis` (ITM-C's underlying evidence) is never forwarded — confirmed both by type inspection and by the existing "no PII/credential material" unit-test assertion on the decision's exact serialized key set.

### Rule-version consistency (Phase O)

`SUPPORTED_TRUST_RULE_VERSION` (= ITM-C's own `CURRENT_TRUST_RULE_VERSION`) is checked against the derived result's `ruleVersion` before any comparison; a mismatch fails closed (`UNSUPPORTED_TRUST_RULE_VERSION`/`VALIDATION_FAILED`) rather than silently comparing. No speculative multi-version engine was built — the guard is a single explicit equality check, matching the task's "no speculative generic multi-version engine" instruction.

### Pure evaluator review (Phase P)

`evaluateRiskGate.ts` re-confirmed deterministic (no wall-clock read, `now` supplied by caller), framework-independent (no Firebase import), identity-repository-independent, permissions-independent, and Authentication-independent — all mechanically enforced by `riskGateDomainBoundary.test.ts`, re-run fresh in this review (5/5 pass). The "identical inputs produce identical output" unit test and the emulator-level determinism test both re-verified.

### Error taxonomy (Phase Q)

No fifteenth error category exists — every ITM-D failure maps to `VALIDATION_FAILED` or propagates a category ITM-C itself already produces (`RESOURCE_NOT_FOUND`, `VALIDATION_FAILED`, `TEMPORARY_UNAVAILABLE`). `TRUST_INSUFFICIENT` is a distinct reason code from `ENG-P2-004`'s `AUTH_FORBIDDEN`-family denial codes — ITM-D never returns `AUTH_FORBIDDEN` for any outcome, keeping trust-insufficiency and role-denial semantics structurally unblurred.

### Test adequacy (Phase R) / New tests added during review

All 25 matrix items independently checked. Items 1–13 and 18–25 were already directly covered by the original submission's 33 tests (17 pure + 5 boundary + 7 emulator + 4 fixture). Items 14/16/17 (stale-cache, provider-type, event-count non-influence) were previously provable only by structural argument plus ITM-C's own separate test suite, not by a test exercised directly through `checkRiskGate` itself — a genuine, narrow gap, not a defect. **Fixed by adding exactly three new integration tests** (`checkRiskGateService.emulator.test.ts`, committed `c31318f`) proving each scenario directly through the risk-gate contract; no implementation code was changed. Full new test count: 17 pure + 5 boundary + 10 emulator (`checkRiskGateService`) + 4 fixture emulator = **36 tests** for ITM-D.

### ITM-A/B/C regression (Phases S/23–25 of original report)

`git diff origin/main...c31318f --stat` scoped to every ITM-A/B/C file: empty. Full `domains/trust` unit suite (145/145) and the full repo-wide `emulators:validate` (336/336 confirmed at the original submission's head 7fb9bf2, 339/339 after this review's three additional tests) re-run clean.

### Review tooling (Phase X)

`gh pr view 117 --json reviews,reviewRequests` returned empty for both fields — confirmed no automated Codex/external review bot is configured on this repository. Disclosed per this task's own instruction; this independent review served as the merge gate.

### Full validation re-run (Phase W)

Functions unit suite: **943/943**. Web suite (untouched): **397/397**. `emulators:validate`: **336/336** confirmed at the original submission head `7fb9bf2` (fresh rerun, no residual flake), then **339/339** after this review added the three new integration tests (confirmed via the PR's own CI run on final head `c31318f`, `SUCCESS`, 3m48s). `tsc --noEmit`/build clean (both workspaces). `eslint .` clean. `prettier --check` clean (after one auto-format pass on the newly-added test file). Secret/PII scan of the full diff — none found.

### Merge

With all gates clean, PR #117 merged via `gh pr merge 117 --merge` as `54c93e9fbe13772a0689a24048699b83c5dbcd37`. Post-merge: `origin/main` confirmed at `54c93e9`; `c31318fbb84a930f4321cd01dee613b6c8c16b91` (final reviewed head) confirmed an ancestor via `git merge-base --is-ancestor`; post-merge CI (`main`, run `32006357967`) confirmed `SUCCESS` (3m41s).

### Final ITM acceptance matrix

Reconstructed from `ITM-DESIGN-001` §15's per-package acceptance-criteria column (not §17, which is the design-package's own, already-satisfied acceptance criteria) — independently, not trusting the original implementation report as authority:

| Criterion | ITM-A | ITM-B | ITM-C | ITM-D |
|---|---|---|---|---|
| Boundary consistency with `ENG-P2-ARCH-001` §8 (§3–§4) | PASS | PASS | PASS | PASS |
| No speculative field / no unjustified PII (§5) | PASS | PASS | N/A | PASS |
| Numeric-score model explicitly rejected (§6) | PASS | N/A | PASS | PASS |
| Every threshold/weighting decision Founder-surfaced (§6, §18/§22) | PASS | N/A | PASS | N/A (reuses ITM-A's already-Founder-approved bands; no new threshold) |
| Signal model classifies every signal, no invented source (§7) | N/A | PASS | N/A | N/A |
| Idempotent/commutative/replay-deterministic ingestion (§7.1) | N/A | PASS | N/A | N/A |
| Deterministic derivation, exact 30-day boundary semantics (§6.6.4) | N/A | N/A | PASS | N/A (consumed via `getEffectiveTrust`, not re-derived) |
| Recovery evidence strictly neutral (`AD-ITM-2`) | N/A | PASS | PASS | PASS (independently re-verified this review, §I above) |
| Monotonic non-decreasing, no regression (`AD-ITM-3`) | PASS | PASS | PASS | N/A (ITM-D never mutates trust) |
| No operator visibility surface (`AD-ITM-4`) | N/A | N/A | N/A | PASS |
| Risk-gate contract distinguished from `ENG-P2-004`, no circularity (§4, §9) | N/A | N/A | N/A | PASS |
| Standard participation provably protected (§10) | N/A | N/A | N/A | PASS |
| Deterministic, versioned, read-only decision (§9.1) | N/A | N/A | N/A | PASS |
| MVP scope bounded, Reward Engine policy deferred (§14) | PASS | PASS | PASS | PASS |
| Fail-closed on malformed/unknown input (§13) | PASS | PASS | PASS | PASS |
| Concern-closure report matches `DEC-GOV-009`/`-010` (§15 `ITM-D` row) | N/A | N/A | N/A | PASS — `DEC-GOV-009`: no new architectural decision was introduced after `ITM-DESIGN-001`'s own countersigned architecture/consistency review (§23), so a separate per-package Technical Review is not required; `DEC-GOV-010`: ITM-D has no deployable customer-facing surface, so deployment/Preview/Manual QA are correctly deferred to Capability Closure/G2, not required at concern-completion level |

No item was converted from unknown to PASS; every row was independently re-derived from the design text and the merged code, not from the original implementation report.

### ITM closure assessment

All sixteen matrix rows are PASS or N/A — zero FAIL, zero unresolved DEFERRED-BY-DESIGN item, zero NOT-CURRENTLY-GOVERNED gap. `ITM-A` = Complete/merged. `ITM-B` = Complete/merged. `ITM-C` = Complete/merged. `ITM-D` = **Complete/merged** (this review). Every `AD-ITM-1`–`AD-ITM-4` disposition independently re-confirmed respected (band model, recovery-neutral, no-regression, no-operator-visibility). No outstanding Founder ITM decision remains (`FDR-1`–`FDR-4` all resolved, `ITM-DESIGN-001` §22). No unresolved material finding (the one narrow test-coverage gap found in this review was fixed with additive tests, no implementation change, before merge).

**ITM concern-level status: `Complete`.**

### Capability-2 post-ITM position

Per `ITM-DESIGN-001` §19: Customer Identity `Complete`, Authentication `Complete`, `ENG-P2-004` `Complete`, ITM now `Complete`. Per this task's own explicit instruction, Capability 2 is **not** marked `Complete` by this review. **Expected next state:** `Capability 2 = Open — concerns complete, capability-level closure gates pending`. The next governed activity is a **PRE-G2 / Capability-2 closure-readiness assessment** — not executed by this task. G2/Release Readiness itself remains **not begun**.

### Files (this closure-sync task)

`CDR-001-capability-delivery-roadmap.md` (§2 table row + header dated append), `documentation-changes-log.md` (Entry 123), `engineering-implementation-programme.md` (header dated append), `IMPLEMENTATION_CHANGES.md` (new closure entry), this §54 section, and — committed to PR #117 itself before merge — three new integration tests (`checkRiskGateService.emulator.test.ts`, no implementation code changed).

### Dependencies / config / Firebase / Rules / deployment changes

None. No `package.json` change. No `firestore.rules`/`storage.rules`/`firebase.json` change. No Cloud Function created or wired.

### Rollback

`git revert` the merge commit `54c93e9` — the underlying change is entirely additive (new files only, plus this closure-sync commit's own additive test file and documentation); no schema, no deployed resource, no data to roll back.

### Dirty primary worktree

Confirmed untouched throughout — all review work performed in the isolated `.claude/worktrees/itm-d-closure` linked worktree, fresh from the post-merge `origin/main`.

---

## FINAL GATE

**ITM-D MERGED AND CLOSED — ITM CONCERN COMPLETE; CAPABILITY 2 PRE-G2 ASSESSMENT REQUIRED.**

G2 not begun. Capability 2 not marked Complete.
