> **Title:** DEC-LEGAL-002 Terms Content Architecture
> **Version:** 1.0 · **Status:** Proposed structure for counsel review — headings only, no legal clauses, no placeholder legal values · **Classification:** Working (governance record — decision preparation)
> **Governing document:** [Decision Register](../decision-register.md)
> **Source-of-truth path:** `docs/00-governance/decisions/evidence/DEC-LEGAL-002-PREP-001-terms-content-architecture-2026-08-29.md`
> **Date:** 2026-08-29 (v1.0) · **Updated:** 2026-08-29 (v2.0, `DEC-LEGAL-002-FOUNDER-DISP-001` — headings below annotated with Founder-approved product positions FD-2, FD-3, FD-5–FD-7 where applicable; v3.0, same task — `DEC-LOY-011` resolution folded into "Reward obligations") · **Task:** `DEC-LEGAL-002-PREP-001` / `DEC-LEGAL-002-FOUNDER-DISP-001`

# DEC-LEGAL-002 Terms Content Architecture

This document proposes a **content structure** — headings and their rationale, not legal text — for counsel and the Founder to review. No clause is drafted; no value is filled in.

---

## Phase E — Terms Instrument Model

### Does DEC-LEGAL-002 require one instrument or multiple?

Based on the current product model, **multiple related instruments** is the cleaner structure, for the same reason the product itself is structured this way: the platform has one relationship with businesses (paying subscribers) and a different relationship with customers (non-paying participants, per `DEC-PROD-004`), and each business separately owns its own Reward Program content. Recommended structure for counsel to review, not decided here:

1. **Business Terms / Participating Business Agreement** — platform-wide, governs the 11thONUS–business relationship, including the subscription relationship (`DEC-LEGAL-002` scope confirmed in the Founder Decision Sheet Phase F).
2. **Customer/Participant Terms** — platform-wide, governs the 11thONUS–customer relationship (participation, data, platform-level rights/obligations) — distinct from any individual business's Reward Program rules.
3. **Reward Program terms** — created and controlled by each participating business, for its own programme. Not a platform-wide instrument; the platform's role (if any) is limited to whatever minimum disclosure/consistency requirements the Business Terms impose on a business when it publishes its programme (an open product question — see Business Obligation Matrix "Programme publication").
4. **Separate commercial/service terms** — not currently supported by the product model as a distinct instrument beyond what's captured in the Business Terms' subscription-terms section; no separate commercial-terms surface was found in the sources reviewed.

**Distinguishing:**
- **Platform-wide terms:** (1) and (2) above.
- **Business-specific Reward Program rules:** (3) above — business-authored, not platform-authored.
- **Operational policies:** not separately identified as a distinct instrument in current authority; if counsel determines an Acceptable Use Policy or similar is needed, it would sit alongside (1)/(2), not replace them.
- **Privacy matters:** governed elsewhere, under `DEC-LEGAL-001` (Burundi privacy framework) — explicitly out of `DEC-LEGAL-002`'s scope and not duplicated here.

This is a **recommendation for counsel to review**, not a decided legal structure.

---

## Phase J — Proposed Content Architecture (headings only)

### Business Terms

- Parties / relationship (11thONUS and the participating business; nature of the relationship per counsel's answer to Legal Counsel Question Set item 1)
- Platform service (what 11thONUS provides — per [Product & Legal Decision Brief](DEC-LEGAL-002-PREP-001-product-legal-decision-brief-2026-08-29.md) §B.1)
- Business eligibility (registration, onboarding, verification — reflecting the existing Capability 3 flow)
- Account authority (owner/staff roles — reflecting Capability 3's identity/permission model)
- Reward Program responsibility (the business owns its programme design and content; publication itself remains open — see Business Obligation Matrix "Programme publication"; prospective-only change now Founder-positioned per FD-5, below)
- Transaction recording (purchase recording via Commerce Knowledge categories, Verified Units)
- Reward obligations — **Founder position recorded (FD-2, FD-3, 2026-08-29; `DEC-LOY-011` resolved 2026-08-29):** a Business's obligation to honour rewards validly earned survives its own suspension and exit, subject to the applicable Reward Program terms and any legally-impossible-fulfilment exception; 11thONUS is not the guarantor/fulfiller. During suspension specifically, redemption is available by default, subject to governed exceptions (fraud, security/integrity, legal/regulatory, disputed validity, or another governed exception) — commercial-relationship/subscription-status suspension alone does not block redemption. Legal wording, exceptions, and remedies pending counsel's answers to Legal Counsel Question Set items 5, 7.
- Prohibited conduct (fraud/abuse — pending Founder product position; see Business Obligation Matrix "Fraud/abuse")
- Disputes/corrections (pending Founder position + counsel's answer to Legal Counsel Question Set item 8)
- Suspension/termination — **Founder position recorded (FD-3, FD-4, 2026-08-29):** 11thONUS may suspend/restrict a Business for governed trust, security, integrity, or compliance reasons; a Business's exit does not automatically extinguish earned rewards; neither transfers reward-obligation responsibility to 11thONUS. Grounds/notice/process/reinstatement pending counsel's answers to items 7, 18.
- Programme changes — **Founder position recorded (FD-5, 2026-08-29):** prospective changes only; no retrospective removal or material reduction of an already-earned reward. Notice/timing/exceptions pending counsel's answer to item 6.
- Data/privacy references (cross-reference to `DEC-LEGAL-001` instrument; not duplicated here)
- Fees/commercial provisions — **only if currently applicable.** `DEC-PROD-004` confirms businesses pay; the specific plan/pricing values remain `OPEN_FOUNDER` (`DEC-SUB-*`). **Founder position recorded (FD-7, 2026-08-29):** general/structural subscription-terms content (parties, billing-cycle mechanics, cancellation rights, changes-to-terms) may be drafted now; no price, plan name, staff limit, trial structure, complimentary/pilot plan, proration, grace period, billing-ownership, or tiering value may populate it until the relevant `DEC-SUB-*` items are confirmed. See Legal Counsel Question Set item 20.
- Liability (pending counsel's answers to Legal Counsel Question Set items 9–11, 19; no exclusion proposed here)
- Governing law / disputes (pending counsel's answers to items 12–13)
- Changes to Terms (pending counsel's answer to item 15, and consistency with the implemented reacceptance-on-version-change behavior — see Phase G below)
- Electronic acceptance (reflecting the implemented acceptance mechanism — see Phase G below; pending counsel's answer to item 3)

### Customer Terms

Prepared only where the current product model establishes the need — i.e., where a direct 11thONUS–customer relationship exists independent of any specific business's Reward Program:

- Parties / relationship (pending counsel's answer to Legal Counsel Question Set item 2 — whether a direct Customer Terms relationship is even required)
- Platform service description (participation mechanism, Verified Units, non-payment per `DEC-PROD-004`)
- Data recorded (purchase/loyalty progress — cross-reference to `DEC-LEGAL-001` for privacy specifics)
- Reward mechanics at the platform level (Verified Units, Loyalty Cycles, completed Rewards — the platform-governed mechanics only; individual Reward Program content is the business's, not the platform's, to disclose). **Founder position recorded (FD-6, 2026-08-29):** rewards are not money/stored cash value held by 11thONUS and carry no general cash-withdrawal entitlement — this characterisation, once confirmed by counsel (item 19), belongs here.
- Redemption (platform-level framing of the "shared responsibility" principle; procedural detail is a `PRODUCT DECISION REQUIRED` item — see Business Obligation Matrix)
- Programme-change disclosure — **Founder position recorded (FD-5, 2026-08-29):** prospective-only changes, no retrospective removal/reduction of earned rewards; disclosure wording pending counsel's answer to item 6
- Disputes (pending counsel's answer to item 8, and whether it differs from the Business Terms' dispute mechanism per item 17)
- Changes to Terms
- Electronic acceptance (if customer-level acceptance is determined to be required — currently only business-owner acceptance is implemented; see Phase G)

**These are content architecture headings, not approved legal clauses, and not all headings are certain to survive counsel's review of items 1–2.**

---

## Phase G — Current Terms Implementation Contract (existing technical capability, not legal/governance values)

This section documents what is **built**, strictly separating existing technical capability from legal/governance values not yet authorized. Nothing here is a legal conclusion or a Terms value.

- **How Terms versions are represented:** a single current-version pointer, stored as a Firestore document `platformConfig/businessTerms`, field `currentVersion` (string). No client write path exists for this document — it can only be set by direct server-side/Admin-SDK action, bypassing `firestore.rules`. It replaced an earlier `process.env.BUSINESS_TERMS_CURRENT_VERSION` mechanism, found in independent review to have a TOCTOU defect (a concurrent version change could not cause a transactional retry).
- **What constitutes the current version:** whatever string value is present in `currentVersion`. There is currently **no such document/value configured in production** — this is the exact condition producing the fail-closed state described below. No version string, "1.0," date, or other placeholder has been configured by this or any prior task.
- **How effective date/content availability is represented:** not represented at all yet beyond the bare version-string pointer — no effective-date field, no content-body field, and no content-availability flag beyond the frontend's own `TERMS_READABLE_CONTENT_AVAILABLE` constant, which is hard-set to reflect "no real content exists" (per [ENG-P3-002-UI-IMP-D report](../../../05-implementation/reports/ENG-P3-002-UI-IMP-D-business-terms-activation-implementation-report-2026-08-26.md) §12, §15).
- **What acceptance records contain:** `{ id, acceptingCustomerIdentityId, businessId, termsVersion, acceptedAt, languageCode, collectionMethod?, createdAt, schemaVersion }` (per [ENG-P3-002A report](../../../05-implementation/reports/ENG-P3-002A-business-onboarding-backend-read-transport-terms-foundation-implementation-report-2026-08-22.md) §7). The record is write-once by construction (no update function exists); there is no `status`/`updatedAt` field, so no Terms-withdrawal flow is governed or built.
- **Whether acceptance records identify Business/user/version/time:** yes — `businessId`, `acceptingCustomerIdentityId`, `termsVersion`, and `acceptedAt` are all present fields.
- **How reacceptance is currently treated:** a previously-accepted-but-now-superseded Terms version collapses to the same "not accepted" state as never having accepted at all — the system requires fresh acceptance of the current version, never treating an old acceptance as still satisfying a new version (per [ENG-P3-002-UI-IMP-D review](../../../05-implementation/reports/eng-p3-002-ui-imp-d-review-report-2026-08-26.md) §5).
- **How `submitBusinessForVerification` checks Terms:** `assertCurrentBusinessTermsAccepted` (in `functions/src/domains/business/services/businessLifecycleCommand.ts`) runs inside the lifecycle mutation's `prepare` step, strictly after the permission check and strictly before the write, reading both the current-version config and the acceptance record within the same Firestore transaction as the lifecycle write — so Firestore's own optimistic-concurrency detection provides the TOCTOU guarantee.
- **Why the system currently fails closed:** a missing config document, or a missing/blank/non-string `currentVersion` value, resolves to `null` — never a fabricated default — and `assertCurrentBusinessTermsAccepted` throws `businessTermsConfigurationUnavailableError()` in that case. Because no such document currently exists in production, every real business's `submitBusinessForVerification` call fails closed today, regardless of onboarding completeness. This is deliberate design, not a bug: the system was built to refuse to invent Terms content or a default version.
- **What minimum configuration engineering will require once legal approval exists:** a single write of a real `currentVersion` string value to `platformConfig/businessTerms`, executed via direct server-side/Admin-SDK action (no client-facing configuration UI exists or is proposed here), once the Founder has approved actual Terms content and a version identifier for it. **This preparation task does not perform that write and recommends none of its contents.**

**Existing technical capability, summarized:** the entire acceptance mechanism (schema, transactional fail-closed gate, frontend Terms-activation surface, reacceptance-on-version-change behavior) is built, tested, and independently re-verified. **Legal/governance values not yet authorized:** any real Terms version identifier, any real Terms content (business obligations, dispute language, platform liability, subscription terms), and any effective date. No placeholder for any of these has been created by this task or exists anywhere in the reviewed sources.
