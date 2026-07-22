# Cloud Environment & Deployment Strategy

> **Title:** Cloud Environment & Deployment Strategy
> **Version:** 1.0 · **Status:** Active governance process · **Classification:** Working (governance process)
> **Governing document:** [Engineering Governance Charter](engineering-governance-charter.md); operationalizes **DEC-TECH-005** (Cloud Environment & Deployment Strategy) and consolidates against (does not duplicate) **TRD Chapter 20** and **DEC-OPS-001** (Environment strategy, already `CONFIRMED`)
> **Source-of-truth path:** `docs/06-engineering-governance/cloud-environment-and-deployment-strategy.md`
> **Last controlled update:** 2026-07-19 (created — Engineering Sprint 0A, expanding DEC-TECH-005 from a Firebase-region decision into the complete cloud deployment architecture)

## 0. What This Document Is and Is Not

This document does not select a Firebase/GCP region, does not create or modify any Firebase project, does not deploy anything, does not enable or disable any Google Cloud service, and does not select a monitoring provider. It is governance-only: it states the environment architecture and the principles engineering must follow when `DEC-TECH-005` is finally confirmed and Phase 1 proceeds.

**This document does not re-decide anything already `CONFIRMED`.** Environment count, Firebase project isolation, environment naming, configuration classification, deployment permissions, backup architecture, and disaster-recovery objectives are already governed in detail by **[TRD Chapter 20](../02-technical/trd/20-deployment-and-operational-resilience.md)** and confirmed at the policy level by **DEC-OPS-001**. Where this document restates something from TRD20, it is citing it, not re-authoring it — TRD20 remains the authoritative technical source. This document's actual new content is: the deployment promotion model as an explicit rule (no reverse promotion), the production region-selection *criteria and priority order* (not a region choice), example project-naming conventions (illustrative only), and the infrastructure-access governance question TRD20 does not itself answer — *who* may take irreversible cloud-account-level actions (see §6).

## 1. Purpose

Multiple environments exist so that no single mistake — a bad deploy, an untested migration, a misconfigured integration — can reach a real customer or a real business. Each environment answers a different question: *does the code run at all* (development), *does the release behave correctly under production-like conditions* (staging), and *is this safe for a paying business and a real customer to rely on* (production). Separating these questions into separate, isolated environments is what makes it possible to move fast in development without ever risking what production guarantees.

This document exists because the engineering audit that reopened `DEC-TECH-005` found that "select a Firebase region" was too narrow a frame — a region choice made in isolation, without an explicit environment architecture, promotion model, and infrastructure-governance answer, would have left exactly these questions unanswered at the moment Phase 1 needed them. Consolidating them under one decision means Phase 1 is not blocked twice — once for the region, and later for everything else this document covers.

## 2. Environment Architecture

Per **TRD20 §20.4** (already confirmed via **DEC-OPS-001**), 11thONUS maintains **four** isolated environments, not three:

```
Local
  ↓
Development
  ↓
Staging
  ↓
Production
```

| Environment | Purpose | Primary users | Notes |
|---|---|---|---|
| **Local** | Individual development against the Firebase Emulator Suite | Individual engineers / coding agents | No live Firebase project involved; this is how ENG-P0-001/ENG-P0-002 were validated |
| **Development** | Shared engineering integration and early testing | Engineering team | First environment to receive a merged change |
| **Staging** | Release candidates, user-acceptance testing, provider sandboxes, production-like validation | Engineering team, Founder (Preview Review) | Where the [Deployment Workflow](deployment-workflow.md)'s Preview Review is performed before any production promotion |
| **Production** | Live businesses and customers | Real users | Never used as a general testing environment (TRD20 §20.4) |

This document does not redefine these four environments, their purposes, or their isolation requirements — see TRD20 §20.4–20.8 for the full technical specification (project isolation, naming, configuration, and configuration classification).

## 3. Deployment Promotion Model

Changes move in one direction only:

```
Developer
  ↓
Development
  ↓
Staging
  ↓
Production
```

**There is no reverse promotion.** A change is never promoted backward from Staging to Development, or from Production to Staging, to "fix forward" — a defect found in a later environment is corrected at the source (a new commit, reviewed and re-promoted through the same sequence), never by pushing a later environment's state backward into an earlier one. This preserves the guarantee that everything in Production has already passed through Staging's Preview Review, and everything in Staging has already passed through Development.

This is the environment-strategy statement of the same sequence the [Deployment Workflow](deployment-workflow.md) §2 already governs operationally (verified pull → environment selection → artifact assembly → deploy → Preview Review → promotion or rollback) and the same rule **TRD20 §20.14** states technically ("a staging deployment identity shall not deploy to production"). Rollback (moving a single environment back to a prior known-good release) is not reverse promotion — it is the process TRD20 §20.21 already governs; a rollback returns one environment to its own earlier state, it does not push a later environment's state into an earlier one.

## 4. Firebase Project Strategy

Per **TRD20 §20.5** (confirmed via DEC-OPS-001), each shared environment (Development, Staging, Production — Local uses the Emulator Suite and requires no live project) uses a **separate Firebase/Google Cloud project**, with separate Authentication users, Firestore database, Storage bucket, Functions, Hosting, App Check configuration, secrets, service accounts, logs, and billing monitoring per project. Environment separation never depends on naming conventions inside a single shared project.

**Example naming convention only — no project ID is fixed by this document:**

```
<platform>-<environment>

e.g. 11thonus-dev
     11thonus-staging
     11thonus-prod
```

The current, single existing Firebase project (`eleventh-on-us`) is an initialized development-stage environment only — per the engineering audit that prompted this task, it holds no production data, no production users, and no production workloads (Firestore in `nam5`, Storage in `us-east1`, Hosting present, no Functions or Cloud Run deployed). This document does not reclassify, rename, or migrate that project — it states the target-state strategy that `DEC-TECH-005`'s resolution and subsequent Phase 1 work will implement. Which existing project (if any) becomes `dev` versus being retired in favor of newly created, correctly-named projects is an implementation decision for Phase 1, not decided here.

## 5. Region Strategy

This document deliberately does not name a region — that remains `DEC-TECH-005`'s open decision, pending the regional evaluation (`EXT-TECH-002`) and the cross-border legal position (`DEC-LEGAL-006`). It states the **principles** that evaluation must weigh, in priority order:

1. **Legal compliance** — the region must be compatible with the cross-border hosting position `DEC-LEGAL-006` ultimately confirms; no region is acceptable on technical or cost grounds alone if it fails this gate.
2. **Service completeness** — the region must support every Firebase/GCP service the platform requires (Firestore, Storage, Functions, Hosting, App Check, and — per TRD11 §11.17 — the confirmed event-outbox and idempotency patterns); a lower-latency region that lacks a required service is not viable without a documented workaround.
3. **Operational maturity** — how mature and reliable the region's service footprint is (feature parity with more established regions, incident history where known, provider support tier).
4. **Disaster recovery** — compatibility with the backup and recovery architecture TRD20 §20.47–20.58 already governs (backup location, cross-region restore feasibility, recovery objectives); see §8 below.
5. **Latency** — latency from Burundi (and the future RW/UG/KE expansion markets per `DEC-PROD-003`) is weighed last among these five, after the higher-priority gates are satisfied, not first.

**Development environments may use a different region than production** where doing so simplifies engineering (for example, if a development-tier region has lower cost or better tooling availability) — provided no production data, secrets, or customer-facing configuration ever depends on the development region's choice. This flexibility does not apply to Staging, which per §20.4 exists specifically for production-like validation and should mirror the production region once selected, to make Preview Review meaningful.

Multi-country regional review for future launches beyond the first production region is separately governed by **TRD20 §20.71** (Data Residency and Region Review) and is not restated here.

## 6. Environment Configuration

Environment-specific configuration, its classification (Public Client / Server / Secrets / Governed Runtime), and the rule that missing required production configuration blocks deployment are fully specified in **TRD20 §20.7–20.8** and are not restated here. Emulator usage for Local development is governed by the existing Firebase Emulator Suite configuration established in ENG-P0-001 (`firebase.json`, no live project, no `.firebaserc`) — this document does not change that configuration.

The one addition this document makes: **which environment's configuration a given engineering task may read or write is itself governed by the same role boundaries as §7 below** — a coding agent implementing a Development-scoped work package must not require, read, or embed Staging or Production secrets to complete it.

## 7. Infrastructure Governance

TRD20 §20.13–20.14 already govern *code deployment* permissions (least privilege, per-environment deployment roles, dedicated CI/CD service accounts). This document governs the layer above that — **cloud-account-level actions that TRD20 does not itself assign an owner to**, because creating or reconfiguring a Firebase/GCP project is a different kind of action than deploying code to one:

| Action | Who may perform it |
|---|---|
| Create a new Firebase/GCP project | Founder or Engineering Lead, under explicit Founder authorization for that specific project (never a coding agent acting autonomously) |
| Enable a Google Cloud API/service | Engineering Lead, within the bounds of an already-`CONFIRMED` technical decision requiring that service; enabling a service not tied to a confirmed requirement requires Founder sign-off |
| Enable or modify billing | Founder only |
| Change a project's region (where changeable) or select a new project's region | Founder, on Engineering Lead's evaluated recommendation — this is `DEC-TECH-005` itself; no region is selected outside that decision |
| Deploy to Production | Only a designated release engineer/role per TRD20 §20.13, following the [Deployment Workflow](deployment-workflow.md) and [Git Workflow](git-workflow.md) in full — never a coding agent's own unsupervised action |

No coding agent, acting on an implementation prompt alone, may create a Firebase project, enable an API or service, enable or modify billing, change a region, or deploy to Production. Where a work package appears to require any of these, the correct response is the same as any other blocked precondition — stop and report, per the [Coding Agent Standard](coding-agent-standard.md) — not to act and report afterward.

## 8. Monitoring Strategy

This document does not select a monitoring or error-tracking provider — that is **`DEC-PROV-005`**, a separate, still-open decision (`OPEN_PROVIDER`, blocking Phase 1 alongside `DEC-TECH-005`). The architectural guidance here is scoped to how monitoring relates to environment strategy, not to which tool implements it:

- Observability (logs, metrics, traces) is architected per **TRD20 §20.22–20.36** — this document does not restate that architecture.
- Whatever provider `DEC-PROV-005` selects must be configured **per environment** (§20.7's "monitoring settings" is explicitly listed as environment-specific configuration) — Development, Staging, and Production shall never share one monitoring project/workspace/alert channel, for the same isolation reason they never share one Firebase project.
- Alert severity and on-call ownership (TRD20 §20.33–20.36) apply in full to Production; Development and Staging may use reduced alerting, but never zero visibility — a broken Staging environment that nobody notices defeats its purpose as the pre-production validation gate.

## 9. Disaster Recovery Principles

High-level governance only — no implementation detail is added here beyond what **TRD20 §20.47–20.58** (Backup Architecture, Firestore/Storage/Configuration Backups, Backup Retention, Restore Testing, Disaster Recovery, Recovery Objectives, Recovery Priority, Recovery Validation, Data Reconstruction) already specifies in full. This document's only addition:

- **Region selection (§5) and disaster-recovery capability are linked, not independent choices** — a candidate production region must be evaluated against whether it supports the backup/restore and recovery-objective architecture TRD20 already requires, before it can be selected. A region cannot be chosen for latency or cost reasons and have its DR compatibility discovered afterward.
- Development and Staging are not held to the same recovery objectives as Production (TRD20 §20.55's recovery objectives are a production guarantee) — but Staging's backup/restore process should still be periodically exercised, since it is the environment Restore Testing (§20.53) is most safely rehearsed against before a real Production incident.

## 10. Cost Governance

TRD20 §20.63 (Cost Monitoring) already establishes *what* is monitored and that costs should be attributable by environment, among other dimensions — this document adds environment-tier *expectations*, which TRD20 does not itself state:

- **Development** — should default to free-tier or lowest-cost service configuration wherever a service tier choice exists; sustained unexplained cost growth in Development is itself an operational signal (ORP-009, TRD20 §20.3, "uncontrolled cloud cost is an operational failure") worth investigating, not a normal cost of doing business.
- **Staging** — modest, sized to realistically exercise production-like conditions (§2) without provisioning at production scale; provider integrations should default to sandbox/test mode (§20.7) rather than live billing wherever a sandbox exists.
- **Production** — the only environment where cost is expected to scale with real usage; budgeted and monitored deliberately (TRD20 §20.63), with cost attribution by environment and country (§20.63) used to detect anomalies early, consistent with ORP-009's framing of cost as an operational metric, not an afterthought.

This document does not set a numeric budget for any environment — that is an operational decision for the Founder/Engineering Lead once real usage data exists, not a governance-document commitment.

## 11. Security Principles

High-level governance only. Security architecture itself is governed by **TRD Chapter 12** (Security and Access Control) and is not restated or extended here. The one environment-strategy-specific principle this document adds: **no security control that exists in Production may be absent, weakened, or bypassed in Staging**, since Staging's entire purpose (§2) is production-like validation — a Staging environment that is easier to break into than Production would validate the wrong thing. Development and Local may reasonably run with reduced security friction (per TRD20 §20.4's stated purpose for those environments), provided no real customer or business data is ever present there.

## 12. Relationship to Existing Governance

This document does not amend TRD20, TRD12, TRD8, DEC-OPS-001, the Deployment Workflow, the Git Workflow, or the Coding Agent Standard — it references all of them and adds only the content none of them already states: the explicit no-reverse-promotion rule (§3), production region-selection criteria in priority order (§5), example project-naming conventions (§4), and cloud-account-level infrastructure-access governance (§7). Where this document and any of those documents appear to describe the same thing differently, the more detailed, already-`CONFIRMED` technical document governs, and this document is corrected — not the reverse.
