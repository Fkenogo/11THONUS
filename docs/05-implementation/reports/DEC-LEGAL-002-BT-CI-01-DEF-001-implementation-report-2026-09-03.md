> **Title:** CI-01 Founder Deferral — Recording of Miledge Ventures Africa Corporate Registration Dependency
> **Version:** 1.0 (2026-09-03) · **Status:** Working (governance record — controlled recording task) · **Classification:** Working (governance record)
> **Governing document:** [Decision Register](../../00-governance/decisions/decision-register.md) `DEC-LEGAL-002` (Status: `OPEN_LEGAL`, unchanged by this task)
> **Task:** `DEC-LEGAL-002-BT-CI-01-DEF-001`
> **Governs:** [Controlled Inputs Register](../../00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md), CI-01 row and new deferral narrative

# Recording strategy (stated before editing)

This is a pure governance-recording task, not drafting or resolution. CI-01 already lives in the Controlled Inputs Register (not the Decision Register — it is a Business-Terms-drafting input, not a `DEC-*` decision). Strategy: annotate CI-01's existing register row with a status marker (`OPEN — DEFERRED PENDING CORPORATE REGISTRATION EVIDENCE`) without altering its Classification (still "Required before Founder approval and required before legal approval" — unchanged, since the deferral does not weaken CI-01's gating force); add a narrative section immediately below the register table recording the Founder's direction verbatim in substance, the explicit non-inferences the Founder specified, the reopening trigger, and the blocked/not-blocked activity split already established by the whole-instrument reconciliation (PR #220); leave the living Core Business Terms document's Preamble bracket completely untouched (the deferral is recorded in the governance register that already tracks CI-01, not by editing the placeholder itself); do not touch the Decision Register, Drafting Traceability Matrix, or any clause text.

# 1. Entry state and base SHA

Primary worktree (`/Volumes/PRODUCTION/Projects/11THONUS`, branch `docs/dec-legal-002-bt-draft-007`) checked read-only (`git status --short`) — unrelated uncommitted `FD-COM-001` work confirmed present and unaltered. Isolated worktree created: `git worktree add /Volumes/PRODUCTION/Projects/11THONUS-worktrees/dec-legal-002-bt-ci-01-def-001 -b docs/dec-legal-002-bt-ci-01-def-001 origin/main`. Base SHA: `8404a3c36f24b562651b2290a736ace6fded2aea` (= `origin/main` HEAD = the PR #220 merge commit).

# 2. Existing CI-01 record before change

Controlled Inputs Register, v8.0, table row: `| CI-01 | Preamble | Operator's registered legal name, registration/company number, and registered address | **Required before Founder approval** and **required before legal approval** | Founder (must confirm the operating legal entity) and legal counsel (must confirm the entity is correctly named/registered for the jurisdiction(s) of operation) |` — no status field, no deferral note, no named intended operator. The Preamble itself carries `[CONTROLLED INPUT REQUIRED: operator's registered legal name, registration/company number, and registered address — not established in any reviewed authority; the operating legal entity for 11thONUS has not been recorded in the governance record reviewed for this task]`.

# 3. Files modified

- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md` (CI-01 row annotated; new deferral narrative section added; header version → 9.0)
- `docs/00-governance/documentation-changes-log.md` (new entry)
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-CI-01-DEF-001-implementation-report-2026-09-03.md` (this file, created)

**No edit to the living Core Business Terms instrument** — the Preamble bracket is unchanged, no clause text touched. No Decision Register or Drafting Traceability Matrix change.

# 4. Exact deferral wording/status recorded

`OPEN — DEFERRED PENDING CORPORATE REGISTRATION EVIDENCE`, recorded as a status annotation on CI-01's existing register row and stated in full in a new narrative section, together with the Founder's direction: *"Miledge Ventures Africa is the intended operating company for 11thONUS. Corporate registration is currently underway in Burundi, Uganda, Rwanda and Kenya. The exact registered legal entity that will contract with participating Businesses, together with its registration number and registered address, will be confirmed when the relevant corporate registration documents become available."* The narrative explicitly states, per the governing task's own list: no insertion of "Miledge Ventures Africa" as a verified contracting party; no choice among the four national registrations; no invented registration number, address, or corporate form; no inference from Rwanda governing law, Kigali/KIAC arbitration, product-management location, the Burundi pilot, or any other architectural fact.

# 5. Reopening trigger

Recorded verbatim: *"Receipt of appropriate Miledge Ventures Africa corporate registration evidence sufficient to establish the exact 11thONUS contracting entity, registered legal name, registration/company number and registered address. At that point a separately authorized task will verify the evidence, determine the correct contracting entity and insert the controlled Preamble values."* This task does not perform, and does not authorize, that future verification.

# 6. Activities still blocked by CI-01

Final approval of the complete Core Business Terms as a governed version; assigning/issuing the final governed Terms version where operator identity is required; making the Terms effective; production `platformConfig/businessTerms` configuration; production Business acceptance of the Terms; final Capability 3 closure. Unchanged from the whole-instrument reconciliation finding (PR #220) — this deferral does not weaken this list.

# 7. Activities not blocked by CI-01

Governance preparation work; engineering work unrelated to Terms activation; documentation/readiness work; resolution of other independent decisions (CI-05, `DEC-SUB-013`, `DEC-ID-005`, `DEC-LOY-009`, or any §27.8 reservation); testing or implementation work that does not represent the currently-incomplete Terms as final/effective/configured; progression of other capabilities/workstreams whose own governance gates are already satisfied independently of CI-01. This task does not authorize any specific such package — existing dependencies and gates apply on their own terms.

# 8. Next existing roadmap/workflow work that can proceed independently (identified, not started)

Read-only inspection of `CDR-001-capability-delivery-roadmap.md` §2 (Capability Status Summary, row 3, most recent update 2026-08-29) confirms: *"`ENG-P3-003` (Knowledge Studio) is Founder-dispositioned `DEC-CKS-002` as not launch-blocking, separately authorizable."* This is the clearest already-governed example of Capability-3-scoped work explicitly cleared of the Terms/CI-01/Capability-3-closure dependency chain — it requires its own fresh Founder authorization to *begin*, but that authorization does not depend on CI-01, Terms configuration, or Capability 3 closing. (By contrast, Capability 4's own roadmap entry states it depends on "Capabilities 2 and 3 (a customer and a business must both exist first)" — genuinely sequenced behind Capability 3's actual completion, not independent of it.) **This task does not start, authorize, or scope `ENG-P3-003` work — identification only, per the governing task's own instruction.**

# 9. Diff summary

`git diff --stat` on the Controlled Inputs Register: header (2 lines) + CI-01 row (1 line) + new narrative section (~20 lines) changed/added. No other file's content changed beyond the changes-log entry and this new report.

# 10. Commands executed

`git fetch origin`; `git log origin/main`; `git status --short` (primary worktree, read-only); `git worktree add ... origin/main`; `grep`/`sed` inspection of the Controlled Inputs Register and `CDR-001-capability-delivery-roadmap.md` (read-only); file edits via the editing toolchain; `git add`/`git commit`/`git push`; `gh pr create`.

# 11. Dependencies added

None.

# 12. Config/application changes

None. No `platformConfig/businessTerms` write, no effective date, no application/Firebase code touched.

# 13. Risks

Very low. Pure governance-recording change to a controlled-input register entry; no clause text, no status change to `DEC-LEGAL-002`/Capability 3/CI-05; no legal or corporate research performed; no entity chosen.

# 14. Rollback instructions

Revert this task's commit on its branch (or, once merged, on `main`) to restore the prior unstatused CI-01 row and remove the narrative section. No application state, database, or configuration was touched.

# 15. Markdown implementation report

This file: `docs/05-implementation/reports/DEC-LEGAL-002-BT-CI-01-DEF-001-implementation-report-2026-09-03.md`.

# 16. Persistent `.md` changes-log entry

`docs/00-governance/documentation-changes-log.md`, new entry (see PR).

# 17. Commit/PR/head SHA, CI and review status

To be recorded once this branch's PR is opened and CI/review complete (see accompanying task actions). Not self-merged.

# 18. Confirmation FD-COM-001 remained untouched

Confirmed. The primary worktree's unrelated uncommitted `FD-COM-001` changes were only read (`git status --short`) at task start to verify their presence and were never stashed, reset, committed, checked out over, or otherwise altered. All edits in this task were made in a fresh isolated worktree (`docs/dec-legal-002-bt-ci-01-def-001`), separate from the primary worktree and from every other worktree created in this task chain.

# 19. Founder next action

None required immediately — this is a recording task. When Miledge Ventures Africa corporate registration evidence for the intended contracting entity becomes available (in Burundi, Uganda, Rwanda, or Kenya), initiate the separately authorized reopening task described at §5 to verify the evidence, determine the correct contracting entity, and insert the controlled Preamble values, resolving CI-01. Independently, and not gated on that, the Founder may consider authorizing `ENG-P3-003` (Knowledge Studio) per its existing `DEC-CKS-002` disposition, since it does not depend on CI-01 or Terms activation (§8).

---

**Gate:** `CI-01 DEFERRED PENDING MILEDGE VENTURES AFRICA REGISTRATION EVIDENCE — FINAL BUSINESS TERMS ACTIVATION GATE PRESERVED — INDEPENDENT WORK MAY CONTINUE`
