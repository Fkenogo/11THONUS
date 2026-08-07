> **Title:** CAP-P2-004 — Concern-Level Completion Reporting (Founder Option C Implementation)
> **Version:** 1.0 · **Status:** Implementation record — pending Founder-authorized merge · **Classification:** Working (execution-layer governance record)
> **Governing document:** [`DEC-GOV-008`](../../00-governance/decisions/decision-register.md); [`CDR-001` §5](../roadmap/CDR-001-capability-delivery-roadmap.md); `CAP-P2-002`; `CAP-P2-003`; `DEC-IDENTITY-001`
> **Source-of-truth path:** `docs/05-implementation/reports/CAP-P2-004-concern-level-completion-reporting-2026-08-07.md`
> **Last controlled update:** 2026-08-07 (`CAP-P2-004` — created)

# CAP-P2-004 — Concern-Level Completion Reporting

**Implements the Founder-approved Option C (`DEC-GOV-008`): concern-level completion reporting within the unchanged Capability 2 boundary. Capability numbering, boundaries, engineering identifiers, and product/technical architecture are unchanged. Concern Completion does not constitute Capability closure. Reporting granularity only. This task also merged the two prior reviews (PR #77 CAP-P2-002, PR #78 CAP-P2-003), preserving both as historical evidence.**

## 1. Founder Decision (authoritative, implemented)

Capability numbering and boundaries remain unchanged. Capability 2 continues to comprise the customer-facing Customer Identity capability as presently defined. Customer Identity, Authentication, and Identity Trust Management (ITM) remain **architectural concerns** within that capability per `DEC-IDENTITY-001`. The programme introduces **concern-level completion reporting** so an individual concern's status/completion position can be recorded independently while the overall capability remains open. **Concern Completion does not constitute Capability closure**; capability closure continues to require the existing capability-level completion criteria. This refinement changes **reporting granularity only** — no new capabilities, no renumbering, no engineering-identifier change, no product-architecture change. ITM remains an internal architectural concern. Terminology preserved: `Concern`, `Concern Status`, `Concern-Level Reporting`, `Concern Completion` (no "sub-capability"/"sub-stream").

## 2. Merge Results (Stages 1 & 2)

- **PR #77 (CAP-P2-002):** pre-merge MERGEABLE/CLEAN, 0 unresolved threads, head CI success (`e4e8410`). Merge commit **`9d9f6a5bd4534172cae98769a58084b2730a4151`**; post-merge CI **success** (run 31188516343); `main` clean; sync `0 0`. CAP-P2-002 preserved as the merged authoritative validation record, NOT READY verdict intact.
- **PR #78 (CAP-P2-003):** conflicted with the updated `main` on the append-only Documentation Changes Log (both touched the header + top-entry insertion). **Synchronisation performed:** merged `origin/main` into the PR #78 branch; resolved the changes-log conflict by keeping the header at Entry 083 (newest) and preserving **both** entries in newest-first order (083 → 082 → 081 → 080); both review reports preserved; no substantive conclusion rewritten. Re-validated (links resolve) and pushed (sync merge commit `e0bada2`); CI re-ran green (run 31189140728). Squash-merge commit **`fd28c62df367c934d08caca3622855c3389a6d7f`**; post-merge CI **success** (run 31189446425); `main` clean; sync `0 0`. Both CAP-P2-002 and CAP-P2-003 preserved on `main`.

## 3. Repository Entry State (Stage 3 implementation)

Fresh worktree `cap-p2-004`, branch `docs/cap-p2-004-concern-level-reporting`, off `origin/main` @ **`fd28c62`** (both prior merges included); `0 0` divergence; clean; no locks. Dirty primary checkout untouched.

## 4. Pre-Change Analysis (findings)

- **Authoritative Capability 2 definition:** `CDR-001` §5 (+ §2 status summary).
- **Where status is reported:** `CDR-001` §2/§5 (primary); Master Delivery Workflow §17 (current position); Engineering Implementation Programme `ENG-P2-001` row (detail).
- **Existing status vocabulary can express concern progress** — statuses like `Complete`/`Partially implemented`/`Blocked`/`Implemented — pending review/merge`/`Not started`/`Unauthorised` were composed; **no new vocabulary/register invented**.
- **Minimum files:** `CDR-001` (single home of Concern Status — already owns the concern definitions); Decision Register (`DEC-GOV-008`, existing mechanism); brief cross-reference pointers in Master Workflow §17 and the Engineering Implementation Programme; bounded disposition markers on CAP-P2-002/003; changes-log; this report. No new programme authority created.
- **Concern-completion criteria:** **do not currently exist.** Per the task's Critical Completion Rule, only the reporting refinement is introduced; the Customer Identity concern is recorded at the strongest evidence-supported existing status (`Implemented — Validation/Closure Pending`), **not** `Complete`. Defining formal concern-completion criteria is a separate potential Founder decision — flagged, not assumed.

## 5. How Option C Was Recorded

`DEC-GOV-008` (Governance, **CONFIRMED**, 2026-08-07, Approved by Founder) in the Decision Register — the existing decision mechanism; no parallel decision artefact created. It records the authoritative wording (§1) and the resulting concern statuses.

## 6. Files Modified / Created

- **Created:** this report; `DEC-GOV-008` entry (Decision Register).
- **Modified:** `decision-register.md` (DEC-GOV-008 + header); `CDR-001-capability-delivery-roadmap.md` (§5 Concern Status block + §2 row + header); `11thonus-master-workflow.md` (§17 concern-status bullet + supersession markers); `engineering-implementation-programme.md` (cross-reference note); `CAP-P2-002-...md` + `CAP-P2-003-...md` (bounded disposition markers only — findings preserved); `documentation-changes-log.md` (Entry 084 + conflict-resolved during Stage 2). No code, capability identifier, roadmap structure, product/technical architecture, or FEF record changed.

## 7. Diff Summary

- **Decision Register:** new `DEC-GOV-008` recording Founder Option C (concern-level reporting; numbering/boundary unchanged; Concern Completion ≠ Capability closure; ITM internal-only; concern-completion criteria undefined). Header updated.
- **`CDR-001` §5:** new **Concern Status** block with the four statuses (below); the "Why no new top-level capability number" explanation and ITM-internal note are preserved. §2 Capability 2 row now shows concern-level status. Header updated.
- **Master Workflow §17:** a concern-status bullet (authoritative statuses referenced from `CDR-001`, not duplicated); bounded markers superseding the now-stale "`-02` pending authorization" wording (`-02` is merged).
- **Engineering Implementation Programme:** one cross-reference sentence pointing to `CDR-001` for concern statuses (no duplication).
- **CAP-P2-002 / CAP-P2-003:** bounded disposition markers pointing to `DEC-GOV-008`; original findings unchanged.

## 8. Resulting Capability Model

- **Capability 2 boundary:** unchanged — one customer-facing capability (Customer Identity + Authentication + ITM concerns + `ENG-P2-004`), positioned between Capability 1 and Capability 3.
- **Customer Identity concern:** `Implemented — Validation/Closure Pending`.
- **Authentication concern:** `Not started — Unauthorised`.
- **ITM concern:** `Not started — Unauthorised` (internal architectural concern; not a numbered customer capability).
- **Overall Capability 2:** `Open — partially implemented; not closed`.

## 9. Customer Identity Completion Assessment

**Status: `Implemented — Validation/Closure Pending`** (not `Complete`). Governing evidence: all ten `ENG-P2-001` child packages (`-01`–`-10`) implemented, TDD-tested, merged, CI-green. Outstanding concern-level matters (per `CAP-P2-002`): `ENG-P2-001-02` architecture/Technical Review; `-02` persistence wiring; programme/documentation currency (partly addressed by this task). RTM Finding F11 is Founder-approved deferred work. **Concern-level completion criteria are not defined in the repository**, so `Complete` cannot be evidence-supported and is not asserted; defining such criteria would be a separate Founder decision. Deployment/Manual QA and the Authentication/ITM concerns and `ENG-P2-004` are **capability-level** (not Customer-Identity-concern) matters.

## 10. Programme Consistency

`CDR-001` (§2/§5 concern statuses — authoritative), Master Delivery Workflow §17 (references `CDR-001`), Engineering Implementation Programme (references `CDR-001`), Decision Register (`DEC-GOV-008`), and current repository state are mutually consistent: all ten `ENG-P2-001` packages merged; Customer Identity concern `Implemented — Validation/Closure Pending`; Authentication/ITM unauthorised; Capability 2 open. No duplicate current-state authority introduced.

## 11. Validation

1. Capability numbering unchanged (0–8 intact). 2. Capability 2 boundary unchanged. 3. Customer Identity / Authentication / ITM reportable separately (CDR-001 §5). 4. Overall Capability 2 status independently visible. 5. Concern Completion explicitly stated as ≠ Capability closure. 6. ITM remains internal-only, not a customer capability. 7. No engineering identifier changed. 8. No product/technical architecture changed. 9. No duplicate programme authority (CDR-001 remains the single concern-status home). 10. Master Workflow / Programme / CDR-001 mutually consistent. 11. CAP-P2-002 & CAP-P2-003 historically intact (markers only). 12. Links resolve. 13. `docs/` is `.prettierignore`d (governed baseline) — `format:check` unaffected; documentation-only. 14. No unrelated files changed (`git status` documentation-only). No "sub-capability"/"sub-stream" terminology introduced.

## 12. Commands Executed (significant)

`gh pr view/merge` (#77, #78); `git worktree add`; `git merge origin/main` + manual conflict resolution on the changes-log; entry-gate `git fetch`/`rev-list`/`status`; `grep`/`sed`/`find`/`Read` across CDR-001, Decision Register, Master Workflow, Programme; python link-check; `git commit`/`push`; `gh pr create`. No build/test/code command (documentation-only).

## 13. Dependencies / Configuration

Dependencies added: none. Configuration changes: none.

## 14. Risks

- Concern-completion criteria remain undefined — the Customer Identity concern's exact `Complete` threshold is not yet governed (flagged; a future Founder decision). Until then `Implemented — Validation/Closure Pending` is the ceiling.
- Reporting-consistency risk if future updates change concern status in only one document — mitigated by making `CDR-001` §5 the single authoritative home and having others reference it.

## 15. Rollback Instructions

`git revert` of this task's commit, or discard the branch — not yet merged. Documentation-only; removes `DEC-GOV-008`, the CDR-001 Concern Status block, the Master Workflow/Programme pointers, the disposition markers, and this report. No data/deployment/config affected. (The Stage 1/2 merges of PR #77/#78 are already on `main` and independent of this refinement.)

## 16. PR

See the completion report for PR number, branch, head SHA, mergeability, and CI status. No merge without fresh Founder authorization.
