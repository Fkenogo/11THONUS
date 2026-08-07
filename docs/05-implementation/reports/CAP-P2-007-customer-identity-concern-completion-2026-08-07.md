# CAP-P2-007 — Customer Identity Concern Completion (Implementation & Assessment Report)

> **Title:** CAP-P2-007 — Customer Identity Concern Completion
> **Version:** 1.0 · **Status:** Implementation + review + concern-completion assessment · **Classification:** Working (implementation report)
> **Governing document:** 11thONUS Platform Constitution; Engineering Governance Charter; [Definition of Done](../../06-engineering-governance/definition-of-done.md)
> **Source-of-truth path:** `docs/05-implementation/reports/CAP-P2-007-customer-identity-concern-completion-2026-08-07.md`
> **Last controlled update:** 2026-08-07 (`CAP-P2-007` — created)

**Scope.** Complete the two — and only two — remaining Customer Identity concern-completion activities recorded in [`CDR-001` §5](../roadmap/CDR-001-capability-delivery-roadmap.md#capability-2--customer-identity) / [`CAP-P2-006`](CAP-P2-006-concern-completion-policy-and-customer-identity-reassessment-2026-08-07.md): (1) wire `ENG-P2-001-02`'s Customer Profile fields into `ENG-P2-001-05`'s `customerProfiles` persistence converter; (2) provide DoD §2.6 Technical-Review coverage for `ENG-P2-001-02` (`DEC-GOV-009` / G1). No scope beyond the authorised Customer Identity boundary. No Authentication, ITM, `ENG-P2-004`, deployment, Manual QA, RTM F11, or Capability 2 closure.

## 1. Repository State
- **Entry SHA / branch:** `origin/main` @ `b3b66766437729f8ff2431dae607d85a73540ee3`; isolated worktree `cap-p2-007`, branch `feat/eng-p2-001-05-customer-profile-persistence`; `0 0` divergence at entry; clean tree; dirty primary checkout untouched (read-only).
- **Final SHA / PR / CI:** recorded in the changes-log entry and the completion report delivered in chat (commit SHA, PR number, CI conclusion). PR is **not merged** — awaits fresh Founder authorization.

## 2. Pre-Implementation Analysis
- **Remaining work:** exactly the two recorded items above — no other concern-completion item outstanding (`CAP-P2-006`).
- **Persistence strategy:** TRD10 §10.6.2 defines a **flat** `customerProfiles` document with `consentVersions.acceptedAt: Timestamp`. `-02` already owns field validation and produces/consumes a plain `CustomerProfileFields` object (`Date`-based) via `serializeCustomerProfileFields`/`deserializeCustomerProfileFields`. The converter's only added responsibility is the Firestore `Date↔Timestamp` mapping for `acceptedAt` and carrying those fields on the persisted type — delegating all validation back to `-02`. Same `toTimestampLike`/`fromTimestampLike` cast convention as `userDocument.ts`. No new repository, no transaction change, no schema redesign; profile fields optional (shell-document behaviour preserved).
- **Review strategy:** review `-02` (+ the new wiring) against the current authoritative architecture using the existing review-record mechanism (findings-only), recorded at [`ENG-P2-001-02` Architecture / Technical Review](ENG-P2-001-02-architecture-technical-review-2026-08-07.md).

## 3. Files Modified
| File | Change |
|---|---|
| `functions/src/domains/identity/repositories/customerProfileDocument.ts` | Added `CustomerProfileFieldsDocument` type; extended `CustomerProfileDocument` with the optional `-02` profile fields; added `toCustomerProfileFields`/`fromCustomerProfileFields` (+ `toTimestampLike`/`fromTimestampLike` boundary helpers); doc-comment wiring note. |
| `functions/src/domains/identity/repositories/customerProfileDocument.test.ts` | Added 7 converter tests (map/omit/round-trip/malformed/defensive Date). |
| `docs/05-implementation/reports/ENG-P2-001-02-architecture-technical-review-2026-08-07.md` | New review record (DoD §2.6 coverage, G1). |
| `docs/05-implementation/reports/CAP-P2-007-...-2026-08-07.md` | This report. |
| `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` | §5 concern-status note updated (two items delivered in the CAP-P2-007 PR; status realized on merge). |
| `docs/05-implementation/change-tracking/engineering-implementation-programme.md`; `docs/05-implementation/11thonus-master-workflow.md`; `docs/00-governance/documentation-changes-log.md`; `docs/changes/IMPLEMENTATION_CHANGES.md` | Narrow traceability updates. |

## 4. Code Diff Summary
`toCustomerProfileFields(profile)` calls `-02`'s `serializeCustomerProfileFields` and maps `consentVersions.acceptedAt` `Date → Timestamp` (cast convention). `fromCustomerProfileFields(raw, binding)` maps `acceptedAt` `Timestamp → Date` (tolerating an already-hydrated `Date`) then delegates to `-02`'s `deserializeCustomerProfileFields` — no validation added in the converter. The persisted `CustomerProfileDocument` type now accurately reflects TRD10 §10.6.2 (profile fields optional, matching the shell-before-profile lifecycle). No `gender` can ever be emitted (delegated serializer guarantees it).

## 5. Architecture Review
Recorded at [`ENG-P2-001-02` Architecture / Technical Review](ENG-P2-001-02-architecture-technical-review-2026-08-07.md). Result: **PASS — no open corrections.** All six required determinations pass: implementation matches architecture; persistence integration matches architecture; privacy (PR-005) satisfied and no read surface opened; consistent with TRD10 §10.6.2; `DEC-PROD-012` correctly implemented (no gender); error taxonomy unchanged (14 categories). Provides DoD §2.6 coverage (G1). No corrections.

## 6. Customer Identity Concern Assessment
Assessed against the authoritative concern-completion criteria (`CDR-001` §5, per `DEC-GOV-008`/`-009`/`-010`): DoD §2.1–2.5, 2.7, 2.11, 2.12 **plus** §2.6 (G1) **plus** the concern's own persistence delivery; §2.8–2.10 are Not Applicable at concern level (G2).

| Criterion | Status | Evidence |
|---|---|---|
| §2.1 Acceptance criteria met | Satisfied | The two recorded items implemented; no scope expansion. |
| §2.2 Required tests passed | Satisfied | 427/427 functions tests (was 420; +7 converter tests). |
| §2.3 Local Validation actually run | Satisfied | typecheck, `eslint .`, `prettier --check .`, `vitest run`, `pnpm build` (web+functions) — all clean. |
| §2.4 Implementation Report produced | Satisfied | This report + the review record. |
| §2.5 Changes-tracking updated | Satisfied | Changes-log Entry 087; `IMPLEMENTATION_CHANGES.md`. |
| §2.6 Technical Review Approved (G1) | Satisfied (finalizes at merge) | `-01`,`-03`–`-10` covered by Architecture Reviews; **`-02` now covered** by the CAP-P2-007 review (PASS, no open corrections). Final "Approved" realized at Founder merge. |
| §2.7 Committed & pushed | Satisfied on push | Delivered via the CAP-P2-007 PR. |
| §2.8–2.10 Deploy / Preview / Manual QA | Not Applicable at concern level (G2) | Classified to Capability Closure / Release / Production Readiness (`DEC-GOV-010`). |
| §2.11 No unrelated files modified | Satisfied | `git status` scope = the intended files only. |
| §2.12 Risk/rollback note accurate | Satisfied | §11–§12 below. |
| Concern persistence delivery | Satisfied | `-02` fields wired into `-05`'s `customerProfiles` converter. |
| RTM Finding F11 | Accepted deferred | Founder-approved deferred work (`CAP-P2-002`/`-006`). |

**All concern-completion criteria are met by the work delivered in the CAP-P2-007 PR**, with §2.6/§2.7 finalizing at Founder merge.

## 7. Final Status
**Customer Identity Implemented — Validation/Closure Pending.**

**Exact remaining blocker:** the CAP-P2-007 PR is **not yet merged**. Both concern-completion activities (persistence wiring; `-02` Technical-Review coverage) are complete and validated within the PR, and every concern-completion criterion is satisfied by the delivered work. Completion is *realized* — and the authoritative status may be updated to **Customer Identity Concern Complete** — only upon fresh Founder merge authorization and post-merge CI verification (consistent with the standing rule against self-merge and the established post-merge status-update discipline). No engineering blocker remains.

## 8. Validation
- **Compile:** `tsc --noEmit` clean. **Lint:** `eslint .` clean. **Format:** `prettier --check .` clean. **Tests:** functions 427/427 pass (55 files). **Build:** `pnpm build` — functions (tsc) + web (vite) succeed (pre-existing chunk-size advisory only). **Repository integrity:** `0 0` divergence; working-tree scope limited to intended files. **CI:** recorded post-push in the chat completion report.

## 9. Dependencies Added
**None.**

## 10. Configuration Changes
**None.**

## 11. Risks
- **Read-path activation (future, out of scope):** the persistence converter is a write/read-mapping boundary; no client read surface is opened (`customerProfiles` rules remain `write:false`). A future Customer Profile read API (separate work package) must define its own access rules — unchanged by this task.
- **`userId` naming (pre-existing, deferred):** `customerProfiles.userId` remains TRD10-inherited; rename deferred to `ENG-P2-001-NAMING-001`. Cosmetic; no code reads the wrong field.
- No new runtime, dependency, or config risk.

## 12. Rollback Instructions
Revert the two `functions/src/domains/identity/repositories/customerProfileDocument.{ts,test.ts}` changes (or `git revert` the CAP-P2-007 merge commit once merged). The converter additions are purely additive (new exported functions + optional type fields); reverting restores the prior shell-only converter with no data migration, because no production write path yet calls the new functions and no schema was changed on any live document.

## 13. Persistent Report
This document.

## 14. Final Gate
- **Customer Profile persistence complete:** Yes — `-02` fields wired into `-05`'s `customerProfiles` converter, validated.
- **`ENG-P2-001-02` review coverage complete:** Yes — recorded review, PASS, no open corrections (DoD §2.6 / G1).
- **Customer Identity satisfies all concern-completion criteria:** Yes — as delivered in the CAP-P2-007 PR (§2.6/§2.7 finalize at merge).
- **Customer Identity may now be declared Complete:** Not yet in the authoritative records — realized upon Founder merge + post-merge verification; declared status remains `Implemented — Validation/Closure Pending` until then.
- **Capability 2 remains open:** Yes — `Open — partially implemented; not closed`.
- **No Authentication / ITM / `ENG-P2-004` / deployment / Manual QA / RTM F11 work occurred:** Confirmed.
