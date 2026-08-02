> **Title:** FD-IDENTITY-001 — Founder Decision Package
> **Status:** **Recorded.** The Founder countersigned this package's §2 principles and directed its application in task `IDENTITY-ALIGN-001`. The Decision Register entry drafted in §9 has been applied as `DEC-IDENTITY-001`; the §4/§5 amendment text has been applied to `DEC-PROV-004`/`DEC-SEC-001`. No application code was modified.
> **Date:** Prepared 2026-08-01 (`IDENTITY-STRATEGY-001`); recorded 2026-08-01 (`IDENTITY-ALIGN-001`).
> **Classification:** Founder decision record. Full supporting analysis: [Impact Assessment and Migration Plan](FD-IDENTITY-001-impact-assessment-and-migration-plan-2026-08-01.md). Application record: [`IDENTITY-ALIGN-001` Implementation Report](../../../05-implementation/reports/IDENTITY-ALIGN-001-implementation-report-2026-08-01.md).

---

## 1. Purpose and Proposed Decision ID

This package prepares `FD-IDENTITY-001` ("Progressive Trust Identity Strategy") for recording in the Decision Register. No `DEC-AUTH-*`, `DEC-IDENTITY-*`, or `DEC-TRUST-*` prefix exists anywhere in the register today (confirmed by direct search of the live file). This package proposes the ID **`DEC-IDENTITY-001`**, opening a new `Identity`-adjacent-but-distinct category alongside the existing `DEC-ID-*` (Identity) series, reflecting that this is a constitutional architecture decision about the *shape* of identity/auth/trust as separate capabilities — a different class of decision than `DEC-ID-*`'s existing entries (which are specific identity-mechanic questions like loyalty-number portability or phone lookup). The Founder may prefer a different ID; this is a naming recommendation, not a claim of authority to assign one.

## 2. Founder Decision — Constitutional Principles (2026-08-01, verbatim from the Founder's own text)

**Decision authority:** Founder. **Status: proposed for countersign** — recorded here for the Founder's review and confirmation, not yet applied to the Decision Register.

**Decision:** 11thONUS shall separate Authentication, Identity, and Verification into independent capabilities. Verification shall no longer be required for initial participation in the standard 11thONUS loyalty programme. Verification becomes part of the Progressive Trust model.

**Constitutional Principles:**

1. **Identity First.** A customer's 11thONUS identity exists independently of any verification method. The permanent customer identity consists of: Internal Customer ID; Loyalty Number; Customer QR Code. These represent the customer's enduring relationship with 11thONUS.
2. **Authentication is Access.** Authentication only answers "Is this the customer attempting to access the account?" Authentication may use any approved provider including Google, Apple, Email, Phone OTP, Passkeys, and future approved providers. Authentication shall not define customer trust.
3. **Verification Strengthens Identity.** Verification does not create identity. Verification strengthens confidence in existing identity attributes. Examples include phone verification, email verification, future government ID verification, business verification, and address verification. Each increases confidence without redefining the customer identity.
4. **Progressive Trust.** Trust increases through customer behaviour over time. Trust indicators may include verified phone, verified email, account age, purchase history, consistent participation, merchant history, device history, and future verification methods. Trust grows progressively rather than being front-loaded into registration.
5. **Participation Before Verification.** Customers should be able to register, receive a loyalty identity, participate, earn qualifying purchases, and redeem the standard 11th reward without mandatory phone verification. Verification becomes necessary only when additional confidence is appropriate.
6. **Risk-Based Verification.** Verification requirements shall be proportional to the risk of the action. Higher-risk activities may require additional verification — examples include changing account ownership, account recovery, transferring identity, future gift transfers, future wallet functionality, future financial features, and higher-value promotional rewards. Ordinary loyalty participation shall not require elevated trust.
7. **Progressive Value Unlock.** Verification should create customer value rather than customer friction. Customers should experience verification as "unlock additional capabilities" rather than "complete mandatory onboarding."

**Internal capability naming (Founder recommendation, adopted):** the engineering capability implementing Principles 3/4/6 above is internally named **Identity Trust Management (ITM)** — a product-oriented, customer-invisible name reflecting that the platform manages how trust evolves throughout the customer relationship, rather than treating trust as a one-time registration event. "Progressive Trust" remains the correct name for the Founder's own constitutional principle (Principle 4, above) and should be used verbatim whenever quoting this decision; **ITM is the internal engineering/capability name only** and must never appear in customer-facing product copy.

## 3. Relationship to Existing Decisions (summary — full detail in the Impact Assessment §4)

This decision **amends** two existing `CONFIRMED` decisions and **does not require amendment** to a third that cross-references them:

- **`DEC-PROV-004`** — its Principle (1), *"the verified mobile phone number is the customer's canonical identity,"* is the exact conflation this decision's Principle 1 corrects. Amendment proposed in §4 below.
- **`DEC-SEC-001`** — its Progressive Phone Verification clause names "reward redemption" as an example of a capability verification may gate — directly contradicted by this decision's Principle 5, which explicitly includes redemption of the standard 11th reward among the capabilities available without mandatory verification. Amendment proposed in §5 below.
- **`DEC-ID-003`** — cross-references "the Progressive Trust Model confirmed under `DEC-PROV-004`" but does not itself state anything this decision contradicts (it governs staff/business permission resolution, a separate domain). No amendment proposed; its cross-reference resolves correctly once `DEC-PROV-004` is amended.
- **`DEC-DATA-007`, `DEC-ID-001`** — no reference to authentication or verification; unaffected. No amendment proposed.

Full reasoning for each: [Impact Assessment §4](FD-IDENTITY-001-impact-assessment-and-migration-plan-2026-08-01.md#4-decision-records-requiring-amendment-not-supersession).

**No decision requires supersession.** See Impact Assessment §5 for why a full supersession (discarding still-valid provider selections, recovery mechanics, and the general progressive-trust shape) would be the wrong-grained correction here, versus the targeted-clause amendments proposed below.

## 4. Proposed Amendment — `DEC-PROV-004`

**If the Founder approves, the following text is proposed to replace `DEC-PROV-004`'s current Final Decision points (1) and (7) only.** Points (2), (3), (4), (5), (6), (8), (9) are unaffected and should remain exactly as currently recorded.

**Current text (point 1):**
> *"The verified mobile phone number is the customer's canonical identity."*

**Proposed replacement:**
> *"The customer's canonical identity is the permanent identity triad established under `DEC-IDENTITY-001` Principle 1 (Internal Customer ID, Loyalty Number, Customer QR Code) — independent of any authentication mechanism or verification method. The phone number is one possible authentication credential and one possible verification signal; it is not, itself, the customer's identity."*

**Current text (point 7):**
> *"Identity trust shall follow a progressive model: Anonymous; Authenticated; Verified."*

**Proposed replacement:**
> *"Identity trust follows the Progressive Trust model confirmed under `DEC-IDENTITY-001`: trust grows continuously through customer behaviour (verified phone, verified email, account age, purchase history, device history, merchant history, and future signals) rather than a fixed three-state ladder. The Anonymous/Authenticated/Verified states named in this decision's original text remain meaningful reference points within that continuous model — Anonymous and Authenticated describe access states (governed by Principle 2, Authentication is Access); Verified describes a trust state reached through the signals above (governed by Principle 4, Progressive Trust) — but are no longer the model's full definition."*

## 5. Proposed Amendment — `DEC-SEC-001`

**If the Founder approves, the following text is proposed to replace one clause within `DEC-SEC-001`'s Final Decision text.** The Authentication Recovery Order, Merchant Assistance, Identity Recovery, and all 8 Identity Recovery Principles are unaffected and should remain exactly as currently recorded.

**Current text:**
> *"Progressive Phone Verification: phone verification is part of establishing customer identity, but it is not a universal onboarding blocker. The platform may progressively request phone verification throughout the customer journey and require it before access to identity-protected capabilities such as reward redemption."*

**Proposed replacement:**
> *"Progressive Phone Verification: phone verification strengthens confidence in a customer's existing identity, per `DEC-IDENTITY-001` Principle 3 — it does not establish that identity. Phone verification is not a universal onboarding blocker and is never required for standard loyalty participation, including registration, earning qualifying purchases, or redeeming the standard 11th reward, per `DEC-IDENTITY-001` Principle 5. The platform may progressively request phone verification, and require it before higher-risk actions proportional to that risk — per `DEC-IDENTITY-001` Principle 6, examples include account-ownership changes, account recovery, identity transfer, and future gift, wallet, or financial features — never ordinary loyalty participation."*

## 6. Constitutional Support Already Present (cite, do not treat as new)

**Platform Constitution CP-007 — Progressive KYC** already states: *"Customers should provide information progressively as trust and value increase. Registration should remain lightweight."* This decision is consistent with, and substantially elaborates, a principle the Founder already established in the constitutional hierarchy — not a new philosophical direction for the platform. Recommended: cite CP-007 explicitly in the recorded Decision Register entry as prior constitutional grounding.

**`DEC-ID-001`** (One portable loyalty identity, pre-register CONFIRMED) already describes the permanent identity triad surviving phone/email changes — the identity model this decision's Principle 1 formalizes was already in force for the loyalty-number/QR mechanics specifically; this decision extends the same logic to the *authentication and verification* layers that sit on top of it.

## 7. Terminology Discipline (flagged for Founder awareness, not requiring a decision)

Three unrelated meanings of "verified"/"verification" already coexist in this repository: purchase verification (`DEC-PROD-002`, Capability 4 "First Verified Purchase"), product branding ("Customer-Verified Loyalty Platform"), and identity verification (this decision). None require renaming — they are each independently well-established — but any Founder-facing or future customer-facing communication about `DEC-IDENTITY-001`/ITM should disambiguate explicitly, since this repository's own documents currently use "verified" for both concepts within the same capability list (Capability 4 sits directly between Capability 2 Identity and Capability 5 Progress in the roadmap). Full detail: [Impact Assessment §3.12](FD-IDENTITY-001-impact-assessment-and-migration-plan-2026-08-01.md#312-terminology-collision-risk-not-a-contradiction-a-communication-risk).

## 8. What Recording This Decision Would Authorize (and What It Would Not)

**Authorizes**, once countersigned:
- The Decision Register amendment text in §4/§5 above being applied to `DEC-PROV-004`/`DEC-SEC-001`.
- A future, separately-scoped task to correct PRD2 §5/§7, TRD12 §12.3/§12.4.1, and Canonical Reference §10 (Impact Assessment §9, Step 3).
- A future, separately-scoped Engineering-Lead task to restructure `CDR-001`'s Capability 2 into Identity/Authentication/ITM (Impact Assessment §9, Step 4).

**Does not authorize**, and requires its own separate task/decision:
- Any application code, schema, or Firestore Rules change.
- Beginning `ENG-P2-001` or any successor work package.
- Resolving `EXT-TECH-001` or `DEC-PROD-012` (both remain independently gating whatever the re-scoped Capability Authorisation Gate ultimately requires).
- Renaming or renumbering any `ENG-P2-*` work package in any tracked document.

## 9. Decision Register Entry — Ready to Record (pending Founder countersign)

The following is drafted in the exact field format this Decision Register already uses for other D1 entries, ready to insert if and when the Founder countersigns:

---

**`DEC-IDENTITY-001` — Progressive Trust Identity Strategy**
- Category: Identity · Status: **CONFIRMED** (pending countersign) · Priority: **D1**
- Decision question: Should Authentication, Identity, and Verification remain conflated (as `DEC-PROV-004`/`DEC-SEC-001` currently frame them), or be separated into independent capabilities, with verification made progressive rather than a mandatory onboarding gate?
- Context: The Capability 2 Resolution Sprint (2026-07-30) confirmed `DEC-PROV-004`/`DEC-SEC-001` with the phone number framed as canonical identity and a coarse three-tier trust model. The Founder subsequently determined this conflates concepts that should remain independently governable and unnecessarily front-loads verification into registration, contrary to the already-established CP-007 (Progressive KYC).
- Options identified: not applicable — Founder-originated constitutional decision, not an engineering-evaluated option set.
- Current confirmed position: **Approved**, per the Final decision below.
- Founder decision required: Countersign · Decision owner: Founder · Required by phase: Phase 2 (precedes `ENG-P2-001`) · Blocks: — (once countersigned, unblocks a corrected `ENG-P2-001`/Authentication/ITM capability design)
- Affected documents: `DEC-PROV-004` (amend, §4); `DEC-SEC-001` (amend, §5); PRD2 §5/§7; TRD12 §12.3/§12.4.1; Canonical Reference §10; `CDR-001` Capability 2 · Affected domains: Identity, Security, Integration
- Source references: Platform Constitution CP-007 (Progressive KYC, pre-existing); `DEC-ID-001` (pre-existing permanent-identity model) · Dependencies: none (this decision is upstream of, not gated by, `EXT-TECH-001`/`DEC-PROD-012`) · Risks if unresolved: `ENG-P2-001` would be designed against a conflated, since-corrected model, requiring rework once corrected later instead of now, while zero implementation exists.
- Final decision: *(the full text in §2 above, recorded verbatim)*. Decision date: 2026-08-01 · Approved by: Founder
- Implementation consequences: amends `DEC-PROV-004`/`DEC-SEC-001` per §4/§5; requires a future, separately-authorized `CDR-001` restructuring (Capability 2 split into Identity/Authentication/ITM) before `ENG-P2-001` or any successor work package may begin; requires a future, separately-authorized governing-document correction pass (PRD2/TRD12/Canonical Reference) · Document corrections required: see Affected documents above — not performed by this recording; each is its own follow-on task per the Migration Sequence in the Impact Assessment §9 · Notes: internal capability name for the Progressive Trust engineering implementation is **Identity Trust Management (ITM)** — never customer-facing (§2 above).

---

## 10. Next Action

This package is ready for Founder review. Recording §9's entry into the live Decision Register, and applying §4/§5's amendment text to `DEC-PROV-004`/`DEC-SEC-001`, are the two mechanical actions that follow Founder countersign — neither has been performed by this task.
