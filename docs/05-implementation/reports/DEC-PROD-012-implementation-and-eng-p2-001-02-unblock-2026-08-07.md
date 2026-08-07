> **Title:** DEC-PROD-012 Implementation & ENG-P2-001-02 Unblock
> **Version:** 1.0 · **Status:** Implementation record — pending Founder-authorized merge · **Classification:** Working (execution-layer governance record)
> **Governing document:** [Decision Register `DEC-PROD-012`](../../00-governance/decisions/decision-register.md); Founder instruction "TASK — DEC-PROD-012 Implementation & ENG-P2-001-02 Unblock"
> **Source-of-truth path:** `docs/05-implementation/reports/DEC-PROD-012-implementation-and-eng-p2-001-02-unblock-2026-08-07.md`
> **Last controlled update:** 2026-08-07 (created)

# DEC-PROD-012 Implementation & ENG-P2-001-02 Unblock

**A documentation-governance implementation of the Founder's `DEC-PROD-012` decision (Option D — gender not collected at MVP). It closes `DEC-PROD-012`, removes the `gender` attribute from the MVP Customer Profile schema while preserving future additive expandability, re-scopes `EXT-LEG-001` to a future gender-collecting release, and removes the programme gate on `ENG-P2-001-02`. No application code, schema code, API, or runtime behaviour was changed. `ENG-P2-001-02` implementation was NOT begun.**

## 1. Founder Decision (authoritative, implemented verbatim)

For the MVP, customer gender shall not be collected. The `gender` attribute is removed from the MVP Customer Profile schema. The platform shall preserve the ability to introduce an optional gender attribute in a future governed release without breaking compatibility. No legal dependency is required for MVP implementation. `EXT-LEG-001` remains applicable only if a future governed release proposes collecting gender information. This decision closes `DEC-PROD-012`. (Founder-selected **Option (d)** from the Decision Register's four identified options.)

## 2. Repository Entry Gate

Isolated worktree `dec-prod-012-impl` off `origin/main` @ `160d098ff93d2e3df49aa23163900550ece13378` (the `ENG-P2-ARCH-CORR-005` / PR #74 merge). Branch `feat/dec-prod-012-implementation`. `git status --porcelain` empty; `origin/main...HEAD` divergence `0 0`; no staged/deleted/conflicted files; no merge/rebase/lock. The dirty primary checkout was not touched.

## 3. Implementation Approach

Documentation-governance only. Historical `/reports/` and `/evidence/` records were not edited (point-in-time; preserved). Living governing documents were amended in place using the repository's established strikethrough + dated-marker convention (prior text preserved, nothing deleted). One new report (this file) was created. TRD amendments follow the controlled-amendment + changes-log pattern.

## 4. Changes by Required Item

### Item 1 — DEC-PROD-012 closed
- **Decision Register** `DEC-PROD-012`: Status `OPEN_FOUNDER → CLOSED (approved & implemented, Option D)`; Final decision = the Option D wording (§1); Decision date `2026-08-07`; Approved by Founder; implementation reference = this report; `Current confirmed position` and `Blocks: profile schema freeze` marked closed/discharged; `Risks if unresolved` marked resolved.
- **Founder Decision Agenda** item **D7**: marked **RESOLVED 2026-08-07** (Founder chose to drop gender from the MVP).

### Item 2 — MVP gender requirement removed
- **TRD10 §10.6.2** (`customerProfiles`): the `gender?` enum line struck from the MVP schema with an inline `[REMOVED FROM MVP — DEC-PROD-012 Option D]` marker; a governance note added before the Progressive KYC Rule; header last-controlled-update updated.
- **TRD21 §21.11** (Gender Information): a governance note added — gender is not collected at MVP; the section governs only a future gender-collecting governed release; the existing requirements retained unchanged for that scenario. **§21.8** (Progressive Customer Profile) — gender marked deferred-from-MVP. Header updated.
- **PRD2 §5** (registration fields, Optional list): "Gender" struck with a `[Removed from MVP — DEC-PROD-012 Option D]` marker; header updated.
- **Consistency annotations (same decision):** TRD12 (sensitivity-example list), TRD22 (optional-early-profile-fields list), and the Commerce Knowledge Standard (Early Profile Completion list) each mark gender deferred-from-MVP so no governing document still presents gender as an MVP-collected profile field; each header updated.

### Item 3 — Future expandability preserved
Recorded in the TRD10 §10.6.2 governance note, the Decision Register closure text, TRD21 §21.11, and this report: a future optional gender attribute may be reintroduced **additively (backwards-compatible)** under a **separate governed decision** (with the legal/cultural input `EXT-LEG-001` covers, if that release proposes collecting gender).

### Item 4 — EXT-LEG-001 re-scoped (not removed)
- **External Dependencies Register** `EXT-LEG-001`: the gender-advice portion now applies only to a future gender-collecting governed release; `DEC-PROD-012` removed from its `Blocks` field; `DEC-LEGAL-001`/`DEC-PROD-013` portions unchanged; the dependency is **retained** (`PENDING`, Phase 14 / pilot gate).

### Item 5 — ENG-P2-001-02 unblocked
- **Engineering Implementation Programme**: new dated `DEC-PROD-012 (2026-08-07)` status note; `ENG-P2-001` Status cell `Blocked → Partially implemented — -02 unblocked`; Blocking-Reason cell `remaining blocker: DEC-PROD-012 only` struck and replaced with the closure note; header updated.
- **Coding-Agent Prompt Register**: `ENG-P2-001` row status `Blocked → Partially implemented — -02 unblocked`; the tail "gated by DEC-PROD-012 (OPEN_FOUNDER)" struck and replaced with the closure note; header updated.
- **Master Delivery Workflow §17**: Phase 2 bullet and next-action bullet updated (no longer "Blocked pending DEC-PROD-012"; `-02` technically authorised to begin pending fresh Founder implementation authorization); §19 v1.2 version-history entry.
- **CDR-001**: §2 status table, §5 validation outcome, and a new §5 dated closure note; header updated.
- **ENG-P2-GATE-001**: a `[SUPERSEDED IN PART — DEC-PROD-012 closure]` banner recording that the one residual gender-field gate is discharged by omission.
- **ENG-P2-001-PLAN-001**: §10 Ambiguity-2 "Fully resolved 2026-08-07" note; §12 status-table `-02` row updated.

All record: `ENG-P2-001-02` is **no longer decision-blocked** and is **technically authorised to begin, pending a fresh Founder implementation authorization**. Authentication, ITM, and the future `ENG-P2-001` three-concern engineering-design decomposition remain separately governed and **unauthorised**. RTM Finding F11 remains **Founder-approved deferred** work.

### Item 6 — Existing boundaries preserved
No change to Authentication scope, ITM scope, Identity architecture, Progressive KYC, Privacy architecture, or Customer Profile beyond the gender decision.

## 5. Deliberately Left (flagged, not changed)

The illustrative comment in the merged `-05` file `functions/src/domains/identity/repositories/customerProfileDocument.ts` lists `gender` among example future `-02` fields. It is illustrative (not authoritative — TRD10 §10.6.2 is), and editing merged application code is outside this documentation-governance task's scope and boundaries ("do not modify runtime behaviour"; "limit changes to the minimum necessary"). A future `ENG-P2-001-02` implementation task will address it. Not modified here.

## 6. Files Modified / Created

**Modified (16):** `decision-register.md`; `founder-decision-agenda.md`; `external-dependencies-register.md`; `02-technical/trd/10-firestore-data-architecture.md`; `02-technical/trd/12-security-and-access-control.md`; `02-technical/trd/21-privacy-and-data-protection.md`; `02-technical/trd/22-mvp-implementation-and-delivery.md`; `03-standards/commerce-knowledge-standard.md`; `01-product/prd/02-customer-registration-and-identity.md`; `engineering-implementation-programme.md`; `coding-agent-prompt-register.md`; `11thonus-master-workflow.md`; `CDR-001-capability-delivery-roadmap.md`; `ENG-P2-GATE-001-dec-prod-012-scope-determination.md`; `ENG-P2-001-PLAN-001-customer-identity-decomposition-plan.md`; `documentation-changes-log.md` (Entry 080); `docs/changes/IMPLEMENTATION_CHANGES.md`.
**Created (1):** this report.

No code, Firestore Rules, index, configuration, dependency, or unrelated file changed.

## 7. Validation

| Check | Result |
|---|---|
| `pnpm format:check` | Unaffected — `.prettierignore` excludes `docs/` (governed baseline "never reformatted"); this task changed only `docs/`, so the check is not applied to the edited files and remains clean on the untouched baseline |
| Markdown links in edited docs resolve (770 links, automated) | Pass |
| No code file changed (documentation-only) | Confirmed via `git status` |
| `DEC-PROD-012` closed (Register + Agenda) | Pass |
| No MVP-scope documentation still requires gender | Pass (grep — remaining `gender` references are the removal markers, the future-additive notes, or the retained-for-future TRD21 §21.11 requirements) |
| Future expandability preserved | Pass (TRD10 note; Register; TRD21) |
| `EXT-LEG-001` no longer blocks MVP; retained | Pass |
| `ENG-P2-001-02` no longer blocked | Pass (Programme, Prompt Register, Master Workflow, CDR-001, GATE-001, PLAN-001) |
| Authentication / ITM remain unauthorised | Pass (unchanged) |
| Cross-document consistency | Pass |
| No unrelated change | Pass |

## 8. Programme Position After This Task

- **Phase 0 & Phase 1:** Complete.
- **Phase 2 (Capability 2 — Customer Identity):** partially implemented. `ENG-P2-001-01`,`-03`–`-10` merged (nine of ten identity child packages). `DEC-PROD-012` **CLOSED**. `ENG-P2-001-02` (Customer Profile) is **no longer blocked** and is **technically authorised to begin, pending a fresh Founder implementation authorization**. `ENG-P2-004` not started.
- **Unauthorised / separately governed:** Authentication, ITM, and the `ENG-P2-001` three-concern decomposition.
- **Deferred:** RTM Finding F11.

## 9. Risks / Rollback

- **Risks:** none introduced. Documentation only; no code, data, deployment, or live configuration affected. The register's standing "schema churn" risk is now resolved for MVP (gender omitted; future re-add is additive).
- **Rollback:** `git revert` of this task's commit, or discard the branch — not yet merged. Purely documentation.

## 10. Dependencies / Configuration

Dependencies added: none. Configuration changes: none.

## 11. PR

See the completion report for PR number, branch, head SHA, mergeability, and CI status (recorded after the PR is opened). No merge without fresh Founder authorization.
