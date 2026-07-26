> **Title:** Proposed (Unapplied) Decision Register Update — DEC-PROV-005
> **Version:** 1.0 · **Status:** Proposal only — not applied, not approved · **Classification:** Working (governance record — evidence)
> **Governing document:** [Decision Register](../decision-register.md) — this document proposes text; it does not modify the register
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/DEC-PROV-005-proposed-updates-2026-07-26.md`
> **Date:** 2026-07-26

# Proposed Decision Register Update (Draft Text — Not Applied)

> ⚠️ **This document proposes draft Decision Register text for review. It does not modify [`decision-register.md`](../decision-register.md).** Applying this proposal requires the Founder to act through the normal Decision Governance Workflow / Decision Update Procedure, after the Founder selects one of the options in the [Founder Decision Brief](DEC-PROV-005-founder-brief-2026-07-26.md). `DEC-PROV-005` is **not** resolved by this document.

## DEC-PROV-005 — Proposed Update

- **Current status (unchanged by this document):** `OPEN_PROVIDER`.
- **Proposed status:** remains `OPEN_PROVIDER` — **not proposed for `CONFIRMED`.** This decision-preparation task was explicitly scoped not to select a provider, per its own constraints ("must not select or configure a provider... change `DEC-PROV-005` to CONFIRMED"). Resolution is the Founder's own action, taken separately from and after this evidence package.
- **Options for Founder selection (not adopted, carried forward for decision only):**
  - **Option A** — Firebase/Google Cloud native (Cloud Error Reporting + Cloud Logging + Cloud Monitoring + Cloud Trace), with a to-be-scoped custom frontend error handler.
  - **Option B** — Sentry, adopted for both frontend and backend.
  - **Option C** — Sentry scoped to frontend error capture/performance monitoring only; Cloud Logging/Monitoring/Trace retained for backend, infrastructure, business-domain, security, and audit observability.
- **Evidence basis:** [Evidence Pack](DEC-PROV-005-error-monitoring-evidence-2026-07-26.md) §4 (options), §7 (18-criteria comparison), §9 (cost assessment); [Source Register](DEC-PROV-005-source-register-2026-07-26.md).
- **Recommendation basis (Technical Lead perspective, not adopted):** Option C, on the grounds that Option A alone leaves the decision question's explicit "frontend" half unanswered (a confirmed capability gap, not merely a preference), while Option B duplicates backend observability surface `ENG-P1-002` already built at zero cost — see Evidence Pack §11 for the full fact/inference/assumption breakdown.
- **If confirmed, draft decision text (for discussion, not adoption) — to be filled in only after the Founder selects an option:** *"11thONUS will use [SELECTED OPTION] for error monitoring and operational observability. [Frontend / backend / both] error capture and performance monitoring will be provided by [PROVIDER]. All infrastructure logs, business-domain operational logs, security monitoring, and audit records remain on Google Cloud Logging/Firestore per TRD20's existing architecture, regardless of the option selected."*
- **Unresolved conditions that should be resolved before or alongside `CONFIRMED` (regardless of which option is selected):**
  1. Whether error-monitoring stack traces (native or third-party) could incidentally capture customer/payment-adjacent data at the point of a specific failure, and what scrubbing rule prevents it (Evidence Pack §8.1, §10 item 1).
  2. If any Sentry option (B or C) is selected: whether Sentry's EU-region hosting and DPF+SCC transfer mechanism satisfies the existing `DEC-LEGAL-006` cross-border analysis, which was scoped to Google Cloud specifically and has not been extended to a new third-party processor (Evidence Pack §8.5, §10 item 2).
  3. Whether Cloud Logging/Monitoring/Error Reporting fall under the same Google Cloud DPA and subprocessor list already evaluated for Firestore/Storage/Auth under `DEC-LEGAL-006`, or require separate confirmation (Evidence Pack §8.4, §10 item 3).
  4. Direct, verbatim re-verification of Cloud Logging/Monitoring pricing figures against `cloud.google.com`'s own pricing pages before any budget commitment — this pass's figures rest on corroborated search-engine synthesis, not a successful direct page fetch (Evidence Pack §10 item 6).
- **Owner approval required:** Founder (per `DEC-PROV-005`'s existing Decision Register ownership by the Engineering Lead role — unchanged by this proposal; the Decision Register lists the Engineering Lead as owner, with final confirmation authority resting with the Founder per this task's governing instructions).
- **Rollback/reconsideration trigger (proposed):** if `ENG-P1-003` implementation later finds Option C's two-system boundary (Evidence Pack §6) operationally unworkable, or if unresolved condition 2 above surfaces a legal blocker specific to Sentry, the decision should revert to Option A with a separately-scoped frontend error handler rather than defaulting to Option B's fuller adoption.

---

This proposal is not applied by this document. It requires the Founder's own action through the Decision Governance Workflow, after reviewing the Evidence Pack and Founder Decision Brief.
