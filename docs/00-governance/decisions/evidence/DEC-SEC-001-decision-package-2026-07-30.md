> **Title:** DEC-SEC-001 Decision Package — Customer Authentication Approach and Fallback
> **Version:** 1.0 · **Status:** Prepared for Founder consideration — NOT recorded, NOT approved
> **Task:** `RES-003` (Capability 2 Resolution Sprint, `ENG-P2-RES-000`)
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/DEC-SEC-001-decision-package-2026-07-30.md`
> **Prepared:** 2026-07-30

---

## 1. Executive Summary

This package prepares — it does **not** record, approve, or countersign — `DEC-SEC-001` ("Customer authentication approach and fallback"), building directly on `DEC-PROV-004`'s now-`CONFIRMED` Identity and Authentication Strategy. It defines the security problem, evaluates repository-supported fallback options, distinguishes engineering recommendation from Founder-level decision, and states overall decision readiness. Per this task's explicit constraints, no security feature is implemented, no application code is modified, and `DEC-SEC-001` itself is not recorded.

**Recommended direction (engineering):** confirm Firebase phone OTP (already the Founder-approved primary mechanism under `DEC-PROV-004`) as `DEC-SEC-001`'s primary customer authentication, with **email link sign-in as the fallback** for customers whose OTP does not arrive or who lack a reliable phone-SMS path — the same option (a) the Decision Register already recommended, now narrower in scope because `DEC-PROV-004` has already settled the delivery-route half of the original question.

**Corrected by pre-merge review:** an earlier version of this package described email-link sign-in as resolvable to the canonical phone identity via "standard Firebase account linking" and framed this as a low-complexity advantage over Google Sign-In. That description was technically wrong for the scenario this decision actually addresses (a customer's *first* OTP attempt failing, before any phone-authenticated session exists) — see §5, §9, §11, §12 for the correction and its consequences. The recommendation itself is unchanged, but it now carries an explicit, load-bearing condition (a still-undesigned identity-resolution flow) that the original draft omitted.

**Decision readiness:** **Ready with Conditions** — see §12.

## 2. Impact of `DEC-PROV-004`'s Confirmation on `DEC-SEC-001`

*(Required pre-edit analysis, per this task's brief — reproduced here for the permanent record.)*

`DEC-SEC-001`'s live Register entry (re-read directly, unchanged since `RES-001`) asks two things: (1) confirm Firebase phone OTP as primary customer authentication for Burundi, and (2) define the fallback if OTP delivery proves unreliable/costly. Its three original options — (a) Firebase phone OTP + email fallback, (b) OTP via external SMS provider + custom auth, (c) password-based with phone verification — all predate `DEC-PROV-004` and do not mention Google Sign-In.

`DEC-PROV-004`'s confirmation changes this in five concrete ways:

1. **Half the question is already answered.** `DEC-PROV-004` confirmed Firebase-native OTP as the SMS delivery mechanism (Principle 3). `DEC-SEC-001` no longer needs to re-decide "which OTP delivery route" — it inherits that answer and narrows to the fallback question alone. This also directly satisfies half of `DEC-SEC-001`'s own `Dependencies: EXT-TECH-001 (Burundi OTP proof); DEC-PROV-004` field — the `DEC-PROV-004` half is now resolved; `EXT-TECH-001` remains `PENDING`.
2. **A mechanism DEC-SEC-001's own options never contemplated now exists.** `DEC-PROV-004` Principle 3 approved Google Sign-In as a second **initial** authentication mechanism — available from day one, not conditional on OTP failure. This is materially different from a "fallback": a fallback activates only when the primary path fails; Google Sign-In is available in parallel from the start. Any current `DEC-SEC-001` package must place Google Sign-In in the picture explicitly rather than silently reusing pre-`DEC-PROV-004` framing that doesn't mention it.
3. **A scope-boundary needs disambiguating, or the two decisions will appear to duplicate each other.** `DEC-PROV-004` Principle 9 already states: *"If SMS validation proves unacceptable, Engineering shall return with a comparative recommendation before changing authentication provider."* That is a **provider/route-level** fallback (Firebase-native OTP → an external SMS route), decided by `DEC-PROV-004`. `DEC-SEC-001`'s fallback question is a **customer-facing** one — what a given customer does *right now* if their individual OTP attempt fails, independent of whether the underlying delivery route is later swapped. §5 and §8 below keep these two layers explicitly separate.
4. **A direct precedent for how to frame readiness under an unresolved evidence gap.** `DEC-PROV-004` was approved despite the same outstanding gap `DEC-SEC-001` also depends on — the real Burundi SMS delivery test (`EXT-TECH-001`, still `PENDING`) — by treating that gap as a production-readiness *gate*, not a decision *blocker*. §12 applies the same framing here, since the Founder has already established it is an acceptable basis for a D1 security/auth decision in this exact context.
5. **The Progressive Trust Model and Progressive Authentication principles (DEC-PROV-004 Principles 5–7) reframe what "authentication" even means at the point DEC-SEC-001's fallback would trigger.** Browsing requires no authentication at all (Principle 6); authentication is required only for identity-protected actions (Principle 7). `DEC-SEC-001`'s fallback question is therefore scoped specifically to the *registration/first-authentication* moment (Level 0 → Level 1), not to every customer interaction — a scope narrower than the Register's original, pre-`DEC-PROV-004` framing might suggest.

**Repository-code check performed before writing this package:** a repository-wide search (`grep -rn "RecaptchaVerifier|signInWithPhoneNumber|ConfirmationResult|GoogleAuthProvider|signInWithPopup|signInWithRedirect|sendSignInLinkToEmail|EmailAuthProvider|signInWithEmailAndPassword|sendPasswordResetEmail|isSignInWithEmailLink" apps/web/src functions/src`) returned **zero matches**. Only `apps/web/src/infrastructure/firebase/auth.ts` (generic `getAuth`/`connectAuthEmulator` init, from `ENG-P1-001`) exists. **No authentication flow of any kind is implemented yet** — phone OTP, email link, and Google Sign-In are all equally unbuilt. "Repository-supported options" in §5 therefore means *architecturally consistent with existing, already-approved decisions*, not *already coded* — overstating any option's readiness would repeat the exact error corrected in `RES-002A` (Finding 1).

## 3. Security Problem Definition

`DEC-SEC-001` exists to answer: **when a customer's primary authentication path (Firebase phone OTP) does not succeed — because the SMS never arrives, arrives too late, the carrier is unreliable, or the customer's phone cannot receive SMS at that moment — what authenticated path do they get instead, so that failed OTP delivery does not mean failed registration?**

This is a security decision, not merely a UX one, because the fallback path must preserve the same guarantees the primary path provides:
- **Identity integrity:** the fallback must still resolve to the same canonical identity (the verified phone number, per `DEC-PROV-004` Principle 1) — it cannot silently create a second, unlinked identity.
- **Abuse resistance:** whatever fallback mechanism is chosen must have its own abuse-control posture at least as strong as phone OTP's (rate limiting, reCAPTCHA-equivalent, no unbounded retry) — a weak fallback would become the attacker's preferred registration path, not a genuine backstop.
- **Auditability:** which path a given customer actually used to authenticate must be recorded, since it affects trust-level reasoning under the Progressive Trust Model (`DEC-PROV-004` Principle 7).

**Why it matters now, not later:** per the Engineering Implementation Programme and `CDR-001`, `DEC-SEC-001` is one of three remaining open D1 decisions blocking `ENG-P2-001` (customer identity implementation) and Phase 2 entry. It has no engineering work package of its own in the Resolution Plan beyond this decision (`RES-003`'s own deliverable is "Decision Register entry update," not new code) — closing it is a governance action, not an implementation one.

## 4. Evidence Summary

*(Reused unmodified from `RES-001`'s Engineering Evidence Package — per this task's constraint not to reopen engineering analysis or alter that evidence. Full detail: [`EXT-TECH-001-engineering-evidence-package-2026-07-29.md`](EXT-TECH-001-engineering-evidence-package-2026-07-29.md).)*

- **Firebase capability:** classic Firebase Authentication phone sign-in (not the separate Phone Number Verification product) is the confirmed primary mechanism (`DEC-PROV-004`); no fixed country-support list, gated by a per-project SMS Region Policy.
- **Burundi delivery:** three carriers (Lumitel, Econet Leo, Onatel), ~97% 2G coverage (the technically relevant figure for SMS); no first-party Firebase confirmation of Burundi-specific delivery reliability exists — the central evidence gap, unchanged since `RES-001`.
- **Abuse protection (§6 of the Evidence Package):** Firebase provides per-project (900/min, 3,000/day), per-IP (50/min, 500/hour), and per-phone-number rate limiting; mandatory reCAPTCHA; SMS Region Policy as an abuse-mitigation control. The Evidence Package explicitly states this is *"a capability inventory, not a sufficiency judgment (which belongs to `DEC-PROV-004`/`DEC-SEC-001`, not this task)"* — that sufficiency judgment for the *fallback* mechanism specifically is made in §6 below, for the first time, by this package.
- **`EXT-TECH-001` status:** still `PENDING` in the External Dependencies Register — the real-SMS carrier delivery test has not occurred.

## 5. Repository-Supported Options

Only options consistent with already-approved decisions (`DEC-PROV-004`, TRD12 §12.4.1) and with evidence `RES-001` actually gathered are presented — no option is invented beyond what the Register, `DEC-PROV-004`, and TRD12 already anticipate. As established in §2, **none of these have any code today** — the comparison is architectural/policy, not a choice between existing implementations.

### Option A — Email link sign-in fallback (Register option (a))

- **Approach:** if phone OTP fails or is not received within a bounded window, offer Firebase's email-link (passwordless) sign-in as the fallback.
- **Basis:** TRD12 §12.4.1 already lists "email and password or passwordless email as a secondary method" for customer authentication — this option requires no new authentication-strategy text, only implementation.
- **Abuse posture:** Firebase email-link sign-in has its own built-in abuse controls (link expiry, single-use tokens) — a comparable posture to phone OTP, not a weaker one.
- **Limitation — corrected by pre-merge review:** the original draft of this section described the email-link session as being "associated with the same canonical phone-number identity via account linking." That is not technically coherent for the scenario this option actually addresses. Firebase account linking (`linkWithCredential`) attaches a *new* credential to an **already-authenticated** session (`auth.currentUser`). In the trigger scenario `DEC-SEC-001` is about — a customer's *first* phone-OTP attempt fails, so no phone-authenticated session was ever established — there is no existing identity to link the email-link credential to. Completing email-link sign-in in that moment creates a **new, separate Firebase UID**, not a linked second credential on the canonical phone identity — precisely the duplicate-identity outcome TRD12 §12.5 and AIR-001 prohibit ("All linked providers shall resolve to one Firebase Authentication user"; "one Firebase Authentication UID shall map to one active platform user"). Standard account linking therefore only works for a *different* scenario — a customer who previously completed phone verification and is now adding email as a second method, or has since lost phone access — not the "OTP never arrived during registration" scenario the Register's own option (a) is meant to answer. A secure identity-resolution flow (e.g., requiring a follow-up phone-verification step before treating an email-started registration as fully resolved, with an explicit reconciliation rule if the same phone number later completes verification separately) is an **undesigned prerequisite**, not a solved, low-complexity detail. Also unchanged from the original draft: this option still requires the customer to have and access an email account — in tension with TRD12 §12.4.1's own stated design goal ("phone-based authentication should support customers who do not regularly use email"). Not a universal fallback; a partial one, with an unresolved identity-resolution design gap on top.

### Option B — Google Sign-In as an alternate path (not a true fallback)

- **Approach:** offer Google Sign-In (already `DEC-PROV-004`-approved as an initial mechanism) as an alternate registration path when phone OTP fails.
- **Basis:** `DEC-PROV-004` Principle 3 already approves this mechanism; no new Founder authorization would be needed to offer it in this role.
- **Abuse posture:** Google's own account-security stack (its own MFA, abuse detection) — a strong posture, arguably stronger than phone OTP's.
- **Limitation — corrected by pre-merge review:** requires a Google account, which has the same email-dependency limitation as Option A (a Google account requires an associated email), and does not resolve the case of a customer with no smartphone/email ecosystem access at all — the exact customer segment phone-first authentication was designed for (TRD12 §12.4.1). This option shares **exactly the same** identity-resolution gap just identified for Option A, not a distinct or worse one: a Google-authenticated session in the "phone OTP never succeeded" scenario is also a brand-new, unlinked Firebase UID, not something `linkWithCredential` can attach to a canonical phone identity that doesn't yet exist as an authenticated session. The original draft of this package incorrectly treated this as a problem unique to Option B ("Identity Linking's own unsolved design problem") while describing Option A as already solved via "a standard, documented pattern" — that asymmetry was itself the error corrected above; both options carry the same undesigned identity-resolution prerequisite (`DEC-PROV-004` §8, Principle 3; TRD12 §12.5; AIR-001).

### Option C — Assisted/manual registration (Register option (c), partial)

- **Approach:** a staff- or support-assisted registration path for customers who cannot complete either digital fallback (no email, no Google account, unreliable SMS).
- **Basis:** the Register's own option (c) ("password-based with phone verification") gestures at this but is under-specified — no repository document defines what "assisted registration" concretely means, what staff role performs it, or what verification standard it must meet.
- **Limitation:** this is the least-specified option in the entire Register entry. It cannot be engineering-recommended as-is; it is noted here as a disclosed gap, not a candidate ready for comparison in §6.

### Option not presented as a full candidate — password-based primary authentication

The Register's original option (c) framing ("password-based with phone verification") as a *primary* path is superseded by `DEC-PROV-004`, which has already confirmed phone OTP as primary and Google Sign-In as the second initial mechanism — introducing a third, password-based primary mechanism now would reopen `DEC-PROV-004`'s own settled scope, which this task's constraints explicitly prohibit.

## 6. Comparative Evaluation

*(The sufficiency judgment `RES-001` §6 explicitly deferred to this package.)*

| Criterion | Option A — Email link | Option B — Google Sign-In | Option C — Assisted registration |
|---|---|---|---|
| Engineering complexity of the sign-in call itself | Low — Firebase-native, TRD12-anticipated | Low — Firebase-native, already `DEC-PROV-004`-approved for a different role | Unknown — undefined process, likely highest of the three (new staff tooling/workflow) |
| Abuse resistance | Comparable to phone OTP (built-in link expiry/single-use) | Strong (Google's own account-security stack) | Unknown — depends entirely on an undefined verification standard |
| Coverage of phone-first customers (no email/smartphone ecosystem) | Partial — still requires email access | Partial — still requires a Google account (itself email-linked) | Best coverage in principle, but undefined in practice |
| Identity-resolution complexity — **corrected by pre-merge review** | Unresolved, same class of gap as Option B — standard Firebase account linking presupposes an already-authenticated session, which doesn't exist when the *first* phone-OTP attempt fails; a dedicated resolution flow is undesigned | Unresolved, same class of gap as Option A — see §5; no worse, contrary to the original draft's asymmetric framing | N/A — a human process could resolve identity procedurally, but the process itself is undefined |
| Consistency with existing decisions | Directly matches TRD12 §12.4.1's existing "secondary method" text | Matches `DEC-PROV-004` Principle 3, but repurposes an *initial* mechanism into a *fallback* role not explicitly authorized | Matches the Register's own option (c) in spirit only — text is under-specified |

**Reading the table — corrected by pre-merge review:** the original version of this reading claimed Option A avoided an identity-linking design problem that Option B alone carried. That claim was wrong: both options create a new, unlinked Firebase identity when used as a fallback for a *first* OTP failure, and both require the same undesigned identity-resolution flow before either can be safely implemented (§5, §9, §11). Option A remains preferable on the criteria that are *not* about identity resolution — it matches TRD12 §12.4.1's existing text without reopening `DEC-PROV-004`'s settled scope, and it doesn't repurpose an initial mechanism into a role not explicitly authorized the way Option B does. But "low complexity" was never an accurate description of Option A's identity-resolution problem, and this package no longer claims it is. Option C is not comparable until "assisted registration" is concretely defined — a gap this package discloses rather than resolves.

## 7. Engineering Recommendation

**Recommended option: A — email link sign-in as the fallback**, with Option B (Google Sign-In) remaining available as an independent, parallel initial mechanism per `DEC-PROV-004` (not repurposed as the fallback), and Option C flagged as a genuine gap requiring its own future definition before it could be recommended.

**Support from evidence — corrected by pre-merge review:** Option A requires no new Founder-level scope decision (TRD12 §12.4.1 already names it) and no dependency on an undefined process (unlike Option C). The original draft additionally claimed Option A required "no new identity-linking design problem," describing phone-to-email-link linking as "a standard, already-documented Firebase pattern" — that claim is withdrawn. Firebase account linking presupposes an already-authenticated session; in the exact scenario this decision addresses (a customer's first phone-OTP attempt fails), no such session exists for either Option A or Option B, so neither can rely on ordinary linking, and both require the same undesigned identity-resolution flow (§5, §9). Option A is still recommended over Option B, but on narrower grounds than originally stated: it requires no new Founder-level mechanism-authorization question and stays within TRD12's existing text, not because its identity-resolution problem is smaller — it isn't. This recommendation is not blocked on that gap being closed first (§12), consistent with how `DEC-PROV-004` itself was approved with its own Identity Linking design gap disclosed rather than solved, but the gap must be treated as a named implementation prerequisite (§9), not a solved detail.

## 8. Constitutional Principles, Engineering Recommendation, and Operational Conditions — Distinguished

Per this task's explicit requirement to keep these three categories separate:

- **Constitutional principles (already Founder-decided, via `DEC-PROV-004`, not re-decided here):** the verified phone number is the canonical identity; authentication mechanisms are interchangeable; Firebase Phone Sign-In and Google Sign-In are the two approved initial mechanisms; browsing requires no authentication; authentication is required only for identity-protected actions; trust follows the Anonymous/Authenticated/Verified progressive model.
- **Engineering recommendation (this package, §7, not yet Founder-decided):** email link sign-in as `DEC-SEC-001`'s specific fallback *direction* for failed phone OTP, conditioned on a still-undesigned identity-resolution flow (§9 item 1 — **corrected by pre-merge review**, not a solved detail); Google Sign-In remains a parallel initial mechanism, not repurposed as the fallback; assisted registration is disclosed as undefined, not recommended.
- **Operational conditions (§10 below, gate production activation, not this decision):** the same real-Burundi-SMS-delivery validation `DEC-PROV-004` Principle 8 already established as a launch gate applies identically here, since `DEC-SEC-001`'s fallback only matters in proportion to how often the primary path actually fails in production.

## 9. Implementation Prerequisites

None of these are performed by this package (constraint: no implementation, no code, no application-code modification) — they are the concrete, bounded items `ENG-P2-001` would need once `DEC-SEC-001` is recorded:

1. **A secure identity-resolution flow for the "first OTP attempt fails" scenario — corrected by pre-merge review, now listed first as the load-bearing prerequisite.** Standard Firebase account linking (`linkWithCredential`) requires an already-authenticated session; no such session exists when a customer's first phone-OTP attempt fails, so Option A (or Option B) cannot simply "link" to the canonical phone identity in that moment. A defined flow — e.g., requiring a follow-up phone-verification step before an email-started registration is treated as fully resolved, with an explicit reconciliation rule if the same phone number later completes verification separately — is required before Option A can be implemented as described in §5, per TRD12 §12.5 and AIR-001's one-UID-per-user requirement. Not designed by this package.
2. Email-link sign-in integration (`sendSignInLinkToEmail`/`isSignInWithEmailLink`) — does not exist in the repository today (§2).
3. A defined trigger condition for when the fallback is offered to a customer (e.g., OTP not confirmed within N minutes, or an explicit "didn't receive a code" action) — not specified by this package; an `ENG-P2-001` design item.
4. Firebase project configuration: email-link sign-in method enabled, dynamic-link/action-URL configuration — operational setup, not code.

## 10. Operational Conditions

- **Production SMS validation across Burundi carriers** (the same `EXT-TECH-001` real-carrier test `DEC-PROV-004` Principle 8 already established) remains the condition gating how load-bearing the fallback needs to be in practice — if primary-path delivery proves highly reliable, fallback usage volume will be low; if it proves unreliable, fallback usage and its own abuse-monitoring become materially more important. This is a shared condition with `DEC-PROV-004`, not a new one.
- **Assisted registration (Option C)** must be concretely defined — process owner, verification standard, staff tooling — before it can be treated as an actual fallback tier; until then, customers who cannot use either Option A or Option B have no defined path, a residual gap this package discloses rather than closes.

## 11. Risk Assessment

- **Duplicate-identity risk — corrected by pre-merge review, now the primary residual risk, not Option-B-specific.** The original draft of this section confined identity-linking risk to a *future* choice of Option B. That understated the actual risk: implementing Option A exactly as originally described (email-link "linked" to the canonical phone identity) in the "first OTP attempt fails" scenario would itself create a duplicate, unlinked Firebase UID today — no future task is required to trigger it. This is a real risk against `ENG-P2-001`'s own implementation of the *recommended* option, not a hypothetical about a different option later. It is not mitigated by this package; §9 item 1 names the required design work.
- **Coverage gap risk:** Option A (email) does not serve customers with no email access; without Option C being concretely defined, that customer segment has no fallback at all — disclosed, not resolved.
- **Governance risk:** `DEC-SEC-001`'s literal `Dependencies` field lists `EXT-TECH-001`, still `PENDING` — same evidence-gap risk `DEC-PROV-004` carried and the Founder already accepted via the production-gate framing; this package proposes treating it identically, but that is itself a recommendation requiring Founder concurrence, not an established fact.
- **Scope-conflation risk (mitigated by this package):** the risk that `DEC-SEC-001`'s fallback and `DEC-PROV-004`'s provider-change fallback (Principle 9) get conflated is addressed directly in §2 point 3 and carried through §5–§8 by keeping the two layers explicitly separate.
- **Mitigation strategies:** treat the identity-resolution flow (§9 item 1) as a named, blocking design item for `ENG-P2-001` — implementation must not proceed with the original, incorrect "standard linking" assumption; treat Option C's definition as a named, tracked follow-on item before `ENG-P2-001` implementation planning assumes it exists; treat the Burundi SMS delivery test as the same tracked launch-readiness item `DEC-PROV-004` already established, not a second, duplicate tracking item.

## 12. Decision Readiness

**Ready with Conditions — corrected by pre-merge review.** The evidence in §3–§7 is sufficient for Founder review and a provisional decision on Option A as the fallback *direction*, following the exact precedent `DEC-PROV-004` set for handling the shared, still-outstanding `EXT-TECH-001` evidence gap (treat it as a production-readiness gate, not a decision blocker — §2 point 4, §10). What is **not** ready, and is now a named condition rather than a minor caveat: the identity-resolution flow for the "first OTP attempt fails" scenario (§9 item 1) is undesigned and applies to Option A itself, not merely to a hypothetical future addition of Option B — `ENG-P2-001` must not implement Option A against the original "standard account linking" assumption this package initially (and incorrectly) made. Option C (assisted registration) also remains undefined and is not presented as a decidable candidate. None of these gaps block a decision on Option A as the *chosen direction*, in the same sense `DEC-PROV-004` was approved before its own Identity Linking design gap was closed — but all three should be disclosed to the Founder as explicit, named conditions, not silently deferred or understated as already solved.

## 13. Founder Decision Briefing

**Decision title:** `DEC-SEC-001` — Customer Authentication Approach and Fallback.

**Background:** `DEC-SEC-001` confirms Firebase phone OTP as primary customer authentication (already effectively settled by `DEC-PROV-004`) and defines the fallback if OTP delivery fails. It is one of three remaining open D1 decisions blocking Phase 2 (`ENG-P2-001`). Its Register `Dependencies` field names `EXT-TECH-001` and `DEC-PROV-004` — the latter is now `CONFIRMED`; the former remains `PENDING`.

**Options considered:** (A) email link sign-in as fallback — recommended; (B) Google Sign-In repurposed as the fallback — available but not recommended in this role, since it repurposes an initial mechanism without new authorization; (C) assisted/manual registration — disclosed as undefined, not a decidable candidate today. **Both A and B share the same undesigned identity-resolution gap** for the scenario this decision addresses (§5, §9) — this was corrected during pre-merge review after an earlier draft incorrectly described it as an Option-B-only problem.

**Recommended option:** A — email link sign-in fallback, per §7 — preferred on grounds other than identity-resolution complexity (TRD12 alignment, no new Founder-scope question), since that complexity is now understood to be shared with Option B, not avoided by choosing A.

**Conditions:** (1) a secure identity-resolution flow for the "first OTP attempt fails" scenario must be defined before `ENG-P2-001` implements Option A — this is a genuine design item, not solved by ordinary Firebase account linking (§9 item 1); (2) the same real-Burundi-carrier SMS delivery validation `DEC-PROV-004` Principle 8 already established as a production-readiness gate applies here identically, not as a new, separate condition; (3) Option C (assisted registration) requires its own future definition before any customer segment relying on it has an actual fallback.

**Risks:** duplicate-identity risk if `ENG-P2-001` implements Option A against the original "standard linking" assumption instead of a properly designed identity-resolution flow (§9, §11 — now the primary risk, corrected from an earlier draft that understated it as Option-B-only); coverage-gap risk for customers with no email access until Option C is defined (§10, §11); the shared, still-open `EXT-TECH-001` evidence gap (§4, §11).

**Engineering recommendation:** approve Option A as `DEC-SEC-001`'s fallback *direction*, with all three conditions above disclosed and tracked — condition (1) in particular must be closed before implementation, not merely noted; countersign per the Register's own `Founder decision required: Countersign only` field.

## 14. Files Created or Modified

**Created:** `docs/00-governance/decisions/evidence/DEC-SEC-001-decision-package-2026-07-30.md` (this document). **Modified:** `docs/changes/IMPLEMENTATION_CHANGES.md` (append). **Not modified:** `RES-001`'s evidence package; the Decision Register; `DEC-PROV-004`'s decision package; any application code; any other document.

## 15. Commands Executed

Live re-read of `DEC-SEC-001`, `DEC-SEC-002`, and `DEC-PROV-004`'s current Decision Register entries (`grep -n "^\*\*DEC-SEC-001\|^\*\*DEC-PROV-004" -A 15/17`); re-read of the Resolution Plan's `RES-003` scope and Ownership Matrix row; re-read of TRD12 §12.4.1–12.4.4; repository-wide `grep -rn` search for any phone-OTP/email-link/Google-Sign-In implementation code (zero matches); re-read of `RES-001`'s Engineering Evidence Package §6–§7 and `DEC-PROV-004`'s Decision Package §2/§8/§9; check of the External Dependencies Register's `EXT-TECH-001` row (confirmed still `PENDING`).

## 16. Dependencies Added

None.

## 17. Configuration Changes

None.

## 18. Rollback Instructions

`git revert` of this task's own commit — a single new decision-package document plus one changes-log append; no other file affected.

## 19. Markdown Decision Package

This document: [`docs/00-governance/decisions/evidence/DEC-SEC-001-decision-package-2026-07-30.md`](DEC-SEC-001-decision-package-2026-07-30.md).

## 20. Changes Log

Updated: [`docs/changes/IMPLEMENTATION_CHANGES.md`](../../../changes/IMPLEMENTATION_CHANGES.md).
