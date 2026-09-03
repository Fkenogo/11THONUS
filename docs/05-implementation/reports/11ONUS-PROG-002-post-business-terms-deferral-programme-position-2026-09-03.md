> **Title:** 11ONUS-PROG-002 — Post-Business-Terms-Deferral Programme Position and Next Delivery Recommendation
> **Status:** Assessment only. No programme state changed. No engineering package started or authorized to begin by this task.
> **Classification:** Working (governance/programme-position record)

# 11ONUS-PROG-002 — Post-Business-Terms-Deferral Programme Position and Next Delivery Recommendation

## 1. Entry repository state and base SHA

- **Base:** `origin/main` at `939a07d4ca23207e81c18f7a0034934feb3c8011` (`DEC-LEGAL-002-BT-CI-01-DEF-001` — CI-01 deferral record), confirmed by `git rev-parse origin/main` before any work began.
- **Worktree:** fresh, isolated, detached-HEAD worktree created from this SHA — the primary working directory's unrelated, uncommitted `FD-COM-001` commercial-model work was never opened, read, or touched by this task.
- **PR #221:** confirmed merged at this exact SHA (`git log origin/main -1`).

## 2. Authoritative documents inspected

- `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md` (Capability Delivery Roadmap — full read)
- `docs/05-implementation/11thonus-master-workflow.md` (Master Delivery Workflow — full read)
- `docs/00-governance/decisions/decision-register.md` (Decision Register — targeted full-entry reads: `DEC-LEGAL-002`, `DEC-SUB-013`, `DEC-DATA-005`, `DEC-TECH-008`)
- `docs/05-implementation/change-tracking/engineering-implementation-programme.md` (Engineering Implementation Programme — Phase 3 profile and work-package table)
- `docs/05-implementation/change-tracking/coding-agent-prompt-register.md` (Coding-Agent Prompt Register — §4/§5)
- `docs/00-governance/canonical-reference.md` (full read)
- `docs/00-governance/documentation-changes-log.md` (most recent ~20 entries, Entries 135–155)
- `docs/05-implementation/roadmap/ENG-P3-001-DESIGN-001-commerce-knowledge-architecture-delivery-design.md` §26–29 (Founder dispositions `DEC-CKS-001`/`DEC-CKS-002`)
- `docs/05-implementation/reports/eng-p3-002-closure-001-capability-3-readiness-report-2026-08-29.md`
- `docs/05-implementation/reports/DEC-LEGAL-002-BT-CI-01-DEF-001-implementation-report-2026-09-03.md` (the immediately preceding task's own report, §8/§19)
- `docs/00-governance/decisions/evidence/DEC-LEGAL-002-BT-DRAFT-001-controlled-inputs-register-2026-08-30.md` (Controlled Inputs Register — CI-01/CI-05)

All conclusions below use only merged `origin/main` authority. No unmerged material from the primary worktree's `FD-COM-001` work was consulted.

## 3. Current Capability 3 state

Capability 3 (Business Identity), per CDR-001 §2, last updated 2026-08-29 (`ENG-P3-002-CORR-EST-IDEMP-001-REVIEW`):

> **`Open — engineering work packages complete; blocked on governed Terms-content configuration (`DEC-LEGAL-002`, `OPEN_LEGAL`)`**

Every named major work package is `Complete`/`Closed`: `ENG-P2-002` (business identity), `ENG-P2-003` (staff identity), `ENG-P2-004` (role/permission resolution), `ENG-P3-001` (Commerce Knowledge seed data), `ENG-P3-002` (business onboarding flow — Founder-approved closure 2026-08-29). `ENG-P3-003` (Knowledge Studio MVP) alone remains `Not started`, and is separately Founder-dispositioned (`DEC-CKS-002`, 2026-08-20) as **not launch-blocking, separately authorizable** — its non-completion does not hold Capability 3 open.

The actual reason Capability 3 cannot close: `functions/src/domains/business/services/businessLifecycleCommand.ts`'s `assertCurrentBusinessTermsAccepted` fails closed (`businessTermsConfigurationUnavailableError()`) whenever no current Terms version is configured — confirmed by direct code inspection recorded in the same CDR-001 entry. No Terms version exists yet (`DEC-LEGAL-002 = OPEN_LEGAL`), so no business can complete onboarding end-to-end, so Capability 3's own customer-facing completion criterion cannot be satisfied, regardless of `ENG-P3-003`.

**Note (disclosed, not corrected by this task):** the Engineering Implementation Programme's own Phase-3 work-package table (last synced 2026-08-22) still shows `ENG-P3-002` as `Open`/blocked and the phase itself as `Blocked — depends on Phase 2`, conflicting with CDR-001's 2026-08-29 `Closed` status for the same package. The Master Workflow (last controlled update 2026-07-26) and the Coding-Agent Prompt Register (last controlled update 2026-08-07, showing 42/47 packages `Blocked`) are further out of date still. This is a pre-existing, previously disclosed staleness risk (flagged as an unmitigated known limitation as far back as the original `ENG-PROG-001` report, 2026-07-29) — not a new finding of this task, and not corrected here per §9 below (any correction to these trackers is itself a documentation-changes action outside this assessment's authorized scope, flagged for Founder attention at §14/§26).

## 4. CI-01 parked-dependency interpretation

CI-01 (operator's registered legal name, registration/company number, registered address — a Controlled Inputs Register item, not a `DEC-*` Decision Register entry) is `OPEN — DEFERRED PENDING CORPORATE REGISTRATION EVIDENCE` per Entry 155 (2026-09-03). Per the whole-instrument reconciliation (`DEC-LEGAL-002-BT-WHOLE-RECON-001`, Entry 153), CI-01 is **the sole unconditional Class A blocker** to final Core Business Terms approval; the finite closure path is: Founder supplies operator identity → legal counsel confirms entity → bounded Preamble-insertion task → Founder final approval → `DEC-LEGAL-002` closed → version/effective-date assigned → `platformConfig/businessTerms` configured → live onboarding-acceptance verification → Capability 3 closes.

Treated here strictly as an **external, parked dependency**, not a reason to halt the programme: CI-01's resolution timeline depends on external corporate-registration processes in four jurisdictions, outside engineering or documentation control. Everything genuinely downstream of Terms configuration (final Business Terms approval/effectiveness/version assignment, production Business acceptance, Capability 3 closure, and — because Capability 4 requires a completed business — all of Capability 4 and every capability after it) is correctly blocked and stays blocked pending CI-01. Everything **not** actually dependent on Terms configuration is not blocked by CI-01, regardless of Capability 3's administrative label.

## 5. Candidate next-work inventory

| Candidate | Description |
|---|---|
| **A. `ENG-P3-003`** | Knowledge Studio MVP — editorial UI for authoring/approving/publishing Commerce Knowledge taxonomy without code changes. |
| **B. Capability 4** ("First Verified Purchase") | Work packages `ENG-P4-001`/`002`, `ENG-P5-001..003`, `ENG-P6-001..003`. |
| **C. `DEC-TECH-008`** (search-technology decision) | `OPEN_ENGINEERING`, Engineering-Lead-owned; not currently blocking anything, only "owed a formal Decision Register entry" (per `ENG-P3-001-DESIGN-001` §27). |
| **D. `DEC-SUB-013`** (complimentary/free-plan policy) and **§19.2** (zero-fee Business liability treatment) | Founder-owned, `OPEN_FOUNDER`; independent of each other per the 2026-09-03 whole-recon correction; §19.2's conditional Class-B gate has "no live trigger today" since DEC-SUB-013's position is "none." A fee-paying-only launch is unaffected by either. |
| **E. Programme-tracker currency reconciliation** | Syncing the Master Workflow, Engineering Implementation Programme, and Coding-Agent Prompt Register to CDR-001's and the Decision Register's actual current state (§3 above). |

## 6. Authorized / Unblocked / Required / Priority matrix

| Candidate | Authorized? | Unblocked? | Required for MVP/pilot? | Priority (advances shortest path to pilot)? |
|---|---|---|---|---|
| **A. `ENG-P3-003`** | Partially — `DEC-CKS-002` (Founder-approved 2026-08-20) establishes it is *approvable and non-blocking*, but no fresh Founder authorization to actually *begin* engineering work exists yet (the immediately preceding task's own report explicitly says it "requires its own fresh Founder authorization to begin," §8). No design/architecture package (`ENG-P3-003-DESIGN-001` or equivalent) exists yet. | **Yes** — zero dependency on CI-01, Terms configuration, or Capability 3 closure (no schema/permission/transport collision with `ENG-P3-002`, per `ENG-P3-001-DESIGN-001` §28). | **No** — `DEC-CKS-002` explicitly states the Knowledge Studio editorial UI "is not a prerequisite for first launch"; seed knowledge may remain repository-controlled/engineering-governed through pilot. | **Low-to-moderate** — does not shorten the path to a usable pilot (pilot needs a Terms-gated business, which Knowledge Studio does not touch), but is the only genuine forward *product* delivery direction currently available at all while CI-01 is parked. |
| **B. Capability 4** | No — no fresh Founder authorization exists for any Capability-4 package. | **No** — genuinely blocked. Capability 4 requires a completed Capability 3 (a customer *and a business* must exist), and Capability 3 cannot close until Terms are configured, which is blocked on CI-01. CDR-001 records every Capability-4 work package as `Blocked`. | **Yes** (eventually) — but currently unreachable. | **N/A while blocked.** |
| **C. `DEC-TECH-008`** | Yes in principle (Engineering-Lead-owned, not Founder-gated) — but recording a decision is not itself "delivery work," and the underlying `ENG-P3-001`/`ENG-P3-002` packages that motivated it are already complete without needing it resolved. | Yes. | No — explicitly not a blocker to any completed or in-flight package. | Low — closing a paper gap, not advancing the product. |
| **D. `DEC-SUB-013`/§19.2** | No — Founder-owned decision, not yet made. | Yes to *raise the question*; no engineering work is unblocked by resolving it, since a fee-paying-only launch is unaffected either way. | No — required only before onboarding a genuinely zero-fee Business, not before pilot/MVP. | Low for now — no live trigger. |
| **E. Tracker reconciliation** | Yes — routine documentation-changes-log-class housekeeping, not a Founder decision. | Yes. | Not product-required, but reduces governance risk (three trackers materially disagree about `ENG-P3-002`'s and Phase 3's status with the actual, more authoritative CDR-001/Decision-Register record). | Moderate as *hygiene*, not as *delivery* — flagged, not recommended as the primary direction (see §9). |

## 7. `ENG-P3-003` assessment and disposition

**What it delivers:** an editorial UI (`ENG-P3-003`, "Knowledge Studio MVP") letting authorized staff author, approve, and publish Commerce Knowledge taxonomy (categories, types, standard products/services, tags, translations) without code changes — the mechanism `DEC-CKS-001`'s bounded MVP seed dataset anticipates for ongoing, centrally governed expansion after launch.

**Required for MVP/pilot/launch?** No. `DEC-CKS-002` (Founder-approved 2026-08-20, recorded in `ENG-P3-001-DESIGN-001` §26) is explicit: "The Commerce Knowledge dataset itself is required for launch/onboarding. The Knowledge Studio editorial UI is not a prerequisite for first launch. Initial seed knowledge may be repository-controlled, reviewed through governed Product/Engineering processes, versioned, loaded through governed seed tooling, and audited through normal repository/change-control procedures." Central taxonomy governance is preserved either way — this disposition narrows *who operates the tooling* (engineering process vs. a Studio UI), not *whether governance exists*.

**Dependencies:** `ENG-P3-001` (Commerce Knowledge seed data) only — already `Complete`. No dependency on `ENG-P3-002`, `DEC-LEGAL-002`, CI-01, Terms configuration, or Capability 3's own closure (`ENG-P3-001-DESIGN-001` §28's parallel-execution analysis, reaffirmed by the CI-01-DEF-001 report §8).

**Why `DEC-CKS-002` made it non-launch-blocking:** the Phase 3 exit criterion that actually gates capability completion ("a business can complete onboarding without creating uncontrolled categories") needs only `ENG-P3-001`'s seed data being queryable, not `ENG-P3-003`'s editorial tooling — an engineering-supported lean the Founder subsequently confirmed as a binding disposition, not merely permitted it.

**Does doing it now materially advance the product?** Yes, but not on the pilot's critical path: it converts taxonomy maintenance from an engineering/repository-control process (functional today) into a self-service editorial workflow — valuable operationally, especially before taxonomy volume grows past the Burundi-pilot seed set, but not something the pilot itself requires.

**Disposition: `REQUIRES FOUNDER SEQUENCING DECISION`.** `DEC-CKS-002` establishes that `ENG-P3-003` *may* be authorized independently of Terms/CI-01/Capability-3-closure; it does not itself constitute the authorization to *begin* engineering work, and no design/architecture package for it exists yet (unlike `ENG-P3-001`/`ENG-P2-002`/`ENG-P2-003`, each of which began with its own `*-DESIGN-001`). Because it is optional rather than required, the Founder decision needed is narrow and concrete: **whether to spend engineering capacity on `ENG-P3-003` now, while CI-01 is parked, versus holding that capacity idle or reallocating it to non-product governance hygiene (§9).**

## 8. Next-capability assessment

Capability 4 ("First Verified Purchase") is the next capability in CDR-001's sequence. Its own roadmap entry states a genuine sequential dependency: "Capabilities 2 and 3 (a customer and a business must both exist first)." Because Capability 3's business-exists condition is itself gated on Terms configuration (§3 above), Capability 4 is **not** a case of an administratively-open predecessor blocking otherwise-independent work — the dependency is a real architectural one (no business record can complete onboarding, so no business exists to make a "first verified purchase" against). CDR-001 records every Capability-4 work package (`ENG-P4-001`/`002`, `ENG-P5-001..003`, `ENG-P6-001..003`) as `Blocked`, consistent with this. No Capability-4 package is a candidate for independent delivery while CI-01 remains unresolved. This is the only capability-sequence element evaluated as genuinely blocked (not merely administratively open) by this assessment.

## 9. Other remaining pilot-critical work

No engineering work package genuinely required for MVP/pilot and unblocked by CI-01 was found. `DEC-TECH-008` and `DEC-SUB-013`/§19.2 are open but neither blocks a fee-paying-only pilot, and resolving either does not unblock any currently-stalled engineering package — recording them as "next delivery work" would manufacture busywork against the task's own instruction not to do so.

The one non-product item worth flagging (not recommended as the primary direction, per §10): three programme trackers — the Master Workflow (2026-07-26), the Engineering Implementation Programme (2026-08-22), and the Coding-Agent Prompt Register (2026-08-07) — are all materially behind CDR-001 (2026-08-29) and the Decision Register (2026-08-31, with the Documentation Changes Log itself running through 2026-09-03). This is a disclosed, pre-existing risk (flagged, unfixed, since the original CDR-001 creation task in 2026-07-29) rather than a new defect. It does not block any delivery work identified above, so it is not this task's recommendation, but a Founder-directed reconciliation task would reduce the risk of a future coding-agent task acting on a stale tracker instead of CDR-001/the Decision Register.

## 10. Recommended next delivery direction

**`ENG-P3-003` — Knowledge Studio MVP, beginning with a bounded architecture/delivery-design package (proposed ID: `ENG-P3-003-DESIGN-001`), not implementation.**

This is the only candidate in §5–§6 that is simultaneously: (a) genuine forward *product* delivery advancing an unfinished Capability-3 work package, not documentation hygiene or a paper decision; (b) fully unblocked — no dependency on CI-01, Terms configuration, or Capability 3's formal closure; and (c) already carrying a Founder-level disposition (`DEC-CKS-002`) establishing it as approvable. Capability 4 and beyond are genuinely blocked (§8), not merely administratively open, so they are not available regardless of CI-01's parked-dependency treatment. `DEC-TECH-008` and `DEC-SUB-013`/§19.2 are open questions that unblock nothing. Tracker reconciliation (§9) is real but is hygiene, not delivery, and was explicitly excluded from the primary recommendation to avoid manufacturing work.

## 11. Exact reason it outranks alternatives

Every other capability-delivery candidate is either genuinely blocked by the Terms/CI-01 chain (Capability 4+) or is a Founder/engineering-lead paper decision that unblocks no engineering package (`DEC-TECH-008`, `DEC-SUB-013`, §19.2). `ENG-P3-003` is the sole candidate where "independent delivery is explicitly permitted to continue" (per this task's own framing) has an actual, governed target to continue against.

## 12. Whether Founder authorization is already sufficient

**Not fully.** `DEC-CKS-002` authorizes `ENG-P3-003` to be dispositioned as non-blocking and *separately authorizable* — it does not itself authorize engineering work to begin, consistent with how every other `ENG-P*` package in this programme has required its own explicit start authorization even after an enabling Founder decision existed. A fresh, narrow Founder authorization to begin a bounded `ENG-P3-003-DESIGN-001` architecture/delivery-design package (mirroring `ENG-P3-001-DESIGN-001`'s role for Commerce Knowledge) is the specific next governance step required before any code is written.

## 13. Proposed next task ID/title and scope

**`ENG-P3-003-DESIGN-001` — Knowledge Studio MVP Architecture & Delivery Design.** Scope (by analogy to `ENG-P3-001-DESIGN-001`): architecture only — data model for editorial workflow states (draft/in-review/active/retired/archived, reusing the `DEC-DATA-005` canonical enum already adopted for `KnowledgeNode`/`KnowledgeTag`), permission/role surface for who may author/approve/publish taxonomy, UI/UX shape, and an implementation decomposition into sub-packages (e.g. `ENG-P3-003A`/`B`/`C`, mirroring `ENG-P2-002`/`ENG-P3-001`'s pattern) — authorizing no implementation, no Firestore Rules, no new permission identifier, no client UI code. This design task itself requires a fresh, narrow Founder authorization to begin (per §12); this assessment does not carry that authorization.

## 14. Anything explicitly deferred

- CI-01 resolution (external, out of engineering/documentation control).
- Final Business Terms approval, version/effective-date assignment, `platformConfig/businessTerms` configuration, production Business acceptance, Capability 3 formal closure.
- Capability 4 and all subsequent capabilities.
- `DEC-TECH-008`, `DEC-SUB-013`, §19.2 zero-fee treatment — all remain open, unresolved, independent of this recommendation.
- Programme-tracker currency reconciliation (§9) — flagged, not performed; a candidate for a separate, narrowly-scoped Founder-directed housekeeping task if the Founder wants it addressed before the next coding-agent task relies on those trackers.
- `ENG-P3-003` implementation itself — not started; only the prerequisite design task is recommended, and even that awaits fresh Founder authorization.

## 15. Files modified

- `docs/05-implementation/reports/11ONUS-PROG-002-post-business-terms-deferral-programme-position-2026-09-03.md` (this report — created)
- `docs/00-governance/documentation-changes-log.md` (Entry 156 added)

No other file modified. No `docs/00-governance/canonical-reference.md`, `decisions/decision-register.md`, `CDR-001`, `engineering-implementation-programme.md`, or `coding-agent-prompt-register.md` edit made, despite the currency findings at §3/§9 — correcting those trackers was judged out of this assessment task's authorized scope (a documentation-changes action in its own right, not an assessment output) and is flagged for separate Founder-directed action instead.

## 16. Code/document diff summary

Two new/modified Markdown files, additive only (one new report file; one new changes-log entry appended after Entry 155, no existing entry text altered). No application code, Firestore Rules, configuration, or roadmap/programme/decision-register content changed.

## 17. Commands executed

`git fetch origin`; `git rev-parse origin/main`; `git log origin/main -1`; `git worktree add <scratch-path> origin/main --detach`; read-only `find`/`grep`/file reads across `docs/`; `git add`/`git commit`/`git push` for this report and changes-log entry (branch below); `gh pr create` (no merge).

## 18. Dependencies added

None.

## 19. Configuration/application changes

None. No Firebase, Firestore Rules, `functions/`, or `apps/web/` change of any kind.

## 20. Risks

- If the Founder does not act on the disclosed tracker-currency gap (§3/§9), a future task reading the Engineering Implementation Programme or Coding-Agent Prompt Register in isolation (rather than CDR-001/the Decision Register) could act on stale `ENG-P3-002`/Phase-3 status.
- If `ENG-P3-003` is authorized without a prerequisite design package, the same class of risk that motivated `ENG-P3-001-DESIGN-001`/`ENG-P2-002-DESIGN-001` (a coding agent inventing taxonomy/workflow semantics ungoverned by any architecture record) would recur.
- None of this task's own changes carry deployment, Firebase, Rules, or Terms-configuration risk — it is docs-only and additive.

## 21. Rollback instructions

`git revert` of this task's commit on its own branch (identified below) — cleanly separable; reverting removes the report and changes-log entry with no effect on any other file or on programme state, since nothing else was touched.

## 22. Markdown assessment report

This document.

## 23. Persistent `.md` changes tracking

`docs/00-governance/documentation-changes-log.md` Entry 156 (added below, in the same worktree/commit as this report).

## 24. Commit/PR/head SHA and CI/review state

Recorded after commit/push (see PR opened following this report; not self-merged — see accompanying summary for the exact PR URL/number and head SHA).

## 25. Confirmation FD-COM-001 remained untouched

Confirmed. This task worked exclusively in a fresh, isolated, detached-HEAD worktree branched from `origin/main` at `939a07d4ca23207e81c18f7a0034934feb3c8011`. The primary working directory (`/Volumes/PRODUCTION/Projects/11THONUS`), which per `git status` at task start holds unrelated uncommitted `FD-COM-001` commercial-model changes and several untracked files, was never opened, read, staged, committed, stashed, reset, or otherwise altered by this task.

## 26. Exact Founder action required next

One narrow decision: **authorize (or decline/defer) a bounded `ENG-P3-003-DESIGN-001` architecture/delivery-design package for Knowledge Studio**, on the basis that it is unblocked by CI-01 and already Founder-dispositioned (`DEC-CKS-002`) as non-launch-blocking and separately authorizable, but has not yet received the fresh start-authorization every other `ENG-P*` package in this programme has required. Everything else in this report (CI-01 itself, Capability 4+, `DEC-TECH-008`, `DEC-SUB-013`/§19.2, tracker reconciliation) is either already on its own separately-governed track or explicitly not recommended as the next step, per §14.

---

**Success gate:** `11THONUS PROGRAMME POSITION REASSESSED — CI-01 PARKED — HIGHEST-PRIORITY UNBLOCKED DELIVERY DIRECTION IDENTIFIED`
