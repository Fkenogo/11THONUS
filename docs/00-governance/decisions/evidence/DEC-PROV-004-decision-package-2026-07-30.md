> **Title:** DEC-PROV-004 — Decision Package
> **Status:** **Founder Decision received: Approve with Conditions (2026-07-30).** The Decision Register itself has not yet been updated — recording that status change is a distinct, future action; this document prepares everything that action needs (§14). No application code, architecture, or unrelated document was modified.
> **Date:** Prepared 2026-07-30 (`RES-002`); updated 2026-07-30 (`RES-002A`, incorporating the Founder's Identity and Authentication Strategy decision).
> **Classification:** Engineering decision package + Founder decision record. Primary inputs: `RES-001`'s [Engineering Evidence Package](EXT-TECH-001-engineering-evidence-package-2026-07-29.md); the Founder's Identity and Authentication Strategy decision (§2). Per [`ENG-P2-RES-000`](../../../05-implementation/roadmap/ENG-P2-RES-000-capability-2-resolution-plan.md) `RES-002`/`RES-002A`.

# DEC-PROV-004 — Decision Package

## 1. Executive Summary

`RES-002` converted `RES-001`'s Engineering Evidence Package into a structured decision package recommending Firebase-native OTP as the initial SMS delivery mechanism. The Founder has since decided a broader Identity and Authentication Strategy (§2) that **adopts** this engineering recommendation while **expanding** its scope: the canonical customer identity is the verified phone number, not any single authentication mechanism, and two mechanisms are approved initially — Firebase Phone Sign-In (SMS OTP) and Google Sign-In — with the architecture required to support further providers without changing the customer's identity. The Founder also reframes SMS delivery reliability as an **operational**, not constitutional, dependency: the decision is approved now, and production SMS validation gates production *activation*, not the decision itself — a materially different framing from this package's original "Ready with Conditions" language, corrected in §12 below.

**This document now separates three distinct categories, per the Founder's explicit instruction:** Constitutional Product Principles (§2, Founder-authoritative, verbatim), Engineering Recommendations (§3–§7, `RES-001`/`RES-002`'s own analysis, preserved unchanged), and Operational Launch Conditions (§9, the SMS-validation gate). All original engineering evidence and analysis from `RES-001`/`RES-002` is preserved below, unmodified in substance.

## 2. Founder Decision — Constitutional Product Principles (2026-07-30)

**Decision authority:** Founder. **Status:** Approve with Conditions. The following principles are Founder-authoritative product/architecture decisions, not engineering-derived conclusions — they are recorded here verbatim as the constitutional basis `DEC-PROV-004` is now decided against, distinct from the engineering analysis in §3–§8, which remains the supporting evidence and reasoning, not the decision itself.

1. **Canonical Customer Identity.** The customer's verified mobile phone number is the canonical identity within the 11thONUS platform. The phone number represents the customer's unique identity across the platform and is independent of the authentication method used to access the account.
2. **Authentication Strategy.** Authentication mechanisms are interchangeable methods of accessing the same customer identity. The initial approved authentication mechanisms are: Firebase Authentication Phone Sign-In (SMS OTP); Google Sign-In. The architecture shall support additional authentication providers in future without changing the customer's canonical identity. Future providers may include: Apple Sign-In; Email authentication; Passkeys; other Founder-approved authentication mechanisms.
3. **Identity Linking.** Where multiple authentication providers are used, they shall resolve to a single customer identity. The platform shall not create duplicate customer accounts because different authentication providers are used. Identity linking shall remain deterministic and auditable.
4. **Progressive Authentication.** Authentication shall occur only when required. Customers may browse and explore the platform anonymously. Authentication is required only when performing identity-protected actions, including (but not limited to): joining the loyalty platform; earning rewards; receiving a loyalty number; generating a customer QR code; viewing personal loyalty information; redeeming rewards.
5. **Progressive Trust Model.** Customer trust shall increase progressively. **Level 0 — Anonymous:** browse participating businesses; view public platform information; no rewards or personal account. **Level 1 — Authenticated:** verified identity; personal loyalty number; personal QR code; earn and redeem rewards; view account history. **Level 2 — Verified:** additional identity verification may be requested where required for higher-trust capabilities — this supports future platform features without increasing onboarding friction for ordinary loyalty participation.
6. **SMS Strategy.** Firebase Authentication Phone Sign-In is approved as the initial SMS authentication mechanism. However: SMS delivery reliability is recognised as an operational dependency rather than a constitutional dependency. Production SMS validation across Burundi carriers remains a launch-readiness requirement. Failure to meet acceptable delivery thresholds shall trigger an engineering review of alternative SMS delivery mechanisms or providers before production activation.
7. **Product Philosophy.** Identity belongs to the customer. Authentication is simply one of several mechanisms used to verify access to that identity. The platform shall therefore be designed around customer identity, not around any individual authentication technology.

**How this changes the engineering recommendation §3–§8 originally produced (analysis stated before this document was edited, per the task's own instruction):** the Founder's Principle 6 adopts `RES-002`'s Option A (Firebase-native OTP) as the approved initial SMS mechanism — the engineering recommendation is endorsed, not overridden. Principle 2 adds Google Sign-In as a second initially-approved mechanism, which was never evaluated by `RES-001`/`RES-002` — flagged explicitly in §8 as new scope, not carrying the same Burundi-SMS evidence gap since it has no SMS dependency. Principles 3–5 (Identity Linking, Progressive Authentication, Progressive Trust Model) introduce new architectural requirements for `ENG-P2-001`/`ENG-P2-004` that this package records as constitutional context but does not design, per this task's "maintain the current repository architecture" constraint. Principle 6's own reframing of SMS reliability as operational-not-constitutional directly changes §12 (Decision Readiness) below — the original "Ready with Conditions" language treated the delivery test as a condition on the *decision*; the Founder treats it as a condition on *production activation*, a decision that has already been made.

## 3. Decision Context

**Why `DEC-PROV-004` exists:** the Decision Register records it as `OPEN_PROVIDER`, `Priority: D1`, asking: "Firebase-native OTP vs external SMS route for Burundi numbers." It blocks customer authentication and is one of the four D1 decisions gating `ENG-P2-001` (Customer Identity). **Now nested within the broader Authentication Strategy (§2):** `DEC-PROV-004` selects the SMS delivery mechanism for one of the two initially-approved authentication methods (Firebase Phone Sign-In); it does not itself decide *what the customer's identity is* — that is settled, constitutionally, by §2 Principle 1 (the phone number), independent of which authentication mechanism is used to access it.

**The engineering problem it addresses:** `TRD12` §12.4.1 specifies mobile phone number with one-time password as the preferred customer authentication method. Delivering that OTP to a Burundi phone number requires choosing a concrete SMS delivery mechanism — either Firebase's own built-in phone-auth SMS sending, or routing OTP delivery through an external, third-party SMS provider integrated into a custom authentication flow. `DEC-PROV-004` is the decision that selects between these two mechanisms.

**Relationship to `EXT-TECH-001`:** `DEC-PROV-004`'s own `Dependencies` field in the Decision Register names `EXT-TECH-001` directly — the decision cannot be made on a sound evidentiary basis until the technical evidence `EXT-TECH-001` describes (Firebase phone-OTP delivery to Burundi numbers: reliability, cost, abuse controls, test-number strategy) exists. `RES-001` produced that evidence. **Disclosed, not resolved, by this package:** `DEC-PROV-004`'s `Dependencies` field also names `DEC-SEC-001` — the Resolution Plan's own `RES-002` scope identifies this as a literal governance-prerequisite edge that must be formally addressed (waived, corrected, or the two decisions closed together) before `DEC-PROV-004` can actually close under the Decision Register's own rules. Neither `RES-002` nor `RES-002A` was scoped to perform that governance action, and the Founder's product-level decision in §2 does not itself resolve this repository-mechanical item — it remains open, carried into §11/§14 below.

## 4. Evidence Summary

*(Preserved unchanged from `RES-001`/`RES-002` — this is the engineering evidence base the Founder's decision in §2 was made against.)*

All evidence below traces to `RES-001`'s [Engineering Evidence Package](EXT-TECH-001-engineering-evidence-package-2026-07-29.md); no new research was performed for `RES-002`/`RES-002A`, per their own scope (preparing the decision package, not re-gathering evidence).

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
- Africa's Talking explicitly advertises Burundi coverage and OTP as a primary SMS use case (S8) — the only external-route candidate with an affirmative Burundi claim found in `RES-001`'s research. Twilio's Burundi support is unconfirmed by public documentation (S9) — not excluded, but not affirmatively claimed either, which is why it is not presented as a full candidate option in §5 below.

**Remaining assumptions (explicitly disclosed, not resolved by `RES-001` or this package):**
- Which specific Burundi carrier(s) Firebase's own delivery infrastructure actually routes through, and whether quality differs by carrier.
- Burundi's specific per-SMS pricing tier for classic Firebase Auth (no public tier table found; Firebase-published tiers range roughly $0.01–$0.46 depending on country, with no Burundi-specific figure published).
- Firebase-to-Burundi delivery success rates generally — the central, still-open question.

**Outstanding validation activities:** a real-SMS delivery test against all three Burundi carriers, using a Blaze-plan project with the SMS Region Policy allowlisting Burundi — `RES-001`'s own recommended next action, not yet performed. Per the Founder's Principle 6, this is now framed as a launch-readiness requirement (§9), not a decision prerequisite.

## 5. Candidate Options

*(Preserved unchanged from `RES-002` — this is the engineering analysis the Founder's decision in §2 endorsed.)*

Only options with direct support in `RES-001`'s evidence were presented, per `RES-002`'s constraint not to invent unsupported options.

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

## 6. Comparative Evaluation

*(Preserved unchanged from `RES-002`.)*

| Criterion | Option A — Firebase-native | Option B — External (Africa's Talking) |
|---|---|---|
| Engineering complexity | Low — configuration only, SDK already integrated | High — new OTP service, new schema, new integration, new abuse controls to design |
| Operational reliability | Unconfirmed for Burundi specifically (evidence gap); built on a mature, globally-used product | Unconfirmed for Burundi specifically (same evidence gap); vendor's stated regional focus is a positive signal, not proof |
| Security | Built-in reCAPTCHA, rate limiting, region policy — vetted abuse-control stack | Abuse controls would need to be designed and implemented from scratch — genuine new attack surface until hardened |
| User experience | No difference expected — same OTP-entry UX regardless of delivery backend | No difference expected — same OTP-entry UX regardless of delivery backend |
| Maintainability | Single vendor, single SDK, no custom OTP logic to maintain | Two vendors, custom OTP lifecycle code to maintain indefinitely |
| Implementation risk | Low — smallest possible change surface; risk is concentrated entirely in the unresolved delivery-reliability question | Higher — delivery-reliability risk is identical to Option A, *plus* new implementation risk from custom code that has not existed in this repository before |

**Reading the table:** both options carry the same central unresolved risk (Burundi delivery reliability, unconfirmed for either). Option A does not introduce any additional risk beyond that; Option B adds a materially larger, avoidable implementation-risk layer on top of the same unresolved delivery question, without evidence that this layer would resolve or reduce that question — Africa's Talking's own coverage claim is exactly as unverified by direct testing as Firebase's.

## 7. Engineering Recommendation

*(Preserved from `RES-002` — this is the analysis the Founder's Principle 6 adopted.)*

**Recommended option: A — Firebase-native OTP.**

**Support from evidence:** Option A carries strictly less implementation risk than Option B for an identical, currently-unresolved delivery-reliability question — choosing Option B would not close that evidence gap, since Africa's Talking's Burundi coverage claim is itself unverified by direct testing, the same category of unverified claim `RES-001` found for Firebase. Option A also has zero additional engineering scope beyond configuration (Blaze billing, SMS Region Policy, reCAPTCHA, test numbers), all of which `RES-001` already documented as concrete, bounded action items.

**Original condition (superseded in framing, not in substance, by §9):** this recommendation was originally conditioned on the real-SMS delivery test being complete *before* the decision could be treated as final. The Founder's Principle 6 (§2) reframes this: the decision is approved now; the delivery test gates production activation instead. The underlying engineering reasoning for why the test still matters is unchanged — see §9.

## 8. Founder-Approved Scope Expansion (New in `RES-002A`)

Items introduced by the Founder's decision (§2) that were **not** evaluated by `RES-001`/`RES-002`'s own evidence-gathering, disclosed explicitly per this task's requirement to separate constitutional principles from engineering recommendations:

- **Google Sign-In** (§2 Principle 2): a second initially-approved authentication mechanism. This carries **no** Burundi-SMS-delivery dependency (it is an OAuth flow, not SMS-based), so it does not inherit the evidence gap `RES-001` identified for phone OTP. However, its own technical integration specifics (Firebase `GoogleAuthProvider` configuration, OAuth client setup, consent-screen requirements) have not been engineering-evaluated by any task in this Resolution Sprint and would need their own bounded implementation-planning pass when `ENG-P2-001` is built — this is a scope note, not a blocker to the Founder's decision itself.
- **Identity Linking** (§2 Principle 3): requires that multiple authentication providers resolve deterministically and auditably to one customer record, with no duplicate-account creation. This is a real, non-trivial architectural requirement for `ENG-P2-001`/`ENG-P2-004` (the role/permission-resolution work package) that does not exist in the repository today and is not designed by this package, per the "maintain the current repository architecture" constraint — recorded here as a downstream engineering requirement, not solved here.
- **Progressive Authentication** (§2 Principle 4) and **Progressive Trust Model** (§2 Principle 5): require the platform to support anonymous browsing (Level 0) before any authentication occurs, with authentication triggered only by specific identity-protected actions, and a defined path to a higher-trust Level 2. These are UX/access-control architecture requirements for `ENG-P2-001` and beyond, not designed by this package.

None of these items block `DEC-PROV-004` itself, which concerns only the SMS delivery mechanism for one of the two approved authentication methods — they are recorded here so the Founder's full decision is traceable in one place, and so `ENG-P2-001`'s future implementation planning inherits them explicitly rather than rediscovering them.

## 9. Operational Launch Conditions

Per the Founder's Principle 6 (§2), reframing what `RES-001`/`RES-002` originally treated as a decision prerequisite:

- **Production SMS validation across Burundi carriers is a launch-readiness requirement**, not a condition on `DEC-PROV-004`'s approval. The real-SMS delivery test against all three carriers (Lumitel, Econet Leo, Onatel) that `RES-001`/`RES-002` identified remains the concrete action required — its role has shifted from "must occur before the decision can be considered final" to "must occur before production activation."
- **Failure to meet acceptable delivery thresholds triggers an engineering review** of alternative SMS delivery mechanisms or providers — the Founder's own words. This does not reopen `DEC-PROV-004` automatically; it authorizes a scoped, future engineering review if and only if the delivery test surfaces a problem. Option B (§5) — or a hybrid/fallback arrangement — would be the natural starting point for that review, since it is the only other option `RES-001`'s evidence directly supports.
- **Not addressed by Principle 6, remaining open:** the specific acceptable-delivery-threshold figure is not defined by the Founder's decision — this is a future engineering-owned parameter (e.g., a target `verification_success_rate` per `RES-001` §8's own monitoring guidance), not something this package invents on the Founder's behalf.

## 10. Remaining Validation

Distinguishing decision prerequisites from post-decision (now: post-decision, pre-production) validation, updated to reflect §9's reframing:

**Decision prerequisites (none remaining for `DEC-PROV-004`'s approval itself — the Founder has decided):**
- The governance-prerequisite action addressing `DEC-PROV-004`'s literal `DEC-SEC-001` dependency edge (§3, §11) remains outstanding before the decision can be *formally recorded* in the Decision Register under its own rules — this is a repository-mechanical prerequisite to recording, not to the Founder's product decision itself, which has already been made.

**Launch-readiness / post-decision validation (per §9, gates production activation, not the decision):**
- The real-SMS delivery test against all three Burundi carriers.
- Operational verification of the SMS Region Policy, Blaze billing, reCAPTCHA, and test-number configuration in the actual project (currently documented as prerequisites in `RES-001` §3/§7, not yet configured anywhere).
- Monitoring readiness: confirming the Firebase Console SMS Usage tab and `verification_success_rate` metric are actually being watched once real traffic exists, per `RES-001` §8.
- (New, per §8) Google Sign-In's own technical integration planning, and initial architectural planning for Identity Linking and the Progressive Trust Model, ahead of `ENG-P2-001`'s implementation.

## 11. Risk Assessment

- **Residual engineering risk:** if Firebase-native delivery to Burundi later proves unreliable after `ENG-P2-001` is already built against it, the Founder's own Principle 6 already anticipates this by authorizing an engineering review — the risk is contained by that provision, not eliminated by it; timely execution of the delivery test remains the best mitigation.
- **Operational risk:** the SMS Region Policy's default-deny-all-regions behavior (disclosed in `RES-001` §10) remains a live misconfiguration risk regardless of which option is chosen — Burundi must be explicitly allowlisted, or all customer registration attempts would silently fail.
- **Governance risk (unresolved by the Founder's decision):** `DEC-PROV-004`'s literal `Dependencies` field still names `DEC-SEC-001`, and the Resolution Plan's own `RES-002` scope requires a formal governance action to address this edge before the decision can actually close under the Decision Register's own rules. The Founder's product-level approval does not itself perform this repository-mechanical action — it remains an open item for whoever formally records the decision (§14).
- **New scope-expansion risk (per §8):** Google Sign-In, Identity Linking, and the Progressive Trust Model are now constitutional requirements with no corresponding engineering evaluation yet — if `ENG-P2-001` implementation planning proceeds without a dedicated pass over these items, design gaps could surface late. Mitigation: treat §8 as a required input to `ENG-P2-001`'s own pre-implementation analysis, not as already resolved by this package.
- **Mitigation strategies:** treat the real-SMS delivery test as a tracked launch-readiness item, not an afterthought (addresses the engineering/operational risk); explicitly track the governance-prerequisite action as a distinct, named step in whatever task formally records `DEC-PROV-004` (addresses the governance risk); ensure `ENG-P2-001`'s pre-implementation analysis explicitly reviews §8's new items (addresses the scope-expansion risk).

## 12. Decision Readiness

**Founder Decision: Approve with Conditions (received 2026-07-30).** This supersedes `RES-002`'s original "Ready with Conditions" framing, which described readiness *for Founder consideration* — that consideration has now occurred and produced an affirmative decision. The evidence in §4–§7 supported that decision: the comparative evaluation (§6) is evidence-grounded and did not depend on delivery-test data to identify Option A as preferable, which the Founder's own approval confirms. What remains open is **not** whether the decision was made, but **two distinct follow-on items**: (1) the launch-readiness validation §9 describes, gating production activation, not the decision; and (2) the governance-prerequisite action (§3, §11) gating formal *recording* of the decision in the Decision Register, a repository-mechanical step distinct from the Founder's own product-level approval.

## 13. Founder Decision Briefing

*(Retained as the original briefing artifact, now marked as answered.)*

**Decision title:** `DEC-PROV-004` — Phone OTP Delivery Route (Firebase-native vs. External SMS), within the broader Identity and Authentication Strategy.

**Background:** This decision selects how customer OTP codes reach Burundi phone numbers during registration/sign-in, per `TRD12` §12.4.1, nested within the Founder's constitutional Authentication Strategy (§2). It is one of four D1 decisions blocking Capability 2 (Customer Identity). `RES-001` (2026-07-29, PR #30, merged) produced the technical evidence base; `RES-002` (PR #31) converted it into a recommendation; `RES-002A` incorporates the Founder's decision.

**Options considered:** (A) Firebase-native OTP — the standard, already-integrated Firebase Auth phone sign-in product; (B) External SMS route via Africa's Talking, requiring a new custom OTP service. Twilio was investigated but not presented as a full candidate — Burundi support unconfirmed by public documentation.

**Recommended option:** A — Firebase-native OTP. **Founder decision:** Approved, alongside Google Sign-In as a second initial authentication mechanism (§2).

**Conditions:** (1) production SMS validation across Burundi carriers before production activation, per §9 — not before the decision itself; (2) separate resolution of the governance-prerequisite edge between `DEC-PROV-004` and `DEC-SEC-001`'s `Dependencies` fields before formal Register recording, per §3/§11 — disclosed, not performed, by this package.

**Risks:** delivery-reliability risk, now explicitly contained by the Founder's own engineering-review provision (§9, §11); SMS Region Policy misconfiguration risk, option-independent (§11); the disclosed governance-recording risk tied to the `DEC-SEC-001` dependency edge (§11); the new scope-expansion risk from Google Sign-In/Identity Linking/Progressive Trust Model requiring future engineering evaluation (§8, §11).

**Engineering recommendation:** proceed to formally record `DEC-PROV-004` as Approved with Conditions once the governance-prerequisite action (§3/§11) is addressed; track the delivery test and §8's new items as named, scheduled follow-on work rather than treating them as already satisfied.

## 14. Repository Recording Preparation

Prepared here, not executed, per this task's own scope ("prepare the repository so `DEC-PROV-004` can be formally recorded" — recording itself is a distinct future action):

**Decision Register fields, drafted and ready for a future recording task to apply to `DEC-PROV-004`'s live entry:**
- `Status`: `OPEN_PROVIDER` → `CONFIRMED` (Approved with Conditions)
- `Final decision`: Firebase-native OTP (Firebase Authentication Phone Sign-In) approved as the initial SMS delivery mechanism, within a broader Authentication Strategy also approving Google Sign-In; production SMS validation across Burundi carriers is a launch-readiness condition, not a decision prerequisite; failure to meet acceptable delivery thresholds triggers a scoped engineering review of alternatives.
- `Decision date`: 2026-07-30
- `Approved by`: Founder
- `Notes`: full Identity and Authentication Strategy recorded in this decision package (§2); `DEC-SEC-001` dependency edge (§3) remains outstanding before this entry can be marked closed under the Register's own rules — **that action is a precondition of recording, disclosed here, not performed by `RES-002A`.**

**Not performed by this task, and why:** applying the above to the live Decision Register file would constitute recording the decision, which this task's own brief and `RES-002`'s brief both explicitly reserve for a separate, distinct action ("prepares the decision. It does not record or approve the decision" — `RES-002`; "prepare the repository so `DEC-PROV-004` can be formally recorded" — `RES-002A`). The governance-prerequisite edge with `DEC-SEC-001` should be addressed as part of, or immediately before, that future recording action.

## 15. Files Created or Modified

**Modified:** `docs/00-governance/decisions/evidence/DEC-PROV-004-decision-package-2026-07-30.md` (this document — restructured and expanded to incorporate the Founder's decision, per `RES-002A`); `docs/changes/IMPLEMENTATION_CHANGES.md` (append). **Not modified:** `RES-001`'s evidence package (preserved unchanged, per this task's explicit instruction); the Decision Register; any application code; any other document.

## 16. Commands Executed

Direct re-read of the current `DEC-PROV-004-decision-package-2026-07-30.md` (`RES-002`'s output) before editing; direct re-read of `RES-001`'s Engineering Evidence Package and its Source Register to confirm no evidence was altered in the restructure; `grep -n` reconfirmation of the live `DEC-PROV-004`/`DEC-SEC-001` Decision Register entries (unchanged since `RES-002`); confirmation that PR #31 (`RES-002`) remained open and unmerged, supporting continuation on the same branch rather than a new PR.

## 17. Dependencies Added

None.

## 18. Configuration Changes

None.

## 19. Rollback Instructions

`git revert` of this task's own commit — a single edit to the decision-package document plus one changes-log append; `RES-002`'s original content remains fully recoverable from the prior commit on this same branch/PR.

## 20. Markdown Decision Package

This document: [`docs/00-governance/decisions/evidence/DEC-PROV-004-decision-package-2026-07-30.md`](DEC-PROV-004-decision-package-2026-07-30.md).

## 21. Changes Log

Updated: [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../../changes/IMPLEMENTATION_CHANGES.md).
