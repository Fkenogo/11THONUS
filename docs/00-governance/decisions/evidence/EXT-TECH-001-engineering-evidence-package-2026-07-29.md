> **Title:** EXT-TECH-001 — Engineering Evidence Package
> **Status:** Complete. Evidence-gathering only — no governance decision made or recorded, no code implemented, no application code modified.
> **Date:** 2026-07-29
> **Classification:** Technical evidence package. Primary input into `DEC-PROV-004`; supporting input into `DEC-SEC-001`. Per [`ENG-P2-RES-000`](../../../05-implementation/roadmap/ENG-P2-RES-000-capability-2-resolution-plan.md) `RES-001`.

# EXT-TECH-001 — Engineering Evidence Package

## 1. Executive Summary

This package gathers the engineering evidence needed to resolve [`EXT-TECH-001`](../external-dependencies-register.md) — Firebase phone-OTP delivery to Burundi numbers (reliability, cost, abuse controls, test-number strategy) — the single item the Resolution Plan's dependency analysis identified as the sole structural blocker preventing any Capability 2 engineering work from starting.

**Central finding, established before any other evidence below is meaningful:** the classic Firebase Authentication phone sign-in product (SMS one-time password, the product `TRD12` §12.4.1, `PRD2`, and `OTD-004` actually specify) is a **different Firebase product** from "Firebase Phone Number Verification" (Firebase PNV), a newer carrier-network-based silent-verification product. Firebase PNV's own pricing documentation lists only 8 countries (Finland, France, Germany, Indonesia, Malaysia, Pakistan, Spain, plus Enterprise) — a narrow list that does **not** apply to classic phone sign-in and must not be read as "Firebase doesn't support Burundi." This distinction was verified directly against Firebase's own documentation during this research and is flagged because conflating the two products would have produced a materially wrong conclusion.

With that distinction established, this package finds: Burundi's telecom infrastructure is technically capable of carrying SMS (near-universal 2G coverage across three carriers); classic Firebase Auth phone sign-in has no first-party country restriction list (it is gated instead by an explicit, per-project SMS Region Policy the operator must configure); and at least one third-party African SMS aggregator (Africa's Talking) explicitly advertises Burundi coverage as a viable alternative/fallback route for `DEC-PROV-004` to evaluate. **What remains genuinely unconfirmed, and cannot be resolved by documentation research alone, is direct empirical proof that Firebase's own SMS delivery actually reaches Burundi numbers reliably** — no first-party Firebase source confirms or excludes Burundi specifically. §11 gives the engineering recommendation this produces.

## 2. Evidence Gathered

Two categories of evidence were used, kept explicitly separate throughout this document per the task's own requirement:

- **Repository evidence** (verified facts, directly cited): `docs/00-governance/decisions/external-dependencies-register.md` (`EXT-TECH-001` row); `docs/00-governance/decisions/decision-register.md` (`DEC-SEC-001`, `DEC-PROV-004` entries); `docs/02-technical/trd/12-security-and-access-control.md` §12.4.1; `docs/02-technical/trd/23-traceability-and-completion-review.md` (`OTD-004`); `docs/01-product/prd/02-customer-registration-and-identity.md` §21 (Phone Number Changes) and FR-CI-004; `apps/web/src/infrastructure/firebase/auth.ts` (existing Auth-emulator client init from `ENG-P1-001`); `firebase.json` (Auth emulator port configuration); a repository-wide search for any existing phone-auth-specific code in `functions/src` (none found).
- **External technical evidence** (verified via live web research on 2026-07-29, cited by source at each claim; distinguished from engineering assumptions where research was inconclusive): Firebase's own documentation (`firebase.google.com/docs/auth/*`, `firebase.google.com/docs/phone-number-verification/*`, `firebase.google.com/docs/auth/limits`), Google Cloud Identity Platform's SMS region policy documentation, and third-party sources on Burundi telecom infrastructure and African SMS aggregator coverage.

## 3. Firebase Capability Assessment

**Product identification (critical distinction, verified fact):** Firebase offers two SMS-based phone products. (1) **Classic Firebase Authentication phone sign-in** — the standard SMS-OTP sign-in flow, integrated with the Firebase Auth SDK already present in this repository (`apps/web/src/infrastructure/firebase/auth.ts`). This is the product `TRD12` §12.4.1 specifies ("mobile phone number with one-time password") and the product `OTD-004`/`EXT-TECH-001` are actually asking about. (2) **Firebase Phone Number Verification (PNV)** — a separate, newer, carrier-network silent-verification product with its own narrow 8-country pricing table. **This evidence package concerns product (1) only.**

**Supported capability (verified fact):** classic Firebase Auth phone sign-in has no published fixed list of supported/unsupported countries. Instead, delivery is gated by a **per-project SMS Region Policy** (allowlist-only or denylist-only, mutually exclusive) that the operator must explicitly configure — "for new projects, the default policy allows no regions" (Google Cloud Identity Platform documentation, `docs.cloud.google.com/identity-platform/docs/admin/sms-regions`). This means Burundi (+257) is neither confirmed supported nor confirmed excluded by Firebase's own policy documentation — it must be explicitly allowlisted (or simply not denylisted) by whoever configures the project, and the actual SMS delivery for that region must then be tested directly.

**Operational requirements (verified facts):**
- Since September 2024, phone authentication **requires a Cloud Billing account** (Blaze/pay-as-you-go plan) — the free Spark plan has zero SMS allowance. This is now a hard prerequisite to enable phone auth at all, not an optional upgrade for scale (`firebase.google.com/docs/auth/limits`, corroborated by Firebase's own FAQ and multiple developer-reported `auth/billing-not-enabled` errors).
- Web clients require **reCAPTCHA** verification (invisible or a visible widget) before an SMS is sent, "to prevent abuse, such as by ensuring that the phone number verification request comes from one of your app's allowed domains" (`firebase.google.com/docs/auth/web/phone-auth`).
- Up to **10 test phone numbers** can be registered per project with fixed 6-digit codes, usable in development and CI without consuming quota or sending a real SMS — directly relevant to §7 (Test Strategy).

**Known limitations (verified facts):**
- Standard project SMS quotas: **900 SMS/minute, 3,000 SMS/day**, plus per-IP throttling (50/minute, 500/hour) and an unspecified per-phone-number throttle. Higher limits require either a quota-increase request to Firebase support (minimum two weeks' notice cited in Firebase's own limits documentation) or migration to Google Cloud Identity Platform.
- SMS delivery itself is **not guaranteed at 100%** by any telecom operator worldwide — Firebase's own developer guidance states this directly and recommends offering a fallback authentication method, which aligns with — and independently reinforces — `DEC-SEC-001`'s own requirement to "define the fallback."

**Configuration prerequisites (verified facts, action items for `RES-002`/`RES-003`, not performed by this task):** a Blaze-plan billing account attached to the project; the SMS Region Policy explicitly configured to allow Burundi; reCAPTCHA configured for the web client; test phone numbers configured for the development/CI pipeline.

## 4. Burundi SMS Delivery Assessment

**Expected delivery model (verified fact, external source):** SMS in Burundi rides on standard 2G/GSM signaling infrastructure across three national mobile operators — **Lumitel** (Viettel-operated, the strongest network with the best 3G/4G coverage nationally), **Econet Leo**, and **Onatel** — following market consolidation that closed smaller competitors. Population coverage figures cited: approximately 97% 2G, 53% 3G, 32% 4G/LTE. Because SMS delivery depends on 2G/GSM signaling rather than data connectivity, the near-universal 2G footprint is the technically relevant coverage figure for OTP delivery, not the lower 3G/4G figures.

**Carrier considerations (verified fact, with an assumption flagged):** all three carriers are commercially active and offer standard voice/SMS/data plans. **Assumption, not verified:** which specific carrier(s) Firebase's own SMS delivery infrastructure routes through for Burundi, and whether delivery quality differs materially by carrier, is not established by any source found in this research — this can only be established by a direct delivery test (§10).

**Operational reliability (mixed — verified market facts, unconfirmed delivery facts):** the carriers' market presence and 2G footprint are verified. Whether Firebase's aggregator/carrier relationships for Burundi specifically produce reliable delivery is **not verified** — no first-party Firebase source, and no third-party source found in this research, makes a direct claim about Firebase-to-Burundi delivery success rates.

**Known constraints (verified fact):** national 4G/LTE coverage remains partial (~32%), with government/operator investment (cited: a $20M Lumitel commitment targeting 75% 4G coverage by 2030, and a Universal Service Fund rural 4G rollout) still in progress — relevant context for data-dependent parts of the registration flow, though not directly determinative of SMS-specific delivery.

**Production readiness considerations (assumption, disclosed as such):** given the unconfirmed first-party delivery evidence, this package's engineering assumption is that Firebase-native delivery to Burundi should be treated as **unproven until directly tested**, consistent with the External Dependencies Register's own existing framing of `EXT-TECH-001`'s current assumption ("Delivery is feasible (A-untested)") — this research does not change that classification, it narrows what remains to be tested.

## 5. OTP Reliability Assessment

**Delivery expectations (verified fact):** Firebase's own guidance states SMS delivery is inherently imperfect industry-wide and explicitly recommends a fallback sign-in method — directly supporting, not merely permitting, `DEC-SEC-001`'s own scope (confirm the primary approach and define the fallback).

**Retry behaviour (engineering consideration, not a Firebase-enforced mechanism):** Firebase does not itself impose a resend cooldown beyond its abuse-prevention throttles (§6); a resend/retry UX pattern (e.g., a client-side resend timer) is an application-design responsibility for `ENG-P2-001`, out of scope for this evidence-only task.

**Timeout considerations (engineering consideration):** OTP code expiry is a standard, configurable behavior of the Firebase Auth phone flow; specific expiry-window tuning is an implementation decision for `ENG-P2-001`, not addressed further here since this task does not implement.

**User experience implications (engineering consideration, grounded in §4's evidence):** given Burundi's 2G-dominant coverage, SMS-based OTP is likely to reach customers more reliably than a data-dependent verification channel would — a factor worth weighing if `DEC-SEC-001`'s fallback discussion considers an app-based or data-dependent alternative.

## 6. Abuse Protection Assessment

Repository-and-documentation-grounded review of available Firebase mechanisms (verified facts, per §3):
- **Rate limiting:** per-project (900/min, 3,000/day), per-IP (50/min, 500/hour), and an unspecified per-phone-number throttle.
- **Repeated requests:** the per-phone-number throttle specifically targets repeated requests to the same number; Firebase's own guidance recommends monitoring the `verification_success_rate` metric as an abuse signal ("a low `verification_success_rate` can indicate abuse, especially in a region in which you wouldn't expect to have users") — directly actionable for whoever operates the eventual production project.
- **Fraud prevention:** reCAPTCHA (web) is mandatory and is Firebase's primary bot/automation defense for phone sign-in.
- **Automated abuse mitigation:** the SMS Region Policy itself functions as an abuse-mitigation control — a denylist/allowlist prevents SMS being sent to regions with no legitimate user base, and Firebase's own guidance recommends configuring it explicitly rather than relying on defaults.

No repository evidence or external evidence found indicates any of these mechanisms are inadequate for this project's scale; this is a capability inventory, not a sufficiency judgment (which belongs to `DEC-PROV-004`/`DEC-SEC-001`, not this task).

## 7. Test Strategy

**Development:** the Firebase Auth Emulator is already integrated (`apps/web/src/infrastructure/firebase/auth.ts`, `firebase.json` port 9099, from `ENG-P1-001`) — no phone-auth-specific emulator work is required beyond what already exists; the emulator does not send real SMS.
**QA:** Firebase's up-to-10 test phone number feature (fixed 6-digit codes, no real SMS, no quota consumption) is directly applicable to CI and manual QA once a real project exists, avoiding both cost and rate-limit exposure during automated testing.
**Production verification:** a small, deliberate real-SMS test against each of Burundi's three carriers (Lumitel, Econet Leo, Onatel), using a Blaze-plan project with the SMS Region Policy allowlisting Burundi, is the only way to close the evidence gap identified in §4 and §10 — this is a recommended next action, not performed by this task (see Constraints).
**Test-number management:** the 10-test-number limit should be allocated deliberately — e.g., reserved for CI/automated tests plus a small number for manual QA — since it is a hard per-project ceiling, not a pool that can be expanded.

## 8. Operational Considerations

**Monitoring:** Firebase Console's "SMS Usage" tab reports send counts and `verification_success_rate` per project — the primary first-party monitoring surface.
**Diagnostics:** `status.firebase.google.com` publishes Authentication-service incidents; several publicly filed SDK issues (Android/Flutter) describe cases where Firebase's own usage dashboard shows an SMS as sent while a user reports non-receipt — a known class of diagnostic ambiguity to plan for operationally (e.g., a "didn't receive a code" support path feeding into the fallback `DEC-SEC-001` defines).
**Support implications:** standard Firebase support channels exist; quota increases and delivery-anomaly investigation both benefit from (and in the quota case, formally require) advance lead time — not an instant-turnaround channel.
**Operational ownership:** per the Decision Register, `EXT-TECH-001`'s evidence-gathering owner is the Engineering Lead — this package's findings should route back to that role for the `RES-001` completion criteria in the Resolution Plan.

## 9. Cost Considerations

Engineering considerations only, per the task's explicit constraint — no commercial recommendation is made here.

- **SMS costs:** per-SMS pricing for classic Firebase Auth phone sign-in varies by country, with figures cited across sources ranging from roughly $0.01 (US/Canada/India) to $0.34–$0.46 at the most expensive end; **no Burundi-specific tier was found in any public Firebase pricing table** — this figure can only be established empirically once a Blaze project sends real SMS to Burundi numbers, which is a small, boundable cost to incur as part of the recommended delivery test (§10).
- **Authentication costs:** the Blaze-plan billing-account requirement itself is now a fixed prerequisite cost of enabling phone auth at all (not merely a scale-driven cost), independent of SMS volume — an engineering planning fact `RES-002` should account for.
- **Operational scaling:** the documented quota tiers (900/min, 3,000/day on standard Firebase Auth; higher via Google Cloud Identity Platform) give a concrete planning ceiling; whether this project's expected registration volume approaches those limits is outside this evidence-gathering task's scope (a product/business-volume question, not an engineering-evidence one).
- **Third-party alternative:** at least one African SMS aggregator (Africa's Talking) explicitly advertises Burundi coverage and OTP as a primary use case, giving `DEC-PROV-004`'s "Firebase-native OTP vs. external SMS route" question genuine option content on the external-route side — cost comparison between the two routes is a `DEC-PROV-004` question, not resolved here.

## 10. Risk Assessment

- **Technical risk — unconfirmed first-party delivery to Burundi.** No Firebase or Google Cloud source found in this research directly confirms or excludes Burundi for classic phone sign-in SMS delivery. This is the evidence gap `EXT-TECH-001` exists to close, and it is not closeable through documentation research alone. **Mitigation:** a direct, real-SMS delivery test against all three Burundi carriers, using an actual Blaze-plan project (dev/staging environments are already provisioned per `ENG-P1-001`) — this is the single most decisive remaining action.
- **Operational risk — SMS Region Policy misconfiguration.** Because the default policy allows *no* regions, a project that is provisioned but never has Burundi explicitly allowlisted would silently fail every customer registration attempt with no application-level error distinguishing it from a general delivery failure. **Mitigation:** make SMS Region Policy configuration an explicit, checked step in `RES-002`'s completion criteria, not an implicit assumption.
- **Implementation risk — product conflation.** This research itself demonstrates the risk directly: an initial search surfaced Firebase PNV's narrow 8-country pricing table, which — if mistaken for classic phone sign-in's country support — would have produced a false "Burundi is unsupported" conclusion. **Mitigation:** this distinction is now explicitly documented (§3) so future work referencing this evidence package does not repeat the error.
- **Cost risk — unbounded quota-increase or support-escalation lead time.** Firebase's own limits documentation cites a minimum two-week lead time for quota adjustments. **Mitigation:** factor this lead time into any pilot-launch timeline that depends on SMS volume above the standard 3,000/day ceiling.

## 11. Engineering Recommendation

**Is sufficient evidence now available to prepare `DEC-PROV-004`? Partially — sufficient to draft the decision's options and evaluation criteria, but not sufficient to close it without one further, narrowly-scoped empirical step.**

This package establishes real option content for `DEC-PROV-004` (Firebase-native OTP vs. external SMS route): Firebase-native is technically viable in principle (no first-party exclusion of Burundi, adequate abuse controls, a workable quota ceiling, and a real cost path once measured), and at least one credible external-route alternative (Africa's Talking) explicitly supports Burundi today. Burundi's telecom infrastructure (near-universal 2G) is technically capable of supporting either route. `DEC-SEC-001`'s fallback-definition work is independently reinforced by Firebase's own reliability guidance, not merely permitted by it.

What this package cannot supply — because it is not obtainable from documentation research — is direct, empirical proof of Firebase-native SMS delivery success to real Burundi numbers on each of the three carriers. **Recommendation:** proceed with drafting `DEC-PROV-004` using this package as the primary technical input, but treat a real-SMS delivery test (§7, §10) as a required, bounded, low-cost precursor step before the decision is finalized — not a reason to delay `RES-002` from starting, since the governance-prerequisite and option-drafting work in `RES-002` can proceed in parallel with that test.

## 12. Files Created or Modified

**Created:** `docs/00-governance/decisions/evidence/EXT-TECH-001-engineering-evidence-package-2026-07-29.md`; `docs/changes/IMPLEMENTATION_CHANGES.md` (append). **Modified:** none. No application code, governance document, or decision was changed.

## 13. Commands Executed

`grep`/direct reads of `docs/00-governance/decisions/external-dependencies-register.md`, `docs/00-governance/decisions/decision-register.md`, `docs/02-technical/trd/12-security-and-access-control.md`, `docs/02-technical/trd/23-traceability-and-completion-review.md`, `docs/01-product/prd/02-customer-registration-and-identity.md`; direct reads of `apps/web/src/infrastructure/firebase/auth.ts` and `firebase.json`; a repository-wide `find`/`grep` for existing phone-auth-specific code in `functions/src` (none found, confirming no implementation has begun); live web research (`WebSearch`/`WebFetch`) against `firebase.google.com` (phone-number-verification overview and pricing, web phone-auth guide, auth limits), `docs.cloud.google.com` (Identity Platform SMS region policy), and third-party sources on Burundi telecom infrastructure and African SMS aggregator coverage, each cited inline at the specific claim it supports.

## 14. Dependencies Added

None.

## 15. Configuration Changes

None. The Blaze-plan billing account, SMS Region Policy, reCAPTCHA configuration, and test-phone-number setup identified in §3/§7 are documented as prerequisites for `RES-002`/`RES-003` to perform — none were configured by this task.

## 16. Rollback Instructions

`git revert` of this task's own commit — a single new evidence-package document plus one changes-log append.

## 17. Markdown Engineering Evidence Package

This document: [`docs/00-governance/decisions/evidence/EXT-TECH-001-engineering-evidence-package-2026-07-29.md`](EXT-TECH-001-engineering-evidence-package-2026-07-29.md).

## 18. Changes Log

Updated: [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../../changes/IMPLEMENTATION_CHANGES.md).
