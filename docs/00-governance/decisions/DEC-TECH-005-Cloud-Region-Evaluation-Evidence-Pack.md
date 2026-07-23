> **Title:** DEC-TECH-005 — Cloud Region Evaluation Evidence Pack
> **Version:** 1.0 · **Status:** Engineering evidence — advisory only, not a final region selection · **Classification:** Working (governance record — evidence)
> **Governing document:** [Decision Register](decision-register.md) — this pack prepares engineering evidence for `DEC-TECH-005`'s remaining open component (region selection); it does not resolve it, does not modify the register, and does not amend any governance document
> **Source-of-truth path:** `docs/00-governance/decisions/DEC-TECH-005-Cloud-Region-Evaluation-Evidence-Pack.md`
> **Last controlled update:** 2026-07-19 (Engineering Decision Sprint 0B — created)
> **Builds on, does not duplicate:** [DEC-TECH-005 Firebase/GCP Region Evidence Pack, 2026-07-18](evidence/DEC-TECH-005-firebase-region-evaluation-2026-07-18.md) and its [Source Register](evidence/DEC-LEGAL-006-DEC-TECH-005-source-register-2026-07-18.md) — this document cites and extends that prior research rather than re-deriving already-established facts

# DEC-TECH-005 — Cloud Region Evaluation Evidence Pack

> ⚠️ **This is engineering evidence, not a decision.** No region is selected by this document. `DEC-TECH-005` remains `OPEN_ENGINEERING`. Nothing in this pack modifies the Decision Register, the Engineering Baseline Declaration, the Engineering Blueprint, the Engineering Implementation Programme, or any other governance document. This pack does not recommend an architecture change, does not create a Firebase project, and does not modify any configuration.

---

## 0. Analysis Performed Before Writing (Required Pre-Work)

Per this task's explicit instruction, the complete relevant documentation was reviewed before any evaluation content was drafted.

**What already exists:**

- **[Platform Constitution](../platform-constitution.md)** — governs at the highest level; does not name any infrastructure provider or region; CP-002 ("Architecture Before Features") and CP-012 ("Security by Default") are the constitutional principles this evaluation must remain consistent with, but the Constitution makes no region-specific claim.
- **[Decision Register](decision-register.md)** — `DEC-TECH-005` ("Cloud Environment & Deployment Strategy," expanded 2026-07-19, Engineering Sprint 0A) is `OPEN_ENGINEERING`, `D1` priority. Its text explicitly states the environment architecture, promotion model, and infrastructure-governance components are now pre-established elsewhere, and "this decision's remaining open component is the region choice itself, evaluated against [the Cloud Environment & Deployment Strategy's] §5 priority order (legal compliance, service completeness, operational maturity, disaster recovery, latency)." `DEC-OPS-001` (Environment strategy) is separately `CONFIRMED` and is not reopened by this pack.
- **[DEC-TECH-005 Decision Brief](dec-tech-005-firebase-region-decision-brief.md)** — decision-preparation document; confirms no regional evaluation existed anywhere in the documentation suite prior to the 2026-07-18 evidence pack, and that this brief's own scope is limited to the region-selection question specifically (its environment/promotion/governance components were resolved by Sprint 0A).
- **[Cloud Environment & Deployment Strategy](../../06-engineering-governance/cloud-environment-and-deployment-strategy.md)** — `DEC-OPS-001`-consistent, `CONFIRMED`-level governance for environment architecture (four environments: Local/Development/Staging/Production), the deployment promotion model, Firebase project-per-environment strategy, infrastructure-access governance, and — critically for this pack — **§5 Region Strategy**, which states the five-factor priority order this evaluation is structured against: legal compliance, service completeness, operational maturity, disaster recovery, latency (in that order). This pack does not restate §5's principles; it supplies the evidence to apply them.
- **[Engineering Blueprint](../../02-technical/version-1-engineering-blueprint.md)** — §1.3/§6.4 confirm the region question is the sole open D1 technical question remaining in the Blueprint; the Blueprint's architecture (Authentication, Firestore, Functions, Storage, App Check, Cloud Messaging, scheduled Functions for reminders/renewals per TRD22 §22.11) is the concrete workload this evaluation's service-support findings must be checked against.
- **[Engineering Implementation Programme](../../05-implementation/change-tracking/engineering-implementation-programme.md)** — Phase 1 (`ENG-P1-001`, Firebase project init) is `Blocked` on `DEC-TECH-005`; this pack's findings feed that specific blocker.
- **[Requirements Traceability Matrix](../requirements-traceability-matrix.md)** — `OTD-003` ("Firebase Region") is the traceability record this decision resolves; not modified by this pack.
- **TRD Chapters 8, 20** — TRD8 (Firebase Platform Architecture) and TRD20 (Deployment and Operational Resilience) define the service architecture and environment/backup/DR requirements this evaluation checks candidate regions against, without restating their content.
- **[2026-07-18 Region Evidence Pack](evidence/DEC-TECH-005-firebase-region-evaluation-2026-07-18.md)** — the direct predecessor to this document. It already established, with primary-source citations: the correct current Google Cloud location identifiers (not the placeholder "europe-west"/"africa-south" names in `DEC-TECH-005`'s original text); a six-candidate shortlist; a service matrix for Firestore/Functions/Cloud Run/Storage/App Check/Cloud Scheduler/Cloud Tasks/Pub/Sub/Secret Manager; directional (unmeasured) latency reasoning for Kigali/Bujumbura; pricing-tier findings; a legal-admissibility gate (via the companion [Legal Evidence Pack](evidence/DEC-LEGAL-006-cross-border-hosting-evidence-2026-07-18.md)); and an advisory (not final) two-option recommendation. **This pack builds directly on that evidence — re-verifying it against current official sources, extending the service matrix to the additional products this task requires (Hosting, Authentication, Remote Config, Analytics, Performance Monitoring, Crash Reporting, Extensions, Emulator), adding a seventh candidate (`europe-west8`) the prior pack had excluded, adding real (not purely directional) latency data for Nairobi and Kampala, and reformatting the output into the weighted matrix and three-option structure this task specifically requires.**

**What remains unresolved:** exactly one component of `DEC-TECH-005` — which Google Cloud region (or the `eur3` multi-region option) hosts the platform's Firebase/GCP resources. Everything else `DEC-TECH-005` originally implied (environment count, project isolation, promotion model, infrastructure-access governance) was resolved by the Cloud Environment & Deployment Strategy in Engineering Sprint 0A and is not reopened here. The region question also remains gated by `DEC-LEGAL-006` (cross-border hosting legal position), which this pack does not attempt to resolve — legal admissibility is treated as an input constraint, not an output of this document (§7).

**Why only the region choice remains open:** every other structural question a "Firebase region decision" might have implied (which environments exist, how code is promoted, who may create a project) already has a governing answer, established the day before this task, specifically so that resolving the region would not simultaneously require resolving those other questions. What's left is a genuinely technical comparison question — which this pack exists to answer with evidence, not to decide.

---

## 1. Engineering Comparison Methodology

- **Evidence hierarchy:** official Google Cloud/Firebase documentation (fetched directly in this pass, cited by URL) is treated as primary; the 2026-07-18 evidence pack's own primary sources are cited by reference rather than re-fetched where the underlying fact (e.g., Firestore's supported-location list) is not expected to have changed in one day; search-engine-synthesized findings are labeled as such and treated as secondary, consistent with the source-quality discipline established in the [prior Source Register](evidence/DEC-LEGAL-006-DEC-TECH-005-source-register-2026-07-18.md).
- **Facts vs. judgement:** every claim below is labeled either a **Fact** (directly sourced), an **Estimate** (inferred from related data, explicitly not a measurement), or **Engineering judgement** (this pack's own analytical conclusion, stated as such). This mirrors the discipline the 2026-07-18 pack established and does not relax it.
- **No fabricated precision:** where a specific millisecond figure, dollar amount, or SLA percentage was not found in a reviewed source, this pack states that directly rather than inventing a plausible-sounding number.
- **Candidate inclusion rule:** a region is evaluated in full if it supports Firestore (the platform's core data store — no candidate lacking Firestore support is viable regardless of any other factor) and is either geographically closest to the pilot market (Africa) or among the most service-complete, lowest-latency-to-Europe options previously shortlisted. Regions excluded from full evaluation are named with the specific reason for exclusion, not silently dropped.

---

## 2. Candidate Regions Evaluated

Building on the 2026-07-18 shortlist, with one addition (`europe-west8`) evaluated at this task's explicit request:

| Candidate | City / Country | Why evaluated |
|---|---|---|
| `africa-south1` | Johannesburg, South Africa | Google's only African region (opened January 2024); geographically closest to both Kigali and Bujumbura |
| `europe-west1` | St. Ghislain, Belgium | Most mature European region; Tier 1 pricing; broadest confirmed service support |
| `europe-west3` | Frankfurt, Germany | Firestore- and Cloud-Scheduler-supported; Tier 2 Functions pricing |
| `europe-west4` | Eemshaven, Netherlands | Tier 1 pricing; `eur3` multi-region member |
| `europe-west8` | Milan, Italy | **New in this pass** — Tier 1 Functions (Gen2), Firestore-supported; shares `africa-south1`'s Cloud Scheduler/Cloud Tasks gap (§3), making it a useful comparison point for whether that gap is an `africa-south1`-specific problem or a broader pattern among newer regions |
| `europe-west9` | Paris, France | Tier 1 pricing for Firestore/Functions; **not** Cloud-Scheduler-supported |
| `eur3` (multi-region) | Belgium + Netherlands (read-write), Finland (witness) | Firestore-only multi-region option combining `europe-west1`/`europe-west4` |

**Not further evaluated, with reasons:** `europe-west2` (London), `europe-west6` (Zürich), `europe-west10` (Berlin), `europe-west12` (Turin), `europe-north1`/`europe-north2`, `europe-central2`, `europe-southwest1`, `me-central1`/`me-central2`, and every non-European/non-African region — confirmed to exist as Google Cloud locations but offering no service-completeness, latency, or cost advantage over the seven candidates above that would justify full evaluation; the seven already span the geographically closest option, the most service-complete options, and (with `europe-west8`) a second data point on the Scheduler/Tasks gap pattern. This mirrors and extends the 2026-07-18 pack's own exclusion rationale rather than replacing it.

---

## 3. Firebase Platform Support

**Fact**, verified directly against current official Firebase/GCP documentation in this pass (URLs cited per row; where a finding matches the 2026-07-18 pack, that pack is cited alongside as corroboration, not as the sole source):

| Service | `africa-south1` | `europe-west1` | `europe-west3` | `europe-west4` | `europe-west8` | `europe-west9` |
|---|---|---|---|---|---|---|
| Firestore (regional) | ✅ | ✅ | ✅ | ✅ | ✅ **(new confirmation)** | ✅ |
| Firestore (`eur3` multi-region) | N/A | ✅ member | — | ✅ member | — | — |
| Cloud Functions (2nd gen) | ✅ Tier 1 | ✅ Tier 1 | ✅ Tier 2 | ✅ Tier 1 | ✅ **Tier 1 (new confirmation)** | ✅ Tier 1 |
| Cloud Run | ✅ Tier 2 | ✅ Tier 1 | not re-confirmed this pass | not re-confirmed this pass | not re-confirmed this pass | not re-confirmed this pass |
| Cloud Storage | ✅ (baseline-service guarantee, per prior pack) | ✅ | not re-confirmed | not re-confirmed | ✅ (Engineering judgement — established GCS region; Firebase Storage documentation states it "supports all available Cloud Storage locations" without enumerating every one by name) | not re-confirmed |
| Firebase Hosting | ✅ **not a location-scoped product** — Hosting is global/CDN-backed and is not among the products Firebase's own documentation lists as requiring a location setting | same | same | same | same | same |
| Firebase Authentication | ✅ **not a location-scoped product** (same finding as the 2026-07-18 pack — no project-level location-selection control; data-residency position not established by this pass, requires provider confirmation before legal reliance) | same | same | same | same | same |
| App Check | ✅ **not a location-scoped product** — no location-selection control identified in reviewed documentation | same | same | same | same | same |
| Remote Config | ✅ **not a location-scoped product** — not listed among products requiring a location setting | same | same | same | same | same |
| Analytics | ⚠️ **requires a location setting at project level** ("No default location. You must set this location.") — set once during project setup, governs reporting-data location for the whole project | same requirement, different value | same | same | same | same |
| Performance Monitoring | ✅ **not independently location-scoped** — not listed among products requiring a location setting; rides on the Analytics/project configuration | same | same | same | same | same |
| Crash Reporting | ✅ **not independently location-scoped** — same basis as Performance Monitoring | same | same | same | same | same |
| Extensions | ⚠️ **follows the region of the Cloud Functions Gen2 (Eventarc-triggered) deployment the extension installs into** — not independently location-scoped beyond that; no extension-specific regional restriction identified in this pass | same | same | same | same | same |
| Emulator Suite | ✅ **not a differentiator between candidates** — the Local Emulator Suite runs entirely on the developer's own machine and does not depend on which production region is eventually selected | same | same | same | same | same |
| Cloud Scheduler | ❌ **not supported** (documented cross-region HTTP-target workaround exists — see 2026-07-18 pack §2) | ✅ | ✅ | ✅ | ❌ **not supported (new confirmation — matches `africa-south1`'s gap)** | ❌ not supported |
| Cloud Tasks | ❌ **not supported** (unresolved architecture question — see 2026-07-18 pack §2) | ✅ | not re-confirmed | not re-confirmed | ❌ **not supported (new confirmation)** | not re-confirmed |
| Pub/Sub | ✅ (per prior pack) | ✅ | — | — | not re-confirmed | — |
| Secret Manager | ✅ (per prior pack) | ✅ | same | same | not re-confirmed | same |

**Sources for this section's new confirmations (fetched directly, 2026-07-19):** Firebase, *"Learn about locations for products and resources"* (firebase.google.com/docs/projects/locations) — confirms which products require a location setting (Firestore, Cloud Functions, Cloud Storage, Analytics) and which do not (Authentication, App Check, Remote Config, Hosting, Performance Monitoring, Crash Reporting, Extensions); Firebase, *"Cloud Functions locations"* (firebase.google.com/docs/functions/locations) — confirms `europe-west8` and `africa-south1` are both Tier 1, 2nd-gen-only; Firebase, *"Cloud Firestore locations"* (firebase.google.com/docs/firestore/locations) — confirms `europe-west8` Firestore support and the `eur3` composition; Google Cloud, *"Cloud Scheduler locations"* (docs.cloud.google.com/scheduler/docs/locations) — confirms `europe-west8` absent, alongside `africa-south1`; Google Cloud, *"Cloud Tasks locations"* (docs.cloud.google.com/tasks/docs/locations) — confirms `europe-west8` absent, alongside `africa-south1`; Firebase, *"Cloud Storage for Firebase locations"* (firebase.google.com/docs/storage/locations) — states Storage supports all standard Cloud Storage locations without enumerating every region by name, consistent with (not contradicting) the prior pack's baseline-service-guarantee reasoning.

**Key new finding:** `europe-west8` (Milan) shares `africa-south1`'s exact Cloud Scheduler and Cloud Tasks gap. This is engineering-relevant: it suggests the gap is a pattern affecting **newer or smaller** Google Cloud regions generally, not a limitation specific to Africa — which matters for how much weight the Scheduler/Tasks gap should carry against `africa-south1` specifically in the decision matrix (§9): it is a real architectural cost, but not evidence that African regions are categorically less capable than comparably-new European ones.

**Key finding carried forward unchanged from the 2026-07-18 pack:** none of Authentication, App Check, Remote Config, Hosting, Performance Monitoring, or Crash Reporting differentiate between any candidate region — they are either global services or follow the project's other regional settings. This means the platform-support comparison that actually differentiates candidates rests on four services: **Firestore, Cloud Functions, Cloud Scheduler, and Cloud Tasks** (Storage and Analytics require a location but were not found to differ in support across candidates, only in which value is set).

---

## 4. Latency

**Fact (new in this pass) vs. Estimate (carried forward), clearly separated:**

**Fact — Nairobi and Kampala now have real reference data**, not available in the 2026-07-18 pack (source: WonderNetwork, a third-party network-measurement service, `wondernetwork.com/pings/Nairobi`, accessed 2026-07-19):

| From Nairobi to: | Measured RTT |
|---|---|
| Dar es Salaam, Tanzania | 12.7 ms |
| Kampala, Uganda | 24.7 ms |
| Johannesburg, South Africa | 55.1 ms |
| Frankfurt, Germany | 140.4 ms |
| Amsterdam, Netherlands | 141.2 ms |
| London, United Kingdom | 170.7 ms |

This is a genuine measurement, not a directional estimate — and it corroborates the 2026-07-18 pack's directional reasoning with an actual number: from a major East African city, `africa-south1` (Johannesburg, ~55 ms) is measurably closer than any European candidate (~140–171 ms) by a factor of roughly 2.5–3×.

**Estimate — Kigali and Bujumbura specifically:** no direct measurement to either city was found in this pass (the same limitation the 2026-07-18 pack disclosed remains true). **Engineering judgement:** Rwanda and Burundi share East Africa's general submarine-cable topology (SEACOM/EASSy via the Indian Ocean coast, per the 2026-07-18 pack's T9) and are within the same broad regional internet-routing neighborhood as Nairobi and Kampala — Kampala in particular is directly on a common overland fiber path from Kigali. It is reasonable to estimate Kigali/Bujumbura-to-`africa-south1` latency in a broadly similar range to Nairobi's measured 55 ms (plausibly somewhat higher, given less-developed direct infrastructure), and Kigali/Bujumbura-to-Europe latency in a broadly similar range to Nairobi's measured 140–171 ms — but **this remains an estimate extrapolated from a nearby city's real measurement, not a measurement of Kigali or Bujumbura themselves.** The 2026-07-18 pack's recommended next step — commissioning an actual synthetic latency test from Kigali/Bujumbura vantage points, or using a tool such as GCPing.com or the Kentik Cloud Latency Map (both identified in this pass's research but not run, since neither offers a Kigali/Bujumbura-originating test node) — remains outstanding and is repeated as a condition in §12.

**Practical user impact (Engineering judgement, not a raw-number restatement):** for a mobile-first PWA serving purchase verification and reward-redemption flows (the platform's core loyalty loop, per PRD Sections 4–7), the difference between a ~55 ms and a ~155 ms round trip is unlikely to be perceptible as "slow" to an end user for any single request — both are well within normal web-interaction latency budgets, and the platform's UX is not latency-critical in the way real-time gaming or video calling would be. The difference becomes practically meaningful primarily in two cases: (a) request chains with multiple sequential round trips (e.g., a redemption flow validating several conditions in sequence before confirming), where a ~100 ms per-hop difference compounds; and (b) low-connectivity conditions already common in the pilot market (TRD's offline/limited-connectivity design considerations), where every additional round trip is proportionally more costly against an already-constrained connection. Neither factor makes latency a hard blocker for any candidate — it is a real but second-order consideration relative to platform-support gaps (§3) and legal admissibility (§7).

---

## 5. Reliability

**Fact:** `africa-south1` opened January 2024 (Google Cloud Blog, cited in the 2026-07-18 pack, T2) — roughly 18 months of operating history as of this pack's date. `europe-west1` is one of Google's original, most mature regions, with over a decade of operating history. `europe-west8` (Milan) is a comparably recent region to `africa-south1` (opened 2022) — shorter track record than `europe-west1`/`europe-west3`/`europe-west4`/`europe-west9`, though longer than `africa-south1`'s.

**Fact:** none of the candidates were found, in either this pass or the 2026-07-18 pass, to have a publicly reported history of unusual regional incidents — but a full Google Cloud Service Health incident-history review (`status.cloud.google.com/regional/africa` and the equivalent dashboards for each European candidate) was **not performed** in either research pass. This remains an open follow-up, not a confirmed "no incidents" finding.

**Fact:** Google's investment signal for `africa-south1` includes the region's continued existence and service expansion since its 2024 launch (it now supports Firestore, Functions Gen2, Cloud Run, Pub/Sub, and Secret Manager, per §3 — a reasonably complete core set for a region under two years old), which is evidence of active investment, not abandonment. **Engineering judgement:** this does not resolve the operating-history gap relative to `europe-west1`, but it does argue against treating `africa-south1` as an experimental or likely-to-be-deprecated region.

**Fact:** production suitability, in the narrow sense of "does Google offer the same SLA terms," was not found to differ by region in any source reviewed — Google's published Firestore/Functions/Cloud Run SLAs are typically stated as global commitments applying uniformly across supported regions, not region-specific percentages. No source in either research pass found a region-specific SLA carve-out for any candidate.

---

## 6. Cost

**Fact, carried forward and re-confirmed:** Cloud Functions pricing splits candidates into Tier 1 (`africa-south1`, `europe-west1`, `europe-west4`, `europe-west8`, `europe-west9`) and Tier 2 (`europe-west3`) — `europe-west3` alone carries a documented Functions cost disadvantage among the candidates evaluated.

**Fact:** Google Cloud's network-egress pricing varies by source region and destination — inter-region transfers run roughly $0.05–$0.14/GiB depending on the region pair, and internet egress (Premium Tier) starts around $0.12/GiB to North America/Europe/Asia (source: Google Cloud, "Network Service Tiers pricing," cited in the 2026-07-18 pack, T11 — not re-fetched in this pass since egress pricing structure is not expected to change region-by-region day to day).

**Assumption, not fact, stated as such (carried forward, not strengthened by this pass):** `africa-south1` and `europe-west8`, as newer/smaller regions, may carry a cost premium on compute or egress relative to the large, mature European regions — this remains an assumption based on Google's general regional-cost-tiering pattern, not an independently confirmed price comparison. Firestore's own per-region price table was not successfully retrieved in either research pass (tool/content-size limitation, not a finding of price uniformity).

**No exact monthly cost is estimated in this pack**, for the same reason the 2026-07-18 pack gave: a real cost estimate requires a confirmed region plus confirmed pilot-scale usage projections (daily active users, reads/writes per session, storage volume), neither of which exists at this stage. Producing a plausible-looking dollar figure without those inputs would be fabricated precision, which this pack's methodology (§1) explicitly avoids.

---

## 7. Disaster Recovery

This section supplies evidence; it does not restate TRD20 §20.47–20.58's already-governed backup/DR architecture or the Cloud Environment & Deployment Strategy §9's DR principles.

**Fact:** Firestore's database location cannot be changed after creation without a full data migration — a well-established, structural constraint of Firestore's architecture. Whatever region is chosen becomes effectively permanent for that database's lifetime. This applies identically to every candidate; it is not a differentiator between them, only a reason to treat this decision as high-stakes regardless of which candidate is preferred.

**Fact:** only `eur3` offers a Firestore multi-region option among the candidates evaluated; no African multi-region option exists in Google's current location list (confirmed directly in this pass — the only multi-region locations found for Firestore anywhere are `eur3`, `nam5`, and `nam7`). Choosing `africa-south1` or `europe-west8` therefore means accepting single-region Firestore durability (Google's own intra-region zone redundancy) as the ceiling, not a documented gap unique to those two — every single-region candidate shares this ceiling equally.

**Engineering judgement, consistent with Cloud Environment & Deployment Strategy §9's stated principle** ("region selection and disaster-recovery capability are linked, not independent choices"): `eur3`'s higher-availability guarantee is a genuine DR advantage, but it comes with the cost premium noted in §6 (assumption) and no equivalent multi-region concept for Cloud Functions — meaning a multi-region Firestore choice does not, by itself, produce a multi-region-resilient platform; Functions and Storage remain single-region regardless.

---

## 8. Expansion Readiness

**Fact/Engineering judgement, per country, building on the 2026-07-18 pack's high-level "future East African growth" note (§6 of that pack) with country-specific detail this task requires:**

| Future market | Distance/connectivity context (Fact, from §4 sources and general geography) | Expansion readiness observation (Engineering judgement) |
|---|---|---|
| **Rwanda** (pilot-adjacent; per the DEC-TECH-005 Decision Brief §0, the operator's own home jurisdiction) | Landlocked; same SEACOM/EASSy-dependent connectivity profile as Burundi | No differentiator vs. the pilot market itself — this is the baseline case this whole evaluation addresses |
| **Burundi** (pilot market) | Landlocked; no direct submarine landing; routes overland via Rwanda/Tanzania | Same as above — the pilot market itself |
| **Uganda** | Landlocked; Kampala measured at 24.7 ms from Nairobi (§4) — well-connected regionally | Any candidate viable from Uganda; `africa-south1`'s latency advantage (§4) extends here given Kampala's proximity to the same regional routing as Nairobi |
| **Kenya** | Coastal; hosts a major East African internet exchange (KIXP) and direct submarine cable landing; Nairobi measured at 55.1 ms to Johannesburg, 140–171 ms to Europe (§4) | Kenya is the best-connected candidate expansion market in this list — any region choice works technically here, but `africa-south1`'s latency advantage is real and measured, not estimated, for this specific market |
| **Tanzania** (future, explicitly named as future in the task) | Coastal (Dar es Salaam); measured at only 12.7 ms from Nairobi (§4) — the best-connected city in the dataset gathered | Strongly favors `africa-south1` if/when Tanzania expansion occurs — this is the clearest quantified latency case for the African candidate in this entire pack |
| **DRC** (future, explicitly named as future in the task) | Landlocked interior; connectivity profile not directly researched in this pass — no source reviewed addresses DRC-specific latency or cable topology | **Gap, disclosed rather than guessed:** no evidence gathered either way; DRC's eastern provinces (nearest to Rwanda/Burundi/Uganda) likely share similar overland-fiber dependency to Rwanda/Burundi, but this is not confirmed by any source in this pass and should not be relied upon without dedicated research if/when DRC expansion becomes concrete |

**Engineering judgement, synthesizing the table:** of the six future-expansion markets the task named, four (Rwanda, Burundi, Uganda, Kenya) have at least directional or measured evidence favoring `africa-south1`'s latency profile, and a fifth (Tanzania) has the single strongest quantified data point in this whole pack (12.7 ms from Nairobi) favoring it. Only DRC is a genuine evidence gap. This is a real point in `africa-south1`'s (and, by extension, any African-region choice's) favor for the platform's stated multi-country ambition — but it does not override the Cloud Scheduler/Cloud Tasks platform-support gap (§3), which is an architecture cost independent of how many countries the platform eventually serves.

---

## 9. Legal / Compliance (Technical Implications Only — Not Legal Advice)

**This section identifies technical implications requiring legal input. It does not provide legal advice, does not assess legal admissibility, and does not substitute for `DEC-LEGAL-006`.**

- **Cross-border hosting:** every candidate region in this pack is physically outside both Rwanda (the operator's home jurisdiction) and Burundi (the pilot market) — `africa-south1` (South Africa) and every European candidate alike. This is a technical fact, not a legal conclusion: whether any candidate is *legally* acceptable for hosting Rwanda-operated, Burundi-pilot-user data is exactly what `DEC-LEGAL-006` exists to determine, and this pack takes no position on it.
- **Data residency:** per §3, Firebase Authentication does not expose a location-selection control and its precise data-residency position was not established by this pass or the 2026-07-18 pass — this is a technical gap requiring direct confirmation from Google's service terms or the provider directly, flagged (not resolved) identically to the prior pack.
- **Provider transparency:** Google publishes region/location documentation for every service checked in §3 at the URLs cited — this pack found no service where Google withholds or obscures which region a customer's data is stored in (with the caveat that Authentication's *specific* data-residency answer, as opposed to its lack of a location *control*, was not independently found in either pass).
- **Customer disclosure implications (technical observation, not a legal recommendation):** if a non-African region is ultimately selected, the platform's privacy/terms documentation would need to accurately describe that customer and business data is processed outside both Rwanda and Burundi — a factual disclosure requirement whose specific legal content (what must be disclosed, in what form, under which law) is `DEC-LEGAL-006`'s and legal counsel's determination, not this pack's.
- **Explicit statement required by this task:** **legal advice is required before any candidate region in this pack can be treated as legally cleared.** This pack's technical findings do not change the 2026-07-18 pack's legal-admissibility gate (§0 of that pack) — every candidate remains "potentially admissible, pending confirmation," and this remains true regardless of which candidate scores highest on the engineering criteria below.

---

## 10. Operational Simplicity

**Fact/Engineering judgement:**

| Consideration | Single-region European candidate (e.g. `europe-west1`) | `africa-south1` or `europe-west8` alone | `eur3` multi-region |
|---|---|---|---|
| Onboarding complexity | Lowest — every checked service (§3) available in one region, no workaround needed | Higher — Cloud Scheduler and Cloud Tasks require either a documented cross-region pattern (Scheduler) or an unresolved architecture question (Tasks), per §3 and the 2026-07-18 pack §2 | Moderate — Firestore setup is a named multi-region location, not materially harder to configure than single-region, but Functions/Storage still require a separate single-region choice |
| Supportability | Highest — one region to reason about for logs, monitoring, incident response | Lower — a mixed-region design (if adopted to cover Scheduler/Tasks) means on-call staff must reason about two regions for one platform | Moderate — one Firestore location, but still a separate Functions/Storage region to track |
| Maintenance | Lowest ongoing overhead | Higher if a mixed-region workaround is adopted; unchanged if the platform simply avoids Cloud Tasks entirely (e.g., using Pub/Sub-based fan-out instead, per the 2026-07-18 pack §2's alternative) | Similar to single-region for Functions/Storage; Firestore itself is Google-managed regardless of region count |
| Monitoring | TRD20 §20.22–20.36's observability architecture applies identically to any candidate — not a differentiator per se, but a mixed-region design means monitoring must be configured to correlate across two regions, which TRD20 does not by itself simplify | same caveat as above | same caveat, narrower (Firestore-only) |
| Deployment simplicity | Highest — the Cloud Environment & Deployment Strategy's promotion model (§3 of that document) applies most cleanly to a single region per environment | Requires deciding, at the infrastructure-governance level (Cloud Environment & Deployment Strategy §7), whether a second region for Scheduler-dependent functions is itself a new project-level decision or a same-project multi-region deployment target — not yet decided by any governance document | Requires the same single-region decision for Functions/Storage as any other candidate, plus the multi-region Firestore setup itself |

---

## 11. Decision Matrix (Weighted)

Weights follow the Cloud Environment & Deployment Strategy §5 priority order directly (legal compliance, service completeness, operational maturity, disaster recovery, latency) plus cost and operational simplicity, added because they were explicitly required as evaluation criteria by this task even though §5 does not name them as separate top-level factors. **Weight justification:** legal compliance is weighted highest because no technical advantage can compensate for an inadmissible jurisdiction (a hard gate, not a trade-off); service completeness is second because a missing service (Cloud Scheduler/Tasks) is an architecture cost paid on every deployment, not a one-time cost; the remaining factors are weighted in the order §5 itself states, with cost and operational simplicity added at lower weight since they are real but more tolerant of a suboptimal choice than the factors above them.

| Criterion | Weight | `africa-south1` | `europe-west1` | `europe-west8` | `eur3` |
|---|---|---|---|---|---|
| Legal compliance (gate, §9) | 25% | Potentially admissible, pending confirmation — same as every candidate | same | same | same |
| Service completeness (§3) | 20% | 3/5 — Firestore/Functions/Storage ✅; Scheduler/Tasks ❌ | 5/5 — all checked services ✅ | 3/5 — same gap as `africa-south1` | 4/5 — Firestore multi-region ✅; Functions/Storage still single-region elsewhere |
| Operational maturity (§5) | 15% | Newer (2024), shorter track record, active service investment | Most mature, longest track record | Newer (2022), shorter track record than `europe-west1` | Inherits `europe-west1`/`europe-west4`'s maturity |
| Disaster recovery (§7) | 15% | Single-region ceiling (shared by all non-`eur3` candidates) | same | same | Highest — only multi-region Firestore option |
| Latency (§4) | 15% | Best measured/estimated (Nairobi 55 ms; Kigali/Bujumbura estimated similar) | Worst (Nairobi 140–171 ms; Kigali/Bujumbura estimated similar) | Same as `europe-west1` tier (no African-specific advantage) | Same as `europe-west1` tier |
| Cost (§6) | 5% | Tier 1 Functions; possible unconfirmed premium (assumption) | Tier 1 Functions; mature/baseline pricing | Tier 1 Functions; possible unconfirmed premium (assumption) | Likely premium (assumption) vs. single-region |
| Operational simplicity (§10) | 5% | Lower if mixed-region adopted | Highest | Lower if mixed-region adopted | Moderate |

**This matrix is presented as a structured comparison, not a scored ranking with a computed winner** — several rows (legal compliance, latency estimates for Kigali/Bujumbura, cost) rest on evidence this pack itself labels incomplete (§9, §4, §6), and collapsing them into a single weighted number would imply a false precision this pack's own methodology (§1) rejects. The three options in §12 interpret this matrix under different risk tolerances rather than mechanically computing a winner from it.

---

## 12. Recommendation — Three Options (Advisory Only — Not Final)

### Option A — Engineering Recommendation: `europe-west1`

**Strengths:** the only candidate with a complete confirmed service match to the platform's Version 1 architecture (§3) — no Cloud Scheduler/Cloud Tasks workaround needed, no mixed-region design required, lowest operational complexity (§10), most mature operating history (§5), Tier 1 pricing.
**Weaknesses:** highest latency among the candidates evaluated (§4) — though, per §4's practical-impact analysis, not latency-critical for this platform's actual usage pattern; no continent-proximity advantage for future East African expansion (§8), though it remains fully viable for every expansion market named.
**Trade-off summary:** trades the largest measured latency gap for the lowest architecture risk and zero unresolved service gaps. This is the recommendation an engineering team optimizing for "ship Phase 1 with the fewest open technical questions" would make.

### Option B — Conservative Recommendation: `eur3` multi-region

**Strengths:** highest disaster-recovery guarantee of any candidate (§7) — the only option with multi-region Firestore durability; still avoids the Cloud Scheduler/Cloud Tasks gap entirely, since it is built from `europe-west1`/`europe-west4`, both fully service-complete (§3).
**Weaknesses:** likely cost premium (assumption, §6); no equivalent multi-region concept for Cloud Functions, so the "conservative" framing applies specifically to Firestore durability, not to the whole platform's resilience; same latency profile as the single-region European candidates (§4).
**Trade-off summary:** trades cost and a partial (Firestore-only) resilience gain for the strongest documented DR posture among all candidates. This is the recommendation a team prioritizing "the region choice, once made, is permanent (§7) — pay for maximum durability now" would make.

### Option C — Future-Scale Recommendation: `africa-south1`

**Strengths:** measurably lowest latency for the pilot market and the strongest-evidenced future-expansion market (Tanzania, 12.7 ms from Nairobi, §8); only candidate with continent-proximity for the platform's stated multi-country East African ambition; active Google investment signal (service set has grown since 2024 launch, §5).
**Weaknesses:** the Cloud Scheduler/Cloud Tasks gap is real and unresolved for Cloud Tasks specifically (§3) — TRD22 §22.11 names scheduled functions as a Phase 1 deliverable, so this is not a hypothetical future problem; shortest operating track record; possible unconfirmed cost premium (§6); requires either a mixed-region design (added operational complexity, §10) or re-architecting away from Cloud Tasks (e.g., toward Pub/Sub-based fan-out, already confirmed available, §3) before Phase 1 can be called architecture-complete.
**Trade-off summary:** trades a known, scoped architecture cost (Scheduler/Tasks) for the best latency and expansion-readiness profile of any candidate. This is the recommendation a team optimizing for "the pilot market and its most-likely-next markets get the best possible experience, and we solve the Scheduler/Tasks gap once, deliberately" would make.

**No option is presented as superior to the others by this pack.** Each answers a different question the Founder must weigh: fewest open technical questions (A), strongest durability guarantee (B), or best latency/expansion profile at the cost of a known, solvable architecture gap (C).

---

## 13. Founder Decision Summary

| Option | Engineering Score* | Advantages | Risks | Suitable When |
|---|---|---|---|---|
| **A — `europe-west1`** | Highest on service completeness + operational maturity; lowest on latency | Zero unresolved service gaps; lowest operational complexity; most mature region; Tier 1 pricing | Highest measured/estimated latency to the pilot market; no continent-proximity for future expansion | Shipping Phase 1 with minimal open technical risk is the priority, and latency is confirmed (§4) to be a second-order concern for this platform's usage pattern |
| **B — `eur3` multi-region** | Highest on disaster recovery; matches Option A on service completeness | Strongest Firestore durability guarantee of any candidate; no Scheduler/Tasks gap | Likely cost premium (unconfirmed); resilience gain is Firestore-only, not platform-wide; same latency profile as Option A | Data durability against a regional-level incident is judged more important than latency or cost, and the cost premium is acceptable once confirmed |
| **C — `africa-south1`** | Highest on latency + expansion readiness; lowest on service completeness | Best pilot-market and future-expansion latency profile (Tanzania especially, §8); active Google investment; continent proximity | Cloud Tasks is an unresolved architecture question; Cloud Scheduler needs a deliberate cross-region workaround; shortest operating track record; possible cost premium | Pilot-market and future East African expansion performance is the priority, and the team is willing to resolve the Cloud Scheduler/Cloud Tasks gap as a scoped Phase 1 engineering task rather than avoid it |

*"Engineering Score" here is qualitative — highest/lowest on named criteria — not a computed numeric total, consistent with §11's explicit rejection of a false-precision single ranking.

**Outstanding conditions before any option can be confirmed** (carried forward from the 2026-07-18 pack, not weakened by this pass): (1) `DEC-LEGAL-006`'s cross-border hosting position must be resolved or provisionally confirmed for the chosen candidate; (2) an actual Kigali/Bujumbura latency measurement should replace this pack's Nairobi-proxy estimate before final confirmation; (3) Firestore/Storage per-region pricing should be confirmed directly via Google's pricing calculator rather than inferred from Functions tiering; (4) if Option C is chosen, the Cloud Scheduler cross-region pattern and the Cloud Tasks architecture question (§3, and the 2026-07-18 pack §2's detailed sub-questions) must be resolved as explicit Phase 1 engineering work before Firebase project creation is treated as unblocked; (5) Firebase Authentication's actual data-residency position should be confirmed directly from Google before final legal reliance.

---

**No region is selected or treated as final by this evidence pack. `DEC-TECH-005` remains `OPEN_ENGINEERING`.**
