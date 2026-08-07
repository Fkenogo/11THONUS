> **Title:** CAP-P2-006 — Concern Completion Policy Decision & Customer Identity Reassessment
> **Version:** 1.0 · **Status:** Governance-clarification & reassessment record — pending Founder-authorized merge · **Classification:** Working (execution-layer governance record)
> **Governing document:** [`DEC-GOV-009`/`DEC-GOV-010`](../../00-governance/decisions/decision-register.md); [Definition of Done](../../06-engineering-governance/definition-of-done.md); [`CDR-001` §5](../roadmap/CDR-001-capability-delivery-roadmap.md); `CAP-P2-005`
> **Source-of-truth path:** `docs/05-implementation/reports/CAP-P2-006-concern-completion-policy-and-customer-identity-reassessment-2026-08-07.md`
> **Last controlled update:** 2026-08-07 (`CAP-P2-006` — created)

# CAP-P2-006 — Concern Completion Policy & Customer Identity Reassessment

**Records the Founder's G1/G2 decisions (`DEC-GOV-009`/`DEC-GOV-010`), makes the concern-completion lifecycle classification explicit against the existing Definition of Done, and reassesses the Customer Identity concern. Governance-clarification only — no code, no persistence, no review execution, no closure. Persistence determination: required before concern completion, owner `ENG-P2-001-05`. Customer Identity status: `Implemented — Validation/Closure Pending`, with the next governed action now uniquely determinable.**

## 1. Repository State

- **Entry:** worktree `cap-p2-006` off `origin/main` @ `c80074038f9c410b26c96c93ccc1b0367cde1a1c` (CAP-P2-005 merged); branch `docs/cap-p2-006-concern-completion-policy`; `0 0`; clean; no locks. Dirty primary checkout untouched.
- **Final:** unchanged except the governance edits below; documentation-only; no code touched.

## 2. Founder Decisions Implemented

- **G1 — `DEC-GOV-009` (CONFIRMED):** the capability-level Architecture Review (+ Corrections) may satisfy DoD §2.6 (Technical Review) for constituent packages **within its baseline** where no new architectural decision followed; a per-package Technical Review is not automatically required. A package implemented **after** the applicable Architecture Review baseline needs its own review coverage before its concern may be declared complete. `ENG-P2-001-02` was implemented after `ENG-P2-ARCH-REVIEW-002` → requires review coverage. Review scope clarified only; DoD not weakened.
- **G2 — `DEC-GOV-010` (CONFIRMED):** DoD §2.8–2.10 (deployment, Preview Review, Manual QA) are **not** automatically required for Concern Completion where the concern delivers no deployable customer-facing surface; for a domain-layer concern these belong to Capability Closure / Release / Production Readiness. Not waived — reclassified to the appropriate lifecycle stage.

Both recorded verbatim in the Decision Register (existing mechanism; no new governance system).

## 3. Files Modified / Created

- **Created:** this report; `DEC-GOV-009` + `DEC-GOV-010` (Decision Register entries).
- **Modified:** `decision-register.md` (two decisions + header); `CDR-001-capability-delivery-roadmap.md` (§5 Concern-Completion lifecycle-classification note + header); `06-engineering-governance/definition-of-done.md` (bounded §2 application note — no criterion changed + header); `11thonus-master-workflow.md` (§17 next-action + heading); `documentation-changes-log.md` (Entry 086). No code, capability identifier, roadmap structure, or product/technical architecture changed.

## 4. Diff Summary

- Decision Register: `DEC-GOV-009`/`DEC-GOV-010` recorded with the authoritative wording, rationale, effective date (2026-08-07), affected controls, and implementation reference.
- `CDR-001` §5: a Concern-Completion lifecycle-classification block distinguishing **Concern Completion** (DoD §2.1–2.7, 2.11–2.12 + review coverage + concern-owned persistence), **Capability Closure**, and **Release/Production Readiness** (§2.8–2.10 + TRD19 §19.52 / TRD22 §22.45); Customer Identity's two remaining bounded concern-completion items recorded.
- Definition of Done: a `> Application note` after §2 clarifying application per G1/G2 — criteria unchanged.
- Master Workflow §17: next governed action updated to the bounded Customer-Identity concern-completion task; heading records the CAP-P2-006 update.

## 5. Concern Completion Criteria After Clarification

| DoD §2 item | Lifecycle stage (after G1/G2) |
|---|---|
| 1–5, 7, 11, 12 | **Concern Completion** |
| 6 (Technical Review) | **Concern Completion** — satisfied by capability-level Architecture Review for in-baseline packages (G1); post-baseline packages need own coverage |
| 8 (deployment), 9 (Preview Review), 10 (Manual Testing) | **Release / Production Readiness** for a domain-layer concern (G2) — not concern completion |
| Concern-owned persistence/data-layer delivery | **Concern Completion** — where an `ENG-P2-001` package owns it |
| Feature DoD (TRD19 §19.49) / Release Gates (§19.52) / MVP Exit (TRD22 §22.45) | **Feature / Release / Phase Readiness** — not concern completion |
| RTM traceability (F11) | **Accepted Deferred Work** |

Concern Completion remains distinct from Capability Closure (`DEC-GOV-008`), and Release/Production Readiness remains distinct from Concern Completion (`DEC-GOV-010`).

## 6. Customer Identity Reassessment (criterion-by-criterion)

| Criterion | Verdict | Evidence |
|---|---|---|
| DoD 1 Acceptance criteria | **Satisfied** | Ten child reports; merged |
| DoD 2 Required tests | **Satisfied** | 420/420 unit + emulator; CI green on `main` |
| DoD 3 Local validation | **Satisfied** | Reports + CI |
| DoD 4 Implementation report | **Satisfied** | Ten reports present |
| DoD 5 Changes-tracking | **Satisfied** | Changes-log + `IMPLEMENTATION_CHANGES` |
| DoD 6 Technical Review | **Satisfied for `-01`,`-03`–`-10`** (Architecture Reviews per G1); **`-02` Evidence Needed** | Review-001/002 baseline covered those; `-02` post-dates Review-002 |
| DoD 7 Committed & pushed | **Satisfied** | All ten merged |
| DoD 8 Deployed | **Not Applicable at Concern Level** (G2) | Domain-layer concern; no deployable surface |
| DoD 9 Preview Review | **Not Applicable at Concern Level** (G2) | No previewable surface |
| DoD 10 Manual Testing | **Not Applicable at Concern Level** (G2) | No customer flow at concern level |
| DoD 11 No unrelated files | **Satisfied** | Per package |
| DoD 12 Risk/rollback accurate | **Satisfied** | Reports carry accurate notes |
| Architecture/technical review coverage | **Satisfied except `-02`** | `-02` Evidence Needed |
| `ENG-P2-001-02` review status | **Evidence Needed** | Requires bounded review coverage (G1) |
| Persistence (profile fields) | **Not Satisfied — required, owner `-05`** | See §8 |
| Documentation currency | **Satisfied** | CDR-001/Programme/Master Workflow synchronised (CAP-P2-004/006) |
| RTM F11 | **Accepted Deferred** | Founder-approved |
| Deployment / Preview / Manual QA | **Not Applicable at Concern Level** (G2) | Deferred to Capability Closure / Release Readiness |

## 7. `ENG-P2-001-02` Review Requirement

Exactly one bounded item: **`ENG-P2-001-02` (Customer Profile) requires architecture/technical review coverage** because it was implemented after the `ENG-P2-ARCH-REVIEW-002` baseline (per G1). Not performed here (this task is governance clarification, not a review). The next bounded task must bring `-02` under review coverage — recorded as part of the next governed action; not silently declared reviewed.

## 8. Persistence Determination

**Persistence is required before Customer Identity Concern Completion.** Evidence: `ENG-P2-001-PLAN-001` §`-05` (Identity Persistence) — objective *"implement the Firestore-backed persistence layer for `-01`/**`-02`**/`-03`/`-04`'s domain models"*; scope names *"`users` and `customerProfiles` Firestore collections… converters."* So the `customerProfiles` persistence (including `-02`'s profile fields) is **owned by `ENG-P2-001-05`, a Customer Identity concern package**. `-05` was implemented before `-02` existed, so it persisted only the `customerProfiles` **shell** and deferred the profile fields as a sequencing artifact (`customerProfileDocument.ts` — "every other TRD10-listed profile field … is `-02` Customer Profile's own future scope and is never written by this converter"). The concern's own scope (PLAN-001 §In-scope) includes *"customer profile"* and *"identity data persistence."* → Ownership is **defined** (not undefined; not a Founder ownership decision), and profile-field persistence is a **required, bounded engineering task** (wire `-02`'s fields into `-05`'s `customerProfiles` converter). It is **not** "accepted deferred" in any governed sense — no record deferred it beyond the `-02`-not-yet-existing sequencing.

## 9. Customer Identity Status

**Customer Identity Implemented — Validation/Closure Pending.** All ten `ENG-P2-001` packages are implemented/merged/CI-green; DoD §2.8–2.10 are reclassified away from concern completion (G2); the only remaining concern-completion items — `-02` review coverage (G1) and profile-field persistence wiring (owner `-05`) — are **bounded, ownership-defined engineering/review tasks requiring no further Founder policy decision**. The concern is therefore not `Complete`, and this assessment does not (and the existing governance does not permit it to) record completion; a separate, Founder-authorized concern-completion task is recommended. The `CDR-001` §5 reporting status is unchanged (`Implemented — Validation/Closure Pending`).

## 10. Next Governed Action

**Uniquely determined:** a single bounded **Customer Identity concern-completion task** that (a) brings `ENG-P2-001-02` under architecture/technical review coverage (G1), and (b) wires `-02`'s Customer Profile fields into `ENG-P2-001-05`'s `customerProfiles` persistence converter (owner `-05`), with appropriate tests. On satisfaction of both (plus the already-met DoD concern items), a subsequent task may record Customer Identity concern completion. **This task does not begin that work; it awaits fresh Founder authorization.** No Founder policy decision remains outstanding for concern completion.

## 11. Validation Performed

Repository integrity (`git status` clean, `0 0`, entry `c800740`); G1/G2 formally recorded (`DEC-GOV-009`/`-010` CONFIRMED); DoD classification internally consistent; Concern Completion distinct from Capability Closure (`DEC-GOV-008`) and from Release/Production Readiness (`DEC-GOV-010`); `-02` review obligation identified; persistence ownership evidence-supported (`-05`); RTM F11 still accepted-deferred; Customer Identity status evidence-supported; no unrelated architecture/engineering change; links resolve; programme records synchronized (Decision Register ↔ CDR-001 §5 ↔ Master Workflow §17 ↔ DoD note); no duplicate source of truth (CDR-001 §5 remains the concern-status home).

## 12. Commands Executed (significant)

Read-only + doc edits: `git worktree add`; entry-gate `git fetch`/`rev-list`/`status`; `grep`/`sed`/`Read` across the DoD, PLAN-001 (`-05` scope), `customerProfileDocument.ts`, CDR-001, Decision Register, TRD19/TRD22, Master Workflow, the ten reports; python link-check; `git commit`/`push`; `gh pr create`. No build/test/code command.

## 13. Dependencies / Configuration

Dependencies added: none. Configuration changes: none.

## 14. Risks

- The remaining concern-completion work (—02 review + `-05` persistence wiring) is genuine engineering effort; until authorized/done, Customer Identity stays `Implemented — Validation/Closure Pending`.
- Persistence wiring extends the already-merged `-05` surface — a follow-on task must respect `-05`'s transactional/Rules patterns and `-02`'s domain contract; scoped carefully in the next task.

## 15. Rollback Instructions

`git revert` of this task's commit, or discard the branch — not yet merged. Removes `DEC-GOV-009`/`-010`, the CDR-001 §5 classification note, the DoD application note, the Master Workflow §17 update, and this report. Documentation-only; no data/deployment/config affected.

## 16. Markdown Report

This document.

## 17. Changes Tracking

`documentation-changes-log.md` Entry 086 (existing mechanism; no duplicate tracker).

## Final Gate

- **G1 resolved:** ✅ (`DEC-GOV-009`).
- **G2 resolved:** ✅ (`DEC-GOV-010`).
- **Concern-completion lifecycle classification clear:** ✅ (`CDR-001` §5 + DoD note).
- **`ENG-P2-001-02` review requirement clear:** ✅ — architecture/technical review coverage required (G1), not yet performed.
- **Persistence treatment clear:** ✅ — required before concern completion, owner `ENG-P2-001-05` (bounded engineering task).
- **Customer Identity concern status fully evidence-supported:** ✅ — `Implemented — Validation/Closure Pending`.
- **Next governed action uniquely determinable:** ✅ — the bounded Customer-Identity concern-completion task (—02 review + `-05` profile-field persistence), awaiting fresh Founder authorization.

Stop for Founder review. The next action is not begun without fresh Founder authorization.
