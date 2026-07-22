> **Title:** Engineering Decision Sprint 0B — DEC-TECH-005 Cloud Region Evaluation Evidence Pack — Implementation Report
> **Date:** 2026-07-19
> **Classification:** Governance/Documentation Implementation Report
> **Produces:** [DEC-TECH-005 Cloud Region Evaluation Evidence Pack](../../00-governance/decisions/DEC-TECH-005-Cloud-Region-Evaluation-Evidence-Pack.md)

---

## 1. Analysis performed

Before drafting, the full documentation chain named by the task was reviewed: the Engineering Baseline Declaration, Decision Register (`DEC-TECH-005` entry), DEC-TECH-005 Decision Brief, Cloud Environment & Deployment Strategy, Engineering Blueprint, Engineering Implementation Programme, Requirements Traceability Matrix, and Platform Constitution. Findings are recorded in full in the evidence pack's own §0 (a required section, not just a preamble) rather than duplicated here — summary: every structural question a "Firebase region decision" originally implied (environment count, promotion model, infrastructure-access governance) was already resolved by the Cloud Environment & Deployment Strategy (Engineering Sprint 0A, the immediately preceding task); the only remaining open component of `DEC-TECH-005` is the region choice itself, gated by `DEC-LEGAL-006`.

Critically, this review also surfaced an existing, substantial prior evidence pack — [`docs/00-governance/decisions/evidence/DEC-TECH-005-firebase-region-evaluation-2026-07-18.md`](../../00-governance/decisions/evidence/DEC-TECH-005-firebase-region-evaluation-2026-07-18.md) — created one day earlier, with its own [Source Register](../../00-governance/decisions/evidence/DEC-LEGAL-006-DEC-TECH-005-source-register-2026-07-18.md) (33 sources, primary/secondary classified). Per the task's explicit "do not duplicate existing governance" instruction, the new evidence pack was built to **cite and extend** that prior research — re-verifying its core findings against freshly-fetched official sources, adding the service categories and candidate region this task specifically required that the prior pack did not cover, rather than re-deriving already-established facts from scratch.

## 2. Engineering comparison methodology

Documented in the evidence pack's own §1: a three-tier evidence hierarchy (official documentation fetched directly > prior pack's cited primary sources > search-synthesized findings, labeled as such); explicit Fact/Estimate/Engineering-judgement labeling on every substantive claim; a no-fabricated-precision rule (no invented millisecond or dollar figures where no source provided one); and an explicit candidate-inclusion rule (Firestore support required; geographic or service-completeness relevance required for full evaluation, with named exclusion reasons for regions not fully evaluated).

## 3. Candidate regions evaluated

Seven: `africa-south1`, `europe-west1`, `europe-west3`, `europe-west4`, `europe-west8` (new in this pass — the prior pack had excluded it; found to share `africa-south1`'s exact Cloud Scheduler/Cloud Tasks gap, a genuinely new finding), `europe-west9`, and the `eur3` multi-region Firestore option. Eleven further regions were confirmed to exist but not fully evaluated, with the specific exclusion reasoning stated in the pack's §2.

## 4. Evidence sources used

**Freshly fetched in this pass (2026-07-19), all official Google/Firebase documentation:**
- Firebase, "Learn about locations for products and resources" — `firebase.google.com/docs/projects/locations`
- Firebase, "Cloud Functions locations" — `firebase.google.com/docs/functions/locations`
- Firebase, "Cloud Firestore locations" — `firebase.google.com/docs/firestore/locations`
- Google Cloud, "Cloud Scheduler locations" — `docs.cloud.google.com/scheduler/docs/locations`
- Google Cloud, "Cloud Tasks locations" — `docs.cloud.google.com/tasks/docs/locations`
- Firebase, "Cloud Storage for Firebase locations" — `firebase.google.com/docs/storage/locations`
- WonderNetwork ping data, Nairobi — `wondernetwork.com/pings/Nairobi` (Fact-tier latency measurement, not an estimate)
- Web search on Firebase Extensions/Emulator Suite regional dependency, and on Nairobi–Johannesburg/Kampala latency and East African submarine-cable topology (used for corroboration and the Nairobi/Kampala/Tanzania expansion-readiness analysis)

**Cited by reference, not re-fetched** (facts not expected to change day-to-day, per the methodology's tiering): the 2026-07-18 evidence pack's own T1–T18 technical sources (Google Cloud locations list, Cloud Run locations, Pub/Sub availability, Secret Manager locations, egress pricing, the Cloud Scheduler cross-region pattern, the Firebase Auth location-control finding), and its companion Legal Evidence Pack for the legal-admissibility gate.

## 5. Files created

- [`docs/00-governance/decisions/DEC-TECH-005-Cloud-Region-Evaluation-Evidence-Pack.md`](../../00-governance/decisions/DEC-TECH-005-Cloud-Region-Evaluation-Evidence-Pack.md) — the evidence pack itself.
- This report.

## 6. Files modified

None. This was a documentation-creation-only task; no existing governance document, Decision Register entry, Engineering Baseline Declaration, Engineering Blueprint, or Engineering Implementation Programme was touched, per the task's explicit "Do NOT" list.

## 7. Commands executed

```
git branch --show-current / git rev-parse --short HEAD / git rev-parse --short origin/main
WebFetch: firebase.google.com/docs/projects/locations
WebFetch: firebase.google.com/docs/functions/locations
WebFetch: firebase.google.com/docs/firestore/locations
WebFetch: docs.cloud.google.com/scheduler/docs/locations
WebFetch: docs.cloud.google.com/tasks/docs/locations
WebFetch: firebase.google.com/docs/storage/locations
WebFetch: wondernetwork.com/pings/Nairobi
WebSearch: ping latency Nairobi to Johannesburg / submarine cable topology
WebSearch: Kampala/Kigali latency to africa-south1
WebSearch: Firebase Extensions/Emulator Suite regional availability
python3 <scratchpad>/linkcheck.py   (first run found 1 broken link — see §10; fixed; re-run clean)
git diff --check
git status --short
```

## 8. Dependencies added

None.

## 9. Configuration changes

**None.** No Firebase project was created, recreated, or modified; no Google Cloud API/service was enabled or disabled; no region was selected; `DEC-TECH-005` was not marked `CONFIRMED` — explicitly verified via `grep` that no such string appears anywhere in the new document. No architecture change was recommended (the three options in §12 are presented as trade-offs for the Founder to weigh, not an engineering recommendation to adopt one).

## 10. Risks and assumptions

- **Risk:** the Kigali/Bujumbura latency figures remain estimates extrapolated from a real Nairobi measurement, not direct measurements — explicitly labeled as such throughout the pack (§4), and repeated as an outstanding condition in §13.
- **Risk:** the legal-admissibility gate (§9 of the pack) is inherited unchanged from the 2026-07-18 Legal Evidence Pack — this pack does no new legal research and explicitly states it cannot substitute for `DEC-LEGAL-006`.
- **Assumption, stated as such in the pack:** cost-premium claims for `africa-south1`/`europe-west8` remain an assumption, not a confirmed price comparison, per §6 of the pack — carried forward from the prior pack, not strengthened.
- **Broken-link risk (materialized and fixed):** one relative-path error was introduced and caught by the link checker (see §10 below) — fixed before this report was finalized.

## 11. Rollback instructions

The change in this task is additive only — one new file. To roll back: delete `docs/00-governance/decisions/DEC-TECH-005-Cloud-Region-Evaluation-Evidence-Pack.md` and this report, and remove the corresponding entry from `docs/changes/IMPLEMENTATION_CHANGES.md`. No existing file requires reverting, since none was modified.

## 12. Validation performed

- **Internal consistency:** the pack's own §0 (what exists/what's open) matches §12's three-option recommendation and §13's Founder summary without contradiction — no option claims a service-completeness advantage §3 does not support, and no option claims a latency advantage §4 does not support.
- **Document references:** every citation to an existing governance document (Decision Register, Cloud Environment & Deployment Strategy, Engineering Blueprint, Engineering Implementation Programme, Requirements Traceability Matrix, Platform Constitution, the 2026-07-18 evidence pack and its Source Register) was checked against the current, live state of those documents — not assumed from memory.
- **Link integrity:** full relative-link check — first pass found one broken link (`platform-constitution.md` referenced without the required `../` from the `decisions/` subdirectory); fixed immediately; final check: **1,430 relative links across 172 markdown files, 0 broken.**
- **No duplicated governance:** the pack explicitly defers to the Cloud Environment & Deployment Strategy for environment/promotion/governance content (§0) and to TRD20 for backup/DR architecture (§7), citing rather than restating both.
- **No conflicting recommendations:** confirmed via direct read-through that Options A/B/C (§12) and the Founder Decision Summary (§13) state consistent strengths/weaknesses for each candidate, with no option's "advantage" contradicting another option's stated "risk" for the same candidate.
- **`git diff --check`:** clean.
- **No governance document modified:** confirmed via `git status --short` — every previously-modified file in the working tree predates this task (from the Verified Loyalty and Engineering Sprint 0A chains); only the two new files from this task appear as untracked additions.

## 13. Final status

Engineering evidence produced. `DEC-TECH-005` remains `OPEN_ENGINEERING`. No region has been selected. The evidence pack is ready for Founder review alongside the outstanding `DEC-LEGAL-006` legal-admissibility question.
