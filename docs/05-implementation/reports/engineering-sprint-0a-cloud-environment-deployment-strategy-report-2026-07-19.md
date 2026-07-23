> **Title:** Engineering Sprint 0A — Cloud Environment & Deployment Strategy — Implementation Report
> **Date:** 2026-07-19
> **Classification:** Governance/Documentation Implementation Report
> **Produces:** [Cloud Environment & Deployment Strategy](../../06-engineering-governance/cloud-environment-and-deployment-strategy.md); expands `DEC-TECH-005` in the [Decision Register](../../00-governance/decisions/decision-register.md)

---

## 1. Analysis summary (performed before any change, per the task's explicit instruction)

**Where `DEC-TECH-005` currently appeared:** ~35 files across the repository. The large majority are dated historical reports, evidence packs, and point-in-time snapshots (`docs/05-implementation/reports/`, `docs/00-governance/decisions/evidence/`, `docs/06-engineering-governance/decision-resolution-plan-v1.md`, `docs/00-governance/decisions/phase-3-reconciliation.md`) that correctly describe the decision as it stood when written — these were **not** edited, consistent with the established practice throughout this governance programme of never retroactively rewriting historical records.

**Live, authoritative documents actually defining its scope as "Firebase region"** (identified by grepping for the exact `DEC-TECH-005 (Firebase region...)` descriptor pattern and reading context): the Decision Register entry itself; the DEC-TECH-005 Founder Decision Brief; `docs/README.md`'s status banner; the Version 1.0 Engineering Baseline Declaration (created the immediately preceding task); the Engineering Implementation Programme's Phase 1 profile; the Coding-Agent Prompt Register's Phase 1 status note; the Version 1 Engineering Blueprint (§1.3, §6.4); the Engineering Transition D1 Agenda's DEC-TECH-005 entry; and one Requirements Traceability Matrix row (`OTD-003`).

**How it currently affects engineering:** it is the sole open technical decision (alongside the separate `DEC-PROV-005`) blocking Phase 1 entry — specifically `ENG-P1-001` (Firebase project initialization) and everything sequentially downstream.

**Critical grounding finding, made before writing anything:** `DEC-OPS-001` ("Environment strategy") is **already `CONFIRMED`** and already establishes Local/Development/Staging/Production environments with isolated Firebase projects, deny-by-default deployment permissions, and configuration classification — sourced from **TRD Chapter 20 §20.4–20.8, §20.13–20.14, §20.47–20.58, §20.63**, which independently already specify environment architecture, Firebase project isolation, environment naming, configuration classification, deployment permissions, backup architecture, disaster recovery, and cost monitoring in full technical detail. This meant the new Cloud Environment & Deployment Strategy document could not be written as if these questions were open — doing so would have re-litigated an already-`CONFIRMED` decision and duplicated an Authoritative Technical chapter. The document was scoped instead to genuinely new content: the explicit no-reverse-promotion rule, production region-selection criteria in priority order, example (non-hardcoded) project-naming conventions, and cloud-account-level infrastructure-access governance (who may create projects/enable APIs/enable billing/change regions) — a layer TRD20 does not itself assign an owner to.

**Why expanding the decision improves long-term governance:** a region choice made without an explicit environment architecture, promotion model, and infrastructure-access answer would have left Phase 1 blocked a second time once those questions surfaced separately. Consolidating them under one decision, evaluated together, avoids that.

**Governance mechanism used:** per the Decision Governance Workflow, only a `CONFIRMED` decision is never edited in place. `DEC-TECH-005` is `OPEN_ENGINEERING` — evolving its scope in place, same ID, same status, is the correct and permitted mechanism; no new decision number was created, and the original "Firebase region" question is fully preserved as the decision's still-open component.

## 2. Files created

- [`docs/06-engineering-governance/cloud-environment-and-deployment-strategy.md`](../../06-engineering-governance/cloud-environment-and-deployment-strategy.md) — the new governance document (§0 explicitly delineates what it does/does not cover relative to TRD20/DEC-OPS-001; §1–§11 cover Purpose, Environment Architecture, Deployment Promotion Model, Firebase Project Strategy, Region Strategy, Environment Configuration, Infrastructure Governance, Monitoring Strategy, Disaster Recovery Principles, Cost Governance, Security Principles, and Relationship to Existing Governance).
- This report.

## 3. Files modified

| File | Change |
|---|---|
| [Decision Register](../../00-governance/decisions/decision-register.md) | `DEC-TECH-005` entry expanded in place — title, decision question, options, current confirmed position, affected documents, source references, implementation consequences, and Notes all updated to describe the Cloud Environment & Deployment Strategy scope; original "Firebase region" question fully preserved as the still-open component; explicit note that this does not overlap `DEC-OPS-001`. Header date updated. |
| [DEC-TECH-005 Founder Decision Brief](../../00-governance/decisions/dec-tech-005-firebase-region-decision-brief.md) | Header and §2 updated to quote the expanded decision text and note the scope change; §8 gained a reference to the new strategy document. Substantive region-evaluation content (§3–§7) left unchanged — still accurate for the region-selection component. |
| [Version 1.0 Engineering Baseline Declaration](../../00-governance/version-1-engineering-baseline-declaration.md) | §2 and §5 descriptors updated; new row added to §3's document-reference table for the Cloud Environment & Deployment Strategy. |
| [Documentation Index](../../README.md) | One banner descriptor updated (Phase 1 blocking reason). |
| [Engineering Implementation Programme](../../05-implementation/change-tracking/engineering-implementation-programme.md) | Phase 1 profile's Decision Dependencies and Current Status descriptors updated. |
| [Coding-Agent Prompt Register](../../05-implementation/change-tracking/coding-agent-prompt-register.md) | One status-note descriptor updated. |
| [Version 1 Engineering Blueprint](../../02-technical/version-1-engineering-blueprint.md) | §1.3 (two mentions) and §6.4 (two mentions) updated to describe the expanded scope while preserving "region remains the open question" framing. |
| [Engineering Transition D1 Agenda](../../00-governance/decisions/engineering-transition-d1-agenda.md) | DEC-TECH-005 subsection heading and a new scope note added; the historical entry body left unchanged (same historical-preservation pattern used for Finding F2 in the preceding task). |
| [Requirements Traceability Matrix](../../00-governance/requirements-traceability-matrix.md) | `OTD-003` row's Notes cell annotated with the scope-expansion context; no ID renumbered, no row added or removed. |
| [Engineering Governance section index](../../06-engineering-governance/README.md) | One row added for the new document (#12); no existing row changed. |
| [`IMPLEMENTATION_CHANGES.md`](../../changes/IMPLEMENTATION_CHANGES.md) | New append-only entry (see §10 below). |

**Explicitly not modified**, and why: every dated report, evidence pack, and point-in-time snapshot referencing `DEC-TECH-005` (see §1) — these are historical records, correctly describing the decision as it stood when written; retroactively editing them would misrepresent history. `docs/03-standards/engineering-standards/README.md`, `naming-conventions.md`, and `repository-and-folder-standards.md` — these correctly cite the region-selection sub-component specifically (Firestore/Functions naming gated on region), which remains accurate under the expanded scope and does not mischaracterize `DEC-TECH-005`'s full scope. `docs/05-implementation/phase-0-authorization.md` and `docs/00-governance/documentation-changes-log.md` — point-in-time governance-checkpoint records, left untouched per the same historical-preservation pattern.

## 4. Document diff summary

```
docs/00-governance/decisions/dec-tech-005-firebase-region-decision-brief.md |  15 +-
docs/00-governance/decisions/decision-register.md                          | 179 +++++++++++++--------
docs/00-governance/decisions/engineering-transition-d1-agenda.md           |  36 ++---
docs/00-governance/requirements-traceability-matrix.md                     |  32 ++--
docs/02-technical/version-1-engineering-blueprint.md                       |  10 +-
docs/05-implementation/change-tracking/coding-agent-prompt-register.md     |  12 +-
docs/05-implementation/change-tracking/engineering-implementation-programme.md | 70 ++++----
docs/06-engineering-governance/README.md                                   |   1 +
docs/00-governance/version-1-engineering-baseline-declaration.md           |  (new-file edits, part of prior task's file, extended)
docs/README.md                                                             |   6 +-
docs/changes/IMPLEMENTATION_CHANGES.md                                     |  91 +++++
```
Plus 2 new files: `cloud-environment-and-deployment-strategy.md`, this report. All other files already present in the working tree's diff (Verified Loyalty chain, Canonical Reference, PRD/TRD corrections, etc.) are **unchanged by this task** — verified by confirming their diff-stat line counts are identical to their state at the end of the immediately preceding task.

## 5. Commands executed

```
git branch --show-current / git rev-parse --short HEAD / git rev-parse --short origin/main
grep -rln "DEC-TECH-005" docs/
grep -n "DEC-TECH-005" <each candidate file>   # context check, live vs. historical
grep -n "^\*\*DEC-OPS-001" -A 15 docs/00-governance/decisions/decision-register.md
grep -n "^# 20\." docs/02-technical/trd/20-deployment-and-operational-resilience.md   # TRD20 structure survey
grep -n "OPEN\|CONFIRMED\|edit" docs/00-governance/decision-governance-workflow.md    # confirm OPEN decisions may be edited in place
python3 <scratchpad>/linkcheck.py   (first run found 1 broken link — see §7; fixed; re-run clean)
git diff --check
git status --short / git diff --stat / git diff --name-only
```

## 6. Dependencies added

None.

## 7. Configuration changes

**None.** Explicitly confirmed: no Firebase project was created, recreated, or modified; no Google Cloud API or service was enabled or disabled; no region was selected; no billing was touched; `firebase.json`, `firestore.rules`, `storage.rules`, and any `.firebaserc` were not present in the diff (`git diff --name-only` shows zero matches for any Firebase/GCP configuration file — verified explicitly, not assumed). This was a documentation-and-governance-only task throughout.

## 8. Broken-link result and fix

The first full-repository link check after all edits found **one broken link**: `docs/00-governance/requirements-traceability-matrix.md` linked to the new strategy document via `../../06-engineering-governance/...` — one `../` too many, since the matrix lives at `docs/00-governance/` and the target is a sibling of `00-governance/` under `docs/`, requiring only `../06-engineering-governance/...`. Fixed immediately; the full check was re-run and returned **1,390 links across 170 files, 0 broken**.

## 9. Risks

- The new document's Region Strategy (§5) and Infrastructure Governance (§7) sections are the parts of this task with the least existing textual precedent to ground against (unlike Environment Architecture and Disaster Recovery, which map almost directly onto already-`CONFIRMED` TRD20 content) — they represent genuine new governance judgment, not a restatement of prior decisions. They are stated as principles/priority order, not a region choice, consistent with the constraint not to select a region.
- As with every prior task in this chain, manual propagation across ~10 live files retains residual risk that some other reference was missed; the link check and terminology-consistency grep sweep in §12 of the prior report's pattern were applied here too (see validation below) as mitigation, not proof of completeness.

## 10. Rollback instructions

All changes are uncommitted. To discard only this task's edits: delete `docs/06-engineering-governance/cloud-environment-and-deployment-strategy.md`; revert the `DEC-TECH-005` entry in the Decision Register to its pre-2026-07-19 text (preserved in this report's context and in git's working-tree history, since nothing has been committed); revert the targeted descriptor edits in the nine other modified files listed in §3; remove the added row from `docs/06-engineering-governance/README.md`; remove the corresponding entry from `IMPLEMENTATION_CHANGES.md`. No commit exists yet for this or any preceding task in this chain, so no `git revert` is required.

## 11. Final status

`DEC-TECH-005` is now **Cloud Environment & Deployment Strategy** — same decision ID, still `OPEN_ENGINEERING`, historical "Firebase region" framing fully preserved as its remaining open component. No Firebase project, Google Cloud service, region, or billing configuration was changed. This is governance documentation only.
