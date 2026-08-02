> **Title:** FD-IDENTITY-001 — Repository Impact Assessment and Migration Plan
> **Status:** Analysis complete and applied. This document's findings were countersigned by the Founder and executed in task `IDENTITY-ALIGN-001` — see the [Founder Decision Package](FD-IDENTITY-001-founder-decision-package-2026-08-01.md) for the recorded decision and [`IDENTITY-ALIGN-001` Implementation Report](../../../05-implementation/reports/IDENTITY-ALIGN-001-implementation-report-2026-08-01.md) for exactly what was applied where. No application code was modified by either task.
> **Date:** Prepared 2026-08-01, per task `IDENTITY-STRATEGY-001`; applied 2026-08-01, per task `IDENTITY-ALIGN-001`.
> **Classification:** Constitutional-impact analysis. Task brief: "The coding agent should not modify application code... Produce a complete implementation roadmap before any engineering resumes."
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/FD-IDENTITY-001-impact-assessment-and-migration-plan-2026-08-01.md`

---

## 1. Executive Summary

The Founder's `FD-IDENTITY-001` decision separates Authentication, Identity, and Verification into three independent capabilities and removes mandatory phone verification from initial platform participation. This repository already contains a partial, less complete version of this idea — `DEC-PROV-004`'s "Progressive Trust Model" (Anonymous/Authenticated/Verified) and `DEC-SEC-001`'s "Progressive Phone Verification" principle both anticipate progressive trust, but both were confirmed by the Founder on 2026-07-30, only two days before `FD-IDENTITY-001`, and both still **conflate** what `FD-IDENTITY-001` now explicitly separates: `DEC-PROV-004` Principle 1 declares *"the verified mobile phone number is the customer's canonical identity"* — the exact conflation `FD-IDENTITY-001` Principle 1 (*"a customer's identity exists independently of any verification method"*) corrects.

This is not a greenfield decision landing on untouched ground. It arrives two days after a Founder-directed "Capability 2 Resolution Sprint" confirmed four D1 decisions (`DEC-SEC-001`, `DEC-PROV-004`, `DEC-ID-003`, `DEC-DATA-007`) specifically to unblock Capability 2 engineering work, and one day after that sprint's formal closure. `ENG-P2-001` (Customer Identity Implementation) has **not yet started** — no code exists for it. This is the narrowest possible window in which a decision like this could land: the governing text needs correction, but no implementation needs to be un-built.

**Bottom line:** `FD-IDENTITY-001` requires amending, not superseding, `DEC-PROV-004` and `DEC-SEC-001` (§4), does not touch `DEC-ID-003`/`DEC-DATA-007`/`DEC-ID-001` in substance (§4), and requires a new capability — internally named **Identity Trust Management (ITM)**, per the Founder's own follow-on naming recommendation — inserted into the Capability Delivery Roadmap between the redefined Capability 2 (Identity) and the new Capability "Authentication" (§5/§6). No engineering work package has been implemented against the pre-`FD-IDENTITY-001` model, so the migration cost is entirely a **documentation and decision-register correction cost**, not a rework cost.

## 2. Method and Sourcing Discipline

Every finding below is sourced directly from the live repository state at commit `defce80` (branch `main`, the tip after `EXT-TECH-001-HARNESS-CR3` merged), read directly by this task — not inferred, not reused from a stale checkout. A first-pass automated sweep flagged that the repository's primary checkout at `/Users/theo/11THONUS` is 152 commits behind `origin/main` and holds uncommitted local drift; that checkout was **not** used as a source for any finding below. All quotations are verbatim from the files named, each with its exact section/line reference.

## 3. Documents Affected

### 3.1 Decision Register — `docs/00-governance/decisions/decision-register.md`

| Decision | Status today | Why affected |
|---|---|---|
| `DEC-PROV-004` — Phone OTP delivery route (Identity and Authentication Strategy) | CONFIRMED, 2026-07-30 | Principle (1) declares the verified phone number is canonical identity — directly superseded in substance by `FD-IDENTITY-001` Principle 1. Principle (7)'s three-tier Anonymous/Authenticated/Verified model is a coarser precursor to Progressive Trust/ITM. **Requires amendment**, not full supersession (§4.1). |
| `DEC-SEC-001` — Customer authentication approach and fallback | CONFIRMED, 2026-07-30 | Its Progressive Phone Verification principle still frames phone verification as gating "identity-protected capabilities such as reward redemption" — `FD-IDENTITY-001` Principle 5 explicitly says redemption of the standard 11th reward requires no verification. **Requires amendment** (§4.2). |
| `DEC-ID-003` — Permission inheritance semantics | CONFIRMED, 2026-07-30 | Its Identity and Accountability Principle states permissions are exercised by "verified identities acting within assigned roles" and explicitly cross-references "the Progressive Trust Model confirmed under `DEC-PROV-004`." Once `DEC-PROV-004` is amended, this cross-reference needs a citation update only — **no substantive change**, since "verified identities" here means authenticated platform identities generally, not specifically phone-verified ones, and this decision governs staff/business permission resolution, a domain `FD-IDENTITY-001` does not touch. |
| `DEC-DATA-007` — Loyalty number and QR reference generation | CONFIRMED, 2026-07-30 | No reference to authentication or verification anywhere in its Final Decision text. Loyalty-number/QR generation is explicitly unaffected — consistent with the Founder's own statement that Reward Engine and Customer Identity capabilities are unchanged. **No change required.** |
| `DEC-ID-001` — One portable loyalty identity | CONFIRMED (pre-register) | Describes the permanent identity (internal ID, loyalty number, QR) surviving phone/email changes — this is exactly `FD-IDENTITY-001` Principle 1's permanent-identity model already in force. **No change required; cite as pre-existing support.** |
| `DEC-ID-004` — Customer phone-number lookup by business staff | OPEN_FOUNDER | Independent, unrelated question (staff lookup UX, not customer verification requirement). **No change required.** |

No `DEC-AUTH-*`, `DEC-IDENTITY-*`, or `DEC-TRUST-*` decision ID prefix exists anywhere in the register today — `FD-IDENTITY-001` is new ID territory (§7 recommends a prefix).

### 3.2 Capability Delivery Roadmap — `docs/05-implementation/roadmap/CDR-001-capability-delivery-roadmap.md`

§5's Capability 2 definition — *"a customer can register, prove who they are at the minimum level required, and receive a scannable loyalty identity"* — conflates identity issuance with a "prove who they are" verification framing in its own objective statement, and its "Major engineering work package(s)" bundles `ENG-P2-001` ("customer identity — auth, profile, loyalty number, QR") as one undifferentiated unit spanning authentication, profile, and identity issuance. This is the single document requiring the most substantial restructuring (§5/§6 below propose the split).

### 3.3 Capability 2 Resolution Plan — `docs/05-implementation/roadmap/ENG-P2-RES-000-capability-2-resolution-plan.md`

§7's 8-item Capability Authorisation Gate is written entirely against the pre-`FD-IDENTITY-001` model: item 1 gates `ENG-P2-001` on `EXT-TECH-001` (Burundi SMS delivery evidence) as if phone-OTP delivery proof were a precondition for *any* customer registering at all. Under `FD-IDENTITY-001`, `EXT-TECH-001` evidence gates the *phone-authentication provider* and the *phone-verification signal under ITM* — not baseline registration. This gate needs re-scoping once the capability split (§5) is authorized, not before.

### 3.4 Canonical Reference — `docs/00-governance/canonical-reference.md`

§10 MVP Boundaries states: *"In scope (Strict MVP, TRD22 §22.5): customer identity (phone auth, loyalty number, QR)..."* — this line bakes "phone auth" into the customer-identity scope statement itself. Needs rewording to separate identity issuance (always in scope) from authentication method (now provider-agnostic) and verification (now progressive/optional).

§4's Canonical Terminology table has no entry for "Authentication," "Verification," or "Trust Level" — if `FD-IDENTITY-001`/ITM introduces new customer- or product-facing vocabulary, new terminology rows are needed (a later, product-copy-stage task, not this one).

### 3.5 Platform Constitution — `docs/00-governance/platform-constitution.md`

**CP-007 — Progressive KYC** already states: *"Customers should provide information progressively as trust and value increase. Registration should remain lightweight."* This is a **pre-existing constitutional principle already philosophically aligned with `FD-IDENTITY-001`** — no amendment needed. It is the strongest existing constitutional hook for `FD-IDENTITY-001` and should be cited directly in the Founder decision package (§9 of the companion package) as prior constitutional support, not introduced as if new.

### 3.6 PRD2 — `docs/01-product/prd/02-customer-registration-and-identity.md`

The primary product document requiring correction:

- **§4 "Identity 4 — Authentication Identity"** (line 96): already separates authentication (*"phone number / email / future authentication providers... Used only for account access"*) from identity — structurally compatible with `FD-IDENTITY-001`. It has no equivalent "Identity — Verification" concept, since verification does not appear anywhere in PRD2's five-identity model at all.
- **§5 "Registration Journey," Steps 2–4** (lines 137–147): *"Step 2. Enter mobile number. Step 3. Verify number. Step 4. Create account."* — phone verification is sequenced as a **mandatory gate before the account exists**. This is the single most directly contradicted passage in the repository. `FD-IDENTITY-001` Principle 5 requires customers to be able to "register, receive a loyalty identity, participate, earn qualifying purchases, and redeem the standard 11th reward" without mandatory phone verification — meaning Step 3 as a *blocking* step must be removed or reordered to *after* Step 4 (or made conditional/optional).
- **§7 "Customer Account Status"** (lines 191–224): `Pending Verification` = *"Registration started. Identity not yet verified"* vs. `Active` = *"Customer may fully use the platform"* — implies full platform use is gated on verification completing. Contradicted; needs a status model that separates "has an identity" from "has verified an attribute."
- **§6 "Minimum Registration Information"** (line 168 onward): mobile number is Mandatory. This is compatible with `FD-IDENTITY-001` if read as "provide a number" (authentication-method collection), not "verify the number" — but the surrounding Step 2/3 language currently reads as the latter. Needs disambiguating wording, not a change to what's collected.

### 3.7 TRD12 — `docs/02-technical/trd/12-security-and-access-control.md`

- **§12.3 Identity Architecture** (line 74 onward): *"Firebase Authentication → Authenticated UID → 11thONUS User Record → Customer Profile and/or Business Memberships → Active Role Context → Server-Side Authorization."* This layering already cleanly separates Firebase Authentication (a mechanism) from the 11thONUS platform identity — structurally compatible with `FD-IDENTITY-001`'s Authentication/Identity split. **It has no distinct Verification/Trust layer at all** — this is the structural gap ITM needs to fill, not a contradiction to fix.
- **§12.4.1 Customer Authentication** (line 98): *"The preferred customer authentication methods are: mobile phone number with one-time password; email and password or passwordless email as a secondary method; future Google and Apple sign-in."* **Already known-stale** — both `DEC-PROV-004`'s and `DEC-SEC-001`'s own Decision Register entries flag this exact section as needing correction (Google Sign-In approval, 2026-07-30, never propagated here) and explicitly defer that correction as follow-on work not yet performed. `FD-IDENTITY-001` adds a second, independent reason this section needs rewriting: phone OTP must read as *one of several equal authentication providers*, not "the preferred method."
- **§12.30/§12.31 Account Recovery / Lost Phone Number**: also already flagged stale by `DEC-SEC-001`'s own "Document corrections required" field (align with its newer Recovery Order/Identity Recovery Principles) — not yet performed. `FD-IDENTITY-001` does not add new requirements here beyond what `DEC-SEC-001`'s already-pending correction covers.
- **§12.55 Functional Requirements (FR-SEC-001–018)**: the formal, RTM-traced requirement set. None of these requirements, read individually, mandate phone verification before registration — the mandatory-verification requirement lives in PRD2, not here. No FR-SEC-* text change is strictly required by `FD-IDENTITY-001`, though FR-SEC-016 ("Customer profile and KYC information shall be exposed only according to purpose and consent") is a natural anchor point for ITM's future risk-based-disclosure requirements.

### 3.8 TRD10 — `docs/02-technical/trd/10-firestore-data-architecture.md`

**§10.6.1 `users` collection**: `status: "pending" | "active" | "locked" | "suspended" | "closed" | "archived"` — **no `phoneVerified`, `emailVerified`, or trust-level field exists anywhere in this schema.** This is a structural gap, not a contradiction: Progressive Trust/ITM (verified phone, verified email, account age, purchase history, device history) currently has nowhere to persist. Schema design is future implementation work, not something this task should specify (see §6, out of scope).

**§10.6.2 `customerProfiles`**: "Progressive KYC Rule: Optional information shall remain absent rather than being populated with false placeholders" — pre-existing, compatible in spirit, scoped narrowly to profile *fields*, not a trust-scoring mechanism. No change required.

### 3.9 Requirements Traceability Matrix — `docs/00-governance/requirements-traceability-matrix.md`

Approximately 48 rows trace to authentication/identity/permission requirements (`FR-CI-001`–014, `FR-SEC-001`–018, `AIR-001`–006, plus adjacent `FR-AUTHZ-*` rows) — **all currently "Not Started."** Since no implementation exists against any of these rows, there is no completed work to retroactively correct — only the requirement *text* and *mapping* may need adjustment once PRD2/TRD12 are corrected, and only after `FD-IDENTITY-001` is Founder-countersigned (this task does not edit the RTM).

### 3.10 Engineering Implementation Programme — `docs/05-implementation/change-tracking/engineering-implementation-programme.md`

Phase 2 ("Identity, Roles and Business Context") — current status **Blocked**, gated only on `EXT-TECH-001` and `DEC-PROD-012` per the Capability Authorisation Gate. Work package `ENG-P2-001` ("Customer identity — auth, profile, loyalty number, QR") — status `Blocked`, **zero implementation exists**. This is the single work package `FD-IDENTITY-001` most directly redefines the scope of (§6 proposes splitting it).

### 3.11 `verified-loyalty-principles.md` / `verified-loyalty-governance-freeze-v1.md`

Both files govern the **Reward Lifecycle Engine only** (Verified Units, Loyalty Cycles, reward creation/redemption) and both explicitly state their scope excludes "account/identity concerns (PRD1/PRD2)." Their use of "verification"/"verified" is entirely about *purchase* verification (a customer confirming their own recorded purchase), an unrelated mechanic governed by `DEC-PROD-002`. **No contradiction with `FD-IDENTITY-001`; corroborates the Founder's own statement that the Reward Engine is unchanged.** Separately: neither file is committed to git history (confirmed via `git log --all`, zero matches) despite being cited as constitutional authority by multiple Decision Register entries — a pre-existing governance-hygiene gap, unrelated to `FD-IDENTITY-001`, flagged here for visibility only. This task does not attempt to fix it (out of scope, unrelated file).

### 3.12 Terminology-collision risk (not a contradiction, a communication risk)

Three separate, legitimate uses of "verified"/"verification" already coexist in this repository:
1. **Purchase verification** (`DEC-PROD-002`, PRD4, PRD5, Capability 4 "First Verified Purchase") — a customer confirming a recorded transaction. Unrelated to identity.
2. **Product branding** ("11thONUS is a Customer-Verified Loyalty Platform," Canonical Reference §1) — brand-level "Verified," also about purchase confirmation.
3. **Identity verification** (`DEC-PROV-004`/`DEC-SEC-001`'s current usage, and `FD-IDENTITY-001`'s own "Verification Strengthens Identity" principle) — the concept `FD-IDENTITY-001` is about.

`FD-IDENTITY-001`/ITM communications (Founder-facing, and later customer-facing product copy) should disambiguate these explicitly — recommended as a documentation task at rollout, not a repository defect to fix now.

## 4. Decision Records Requiring Amendment (not supersession)

### 4.1 `DEC-PROV-004`

**Why amendment, not supersession:** four of its nine Final Decision points are unaffected and remain correct under `FD-IDENTITY-001` — (3) initial approved mechanisms (Firebase Phone Sign-In, Google Sign-In) remain valid provider choices; (4) future-provider extensibility is exactly what `FD-IDENTITY-001` Principle 2 requires; (5) "Browsing shall not require authentication" is unaffected; (8)/(9) the Burundi SMS production-readiness framing is unaffected — SMS delivery evidence still gates *production activation of the phone-OTP provider*, just no longer gates *baseline registration*.

**What specifically needs amendment:**
- Point (1) *"the verified mobile phone number is the customer's canonical identity"* — must be replaced. Under `FD-IDENTITY-001`, canonical identity is the Internal Customer ID / Loyalty Number / QR Code triad (Principle 1); the phone number becomes one possible authentication credential and one possible verification signal, neither of which is canonical identity.
- Point (7) *"Identity trust shall follow a progressive model: Anonymous; Authenticated; Verified"* — this 3-tier model should be explicitly reframed as an early, coarser precursor to the full Trust Lifecycle Management model (continuous multi-signal trust: verified phone, verified email, account age, purchase history, device history, merchant history — `FD-IDENTITY-001` Principle 4), not discarded, since "Authenticated" and "Verified" remain meaningful trust states within ITM's richer model.

### 4.2 `DEC-SEC-001`

**Why amendment, not supersession:** its Authentication Recovery Order (SMS OTP → Retry → Google Sign-In → Email → Assisted Support) is unaffected — recovery mechanics are independent of whether verification gates initial registration. Its 8 Identity Recovery Principles are almost entirely unaffected (identity belongs to the customer, recovery never creates a duplicate, participation continues across recovery, etc.) — these describe *account recovery*, not *initial onboarding*, and `FD-IDENTITY-001` does not touch recovery.

**What specifically needs amendment:**
- The Progressive Phone Verification clause — *"phone verification... is not a universal onboarding blocker. The platform may progressively request phone verification throughout the customer journey and require it before access to identity-protected capabilities such as reward redemption"* — the phrase "such as reward redemption" must be corrected. `FD-IDENTITY-001` Principle 5 explicitly lists "redeem the standard 11th reward" among the capabilities available *without* mandatory verification. The clause's general shape (progressive, risk-based) is correct and should be preserved; only the specific example needs correcting to align with `FD-IDENTITY-001` Principle 6's actual higher-risk examples (account ownership change, account recovery, identity transfer, gift/wallet features, higher-value promotional rewards).

### 4.3 `DEC-ID-003`

**No amendment required.** Its cross-reference to "the Progressive Trust Model confirmed under `DEC-PROV-004`" will resolve correctly once `DEC-PROV-004` itself is amended (the cross-reference is to a concept, not to specific superseded wording), and its "verified identities acting within assigned roles" language refers to *authenticated platform identities* in the staff/business-permission context, a domain `FD-IDENTITY-001` does not touch. Flagged for a citation-currency check only, at whatever future point `DEC-PROV-004`'s amendment is recorded — not a substantive edit.

## 5. Decision Records Requiring Supersession

**None.** Every affected decision (`DEC-PROV-004`, `DEC-SEC-001`) requires targeted amendment of specific clauses, not wholesale replacement — their provider selections, recovery mechanics, and general progressive-trust *shape* remain correct and load-bearing. A full supersession would discard genuinely still-valid content (provider choices, recovery order, seven of eight Identity Recovery Principles) and would be inconsistent with this repository's own established amendment practice (e.g., `DEC-LOY-014`/`DEC-LOY-015` superseded `DEC-LOY-002`/`DEC-LOY-005` only when the *entire* prior decision was being replaced, not when specific clauses needed correction — this is the finer-grained case).

## 6. Recommended New Capability Boundary

### 6.1 The core redesign

Split the current, conflated **"Capability 2 — Customer Identity"** (which bundles auth + profile + loyalty-number/QR + role/permission resolution into `ENG-P2-001`/`ENG-P2-004`) into three independently deliverable units:

| Capability | Objective | Contains | Excludes |
|---|---|---|---|
| **Capability 2 — Customer Identity** (redefined, narrower) | A customer receives a permanent, portable loyalty identity. | Internal Customer ID assignment; Loyalty Number/QR generation (`DEC-DATA-007`, unaffected); customer profile (minimum info, progressive per CP-007); identity-linking across authentication providers. | Authentication mechanism selection; any verification requirement. |
| **Capability "Authentication"** (new, split out of old Capability 2) | A customer can prove they are the same person returning to their existing identity, via any approved provider. | Firebase Phone Sign-In, Google Sign-In, future providers, as interchangeable access mechanisms; identity-linking mechanics (shared boundary with Capability 2); session/recovery flows (`DEC-SEC-001`, largely unaffected). | Any concept of "trust level" or verification strength — authentication answers only "is this the same customer," per `FD-IDENTITY-001` Principle 2. |
| **Capability "Identity Trust Management (ITM)"** (new) | The platform tracks and acts on how much confidence it has in a customer's identity, and that confidence grows through behavior over time. | Verified-phone/verified-email signals; account-age, purchase-history, device-history, merchant-history signals; risk-based verification triggers for high-risk actions (ownership change, recovery, identity transfer, future gift/wallet features, higher-value promotional rewards); the trust-scoring/trust-state model itself. | Ordinary loyalty participation (buy 10 → earn 11th) — Reward Engine remains dependency-free of ITM, per the Founder's own explicit statement. |

**Naming:** "Progressive Trust" remains the Founder's own principle/product-philosophy name (used verbatim in `FD-IDENTITY-001`'s own text, e.g. Principle 4's heading) and should be preserved as-is wherever quoting the Founder's decision. **"Identity Trust Management (ITM)" is adopted, per the Founder's explicit follow-on recommendation, as the internal engineering/capability name** — used in the Capability Delivery Roadmap, Engineering Implementation Programme, work-package IDs, and technical documents; never customer-facing.

### 6.2 Engineering work-package consequence (recommendation only — no Programme edit performed by this task)

- `ENG-P2-001` ("customer identity — auth, profile, loyalty number, QR") should be split into a narrower `ENG-P2-001` (Customer Identity: profile, loyalty number, QR, identity-linking) and a new `ENG-P2-00X` (Authentication: provider integration, session management) — sequenced so Identity can be implemented and validated independently of which authentication provider is wired up first.
- A new ITM work package (suggested `ENG-P2-00Y` or a new Phase, pending Programme-owner judgment) is sequenced *after* Identity and Authentication both exist, since ITM consumes signals (verified phone, verified email, account age, purchase history) that only exist once those two capabilities are live.
- `ENG-P2-004` (role/permission resolution, shared with Capability 3) is **unaffected** — it governs staff/business permission semantics (`DEC-ID-003`), a separate domain.

This task does **not** edit the Engineering Implementation Programme, `CDR-001`, or create/renumber any `ENG-P2-*` work package — that is an engineering-mobilization action requiring its own Founder/Engineering-Lead authorization, consistent with the "no engineering resumes" instruction and this task's read-only constraint on application/architecture artifacts.

## 7. Capability Impact Matrix

| Capability (current numbering) | Affected by `FD-IDENTITY-001`? | Nature of impact |
|---|---|---|
| 0 — Engineering Foundation | No | Unrelated, already Complete. |
| 1 — Platform Foundation | No | Unrelated, already Complete. |
| 2 — Customer Identity | **Yes — redefined, narrower** | Objective statement and work-package scope both change (§6.1). No implementation exists yet, so no rework. |
| *(new)* Authentication | **Yes — newly split out** | Did not exist as an independent capability before; carved out of old Capability 2. |
| *(new)* Trust Lifecycle Management | **Yes — newly created** | Entirely new capability; did not exist in any form before `FD-IDENTITY-001`/`DEC-PROV-004`'s embryonic 3-tier model. |
| 3 — Business Identity | No | Distinct domain (business/staff, not customer); `ENG-P2-004` permission resolution unaffected (§4.3). |
| 4 — First Verified Purchase | **No — name collision only** | "Verified" here means purchase-verification (`DEC-PROD-002`), an unrelated mechanic (§3.12). No content impact; flag naming-collision risk only. |
| 5 — Progress Tracking | No | Depends on Capability 4 (purchase verification), not identity verification. |
| 6 — First Reward | **No — explicitly confirmed unaffected by the Founder** | Reward Engine "remains unchanged... no verification dependency," per the Founder's own decision text. |
| 7 — Business Operations | No | Unrelated domain. |
| 8 — Platform Operations | No | Unrelated domain. |
| 9 — Platform Optimisation | No | Unrelated domain. |

## 8. Risks

1. **Terminology collision at rollout** (§3.12) — if `FD-IDENTITY-001`/ITM communications don't explicitly disambiguate "verification" (identity) from "verified" (purchase, brand), Founder-facing and later customer-facing materials risk genuine confusion between two unrelated concepts that already share a word in this repository. *Mitigation:* explicit terminology note in the Founder decision package (done, §9 of the companion document) and in any future customer-facing copy work.
2. **`EXT-TECH-001`/Capability Authorisation Gate re-scoping ambiguity** — the current 8-item gate (§3.3) ties `EXT-TECH-001` evidence to unblocking `ENG-P2-001` as a whole. Once Capability 2 splits (§6), a decision is needed on whether `EXT-TECH-001` still gates the (now much narrower) Authentication capability specifically, or becomes a ITM-capability gate instead — this task deliberately does not resolve this (§6.2), since it requires Engineering-Lead/Founder judgment on capability sequencing, not repository research.
3. **Decision Register mechanical-dependency edge, inherited unresolved.** `DEC-PROV-004`'s own decision package already disclosed (2026-07-30) that its `Dependencies` field names `DEC-SEC-001` as a formal registry precondition that was never mechanically resolved when both were confirmed. Amending both decisions under `FD-IDENTITY-001` is a natural point to resolve this pre-existing loose end, but it predates and is independent of this decision — flagged, not fixed, by this task.
4. **Schema gap has no owner yet.** TRD10's `users` collection has no `phoneVerified`/trust-level field (§3.8) — until a future implementation task designs this, ITM has no data model. Not a blocker to Founder-approving `FD-IDENTITY-001` itself, but a prerequisite before `ENG-P2-001`(narrowed)/Authentication/ITM implementation can begin.
5. **Governance-artifact drift, a known and accepted pattern in this repository.** Every decision in the 2026-07-30 Resolution Sprint explicitly deferred syncing the Engineering Implementation Programme/`CDR-001`/RTM as "follow-on work, not performed by this recording." `FD-IDENTITY-001`'s own amendments to `DEC-PROV-004`/`DEC-SEC-001` will inherit the same drift unless a dedicated sync task is scheped after Founder countersign — recommended explicitly in §9 (migration sequence) below, not assumed to happen automatically.

## 9. Recommended Migration Sequence

1. **Founder review and countersign of `FD-IDENTITY-001`** itself, using the companion [Founder Decision Package](FD-IDENTITY-001-founder-decision-package-2026-08-01.md) — including its proposed amendment text for `DEC-PROV-004`/`DEC-SEC-001`. Nothing in §2–§8 of this document is applied to any governing file until this step completes.
2. **Decision Register update** — record `FD-IDENTITY-001` as a new entry (proposed ID: `DEC-IDENTITY-001`, a new prefix — see companion package §1 for the naming rationale) and apply the Founder-approved amendment text to `DEC-PROV-004` §Final decision and `DEC-SEC-001` §Final decision, per this repository's established "record the Founder's exact words, do not paraphrase" convention.
3. **Governing-document correction pass** — PRD2 §5 Steps 2–4 and §7 account-status model; TRD12 §12.3/§12.4.1 (already independently flagged stale, now with a second reason); Canonical Reference §10 MVP boundary wording. Each edit narrowly scoped, one PR per document or one bundled PR with per-file commits, following this repository's "do not modify unrelated files" discipline.
4. **Capability Delivery Roadmap (`CDR-001`) restructuring** — split Capability 2, insert the Authentication and ITM capabilities, re-sequence `ENG-P2-*` work packages (§6.2). Requires its own Engineering-Lead-authored proposal (this task explicitly does not perform it), reviewed against the same rigor `CDR-001`'s original authoring and its 4-review-finding correction round already established as this repository's bar for this class of document.
5. **Capability Authorisation Gate re-scoping** — decide `EXT-TECH-001`'s new binding point (§8 risk 2) as part of step 4, not before it (the gate's shape depends on the capability split's final shape).
6. **RTM/Engineering Implementation Programme sync** — a dedicated, narrowly-scoped sync task, explicitly not bundled into steps 2–5, consistent with this repository's own established pattern of treating tracker-sync as a distinct follow-on task class.
7. **Schema design task** (TRD10 `users`/`customerProfiles` trust-signal fields) — sequenced after step 4 confirms ITM's exact scope, since schema design should follow capability definition, not precede it.
8. **`ENG-P2-001`(narrowed)/Authentication/ITM implementation** — begins only once steps 1–7 are complete and the (re-scoped) Capability Authorisation Gate is satisfied. This is the point at which "engineering resumes," per the task brief's own framing — explicitly out of scope for this task.

## 10. Rollback Strategy

Because no application code or implementation exists against the pre-`FD-IDENTITY-001` model (§1), rollback is purely a documentation-and-decision-register action, with no code, schema, or data-migration component:

- **If the Founder does not countersign `FD-IDENTITY-001`:** no rollback is needed — this document and its companion package are read-only proposals; nothing in the live Decision Register, PRD, TRD, or roadmap changes until Step 1 (§9) completes.
- **If `FD-IDENTITY-001` is countersigned but a later Founder decision reverses it:** since every governing-document edit in Step 3 (§9) is a normal, git-tracked commit, `git revert` of the specific correction commits restores the prior PRD2/TRD12/Canonical Reference wording exactly. The Decision Register amendment (Step 2) would itself need a new, explicit Founder-authorized reversal entry — consistent with this repository's own standing rule that decisions are never silently rewritten, only amended or superseded by a new recorded decision.
- **If implementation has begun by the time of a reversal:** not assessed here, since implementation has not begun and is out of this task's scope — a future rollback assessment would need to run at that time, against whatever code exists then.

## 11. What This Task Deliberately Did Not Do

Per the task brief's explicit constraints:

- No application code was read for modification purposes, and none was modified.
- No PRD, TRD, Decision Register entry, Canonical Reference, Platform Constitution, `CDR-001`, Engineering Implementation Programme, or RTM was edited. All are quoted verbatim above for analysis only.
- No new Decision Register entry was created (that is a Step 2 action, post-countersign).
- No `ENG-P2-*` work package was renamed, split, or renumbered in any tracked document (that is a Step 4 action).
- The pre-existing, unrelated governance-hygiene finding (§3.11 — two files cited as constitutional authority but never committed to git) was flagged for visibility but not corrected, since it is out of this task's scope.
