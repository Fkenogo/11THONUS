> **Title:** 11thONUS Coding-Agent Prompt Register
> **Version:** 1.0 · **Status:** Active governance record · **Classification:** Working (governance record)
> **Governing document:** [Engineering Implementation Programme](engineering-implementation-programme.md)
> **Source-of-truth path:** `docs/05-implementation/change-tracking/coding-agent-prompt-register.md`
> **Last controlled update:** 2026-07-18 (ENG-P0-002 Closure and Phase 0 Completion — ENG-P0-002 status Under Review → Complete; Phase 0 Complete; created Engineering Transition Phase 0A)

# 11thONUS Coding-Agent Prompt Register

## 1. Purpose

This is the founder-readable, prompt-by-prompt tracker: one row per work package defined in the [Engineering Implementation Programme](engineering-implementation-programme.md), showing at a glance what is ready, what is blocked, and what stage of the [AI Collaboration Workflow](../../06-engineering-governance/ai-collaboration-workflow.md) each has reached. The programme document is the detailed source (objective, requirement/decision dependencies, expected files, validation); this register is the flat, scannable summary plus the live status of each prompt as it moves through execution.

## 2. Prompt Execution Rule (restated from the Programme, §A.7)

> **Only one detailed coding-agent implementation prompt is issued at a time, unless the work packages are explicitly independent and parallel work has been approved.**

This register enforces that rule visibly: at most one row should carry `In Progress` or `Under Review` status at any time, unless an explicit parallel-work approval is noted in that row's Notes. See the Programme §A.7 for the full rationale (dependency on prior reports, architecture discovery, correction work, decision sequencing, concurrent-file-modification risk).

## 3. Status Vocabulary and Update Authority

| Status | Meaning | Who may set it |
|---|---|---|
| **Not Yet Scheduled** | Defined in the programme but not next in sequence | ChatGPT Technical Lead |
| **Blocked** | Cannot start; a specific decision, precondition, or prior work package is outstanding (see `Blocking Reason` in the programme) | ChatGPT Technical Lead (sets); Founder (resolves the blocker) |
| **Ready** | All preconditions met; eligible to receive a detailed implementation prompt | ChatGPT Technical Lead |
| **In Progress** | A detailed prompt has been issued and the Coding Agent is implementing | Coding Agent (updates on start) |
| **Under Review** | Implementation Report submitted; Technical Review in progress | ChatGPT Technical Lead |
| **Corrections Required** | Technical Review returned itemized corrections | ChatGPT Technical Lead |
| **Approved** | Technical Review passed | ChatGPT Technical Lead |
| **Committed** | Change committed locally (pre-push) | Coding Agent |
| **Pushed** | Change pushed to the shared remote | Coding Agent |
| **Deployed** | Founder has pulled, verified, and deployed | Founder |
| **Manually Verified** | Manual QA checklist passed | Founder / future Manual QA role |
| **Complete** | [Definition of Done](../../06-engineering-governance/definition-of-done.md) fully satisfied | Founder / ChatGPT Technical Lead jointly |

No status may be set by the Coding Agent for stages it does not itself perform (e.g. a Coding Agent may set `In Progress`, `Committed`, `Pushed`, but never `Approved`, `Deployed`, `Manually Verified`, or `Complete` — those belong to the reviewing/deploying role per [Roles & Responsibilities](../../06-engineering-governance/roles-and-responsibilities.md)).

## 4. Register

All 47 work packages from the [Engineering Implementation Programme](engineering-implementation-programme.md). Every Prompt ID is unique. `Report`, `Commit`, `Deployment` and `Manual QA` columns are placeholders until each stage is actually reached.

| Prompt ID | Phase | Work Package | Requirement IDs (representative) | Decision Dependencies | Status | Report | Commit | Deployment | Manual QA |
|---|---|---|---|---|---|---|---|---|---|
| ENG-P0-001 | P0 | Repository, tooling and test-framework scaffold | IM-006, IM-007, FR-OPS-004 | DEC-TECH-003, DEC-TECH-004 (both CONFIRMED) | Complete | [Implementation Report](../reports/ENG-P0-001-implementation-report-2026-07-17.md) · [Technical Review](../reports/ENG-P0-001-technical-review-2026-07-17.md) (Approved) | `3a50710` | N/A (Phase 0 has no deployment target — see Programme §Phase 0 profile) | N/A (Manual QA Required: No — see Programme §Phase 0 profile) |
| ENG-P0-002 | P0 | CI pipeline, templates and change-tracking scaffold | FR-OPS-002, FR-OPS-005, FR-OPS-006 | DEC-TECH-004 | Complete | [Implementation Report](../reports/ENG-P0-002-implementation-report-2026-07-17.md) · [Technical Review (Approved)](../reports/ENG-P0-002-technical-review-2026-07-17.md) · [Closure Report](../reports/ENG-P0-002-closure-and-phase-0-completion-report-2026-07-18.md) | `e316565` (merge commit on `main`, [PR #1](https://github.com/Fkenogo/11THONUS/pull/1) — merged 2026-07-18T09:00:18Z), post-merge CI [passed](https://github.com/Fkenogo/11THONUS/actions/runs/29638421819) | N/A (Phase 0 has no deployment target — see Programme §Phase 0 profile) | N/A (Manual QA Required: No — see Programme §Phase 0 profile) |
| ENG-P1-001 | P1 | Firebase project init, App Check, client/admin SDK | FR-OPS-001, FR-OPS-003 | DEC-TECH-005 | Blocked | — | — | — | — |
| ENG-P1-002 | P1 | Shared command contract (error/log/idempotency/outbox) | DA-005, DA-006, DA-014 | DEC-TECH-006, DEC-TECH-007 (both CONFIRMED; ENG-P1-001 completion still required) | Blocked | — | — | — | — |
| ENG-P1-003 | P1 | Security/Storage Rules deny-by-default + monitoring | FR-SEC-006, FR-OPS-009 | DEC-PROV-005 | Blocked | — | — | — | — |
| ENG-P2-001 | P2 | Customer identity (auth, profile, loyalty number, QR) | AP-005, BR-005, BR-006, PR-005 | DEC-SEC-001, DEC-DATA-007, DEC-PROV-004 | Blocked | — | — | — | — |
| ENG-P2-002 | P2 | Business identity (create, owner, profile, branch) | AP-003, AP-004, BR-007, BR-008 | — | Blocked | — | — | — | — |
| ENG-P2-003 | P2 | Staff identity (invite, membership, suspend/remove) | AP-009, BR-002, BR-010, BR-012 | — | Blocked | — | — | — | — |
| ENG-P2-004 | P2 | Role context and permission resolution | AP-006, AP-008, BR-003, BR-011 | DEC-ID-003 | Blocked | — | — | — | — |
| ENG-P3-001 | P3 | Commerce Knowledge seed data | FR-SRCH-004, FR-SRCH-011 | — | Blocked | — | — | — | — |
| ENG-P3-002 | P3 | Business onboarding flow | FR-SRCH-001, SD-002 | — | Blocked | — | — | — | — |
| ENG-P3-003 | P3 | Knowledge Studio MVP | FR-SRCH-012, SD-004 | — | Blocked | — | — | — | — |
| ENG-P4-001 | P4 | Reward Program CRUD and lifecycle | FR-RP-001, FR-RP-004 | DEC-LOY-009 | Blocked | — | — | — | — |
| ENG-P4-002 | P4 | Versioning and plan-limit enforcement | BR-067, FR-RP-010 | — | Blocked | — | — | — | — |
| ENG-P5-001 | P5 | Purchase recording UI flow | BR-050, BR-051 | — | Blocked | — | — | — | — |
| ENG-P5-002 | P5 | Server-side Purchase Record creation and idempotency | BR-047, BR-048, FR-PVL-006 | — | Blocked | — | — | — | — |
| ENG-P5-003 | P5 | Offline queue and pending-sync display | DA-014 | — | Blocked | — | — | — | — |
| ENG-P6-001 | P6 | Verification flow (Waiting for You) | BR-052, BR-053, FR-PVL-002 | — | Blocked | — | — | — | — |
| ENG-P6-002 | P6 | Individual rejection with reason | BR-054, FR-PVL-009 | — | Blocked | — | — | — | — |
| ENG-P6-003 | P6 | Dispute and business resolution workflow | BR-056, FR-PVL-010 | DEC-PROD-008 | Blocked | — | — | — | — |
| ENG-P7-001 | P7 | Verified Unit issuance and uniqueness | BR-037, BR-041, BR-045 | — | Blocked | — | — | — | — |
| ENG-P7-002 | P7 | Loyalty Cycle progress and threshold calculation | BR-038, BR-040, BR-042 | DEC-LOY-008 | Blocked | — | — | — | — |
| ENG-P7-003 | P7 | Reward creation, availability, reconciliation job | BR-040, BR-044, CVLE-001 | DEC-LOY-008 | Blocked | — | — | — | — |
| ENG-P8-001 | P8 | Redemption flow (atomic, concurrency-safe) | BR-070, FR-RP-008 | — | Blocked | — | — | — | — |
| ENG-P8-002 | P8 | Cycle closure, next cycle, On Us Moment history | BR-071, BR-073, BR-074 | — | Blocked | — | — | — | — |
| ENG-P9-001 | P9 | Notification intent and template resolution | CR-005, FR-COM-005 | — | Blocked | — | — | — | — |
| ENG-P9-002 | P9 | Delivery abstraction (push/email/SMS, preferences) | CR-009, CR-010, FR-COM-009 | DEC-PROV-002 | Blocked | — | — | — | — |
| ENG-P9-003 | P9 | Launch-critical template set (EN/FR) | FA-010 | — | Blocked | — | — | — | — |
| ENG-P10-001 | P10 | Plan catalogue, pricing, trial, entitlement | FR-SUB-001, FR-SUB-002, BR-030 | — | Blocked | — | — | — | — |
| ENG-P10-002 | P10 | Payment provider adapter, webhook validation | FR-SUB-006, FR-SUB-013, SB-005 | DEC-PROV-001, DEC-LEGAL-004 | Blocked | — | — | — | — |
| ENG-P10-003 | P10 | Grace period, suspension, reactivation, billing admin | FR-SUB-011, FR-SUB-012, SB-009 | DEC-LEGAL-003 | Blocked | — | — | — | — |
| ENG-P11-001 | P11 | Business dashboard | FR-RPT-004, RR-001 | — | Blocked | — | — | — | — |
| ENG-P11-002 | P11 | Reporting foundation (metric catalogue, projections) | FR-RPT-001, FR-RPT-002, FR-RPT-003 | — | Blocked | — | — | — | — |
| ENG-P11-003 | P11 | Operational integrity (review queue, anomaly rules) | RR-003, RR-008, RR-011 | — | Blocked | — | — | — | — |
| ENG-P12-001 | P12 | Administrator roles, MFA, support tooling | BR-098, FR-RBAC-001, AAP-002 | — | Blocked | — | — | — | — |
| ENG-P12-002 | P12 | Knowledge/Rules Studio launch functions, feature flags | AAP-006, AR-008, FR-ADM-011 | — | Blocked | — | — | — | — |
| ENG-P13-001 | P13 | Complete EN/FR launch-critical copy | FA-010, FR-FE-014, FR-FE-015 | — | Blocked | — | — | — | — |
| ENG-P13-002 | P13 | Accessibility review and remediation | FA-014 | — | Blocked | — | — | — | — |
| ENG-P13-003 | P13 | PWA hardening (manifest, offline shell) | FA-006, FA-007, FA-018 | — | Blocked | — | — | — | — |
| ENG-P14-001 | P14 | Security hardening (rules, App Check, rate limiting) | FR-SEC-006, FR-SEC-012, FR-SEC-016 | — | Blocked | — | — | — | — |
| ENG-P14-002 | P14 | Resilience (monitoring, backup/restore, rollback test) | FR-OPS-013, FR-OPS-014, FR-OPS-015 | — | Blocked | — | — | — | — |
| ENG-P14-003 | P14 | Privacy and compliance readiness | PR-009, PR-010, PR-016 | DEC-LEGAL-001, DEC-LEGAL-005, DEC-LEGAL-006 | Blocked | — | — | — | — |
| ENG-P15-001 | P15 | Pilot cohort setup and onboarding | Cross-cutting | — | Blocked | — | — | — | — |
| ENG-P15-002 | P15 | Pilot execution and validation-area monitoring | Cross-cutting | — | Blocked | — | — | — | — |
| ENG-P15-003 | P15 | Pilot findings review and exit-gate decision | Cross-cutting | DEC-LEGAL-002 | Blocked | — | — | — | — |
| ENG-P16-001 | P16 | Launch readiness checklist execution | Cross-cutting | — | Blocked | — | — | — | — |
| ENG-P16-002 | P16 | Production smoke test and go-live | Cross-cutting | — | Blocked | — | — | — | — |

## 5. Current Distribution

| Status | Count |
|---|---|
| Complete | 2 |
| Ready | 0 |
| Blocked | 45 |
| Not Yet Scheduled | 0 |
| In Progress / Under Review / Corrections Required / Approved / Committed / Pushed / Deployed / Manually Verified | 0 |

**Update (ENG-P0-002 Closure and Phase 0 Completion, 2026-07-18):** ENG-P0-002 is now `Complete` — Technical Review returned Approved, PR [#1](https://github.com/Fkenogo/11THONUS/pull/1) merged into `main` (`e316565`, 2026-07-18T09:00:18Z), post-merge CI on `main` [passed](https://github.com/Fkenogo/11THONUS/actions/runs/29638421819) including Playwright and Firebase Emulator Suite validation. Per the Definition of Done (§2), the deployment (§2.8) and Preview Review/Manual QA (§2.9–10) criteria remain `N/A` for the same documented reason as ENG-P0-001 (Phase 0 has no deployment target; Manual QA not required) — see the [ENG-P0-002 Closure and Phase 0 Completion Report](../reports/ENG-P0-002-closure-and-phase-0-completion-report-2026-07-18.md) for the full per-criterion evidence. **Both Phase 0 work packages are now `Complete` and Phase 0 itself is `Complete`** (TRD22 §22.10 exit criteria all satisfied — see the Programme's Phase 0 profile). **No Phase 1 work package is `Ready`:** ENG-P1-001 remains `Blocked` on **DEC-TECH-005** (Firebase region, still `OPEN_ENGINEERING` in the live Decision Register), and ENG-P1-002/ENG-P1-003 remain sequentially blocked behind it (ENG-P1-003 additionally blocked on **DEC-PROV-005**, still `OPEN_PROVIDER`) — confirmed directly against the live Decision Register, not assumed. A [Founder Decision Brief for DEC-TECH-005](../../00-governance/decisions/dec-tech-005-firebase-region-decision-brief.md) has been prepared instead of an implementation prompt, since no work package is actually ready. All other 45 work packages stay `Blocked`, each for its own documented reason — see the [Engineering Implementation Programme](engineering-implementation-programme.md).

## 6. Maintenance

This register is updated at every status transition of every work package — not just at phase boundaries. It is kept in exact sync with the [Engineering Implementation Programme](engineering-implementation-programme.md): a work package never exists in one document without a matching row in the other. Every update is a normal, logged documentation change (per the [Documentation Changes Log](../../00-governance/documentation-changes-log.md)) except where it is instead the natural byproduct of a coding-agent Implementation Report — in that case, the report itself is the primary record and this register is updated to reference it, not re-derived independently.
