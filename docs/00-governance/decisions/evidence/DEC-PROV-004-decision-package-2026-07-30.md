> **Title:** DEC-PROV-004 — Decision Package
> **Status:** Decision package prepared. **`DEC-PROV-004` itself has not been recorded, approved, or closed by this task** — no Decision Register field was changed, no Founder decision was made. Per `RES-002`'s own task brief: "This task prepares the decision. It does not record or approve the decision."
> **Date:** 2026-07-30
> **Classification:** Engineering decision package. Primary input: `RES-001`'s [Engineering Evidence Package](EXT-TECH-001-engineering-evidence-package-2026-07-29.md). Per [`ENG-P2-RES-000`](../../../05-implementation/roadmap/ENG-P2-RES-000-capability-2-resolution-plan.md) `RES-002`.

# DEC-PROV-004 — Decision Package

## 1. Executive Summary

This package converts `RES-001`'s Engineering Evidence Package into a structured decision package for `DEC-PROV-004` — "Firebase-native OTP vs external SMS route for Burundi numbers." Two realistic, evidence-supported options exist: **Firebase-native** phone sign-in (the standard product already integrated into this repository's Auth client) and **external SMS route** via a third-party African SMS aggregator (Africa's Talking is the only one `RES-001` found with an explicit, publicly-advertised Burundi coverage claim). Both are technically viable in principle; neither has been empirically confirmed to deliver reliably to Burundi numbers, because `RES-001`'s own central conclusion was that this proof requires a real-SMS delivery test that has not yet been performed.

**Preferred recommendation: Firebase-native OTP, conditional on a real-SMS delivery test against all three Burundi carriers before final Founder countersign.** This is a conditional recommendation, not an unconditional one — see §6 and §9. **Decision readiness: Ready with Conditions** (§8) — the Founder can review and provisionally approve this package now, but final countersign should be contingent on the delivery-test result, consistent with `RES-001`'s own recommendation that this evidence gap "cannot be resolved by documentation research alone."

## 2. Decision Context

**Why `DEC-PROV-004` exists:** the Decision Register records it as `OPEN_PROVIDER`, `Priority: D1`, asking: "Firebase-native OTP vs external SMS route for Burundi numbers." It blocks customer authentication and is one of the four D1 decisions gating `ENG-P2-001` (Customer Identity).

**The engineering problem it addresses:** `TRD12` §12.4.1 specifies mobile phone number with one-time password as the preferred customer authentication method. Delivering that OTP to a Burundi phone number requires choosing a concrete SMS delivery mechanism — either Firebase's own built-in phone-auth SMS sending, or routing OTP delivery through an external, third-party SMS provider integrated into a custom authentication flow. `DEC-PROV-004` is the decision that selects between these two mechanisms.

**Relationship to `EXT-TECH-001`:** `DEC-PROV-004`'s own `Dependencies` field in the Decision Register names `EXT-TECH-001` directly — the decision cannot be made on a sound evidentiary basis until the technical evidence `EXT-TECH-001` describes (Firebase phone-OTP delivery to Burundi numbers: reliability, cost, abuse controls, test-number strategy) exists. `RES-001` produced that evidence. **Disclosed, not resolved, by this task:** `DEC-PROV-004`'s `Dependencies` field also names `DEC-SEC-001` — the Resolution Plan's own `RES-002` scope identifies this as a literal governance-prerequisite edge that must be formally addressed (waived, corrected, or the two decisions closed together) before `DEC-PROV-004` can actually close under the Decision Register's own rules. This task brief does not ask this package to perform that governance action, and it has not been performed — it remains an open item, carried into §8/§9 below.

## 3. Evidence Summary

All evidence below traces to `RES-001`'s [Engineering Evidence Package](EXT-TECH-001-engineering-evidence-package-2026-07-29.md); no new research was performed for this task, per its own scope (preparing the decision package, not re-gathering evidence).

**Repository evidence:**
- `TRD12` §12.4.1 specifies phone-number OTP as the preferred customer authentication method.
- `apps/web/src/infrastructure/firebase/auth.ts` already integrates the Firebase Auth client (Auth-emulator-connected), giving the Firebase-native option a head start in engineering integration terms — no equivalent integration exists for any external SMS provider.
- The Decision Register's general approval rule (§1) requires Founder countersign for provider decisions affecting product behavior, which `DEC-PROV-004` does (it determines authentication delivery mechanism).

**External verified evidence (from `RES-001`, each independently re-confirmed against that package's own Source Register before use here):**
- Classic Firebase Auth phone sign-in is a distinct product from Firebase Phone Number Verification; PNV's narrow 8-country list does not apply here (S1, S3).
- Firebase gates SMS delivery via an explicit, per-project SMS Region Policy (default: no regions allowed) rather than a fixed country list (S4).
- Firebase phone auth requires a Blaze billing account (since September 2024), reCAPTCHA on web, and offers up to 10 test phone numbers for development (S2, S5).
- Standard Firebase quotas: 900 SMS/min, 3,000 SMS/day, with a documented two-week lead time for quota increases (S5).
- Burundi has near-universal 2G coverage (~97%) across three carriers (Lumitel, Econet Leo, Onatel) — the technically relevant coverage figure for SMS (S7).
- Africa's Talking explicitly advertises Burundi coverage and OTP as a primary SMS use case (S8) — the only external-route candidate with an affirmative Burundi claim found in `RES-001`'s research. Twilio's Burundi support is unconfirmed by public documentation (S9) — not excluded, but not affirmatively claimed either, which is why it is not presented as a full candidate option in §4 below.

**Remaining assumptions (explicitly disclosed, not resolved by `RES-001` or this package):**
- Which specific Burundi carrier(s) Firebase's own delivery infrastructure actually routes through, and whether quality differs by carrier.
- Burundi's specific per-SMS pricing tier for classic Firebase Auth (no public tier table found; Firebase-published tiers range roughly $0.01–$0.46 depending on country, with no Burundi-specific figure published).
- Firebase-to-Burundi delivery success rates generally — the central, still-open question.

**Outstanding validation activities:** a real-SMS delivery test against all three Burundi carriers, using a Blaze-plan project with the SMS Region Policy allowlisting Burundi — `RES-001`'s own recommended next action, not yet performed. See §6 for how this relates to the decision itself.

## 4. Candidate Options

Only options with direct support in `RES-001`'s evidence are presented, per this task's constraint not to invent unsupported options.

### Option A — Firebase-native OTP

- **Approach:** use Firebase Authentication's built-in phone sign-in (SMS OTP), already integrated into this repository's Auth client, with a Blaze-plan billing account and the SMS Region Policy configured to allow Burundi.
- **Benefits:** zero additional integration work beyond configuration (Blaze billing, SMS Region Policy, reCAPTCHA, test numbers) — the Auth SDK is already present; single-vendor operational surface (one dashboard, one support channel, one set of quotas); built-in abuse controls (rate limiting, reCAPTCHA, region policy) require no custom implementation; up to 10 test phone numbers directly support the Test Strategy `RES-001` §7 already defined.
- **Limitations:** no first-party confirmation of Burundi delivery reliability exists (the central evidence gap); standard quotas (900/min, 3,000/day) are a hard ceiling without a two-week-notice increase request; no Burundi-specific pricing tier is published, so actual per-SMS cost is unverified until measured.
- **Operational implications:** single monitoring surface (Firebase Console SMS Usage tab, `status.firebase.google.com`); support escalation follows standard Firebase channels.
- **Engineering implications:** no new provider SDK or custom OTP-generation/validation logic required; `ENG-P2-001` can build directly against the existing `firebase/auth` client.

### Option B — External SMS route (Africa's Talking)

- **Approach:** integrate a third-party African SMS aggregator (Africa's Talking, per `RES-001`'s evidence) to send OTP codes, paired with a custom Cloud Functions-based OTP generation/validation flow (since this bypasses Firebase's own phone-auth mechanism entirely).
- **Benefits:** Africa's Talking explicitly advertises Burundi coverage as a supported market, giving this option an affirmative (though vendor-marketing-sourced, not independently verified) coverage claim that Option A currently lacks; potentially more predictable regional delivery given the vendor's stated East/West Africa focus; independence from Firebase's billing/quota model for this specific flow.
- **Limitations:** requires building and maintaining custom OTP generation, code storage/expiry, and validation logic — none of which exists in this repository today (a real, non-trivial engineering scope `ENG-P2-001` does not currently plan for); requires a second vendor integration, second billing relationship, second support channel, and a second set of abuse-control mechanisms to design and implement (Firebase's built-in reCAPTCHA/rate-limiting/region-policy stack would not automatically apply to a custom flow); Africa's Talking's own coverage claim is itself unverified by direct delivery testing in this research, the same evidence gap Option A has.
- **Operational implications:** two monitoring surfaces instead of one (custom OTP service plus the vendor's own dashboard); support escalation spans two vendors (Firebase for the underlying Auth session, Africa's Talking for SMS delivery) if any part of the flow fails.
- **Engineering implications:** materially larger implementation scope than Option A — a new domain service for OTP lifecycle management, new Firestore collections/rules for OTP records, new abuse-control logic, and a new external HTTP integration with its own error handling and retry semantics.

**Option not presented as a full candidate:** Twilio was investigated in `RES-001` but its Burundi support could not be confirmed from public documentation (unconfirmed, not excluded) — presenting it as an equally-supported third option would overstate the evidence found. It is noted here only as a possible future alternative if Africa's Talking or Firebase-native both prove unworkable.

## 5. Comparative Evaluation

| Criterion | Option A — Firebase-native | Option B — External (Africa's Talking) |
|---|---|---|
| Engineering complexity | Low — configuration only, SDK already integrated | High — new OTP service, new schema, new integration, new abuse controls to design |
| Operational reliability | Unconfirmed for Burundi specifically (evidence gap); built on a mature, globally-used product | Unconfirmed for Burundi specifically (same evidence gap); vendor's stated regional focus is a positive signal, not proof |
| Security | Built-in reCAPTCHA, rate limiting, region policy — vetted abuse-control stack | Abuse controls would need to be designed and implemented from scratch — genuine new attack surface until hardened |
| User experience | No difference expected — same OTP-entry UX regardless of delivery backend | No difference expected — same OTP-entry UX regardless of delivery backend |
| Maintainability | Single vendor, single SDK, no custom OTP logic to maintain | Two vendors, custom OTP lifecycle code to maintain indefinitely |
| Implementation risk | Low — smallest possible change surface; risk is concentrated entirely in the unresolved delivery-reliability question | Higher — delivery-reliability risk is identical to Option A, *plus* new implementation risk from custom code that has not existed in this repository before |

**Reading the table:** both options carry the same central unresolved risk (Burundi delivery reliability, unconfirmed for either). Option A does not introduce any additional risk beyond that; Option B adds a materially larger, avoidable implementation-risk layer on top of the same unresolved delivery question, without evidence that this layer would resolve or reduce that question — Africa's Talking's own coverage claim is exactly as unverified by direct testing as Firebase's.

## 6. Preferred Recommendation

**Recommended option: A — Firebase-native OTP.**

**Support from evidence:** Option A carries strictly less implementation risk than Option B for an identical, currently-unresolved delivery-reliability question — choosing Option B would not close that evidence gap, since Africa's Talking's Burundi coverage claim is itself unverified by direct testing, the same category of unverified claim `RES-001` found for Firebase. Option A also has zero additional engineering scope beyond configuration (Blaze billing, SMS Region Policy, reCAPTCHA, test numbers), all of which `RES-001` already documented as concrete, bounded action items.

**Condition attached to this recommendation (explicit, not implicit):** this recommendation is conditional on the real-SMS delivery test `RES-001` identified as its own required next action. If that test shows Firebase-native delivery to Burundi is materially unreliable on one or more carriers, this recommendation should be revisited — at that point, Option B (or a hybrid/fallback arrangement) would warrant fresh evaluation with carrier-specific delivery data in hand, which does not exist today for either option.

**If the recommendation is treated as conditional (per §8):** the condition is — proceed with Option A, but do not treat `DEC-PROV-004` as fully and finally closed until the delivery test either confirms adequate reliability or surfaces a carrier-specific problem requiring reconsideration.

## 7. Remaining Validation

Distinguishing decision prerequisites from post-decision validation, per the task's explicit requirement:

**Decision prerequisites (should occur before, or as an explicit condition of, final Founder countersign):**
- The real-SMS delivery test against all three Burundi carriers (Lumitel, Econet Leo, Onatel) — `RES-001`'s own identified evidence gap. This is the one item genuinely load-bearing for the decision itself, not merely for later operational confidence.
- The governance-prerequisite action the Resolution Plan's own `RES-002` scope identifies (formally addressing `DEC-PROV-004`'s literal `DEC-SEC-001` dependency edge) — disclosed in §2, not performed by this task, and still outstanding before the decision can be formally recorded under the Decision Register's own rules.

**Post-decision validation (should occur after `DEC-PROV-004` is recorded, does not block the decision itself):**
- Production SMS validation at scale (beyond the initial carrier delivery test) once `ENG-P2-001` is actually built and deployed to staging.
- Operational verification of the SMS Region Policy, Blaze billing, reCAPTCHA, and test-number configuration in the actual project (currently documented as prerequisites in `RES-001` §3/§7, not yet configured anywhere).
- Monitoring readiness: confirming the Firebase Console SMS Usage tab and `verification_success_rate` metric are actually being watched once real traffic exists, per `RES-001` §8.

## 8. Risk Assessment

- **Residual engineering risk:** if Firebase-native delivery to Burundi later proves unreliable after `ENG-P2-001` is already built against it, rework would be required to add a fallback or switch providers — the same risk `DEC-SEC-001`'s own fallback-definition scope already anticipates, but concretely realized if the delivery test is skipped or deferred too long.
- **Operational risk:** the SMS Region Policy's default-deny-all-regions behavior (disclosed in `RES-001` §10) remains a live misconfiguration risk regardless of which option is chosen — Burundi must be explicitly allowlisted, or all customer registration attempts would silently fail.
- **Governance risk:** `DEC-PROV-004`'s literal `Dependencies` field still names `DEC-SEC-001`, and the Resolution Plan's own `RES-002` scope requires a formal governance action to address this edge before the decision can actually close — this package does not perform that action (out of its own scope) and flags it as an open item the Founder or Engineering Lead must still resolve before final recording, separate from the technical recommendation in §6.
- **Mitigation strategies:** treat the real-SMS delivery test as a hard precursor to *final* countersign, not merely a nice-to-have follow-up (addresses the engineering/operational risk); explicitly track the governance-prerequisite action as a distinct, named step in whatever task formally records `DEC-PROV-004` (addresses the governance risk); make SMS Region Policy configuration an explicit, checked step rather than an assumption (addresses the operational risk, consistent with `RES-001` §10's own mitigation).

## 9. Decision Readiness

**Ready with Conditions.**

Sufficient evidence exists for the Founder to review this decision package, understand the two realistic options, and provisionally approve a preferred direction (Option A) — the comparative evaluation in §5 is evidence-grounded and does not depend on the missing delivery-test data to reach its conclusion (Option A dominates Option B on implementation risk regardless of the delivery-test outcome, since both share the same unresolved delivery-reliability uncertainty). What is **not** yet available is the empirical confirmation needed to treat `DEC-PROV-004` as unconditionally, finally closed — that requires the real-SMS delivery test (§6, §7) and, separately, resolution of the governance-prerequisite edge with `DEC-SEC-001` (§2, §8). Neither of those gaps changes which option is preferred; both affect whether the decision, once made, can be treated as final versus conditional.

## 10. Founder Decision Briefing

**Decision title:** `DEC-PROV-004` — Phone OTP Delivery Route (Firebase-native vs. External SMS).

**Background:** This decision selects how customer OTP codes reach Burundi phone numbers during registration/sign-in, per `TRD12` §12.4.1. It is one of four D1 decisions blocking Capability 2 (Customer Identity). `RES-001` (2026-07-29, PR #30, merged) produced the technical evidence base for this decision; this package (`RES-002`) converts that evidence into a structured recommendation.

**Options considered:** (A) Firebase-native OTP — the standard, already-integrated Firebase Auth phone sign-in product; (B) External SMS route via Africa's Talking, requiring a new custom OTP service. A third option (Twilio) was investigated but not presented as a full candidate because its Burundi support is unconfirmed by public documentation.

**Recommended option:** A — Firebase-native OTP.

**Conditions:** this recommendation is conditional on (1) a real-SMS delivery test against all three Burundi carriers (Lumitel, Econet Leo, Onatel) before final countersign is treated as unconditional, and (2) separate resolution of the governance-prerequisite edge between `DEC-PROV-004` and `DEC-SEC-001`'s `Dependencies` fields, which this package discloses but does not perform.

**Risks:** delivery-reliability risk shared by both options and not yet closed by either (§8); SMS Region Policy misconfiguration risk independent of which option is chosen (§8); a disclosed governance-recording risk tied to the still-open `DEC-SEC-001` dependency edge (§8).

**Engineering recommendation:** approve Option A conditionally, with the delivery test and governance-prerequisite action tracked as named next steps rather than treated as already satisfied.

## 11. Files Created or Modified

**Created:** `docs/00-governance/decisions/evidence/DEC-PROV-004-decision-package-2026-07-30.md`; `docs/changes/IMPLEMENTATION_CHANGES.md` (append). **Modified:** none. No application code, governance document, or Decision Register field was changed; `DEC-PROV-004` was not recorded, approved, or closed.

## 12. Commands Executed

Direct re-read of `RES-001`'s Engineering Evidence Package (`docs/00-governance/decisions/evidence/EXT-TECH-001-engineering-evidence-package-2026-07-29.md`, including its Source Register) and its own Constraints/Status framing; `grep -n` confirmation of the live `DEC-PROV-004`/`DEC-SEC-001` Decision Register entries (unchanged since `RES-001`); direct read of the Resolution Plan's own `RES-002` scope definition (`docs/05-implementation/roadmap/ENG-P2-RES-000-capability-2-resolution-plan.md`) to confirm this package's scope matches the Plan's own framing of what `RES-002` requires versus what this specific task brief asks for.

## 13. Dependencies Added

None.

## 14. Configuration Changes

None.

## 15. Rollback Instructions

`git revert` of this task's own commit — a single new decision-package document plus one changes-log append.

## 16. Markdown Decision Package

This document: [`docs/00-governance/decisions/evidence/DEC-PROV-004-decision-package-2026-07-30.md`](DEC-PROV-004-decision-package-2026-07-30.md).

## 17. Changes Log

Updated: [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../../changes/IMPLEMENTATION_CHANGES.md).
