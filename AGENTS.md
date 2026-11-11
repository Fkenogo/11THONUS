## START-01 — mandatory first response for coding agents (Founder direction 2026-11-11)

Before **any new or resumed coding, integration, correction, preview or release task**, apply the existing PRG-01/ECCL-005 contract and return a brief START-01 starting-point receipt **before changing code**. Repeat on agent, worktree, branch or repository handoff and after relevant upstream changes. Do not assume a handover or newer-looking branch is correct.

The receipt must identify: (1) task authority and observation time; (2) refreshed remote `main` SHA, working branch/HEAD, merge-base, dirty files/worktrees and relevant stacked/open PRs; (3) exact Founder-accepted implementation and evidence or UNKNOWN; (4) **START FROM** exact branch/commit and behaviour to preserve; (5) **DO NOT START FROM** known stale/superseded versions; (6) task-relevant active routes/imports/build selection; (7) preview artifact SHA, environment and fixture identity when relevant or UNKNOWN; and (8) CONFIRMED/CONFLICTED/UNKNOWN findings plus overall PASS / PASS WITH EXPLICIT LIMITATIONS / STOP.

A PASS never authorises work beyond the approved assignment. A limited PASS allows only independently unaffected authorised work. Missing approved ancestry, competing baselines or unknown source/preview identity material to the assignment means **STOP that affected implementation**: continue read-only investigation and escalate to the Technical Lead/Founder. Never overwrite dirty work or silently substitute old code. At HOV-01 handover, give the next agent the verified start point and separate implemented, tested, accepted, merged and deployed states.

This clause supplements, and never replaces, the project's stricter constitution, Founder decisions, review and release gates. It does not authorise merges, deployments, deletion, migrations or changes to production. Central reference: `MILEDGE-ECCL-005` in `Fkenogo/miledge-ventures`.

# Repository coding-agent entry — Miledge Code Lifecycle Guardian

**Status:** ECCL-005 portfolio adoption candidate, pending Founder review and merge. This file does not approve work, override existing project governance, or change production privileges.
**Central proposed contract:** https://github.com/Fkenogo/miledge-ventures/blob/main/docs/miledge-ventures-knowledge/00-governance/MILEDGE-ECCL-005-PORTFOLIO-ENGINEERING-CONTINUITY-CONTRACT.md (in private `Fkenogo/miledge-ventures`; if inaccessible use the minimum below and report the missing source).

## PRG-01 — reconcile before coding or resuming

1. Read this repository's current programme, approved Founder decisions, architecture, applicable work-package instructions and latest handover. Establish what functionality is accepted; a merged commit, open PR or running preview alone is not evidence of Founder acceptance.
2. Fetch/inspect remote main and record exact SHA; inspect local HEAD, branch, worktree changes, open/staged PR ancestry and dependencies. Do not disturb dirty work, rewrite shared history or silently switch to a stale version.
3. Check the active application route, imports, runtime entrypoints and feature implementation relevant to the task. If a preview is involved, verify its actual deployment/build commit and environment/test-fixture identity; URL existence alone is insufficient.
4. Record the source facts, accepted experience, conflicts, unknowns and a clear task-scoped PASS / PASS WITH LIMITATIONS / STOP result. A script exit code of zero is not permission to implement.
5. STOP the affected task for missing accepted changes, contradictory ancestry, unknown preview identity, unclear authority or destructive cleanup risk. Escalate to the project Technical Lead; unrelated authorised tasks may proceed.

## HOV-01 — controlled handover

Every handover identifies exact base/head SHAs, branch and PR, accepted vs candidate behaviour, tests, deployment/preview provenance and fixture limitations, pending dependencies, existing dirty work, obsolete-code candidates and next authority required. Code retirement needs a verified consumer analysis, Founder acceptance where applicable and a separate reviewable deletion diff. Do not self-merge, deploy, delete legacy code or add blocking CI from this entry document.

Project-specific AGENTS instructions, security holds and Founder approvals remain controlling. Adopt automated checks through separate scoped reviewed PRs, starting non-gating.
