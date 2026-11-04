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
