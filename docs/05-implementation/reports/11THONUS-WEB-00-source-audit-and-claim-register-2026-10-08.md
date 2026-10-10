> **Identifier:** 11THONUS-WEB-00 · **Version:** 0.1 · **Date:** 2026-10-08 · **Status:** EVIDENCE AUDIT — FOUNDER REVIEW REQUIRED; NOT APPROVED FOR PUBLICATION  
> **Owner:** 11thONUS Founder / Web Strategy Workstream · **Scope:** Phase A only · **Repository basis:** `main` at `4bc9c49261c1db8bfdacb3d91b68d51ad59e47f9` (latest returned by GitHub commit search during audit)  
> **Authority:** This is a subordinate assessment. Platform Constitution, approved Decision Register entries and current controlled PRD/TRD/Founder decisions govern.  
> **Dependencies:** 11THONUS-WEB-STRATEGY-CONTENT-DESIGN-AND-IMPLEMENTATION-BRIEF (2026-10-08); Phase A Founder gate; Phase B WEB-01.

# 11THONUS-WEB-00 — Source Audit and Claim Register

## 0. Executive disposition

**Phase A review draft; NOT READY for Phase B approval yet.** This record distinguishes verifiable product truth from implementation, prototype, historical statements and public availability. It is not a complete launch audit and must not be interpreted as approval of marketing copy, signup or deployment. No product or website code was changed.

**Highest-confidence findings:** The product is a **Customer-Verified Loyalty Platform**; the business records the purchase and the customer verifies the recorded qualifying units before loyalty progress exists; the earning rule is fixed at **10 verified units** for the **11th / On Us Moment**; current commercial policy is **USD 2 equivalent per commercial unit** and **3–5 trial units**, with subscriptions/tiering deferred. A local Founder Preview is not a public launch.

## 1. Audit basis and authority inventory

All repository paths below were inspected on the GitHub default branch as of this audit unless explicitly marked **inventory-only / requires detailed review**. Status is document metadata, not an inference about release readiness.

| ID | Canonical path | Version / status / date | Governing relevance |
|---|---|---|---|
| S01 | `docs/00-governance/platform-constitution.md` | v1.1; Foundational Governance; 2026-07-16 | Highest-order identity, mission, customer trust |
| S02 | `docs/00-governance/decisions/decision-register.md` | Live register, inspected 2026-10-08 | Decision statuses; DEC-PROD-001/002, DEC-SUB-014; open decisions must not be inferred |
| S03 | `docs/00-governance/decisions/evidence/FD-COM-001-core-commercial-model-founder-decision-2026-09-29.md` | v1.0; APPROVED; 2026-09-29 | Consumption pricing, trial, credit, grace, reward preservation |
| S04 | `docs/01-product/prd/00-product-foundation.md` | v1.0; Draft for review (pre-freeze); 2026-07-16 | Audiences and brand promise; defer to confirmed later decisions on conflicts |
| S05 | `docs/01-product/prd/04-customer-verified-loyalty.md` | v1.0; Draft for review, Authoritative Product; 2026-07-16 | Verified Unit, Loyalty Cycle, reward semantics |
| S06 | `docs/01-product/prd/05-purchase-verification.md` | v1.0; Draft for review, Authoritative Product; 2026-07-16 | Distinguishes business-entered record, customer confirmation, trust events |
| S07 | `docs/01-product/product-experience-principles.md` | v1.0; Active design philosophy; 2026-07-17 | Plain-language explanation; not UI or launch approval |
| S08 | `docs/02-technical/trd/17-subscription-and-billing.md` | v1.0; SUPERSESSION-BOUND notice 2026-09-29 | Historical subscription-first text is NOT pricing authority |
| S09 | `docs/00-governance/11thonus-infrastructure-disposition-v1.md` | v1.0; Founder-accepted; 2026-08-28 | Firebase-native classification is historical architecture context, not marketing-site hosting authorization |
| S10 | `docs/05-implementation/reports/11THONUS-EXP-REF-001-experience-reference-product-truth-binding-assessment-2026-09-29.md` | v1.0; Assessment awaiting Founder review | Adopted app prototype SHA `18e8d700f505beefe46d324f6ea33f20a670abe7`; NOT website experience reference |
| S11 | `docs/05-implementation/reports/11THONUS-EA-001-founder-preview-and-experience-assembly-readiness-assessment-2026-10-02.md` | v1.0; Assessment awaiting Founder review | Capability-vs-screen gap as of October 2, not immutable current state |
| S12 | `docs/05-implementation/reports/ea-002-local-founder-preview-foundation-implementation-report-2026-10-02.md` | v1.0; Implemented, pending Founder review | Local emulator + PostgreSQL preview, explicitly not production |
| S13 | `docs/05-implementation/reports/11THONUS-COMMERCIAL-DESIGN-001-consumption-first-commercial-domain-and-architecture-design-2026-09-30.md` | v1.1; corrected design; metadata says pending merge review — verify present merged authority before reliance | Details of credit and held-purchase rules; not public operational proof |
| S14 | `apps/web/src/App.tsx` | Source at audited main | Concrete React route inventory and guards |
| S15 | `docs/05-implementation/11thonus-master-workflow.md` | Live workflow; inspected | Programme sequencing; detailed post-Oct-2 maturity check still needed |
| S16 | `docs/01-product/prd/03-business-registration.md`; `docs/02-technical/trd/20-deployment-and-operational-resilience.md`; `docs/02-technical/trd/21-privacy-and-data-protection.md` | **Inventory-only; detailed review outstanding** | No public authorization inferred |

**Repository confirmation limit:** latest search response returned `4bc9c49261c1db8bfdacb3d91b68d51ad59e47f9`; direct protected-main ref validation, complete changed-file inventory, latest outstanding PR review, full PRD/TRD sweep, and binary brand asset inspection remain outstanding. Those checks must precede Phase A sign-off.

## 2. Product and commercial truth

1. **Category and positioning anchor:** `Customer-Verified Loyalty Platform` (S01 Art.1; S02 DEC-PROD-001). `Verified Commerce™` is an ambition, not current MVP category.
2. **Record ≠ verified progress:** A business records an eligible purchase; the customer verifies its record; only customer-verified qualifying units become Verified Units (S05 §§2–3; S06 §§2–4). Neither a visit, purchase payment, receipt, nor pending record automatically increments verified progress.
3. **Circle:** Ten verified qualifying units lead to reward availability in the fixed 10+1 construct, subject to governing earning/redemption rules (S05; S03 §2). Do not market alternative configurable earning thresholds.
4. **Business defines qualifying items/reward within governed rules:** Do not imply business may change the ten-unit earning side or that reward redemption is unconditional (S01; S05; S02).
5. **Commercial:** Consumption-first, USD 2 equivalent per commercial unit, tied to completion of the ten-qualifying-unit earning side (S03 §2). Not USD 1, not subscription plans. Trial eligibility/allowance is 3–5 units; there is **no universal five-unit default** (S03 §3).
6. **Customer protection:** exhaustion blocks new Circle starts while existing Circles may finish; earned Rewards and history are preserved, and legitimate redemption cannot be blocked merely by commercial standing (S03 §§4–7; DEC-LOY-011/PRD06 referenced there). Detailed exception wording remains subject to PRD06/legal review.
7. **Administration:** Founder sole Platform Administrator in S03 §9, but that authority does not create a public Operator Console or launch readiness.
8. **Currency:** USD 2 **equivalent** is approved; local BIF/RWF amounts, payment instructions, taxes and public price display require current controlled launch evidence. No prices in local currency are inferred (S03 §14; S08).
9. **Legacy conflicts:** S08 subscription-first body is explicitly superseded; the supplied older Product Definition's subscription tiers, automatically approved owner transactions, advanced capabilities and alternatives must not be lifted into public copy without current decision corroboration.

## 3. Application and public-route boundary

**Source:** S14 (`apps/web/src/App.tsx`, audited main). Root `/` renders `RootEntry` (sign-in/resolver), **not an evidenced marketing home page**. Authenticated routes include `/customer/*`, `/business`, `/business/new`, `/business/:businessId`, `/business/:businessId/dashboard/*`, `/profile`, `/auth/mfa/enroll`, `/invitations/:invitationReference/accept`. These use `RequireAuthenticatedUser`; a public CTA must not bypass authentication or authorize access.

Developer/test routes are separately gated: `/dev/phone-auth-harness`, `/dev/sign-in-preview`, `/dev/dashboard-harness/*` require DEV; `/dev/founder-qa-sign-in` is gated by exact mode, project ID and explicit flag. Never link these from a public site.

No approved public marketing sitemap, public demo scheduler, contact endpoint, public pricing page, or public pilot admission route was established by this bounded route inspection. **Not established does not mean nonexistent**: review other frontend entrypoints, hosting rewrites and open branches before declaring absence. Marketing routes must remain separate from customer app, business onboarding, staff counter and operator administration.

## 4. Prototype, preview and capability distinctions

- **Frozen app reference:** `Fkenogo/11thonus-prototype` SHA `18e8d700f505beefe46d324f6ea33f20a670abe7` (S10). It is not a public-site design reference or product authority.
- **Prototype-only:** scripted demos, operator/redeemer scenarios, role impersonation switcher, mobile frame simulator, experimental privacy flag, operator sub-role types, simulated commercial standing, USD 1 sample rate and five-unit sample trial (S10 §§4–6; S03 §11). Prohibit any claim that these screens are available to customers.
- **October 2 implementation snapshot:** S11 describes real server-side capabilities but important frontend gaps (customer QR/progress, redemption UI, operator UI, counter); S12 documents a deterministic local Founder Preview with sample personas and data. Some gaps may have changed after that date: re-audit current code and newer assembly reports before asserting current status.
- A local seeded preview, emulator, internal service or authenticated feature is **not evidence of public launch**.

## 5. Public claim register

Legend: **S** = supported as governed product description (not live availability); **V** = verify implementation/legal/public use; **P** = proposed direction requiring Founder decision; **X** = prohibited or deferred. *Exact candidate claim* is review material, **not approved public copy**.

| ID | Exact candidate claim | Source | Status | Publication condition / owner |
|---|---|---|---|---|
| CL-01 | "11thONUS is a customer-verified loyalty platform." | S01 Art.1; S02 DEC-PROD-001 | S | Founder approves public phrasing |
| CL-02 | "Businesses record qualifying purchases. Customers verify them before they count toward loyalty progress." | S05 §§2–3; S06 §§2–4 | S | Confirm user-facing state language; Product Lead |
| CL-03 | "Ten verified qualifying units earn an On Us reward under the programme rules." | S05; S03 §2 | S/V | Validate exact reward and redemption exceptions; Product Lead |
| CL-04 | "Businesses define what qualifies and what they reward." | S01; S05 | S/V | Verify permitted item/reward constraints; Product Lead |
| CL-05 | "Customers can review and dispute a purchase record." | S06; S11 | V | Confirm currently functional participant path and dispute outcomes; Engineering/Product |
| CL-06 | "Earned rewards are protected when a business runs out of commercial credit." | S03 §§4–7 | S/V | Review legal/customer exceptions before final copy; Founder/Legal |
| CL-07 | "Business usage is billed at USD 2 equivalent per completed earning unit." | S03 §2 | S/V | Approve public pricing structure, local prices and tax treatment; Founder/Commercial |
| CL-08 | "New businesses receive five free units." | S03 §3 | X | Contradicts non-default 3–5 governed range; never publish as blanket offer |
| CL-09 | "Plans start at USD 1." | S03 §§2,11; S08 | X | Superseded prototype/candidate number |
| CL-10 | "Choose Starter, Growth or Professional subscriptions." | S03 §2; S08 | X | Subscription tiers deferred |
| CL-11 | "Customize the number of purchases needed for a reward." | S05; S03 §2 | X | Ten-unit earning threshold fixed |
| CL-12 | "Sign up now and launch your loyalty programme today." | S11; S14 | V | Requires actual production readiness and authorized public entry |
| CL-13 | "Book a demo / Join our pilot." | No verified route/approval | P | Founder approves pilot intake, destination, availability and support |
| CL-14 | "Our platform increases repeat visits by 30%." | No evidence | X | Only publish independently evidenced, approved measured outcomes |
| CL-15 | "Works with any POS and WhatsApp automatically." | No inspected integration proof | X | Verify integration and current rollout before any narrow claim |
| CL-16 | "Customers can see their verified progress and earned rewards." | S05; S11 | V | Confirm current customer-facing UI and live read endpoints; Engineering |
| CL-17 | "Every 11th. On Us." | S04 §2.3; S07 §1.1 | V | Brand approval and exact tagline hierarchy required |
| CL-18 | "One More Reason to Come Back." | Website kickoff brief §5 | P | Founder/brand authority must confirm approval and use |
| CL-19 | "Our website and app are available in English and French." | S10 language findings; web i18n evidence | V | Check actual public content, translation parity and language release scope |
| CL-20 | "Your purchases and identity are fully secure and fraud-proof." | Not supported | X | Never guarantee security/fraud prevention; Legal/Security review |
| CL-21 | "11thONUS is live in Burundi and Rwanda." | S04 launch direction; S03 context | V | Operational deployment and admission evidence required |
| CL-22 | "Pay for purchases with 11thONUS." | S06; S02 product payment boundary | X | Platform records qualifying purchases; no consumer purchase-payment processing authority |
| CL-23 | "Scan your QR at the counter." | S10; S11 | V | Backend QR reference does not prove released camera scanning |
| CL-24 | "The app supports multiple branches and advanced analytics." | Legacy roadmap; S11 | X | Deferred/unsupported for publication until governed and validated |

## 6. Gaps, conflicts and escalation

1. **Brand authority missing:** inspect approved logo assets, colors, typography and sign-off on `Every 11th. On Us.` versus `One More Reason to Come Back.`; retain both as proposals until resolved.
2. **Recent engineering state incomplete:** inspect post-Oct-2 PRs/commits, current customer and staff routes/components, callable exports and latest test evidence; do not rely on S11 as current capability proof.
3. **Launch state unresolved:** pilot scope and admissions, legal terms/privacy, operational support, hosting/release and production deployment not proven.
4. **Currency and payment presentation:** local conversion and actual settlement method require separate controlled public-use evidence. S03 grants manual administration but does not authorize a public payment flow.
5. **Source sweep not exhaustive:** complete PRD06 (redemption), PRD03, registration/identity, TRD privacy/security, full decision register statuses, logos/assets, route/hosting rewrites, current programme, and alternative website branches.
6. **Commercial-design metadata ambiguity:** S13 reports pending merge review despite appearing at audited main. Resolve authoritative status by PR/merge verification; do not claim its detailed design is independently Founder-approved on metadata alone.
7. **Language:** EN/FR app translation implementation does not establish published bilingual website copy.
8. **Website analytics/consent/SEO:** no vendor or lawful data collection use is authorized by this audit.

## 7. Founder decision list — only after evidence closure

- **FD-WEB-01:** Confirm approved public tagline/hero message (after brand evidence scan).
- **FD-WEB-02:** Approve appropriate launch CTA and authorized pilot/contact or signup destination (after route and readiness proof).
- **FD-WEB-03:** Approve whether/how USD 2 equivalent and trial range are displayed publicly (after commercial/legal/local currency work).
- **FD-WEB-04:** Approve website scope and phased launch markets/languages only if existing records cannot settle these.
- **FD-WEB-05:** Review Phase A full claim register before authorizing WEB-01.

No Founder question is raised for already confirmed fixed 10+1 or USD 2 rule.

## 8. Decision history, variance and gate

- 2026-10-08: Phase A audit created from observed repository sources; no new Founder decisions, no published copy, no UI and no deployment.
- **Phase A gate: OPEN — review draft, NOT APPROVED.** Complete outstanding detailed audit work before requesting gate approval. Phase B WEB-01, WEB-02 onward, marketing-site Experience Reference and website implementation are **not authorized** by this record.
- **Implementation variance list:** Not applicable; no implementation performed.

## 9. Execution/reporting

Files: this new source audit plus an additive audit change-tracking record. Commands: connected GitHub commit search, repository code search, content reads, branch/file/PR operations. Dependencies: none. Configuration: none. Application code: none. Risks: source coverage and current release evidence gaps above. Rollback: close the unmerged PR and delete the isolated documentation branch; main remains unchanged.


## 10. Additional verification pass — 2026-10-08 (Founder-directed continuation)

This pass extends the first audit without claiming Phase A complete or authorizing Phase B. Repository search of recently updated PRs identified **material post-October-2 experience work**, including [PR #300 — Customer Identity & Circle](https://github.com/Fkenogo/11THONUS/pull/300), [PR #304 — Business Review domain foundation](https://github.com/Fkenogo/11THONUS/pull/304), [PR #306 — Staff Counter design](https://github.com/Fkenogo/11THONUS/pull/306), and [PR #307 — Staff Counter implementation, Founder Preview pending](https://github.com/Fkenogo/11THONUS/pull/307). These are evidence that the October 2 gap inventory is no longer sufficient to characterize the current experience. **PR existence/title is not proof of merge, production availability, review acceptance or tested deployment.** Claim CL-16 and CL-23 remain VERIFY until exact merged status, callable/UI contracts and founder preview evidence are checked.

Brand text check: `docs/01-product/prd/00-product-foundation.md` §§2.3–2.5 gives **“Every 11th. On Us.”** as Core Brand Promise and “This one's on us.” as supporting language; it positions the platform as loyalty and appreciation, not coupons/discounts/points. This is PRD text marked draft for review, subordinate to the Constitution and decisions. **“One More Reason to Come Back.”** has not been established as approved public tagline by the inspected governing record. The future marketing strategy should not silently swap one for the other. Graphic artwork/font/color approval still needs asset inspection.

The commercial report `11THONUS-COMMERCIAL-DESIGN-001` at current default-branch path has stale-sounding metadata (“pending final Founder merge review”) although it is fetchable on main; evaluate authority by merge record / later amendments rather than trusting the header alone. The controlling USD 2 and 3–5 trial rules remain S03.

**Continuing gate:** Phase A stays open. This additional check specifically strengthens the evidence map, but full brand asset inventory, full legal/privacy and redemption review, current code-to-feature proof, deployment validation, and website-related PR reconciliation remain required for a final Gate A recommendation.
